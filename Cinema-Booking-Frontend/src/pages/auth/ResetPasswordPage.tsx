import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { Film, Loader2, ArrowLeft, Eye, EyeOff } from 'lucide-react'
import toast from 'react-hot-toast'
import { motion } from 'framer-motion'
import { authService } from '@/services/authService'

interface ResetForm {
  code: string
  newPassword: string
  confirmPassword: string
}

export default function ResetPasswordPage() {
  const [params] = useSearchParams()
  const email = params.get('email') || ''
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const navigate = useNavigate()

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<ResetForm>()

  const newPassword = watch('newPassword')

  const onSubmit = async (data: ResetForm) => {
    if (!email) {
      toast.error('Missing email address. Start from "Forgot password".')
      return
    }
    setLoading(true)
    try {
      await authService.resetPassword(email, data.code.trim(), data.newPassword, data.confirmPassword)
      toast.success('Password reset. Please sign in with your new password.')
      navigate('/login')
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Invalid or expired code')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary-500/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-accent-500/10 rounded-full blur-3xl" />
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
          <h2 className="mt-6 text-3xl font-display font-bold text-white tracking-tight">Reset password</h2>
          <p className="text-sm text-neutral-400 leading-relaxed">
            Enter the code we sent to{' '}
            <span className="text-neutral-200 font-medium">{email || 'your email'}</span> and choose a new password.
          </p>
        </div>

        <form className="mt-8 space-y-5" onSubmit={handleSubmit(onSubmit)}>
          <div>
            <label className="block text-sm font-medium text-neutral-300 mb-2">Verification code</label>
            <input
              {...register('code', {
                required: 'Code is required',
                pattern: { value: /^\d{6}$/, message: 'Enter the 6-digit code' },
              })}
              inputMode="numeric"
              maxLength={6}
              className="auth-input tracking-[0.4em] text-center"
              placeholder="000000"
            />
            {errors.code && <p className="mt-1.5 text-xs text-red-400">{errors.code.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-300 mb-2">New password</label>
            <div className="relative">
              <input
                {...register('newPassword', {
                  required: 'Password is required',
                  minLength: { value: 6, message: 'Password must be at least 6 characters' },
                })}
                type={showPassword ? 'text' : 'password'}
                className="auth-input pr-11"
                placeholder="Enter a new password"
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? (
                  <EyeOff className="h-4.5 w-4.5 text-neutral-500 hover:text-neutral-300 transition-colors" />
                ) : (
                  <Eye className="h-4.5 w-4.5 text-neutral-500 hover:text-neutral-300 transition-colors" />
                )}
              </button>
            </div>
            {errors.newPassword && <p className="mt-1.5 text-xs text-red-400">{errors.newPassword.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-300 mb-2">Confirm new password</label>
            <input
              {...register('confirmPassword', {
                required: 'Please confirm your password',
                validate: (value) => value === newPassword || 'Passwords do not match',
              })}
              type={showPassword ? 'text' : 'password'}
              className="auth-input"
              placeholder="Confirm your new password"
            />
            {errors.confirmPassword && (
              <p className="mt-1.5 text-xs text-red-400">{errors.confirmPassword.message}</p>
            )}
          </div>

          <button type="submit" disabled={loading} className="auth-btn-primary">
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Resetting...
              </>
            ) : (
              'Reset password'
            )}
          </button>

          <div className="text-center pt-2">
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
