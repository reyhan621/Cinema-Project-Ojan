import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Calendar, Clock, ExternalLink, Globe, MapPin, Play, Ticket, Users } from 'lucide-react';
import { IMovie, IShowtime } from '@/types';
import LoadingSpinner from '@/components/LoadingSpinner';
import ErrorMessage from '@/components/ErrorMessage';
import RecommendationSection from '@/components/RecommendationSection';
import { movieService } from '@/services/movieService';
import { showtimeService } from '@/services/showtimeService';
import { getYouTubeEmbedUrl, extractYouTubeVideoId } from '@/lib/youtube';
import { motion } from 'framer-motion';
import { isUpcomingShowtime } from '@/lib/showtime';

export default function MovieDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const [movie, setMovie] = useState<IMovie | null>(null);
  const [showtimes, setShowtimes] = useState<IShowtime[]>([]);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedShowtime, setSelectedShowtime] = useState<IShowtime | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (id) {
      fetchMovie(id);
    }
  }, [id]);

  const fetchMovie = async (movieId: string) => {
    try {
      setError('');
      setLoading(true);
      const [movieData, showtimeData] = await Promise.all([
        movieService.getMovieById(movieId),
        showtimeService.getMovieShowtimes(movieId, { upcoming: true }),
      ]);
      setMovie(movieData);
      setShowtimes(showtimeData);

      const futureShowtimes = showtimeData.filter((st) =>
        isUpcomingShowtime(st.show_date, st.start_time),
      );

      if (futureShowtimes.length > 0) {
        setSelectedDate(futureShowtimes[0].show_date.split('T')[0]);
      }
    } catch (error) {
      console.error('Error fetching movie:', error);
      setError('Unable to load movie details. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const availableDates = [...new Set(
    showtimes
      .filter((st) => isUpcomingShowtime(st.show_date, st.start_time))
      .map((showtime) => showtime.show_date.split('T')[0])
  )];

  const visibleShowtimes = showtimes.filter((showtime) => {
    const isFuture = isUpcomingShowtime(showtime.show_date, showtime.start_time);
    return showtime.show_date.startsWith(selectedDate) && isFuture;
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <ErrorMessage message={error} onRetry={() => id && fetchMovie(id)} />
      </div>
    );
  }

  if (!movie) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 rounded-2xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-center mx-auto mb-4">
            <Ticket className="h-8 w-8 text-neutral-600" />
          </div>
          <h1 className="text-2xl font-display font-bold mb-3">Movie Not Found</h1>
          <Link to="/movies" className="btn btn-primary">
            Back to Movies
          </Link>
        </div>
      </div>
    );
  }

  const backdrop = movie.backdrop_url || movie.poster_url;

  return (
    <div className="min-h-screen">
      {/* Hero backdrop */}
      <section className="relative overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center scale-105"
          style={{ backgroundImage: `url(${backdrop})` }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-dark-950 via-dark-950/[0.92] to-dark-950/60" />
          <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-dark-950 via-dark-950/70 to-transparent" />
          <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-dark-950/50 to-transparent" />
        </div>

        <div className="relative mx-auto grid max-w-7xl grid-cols-1 gap-10 px-4 py-14 sm:px-6 lg:grid-cols-[300px_1fr] lg:px-8 lg:py-20">
          {/* Movie Poster */}
          <motion.div
            initial={{ opacity: 0, x: -30, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            transition={{ duration: 0.6, ease: [0.22, 0.61, 0.36, 1] }}
          >
            <div className="max-w-[280px] lg:max-w-full mx-auto lg:mx-0">
              <div className="relative group">
                <div className="absolute -inset-4 bg-gradient-to-b from-primary-500/15 via-primary-500/5 to-transparent rounded-3xl blur-2xl opacity-60 group-hover:opacity-80 transition-opacity duration-700" />
                <img
                  key={`detail-poster-${movie._id}-${movie.updatedAt}`}
                  src={movie.poster_url || ''}
                  alt={movie.title}
                  className="relative w-full rounded-3xl shadow-poster ring-1 ring-white/[0.1] transition-transform duration-500 group-hover:scale-[1.02]"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'https://placehold.co/300x450/171717/525252?text=No+Image';
                  }}
                />
              </div>
            </div>
          </motion.div>

          {/* Movie Details */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.15 }}
            className="flex items-center"
          >
            <div className="max-w-3xl space-y-6">
              <div>
                <div className="mb-5 flex flex-wrap items-center gap-2.5">
                  <span className="cinema-badge bg-primary-500/20 text-primary-300 border-primary-500/30">
                    {movie.status === 'coming_soon' ? 'Coming Soon' : 'Now Playing'}
                  </span>
                  {movie.classification && <span className="cinema-badge">{movie.classification}</span>}
                  {movie.rating && (
                    <div className="cinema-badge bg-amber-500/15 text-amber-300 border-amber-500/25">
                      {movie.rating}
                    </div>
                  )}
                </div>
                <h1 className="text-4xl font-display font-extrabold mb-5 md:text-5xl lg:text-6xl tracking-tight text-white leading-[1.08]">
                  {movie.title}
                </h1>

                <div className="flex flex-wrap items-center gap-2.5">
                  <span className="info-chip">
                    <Calendar className="h-3.5 w-3.5 text-primary-400" />
                    {new Date(movie.release_date).getFullYear()}
                  </span>
                  <span className="info-chip">
                    <Clock className="h-3.5 w-3.5 text-primary-400" />
                    {movie.duration} min
                  </span>
                  <span className="info-chip bg-primary-500/10 text-primary-300 border-primary-500/20">
                    {Array.isArray(movie.genre) ? movie.genre.join(', ') : movie.genre}
                  </span>
                  {movie.director && (
                    <span className="info-chip">
                      <Users className="h-3.5 w-3.5 text-accent-400" />
                      {movie.director}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <Link
                  to={selectedShowtime ? `/booking/${selectedShowtime._id}` : `/book/${movie._id}`}
                  className="btn btn-primary btn-lg group"
                >
                  <Ticket className="h-5 w-5 transition-transform duration-300 group-hover:rotate-12" />
                  Buy Tickets
                </Link>
                {movie.trailer_url && (
                  <a href="#trailer" className="btn btn-secondary btn-lg group">
                    <Play className="h-5 w-5 transition-transform duration-300 group-hover:scale-110" />
                    Watch Trailer
                  </a>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          <div className="lg:col-span-2 space-y-12">
            {/* Synopsis */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              <p className="section-eyebrow mb-3">Story</p>
              <h2 className="text-xl font-display font-bold text-white mb-5">Synopsis</h2>
              <div className="card p-6">
                <p className="text-neutral-300/90 leading-[1.8] text-[15px]">
                  {movie.description}
                </p>
              </div>
            </motion.div>

            {/* Details */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="grid grid-cols-1 sm:grid-cols-2 gap-5"
            >
              <div className="card p-5 group hover:border-white/[0.1] transition-all duration-300">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-9 h-9 rounded-xl bg-primary-500/10 border border-primary-500/20 flex items-center justify-center">
                    <Users className="h-4 w-4 text-primary-400" />
                  </div>
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-500">Director</h3>
                </div>
                <p className="text-white font-medium">{movie.director || 'To be announced'}</p>
              </div>
              <div className="card p-5 group hover:border-white/[0.1] transition-all duration-300">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-9 h-9 rounded-xl bg-accent-500/10 border border-accent-500/20 flex items-center justify-center">
                    <Globe className="h-4 w-4 text-accent-400" />
                  </div>
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-500">Cast</h3>
                </div>
                <p className="text-white font-medium leading-relaxed">{movie.cast?.join(', ') || 'To be announced'}</p>
              </div>
            </motion.div>
          </div>

          {/* Showtimes Sidebar */}
          <aside className="lg:col-span-1">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.15 }}
            >
              {showtimes.length > 0 ? (
                <div className="glass-panel sticky top-24 p-6">
                  <p className="section-eyebrow mb-3">Book now</p>
                  <h2 className="text-xl font-display font-bold text-white mb-5">Select Showtime</h2>

                  {selectedShowtime?.cinema && (
                    <div className="mb-6 flex items-center gap-2.5 rounded-xl bg-white/[0.03] px-4 py-3 text-xs text-neutral-300 border border-white/[0.06]">
                      <MapPin className="h-3.5 w-3.5 text-primary-400" />
                      {selectedShowtime.cinema.name} — {selectedShowtime.cinema.city}
                    </div>
                  )}

                  {/* Date selector */}
                  <div className="mb-6 flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-none">
                    {availableDates.map((date) => (
                      <button
                        key={date}
                        onClick={() => {
                          setSelectedDate(date);
                          setSelectedShowtime(null);
                        }}
                        className={`min-w-[82px] rounded-xl px-3.5 py-3 text-left transition-all duration-300 ${
                          selectedDate === date
                            ? 'bg-gradient-to-b from-primary-500 to-primary-600 text-white shadow-lg shadow-primary-950/40'
                            : 'bg-white/[0.04] text-neutral-300 hover:bg-white/[0.07] border border-white/[0.06] hover:border-white/[0.1]'
                        }`}
                      >
                        <span className="block text-[10px] uppercase opacity-70 font-medium">
                          {new Date(date).toLocaleDateString('en-US', { weekday: 'short' })}
                        </span>
                        <span className="block text-sm font-bold">
                          {new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </span>
                      </button>
                    ))}
                  </div>

                  {/* Time slots */}
                  <div className="space-y-2.5">
                    {visibleShowtimes.map((showtime) => (
                      <button
                        key={showtime._id}
                        onClick={() => setSelectedShowtime(showtime)}
                        className={`w-full rounded-xl border p-4 text-left transition-all duration-300 ${
                          selectedShowtime?._id === showtime._id
                            ? 'border-primary-500/50 bg-primary-500/10 shadow-lg shadow-primary-500/10'
                            : 'border-white/[0.06] bg-white/[0.03] hover:border-white/[0.1] hover:bg-white/[0.06]'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <p className="text-lg font-bold text-white">{showtime.start_time}</p>
                          <p className="text-accent-400 text-sm font-semibold">
                            IDR {showtime.ticket_price.toLocaleString()}
                          </p>
                        </div>
                        <p className="text-xs text-neutral-500 mt-1.5">
                          {showtime.hall?.hall_name || 'TBA'} &middot; {showtime.end_time} finish
                        </p>
                        {showtime.cinema && (
                          <p className="text-xs text-neutral-500 mt-0.5">
                            {showtime.cinema.name} — {showtime.cinema.city}
                          </p>
                        )}
                      </button>
                    ))}
                  </div>

                  <Link
                    to={selectedShowtime ? `/booking/${selectedShowtime._id}` : `/book/${movie._id}`}
                    className="btn btn-primary w-full mt-6 py-3.5 text-sm"
                  >
                    <Ticket className="h-4 w-4" />
                    Continue to Seats
                  </Link>
                </div>
              ) : (
                <div className="glass-panel p-6">
                  <h2 className="text-lg font-display font-bold text-white">No showtimes yet</h2>
                  <p className="mt-2 text-sm text-neutral-400">Check back soon for available sessions.</p>
                </div>
              )}
            </motion.div>
          </aside>
        </div>
      </div>

      {/* Trailer - Full width, centered */}
      {(() => {
        const trailerUrl = movie.trailer_url || '';
        const embedUrl = getYouTubeEmbedUrl(trailerUrl);
        const videoId = extractYouTubeVideoId(trailerUrl);

        if (!trailerUrl.trim()) {
          return (
            <motion.div
              id="trailer"
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 pb-14"
            >
              <p className="section-eyebrow mb-3">Preview</p>
              <h2 className="text-xl font-display font-bold text-white mb-5">Trailer</h2>
              <div className="aspect-video rounded-2xl overflow-hidden bg-white/[0.03] ring-1 ring-white/[0.06] shadow-cinema flex items-center justify-center">
                <p className="text-neutral-500 text-sm">Trailer is not available.</p>
              </div>
            </motion.div>
          );
        }

        return (
          <motion.div
            id="trailer"
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 pb-14"
          >
            <p className="section-eyebrow mb-3">Preview</p>
            <h2 className="text-xl font-display font-bold text-white mb-5">Trailer</h2>
            {embedUrl ? (
              <div className="aspect-video rounded-2xl overflow-hidden bg-white/[0.03] ring-1 ring-white/[0.06] shadow-cinema">
                <iframe
                  src={embedUrl}
                  title={`${movie.title} trailer`}
                  className="w-full h-full border-0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  referrerPolicy="strict-origin-when-cross-origin"
                  allowFullScreen
                />
              </div>
            ) : (
              <div className="aspect-video rounded-2xl overflow-hidden bg-white/[0.03] ring-1 ring-white/[0.06] shadow-cinema flex items-center justify-center">
                <p className="text-neutral-500 text-sm">Trailer is not available.</p>
              </div>
            )}
            {videoId && (
              <div className="flex justify-center mt-4">
                <a
                  href={`https://www.youtube.com/watch?v=${videoId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-sm text-neutral-400 hover:text-primary-400 transition-colors duration-200"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  Watch on YouTube
                </a>
              </div>
            )}
          </motion.div>
        );
      })()}

      {/* Recommendations */}
      <div className="max-w-7xl mx-auto px-4 py-14 sm:px-6 lg:px-8">
        <RecommendationSection movieId={movie._id} />
      </div>
    </div>
  );
}
