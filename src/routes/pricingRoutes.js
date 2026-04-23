const router = require("express").Router();
const pricingController = require("../controllers/pricingController");
const { authMiddleware } = require("../middlewares/authMiddleware");
const validateRequest = require("../middlewares/validateRequest");
const { pricingEstimateValidator } = require("../validators/pricingValidators");

router.post("/estimate", authMiddleware, pricingEstimateValidator, validateRequest, pricingController.estimate);

module.exports = router;
