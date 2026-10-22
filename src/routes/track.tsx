/* eslint-disable prettier/prettier */
import { createFileRoute, Link } from '@tanstack/react-router'
import { useServerFn } from '@tanstack/react-start'
import { useQuery } from '@tanstack/react-query'
import { 
  PackageSearch, ArrowRight, ArrowDown, MapPin, CheckCircle2, Clock3, ShieldCheck, AlertCircle, 
  Package, Truck, Plane, AlertTriangle, XCircle, ArrowUpRight 
} from 'lucide-react'
import { PublicShell } from '@/components/remitship/public-shell'
import { TrackingForm } from '@/components/remitship/tracking-form'
import { Button } from '@/components/ui/button'
import { trackShipment } from '@/lib/remitship.functions'
import { pageHead, label, dateLabel } from '@/lib/remitship'

export const Route = createFileRoute('/track')({
  validateSearch: (search: Record<string, unknown>) => ({
    number: typeof search['number'] === 'string' ? search['number'] : '',
    demo: search['demo'] === true || search['demo'] === 'true'
  }),
  head: () => pageHead(
    'Track Shipment',
    'Track your RemitShip shipment with verified checkpoints, delivery estimates, and customs updates. No account required.',
    '/track'
  ),
  component: Tracking
})

type ShipmentStatus = string | null

function getStatusCategory(status: ShipmentStatus): 'delivered' | 'in_transit' | 'exception' | 'pending' {
  if (!status) return 'pending'
  if (status === 'delivered') return 'delivered'
  if (['customs_hold', 'exception', 'delivery_attempted', 'returned_to_sender'].includes(status)) return 'exception'
  if (['in_transit', 'out_for_delivery', 'ready_for_dispatch', 'at_destination_facility', 'at_origin_facility'].includes(status)) return 'in_transit'
  return 'pending'
}

function getProgressStages(status: ShipmentStatus, events: Array<{ status: string }> = []) {
  const stages = [
    { key: 'registered', label: 'Registered', icon: Package, statuses: ['shipment_registered', 'pickup_scheduled'] },
    { key: 'collected', label: 'Collected', icon: CheckCircle2, statuses: ['collected'] },
    { key: 'in_transit', label: 'In transit', icon: Plane, statuses: ['at_origin_facility', 'ready_for_dispatch', 'in_transit', 'arrived_in_destination_country'] },
    { key: 'destination', label: 'Destination', icon: MapPin, statuses: ['customs_clearance', 'customs_hold', 'at_destination_facility'] },
    { key: 'out_for_delivery', label: 'Out for delivery', icon: Truck, statuses: ['out_for_delivery', 'delivery_attempted'] },
    { key: 'delivered', label: 'Delivered', icon: CheckCircle2, statuses: ['delivered'] }
  ]

  const eventStatuses = new Set(events.map(e => e.status))
  const currentStage = stages.findIndex(stage => stage.statuses.includes(status || ''))

  return stages.map((stage, index) => {
    const hasVerifiedEvent = stage.statuses.some(s => eventStatuses.has(s))
    const isCurrent = index === currentStage
    const isCompleted = hasVerifiedEvent || index < currentStage
    
    return {
      ...stage,
      status: isCurrent ? 'current' : isCompleted ? 'completed' : 'upcoming'
    }
  })
}

function Tracking() {
  const { number, demo } = Route.useSearch()
  const track = useServerFn(trackShipment)
  const query = useQuery({
    queryKey: ['tracking', number, demo],
    queryFn: () => track({ data: { tracking: number, demo } }),
    enabled: !!number,
    retry: false
  })

  const shipment = query.data?.shipment
  const events = query.data?.events || []
  const value = (key: keyof NonNullable<typeof shipment>) => {
    const v = shipment?.[key]
    return typeof v === 'string' ? v : null
  }

  const status = value('status')
  const statusCategory = getStatusCategory(status)
  const progressStages = getProgressStages(status, events as { status: string }[])
  const isDelivered = status === 'delivered'
  const hasException = statusCategory === 'exception'

  // Find delivery confirmation from events
  const deliveryEvent = events.find(e => e.status === 'delivered' && e.kind === 'verified')

  return (
    <PublicShell>
      <section className="page-title">
        <div className="page-width">
          <div className="eyebrow">EVERY STEP, IN SIGHT</div>
          <h1>Track Your Shipment<span className="text-primary">.</span></h1>
          <p>Enter your tracking number to see your shipment's latest status and delivery progress.</p>
          <TrackingForm key={`${number}-${demo}`} initial={number} demo={demo} />
        </div>
      </section>

      <section className="page-width tracking-results">
        {demo && (
          <div className="demo-notice">
            <AlertCircle size={18} />
            <span>Development demo — these are sample shipments, not real customer deliveries.</span>
            <Button variant="ghost" asChild>
              <Link to="/track" search={{ number: '', demo: false }}>Exit demo</Link>
            </Button>
          </div>
        )}

        {query.isFetching ? (
          <div className="empty-state">
            <PackageSearch className="loading-icon" />
            <h2>Finding your shipment…</h2>
          </div>
        ) : query.error ? (
          <div className="empty-state">
            <AlertCircle />
            <h2>We couldn't load that shipment</h2>
            <p>{query.error.message}</p>
            <Button onClick={() => query.refetch()}>Try again</Button>
          </div>
        ) : number && !shipment ? (
          <div className="empty-state">
            <PackageSearch />
            <h2>Shipment not found</h2>
            <p>We couldn't find a shipment associated with that tracking number. Please check the number and try again.</p>
            <div style={{ marginTop: '1.5rem', display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'center' }}>
              <Button variant="outline" asChild>
                <Link to="/track" search={{ number: '', demo: false }}>Search again</Link>
              </Button>
              <Button variant="ghost" asChild>
                <Link to="/contact">Contact support <ArrowRight size={16} /></Link>
              </Button>
            </div>
          </div>
        ) : shipment ? (
          <>
            {/* Shipment Header */}
            <div className="tracking-result-header">
              <div>
                <div className="eyebrow">TRACKING NUMBER</div>
                <h2>{value('tracking_number')}</h2>
              </div>
              <span className={`status-badge ${statusCategory === 'delivered' ? 'success' : ''}`}>
                {isDelivered ? <CheckCircle2 size={16} /> : hasException ? <AlertTriangle size={16} /> : <PackageSearch size={16} />}
                {' '}{label(status)}
              </span>
            </div>

            {/* Status Message */}
            {isDelivered && (
              <div style={{ marginBottom: '2rem', padding: '1rem 1.5rem', background: 'oklch(0.6 0.118 184.704 / 10%)', border: '1px solid oklch(0.6 0.118 184.704 / 30%)', borderRadius: 'var(--radius-lg)', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <CheckCircle2 size={20} style={{ color: 'oklch(0.3 0.118 184)', flexShrink: 0 }} />
                <p style={{ margin: 0, fontWeight: 600, color: 'oklch(0.3 0.118 184)' }}>Your package has been delivered</p>
              </div>
            )}

            {hasException && (
              <div style={{ marginBottom: '2rem', padding: '1rem 1.5rem', background: 'oklch(0.828 0.189 84.429 / 10%)', border: '1px solid oklch(0.828 0.189 84.429 / 30%)', borderRadius: 'var(--radius-lg)', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <AlertTriangle size={20} style={{ color: 'oklch(0.5 0.12 84)', flexShrink: 0 }} />
                <div>
                  <p style={{ margin: 0, fontWeight: 600, color: 'oklch(0.4 0.1 84)' }}>
                    {status === 'customs_hold' ? 'Customs clearance in progress' : 
                     status === 'delivery_attempted' ? 'Delivery was attempted' :
                     status === 'returned_to_sender' ? 'Shipment returned to sender' :
                     'Delivery exception'}
                  </p>
                  {status !== 'returned_to_sender' && (
                    <p style={{ margin: '0.25rem 0 0', fontSize: '0.875rem', color: 'var(--muted-foreground)' }}>
                      Check the timeline below for details or <Link to="/contact" style={{ color: 'inherit', textDecoration: 'underline' }}>contact our team</Link>
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Journey Summary */}
            <div className="journey-summary">
              <div>
                <span className="eyebrow">FROM</span>
                <h3>{value('origin_city')}</h3>
                <p>{value('origin_country')}</p>
              </div>
              <div className="journey-line">
                <MapPin className="journey-pin" />
                <span className="journey-track" />
                <ArrowRight className="journey-arrow desktop-arrow" />
                <ArrowDown className="journey-arrow mobile-arrow" />
              </div>
              <div>
                <span className="eyebrow">TO</span>
                <h3>{value('destination_city')}</h3>
                <p>{value('destination_country')}</p>
              </div>
            </div>

            {/* Shipment Details */}
            <div className="shipment-facts">
              <div>
                <Clock3 />
                <section>
                  <span>Estimated delivery</span>
                  <strong>
                    {value('estimated_delivery_at') ? dateLabel(value('estimated_delivery_at')) : 'Not yet available'}
                  </strong>
                  {value('estimated_delivery_at') && !isDelivered && (
                    <small>Estimate only, not a confirmed delivery</small>
                  )}
                </section>
              </div>
              <div>
                <ShieldCheck />
                <section>
                  <span>Customs status</span>
                  <strong>{label(value('customs_status'))}</strong>
                </section>
              </div>
              <div>
                <PackageSearch />
                <section>
                  <span>Last update</span>
                  <strong>{dateLabel(value('last_event_at'))}</strong>
                  <small>Times in your local time zone</small>
                </section>
              </div>
            </div>

            {/* Package Specifications */}
            {(value('service_type') || shipment?.pieces) && (
              <div className="package-specs">
                <h3>Package specifications</h3>
                <div className="specs-grid">
                  {value('service_type') && (
                    <div className="spec-item">
                      <Package size={20} />
                      <section>
                        <span>Service type</span>
                        <strong>{label(value('service_type'))}</strong>
                      </section>
                    </div>
                  )}
                  {shipment?.pieces && (
                    <div className="spec-item">
                      <Package size={20} />
                      <section>
                        <span>Number of pieces</span>
                        <strong>{String(shipment.pieces)}</strong>
                      </section>
                    </div>
                  )}
                </div>
                <p className="privacy-note">
                  Sender and recipient contact details, street addresses, and driver information are private and not displayed on public tracking.
                </p>
              </div>
            )}

            {/* Progress Tracker */}
            {status !== 'returned_to_sender' && (
              <div className="progress-tracker" style={{
                background: 'var(--card)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-lg)',
                padding: '2rem',
                marginBottom: '2rem'
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '2rem'
                }}>
                  <h3 style={{
                    fontSize: '1.5rem',
                    fontWeight: 700,
                    color: 'var(--foreground)',
                    margin: 0
                  }}>Delivery Progress</h3>
                  <span style={{
                    fontSize: '0.875rem',
                    color: 'var(--muted-foreground)',
                    fontWeight: 500
                  }}>
                    {progressStages.filter(s => s.status === 'completed').length} of {progressStages.length} stages
                  </span>
                </div>
                <div className="progress-stages">
                  {progressStages.map((stage, index) => {
                    const Icon = stage.icon
                    return (
                      <div key={stage.key} className={`progress-stage ${stage.status}`}>
                        <div className="progress-stage-icon">
                          <Icon size={20} />
                        </div>
                        <div className="progress-stage-label">
                          <span>{stage.label}</span>
                          {stage.status === 'current' && (
                            <small style={{
                              display: 'block',
                              fontSize: '0.75rem',
                              color: 'var(--brand-red)',
                              marginTop: '0.25rem',
                              fontWeight: 600
                            }}>Current</small>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Delivery Confirmation */}
            {isDelivered && deliveryEvent && (
              <div className="delivery-confirmation">
                <h3>
                  <CheckCircle2 size={24} />
                  Delivery confirmed
                </h3>
                <div className="delivery-details">
                  <div className="delivery-detail">
                    <span>Delivered on</span>
                    <strong>{dateLabel(deliveryEvent.occurred_at)}</strong>
                  </div>
                  {deliveryEvent.location && (
                    <div className="delivery-detail">
                      <span>Location</span>
                      <strong>{[deliveryEvent.location, deliveryEvent.country].filter(Boolean).join(', ')}</strong>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Timeline */}
            <div className="timeline-heading">
              <h2>Shipment journey</h2>
              <span>
                <ShieldCheck size={15} /> Recorded checkpoints
              </span>
            </div>

            {!events.length ? (
              <div className="empty-state">
                <Clock3 />
                <h3>No shipment updates yet</h3>
                <p>Check back after the next recorded checkpoint.</p>
              </div>
            ) : (
              <ol className="timeline">
                {events.map((event, i) => (
                  <li key={`${event.occurred_at}-${i}`} className={event.kind === 'estimate' ? 'estimated' : ''}>
                    <span className="timeline-dot">
                      {event.kind === 'estimate' ? <Clock3 size={15} /> : <CheckCircle2 size={15} />}
                    </span>
                    <div>
                      <time>{dateLabel(event.occurred_at)}</time>
                      <h3>{event.description}</h3>
                      {(event.location || event.country) && (
                        <p>{[event.location, event.country].filter(Boolean).join(', ')}</p>
                      )}
                      <span className="event-tag">
                        {event.kind === 'estimate'
                          ? 'Estimate — not a verified movement'
                          : event.kind === 'customs'
                          ? 'Recorded customs milestone'
                          : 'Verified checkpoint'}
                      </span>
                    </div>
                  </li>
                ))}
              </ol>
            )}
          </>
        ) : (
          <div className="empty-state">
            <PackageSearch />
            <h2>Your shipment. Every step.</h2>
            <p>Enter the tracking number provided with your shipment.</p>
            <p style={{ fontSize: '0.875rem', color: 'var(--muted-foreground)', marginTop: '0.5rem' }}>
              Example: RS26000101
            </p>
            <details className="demo-links">
              <summary>Explore development demo shipments</summary>
              <p>Sample records only. Not real customer shipments.</p>
              {['RS26000101', 'RS26000102', 'RS26000103'].map(n => (
                <Link key={n} to="/track" search={{ number: n, demo: true }}>
                  {n} <ArrowUpRight size={15} />
                </Link>
              ))}
            </details>
          </div>
        )}
      </section>
    </PublicShell>
  )
}
