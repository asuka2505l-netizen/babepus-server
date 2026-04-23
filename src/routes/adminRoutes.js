const router = require("express").Router();
const adminController = require("../controllers/adminController");
const { authMiddleware } = require("../middlewares/authMiddleware");
const requireRole = require("../middlewares/requireRole");
const validateRequest = require("../middlewares/validateRequest");
const { idParam } = require("../validators/sharedValidators");
const {
  adminListValidator,
  suspendUserValidator,
  updateReportStatusValidator
} = require("../validators/adminValidators");

router.use(authMiddleware, requireRole("admin"));
router.get("/dashboard", adminController.getDashboard);
router.get("/users", adminListValidator, validateRequest, adminController.getUsers);
router.patch("/users/:id/suspend", idParam("id"), suspendUserValidator, validateRequest, adminController.suspendUser);
router.get("/products", adminController.getProducts);
router.get("/reports", adminController.getReports);
router.patch("/reports/:id/status", idParam("id"), updateReportStatusValidator, validateRequest, adminController.updateReportStatus);

module.exports = router;
