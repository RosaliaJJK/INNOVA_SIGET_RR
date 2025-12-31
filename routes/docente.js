const express = require("express");
const router = express.Router();
const { verificarSesion, soloRol } = require("../middlewares/authMiddleware");

/*
  MOSTRAR PANEL DOCENTE
*/
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

/*
  ABRIR CLASE (FORMULARIO)
*/
router.post(
  "/abrir-clase",
  verificarSesion,
  soloRol(["DOCENTE"]),
  (req, res) => {
    const { carrera, laboratorio, hora_inicio, hora_fin } = req.body;

    // (Aquí luego puedes guardar en BD si quieres)
    console.log("Clase abierta:", {
      carrera,
      laboratorio,
      hora_inicio,
      hora_fin,
      docente: req.session.user.nombre
    });

    // Redirige de nuevo al panel
    res.redirect("/docente");
  }
);

module.exports = router;
docente.js