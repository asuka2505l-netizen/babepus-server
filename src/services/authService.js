const { pool } = require("../config/database");
const crypto = require("crypto");
const ApiError = require("../utils/ApiError");
const { comparePassword, hashPassword } = require("../utils/password");
const { signToken } = require("../utils/jwt");

const userSelect = `
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
  created_at AS createdAt,
  updated_at AS updatedAt
`;

const serializeUser = (row) => ({
  id: row.id,
  fullName: row.fullName,
  email: row.email,
  phone: row.phone,
  campus: row.campus,
  faculty: row.faculty,
  studyProgram: row.studyProgram,
  studentId: row.studentId,
  campusEmail: row.campusEmail,
  role: row.role,
  avatarUrl: row.avatarUrl,
  bio: row.bio,
  ratingAverage: Number(row.ratingAverage || 0),
  ratingCount: Number(row.ratingCount || 0),
  isSuspended: Boolean(row.isSuspended),
  verificationStatus: row.verificationStatus,
  emailVerifiedAt: row.emailVerifiedAt,
  isEmailVerified: Boolean(row.emailVerifiedAt),
  createdAt: row.createdAt,
  updatedAt: row.updatedAt
});

const findUserById = async (userId) => {
  const [rows] = await pool.query(`SELECT ${userSelect} FROM users WHERE id = ? LIMIT 1`, [userId]);
  return rows.length ? serializeUser(rows[0]) : null;
};

const generateEmailVerificationToken = () => crypto.randomBytes(32).toString("hex");

const register = async (payload) => {
  const [existingUsers] = await pool.query("SELECT id FROM users WHERE email = ? LIMIT 1", [payload.email]);

  if (existingUsers.length) {
    throw new ApiError(409, "Email sudah terdaftar.");
  }

  const passwordHash = await hashPassword(payload.password);
  const verificationToken = generateEmailVerificationToken();
  const verificationExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const [result] = await connection.query(
      `INSERT INTO users
        (full_name, email, password_hash, phone, campus, faculty, study_program, student_id, campus_email, role, verification_status, email_verification_token, email_verification_expires_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'user', 'pending', ?, ?)`,
      [
        payload.fullName,
        payload.email,
        passwordHash,
        payload.phone || null,
        payload.campus,
        payload.faculty || null,
        payload.studyProgram || null,
        payload.studentId || null,
        payload.campusEmail || payload.email,
        verificationToken,
        verificationExpiresAt
      ]
    );

    await connection.query(
      `INSERT INTO verifications
        (user_id, document_type, document_number, campus_email, status)
       VALUES (?, 'student_id', ?, ?, 'pending')`,
      [result.insertId, payload.studentId || null, payload.campusEmail || payload.email]
    );

    await connection.commit();

    const user = await findUserById(result.insertId);
    const token = signToken({ sub: user.id, role: user.role });

    return {
      token,
      user,
      emailVerification: {
        token: verificationToken,
        expiresAt: verificationExpiresAt
      }
    };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

const login = async ({ email, password }) => {
  const [rows] = await pool.query(
    `SELECT ${userSelect}, password_hash AS passwordHash FROM users WHERE email = ? LIMIT 1`,
    [email]
  );

  if (!rows.length) {
    throw new ApiError(401, "Email atau password salah.");
  }

  if (rows[0].isSuspended) {
    throw new ApiError(403, "Akun sedang disuspend oleh admin.");
  }

  const isPasswordValid = await comparePassword(password, rows[0].passwordHash);

  if (!isPasswordValid) {
    throw new ApiError(401, "Email atau password salah.");
  }

  const user = serializeUser(rows[0]);
  const token = signToken({ sub: user.id, role: user.role });

  return { token, user };
};

const requestEmailVerification = async (userId) => {
  const user = await findUserById(userId);

  if (!user) {
    throw new ApiError(404, "User tidak ditemukan.");
  }

  if (user.isEmailVerified) {
    return { alreadyVerified: true, token: null, expiresAt: null };
  }

  const token = generateEmailVerificationToken();
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

  await pool.query(
    `UPDATE users
     SET email_verification_token = ?, email_verification_expires_at = ?
     WHERE id = ?`,
    [token, expiresAt, userId]
  );

  return { alreadyVerified: false, token, expiresAt };
};

const verifyEmail = async (token) => {
  const [rows] = await pool.query(
    `SELECT id
     FROM users
     WHERE email_verification_token = ?
       AND email_verification_expires_at > NOW()
     LIMIT 1`,
    [token]
  );

  if (!rows.length) {
    throw new ApiError(422, "Token verifikasi email tidak valid atau sudah kedaluwarsa.");
  }

  await pool.query(
    `UPDATE users
     SET
      email_verified_at = NOW(),
      verification_status = 'verified',
      email_verification_token = NULL,
      email_verification_expires_at = NULL
     WHERE id = ?`,
    [rows[0].id]
  );

  return findUserById(rows[0].id);
};

module.exports = {
  findUserById,
  login,
  register,
  requestEmailVerification,
  serializeUser,
  userSelect,
  verifyEmail
};
