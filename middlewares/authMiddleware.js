function verificarSesion(req, res, next) {
  if (!req.session.user) {
    return res.redirect("/");
  }
  next();
}

function soloRol(rol) {
  return (req, res, next) => {
    if (req.session.user.rol !== rol) {
      return res.send("Acceso no autorizado");
    }
    next();
  };
}

module.exports = {
  verificarSesion,
  soloRol
};
