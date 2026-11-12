export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Accept');
    return res.status(204).end();
  }

  const suffix = (req.url || '').replace(/^\/api\/yahoo/, '') || '/';
  const headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'application/json'
  };

  const hosts = ['https://query1.finance.yahoo.com', 'https://query2.finance.yahoo.com'];
  let lastError = null;

  for (const host of hosts) {
    try {
      const upstream = await fetch(`${host}${suffix}`, { headers });
      if (upstream.ok) {
        const body = await upstream.text();
        res.setHeader('Content-Type', upstream.headers.get('content-type') || 'application/json; charset=utf-8');
        res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
        res.setHeader('Access-Control-Allow-Origin', '*');
        return res.status(upstream.status).send(body);
      }
      lastError = `HTTP ${upstream.status}`;
    } catch (err) {
      lastError = err?.message || 'Upstream fetch failed';
    }
  }

  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Access-Control-Allow-Origin', '*');
  return res.status(502).json({ error: 'Yahoo Finance proxy unavailable', detail: lastError });
}
