# Cinema Booking System — Backend

REST API for the Cinema Booking System challenge: JWT authentication (self-implemented),
role-based authorization, movie/showtime CRUD, and race-safe seat booking, built with
Node.js, Express 5, MongoDB, and Mongoose.

## Tech stack

- **Runtime:** Node.js, Express 5 (CommonJS)
- **Database:** MongoDB + Mongoose
- **Auth:** self-implemented JWT (short-lived access + rotating refresh, both in httpOnly cookies), `bcrypt` hashing, email verification and password reset via `nodemailer`
- **Validation:** `zod` (request-body schemas at the route boundary)
- **Security:** `helmet`, `express-rate-limit`, constant-time login
- **Testing:** `jest`, `supertest`, `mongodb-memory-server`

## Project structure

```
src/
  config/        database connection
  controllers/   request/response handling
  middlewares/   authenticate, requireAdmin, validate, rateLimiters, errorHandler
  models/        Mongoose schemas (User, Movie, Showtime, Booking)
  routes/        API route definitions
  services/      auth business logic
  utils/         asyncHandler, AppError, cookies, generateToken
  validators/    zod schemas
  seeds/         database seed
tests/           jest + supertest suites (in-memory MongoDB)
scripts/         security-scan.js (live black-box auth scan)
```

## Setup

```bash
npm install
cp .env.example .env   # then fill in the values
```

Required environment variables: `PORT`, `MONGO_URI`, `JWT_SECRET`, `NODE_ENV`, `CLIENT_URL`
(see `.env.example`). Never commit `.env`.

## Running

```bash
npm run seed   # populate: 1 admin, 2 users, 5 movies, showtimes
npm run dev    # start with nodemon
npm start      # start once
```

Seed credentials (challenge-only): `admin@kada.com / admin123`,
`user1@kada.com / user123`, `user2@kada.com / user123`.

## Testing

- `npm test` — full Jest suite against an in-memory MongoDB (no external DB needed).
  The first run downloads the in-memory `mongod` binary once.
- `npm run scan` — black-box auth security scan against a **running** server:
  ```bash
  npm run dev                # terminal 1
  BASE_URL=http://localhost:5000 npm run scan   # terminal 2
  ```

## Key API endpoints

| Method | Endpoint | Access | Purpose |
|--------|----------|--------|---------|
| POST | `/api/auth/register` | Public | Register a normal user (sends a verification code) |
| POST | `/api/auth/verify-email` | Public | Verify the email with the 6-digit code |
| POST | `/api/auth/resend-verification` | Public | Resend a verification code |
| POST | `/api/auth/login` | Public | Log in (requires verified email); issues access + refresh cookies |
| POST | `/api/auth/refresh` | Refresh cookie | Rotate the access + refresh tokens |
| POST | `/api/auth/forgot-password` | Public | Request a password-reset code |
| POST | `/api/auth/reset-password` | Public | Reset the password with the code |
| POST | `/api/auth/change-password` | Auth | Change password (current → new) |
| GET | `/api/auth/me` | Auth | Current user + role |
| POST | `/api/auth/logout` | Auth | Clear cookies and revoke the refresh token |
| GET | `/api/movies` | Public | List movies (`?search=&genre=&page=&limit=`) |
| GET | `/api/movies/:id` | Public | Movie detail |
| POST/PUT/DELETE | `/api/movies/:id?` | Admin | Movie CRUD |
| GET | `/api/showtimes/:id/seats` | Public | Current seat availability |
| POST/PUT/DELETE | `/api/showtimes/:id?` | Admin | Showtime CRUD |
| POST | `/api/bookings` | Auth | Create a booking (server re-checks seats) |
| GET | `/api/bookings/me` | Auth | The current user's bookings |
| DELETE | `/api/bookings/:id` | Owner/Admin | Cancel a booking, release seats |
| GET | `/api/admin/stats` | Admin | Dashboard counts |
| GET | `/api/admin/bookings` | Admin | All bookings (paginated) |

## Authentication flow

1. **Register** → account created (unverified); a 6-digit code is emailed. In
   non-production the code is returned as `devCode` for testing.
2. **Verify email** → account becomes verified and is issued access + refresh cookies.
3. **Login** (verified only) → issues a short-lived access token and a rotating refresh token.
4. **Refresh** → rotates both tokens; a reused (rotated-out) refresh token is detected and all
   sessions are revoked.
5. **Forgot / reset password** → emailed code (generic 200 either way, so no account enumeration);
   reset invalidates existing sessions.
6. **Change password** (logged in) → current + new password; re-issues fresh tokens.

Email transport: real SMTP via `SMTP_*` env vars, or an automatic **Ethereal** test inbox in
development (a preview URL is logged for each message).
