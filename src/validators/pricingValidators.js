const { body } = require("express-validator");
const { CONDITION_LABELS } = require("../config/constants");

const pricingEstimateValidator = [
  body("categoryId").isInt({ min: 1 }).withMessage("Kategori wajib dipilih.").toInt(),
  body("originalPrice").isFloat({ min: 1000 }).withMessage("Harga beli awal minimal Rp1.000.").toFloat(),
  body("conditionLabel").isIn(CONDITION_LABELS).withMessage("Kondisi barang tidak valid."),
  body("ageMonths").optional({ checkFalsy: true }).isInt({ min: 0, max: 240 }).withMessage("Umur barang maksimal 240 bulan.").toInt(),
  body("includesBox").optional().isBoolean().withMessage("Kelengkapan box harus boolean.").toBoolean(),
  body("urgency").optional({ checkFalsy: true }).isIn(["low", "normal", "high"]).withMessage("Urgensi tidak valid.")
];

module.exports = { pricingEstimateValidator };
