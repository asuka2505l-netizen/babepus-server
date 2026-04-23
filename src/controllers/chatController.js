const asyncHandler = require("../utils/asyncHandler");
const chatService = require("../services/chatService");

const getConversations = asyncHandler(async (req, res) => {
  const conversations = await chatService.getConversations(req.user.id);

  res.json({
    success: true,
    data: { conversations }
  });
});

const getMessages = asyncHandler(async (req, res) => {
  const messages = await chatService.getMessages(req.params.id, req.user.id);

  res.json({
    success: true,
    data: { messages }
  });
});

const startConversation = asyncHandler(async (req, res) => {
  const data = await chatService.startConversation(req.user.id, req.body);

  res.status(201).json({
    success: true,
    message: "Chat berhasil dimulai.",
    data
  });
});

const sendMessage = asyncHandler(async (req, res) => {
  const message = await chatService.sendMessage(req.params.id, req.user.id, req.body.message);

  res.status(201).json({
    success: true,
    data: { message }
  });
});

const streamChat = asyncHandler(async (req, res) => {
  const user = await chatService.getStreamUser(req.query.token);

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders?.();

  const send = (message) => {
    res.write(`event: message\n`);
    res.write(`data: ${JSON.stringify(message)}\n\n`);
  };

  const keepAlive = setInterval(() => {
    res.write(`event: ping\n`);
    res.write(`data: {}\n\n`);
  }, 25000);

  chatService.chatEvents.on(`chat:${user.id}`, send);

  req.on("close", () => {
    clearInterval(keepAlive);
    chatService.chatEvents.off(`chat:${user.id}`, send);
  });
});

module.exports = { getConversations, getMessages, sendMessage, startConversation, streamChat };
