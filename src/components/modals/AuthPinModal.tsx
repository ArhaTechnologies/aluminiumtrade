import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Lock, KeyRound, X, CheckCircle2, ShieldAlert } from 'lucide-react';

export const AuthPinModal: React.FC = () => {
  const { pinModalOpen, setPinModalOpen, users } = useApp();
  const [pinInput, setPinInput] = useState('');
  const [error, setError] = useState(false);
  const [success, setSuccess] = useState(false);

  if (!pinModalOpen) return null;

  const handleVerifyPin = (e: React.FormEvent) => {
    e.preventDefault();
    // Default PIN '1234' or any user's PIN
    const isValid = pinInput === '1234' || users.some((u) => u.pin === pinInput);

    if (isValid) {
      setSuccess(true);
      setError(false);
      setTimeout(() => {
        setSuccess(false);
        setPinInput('');
        setPinModalOpen(false);
      }, 1000);
    } else {
      setError(true);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-[#111827] border border-slate-800 w-full max-w-sm rounded-3xl p-6 shadow-2xl relative space-y-5">
        <button
          onClick={() => setPinModalOpen(false)}
          className="absolute top-4 right-4 text-slate-500 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 mx-auto flex items-center justify-center">
            <Lock className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-white">AluTrade Security Lock</h3>
          <p className="text-xs text-slate-400">Enter your 4-digit security PIN to authorize operations.</p>
        </div>

        {error && (
          <div className="bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs p-2.5 rounded-xl text-center flex items-center justify-center space-x-1">
            <ShieldAlert className="w-4 h-4" />
            <span>Invalid PIN. (Default: 1234)</span>
          </div>
        )}

        {success && (
          <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs p-2.5 rounded-xl text-center flex items-center justify-center space-x-1">
            <CheckCircle2 className="w-4 h-4" />
            <span>Identity Verified! Unlocking...</span>
          </div>
        )}

        <form onSubmit={handleVerifyPin} className="space-y-4">
          <div>
            <input
              type="password"
              maxLength={4}
              value={pinInput}
              onChange={(e) => {
                setError(false);
                setPinInput(e.target.value);
              }}
              placeholder="••••"
              className="w-full bg-slate-900 border border-slate-700 text-white font-mono text-center text-2xl tracking-widest rounded-2xl p-3 focus:outline-none focus:border-cyan-500"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-xs py-3 rounded-2xl shadow-lg shadow-cyan-500/20 transition-all"
          >
            Unlock Security Session
          </button>
        </form>

        <p className="text-[10px] text-slate-500 text-center">
          Default Master PIN: <code className="text-cyan-400">1234</code>
        </p>
      </div>
    </div>
  );
};
