#!/usr/bin/env node
// sync.js — fetch finished match results from football-data.org and write to Supabase
// Usage: node sync.js

const SUPABASE_URL = 'https://ulaourrszsruverylrxo.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVsYW91cnJzenNydXZlcnlscnhvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA5MDk3NDIsImV4cCI6MjA5NjQ4NTc0Mn0.SVZghCamKJ42abd7L2oQqDUheE5oqz8a_f2SA-SCrVE';
const FDORG_KEY    = '08714f5114a4402c8f6d737574b934a2';
const FD_BASE      = 'https://api.football-data.org/v4';
const FD_COMP      = 'WC';

const FIXTURES = [
  { id:'m001', home:'Mexico', away:'South Africa' },
  { id:'m002', home:'South Korea', away:'Czechia' },
  { id:'m003', home:'Canada', away:'Bosnia & Herz.' },
  { id:'m004', home:'USA', away:'Paraguay' },
  { id:'m005', home:'Qatar', away:'Switzerland' },
  { id:'m006', home:'Brazil', away:'Morocco' },
  { id:'m007', home:'Haiti', away:'Scotland' },
  { id:'m008', home:'Australia', away:'Türkiye' },
  { id:'m009', home:'Germany', away:'Curaçao' },
  { id:'m010', home:'Netherlands', away:'Japan' },
  { id:'m011', home:'Ivory Coast', away:'Ecuador' },
  { id:'m012', home:'Sweden', away:'Tunisia' },
  { id:'m013', home:'Spain', away:'Cape Verde' },
  { id:'m014', home:'Belgium', away:'Egypt' },
  { id:'m015', home:'Saudi Arabia', away:'Uruguay' },
  { id:'m016', home:'Iran', away:'New Zealand' },
  { id:'m017', home:'France', away:'Senegal' },
  { id:'m018', home:'Iraq', away:'Norway' },
  { id:'m019', home:'Argentina', away:'Algeria' },
  { id:'m020', home:'Austria', away:'Jordan' },
  { id:'m021', home:'Portugal', away:'DR Congo' },
  { id:'m022', home:'England', away:'Croatia' },
  { id:'m023', home:'Ghana', away:'Panama' },
  { id:'m024', home:'Uzbekistan', away:'Colombia' },
  { id:'m025', home:'Czechia', away:'South Africa' },
  { id:'m026', home:'Switzerland', away:'Bosnia & Herz.' },
  { id:'m027', home:'Canada', away:'Qatar' },
  { id:'m028', home:'Mexico', away:'South Korea' },
  { id:'m029', home:'USA', away:'Australia' },
  { id:'m030', home:'Scotland', away:'Morocco' },
  { id:'m031', home:'Brazil', away:'Haiti' },
  { id:'m032', home:'Paraguay', away:'Türkiye' },
  { id:'m033', home:'Japan', away:'Tunisia' },
  { id:'m034', home:'Germany', away:'Ivory Coast' },
  { id:'m035', home:'Netherlands', away:'Sweden' },
  { id:'m036', home:'Ecuador', away:'Curaçao' },
  { id:'m037', home:'Spain', away:'Saudi Arabia' },
  { id:'m038', home:'Egypt', away:'New Zealand' },
  { id:'m039', home:'Uruguay', away:'Cape Verde' },
  { id:'m040', home:'Belgium', away:'Iran' },
  { id:'m041', home:'Senegal', away:'Iraq' },
  { id:'m042', home:'France', away:'Norway' },
  { id:'m043', home:'Algeria', away:'Jordan' },
  { id:'m044', home:'Argentina', away:'Austria' },
  { id:'m045', home:'Colombia', away:'DR Congo' },
  { id:'m046', home:'Croatia', away:'Panama' },
  { id:'m047', home:'England', away:'Ghana' },
  { id:'m048', home:'Portugal', away:'Uzbekistan' },
  { id:'m049', home:'South Africa', away:'South Korea' },
  { id:'m050', home:'Mexico', away:'Czechia' },
  { id:'m051', home:'Bosnia & Herz.', away:'Qatar' },
  { id:'m052', home:'Switzerland', away:'Canada' },
  { id:'m053', home:'Scotland', away:'Brazil' },
  { id:'m054', home:'Morocco', away:'Haiti' },
  { id:'m055', home:'Türkiye', away:'USA' },
  { id:'m056', home:'Paraguay', away:'Australia' },
  { id:'m057', home:'Curaçao', away:'Germany' },
  { id:'m058', home:'Ecuador', away:'Ivory Coast' },
  { id:'m059', home:'Tunisia', away:'Netherlands' },
  { id:'m060', home:'Japan', away:'Sweden' },
  { id:'m061', home:'New Zealand', away:'Belgium' },
  { id:'m062', home:'Egypt', away:'Iran' },
  { id:'m063', home:'Cape Verde', away:'Spain' },
  { id:'m064', home:'Uruguay', away:'Saudi Arabia' },
  { id:'m065', home:'Norway', away:'Senegal' },
  { id:'m066', home:'Iraq', away:'France' },
  { id:'m067', home:'Jordan', away:'Argentina' },
  { id:'m068', home:'Algeria', away:'Austria' },
  { id:'m069', home:'DR Congo', away:'Uzbekistan' },
  { id:'m070', home:'Colombia', away:'Portugal' },
  { id:'m071', home:'Panama', away:'England' },
  { id:'m072', home:'Croatia', away:'Ghana' },
];

function norm(s) {
  if (!s) return '';
  return s.toLowerCase()
    .replace(/ü/g,'u').replace(/ç/g,'c').replace(/é/g,'e').replace(/ô/g,'o').replace(/ñ/g,'n')
    // football-data.org name variants
    .replace("côte d'ivoire",'ivory coast')
    .replace('cabo verde','cape verde')
    .replace('democratic republic of congo','dr congo')
    .replace('dr. congo','dr congo')
    .replace('bosnia & herz.','bosnia and herzegovina')
    .replace('bosnia and herzegovina','bosnia and herzegovina')
    .replace('korea republic','south korea')
    .replace('republic of korea','south korea')
    .replace('united states','usa')
    .replace('united states of america','usa')
    .replace('türkiye','turkiye')
    .replace('turkey','turkiye')
    .replace('curacao','curacao')
    .replace('czech republic','czechia')
    .replace('iran (islamic republic of)','iran')
    .replace('new zealand','new zealand')
    .replace(/\s+/g,' ').trim();
}

function findFixture(hn, an) {
  const nh = norm(hn), na = norm(an);
  return FIXTURES.find(f => norm(f.home) === nh && norm(f.away) === na);
}

async function sb(path, opts = {}) {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': opts.prefer || 'return=minimal',
    },
    method: opts.method || 'GET',
    body: opts.body ? JSON.stringify(opts.body) : undefined,
  });
  if (!r.ok && r.status !== 204) {
    const t = await r.text();
    throw new Error(t);
  }
  if (r.status === 204) return null;
  const txt = await r.text();
  if (!txt || !txt.trim()) return null;
  return JSON.parse(txt);
}

async function main() {
  console.log('Fetching results from football-data.org...');
  const fdRes = await fetch(`${FD_BASE}/competitions/${FD_COMP}/matches?season=2026`, {
    headers: { 'X-Auth-Token': FDORG_KEY },
  });
  if (!fdRes.ok) {
    const body = await fdRes.text();
    throw new Error(`FD API error ${fdRes.status}: ${body}`);
  }
  const data = await fdRes.json();
  const allMatches = data.matches || [];
  const finished = allMatches.filter(m => m.status === 'FINISHED');
  console.log(`  Total matches from API: ${allMatches.length}, finished: ${finished.length}`);

  // Build map of matchId -> score for finished group stage matches
  const scoreMap = {};
  const unmatched = [];
  for (const m of finished) {
    const h = m.score?.fullTime?.home, a = m.score?.fullTime?.away;
    if (h == null || a == null) continue;
    const fix = findFixture(m.homeTeam?.name, m.awayTeam?.name);
    if (!fix) {
      unmatched.push(`${m.homeTeam?.name} vs ${m.awayTeam?.name}`);
      continue;
    }
    scoreMap[fix.id] = { home: h, away: a };
  }
  console.log(`  Mapped ${Object.keys(scoreMap).length} group stage results`);
  if (unmatched.length) console.log(`  Unmatched (likely knockouts): ${unmatched.join(' | ')}`);

  // Fetch all groups
  const groups = await sb('groups?select=id,name');
  console.log(`  Syncing to ${groups.length} group(s): ${groups.map(g=>g.name).join(', ')}`);

  let total = 0;
  for (const group of groups) {
    // Fetch existing results for this group
    const existing = await sb(`results?group_id=eq.${group.id}&select=match_id,home_score,away_score`);
    const existMap = {};
    (existing || []).forEach(r => existMap[r.match_id] = { home: r.home_score, away: r.away_score });

    for (const [matchId, score] of Object.entries(scoreMap)) {
      const ex = existMap[matchId];
      if (ex && ex.home === score.home && ex.away === score.away) continue;
      await sb(`results?group_id=eq.${group.id}&match_id=eq.${matchId}`, { method: 'DELETE' });
      await sb('results', {
        method: 'POST',
        body: { group_id: group.id, match_id: matchId, home_score: score.home, away_score: score.away },
      });
      console.log(`  [${group.name}] ${matchId}: ${score.home}–${score.away}`);
      total++;
    }
  }

  console.log(`Done. ${total} result(s) updated.`);
}

main().catch(e => { console.error('Error:', e.message); process.exit(1); });
