// Vercel serverless function: POST /api/detect
// Receives { image: base64 } and returns { ingredients: [...] }

export const config = {
  api: {
    bodyParser: { sizeLimit: '10mb' },
  },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { image } = req.body || {};
  if (!image) {
    return res.status(400).json({ error: 'Missing image' });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'API key not configured' });
  }

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1000,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'image',
                source: { type: 'base64', media_type: 'image/jpeg', data: image },
              },
              {
                type: 'text',
                text: `Identify every distinct food ingredient visible in this photo. Include produce, proteins, pantry items, herbs, spices, oils, sauces — anything edible you can see. Respond ONLY with a JSON array of strings, no preamble, no markdown fences. Example: ["yellow onion", "garlic", "chicken thighs"]. Be specific (e.g. "roma tomato" not just "tomato" if you can tell).`,
              },
            ],
          },
        ],
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('Anthropic API error:', errText);
      return res.status(502).json({ error: 'Upstream API error' });
    }

    const data = await response.json();
    const text = data.content?.find((b) => b.type === 'text')?.text || '[]';
    const clean = text.replace(/```json|```/g, '').trim();
    const ingredients = JSON.parse(clean);

    return res.status(200).json({ ingredients });
  } catch (err) {
    console.error('detect error:', err);
    return res.status(500).json({ error: 'Failed to detect ingredients' });
  }
}
