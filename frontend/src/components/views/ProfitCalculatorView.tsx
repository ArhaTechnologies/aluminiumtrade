import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { translations, formatINR } from '../../lib/i18n';
import { Calculator, Sliders, TrendingUp, Sparkles, ArrowUpRight, ArrowDownRight } from 'lucide-react';

export const ProfitCalculatorView: React.FC = () => {
  const { language, activeHoldings, currentSpotPrice } = useApp();
  const t = translations[language];

  const [simulatedPrice, setSimulatedPrice] = useState<number>(currentSpotPrice.pricePerKg + 50);
  const [testQtyKg, setTestQtyKg] = useState<number>(100);
  const [testBuyPrice, setTestBuyPrice] = useState<number>(currentSpotPrice.pricePerKg);

  // Active Portfolio Holdings Weight
  const totalHeldKg = activeHoldings.reduce((sum, h) => sum + h.remainingQuantityKg, 0);
  const totalCostBasis = activeHoldings.reduce((sum, h) => sum + h.totalCostBasis, 0);

  // Projection for Hypothetical Trade
  const hypCost = testQtyKg * testBuyPrice;
  const hypProjectedVal = testQtyKg * simulatedPrice;
  const hypProfit = hypProjectedVal - hypCost;
  const hypRoi = hypCost > 0 ? (hypProfit / hypCost) * 100 : 0;

  // Projection for Total Active Portfolio
  const activeProjectedVal = totalHeldKg * simulatedPrice;
  const activeProfit = activeProjectedVal - totalCostBasis;
  const activeRoi = totalCostBasis > 0 ? (activeProfit / totalCostBasis) * 100 : 0;

  return (
    <div className="p-4 sm:p-6 space-y-6 text-slate-100 max-w-5xl mx-auto">
      {/* Header Banner */}
      <div className="bg-[#111827] border border-slate-800 p-6 rounded-2xl shadow-xl flex items-center justify-between">
        <div>
          <div className="flex items-center space-x-2">
            <Calculator className="w-5 h-5 text-indigo-400" />
            <h2 className="text-xl font-black text-white tracking-tight">
              Interactive What-If Profit Calculator
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Simulate future aluminum spot price scenarios and instantly project ROI yields.
          </p>
        </div>

        <div className="text-right">
          <p className="text-[10px] text-slate-400 uppercase font-semibold">Live Spot Rate</p>
          <p className="text-xl font-black text-cyan-400">₹{currentSpotPrice.pricePerKg.toFixed(2)}/kg</p>
        </div>
      </div>

      {/* Main Interactive Controls */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Controls Side */}
        <div className="bg-[#111827] border border-slate-800 p-6 rounded-2xl shadow-xl space-y-6">
          <h3 className="text-sm font-bold text-white flex items-center space-x-2 border-b border-slate-800 pb-3">
            <Sliders className="w-4 h-4 text-cyan-400" />
            <span>Simulation Parameters</span>
          </h3>

          {/* Price Slider */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-300">Target Simulated Price</label>
              <span className="text-lg font-black text-cyan-400">₹{simulatedPrice}/kg</span>
            </div>
            <input
              type="range"
              min="300"
              max="1200"
              step="5"
              value={simulatedPrice}
              onChange={(e) => setSimulatedPrice(parseFloat(e.target.value))}
              className="w-full accent-cyan-400 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-500 font-mono">
              <span>₹300/kg</span>
              <span>Spot: ₹{currentSpotPrice.pricePerKg}/kg</span>
              <span>₹1200/kg</span>
            </div>
          </div>

          {/* Custom Trade Inputs */}
          <div className="space-y-3 pt-2 border-t border-slate-800">
            <p className="text-xs font-bold text-white">Hypothetical Purchase Test</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] text-slate-400 block mb-1">Quantity (Kg)</label>
                <input
                  type="number"
                  value={testQtyKg}
                  onChange={(e) => setTestQtyKg(Math.max(1, parseInt(e.target.value) || 0))}
                  className="w-full bg-slate-900 border border-slate-700 text-white font-bold text-xs rounded-xl p-2.5 focus:outline-none focus:border-cyan-500"
                />
              </div>
              <div>
                <label className="text-[10px] text-slate-400 block mb-1">Buy Price (₹/Kg)</label>
                <input
                  type="number"
                  value={testBuyPrice}
                  onChange={(e) => setTestBuyPrice(parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-900 border border-slate-700 text-white font-bold text-xs rounded-xl p-2.5 focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Projection Results Side */}
        <div className="bg-[#111827] border border-slate-800 p-6 rounded-2xl shadow-xl space-y-6 flex flex-col justify-between">
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center space-x-2 border-b border-slate-800 pb-3">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>Projected Scenario Outcome</span>
            </h3>

            {/* Test Trade Projection Result */}
            <div
              className={`p-4 rounded-2xl border ${
                hypProfit >= 0
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                  : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Hypothetical Trade ({testQtyKg} Kg)
                </span>
                <span className="text-xs font-black">{hypRoi >= 0 ? '+' : ''}{hypRoi.toFixed(2)}% ROI</span>
              </div>
              <p className="text-2xl font-black">
                {hypProfit >= 0 ? '+' : ''}{formatINR(hypProfit)}
              </p>
              <p className="text-[11px] text-slate-400 mt-1">
                At ₹{simulatedPrice}/kg, Total Value = <strong className="text-white">{formatINR(hypProjectedVal)}</strong>
              </p>
            </div>

            {/* Active Inventory Portfolio Projection */}
            <div
              className={`p-4 rounded-2xl border ${
                activeProfit >= 0
                  ? 'bg-cyan-500/10 border-cyan-500/30 text-cyan-300'
                  : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Total Active Portfolio ({totalHeldKg} Kg)
                </span>
                <span className="text-xs font-black">{activeRoi >= 0 ? '+' : ''}{activeRoi.toFixed(2)}% ROI</span>
              </div>
              <p className="text-2xl font-black">
                {activeProfit >= 0 ? '+' : ''}{formatINR(activeProfit)}
              </p>
              <p className="text-[11px] text-slate-400 mt-1">
                At ₹{simulatedPrice}/kg, Portfolio Value = <strong className="text-white">{formatINR(activeProjectedVal)}</strong>
              </p>
            </div>
          </div>

          <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl text-[11px] text-slate-400">
            💡 Adjust the slider above to see live profit simulations across market swings.
          </div>
        </div>
      </div>
    </div>
  );
};
