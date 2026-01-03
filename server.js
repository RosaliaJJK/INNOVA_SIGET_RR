const express = require("express");
const mysql = require("mysql2");
const session = require("express-session");
const path = require("path");
const http = require("http");

/* =========================
   APP
========================= */
const app = express();

/* =========================
   BD
========================= */
const db = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT
});

(async () => {
  try {
    const conn = await db.getConnection();
    console.log("✅ MySQL conectado");
    conn.release();
  } catch (err) {
    console.error("❌ Error MySQL:", err.message);
  }
})();


/* =========================
   SERVER + SOCKET.IO
========================= */
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);

app.set("io", io);

/* =========================
   CIERRE AUTOMÁTICO DE CLASE ⏰
========================= */
setInterval(() => {
  db.query(
    `UPDATE clases
     SET estado = 'CERRADA'
     WHERE estado = 'ACTIVA'
     AND hora_fin < CURTIME()`,
    err => {
      if (!err) {
        io.emit("clase_cerrada");
      }
    }
  );
}, 60000);

/* =========================
   MIDDLEWARES
========================= */
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));

app.use(
  session({
    secret: "innova_siget_secret",
    resave: false,
    saveUninitialized: false
  })
);

/* =========================
   VISTAS
========================= */
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

/* =========================
   INYECTAR DB EN REQ (UNA SOLA VEZ)
========================= */
app.use((req, res, next) => {
  req.db = db;
  next();
});

/* =========================
   RUTAS
========================= */
app.use("/auth", require("./routes/auth"));
app.use("/alumno", require("./routes/alumno"));
app.use("/docente", require("./routes/docente"));
app.use("/personal", require("./routes/personal"));
app.use("/api", require("./routes/api"));

app.get("/", (req, res) => {
  res.render("login");
});

app.get("/recuperar-contrasena", (req, res) => {
  res.render("recuperar-contrasena", {
    error: null,
    success: null
  });
});

/* =========================
   SOCKET.IO
========================= */
io.on("connection", socket => {
  db.query(
    `SELECT id FROM clases WHERE estado='ACTIVA' LIMIT 1`,
    (err, rows) => {
      if (err) return;

      socket.emit("estado_clase", {
        activa: rows.length > 0
      });
    }
  );
});

/* =========================
   SERVIDOR
========================= */
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log("🚀 Servidor corriendo en puerto", PORT);
});
