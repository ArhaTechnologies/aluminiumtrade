import React, { useState, useEffect } from 'react';
import { Database, CheckCircle2, XCircle, RefreshCw, Server, Table, HardDrive, Terminal, ShieldCheck, ArrowRight, Layers } from 'lucide-react';

interface DbStatusResponse {
  connected: boolean;
  message: string;
  provider: string;
}

export const DatabaseView: React.FC = () => {
  const [dbStatus, setDbStatus] = useState<DbStatusResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [initLoading, setInitLoading] = useState(false);
  const [initResult, setInitResult] = useState<string | null>(null);
  const [sampleUsers, setSampleUsers] = useState<any[] | null>(null);

  const checkDbStatus = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/db/status');
      const data = await res.json();
      setDbStatus(data);
    } catch (err: any) {
      setDbStatus({
        connected: false,
        message: `API Route unreachable or server starting: ${err.message}`,
        provider: 'PostgreSQL',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInitDb = async () => {
    setInitLoading(true);
    setInitResult(null);
    try {
      const res = await fetch('/api/db/init', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setInitResult(`Success: ${data.message}`);
        checkDbStatus();
      } else {
        setInitResult(`Error: ${data.error}`);
      }
    } catch (err: any) {
      setInitResult(`Execution Error: ${err.message}`);
    } finally {
      setInitLoading(false);
    }
  };

  const [activeTableLabel, setActiveTableLabel] = useState<string>('users');

  const fetchPgUsers = async () => {
    try {
      setActiveTableLabel('users');
      const res = await fetch('/api/users');
      if (res.ok) {
        const data = await res.json();
        setSampleUsers(data);
      } else {
        const err = await res.json();
        setInitResult(`Fetch Failed: ${err.error || 'Database unavailable'}`);
      }
    } catch (err: any) {
      setInitResult(`Network error: ${err.message}`);
    }
  };

  const fetchPgPurchases = async () => {
    try {
      setActiveTableLabel('purchases');
      const res = await fetch('/api/purchases');
      if (res.ok) {
        const data = await res.json();
        setSampleUsers(data);
      } else {
        const err = await res.json();
        setInitResult(`Fetch Purchases Failed: ${err.error || 'Database unavailable'}`);
      }
    } catch (err: any) {
      setInitResult(`Network error: ${err.message}`);
    }
  };

  const fetchPgSales = async () => {
    try {
      setActiveTableLabel('sales');
      const res = await fetch('/api/sales');
      if (res.ok) {
        const data = await res.json();
        setSampleUsers(data);
      } else {
        const err = await res.json();
        setInitResult(`Fetch Sales Failed: ${err.error || 'Database unavailable'}`);
      }
    } catch (err: any) {
      setInitResult(`Network error: ${err.message}`);
    }
  };

  useEffect(() => {
    checkDbStatus();
  }, []);

  return (
    <div className="p-4 sm:p-6 space-y-6 text-slate-100 max-w-5xl mx-auto">
      {/* Header Banner */}
      <div className="bg-[#111827] border border-slate-800 p-6 rounded-2xl shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
              <Database className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-black text-white tracking-tight">
              PostgreSQL Database Integration Engine
            </h2>
          </div>
          <p className="text-xs text-slate-400">
            Full-stack Express + Node backend connected with PostgreSQL client driver (`pg`), REST endpoints, and schema migrations.
          </p>
        </div>

        <button
          onClick={checkDbStatus}
          disabled={loading}
          className="bg-slate-800 hover:bg-slate-700 text-cyan-400 border border-slate-700 text-xs font-bold px-4 py-2.5 rounded-xl transition-all flex items-center space-x-2 self-start sm:self-auto"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh DB Connection</span>
        </button>
      </div>

      {/* Connection Status Card */}
      <div className="bg-[#111827] border border-slate-800 p-6 rounded-2xl shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center space-x-3">
            <Server className="w-5 h-5 text-slate-400" />
            <div>
              <h3 className="text-sm font-bold text-white">PostgreSQL Connection Status</h3>
              <p className="text-xs text-slate-400">Target Driver: <code className="text-cyan-400 font-mono">node-postgres (pg)</code></p>
            </div>
          </div>

          <div>
            {dbStatus?.connected ? (
              <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-xs font-bold px-3 py-1.5 rounded-full flex items-center space-x-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>ONLINE & CONNECTED</span>
              </span>
            ) : (
              <span className="bg-amber-500/10 text-amber-400 border border-amber-500/30 text-xs font-bold px-3 py-1.5 rounded-full flex items-center space-x-1.5">
                <XCircle className="w-4 h-4 text-amber-400" />
                <span>CONFIG READY / STANDBY</span>
              </span>
            )}
          </div>
        </div>

        <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-800/80 text-xs space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span>Database Status Message:</span>
            <span className="font-mono text-slate-200">{dbStatus?.message || 'Checking backend API...'}</span>
          </div>
          <div className="flex items-center justify-between text-slate-400">
            <span>Server Route:</span>
            <span className="font-mono text-cyan-400">GET /api/db/status</span>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap gap-3 pt-2">
          <button
            onClick={handleInitDb}
            disabled={initLoading}
            className="bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-xs px-4 py-2.5 rounded-xl transition-all shadow-md flex items-center space-x-2"
          >
            <Table className="w-4 h-4" />
            <span>{initLoading ? 'Initializing Schema...' : 'Verify / Run Schema Migrations'}</span>
          </button>

          <button
            onClick={fetchPgUsers}
            className={`font-bold text-xs px-3.5 py-2.5 rounded-xl border transition-all flex items-center space-x-2 ${
              activeTableLabel === 'users'
                ? 'bg-cyan-500/20 border-cyan-500 text-cyan-300'
                : 'bg-slate-800 hover:bg-slate-700 text-white border-slate-700'
            }`}
          >
            <HardDrive className="w-4 h-4 text-cyan-400" />
            <span>Query Users Table</span>
          </button>

          <button
            onClick={fetchPgPurchases}
            className={`font-bold text-xs px-3.5 py-2.5 rounded-xl border transition-all flex items-center space-x-2 ${
              activeTableLabel === 'purchases'
                ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300'
                : 'bg-slate-800 hover:bg-slate-700 text-white border-slate-700'
            }`}
          >
            <HardDrive className="w-4 h-4 text-emerald-400" />
            <span>Query Purchases Table</span>
          </button>

          <button
            onClick={fetchPgSales}
            className={`font-bold text-xs px-3.5 py-2.5 rounded-xl border transition-all flex items-center space-x-2 ${
              activeTableLabel === 'sales'
                ? 'bg-blue-500/20 border-blue-500 text-blue-300'
                : 'bg-slate-800 hover:bg-slate-700 text-white border-slate-700'
            }`}
          >
            <HardDrive className="w-4 h-4 text-blue-400" />
            <span>Query Sales Table</span>
          </button>
        </div>

        {initResult && (
          <div className="bg-slate-900 border border-slate-800 p-3 rounded-xl font-mono text-xs text-cyan-300">
            {initResult}
          </div>
        )}

        {sampleUsers && (
          <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-xl space-y-2">
            <h4 className="text-xs font-bold text-white flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>PostgreSQL Query Results ({sampleUsers.length} records):</span>
            </h4>
            <pre className="text-[11px] font-mono text-slate-300 overflow-x-auto p-2 bg-slate-950 rounded-lg">
              {JSON.stringify(sampleUsers, null, 2)}
            </pre>
          </div>
        )}
      </div>

      {/* Database Schema Overview */}
      <div className="bg-[#111827] border border-slate-800 p-6 rounded-2xl shadow-xl space-y-4">
        <div className="flex items-center space-x-2 border-b border-slate-800 pb-3">
          <Layers className="w-5 h-5 text-cyan-400" />
          <h3 className="text-sm font-bold text-white">PostgreSQL Database Schema Architecture</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800/80 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs font-bold text-cyan-400">users</span>
              <span className="text-[10px] text-slate-500 uppercase">Table</span>
            </div>
            <p className="text-xs text-slate-400">
              Stores user profiles, roles (ADMIN / TRADER), cash balance, inventory, average buy price, and PIN locks.
            </p>
          </div>

          <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800/80 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs font-bold text-emerald-400">purchases</span>
              <span className="text-[10px] text-slate-500 uppercase">Table</span>
            </div>
            <p className="text-xs text-slate-400">
              Tracks all buy orders, quantity (kg), purchase prices, 18% GST tax breakdown, and execution timestamps.
            </p>
          </div>

          <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800/80 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs font-bold text-blue-400">sales</span>
              <span className="text-[10px] text-slate-500 uppercase">Table</span>
            </div>
            <p className="text-xs text-slate-400">
              Records sell transactions, buy vs sell margins, realized P&L, buyer info, and ROI metrics.
            </p>
          </div>

          <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800/80 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs font-bold text-purple-400">market_prices</span>
              <span className="text-[10px] text-slate-500 uppercase">Table</span>
            </div>
            <p className="text-xs text-slate-400">
              Historical aluminum spot price ticks, 24h percentage changes, volume records, and source tags.
            </p>
          </div>
        </div>
      </div>

      {/* PostgreSQL Configuration Guide */}
      <div className="bg-[#111827] border border-slate-800 p-6 rounded-2xl shadow-xl space-y-4">
        <div className="flex items-center space-x-2">
          <Terminal className="w-5 h-5 text-amber-400" />
          <h3 className="text-sm font-bold text-white">How to connect your external PostgreSQL Database</h3>
        </div>

        <p className="text-xs text-slate-400 leading-relaxed">
          The Express backend is fully equipped with PostgreSQL connection pooling (`pg`). Simply configure your PostgreSQL connection string in the environment variable <code className="text-cyan-400 bg-slate-900 px-2 py-0.5 rounded font-mono">DATABASE_URL</code>:
        </p>

        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 font-mono text-xs text-slate-300 space-y-2">
          <div className="text-slate-500"># .env configuration example:</div>
          <div className="text-cyan-300">DATABASE_URL="postgresql://username:password@hostname:5432/alutrade"</div>
        </div>

        <div className="flex items-center space-x-2 text-xs text-slate-400">
          <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>Supports local PostgreSQL, Neon, Supabase, AWS RDS, GCP Cloud SQL, or Heroku Postgres.</span>
        </div>
      </div>
    </div>
  );
};
