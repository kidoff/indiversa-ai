import React, { useState, useRef, useEffect } from 'react';
import { Search, Loader2, TrendingUp, BarChart3, Globe, Zap, ArrowRight, ShieldCheck, Activity, AlertCircle, ChevronLeft } from 'lucide-react';
import { getAI } from './lib/gemini';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { motion, AnimatePresence } from 'motion/react';

const SUGGESTED_QUERIES = [
  "How are the major tech stocks performing today?",
  "Analyze the latest earnings report for Nvidia (NVDA)",
  "What is the current market sentiment on AI infrastructure?",
  "Explain options trading strategies for volatile markets",
];

export default function App() {
  const [query, setQuery] = useState("");
  const [activeQuery, setActiveQuery] = useState("");
  const [result, setResult] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const searchEndRef = useRef<HTMLDivElement>(null);
  
  // Search handling
  const handleSearch = async (e?: React.FormEvent, selectedQuery?: string) => {
    if (e) e.preventDefault();
    const q = selectedQuery || query;
    if (!q.trim()) return;

    setQuery(q);
    setActiveQuery(q);
    setIsSearching(true);
    setResult("");
    setError(null);

    try {
      const ai = getAI();
      let response;
      try {
        response = await ai.models.generateContentStream({
           model: "gemini-2.5-flash",
           contents: `You are Indiversa Ai, an advanced, professional AI search engine specializing in stock market research and real-time data analysis. 
  Please provide a comprehensive, accurate, and highly professional response to the following query. Format your response cleanly using markdown. Use a structured and analytical tone appropriate for financial analysts and investors.
  
  User Query: ${q}`,
           config: {
             tools: [{ googleSearch: {} }],
           }
        });
      } catch (firstErr: any) {
        if (firstErr.message?.includes("503") || firstErr.status === 503 || firstErr.message?.includes("high demand")) {
          // Fallback to another model
          response = await ai.models.generateContentStream({
             model: "gemini-1.5-flash", // Fallback model
             contents: `You are Indiversa Ai, an advanced, professional AI search engine specializing in stock market research and real-time data analysis. 
    Please provide a comprehensive, accurate, and highly professional response to the following query. Format your response cleanly using markdown. Use a structured and analytical tone appropriate for financial analysts and investors.
    
    User Query: ${q}`,
             config: {
               tools: [{ googleSearch: {} }],
             }
          });
        } else {
          throw firstErr;
        }
      }

      let fullText = "";
      for await (const chunk of response) {
        if (chunk.text) {
          fullText += chunk.text;
          setResult(fullText);
        }
      }
    } catch (err: any) {
      console.error(err);
      if (err.message?.includes("API key expired") || err.message?.includes("API_KEY_INVALID")) {
        setError("API Key Error: Your API key is invalid or expired. If you just updated the key in Cloudflare, make sure you trigger a fully new REDEPLOY of your Cloudflare project so the updated 'VITE_GEMINI_API_KEY' takes effect. Also, verify the key was copied correctly from AI Studio.");
      } else if (err.message?.includes("403") || err.status === 403 || err.message?.includes("PERMISSION_DENIED")) {
        setError("API Key Error (403): Your Google Cloud project has been denied access or lacks the necessary permissions. Please check your Google AI Studio account, ensure your project is active, and try generating a new API Key.");
      } else if (err.message?.includes("503") || err.status === 503 || err.message?.includes("high demand")) {
        setError("Service Unavailable (503): The Google AI models are currently experiencing high demand. Please try again in down a few minutes.");
      } else if (err.message?.includes("429") || err.status === 429) {
        setError("You have exceeded your Gemini API rate limit. Please wait a moment and try again, or check your API key billing details on Google AI Studio.");
      } else {
        setError(err.message || "An error occurred while fetching the search results. Please verify your API key and network connection.");
      }
    } finally {
      setIsSearching(false);
    }
  };

  useEffect(() => {
    if (isSearching || result) {
      searchEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [result, isSearching]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 font-sans selection:bg-emerald-500/30">
      {/* Background ambient light */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-emerald-900/10 blur-[120px]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-blue-900/10 blur-[120px]" />
      </div>

      <div className="relative z-10 flex flex-col min-h-screen">
        {/* Header (compact when searched, large when empty) */}
        <AnimatePresence mode="wait">
          {!activeQuery ? (
            <motion.div 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -50, filter: "blur(10px)" }}
              transition={{ duration: 0.5 }}
              className="flex-1 flex flex-col items-center justify-center p-6 md:p-12 mt-12"
            >
              <div className="mb-8 flex items-center justify-center gap-3">
                <div className="bg-emerald-500/10 p-3 rounded-2xl border border-emerald-500/20">
                  <Activity className="w-10 h-10 text-emerald-400" />
                </div>
                <h1 className="text-5xl md:text-6xl font-bold tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
                  Indiversa Ai
                </h1>
              </div>
              <p className="text-slate-400 text-lg md:text-xl text-center max-w-2xl mb-12 font-light">
                Professional intelligence and real-time market analysis, powered by advanced AI grounding.
              </p>

              {/* Big Search Bar */}
              <div className="w-full max-w-3xl relative">
                <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500/20 to-blue-500/20 rounded-2xl blur opacity-50 group-hover:opacity-100 transition duration-1000 group-hover:duration-200"></div>
                <form onSubmit={handleSearch} className="relative flex items-center bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl shadow-black/50 hover:border-slate-700 transition duration-300">
                  <Search className="absolute left-6 w-6 h-6 text-slate-500" />
                  <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search markets, technicals, fundamentals..."
                    className="w-full bg-transparent border-none text-slate-100 text-lg px-16 py-6 rounded-2xl focus:outline-none focus:ring-0 placeholder:text-slate-600"
                  />
                  <button 
                    type="submit"
                    disabled={!query.trim() || isSearching}
                    className="absolute right-3 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 disabled:text-slate-500 text-white p-3 rounded-xl transition shadow-lg"
                  >
                    <ArrowRight className="w-5 h-5" />
                  </button>
                </form>
              </div>

              {/* Suggestions */}
              <div className="mt-16 w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 gap-4">
                {SUGGESTED_QUERIES.map((q, i) => (
                  <button
                    key={i}
                    onClick={() => handleSearch(undefined, q)}
                    className="flex items-start text-left gap-4 p-5 rounded-2xl bg-slate-900/50 border border-slate-800/50 hover:bg-slate-800 hover:border-emerald-500/30 transition group"
                  >
                    <div className="mt-0.5 bg-slate-800/80 group-hover:bg-emerald-500/20 p-2 rounded-lg transition">
                      <TrendingUp className="w-4 h-4 group-hover:text-emerald-400 text-slate-400" />
                    </div>
                    <span className="text-slate-300 group-hover:text-slate-100 text-sm font-medium leading-relaxed">
                      {q}
                    </span>
                  </button>
                ))}
              </div>

              {/* Stats/Features Footer */}
              <div className="mt-auto pt-24 pb-8 flex items-center justify-center gap-12 text-slate-500 text-sm font-medium">
                <div className="flex items-center gap-2"><Globe className="w-4 h-4" /> Global Coverage</div>
                <div className="flex items-center gap-2"><Zap className="w-4 h-4" /> Real-time Data</div>
                <div className="flex items-center gap-2"><ShieldCheck className="w-4 h-4" /> Institutional Grade</div>
              </div>
            </motion.div>
          ) : (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
              className="flex-1 flex flex-col w-full"
            >
              {/* Compact Top Bar */}
              <div className="sticky top-0 z-50 bg-slate-950/80 backdrop-blur-xl border-b border-slate-800/50 pt-4 pb-4 px-4 sm:px-8">
                <div className="max-w-5xl mx-auto flex flex-col sm:flex-row gap-4 items-center">
                  <div className="flex items-center gap-3 w-full sm:w-auto">
                    <button 
                      onClick={() => { setActiveQuery(""); setResult(""); setQuery(""); }}
                      className="p-2 -ml-2 hover:bg-slate-800/80 rounded-xl text-slate-400 hover:text-slate-200 transition-colors flex items-center gap-1.5 shrink-0"
                      title="Back to Home"
                    >
                      <ChevronLeft className="w-5 h-5" />
                      <span className="text-sm font-medium pr-1">Back</span>
                    </button>
                    <div className="flex items-center gap-2" onClick={() => { setActiveQuery(""); setResult(""); setQuery(""); }} role="button" aria-label="Home">
                      <Activity className="w-7 h-7 text-emerald-500" />
                      <h1 className="text-xl font-bold bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent hidden sm:block">
                        Indiversa
                      </h1>
                    </div>
                  </div>
                  
                  <form onSubmit={handleSearch} className="relative flex-1 w-full flex items-center">
                    <Search className="absolute left-4 w-5 h-5 text-slate-500" />
                    <input
                      type="text"
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder="Ask anything..."
                      className="w-full bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-100 text-base pl-12 pr-12 py-3.5 rounded-xl focus:outline-none focus:border-emerald-500/50 transition"
                    />
                    <button 
                      type="submit"
                      disabled={isSearching}
                      className="absolute right-2 p-2 hover:bg-slate-800 rounded-lg text-slate-400 disabled:opacity-50 transition"
                    >
                      <ArrowRight className="w-5 h-5" />
                    </button>
                  </form>
                </div>
              </div>

              {/* Main Content Area */}
              <div className="flex-1 w-full max-w-5xl mx-auto px-4 sm:px-8 py-8 md:py-12">
                <div className="mb-8">
                  <h2 className="text-3xl font-semibold text-white mb-2 leading-tight">{activeQuery}</h2>
                </div>

                {error && (
                  <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl mb-8 flex items-start gap-4">
                     <AlertCircle className="w-6 h-6 shrink-0 mt-0.5" />
                     <p>{error}</p>
                  </div>
                )}

                <div className="bg-slate-900/50 border border-slate-800/50 rounded-2xl p-6 sm:p-10 shadow-xl relative min-h-[400px]">
                  {/* Decorative Elements */}
                  <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
                    <BarChart3 className="w-32 h-32" />
                  </div>

                  {result ? (
                    <motion.div 
                      key="result"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="relative z-10"
                    >
                      <div className="markdown-body">
                        <Markdown remarkPlugins={[remarkGfm]}>{result}</Markdown>
                      </div>
                      
                      {isSearching && (
                        <div className="mt-8 flex items-center gap-3 text-slate-500 py-4 border-t border-slate-800/50">
                          <Loader2 className="w-5 h-5 animate-spin text-emerald-500" />
                          <span className="text-sm font-medium">Continuing analysis...</span>
                        </div>
                      )}
                    </motion.div>
                  ) : isSearching ? (
                     <motion.div 
                        key="loading"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="flex flex-col items-center justify-center py-20 text-slate-400"
                      >
                        <div className="relative">
                          <div className="w-16 h-16 border-4 border-slate-800 rounded-full"></div>
                          <div className="w-16 h-16 border-4 border-emerald-500 rounded-full border-t-transparent animate-spin absolute top-0 left-0"></div>
                        </div>
                        <p className="mt-6 font-medium text-lg tracking-wide animate-pulse">Running live market search...</p>
                        <p className="mt-2 text-sm text-slate-500 max-w-sm text-center">Synthesizing multiple data sources and real-time quotes to generate insights.</p>
                      </motion.div>
                  ) : null}
                  
                  <div ref={searchEndRef} />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
