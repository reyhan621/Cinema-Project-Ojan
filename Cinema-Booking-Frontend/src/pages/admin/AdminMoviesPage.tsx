import { useEffect, useState, useCallback, useRef } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { Plus, Edit, Trash2, Image, Film, X, Upload, FileImage } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import LoadingSpinner from '@/components/LoadingSpinner';
import ErrorMessage from '@/components/ErrorMessage';
import toast from 'react-hot-toast';
import { useSearchParams } from 'react-router-dom';
import { movieService } from '@/services/movieService';
import { extractYouTubeVideoId, getYouTubeEmbedUrl } from '@/lib/youtube';
import type { IMovie } from '@/types';

const FIXED_GENRES = [
  "Action",
  "Adventure",
  "Animation",
  "Biography",
  "Comedy",
  "Crime",
  "Documentary",
  "Drama",
  "Family",
  "Fantasy",
  "History",
  "Horror",
  "Music",
  "Musical",
  "Mystery",
  "Romance",
  "Sci-Fi",
  "Sport",
  "Thriller",
  "War",
  "Western",
];

interface MovieFormInputs {
  title: string;
  description: string;
  duration: number;
  rating: string;
  trailerUrl: string;
  director: string;
}

interface MovieFormProps {
  movieToEdit: IMovie | null;
  onClose: () => void;
  onSave: () => void;
}

const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
const MAX_SIZE = 5 * 1024 * 1024;

const ACCEPT_STRING = ALLOWED_TYPES.join(',');

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

const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const MovieForm: React.FC<MovieFormProps> = ({ movieToEdit, onClose, onSave }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [posterFile, setPosterFile] = useState<File | null>(null);
  const [posterPreview, setPosterPreview] = useState<string>('');
  const [posterError, setPosterError] = useState<string>('');
  const [isDragging, setIsDragging] = useState(false);
  const [trailerPreviewUrl, setTrailerPreviewUrl] = useState<string>('');
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [genreError, setGenreError] = useState('');
  const [genreSearch, setGenreSearch] = useState('');
  const [showGenreDropdown, setShowGenreDropdown] = useState(false);
  const [castInput, setCastInput] = useState('');
  const [castList, setCastList] = useState<string[]>([]);
  const [castError, setCastError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const genreDropdownRef = useRef<HTMLDivElement>(null);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<MovieFormInputs>({
    defaultValues: {
      title: '',
      description: '',
      duration: 0,
      rating: '',
      trailerUrl: '',
      director: '',
    },
  });

  const watchTrailerUrl = watch('trailerUrl');

  useEffect(() => {
    if (movieToEdit) {
      setValue('title', movieToEdit.title || '');
      setValue('description', movieToEdit.description || '');
      setValue('duration', movieToEdit.duration || 0);
      setValue('rating', movieToEdit.rating ? String(movieToEdit.rating) : '');
      setValue('trailerUrl', movieToEdit.trailer_url || '');
      setValue('director', movieToEdit.director || '');

      const genres = Array.isArray(movieToEdit.genre)
        ? movieToEdit.genre
        : movieToEdit.genre
          ? [movieToEdit.genre]
          : [];
      setSelectedGenres(genres);

      const cast = Array.isArray(movieToEdit.cast)
        ? movieToEdit.cast
        : typeof movieToEdit.cast === 'string'
          ? (movieToEdit.cast as string).split(',').map((s: string) => s.trim()).filter(Boolean)
          : [];
      setCastList(cast);

      if (movieToEdit.poster_url) {
        setPosterPreview(movieToEdit.poster_url);
      }

      const trailerVal = movieToEdit.trailer_url || '';
      if (trailerVal) {
        setTrailerPreviewUrl(getYouTubeEmbedUrl(trailerVal) || '');
      }
    }
  }, [movieToEdit, setValue]);

  useEffect(() => {
    if (watchTrailerUrl) {
      setTrailerPreviewUrl(getYouTubeEmbedUrl(watchTrailerUrl) || '');
    } else {
      setTrailerPreviewUrl('');
    }
  }, [watchTrailerUrl]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (genreDropdownRef.current && !genreDropdownRef.current.contains(e.target as Node)) {
        setShowGenreDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const validateFile = (file: File): string | null => {
    if (!ALLOWED_TYPES.includes(file.type)) {
      return 'Only JPG, PNG, and WEBP images are allowed';
    }
    if (file.size > MAX_SIZE) {
      return `File size exceeds 5 MB limit (${formatFileSize(file.size)})`;
    }
    return null;
  };

  const handleFileSelect = (file: File) => {
    const error = validateFile(file);
    if (error) {
      setPosterError(error);
      toast.error(error);
      return;
    }
    setPosterError('');
    setPosterFile(file);
    const reader = new FileReader();
    reader.onload = (e) => {
      setPosterPreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileSelect(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelect(file);
  };

  const handleRemovePoster = () => {
    setPosterFile(null);
    setPosterPreview('');
    setPosterError('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleChangeImage = () => {
    fileInputRef.current?.click();
  };

  const handleToggleGenre = (genre: string) => {
    setSelectedGenres((prev) => {
      if (prev.includes(genre)) {
        return prev.filter((g) => g !== genre);
      }
      return [...prev, genre];
    });
    setGenreError('');
  };

  const handleRemoveGenre = (genre: string) => {
    setSelectedGenres((prev) => prev.filter((g) => g !== genre));
  };

  const filteredGenres = FIXED_GENRES.filter(
    (g) =>
      g.toLowerCase().includes(genreSearch.toLowerCase()) &&
      !selectedGenres.includes(g),
  );

  const handleAddCast = () => {
    const trimmed = castInput.trim();
    if (!trimmed) return;

    const isDuplicate = castList.some(
      (c) => c.toLowerCase() === trimmed.toLowerCase(),
    );
    if (isDuplicate) {
      setCastError('This cast member is already added');
      return;
    }

    setCastList((prev) => [...prev, trimmed]);
    setCastInput('');
    setCastError('');
  };

  const handleRemoveCast = (index: number) => {
    setCastList((prev) => prev.filter((_, i) => i !== index));
  };

  const handleCastKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddCast();
    }
  };

  const onSubmit: SubmitHandler<MovieFormInputs> = async (formData) => {
    if (!movieToEdit && !posterFile) {
      setPosterError('Poster image is required');
      toast.error('Please upload a poster image');
      return;
    }

    if (selectedGenres.length === 0) {
      setGenreError('Please select at least one genre');
      return;
    }

    setIsSubmitting(true);
    setPosterError('');
    setGenreError('');
    try {
      if (movieToEdit) {
        await movieService.updateMovie(
          movieToEdit._id,
          {
            title: formData.title,
            description: formData.description,
            genre: selectedGenres,
            duration: Number(formData.duration),
            rating: formData.rating || '',
            trailer_url: formData.trailerUrl,
            status: 'now_showing',
            director: formData.director,
            cast: castList,
          },
          posterFile || undefined,
        );
        toast.success('Movie updated successfully');
      } else {
        await movieService.createMovie(
          {
            title: formData.title,
            description: formData.description,
            genre: selectedGenres,
            duration: Number(formData.duration),
            rating: formData.rating || '',
            trailer_url: formData.trailerUrl,
            poster_url: '',
            release_date: '',
            status: 'now_showing',
            director: formData.director,
            cast: castList,
          },
          posterFile || undefined,
        );
        toast.success('Movie added successfully');
      }
      onSave();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      const msg = movieService.getBackendError(error);
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <motion.div
      variants={modalOverlayVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      className="fixed inset-0 bg-dark-950/80 backdrop-blur-sm z-50 flex items-start justify-center overflow-y-auto py-8 px-4"
    >
      <motion.div
        variants={modalContentVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
        className="card w-full max-w-3xl relative"
      >
        <div className="flex items-center justify-between p-6 border-b border-white/[0.06]">
          <h2 className="text-2xl font-display font-bold text-white">
            {movieToEdit ? 'Edit Movie' : 'Add New Movie'}
          </h2>
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-white p-2 rounded-xl hover:bg-dark-800/60 transition-all duration-200"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-neutral-300 mb-2">
              Movie Title <span className="text-red-400">*</span>
            </label>
            <input
              {...register('title', {
                required: 'Movie title is required',
                minLength: { value: 1, message: 'Title cannot be empty' },
              })}
              className="input"
              placeholder="Enter movie title"
            />
            {errors.title && (
              <p className="mt-1.5 text-sm text-red-400">{errors.title.message}</p>
            )}
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-neutral-300 mb-2">
              Description <span className="text-red-400">*</span>
            </label>
            <textarea
              {...register('description', {
                required: 'Description is required',
                minLength: { value: 10, message: 'Description must be at least 10 characters' },
              })}
              className="input min-h-[100px] resize-y"
              rows={4}
              placeholder="Enter movie description"
            />
            {errors.description && (
              <p className="mt-1.5 text-sm text-red-400">{errors.description.message}</p>
            )}
          </div>

          {/* Genre Multi-Select */}
          <div>
            <label className="block text-sm font-medium text-neutral-300 mb-2">
              Genre <span className="text-red-400">*</span>
            </label>
            <div className="relative" ref={genreDropdownRef}>
              <div
                onClick={() => setShowGenreDropdown(!showGenreDropdown)}
                className="input min-h-[44px] cursor-pointer flex items-center flex-wrap gap-2"
              >
                {selectedGenres.length === 0 && (
                  <span className="text-neutral-500">Select genres</span>
                )}
                {selectedGenres.map((genre) => (
                  <span
                    key={genre}
                    className="inline-flex items-center gap-1 rounded-lg bg-primary-500/20 text-primary-300 border border-primary-500/30 px-2.5 py-1 text-xs font-medium"
                  >
                    {genre}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveGenre(genre);
                      }}
                      className="hover:text-white transition-colors"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
              {showGenreDropdown && (
                <div className="absolute z-50 mt-1 w-full rounded-xl bg-dark-800 border border-white/[0.1] shadow-xl max-h-64 overflow-hidden">
                  <div className="p-2 border-b border-white/[0.06]">
                    <input
                      type="text"
                      value={genreSearch}
                      onChange={(e) => setGenreSearch(e.target.value)}
                      className="input text-sm py-2"
                      placeholder="Search genres..."
                      autoFocus
                    />
                  </div>
                  <div className="overflow-y-auto max-h-48 p-1">
                    {filteredGenres.length === 0 ? (
                      <p className="text-center text-neutral-500 text-sm py-3">No genres found</p>
                    ) : (
                      filteredGenres.map((genre) => (
                        <button
                          key={genre}
                          type="button"
                          onClick={() => handleToggleGenre(genre)}
                          className="w-full text-left px-3 py-2 rounded-lg text-sm text-neutral-300 hover:bg-white/[0.06] hover:text-white transition-colors"
                        >
                          {genre}
                        </button>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
            {genreError && (
              <p className="mt-1.5 text-sm text-red-400">{genreError}</p>
            )}
          </div>

          {/* Director & Duration */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-2">
                Director
              </label>
              <input
                {...register('director')}
                className="input"
                placeholder="Enter director name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-2">
                Duration (minutes) <span className="text-red-400">*</span>
              </label>
              <input
                type="number"
                {...register('duration', {
                  required: 'Duration is required',
                  min: { value: 1, message: 'Duration must be at least 1 minute' },
                  valueAsNumber: true,
                })}
                className="input"
                placeholder="e.g. 120"
                min={1}
              />
              {errors.duration && (
                <p className="mt-1.5 text-sm text-red-400">{errors.duration.message}</p>
              )}
            </div>
          </div>

          {/* Cast */}
          <div>
            <label className="block text-sm font-medium text-neutral-300 mb-2">
              Cast
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={castInput}
                onChange={(e) => {
                  setCastInput(e.target.value);
                  if (castError) setCastError('');
                }}
                onKeyDown={handleCastKeyDown}
                className="input flex-1"
                placeholder="Enter cast member name"
              />
              <button
                type="button"
                onClick={handleAddCast}
                disabled={!castInput.trim()}
                className="btn btn-primary btn-sm whitespace-nowrap"
              >
                Add Cast
              </button>
            </div>
            {castError && (
              <p className="mt-1.5 text-sm text-red-400">{castError}</p>
            )}
            {castList.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3">
                {castList.map((name, index) => (
                  <span
                    key={`${name}-${index}`}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-white/[0.06] text-neutral-300 border border-white/[0.1] px-3 py-1.5 text-sm"
                  >
                    {name}
                    <button
                      type="button"
                      onClick={() => handleRemoveCast(index)}
                      className="text-neutral-500 hover:text-red-400 transition-colors"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* PG Rating */}
          <div>
            <label className="block text-sm font-medium text-neutral-300 mb-2">
              PG Rating <span className="text-red-400">*</span>
            </label>
            <select
              {...register('rating', {
                required: 'Rating is required',
              })}
              className="input"
            >
              <option value="">Select rating</option>
              <option value="G">G - General Audiences</option>
              <option value="PG">PG - Parental Guidance</option>
              <option value="PG-13">PG-13 - Parents Strongly Cautioned</option>
              <option value="R">R - Restricted</option>
              <option value="NC-17">NC-17 - Adults Only</option>
            </select>
            {errors.rating && (
              <p className="mt-1.5 text-sm text-red-400">{errors.rating.message}</p>
            )}
          </div>

          {/* Poster Upload */}
          <div>
            <label className="block text-sm font-medium text-neutral-300 mb-2">
              Poster Image <span className="text-red-400">*</span>
            </label>
            <input
              ref={fileInputRef}
              type="file"
              accept={ACCEPT_STRING}
              onChange={handleFileInputChange}
              className="hidden"
            />

            {posterPreview ? (
              <div className="relative">
                <div className="flex gap-4 items-start">
                  <div className="w-32 h-48 rounded-xl overflow-hidden border border-white/[0.1] bg-dark-800/40 flex-shrink-0">
                    <img
                      src={posterPreview}
                      alt="Poster preview"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://placehold.co/300x450/171717/525252?text=No+Image';
                      }}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    {posterFile && (
                      <div className="flex items-center gap-2 text-sm text-neutral-400 mb-3">
                        <FileImage className="h-4 w-4 text-primary-400 flex-shrink-0" />
                        <span className="truncate">{posterFile.name}</span>
                        <span className="text-neutral-600 flex-shrink-0">({formatFileSize(posterFile.size)})</span>
                      </div>
                    )}
                    {movieToEdit && !posterFile && (
                      <p className="text-sm text-neutral-500 mb-3">Using existing poster</p>
                    )}
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={handleChangeImage}
                        className="btn btn-secondary btn-sm text-xs"
                      >
                        <Upload className="h-3.5 w-3.5" />
                        Change Image
                      </button>
                      <button
                        type="button"
                        onClick={handleRemovePoster}
                        className="btn btn-ghost btn-sm text-xs text-red-400 hover:text-red-300"
                      >
                        <X className="h-3.5 w-3.5" />
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`
                  relative cursor-pointer rounded-xl border-2 border-dashed p-8
                  transition-all duration-200 text-center
                  ${isDragging
                    ? 'border-primary-500 bg-primary-500/10'
                    : 'border-white/[0.12] hover:border-white/[0.25] hover:bg-white/[0.02]'
                  }
                `}
              >
                <div className="flex flex-col items-center gap-3">
                  <div className={`
                    w-14 h-14 rounded-2xl flex items-center justify-center
                    transition-colors duration-200
                    ${isDragging ? 'bg-primary-500/20 text-primary-400' : 'bg-dark-800/60 text-neutral-500'}
                  `}>
                    <Image className="h-7 w-7" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-neutral-300">
                      {isDragging ? 'Drop your image here' : 'Click to upload or drag & drop'}
                    </p>
                    <p className="text-xs text-neutral-500 mt-1">
                      JPG, PNG, or WEBP - Max 5 MB
                    </p>
                  </div>
                </div>
              </div>
            )}

            {posterError && (
              <p className="mt-1.5 text-sm text-red-400">{posterError}</p>
            )}
          </div>

          {/* Trailer URL */}
          <div>
            <label className="block text-sm font-medium text-neutral-300 mb-2">
              Trailer URL (YouTube) <span className="text-red-400">*</span>
            </label>
            <input
              {...register('trailerUrl', {
                required: 'Trailer URL is required',
                validate: (value) => {
                  if (!value) return 'Trailer URL is required';
                  const ytId = extractYouTubeVideoId(value);
                  if (!ytId) return 'Please enter a valid YouTube URL';
                  return true;
                },
              })}
              className="input"
              placeholder="https://www.youtube.com/watch?v=..."
            />
            {errors.trailerUrl && (
              <p className="mt-1.5 text-sm text-red-400">{errors.trailerUrl.message}</p>
            )}
            {trailerPreviewUrl && (
              <div className="mt-3 aspect-video rounded-xl overflow-hidden border border-white/[0.1] bg-dark-800/40">
                <iframe
                  src={trailerPreviewUrl}
                  title="Trailer Preview"
                  className="w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/[0.06]">
            <button
              type="button"
              onClick={onClose}
              className="btn btn-secondary"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <motion.button
              type="submit"
              disabled={isSubmitting}
              className="btn btn-primary min-w-[140px]"
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
            >
              {isSubmitting ? (
                <span className="flex items-center gap-2">
                  <LoadingSpinner size="sm" />
                  {movieToEdit ? 'Updating...' : 'Creating...'}
                </span>
              ) : (
                movieToEdit ? 'Update Movie' : 'Create Movie'
              )}
            </motion.button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
};

interface DeleteModalProps {
  movie: IMovie;
  onClose: () => void;
  onConfirm: (movieId: string) => void;
}

const DeleteConfirmationModal: React.FC<DeleteModalProps> = ({ movie, onClose, onConfirm }) => {
  const [deleting, setDeleting] = useState(false);

  const handleConfirm = async () => {
    setDeleting(true);
    try {
      await onConfirm(movie._id);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <motion.div
      variants={modalOverlayVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      className="fixed inset-0 bg-dark-950/80 backdrop-blur-sm z-50 flex items-center justify-center px-4"
    >
      <motion.div
        variants={modalContentVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
        className="card p-6 w-full max-w-md"
      >
        <h2 className="text-xl font-display font-bold text-white mb-2">Confirm Deletion</h2>
        <p className="text-neutral-400 mb-6">
          Are you sure you want to delete{' '}
          <strong className="text-white">"{movie.title}"</strong>? This action cannot be undone.
        </p>
        <div className="flex justify-end gap-3">
          <button onClick={onClose} className="btn btn-secondary" disabled={deleting}>
            Cancel
          </button>
          <motion.button
            onClick={handleConfirm}
            className="btn btn-danger"
            disabled={deleting}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
          >
            {deleting ? (
              <span className="flex items-center gap-2">
                <LoadingSpinner size="sm" />
                Deleting...
              </span>
            ) : (
              'Delete Movie'
            )}
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default function AdminMoviesPage() {
  const [movies, setMovies] = useState<IMovie[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMovie, setEditingMovie] = useState<IMovie | null>(null);
  const [movieToDelete, setMovieToDelete] = useState<IMovie | null>(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchTerm, setSearchTerm] = useState('');
  const [genreFilter, setGenreFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    fetchMovies();
  }, []);

  const fetchMovies = useCallback(async () => {
    setLoading(true);
    try {
      setError('');
      const data = await movieService.getMovies();
      setMovies(data || []);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      console.error('Error fetching movies:', err);
      setError(movieService.getBackendError(err));
    } finally {
      setLoading(false);
    }
  }, []);

  const handleOpenModal = (movie: IMovie | null) => {
    setEditingMovie(movie);
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
    setEditingMovie(null);
  };

  const handleSave = () => {
    fetchMovies();
    handleCloseModal();
  };

  const handleDeleteClick = (movie: IMovie) => {
    setMovieToDelete(movie);
  };

  const handleConfirmDelete = async (movieId: string) => {
    try {
      await movieService.deleteMovie(movieId);
      toast.success('Movie deleted successfully');
      fetchMovies();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      const msg = movieService.getBackendError(err);
      toast.error(msg);
    } finally {
      setMovieToDelete(null);
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
    return <ErrorMessage message={error} onRetry={fetchMovies} />;
  }

  const allGenres = [...new Set(movies.flatMap((movie) => movie.genre || []))].sort();
  const filteredMovies = movies.filter((movie) => {
    const matchesSearch = !searchTerm || movie.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesGenre = !genreFilter || (movie.genre || []).includes(genreFilter);
    const matchesStatus = statusFilter === 'all' || movie.status === statusFilter;
    return matchesSearch && matchesGenre && matchesStatus;
  });

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
        {isModalOpen && (
          <MovieForm
            movieToEdit={editingMovie}
            onClose={handleCloseModal}
            onSave={handleSave}
          />
        )}
        {movieToDelete && (
          <DeleteConfirmationModal
            movie={movieToDelete}
            onClose={() => setMovieToDelete(null)}
            onConfirm={handleConfirmDelete}
          />
        )}
      </AnimatePresence>

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
      >
        <div>
          <h1 className="text-3xl font-display font-bold text-white">Movies</h1>
          <p className="text-neutral-400">Manage your movie catalog</p>
        </div>
        <motion.button
          onClick={() => handleOpenModal(null)}
          className="btn btn-primary flex items-center space-x-2"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <Plus className="h-5 w-5" />
          <span>Add Movie</span>
        </motion.button>
      </motion.div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
        className="grid grid-cols-1 md:grid-cols-3 gap-4"
      >
        <input
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.target.value)}
          className="input"
          placeholder="Search movies..."
        />
        <select
          value={genreFilter}
          onChange={(event) => setGenreFilter(event.target.value)}
          className="input"
        >
          <option value="">All Genres</option>
          {allGenres.map((genre) => (
            <option key={genre} value={genre}>
              {genre}
            </option>
          ))}
        </select>
        <select
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value)}
          className="input"
        >
          <option value="all">All Status</option>
          <option value="now_showing">Now Showing</option>
          <option value="coming_soon">Coming Soon</option>
        </select>
      </motion.div>

      {/* Movie List */}
      {filteredMovies.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-12 card"
        >
          <Film className="h-12 w-12 text-neutral-600 mx-auto mb-4" />
          <p className="text-neutral-400 text-lg mb-4">No movies found</p>
          <motion.button
            onClick={() => handleOpenModal(null)}
            className="btn btn-primary"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            Add Your First Movie
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
                  <th className="px-6 py-3.5 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                    Movie
                  </th>
                  <th className="px-6 py-3.5 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                    Genre
                  </th>
                  <th className="px-6 py-3.5 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                    Duration
                  </th>
                  <th className="px-6 py-3.5 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider hidden md:table-cell">
                    PG Rating
                  </th>
                  <th className="px-6 py-3.5 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3.5 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dark-700/50">
                {filteredMovies.map((movie) => (
                  <motion.tr
                    key={movie._id}
                    variants={rowVariants}
                    className="hover:bg-dark-800/40 transition-colors duration-150"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <img
                          key={`poster-${movie._id}-${movie.updatedAt}`}
                          src={movie.poster_url || 'https://placehold.co/100x150/171717/525252?text=No+Image'}
                          alt={movie.title}
                          className="w-12 h-18 object-cover rounded-xl"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = 'https://placehold.co/100x150/171717/525252?text=No+Image';
                          }}
                        />
                        <div className="ml-4">
                          <div className="text-sm font-medium text-white max-w-xs truncate">
                            {movie.title}
                          </div>
                          <div className="text-sm text-neutral-500 line-clamp-2 max-w-xs">
                            {movie.description}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-wrap gap-1">
                        {(movie.genre || []).map((g) => (
                          <span key={g} className="cinema-badge text-[10px]">{g}</span>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-300">
                      {movie.duration} mins
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-300 hidden md:table-cell">
                      {movie.rating || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {movie.status === 'coming_soon' ? (
                        <span className="cinema-badge normal-case tracking-normal bg-amber-500/10 border-amber-500/20 text-amber-400">
                          Coming Soon
                        </span>
                      ) : (
                        <span className="cinema-badge normal-case tracking-normal bg-emerald-500/10 border-emerald-500/20 text-emerald-400">
                          Now Showing
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center space-x-2">
                        <motion.button
                          onClick={() => handleOpenModal(movie)}
                          className="text-green-400 hover:text-green-300 p-2 rounded-xl hover:bg-dark-700/60 transition-all duration-200"
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          title="Edit movie"
                        >
                          <Edit className="h-4 w-4" />
                        </motion.button>
                        <motion.button
                          onClick={() => handleDeleteClick(movie)}
                          className="text-red-400 hover:text-red-300 p-2 rounded-xl hover:bg-dark-700/60 transition-all duration-200"
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          title="Delete movie"
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
