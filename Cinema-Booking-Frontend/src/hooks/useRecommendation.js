import { useState, useEffect } from 'react';
import { getRecommendations } from '../services/recommendationApi';

const useRecommendation = (movieId) => {
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchRecommendations = async () => {
    if (!movieId) return;
    try {
      setLoading(true);
      setError(null);
      const data = await getRecommendations(movieId);
      setRecommendations(data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load recommendations');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecommendations();
  }, [movieId]);

  const retry = () => {
    fetchRecommendations();
  };

  return { recommendations, loading, error, retry };
};

export default useRecommendation;
