const mongoose = require("mongoose");

const showtimeSchema = new mongoose.Schema(
  {
    movieId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Movie",
      required: true,
    },

    cinema: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Cinema",
      required: [true, "Cinema is required"],
    },

    hall: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Hall",
      required: [true, "Hall is required"],
    },

    date: {
      type: Date,
      required: true,
    },

    time: {
      type: String,
      required: true,
    },

    endTime: {
      type: String,
      required: [true, "End time is required"],
    },

    studio: {
      type: String,
      required: true,
    },

    price: {
      type: Number,
      required: true,
      min: [1, "Price must be greater than 0"],
    },

    bookedSeats: {
      type: [String],
      default: [],
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Showtime", showtimeSchema);
