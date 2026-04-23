const asyncHandler = require("../utils/asyncHandler");
const reportService = require("../services/reportService");

const createReport = asyncHandler(async (req, res) => {
  const report = await reportService.createReport(req.user.id, req.body);

  res.status(201).json({
    success: true,
    message: "Laporan berhasil dikirim untuk ditinjau admin.",
    data: { report }
  });
});

module.exports = { createReport };
