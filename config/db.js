const mysql = require("mysql2/promise");

const pool = mysql.createPool({
  host: 'shortline.proxy.rlwy.net',
  port: 28959,
  user: 'root',
  password: 'bnDkixOQGBHdOUbZnrbXsgiePjvfJBxa',
  database: 'railway'
});

module.exports = pool;
