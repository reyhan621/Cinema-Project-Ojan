import api from "./api";
import { resolvePosterUrl } from "@/lib/poster";
import type { BookingInput, IBooking } from "@/types";

interface BackendBooking {
  _id: string;
  userId: { _id: string; name: string; email: string; role: string };
  movieId: {
    _id: string;
    title: string;
    genre: string | string[];
    duration: number;
    poster: string;
    rating: string;
    description: string;
    trailerUrl: string;
  };
  showtimeId: {
    _id: string;
    date: string;
    time: string;
    endTime?: string;
    studio: string;
    price: number;
    bookedSeats: string[];
    cinema?: { _id: string; name: string; city: string };
    hall?: { _id: string; name: string; rows: number; columns: number; totalSeats: number };
  };
  seats: string[];
  totalPrice: number;
  status: "confirmed" | "cancelled";
  createdAt: string;
}

const DEFAULT_POSTER =
  "https://images.pexels.com/photos/7991579/pexels-photo-7991579.jpeg?auto=compress&cs=tinysrgb&w=400&h=600&fit=crop";

const normalizeGenres = (genre: string | string[] | undefined): string[] => {
  if (Array.isArray(genre)) return genre.filter(Boolean);
  if (typeof genre === "string" && genre.trim()) return [genre.trim()];
  return [];
};

const mapBooking = (b: BackendBooking): IBooking => ({
  _id: b._id,
  user: {
    id: b.userId._id,
    _id: b.userId._id,
    email: b.userId.email,
    fullName: b.userId.name,
    role: (b.userId.role as "user" | "admin") || "user",
  },
  showtime: {
    _id: b.showtimeId._id,
    movie: {
      _id: b.movieId._id,
      title: b.movieId.title,
      genre: normalizeGenres(b.movieId.genre),
      duration: b.movieId.duration,
      poster_url: resolvePosterUrl(b.movieId.poster) || DEFAULT_POSTER,
      rating: b.movieId.rating || "",
      description: b.movieId.description,
      trailer_url: b.movieId.trailerUrl,
      release_date: "",
      status: "now_showing",
      createdAt: "",
      updatedAt: "",
    },
    hall: b.showtimeId.hall
      ? {
          _id: b.showtimeId.hall._id,
          hall_name: b.showtimeId.hall.name,
          total_seats: b.showtimeId.hall.totalSeats,
          layout_rows: b.showtimeId.hall.rows,
          layout_columns: b.showtimeId.hall.columns,
          createdAt: "",
          updatedAt: "",
        }
      : {
          _id: b.showtimeId._id,
          hall_name: b.showtimeId.studio,
          total_seats: 80,
          layout_rows: 8,
          layout_columns: 10,
          createdAt: "",
          updatedAt: "",
        },
    cinema: b.showtimeId.cinema
      ? {
          _id: b.showtimeId.cinema._id,
          name: b.showtimeId.cinema.name,
          city: b.showtimeId.cinema.city,
          createdAt: "",
          updatedAt: "",
        }
      : undefined,
    show_date: b.showtimeId.date,
    start_time: b.showtimeId.time,
    end_time: b.showtimeId.endTime || "",
    ticket_price: b.showtimeId.price,
  },
  booking_date: b.createdAt,
  total_seats: b.seats.length,
  total_amount: b.totalPrice,
  status: b.status,
  selected_seats: b.seats,
});

const DEMO_CONFIRMED_BOOKING_KEY = "cinematix_demo_confirmed_booking";

export const bookingService = {
  async getSeatAvailability(showtimeId: string) {
    const res = await api.get(`/showtimes/${showtimeId}/seats`);
    return res.data.data.bookedSeats || [];
  },

  async createBooking(input: BookingInput) {
    const res = await api.post("/bookings", {
      showtimeId: input.showtime,
      seats: input.selected_seats,
    });
    const booking = mapBooking(res.data.data);
    sessionStorage.setItem(DEMO_CONFIRMED_BOOKING_KEY, booking._id);
    return booking;
  },

  async getMyBookings(_userId: string) { // eslint-disable-line @typescript-eslint/no-unused-vars
    const res = await api.get("/bookings/me");
    return (res.data.data || []).map(mapBooking);
  },

  async getBookingById(id: string) {
    const res = await api.get(`/bookings/${id}`);
    return mapBooking(res.data.data);
  },

  async cancelBooking(id: string) {
    const res = await api.delete(`/bookings/${id}`);
    return res.data;
  },

  getConfirmedBookingId() {
    return sessionStorage.getItem("cinematix_demo_confirmed_booking");
  },

  clearConfirmedBookingId() {
    sessionStorage.removeItem("cinematix_demo_confirmed_booking");
  },
};
