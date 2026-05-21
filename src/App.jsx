import React, { useState, useRef, useEffect } from "react";
import { Camera, Upload, Sparkles, Loader2, X, RotateCcw, ArrowLeft, Type, Plus, Check } from "lucide-react";

export default function App() {
  const [stage, setStage] = useState("entry");
  const [imageData, setImageData] = useState(null);
  const [typedText, setTypedText] = useState("");
  const [ingredients, setIngredients] = useState([]);
  const [cuisine, setCuisine] = useState(null);
  const [skill, setSkill] = useState(null);
  const [diets, setDiets] = useState([]);
  const [recipeOptions, setRecipeOptions] = useState([]);
  const [recipe, setRecipe] = useState(null);
  const [error, setError] = useState(null);
  const [streamActive, setStreamActive] = useState(false);

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);
  const streamRef = useRef(null);

  const cuisines = [
    { id: "west-african", name: "West African", note: "Nigerian, Ghanaian, Senegalese", emoji: "🌶️" },
    { id: "italian", name: "Italian", note: "Pasta, risotto, sauces", emoji: "🍝" },
    { id: "japanese", name: "Japanese", note: "Clean, balanced, umami", emoji: "🍣" },
    { id: "mexican", name: "Mexican", note: "Salsa, masa, bright herbs", emoji: "🌮" },
    { id: "indian", name: "Indian", note: "Spice-layered, aromatic", emoji: "🍛" },
    { id: "middle-eastern", name: "Middle Eastern", note: "Tahini, sumac, herbs", emoji: "🧆" },
    { id: "thai", name: "Thai", note: "Sweet, sour, salty, spicy", emoji: "🌿" },
    { id: "korean", name: "Korean", note: "Gochujang, ferments, banchan", emoji: "🥢" },
    { id: "french", name: "French", note: "Technique, butter, sauces", emoji: "🥖" },
    { id: "american", name: "American Comfort", note: "Diner, BBQ, soul food", emoji: "🍔" },
    { id: "mediterranean", name: "Mediterranean", note: "Olive oil, lemon, vegetables", emoji: "🫒" },
    { id: "chinese", name: "Chinese", note: "Stir-fry, braise, dumpling", emoji: "🥟" },
    { id: "caribbean", name: "Caribbean", note: "Jerk, allspice, rice & peas", emoji: "🌴" },
    { id: "surprise", name: "Surprise Me", note: "Chef picks the cuisine", emoji: "🎲" },
  ];

  const skills = [
    { id: "quick", name: "Quick & Easy", tagline: "Under 25 min, weeknight", accent: "#2c6e5b" },
    { id: "healthy", name: "Healthy", tagline: "Balanced, fresh, lighter", accent: "#557a3a" },
    { id: "budget", name: "Budget", tagline: "Stretch what you have", accent: "#a87432" },
    { id: "datenight", name: "Date Night", tagline: "Plated, romantic, impressive", accent: "#9b2c4a" },
    { id: "advanced", name: "Advanced", tagline: "Real technique for cooks", accent: "#5b3a7c" },
    { id: "surprise", name: "Surprise Me", tagline: "Chef picks the vibe", accent: "#c84d2c" },
  ];

  const dietOptions = [
    { id: "vegetarian", name: "Vegetarian" },
    { id: "vegan", name: "Vegan" },
    { id: "pescatarian", name: "Pescatarian" },
    { id: "halal", name: "Halal" },
    { id: "kosher", name: "Kosher" },
    { id: "gluten-free", name: "Gluten-free" },
    { id: "dairy-free", name: "Dairy-free" },
    { id: "nut-free", name: "Nut-free" },
  ];

  const commonIngredients = [
    "onion", "garlic", "tomato", "olive oil", "butter", "eggs",
    "rice", "pasta", "chicken", "ground beef", "lemon", "ginger",
    "potatoes", "carrots", "bell pepper", "spinach",
  ];

  async function startCamera() {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setStreamActive(true);
    } catch (err) {
      setError("Couldn't open camera. Try uploading or typing instead.");
    }
  }

  function stopCamera() {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setStreamActive(false);
  }

  useEffect(() => () => stopCamera(), []);

  function captureFromVideo() {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext("2d").drawImage(video, 0, 0, canvas.width, canvas.height);
    setImageData(canvas.toDataURL("image/jpeg", 0.85));
    stopCamera();
    setStage("preview");
  }

  function handleFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => { setImageData(ev.target.result); setStage("preview"); };
    reader.readAsDataURL(file);
  }

  function reset() {
    stopCamera();
    setImageData(null); setTypedText(""); setIngredients([]);
    setCuisine(null); setSkill(null); setDiets([]);
    setRecipeOptions([]); setRecipe(null); setError(null);
    setStage("entry");
  }

  function toggleDiet(id) {
    setDiets((prev) => (prev.includes(id) ? prev.filter((d) => d !== id) : [...prev, id]));
  }

  function addQuickIngredient(item) {
    const current = typedText.trim();
    if (current.toLowerCase().includes(item.toLowerCase())) return;
    setTypedText(current ? `${current}, ${item}` : item);
  }

  function submitTyped() {
    const items = typedText.split(/[,\n]/).map((s) => s.trim()).filter((s) => s.length > 0);
    if (items.length === 0) { setError("Type at least one ingredient."); return; }
    setIngredients(items); setError(null); setStage("cuisine");
  }

  async function detectIngredients() {
    setStage("detecting"); setError(null);
    try {
      const base64 = imageData.split(",")[1];
      const res = await fetch("/api/detect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: base64 }),
      });
      if (!res.ok) throw new Error("API error");
      const data = await res.json();
      if (!Array.isArray(data.ingredients) || data.ingredients.length === 0) throw new Error("No ingredients");
      setIngredients(data.ingredients); setStage("cuisine");
    } catch (err) {
      setError("Couldn't read the ingredients. Try a clearer photo or type them in.");
      setStage("preview");
    }
  }

  async function fetchRecipeOptions() {
    setStage("naming"); setError(null);
    try {
      const res = await fetch("/api/recipe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ingredients, cuisine, skill, diets, mode: "names" }),
      });
      if (!res.ok) throw new Error("API error");
      const data = await res.json();
      if (!Array.isArray(data.options) || data.options.length === 0) throw new Error("No options");
      setRecipeOptions(data.options); setStage("choose");
    } catch (err) {
      setError("The kitchen had a moment. Try again?"); setStage("diet");
    }
  }

  async function pickRecipe(option) {
    setStage("cooking"); setError(null);
    try {
      const res = await fetch("/api/recipe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ingredients, cuisine, skill, diets, mode: "full",
          chosenName: option.name, chosenTagline: option.tagline,
        }),
      });
      if (!res.ok) throw new Error("API error");
      const data = await res.json();
      setRecipe(data.recipe); setStage("result");
    } catch (err) {
      setError("Couldn't compose the full recipe. Try another?"); setStage("choose");
    }
  }

  const cuisineLabel = cuisines.find((c) => c.id === cuisine)?.name;
  const skillObj = skills.find((s) => s.id === skill);
  const skillLabel = skillObj?.name;
  const skillAccent = skillObj?.accent || "#c84d2c";

  return (
    <>
      <GlobalStyles />
      <div className="page">
        <div className="grain" />
        <div className="container">
          <Header />

          {error && <ErrorBanner text={error} onDismiss={() => setError(null)} />}

          {stage === "entry" && (
            <FadeIn>
              <div className="masthead">
                <div className="masthead-line">TONIGHT'S QUESTION</div>
                <h2 className="masthead-q">What do you have?</h2>
                <p className="masthead-sub">Snap a photo, or just type it out. We'll take it from there.</p>
              </div>
              <div className="entry-grid">
                <EntryCard onClick={() => setStage("capture")} icon={<Camera size={26} strokeWidth={1.5} />} title="Photograph" sub="Let me see what you have" />
                <EntryCard onClick={() => fileInputRef.current?.click()} icon={<Upload size={26} strokeWidth={1.5} />} title="Upload" sub="From your photo library" />
                <EntryCard onClick={() => setStage("typing")} icon={<Type size={26} strokeWidth={1.5} />} title="Type it" sub="List what's on the counter" wide />
              </div>
              <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFile} style={{ display: "none" }} />
            </FadeIn>
          )}

          {stage === "typing" && (
            <FadeIn>
              <BackBar onBack={() => { setTypedText(""); setStage("entry"); }} />
              <h2 className="step-title">What's in the kitchen?</h2>
              <p className="step-sub">Separate with commas. Vague is fine — "leftover chicken," "half a lemon."</p>
              <textarea
                className="ingredient-input"
                placeholder="onion, garlic, leftover chicken, half a lemon, scotch bonnet…"
                value={typedText}
                onChange={(e) => setTypedText(e.target.value)}
                rows={5}
                autoFocus
              />
              <div className="quick-label">QUICK ADD</div>
              <div className="quick-chips">
                {commonIngredients.map((item) => {
                  const added = typedText.toLowerCase().includes(item.toLowerCase());
                  return (
                    <button key={item} onClick={() => addQuickIngredient(item)} className={`quick-chip ${added ? "is-added" : ""}`}>
                      {added ? <Check size={12} /> : <Plus size={12} />} {item}
                    </button>
                  );
                })}
              </div>
              <PrimaryBtn onClick={submitTyped} icon={<Sparkles size={16} />}>Use these ingredients</PrimaryBtn>
            </FadeIn>
          )}

          {stage === "capture" && (
            <FadeIn>
              <BackBar onBack={() => { stopCamera(); setStage("entry"); }} />
              {streamActive ? (
                <div className="cam-frame">
                  <video ref={videoRef} playsInline muted />
                  <button onClick={stopCamera} className="cam-close" aria-label="Close camera"><X size={20} /></button>
                  <div className="cam-shutter-wrap"><button onClick={captureFromVideo} className="cam-shutter" aria-label="Capture" /></div>
                </div>
              ) : (
                <div className="cam-prompt">
                  <Camera size={40} strokeWidth={1.3} style={{ opacity: 0.5, marginBottom: "0.75rem" }} />
                  <p className="cam-prompt-line">Open the fridge.</p>
                  <p className="cam-prompt-line"><em>Show me everything.</em></p>
                  <PrimaryBtn onClick={startCamera} icon={<Camera size={16} />}>Start the camera</PrimaryBtn>
                </div>
              )}
            </FadeIn>
          )}

          {stage === "preview" && imageData && (
            <FadeIn>
              <BackBar onBack={reset} />
              <div className="photo-frame"><img src={imageData} alt="Your ingredients" /></div>
              <PrimaryBtn onClick={detectIngredients} icon={<Sparkles size={16} />}>Read these ingredients</PrimaryBtn>
              <GhostBtn onClick={reset} icon={<RotateCcw size={14} />}>Try another way</GhostBtn>
            </FadeIn>
          )}

          {stage === "detecting" && <Loading label="Reading the photo…" subline="Looking at every shelf and corner." />}

          {stage === "cuisine" && (
            <FadeIn>
              <IngredientShelf items={ingredients} />
              <StepHeader step={1} total={3} title="Where in the world?" subtitle="The cuisine sets the soul of the dish." />
              <div className="cuisine-grid">
                {cuisines.map((c, i) => (
                  <button key={c.id} onClick={() => { setCuisine(c.id); setStage("skill"); }} className="cuisine-card" style={{ animationDelay: `${i * 30}ms` }}>
                    <div className="cuisine-emoji">{c.emoji}</div>
                    <div className="cuisine-name">{c.name}</div>
                    <div className="cuisine-note">{c.note}</div>
                  </button>
                ))}
              </div>
              <GhostBtn onClick={reset} icon={<RotateCcw size={14} />}>Start over</GhostBtn>
            </FadeIn>
          )}

          {stage === "skill" && (
            <FadeIn>
              <BackBar onBack={() => setStage("cuisine")} crumbs={[cuisineLabel]} />
              <StepHeader step={2} total={3} title="How are we cooking?" subtitle="The vibe shapes the recipe." />
              <div className="skill-list">
                {skills.map((s, i) => (
                  <button key={s.id} onClick={() => { setSkill(s.id); setStage("diet"); }} className="skill-card" style={{ "--accent": s.accent, animationDelay: `${i * 40}ms` }}>
                    <div>
                      <div className="skill-name">{s.name}</div>
                      <div className="skill-tag">{s.tagline}</div>
                    </div>
                    <div className="skill-arrow">→</div>
                  </button>
                ))}
              </div>
            </FadeIn>
          )}

          {stage === "diet" && (
            <FadeIn>
              <BackBar onBack={() => setStage("skill")} crumbs={[cuisineLabel, skillLabel]} />
              <StepHeader step={3} total={3} title="Any dietary needs?" subtitle="Tap any that apply, or skip." />
              <div className="diet-chips">
                {dietOptions.map((d, i) => {
                  const active = diets.includes(d.id);
                  return (
                    <button key={d.id} onClick={() => toggleDiet(d.id)} className={`diet-chip ${active ? "is-active" : ""}`} style={{ animationDelay: `${i * 30}ms` }}>
                      {active && <Check size={13} />} {d.name}
                    </button>
                  );
                })}
              </div>
              <PrimaryBtn onClick={fetchRecipeOptions} icon={<Sparkles size={16} />}>Show me three dishes</PrimaryBtn>
              {diets.length === 0 && <p className="diet-skip">No dietary needs? Just hit the button above.</p>}
            </FadeIn>
          )}

          {stage === "naming" && <Loading label="Brainstorming dishes…" subline="Three I'd want to cook from this." />}

          {stage === "choose" && (
            <FadeIn>
              <BackBar onBack={() => setStage("diet")} crumbs={[cuisineLabel, skillLabel, ...diets.map((d) => dietOptions.find((o) => o.id === d)?.name).filter(Boolean)]} />
              <div className="result-pretitle">THREE DISHES</div>
              <h2 className="result-title">I'd cook from this</h2>
              <div className="dish-list">
                {recipeOptions.map((opt, i) => (
                  <button key={i} onClick={() => pickRecipe(opt)} className="dish-card" style={{ "--accent": skillAccent, animationDelay: `${i * 80}ms` }}>
                    <div className="dish-num">№ {String(i + 1).padStart(2, "0")}</div>
                    <h3 className="dish-name">{opt.name}</h3>
                    <p className="dish-tag">{opt.tagline}</p>
                    <div className="dish-meta">
                      <span>{opt.time}</span>
                      <span className="dot">•</span>
                      <span>{opt.difficulty}</span>
                    </div>
                  </button>
                ))}
              </div>
              <GhostBtn onClick={fetchRecipeOptions} icon={<RotateCcw size={14} />}>Three more</GhostBtn>
            </FadeIn>
          )}

          {stage === "cooking" && <Loading label="Composing your dish…" subline="Quantities, timings, the chef's note." />}

          {stage === "result" && recipe && (
            <FadeIn>
              <BackBar onBack={() => setStage("choose")} crumbs={[cuisineLabel, skillLabel]} />
              <article className="recipe">
                <div className="recipe-frame" style={{ "--accent": skillAccent }}>
                  <div className="recipe-pretitle">A RECIPE</div>
                  <h2 className="recipe-title">{recipe.name}</h2>
                  <p className="recipe-tagline">{recipe.tagline}</p>
                  <div className="recipe-meta">
                    <Meta label="TIME" value={recipe.time} />
                    <span className="meta-divider" />
                    <Meta label="LEVEL" value={recipe.difficulty} />
                    {recipe.servings && (<><span className="meta-divider" /><Meta label="SERVES" value={recipe.servings} /></>)}
                  </div>
                </div>
                <Sect title="From your kitchen">
                  <div className="pills">{recipe.uses?.map((u, i) => <span key={i} className="pill pill-strong">{u}</span>)}</div>
                </Sect>
                {recipe.extras?.length > 0 && (
                  <Sect title="Pantry add-ins">
                    <div className="pills">{recipe.extras.map((e, i) => <span key={i} className="pill pill-muted">{e}</span>)}</div>
                  </Sect>
                )}
                <Sect title="Method">
                  <ol className="steps">
                    {recipe.steps?.map((s, i) => (
                      <li key={i}><span className="step-n">{String(i + 1).padStart(2, "0")}</span><span>{s}</span></li>
                    ))}
                  </ol>
                </Sect>
                {recipe.chefNote && (
                  <div className="chef-note" style={{ "--accent": skillAccent }}>
                    <div className="chef-note-label">A NOTE FROM THE CHEF</div>
                    <p>{recipe.chefNote}</p>
                  </div>
                )}
              </article>
              <GhostBtn onClick={() => setStage("choose")}>Back to dish choices</GhostBtn>
              <GhostBtn onClick={reset} icon={<RotateCcw size={14} />}>Start fresh</GhostBtn>
            </FadeIn>
          )}

          <canvas ref={canvasRef} style={{ display: "none" }} />
          <Footer />
        </div>
      </div>
    </>
  );
}

function Header() {
  return (
    <header className="header">
      <div className="header-rule" />
      <div className="header-eyebrow">VOL. I · A KITCHEN ORACLE</div>
      <h1 className="header-title">What Should<br /><em>I Cook?</em></h1>
      <div className="header-rule" />
    </header>
  );
}

function Footer() {
  return (
    <footer className="footer">
      <div className="footer-rule" />
      <div className="footer-text">Made with hunger · {new Date().getFullYear()}</div>
    </footer>
  );
}

function FadeIn({ children }) { return <div className="fadein">{children}</div>; }

function EntryCard({ onClick, icon, title, sub, wide }) {
  return (
    <button onClick={onClick} className={`entry-card ${wide ? "is-wide" : ""}`}>
      <div className="entry-icon">{icon}</div>
      <div className="entry-title">{title}</div>
      <div className="entry-sub">{sub}</div>
    </button>
  );
}

function BackBar({ onBack, crumbs = [] }) {
  return (
    <div className="backbar">
      <button onClick={onBack} className="back-btn"><ArrowLeft size={14} /> Back</button>
      {crumbs.length > 0 && <div className="crumbs">{crumbs.filter(Boolean).join(" · ")}</div>}
    </div>
  );
}

function IngredientShelf({ items }) {
  return (
    <div className="shelf">
      <div className="shelf-label">ON HAND</div>
      <div className="pills">
        {items.map((ing, i) => (
          <span key={i} className="pill pill-strong" style={{ animationDelay: `${i * 25}ms` }}>{ing}</span>
        ))}
      </div>
    </div>
  );
}

function StepHeader({ step, total, title, subtitle }) {
  return (
    <div className="step-head">
      <div className="step-eyebrow">STEP {step} OF {total}</div>
      <h2 className="step-title">{title}</h2>
      <p className="step-sub">{subtitle}</p>
    </div>
  );
}

function Loading({ label, subline }) {
  return (
    <div className="loading">
      <Loader2 size={32} strokeWidth={1.5} className="spin" />
      <div className="loading-label">{label}</div>
      <div className="loading-sub">{subline}</div>
    </div>
  );
}

function PrimaryBtn({ onClick, icon, children }) {
  return <button onClick={onClick} className="btn-primary">{icon}<span>{children}</span></button>;
}

function GhostBtn({ onClick, icon, children }) {
  return <button onClick={onClick} className="btn-ghost">{icon}<span>{children}</span></button>;
}

function Sect({ title, children }) {
  return (
    <section className="sect">
      <h3 className="sect-title">{title}</h3>
      {children}
    </section>
  );
}

function Meta({ label, value }) {
  return (
    <div className="meta">
      <div className="meta-label">{label}</div>
      <div className="meta-value">{value}</div>
    </div>
  );
}

function ErrorBanner({ text, onDismiss }) {
  return (
    <div className="error-banner">
      <span>{text}</span>
      <button onClick={onDismiss} aria-label="Dismiss"><X size={14} /></button>
    </div>
  );
}

function GlobalStyles() {
  return (
    <style>{`
      @import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,400;0,9..144,500;0,9..144,600;1,9..144,400;1,9..144,500&family=Source+Serif+4:ital,wght@0,400;0,500;0,600;1,400&family=JetBrains+Mono:wght@400;500&display=swap');
      :root {
        --cream: #f5efe2; --cream-deep: #efe6d2; --paper: #faf6ec;
        --ink: #1f1a14; --ink-soft: #4a3f30; --ink-muted: #8a7d68;
        --terracotta: #c84d2c; --terracotta-deep: #a13a1f;
        --rule: rgba(31, 26, 20, 0.18); --rule-soft: rgba(31, 26, 20, 0.08);
      }
      * { box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
      html, body, #root { margin: 0; padding: 0; min-height: 100%; background: var(--cream); }
      body { -webkit-font-smoothing: antialiased; }
      .page {
        min-height: 100vh; background: var(--cream); color: var(--ink);
        font-family: 'Source Serif 4', Georgia, serif;
        font-size: 17px; line-height: 1.55;
        padding: 1.5rem 1.1rem 4rem;
        position: relative; overflow-x: hidden;
      }
      .grain {
        position: fixed; inset: 0; pointer-events: none;
        opacity: 0.35; mix-blend-mode: multiply;
        background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='240' height='240'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' seed='4'/%3E%3CfeColorMatrix values='0 0 0 0 0.12 0 0 0 0 0.10 0 0 0 0 0.08 0 0 0 0.5 0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
        z-index: 0;
      }
      .container { max-width: 520px; margin: 0 auto; position: relative; z-index: 1; }

      .header { text-align: center; margin-bottom: 2.5rem; padding-top: 0.5rem; }
      .header-rule { height: 1px; background: var(--ink); margin: 0.6rem auto; width: 60%; opacity: 0.7; }
      .header-eyebrow { font-family: 'JetBrains Mono', monospace; font-size: 0.62rem; letter-spacing: 0.32em; color: var(--ink-muted); margin: 0.6rem 0; }
      .header-title { font-family: 'Fraunces', Georgia, serif; font-variation-settings: "opsz" 144; font-size: clamp(3rem, 11vw, 4.4rem); font-weight: 400; letter-spacing: -0.035em; line-height: 0.95; margin: 0.4rem 0 0.6rem; color: var(--ink); }
      .header-title em { font-style: italic; color: var(--terracotta); font-weight: 500; }

      .footer { margin-top: 4rem; text-align: center; }
      .footer-rule { height: 1px; background: var(--rule); margin: 1.5rem auto; width: 40%; }
      .footer-text { font-family: 'JetBrains Mono', monospace; font-size: 0.65rem; letter-spacing: 0.25em; color: var(--ink-muted); }

      .masthead { text-align: center; margin-bottom: 1.5rem; }
      .masthead-line { font-family: 'JetBrains Mono', monospace; font-size: 0.65rem; letter-spacing: 0.28em; color: var(--ink-muted); margin-bottom: 0.4rem; }
      .masthead-q { font-family: 'Fraunces', serif; font-variation-settings: "opsz" 96; font-size: 2rem; font-weight: 400; font-style: italic; margin: 0 0 0.4rem; letter-spacing: -0.01em; }
      .masthead-sub { color: var(--ink-soft); margin: 0; font-size: 0.95rem; }

      .entry-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0.7rem; margin-bottom: 1rem; }
      .entry-card { background: var(--paper); border: 1px solid var(--rule); border-radius: 4px; padding: 1.5rem 1rem; text-align: center; cursor: pointer; font-family: inherit; color: var(--ink); transition: all 0.2s ease; box-shadow: 0 1px 0 rgba(31,26,20,0.04); }
      .entry-card:hover { background: var(--cream-deep); transform: translateY(-1px); box-shadow: 0 4px 12px rgba(31,26,20,0.06); }
      .entry-card.is-wide { grid-column: span 2; }
      .entry-icon { display: flex; justify-content: center; color: var(--terracotta); margin-bottom: 0.6rem; }
      .entry-title { font-family: 'Fraunces', serif; font-size: 1.15rem; font-style: italic; font-weight: 500; margin-bottom: 0.15rem; }
      .entry-sub { font-size: 0.82rem; color: var(--ink-muted); }

      .ingredient-input { width: 100%; background: var(--paper); border: 1px solid var(--rule); border-radius: 4px; padding: 1rem 1.1rem; font-family: 'Source Serif 4', serif; font-size: 1rem; line-height: 1.55; color: var(--ink); resize: vertical; min-height: 120px; margin-bottom: 1rem; }
      .ingredient-input:focus { outline: none; border-color: var(--terracotta); background: #fff; }
      .ingredient-input::placeholder { color: var(--ink-muted); font-style: italic; }

      .quick-label { font-family: 'JetBrains Mono', monospace; font-size: 0.62rem; letter-spacing: 0.28em; color: var(--ink-muted); margin-bottom: 0.5rem; }
      .quick-chips { display: flex; flex-wrap: wrap; gap: 5px; margin-bottom: 1.25rem; }
      .quick-chip { display: inline-flex; align-items: center; gap: 4px; background: transparent; border: 1px solid var(--rule); border-radius: 999px; padding: 0.32rem 0.7rem; font-family: inherit; font-size: 0.83rem; color: var(--ink-soft); cursor: pointer; transition: all 0.18s; }
      .quick-chip:hover { border-color: var(--ink); color: var(--ink); }
      .quick-chip.is-added { background: var(--terracotta); border-color: var(--terracotta); color: var(--paper); }

      .cam-frame { position: relative; }
      .cam-frame video { width: 100%; aspect-ratio: 3/4; object-fit: cover; background: #000; border-radius: 4px; }
      .cam-close { position: absolute; right: 12px; top: 12px; width: 38px; height: 38px; border-radius: 50%; background: rgba(31,26,20,0.7); color: var(--paper); border: none; cursor: pointer; display: flex; align-items: center; justify-content: center; }
      .cam-shutter-wrap { position: absolute; bottom: 18px; left: 0; right: 0; display: flex; justify-content: center; }
      .cam-shutter { width: 68px; height: 68px; border-radius: 50%; background: var(--paper); border: 4px solid rgba(31,26,20,0.5); cursor: pointer; }
      .cam-shutter:active { transform: scale(0.95); }
      .cam-prompt { background: var(--paper); border: 1px dashed var(--rule); border-radius: 4px; padding: 2.5rem 1.5rem; text-align: center; margin-bottom: 1.5rem; }
      .cam-prompt-line { font-family: 'Fraunces', serif; font-size: 1.4rem; margin: 0; line-height: 1.3; }
      .cam-prompt-line em { color: var(--terracotta); font-style: italic; }

      .photo-frame { background: var(--paper); padding: 8px; border: 1px solid var(--rule); border-radius: 4px; margin-bottom: 1rem; }
      .photo-frame img { width: 100%; display: block; border-radius: 2px; }

      .shelf { background: var(--paper); border: 1px solid var(--rule); border-radius: 4px; padding: 0.85rem 1rem; margin-bottom: 1.75rem; }
      .shelf-label { font-family: 'JetBrains Mono', monospace; font-size: 0.62rem; letter-spacing: 0.28em; color: var(--ink-muted); margin-bottom: 0.5rem; }

      .step-head { margin-bottom: 1.25rem; }
      .step-eyebrow { font-family: 'JetBrains Mono', monospace; font-size: 0.62rem; letter-spacing: 0.28em; color: var(--ink-muted); margin-bottom: 0.4rem; }
      .step-title { font-family: 'Fraunces', serif; font-variation-settings: "opsz" 72; font-size: 1.8rem; font-weight: 400; font-style: italic; margin: 0; line-height: 1.05; letter-spacing: -0.015em; }
      .step-sub { font-size: 0.92rem; color: var(--ink-soft); margin: 0.4rem 0 0; }

      .backbar { display: flex; align-items: center; gap: 0.85rem; margin-bottom: 1.25rem; flex-wrap: wrap; }
      .back-btn { display: inline-flex; align-items: center; gap: 4px; background: transparent; border: none; color: var(--ink-soft); cursor: pointer; font-family: inherit; font-size: 0.88rem; padding: 0; }
      .back-btn:hover { color: var(--terracotta); }
      .crumbs { font-family: 'JetBrains Mono', monospace; font-size: 0.68rem; letter-spacing: 0.08em; color: var(--ink-muted); }

      .pills { display: flex; flex-wrap: wrap; gap: 5px; }
      .pill { padding: 0.28rem 0.7rem; border-radius: 999px; font-size: 0.82rem; display: inline-block; animation: chipIn 0.4s both; }
      .pill-strong { background: rgba(200, 77, 44, 0.12); color: var(--terracotta-deep); border: 1px solid rgba(200, 77, 44, 0.25); }
      .pill-muted { background: rgba(31,26,20,0.05); color: var(--ink-soft); border: 1px solid var(--rule-soft); }

      .cuisine-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 1.5rem; }
      .cuisine-card { background: var(--paper); border: 1px solid var(--rule); border-radius: 4px; padding: 0.95rem 0.75rem; cursor: pointer; font-family: inherit; text-align: left; color: var(--ink); transition: all 0.2s; animation: cardIn 0.5s both; position: relative; }
      .cuisine-card:hover { background: #fff; transform: translateY(-1px); box-shadow: 0 4px 14px rgba(31,26,20,0.07); border-color: var(--ink); }
      .cuisine-emoji { font-size: 1.5rem; margin-bottom: 0.35rem; }
      .cuisine-name { font-family: 'Fraunces', serif; font-size: 1.02rem; font-weight: 500; font-style: italic; line-height: 1.1; margin-bottom: 0.15rem; }
      .cuisine-note { font-size: 0.74rem; color: var(--ink-muted); line-height: 1.3; }

      .skill-list { margin-bottom: 1.5rem; }
      .skill-card { width: 100%; display: flex; align-items: center; justify-content: space-between; gap: 1rem; padding: 1rem 1.1rem; margin-bottom: 0.55rem; background: var(--paper); border: 1px solid var(--rule); border-left: 4px solid var(--accent); border-radius: 4px; cursor: pointer; font-family: inherit; color: var(--ink); text-align: left; transition: all 0.2s; animation: cardIn 0.5s both; }
      .skill-card:hover { background: #fff; transform: translateX(2px); box-shadow: 0 4px 14px rgba(31,26,20,0.06); }
      .skill-name { font-family: 'Fraunces', serif; font-size: 1.15rem; font-style: italic; font-weight: 500; margin-bottom: 0.1rem; }
      .skill-tag { font-size: 0.86rem; color: var(--ink-muted); }
      .skill-arrow { font-family: 'Fraunces', serif; font-size: 1.3rem; color: var(--accent); opacity: 0.7; transition: transform 0.2s; }
      .skill-card:hover .skill-arrow { transform: translateX(3px); opacity: 1; }

      .diet-chips { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 1.5rem; }
      .diet-chip { display: inline-flex; align-items: center; gap: 5px; padding: 0.5rem 0.9rem; background: var(--paper); border: 1px solid var(--rule); border-radius: 999px; cursor: pointer; font-family: inherit; font-size: 0.9rem; color: var(--ink-soft); animation: chipIn 0.4s both; transition: all 0.2s; }
      .diet-chip:hover { border-color: var(--ink); color: var(--ink); }
      .diet-chip.is-active { background: var(--terracotta); border-color: var(--terracotta); color: var(--paper); }
      .diet-skip { font-size: 0.82rem; color: var(--ink-muted); font-style: italic; text-align: center; margin: 0.6rem 0 0; }

      .result-pretitle { font-family: 'JetBrains Mono', monospace; font-size: 0.66rem; letter-spacing: 0.32em; color: var(--ink-muted); margin-bottom: 0.3rem; }
      .result-title { font-family: 'Fraunces', serif; font-variation-settings: "opsz" 96; font-size: 2rem; font-weight: 400; font-style: italic; margin: 0 0 1.5rem; letter-spacing: -0.015em; }
      .dish-list { margin-bottom: 1rem; }
      .dish-card { width: 100%; background: var(--paper); border: 1px solid var(--rule); border-left: 4px solid var(--accent); border-radius: 4px; padding: 1.1rem 1.2rem; margin-bottom: 0.75rem; text-align: left; cursor: pointer; font-family: inherit; color: var(--ink); transition: all 0.25s; animation: cardIn 0.6s both; }
      .dish-card:hover { background: #fff; transform: translateY(-1px); box-shadow: 0 6px 18px rgba(31,26,20,0.08); }
      .dish-num { font-family: 'JetBrains Mono', monospace; font-size: 0.65rem; letter-spacing: 0.18em; color: var(--accent); margin-bottom: 0.35rem; }
      .dish-name { font-family: 'Fraunces', serif; font-variation-settings: "opsz" 72; font-size: 1.3rem; font-style: italic; font-weight: 500; margin: 0 0 0.4rem; color: var(--ink); line-height: 1.15; }
      .dish-tag { font-size: 0.93rem; color: var(--ink-soft); margin: 0 0 0.55rem; font-style: italic; }
      .dish-meta { font-family: 'JetBrains Mono', monospace; font-size: 0.72rem; letter-spacing: 0.08em; color: var(--ink-muted); text-transform: uppercase; display: flex; gap: 6px; }
      .dish-meta .dot { opacity: 0.5; }

      .recipe { margin-bottom: 1.25rem; }
      .recipe-frame { background: var(--paper); border: 1px solid var(--rule); border-top: 3px solid var(--accent); border-radius: 4px; padding: 1.5rem 1.3rem 1.3rem; margin-bottom: 1.5rem; text-align: center; }
      .recipe-pretitle { font-family: 'JetBrains Mono', monospace; font-size: 0.62rem; letter-spacing: 0.32em; color: var(--ink-muted); margin-bottom: 0.4rem; }
      .recipe-title { font-family: 'Fraunces', serif; font-variation-settings: "opsz" 144; font-size: clamp(2rem, 7vw, 2.6rem); font-weight: 500; font-style: italic; line-height: 1.05; letter-spacing: -0.02em; margin: 0 0 0.5rem; color: var(--accent); }
      .recipe-tagline { font-size: 1rem; color: var(--ink-soft); font-style: italic; margin: 0 0 1.1rem; }
      .recipe-meta { display: flex; justify-content: center; align-items: stretch; gap: 1.2rem; padding-top: 0.8rem; border-top: 1px solid var(--rule-soft); }
      .meta-divider { width: 1px; background: var(--rule-soft); }
      .meta-label { font-family: 'JetBrains Mono', monospace; font-size: 0.6rem; letter-spacing: 0.22em; color: var(--ink-muted); }
      .meta-value { font-family: 'Fraunces', serif; font-size: 0.95rem; font-style: italic; margin-top: 0.2rem; color: var(--ink); }

      .sect { margin-bottom: 1.5rem; }
      .sect-title { font-family: 'JetBrains Mono', monospace; font-size: 0.65rem; letter-spacing: 0.28em; color: var(--ink-muted); margin: 0 0 0.6rem; font-weight: 500; }

      .steps { list-style: none; padding: 0; margin: 0; }
      .steps li { display: flex; gap: 1rem; margin-bottom: 0.85rem; line-height: 1.6; }
      .step-n { font-family: 'JetBrains Mono', monospace; font-size: 0.7rem; color: var(--terracotta); flex-shrink: 0; padding-top: 0.25rem; letter-spacing: 0.05em; }

      .chef-note { background: var(--paper); border-left: 3px solid var(--accent); padding: 1rem 1.15rem; margin: 1.5rem 0; border-radius: 2px; }
      .chef-note-label { font-family: 'JetBrains Mono', monospace; font-size: 0.62rem; letter-spacing: 0.28em; color: var(--ink-muted); margin-bottom: 0.4rem; }
      .chef-note p { font-family: 'Fraunces', serif; font-style: italic; font-size: 1.05rem; margin: 0; line-height: 1.5; color: var(--ink); }

      .btn-primary { width: 100%; display: flex; align-items: center; justify-content: center; gap: 8px; padding: 1rem 1.1rem; background: var(--ink); color: var(--paper); border: none; border-radius: 4px; font-family: 'Fraunces', serif; font-size: 1.02rem; font-style: italic; font-weight: 500; cursor: pointer; margin-bottom: 0.55rem; letter-spacing: 0.005em; transition: all 0.2s; }
      .btn-primary:hover { background: var(--terracotta); transform: translateY(-1px); box-shadow: 0 6px 16px rgba(200, 77, 44, 0.25); }
      .btn-primary:active { transform: translateY(0); }

      .btn-ghost { width: 100%; display: flex; align-items: center; justify-content: center; gap: 6px; padding: 0.85rem 1rem; background: transparent; color: var(--ink-soft); border: 1px solid var(--rule); border-radius: 4px; font-family: inherit; font-size: 0.92rem; font-style: italic; cursor: pointer; transition: all 0.2s; }
      .btn-ghost:hover { border-color: var(--ink); color: var(--ink); background: var(--paper); }

      .loading { text-align: center; padding: 4rem 0; }
      .loading .spin { animation: spin 1.2s linear infinite; color: var(--terracotta); }
      .loading-label { font-family: 'Fraunces', serif; font-size: 1.3rem; font-style: italic; margin-top: 1rem; color: var(--ink); }
      .loading-sub { font-size: 0.9rem; color: var(--ink-muted); font-style: italic; margin-top: 0.25rem; }

      .error-banner { background: rgba(200, 77, 44, 0.12); border: 1px solid rgba(200, 77, 44, 0.4); color: var(--terracotta-deep); padding: 0.7rem 0.9rem; border-radius: 4px; margin-bottom: 1rem; font-size: 0.9rem; display: flex; justify-content: space-between; align-items: center; gap: 0.6rem; }
      .error-banner button { background: none; border: none; color: inherit; cursor: pointer; padding: 4px; display: flex; }

      .fadein { animation: fadein 0.4s ease both; }
      @keyframes fadein { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
      @keyframes cardIn { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
      @keyframes chipIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
      @keyframes spin { to { transform: rotate(360deg); } }
    `}</style>
  );
}
