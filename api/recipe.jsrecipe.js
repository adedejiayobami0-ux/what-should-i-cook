// Vercel serverless function: POST /api/recipe
// Receives { ingredients: [...], mode: string } and returns { recipe: {...} }

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { ingredients, mode } = req.body || {};
  if (!Array.isArray(ingredients) || !mode) {
    return res.status(400).json({ error: 'Missing ingredients or mode' });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'API key not configured' });
  }

  const modePrompts = {
    nigerian: `Design a NIGERIAN GOURMET dish — elevated West African cooking. Lean into deep flavor bases: pepper sauce, locust bean, smoked fish, palm oil, scotch bonnet, ata rodo, traditional spice blends. Think modern interpretations of jollof, egusi, efo riro, suya, asun, dodo — but plated and considered. The dish should feel like something from a Lagos tasting menu.`,
    budget: `Design a BUDGET-MODE dish — maximum flavor on a shoestring. Stretch the ingredients, suggest cheap pantry swaps if something's missing, use techniques that build depth (browning, layering, resting). The goal is "this tastes like it cost three times what it did." Mention rough cost per serving if you can.`,
    datenight: `Design a DATE-NIGHT dish — restaurant-plated, romantic, impressive but achievable in one evening. Think composed plates, contrasting textures, a sauce that ties it together, considered garnish. Should photograph well. Include a small plating note at the end.`,
  };

  const modePrompt = modePrompts[mode];
  if (!modePrompt) {
    return res.status(400).json({ error: 'Unknown mode' });
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
        max_tokens: 1500,
        messages: [
          {
            role: 'user',
            content: `You're a creative chef. The cook has these ingredients on hand: ${ingredients.join(', ')}.

${modePrompt}

Respond ONLY with a JSON object, no preamble or markdown fences, in this exact shape:
{
  "name": "dish name",
  "tagline": "one-line poetic description, under 12 words",
  "time": "total time, e.g. '35 min'",
  "difficulty": "easy | medium | involved",
  "uses": ["ingredient from the list", ...],
  "extras": ["pantry item the cook likely already has", ...],
  "steps": ["step 1", "step 2", ...],
  "chefNote": "one sentence — the secret, the why, or the flourish"
}`,
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
    const text = data.content?.find((b) => b.type === 'text')?.text || '{}';
    const clean = text.replace(/```json|```/g, '').trim();
    const recipe = JSON.parse(clean);

    return res.status(200).json({ recipe });
  } catch (err) {
    console.error('recipe error:', err);
    return res.status(500).json({ error: 'Failed to generate recipe' });
  }
}
