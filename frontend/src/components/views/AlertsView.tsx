import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { translations, formatDate } from '../../lib/i18n';
import { Bell, Plus, Trash2, CheckCircle2, AlertTriangle, Sparkles, Volume2 } from 'lucide-react';

export const AlertsView: React.FC = () => {
  const {
    language,
    alerts,
    addAlert,
    toggleAlert,
    deleteAlert,
    notifications,
    markNotificationRead,
    clearNotifications,
    currentSpotPrice,
  } = useApp();

  const t = translations[language];

  const [targetPrice, setTargetPrice] = useState<string>('650');
  const [condition, setCondition] = useState<'ABOVE' | 'BELOW'>('ABOVE');
  const [note, setNote] = useState<string>('');

  const handleAddRule = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(targetPrice);
    if (!isNaN(val) && val > 0) {
      addAlert(val, condition, note);
      setNote('');
    }
  };

  return (
    <div className="p-4 sm:p-6 space-y-6 text-slate-100 max-w-5xl mx-auto">
      {/* Header Banner */}
      <div className="bg-[#111827] border border-slate-800 p-6 rounded-2xl shadow-xl flex items-center justify-between">
        <div>
          <div className="flex items-center space-x-2">
            <Bell className="w-5 h-5 text-amber-400" />
            <h2 className="text-xl font-black text-white tracking-tight">
              Live Price Alerts & Notifications System
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Configure automated price thresholds to trigger browser & system notifications when market swings happen.
          </p>
        </div>

        <div className="text-right">
          <p className="text-[10px] text-slate-400 uppercase font-semibold">Live Spot Price</p>
          <p className="text-xl font-black text-cyan-400">₹{currentSpotPrice.pricePerKg.toFixed(2)}/kg</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Create Alert Rule Form */}
        <div className="bg-[#111827] border border-slate-800 p-6 rounded-2xl shadow-xl space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center space-x-2 border-b border-slate-800 pb-3">
            <Plus className="w-4 h-4 text-cyan-400" />
            <span>Create New Price Alert Rule</span>
          </h3>

          <form onSubmit={handleAddRule} className="space-y-4 text-xs">
            <div>
              <label className="font-semibold text-slate-300 block mb-1">Target Price Threshold (₹/Kg)</label>
              <input
                type="number"
                step="1"
                value={targetPrice}
                onChange={(e) => setTargetPrice(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 text-white font-extrabold text-base rounded-xl p-3 focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="font-semibold text-slate-300 block mb-1">Trigger Condition</label>
              <select
                value={condition}
                onChange={(e) => setCondition(e.target.value as 'ABOVE' | 'BELOW')}
                className="w-full bg-slate-900 border border-slate-700 text-white font-bold rounded-xl p-3 focus:outline-none focus:border-cyan-500"
              >
                <option value="ABOVE">When Price Rises ABOVE (≥)</option>
                <option value="BELOW">When Price Drops BELOW (≤)</option>
              </select>
            </div>

            <div>
              <label className="font-semibold text-slate-300 block mb-1">Custom Alert Note (Optional)</label>
              <input
                type="text"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="e.g. Liquidate Lot BUY-88401 on target"
                className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl p-3 focus:outline-none focus:border-cyan-500"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-black py-3 rounded-xl transition-all shadow-lg shadow-amber-500/20 active:scale-95"
            >
              Set Price Alert Rule
            </button>
          </form>
        </div>

        {/* Active Alert Rules Directory */}
        <div className="bg-[#111827] border border-slate-800 p-6 rounded-2xl shadow-xl space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center space-x-2 border-b border-slate-800 pb-3">
            <Bell className="w-4 h-4 text-amber-400" />
            <span>Active Alert Rules ({alerts.length})</span>
          </h3>

          <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
            {alerts.length === 0 ? (
              <p className="text-xs text-slate-500 py-6 text-center">No alert rules configured yet.</p>
            ) : (
              alerts.map((rule) => (
                <div
                  key={rule.id}
                  className="bg-slate-900 p-3.5 rounded-xl border border-slate-800 flex items-center justify-between text-xs"
                >
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-extrabold text-white text-sm">₹{rule.targetPrice}/kg</span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                          rule.condition === 'ABOVE'
                            ? 'bg-emerald-500/20 text-emerald-300'
                            : 'bg-rose-500/20 text-rose-300'
                        }`}
                      >
                        {rule.condition}
                      </span>
                    </div>
                    {rule.note && <p className="text-[11px] text-slate-400 mt-1">{rule.note}</p>}
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => toggleAlert(rule.id)}
                      className={`text-[10px] font-bold px-2 py-1 rounded border ${
                        rule.active
                          ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30'
                          : 'bg-slate-800 text-slate-500 border-slate-700'
                      }`}
                    >
                      {rule.active ? 'ACTIVE' : 'PAUSED'}
                    </button>
                    <button
                      onClick={() => deleteAlert(rule.id)}
                      className="p-1 text-slate-500 hover:text-rose-400 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
