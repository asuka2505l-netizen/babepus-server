const router = require("express").Router();
const wishlistController = require("../controllers/wishlistController");
const { authMiddleware } = require("../middlewares/authMiddleware");
const validateRequest = require("../middlewares/validateRequest");
const { wishlistProductValidator } = require("../validators/wishlistValidators");

router.use(authMiddleware);
router.get("/", wishlistController.getWishlist);
router.post("/:productId", wishlistProductValidator, validateRequest, wishlistController.addToWishlist);
router.delete("/:productId", wishlistProductValidator, validateRequest, wishlistController.removeFromWishlist);

module.exports = router;
