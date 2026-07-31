import React from 'react';
import { useApp } from '../context/AppContext';
import { translations } from '../lib/i18n';
import { ActiveTab } from '../types';
import {
  LayoutDashboard,
  TrendingUp,
  ShoppingCart,
  Coins,
  Boxes,
  FileSpreadsheet,
  Users,
  LineChart,
  Calculator,
  Trophy,
  Bell,
  UploadCloud,
  FileText,
  Database,
  ChevronRight,
  Sparkles,
  Brain,
  X,
} from 'lucide-react';

interface NavItem {
  id: ActiveTab;
  labelKey: string;
  icon: React.ElementType;
  badge?: string;
  badgeColor?: string;
}

export const Sidebar: React.FC = () => {
  const {
    activeTab,
    setActiveTab,
    language,
    activeHoldings,
    notifications,
    sidebarOpen,
    setSidebarOpen,
  } = useApp();

  const t = translations[language];

  if (!sidebarOpen) return null;

  const unreadAlerts = notifications.filter((n) => !n.read && n.type === 'PRICE_ALERT').length;

  const navItems: NavItem[] = [
    { id: 'dashboard', labelKey: 'dashboard', icon: LayoutDashboard },
    { id: 'ai', labelKey: 'ai', icon: Brain, badge: 'AI', badgeColor: 'bg-gradient-to-r from-cyan-500/30 to-purple-500/30 text-cyan-300 border border-cyan-500/40 font-black animate-pulse' },
    { id: 'market', labelKey: 'market', icon: TrendingUp, badge: 'LIVE', badgeColor: 'bg-cyan-500/20 text-cyan-400' },
    { id: 'buy', labelKey: 'buy', icon: ShoppingCart },
    { id: 'sell', labelKey: 'sell', icon: Coins },
    {
      id: 'holdings',
      labelKey: 'holdings',
      icon: Boxes,
      badge: activeHoldings.length ? `${activeHoldings.length}` : undefined,
      badgeColor: 'bg-emerald-500/20 text-emerald-400',
    },
    { id: 'ledger', labelKey: 'ledger', icon: FileSpreadsheet },
    { id: 'users', labelKey: 'users', icon: Users },
    { id: 'pnl_report', labelKey: 'pnlReport', icon: LineChart },
    { id: 'calculator', labelKey: 'calculator', icon: Calculator, badge: 'PRO', badgeColor: 'bg-indigo-500/20 text-indigo-400' },
    { id: 'leaderboard', labelKey: 'leaderboard', icon: Trophy },
    {
      id: 'alerts',
      labelKey: 'alerts',
      icon: Bell,
      badge: unreadAlerts > 0 ? `${unreadAlerts}` : undefined,
      badgeColor: 'bg-amber-500/20 text-amber-400',
    },
    { id: 'reports', labelKey: 'reports', icon: FileText },
  ];

  const handleSelectTab = (tabId: ActiveTab) => {
    setActiveTab(tabId);
    // On small screens, auto-close drawer after selecting an option
    if (window.innerWidth < 768) {
      setSidebarOpen(false);
    }
  };

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      <div
        onClick={() => setSidebarOpen(false)}
        className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-40 md:hidden"
      />

      {/* Sidebar Drawer Container */}
      <aside className="fixed inset-y-0 left-0 z-50 md:sticky md:top-[57px] w-64 h-full md:h-[calc(100vh-57px)] bg-[#0B0F19] border-r border-slate-800 flex flex-col justify-between shrink-0 shadow-2xl md:shadow-none transition-all duration-200">
        <div className="p-3 space-y-1 overflow-y-auto max-h-[calc(100vh-100px)]">
          {/* Header Mobile Close Bar */}
          <div className="flex items-center justify-between px-3 py-2 border-b border-slate-800/80 mb-2 md:hidden">
            <span className="text-xs font-bold text-slate-300">Navigation Menu</span>
            <button
              onClick={() => setSidebarOpen(false)}
              className="p-1 rounded-lg bg-slate-800 text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <p className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-500">
            Trading & Analytics
          </p>

          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            const label = t[item.labelKey] || item.labelKey;

            return (
              <button
                key={item.id}
                onClick={() => handleSelectTab(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all duration-150 group ${
                  isActive
                    ? 'bg-gradient-to-r from-cyan-500/20 to-blue-600/10 text-cyan-400 border border-cyan-500/30 shadow-lg shadow-cyan-500/5'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <Icon
                    className={`w-4 h-4 transition-transform group-hover:scale-110 ${
                      isActive ? 'text-cyan-400' : 'text-slate-500 group-hover:text-slate-300'
                    }`}
                  />
                  <span className="truncate">{label}</span>
                </div>

                <div className="flex items-center space-x-1.5">
                  {item.badge && (
                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md border border-current/20 ${item.badgeColor}`}
                    >
                      {item.badge}
                    </span>
                  )}
                  {isActive && <ChevronRight className="w-3.5 h-3.5 text-cyan-400" />}
                </div>
              </button>
            );
          })}
        </div>

        {/* Pro Features Footer Banner */}
        <div className="p-3 m-3 rounded-2xl bg-gradient-to-b from-slate-900 to-[#111827] border border-slate-800/90 text-center space-y-2 shrink-0">
          <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/20 mx-auto flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-cyan-400" />
          </div>
          <p className="text-xs font-bold text-slate-200">AluTrade Engine Active</p>
          <p className="text-[11px] text-slate-400 leading-tight">
            Real-time spot price monitoring, automated portfolio valuation & P&L tracking.
          </p>
        </div>
      </aside>
    </>
  );
};
