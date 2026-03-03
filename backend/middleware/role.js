const { ROLES } = require('../config/constants');

/**
 * Role-based access control middleware
 * @param {Array} allowedRoles - Array of allowed role strings
 */
const checkRole = (allowedRoles) => {
  return (req, res, next) => {
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        error: `Access denied. Required roles: ${allowedRoles.join(', ')}`
      });
    }
    next();
  };
};

// Named exports for specific roles
const requireSuperadmin = checkRole([ROLES.SUPERADMIN]);
const requireOwner = checkRole([ROLES.OWNER]);
const requireStaff = checkRole([ROLES.STAFF]);
const requireResident = checkRole([ROLES.RESIDENT]);
const requireOwnerOrStaff = checkRole([ROLES.OWNER, ROLES.STAFF]);
const requireSuperadminOrOwner = checkRole([ROLES.SUPERADMIN, ROLES.OWNER]);

module.exports = checkRole;
module.exports.checkRole = checkRole;
module.exports.requireSuperadmin = requireSuperadmin;
module.exports.requireOwner = requireOwner;
module.exports.requireStaff = requireStaff;
module.exports.requireResident = requireResident;
module.exports.requireOwnerOrStaff = requireOwnerOrStaff;
module.exports.requireSuperadminOrOwner = requireSuperadminOrOwner;

