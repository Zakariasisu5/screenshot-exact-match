/* eslint-disable prettier/prettier */
import { createClient } from 'npm:@supabase/supabase-js@2'

function response(status: number) {
  return new Response(status === 200 ? 'ok' : 'invalid webhook', {
    status,
    headers: { 'Content-Type': 'text/plain' }
  })
}

function decodeBase64(value: string): Uint8Array {
  const binary = atob(value)
  return Uint8Array.from(binary, character => character.charCodeAt(0))
}

async function verifySignature(request: Request, body: string, secret: string): Promise<boolean> {
  const id = request.headers.get('svix-id')
  const timestamp = request.headers.get('svix-timestamp')
  const signatures = request.headers.get('svix-signature')
  if (!id || !timestamp || !signatures || !/^\d+$/.test(timestamp)) return false
  if (Math.abs(Date.now() / 1000 - Number(timestamp)) > 300) return false

  const secretBytes = decodeBase64(secret.replace(/^whsec_/, ''))
  const key = await crypto.subtle.importKey('raw', secretBytes, { name: 'HMAC', hash: 'SHA-256' }, false, ['verify'])
  const signedContent = new TextEncoder().encode(`${id}.${timestamp}.${body}`)
  const candidates = signatures.split(' ').map(value => value.split(','))
  for (const [version, signature] of candidates) {
    if (version !== 'v1' || !signature) continue
    try {
      if (await crypto.subtle.verify('HMAC', key, decodeBase64(signature), signedContent)) return true
    } catch {
      continue
    }
  }
  return false
}

Deno.serve(async request => {
  if (request.method !== 'POST') return response(405)

  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  const webhookSecret = Deno.env.get('RESEND_WEBHOOK_SECRET')
  if (!supabaseUrl || !serviceRoleKey || !webhookSecret) return response(500)

  const body = await request.text()
  if (!await verifySignature(request, body, webhookSecret)) return response(401)

  let event: { type?: string; data?: { email_id?: string; tags?: Array<{ name?: string; value?: string }> } }
  try {
    event = JSON.parse(body)
  } catch {
    return response(400)
  }

  const eventId = request.headers.get('svix-id')
  const messageId = event.data?.email_id
  const notificationId = event.data?.tags?.find(tag => tag.name === 'shipment_notification_id')?.value
  if (!eventId || !messageId || !['email.delivered', 'email.bounced', 'email.complained'].includes(event.type ?? '')) {
    return response(400)
  }
  if (!notificationId || !/^[0-9a-f-]{36}$/i.test(notificationId)) return response(200)

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false }
  })
  const { error } = await supabase.rpc('record_resend_notification_webhook', {
    p_provider_event_id: eventId,
    p_event_type: event.type as string,
    p_provider_message_id: messageId,
    p_notification_id: notificationId
  })
  if (error) {
    console.error('Unable to record Resend notification webhook', error.message)
    return response(500)
  }

  return response(200)
})