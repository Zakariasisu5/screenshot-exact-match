import { createFileRoute } from '@tanstack/react-router'
import { useServerFn } from '@tanstack/react-start'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { AlertCircle, Mail, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { AdminTitle, useStaff } from '@/components/remitship/admin-shell'
import { listShipmentNotifications, retryShipmentNotification } from '@/lib/remitship.functions'
import { dateLabel, label, mayManage, pageHead } from '@/lib/remitship'

export const Route = createFileRoute('/_authenticated/admin/notifications')({
  head: () => pageHead('Shipment Notifications', 'Monitor recipient shipment email notifications.'),
  component: Notifications
})

function Notifications() {
  const staff = useStaff()
  const queryClient = useQueryClient()
  const load = useServerFn(listShipmentNotifications)
  const retry = useServerFn(retryShipmentNotification)
  const query = useQuery({ queryKey: ['shipment-notifications'], queryFn: () => load(), retry: false })
  const retryMutation = useMutation({
    mutationFn: (notificationId: string) => retry({ data: { notification_id: notificationId } }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['shipment-notifications'] })
  })

  if (!mayManage(staff?.roles ?? [])) {
    return <div className="empty-state"><h2>Manager access required</h2></div>
  }

  const stats = query.data?.stats
  const rows = query.data?.rows ?? []

  return <>
    <AdminTitle title="Shipment notifications" description="Review queued, accepted, and failed recipient emails." />
    <div className="stat-grid">
      {[
        { title: 'Queued', value: stats?.queued },
        { title: 'Processing', value: stats?.processing },
        { title: 'Accepted by Resend', value: stats?.sent },
        { title: 'Awaiting retry', value: stats?.failed },
        { title: 'Permanently failed', value: stats?.permanentlyFailed }
      ].map(stat => <article key={stat.title}>
        <div><span>{stat.title}</span><Mail size={18} /></div>
        <strong>{stat.value ?? '—'}</strong>
        <small>All live shipments</small>
      </article>)}
    </div>

    <section className="shipment-table-section">
      <div className="table-title"><h2>Recent email activity</h2><span>Latest 100 notifications</span></div>
      {query.isPending ? <div className="empty-state">Loading notifications…</div> : query.error ? <div className="empty-state">
        <AlertCircle /><h3>Unable to load notifications</h3><p>{query.error.message}</p>
        <Button onClick={() => query.refetch()}>Try again</Button>
      </div> : rows.length === 0 ? <div className="empty-state"><Mail /><h3>No shipment notifications yet</h3></div> : <div className="table-scroll">
        <table>
          <thead><tr>
            <th>Recipient</th><th>Tracking</th><th>Event</th><th>Delivery</th><th>Attempts</th><th>Last attempt</th><th>Next retry</th><th>Provider message</th><th>Details</th><th>Action</th>
          </tr></thead>
          <tbody>{rows.map(notification => <tr key={notification.id}>
            <td>{notification.recipient_email ?? 'Missing or invalid email'}{notification.test_mode && <small>Test delivery</small>}</td>
            <td>{notification.tracking_number}</td>
            <td>{notification.event_type === 'shipment_created' ? 'Shipment created' : `${label(notification.previous_status)} → ${label(notification.new_status)}`}</td>
            <td><span className={`status-badge ${notification.delivery_status === 'sent' ? 'success' : notification.delivery_status.includes('failed') ? 'warning' : ''}`}>{label(notification.delivery_status)}</span>{notification.provider_status && <small>{label(notification.provider_status)}</small>}</td>
            <td>{notification.attempt_count}</td>
            <td>{dateLabel(notification.last_attempt_at)}</td>
            <td>{dateLabel(notification.next_retry_at)}</td>
            <td>{notification.provider_message_id ?? '—'}</td>
            <td>{notification.error_message ?? '—'}</td>
            <td>{notification.delivery_status === 'failed' || notification.delivery_status === 'permanently_failed' ? <Button variant="outline" size="sm" onClick={() => retryMutation.mutate(notification.id)} disabled={retryMutation.isPending}><RefreshCw size={16} />Retry</Button> : '—'}</td>
          </tr>)}</tbody>
        </table>
      </div>}
      {retryMutation.error && <p className="form-error" role="alert">{retryMutation.error.message}</p>}
    </section>
  </>
}