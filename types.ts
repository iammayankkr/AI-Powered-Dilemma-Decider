export interface DecisionItem {
  id: string;
  text: string;
  impact: number; // 1-5
  category: string;
}

export interface SwotAnalysis {
  strengths: string[];
  weaknesses: string[];
  opportunities: string[];
  threats: string[];
}

export interface OptionAnalysis {
  optionName: string;
  pros: DecisionItem[];
  cons: DecisionItem[];
  swot: SwotAnalysis;
}

export interface ComparisonRow {
  criterion: string;
  values: string[]; // parallel to options list
}

export interface ComparisonTable {
  criteria: string[];
  rows: ComparisonRow[];
}

export interface Verdict {
  recommendedOption: string;
  confidenceScore: number; // 0-100
  reasoning: string;
  pivotQuestions: string[];
  nextSteps: string[];
}

export interface DecisionAnalysisResponse {
  title: string;
  overview: string;
  options: string[];
  optionsAnalysis: OptionAnalysis[];
  comparisonTable: ComparisonTable;
  verdict: Verdict;
}

export interface SavedDecision {
  id: string;
  createdAt: string;
  question: string;
  rawOptions: string[];
  analysis: DecisionAnalysisResponse;
  // User customized weights override
  customProWeights: Record<string, number>; // id -> weight (1-5)
  customConWeights: Record<string, number>; // id -> weight (1-5)
  customPros: Record<string, DecisionItem[]>; // optionName -> custom user pros
  customCons: Record<string, DecisionItem[]>; // optionName -> custom user cons
}
