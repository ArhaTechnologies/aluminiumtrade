import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { translations, formatINR } from '../../lib/i18n';
import { generatePdfReport } from '../../lib/pdfGenerator';
import { generateExcelReport } from '../../lib/excelGenerator';
import {
  FileText,
  Download,
  FileSpreadsheet,
  Filter,
  TrendingUp,
  Boxes,
  CheckCircle2,
  FileCode,
} from 'lucide-react';
import * as XLSX from 'xlsx';

export const ReportsExportView: React.FC = () => {
  const {
    language,
    users,
    selectedUserId,
    setSelectedUserId,
    purchases,
    sales,
    activeHoldings,
    currentSpotPrice,
  } = useApp();

  const t = translations[language];

  // Custom Date Range States
  const [datePreset, setDatePreset] = useState<'ALL' | 'TODAY' | '7DAYS' | '30DAYS' | 'MONTH' | 'CUSTOM'>('ALL');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  // Compute Date Bounds based on preset
  const { effectiveStart, effectiveEnd, rangeLabel } = useMemo(() => {
    const now = new Date();
    let start: Date | null = null;
    let end: Date | null = null;
    let label = 'Complete All-Time History';

    if (datePreset === 'TODAY') {
      start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
      end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
      label = `Today (${start.toLocaleDateString('en-IN')})`;
    } else if (datePreset === '7DAYS') {
      start = new Date(now.getTime() - 7 * 86400000);
      end = now;
      label = `Last 7 Days (${start.toLocaleDateString('en-IN')} - ${end.toLocaleDateString('en-IN')})`;
    } else if (datePreset === '30DAYS') {
      start = new Date(now.getTime() - 30 * 86400000);
      end = now;
      label = `Last 30 Days (${start.toLocaleDateString('en-IN')} - ${end.toLocaleDateString('en-IN')})`;
    } else if (datePreset === 'MONTH') {
      start = new Date(now.getFullYear(), now.getMonth(), 1);
      end = now;
      label = `This Month (${start.toLocaleDateString('en-IN')} - ${end.toLocaleDateString('en-IN')})`;
    } else if (datePreset === 'CUSTOM' && startDate && endDate) {
      start = new Date(startDate + 'T00:00:00');
      end = new Date(endDate + 'T23:59:59');
      label = `Custom Range (${startDate} to ${endDate})`;
    }

    return { effectiveStart: start, effectiveEnd: end, rangeLabel: label };
  }, [datePreset, startDate, endDate]);

  // Filter Purchases & Sales based on Date Range & User Selection
  const filteredPurchases = useMemo(() => {
    return purchases.filter((p) => {
      if (selectedUserId !== 'ALL' && p.userId !== selectedUserId) return false;
      if (effectiveStart && effectiveEnd) {
        const pDate = new Date(p.purchaseDate);
        return pDate >= effectiveStart && pDate <= effectiveEnd;
      }
      return true;
    });
  }, [purchases, selectedUserId, effectiveStart, effectiveEnd]);

  const filteredSales = useMemo(() => {
    return sales.filter((s) => {
      if (selectedUserId !== 'ALL' && s.userId !== selectedUserId) return false;
      if (effectiveStart && effectiveEnd) {
        const sDate = new Date(s.sellDate);
        return sDate >= effectiveStart && sDate <= effectiveEnd;
      }
      return true;
    });
  }, [sales, selectedUserId, effectiveStart, effectiveEnd]);

  const filteredHoldings = useMemo(() => {
    return activeHoldings.filter((h) => (selectedUserId === 'ALL' ? true : h.userId === selectedUserId));
  }, [activeHoldings, selectedUserId]);

  // Key Aggregated Metrics for filtered view
  const metrics = useMemo(() => {
    const buySpend = filteredPurchases.reduce((sum, p) => sum + p.totalAmount, 0);
    const buyWeight = filteredPurchases.reduce((sum, p) => sum + p.quantityKg, 0);
    const sellRevenue = filteredSales.reduce((sum, s) => sum + s.totalSellAmount, 0);
    const sellWeight = filteredSales.reduce((sum, s) => sum + s.quantityKg, 0);
    const realizedPnL = filteredSales.reduce((sum, s) => sum + s.realizedPnL, 0);
    const holdingsWeight = filteredHoldings.reduce((sum, h) => sum + h.remainingQuantityKg, 0);
    const holdingsVal = filteredHoldings.reduce((sum, h) => sum + h.currentMarketValue, 0);

    return { buySpend, buyWeight, sellRevenue, sellWeight, realizedPnL, holdingsWeight, holdingsVal };
  }, [filteredPurchases, filteredSales, filteredHoldings]);

  const handleExportPdf = () => {
    const userObj = users.find((u) => u.id === selectedUserId) || null;
    generatePdfReport({
      user: userObj,
      purchases: filteredPurchases,
      sales: filteredSales,
      holdings: filteredHoldings,
      currentSpotPrice,
      dateFilterLabel: rangeLabel,
    });
    showTempMsg(`PDF Statement generated for ${rangeLabel}!`);
  };

  const handleExportExcel = () => {
    generateExcelReport({
      users,
      purchases: filteredPurchases,
      sales: filteredSales,
      holdings: filteredHoldings,
    });
    showTempMsg(`Excel Workbook downloaded for ${rangeLabel}!`);
  };

  const handleExportCsv = () => {
    const rows = [
      ...filteredPurchases.map((p) => ({
        Type: 'PURCHASE',
        RefID: p.purchaseId,
        Trader: p.userName,
        Date: p.purchaseDate,
        QuantityKg: p.quantityKg,
        PricePerKg: p.pricePerKg,
        Subtotal: p.subtotal,
        GST_18Percent: p.taxAmount,
        TotalAmount: p.totalAmount,
        Note: p.note || '',
      })),
      ...filteredSales.map((s) => ({
        Type: 'SALE',
        RefID: s.sellId,
        Trader: s.userName,
        Date: s.sellDate,
        QuantityKg: s.quantityKg,
        PricePerKg: s.sellPricePerKg,
        TotalCost: s.totalBuyAmount,
        TotalRevenue: s.totalSellAmount,
        RealizedPnL: s.realizedPnL,
        Note: s.note || '',
      })),
    ];

    if (rows.length === 0) {
      alert('No records match the selected date range.');
      return;
    }

    const sheet = XLSX.utils.json_to_sheet(rows);
    const csvContent = XLSX.utils.sheet_to_csv(sheet);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', `AluTrade_Export_${datePreset}_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showTempMsg('CSV dataset downloaded successfully!');
  };

  const showTempMsg = (msg: string) => {
    setStatusMsg(msg);
    setTimeout(() => setStatusMsg(null), 4000);
  };

  return (
    <div className="p-4 sm:p-6 space-y-6 text-slate-100 max-w-5xl mx-auto">
      {/* Header Banner */}
      <div className="bg-[#111827] border border-slate-800 p-6 rounded-2xl shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <FileText className="w-5 h-5 text-cyan-400" />
            <h2 className="text-xl font-black text-white tracking-tight">
              Reports & Custom Exports Hub
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Filter trading activity by custom date range, download PDF/Excel/CSV statements cleanly.
          </p>
        </div>
      </div>

      {statusMsg && (
        <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 p-3 rounded-xl text-xs flex items-center space-x-2 animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{statusMsg}</span>
        </div>
      )}

      {/* Custom Date Range Filter Bar */}
      <div className="bg-[#111827] border border-slate-800 p-6 rounded-2xl shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center space-x-2">
            <Filter className="w-4 h-4 text-cyan-400" />
            <h3 className="text-sm font-bold text-white">Custom Date Range & Trader Scope</h3>
          </div>
          <span className="text-xs text-cyan-400 font-mono font-bold bg-cyan-500/10 border border-cyan-500/20 px-3 py-1 rounded-full">
            {rangeLabel}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          {/* Presets dropdown */}
          <div className="space-y-1">
            <label className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">Date Quick Filter</label>
            <select
              value={datePreset}
              onChange={(e: any) => setDatePreset(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 text-xs text-white rounded-xl px-3 py-2.5 focus:outline-none focus:border-cyan-500 font-semibold"
            >
              <option value="ALL">All Time History</option>
              <option value="TODAY">Today Only</option>
              <option value="7DAYS">Last 7 Days</option>
              <option value="30DAYS">Last 30 Days</option>
              <option value="MONTH">This Current Month</option>
              <option value="CUSTOM">Custom Date Range (Pick Dates)</option>
            </select>
          </div>

          {/* Trader Filter */}
          <div className="space-y-1">
            <label className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">Select Trader</label>
            <select
              value={selectedUserId}
              onChange={(e) => setSelectedUserId(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 text-xs text-white rounded-xl px-3 py-2.5 focus:outline-none focus:border-cyan-500 font-semibold"
            >
              <option value="ALL">All Platform Traders</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.fullName} ({u.id})
                </option>
              ))}
            </select>
          </div>

          {/* Custom Start Date */}
          <div className="space-y-1">
            <label className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">Start Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                setDatePreset('CUSTOM');
              }}
              className="w-full bg-slate-900 border border-slate-700 text-xs text-white rounded-xl px-3 py-2 focus:outline-none focus:border-cyan-500 font-mono"
            />
          </div>

          {/* Custom End Date */}
          <div className="space-y-1">
            <label className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">End Date</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value);
                setDatePreset('CUSTOM');
              }}
              className="w-full bg-slate-900 border border-slate-700 text-xs text-white rounded-xl px-3 py-2 focus:outline-none focus:border-cyan-500 font-mono"
            />
          </div>
        </div>

        {/* Range Statistics Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-2">
          <div className="bg-slate-900/80 border border-slate-800 p-3 rounded-xl space-y-1">
            <div className="text-[10px] text-slate-400 uppercase font-bold flex items-center justify-between">
              <span>Total Purchases</span>
              <span className="text-cyan-400">{filteredPurchases.length} buys</span>
            </div>
            <div className="text-sm font-black text-white">{formatINR(metrics.buySpend)}</div>
            <div className="text-[11px] text-slate-400">{metrics.buyWeight.toLocaleString('en-IN')} Kg bought</div>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 p-3 rounded-xl space-y-1">
            <div className="text-[10px] text-slate-400 uppercase font-bold flex items-center justify-between">
              <span>Total Sales Revenue</span>
              <span className="text-emerald-400">{filteredSales.length} sales</span>
            </div>
            <div className="text-sm font-black text-white">{formatINR(metrics.sellRevenue)}</div>
            <div className="text-[11px] text-slate-400">{metrics.sellWeight.toLocaleString('en-IN')} Kg sold</div>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 p-3 rounded-xl space-y-1">
            <div className="text-[10px] text-slate-400 uppercase font-bold flex items-center justify-between">
              <span>Realized Net P&L</span>
              <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
            </div>
            <div className={`text-sm font-black ${metrics.realizedPnL >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {metrics.realizedPnL >= 0 ? '+' : ''}{formatINR(metrics.realizedPnL)}
            </div>
            <div className="text-[11px] text-slate-400">Closed trade margins</div>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 p-3 rounded-xl space-y-1">
            <div className="text-[10px] text-slate-400 uppercase font-bold flex items-center justify-between">
              <span>Active Stock Lots</span>
              <Boxes className="w-3.5 h-3.5 text-purple-400" />
            </div>
            <div className="text-sm font-black text-white">{formatINR(metrics.holdingsVal)}</div>
            <div className="text-[11px] text-slate-400">{metrics.holdingsWeight.toLocaleString('en-IN')} Kg inventory</div>
          </div>
        </div>
      </div>

      {/* Export Options Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* PDF Export Box */}
        <div className="bg-[#111827] border border-slate-800 p-6 rounded-2xl shadow-xl space-y-4 flex flex-col justify-between hover:border-cyan-500/40 transition-all">
          <div className="space-y-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
              <FileText className="w-5 h-5 text-cyan-400" />
            </div>
            <h3 className="text-sm font-bold text-white">Custom Range PDF Statement</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Generates a formatted, branded PDF document strictly containing transactions within <span className="text-cyan-400 font-semibold">{rangeLabel}</span>.
            </p>
          </div>

          <button
            onClick={handleExportPdf}
            className="w-full bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-xs py-3 rounded-xl transition-all shadow-md flex items-center justify-center space-x-2"
          >
            <Download className="w-4 h-4" />
            <span>Download Range PDF</span>
          </button>
        </div>

        {/* Excel Export Box */}
        <div className="bg-[#111827] border border-slate-800 p-6 rounded-2xl shadow-xl space-y-4 flex flex-col justify-between hover:border-emerald-500/40 transition-all">
          <div className="space-y-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
              <FileSpreadsheet className="w-5 h-5 text-emerald-400" />
            </div>
            <h3 className="text-sm font-bold text-white">Custom Range Excel (.xlsx)</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Exports raw multi-sheet Excel workbook filtered by date bounds with separate tabs for Purchases, Sales, and Holdings.
            </p>
          </div>

          <button
            onClick={handleExportExcel}
            className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs py-3 rounded-xl transition-all shadow-md flex items-center justify-center space-x-2"
          >
            <Download className="w-4 h-4" />
            <span>Download Range Excel</span>
          </button>
        </div>

        {/* CSV Export Box */}
        <div className="bg-[#111827] border border-slate-800 p-6 rounded-2xl shadow-xl space-y-4 flex flex-col justify-between hover:border-amber-500/40 transition-all">
          <div className="space-y-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
              <FileCode className="w-5 h-5 text-amber-400" />
            </div>
            <h3 className="text-sm font-bold text-white">Download Filtered CSV</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Export simple CSV dataset for accounting software (Tally, Zoho Books, QuickBooks) matching date parameters.
            </p>
          </div>

          <button
            onClick={handleExportCsv}
            className="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs py-3 rounded-xl transition-all shadow-md flex items-center justify-center space-x-2"
          >
            <Download className="w-4 h-4" />
            <span>Download Range CSV</span>
          </button>
        </div>
      </div>
    </div>
  );
};
