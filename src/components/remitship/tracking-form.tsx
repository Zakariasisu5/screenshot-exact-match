import { useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { ArrowRight, PackageSearch } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { trackingSchema } from '@/lib/remitship'
export function TrackingForm({initial='',demo=false,compact=false}:{initial?:string,demo?:boolean,compact?:boolean}){
 const [number,setNumber]=useState(initial);const [error,setError]=useState('');const navigate=useNavigate()
 return <form className={`tracking-form ${compact?'compact':''}`} onSubmit={e=>{e.preventDefault();const result=trackingSchema.safeParse({tracking:number,demo});if(!result.success){setError(result.error.issues[0]?.message??'Check your tracking number.');return}setError('');navigate({to:'/track',search:{number:result.data.tracking,demo}})}}><div className="tracking-input-wrap"><PackageSearch size={22}/><Input aria-label="Tracking number" placeholder="Enter your tracking number" value={number} onChange={e=>setNumber(e.target.value)} autoComplete="off" required/><Button type="submit">Track shipment <ArrowRight size={18}/></Button></div>{error&&<p className="form-error" role="alert">{error}</p>}</form>
}
