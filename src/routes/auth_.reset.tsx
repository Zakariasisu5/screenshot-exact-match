import {createFileRoute,Link} from '@tanstack/react-router'
import {useState} from 'react'
import {supabase} from '@/integrations/supabase/client'
import {PublicShell} from '@/components/remitship/public-shell'
import {Button} from '@/components/ui/button'
import {Input} from '@/components/ui/input'
import {pageHead} from '@/lib/remitship'
export const Route=createFileRoute('/auth_/reset')({head:()=>pageHead('Reset Password','Set a new password for your RemitShip staff account.'),component:Reset})
function Reset(){const [message,setMessage]=useState('');const [busy,setBusy]=useState(false);return <PublicShell><section className="page-width legal-copy"><h1>Set a new password</h1><form onSubmit={async e=>{e.preventDefault();setBusy(true);const password=String(new FormData(e.currentTarget).get('password'));const {error}=await supabase.auth.updateUser({password});setMessage(error?.message??'Your password has been updated.');setBusy(false)}}><label>New password<Input type="password" name="password" minLength={8} required autoComplete="new-password"/></label><Button disabled={busy}>Update password</Button>{message&&<p role="status">{message}</p>}<Link to="/auth">Return to sign in</Link></form></section></PublicShell>}
