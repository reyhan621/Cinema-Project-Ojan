import { useEffect, useState } from 'react';
import { Search, Filter, Film } from 'lucide-react';
import { IMovie } from '@/types';
import MovieCard from '@/components/MovieCard';
import { MovieCardSkeleton } from '@/components/LoadingSpinner';
import { movieService } from '@/services/movieService';
import { showtimeService } from '@/services/showtimeService';
import { useCinema } from '@/contexts/CinemaContext';
import { attachNearestShowtime } from '@/lib/showtime';
import { motion } from 'framer-motion';

export default function MoviesPage() {
  const { selectedCinemaId } = useCinema();
  const [movies, setMovies] = useState<IMovie[]>([]);
  const [filteredMovies, setFilteredMovies] = useState<IMovie[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGenre, setSelectedGenre] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<'all' | 'now_showing' | 'coming_soon'>('all');
  const [sortBy, setSortBy] = useState<'title' | 'release_date' | 'rating'>('title');
  const [genres, setGenres] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [error, setError] = useState('');
  const moviesPerPage = 8;

  useEffect(() => {
    fetchMovies();
    const timer = window.setInterval(() => {
      fetchMovies();
    }, 60_000);
    return () => window.clearInterval(timer);
    // Re-fetch when the selected cinema changes so the list reflects that location.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCinemaId]);

  useEffect(() => {
    filterMovies();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [movies, searchTerm, selectedGenre, selectedStatus, sortBy]);

  const fetchMovies = async () => {
    try {
      setLoading(true);
      // now-playing / coming-soon are derived from showtimes on the backend and are
      // cinema-aware, so they give us BOTH the correct status and the location filter.
      const [allMovies, nowPlaying, comingSoon, upcomingShowtimes] = await Promise.all([
        movieService.getMovies(),
        showtimeService.getNowPlaying(selectedCinemaId || undefined).catch(() => []),
        showtimeService.getComingSoon(selectedCinemaId || undefined).catch(() => []),
        showtimeService
          .getShowtimes({ cinemaId: selectedCinemaId || undefined, upcoming: true })
          .catch(() => []),
      ]);

      const comingSoonIds = new Set(comingSoon.map((m) => m._id));

      let list: IMovie[];
      if (selectedCinemaId) {
        // Only movies actually scheduled at the selected cinema (already status-tagged).
        const byId = new Map<string, IMovie>();
        nowPlaying.forEach((m) => byId.set(m._id, m));
        comingSoon.forEach((m) => { if (!byId.has(m._id)) byId.set(m._id, m); });
        list = Array.from(byId.values());
      } else {
        // All cinemas: show the full catalog, tagging the ones that are coming-soon.
        list = (allMovies || []).map((m) =>
          comingSoonIds.has(m._id) ? { ...m, status: 'coming_soon' as const } : m,
        );
      }

      const listWithNearest = attachNearestShowtime(list, upcomingShowtimes);
      setMovies(listWithNearest);
      const uniqueGenres = [...new Set(listWithNearest.flatMap((movie) => movie.genre || []).filter(Boolean))];
      setGenres(uniqueGenres);
    } catch (error) {
      console.error('Error fetching movies:', error);
      setError('Could not load movies.');
    } finally {
      setLoading(false);
    }
  };

  const filterMovies = () => {
    let filtered = movies;

    if (searchTerm) {
      filtered = filtered.filter(movie =>
        movie.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        movie.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedGenre) {
      filtered = filtered.filter(movie => (movie.genre || []).includes(selectedGenre));
    }

    if (selectedStatus !== 'all') {
      filtered = filtered.filter(movie => movie.status === selectedStatus);
    }

    if (sortBy === 'rating') {
      filtered = [...filtered].sort((a, b) => (a.rating || '').localeCompare(b.rating || ''));
    } else if (sortBy === 'title') {
      filtered = [...filtered].sort((a, b) => a.title.localeCompare(b.title));
    }

    setFilteredMovies(filtered);
    setCurrentPage(1);
  };

  const totalPages = Math.max(1, Math.ceil(filteredMovies.length / moviesPerPage));
  const paginatedMovies = filteredMovies.slice((currentPage - 1) * moviesPerPage, currentPage * moviesPerPage);

  if (loading) {
    return (
      <div className="min-h-screen py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-12 space-y-4">
            <div className="skeleton h-5 w-32 rounded-full" />
            <div className="skeleton h-12 w-72 rounded-xl" />
            <div className="skeleton h-5 w-96 rounded-lg" />
          </div>
          <div className="skeleton h-20 rounded-2xl mb-10" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {Array.from({ length: 8 }).map((_, i) => (
              <MovieCardSkeleton key={i} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-12"
        >
          <p className="section-eyebrow mb-4">Browse tickets</p>
          <h1 className="text-4xl md:text-5xl font-display font-bold text-white tracking-tight mb-5">
            Movies & Showtimes
          </h1>
          <p className="text-neutral-400 text-base max-w-xl leading-relaxed">
            Filter by status, genre, and rating to find your next cinema plan.
          </p>
        </motion.div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="glass-panel mb-12 p-6"
        >
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="relative group">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-neutral-500 h-4 w-4 group-focus-within:text-primary-400 transition-colors duration-300" />
              <input
                type="text"
                placeholder="Search movies..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input pl-12 py-3.5"
              />
            </div>
            <div className="relative group">
              <Filter className="absolute left-4 top-1/2 transform -translate-y-1/2 text-neutral-500 h-4 w-4 group-focus-within:text-primary-400 transition-colors duration-300" />
              <select
                value={selectedGenre}
                onChange={(e) => setSelectedGenre(e.target.value)}
                className="input pl-12 pr-10 py-3.5 appearance-none cursor-pointer"
              >
                <option value="">All Genres</option>
                {genres.map((genre) => (
                  <option key={genre} value={genre}>{genre}</option>
                ))}
              </select>
            </div>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value as 'all' | 'now_showing' | 'coming_soon')}
              className="input py-3.5 cursor-pointer"
            >
              <option value="all">All Status</option>
              <option value="now_showing">Now Showing</option>
              <option value="coming_soon">Coming Soon</option>
            </select>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'title' | 'release_date' | 'rating')}
              className="input py-3.5 cursor-pointer"
            >
              <option value="title">Sort by Title</option>
              <option value="release_date">Sort by Release Date</option>
              <option value="rating">Sort by Rating</option>
            </select>
          </div>
        </motion.div>

        {error && (
          <div className="card p-5 mb-10 text-red-400 border-red-500/20 bg-red-500/5">{error}</div>
        )}

        {/* Movies Grid */}
        {filteredMovies.length > 0 ? (
          <>
            <div className="mb-8 flex items-center justify-between text-sm text-neutral-500">
              <span>{filteredMovies.length} movies found</span>
              <span>{selectedStatus === 'all' ? 'All titles' : selectedStatus === 'now_showing' ? 'Now playing' : 'Coming soon'}</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
              {paginatedMovies.map((movie, index) => (
                <motion.div
                  key={movie._id}
                  initial={{ opacity: 0, y: 24 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.05 }}
                >
                  <MovieCard movie={movie} />
                </motion.div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-3 mt-14">
                <button
                  className="btn btn-secondary btn-sm"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                >
                  Previous
                </button>
                <div className="flex items-center gap-2">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`w-10 h-10 rounded-xl text-xs font-semibold transition-all duration-300 ${
                        currentPage === page
                          ? 'bg-gradient-to-r from-[#FF2D75] to-[#FF7A18] text-white shadow-lg shadow-primary-950/30'
                          : 'bg-white/[0.05] text-neutral-400 hover:bg-white/[0.08] hover:text-white border border-white/[0.08]'
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                </div>
                <button
                  className="btn btn-secondary btn-sm"
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(prev => prev + 1)}
                >
                  Next
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-24">
            <div className="w-20 h-20 rounded-2xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center mx-auto mb-6">
              <Film className="h-10 w-10 text-neutral-600" />
            </div>
            <p className="text-neutral-400 text-base mb-2">
              {searchTerm || selectedGenre
                ? 'No movies found matching your criteria.'
                : 'No movies currently available.'
              }
            </p>
            <p className="text-neutral-500 text-sm">Try adjusting your filters</p>
          </div>
        )}
      </div>
    </div>
  );
}
