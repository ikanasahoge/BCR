export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'Gemini API key not configured' });
  }

  const { prompt } = req.body;
  if (!prompt) {
    return res.status(400).json({ error: 'Missing prompt' });
  }

  const makeRequest = async () => {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.95,
            maxOutputTokens: 220,
          },
        }),
      }
    );
    return response;
  };

  try {
    let response = await makeRequest();

    // If rate limited, wait 3 seconds and try once more
    if (response.status === 429) {
      await new Promise(r => setTimeout(r, 3000));
      response = await makeRequest();
    }

    const data = await response.json();

    if (!response.ok) {
      console.log('Gemini error:', response.status, JSON.stringify(data));
      return res.status(500).json({ error: `Gemini API error: ${response.status}` });
    }

    const text = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();

    if (!text) {
      return res.status(500).json({ error: 'No text in Gemini response' });
    }

    res.setHeader('Access-Control-Allow-Origin', '*');
    return res.status(200).json({ text });
  } catch (e) {
    console.log('Gemini fetch error:', e.message);
    return res.status(500).json({ error: 'Gemini request failed' });
  }
}
