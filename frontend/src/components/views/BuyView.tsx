import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { translations, formatINR } from '../../lib/i18n';
import {
  ShoppingCart,
  CheckCircle2,
  AlertCircle,
  Calculator,
  Boxes,
  Zap,
  Wallet,
} from 'lucide-react';
import confetti from 'canvas-confetti';

export const BuyView: React.FC = () => {
  const {
    language,
    users,
    selectedUserId,
    setSelectedUserId,
    currentSpotPrice,
    executeBuyTrade,
    setActiveTab,
  } = useApp();

  const t = translations[language];

  // String quantity input for flexible typing without forcing values
  const [quantityInput, setQuantityInput] = useState<string>('100');
  const [tradeNote, setTradeNote] = useState<string>('');
  const [resultMessage, setResultMessage] = useState<{ type: 'SUCCESS' | 'ERROR'; text: string } | null>(
    null
  );

  const selectedUser = users.find((u) => u.id === selectedUserId) || users[0];
  const unitPrice = currentSpotPrice.pricePerKg;

  const numQuantity = parseFloat(quantityInput) || 0;
  const subtotal = numQuantity * unitPrice;
  const totalPayable = subtotal;

  const walletBalance = selectedUser ? selectedUser.walletBalance : 0;
  const remainingWallet = walletBalance - totalPayable;
  const hasEnoughCash = selectedUser ? walletBalance >= totalPayable && numQuantity > 0 : false;

  const handleExecuteBuy = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;

    if (numQuantity <= 0) {
      setResultMessage({ type: 'ERROR', text: 'Please specify a valid quantity greater than 0.' });
      return;
    }

    const res = executeBuyTrade({
      userId: selectedUser.id,
      quantityKg: numQuantity,
      pricePerKg: unitPrice,
      note: tradeNote || 'Spot market purchase',
    });

    if (res.success) {
      setResultMessage({ type: 'SUCCESS', text: res.message });
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.6 },
      });
      setTimeout(() => {
        setActiveTab('holdings');
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
            <ShoppingCart className="w-5 h-5 text-cyan-400" />
            <h2 className="text-xl font-black text-white tracking-tight">
              Buy Physical Aluminum Ingot Bars
            </h2>
          </div>
          <p className="text-xs text-slate-400">
            Execute spot commodity purchase order with real-time tax & wallet validation.
          </p>
        </div>

        <div className="text-right">
          <p className="text-[10px] text-slate-400 font-semibold uppercase">Current Spot Price</p>
          <p className="text-2xl font-black text-cyan-400">₹{unitPrice.toFixed(2)}/kg</p>
        </div>
      </div>

      {/* Always Visible Buyer Selector Bar */}
      <div className="bg-[#111827] border border-slate-800 p-4 rounded-2xl shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex-1 space-y-1">
          <label className="text-xs font-bold text-slate-300 block">
            Select Buyer / Trader
          </label>
          <select
            value={selectedUser?.id || ''}
            onChange={(e) => setSelectedUserId(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700 text-white font-semibold text-xs rounded-xl p-3 focus:outline-none focus:border-cyan-500 cursor-pointer"
          >
            {users.map((u) => (
              <option key={u.id} value={u.id}>
                👤 {u.fullName} ({formatINR(u.walletBalance)} wallet balance)
              </option>
            ))}
          </select>
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

      {/* Main Order Form Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Form Controls */}
        <form onSubmit={handleExecuteBuy} className="bg-[#111827] border border-slate-800 p-6 rounded-2xl shadow-xl space-y-5">
          {/* Quantity Input in Kg */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-slate-300">
                Purchase Quantity (Kg)
              </label>
              <span className="text-[11px] font-mono text-cyan-400">
                Total Weight: {numQuantity} Kg
              </span>
            </div>
            <input
              type="number"
              min="1"
              value={quantityInput}
              onChange={(e) => setQuantityInput(e.target.value)}
              placeholder="Enter weight in Kg"
              className="w-full bg-slate-900 border border-slate-700 text-white font-extrabold text-lg rounded-xl p-3 focus:outline-none focus:border-cyan-500"
            />

            {/* Quick Preset Buttons */}
            <div className="flex items-center gap-2 mt-2.5">
              {[100, 500, 1000, 5000].map((qty) => (
                <button
                  key={qty}
                  type="button"
                  onClick={() => setQuantityInput(String(qty))}
                  className={`flex-1 py-1.5 rounded-lg text-[11px] font-bold border transition-all cursor-pointer ${
                    numQuantity === qty
                      ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-300'
                      : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-white'
                  }`}
                >
                  +{qty} Kg
                </button>
              ))}
            </div>
          </div>

          {/* Trade Notes / Remarks */}
          <div>
            <label className="text-xs font-bold text-slate-300 block mb-1.5">
              Trade Note / Remark (Optional)
            </label>
            <input
              type="text"
              value={tradeNote}
              onChange={(e) => setTradeNote(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 text-white text-xs rounded-xl p-3 focus:outline-none focus:border-cyan-500"
              placeholder="e.g., Seasonal buffer inventory lot"
            />
          </div>

          {/* Wallet Balance Status */}
          {selectedUser && (
            <div
              className={`p-3 rounded-xl border text-xs flex items-center justify-between ${
                hasEnoughCash
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                  : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
              }`}
            >
              <div className="flex items-center space-x-2">
                <Wallet className="w-4 h-4" />
                <span>Buyer Cash Balance:</span>
              </div>
              <strong className="font-mono text-sm">{formatINR(walletBalance)}</strong>
            </div>
          )}

          <button
            type="submit"
            disabled={!hasEnoughCash}
            className={`w-full py-3.5 rounded-xl font-black text-xs uppercase tracking-wider flex items-center justify-center space-x-2 transition-all shadow-lg ${
              hasEnoughCash
                ? 'bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white shadow-cyan-500/25 active:scale-95 cursor-pointer'
                : 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed'
            }`}
          >
            <Zap className="w-4 h-4" />
            <span>Confirm & Execute Buy Order</span>
          </button>
        </form>

        {/* Live Calculation Receipt Breakdown Side */}
        <div className="bg-[#111827] border border-slate-800 p-6 rounded-2xl shadow-xl space-y-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center space-x-2 border-b border-slate-800 pb-3 mb-4">
              <Calculator className="w-4 h-4 text-cyan-400" />
              <h3 className="text-sm font-bold text-white">Pre-Execution Invoice Audit</h3>
            </div>

            <div className="space-y-3.5 text-xs">
              <div className="flex justify-between items-center text-slate-300">
                <span>Selected Buyer:</span>
                <span className="font-bold text-white">{selectedUser?.fullName || '—'}</span>
              </div>

              <div className="flex justify-between items-center text-slate-300">
                <span>Selected Quantity:</span>
                <span className="font-bold text-white">{numQuantity} Kg</span>
              </div>

              <div className="flex justify-between items-center text-slate-300">
                <span>Spot Price / Kg:</span>
                <span className="font-bold text-cyan-400">₹{unitPrice.toFixed(2)}/kg</span>
              </div>

              <div className="flex justify-between items-center text-slate-300 border-t border-slate-800/80 pt-2">
                <span>Subtotal Amount:</span>
                <span className="font-mono text-slate-200 font-bold">{formatINR(subtotal)}</span>
              </div>

              <div className="border-t border-slate-800 my-2"></div>

              <div className="flex justify-between items-center text-sm font-black text-white bg-slate-900 p-3 rounded-xl border border-slate-800">
                <span>Total Payable Amount:</span>
                <span className="text-cyan-400 font-mono text-base font-black">{formatINR(totalPayable)}</span>
              </div>

              <div className="flex justify-between items-center text-[11px] pt-1">
                <span className="text-slate-400">Wallet After Purchase:</span>
                <span className={`font-mono font-bold ${remainingWallet >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {formatINR(remainingWallet)}
                </span>
              </div>
            </div>
          </div>

          <div className="p-3 bg-cyan-500/5 border border-cyan-500/20 rounded-xl text-[11px] text-slate-400 leading-relaxed flex items-start space-x-2">
            <Boxes className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
            <span>Purchased stock will immediately be credited to {selectedUser?.fullName || 'selected trader'}'s active inventory with lot tracking enabled.</span>
          </div>
        </div>
      </div>
    </div>
  );
};
