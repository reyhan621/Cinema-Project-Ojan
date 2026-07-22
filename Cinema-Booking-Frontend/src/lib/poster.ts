const API_BASE = import.meta.env.VITE_API_URL?.replace(/\/api\/?$/, '') || 'http://localhost:5001';

/**
 * Convert a poster path/URL to a fully-qualified URL.
 * - External URLs (http/https) are returned as-is
 * - Local upload paths (/uploads/...) are prefixed with the API base URL
 * - Empty/falsy values return an empty string
 * - If updatedAt is provided, appends a cache-busting query param
 */
export const resolvePosterUrl = (poster: string, updatedAt?: string): string => {
  if (!poster) return '';
  if (poster.startsWith('http://') || poster.startsWith('https://')) {
    return updatedAt ? `${poster}?t=${new Date(updatedAt).getTime()}` : poster;
  }
  if (poster.startsWith('/uploads/')) {
    const url = `${API_BASE}${poster}`;
    return updatedAt ? `${url}?t=${new Date(updatedAt).getTime()}` : url;
  }
  return poster;
};
