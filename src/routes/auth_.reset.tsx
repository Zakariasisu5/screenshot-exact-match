import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { ArrowLeft, CheckCircle, Lock } from 'lucide-react'
import { supabase } from '@/integrations/supabase/client'
import { Brand, brandIcon } from '@/components/remitship/public-shell'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { pageHead } from '@/lib/remitship'

export const Route = createFileRoute('/auth_/reset')({
  head: () => pageHead('Reset Password', 'Set a new password for your RemitShip staff account.'),
  component: Reset
})

function Reset() {
  const [message, setMessage] = useState('')
  const [success, setSuccess] = useState(false)
  const [busy, setBusy] = useState(false)
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setBusy(true)
    setMessage('')
    
    const form = new FormData(e.currentTarget)
    const password = String(form.get('password'))
    const confirmPassword = String(form.get('confirmPassword'))
    
    if (password !== confirmPassword) {
      setMessage('Passwords do not match.')
      setBusy(false)
      return
    }
    
    const { error } = await supabase.auth.updateUser({ password })
    
    if (error) {
      setMessage(error.message)
      setBusy(false)
    } else {
      setSuccess(true)
      setMessage('Your password has been updated successfully.')
      setTimeout(() => {
        navigate({ to: '/admin' })
      }, 2000)
    }
  }

  return (
    <div className="auth-page-dhl">
      {/* Left Brand Panel */}
      <div className="auth-brand-panel">
        <div className="auth-brand-content">
          <Brand />
          <h2>Password Reset</h2>
          <p>Create a new secure password for your RemitShip account.</p>
          
          <div className="auth-features">
            <div className="auth-feature">
              <Lock size={24} />
              <div>
                <h3>Secure Password</h3>
                <p>Use at least 8 characters with a mix of letters and numbers</p>
              </div>
            </div>
            <div className="auth-feature">
              <CheckCircle size={24} />
              <div>
                <h3>Instant Access</h3>
                <p>Sign in immediately after updating your password</p>
              </div>
            </div>
          </div>

          <div className="auth-brand-footer">
            <Link to="/auth" className="auth-back-link">
              <ArrowLeft size={16} />
              Back to sign in
            </Link>
          </div>
        </div>
      </div>

      {/* Right Form Panel */}
      <div className="auth-form-panel">
        <div className="auth-form-container">
          <div className="auth-form-header">
            <img src={brandIcon} alt="RemitShip" width={56} height={42} className="auth-logo-icon" />
            <h1>Set New Password</h1>
            <p className="auth-subtitle">
              Choose a strong password to keep your account secure.
            </p>
          </div>

          {!success ? (
            <form onSubmit={handleSubmit} className="auth-form">
              <div className="form-group">
                <label htmlFor="password">New Password</label>
                <Input 
                  id="password"
                  name="password" 
                  type="password" 
                  autoComplete="new-password" 
                  minLength={8}
                  placeholder="••••••••"
                  required 
                />
                <small style={{ fontSize: '0.875rem', color: 'var(--muted-foreground)' }}>
                  Minimum 8 characters
                </small>
              </div>

              <div className="form-group">
                <label htmlFor="confirmPassword">Confirm Password</label>
                <Input 
                  id="confirmPassword"
                  name="confirmPassword" 
                  type="password" 
                  autoComplete="new-password" 
                  minLength={8}
                  placeholder="••••••••"
                  required 
                />
              </div>

              {message && !success && (
                <div className="auth-alert auth-alert-error" role="alert">
                  {message}
                </div>
              )}

              <Button type="submit" disabled={busy} className="auth-submit-btn" size="lg">
                {busy ? 'Updating...' : 'Update Password'}
              </Button>
            </form>
          ) : (
            <div className="auth-success-state">
              <div className="auth-success-icon">
                <CheckCircle size={64} />
              </div>
              <h2>Password Updated!</h2>
              <p>{message}</p>
              <p className="auth-redirect-notice">Redirecting to your dashboard...</p>
            </div>
          )}

          <div className="auth-footer-text">
            <Link to="/auth">
              <Button variant="link">
                <ArrowLeft size={16} />
                Back to sign in
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
