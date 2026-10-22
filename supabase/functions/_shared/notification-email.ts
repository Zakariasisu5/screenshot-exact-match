export type ShipmentNotification = {
  event_type: 'shipment_created' | 'status_changed'
  new_status: string
  previous_status: string | null
  recipient_name: string | null
  recipient_email: string | null
  sender_name: string | null
  tracking_number: string
  parcel_description: string | null
  origin_city: string | null
  origin_country: string | null
  destination_city: string | null
  destination_country: string | null
  created_at: string
  event_at: string
  estimated_delivery_at: string | null
  location: string | null
  description: string | null
}

export type NotificationEmailConfig = {
  siteUrl: string
  logoUrl: string
  supportEmail: string
  supportPhone?: string
}

export function isValidEmail(value: string | null): value is string {
  return !!value && value.length <= 254 && !/[\r\n]/.test(value) && /^[^\s<>@]+@[^\s<>@]+\.[^\s<>@]+$/.test(value)
}

const statusCopy: Record<string, { label: string; subject: string; message: string }> = {
  shipment_registered: {
    label: 'Shipment created',
    subject: 'Your package has been registered',
    message: 'Your shipment has been registered successfully and is being processed.'
  },
  pickup_scheduled: {
    label: 'Pickup scheduled',
    subject: 'A pickup has been scheduled',
    message: 'A pickup has been scheduled for your shipment.'
  },
  collected: {
    label: 'Collected',
    subject: 'Your package has been collected',
    message: 'Your package has been collected and is now in our care.'
  },
  at_origin_facility: {
    label: 'At origin facility',
    subject: 'Your package arrived at a facility',
    message: 'Your package has arrived at an origin facility for processing.'
  },
  ready_for_dispatch: {
    label: 'Ready for dispatch',
    subject: 'Your package is ready for dispatch',
    message: 'Your package has been processed and is ready for its next journey.'
  },
  in_transit: {
    label: 'In transit',
    subject: 'Your package is in transit',
    message: 'Your package is on its way to the next destination.'
  },
  arrived_in_destination_country: {
    label: 'Arrived in destination country',
    subject: 'Your package arrived in its destination country',
    message: 'Your package has arrived in its destination country and is being processed.'
  },
  customs_clearance: {
    label: 'Customs clearance',
    subject: 'Your package is being processed by customs',
    message: 'Your package is undergoing customs processing.'
  },
  customs_hold: {
    label: 'Customs review',
    subject: 'Your package is under customs review',
    message: 'Your package is under customs review. Check tracking for verified updates.'
  },
  at_destination_facility: {
    label: 'At destination facility',
    subject: 'Your package arrived at a destination facility',
    message: 'Your package has arrived at a destination facility and is being prepared for delivery.'
  },
  out_for_delivery: {
    label: 'Out for delivery',
    subject: 'Your package is out for delivery',
    message: 'Your package is with the delivery team and is on its way to you.'
  },
  delivery_attempted: {
    label: 'Delivery attempted',
    subject: 'A delivery attempt was made',
    message: 'A delivery attempt was made but could not be completed. Please check tracking for the latest update.'
  },
  delivered: {
    label: 'Delivered',
    subject: 'Your package has been delivered',
    message: 'Your package has been marked as delivered.'
  },
  delayed: {
    label: 'Delayed',
    subject: 'Your shipment has been delayed',
    message: 'Your shipment has been delayed. Check tracking for the latest verified details.'
  },
  cancelled: {
    label: 'Cancelled',
    subject: 'Your shipment has been cancelled',
    message: 'Your shipment has been cancelled.'
  },
  exception: {
    label: 'Shipment update',
    subject: 'There is an update about your shipment',
    message: 'There is an update that may affect your shipment. Check tracking for verified details.'
  },
  returned_to_sender: {
    label: 'Returned to sender',
    subject: 'Your package is being returned to the sender',
    message: 'Your package is being returned to the sender. Check tracking for verified details.'
  }
}

export function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, character => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  })[character] ?? character)
}

function formattedDate(value: string | null): string | null {
  if (!value) return null
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return null
  return new Intl.DateTimeFormat('en', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'UTC' }).format(date)
}

function optionalRow(label: string, value: string | null): string {
  return value ? `<tr><td style="padding:8px 0;color:#536175;font-size:14px">${escapeHtml(label)}</td><td align="right" style="padding:8px 0;color:#10284b;font-size:14px;font-weight:600">${escapeHtml(value)}</td></tr>` : ''
}

export function createNotificationEmail(notification: ShipmentNotification, config: NotificationEmailConfig) {
  if (!/^RS\d{8}$/.test(notification.tracking_number)) throw new Error('Tracking number is invalid')
  if (!isValidEmail(config.supportEmail)) throw new Error('Support email is invalid')
  const copy = statusCopy[notification.new_status] ?? {
    label: notification.new_status.replaceAll('_', ' '),
    subject: 'There is an update about your shipment',
    message: 'There is a new update about your shipment.'
  }
  const siteUrl = new URL(config.siteUrl)
  if (siteUrl.protocol !== 'https:' || siteUrl.username || siteUrl.password || siteUrl.search || siteUrl.hash) {
    throw new Error('Tracking site URL must be a clean HTTPS origin')
  }
  const logoUrl = new URL(config.logoUrl, siteUrl)
  if (logoUrl.protocol !== 'https:' || logoUrl.username || logoUrl.password) throw new Error('Email logo URL must use HTTPS')
  const trackingUrl = new URL('/track', siteUrl)
  trackingUrl.searchParams.set('number', notification.tracking_number)
  trackingUrl.searchParams.set('demo', 'false')
  const subjectPrefix = notification.event_type === 'shipment_created' ? 'Your RemitShip package has been registered' : copy.subject
  const greeting = notification.recipient_name?.trim() ? `Hi ${notification.recipient_name.trim()},` : 'Hello,'
  const statusMessage = copy.message
  const rows = [
    optionalRow('Sender', notification.sender_name),
    optionalRow('From', [notification.origin_city, notification.origin_country].filter(Boolean).join(', ') || null),
    optionalRow('To', [notification.destination_city, notification.destination_country].filter(Boolean).join(', ') || null),
    optionalRow('Package', notification.parcel_description),
    optionalRow('Shipment created', formattedDate(notification.created_at)),
    optionalRow('Latest update', formattedDate(notification.event_at)),
    optionalRow('Estimated delivery', formattedDate(notification.estimated_delivery_at)),
    notification.event_type === 'status_changed' ? optionalRow('Update details', notification.description) : ''
  ].join('')
  const locationRow = notification.location ? optionalRow('Verified location', notification.location) : ''
  const supportPhone = config.supportPhone ? `<div style="margin-top:6px;color:#536175;font-size:13px">${escapeHtml(config.supportPhone)}</div>` : ''
  const subject = `${subjectPrefix} — ${notification.tracking_number}`
  const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHtml(subject)}</title></head><body style="margin:0;background:#f3f5f8;font-family:Arial,Helvetica,sans-serif;color:#14243a"><div style="display:none;max-height:0;overflow:hidden;opacity:0">${escapeHtml(copy.label)} · ${escapeHtml(notification.tracking_number)}</div><table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f3f5f8"><tr><td align="center" style="padding:28px 12px"><table role="presentation" width="600" cellspacing="0" cellpadding="0" style="width:100%;max-width:600px;background:#fff;border:1px solid #e2e7ee;border-radius:8px;overflow:hidden"><tr><td style="padding:24px 28px;border-bottom:1px solid #e8edf2"><img src="${escapeHtml(logoUrl.toString())}" width="220" alt="RemitShip — Global Reach. Local Care." style="display:block;width:220px;max-width:100%;height:auto"></td></tr><tr><td style="padding:30px 28px 14px"><p style="margin:0 0 14px;font-size:16px;line-height:1.6">${escapeHtml(greeting)}</p><h1 style="margin:0 0 12px;color:#10284b;font-size:24px;line-height:1.3">${escapeHtml(copy.label)}</h1><p style="margin:0;color:#536175;font-size:15px;line-height:1.7">${escapeHtml(statusMessage)}</p></td></tr><tr><td style="padding:12px 28px 24px"><div style="padding:16px 18px;background:#f5f7fa;border-left:4px solid #e53935;border-radius:4px"><div style="color:#536175;font-size:12px;font-weight:700;letter-spacing:.08em;text-transform:uppercase">Tracking number</div><div style="margin-top:6px;color:#10284b;font-size:22px;font-weight:700">${escapeHtml(notification.tracking_number)}</div><div style="margin-top:8px;color:#536175;font-size:14px">Current status: <strong style="color:#10284b">${escapeHtml(copy.label)}</strong></div></div><table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-top:16px;border-collapse:collapse">${rows}${locationRow}</table><div style="padding:22px 0 10px;text-align:center"><a href="${escapeHtml(trackingUrl.toString())}" style="display:inline-block;padding:14px 24px;background:#10284b;border-radius:4px;color:#fff;font-size:15px;font-weight:700;text-decoration:none">Track My Package</a></div><p style="margin:10px 0 0;color:#536175;font-size:13px;line-height:1.6">For questions about this shipment, contact <a href="mailto:${escapeHtml(config.supportEmail)}" style="color:#10284b">${escapeHtml(config.supportEmail)}</a>${supportPhone}</p></td></tr><tr><td style="padding:18px 28px;background:#f5f7fa;border-top:1px solid #e8edf2;color:#68768a;font-size:12px;line-height:1.6">This is an automatic shipment notification from RemitShip. Please do not reply to this message. Updates are based on verified information recorded for your shipment.</td></tr></table></td></tr></table></body></html>`

  return { subject, html, trackingUrl: trackingUrl.toString() }
}