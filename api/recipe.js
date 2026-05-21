// Vercel serverless function: POST /api/recipe
// Two modes:
//   mode: "names" -> returns { options: [{name, tagline, time, difficulty}, x3] }
//   mode: "full"  -> returns { recipe: { ...full recipe... } }

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { ingredients, cuisine, skill, diets = [], mode, chosenName, chosenTagline } = req.body || {};
  if (!Array.isArray(ingredients) || !cuisine || !skill || !mode) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'API key not configured' });
  }

  const cuisineGuidance = {
    "west-african": "West African cooking. Lean into deep flavor bases: pepper sauce, locust bean (iru), smoked fish, palm oil, scotch bonnet/ata rodo, stockfish, traditional spice blends. Think modern interpretations of jollof, egusi, efo riro, suya, asun, dodo, banga, ofada.",
    italian: "Italian cooking. Restraint, quality, technique. Pasta with proper emulsified sauces, risotto, braises, simple grilled fish. Olive oil, garlic, herbs, lemon, parmigiano. Think regional Italy, not Italian-American.",
    japanese: "Japanese cooking. Cleanliness, umami, balance. Dashi-based broths, careful knife work, ferments (miso, soy, mirin). Think izakaya snacks, donburi, hot pots, simple grilled dishes.",
    mexican: "Mexican cooking. Fresh salsas, dried chiles, masa, lime, cilantro. Think regional Mexico — al pastor, mole, tinga, ceviches, fresh tortillas. Not Tex-Mex.",
    indian: "Indian cooking. Layered spice building — toasted whole spices, tempered oil (tadka), slow-built masalas. Could be North (tandoor, paneer, dals) or South (coconut, curry leaves, dosa, sambar).",
    "middle-eastern": "Middle Eastern cooking — Levantine, Persian, or broader. Tahini, sumac, za'atar, pomegranate, lots of herbs, yogurt, slow-cooked stews, beautifully grilled meats.",
    thai: "Thai cooking. The four pillars — sweet, sour, salty, spicy — balanced in every bite. Fresh herbs (Thai basil, cilantro, mint), fish sauce, lime, chili, lemongrass, galangal.",
    korean: "Korean cooking. Gochujang, gochugaru, ferments (kimchi, doenjang). Rice as anchor, banchan side culture. Bold but layered. Think bibimbap, jjigae, bulgogi, Korean-Chinese.",
    french: "French cooking. Technique-forward — proper sauces (mother sauces and derivatives), reductions, emulsions, careful seasoning. Butter and shallots welcome. Bistro, brasserie, or refined.",
    american: "American comfort food. Diner, BBQ, soul food, regional Americana. Honest, satisfying, well-seasoned. Could be mac and cheese, fried chicken, gumbo, chili, smash burgers, biscuits.",
    mediterranean: "Mediterranean cooking — Greek, Spanish, southern Italian, North African coast. Olive oil, lemon, herbs, vegetables forward, grilled fish, legumes.",
    chinese: "Chinese cooking. Regional — Sichuan (numbing/spicy), Cantonese (clean/savory), Northern (noodles/dumplings). Wok hei, careful balance of soy/vinegar/aromatics.",
    caribbean: "Caribbean cooking — Jamaican, Trinidadian, Cuban, Haitian. Jerk seasoning, allspice, scotch bonnet, rice and peas, callaloo, plantain, slow-braised meats.",
    surprise: "Pick any world cuisine that fits the ingredients best — could be Vietnamese, Ethiopian, Turkish, Filipino, Peruvian, anything unexpected. Be adventurous. Tell us the cuisine in the recipe name or tagline.",
  };

  const skillGuidance = {
    quick: "QUICK & EASY mode. Total time under 25 minutes. Minimal ingredients. Weeknight after-work cooking. Simple technique. Should taste better than the effort suggests.",
    healthy: "HEALTHY mode. Balanced — protein, vegetables, smart carbs. Lighter on butter/cream/oil. Whole ingredients. Real flavor (not punishing diet food). Mention rough calorie ballpark if useful.",
    budget: "BUDGET mode. Stretch the ingredients, suggest cheap pantry swaps, use techniques that build depth (browning, layering, resting). The goal: tastes like it cost three times what it did. Note rough cost per serving.",
    datenight: "DATE NIGHT mode. Restaurant-plated, romantic, impressive but achievable in one evening. Composed plates, contrasting textures, a sauce that ties it together, considered garnish. Should photograph well. Include a plating note in the chef note.",
    advanced: "ADVANCED mode. For someone who LIKES cooking. Real technique — could be confit, fermentation, multi-stage builds, careful tempering, proper sauce work. Don't dumb it down. Push them.",
    surprise: "SURPRISE mode. Pick the vibe that best fits these ingredients — could be cozy, fancy, weird, classic, whatever. Be playful in the dish name.",
  };

  const dietRules = diets.length
    ? `\n\nSTRICT DIETARY CONSTRAINTS — every recipe must respect ALL of these: ${diets.join(', ')}.
- "vegetarian" = no meat, no fish, no poultry. Eggs/dairy okay.
- "vegan" = no animal products at all.
- "pescatarian" = no meat or poultry; fish and seafood okay.
- "halal" = no pork, no alcohol, no non-halal meat.
- "kosher" = no pork, no shellfish, no mixing meat with dairy.
- "gluten-free" = no wheat, barley, rye, or anything containing gluten.
- "dairy-free" = no milk, butter, cheese, yogurt, cream.
- "nut-free" = no tree nuts or peanuts.
If the photo's ingredients conflict with these constraints, ignore the conflicting ingredients and work with what's left, or recommend a simple swap.`
    : '';

  const cuisinePrompt = cuisineGuidance[cuisine] || cuisineGuidance.surprise;
  const skillPrompt = skillGuidance[skill] || skillGuidance.surprise;

  let userMessage;
  if (mode === 'names') {
    userMessage = `You're a creative chef. The cook has these ingredients on hand: ${ingredients.join(', ')}.

CUISINE: ${cuisinePrompt}

STYLE: ${skillPrompt}
${dietRules}

Suggest THREE distinct dishes the cook could make. Each should feel genuinely different from the others — different proteins, different techniques, different vibes — not three variations on one idea.

Respond ONLY with a JSON object, no preamble or markdown fences:
{
  "options": [
    { "name": "dish name", "tagline": "one-line poetic description under 12 words", "time": "e.g. '25 min'", "difficulty": "easy | medium | involved" },
    { ... },
    { ... }
  ]
}`;
  } else if (mode === 'full') {
    userMessage = `You're a creative chef. The cook chose this dish: "${chosenName}" — ${chosenTagline || ''}.

They have these ingredients on hand: ${ingredients.join(', ')}.

CUISINE: ${cuisinePrompt}

STYLE: ${skillPrompt}
${dietRules}

Write the full recipe for "${chosenName}". Be specific with quantities and timings. Steps should be clear but not over-explained — write to someone who can cook.

Respond ONLY with a JSON object, no preamble or markdown fences:
{
  "name": "${chosenName}",
  "tagline": "one-line description, under 14 words",
  "time": "total time, e.g. '40 min'",
  "difficulty": "easy | medium | involved",
  "servings": "e.g. 'serves 2' or 'serves 4'",
  "uses": ["ingredient from the cook's list", ...],
  "extras": ["pantry items they likely have or should grab", ...],
  "steps": ["step 1 with quantities/timing", "step 2", ...],
  "chefNote": "one sentence — the secret, the why, the plating note, or the flourish that elevates the dish"
}`;
  } else {
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
        max_tokens: 2000,
        messages: [{ role: 'user', content: userMessage }],
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
    const parsed = JSON.parse(clean);

    if (mode === 'names') {
      return res.status(200).json({ options: parsed.options || [] });
    }
    return res.status(200).json({ recipe: parsed });
  } catch (err) {
    console.error('recipe error:', err);
    return res.status(500).json({ error: 'Failed to generate recipe' });
  }
}
