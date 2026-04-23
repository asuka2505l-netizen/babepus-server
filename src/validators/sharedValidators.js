const { param, query } = require("express-validator");

const idParam = (name = "id") =>
  param(name).isInt({ min: 1 }).withMessage("ID tidak valid.").toInt();

const paginationQuery = [
  query("page").optional().isInt({ min: 1 }).withMessage("Page harus angka positif.").toInt(),
  query("limit").optional().isInt({ min: 1, max: 50 }).withMessage("Limit maksimal 50.").toInt()
];

module.exports = { idParam, paginationQuery };
