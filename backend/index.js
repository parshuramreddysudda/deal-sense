// -----------------------------------------------------------------------------
// Thin Express wrapper for LOCAL DEVELOPMENT ONLY.
// In production (Vercel) the same handlers are exposed as serverless functions
// under /api/*.js. Both this file and those functions import the shared
// handlers from ../api/_lib/handlers.js so there is exactly one source of truth.
// -----------------------------------------------------------------------------

const express = require('express');
const cors = require('cors');
const { analyse, marketData } = require('../api/_lib/handlers');

const app = express();
app.use(cors({ origin: true }));
app.use(express.json({ limit: '2mb' }));

app.get('/api/market-data', marketData);
app.post('/api/analyse', analyse);

// Legacy stub kept for local dev parity (not exposed in production).
app.post('/api/upload-bills', async (_req, res) => {
    res.json({
        extracted: {
            annual_kwh: 550000,
            annual_gas_kwh: 120000,
            billing_period: 'Jan 2024 - Dec 2024',
            property_address_on_bill: 'Mindspace IT Park, Hyderabad',
            utility_provider: 'TSSPDCL',
        },
    });
});

app.get('/api/health', (_req, res) => {
    res.json({ ok: true, mode: 'express-local' });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`DealSense backend (dev) running on port ${PORT}`);
});
