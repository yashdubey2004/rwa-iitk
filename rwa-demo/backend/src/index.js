import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { initDb } from './lib/db.js';
import authRouter from './routes/auth.js';
import bondsRouter from './routes/bonds.js';
import portfolioRouter from './routes/portfolio.js';
import tradeRouter from './routes/trade.js';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// Initialize DB
initDb();

app.get('/', (req, res) => {
  res.json({ status: 'ok', service: 'RWA Demo Backend' });
});

app.use('/auth', authRouter);
app.use('/bonds', bondsRouter);
app.use('/', tradeRouter); // /buy, /redeem
app.use('/', portfolioRouter); // /portfolio

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Backend listening on port ${PORT}`);
});
