import { User, MarketPricePoint, PurchaseRecord, SellRecord, PriceAlertRule, NotificationItem } from '../types';

export const initialUsers: User[] = [];

export const initialMarketPriceHistory: MarketPricePoint[] = [
  { id: 'P-1', pricePerKg: 520, timestamp: '2026-07-23T10:00:00Z', change24h: 0, high24h: 530, low24h: 515, source: 'SYSTEM' },
  { id: 'P-2', pricePerKg: 535, timestamp: '2026-07-24T10:00:00Z', change24h: 2.88, high24h: 540, low24h: 520, source: 'SYSTEM' },
  { id: 'P-3', pricePerKg: 550, timestamp: '2026-07-25T10:00:00Z', change24h: 2.80, high24h: 555, low24h: 530, source: 'SYSTEM' },
  { id: 'P-4', pricePerKg: 542, timestamp: '2026-07-26T10:00:00Z', change24h: -1.45, high24h: 552, low24h: 538, source: 'SYSTEM' },
  { id: 'P-5', pricePerKg: 568, timestamp: '2026-07-27T10:00:00Z', change24h: 4.80, high24h: 572, low24h: 540, source: 'SYSTEM' },
  { id: 'P-6', pricePerKg: 585, timestamp: '2026-07-28T10:00:00Z', change24h: 2.99, high24h: 590, low24h: 565, source: 'SYSTEM' },
  { id: 'P-7', pricePerKg: 600, timestamp: '2026-07-29T10:00:00Z', change24h: 2.56, high24h: 610, low24h: 580, source: 'SIMULATOR' },
];

export const initialPurchases: PurchaseRecord[] = [];

export const initialSales: SellRecord[] = [];

export const initialAlerts: PriceAlertRule[] = [];

export const initialNotifications: NotificationItem[] = [];
