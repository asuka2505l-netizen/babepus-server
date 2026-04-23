const { pool } = require("../config/database");
const ApiError = require("../utils/ApiError");
const { deleteLocalUpload } = require("../utils/file");
const { findUserById } = require("./authService");

const updateProfile = async (userId, payload) => {
  await pool.query(
    `UPDATE users
     SET
      full_name = COALESCE(?, full_name),
      phone = ?,
      campus = COALESCE(?, campus),
      faculty = ?,
      study_program = ?,
      bio = ?
     WHERE id = ?`,
    [
      payload.fullName || null,
      payload.phone || null,
      payload.campus || null,
      payload.faculty || null,
      payload.studyProgram || null,
      payload.bio || null,
      userId
    ]
  );

  return findUserById(userId);
};

const updateAvatar = async (userId, avatarUrl) => {
  const currentUser = await findUserById(userId);

  if (!currentUser) {
    throw new ApiError(404, "User tidak ditemukan.");
  }

  await pool.query("UPDATE users SET avatar_url = ? WHERE id = ?", [avatarUrl, userId]);

  if (currentUser.avatarUrl && currentUser.avatarUrl !== avatarUrl) {
    await deleteLocalUpload(currentUser.avatarUrl);
  }

  return findUserById(userId);
};

const getDashboardSummary = async (userId) => {
  const [[productStats], [offerStats], [transactionStats], [recentProducts], [recentOffers]] = await Promise.all([
    pool.query(
      `SELECT
        COUNT(*) AS totalProducts,
        COALESCE(SUM(status = 'active' AND deleted_at IS NULL), 0) AS activeProducts,
        COALESCE(SUM(status = 'sold'), 0) AS soldProducts
       FROM products
       WHERE seller_id = ?`,
      [userId]
    ),
    pool.query(
      `SELECT
        COUNT(*) AS incomingOffers,
        COALESCE(SUM(status = 'pending'), 0) AS pendingOffers
       FROM offers
       WHERE seller_id = ?`,
      [userId]
    ),
    pool.query(
      `SELECT
        COUNT(*) AS totalTransactions,
        COALESCE(SUM(status = 'completed'), 0) AS completedTransactions
       FROM transactions
       WHERE buyer_id = ? OR seller_id = ?`,
      [userId, userId]
    ),
    pool.query(
      `SELECT id, title, price, status, image_url AS imageUrl, created_at AS createdAt
       FROM products
       WHERE seller_id = ? AND deleted_at IS NULL
       ORDER BY created_at DESC
       LIMIT 5`,
      [userId]
    ),
    pool.query(
      `SELECT
        o.id,
        o.offer_price AS offerPrice,
        o.status,
        o.created_at AS createdAt,
        p.id AS productId,
        p.title AS productTitle,
        p.image_url AS productImage,
        buyer.full_name AS buyerName
       FROM offers o
       INNER JOIN products p ON p.id = o.product_id
       INNER JOIN users buyer ON buyer.id = o.buyer_id
       WHERE o.seller_id = ?
       ORDER BY o.created_at DESC
       LIMIT 5`,
      [userId]
    )
  ]);

  return {
    stats: {
      totalProducts: Number(productStats[0].totalProducts || 0),
      activeProducts: Number(productStats[0].activeProducts || 0),
      soldProducts: Number(productStats[0].soldProducts || 0),
      incomingOffers: Number(offerStats[0].incomingOffers || 0),
      pendingOffers: Number(offerStats[0].pendingOffers || 0),
      totalTransactions: Number(transactionStats[0].totalTransactions || 0),
      completedTransactions: Number(transactionStats[0].completedTransactions || 0)
    },
    recentProducts,
    recentOffers
  };
};

const getSellerAnalytics = async (userId) => {
  const [[views], [wishlists], [revenue], [offers], [topProducts], [funnel]] = await Promise.all([
    pool.query(
      `SELECT
        COALESCE(SUM(view_count), 0) AS totalViews,
        COUNT(*) AS totalProducts,
        COALESCE(AVG(view_count), 0) AS averageViews
       FROM products
       WHERE seller_id = ? AND deleted_at IS NULL`,
      [userId]
    ),
    pool.query(
      `SELECT COUNT(*) AS wishlistCount
       FROM wishlists w
       INNER JOIN products p ON p.id = w.product_id
       WHERE p.seller_id = ? AND p.deleted_at IS NULL`,
      [userId]
    ),
    pool.query(
      `SELECT
        COALESCE(SUM(final_price), 0) AS grossRevenue,
        COUNT(*) AS completedTransactions
       FROM transactions
       WHERE seller_id = ? AND status = 'completed'`,
      [userId]
    ),
    pool.query(
      `SELECT
        COUNT(*) AS totalOffers,
        COALESCE(SUM(status = 'accepted'), 0) AS acceptedOffers,
        COALESCE(SUM(status = 'pending'), 0) AS pendingOffers
       FROM offers
       WHERE seller_id = ?`,
      [userId]
    ),
    pool.query(
      `SELECT
        p.id,
        p.title,
        p.price,
        p.status,
        p.view_count AS viewCount,
        p.image_url AS imageUrl,
        (SELECT COUNT(*) FROM wishlists w WHERE w.product_id = p.id) AS wishlistCount,
        (SELECT COUNT(*) FROM offers o WHERE o.product_id = p.id) AS offerCount
       FROM products p
       WHERE p.seller_id = ? AND p.deleted_at IS NULL
       ORDER BY p.view_count DESC, wishlistCount DESC, offerCount DESC
       LIMIT 8`,
      [userId]
    ),
    pool.query(
      `SELECT
        DATE(created_at) AS date,
        COUNT(*) AS offers
       FROM offers
       WHERE seller_id = ? AND created_at >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
       GROUP BY DATE(created_at)
       ORDER BY date ASC`,
      [userId]
    )
  ]);

  const offerAcceptanceRate = Number(offers[0].totalOffers || 0)
    ? Math.round((Number(offers[0].acceptedOffers || 0) / Number(offers[0].totalOffers || 0)) * 100)
    : 0;

  return {
    totalViews: Number(views[0].totalViews || 0),
    averageViews: Number(views[0].averageViews || 0),
    wishlistCount: Number(wishlists[0].wishlistCount || 0),
    grossRevenue: Number(revenue[0].grossRevenue || 0),
    completedTransactions: Number(revenue[0].completedTransactions || 0),
    totalOffers: Number(offers[0].totalOffers || 0),
    acceptedOffers: Number(offers[0].acceptedOffers || 0),
    pendingOffers: Number(offers[0].pendingOffers || 0),
    offerAcceptanceRate,
    topProducts: topProducts.map((product) => ({
      ...product,
      price: Number(product.price || 0),
      viewCount: Number(product.viewCount || 0),
      wishlistCount: Number(product.wishlistCount || 0),
      offerCount: Number(product.offerCount || 0)
    })),
    offerTrend: funnel.map((item) => ({
      date: item.date,
      offers: Number(item.offers || 0)
    }))
  };
};

module.exports = { getDashboardSummary, getSellerAnalytics, updateAvatar, updateProfile };
