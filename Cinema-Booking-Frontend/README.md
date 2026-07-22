# Cinema Booking System Frontend Template

This repository provides a React frontend template for the Cinema Booking System backend challenge.

The app is already converted into a modern React + TypeScript frontend and currently runs with local mock data. Students can use it as the client application while building their own backend according to the official challenge requirements provided by the instructor.

## Purpose

Use this template to focus on connecting a real backend to an existing cinema booking UI.

The frontend includes screens for:

- Home and movie browsing
- Movie details and showtime selection
- Seat selection
- Payment simulation
- Booking confirmation
- User login and registration
- User bookings and profile
- Admin dashboard, movies, halls, showtimes, bookings, and reports

The current data is not persistent. It exists only so the UI can be explored before backend integration.

## Tech Stack

- React 18
- TypeScript
- Vite
- React Router
- React Hook Form
- Tailwind CSS
- Lucide React
- Recharts
- React Hot Toast

## Getting Started

Install dependencies:

```bash
npm install
```

Run the frontend:

```bash
npm run dev
```

Build check:

```bash
npm run build
```

Optional TypeScript check:

```bash
npx tsc --noEmit
```

## Demo Login

The template includes temporary frontend-only demo accounts.

User:

- Email: `user@cinematix.test`
- Password: `user123`

Admin:

- Email: `admin@cinematix.test`
- Username: `admin`
- Password: `admin123`

These accounts are only for exploring the frontend. They are not a backend authentication solution.

## Project Structure

Important frontend folders:

```text
src/
|- components/
|- contexts/
|- data/
|- pages/
|- services/
|- types.ts
```

Mock data lives in:

```text
src/data/
```

Frontend service functions live in:

```text
src/services/
```

The pages call service functions instead of calling mock data directly. This is intentional: students should be able to replace the service implementation with real API requests without rewriting every page.

## Backend Challenge Integration

Students should follow the official backend challenge PDF for the required backend behavior, architecture, security rules, API behavior, testing expectations, and submission requirements.

This README does not repeat the full backend specification on purpose. The PDF is the source of truth.

At a high level, students are expected to replace the frontend mock services with calls to their own backend:

```text
React page
  -> src/services/*
  -> student backend API
  -> database
```

Recommended integration approach:

1. Keep the React pages and components mostly unchanged.
2. Replace mock logic inside `src/services/*` with HTTP requests.
3. Keep response shapes consistent with what the UI needs, or update the UI carefully when your backend returns different field names.
4. Use the official challenge document to decide what must be validated and protected by the backend.

## Important Notes For Students

The frontend route guards and mock authentication are for UI demonstration only.

The backend must be responsible for real authentication, authorization, data validation, booking ownership, seat availability, and persistent data.

Do not treat frontend checks as security. Anything important must be verified by the backend.

## Useful Routes

Public:

- `/`
- `/movies`
- `/movies/:movieId`
- `/login`
- `/register`

User flow:

- `/book/:movieId`
- `/booking/:showtimeId`
- `/payment`
- `/booking-confirmation`
- `/my-bookings`
- `/profile`

Admin flow:

- `/admin`
- `/admin/movies`
- `/admin/halls`
- `/admin/showtimes`
- `/admin/bookings`
- `/admin/reports`

## Submission Reminder

For the final challenge submission, students should submit the complete application required by the instructor, not only this frontend template.

Include setup instructions for both frontend and backend in the final project README when the backend is added.
