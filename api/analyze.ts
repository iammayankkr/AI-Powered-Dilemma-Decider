import { GoogleGenAI, Type } from "@google/genai";
import type { VercelRequest, VercelResponse } from "@vercel/node";

// Lazy-initialized Gemini client
let aiClient: GoogleGenAI | null = null;
function getAiClient(): GoogleGenAI {
  if (!aiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      throw new Error("GEMINI_API_KEY environment variable is required.");
    }
    aiClient = new GoogleGenAI({
      apiKey: key,
    });
  }
  return aiClient;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed. Use POST." });
  }

  try {
    const { question, options } = req.body || {};
    if (!question || typeof question !== "string") {
      return res.status(400).json({ error: "A valid decision question is required." });
    }

    const ai = getAiClient();

    let prompt = `Analyze this decision question: "${question}".`;
    if (options && Array.isArray(options) && options.filter(Boolean).length > 0) {
      prompt += ` The options to compare are: ${options.filter(Boolean).map(o => `"${o}"`).join(", ")}.`;
    } else {
      prompt += ` Please automatically extract or propose 2 or 3 logical, distinct, actionable options of what the choices are for this decision.`;
    }

    prompt += ` Please generate a complete, high-fidelity decision breakdown, containing:
1. Concise title and supportive, empathetic overview of the choices.
2. For each option/path, compile a balanced list of:
   - Pros (meaningful benefits, with category and default impact rating 1 to 5)
   - Cons (potential drawbacks, costs, or risks with default impact rating 1 to 5)
   - A complete SWOT analysis (Strengths, Weaknesses, Opportunities, Threats) for each option.
3. A detailed side-by-side comparison table showing major evaluation criteria (at least 4 criteria like cost, lifestyle impact, risk, etc.) and parallel values for each option.
4. An objective, final, AI-powered Tiebreaker verdict with recommendation, a confidence percentage core, clear explanation, value-unpacking self-reflection questions, and clean next steps.

Please ensure the items have unique IDs, and that all descriptions are objective, detailed, and clear.`;

    const responseSchema = {
      type: Type.OBJECT,
      properties: {
        title: { type: Type.STRING },
        overview: { type: Type.STRING },
        options: { type: Type.ARRAY, items: { type: Type.STRING } },
        optionsAnalysis: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              optionName: { type: Type.STRING },
              pros: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    id: { type: Type.STRING },
                    text: { type: Type.STRING },
                    impact: { type: Type.INTEGER },
                    category: { type: Type.STRING }
                  },
                  required: ["id", "text", "impact", "category"]
                }
              },
              cons: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    id: { type: Type.STRING },
                    text: { type: Type.STRING },
                    impact: { type: Type.INTEGER },
                    category: { type: Type.STRING }
                  },
                  required: ["id", "text", "impact", "category"]
                }
              },
              swot: {
                type: Type.OBJECT,
                properties: {
                  strengths: { type: Type.ARRAY, items: { type: Type.STRING } },
                  weaknesses: { type: Type.ARRAY, items: { type: Type.STRING } },
                  opportunities: { type: Type.ARRAY, items: { type: Type.STRING } },
                  threats: { type: Type.ARRAY, items: { type: Type.STRING } }
                },
                required: ["strengths", "weaknesses", "opportunities", "threats"]
              }
            },
            required: ["optionName", "pros", "cons", "swot"]
          }
        },
        comparisonTable: {
          type: Type.OBJECT,
          properties: {
            criteria: { type: Type.ARRAY, items: { type: Type.STRING } },
            rows: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  criterion: { type: Type.STRING },
                  values: { type: Type.ARRAY, items: { type: Type.STRING } }
                },
                required: ["criterion", "values"]
              }
            }
          },
          required: ["criteria", "rows"]
        },
        verdict: {
          type: Type.OBJECT,
          properties: {
            recommendedOption: { type: Type.STRING },
            confidenceScore: { type: Type.INTEGER },
            reasoning: { type: Type.STRING },
            pivotQuestions: { type: Type.ARRAY, items: { type: Type.STRING } },
            nextSteps: { type: Type.ARRAY, items: { type: Type.STRING } }
          },
          required: ["recommendedOption", "confidenceScore", "reasoning", "pivotQuestions", "nextSteps"]
        }
      },
      required: ["title", "overview", "options", "optionsAnalysis", "comparisonTable", "verdict"]
    };

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: responseSchema,
        temperature: 0.2, 
      }
    });

    try {
      const parsedData = JSON.parse(response.text || "{}");
      return res.status(200).json(parsedData);
    } catch (parseError) {
      console.error("Gemini returned invalid JSON:", response.text);
      return res.status(500).json({ error: "Received invalid format from AI model.", details: "JSON Parse failed" });
    }
  } catch (error: any) {
    console.error("Analysis failed:", error);
    return res.status(500).json({
      error: "Failed to analyze decision. Please check your Gemini API key in Settings or try again later.",
      details: error.message
    });
  }
}
