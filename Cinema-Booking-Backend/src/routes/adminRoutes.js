const express = require("express");
const router = express.Router();
const authenticate = require("../middlewares/authenticate");
const requireAdmin = require("../middlewares/requireAdmin");
const { getStats, getAllBookings } = require("../controllers/adminController");

router.get("/stats", authenticate, requireAdmin, getStats);
router.get("/bookings", authenticate, requireAdmin, getAllBookings);

module.exports = router;