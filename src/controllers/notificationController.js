const asyncHandler = require("../utils/asyncHandler");
const notificationService = require("../services/notificationService");

const getNotifications = asyncHandler(async (req, res) => {
  const data = await notificationService.getNotifications(req.user.id);

  res.json({
    success: true,
    data
  });
});

const markAsRead = asyncHandler(async (req, res) => {
  const notification = await notificationService.markAsRead(req.params.id, req.user.id);

  res.json({
    success: true,
    data: { notification }
  });
});

const markAllAsRead = asyncHandler(async (req, res) => {
  const data = await notificationService.markAllAsRead(req.user.id);

  res.json({
    success: true,
    data
  });
});

const streamNotifications = asyncHandler(async (req, res) => {
  const user = await notificationService.getStreamUser(req.query.token);

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders?.();

  const send = (notification) => {
    res.write(`event: notification\n`);
    res.write(`data: ${JSON.stringify(notification)}\n\n`);
  };

  const keepAlive = setInterval(() => {
    res.write(`event: ping\n`);
    res.write(`data: {}\n\n`);
  }, 25000);

  notificationService.notificationEvents.on(`notification:${user.id}`, send);

  req.on("close", () => {
    clearInterval(keepAlive);
    notificationService.notificationEvents.off(`notification:${user.id}`, send);
  });
});

module.exports = { getNotifications, markAllAsRead, markAsRead, streamNotifications };
