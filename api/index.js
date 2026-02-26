const fs = require('fs')
const path = require('path')

const TOKEN = process.env.OPDASH_TOKEN || 'opdash-session-token'
const STATE_URL = process.env.OPDASH_STATE_URL || 'https://raw.githubusercontent.com/shihab-meteor/operation-dashboard/main/status.json'

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

async function sendLiveState(res) {
  try {
    const url = `${STATE_URL}?t=${Date.now()}`
    const r = await fetch(url, { cache: 'no-store' })
    if (!r.ok) throw new Error(`upstream ${r.status}`)
    const txt = await r.text()
    res.setHeader('Content-Type', 'application/json; charset=utf-8')
    res.setHeader('Cache-Control', 'no-store')
    return res.end(txt)
  } catch (e) {
    res.statusCode = 502
    res.setHeader('Content-Type', 'application/json; charset=utf-8')
    return res.end(JSON.stringify({ error: 'state_unavailable', message: String(e.message || e) }))
  }
}

module.exports = async (req, res) => {
  const urlPath = req.url.split('?')[0]

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

  if (urlPath === '/api/state' || urlPath === '/status.json') {
    return sendLiveState(res)
  }

  const indexPath = path.join(__dirname, '..', 'index.html')
  return sendFile(res, indexPath, 'text/html; charset=utf-8')
}
