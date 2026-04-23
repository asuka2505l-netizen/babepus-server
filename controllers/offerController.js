const db = require("../config/db");

// pembeli tawar
exports.createOffer = (req, res) => {
  const buyer_id = req.user.user_id;

  const {
    product_id,
    harga_tawaran
  } = req.body;

  db.query(
    `INSERT INTO offers
    (product_id,buyer_id,harga_tawaran)
    VALUES (?,?,?)`,
    [
      product_id,
      buyer_id,
      harga_tawaran
    ],
    (err) => {
      if (err) return res.status(500).json(err);

      res.json({
        message: "Tawaran berhasil dikirim"
      });
    }
  );
};

// tawaran saya
exports.getMyOffers = (req, res) => {
  db.query(
    `SELECT * FROM offers
     WHERE buyer_id=?`,
    [req.user.user_id],
    (err, result) => {
      res.json(result);
    }
  );
};

// tawaran masuk ke penjual
exports.getOffersForSeller = (req, res) => {
  db.query(
    `
    SELECT offers.*, products.nama_barang
    FROM offers
    JOIN products
    ON offers.product_id = products.product_id
    WHERE products.user_id = ?
    `,
    [req.user.user_id],
    (err, result) => {
      res.json(result);
    }
  );
};

// Terima dan tolak
exports.updateOfferStatus = (req, res) => {
  const { status_offer } = req.body;
  const offer_id = req.params.id;

  if (status_offer === "diterima") {

    db.query(
      `SELECT * FROM offers
       WHERE offer_id=?`,
      [offer_id],
      (err, offerData) => {

        const offer = offerData[0];

        db.query(
          `SELECT * FROM products
           WHERE product_id=?`,
          [offer.product_id],
          (err, productData) => {

            const product = productData[0];

            // update offer diterima
            db.query(
              `UPDATE offers
               SET status_offer='diterima'
               WHERE offer_id=?`,
              [offer_id]
            );

            // offer lain ditolak
            db.query(
              `UPDATE offers
               SET status_offer='ditolak'
               WHERE product_id=?
               AND offer_id != ?`,
              [
                offer.product_id,
                offer_id
              ]
            );

            // produk terjual
            db.query(
              `UPDATE products
               SET status='terjual'
               WHERE product_id=?`,
              [offer.product_id]
            );

            // buat transaksi
            db.query(
              `INSERT INTO transactions
              (
                product_id,
                seller_id,
                buyer_id,
                offer_id,
                total_harga,
                metode_bayar,
                status_transaksi
              )
              VALUES (?,?,?,?,?,?,?)`,
              [
                offer.product_id,
                product.user_id,
                offer.buyer_id,
                offer.offer_id,
                offer.harga_tawaran,
                "cod",
                "pending"
              ],
              (err) => {
                if (err)
                  return res
                    .status(500)
                    .json(err);

                res.json({
                  message:
                    "Tawaran diterima & transaksi dibuat"
                });
              }
            );

          }
        );

      }
    );

  } else {

    db.query(
      `UPDATE offers
       SET status_offer='ditolak'
       WHERE offer_id=?`,
      [offer_id],
      () => {
        res.json({
          message:
            "Tawaran ditolak"
        });
      }
    );

  }
};