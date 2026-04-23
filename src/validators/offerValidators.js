const { body } = require("express-validator");

const createOfferValidator = [
  body("productId").isInt({ min: 1 }).withMessage("Produk tidak valid.").toInt(),
  body("offerPrice").isFloat({ min: 1000 }).withMessage("Nominal tawaran minimal Rp1.000.").toFloat(),
  body("note").optional({ checkFalsy: true }).trim().isLength({ max: 500 }).withMessage("Catatan maksimal 500 karakter.")
];

module.exports = { createOfferValidator };
