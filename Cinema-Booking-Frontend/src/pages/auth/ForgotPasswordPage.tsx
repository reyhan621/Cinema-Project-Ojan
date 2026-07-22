import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { authService } from '@/services/authService'
import { Film, Loader2, ArrowLeft, CheckCircle, Mail } from 'lucide-react'
import toast from 'react-hot-toast'
import { motion, AnimatePresence } from 'framer-motion'

interface ForgotPasswordForm {
  email: string
}

const stagger = {
  animate: {
    transition: {
      staggerChildren: 0.06,
    },
  },
}

const fadeUp = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.45, ease: [0.22, 0.61, 0.36, 1] },
}

export default function ForgotPasswordPage() {
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const navigate = useNavigate()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordForm>()

  const onSubmit = async (data: ForgotPasswordForm) => {
    setLoading(true)
    try {
      const res = await authService.forgotPassword(data.email)
      // Backend always returns 200 (no account enumeration). In dev it echoes the code.
      if (res?.devCode) toast.success(`Dev code: ${res.devCode}`)
      toast.success('If that email is registered, a reset code has been sent.')
      navigate(`/reset-password?email=${encodeURIComponent(data.email)}`)
    } catch {
      toast.error('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      {/* Background decorations */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary-500/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-accent-500/10 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary-500/[0.03] rounded-full blur-[120px]" />
      </div>

      <AnimatePresence mode="wait">
        {sent ? (
          <motion.div
            key="success"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.4, ease: [0.22, 0.61, 0.36, 1] }}
            className="max-w-md w-full relative z-10"
          >
            <div className="glass-panel p-8 text-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.15, type: 'spring', stiffness: 200 }}
                className="relative inline-block mb-6"
              >
                <div className="absolute -inset-3 bg-gradient-to-b from-emerald-500/20 to-transparent rounded-full blur-xl opacity-60" />
                <div className="relative w-20 h-20 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                  <CheckCircle className="h-10 w-10 text-emerald-400" />
                </div>
              </motion.div>

              <motion.h2
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 }}
                className="text-2xl font-display font-bold text-white mb-3"
              >
                Check Your Email
              </motion.h2>

              <motion.p
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35 }}
                className="text-neutral-400 text-sm mb-8 leading-relaxed"
              >
                We've sent a password reset link to your email address. Please check your inbox and follow the instructions.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.45 }}
                className="space-y-3"
              >
                <Link
                  to="/login"
                  className="auth-btn-primary inline-flex items-center gap-2"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back to Login
                </Link>
                <p className="text-xs text-neutral-500">
                  Didn't receive the email?{' '}
                  <button
                    onClick={() => {
                      setSent(false)
                      toast.success('Reset link resent!')
                    }}
                    className="text-primary-500 hover:text-primary-400 font-medium transition-colors"
                  >
                    Resend
                  </button>
                </p>
              </motion.div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="form"
            variants={stagger}
            initial="initial"
            animate="animate"
            exit={{ opacity: 0, y: -16 }}
            className="max-w-md w-full space-y-8 relative z-10"
          >
            {/* Logo & Header */}
            <div className="text-center space-y-1">
              <motion.div variants={fadeUp} className="flex justify-center">
                <div className="relative">
                  <div className="absolute -inset-3 bg-gradient-to-b from-primary-500/20 to-transparent rounded-2xl blur-xl opacity-60" />
                  <div className="relative w-14 h-14 rounded-2xl bg-primary-500/10 border border-primary-500/20 flex items-center justify-center">
                    <Film className="h-7 w-7 text-primary-500" />
                  </div>
                </div>
              </motion.div>
              <motion.h2
                variants={fadeUp}
                className="mt-6 text-3xl font-display font-bold text-white tracking-tight"
              >
                Forgot Password?
              </motion.h2>
              <motion.p variants={fadeUp} className="text-sm text-neutral-400 leading-relaxed">
                Enter your email address and we'll send you instructions to reset your password.
              </motion.p>
            </div>

            <form className="mt-8 space-y-5" onSubmit={handleSubmit(onSubmit)}>
              {/* Email Field */}
              <motion.div variants={fadeUp}>
                <label htmlFor="email" className="block text-sm font-medium text-neutral-300 mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <Mail className="h-4.5 w-4.5 text-neutral-500" />
                  </div>
                  <input
                    {...register('email', {
                      required: 'Email is required',
                      pattern: {
                        value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                        message: 'Please enter a valid email address',
                      },
                    })}
                    type="email"
                    className="auth-input pl-11"
                    placeholder="you@example.com"
                  />
                </div>
                {errors.email && (
                  <p className="mt-1.5 text-xs text-red-400">{errors.email.message}</p>
                )}
              </motion.div>

              {/* Submit Button */}
              <motion.div variants={fadeUp}>
                <button
                  type="submit"
                  disabled={loading}
                  className="auth-btn-primary"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Sending Reset Link...
                    </>
                  ) : (
                    'Send Reset Link'
                  )}
                </button>
              </motion.div>

              {/* Back to Login */}
              <motion.div variants={fadeUp} className="text-center pt-2">
                <Link
                  to="/login"
                  className="inline-flex items-center gap-2 text-sm text-neutral-400 hover:text-primary-500 font-medium transition-colors"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back to Login
                </Link>
              </motion.div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
