const fs = require("fs");
const path = require("path");
const Movie = require("../models/Movie");
const Genre = require("../models/Genre");
const { ALLOWED_GENRES } = require("../models/Movie");
const asyncHandler = require("../utils/asyncHandler");
const AppError = require("../utils/AppError");

const POSTERS_DIR = path.join(__dirname, "../../uploads/posters");

const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// Helper: delete a poster file if it exists and is a local upload
const deletePosterFile = (posterPath) => {
  if (!posterPath) return;
  if (posterPath.startsWith("/uploads/")) {
    const fullPath = path.join(__dirname, "../..", posterPath);
    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath);
    }
  }
};

// Normalize genre input into a clean, unique array of allowed genres
const normalizeGenres = (value) => {
  let items = value;

  if (typeof items === "string") {
    try {
      items = JSON.parse(items);
    } catch {
      items = items.split(",").map((s) => s.trim());
    }
  }

  if (!Array.isArray(items)) {
    items = items ? [items] : [];
  }

  const allowedSet = new Set(ALLOWED_GENRES.map((g) => g.toLowerCase()));
  const unique = new Map();

  items.forEach((item) => {
    const name = String(item).trim();
    if (name && allowedSet.has(name.toLowerCase())) {
      const canonical = ALLOWED_GENRES.find(
        (g) => g.toLowerCase() === name.toLowerCase()
      );
      unique.set(canonical.toLowerCase(), canonical);
    }
  });

  return Array.from(unique.values());
};

// Normalize cast input into a clean, unique array of strings
const normalizeCast = (value) => {
  let items = value;

  if (typeof items === "string") {
    try {
      items = JSON.parse(items);
    } catch {
      items = items.split(",").map((s) => s.trim());
    }
  }

  if (!Array.isArray(items)) {
    return [];
  }

  const unique = new Map();

  items.forEach((item) => {
    const name = String(item).trim();
    if (name) {
      unique.set(name.toLowerCase(), name);
    }
  });

  return Array.from(unique.values());
};

// GET /api/genres  (all genres from Genre collection)
const getGenres = asyncHandler(async (req, res) => {
  const genres = await Genre.find().sort({ name: 1 });
  res.status(200).json({
    success: true,
    data: genres,
  });
});

// POST /api/genres  (create a new genre)
const createGenre = asyncHandler(async (req, res) => {
  const normalizedName = (req.body.name || "").trim();

  if (!normalizedName) {
    throw new AppError("Genre name is required", 400);
  }

  const existingGenre = await Genre.findOne({
    name: { $regex: `^${escapeRegex(normalizedName)}$`, $options: "i" },
  });

  if (existingGenre) {
    return res.status(409).json({
      success: false,
      message: "Genre already exists",
    });
  }

  const genre = await Genre.create({ name: normalizedName });
  res.status(201).json({
    success: true,
    data: genre,
  });
});

// GET /api/movies  (search, genre filter, pagination)
const getMovies = asyncHandler(async (req, res) => {
  const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 10, 1), 50);
  const skip = (page - 1) * limit;

  const filter = {};
  if (typeof req.query.search === "string" && req.query.search.trim()) {
    filter.title = { $regex: escapeRegex(req.query.search.trim()), $options: "i" };
  }
  if (typeof req.query.genre === "string" && req.query.genre.trim()) {
    filter.genre = {
      $regex: `^${escapeRegex(req.query.genre.trim())}$`,
      $options: "i",
    };
  }

  const [movies, totalItems] = await Promise.all([
    Movie.find(filter).skip(skip).limit(limit),
    Movie.countDocuments(filter),
  ]);

  res.status(200).json({
    success: true,
    data: movies,
    page,
    limit,
    totalItems,
    totalPages: Math.ceil(totalItems / limit),
  });
});

// GET /api/movies/:id
const getMovieDetail = asyncHandler(async (req, res) => {
  const movie = await Movie.findById(req.params.id);
  if (!movie) throw new AppError("Movie not found", 404);
  res.status(200).json({ success: true, data: movie });
});

// POST /api/movies
const createMovie = asyncHandler(async (req, res) => {
  if (req.file) {
    req.body.poster = `/uploads/posters/${req.file.filename}`;
  }

  if (!req.body.poster) {
    throw new AppError("Poster image is required", 400);
  }

  const normalizedGenres = normalizeGenres(req.body.genre);
  if (normalizedGenres.length === 0) {
    throw new AppError("At least one valid genre is required", 400);
  }

  const normalizedCast = normalizeCast(req.body.cast);
  const director = typeof req.body.director === "string"
    ? req.body.director.trim()
    : "";

  const movieData = {
    title: req.body.title,
    genre: normalizedGenres,
    duration: Number(req.body.duration),
    rating: req.body.rating,
    poster: req.body.poster,
    trailerUrl: req.body.trailerUrl || "",
    description: req.body.description,
    director,
    cast: normalizedCast,
  };

  const movie = await Movie.create(movieData);
  res.status(201).json({
    success: true,
    message: "Movie created successfully",
    data: movie,
  });
});

// PUT /api/movies/:id
const updateMovie = asyncHandler(async (req, res) => {
  const movie = await Movie.findById(req.params.id);
  if (!movie) throw new AppError("Movie not found", 404);

  if (req.file) {
    deletePosterFile(movie.poster);
    req.body.poster = `/uploads/posters/${req.file.filename}`;
  }

  const updateData = {};

  if (req.body.title !== undefined) updateData.title = req.body.title;
  if (req.body.description !== undefined) updateData.description = req.body.description;
  if (req.body.duration !== undefined) updateData.duration = Number(req.body.duration);
  if (req.body.rating !== undefined) updateData.rating = req.body.rating;
  if (req.body.trailerUrl !== undefined) updateData.trailerUrl = req.body.trailerUrl;
  if (req.body.poster !== undefined) updateData.poster = req.body.poster;

  if (req.body.genre !== undefined) {
    const normalizedGenres = normalizeGenres(req.body.genre);
    if (normalizedGenres.length === 0) {
      throw new AppError("At least one valid genre is required", 400);
    }
    updateData.genre = normalizedGenres;
  }

  if (req.body.director !== undefined) {
    updateData.director = typeof req.body.director === "string"
      ? req.body.director.trim()
      : "";
  }

  if (req.body.cast !== undefined) {
    updateData.cast = normalizeCast(req.body.cast);
  }

  const updated = await Movie.findByIdAndUpdate(req.params.id, updateData, {
    returnDocument: "after",
    runValidators: true,
  });

  res.status(200).json({
    success: true,
    message: "Movie updated successfully",
    data: updated,
  });
});

// DELETE /api/movies/:id
const deleteMovie = asyncHandler(async (req, res) => {
  const movie = await Movie.findByIdAndDelete(req.params.id);
  if (!movie) throw new AppError("Movie not found", 404);

  deletePosterFile(movie.poster);

  res.status(200).json({
    success: true,
    message: "Movie deleted successfully",
  });
});

module.exports = {
  getGenres,
  createGenre,
  getMovies,
  getMovieDetail,
  createMovie,
  updateMovie,
  deleteMovie,
};
