const express = require("express");
const mysql = require("mysql2");
const session = require("express-session");
const path = require("path");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

/* =========================
   ESTADO GLOBAL
========================= */
let claseActiva = false;
let infoClase = null;
let alumnosConectados = [];

app.set("io", io);

/* =========================
   MIDDLEWARES
========================= */
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));

/* =========================
   SESIONES
========================= */
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
   BD
========================= */
const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT
});

db.connect(err => {
  if (err) console.error("❌ Error MySQL:", err);
  else console.log("✅ MySQL conectado");
});

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
  console.log("🟢 Cliente conectado:", socket.id);

  socket.emit("estado_clase", {
    activa: claseActiva,
    info: infoClase
  });

  socket.on("alumno_conectado", alumno => {
    if (!claseActiva) return;

    alumnosConectados.push(alumno);
    io.emit("alumnos_en_linea", alumnosConectados);
  });

  socket.on("disconnect", () => {
    console.log("🔴 Cliente desconectado");
  });
});

/* =========================
   SERVIDOR
========================= */
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log("🚀 Servidor corriendo en puerto", PORT);
});
