
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
    Create a financial scenario for a Nigerian citizen.
    
    PLAYER PERSONALIZATION:
    - NAME: ${stats.name}
    - JOB: ${stats.job}
    - MARITAL STATUS: ${stats.maritalStatus}
    - NUMBER OF KIDS: ${stats.numberOfKids}
    - MONTHLY INCOME: ₦${stats.salary.toLocaleString()}
    - CURRENT BALANCE: ₦${stats.balance.toLocaleString()}
    - SAVINGS/INVESTMENTS: ₦${stats.savings.toLocaleString()}
    - LOCATION: ${stats.city}
    - GAME PROGRESS: Week ${stats.currentWeek} (${phase})
    - CHALLENGE: ${stats.challenge}

    AVAILABLE ASSETS (IDs):
    - STOCKS: "lagos-gas", "nairatech", "obudu-agri"
    - MUTUAL FUNDS: "naija-balanced", "arm-growth", "fgn-bond-fund"

    SCENARIO GUIDELINES:
    1. Financial Scaling: THE FINANCIAL IMPACTS MUST BE REALISTIC TO THE PLAYER'S INCOME.
    2. Investment Logic: Treat individual STOCKS and MUTUAL FUNDS as the primary wealth-building tools. 
    3. Family Dynamics: If married or has kids, incorporate scenarios about school fees, family events, or spouse's financial needs.
    4. Cultural Context: Use specific economic conditions of Nigeria.
    5. Slang: Use localized Nigerian Pidgin naturally.
    6. Choices: PROVIDE EXACTLY 5 DISTINCT CHOICES:
       - Choice 1: Survival/Prudent (Cost-cutting)
       - Choice 2: Social/Family (Family/Black Tax/Status/School Fees)
       - Choice 3: Equity Investment (Must include "investmentId" from STOCKS list)
       - Choice 4: Mutual Fund Investment (Must include "investmentId" from MUTUAL FUNDS list)
       - Choice 5: High Risk/Opportunistic (e.g., Betting, Side Hustle, or Crypto-scam)

    RECENT ACTIONS:
    ${historyContext}

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
            minItems: 5,
            maxItems: 5,
            items: {
              type: Type.OBJECT,
              properties: {
                text: { type: Type.STRING },
                consequence: { type: Type.STRING },
                investmentId: { type: Type.STRING, description: "Optional asset ID from the list if this is an investment choice." },
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
      systemInstruction: "You are NairaWise, a financial roleplay engine. Output exactly 5 choices. Reflect investment costs in impact.balance. Ensure family size impacts costs if married or with kids."
    }
  });

  return JSON.parse(response.text || "{}");
};

export const getEndGameAnalysis = async (stats: PlayerStats, history: GameLog[]) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const prompt = `
    The player has gone bankrupt (Sapa has won). 
    FINAL STATS:
    - Name: ${stats.name}
    - Family: ${stats.maritalStatus === 'married' ? `Married with ${stats.numberOfKids} kids` : 'Single'}
    - Job: ${stats.job}
    - Week reached: ${stats.currentWeek}
    - Total Wealth (Peak): ₦${(stats.balance + stats.savings).toLocaleString()}
    - Debt: ₦${stats.debt.toLocaleString()}
    
    Review their journey. Evaluate their use of Stocks vs Mutual Funds and how their family life impacted their finances. Be witty and wise. Use Nigerian slang.
  `;
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: prompt,
    config: { systemInstruction: "You are a wise Nigerian financial mentor." }
  });
  return response.text || "Oga, Sapa finally catch you! Your money don finish.";
};
