const express = require("express");
const router = express.Router();

const auth = require("../middleware/authMiddleware");
const upload = require("../middleware/uploadMiddleware");

const {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  searchProducts
} = require("../controllers/productController");

router.get("/", getProducts);
router.get("/search", searchProducts);
router.get("/:id", getProductById);

router.post(
  "/",
  auth,
  upload.single("foto"),
  createProduct
);

router.put(
  "/:id",
  auth,
  upload.single("foto"),
  updateProduct
);

router.delete("/:id", auth, deleteProduct);

module.exports = router;