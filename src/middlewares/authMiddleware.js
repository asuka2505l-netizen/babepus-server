const { pool } = require("../config/database");
const ApiError = require("../utils/ApiError");
const { verifyToken } = require("../utils/jwt");

const getBearerToken = (authorizationHeader = "") => {
  const [scheme, token] = authorizationHeader.split(" ");
  return scheme === "Bearer" && token ? token : null;
};

const authMiddleware = async (req, _res, next) => {
  try {
    const token = getBearerToken(req.headers.authorization);

    if (!token) {
      throw new ApiError(401, "Token autentikasi tidak ditemukan.");
    }

    const payload = verifyToken(token);
    const [rows] = await pool.query(
      `SELECT
        id,
        full_name AS fullName,
        email,
        phone,
        campus,
        faculty,
        study_program AS studyProgram,
        student_id AS studentId,
        campus_email AS campusEmail,
        role,
        avatar_url AS avatarUrl,
        bio,
        rating_average AS ratingAverage,
        rating_count AS ratingCount,
        is_suspended AS isSuspended,
        verification_status AS verificationStatus,
        email_verified_at AS emailVerifiedAt,
        created_at AS createdAt
      FROM users
      WHERE id = ?
      LIMIT 1`,
      [payload.sub]
    );

    if (!rows.length) {
      throw new ApiError(401, "Akun tidak ditemukan.");
    }

    if (rows[0].isSuspended) {
      throw new ApiError(403, "Akun sedang disuspend oleh admin.");
    }

    req.user = rows[0];
    return next();
  } catch (error) {
    return next(error.name === "JsonWebTokenError" ? new ApiError(401, "Token tidak valid.") : error);
  }
};

const optionalAuthMiddleware = async (req, _res, next) => {
  const token = getBearerToken(req.headers.authorization);

  if (!token) {
    return next();
  }

  try {
    const payload = verifyToken(token);
    const [rows] = await pool.query(
      "SELECT id, role, is_suspended AS isSuspended FROM users WHERE id = ? LIMIT 1",
      [payload.sub]
    );

    if (rows.length && !rows[0].isSuspended) {
      req.user = rows[0];
    }

    return next();
  } catch (_error) {
    return next();
  }
};

module.exports = { authMiddleware, optionalAuthMiddleware };
