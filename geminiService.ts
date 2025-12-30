
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
    Create a personalized financial scenario for a Nigerian named ${stats.name} living in ${stats.city} State.
    
    PLAYER PROFILE:
    - GENDER: ${stats.gender}
    - JOB: ${stats.job}
    - LOCATION: ${stats.city}
    - MARITAL STATUS: ${stats.maritalStatus}
    - CHILDREN: ${stats.numberOfKids}
    - LIQUID BALANCE: ₦${stats.balance.toLocaleString()}
    - MONTHLY SALARY: ₦${stats.salary.toLocaleString()}
    - WEEK: ${stats.currentWeek} (${phase})

    GAME MECHANICS:
    1. ZERO BALANCE = INSTANT GAME OVER (SAPA WINS).
    2. SALARY: Paid every 4 weeks (Weeks 5, 9, 13...). 
    3. MULTI-CHOICE: Player picks 1 or 2 choices from 5 provided.
    4. NO RELIGION: Strictly secular. No tithes, offerings, or religious events.

    STRICT GUIDELINES:
    1. PROVIDE EXACTLY 5 CHOICES.
    2. CHOICE CONTENT:
       - Choice 1: Basic Necessity relevant to ${stats.city} (e.g., BRT/Danfo if Lagos, Keke if Kano, etc.).
       - Choice 2: Family/Social (Marital issues if married, children needs, black tax).
       - Choice 3: Side Hustle or Emergency.
       - Choice 4: Stock Investment (Use id: "lagos-gas", "nairatech", or "obudu-agri").
       - Choice 5: Mutual Fund Investment (Use id: "naija-balanced", "arm-growth", or "fgn-bond-fund").
    3. LANGUAGE: Use authentic Nigerian Pidgin mixed with savvy financial terms.
    4. DIFFICULTY: Scale impacts based on their ₦${stats.salary.toLocaleString()} income.

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
          imageTheme: { type: Type.STRING, description: "Theme for image, e.g. 'lagos bus', 'family lunch'" },
          choices: {
            type: Type.ARRAY,
            minItems: 5,
            maxItems: 5,
            items: {
              type: Type.OBJECT,
              properties: {
                text: { type: Type.STRING },
                consequence: { type: Type.STRING },
                investmentId: { type: Type.STRING, description: "Only if choice is an investment" },
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
      systemInstruction: "You are NairaWise, a witty Nigerian financial sim engine. You provide exactly 5 options. No religion. Be culturally grounded and savvy."
    }
  });

  return JSON.parse(response.text || "{}");
};

export const getEndGameAnalysis = async (stats: PlayerStats, h: GameLog[]) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const prompt = `Explain why ${stats.name} (a ${stats.job} in ${stats.city}) is now broke (₦0 balance) at Week ${stats.currentWeek}. Analyze their path (Married: ${stats.maritalStatus === 'married'}, Kids: ${stats.numberOfKids}) and give a funny lecture in Pidgin. Secular only.`;
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: prompt,
    config: { systemInstruction: "Wise Nigerian financial mentor. No religion." }
  });
  return response.text || "Sapa catch you my pikin! Your balance is zero. Nigerian economy don win.";
};
