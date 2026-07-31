import React from 'react';
import { useApp } from '../../context/AppContext';
import { translations, formatINR, formatDate } from '../../lib/i18n';
import {
  User as UserIcon,
  ShieldCheck,
  Wallet,
  Boxes,
  TrendingUp,
  ShoppingCart,
  Coins,
  ArrowLeft,
} from 'lucide-react';

export const UserProfileView: React.FC = () => {
  const {
    language,
    users,
    activeProfileUserId,
    activeHoldings,
    purchases,
    sales,
    setSelectedUserId,
    setActiveTab,
  } = useApp();

  const t = translations[language];

  const user = users.find((u) => u.id === activeProfileUserId) || users[0];

  const userHoldings = activeHoldings.filter((h) => h.userId === user?.id);
  const userPurchases = purchases.filter((p) => p.userId === user?.id);
  const userSales = sales.filter((s) => s.userId === user?.id);

  const totalStockWorth = userHoldings.reduce((sum, h) => sum + h.currentMarketValue, 0);
  const totalRealizedPnL = userSales.reduce((sum, s) => sum + s.realizedPnL, 0);
  const totalInvestedInStock = userHoldings.reduce((sum, h) => sum + h.totalCostBasis, 0);
  const totalUnrealizedPnL = totalStockWorth - totalInvestedInStock;

  if (!user) {
    return (
      <div className="p-8 text-center text-slate-400">
        User profile not found.{' '}
        <button onClick={() => setActiveTab('users')} className="text-cyan-400 underline">
          Return to user list
        </button>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 space-y-6 text-slate-100 max-w-5xl mx-auto">
      {/* Top Navigation */}
      <button
        onClick={() => setActiveTab('users')}
        className="flex items-center space-x-2 text-xs font-bold text-slate-400 hover:text-white transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to User Directory</span>
      </button>

      {/* Main Personal Profile Card (Spec Section 2 / Feature 4 Layout) */}
      <div className="bg-gradient-to-r from-slate-900 via-[#111827] to-cyan-950 border border-slate-800 p-6 rounded-3xl shadow-2xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
          <div className="flex items-center space-x-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-cyan-500 to-blue-600 p-0.5 shadow-xl">
              <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center font-black text-cyan-300 text-xl">
                {user.fullName.charAt(0)}
              </div>
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-2xl font-black text-white">{user.fullName}</h2>
                <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center space-x-1">
                  <ShieldCheck className="w-3 h-3" />
                  <span>Verified Trader</span>
                </span>
              </div>
              <p className="text-xs font-mono text-slate-400 mt-0.5">
                ID: {user.id} | DOB: {user.dob} | KYC: {user.kycId}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => {
                setSelectedUserId(user.id);
                setActiveTab('buy');
              }}
              className="bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs px-3.5 py-2 rounded-xl flex items-center space-x-1.5 transition-all shadow-md"
            >
              <ShoppingCart className="w-3.5 h-3.5" />
              <span>Buy Stock</span>
            </button>

            <button
              onClick={() => {
                setSelectedUserId(user.id);
                setActiveTab('sell');
              }}
              className="bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-slate-700 font-bold text-xs px-3.5 py-2 rounded-xl flex items-center space-x-1.5 transition-all"
            >
              <Coins className="w-3.5 h-3.5" />
              <span>Sell Stock</span>
            </button>
          </div>
        </div>

        {/* 4 Summary Metric Boxes */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
          <div className="bg-slate-900/80 p-4 rounded-2xl border border-slate-800">
            <span className="text-slate-400 text-[11px] font-semibold block">Wallet Cash Balance</span>
            <strong className="text-lg font-black text-white block mt-1">
              {formatINR(user.walletBalance)}
            </strong>
          </div>

          <div className="bg-slate-900/80 p-4 rounded-2xl border border-slate-800">
            <span className="text-slate-400 text-[11px] font-semibold block">Active Holdings</span>
            <strong className="text-lg font-black text-cyan-400 block mt-1">
              {formatINR(totalStockWorth)}
            </strong>
            <span className="text-[10px] text-slate-500">{userHoldings.length} Unsold Lots</span>
          </div>

          <div className="bg-slate-900/80 p-4 rounded-2xl border border-slate-800">
            <span className="text-slate-400 text-[11px] font-semibold block">Realized Net Profit</span>
            <strong
              className={`text-lg font-black block mt-1 ${
                totalRealizedPnL >= 0 ? 'text-emerald-400' : 'text-rose-400'
              }`}
            >
              {totalRealizedPnL >= 0 ? '+' : ''}
              {formatINR(totalRealizedPnL)}
            </strong>
            <span className="text-[10px] text-slate-500">{userSales.length} Closed Trades</span>
          </div>

          <div className="bg-slate-900/80 p-4 rounded-2xl border border-slate-800">
            <span className="text-slate-400 text-[11px] font-semibold block">Unrealized P&L</span>
            <strong
              className={`text-lg font-black block mt-1 ${
                totalUnrealizedPnL >= 0 ? 'text-emerald-400' : 'text-rose-400'
              }`}
            >
              {totalUnrealizedPnL >= 0 ? '+' : ''}
              {formatINR(totalUnrealizedPnL)}
            </strong>
            <span className="text-[10px] text-slate-500">Open Position Return</span>
          </div>
        </div>

        {/* Contact Info Footer */}
        <div className="flex flex-wrap items-center justify-between text-xs text-slate-400 border-t border-slate-800/80 pt-3">
          <span>📧 Email: <strong className="text-slate-200">{user.email}</strong></span>
          <span>📱 Phone: <strong className="text-slate-200">{user.phone}</strong></span>
          <span>📅 Registered: <strong className="text-slate-200">{formatDate(user.createdAt)}</strong></span>
        </div>
      </div>

      {/* Active Holdings Table */}
      <div className="bg-[#111827] border border-slate-800 p-5 rounded-2xl shadow-xl space-y-4">
        <h3 className="text-sm font-bold text-white flex items-center space-x-2">
          <Boxes className="w-4 h-4 text-cyan-400" />
          <span>Active Inventory Lots for {user.fullName}</span>
        </h3>

        {userHoldings.length === 0 ? (
          <p className="text-xs text-slate-500 py-4 text-center">No active unsold stock inventory for this user.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900 text-slate-400 font-bold uppercase text-[10px]">
                <tr>
                  <th className="p-2.5">Lot Ref</th>
                  <th className="p-2.5">Date</th>
                  <th className="p-2.5">Stock</th>
                  <th className="p-2.5">Buy Price</th>
                  <th className="p-2.5">Cost Basis</th>
                  <th className="p-2.5">Market Value</th>
                  <th className="p-2.5 text-right">Unrealized P&L</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {userHoldings.map((h) => (
                  <tr key={h.purchaseId}>
                    <td className="p-2.5 font-mono text-cyan-400">{h.purchaseId}</td>
                    <td className="p-2.5 text-slate-400">{formatDate(h.purchaseDate)}</td>
                    <td className="p-2.5 font-bold text-white">{h.remainingQuantityKg} Kg</td>
                    <td className="p-2.5 text-slate-300">₹{h.buyPricePerKg}</td>
                    <td className="p-2.5 text-slate-300">{formatINR(h.totalCostBasis)}</td>
                    <td className="p-2.5 font-bold text-white">{formatINR(h.currentMarketValue)}</td>
                    <td className={`p-2.5 text-right font-bold ${h.unrealizedPnL >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {h.unrealizedPnL >= 0 ? '+' : ''}{formatINR(h.unrealizedPnL)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
