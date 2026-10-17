// Progress API — GET user progress, POST mark session complete
// Vercel serverless function — zero npm dependencies (native fetch only)
// Requires: SUPABASE_URL, SUPABASE_SERVICE_KEY

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

function dbHeaders() {
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_KEY}`,
    'apikey': process.env.SUPABASE_SERVICE_KEY
  };
}

async function fetchProgress(userId) {
  const url = `${process.env.SUPABASE_URL}/rest/v1/user_progress?user_id=eq.${encodeURIComponent(userId)}&select=*&limit=1`;
  const res = await fetch(url, { headers: dbHeaders() });
  if (!res.ok) return null;
  const rows = await res.json();
  return rows.length > 0 ? rows[0] : null;
}

async function upsertProgress(data) {
  const url = `${process.env.SUPABASE_URL}/rest/v1/user_progress?on_conflict=user_id`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      ...dbHeaders(),
      'Prefer': 'resolution=merge-duplicates,return=representation'
    },
    body: JSON.stringify(data)
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`DB upsert failed ${res.status}: ${body}`);
  }
  const rows = await res.json();
  return Array.isArray(rows) ? rows[0] : rows;
}

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const token = (req.headers.authorization || '').replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: 'Unauthorised' });

  const user = await verifyToken(token);
  if (!user || !user.id) return res.status(401).json({ error: 'Invalid session' });

  // ── GET: return full progress ─────────────────────────────────────────────
  if (req.method === 'GET') {
    try {
      const row = await fetchProgress(user.id);
      if (!row) {
        return res.status(200).json({
          current_week: 1,
          word_weeks_completed: [],
          spirit_weeks_completed: [],
          core_revelations: {},
          daily_scores: {},
          daily_reflections: {},
          daily_days_completed: {}
        });
      }
      return res.status(200).json({
        current_week:            row.current_week            || 1,
        word_weeks_completed:    row.word_weeks_completed    || [],
        spirit_weeks_completed:  row.spirit_weeks_completed  || [],
        core_revelations:        row.core_revelations        || {},
        daily_scores:            row.daily_scores            || {},
        daily_reflections:       row.daily_reflections       || {},
        daily_days_completed:    row.daily_days_completed    || {}
      });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  // ── POST: mark a session complete ─────────────────────────────────────────
  if (req.method === 'POST') {
    const { action, week, mode } = req.body;
    if (action !== 'complete_session') {
      return res.status(400).json({ error: 'Unknown action' });
    }

    const weekNum = parseInt(week, 10);
    if (!weekNum || weekNum < 1 || weekNum > 13) {
      return res.status(400).json({ error: 'Invalid week' });
    }
    if (mode !== 'word' && mode !== 'spirit') {
      return res.status(400).json({ error: 'Invalid mode' });
    }

    try {
      const existing = await fetchProgress(user.id);

      const wordDone   = existing?.word_weeks_completed   || [];
      const spiritDone = existing?.spirit_weeks_completed || [];

      if (mode === 'word' && !wordDone.includes(weekNum)) {
        wordDone.push(weekNum);
        wordDone.sort((a, b) => a - b);
      }
      if (mode === 'spirit' && !spiritDone.includes(weekNum)) {
        spiritDone.push(weekNum);
        spiritDone.sort((a, b) => a - b);
      }

      // Advance current_week to the next incomplete word week (max 13)
      let currentWeek = existing?.current_week || 1;
      for (let w = 1; w <= 13; w++) {
        if (!wordDone.includes(w)) { currentWeek = w; break; }
        if (w === 13) currentWeek = 13;
      }

      const row = await upsertProgress({
        user_id:                user.id,
        current_week:           currentWeek,
        word_weeks_completed:   wordDone,
        spirit_weeks_completed: spiritDone,
        updated_at:             new Date().toISOString()
      });

      return res.status(200).json({
        current_week:            row.current_week            || currentWeek,
        word_weeks_completed:    row.word_weeks_completed    || wordDone,
        spirit_weeks_completed:  row.spirit_weeks_completed  || spiritDone,
        core_revelations:        row.core_revelations        || {},
        daily_scores:            row.daily_scores            || {},
        daily_reflections:       row.daily_reflections       || {},
        daily_days_completed:    row.daily_days_completed    || {}
      });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
};
