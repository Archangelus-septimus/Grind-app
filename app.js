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
  const [view, setView] = useState("today");
  const [history, setHistory] = useState({});

  useEffect(() => {
    auth.getRedirectResult().catch(e => {
      setErrorMsg("Redirect error: " + e.code + " - " + e.message);
    });
    auth.onAuthStateChanged(async (u) => {
      try {
        setUser(u);
        if (u) {
          const doc = await db.collection("users").doc(u.uid).get();
          if (doc.exists) {
            const data = doc.data();
            setPreset(data.preset || PRESETS[0]);
            setStartDate(data.startDate || getTodayKey());
            setScreen("tracker");
            const today = getTodayKey();
            const todayDoc = await db.collection("users").doc(u.uid).collection("workouts").doc(today).get();
            if (todayDoc.exists) setDone(todayDoc.data());
            const snap = await db.collection("users").doc(u.uid).collection("workouts").get();
            const h = {};
            snap.forEach(d => { h[d.id] = d.data(); });
            setHistory(h);
          } else {
            setScreen("onboard");
          }
        } else {
          setScreen("login");
        }
      } catch (e) {
        setErrorMsg("Auth state error: " + e.message);
      }
      setLoading(false);
    });
  }, []);

  async function signInWithGoogle() {
    try {
      setErrorMsg("");
      const provider = new firebase.auth.GoogleAuthProvider();
      await auth.signInWithRedirect(provider);
    } catch (e) {
      setErrorMsg("Sign in failed: " + e.code + " - " + e.message);
    }
  }

  async function pickPreset(p) {
    try {
      setPreset(p);
      const today = getTodayKey();
      setStartDate(today);
      await db.collection("users").doc(user.uid).set({ preset: p, startDate: today });
      setScreen("tracker");
    } catch (e) {
      setErrorMsg("Save error: " + e.message);
    }
  }

  async function toggle(id) {
    try {
      const newDone = { ...done, [id]: !done[id] };
      setDone(newDone);
      const today = getTodayKey();
      await db.collection("users").doc(user.uid).collection("workouts").doc(today).set(newDone);
      setHistory(prev => ({ ...prev, [today]: newDone }));
    } catch (e) {
      setErrorMsg("Update error: " + e.message);
    }
  }

  const today = getTodayKey();
  const dayNum = getDayNum(startDate);
  const reps = getReps(dayNum, preset, customReps);
  const doneCount = EXERCISES.filter(e => done[e.id]).length;
  const allDone = doneCount === EXERCISES.length;
  const pct = Math.round((doneCount/EXERCISES.length)*100);
  const accent = preset.color;

  function getWeek() {
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate()-i);
      const key = d.toISOString().split("T")[0];
      const data = history[key] || {};
      const count = EXERCISES.filter(e => data[e.id]).length;
      days.push({ key, count, label: ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"][d.getDay()] });
    }
    return days;
  }

  const ErrorBanner = () => errorMsg ? (
    <div style={{background:"#3a0a0a",border:"1px solid #ff4444",borderRadius:10,padding:"10px 14px",marginBottom:16,color:"#ff8888",fontSize:12}}>
      ⚠️ {errorMsg}
      <button onClick={() => setErrorMsg("")} style={{float:"right",background:"none",border:"none",color:"#ff8888",cursor:"pointer"}}>✕</button>
    </div>
  ) : null;

  if (loading) return (
    <div style={{minHeight:"100vh",background:"#080808",display:"flex",alignItems:"center",justifyContent:"center"}}>
      <div style={{color:"#444",fontSize:14}}>Loading...</div>
    </div>
  );

  if (screen === "login") return (
    <div style={{minHeight:"100vh",background:"#080808",color:"#f0f0f0",fontFamily:"'Inter',system-ui,sans-serif",maxWidth:480,margin:"0 auto",padding:"60px 18px 48px",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center"}}>
      <h1 style={{fontSize:48,fontWeight:900,margin:"0 0 8px",letterSpacing:-2}}>GRIND<span style={{color:"#ff6b35"}}>.</span></h1>
      <p style={{color:"#555",marginBottom:32,textAlign:"center"}}>Track your calisthenics journey</p>
      <div style={{width:"100%"}}><ErrorBanner/></div>
      <button onClick={signInWithGoogle} style={{display:"flex",alignItems:"center",gap:12,padding:"16px 24px",background:"#fff",border:"none",borderRadius:14,cursor:"pointer",fontSize:16,fontWeight:700,color:"#000",width:"100%",justifyContent:"center"}}>
        <img src="https://www.google.com/favicon.ico" width="20" height="20"/>
        Continue with Google
      </button>
    </div>
  );

  if (screen === "onboard") return (
    <div style={{minHeight:"100vh",background:"#080808",color:"#f0f0f0",fontFamily:"'Inter',system-ui,sans-serif",maxWidth:480,margin:"0 auto",padding:"24px 18px 48px"}}>
      <h1 style={{fontSize:36,fontWeight:900,margin:"0 0 6px"}}>GRIND<span style={{color:"#ff6b35"}}>.</span></h1>
      <p style={{color:"#666",marginBottom:20}}>Pick your level.</p>
      <ErrorBanner/>
      {PRESETS.map(p => (
        <button key={p.id} onClick={() => pickPreset(p)} style={{display:"flex",alignItems:"center",gap:14,padding:"16px 18px",background:"#111",border:"2px solid #1e1e1e",borderRadius:14,cursor:"pointer",marginBottom:10,width:"100%",boxSizing:"border-box",textAlign:"left"}}>
          <div>
            <div style={{fontWeight:700,fontSize:16,color:p.color}}>{p.label}</div>
            <div style={{color:"#555",fontSize:12,marginTop:3}}>Starts at {p.startReps} reps · +{p.increment} every {p.every} days</div>
          </div>
        </button>
      ))}
      <button onClick={() => setShowCustom(!showCustom)} style={{display:"flex",alignItems:"center",gap:14,padding:"16px 18px",background:"#111",border:"2px solid #1e1e1e",borderRadius:14,cursor:"pointer",marginBottom:10,width:"100%",boxSizing:"border-box",textAlign:"left"}}>
        <div style={{fontWeight:700,fontSize:16,color:"#00bcd4"}}>Custom ⚙️</div>
      </button>
      {showCustom && (
        <div style={{background:"#111",border:"1px solid #1e1e1e",borderRadius:14,padding:18,marginBottom:10}}>
          <label style={{color:"#888",fontSize:13}}>Starting reps (min 10)</label>
          <input type="number" min={10} max={1000} value={customReps} onChange={e => setCustomReps(e.target.value)} style={{width:"100%",padding:"12px",background:"#0a0a0a",border:"2px solid #222",borderRadius:10,color:"#fff",fontSize:22,fontWeight:800,marginTop:8,boxSizing:"border-box"}}/>
          <button onClick={() => pickPreset({id:"custom",label:"Custom ⚙️",color:"#00bcd4"})} style={{padding:"14px",background:"#00bcd4",border:"none",borderRadius:12,color:"#000",fontWeight:800,fontSize:15,cursor:"pointer",width:"100%",marginTop:10}}>Start →</button>
        </div>
      )}
    </div>
  );

  return (
    <div style={{minHeight:"100vh",background:"#080808",color:"#f0f0f0",fontFamily:"'Inter',system-ui,sans-serif",maxWidth:480,margin:"0 auto",padding:"24px 18px 48px"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
        <span style={{fontWeight:900,fontSize:24}}>GRIND<span style={{color:accent}}>.</span></span>
        <div style={{display:"flex",gap:8,alignItems:"center"}}>
          {["today","history"].map(v => (
            <button key={v} onClick={() => setView(v)} style={{padding:"6px 14px",background:view===v?accent:"#151515",border:"none",borderRadius:20,color:view===v?"#000":"#555",fontSize:13,fontWeight:600,cursor:"pointer",textTransform:"capitalize"}}>{v}</button>
          ))}
          <button onClick={() => auth.signOut()} style={{padding:"6px 10px",background:"#151515",border:"none",borderRadius:20,color:"#555",fontSize:12,cursor:"pointer"}}>Out</button>
        </div>
      </div>
      <ErrorBanner/>
      {view==="today" && <>
        <div style={{display:"flex",gap:10,marginBottom:16}}>
          {[["Day",dayNum],["Reps",reps],["Done",doneCount+"/"+EXERCISES.length]].map(([l,v]) => (
            <div key={l} style={{flex:1,background:"#111",border:"1px solid #1e1e1e",borderRadius:14,padding:"14px 10px",textAlign:"center"}}>
              <div style={{fontSize:20,fontWeight:800,color:accent}}>{v}</div>
              <div style={{fontSize:11,color:"#555"}}>{l}</div>
            </div>
          ))}
        </div>
        <div style={{background:"#111",border:"1px solid #1e1e1e",borderRadius:14,padding:16,marginBottom:16}}>
          <div style={{display:"flex",justifyContent:"space-between",marginBottom:8}}>
            <span style={{fontWeight:700}}>{allDone?"All done 🔥":`${doneCount}/${EXERCISES.length} done`}</span>
            <span style={{color:"#555"}}>{pct}%</span>
          </div>
          <div style={{height:8,background:"#1a1a1a",borderRadius:8,overflow:"hidden"}}>
            <div style={{height:"100%",width:pct+"%",background:allDone?"#4caf50":accent,borderRadius:8,transition:"width 0.4s"}}/>
          </div>
        </div>
        {EXERCISES.map(ex => {
          const isDone = !!done[ex.id];
          return (
            <button key={ex.id} onClick={() => toggle(ex.id)} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"16px 18px",background:isDone?"#0a1a0a":"#111",border:isDone?"1.5px solid #4caf5055":"1.5px solid #1e1e1e",borderRadius:14,cursor:"pointer",marginBottom:10,width:"100%",boxSizing:"border-box",textAlign:"left"}}>
              <div style={{display:"flex",alignItems:"center",gap:14}}>
                <span style={{fontSize:24}}>{ex.emoji}</span>
                <div>
                  <div style={{fontSize:15,fontWeight:600,color:isDone?"#4caf50":"#e0e0e0",textDecoration:isDone?"line-through":"none",opacity:isDone?0.65:1}}>{ex.name}</div>
                  <div style={{fontSize:12,color:"#555"}}>{reps} reps · {ex.muscle}</div>
                </div>
              </div>
              <div style={{width:30,height:30,borderRadius:"50%",background:isDone?"#4caf50":"transparent",border:isDone?"none":"2px solid #333",display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,color:"#000",flexShrink:0}}>{isDone&&"✓"}</div>
            </button>
          );
        })}
        <button onClick={() => setScreen("onboard")} style={{marginTop:8,padding:"10px",background:"transparent",border:"1px solid #1e1e1e",borderRadius:10,color:"#333",fontSize:12,cursor:"pointer",width:"100%"}}>Change level</button>
      </>}
      {view==="history" && <>
        <h2 style={{fontWeight:800,fontSize:20,margin:"0 0 16px"}}>This Week</h2>
        <div style={{display:"flex",gap:8,marginBottom:24}}>
          {getWeek().map(({key,count,label}) => {
            const isToday = key===today;
            const full = count===EXERCISES.length;
            const partial = count>0;
            return (
              <div key={key} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:6}}>
                <span style={{fontSize:10,color:isToday?accent:"#444"}}>{label}</span>
                <div style={{width:"100%",aspectRatio:"1",borderRadius:8,background:full?"#4caf50":partial?"#ff9800":"#141414",border:isToday?"2px solid "+accent:"2px solid transparent",display:"flex",alignItems:"center",justifyContent:"center",fontSize:13}}>{full?"✓":partial?"~":""}</div>
                <span style={{fontSize:9,color:"#333"}}>{new Date(key+"T12:00:00").getDate()}</span>
              </div>
            );
          })}
        </div>
        <p style={{color:"#444",fontSize:13,textAlign:"center"}}>Signed in as {user?.email}</p>
      </>}
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(React.createElement(App));
  
