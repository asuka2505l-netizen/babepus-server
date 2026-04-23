const { body } = require("express-validator");

const updateProfileValidator = [
  body("fullName").optional().trim().isLength({ min: 3, max: 100 }).withMessage("Nama lengkap minimal 3 karakter."),
  body("phone").optional({ checkFalsy: true }).trim().isLength({ min: 8, max: 20 }).withMessage("Nomor HP tidak valid."),
  body("campus").optional().trim().isLength({ min: 2, max: 120 }).withMessage("Nama kampus wajib diisi."),
  body("faculty").optional({ checkFalsy: true }).trim().isLength({ max: 120 }).withMessage("Fakultas terlalu panjang."),
  body("studyProgram").optional({ checkFalsy: true }).trim().isLength({ max: 120 }).withMessage("Program studi terlalu panjang."),
  body("bio").optional({ checkFalsy: true }).trim().isLength({ max: 500 }).withMessage("Bio maksimal 500 karakter.")
];

module.exports = { updateProfileValidator };
