import {createFileRoute} from '@tanstack/react-router'
import {useServerFn} from '@tanstack/react-start'
import {useQuery,useQueryClient} from '@tanstack/react-query'
import {AdminTitle,useStaff} from '@/components/remitship/admin-shell'
import {ActionForm,field} from '@/components/remitship/action-form'
import {listStaff,inviteStaff,addStaffRole} from '@/lib/remitship.functions'
import {pageHead,label,roles} from '@/lib/remitship'

export const Route=createFileRoute('/_authenticated/admin/staff')({head:()=>pageHead('Staff & Permissions','Invite RemitShip staff and drivers and manage their roles.'),component:Staff})

type Role=typeof roles[number]
function Staff(){
  const staff=useStaff();const fetch=useServerFn(listStaff);const invite=useServerFn(inviteStaff);const grant=useServerFn(addStaffRole);const client=useQueryClient()
  const q=useQuery({queryKey:['staff-list'],queryFn:()=>fetch(),retry:false,enabled:staff?.roles.includes('super_admin')??false})
  if(!staff?.roles.includes('super_admin'))return <div className="empty-state"><h2>Super Admin access required</h2></div>
  const refresh=()=>client.invalidateQueries({queryKey:['staff-list']})
  const roleOptions=roles.map(r=><option key={r} value={r}>{r==='courier'?'Cargo driver':label(r)}</option>)
  const profiles=q.data?.profiles??[]
  return <><AdminTitle title="Staff & permissions" description="Only invited people can sign in. Drivers see only the packages assigned to them."/>
    <div className="detail-grid two">
      <ActionForm title="Invite staff or cargo driver" description="They receive an email invitation to set their password." submit="Send invitation" onSave={async fd=>{await invite({data:{email:field(fd,'email'),name:field(fd,'name'),role:field(fd,'role') as Role,reason:field(fd,'reason')}});await refresh()}}><label>Full name<input name="name" required/></label><label>Email<input name="email" type="email" required/></label><label>Role<select name="role" defaultValue="courier">{roleOptions}</select></label></ActionForm>
      <ActionForm title="Grant a role" submit="Grant role" onSave={async fd=>{await grant({data:{user_id:field(fd,'user_id'),role:field(fd,'role') as Role,reason:field(fd,'reason')}});await refresh()}}><label>Person<select name="user_id" required>{profiles.map(p=><option key={p.id} value={p.id}>{p.full_name} ({p.email})</option>)}</select></label><label>Role<select name="role">{roleOptions}</select></label></ActionForm>
    </div>
    <section className="panel"><h3>Team</h3>{q.isPending?<p className="panel-note">Loading…</p>:q.error?<p className="form-error">{q.error.message}</p>:<div className="table-scroll"><table><thead><tr><th>Name</th><th>Email</th><th>Roles</th></tr></thead><tbody>{profiles.map(p=><tr key={p.id}><td>{p.full_name}</td><td>{p.email}</td><td>{(q.data?.roles??[]).filter(r=>r.user_id===p.id).map(r=>r.role==='courier'?'Cargo driver':label(r.role)).join(' · ')||'No access'}</td></tr>)}</tbody></table></div>}</section>
  </>
}
