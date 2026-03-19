import crypto from 'crypto'

const AUTH_SECRET = 'MioAuth!Secret#2024@Meritto'
const USERNAME    = 'product@meritto.com'
const PASSWORD    = '1!2MIC#@!S5G3F>>__!@'

function createToken() {
  const ts  = Date.now().toString(16)
  const sig = crypto.createHmac('sha256', AUTH_SECRET).update(ts).digest('hex')
  return `${ts}.${sig}`
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' })
  }

  const { username, password } = req.body || {}
  if (username !== USERNAME || password !== PASSWORD) {
    return res.status(401).json({ success: false, error: 'Invalid credentials' })
  }

  res.json({ success: true, token: createToken() })
}
