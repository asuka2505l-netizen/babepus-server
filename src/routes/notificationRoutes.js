const router = require("express").Router();
const notificationController = require("../controllers/notificationController");
const { authMiddleware } = require("../middlewares/authMiddleware");
const validateRequest = require("../middlewares/validateRequest");
const { notificationIdValidator } = require("../validators/notificationValidators");

router.get("/stream", notificationController.streamNotifications);
router.get("/", authMiddleware, notificationController.getNotifications);
router.patch("/read-all", authMiddleware, notificationController.markAllAsRead);
router.patch("/:id/read", authMiddleware, notificationIdValidator, validateRequest, notificationController.markAsRead);

module.exports = router;
