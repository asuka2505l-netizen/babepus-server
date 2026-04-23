const { body } = require("express-validator");
const { REPORT_TARGETS } = require("../config/constants");

const createReportValidator = [
  body("targetType").isIn(REPORT_TARGETS).withMessage("Target laporan tidak valid."),
  body("targetProductId")
    .if(body("targetType").equals("product"))
    .isInt({ min: 1 })
    .withMessage("Produk yang dilaporkan tidak valid.")
    .toInt(),
  body("targetUserId")
    .if(body("targetType").equals("user"))
    .isInt({ min: 1 })
    .withMessage("User yang dilaporkan tidak valid.")
    .toInt(),
  body("reason").trim().isLength({ min: 5, max: 160 }).withMessage("Alasan laporan 5-160 karakter."),
  body("details").optional({ checkFalsy: true }).trim().isLength({ max: 1000 }).withMessage("Detail laporan maksimal 1000 karakter.")
];

module.exports = { createReportValidator };
