import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { translations, formatINR, formatDate } from '../../lib/i18n';
import {
  Users,
  UserPlus,
  ShieldCheck,
  Wallet,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Eye,
  Key,
  Trash2,
  Edit3,
  Save,
  X,
} from 'lucide-react';

export const UserManagementView: React.FC = () => {
  const {
    language,
    users,
    addUser,
    updateUser,
    deleteUser,
    activeHoldings,
    purchases,
    sales,
    setActiveProfileUserId,
    setActiveTab,
  } = useApp();

  const t = translations[language];

  // New User Form State
  const [fullName, setFullName] = useState('');
  const [dob, setDob] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [kycId, setKycId] = useState('');
  const [walletBalance, setWalletBalance] = useState<number>(100000);
  const [pin, setPin] = useState<string>('1234');
  const [statusMessage, setStatusMessage] = useState<{ type: 'SUCCESS' | 'ERROR'; text: string } | null>(
    null
  );

  // Edit User Modal State
  const [editingUser, setEditingUser] = useState<any | null>(null);
  const [editName, setEditName] = useState('');
  const [editDob, setEditDob] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editKyc, setEditKyc] = useState('');
  const [editWallet, setEditWallet] = useState<number>(0);
  const [editPin, setEditPin] = useState('1234');

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

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();

    if (!fullName || !dob || !email || !phone || !kycId) {
      setStatusMessage({ type: 'ERROR', text: 'Please fill in all mandatory user fields.' });
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

    const newUser = addUser({
      fullName,
      dob,
      email,
      phone,
      kycId,
      walletBalance,
      pin,
    });

    setStatusMessage({
      type: 'SUCCESS',
      text: `User ${newUser.fullName} (${newUser.id}) registered successfully!`,
    });

    // Reset form
    setFullName('');
    setDob('');
    setEmail('');
    setPhone('');
    setKycId('');
    setWalletBalance(100000);
  };

  return (
    <div className="p-4 sm:p-6 space-y-6 text-slate-100 max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className="bg-[#111827] border border-slate-800 p-6 rounded-2xl shadow-xl flex items-center justify-between">
        <div>
          <div className="flex items-center space-x-2">
            <Users className="w-5 h-5 text-cyan-400" />
            <h2 className="text-xl font-black text-white tracking-tight">
              Trader User Directory & Onboarding
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Manage commodity trading accounts, verify age/KYC documentation, and initialize wallet balances.
          </p>
        </div>

        <span className="bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 font-bold text-xs px-3 py-1.5 rounded-xl">
          {users.length} Active Registered Traders
        </span>
      </div>

      {statusMessage && (
        <div
          className={`p-4 rounded-xl text-xs font-semibold flex items-center space-x-2 border ${
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

      {/* Main Grid: Directory + Registration Form */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Registration Form */}
        <div className="bg-[#111827] border border-slate-800 p-6 rounded-2xl shadow-xl space-y-4">
          <div className="flex items-center space-x-2 border-b border-slate-800 pb-3">
            <UserPlus className="w-4 h-4 text-cyan-400" />
            <h3 className="text-sm font-bold text-white">Register New Trader</h3>
          </div>

          <form onSubmit={handleCreateUser} className="space-y-3.5 text-xs">
            <div>
              <label className="font-semibold text-slate-300 block mb-1">Full Name</label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="e.g. Vikram Singh"
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

            <div>
              <label className="font-semibold text-slate-300 block mb-1">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="vikram@example.com"
                className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl p-2.5 focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="font-semibold text-slate-300 block mb-1">Phone Number</label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 98765 43210"
                className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl p-2.5 focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="font-semibold text-slate-300 block mb-1">Govt ID / KYC Number (PAN)</label>
              <input
                type="text"
                value={kycId}
                onChange={(e) => setKycId(e.target.value.toUpperCase())}
                placeholder="VKMPS1234F"
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
                <label className="font-semibold text-slate-300 block mb-1">Security PIN</label>
                <input
                  type="text"
                  maxLength={4}
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 text-white font-mono text-center rounded-xl p-2.5 focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black py-3 rounded-xl transition-all shadow-lg shadow-cyan-500/20 active:scale-95"
            >
              Create Trader Account
            </button>
          </form>
        </div>

        {/* Directory List Cards */}
        <div className="lg:col-span-2 space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center space-x-2">
            <Users className="w-4 h-4 text-cyan-400" />
            <span>Registered Trader Directory ({users.length})</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {users.map((u) => {
              const uHoldings = activeHoldings.filter((h) => h.userId === u.id);
              const totalStockVal = uHoldings.reduce((sum, h) => sum + h.currentMarketValue, 0);
              const age = calculateAge(u.dob);

              return (
                <div
                  key={u.id}
                  className="bg-[#111827] border border-slate-800 p-5 rounded-2xl shadow-xl space-y-4 relative group hover:border-cyan-500/40 transition-all"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 p-0.5 shadow-md">
                        <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center font-bold text-cyan-300 text-sm">
                          {u.fullName.charAt(0)}
                        </div>
                      </div>
                      <div>
                        <h4 className="font-bold text-white text-sm group-hover:text-cyan-400 transition-colors">
                          {u.fullName}
                        </h4>
                        <p className="text-[11px] font-mono text-slate-400">{u.id}</p>
                      </div>
                    </div>

                    <span className="text-[10px] bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-bold px-2 py-0.5 rounded-full flex items-center space-x-1">
                      <ShieldCheck className="w-3 h-3" />
                      <span>18+ KYC</span>
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-slate-800">
                    <div>
                      <span className="text-[10px] text-slate-400 block">Wallet Cash</span>
                      <strong className="text-white font-black">{formatINR(u.walletBalance)}</strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">Stock Value</span>
                      <strong className="text-cyan-400 font-black">{formatINR(totalStockVal)}</strong>
                    </div>
                  </div>

                  <div className="text-[11px] text-slate-400 space-y-1">
                    <p>📧 {u.email}</p>
                    <p>📱 {u.phone} | KYC: {u.kycId}</p>
                  </div>

                  <div className="flex items-center space-x-2 pt-1">
                    <button
                      onClick={() => {
                        setActiveProfileUserId(u.id);
                        setActiveTab('user_profile');
                      }}
                      className="flex-1 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-cyan-300 font-bold text-xs py-2 px-2.5 rounded-xl flex items-center justify-center space-x-1 transition-colors"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Dashboard</span>
                    </button>

                    <button
                      onClick={() => {
                        setEditingUser(u);
                        setEditName(u.fullName);
                        setEditDob(u.dob || '');
                        setEditEmail(u.email || '');
                        setEditPhone(u.phone || '');
                        setEditKyc(u.kycId || '');
                        setEditWallet(u.walletBalance);
                        setEditPin(u.pin || '1234');
                      }}
                      title="Edit Trader Profile"
                      className="bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 text-cyan-400 font-bold text-xs p-2 rounded-xl transition-all flex items-center justify-center shrink-0 cursor-pointer"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => {
                        if (window.confirm(`Are you sure you want to delete trader "${u.fullName}" (${u.id})? This will permanently remove their account from PostgreSQL.`)) {
                          const res = deleteUser(u.id);
                          setStatusMessage({
                            type: res.success ? 'SUCCESS' : 'ERROR',
                            text: res.message,
                          });
                        }
                      }}
                      title="Delete Trader Account"
                      className="bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-400 font-bold text-xs p-2 rounded-xl transition-all flex items-center justify-center shrink-0 cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Edit Trader Modal Overlay */}
      {editingUser && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#111827] border border-slate-800 w-full max-w-lg rounded-3xl p-6 shadow-2xl relative space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <Edit3 className="w-5 h-5 text-cyan-400" />
                <h3 className="text-base font-bold text-white">Edit Trader ({editingUser.id})</h3>
              </div>
              <button
                onClick={() => setEditingUser(null)}
                className="text-slate-500 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                updateUser(editingUser.id, {
                  fullName: editName,
                  dob: editDob,
                  email: editEmail,
                  phone: editPhone,
                  kycId: editKyc,
                  walletBalance: editWallet,
                  pin: editPin,
                });
                setStatusMessage({
                  type: 'SUCCESS',
                  text: `Trader ${editName} (${editingUser.id}) profile updated successfully!`,
                });
                setEditingUser(null);
              }}
              className="space-y-3 text-xs"
            >
              <div>
                <label className="font-semibold text-slate-300 block mb-1">Full Name</label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl p-2.5"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-semibold text-slate-300 block mb-1">Email</label>
                  <input
                    type="email"
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl p-2.5"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-300 block mb-1">Phone</label>
                  <input
                    type="text"
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl p-2.5"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-semibold text-slate-300 block mb-1">KYC ID</label>
                  <input
                    type="text"
                    value={editKyc}
                    onChange={(e) => setEditKyc(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl p-2.5 font-mono"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-300 block mb-1">Date of Birth</label>
                  <input
                    type="date"
                    value={editDob}
                    onChange={(e) => setEditDob(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl p-2.5"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-semibold text-slate-300 block mb-1">Wallet Cash Balance (₹)</label>
                  <input
                    type="number"
                    value={editWallet}
                    onChange={(e) => setEditWallet(parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-900 border border-slate-700 text-white font-bold rounded-xl p-2.5"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-300 block mb-1">Security PIN</label>
                  <input
                    type="text"
                    maxLength={4}
                    value={editPin}
                    onChange={(e) => setEditPin(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 text-white text-center font-mono rounded-xl p-2.5"
                  />
                </div>
              </div>

              <div className="flex space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold py-2.5 rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black py-2.5 rounded-xl shadow-lg flex items-center justify-center space-x-1 cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>Save Changes</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
