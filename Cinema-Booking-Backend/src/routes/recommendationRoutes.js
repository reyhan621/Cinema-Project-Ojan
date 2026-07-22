const express = require("express");
const router = express.Router();

const { getMovieRecommendations } = require("../controllers/recommendationController");

router.get("/:movieId", getMovieRecommendations);

module.exports = router;
