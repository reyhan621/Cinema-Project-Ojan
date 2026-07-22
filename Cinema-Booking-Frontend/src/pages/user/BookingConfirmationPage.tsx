import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, CalendarDays, CheckCircle, MapPin, Printer, QrCode, Ticket } from 'lucide-react';
import { motion } from 'framer-motion';
import { IBooking } from '@/types';
import LoadingSpinner from '@/components/LoadingSpinner';
import ErrorMessage from '@/components/ErrorMessage';
import BookingProgress from '@/components/BookingProgress';
import { bookingService } from '@/services/bookingService';

export default function BookingConfirmationPage() {
  const navigate = useNavigate();
  const [booking, setBooking] = useState<IBooking | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const bookingId = bookingService.getConfirmedBookingId();
    if (bookingId) {
      bookingService.getBookingById(bookingId)
        .then((data) => {
          setBooking(data);
          bookingService.clearConfirmedBookingId();
        })
        .catch(() => setError('Unable to load booking confirmation. Please try again.'))
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
      navigate('/my-bookings');
    }
  }, [navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-dark-950">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-dark-900">
        <ErrorMessage
          message={error}
          onRetry={() => navigate('/my-bookings')}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-950 text-neutral-100 font-sans">
      <header className="sticky top-0 z-50 border-b border-white/[0.06] bg-dark-950/70 backdrop-blur-2xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
          <Link to="/" className="btn btn-secondary flex items-center space-x-2">
            <ArrowLeft className="h-4 w-4" />
            <span>Home</span>
          </Link>
          <BookingProgress currentStep="finish" />
          <div></div>
        </div>
      </header>
      
      <main className="mx-auto max-w-3xl px-4 py-12 text-center sm:px-6 lg:px-8">
        {/* Print-only header */}
        <div className="print-only hidden">
          <h1 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '8px', color: '#111' }}>CineLux Cinema Ticket</h1>
          <p style={{ fontSize: '12px', color: '#666', marginBottom: '16px' }}>Please present this ticket at the cinema entrance</p>
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
        >
          <div className="relative inline-block mb-6">
            <div className="absolute -inset-4 bg-gradient-to-b from-emerald-500/20 via-emerald-500/5 to-transparent rounded-full blur-2xl opacity-60" />
            <CheckCircle className="relative h-20 w-20 text-emerald-500" />
          </div>
          <p className="section-eyebrow mb-3">Payment successful</p>
          <h1 className="text-4xl font-display font-bold mb-3 text-white">Your Ticket Is Ready</h1>
          <p className="text-neutral-400 mb-8">Show this e-ticket at the cinema entrance before entering the studio.</p>
        </motion.div>
        
        {booking && (
          <motion.div 
            className="overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.03] text-left shadow-premium backdrop-blur-sm"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <div className="grid grid-cols-1 md:grid-cols-[180px_1fr]">
              <img src={booking.showtime.movie.poster_url} alt={booking.showtime.movie.title} className="h-full min-h-64 w-full object-cover" />
              <div className="p-6">
                <div className="mb-5 flex flex-col justify-between gap-4 sm:flex-row">
                  <div>
                    <span className="cinema-badge mb-3 bg-primary-600/90">
                      <Ticket className="mr-1 h-3 w-3" />
                      E-ticket
                    </span>
                    <h2 className="text-2xl font-bold text-white">{booking.showtime.movie.title}</h2>
                    <p className="text-neutral-400 mt-1">{booking.showtime.movie.genre} &middot; {booking.showtime.movie.duration} mins</p>
                  </div>
                  <div className="rounded-xl bg-white p-3 shadow-lg shrink-0">
                    <div className="grid h-24 w-24 grid-cols-5 gap-1">
                      {Array.from({ length: 25 }).map((_, index) => (
                        <span key={index} className={`${index % 2 === 0 || index % 7 === 0 ? 'bg-dark-950' : 'bg-neutral-200'} rounded-sm`} />
                      ))}
                    </div>
                  </div>
                </div>
                <div className="my-5 border-t border-dashed border-white/[0.1]" />
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                  <div><p className="text-sm text-neutral-400">Cinema</p><p className="flex items-center gap-1 font-semibold text-white"><MapPin className="h-4 w-4 text-accent-500" /> {booking.showtime?.cinema?.name || 'N/A'}</p></div>
                  <div><p className="text-sm text-neutral-400">City</p><p className="font-semibold text-white">{booking.showtime?.cinema?.city || 'N/A'}</p></div>
                  <div><p className="text-sm text-neutral-400">Hall</p><p className="font-semibold text-white">{booking.showtime.hall.hall_name}</p></div>
                  <div><p className="text-sm text-neutral-400">Date</p><p className="flex items-center gap-1 font-semibold text-white"><CalendarDays className="h-4 w-4 text-accent-500" /> {new Date(booking.showtime.show_date).toLocaleDateString()}</p></div>
                  <div><p className="text-sm text-neutral-400">Time</p><p className="font-semibold text-white">{booking.showtime.start_time}{booking.showtime.end_time ? ` – ${booking.showtime.end_time}` : ''}</p></div>
                  <div><p className="text-sm text-neutral-400">Seats</p><p className="font-semibold text-white">{booking.selected_seats.join(', ')}</p></div>
                  <div><p className="text-sm text-neutral-400">Price</p><p className="font-semibold text-white">IDR {booking.showtime.ticket_price.toLocaleString()} x {booking.total_seats}</p></div>
                  <div><p className="text-sm text-neutral-400">Booking ID</p><p className="font-semibold text-white">#{booking._id.slice(-6).toUpperCase()}</p></div>
                  <div><p className="text-sm text-neutral-400">Booking Date</p><p className="font-semibold text-white">{new Date(booking.booking_date).toLocaleDateString()}</p></div>
                </div>
                <div className="mt-6 flex items-center justify-between rounded-xl bg-white/[0.03] border border-white/[0.06] p-4">
                  <span className="text-neutral-400">Total Paid</span>
                  <span className="text-xl font-black text-accent-500">IDR {booking.total_amount.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </motion.div>
        )}
        
        <motion.div 
          className="mt-8 flex flex-col sm:flex-row justify-center gap-3"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
            {booking && (
              <button
                onClick={() => window.print()}
                className="btn btn-secondary w-full max-w-xs text-lg no-print"
              >
                <Printer className="h-5 w-5" />
                Print Ticket
              </button>
            )}
            <Link to="/my-bookings" className="btn btn-primary w-full max-w-xs text-lg no-print">
                <QrCode className="h-5 w-5" />
                View My Bookings
            </Link>
        </motion.div>
      </main>
    </div>
  );
}
