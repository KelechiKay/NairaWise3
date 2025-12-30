
import { GoogleGenAI, Type } from "@google/genai";
import { PlayerStats, Scenario, GameLog } from "./types";

export const getNextScenario = async (
  stats: PlayerStats,
  history: GameLog[]
): Promise<Scenario> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const historyContext = history.slice(-3).map(h => `Week ${h.week}: ${h.decision}`).join('\n');

  let phase = "SURVIVAL (Sapa Era)";
  if (stats.currentWeek > 50) phase = "GROWTH (Hustle Era)";
  if (stats.currentWeek > 150) phase = "EXPANSION (Oga Era)";
  if (stats.currentWeek > 300) phase = "LEGACY (Billionaire Era)";

  const prompt = `
    Create a financial scenario for a Nigerian named ${stats.name}.
    The user must pick ONLY ONE of the 4 paths you provide.
    
    PLAYER INFO:
    - JOB: ${stats.job}
    - LOCATION: ${stats.city}
    - FAMILY: ${stats.maritalStatus === 'married' ? `Married with ${stats.numberOfKids} kids` : 'Single'}
    - BALANCE: ₦${stats.balance.toLocaleString()}
    - WEEK: ${stats.currentWeek} (${phase})

    ASSET IDs:
    - STOCKS: "lagos-gas", "nairatech", "obudu-agri"
    - MUTUAL FUNDS: "naija-balanced", "arm-growth", "fgn-bond-fund"

    STRICT GUIDELINES:
    1. PROVIDE EXACTLY 4 CHOICES (Each a different path).
    2. Choice 1: Survival/Hustle - A way to make extra cash or save costs.
    3. Choice 2: Family/Social - A demand from home (Black Tax) or social event.
    4. Choice 3: Stock - Must use a "STOCKS" ID.
    5. Choice 4: Mutual Fund - Must use a "MUTUAL FUNDS" ID.
    6. Use Nigerian Pidgin naturally. 
    7. Impacts must be proportional to their monthly income of ₦${stats.salary.toLocaleString()}.

    RESPONSE FORMAT: JSON only.
  `;

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          description: { type: Type.STRING },
          imageTheme: { type: Type.STRING },
          choices: {
            type: Type.ARRAY,
            minItems: 4,
            maxItems: 4,
            items: {
              type: Type.OBJECT,
              properties: {
                text: { type: Type.STRING },
                consequence: { type: Type.STRING },
                investmentId: { type: Type.STRING },
                impact: {
                  type: Type.OBJECT,
                  properties: {
                    balance: { type: Type.NUMBER },
                    savings: { type: Type.NUMBER },
                    debt: { type: Type.NUMBER },
                    happiness: { type: Type.NUMBER },
                  },
                  required: ["balance", "savings", "debt", "happiness"]
                }
              },
              required: ["text", "consequence", "impact"]
            }
          }
        },
        required: ["title", "description", "choices", "imageTheme"]
      },
      systemInstruction: "You are NairaWise. Provide exactly 4 distinct paths every time. Path 3 and 4 MUST be investments with valid IDs. The player will select only one."
    }
  });

  return JSON.parse(response.text || "{}");
};

export const getEndGameAnalysis = async (stats: PlayerStats, history: GameLog[]) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const prompt = `Explain why ${stats.name} went broke at Week ${stats.currentWeek}. Use specific events from history if possible. Final Balance: ₦${stats.balance}. Debt: ₦${stats.debt}. Be a wise Nigerian uncle giving financial advice with humor.`;
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: prompt,
    config: { systemInstruction: "You are a wise Nigerian financial mentor." }
  });
  return response.text || "Sapa catch you, my pikin!";
};
