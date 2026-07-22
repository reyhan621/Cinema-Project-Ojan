const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const path = require("path");

const helmet = require("helmet");

const authRoutes = require("./routes/authRoutes");
const movieRoutes = require("./routes/movieRoutes");
const showtimeRoutes = require("./routes/showtimeRoutes");
const bookingRoutes = require("./routes/bookingRoutes");
const adminRoutes = require("./routes/adminRoutes");
const recommendationRoutes = require("./routes/recommendationRoutes");
const cinemaRoutes = require("./routes/cinemaRoutes");
const hallRoutes = require("./routes/hallRoutes");
const { notFound, errorHandler } = require("./middlewares/errorHandler");

const app = express();

// Serve uploaded poster images BEFORE helmet so that
// Cross-Origin-Resource-Policy and Content-Security-Policy
// headers from helmet do not block cross-origin image loading.
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

app.use(helmet());
app.use(cors({ origin: process.env.CLIENT_URL, credentials: true }));
app.use(express.json());
app.use(cookieParser());

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Cinema Booking API is running",
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/movies", movieRoutes);
app.use("/api/showtimes", showtimeRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/recommendations", recommendationRoutes);
app.use("/api/cinemas", cinemaRoutes);
app.use("/api/halls", hallRoutes);

// Centralized handlers — must be mounted LAST, after all routes.
app.use(notFound);
app.use(errorHandler);

module.exports = app;
