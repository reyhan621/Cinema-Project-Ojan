const express = require("express");
const router = express.Router();
const authenticate = require("../middlewares/authenticate");
const requireAdmin = require("../middlewares/requireAdmin");
const {
  getHalls,
  getHallById,
  createHall,
  updateHall,
  deleteHall,
} = require("../controllers/hallController");

router.get("/", getHalls);
router.get("/:id", getHallById);
router.post("/", authenticate, requireAdmin, createHall);
router.put("/:id", authenticate, requireAdmin, updateHall);
router.delete("/:id", authenticate, requireAdmin, deleteHall);

module.exports = router;
