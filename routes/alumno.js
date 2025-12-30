const express = require('express');
const router = express.Router();

/* =========================
   PROTECCIÓN DE RUTA
========================= */
function proteger(req, res, next) {
  if (!req.session.user) {
    return res.redirect('/');
  }
  next();
}

/* =========================
   VISTA ALUMNO
========================= */
router.get('/', proteger, (req, res) => {
  res.render('alumno', {
    user: req.session.user
  });
});

module.exports = router;
