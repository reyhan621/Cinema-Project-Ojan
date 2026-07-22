import api from "./api";
import { resolvePosterUrl } from "@/lib/poster";
import { IBooking } from "@/types";

interface BackendBooking {
  _id: string;
  userId: { _id: string; name: string; email: string };
  movieId: { _id: string; title: string; poster?: string };
  showtimeId: {
    _id: string;
    date: string;
    time: string;
    endTime?: string;
    studio: string;
    price: number;
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

const mapAdminBooking = (b: BackendBooking): IBooking => ({
  _id: b._id,
  user: {
    id: b.userId._id,
    _id: b.userId._id,
    email: b.userId.email,
    fullName: b.userId.name,
    role: "user",
  },
  showtime: {
    _id: b.showtimeId._id,
    movie: {
      _id: b.movieId._id,
      title: b.movieId.title,
      genre: [],
      duration: 0,
      poster_url: resolvePosterUrl(b.movieId.poster || "") || DEFAULT_POSTER,
      description: "",
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

export const adminService = {
  async getDashboardStats() {
    try {
      const res = await api.get("/admin/stats");
      const d = res.data.data;
      return {
        totalMovies: d.totalMovies || 0,
        totalHalls: d.totalHalls || 0,
        totalShowtimes: d.totalShowtimes || 0,
        totalBookings: d.totalBookings || 0,
        totalUsers: d.totalUsers || 0,
        totalCinemas: d.totalCinemas || 0,
        totalRevenue: 0,
        recentBookings: [],
        popularMovies: [],
        weeklyRevenue: [],
      };
    } catch {
      return {
        totalMovies: 0,
        totalHalls: 0,
        totalShowtimes: 0,
        totalBookings: 0,
        totalUsers: 0,
        totalCinemas: 0,
        totalRevenue: 0,
        recentBookings: [],
        popularMovies: [],
        weeklyRevenue: [],
      };
    }
  },

  async getAllBookings(
    filters: {
      status?: string;
      search?: string;
      movieId?: string;
      date?: string;
    } = {},
  ) {
    try {
      // The endpoint paginates (default 10), so page through to get ALL bookings —
      // otherwise the report's revenue and status totals only reflect the first page.
      const PAGE_SIZE = 100;
      const first = await api.get("/admin/bookings", { params: { page: 1, limit: PAGE_SIZE } });
      const totalPages = Math.min(Number(first.data.totalPages) || 1, 50);
      const rest = await Promise.all(
        Array.from({ length: Math.max(totalPages - 1, 0) }, (_, i) =>
          api.get("/admin/bookings", { params: { page: i + 2, limit: PAGE_SIZE } }),
        ),
      );
      let bookings: IBooking[] = [first, ...rest]
        .flatMap((r) => r.data.data || [])
        .map(mapAdminBooking);

      if (filters.status && filters.status !== "all") {
        bookings = bookings.filter((b) => b.status === filters.status);
      }
      if (filters.search) {
        const q = filters.search.toLowerCase();
        bookings = bookings.filter(
          (b) =>
            b.user.fullName.toLowerCase().includes(q) ||
            b.user.email.toLowerCase().includes(q) ||
            b.showtime.movie.title.toLowerCase().includes(q),
        );
      }
      return bookings;
    } catch {
      return [];
    }
  },

  async getBookingById(id: string) {
    const res = await api.get(`/bookings/${id}`);
    return mapAdminBooking(res.data.data);
  },

  async updateBookingStatus(
    id: string,
    status: "pending" | "confirmed" | "cancelled",
  ) {
    if (status === "cancelled") {
      await api.delete(`/bookings/${id}`);
    }
    return { _id: id, status };
  },
};
