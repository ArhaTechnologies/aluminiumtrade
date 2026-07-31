import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { translations, formatINR, formatDate } from '../../lib/i18n';
import {
  FileSpreadsheet,
  ShoppingCart,
  Coins,
  Clock,
  Download,
  Printer,
  FileText,
  Search,
  RotateCcw,
  MessageSquare,
} from 'lucide-react';
import { generatePdfReport } from '../../lib/pdfGenerator';
import { generateExcelReport } from '../../lib/excelGenerator';
import { sharePurchaseWhatsApp, shareSaleWhatsApp } from '../../lib/whatsapp';

export const LedgerView: React.FC = () => {
  const {
    language,
    purchases,
    sales,
    activeHoldings,
    users,
    selectedUserId,
    setSelectedUserId,
    currentSpotPrice,
    lastTransaction,
    undoLastTrade,
  } = useApp();

  const t = translations[language];

  const [activeLedgerTab, setActiveLedgerTab] = useState<'PURCHASES' | 'SALES'>('PURCHASES');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [undoStatus, setUndoStatus] = useState<string | null>(null);

  const filteredPurchases = purchases
    .filter((p) => (selectedUserId === 'ALL' ? true : p.userId === selectedUserId))
    .filter((p) =>
      searchTerm
        ? p.purchaseId.toLowerCase().includes(searchTerm.toLowerCase()) ||
          p.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (p.note && p.note.toLowerCase().includes(searchTerm.toLowerCase()))
        : true
    );

  const filteredSales = sales
    .filter((s) => (selectedUserId === 'ALL' ? true : s.userId === selectedUserId))
    .filter((s) =>
      searchTerm
        ? s.sellId.toLowerCase().includes(searchTerm.toLowerCase()) ||
          s.purchaseId.toLowerCase().includes(searchTerm.toLowerCase()) ||
          s.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (s.note && s.note.toLowerCase().includes(searchTerm.toLowerCase()))
        : true
    );

  const handleUndo = () => {
    const res = undoLastTrade();
    setUndoStatus(res.message);
    setTimeout(() => setUndoStatus(null), 4000);
  };

  const handleExportPdf = () => {
    const userObj = users.find((u) => u.id === selectedUserId) || null;
    generatePdfReport({
      user: userObj,
      purchases: filteredPurchases,
      sales: filteredSales,
      holdings: activeHoldings,
      currentSpotPrice,
      dateFilterLabel: 'All Filtered Transactions',
    });
  };

  const handleExportExcel = () => {
    generateExcelReport({
      users,
      purchases: filteredPurchases,
      sales: filteredSales,
      holdings: activeHoldings,
    });
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="p-3 sm:p-6 space-y-5 text-slate-100 max-w-7xl mx-auto print:p-0 print:bg-white print:text-black">
      {/* Dedicated Print Header */}
      <div className="hidden print:block mb-4 pb-3 border-b-2 border-slate-900 text-black">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-xl font-black tracking-tight text-slate-900">ALUTRADE PRO — OFFICIAL TRADE LEDGER AUDIT</h1>
            <p className="text-xs text-slate-600">Physical Aluminum Trading & Portfolio Analytics Engine</p>
          </div>
          <div className="text-right text-xs text-slate-800">
            <p><strong>Date:</strong> {new Date().toLocaleDateString('en-IN')}</p>
            <p><strong>Spot Rate:</strong> ₹{currentSpotPrice.pricePerKg}/kg</p>
          </div>
        </div>
      </div>

      {/* Header Banner */}
      <div className="bg-[#111827] border border-slate-800 p-4 sm:p-6 rounded-2xl shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4 print:hidden">
        <div>
          <div className="flex items-center space-x-2">
            <FileSpreadsheet className="w-5 h-5 text-cyan-400 shrink-0" />
            <h2 className="text-lg sm:text-xl font-black text-white tracking-tight">
              Commodity Trade Ledger & Audit
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Official immutable audit trail for aluminum purchases, sales, tax liabilities, and P&L records.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleExportPdf}
            className="flex-1 sm:flex-none bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/40 text-cyan-300 font-bold text-xs px-3 py-2 rounded-xl flex items-center justify-center space-x-1.5 transition-all"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>PDF Statement</span>
          </button>

          <button
            onClick={handleExportExcel}
            className="flex-1 sm:flex-none bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-300 font-bold text-xs px-3 py-2 rounded-xl flex items-center justify-center space-x-1.5 transition-all"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Excel (.xlsx)</span>
          </button>

          <button
            onClick={handlePrint}
            className="flex-1 sm:flex-none bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-bold text-xs px-3 py-2 rounded-xl flex items-center justify-center space-x-1.5 transition-all"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print</span>
          </button>
        </div>
      </div>

      {undoStatus && (
        <div className="bg-amber-500/10 border border-amber-500/40 text-amber-300 text-xs px-4 py-3 rounded-xl flex items-center space-x-2 print:hidden">
          <RotateCcw className="w-4 h-4 text-amber-400 shrink-0" />
          <span>{undoStatus}</span>
        </div>
      )}

      {/* Undo Last Trade Alert Bar */}
      {lastTransaction && Date.now() - lastTransaction.timestamp < 300000 && (
        <div className="bg-amber-500/10 border border-amber-500/30 p-3 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs print:hidden">
          <div className="flex items-center space-x-2 text-amber-300">
            <Clock className="w-4 h-4 text-amber-400 animate-spin-slow shrink-0" />
            <span>
              Recent Trade ({lastTransaction.type} - Ref {lastTransaction.purchaseId || lastTransaction.sellId}) recorded.
            </span>
          </div>
          <button
            onClick={handleUndo}
            className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs px-3 py-1 rounded-lg transition-all self-end sm:self-auto"
          >
            Undo Last Trade
          </button>
        </div>
      )}

      {/* Main Ledger Box */}
      <div className="bg-[#111827] border border-slate-800 p-4 sm:p-5 rounded-2xl shadow-xl space-y-4 print:border-none print:shadow-none print:p-0">
        {/* Sub-tabs & Search Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 print:hidden">
          <div className="flex items-center space-x-1 bg-slate-900 p-1 rounded-xl border border-slate-800 overflow-x-auto">
            <button
              onClick={() => setActiveLedgerTab('PURCHASES')}
              className={`text-xs font-bold px-3 sm:px-4 py-2 rounded-lg flex items-center space-x-1.5 whitespace-nowrap transition-all ${
                activeLedgerTab === 'PURCHASES'
                  ? 'bg-cyan-500 text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <ShoppingCart className="w-3.5 h-3.5" />
              <span>Purchases ({filteredPurchases.length})</span>
            </button>

            <button
              onClick={() => setActiveLedgerTab('SALES')}
              className={`text-xs font-bold px-3 sm:px-4 py-2 rounded-lg flex items-center space-x-1.5 whitespace-nowrap transition-all ${
                activeLedgerTab === 'SALES'
                  ? 'bg-emerald-500 text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Coins className="w-3.5 h-3.5" />
              <span>Sales & P&L ({filteredSales.length})</span>
            </button>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <div className="relative flex-1 sm:w-64">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search ID, name or note..."
                className="w-full bg-slate-900 border border-slate-700 text-white text-xs pl-8 pr-3 py-2 rounded-xl focus:outline-none focus:border-cyan-500"
              />
            </div>

            <select
              value={selectedUserId}
              onChange={(e) => setSelectedUserId(e.target.value)}
              className="bg-slate-900 border border-slate-700 text-xs font-bold text-white rounded-xl px-3 py-2 focus:outline-none focus:border-cyan-500 cursor-pointer"
            >
              <option value="ALL" className="bg-[#111827] text-white py-1">{t.allUsers}</option>
              {users.map((u) => (
                <option key={u.id} value={u.id} className="bg-[#111827] text-white py-1">
                  {u.fullName}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Tab 1: Purchases Ledger */}
        {activeLedgerTab === 'PURCHASES' && (
          <>
            {/* Desktop Table View */}
            <div className="hidden md:block print:block overflow-x-auto">
              <table className="w-full text-left text-xs printable-table">
                <thead className="bg-slate-900 text-slate-400 font-bold uppercase text-[10px]">
                  <tr>
                    <th className="p-3 rounded-l-lg">Buy Ref</th>
                    <th className="p-3">Trader Name</th>
                    <th className="p-3">Purchase Date</th>
                    <th className="p-3">Qty (Kg)</th>
                    <th className="p-3">Price/kg</th>
                    <th className="p-3">Subtotal</th>
                    <th className="p-3">GST (18%)</th>
                    <th className="p-3">Total Amount</th>
                    <th className="p-3">Status</th>
                    <th className="p-3">Remark / Note</th>
                    <th className="p-3 rounded-r-lg text-right">Share</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {filteredPurchases.length === 0 ? (
                    <tr>
                      <td colSpan={11} className="p-8 text-center text-slate-500">
                        No purchase records found.
                      </td>
                    </tr>
                  ) : (
                    filteredPurchases.map((p) => (
                      <tr key={p.purchaseId} className="hover:bg-slate-800/40 transition-colors">
                        <td className="p-3 font-mono text-cyan-400 font-bold">{p.purchaseId}</td>
                        <td className="p-3 font-semibold text-white">{users.find((u) => u.id === p.userId)?.fullName || p.userName}</td>
                        <td className="p-3 text-slate-400">{formatDate(p.purchaseDate)}</td>
                        <td className="p-3 font-bold text-white">{p.quantityKg} Kg</td>
                        <td className="p-3 text-slate-300">₹{p.pricePerKg}</td>
                        <td className="p-3 text-slate-300">{formatINR(p.subtotal)}</td>
                        <td className="p-3 text-slate-400">{formatINR(p.taxAmount)}</td>
                        <td className="p-3 font-bold text-cyan-400">{formatINR(p.totalAmount)}</td>
                        <td className="p-3">
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                              p.status === 'COMPLETED'
                                ? 'bg-blue-500/20 text-blue-300 border-blue-500/30'
                                : p.status === 'PARTIALLY_SOLD'
                                ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                                : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                            }`}
                          >
                            {p.status}
                          </span>
                        </td>
                        <td className="p-3 text-slate-400 italic text-[11px] max-w-xs truncate">
                          {p.note || '-'}
                        </td>
                        <td className="p-3 text-right">
                          <button
                            onClick={() => sharePurchaseWhatsApp(p)}
                            title="Share Invoice on WhatsApp"
                            className="bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 p-1.5 rounded-lg transition-all"
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards View */}
            <div className="space-y-3 md:hidden print:hidden">
              {filteredPurchases.length === 0 ? (
                <div className="p-8 text-center text-slate-500 text-xs">No purchase records found.</div>
              ) : (
                filteredPurchases.map((p) => (
                  <div key={p.purchaseId} className="bg-slate-900 border border-slate-800 p-3.5 rounded-xl space-y-2.5 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-cyan-400 font-bold">{p.purchaseId}</span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                          p.status === 'COMPLETED'
                            ? 'bg-blue-500/20 text-blue-300 border-blue-500/30'
                            : p.status === 'PARTIALLY_SOLD'
                            ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                            : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                        }`}
                      >
                        {p.status}
                      </span>
                    </div>

                    <div className="flex justify-between items-baseline">
                      <div>
                        <h4 className="font-bold text-white">{users.find((u) => u.id === p.userId)?.fullName || p.userName}</h4>
                        <p className="text-[11px] text-slate-400">{formatDate(p.purchaseDate)}</p>
                      </div>
                      <div className="text-right">
                        <strong className="text-cyan-400 font-black text-sm block">{formatINR(p.totalAmount)}</strong>
                        <span className="text-[11px] text-slate-400 font-medium">{p.quantityKg} Kg @ ₹{p.pricePerKg}/kg</span>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
                      <span>GST (18%): {formatINR(p.taxAmount)}</span>
                      <button
                        onClick={() => sharePurchaseWhatsApp(p)}
                        className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-2 py-1 rounded-lg flex items-center space-x-1 font-semibold"
                      >
                        <MessageSquare className="w-3 h-3" />
                        <span>WhatsApp</span>
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </>
        )}

        {/* Tab 2: Sales Ledger & P&L */}
        {activeLedgerTab === 'SALES' && (
          <>
            {/* Desktop Table View */}
            <div className="hidden md:block print:block overflow-x-auto">
              <table className="w-full text-left text-xs printable-table">
                <thead className="bg-slate-900 text-slate-400 font-bold uppercase text-[10px]">
                  <tr>
                    <th className="p-3 rounded-l-lg">Sell Ref</th>
                    <th className="p-3">Lot Ref</th>
                    <th className="p-3">Trader Name</th>
                    <th className="p-3">Sell Date</th>
                    <th className="p-3">Qty Sold</th>
                    <th className="p-3">Buy Price</th>
                    <th className="p-3">Sale Price</th>
                    <th className="p-3">Total Cost</th>
                    <th className="p-3">Total Sale</th>
                    <th className="p-3">Realized P&L</th>
                    <th className="p-3">Remark / Note</th>
                    <th className="p-3 rounded-r-lg text-right">Share</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {filteredSales.length === 0 ? (
                    <tr>
                      <td colSpan={12} className="p-8 text-center text-slate-500">
                        No sales records found.
                      </td>
                    </tr>
                  ) : (
                    filteredSales.map((s) => {
                      const isGain = s.realizedPnL >= 0;
                      return (
                        <tr key={s.sellId} className="hover:bg-slate-800/40 transition-colors">
                          <td className="p-3 font-mono text-emerald-400 font-bold">{s.sellId}</td>
                          <td className="p-3 font-mono text-slate-400">{s.purchaseId}</td>
                          <td className="p-3 font-semibold text-white">{users.find((u) => u.id === s.userId)?.fullName || s.userName}</td>
                          <td className="p-3 text-slate-400">{formatDate(s.sellDate)}</td>
                          <td className="p-3 font-bold text-white">{s.quantityKg} Kg</td>
                          <td className="p-3 text-slate-300">₹{s.originalBuyPricePerKg}</td>
                          <td className="p-3 text-slate-300">₹{s.sellPricePerKg}</td>
                          <td className="p-3 text-slate-400">{formatINR(s.totalBuyAmount)}</td>
                          <td className="p-3 font-bold text-white">{formatINR(s.totalSellAmount)}</td>
                          <td className={`p-3 font-bold ${isGain ? 'text-emerald-400' : 'text-rose-400'}`}>
                            {isGain ? '+' : ''}
                            {formatINR(s.realizedPnL)} ({s.pnlPercentage.toFixed(2)}%)
                          </td>
                          <td className="p-3 text-slate-400 italic text-[11px] max-w-xs truncate">
                            {s.note || '-'}
                          </td>
                          <td className="p-3 text-right">
                            <button
                              onClick={() => shareSaleWhatsApp(s)}
                              title="Share Trade Receipt on WhatsApp"
                              className="bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 p-1.5 rounded-lg transition-all"
                            >
                              <MessageSquare className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards View */}
            <div className="space-y-3 md:hidden print:hidden">
              {filteredSales.length === 0 ? (
                <div className="p-8 text-center text-slate-500 text-xs">No sales records found.</div>
              ) : (
                filteredSales.map((s) => {
                  const isGain = s.realizedPnL >= 0;
                  return (
                    <div key={s.sellId} className="bg-slate-900 border border-slate-800 p-3.5 rounded-xl space-y-2.5 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-emerald-400 font-bold">{s.sellId} (Lot: {s.purchaseId})</span>
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
                        <span>Cost: {formatINR(s.totalBuyAmount)} (Buy: ₹{s.originalBuyPricePerKg})</span>
                        <button
                          onClick={() => shareSaleWhatsApp(s)}
                          className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-2 py-1 rounded-lg flex items-center space-x-1 font-semibold"
                        >
                          <MessageSquare className="w-3 h-3" />
                          <span>WhatsApp</span>
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};
