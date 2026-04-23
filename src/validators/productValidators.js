const { body, query } = require("express-validator");
const { CONDITION_LABELS } = require("../config/constants");

const productPayloadValidator = [
  body("title").trim().isLength({ min: 5, max: 140 }).withMessage("Judul produk 5-140 karakter."),
  body("description").trim().isLength({ min: 20, max: 3000 }).withMessage("Deskripsi produk minimal 20 karakter."),
  body("categoryId").isInt({ min: 1 }).withMessage("Kategori wajib dipilih.").toInt(),
  body("price").isFloat({ min: 1000 }).withMessage("Harga minimal Rp1.000.").toFloat(),
  body("conditionLabel").isIn(CONDITION_LABELS).withMessage("Kondisi barang tidak valid."),
  body("campusLocation").trim().isLength({ min: 2, max: 160 }).withMessage("Lokasi kampus wajib diisi."),
  body("faculty").optional({ checkFalsy: true }).trim().isLength({ max: 120 }).withMessage("Fakultas terlalu panjang.")
];

const productUpdateValidator = [
  body("title").optional().trim().isLength({ min: 5, max: 140 }).withMessage("Judul produk 5-140 karakter."),
  body("description").optional().trim().isLength({ min: 20, max: 3000 }).withMessage("Deskripsi produk minimal 20 karakter."),
  body("categoryId").optional().isInt({ min: 1 }).withMessage("Kategori tidak valid.").toInt(),
  body("price").optional().isFloat({ min: 1000 }).withMessage("Harga minimal Rp1.000.").toFloat(),
  body("conditionLabel").optional().isIn(CONDITION_LABELS).withMessage("Kondisi barang tidak valid."),
  body("campusLocation").optional().trim().isLength({ min: 2, max: 160 }).withMessage("Lokasi kampus wajib diisi."),
  body("faculty").optional({ checkFalsy: true }).trim().isLength({ max: 120 }).withMessage("Fakultas terlalu panjang.")
];

const productListValidator = [
  query("search").optional({ checkFalsy: true }).trim().isLength({ max: 120 }).withMessage("Pencarian terlalu panjang."),
  query("categoryId").optional({ checkFalsy: true }).isInt({ min: 1 }).withMessage("Kategori tidak valid.").toInt(),
  query("minPrice").optional({ checkFalsy: true }).isFloat({ min: 0 }).withMessage("Harga minimal tidak valid.").toFloat(),
  query("maxPrice").optional({ checkFalsy: true }).isFloat({ min: 0 }).withMessage("Harga maksimal tidak valid.").toFloat(),
  query("faculty").optional({ checkFalsy: true }).trim().isLength({ max: 120 }).withMessage("Fakultas terlalu panjang."),
  query("sort").optional({ checkFalsy: true }).isIn(["latest", "oldest", "price_asc", "price_desc"]).withMessage("Sort tidak valid.")
];

module.exports = { productListValidator, productPayloadValidator, productUpdateValidator };
