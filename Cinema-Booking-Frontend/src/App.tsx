import { Routes, Route } from 'react-router-dom'
import { useAuth } from './contexts/AuthContext'
import Layout from './components/Layout'
import AdminLayout from './components/admin/AdminLayout'
import ProtectedRoute from './components/ProtectedRoute'

// Public pages
import HomePage from './pages/HomePage'
import MoviesPage from './pages/MoviesPage'
import MovieDetailsPage from './pages/MovieDetailsPage'
import LoginPage from './pages/auth/LoginPage'
import RegisterPage from './pages/auth/RegisterPage'
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage'
import VerifyEmailPage from './pages/auth/VerifyEmailPage'
import ResetPasswordPage from './pages/auth/ResetPasswordPage'

import UnauthorizedPage from './pages/UnauthorizedPage'
import NotFoundPage from './pages/NotFoundPage'

// User pages
import BookingsPage from './pages/user/BookingsPage'
import BookingDetailsPage from './pages/user/BookingDetailsPage'
import BookingPage from './pages/user/BookingPage'
import SeatSelectionPage from './pages/user/SeatSelectionPage' 
import PaymentPage from './pages/user/PaymentPage'
import BookingConfirmationPage from './pages/user/BookingConfirmationPage'
import ProfilePage from './pages/user/ProfilePage'
import ChangePasswordPage from './pages/user/ChangePasswordPage'

// Admin pages
import AdminLoginPage from './pages/admin/AdminLoginPage'
import AdminDashboardPage from './pages/admin/AdminDashboardPage'
import AdminMoviesPage from './pages/admin/AdminMoviesPage'
import AdminCinemasPage from './pages/admin/AdminCinemasPage'
import AdminHallsPage from './pages/admin/AdminHallsPage'
import AdminShowtimesPage from './pages/admin/AdminShowtimesPage'
import AdminBookingsPage from './pages/admin/AdminBookingsPage'
import AdminBookingDetailsPage from './pages/admin/AdminBookingDetailsPage' 
import AdminReportsPage from './pages/admin/AdminReport' 

function App() {
  useAuth()

  return (
    <Routes>
      {/* Public and User routes */}
      <Route path="/" element={<Layout />}>
        <Route index element={<HomePage />} />
        <Route path="movies" element={<MoviesPage />} />
        <Route path="movies/:id" element={<MovieDetailsPage />} /> {/* keep consistent plural */}
        <Route path="book/:movieId" element={
          <ProtectedRoute>
            <BookingPage />
          </ProtectedRoute>
        } />
        <Route path="booking/:showtimeId" element={
          <ProtectedRoute>
            <BookingPage />
          </ProtectedRoute>
        } />
        <Route path="seat-selection/:movieId" element={
          <ProtectedRoute>
            <SeatSelectionPage />
          </ProtectedRoute>
        } />
        <Route path="login" element={<LoginPage />} />
        <Route path="register" element={<RegisterPage />} />
        <Route path="forgot-password" element={<ForgotPasswordPage />} />
        <Route path="verify-email" element={<VerifyEmailPage />} />
        <Route path="reset-password" element={<ResetPasswordPage />} />

        {/* Protected user routes */}
        <Route path="bookings" element={
          <ProtectedRoute>
            <BookingsPage />
          </ProtectedRoute>
        } />
        <Route path="my-bookings" element={
          <ProtectedRoute>
            <BookingsPage />
          </ProtectedRoute>
        } />
        <Route path="bookings/:id" element={
          <ProtectedRoute>
            <BookingDetailsPage />
          </ProtectedRoute>
        } />
        <Route path="tickets/:id" element={
          <ProtectedRoute>
            <BookingDetailsPage />
          </ProtectedRoute>
        } />
        <Route path="profile" element={
          <ProtectedRoute>
            <ProfilePage />
          </ProtectedRoute>
        } />
        <Route path="change-password" element={
          <ProtectedRoute>
            <ChangePasswordPage />
          </ProtectedRoute>
        } />
        <Route path="payment" element={
          <ProtectedRoute>
            <PaymentPage />
          </ProtectedRoute>
        } />
        <Route path="booking-confirmation" element={
          <ProtectedRoute>
            <BookingConfirmationPage />
          </ProtectedRoute>
        } />
        <Route path="unauthorized" element={<UnauthorizedPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>

      {/* Admin routes */}
      <Route path="/admin/login" element={<AdminLoginPage />} />
      <Route path="/admin" element={
        <ProtectedRoute requireAdmin>
          <AdminLayout />
        </ProtectedRoute>
      }>
        <Route index element={<AdminDashboardPage />} />
        <Route path="movies" element={<AdminMoviesPage />} />
        <Route path="movies/new" element={<AdminMoviesPage />} />
        <Route path="movies/:movieId/edit" element={<AdminMoviesPage />} />
        <Route path="cinemas" element={<AdminCinemasPage />} />
        <Route path="halls" element={<AdminHallsPage />} />
        <Route path="showtimes" element={<AdminShowtimesPage />} />
        <Route path="showtimes/new" element={<AdminShowtimesPage />} />
        <Route path="showtimes/:showtimeId/edit" element={<AdminShowtimesPage />} />
        <Route path="bookings" element={<AdminBookingsPage />} />
        <Route path="bookings/:id" element={<AdminBookingDetailsPage />} />
        <Route path="reports" element={<AdminReportsPage />} />
      </Route>
    </Routes>
  )
}

export default App
