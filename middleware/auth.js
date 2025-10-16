const jwt = require('jsonwebtoken')

module.exports = function (req, res, next) {
  res.locals.errors = []
  try {
    const decoded = jwt.verify(req.cookies.loginCookie, process.env.JWTSECRET)
    req.user = decoded
  } catch {
    req.user = false
  }
  res.locals.user = req.user
  next()
}
