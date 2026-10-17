// Plan API — extract Core Revelation from completed Word Within conversation
// Vercel serverless function — zero npm dependencies (native fetch only)
// Requires: ANTHROPIC_API_KEY, SUPABASE_URL, SUPABASE_SERVICE_KEY

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

async function saveRevelation(userId, week, revelation) {
  const existing = await fetchProgress(userId);
  const coreRevs = existing?.core_revelations || {};
  coreRevs[String(week)] = revelation;

  const url = `${process.env.SUPABASE_URL}/rest/v1/user_progress?on_conflict=user_id`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      ...dbHeaders(),
      'Prefer': 'resolution=merge-duplicates,return=representation'
    },
    body: JSON.stringify({
      user_id: userId,
      core_revelations: coreRevs,
      updated_at: new Date().toISOString()
    })
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`DB save failed ${res.status}: ${body}`);
  }
  return res.json();
}

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const token = (req.headers.authorization || '').replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: 'Unauthorised' });

  const user = await verifyToken(token);
  if (!user || !user.id) return res.status(401).json({ error: 'Invalid session' });

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'API key not configured' });

  try {
    const { messages, week } = req.body;
    const weekNum = parseInt(week, 10) || 1;

    // Build readable conversation text
    const conversationText = (messages || [])
      .filter(m => m.role === 'assistant' || m.role === 'user')
      .slice(0, 40) // cap at 40 messages to stay within token limits
      .map(m => `${m.role === 'assistant' ? 'Companion' : 'Reader'}: ${m.content}`)
      .join('\n\n');

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-5-5',
        max_tokens: 120,
        system: `You extract the single most important revelation about God from a Word Within Scripture meditation conversation.

Write ONE sentence (two at most) that:
- States what this passage reveals about who God IS — his character, nature, or actions
- Is grounded in what specifically emerged in this person's conversation
- Is written as a present-tense truth claim: "God is..." or "God remains..." or "God acts..."
- Captures something personal and specific — not a generic theological statement

Examples:
"God is a rock that cannot be moved — my security belongs in who He is, not in what I can control."
"God extends forgiveness that is complete and permanent — there is nothing left for shame to hold over me."
"God's faithfulness in waiting does not mean He is absent — it means His goodness is not dependent on His speed."

Write ONLY the revelation sentence. No preamble. No quotation marks. No explanation.`,
        messages: [{
          role: 'user',
          content: `Week ${weekNum} Word Within conversation:\n\n${conversationText}\n\nExtract the Core Revelation from this conversation.`
        }]
      })
    });

    const data = await response.json();
    if (!response.ok || data.error) {
      return res.status(500).json({ error: data.error?.message || `HTTP ${response.status}` });
    }

    const revelation = data.content?.find(b => b.type === 'text')?.text?.trim() || '';
    if (!revelation) return res.status(500).json({ error: 'Could not extract revelation' });

    await saveRevelation(user.id, weekNum, revelation);

    return res.status(200).json({ core_revelation: revelation });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};
