import { initDb, getDb } from './lib/db.js';
import bcrypt from 'bcryptjs';

initDb();
const db = getDb();

// Seed bonds
const bonds = [
  {
    bond_name: 'US Treasury 2Y',
    interest_rate: 0.045, // 4.5% annual
    maturity_date: '2027-01-15',
    total_value: 1000000,
    total_tokens: 100000,
    token_price: 10
  },
  {
    bond_name: 'US Treasury 5Y',
    interest_rate: 0.048,
    maturity_date: '2030-06-30',
    total_value: 2000000,
    total_tokens: 200000,
    token_price: 10
  },
  {
    bond_name: 'US Treasury 10Y',
    interest_rate: 0.051,
    maturity_date: '2036-12-31',
    total_value: 3000000,
    total_tokens: 300000,
    token_price: 10
  }
];

const user = {
  name: 'Demo User',
  email: 'demo@example.com',
  password: bcrypt.hashSync('password123', 10),
  stablecoin_balance: 25000
};

const tx = db.transaction(() => {
  db.prepare('DELETE FROM user_bond_holdings').run();
  db.prepare('DELETE FROM bonds').run();
  db.prepare('DELETE FROM users').run();

  db.prepare('INSERT INTO users (name, email, password, stablecoin_balance) VALUES (?, ?, ?, ?)')
    .run(user.name, user.email, user.password, user.stablecoin_balance);

  const insertBond = db.prepare('INSERT INTO bonds (bond_name, interest_rate, maturity_date, total_value, total_tokens, token_price) VALUES (?, ?, ?, ?, ?, ?)');
  for (const b of bonds) {
    insertBond.run(b.bond_name, b.interest_rate, b.maturity_date, b.total_value, b.total_tokens, b.token_price);
  }
});

try {
  tx();
  console.log('Seed complete. Demo user: demo@example.com / password123');
} catch (e) {
  console.error('Seed failed', e);
}
