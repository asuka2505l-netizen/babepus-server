const express =
require("express");

const router =
express.Router();

const auth =
require("../middleware/authMiddleware");

const db =
require("../config/db");

router.get(
 "/my",
 auth,
 (req,res)=>{

  db.query(
   `
   SELECT transactions.*,
   products.nama_barang
   FROM transactions
   JOIN products
   ON transactions.product_id =
   products.product_id
   WHERE buyer_id=?
   `,
   [req.user.user_id],
   (err,result)=>{
    res.json(result);
   }
  );

 }
);

module.exports = router;