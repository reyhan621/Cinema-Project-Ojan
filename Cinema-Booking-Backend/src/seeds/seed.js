const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const User = require("../models/User");
const Movie = require("../models/Movie");
const Cinema = require("../models/Cinema");
const Hall = require("../models/Hall");
const Showtime = require("../models/Showtime");
const Booking = require("../models/Booking");

// Populate the database with challenge-only data (§11.7):
// 1 admin, 2 users, 5 movies, cinemas, halls, and showtimes across multiple movies.
// Idempotent: clears the relevant collections first so it can be re-run.
const seedData = async () => {
  await Promise.all([
    User.deleteMany({}),
    Movie.deleteMany({}),
    Cinema.deleteMany({}),
    Hall.deleteMany({}),
    Showtime.deleteMany({}),
    Booking.deleteMany({}),
  ]);

  const [adminPass, userPass] = await Promise.all([
    bcrypt.hash("admin123", 10),
    bcrypt.hash("user123", 10),
  ]);

  await User.create([
    {
      name: "Admin",
      email: "admin@kada.com",
      password: adminPass,
      role: "admin",
      isVerified: true,
    },
    {
      name: "User One",
      email: "user1@kada.com",
      password: userPass,
      role: "user",
      isVerified: true,
    },
    {
      name: "User Two",
      email: "user2@kada.com",
      password: userPass,
      role: "user",
      isVerified: true,
    },
  ]);

  // trailerUrl is optional. "Inside Out 2" is intentionally left without one to show
  // the no-trailer case still works.
  const movies = await Movie.create([
    {
      title: "Avengers: Endgame",
      genre: ["Action", "Adventure", "Sci-Fi"],
      duration: 181,
      rating: "PG-13",
      poster: "avengers.jpg",
      trailerUrl: "https://www.youtube.com/watch?v=TcMBFSGVi1c",
      description: "The Avengers assemble once more to reverse Thanos' snap.",
      director: "Anthony Russo, Joe Russo",
      cast: ["Robert Downey Jr.", "Chris Evans", "Mark Ruffalo"],
    },
    {
      title: "Dune: Part Two",
      genre: ["Sci-Fi", "Adventure", "Drama"],
      duration: 166,
      rating: "PG-13",
      poster: "dune.jpg",
      trailerUrl: "https://www.youtube.com/watch?v=Way9Dexny3w",
      description: "Paul Atreides unites with the Fremen to wage war.",
      director: "Denis Villeneuve",
      cast: ["Timothée Chalamet", "Zendaya", "Austin Butler"],
    },
    {
      title: "Inside Out 2",
      genre: ["Animation", "Comedy", "Family"],
      duration: 96,
      rating: "PG",
      poster: "insideout2.jpg",
      description: "New emotions move into Riley's mind.",
      director: "Kelsey Mann",
      cast: ["Amy Poehler", "Maya Hawke", "Ayo Edebiri"],
    },
    {
      title: "Oppenheimer",
      genre: ["Drama", "Biography", "History"],
      duration: 180,
      rating: "R",
      poster: "oppenheimer.jpg",
      trailerUrl: "https://www.youtube.com/watch?v=uYPbbksJxIg",
      description: "The story of the father of the atomic bomb.",
      director: "Christopher Nolan",
      cast: ["Cillian Murphy", "Robert Downey Jr.", "Emily Blunt"],
    },
    {
      title: "The Batman",
      genre: ["Action", "Crime", "Drama"],
      duration: 176,
      rating: "PG-13",
      poster: "batman.jpg",
      trailerUrl: "https://www.youtube.com/watch?v=mqqft2x_Aa4",
      description: "Batman uncovers corruption while pursuing the Riddler.",
      director: "Matt Reeves",
      cast: ["Robert Pattinson", "Zoë Kravitz", "Paul Dano"],
    },
  ]);

  // Cinemas + halls (seat layout lives on the hall).
  const cinemas = await Cinema.create([
    { name: "CineLux Grand Indonesia", city: "Jakarta" },
    { name: "CineLux Bandung", city: "Bandung" },
  ]);

  const halls = await Hall.create([
    {
      cinema: cinemas[0]._id,
      name: "Studio 1",
      rows: 8,
      columns: 10,
      totalSeats: 80,
    },
    {
      cinema: cinemas[0]._id,
      name: "Studio 2",
      rows: 6,
      columns: 8,
      totalSeats: 48,
    },
    {
      cinema: cinemas[1]._id,
      name: "Studio 1",
      rows: 8,
      columns: 10,
      totalSeats: 80,
    },
  ]);

  // Booking rejects past showtimes, so a single "tomorrow" seed goes stale after a day.
  // Schedule now-playing showtimes across the next few days so demo data stays bookable.
  const dayPlus = (n) => {
    const d = new Date();
    d.setDate(d.getDate() + n);
    return d;
  };

  // Coming-soon showtimes: ~2 months out. The coming-soon endpoint surfaces movies
  // whose showtimes fall 1–3 months ahead and aren't already playing, so the two
  // movies below (which have no near-term showtimes) appear only under "Coming Soon".
  const comingSoonDay = dayPlus(60);

  const st = (movieIdx, cinemaIdx, hallIdx, time, endTime, price, date) => ({
    movieId: movies[movieIdx]._id,
    cinema: cinemas[cinemaIdx]._id,
    hall: halls[hallIdx]._id,
    studio: halls[hallIdx].name, // required string, mirrors the hall name
    date,
    time,
    endTime,
    price,
  });

  const showtimeDocs = [];
  // Now playing: the next 3 days (different dates → no schedule conflicts).
  for (let n = 1; n <= 3; n++) {
    const d = dayPlus(n);
    showtimeDocs.push(st(0, 0, 0, "13:00", "16:00", 50000, d)); // Avengers @ Grand Indonesia / Studio 1
    showtimeDocs.push(st(1, 0, 1, "14:00", "16:45", 60000, d)); // Dune @ Grand Indonesia / Studio 2
    showtimeDocs.push(st(4, 1, 2, "20:00", "23:00", 70000, d)); // The Batman @ Bandung / Studio 1
  }
  // Coming soon (~2 months out) — these two movies appear only in "Coming Soon".
  showtimeDocs.push(st(2, 0, 0, "13:00", "14:36", 55000, comingSoonDay)); // Inside Out 2 @ Grand Indonesia
  showtimeDocs.push(st(3, 1, 2, "18:00", "21:00", 75000, comingSoonDay)); // Oppenheimer @ Bandung

  await Showtime.create(showtimeDocs);

  return {
    users: 3,
    movies: movies.length,
    cinemas: cinemas.length,
    halls: halls.length,
    showtimes: showtimeDocs.length,
  };
};

module.exports = { seedData };

// Allow running directly: `npm run seed`.
if (require.main === module) {
  require("dotenv").config();
  mongoose
    .connect(process.env.MONGO_URI)
    .then(async () => {
      const result = await seedData();
      console.log("Seed complete:", result);
      await mongoose.disconnect();
    })
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
