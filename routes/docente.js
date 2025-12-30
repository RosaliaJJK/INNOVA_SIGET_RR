const express = require("express");
const router = express.Router();
const { verificarSesion, soloRol } = require("../middlewares/authMiddleware");

/*
  MOSTRAR VISTA DOCENTE
*/
router.get(
  "/",
  verificarSesion,
  soloRol(["DOCENTE"]),
  (req, res) => {
    res.render("docente", {
      user: req.session.usuario
    });
  }
);

module.exports = router;
