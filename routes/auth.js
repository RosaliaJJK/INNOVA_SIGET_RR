const express = require('express');
const bcrypt = require('bcryptjs');
const router = express.Router();

/* =========================
   LOGOUT
========================= */
router.get('/logout', (req, res) => {
  req.session.destroy(() => {
    res.clearCookie('connect.sid');
    return res.status(200).json({ message: 'Sesión cerrada correctamente' });
  });
});

/* =========================
   LISTAS BLANCAS
========================= */
const PERSONAL_ADMIN = [
  'direccion@teschi.edu.mx',
  'direcciondeplaneacionyvinculacion@teschi.edu.mx',
  'direccionacademica@teschi.edu.mx',
  'posgradoeinvestigacion@teschi.edu.mx',
  'subvinculacion@teschi.edu.mx',
  'subservicios@teschi.edu.mx',
  'subdireccionplaneacion@teschi.edu.mx',
  'ingenieria@teschi.edu.mx',
  'ing.quimica@teschi.edu.mx',
  'animaciondigital@teschi.edu.mx',
  'sistemasteschi@teschi.edu.mx',
  'licadministracion@teschi.edu.mx',
  'departamentoposgradoinvestigacion@teschi.edu.mx',
  'serviciosocial@teschi.edu.mx',
  'departamentovinculacion@teschi.edu.mx',
  'evaluacion@teschi.edu.mx',
  'planeacion@teschi.edu.mx',
  'recursosmateriales@teschi.edu.mx',
  'recursosfinancieros@teschi.edu.mx',
  'recursoshumanos@teschi.edu.mx',
  'desarrolloacademico@teschi.edu.mx',
  'area.juridica@teschi.edu.mx',
  'ing_mecatronica@teschi.edu.mx',
  'gastronomia@teschi.edu.mx',
  'controlescolar@teschi.edu.mx',
  'subacademica@teschi.edu.mx',
  'difusion@teschi.edu.mx',
  'oic@teschi.edu.mx',
  'centrodeidiomas@teschi.edu.mx',
  'incubadoradeempresas@teschi.edu.mx',
  'sutaateschi@teschi.edu.mx',
  'personalinnova013@gmail.com'
];

const MANTENIMIENTO = [
  'ciencias_basicas@teschi.edu.mx',
  'mantenimientoinnova088@gmail.com'
];

const DOCENTES_LISTA_BLANCA = [
  'docenteinnova074@gmail.com',
  'guillermovarela@teschi.edu.mx',
  'mario_montiel@teschi.edu.mx',
  'juliomendez@teschi.edu.mx',
  'juanalbertoramirez@teschi.edu.mx',
  'josemartinez@teschi.edu.mx',
  'renevictorinolopez@teschi.edu.mx',
  'luciotun@teschi.edu.mx',
  'bernardinosanchez@teschi.edu.mx',
  'nicolastrejo@teschi.edu.mx',
  'marcollinas@teschi.edu.mx',
  'jose_hernandez_santiago@teschi.edu.mx',
  'adriangarduno@teschi.edu.mx',
  'allangomez@teschi.edu.mx',
  'sharonsolis@teschi.edu.mx',
  'anuarmalcon@teschi.edu.mx',
  'gumesindoflores@teschi.edu.mx',
  'alejandrojavierrivera@teschi.edu.mx',
  'heribertoflores@teschi.edu.mx',
  'zitaalvarez@teschi.edu.mx',
  'abrahamjorge@teschi.edu.mx',
  'yolandacastro@teschi.edu.mx'
];

/* =========================
   DETECTAR ROL
========================= */
function detectarRol(email) {
  email = email.toLowerCase().trim();

  if (MANTENIMIENTO.includes(email)) return 'TECNICO';
  if (PERSONAL_ADMIN.includes(email)) return 'PERSONAL';
  if (DOCENTES_LISTA_BLANCA.includes(email)) return 'DOCENTE';

  if (/^[0-9]{10}@teschi\.edu\.mx$/.test(email)) return 'ALUMNO';
  if (/^[a-z]+@teschi\.edu\.mx$/.test(email)) return 'DOCENTE';
  if (/^[a-z0-9._]+@teschi\.edu\.mx$/.test(email)) return 'PERSONAL';

  return null;
}

/* =========================
   VALIDACIÓN CONTRASEÑA
========================= */
const PASSWORD_REGEX = /^(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{6,}$/;

/* =========================
   REGISTRO
========================= */
router.post('/register', async (req, res) => {
  try {
    const { nombre, email, password } = req.body;
    const db = req.db;

    if (!nombre || !email || !password) {
      return res.status(400).json({ message: 'Todos los campos son obligatorios' });
    }

    const rol = detectarRol(email);
    if (!rol) {
      return res.status(403).json({ message: 'Correo institucional no autorizado' });
    }

    if (!PASSWORD_REGEX.test(password)) {
      return res.status(400).json({
        message: 'La contraseña debe tener mínimo 6 caracteres, una mayúscula, un número y un símbolo'
      });
    }

    const hash = await bcrypt.hash(password, 10);

    db.query(
      'INSERT INTO usuarios (nombre, email, rol, password) VALUES (?, ?, ?, ?)',
      [nombre, email, rol, hash],
      err => {
        if (err) {
          if (err.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ message: 'Este correo ya está registrado' });
          }
          console.error(err);
          return res.status(500).json({ message: 'Error al registrar usuario' });
        }

        return res.status(200).json({
          message: 'Registro exitoso. Ahora inicia sesión'
        });
      }
    );
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Error del servidor' });
  }
});

/* =========================
   LOGIN
========================= */
router.post('/login', (req, res) => {
  const { email, password } = req.body;
  const db = req.db;

  if (!email || !password) {
    return res.status(400).json({ message: 'Correo y contraseña requeridos' });
  }

  db.query(
    'SELECT * FROM usuarios WHERE email = ?',
    [email],
    async (err, results) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ message: 'Error del servidor' });
      }

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
        email: user.email,
        rol: user.rol
      };

      return res.status(200).json({
        message: 'Login exitoso',
        rol: user.rol
      });
    }
  );
});

module.exports = router;