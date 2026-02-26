module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.statusCode = 405
    return res.end('method not allowed')
  }

  const USER = process.env.OPDASH_USER || 'salman'
  const PASS = process.env.OPDASH_PASS || 'change-me'
  const TOKEN = process.env.OPDASH_TOKEN || 'opdash-session-token'

  let username = ''
  let password = ''

  try {
    if (req.body && typeof req.body === 'object') {
      username = req.body.username || ''
      password = req.body.password || ''
    } else if (typeof req.body === 'string' && req.body.length) {
      const p = JSON.parse(req.body)
      username = p.username || ''
      password = p.password || ''
    } else {
      let raw = ''
      for await (const chunk of req) raw += chunk
      if (raw) {
        const p = JSON.parse(raw)
        username = p.username || ''
        password = p.password || ''
      }
    }
  } catch (e) {}

  if (username === USER && password === PASS) {
    res.setHeader('Set-Cookie', `opdash=${encodeURIComponent(TOKEN)}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=86400`)
    res.statusCode = 200
    return res.end('ok')
  }

  res.statusCode = 401
  return res.end('invalid')
}
