import React, { useState, useRef, useEffect } from "react";
import { Camera, Upload, Sparkles, Loader2, X, RotateCcw, ArrowLeft, Type, Plus, Check, Info } from "lucide-react";

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
  const [showAbout, setShowAbout] = useState(false);

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);
  const streamRef = useRef(null);

  const cuisines = [
    { id: "west-african", name: "West African", note: "Nigerian, Ghanaian", emoji: "🌶️" },
    { id: "italian", name: "Italian", note: "Pasta, risotto", emoji: "🍝" },
    { id: "japanese", name: "Japanese", note: "Clean, umami", emoji: "🍣" },
    { id: "mexican", name: "Mexican", note: "Salsa, masa", emoji: "🌮" },
    { id: "indian", name: "Indian", note: "Spice-layered", emoji: "🍛" },
    { id: "middle-eastern", name: "Middle Eastern", note: "Tahini, sumac", emoji: "🧆" },
    { id: "thai", name: "Thai", note: "Sweet, sour, spicy", emoji: "🌿" },
    { id: "korean", name: "Korean", note: "Gochujang, ferments", emoji: "🥢" },
    { id: "french", name: "French", note: "Technique, butter", emoji: "🥖" },
    { id: "american", name: "American Comfort", note: "Diner, BBQ, soul", emoji: "🍔" },
    { id: "mediterranean", name: "Mediterranean", note: "Olive oil, lemon", emoji: "🫒" },
    { id: "chinese", name: "Chinese", note: "Stir-fry, braise", emoji: "🥟" },
    { id: "caribbean", name: "Caribbean", note: "Jerk, allspice", emoji: "🌴" },
    { id: "surprise", name: "Surprise Me", note: "Chef picks", emoji: "🎲" },
  ];

  const skills = [
    { id: "quick", name: "Quick & Easy", tagline: "Under 25 min, weeknight" },
    { id: "healthy", name: "Healthy", tagline: "Balanced, fresh, lighter" },
    { id: "budget", name: "Budget", tagline: "Stretch what you have" },
    { id: "datenight", name: "Date Night", tagline: "Plated, romantic, impressive" },
    { id: "advanced", name: "Advanced", tagline: "Real technique for cooks" },
    { id: "surprise", name: "Surprise Me", tagline: "Chef picks the vibe" },
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
      setError("Couldn't read the photo. Try better light or just type the ingredients.");
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

  return (
    <>
      <GlobalStyles />
      <div className="page">
        <div className="container">
          <Header onAboutClick={() => setShowAbout(true)} />

          {error && <ErrorBanner text={error} onDismiss={() => setError(null)} />}

          {stage === "entry" && (
            <FadeIn>
              <div className="masthead">
                <div className="masthead-q">What do you have?</div>
                <div className="masthead-sub">SNAP IT. UPLOAD IT. TYPE IT.</div>
              </div>
              <div className="entry-grid">
                <EntryCard onClick={() => setStage("capture")} icon={<Camera size={28} strokeWidth={2.2} />} title="Photograph" sub="Show me the fridge" num="01" />
                <EntryCard onClick={() => fileInputRef.current?.click()} icon={<Upload size={28} strokeWidth={2.2} />} title="Upload" sub="From your library" num="02" />
                <EntryCard onClick={() => setStage("typing")} icon={<Type size={28} strokeWidth={2.2} />} title="Type it" sub="Just list it out" num="03" wide />
              </div>
              <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFile} style={{ display: "none" }} />
            </FadeIn>
          )}

          {stage === "typing" && (
            <FadeIn>
              <BackBar onBack={() => { setTypedText(""); setStage("entry"); }} />
              <Heading>What's in the kitchen?</Heading>
              <p className="lede">Commas. Vague is fine. "Half a lemon" counts.</p>
              <textarea
                className="ingredient-input"
                placeholder="onion, garlic, leftover chicken, half a lemon, scotch bonnet…"
                value={typedText}
                onChange={(e) => setTypedText(e.target.value)}
                rows={5}
                autoFocus
              />
              <div className="micro-label">QUICK ADD</div>
              <div className="quick-chips">
                {commonIngredients.map((item) => {
                  const added = typedText.toLowerCase().includes(item.toLowerCase());
                  return (
                    <button key={item} onClick={() => addQuickIngredient(item)} className={`quick-chip ${added ? "is-added" : ""}`}>
                      {added ? <Check size={12} strokeWidth={2.5} /> : <Plus size={12} strokeWidth={2.5} />} {item}
                    </button>
                  );
                })}
              </div>
              <PrimaryBtn onClick={submitTyped}>Take it from here →</PrimaryBtn>
            </FadeIn>
          )}

          {stage === "capture" && (
            <FadeIn>
              <BackBar onBack={() => { stopCamera(); setStage("entry"); }} />
              {streamActive ? (
                <div className="cam-frame">
                  <video ref={videoRef} playsInline muted />
                  <button onClick={stopCamera} className="cam-close" aria-label="Close"><X size={20} /></button>
                  <div className="cam-shutter-wrap"><button onClick={captureFromVideo} className="cam-shutter" aria-label="Capture" /></div>
                </div>
              ) : (
                <div className="cam-prompt">
                  <Camera size={48} strokeWidth={2} style={{ marginBottom: "1rem" }} />
                  <div className="cam-prompt-line">OPEN THE FRIDGE.</div>
                  <div className="cam-prompt-line cam-prompt-line-em">Show me everything.</div>
                  <PrimaryBtn onClick={startCamera}>Start the camera →</PrimaryBtn>
                </div>
              )}
            </FadeIn>
          )}

          {stage === "preview" && imageData && (
            <FadeIn>
              <BackBar onBack={reset} />
              <div className="photo-frame">
                <img src={imageData} alt="Your ingredients" />
              </div>
              <PrimaryBtn onClick={detectIngredients}>Read these ingredients →</PrimaryBtn>
              <GhostBtn onClick={reset} icon={<RotateCcw size={14} strokeWidth={2.5} />}>Try another way</GhostBtn>
            </FadeIn>
          )}

          {stage === "detecting" && <Loading label="READING THE PHOTO" subline="Looking at every shelf." />}

          {stage === "cuisine" && (
            <FadeIn>
              <IngredientShelf items={ingredients} />
              <StepHeader step={1} total={3} title="Where in the world?" />
              <div className="cuisine-grid">
                {cuisines.map((c, i) => (
                  <button key={c.id} onClick={() => { setCuisine(c.id); setStage("skill"); }} className="cuisine-card" style={{ animationDelay: `${i * 25}ms` }}>
                    <div className="cuisine-emoji">{c.emoji}</div>
                    <div className="cuisine-name">{c.name}</div>
                    <div className="cuisine-note">{c.note}</div>
                  </button>
                ))}
              </div>
              <GhostBtn onClick={reset} icon={<RotateCcw size={14} strokeWidth={2.5} />}>Start over</GhostBtn>
            </FadeIn>
          )}

          {stage === "skill" && (
            <FadeIn>
              <BackBar onBack={() => setStage("cuisine")} crumbs={[cuisineLabel]} />
              <StepHeader step={2} total={3} title="How are we cooking?" />
              <div className="skill-list">
                {skills.map((s, i) => (
                  <button key={s.id} onClick={() => { setSkill(s.id); setStage("diet"); }} className="skill-card" style={{ animationDelay: `${i * 35}ms` }}>
                    <div className="skill-num">{String(i + 1).padStart(2, "0")}</div>
                    <div className="skill-body">
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
              <StepHeader step={3} total={3} title="Any dietary needs?" subtitle="Tap any. Or skip." />
              <div className="diet-chips">
                {dietOptions.map((d, i) => {
                  const active = diets.includes(d.id);
                  return (
                    <button key={d.id} onClick={() => toggleDiet(d.id)} className={`diet-chip ${active ? "is-active" : ""}`} style={{ animationDelay: `${i * 25}ms` }}>
                      {active && <Check size={13} strokeWidth={3} />} {d.name}
                    </button>
                  );
                })}
              </div>
              <PrimaryBtn onClick={fetchRecipeOptions}>Show me three dishes →</PrimaryBtn>
            </FadeIn>
          )}

          {stage === "naming" && <Loading label="BRAINSTORMING DISHES" subline="Three I'd want to cook from this." />}

          {stage === "choose" && (
            <FadeIn>
              <BackBar onBack={() => setStage("diet")} crumbs={[cuisineLabel, skillLabel, ...diets.map((d) => dietOptions.find((o) => o.id === d)?.name).filter(Boolean)]} />
              <div className="big-eyebrow">THREE DISHES</div>
              <Heading>For you to choose.</Heading>

              <div className="dish-list">
                {recipeOptions.map((opt, i) => (
                  <button key={i} onClick={() => pickRecipe(opt)} className="dish-card" style={{ animationDelay: `${i * 70}ms` }}>
                    <div className="dish-num-stamp">№{String(i + 1).padStart(2, "0")}</div>
                    <h3 className="dish-name">{opt.name}</h3>
                    <p className="dish-tag">{opt.tagline}</p>
                    <div className="dish-meta">
                      <span>{opt.time}</span>
                      <span className="dot">●</span>
                      <span>{opt.difficulty}</span>
                    </div>
                    <div className="dish-pick">PICK THIS ONE →</div>
                  </button>
                ))}
              </div>

              <GhostBtn onClick={fetchRecipeOptions} icon={<RotateCcw size={14} strokeWidth={2.5} />}>Three more</GhostBtn>
            </FadeIn>
          )}

          {stage === "cooking" && <Loading label="COMPOSING YOUR DISH" subline="Quantities, timings, the chef's note." />}

          {stage === "result" && recipe && (
            <FadeIn>
              <BackBar onBack={() => setStage("choose")} crumbs={[cuisineLabel, skillLabel]} />

              <article className="recipe">
                <div className="recipe-frame">
                  <div className="recipe-pretitle">A RECIPE FOR YOU</div>
                  <h2 className="recipe-title">{recipe.name}</h2>
                  <p className="recipe-tagline">{recipe.tagline}</p>
                  <div className="recipe-meta">
                    <Meta label="TIME" value={recipe.time} />
                    <Meta label="LEVEL" value={recipe.difficulty} />
                    {recipe.servings && <Meta label="SERVES" value={recipe.servings} />}
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
                      <li key={i}>
                        <span className="step-n">{String(i + 1).padStart(2, "0")}</span>
                        <span className="step-body">{s}</span>
                      </li>
                    ))}
                  </ol>
                </Sect>

                {recipe.chefNote && (
                  <div className="chef-note">
                    <div className="chef-note-label">A NOTE FROM THE CHEF</div>
                    <p>{recipe.chefNote}</p>
                  </div>
                )}
              </article>

              <GhostBtn onClick={() => setStage("choose")}>← Back to dish choices</GhostBtn>
              <GhostBtn onClick={reset} icon={<RotateCcw size={14} strokeWidth={2.5} />}>Start fresh</GhostBtn>
            </FadeIn>
          )}

          <canvas ref={canvasRef} style={{ display: "none" }} />
          <Footer onAboutClick={() => setShowAbout(true)} />
        </div>
      </div>

      {showAbout && <AboutPanel onClose={() => setShowAbout(false)} />}
    </>
  );
}

// ---------- subcomponents ----------

function Header({ onAboutClick }) {
  return (
    <header className="header">
      <div className="header-row">
        <div className="header-est">EST. 2026</div>
        <button onClick={onAboutClick} className="header-about">
          <Info size={14} strokeWidth={2.5} /> About
        </button>
      </div>
      <div className="header-rule" />
      <h1 className="header-title">
        WHAT<br />SHOULD<br /><span className="header-title-accent">I COOK?</span>
      </h1>
      <div className="header-rule" />
      <div className="header-sub">A KITCHEN ORACLE · NO. 1</div>
    </header>
  );
}

function Footer({ onAboutClick }) {
  return (
    <footer className="footer">
      <div className="footer-rule" />
      <div className="footer-row">
        <span>MADE WITH HUNGER</span>
        <button onClick={onAboutClick} className="footer-link">How this works</button>
      </div>
    </footer>
  );
}

function AboutPanel({ onClose }) {
  return (
    <div className="about-overlay" onClick={onClose}>
      <div className="about-panel" onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} className="about-close" aria-label="Close"><X size={20} strokeWidth={2.5} /></button>
        <div className="about-eyebrow">HOW THIS WORKS</div>
        <h2 className="about-title">A chef in your pocket.<br />Not a search engine.</h2>

        <div className="about-section">
          <div className="about-section-num">01</div>
          <div className="about-section-body">
            <h3>The recipes are composed for you.</h3>
            <p>An AI chef looks at the ingredients you actually have, the cuisine you pick, and the vibe you want — and invents a dish on the spot. Not pulled from a database. Made just now.</p>
          </div>
        </div>

        <div className="about-section">
          <div className="about-section-num">02</div>
          <div className="about-section-body">
            <h3>You'll never get the same recipe twice.</h3>
            <p>That's the magic. Two people with the same fridge get two different dinners. Three more? Different again.</p>
          </div>
        </div>

        <div className="about-section">
          <div className="about-section-num">03</div>
          <div className="about-section-body">
            <h3>It's smart, but it hasn't tasted it.</h3>
            <p>The chef has read a million cookbooks but never cooked in your kitchen. Most recipes are spot on. Some you'll want to season more aggressively or check timings against your stove. Trust your tongue.</p>
          </div>
        </div>

        <div className="about-footer">
          <div>Powered by Claude · Made with hunger</div>
        </div>
      </div>
    </div>
  );
}

function FadeIn({ children }) { return <div className="fadein">{children}</div>; }

function EntryCard({ onClick, icon, title, sub, num, wide }) {
  return (
    <button onClick={onClick} className={`entry-card ${wide ? "is-wide" : ""}`}>
      <div className="entry-num">№{num}</div>
      <div className="entry-icon">{icon}</div>
      <div className="entry-title">{title}</div>
      <div className="entry-sub">{sub}</div>
    </button>
  );
}

function BackBar({ onBack, crumbs = [] }) {
  return (
    <div className="backbar">
      <button onClick={onBack} className="back-btn">
        <ArrowLeft size={14} strokeWidth={3} /> BACK
      </button>
      {crumbs.length > 0 && <div className="crumbs">{crumbs.filter(Boolean).join(" · ")}</div>}
    </div>
  );
}

function IngredientShelf({ items }) {
  return (
    <div className="shelf">
      <div className="shelf-label">ON HAND ({items.length})</div>
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
      <div className="step-eyebrow">STEP {String(step).padStart(2, "0")} / {String(total).padStart(2, "0")}</div>
      <h2 className="step-title">{title}</h2>
      {subtitle && <p className="step-sub">{subtitle}</p>}
    </div>
  );
}

function Heading({ children }) {
  return <h2 className="heading">{children}</h2>;
}

function Loading({ label, subline }) {
  return (
    <div className="loading">
      <Loader2 size={36} strokeWidth={2.5} className="spin" />
      <div className="loading-label">{label}</div>
      <div className="loading-sub">{subline}</div>
    </div>
  );
}

function PrimaryBtn({ onClick, children }) {
  return <button onClick={onClick} className="btn-primary">{children}</button>;
}

function GhostBtn({ onClick, icon, children }) {
  return <button onClick={onClick} className="btn-ghost">{icon}<span>{children}</span></button>;
}

function Sect({ title, children }) {
  return (
    <section className="sect">
      <h3 className="sect-title">{title.toUpperCase()}</h3>
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
      <button onClick={onDismiss} aria-label="Dismiss"><X size={14} strokeWidth={3} /></button>
    </div>
  );
}

// ---------- styles ----------

function GlobalStyles() {
  return (
    <style>{`
      @import url('https://fonts.googleapis.com/css2?family=Archivo+Black&family=Archivo:wght@400;500;700;900&family=Newsreader:ital,wght@0,400;0,500;1,400;1,500&family=JetBrains+Mono:wght@500;700&display=swap');

      :root {
        --bg: #f3d250;
        --bg-deep: #e8c134;
        --paper: #fef7d8;
        --ink: #181410;
        --ink-soft: #2c2620;
        --red: #d4391c;
        --red-deep: #a82c14;
        --rule: rgba(24, 20, 16, 0.95);
        --rule-soft: rgba(24, 20, 16, 0.18);
      }

      * { box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
      html, body, #root { margin: 0; padding: 0; min-height: 100%; background: var(--bg); }
      body { -webkit-font-smoothing: antialiased; }

      .page {
        min-height: 100vh;
        background: var(--bg);
        color: var(--ink);
        font-family: 'Archivo', 'Helvetica Neue', Helvetica, Arial, sans-serif;
        font-size: 16px;
        line-height: 1.5;
        padding: 1rem 1rem 4rem;
        position: relative;
        background-image:
          radial-gradient(circle at 8% 12%, rgba(212, 57, 28, 0.04) 0, transparent 30%),
          radial-gradient(circle at 92% 78%, rgba(212, 57, 28, 0.04) 0, transparent 35%);
      }

      .container {
        max-width: 540px;
        margin: 0 auto;
        position: relative;
      }

      /* HEADER */
      .header { margin-bottom: 2rem; }
      .header-row {
        display: flex; justify-content: space-between; align-items: center;
        font-family: 'JetBrains Mono', monospace;
        font-size: 0.7rem; font-weight: 700;
        letter-spacing: 0.15em;
        margin-bottom: 0.5rem;
      }
      .header-est { color: var(--ink); }
      .header-about {
        display: inline-flex; align-items: center; gap: 4px;
        background: var(--ink); color: var(--bg);
        border: none; padding: 5px 10px;
        font-family: inherit; font-size: inherit; font-weight: inherit; letter-spacing: inherit;
        cursor: pointer;
        text-transform: uppercase;
      }
      .header-about:hover { background: var(--red); }
      .header-rule { height: 3px; background: var(--ink); margin: 8px 0; }
      .header-title {
        font-family: 'Archivo Black', 'Archivo', sans-serif;
        font-size: clamp(3.2rem, 16vw, 4.8rem);
        font-weight: 900;
        line-height: 0.85;
        letter-spacing: -0.045em;
        margin: 0.5rem 0;
        color: var(--ink);
        text-transform: uppercase;
      }
      .header-title-accent { color: var(--red); }
      .header-sub {
        font-family: 'JetBrains Mono', monospace;
        font-size: 0.7rem;
        font-weight: 700;
        letter-spacing: 0.25em;
        text-align: right;
        margin-top: 4px;
      }

      /* FOOTER */
      .footer { margin-top: 4rem; }
      .footer-rule { height: 2px; background: var(--ink); margin-bottom: 0.75rem; }
      .footer-row {
        display: flex; justify-content: space-between; align-items: center;
        font-family: 'JetBrains Mono', monospace;
        font-size: 0.7rem; font-weight: 700;
        letter-spacing: 0.15em;
      }
      .footer-link {
        background: none; border: none;
        font-family: inherit; font-size: inherit; font-weight: inherit; letter-spacing: inherit;
        color: var(--ink); cursor: pointer;
        text-decoration: underline; text-decoration-thickness: 2px;
        text-underline-offset: 4px;
        text-transform: uppercase;
      }
      .footer-link:hover { color: var(--red); }

      /* MASTHEAD (entry) */
      .masthead { margin-bottom: 1.5rem; }
      .masthead-q {
        font-family: 'Archivo Black', sans-serif;
        font-size: clamp(2rem, 8vw, 2.7rem);
        font-weight: 900;
        line-height: 0.92;
        letter-spacing: -0.025em;
        text-transform: uppercase;
        margin-bottom: 0.5rem;
      }
      .masthead-sub {
        font-family: 'JetBrains Mono', monospace;
        font-size: 0.78rem;
        font-weight: 700;
        letter-spacing: 0.2em;
        color: var(--red);
      }

      .entry-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 10px;
      }
      .entry-card {
        position: relative;
        background: var(--paper);
        border: 3px solid var(--ink);
        border-radius: 0;
        padding: 1.4rem 1rem 1.1rem;
        text-align: left;
        cursor: pointer;
        font-family: inherit;
        color: var(--ink);
        transition: all 0.15s ease;
        animation: cardIn 0.4s both;
      }
      .entry-card:hover {
        transform: translate(-2px, -2px);
        box-shadow: 4px 4px 0 var(--ink);
        background: #fff;
      }
      .entry-card.is-wide { grid-column: span 2; }
      .entry-num {
        position: absolute; top: 6px; right: 8px;
        font-family: 'JetBrains Mono', monospace;
        font-size: 0.62rem; font-weight: 700;
        background: var(--red); color: var(--paper);
        padding: 2px 6px;
        letter-spacing: 0.05em;
      }
      .entry-icon {
        color: var(--red); margin-bottom: 0.7rem;
        display: inline-flex;
      }
      .entry-title {
        font-family: 'Archivo Black', sans-serif;
        font-size: 1.2rem;
        text-transform: uppercase;
        letter-spacing: -0.01em;
        line-height: 1;
        margin-bottom: 0.3rem;
      }
      .entry-sub {
        font-size: 0.83rem;
        color: var(--ink-soft);
        font-family: 'Newsreader', serif;
        font-style: italic;
      }

      /* TYPING */
      .ingredient-input {
        width: 100%;
        background: var(--paper);
        border: 3px solid var(--ink);
        border-radius: 0;
        padding: 0.9rem 1rem;
        font-family: 'Newsreader', Georgia, serif;
        font-size: 1.05rem;
        line-height: 1.5;
        color: var(--ink);
        resize: vertical;
        min-height: 120px;
        margin-bottom: 1.25rem;
      }
      .ingredient-input:focus {
        outline: none;
        box-shadow: 3px 3px 0 var(--red);
        background: #fff;
      }
      .ingredient-input::placeholder { color: rgba(24, 20, 16, 0.4); font-style: italic; }

      .micro-label {
        font-family: 'JetBrains Mono', monospace;
        font-size: 0.7rem; font-weight: 700;
        letter-spacing: 0.22em;
        color: var(--ink-soft);
        margin-bottom: 0.5rem;
      }
      .quick-chips {
        display: flex; flex-wrap: wrap; gap: 5px;
        margin-bottom: 1.25rem;
      }
      .quick-chip {
        display: inline-flex; align-items: center; gap: 4px;
        background: var(--paper);
        border: 2px solid var(--ink);
        border-radius: 0;
        padding: 0.32rem 0.7rem;
        font-family: inherit;
        font-size: 0.85rem;
        font-weight: 500;
        color: var(--ink);
        cursor: pointer;
        transition: all 0.12s;
      }
      .quick-chip:hover {
        transform: translate(-1px, -1px);
        box-shadow: 2px 2px 0 var(--ink);
      }
      .quick-chip.is-added {
        background: var(--ink);
        color: var(--bg);
      }

      /* CAMERA */
      .cam-frame { position: relative; border: 3px solid var(--ink); }
      .cam-frame video { width: 100%; aspect-ratio: 3/4; object-fit: cover; background: #000; display: block; }
      .cam-close {
        position: absolute; right: 12px; top: 12px;
        width: 40px; height: 40px;
        background: var(--ink); color: var(--paper);
        border: 3px solid var(--paper); cursor: pointer;
        display: flex; align-items: center; justify-content: center;
      }
      .cam-shutter-wrap {
        position: absolute; bottom: 18px; left: 0; right: 0;
        display: flex; justify-content: center;
      }
      .cam-shutter {
        width: 70px; height: 70px;
        background: var(--paper);
        border: 4px solid var(--ink);
        cursor: pointer;
      }
      .cam-shutter:active { transform: scale(0.93); }
      .cam-prompt {
        background: var(--paper);
        border: 3px dashed var(--ink);
        padding: 2.5rem 1.5rem;
        text-align: center;
        margin-bottom: 1.25rem;
      }
      .cam-prompt-line {
        font-family: 'Archivo Black', sans-serif;
        font-size: 1.5rem;
        line-height: 1.1;
        text-transform: uppercase;
        margin-bottom: 0.4rem;
      }
      .cam-prompt-line-em {
        font-family: 'Newsreader', serif;
        font-style: italic;
        font-weight: 400;
        color: var(--red);
        text-transform: none;
        font-size: 1.4rem;
        margin-bottom: 1.5rem;
      }

      /* PHOTO PREVIEW */
      .photo-frame {
        background: var(--paper);
        padding: 8px;
        border: 3px solid var(--ink);
        margin-bottom: 1rem;
      }
      .photo-frame img { width: 100%; display: block; }

      /* SHELF */
      .shelf {
        background: var(--paper);
        border: 3px solid var(--ink);
        padding: 0.85rem 1rem;
        margin-bottom: 1.5rem;
      }
      .shelf-label {
        font-family: 'JetBrains Mono', monospace;
        font-size: 0.7rem; font-weight: 700;
        letter-spacing: 0.18em;
        color: var(--red);
        margin-bottom: 0.5rem;
      }

      /* STEP HEADER */
      .step-head { margin-bottom: 1.25rem; }
      .step-eyebrow {
        font-family: 'JetBrains Mono', monospace;
        font-size: 0.7rem; font-weight: 700;
        letter-spacing: 0.22em;
        color: var(--red);
        margin-bottom: 0.5rem;
      }
      .step-title {
        font-family: 'Archivo Black', sans-serif;
        font-size: clamp(1.7rem, 6.5vw, 2.2rem);
        font-weight: 900;
        line-height: 0.92;
        letter-spacing: -0.025em;
        margin: 0;
        text-transform: uppercase;
      }
      .step-sub {
        font-family: 'Newsreader', serif;
        font-style: italic;
        font-size: 1rem;
        color: var(--ink-soft);
        margin: 0.4rem 0 0;
      }

      .heading {
        font-family: 'Archivo Black', sans-serif;
        font-size: clamp(1.7rem, 6.5vw, 2.2rem);
        font-weight: 900;
        line-height: 0.92;
        letter-spacing: -0.025em;
        margin: 0 0 0.5rem;
        text-transform: uppercase;
      }
      .lede {
        font-family: 'Newsreader', serif;
        font-style: italic;
        font-size: 1rem;
        color: var(--ink-soft);
        margin: 0 0 1rem;
      }

      /* BACKBAR */
      .backbar {
        display: flex; align-items: center; gap: 0.85rem;
        margin-bottom: 1rem; flex-wrap: wrap;
      }
      .back-btn {
        display: inline-flex; align-items: center; gap: 4px;
        background: var(--ink);
        color: var(--bg);
        border: none;
        cursor: pointer;
        font-family: 'JetBrains Mono', monospace;
        font-size: 0.7rem; font-weight: 700;
        letter-spacing: 0.15em;
        padding: 5px 10px;
      }
      .back-btn:hover { background: var(--red); }
      .crumbs {
        font-family: 'JetBrains Mono', monospace;
        font-size: 0.68rem; font-weight: 700;
        letter-spacing: 0.12em;
        color: var(--ink-soft);
        text-transform: uppercase;
      }

      /* PILLS */
      .pills { display: flex; flex-wrap: wrap; gap: 5px; }
      .pill {
        padding: 0.28rem 0.65rem;
        font-size: 0.82rem;
        font-weight: 500;
        display: inline-block;
        animation: chipIn 0.4s both;
      }
      .pill-strong {
        background: var(--ink);
        color: var(--bg);
      }
      .pill-muted {
        background: transparent;
        color: var(--ink);
        border: 2px solid var(--ink);
      }

      /* CUISINE GRID */
      .cuisine-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 8px;
        margin-bottom: 1.5rem;
      }
      .cuisine-card {
        background: var(--paper);
        border: 3px solid var(--ink);
        border-radius: 0;
        padding: 0.95rem 0.85rem;
        cursor: pointer;
        font-family: inherit;
        text-align: left;
        color: var(--ink);
        transition: all 0.15s;
        animation: cardIn 0.4s both;
      }
      .cuisine-card:hover {
        transform: translate(-2px, -2px);
        box-shadow: 4px 4px 0 var(--ink);
        background: #fff;
      }
      .cuisine-emoji { font-size: 1.4rem; margin-bottom: 0.35rem; }
      .cuisine-name {
        font-family: 'Archivo Black', sans-serif;
        font-size: 0.98rem;
        font-weight: 900;
        text-transform: uppercase;
        line-height: 1;
        margin-bottom: 0.2rem;
        letter-spacing: -0.01em;
      }
      .cuisine-note {
        font-family: 'Newsreader', serif;
        font-style: italic;
        font-size: 0.8rem;
        color: var(--ink-soft);
        line-height: 1.2;
      }

      /* SKILL LIST */
      .skill-list { margin-bottom: 1.5rem; }
      .skill-card {
        width: 100%;
        display: flex;
        align-items: center;
        gap: 1rem;
        padding: 0.95rem 1.1rem;
        margin-bottom: 0.6rem;
        background: var(--paper);
        border: 3px solid var(--ink);
        cursor: pointer;
        font-family: inherit;
        color: var(--ink);
        text-align: left;
        transition: all 0.15s;
        animation: cardIn 0.4s both;
      }
      .skill-card:hover {
        transform: translate(-2px, -2px);
        box-shadow: 4px 4px 0 var(--red);
        background: #fff;
      }
      .skill-num {
        font-family: 'JetBrains Mono', monospace;
        font-size: 0.85rem;
        font-weight: 700;
        background: var(--ink);
        color: var(--bg);
        padding: 4px 8px;
        letter-spacing: 0.05em;
      }
      .skill-body { flex: 1; }
      .skill-name {
        font-family: 'Archivo Black', sans-serif;
        font-size: 1.1rem;
        font-weight: 900;
        text-transform: uppercase;
        letter-spacing: -0.01em;
        margin-bottom: 0.1rem;
      }
      .skill-tag {
        font-family: 'Newsreader', serif;
        font-style: italic;
        font-size: 0.92rem;
        color: var(--ink-soft);
      }
      .skill-arrow {
        font-family: 'Archivo Black', sans-serif;
        font-size: 1.4rem;
        color: var(--red);
      }

      /* DIET */
      .diet-chips {
        display: flex; flex-wrap: wrap; gap: 7px;
        margin-bottom: 1.5rem;
      }
      .diet-chip {
        display: inline-flex; align-items: center; gap: 5px;
        padding: 0.5rem 0.9rem;
        background: var(--paper);
        border: 3px solid var(--ink);
        border-radius: 0;
        cursor: pointer;
        font-family: inherit;
        font-size: 0.92rem;
        font-weight: 500;
        color: var(--ink);
        animation: chipIn 0.4s both;
        transition: all 0.12s;
      }
      .diet-chip:hover {
        transform: translate(-1px, -1px);
        box-shadow: 2px 2px 0 var(--ink);
      }
      .diet-chip.is-active {
        background: var(--red);
        color: var(--paper);
        border-color: var(--red);
      }
      .diet-chip.is-active:hover { box-shadow: 2px 2px 0 var(--ink); }

      /* CHOOSE - dish cards */
      .big-eyebrow {
        font-family: 'JetBrains Mono', monospace;
        font-size: 0.72rem; font-weight: 700;
        letter-spacing: 0.28em;
        color: var(--red);
        margin-bottom: 0.5rem;
      }
      .dish-list { margin-bottom: 1.25rem; }
      .dish-card {
        position: relative;
        width: 100%;
        background: var(--paper);
        border: 3px solid var(--ink);
        padding: 1.1rem 1.25rem 1rem;
        margin-bottom: 0.85rem;
        text-align: left;
        cursor: pointer;
        font-family: inherit;
        color: var(--ink);
        transition: all 0.2s;
        animation: cardIn 0.5s both;
      }
      .dish-card:hover {
        transform: translate(-3px, -3px);
        box-shadow: 5px 5px 0 var(--red);
        background: #fff;
      }
      .dish-num-stamp {
        position: absolute; top: -1px; right: -1px;
        background: var(--red); color: var(--paper);
        font-family: 'JetBrains Mono', monospace;
        font-size: 0.72rem; font-weight: 700;
        padding: 4px 9px;
        letter-spacing: 0.05em;
      }
      .dish-name {
        font-family: 'Archivo Black', sans-serif;
        font-size: 1.4rem;
        font-weight: 900;
        text-transform: uppercase;
        line-height: 0.95;
        margin: 0 0 0.4rem;
        letter-spacing: -0.025em;
        padding-right: 50px;
      }
      .dish-tag {
        font-family: 'Newsreader', serif;
        font-style: italic;
        font-size: 0.97rem;
        color: var(--ink-soft);
        margin: 0 0 0.6rem;
        line-height: 1.35;
      }
      .dish-meta {
        font-family: 'JetBrains Mono', monospace;
        font-size: 0.7rem; font-weight: 700;
        letter-spacing: 0.1em;
        color: var(--ink);
        text-transform: uppercase;
        display: flex; gap: 7px; align-items: center;
        margin-bottom: 0.5rem;
      }
      .dish-meta .dot { color: var(--red); font-size: 0.55rem; }
      .dish-pick {
        font-family: 'JetBrains Mono', monospace;
        font-size: 0.72rem; font-weight: 700;
        letter-spacing: 0.12em;
        color: var(--red);
        text-transform: uppercase;
        padding-top: 0.4rem;
        border-top: 2px solid var(--rule-soft);
      }

      /* RECIPE */
      .recipe { margin-bottom: 1.25rem; }
      .recipe-frame {
        background: var(--ink);
        color: var(--bg);
        padding: 1.4rem 1.3rem 1.3rem;
        margin-bottom: 1.5rem;
        position: relative;
      }
      .recipe-pretitle {
        font-family: 'JetBrains Mono', monospace;
        font-size: 0.7rem; font-weight: 700;
        letter-spacing: 0.28em;
        color: var(--red);
        margin-bottom: 0.4rem;
      }
      .recipe-title {
        font-family: 'Archivo Black', sans-serif;
        font-size: clamp(1.8rem, 8vw, 2.4rem);
        font-weight: 900;
        text-transform: uppercase;
        line-height: 0.9;
        letter-spacing: -0.03em;
        margin: 0 0 0.5rem;
        color: var(--bg);
      }
      .recipe-tagline {
        font-family: 'Newsreader', serif;
        font-style: italic;
        font-size: 1rem;
        color: var(--paper);
        margin: 0 0 1.1rem;
        line-height: 1.4;
      }
      .recipe-meta {
        display: flex;
        gap: 1.5rem;
        padding-top: 0.8rem;
        border-top: 2px solid var(--bg);
      }
      .meta { }
      .meta-label {
        font-family: 'JetBrains Mono', monospace;
        font-size: 0.65rem; font-weight: 700;
        letter-spacing: 0.2em;
        color: var(--bg);
      }
      .meta-value {
        font-family: 'Archivo Black', sans-serif;
        font-size: 1rem;
        margin-top: 0.2rem;
        text-transform: uppercase;
        color: var(--paper);
      }

      .sect { margin-bottom: 1.5rem; }
      .sect-title {
        font-family: 'JetBrains Mono', monospace;
        font-size: 0.72rem;
        font-weight: 700;
        letter-spacing: 0.22em;
        color: var(--red);
        margin: 0 0 0.6rem;
      }

      .steps { list-style: none; padding: 0; margin: 0; }
      .steps li {
        display: flex; gap: 1rem;
        margin-bottom: 1rem;
        background: var(--paper);
        border: 2px solid var(--ink);
        padding: 0.8rem 1rem;
      }
      .step-n {
        font-family: 'Archivo Black', sans-serif;
        font-size: 1.3rem;
        color: var(--red);
        flex-shrink: 0;
        letter-spacing: -0.02em;
        line-height: 1;
      }
      .step-body {
        font-family: 'Newsreader', serif;
        font-size: 1rem;
        line-height: 1.5;
        color: var(--ink);
      }

      .chef-note {
        background: var(--red);
        color: var(--paper);
        padding: 1rem 1.15rem;
        margin: 1.5rem 0;
      }
      .chef-note-label {
        font-family: 'JetBrains Mono', monospace;
        font-size: 0.7rem; font-weight: 700;
        letter-spacing: 0.22em;
        color: var(--bg);
        margin-bottom: 0.4rem;
      }
      .chef-note p {
        font-family: 'Newsreader', serif;
        font-style: italic;
        font-size: 1.08rem;
        margin: 0;
        line-height: 1.5;
        color: var(--paper);
      }

      /* BUTTONS */
      .btn-primary {
        width: 100%;
        display: block;
        padding: 1rem 1.1rem;
        background: var(--ink);
        color: var(--bg);
        border: 3px solid var(--ink);
        border-radius: 0;
        font-family: 'Archivo Black', sans-serif;
        font-size: 1.05rem;
        text-transform: uppercase;
        letter-spacing: -0.005em;
        cursor: pointer;
        margin-bottom: 0.6rem;
        transition: all 0.15s;
      }
      .btn-primary:hover {
        background: var(--red);
        border-color: var(--red);
        transform: translate(-2px, -2px);
        box-shadow: 4px 4px 0 var(--ink);
      }
      .btn-primary:active { transform: translate(0, 0); box-shadow: none; }

      .btn-ghost {
        width: 100%;
        display: flex; align-items: center; justify-content: center; gap: 6px;
        padding: 0.85rem 1rem;
        background: transparent;
        color: var(--ink);
        border: 3px solid var(--ink);
        border-radius: 0;
        font-family: 'JetBrains Mono', monospace;
        font-size: 0.78rem;
        font-weight: 700;
        letter-spacing: 0.15em;
        text-transform: uppercase;
        cursor: pointer;
        transition: all 0.15s;
        margin-bottom: 0.55rem;
      }
      .btn-ghost:hover {
        background: var(--ink);
        color: var(--bg);
      }

      /* LOADING */
      .loading { text-align: center; padding: 4rem 0; }
      .loading .spin { animation: spin 1.2s linear infinite; color: var(--red); }
      .loading-label {
        font-family: 'Archivo Black', sans-serif;
        font-size: 1.3rem;
        text-transform: uppercase;
        letter-spacing: -0.015em;
        margin-top: 1rem;
      }
      .loading-sub {
        font-family: 'Newsreader', serif;
        font-style: italic;
        font-size: 0.95rem;
        color: var(--ink-soft);
        margin-top: 0.25rem;
      }

      /* ERROR */
      .error-banner {
        background: var(--red);
        border: 3px solid var(--ink);
        color: var(--paper);
        padding: 0.7rem 0.9rem;
        margin-bottom: 1rem;
        font-size: 0.92rem;
        font-weight: 500;
        display: flex; justify-content: space-between; align-items: center;
        gap: 0.6rem;
      }
      .error-banner button {
        background: var(--ink); border: none; color: var(--bg); cursor: pointer;
        padding: 4px; display: flex;
      }

      /* ABOUT PANEL */
      .about-overlay {
        position: fixed; inset: 0;
        background: rgba(24, 20, 16, 0.7);
        z-index: 999;
        display: flex; align-items: flex-start; justify-content: center;
        padding: 1rem;
        animation: fadein 0.2s;
        overflow-y: auto;
      }
      .about-panel {
        position: relative;
        max-width: 540px;
        width: 100%;
        background: var(--bg);
        border: 4px solid var(--ink);
        padding: 2rem 1.5rem 1.5rem;
        margin: 2rem 0;
        animation: panelIn 0.3s ease;
      }
      .about-close {
        position: absolute; top: 10px; right: 10px;
        background: var(--ink); color: var(--bg);
        border: none; cursor: pointer;
        width: 36px; height: 36px;
        display: flex; align-items: center; justify-content: center;
      }
      .about-close:hover { background: var(--red); }
      .about-eyebrow {
        font-family: 'JetBrains Mono', monospace;
        font-size: 0.72rem; font-weight: 700;
        letter-spacing: 0.28em;
        color: var(--red);
        margin-bottom: 0.5rem;
      }
      .about-title {
        font-family: 'Archivo Black', sans-serif;
        font-size: clamp(1.6rem, 6vw, 2rem);
        font-weight: 900;
        text-transform: uppercase;
        line-height: 0.92;
        letter-spacing: -0.025em;
        margin: 0 0 1.5rem;
        color: var(--ink);
      }
      .about-section {
        display: flex; gap: 1rem;
        margin-bottom: 1.5rem;
        padding-bottom: 1.5rem;
        border-bottom: 2px solid var(--rule-soft);
      }
      .about-section:last-of-type {
        border-bottom: 3px solid var(--ink);
      }
      .about-section-num {
        font-family: 'Archivo Black', sans-serif;
        font-size: 1.8rem;
        color: var(--red);
        line-height: 1;
        flex-shrink: 0;
      }
      .about-section-body h3 {
        font-family: 'Archivo Black', sans-serif;
        font-size: 1.05rem;
        text-transform: uppercase;
        letter-spacing: -0.01em;
        margin: 0 0 0.4rem;
        line-height: 1.1;
      }
      .about-section-body p {
        font-family: 'Newsreader', serif;
        font-size: 1rem;
        line-height: 1.5;
        color: var(--ink-soft);
        margin: 0;
      }
      .about-footer {
        font-family: 'JetBrains Mono', monospace;
        font-size: 0.7rem; font-weight: 700;
        letter-spacing: 0.2em;
        color: var(--ink-soft);
        text-align: center;
        padding-top: 0.5rem;
      }

      /* ANIMATIONS */
      .fadein { animation: fadein 0.35s ease both; }
      @keyframes fadein {
        from { opacity: 0; transform: translateY(8px); }
        to { opacity: 1; transform: translateY(0); }
      }
      @keyframes cardIn {
        from { opacity: 0; transform: translateY(8px); }
        to { opacity: 1; transform: translateY(0); }
      }
      @keyframes chipIn {
        from { opacity: 0; transform: scale(0.92); }
        to { opacity: 1; transform: scale(1); }
      }
      @keyframes panelIn {
        from { opacity: 0; transform: translateY(20px); }
        to { opacity: 1; transform: translateY(0); }
      }
      @keyframes spin { to { transform: rotate(360deg); } }
    `}</style>
  );
}
