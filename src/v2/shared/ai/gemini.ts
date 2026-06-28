import { GoogleGenAI } from "@google/genai";
import { env } from "../../config/env";

let geminiClient: GoogleGenAI | null = null;

export const getGeminiClient = () => {
  if (geminiClient) {
    return geminiClient;
  }

  if (!env.GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY is not configured.");
  }

  geminiClient = new GoogleGenAI({ apiKey: env.GEMINI_API_KEY });
  return geminiClient;
};
