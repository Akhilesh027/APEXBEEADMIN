import React, { useState } from 'react';
import { useAdminState } from '../context/AdminStateContext';
import { MetricCard } from '../components/MetricCard';
import { Landmark, CheckCircle2, Clock, AlertTriangle, ArrowRight, ShieldCheck, Sparkles, Filter } from 'lucide-react';

export const SettlementCenter: React.FC = () => {
  const { wallets, withdrawals, processWithdrawal } = useAdminState();
  const [activeSubTab, setActiveSubTab] = useState<'vendors' | 'entrepreneurs' | 'franchises' | 'qr' | 'wallets'>('vendors');

  const daysDiff = (dateStr: string) => {
    if (!dateStr) return 1;
    const diffTime = Math.abs(new Date().getTime() - new Date(dateStr).getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays || 1;
  };

  // Group pending withdrawals dynamically by role
  const getSubTabWithdrawals = () => {
    const pending = withdrawals.filter(w => w.status === 'Pending');
    switch (activeSubTab) {
      case 'vendors':
        return pending.filter(w => w.type.toLowerCase() === 'vendor');
      case 'entrepreneurs':
        return pending.filter(w => w.type.toLowerCase() === 'entrepreneur');
      case 'franchises':
        return pending.filter(w => w.type.toLowerCase() === 'franchise');
      case 'qr':
        return pending.filter(w => w.type.toLowerCase() === 'qr');
      case 'wallets':
        return pending.filter(w => w.type.toLowerCase() === 'referral' || w.type.toLowerCase() === 'customer');
      default:
        return [];
    }
  };

  const pendingList = getSubTabWithdrawals();

  // History log - cleared or rejected payout requests
  const settlementHistory = withdrawals.filter(w => w.status === 'Approved' || w.status === 'Rejected');

  const handleProcessSettlement = (id: string) => {
    processWithdrawal(id, 'Approved');
  };

  // Compute live liability metrics from MongoDB
  const totalPendingVal = withdrawals.filter(w => w.status === 'Pending').reduce((sum, s) => sum + s.amount, 0);
  
  const todayStr = new Date().toISOString().split('T')[0];
  const todaysVal = withdrawals
    .filter(w => w.status === 'Approved' && w.date?.startsWith(todayStr))
    .reduce((sum, w) => sum + w.amount, 0);

  const walletsAvailable = wallets.reduce((sum, w) => sum + w.availableBalance, 0);
  const totalLiability = walletsAvailable + totalPendingVal;

  const agingVal = withdrawals
    .filter(w => w.status === 'Pending' && daysDiff(w.date) >= 3)
    .reduce((sum, s) => sum + s.amount, 0);

  const getSubTabLabel = (tab: typeof activeSubTab) => {
    switch (tab) {
      case 'vendors': return 'Vendors';
      case 'entrepreneurs': return 'Entrepreneurs';
      case 'franchises': return 'Franchises';
      case 'qr': return 'QR Merchants';
      case 'wallets': return 'Wallet Payouts';
      default: return tab;
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Top Cards row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 select-none">
        <MetricCard
          title="PENDING SETTLEMENTS"
          value={`₹${totalPendingVal.toLocaleString('en-IN')}`}
          icon={Clock}
          subtext="Payout queue liabilities"
          theme="amber"
        />
        <MetricCard
          title="TODAY'S SETTLEMENTS"
          value={`₹${todaysVal.toLocaleString('en-IN')}`}
          icon={CheckCircle2}
          subtext="Payouts cleared today"
          theme="emerald"
        />
        <MetricCard
          title="SETTLEMENT LIABILITY"
          value={`₹${totalLiability.toLocaleString('en-IN')}`}
          icon={Landmark}
          subtext="Total platform payout liability"
          theme="rose"
        />
        <MetricCard
          title="SETTLEMENT AGING (>3 DAYS)"
          value={`₹${agingVal.toLocaleString('en-IN')}`}
          icon={AlertTriangle}
          subtext="Overdue aging settlements"
          theme="orange"
        />
      </div>
 
      {/* Submenus Bar */}
      <div className="flex gap-2 flex-wrap bg-card border border-border/60 p-2 rounded-2xl select-none shadow-sm">
        {(['vendors', 'entrepreneurs', 'franchises', 'qr', 'wallets'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveSubTab(tab)}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all ${
              activeSubTab === tab
                ? 'bg-primary text-primary-foreground border-primary shadow-md'
                : 'bg-transparent text-muted-foreground border-transparent hover:bg-secondary/60 hover:text-foreground'
            }`}
          >
            {getSubTabLabel(tab)}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        
        {/* Pending list - 2 columns */}
        <div className="lg:col-span-2 bg-card border border-border/80 rounded-2xl overflow-hidden shadow-sm">
          <div className="px-5 py-4 border-b border-border/60 bg-secondary/10 flex justify-between items-center select-none">
            <span className="text-xs font-bold text-foreground uppercase tracking-wider">
              Settlement Payout queue ({getSubTabLabel(activeSubTab)})
            </span>
            <span className="text-[10px] text-muted-foreground flex items-center gap-1 bg-secondary px-2.5 py-1 rounded-lg border border-border/40">
              <Filter size={10} /> Batch Processing Active
            </span>
          </div>

          <div className="divide-y divide-border/60">
            {pendingList.map(item => {
              const days = daysDiff(item.date);
              return (
                <div key={item.id} className="p-4 flex items-center justify-between text-xs hover:bg-secondary/10 transition-colors">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-foreground text-sm block">{item.ownerName}</span>
                      {days >= 3 && (
                        <span className="px-1.5 py-0.5 bg-rose-500/10 text-rose-500 rounded text-[8px] font-bold animate-pulse flex items-center gap-0.5">
                          <AlertTriangle size={8} /> Aging {days}d
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-muted-foreground block font-mono">
                      ID: {item.id} • Channel: {item.method} • Account Details: {item.details}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-3 shrink-0 select-none">
                    <span className="font-mono font-bold text-foreground text-sm">₹{item.amount.toLocaleString('en-IN')}</span>
                    <button
                      onClick={() => handleProcessSettlement(item.id)}
                      className="px-3.5 py-1.5 bg-primary hover:bg-primary/95 text-primary-foreground font-bold rounded-xl flex items-center gap-1.5 transition-all shadow-md shadow-primary/10 cursor-pointer"
                    >
                      Clear Payout <ArrowRight size={12} />
                    </button>
                  </div>
                </div>
              );
            })}

            {pendingList.length === 0 && (
              <div className="py-12 text-center text-xs text-muted-foreground flex flex-col items-center justify-center space-y-2 select-none">
                <ShieldCheck size={28} className="text-muted-foreground/60" />
                <p>No pending settlements in the {getSubTabLabel(activeSubTab)} payout list.</p>
              </div>
            )}
          </div>
        </div>

        {/* History list - 1 column */}
        <div className="bg-card border border-border/80 rounded-2xl p-5 shadow-sm space-y-4">
          <div className="border-b border-border pb-3 flex items-center justify-between select-none">
            <h3 className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles size={14} className="text-primary" />
              Settled Payouts log
            </h3>
            <span className="text-[9px] text-muted-foreground">Recent Clearances</span>
          </div>

          <div className="divide-y divide-border/60 max-h-80 overflow-y-auto no-scrollbar pr-1">
            {settlementHistory.map((item, idx) => (
              <div key={idx} className="py-3 first:pt-0 last:pb-0 text-xs">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="font-semibold text-foreground block">{item.ownerName}</span>
                    <span className="text-[9px] text-muted-foreground font-mono block mt-0.5">
                      Destination: {item.details}
                    </span>
                  </div>
                  <span className={`font-mono font-bold ${item.status === 'Approved' ? 'text-emerald-500' : 'text-rose-500'}`}>
                    ₹{item.amount.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between items-center text-[9px] text-muted-foreground mt-1 select-none">
                  <span>Type: {item.type} ({item.status})</span>
                  <span>Date: {item.date}</span>
                </div>
              </div>
            ))}
            {settlementHistory.length === 0 && (
              <p className="text-center text-xs text-muted-foreground py-8 select-none">No historical payout logs found.</p>
            )}
          </div>
        </div>

      </div>

    </div>
  );
};
