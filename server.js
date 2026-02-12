const path = require('path');
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const {
  PORT = 3000,
  ALLOWED_ORIGIN
} = process.env;

const app = express();

app.use(cors({
  origin: ALLOWED_ORIGIN ? ALLOWED_ORIGIN.split(',').map((value) => value.trim()) : true
}));
app.use(express.json({ limit: '1mb' }));
app.use(express.static(path.join(__dirname)));

app.get('*', (_req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`[appointment-site] Running on http://localhost:${PORT}`);
});
