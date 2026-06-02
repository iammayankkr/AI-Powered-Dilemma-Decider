import React from "react";
import { CheckCircle } from "lucide-react";
import { SavedDecision } from "../types";

interface ComparisonViewProps {
  decision: SavedDecision;
}

export function ComparisonView({ decision }: ComparisonViewProps) {
  const { comparisonTable, options } = decision.analysis;

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 font-mono">Side-by-Side Comparison</h3>
        <p className="text-xs text-slate-500 mt-0.5 font-light">Evaluate and cross-reference your options across core, objective metrics.</p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse table-auto">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-[10px] uppercase tracking-wider font-mono font-bold">
                <th className="py-4 px-6 font-semibold w-1/4">Evaluation Criterion</th>
                {options.map((opt, i) => (
                  <th key={opt} className="py-4 px-6 font-semibold">
                    <div className="flex items-center gap-1.5">
                      <span className="bg-slate-100 border border-slate-200 text-slate-600 h-4.5 w-4.5 rounded inline-flex items-center justify-center font-bold text-[9px] font-mono shrink-0">
                        0{i + 1}
                      </span>
                      <span className="truncate max-w-[200px] text-slate-800">{opt}</span>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
              {comparisonTable.rows.map((row, idx) => (
                <tr key={idx} className="hover:bg-slate-50/40 transition">
                  {/* Criterion cell */}
                  <td className="py-4 px-6 font-medium text-slate-900 bg-slate-50/10 font-sans">
                    {row.criterion}
                  </td>
                  {/* Option values */}
                  {row.values.map((val, oIdx) => (
                    <td key={oIdx} className="py-4 px-6 max-w-[250px] leading-relaxed text-slate-605 font-light">
                      {val}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-slate-50/50 p-4 rounded-xl flex items-start gap-3 border border-slate-200/80">
        <div className="bg-slate-100 border border-slate-200 text-slate-600 p-1.5 rounded-md mt-0.5 shrink-0">
          <CheckCircle className="h-3.5 w-3.5" />
        </div>
        <div className="text-xs text-slate-500 leading-relaxed font-light">
          <strong className="text-slate-800 font-medium block mb-0.5">Analytical Tip</strong>
          Look for options that solve your highest-risk criteria (e.g. low financial friction or rapid timeline) even if their total count of pros is slightly lower.
        </div>
      </div>
    </div>
  );
}
