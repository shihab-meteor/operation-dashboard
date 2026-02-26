const fs = require('fs')
const path = require('path')

const USER = process.env.OPDASH_USER || 'salman'
const PASS = process.env.OPDASH_PASS || 'change-me'
const TOKEN = process.env.OPDASH_TOKEN || 'opdash-session-token'

function sendFile(res, filePath, contentType) {
  res.setHeader('Content-Type', contentType)
  res.end(fs.readFileSync(filePath, 'utf8'))
}

function getCookie(req, name) {
  const c = req.headers.cookie || ''
  const parts = c.split(';').map(s => s.trim())
  const hit = parts.find(p => p.startsWith(name + '='))
  return hit ? decodeURIComponent(hit.split('=').slice(1).join('=')) : null
}

module.exports = (req, res) => {
  const urlPath = req.url.split('?')[0]

  if (req.method === 'POST' && urlPath === '/api/login') {
    let body = ''
    req.on('data', chunk => body += chunk)
    req.on('end', () => {
      try {
        const { username, password } = JSON.parse(body || '{}')
        if (username === USER && password === PASS) {
          res.setHeader('Set-Cookie', `opdash=${encodeURIComponent(TOKEN)}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=86400`)
          res.statusCode = 200
          return res.end('ok')
        }
      } catch {}
      res.statusCode = 401
      return res.end('invalid')
    })
    return
  }

  if (urlPath === '/logout') {
    res.setHeader('Set-Cookie', 'opdash=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0')
    res.statusCode = 302
    res.setHeader('Location', '/login')
    return res.end()
  }

  const authed = getCookie(req, 'opdash') === TOKEN
  if (!authed) {
    const loginPath = path.join(__dirname, '..', 'login.html')
    return sendFile(res, loginPath, 'text/html; charset=utf-8')
  }

  if (urlPath === '/status.json') {
    const statusPath = path.join(__dirname, '..', 'status.json')
    return sendFile(res, statusPath, 'application/json; charset=utf-8')
  }

  const indexPath = path.join(__dirname, '..', 'index.html')
  return sendFile(res, indexPath, 'text/html; charset=utf-8')
}
