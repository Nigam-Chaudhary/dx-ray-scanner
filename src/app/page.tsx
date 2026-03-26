"use client";
import { useState, useEffect } from "react";
import DiagnosticCard from "@/components/DiagnosticCard";

export default function DXRayHome() {
  const [url, setUrl] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [status, setStatus] = useState("idle"); 
  const [progress, setProgress] = useState(0);
  const [healthScore, setHealthScore] = useState(0);
  const [initialScore, setInitialScore] = useState(0); // Initial score for comparison
  const [displayText, setDisplayText] = useState("");

  const steps = ["Metadata", "Setup", "PR Lag", "Branches", "Deps", "CI/CD", "Tests", "Infra"];

  useEffect(() => {
    if (status === "idle") {
      const text = "READY_TO_SCAN_PROJECT_DX...";
      let i = 0;
      const timer = setInterval(() => {
        setDisplayText(text.slice(0, i));
        i = (i + 1) % (text.length + 1);
      }, 150);
      return () => clearInterval(timer);
    }
  }, [status]);

  // --- UNIVERSAL FIX SUCCESS HANDLER (Fixed for all categories) ---
  const handleFixSuccess = (category: string) => {
    // 1. Results ko update karo
    const updatedResults = results.map(f => {
      if (f.category === category) {
        return { 
          ...f, 
          score: 'HEALTHY', 
          message: `${f.message.replace(' [FIXED]', '')} [FIXED]`,
          evidence: `DX-Ray optimization complete. ${category} issue resolved.`
        };
      }
      return f;
    });

    setResults(updatedResults);

    // 2. Health Score ko live update karo based on NEW HEALTHY results
    const crit = updatedResults.filter((f: any) => f.score === "CRITICAL").length;
    const warn = updatedResults.filter((f: any) => f.score === "WARNING").length;
    
    const newScore = Math.max(0, 100 - crit * 15 - warn * 7);
    setHealthScore(newScore);
  };

  // --- SHARE REPORT FUNCTION ---
  const shareReport = () => {
    const fixedCount = results.filter(f => f.message.includes("[FIXED]")).length;
    const reportText = `🚀 DX-Ray Scan Summary\nProject: ${url}\nInitial Health: ${initialScore}%\nImproved Health: ${healthScore}%\nIssues Resolved: ${fixedCount}/8\n#DXRay #DevTools`;
    
    navigator.clipboard.writeText(reportText);
    alert("Full Report Summary Copied to Clipboard!");
  };

  const startScan = async () => {
    if (!url) return;
    setStatus("scanning");
    setProgress(0);
    const interval = setInterval(() => setProgress((o) => (o < 100 ? o + 1 : o)), 30);

    try {
      const res = await fetch("/api/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      const data = await res.json();
      
      if (data.error) throw new Error(data.error);

      setTimeout(() => {
        clearInterval(interval);
        setResults(data.findings); 
        setHealthScore(data.overallHealth); 
        setInitialScore(data.overallHealth); // Scan ke time ka pehla score lock kiya
        setStatus("completed");
      }, 2500);
    } catch (err) {
      clearInterval(interval);
      setStatus("idle");
      console.error(err);
      alert("Scan Failed! Check console for details.");
    }
  };

  if (status === "idle") {
    return (
      <main className="h-screen flex flex-col items-center justify-center bg-[#010409] font-mono text-cyan-400 p-4">
        <div className="text-7xl font-black italic mb-4 tracking-tighter animate-pulse text-transparent bg-clip-text bg-gradient-to-b from-cyan-300 to-cyan-600 uppercase">DX-Ray</div>
        <div className="text-sm mb-12 opacity-80 uppercase tracking-widest underline decoration-cyan-900">{displayText}</div>
        <div className="w-full max-w-lg flex gap-2 p-2 border border-cyan-900/50 bg-black rounded-xl shadow-[0_0_30px_rgba(6,182,212,0.1)]">
          <input className="flex-1 bg-transparent p-3 outline-none text-sm" placeholder="PASTE_REPO_URL..." value={url} onChange={(e)=>setUrl(e.target.value)} />
          <button onClick={startScan} className="bg-cyan-500 text-black px-8 font-black hover:bg-white transition-all rounded-lg uppercase text-xs tracking-widest">Analyze</button>
        </div>
      </main>
    );
  }

  if (status === "scanning") {
    return (
      <main className="h-screen bg-black overflow-hidden relative font-mono text-cyan-500 p-12">
        <div className="absolute inset-0 opacity-10 pointer-events-none overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-[1px] bg-cyan-500 animate-[scan_2s_ease-in-out_infinite]"></div>
        </div>
        <div className="grid grid-cols-12 h-full gap-12 relative z-10 items-center">
          <div className="col-span-7">
            <div className="text-[150px] font-black leading-none mb-4 tabular-nums tracking-tighter">{progress}%</div>
            <div className="w-full h-1.5 bg-gray-900 rounded-full mb-12 overflow-hidden border border-cyan-900/30">
              <div className="h-full bg-cyan-400 shadow-[0_0_15px_#22d3ee] transition-all duration-100" style={{width: `${progress}%`}}></div>
            </div>
            <div className="h-32 flex items-end gap-2 opacity-40">
              {Array(8).fill(0).map((_, i) => (
                <div key={i} className="flex-1 bg-cyan-900 rounded-t transition-all duration-300" style={{height: `${Math.random() * progress}%`}}></div>
              ))}
            </div>
          </div>
          <div className="col-span-5 border-l border-cyan-900/50 pl-12 space-y-6">
            <h2 className="text-xs font-black tracking-[0.5em] opacity-50 mb-8 uppercase italic underline">Diagnostic_Checklist</h2>
            {steps.map((s, i) => (
              <div key={i} className={`flex items-center gap-4 text-xs ${progress > (i+1)*12 ? 'text-green-400' : 'text-gray-700'}`}>
                <span className="font-black">{progress > (i+1)*12 ? '[✓]' : '[○]'}</span>
                <span className="uppercase tracking-tighter">{s}</span>
              </div>
            ))}
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen p-6 bg-[#010409] text-slate-400 font-mono text-[11px] animate-in fade-in duration-700">
      <div className="max-w-7xl mx-auto grid grid-cols-12 gap-6">
        <div className="col-span-3 space-y-4">
          <div className="p-6 border border-cyan-900/30 bg-black rounded-xl text-center relative overflow-hidden shadow-[inset_0_0_20px_rgba(6,182,212,0.05)]">
            <div className="relative h-28 w-28 mx-auto flex items-center justify-center">
              <svg className="absolute inset-0 -rotate-90 w-full h-full" viewBox="0 0 128 128">
                <circle cx="64" cy="64" r="54" fill="none" stroke="#0d1117" strokeWidth="6"/>
                <circle cx="64" cy="64" r="54" fill="none" stroke="#00f2ff" strokeWidth="6" strokeDasharray="339" strokeDashoffset={339 - (339 * healthScore) / 100} className="transition-all duration-1000 ease-in-out"/>
              </svg>
              <span className="text-2xl font-black text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.3)]">{healthScore}%</span>
            </div>
            
            {/* COMPARISON SUMMARY (Updated dynamically) */}
            <div className="mt-4 pt-4 border-t border-slate-800 text-left space-y-2">
              <div className="flex justify-between opacity-50 uppercase text-[8px] font-bold"><span>Initial Scan:</span> <span>{initialScore}%</span></div>
              <div className="flex justify-between text-green-400 uppercase text-[8px] font-bold"><span>Improvement:</span> <span>+{healthScore - initialScore}%</span></div>
              <div className="flex justify-between text-cyan-500 uppercase text-[8px] font-bold border-t border-slate-900 pt-1"><span>Fixed:</span> <span>{results.filter(f => f.message.includes("[FIXED]")).length}/8</span></div>
            </div>
            <p className="mt-2 text-[9px] font-bold tracking-widest uppercase opacity-40 italic underline decoration-cyan-900">Health_Index_Score</p>
          </div>

          <div className="p-4 border border-slate-800 bg-black rounded-xl">
             <button onClick={shareReport} className="w-full bg-cyan-950/20 border border-cyan-500/30 py-2 rounded text-[10px] font-black uppercase text-cyan-400 hover:bg-cyan-500 hover:text-black transition-all tracking-widest">
               Share_Full_Report
             </button>
          </div>

          <div className="p-6 border border-slate-800 bg-black rounded-xl h-56 shadow-[inset_0_0_20px_rgba(168,85,247,0.05)]">
            <h2 className="text-[9px] font-black text-purple-500 mb-6 uppercase tracking-widest text-center underline italic decoration-purple-900">Pillar_Complexity_Map</h2>
            <div className="flex items-end gap-1.5 h-32 border-b border-slate-800 pb-1">
              {results.map((f, i) => (
                <div 
                  key={i} 
                  title={`${f.message} | Impact: ${f.score}`}
                  className={`flex-1 rounded-t-sm cursor-help transition-all duration-500 hover:brightness-150 hover:scale-y-110 origin-bottom ${f.score==='CRITICAL'?'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.4)]':f.score==='WARNING'?'bg-yellow-500':'bg-cyan-500'}`} 
                  style={{height: `${f.score==='CRITICAL'?95:f.score==='WARNING'?60:25}%`}} 
                />
              ))}
            </div>
          </div>
        </div>

        <div className="col-span-9 space-y-6">
          <div className="flex justify-between items-center border-b border-slate-800 pb-4">
            <h1 className="text-xl font-black italic text-cyan-500 uppercase tracking-widest underline decoration-cyan-900 underline-offset-8">Diagnostic_Report_FINAL</h1>
            <button onClick={()=>setStatus("idle")} className="text-[9px] border border-slate-700 px-4 py-1.5 hover:bg-slate-800 hover:text-white transition-all uppercase font-black text-cyan-400 tracking-widest">Restart_X-Ray</button>
          </div>
          <div className="grid grid-cols-4 gap-4">
            {results.map((f, i) => (
              <DiagnosticCard 
                key={i} 
                finding={f} 
                onFixSuccess={handleFixSuccess} 
              />
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}