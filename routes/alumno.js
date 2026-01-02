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
    const db = req.db;
    const { machineNumber, observation } = req.body;

    // 1️⃣ Buscar clase ABIERTA
    db.query(
      `SELECT id FROM clases_activas 
       WHERE estatus = 'ABIERTA' 
       ORDER BY id DESC 
       LIMIT 1`,
      (err, rows) => {
        if (err) return res.status(500).send("Error BD");

        if (rows.length === 0) {
          return res.status(403).send("No hay clase activa");
        }

        const idClase = rows[0].id;

        // 2️⃣ Insertar bitácora
        db.query(
          `INSERT INTO bitacoras 
          (id_clase, id_alumno, equipo_numero, observaciones_iniciales)
          VALUES (?, ?, ?, ?)`,
          [idClase, req.session.user.id, machineNumber, observation],
          err => {
            if (err) return res.status(500).send("Error al registrar");

            // 3️⃣ Avisar en tiempo real
            const io = req.app.get("io");
            io.emit("nuevo_registro", {
              alumno: req.session.user.nombre,
              equipo: machineNumber
            });

            res.redirect("/alumno");
          }
        );
      }
    );
  }
);



router.get("/estado/:zonaId", verificarSesion, (req, res) => {
  const db = req.db;
  const zonaId = req.params.zonaId;

  db.query(
    `SELECT id, carrera FROM clases 
     WHERE id_zona = ? AND estado = 'ACTIVA'`,
    [zonaId],
    (err, rows) => {
      if (err) return res.status(500).json({ activo: false });

      if (rows.length === 0) {
        return res.json({ activo: false });
      }

      res.json({
        activo: true,
        id_clase: rows[0].id,
        carrera: rows[0].carrera
      });
    }
  );
});

router.post("/registrar", verificarSesion, soloRol(["ALUMNO"]), (req, res) => {
  const db = req.db;
  const { id_clase, numero_equipo, observaciones } = req.body;
  const alumnoId = req.session.user.id;

  db.query(
    `INSERT INTO registros 
     (id_clase, id_alumno, numero_equipo, observaciones)
     VALUES (?, ?, ?, ?)`,
    [id_clase, alumnoId, numero_equipo, observaciones],
    err => {
      if (err) {
        return res.status(400).send("Ya estás registrado o error");
      }

      const io = req.app.get("io");
      io.emit("nuevo_registro", {
        alumno: req.session.user.nombre,
        maquina: machineNumber,
        observacion: observation

    });


      res.sendStatus(200);
    }
  );
});



module.exports = router;