import {useState} from 'react'
import {Eye, EyeOff} from 'lucide-react'
import {Input} from '@/components/ui/input'

export function PasswordInput(props: Omit<React.ComponentProps<typeof Input>, 'type'>) {
  const [show, setShow] = useState(false)
  return (
    <div className="password-field">
      <Input {...props} type={show ? 'text' : 'password'} />
      <button type="button" className="password-toggle" onClick={() => setShow(s => !s)} aria-label={show ? 'Hide password' : 'Show password'} aria-pressed={show}>
        {show ? <EyeOff size={18} /> : <Eye size={18} />}
      </button>
    </div>
  )
}
