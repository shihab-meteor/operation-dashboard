module.exports = (req, res) => {
  if (req.method !== 'POST') {
    res.statusCode = 405
    return res.end('method not allowed')
  }

  const USER = process.env.OPDASH_USER || 'salman'
  const PASS = process.env.OPDASH_PASS || 'change-me'
  const TOKEN = process.env.OPDASH_TOKEN || 'opdash-session-token'

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
}
