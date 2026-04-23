const router = require("express").Router();
const productController = require("../controllers/productController");
const { authMiddleware, optionalAuthMiddleware } = require("../middlewares/authMiddleware");
const { productImageUpload } = require("../middlewares/uploadMiddleware");
const validateRequest = require("../middlewares/validateRequest");
const { idParam, paginationQuery } = require("../validators/sharedValidators");
const {
  productListValidator,
  productPayloadValidator,
  productUpdateValidator
} = require("../validators/productValidators");

router.get("/", optionalAuthMiddleware, productListValidator, paginationQuery, validateRequest, productController.listProducts);
router.get("/search", optionalAuthMiddleware, productListValidator, paginationQuery, validateRequest, productController.searchProducts);
router.get("/mine", authMiddleware, productController.getMyProducts);
router.get("/:id", optionalAuthMiddleware, idParam("id"), validateRequest, productController.getProduct);
router.post("/", authMiddleware, productImageUpload, productPayloadValidator, validateRequest, productController.createProduct);
router.put("/:id", authMiddleware, productImageUpload, idParam("id"), productUpdateValidator, validateRequest, productController.updateProduct);
router.patch("/:id/sold", authMiddleware, idParam("id"), validateRequest, productController.markProductSold);
router.delete("/:id", authMiddleware, idParam("id"), validateRequest, productController.deleteProduct);

module.exports = router;
