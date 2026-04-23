const { pool } = require("../config/database");
const ApiError = require("../utils/ApiError");

const addToWishlist = async (userId, productId) => {
  const [products] = await pool.query(
    `SELECT id, seller_id AS sellerId, status
     FROM products
     WHERE id = ? AND deleted_at IS NULL
     LIMIT 1`,
    [productId]
  );

  if (!products.length) {
    throw new ApiError(404, "Produk tidak ditemukan.");
  }

  if (products[0].sellerId === userId) {
    throw new ApiError(422, "Produk sendiri tidak bisa masuk wishlist.");
  }

  if (products[0].status !== "active") {
    throw new ApiError(422, "Produk tidak tersedia untuk wishlist.");
  }

  await pool.query(
    `INSERT IGNORE INTO wishlists (user_id, product_id)
     VALUES (?, ?)`,
    [userId, productId]
  );

  return { productId, isWishlisted: true };
};

const removeFromWishlist = async (userId, productId) => {
  await pool.query("DELETE FROM wishlists WHERE user_id = ? AND product_id = ?", [userId, productId]);
  return { productId, isWishlisted: false };
};

const getWishlist = async (userId) => {
  const [rows] = await pool.query(
    `SELECT
      p.id,
      p.title,
      p.slug,
      p.price,
      p.condition_label AS conditionLabel,
      p.status,
      p.campus_location AS campusLocation,
      p.faculty,
      p.image_url AS imageUrl,
      p.created_at AS createdAt,
      c.id AS categoryId,
      c.name AS categoryName,
      u.id AS sellerId,
      u.full_name AS sellerName,
      u.avatar_url AS sellerAvatar,
      u.rating_average AS sellerRatingAverage,
      u.rating_count AS sellerRatingCount,
      u.campus AS sellerCampus,
      1 AS isWishlisted
     FROM wishlists w
     INNER JOIN products p ON p.id = w.product_id
     INNER JOIN categories c ON c.id = p.category_id
     INNER JOIN users u ON u.id = p.seller_id
     WHERE w.user_id = ? AND p.deleted_at IS NULL
     ORDER BY w.created_at DESC`,
    [userId]
  );

  return rows.map((row) => ({
    id: row.id,
    title: row.title,
    slug: row.slug,
    price: Number(row.price),
    conditionLabel: row.conditionLabel,
    status: row.status,
    campusLocation: row.campusLocation,
    faculty: row.faculty,
    imageUrl: row.imageUrl,
    isWishlisted: Boolean(row.isWishlisted),
    createdAt: row.createdAt,
    category: { id: row.categoryId, name: row.categoryName },
    seller: {
      id: row.sellerId,
      fullName: row.sellerName,
      avatarUrl: row.sellerAvatar,
      ratingAverage: Number(row.sellerRatingAverage || 0),
      ratingCount: Number(row.sellerRatingCount || 0),
      campus: row.sellerCampus
    }
  }));
};

module.exports = { addToWishlist, getWishlist, removeFromWishlist };
