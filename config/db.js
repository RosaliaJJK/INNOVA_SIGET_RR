const mysql = require("mysql2/promise");

const pool = mysql.createPool({
  host: "shortline.proxy.rlwy.net",
  user: "root",
  password: "bnDkixOQGBHdOUbZnrbXsgiePjvfJBxa",
  database: "railway",
  port: 28959,
  waitForConnections: true,
  connectionLimit: 10
});

module.exports = pool;
