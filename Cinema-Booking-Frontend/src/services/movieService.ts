import api from "./api";
import type { IMovie, MovieFilters } from "@/types";
import { resolvePosterUrl } from "@/lib/poster";

interface BackendMovie {
  _id: string;
  title: string;
  genre: string | string[];
  duration: number;
  rating: string;
  poster: string;
  trailerUrl: string;
  description: string;
  director?: string;
  cast?: string[];
  updatedAt?: string;
}

const DEFAULT_POSTER =
  "https://images.pexels.com/photos/7991579/pexels-photo-7991579.jpeg?auto=compress&cs=tinysrgb&w=400&h=600&fit=crop";

const toEmbedUrl = (url: string): string => {
  if (!url) return "";
  const ytMatch = url.match(
    /(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]+)/,
  );
  if (ytMatch) return `https://www.youtube.com/embed/${ytMatch[1]}`;
  return url;
};

const normalizeGenres = (genre: string | string[] | undefined): string[] => {
  if (Array.isArray(genre)) return genre.filter(Boolean);
  if (typeof genre === "string" && genre.trim()) return [genre.trim()];
  return [];
};

const mapMovie = (m: BackendMovie): IMovie => ({
  _id: m._id,
  title: m.title,
  description: m.description,
  genre: normalizeGenres(m.genre),
  duration: m.duration,
  rating: m.rating || "",
  poster_url: resolvePosterUrl(m.poster, m.updatedAt) || DEFAULT_POSTER,
  trailer_url: toEmbedUrl(m.trailerUrl || ""),
  release_date: "",
  status: "now_showing",
  director: m.director || "",
  cast: Array.isArray(m.cast) ? m.cast : [],
  createdAt: "",
  updatedAt: m.updatedAt || "",
});

const getBackendError = (error: unknown): string => {
  if (
    error &&
    typeof error === 'object' &&
    'response' in error &&
    error.response &&
    typeof error.response === 'object' &&
    'data' in error.response &&
    error.response.data &&
    typeof error.response.data === 'object' &&
    'message' in error.response.data
  ) {
    return String((error.response as { data: { message: string } }).data.message);
  }
  if (error instanceof Error) return error.message;
  return 'An unexpected error occurred';
};

export const movieService = {
  async getMovies(filters: MovieFilters = {}) {
    const baseParams: Record<string, string> = {};
    if (filters.search) baseParams.search = filters.search;
    if (filters.genre) baseParams.genre = filters.genre;

    // The backend paginates (max 50 per page). Fetch page 1, then pull any remaining
    // pages so the caller receives the FULL catalog. The Movies page paginates
    // client-side, so it needs every movie — not just the backend's first page.
    const PAGE_SIZE = 50;
    const MAX_PAGES = 20; // safety cap (≤ 1000 movies)
    const first = await api.get("/movies", {
      params: { ...baseParams, page: "1", limit: String(PAGE_SIZE) },
    });
    const totalPages = Math.min(Number(first.data.totalPages) || 1, MAX_PAGES);

    const rest = await Promise.all(
      Array.from({ length: Math.max(totalPages - 1, 0) }, (_, i) =>
        api.get("/movies", {
          params: { ...baseParams, page: String(i + 2), limit: String(PAGE_SIZE) },
        }),
      ),
    );

    const raw = [first, ...rest].flatMap((r) => r.data.data || []);
    let movies: IMovie[] = raw.map(mapMovie);

    if (filters.status && filters.status !== "all") {
      movies = movies.filter((m) => m.status === filters.status);
    }
    if (filters.sort) {
      if (filters.sort === "release_date") {
        movies.sort((a, b) => a.title.localeCompare(b.title));
      } else if (filters.sort === "rating") {
        movies.sort((a, b) => (a.rating || "").localeCompare(b.rating || ""));
      } else {
        movies.sort((a, b) => a.title.localeCompare(b.title));
      }
    }

    return movies;
  },

  async getMovieById(id: string) {
    const res = await api.get(`/movies/${id}`);
    return mapMovie(res.data.data);
  },

  async createMovie(
    data: Omit<IMovie, "_id" | "createdAt" | "updatedAt">,
    file?: File,
  ) {
    if (file) {
      const formData = new FormData();
      formData.append("title", data.title);
      formData.append("genre", JSON.stringify(data.genre));
      formData.append("duration", String(data.duration));
      formData.append("rating", data.rating || "");
      formData.append("trailerUrl", data.trailer_url || "");
      formData.append("description", data.description);
      formData.append("director", data.director || "");
      formData.append("cast", JSON.stringify(data.cast || []));
      formData.append("poster", file);
      const res = await api.post("/movies", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return mapMovie(res.data.data);
    }
    const payload = {
      title: data.title,
      genre: data.genre,
      duration: data.duration,
      rating: data.rating || "",
      poster: data.poster_url,
      trailerUrl: data.trailer_url || "",
      description: data.description,
      director: data.director || "",
      cast: data.cast || [],
    };
    const res = await api.post("/movies", payload);
    return mapMovie(res.data.data);
  },

  async updateMovie(
    id: string,
    data: Partial<IMovie>,
    file?: File,
  ) {
    if (file) {
      const formData = new FormData();
      if (data.title !== undefined) formData.append("title", data.title);
      if (data.genre !== undefined) formData.append("genre", JSON.stringify(data.genre));
      if (data.duration !== undefined) formData.append("duration", String(data.duration));
      if (data.rating !== undefined) formData.append("rating", data.rating);
      if (data.trailer_url !== undefined) formData.append("trailerUrl", data.trailer_url);
      if (data.description !== undefined) formData.append("description", data.description);
      if (data.director !== undefined) formData.append("director", data.director);
      if (data.cast !== undefined) formData.append("cast", JSON.stringify(data.cast));
      formData.append("poster", file);
      const res = await api.put(`/movies/${id}`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return mapMovie(res.data.data);
    }
    const payload: Record<string, unknown> = {};
    if (data.title !== undefined) payload.title = data.title;
    if (data.genre !== undefined) payload.genre = data.genre;
    if (data.duration !== undefined) payload.duration = data.duration;
    if (data.rating !== undefined) payload.rating = data.rating;
    if (data.trailer_url !== undefined) payload.trailerUrl = data.trailer_url;
    if (data.description !== undefined) payload.description = data.description;
    if (data.director !== undefined) payload.director = data.director;
    if (data.cast !== undefined) payload.cast = data.cast;
    const res = await api.put(`/movies/${id}`, payload);
    return mapMovie(res.data.data);
  },

  async deleteMovie(id: string) {
    await api.delete(`/movies/${id}`);
  },

  getBackendError,
};
