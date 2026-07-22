import type { IBooking } from '@/types';
import { mockShowtimes } from './mockShowtimes';
import { mockUsers } from './mockUsers';

const user = mockUsers[0];
const secondUser = mockUsers[1];
const showtime = (id: string) => mockShowtimes.find((item) => item._id === id)!;

export const initialMockBookings: IBooking[] = [
  {
    _id: 'booking-1001',
    user,
    showtime: showtime('showtime-1'),
    booking_date: '2026-07-06T10:15:00.000Z',
    total_seats: 3,
    total_amount: 165000,
    status: 'confirmed',
    selected_seats: ['A4', 'A5', 'B7'],
  },
  {
    _id: 'booking-1002',
    user,
    showtime: showtime('showtime-4'),
    booking_date: '2026-07-06T13:40:00.000Z',
    total_seats: 2,
    total_amount: 170000,
    status: 'cancelled',
    selected_seats: ['C5', 'C6'],
  },
  {
    _id: 'booking-1003',
    user: secondUser,
    showtime: showtime('showtime-2'),
    booking_date: '2026-07-07T08:20:00.000Z',
    total_seats: 2,
    total_amount: 130000,
    status: 'confirmed',
    selected_seats: ['A1', 'C5'],
  },
  {
    _id: 'booking-1004',
    user: secondUser,
    showtime: showtime('showtime-6'),
    booking_date: '2026-07-07T11:00:00.000Z',
    total_seats: 1,
    total_amount: 45000,
    status: 'pending',
    selected_seats: ['D8'],
  },
];
