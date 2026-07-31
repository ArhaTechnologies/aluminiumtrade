import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { DashboardView } from './components/views/DashboardView';
import { MarketView } from './components/views/MarketView';
import { BuyView } from './components/views/BuyView';
import { SellView } from './components/views/SellView';
import { HoldingsView } from './components/views/HoldingsView';
import { LedgerView } from './components/views/LedgerView';
import { UserManagementView } from './components/views/UserManagementView';
import { UserProfileView } from './components/views/UserProfileView';
import { PnLReportView } from './components/views/PnLReportView';
import { ProfitCalculatorView } from './components/views/ProfitCalculatorView';
import { LeaderboardView } from './components/views/LeaderboardView';
import { AlertsView } from './components/views/AlertsView';
import { ReportsExportView } from './components/views/ReportsExportView';
import { DatabaseView } from './components/views/DatabaseView';
import { AiAnalystView } from './components/views/AiAnalystView';
import { AuthPinModal } from './components/modals/AuthPinModal';
import { AuthModal } from './components/modals/AuthModal';

const MainContent: React.FC = () => {
  const { activeTab } = useApp();

  return (
    <main className="flex-1 w-full overflow-y-auto pb-6 bg-[#0B0F19]">
      {activeTab === 'dashboard' && <DashboardView />}
      {activeTab === 'ai' && <AiAnalystView />}
      {activeTab === 'market' && <MarketView />}
      {activeTab === 'buy' && <BuyView />}
      {activeTab === 'sell' && <SellView />}
      {activeTab === 'holdings' && <HoldingsView />}
      {activeTab === 'ledger' && <LedgerView />}
      {activeTab === 'users' && <UserManagementView />}
      {activeTab === 'user_profile' && <UserProfileView />}
      {activeTab === 'pnl_report' && <PnLReportView />}
      {activeTab === 'calculator' && <ProfitCalculatorView />}
      {activeTab === 'leaderboard' && <LeaderboardView />}
      {activeTab === 'alerts' && <AlertsView />}
      {activeTab === 'reports' && <ReportsExportView />}
      {activeTab === 'database' && <DatabaseView />}
    </main>
  );
};

export default function App() {
  return (
    <AppProvider>
      <div className="min-h-screen bg-[#0B0F19] text-slate-100 flex flex-col font-sans selection:bg-cyan-500 selection:text-slate-950">
        <Navbar />
        <div className="flex flex-1 relative w-full">
          <Sidebar />
          <MainContent />
        </div>
        <AuthPinModal />
        <AuthModal />
      </div>
    </AppProvider>
  );
}
