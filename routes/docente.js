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
   ABRIR CLASE / BITÁCORA
========================= */
router.post("/abrir-clase", verificarSesion, soloRol(["DOCENTE"]), (req, res) => {
  const db = req.db;
  const { carrera, laboratorio, hora_inicio, hora_fin } = req.body;
  const docenteId = req.session.user.id;

  const idZona = parseInt(laboratorio);

  if (isNaN(idZona)) {
    return res.status(400).send("Laboratorio inválido");
  }

  // 🔍 Verificar si ya hay clase activa
  db.query(
    `SELECT id FROM clases WHERE id_zona = ? AND estado = 'ACTIVA'`,
    [idZona],
    (err, rows) => {
      if (err) {
        console.error("❌ ERROR MYSQL COMPLETO:", err);
        return res.status(500).json({
          mensaje: "Error al abrir la clase",
          error: err.sqlMessage,
          codigo: err.code
        });
      }

      if (rows && rows.length > 0) {
        return res.send("Este laboratorio ya tiene una clase activa");
      }

      // ✅ Insertar nueva clase
      db.query(
        `INSERT INTO clases 
         (id_docente, id_zona, carrera, hora_inicio, hora_fin, fecha, estado)
         VALUES (?, ?, ?, ?, ?, CURDATE(), 'ACTIVA')`,
        [docenteId, idZona, carrera, hora_inicio, hora_fin],
        err => {
          if (err) {
            console.error("❌ Error al abrir clase:", err.sqlMessage);
            return res.status(500).send("Error al abrir la clase");
          }

          const io = req.app.get("io");
          io.emit("clase_activada", { idZona });

          res.redirect("/docente");
        }
      );
    }
  );
});

/* =========================
   CERRAR CLASE
========================= */
router.post("/cerrar-clase", verificarSesion, soloRol(["DOCENTE"]), (req, res) => {
  const db = req.db;
  const io = req.app.get("io");

  db.query(
    `UPDATE clases SET estado='CERRADA' WHERE estado='ACTIVA'`,
    err => {
      if (err) {
        console.error("❌ Error al cerrar clase:", err.sqlMessage);
        return res.status(500).send("Error al cerrar clase");
      }

      io.emit("clase_cerrada");
      res.sendStatus(200);
    }
  );
});

module.exports = router;
