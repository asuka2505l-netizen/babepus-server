const { pool } = require("../config/database");
const ApiError = require("../utils/ApiError");

const ensureReportTargetExists = async (payload) => {
  if (payload.targetType === "product") {
    const [products] = await pool.query(
      "SELECT id FROM products WHERE id = ? AND deleted_at IS NULL LIMIT 1",
      [payload.targetProductId]
    );

    if (!products.length) {
      throw new ApiError(404, "Produk yang dilaporkan tidak ditemukan.");
    }

    return;
  }

  const [users] = await pool.query("SELECT id FROM users WHERE id = ? LIMIT 1", [payload.targetUserId]);

  if (!users.length) {
    throw new ApiError(404, "User yang dilaporkan tidak ditemukan.");
  }
};

const createReport = async (reporterId, payload) => {
  await ensureReportTargetExists(payload);

  const [result] = await pool.query(
    `INSERT INTO reports
      (reporter_id, target_type, target_user_id, target_product_id, reason, details, status)
     VALUES (?, ?, ?, ?, ?, ?, 'pending')`,
    [
      reporterId,
      payload.targetType,
      payload.targetType === "user" ? payload.targetUserId : null,
      payload.targetType === "product" ? payload.targetProductId : null,
      payload.reason,
      payload.details || null
    ]
  );

  const [rows] = await pool.query(
    `SELECT id, target_type AS targetType, reason, details, status, created_at AS createdAt
     FROM reports
     WHERE id = ?
     LIMIT 1`,
    [result.insertId]
  );

  return rows[0];
};

module.exports = { createReport };
