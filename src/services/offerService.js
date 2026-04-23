const { pool } = require("../config/database");
const ApiError = require("../utils/ApiError");
const { createNotification } = require("./notificationService");

const formatOffer = (row) => ({
  id: row.id,
  offerPrice: Number(row.offerPrice),
  note: row.note,
  status: row.status,
  createdAt: row.createdAt,
  product: {
    id: row.productId,
    title: row.productTitle,
    price: Number(row.productPrice || 0),
    imageUrl: row.productImage,
    status: row.productStatus
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
  }
});

const offerListSelect = `
  o.id,
  o.offer_price AS offerPrice,
  o.note,
  o.status,
  o.created_at AS createdAt,
  p.id AS productId,
  p.title AS productTitle,
  p.price AS productPrice,
  p.image_url AS productImage,
  p.status AS productStatus,
  buyer.id AS buyerId,
  buyer.full_name AS buyerName,
  buyer.avatar_url AS buyerAvatar,
  seller.id AS sellerId,
  seller.full_name AS sellerName,
  seller.avatar_url AS sellerAvatar
`;

const createOffer = async (buyerId, payload) => {
  const [products] = await pool.query(
    `SELECT
      p.id,
      p.title,
      p.price,
      p.status,
      p.seller_id AS sellerId,
      u.is_suspended AS sellerSuspended
     FROM products p
     INNER JOIN users u ON u.id = p.seller_id
     WHERE p.id = ? AND p.deleted_at IS NULL
     LIMIT 1`,
    [payload.productId]
  );

  if (!products.length) {
    throw new ApiError(404, "Produk tidak ditemukan.");
  }

  const product = products[0];

  if (product.status !== "active") {
    throw new ApiError(422, "Produk tidak tersedia untuk ditawar.");
  }

  if (product.sellerId === buyerId) {
    throw new ApiError(422, "Anda tidak bisa menawar produk milik sendiri.");
  }

  if (product.sellerSuspended) {
    throw new ApiError(422, "Seller sedang disuspend.");
  }

  const [existingOffers] = await pool.query(
    "SELECT id FROM offers WHERE product_id = ? AND buyer_id = ? AND status = 'pending' LIMIT 1",
    [payload.productId, buyerId]
  );

  if (existingOffers.length) {
    throw new ApiError(409, "Masih ada tawaran pending untuk produk ini.");
  }

  const [result] = await pool.query(
    `INSERT INTO offers (product_id, buyer_id, seller_id, offer_price, note, status)
     VALUES (?, ?, ?, ?, ?, 'pending')`,
    [payload.productId, buyerId, product.sellerId, payload.offerPrice, payload.note || null]
  );

  const offer = await getOfferById(result.insertId);
  await createNotification({
    userId: product.sellerId,
    type: "offer",
    title: "Tawaran baru masuk",
    body: `Produk ${product.title} ditawar Rp${Number(payload.offerPrice).toLocaleString("id-ID")}.`,
    actionUrl: "/dashboard/offers"
  });

  return offer;
};

const getOfferById = async (offerId) => {
  const [rows] = await pool.query(
    `SELECT ${offerListSelect}
     FROM offers o
     INNER JOIN products p ON p.id = o.product_id
     INNER JOIN users buyer ON buyer.id = o.buyer_id
     INNER JOIN users seller ON seller.id = o.seller_id
     WHERE o.id = ?
     LIMIT 1`,
    [offerId]
  );

  return rows.length ? formatOffer(rows[0]) : null;
};

const getIncomingOffers = async (sellerId) => {
  const [rows] = await pool.query(
    `SELECT ${offerListSelect}
     FROM offers o
     INNER JOIN products p ON p.id = o.product_id
     INNER JOIN users buyer ON buyer.id = o.buyer_id
     INNER JOIN users seller ON seller.id = o.seller_id
     WHERE o.seller_id = ?
     ORDER BY FIELD(o.status, 'pending', 'accepted', 'rejected', 'auto_rejected'), o.created_at DESC`,
    [sellerId]
  );

  return rows.map(formatOffer);
};

const getMyOffers = async (buyerId) => {
  const [rows] = await pool.query(
    `SELECT ${offerListSelect}
     FROM offers o
     INNER JOIN products p ON p.id = o.product_id
     INNER JOIN users buyer ON buyer.id = o.buyer_id
     INNER JOIN users seller ON seller.id = o.seller_id
     WHERE o.buyer_id = ?
     ORDER BY o.created_at DESC`,
    [buyerId]
  );

  return rows.map(formatOffer);
};

const acceptOffer = async (offerId, sellerId) => {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const [offers] = await connection.query(
      `SELECT
        o.id,
        o.product_id AS productId,
        o.buyer_id AS buyerId,
        o.seller_id AS sellerId,
        o.offer_price AS offerPrice,
        o.status AS offerStatus,
        p.status AS productStatus,
        p.deleted_at AS deletedAt
       FROM offers o
       INNER JOIN products p ON p.id = o.product_id
       WHERE o.id = ? AND o.seller_id = ?
       LIMIT 1
       FOR UPDATE`,
      [offerId, sellerId]
    );

    if (!offers.length) {
      throw new ApiError(404, "Tawaran tidak ditemukan.");
    }

    const offer = offers[0];

    if (offer.offerStatus !== "pending") {
      throw new ApiError(422, "Tawaran ini sudah diproses.");
    }

    if (offer.deletedAt || offer.productStatus !== "active") {
      throw new ApiError(422, "Produk sudah tidak tersedia.");
    }

    await connection.query("UPDATE offers SET status = 'accepted' WHERE id = ?", [offerId]);
    await connection.query(
      `UPDATE offers
       SET status = 'auto_rejected'
       WHERE product_id = ? AND id <> ? AND status = 'pending'`,
      [offer.productId, offerId]
    );
    await connection.query(
      "UPDATE products SET status = 'sold', sold_at = NOW() WHERE id = ?",
      [offer.productId]
    );

    const [transactionResult] = await connection.query(
      `INSERT INTO transactions (offer_id, product_id, buyer_id, seller_id, final_price, status)
       VALUES (?, ?, ?, ?, ?, 'pending_meetup')`,
      [offerId, offer.productId, offer.buyerId, offer.sellerId, offer.offerPrice]
    );

    await connection.commit();

    await createNotification({
      userId: offer.buyerId,
      type: "offer_accepted",
      title: "Tawaran Anda diterima",
      body: "Transaksi escrow otomatis sudah dibuat.",
      actionUrl: "/dashboard/transactions"
    });

    return {
      offer: await getOfferById(offerId),
      transactionId: transactionResult.insertId
    };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

const rejectOffer = async (offerId, sellerId) => {
  const [result] = await pool.query(
    `UPDATE offers
     SET status = 'rejected'
     WHERE id = ? AND seller_id = ? AND status = 'pending'`,
    [offerId, sellerId]
  );

  if (!result.affectedRows) {
    throw new ApiError(404, "Tawaran tidak ditemukan atau sudah diproses.");
  }

  const offer = await getOfferById(offerId);
  await createNotification({
    userId: offer.buyer.id,
    type: "offer_rejected",
    title: "Tawaran ditolak",
    body: `Tawaran untuk ${offer.product.title} ditolak seller.`,
    actionUrl: "/dashboard/offers"
  });

  return offer;
};

module.exports = {
  acceptOffer,
  createOffer,
  getIncomingOffers,
  getMyOffers,
  rejectOffer
};
