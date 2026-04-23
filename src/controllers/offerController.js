const asyncHandler = require("../utils/asyncHandler");
const offerService = require("../services/offerService");

const createOffer = asyncHandler(async (req, res) => {
  const offer = await offerService.createOffer(req.user.id, req.body);

  res.status(201).json({
    success: true,
    message: "Tawaran berhasil dikirim.",
    data: { offer }
  });
});

const getIncomingOffers = asyncHandler(async (req, res) => {
  const offers = await offerService.getIncomingOffers(req.user.id);

  res.json({
    success: true,
    data: { offers }
  });
});

const getMyOffers = asyncHandler(async (req, res) => {
  const offers = await offerService.getMyOffers(req.user.id);

  res.json({
    success: true,
    data: { offers }
  });
});

const acceptOffer = asyncHandler(async (req, res) => {
  const data = await offerService.acceptOffer(req.params.id, req.user.id);

  res.json({
    success: true,
    message: "Tawaran diterima dan transaksi otomatis dibuat.",
    data
  });
});

const rejectOffer = asyncHandler(async (req, res) => {
  const offer = await offerService.rejectOffer(req.params.id, req.user.id);

  res.json({
    success: true,
    message: "Tawaran berhasil ditolak.",
    data: { offer }
  });
});

module.exports = { acceptOffer, createOffer, getIncomingOffers, getMyOffers, rejectOffer };
