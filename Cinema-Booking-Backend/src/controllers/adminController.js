const Booking = require("../models/Booking");
const Movie = require("../models/Movie");
const Showtime = require("../models/Showtime");
const User = require("../models/User");
const Cinema = require("../models/Cinema");
const Hall = require("../models/Hall");
const asyncHandler = require("../utils/asyncHandler");

// GET /api/admin/stats — dashboard statistics
const getStats = asyncHandler(async (req, res) => {
  const [totalMovies, totalHalls, totalShowtimes, totalBookings, totalUsers, totalCinemas] =
    await Promise.all([
      Movie.countDocuments(),
      Hall.countDocuments(),
      Showtime.countDocuments(),
      Booking.countDocuments(),
      User.countDocuments(),
      Cinema.countDocuments(),
    ]);

  res.status(200).json({
    success: true,
    data: { totalMovies, totalHalls, totalShowtimes, totalBookings, totalUsers, totalCinemas },
  });
});

// GET /api/admin/bookings — all bookings for monitoring
const getAllBookings = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 10;
  const skip = (page - 1) * limit;

  const [bookings, totalItems] = await Promise.all([
    Booking.find()
      .populate("userId", "name email")
      .populate("movieId", "title poster")
      .populate({
        path: "showtimeId",
        populate: [
          { path: "cinema", select: "name city" },
          { path: "hall", select: "name rows columns totalSeats" },
        ],
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Booking.countDocuments(),
  ]);

  res.status(200).json({
    success: true,
    data: bookings,
    page,
    limit,
    totalItems,
    totalPages: Math.ceil(totalItems / limit),
  });
});

module.exports = { getStats, getAllBookings };
