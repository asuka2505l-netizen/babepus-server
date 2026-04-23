const asyncHandler = require("../utils/asyncHandler");
const pricingService = require("../services/pricingService");

const estimate = asyncHandler(async (req, res) => {
  const estimateResult = await pricingService.estimateUsedPrice(req.body);

  res.json({
    success: true,
    data: { estimate: estimateResult }
  });
});

module.exports = { estimate };
