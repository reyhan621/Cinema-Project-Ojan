import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Calendar, Clock, MapPin, Users, Ticket, ArrowLeft, User, Mail } from 'lucide-react';
import { motion } from 'framer-motion';
import { IBooking } from '@/types';
import LoadingSpinner from '@/components/LoadingSpinner';
import ErrorMessage from '@/components/ErrorMessage';
import { adminService } from '@/services/adminService';

export default function AdminBookingDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const [booking, setBooking] = useState<IBooking | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (id) {
      fetchBookingDetails(id);
    }
  }, [id]);

  const fetchBookingDetails = async (bookingId: string) => {
    try {
      setError('');
      const data = await adminService.getBookingById(bookingId);
      setBooking(data);
    } catch (error) {
      console.error(error);
      setError('Unable to load booking details. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center p-8">
        <ErrorMessage
          message={error}
          onRetry={() => id && fetchBookingDetails(id)}
        />
        <Link to="/admin/bookings" className="btn btn-primary mt-4">
          Back to Bookings
        </Link>
      </div>
    );
  }

  if (!booking) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center p-8"
      >
        <h1 className="text-2xl font-display font-bold text-white">Booking not found</h1>
        <Link to="/admin/bookings" className="btn btn-primary mt-4 inline-flex">
          Back to Bookings
        </Link>
      </motion.div>
    );
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1, delayChildren: 0.1 } },
  } as const;

  const itemVariants = {
    hidden: { opacity: 0, y: 16 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' } },
  } as const;

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      <motion.div variants={itemVariants} className="flex items-center space-x-4">
        <Link to="/admin/bookings" className="btn btn-secondary flex items-center space-x-2">
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Bookings</span>
        </Link>
        <h1 className="text-3xl font-display font-bold text-white">Booking Details</h1>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div variants={itemVariants} className="md:col-span-2 card p-6 space-y-4">
            <h2 className="text-xl font-display font-semibold text-white">{booking.showtime?.movie?.title}</h2>
            <div className="grid grid-cols-2 gap-4">
                <InfoItem icon={Ticket} label="Booking ID" value={`#${booking._id.slice(-6)}`} />
                <InfoItem icon={MapPin} label="Hall" value={booking.showtime?.hall?.hall_name} />
                <InfoItem icon={Calendar} label="Date" value={new Date(booking.showtime?.show_date).toLocaleDateString()} />
                <InfoItem icon={Clock} label="Time" value={booking.showtime?.start_time} />
                <InfoItem icon={Users} label="Seats" value={booking.selected_seats?.join(', ')} />
                <InfoItem icon={Ticket} label="Total Tickets" value={booking.total_seats.toString()} />
            </div>
             <div className="border-t border-dark-700/50 pt-4">
                <p className="text-sm text-neutral-500">Total Amount</p>
                <p className="text-2xl font-bold text-primary-400">IDR {booking.total_amount.toLocaleString()}</p>
            </div>
        </motion.div>
        <motion.div variants={itemVariants} className="card p-6 space-y-4">
            <h2 className="text-xl font-display font-semibold text-white">Customer Info</h2>
            <InfoItem icon={User} label="Name" value={booking.user.fullName} />
            <InfoItem icon={Mail} label="Email" value={booking.user.email} />
            <div>
                <p className="text-sm text-neutral-500 mb-1">Status</p>
                <span className={`status-badge status-${booking.status}`}>{booking.status}</span>
            </div>
        </motion.div>
      </div>
    </motion.div>
  );
}

const InfoItem = ({ icon: Icon, label, value }: { icon: React.ElementType, label: string, value: string | undefined }) => (
    <div>
        <p className="text-sm text-neutral-500 flex items-center space-x-2 mb-1">
            <Icon className="h-4 w-4" />
            <span>{label}</span>
        </p>
        <p className="font-semibold text-white">{value || 'N/A'}</p>
    </div>
)
