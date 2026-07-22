import { useState, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { Eye, EyeOff, Loader2, ArrowLeft, CheckCircle, Lock, Shield } from 'lucide-react'
import toast from 'react-hot-toast'
import { motion, AnimatePresence } from 'framer-motion'
import { clsx } from 'clsx'
import api from '@/services/api'

interface ChangePasswordForm {
  currentPassword: string
  newPassword: string
  confirmPassword: string
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

const modalOverlay = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
}

const modalContent = {
  hidden: { opacity: 0, scale: 0.9, y: 20 },
  visible: { opacity: 1, scale: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 25 } },
  exit: { opacity: 0, scale: 0.9, y: 20 },
} as const

type StrengthLevel = 'weak' | 'medium' | 'strong' | 'very-strong' | 'none'

function getPasswordStrength(password: string): { level: StrengthLevel; label: string; color: string; width: string } {
  if (!password) return { level: 'none', label: '', color: '', width: 'w-0' }

  let score = 0
  if (password.length >= 8) score++
  if (password.length >= 12) score++
  if (/[A-Z]/.test(password)) score++
  if (/[a-z]/.test(password)) score++
  if (/[0-9]/.test(password)) score++
  if (/[^A-Za-z0-9]/.test(password)) score++

  if (score <= 2) return { level: 'weak', label: 'Weak', color: 'bg-red-500', width: 'w-1/4' }
  if (score <= 3) return { level: 'medium', label: 'Medium', color: 'bg-amber-500', width: 'w-2/4' }
  if (score <= 4) return { level: 'strong', label: 'Strong', color: 'bg-emerald-500', width: 'w-3/4' }
  return { level: 'very-strong', label: 'Very Strong', color: 'bg-emerald-400', width: 'w-full' }
}

function PasswordRequirement({ met, text }: { met: boolean; text: string }) {
  return (
    <div className={clsx('flex items-center gap-2 text-xs transition-colors duration-200', met ? 'text-emerald-400' : 'text-neutral-500')}>
      <div className={clsx(
        'w-4 h-4 rounded-full flex items-center justify-center border transition-all duration-200',
        met ? 'bg-emerald-500/20 border-emerald-500/30' : 'bg-white/[0.03] border-white/[0.08]'
      )}>
        {met && <CheckCircle className="h-3 w-3" />}
      </div>
      <span>{text}</span>
    </div>
  )
}

export default function ChangePasswordPage() {
  const navigate = useNavigate()
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<ChangePasswordForm>()

  const newPassword = watch('newPassword', '')

  const strength = useMemo(() => getPasswordStrength(newPassword), [newPassword])

  const hasMinLength = newPassword.length >= 8
  const hasUppercase = /[A-Z]/.test(newPassword)
  const hasLowercase = /[a-z]/.test(newPassword)
  const hasNumber = /[0-9]/.test(newPassword)

  const onSubmit = async (data: ChangePasswordForm) => {
    setLoading(true)
    try {
      await api.post('/auth/change-password', {
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
        confirmPassword: data.confirmPassword,
      })
      toast.success('Password updated successfully!')
      setSuccess(true)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      const message = error.response?.data?.message || 'Something went wrong. Please try again.'
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8 bg-dark-950">
      {/* Background decorations */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary-500/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-accent-500/10 rounded-full blur-3xl" />
      </div>

      <div className="max-w-lg mx-auto relative z-10">
        {/* Back link */}
        <motion.div
          initial={{ opacity: 0, x: -8 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
          className="mb-6"
        >
          <Link
            to="/profile"
            className="inline-flex items-center gap-2 text-sm text-neutral-400 hover:text-primary-500 font-medium transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Profile
          </Link>
        </motion.div>

        <motion.div
          variants={stagger}
          initial="initial"
          animate="animate"
          className="glass-panel p-8"
        >
          {/* Header */}
          <div className="text-center mb-8">
            <motion.div variants={fadeUp} className="flex justify-center mb-4">
              <div className="relative">
                <div className="absolute -inset-3 bg-gradient-to-b from-primary-500/20 to-transparent rounded-2xl blur-xl opacity-60" />
                <div className="relative w-14 h-14 rounded-2xl bg-primary-500/10 border border-primary-500/20 flex items-center justify-center">
                  <Shield className="h-7 w-7 text-primary-500" />
                </div>
              </div>
            </motion.div>
            <motion.h2
              variants={fadeUp}
              className="text-2xl font-display font-bold text-white tracking-tight"
            >
              Change Password
            </motion.h2>
            <motion.p variants={fadeUp} className="text-sm text-neutral-400 mt-2">
              Update your password to keep your account secure.
            </motion.p>
          </div>

          <form className="space-y-5" onSubmit={handleSubmit(onSubmit)}>
            {/* Current Password */}
            <motion.div variants={fadeUp}>
              <label htmlFor="currentPassword" className="block text-sm font-medium text-neutral-300 mb-2">
                Current Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <Lock className="h-4.5 w-4.5 text-neutral-500" />
                </div>
                <input
                  {...register('currentPassword', {
                    required: 'Current password is required',
                  })}
                  type={showCurrent ? 'text' : 'password'}
                  className="auth-input pl-11 pr-11"
                  placeholder="Enter current password"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center"
                  onClick={() => setShowCurrent(!showCurrent)}
                  aria-label={showCurrent ? 'Hide password' : 'Show password'}
                >
                  {showCurrent ? (
                    <EyeOff className="h-4.5 w-4.5 text-neutral-500 hover:text-neutral-300 transition-colors" />
                  ) : (
                    <Eye className="h-4.5 w-4.5 text-neutral-500 hover:text-neutral-300 transition-colors" />
                  )}
                </button>
              </div>
              {errors.currentPassword && (
                <p className="mt-1.5 text-xs text-red-400">{errors.currentPassword.message}</p>
              )}
            </motion.div>

            {/* New Password */}
            <motion.div variants={fadeUp}>
              <label htmlFor="newPassword" className="block text-sm font-medium text-neutral-300 mb-2">
                New Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <Lock className="h-4.5 w-4.5 text-neutral-500" />
                </div>
                <input
                  {...register('newPassword', {
                    required: 'New password is required',
                    minLength: { value: 8, message: 'Password must be at least 8 characters' },
                  })}
                  type={showNew ? 'text' : 'password'}
                  className="auth-input pl-11 pr-11"
                  placeholder="Enter new password"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center"
                  onClick={() => setShowNew(!showNew)}
                  aria-label={showNew ? 'Hide password' : 'Show password'}
                >
                  {showNew ? (
                    <EyeOff className="h-4.5 w-4.5 text-neutral-500 hover:text-neutral-300 transition-colors" />
                  ) : (
                    <Eye className="h-4.5 w-4.5 text-neutral-500 hover:text-neutral-300 transition-colors" />
                  )}
                </button>
              </div>
              {errors.newPassword && (
                <p className="mt-1.5 text-xs text-red-400">{errors.newPassword.message}</p>
              )}

              {/* Password Strength */}
              {newPassword && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="mt-3"
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs text-neutral-500">Password strength</span>
                    <span className={clsx(
                      'text-xs font-medium',
                      strength.level === 'weak' && 'text-red-400',
                      strength.level === 'medium' && 'text-amber-400',
                      strength.level === 'strong' && 'text-emerald-400',
                      strength.level === 'very-strong' && 'text-emerald-400',
                    )}>
                      {strength.label}
                    </span>
                  </div>
                  <div className="h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: newPassword ? '100%' : 0 }}
                      className={clsx('h-full rounded-full transition-all duration-500', strength.color, strength.width)}
                    />
                  </div>

                  {/* Requirements */}
                  <div className="mt-3 space-y-1.5">
                    <PasswordRequirement met={hasMinLength} text="At least 8 characters" />
                    <PasswordRequirement met={hasUppercase} text="Uppercase letter" />
                    <PasswordRequirement met={hasLowercase} text="Lowercase letter" />
                    <PasswordRequirement met={hasNumber} text="Number" />
                  </div>
                </motion.div>
              )}
            </motion.div>

            {/* Confirm New Password */}
            <motion.div variants={fadeUp}>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-neutral-300 mb-2">
                Confirm New Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <Lock className="h-4.5 w-4.5 text-neutral-500" />
                </div>
                <input
                  {...register('confirmPassword', {
                    required: 'Please confirm your new password',
                    validate: (value) => value === newPassword || 'Passwords do not match',
                  })}
                  type={showConfirm ? 'text' : 'password'}
                  className="auth-input pl-11 pr-11"
                  placeholder="Confirm new password"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center"
                  onClick={() => setShowConfirm(!showConfirm)}
                  aria-label={showConfirm ? 'Hide password' : 'Show password'}
                >
                  {showConfirm ? (
                    <EyeOff className="h-4.5 w-4.5 text-neutral-500 hover:text-neutral-300 transition-colors" />
                  ) : (
                    <Eye className="h-4.5 w-4.5 text-neutral-500 hover:text-neutral-300 transition-colors" />
                  )}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="mt-1.5 text-xs text-red-400">{errors.confirmPassword.message}</p>
              )}
            </motion.div>

            {/* Buttons */}
            <motion.div variants={fadeUp} className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                type="submit"
                disabled={loading}
                className="auth-btn-primary flex-1"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Updating...
                  </>
                ) : (
                  'Update Password'
                )}
              </button>
              <Link
                to="/profile"
                className="btn btn-secondary flex-1 justify-center"
              >
                Cancel
              </Link>
            </motion.div>
          </form>
        </motion.div>
      </div>

      {/* Success Modal */}
      <AnimatePresence>
        {success && (
          <motion.div
            variants={modalOverlay}
            initial="hidden"
            animate="visible"
            exit="hidden"
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={() => {
              setSuccess(false)
              navigate('/profile')
            }}
          >
            <motion.div
              variants={modalContent}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="glass-panel p-8 max-w-sm w-full text-center"
              onClick={(e) => e.stopPropagation()}
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.1, type: 'spring', stiffness: 200 }}
                className="relative inline-block mb-5"
              >
                <div className="absolute -inset-3 bg-gradient-to-b from-emerald-500/20 to-transparent rounded-full blur-xl opacity-60" />
                <div className="relative w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                  <CheckCircle className="h-8 w-8 text-emerald-400" />
                </div>
              </motion.div>

              <h3 className="text-xl font-display font-bold text-white mb-2">
                Password Updated Successfully
              </h3>
              <p className="text-sm text-neutral-400 mb-6 leading-relaxed">
                Your password has been updated successfully. You can now use your new password to sign in.
              </p>

              <button
                onClick={() => {
                  setSuccess(false)
                  navigate('/profile')
                }}
                className="auth-btn-primary w-full"
              >
                Back to Profile
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
