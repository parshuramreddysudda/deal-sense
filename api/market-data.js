const { marketData } = require('./_lib/handlers');

module.exports = async (req, res) => {
    if (req.method !== 'GET') {
        res.status(405).json({ error: 'Method not allowed' });
        return;
    }
    try {
        await marketData(req, res);
    } catch (err) {
        console.error('market-data failed', err);
        res.status(500).json({ error: err.message || 'Internal error' });
    }
};
