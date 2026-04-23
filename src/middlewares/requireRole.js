const ApiError = require("../utils/ApiError");

const requireRole = (...allowedRoles) => (req, _res, next) => {
  if (!req.user || !allowedRoles.includes(req.user.role)) {
    return next(new ApiError(403, "Anda tidak memiliki akses ke resource ini."));
  }

  return next();
};

module.exports = requireRole;
