import React from 'react';
import { useApp } from '../../context/AppContext';
import { translations, formatINR, formatDate } from '../../lib/i18n';
import {
  Boxes,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  Coins,
  Search,
} from 'lucide-react';

export const HoldingsView: React.FC = () => {
  const {
    language,
    activeHoldings,
    selectedUserId,
    setSelectedUserId,
    users,
    currentSpotPrice,
    setActiveTab,
  } = useApp();

  const t = translations[language];

  const filteredHoldings = selectedUserId === 'ALL'
    ? activeHoldings
    : activeHoldings.filter((h) => h.userId === selectedUserId);

  const totalCostBasis = filteredHoldings.reduce((sum, h) => sum + h.totalCostBasis, 0);
  const totalMarketVal = filteredHoldings.reduce((sum, h) => sum + h.currentMarketValue, 0);
  const totalUnrealizedPnL = totalMarketVal - totalCostBasis;
  const overallROI = totalCostBasis > 0 ? (totalUnrealizedPnL / totalCostBasis) * 100 : 0;
  const totalWeightKg = filteredHoldings.reduce((sum, h) => sum + h.remainingQuantityKg, 0);

  return (
    <div className="p-4 sm:p-6 space-y-6 text-slate-100 max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className="bg-[#111827] border border-slate-800 p-6 rounded-2xl shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <Boxes className="w-5 h-5 text-cyan-400" />
            <h2 className="text-xl font-black text-white tracking-tight">
              Active Holdings & Inventory Lots
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Detailed tracking of unsold aluminum stock lots, cost basis, and live market valuation.
          </p>
        </div>

        {/* Spot Price Reference */}
        <div className="bg-slate-900 border border-slate-800 px-4 py-2.5 rounded-xl text-right">
          <p className="text-[10px] text-slate-400 font-semibold uppercase">Live Spot Rate</p>
          <p className="text-xl font-black text-cyan-400">₹{currentSpotPrice.pricePerKg.toFixed(2)}/kg</p>
        </div>
      </div>

      {/* Holdings Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#111827] border border-slate-800 p-4 rounded-xl">
          <p className="text-[11px] font-semibold text-slate-400">Total In-Stock Weight</p>
          <h3 className="text-xl font-black text-white mt-1">{totalWeightKg} Kg</h3>
          <p className="text-[10px] text-slate-400 mt-0.5">{filteredHoldings.length} Active Lots</p>
        </div>

        <div className="bg-[#111827] border border-slate-800 p-4 rounded-xl">
          <p className="text-[11px] font-semibold text-slate-400">Total Cost Basis</p>
          <h3 className="text-xl font-black text-white mt-1">{formatINR(totalCostBasis)}</h3>
          <p className="text-[10px] text-slate-400 mt-0.5">Original purchase amount</p>
        </div>

        <div className="bg-[#111827] border border-slate-800 p-4 rounded-xl">
          <p className="text-[11px] font-semibold text-slate-400">Current Market Value</p>
          <h3 className="text-xl font-black text-cyan-400 mt-1">{formatINR(totalMarketVal)}</h3>
          <p className="text-[10px] text-slate-400 mt-0.5">Valued @ current spot</p>
        </div>

        <div className="bg-[#111827] border border-slate-800 p-4 rounded-xl">
          <p className="text-[11px] font-semibold text-slate-400">Unrealized P&L</p>
          <h3 className={`text-xl font-black mt-1 ${totalUnrealizedPnL >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
            {totalUnrealizedPnL >= 0 ? '+' : ''}
            {formatINR(totalUnrealizedPnL)} ({overallROI.toFixed(2)}%)
          </h3>
          <p className="text-[10px] text-slate-400 mt-0.5">Open position return</p>
        </div>
      </div>

      {/* Inventory Lots Table */}
      <div className="bg-[#111827] border border-slate-800 p-5 rounded-2xl shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h3 className="text-sm font-bold text-white flex items-center space-x-2">
            <Boxes className="w-4 h-4 text-cyan-400" />
            <span>Unsold Stock Lot Directory</span>
          </h3>

          <select
            value={selectedUserId}
            onChange={(e) => setSelectedUserId(e.target.value)}
            className="bg-slate-900 border border-slate-700 text-xs text-slate-200 rounded-xl px-3 py-1.5 focus:outline-none"
          >
            <option value="ALL">{t.allUsers}</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.fullName} ({u.id})
              </option>
            ))}
          </select>
        </div>

        {filteredHoldings.length === 0 ? (
          <div className="py-12 text-center text-slate-500 text-xs">
            No active unsold inventory lots found for the selected view.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900 text-slate-400 font-bold uppercase text-[10px]">
                <tr>
                  <th className="p-3 rounded-l-lg">Lot Ref</th>
                  <th className="p-3">Trader</th>
                  <th className="p-3">Purchase Date</th>
                  <th className="p-3">Stock Remaining</th>
                  <th className="p-3">Buy Price</th>
                  <th className="p-3">Spot Price</th>
                  <th className="p-3">Cost Basis</th>
                  <th className="p-3">Market Value</th>
                  <th className="p-3">Unrealized P&L</th>
                  <th className="p-3 text-right rounded-r-lg">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredHoldings.map((h) => {
                  const isGain = h.unrealizedPnL >= 0;
                  return (
                    <tr key={h.purchaseId} className="hover:bg-slate-800/40 transition-colors">
                      <td className="p-3 font-mono text-cyan-400 font-bold">{h.purchaseId}</td>
                      <td className="p-3 font-semibold text-white">
                        {users.find((u) => u.id === h.userId)?.fullName || h.userName}
                      </td>
                      <td className="p-3 text-slate-400">{formatDate(h.purchaseDate)}</td>
                      <td className="p-3 font-bold text-white">
                        {h.remainingQuantityKg} Kg{' '}
                        <span className="text-[10px] text-slate-500 font-normal">
                          (of {h.originalQuantityKg} Kg)
                        </span>
                      </td>
                      <td className="p-3 text-slate-300">₹{h.buyPricePerKg}</td>
                      <td className="p-3 font-bold text-cyan-400">₹{h.currentMarketPricePerKg}</td>
                      <td className="p-3 text-slate-300">{formatINR(h.totalCostBasis)}</td>
                      <td className="p-3 font-bold text-white">{formatINR(h.currentMarketValue)}</td>
                      <td className={`p-3 font-bold ${isGain ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {isGain ? '+' : ''}
                        {formatINR(h.unrealizedPnL)} ({h.unrealizedPnLPercent.toFixed(2)}%)
                      </td>
                      <td className="p-3 text-right">
                        <button
                          onClick={() => {
                            setSelectedUserId(h.userId);
                            setActiveTab('sell');
                          }}
                          className="bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-300 font-bold text-[11px] px-2.5 py-1 rounded-lg transition-colors flex items-center space-x-1 ml-auto"
                        >
                          <Coins className="w-3 h-3" />
                          <span>Liquidate Lot</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
