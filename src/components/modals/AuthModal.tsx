import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { LogIn, UserPlus, X, ShieldCheck, AlertCircle, CheckCircle2, Lock, User, Mail, Phone, Calendar, Key, Wallet } from 'lucide-react';

export const AuthModal: React.FC = () => {
  const { authModalOpen, setAuthModalOpen, loginUser, signupUser, users } = useApp();
  const [tab, setTab] = useState<'LOGIN' | 'SIGNUP'>('LOGIN');

  // Login form state
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPin, setLoginPin] = useState('');
  
  // Signup form state
  const [fullName, setFullName] = useState('');
  const [dob, setDob] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [kycId, setKycId] = useState('');
  const [walletBalance, setWalletBalance] = useState<number>(100000);
  const [signupPin, setSignupPin] = useState('1234');

  // Status feedback
  const [statusMessage, setStatusMessage] = useState<{ type: 'SUCCESS' | 'ERROR'; text: string } | null>(null);
  const [loading, setLoading] = useState(false);

  if (!authModalOpen) return null;

  // Age calculation helper
  const calculateAge = (dobString: string): number => {
    if (!dobString) return 0;
    const birthDate = new Date(dobString);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginIdentifier || !loginPin) {
      setStatusMessage({ type: 'ERROR', text: 'Please enter your Email/Phone/ID and 4-digit Security PIN.' });
      return;
    }
    setLoading(true);
    setStatusMessage(null);
    const res = await loginUser(loginIdentifier, loginPin);
    setLoading(false);
    if (!res.success) {
      setStatusMessage({ type: 'ERROR', text: res.message });
    }
  };

  const handleSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !dob || !email || !phone || !kycId || !signupPin) {
      setStatusMessage({ type: 'ERROR', text: 'Please fill out all mandatory signup fields.' });
      return;
    }

    const age = calculateAge(dob);
    if (age < 18) {
      setStatusMessage({
        type: 'ERROR',
        text: `Age verification failed. Trader must be at least 18 years old (Calculated Age: ${age}).`,
      });
      return;
    }

    setLoading(true);
    setStatusMessage(null);
    const res = await signupUser({
      fullName,
      dob,
      email,
      phone,
      kycId,
      walletBalance,
      pin: signupPin,
    });
    setLoading(false);
    if (!res.success) {
      setStatusMessage({ type: 'ERROR', text: res.message });
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-[#111827] border border-slate-800 w-full max-w-md rounded-3xl p-6 shadow-2xl relative space-y-5">
        <button
          onClick={() => setAuthModalOpen(false)}
          className="absolute top-4 right-4 text-slate-500 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header Tabs */}
        <div className="flex items-center space-x-2 bg-slate-900 p-1.5 rounded-2xl border border-slate-800">
          <button
            onClick={() => {
              setTab('LOGIN');
              setStatusMessage(null);
            }}
            className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-2 ${
              tab === 'LOGIN'
                ? 'bg-cyan-500 text-slate-950 shadow-lg shadow-cyan-500/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <LogIn className="w-4 h-4" />
            <span>Trader Login</span>
          </button>

          <button
            onClick={() => {
              setTab('SIGNUP');
              setStatusMessage(null);
            }}
            className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-2 ${
              tab === 'SIGNUP'
                ? 'bg-cyan-500 text-slate-950 shadow-lg shadow-cyan-500/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <UserPlus className="w-4 h-4" />
            <span>Sign Up Account</span>
          </button>
        </div>

        {statusMessage && (
          <div
            className={`p-3 rounded-xl text-xs font-semibold flex items-center space-x-2 border ${
              statusMessage.type === 'SUCCESS'
                ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-300'
                : 'bg-rose-500/10 border-rose-500/40 text-rose-300'
            }`}
          >
            {statusMessage.type === 'SUCCESS' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            )}
            <span>{statusMessage.text}</span>
          </div>
        )}

        {/* LOGIN FORM */}
        {tab === 'LOGIN' && (
          <form onSubmit={handleLoginSubmit} className="space-y-4 text-xs">
            <div>
              <label className="font-semibold text-slate-300 block mb-1.5 flex items-center space-x-1">
                <Mail className="w-3.5 h-3.5 text-cyan-400" />
                <span>Email, Phone, or Trader ID</span>
              </label>
              <input
                type="text"
                value={loginIdentifier}
                onChange={(e) => setLoginIdentifier(e.target.value)}
                placeholder="e.g. rahul.sharma@example.com or USR-1001"
                className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl p-3 focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="font-semibold text-slate-300 block mb-1.5 flex items-center space-x-1">
                <Lock className="w-3.5 h-3.5 text-cyan-400" />
                <span>Security PIN (4-Digits)</span>
              </label>
              <input
                type="password"
                maxLength={4}
                value={loginPin}
                onChange={(e) => setLoginPin(e.target.value)}
                placeholder="••••"
                className="w-full bg-slate-900 border border-slate-700 text-white font-mono text-center text-lg tracking-widest rounded-xl p-3 focus:outline-none focus:border-cyan-500"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black py-3.5 rounded-xl transition-all shadow-lg shadow-cyan-500/20 active:scale-95 flex items-center justify-center space-x-2"
            >
              <LogIn className="w-4 h-4" />
              <span>{loading ? 'Authenticating...' : 'Sign In to AluTrade'}</span>
            </button>

            {/* Quick 1-Click Demo Login Selector */}
            <div className="pt-2 border-t border-slate-800 space-y-2">
              <span className="text-[11px] text-slate-400 font-bold block">1-Click Quick Login as Registered Trader:</span>
              <div className="grid grid-cols-2 gap-2">
                {users.map((u) => (
                  <button
                    key={u.id}
                    type="button"
                    onClick={async () => {
                      setLoginIdentifier(u.id);
                      setLoginPin(u.pin || '1234');
                      setLoading(true);
                      const res = await loginUser(u.id, u.pin || '1234');
                      setLoading(false);
                      if (!res.success) setStatusMessage({ type: 'ERROR', text: res.message });
                    }}
                    className="p-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-xl text-left transition-all group cursor-pointer"
                  >
                    <span className="text-xs font-bold text-white group-hover:text-cyan-400 block truncate">{u.fullName}</span>
                    <span className="text-[10px] text-slate-500 font-mono block">{u.id} | PIN: {u.pin || '1234'}</span>
                  </button>
                ))}
              </div>
            </div>
          </form>
        )}

        {/* SIGNUP FORM */}
        {tab === 'SIGNUP' && (
          <form onSubmit={handleSignupSubmit} className="space-y-3 text-xs max-h-[420px] overflow-y-auto pr-1">
            <div>
              <label className="font-semibold text-slate-300 block mb-1">Full Name</label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="e.g. Vikram Sharma"
                className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl p-2.5 focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div>
              <div className="flex justify-between mb-1">
                <label className="font-semibold text-slate-300">Date of Birth</label>
                {dob && (
                  <span className={`text-[10px] font-bold ${calculateAge(dob) >= 18 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    Age: {calculateAge(dob)} {calculateAge(dob) >= 18 ? '✓ Verified 18+' : '❌ Underage'}
                  </span>
                )}
              </div>
              <input
                type="date"
                value={dob}
                onChange={(e) => setDob(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl p-2.5 focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="font-semibold text-slate-300 block mb-1">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="trader@example.com"
                  className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl p-2.5 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-300 block mb-1">Phone Number</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 98765 43210"
                  className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl p-2.5 focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>

            <div>
              <label className="font-semibold text-slate-300 block mb-1">KYC PAN / Aadhaar ID</label>
              <input
                type="text"
                value={kycId}
                onChange={(e) => setKycId(e.target.value.toUpperCase())}
                placeholder="ABCPS1234F"
                className="w-full bg-slate-900 border border-slate-700 text-white font-mono rounded-xl p-2.5 focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="font-semibold text-slate-300 block mb-1">Initial Cash (₹)</label>
                <input
                  type="number"
                  value={walletBalance}
                  onChange={(e) => setWalletBalance(parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-900 border border-slate-700 text-white font-bold rounded-xl p-2.5 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-300 block mb-1">4-Digit Security PIN</label>
                <input
                  type="text"
                  maxLength={4}
                  value={signupPin}
                  onChange={(e) => setSignupPin(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 text-white font-mono text-center rounded-xl p-2.5 focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black py-3 rounded-xl transition-all shadow-lg shadow-cyan-500/20 active:scale-95 flex items-center justify-center space-x-2"
            >
              <UserPlus className="w-4 h-4" />
              <span>{loading ? 'Creating Account...' : 'Complete Sign Up & Start Trading'}</span>
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
