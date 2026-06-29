import { useState, useEffect } from "react";

const EXERCISES = [
  { id: "pushups", name: "Push-ups", emoji: "💪", muscle: "Chest & Triceps" },
  { id: "situps", name: "Sit-ups", emoji: "🔥", muscle: "Core" },
  { id: "squats", name: "Squats", emoji: "🦵", muscle: "Legs" },
  { id: "calve_raises", name: "Calve Raises", emoji: "🦶", muscle: "Calves" },
  { id: "pullups", name: "Pull-ups", emoji: "🏋️", muscle: "Back & Biceps" },
  { id: "dips", name: "Dips", emoji: "⬇️", muscle: "Triceps" },
  { id: "lunges", name: "Lunges", emoji: "🚶", muscle: "Legs & Glutes" },
  { id: "burpees", name: "Burpees", emoji: "💥", muscle: "Full Body" },
  { id: "mountainclimbers", name: "Mountain Climbers", emoji: "⛰️", muscle: "Core & Cardio" },
  { id: "jumpingjacks", name: "Jumping Jacks", emoji: "⭐", muscle: "Cardio" },
];

const INTENSITY_PRESETS = [
  {
    id: "beginner",
    label: "Beginner",
    desc: "Just starting out or returning after a break",
    icon: "🌱",
    startReps: 10,
    increment: 2,
    incrementEvery: 7,
    color: "#4caf50",
  },
  {
    id: "intermediate",
    label: "Intermediate",
    desc: "Can do a few sets already, want to push more",
    icon: "⚡",
    startReps: 25,
    increment: 5,
    incrementEvery: 5,
    color: "#ff9800",
  },
  {
    id: "advanced",
    label: "Advanced",
    desc: "Consistent athlete, here to go hard",
    icon: "🔥",
    startReps: 50,
    increment: 10,
    incrementEvery: 3,
    color: "#f44336",
  },
  {
    id: "beast",
    label: "Beast Mode",
    desc: "No days off. Going for 1000.",
    icon: "💀",
    startReps: 100,
    increment: 20,
    incrementEvery: 2,
    color: "#9c27b0",
  },
  {
    id: "custom",
    label: "Custom",
    desc: "Set your own starting reps and pace",
    icon: "⚙️",
    startReps: null,
    increment: null,
    incrementEvery: null,
    color: "#00bcd4",
  },
];

function getTodayKey() {
  return new Date().toISOString().split("T")[0];
}

function getDayNumber(startDateStr) {
  if (!startDateStr) return 1;
  const start = new Date(startDateStr);
  const today = new Date();
  start.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);
  return Math.floor((today - start) / (1000 * 60 * 60 * 24)) + 1;
}

function getRepsForDay(dayNumber, preset, custom) {
  const p = preset.id === "custom" ? custom : preset;
  const start = Math.max(10, parseInt(p.startReps) || 10);
  const inc = Math.max(1, parseInt(p.increment) || 2);
  const every = Math.max(1, parseInt(p.incrementEvery) || 7);
  const weeksPassed = Math.floor((dayNumber - 1) / every);
  return start + weeksPassed * inc;
}

function getWeekDays() {
  const today = new Date();
  const days = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    days.push(d.toISOString().split("T")[0]);
  }
  return days;
}

function loadState() {
  try {
    return JSON.parse(localStorage.getItem("grind_v2") || "{}");
  } catch {
    return {};
  }
}

function saveState(s) {
  localStorage.setItem("grind_v2", JSON.stringify(s));
}

// ── Onboarding ────────────────────────────────────────────────
function Onboarding({ onDone }) {
  const [step, setStep] = useState(0); // 0=pick intensity, 1=custom config, 2=pick exercises
  const [selectedPreset, setSelectedPreset] = useState(null);
  const [custom, setCustom] = useState({ startReps: 10, increment: 5, incrementEvery: 7 });
  const [selectedExercises, setSelectedExercises] = useState(
    EXERCISES.map((e) => e.id)
  );

  function toggleEx(id) {
    setSelectedExercises((prev) =>
      prev.includes(id) ? (prev.length > 1 ? prev.filter((x) => x !== id) : prev) : [...prev, id]
    );
  }

  function finish() {
    const preset = INTENSITY_PRESETS.find((p) => p.id === selectedPreset);
    onDone({
      preset,
      custom,
      exercises: selectedExercises,
      startDate: getTodayKey(),
    });
  }

  const accent = selectedPreset
    ? INTENSITY_PRESETS.find((p) => p.id === selectedPreset)?.color
    : "#ff6b35";

  return (
    <div style={{
      minHeight: "100vh",
      background: "#080808",
      color: "#f0f0f0",
      fontFamily: "'Inter', system-ui, sans-serif",
      padding: "32px 20px",
      maxWidth: 480,
      margin: "0 auto",
      display: "flex",
      flexDirection: "column",
    }}>
      {step === 0 && (
        <>
          <div style={{ marginBottom: 32 }}>
            <p style={{ color: "#555", fontSize: 12, letterSpacing: 3, textTransform: "uppercase", margin: "0 0 8px" }}>
              Welcome to
            </p>
            <h1 style={{ fontSize: 36, fontWeight: 900, margin: 0, letterSpacing: -1 }}>
              GRIND<span style={{ color: accent }}>.</span>
            </h1>
            <p style={{ color: "#666", marginTop: 8 }}>
              How hard are you going?
            </p>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 12, flex: 1 }}>
            {INTENSITY_PRESETS.map((p) => (
              <button
                key={p.id}
                onClick={() => setSelectedPreset(p.id)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 16,
                  padding: "18px 20px",
                  background: selectedPreset === p.id ? `${p.color}15` : "#111",
                  border: selectedPreset === p.id ? `2px solid ${p.color}` : "2px solid #1e1e1e",
                  borderRadius: 16,
                  cursor: "pointer",
                  textAlign: "left",
                  transition: "all 0.15s",
                }}
              >
                <span style={{ fontSize: 28 }}>{p.icon}</span>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 16, color: selectedPreset === p.id ? p.color : "#e0e0e0" }}>
                    {p.label}
                  </div>
                  <div style={{ color: "#555", fontSize: 13, marginTop: 2 }}>{p.desc}</div>
                  {p.id !== "custom" && (
                    <div style={{ color: "#444", fontSize: 11, marginTop: 4 }}>
                      Starts at {p.startReps} reps · +{p.increment} every {p.incrementEvery} days
                    </div>
                  )}
                </div>
              </button>
            ))}
          </div>

          <button
            onClick={() => selectedPreset && (selectedPreset === "custom" ? setStep(1) : setStep(2))}
            disabled={!selectedPreset}
            style={{
              marginTop: 24,
              padding: "16px",
              background: selectedPreset ? accent : "#1a1a1a",
              border: "none",
              borderRadius: 14,
              color: selectedPreset ? "#000" : "#333",
              fontWeight: 800,
              fontSize: 16,
              cursor: selectedPreset ? "pointer" : "not-allowed",
              transition: "all 0.2s",
            }}
          >
            Continue →
          </button>
        </>
      )}

      {step === 1 && (
        <>
          <button onClick={() => setStep(0)} style={{ background: "none", border: "none", color: "#555", fontSize: 14, cursor: "pointer", marginBottom: 24, textAlign: "left", padding: 0 }}>
            ← Back
          </button>
          <h2 style={{ fontSize: 26, fontWeight: 800, margin: "0 0 6px" }}>Custom Setup</h2>
          <p style={{ color: "#555", marginBottom: 28 }}>Set your own pace. Minimum 10 reps.</p>

          {[
            { key: "startReps", label: "Starting reps", hint: "Min 10, max 1000" },
            { key: "increment", label: "Reps added each step", hint: "How many reps to add" },
            { key: "incrementEvery", label: "Add reps every (days)", hint: "E.g. every 7 days" },
          ].map(({ key, label, hint }) => (
            <div key={key} style={{ marginBottom: 20 }}>
              <label style={{ display: "block", fontSize: 13, color: "#888", marginBottom: 8 }}>{label}</label>
              <input
                type="number"
                min={key === "startReps" ? 10 : 1}
                max={key === "startReps" ? 1000 : 99}
                value={custom[key]}
                onChange={(e) => setCustom((prev) => ({ ...prev, [key]: e.target.value }))}
                style={{
                  width: "100%",
                  padding: "14px 16px",
                  background: "#111",
                  border: "2px solid #222",
                  borderRadius: 12,
                  color: "#fff",
                  fontSize: 20,
                  fontWeight: 700,
                  boxSizing: "border-box",
                }}
              />
              <p style={{ color: "#444", fontSize: 12, margin: "6px 0 0" }}>{hint}</p>
            </div>
          ))}

          <button
            onClick={() => setStep(2)}
            style={{
              marginTop: 12,
              padding: "16px",
              background: "#00bcd4",
              border: "none",
              borderRadius: 14,
              color: "#000",
              fontWeight: 800,
              fontSize: 16,
              cursor: "pointer",
            }}
          >
            Continue →
          </button>
        </>
      )}

      {step === 2 && (
        <>
          <button onClick={() => setStep(selectedPreset === "custom" ? 1 : 0)} style={{ background: "none", border: "none", color: "#555", fontSize: 14, cursor: "pointer", marginBottom: 24, textAlign: "left", padding: 0 }}>
            ← Back
          </button>
          <h2 style={{ fontSize: 26, fontWeight: 800, margin: "0 0 6px" }}>Pick Your Exercises</h2>
          <p style={{ color: "#555", marginBottom: 20 }}>Select what you'll train. Tap to toggle.</p>

          <div style={{ display: "flex", flexDirection: "column", gap: 10, flex: 1 }}>
            {EXERCISES.map((ex) => {
              const on = selectedExercises.includes(ex.id);
              return (
                <button
                  key={ex.id}
                  onClick={() => toggleEx(ex.id)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "14px 18px",
                    background: on ? "#0d1f0d" : "#111",
                    border: on ? `2px solid ${accent}` : "2px solid #1e1e1e",
                    borderRadius: 14,
                    cursor: "pointer",
                    transition: "all 0.15s",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <span style={{ fontSize: 22 }}>{ex.emoji}</span>
                    <div>
                      <div style={{ fontWeight: 600, color: on ? accent : "#ccc", fontSize: 15 }}>{ex.name}</div>
                      <div style={{ color: "#444", fontSize: 12 }}>{ex.muscle}</div>
                    </div>
                  </div>
                  <div style={{
                    width: 24, height: 24, borderRadius: "50%",
                    background: on ? accent : "transparent",
                    border: on ? "none" : "2px solid #333",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 12, color: "#000", flexShrink: 0,
                  }}>
                    {on && "✓"}
                  </div>
                </button>
              );
            })}
          </div>

          <p style={{ color: "#444", fontSize: 12, marginTop: 12 }}>
            {selectedExercises.length} of {EXERCISES.length} selected
          </p>

          <button
            onClick={finish}
            style={{
              marginTop: 16,
              padding: "16px",
              background: accent,
              border: "none",
              borderRadius: 14,
              color: "#000",
              fontWeight: 800,
              fontSize: 16,
              cursor: "pointer",
            }}
          >
            Start Grinding 💪
          </button>
        </>
      )}
    </div>
  );
}

// ── Main Tracker ───────────────────────────────────────────────
function Tracker({ config, onReset }) {
  const [workoutData, setWorkoutData] = useState(() => {
    const s = loadState();
    return s.workoutData || {};
  });
  const [view, setView] = useState("today"); // "today" | "history"

  const { preset, custom, exercises: exerciseIds, startDate } = config;
  const exercises = EXERCISES.filter((e) => exerciseIds.includes(e.id));
  const today = getTodayKey();
  const dayNumber = getDayNumber(startDate);
  const reps = getRepsForDay(dayNumber, preset, custom);
  const todayData = workoutData[today] || {};
  const accent = preset.color;

  useEffect(() => {
    const s = loadState();
    saveState({ ...s, workoutData });
  }, [workoutData]);

  function toggleExercise(id) {
    setWorkoutData((prev) => {
      const t = prev[today] || {};
      return { ...prev, [today]: { ...t, [id]: !t[id] } };
    });
  }

  const doneCount = exercises.filter((e) => todayData[e.id]).length;
  const allDone = doneCount === exercises.length;
  const pct = exercises.length ? (doneCount / exercises.length) * 100 : 0;

  const weekDays = getWeekDays();
  const dayLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  function getDayStatus(dateStr) {
    const d = workoutData[dateStr] || {};
    const done = exercises.filter((e) => d[e.id]).length;
    if (done === 0) return "empty";
    if (done === exercises.length) return "complete";
    return "partial";
  }

  // Streak
  let streak = 0;
  const check = new Date();
  while (true) {
    const key = check.toISOString().split("T")[0];
    const d = workoutData[key] || {};
    const done = exercises.filter((e) => d[e.id]).length;
    if (done === exercises.length) {
      streak++;
      check.setDate(check.getDate() - 1);
    } else {
      break;
    }
  }

  return (
    <div style={{
      minHeight: "100vh",
      background: "#080808",
      color: "#f0f0f0",
      fontFamily: "'Inter', system-ui, sans-serif",
      maxWidth: 480,
      margin: "0 auto",
    }}>
      {/* Top nav */}
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "20px 20px 0",
      }}>
        <div>
          <span style={{ fontWeight: 900, fontSize: 22, letterSpacing: -1 }}>
            GRIND<span style={{ color: accent }}>.</span>
          </span>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          {["today", "history"].map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              style={{
                padding: "6px 14px",
                background: view === v ? accent : "#151515",
                border: "none",
                borderRadius: 20,
                color: view === v ? "#000" : "#555",
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
                textTransform: "capitalize",
              }}
            >
              {v}
            </button>
          ))}
        </div>
      </div>

      {view === "today" && (
        <div style={{ padding: "20px 20px 40px" }}>
          {/* Stats row */}
          <div style={{ display: "flex", gap: 12, margin: "20px 0" }}>
            {[
              { label: "Day", value: dayNumber },
              { label: "Reps", value: reps },
              { label: "Streak 🔥", value: `${streak}d` },
            ].map(({ label, value }) => (
              <div key={label} style={{
                flex: 1,
                background: "#111",
                border: "1px solid #1e1e1e",
                borderRadius: 14,
                padding: "14px 12px",
                textAlign: "center",
              }}>
                <div style={{ fontSize: 22, fontWeight: 800, color: accent }}>{value}</div>
                <div style={{ fontSize: 11, color: "#555", marginTop: 2 }}>{label}</div>
              </div>
            ))}
          </div>

          {/* Big progress */}
          <div style={{
            background: "#111",
            border: "1px solid #1e1e1e",
            borderRadius: 16,
            padding: "18px",
            marginBottom: 20,
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
              <span style={{ fontWeight: 700, fontSize: 15 }}>
                {allDone ? "All done 🔥" : `${doneCount} / ${exercises.length} done`}
              </span>
              <span style={{ color: "#555", fontSize: 13 }}>{Math.round(pct)}%</span>
            </div>
            <div style={{ height: 8, background: "#1a1a1a", borderRadius: 8, overflow: "hidden" }}>
              <div style={{
                height: "100%",
                width: `${pct}%`,
                background: allDone
                  ? "linear-gradient(90deg, #4caf50, #8bc34a)"
                  : `linear-gradient(90deg, ${accent}, ${accent}cc)`,
                borderRadius: 8,
                transition: "width 0.4s ease",
              }} />
            </div>
          </div>

          {/* Exercise list */}
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {exercises.map((ex) => {
              const done = !!todayData[ex.id];
              return (
                <button
                  key={ex.id}
                  onClick={() => toggleExercise(ex.id)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "16px 18px",
                    background: done ? "#0a1a0a" : "#111",
                    border: done ? `1.5px solid ${accent}55` : "1.5px solid #1e1e1e",
                    borderRadius: 14,
                    cursor: "pointer",
                    transition: "all 0.15s",
                    textAlign: "left",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                    <span style={{ fontSize: 24 }}>{ex.emoji}</span>
                    <div>
                      <div style={{
                        fontSize: 15,
                        fontWeight: 600,
                        color: done ? "#4caf50" : "#e0e0e0",
                        textDecoration: done ? "line-through" : "none",
                        opacity: done ? 0.65 : 1,
                      }}>
                        {ex.name}
                      </div>
                      <div style={{ fontSize: 12, color: "#555", marginTop: 1 }}>
                        {reps} reps · {ex.muscle}
                      </div>
                    </div>
                  </div>
                  <div style={{
                    width: 30, height: 30, borderRadius: "50%",
                    background: done ? "#4caf50" : "transparent",
                    border: done ? "none" : "2px solid #2a2a2a",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 15, color: "#000", flexShrink: 0,
                    transition: "all 0.2s",
                  }}>
                    {done && "✓"}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Intensity badge */}
          <div style={{
            marginTop: 24,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "12px 16px",
            background: "#0f0f0f",
            borderRadius: 12,
            border: "1px solid #181818",
          }}>
            <span style={{ fontSize: 12, color: "#444" }}>
              {preset.icon} {preset.label} · +{preset.id === "custom" ? custom.increment : preset.increment} reps every {preset.id === "custom" ? custom.incrementEvery : preset.incrementEvery} days
    </span>
            <button
              onClick={onReset}
              style={{
                background: "none",
                border: "none",
                color: "#333",
                fontSize: 12,
                cursor: "pointer",
                textDecoration: "underline",
              }}
            >
              Change
            </button>
          </div>
        </div>
      )}

      {view === "history" && (
        <div style={{ padding: "20px 20px 40px" }}>
          <h2 style={{ fontWeight: 800, fontSize: 22, margin: "16px 0 20px" }}>Your History</h2>

          {/* Weekly grid */}
          <p style={{ color: "#444", fontSize: 11, letterSpacing: 2, textTransform: "uppercase", margin: "0 0 12px" }}>
            This Week
          </p>
          <div style={{ display: "flex", gap: 8, marginBottom: 32 }}>
            {weekDays.map((dateStr) => {
              const status = getDayStatus(dateStr);
              const isToday = dateStr === today;
              const d = new Date(dateStr);
              return (
                <div key={dateStr} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
                  <span style={{ fontSize: 10, color: isToday ? accent : "#444" }}>
                    {dayLabels[d.getDay()]}
                  </span>
                  <div style={{
                    width: "100%",
                    aspectRatio: "1",
                    borderRadius: 10,
                    background:
                      status === "complete" ? "#4caf50"
                      : status === "partial" ? "#ff9800"
                      : "#141414",
                    border: isToday ? `2px solid ${accent}` : "2px solid transparent",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 14,
                  }}>
                    {status === "complete" ? "✓" : status === "partial" ? "~" : ""}
                  </div>
                  <span style={{ fontSize: 9, color: "#333" }}>
                    {d.getDate()}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Past workout log */}
          <p style={{ color: "#444", fontSize: 11, letterSpacing: 2, textTransform: "uppercase", margin: "0 0 12px" }}>
            Log
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {Object.keys(workoutData)
              .sort((a, b) => b.localeCompare(a))
              .slice(0, 20)
              .map((dateStr) => {
                const d = workoutData[dateStr];
                const done = exercises.filter((e) => d[e.id]).length;
                const isToday = dateStr === today;
                return (
                  <div key={dateStr} style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "14px 16px",
                    background: "#111",
                    border: isToday ? `1.5px solid ${accent}` : "1.5px solid #1a1a1a",
                    borderRadius: 12,
                  }}>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 14 }}>
                        {isToday ? "Today" : new Date(dateStr + "T12:00:00").toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" })}
                      </div>
                      <div style={{ color: "#555", fontSize: 12, marginTop: 2 }}>
                        {done}/{exercises.length} exercises
                      </div>
                    </div>
                    <div style={{
                      padding: "4px 12px",
                      borderRadius: 20,
                      background: done === exercises.length ? "#4caf5020" : "#1a1a1a",
                      color: done === exercises.length ? "#4caf50" : "#555",
                      fontSize: 12,
                      fontWeight: 600,
                    }}>
                      {done === exercises.length ? "Complete ✓" : `${done} done`}
                    </div>
                  </div>
                );
              })}
            {Object.keys(workoutData).length === 0 && (
              <div style={{ textAlign: "center", color: "#333", padding: "40px 0", fontSize: 14 }}>
                No workouts logged yet.<br />Start today! 💪
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Root ───────────────────────────────────────────────────────
export default function App() {
  const [config, setConfig] = useState(() => {
    const s = loadState();
    return s.config || null;
  });

  function handleOnboardingDone(cfg) {
    const s = loadState();
    saveState({ ...s, config: cfg });
    setConfig(cfg);
  }

  function handleReset() {
    if (confirm("Reset your setup? Your workout history will be saved.")) {
      const s = loadState();
      saveState({ ...s, config: null });
      setConfig(null);
    }
  }

  if (!config) return <Onboarding onDone={handleOnboardingDone} />;
  return <Tracker config={config} onReset={handleReset} />;
}     
