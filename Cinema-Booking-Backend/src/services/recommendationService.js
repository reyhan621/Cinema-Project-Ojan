const Movie = require("../models/Movie");
const AppError = require("../utils/AppError");

const MAX_RECOMMENDATIONS = 6;

const getRecommendations = async (movieId) => {
  const movie = await Movie.findById(movieId);
  if (!movie) {
    throw new AppError("Movie not found", 404);
  }

  const movieGenres = Array.isArray(movie.genre)
    ? movie.genre
    : movie.genre
      ? [movie.genre]
      : [];

  const genreMatches = await Movie.find({
    genre: { $in: movieGenres },
    _id: { $ne: movie._id },
  });

  const sorted = genreMatches
    .sort((a, b) => parseFloat(b.rating || 0) - parseFloat(a.rating || 0))
    .slice(0, MAX_RECOMMENDATIONS);

  if (sorted.length >= MAX_RECOMMENDATIONS) {
    return sorted;
  }

  const excludeIds = [movie._id, ...sorted.map((m) => m._id)];

  const fallback = await Movie.find({
    _id: { $nin: excludeIds },
  });

  const sortedFallback = fallback
    .sort((a, b) => parseFloat(b.rating || 0) - parseFloat(a.rating || 0))
    .slice(0, MAX_RECOMMENDATIONS - sorted.length);

  return [...sorted, ...sortedFallback];
};

module.exports = { getRecommendations };
