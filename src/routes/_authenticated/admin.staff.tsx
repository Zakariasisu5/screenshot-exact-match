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
  const staff=useStaff();const fetch=useServerFn(listStaff);const invite=useServerFn(inviteStaff);const client=useQueryClient()
  const q=useQuery({queryKey:['staff-list'],queryFn:()=>fetch(),retry:false,enabled:staff?.roles.includes('super_admin')??false})
  if(!staff?.roles.includes('super_admin'))return <div className="empty-state"><h2>Super Admin access required</h2></div>
  const refresh=()=>client.invalidateQueries({queryKey:['staff-list']})
  const roleOptions=[<option key="super_admin" value="super_admin">Super Admin</option>,<option key="operations_manager" value="operations_manager">Operations Manager</option>,<option key="courier" value="courier">Cargo Driver</option>]
  const profiles=q.data?.profiles??[]
  return <><AdminTitle title="Team & Drivers" description="Invite team members and drivers to access the operations portal."/>
    <div className="detail-grid">
      <ActionForm title="Invite team member or driver" description="They receive an email to set their password and sign in." submit="Send invitation" onSave={async fd=>{await invite({data:{email:field(fd,'email'),name:field(fd,'name'),role:field(fd,'role') as Role,reason:'Team member invited'}});await refresh()}}><label>Full name<input name="name" required placeholder="John Smith"/></label><label>Email<input name="email" type="email" required placeholder="john@company.com"/></label><label>Role<select name="role" defaultValue="courier">{roleOptions}</select></label></ActionForm>
    </div>
    <section className="panel"><h3>Team members</h3>{q.isPending?<p className="panel-note">Loading…</p>:q.error?<p className="form-error">{q.error.message}</p>:<div className="table-scroll"><table><thead><tr><th>Name</th><th>Email</th><th>Roles</th></tr></thead><tbody>{profiles.map(p=><tr key={p.id}><td>{p.full_name}</td><td>{p.email}</td><td>{(q.data?.roles??[]).filter(r=>r.user_id===p.id).map(r=>r.role==='courier'?'Cargo Driver':label(r.role)).join(' · ')||'No access'}</td></tr>)}</tbody></table></div>}</section>
  </>
}
