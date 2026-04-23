const { pool } = require("../config/database");
const ApiError = require("../utils/ApiError");
const { createNotification } = require("./notificationService");

const formatTransaction = (row, currentUserId) => {
  const isBuyer = row.buyerId === currentUserId;

  return {
    id: row.id,
    finalPrice: Number(row.finalPrice),
    status: row.status,
    escrowStatus: row.escrowStatus,
    buyerConfirmedAt: row.buyerConfirmedAt,
    sellerConfirmedAt: row.sellerConfirmedAt,
    payoutReleasedAt: row.payoutReleasedAt,
    completedAt: row.completedAt,
    createdAt: row.createdAt,
    myRole: isBuyer ? "buyer" : "seller",
    canReview: isBuyer && row.status === "completed" && !row.reviewId,
    product: {
      id: row.productId,
      title: row.productTitle,
      imageUrl: row.productImage
    },
    buyer: {
      id: row.buyerId,
      fullName: row.buyerName,
      avatarUrl: row.buyerAvatar
    },
    seller: {
      id: row.sellerId,
      fullName: row.sellerName,
      avatarUrl: row.sellerAvatar
    },
    counterpart: isBuyer
      ? { id: row.sellerId, fullName: row.sellerName, avatarUrl: row.sellerAvatar, role: "seller" }
      : { id: row.buyerId, fullName: row.buyerName, avatarUrl: row.buyerAvatar, role: "buyer" },
    reviewId: row.reviewId
  };
};

const getMyTransactions = async (userId) => {
  const [rows] = await pool.query(
    `SELECT
      t.id,
      t.final_price AS finalPrice,
      t.status,
      t.escrow_status AS escrowStatus,
      t.buyer_confirmed_at AS buyerConfirmedAt,
      t.seller_confirmed_at AS sellerConfirmedAt,
      t.payout_released_at AS payoutReleasedAt,
      t.completed_at AS completedAt,
      t.created_at AS createdAt,
      p.id AS productId,
      p.title AS productTitle,
      p.image_url AS productImage,
      buyer.id AS buyerId,
      buyer.full_name AS buyerName,
      buyer.avatar_url AS buyerAvatar,
      seller.id AS sellerId,
      seller.full_name AS sellerName,
      seller.avatar_url AS sellerAvatar,
      r.id AS reviewId
     FROM transactions t
     INNER JOIN products p ON p.id = t.product_id
     INNER JOIN users buyer ON buyer.id = t.buyer_id
     INNER JOIN users seller ON seller.id = t.seller_id
     LEFT JOIN reviews r ON r.transaction_id = t.id
     WHERE t.buyer_id = ? OR t.seller_id = ?
     ORDER BY t.created_at DESC`,
    [userId, userId]
  );

  return rows.map((row) => formatTransaction(row, userId));
};

const completeTransaction = async (transactionId, userId) => {
  const [rows] = await pool.query(
    "SELECT id, buyer_id AS buyerId, seller_id AS sellerId, status FROM transactions WHERE id = ? LIMIT 1",
    [transactionId]
  );

  if (!rows.length) {
    throw new ApiError(404, "Transaksi tidak ditemukan.");
  }

  const transaction = rows[0];

  if (![transaction.buyerId, transaction.sellerId].includes(userId)) {
    throw new ApiError(403, "Anda tidak berhak mengubah transaksi ini.");
  }

  if (transaction.status !== "pending_meetup") {
    throw new ApiError(422, "Transaksi sudah diproses.");
  }

  await pool.query(
    `UPDATE transactions
     SET status = 'completed', escrow_status = 'released', completed_at = NOW(), payout_released_at = NOW()
     WHERE id = ?`,
    [transactionId]
  );

  await pool.query(
    `INSERT INTO escrow_events (transaction_id, actor_id, event_type, note)
     VALUES (?, ?, 'manual_complete', 'Transaksi ditandai selesai manual.')`,
    [transactionId, userId]
  );

  const transactions = await getMyTransactions(userId);
  return transactions.find((item) => item.id === transactionId);
};

const confirmEscrow = async (transactionId, userId, role) => {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const [rows] = await connection.query(
      `SELECT
        id,
        buyer_id AS buyerId,
        seller_id AS sellerId,
        status,
        escrow_status AS escrowStatus,
        buyer_confirmed_at AS buyerConfirmedAt,
        seller_confirmed_at AS sellerConfirmedAt
       FROM transactions
       WHERE id = ?
       LIMIT 1
       FOR UPDATE`,
      [transactionId]
    );

    if (!rows.length) {
      throw new ApiError(404, "Transaksi tidak ditemukan.");
    }

    const transaction = rows[0];

    if (![transaction.buyerId, transaction.sellerId].includes(userId)) {
      throw new ApiError(403, "Anda tidak berhak mengubah transaksi ini.");
    }

    if (transaction.status !== "pending_meetup" || transaction.escrowStatus !== "holding") {
      throw new ApiError(422, "Escrow transaksi ini tidak bisa dikonfirmasi.");
    }

    if (role === "buyer" && transaction.buyerId !== userId) {
      throw new ApiError(403, "Hanya pembeli yang bisa konfirmasi barang diterima.");
    }

    if (role === "seller" && transaction.sellerId !== userId) {
      throw new ApiError(403, "Hanya seller yang bisa konfirmasi barang diserahkan.");
    }

    const field = role === "buyer" ? "buyer_confirmed_at" : "seller_confirmed_at";
    const eventType = role === "buyer" ? "buyer_confirmed" : "seller_confirmed";

    await connection.query(`UPDATE transactions SET ${field} = COALESCE(${field}, NOW()) WHERE id = ?`, [
      transactionId
    ]);
    await connection.query(
      `INSERT INTO escrow_events (transaction_id, actor_id, event_type, note)
       VALUES (?, ?, ?, ?)`,
      [transactionId, userId, eventType, role === "buyer" ? "Pembeli mengonfirmasi barang diterima." : "Seller mengonfirmasi barang diserahkan."]
    );

    const [updatedRows] = await connection.query(
      `SELECT buyer_confirmed_at AS buyerConfirmedAt, seller_confirmed_at AS sellerConfirmedAt
       FROM transactions
       WHERE id = ?
       LIMIT 1`,
      [transactionId]
    );

    if (updatedRows[0].buyerConfirmedAt && updatedRows[0].sellerConfirmedAt) {
      await connection.query(
        `UPDATE transactions
         SET status = 'completed', escrow_status = 'released', completed_at = NOW(), payout_released_at = NOW()
         WHERE id = ?`,
        [transactionId]
      );
      await connection.query(
        `INSERT INTO escrow_events (transaction_id, actor_id, event_type, note)
         VALUES (?, ?, 'escrow_released', 'Dana escrow otomatis dirilis karena kedua pihak sudah konfirmasi.')`,
        [transactionId, userId]
      );
    }

    await connection.commit();

    const recipientId = role === "buyer" ? transaction.sellerId : transaction.buyerId;
    await createNotification({
      userId: recipientId,
      type: "escrow",
      title: role === "buyer" ? "Pembeli mengonfirmasi barang" : "Seller mengonfirmasi penyerahan",
      body: "Cek status escrow transaksi Anda.",
      actionUrl: "/dashboard/transactions"
    });

    const transactions = await getMyTransactions(userId);
    return transactions.find((item) => item.id === Number(transactionId));
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

const disputeEscrow = async (transactionId, userId, note = null) => {
  const [rows] = await pool.query(
    "SELECT id, buyer_id AS buyerId, seller_id AS sellerId, escrow_status AS escrowStatus FROM transactions WHERE id = ? LIMIT 1",
    [transactionId]
  );

  if (!rows.length) {
    throw new ApiError(404, "Transaksi tidak ditemukan.");
  }

  if (![rows[0].buyerId, rows[0].sellerId].includes(userId)) {
    throw new ApiError(403, "Anda tidak berhak membuat dispute transaksi ini.");
  }

  if (rows[0].escrowStatus !== "holding") {
    throw new ApiError(422, "Escrow tidak bisa didispute.");
  }

  await pool.query("UPDATE transactions SET escrow_status = 'disputed' WHERE id = ?", [transactionId]);
  await pool.query(
    `INSERT INTO escrow_events (transaction_id, actor_id, event_type, note)
     VALUES (?, ?, 'escrow_disputed', ?)`,
    [transactionId, userId, note || "User membuka dispute escrow."]
  );

  const transactions = await getMyTransactions(userId);
  return transactions.find((item) => item.id === Number(transactionId));
};

module.exports = { completeTransaction, confirmEscrow, disputeEscrow, getMyTransactions };
