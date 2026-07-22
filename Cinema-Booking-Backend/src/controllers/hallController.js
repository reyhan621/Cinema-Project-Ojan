const Hall = require("../models/Hall");
const Cinema = require("../models/Cinema");
const Showtime = require("../models/Showtime");
const asyncHandler = require("../utils/asyncHandler");
const AppError = require("../utils/AppError");

const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// GET /api/halls
const getHalls = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.query.cinemaId) {
    filter.cinema = req.query.cinemaId;
  }
  const halls = await Hall.find(filter).populate("cinema").sort({ name: 1 });
  res.status(200).json({ success: true, data: halls });
});

// GET /api/halls/:id
const getHallById = asyncHandler(async (req, res) => {
  const hall = await Hall.findById(req.params.id).populate("cinema");
  if (!hall) throw new AppError("Hall not found", 404);
  res.status(200).json({ success: true, data: hall });
});

// POST /api/halls
const createHall = asyncHandler(async (req, res) => {
  const { cinema: cinemaId, name, rows, columns } = req.body;

  if (!cinemaId) throw new AppError("Cinema is required", 400);
  if (!name || !name.trim()) throw new AppError("Hall name is required", 400);
  if (!rows || rows < 1 || rows > 10) throw new AppError("Rows must be between 1 and 10", 400);
  if (!columns || columns < 1 || columns > 10) throw new AppError("Columns must be between 1 and 10", 400);

  const cinema = await Cinema.findById(cinemaId);
  if (!cinema) throw new AppError("Cinema not found", 404);

  const trimmedName = name.trim();
  const totalSeats = Number(rows) * Number(columns);
  if (totalSeats > 100) throw new AppError("Total seats cannot exceed 100", 400);

  const existing = await Hall.findOne({
    cinema: cinemaId,
    name: { $regex: `^${escapeRegex(trimmedName)}$`, $options: "i" },
  });
  if (existing) {
    throw new AppError("A hall with this name already exists in this cinema", 409);
  }

  const hall = await Hall.create({
    cinema: cinemaId,
    name: trimmedName,
    rows: Number(rows),
    columns: Number(columns),
    totalSeats,
  });

  const populated = await hall.populate("cinema");
  res.status(201).json({ success: true, data: populated });
});

// PUT /api/halls/:id
const updateHall = asyncHandler(async (req, res) => {
  const hall = await Hall.findById(req.params.id);
  if (!hall) throw new AppError("Hall not found", 404);

  const cinemaId = req.body.cinema !== undefined ? req.body.cinema : hall.cinema;
  const name = req.body.name !== undefined ? req.body.name.trim() : hall.name;
  const rows = req.body.rows !== undefined ? Number(req.body.rows) : hall.rows;
  const columns = req.body.columns !== undefined ? Number(req.body.columns) : hall.columns;

  if (!cinemaId) throw new AppError("Cinema is required", 400);
  if (!name) throw new AppError("Hall name is required", 400);
  if (rows < 1 || rows > 10) throw new AppError("Rows must be between 1 and 10", 400);
  if (columns < 1 || columns > 10) throw new AppError("Columns must be between 1 and 10", 400);

  const cinema = await Cinema.findById(cinemaId);
  if (!cinema) throw new AppError("Cinema not found", 404);

  const totalSeats = rows * columns;
  if (totalSeats > 100) throw new AppError("Total seats cannot exceed 100", 400);

  const existing = await Hall.findOne({
    _id: { $ne: req.params.id },
    cinema: cinemaId,
    name: { $regex: `^${escapeRegex(name)}$`, $options: "i" },
  });
  if (existing) {
    throw new AppError("A hall with this name already exists in this cinema", 409);
  }

  const updated = await Hall.findByIdAndUpdate(
    req.params.id,
    { cinema: cinemaId, name, rows, columns, totalSeats },
    { returnDocument: "after", runValidators: true }
  ).populate("cinema");

  res.status(200).json({ success: true, data: updated });
});

// DELETE /api/halls/:id
const deleteHall = asyncHandler(async (req, res) => {
  const hall = await Hall.findById(req.params.id);
  if (!hall) throw new AppError("Hall not found", 404);

  const showtimeCount = await Showtime.countDocuments({ hall: req.params.id });
  if (showtimeCount > 0) {
    throw new AppError(
      "Hall cannot be deleted because it has active showtimes. Remove related showtimes first.",
      400
    );
  }

  await Hall.findByIdAndDelete(req.params.id);
  res.status(200).json({ success: true, message: "Hall deleted successfully" });
});

module.exports = {
  getHalls,
  getHallById,
  createHall,
  updateHall,
  deleteHall,
};
