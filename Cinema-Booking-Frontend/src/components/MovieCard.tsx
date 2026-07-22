import { Link } from 'react-router-dom';
import { Calendar, Clock, Ticket, Play, ChevronRight } from 'lucide-react';
import type { IMovie } from '@/types';
import { motion } from 'framer-motion';
import { parseShowtimeLocalDateTime } from '@/lib/showtime';

interface MovieCardProps {
  movie: IMovie;
}

export default function MovieCard({ movie }: MovieCardProps) {
  const isComingSoon = movie.status === 'coming_soon';
  const releaseDate = movie.release_date ? new Date(movie.release_date) : null;
  const hasValidReleaseDate =
    releaseDate instanceof Date && !Number.isNaN(releaseDate.getTime());
  const releaseYear = hasValidReleaseDate
    ? String(releaseDate.getFullYear())
    : 'TBA';

  const nearestShowtimeDate = movie.nearest_showtime
    ? parseShowtimeLocalDateTime(
        movie.nearest_showtime.show_date,
        movie.nearest_showtime.start_time,
      )
    : null;

  const nearestShowtimeLabel =
    nearestShowtimeDate &&
    `${nearestShowtimeDate.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    })}, ${nearestShowtimeDate.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    })}`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 32 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      className="movie-card group flex flex-col card-glow"
    >
      <div className="relative aspect-[2/3] overflow-hidden bg-white/[0.02]">
        {/* Poster Image */}
        <img
          key={`poster-${movie._id}-${movie.updatedAt}`}
          src={movie.poster_url || 'https://images.pexels.com/photos/7991579/pexels-photo-7991579.jpeg?auto=compress&cs=tinysrgb&w=400&h=600&fit=crop'}
          alt={movie.title}
          className="w-full h-full object-cover transition-all duration-700 ease-out group-hover:scale-110"
          loading="lazy"
          onError={(e) => {
            (e.target as HTMLImageElement).src = 'https://images.pexels.com/photos/7991579/pexels-photo-7991579.jpeg?auto=compress&cs=tinysrgb&w=400&h=600&fit=crop';
          }}
        />
        
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-dark-950 via-dark-950/40 to-transparent opacity-85" />
        
        {/* Top badges */}
        <div className="absolute left-3 right-3 top-3 flex items-start justify-between gap-2">
          <span className={`cinema-badge ${isComingSoon ? 'bg-accent-500/20 text-accent-300 border-accent-500/30' : 'bg-primary-500/20 text-primary-300 border-primary-500/30'}`}>
            {!isComingSoon && <span className="w-1.5 h-1.5 rounded-full bg-primary-400 mr-1.5 animate-pulse" />}
            {isComingSoon ? 'Coming Soon' : 'Now Playing'}
          </span>
          {movie.classification && (
            <span className="rounded-lg bg-dark-950/80 backdrop-blur-xl px-2.5 py-1 text-[10px] font-bold text-white border border-white/15">
              {movie.classification}
            </span>
          )}
        </div>

        {/* Rating */}
        {!isComingSoon && movie.rating ? (
          <div className="absolute bottom-3 left-3 flex items-center gap-1.5 rounded-lg bg-dark-950/80 backdrop-blur-xl px-2.5 py-1.5 text-xs font-semibold text-amber-400 border border-amber-500/25">
            {movie.rating}
          </div>
        ) : null}

        {/* Hover Overlay with Play Button */}
        <div className="absolute inset-0 bg-gradient-to-t from-primary-600/0 via-primary-600/0 to-primary-600/0 group-hover:from-primary-600/30 group-hover:via-primary-600/10 group-hover:to-transparent transition-all duration-500 flex items-center justify-center">
          <div className="opacity-0 group-hover:opacity-100 transition-all duration-500 transform scale-75 group-hover:scale-100">
            <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-xl flex items-center justify-center border border-white/30 shadow-2xl group-hover:shadow-primary-500/20 transition-all duration-300">
              <Play className="h-7 w-7 text-white ml-0.5" fill="currentColor" />
            </div>
          </div>
        </div>

        {/* Light Sweep Effect */}
        <div className="light-sweep opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      </div>

      <div className="p-5 flex flex-col flex-grow">
        <h3 className="mb-3 line-clamp-2 text-[15px] font-display font-semibold text-white group-hover:text-primary-400 transition-colors duration-300">
          {movie.title}
        </h3>
        
        <div className="flex items-center gap-4 text-xs text-neutral-500 mb-4">
          <div className="flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5" />
            <span>{movie.duration} min</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5" />
            <span>{nearestShowtimeLabel || releaseYear}</span>
          </div>
        </div>
        
        <div className="mb-6 flex flex-wrap gap-1.5">
          {(movie.genre || []).slice(0, 3).map((g) => (
            <span key={g} className="rounded-lg bg-white/[0.05] px-2.5 py-1 text-[10px] font-medium text-neutral-300 border border-white/[0.08]">{g}</span>
          ))}
          {isComingSoon && (
            <span className="rounded-lg bg-accent-500/10 px-2.5 py-1 text-[10px] font-medium text-accent-400 border border-accent-500/20">
              {hasValidReleaseDate
                ? releaseDate.toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                  })
                : 'TBA'}
            </span>
          )}
        </div>
        
        <div className="mt-auto flex gap-2.5">
          <Link
            to={`/movies/${movie._id}`}
            className="btn btn-secondary btn-sm flex-1 group/btn"
          >
            Details
            <ChevronRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover/btn:translate-x-0.5" />
          </Link>
          <Link
            to={`/book/${movie._id}`}
            className={`btn btn-sm flex-1 ripple ${isComingSoon ? 'btn-secondary' : 'btn-primary'} group/btn`}
          >
            <Ticket className="h-3.5 w-3.5 transition-transform duration-300 group-hover/btn:rotate-12" />
            {isComingSoon ? 'Preview' : 'Buy'}
          </Link>
        </div>
      </div>
    </motion.div>
  );
}
