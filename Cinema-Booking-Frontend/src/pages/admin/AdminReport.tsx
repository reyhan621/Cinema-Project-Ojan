import { useEffect, useState } from 'react';
import { Film, Building, RefreshCcw, BarChart3, Wallet, PieChart as PieChartIcon } from 'lucide-react';
import { motion } from 'framer-motion';
import { Skeleton } from '@/components/LoadingSpinner';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { adminService } from '@/services/adminService';
import { showtimeService } from '@/services/showtimeService';
import type { IBooking, IHall, IMovie } from '@/types';

export default function AdminReportsPage() {
  const [nowPlaying, setNowPlaying] = useState<IMovie[]>([]);
  const [halls, setHalls] = useState<IHall[]>([]);
  const [bookings, setBookings] = useState<IBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [, setError] = useState('');
  const [activeStatusIndex, setActiveStatusIndex] = useState<number | null>(null);

  useEffect(() => {
    fetchReportData();
  }, []);

  const fetchReportData = async () => {
    setLoading(true);
    try {
      setError('');
      const [hallsData, bookingsData, nowPlayingData] = await Promise.all([
        showtimeService.getHalls(),
        adminService.getAllBookings(),
        showtimeService.getNowPlaying(),
      ]);
      setHalls(hallsData);
      setBookings(bookingsData);
      setNowPlaying(nowPlayingData);
    } catch (error) {
      console.error(error);
      setError('Unable to load report data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const today = new Date().toISOString().split('T')[0];
  const todayRevenue = bookings
    .filter(b => b.status === 'confirmed' && (b.booking_date || '').startsWith(today))
    .reduce((sum, b) => sum + b.total_amount, 0);

  // "Now Showing" = movies with a showtime in the next month (backend-derived).
  const nowShowingCount = nowPlaying.length;
  // There is no inactive-hall concept, so every hall counts as active.
  const activeHallsCount = halls.length;

  // Revenue per day for the last 7 days, computed from confirmed bookings.
  const weeklyRevenue = Array.from({ length: 7 }, (_, idx) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - idx));
    const key = d.toISOString().slice(0, 10);
    const revenue = bookings
      .filter(b => b.status === 'confirmed' && (b.booking_date || '').slice(0, 10) === key)
      .reduce((sum, b) => sum + b.total_amount, 0);
    return { date: d.toLocaleDateString('en-US', { weekday: 'short' }), revenue };
  });

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <Skeleton className="h-8 w-40 mb-2 rounded-lg" />
          <Skeleton className="h-4 w-56 rounded-lg" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="card p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <Skeleton className="h-3 w-24 rounded" />
                  <Skeleton className="h-6 w-20 rounded" />
                </div>
                <Skeleton className="h-12 w-12 rounded-xl" />
              </div>
            </div>
          ))}
        </div>
        <div className="card p-6">
          <Skeleton className="h-5 w-40 mb-4 rounded" />
          <Skeleton className="h-[300px] w-full rounded-xl" />
        </div>
      </div>
    );
  }

  const weeklyTotal = weeklyRevenue.reduce((sum, day) => sum + day.revenue, 0);

  const statusColors: Record<string, string> = {
    Confirmed: '#BE185E',
    Pending: '#D74687',
    Cancelled: '#E963A5',
  };
  const statusBreakdown = [
    { name: 'Confirmed', value: bookings.filter((b) => b.status === 'confirmed').length },
    { name: 'Pending', value: bookings.filter((b) => b.status === 'pending').length },
    { name: 'Cancelled', value: bookings.filter((b) => b.status === 'cancelled').length },
  ].filter((s) => s.value > 0);
  const totalBookingsCount = bookings.length;

  const statCards = [
    {
      title: "Today's Revenue",
      value: `IDR ${todayRevenue.toLocaleString()}`,
      icon: Wallet,
      color: 'text-primary-400',
      bgColor: 'bg-primary-500/15',
      accent: 'before:bg-primary-500'
    },
    {
      title: 'Now Showing Movies',
      value: nowShowingCount,
      icon: Film,
      color: 'text-blue-400',
      bgColor: 'bg-blue-500/15',
      accent: 'before:bg-blue-500'
    },
    {
      title: 'Active Halls',
      value: activeHallsCount,
      icon: Building,
      color: 'text-green-400',
      bgColor: 'bg-green-500/15',
      accent: 'before:bg-green-500'
    }
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.08, delayChildren: 0.1 } },
  } as const;

  const itemVariants = {
    hidden: { opacity: 0, y: 16 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' } },
  } as const;

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      <motion.div variants={itemVariants} className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-display font-bold text-white">Reports</h1>
          <p className="text-neutral-400">Daily performance overview</p>
        </div>
        <motion.button
          onClick={fetchReportData}
          className="btn btn-secondary flex items-center space-x-2"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <RefreshCcw className="h-4 w-4" />
          <span>Refresh</span>
        </motion.button>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={index}
              variants={itemVariants}
              whileHover={{ y: -3, transition: { duration: 0.2 } }}
              className={`card p-6 relative overflow-hidden before:absolute before:top-0 before:left-0 before:right-0 before:h-[3px] before:rounded-t-2xl ${stat.accent}`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-neutral-500 mb-1">{stat.title}</p>
                  <p className="text-2xl font-bold text-white">
                    {typeof stat.value === 'number' ? stat.value.toLocaleString() : stat.value}
                  </p>
                </div>
                <div className={`w-12 h-12 rounded-xl ${stat.bgColor} flex items-center justify-center`}>
                  <Icon className={`h-6 w-6 ${stat.color}`} />
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5 mt-6">
        <motion.div variants={itemVariants} className="card p-6 lg:col-span-3">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
            <div>
              <h2 className="flex items-center gap-2 text-xl font-display font-bold text-white">
                <BarChart3 className="h-5 w-5 text-primary-400" />
                Weekly Revenue
              </h2>
              <p className="text-sm text-neutral-500 mt-1">Confirmed booking revenue for the past 7 days</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-neutral-500 uppercase tracking-wider mb-0.5">Week Total</p>
              <p className="text-lg font-bold text-primary-400">IDR {weeklyTotal.toLocaleString()}</p>
            </div>
          </div>
          {weeklyRevenue.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-[300px] text-center">
              <BarChart3 className="h-12 w-12 text-neutral-700 mb-3" />
              <p className="text-neutral-400">No revenue data yet for this period</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={weeklyRevenue} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#f472b6" />
                    <stop offset="100%" stopColor="#be185d" />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#262626" vertical={false} />
                <XAxis dataKey="date" stroke="#737373" tick={{ fill: '#a3a3a3' }} axisLine={{ stroke: '#404040' }} tickLine={false} />
                <YAxis stroke="#737373" tick={{ fill: '#a3a3a3' }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1f1f1f',
                    borderColor: '#404040',
                    borderRadius: '12px',
                    color: '#fafafa',
                  }}
                  labelStyle={{ color: '#fafafa', fontWeight: 600, marginBottom: 4 }}
                  itemStyle={{ color: '#f472b6' }}
                  cursor={{ fill: 'rgba(255,255,255,0.03)' }}
                  formatter={(value: number) => [`IDR ${value.toLocaleString()}`, 'Revenue']}
                />
                <Bar dataKey="revenue" fill="url(#revenueGradient)" radius={[6, 6, 0, 0]} maxBarSize={56} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </motion.div>

        <motion.div variants={itemVariants} className="card p-6 lg:col-span-2">
          <div className="mb-6">
            <h2 className="flex items-center gap-2 text-xl font-display font-bold text-white">
              <PieChartIcon className="h-5 w-5 text-primary-400" />
              Booking Status
            </h2>
            <p className="text-sm text-neutral-500 mt-1">Share of bookings by status</p>
          </div>

          {totalBookingsCount === 0 ? (
            <div className="flex flex-col items-center justify-center h-[300px] text-center">
              <PieChartIcon className="h-12 w-12 text-neutral-700 mb-3" />
              <p className="text-neutral-400">No bookings yet</p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-6">
              <div className="relative w-full h-52">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={statusBreakdown}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={62}
                      outerRadius={88}
                      paddingAngle={3}
                      stroke="none"
                      onMouseEnter={(_, index) => setActiveStatusIndex(index)}
                      onMouseLeave={() => setActiveStatusIndex(null)}
                    >
                      {statusBreakdown.map((entry, index) => (
                        <Cell
                          key={entry.name}
                          fill={statusColors[entry.name]}
                          opacity={activeStatusIndex === null || activeStatusIndex === index ? 1 : 0.3}
                          style={{ transition: 'opacity 0.2s ease' }}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#1f1f1f',
                        borderColor: '#404040',
                        borderRadius: '12px',
                        color: '#fafafa',
                      }}
                      itemStyle={{ color: '#fafafa' }}
                      formatter={(value: number, name: string) => [
                        `${value} (${((value / totalBookingsCount) * 100).toFixed(1)}%)`,
                        name,
                      ]}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-2xl font-bold text-white">
                    {activeStatusIndex !== null
                      ? `${((statusBreakdown[activeStatusIndex].value / totalBookingsCount) * 100).toFixed(0)}%`
                      : totalBookingsCount}
                  </span>
                  <span className="text-xs text-neutral-500">
                    {activeStatusIndex !== null ? statusBreakdown[activeStatusIndex].name : 'Total Bookings'}
                  </span>
                </div>
              </div>

              <div className="w-full space-y-2">
                {statusBreakdown.map((entry, index) => (
                  <div
                    key={entry.name}
                    onMouseEnter={() => setActiveStatusIndex(index)}
                    onMouseLeave={() => setActiveStatusIndex(null)}
                    className="flex items-center justify-between px-3 py-2 rounded-xl transition-colors duration-200 cursor-default hover:bg-white/[0.04]"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: statusColors[entry.name] }} />
                      <span className="text-sm text-neutral-300">{entry.name}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-semibold text-white">
                        {((entry.value / totalBookingsCount) * 100).toFixed(1)}%
                      </span>
                      <span className="text-xs text-neutral-500 ml-1.5">({entry.value})</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </motion.div>
  );
}
