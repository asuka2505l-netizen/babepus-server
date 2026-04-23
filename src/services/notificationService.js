const EventEmitter = require("events");
const { pool } = require("../config/database");
const ApiError = require("../utils/ApiError");
const { verifyToken } = require("../utils/jwt");

const notificationEvents = new EventEmitter();
notificationEvents.setMaxListeners(200);

const formatNotification = (row) => ({
  id: row.id,
  type: row.type,
  title: row.title,
  body: row.body,
  actionUrl: row.actionUrl,
  readAt: row.readAt,
  createdAt: row.createdAt
});

const createNotification = async ({ userId, type, title, body, actionUrl = null }) => {
  if (!userId) {
    return null;
  }

  const [result] = await pool.query(
    `INSERT INTO notifications (user_id, type, title, body, action_url)
     VALUES (?, ?, ?, ?, ?)`,
    [userId, type, title, body, actionUrl]
  );

  const notification = await getNotificationById(result.insertId, userId);
  notificationEvents.emit(`notification:${userId}`, notification);

  return notification;
};

const getNotificationById = async (notificationId, userId) => {
  const [rows] = await pool.query(
    `SELECT id, type, title, body, action_url AS actionUrl, read_at AS readAt, created_at AS createdAt
     FROM notifications
     WHERE id = ? AND user_id = ?
     LIMIT 1`,
    [notificationId, userId]
  );

  return rows.length ? formatNotification(rows[0]) : null;
};

const getNotifications = async (userId) => {
  const [rows] = await pool.query(
    `SELECT id, type, title, body, action_url AS actionUrl, read_at AS readAt, created_at AS createdAt
     FROM notifications
     WHERE user_id = ?
     ORDER BY created_at DESC
     LIMIT 50`,
    [userId]
  );

  const notifications = rows.map(formatNotification);
  const unreadCount = notifications.filter((notification) => !notification.readAt).length;

  return { notifications, unreadCount };
};

const markAsRead = async (notificationId, userId) => {
  const [result] = await pool.query(
    `UPDATE notifications
     SET read_at = COALESCE(read_at, NOW())
     WHERE id = ? AND user_id = ?`,
    [notificationId, userId]
  );

  if (!result.affectedRows) {
    throw new ApiError(404, "Notifikasi tidak ditemukan.");
  }

  return getNotificationById(notificationId, userId);
};

const markAllAsRead = async (userId) => {
  await pool.query(
    `UPDATE notifications
     SET read_at = COALESCE(read_at, NOW())
     WHERE user_id = ? AND read_at IS NULL`,
    [userId]
  );

  return getNotifications(userId);
};

const getStreamUser = async (token) => {
  if (!token) {
    throw new ApiError(401, "Token stream tidak ditemukan.");
  }

  const payload = verifyToken(token);
  const [rows] = await pool.query(
    "SELECT id, is_suspended AS isSuspended FROM users WHERE id = ? LIMIT 1",
    [payload.sub]
  );

  if (!rows.length || rows[0].isSuspended) {
    throw new ApiError(401, "User stream tidak valid.");
  }

  return rows[0];
};

module.exports = {
  createNotification,
  getNotifications,
  getStreamUser,
  markAllAsRead,
  markAsRead,
  notificationEvents
};
