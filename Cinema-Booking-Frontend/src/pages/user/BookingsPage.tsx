import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Clock, MapPin, Eye, Printer, X } from 'lucide-react';
import { motion } from 'framer-motion';
import { IBooking } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import LoadingSpinner from '@/components/LoadingSpinner';
import ErrorMessage from '@/components/ErrorMessage';
import toast from 'react-hot-toast';
import { bookingService } from '@/services/bookingService';

export default function BookingsPage() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<IBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (user) {
      fetchBookings();
    }
  }, [user]);

  const fetchBookings = async () => {
    if (!user) return;
    try {
      setError('');
      const data = await bookingService.getMyBookings(user._id || user.id);
      setBookings(data || []);
    } catch (error) {
      console.error('Error fetching bookings:', error);
      setError('Unable to load your bookings. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelBooking = async (bookingId: string) => {
    if (!confirm('Are you sure you want to cancel this booking?')) return;

    try {
      await bookingService.cancelBooking(bookingId);

      toast.success('Booking cancelled successfully');
      fetchBookings();
    } catch (error) {
      console.error('Error cancelling booking:', error);
      toast.error('Failed to cancel booking');
    }
  };

  const getStatusBadge = (status: string) => {
    const baseClasses = 'status-badge';
    switch (status) {
      case 'confirmed':
        return `${baseClasses} status-confirmed`;
      case 'cancelled':
        return `${baseClasses} status-cancelled`;
      default:
        return `${baseClasses} status-pending`;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-dark-950">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <ErrorMessage message={error} onRetry={fetchBookings} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-950 py-8 font-sans">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <p className="section-eyebrow mb-2">Your tickets</p>
          <h1 className="text-3xl font-display font-bold mb-8 text-white">My Bookings</h1>
        </motion.div>

        {bookings.length === 0 ? (
          <motion.div 
            className="text-center py-16"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <div className="w-16 h-16 rounded-2xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-center mx-auto mb-5">
              <Calendar className="h-8 w-8 text-neutral-600" />
            </div>
            <p className="text-neutral-400 text-lg mb-6">
              You don't have any bookings yet.
            </p>
            <Link to="/movies" className="btn btn-primary">
              Browse Movies
            </Link>
          </motion.div>
        ) : (
          <div className="space-y-5">
            {bookings.map((booking, index) => (
              <motion.div 
                key={booking._id} 
                className="glass-panel p-6 hover:border-white/[0.1] transition-all duration-300"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
                  <div className="flex items-start space-x-4 mb-4 lg:mb-0">
                    <div className="relative shrink-0">
                      <div className="absolute -inset-1 bg-gradient-to-b from-primary-500/10 to-transparent rounded-xl blur-lg opacity-50" />
                      <img
                        src={booking.showtime?.movie?.poster_url || 'https://images.pexels.com/photos/7991579/pexels-photo-7991579.jpeg?auto=compress&cs=tinysrgb&w=100&h=150&fit=crop'}
                        alt={booking.showtime?.movie?.title}
                        className="relative w-16 h-24 object-cover rounded-xl shadow-lg ring-1 ring-white/[0.1]"
                      />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold mb-2 text-white">
                        {booking.showtime?.movie?.title}
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-sm text-neutral-400">
                        <div className="flex items-center space-x-1.5">
                          <MapPin className="h-4 w-4 text-primary-400" />
                          <span>{booking.showtime?.cinema?.name || 'N/A'}{booking.showtime?.cinema?.city ? ` - ${booking.showtime.cinema.city}` : ''}</span>
                        </div>
                        <div className="flex items-center space-x-1.5">
                          <MapPin className="h-4 w-4 text-accent-500" />
                          <span>{booking.showtime?.hall?.hall_name || 'N/A'}</span>
                        </div>
                        <div className="flex items-center space-x-1.5">
                          <Calendar className="h-4 w-4 text-primary-400" />
                          <span>
                            {new Date(booking.showtime?.show_date || '').toLocaleDateString()}
                          </span>
                        </div>
                        <div className="flex items-center space-x-1.5">
                          <Clock className="h-4 w-4 text-primary-400" />
                          <span>{booking.showtime?.start_time}</span>
                        </div>
                        <div>
                          <span>Seats: {booking.selected_seats?.join(', ')}</span>
                        </div>
                      </div>
                      <div className="mt-3 flex items-center space-x-4">
                        <span className={getStatusBadge(booking.status)}>
                          {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                        </span>
                        <span className="text-lg font-semibold text-primary-400">
                          IDR {booking.total_amount.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex space-x-3">
                    <Link
                      to={`/tickets/${booking._id}`}
                      className="btn btn-secondary flex items-center space-x-2"
                    >
                      <Eye className="h-4 w-4" />
                      <span>View</span>
                    </Link>
                    {booking.status === 'confirmed' && (
                      <>
                        <Link
                          to={`/bookings/${booking._id}`}
                          className="btn btn-secondary flex items-center space-x-2 no-print"
                          onClick={(e) => {
                            e.preventDefault();
                            window.print();
                          }}
                        >
                          <Printer className="h-4 w-4" />
                          <span>Print</span>
                        </Link>
                        <button
                          onClick={() => handleCancelBooking(booking._id)}
                          className="btn btn-danger flex items-center space-x-2"
                        >
                          <X className="h-4 w-4" />
                          <span>Cancel</span>
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
