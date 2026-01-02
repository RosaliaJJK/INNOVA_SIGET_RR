const express = require('express');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const nodemailer = require('nodemailer');

const router = express.Router();

/* =========================
   CONFIGURAR CORREO
========================= */
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

/* =========================
   SOLICITAR RECUPERACIÓN
========================= */
router.post('/recuperar', (req, res) => {
  const { email } = req.body;
  const db = req.db;

  db.query(
    'SELECT id FROM usuarios WHERE email = ?',
    [email],
    (err, results) => {
      if (err) {
        console.error(err);
        return res.render('recuperar-contrasena', {
          error: 'Error del servidor'
        });
      }

      // 🔒 No decimos si existe o no
      if (results.length === 0) {
        return res.render('recuperar-contrasena', {
          success: 'Si el correo está registrado, recibirás un enlace'
        });
      }

      const token = crypto.randomBytes(32).toString('hex');
      const expira = new Date(Date.now() + 60 * 60 * 1000); // 1 hora

      db.query(
        'UPDATE usuarios SET reset_token = ?, reset_expira = ? WHERE email = ?',
        [token, expira, email],
        async err => {
          if (err) {
            console.error(err);
            return res.render('recuperar-contrasena', {
              error: 'Error al generar token'
            });
          }

          const link = `${process.env.BASE_URL}/api/reset/${token}`;

          try {
            await transporter.sendMail({
              from: `"INNOVA SIGET" <${process.env.EMAIL_USER}>`,
              to: email,
              subject: 'Recuperación de contraseña',
              html: `
                <p>Hola,</p>
                <p>Haz clic en el siguiente enlace para restablecer tu contraseña:</p>
                <p><a href="${link}">${link}</a></p>
                <p>Este enlace expira en 1 hora.</p>
              `
            });

            return res.render('recuperar-contrasena', {
              success: 'Te hemos enviado un enlace de recuperación'
            });

          } catch (mailError) {
            console.error(mailError);
            return res.render('recuperar-contrasena', {
              error: 'No se pudo enviar el correo'
            });
          }
        }
      );
    }
  );
});

/* =========================
   FORMULARIO NUEVA PASSWORD
========================= */
router.get('/reset/:token', (req, res) => {
  const db = req.db;
  const { token } = req.params;

  db.query(
    'SELECT id FROM usuarios WHERE reset_token = ? AND reset_expira > NOW()',
    [token],
    (err, results) => {
      if (err || results.length === 0) {
        return res.send('Token inválido o expirado');
      }

      res.render('reset', { token });
    }
  );
});

/* =========================
   GUARDAR NUEVA PASSWORD
========================= */
router.post('/reset/:token', async (req, res) => {
  const db = req.db;
  const { token } = req.params;
  const { password } = req.body;

  if (!password) {
    return res.send('Contraseña requerida');
  }

  const hash = await bcrypt.hash(password, 10);

  db.query(
    `UPDATE usuarios
     SET password = ?, reset_token = NULL, reset_expira = NULL
     WHERE reset_token = ? AND reset_expira > NOW()`,
    [hash, token],
    (err, result) => {
      if (err || result.affectedRows === 0) {
        return res.send('Token inválido o expirado');
      }

      res.send('Contraseña actualizada correctamente. Ya puedes iniciar sesión.');
    }
  );
});

module.exports = router;