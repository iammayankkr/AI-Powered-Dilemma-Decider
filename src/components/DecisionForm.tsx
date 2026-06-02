import React, { useState } from "react";
import { Sparkles, Plus, Trash2, ArrowRight, HelpCircle } from "lucide-react";

interface DecisionFormProps {
  onSubmit: (question: string, options: string[]) => void;
  isLoading: boolean;
}

const TEMPLATES = [
  {
    category: "Career",
    question: "Should I stay at my stable corporate job or join an early-stage startup?",
    options: ["Stable Tech Corporate Job", "Early-Stage Funded Startup"]
  },
  {
    category: "Finances",
    question: "Should I buy a hybrid car or commit to a full electric vehicle (EV)?",
    options: ["Hybrid Vehicle", "Full Electric Vehicle"]
  },
  {
    category: "Life",
    question: "Should we renovate our current home or sell it and move to a new house?",
    options: ["Renovate Our Current Home", "Sell and Buy a New House"]
  }
];

export function DecisionForm({ onSubmit, isLoading }: DecisionFormProps) {
  const [question, setQuestion] = useState("");
  const [options, setOptions] = useState<string[]>(["", ""]);

  const handleAddOption = () => {
    if (options.length < 5) {
      setOptions([...options, ""]);
    }
  };

  const handleRemoveOption = (index: number) => {
    if (options.length > 2) {
      setOptions(options.filter((_, i) => i !== index));
    }
  };

  const handleOptionChange = (index: number, val: string) => {
    const updated = [...options];
    updated[index] = val;
    setOptions(updated);
  };

  const handleApplyTemplate = (q: string, opt: string[]) => {
    setQuestion(q);
    setOptions(opt);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim()) return;
    
    // Filter out blank options
    const cleanOptions = options.map((opt) => opt.trim()).filter(Boolean);
    onSubmit(question.trim(), cleanOptions);
  };

  return (
    <div className="max-w-2xl mx-auto bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-slate-100 glow-card-hover">
      <div className="mb-6 text-center">
        <div className="inline-flex bg-indigo-50/60 text-indigo-700 border border-indigo-100 font-mono text-[10px] px-3 py-1 rounded-full font-bold items-center gap-1.5 mb-3 uppercase tracking-wider shadow-sm">
          <Sparkles className="h-3.5 w-3.5 text-indigo-500 animate-pulse" /> No-bias dilemma analyzer
        </div>
        <h2 className="text-3xl font-bold tracking-tight font-display text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-purple-600 to-blue-600">
          Resolve Your Dilemma
        </h2>
        <p className="text-slate-500 text-xs mt-1.5 font-light max-w-md mx-auto">
          Lay out your choices, customize criteria weights, and let AI reveal your path forward.
        </p>
      </div>

      {/* Templates */}
      <div className="mb-8 p-4.5 bg-gradient-to-br from-indigo-50/20 via-slate-50/50 to-blue-50/10 rounded-2xl border border-indigo-50/65">
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2.5 font-mono">
          Or load a popular dilemma template:
        </span>
        <div className="flex flex-wrap gap-2">
          {TEMPLATES.map((tmpl, idx) => (
            <button
              key={idx}
              type="button"
              id={`template-btn-${idx}`}
              onClick={() => handleApplyTemplate(tmpl.question, tmpl.options)}
              className="text-xs bg-white text-slate-600 hover:text-slate-900 border border-slate-200 hover:border-indigo-300 hover:text-indigo-600 px-3.5 py-2 rounded-xl text-left transition-all duration-200 shadow-sm font-semibold cursor-pointer hover:shadow-indigo-500/5 hover:scale-[1.01]"
            >
              <span className="text-indigo-600 text-[10px] font-bold uppercase tracking-wider mr-1.5 font-mono bg-indigo-50/80 px-1.5 py-0.5 rounded border border-indigo-100">
                {tmpl.category}
              </span>
              {tmpl.options.slice(0, 2).join(" vs ")}
            </button>
          ))}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Core Question */}
        <div>
          <label className="block text-slate-750 text-xs font-bold mb-2.5 flex items-center justify-between uppercase tracking-wider font-mono">
            <span className="text-slate-700">What decision are you trying to make? *</span>
            <span className="text-[10px] font-bold text-indigo-600 font-mono capitalize">Required</span>
          </label>
          <textarea
            id="decision-question-input"
            required
            rows={3}
            placeholder="e.g. Should I commit to learning React & Frontend Web Development or focus on Full-stack Python?"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            className="w-full bg-[#F8FAFC] border border-slate-200 text-slate-800 p-4 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 focus:bg-white transition-all text-sm resize-none placeholder:text-slate-400 font-light shadow-inner"
          />
        </div>

        {/* Options */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="block text-slate-750 text-xs font-bold flex items-center gap-1.5 uppercase tracking-wide font-mono">
              <span className="text-slate-700">Specify paths to compare</span>
              <div className="group relative">
                <HelpCircle className="h-4 w-4 text-indigo-500 cursor-pointer" />
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block bg-slate-900 text-white text-[11px] p-2.5 rounded-xl w-52 shadow-lg z-10 font-normal leading-relaxed">
                  If left blank, our AI assistant will automatically formulate the two most sensible paths from your question!
                </div>
              </div>
            </label>
            <span className="text-[10px] text-slate-400 tracking-tight font-mono uppercase font-bold">Optional</span>
          </div>

          <div className="space-y-2.5">
            {options.map((opt, index) => (
              <div key={index} className="flex items-center gap-2">
                <div className="flex-1 relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-mono text-[9px] font-bold text-indigo-600 bg-indigo-50/80 px-1.5 py-0.5 rounded border border-indigo-100">
                    PATH {index + 1}
                  </span>
                  <input
                    type="text"
                    id={`option-input-${index}`}
                    placeholder={index === 0 ? "e.g. Frontend Web Dev" : index === 1 ? "e.g. Full-stack Python" : "Optional third choice"}
                    value={opt}
                    onChange={(e) => handleOptionChange(index, e.target.value)}
                    className="w-full bg-[#F8FAFC] border border-slate-200 text-slate-800 pl-20 pr-3.5 py-2.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 focus:bg-white transition-all text-sm font-light shadow-inner"
                  />
                </div>
                {options.length > 2 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveOption(index)}
                    className="p-3 text-slate-450 hover:text-red-500 hover:bg-red-50 border border-transparent hover:border-red-100 rounded-xl transition-all"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            ))}
          </div>

          {options.length < 5 && (
            <button
              type="button"
              onClick={handleAddOption}
              className="mt-1 inline-flex items-center gap-1.5 text-xs font-bold text-indigo-700 hover:text-indigo-800 bg-indigo-50/50 hover:bg-indigo-50 border border-indigo-100/80 px-3.5 py-2 rounded-xl transition-colors cursor-pointer shadow-sm"
            >
              <Plus className="h-3.5 w-3.5" /> Add alternative path
            </button>
          )}
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={isLoading || !question.trim()}
          className="w-full font-bold text-white bg-gradient-to-r from-indigo-600 via-indigo-500 to-blue-600 hover:from-indigo-500 hover:to-blue-500 disabled:from-slate-100 disabled:to-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed py-3.5 px-6 rounded-xl shadow-md shadow-indigo-500/10 hover:shadow-indigo-500/25 transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer mt-8 hover:scale-[1.01]"
        >
          {isLoading ? (
            <>Processing dilemma with Gemini AI...</>
          ) : (
            <>
              Explore Outcomes <ArrowRight className="h-4 w-4" />
            </>
          )}
        </button>
      </form>
    </div>
  );
}
