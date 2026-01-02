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
router.post(
  "/abrir-clase",
  verificarSesion,
  soloRol(["DOCENTE"]),
  (req, res) => {

    const db = req.db;
    const { carrera, laboratorio, hora_inicio, hora_fin } = req.body;
    const docenteId = req.session.user.id;

    // 1️⃣ Verificar si la zona ya tiene clase ACTIVA
    db.query(
      `SELECT id FROM clases 
       WHERE id_zona = ? AND estado = 'ACTIVA'`,
      [laboratorio],
      (err, rows) => {

        if (err) {
          console.error("❌ Error al verificar clase:", err);
          return res.status(500).send("Error al verificar clase");
        }

        if (rows.length > 0) {
          return res.send("Este laboratorio ya tiene una clase activa");
        }

        // 2️⃣ Insertar nueva clase
        db.query(
          `INSERT INTO clases
          (id_docente, id_zona, carrera, hora_inicio, hora_fin, fecha, estado)
          VALUES (?, ?, ?, ?, ?, CURDATE(), 'ACTIVA')`,
          [docenteId, laboratorio, carrera, hora_inicio, hora_fin],
          err => {

            if (err) {
              console.error("❌ Error al abrir clase:", err);
              return res.status(500).send("Error al abrir clase");
            }

            // 3️⃣ Emitir evento socket
            const io = req.app.get("io");
            io.emit("clase_activada");

            res.redirect("/docente");
          }
        );
      }
    );
  }
);

/* =========================
   CERRAR CLASE
========================= */
router.post(
  "/cerrar-clase",
  verificarSesion,
  soloRol(["DOCENTE"]),
  (req, res) => {
    const io = req.app.get("io");

    io.emit("clase_cerrada");
    res.sendStatus(200);
  }
);

module.exports = router;
