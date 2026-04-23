const asyncHandler = require("../utils/asyncHandler");
const ApiError = require("../utils/ApiError");
const userService = require("../services/userService");
const { getUploadUrl } = require("../utils/file");

const getDashboardSummary = asyncHandler(async (req, res) => {
  const data = await userService.getDashboardSummary(req.user.id);

  res.json({
    success: true,
    data
  });
});

const updateProfile = asyncHandler(async (req, res) => {
  const user = await userService.updateProfile(req.user.id, req.body);

  res.json({
    success: true,
    message: "Profil berhasil diperbarui.",
    data: { user }
  });
});

const getSellerAnalytics = asyncHandler(async (req, res) => {
  const analytics = await userService.getSellerAnalytics(req.user.id);

  res.json({
    success: true,
    data: { analytics }
  });
});

const uploadAvatar = asyncHandler(async (req, res) => {
  if (!req.file) {
    throw new ApiError(422, "Avatar wajib diunggah.");
  }

  const user = await userService.updateAvatar(req.user.id, getUploadUrl(req.file.filename));

  res.json({
    success: true,
    message: "Avatar berhasil diperbarui.",
    data: { user }
  });
});

module.exports = { getDashboardSummary, getSellerAnalytics, updateProfile, uploadAvatar };
