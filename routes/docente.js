const express = require("express");
const router = express.Router();
const { verificarSesion, soloRol } = require("../middlewares/authMiddleware");

/* =========================
   MOSTRAR VISTA DOCENTE
========================= */
router.get("/", verificarSesion, soloRol(["DOCENTE"]), (req, res) => {
  res.render("docente", {
    user: req.session.user
  });
});

/* =========================
   ABRIR CLASE
========================= */
router.post("/abrir-clase", verificarSesion, soloRol(["DOCENTE"]), (req, res) => {
  const io = req.app.get("io");

  global.claseActiva = true;

  const infoClase = {
    carrera: req.body.carrera,
    laboratorio: req.body.laboratorio,
    hora_inicio: req.body.hora_inicio,
    hora_fin: req.body.hora_fin,
    docente: req.session.user.nombre
  };

  global.infoClase = infoClase;
  global.alumnosConectados = [];

  io.emit("clase_habilitada", infoClase);
  res.redirect("/docente");
});

/* =========================
   CERRAR CLASE
========================= */
router.post("/cerrar-clase", verificarSesion, soloRol(["DOCENTE"]), (req, res) => {
  const io = req.app.get("io");

  global.claseActiva = false;
  global.infoClase = null;
  global.alumnosConectados = [];

  io.emit("clase_cerrada");
  res.sendStatus(200);
});

module.exports = router;
