const multer = require("multer");
const ApiError = require("../utils/ApiError");
const { env } = require("../config/env");

const errorHandler = (error, _req, res, _next) => {
  let normalizedError = error;

  if (error instanceof multer.MulterError) {
    normalizedError = new ApiError(
      error.code === "LIMIT_FILE_SIZE" ? 413 : 400,
      error.code === "LIMIT_FILE_SIZE" ? "Ukuran gambar terlalu besar." : "Upload gambar gagal."
    );
  }

  if (error && error.code === "ER_DUP_ENTRY") {
    normalizedError = new ApiError(409, "Data yang sama sudah terdaftar.");
  }

  const statusCode = normalizedError.statusCode || 500;
  const response = {
    success: false,
    message: normalizedError.message || "Terjadi kesalahan pada server."
  };

  if (normalizedError.details) {
    response.errors = normalizedError.details;
  }

  if (env.NODE_ENV !== "production" && statusCode >= 500) {
    response.stack = normalizedError.stack;
  }

  res.status(statusCode).json(response);
};

module.exports = errorHandler;
