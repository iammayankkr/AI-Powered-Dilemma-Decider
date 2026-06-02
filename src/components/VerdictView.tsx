import React, { useState } from "react";
import { Sparkles, CheckSquare, Square, Compass, HelpCircle, ArrowRightCircle } from "lucide-react";
import { SavedDecision } from "../types";

interface VerdictViewProps {
  decision: SavedDecision;
}

export function VerdictView({ decision }: VerdictViewProps) {
  const { verdict } = decision.analysis;

  // Track checked next steps locally
  const [checkedSteps, setCheckedSteps] = useState<Record<number, boolean>>({});

  const toggleStep = (idx: number) => {
    setCheckedSteps((prev) => ({
      ...prev,
      [idx]: !prev[idx],
    }));
  };

  return (
    <div className="space-y-8">
      {/* Prime Verdict Block */}
      <div className="bg-gradient-to-br from-white to-indigo-50/10 border-l-4 border-indigo-600 p-6 md:p-8 rounded-r-3xl shadow-md border-y border-r border-indigo-100/60 glow-card-hover">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-indigo-600 font-bold uppercase text-[10px] tracking-wider font-mono">AI Recommendation</span>
          <span className="px-2.5 py-0.5 bg-gradient-to-r from-indigo-500 to-blue-600 text-white text-[10px] rounded-full font-bold font-mono border border-indigo-200 shadow-sm shadow-indigo-500/10">Confidence: {verdict.confidenceScore}%</span>
        </div>
        <div className="space-y-4">
          <h3 className="text-2xl font-light text-slate-900 tracking-tight leading-tight">
            Recommended Choice: <span className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-purple-600 to-blue-600 font-display">{verdict.recommendedOption}</span>
          </h3>
          <p className="text-sm md:text-base font-light italic text-slate-700 leading-relaxed font-sans border-l-2 border-indigo-200 pl-4 py-1">
            "{verdict.reasoning}"
          </p>
        </div>
      </div>

      {/* Grid of reflection and roadmap */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
        {/* Reflection Questions */}
        <div className="md:col-span-5 space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-200">
            <HelpCircle className="h-4 w-4 text-slate-400" />
            <h4 className="font-medium text-slate-900 text-sm md:text-base tracking-tight uppercase tracking-wider font-mono text-[11px] font-bold">
              Reflection Prompts
            </h4>
          </div>

          <p className="text-xs text-slate-500 leading-normal font-light">
            Answer these tailored priority trade-off prompts to test alignment with your values:
          </p>

          <div className="space-y-3">
            {verdict.pivotQuestions.map((q, idx) => (
              <div
                key={idx}
                className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm text-xs text-slate-700 leading-relaxed relative overflow-hidden"
              >
                <span className="p-1 px-1.5 bg-slate-50 border border-slate-200 text-slate-400 rounded text-[9px] font-bold font-mono tracking-wide absolute top-2 right-2">
                  0{idx + 1}
                </span>
                <p className="pr-12 pt-1 font-light leading-relaxed text-slate-600">{q}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Action Roadmap Checklists */}
        <div className="md:col-span-7 space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-200">
            <Compass className="h-4 w-4 text-slate-400" />
            <h4 className="font-medium text-slate-900 text-sm md:text-base tracking-tight uppercase tracking-wider font-mono text-[11px] font-bold">
              Execution Roadmap
            </h4>
          </div>

          <p className="text-xs text-slate-500 leading-normal font-light">
            Take immediate action with these initial steps to execute this decision successfully:
          </p>

          <div className="space-y-2">
            {verdict.nextSteps.map((step, idx) => {
              const checked = checkedSteps[idx] || false;
              return (
                <button
                  key={idx}
                  onClick={() => toggleStep(idx)}
                  id={`roadmap-step-${idx}`}
                  className={`w-full text-left p-4 rounded-xl border transition-all duration-200 flex items-start gap-3 cursor-pointer ${
                    checked
                      ? "bg-slate-50/70 border-slate-200 text-slate-400"
                      : "bg-white border-slate-150 text-slate-700 hover:border-slate-350 shadow-sm"
                  }`}
                >
                  <div className="shrink-0 mt-0.5 text-slate-400">
                    {checked ? (
                      <CheckSquare className="h-4 w-4 text-slate-900" />
                    ) : (
                      <Square className="h-4 w-4 hover:text-slate-600" />
                    )}
                  </div>
                  <div>
                    <span className={`text-xs font-light ${checked ? "line-through text-slate-400" : "text-slate-700"}`}>
                      {step}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
