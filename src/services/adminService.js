const { pool } = require("../config/database");
const ApiError = require("../utils/ApiError");
const { findUserById } = require("./authService");

const getDashboardStats = async () => {
  const [[users], [products], [offers], [transactions], [reports], [verifications]] = await Promise.all([
    pool.query(
      `SELECT
        COUNT(*) AS totalUsers,
        COALESCE(SUM(role = 'admin'), 0) AS totalAdmins,
        COALESCE(SUM(is_suspended = 1), 0) AS suspendedUsers
       FROM users`
    ),
    pool.query(
      `SELECT
        COUNT(*) AS totalProducts,
        COALESCE(SUM(status = 'active' AND deleted_at IS NULL), 0) AS activeProducts,
        COALESCE(SUM(status = 'sold'), 0) AS soldProducts
       FROM products`
    ),
    pool.query("SELECT COUNT(*) AS pendingOffers FROM offers WHERE status = 'pending'"),
    pool.query("SELECT COUNT(*) AS completedTransactions FROM transactions WHERE status = 'completed'"),
    pool.query("SELECT COUNT(*) AS pendingReports FROM reports WHERE status = 'pending'"),
    pool.query("SELECT COUNT(*) AS pendingVerifications FROM verifications WHERE status = 'pending'")
  ]);

  return {
    totalUsers: Number(users[0].totalUsers || 0),
    totalAdmins: Number(users[0].totalAdmins || 0),
    suspendedUsers: Number(users[0].suspendedUsers || 0),
    totalProducts: Number(products[0].totalProducts || 0),
    activeProducts: Number(products[0].activeProducts || 0),
    soldProducts: Number(products[0].soldProducts || 0),
    pendingOffers: Number(offers[0].pendingOffers || 0),
    completedTransactions: Number(transactions[0].completedTransactions || 0),
    pendingReports: Number(reports[0].pendingReports || 0),
    pendingVerifications: Number(verifications[0].pendingVerifications || 0)
  };
};

const getUsers = async (query = {}) => {
  const conditions = [];
  const params = [];

  if (query.search) {
    conditions.push("(full_name LIKE ? OR email LIKE ? OR campus LIKE ?)");
    const keyword = `%${query.search}%`;
    params.push(keyword, keyword, keyword);
  }

  const whereClause = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
  const [rows] = await pool.query(
    `SELECT
      id,
      full_name AS fullName,
      email,
      phone,
      campus,
      role,
      avatar_url AS avatarUrl,
      rating_average AS ratingAverage,
      rating_count AS ratingCount,
      is_suspended AS isSuspended,
      verification_status AS verificationStatus,
      created_at AS createdAt,
      (SELECT COUNT(*) FROM products p WHERE p.seller_id = users.id AND p.deleted_at IS NULL) AS productCount
     FROM users
     ${whereClause}
     ORDER BY created_at DESC
     LIMIT 100`,
    params
  );

  return rows.map((row) => ({
    ...row,
    ratingAverage: Number(row.ratingAverage || 0),
    ratingCount: Number(row.ratingCount || 0),
    isSuspended: Boolean(row.isSuspended),
    productCount: Number(row.productCount || 0)
  }));
};

const suspendUser = async (adminId, userId, isSuspended) => {
  if (adminId === userId) {
    throw new ApiError(422, "Admin tidak bisa suspend akun sendiri.");
  }

  const [result] = await pool.query("UPDATE users SET is_suspended = ? WHERE id = ?", [
    isSuspended ? 1 : 0,
    userId
  ]);

  if (!result.affectedRows) {
    throw new ApiError(404, "User tidak ditemukan.");
  }

  return findUserById(userId);
};

const getProducts = async () => {
  const [rows] = await pool.query(
    `SELECT
      p.id,
      p.title,
      p.price,
      p.status,
      p.image_url AS imageUrl,
      p.created_at AS createdAt,
      p.deleted_at AS deletedAt,
      c.name AS categoryName,
      u.full_name AS sellerName
     FROM products p
     INNER JOIN categories c ON c.id = p.category_id
     INNER JOIN users u ON u.id = p.seller_id
     ORDER BY p.created_at DESC
     LIMIT 100`
  );

  return rows.map((row) => ({ ...row, price: Number(row.price) }));
};

const getReports = async () => {
  const [rows] = await pool.query(
    `SELECT
      r.id,
      r.target_type AS targetType,
      r.reason,
      r.details,
      r.status,
      r.admin_note AS adminNote,
      r.created_at AS createdAt,
      reporter.id AS reporterId,
      reporter.full_name AS reporterName,
      targetUser.full_name AS targetUserName,
      targetProduct.title AS targetProductTitle,
      admin.full_name AS reviewedByName
     FROM reports r
     INNER JOIN users reporter ON reporter.id = r.reporter_id
     LEFT JOIN users targetUser ON targetUser.id = r.target_user_id
     LEFT JOIN products targetProduct ON targetProduct.id = r.target_product_id
     LEFT JOIN users admin ON admin.id = r.reviewed_by
     ORDER BY FIELD(r.status, 'pending', 'reviewed', 'resolved', 'rejected'), r.created_at DESC
     LIMIT 100`
  );

  return rows;
};

const updateReportStatus = async (adminId, reportId, payload) => {
  const [result] = await pool.query(
    `UPDATE reports
     SET status = ?, admin_note = ?, reviewed_by = ?, reviewed_at = NOW()
     WHERE id = ?`,
    [payload.status, payload.adminNote || null, adminId, reportId]
  );

  if (!result.affectedRows) {
    throw new ApiError(404, "Laporan tidak ditemukan.");
  }

  const reports = await getReports();
  return reports.find((report) => report.id === reportId);
};

module.exports = {
  getDashboardStats,
  getProducts,
  getReports,
  getUsers,
  suspendUser,
  updateReportStatus
};
