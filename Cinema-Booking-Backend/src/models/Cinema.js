const mongoose = require("mongoose");

const cinemaSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Cinema name is required"],
      trim: true,
    },
    city: {
      type: String,
      required: [true, "City is required"],
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

cinemaSchema.index({ name: 1, city: 1 }, { unique: true });

module.exports = mongoose.model("Cinema", cinemaSchema);
