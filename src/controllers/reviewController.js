const asyncHandler = require("../utils/asyncHandler");
const reviewService = require("../services/reviewService");

const createReview = asyncHandler(async (req, res) => {
  const review = await reviewService.createReview(req.user.id, req.body);

  res.status(201).json({
    success: true,
    message: "Review berhasil dikirim.",
    data: { review }
  });
});

module.exports = { createReview };
