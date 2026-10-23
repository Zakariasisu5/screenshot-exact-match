import { createServerFn } from '@tanstack/react-start'
import { createClient } from '@supabase/supabase-js'
import { z } from 'zod'
import { requireSupabaseAuth } from '@/integrations/supabase/auth-middleware'
import type { Database } from '@/integrations/supabase/types'
import { trackingSchema, shipmentSchema, eventSchema, publicShipment, mayManage, mayRecord, roles } from './remitship'

export const trackShipment = createServerFn({method:'GET'}).inputValidator((input: unknown) => trackingSchema.parse(input)).handler(async ({data}) => {
  const url = process.env['SUPABASE_URL']; const key = process.env['SUPABASE_PUBLISHABLE_KEY']
  if (!url || !key) throw new Error('Shipment tracking is temporarily unavailable.')
  const client = createClient<Database>(url,key,{auth:{persistSession:false,autoRefreshToken:false},global:{fetch:(input,init)=>{const headers=new Headers(init?.headers); if(key.startsWith('sb_') && headers.get('Authorization')===`Bearer ${key}`)headers.delete('Authorization');headers.set('apikey',key);return fetch(input,{...init,headers})}}})
  const {data:shipment,error}=await client.from('public_tracking_shipments').select('id,tracking_number,status,service_type,origin_city,origin_country,destination_city,destination_country,estimated_delivery_at,customs_status,last_event_at,created_at,is_demo').eq('tracking_number',data.tracking).eq('is_demo',data.demo).maybeSingle()
  if(error) throw new Error('Unable to retrieve tracking information. Please try again.')
  if(!shipment?.id) return null
  const {data:events,error:eventError}=await client.from('public_tracking_events').select('status,location,country,description,kind,occurred_at').eq('shipment_id',shipment.id).order('occurred_at',{ascending:false}).limit(500)
  if(eventError)throw new Error('Unable to retrieve shipment updates.')
  return {shipment:publicShipment(shipment),events:events??[]}
})

async function staffContext(context: {supabase: ReturnType<typeof createClient<Database>>,userId:string}, manager=false, superOnly=false){
  const {data,error}=await context.supabase.from('user_roles').select('role').eq('user_id',context.userId)
  if(error)throw new Error('Unable to verify staff access.')
  const assigned=(data??[]).map(r=>r.role)
  if(!assigned.length || (manager&&!mayManage(assigned)) || (superOnly&&!assigned.includes('super_admin')))throw new Error('You do not have permission for this action. Contact your administrator.')
  return assigned
}
export const staffIdentity=createServerFn({method:'GET'}).middleware([requireSupabaseAuth]).handler(async({context})=>{
  const roles=await staffContext(context);const {data:profile}=await context.supabase.from('staff_profiles').select('full_name,email').eq('id',context.userId).single();return {roles,profile,userId:context.userId}
})
export const listShipments=createServerFn({method:'GET'}).middleware([requireSupabaseAuth]).inputValidator((input:unknown)=>z.object({search:z.string().default(''),status:z.string().default('all'),page:z.number().int().min(0),demo:z.boolean()}).parse(input)).handler(async({data,context})=>{
  await staffContext(context)
  let query=context.supabase.from('shipments').select('id,tracking_number,status,sender_name,recipient_name,origin_city,destination_city,service_type,created_at,is_demo',{count:'exact'}).eq('is_demo',data.demo).order('created_at',{ascending:false})
  if(data.search)query=query.ilike('tracking_number',`%${data.search.replace(/[^a-zA-Z0-9]/g,'')}%`)
  if(data.status!=='all')query=query.eq('status',z.enum(['shipment_registered','pickup_scheduled','collected','at_origin_facility','ready_for_dispatch','in_transit','arrived_in_destination_country','customs_clearance','customs_hold','at_destination_facility','out_for_delivery','delivery_attempted','delivered','delayed','cancelled','exception','returned_to_sender']).parse(data.status))
  const {data:rows,error,count}=await query.range(data.page*20,data.page*20+19);if(error)throw new Error(error.message)
  const {data:stats,error:statsError}=await context.supabase.from('shipments').select('status').eq('is_demo',data.demo).limit(1000)
  if(statsError)throw new Error(statsError.message)
  return {rows:rows??[],count:count??0,stats:{total:stats?.length??0,delivered:stats?.filter(s=>s.status==='delivered').length??0,inTransit:stats?.filter(s=>['in_transit','out_for_delivery','ready_for_dispatch'].includes(s.status)).length??0,attention:stats?.filter(s=>['customs_hold','exception','delivery_attempted'].includes(s.status)).length??0},statsCapped:(stats?.length??0)>=1000}
})
export const getShipment=createServerFn({method:'GET'}).middleware([requireSupabaseAuth]).inputValidator((input:unknown)=>z.object({id:z.string().uuid()}).parse(input)).handler(async({data,context})=>{
 const roles=await staffContext(context)
 const {data:shipment,error}=await context.supabase.from('shipments').select('*').eq('id',data.id).single();if(error)throw new Error('Shipment unavailable or access denied.')
 const [events,legs,customs,pod,transitions,audit]=await Promise.all([context.supabase.from('shipment_events').select('*').eq('shipment_id',data.id).order('occurred_at',{ascending:false}),context.supabase.from('shipment_legs').select('*').eq('shipment_id',data.id).order('leg_sequence'),context.supabase.from('customs_records').select('*').eq('shipment_id',data.id),context.supabase.from('proof_of_delivery').select('*').eq('shipment_id',data.id),context.supabase.from('status_transitions').select('to_status').eq('from_status',shipment.status),roles.includes('super_admin')?context.supabase.from('audit_logs').select('*').eq('record_id',data.id).order('created_at',{ascending:false}).limit(100):Promise.resolve({data:[],error:null})])
 for(const r of [events,legs,customs,pod,transitions,audit])if(r.error)throw new Error(r.error.message)
 const emails=mayManage(roles)?await context.supabase.from('shipment_notification_outbox').select('id,event_type,new_status,delivery_status,provider_status,test_mode,error_message,created_at,sent_at').eq('shipment_id',data.id).order('created_at',{ascending:false}).limit(20):{data:[],error:null}
 return {shipment,events:events.data??[],legs:legs.data??[],customs:customs.data??[],pod:pod.data??[],transitions:transitions.data??[],audit:audit.data??[],emails:emails.error?[]:emails.data??[]}
})
export const createShipment=createServerFn({method:'POST'}).middleware([requireSupabaseAuth]).inputValidator((input:unknown)=>shipmentSchema.parse(input)).handler(async({data,context})=>{
 await staffContext(context,true);const {reason,...input}=data
 const {data:tracking,error:trackingError}=await context.supabase.rpc('generate_tracking_number');if(trackingError||!tracking)throw new Error('Unable to generate tracking number.')
 const {data:shipment,error}=await context.supabase.from('shipments').insert({...input,sender_email:input.sender_email||null,recipient_email:input.recipient_email||null,sender_phone:input.sender_phone||null,recipient_phone:input.recipient_phone||null,parcel_description:input.parcel_description||null,notes_internal:input.notes_internal||null,tracking_number:tracking,created_by:context.userId}).select('id,tracking_number').single();if(error)throw new Error(error.message)
 const {error:eventError}=await context.supabase.rpc('record_shipment_event',{p_shipment_id:shipment.id,p_status:'shipment_registered',p_kind:'internal',p_description:'Shipment registered',p_reason:reason||'New shipment created',p_occurred_at:new Date().toISOString()});if(eventError)throw new Error(`Shipment ${tracking} saved, but its registration event failed: ${eventError.message}`)
 return shipment
})
export const recordEvent=createServerFn({method:'POST'}).middleware([requireSupabaseAuth]).inputValidator((input:unknown)=>eventSchema.parse(input)).handler(async({data,context})=>{
 const assigned=await staffContext(context);if(!mayRecord(assigned,data.status,'verified'))throw new Error('This event is not permitted for your role.')
 const {error}=await context.supabase.rpc('record_shipment_event',{p_shipment_id:data.shipment_id,p_status:data.status,p_description:data.description,p_kind:'verified',p_occurred_at:data.occurred_at,p_reason:data.reason||'Status update',...(data.location?{p_location:data.location}:{}),...(data.country?{p_country:data.country}:{}),...(data.latitude!==undefined?{p_latitude:data.latitude}:{}),...(data.longitude!==undefined?{p_longitude:data.longitude}:{})});if(error)throw new Error(error.message);return {ok:true}
})
export const listShipmentNotifications=createServerFn({method:'GET'}).middleware([requireSupabaseAuth]).handler(async({context})=>{
 const assigned=await staffContext(context);if(!mayManage(assigned))throw new Error('Manager access required.')
 const [rows,...counts]=await Promise.all([
  context.supabase.from('shipment_notification_outbox').select('id,tracking_number,recipient_email,event_type,new_status,previous_status,delivery_status,provider_status,test_mode,attempt_count,provider_message_id,error_message,last_attempt_at,next_retry_at,created_at,sent_at').order('created_at',{ascending:false}).limit(100),
  ...(['queued','processing','sent','failed','permanently_failed'] as const).map(status=>context.supabase.from('shipment_notification_outbox').select('id',{count:'exact',head:true}).eq('delivery_status',status))
 ])
 if(rows.error||counts.some(result=>result.error))throw new Error('Unable to load shipment notifications.')
 const [queued,processing,sent,failed,permanentlyFailed]=counts.map(result=>result.count??0)
 return {rows:rows.data??[],stats:{queued,processing,sent,failed,permanentlyFailed}}
})
export const retryShipmentNotification=createServerFn({method:'POST'}).middleware([requireSupabaseAuth]).inputValidator((input:unknown)=>z.object({notification_id:z.string().uuid()}).parse(input)).handler(async({data,context})=>{
 const assigned=await staffContext(context);if(!mayManage(assigned))throw new Error('Manager access required.')
 const {data:notificationId,error}=await context.supabase.rpc('request_shipment_notification_retry',{p_notification_id:data.notification_id})
 if(error||!notificationId)throw new Error(error?.message??'Unable to retry this notification.')
 return {notification_id:notificationId}
})
export const getNetwork=createServerFn({method:'GET'}).middleware([requireSupabaseAuth]).handler(async({context})=>{
 await staffContext(context);const [couriers,vehicles,facilities]=await Promise.all([context.supabase.from('couriers').select('*').order('name'),context.supabase.from('vehicles').select('*').order('plate'),context.supabase.from('facilities').select('*').order('name')]);for(const r of [couriers,vehicles,facilities])if(r.error)throw new Error(r.error.message);return {couriers:couriers.data??[],vehicles:vehicles.data??[],facilities:facilities.data??[]}
})
const mutationSchema=z.object({shipment_id:z.string().uuid(),kind:z.enum(['assignment','notes','customs','pod','leg']),reason:z.string().trim().min(3),values:z.record(z.string(),z.string())})
export const updateShipment=createServerFn({method:'POST'}).middleware([requireSupabaseAuth]).inputValidator((input:unknown)=>mutationSchema.parse(input)).handler(async({data,context})=>{
 await staffContext(context,data.kind!=='pod');const {data:shipment,error:readError}=await context.supabase.from('shipments').select('id').eq('id',data.shipment_id).single();if(readError||!shipment)throw new Error('Shipment unavailable or access denied.')
 const v=data.values;const client=context.supabase;let error
 if(data.kind==='assignment')({error}=await client.from('shipments').update({assigned_courier_id:v['courier_id']||null,assigned_vehicle_id:v['vehicle_id']||null}).eq('id',data.shipment_id))
 if(data.kind==='notes')({error}=await client.from('shipments').update({notes_internal:v['notes']??''}).eq('id',data.shipment_id))
 if(data.kind==='pod'){
  const delivered=z.string().datetime().parse(v['delivered_at']);const received=z.string().trim().min(1).parse(v['received_by_name']);
  ({error}=await client.from('proof_of_delivery').insert({shipment_id:data.shipment_id,delivered_at:delivered,received_by_name:received,notes:v['notes']??'',recorded_by:context.userId}))
 }
 if(data.kind==='customs'){
  const status=z.enum(['pending','clearance','hold','cleared']).parse(v['status']);
  ({error}=await client.from('customs_records').insert({shipment_id:data.shipment_id,status,hold_reason:v['hold_reason']||null,notes:v['notes']||null,cleared_at:status==='cleared'?z.string().datetime().parse(v['cleared_at']):null,recorded_by:context.userId}));
  if(!error)({error}=await client.from('shipments').update({customs_status:status}).eq('id',data.shipment_id))
 }
 if(data.kind==='leg')({error}=await client.from('shipment_legs').insert({shipment_id:data.shipment_id,leg_sequence:z.coerce.number().int().positive().parse(v['leg_sequence']),origin_facility_id:z.string().uuid().parse(v['origin_facility_id']),destination_facility_id:z.string().uuid().parse(v['destination_facility_id']),transport_mode:z.enum(['road','air','sea','rail']).parse(v['transport_mode']),status:'planned'}))
 if(error)throw new Error(error.message)
 const {error:auditError}=await client.from('audit_logs').insert({table_name:'shipments',record_id:data.shipment_id,action:data.kind,changed_by:context.userId,reason:data.reason,details:data.values});if(auditError)throw new Error('Change saved, but the audit entry failed. Contact your administrator.')
 return {ok:true}
})
export const listStaff=createServerFn({method:'GET'}).middleware([requireSupabaseAuth]).handler(async({context})=>{
 await staffContext(context,false,true);const [profiles,roles]=await Promise.all([context.supabase.from('staff_profiles').select('*').order('full_name'),context.supabase.from('user_roles').select('*')]);if(profiles.error||roles.error)throw new Error('Unable to load staff.');return {profiles:profiles.data??[],roles:roles.data??[]}
})
export const inviteStaff=createServerFn({method:'POST'}).middleware([requireSupabaseAuth]).inputValidator((input:unknown)=>z.object({email:z.string().email(),name:z.string().trim().min(1),role:z.enum(roles),reason:z.string().trim().optional()}).parse(input)).handler(async({data,context})=>{
 await staffContext(context,false,true);const {supabaseAdmin}=await import('@/integrations/supabase/client.server')
 const {data:invite,error}=await supabaseAdmin.auth.admin.inviteUserByEmail(data.email,{data:{full_name:data.name}});if(error||!invite.user)throw new Error(error?.message??'Unable to invite staff.')
 const {error:roleError}=await context.supabase.from('user_roles').insert({user_id:invite.user.id,role:data.role});if(roleError)throw new Error('Invitation sent but role assignment failed.')
 await context.supabase.from('audit_logs').insert({table_name:'user_roles',record_id:invite.user.id,action:'invite_staff',changed_by:context.userId,reason:data.reason||'Team member invited'});return {ok:true}
})
export const addStaffRole=createServerFn({method:'POST'}).middleware([requireSupabaseAuth]).inputValidator((input:unknown)=>z.object({user_id:z.string().uuid(),role:z.enum(roles),reason:z.string().trim().min(3)}).parse(input)).handler(async({data,context})=>{
 await staffContext(context,false,true);const {error}=await context.supabase.from('user_roles').upsert({user_id:data.user_id,role:data.role},{onConflict:'user_id,role'});if(error)throw new Error(error.message)
 await context.supabase.from('audit_logs').insert({table_name:'user_roles',record_id:data.user_id,action:'grant_role',changed_by:context.userId,reason:data.reason});return {ok:true}
})
export const saveNetwork=createServerFn({method:'POST'}).middleware([requireSupabaseAuth]).inputValidator((input:unknown)=>z.object({kind:z.enum(['couriers','vehicles','facilities']),id:z.string().uuid().optional(),reason:z.string().trim().min(3),values:z.record(z.string(),z.string())}).parse(input)).handler(async({data,context})=>{
 await staffContext(context,true);const v=data.values;let error;let recordId=data.id
 if(data.kind==='couriers'){const input={name:z.string().trim().min(1).parse(v['name']),code:z.string().trim().min(1).parse(v['code']),contact_email:v['contact_email']||null,staff_profile_id:v['staff_profile_id']?z.string().uuid().parse(v['staff_profile_id']):null};const result=await (data.id?context.supabase.from('couriers').update(input).eq('id',data.id):context.supabase.from('couriers').insert(input)).select('id').single();error=result.error;recordId=result.data?.id}
 if(data.kind==='vehicles'){const input={plate:z.string().trim().min(1).parse(v['plate']),courier_id:z.string().uuid().parse(v['courier_id']),vehicle_type:v['vehicle_type']||null,status:v['status']||'available'};const result=await(data.id?context.supabase.from('vehicles').update(input).eq('id',data.id):context.supabase.from('vehicles').insert(input)).select('id').single();error=result.error;recordId=result.data?.id}
 if(data.kind==='facilities'){const input={name:z.string().trim().min(1).parse(v['name']),code:z.string().trim().min(1).parse(v['code']),city:z.string().trim().min(1).parse(v['city']),country:z.string().trim().min(1).parse(v['country'])};const result=await(data.id?context.supabase.from('facilities').update(input).eq('id',data.id):context.supabase.from('facilities').insert(input)).select('id').single();error=result.error;recordId=result.data?.id}
 if(error)throw new Error(error.message);await context.supabase.from('audit_logs').insert({table_name:data.kind,record_id:recordId??null,action:data.id?'update':'create',changed_by:context.userId,reason:data.reason,details:data.values});return {ok:true}
})
export const bootstrapFirstAdmin=createServerFn({method:'POST'}).middleware([requireSupabaseAuth]).handler(async({context})=>{
 const {error}=await context.supabase.rpc('bootstrap_first_super_admin',{p_user_id:context.userId});if(error)throw new Error(error.message);return {ok:true}
})
