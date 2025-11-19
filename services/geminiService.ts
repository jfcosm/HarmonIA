import { GoogleGenAI } from "@google/genai";
import { Language } from "../types";

let genAI: GoogleGenAI | null = null;

const getGenAI = () => {
  if (!genAI && process.env.API_KEY) {
    genAI = new GoogleGenAI({ apiKey: process.env.API_KEY });
  }
  return genAI;
};

export const fetchChordInsight = async (chordName: string, lang: Language): Promise<string> => {
  const ai = getGenAI();
  if (!ai) return lang === 'es' ? "Llave API no configurada." : "API Key not configured.";

  try {
    const model = 'gemini-2.5-flash';
    
    const langInstruction = lang === 'es' 
      ? "Responde en Español." 
      : "Respond in English.";
      
    const prompt = `Provide a very brief (max 2 sentences) and interesting fact, usage context, or emotion associated with the chord: ${chordName}. Use plain text. ${langInstruction}`;

    const response = await ai.models.generateContent({
      model: model,
      contents: prompt,
    });

    return response.text || (lang === 'es' ? "Sin información." : "No insight available.");
  } catch (error) {
    console.error("Error fetching chord insight:", error);
    return lang === 'es' ? "No se pudo cargar la información." : "Could not load insight.";
  }
};