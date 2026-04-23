const router = require("express").Router();
const transactionController = require("../controllers/transactionController");
const { authMiddleware } = require("../middlewares/authMiddleware");
const validateRequest = require("../middlewares/validateRequest");
const { completeTransactionValidator } = require("../validators/transactionValidators");

router.use(authMiddleware);
router.get("/my", transactionController.getMyTransactions);
router.patch("/:id/complete", completeTransactionValidator, validateRequest, transactionController.completeTransaction);
router.patch("/:id/escrow/buyer-confirm", completeTransactionValidator, validateRequest, transactionController.confirmBuyer);
router.patch("/:id/escrow/seller-confirm", completeTransactionValidator, validateRequest, transactionController.confirmSeller);
router.patch("/:id/escrow/dispute", completeTransactionValidator, validateRequest, transactionController.disputeEscrow);

module.exports = router;
