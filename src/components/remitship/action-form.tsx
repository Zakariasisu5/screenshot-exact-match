import {useState} from 'react'
import {Button} from '@/components/ui/button'

const panelStyle = {
  padding: '2rem',
  background: 'var(--card)',
  border: '1px solid var(--border)',
  borderRadius: 'var(--radius-lg)',
  marginBottom: '1.5rem'
}

const formGridStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
  gap: '1.5rem',
  marginBottom: '1.5rem'
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
  border: '1px solid var(--border)',
  borderRadius: 'var(--radius)',
  background: 'var(--background)',
  color: 'var(--foreground)',
  width: '100%',
  fontFamily: 'inherit'
}

const formActionsStyle = {
  display: 'flex',
  gap: '1rem',
  justifyContent: 'flex-end',
  marginTop: '1.5rem'
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

const textareaStyle = {
  ...inputStyle,
  minHeight: '100px',
  lineHeight: 1.5,
  resize: 'vertical' as const
}

export function ActionForm({title,description,submit,onSave,children}:{title:string,description?:string|undefined,submit:string,onSave:(fd:FormData)=>Promise<unknown>,children:React.ReactNode}){
  const [busy,setBusy]=useState(false);const [error,setError]=useState('');const [done,setDone]=useState('')
  
  return <form style={panelStyle} onSubmit={async e=>{e.preventDefault();const form=e.currentTarget;setBusy(true);setError('');setDone('');try{await onSave(new FormData(form));form.reset();setDone('Saved successfully.')}catch(err){setError(err instanceof Error?err.message:'Unable to save this change.')}finally{setBusy(false)}}}>
    <h3 style={{fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.5rem', color: 'var(--foreground)'}}>{title}</h3>
    {description&&<p style={{fontSize: '0.9375rem', color: 'var(--muted-foreground)', marginBottom: '1.5rem', lineHeight: 1.5}}>{description}</p>}
    <div style={formGridStyle} className="action-form-children">{children}</div>
    {error&&<p role="alert" style={{padding: '1rem', background: 'rgba(229, 57, 53, 0.1)', border: '1px solid rgba(229, 57, 53, 0.3)', borderRadius: 'var(--radius)', color: 'var(--destructive)', fontSize: '0.9375rem', margin: '1rem 0'}}>{error}</p>}
    {done&&<p role="status" style={{padding: '1rem', background: 'rgba(76, 175, 80, 0.1)', border: '1px solid rgba(76, 175, 80, 0.3)', borderRadius: 'var(--radius)', color: '#2e7d32', fontSize: '0.9375rem', margin: '1rem 0'}}>{done}</p>}
    <div style={formActionsStyle}><Button type="submit" disabled={busy}>{busy?'Saving…':submit}</Button></div>
    <style>{`
      .action-form-children label { ${Object.entries(labelStyle).map(([k,v])=>`${k.replace(/[A-Z]/g,m=>'-'+m.toLowerCase())}:${v}`).join(';')}; }
      .action-form-children input { ${Object.entries(inputStyle).map(([k,v])=>`${k.replace(/[A-Z]/g,m=>'-'+m.toLowerCase())}:${v}`).join(';')}; }
      .action-form-children select { ${Object.entries(selectStyle).map(([k,v])=>`${k.replace(/[A-Z]/g,m=>'-'+m.toLowerCase())}:${v}`).join(';')}; }
      .action-form-children textarea { ${Object.entries(textareaStyle).map(([k,v])=>`${k.replace(/[A-Z]/g,m=>'-'+m.toLowerCase())}:${v}`).join(';')}; }
      .action-form-children label.wide { grid-column: 1 / -1; }
      .action-form-children input:focus,
      .action-form-children select:focus,
      .action-form-children textarea:focus {
        outline: none;
        border-color: var(--brand-navy);
        box-shadow: 0 0 0 3px rgba(16, 40, 75, 0.1);
      }
    `}</style>
  </form>
}
export const field=(fd:FormData,name:string)=>String(fd.get(name)??'').trim()
