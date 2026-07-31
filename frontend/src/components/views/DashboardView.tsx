import React, { useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { translations, formatINR, formatDate } from '../../lib/i18n';
import { DateFilter } from '../../types';
import {
  IndianRupee,
  TrendingUp,
  TrendingDown,
  Boxes,
  PieChart as PieChartIcon,
  BarChart3,
  Calendar,
  Filter,
  ArrowUpRight,
  ArrowDownRight,
  ShoppingCart,
  Coins,
  Sparkles,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  Legend,
  ReferenceDot,
} from 'recharts';
import { motion } from 'motion/react';

export const DashboardView: React.FC = () => {
  const {
    language,
    selectedUserId,
    setSelectedUserId,
    users,
    purchases,
    sales,
    activeHoldings,
    currentSpotPrice,
    marketPriceHistory,
    dateFilter,
    setDateFilter,
    setActiveTab,
    setActiveProfileUserId,
  } = useApp();

  const t = translations[language];

  // Filter Purchases & Sales based on selected user & date range
  const filteredPurchases = useMemo(() => {
    let list = purchases;
    if (selectedUserId !== 'ALL') {
      list = list.filter((p) => p.userId === selectedUserId);
    }
    const now = new Date();
    if (dateFilter.type === 'TODAY') {
      const todayStr = now.toISOString().split('T')[0];
      list = list.filter((p) => p.purchaseDate.startsWith(todayStr));
    } else if (dateFilter.type === '7DAYS') {
      const past7 = new Date(now.getTime() - 7 * 86400000);
      list = list.filter((p) => new Date(p.purchaseDate) >= past7);
    } else if (dateFilter.type === '30DAYS') {
      const past30 = new Date(now.getTime() - 30 * 86400000);
      list = list.filter((p) => new Date(p.purchaseDate) >= past30);
    }
    return list;
  }, [purchases, selectedUserId, dateFilter]);

  const filteredSales = useMemo(() => {
    let list = sales;
    if (selectedUserId !== 'ALL') {
      list = list.filter((s) => s.userId === selectedUserId);
    }
    const now = new Date();
    if (dateFilter.type === 'TODAY') {
      const todayStr = now.toISOString().split('T')[0];
      list = list.filter((s) => s.sellDate.startsWith(todayStr));
    } else if (dateFilter.type === '7DAYS') {
      const past7 = new Date(now.getTime() - 7 * 86400000);
      list = list.filter((s) => new Date(s.sellDate) >= past7);
    } else if (dateFilter.type === '30DAYS') {
      const past30 = new Date(now.getTime() - 30 * 86400000);
      list = list.filter((s) => new Date(s.sellDate) >= past30);
    }
    return list;
  }, [sales, selectedUserId, dateFilter]);

  const filteredHoldings = useMemo(() => {
    let list = activeHoldings;
    if (selectedUserId !== 'ALL') {
      list = list.filter((h) => h.userId === selectedUserId);
    }
    return list;
  }, [activeHoldings, selectedUserId]);

  // Aggregate Key Metrics
  const totalInvestedCapital = useMemo(() => {
    return filteredHoldings.reduce((sum, h) => sum + h.totalCostBasis, 0);
  }, [filteredHoldings]);

  const totalMarketValue = useMemo(() => {
    return filteredHoldings.reduce((sum, h) => sum + h.currentMarketValue, 0);
  }, [filteredHoldings]);

  const totalUnrealizedPnL = useMemo(() => {
    return totalMarketValue - totalInvestedCapital;
  }, [totalMarketValue, totalInvestedCapital]);

  const totalRealizedPnL = useMemo(() => {
    return filteredSales.reduce((sum, s) => sum + s.realizedPnL, 0);
  }, [filteredSales]);

  const totalQuantityHeldKg = useMemo(() => {
    return filteredHoldings.reduce((sum, h) => sum + h.remainingQuantityKg, 0);
  }, [filteredHoldings]);

  const totalQuantitySoldKg = useMemo(() => {
    return filteredSales.reduce((sum, s) => sum + s.quantityKg, 0);
  }, [filteredSales]);

  const selectedUserObj = useMemo(() => {
    if (selectedUserId === 'ALL') return null;
    return users.find((u) => u.id === selectedUserId) || null;
  }, [users, selectedUserId]);

  // User Specific Equity Chart
  const userEquityChartData = useMemo(() => {
    return marketPriceHistory.map((point) => {
      const price = point.pricePerKg;
      const portfolioVal = totalQuantityHeldKg > 0 ? totalQuantityHeldKg * price : price * 100;
      return {
        timestamp: point.timestamp ? point.timestamp.substring(11, 16) : '',
        spotPrice: price,
        portfolioValuation: Math.round(portfolioVal),
      };
    });
  }, [marketPriceHistory, totalQuantityHeldKg]);

  // Capital Distribution Pie Chart Data
  const pieData = useMemo(() => {
    return [
      { name: 'Cost Basis', value: totalInvestedCapital, color: '#06B6D4' },
      { name: 'Unrealized Yield', value: Math.max(0, totalUnrealizedPnL), color: '#10B981' },
      { name: 'Realized Net Profit', value: Math.max(0, totalRealizedPnL), color: '#8B5CF6' },
    ];
  }, [totalInvestedCapital, totalUnrealizedPnL, totalRealizedPnL]);

  // Volume Bar Chart Data
  const volumeChartData = useMemo(() => {
    const buyKg = filteredPurchases.reduce((acc, p) => acc + p.quantityKg, 0);
    const sellKg = filteredSales.reduce((acc, s) => acc + s.quantityKg, 0);
    return [
      { name: 'Buy Volume', volume: buyKg, fill: '#06B6D4' },
      { name: 'Sell Volume', volume: sellKg, fill: '#10B981' },
    ];
  }, [filteredPurchases, filteredSales]);

  return (
    <div className="p-3 sm:p-6 space-y-5 text-slate-100 max-w-7xl mx-auto">
      {/* Top Welcome & Filters Header Banner */}
      <div className="bg-[#111827] border border-slate-800 p-4 sm:p-6 rounded-2xl shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h2 className="text-lg sm:text-xl font-extrabold tracking-tight text-white">
              {selectedUserObj ? `${selectedUserObj.fullName}'s Dashboard` : 'Platform Overview'}
            </h2>
            <span className="bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase shrink-0">
              Spot Engine
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Real-time aluminum market valuation, P&L audit ledger & portfolio metrics.
          </p>
        </div>

        {/* Filters Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 w-full md:w-auto">
          {/* User Filter Dropdown */}
          <div className="flex items-center space-x-2 bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 w-full sm:w-auto">
            <Filter className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
            <select
              value={selectedUserId}
              onChange={(e) => setSelectedUserId(e.target.value)}
              className="bg-slate-900 text-xs font-bold text-white focus:outline-none cursor-pointer w-full"
            >
              <option value="ALL" className="bg-[#111827] text-white py-1">
                {t.allUsers} ({users.length})
              </option>
              {users.map((u) => (
                <option key={u.id} value={u.id} className="bg-[#111827] text-white py-1">
                  {u.fullName} ({u.id})
                </option>
              ))}
            </select>
          </div>

          {/* Date Filter Range */}
          <div className="flex items-center space-x-1 bg-slate-900 border border-slate-800 rounded-xl p-1 overflow-x-auto max-w-full">
            {(['ALL', 'TODAY', '7DAYS', '30DAYS'] as DateFilter['type'][]).map((type) => {
              const isActive = dateFilter.type === type;
              const label =
                type === 'ALL'
                  ? t.allTime
                  : type === 'TODAY'
                  ? t.today
                  : type === '7DAYS'
                  ? t.last7Days
                  : t.last30Days;
              return (
                <button
                  key={type}
                  onClick={() => setDateFilter({ type })}
                  className={`text-[11px] font-semibold px-2.5 py-1 rounded-lg transition-all whitespace-nowrap cursor-pointer ${
                    isActive
                      ? 'bg-cyan-500 text-slate-950 shadow-md font-bold'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* 4 Primary KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* KPI 1: Invested Capital */}
        <motion.div
          whileHover={{ y: -3 }}
          className="bg-gradient-to-b from-[#1E293B]/80 to-[#111827] border border-slate-800 p-4 sm:p-5 rounded-2xl shadow-xl space-y-3 relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-24 h-24 bg-cyan-500/5 rounded-full blur-2xl pointer-events-none"></div>
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">{t.totalInvested}</span>
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center shrink-0">
              <IndianRupee className="w-4 h-4 text-cyan-400" />
            </div>
          </div>
          <div>
            <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              {formatINR(totalInvestedCapital)}
            </h3>
            <p className="text-[11px] text-slate-400 mt-1 flex items-center space-x-1">
              <span>Inventory:</span>
              <strong className="text-slate-200">{totalQuantityHeldKg} Kg Aluminum</strong>
            </p>
          </div>
        </motion.div>

        {/* KPI 2: Portfolio Market Value */}
        <motion.div
          whileHover={{ y: -3 }}
          className="bg-gradient-to-b from-[#1E293B]/80 to-[#111827] border border-slate-800 p-4 sm:p-5 rounded-2xl shadow-xl space-y-3 relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 rounded-full blur-2xl pointer-events-none"></div>
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">{t.currentValue}</span>
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shrink-0">
              <Boxes className="w-4 h-4 text-blue-400" />
            </div>
          </div>
          <div>
            <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              {formatINR(totalMarketValue)}
            </h3>
            <p className="text-[11px] text-slate-400 mt-1 flex items-center space-x-1">
              <span>Valued @</span>
              <strong className="text-cyan-400">₹{currentSpotPrice.pricePerKg}/kg</strong>
            </p>
          </div>
        </motion.div>

        {/* KPI 3: Realized P&L */}
        <motion.div
          whileHover={{ y: -3 }}
          className="bg-gradient-to-b from-[#1E293B]/80 to-[#111827] border border-slate-800 p-4 sm:p-5 rounded-2xl shadow-xl space-y-3 relative overflow-hidden"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">{t.realizedPnL}</span>
            <div
              className={`w-8 h-8 sm:w-9 sm:h-9 rounded-xl border flex items-center justify-center shrink-0 ${
                totalRealizedPnL >= 0
                  ? 'bg-emerald-500/10 border-emerald-500/20'
                  : 'bg-rose-500/10 border-rose-500/20'
              }`}
            >
              {totalRealizedPnL >= 0 ? (
                <ArrowUpRight className="w-4 h-4 text-emerald-400" />
              ) : (
                <ArrowDownRight className="w-4 h-4 text-rose-400" />
              )}
            </div>
          </div>
          <div>
            <h3
              className={`text-xl sm:text-2xl font-black tracking-tight ${
                totalRealizedPnL >= 0 ? 'text-emerald-400' : 'text-rose-400'
              }`}
            >
              {totalRealizedPnL >= 0 ? '+' : ''}
              {formatINR(totalRealizedPnL)}
            </h3>
            <p className="text-[11px] text-slate-400 mt-1">
              From <strong className="text-slate-200">{totalQuantitySoldKg} Kg</strong> sold in closed trades
            </p>
          </div>
        </motion.div>

        {/* KPI 4: Unrealized P&L */}
        <motion.div
          whileHover={{ y: -3 }}
          className="bg-gradient-to-b from-[#1E293B]/80 to-[#111827] border border-slate-800 p-4 sm:p-5 rounded-2xl shadow-xl space-y-3 relative overflow-hidden"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">{t.unrealizedPnL}</span>
            <div
              className={`w-8 h-8 sm:w-9 sm:h-9 rounded-xl border flex items-center justify-center shrink-0 ${
                totalUnrealizedPnL >= 0
                  ? 'bg-emerald-500/10 border-emerald-500/20'
                  : 'bg-rose-500/10 border-rose-500/20'
              }`}
            >
              <TrendingUp className={`w-4 h-4 ${totalUnrealizedPnL < 0 ? 'rotate-180 text-rose-400' : 'text-emerald-400'}`} />
            </div>
          </div>
          <div>
            <h3
              className={`text-xl sm:text-2xl font-black tracking-tight ${
                totalUnrealizedPnL >= 0 ? 'text-emerald-400' : 'text-rose-400'
              }`}
            >
              {totalUnrealizedPnL >= 0 ? '+' : ''}
              {formatINR(totalUnrealizedPnL)}
            </h3>
            <p className="text-[11px] text-slate-400 mt-1">
              Open position gain/loss on unsold stock
            </p>
          </div>
        </motion.div>
      </div>

      {/* Main Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Chart 1: Dynamic Trader Portfolio Valuation & Spot Price Chart */}
        <div className="lg:col-span-2 bg-[#111827]/90 border border-slate-800 p-4 sm:p-5 rounded-2xl shadow-xl space-y-4">
          <div className="flex items-center justify-between gap-2">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                <TrendingUp className="w-4 h-4 text-cyan-400 shrink-0" />
                <span>
                  {selectedUserObj
                    ? `${selectedUserObj.fullName}'s Portfolio Valuation`
                    : 'Platform Spot Price & Valuation'}
                </span>
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5">
                {selectedUserObj
                  ? `Real-time valuation curve for ${selectedUserObj.fullName}`
                  : 'Real-time spot rate fluctuation curve'}
              </p>
            </div>
            <span className="text-xs font-extrabold text-cyan-400 bg-cyan-500/10 px-2.5 py-1 rounded-lg border border-cyan-500/20 font-mono shrink-0">
              {selectedUserObj ? formatINR(totalMarketValue) : `₹${currentSpotPrice.pricePerKg}/kg`}
            </span>
          </div>

          <div className="h-56 sm:h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={userEquityChartData}>
                <defs>
                  <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#06B6D4" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#06B6D4" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="timestamp" stroke="#64748B" fontSize={10} tickLine={false} />
                <YAxis domain={['auto', 'auto']} stroke="#64748B" fontSize={10} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0B0F19',
                    borderColor: '#334155',
                    borderRadius: '12px',
                    color: '#F8FAFC',
                    fontSize: '12px',
                  }}
                  formatter={(val: any, name: any) => [
                    name === 'portfolioValuation' ? formatINR(val) : `₹${val}/kg`,
                    name === 'portfolioValuation' ? (selectedUserObj ? `${selectedUserObj.fullName} Portfolio` : 'Platform Equity') : 'Spot Rate'
                  ]}
                />
                <Area
                  type="monotone"
                  dataKey="portfolioValuation"
                  stroke="#06B6D4"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#priceGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Portfolio Allocation Pie Chart */}
        <div className="bg-[#111827]/90 border border-slate-800 p-4 sm:p-5 rounded-2xl shadow-xl space-y-4 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center space-x-2">
              <PieChartIcon className="w-4 h-4 text-purple-400 shrink-0" />
              <span>Capital & Profit Weightage</span>
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Breakdown of cost basis, unrealized gain & realized returns
            </p>
          </div>

          <div className="h-48 sm:h-52 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={70}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0B0F19',
                    borderColor: '#334155',
                    borderRadius: '12px',
                    color: '#F8FAFC',
                    fontSize: '12px',
                  }}
                  formatter={(val: any) => [formatINR(val), 'Amount']}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="space-y-1.5 pt-2 border-t border-slate-800 text-xs">
            {pieData.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between text-slate-300">
                <div className="flex items-center space-x-2">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }}></span>
                  <span className="text-[11px] font-medium">{item.name}</span>
                </div>
                <span className="font-bold text-white text-xs">{formatINR(item.value)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Chart 3 & Recent Activity Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Buy vs Sell Volume Bar Chart */}
        <div className="bg-[#111827]/90 border border-slate-800 p-4 sm:p-5 rounded-2xl shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center space-x-2">
              <BarChart3 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Volume Summary (Kg)</span>
            </h3>
            <span className="text-[11px] text-slate-400">Purchased vs Sold</span>
          </div>

          <div className="h-44 sm:h-48 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={volumeChartData}>
                <XAxis dataKey="name" stroke="#64748B" fontSize={10} tickLine={false} />
                <YAxis stroke="#64748B" fontSize={10} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0B0F19',
                    borderColor: '#334155',
                    borderRadius: '12px',
                    color: '#F8FAFC',
                    fontSize: '12px',
                  }}
                  formatter={(val: any) => [`${val} Kg`, 'Volume']}
                />
                <Bar dataKey="volume" radius={[6, 6, 0, 0]} barSize={28}>
                  {volumeChartData.map((entry, index) => (
                    <Cell key={`bar-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Executed Transactions Section */}
        <div className="lg:col-span-2 bg-[#111827]/90 border border-slate-800 p-4 sm:p-5 rounded-2xl shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center space-x-2">
              <ShoppingCart className="w-4 h-4 text-cyan-400 shrink-0" />
              <span>Recent Executed Transactions</span>
            </h3>
            <button
              onClick={() => setActiveTab('reports')}
              className="text-xs text-cyan-400 hover:underline font-semibold cursor-pointer"
            >
              View Full History →
            </button>
          </div>

          {/* Desktop Table View */}
          <div className="hidden sm:block overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900/80 text-slate-400 font-bold uppercase text-[10px]">
                <tr>
                  <th className="p-2.5 rounded-l-lg">Type</th>
                  <th className="p-2.5">Ref ID</th>
                  <th className="p-2.5">Trader</th>
                  <th className="p-2.5">Date</th>
                  <th className="p-2.5">Qty (Kg)</th>
                  <th className="p-2.5">Price/kg</th>
                  <th className="p-2.5 text-right rounded-r-lg">Total Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredPurchases.slice(0, 4).map((p) => (
                  <tr key={p.purchaseId} className="hover:bg-slate-800/40 transition-colors">
                    <td className="p-2.5">
                      <span className="bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 px-2 py-0.5 rounded font-bold text-[10px]">
                        BUY
                      </span>
                    </td>
                    <td className="p-2.5 font-mono text-slate-300">{p.purchaseId}</td>
                    <td className="p-2.5 font-medium text-white">{users.find((u) => u.id === p.userId)?.fullName || p.userName}</td>
                    <td className="p-2.5 text-slate-400">{formatDate(p.purchaseDate)}</td>
                    <td className="p-2.5 font-bold text-slate-200">{p.quantityKg} Kg</td>
                    <td className="p-2.5 text-slate-300">₹{p.pricePerKg}</td>
                    <td className="p-2.5 text-right font-bold text-cyan-400">
                      {formatINR(p.totalAmount)}
                    </td>
                  </tr>
                ))}
                {filteredSales.slice(0, 3).map((s) => (
                  <tr key={s.sellId} className="hover:bg-slate-800/40 transition-colors">
                    <td className="p-2.5">
                      <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded font-bold text-[10px]">
                        SELL
                      </span>
                    </td>
                    <td className="p-2.5 font-mono text-slate-300">{s.sellId}</td>
                    <td className="p-2.5 font-medium text-white">{users.find((u) => u.id === s.userId)?.fullName || s.userName}</td>
                    <td className="p-2.5 text-slate-400">{formatDate(s.sellDate)}</td>
                    <td className="p-2.5 font-bold text-slate-200">{s.quantityKg} Kg</td>
                    <td className="p-2.5 text-slate-300">₹{s.sellPricePerKg}</td>
                    <td className="p-2.5 text-right font-bold text-emerald-400">
                      +{formatINR(s.totalSellAmount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards View for Transactions */}
          <div className="space-y-2.5 sm:hidden">
            {filteredPurchases.slice(0, 3).map((p) => (
              <div key={p.purchaseId} className="bg-slate-900/90 border border-slate-800 p-3 rounded-xl space-y-1.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 px-2 py-0.5 rounded font-bold text-[10px]">
                    BUY ({p.purchaseId})
                  </span>
                  <span className="font-bold text-cyan-400">{formatINR(p.totalAmount)}</span>
                </div>
                <div className="flex justify-between items-baseline text-slate-300 text-[11px]">
                  <span>{users.find((u) => u.id === p.userId)?.fullName || p.userName}</span>
                  <span>{p.quantityKg} Kg @ ₹{p.pricePerKg}/kg</span>
                </div>
              </div>
            ))}
            {filteredSales.slice(0, 3).map((s) => (
              <div key={s.sellId} className="bg-slate-900/90 border border-slate-800 p-3 rounded-xl space-y-1.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded font-bold text-[10px]">
                    SELL ({s.sellId})
                  </span>
                  <span className="font-bold text-emerald-400">+{formatINR(s.totalSellAmount)}</span>
                </div>
                <div className="flex justify-between items-baseline text-slate-300 text-[11px]">
                  <span>{users.find((u) => u.id === s.userId)?.fullName || s.userName}</span>
                  <span>{s.quantityKg} Kg @ ₹{s.sellPricePerKg}/kg</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
