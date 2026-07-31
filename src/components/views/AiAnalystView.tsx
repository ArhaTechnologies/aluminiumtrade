import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { formatINR } from '../../lib/i18n';
import {
  Sparkles,
  Bot,
  Send,
  TrendingUp,
  TrendingDown,
  ShieldAlert,
  Target,
  RefreshCw,
  Lightbulb,
  Zap,
  CheckCircle2,
  Brain,
  HelpCircle,
  BarChart3,
  MessageSquare,
} from 'lucide-react';

interface AiAnalysisResult {
  marketSentiment: 'BULLISH' | 'BEARISH' | 'NEUTRAL' | string;
  riskRating: 'LOW' | 'MODERATE' | 'HIGH' | string;
  buyTargetPrice: number;
  sellTargetPrice: number;
  summary: string;
  recommendations: string[];
  keyFactors: string[];
}

interface ChatMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: string;
}

export const AiAnalystView: React.FC = () => {
  const {
    currentSpotPrice,
    activeHoldings,
    purchases,
    sales,
    selectedUserId,
    users,
  } = useApp();

  const selectedUser = users.find((u) => u.id === selectedUserId) || users[0];

  // AI Market Analysis State
  const [analysis, setAnalysis] = useState<AiAnalysisResult | null>(null);
  const [analyzing, setAnalyzing] = useState<boolean>(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);

  // Chat Copilot State
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome-1',
      sender: 'ai',
      text: `👋 **Greetings! I am your AluTrade AI Copilot**, powered by Gemini 3.6 Flash.\n\nI analyze live aluminum commodity pricing, 18% GST tax margins, inventory risk, and trade execution strategies. Ask me anything or click a prompt below!`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [inputMessage, setInputMessage] = useState<string>('');
  const [chatLoading, setChatLoading] = useState<boolean>(false);

  // Compute metrics for AI context
  const totalHoldingsKg = activeHoldings.reduce((sum, h) => sum + h.remainingQuantityKg, 0);
  const totalHoldingsVal = activeHoldings.reduce((sum, h) => sum + h.currentMarketValue, 0);

  // Fetch AI Analysis on Mount
  useEffect(() => {
    runMarketAnalysis();
  }, []);

  const runMarketAnalysis = async () => {
    setAnalyzing(true);
    setAnalysisError(null);
    try {
      const res = await fetch('/api/ai/analyze-market', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          spotPrice: currentSpotPrice.pricePerKg,
          change24h: currentSpotPrice.change24h,
          totalInventoryKg: totalHoldingsKg,
          totalHoldingsValue: totalHoldingsVal,
          recentTrades: [...purchases, ...sales].slice(0, 10),
        }),
      });

      const data = await res.json();
      if (res.ok && data.success && data.analysis) {
        setAnalysis(data.analysis);
      } else {
        setAnalysisError(data.error || 'Failed to generate AI analysis.');
      }
    } catch (err: any) {
      setAnalysisError(err.message || 'Error communicating with AI server.');
    } finally {
      setAnalyzing(false);
    }
  };

  const handleSendMessage = async (textToSend?: string) => {
    const query = textToSend || inputMessage;
    if (!query.trim() || chatLoading) return;

    const userMsg: ChatMessage = {
      id: `usr-${Date.now()}`,
      sender: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setChatMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInputMessage('');
    setChatLoading(true);

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: query,
          context: {
            spotPrice: currentSpotPrice.pricePerKg,
            userBalance: selectedUser ? selectedUser.walletBalance : 0,
            userInventory: selectedUser ? selectedUser.inventoryKg : totalHoldingsKg,
            holdingsCount: activeHoldings.length,
          },
        }),
      });

      const data = await res.json();
      if (res.ok && data.success && data.reply) {
        const aiMsg: ChatMessage = {
          id: `ai-${Date.now()}`,
          sender: 'ai',
          text: data.reply,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };
        setChatMessages((prev) => [...prev, aiMsg]);
      } else {
        const errorMsg: ChatMessage = {
          id: `ai-err-${Date.now()}`,
          sender: 'ai',
          text: `⚠️ **AI Service Note:** ${data.error || 'Unable to fetch response from Gemini.'}`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };
        setChatMessages((prev) => [...prev, errorMsg]);
      }
    } catch (err: any) {
      const errorMsg: ChatMessage = {
        id: `ai-err-${Date.now()}`,
        sender: 'ai',
        text: `⚠️ **Network Error:** Could not connect to AI backend endpoint.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setChatMessages((prev) => [...prev, errorMsg]);
    } finally {
      setChatLoading(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 space-y-6 text-slate-100 max-w-6xl mx-auto">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-cyan-950/80 via-[#111827] to-purple-950/80 border border-cyan-500/30 p-6 rounded-2xl shadow-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 relative overflow-hidden">
        <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="space-y-1 relative z-10">
          <div className="flex items-center space-x-2">
            <div className="p-2 bg-cyan-500/20 border border-cyan-500/30 rounded-xl text-cyan-400">
              <Brain className="w-5 h-5 animate-pulse" />
            </div>
            <h2 className="text-xl font-black text-white tracking-tight flex items-center space-x-2">
              <span>AluTrade AI Copilot & Market Analyst</span>
              <span className="text-[10px] bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-mono px-2 py-0.5 rounded-full uppercase">
                Gemini 3.6 Flash
              </span>
            </h2>
          </div>
          <p className="text-xs text-slate-400">
            Real-time commodity market intelligence, target entry/exit pricing, GST tax strategy, and trading assistant.
          </p>
        </div>

        <button
          onClick={runMarketAnalysis}
          disabled={analyzing}
          className="relative z-10 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-xs px-4 py-2.5 rounded-xl transition-all shadow-lg flex items-center space-x-2 disabled:opacity-50 self-start md:self-auto shrink-0"
        >
          <RefreshCw className={`w-4 h-4 ${analyzing ? 'animate-spin' : ''}`} />
          <span>{analyzing ? 'Analyzing Market...' : 'Run Gemini Market Diagnosis'}</span>
        </button>
      </div>

      {/* Main Grid: Analysis Report + Copilot Chat */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Gemini Intelligence Report */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-[#111827] border border-slate-800 p-6 rounded-2xl shadow-xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <BarChart3 className="w-4 h-4 text-cyan-400" />
                <h3 className="text-sm font-bold text-white">Gemini Market Diagnosis</h3>
              </div>
              {analysis && (
                <span
                  className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-full border ${
                    analysis.marketSentiment === 'BULLISH'
                      ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                      : analysis.marketSentiment === 'BEARISH'
                      ? 'bg-rose-500/20 border-rose-500/40 text-rose-300'
                      : 'bg-amber-500/20 border-amber-500/40 text-amber-300'
                  }`}
                >
                  {analysis.marketSentiment} SENTIMENT
                </span>
              )}
            </div>

            {analyzing && !analysis && (
              <div className="p-8 text-center space-y-3">
                <div className="w-10 h-10 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto" />
                <p className="text-xs text-slate-400 font-mono">Gemini AI is analyzing live metal prices & trades...</p>
              </div>
            )}

            {analysisError && (
              <div className="bg-rose-500/10 border border-rose-500/30 text-rose-300 p-4 rounded-xl text-xs space-y-1">
                <p className="font-bold flex items-center space-x-1">
                  <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>AI Analysis Note</span>
                </p>
                <p className="text-slate-400">{analysisError}</p>
                <p className="text-[11px] text-slate-500 pt-1">
                  Make sure GEMINI_API_KEY is available in your environment secrets.
                </p>
              </div>
            )}

            {analysis && (
              <div className="space-y-4 animate-fadeIn">
                {/* Target Price Guidance Cards */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-slate-900 border border-slate-800 p-3 rounded-xl space-y-1">
                    <span className="text-[10px] text-slate-400 uppercase font-bold flex items-center space-x-1">
                      <Target className="w-3 h-3 text-cyan-400" />
                      <span>Target Buy Entry</span>
                    </span>
                    <div className="text-base font-black text-cyan-400">
                      ₹{analysis.buyTargetPrice ? analysis.buyTargetPrice.toFixed(2) : '242.00'} /kg
                    </div>
                    <div className="text-[10px] text-slate-500">Optimal purchase spot</div>
                  </div>

                  <div className="bg-slate-900 border border-slate-800 p-3 rounded-xl space-y-1">
                    <span className="text-[10px] text-slate-400 uppercase font-bold flex items-center space-x-1">
                      <Target className="w-3 h-3 text-emerald-400" />
                      <span>Target Sell Exit</span>
                    </span>
                    <div className="text-base font-black text-emerald-400">
                      ₹{analysis.sellTargetPrice ? analysis.sellTargetPrice.toFixed(2) : '258.00'} /kg
                    </div>
                    <div className="text-[10px] text-slate-500">Take-profit threshold</div>
                  </div>
                </div>

                {/* AI Summary */}
                <div className="bg-slate-900/80 border border-slate-800 p-3.5 rounded-xl space-y-1.5">
                  <span className="text-[11px] text-cyan-400 font-bold uppercase tracking-wider block">
                    AI Market Summary
                  </span>
                  <p className="text-xs text-slate-300 leading-relaxed">{analysis.summary}</p>
                </div>

                {/* Recommendations List */}
                <div className="space-y-2">
                  <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider block">
                    Actionable Trade Recommendations
                  </span>
                  <div className="space-y-1.5">
                    {analysis.recommendations?.map((rec, idx) => (
                      <div
                        key={idx}
                        className="bg-slate-900/60 border border-slate-800 p-2.5 rounded-xl text-xs text-slate-200 flex items-start space-x-2"
                      >
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                        <span>{rec}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Key Factors */}
                <div className="space-y-1.5">
                  <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider block">
                    Market Drivers (LME / MCX)
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {analysis.keyFactors?.map((factor, idx) => (
                      <span
                        key={idx}
                        className="text-[11px] bg-slate-900 border border-slate-700 text-cyan-300 px-2.5 py-1 rounded-lg"
                      >
                        • {factor}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: AI Trade Copilot Chat Assistant */}
        <div className="lg:col-span-7 bg-[#111827] border border-slate-800 rounded-2xl shadow-xl flex flex-col justify-between overflow-hidden min-h-[580px]">
          {/* Chat Header */}
          <div className="p-4 border-b border-slate-800 bg-slate-900/60 flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-xl bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                <Bot className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Interactive Copilot Chat</h3>
                <p className="text-[11px] text-slate-400">Ask commodity trade questions in real-time</p>
              </div>
            </div>

            <div className="text-[11px] text-emerald-400 font-mono bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-full flex items-center space-x-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span>Gemini Ready</span>
            </div>
          </div>

          {/* Chat Messages Scroll Container */}
          <div className="p-4 flex-1 space-y-4 overflow-y-auto max-h-[420px]">
            {chatMessages.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl p-3.5 text-xs leading-relaxed space-y-1 shadow-md ${
                    msg.sender === 'user'
                      ? 'bg-cyan-600 text-white rounded-br-none font-medium'
                      : 'bg-slate-900 border border-slate-800 text-slate-200 rounded-bl-none whitespace-pre-line'
                  }`}
                >
                  <div>{msg.text}</div>
                </div>
                <span className="text-[10px] text-slate-500 px-1 mt-1 font-mono">{msg.timestamp}</span>
              </div>
            ))}

            {chatLoading && (
              <div className="flex items-center space-x-2 text-xs text-cyan-400 bg-cyan-500/10 border border-cyan-500/20 p-3 rounded-2xl w-fit">
                <Bot className="w-4 h-4 animate-spin" />
                <span>Gemini is generating response...</span>
              </div>
            )}
          </div>

          {/* Quick Prompt Preset Chips */}
          <div className="p-3 bg-slate-900/40 border-t border-slate-800 space-y-2">
            <span className="text-[10px] text-slate-400 uppercase font-bold px-1 block">Quick Trading Questions:</span>
            <div className="flex flex-wrap gap-1.5">
              <button
                onClick={() => handleSendMessage('Is now a good time to buy 5,000 kg aluminum ingots?')}
                className="text-[11px] bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 px-2.5 py-1 rounded-lg transition-all text-left"
              >
                💡 Should I buy 5k kg today?
              </button>
              <button
                onClick={() => handleSendMessage('How to calculate 18% GST tax input credit on metal purchases?')}
                className="text-[11px] bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 px-2.5 py-1 rounded-lg transition-all text-left"
              >
                ⚖️ How does 18% GST credit work?
              </button>
              <button
                onClick={() => handleSendMessage('What is my profit if aluminum spot price rises to ₹265/kg?')}
                className="text-[11px] bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 px-2.5 py-1 rounded-lg transition-all text-left"
              >
                📈 Profit at ₹265/kg?
              </button>
            </div>
          </div>

          {/* Input Form */}
          <div className="p-3 border-t border-slate-800 bg-slate-900/80">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="flex items-center space-x-2"
            >
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder="Ask Gemini AI about metal rates, GST, trades, or market strategies..."
                className="flex-1 bg-slate-950 border border-slate-700 text-xs text-white rounded-xl px-4 py-3 focus:outline-none focus:border-cyan-500 font-medium placeholder-slate-500"
              />
              <button
                type="submit"
                disabled={!inputMessage.trim() || chatLoading}
                className="bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-xs px-4 py-3 rounded-xl transition-all shadow-md disabled:opacity-50 flex items-center justify-center shrink-0"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
