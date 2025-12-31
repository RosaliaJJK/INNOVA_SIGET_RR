const express = require('express');
const bcrypt = require('bcryptjs');
const router = express.Router();

router.get('/logout', (req, res) => {
  req.session.destroy(err => {
    if (err) {
      console.error('Error al cerrar sesión:', err);
      return res.redirect('/');
    }

    res.clearCookie('connect.sid');
    res.redirect('/');
  });
});


/* =========================
   LISTAS BLANCAS
========================= */
const PERSONAL_ADMIN = [
  'direccion@teschi.edu.mx',
  'personalinnova013@gmail.com'
];

const MANTENIMIENTO = [
  'ciencias_basicas@teschi.edu.mx',
  'mantenimientoinnova088@gmail.com'
];

const DOCENTES_ESPECIALES = [
  'docenteinnova074@gmail.com'
];

/* =========================
   DETECTAR ROL
========================= */
function detectarRol(email) {
  email = email.toLowerCase().trim();

  if (MANTENIMIENTO.includes(email)) return 'TECNICO';
  if (PERSONAL_ADMIN.includes(email)) return 'PERSONAL';
  if (DOCENTES_ESPECIALES.includes(email)) return 'DOCENTE';

  if (/^[0-9]{10}@teschi\.edu\.mx$/.test(email)) return 'ALUMNO';
  if (/^[a-z]+@teschi\.edu\.mx$/.test(email)) return 'DOCENTE';
  if (/^[a-z0-9]+@teschi\.edu\.mx$/.test(email)) return 'PERSONAL';

  return null;
}

/* =========================
   REGISTRO
========================= */
router.post('/register', async (req, res) => {
  try {
    const { nombre, email, password } = req.body;
    const db = req.db;

    if (!nombre || !email || !password) {
      return res.status(400).json({ message: 'Faltan datos' });
    }

    const rol = detectarRol(email);
    if (!rol) {
      return res.status(403).json({ message: 'Correo no autorizado' });
    }

    const hash = await bcrypt.hash(password, 10);

    db.query(
      'INSERT INTO usuarios (nombre, email, rol, password) VALUES (?, ?, ?, ?)',
      [nombre, email, rol, hash],
      err => {
        if (err) {
          console.error(err);
          if (err.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ message: 'Este correo ya está registrado' });
          }
          return res.status(500).json({ message: 'Error al registrar usuario' });
        }

        res.status(200).json({ message: 'Registro exitoso. Ahora inicia sesión' });
      }
    );
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error servidor' });
  }
});

/* =========================
   LOGIN
========================= */
router.post('/login', (req, res) => {
  const { email, password } = req.body;
  const db = req.db;

  db.query(
    'SELECT * FROM usuarios WHERE email = ?',
    [email],
    async (err, results) => {
      if (err) return res.status(500).json({ message: 'Error servidor' });

      if (results.length === 0) {
        return res.status(401).json({ message: 'Credenciales incorrectas' });
      }

      const user = results[0];
      const ok = await bcrypt.compare(password, user.password);

      if (!ok) {
        return res.status(401).json({ message: 'Credenciales incorrectas' });
      }

      req.session.user = {
        id: user.id,
        nombre: user.nombre,
        rol: user.rol
      };

      res.json({ rol: user.rol });
    }
  );
});

module.exports = router;
