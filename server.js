const express = require('express');
const mysql = require('mysql2');
const session = require('express-session');
const path = require('path');

const app = express();

/* =========================
   MIDDLEWARES
========================= */
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

/* =========================
   SESIONES
========================= */
app.use(session({
  secret: 'innova_siget_secret',
  resave: false,
  saveUninitialized: false
}));

/* =========================
   VISTAS
========================= */
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

/* =========================
   BD
========================= */
const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT,
  //waitForConnections: true,
  //connectionLimit: 10
});

db.connect(err => {
  if (err) console.error('❌ Error MySQL:', err);
  else console.log('✅ MySQL conectado');
});

/* 👉 INYECTAR DB */
app.use((req, res, next) => {
  req.db = db;
  next();
});

/* =========================
   RUTAS
========================= */
app.use('/auth', require('./routes/auth'));
app.use('/alumno', require('./routes/alumno'));
app.use('/docente', require('./routes/docente'));
app.use('/personal', require('./routes/personal'));

/* =========================
   LOGIN
========================= */
app.get('/', (req, res) => {
  res.render('login');
});

/* =========================
   SERVIDOR
========================= */
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("Servidor corriendo en puerto", PORT);
});

