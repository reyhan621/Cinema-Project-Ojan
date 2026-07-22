import api from "./api";
import { resolvePosterUrl } from "@/lib/poster";
import type { IHall, IMovie, IShowtime, ShowtimeInput } from "@/types";

interface BackendShowtime {
  _id: string;
  movieId: {
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
  };
  cinema?: {
    _id: string;
    name: string;
    city: string;
  };
  hall?: {
    _id: string;
    name: string;
    rows: number;
    columns: number;
    totalSeats: number;
  };
  date: string;
  time: string;
  endTime?: string;
  studio: string;
  price: number;
  bookedSeats: string[];
}

interface BackendHall {
  _id: string;
  cinema?: { _id: string; name: string; city: string };
  name: string;
  rows: number;
  columns: number;
  totalSeats: number;
  createdAt?: string;
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

const mapShowtime = (s: BackendShowtime): IShowtime => {
  const movie = s.movieId;
  return {
    _id: s._id,
    movie: {
      _id: movie._id,
      title: movie.title,
      genre: normalizeGenres(movie.genre),
      duration: movie.duration,
      rating: movie.rating || "",
      poster_url: resolvePosterUrl(movie.poster) || DEFAULT_POSTER,
      trailer_url: toEmbedUrl(movie.trailerUrl || ""),
      description: movie.description,
      director: movie.director || "",
      cast: Array.isArray(movie.cast) ? movie.cast : [],
      release_date: "",
      status: "now_showing",
      createdAt: "",
      updatedAt: "",
    },
    hall: s.hall
      ? {
          _id: s.hall._id,
          hall_name: s.hall.name,
          total_seats: s.hall.totalSeats,
          layout_rows: s.hall.rows,
          layout_columns: s.hall.columns,
          createdAt: "",
          updatedAt: "",
        }
      : {
          _id: s._id,
          hall_name: s.studio || "Unknown",
          total_seats: 80,
          layout_rows: 8,
          layout_columns: 10,
          createdAt: "",
          updatedAt: "",
        },
    cinema: s.cinema
      ? {
          _id: s.cinema._id,
          name: s.cinema.name,
          city: s.cinema.city,
          createdAt: "",
          updatedAt: "",
        }
      : undefined,
    show_date: s.date,
    start_time: s.time,
    end_time: s.endTime || "",
    ticket_price: s.price,
  };
};

const mapHall = (h: BackendHall): IHall => ({
  _id: h._id,
  cinema: h.cinema
    ? { _id: h.cinema._id, name: h.cinema.name, city: h.cinema.city, createdAt: "", updatedAt: "" }
    : undefined,
  hall_name: h.name,
  total_seats: h.totalSeats,
  layout_rows: h.rows,
  layout_columns: h.columns,
  createdAt: h.createdAt || "",
  updatedAt: h.updatedAt || "",
});

export const showtimeService = {
  async getShowtimes(
    filters: {
      movieId?: string;
      date?: string;
      cinemaId?: string;
      upcoming?: boolean;
    } = {},
  ) {
    const params: Record<string, string> = {};
    if (filters.movieId) params.movieId = filters.movieId;
    if (filters.date) params.date = filters.date;
    if (filters.cinemaId) params.cinemaId = filters.cinemaId;
    if (filters.upcoming !== undefined) params.upcoming = String(filters.upcoming);

    const res = await api.get("/showtimes", { params });
    return (res.data.data || []).map(mapShowtime);
  },

  async getShowtimeById(id: string) {
    const res = await api.get(`/showtimes/${id}`);
    return mapShowtime(res.data.data);
  },

  async getMovieShowtimes(
    movieId: string,
    filters: { cinemaId?: string; upcoming?: boolean } = {},
  ): Promise<IShowtime[]> {
    return this.getShowtimes({ movieId, ...filters });
  },

  async createShowtime(data: ShowtimeInput) {
    const payload = {
      movieId: data.movie,
      cinema: data.cinema,
      hall: data.hall,
      date: data.show_date,
      time: data.start_time,
      endTime: data.end_time,
      studio: "",
      price: data.ticket_price,
    };
    const res = await api.post("/showtimes", payload);
    return mapShowtime(res.data.data);
  },

  async updateShowtime(id: string, data: ShowtimeInput) {
    const payload = {
      movieId: data.movie,
      cinema: data.cinema,
      hall: data.hall,
      date: data.show_date,
      time: data.start_time,
      endTime: data.end_time,
      studio: "",
      price: data.ticket_price,
    };
    const res = await api.put(`/showtimes/${id}`, payload);
    return mapShowtime(res.data.data);
  },

  async deleteShowtime(id: string) {
    await api.delete(`/showtimes/${id}`);
  },

  async getNowPlaying(cinemaId?: string): Promise<IMovie[]> {
    const params: Record<string, string> = {};
    if (cinemaId) params.cinemaId = cinemaId;
    const res = await api.get("/showtimes/now-playing", { params });
    return (res.data.data || []).map((m: BackendShowtime["movieId"]) => ({
      _id: m._id,
      title: m.title,
      description: m.description || "",
      genre: normalizeGenres(m.genre),
      duration: m.duration,
      rating: m.rating || "",
      poster_url: resolvePosterUrl(m.poster) || DEFAULT_POSTER,
      trailer_url: toEmbedUrl(m.trailerUrl || ""),
      release_date: "",
      status: "now_showing" as const,
      director: m.director || "",
      cast: Array.isArray(m.cast) ? m.cast : [],
      createdAt: "",
      updatedAt: "",
    }));
  },

  async getComingSoon(cinemaId?: string): Promise<IMovie[]> {
    const params: Record<string, string> = {};
    if (cinemaId) params.cinemaId = cinemaId;
    const res = await api.get("/showtimes/coming-soon", { params });
    return (res.data.data || []).map((m: BackendShowtime["movieId"]) => ({
      _id: m._id,
      title: m.title,
      description: m.description || "",
      genre: normalizeGenres(m.genre),
      duration: m.duration,
      rating: m.rating || "",
      poster_url: resolvePosterUrl(m.poster) || DEFAULT_POSTER,
      trailer_url: toEmbedUrl(m.trailerUrl || ""),
      release_date: "",
      status: "coming_soon" as const,
      director: m.director || "",
      cast: Array.isArray(m.cast) ? m.cast : [],
      createdAt: "",
      updatedAt: "",
    }));
  },

  async getHalls(cinemaId?: string): Promise<IHall[]> {
    const params: Record<string, string> = {};
    if (cinemaId) params.cinemaId = cinemaId;
    const res = await api.get("/halls", { params });
    return (res.data.data || []).map(mapHall);
  },

  async createHall(data: Omit<IHall, "_id" | "createdAt" | "updatedAt">) {
    const payload = {
      cinema: data.cinema?._id || "",
      name: data.hall_name,
      rows: data.layout_rows,
      columns: data.layout_columns,
    };
    const res = await api.post("/halls", payload);
    return mapHall(res.data.data);
  },

  async updateHall(id: string, data: Partial<IHall>) {
    const payload: Record<string, unknown> = {};
    if (data.cinema) payload.cinema = data.cinema._id;
    if (data.hall_name) payload.name = data.hall_name;
    if (data.layout_rows) payload.rows = data.layout_rows;
    if (data.layout_columns) payload.columns = data.layout_columns;
    const res = await api.put(`/halls/${id}`, payload);
    return mapHall(res.data.data);
  },

  async deleteHall(id: string) {
    await api.delete(`/halls/${id}`);
  },
};
