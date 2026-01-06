# RWA Bonds Demo (Software-Only)

A full-stack demo simulating Fractional Tokenized Government Bonds — no blockchain involved. Backend simulates tokenization, fractional ownership, trading, and daily yield accrual using a traditional database and REST APIs.

## Tech Stack
- Frontend: React + Vite, Tailwind CSS, Chart.js (react-chartjs-2)
- Backend: Node.js + Express, SQLite (better-sqlite3), REST APIs, JWT auth

## Project Structure

```
rwa-demo/
  backend/
    src/
      index.js            # Express app entry
      seed.js             # Seed sample user and bonds
      lib/db.js           # SQLite setup & schema
      middleware/auth.js  # JWT guard
      routes/
        auth.js           # /auth/register, /auth/login
        bonds.js          # /bonds, /bonds/:id
        portfolio.js      # /portfolio (accrues yield on fetch)
        trade.js          # /buy, /redeem
    package.json
  frontend/
    src/
      pages/              # Landing, Dashboard, Marketplace, Portfolio, Redemption
      services/api.js     # REST client
      context/AuthContext.jsx
      App.jsx, main.jsx, styles.css
    index.html
    vite.config.js        # Dev server proxy to backend
    tailwind.config.js
    postcss.config.js
    package.json
  README.md
```

## Data Model (with minimal extensions)
- User: id, name, email, password, stablecoin_balance
- Bond: id, bond_name, interest_rate, maturity_date, total_value, total_tokens, token_price
- UserBondHolding: user_id, bond_id, tokens_owned, invested_amount, last_yield_calculated

Extensions added to support accrual tracking and charts:
- UserBondHolding.accrued_yield: cumulative accrued yield
- UserBondHolding.created_at: first acquisition time

Rationale: Accrual on-demand requires a durable accumulator; this field is updated on portfolio fetch and during redemption.

## Yield Logic
- Daily yield = (invested_amount × interest_rate) / 365
- No cron: accrual is computed when `/portfolio` is requested, persisted by bumping `last_yield_calculated` and adding to `accrued_yield`.
- Redemption pays principal + proportional accrued_yield.

## API Endpoints
- POST /auth/register
- POST /auth/login
- GET /bonds
- GET /bonds/:id
- POST /buy { bond_id, token_quantity }
- GET /portfolio
- POST /redeem { bond_id, token_quantity } (quantity optional; defaults to all)

## Seed Data
- Demo user: demo@example.com / password123 (25,000 mock USDC)
- Three US Treasury bonds (2Y, 5Y, 10Y), APR ~4.5–5.1%, price $10 per token

## Run Instructions

Prereqs: Node.js 18+

1) Backend

```bash
cd backend
npm install
npm run seed
npm run dev
```
Runs on http://localhost:4000

2) Frontend

```bash
cd ../frontend
npm install
npm run dev
```
Open http://localhost:5173

The Vite dev server proxies API calls to http://localhost:4000.

## Demo Flow
1. Login with the seeded demo user (or register a new one).
2. Dashboard shows mock USDC balance, total invested, and total yield.
3. Marketplace lists bonds with rates, token price, and availability. Buy tokens here.
4. Portfolio displays holdings, accrued yield, and a 30-day simulated yield chart.
5. Redemption lets you redeem all or partial tokens for principal + yield.

## Notes
- No blockchain or smart contracts. All logic resides in the backend.
- Numbers are fake but reasonable for demo purposes.
- Accrual happens on `/portfolio`; repeated requests increment yield based on elapsed whole days since the last accrual.
