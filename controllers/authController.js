const db = require("../config/db");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
require("dotenv").config();

// REGISTER
exports.register = (req, res) => {
  const { nama, email, password } = req.body;

  if (!nama || !email || !password) {
    return res.status(400).json({
      message: "Semua field wajib diisi"
    });
  }

  db.query(
    "SELECT * FROM users WHERE email = ?",
    [email],
    async (err, result) => {
      if (result.length > 0) {
        return res.status(400).json({
          message: "Email sudah terdaftar"
        });
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      db.query(
        "INSERT INTO users (nama,email,password) VALUES (?,?,?)",
        [nama, email, hashedPassword],
        (err, insertResult) => {
          if (err) {
            return res.status(500).json(err);
          }

          res.json({
            message: "Register berhasil"
          });
        }
      );
    }
  );
};

// LOGIN
exports.login = (req, res) => {
  const { email, password } = req.body;

  db.query(
    "SELECT * FROM users WHERE email = ?",
    [email],
    async (err, result) => {
      if (result.length === 0) {
        return res.status(404).json({
          message: "Email tidak ditemukan"
        });
      }

      const user = result[0];

      const validPassword = await bcrypt.compare(
        password,
        user.password
      );

      if (!validPassword) {
        return res.status(401).json({
          message: "Password salah"
        });
      }

      const token = jwt.sign(
        {
          user_id: user.user_id,
          role: user.role
        },
        process.env.JWT_SECRET,
        { expiresIn: "1d" }
      );

      res.json({
        message: "Login berhasil",
        token,
        user: {
          id: user.user_id,
          nama: user.nama,
          email: user.email,
          role: user.role
        }
      });
    }
  );
};