import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { translations, formatINR, formatDate } from '../../lib/i18n';
import { generatePdfReport } from '../../lib/pdfGenerator';
import { generateExcelReport } from '../../lib/excelGenerator';
import { openWhatsAppShare } from '../../lib/whatsapp';
import {
  FileText,
  Download,
  FileSpreadsheet,
  Calendar,
  Filter,
  TrendingUp,
  TrendingDown,
  Boxes,
  Send,
  MessageSquare,
  CheckCircle2,
  FileCode,
  Users,
  BarChart2,
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
  const [whatsappPhone, setWhatsappPhone] = useState<string>('');
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
      // User filter
      if (selectedUserId !== 'ALL' && p.userId !== selectedUserId) return false;
      // Date filter
      if (effectiveStart && effectiveEnd) {
        const pDate = new Date(p.purchaseDate);
        return pDate >= effectiveStart && pDate <= effectiveEnd;
      }
      return true;
    });
  }, [purchases, selectedUserId, effectiveStart, effectiveEnd]);

  const filteredSales = useMemo(() => {
    return sales.filter((s) => {
      // User filter
      if (selectedUserId !== 'ALL' && s.userId !== selectedUserId) return false;
      // Date filter
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

  // Summary Metrics for Filtered Date Range
  const metrics = useMemo(() => {
    const buyWeight = filteredPurchases.reduce((acc, p) => acc + p.quantityKg, 0);
    const buySpend = filteredPurchases.reduce((acc, p) => acc + p.totalAmount, 0);

    const sellWeight = filteredSales.reduce((acc, s) => acc + s.quantityKg, 0);
    const sellRevenue = filteredSales.reduce((acc, s) => acc + s.totalSellAmount, 0);
    const realizedPnL = filteredSales.reduce((acc, s) => acc + s.realizedPnL, 0);

    const holdingsWeight = filteredHoldings.reduce((acc, h) => acc + h.remainingQuantityKg, 0);
    const holdingsVal = filteredHoldings.reduce((acc, h) => acc + h.currentMarketValue, 0);

    return {
      buyWeight,
      buySpend,
      sellWeight,
      sellRevenue,
      realizedPnL,
      holdingsWeight,
      holdingsVal,
    };
  }, [filteredPurchases, filteredSales, filteredHoldings]);

  // Handlers for Exports
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
    showTempMsg(`Generated Custom Date Range PDF Statement (${filteredPurchases.length} buys, ${filteredSales.length} sales)`);
  };

  const handleExportExcel = () => {
    generateExcelReport({
      users: selectedUserId === 'ALL' ? users : users.filter((u) => u.id === selectedUserId),
      purchases: filteredPurchases,
      sales: filteredSales,
      holdings: filteredHoldings,
    });
    showTempMsg(`Exported Excel Workbook for Range (${rangeLabel})`);
  };

  const handleExportCsv = () => {
    const rows = [
      ...filteredPurchases.map((p) => ({
        Type: 'PURCHASE',
        ID: p.purchaseId,
        Trader: p.userName,
        Date: p.purchaseDate,
        Quantity_Kg: p.quantityKg,
        UnitPrice_INR: p.pricePerKg,
        TotalAmount_INR: p.totalAmount,
        RealizedPnL_INR: 0,
        Status: p.status,
      })),
      ...filteredSales.map((s) => ({
        Type: 'SALE',
        ID: s.sellId,
        Trader: s.userName,
        Date: s.sellDate,
        Quantity_Kg: s.quantityKg,
        UnitPrice_INR: s.sellPricePerKg,
        TotalAmount_INR: s.totalSellAmount,
        RealizedPnL_INR: s.realizedPnL,
        Status: 'CLOSED',
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

  const handleShareWhatsAppReport = () => {
    const userObj = users.find((u) => u.id === selectedUserId);
    const text = `📊 *ALUTRADE PRO — COMMODITY TRADE STATEMENT*
----------------------------------------
*Scope:* ${rangeLabel}
*Trader:* ${userObj ? userObj.fullName : 'All Platform Traders'}

*Purchases Summary:*
• Orders Executed: *${filteredPurchases.length} Buy Trades*
• Total Volume Purchased: *${metrics.buyWeight.toLocaleString('en-IN')} Kg*
• Total Amount Paid: *${formatINR(metrics.buySpend)}*

*Sales & Realized P&L:*
• Sales Closed: *${filteredSales.length} Sell Trades*
• Volume Sold: *${metrics.sellWeight.toLocaleString('en-IN')} Kg*
• Total Revenue: *${formatINR(metrics.sellRevenue)}*
• Net Realized Profit/Loss: *${metrics.realizedPnL >= 0 ? '🟢 +' : '🔴 '}${formatINR(metrics.realizedPnL)}*

*Unsold Stock Inventory:*
• Active Holdings: *${filteredHoldings.length} Lots* (${metrics.holdingsWeight.toLocaleString('en-IN')} Kg)
• Estimated Market Value: *${formatINR(metrics.holdingsVal)}*
----------------------------------------
_Current Aluminum Spot Rate: ₹${currentSpotPrice.pricePerKg.toFixed(2)}/kg_
_Generated via AluTrade PRO Platform_`;

    openWhatsAppShare(text, whatsappPhone);
    showTempMsg('Opening WhatsApp with pre-formatted audit statement...');
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
              Reports, Custom Exports & WhatsApp Hub
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Filter trading activity by custom date range, download PDF/Excel/CSV statements, or send instant WhatsApp receipts.
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
          {/* Presets dropdown/buttons */}
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

        {/* Filtered Range Performance Cards */}
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

      {/* WhatsApp Integration Module */}
      <div className="bg-[#111827] border border-emerald-500/30 p-6 rounded-2xl shadow-xl space-y-4">
        <div className="flex items-center space-x-3 border-b border-slate-800 pb-4">
          <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400">
            <MessageSquare className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white flex items-center space-x-2">
              <span>WhatsApp Trade & Invoice Sharing Engine</span>
              <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full font-mono uppercase">Live</span>
            </h3>
            <p className="text-xs text-slate-400">
              Instantly share trade receipts, custom date range audit slips, or daily spot rates directly with clients on WhatsApp.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-300">Recipient WhatsApp Phone Number (Optional)</label>
            <input
              type="text"
              value={whatsappPhone}
              onChange={(e) => setWhatsappPhone(e.target.value)}
              placeholder="e.g. +91 98765 43210 or leave blank to choose contact"
              className="w-full bg-slate-900 border border-slate-700 text-xs text-white rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-emerald-500 font-mono"
            />
            <p className="text-[11px] text-slate-500">
              Leave blank to open WhatsApp contact selector, or enter client phone number for direct chat delivery.
            </p>
          </div>

          <div className="flex flex-col justify-end space-y-2">
            <button
              onClick={handleShareWhatsAppReport}
              className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs px-5 py-3 rounded-xl transition-all shadow-lg flex items-center justify-center space-x-2"
            >
              <Send className="w-4 h-4" />
              <span>Share Range Statement on WhatsApp</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
