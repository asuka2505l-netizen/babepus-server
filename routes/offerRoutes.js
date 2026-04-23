const express = require("express");
const router = express.Router();

const auth = require("../middleware/authMiddleware");

const {
  createOffer,
  getMyOffers,
  getOffersForSeller,
  updateOfferStatus
} = require("../controllers/offerController");

router.post("/", auth, createOffer);

router.get("/buyer", auth, getMyOffers);

router.get("/seller", auth, getOffersForSeller);

router.put("/:id", auth, updateOfferStatus);

module.exports = router;