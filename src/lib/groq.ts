import Groq from "groq-sdk";

let groqInstance: Groq | null = null;

export function getGroq() {
  if (!groqInstance) {
    const apiKey = import.meta.env.VITE_GROQ_API_KEY;
    if (!apiKey) {
      throw new Error("VITE_GROQ_API_KEY is missing. Please ensure you added 'VITE_GROQ_API_KEY' to your Environment Variables in your hosting dashboard.");
    }
    // Dangerously allow browser usage since this is a client-side architecture 
    // and the user specifically requested adding a secondary key
    groqInstance = new Groq({ apiKey, dangerouslyAllowBrowser: true });
  }
  return groqInstance;
}
