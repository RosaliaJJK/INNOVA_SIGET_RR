const express = require("express");
const router = express.Router();
const { verificarSesion, soloRol } = require("../middlewares/authMiddleware");

/*
  MOSTRAR VISTA ALUMNO
*/
router.get(
  "/",
  verificarSesion,
  soloRol(["ALUMNO"]),
  (req, res) => {
    res.render("alumno", {
      user: req.session.user
    });
  }
);

/*
  CONECTAR ALUMNO AL TIEMPO REAL
*/
router.post(
  "/conectar",
  verificarSesion,
  soloRol(["ALUMNO"]),
  (req, res) => {
    const io = req.app.get("io");

    const alumno = {
      nombre: req.session.user.nombre,
      maquina: req.body.maquina || "N/A",
      observacion: ""
    };

    /*
      ⚠️ Esto luego puede venir de BD
      Por ahora es un ejemplo simple
    */
    io.emit("alumnos_en_linea", [alumno]);

    res.json({ ok: true });
  }
);

module.exports = router;