export async function onRequest(context) {
  const { request, params } = context;

  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Accept'
      }
    });
  }

  const rawPath = Array.isArray(params.path) ? params.path.join('/') : (params.path || '');
  const reqUrl = new URL(request.url);
  const targetSuffix = `/${rawPath}${reqUrl.search}`;

  const headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'application/json'
  };

  const hosts = ['https://query1.finance.yahoo.com', 'https://query2.finance.yahoo.com'];
  let lastError = null;

  for (const host of hosts) {
    try {
      const upstream = await fetch(`${host}${targetSuffix}`, { headers });
      if (upstream.ok) {
        const body = await upstream.text();
        return new Response(body, {
          status: upstream.status,
          headers: {
            'Content-Type': upstream.headers.get('content-type') || 'application/json; charset=utf-8',
            'Cache-Control': 'no-store, no-cache, must-revalidate',
            'Access-Control-Allow-Origin': '*'
          }
        });
      }
      lastError = `HTTP ${upstream.status}`;
    } catch (err) {
      lastError = err?.message || 'Upstream fetch failed';
    }
  }

  return new Response(JSON.stringify({ error: 'Yahoo Finance proxy unavailable', detail: lastError }), {
    status: 502,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
      'Access-Control-Allow-Origin': '*'
    }
  });
}
