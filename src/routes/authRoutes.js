const router = require("express").Router();
const authController = require("../controllers/authController");
const { authMiddleware } = require("../middlewares/authMiddleware");
const validateRequest = require("../middlewares/validateRequest");
const { loginValidator, registerValidator, verifyEmailValidator } = require("../validators/authValidators");

router.post("/register", registerValidator, validateRequest, authController.register);
router.post("/login", loginValidator, validateRequest, authController.login);
router.get("/me", authMiddleware, authController.me);
router.post("/email-verification/request", authMiddleware, authController.requestEmailVerification);
router.post("/email-verification/verify", verifyEmailValidator, validateRequest, authController.verifyEmail);

module.exports = router;
