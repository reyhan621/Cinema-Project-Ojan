import { useEffect, useState } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { Plus, Edit, Trash2, Landmark } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import LoadingSpinner, { Skeleton } from '@/components/LoadingSpinner';
import toast from 'react-hot-toast';
import { cinemaService } from '@/services/cinemaService';
import type { ICinema } from '@/types';

type CinemaFormData = {
  name: string;
  city: string;
};

interface CinemaFormProps {
  cinemaToEdit: ICinema | null;
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

const CinemaForm: React.FC<CinemaFormProps> = ({ cinemaToEdit, onClose, onSave }) => {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CinemaFormData>();

  useEffect(() => {
    if (cinemaToEdit) {
      reset({ name: cinemaToEdit.name, city: cinemaToEdit.city });
    } else {
      reset({ name: '', city: '' });
    }
  }, [cinemaToEdit, reset]);

  const onSubmit: SubmitHandler<CinemaFormData> = async (formData) => {
    try {
      if (cinemaToEdit) {
        await cinemaService.updateCinema(cinemaToEdit._id, formData);
      } else {
        await cinemaService.createCinema(formData);
      }
      toast.success(`Cinema ${cinemaToEdit ? 'updated' : 'added'} successfully!`);
      onSave();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      toast.error(cinemaService.getBackendError(error));
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
        <h2 className="text-2xl font-display font-bold text-white mb-6">{cinemaToEdit ? 'Edit Cinema' : 'Add New Cinema'}</h2>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-neutral-300 mb-1">Cinema Name</label>
            <input {...register('name', { required: 'Cinema name is required' })} className="input" placeholder="e.g. CineLux Central" />
            {errors.name && <p className="text-red-400 text-sm mt-1">{errors.name.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-300 mb-1">City</label>
            <input {...register('city', { required: 'City is required' })} className="input" placeholder="e.g. Jakarta" />
            {errors.city && <p className="text-red-400 text-sm mt-1">{errors.city.message}</p>}
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
              {isSubmitting ? <LoadingSpinner size="sm" /> : 'Save Cinema'}
            </motion.button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
};

interface DeleteModalProps {
  cinema: ICinema;
  onClose: () => void;
  onConfirm: (cinemaId: string) => void;
}

const DeleteConfirmationModal: React.FC<DeleteModalProps> = ({ cinema, onClose, onConfirm }) => (
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
        Are you sure you want to delete "<strong className="text-white">{cinema.name}</strong>" in {cinema.city}? This action cannot be undone.
      </p>
      <div className="flex justify-end space-x-4">
        <button onClick={onClose} className="btn btn-secondary">Cancel</button>
        <motion.button
          onClick={() => onConfirm(cinema._id)}
          className="btn btn-danger"
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
        >
          Delete Cinema
        </motion.button>
      </div>
    </motion.div>
  </motion.div>
);

export default function AdminCinemasPage() {
  const [cinemas, setCinemas] = useState<ICinema[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCinema, setEditingCinema] = useState<ICinema | null>(null);
  const [cinemaToDelete, setCinemaToDelete] = useState<ICinema | null>(null);

  useEffect(() => {
    fetchCinemas();
  }, []);

  const fetchCinemas = async () => {
    setLoading(true);
    try {
      setError('');
      const data = await cinemaService.getCinemas();
      setCinemas(data || []);
    } catch (err) {
      console.error('Error fetching cinemas:', err);
      setError('Unable to load cinemas. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (cinema: ICinema | null) => {
    setEditingCinema(cinema);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingCinema(null);
  };

  const handleSave = () => {
    fetchCinemas();
    handleCloseModal();
  };

  const handleConfirmDelete = async (cinemaId: string) => {
    try {
      await cinemaService.deleteCinema(cinemaId);
      toast.success('Cinema deleted successfully');
      fetchCinemas();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      toast.error(cinemaService.getBackendError(error));
    } finally {
      setCinemaToDelete(null);
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
              <Skeleton className="h-4 w-32 rounded" />
              <Skeleton className="h-3 w-24 rounded" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12 card">
        <p className="text-red-400 mb-4">{error}</p>
        <button onClick={fetchCinemas} className="btn btn-primary">Retry</button>
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
          <CinemaForm
            cinemaToEdit={editingCinema}
            onClose={handleCloseModal}
            onSave={handleSave}
          />
        )}
        {cinemaToDelete && (
          <DeleteConfirmationModal
            cinema={cinemaToDelete}
            onClose={() => setCinemaToDelete(null)}
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
          <h1 className="text-3xl font-display font-bold text-white">Cinemas</h1>
          <p className="text-neutral-400">Manage your cinema locations</p>
        </div>
        <motion.button
          onClick={() => handleOpenModal(null)}
          className="btn btn-primary flex items-center space-x-2"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <Plus className="h-5 w-5" />
          <span>Add Cinema</span>
        </motion.button>
      </motion.div>

      {cinemas.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-12 card"
        >
          <Landmark className="h-16 w-16 text-neutral-700 mx-auto mb-4" />
          <p className="text-neutral-400 text-lg mb-4">No cinemas found</p>
          <motion.button
            onClick={() => handleOpenModal(null)}
            className="btn btn-primary"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            Add Your First Cinema
          </motion.button>
        </motion.div>
      ) : (
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5"
        >
          {cinemas.map((cinema) => (
            <motion.div
              key={cinema._id}
              variants={cardVariants}
              whileHover={{ y: -3, transition: { duration: 0.2 } }}
              className="group card p-6 flex flex-col"
            >
              <div className="flex-grow">
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-primary-500/15 rounded-xl flex items-center justify-center">
                      <Landmark className="h-6 w-6 text-primary-400" />
                    </div>
                    <div>
                      <h3 className="text-lg font-display font-semibold text-white">{cinema.name}</h3>
                      <p className="text-sm text-neutral-500">{cinema.city}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-dark-700/50 flex items-center space-x-2">
                <motion.button
                  onClick={() => handleOpenModal(cinema)}
                  className="btn btn-secondary flex-1 flex items-center justify-center space-x-2"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Edit className="h-4 w-4" />
                  <span>Edit</span>
                </motion.button>
                <motion.button
                  onClick={() => setCinemaToDelete(cinema)}
                  className="btn btn-danger flex-1 flex items-center justify-center space-x-2"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Trash2 className="h-4 w-4" />
                  <span>Delete</span>
                </motion.button>
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}
    </div>
  );
}
