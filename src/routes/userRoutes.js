const router = require("express").Router();
const userController = require("../controllers/userController");
const { authMiddleware } = require("../middlewares/authMiddleware");
const validateRequest = require("../middlewares/validateRequest");
const { avatarUpload } = require("../middlewares/uploadMiddleware");
const { updateProfileValidator } = require("../validators/userValidators");

router.use(authMiddleware);
router.get("/dashboard", userController.getDashboardSummary);
router.get("/analytics", userController.getSellerAnalytics);
router.put("/profile", updateProfileValidator, validateRequest, userController.updateProfile);
router.patch("/avatar", avatarUpload, userController.uploadAvatar);

module.exports = router;
