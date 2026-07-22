import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Eye, CheckCircle, XCircle, Download } from 'lucide-react';
import { motion } from 'framer-motion';
import LoadingSpinner from '@/components/LoadingSpinner';
import toast from 'react-hot-toast';
import { adminService } from '@/services/adminService';
import { movieService } from '@/services/movieService';
import type { IBooking, IMovie } from '@/types';

export default function AdminBookingsPage() {
  const [bookings, setBookings] = useState<IBooking[]>([]);
  const [movies, setMovies] = useState<IMovie[]>([]);
  const [loading, setLoading] = useState(true);
  const [, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [movieFilter, setMovieFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');

  useEffect(() => {
    fetchBookings();
    movieService.getMovies().then(setMovies);
  }, []);

  const fetchBookings = async () => {
    setLoading(true);
    try {
      setError('');
      setBookings(await adminService.getAllBookings());
    } catch (error) {
      console.error('Error fetching bookings:', error);
      setError('Unable to load bookings. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateBookingStatus = async (bookingId: string, status: 'confirmed' | 'cancelled') => {
    try {
      await adminService.updateBookingStatus(bookingId, status);
      toast.success(`Booking ${status} successfully`);
      fetchBookings();
    } catch (error) {
      toast.error('Failed to update booking status');
      console.error('Error updating booking status:', error);
    }
  };

  const handleExport = () => {
    const csvRows = [
      ['Booking ID', 'Customer', 'Movie', 'Show Date', 'Start Time', 'Seats', 'Amount', 'Status'],
      ...displayBookings.map(b => [
        b._id,
        b.user.fullName,
        b.showtime.movie.title,
        b.showtime.show_date,
        b.showtime.start_time,
        b.selected_seats.join(', '),
        b.total_amount,
        b.status
      ])
    ];

    const csvContent = csvRows.map(row => row.map(String).map(val => `"${val}"`).join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'bookings_export.csv';
    a.click();
    URL.revokeObjectURL(url);
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

  const displayBookings = bookings.filter((booking) => {
    const query = searchTerm.toLowerCase();
    const matchesSearch = !query ||
      booking._id.toLowerCase().includes(query) ||
      booking.user.fullName.toLowerCase().includes(query) ||
      booking.user.email.toLowerCase().includes(query) ||
      booking.showtime.movie.title.toLowerCase().includes(query);
    const matchesStatus = statusFilter === 'all' || booking.status === statusFilter;
    const matchesMovie = !movieFilter || booking.showtime.movie._id === movieFilter;
    const matchesDate = !dateFilter || booking.showtime.show_date.startsWith(dateFilter);
    return matchesSearch && matchesStatus && matchesMovie && matchesDate;
  });

  const totalRevenue = bookings
    .filter(booking => booking.status === 'confirmed')
    .reduce((sum, booking) => sum + booking.total_amount, 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.04 } },
  } as const;

  const rowVariants = {
    hidden: { opacity: 0, y: 8 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.25 } },
  } as const;

  const itemVariants = {
    hidden: { opacity: 0, y: 12 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: 'easeOut' } },
  } as const;

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-3xl font-display font-bold text-white">Bookings</h1>
          <p className="text-neutral-400">Manage customer bookings</p>
        </div>
        <motion.button
          onClick={handleExport}
          className="btn btn-secondary flex items-center space-x-2"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <Download className="h-4 w-4" />
          <span>Export</span>
        </motion.button>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
        className="grid grid-cols-1 md:grid-cols-4 gap-4"
      >
        <input value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} className="input" placeholder="Search bookings..." />
        <select value={movieFilter} onChange={(event) => setMovieFilter(event.target.value)} className="input">
          <option value="">All Movies</option>
          {movies.map((movie) => <option key={movie._id} value={movie._id}>{movie.title}</option>)}
        </select>
        <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="input">
          <option value="all">All Status</option>
          <option value="pending">Pending</option>
          <option value="confirmed">Confirmed</option>
          <option value="cancelled">Cancelled</option>
        </select>
        <input type="date" value={dateFilter} onChange={(event) => setDateFilter(event.target.value)} className="input" />
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
        <motion.div variants={itemVariants} initial="hidden" animate="visible" className="card p-6">
          <p className="text-sm text-neutral-500">Total Bookings</p>
          <p className="text-2xl font-bold text-white">{bookings.length}</p>
        </motion.div>
        <motion.div variants={itemVariants} initial="hidden" animate="visible" transition={{ delay: 0.05 }} className="card p-6">
          <p className="text-sm text-neutral-500">Confirmed</p>
          <p className="text-2xl font-bold text-green-400">{bookings.filter(b => b.status === 'confirmed').length}</p>
        </motion.div>
        <motion.div variants={itemVariants} initial="hidden" animate="visible" transition={{ delay: 0.1 }} className="card p-6">
          <p className="text-sm text-neutral-500">Pending</p>
          <p className="text-2xl font-bold text-yellow-400">{bookings.filter(b => b.status === 'pending').length}</p>
        </motion.div>
        <motion.div variants={itemVariants} initial="hidden" animate="visible" transition={{ delay: 0.15 }} className="card p-6">
          <p className="text-sm text-neutral-500">Total Revenue</p>
          <p className="text-2xl font-bold text-primary-400">IDR {totalRevenue.toLocaleString()}</p>
        </motion.div>
      </div>

      {displayBookings.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-12 card"
        >
          <p className="text-neutral-400 text-lg">No bookings found for the selected filters.</p>
        </motion.div>
      ) : (
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="card overflow-hidden"
        >
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-dark-800/60">
                <tr>
                  <th className="px-6 py-3.5 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Booking ID</th>
                  <th className="px-6 py-3.5 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Customer</th>
                  <th className="px-6 py-3.5 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Movie</th>
                  <th className="px-6 py-3.5 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Date & Time</th>
                  <th className="px-6 py-3.5 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Seats</th>
                  <th className="px-6 py-3.5 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Amount</th>
                  <th className="px-6 py-3.5 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3.5 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dark-700/50">
                {displayBookings.map((booking) => (
                  <motion.tr
                    key={booking._id}
                    variants={rowVariants}
                    className="hover:bg-dark-800/40 transition-colors duration-150"
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">#{booking._id.slice(-6)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-300">
                      <div>{booking.user.fullName}</div>
                      <div className="text-neutral-500">{booking.user.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <img
                          src={booking.showtime?.movie?.poster_url || 'https://placehold.co/60x90/171717/525252?text=N/A'}
                          alt={booking.showtime?.movie?.title}
                          className="w-10 h-15 object-cover rounded-xl"
                        />
                        <div className="ml-3">
                          <div className="text-sm font-medium text-white">{booking.showtime?.movie?.title}</div>
                          <div className="text-sm text-neutral-500">{booking.showtime?.hall?.hall_name || 'N/A'}</div>
                          {booking.showtime?.cinema && (
                            <div className="text-xs text-neutral-500">{booking.showtime.cinema.name} — {booking.showtime.cinema.city}</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-300">
                      <div>{new Date(booking.showtime?.show_date || '').toLocaleDateString()}</div>
                      <div className="text-neutral-500">{booking.showtime?.start_time}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-300">{booking.selected_seats?.join(', ')}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-primary-400">IDR {booking.total_amount.toLocaleString()}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={getStatusBadge(booking.status)}>
                        {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center space-x-2">
                        <Link to={`/admin/bookings/${booking._id}`} className="text-blue-400 hover:text-blue-300 p-1.5 rounded-xl hover:bg-dark-700/60 transition-all duration-200">
                          <Eye className="h-4 w-4" />
                        </Link>
                        {booking.status === 'pending' && (
                          <>
                            <motion.button
                              onClick={() => handleUpdateBookingStatus(booking._id, 'confirmed')}
                              className="text-green-400 hover:text-green-300 p-1.5 rounded-xl hover:bg-dark-700/60 transition-all duration-200"
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                            >
                              <CheckCircle className="h-4 w-4" />
                            </motion.button>
                            <motion.button
                              onClick={() => handleUpdateBookingStatus(booking._id, 'cancelled')}
                              className="text-red-400 hover:text-red-300 p-1.5 rounded-xl hover:bg-dark-700/60 transition-all duration-200"
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                            >
                              <XCircle className="h-4 w-4" />
                            </motion.button>
                          </>
                        )}
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}
    </div>
  );
}
