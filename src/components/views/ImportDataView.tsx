import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { translations } from '../../lib/i18n';
import { downloadSampleCsvTemplate } from '../../lib/excelGenerator';
import { UploadCloud, FileSpreadsheet, CheckCircle2, Download, AlertCircle, FileText } from 'lucide-react';
import * as XLSX from 'xlsx';

export const ImportDataView: React.FC = () => {
  const { language, importBulkData } = useApp();
  const t = translations[language];

  const [parsedPreview, setParsedPreview] = useState<any[]>([]);
  const [statusMessage, setStatusMessage] = useState<{ type: 'SUCCESS' | 'ERROR'; text: string } | null>(
    null
  );

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws);
        setParsedPreview(data);
        setStatusMessage({
          type: 'SUCCESS',
          text: `Successfully parsed ${data.length} records from uploaded file. Review preview below.`,
        });
      } catch (err) {
        setStatusMessage({
          type: 'ERROR',
          text: 'Failed to parse uploaded CSV/Excel file. Ensure standard format.',
        });
      }
    };
    reader.readAsBinaryString(file);
  };

  const handleConfirmImport = () => {
    if (parsedPreview.length === 0) return;

    const usersToCreate: any[] = [];
    const purchasesToCreate: any[] = [];

    parsedPreview.forEach((row: any) => {
      if (row.fullName && row.email) {
        usersToCreate.push({
          fullName: row.fullName,
          dob: row.dob || '1990-01-01',
          email: row.email,
          phone: row.phone || '+91 90000 00000',
          kycId: row.kycId || 'ABCPS1234F',
          walletBalance: parseFloat(row.walletBalance) || 100000,
        });
      }
    });

    const res = importBulkData(usersToCreate, purchasesToCreate);

    setStatusMessage({
      type: 'SUCCESS',
      text: `Bulk import completed! Added ${res.usersAdded} users.`,
    });
    setParsedPreview([]);
  };

  return (
    <div className="p-4 sm:p-6 space-y-6 text-slate-100 max-w-4xl mx-auto">
      {/* Header Banner */}
      <div className="bg-[#111827] border border-slate-800 p-6 rounded-2xl shadow-xl flex items-center justify-between">
        <div>
          <div className="flex items-center space-x-2">
            <UploadCloud className="w-5 h-5 text-cyan-400" />
            <h2 className="text-xl font-black text-white tracking-tight">
              Excel / CSV Bulk Data Import Engine
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Upload bulk historical trader accounts and inventory purchase records directly via CSV spreadsheet.
          </p>
        </div>

        <button
          onClick={downloadSampleCsvTemplate}
          className="bg-slate-800 hover:bg-slate-700 border border-slate-700 text-cyan-300 font-bold text-xs px-3.5 py-2 rounded-xl flex items-center space-x-2 transition-all"
        >
          <Download className="w-4 h-4" />
          <span>Download Sample CSV</span>
        </button>
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

      {/* Drag & Drop Upload Zone */}
      <div className="bg-[#111827] border-2 border-dashed border-slate-700 hover:border-cyan-500 p-8 rounded-2xl shadow-xl text-center space-y-4 transition-colors relative cursor-pointer">
        <input
          type="file"
          accept=".csv, .xlsx, .xls"
          onChange={handleFileUpload}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />
        <FileSpreadsheet className="w-12 h-12 text-cyan-400 mx-auto" />
        <div>
          <h3 className="text-sm font-bold text-white">Choose a CSV or Excel file to upload</h3>
          <p className="text-xs text-slate-400 mt-1">Drag and drop file here or click to browse</p>
        </div>
      </div>

      {/* Parsed Data Preview Table */}
      {parsedPreview.length > 0 && (
        <div className="bg-[#111827] border border-slate-800 p-5 rounded-2xl shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center space-x-2">
              <FileText className="w-4 h-4 text-cyan-400" />
              <span>Parsed Sheet Preview ({parsedPreview.length} Rows)</span>
            </h3>

            <button
              onClick={handleConfirmImport}
              className="bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-xs px-4 py-2 rounded-xl transition-all shadow-md"
            >
              Confirm Bulk Import →
            </button>
          </div>

          <div className="overflow-x-auto max-h-60">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900 text-slate-400 font-bold uppercase text-[10px]">
                <tr>
                  <th className="p-2">Full Name</th>
                  <th className="p-2">DOB</th>
                  <th className="p-2">Email</th>
                  <th className="p-2">Phone</th>
                  <th className="p-2">KYC ID</th>
                  <th className="p-2">Wallet Cash</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {parsedPreview.map((row, idx) => (
                  <tr key={idx}>
                    <td className="p-2 font-semibold text-white">{row.fullName || '-'}</td>
                    <td className="p-2 text-slate-400">{row.dob || '-'}</td>
                    <td className="p-2 text-slate-300">{row.email || '-'}</td>
                    <td className="p-2 text-slate-400">{row.phone || '-'}</td>
                    <td className="p-2 text-slate-300 font-mono">{row.kycId || '-'}</td>
                    <td className="p-2 font-bold text-cyan-400">₹{row.walletBalance || 0}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
