import React, { createContext, useContext, useState, useEffect, useMemo, ReactNode } from 'react';
import {
  User,
  MarketPricePoint,
  PurchaseRecord,
  SellRecord,
  ActiveHolding,
  PriceAlertRule,
  NotificationItem,
  DateFilter,
  ActiveTab,
  Language,
} from '../types';
import {
  initialUsers,
  initialMarketPriceHistory,
  initialPurchases,
  initialSales,
  initialAlerts,
  initialNotifications,
} from '../data/initialData';

interface AppContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  users: User[];
  addUser: (user: Omit<User, 'id' | 'createdAt'>) => User;
  updateUserWallet: (userId: string, newBalance: number) => void;
  updateUser: (userId: string, updatedData: Partial<User>) => void;
  deleteUser: (userId: string) => { success: boolean; message: string };
  
  marketPriceHistory: MarketPricePoint[];
  currentSpotPrice: MarketPricePoint;
  simulatorActive: boolean;
  toggleSimulator: () => void;
  setSpotPriceManual: (price: number) => void;

  purchases: PurchaseRecord[];
  sales: SellRecord[];
  activeHoldings: ActiveHolding[];

  executeBuyTrade: (params: {
    userId: string;
    quantityKg: number;
    pricePerKg: number;
    note?: string;
  }) => { success: boolean; message: string; purchaseId?: string };

  executeSellTrade: (params: {
    userId: string;
    purchaseId: string;
    quantityKg: number;
    sellPricePerKg: number;
    note?: string;
  }) => { success: boolean; message: string; sellId?: string };

  undoLastTrade: () => { success: boolean; message: string };
  lastTransaction: { type: 'BUY' | 'SELL'; purchaseId?: string; sellId?: string; timestamp: number } | null;

  selectedUserId: string; // 'ALL' or specific user ID
  setSelectedUserId: (id: string) => void;

  dateFilter: DateFilter;
  setDateFilter: (filter: DateFilter) => void;

  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;

  alerts: PriceAlertRule[];
  addAlert: (targetPrice: number, condition: 'ABOVE' | 'BELOW', note?: string) => void;
  toggleAlert: (id: string) => void;
  deleteAlert: (id: string) => void;

  notifications: NotificationItem[];
  markNotificationRead: (id: string) => void;
  clearNotifications: () => void;

  pinModalOpen: boolean;
  setPinModalOpen: (open: boolean) => void;
  activeProfileUserId: string | null;
  setActiveProfileUserId: (id: string | null) => void;

  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  toggleSidebar: () => void;

  authModalOpen: boolean;
  setAuthModalOpen: (open: boolean) => void;
  currentUser: User | null;
  loginUser: (identifier: string, pin: string) => Promise<{ success: boolean; message: string }>;
  signupUser: (userData: Omit<User, 'id' | 'createdAt'>) => Promise<{ success: boolean; message: string }>;
  logoutUser: () => void;

  importBulkData: (newUsers: Omit<User, 'id' | 'createdAt'>[], newPurchases: { userId: string; quantityKg: number; pricePerKg: number; note?: string }[]) => { usersAdded: number; purchasesAdded: number };
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const STORAGE_KEY = 'ALUTRADE_PRO_STATE_V1';

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Try loading from localStorage
  const savedState = useMemo(() => {
    try {
      const item = localStorage.getItem(STORAGE_KEY);
      return item ? JSON.parse(item) : null;
    } catch {
      return null;
    }
  }, []);

  const [language, setLanguage] = useState<Language>(savedState?.language || 'EN');
  const [users, setUsers] = useState<User[]>(savedState?.users || initialUsers);
  const [marketPriceHistory, setMarketPriceHistory] = useState<MarketPricePoint[]>(
    savedState?.marketPriceHistory || initialMarketPriceHistory
  );
  const [simulatorActive, setSimulatorActive] = useState<boolean>(savedState?.simulatorActive ?? true);
  const [purchases, setPurchases] = useState<PurchaseRecord[]>(savedState?.purchases || initialPurchases);
  const [sales, setSales] = useState<SellRecord[]>(savedState?.sales || initialSales);
  const [alerts, setAlerts] = useState<PriceAlertRule[]>(savedState?.alerts || initialAlerts);
  const [notifications, setNotifications] = useState<NotificationItem[]>(() => {
    const raw: NotificationItem[] = savedState?.notifications || initialNotifications;
    const seen = new Set<string>();
    return raw.map((item, idx) => {
      let id = item.id;
      if (seen.has(id)) {
        id = `${id}-${idx}-${Math.random().toString(36).substring(2, 6)}`;
      }
      seen.add(id);
      return { ...item, id };
    });
  });

  const [selectedUserId, setSelectedUserId] = useState<string>('ALL');
  const [dateFilter, setDateFilter] = useState<DateFilter>({ type: 'ALL' });
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [pinModalOpen, setPinModalOpen] = useState<boolean>(false);
  const [activeProfileUserId, setActiveProfileUserId] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(() =>
    typeof window !== 'undefined' ? window.innerWidth >= 768 : true
  );
  const [authModalOpen, setAuthModalOpen] = useState<boolean>(false);
  const [currentUser, setCurrentUser] = useState<User | null>(() => savedState?.currentUser || null);

  const toggleSidebar = () => setSidebarOpen((prev) => !prev);

  const [lastTransaction, setLastTransaction] = useState<{
    type: 'BUY' | 'SELL';
    purchaseId?: string;
    sellId?: string;
    timestamp: number;
  } | null>(savedState?.lastTransaction || null);

  // Latest spot price point
  const currentSpotPrice = useMemo(() => {
    if (marketPriceHistory.length === 0) {
      return { id: 'P-DEF', pricePerKg: 600, timestamp: new Date().toISOString(), change24h: 0, high24h: 600, low24h: 600, source: 'SYSTEM' as const };
    }
    return marketPriceHistory[marketPriceHistory.length - 1];
  }, [marketPriceHistory]);

  // Save to localStorage when critical state changes
  useEffect(() => {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          language,
          users,
          marketPriceHistory,
          simulatorActive,
          purchases,
          sales,
          alerts,
          notifications,
          lastTransaction,
        })
      );
    } catch (e) {
      console.error('Failed to save state to localStorage:', e);
    }
  }, [language, users, marketPriceHistory, simulatorActive, purchases, sales, alerts, notifications, lastTransaction]);

  // Fetch and poll server state to sync users & trades across all connected devices (Laptop, Mobile, Desktop)
  useEffect(() => {
    let isSubscribed = true;

    async function syncWithServer() {
      try {
        const [usersRes, purchasesRes, salesRes] = await Promise.all([
          fetch('/api/users'),
          fetch('/api/purchases'),
          fetch('/api/sales')
        ]);

        if (!isSubscribed) return;

        if (usersRes.ok) {
          const uData = await usersRes.json();
          if (Array.isArray(uData)) {
            setUsers(uData);
          }
        }
        if (purchasesRes.ok) {
          const pData = await purchasesRes.json();
          if (Array.isArray(pData)) {
            setPurchases(pData);
          }
        }
        if (salesRes.ok) {
          const sData = await salesRes.json();
          if (Array.isArray(sData)) {
            setSales(sData);
          }
        }
      } catch (err) {
        // Fallback to local storage state if server is unreachable
      }
    }

    syncWithServer();
    const syncInterval = setInterval(syncWithServer, 4000);

    return () => {
      isSubscribed = false;
      clearInterval(syncInterval);
    };
  }, []);

  // Market Price Simulator interval (Globally synchronized across all devices)
  useEffect(() => {
    if (!simulatorActive) return;

    const interval = setInterval(() => {
      const nowMs = Date.now();
      const timeSec = Math.floor(nowMs / 5000);
      const wave1 = Math.sin(timeSec * 0.08) * 8.5;
      const wave2 = Math.cos(timeSec * 0.02) * 14.2;
      const wave3 = Math.sin(timeSec * 0.005) * 22.0;
      
      const rawPrice = 600 + wave1 + wave2 + wave3;
      const syncedPrice = Number(Math.max(450, Math.min(900, rawPrice)).toFixed(2));
      const syncedChange = Number((Math.sin(timeSec * 0.015) * 2.8).toFixed(2));

      setMarketPriceHistory((prev) => {
        const last = prev[prev.length - 1];
        if (last && last.pricePerKg === syncedPrice) return prev;

        const newPoint: MarketPricePoint = {
          id: `P-SYNC-${timeSec}`,
          pricePerKg: syncedPrice,
          timestamp: new Date(nowMs).toISOString(),
          change24h: syncedChange,
          high24h: 644.70,
          low24h: 561.80,
          source: 'SIMULATOR',
        };

        // Asynchronously check alerts to keep state updater pure
        queueMicrotask(() => {
          alerts.forEach((rule, idx) => {
            if (rule.active) {
              if (
                (rule.condition === 'ABOVE' && syncedPrice >= rule.targetPrice) ||
                (rule.condition === 'BELOW' && syncedPrice <= rule.targetPrice)
              ) {
                const alertMsg = `Spot price reached ₹${syncedPrice}/kg (${rule.condition} target ₹${rule.targetPrice}/kg)`;
                setNotifications((n) => {
                  // Avoid spamming duplicate message within 10 seconds
                  if (
                    n.length > 0 &&
                    n[0].message === alertMsg &&
                    Date.now() - new Date(n[0].timestamp).getTime() < 10000
                  ) {
                    return n;
                  }
                  return [
                    {
                      id: `NOTIF-${Date.now()}-${idx}-${Math.random().toString(36).substring(2, 7)}`,
                      title: '🔔 Price Alert Triggered!',
                      message: alertMsg,
                      type: 'PRICE_ALERT',
                      timestamp: new Date().toISOString(),
                      read: false,
                    },
                    ...n,
                  ];
                });
              }
            }
          });
        });

        // Keep last 50 points
        return [...prev.slice(-49), newPoint];
      });
    }, 5000);

    return () => clearInterval(interval);
  }, [simulatorActive, alerts]);

  // Compute Active Unsold Holdings
  const activeHoldings = useMemo<ActiveHolding[]>(() => {
    return purchases
      .filter((p) => p.unsoldQuantityKg > 0)
      .map((p) => {
        const costBasis = p.unsoldQuantityKg * p.pricePerKg;
        const currentVal = p.unsoldQuantityKg * currentSpotPrice.pricePerKg;
        const unrealized = currentVal - costBasis;
        const roi = costBasis > 0 ? (unrealized / costBasis) * 100 : 0;

        return {
          purchaseId: p.purchaseId,
          userId: p.userId,
          userName: p.userName,
          purchaseDate: p.purchaseDate,
          originalQuantityKg: p.quantityKg,
          remainingQuantityKg: p.unsoldQuantityKg,
          buyPricePerKg: p.pricePerKg,
          currentMarketPricePerKg: currentSpotPrice.pricePerKg,
          totalCostBasis: costBasis,
          currentMarketValue: currentVal,
          unrealizedPnL: unrealized,
          unrealizedPnLPercent: roi,
        };
      });
  }, [purchases, currentSpotPrice]);

  const toggleSimulator = () => setSimulatorActive((prev) => !prev);

  const setSpotPriceManual = (price: number) => {
    const newPoint: MarketPricePoint = {
      id: `P-MAN-${Date.now()}`,
      pricePerKg: price,
      timestamp: new Date().toISOString(),
      change24h: 0,
      high24h: Math.max(currentSpotPrice.high24h || price, price),
      low24h: Math.min(currentSpotPrice.low24h || price, price),
      source: 'ADMIN',
    };
    setMarketPriceHistory((prev) => [...prev, newPoint]);
  };

  const addUser = (userData: Omit<User, 'id' | 'createdAt'>) => {
    const newUser: User = {
      ...userData,
      id: `USR-${1001 + users.length}`,
      createdAt: new Date().toISOString(),
    };
    setUsers((prev) => [...prev, newUser]);
    fetch('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newUser),
    }).catch((e) => console.log('PostgreSQL user sync error:', e));
    return newUser;
  };

  const updateUserWallet = (userId: string, newBalance: number) => {
    setUsers((prev) => {
      const updated = prev.map((u) => (u.id === userId ? { ...u, walletBalance: newBalance } : u));
      const targetUser = updated.find((u) => u.id === userId);
      if (targetUser) {
        fetch('/api/users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(targetUser),
        }).catch((e) => console.log('PostgreSQL wallet sync error:', e));
      }
      return updated;
    });
  };

  const updateUser = (userId: string, updatedData: Partial<User>) => {
    setUsers((prev) => {
      const updated = prev.map((u) => (u.id === userId ? { ...u, ...updatedData } : u));
      const targetUser = updated.find((u) => u.id === userId);
      if (targetUser) {
        fetch('/api/users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(targetUser),
        }).catch((e) => console.log('PostgreSQL user update error:', e));
      }
      return updated;
    });

    if (updatedData.fullName) {
      const newName = updatedData.fullName;
      setPurchases((prev) => prev.map((p) => (p.userId === userId ? { ...p, userName: newName } : p)));
      setSales((prev) => prev.map((s) => (s.userId === userId ? { ...s, userName: newName } : s)));
      if (currentUser && currentUser.id === userId) {
        setCurrentUser((prev) => (prev ? { ...prev, fullName: newName } : null));
      }
    }
  };

  const deleteUser = (userId: string) => {
    const user = users.find((u) => u.id === userId);
    if (!user) return { success: false, message: 'User not found.' };

    setUsers((prev) => prev.filter((u) => u.id !== userId));

    fetch(`/api/users/${userId}`, {
      method: 'DELETE',
    }).catch((e) => console.log('PostgreSQL user delete error:', e));

    if (selectedUserId === userId) {
      setSelectedUserId('ALL');
    }

    return { success: true, message: `Trader ${user.fullName} deleted successfully.` };
  };

  // Execute Buy Trade
  const executeBuyTrade = ({
    userId,
    quantityKg,
    pricePerKg,
    note,
  }: {
    userId: string;
    quantityKg: number;
    pricePerKg: number;
    note?: string;
  }) => {
    const user = users.find((u) => u.id === userId);
    if (!user) return { success: false, message: 'User not found.' };

    const subtotal = quantityKg * pricePerKg;
    const taxAmount = 0;
    const platformFee = 0;
    const totalAmount = subtotal;

    if (user.walletBalance < totalAmount) {
      return {
        success: false,
        message: `Insufficient wallet balance. Required: ₹${totalAmount.toFixed(
          2
        )}, Available: ₹${user.walletBalance.toFixed(2)}`,
      };
    }

    const newPurchaseId = `BUY-${Math.floor(80000 + Math.random() * 19000)}`;

    const newPurchase: PurchaseRecord = {
      purchaseId: newPurchaseId,
      userId,
      userName: user.fullName,
      purchaseDate: new Date().toISOString(),
      quantityKg,
      pricePerKg,
      subtotal,
      taxAmount,
      platformFee,
      totalAmount,
      unsoldQuantityKg: quantityKg,
      status: 'COMPLETED',
      note,
    };

    // Deduct from wallet
    updateUserWallet(userId, user.walletBalance - totalAmount);

    setPurchases((prev) => [newPurchase, ...prev]);

    // Async push to PostgreSQL
    fetch('/api/purchases', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newPurchase),
    }).catch((e) => console.log('PostgreSQL purchase sync error:', e));

    // Record last transaction for Undo
    setLastTransaction({
      type: 'BUY',
      purchaseId: newPurchaseId,
      timestamp: Date.now(),
    });

    // Notification
    setNotifications((prev) => [
      {
        id: `NOTIF-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        title: '🛒 Buy Order Executed',
        message: `${user.fullName} purchased ${quantityKg} Kg Aluminum @ ₹${pricePerKg}/kg (Total: ₹${totalAmount.toFixed(
          2
        )})`,
        type: 'TRADE_BUY',
        timestamp: new Date().toISOString(),
        read: false,
      },
      ...prev,
    ]);

    return {
      success: true,
      message: `Purchased ${quantityKg} Kg Aluminum successfully!`,
      purchaseId: newPurchaseId,
    };
  };

  // Execute Sell Trade
  const executeSellTrade = ({
    userId,
    purchaseId,
    quantityKg,
    sellPricePerKg,
    note,
  }: {
    userId: string;
    purchaseId: string;
    quantityKg: number;
    sellPricePerKg: number;
    note?: string;
  }) => {
    const user = users.find((u) => u.id === userId);
    if (!user) return { success: false, message: 'User not found.' };

    const purchase = purchases.find((p) => p.purchaseId === purchaseId);
    if (!purchase) return { success: false, message: 'Target purchase lot not found.' };

    if (purchase.unsoldQuantityKg < quantityKg) {
      return {
        success: false,
        message: `Cannot sell ${quantityKg} Kg. Only ${purchase.unsoldQuantityKg} Kg available in lot ${purchaseId}.`,
      };
    }

    const totalBuyAmount = quantityKg * purchase.pricePerKg;
    const totalSellAmount = quantityKg * sellPricePerKg;
    const realizedPnL = totalSellAmount - totalBuyAmount;
    const pnlPercentage = totalBuyAmount > 0 ? (realizedPnL / totalBuyAmount) * 100 : 0;

    const newSellId = `SEL-${Math.floor(90000 + Math.random() * 9000)}`;

    const newSell: SellRecord = {
      sellId: newSellId,
      userId,
      userName: user.fullName,
      purchaseId,
      sellDate: new Date().toISOString(),
      quantityKg,
      originalBuyPricePerKg: purchase.pricePerKg,
      sellPricePerKg,
      totalBuyAmount,
      totalSellAmount,
      realizedPnL,
      pnlPercentage,
      note,
    };

    // Update Purchase Lot unsold stock
    const remainingUnsold = purchase.unsoldQuantityKg - quantityKg;
    const newStatus =
      remainingUnsold === 0
        ? 'FULLY_SOLD'
        : remainingUnsold < purchase.quantityKg
        ? 'PARTIALLY_SOLD'
        : 'COMPLETED';

    setPurchases((prev) =>
      prev.map((p) =>
        p.purchaseId === purchaseId
          ? { ...p, unsoldQuantityKg: remainingUnsold, status: newStatus }
          : p
      )
    );

    setSales((prev) => [newSell, ...prev]);

    // Async push to PostgreSQL
    fetch('/api/sales', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newSell),
    }).catch((e) => console.log('PostgreSQL sale sync error:', e));

    fetch('/api/purchases', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...purchase,
        unsoldQuantityKg: remainingUnsold,
        status: newStatus,
      }),
    }).catch((e) => console.log('PostgreSQL purchase update error:', e));

    // Credit user's wallet
    updateUserWallet(userId, user.walletBalance + totalSellAmount);

    // Record last transaction for Undo
    setLastTransaction({
      type: 'SELL',
      sellId: newSellId,
      purchaseId,
      timestamp: Date.now(),
    });

    // Notification
    const pnlSign = realizedPnL >= 0 ? '+' : '';
    setNotifications((prev) => [
      {
        id: `NOTIF-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        title: '💰 Sell Order Executed',
        message: `${user.fullName} sold ${quantityKg} Kg @ ₹${sellPricePerKg}/kg. Realized P&L: ${pnlSign}₹${realizedPnL.toFixed(
          2
        )} (${pnlPercentage.toFixed(2)}%)`,
        type: 'TRADE_SELL',
        timestamp: new Date().toISOString(),
        read: false,
      },
      ...prev,
    ]);

    return {
      success: true,
      message: `Sold ${quantityKg} Kg Aluminum for ₹${totalSellAmount.toFixed(2)} (${pnlSign}₹${realizedPnL.toFixed(2)} P&L)!`,
      sellId: newSellId,
    };
  };

  // Undo Last Trade Feature (Feature 12)
  const undoLastTrade = () => {
    if (!lastTransaction) return { success: false, message: 'No recent trade to undo.' };

    const elapsedMs = Date.now() - lastTransaction.timestamp;
    if (elapsedMs > 5 * 60 * 1000) {
      return { success: false, message: 'Undo window expired (5 minutes max).' };
    }

    if (lastTransaction.type === 'BUY' && lastTransaction.purchaseId) {
      const targetBuy = purchases.find((p) => p.purchaseId === lastTransaction.purchaseId);
      if (!targetBuy) return { success: false, message: 'Trade record not found.' };

      // Refund user wallet
      const user = users.find((u) => u.id === targetBuy.userId);
      if (user) {
        updateUserWallet(user.id, user.walletBalance + targetBuy.totalAmount);
      }

      // Remove purchase record
      setPurchases((prev) => prev.filter((p) => p.purchaseId !== lastTransaction.purchaseId));
      setLastTransaction(null);

      setNotifications((prev) => [
        {
          id: `NOTIF-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          title: '🔄 Trade Undone',
          message: `Reversed Buy trade ${targetBuy.purchaseId}. Refunded ₹${targetBuy.totalAmount.toFixed(2)} to ${targetBuy.userName}.`,
          type: 'UNDO',
          timestamp: new Date().toISOString(),
          read: false,
        },
        ...prev,
      ]);

      return { success: true, message: `Successfully undone Buy order ${targetBuy.purchaseId}. Wallet refunded.` };
    }

    if (lastTransaction.type === 'SELL' && lastTransaction.sellId) {
      const targetSell = sales.find((s) => s.sellId === lastTransaction.sellId);
      if (!targetSell) return { success: false, message: 'Sell record not found.' };

      // Deduct sold payout from user wallet
      const user = users.find((u) => u.id === targetSell.userId);
      if (user) {
        updateUserWallet(user.id, user.walletBalance - targetSell.totalSellAmount);
      }

      // Restore unsold quantity back to purchase lot
      setPurchases((prev) =>
        prev.map((p) => {
          if (p.purchaseId === targetSell.purchaseId) {
            const restoredUnsold = p.unsoldQuantityKg + targetSell.quantityKg;
            return {
              ...p,
              unsoldQuantityKg: restoredUnsold,
              status: restoredUnsold === p.quantityKg ? 'COMPLETED' : 'PARTIALLY_SOLD',
            };
          }
          return p;
        })
      );

      // Remove sell record
      setSales((prev) => prev.filter((s) => s.sellId !== lastTransaction.sellId));
      setLastTransaction(null);

      setNotifications((prev) => [
        {
          id: `NOTIF-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          title: '🔄 Trade Undone',
          message: `Reversed Sell trade ${targetSell.sellId}. Restored ${targetSell.quantityKg} Kg stock back to inventory.`,
          type: 'UNDO',
          timestamp: new Date().toISOString(),
          read: false,
        },
        ...prev,
      ]);

      return { success: true, message: `Successfully undone Sell order ${targetSell.sellId}. Inventory restored.` };
    }

    return { success: false, message: 'Unable to process undo.' };
  };

  const addAlert = (targetPrice: number, condition: 'ABOVE' | 'BELOW', note?: string) => {
    const newAlert: PriceAlertRule = {
      id: `ALT-${Date.now()}`,
      targetPrice,
      condition,
      active: true,
      createdAt: new Date().toISOString(),
      note,
    };
    setAlerts((prev) => [newAlert, ...prev]);
  };

  const toggleAlert = (id: string) => {
    setAlerts((prev) =>
      prev.map((a) => (a.id === id ? { ...a, active: !a.active } : a))
    );
  };

  const deleteAlert = (id: string) => {
    setAlerts((prev) => prev.filter((a) => a.id !== id));
  };

  const markNotificationRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const clearNotifications = () => setNotifications([]);

  const importBulkData = (
    newUsersData: Omit<User, 'id' | 'createdAt'>[],
    newPurchasesData: { userId: string; quantityKg: number; pricePerKg: number; note?: string }[]
  ) => {
    let usersAdded = 0;
    let purchasesAdded = 0;

    const createdUserMap: Record<string, string> = {};

    newUsersData.forEach((u) => {
      const created = addUser(u);
      createdUserMap[u.email] = created.id;
      usersAdded++;
    });

    newPurchasesData.forEach((p) => {
      const res = executeBuyTrade({
        userId: p.userId,
        quantityKg: p.quantityKg,
        pricePerKg: p.pricePerKg,
        note: p.note,
      });
      if (res.success) purchasesAdded++;
    });

    return { usersAdded, purchasesAdded };
  };

  return (
    <AppContext.Provider
      value={{
        language,
        setLanguage,
        users,
        addUser,
        updateUserWallet,
        updateUser,
        deleteUser,
        marketPriceHistory,
        currentSpotPrice,
        simulatorActive,
        toggleSimulator,
        setSpotPriceManual,
        purchases,
        sales,
        activeHoldings,
        executeBuyTrade,
        executeSellTrade,
        undoLastTrade,
        lastTransaction,
        selectedUserId,
        setSelectedUserId,
        dateFilter,
        setDateFilter,
        activeTab,
        setActiveTab,
        alerts,
        addAlert,
        toggleAlert,
        deleteAlert,
        notifications,
        markNotificationRead,
        clearNotifications,
        pinModalOpen,
        setPinModalOpen,
        activeProfileUserId,
        setActiveProfileUserId,
        sidebarOpen,
        setSidebarOpen,
        toggleSidebar,
        authModalOpen,
        setAuthModalOpen,
        currentUser,
        loginUser: async (identifier: string, pin: string) => {
          try {
            const res = await fetch('/api/auth/login', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ identifier, pin }),
            });
            const data = await res.json();
            if (res.ok && data.success && data.user) {
              setCurrentUser(data.user);
              setSelectedUserId(data.user.id);
              setAuthModalOpen(false);
              return { success: true, message: `Welcome back, ${data.user.fullName}!` };
            } else {
              // Local fallback match if offline
              const matched = users.find((u) => (u.email === identifier || u.phone === identifier || u.id === identifier) && u.pin === pin);
              if (matched) {
                setCurrentUser(matched);
                setSelectedUserId(matched.id);
                setAuthModalOpen(false);
                return { success: true, message: `Welcome back, ${matched.fullName}!` };
              }
              return { success: false, message: data.error || 'Invalid Email/Phone/ID or PIN.' };
            }
          } catch (err: any) {
            const matched = users.find((u) => (u.email === identifier || u.phone === identifier || u.id === identifier) && u.pin === pin);
            if (matched) {
              setCurrentUser(matched);
              setSelectedUserId(matched.id);
              setAuthModalOpen(false);
              return { success: true, message: `Welcome back, ${matched.fullName}!` };
            }
            return { success: false, message: `Login failed: ${err.message}` };
          }
        },
        signupUser: async (userData: Omit<User, 'id' | 'createdAt'>) => {
          try {
            const res = await fetch('/api/auth/signup', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(userData),
            });
            const data = await res.json();
            if (res.ok && data.success && data.user) {
              const newU = addUser(data.user);
              setCurrentUser(data.user);
              setSelectedUserId(data.user.id);
              setAuthModalOpen(false);
              return { success: true, message: `Account created successfully for ${data.user.fullName}!` };
            } else {
              const created = addUser(userData);
              setCurrentUser(created);
              setSelectedUserId(created.id);
              setAuthModalOpen(false);
              return { success: true, message: `Registered ${created.fullName} successfully!` };
            }
          } catch (err: any) {
            const created = addUser(userData);
            setCurrentUser(created);
            setSelectedUserId(created.id);
            setAuthModalOpen(false);
            return { success: true, message: `Registered ${created.fullName} successfully!` };
          }
        },
        logoutUser: () => {
          setCurrentUser(null);
          setSelectedUserId('ALL');
        },
        importBulkData,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
