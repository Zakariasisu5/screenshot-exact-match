import {Link,Outlet,useNavigate,useRouterState} from '@tanstack/react-router'
import {useServerFn} from '@tanstack/react-start'
import {useQuery,useQueryClient} from '@tanstack/react-query'
import {LayoutDashboard,Package,Network,Users,LogOut,ArrowUpRight,ShieldCheck,Menu,X} from 'lucide-react'
import {useState} from 'react'
import {staffIdentity} from '@/lib/remitship.functions'
import {supabase} from '@/integrations/supabase/client'
import {label} from '@/lib/remitship'
import {Brand} from './public-shell'
import {Button} from '@/components/ui/button'
export function AdminShell(){const identity=useServerFn(staffIdentity);const query=useQuery({queryKey:['staff'],queryFn:()=>identity(),retry:false});const client=useQueryClient();const navigate=useNavigate();const path=useRouterState({select:s=>s.location.pathname});const [open,setOpen]=useState(false)
 const signOut=async()=>{await client.cancelQueries();client.clear();await supabase.auth.signOut();navigate({to:'/auth',replace:true})}
 if(query.isPending)return <div className="empty-state"><ShieldCheck className="loading-icon"/><h2>Verifying staff access…</h2></div>
 if(query.error)return <div className="access-error"><ShieldCheck/><h1>Staff access required</h1><p>{query.error.message}</p><Button onClick={()=>query.refetch()}>Check access again</Button><Button variant="outline" onClick={signOut}>Sign out</Button><Link to="/">Back to website</Link></div>
 const links=[{to:'/admin',icon:LayoutDashboard,label:'Overview'},{to:'/admin/shipments',icon:Package,label:'Shipments'},{to:'/admin/network',icon:Network,label:'Transport network'},{to:'/admin/staff',icon:Users,label:'Staff & permissions'}] as const
 return <div className="admin-app"><aside className={`admin-sidebar ${open?'open':''}`}><Brand/><div className="sidebar-label">OPERATIONS WORKSPACE</div><nav>{links.filter(l=>l.to!=='/admin/staff'||query.data.roles.includes('super_admin')).map(l=><Link key={l.to} to={l.to} className={(l.to==='/admin'?path===l.to:path.startsWith(l.to))?'active':''} onClick={()=>setOpen(false)}><l.icon size={18}/>{l.label}</Link>)}</nav><div className="sidebar-bottom"><Link to="/">Public website <ArrowUpRight size={16}/></Link><Button variant="ghost" onClick={signOut}><LogOut/> Sign out</Button></div></aside><div className="admin-main"><header className="admin-header"><Button variant="ghost" size="icon" className="admin-menu" aria-label="Toggle navigation" onClick={()=>setOpen(!open)}>{open?<X/>:<Menu/>}</Button><span><span className="online-dot"/> RemitShip operations</span><div className="staff-chip"><div className="avatar">{query.data.profile?.full_name?.charAt(0)??'S'}</div><section><strong>{query.data.profile?.full_name??'Staff member'}</strong><small>{query.data.roles.map(label).join(' · ')}</small></section></div></header><div className="admin-content"><Outlet/></div></div></div>
}
export function useStaff(){return useQuery({queryKey:['staff'],queryFn:useServerFn(staffIdentity),retry:false}).data}
export function AdminTitle({title,description,children}:{title:string,description:string,children?:React.ReactNode}){return <div className="admin-title"><div><div className="eyebrow">REMITSHIP OPERATIONS</div><h1>{title}</h1><p>{description}</p></div>{children}</div>}
