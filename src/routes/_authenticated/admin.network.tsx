import {createFileRoute} from '@tanstack/react-router'
import {useServerFn} from '@tanstack/react-start'
import {useQuery,useQueryClient} from '@tanstack/react-query'
import {AdminTitle,useStaff} from '@/components/remitship/admin-shell'
import {ActionForm,field} from '@/components/remitship/action-form'
import {getNetwork,saveNetwork,listStaff} from '@/lib/remitship.functions'
import {pageHead,mayManage,label} from '@/lib/remitship'

export const Route=createFileRoute('/_authenticated/admin/network')({head:()=>pageHead('Transport Network','Manage RemitShip drivers, vehicles and facilities.'),component:Network})

function Network(){
  const staff=useStaff();const manager=mayManage(staff?.roles??[]);const superAdmin=staff?.roles.includes('super_admin')??false
  const fetch=useServerFn(getNetwork);const save=useServerFn(saveNetwork);const fetchStaff=useServerFn(listStaff);const client=useQueryClient()
  const q=useQuery({queryKey:['network'],queryFn:()=>fetch(),retry:false})
  const people=useQuery({queryKey:['staff-list'],queryFn:()=>fetchStaff(),enabled:superAdmin,retry:false})
  const add=(kind:'couriers'|'vehicles'|'facilities',keys:string[])=>async(fd:FormData)=>{await save({data:{kind,reason:field(fd,'reason'),values:Object.fromEntries(keys.map(k=>[k,field(fd,k)]))}});await client.invalidateQueries({queryKey:['network']})}
  if(q.isPending)return <div className="empty-state">Loading network…</div>
  if(q.error)return <div className="empty-state"><h2>Unable to load network</h2><p>{q.error.message}</p></div>
  const {couriers,vehicles,facilities}=q.data
  return <><AdminTitle title="Transport network" description="Drivers, vehicles and hubs that move RemitShip parcels."/>
    <div className="detail-grid">
      <section className="panel"><h3>Drivers & couriers</h3><ul className="plain-list">{couriers.map(c=><li key={c.id}><strong>{c.name}</strong> · {c.code}{c.contact_email&&<small> · {c.contact_email}</small>}{!c.staff_profile_id&&<small> · no portal login</small>}</li>)}</ul></section>
      <section className="panel"><h3>Vehicles</h3><ul className="plain-list">{vehicles.map(v=><li key={v.id}><strong>{v.plate}</strong> · {v.vehicle_type??'Vehicle'} · {label(v.status)} <small>({couriers.find(c=>c.id===v.courier_id)?.name})</small></li>)}</ul></section>
      <section className="panel"><h3>Facilities</h3><ul className="plain-list">{facilities.map(f=><li key={f.id}><strong>{f.code}</strong> · {f.name}, {f.city}, {f.country}</li>)}</ul></section>
    </div>
    {manager&&<div className="detail-grid">
      <ActionForm title="Add driver / courier" description={superAdmin?'Link a portal account so the driver can see assigned packages.':undefined} submit="Add driver" onSave={add('couriers',['name','code','contact_email','staff_profile_id'])}><label>Name<input name="name" required/></label><label>Code<input name="code" required placeholder="e.g. DRV01"/></label><label>Email<input name="contact_email" type="email"/></label>{superAdmin&&<label>Portal account<select name="staff_profile_id"><option value="">None</option>{(people.data?.profiles??[]).map(p=><option key={p.id} value={p.id}>{p.full_name} ({p.email})</option>)}</select></label>}</ActionForm>
      <ActionForm title="Add vehicle" submit="Add vehicle" onSave={add('vehicles',['plate','courier_id','vehicle_type'])}><label>Plate<input name="plate" required/></label><label>Courier<select name="courier_id" required>{couriers.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></label><label>Type<input name="vehicle_type" placeholder="Van"/></label></ActionForm>
      <ActionForm title="Add facility" submit="Add facility" onSave={add('facilities',['name','code','city','country'])}><label>Name<input name="name" required/></label><label>Code<input name="code" required/></label><label>City<input name="city" required/></label><label>Country<input name="country" required/></label></ActionForm>
    </div>}
  </>
}
