const { body, query } = require("express-validator");
const { REPORT_STATUSES } = require("../config/constants");

const suspendUserValidator = [
  body("isSuspended").isBoolean().withMessage("Status suspend harus boolean.").toBoolean()
];

const updateReportStatusValidator = [
  body("status").isIn(REPORT_STATUSES.filter((status) => status !== "pending")).withMessage("Status laporan tidak valid."),
  body("adminNote").optional({ checkFalsy: true }).trim().isLength({ max: 500 }).withMessage("Catatan admin maksimal 500 karakter.")
];

const adminListValidator = [
  query("search").optional({ checkFalsy: true }).trim().isLength({ max: 120 }).withMessage("Pencarian terlalu panjang."),
  query("status").optional({ checkFalsy: true }).trim().isLength({ max: 40 }).withMessage("Status tidak valid.")
];

module.exports = { adminListValidator, suspendUserValidator, updateReportStatusValidator };
