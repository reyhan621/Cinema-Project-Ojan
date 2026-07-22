const mongoose = require("mongoose");

const ALLOWED_GENRES = [
  "Action",
  "Adventure",
  "Animation",
  "Biography",
  "Comedy",
  "Crime",
  "Documentary",
  "Drama",
  "Family",
  "Fantasy",
  "History",
  "Horror",
  "Music",
  "Musical",
  "Mystery",
  "Romance",
  "Sci-Fi",
  "Sport",
  "Thriller",
  "War",
  "Western",
];

const movieSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
  },

  genre: {
    type: [String],
    required: true,
    validate: {
      validator: function (v) {
        return Array.isArray(v) && v.length > 0;
      },
      message: "At least one genre is required",
    },
  },

  duration: {
    type: Number,
    required: true,
    min: [1, "Duration must be greater than 0"],
  },

  rating: {
    type: String,
    required: true,
    trim: true,
  },

  poster: {
    type: String,
    required: true,
  },

  trailerUrl: {
    type: String,
    trim: true,
  },

  description: {
    type: String,
    required: true,
    trim: true,
  },

  director: {
    type: String,
    trim: true,
    default: "",
  },

  cast: {
    type: [String],
    default: [],
  },
}, { timestamps: true });

module.exports = mongoose.model("Movie", movieSchema);
module.exports.ALLOWED_GENRES = ALLOWED_GENRES;
