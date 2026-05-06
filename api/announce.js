export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'OpenRouter API key not configured' });
  }

  const { prompt } = req.body;
  if (!prompt) {
    return res.status(400).json({ error: 'Missing prompt' });
  }

  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'HTTP-Referer': 'https://bcr-peach.vercel.app',
        'X-Title': 'Big City Radio',
      },
      body: JSON.stringify({
        model: 'openrouter/free',
        messages: [
          {
            role: 'system',
            content: 'You are a radio DJ named Yorick. Respond ONLY with the spoken announcement text. No thinking, no reasoning, no stage directions, no asterisks, no bullet points, no quotation marks around song titles. Output only the words to say out loud. Keep it to 2-4 sentences maximum.'
          },
          { role: 'user', content: prompt }
        ],
        max_tokens: 220,
        temperature: 0.95,
        provider: {
          allow_fallbacks: true,
          require_parameters: true,
        },
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.log('OpenRouter error:', response.status, JSON.stringify(data));
      return res.status(500).json({ error: `OpenRouter API error: ${response.status}` });
    }

    const choice = data.choices?.[0];
    const text = choice?.message?.content?.trim() || null;

    if (!text) {
      console.log('No text in response:', JSON.stringify(data).slice(0, 300));
      return res.status(500).json({ error: 'No text in OpenRouter response' });
    }

    res.setHeader('Access-Control-Allow-Origin', '*');
    return res.status(200).json({ text });
  } catch (e) {
    console.log('OpenRouter fetch error:', e.message);
    return res.status(500).json({ error: 'OpenRouter request failed' });
  }
}
