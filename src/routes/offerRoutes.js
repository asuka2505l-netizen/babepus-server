const router = require("express").Router();
const offerController = require("../controllers/offerController");
const { authMiddleware } = require("../middlewares/authMiddleware");
const validateRequest = require("../middlewares/validateRequest");
const { idParam } = require("../validators/sharedValidators");
const { createOfferValidator } = require("../validators/offerValidators");

router.use(authMiddleware);
router.post("/", createOfferValidator, validateRequest, offerController.createOffer);
router.get("/incoming", offerController.getIncomingOffers);
router.get("/my", offerController.getMyOffers);
router.patch("/:id/accept", idParam("id"), validateRequest, offerController.acceptOffer);
router.patch("/:id/reject", idParam("id"), validateRequest, offerController.rejectOffer);

module.exports = router;
