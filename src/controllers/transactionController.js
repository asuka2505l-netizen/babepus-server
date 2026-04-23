const asyncHandler = require("../utils/asyncHandler");
const transactionService = require("../services/transactionService");

const getMyTransactions = asyncHandler(async (req, res) => {
  const transactions = await transactionService.getMyTransactions(req.user.id);

  res.json({
    success: true,
    data: { transactions }
  });
});

const completeTransaction = asyncHandler(async (req, res) => {
  const transaction = await transactionService.completeTransaction(req.params.id, req.user.id);

  res.json({
    success: true,
    message: "Transaksi berhasil diselesaikan.",
    data: { transaction }
  });
});

const confirmBuyer = asyncHandler(async (req, res) => {
  const transaction = await transactionService.confirmEscrow(req.params.id, req.user.id, "buyer");

  res.json({
    success: true,
    message: "Konfirmasi pembeli berhasil disimpan.",
    data: { transaction }
  });
});

const confirmSeller = asyncHandler(async (req, res) => {
  const transaction = await transactionService.confirmEscrow(req.params.id, req.user.id, "seller");

  res.json({
    success: true,
    message: "Konfirmasi seller berhasil disimpan.",
    data: { transaction }
  });
});

const disputeEscrow = asyncHandler(async (req, res) => {
  const transaction = await transactionService.disputeEscrow(req.params.id, req.user.id, req.body.note);

  res.json({
    success: true,
    message: "Dispute escrow berhasil dibuat.",
    data: { transaction }
  });
});

module.exports = { completeTransaction, confirmBuyer, confirmSeller, disputeEscrow, getMyTransactions };
