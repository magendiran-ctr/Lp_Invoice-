// server.js – simple Express backend listening on port 5000
const express = require('express');
const cors = require('cors');

const app = express();
const PORT = 5000; // backend port as requested

app.use(cors());               // enable CORS for local dev
app.use(express.json());       // parse JSON bodies

// Health‑check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', port: PORT });
});

/**
 * POST /api/invoice
 * Receives the invoice payload from the Next.js frontend.
 * Payload shape: { invoiceNumber:string, data:object, html:string }
 */
app.post('/api/invoice', (req, res) => {
  console.log('Received invoice payload:', req.body);
  // TODO: persist to DB / file system / cloud storage
  res.json({ success: true, received: req.body });
});

app.listen(PORT, () => {
  console.log(`Backend listening on http://localhost:${PORT}`);
});
