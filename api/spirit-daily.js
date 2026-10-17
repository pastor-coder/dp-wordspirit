// Spirit Within — Daily Tag API
// Vercel serverless function — zero npm dependencies (native fetch only)
// Requires: SUPABASE_URL, SUPABASE_SERVICE_KEY

// ─── AUTH HELPER ─────────────────────────────────────────────────────────────

async function verifyToken(token) {
  const res = await fetch(`${process.env.SUPABASE_URL}/auth/v1/user`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'apikey': process.env.SUPABASE_SERVICE_KEY
    }
  });
  if (!res.ok) return null;
  return res.json();
}

// ─── SUPABASE REST HELPER ────────────────────────────────────────────────────

function supabase(path, method, body) {
  return fetch(`${process.env.SUPABASE_URL}/rest/v1/${path}`, {
    method: method || 'GET',
    headers: {
      'Content-Type': 'application/json',
      'apikey': process.env.SUPABASE_SERVICE_KEY,
      'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_KEY}`,
      'Prefer': method === 'POST' ? 'return=representation' : ''
    },
    body: body ? JSON.stringify(body) : undefined
  });
}

// ─── VALID TAGS ───────────────────────────────────────────────────────────────
// Mapped to Chapter 8's four dimensions of the Spirit's work in building resilience

const VALID_TAGS = ['empowered', 'transformed', 'comforted', 'interceded', 'own'];

// ─── HANDLER ─────────────────────────────────────────────────────────────────

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const token = (req.headers.authorization || '').replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: 'Unauthorised' });

  const user = await verifyToken(token);
  if (!user || !user.id) return res.status(401).json({ error: 'Invalid session' });

  // ── GET: return all spirit logs for this user ───────────────────────────────
  if (req.method === 'GET') {
    try {
      const r = await supabase(
        `spirit_daily_logs?user_id=eq.${user.id}&order=log_date.desc`,
        'GET'
      );
      if (!r.ok) {
        const err = await r.json();
        return res.status(500).json({ error: err.message || 'Failed to fetch logs' });
      }
      const logs = await r.json();

      const counts = { empowered: 0, transformed: 0, comforted: 0, interceded: 0, own: 0 };
      for (const log of logs) {
        if (counts[log.tag] !== undefined) counts[log.tag]++;
      }

      const today = new Date().toISOString().slice(0, 10);
      const todayLog = logs.find(l => l.log_date === today) || null;

      return res.status(200).json({
        logs,
        counts,
        total: logs.length,
        today_logged: !!todayLog,
        today_log: todayLog
      });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  // ── POST: save a daily tag ──────────────────────────────────────────────────
  if (req.method === 'POST') {
    const { tag, note, week } = req.body || {};

    if (!tag || !VALID_TAGS.includes(tag)) {
      return res.status(400).json({ error: `tag must be one of: ${VALID_TAGS.join(', ')}` });
    }

    const today = new Date().toISOString().slice(0, 10);

    try {
      const r = await fetch(`${process.env.SUPABASE_URL}/rest/v1/spirit_daily_logs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': process.env.SUPABASE_SERVICE_KEY,
          'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_KEY}`,
          'Prefer': 'resolution=merge-duplicates,return=representation'
        },
        body: JSON.stringify({
          user_id: user.id,
          log_date: today,
          tag,
          note: note || null,
          week: week || null
        })
      });

      if (!r.ok) {
        const err = await r.json();
        return res.status(500).json({ error: err.message || 'Failed to save log' });
      }

      const saved = await r.json();
      return res.status(200).json({ success: true, log: Array.isArray(saved) ? saved[0] : saved });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
};
