const { getRecommendations } = require("../services/recommendationService");
const asyncHandler = require("../utils/asyncHandler");

const getMovieRecommendations = asyncHandler(async (req, res) => {
  const { movieId } = req.params;
  const recommendations = await getRecommendations(movieId);
  res.status(200).json({ success: true, recommendations });
});

module.exports = { getMovieRecommendations };
