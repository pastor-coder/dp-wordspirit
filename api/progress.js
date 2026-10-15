// Progress API — GET and POST user week progress via Supabase
// Vercel serverless function
// Requires: SUPABASE_URL, SUPABASE_SERVICE_KEY

const { createClient } = require('@supabase/supabase-js');

async function getUser(req, supabase) {
  const token = (req.headers.authorization || '').replace('Bearer ', '');
  if (!token) return null;
  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) return null;
  return user;
}

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  const user = await getUser(req, supabase);
  if (!user) return res.status(401).json({ error: 'Unauthorised' });

  // ── GET: fetch progress ──────────────────────────────────────────────────
  if (req.method === 'GET') {
    const { data, error } = await supabase
      .from('user_progress')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (error && error.code === 'PGRST116') {
      // No row yet — return empty defaults
      return res.status(200).json({
        current_week: 1,
        word_weeks_completed: [],
        spirit_weeks_completed: []
      });
    }
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json(data);
  }

  // ── POST: update progress ────────────────────────────────────────────────
  if (req.method === 'POST') {
    const { action, week, mode } = req.body;
    // mode: 'word' | 'spirit'
    // action: 'complete_session' | 'set_week'

    if (action === 'complete_session') {
      const weekNum = parseInt(week, 10);
      if (!weekNum || weekNum < 1 || weekNum > 13) {
        return res.status(400).json({ error: 'Invalid week' });
      }

      // Fetch existing
      const { data: existing } = await supabase
        .from('user_progress')
        .select('*')
        .eq('user_id', user.id)
        .single();

      const wordCompleted = existing?.word_weeks_completed || [];
      const spiritCompleted = existing?.spirit_weeks_completed || [];

      let updatedWord = wordCompleted;
      let updatedSpirit = spiritCompleted;

      if (mode === 'word' && !wordCompleted.includes(weekNum)) {
        updatedWord = [...wordCompleted, weekNum].sort((a, b) => a - b);
      }
      if (mode === 'spirit' && !spiritCompleted.includes(weekNum)) {
        updatedSpirit = [...spiritCompleted, weekNum].sort((a, b) => a - b);
      }

      // Advance current_week to highest word-completed + 1, max 13
      const highestWord = updatedWord.length > 0 ? Math.max(...updatedWord) : 0;
      const newCurrentWeek = Math.min(highestWord + 1, 13);
      const currentWeek = existing?.current_week || 1;
      const resolvedCurrentWeek = Math.max(currentWeek, newCurrentWeek);

      const upsertData = {
        user_id: user.id,
        current_week: resolvedCurrentWeek,
        word_weeks_completed: updatedWord,
        spirit_weeks_completed: updatedSpirit,
        updated_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('user_progress')
        .upsert(upsertData, { onConflict: 'user_id' })
        .select()
        .single();

      if (error) return res.status(500).json({ error: error.message });
      return res.status(200).json(data);
    }

    if (action === 'set_week') {
      const weekNum = parseInt(week, 10);
      if (!weekNum || weekNum < 1 || weekNum > 13) {
        return res.status(400).json({ error: 'Invalid week' });
      }

      const { data, error } = await supabase
        .from('user_progress')
        .upsert(
          { user_id: user.id, current_week: weekNum, updated_at: new Date().toISOString() },
          { onConflict: 'user_id' }
        )
        .select()
        .single();

      if (error) return res.status(500).json({ error: error.message });
      return res.status(200).json(data);
    }

    return res.status(400).json({ error: 'Unknown action' });
  }

  return res.status(405).json({ error: 'Method not allowed' });
};
