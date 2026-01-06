import { Router } from 'express';
import { getDb } from '../lib/db.js';
import { authRequired } from '../middleware/auth.js';

const router = Router();

function nowISO() { return new Date().toISOString(); }

function getAvailableTokens(db, bondId) {
  const total = db.prepare('SELECT total_tokens FROM bonds WHERE id = ?').get(bondId)?.total_tokens || 0;
  const sold = db.prepare('SELECT COALESCE(SUM(tokens_owned), 0) as sold FROM user_bond_holdings WHERE bond_id = ?').get(bondId)?.sold || 0;
  return Math.max(0, total - sold);
}

router.post('/buy', authRequired, (req, res) => {
  const { bond_id, token_quantity } = req.body || {};
  const qty = Number(token_quantity);
  if (!bond_id || !qty || qty <= 0 || !Number.isInteger(qty)) {
    return res.status(400).json({ error: 'Invalid input' });
  }
  const db = getDb();
  const bond = db.prepare('SELECT * FROM bonds WHERE id = ?').get(bond_id);
  if (!bond) return res.status(404).json({ error: 'Bond not found' });
  const available = getAvailableTokens(db, bond_id);
  if (qty > available) return res.status(400).json({ error: 'Not enough tokens available' });

  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);
  const cost = bond.token_price * qty;
  if (user.stablecoin_balance < cost) return res.status(400).json({ error: 'Insufficient balance' });

  const tx = db.transaction(() => {
    db.prepare('UPDATE users SET stablecoin_balance = stablecoin_balance - ? WHERE id = ?').run(cost, req.user.id);
    const holding = db.prepare('SELECT * FROM user_bond_holdings WHERE user_id = ? AND bond_id = ?').get(req.user.id, bond_id);
    if (!holding) {
      db.prepare(`INSERT INTO user_bond_holdings (user_id, bond_id, tokens_owned, invested_amount, last_yield_calculated, accrued_yield, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)`)
        .run(req.user.id, bond_id, qty, cost, nowISO(), 0, nowISO());
    } else {
      db.prepare(`UPDATE user_bond_holdings SET tokens_owned = tokens_owned + ?, invested_amount = invested_amount + ? WHERE user_id = ? AND bond_id = ?`)
        .run(qty, cost, req.user.id, bond_id);
    }
  });

  try {
    tx();
    res.json({ success: true, spent: cost });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to buy' });
  }
});

router.post('/redeem', authRequired, (req, res) => {
  const { bond_id, token_quantity } = req.body || {};
  const db = getDb();
  const holding = db.prepare('SELECT * FROM user_bond_holdings WHERE user_id = ? AND bond_id = ?').get(req.user.id, bond_id);
  if (!holding) return res.status(404).json({ error: 'No holding found' });
  const qty = token_quantity ? Number(token_quantity) : holding.tokens_owned;
  if (qty <= 0 || !Number.isInteger(qty) || qty > holding.tokens_owned) {
    return res.status(400).json({ error: 'Invalid quantity' });
  }
  const bond = db.prepare('SELECT * FROM bonds WHERE id = ?').get(bond_id);
  const last = new Date(holding.last_yield_calculated);
  const days = Math.max(0, Math.floor((Date.now() - last.getTime()) / (1000*60*60*24)));
  const daily = (holding.invested_amount * bond.interest_rate) / 365;
  const newAccrued = daily * days;

  const tx = db.transaction(() => {
    // Update yield accrual timing
    db.prepare('UPDATE user_bond_holdings SET last_yield_calculated = ?, accrued_yield = accrued_yield + ? WHERE user_id = ? AND bond_id = ?')
      .run(nowISO(), newAccrued, req.user.id, bond_id);

    const updated = db.prepare('SELECT * FROM user_bond_holdings WHERE user_id = ? AND bond_id = ?').get(req.user.id, bond_id);

    const proportion = qty / updated.tokens_owned;
    const principalOut = updated.invested_amount * proportion;
    const yieldOut = updated.accrued_yield * proportion;
    const payout = principalOut + yieldOut;

    // Credit user
    db.prepare('UPDATE users SET stablecoin_balance = stablecoin_balance + ? WHERE id = ?').run(payout, req.user.id);

    // Reduce holding
    const remainingTokens = updated.tokens_owned - qty;
    if (remainingTokens === 0) {
      db.prepare('DELETE FROM user_bond_holdings WHERE user_id = ? AND bond_id = ?').run(req.user.id, bond_id);
    } else {
      db.prepare('UPDATE user_bond_holdings SET tokens_owned = ?, invested_amount = invested_amount - ?, accrued_yield = accrued_yield - ? WHERE user_id = ? AND bond_id = ?')
        .run(remainingTokens, principalOut, yieldOut, req.user.id, bond_id);
    }

    return { payout, principalOut, yieldOut, remainingTokens };
  });

  try {
    const result = tx();
    res.json({ success: true, ...result });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to redeem' });
  }
});

export default router;
