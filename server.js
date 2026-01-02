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

db.getConnection(err => {
  if (err) console.error("❌ Error MySQL:", err);
  else console.log("✅ MySQL conectado");
});

// Guardar DB en app
app.set("db", db);

/* =========================
   SERVER + SOCKET
========================= */
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);

// Guardar io en app
app.set("io", io);

/* =========================
   CIERRE AUTOMÁTICO ⏰
========================= */
setInterval(() => {
  db.query(
    `UPDATE clases_activas 
     SET estatus='CERRADA'
     WHERE estatus='ABIERTA'
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
   INYECTAR DB EN REQ
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

app.get("/", (req, res) => {
  res.render("login");
});

/* =========================
   SOCKET.IO
========================= */
io.on("connection", socket => {
  db.query(
    "SELECT * FROM clases_activas WHERE estatus='ABIERTA' ORDER BY id DESC LIMIT 1",
    (err, rows) => {
      if (err) {
        console.error("❌ Error consulta:", err);
        return;
      }

      if (rows.length > 0) {
        socket.emit("estado_clase", {
          activa: true,
          info: rows[0]
        });
      } else {
        socket.emit("estado_clase", {
          activa: false
        });
      }
    }
  );
});
/* ========================
   SERVIDOR
========================= */
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log("🚀 Servidor corriendo en puerto", PORT);
});
