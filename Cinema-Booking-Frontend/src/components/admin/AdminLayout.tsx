import { Outlet, Link, useLocation } from 'react-router-dom'
import { 
  LayoutDashboard, 
  Film, 
  Building, 
  Landmark,
  Calendar, 
  Users, 
  LogOut,
  Menu,
  X,
  BarChart3,
  Sun,
  Moon
} from 'lucide-react'
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '@/contexts/AuthContext'
import { AdminThemeProvider, useAdminTheme } from '@/contexts/AdminThemeContext'
import toast from 'react-hot-toast'

const navigation = [
  { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
  { name: 'Movies', href: '/admin/movies', icon: Film },
  { name: 'Cinemas', href: '/admin/cinemas', icon: Landmark },
  { name: 'Halls', href: '/admin/halls', icon: Building },
  { name: 'Showtimes', href: '/admin/showtimes', icon: Calendar },
  { name: 'Bookings', href: '/admin/bookings', icon: Users },
  { name: 'Reports', href: '/admin/reports', icon: BarChart3 },
  { name: 'Back to Cinema', href: '/', icon: Film },
]

const sidebarVariants = {
  hidden: { x: -280, opacity: 0 },
  visible: { x: 0, opacity: 1, transition: { type: 'spring', stiffness: 300, damping: 30 } },
  exit: { x: -280, opacity: 0, transition: { duration: 0.2 } },
} as const

const overlayVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.2 } },
  exit: { opacity: 0, transition: { duration: 0.2 } },
} as const

function AdminLayoutContent() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { signOut, user } = useAuth()
  const { theme, toggleTheme } = useAdminTheme()
  const location = useLocation()

  const handleSignOut = async () => {
    try {
      await signOut()
      toast.success('Signed out successfully')
    } catch (error) {
      toast.error('Error signing out')
    }
  }

  const NavLink = ({ item, onClick }: { item: typeof navigation[0]; onClick?: () => void }) => {
    const Icon = item.icon
    const isActive = location.pathname === item.href
    return (
      <Link
        to={item.href}
        onClick={onClick}
        className={`flex items-center px-4 py-3 text-sm font-medium transition-all duration-200 rounded-xl mx-2 ${
          isActive
            ? 'bg-primary-500/15 text-primary-400 shadow-[inset_0_0_0_1px_rgba(225,29,99,0.2)]'
            : 'text-neutral-400 hover:text-white hover:bg-dark-800/60'
        }`}
      >
        <Icon className="mr-3 h-5 w-5 flex-shrink-0" />
        {item.name}
      </Link>
    )
  }

  const SidebarContent = ({ onNavClick }: { onNavClick?: () => void }) => (
    <div className="flex flex-col h-full">
      <div className="flex items-center h-16 px-5 border-b border-dark-700/50">
        <h2 className="text-xl font-display font-bold bg-gradient-to-r from-primary-400 to-primary-500 bg-clip-text text-transparent">
          Admin Panel
        </h2>
      </div>
      <nav className="mt-6 flex-1 space-y-1">
        {navigation.map((item) => (
          <NavLink key={item.name} item={item} onClick={onNavClick} />
        ))}
      </nav>
      <div className="p-4 mx-2 mb-4 rounded-2xl bg-dark-800/40 border border-dark-700/30">
        <div className="flex items-center space-x-3 mb-3">
          <div className="w-9 h-9 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center shadow-lg">
            <span className="text-sm font-semibold text-white">
              {user?.fullName?.[0] || 'A'}
            </span>
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-white truncate">
              {user?.fullName || 'Admin'}
            </p>
            <p className="text-xs text-neutral-500">Administrator</p>
          </div>
        </div>
        <button
          onClick={handleSignOut}
          className="flex items-center w-full px-3 py-2 text-sm text-neutral-400 hover:text-white hover:bg-dark-700/60 rounded-xl transition-all duration-200"
        >
          <LogOut className="mr-2 h-4 w-4" />
          Sign Out
        </button>
      </div>
    </div>
  )

  return (
    <div className={`min-h-screen bg-dark-950 ${theme === 'light' ? 'theme-light' : ''}`}>
      {/* Mobile sidebar */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div
              variants={overlayVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm lg:hidden"
              onClick={() => setSidebarOpen(false)}
            />
            <motion.div
              variants={sidebarVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="fixed inset-y-0 left-0 w-64 z-50 bg-dark-900 border-r border-dark-700/50 lg:hidden"
            >
              <div className="flex items-center justify-between p-4">
                <h2 className="text-xl font-display font-bold bg-gradient-to-r from-primary-400 to-primary-500 bg-clip-text text-transparent">
                  Admin Panel
                </h2>
                <button
                  onClick={() => setSidebarOpen(false)}
                  className="text-neutral-400 hover:text-white p-1 rounded-xl hover:bg-dark-800/60 transition-all duration-200"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
              <nav className="mt-6">
                {navigation.map((item) => (
                  <NavLink key={item.name} item={item} onClick={() => setSidebarOpen(false)} />
                ))}
              </nav>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
        <div className="flex flex-col flex-grow bg-dark-900 border-r border-dark-700/50">
          <SidebarContent />
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Top bar */}
        <div className="sticky top-0 z-40 bg-dark-950/80 backdrop-blur-xl border-b border-dark-700/40">
          <div className="flex items-center justify-between h-16 px-4 sm:px-6 lg:px-8">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden text-neutral-400 hover:text-white p-1.5 rounded-xl hover:bg-dark-800/60 transition-all duration-200"
            >
              <Menu className="h-6 w-6" />
            </button>
            <div className="flex items-center space-x-4">
              <button
                onClick={toggleTheme}
                aria-label="Toggle theme"
                className="p-2 rounded-xl text-neutral-400 hover:text-white hover:bg-dark-800/60 transition-all duration-200"
              >
                <AnimatePresence mode="wait" initial={false}>
                  {theme === 'dark' ? (
                    <motion.span key="sun" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.2 }} className="block">
                      <Sun className="h-5 w-5" />
                    </motion.span>
                  ) : (
                    <motion.span key="moon" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }} transition={{ duration: 0.2 }} className="block">
                      <Moon className="h-5 w-5" />
                    </motion.span>
                  )}
                </AnimatePresence>
              </button>
              <span className="text-sm text-neutral-400">
                Welcome back, <span className="text-white font-medium">{user?.fullName || 'Admin'}</span>
              </span>
            </div>
          </div>
        </div>

        {/* Page content */}
        <motion.main
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          className="p-4 sm:p-6 lg:p-8"
        >
          <Outlet />
        </motion.main>
      </div>
    </div>
  )
}

export default function AdminLayout() {
  return (
    <AdminThemeProvider>
      <AdminLayoutContent />
    </AdminThemeProvider>
  )
}
