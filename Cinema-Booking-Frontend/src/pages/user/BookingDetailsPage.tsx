import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Calendar, Clock, MapPin, Users, Ticket, ArrowLeft, Printer } from 'lucide-react'
import { motion } from 'framer-motion'
import { IBooking } from '@/types'
import { useAuth } from '@/contexts/AuthContext'
import LoadingSpinner from '@/components/LoadingSpinner'
import ErrorMessage from '@/components/ErrorMessage'
import { bookingService } from '@/services/bookingService'

export default function BookingDetailsPage() {
  const { id } = useParams<{ id: string }>()
  const { user } = useAuth()
  const [booking, setBooking] = useState<IBooking | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (id && user) {
      fetchBookingDetails(id)
    }
  }, [id, user])

  const fetchBookingDetails = async (bookingId: string) => {
    try {
      setError('')
      // The backend authorizes this request (403 for anyone who isn't the owner or an
      // admin) and returns the booking with populated user/movie/showtime — so we just
      // render what it returns rather than re-checking ownership on the client.
      const data = await bookingService.getBookingById(bookingId);
      setBooking(data)
    } catch (error) {
      console.error('Error fetching booking details:', error)
      setError('Unable to load booking details. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const baseClasses = 'status-badge'
    switch (status) {
      case 'confirmed':
        return `${baseClasses} status-confirmed`
      case 'cancelled':
        return `${baseClasses} status-cancelled`
      default:
        return `${baseClasses} status-pending`
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-dark-950">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <ErrorMessage message={error} onRetry={() => id && fetchBookingDetails(id)} />
      </div>
    )
  }

  if (!booking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-dark-950">
        <motion.div 
          className="text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="w-16 h-16 rounded-2xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-center mx-auto mb-4">
            <Ticket className="h-8 w-8 text-neutral-600" />
          </div>
          <h1 className="text-2xl font-bold mb-4 text-white">Booking Not Found</h1>
          <Link to="/my-bookings" className="btn btn-primary">
            Back to Bookings
          </Link>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-dark-950 py-8 font-sans">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div 
          className="flex items-center space-x-4 mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Link
            to="/my-bookings"
            className="btn btn-secondary flex items-center space-x-2"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back</span>
          </Link>
          <p className="section-eyebrow mb-0">Details</p>
          <h1 className="text-3xl font-display font-bold text-white">Booking Details</h1>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Movie Poster */}
          <motion.div 
            className="lg:col-span-1"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <div className="relative group">
              <div className="absolute -inset-3 bg-gradient-to-b from-primary-500/15 via-primary-500/5 to-transparent rounded-3xl blur-2xl opacity-60" />
              <img
                src={booking.showtime?.movie?.poster_url || 'https://images.pexels.com/photos/7991579/pexels-photo-7991579.jpeg?auto=compress&cs=tinysrgb&w=400&h=600&fit=crop'}
                alt={booking.showtime?.movie?.title}
                className="relative w-full rounded-2xl shadow-poster ring-1 ring-white/[0.1]"
              />
            </div>
          </motion.div>

          {/* Booking Information */}
          <motion.div 
            className="lg:col-span-2"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <div className="glass-panel p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-semibold text-white">
                  {booking.showtime?.movie?.title}
                </h2>
                <span className={getStatusBadge(booking.status)}>
                  {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                </span>
              </div>

              <div className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <p className="text-sm text-neutral-400 mb-1">Customer</p>
                    <p className="font-medium text-white">{booking.user.fullName}</p>
                  </div>
                  <div>
                    <p className="text-sm text-neutral-400 mb-1">Email</p>
                    <p className="font-medium text-white">{booking.user.email}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-xl bg-primary-500/10 border border-primary-500/20 flex items-center justify-center shrink-0">
                      <MapPin className="h-5 w-5 text-primary-400" />
                    </div>
                    <div>
                      <p className="text-sm text-neutral-400">Cinema</p>
                      <p className="font-semibold text-white">{booking.showtime?.cinema?.name || 'N/A'}</p>
                      <p className="text-xs text-neutral-500">{booking.showtime?.cinema?.city || ''}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-xl bg-primary-500/10 border border-primary-500/20 flex items-center justify-center shrink-0">
                      <MapPin className="h-5 w-5 text-primary-400" />
                    </div>
                    <div>
                      <p className="text-sm text-neutral-400">Hall</p>
                      <p className="font-semibold text-white">{booking.showtime?.hall?.hall_name || 'N/A'}</p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-xl bg-primary-500/10 border border-primary-500/20 flex items-center justify-center shrink-0">
                      <Calendar className="h-5 w-5 text-primary-400" />
                    </div>
                    <div>
                      <p className="text-sm text-neutral-400">Show Date</p>
                      <p className="font-semibold text-white">
                        {new Date(booking.showtime?.show_date || '').toLocaleDateString('en-US', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-xl bg-primary-500/10 border border-primary-500/20 flex items-center justify-center shrink-0">
                      <Clock className="h-5 w-5 text-primary-400" />
                    </div>
                    <div>
                      <p className="text-sm text-neutral-400">Show Time</p>
                      <p className="font-semibold text-white">{booking.showtime?.start_time}</p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-xl bg-primary-500/10 border border-primary-500/20 flex items-center justify-center shrink-0">
                      <Users className="h-5 w-5 text-primary-400" />
                    </div>
                    <div>
                      <p className="text-sm text-neutral-400">Seats</p>
                      <p className="font-semibold text-white">{booking.selected_seats?.join(', ')}</p>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-neutral-400 mb-1">Total Amount</p>
                    <p className="text-2xl font-bold text-primary-400">
                      IDR {booking.total_amount.toLocaleString()}
                    </p>
                  </div>
                </div>

                <div className="pt-6 border-t border-white/[0.06]">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-sm">
                    <div>
                      <p className="text-neutral-400 mb-1">Booking Date</p>
                      <p className="font-medium text-white">
                        {new Date(booking.booking_date).toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-neutral-400 mb-1">Number of Tickets</p>
                      <p className="font-medium text-white">{booking.total_seats}</p>
                    </div>
                  </div>
                </div>

                {booking.status === 'confirmed' && (
                  <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4">
                    <p className="text-emerald-300 font-medium">
                      Your booking is confirmed! Please arrive at the cinema at least 15 minutes before the show time.
                    </p>
                  </div>
                )}

                {booking.status === 'cancelled' && (
                  <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4">
                    <p className="text-red-300 font-medium">
                      This booking has been cancelled.
                    </p>
                  </div>
                )}

                {booking.status === 'confirmed' && (
                  <div className="pt-4 no-print">
                    <button
                      onClick={() => window.print()}
                      className="btn btn-secondary w-full"
                    >
                      <Printer className="h-4 w-4" />
                      Print Ticket
                    </button>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
