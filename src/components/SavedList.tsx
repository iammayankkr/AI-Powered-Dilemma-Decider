import React from "react";
import { Plus, Archive, History, Trash2, Calendar, Scale } from "lucide-react";
import { SavedDecision } from "../types";

interface SavedListProps {
  savedList: SavedDecision[];
  activeId: string | null;
  onSelect: (id: string | null) => void;
  onDelete: (id: string) => void;
  onNewDecision: () => void;
}

export function SavedList({
  savedList,
  activeId,
  onSelect,
  onDelete,
  onNewDecision,
}: SavedListProps) {
  return (
    <div className="flex flex-col h-full bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-sm">
      {/* Header */}
      <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold tracking-[0.15em] text-slate-400 uppercase font-mono">
            Dilemma Vault
          </span>
          <span className="bg-slate-100 text-slate-600 font-mono text-[9px] font-bold px-1.5 py-0.5 rounded border border-slate-200">
            {savedList.length}
          </span>
        </div>
      </div>

      {/* New Decision Button */}
      <div className="p-3 bg-slate-50/30">
        <button
          onClick={onNewDecision}
          className="w-full flex items-center justify-center gap-1.5 bg-gradient-to-r from-indigo-600 via-indigo-500 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white font-semibold text-xs py-2.5 px-4 rounded-xl transition shadow-md shadow-indigo-500/15 hover:shadow-indigo-500/25 hover:scale-[1.02] cursor-pointer"
        >
          <Plus className="h-3.5 w-3.5" /> New Analysis
        </button>
      </div>

      {/* History Items list */}
      <div className="flex-1 overflow-y-auto px-2 pb-4 space-y-1">
        {savedList.length === 0 ? (
          <div className="text-center py-10 px-4 space-y-1.5">
            <div className="bg-slate-50 text-slate-400 p-2.5 rounded-full inline-flex items-center justify-center">
              <Scale className="h-4.5 w-4.5" />
            </div>
            <p className="text-xs text-slate-400 font-medium font-sans">Vault is empty</p>
            <p className="text-[10px] text-slate-400 leading-normal font-light">
              Analyses are safely cached locally on your device.
            </p>
          </div>
        ) : (
          savedList.map((item) => {
            const isActive = activeId === item.id;
            const formattedDate = new Date(item.createdAt).toLocaleDateString(undefined, {
              month: "short",
              day: "numeric"
            });

            return (
              <div
                key={item.id}
                onClick={() => onSelect(item.id)}
                className={`group flex items-center justify-between p-3 rounded-xl border transition-all duration-200 cursor-pointer relative overflow-hidden ${
                  isActive
                    ? "bg-indigo-50/40 border-indigo-200 text-indigo-950 font-medium shadow-sm"
                    : "bg-white border-transparent hover:bg-slate-50 text-slate-600 hover:scale-[1.01]"
                }`}
              >
                {isActive && (
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-indigo-500 to-blue-500" />
                )}
                <div className={`flex-1 min-w-0 pr-2 ${isActive ? 'pl-2' : ''}`}>
                  <h4 className={`text-xs truncate transition-colors ${isActive ? 'text-indigo-950 font-semibold' : 'text-slate-700 font-light'}`}>
                    {item.analysis.title || item.question}
                  </h4>
                  <div className="flex items-center gap-1.5 text-[10px] text-slate-400 mt-1 font-mono">
                    <Calendar className="h-3 w-3 text-indigo-500/80" /> {formattedDate}
                    <span className="text-[9px]">
                      • {item.analysis.options.length} Paths
                    </span>
                  </div>
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(item.id);
                  }}
                  id={`delete-saved-btn-${item.id}`}
                  className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-md opacity-0 group-hover:opacity-100 focus:opacity-100 transition-all shrink-0 cursor-pointer"
                  title="Delete decision"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
