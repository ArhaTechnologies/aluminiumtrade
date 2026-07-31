import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { translations, formatINR } from '../../lib/i18n';
import { Trophy, Medal, Award, Flame, TrendingUp } from 'lucide-react';

export const LeaderboardView: React.FC = () => {
  const { language, users, sales, activeHoldings } = useApp();
  const t = translations[language];

  const [sortBy, setSortBy] = useState<'PROFIT' | 'VOLUME' | 'HOLDINGS'>('PROFIT');

  // Compute stats per user
  const leaderboardData = users.map((u) => {
    const userSales = sales.filter((s) => s.userId === u.id);
    const userHoldings = activeHoldings.filter((h) => h.userId === u.id);

    const totalRealizedProfit = userSales.reduce((acc, s) => acc + s.realizedPnL, 0);
    const totalVolumeSold = userSales.reduce((acc, s) => acc + s.quantityKg, 0);
    const totalCostBasisSold = userSales.reduce((acc, s) => acc + s.totalBuyAmount, 0);
    const overallRoi = totalCostBasisSold > 0 ? (totalRealizedProfit / totalCostBasisSold) * 100 : 0;
    const activeStockKg = userHoldings.reduce((acc, h) => acc + h.remainingQuantityKg, 0);

    return {
      user: u,
      realizedProfit: totalRealizedProfit,
      volumeSold: totalVolumeSold,
      roi: overallRoi,
      activeStockKg,
      closedTradesCount: userSales.length,
    };
  });

  // Sort
  leaderboardData.sort((a, b) => {
    if (sortBy === 'PROFIT') return b.realizedProfit - a.realizedProfit;
    if (sortBy === 'VOLUME') return b.volumeSold - a.volumeSold;
    return b.activeStockKg - a.activeStockKg;
  });

  return (
    <div className="p-4 sm:p-6 space-y-6 text-slate-100 max-w-5xl mx-auto">
      {/* Header Banner */}
      <div className="bg-[#111827] border border-slate-800 p-6 rounded-2xl shadow-xl flex items-center justify-between">
        <div>
          <div className="flex items-center space-x-2">
            <Trophy className="w-5 h-5 text-amber-400" />
            <h2 className="text-xl font-black text-white tracking-tight">
              Trader Performance Leaderboard
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Top performing commodity traders ranked by realized profits, trade volume, and ROI return rates.
          </p>
        </div>

        {/* Sort Controls */}
        <div className="flex items-center space-x-1 bg-slate-900 p-1 rounded-xl border border-slate-800">
          <button
            onClick={() => setSortBy('PROFIT')}
            className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-all ${
              sortBy === 'PROFIT' ? 'bg-amber-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            By Profit
          </button>
          <button
            onClick={() => setSortBy('VOLUME')}
            className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-all ${
              sortBy === 'VOLUME' ? 'bg-amber-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            By Volume
          </button>
          <button
            onClick={() => setSortBy('HOLDINGS')}
            className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-all ${
              sortBy === 'HOLDINGS' ? 'bg-amber-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            By Stock
          </button>
        </div>
      </div>

      {/* Leaderboard Table */}
      <div className="bg-[#111827] border border-slate-800 p-5 rounded-2xl shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900 text-slate-400 font-bold uppercase text-[10px]">
              <tr>
                <th className="p-3 rounded-l-lg">Rank</th>
                <th className="p-3">Trader Name</th>
                <th className="p-3">Realized Profit</th>
                <th className="p-3">ROI %</th>
                <th className="p-3">Volume Sold</th>
                <th className="p-3">Active Stock</th>
                <th className="p-3 text-right rounded-r-lg">Closed Trades</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {leaderboardData.map((item, index) => {
                const rank = index + 1;
                return (
                  <tr
                    key={item.user.id}
                    className={`hover:bg-slate-800/40 transition-colors ${
                      rank === 1 ? 'bg-amber-500/5' : ''
                    }`}
                  >
                    <td className="p-3">
                      <div className="flex items-center space-x-2">
                        {rank === 1 && <span className="text-lg">🥇</span>}
                        {rank === 2 && <span className="text-lg">🥈</span>}
                        {rank === 3 && <span className="text-lg">🥉</span>}
                        <span className="font-bold text-slate-200">#{rank}</span>
                      </div>
                    </td>
                    <td className="p-3 font-semibold text-white flex items-center space-x-2">
                      <span>{item.user.fullName}</span>
                      <span className="text-[10px] text-slate-500 font-mono">({item.user.id})</span>
                    </td>
                    <td className={`p-3 font-black text-sm ${item.realizedProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {item.realizedProfit >= 0 ? '+' : ''}
                      {formatINR(item.realizedProfit)}
                    </td>
                    <td className={`p-3 font-bold ${item.roi >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {item.roi >= 0 ? '+' : ''}
                      {item.roi.toFixed(2)}%
                    </td>
                    <td className="p-3 font-bold text-white">{item.volumeSold} Kg</td>
                    <td className="p-3 text-cyan-400 font-bold">{item.activeStockKg} Kg</td>
                    <td className="p-3 text-right font-mono text-slate-300">{item.closedTradesCount}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
