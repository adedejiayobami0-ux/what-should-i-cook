import React, { useState, useRef, useEffect } from "react";
import { Camera, Upload, ChefHat, Sparkles, Loader2, X, RotateCcw, Flame } from "lucide-react";

export default function App() {
  const [stage, setStage] = useState("capture");
  const [imageData, setImageData] = useState(null);
  const [ingredients, setIngredients] = useState([]);
  const [mode, setMode] = useState(null);
  const [recipe, setRecipe] = useState(null);
  const [error, setError] = useState(null);
  const [streamActive, setStreamActive] = useState(false);

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);
  const streamRef = useRef(null);

  const modes = [
    { id: "nigerian", name: "Nigerian Gourmet", tagline: "West African elevated, bold spice, deep heritage", accent: "#d97706", icon: "🌶️" },
    { id: "budget", name: "Budget Mode", tagline: "Maximum flavor, minimum spend, smart swaps", accent: "#65a30d", icon: "💰" },
    { id: "datenight", name: "Date Night", tagline: "Plated, restaurant-grade, made to impress", accent: "#be123c", icon: "🕯️" },
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
      setError("Couldn't open camera. Try uploading a photo instead.");
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
    reader.onload = (ev) => {
      setImageData(ev.target.result);
      setStage("preview");
    };
    reader.readAsDataURL(file);
  }

  function reset() {
    stopCamera();
    setImageData(null);
    setIngredients([]);
    setMode(null);
    setRecipe(null);
    setError(null);
    setStage("capture");
  }

  async function detectIngredients() {
    setStage("detecting");
    setError(null);
    try {
      const base64 = imageData.split(",")[1];
      const res = await fetch("/api/detect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: base64 }),
      });
      if (!res.ok) throw new Error("API error");
      const data = await res.json();
      if (!Array.isArray(data.ingredients) || data.ingredients.length === 0) {
        throw new Error("No ingredients detected");
      }
      setIngredients(data.ingredients);
      setStage("mode");
    } catch (err) {
      setError("Couldn't read the ingredients. Try a clearer photo with better lighting.");
      setStage("preview");
    }
  }

  async function generateRecipe(selectedMode) {
    setMode(selectedMode);
    setStage("cooking");
    setError(null);
    try {
      const res = await fetch("/api/recipe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ingredients, mode: selectedMode }),
      });
      if (!res.ok) throw new Error("API error");
      const data = await res.json();
      setRecipe(data.recipe);
      setStage("result");
    } catch (err) {
      setError("The kitchen had a moment. Try again?");
      setStage("mode");
    }
  }

  const bg = "#0f0d0a";
  const cream = "#f4ede0";
  const ember = "#e07a3c";

  return (
    <div style={{ minHeight: "100vh", background: bg, color: cream, fontFamily: "'EB Garamond', Georgia, serif", padding: "1.5rem 1rem 4rem", position: "relative", overflow: "hidden" }}>
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", opacity: 0.06, backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='n'%3E%3CfeTurbulence baseFrequency='0.9' numOctaves='3'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")", zIndex: 0 }} />

      <div style={{ maxWidth: 480, margin: "0 auto", position: "relative", zIndex: 1 }}>
        <header style={{ textAlign: "center", marginBottom: "2rem" }}>
          <div style={{ fontFamily: "'Courier New', monospace", fontSize: "0.7rem", letterSpacing: "0.25em", opacity: 0.5, marginBottom: "0.5rem" }}>
            — A KITCHEN ORACLE —
          </div>
          <h1 style={{ fontSize: "2.5rem", fontWeight: 400, letterSpacing: "-0.02em", lineHeight: 1, margin: 0, fontStyle: "italic" }}>
            What Should<br /><span style={{ color: ember }}>I Cook?</span>
          </h1>
        </header>

        {error && (
          <div style={{ background: "rgba(224, 122, 60, 0.15)", border: `1px solid ${ember}`, padding: "0.75rem 1rem", borderRadius: 4, marginBottom: "1rem", fontSize: "0.9rem" }}>
            {error}
          </div>
        )}

        {stage === "capture" && (
          <div>
            {streamActive ? (
              <div style={{ position: "relative" }}>
                <video ref={videoRef} playsInline muted style={{ width: "100%", borderRadius: 8, background: "#000", aspectRatio: "3/4", objectFit: "cover" }} />
                <button onClick={stopCamera} style={{ position: "absolute", right: 12, top: 12, background: "rgba(0,0,0,0.6)", color: cream, border: "none", width: 40, height: 40, borderRadius: "50%", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }} aria-label="Close camera">
                  <X size={20} />
                </button>
                <div style={{ position: "absolute", bottom: 16, left: 0, right: 0, display: "flex", justifyContent: "center" }}>
                  <button onClick={captureFromVideo} style={{ width: 72, height: 72, borderRadius: "50%", border: `4px solid ${cream}`, background: ember, cursor: "pointer" }} aria-label="Capture" />
                </div>
              </div>
            ) : (
              <div>
                <div style={{ border: `1px dashed rgba(244, 237, 224, 0.3)`, borderRadius: 8, padding: "3rem 1.5rem", textAlign: "center", marginBottom: "1.5rem" }}>
                  <ChefHat size={48} style={{ opacity: 0.4, marginBottom: "1rem" }} />
                  <p style={{ margin: "0 0 0.5rem", fontSize: "1.1rem", fontStyle: "italic" }}>Open the fridge. Show me everything.</p>
                  <p style={{ margin: 0, opacity: 0.5, fontSize: "0.9rem" }}>Snap whatever's on the counter, in the crisper, on the shelf.</p>
                </div>
                <button onClick={startCamera} style={btnPrimary(ember)}><Camera size={18} /> Open Camera</button>
                <button onClick={() => fileInputRef.current?.click()} style={btnGhost(cream)}><Upload size={18} /> Upload a Photo</button>
                <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFile} style={{ display: "none" }} />
              </div>
            )}
          </div>
        )}

        {stage === "preview" && imageData && (
          <div>
            <img src={imageData} alt="Your ingredients" style={{ width: "100%", borderRadius: 8, marginBottom: "1rem" }} />
            <button onClick={detectIngredients} style={btnPrimary(ember)}><Sparkles size={18} /> Read the Ingredients</button>
            <button onClick={reset} style={btnGhost(cream)}><RotateCcw size={18} /> Try Another Photo</button>
          </div>
        )}

        {stage === "detecting" && (
          <div style={{ textAlign: "center", padding: "3rem 0" }}>
            <Loader2 size={40} style={{ animation: "spin 1.2s linear infinite", color: ember }} />
            <p style={{ marginTop: "1rem", fontStyle: "italic", opacity: 0.7 }}>Studying your shelves...</p>
          </div>
        )}

        {stage === "mode" && (
          <div>
            <div style={{ background: "rgba(244, 237, 224, 0.05)", border: "1px solid rgba(244, 237, 224, 0.1)", borderRadius: 8, padding: "1rem", marginBottom: "1.5rem" }}>
              <div style={{ fontSize: "0.7rem", letterSpacing: "0.2em", opacity: 0.5, marginBottom: "0.5rem", fontFamily: "'Courier New', monospace" }}>ON HAND</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {ingredients.map((ing, i) => (
                  <span key={i} style={{ background: "rgba(224, 122, 60, 0.15)", color: cream, padding: "0.25rem 0.6rem", borderRadius: 999, fontSize: "0.85rem" }}>{ing}</span>
                ))}
              </div>
            </div>

            <h2 style={{ fontSize: "1.3rem", fontWeight: 400, fontStyle: "italic", marginBottom: "1rem" }}>How are we cooking tonight?</h2>

            {modes.map((m) => (
              <button key={m.id} onClick={() => generateRecipe(m.id)} style={{ width: "100%", display: "flex", alignItems: "center", gap: 14, padding: "1rem", marginBottom: "0.75rem", background: "transparent", border: `1px solid rgba(244, 237, 224, 0.15)`, borderLeft: `4px solid ${m.accent}`, borderRadius: 6, color: cream, textAlign: "left", cursor: "pointer", fontFamily: "inherit", transition: "background 0.2s" }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(244, 237, 224, 0.04)")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}>
                <span style={{ fontSize: "1.8rem" }}>{m.icon}</span>
                <div>
                  <div style={{ fontSize: "1.1rem", fontWeight: 500 }}>{m.name}</div>
                  <div style={{ fontSize: "0.85rem", opacity: 0.6, fontStyle: "italic" }}>{m.tagline}</div>
                </div>
              </button>
            ))}

            <button onClick={reset} style={{ ...btnGhost(cream), marginTop: "0.5rem" }}><RotateCcw size={18} /> Start Over</button>
          </div>
        )}

        {stage === "cooking" && (
          <div style={{ textAlign: "center", padding: "3rem 0" }}>
            <Flame size={40} style={{ animation: "flicker 0.8s ease-in-out infinite", color: ember }} />
            <p style={{ marginTop: "1rem", fontStyle: "italic", opacity: 0.7 }}>Composing your dish...</p>
          </div>
        )}

        {stage === "result" && recipe && (
          <div>
            <div style={{ fontFamily: "'Courier New', monospace", fontSize: "0.7rem", letterSpacing: "0.2em", opacity: 0.5, marginBottom: "0.5rem" }}>
              {modes.find((m) => m.id === mode)?.icon} {modes.find((m) => m.id === mode)?.name.toUpperCase()}
            </div>
            <h2 style={{ fontSize: "2rem", fontWeight: 400, fontStyle: "italic", lineHeight: 1.1, margin: "0 0 0.5rem", color: ember }}>{recipe.name}</h2>
            <p style={{ opacity: 0.7, fontStyle: "italic", marginTop: 0 }}>{recipe.tagline}</p>

            <div style={{ display: "flex", gap: "1.5rem", fontSize: "0.85rem", opacity: 0.7, marginBottom: "1.5rem", fontFamily: "'Courier New', monospace" }}>
              <span>⏱ {recipe.time}</span>
              <span>◆ {recipe.difficulty}</span>
            </div>

            <Section title="From your photo">
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {recipe.uses?.map((u, i) => <span key={i} style={pill(ember)}>{u}</span>)}
              </div>
            </Section>

            {recipe.extras?.length > 0 && (
              <Section title="Pantry add-ins">
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {recipe.extras.map((e, i) => <span key={i} style={pillMuted(cream)}>{e}</span>)}
                </div>
              </Section>
            )}

            <Section title="Method">
              <ol style={{ paddingLeft: "1.2rem", margin: 0, lineHeight: 1.7 }}>
                {recipe.steps?.map((s, i) => <li key={i} style={{ marginBottom: "0.6rem" }}>{s}</li>)}
              </ol>
            </Section>

            {recipe.chefNote && (
              <div style={{ borderLeft: `3px solid ${ember}`, paddingLeft: "1rem", margin: "1.5rem 0", fontStyle: "italic", opacity: 0.85 }}>
                <div style={{ fontSize: "0.7rem", letterSpacing: "0.2em", opacity: 0.6, marginBottom: "0.25rem", fontFamily: "'Courier New', monospace", fontStyle: "normal" }}>CHEF'S NOTE</div>
                {recipe.chefNote}
              </div>
            )}

            <button onClick={() => setStage("mode")} style={btnGhost(cream)}>Try a different mode</button>
            <button onClick={reset} style={{ ...btnGhost(cream), marginTop: "0.5rem" }}><RotateCcw size={18} /> New Photo</button>
          </div>
        )}

        <canvas ref={canvasRef} style={{ display: "none" }} />
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes flicker { 0%, 100% { transform: scale(1); opacity: 1; } 50% { transform: scale(1.1); opacity: 0.7; } }
      `}</style>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div style={{ marginBottom: "1.25rem" }}>
      <div style={{ fontSize: "0.7rem", letterSpacing: "0.2em", opacity: 0.5, marginBottom: "0.5rem", fontFamily: "'Courier New', monospace" }}>
        {title.toUpperCase()}
      </div>
      {children}
    </div>
  );
}

function btnPrimary(bg) {
  return { width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "0.95rem", background: bg, color: "#0f0d0a", border: "none", borderRadius: 6, fontSize: "1rem", fontWeight: 500, fontFamily: "inherit", cursor: "pointer", marginBottom: "0.6rem", letterSpacing: "0.02em" };
}
function btnGhost(fg) {
  return { width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "0.85rem", background: "transparent", color: fg, border: `1px solid rgba(244, 237, 224, 0.2)`, borderRadius: 6, fontSize: "0.95rem", fontFamily: "inherit", cursor: "pointer", fontStyle: "italic" };
}
function pill(color) {
  return { background: `${color}26`, color: "#f4ede0", padding: "0.25rem 0.7rem", borderRadius: 999, fontSize: "0.85rem", border: `1px solid ${color}40` };
}
function pillMuted(color) {
  return { background: "rgba(244, 237, 224, 0.06)", color, padding: "0.25rem 0.7rem", borderRadius: 999, fontSize: "0.85rem", opacity: 0.8 };
}
