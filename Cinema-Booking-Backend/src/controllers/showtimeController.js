const Showtime = require("../models/Showtime");
const Movie = require("../models/Movie");
const Hall = require("../models/Hall");
const Cinema = require("../models/Cinema");
const asyncHandler = require("../utils/asyncHandler");
const AppError = require("../utils/AppError");

const TIME_RE = /^([01]\d|2[0-3]):([0-5]\d)$/;

const toTimeHHMM = (date) => {
  const hh = String(date.getHours()).padStart(2, "0");
  const mm = String(date.getMinutes()).padStart(2, "0");
  return `${hh}:${mm}`;
};

const parseBooleanQuery = (raw, fieldName) => {
  if (raw === undefined) return undefined;
  if (raw === "true") return true;
  if (raw === "false") return false;
  throw new AppError(`${fieldName} must be "true" or "false".`, 400);
};

// GET /api/showtimes?movieId=&cinemaId=&date=&upcoming=   (Public)
const getShowtimes = asyncHandler(async (req, res) => {
  const filter = {};
  const upcoming = parseBooleanQuery(req.query.upcoming, "upcoming");

  if (req.query.movieId) {
    filter.movieId = req.query.movieId;
  }

  if (req.query.cinemaId) {
    const cinema = await Cinema.findById(req.query.cinemaId);
    if (!cinema) {
      return res.status(200).json({ success: true, data: [] });
    }
    filter.cinema = req.query.cinemaId;
  }

  if (req.query.date) {
    const start = new Date(req.query.date);
    if (Number.isNaN(start.getTime())) {
      throw new AppError("Invalid date query parameter. Use ISO format (YYYY-MM-DD).", 400);
    }
    const end = new Date(start);
    end.setDate(end.getDate() + 1);
    filter.date = { $gte: start, $lt: end };
  }

  const showtimes = await Showtime.find(filter)
    .populate("movieId")
    .populate({ path: "cinema", select: "name city" })
    .populate({ path: "hall", select: "name rows columns totalSeats" })
    .sort({ date: 1, time: 1 });

  if (upcoming === true) {
    const now = new Date();
    const currentTime = toTimeHHMM(now);
    const startOfToday = new Date(now);
    startOfToday.setHours(0, 0, 0, 0);

    const upcomingShowtimes = showtimes.filter((s) => {
      if (!(s.date instanceof Date) || Number.isNaN(s.date.getTime())) return false;
      if (s.date > startOfToday) return true;
      if (s.date < startOfToday) return false;
      if (!TIME_RE.test(s.time || "")) return false;
      return s.time > currentTime;
    });

    return res.status(200).json({ success: true, data: upcomingShowtimes });
  }

  res.status(200).json({ success: true, data: showtimes });
});

// GET /api/showtimes/:id   (Public)
const getShowtimeDetail = asyncHandler(async (req, res) => {
  const showtime = await Showtime.findById(req.params.id)
    .populate("movieId")
    .populate({ path: "cinema", select: "name city" })
    .populate({ path: "hall", select: "name rows columns totalSeats" });
  if (!showtime) throw new AppError("Showtime not found", 404);
  res.status(200).json({ success: true, data: showtime });
});

// GET /api/showtimes/:id/seats   (Public)
const getSeats = asyncHandler(async (req, res) => {
  const showtime = await Showtime.findById(req.params.id)
    .populate({ path: "hall", select: "rows columns totalSeats" });
  if (!showtime) throw new AppError("Showtime not found", 404);

  const hall = showtime.hall;
  const layout = hall
    ? { rows: hall.rows, columns: hall.columns, totalSeats: hall.totalSeats }
    : { rows: 8, columns: 10, totalSeats: 80 };

  res.status(200).json({
    success: true,
    data: {
      bookedSeats: showtime.bookedSeats,
      layout,
    },
  });
});

// Helper: parse "HH:mm" to minutes since midnight
const timeToMinutes = (t) => {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
};

// Helper: check overlap between two time ranges
const hasOverlap = (newStart, newEnd, existStart, existEnd) => {
  return newStart < existEnd && newEnd > existStart;
};

// POST /api/showtimes   (Admin)
const createShowtime = asyncHandler(async (req, res) => {
  const { movieId, cinema: cinemaId, hall: hallId, date, time, endTime, price } = req.body;

  const movie = await Movie.findById(movieId);
  if (!movie) throw new AppError("Movie not found", 400);

  const cinema = await Cinema.findById(cinemaId);
  if (!cinema) throw new AppError("Cinema not found", 400);

  const hall = await Hall.findById(hallId);
  if (!hall) throw new AppError("Hall not found", 400);

  if (hall.cinema.toString() !== cinemaId) {
    throw new AppError("Hall does not belong to the selected cinema", 400);
  }

  if (!price || price <= 0) throw new AppError("Price must be greater than 0", 400);
  if (!date) throw new AppError("Show date is required", 400);
  if (!time) throw new AppError("Start time is required", 400);
  if (!endTime) throw new AppError("End time is required", 400);

  const startMinutes = timeToMinutes(time);
  const endMinutes = timeToMinutes(endTime);
  if (endMinutes <= startMinutes) {
    throw new AppError("End time must be after start time", 400);
  }

  const showDate = new Date(date);
  showDate.setHours(0, 0, 0, 0);
  const nextDay = new Date(showDate);
  nextDay.setDate(nextDay.getDate() + 1);

  const existingShowtimes = await Showtime.find({
    hall: hallId,
    date: { $gte: showDate, $lt: nextDay },
  });

  for (const existing of existingShowtimes) {
    const existStart = timeToMinutes(existing.time);
    const existEnd = timeToMinutes(existing.endTime);
    if (hasOverlap(startMinutes, endMinutes, existStart, existEnd)) {
      throw new AppError(
        `Schedule conflict with existing showtime (${existing.time} - ${existing.endTime})`,
        400
      );
    }
  }

  const showtime = await Showtime.create({
    movieId,
    cinema: cinemaId,
    hall: hallId,
    studio: hall.name,
    date: showDate,
    time,
    endTime,
    price,
    bookedSeats: [],
  });

  // Mongoose 9: Document.populate() returns a Promise (not a chainable doc), so
  // pass all paths in one call — chaining .populate().populate() throws here.
  const populated = await showtime.populate([
    "movieId",
    { path: "cinema", select: "name city" },
    { path: "hall", select: "name rows columns totalSeats" },
  ]);

  res.status(201).json({ success: true, data: populated });
});

// PUT /api/showtimes/:id   (Admin)
const updateShowtime = asyncHandler(async (req, res) => {
  const showtime = await Showtime.findById(req.params.id);
  if (!showtime) throw new AppError("Showtime not found", 404);

  const movieId = req.body.movieId || showtime.movieId;
  const cinemaId = req.body.cinema || showtime.cinema;
  const hallId = req.body.hall || showtime.hall;
  const date = req.body.date || showtime.date;
  const time = req.body.time || showtime.time;
  const endTime = req.body.endTime || showtime.endTime;
  const price = req.body.price !== undefined ? req.body.price : showtime.price;

  const movie = await Movie.findById(movieId);
  if (!movie) throw new AppError("Movie not found", 400);

  const cinema = await Cinema.findById(cinemaId);
  if (!cinema) throw new AppError("Cinema not found", 400);

  const hall = await Hall.findById(hallId);
  if (!hall) throw new AppError("Hall not found", 400);

  if (hall.cinema.toString() !== cinemaId.toString()) {
    throw new AppError("Hall does not belong to the selected cinema", 400);
  }

  if (price <= 0) throw new AppError("Price must be greater than 0", 400);

  const startMinutes = timeToMinutes(time);
  const endMinutes = timeToMinutes(endTime);
  if (endMinutes <= startMinutes) {
    throw new AppError("End time must be after start time", 400);
  }

  const showDate = new Date(date);
  showDate.setHours(0, 0, 0, 0);
  const nextDay = new Date(showDate);
  nextDay.setDate(nextDay.getDate() + 1);

  const existingShowtimes = await Showtime.find({
    _id: { $ne: req.params.id },
    hall: hallId,
    date: { $gte: showDate, $lt: nextDay },
  });

  for (const existing of existingShowtimes) {
    const existStart = timeToMinutes(existing.time);
    const existEnd = timeToMinutes(existing.endTime);
    if (hasOverlap(startMinutes, endMinutes, existStart, existEnd)) {
      throw new AppError(
        `Schedule conflict with existing showtime (${existing.time} - ${existing.endTime})`,
        400
      );
    }
  }

  const updated = await Showtime.findByIdAndUpdate(
    req.params.id,
    {
      movieId,
      cinema: cinemaId,
      hall: hallId,
      studio: hall.name,
      date: showDate,
      time,
      endTime,
      price,
    },
    { returnDocument: "after", runValidators: true }
  )
    .populate("movieId")
    .populate({ path: "cinema", select: "name city" })
    .populate({ path: "hall", select: "name rows columns totalSeats" });

  res.status(200).json({ success: true, data: updated });
});

// DELETE /api/showtimes/:id   (Admin)
const deleteShowtime = asyncHandler(async (req, res) => {
  const showtime = await Showtime.findByIdAndDelete(req.params.id);
  if (!showtime) throw new AppError("Showtime not found", 404);
  res.status(200).json({ success: true, message: "Showtime deleted successfully" });
});

// GET /api/showtimes/now-playing?cinemaId=   (Public)
const getNowPlaying = asyncHandler(async (req, res) => {
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const oneMonthLater = new Date(startOfToday);
  oneMonthLater.setMonth(oneMonthLater.getMonth() + 1);

  const query = {
    date: { $gte: startOfToday, $lte: oneMonthLater },
  };

  if (req.query.cinemaId) {
    const cinema = await Cinema.findById(req.query.cinemaId);
    if (!cinema) {
      return res.status(200).json({ success: true, data: [] });
    }
    query.cinema = req.query.cinemaId;
  }

  const showtimes = await Showtime.find(query).populate("movieId");

  const movieMap = new Map();
  for (const st of showtimes) {
    if (st.movieId && !movieMap.has(st.movieId._id.toString())) {
      movieMap.set(st.movieId._id.toString(), st.movieId);
    }
  }

  res.status(200).json({ success: true, data: Array.from(movieMap.values()) });
});

// GET /api/showtimes/coming-soon?cinemaId=   (Public)
const getComingSoon = asyncHandler(async (req, res) => {
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const oneMonthLater = new Date(startOfToday);
  oneMonthLater.setMonth(oneMonthLater.getMonth() + 1);

  const threeMonthsLater = new Date(startOfToday);
  threeMonthsLater.setMonth(threeMonthsLater.getMonth() + 3);

  const nowPlayingQuery = {
    date: { $gte: startOfToday, $lte: oneMonthLater },
  };
  const comingSoonQuery = {
    date: { $gt: oneMonthLater, $lte: threeMonthsLater },
  };

  if (req.query.cinemaId) {
    const cinema = await Cinema.findById(req.query.cinemaId);
    if (!cinema) {
      return res.status(200).json({ success: true, data: [] });
    }
    nowPlayingQuery.cinema = req.query.cinemaId;
    comingSoonQuery.cinema = req.query.cinemaId;
  }

  const nowPlayingShowtimes = await Showtime.find(nowPlayingQuery).populate("movieId");

  const nowPlayingMovieIds = new Set();
  for (const st of nowPlayingShowtimes) {
    if (st.movieId) nowPlayingMovieIds.add(st.movieId._id.toString());
  }

  const comingSoonShowtimes = await Showtime.find(comingSoonQuery).populate("movieId");

  const movieMap = new Map();
  for (const st of comingSoonShowtimes) {
    if (st.movieId && !nowPlayingMovieIds.has(st.movieId._id.toString())) {
      if (!movieMap.has(st.movieId._id.toString())) {
        movieMap.set(st.movieId._id.toString(), st.movieId);
      }
    }
  }

  res.status(200).json({ success: true, data: Array.from(movieMap.values()) });
});

module.exports = {
  getShowtimes,
  getShowtimeDetail,
  getSeats,
  createShowtime,
  updateShowtime,
  deleteShowtime,
  getNowPlaying,
  getComingSoon,
};
