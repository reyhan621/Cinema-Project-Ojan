import { Calendar, KeyRound, LogOut, Mail, Shield, Ticket, User } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { bookingService } from '@/services/bookingService';
import type { IBooking } from '@/types';
import LoadingSpinner from '@/components/LoadingSpinner';
import ErrorMessage from '@/components/ErrorMessage';
import { clsx } from 'clsx';
import toast from 'react-hot-toast';

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0 },
};

const stagger = {
  visible: { transition: { staggerChildren: 0.08 } },
};

export default function ProfilePage() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [bookings, setBookings] = useState<IBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'account' | 'bookings' | 'password'>('account');

  useEffect(() => {
    const loadBookings = async () => {
      if (!user) return;
      try {
        setError('');
        setBookings(await bookingService.getMyBookings(user._id || user.id));
      } catch (err) {
        console.error('Error loading bookings:', err);
        setError('Unable to load booking data. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    loadBookings();
  }, [user]);

  const handleSignOut = async () => {
    try {
      await signOut();
      toast.success('Signed out successfully');
      navigate('/');
    } catch {
      toast.error('Error signing out');
    }
  };

  if (!user || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-dark-950">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <ErrorMessage
          message={error}
          onRetry={() => {
            setLoading(true);
            setError('');
            bookingService.getMyBookings(user._id || user.id)
              .then(setBookings)
              .catch(() => setError('Unable to load booking data. Please try again.'))
              .finally(() => setLoading(false));
          }}
        />
      </div>
    );
  }

  const confirmedBookings = bookings.filter((booking) => booking.status === 'confirmed').length;

  const navItems = [
    { id: 'account' as const, label: 'Account', icon: User },
    { id: 'bookings' as const, label: 'My Bookings', icon: Ticket },
    { id: 'password' as const, label: 'Change Password', icon: KeyRound },
  ];

  return (
    <div className="min-h-screen py-8 bg-dark-950">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.h1
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="text-3xl font-display font-bold mb-8 text-neutral-50"
        >
          Profile
        </motion.h1>

        <motion.div
          className="grid grid-cols-1 lg:grid-cols-4 gap-8"
          initial="hidden"
          animate="visible"
          variants={stagger}
        >
          {/* Sidebar */}
          <motion.div variants={fadeUp} transition={{ duration: 0.4 }} className="lg:col-span-1">
            <div className="glass-panel p-6">
              {/* Avatar */}
              <div className="text-center mb-6">
                <div className="relative inline-block mb-4">
                  <div className="absolute -inset-2 bg-gradient-to-b from-primary-500/20 to-transparent rounded-full blur-xl opacity-50" />
                  <div className="relative w-20 h-20 rounded-full bg-gradient-to-br from-primary-500/20 to-primary-600/20 mx-auto flex items-center justify-center overflow-hidden ring-2 ring-primary-500/20">
                    {user.avatarUrl ? (
                      <img src={user.avatarUrl} alt={user.fullName} className="w-full h-full object-cover" />
                    ) : (
                      <User className="h-10 w-10 text-primary-400" />
                    )}
                  </div>
                </div>
                <h2 className="text-lg font-semibold text-neutral-50">{user.fullName}</h2>
                <p className="text-neutral-400 text-xs">{user.email}</p>
                <span className="status-badge status-confirmed mt-3">{user.role}</span>
              </div>

              {/* Navigation */}
              <nav className="space-y-1">
                {navItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={clsx(
                      'w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200',
                      activeTab === item.id
                        ? 'bg-primary-500/10 text-primary-400 border border-primary-500/20'
                        : 'text-neutral-400 hover:text-neutral-200 hover:bg-white/[0.04] border border-transparent'
                    )}
                  >
                    <item.icon className="h-4.5 w-4.5" />
                    {item.label}
                  </button>
                ))}
                <button
                  onClick={handleSignOut}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-red-400 hover:bg-red-500/10 border border-transparent transition-all duration-200"
                >
                  <LogOut className="h-4.5 w-4.5" />
                  Logout
                </button>
              </nav>
            </div>
          </motion.div>

          {/* Main Content */}
          <div className="lg:col-span-3 space-y-6">
            {activeTab === 'account' && (
              <>
                <motion.div
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4 }}
                  className="glass-panel p-6"
                >
                  <h2 className="text-xl font-semibold mb-5 text-neutral-50">Account Information</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-xl bg-primary-500/10 border border-primary-500/20 flex items-center justify-center shrink-0">
                        <Mail className="h-5 w-5 text-primary-400" />
                      </div>
                      <div>
                        <p className="text-sm text-neutral-400">Email</p>
                        <p className="font-medium text-neutral-200">{user.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-xl bg-primary-500/10 border border-primary-500/20 flex items-center justify-center shrink-0">
                        <Shield className="h-5 w-5 text-primary-400" />
                      </div>
                      <div>
                        <p className="text-sm text-neutral-400">Role</p>
                        <p className="font-medium capitalize text-neutral-200">{user.role}</p>
                      </div>
                    </div>
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.1 }}
                  className="glass-panel p-5"
                >
                  <div className="flex items-center space-x-3 text-neutral-300">
                    <Calendar className="h-5 w-5 text-primary-400 shrink-0" />
                    <p className="text-sm">Your profile is managed securely via the backend.</p>
                  </div>
                </motion.div>
              </>
            )}

            {activeTab === 'bookings' && (
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="glass-panel p-6"
              >
                <h2 className="text-xl font-semibold mb-5 text-neutral-50">Booking Summary</h2>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-4">
                    <p className="text-sm text-neutral-400 mb-1">Total Bookings</p>
                    <p className="text-2xl font-bold text-neutral-50">{bookings.length}</p>
                  </div>
                  <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-4">
                    <p className="text-sm text-neutral-400 mb-1">Confirmed</p>
                    <p className="text-2xl font-bold text-emerald-400">{confirmedBookings}</p>
                  </div>
                  <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-4">
                    <p className="text-sm text-neutral-400 mb-1">Cancelled</p>
                    <p className="text-2xl font-bold text-red-400">
                      {bookings.filter((booking) => booking.status === 'cancelled').length}
                    </p>
                  </div>
                </div>
                <Link to="/my-bookings" className="btn btn-primary mt-6 inline-flex items-center space-x-2">
                  <Ticket className="h-4 w-4" />
                  <span>View My Bookings</span>
                </Link>
              </motion.div>
            )}

            {activeTab === 'password' && (
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="glass-panel p-6"
              >
                <h2 className="text-xl font-semibold mb-2 text-neutral-50">Change Password</h2>
                <p className="text-sm text-neutral-400 mb-6">Update your password to keep your account secure.</p>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-neutral-300 mb-2">Current Password</label>
                    <input type="password" className="auth-input" placeholder="Enter current password" disabled />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-300 mb-2">New Password</label>
                    <input type="password" className="auth-input" placeholder="Enter new password" disabled />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-300 mb-2">Confirm New Password</label>
                    <input type="password" className="auth-input" placeholder="Confirm new password" disabled />
                  </div>
                  <div className="flex flex-col sm:flex-row gap-3 pt-2">
                    <Link to="/change-password" className="auth-btn-primary flex-1 text-center">
                      Go to Change Password
                    </Link>
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
