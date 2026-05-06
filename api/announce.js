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
        model: 'meta-llama/llama-3.2-3b-instruct:free',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 220,
        temperature: 0.95,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.log('OpenRouter error:', response.status, JSON.stringify(data));
      return res.status(500).json({ error: `OpenRouter API error: ${response.status}` });
    }

    const text = data.choices?.[0]?.message?.content?.trim();

    if (!text) {
      console.log('No text in response:', JSON.stringify(data));
      return res.status(500).json({ error: 'No text in OpenRouter response' });
    }

    res.setHeader('Access-Control-Allow-Origin', '*');
    return res.status(200).json({ text });
  } catch (e) {
    console.log('OpenRouter fetch error:', e.message);
    return res.status(500).json({ error: 'OpenRouter request failed' });
  }
}
