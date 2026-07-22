export interface AuthUser {
  id: string;
  _id?: string;
  email: string;
  username?: string;
  fullName: string;
  role: 'user' | 'admin';
  avatarUrl?: string;
}

export interface IMovie {
  _id: string;
  title: string;
  description: string;
  genre: string[];
  duration: number;
  release_date: string;
  poster_url: string;
  poster?: string;
  trailer_url?: string;
  backdrop_url?: string;
  classification?: string;
  director?: string;
  cast?: string[];
  rating?: string;
  status: 'now_showing' | 'coming_soon';
  is_now_showing?: boolean;
  nearest_showtime?: {
    showtime_id: string;
    show_date: string;
    start_time: string;
    cinema_name?: string;
    cinema_city?: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface ICinema {
  _id: string;
  name: string;
  city: string;
  createdAt: string;
  updatedAt: string;
}

export interface IHall {
  _id: string;
  cinema?: ICinema;
  hall_name: string;
  total_seats: number;
  layout_rows: number;
  layout_columns: number;
  is_active?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface IShowtime {
  _id: string;
  movie: IMovie;
  hall: IHall;
  cinema?: ICinema;
  show_date: string;
  start_time: string;
  end_time: string;
  ticket_price: number;
}

export interface IBooking {
  _id: string;
  user: AuthUser;
  showtime: IShowtime;
  booking_date: string;
  total_seats: number;
  total_amount: number;
  status: 'pending' | 'confirmed' | 'cancelled';
  selected_seats: string[];
}

export interface MovieFilters {
  search?: string;
  genre?: string;
  status?: 'all' | 'now_showing' | 'coming_soon';
  sort?: 'title' | 'release_date' | 'rating';
}

export interface ShowtimeInput {
  movie: string;
  hall: string;
  cinema: string;
  show_date: string;
  start_time: string;
  end_time: string;
  ticket_price: number;
}

export interface BookingInput {
  user: string;
  showtime: string;
  selected_seats: string[];
  total_seats: number;
  total_amount: number;
  status?: 'pending' | 'confirmed' | 'cancelled';
}
