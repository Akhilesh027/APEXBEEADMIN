import React, { useState } from 'react';
import { useAdminState } from '../context/AdminStateContext';
import { MetricCard } from '../components/MetricCard';
import {
  Landmark,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  Sparkles,
  Filter,
  Truck,
  Store,
  Users,
  Building2,
  Gift,
  Repeat,
  XCircle,
  Search,
} from 'lucide-react';

export const SettlementCenter: React.FC = () => {
  const { wallets, withdrawals, processWithdrawal } = useAdminState();
  const [activeSubTab, setActiveSubTab] = useState<
    'all' | 'vendors' | 'delivery' | 'franchises' | 'referrals' | 'entrepreneurs' | 'subscriptions'
  >('all');
  const [searchQuery, setSearchQuery] = useState('');

  const daysDiff = (dateStr: string) => {
    if (!dateStr) return 1;
    const diffTime = Math.abs(new Date().getTime() - new Date(dateStr).getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays || 1;
  };

  // Group pending withdrawals dynamically by recipient role/category
  const getSubTabWithdrawals = () => {
    const pending = withdrawals.filter((w) => w.status === 'Pending');
    let filtered = pending;

    switch (activeSubTab) {
      case 'all':
        filtered = pending;
        break;
      case 'vendors':
        filtered = pending.filter((w) =>
          ['vendor', 'food_partner', 'restaurant', 'retail', 'seller', 'store'].some((t) =>
            w.type.toLowerCase().includes(t)
          )
        );
        break;
      case 'delivery':
        filtered = pending.filter((w) =>
          ['delivery', 'rider', 'driver', 'delivery_boy', 'logistics'].some((t) =>
            w.type.toLowerCase().includes(t)
          )
        );
        break;
      case 'franchises':
        filtered = pending.filter((w) =>
          ['franchise', 'state', 'district', 'mandal'].some((t) =>
            w.type.toLowerCase().includes(t)
          )
        );
        break;
      case 'referrals':
        filtered = pending.filter((w) =>
          ['referral', 'user', 'customer', 'level1', 'level2', 'level3', 'bonus'].some((t) =>
            w.type.toLowerCase().includes(t)
          )
        );
        break;
      case 'entrepreneurs':
        filtered = pending.filter((w) =>
          ['entrepreneur', 'qr', 'merchant'].some((t) =>
            w.type.toLowerCase().includes(t)
          )
        );
        break;
      case 'subscriptions':
        filtered = pending.filter((w) =>
          ['subscription', 'recurring', 'sub'].some((t) =>
            w.type.toLowerCase().includes(t)
          )
        );
        break;
      default:
        filtered = pending;
        break;
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (w) =>
          w.ownerName?.toLowerCase().includes(q) ||
          w.id?.toLowerCase().includes(q) ||
          w.details?.toLowerCase().includes(q) ||
          w.type?.toLowerCase().includes(q)
      );
    }

    return filtered;
  };

  const pendingList = getSubTabWithdrawals();

  // History log - cleared or rejected payout requests
  const settlementHistory = withdrawals.filter(
    (w) => w.status === 'Approved' || w.status === 'Rejected'
  );

  const handleApproveSettlement = (id: string) => {
    const refId = window.prompt("Enter Bank Reference ID / UTR Number for this Payout Settlement (Optional):");
    if (refId !== null) {
      processWithdrawal(id, 'Approved', refId.trim());
    }
  };

  const handleRejectSettlement = (id: string) => {
    if (window.confirm('Reject this payout request? Funds will remain in recipient wallet.')) {
      processWithdrawal(id, 'Rejected');
    }
  };

  // Compute live liability metrics from MongoDB
  const totalPendingVal = withdrawals.filter((w) => w.status === 'Pending').reduce((sum, s) => sum + s.amount, 0);

  const todayStr = new Date().toISOString().split('T')[0] || '';
  const todaysVal = withdrawals
    .filter((w) => w.status === 'Approved' && w.date?.startsWith(todayStr))
    .reduce((sum, w) => sum + w.amount, 0);

  const walletsAvailable = wallets.reduce((sum, w) => sum + w.availableBalance, 0);
  const totalLiability = walletsAvailable + totalPendingVal;

  const agingVal = withdrawals
    .filter((w) => w.status === 'Pending' && daysDiff(w.date) >= 3)
    .reduce((sum, s) => sum + s.amount, 0);

  const subTabs = [
    { id: 'all', label: 'All Payouts', icon: Landmark, count: withdrawals.filter(w => w.status === 'Pending').length },
    { id: 'vendors', label: 'Vendors & Restaurants', icon: Store, count: withdrawals.filter(w => w.status === 'Pending' && ['vendor', 'food_partner', 'restaurant', 'retail', 'seller', 'store'].some(t => w.type.toLowerCase().includes(t))).length },
    { id: 'delivery', label: 'Delivery Boys & Riders', icon: Truck, count: withdrawals.filter(w => w.status === 'Pending' && ['delivery', 'rider', 'driver', 'delivery_boy', 'logistics'].some(t => w.type.toLowerCase().includes(t))).length },
    { id: 'franchises', label: 'Franchise Network', icon: Building2, count: withdrawals.filter(w => w.status === 'Pending' && ['franchise', 'state', 'district', 'mandal'].some(t => w.type.toLowerCase().includes(t))).length },
    { id: 'referrals', label: 'Referral Rewards', icon: Gift, count: withdrawals.filter(w => w.status === 'Pending' && ['referral', 'user', 'customer', 'level1', 'level2', 'level3', 'bonus'].some(t => w.type.toLowerCase().includes(t))).length },
    { id: 'entrepreneurs', label: 'Entrepreneurs & QR', icon: Users, count: withdrawals.filter(w => w.status === 'Pending' && ['entrepreneur', 'qr', 'merchant'].some(t => w.type.toLowerCase().includes(t))).length },
    { id: 'subscriptions', label: 'Subscription Orders', icon: Repeat, count: withdrawals.filter(w => w.status === 'Pending' && ['subscription', 'recurring', 'sub'].some(t => w.type.toLowerCase().includes(t))).length },
  ] as const;

  return (
    <div className="space-y-6">
      {/* Top Cards Row */}
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

      {/* Submenus & Category Selector */}
      <div className="bg-card border border-border/60 p-3 rounded-2xl space-y-3 shadow-sm">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex gap-2 flex-wrap select-none">
            {subTabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveSubTab(tab.id as any)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold border transition-all flex items-center gap-2 cursor-pointer ${
                    activeSubTab === tab.id
                      ? 'bg-primary text-primary-foreground border-primary shadow-md'
                      : 'bg-secondary/20 text-muted-foreground border-transparent hover:bg-secondary/60 hover:text-foreground'
                  }`}
                >
                  <Icon size={14} />
                  <span>{tab.label}</span>
                  {tab.count > 0 && (
                    <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-amber-500/20 text-amber-400 font-extrabold">
                      {tab.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          <div className="relative w-full sm:w-64">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search recipient, ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-secondary/20 border border-border/60 rounded-xl text-xs text-foreground font-semibold outline-none focus:border-primary"
            />
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Pending List - 2 Columns */}
        <div className="lg:col-span-2 bg-card border border-border/80 rounded-2xl overflow-hidden shadow-sm">
          <div className="px-5 py-4 border-b border-border/60 bg-secondary/10 flex justify-between items-center select-none">
            <span className="text-xs font-bold text-foreground uppercase tracking-wider">
              Settlement Payout Queue ({subTabs.find((t) => t.id === activeSubTab)?.label})
            </span>
            <span className="text-[10px] text-muted-foreground flex items-center gap-1 bg-secondary px-2.5 py-1 rounded-lg border border-border/40 font-bold">
              <Filter size={10} /> {pendingList.length} Requests Pending
            </span>
          </div>

          <div className="divide-y divide-border/60 min-h-[300px]">
            {pendingList.map((item) => {
              const days = daysDiff(item.date);
              return (
                <div
                  key={item.id}
                  className="p-4 flex flex-col sm:flex-row sm:items-center justify-between text-xs hover:bg-secondary/10 transition-colors gap-3"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-foreground text-sm block">{item.ownerName}</span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-primary/10 text-primary border border-primary/20">
                        {item.type}
                      </span>
                      {days >= 3 && (
                        <span className="px-1.5 py-0.5 bg-rose-500/10 text-rose-500 rounded text-[9px] font-extrabold animate-pulse flex items-center gap-0.5">
                          <AlertTriangle size={9} /> Aging {days}d
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-muted-foreground block font-mono">
                      ID: {item.id} • Channel: {item.method} • Details: {item.details}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 select-none justify-between sm:justify-end">
                    <span className="font-mono font-black text-foreground text-base mr-2">
                      ₹{item.amount.toLocaleString('en-IN')}
                    </span>

                    <button
                      onClick={() => handleApproveSettlement(item.id)}
                      className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl flex items-center gap-1 transition-all shadow-md cursor-pointer"
                    >
                      <span>Approve</span>
                      <ArrowRight size={12} />
                    </button>

                    <button
                      onClick={() => handleRejectSettlement(item.id)}
                      className="p-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 font-bold rounded-xl flex items-center transition-all border border-rose-500/20 cursor-pointer"
                      title="Reject Payout Request"
                    >
                      <XCircle size={14} />
                    </button>
                  </div>
                </div>
              );
            })}

            {pendingList.length === 0 && (
              <div className="py-12 text-center text-xs text-muted-foreground flex flex-col items-center justify-center space-y-2 select-none">
                <ShieldCheck size={32} className="text-muted-foreground/60" />
                <p className="font-bold">No pending settlements in this payout queue.</p>
                <p className="text-[11px] text-muted-foreground">All requested payouts for this category have been processed.</p>
              </div>
            )}
          </div>
        </div>

        {/* History List - 1 Column */}
        <div className="bg-card border border-border/80 rounded-2xl p-5 shadow-sm space-y-4">
          <div className="border-b border-border pb-3 flex items-center justify-between select-none">
            <h3 className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles size={14} className="text-primary" />
              Settled Payouts Log
            </h3>
            <span className="text-[9px] font-bold text-muted-foreground">Recent Clearances</span>
          </div>

          <div className="divide-y divide-border/60 max-h-96 overflow-y-auto pr-1">
            {settlementHistory.map((item, idx) => (
              <div key={idx} className="py-3 first:pt-0 last:pb-0 text-xs">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="font-bold text-foreground block">{item.ownerName}</span>
                    <span className="text-[9px] text-muted-foreground font-mono block mt-0.5">
                      {item.details}
                    </span>
                  </div>
                  <span
                    className={`font-mono font-black text-xs ${
                      item.status === 'Approved' ? 'text-emerald-500' : 'text-rose-500'
                    }`}
                  >
                    ₹{item.amount.toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="flex justify-between items-center text-[9px] text-muted-foreground mt-1 select-none font-semibold">
                  <span className="capitalize">Type: {item.type} ({item.status === 'Approved' ? 'Payout Cleared - Successfully Done' : item.status})</span>
                  <span>{item.date}</span>
                </div>
              </div>
            ))}
            {settlementHistory.length === 0 && (
              <p className="text-center text-xs text-muted-foreground py-8 select-none">
                No historical payout logs found.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
