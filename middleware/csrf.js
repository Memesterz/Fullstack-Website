const Tokens = require('csrf')
const tokens = new Tokens()

module.exports = (req, res, next) => {
  let secret = req.cookies._csrf_secret
  if (!secret) {
    secret = tokens.secretSync()
    res.cookie('_csrf_secret', secret, {
      httpOnly: true,
      sameSite: 'strict',
      maxAge: 1000 * 60 * 60 * 24
    })
  }
  res.locals.csrfToken = tokens.create(secret)

  if (['POST', 'PUT', 'DELETE'].includes(req.method)) {
    const token = req.body._csrf || req.get('CSRF-Token')
    if (!tokens.verify(secret, token)) {
      return res.status(403).send('Invalid CSRF token')
    }
  }
  next()
}