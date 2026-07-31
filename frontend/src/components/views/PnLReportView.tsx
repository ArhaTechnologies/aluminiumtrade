import React from 'react';
import { useApp } from '../../context/AppContext';
import { translations, formatINR, formatDate } from '../../lib/i18n';
import { LineChart, FileText, User as UserIcon } from 'lucide-react';

export const PnLReportView: React.FC = () => {
  const { language, sales, activeHoldings, selectedUserId, setSelectedUserId, users } = useApp();
  const t = translations[language];

  const filteredSales = selectedUserId === 'ALL' ? sales : sales.filter((s) => s.userId === selectedUserId);
  const filteredHoldings = selectedUserId === 'ALL' ? activeHoldings : activeHoldings.filter((h) => h.userId === selectedUserId);

  const totalRealizedPnL = filteredSales.reduce((acc, s) => acc + s.realizedPnL, 0);
  const totalUnrealizedPnL = filteredHoldings.reduce((acc, h) => acc + h.unrealizedPnL, 0);
  const netTotalPnL = totalRealizedPnL + totalUnrealizedPnL;

  const totalInvestedCapital = filteredHoldings.reduce((acc, h) => acc + h.totalCostBasis, 0);
  const totalROI = totalInvestedCapital > 0 ? (netTotalPnL / totalInvestedCapital) * 100 : 0;

  const selectedUserObj = users.find((u) => u.id === selectedUserId);

  return (
    <div className="p-3 sm:p-6 space-y-5 text-slate-100 max-w-7xl mx-auto">
      {/* Header Banner with Trader Filter */}
      <div className="bg-[#111827] border border-slate-800 p-4 sm:p-6 rounded-2xl shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <LineChart className="w-5 h-5 text-cyan-400 shrink-0" />
            <h2 className="text-lg sm:text-xl font-black text-white tracking-tight">
              Profit & Loss (P&L) Audit Analytics
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Detailed breakdown of closed trade gains, unrealized inventory yield, and ROI for {selectedUserObj ? selectedUserObj.fullName : 'All Traders'}.
          </p>
        </div>

        {/* Trader Filter Dropdown & Summary */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between md:justify-end gap-3 w-full md:w-auto pt-2 md:pt-0 border-t md:border-t-0 border-slate-800">
          <div className="flex items-center space-x-2 bg-slate-900 px-3 py-2 rounded-xl border border-slate-700 shadow-inner w-full sm:w-auto">
            <UserIcon className="w-4 h-4 text-cyan-400 shrink-0" />
            <select
              value={selectedUserId}
              onChange={(e) => setSelectedUserId(e.target.value)}
              className="bg-slate-900 text-xs font-bold text-white rounded-lg w-full focus:outline-none cursor-pointer"
            >
              <option value="ALL" className="bg-[#111827] text-white py-1">
                All Traders ({users.length})
              </option>
              {users.map((u) => (
                <option key={u.id} value={u.id} className="bg-[#111827] text-white py-1">
                  {u.fullName} ({u.id})
                </option>
              ))}
            </select>
          </div>

          <div className="sm:text-right sm:border-l sm:border-slate-800 sm:pl-4">
            <p className="text-[10px] text-slate-400 font-semibold uppercase">Net Combined Return</p>
            <p className={`text-xl sm:text-2xl font-black ${netTotalPnL >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {netTotalPnL >= 0 ? '+' : ''}{formatINR(netTotalPnL)}
            </p>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        <div className="bg-[#111827] border border-slate-800 p-4 sm:p-5 rounded-2xl shadow-lg">
          <span className="text-xs text-slate-400 font-semibold">Total Realized P&L</span>
          <h3 className={`text-xl sm:text-2xl font-black mt-1.5 ${totalRealizedPnL >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
            {totalRealizedPnL >= 0 ? '+' : ''}{formatINR(totalRealizedPnL)}
          </h3>
          <p className="text-[10px] text-slate-400 mt-1">Closed trades profit/loss</p>
        </div>

        <div className="bg-[#111827] border border-slate-800 p-4 sm:p-5 rounded-2xl shadow-lg">
          <span className="text-xs text-slate-400 font-semibold">Total Unrealized P&L</span>
          <h3 className={`text-xl sm:text-2xl font-black mt-1.5 ${totalUnrealizedPnL >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
            {totalUnrealizedPnL >= 0 ? '+' : ''}{formatINR(totalUnrealizedPnL)}
          </h3>
          <p className="text-[10px] text-slate-400 mt-1">Active inventory gain/loss</p>
        </div>

        <div className="bg-[#111827] border border-slate-800 p-4 sm:p-5 rounded-2xl shadow-lg">
          <span className="text-xs text-slate-400 font-semibold">Portfolio Return Rate (ROI)</span>
          <h3 className={`text-xl sm:text-2xl font-black mt-1.5 ${totalROI >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
            {totalROI >= 0 ? '+' : ''}{totalROI.toFixed(2)}%
          </h3>
          <p className="text-[10px] text-slate-400 mt-1">Percentage return on cost basis</p>
        </div>
      </div>

      {/* Audit Log Section */}
      <div className="bg-[#111827] border border-slate-800 p-4 sm:p-5 rounded-2xl shadow-xl space-y-4">
        <h3 className="text-sm font-bold text-white flex items-center space-x-2">
          <FileText className="w-4 h-4 text-cyan-400 shrink-0" />
          <span>
            {selectedUserObj
              ? `Lot Audit Breakdown for ${selectedUserObj.fullName}`
              : 'Lot-by-Lot Audit Breakdown (All Traders)'}
          </span>
        </h3>

        {/* Desktop Table View */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900 text-slate-400 font-bold uppercase text-[10px]">
              <tr>
                <th className="p-3 rounded-l-lg">Sell Ref</th>
                <th className="p-3">Trader</th>
                <th className="p-3">Date</th>
                <th className="p-3">Qty (Kg)</th>
                <th className="p-3">Cost Basis</th>
                <th className="p-3">Sale Proceeds</th>
                <th className="p-3">Realized P&L</th>
                <th className="p-3 text-right rounded-r-lg">ROI %</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {filteredSales.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-500">
                    No closed sales transactions found for this selection.
                  </td>
                </tr>
              ) : (
                filteredSales.map((s) => (
                  <tr key={s.sellId}>
                    <td className="p-3 font-mono text-emerald-400 font-bold">{s.sellId}</td>
                    <td className="p-3 font-semibold text-white">{users.find((u) => u.id === s.userId)?.fullName || s.userName}</td>
                    <td className="p-3 text-slate-400">{formatDate(s.sellDate)}</td>
                    <td className="p-3 font-bold text-white">{s.quantityKg} Kg</td>
                    <td className="p-3 text-slate-300">{formatINR(s.totalBuyAmount)}</td>
                    <td className="p-3 font-bold text-white">{formatINR(s.totalSellAmount)}</td>
                    <td className={`p-3 font-bold ${s.realizedPnL >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {s.realizedPnL >= 0 ? '+' : ''}{formatINR(s.realizedPnL)}
                    </td>
                    <td className={`p-3 text-right font-bold ${s.pnlPercentage >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {s.pnlPercentage >= 0 ? '+' : ''}{s.pnlPercentage.toFixed(2)}%
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards View */}
        <div className="space-y-3 md:hidden">
          {filteredSales.length === 0 ? (
            <div className="p-6 text-center text-slate-500 text-xs">No closed sales transactions found.</div>
          ) : (
            filteredSales.map((s) => {
              const isGain = s.realizedPnL >= 0;
              return (
                <div key={s.sellId} className="bg-slate-900 border border-slate-800 p-3.5 rounded-xl space-y-2.5 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-emerald-400 font-bold">{s.sellId}</span>
                    <span className={`text-[11px] font-black ${isGain ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {isGain ? '+' : ''}{formatINR(s.realizedPnL)} ({s.pnlPercentage.toFixed(1)}%)
                    </span>
                  </div>

                  <div className="flex justify-between items-baseline">
                    <div>
                      <h4 className="font-bold text-white">{users.find((u) => u.id === s.userId)?.fullName || s.userName}</h4>
                      <p className="text-[11px] text-slate-400">{formatDate(s.sellDate)}</p>
                    </div>
                    <div className="text-right">
                      <strong className="text-white font-black text-sm block">{formatINR(s.totalSellAmount)}</strong>
                      <span className="text-[11px] text-slate-400">{s.quantityKg} Kg @ ₹{s.sellPricePerKg}/kg</span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
                    <span>Cost Basis: {formatINR(s.totalBuyAmount)}</span>
                    <span className="font-mono text-slate-300">Lot: {s.purchaseId}</span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
