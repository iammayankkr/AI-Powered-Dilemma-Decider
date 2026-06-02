import { useEffect, useState } from "react";
import { Scale, BrainCircuit, Sparkles } from "lucide-react";

const LOADING_STEPS = [
  "Evaluating your core dilemma...",
  "Weighing short-term costs against long-term benefits...",
  "Generating multi-dimensional SWOT matrices...",
  "Extracting comparison points for clear perspective...",
  "Calculating priority weights and logical paths...",
  "Consulting the tiebreaker core for your final verdict...",
];

export function Loader() {
  const [stepIndex, setStepIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setStepIndex((prev) => (prev + 1) % LOADING_STEPS.length);
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center py-20 px-4 text-center max-w-xl mx-auto">
      <div className="relative mb-8">
        {/* Pulsing glow background */}
        <div className="absolute inset-0 bg-blue-500/20 blur-2xl rounded-full scale-150 animate-pulse duration-2000" />
        
        {/* Scale SVG Container */}
        <div className="relative bg-white p-6 rounded-2xl shadow-xl border border-slate-100/80 flex items-center justify-center">
          <Scale className="h-16 w-16 text-blue-600 animate-bounce duration-1000" />
          <div className="absolute -top-1 -right-1 bg-amber-500 text-white p-1.5 rounded-full shadow-md animate-pulse">
            <Sparkles className="h-4 w-4" />
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <h3 className="text-xl font-semibold font-display text-slate-800">
          The Tiebreaker is thinking...
        </h3>
        <p className="text-slate-500 text-sm font-mono tracking-tight h-10 animate-fade-in">
          {LOADING_STEPS[stepIndex]}
        </p>
      </div>

      <div className="mt-8 w-24 bg-slate-200 h-1 rounded-full overflow-hidden">
        <div className="bg-blue-600 h-1 rounded-full animate-progress-bar w-1/2" />
      </div>
    </div>
  );
}
