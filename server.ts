import express from "express";
import path from "path";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Lazy-initialized Gemini client
let aiClient: GoogleGenAI | null = null;

function getAiClient(): GoogleGenAI {
  if (!aiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      throw new Error("GEMINI_API_KEY environment variable is required");
    }
    aiClient = new GoogleGenAI({
      apiKey: key,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

// Decision analysis API route
app.post("/api/analyze", async (req, res) => {
  try {
    const { question, options } = req.body;

    if (!question || typeof question !== "string") {
      return res.status(400).json({ error: "A valid decision question is required." });
    }

    const ai = getAiClient();

    // Prepare prompt
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
        title: {
          type: Type.STRING,
          description: "A refined, concise, yet catchy title of the decision being made."
        },
        overview: {
          type: Type.STRING,
          description: "An empathetic, detailed overview of the dilemma and why it's a difficult or interesting choice."
        },
        options: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description: "List of options, e.g., ['Buy Electric Car', 'Buy Hybrid Car']"
        },
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
                    id: { type: Type.STRING, description: "A unique short alphanumeric string, e.g., 'pro-elec-cost'" },
                    text: { type: Type.STRING },
                    impact: { type: Type.INTEGER, description: "Impact rating from 1 (low) to 5 (high)" },
                    category: { type: Type.STRING, description: "E.g., Financial, Practical, Career, Personal Growth, etc." }
                  },
                  required: ["id", "text", "impact", "category"]
                }
              },
              cons: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    id: { type: Type.STRING, description: "A unique short alphanumeric string, e.g., 'con-elec-range'" },
                    text: { type: Type.STRING },
                    impact: { type: Type.INTEGER, description: "Impact rating from 1 (low) to 5 (high)" },
                    category: { type: Type.STRING, description: "E.g., Financial, Practical, Career, Personal Growth, etc." }
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
            criteria: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "List of criteria, e.g., ['Initial Cost', 'Maintenance', 'Environment', 'Convenience']"
            },
            rows: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  criterion: { type: Type.STRING },
                  values: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                    description: "Short descriptive values for each option, index-matched to the options list"
                  }
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
            recommendedOption: { type: Type.STRING, description: "The exact name of the recommended option, matching one of the options list" },
            confidenceScore: { type: Type.INTEGER, description: "Confidence score out of 100" },
            reasoning: { type: Type.STRING, description: "In-depth balanced rationale for the recommendation" },
            pivotQuestions: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "3 deep self-reflection questions for the user to unlock their decision"
            },
            nextSteps: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "Actionable concrete checklist steps to execute the recommended option"
            }
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
        temperature: 0.2, // Slightly deterministic for analytical quality
      }
    });

    try {
      const parsedData = JSON.parse(response.text || "{}");
      return res.json(parsedData);
    } catch (parseError) {
      console.error("Gemini returned invalid JSON:", response.text);
      return res.status(500).json({ error: "Received invalid format from AI model.", details: "JSON Parse failed" });
    }
  } catch (error: any) {
    console.error("Analysis failed:", error);
    return res.status(500).json({
      error: "Failed to analyze decision. Please check your Gemini API key in Settings > Secrets or try again later.",
      details: error.message
    });
  }
});

// Explicitly handle all unmatched /api/ routes to prevent SPA fallback (which returns HTML)
app.all("/api/*", (req, res) => {
  res.status(404).json({ error: "API route not found" });
});

async function start() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

start();
