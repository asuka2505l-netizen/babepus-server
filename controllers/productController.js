const db = require("../config/db");

// GET ALL
exports.getProducts = (req, res) => {
  db.query(
    "SELECT * FROM products ORDER BY product_id DESC",
    (err, result) => {
      if (err) return res.status(500).json(err);
      res.json(result);
    }
  );
};

// GET BY ID
exports.getProductById = (req, res) => {
  db.query(
    "SELECT * FROM products WHERE product_id = ?",
    [req.params.id],
    (err, result) => {
      if (err) return res.status(500).json(err);
      res.json(result[0]);
    }
  );
};

// CREATE
exports.createProduct = (req, res) => {
  const {
    category_id,
    nama_barang,
    deskripsi,
    harga,
    kondisi
  } = req.body;

  const user_id = req.user.user_id;

    const foto = req.file ? req.file.filename : null;

  db.query(
    `INSERT INTO products 
    (user_id, category_id, nama_barang, deskripsi, harga, kondisi, foto)
    VALUES (?,?,?,?,?,?,?)`,
    [
      user_id,
      category_id,
      nama_barang,
      deskripsi,
      harga,
      kondisi,
      foto
    ],
    (err, result) => {
      if (err) return res.status(500).json(err);

      res.json({
        message: "Barang berhasil ditambahkan",
        foto
      });
    }
  );
};

// UPDATE
exports.updateProduct = (req, res) => {
  const {
    category_id,
    nama_barang,
    deskripsi,
    harga,
    kondisi
  } = req.body;
    const foto = req.file ? req.file.filename : null;
  
    db.query(
    `UPDATE products SET
    category_id=?,
    nama_barang=?,
    deskripsi=?,
    harga=?,
    kondisi=?,
    foto=IFNULL(?,foto)
    WHERE product_id=?`,
    [
      category_id,
      nama_barang,
      deskripsi,
      harga,
      kondisi,
      foto,
      req.params.id
    ],
    (err, result) => {
      if (err) return res.status(500).json(err);

      res.json({
        message: "Barang berhasil diupdate"
      });
    }
  );
};

// DELETE
exports.deleteProduct = (req, res) => {
  db.query(
    "DELETE FROM products WHERE product_id=?",
    [req.params.id],
    (err, result) => {
      if (err) return res.status(500).json(err);

      res.json({
        message: "Barang berhasil dihapus"
      });
    }
  );
};

//SearchProducts
exports.searchProducts = (req, res) => {
  let {
    keyword,
    category,
    min,
    max,
    kondisi,
    sort
  } = req.query;

  let sql = `
    SELECT * FROM products
    WHERE status = 'tersedia'
  `;

  let values = [];

  if (keyword) {
    sql += " AND nama_barang LIKE ?";
    values.push("%" + keyword + "%");
  }

  if (category) {
    sql += " AND category_id = ?";
    values.push(category);
  }

  if (min) {
    sql += " AND harga >= ?";
    values.push(min);
  }

  if (max) {
    sql += " AND harga <= ?";
    values.push(max);
  }

  if (kondisi) {
    sql += " AND kondisi = ?";
    values.push(kondisi);
  }

  // sorting
  if (sort === "murah") {
    sql += " ORDER BY harga ASC";
  } else if (sort === "mahal") {
    sql += " ORDER BY harga DESC";
  } else {
    sql += " ORDER BY product_id DESC";
  }

  db.query(sql, values, (err, result) => {
    if (err) return res.status(500).json(err);

    res.json(result);
  });
};