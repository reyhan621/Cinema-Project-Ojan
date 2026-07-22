import { useEffect, useState, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { CalendarDays, Clock, MapPin, Play, Search, Ticket, ChevronRight, X } from 'lucide-react';
import { IMovie } from '@/types';
import MovieCard from '@/components/MovieCard';
import { MovieCardSkeleton } from '@/components/LoadingSpinner';
import { movieService } from '@/services/movieService';
import { showtimeService } from '@/services/showtimeService';
import { useCinema } from '@/contexts/CinemaContext';
import { getYouTubeEmbedUrl, extractYouTubeVideoId } from '@/lib/youtube';
import { attachNearestShowtime, parseShowtimeLocalDateTime } from '@/lib/showtime';
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion';

function buildBackgroundEmbedUrl(videoId: string): string {
  const params = new URLSearchParams({
    autoplay: '1',
    mute: '1',
    controls: '0',
    loop: '1',
    playsinline: '1',
    rel: '0',
    modestbranding: '1',
    disablekb: '1',
    fs: '0',
    playlist: videoId,
  });
  return `https://www.youtube.com/embed/${videoId}?${params.toString()}`;
}

function usePrefersReducedMotion(): boolean {
  const [prefersReduced, setPrefersReduced] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  });
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handler = (e: MediaQueryListEvent) => setPrefersReduced(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);
  return prefersReduced;
}

export default function HomePage() {
  const { selectedCinemaId } = useCinema();
  const [nowPlaying, setNowPlaying] = useState<IMovie[]>([]);
  const [comingSoon, setComingSoon] = useState<IMovie[]>([]);
  const [loading, setLoading] = useState(true);
  const [featuredMovie, setFeaturedMovie] = useState<IMovie | null>(null);
  const [error, setError] = useState('');
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const heroRef = useRef<HTMLDivElement>(null);
  const [trailerOpen, setTrailerOpen] = useState(false);
  const [trailerUrl, setTrailerUrl] = useState('');
  const [bgTrailerLoaded, setBgTrailerLoaded] = useState(false);
  const [bgTrailerError, setBgTrailerError] = useState(false);
  const bgTrailerIframeRef = useRef<HTMLIFrameElement>(null);
  const prefersReducedMotion = usePrefersReducedMotion();

  const bgVideoId = featuredMovie?.trailer_url
    ? extractYouTubeVideoId(featuredMovie.trailer_url)
    : null;
  const showBgTrailer = bgVideoId && !prefersReducedMotion && !bgTrailerError;

  const { scrollY } = useScroll();
  const heroOpacity = useTransform(scrollY, [0, 600], [1, 0]);
  const heroScale = useTransform(scrollY, [0, 600], [1, 1.15]);
  const posterY = useTransform(scrollY, [0, 600], [0, 120]);
  const contentY = useTransform(scrollY, [0, 600], [0, 60]);

  useEffect(() => {
    fetchMovies();
    const timer = window.setInterval(() => {
      fetchMovies();
    }, 60_000);
    return () => window.clearInterval(timer);
  }, [selectedCinemaId]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && trailerOpen) {
        closeTrailer();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [trailerOpen]);

  // Reset trailer loading state when featured movie changes
  useEffect(() => {
    setBgTrailerLoaded(false);
    setBgTrailerError(false);
  }, [featuredMovie?._id]);

  // Pause background trailer when modal opens, resume when closes
  useEffect(() => {
    const iframe = bgTrailerIframeRef.current;
    if (!iframe || !bgVideoId) return;
    try {
      const cmd = trailerOpen ? 'pauseVideo' : 'playVideo';
      iframe.contentWindow?.postMessage(
        JSON.stringify({ event: 'command', func: cmd, args: [] }),
        '*',
      );
    } catch {
      // Cross-origin restrictions may prevent postMessage; iframe will remain paused
    }
  }, [trailerOpen, bgVideoId]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!heroRef.current) return;
    const rect = heroRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    setMousePosition({ x, y });
  }, []);

  const fetchMovies = async () => {
    try {
      setError('');
      setLoading(true);
      const [allMovies, nowPlayingData, comingSoonData, upcomingShowtimes] = await Promise.all([
        movieService.getMovies(),
        showtimeService.getNowPlaying(selectedCinemaId || undefined).catch(() => []),
        showtimeService.getComingSoon(selectedCinemaId || undefined).catch(() => []),
        showtimeService
          .getShowtimes({ cinemaId: selectedCinemaId || undefined, upcoming: true })
          .catch(() => []),
      ]);

      const allMapped: IMovie[] = (allMovies || []).map((m: IMovie) => ({
        ...m,
        status: 'now_showing' as const,
      }));

      const nowPlayingMapped: IMovie[] = (nowPlayingData || []).map((m: IMovie) => ({
        ...m,
        poster_url: m.poster_url || m.poster || 'https://images.pexels.com/photos/7991579/pexels-photo-7991579.jpeg?auto=compress&cs=tinysrgb&w=400&h=600&fit=crop',
        status: 'now_showing' as const,
      }));

      const comingSoonMapped: IMovie[] = (comingSoonData || []).map((m: IMovie) => ({
        ...m,
        poster_url: m.poster_url || m.poster || 'https://images.pexels.com/photos/7991579/pexels-photo-7991579.jpeg?auto=compress&cs=tinysrgb&w=400&h=600&fit=crop',
        status: 'coming_soon' as const,
      }));

      const allWithNearest = attachNearestShowtime(allMapped, upcomingShowtimes);
      const nowPlayingWithNearest = attachNearestShowtime(nowPlayingMapped, upcomingShowtimes);
      const comingSoonWithNearest = attachNearestShowtime(comingSoonMapped, upcomingShowtimes);

      setNowPlaying(
        nowPlayingWithNearest.length > 0
          ? nowPlayingWithNearest
          : (selectedCinemaId ? [] : allWithNearest),
      );
      setComingSoon(comingSoonWithNearest);

      const featuredPool = nowPlayingWithNearest.length > 0
        ? nowPlayingWithNearest
        : (selectedCinemaId ? comingSoonWithNearest : allWithNearest);
      if (featuredPool.length > 0) {
        const randomIndex = Math.floor(Math.random() * featuredPool.length);
        setFeaturedMovie(featuredPool[randomIndex]);
      } else {
        setFeaturedMovie(null);
      }
    } catch (error) {
      console.error('Error fetching movies:', error);
      setError('Could not load movies.');
    } finally {
      setLoading(false);
    }
  };

  const openTrailer = (url: string) => {
    const embedUrl = getYouTubeEmbedUrl(url);
    if (embedUrl) {
      setTrailerUrl(embedUrl);
      setTrailerOpen(true);
      document.body.style.overflow = 'hidden';
    }
  };

  const closeTrailer = () => {
    setTrailerOpen(false);
    setTrailerUrl('');
    document.body.style.overflow = '';
  };

  const backdrop = featuredMovie?.poster_url || 'https://images.pexels.com/photos/7991579/pexels-photo-7991579.jpeg?auto=compress&cs=tinysrgb&w=1920&h=1080&fit=crop';
  const featuredReleaseDate = featuredMovie?.release_date
    ? new Date(featuredMovie.release_date)
    : null;
  const featuredReleaseYear =
    featuredReleaseDate instanceof Date &&
    !Number.isNaN(featuredReleaseDate.getTime())
      ? String(featuredReleaseDate.getFullYear())
      : 'TBA';
  const featuredNearestShowtime = featuredMovie?.nearest_showtime
    ? parseShowtimeLocalDateTime(
        featuredMovie.nearest_showtime.show_date,
        featuredMovie.nearest_showtime.start_time,
      )
    : null;
  const featuredNearestLabel = featuredNearestShowtime
    ? `${featuredNearestShowtime.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      })}, ${featuredNearestShowtime.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      })}`
    : null;

  if (loading) {
    return (
      <div className="min-h-screen">
        <div className="relative min-h-screen bg-dark-900">
          <div className="absolute inset-0 bg-gradient-to-r from-dark-950 via-dark-950/80 to-dark-950/30" />
          <div className="relative z-10 flex min-h-screen max-w-7xl items-center px-4 pb-32 pt-32 sm:px-6 lg:mx-auto lg:px-8">
            <div className="max-w-2xl space-y-8">
              <div className="skeleton h-8 w-40 rounded-full" />
              <div className="skeleton h-24 w-full rounded-2xl" />
              <div className="skeleton h-6 w-3/4 rounded-lg" />
              <div className="skeleton h-6 w-1/2 rounded-lg" />
              <div className="flex gap-4 pt-4">
                <div className="skeleton h-16 w-48 rounded-2xl" />
                <div className="skeleton h-16 w-48 rounded-2xl" />
              </div>
            </div>
          </div>
        </div>
        <div className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto pt-24">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {Array.from({ length: 4 }).map((_, i) => (
              <MovieCardSkeleton key={i} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      {featuredMovie && (
        <section
          ref={heroRef}
          onMouseMove={handleMouseMove}
          className="relative min-h-screen overflow-hidden"
        >
          {/* Poster Background (fallback) */}
          <div
            className="absolute inset-0 bg-cover bg-center hero-fallback"
            style={{ backgroundImage: `url(${backdrop})` }}
          />

          {/* Background Trailer Video */}
          {showBgTrailer && (
            <div className="hero-video-container">
              <iframe
                ref={bgTrailerIframeRef}
                key={`bg-trailer-${featuredMovie._id}-${bgVideoId}`}
                className={`hero-iframe transition-opacity duration-700 ${bgTrailerLoaded ? 'opacity-100' : 'opacity-0'}`}
                src={buildBackgroundEmbedUrl(bgVideoId)}
                title=""
                allow="autoplay; encrypted-media; picture-in-picture"
                tabIndex={-1}
                aria-hidden="true"
                onLoad={() => setBgTrailerLoaded(true)}
                onError={() => setBgTrailerError(true)}
              />
            </div>
          )}

          {/* Cinematic Gradient Overlay */}
          <div
            className="absolute inset-0"
            style={{
              background: 'linear-gradient(180deg, rgba(0,0,0,0.25) 0%, rgba(0,0,0,0.45) 45%, rgba(0,0,0,0.75) 100%)',
            }}
          />

          {/* Left-to-right gradient for text readability on left side */}
          <div className="absolute inset-0 bg-gradient-to-r from-dark-950/70 via-dark-950/30 to-transparent" />

          {/* Bottom fade for seamless section transition */}
          <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-dark-950 via-dark-950/60 to-transparent" />

          {/* Top fade for navbar blend */}
          <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-dark-950/50 via-dark-950/15 to-transparent" />

          {/* Vignette effect */}
          <div className="vignette" />

          {/* Film grain texture */}
          <div className="film-grain" />

          <motion.div
            style={{ opacity: heroOpacity, scale: heroScale }}
            className="relative z-10 flex min-h-screen max-w-7xl items-center px-4 pb-32 pt-40 sm:px-6 lg:mx-auto lg:px-8"
          >
            <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-16 w-full">
              {/* Poster with Parallax & Floating Animation */}
              <motion.div
                initial={{ opacity: 0, x: -80, scale: 0.85 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                transition={{ duration: 1, ease: [0.22, 0.61, 0.36, 1] }}
                style={{
                  y: posterY,
                  x: mousePosition.x * 20,
                  rotateY: mousePosition.x * 6,
                  rotateX: -mousePosition.y * 6
                }}
                className="hidden lg:block shrink-0"
              >
                <div className="relative group perspective-1000">
                  {/* Premium Glow Behind Poster */}
                  <div className="absolute -inset-12 bg-gradient-to-b from-primary-500/25 via-primary-500/8 to-accent-500/5 rounded-3xl blur-3xl opacity-60 group-hover:opacity-100 transition-opacity duration-700" />

                  {/* Soft Radial Light */}
                  <div className="absolute -inset-20 bg-[radial-gradient(ellipse_at_center,rgba(225,29,99,0.08),transparent_70%)] blur-2xl" />

                  {/* Floating Poster Image */}
                  <motion.div
                    animate={{
                      y: [0, -10, 0],
                    }}
                    transition={{
                      duration: 5,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                    className="relative"
                  >
                    <div className="relative overflow-hidden rounded-2xl shadow-poster ring-1 ring-white/[0.12] group-hover:ring-white/[0.2] transition-all duration-500">
                      <img
                        key={`hero-poster-${featuredMovie._id}-${featuredMovie.updatedAt}`}
                        src={featuredMovie.poster_url || 'https://images.pexels.com/photos/7991579/pexels-photo-7991579.jpeg?auto=compress&cs=tinysrgb&w=400&h=600&fit=crop'}
                        alt={featuredMovie.title}
                        className="relative w-[270px] h-[405px] object-cover transition-all duration-700 group-hover:scale-105"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = 'https://images.pexels.com/photos/7991579/pexels-photo-7991579.jpeg?auto=compress&cs=tinysrgb&w=400&h=600&fit=crop';
                        }}
                      />

                      {/* Light Sweep Effect */}
                      <div className="light-sweep" />

                      {/* Glass Border */}
                      <div className="absolute inset-0 rounded-2xl ring-1 ring-inset ring-white/[0.08]" />
                    </div>
                  </motion.div>
                </div>
              </motion.div>

              {/* Content with Staggered Animations */}
              <motion.div
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.9, ease: [0.22, 0.61, 0.36, 1], delay: 0.15 }}
                className="max-w-2xl"
                style={{
                  x: mousePosition.x * -12,
                  y: contentY
                }}
              >
                {/* Badges */}
                <motion.div
                  initial={{ opacity: 0, y: 24 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3, duration: 0.6 }}
                  className="mb-10 flex flex-wrap items-center gap-3"
                >
                  <span className="cinema-badge bg-primary-500/20 text-primary-300 border-primary-500/30">
                    <span className="w-2 h-2 rounded-full bg-primary-400 mr-2 animate-pulse" />
                    Now Playing
                  </span>
                  {featuredMovie.classification && (
                    <span className="cinema-badge">{featuredMovie.classification}</span>
                  )}
                  {featuredMovie.rating && (
                    <span className="cinema-badge bg-amber-500/15 text-amber-300 border-amber-500/25">
                      {featuredMovie.rating}
                    </span>
                  )}
                </motion.div>

                {/* Title */}
                <motion.h1
                  initial={{ opacity: 0, y: 28 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.45, duration: 0.6 }}
                  className="mb-10 max-w-3xl text-5xl font-display font-extrabold text-white md:text-6xl lg:text-[4.5rem] tracking-tight leading-[1.05]"
                >
                  {featuredMovie.title}
                </motion.h1>

                {/* Description */}
                <motion.p
                  initial={{ opacity: 0, y: 28 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6, duration: 0.6 }}
                  className="mb-12 max-w-xl text-lg leading-relaxed text-neutral-300/90"
                >
                  {featuredMovie.description}
                </motion.p>

                {/* Metadata Chips */}
                <motion.div
                  initial={{ opacity: 0, y: 28 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.75, duration: 0.6 }}
                  className="mb-14 flex flex-wrap gap-3"
                >
                  <span className="info-chip">
                    <CalendarDays className="h-4 w-4 text-primary-400" />
                    {featuredNearestLabel || featuredReleaseYear}
                  </span>
                  <span className="info-chip">
                    <Clock className="h-4 w-4 text-primary-400" />
                    {featuredMovie.duration} min
                  </span>
                  <span className="info-chip">
                    {Array.isArray(featuredMovie.genre) ? featuredMovie.genre.join(' • ') : featuredMovie.genre}
                  </span>
                  {featuredMovie.classification && (
                    <span className="info-chip">
                      {featuredMovie.classification}
                    </span>
                  )}
                </motion.div>

                {/* CTA Buttons */}
                <motion.div
                  initial={{ opacity: 0, y: 28 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.9, duration: 0.6 }}
                  className="flex flex-col gap-4 sm:flex-row"
                >
                  <Link to={`/book/${featuredMovie._id}`} className="btn btn-primary btn-lg group ripple">
                    <Ticket className="h-5 w-5 transition-transform duration-300 group-hover:rotate-12" />
                    Buy Tickets
                  </Link>
                  {featuredMovie.trailer_url && extractYouTubeVideoId(featuredMovie.trailer_url) ? (
                    <button
                      onClick={() => openTrailer(featuredMovie.trailer_url || '')}
                      className="btn btn-secondary btn-lg group"
                    >
                      <Play className="h-5 w-5 transition-transform duration-300 group-hover:scale-125" />
                      Play Trailer
                    </button>
                  ) : (
                    <Link to={`/movies/${featuredMovie._id}`} className="btn btn-secondary btn-lg group">
                      <Play className="h-5 w-5 transition-transform duration-300 group-hover:scale-125" />
                      View Details
                      <ChevronRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                    </Link>
                  )}
                </motion.div>
              </motion.div>
            </div>
          </motion.div>

          {/* Scroll Indicator */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.8, duration: 0.6 }}
            className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10"
          >
            <motion.div
              animate={{ y: [0, 10, 0] }}
              transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
              className="flex flex-col items-center gap-2"
            >
              <span className="text-xs font-medium text-neutral-500 uppercase tracking-wider">Scroll to explore</span>
              <div className="w-6 h-10 rounded-full border-2 border-white/20 flex items-start justify-center p-2">
                <motion.div
                  animate={{ y: [0, 12, 0] }}
                  transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
                  className="w-1.5 h-1.5 rounded-full bg-white/60"
                />
              </div>
            </motion.div>
          </motion.div>
        </section>
      )}

      {/* Quick Search Panel */}
      <section className="relative z-20 -mt-24 px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.5 }}
          className="glass-panel mx-auto max-w-6xl p-6 sm:p-8"
        >
          <div className="grid grid-cols-1 gap-4 md:grid-cols-[1fr_1fr_auto]">
            <label className="group">
              <span className="mb-2.5 block text-[10px] font-semibold uppercase tracking-wider text-neutral-500">Location</span>
              <div className="flex items-center gap-3 rounded-xl border border-white/[0.1] bg-white/[0.04] px-4 py-3.5 transition-all duration-300 group-focus-within:border-primary-500/50 group-focus-within:bg-white/[0.06] group-focus-within:shadow-lg group-focus-within:shadow-primary-500/10">
                <MapPin className="h-4 w-4 text-primary-400" />
                <span className="text-sm font-medium text-white">
                  {selectedCinemaId ? 'Filtered by selected cinema' : 'All Cinemas'}
                </span>
              </div>
            </label>
            <label className="group">
              <span className="mb-2.5 block text-[10px] font-semibold uppercase tracking-wider text-neutral-500">Category</span>
              <div className="flex items-center gap-3 rounded-xl border border-white/[0.1] bg-white/[0.04] px-4 py-3.5 transition-all duration-300 group-focus-within:border-primary-500/50 group-focus-within:bg-white/[0.06] group-focus-within:shadow-lg group-focus-within:shadow-primary-500/10">
                <Ticket className="h-4 w-4 text-primary-400" />
                <span className="text-sm font-medium text-white">Now Playing</span>
              </div>
            </label>
            <Link to="/movies" className="btn btn-primary self-end px-8 py-4 ripple">
              <Search className="h-4 w-4" />
              Find Movies
            </Link>
          </div>
        </motion.div>
      </section>

      {/* Now Playing Section */}
      <section className="px-4 py-24 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-14 flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
            <div>
              <motion.p
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="section-eyebrow mb-4"
              >
                In theaters
              </motion.p>
              <motion.h2
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 }}
                className="text-4xl md:text-5xl font-display font-bold text-white tracking-tight"
              >
                Now Playing
              </motion.h2>
              <motion.p
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.15 }}
                className="mt-4 max-w-lg text-base text-neutral-400 leading-relaxed"
              >
                Pick a film, choose your studio, and reserve seats in a few taps.
              </motion.p>
            </div>
            <Link to="/movies" className="btn btn-secondary btn-sm group">
              View All Movies
              <ChevronRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
            </Link>
          </div>

          {error && (
            <div className="card p-5 mb-10 text-red-400 border-red-500/20 bg-red-500/5">
              {error}
            </div>
          )}

          {nowPlaying.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {nowPlaying.slice(0, 4).map((movie, index) => (
                <motion.div
                  key={movie._id}
                  initial={{ opacity: 0, y: 32 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-80px' }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                >
                  <MovieCard movie={movie} />
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-20">
              <div className="w-20 h-20 rounded-2xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-center mx-auto mb-6">
                <Ticket className="h-10 w-10 text-neutral-600" />
              </div>
              <p className="text-neutral-400 text-base">
                {selectedCinemaId
                  ? 'No movies currently playing at this cinema.'
                  : 'No movies currently showing.'}
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Coming Soon Section */}
      <section className="px-4 pb-32 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-14 flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
            <div>
              <motion.p
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="section-eyebrow mb-4"
              >
                Plan ahead
              </motion.p>
              <motion.h2
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 }}
                className="text-4xl md:text-5xl font-display font-bold text-white tracking-tight"
              >
                Coming Soon
              </motion.h2>
              <motion.p
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.15 }}
                className="mt-4 max-w-lg text-base text-neutral-400 leading-relaxed"
              >
                Upcoming releases ready for trailers, reminders, and presale tickets.
              </motion.p>
            </div>
          </div>
          {comingSoon.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {comingSoon.slice(0, 4).map((movie, index) => (
                <motion.div
                  key={movie._id}
                  initial={{ opacity: 0, y: 32 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-80px' }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                >
                  <MovieCard movie={movie} />
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-20">
              <div className="w-20 h-20 rounded-2xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-center mx-auto mb-6">
                <CalendarDays className="h-10 w-10 text-neutral-600" />
              </div>
              <p className="text-neutral-400 text-base">
                {selectedCinemaId
                  ? 'No upcoming movies at this cinema.'
                  : 'No coming soon movies available.'}
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Trailer Modal */}
      <AnimatePresence>
        {trailerOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4"
            onClick={closeTrailer}
          >
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />

            {/* Modal Content */}
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
              className="relative w-full max-w-[1100px] z-10"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close Button */}
              <button
                onClick={closeTrailer}
                className="absolute -top-12 right-0 sm:right-0 sm:-top-12 flex items-center justify-center w-10 h-10 rounded-full bg-white/10 text-white hover:bg-white/20 transition-all duration-200 z-20"
              >
                <X className="h-5 w-5" />
              </button>

              {/* Iframe Container */}
              <div className="relative w-full overflow-hidden rounded-2xl bg-black shadow-2xl" style={{ aspectRatio: '16/9' }}>
                <iframe
                  src={`${trailerUrl}?autoplay=1`}
                  title="Movie Trailer"
                  className="absolute inset-0 w-full h-full border-0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  referrerPolicy="strict-origin-when-cross-origin"
                  allowFullScreen
                />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
