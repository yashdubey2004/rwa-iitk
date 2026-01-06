const headers = (token) => ({ 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) })

export async function register(name, email, password) {
  const r = await fetch('/auth/register', { method: 'POST', headers: headers(), body: JSON.stringify({ name, email, password }) })
  if (!r.ok) throw new Error('Register failed')
  return r.json()
}

export async function login(email, password) {
  const r = await fetch('/auth/login', { method: 'POST', headers: headers(), body: JSON.stringify({ email, password }) })
  if (!r.ok) throw new Error('Login failed')
  return r.json()
}

export async function getMe(token) {
  // Fetch balance via portfolio to hydrate user quickly
  const r = await fetch('/portfolio', { headers: headers(token) })
  if (!r.ok) throw new Error('Auth error')
  const data = await r.json()
  return { balance: data.balance }
}

export async function listBonds() {
  const r = await fetch('/bonds')
  if (!r.ok) throw new Error('Failed to load bonds')
  return r.json()
}

export async function getPortfolio(token) {
  const r = await fetch('/portfolio', { headers: headers(token) })
  if (!r.ok) throw new Error('Failed to load portfolio')
  return r.json()
}

export async function buy(token, bond_id, token_quantity) {
  const r = await fetch('/buy', { method: 'POST', headers: headers(token), body: JSON.stringify({ bond_id, token_quantity }) })
  if (!r.ok) throw new Error('Buy failed')
  return r.json()
}

export async function redeem(token, bond_id, token_quantity) {
  const r = await fetch('/redeem', { method: 'POST', headers: headers(token), body: JSON.stringify({ bond_id, token_quantity }) })
  if (!r.ok) throw new Error('Redeem failed')
  return r.json()
}
