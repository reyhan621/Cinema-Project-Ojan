const Cinema = require("../models/Cinema");
const Hall = require("../models/Hall");
const asyncHandler = require("../utils/asyncHandler");
const AppError = require("../utils/AppError");

const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// GET /api/cinemas
const getCinemas = asyncHandler(async (req, res) => {
  const cinemas = await Cinema.find().sort({ name: 1 });
  res.status(200).json({ success: true, data: cinemas });
});

// GET /api/cinemas/:id
const getCinemaById = asyncHandler(async (req, res) => {
  const cinema = await Cinema.findById(req.params.id);
  if (!cinema) throw new AppError("Cinema not found", 404);
  res.status(200).json({ success: true, data: cinema });
});

// POST /api/cinemas
const createCinema = asyncHandler(async (req, res) => {
  const name = (req.body.name || "").trim();
  const city = (req.body.city || "").trim();

  if (!name) throw new AppError("Cinema name is required", 400);
  if (!city) throw new AppError("City is required", 400);

  const existing = await Cinema.findOne({
    name: { $regex: `^${escapeRegex(name)}$`, $options: "i" },
    city: { $regex: `^${escapeRegex(city)}$`, $options: "i" },
  });

  if (existing) {
    throw new AppError("A cinema with this name already exists in this city", 409);
  }

  const cinema = await Cinema.create({ name, city });
  res.status(201).json({ success: true, data: cinema });
});

// PUT /api/cinemas/:id
const updateCinema = asyncHandler(async (req, res) => {
  const cinema = await Cinema.findById(req.params.id);
  if (!cinema) throw new AppError("Cinema not found", 404);

  const name = req.body.name !== undefined ? (req.body.name || "").trim() : cinema.name;
  const city = req.body.city !== undefined ? (req.body.city || "").trim() : cinema.city;

  if (!name) throw new AppError("Cinema name is required", 400);
  if (!city) throw new AppError("City is required", 400);

  const existing = await Cinema.findOne({
    _id: { $ne: req.params.id },
    name: { $regex: `^${escapeRegex(name)}$`, $options: "i" },
    city: { $regex: `^${escapeRegex(city)}$`, $options: "i" },
  });

  if (existing) {
    throw new AppError("A cinema with this name already exists in this city", 409);
  }

  const updated = await Cinema.findByIdAndUpdate(
    req.params.id,
    { name, city },
    { returnDocument: "after", runValidators: true }
  );

  res.status(200).json({ success: true, data: updated });
});

// DELETE /api/cinemas/:id
const deleteCinema = asyncHandler(async (req, res) => {
  const cinema = await Cinema.findById(req.params.id);
  if (!cinema) throw new AppError("Cinema not found", 404);

  const hallCount = await Hall.countDocuments({ cinema: req.params.id });
  if (hallCount > 0) {
    throw new AppError(
      "Cinema cannot be deleted because it still has halls. Remove all halls first.",
      400
    );
  }

  await Cinema.findByIdAndDelete(req.params.id);
  res.status(200).json({ success: true, message: "Cinema deleted successfully" });
});

module.exports = {
  getCinemas,
  getCinemaById,
  createCinema,
  updateCinema,
  deleteCinema,
};
