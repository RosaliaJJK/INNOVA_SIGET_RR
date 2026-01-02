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

    // Verificar si ya hay clase abierta
    db.query(
      `SELECT id FROM clases_activas 
       WHERE laboratorio = ? AND estatus = 'ABIERTA'`,
      [laboratorio],
      (err, rows) => {

        // 🔴 PRIMERO manejar error
        if (err) {
          console.error("❌ Error al verificar clase activa:", err);
          return res.status(500).send("Error al verificar clase activa");
        }

        // 🟢 AHORA sí usar rows
        if (rows.length > 0) {
          return res.send("Este laboratorio ya está activo");
        }

        // ⬇️ CONTINÚA INSERCIÓN
        db.query(
          `INSERT INTO clases_activas
          (id_docente, carrera, laboratorio, hora_inicio, hora_fin, fecha_apertura, estatus)
          VALUES (?, ?, ?, ?, ?, CURDATE(), 'ABIERTA')`,
          [docenteId, carrera, laboratorio, hora_inicio, hora_fin],
          err => {
            if (err) {
              console.error("❌ Error al abrir clase:", err);
              return res.status(500).send("Error al abrir clase");
            }

            const io = req.app.get("io");
            io.emit("clase_activada", { laboratorio });

            res.redirect("/docente");
          }
        );
      }
    );
  }
); // ✅ ESTE CIERRE FALTABA

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
