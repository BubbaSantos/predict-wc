const FDORG_KEY = Deno.env.get('FDORG_KEY') ?? '';
const FD_BASE = 'https://api.football-data.org/v4';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, apikey, content-type',
};

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: CORS });
  }

  const url = new URL(req.url);
  const path = url.pathname.replace(/^\/functions\/v1\/fdproxy/, '') + url.search;

  try {
    const r = await fetch(FD_BASE + path, {
      headers: { 'X-Auth-Token': FDORG_KEY },
    });
    const body = await r.text();
    return new Response(body, {
      status: r.status,
      headers: { 'Content-Type': 'application/json', ...CORS },
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...CORS },
    });
  }
});
