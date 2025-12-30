const express = require("express");
const nodemailer = require("nodemailer");
const { usuarios, resetTokens } = require("../memory/state");

const router = express.Router();

// ===== CONFIG MAIL =====
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// ===== RECUPERAR CONTRASEÑA =====
router.post("/recuperar", async (req, res) => {
  const { email } = req.body;
  const user = usuarios.find(u => u.email === email);

  if (!user) {
    return res.send("Correo no registrado");
  }

  const token = Math.random().toString(36).substring(2);
  resetTokens.push({ email, token });

  const link = `${process.env.BASE_URL}/reset/${token}`;

  await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to: email,
    subject: "Recuperación de contraseña - INNOVA",
    html: `<p>Haz clic para restablecer tu contraseña:</p>
           <a href="${link}">${link}</a>`
  });

  res.send("Correo enviado");
});

// ===== FORM RESET =====
router.get("/reset/:token", (req, res) => {
  const tokenData = resetTokens.find(t => t.token === req.params.token);
  if (!tokenData) return res.send("Token inválido");

  res.render("recuperar-contrasena", { token: req.params.token });
});

// ===== GUARDAR NUEVA PASSWORD =====
router.post("/reset/:token", (req, res) => {
  const { password } = req.body;
  const tokenData = resetTokens.find(t => t.token === req.params.token);

  if (!tokenData) return res.send("Token inválido");

  const user = usuarios.find(u => u.email === tokenData.email);
  user.password = password;

  res.send("Contraseña actualizada");
});

module.exports = router;
