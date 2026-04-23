const router = require("express").Router();
const reportController = require("../controllers/reportController");
const { authMiddleware } = require("../middlewares/authMiddleware");
const validateRequest = require("../middlewares/validateRequest");
const { createReportValidator } = require("../validators/reportValidators");

router.post("/", authMiddleware, createReportValidator, validateRequest, reportController.createReport);

module.exports = router;
