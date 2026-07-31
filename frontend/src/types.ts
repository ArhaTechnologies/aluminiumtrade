export type Language = 'EN' | 'HI';

export interface User {
  id: string;
  fullName: string;
  dob: string; // YYYY-MM-DD
  email: string;
  phone: string;
  kycId: string; // PAN / Govt ID
  walletBalance: number; // INR ₹
  createdAt: string;
  pin?: string; // 4-digit PIN for simple lock
}

export interface MarketPricePoint {
  id: string;
  pricePerKg: number;
  timestamp: string;
  change24h?: number;
  high24h?: number;
  low24h?: number;
  source: 'ADMIN' | 'SIMULATOR' | 'SYSTEM';
}

export interface PurchaseRecord {
  purchaseId: string;
  userId: string;
  userName: string;
  purchaseDate: string; // ISO String
  quantityKg: number;
  pricePerKg: number;
  subtotal: number;
  taxAmount: number; // 18% GST
  platformFee: number;
  totalAmount: number;
  unsoldQuantityKg: number; // Remaining stock for this lot
  status: 'COMPLETED' | 'PARTIALLY_SOLD' | 'FULLY_SOLD';
  note?: string;
}

export interface SellRecord {
  sellId: string;
  userId: string;
  userName: string;
  purchaseId: string;
  sellDate: string; // ISO String
  quantityKg: number;
  originalBuyPricePerKg: number;
  sellPricePerKg: number;
  totalBuyAmount: number;
  totalSellAmount: number;
  realizedPnL: number; // + Profit / - Loss
  pnlPercentage: number;
  note?: string;
}

export interface ActiveHolding {
  purchaseId: string;
  userId: string;
  userName: string;
  purchaseDate: string;
  originalQuantityKg: number;
  remainingQuantityKg: number;
  buyPricePerKg: number;
  currentMarketPricePerKg: number;
  totalCostBasis: number;
  currentMarketValue: number;
  unrealizedPnL: number;
  unrealizedPnLPercent: number;
}

export interface PriceAlertRule {
  id: string;
  targetPrice: number;
  condition: 'ABOVE' | 'BELOW';
  active: boolean;
  createdAt: string;
  triggeredAt?: string;
  note?: string;
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: 'PRICE_ALERT' | 'TRADE_BUY' | 'TRADE_SELL' | 'SYSTEM' | 'UNDO';
  timestamp: string;
  read: boolean;
}

export interface DateFilter {
  type: 'TODAY' | '7DAYS' | '30DAYS' | 'ALL' | 'CUSTOM';
  startDate?: string;
  endDate?: string;
}

export type ActiveTab = 
  | 'dashboard' 
  | 'market' 
  | 'buy' 
  | 'sell' 
  | 'holdings' 
  | 'ledger' 
  | 'users' 
  | 'user_profile'
  | 'calculator' 
  | 'leaderboard' 
  | 'alerts' 
  | 'database'
  | 'ai';
