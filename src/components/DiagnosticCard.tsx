"use client";
import { useState } from 'react';


export default function DiagnosticCard({ finding, onFixSuccess }: any) {
  const [isFixing, setIsFixing] = useState(false);
  const [step, setStep] = useState(0);

  const colors: any = {
    CRITICAL: "border-red-500 text-red-500 shadow-[0_0_15px_rgba(239,68,68,0.2)]",
    WARNING: "border-yellow-500 text-yellow-500 shadow-[0_0_15px_rgba(234,179,8,0.2)]",
    HEALTHY: "border-cyan-500 text-cyan-500 shadow-[0_0_15px_rgba(6,182,212,0.2)]",
    INFO: "border-blue-400 text-blue-400 shadow-[0_0_15px_rgba(96,165,250,0.2)]"
  };

  
  const runFix = () => {
    setIsFixing(true);
    setStep(1);
    
  
    setTimeout(() => setStep(2), 800);
    
    
    setTimeout(() => setStep(3), 1600);
    
    
    setTimeout(() => {
      setIsFixing(false);
      setStep(0);
      
      
      if (onFixSuccess) {
        onFixSuccess(finding.category);
      }
    }, 3000);
  };

  return (
    <div className={`group aspect-square rounded-full border-2 p-4 flex flex-col items-center justify-center text-center transition-all duration-300 relative bg-black/40 hover:scale-105 hover:bg-slate-900/90 ${colors[finding.score]}`}>
      
      {/* INITIAL VIEW: Normal status */}
      <div className={`transition-opacity duration-200 ${isFixing ? 'opacity-0' : 'group-hover:opacity-0'}`}>
        <div className="text-[7px] uppercase font-bold opacity-50 mb-1">{finding.category}</div>
        <div className="text-[10px] font-black leading-tight uppercase italic">{finding.message}</div>
      </div>

      {/* HOVER / FIXING VIEW: Evidence and Terminal */}
      <div className={`absolute inset-0 p-3 flex flex-col items-center justify-center transition-opacity duration-200 ${isFixing ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
        {!isFixing ? (
          <div className="space-y-2">
            <div className="text-[8px] font-mono leading-tight border-b border-current pb-1 mb-1 italic">
              Evidence: {finding.evidence}
            </div>
            <button 
              onClick={runFix} 
              className="w-full bg-current text-black py-0.5 text-[8px] font-black uppercase hover:bg-white transition-colors"
            >
              Execute_Fix
            </button>
          </div>
        ) : (
          <div className="text-[7px] font-mono text-left w-full space-y-1">
            <div className={step >= 1 ? "opacity-100" : "opacity-20"}>&gt; INIT_REPAIR...</div>
            <div className={step >= 2 ? "opacity-100" : "opacity-20"}>&gt; PATCHING_DATA...</div>
            <div className={step >= 3 ? "text-green-400 font-bold" : "opacity-20"}>&gt; FIXED_SUCCESS.</div>
          </div>
        )}
      </div>

      {/* Small pulsing status dot */}
      <div className="absolute bottom-3 w-1 h-1 rounded-full bg-current animate-pulse"></div>
    </div>
  );
}