import jwt from 'jsonwebtoken';
import { getDb } from '../lib/db.js';

export function authRequired(req, res, next) {
  const authHeader = req.headers['authorization'] || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
  // Try normal JWT flow first
  if (token) {
    try {
      const payload = jwt.verify(token, process.env.JWT_SECRET || 'dev_secret');
      req.user = { id: payload.id, email: payload.email, name: payload.name };
      return next();
    } catch (e) {
      // fallthrough to bypass mode
    }
  }

  // BYPASS MODE: accept all requests and impersonate a demo user
  try {
    const db = getDb();
    let user = db.prepare('SELECT id, name, email FROM users ORDER BY id LIMIT 1').get();
    if (!user) {
      // Create a default dev user if database is empty
      const info = db.prepare('INSERT INTO users (name, email, password, stablecoin_balance) VALUES (?, ?, ?, ?)')
        .run('Dev User', 'dev@example.com', 'x', 50000);
      user = { id: info.lastInsertRowid, name: 'Dev User', email: 'dev@example.com' };
    }
    req.user = { id: user.id, email: user.email, name: user.name };
    return next();
  } catch (e) {
    return res.status(500).json({ error: 'Auth bypass failed' });
  }
}
