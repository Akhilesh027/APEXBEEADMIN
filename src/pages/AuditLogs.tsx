import React, { useState } from 'react';
import { History, ShieldCheck, Filter, Search, ShieldAlert, Coins, Sparkles } from 'lucide-react';

export const AuditLogs: React.FC = () => {
  const [activeSubTab, setActiveSubTab] = useState<'admin' | 'franchise' | 'vendor' | 'wallet' | 'login' | 'approval'>('admin');
  const [searchQuery, setSearchQuery] = useState('');

  // Sample static operations logs
  const logsList = [
    { id: 'LOG-901', operator: 'Ananya Sharma (Admin)', action: 'Approved KYC documents', details: 'KYC verified for Rajesh Wholesalers Pvt Ltd (SEL-002)', timestamp: '2026-06-14 09:30:12', type: 'admin' },
    { id: 'LOG-902', operator: 'Vikram Rane (Franchise)', action: 'Dispatched delivery agent', details: 'Assigned platform agent for order ORD-99298', timestamp: '2026-06-14 08:15:45', type: 'franchise' },
    { id: 'LOG-903', operator: 'Karan Organic (Vendor)', action: 'Added product variant', details: 'Added SKU HALDI-1KG to Organic Turmeric', timestamp: '2026-06-13 18:42:01', type: 'vendor' },
    { id: 'LOG-904', operator: 'Suresh Shah (Finance)', action: 'Cleared vendor payout', details: 'Released ₹8,500 withdrawal for SEL-002. Bank Ref: TXN-3829104', timestamp: '2026-06-13 14:10:00', type: 'wallet' },
    { id: 'LOG-905', operator: 'Amit Sharma (Vendor)', action: 'Login successful', details: 'Logged in from IP 192.168.1.45 (Device: Chrome macOS)', timestamp: '2026-06-14 09:00:00', type: 'login' },
    { id: 'LOG-906', operator: 'Ananya Sharma (Admin)', action: 'Approved product listing', details: 'Approved Roadster T-Shirt (PROD-001) listing', timestamp: '2026-06-13 11:30:00', type: 'approval' }
  ];

  const getFilteredLogs = () => {
    switch (activeSubTab) {
      case 'admin':
        return logsList.filter(l => l.type === 'admin');
      case 'franchise':
        return logsList.filter(l => l.type === 'franchise');
      case 'vendor':
        return logsList.filter(l => l.type === 'vendor');
      case 'wallet':
        return logsList.filter(l => l.type === 'wallet');
      case 'login':
        return logsList.filter(l => l.type === 'login');
      case 'approval':
        return logsList.filter(l => l.type === 'approval');
      default:
        return logsList;
    }
  };

  const currentLogs = getFilteredLogs().filter(l => 
    l.operator.toLowerCase().includes(searchQuery.toLowerCase()) ||
    l.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
    l.details.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      
      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 select-none">
        <div className="bg-card border border-border/80 rounded-2xl p-4 flex items-center justify-between shadow-sm">
          <div>
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Total Logs Recorded</span>
            <span className="text-xl font-bold font-mono text-foreground mt-1 block">12,450 Logs</span>
            <span className="text-[9px] text-muted-foreground mt-1 block">Storage: 45MB index size</span>
          </div>
          <History className="text-primary shrink-0" size={24} />
        </div>
        <div className="bg-card border border-border/80 rounded-2xl p-4 flex items-center justify-between shadow-sm">
          <div>
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Admin Activity Logs</span>
            <span className="text-xl font-bold font-mono text-foreground mt-1 block">3,120 Activities</span>
            <span className="text-[9px] text-emerald-500 mt-1 block font-semibold">100% security certified</span>
          </div>
          <ShieldCheck className="text-emerald-500 shrink-0" size={24} />
        </div>
        <div className="bg-card border border-border/80 rounded-2xl p-4 flex items-center justify-between shadow-sm">
          <div>
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Wallet Transactions</span>
            <span className="text-xl font-bold font-mono text-foreground mt-1 block">1,840 Ledger Events</span>
            <span className="text-[9px] text-violet-500 mt-1 block font-semibold">No audit discrepancies found</span>
          </div>
          <Coins className="text-violet-500 shrink-0" size={24} />
        </div>
        <div className="bg-card border border-border/80 rounded-2xl p-4 flex items-center justify-between shadow-sm">
          <div>
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Security Alerts</span>
            <span className="text-xl font-bold font-mono text-foreground mt-1 block">0 Critical Warnings</span>
            <span className="text-[9px] text-rose-500 mt-1 block font-semibold">Strict intrusion shields active</span>
          </div>
          <ShieldAlert className="text-rose-500 shrink-0 animate-pulse" size={24} />
        </div>
      </div>

      {/* Subtab Menu */}
      <div className="flex gap-2 flex-wrap bg-card border border-border/60 p-2 rounded-2xl select-none shadow-sm">
        {(['admin', 'franchise', 'vendor', 'wallet', 'login', 'approval'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveSubTab(tab)}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all ${
              activeSubTab === tab
                ? 'bg-primary text-primary-foreground border-primary shadow-md'
                : 'bg-transparent text-muted-foreground border-transparent hover:bg-secondary/60 hover:text-foreground'
            }`}
          >
            {tab === 'wallet' ? 'Wallet Transactions' : tab === 'login' ? 'Login History' : tab === 'approval' ? 'Approval History' : tab.charAt(0).toUpperCase() + tab.slice(1) + ' Activity'}
          </button>
        ))}
      </div>

      {/* Audit Log Table View */}
      <div className="bg-card border border-border/80 rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-3 border-b border-border/60">
          <span className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-1">
            <Sparkles size={12} className="text-primary animate-pulse" /> Operations Ledger ({activeSubTab.toUpperCase()})
          </span>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:flex-initial">
              <Search className="absolute left-3 top-2.5 text-muted-foreground" size={14} />
              <input
                type="text"
                placeholder="Search log descriptions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 pr-4 py-1.5 bg-secondary/50 border border-border/80 focus:border-primary rounded-xl text-xs outline-none w-full sm:w-64 font-medium"
              />
            </div>
            <button 
              onClick={() => alert('Exporting audit log sheets...')}
              className="px-3.5 py-1.5 bg-secondary hover:bg-secondary/80 text-foreground font-bold text-xs rounded-xl border border-border/60 transition-all shadow-sm flex items-center gap-1 cursor-pointer"
            >
              <Filter size={12} /> Export CSV
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-secondary/40 select-none border-b border-border/60">
              <tr>
                <th className="p-3 font-semibold text-muted-foreground">Log ID</th>
                <th className="p-3 font-semibold text-muted-foreground">Operator Entity</th>
                <th className="p-3 font-semibold text-muted-foreground">Action Type</th>
                <th className="p-3 font-semibold text-muted-foreground">Action Details</th>
                <th className="p-3 font-semibold text-muted-foreground">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {currentLogs.map(log => (
                <tr key={log.id} className="hover:bg-secondary/10 transition-colors">
                  <td className="p-3 font-mono font-semibold text-primary">{log.id}</td>
                  <td className="p-3 font-medium text-foreground">{log.operator}</td>
                  <td className="p-3 text-muted-foreground font-semibold">{log.action}</td>
                  <td className="p-3 text-muted-foreground">{log.details}</td>
                  <td className="p-3 font-mono text-muted-foreground">{log.timestamp}</td>
                </tr>
              ))}
              {currentLogs.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-12 text-center text-xs text-muted-foreground">
                    No activity logs recorded for this category today.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
