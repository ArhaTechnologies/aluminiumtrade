import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { translations, formatINR, formatDate } from '../../lib/i18n';
import {
  Coins,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  CheckCircle2,
  Boxes,
  ArrowUpRight,
  ArrowDownRight,
  Zap,
} from 'lucide-react';
import confetti from 'canvas-confetti';

export const SellView: React.FC = () => {
  const {
    language,
    users,
    selectedUserId,
    setSelectedUserId,
    activeHoldings,
    currentSpotPrice,
    executeSellTrade,
    setActiveTab,
  } = useApp();

  const t = translations[language];

  const selectedUser = users.find((u) => u.id === selectedUserId) || users[0];

  // User's active unsold holdings
  const userHoldings = useMemo(() => {
    if (!selectedUser) return [];
    return activeHoldings.filter((h) => h.userId === selectedUser.id);
  }, [activeHoldings, selectedUser]);

  const [selectedLotId, setSelectedLotId] = useState<string>('');
  const [sellQty, setSellQty] = useState<number>(0);
  const [sellNote, setSellNote] = useState<string>('');
  const [resultMessage, setResultMessage] = useState<{ type: 'SUCCESS' | 'ERROR'; text: string } | null>(
    null
  );

  // Default lot selection if not selected
  const activeLot = useMemo(() => {
    if (selectedLotId) {
      return userHoldings.find((h) => h.purchaseId === selectedLotId) || userHoldings[0];
    }
    return userHoldings[0];
  }, [userHoldings, selectedLotId]);

  // Sync default quantity when active lot changes
  React.useEffect(() => {
    if (activeLot) {
      setSelectedLotId(activeLot.purchaseId);
      setSellQty(activeLot.remainingQuantityKg);
    } else {
      setSelectedLotId('');
      setSellQty(0);
    }
  }, [activeLot]);

  const currentPrice = currentSpotPrice.pricePerKg;

  // Live P&L Calculations
  const costBasis = activeLot ? sellQty * activeLot.buyPricePerKg : 0;
  const saleProceeds = activeLot ? sellQty * currentPrice : 0;
  const netPnL = saleProceeds - costBasis;
  const roiPercent = costBasis > 0 ? (netPnL / costBasis) * 100 : 0;

  const handleExecuteSell = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser || !activeLot) return;

    if (sellQty <= 0 || sellQty > activeLot.remainingQuantityKg) {
      setResultMessage({
        type: 'ERROR',
        text: `Invalid quantity. Please enter between 1 and ${activeLot.remainingQuantityKg} Kg.`,
      });
      return;
    }

    const res = executeSellTrade({
      userId: selectedUser.id,
      purchaseId: activeLot.purchaseId,
      quantityKg: sellQty,
      sellPricePerKg: currentPrice,
      note: sellNote || 'Liquidation sale',
    });

    if (res.success) {
      setResultMessage({ type: 'SUCCESS', text: res.message });
      if (netPnL >= 0) {
        confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
      }
      setTimeout(() => {
        setActiveTab('ledger');
      }, 1500);
    } else {
      setResultMessage({ type: 'ERROR', text: res.message });
    }
  };

  return (
    <div className="p-4 sm:p-6 space-y-6 text-slate-100 max-w-4xl mx-auto">
      {/* Header Banner */}
      <div className="bg-[#111827] border border-slate-800 p-6 rounded-2xl shadow-xl flex items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <Coins className="w-5 h-5 text-emerald-400" />
            <h2 className="text-xl font-black text-white tracking-tight">
              Sell & Liquidate Active Stock
            </h2>
          </div>
          <p className="text-xs text-slate-400">
            Liquidate active inventory lots with instant profit/loss preview and wallet payout.
          </p>
        </div>

        <div className="text-right">
          <p className="text-[10px] text-slate-400 font-semibold uppercase">Market Sale Rate</p>
          <p className="text-2xl font-black text-emerald-400">₹{currentPrice.toFixed(2)}/kg</p>
        </div>
      </div>

      {resultMessage && (
        <div
          className={`p-4 rounded-xl text-xs font-semibold flex items-center space-x-2 border ${
            resultMessage.type === 'SUCCESS'
              ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-300'
              : 'bg-rose-500/10 border-rose-500/40 text-rose-300'
          }`}
        >
          {resultMessage.type === 'SUCCESS' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          )}
          <span>{resultMessage.text}</span>
        </div>
      )}

      {userHoldings.length === 0 ? (
        <div className="bg-[#111827] border border-slate-800 p-8 rounded-2xl text-center space-y-3">
          <Boxes className="w-12 h-12 text-slate-600 mx-auto" />
          <h3 className="text-sm font-bold text-white">No Unsold Inventory for {selectedUser?.fullName}</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            This trader currently holds 0 Kg active aluminum stock. Purchase stock first before executing sell orders.
          </p>
          <button
            onClick={() => setActiveTab('buy')}
            className="bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs px-4 py-2 rounded-xl transition-all"
          >
            Buy Aluminum Now →
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Form Side */}
          <form onSubmit={handleExecuteSell} className="bg-[#111827] border border-slate-800 p-6 rounded-2xl shadow-xl space-y-5">
            {/* Select User */}
            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1.5">
                Select Seller / Trader
              </label>
              <select
                value={selectedUser?.id || ''}
                onChange={(e) => setSelectedUserId(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 text-white font-semibold text-xs rounded-xl p-3 focus:outline-none focus:border-cyan-500 cursor-pointer"
              >
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    👤 {u.fullName} ({formatINR(u.walletBalance)})
                  </option>
                ))}
              </select>
            </div>

            {/* Select Target Lot */}
            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1.5">
                Select Inventory Lot to Liquidate
              </label>
              <select
                value={selectedLotId}
                onChange={(e) => setSelectedLotId(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 text-white font-semibold text-xs rounded-xl p-3 focus:outline-none focus:border-cyan-500 cursor-pointer"
              >
                {userHoldings.map((h) => (
                  <option key={h.purchaseId} value={h.purchaseId}>
                    Lot {h.purchaseId} — {h.remainingQuantityKg} Kg @ ₹{h.buyPricePerKg}/kg ({formatDate(h.purchaseDate)})
                  </option>
                ))}
              </select>
            </div>

            {/* Quantity Input */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-slate-300">
                  Quantity to Sell (Kg)
                </label>
                {activeLot && (
                  <span className="text-[11px] text-cyan-400 font-mono">
                    Max Available: {activeLot.remainingQuantityKg} Kg
                  </span>
                )}
              </div>
              <input
                type="number"
                min="1"
                max={activeLot?.remainingQuantityKg || 1}
                value={sellQty}
                onChange={(e) =>
                  setSellQty(Math.min(activeLot?.remainingQuantityKg || 1, Math.max(1, parseInt(e.target.value) || 0)))
                }
                className="w-full bg-slate-900 border border-slate-700 text-white font-extrabold text-lg rounded-xl p-3 focus:outline-none focus:border-cyan-500"
              />
            </div>

            {/* Trade Note */}
            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1.5">
                Liquidation Remark / Note
              </label>
              <input
                type="text"
                value={sellNote}
                onChange={(e) => setSellNote(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 text-white text-xs rounded-xl p-3 focus:outline-none focus:border-cyan-500"
                placeholder="e.g. Profit booking at peak spot rate"
              />
            </div>

            <button
              type="submit"
              disabled={sellQty <= 0}
              className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-black text-xs py-3.5 rounded-xl uppercase tracking-wider flex items-center justify-center space-x-2 shadow-lg shadow-emerald-500/20 active:scale-95 cursor-pointer"
            >
              <Zap className="w-4 h-4" />
              <span>Confirm & Liquidate Sale</span>
            </button>
          </form>

          {/* Live P&L Preview Side */}
          <div className="bg-[#111827] border border-slate-800 p-6 rounded-2xl shadow-xl space-y-5 flex flex-col justify-between">
            <div>
              <div className="flex items-center space-x-2 border-b border-slate-800 pb-3 mb-4">
                <TrendingUp className="w-4 h-4 text-emerald-400" />
                <h3 className="text-sm font-bold text-white">Live Realized P&L Preview</h3>
              </div>

              {activeLot && (
                <div className="space-y-3 text-xs">
                  <div className="flex justify-between text-slate-300">
                    <span>Original Purchase Cost:</span>
                    <span className="font-bold text-white">₹{activeLot.buyPricePerKg}/kg</span>
                  </div>

                  <div className="flex justify-between text-slate-300">
                    <span>Current Market Sale Rate:</span>
                    <span className="font-bold text-emerald-400">₹{currentPrice}/kg</span>
                  </div>

                  <div className="flex justify-between text-slate-300 border-t border-slate-800/80 pt-2">
                    <span>Cost Basis for {sellQty} Kg:</span>
                    <span className="font-bold text-white">{formatINR(costBasis)}</span>
                  </div>

                  <div className="flex justify-between text-slate-300">
                    <span>Total Sale Proceeds:</span>
                    <span className="font-bold text-emerald-400">{formatINR(saleProceeds)}</span>
                  </div>

                  <div className="border-t-2 border-dashed border-slate-700 my-3"></div>

                  <div
                    className={`p-4 rounded-xl border flex items-center justify-between ${
                      netPnL >= 0
                        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                        : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                    }`}
                  >
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400">
                        Net Realized Profit / Loss
                      </span>
                      <p className="text-lg font-black">
                        {netPnL >= 0 ? '+' : ''}
                        {formatINR(netPnL)}
                      </p>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] uppercase font-bold text-slate-400">ROI %</span>
                      <p className="text-base font-extrabold flex items-center justify-end space-x-1">
                        {netPnL >= 0 ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                        <span>
                          {netPnL >= 0 ? '+' : ''}
                          {roiPercent.toFixed(2)}%
                        </span>
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="p-3 bg-emerald-500/5 border border-emerald-500/20 rounded-xl text-[11px] text-slate-400 leading-relaxed">
              💡 Sale proceeds will instantly credit the trader's cash wallet upon confirmation.
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
