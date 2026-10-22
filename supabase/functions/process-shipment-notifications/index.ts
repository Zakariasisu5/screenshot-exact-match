/* eslint-disable prettier/prettier */
import { createClient } from 'npm:@supabase/supabase-js@2'
import { createNotificationEmail, isValidEmail, type ShipmentNotification } from '../_shared/notification-email.ts'

type QueuedNotification = ShipmentNotification & {
  id: string
  attempt_count: number
  attempts_in_cycle: number
}

type WorkerConfig = {
  supabaseUrl: string
  serviceRoleKey: string
  resendApiKey: string
  fromEmail: string
  siteUrl: string
  logoUrl: string
  supportEmail: string
  supportPhone: string | undefined
  testMode: boolean
  testRecipient: string | null
  maxAttempts: number
}

function response(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' }
  })
}

function required(name: string): string {
  const value = Deno.env.get(name)?.trim()
  if (!value) throw new Error(`Missing required Edge Function secret: ${name}`)
  return value
}

function loadConfig(): WorkerConfig {
  const site = new URL(required('PUBLIC_SITE_URL'))
  if (site.protocol !== 'https:' || site.username || site.password || site.search || site.hash) {
    throw new Error('PUBLIC_SITE_URL must be an HTTPS origin without credentials, query, or hash')
  }
  const siteUrl = site.origin
  const logoUrl = new URL(Deno.env.get('EMAIL_LOGO_URL')?.trim() || `${siteUrl}/remitship-logo.png`, siteUrl)
  if (logoUrl.protocol !== 'https:') throw new Error('EMAIL_LOGO_URL must use HTTPS')
  const supportEmail = required('SUPPORT_EMAIL')
  const fromEmail = required('RESEND_FROM_EMAIL')
  if (!isValidEmail(supportEmail) || /[\r\n]/.test(fromEmail)) {
    throw new Error('SUPPORT_EMAIL or RESEND_FROM_EMAIL is invalid')
  }
  const testMode = Deno.env.get('EMAIL_TEST_MODE')?.toLowerCase() !== 'false'
  const testRecipient = Deno.env.get('EMAIL_TEST_RECIPIENT')?.trim() || null
  if (testMode && !isValidEmail(testRecipient)) {
    throw new Error('EMAIL_TEST_RECIPIENT must be valid when EMAIL_TEST_MODE is true')
  }
  const requestedMax = Number(Deno.env.get('NOTIFICATION_MAX_ATTEMPTS') ?? '6')

  return {
    supabaseUrl: required('SUPABASE_URL'),
    serviceRoleKey: required('SUPABASE_SERVICE_ROLE_KEY'),
    resendApiKey: required('RESEND_API_KEY'),
    fromEmail,
    siteUrl,
    logoUrl: logoUrl.toString(),
    supportEmail,
    supportPhone: Deno.env.get('SUPPORT_PHONE')?.trim() || undefined,
    testMode,
    testRecipient,
    maxAttempts: Number.isInteger(requestedMax) ? Math.max(1, Math.min(requestedMax, 10)) : 6
  }
}

function isRetryable(status: number): boolean {
  return status === 408 || status === 409 || status === 429 || status >= 500
}

function retryAt(attemptCount: number): string {
  const delaySeconds = Math.min(60 * 60, 60 * 2 ** Math.max(0, attemptCount - 1))
  return new Date(Date.now() + delaySeconds * 1000).toISOString()
}

Deno.serve(async request => {
  if (request.method !== 'POST') return response({ error: 'Method not allowed' }, 405)

  let config: WorkerConfig
  try {
    config = loadConfig()
  } catch (error) {
    return response({ error: error instanceof Error ? error.message : 'Invalid worker configuration' }, 500)
  }

  if (request.headers.get('authorization') !== `Bearer ${config.serviceRoleKey}`) {
    return response({ error: 'Unauthorized' }, 401)
  }

  const supabase = createClient(config.supabaseUrl, config.serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false }
  })
  const { data: notifications, error: claimError } = await supabase.rpc('claim_shipment_notifications', {
    p_batch_size: 20,
    p_lease_seconds: 180
  })
  if (claimError) return response({ error: 'Unable to claim notification jobs' }, 500)

  const jobs = (notifications ?? []) as QueuedNotification[]
  let sent = 0
  let failed = 0
  let permanentlyFailed = 0

  const processOne = async (notification: QueuedNotification) => {
    let failureMessage: string | null = null
    let retryable = true

    if (!/^RS\d{8}$/.test(notification.tracking_number)) {
      failureMessage = 'Tracking number is invalid'
      retryable = false
    } else if (!isValidEmail(notification.recipient_email)) {
      failureMessage = 'Recipient email is missing or invalid'
      retryable = false
    }

    try {
      if (!failureMessage) {
        const email = createNotificationEmail(notification, {
          siteUrl: config.siteUrl,
          logoUrl: config.logoUrl,
          supportEmail: config.supportEmail,
          supportPhone: config.supportPhone
        })
        const to = config.testMode ? config.testRecipient as string : notification.recipient_email as string
        const responseFromResend = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${config.resendApiKey}`,
            'Content-Type': 'application/json',
            'Idempotency-Key': notification.id
          },
          body: JSON.stringify({
            from: config.fromEmail,
            to: [to],
            reply_to: config.supportEmail,
            tags: [{ name: 'shipment_notification_id', value: notification.id }],
            subject: `${config.testMode ? '[TEST] ' : ''}${email.subject}`,
            html: email.html
          }),
          signal: AbortSignal.timeout(15000)
        })
        const body = await responseFromResend.text()
        if (!responseFromResend.ok) {
          failureMessage = `Resend returned ${responseFromResend.status}: ${body.slice(0, 1500)}`
          retryable = isRetryable(responseFromResend.status)
        } else {
          const result = JSON.parse(body) as { id?: string }
          if (!result.id) throw new Error('Resend response did not include a message ID')
          const { error: updateError, data: updated } = await supabase
            .from('shipment_notification_outbox')
            .update({
              delivery_status: 'sent',
              provider_status: 'accepted',
              test_mode: config.testMode,
              provider_message_id: result.id,
              error_message: null,
              sent_at: new Date().toISOString(),
              next_retry_at: null,
              locked_until: null,
              updated_at: new Date().toISOString()
            })
            .eq('id', notification.id)
            .eq('delivery_status', 'processing')
            .eq('attempt_count', notification.attempt_count)
            .select('id')
            .maybeSingle()
          if (updateError || !updated) throw new Error('Unable to record Resend acceptance')
          sent += 1
          return
        }
      }
    } catch (error) {
      failureMessage = error instanceof Error ? error.message : 'Unexpected email delivery error'
      retryable = true
    }

    const isPermanent = !retryable || notification.attempts_in_cycle >= config.maxAttempts
    const { error: updateError, data: updated } = await supabase
      .from('shipment_notification_outbox')
      .update({
        delivery_status: isPermanent ? 'permanently_failed' : 'failed',
        error_message: failureMessage?.slice(0, 2000) ?? 'Email delivery failed',
        next_retry_at: isPermanent ? null : retryAt(notification.attempts_in_cycle),
        locked_until: null,
        updated_at: new Date().toISOString()
      })
      .eq('id', notification.id)
      .eq('delivery_status', 'processing')
      .eq('attempt_count', notification.attempt_count)
      .select('id')
      .maybeSingle()
    if (updateError || !updated) throw new Error('Unable to record notification delivery failure')
    if (isPermanent) permanentlyFailed += 1
    else failed += 1
  }

  try {
    for (let index = 0; index < jobs.length; index += 2) {
      await Promise.all(jobs.slice(index, index + 2).map(processOne))
    }
  } catch (error) {
    console.error('Shipment notification batch could not be fully recorded', error)
    return response({ claimed: jobs.length, sent, failed, permanentlyFailed, error: 'Unable to record a delivery result' }, 500)
  }

  return response({ claimed: jobs.length, sent, failed, permanentlyFailed, testMode: config.testMode })
})