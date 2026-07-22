import type { AuthUser } from '@/types';

export interface MockUser extends AuthUser {
  password: string;
}

export const mockUsers: MockUser[] = [
  {
    id: 'user-1',
    _id: 'user-1',
    fullName: 'Demo Cinema User',
    email: 'user@cinematix.test',
    password: 'user123',
    role: 'user',
    avatarUrl: 'https://i.pravatar.cc/120?img=12',
  },
  {
    id: 'user-2',
    _id: 'user-2',
    fullName: 'Rina Moviegoer',
    email: 'rina@cinematix.test',
    password: 'user123',
    role: 'user',
    avatarUrl: 'https://i.pravatar.cc/120?img=44',
  },
  {
    id: 'admin-1',
    _id: 'admin-1',
    fullName: 'Demo Admin',
    email: 'admin@cinematix.test',
    username: 'admin',
    password: 'admin123',
    role: 'admin',
    avatarUrl: 'https://i.pravatar.cc/120?img=5',
  },
];
