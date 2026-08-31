const isAdminMiddleware = (req, res, next) => {
  if (req.user?.isAdmin === true) {
    return next();
  } else {
    res.status(403).send({
      success: false,
      message: 'Access denied. Admins only.',
    });
  }
};

export default isAdminMiddleware ;