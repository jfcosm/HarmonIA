import { GoogleGenAI, HarmCategory, HarmBlockThreshold } from "@google/genai";
import { Language, SongStyle, SongMood, SongTempo, SongComplexity } from "../types";

let genAI: GoogleGenAI | null = null;

const getGenAI = () => {
  if (genAI) return genAI;

  try {
    let apiKey: string | undefined;

    // VITE PRODUCTION FIX:
    // We must safely check if import.meta.env exists to avoid runtime crashes.
    // In some environments, accessing properties of undefined throws an error.
    try {
      // @ts-ignore - import.meta checks needed for mixed environments
      if (typeof import.meta !== 'undefined' && import.meta.env) {
        // @ts-ignore
        apiKey = import.meta.env.VITE_API_KEY;
      }
    } catch (err) {
      // Fallback silently if import.meta fails
    }

    // Fallback to process.env for non-Vite environments
    if (!apiKey && typeof process !== 'undefined' && process.env) {
      apiKey = process.env.API_KEY;
    }

    if (apiKey) {
      genAI = new GoogleGenAI({ apiKey: apiKey });
    } else {
      console.warn("Armonix: No API Key found in VITE_API_KEY or process.env.");
    }
  } catch (e) {
    console.error("Armonix: Environment variable initialization error", e);
  }
  
  return genAI;
};

export const fetchChordInsight = async (chordName: string, lang: Language): Promise<string> => {
  const ai = getGenAI();
  if (!ai) return lang === 'es' ? "Llave API no configurada." : "API Key not configured.";

  try {
    const model = 'gemini-2.5-flash';
    
    const langMap: Record<string, string> = {
      es: "Responde en Español.",
      en: "Respond in English.",
      it: "Rispondi in Italiano.",
      fr: "Répondez en Français.",
      de: "Antworte auf Deutsch.",
      zh: "请用中文回答。",
      ja: "日本語で答えてください。",
      ko: "한국어로 답변해 주세요."
    };
    
    const langInstruction = langMap[lang] || "Respond in English.";
      
    const prompt = `Provide a very brief (max 2 sentences) and interesting fact, usage context, or emotion associated with the chord: ${chordName}. Use plain text. Do not use conversational fillers like "Sure" or "Absolutely". Start directly with the fact. ${langInstruction}`;

    const response = await ai.models.generateContent({
      model: model,
      contents: prompt,
      config: {
        safetySettings: [
          { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
          { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
          { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
          { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
        ],
      }
    });

    return response.text || (lang === 'es' ? "Sin información." : "No insight available.");
  } catch (error) {
    console.error("Error fetching chord insight:", error);
    return lang === 'es' ? "No se pudo cargar la información." : "Could not load insight.";
  }
};

export const generateSongProgression = async (
  keyRoot: string,
  keyQuality: string,
  style: SongStyle,
  mood: SongMood,
  tempo: SongTempo,
  complexity: SongComplexity,
  lang: Language
): Promise<string> => {
  const ai = getGenAI();
  if (!ai) return lang === 'es' ? "Llave API no configurada." : "API Key not configured.";

  try {
    const model = 'gemini-2.5-flash';
    
    const langMap: Record<string, string> = {
      es: "Responde en Español.",
      en: "Respond in English.",
      it: "Rispondi in Italiano.",
      fr: "Répondez en Français.",
      de: "Antworte auf Deutsch.",
      zh: "请用中文回答。",
      ja: "日本語で答えてください。",
      ko: "한국어로 답변해 주세요."
    };
    
    const langInstruction = langMap[lang] || "Respond in English.";

    const prompt = `
      Act as a professional songwriter. Create a song structure and chord progression with the following parameters:
      - Key: ${keyRoot} ${keyQuality}
      - Style: ${style}
      - Mood: ${mood}
      - Tempo: ${tempo}
      - Complexity: ${complexity}

      Instructions:
      1. Do NOT start with conversational fillers like "Absolutely!", "Here is your song", or "Sure".
      2. Start DIRECTLY with a 1-sentence context summary of the song vibe.
      3. Structure the song clearly (Verse 1, Chorus, Bridge, etc.).
      4. Provide chord progressions clearly.
      5. End with a 1-sentence "Production Tip".
      6. Keep it concise and easy to read on a mobile screen.
      
      ${langInstruction}
    `;

    const response = await ai.models.generateContent({
      model: model,
      contents: prompt,
      config: {
        safetySettings: [
          { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
          { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
          { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
          { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
        ],
      }
    });

    return response.text || (lang === 'es' ? "No se pudo generar la canción." : "Could not generate song.");
  } catch (error) {
    console.error("Error generating song:", error);
    return lang === 'es' ? "Error al conectar con la IA." : "Error connecting to AI.";
  }
};