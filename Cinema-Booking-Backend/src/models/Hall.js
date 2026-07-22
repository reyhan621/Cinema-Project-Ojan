const mongoose = require("mongoose");

const hallSchema = new mongoose.Schema(
  {
    cinema: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Cinema",
      required: [true, "Cinema is required"],
    },
    name: {
      type: String,
      required: [true, "Hall name is required"],
      trim: true,
    },
    rows: {
      type: Number,
      required: [true, "Number of rows is required"],
      min: [1, "Rows must be at least 1"],
      max: [10, "Rows cannot exceed 10"],
    },
    columns: {
      type: Number,
      required: [true, "Number of columns is required"],
      min: [1, "Columns must be at least 1"],
      max: [10, "Columns cannot exceed 10"],
    },
    totalSeats: {
      type: Number,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

hallSchema.index({ cinema: 1, name: 1 }, { unique: true });

// Auto-compute totalSeats before validation. Uses the modern arity-0 sync hook
// style (no `next` callback) — the callback style throws in this Mongoose version.
hallSchema.pre("validate", function () {
  if (this.rows && this.columns) {
    this.totalSeats = this.rows * this.columns;
  }
});

module.exports = mongoose.model("Hall", hallSchema);
