const router = require("express").Router();
const reviewController = require("../controllers/reviewController");
const { authMiddleware } = require("../middlewares/authMiddleware");
const validateRequest = require("../middlewares/validateRequest");
const { createReviewValidator } = require("../validators/reviewValidators");

router.post("/", authMiddleware, createReviewValidator, validateRequest, reviewController.createReview);

module.exports = router;
