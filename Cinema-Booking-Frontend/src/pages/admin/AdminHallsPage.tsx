import { useEffect, useState } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { Plus, Edit, Trash2, Building, Armchair, LayoutGrid } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import LoadingSpinner, { Skeleton } from '@/components/LoadingSpinner';
import toast from 'react-hot-toast';
import { showtimeService } from '@/services/showtimeService';
import { cinemaService } from '@/services/cinemaService';
import type { ICinema } from '@/types';

export interface IHallLocal {
  _id: string;
  cinema?: ICinema;
  hall_name: string;
  total_seats: number;
  layout_rows: number;
  layout_columns: number;
  createdAt: string;
  updatedAt: string;
}

type HallFormData = {
  cinema_id: string;
  hall_name: string;
  layout_rows: number;
  layout_columns: number;
};

interface HallFormProps {
  hallToEdit: IHallLocal | null;
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

const hallColorPalette = [
  { bg: 'bg-blue-500/15', text: 'text-blue-400', dot: 'bg-blue-400/30 group-hover:bg-blue-400/70' },
  { bg: 'bg-purple-500/15', text: 'text-purple-400', dot: 'bg-purple-400/30 group-hover:bg-purple-400/70' },
  { bg: 'bg-emerald-500/15', text: 'text-emerald-400', dot: 'bg-emerald-400/30 group-hover:bg-emerald-400/70' },
  { bg: 'bg-orange-500/15', text: 'text-orange-400', dot: 'bg-orange-400/30 group-hover:bg-orange-400/70' },
  { bg: 'bg-pink-500/15', text: 'text-pink-400', dot: 'bg-pink-400/30 group-hover:bg-pink-400/70' },
  { bg: 'bg-cyan-500/15', text: 'text-cyan-400', dot: 'bg-cyan-400/30 group-hover:bg-cyan-400/70' },
];

function getHallColor(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return hallColorPalette[Math.abs(hash) % hallColorPalette.length];
}

function MiniSeatMap({ rows, columns, dotClass }: { rows: number; columns: number; dotClass: string }) {
  const displayRows = Math.min(rows || 1, 5);
  const displayCols = Math.min(columns || 1, 12);
  return (
    <div
      className="grid gap-[3px] w-full"
      style={{ gridTemplateColumns: `repeat(${displayCols}, minmax(0, 1fr))` }}
    >
      {Array.from({ length: displayRows * displayCols }).map((_, i) => (
        <div key={i} className={`aspect-square rounded-[2px] transition-colors duration-300 ${dotClass}`} />
      ))}
    </div>
  );
}

const HallForm: React.FC<HallFormProps> = ({ hallToEdit, onClose, onSave }) => {
  const [cinemas, setCinemas] = useState<ICinema[]>([]);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<HallFormData>();

  const watchRows = watch('layout_rows');
  const watchColumns = watch('layout_columns');

  useEffect(() => {
    cinemaService.getCinemas().then(setCinemas).catch(() => {});
  }, []);

  useEffect(() => {
    if (hallToEdit) {
      reset({
        cinema_id: hallToEdit.cinema?._id || '',
        hall_name: hallToEdit.hall_name,
        layout_rows: hallToEdit.layout_rows,
        layout_columns: hallToEdit.layout_columns,
      });
    } else {
      reset({
        cinema_id: '',
        hall_name: '',
        layout_rows: 8,
        layout_columns: 10,
      });
    }
  }, [hallToEdit, reset]);

  const onSubmit: SubmitHandler<HallFormData> = async (formData) => {
    try {
      const selectedCinema = cinemas.find(c => c._id === formData.cinema_id);
      const dataToSubmit = {
        cinema: selectedCinema ? { _id: selectedCinema._id, name: selectedCinema.name, city: selectedCinema.city, createdAt: '', updatedAt: '' } : undefined,
        hall_name: formData.hall_name,
        total_seats: formData.layout_rows * formData.layout_columns,
        layout_rows: Number(formData.layout_rows),
        layout_columns: Number(formData.layout_columns),
      };

      if (hallToEdit) {
        await showtimeService.updateHall(hallToEdit._id, dataToSubmit);
      } else {
        await showtimeService.createHall(dataToSubmit);
      }

      toast.success(`Hall ${hallToEdit ? 'updated' : 'added'} successfully!`);
      onSave();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      toast.error(error.message);
      console.error('Error saving hall:', error);
    }
  };

  return (
    <motion.div
      variants={modalOverlayVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      className="fixed inset-0 bg-dark-950/80 backdrop-blur-sm z-50 flex items-center justify-center"
    >
      <motion.div
        variants={modalContentVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
        className="card w-full max-w-lg p-6 relative"
      >
        <button onClick={onClose} className="absolute top-4 right-4 text-neutral-400 hover:text-white p-1 rounded-xl hover:bg-dark-800/60 transition-all duration-200">&times;</button>
        <h2 className="text-2xl font-display font-bold text-white mb-6">{hallToEdit ? 'Edit Hall' : 'Add New Hall'}</h2>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-neutral-300 mb-1">Cinema</label>
            <select {...register('cinema_id', { required: 'Cinema is required' })} className="input">
              <option value="">Select a cinema</option>
              {cinemas.map(cinema => (
                <option key={cinema._id} value={cinema._id}>{cinema.name} - {cinema.city}</option>
              ))}
            </select>
            {errors.cinema_id && <p className="text-red-400 text-sm mt-1">{errors.cinema_id.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-300 mb-1">Hall Name</label>
            <input {...register('hall_name', { required: 'Hall name is required' })} className="input" placeholder="e.g. Studio 1" />
            {errors.hall_name && <p className="text-red-400 text-sm mt-1">{errors.hall_name.message}</p>}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-1">Rows (max 10)</label>
              <input
                type="number"
                min={1}
                max={10}
                {...register('layout_rows', { required: 'Rows is required', valueAsNumber: true, min: { value: 1, message: 'Min 1' }, max: { value: 10, message: 'Max 10' } })}
                className="input"
              />
              {errors.layout_rows && <p className="text-red-400 text-sm mt-1">{errors.layout_rows.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-1">Columns (max 10)</label>
              <input
                type="number"
                min={1}
                max={10}
                {...register('layout_columns', { required: 'Columns is required', valueAsNumber: true, min: { value: 1, message: 'Min 1' }, max: { value: 10, message: 'Max 10' } })}
                className="input"
              />
              {errors.layout_columns && <p className="text-red-400 text-sm mt-1">{errors.layout_columns.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-1">Total Seats</label>
              <input
                type="number"
                readOnly
                value={(Number(watchRows) || 0) * (Number(watchColumns) || 0)}
                className="input bg-dark-800/40 cursor-not-allowed"
              />
            </div>
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
              {isSubmitting ? <LoadingSpinner size="sm" /> : 'Save Hall'}
            </motion.button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
};

interface DeleteModalProps {
    hall: IHallLocal;
    onClose: () => void;
    onConfirm: (hallId: string) => void;
}

const DeleteConfirmationModal: React.FC<DeleteModalProps> = ({ hall, onClose, onConfirm }) => {
    return (
        <motion.div
          variants={modalOverlayVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          className="fixed inset-0 bg-dark-950/80 backdrop-blur-sm z-50 flex items-center justify-center"
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
                    Are you sure you want to delete "<strong className="text-white">{hall.hall_name}</strong>"? This action cannot be undone.
                </p>
                <div className="flex justify-end space-x-4">
                    <button onClick={onClose} className="btn btn-secondary">
                        Cancel
                    </button>
                    <motion.button
                        onClick={() => onConfirm(hall._id)}
                        className="btn btn-danger"
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.99 }}
                    >
                        Delete Hall
                    </motion.button>
                </div>
            </motion.div>
        </motion.div>
    );
};

export default function AdminHallsPage() {
  const [halls, setHalls] = useState<IHallLocal[]>([]);
  const [loading, setLoading] = useState(true);
  const [, setError] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingHall, setEditingHall] = useState<IHallLocal | null>(null);
  const [hallToDelete, setHallToDelete] = useState<IHallLocal | null>(null);

  useEffect(() => {
    fetchHalls();
  }, []);

  const fetchHalls = async () => {
    setLoading(true);
    try {
      setError('');
      const data = await showtimeService.getHalls();
      setHalls((data || []) as unknown as IHallLocal[]);
    } catch (error) {
      console.error('Error fetching halls:', error);
      setError('Unable to load halls. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (hall: IHallLocal | null) => {
    setEditingHall(hall);
    setIsModalOpen(true);
  };
  
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingHall(null);
  };
  
  const handleSave = () => {
    fetchHalls();
    handleCloseModal();
  };

  const handleDeleteClick = (hall: IHallLocal) => {
    setHallToDelete(hall);
  };

  const handleConfirmDelete = async (hallId: string) => {
    try {
      await showtimeService.deleteHall(hallId);
      toast.success('Hall deleted successfully');
      fetchHalls();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete hall');
    } finally {
      setHallToDelete(null);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-8 w-32 mb-2 rounded-lg" />
            <Skeleton className="h-4 w-48 rounded-lg" />
          </div>
          <Skeleton className="h-10 w-28 rounded-xl" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="card p-6 space-y-4">
              <Skeleton className="h-12 w-12 rounded-xl" />
              <Skeleton className="h-4 w-24 rounded" />
              <Skeleton className="h-16 w-full rounded-lg" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.08, delayChildren: 0.1 } },
  } as const;

  const cardVariants = {
    hidden: { opacity: 0, y: 16 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' } },
  } as const;

  return (
    <div className="space-y-6">
      <AnimatePresence>
        {isModalOpen && (
          <HallForm 
            hallToEdit={editingHall}
            onClose={handleCloseModal}
            onSave={handleSave}
          />
        )}
        {hallToDelete && (
          <DeleteConfirmationModal
            hall={hallToDelete}
            onClose={() => setHallToDelete(null)}
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
          <h1 className="text-3xl font-display font-bold text-white">Halls</h1>
          <p className="text-neutral-400">Manage your cinema halls</p>
        </div>
        <motion.button 
          onClick={() => handleOpenModal(null)}
          className="btn btn-primary flex items-center space-x-2"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <Plus className="h-5 w-5" />
          <span>Add Hall</span>
        </motion.button>
      </motion.div>

      {halls.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-12 card"
        >
          <Building className="h-16 w-16 text-neutral-700 mx-auto mb-4" />
          <p className="text-neutral-400 text-lg mb-4">No halls found</p>
          <motion.button
            onClick={() => handleOpenModal(null)}
            className="btn btn-primary"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            Add Your First Hall
          </motion.button>
        </motion.div>
      ) : (
        <>
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.05 }}
            className="grid grid-cols-1 sm:grid-cols-3 gap-5"
          >
            <div className="card p-5 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary-500/15 flex items-center justify-center">
                <Building className="h-5 w-5 text-primary-400" />
              </div>
              <div>
                <p className="text-xs text-neutral-500">Total Halls</p>
                <p className="text-xl font-bold text-white">{halls.length}</p>
              </div>
            </div>
            <div className="card p-5 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-500/15 flex items-center justify-center">
                <Armchair className="h-5 w-5 text-blue-400" />
              </div>
              <div>
                <p className="text-xs text-neutral-500">Total Capacity</p>
                <p className="text-xl font-bold text-white">{halls.reduce((sum, h) => sum + h.total_seats, 0).toLocaleString()} seats</p>
              </div>
            </div>
            <div className="card p-5 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-500/15 flex items-center justify-center">
                <LayoutGrid className="h-5 w-5 text-purple-400" />
              </div>
              <div>
                <p className="text-xs text-neutral-500">Avg. Seats / Hall</p>
                <p className="text-xl font-bold text-white">{Math.round(halls.reduce((sum, h) => sum + h.total_seats, 0) / halls.length).toLocaleString()}</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5"
          >
          {halls.map((hall) => {
            const palette = getHallColor(hall.hall_name);
            return (
            <motion.div
              key={hall._id}
              variants={cardVariants}
              whileHover={{ y: -3, transition: { duration: 0.2 } }}
              className="group card p-6 flex flex-col"
            >
              <div className="flex-grow">
                <div className="flex items-center justify-between mb-5">
                    <div className="flex items-center space-x-3">
                    <div className={`w-12 h-12 ${palette.bg} rounded-xl flex items-center justify-center`}>
                        <Building className={`h-6 w-6 ${palette.text}`} />
                    </div>
                    <div>
                        <h3 className="text-lg font-display font-semibold text-white">{hall.hall_name}</h3>
                        <p className="text-sm text-neutral-500 truncate">
                          {hall.cinema ? `${hall.cinema.name} - ${hall.cinema.city}` : 'No cinema assigned'}
                        </p>
                    </div>
                    </div>
                </div>

                <div className="mb-5">
                  <MiniSeatMap rows={hall.layout_rows} columns={hall.layout_columns} dotClass={palette.dot} />
                </div>

                <div className="space-y-3">
                    <div className="flex justify-between">
                    <span className="text-neutral-500 text-sm flex items-center gap-1.5"><Armchair className="h-3.5 w-3.5" /> Total Seats</span>
                    <span className="text-white font-medium text-sm">{hall.total_seats}</span>
                    </div>
                    <div className="flex justify-between">
                    <span className="text-neutral-500 text-sm">Layout</span>
                    <span className="text-white font-medium text-sm">
                        {hall.layout_rows} &times; {hall.layout_columns}
                    </span>
                    </div>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-dark-700/50 flex items-center space-x-2">
                <motion.button 
                  onClick={() => handleOpenModal(hall)}
                  className="btn btn-secondary flex-1 flex items-center justify-center space-x-2"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Edit className="h-4 w-4" />
                  <span>Edit</span>
                </motion.button>
                <motion.button
                  onClick={() => handleDeleteClick(hall)}
                  className="btn btn-danger flex-1 flex items-center justify-center space-x-2"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Trash2 className="h-4 w-4" />
                  <span>Delete</span>
                </motion.button>
              </div>
            </motion.div>
          )})}
          </motion.div>
        </>
      )}
    </div>
  )
}
