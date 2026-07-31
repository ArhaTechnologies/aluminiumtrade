import { PurchaseRecord, SellRecord, MarketPricePoint, User } from '../types';
import { formatINR, formatDate } from './i18n';

/**
 * Cleans phone number to international format without + or spaces
 * e.g., "+91 98765-43210" -> "919876543210"
 */
export function cleanPhoneNumber(phone?: string): string {
  if (!phone) return '';
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 10) {
    return '91' + digits; // Default to India country code if 10 digits
  }
  return digits;
}

/**
 * Launches WhatsApp Web or App with pre-filled message
 */
export function openWhatsAppShare(text: string, phone?: string) {
  const encodedText = encodeURIComponent(text);
  const cleanedPhone = cleanPhoneNumber(phone);
  
  let url = `https://api.whatsapp.com/send?text=${encodedText}`;
  if (cleanedPhone) {
    url = `https://wa.me/${cleanedPhone}?text=${encodedText}`;
  }
  
  window.open(url, '_blank', 'noopener,noreferrer');
}

/**
 * WhatsApp Message Generator for Purchase Invoices / Trade Slips
 */
export function sharePurchaseWhatsApp(purchase: PurchaseRecord, phone?: string) {
  const text = `📦 *ALUTRADE PRO — PURCHASE INVOICE SLIP*
----------------------------------------
*Receipt ID:* ${purchase.purchaseId}
*Trader:* ${purchase.userName}
*Date:* ${formatDate(purchase.purchaseDate)}

*Metal Details:*
• Quantity: *${purchase.quantityKg} Kg* (Aluminum Scrap/Ingot)
• Unit Rate: *₹${purchase.pricePerKg.toFixed(2)} / kg*
• Subtotal: ${formatINR(purchase.subtotal)}
----------------------------------------
*TOTAL AMOUNT PAID:* *${formatINR(purchase.totalAmount)}*
*Status:* ${purchase.status}
${purchase.note ? `*Notes:* ${purchase.note}` : ''}

_Generated via AluTrade PRO Metal Trading Platform_`;

  openWhatsAppShare(text, phone);
}

/**
 * WhatsApp Message Generator for Sale Trades & P&L Slips
 */
export function shareSaleWhatsApp(sell: SellRecord, phone?: string) {
  const isProfit = sell.realizedPnL >= 0;
  const text = `💰 *ALUTRADE PRO — SALE & P&L TRADE RECEIPT*
----------------------------------------
*Sell Trade ID:* ${sell.sellId}
*Lot Ref:* ${sell.purchaseId}
*Trader:* ${sell.userName}
*Date:* ${formatDate(sell.sellDate)}

*Trade Summary:*
• Quantity Sold: *${sell.quantityKg} Kg*
• Buy Rate: ₹${sell.originalBuyPricePerKg.toFixed(2)} / kg
• Sell Rate: *₹${sell.sellPricePerKg.toFixed(2)} / kg*
• Total Realized Revenue: *${formatINR(sell.totalSellAmount)}*
----------------------------------------
*NET REALIZED P&L:* *${isProfit ? '🟢 +' : '🔴 '}${formatINR(sell.realizedPnL)}* (${sell.pnlPercentage.toFixed(2)}% ROI)
${sell.note ? `*Buyer / Notes:* ${sell.note}` : ''}

_Generated via AluTrade PRO Metal Trading Platform_`;

  openWhatsAppShare(text, phone);
}

/**
 * WhatsApp Broadcast for Live Spot Rate Card
 */
export function shareSpotRateWhatsApp(spotPrice: MarketPricePoint, phone?: string) {
  const isUp = spotPrice.change24h >= 0;
  const text = `⚡ *ALUTRADE PRO — LIVE ALUMINUM SPOT RATE*
----------------------------------------
*Current Rate:* *₹${spotPrice.pricePerKg.toFixed(2)} / kg*
*24h Trend:* ${isUp ? '📈 +' : '📉 '}${spotPrice.change24h.toFixed(2)}%
*Market Status:* LIVE / ACTIVE
*Timestamp:* ${new Date(spotPrice.timestamp).toLocaleString('en-IN')}

_Trade physical Aluminum ingots & scrap at real-time market transparent rates on AluTrade PRO._`;

  openWhatsAppShare(text, phone);
}

/**
 * WhatsApp Share for Portfolio Statement
 */
export function sharePortfolioWhatsApp(
  user: User | null,
  holdingsCount: number,
  totalHoldingsKg: number,
  totalValue: number,
  phone?: string
) {
  const text = `📊 *ALUTRADE PRO — TRADER PORTFOLIO SUMMARY*
----------------------------------------
*Trader Name:* ${user ? user.fullName : 'All Platform Traders'}
*User ID:* ${user ? user.id : 'CONSOLIDATED'}

*Inventory Holdings:*
• Active Stock Lots: *${holdingsCount} Lots*
• Total Metal Volume: *${totalHoldingsKg.toLocaleString('en-IN')} Kg*
• Total Estimated Value: *${formatINR(totalValue)}*
${user ? `• Wallet Cash Balance: *${formatINR(user.walletBalance)}*` : ''}

_Get live metal analytics and automated audit logs on AluTrade PRO._`;

  openWhatsAppShare(text, phone);
}
