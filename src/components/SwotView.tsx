import React, { useState } from "react";
import { ShieldCheck, HelpCircle, Zap, AlertTriangle, ArrowUpRight } from "lucide-react";
import { SavedDecision } from "../types";

interface SwotViewProps {
  decision: SavedDecision;
}

export function SwotView({ decision }: SwotViewProps) {
  const { options, optionsAnalysis } = decision.analysis;
  const [selectedOption, setSelectedOption] = useState(options[0] || "");

  const activeAnalysis = optionsAnalysis.find(o => o.optionName === selectedOption);
  const swot = activeAnalysis?.swot || {
    strengths: [],
    weaknesses: [],
    opportunities: [],
    threats: []
  };

  return (
    <div className="space-y-6">
      {/* Segment Selector */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 font-mono">SWOT Matrix Analysis</h3>
          <p className="text-xs text-slate-500 mt-0.5 font-light">Explore internal and external forces driving each possible path.</p>
        </div>
        
        <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-250 self-start md:self-auto">
          {options.map((opt) => (
            <button
              key={opt}
              onClick={() => setSelectedOption(opt)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium tracking-tight transition-all truncate max-w-[200px] cursor-pointer ${
                selectedOption === opt
                  ? "bg-slate-900 text-white shadow-sm"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              {opt}
            </button>
          ))}
        </div>
      </div>

      {/* SWOT Quadrant Layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Strengths */}
        <div className="bg-gradient-to-br from-slate-950 to-slate-900 border border-indigo-500/15 rounded-2xl p-6 text-white shadow-md glow-card-hover">
          <div className="flex items-center gap-2 pb-2.5 border-b border-indigo-500/10 mb-4">
            <ShieldCheck className="h-5 w-5 text-indigo-400" />
            <h3 className="text-indigo-400 font-mono text-[11px] uppercase tracking-wider font-bold">Strengths</h3>
          </div>
          <ul className="space-y-3">
            {swot.strengths.map((s, idx) => (
              <li key={idx} className="flex items-start gap-2.5 text-xs font-light leading-relaxed text-slate-200">
                <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 mt-1.5 shrink-0 animate-pulse" />
                <p>{s}</p>
              </li>
            ))}
            {swot.strengths.length === 0 && (
              <li className="text-slate-500 text-xs italic font-light">No strengths listed.</li>
            )}
          </ul>
        </div>

        {/* Weaknesses */}
        <div className="bg-gradient-to-br from-slate-950 to-slate-900 border border-amber-500/15 rounded-2xl p-6 text-white shadow-md glow-card-hover">
          <div className="flex items-center gap-2 pb-2.5 border-b border-amber-500/10 mb-4">
            <AlertTriangle className="h-5 w-5 text-amber-400" />
            <h3 className="text-amber-400 font-mono text-[11px] uppercase tracking-wider font-bold">Weaknesses</h3>
          </div>
          <ul className="space-y-3">
            {swot.weaknesses.map((w, idx) => (
              <li key={idx} className="flex items-start gap-2.5 text-xs font-light leading-relaxed text-slate-200">
                <div className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1.5 shrink-0" />
                <p>{w}</p>
              </li>
            ))}
            {swot.weaknesses.length === 0 && (
              <li className="text-slate-500 text-xs italic font-light">No weaknesses listed.</li>
            )}
          </ul>
        </div>

        {/* Opportunities */}
        <div className="bg-gradient-to-br from-slate-950 to-slate-900 border border-emerald-500/15 rounded-2xl p-6 text-white shadow-md glow-card-hover">
          <div className="flex items-center gap-2 pb-2.5 border-b border-emerald-500/10 mb-4">
            <Zap className="h-5 w-5 text-emerald-400" />
            <h3 className="text-emerald-400 font-mono text-[11px] uppercase tracking-wider font-bold">Opportunities</h3>
          </div>
          <ul className="space-y-3">
            {swot.opportunities.map((o, idx) => (
              <li key={idx} className="flex items-start gap-2.5 text-xs font-light leading-relaxed text-slate-200">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
                <p>{o}</p>
              </li>
            ))}
            {swot.opportunities.length === 0 && (
              <li className="text-slate-500 text-xs italic font-light">No opportunities listed.</li>
            )}
          </ul>
        </div>

        {/* Threats */}
        <div className="bg-gradient-to-br from-slate-950 to-slate-900 border border-rose-500/15 rounded-2xl p-6 text-white shadow-md glow-card-hover">
          <div className="flex items-center gap-2 pb-2.5 border-b border-rose-500/10 mb-4">
            <HelpCircle className="h-5 w-5 text-rose-400" />
            <h3 className="text-rose-400 font-mono text-[11px] uppercase tracking-wider font-bold">Threats</h3>
          </div>
          <ul className="space-y-3">
            {swot.threats.map((t, idx) => (
              <li key={idx} className="flex items-start gap-2.5 text-xs font-light leading-relaxed text-slate-200">
                <div className="w-1.5 h-1.5 rounded-full bg-rose-400 mt-1.5 shrink-0" />
                <p>{t}</p>
              </li>
            ))}
            {swot.threats.length === 0 && (
              <li className="text-slate-500 text-xs italic font-light">No threats listed.</li>
            )}
          </ul>
        </div>
      </div>
    </div>
  );
}
