const express = require("express");
const router = express.Router();
const authenticate = require("../middlewares/authenticate");
const { createBooking, getMyBookings, getBookingById, cancelBooking } =
  require("../controllers/bookingController");

router.post("/", authenticate, createBooking);
router.get("/me", authenticate, getMyBookings);       // ← SEBELUM /:id
router.get("/:id", authenticate, getBookingById);
router.delete("/:id", authenticate, cancelBooking);

module.exports = router;
