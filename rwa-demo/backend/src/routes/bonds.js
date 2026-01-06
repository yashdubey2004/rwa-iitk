import { Router } from 'express';
import { getDb } from '../lib/db.js';

const router = Router();

function getAvailableTokens(db, bondId) {
  const total = db.prepare('SELECT total_tokens FROM bonds WHERE id = ?').get(bondId)?.total_tokens || 0;
  const sold = db.prepare('SELECT COALESCE(SUM(tokens_owned), 0) as sold FROM user_bond_holdings WHERE bond_id = ?').get(bondId)?.sold || 0;
  return Math.max(0, total - sold);
}

router.get('/', (req, res) => {
  const db = getDb();
  const bonds = db.prepare('SELECT * FROM bonds').all();
  const withAvail = bonds.map(b => ({
    ...b,
    available_tokens: getAvailableTokens(db, b.id)
  }));
  res.json(withAvail);
});

router.get('/:id', (req, res) => {
  const db = getDb();
  const bond = db.prepare('SELECT * FROM bonds WHERE id = ?').get(req.params.id);
  if (!bond) return res.status(404).json({ error: 'Not found' });
  res.json({ ...bond, available_tokens: getAvailableTokens(db, bond.id) });
});

export default router;
