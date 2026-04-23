const { pool } = require("../config/database");
const ApiError = require("../utils/ApiError");
const { createNotification } = require("./notificationService");

const parseJsonArray = (value) => {
  if (!value) {
    return [];
  }

  if (Array.isArray(value)) {
    return value;
  }

  try {
    return JSON.parse(value);
  } catch (_error) {
    return [];
  }
};

const createReview = async (reviewerId, payload) => {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const [transactions] = await connection.query(
      `SELECT
        t.id,
        t.status,
        t.buyer_id AS buyerId,
        t.seller_id AS sellerId,
        r.id AS reviewId
       FROM transactions t
       LEFT JOIN reviews r ON r.transaction_id = t.id
       WHERE t.id = ?
       LIMIT 1
       FOR UPDATE`,
      [payload.transactionId]
    );

    if (!transactions.length) {
      throw new ApiError(404, "Transaksi tidak ditemukan.");
    }

    const transaction = transactions[0];

    if (transaction.buyerId !== reviewerId) {
      throw new ApiError(403, "Hanya pembeli yang dapat memberi review seller.");
    }

    if (transaction.status !== "completed") {
      throw new ApiError(422, "Review hanya bisa dibuat setelah transaksi selesai.");
    }

    if (transaction.reviewId) {
      throw new ApiError(409, "Transaksi ini sudah memiliki review.");
    }

    const [result] = await connection.query(
      `INSERT INTO reviews
        (transaction_id, reviewer_id, seller_id, rating, communication_rating, item_accuracy_rating, meetup_rating, tags, is_anonymous, comment)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        payload.transactionId,
        reviewerId,
        transaction.sellerId,
        payload.rating,
        payload.communicationRating || null,
        payload.itemAccuracyRating || null,
        payload.meetupRating || null,
        payload.tags?.length ? JSON.stringify(payload.tags) : null,
        payload.isAnonymous ? 1 : 0,
        payload.comment || null
      ]
    );

    await connection.query(
      `UPDATE users
       SET
        rating_average = (SELECT ROUND(COALESCE(AVG(rating), 0), 2) FROM reviews WHERE seller_id = ?),
        rating_count = (SELECT COUNT(*) FROM reviews WHERE seller_id = ?)
       WHERE id = ?`,
      [transaction.sellerId, transaction.sellerId, transaction.sellerId]
    );

    await connection.commit();

    await createNotification({
      userId: transaction.sellerId,
      type: "review",
      title: "Review baru diterima",
      body: `Anda mendapat rating ${payload.rating}/5 dari transaksi terbaru.`,
      actionUrl: "/dashboard"
    });

    const [rows] = await pool.query(
      `SELECT
        r.id,
        r.rating,
        r.communication_rating AS communicationRating,
        r.item_accuracy_rating AS itemAccuracyRating,
        r.meetup_rating AS meetupRating,
        r.tags,
        r.is_anonymous AS isAnonymous,
        r.comment,
        r.created_at AS createdAt,
        CASE WHEN r.is_anonymous = 1 THEN 'Mahasiswa BabePus' ELSE reviewer.full_name END AS reviewerName,
        reviewer.avatar_url AS reviewerAvatar
       FROM reviews r
       INNER JOIN users reviewer ON reviewer.id = r.reviewer_id
       WHERE r.id = ?
       LIMIT 1`,
      [result.insertId]
    );

    return {
      ...rows[0],
      tags: parseJsonArray(rows[0].tags),
      isAnonymous: Boolean(rows[0].isAnonymous)
    };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

module.exports = { createReview };
