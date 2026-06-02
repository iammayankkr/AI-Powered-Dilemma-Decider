import React, { useState } from "react";
import { Plus, Check, Trash2, Sliders, Play, AlertCircle, Info, RefreshCw, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { SavedDecision, DecisionItem } from "../types";

interface BalanceViewProps {
  decision: SavedDecision;
  onUpdate: (updatedDecision: SavedDecision) => void;
  savedList?: SavedDecision[];
}

export function BalanceView({ decision, onUpdate, savedList = [] }: BalanceViewProps) {
  const [leftOptionIdx, setLeftOptionIdx] = useState(0);
  const [rightOptionIdx, setRightOptionIdx] = useState(1);

  // New custom factor forms state (per option)
  const [newFactorText, setNewFactorText] = useState("");
  const [newFactorType, setNewFactorType] = useState<"pro" | "con">("pro");
  const [newFactorImpact, setNewFactorImpact] = useState(3);
  const [newFactorCategory, setNewFactorCategory] = useState("Personal");
  const [addingToOption, setAddingToOption] = useState<string | null>(null);

  const { options, optionsAnalysis } = decision.analysis;

  // Active deactivated factors (id -> true meaning ignored)
  const [ignoredFactorIds, setIgnoredFactorIds] = useState<Record<string, boolean>>({});

  // Reset to default weights
  const handleResetWeights = () => {
    onUpdate({
      ...decision,
      customProWeights: {},
      customConWeights: {},
      customPros: {},
      customCons: {}
    });
    setIgnoredFactorIds({});
  };

  // Toggle ignoring a factor
  const toggleIgnoreFactor = (id: string) => {
    setIgnoredFactorIds(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  // Helper to compute a specific factor's active weight
  const getFactorWeight = (id: string, isPro: boolean, defaultWeight: number) => {
    if (isPro) {
      return decision.customProWeights[id] ?? defaultWeight;
    } else {
      return decision.customConWeights[id] ?? defaultWeight;
    }
  };

  // Update a factor's weight
  const handleWeightChange = (id: string, isPro: boolean, val: number) => {
    let updatedProWeights = { ...decision.customProWeights };
    let updatedConWeights = { ...decision.customConWeights };

    if (isPro) {
      updatedProWeights[id] = val;
    } else {
      updatedConWeights[id] = val;
    }

    onUpdate({
      ...decision,
      customProWeights: updatedProWeights,
      customConWeights: updatedConWeights
    });
  };

  // Helper to get total list of pros for an options (AI + Custom)
  const getProsList = (optionName: string) => {
    const aiPros = optionsAnalysis.find(o => o.optionName === optionName)?.pros ?? [];
    const customPros = decision.customPros[optionName] ?? [];
    return [...aiPros, ...customPros];
  };

  // Helper to get total list of cons for an options (AI + Custom)
  const getConsList = (optionName: string) => {
    const aiCons = optionsAnalysis.find(o => o.optionName === optionName)?.cons ?? [];
    const customCons = decision.customCons[optionName] ?? [];
    return [...aiCons, ...customCons];
  };

  // Compute stats for an option
  const computeOptionStats = (optionName: string) => {
    const pros = getProsList(optionName);
    const cons = getConsList(optionName);

    let totalProWeight = 0;
    let proCount = 0;
    pros.forEach(p => {
      if (!ignoredFactorIds[p.id]) {
        totalProWeight += getFactorWeight(p.id, true, p.impact);
        proCount++;
      }
    });

    let totalConWeight = 0;
    let conCount = 0;
    cons.forEach(c => {
      if (!ignoredFactorIds[c.id]) {
        totalConWeight += getFactorWeight(c.id, false, c.impact);
        conCount++;
      }
    });

    return {
      totalProWeight,
      totalConWeight,
      netScore: totalProWeight - totalConWeight,
      proCount,
      conCount
    };
  };

  // Add custom factor
  const handleAddCustomFactor = (optionName: string) => {
    if (!newFactorText.trim()) return;

    const newId = `custom-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const newItem: DecisionItem = {
      id: newId,
      text: newFactorText.trim(),
      impact: newFactorImpact,
      category: newFactorCategory,
    };

    const updatedCustom = { ...(newFactorType === "pro" ? decision.customPros : decision.customCons) };
    const optionList = updatedCustom[optionName] ?? [];
    updatedCustom[optionName] = [...optionList, newItem];

    onUpdate({
      ...decision,
      customPros: newFactorType === "pro" ? updatedCustom : decision.customPros,
      customCons: newFactorType === "con" ? updatedCustom : decision.customCons,
    });

    // Reset inputs
    setNewFactorText("");
    setAddingToOption(null);
  };

  // Delete custom factor
  const handleDeleteCustomFactor = (optionName: string, id: string, type: "pro" | "con") => {
    if (type === "pro") {
      const optionList = decision.customPros[optionName] ?? [];
      onUpdate({
        ...decision,
        customPros: {
          ...decision.customPros,
          [optionName]: optionList.filter(item => item.id !== id)
        }
      });
    } else {
      const optionList = decision.customCons[optionName] ?? [];
      onUpdate({
        ...decision,
        customCons: {
          ...decision.customCons,
          [optionName]: optionList.filter(item => item.id !== id)
        }
      });
    }
  };

  const optionA_Name = options[leftOptionIdx] ?? "";
  const optionB_Name = options[rightOptionIdx] ?? "";

  const statsA = computeOptionStats(optionA_Name);
  const statsB = computeOptionStats(optionB_Name);

  const diff = statsA.netScore - statsB.netScore;
  // Tilt is limited to [-15, 15] degrees
  const tiltAngle = Math.max(-15, Math.min(15, diff * 1.5));

  // Find reference run (either a previous analysis of the same dilemma or the general last chronologically saved run)
  const prevSameDilemma = savedList?.find(item => 
    item.id !== decision.id && 
    item.question.trim().toLowerCase() === decision.question.trim().toLowerCase()
  );

  const prevAnyDilemma = savedList?.find(item => 
    item.id !== decision.id && 
    new Date(item.createdAt).getTime() < new Date(decision.createdAt).getTime()
  );

  const referenceDec = prevSameDilemma || prevAnyDilemma;

  const getOptionStatsForDec = (dec: SavedDecision, optionName: string) => {
    const aiPros = dec.analysis.optionsAnalysis.find(o => o.optionName === optionName)?.pros ?? [];
    const customPros = dec.customPros[optionName] ?? [];
    const pros = [...aiPros, ...customPros];

    const aiCons = dec.analysis.optionsAnalysis.find(o => o.optionName === optionName)?.cons ?? [];
    const customCons = dec.customCons[optionName] ?? [];
    const cons = [...aiCons, ...customCons];

    let totalPro = 0;
    pros.forEach(p => {
      totalPro += dec.customProWeights[p.id] ?? p.impact;
    });

    let totalCon = 0;
    cons.forEach(c => {
      totalCon += dec.customConWeights[c.id] ?? c.impact;
    });

    return {
      totalPro,
      totalCon,
      netScore: totalPro - totalCon
    };
  };

  let referenceGap = 0;
  let referenceLabel = "";

  const currentGap = Math.abs(statsA.netScore - statsB.netScore);

  if (referenceDec) {
    const refOptions = referenceDec.analysis.options;
    const hasSameOptions = refOptions.includes(optionA_Name) && refOptions.includes(optionB_Name);
    
    if (hasSameOptions) {
      const refStatsA = getOptionStatsForDec(referenceDec, optionA_Name);
      const refStatsB = getOptionStatsForDec(referenceDec, optionB_Name);
      referenceGap = Math.abs(refStatsA.netScore - refStatsB.netScore);
      referenceLabel = prevSameDilemma 
        ? "vs. previous run of this dilemma" 
        : `vs. previous general dilemma ("${referenceDec.analysis.title}")`;
    } else {
      const refOptA = refOptions[0] || "";
      const refOptB = refOptions[1] || "";
      const refStatsA = getOptionStatsForDec(referenceDec, refOptA);
      const refStatsB = getOptionStatsForDec(referenceDec, refOptB);
      referenceGap = Math.abs(refStatsA.netScore - refStatsB.netScore);
      referenceLabel = `vs. previous general dilemma ("${referenceDec.analysis.title}")`;
    }
  } else {
    // Baseline is: Initial AI Baseline Run of current active dilemma
    const baseStatsA = {
      totalPro: optionsAnalysis.find(o => o.optionName === optionA_Name)?.pros.reduce((acc, p) => acc + p.impact, 0) ?? 0,
      totalCon: optionsAnalysis.find(o => o.optionName === optionA_Name)?.cons.reduce((acc, c) => acc + c.impact, 0) ?? 0,
    };
    const baseStatsB = {
      totalPro: optionsAnalysis.find(o => o.optionName === optionB_Name)?.pros.reduce((acc, p) => acc + p.impact, 0) ?? 0,
      totalCon: optionsAnalysis.find(o => o.optionName === optionB_Name)?.cons.reduce((acc, c) => acc + c.impact, 0) ?? 0,
    };
    const baseNetA = baseStatsA.totalPro - baseStatsA.totalCon;
    const baseNetB = baseStatsB.totalPro - baseStatsB.totalCon;
    referenceGap = Math.abs(baseNetA - baseNetB);
    referenceLabel = "vs. original AI-generated baseline";
  }

  const gapDifference = currentGap - referenceGap;
  let trendType: "widened" | "narrowed" | "unchanged" = "unchanged";
  if (gapDifference > 0) {
    trendType = "widened";
  } else if (gapDifference < 0) {
    trendType = "narrowed";
  }

  return (
    <div className="space-y-8">
      {/* Weighing Scale Widget */}
      <div className="bg-gradient-to-br from-indigo-950 via-slate-900 to-slate-950 text-white p-6 md:p-8 rounded-3xl shadow-xl border border-indigo-500/20 relative overflow-hidden">
        {/* Colorful backdrop indicator */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col items-center">
          <div className="flex items-center justify-between w-full mb-6 flex-wrap gap-4">
            <div>
              <span className="font-mono text-[10px] uppercase tracking-widest text-indigo-400 font-bold">
                Real-Time Leverage Engine
              </span>
              <h3 className="text-xl font-bold mt-0.5 tracking-tight font-display text-transparent bg-clip-text bg-gradient-to-r from-white via-indigo-100 to-indigo-300">Tilt & Balance Ledger</h3>
            </div>
            
            <button
              onClick={handleResetWeights}
              className="text-xs flex items-center gap-1.5 bg-indigo-900/50 hover:bg-indigo-900 border border-indigo-500/30 text-indigo-200 font-bold px-3.5 py-2 rounded-xl transition hover:border-indigo-400/50"
            >
              <RefreshCw className="h-3 w-3 text-indigo-400" /> Revert to Default AI Weights
            </button>
          </div>

          {/* Option selectors if there are > 2 options */}
          {options.length > 2 && (
            <div className="flex items-center gap-2 mb-8 bg-indigo-950/60 p-2.5 rounded-xl border border-indigo-500/20 text-sm">
              <span className="text-indigo-300 pl-2 font-mono text-xs">Compare:</span>
              <select
                value={leftOptionIdx}
                onChange={(e) => setLeftOptionIdx(Number(e.target.value))}
                className="bg-slate-900 border border-indigo-500/30 text-white rounded-lg px-2 py-1 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              >
                {options.map((opt, i) => (
                  <option key={i} value={i} disabled={i === rightOptionIdx}>
                    {opt}
                  </option>
                ))}
              </select>
              <span className="text-indigo-400 text-xs">vs</span>
              <select
                value={rightOptionIdx}
                onChange={(e) => setRightOptionIdx(Number(e.target.value))}
                className="bg-slate-900 border border-indigo-500/30 text-white rounded-lg px-2 py-1 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              >
                {options.map((opt, i) => (
                  <option key={i} value={i} disabled={i === leftOptionIdx}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Physical Balance Scale Visual */}
          <div className="w-full max-w-lg flex flex-col items-center mt-4">
            {/* The lever/beam */}
            <div className="relative w-full h-1 bg-gradient-to-r from-indigo-500/40 via-indigo-400 to-indigo-500/40 mb-2 rounded-full">
              <div
                className="absolute inset-x-0 -top-6 bottom-0 flex justify-between px-6 transition-all duration-300 ease-out origin-center"
                style={{ transform: `rotate(${tiltAngle}deg)` }}
              >
                {/* Left Pan */}
                <div className="flex flex-col items-center -translate-y-4">
                  <div className={`p-4 rounded-xl text-center shadow-lg border w-40 transition-all duration-300 ${
                    statsA.netScore > statsB.netScore
                      ? "bg-slate-950 border-emerald-500/80 shadow-emerald-500/10 scale-105"
                      : "bg-[#0c1225] border-slate-800"
                  }`}>
                    <span className="block text-xs text-indigo-200/70 font-light truncate px-1">
                      {optionA_Name}
                    </span>
                    <span className={`text-2xl font-bold block mt-1 ${statsA.netScore > statsB.netScore ? "text-emerald-450 text-emerald-450-glow" : "text-white"}`}>
                      {statsA.netScore > 0 ? `+${statsA.netScore}` : statsA.netScore}
                    </span>
                    <span className="text-[9px] font-mono text-slate-500 block mt-0.5">
                      P: {statsA.totalProWeight} | C: {statsA.totalConWeight}
                    </span>
                  </div>
                  <div className="w-0.5 h-10 bg-gradient-to-b from-indigo-500 to-indigo-950/20 mt-1" />
                </div>

                {/* Right Pan */}
                <div className="flex flex-col items-center -translate-y-4">
                  <div className={`p-4 rounded-xl text-center shadow-lg border w-40 transition-all duration-300 ${
                    statsB.netScore > statsA.netScore
                      ? "bg-slate-950 border-emerald-500/80 shadow-emerald-500/10 scale-105"
                      : "bg-[#0c1225] border-slate-800"
                  }`}>
                    <span className="block text-xs text-indigo-200/70 font-light truncate px-1">
                      {optionB_Name}
                    </span>
                    <span className={`text-2xl font-bold block mt-1 ${statsB.netScore > statsA.netScore ? "text-emerald-450 text-emerald-450-glow" : "text-white"}`}>
                      {statsB.netScore > 0 ? `+${statsB.netScore}` : statsB.netScore}
                    </span>
                    <span className="text-[9px] font-mono text-slate-500 block mt-0.5">
                      P: {statsB.totalProWeight} | C: {statsB.totalConWeight}
                    </span>
                  </div>
                  <div className="w-0.5 h-10 bg-gradient-to-b from-indigo-500 to-indigo-950/20 mt-1" />
                </div>
              </div>
            </div>

            {/* Scale stand */}
            <div className="w-2.5 h-20 bg-gradient-to-b from-indigo-800 to-slate-950" />
            <div className="w-24 h-1.5 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-full border border-indigo-500/10" />
          </div>

          {/* Verdict Text & Trend Indicator based on score */}
          <div className="mt-8 w-full max-w-md flex flex-col gap-3">
            {/* Verdict text */}
            <div className="text-center bg-slate-950/60 border border-slate-800/85 p-4 rounded-2xl w-full">
              {diff === 0 ? (
                <p className="text-xs text-slate-400 font-light">
                  The decision is <strong className="text-amber-500 font-medium">perfectly balanced</strong>. Shift importance weights or toggle items to reveal a leverage lead.
                </p>
              ) : (
                <p className="text-xs text-slate-300 font-light leading-relaxed">
                  Based on your preferences, <strong className="text-emerald-400 font-medium">{diff > 0 ? optionA_Name : optionB_Name}</strong> holds a leverage lead of <strong className="text-emerald-400 font-medium">+{Math.abs(diff)}</strong> points.
                </p>
              )}
            </div>

            {/* Dilemma Leverage Trend Indicator */}
            <div className="bg-slate-950/60 border border-slate-800/60 p-3 flex items-center justify-between gap-3 rounded-xl w-full text-xs">
              <div className="space-y-0.5 text-left">
                <span className="text-[9px] uppercase tracking-wider text-slate-500 font-mono font-bold block">
                  Leverage Gap Trend
                </span>
                <span className="text-slate-400 font-light text-[10px] block truncate max-w-[180px]" title={referenceLabel}>
                  {referenceLabel}
                </span>
              </div>
              
              <div className="flex items-center gap-2 shrink-0">
                {/* Gap values compared */}
                <span className="text-slate-400 font-mono text-[11px] bg-slate-900 border border-slate-800 px-2 py-0.5 rounded">
                  {referenceGap} → <strong className="text-white font-semibold">{currentGap}</strong>
                </span>

                {/* Trend badge */}
                {trendType === "widened" && (
                  <span className="px-2 py-0.5 bg-emerald-950 text-emerald-400 border border-emerald-900/65 rounded font-mono font-medium text-[10px] flex items-center gap-1">
                    <TrendingUp className="h-3 w-3" /> +{Math.abs(gapDifference)}
                  </span>
                )}
                {trendType === "narrowed" && (
                  <span className="px-2 py-0.5 bg-amber-950 text-amber-400 border border-amber-900/65 rounded font-mono font-medium text-[10px] flex items-center gap-1">
                    <TrendingDown className="h-3 w-3" /> -{Math.abs(gapDifference)}
                  </span>
                )}
                {trendType === "unchanged" && (
                  <span className="px-2 py-0.5 bg-slate-900 text-slate-400 border border-slate-800 rounded font-mono font-medium text-[10px] flex items-center gap-1">
                    <Minus className="h-3 w-3" /> =
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* LEFT OPTION BOX */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-slate-150 mb-6">
              <span className="font-mono text-[10px] uppercase text-slate-400 font-bold tracking-wider">
                PATH ONE
              </span>
              <h4 className="text-sm font-medium text-slate-900 truncate max-w-[70%] font-display">
                {optionA_Name}
              </h4>
            </div>

            {/* Factors List Option A */}
            <div className="space-y-6">
              {/* Pros */}
              <div>
                <h5 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5 mb-3 font-mono">
                  <span className="bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded text-[9px] font-bold font-mono">PROS</span>
                  Benefits & Opportunities
                </h5>
                <div className="space-y-3">
                  {getProsList(optionA_Name).map((item) => (
                    <FactorRow
                      key={item.id}
                      item={item}
                      isPro={true}
                      ignored={ignoredFactorIds[item.id] || false}
                      activeWeight={getFactorWeight(item.id, true, item.impact)}
                      onWeightChange={(val) => handleWeightChange(item.id, true, val)}
                      onToggleIgnore={() => toggleIgnoreFactor(item.id)}
                      onDelete={
                        item.id.startsWith("custom-")
                           ? () => handleDeleteCustomFactor(optionA_Name, item.id, "pro")
                           : undefined
                      }
                    />
                  ))}
                  {getProsList(optionA_Name).length === 0 && (
                    <p className="text-slate-400 text-xs italic font-light">No pros available.</p>
                  )}
                </div>
              </div>

              {/* Cons */}
              <div>
                <h5 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5 mb-3 font-mono">
                  <span className="bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded text-[9px] font-bold font-mono">CONS</span>
                  Costs, Risks & Friction
                </h5>
                <div className="space-y-3">
                  {getConsList(optionA_Name).map((item) => (
                    <FactorRow
                      key={item.id}
                      item={item}
                      isPro={false}
                      ignored={ignoredFactorIds[item.id] || false}
                      activeWeight={getFactorWeight(item.id, false, item.impact)}
                      onWeightChange={(val) => handleWeightChange(item.id, false, val)}
                      onToggleIgnore={() => toggleIgnoreFactor(item.id)}
                      onDelete={
                        item.id.startsWith("custom-")
                           ? () => handleDeleteCustomFactor(optionA_Name, item.id, "con")
                           : undefined
                      }
                    />
                  ))}
                  {getConsList(optionA_Name).length === 0 && (
                    <p className="text-slate-400 text-xs italic font-light">No cons available.</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Add custom pro/con tool for Path A */}
          <div className="mt-8 pt-6 border-t border-slate-100">
            {addingToOption === optionA_Name ? (
              <div className="bg-slate-50/80 p-4 rounded-xl border border-slate-200 text-sm space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide font-mono">New Custom Factor</span>
                  <button
                    onClick={() => setAddingToOption(null)}
                    className="text-xs text-slate-400 hover:text-slate-600 font-mono cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
                
                <input
                  type="text"
                  placeholder="Describe your custom pro or con..."
                  value={newFactorText}
                  onChange={(e) => setNewFactorText(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-slate-400 outline-none placeholder:text-slate-405"
                />

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1 font-mono">Type</label>
                    <select
                      value={newFactorType}
                      onChange={(e) => setNewFactorType(e.target.value as "pro" | "con")}
                      className="w-full bg-white border border-slate-200 rounded-lg p-1.5 focus:ring-1 focus:ring-slate-400 outline-none"
                    >
                      <option value="pro">Pro (Benefit)</option>
                      <option value="con">Con (Dilemma)</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1 font-mono">Weights (1-5)</label>
                    <input
                      type="number"
                      min="1"
                      max="5"
                      value={newFactorImpact}
                      onChange={(e) => setNewFactorImpact(Number(e.target.value))}
                      className="w-full bg-white border border-slate-200 rounded-lg p-1 text-center font-mono focus:ring-1 focus:ring-slate-400 outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1 font-mono">Category</label>
                  <input
                    type="text"
                    placeholder="e.g., Lifestyle, Cost, Health"
                    value={newFactorCategory}
                    onChange={(e) => setNewFactorCategory(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs focus:ring-1 focus:ring-slate-400 outline-none placeholder:text-slate-400"
                  />
                </div>

                <button
                  type="button"
                  id={`save-custom-factor-btn-${optionA_Name.replace(/\s+/g, '-')}`}
                  onClick={() => handleAddCustomFactor(optionA_Name)}
                  className="w-full text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-white rounded-lg py-2 transition cursor-pointer shadow-sm"
                >
                  Save Factor to {optionA_Name}
                </button>
              </div>
            ) : (
              <button
                onClick={() => {
                  setAddingToOption(optionA_Name);
                  setNewFactorType("pro");
                  setNewFactorImpact(3);
                }}
                className="w-full text-xs text-slate-500 border border-dashed border-slate-200 hover:border-slate-350 rounded-lg py-3.5 text-center transition cursor-pointer font-light hover:text-slate-805"
              >
                + Add Custom Factor to {optionA_Name}
              </button>
            )}
          </div>
        </div>

        {/* RIGHT OPTION BOX */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-slate-150 mb-6 font-mono">
              <span className="font-mono text-[10px] uppercase text-slate-400 font-bold tracking-wider">
                PATH TWO
              </span>
              <h4 className="text-sm font-medium text-slate-900 truncate max-w-[70%] font-display font-sans">
                {optionB_Name}
              </h4>
            </div>

            {/* Factors List Option B */}
            <div className="space-y-6">
              {/* Pros */}
              <div>
                <h5 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5 mb-3 font-mono">
                  <span className="bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded text-[9px] font-bold font-mono">PROS</span>
                  Benefits & Opportunities
                </h5>
                <div className="space-y-3">
                  {getProsList(optionB_Name).map((item) => (
                    <FactorRow
                      key={item.id}
                      item={item}
                      isPro={true}
                      ignored={ignoredFactorIds[item.id] || false}
                      activeWeight={getFactorWeight(item.id, true, item.impact)}
                      onWeightChange={(val) => handleWeightChange(item.id, true, val)}
                      onToggleIgnore={() => toggleIgnoreFactor(item.id)}
                      onDelete={
                        item.id.startsWith("custom-")
                           ? () => handleDeleteCustomFactor(optionB_Name, item.id, "pro")
                           : undefined
                      }
                    />
                  ))}
                  {getProsList(optionB_Name).length === 0 && (
                    <p className="text-slate-400 text-xs italic font-light">No pros available.</p>
                  )}
                </div>
              </div>

              {/* Cons */}
              <div>
                <h5 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5 mb-3 font-mono">
                  <span className="bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded text-[9px] font-bold font-mono">CONS</span>
                  Costs, Risks & Friction
                </h5>
                <div className="space-y-3">
                  {getConsList(optionB_Name).map((item) => (
                    <FactorRow
                      key={item.id}
                      item={item}
                      isPro={false}
                      ignored={ignoredFactorIds[item.id] || false}
                      activeWeight={getFactorWeight(item.id, false, item.impact)}
                      onWeightChange={(val) => handleWeightChange(item.id, false, val)}
                      onToggleIgnore={() => toggleIgnoreFactor(item.id)}
                      onDelete={
                        item.id.startsWith("custom-")
                           ? () => handleDeleteCustomFactor(optionB_Name, item.id, "con")
                           : undefined
                      }
                    />
                  ))}
                  {getConsList(optionB_Name).length === 0 && (
                    <p className="text-slate-400 text-xs italic font-light">No cons available.</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Add custom pro/con tool for Path B */}
          <div className="mt-8 pt-6 border-t border-slate-100">
            {addingToOption === optionB_Name ? (
              <div className="bg-slate-50/80 p-4 rounded-xl border border-slate-200 text-sm space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide font-mono">New Custom Factor</span>
                  <button
                    onClick={() => setAddingToOption(null)}
                    className="text-xs text-slate-400 hover:text-slate-600 font-mono cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
                
                <input
                  type="text"
                  placeholder="Describe your custom pro or con..."
                  value={newFactorText}
                  onChange={(e) => setNewFactorText(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-slate-400 outline-none placeholder:text-slate-405"
                />

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1 font-mono">Type</label>
                    <select
                      value={newFactorType}
                      onChange={(e) => setNewFactorType(e.target.value as "pro" | "con")}
                      className="w-full bg-white border border-slate-200 rounded-lg p-1.5 focus:ring-1 focus:ring-slate-400 outline-none"
                    >
                      <option value="pro">Pro (Benefit)</option>
                      <option value="con">Con (Dilemma)</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1 font-mono">Weights (1-5)</label>
                    <input
                      type="number"
                      min="1"
                      max="5"
                      value={newFactorImpact}
                      onChange={(e) => setNewFactorImpact(Number(e.target.value))}
                      className="w-full bg-white border border-slate-200 rounded-lg p-1 text-center font-mono focus:ring-1 focus:ring-slate-400 outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1 font-mono">Category</label>
                  <input
                    type="text"
                    placeholder="e.g., Lifestyle, Cost, Health"
                    value={newFactorCategory}
                    onChange={(e) => setNewFactorCategory(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs focus:ring-1 focus:ring-slate-400 outline-none placeholder:text-slate-404"
                  />
                </div>

                <button
                  type="button"
                  id={`save-custom-factor-btn-${optionB_Name.replace(/\s+/g, '-')}`}
                  onClick={() => handleAddCustomFactor(optionB_Name)}
                  className="w-full text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-white rounded-lg py-2 transition cursor-pointer shadow-sm"
                >
                  Save Factor to {optionB_Name}
                </button>
              </div>
            ) : (
              <button
                onClick={() => {
                  setAddingToOption(optionB_Name);
                  setNewFactorType("pro");
                  setNewFactorImpact(3);
                }}
                className="w-full text-xs text-slate-500 border border-dashed border-slate-200 hover:border-slate-350 rounded-lg py-3.5 text-center transition cursor-pointer font-light hover:text-slate-805"
              >
                + Add Custom Factor to {optionB_Name}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Subcomponent for each factor row
interface FactorRowProps {
  key?: string;
  item: DecisionItem;
  ignored: boolean;
  isPro: boolean;
  activeWeight: number;
  onWeightChange: (val: number) => void;
  onToggleIgnore: () => void;
  onDelete?: () => void;
}

function FactorRow({
  item,
  ignored,
  isPro,
  activeWeight,
  onWeightChange,
  onToggleIgnore,
  onDelete
}: FactorRowProps) {
  return (
    <div
      className={`group relative p-3.5 rounded-xl border transition-all duration-200 ${
        ignored
          ? "bg-slate-50 border-slate-200 opacity-40 hover:opacity-60"
          : "bg-white hover:bg-slate-50/50 border-slate-150 shadow-sm"
      }`}
    >
      <div className="flex items-start gap-3">
        {/* Checkbox */}
        <button
          onClick={onToggleIgnore}
          className={`mt-0.5 h-4.5 w-4.5 rounded border flex items-center justify-center transition cursor-pointer shrink-0 ${
            ignored
              ? "border-slate-300 bg-white"
              : "bg-slate-900 border-slate-900 text-white hover:bg-slate-800"
          }`}
        >
          {!ignored && <Check className="h-3 w-3 inline" />}
        </button>

        {/* Content */}
        <div className="flex-1 space-y-1.5">
          <div className="flex items-start justify-between gap-1">
            <p className={`text-xs text-slate-750 font-light leading-relaxed ${ignored ? "line-through text-slate-400" : ""}`}>
              {item.text}
            </p>
            {onDelete && (
              <button
                onClick={onDelete}
                className="text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition shrink-0 ml-1 cursor-pointer"
              >
                <Trash2 className="h-3 w-3" />
              </button>
            )}
          </div>

          {!ignored && (
            <div className="flex items-center gap-4 text-[10px] text-slate-400 font-mono mt-1">
              <span className="bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded font-bold uppercase tracking-wide">
                {item.category}
              </span>
              <div className="flex items-center gap-1.5 flex-1 max-w-[120px]">
                <span className="shrink-0 font-medium">Weight: {activeWeight}</span>
                <input
                  type="range"
                  min="1"
                  max="5"
                  value={activeWeight}
                  onChange={(e) => onWeightChange(Number(e.target.value))}
                  className="w-full h-1 bg-slate-200 accent-slate-900 rounded-full cursor-ew-resize opacity-60 hover:opacity-100 transition-all outline-none"
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
