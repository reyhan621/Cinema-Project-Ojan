const express = require("express");
const router = express.Router();
const requireAdmin = require("../middlewares/requireAdmin");
const authenticate = require("../middlewares/authenticate");
const posterUpload = require("../middlewares/posterUpload");

const {
  getGenres,
  createGenre,
  getMovies,
  getMovieDetail,
  createMovie,
  updateMovie,
  deleteMovie,
} = require("../controllers/movieController");

router.get("/genres", getGenres);

router.post("/genres", authenticate, requireAdmin, createGenre);

router.get("/", getMovies);

router.get("/:id", getMovieDetail);

router.post("/", authenticate, requireAdmin, posterUpload, createMovie);

router.put("/:id", authenticate, requireAdmin, posterUpload, updateMovie);

router.delete("/:id", authenticate, requireAdmin, deleteMovie);

module.exports = router;
