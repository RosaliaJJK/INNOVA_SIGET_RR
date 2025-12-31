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

