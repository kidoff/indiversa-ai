import { GoogleGenAI } from "@google/genai";

let aiInstance: GoogleGenAI | null = null;

export function getAI() {
  if (!aiInstance) {
    const apiKey = process.env.GEMINI_API_KEY || import.meta.env.VITE_GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY is missing. If you are hosting on Cloudflare, please ensure you added 'VITE_GEMINI_API_KEY' or 'GEMINI_API_KEY' to your Environment Variables in the Cloudflare Dashboard, and then trigger a REBUILD of your project.");
    }
    aiInstance = new GoogleGenAI({ apiKey });
  }
  return aiInstance;
}
