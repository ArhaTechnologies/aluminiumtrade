import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { translations, formatDate } from '../../lib/i18n';
import {
  TrendingUp,
  Sparkles,
  Sliders,
  Bell,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Zap,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
} from 'recharts';

export const MarketView: React.FC = () => {
  const {
    language,
    currentSpotPrice,
    marketPriceHistory,
    simulatorActive,
    toggleSimulator,
    setSpotPriceManual,
    alerts,
    addAlert,
    toggleAlert,
    deleteAlert,
  } = useApp();

  const t = translations[language];

  const [targetAlertPrice, setTargetAlertPrice] = useState<string>('650');
  const [alertCondition, setAlertCondition] = useState<'ABOVE' | 'BELOW'>('ABOVE');
  const [alertNote, setAlertNote] = useState<string>('');
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const handleCreateAlert = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(targetAlertPrice);
    if (!isNaN(val) && val > 0) {
      addAlert(val, alertCondition, alertNote);
      setAlertNote('');
      setStatusMessage(`Price alert set for ₹${val}/kg (${alertCondition})`);
      setTimeout(() => setStatusMessage(null), 3000);
    }
  };

  const chartData = marketPriceHistory.map((pt) => ({
    time: new Date(pt.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    price: pt.pricePerKg,
  }));

  return (
    <div className="p-4 sm:p-6 space-y-6 text-slate-100 max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-[#111827] to-cyan-950 border border-slate-800 p-6 rounded-2xl shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h2 className="text-2xl font-black text-white tracking-tight">
              Aluminum Spot Market Engine
            </h2>
            <span className="bg-cyan-500/20 text-cyan-300 text-xs font-bold px-2.5 py-0.5 rounded-full border border-cyan-500/30">
              Live Feed
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Real-time aluminum ingot (99.7% purity) price monitoring and administrative simulation controls.
          </p>
        </div>

        {/* Current Price Metric Badge */}
        <div className="bg-[#0B0F19]/80 border border-cyan-500/30 px-5 py-3 rounded-2xl shadow-inner flex items-center space-x-4">
          <div>
            <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
              Live Spot Rate
            </p>
            <p className="text-2xl font-black text-cyan-400 tracking-tight">
              ₹{currentSpotPrice.pricePerKg.toFixed(2)} <span className="text-xs font-normal text-slate-400">/kg</span>
            </p>
          </div>
          <div className="text-right border-l border-slate-800 pl-4">
            <p className="text-[10px] text-slate-400">24h Fluctuation</p>
            <p className={`text-xs font-bold ${currentSpotPrice.change24h && currentSpotPrice.change24h >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {currentSpotPrice.change24h && currentSpotPrice.change24h >= 0 ? '+' : ''}
              {currentSpotPrice.change24h || 0}%
            </p>
          </div>
        </div>
      </div>

      {statusMessage && (
        <div className="bg-cyan-500/10 border border-cyan-500/40 text-cyan-300 text-xs px-4 py-3 rounded-xl flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 text-cyan-400" />
          <span>{statusMessage}</span>
        </div>
      )}

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Spot Price Chart */}
        <div className="lg:col-span-2 bg-[#111827] border border-slate-800 p-5 rounded-2xl shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                <TrendingUp className="w-4 h-4 text-cyan-400" />
                <span>Spot Price Movement History</span>
              </h3>
              <p className="text-[11px] text-slate-400">
                Live tick feed (Auto-updates every 5 seconds in simulator mode)
              </p>
            </div>

            <button
              onClick={toggleSimulator}
              className={`text-xs font-bold px-3 py-1.5 rounded-xl border flex items-center space-x-1.5 transition-all ${
                simulatorActive
                  ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40 hover:bg-cyan-500/30'
                  : 'bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{simulatorActive ? 'Simulator Running' : 'Simulator Paused'}</span>
            </button>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="marketGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#06B6D4" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#06B6D4" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="time" stroke="#64748B" fontSize={10} tickLine={false} />
                <YAxis domain={['auto', 'auto']} stroke="#64748B" fontSize={10} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0B0F19',
                    borderColor: '#334155',
                    borderRadius: '12px',
                    color: '#F8FAFC',
                    fontSize: '12px',
                  }}
                  formatter={(val: any) => [`₹${val}/kg`, 'Spot Price']}
                />
                <Area type="monotone" dataKey="price" stroke="#06B6D4" strokeWidth={2.5} fill="url(#marketGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-3 gap-3 pt-3 border-t border-slate-800 text-center">
            <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-800/80">
              <span className="text-[10px] text-slate-400 uppercase font-semibold">24h High</span>
              <p className="text-sm font-bold text-emerald-400">₹{currentSpotPrice.high24h || currentSpotPrice.pricePerKg}/kg</p>
            </div>
            <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-800/80">
              <span className="text-[10px] text-slate-400 uppercase font-semibold">24h Low</span>
              <p className="text-sm font-bold text-rose-400">₹{currentSpotPrice.low24h || currentSpotPrice.pricePerKg}/kg</p>
            </div>
            <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-800/80">
              <span className="text-[10px] text-slate-400 uppercase font-semibold">Update Source</span>
              <p className="text-xs font-bold text-cyan-300">{currentSpotPrice.source}</p>
            </div>
          </div>
        </div>

        {/* Right Side: Price Alert Setup */}
        <div className="space-y-6">

          {/* Quick Price Alert Form */}
          <div className="bg-[#111827] border border-slate-800 p-5 rounded-2xl shadow-xl space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center space-x-2">
              <Bell className="w-4 h-4 text-amber-400" />
              <span>Create Price Alert Rule</span>
            </h3>

            <form onSubmit={handleCreateAlert} className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] font-semibold text-slate-300 block mb-1">Target Price (₹)</label>
                  <input
                    type="number"
                    value={targetAlertPrice}
                    onChange={(e) => setTargetAlertPrice(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 text-white text-xs rounded-xl p-2 focus:outline-none focus:border-cyan-500 font-bold"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-semibold text-slate-300 block mb-1">Condition</label>
                  <select
                    value={alertCondition}
                    onChange={(e) => setAlertCondition(e.target.value as 'ABOVE' | 'BELOW')}
                    className="w-full bg-slate-900 border border-slate-700 text-white text-xs rounded-xl p-2 focus:outline-none focus:border-cyan-500"
                  >
                    <option value="ABOVE">ABOVE (≥)</option>
                    <option value="BELOW">BELOW (≤)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-semibold text-slate-300 block mb-1">Note (Optional)</label>
                <input
                  type="text"
                  value={alertNote}
                  onChange={(e) => setAlertNote(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 text-white text-xs rounded-xl p-2 focus:outline-none focus:border-cyan-500"
                  placeholder="e.g. Target profit trigger"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-slate-800 hover:bg-slate-700 border border-slate-700 text-amber-300 font-bold text-xs py-2 rounded-xl transition-colors flex items-center justify-center space-x-2"
              >
                <Bell className="w-3.5 h-3.5 text-amber-400" />
                <span>Save Alert Rule</span>
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
