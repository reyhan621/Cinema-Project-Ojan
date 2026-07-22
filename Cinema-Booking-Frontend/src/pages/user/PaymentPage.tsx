import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { ArrowLeft, CreditCard, Landmark, QrCode, ShieldCheck, Wallet } from 'lucide-react';
import { motion } from 'framer-motion';
import { IMovie, IShowtime } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import LoadingSpinner from '@/components/LoadingSpinner';
import ErrorMessage from '@/components/ErrorMessage';
import toast from 'react-hot-toast';
import BookingProgress from '@/components/BookingProgress';
import { movieService } from '@/services/movieService';
import { showtimeService } from '@/services/showtimeService';
import { bookingService } from '@/services/bookingService';

interface PaymentForm {
  cardNumber: string;
  expiryDate: string;
  cvv: string;
  cardHolder: string;
}

interface SeatSelectionData {
  movieId: string;
  showtimeId: string;
  selectedSeats: string[];
  totalAmount: number;
}

export default function PaymentPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [bookingData, setBookingData] = useState<{
    movie: IMovie;
    showtime: IShowtime;
    selection: SeatSelectionData;
  } | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'qris' | 'va' | 'wallet'>('qris');

  const {
    register,
    handleSubmit,
  } = useForm<PaymentForm>();

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
    loadBookingData();
  }, []);

  const loadBookingData = async () => {
    try {
      setError('');
      const selectionData = sessionStorage.getItem('seatSelection');
      if (!selectionData) {
        toast.error('No booking data found');
        navigate('/movies');
        return;
      }

      const selection: SeatSelectionData = JSON.parse(selectionData);

      const [movieData, showtimeData] = await Promise.all([
        movieService.getMovieById(selection.movieId),
        showtimeService.getShowtimeById(selection.showtimeId)
      ]);

      setBookingData({
        movie: movieData,
        showtime: showtimeData,
        selection
      });
    } catch (error) {
      console.error('Error loading booking data:', error);
      setError('Unable to load booking data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async () => {
    if (!bookingData || !user) return;

    setLoading(true);
    try {
      const bookingPayload = {
        user: user.id,
        showtime: bookingData.selection.showtimeId,
        total_seats: bookingData.selection.selectedSeats.length,
        total_amount: bookingData.selection.totalAmount,
        selected_seats: bookingData.selection.selectedSeats,
        status: 'confirmed' as const
      };

      await bookingService.createBooking(bookingPayload);
      sessionStorage.removeItem('seatSelection');
      toast.success('Booking confirmed!');
      navigate('/booking-confirmation');
    } catch (error) {
      console.error('Error processing booking:', error);
      toast.error('Booking failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (loading || !bookingData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-dark-950">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-dark-900">
        <ErrorMessage message={error} onRetry={loadBookingData} />
      </div>
    );
  }
  
  const { movie, showtime, selection } = bookingData;

  return (
    <div className="min-h-screen bg-dark-950 text-neutral-100 font-sans">
      <header className="sticky top-0 z-50 border-b border-white/[0.06] bg-dark-950/70 backdrop-blur-2xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
          <button onClick={() => navigate(-1)} className="btn btn-secondary flex items-center space-x-2">
            <ArrowLeft className="h-4 w-4" />
            <span>Back</span>
          </button>
          <BookingProgress currentStep="payment" />
          <div></div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div 
          className="mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <p className="section-eyebrow mb-2">Checkout</p>
          <h1 className="text-3xl font-bold font-display text-white">Complete Payment</h1>
          <p className="mt-2 text-neutral-400">Choose a secure payment method and confirm your e-ticket.</p>
        </motion.div>

        <div className="grid grid-cols-1 gap-8 md:grid-cols-[1.1fr_0.9fr]">
          {/* Payment Form */}
          <motion.div 
            className="glass-panel p-6"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <h2 className="text-2xl font-bold mb-6 text-white">Payment Method</h2>
            <div className="mb-6 grid grid-cols-2 gap-3">
              {[
                { id: 'qris', label: 'QRIS', icon: QrCode },
                { id: 'wallet', label: 'E-wallet', icon: Wallet },
                { id: 'va', label: 'Virtual Account', icon: Landmark },
                { id: 'card', label: 'Credit Card', icon: CreditCard },
              ].map((method) => {
                const Icon = method.icon;
                const active = paymentMethod === method.id;
                return (
                  <button
                    key={method.id}
                    type="button"
                    onClick={() => setPaymentMethod(method.id as typeof paymentMethod)}
                    className={`rounded-xl border p-4 text-left transition-all duration-300 ${
                      active
                        ? 'border-primary-500/50 bg-primary-500/10 text-white shadow-lg shadow-primary-500/10'
                        : 'border-white/[0.06] bg-white/[0.03] text-neutral-300 hover:border-white/[0.1] hover:bg-white/[0.06]'
                    }`}
                  >
                    <Icon className="mb-3 h-5 w-5 text-accent-500" />
                    <span className="font-semibold">{method.label}</span>
                  </button>
                );
              })}
            </div>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {paymentMethod === 'card' ? (
                <>
                  <div>
                    <label className="block text-sm font-medium mb-1.5 text-neutral-300">Card Holder Name</label>
                    <input {...register('cardHolder', { required: true })} className="input" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1.5 text-neutral-300">Card Number</label>
                    <input {...register('cardNumber', { required: true })} className="input" placeholder="0000 0000 0000 0000" />
                  </div>
                  <div className="flex gap-4">
                    <div className="flex-1">
                      <label className="block text-sm font-medium mb-1.5 text-neutral-300">Expiry Date</label>
                      <input {...register('expiryDate', { required: true })} className="input" placeholder="MM/YY" />
                    </div>
                    <div className="flex-1">
                      <label className="block text-sm font-medium mb-1.5 text-neutral-300">CVV</label>
                      <input {...register('cvv', { required: true })} className="input" placeholder="123" />
                    </div>
                  </div>
                </>
              ) : (
                <div className="rounded-xl border border-dashed border-white/[0.1] bg-white/[0.02] p-6 text-center">
                  {paymentMethod === 'qris' && (
                    <>
                      <div className="mx-auto mb-4 grid h-40 w-40 grid-cols-5 gap-1 rounded-xl bg-white p-3">
                        {Array.from({ length: 25 }).map((_, index) => (
                          <span key={index} className={`${index % 3 === 0 || index % 7 === 0 ? 'bg-dark-950' : 'bg-neutral-200'} rounded-sm`} />
                        ))}
                      </div>
                      <h3 className="font-semibold text-white">Scan QRIS to Pay</h3>
                      <p className="mt-2 text-sm text-neutral-400">Use your banking app or e-wallet. This demo confirms after you press the button below.</p>
                    </>
                  )}
                  {paymentMethod === 'wallet' && (
                    <>
                      <Wallet className="mx-auto mb-4 h-12 w-12 text-accent-500" />
                      <h3 className="font-semibold text-white">Choose E-wallet</h3>
                      <p className="mt-2 text-sm text-neutral-400">Supports GoPay, OVO, DANA, and ShopeePay in a real integration.</p>
                    </>
                  )}
                  {paymentMethod === 'va' && (
                    <>
                      <Landmark className="mx-auto mb-4 h-12 w-12 text-accent-500" />
                      <h3 className="font-semibold text-white">Virtual Account</h3>
                      <p className="mt-2 text-sm text-neutral-400">A payment code will be generated after confirmation in a real checkout.</p>
                    </>
                  )}
                </div>
              )}
              <div className="flex items-center gap-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 px-3.5 py-2.5 text-sm text-emerald-300">
                <ShieldCheck className="h-4 w-4 shrink-0" />
                Payment is protected by encrypted checkout simulation.
              </div>
            </form>
          </motion.div>

          {/* Booking Summary */}
          <motion.div 
            className="glass-panel p-6"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <h2 className="text-2xl font-bold mb-6 text-white">Order Summary</h2>
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="relative shrink-0">
                  <div className="absolute -inset-1 bg-gradient-to-b from-primary-500/10 to-transparent rounded-xl blur-lg opacity-50" />
                  <img src={movie.poster_url} alt={movie.title} className="relative w-20 rounded-xl shadow-lg ring-1 ring-white/[0.1]" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg text-white">{movie.title}</h3>
                  {showtime.cinema && (
                    <p className="text-sm text-neutral-400">{showtime.cinema.name} — {showtime.cinema.city}</p>
                  )}
                  <p className="text-sm text-neutral-400">{showtime.hall?.hall_name || 'TBA'}</p>
                </div>
              </div>
              <div className="border-t border-white/[0.06] pt-4 space-y-2.5">
                <div className="flex justify-between"><span className="text-neutral-400">Date</span><span className="text-white">{new Date(showtime.show_date).toLocaleDateString()}</span></div>
                <div className="flex justify-between"><span className="text-neutral-400">Time</span><span className="text-white">{showtime.start_time}</span></div>
                <div className="flex justify-between"><span className="text-neutral-400">Seats</span><span className="text-white">{selection.selectedSeats.join(', ')}</span></div>
              </div>
              <div className="border-t border-white/[0.06] pt-4">
                <div className="flex justify-between font-bold text-xl">
                    <span className="text-white">Total</span>
                    <span className="text-accent-500">IDR {selection.totalAmount.toLocaleString()}</span>
                </div>
              </div>
              <button onClick={handleSubmit(onSubmit)} disabled={loading} className="btn btn-primary w-full text-lg mt-4 py-3.5">
                {loading ? <LoadingSpinner size="sm" /> : 'Confirm and Pay'}
              </button>
            </div>
          </motion.div>
        </div>
      </main>
    </div>
  );
}
