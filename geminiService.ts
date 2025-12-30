
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
    - MONTHLY EARNINGS: ₦${stats.salary.toLocaleString()}
    - CURRENT TIMELINE: Week ${stats.currentWeek} (${phase})
    - ACTIVE CHALLENGE: ${stats.challenge}

    STRICT GUIDELINES:
    1. PROVIDE EXACTLY 4 CHOICES (Each representing a different path).
    2. THE SCENARIO MUST BE PERSONALIZED:
       - If ${stats.maritalStatus === 'married' ? 'married' : 'single'}, the scenario should involve ${stats.maritalStatus === 'married' ? `their spouse or ${stats.numberOfKids} children` : 'their personal life or extended family'}.
       - If ${stats.gender === 'male' ? 'a man' : 'a woman'}, use appropriate cultural references (e.g., 'Oga', 'Madam', 'Chairman').
       - Mention their job (${stats.job}) context.
    3. Choice 1: Survival/Prudent - A localized Nigerian way to save or earn extra.
    4. Choice 2: Social/Responsibility - High personalization: Black tax, family emergency, or social pressure (Owambe/Clubbing).
    5. Choice 3: Individual Stock - Use one of these IDs: "lagos-gas", "nairatech", "obudu-agri".
    6. Choice 4: Mutual Fund - Use one of these IDs: "naija-balanced", "arm-growth", "fgn-bond-fund".
    7. Use authentic Nigerian Pidgin and cultural slang naturally.
    8. Financial impacts must be relative to their ₦${stats.salary.toLocaleString()} income.

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
          imageTheme: { type: Type.STRING, description: "Theme for a cover image, e.g. 'nigerian market', 'office', 'wedding'" },
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
      systemInstruction: "You are NairaWise, a financial role-play engine for Nigerians. You provide exactly 4 choices. Your tone is witty, culturally grounded, and wise."
    }
  });

  return JSON.parse(response.text || "{}");
};

export const getEndGameAnalysis = async (stats: PlayerStats, history: GameLog[]) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const prompt = `Analyze how ${stats.name} (a ${stats.job}) went broke after ${stats.currentWeek} weeks. Final Balance: ₦${stats.balance}. Debt: ₦${stats.debt}. Family size: ${stats.numberOfKids}. Give a funny, biting, but educational lecture in Pidgin about what went wrong.`;
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: prompt,
    config: { systemInstruction: "You are a wise but slightly mean Nigerian financial mentor." }
  });
  return response.text || "Sapa catch you, my pikin! Your village people don win.";
};
