import { Link } from 'react-router-dom';
import { Clock, RefreshCw } from 'lucide-react';
import { motion } from 'framer-motion';
import useRecommendation from '../hooks/useRecommendation';

function SkeletonCard() {
  return (
    <div className="movie-card flex flex-col">
      <div className="skeleton aspect-[2/3] rounded-t-2xl" />
      <div className="p-5 space-y-3">
        <div className="skeleton h-4 w-3/4 rounded-lg" />
        <div className="flex gap-3">
          <div className="skeleton h-3 w-16 rounded-lg" />
          <div className="skeleton h-3 w-20 rounded-lg" />
        </div>
        <div className="skeleton h-3 w-1/2 rounded-lg" />
      </div>
    </div>
  );
}

function RecommendationCard({ movie }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className="movie-card group flex flex-col card-glow"
    >
      <div className="relative aspect-[2/3] overflow-hidden bg-white/[0.02]">
        <img
          key={`poster-${movie._id}-${movie.updatedAt}`}
          src={movie.poster_url || 'https://images.pexels.com/photos/7991579/pexels-photo-7991579.jpeg?auto=compress&cs=tinysrgb&w=400&h=600&fit=crop'}
          alt={movie.title}
          className="w-full h-full object-cover transition-all duration-700 ease-out group-hover:scale-110"
          loading="lazy"
          onError={(e) => {
            e.target.src = 'https://images.pexels.com/photos/7991579/pexels-photo-7991579.jpeg?auto=compress&cs=tinysrgb&w=400&h=600&fit=crop';
          }}
        />

        <div className="absolute inset-0 bg-gradient-to-t from-dark-950 via-dark-950/40 to-transparent opacity-85" />

        {movie.rating && (
          <div className="absolute bottom-3 left-3 flex items-center gap-1.5 rounded-lg bg-dark-950/80 backdrop-blur-xl px-2.5 py-1.5 text-xs font-semibold text-amber-400 border border-amber-500/25">
            {movie.rating}
          </div>
        )}
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
        </div>

        <div className="mb-6 flex flex-wrap gap-1.5">
          {(movie.genre || []).slice(0, 2).map((g) => (
            <span key={g} className="rounded-lg bg-white/[0.05] px-2.5 py-1 text-[10px] font-medium text-neutral-300 border border-white/[0.08]">{g}</span>
          ))}
        </div>

        <div className="mt-auto">
          <Link
            to={`/movies/${movie._id}`}
            className="btn btn-secondary btn-sm w-full"
          >
            View Details
          </Link>
        </div>
      </div>
    </motion.div>
  );
}

function EmptyState() {
  return (
    <div className="text-center py-12">
      <p className="text-neutral-500 text-sm">No recommendations available.</p>
    </div>
  );
}

function ErrorState({ onRetry }) {
  return (
    <div className="text-center py-12 space-y-4">
      <p className="text-neutral-500 text-sm">Failed to load recommendations.</p>
      <button onClick={onRetry} className="btn btn-secondary btn-sm">
        <RefreshCw className="h-3.5 w-3.5" />
        Retry
      </button>
    </div>
  );
}

export default function RecommendationSection({ movieId }) {
  const { recommendations, loading, error, retry } = useRecommendation(movieId);

  if (loading) {
    return (
      <section>
        <p className="section-eyebrow mb-3">You might also like</p>
        <h2 className="text-xl font-display font-bold text-white mb-5">Recommended For You</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section>
        <p className="section-eyebrow mb-3">You might also like</p>
        <h2 className="text-xl font-display font-bold text-white mb-5">Recommended For You</h2>
        <ErrorState onRetry={retry} />
      </section>
    );
  }

  if (recommendations.length === 0) {
    return (
      <section>
        <p className="section-eyebrow mb-3">You might also like</p>
        <h2 className="text-xl font-display font-bold text-white mb-5">Recommended For You</h2>
        <EmptyState />
      </section>
    );
  }

  return (
    <section>
      <p className="section-eyebrow mb-3">You might also like</p>
      <h2 className="text-xl font-display font-bold text-white mb-5">Recommended For You</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {recommendations.map((movie) => (
          <RecommendationCard key={movie._id} movie={movie} />
        ))}
      </div>
    </section>
  );
}
