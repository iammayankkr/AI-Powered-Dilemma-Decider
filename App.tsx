import React, { useState, useEffect } from "react";
import {
  Scale,
  BrainCircuit,
  FileDown,
  Printer,
  History,
  Sparkles,
  ArrowLeft,
  X,
  Check,
  TrendingUp,
  Sliders,
  Grid,
  FileText,
  Compass,
  AlertCircle
} from "lucide-react";

import { SavedDecision, DecisionAnalysisResponse } from "./types";
import { DecisionForm } from "./components/DecisionForm";
import { Loader } from "./components/Loader";
import { BalanceView } from "./components/BalanceView";
import { SwotView } from "./components/SwotView";
import { ComparisonView } from "./components/ComparisonView";
import { VerdictView } from "./components/VerdictView";
import { SavedList } from "./components/SavedList";
import { generateDecisionPDF } from "./utils/pdfGenerator";

export default function App() {
  const [savedDecisions, setSavedDecisions] = useState<SavedDecision[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentTab, setCurrentTab] = useState<"balance" | "comparison" | "swot" | "verdict">("balance");

  // State to show generated Markdown modal
  const [markdownExport, setMarkdownExport] = useState<string | null>(null);
  const [copiedNotification, setCopiedNotification] = useState(false);

  // Load from LocalStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem("tiebreakerDecisions");
      if (stored) {
        setSavedDecisions(JSON.parse(stored));
      }
    } catch (e) {
      console.error("Failed to load decisions from stash:", e);
    }
  }, []);

  // Save to LocalStorage whenever savedDecisions changes
  const saveToStash = (updated: SavedDecision[]) => {
    setSavedDecisions(updated);
    try {
      localStorage.setItem("tiebreakerDecisions", JSON.stringify(updated));
    } catch (e) {
      console.error("Failed to save decisions to stash:", e);
    }
  };

  // Submit new decision dilemma to full-stack Gemini endpoint
  const handleAnalyzeDecision = async (question: string, options: string[]) => {
    setIsLoading(true);
    setError(null);
    setCurrentTab("balance");

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ question, options }),
      });

      let responseData;
      const responseText = await response.text();
      try {
        responseData = JSON.parse(responseText);
      } catch (parseError) {
        console.error("Server returned non-JSON response:", responseText);
        throw new Error(`Server returned invalid response (Status ${response.status}). Expected JSON.`);
      }

      if (!response.ok) {
        throw new Error(responseData.error || responseData.details || `Server error ${response.status}`);
      }

      const rawAnalysisModel: DecisionAnalysisResponse = responseData;

      // Formulate unique SavedDecision item
      const newDecision: SavedDecision = {
        id: `dec-${Date.now()}`,
        createdAt: new Date().toISOString(),
        question,
        rawOptions: options,
        analysis: rawAnalysisModel,
        customProWeights: {},
        customConWeights: {},
        customPros: {},
        customCons: {},
      };

      const updatedHistory = [newDecision, ...savedDecisions];
      saveToStash(updatedHistory);
      setActiveId(newDecision.id);
    } catch (err: any) {
      console.error("Core engine analysis crashed:", err);
      setError(err.message || "An unexpected communication error occurred.");
    } finally {
      setIsLoading(false);
    }
  };

  // Handle active decision modifications (weights, custom factors, toggles)
  const handleUpdateActiveDecision = (updatedItem: SavedDecision) => {
    const updatedHistory = savedDecisions.map((item) =>
      item.id === updatedItem.id ? updatedItem : item
    );
    saveToStash(updatedHistory);
  };

  // Delete decision from Vault
  const handleDeleteDecision = (id: string) => {
    const updatedHistory = savedDecisions.filter((item) => item.id !== id);
    saveToStash(updatedHistory);
    if (activeId === id) {
      setActiveId(null);
    }
  };

  const activeDecision = savedDecisions.find((item) => item.id === activeId);

  // Generate markdown export document
  const triggerExportMarkdown = () => {
    if (!activeDecision) return;
    const { question, analysis, createdAt } = activeDecision;
    const formattedDate = new Date(createdAt).toLocaleDateString();

    let doc = `# The Tiebreaker Analysis: ${analysis.title}\n`;
    doc += `*Generated: ${formattedDate}*\n\n`;
    doc += `## Core Dilemma\n> ${question}\n\n`;
    doc += `## Overview\n${analysis.overview}\n\n`;

    doc += `## Compared Pathways\n`;
    analysis.options.forEach((opt, idx) => {
      doc += `${idx + 1}. **${opt}**\n`;
    });
    doc += `\n`;

    doc += `## Path-by-Path Breakdown\n`;
    analysis.optionsAnalysis.forEach((optAnal) => {
      doc += `### SWOT Analysis: ${optAnal.optionName}\n`;
      doc += `* **Strengths:** ${optAnal.swot.strengths.join(", ") || "None listed."}\n`;
      doc += `* **Weaknesses:** ${optAnal.swot.weaknesses.join(", ") || "None listed."}\n`;
      doc += `* **Opportunities:** ${optAnal.swot.opportunities.join(", ") || "None listed."}\n`;
      doc += `* **Threats:** ${optAnal.swot.threats.join(", ") || "None listed."}\n\n`;
    });

    doc += `## Side-by-Side Comparison Matrix\n`;
    doc += `| Evaluation Criteria | ${analysis.options.join(" | ")} |\n`;
    doc += `|---|${analysis.options.map(() => "---|").join("")}\n`;
    analysis.comparisonTable.rows.forEach((row) => {
      doc += `| **${row.criterion}** | ${row.values.join(" | ")} |\n`;
    });
    doc += `\n`;

    doc += `## The AI Verdict\n`;
    doc += `### Recommended Path: **${analysis.verdict.recommendedOption}** (Confidence: ${analysis.verdict.confidenceScore}%)\n\n`;
    doc += `#### Analytical Reasoning:\n${analysis.verdict.reasoning}\n\n`;

    doc += `#### Core Pivot Reflection Prompts:\n`;
    analysis.verdict.pivotQuestions.forEach((q, idx) => {
      doc += `* **0${idx + 1}:** ${q}\n`;
    });
    doc += `\n`;

    doc += `#### Execution Roadmap Items:\n`;
    analysis.verdict.nextSteps.forEach((step, idx) => {
      doc += `* [ ] ${step}\n`;
    });

    setMarkdownExport(doc);
  };

  const copyMarkdownToClipboard = () => {
    if (!markdownExport) return;
    navigator.clipboard.writeText(markdownExport);
    setCopiedNotification(true);
    setTimeout(() => setCopiedNotification(false), 2000);
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col text-slate-800">
      {/* Top Brand Banner */}
      <header className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-6 border-b border-slate-200/80 mb-2 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <div className="text-[10px] font-extrabold tracking-[0.25em] text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-indigo-500 to-blue-600 uppercase mb-1.5 font-mono">
            The Tiebreaker AI
          </div>
          <h1 className="text-3xl font-light text-slate-900 tracking-tight font-display">
            {activeDecision ? (
              <>Should I <span className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-purple-600 to-blue-600 font-display">{activeDecision.analysis.title}</span>?</>
            ) : (
              <>AI-Powered <span className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-purple-600 to-blue-600 font-display">Dilemma Decider</span></>
            )}
          </h1>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          {activeDecision && (
            <button
              onClick={() => setActiveId(null)}
              className="px-4 py-2 bg-white border border-indigo-100 text-indigo-700 hover:text-indigo-800 rounded-xl text-sm font-semibold shadow-sm hover:bg-indigo-50/50 transition cursor-pointer hover:border-indigo-300"
            >
              New Analysis
            </button>
          )}
          <div className="flex items-center gap-1.5 bg-indigo-50/55 text-indigo-700 border border-indigo-100 text-[10px] font-bold px-3 py-1.5 rounded-xl font-mono shadow-sm">
            <Sparkles className="h-3 w-3 text-indigo-500 animate-pulse" /> GEMINI 3.5 FLASH
          </div>
        </div>
      </header>

      {/* Main Content Arena */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 flex flex-col lg:flex-row gap-8">
        {/* Sidebar: Saved list */}
        <section className="w-full lg:w-72 shrink-0 h-auto lg:h-[70vh] lg:sticky lg:top-8">
          <SavedList
            savedList={savedDecisions}
            activeId={activeId}
            onSelect={(id) => {
              setActiveId(id);
              setError(null);
            }}
            onDelete={handleDeleteDecision}
            onNewDecision={() => {
              setActiveId(null);
              setError(null);
            }}
          />
        </section>

        {/* Primary Interaction Board */}
        <section className="flex-1 min-w-0">
          {error && (
            <div className="mb-6 p-4 bg-rose-50 border border-rose-100 rounded-2xl flex items-start gap-3.5 text-rose-800">
              <AlertCircle className="h-5 w-5 mt-0.5 shrink-0 text-rose-600" />
              <div className="text-sm">
                <span className="font-bold block mb-0.5">Engine Warning</span>
                {error}
              </div>
            </div>
          )}

          {isLoading ? (
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-8">
              <Loader />
            </div>
          ) : activeDecision ? (
            <div className="space-y-6">
              {/* Active Decision Top Title segment */}
              <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col md:flex-row md:items-start justify-between gap-6">
                <div className="space-y-2">
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => setActiveId(null)}
                      className="text-xs flex items-center gap-1 text-slate-500 hover:text-slate-800 mr-2 border border-slate-200 hover:border-slate-300 rounded-lg px-2.5 py-1 bg-white shadow-sm font-medium transition cursor-pointer"
                    >
                      <ArrowLeft className="h-3 w-3" /> Back
                    </button>
                    <span className="text-[10px] uppercase font-bold tracking-wider text-blue-600 font-mono">
                      Active Pathway Analysis
                    </span>
                  </div>
                  
                  <h2 className="text-xl font-medium text-slate-900 tracking-tight leading-tight">
                    {activeDecision.question}
                  </h2>
                  <p className="text-xs md:text-sm text-slate-500 leading-relaxed max-w-2xl font-light">
                    {activeDecision.analysis.overview}
                  </p>
                </div>

                {/* Export operations */}
                <div className="flex items-center gap-2 self-start md:self-auto shrink-0 flex-wrap">
                  <button
                    onClick={() => generateDecisionPDF(activeDecision)}
                    className="text-xs flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white font-medium px-3.5 py-2 rounded-lg transition cursor-pointer shadow-sm"
                    title="Export professional PDF Document"
                  >
                    <FileText className="h-3.5 w-3.5" /> Export PDF Report
                  </button>
                  <button
                    onClick={triggerExportMarkdown}
                    className="text-xs flex items-center gap-1.5 bg-white border border-slate-200 hover:bg-slate-50 font-medium px-3.5 py-2 rounded-lg transition cursor-pointer text-slate-700 shadow-sm"
                    title="Export Markdown file"
                  >
                    <FileDown className="h-3.5 w-3.5 text-slate-500" /> Export Details
                  </button>
                  <button
                    onClick={() => window.print()}
                    className="text-xs flex items-center gap-1.5 bg-white border border-slate-200 hover:bg-slate-50 font-medium px-3.5 py-2 rounded-lg transition cursor-pointer text-slate-700 shadow-sm"
                    title="Print analysis layout"
                  >
                    <Printer className="h-3.5 w-3.5 text-slate-500" /> Print
                  </button>
                </div>
              </div>

              {/* Segmented analysis navigation tabs */}
              <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200/60 max-w-lg shadow-sm">
                <button
                  onClick={() => setCurrentTab("balance")}
                  id="tab-balance"
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-bold tracking-tight transition duration-200 cursor-pointer ${
                    currentTab === "balance"
                      ? "bg-gradient-to-r from-indigo-600 to-blue-600 text-white shadow-md shadow-indigo-500/10 scale-[1.01]"
                      : "text-slate-500 hover:text-indigo-600 hover:bg-white/60"
                  }`}
                >
                  <Sliders className="h-3.5 w-3.5" /> Balance Ledger
                </button>
                <button
                  onClick={() => setCurrentTab("comparison")}
                  id="tab-comparison"
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-bold tracking-tight transition duration-200 cursor-pointer ${
                    currentTab === "comparison"
                      ? "bg-gradient-to-r from-indigo-600 to-blue-600 text-white shadow-md shadow-indigo-500/10 scale-[1.01]"
                      : "text-slate-500 hover:text-indigo-600 hover:bg-white/60"
                  }`}
                >
                  <Grid className="h-3.5 w-3.5" /> Comparative Matrix
                </button>
                <button
                  onClick={() => setCurrentTab("swot")}
                  id="tab-swot"
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-bold tracking-tight transition duration-200 cursor-pointer ${
                    currentTab === "swot"
                      ? "bg-gradient-to-r from-indigo-600 to-blue-600 text-white shadow-md shadow-indigo-500/10 scale-[1.01]"
                      : "text-slate-500 hover:text-indigo-600 hover:bg-white/60"
                  }`}
                >
                  <FileText className="h-3.5 w-3.5" /> SWOT Analysis
                </button>
                <button
                  onClick={() => setCurrentTab("verdict")}
                  id="tab-verdict"
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-bold tracking-tight transition duration-200 cursor-pointer ${
                    currentTab === "verdict"
                      ? "bg-gradient-to-r from-indigo-600 to-blue-600 text-white shadow-md shadow-indigo-500/10 scale-[1.01]"
                      : "text-slate-500 hover:text-indigo-600 hover:bg-white/60"
                  }`}
                >
                  <Compass className="h-3.5 w-3.5" /> Final Verdict
                </button>
              </div>

              {/* View components depending on active tab state */}
              <div className="bg-[#F8FAFC]">
                {currentTab === "balance" && (
                  <BalanceView
                    decision={activeDecision}
                    onUpdate={handleUpdateActiveDecision}
                    savedList={savedDecisions}
                  />
                )}
                {currentTab === "comparison" && (
                  <ComparisonView decision={activeDecision} />
                )}
                {currentTab === "swot" && (
                  <SwotView decision={activeDecision} />
                )}
                {currentTab === "verdict" && (
                  <VerdictView decision={activeDecision} />
                )}
              </div>
            </div>
          ) : (
            <DecisionForm onSubmit={handleAnalyzeDecision} isLoading={isLoading} />
          )}
        </section>
      </main>

      {/* Export Markdown Overlay Modal */}
      {markdownExport && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl max-w-2xl w-full flex flex-col max-h-[85vh] shadow-2xl border border-slate-100 overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-blue-600" />
                <h3 className="font-display font-bold text-slate-800 text-base">Export markdown analysis</h3>
              </div>
              <button
                onClick={() => setMarkdownExport(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1 font-mono text-xs text-slate-705 leading-relaxed bg-slate-50/50">
              <pre className="whitespace-pre-wrap select-all">{markdownExport}</pre>
            </div>

            <div className="p-4 border-t border-slate-100 flex items-center justify-end gap-2 bg-slate-50">
              {copiedNotification && (
                <div className="text-xs text-emerald-600 font-semibold bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-100 animate-slide-up flex items-center gap-1 mr-auto">
                  <Check className="h-3.5 w-3.5" /> Copied markdown successfully!
                </div>
              )}
              <button
                type="button"
                onClick={copyMarkdownToClipboard}
                className="text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-xl py-2 px-4 shadow transition flex items-center gap-1 cursor-pointer"
              >
                Copy to Clipboard
              </button>
              <button
                type="button"
                onClick={() => setMarkdownExport(null)}
                className="text-xs font-semibold bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl py-2 px-4 transition cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Humble Humanized Footer */}
      <footer className="bg-white border-t border-slate-100 py-6 mt-12 text-center text-xs text-slate-400 font-mono tracking-tight">
        The Tiebreaker &bull; Fully loaded local sandbox persistence &bull; Powered by Google Gemini
      </footer>
    </div>
  );
}
