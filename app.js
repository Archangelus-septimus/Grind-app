const { useState, useEffect } = React;

const firebaseConfig = {
  apiKey: "AIzaSyCzlwmvTiw2ShxHCcKdHQq7LQKA26ZQ4aQ",
  authDomain: "grind-app-c8776.firebaseapp.com",
  projectId: "grind-app-c8776",
  storageBucket: "grind-app-c8776.firebasestorage.app",
  messagingSenderId: "588004199050",
  appId: "1:588004199050:web:2a736a919f89a013b47b73"
};

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

const EXERCISES = [
  { id: "pushups", name: "Push-ups", emoji: "💪", muscle: "Chest & Triceps" },
  { id: "situps", name: "Sit-ups", emoji: "🔥", muscle: "Core" },
  { id: "squats", name: "Squats", emoji: "🦵", muscle: "Legs" },
  { id: "calve_raises", name: "Calve Raises", emoji: "🦶", muscle: "Calves" },
  { id: "pullups", name: "Pull-ups", emoji: "🏋️", muscle: "Back & Biceps" },
  { id: "dips", name: "Dips", emoji: "⬇️", muscle: "Triceps" },
  { id: "lunges", name: "Lunges", emoji: "🚶", muscle: "Legs & Glutes" },
  { id: "burpees", name: "Burpees", emoji: "💥", muscle: "Full Body" },
];

const PRESETS = [
  { id: "beginner", label: "Beginner 🌱", startReps: 10, increment: 2, every: 7, color: "#4caf50" },
  { id: "intermediate", label: "Intermediate ⚡", startReps: 25, increment: 5, every: 5, color: "#ff9800" },
  { id: "advanced", label: "Advanced 🔥", startReps: 50, increment: 10, every: 3, color: "#f44336" },
  { id: "beast", label: "Beast Mode 💀", startReps: 100, increment: 20, every: 2, color: "#9c27b0" },
];

const BADGES = [
  { id: "first", label: "First Step", emoji: "🌱", desc: "Complete 1 day", check: s => s.totalCompleted >= 1 },
  { id: "week", label: "Week Warrior", emoji: "🔥", desc: "7-day streak", check: s => s.longestStreak >= 7 },
  { id: "fortnight", label: "Two Weeks Strong", emoji: "⚡", desc: "14-day streak", check: s => s.longestStreak >= 14 },
  { id: "month", label: "Monthly Beast", emoji: "🦾", desc: "30-day streak", check: s => s.longestStreak >= 30 },
  { id: "century", label: "Centurion", emoji: "💯", desc: "100 total days", check: s => s.totalCompleted >= 100 },
  { id: "unstoppable", label: "Unstoppable", emoji: "👑", desc: "60-day streak", check: s => s.longestStreak >= 60 },
];

function getTodayKey() { return new Date().toISOString().split("T")[0]; }

function getDayNum(start) {
  const s = new Date(start), t = new Date();
  s.setHours(0,0,0,0); t.setHours(0,0,0,0);
  return Math.floor((t - s) / 86400000) + 1;
}

function getReps(dayNum, preset, customReps) {
  if (preset.id === "custom") return Math.max(10, parseInt(customReps)||10) + Math.floor((dayNum-1)/7)*5;
  return preset.startReps + Math.floor((dayNum-1)/preset.every)*preset.increment;
}

function getTheme(dark) {
  return dark
    ? { bg:"#080808", text:"#f0f0f0", card:"#111", border:"#1e1e1e", subtext:"#555", faint:"#333" }
    : { bg:"#f5f5f5", text:"#111", card:"#fff", border:"#e0e0e0", subtext:"#777", faint:"#bbb" };
}function Confetti() {
  const pieces = Array.from({length: 60});
  const colors = ["#ff6b35","#4caf50","#00bcd4","#ff9800","#f44336","#9c27b0","#ffeb3b"];
  return (
    <div style={{position:"fixed",inset:0,pointerEvents:"none",overflow:"hidden",zIndex:9999}}>
      <style>{`
        @keyframes confettiFall {
          0% { transform: translateY(-10vh) rotate(0deg); opacity:1; }
          100% { transform: translateY(110vh) rotate(720deg); opacity:0.3; }
        }
      `}</style>
      {pieces.map((_, i) => {
        const left = Math.random()*100;
        const delay = Math.random()*0.5;
        const duration = 1.8 + Math.random()*1.2;
        const size = 6 + Math.random()*6;
        const color = colors[i % colors.length];
        return (
          <div key={i} style={{
            position:"absolute", left:`${left}vw`, top:"-10vh",
            width:size, height:size*1.6, background:color, borderRadius:2,
            animation:`confettiFall ${duration}s ease-in ${delay}s forwards`,
          }}/>
        );
      })}
    </div>
  );
}

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [screen, setScreen] = useState("login");
  const [preset, setPreset] = useState(PRESETS[0]);
  const [customReps, setCustomReps] = useState(10);
  const [showCustom, setShowCustom] = useState(false);
  const [startDate, setStartDate] = useState(getTodayKey());
  const [done, setDone] = useState({});
  const [lockedDays, setLockedDays] = useState({});
  const [view, setView] = useState("today");
  const [history, setHistory] = useState({});
  const [dark, setDark] = useState(() => localStorage.getItem("grind_theme") !== "light");
  const [showConfetti, setShowConfetti] = useState(false);
  const [prevAllDone, setPrevAllDone] = useState(false);
  const [isChangingLevel, setIsChangingLevel] = useState(false);

  const T = getTheme(dark);
  const today = getTodayKey();
  const isTodayLocked = !!lockedDays[today];

  function toggleTheme() {
    const newDark = !dark;
    setDark(newDark);
    localStorage.setItem("grind_theme", newDark ? "dark" : "light");
  }

  async function loadLevelData(uid, levelId) {
    const todayDoc = await db.collection("users").doc(uid)
      .collection("levels").doc(levelId)
      .collection("workouts").doc(today).get();
    const snap = await db.collection("users").doc(uid)
      .collection("levels").doc(levelId)
      .collection("workouts").get();
    const h = {};
    const locked = {};
    snap.forEach(d => {
      h[d.id] = d.data();
      if (d.data()._locked) locked[d.id] = true;
    });
    setHistory(h);
    setLockedDays(locked);
    if (todayDoc.exists) setDone(todayDoc.data());
    else setDone({});
  }

  useEffect(() => {
    auth.getRedirectResult().catch(e => {
      if (e.code !== "auth/no-auth-event") {
        setErrorMsg("Redirect error: " + e.message);
      }
    });
    auth.onAuthStateChanged(async (u) => {
      try {
        setUser(u);
        if (u) {
          const doc = await db.collection("users").doc(u.uid).get();
          if (doc.exists) {
            const data = doc.data();
            const p = data.preset || PRESETS[0];
            setPreset(p);
            setStartDate(data.startDate || today);
            setScreen("tracker");
            await loadLevelData(u.uid, p.id);
          } else {
            setScreen("onboard");
          }
        } else {
          setScreen("login");
        }
      } catch (e) {
        setErrorMsg("Auth error: " + e.message);
      }
      setLoading(false);
    });
  }, []);

  async function signInWithGoogle() {
    try {
      setErrorMsg("");
      const provider = new firebase.auth.GoogleAuthProvider();
      const result = await auth.signInWithPopup(provider);
      if (result.user) setUser(result.user);
    } catch (e) {
      setErrorMsg("Sign in failed: " + e.code + " - " + e.message);
    }
}async function pickPreset(p) {
    try {
      setPreset(p);
      const levelDoc = await db.collection("users").doc(user.uid)
        .collection("levels").doc(p.id).get();
      let levelStartDate = today;
      if (levelDoc.exists && levelDoc.data().startDate) {
        levelStartDate = levelDoc.data().startDate;
      } else {
        await db.collection("users").doc(user.uid)
          .collection("levels").doc(p.id).set({ startDate: today });
      }
      setStartDate(levelStartDate);
      await db.collection("users").doc(user.uid).set({ preset: p, startDate: levelStartDate });
      await loadLevelData(user.uid, p.id);
      setScreen("tracker");
      setIsChangingLevel(false);
    } catch (e) {
      setErrorMsg("Save error: " + e.message);
    }
  }

  async function toggle(id) {
    if (isTodayLocked) return;
    try {
      const newDone = { ...done, [id]: !done[id] };
      setDone(newDone);
      await db.collection("users").doc(user.uid)
        .collection("levels").doc(preset.id)
        .collection("workouts").doc(today).set(newDone);
      setHistory(prev => ({ ...prev, [today]: newDone }));
    } catch (e) {
      setErrorMsg("Update error: " + e.message);
    }
  }

  async function lockToday() {
    if (isTodayLocked) return;
    try {
      const finalData = { ...done, _locked: true };
      await db.collection("users").doc(user.uid)
        .collection("levels").doc(preset.id)
        .collection("workouts").doc(today).set(finalData);
      setLockedDays(prev => ({ ...prev, [today]: true }));
      setHistory(prev => ({ ...prev, [today]: finalData }));
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 2500);
    } catch (e) {
      setErrorMsg("Lock error: " + e.message);
    }
  }

  const dayNum = getDayNum(startDate);
  const reps = getReps(dayNum, preset, customReps);
  const doneCount = EXERCISES.filter(e => done[e.id]).length;
  const allDone = doneCount >= EXERCISES.length - 1;
  const perfectDone = doneCount === EXERCISES.length;
  const pct = Math.round((doneCount/EXERCISES.length)*100);
  const accent = preset.color;

  useEffect(() => {
    if (allDone && !prevAllDone && !isTodayLocked) {
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 2500);
    }
    setPrevAllDone(allDone);
  }, [allDone]);

  function getWeek() {
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate()-i);
      const key = d.toISOString().split("T")[0];
      const data = history[key] || {};
      const count = EXERCISES.filter(e => data[e.id]).length;
      const locked = !!data._locked;
      days.push({ key, count, label: ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"][d.getDay()], locked });
    }
    return days;
  }

  function getAllTimeStats() {
    const start = new Date(startDate);
    const today2 = new Date();
    start.setHours(0,0,0,0);
    today2.setHours(0,0,0,0);
    const totalDays = Math.floor((today2 - start) / 86400000) + 1;
    let totalCompleted = 0, currentStreak = 0, longestStreak = 0, tempStreak = 0;
    const check = new Date(start);
    const calendar = [];
    for (let i = 0; i < totalDays; i++) {
      const key = check.toISOString().split("T")[0];
      const data = history[key] || {};
      const count = EXERCISES.filter(e => data[e.id]).length;
      const locked = !!data._locked;
      const full = locked && count >= 1;
      if (full) {
        totalCompleted++;
        tempStreak++;
        longestStreak = Math.max(longestStreak, tempStreak);
      } else {
        tempStreak = 0;
      }
      calendar.push({ key, full, partial: count > 0 && !locked });
      check.setDate(check.getDate() + 1);
    }
    const checkBack = new Date();
    checkBack.setHours(0,0,0,0);
    while (true) {
      const key = checkBack.toISOString().split("T")[0];
      const data = history[key] || {};
      const count = EXERCISES.filter(e => data[e.id]).length;
      const locked = !!data._locked;
      if (locked && count >= 1) {
        currentStreak++;
        checkBack.setDate(checkBack.getDate() - 1);
      } else break;
    }
    return { totalDays, totalCompleted, currentStreak, longestStreak, calendar };
  }

  const ErrorBanner = () => errorMsg ? (
    <div style={{background:"#3a0a0a",border:"1px solid #ff4444",borderRadius:10,padding:"10px 14px",marginBottom:16,color:"#ff8888",fontSize:12}}>
      ⚠️ {errorMsg}
      <button onClick={() => setErrorMsg("")} style={{float:"right",background:"none",border:"none",color:"#ff8888",cursor:"pointer"}}>✕</button>
    </div>
  ) : null;if (loading) return (
    <div style={{minHeight:"100vh",background:T.bg,display:"flex",alignItems:"center",justifyContent:"center"}}>
      <div style={{color:T.subtext,fontSize:14}}>Loading...</div>
    </div>
  );

  if (screen === "login") return (
    <div style={{minHeight:"100vh",background:T.bg,color:T.text,fontFamily:"'Inter',system-ui,sans-serif",maxWidth:480,margin:"0 auto",padding:"60px 18px 48px",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center"}}>
      <h1 style={{fontSize:48,fontWeight:900,margin:"0 0 8px",letterSpacing:-2}}>GRIND<span style={{color:"#ff6b35"}}>.</span></h1>
      <p style={{color:T.subtext,marginBottom:32,textAlign:"center"}}>Track your calisthenics journey</p>
      <div style={{width:"100%"}}><ErrorBanner/></div>
      <button onClick={signInWithGoogle} style={{display:"flex",alignItems:"center",gap:12,padding:"16px 24px",background:"#fff",border:"none",borderRadius:14,cursor:"pointer",fontSize:16,fontWeight:700,color:"#000",width:"100%",justifyContent:"center"}}>
        <img src="https://www.google.com/favicon.ico" width="20" height="20"/>
        Continue with Google
      </button>
    </div>
  );

  if (screen === "onboard") return (
    <div style={{minHeight:"100vh",background:T.bg,color:T.text,fontFamily:"'Inter',system-ui,sans-serif",maxWidth:480,margin:"0 auto",padding:"24px 18px 48px"}}>
      <h1 style={{fontSize:36,fontWeight:900,margin:"0 0 6px"}}>GRIND<span style={{color:"#ff6b35"}}>.</span></h1>
      <p style={{color:T.subtext,marginBottom:20}}>Pick your level.</p>
      <ErrorBanner/>
      {isChangingLevel && (
        <button onClick={() => { setScreen("tracker"); setIsChangingLevel(false); }} style={{background:"none",border:"none",color:T.subtext,fontSize:14,cursor:"pointer",marginBottom:16,padding:0,display:"block"}}>
          ← Back
        </button>
      )}
      {PRESETS.map(p => (
        <button key={p.id} onClick={() => pickPreset(p)} style={{display:"flex",alignItems:"center",gap:14,padding:"16px 18px",background:T.card,border:`2px solid ${preset.id===p.id?p.color:T.border}`,borderRadius:14,cursor:"pointer",marginBottom:10,width:"100%",boxSizing:"border-box",textAlign:"left"}}>
          <div>
            <div style={{fontWeight:700,fontSize:16,color:p.color}}>{p.label} {preset.id===p.id?"✓":""}</div>
            <div style={{color:T.subtext,fontSize:12,marginTop:3}}>Starts at {p.startReps} reps · +{p.increment} every {p.every} days</div>
            <div style={{color:T.faint,fontSize:11,marginTop:2}}>Independent history & streak</div>
          </div>
        </button>
      ))}
      <button onClick={() => setShowCustom(!showCustom)} style={{display:"flex",alignItems:"center",gap:14,padding:"16px 18px",background:T.card,border:`2px solid ${T.border}`,borderRadius:14,cursor:"pointer",marginBottom:10,width:"100%",boxSizing:"border-box",textAlign:"left"}}>
        <div style={{fontWeight:700,fontSize:16,color:"#00bcd4"}}>Custom ⚙️</div>
      </button>
      {showCustom && (
        <div style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:14,padding:18,marginBottom:10}}>
          <label style={{color:T.subtext,fontSize:13}}>Starting reps (min 10)</label>
          <input type="number" min={10} max={1000} value={customReps} onChange={e => setCustomReps(e.target.value)} style={{width:"100%",padding:"12px",background:T.bg,border:`2px solid ${T.border}`,borderRadius:10,color:T.text,fontSize:22,fontWeight:800,marginTop:8,boxSizing:"border-box"}}/>
          <button onClick={() => pickPreset({id:"custom",label:"Custom ⚙️",color:"#00bcd4"})} style={{padding:"14px",background:"#00bcd4",border:"none",borderRadius:12,color:"#000",fontWeight:800,fontSize:15,cursor:"pointer",width:"100%",marginTop:10}}>Start →</button>
        </div>
      )}
    </div>
  );return (
    <div style={{minHeight:"100vh",background:T.bg,color:T.text,fontFamily:"'Inter',system-ui,sans-serif",maxWidth:480,margin:"0 auto",padding:"24px 18px 48px"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
        <span style={{fontWeight:900,fontSize:24}}>GRIND<span style={{color:accent}}>.</span></span>
        <div style={{display:"flex",gap:8,alignItems:"center"}}>
          <button onClick={toggleTheme} style={{width:30,height:30,borderRadius:"50%",background:T.card,border:`1px solid ${T.border}`,cursor:"pointer",fontSize:14}}>{dark?"☀️":"🌙"}</button>
          {["today","history"].map(v => (
            <button key={v} onClick={() => setView(v)} style={{padding:"6px 14px",background:view===v?accent:T.card,border:"none",borderRadius:20,color:view===v?"#000":T.subtext,fontSize:13,fontWeight:600,cursor:"pointer",textTransform:"capitalize"}}>{v}</button>
          ))}
          <button onClick={() => auth.signOut()} style={{padding:"6px 10px",background:T.card,border:"none",borderRadius:20,color:T.subtext,fontSize:12,cursor:"pointer"}}>Out</button>
        </div>
      </div>
      <ErrorBanner/>
      {showConfetti && <Confetti/>}
      {view==="today" && <>
        <div style={{display:"flex",gap:10,marginBottom:16}}>
          {[["Day",dayNum],["Reps",reps],["Done",doneCount+"/"+EXERCISES.length]].map(([l,v]) => (
            <div key={l} style={{flex:1,background:T.card,border:`1px solid ${T.border}`,borderRadius:14,padding:"14px 10px",textAlign:"center"}}>
              <div style={{fontSize:20,fontWeight:800,color:accent}}>{v}</div>
              <div style={{fontSize:11,color:T.subtext}}>{l}</div>
            </div>
          ))}
        </div>
        <div style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:14,padding:16,marginBottom:16}}>
          <div style={{display:"flex",justifyContent:"space-between",marginBottom:8}}>
            <span style={{fontWeight:700}}>
              {isTodayLocked ? "Day locked ✅" : perfectDone?"Perfect day! 🔥":allDone?"Crushed it! 💪":`${doneCount}/${EXERCISES.length} done`}
            </span>
            <span style={{color:T.subtext}}>{pct}%</span>
          </div>
          <div style={{height:8,background:T.border,borderRadius:8,overflow:"hidden"}}>
            <div style={{height:"100%",width:pct+"%",background:isTodayLocked?"#4caf50":allDone?"#4caf50":accent,borderRadius:8,transition:"width 0.4s"}}/>
          </div>
        </div>
        {EXERCISES.map(ex => {
          const isDone = !!done[ex.id];
          return (
            <button key={ex.id} onClick={() => toggle(ex.id)} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"16px 18px",background:isDone?(dark?"#0a1a0a":"#e8f5e9"):T.card,border:isDone?"1.5px solid #4caf5055":`1.5px solid ${T.border}`,borderRadius:14,cursor:isTodayLocked?"not-allowed":"pointer",marginBottom:10,width:"100%",boxSizing:"border-box",textAlign:"left",opacity:isTodayLocked?0.7:1}}>
              <div style={{display:"flex",alignItems:"center",gap:14}}>
                <span style={{fontSize:24}}>{ex.emoji}</span>
                <div>
                  <div style={{fontSize:15,fontWeight:600,color:isDone?"#4caf50":T.text,textDecoration:isDone?"line-through":"none",opacity:isDone?0.8:1}}>{ex.name}</div>
                  <div style={{fontSize:12,color:T.subtext}}>{reps} reps · {ex.muscle}</div>
                </div>
              </div>
              <div style={{width:30,height:30,borderRadius:"50%",background:isDone?"#4caf50":"transparent",border:isDone?"none":`2px solid ${T.border}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,color:"#000",flexShrink:0}}>{isDone&&"✓"}</div>
            </button>
          );
        })}
        {!isTodayLocked && doneCount > 0 && (
          <button onClick={lockToday} style={{marginTop:16,padding:"16px",background:accent,border:"none",borderRadius:14,color:"#000",fontWeight:800,fontSize:16,cursor:"pointer",width:"100%"}}>
            Done for today — lock it in 🔒
          </button>
        )}
        {isTodayLocked && (
          <div style={{marginTop:16,padding:"16px",background:T.card,border:`1px solid #4caf5055`,borderRadius:14,textAlign:"center"}}>
            <span style={{color:"#4caf50",fontWeight:700}}>✅ Today's session locked in — see you tomorrow!</span>
          </div>
        )}
        <button onClick={() => { setScreen("onboard"); setIsChangingLevel(true); }} style={{marginTop:10,padding:"10px",background:"transparent",border:`1px solid ${T.border}`,borderRadius:10,color:T.faint,fontSize:12,cursor:"pointer",width:"100%"}}>Change level · {preset.label}</button>
      </>}{view==="history" && <>
        <h2 style={{fontWeight:800,fontSize:20,margin:"0 0 4px"}}>This Week</h2>
        <p style={{color:T.subtext,fontSize:12,margin:"0 0 16px"}}>{preset.label} history</p>
        <div style={{display:"flex",gap:8,marginBottom:24}}>
          {getWeek().map(({key,count,label,locked}) => {
            const isToday = key===today;
            const full = locked && count >= 1;
            const partial = count>0 && !locked;
            return (
              <div key={key} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:6}}>
                <span style={{fontSize:10,color:isToday?accent:T.subtext}}>{label}</span>
                <div style={{width:"100%",aspectRatio:"1",borderRadius:8,background:full?"#4caf50":partial?"#ff9800":T.border,border:isToday?"2px solid "+accent:"2px solid transparent",display:"flex",alignItems:"center",justifyContent:"center",fontSize:13}}>{full?"✓":partial?"~":""}</div>
                <span style={{fontSize:9,color:T.faint}}>{new Date(key+"T12:00:00").getDate()}</span>
              </div>
            );
          })}
        </div>
        <p style={{color:T.subtext,fontSize:13,textAlign:"center",marginBottom:8}}>Signed in as {user?.email}</p>
        {(() => {
          const stats = getAllTimeStats();
          return (
            <>
              <div style={{display:"flex",gap:10,margin:"16px 0 20px"}}>
                {[["Total Days",stats.totalCompleted],["Current 🔥",stats.currentStreak],["Best 🏆",stats.longestStreak]].map(([l,v]) => (
                  <div key={l} style={{flex:1,background:T.card,border:`1px solid ${T.border}`,borderRadius:14,padding:"14px 8px",textAlign:"center"}}>
                    <div style={{fontSize:20,fontWeight:800,color:accent}}>{v}</div>
                    <div style={{fontSize:10,color:T.subtext}}>{l}</div>
                  </div>
                ))}
              </div>
              <p style={{color:T.subtext,fontSize:11,letterSpacing:2,textTransform:"uppercase",margin:"0 0 12px"}}>All Time</p>
              <div style={{display:"grid",gridTemplateColumns:"repeat(10, 1fr)",gap:4,marginBottom:24}}>
                {stats.calendar.map(({key, full, partial}) => (
                  <div key={key} title={key} style={{aspectRatio:"1",borderRadius:3,background:full?"#4caf50":partial?"#ff9800":T.border}}/>
                ))}
              </div>
              <p style={{color:T.subtext,fontSize:11,letterSpacing:2,textTransform:"uppercase",margin:"0 0 12px"}}>Badges</p>
              <div style={{display:"grid",gridTemplateColumns:"repeat(3, 1fr)",gap:10}}>
                {BADGES.map(b => {
                  const unlocked = b.check(stats);
                  return (
                    <div key={b.id} style={{background:T.card,border:`1px solid ${unlocked?accent+"55":T.border}`,borderRadius:14,padding:"16px 8px",textAlign:"center",opacity:unlocked?1:0.4}}>
                      <div style={{fontSize:28,marginBottom:6,filter:unlocked?"none":"grayscale(1)"}}>{b.emoji}</div>
                      <div style={{fontSize:11,fontWeight:700,color:unlocked?T.text:T.subtext}}>{b.label}</div>
                      <div style={{fontSize:9,color:T.subtext,marginTop:2}}>{b.desc}</div>
                    </div>
                  );
                })}
              </div>
            </>
          );
        })()}
      </>}
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(React.createElement(App));
