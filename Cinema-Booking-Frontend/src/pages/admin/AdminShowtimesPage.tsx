import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useForm, SubmitHandler } from 'react-hook-form';
import { Plus, Edit, Trash2, Calendar } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import LoadingSpinner from '@/components/LoadingSpinner';
import toast from 'react-hot-toast';
import { movieService } from '@/services/movieService';
import { showtimeService } from '@/services/showtimeService';
import { cinemaService } from '@/services/cinemaService';
import { bookingService } from '@/services/bookingService';
import type { IHall, IMovie, IShowtime, ICinema, ShowtimeInput } from '@/types';

type ShowtimeFormData = {
  movie_id: string;
  cinema_id: string;
  hall_id: string;
  show_date: string;
  start_time: string;
  end_time: string;
  ticket_price: number;
};

interface ShowtimeFormProps {
  showtimeToEdit: IShowtime | null;
  onClose: () => void;
  onSave: () => void;
}

const modalOverlayVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.2 } },
  exit: { opacity: 0, transition: { duration: 0.15 } },
} as const;

const modalContentVariants = {
  hidden: { opacity: 0, scale: 0.95, y: 12 },
  visible: { opacity: 1, scale: 1, y: 0, transition: { type: 'spring', stiffness: 400, damping: 30 } },
  exit: { opacity: 0, scale: 0.95, y: 12, transition: { duration: 0.15 } },
} as const;

const ShowtimeForm: React.FC<ShowtimeFormProps> = ({ showtimeToEdit, onClose, onSave }) => {
  const [movies, setMovies] = useState<IMovie[]>([]);
  const [cinemas, setCinemas] = useState<ICinema[]>([]);
  const [halls, setHalls] = useState<IHall[]>([]);
  const [selectedCinemaId, setSelectedCinemaId] = useState('');

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<ShowtimeFormData>();

  const watchCinemaId = watch('cinema_id');

  useEffect(() => {
    const fetchPrerequisites = async () => {
      try {
        const [moviesData, cinemasData] = await Promise.all([
          movieService.getMovies(),
          cinemaService.getCinemas(),
        ]);
        setMovies(moviesData);
        setCinemas(cinemasData);
      } catch {
        toast.error('Could not load movies or cinemas.');
      }
    };
    fetchPrerequisites();
  }, []);

  useEffect(() => {
    if (watchCinemaId && watchCinemaId !== selectedCinemaId) {
      setSelectedCinemaId(watchCinemaId);
      setValue('hall_id', '');
      if (watchCinemaId) {
        showtimeService.getHalls(watchCinemaId).then(setHalls).catch(() => setHalls([]));
      } else {
        setHalls([]);
      }
    }
  }, [watchCinemaId, selectedCinemaId, setValue]);

  useEffect(() => {
    if (showtimeToEdit) {
      const cinemaId = showtimeToEdit.cinema?._id || '';
      setSelectedCinemaId(cinemaId);
      reset({
        movie_id: showtimeToEdit.movie._id,
        cinema_id: cinemaId,
        hall_id: showtimeToEdit.hall._id,
        show_date: new Date(showtimeToEdit.show_date).toISOString().split('T')[0],
        start_time: showtimeToEdit.start_time,
        end_time: showtimeToEdit.end_time,
        ticket_price: showtimeToEdit.ticket_price,
      });
      if (cinemaId) {
        showtimeService.getHalls(cinemaId).then(setHalls).catch(() => setHalls([]));
      }
    } else {
      reset();
      setHalls([]);
      setSelectedCinemaId('');
    }
  }, [showtimeToEdit, reset]);

  const onSubmit: SubmitHandler<ShowtimeFormData> = async (formData) => {
    try {
      const dataToSubmit: ShowtimeInput = {
        movie: formData.movie_id,
        cinema: formData.cinema_id,
        hall: formData.hall_id,
        show_date: formData.show_date,
        start_time: formData.start_time,
        end_time: formData.end_time,
        ticket_price: Number(formData.ticket_price),
      };

      if (showtimeToEdit) {
        await showtimeService.updateShowtime(showtimeToEdit._id, dataToSubmit);
      } else {
        await showtimeService.createShowtime(dataToSubmit);
      }

      toast.success(`Showtime ${showtimeToEdit ? 'updated' : 'added'} successfully!`);
      onSave();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  return (
    <motion.div
      variants={modalOverlayVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      className="fixed inset-0 bg-dark-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
    >
      <motion.div
        variants={modalContentVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
        className="card w-full max-w-2xl p-6 relative max-h-[90vh] overflow-y-auto"
      >
        <button onClick={onClose} className="absolute top-4 right-4 text-neutral-400 hover:text-white p-1 rounded-xl hover:bg-dark-800/60 transition-all duration-200">&times;</button>
        <h2 className="text-2xl font-display font-bold text-white mb-6">{showtimeToEdit ? 'Edit Showtime' : 'Add New Showtime'}</h2>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-1">Cinema</label>
              <select {...register('cinema_id', { required: 'Cinema is required' })} className="input">
                <option value="">Select a cinema</option>
                {cinemas.map(cinema => <option key={cinema._id} value={cinema._id}>{cinema.name} - {cinema.city}</option>)}
              </select>
              {errors.cinema_id && <p className="text-red-400 text-sm mt-1">{errors.cinema_id.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-1">Hall</label>
              <select
                {...register('hall_id', { required: 'Hall is required' })}
                className="input"
                disabled={!watchCinemaId}
              >
                <option value="">
                  {!watchCinemaId ? 'Select cinema first' : halls.length === 0 ? 'No halls available' : 'Select a hall'}
                </option>
                {halls.map(hall => <option key={hall._id} value={hall._id}>{hall.hall_name}</option>)}
              </select>
              {errors.hall_id && <p className="text-red-400 text-sm mt-1">{errors.hall_id.message}</p>}
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-1">Movie</label>
              <select {...register('movie_id', { required: 'Movie is required' })} className="input">
                <option value="">Select a movie</option>
                {movies.map(movie => <option key={movie._id} value={movie._id}>{movie.title}</option>)}
              </select>
              {errors.movie_id && <p className="text-red-400 text-sm mt-1">{errors.movie_id.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-1">Ticket Price (IDR)</label>
              <input type="number" {...register('ticket_price', { required: 'Price is required', min: { value: 1, message: 'Price must be greater than 0' } })} className="input" />
              {errors.ticket_price && <p className="text-red-400 text-sm mt-1">{errors.ticket_price.message}</p>}
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-1">Show Date</label>
              <input type="date" {...register('show_date', { required: 'Show date is required' })} className="input" />
              {errors.show_date && <p className="text-red-400 text-sm mt-1">{errors.show_date.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-1">Start Time</label>
              <input type="time" {...register('start_time', { required: 'Start time is required' })} className="input" />
              {errors.start_time && <p className="text-red-400 text-sm mt-1">{errors.start_time.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-1">End Time</label>
              <input type="time" {...register('end_time', { required: 'End time is required' })} className="input" />
              {errors.end_time && <p className="text-red-400 text-sm mt-1">{errors.end_time.message}</p>}
            </div>
          </div>
          <div className="rounded-xl border border-primary-500/15 bg-primary-500/[0.06] px-4 py-3 text-xs text-neutral-300">
            <span className="font-semibold text-primary-300">How categories work:</span>{' '}
            the show date decides where the movie appears for users — a date within the next
            month lists it under <span className="font-medium text-white">Now Showing</span>;
            a date roughly 1–3 months out lists it under{' '}
            <span className="font-medium text-white">Coming Soon</span>.
          </div>
          <div className="flex justify-end space-x-4 pt-4">
            <button type="button" onClick={onClose} className="btn btn-secondary">Cancel</button>
            <motion.button
              type="submit"
              disabled={isSubmitting}
              className="btn btn-primary"
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
            >
              {isSubmitting ? <LoadingSpinner size="sm" /> : 'Save Showtime'}
            </motion.button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
};

interface DeleteModalProps {
  showtime: IShowtime;
  onClose: () => void;
  onConfirm: (showtimeId: string) => void;
}

const DeleteConfirmationModal: React.FC<DeleteModalProps> = ({ showtime, onClose, onConfirm }) => (
  <motion.div
    variants={modalOverlayVariants}
    initial="hidden"
    animate="visible"
    exit="exit"
    className="fixed inset-0 bg-dark-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
  >
    <motion.div
      variants={modalContentVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      className="card p-6 w-full max-w-md"
    >
      <h2 className="text-xl font-display font-bold text-white mb-4">Confirm Deletion</h2>
      <p className="text-neutral-300 mb-6">
        Are you sure you want to delete the showtime for "<strong className="text-white">{showtime.movie?.title}</strong>" on {new Date(showtime.show_date).toLocaleDateString()} at {showtime.start_time}?
      </p>
      <div className="flex justify-end space-x-4">
        <button onClick={onClose} className="btn btn-secondary">Cancel</button>
        <motion.button
          onClick={() => onConfirm(showtime._id)}
          className="btn btn-danger"
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
        >
          Delete Showtime
        </motion.button>
      </div>
    </motion.div>
  </motion.div>
);

export default function AdminShowtimesPage() {
  const [showtimes, setShowtimes] = useState<IShowtime[]>([]);
  const [loading, setLoading] = useState(true);
  const [, setError] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingShowtime, setEditingShowtime] = useState<IShowtime | null>(null);
  const [showtimeToDelete, setShowtimeToDelete] = useState<IShowtime | null>(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const [movieFilter, setMovieFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [seatCounts, setSeatCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    fetchShowtimes();
  }, []);

  const fetchShowtimes = async () => {
    setLoading(true);
    try {
      setError('');
      const data = await showtimeService.getShowtimes();
      setShowtimes(data || []);
      const counts = await Promise.all(
        data.map(async (showtime: IShowtime) => [showtime._id, (await bookingService.getSeatAvailability(showtime._id)).length] as const),
      );
      setSeatCounts(Object.fromEntries(counts));
    } catch {
      setError('Unable to load showtimes. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (showtime: IShowtime | null) => {
    setEditingShowtime(showtime);
    setIsModalOpen(true);
  };

  useEffect(() => {
    if (searchParams.get('openModal') === 'true') {
      handleOpenModal(null);
      searchParams.delete('openModal');
      setSearchParams(searchParams);
    }
  }, []);

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingShowtime(null);
  };

  const handleSave = () => {
    fetchShowtimes();
    handleCloseModal();
  };

  const handleConfirmDelete = async (showtimeId: string) => {
    try {
      await showtimeService.deleteShowtime(showtimeId);
      toast.success('Showtime deleted successfully');
      fetchShowtimes();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete showtime');
    } finally {
      setShowtimeToDelete(null);
    }
  };

  const filteredShowtimes = showtimes.filter((showtime) => {
    const matchesMovie = !movieFilter || showtime.movie?._id === movieFilter;
    const matchesDate = !dateFilter || showtime.show_date.startsWith(dateFilter);
    return matchesMovie && matchesDate;
  });

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

  return (
    <div className="space-y-6">
      <AnimatePresence>
        {isModalOpen && <ShowtimeForm showtimeToEdit={editingShowtime} onClose={handleCloseModal} onSave={handleSave} />}
        {showtimeToDelete && (
          <DeleteConfirmationModal
            showtime={showtimeToDelete}
            onClose={() => setShowtimeToDelete(null)}
            onConfirm={handleConfirmDelete}
          />
        )}
      </AnimatePresence>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-3xl font-display font-bold text-white">Showtimes</h1>
          <p className="text-neutral-400">Manage movie showtimes</p>
        </div>
        <motion.button
          onClick={() => handleOpenModal(null)}
          className="btn btn-primary flex items-center space-x-2"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <Plus className="h-5 w-5" />
          <span>Add Showtime</span>
        </motion.button>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
        className="grid grid-cols-1 md:grid-cols-2 gap-4"
      >
        <select value={movieFilter} onChange={(event) => setMovieFilter(event.target.value)} className="input">
          <option value="">All Movies</option>
          {[...new Map(showtimes.map((showtime) => [showtime.movie?._id, showtime.movie])).values()].map((movie) => (
            <option key={movie?._id} value={movie?._id}>{movie?.title}</option>
          ))}
        </select>
        <input type="date" value={dateFilter} onChange={(event) => setDateFilter(event.target.value)} className="input" />
      </motion.div>

      {filteredShowtimes.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-12 card"
        >
          <Calendar className="h-16 w-16 text-neutral-700 mx-auto mb-4" />
          <p className="text-neutral-400 text-lg mb-4">No showtimes found</p>
          <motion.button
            onClick={() => handleOpenModal(null)}
            className="btn btn-primary"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            Add Your First Showtime
          </motion.button>
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
                  <th className="px-6 py-3.5 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Movie</th>
                  <th className="px-6 py-3.5 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Cinema</th>
                  <th className="px-6 py-3.5 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Hall</th>
                  <th className="px-6 py-3.5 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Date & Time</th>
                  <th className="px-6 py-3.5 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Price</th>
                  <th className="px-6 py-3.5 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Seats</th>
                  <th className="px-6 py-3.5 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dark-700/50">
                {filteredShowtimes.map((showtime) => (
                  <motion.tr
                    key={showtime._id}
                    variants={rowVariants}
                    className="hover:bg-dark-800/40 transition-colors duration-150"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-white max-w-xs truncate">{showtime.movie?.title}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-neutral-300">{showtime.cinema?.name || '-'}</div>
                      <div className="text-xs text-neutral-500">{showtime.cinema?.city || ''}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="cinema-badge bg-blue-500/15 text-blue-400">
                        {showtime.hall?.hall_name || '-'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-300">
                      <div>{new Date(showtime.show_date).toLocaleDateString()}</div>
                      <div className="text-neutral-500">{showtime.start_time} - {showtime.end_time}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-primary-400">
                      IDR {showtime.ticket_price.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-300">
                      {seatCounts[showtime._id] || 0} booked / {(showtime.hall?.total_seats || 80) - (seatCounts[showtime._id] || 0)} available
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center space-x-2">
                        <motion.button
                          onClick={() => handleOpenModal(showtime)}
                          className="text-green-400 hover:text-green-300 p-2 rounded-xl hover:bg-dark-700/60 transition-all duration-200"
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                        >
                          <Edit className="h-4 w-4" />
                        </motion.button>
                        <motion.button
                          onClick={() => setShowtimeToDelete(showtime)}
                          className="text-red-400 hover:text-red-300 p-2 rounded-xl hover:bg-dark-700/60 transition-all duration-200"
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </motion.button>
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
