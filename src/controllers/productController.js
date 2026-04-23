const asyncHandler = require("../utils/asyncHandler");
const ApiError = require("../utils/ApiError");
const productService = require("../services/productService");
const { getUploadUrl } = require("../utils/file");

const listProducts = asyncHandler(async (req, res) => {
  const currentUserId = req.user?.id || null;
  const data = await productService.getProducts(req.query, currentUserId);

  res.json({
    success: true,
    data: { products: data.products },
    meta: data.meta
  });
});

const searchProducts = asyncHandler(async (req, res) => {
  const data = await productService.getProducts(
    {
      ...req.query,
      search: req.query.search || req.query.q,
      limit: req.query.limit || 8
    },
    req.user?.id || null
  );

  res.json({
    success: true,
    data: { products: data.products },
    meta: data.meta
  });
});

const getProduct = asyncHandler(async (req, res) => {
  const product = await productService.getProductById(req.params.id, req.user?.id || null);

  res.json({
    success: true,
    data: { product }
  });
});

const getMyProducts = asyncHandler(async (req, res) => {
  const products = await productService.getMyProducts(req.user.id);

  res.json({
    success: true,
    data: { products }
  });
});

const createProduct = asyncHandler(async (req, res) => {
  if (!req.file) {
    throw new ApiError(422, "Gambar produk wajib diunggah.");
  }

  const product = await productService.createProduct(req.user.id, req.body, getUploadUrl(req.file.filename));

  res.status(201).json({
    success: true,
    message: "Produk berhasil dipublikasikan.",
    data: { product }
  });
});

const updateProduct = asyncHandler(async (req, res) => {
  const imageUrl = req.file ? getUploadUrl(req.file.filename) : null;
  const product = await productService.updateProduct(req.params.id, req.user, req.body, imageUrl);

  res.json({
    success: true,
    message: "Produk berhasil diperbarui.",
    data: { product }
  });
});

const deleteProduct = asyncHandler(async (req, res) => {
  const product = await productService.deleteProduct(req.params.id, req.user);

  res.json({
    success: true,
    message: "Produk berhasil dihapus.",
    data: { product }
  });
});

const markProductSold = asyncHandler(async (req, res) => {
  const product = await productService.markProductSold(req.params.id, req.user);

  res.json({
    success: true,
    message: "Produk berhasil ditandai terjual.",
    data: { product }
  });
});

module.exports = {
  createProduct,
  deleteProduct,
  getMyProducts,
  getProduct,
  listProducts,
  markProductSold,
  searchProducts,
  updateProduct
};
