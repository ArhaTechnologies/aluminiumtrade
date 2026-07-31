import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { User, PurchaseRecord, SellRecord, ActiveHolding, MarketPricePoint } from '../types';
import { formatINR, formatDate } from './i18n';

interface ExportPdfParams {
  user?: User | null;
  purchases: PurchaseRecord[];
  sales: SellRecord[];
  holdings: ActiveHolding[];
  currentSpotPrice: MarketPricePoint;
  dateFilterLabel: string;
}

export const generatePdfReport = ({
  user,
  purchases,
  sales,
  holdings,
  currentSpotPrice,
  dateFilterLabel,
}: ExportPdfParams) => {
  const doc = new jsPDF('p', 'mm', 'a4');
  const timestamp = new Date().toLocaleString('en-IN');

  // Colors
  const darkBlue = '#0B0F19';
  const cyanAccent = '#06B6D4';
  const textDark = '#1E293B';

  // Header Banner
  doc.setFillColor(11, 15, 25); // #0B0F19
  doc.rect(0, 0, 210, 32, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.text('AluTrade PRO', 14, 15);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(6, 182, 212); // #06B6D4
  doc.text('Aluminum Trading & Analytics Platform — Official Statement', 14, 23);

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(8);
  doc.text(`Generated: ${timestamp}`, 145, 15);
  doc.text(`Scope: ${dateFilterLabel}`, 145, 21);
  doc.text(`Current Spot: ₹${currentSpotPrice.pricePerKg.toFixed(2)}/kg`, 145, 27);

  // User Section
  let startY = 40;
  doc.setTextColor(30, 41, 59);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  
  if (user) {
    doc.text(`Trader Profile: ${user.fullName} (${user.id})`, 14, startY);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(`Email: ${user.email} | Phone: ${user.phone} | KYC: ${user.kycId}`, 14, startY + 6);
    doc.text(`Wallet Balance: ${formatINR(user.walletBalance)}`, 14, startY + 11);
    startY += 18;
  } else {
    doc.text(`Consolidated Platform Portfolio Report (All Traders)`, 14, startY);
    startY += 10;
  }

  // Active Holdings Table
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(11, 15, 25);
  doc.text('1. Active Holdings & Inventory (Unsold Lots)', 14, startY);
  startY += 4;

  const holdingsRows = holdings.map((h) => [
    h.purchaseId,
    h.userName,
    formatDate(h.purchaseDate),
    `${h.remainingQuantityKg} Kg`,
    `₹${h.buyPricePerKg}/kg`,
    `₹${h.currentMarketPricePerKg}/kg`,
    formatINR(h.totalCostBasis),
    formatINR(h.currentMarketValue),
    `${h.unrealizedPnL >= 0 ? '+' : ''}${formatINR(h.unrealizedPnL)} (${h.unrealizedPnLPercent.toFixed(2)}%)`,
  ]);

  autoTable(doc, {
    startY,
    head: [['Lot ID', 'Trader', 'Date', 'Stock', 'Buy Price', 'Spot Price', 'Cost Basis', 'Market Value', 'Unrealized P&L']],
    body: holdingsRows.length ? holdingsRows : [['No active unsold inventory lots found', '', '', '', '', '', '', '', '']],
    styles: { fontSize: 8, cellPadding: 2 },
    headStyles: { fillColor: [11, 15, 25], textColor: [255, 255, 255], fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [241, 245, 249] },
  });

  // @ts-ignore
  startY = doc.lastAutoTable.finalY + 12;

  // Realized Sales Table
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('2. Realized Sales & Profit/Loss Ledger', 14, startY);
  startY += 4;

  const salesRows = sales.map((s) => [
    s.sellId,
    s.purchaseId,
    s.userName,
    formatDate(s.sellDate),
    `${s.quantityKg} Kg`,
    `₹${s.originalBuyPricePerKg}/kg`,
    `₹${s.sellPricePerKg}/kg`,
    formatINR(s.totalSellAmount),
    `${s.realizedPnL >= 0 ? '+' : ''}${formatINR(s.realizedPnL)} (${s.pnlPercentage.toFixed(2)}%)`,
  ]);

  autoTable(doc, {
    startY,
    head: [['Sell ID', 'Lot Ref', 'Trader', 'Sell Date', 'Qty', 'Buy Price', 'Sale Price', 'Total Sale', 'Realized P&L']],
    body: salesRows.length ? salesRows : [['No closed sales transactions recorded', '', '', '', '', '', '', '', '']],
    styles: { fontSize: 8, cellPadding: 2 },
    headStyles: { fillColor: [6, 182, 212], textColor: [255, 255, 255], fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [241, 245, 249] },
  });

  // @ts-ignore
  startY = doc.lastAutoTable.finalY + 12;

  // Purchases History Table
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('3. Complete Purchase Transactions History', 14, startY);
  startY += 4;

  const purchaseRows = purchases.map((p) => [
    p.purchaseId,
    p.userName,
    formatDate(p.purchaseDate),
    `${p.quantityKg} Kg`,
    `₹${p.pricePerKg}/kg`,
    formatINR(p.subtotal),
    formatINR(p.totalAmount),
    p.status,
  ]);

  autoTable(doc, {
    startY,
    head: [['Buy ID', 'Trader', 'Date', 'Qty', 'Unit Price', 'Subtotal', 'Total Payable', 'Status']],
    body: purchaseRows.length ? purchaseRows : [['No purchase records found', '', '', '', '', '', '', '']],
    styles: { fontSize: 8, cellPadding: 2 },
    headStyles: { fillColor: [30, 41, 59], textColor: [255, 255, 255], fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [241, 245, 249] },
  });

  // Footer
  const pageCount = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(100);
    doc.text(`AluTrade PRO System Generated Document — Page ${i} of ${pageCount}`, 14, 287);
    doc.text('Confidential - Commercial Commodities Trading Ledger', 130, 287);
  }

  doc.save(`AluTrade_PRO_Statement_${user ? user.id : 'All'}_${Date.now()}.pdf`);
};
