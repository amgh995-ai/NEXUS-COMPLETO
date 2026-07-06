const rolePermissions = require("../constants/rolePermissions");

const permission = (requiredPermission) => {
  return (req, res, next) => {
    const userRole = req.user.role;

    const permissions =
      rolePermissions[userRole] || [];

    if (!permissions.includes(requiredPermission)) {
      return res.status(403).json({
        message: "No tienes permisos",
      });
    }

    next();
  };
};

module.exports = permission;