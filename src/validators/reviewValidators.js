const { body } = require("express-validator");

const createReviewValidator = [
  body("transactionId").isInt({ min: 1 }).withMessage("Transaksi tidak valid.").toInt(),
  body("rating").isInt({ min: 1, max: 5 }).withMessage("Rating harus 1 sampai 5.").toInt(),
  body("communicationRating").optional({ checkFalsy: true }).isInt({ min: 1, max: 5 }).withMessage("Rating komunikasi harus 1 sampai 5.").toInt(),
  body("itemAccuracyRating").optional({ checkFalsy: true }).isInt({ min: 1, max: 5 }).withMessage("Rating akurasi barang harus 1 sampai 5.").toInt(),
  body("meetupRating").optional({ checkFalsy: true }).isInt({ min: 1, max: 5 }).withMessage("Rating meetup harus 1 sampai 5.").toInt(),
  body("tags").optional().isArray({ max: 8 }).withMessage("Tag review maksimal 8 item."),
  body("tags.*").optional().trim().isLength({ min: 2, max: 40 }).withMessage("Tag review 2-40 karakter."),
  body("isAnonymous").optional().isBoolean().withMessage("Anonymous harus boolean.").toBoolean(),
  body("comment").optional({ checkFalsy: true }).trim().isLength({ max: 1000 }).withMessage("Komentar maksimal 1000 karakter.")
];

module.exports = { createReviewValidator };
