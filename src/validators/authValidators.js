const { body } = require("express-validator");

const registerValidator = [
  body("fullName").trim().isLength({ min: 3, max: 100 }).withMessage("Nama lengkap minimal 3 karakter."),
  body("email").trim().isEmail().withMessage("Email tidak valid.").normalizeEmail(),
  body("password").isLength({ min: 8 }).withMessage("Password minimal 8 karakter."),
  body("phone").optional({ checkFalsy: true }).trim().isLength({ min: 8, max: 20 }).withMessage("Nomor HP tidak valid."),
  body("campus").trim().isLength({ min: 2, max: 120 }).withMessage("Nama kampus wajib diisi."),
  body("faculty").optional({ checkFalsy: true }).trim().isLength({ max: 120 }).withMessage("Fakultas terlalu panjang."),
  body("studyProgram").optional({ checkFalsy: true }).trim().isLength({ max: 120 }).withMessage("Program studi terlalu panjang."),
  body("studentId").optional({ checkFalsy: true }).trim().isLength({ max: 40 }).withMessage("NIM terlalu panjang."),
  body("campusEmail").optional({ checkFalsy: true }).trim().isEmail().withMessage("Email kampus tidak valid.").normalizeEmail()
];

const loginValidator = [
  body("email").trim().isEmail().withMessage("Email tidak valid.").normalizeEmail(),
  body("password").notEmpty().withMessage("Password wajib diisi.")
];

const verifyEmailValidator = [
  body("token").trim().isLength({ min: 20, max: 120 }).withMessage("Token verifikasi tidak valid.")
];

module.exports = { loginValidator, registerValidator, verifyEmailValidator };
