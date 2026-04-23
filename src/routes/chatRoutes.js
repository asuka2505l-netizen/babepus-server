const router = require("express").Router();
const chatController = require("../controllers/chatController");
const { authMiddleware } = require("../middlewares/authMiddleware");
const validateRequest = require("../middlewares/validateRequest");
const { idParam } = require("../validators/sharedValidators");
const { sendMessageValidator, startConversationValidator } = require("../validators/chatValidators");

router.get("/stream", chatController.streamChat);
router.get("/conversations", authMiddleware, chatController.getConversations);
router.post("/conversations", authMiddleware, startConversationValidator, validateRequest, chatController.startConversation);
router.get("/conversations/:id/messages", authMiddleware, idParam("id"), validateRequest, chatController.getMessages);
router.post("/conversations/:id/messages", authMiddleware, sendMessageValidator, validateRequest, chatController.sendMessage);

module.exports = router;
