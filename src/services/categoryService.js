const { pool } = require("../config/database");

const getCategories = async () => {
  const [rows] = await pool.query(
    `SELECT id, name, slug, created_at AS createdAt
     FROM categories
     ORDER BY name ASC`
  );

  return rows;
};

module.exports = { getCategories };
