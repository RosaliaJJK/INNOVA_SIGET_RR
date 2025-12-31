const express = require("express");
const router = express.Router();
const { verificarSesion, soloRol } = require("../middlewares/authMiddleware");

/* =========================
   MOSTRAR VISTA DOCENTE
========================= */
router.get(
  "/",
  verificarSesion,
  soloRol(["DOCENTE"]),
  (req, res) => {
    res.render("docente", {
      user: req.session.user
    });
  }
);

/* =========================
   ABRIR CLASE (HABILITAR ACCESO)
========================= */
router.post(
  "/abrir-clase",
  verificarSesion,
  soloRol(["DOCENTE"]),
  (req, res) => {
    const io = req.app.get("io");

    // Emitir evento de clase habilitada a todos los clientes
    io.emit("clase_habilitada", {
      carrera: req.body.carrera,
      laboratorio: req.body.laboratorio,
      hora_inicio: req.body.hora_inicio,
      hora_fin: req.body.hora_fin,
      docente: req.session.usuario.nombre
    });

    // Aquí podrías guardar en la BD que la clase está abierta si quieres

    res.redirect("/docente");
  }
);

/* =========================
   CERRAR CLASE (DESHABILITAR ACCESO)
========================= */
router.post(
  "/cerrar-clase",
  verificarSesion,
  soloRol(["DOCENTE"]),
  (req, res) => {
    const io = req.app.get("io");

    // Emitir evento de clase cerrada a todos los clientes
    io.emit("clase_cerrada");

    // Aquí podrías actualizar en la BD que la clase está cerrada

    res.sendStatus(200);
  }
);

module.exports = router;