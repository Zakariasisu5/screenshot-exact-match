import { useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { Input } from '@/components/ui/input'

interface PasswordInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  id?: string
  name?: string
  autoComplete?: string
  minLength?: number
  placeholder?: string
  required?: boolean
  style?: React.CSSProperties
}

export function PasswordInput({ style, ...props }: PasswordInputProps) {
  const [showPassword, setShowPassword] = useState(false)

  return (
    <div style={{ position: 'relative', width: '100%' }}>
      <Input
        {...props}
        type={showPassword ? 'text' : 'password'}
        style={{
          paddingRight: '3rem',
          ...style
        }}
      />
      <button
        type="button"
        onClick={() => setShowPassword(!showPassword)}
        style={{
          position: 'absolute',
          right: '0.75rem',
          top: '50%',
          transform: 'translateY(-50%)',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          padding: '0.5rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--muted-foreground)',
          transition: 'color 0.2s'
        }}
        onMouseEnter={(e) => e.currentTarget.style.color = 'var(--foreground)'}
        onMouseLeave={(e) => e.currentTarget.style.color = 'var(--muted-foreground)'}
        aria-label={showPassword ? 'Hide password' : 'Show password'}
      >
        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
      </button>
    </div>
  )
}
