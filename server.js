require('dotenv').config();

const express = require('express');
const session = require('express-session');
const path = require('path');

const db = require('./config/db'); // 👈 USAMOS EL POOL

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
   PROBAR DB
========================= */
(async () => {
  try {
    const conn = await db.getConnection();
    console.log('✅ MySQL conectado');
    conn.release();
  } catch (err) {
    console.error('❌ Error MySQL:', err.message);
  }
})();

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
  console.log('🚀 Servidor corriendo en puerto', PORT);
});
