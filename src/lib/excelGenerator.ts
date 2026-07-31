import * as XLSX from 'xlsx';
import { User, PurchaseRecord, SellRecord, ActiveHolding } from '../types';

interface ExportExcelParams {
  users: User[];
  purchases: PurchaseRecord[];
  sales: SellRecord[];
  holdings: ActiveHolding[];
}

export const generateExcelReport = ({
  users,
  purchases,
  sales,
  holdings,
}: ExportExcelParams) => {
  const workbook = XLSX.utils.book_new();

  // 1. Active Holdings Sheet
  const holdingsData = holdings.map((h) => ({
    'Lot ID': h.purchaseId,
    'User ID': h.userId,
    'Trader Name': h.userName,
    'Purchase Date': h.purchaseDate,
    'Unsold Stock (Kg)': h.remainingQuantityKg,
    'Original Qty (Kg)': h.originalQuantityKg,
    'Buy Price (₹/kg)': h.buyPricePerKg,
    'Current Spot Price (₹/kg)': h.currentMarketPricePerKg,
    'Cost Basis (₹)': h.totalCostBasis,
    'Current Value (₹)': h.currentMarketValue,
    'Unrealized P&L (₹)': h.unrealizedPnL,
    'Unrealized ROI (%)': h.unrealizedPnLPercent,
  }));
  const holdingsSheet = XLSX.utils.json_to_sheet(holdingsData);
  XLSX.utils.book_append_sheet(workbook, holdingsSheet, 'Active Holdings');

  // 2. Sales Ledger Sheet
  const salesData = sales.map((s) => ({
    'Sell ID': s.sellId,
    'Lot Reference': s.purchaseId,
    'User ID': s.userId,
    'Trader Name': s.userName,
    'Sell Timestamp': s.sellDate,
    'Quantity Sold (Kg)': s.quantityKg,
    'Original Buy Price (₹/kg)': s.originalBuyPricePerKg,
    'Sale Price (₹/kg)': s.sellPricePerKg,
    'Total Cost (₹)': s.totalBuyAmount,
    'Total Sale Amount (₹)': s.totalSellAmount,
    'Realized Profit/Loss (₹)': s.realizedPnL,
    'ROI (%)': s.pnlPercentage,
    'Notes': s.note || '',
  }));
  const salesSheet = XLSX.utils.json_to_sheet(salesData);
  XLSX.utils.book_append_sheet(workbook, salesSheet, 'Sales History');

  // 3. Purchase Ledger Sheet
  const purchaseData = purchases.map((p) => ({
    'Buy ID': p.purchaseId,
    'User ID': p.userId,
    'Trader Name': p.userName,
    'Purchase Date': p.purchaseDate,
    'Quantity (Kg)': p.quantityKg,
    'Price (₹/kg)': p.pricePerKg,
    'Subtotal (₹)': p.subtotal,
    'Total Payable (₹)': p.totalAmount,
    'Unsold Stock (Kg)': p.unsoldQuantityKg,
    'Status': p.status,
    'Notes': p.note || '',
  }));
  const purchaseSheet = XLSX.utils.json_to_sheet(purchaseData);
  XLSX.utils.book_append_sheet(workbook, purchaseSheet, 'Purchase History');

  // 4. Users Directory Sheet
  const usersData = users.map((u) => ({
    'User ID': u.id,
    'Full Name': u.fullName,
    'Date of Birth': u.dob,
    'Email': u.email,
    'Phone': u.phone,
    'KYC Govt ID': u.kycId,
    'Wallet Cash Balance (₹)': u.walletBalance,
    'Created At': u.createdAt,
  }));
  const usersSheet = XLSX.utils.json_to_sheet(usersData);
  XLSX.utils.book_append_sheet(workbook, usersSheet, 'Traders Directory');

  // Save workbook
  XLSX.writeFile(workbook, `AluTrade_PRO_Master_Export_${Date.now()}.xlsx`);
};

export const downloadSampleCsvTemplate = () => {
  const sampleData = [
    {
      fullName: 'Vikram Singh',
      dob: '1990-04-12',
      email: 'vikram.singh@example.com',
      phone: '+91 91122 33445',
      kycId: 'VKMPS1122N',
      walletBalance: 300000,
      quantityKg: 100,
      pricePerKg: 580,
      note: 'Initial import batch',
    },
  ];

  const sheet = XLSX.utils.json_to_sheet(sampleData);
  const csvOutput = XLSX.utils.sheet_to_csv(sheet);
  
  const blob = new Blob([csvOutput], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.setAttribute('download', 'AluTrade_PRO_Bulk_Import_Sample.csv');
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
