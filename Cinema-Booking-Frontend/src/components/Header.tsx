import { Link, useNavigate, useLocation } from 'react-router-dom';
import { LogOut, MapPin, Settings, Ticket, User, ChevronDown } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useCinema } from '@/contexts/CinemaContext';
import { useState, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import { clsx } from 'clsx';
import { motion, AnimatePresence } from 'framer-motion';
import logo from "../assets/logo.png";

export default function Header() {
  const { user, isAdmin, signOut } = useAuth();
  const { cinemas, selectedCinemaId, selectedCinema, setSelectedCinemaId, loading: cinemasLoading } = useCinema();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [locationMenuOpen, setLocationMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const locationRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (locationRef.current && !locationRef.current.contains(e.target as Node)) {
        setLocationMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSignOut = async () => {
    try {
      await signOut();
      toast.success('Signed out successfully');
      navigate('/');
    } catch (error) {
      toast.error('Error signing out');
    }
  };

  const navItems = [
    { href: '/', label: 'Home' },
    { href: '/movies', label: 'Movies' },
  ];

  if (user) {
    navItems.push({ href: '/my-bookings', label: 'My Bookings' });
  }

  const isActive = (href: string) => {
    if (href === '/') return location.pathname === '/';
    return location.pathname.startsWith(href);
  };

  return (
    <header className={clsx(
      "fixed top-0 left-0 right-0 z-50 transition-all duration-500",
      scrolled 
        ? "bg-dark-950/80 backdrop-blur-[28px] border-b border-white/[0.06] shadow-2xl shadow-black/30" 
        : "bg-transparent backdrop-blur-[6px]"
    )}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="relative">
              <img
                src={logo}
                alt="CineLux Logo"
                className="h-11 w-11 transition-all duration-500 group-hover:scale-110 group-hover:rotate-3"
              />
              <div className="absolute inset-0 bg-primary-500/30 rounded-xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-display font-bold text-white tracking-tight">
                CINE<span className="text-gradient-premium">LUX</span>
              </span>
              <span className="text-[9px] font-medium uppercase tracking-[0.3em] text-neutral-500 -mt-0.5">Premium Cinema</span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-2">
            {navItems.map((item) => (
              <Link
                key={item.href}
                to={item.href}
                className={clsx(
                  "relative px-5 py-2.5 text-sm font-medium rounded-xl transition-all duration-300 group",
                  isActive(item.href)
                    ? 'text-white bg-white/[0.1]'
                    : 'text-neutral-400 hover:text-white hover:bg-white/[0.06]'
                )}
              >
                {item.label}
                {isActive(item.href) && (
                  <motion.div
                    layoutId="activeNav"
                    className="absolute bottom-0 left-4 right-4 h-0.5 bg-gradient-to-r from-[#FF2D75] to-[#FF7A18] rounded-full"
                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                  />
                )}
                <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-primary-500/0 to-primary-500/0 group-hover:from-primary-500/5 group-hover:to-accent-500/5 transition-all duration-300" />
              </Link>
            ))}
          </nav>

          {/* User Menu */}
          <div className="flex items-center gap-3">
            {/* Location Dropdown */}
            <div className="relative" ref={locationRef}>
              <button
                onClick={() => setLocationMenuOpen(!locationMenuOpen)}
                className="inline-flex items-center gap-2 rounded-xl border border-white/[0.1] bg-white/[0.05] px-3 sm:px-4 py-2.5 text-xs font-medium text-neutral-300 hover:border-white/[0.15] hover:bg-white/[0.08] hover:text-white transition-all duration-300 hover:-translate-y-0.5 active:translate-y-0 backdrop-blur-xl group"
              >
                <MapPin className="h-3.5 w-3.5 text-primary-400 group-hover:text-primary-300 transition-colors shrink-0" />
                <span className="max-w-[92px] truncate sm:max-w-none">
                  {selectedCinema ? `${selectedCinema.name} — ${selectedCinema.city}` : 'All Cinemas'}
                </span>
                <ChevronDown className={clsx("h-3 w-3 text-neutral-500 group-hover:text-neutral-400 transition-transform duration-200 shrink-0", locationMenuOpen && "rotate-180")} />
              </button>

              <AnimatePresence>
                {locationMenuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.96 }}
                    transition={{ duration: 0.2, ease: 'easeOut' }}
                    className="absolute right-0 mt-3 w-72 rounded-2xl border border-white/[0.1] bg-dark-900/95 shadow-premium backdrop-blur-3xl py-2 overflow-hidden z-50"
                  >
                    <div className="px-4 py-3 border-b border-white/[0.06]">
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-neutral-500">Select Location</p>
                    </div>
                    <div className="max-h-64 overflow-y-auto py-1">
                      <button
                        onClick={() => {
                          setSelectedCinemaId('');
                          setLocationMenuOpen(false);
                        }}
                        className={clsx(
                          "flex items-center gap-3 w-full px-4 py-3 text-sm transition-all duration-200",
                          !selectedCinemaId
                            ? 'text-white bg-white/[0.08]'
                            : 'text-neutral-300 hover:bg-white/[0.06] hover:text-white'
                        )}
                      >
                        <MapPin className="h-4 w-4 text-primary-400 shrink-0" />
                        <span className="font-medium">All Cinemas</span>
                      </button>
                      {cinemasLoading ? (
                        <div className="px-4 py-3 text-xs text-neutral-500">Loading...</div>
                      ) : (
                        cinemas.map((cinema) => (
                          <button
                            key={cinema._id}
                            onClick={() => {
                              setSelectedCinemaId(cinema._id);
                              setLocationMenuOpen(false);
                            }}
                            className={clsx(
                              "flex items-center gap-3 w-full px-4 py-3 text-sm transition-all duration-200",
                              selectedCinemaId === cinema._id
                                ? 'text-white bg-white/[0.08]'
                                : 'text-neutral-300 hover:bg-white/[0.06] hover:text-white'
                            )}
                          >
                            <MapPin className="h-4 w-4 text-primary-400 shrink-0" />
                            <div className="flex flex-col items-start">
                              <span className="font-medium">{cinema.name}</span>
                              <span className="text-xs text-neutral-500">{cinema.city}</span>
                            </div>
                          </button>
                        ))
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {user ? (
              <div className="flex items-center gap-2">
                {isAdmin && (
                  <Link
                    to="/admin"
                    className="hidden sm:inline-flex items-center gap-2 btn btn-secondary btn-sm"
                  >
                    <Settings className="h-3.5 w-3.5" />
                    Admin
                  </Link>
                )}
                <Link to="/my-bookings" className="hidden sm:inline-flex items-center gap-2 btn btn-primary btn-sm ripple">
                  <Ticket className="h-3.5 w-3.5" />
                  Tickets
                </Link>

                {/* User dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                    className="flex items-center gap-2.5 rounded-xl border border-white/[0.1] bg-white/[0.05] px-3.5 py-2 hover:border-white/[0.15] hover:bg-white/[0.08] transition-all duration-300 hover:-translate-y-0.5 active:translate-y-0 backdrop-blur-xl group"
                  >
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-500/30 to-accent-500/30 flex items-center justify-center ring-2 ring-white/[0.1] group-hover:ring-primary-500/30 transition-all duration-300">
                      <User className="h-4 w-4 text-primary-300" />
                    </div>
                    <span className="hidden sm:inline text-sm font-medium text-neutral-200 max-w-[100px] truncate">
                      {user.fullName || user.email}
                    </span>
                    <ChevronDown className={clsx("h-3.5 w-3.5 text-neutral-500 transition-transform duration-200", userMenuOpen && "rotate-180")} />
                  </button>

                  <AnimatePresence>
                    {userMenuOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: 8, scale: 0.96 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 8, scale: 0.96 }}
                        transition={{ duration: 0.2, ease: 'easeOut' }}
                        className="absolute right-0 mt-3 w-64 rounded-2xl border border-white/[0.1] bg-dark-900/95 shadow-premium backdrop-blur-3xl py-2 overflow-hidden"
                      >
                        <div className="px-5 py-4 border-b border-white/[0.06]">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-500/30 to-accent-500/30 flex items-center justify-center ring-2 ring-white/[0.1]">
                              <User className="h-5 w-5 text-primary-300" />
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-white truncate">{user.fullName}</p>
                              <p className="text-xs text-neutral-500 truncate">{user.email}</p>
                            </div>
                          </div>
                        </div>
                        <div className="py-2">
                          <Link
                            to="/profile"
                            onClick={() => setUserMenuOpen(false)}
                            className="flex items-center gap-3 px-5 py-3 text-sm text-neutral-300 hover:bg-white/[0.06] hover:text-white transition-all duration-200"
                          >
                            <User className="h-4 w-4" />
                            Profile
                          </Link>
                          <Link
                            to="/my-bookings"
                            onClick={() => setUserMenuOpen(false)}
                            className="flex items-center gap-3 px-5 py-3 text-sm text-neutral-300 hover:bg-white/[0.06] hover:text-white transition-all duration-200"
                          >
                            <Ticket className="h-4 w-4" />
                            My Bookings
                          </Link>
                        </div>
                        <div className="border-t border-white/[0.06] pt-2 px-2">
                          <button
                            onClick={() => { handleSignOut(); setUserMenuOpen(false); }}
                            className="flex items-center gap-3 w-full px-5 py-3 text-sm text-red-400 hover:bg-red-500/10 rounded-xl transition-all duration-200"
                          >
                            <LogOut className="h-4 w-4" />
                            Sign Out
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link to="/login" className="btn btn-secondary btn-sm">
                  Sign In
                </Link>
                <Link to="/register" className="btn btn-primary btn-sm ripple">
                  Get Started
                </Link>
              </div>
            )}

            {/* Mobile menu toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2.5 rounded-xl text-neutral-400 hover:text-white hover:bg-white/[0.06] transition-all duration-300 backdrop-blur-xl"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                {mobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="md:hidden overflow-hidden border-t border-white/[0.06] bg-dark-950/95 backdrop-blur-3xl"
          >
            <div className="px-4 py-4 space-y-1">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  to={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={clsx(
                    "block px-5 py-3.5 rounded-xl text-sm font-medium transition-all duration-200",
                    isActive(item.href)
                      ? 'text-white bg-white/[0.1]'
                      : 'text-neutral-400 hover:text-white hover:bg-white/[0.06]'
                  )}
                >
                  {item.label}
                </Link>
              ))}
              {!user && (
                <div className="pt-4 flex gap-3">
                  <Link to="/login" onClick={() => setMobileMenuOpen(false)} className="btn btn-secondary flex-1">
                    Sign In
                  </Link>
                  <Link to="/register" onClick={() => setMobileMenuOpen(false)} className="btn btn-primary flex-1 ripple">
                    Get Started
                  </Link>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
