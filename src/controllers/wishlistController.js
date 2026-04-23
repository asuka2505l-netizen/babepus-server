const asyncHandler = require("../utils/asyncHandler");
const wishlistService = require("../services/wishlistService");

const getWishlist = asyncHandler(async (req, res) => {
  const products = await wishlistService.getWishlist(req.user.id);

  res.json({
    success: true,
    data: { products }
  });
});

const addToWishlist = asyncHandler(async (req, res) => {
  const wishlist = await wishlistService.addToWishlist(req.user.id, req.params.productId);

  res.status(201).json({
    success: true,
    message: "Produk ditambahkan ke wishlist.",
    data: { wishlist }
  });
});

const removeFromWishlist = asyncHandler(async (req, res) => {
  const wishlist = await wishlistService.removeFromWishlist(req.user.id, req.params.productId);

  res.json({
    success: true,
    message: "Produk dihapus dari wishlist.",
    data: { wishlist }
  });
});

module.exports = { addToWishlist, getWishlist, removeFromWishlist };
