const EventEmitter = require("events");
const { pool } = require("../config/database");
const ApiError = require("../utils/ApiError");
const { createNotification } = require("./notificationService");
const { verifyToken } = require("../utils/jwt");

const chatEvents = new EventEmitter();
chatEvents.setMaxListeners(200);

const formatConversation = (row, userId) => {
  const isBuyer = row.buyerId === userId;

  return {
    id: row.id,
    lastMessageAt: row.lastMessageAt,
    unreadCount: Number(row.unreadCount || 0),
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
      : { id: row.buyerId, fullName: row.buyerName, avatarUrl: row.buyerAvatar, role: "buyer" }
  };
};

const formatMessage = (row) => ({
  id: row.id,
  conversationId: row.conversationId,
  senderId: row.senderId,
  body: row.body,
  readAt: row.readAt,
  createdAt: row.createdAt
});

const getConversationById = async (conversationId, userId) => {
  const [rows] = await pool.query(
    `SELECT
      c.id,
      c.last_message_at AS lastMessageAt,
      c.product_id AS productId,
      c.buyer_id AS buyerId,
      c.seller_id AS sellerId,
      p.title AS productTitle,
      p.image_url AS productImage,
      buyer.full_name AS buyerName,
      buyer.avatar_url AS buyerAvatar,
      seller.full_name AS sellerName,
      seller.avatar_url AS sellerAvatar,
      (SELECT COUNT(*) FROM messages m WHERE m.conversation_id = c.id AND m.sender_id <> ? AND m.read_at IS NULL) AS unreadCount
     FROM conversations c
     INNER JOIN products p ON p.id = c.product_id
     INNER JOIN users buyer ON buyer.id = c.buyer_id
     INNER JOIN users seller ON seller.id = c.seller_id
     WHERE c.id = ? AND (c.buyer_id = ? OR c.seller_id = ?)
     LIMIT 1`,
    [userId, conversationId, userId, userId]
  );

  return rows.length ? formatConversation(rows[0], userId) : null;
};

const getConversations = async (userId) => {
  const [rows] = await pool.query(
    `SELECT
      c.id,
      c.last_message_at AS lastMessageAt,
      c.product_id AS productId,
      c.buyer_id AS buyerId,
      c.seller_id AS sellerId,
      p.title AS productTitle,
      p.image_url AS productImage,
      buyer.full_name AS buyerName,
      buyer.avatar_url AS buyerAvatar,
      seller.full_name AS sellerName,
      seller.avatar_url AS sellerAvatar,
      (SELECT COUNT(*) FROM messages m WHERE m.conversation_id = c.id AND m.sender_id <> ? AND m.read_at IS NULL) AS unreadCount
     FROM conversations c
     INNER JOIN products p ON p.id = c.product_id
     INNER JOIN users buyer ON buyer.id = c.buyer_id
     INNER JOIN users seller ON seller.id = c.seller_id
     WHERE c.buyer_id = ? OR c.seller_id = ?
     ORDER BY c.last_message_at DESC, c.created_at DESC
     LIMIT 100`,
    [userId, userId, userId]
  );

  return rows.map((row) => formatConversation(row, userId));
};

const getMessages = async (conversationId, userId) => {
  const conversation = await getConversationById(conversationId, userId);

  if (!conversation) {
    throw new ApiError(404, "Percakapan tidak ditemukan.");
  }

  await pool.query(
    "UPDATE messages SET read_at = COALESCE(read_at, NOW()) WHERE conversation_id = ? AND sender_id <> ?",
    [conversationId, userId]
  );

  const [rows] = await pool.query(
    `SELECT
      id,
      conversation_id AS conversationId,
      sender_id AS senderId,
      body,
      read_at AS readAt,
      created_at AS createdAt
     FROM messages
     WHERE conversation_id = ?
     ORDER BY created_at ASC
     LIMIT 200`,
    [conversationId]
  );

  return rows.map(formatMessage);
};

const startConversation = async (buyerId, payload) => {
  const [products] = await pool.query(
    `SELECT id, seller_id AS sellerId, title, status
     FROM products
     WHERE id = ? AND deleted_at IS NULL
     LIMIT 1`,
    [payload.productId]
  );

  if (!products.length) {
    throw new ApiError(404, "Produk tidak ditemukan.");
  }

  const product = products[0];

  if (product.sellerId === buyerId) {
    throw new ApiError(422, "Tidak bisa membuka chat dengan produk sendiri.");
  }

  const [result] = await pool.query(
    `INSERT INTO conversations (product_id, buyer_id, seller_id, last_message_at)
     VALUES (?, ?, ?, NOW())
     ON DUPLICATE KEY UPDATE last_message_at = NOW(), id = LAST_INSERT_ID(id)`,
    [payload.productId, buyerId, product.sellerId]
  );

  const message = await sendMessage(result.insertId, buyerId, payload.message, false);

  await createNotification({
    userId: product.sellerId,
    type: "chat",
    title: "Pesan baru dari calon pembeli",
    body: message.body,
    actionUrl: "/dashboard/chat"
  });

  return {
    conversation: await getConversationById(result.insertId, buyerId),
    message
  };
};

const sendMessage = async (conversationId, senderId, message, shouldNotify = true) => {
  const conversation = await getConversationById(conversationId, senderId);

  if (!conversation) {
    throw new ApiError(404, "Percakapan tidak ditemukan.");
  }

  const recipientId = conversation.buyer.id === senderId ? conversation.seller.id : conversation.buyer.id;

  const [result] = await pool.query(
    `INSERT INTO messages (conversation_id, sender_id, body)
     VALUES (?, ?, ?)`,
    [conversationId, senderId, message]
  );

  await pool.query("UPDATE conversations SET last_message_at = NOW() WHERE id = ?", [conversationId]);

  const [rows] = await pool.query(
    `SELECT id, conversation_id AS conversationId, sender_id AS senderId, body, read_at AS readAt, created_at AS createdAt
     FROM messages
     WHERE id = ?
     LIMIT 1`,
    [result.insertId]
  );

  const createdMessage = formatMessage(rows[0]);
  chatEvents.emit(`chat:${recipientId}`, createdMessage);
  chatEvents.emit(`chat:${senderId}`, createdMessage);

  if (shouldNotify) {
    await createNotification({
      userId: recipientId,
      type: "chat",
      title: "Pesan chat baru",
      body: createdMessage.body,
      actionUrl: "/dashboard/chat"
    });
  }

  return createdMessage;
};

const getStreamUser = async (token) => {
  if (!token) {
    throw new ApiError(401, "Token stream tidak ditemukan.");
  }

  const payload = verifyToken(token);
  const [rows] = await pool.query("SELECT id, is_suspended AS isSuspended FROM users WHERE id = ? LIMIT 1", [
    payload.sub
  ]);

  if (!rows.length || rows[0].isSuspended) {
    throw new ApiError(401, "User stream tidak valid.");
  }

  return rows[0];
};

module.exports = {
  chatEvents,
  getConversations,
  getMessages,
  getStreamUser,
  sendMessage,
  startConversation
};
