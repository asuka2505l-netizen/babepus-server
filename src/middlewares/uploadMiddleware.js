const fs = require("fs");
const path = require("path");
const multer = require("multer");
const ApiError = require("../utils/ApiError");
const { env } = require("../config/env");

const uploadsPath = path.resolve(__dirname, "../../uploads");

if (!fs.existsSync(uploadsPath)) {
  fs.mkdirSync(uploadsPath, { recursive: true });
}

const allowedMimeTypes = ["image/jpeg", "image/png", "image/webp"];

const storage = multer.diskStorage({
  destination: (_req, _file, callback) => callback(null, uploadsPath),
  filename: (_req, file, callback) => {
    const extension = path.extname(file.originalname).toLowerCase();
    const safeName = `${file.fieldname}-${Date.now()}-${Math.round(Math.random() * 1e9)}${extension}`;
    callback(null, safeName);
  }
});

const fileFilter = (_req, file, callback) => {
  if (!allowedMimeTypes.includes(file.mimetype)) {
    return callback(new ApiError(415, "Format gambar harus JPG, PNG, atau WEBP."));
  }

  return callback(null, true);
};

const imageUpload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: env.UPLOAD_MAX_FILE_SIZE
  }
});

module.exports = {
  avatarUpload: imageUpload.single("avatar"),
  productImageUpload: imageUpload.single("image")
};
