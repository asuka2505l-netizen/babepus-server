const asyncHandler = require("../utils/asyncHandler");
const categoryService = require("../services/categoryService");

const getCategories = asyncHandler(async (_req, res) => {
  const categories = await categoryService.getCategories();

  res.json({
    success: true,
    data: { categories }
  });
});

module.exports = { getCategories };
