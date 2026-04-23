const asyncHandler = require("../utils/asyncHandler");
const authService = require("../services/authService");

const register = asyncHandler(async (req, res) => {
  const data = await authService.register(req.body);

  res.status(201).json({
    success: true,
    message: "Registrasi berhasil.",
    data
  });
});

const login = asyncHandler(async (req, res) => {
  const data = await authService.login(req.body);

  res.json({
    success: true,
    message: "Login berhasil.",
    data
  });
});

const me = asyncHandler(async (req, res) => {
  const user = await authService.findUserById(req.user.id);

  res.json({
    success: true,
    data: { user }
  });
});

const requestEmailVerification = asyncHandler(async (req, res) => {
  const emailVerification = await authService.requestEmailVerification(req.user.id);

  res.json({
    success: true,
    message: emailVerification.alreadyVerified
      ? "Email sudah terverifikasi."
      : "Token verifikasi email pribadi berhasil dibuat.",
    data: { emailVerification }
  });
});

const verifyEmail = asyncHandler(async (req, res) => {
  const user = await authService.verifyEmail(req.body.token);

  res.json({
    success: true,
    message: "Email pribadi berhasil diverifikasi.",
    data: { user }
  });
});

module.exports = { login, me, register, requestEmailVerification, verifyEmail };
