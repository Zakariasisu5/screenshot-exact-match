import {createFileRoute,Link} from '@tanstack/react-router'
import {useServerFn} from '@tanstack/react-start'
import {useQuery,useQueryClient} from '@tanstack/react-query'
import {ArrowLeft,Phone,Mail,MapPin,AlertCircle} from 'lucide-react'
import {AdminTitle,useStaff} from '@/components/remitship/admin-shell'
import {ActionForm,field} from '@/components/remitship/action-form'
import {Button} from '@/components/ui/button'
import {getShipment,getNetwork,recordEvent,updateShipment} from '@/lib/remitship.functions'
import {label,dateLabel,mayManage,statuses} from '@/lib/remitship'

export const Route=createFileRoute('/_authenticated/admin/shipments_/$id')({head:()=>({meta:[{title:'Shipment Details | RemitShip'},{name:'description',content:'Manage a RemitShip shipment, its location, assignment and delivery record.'},{property:'og:title',content:'Shipment Details | RemitShip'},{property:'og:description',content:'Manage a RemitShip shipment, its location, assignment and delivery record.'},{property:'og:type',content:'website'},{name:'twitter:card',content:'summary'},{name:'robots',content:'noindex'}]}),component:ShipmentDetail})

const courierStatuses=['out_for_delivery','delivery_attempted','delivered']

function ShipmentDetail(){
  const {id}=Route.useParams();const staff=useStaff();const manager=mayManage(staff?.roles??[])
  const fetchShipment=useServerFn(getShipment);const fetchNetwork=useServerFn(getNetwork);const record=useServerFn(recordEvent);const update=useServerFn(updateShipment);const client=useQueryClient()
  const query=useQuery({queryKey:['shipment',id],queryFn:()=>fetchShipment({data:{id}}),retry:false})
  const network=useQuery({queryKey:['network'],queryFn:()=>fetchNetwork(),enabled:manager,retry:false})
  const refresh=()=>Promise.all([client.invalidateQueries({queryKey:['shipment',id]}),client.invalidateQueries({queryKey:['shipments']})])
  if(query.isPending)return <div className="empty-state">Loading shipment…</div>
  if(query.error)return <div className="empty-state"><AlertCircle/><h2>Shipment unavailable</h2><p>{query.error.message}</p><Link to="/admin/shipments" className="text-link">Back to shipments</Link></div>
  const {shipment:s,events,transitions,pod}=query.data
  const next=[...new Set([s.status,...transitions.map(t=>t.to_status)])].filter(x=>manager||courierStatuses.includes(x))
  const couriers=network.data?.couriers??[]
  const save=(kind:'assignment'|'notes'|'pod',keys:string[])=>async(fd:FormData)=>{await update({data:{shipment_id:id,kind,reason:field(fd,'reason')||'Routine update',values:Object.fromEntries(keys.map(k=>{const v=field(fd,k);return [k,(k==='delivered_at')&&v?new Date(v).toISOString():v]}))}});await refresh()}
  const courier=couriers.find(c=>c.id===s.assigned_courier_id)
  return <>
    <Link to="/admin/shipments" className="text-link"><ArrowLeft size={16}/>All shipments</Link>
    <AdminTitle title={s.tracking_number} description={`${s.origin_city}, ${s.origin_country} → ${s.destination_city}, ${s.destination_country} · ${label(s.service_type)}`}><span className={`status-badge ${s.status==='delivered'?'success':''} ${['customs_hold','exception'].includes(s.status)?'warning':''}`}>{label(s.status)}</span>{s.is_demo&&<span className="demo-tag">DEMO</span>}</AdminTitle>
    <div className="detail-grid">
      <section className="panel"><h3>Sender</h3><p><strong>{s.sender_name}</strong></p><Contact phone={s.sender_phone} email={s.sender_email}/></section>
      <section className="panel"><h3>Recipient</h3><p><strong>{s.recipient_name}</strong></p><Contact phone={s.recipient_phone} email={s.recipient_email}/><p className="panel-note">Driver may call recipient for delivery directions.</p></section>
      <section className="panel"><h3>Parcel</h3><dl className="facts"><dt>Weight</dt><dd>{s.weight_kg??'—'} kg</dd><dt>Contents</dt><dd>{s.parcel_description||'—'}</dd><dt>Customs</dt><dd>{label(s.customs_status)}</dd><dt>Last update</dt><dd>{dateLabel(s.last_event_at)}</dd>{manager&&<><dt>Driver</dt><dd>{courier?.name??'Unassigned'}</dd></>}</dl></section>
    </div>
    <div className="detail-grid two">
      {next.length>0&&<ActionForm title="Update location & status" description={manager?'Record shipment checkpoint with customer-facing description.':'Update your assigned package status.'} submit="Record update" onSave={async fd=>{await record({data:{shipment_id:id,status:field(fd,'status') as typeof statuses[number],kind:'verified',location:field(fd,'location'),country:field(fd,'country'),description:field(fd,'description'),reason:field(fd,'reason')||'Status update',occurred_at:new Date(field(fd,'occurred_at')||Date.now()).toISOString()}});await refresh()}}>
        <label>Status<select name="status" defaultValue={s.status} required>{next.map(x=><option key={x} value={x}>{x===s.status?`${label(x)} (current)`:label(x)}</option>)}</select></label>
        <label>City / facility<input name="location" placeholder="e.g. London Hub"/></label>
        <label>Country<input name="country" placeholder="e.g. United Kingdom"/></label>
        <label className="wide">Customer-facing description<input name="description" minLength={3} required placeholder="e.g. Arrived at sorting facility"/></label>
        <label>Time of event<input name="occurred_at" type="datetime-local"/></label>
      </ActionForm>}
      {manager&&<ActionForm title="Assign driver" submit="Save assignment" onSave={save('assignment',['courier_id'])}>
        <label>Driver / courier<select name="courier_id" defaultValue={s.assigned_courier_id??''}><option value="">Unassigned</option>{couriers.map(c=><option key={c.id} value={c.id}>{c.name} ({c.code})</option>)}</select></label>
      </ActionForm>}
      {s.status!=='delivered'&&<ActionForm title="Proof of delivery" description="Required before marking as delivered." submit="Save proof of delivery" onSave={save('pod',['delivered_at','received_by_name','notes'])}>
        <label>Received by<input name="received_by_name" required/></label><label>Delivered at<input name="delivered_at" type="datetime-local" required/></label><label className="wide">Notes<input name="notes"/></label>
      </ActionForm>}
    </div>
    <div className="detail-grid two">
      <section className="panel"><h3>Journey history</h3>{!events.length?<p className="panel-note">No updates yet.</p>:<ol className="timeline">{events.map(e=><li key={e.id}><span className="timeline-dot"/><div><strong>{e.status?label(e.status):'Update'}</strong> <small className="event-tag">{label(e.kind)}</small><p>{e.description}</p><small><MapPin size={12} className="inline-icon"/>{[e.location,e.country].filter(Boolean).join(', ')||'Location not recorded'} · {dateLabel(e.occurred_at)}</small></div></li>)}</ol>}</section>
      <section className="panel"><h3>Delivery confirmation</h3>
        {pod.length>0?pod.map(p=><p key={p.id}>Delivered to <strong>{p.received_by_name}</strong> on {dateLabel(p.delivered_at)}</p>):<p className="panel-note">No delivery record yet.</p>}
      </section>
    </div>
  </>
}
function Contact({phone,email}:{phone:string|null,email:string|null}){return <div className="contact-actions">{phone?<Button asChild variant="outline" size="sm"><a href={`tel:${phone}`}><Phone/>{phone}</a></Button>:<small>No phone on file</small>}{email&&<Button asChild variant="ghost" size="sm"><a href={`mailto:${email}`}><Mail/>{email}</a></Button>}</div>}
