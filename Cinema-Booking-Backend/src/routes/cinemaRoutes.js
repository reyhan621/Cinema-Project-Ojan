const express = require("express");
const router = express.Router();
const authenticate = require("../middlewares/authenticate");
const requireAdmin = require("../middlewares/requireAdmin");
const {
  getCinemas,
  getCinemaById,
  createCinema,
  updateCinema,
  deleteCinema,
} = require("../controllers/cinemaController");

router.get("/", getCinemas);
router.get("/:id", getCinemaById);
router.post("/", authenticate, requireAdmin, createCinema);
router.put("/:id", authenticate, requireAdmin, updateCinema);
router.delete("/:id", authenticate, requireAdmin, deleteCinema);

module.exports = router;
