const fs = require('fs')
const path = require('path')

const USER = process.env.OPDASH_USER || 'salman'
const PASS = process.env.OPDASH_PASS || 'change-me'

function unauthorized(res) {
  res.statusCode = 401
  res.setHeader('WWW-Authenticate', 'Basic realm="Operation Dashboard"')
  res.end('Authentication required')
}

function isAuthorized(req) {
  const auth = req.headers.authorization
  if (!auth || !auth.startsWith('Basic ')) return false
  const raw = Buffer.from(auth.split(' ')[1], 'base64').toString('utf8')
  const i = raw.indexOf(':')
  const user = i >= 0 ? raw.slice(0, i) : ''
  const pass = i >= 0 ? raw.slice(i + 1) : ''
  return user === USER && pass === PASS
}

module.exports = (req, res) => {
  if (!isAuthorized(req)) return unauthorized(res)

  const p = req.url.split('?')[0]
  if (p === '/status.json') {
    const file = path.join(__dirname, '..', 'status.json')
    res.setHeader('Content-Type', 'application/json; charset=utf-8')
    return res.end(fs.readFileSync(file, 'utf8'))
  }

  const file = path.join(__dirname, '..', 'index.html')
  res.setHeader('Content-Type', 'text/html; charset=utf-8')
  return res.end(fs.readFileSync(file, 'utf8'))
}
