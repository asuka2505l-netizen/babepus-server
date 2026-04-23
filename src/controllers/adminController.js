const asyncHandler = require("../utils/asyncHandler");
const adminService = require("../services/adminService");

const getDashboard = asyncHandler(async (_req, res) => {
  const stats = await adminService.getDashboardStats();

  res.json({
    success: true,
    data: { stats }
  });
});

const getUsers = asyncHandler(async (req, res) => {
  const users = await adminService.getUsers(req.query);

  res.json({
    success: true,
    data: { users }
  });
});

const suspendUser = asyncHandler(async (req, res) => {
  const user = await adminService.suspendUser(req.user.id, req.params.id, req.body.isSuspended);

  res.json({
    success: true,
    message: req.body.isSuspended ? "User berhasil disuspend." : "Suspend user berhasil dibuka.",
    data: { user }
  });
});

const getProducts = asyncHandler(async (_req, res) => {
  const products = await adminService.getProducts();

  res.json({
    success: true,
    data: { products }
  });
});

const getReports = asyncHandler(async (_req, res) => {
  const reports = await adminService.getReports();

  res.json({
    success: true,
    data: { reports }
  });
});

const updateReportStatus = asyncHandler(async (req, res) => {
  const report = await adminService.updateReportStatus(req.user.id, req.params.id, req.body);

  res.json({
    success: true,
    message: "Status laporan berhasil diperbarui.",
    data: { report }
  });
});

module.exports = {
  getDashboard,
  getProducts,
  getReports,
  getUsers,
  suspendUser,
  updateReportStatus
};
