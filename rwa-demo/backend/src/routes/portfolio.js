import { Router } from 'express';
import { getDb } from '../lib/db.js';
import { authRequired } from '../middleware/auth.js';

const router = Router();

function nowISO() { return new Date().toISOString(); }

router.get('/portfolio', authRequired, (req, res) => {
  const db = getDb();
  const user = db.prepare('SELECT id, name, email, stablecoin_balance FROM users WHERE id = ?').get(req.user.id);
  const rows = db.prepare(`SELECT h.*, b.bond_name, b.interest_rate, b.maturity_date, b.token_price
    FROM user_bond_holdings h JOIN bonds b ON b.id = h.bond_id WHERE h.user_id = ?`).all(req.user.id);

  const holdings = rows.map(r => {
    const last = new Date(r.last_yield_calculated);
    const days = Math.max(0, Math.floor((Date.now() - last.getTime()) / (1000*60*60*24)));
    const daily = (r.invested_amount * r.interest_rate) / 365;
    const newAccrued = daily * days;
    return {
      bond_id: r.bond_id,
      bond_name: r.bond_name,
      interest_rate: r.interest_rate,
      tokens_owned: r.tokens_owned,
      invested_amount: r.invested_amount,
      last_yield_calculated: r.last_yield_calculated,
      accrued_yield: r.accrued_yield + newAccrued,
      maturity_date: r.maturity_date,
      token_price: r.token_price
    };
  });

  // Persist the accrual timing and amounts (simulate accrual on fetch)
  const tx = db.transaction(() => {
    holdings.forEach(h => {
      const existing = db.prepare('SELECT accrued_yield FROM user_bond_holdings WHERE user_id = ? AND bond_id = ?').get(req.user.id, h.bond_id);
      const last = rows.find(r => r.bond_id === h.bond_id);
      const lastTime = new Date(last.last_yield_calculated);
      const days = Math.max(0, Math.floor((Date.now() - lastTime.getTime()) / (1000*60*60*24)));
      const daily = (last.invested_amount * last.interest_rate) / 365;
      const newAccrued = daily * days;
      db.prepare('UPDATE user_bond_holdings SET last_yield_calculated = ?, accrued_yield = accrued_yield + ? WHERE user_id = ? AND bond_id = ?')
        .run(nowISO(), newAccrued, req.user.id, h.bond_id);
    });
  });
  try { tx(); } catch (e) { /* ignore accrual persistence errors */ }

  const totals = holdings.reduce((acc, h) => {
    acc.invested += h.invested_amount;
    acc.yield += h.accrued_yield;
    return acc;
  }, { invested: 0, yield: 0 });

  res.json({
    balance: user.stablecoin_balance,
    total_invested: totals.invested,
    total_yield: totals.yield,
    holdings
  });
});

export default router;
