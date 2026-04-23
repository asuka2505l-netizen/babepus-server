const { body } = require("express-validator");
const { idParam } = require("./sharedValidators");

const startConversationValidator = [
  body("productId").isInt({ min: 1 }).withMessage("Produk tidak valid.").toInt(),
  body("message").trim().isLength({ min: 1, max: 2000 }).withMessage("Pesan wajib 1-2000 karakter.")
];

const sendMessageValidator = [
  idParam("id"),
  body("message").trim().isLength({ min: 1, max: 2000 }).withMessage("Pesan wajib 1-2000 karakter.")
];

module.exports = { sendMessageValidator, startConversationValidator };
