const mysql = require("mysql2");

const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "",
  database: "babepus",
  port: 3306
});

db.connect((err) => {
  if (err) {
    console.log("Database gagal connect");
  } else {
    console.log("MariaDB connected");
  }
});

module.exports = db;