import {useState} from 'react'
import {Button} from '@/components/ui/button'

export function ActionForm({title,description,submit,onSave,children}:{title:string,description?:string|undefined,submit:string,onSave:(fd:FormData)=>Promise<unknown>,children:React.ReactNode}){
  const [busy,setBusy]=useState(false);const [error,setError]=useState('');const [done,setDone]=useState('')
  return <form className="panel action-form" onSubmit={async e=>{e.preventDefault();const form=e.currentTarget;setBusy(true);setError('');setDone('');try{await onSave(new FormData(form));form.reset();setDone('Saved and recorded in the audit history.')}catch(err){setError(err instanceof Error?err.message:'Unable to save this change.')}finally{setBusy(false)}}}>
    <h3>{title}</h3>{description&&<p className="panel-note">{description}</p>}
    <div className="form-grid">{children}</div>
    <label>Reason for change<input name="reason" minLength={3} required placeholder="e.g. Confirmed with hub supervisor"/></label>
    {error&&<p role="alert" className="form-error">{error}</p>}{done&&<p role="status" className="notice">{done}</p>}
    <div className="form-actions"><Button type="submit" disabled={busy}>{busy?'Saving…':submit}</Button></div>
  </form>
}
export const field=(fd:FormData,name:string)=>String(fd.get(name)??'').trim()
