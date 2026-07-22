import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Film, Loader2, ArrowLeft, MailCheck } from 'lucide-react'
import toast from 'react-hot-toast'
import { motion } from 'framer-motion'
import { authService } from '@/services/authService'
import { useAuth } from '@/contexts/AuthContext'

export default function VerifyEmailPage() {
  const [params] = useSearchParams()
  const email = params.get('email') || ''
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [resending, setResending] = useState(false)
  const navigate = useNavigate()
  const { refreshUser } = useAuth()

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) {
      toast.error('Missing email address. Please register again.')
      return
    }
    if (!/^\d{6}$/.test(code.trim())) {
      toast.error('Enter the 6-digit code from your email')
      return
    }
    setLoading(true)
    try {
      await authService.verifyEmail(email, code.trim())
      await refreshUser() // verification set the auth cookies → we're logged in
      toast.success('Email verified! Welcome.')
      navigate('/')
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Invalid or expired code')
    } finally {
      setLoading(false)
    }
  }

  const resend = async () => {
    if (!email) return
    setResending(true)
    try {
      const res = await authService.resendVerification(email)
      if (res?.devCode) toast.success(`Dev code: ${res.devCode}`)
      else toast.success('A new code has been sent to your email.')
    } catch {
      toast.error('Could not resend the code. Please try again.')
    } finally {
      setResending(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-80 h-80 bg-primary-500/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -right-40 w-80 h-80 bg-accent-500/10 rounded-full blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.22, 0.61, 0.36, 1] }}
        className="max-w-md w-full space-y-8 relative z-10"
      >
        <div className="text-center space-y-1">
          <div className="flex justify-center">
            <div className="relative">
              <div className="absolute -inset-3 bg-gradient-to-b from-primary-500/20 to-transparent rounded-2xl blur-xl opacity-60" />
              <div className="relative w-14 h-14 rounded-2xl bg-primary-500/10 border border-primary-500/20 flex items-center justify-center">
                <Film className="h-7 w-7 text-primary-500" />
              </div>
            </div>
          </div>
          <h2 className="mt-6 text-3xl font-display font-bold text-white tracking-tight">Verify your email</h2>
          <p className="text-sm text-neutral-400 leading-relaxed">
            We sent a 6-digit code to{' '}
            <span className="text-neutral-200 font-medium">{email || 'your email'}</span>.
          </p>
        </div>

        <form className="mt-8 space-y-5" onSubmit={onSubmit}>
          <div>
            <label htmlFor="code" className="block text-sm font-medium text-neutral-300 mb-2">
              Verification code
            </label>
            <input
              id="code"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              inputMode="numeric"
              maxLength={6}
              autoFocus
              className="auth-input tracking-[0.5em] text-center text-lg"
              placeholder="000000"
            />
          </div>

          <button type="submit" disabled={loading} className="auth-btn-primary">
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Verifying...
              </>
            ) : (
              <>
                <MailCheck className="h-4 w-4" />
                Verify email
              </>
            )}
          </button>

          <div className="text-center space-y-2 pt-2">
            <p className="text-sm text-neutral-400">
              Didn't get it?{' '}
              <button
                type="button"
                onClick={resend}
                disabled={resending}
                className="text-primary-500 hover:text-primary-400 font-medium transition-colors disabled:opacity-50"
              >
                {resending ? 'Sending...' : 'Resend code'}
              </button>
            </p>
            <Link
              to="/login"
              className="inline-flex items-center gap-2 text-sm text-neutral-500 hover:text-primary-500 font-medium transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to sign in
            </Link>
          </div>
        </form>
      </motion.div>
    </div>
  )
}
