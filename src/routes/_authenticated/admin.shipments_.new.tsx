import {createFileRoute,useNavigate,Link} from '@tanstack/react-router'
import {useServerFn} from '@tanstack/react-start'
import {useQueryClient} from '@tanstack/react-query'
import {useState} from 'react'
import {ArrowLeft,Plus} from 'lucide-react'
import {AdminTitle,useStaff} from '@/components/remitship/admin-shell'
import {Button} from '@/components/ui/button'
import {Input} from '@/components/ui/input'
import {createShipment} from '@/lib/remitship.functions'
import {pageHead,mayManage,shipmentSchema} from '@/lib/remitship'

const fieldsetStyle = {
  marginBottom: '2rem',
  padding: '1.5rem',
  border: '1px solid var(--border)',
  borderRadius: 'var(--radius)',
  background: 'var(--card)'
}

const legendStyle = {
  fontSize: '1.125rem',
  fontWeight: 700,
  padding: '0 0.5rem',
  color: 'var(--foreground)'
}

const formGridStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
  gap: '1.5rem',
  marginTop: '1rem'
}

const labelStyle = {
  display: 'flex',
  flexDirection: 'column' as const,
  gap: '0.5rem',
  fontSize: '0.9375rem',
  fontWeight: 600,
  color: 'var(--foreground)'
}

const inputStyle = {
  padding: '0.75rem 1rem',
  fontSize: '1rem',
  borderRadius: 'var(--radius)',
  border: '1px solid var(--border)'
}

const textareaStyle = {
  ...inputStyle,
  minHeight: '100px',
  fontFamily: 'inherit',
  lineHeight: 1.5,
  resize: 'vertical' as const
}

const selectStyle = {
  ...inputStyle,
  cursor: 'pointer',
  appearance: 'none' as const,
  backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23666' d='M6 9L1 4h10z'/%3E%3C/svg%3E\")",
  backgroundRepeat: 'no-repeat',
  backgroundPosition: 'right 1rem center',
  paddingRight: '2.5rem'
}

const formActionsStyle = {
  display: 'flex',
  gap: '1rem',
  justifyContent: 'flex-end',
  marginTop: '2rem',
  paddingTop: '2rem',
  borderTop: '1px solid var(--border)'
}

export const Route=createFileRoute('/_authenticated/admin/shipments_/new')({head:()=>pageHead('Create Shipment','Register a RemitShip shipment and generate its permanent tracking number.'),component:NewShipment})

function NewShipment(){const staff=useStaff();const create=useServerFn(createShipment);const client=useQueryClient();const navigate=useNavigate();const [error,setError]=useState('');const [busy,setBusy]=useState(false)
 if(!mayManage(staff?.roles??[]))return <div className="empty-state"><h1>Manager access required</h1></div>
 return <><Link to="/admin/shipments" className="text-link" style={{marginBottom: '1rem', display: 'inline-flex', alignItems: 'center', gap: '0.5rem'}}><ArrowLeft size={16}/>All shipments</Link><AdminTitle title="Create shipment" description="Register a new shipment and generate its tracking number."/><form className="admin-form" onSubmit={async e=>{e.preventDefault();setBusy(true);setError('');const fd=new FormData(e.currentTarget);const input={...Object.fromEntries(fd),pieces:Number(fd.get('pieces'))||1,weight_kg:Number(fd.get('weight_kg')),is_demo:false};const valid=shipmentSchema.safeParse(input);if(!valid.success){setError(valid.error.issues.map(i=>`${i.path.join(' ')}: ${i.message}`).join('; '));setBusy(false);return}try{const result=await create({data:valid.data});await client.invalidateQueries({queryKey:['shipments']});navigate({to:'/admin/shipments/$id',params:{id:result.id}})}catch(err){setError(err instanceof Error?err.message:'Unable to save shipment.')}finally{setBusy(false)}}}><fieldset style={fieldsetStyle}><legend style={legendStyle}>Sender</legend><div style={formGridStyle}><label style={labelStyle}>Sender name<Input name="sender_name" required style={inputStyle}/></label><label style={labelStyle}>Sender phone<Input name="sender_phone" type="tel" style={inputStyle}/></label></div></fieldset><fieldset style={fieldsetStyle}><legend style={legendStyle}>Recipient</legend><div style={formGridStyle}><label style={labelStyle}>Recipient name<Input name="recipient_name" required style={inputStyle}/></label><label style={labelStyle}>Recipient phone<Input name="recipient_phone" type="tel" required style={inputStyle}/></label><label style={labelStyle}>Recipient email<Input name="recipient_email" type="email" style={inputStyle}/><small style={{fontWeight:400,color:"var(--muted-foreground)"}}>The customer gets an email each time the package status changes.</small></label></div></fieldset><fieldset style={fieldsetStyle}><legend style={legendStyle}>Journey</legend><div style={formGridStyle}><label style={labelStyle}>Origin city<Input name="origin_city" required style={inputStyle}/></label><label style={labelStyle}>Origin country<Input name="origin_country" required style={inputStyle}/></label><label style={labelStyle}>Destination city<Input name="destination_city" required style={inputStyle}/></label><label style={labelStyle}>Destination country<Input name="destination_country" required style={inputStyle}/></label></div></fieldset><fieldset style={fieldsetStyle}><legend style={legendStyle}>Parcel details</legend><div style={formGridStyle}><label style={labelStyle}>Service type<select name="service_type" style={selectStyle}><option value="standard">Standard</option><option value="express">Express</option><option value="air_freight">Air freight</option><option value="sea_freight">Sea freight</option></select></label><label style={labelStyle}>Weight (kg)<Input name="weight_kg" type="number" min="0.01" step="0.01" required style={inputStyle}/></label><label style={labelStyle}>Parcel description<Input name="parcel_description" style={inputStyle}/></label></div></fieldset>{error&&<p role="alert" style={{padding: '1rem', background: 'rgba(229, 57, 53, 0.1)', border: '1px solid rgba(229, 57, 53, 0.3)', borderRadius: 'var(--radius)', color: 'var(--destructive)', fontSize: '0.9375rem', margin: '1rem 0'}}>{error}</p>}<div style={formActionsStyle}><Button asChild variant="outline"><Link to="/admin/shipments">Cancel</Link></Button><Button disabled={busy} type="submit"><Plus/>{busy?'Creating…':'Create shipment'}</Button></div></form></>}
