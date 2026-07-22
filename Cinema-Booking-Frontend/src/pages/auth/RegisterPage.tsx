import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { Film, Eye, EyeOff, Loader2 } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import toast from 'react-hot-toast'
import { motion } from 'framer-motion'

interface RegisterForm {
  fullName: string
  email: string
  password: string
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

export default function RegisterPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const { signUp } = useAuth()
  const navigate = useNavigate()

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<RegisterForm>()

  const password = watch('password')

  const onSubmit = async (data: RegisterForm) => {
    setLoading(true)
    try {
      const { error, data: res } = await signUp(data.email, data.password, data.fullName)
      if (error) {
        toast.error(error.message || 'Registration failed')
      } else {
        if (res?.devCode) toast.success(`Dev code: ${res.devCode}`)
        toast.success('Account created! Enter the code we emailed to verify.')
        navigate(`/verify-email?email=${encodeURIComponent(data.email)}`)
      }
    } catch (error) {
      toast.error('An error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      {/* Background decorations */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-80 h-80 bg-primary-500/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -right-40 w-80 h-80 bg-accent-500/10 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary-500/[0.03] rounded-full blur-[120px]" />
      </div>

      <motion.div
        variants={stagger}
        initial="initial"
        animate="animate"
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
            Create Account
          </motion.h2>
          <motion.p variants={fadeUp} className="text-sm text-neutral-400">
            Join us to start booking your favorite movies
          </motion.p>
        </div>

        <form className="mt-8 space-y-5" onSubmit={handleSubmit(onSubmit)}>
          {/* Form Fields */}
          <motion.div variants={fadeUp} className="space-y-4">
            <div>
              <label htmlFor="fullName" className="block text-sm font-medium text-neutral-300 mb-2">
                Full Name
              </label>
              <input
                {...register('fullName', {
                  required: 'Full name is required',
                  minLength: { value: 2, message: 'Full name must be at least 2 characters' },
                })}
                type="text"
                className="auth-input"
                placeholder="John Doe"
              />
              {errors.fullName && (
                <p className="mt-1.5 text-xs text-red-400">{errors.fullName.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-neutral-300 mb-2">
                Email Address
              </label>
              <input
                {...register('email', {
                  required: 'Email is required',
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: 'Invalid email address',
                  },
                })}
                type="email"
                className="auth-input"
                placeholder="you@example.com"
              />
              {errors.email && (
                <p className="mt-1.5 text-xs text-red-400">{errors.email.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-neutral-300 mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  {...register('password', {
                    required: 'Password is required',
                    minLength: { value: 6, message: 'Password must be at least 6 characters' },
                  })}
                  type={showPassword ? 'text' : 'password'}
                  className="auth-input pr-11"
                  placeholder="Create a password"
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
              {errors.password && (
                <p className="mt-1.5 text-xs text-red-400">{errors.password.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-neutral-300 mb-2">
                Confirm Password
              </label>
              <div className="relative">
                <input
                  {...register('confirmPassword', {
                    required: 'Please confirm your password',
                    validate: (value) => value === password || 'Passwords do not match',
                  })}
                  type={showConfirmPassword ? 'text' : 'password'}
                  className="auth-input pr-11"
                  placeholder="Confirm your password"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-4.5 w-4.5 text-neutral-500 hover:text-neutral-300 transition-colors" />
                  ) : (
                    <Eye className="h-4.5 w-4.5 text-neutral-500 hover:text-neutral-300 transition-colors" />
                  )}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="mt-1.5 text-xs text-red-400">{errors.confirmPassword.message}</p>
              )}
            </div>
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
                  Creating Account...
                </>
              ) : (
                'Create Account'
              )}
            </button>
          </motion.div>

          {/* Links */}
          <motion.div variants={fadeUp} className="text-center pt-2">
            <p className="text-sm text-neutral-400">
              Already have an account?{' '}
              <Link to="/login" className="text-primary-500 hover:text-primary-400 font-medium transition-colors">
                Sign in
              </Link>
            </p>
          </motion.div>
        </form>
      </motion.div>
    </div>
  )
}
