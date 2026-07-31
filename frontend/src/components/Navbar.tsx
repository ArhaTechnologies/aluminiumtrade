import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { translations, formatINR } from '../lib/i18n';
import {
  Zap,
  Bell,
  Lock,
  Globe,
  Plus,
  ShoppingCart,
  TrendingUp,
  User as UserIcon,
  CheckCircle2,
  XCircle,
  Clock,
  Sparkles,
  MessageSquare,
  Database,
  Menu,
  X,
  LogIn,
  LogOut,
  UserPlus,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { shareSpotRateWhatsApp } from '../lib/whatsapp';

export const Navbar: React.FC = () => {
  const {
    language,
    setLanguage,
    currentSpotPrice,
    simulatorActive,
    toggleSimulator,
    notifications,
    markNotificationRead,
    clearNotifications,
    users,
    selectedUserId,
    setSelectedUserId,
    setActiveTab,
    lastTransaction,
    undoLastTrade,
    setPinModalOpen,
    sidebarOpen,
    toggleSidebar,
    currentUser,
    setAuthModalOpen,
    logoutUser,
  } = useApp();

  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [undoMessage, setUndoMessage] = useState<string | null>(null);

  const t = translations[language];
  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleUndo = () => {
    const res = undoLastTrade();
    setUndoMessage(res.message);
    setTimeout(() => setUndoMessage(null), 4000);
  };

  return (
    <header className="sticky top-0 z-40 bg-[#0B0F19]/90 backdrop-blur-md border-b border-white/10 px-4 py-2.5 flex items-center justify-between text-slate-100">
      {/* Brand & Live Price Badge */}
      <div className="flex items-center space-x-3 sm:space-x-4">
        {/* Collapsible Sidebar Hamburger Toggle Button */}
        <button
          onClick={toggleSidebar}
          title={sidebarOpen ? 'Close Navigation Sidebar' : 'Open Navigation Sidebar'}
          className="p-2 bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded-xl text-cyan-400 transition-all flex items-center justify-center shadow-md active:scale-95"
        >
          {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>

        <div
          onClick={() => setActiveTab('dashboard')}
          className="flex items-center space-x-2.5 cursor-pointer group"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 p-0.5 shadow-lg shadow-cyan-500/20 group-hover:scale-105 transition-transform">
            <div className="w-full h-full bg-[#0B0F19] rounded-[10px] flex items-center justify-center">
              <Zap className="w-5 h-5 text-cyan-400 fill-cyan-400/20" />
            </div>
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight bg-gradient-to-r from-white via-slate-200 to-cyan-400 bg-clip-text text-transparent">
              {t.appTitle}
            </h1>
            <p className="text-[10px] text-slate-400 hidden sm:block">
              {t.appSubtitle}
            </p>
          </div>
        </div>

        {/* Live Spot Price Banner */}
        <div className="hidden md:flex items-center space-x-3 bg-slate-900/80 border border-slate-800 rounded-lg px-3 py-1.5 shadow-inner">
          <div className="flex items-center space-x-1.5">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
            <span className="text-xs text-slate-400 font-medium">Spot Price:</span>
            <span className="text-sm font-bold text-white tracking-wide">
              ₹{currentSpotPrice.pricePerKg.toFixed(2)}
            </span>
            <span className="text-xs text-slate-400">/kg</span>
          </div>

          {currentSpotPrice.change24h !== undefined && (
            <span
              className={`text-xs font-semibold px-2 py-0.5 rounded-full flex items-center space-x-1 ${
                currentSpotPrice.change24h >= 0
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
              }`}
            >
              <TrendingUp className={`w-3 h-3 ${currentSpotPrice.change24h < 0 ? 'rotate-180' : ''}`} />
              <span>
                {currentSpotPrice.change24h >= 0 ? '+' : ''}
                {currentSpotPrice.change24h}%
              </span>
            </span>
          )}

          <button
            onClick={() => shareSpotRateWhatsApp(currentSpotPrice)}
            title="Broadcast Live Spot Rate on WhatsApp"
            className="hidden sm:flex items-center space-x-1 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-[11px] font-bold px-2 py-0.5 rounded transition-all"
          >
            <MessageSquare className="w-3 h-3 text-emerald-400" />
            <span>WhatsApp Rate</span>
          </button>

          <button
            onClick={toggleSimulator}
            title={simulatorActive ? t.simulatorOn : t.simulatorOff}
            className={`text-[11px] font-semibold px-2 py-0.5 rounded border transition-colors flex items-center space-x-1 ${
              simulatorActive
                ? 'bg-cyan-500/20 border-cyan-500/40 text-cyan-300 hover:bg-cyan-500/30'
                : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700'
            }`}
          >
            <Sparkles className="w-3 h-3" />
            <span className="hidden lg:inline">
              {simulatorActive ? 'Live Simulator ON' : 'Simulator Paused'}
            </span>
          </button>


        </div>
      </div>

      {/* Right Tools & Controls */}
      <div className="flex items-center space-x-2 sm:space-x-3">
        {/* Quick Trade Buttons */}
        <button
          onClick={() => setActiveTab('buy')}
          className="hidden sm:flex items-center space-x-1.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white text-xs font-semibold px-3 py-1.5 rounded-lg shadow-md shadow-cyan-500/20 transition-all hover:scale-105 active:scale-95"
        >
          <ShoppingCart className="w-3.5 h-3.5" />
          <span>{t.quickBuy}</span>
        </button>

        <button
          onClick={() => setActiveTab('sell')}
          className="hidden sm:flex items-center space-x-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-emerald-400 text-xs font-semibold px-3 py-1.5 rounded-lg transition-all hover:scale-105 active:scale-95"
        >
          <TrendingUp className="w-3.5 h-3.5" />
          <span>{t.quickSell}</span>
        </button>

        {/* Undo Trade Button (Feature 12) */}
        {lastTransaction && Date.now() - lastTransaction.timestamp < 300000 && (
          <button
            onClick={handleUndo}
            className="flex items-center space-x-1 bg-amber-500/20 border border-amber-500/40 text-amber-300 hover:bg-amber-500/30 text-xs font-medium px-2.5 py-1.5 rounded-lg transition-all"
            title={t.undoWindow}
          >
            <Clock className="w-3.5 h-3.5 animate-spin-slow" />
            <span className="hidden md:inline">{t.undoLastTrade}</span>
          </button>
        )}

        {/* Trader Account Auth Controls */}
        {currentUser ? (
          <div className="flex items-center space-x-1.5 sm:space-x-2 bg-slate-900 border border-slate-700 rounded-lg px-2 sm:px-2.5 py-1">
            <div className="flex items-center space-x-1 sm:space-x-1.5 text-xs font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0"></span>
              <span className="text-white font-bold max-w-[75px] sm:max-w-[150px] truncate">{currentUser.fullName}</span>
              <span className="text-cyan-400 font-mono text-[11px] hidden sm:inline">({formatINR(currentUser.walletBalance)})</span>
            </div>
            <button
              onClick={logoutUser}
              title="Logout Session"
              className="p-1 text-slate-400 hover:text-rose-400 transition-colors shrink-0"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <button
            onClick={() => setAuthModalOpen(true)}
            className="flex items-center space-x-1.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black text-xs px-3 py-1.5 rounded-lg transition-all shadow-md shadow-cyan-500/20 active:scale-95"
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>Sign In / Register</span>
          </button>
        )}



        {/* Notification Bell */}
        <div className="relative">
          <button
            onClick={() => setNotificationsOpen(!notificationsOpen)}
            className="relative p-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-slate-300 hover:text-white transition-colors"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-bounce">
                {unreadCount}
              </span>
            )}
          </button>

          {/* Notifications Drawer */}
          <AnimatePresence>
            {notificationsOpen && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                className="absolute right-0 mt-2 w-80 sm:w-96 bg-[#111827] border border-slate-800 rounded-xl shadow-2xl z-50 overflow-hidden"
              >
                <div className="px-4 py-3 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Bell className="w-4 h-4 text-cyan-400" />
                    <span className="text-xs font-bold text-white">Live Notifications</span>
                  </div>
                  {notifications.length > 0 && (
                    <button
                      onClick={clearNotifications}
                      className="text-[11px] text-slate-400 hover:text-rose-400 transition-colors"
                    >
                      Clear all
                    </button>
                  )}
                </div>

                <div className="max-h-80 overflow-y-auto divide-y divide-slate-800/60">
                  {notifications.length === 0 ? (
                    <div className="p-6 text-center text-xs text-slate-500">
                      No notifications yet.
                    </div>
                  ) : (
                    notifications.map((n, idx) => (
                      <div
                        key={`${n.id}-${idx}`}
                        onClick={() => markNotificationRead(n.id)}
                        className={`p-3 text-xs hover:bg-slate-800/50 transition-colors cursor-pointer ${
                          !n.read ? 'bg-cyan-500/5 border-l-2 border-cyan-400' : ''
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-semibold text-slate-200">{n.title}</span>
                          <span className="text-[10px] text-slate-500">
                            {new Date(n.timestamp).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>
                        <p className="text-slate-400 leading-relaxed">{n.message}</p>
                      </div>
                    ))
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Security Lock Button */}
        <button
          onClick={() => setPinModalOpen(true)}
          className="p-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-slate-300 hover:text-cyan-400 transition-colors"
          title={t.pinLock}
        >
          <Lock className="w-4 h-4" />
        </button>
      </div>

      {/* Undo Message Notification Banner */}
      {undoMessage && (
        <div className="fixed bottom-4 right-4 z-50 bg-emerald-950 border border-emerald-500/50 text-emerald-200 text-xs px-4 py-3 rounded-xl shadow-2xl flex items-center space-x-2 animate-bounce">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{undoMessage}</span>
        </div>
      )}
    </header>
  );
};
