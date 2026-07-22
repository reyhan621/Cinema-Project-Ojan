import api from './api';
import { resolvePosterUrl } from '@/lib/poster';

export const getRecommendations = async (movieId) => {
  const response = await api.get(`/recommendations/${movieId}`);
  const recommendations = response.data.recommendations || [];
  return recommendations.map((movie) => ({
    ...movie,
    poster_url: resolvePosterUrl(movie.poster || '', movie.updatedAt),
  }));
};
