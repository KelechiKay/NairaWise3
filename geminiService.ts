
import { GoogleGenAI, Type } from "@google/genai";
import { PlayerStats, Scenario, GameLog } from "./types";

export const getNextScenario = async (
  stats: PlayerStats,
  history: GameLog[]
): Promise<Scenario> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  let phase = "SURVIVAL (Sapa Era)";
  if (stats.currentWeek > 50) phase = "GROWTH (Hustle Era)";
  if (stats.currentWeek > 150) phase = "EXPANSION (Oga Era)";
  if (stats.currentWeek > 300) phase = "LEGACY (Billionaire Era)";

  const prompt = `
    Create a highly personalized financial scenario for a Nigerian named ${stats.name}.
    
    PLAYER PROFILE:
    - GENDER: ${stats.gender}
    - JOB: ${stats.job}
    - RESIDENCE: ${stats.city} State
    - MARITAL STATUS: ${stats.maritalStatus}
    - CHILDREN: ${stats.numberOfKids}
    - LIQUID BALANCE: ₦${stats.balance.toLocaleString()}
    - MONTHLY SALARY: ₦${stats.salary.toLocaleString()}
    - TIMELINE: Week ${stats.currentWeek} (Phase: ${phase})
    - CHALLENGE: ${stats.challenge}

    CRITICAL GAME MECHANICS:
    1. SALARY CYCLE: The player gets their ₦${stats.salary.toLocaleString()} salary every 4 weeks with a 1-week delay (Weeks 5, 9, 13...). 
       Current week is ${stats.currentWeek}.
    2. THE ZERO RULE: If the player's balance hits ₦0, they lose instantly. Scenarios should tempt them to spend or force them to choose between essentials and survival.
    3. GIVING: Every time money comes in (including this scenario's inflow or salary), they are asked to Tithe or Give.

    STRICT GUIDELINES:
    1. PROVIDE EXACTLY 4 CHOICES.
    2. Choice 1: Survival/Prudent - A localized Nigerian way to save or earn extra.
    3. Choice 2: Personal/Social - A high-pressure Nigerian situation (Black Tax, wedding, car trouble, medical, etc).
    4. Choice 3: Individual Stock - Use one: "lagos-gas", "nairatech", "obudu-agri".
    5. Choice 4: Mutual Fund - Use one: "naija-balanced", "arm-growth", "fgn-bond-fund".
    6. Use authentic Nigerian Pidgin and cultural context naturally.
    7. Impacts must be proportional to their income.

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
          imageTheme: { type: Type.STRING, description: "Theme for image generation" },
          choices: {
            type: Type.ARRAY,
            minItems: 4,
            maxItems: 4,
            items: {
              type: Type.OBJECT,
              properties: {
                text: { type: Type.STRING },
                consequence: { type: Type.STRING },
                investmentId: { type: Type.STRING, description: "Only for stocks/funds" },
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
      systemInstruction: "You are NairaWise, the ultimate Nigerian financial coach. You speak in Pidgin mixed with English. You are witty, slightly sarcastic but deeply helpful."
    }
  });

  return JSON.parse(response.text || "{}");
};

export const getEndGameAnalysis = async (stats: PlayerStats, history: GameLog[]) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const prompt = `Explain why ${stats.name} (a ${stats.job}) is now broke (₦0 balance) at Week ${stats.currentWeek}. Use history if provided. Mention the debt of ₦${stats.debt}. Give a final humorous lecture in Pidgin.`;
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: prompt,
    config: { systemInstruction: "You are a wise but biting Nigerian financial mentor." }
  });
  return response.text || "Sapa catch you, my pikin! Your balance is zero. Your village people don win finally.";
};
