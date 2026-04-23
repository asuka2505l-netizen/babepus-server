const dotenv = require("dotenv");

dotenv.config();

const env = {
  NODE_ENV: process.env.NODE_ENV || "development",
  PORT: Number(process.env.PORT || 5000),
  CLIENT_URL: process.env.CLIENT_URL || "http://localhost:5173",
  DB_HOST: process.env.DB_HOST || "127.0.0.1",
  DB_PORT: Number(process.env.DB_PORT || 3306),
  DB_USER: process.env.DB_USER || "root",
  DB_PASSWORD: process.env.DB_PASSWORD ?? process.env.DB_PASS ?? "",
  DB_NAME: process.env.DB_NAME || "babepus",
  JWT_SECRET: process.env.JWT_SECRET || "development_secret_change_me",
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || "7d",
  UPLOAD_MAX_FILE_SIZE: Number(process.env.UPLOAD_MAX_FILE_SIZE || 5 * 1024 * 1024)
};

if (env.NODE_ENV === "production" && env.JWT_SECRET === "development_secret_change_me") {
  throw new Error("JWT_SECRET wajib diganti untuk production.");
}

module.exports = { env };
