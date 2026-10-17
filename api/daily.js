// Daily Exercise API — GET state for current week, POST save response
// Vercel serverless function — zero npm dependencies (native fetch only)
// Requires: SUPABASE_URL, SUPABASE_SERVICE_KEY

const DAILY_EXERCISES = {
  2: { name: 'The Alignment Check',        question: 'Where did my thoughts, anxieties, or actions yesterday contradict this revelation of God, and how can I realign them today?' },
  3: { name: 'The Filter Test',             question: 'If I view my biggest task, meeting, or stressor today strictly through the lens of this revelation, how does my approach change?' },
  4: { name: 'The Relational Impact',       question: 'How should this specific truth about God change the way I treat, speak to, or forgive the people I will encounter today?' },
  5: { name: 'The Extent Evaluation',       question: 'On a scale of 1–10, to what extent is this revelation actually changing my peace or choices this week, and what is holding me back from a 10?' },
  6: { name: 'The Gratitude & Prayer Shift',question: 'How can I turn this revelation into a specific prayer of thanksgiving today, praising God for who He has proved Himself to be this week?' },
  7: { name: 'The Weekly Review',           question: 'Looking back at the whole week, what is the most permanent change this revelation has made in your heart?' }
};

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

  // ── GET: return daily state for a given week ──────────────────────────────
  if (req.method === 'GET') {
    const week = parseInt(req.query?.week || '1', 10);
    try {
      const row = await fetchProgress(user.id);
      const coreRevelation = row?.core_revelations?.[String(week)] || null;
      const completedDays  = row?.daily_days_completed?.[String(week)] || [];
      const scores         = row?.daily_scores || {};

      // Next uncompleted day (2–7)
      let nextDay = null;
      for (let d = 2; d <= 7; d++) {
        if (!completedDays.includes(d)) { nextDay = d; break; }
      }

      // Score summary for days 2–6 (used on Day 7 review)
      const weekScores = [];
      for (let d = 2; d <= 6; d++) {
        weekScores.push({
          day: d,
          name: DAILY_EXERCISES[d].name,
          score: scores[`${week}_${d}`] !== undefined ? scores[`${week}_${d}`] : null,
          done: completedDays.includes(d)
        });
      }

      return res.status(200).json({
        week,
        next_day: nextDay,
        core_revelation: coreRevelation,
        completed_days: completedDays,
        week_scores: weekScores,
        exercise: nextDay ? DAILY_EXERCISES[nextDay] : null,
        all_exercises: DAILY_EXERCISES
      });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  // ── POST: save a daily response ───────────────────────────────────────────
  if (req.method === 'POST') {
    const { week, day, score, reflection } = req.body;
    const weekNum = parseInt(week, 10);
    const dayNum  = parseInt(day, 10);

    if (!weekNum || weekNum < 1 || weekNum > 13 || !dayNum || dayNum < 2 || dayNum > 7) {
      return res.status(400).json({ error: 'Invalid week or day' });
    }

    try {
      const existing = await fetchProgress(user.id);

      const dailyScores      = existing?.daily_scores      || {};
      const dailyReflections = existing?.daily_reflections || {};
      const dailyDaysCompleted = existing?.daily_days_completed || {};

      if (score !== undefined && score !== null) {
        dailyScores[`${weekNum}_${dayNum}`] = parseInt(score, 10);
      }
      if (reflection && reflection.trim()) {
        dailyReflections[`${weekNum}_${dayNum}`] = reflection.trim();
      }

      const completedForWeek = dailyDaysCompleted[String(weekNum)] || [];
      if (!completedForWeek.includes(dayNum)) {
        dailyDaysCompleted[String(weekNum)] = [...completedForWeek, dayNum].sort((a, b) => a - b);
      }

      const row = await upsertProgress({
        user_id: user.id,
        daily_scores: dailyScores,
        daily_reflections: dailyReflections,
        daily_days_completed: dailyDaysCompleted,
        updated_at: new Date().toISOString()
      });

      return res.status(200).json({ ok: true, row });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
};
