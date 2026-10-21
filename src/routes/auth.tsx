import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { ArrowRight, ArrowLeft, ShieldCheck, Lock, Mail } from 'lucide-react'
import { supabase } from '@/integrations/supabase/client'
import { Brand, brandIcon } from '@/components/remitship/public-shell'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { PasswordInput } from '@/components/remitship/password-input'
import { pageHead } from '@/lib/remitship'

export const Route = createFileRoute('/auth')({
  head: () => pageHead('Staff Sign In', 'Secure RemitShip staff sign-in for shipment operations and authorized delivery updates.'),
  component: Auth
})

function Auth() {
  const [mode, setMode] = useState<'signin' | 'signup' | 'reset'>('signin')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setBusy(true)
    setError('')
    setNotice('')
    
    const form = new FormData(e.currentTarget)
    const email = String(form.get('email'))
    const password = String(form.get('password') ?? '')
    
    try {
      if (mode === 'reset') {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/auth/reset`
        })
        if (error) throw error
        setNotice('If this email has an account, a reset link has been sent.')
      } else if (mode === 'signup') {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: String(form.get('name')) },
            emailRedirectTo: `${window.location.origin}/auth`
          }
        })
        if (error) throw error
        if (data.session) {
          navigate({ to: '/admin' })
        } else {
          setNotice('Check your email to confirm your account. Your administrator must assign a staff role.')
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
        navigate({ to: '/admin' })
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to sign in.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="auth-page-dhl" style={{
      minHeight: '100vh',
      display: 'grid',
      gridTemplateColumns: window.innerWidth > 1024 ? '1fr 1fr' : '1fr'
    }}>
      {/* Left Panel - Branding */}
      {window.innerWidth > 1024 && (
      <div className="auth-brand-panel" style={{
        background: 'linear-gradient(135deg, #10284B 0%, #1a3a5f 100%)',
        color: 'white',
        padding: '3rem',
        display: 'flex',
        flexDirection: 'column' as const,
        position: 'relative' as const,
        overflow: 'hidden'
      }}>
        <div className="auth-brand-content" style={{
          position: 'relative' as const,
          zIndex: 1,
          maxWidth: '500px',
          margin: '0 auto',
          display: 'flex',
          flexDirection: 'column' as const,
          justifyContent: 'space-between',
          height: '100%'
        }}>
          <div>
            <Brand />
            <h2 style={{fontSize: '2.5rem', fontWeight: 700, marginBottom: '1rem', lineHeight: 1.2}}>Staff Portal</h2>
            <p style={{fontSize: '1.125rem', opacity: 0.9, lineHeight: 1.6, marginBottom: '4rem'}}>
              Secure access for RemitShip operations team and authorized delivery personnel.
            </p>
            
            <div className="auth-features" style={{display: 'flex', flexDirection: 'column' as const, gap: '2rem', marginBottom: '4rem'}}>
              <div className="auth-feature" style={{display: 'flex', gap: '1.5rem', alignItems: 'flex-start'}}>
                <ShieldCheck size={24} style={{flexShrink: 0, opacity: 0.9}} />
                <div>
                  <h3 style={{fontSize: '1.125rem', fontWeight: 600, marginBottom: '0.5rem'}}>Secure Access</h3>
                  <p style={{fontSize: '0.9375rem', opacity: 0.8, lineHeight: 1.5}}>Role-based authentication for staff operations</p>
                </div>
              </div>
              <div className="auth-feature" style={{display: 'flex', gap: '1.5rem', alignItems: 'flex-start'}}>
                <Lock size={24} style={{flexShrink: 0, opacity: 0.9}} />
                <div>
                  <h3 style={{fontSize: '1.125rem', fontWeight: 600, marginBottom: '0.5rem'}}>Protected Data</h3>
                  <p style={{fontSize: '0.9375rem', opacity: 0.8, lineHeight: 1.5}}>End-to-end encryption for shipment information</p>
                </div>
              </div>
              <div className="auth-feature" style={{display: 'flex', gap: '1.5rem', alignItems: 'flex-start'}}>
                <Mail size={24} style={{flexShrink: 0, opacity: 0.9}} />
                <div>
                  <h3 style={{fontSize: '1.125rem', fontWeight: 600, marginBottom: '0.5rem'}}>Email Verification</h3>
                  <p style={{fontSize: '0.9375rem', opacity: 0.8, lineHeight: 1.5}}>Multi-factor authentication available</p>
                </div>
              </div>
            </div>
          </div>

          <div className="auth-brand-footer" style={{marginTop: 'auto', paddingTop: '2rem'}}>
            <Link to="/" className="auth-back-link" style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              color: 'white',
              textDecoration: 'none',
              fontWeight: 500,
              opacity: 0.8
            }}>
              <ArrowLeft size={16} />
              Back to website
            </Link>
          </div>
        </div>
      </div>
      )}

      {/* Right Panel - Form */}
      <div className="auth-form-panel" style={{
        background: 'var(--background)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '3rem'
      }}>
        <div className="auth-form-container" style={{width: '100%', maxWidth: '440px'}}>
          <div className="auth-form-header" style={{textAlign: 'center' as const, marginBottom: '3rem'}}>
            <img src={brandIcon} alt="RemitShip" width={56} height={42} style={{margin: '0 auto 1.5rem'}} />
            <h1 style={{fontSize: '2rem', fontWeight: 700, color: 'var(--foreground)', marginBottom: '0.75rem'}}>
              {mode === 'signup' && 'Create Account'}
              {mode === 'reset' && 'Reset Password'}
              {mode === 'signin' && 'Welcome Back'}
            </h1>
            <p style={{fontSize: '1rem', color: 'var(--muted-foreground)', lineHeight: 1.5}}>
              {mode === 'signup' && 'Staff access requires an assigned role from your administrator.'}
              {mode === 'reset' && "Enter your email address and we'll send you a password reset link."}
              {mode === 'signin' && 'Sign in to access your RemitShip workspace.'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="auth-form" style={{display: 'flex', flexDirection: 'column' as const, gap: '1.5rem', marginBottom: '1.5rem'}}>
            {mode === 'signup' && (
              <div className="form-group" style={{display: 'flex', flexDirection: 'column' as const, gap: '0.5rem'}}>
                <label htmlFor="name" style={{fontSize: '0.9375rem', fontWeight: 600, color: 'var(--foreground)'}}>Full Name</label>
                <Input 
                  id="name"
                  name="name" 
                  autoComplete="name" 
                  placeholder="John Smith"
                  style={{height: '48px', fontSize: '1rem'}}
                  required 
                />
              </div>
            )}

            <div className="form-group" style={{display: 'flex', flexDirection: 'column' as const, gap: '0.5rem'}}>
              <label htmlFor="email" style={{fontSize: '0.9375rem', fontWeight: 600, color: 'var(--foreground)'}}>Email Address</label>
              <Input 
                id="email"
                name="email" 
                type="email" 
                placeholder="you@company.com" 
                autoComplete="email"
                style={{height: '48px', fontSize: '1rem'}}
                required 
              />
            </div>

            {mode !== 'reset' && (
              <div className="form-group" style={{display: 'flex', flexDirection: 'column' as const, gap: '0.5rem'}}>
                <label htmlFor="password" style={{fontSize: '0.9375rem', fontWeight: 600, color: 'var(--foreground)'}}>Password</label>
                <PasswordInput 
                  id="password"
                  name="password" 
                  autoComplete={mode === 'signup' ? 'new-password' : 'current-password'} 
                  minLength={8}
                  placeholder="••••••••"
                  style={{height: '48px', fontSize: '1rem'}}
                  required 
                />
              </div>
            )}

            {error && (
              <div style={{
                padding: '1rem',
                borderRadius: '8px',
                fontSize: '0.9375rem',
                lineHeight: 1.5,
                background: 'rgba(229, 57, 53, 0.1)',
                border: '1px solid rgba(229, 57, 53, 0.3)',
                color: 'var(--destructive)'
              }} role="alert">
                {error}
              </div>
            )}

            {notice && (
              <div style={{
                padding: '1rem',
                borderRadius: '8px',
                fontSize: '0.9375rem',
                lineHeight: 1.5,
                background: 'rgba(76, 175, 80, 0.1)',
                border: '1px solid rgba(76, 175, 80, 0.3)',
                color: '#2e7d32'
              }} role="status">
                {notice}
              </div>
            )}

            <Button type="submit" disabled={busy} style={{width: '100%', height: '52px', fontSize: '1rem', fontWeight: 600, marginTop: '0.5rem'}} size="lg">
              {busy && 'Please wait…'}
              {!busy && mode === 'signin' && 'Sign In'}
              {!busy && mode === 'signup' && 'Create Account'}
              {!busy && mode === 'reset' && 'Send Reset Link'}
              <ArrowRight />
            </Button>
          </form>

          {mode === 'signin' && (
            <>
              <Button 
                variant="ghost" 
                className="w-full" 
                onClick={() => {
                  setMode('reset')
                  setError('')
                  setNotice('')
                }}
              >
                Forgot your password?
              </Button>

              <div style={{
                position: 'relative' as const,
                textAlign: 'center' as const,
                margin: '1.5rem 0'
              }}>
                <div style={{
                  position: 'absolute' as const,
                  top: '50%',
                  left: 0,
                  width: 'calc(50% - 2rem)',
                  height: '1px',
                  background: 'var(--border)'
                }} />
                <div style={{
                  position: 'absolute' as const,
                  top: '50%',
                  right: 0,
                  width: 'calc(50% - 2rem)',
                  height: '1px',
                  background: 'var(--border)'
                }} />
                <span style={{
                  background: 'var(--background)',
                  padding: '0 1rem',
                  fontSize: '0.875rem',
                  color: 'var(--muted-foreground)',
                  position: 'relative' as const,
                  zIndex: 1
                }}>or</span>
              </div>

              <Button 
                variant="outline" 
                className="w-full" 
                style={{height: '48px', fontSize: '1rem', gap: '0.75rem'}}
                disabled={busy}
                onClick={async () => {
                  setError('')
                  const { error } = await supabase.auth.signInWithOAuth({
                    provider: 'google',
                    options: { redirectTo: `${window.location.origin}/auth` }
                  })
                  if (error) setError(error.message)
                }}
              >
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z" fill="#4285F4"/>
                  <path d="M9.003 18c2.43 0 4.467-.806 5.956-2.18L12.05 13.56c-.806.54-1.836.86-3.047.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9.003 18z" fill="#34A853"/>
                  <path d="M3.964 10.712c-.18-.54-.282-1.117-.282-1.71 0-.593.102-1.17.282-1.71V4.96H.957C.347 6.175 0 7.55 0 9.002c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
                  <path d="M9.003 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.464.891 11.427 0 9.002 0 5.482 0 2.438 2.017.957 4.958L3.964 7.29c.708-2.127 2.692-3.71 5.036-3.71z" fill="#EA4335"/>
                </svg>
                Continue with Google
              </Button>
            </>
          )}

          <div style={{marginTop: '2rem', textAlign: 'center' as const}}>
            {mode === 'signin' ? (
              <p style={{fontSize: '0.875rem', color: 'var(--muted-foreground)', lineHeight: 1.5}}>
                Staff accounts are created by invitation from a RemitShip administrator.
              </p>
            ) : (
              <Button 
                variant="link" 
                onClick={() => {
                  setMode('signin')
                  setError('')
                  setNotice('')
                }}
                style={{margin: '0 auto'}}
              >
                <ArrowLeft size={16} />
                Back to sign in
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
