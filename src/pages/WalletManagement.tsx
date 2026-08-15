import React, { useState, useEffect } from 'react';
import { useAdminState } from '../context/AdminStateContext';
import {
  Landmark,
  ArrowUpRight,
  Check,
  X,
  ShieldCheck,
  Wallet2,
  Clock,
  CreditCard,
  Search,
  Users,
  Briefcase,
  SlidersHorizontal
} from 'lucide-react';

interface ReconciliationStats {
  totalSales: number;
  totalVendorEarnings: number;
  totalFranchiseEarnings: number;
  totalReferralEarnings: number;
  totalCompanyEarnings: number;
  totalPendingReleases: number;
  totalWithdrawals: number;
  totalAvailableBalances: number;
}

export const WalletManagement: React.FC = () => {
  const { wallets, withdrawals, processWithdrawal } = useAdminState();

  // Real-time API stats
  const [reconStats, setReconStats] = useState<ReconciliationStats | null>(null);

  // Filter & Search states
  const [ledgerSearch, setLedgerSearch] = useState('');
  const [walletFilter, setWalletFilter] = useState<'All' | 'Vendor' | 'Referral' | 'Franchise'>('All');
  const [balanceFilter, setBalanceFilter] = useState<'All' | 'With Balance' | 'Zero Balance'>('All');

  const [payoutSearch, setPayoutSearch] = useState('');
  const [payoutTypeFilter, setPayoutTypeFilter] = useState<'All' | 'Vendor' | 'Referral' | 'Franchise'>('All');
  const [withdrawalFilter, setWithdrawalFilter] = useState<'All' | 'Pending' | 'Approved' | 'Rejected'>('Pending');

  useEffect(() => {
    fetchReconStats();
  }, [wallets, withdrawals]); // Re-fetch when state updates

  const fetchReconStats = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      if (!token) return;
      const res = await fetch('https://server.apexbee.in/api/admin/reconciliation', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setReconStats(data.stats);
      }
    } catch (error) {
      console.error('Error fetching reconciliation stats:', error);
    }
  };

  const [selectedPayout, setSelectedPayout] = useState<any | null>(null);
  const [payoutTxnId, setPayoutTxnId] = useState('');
  const [payoutMethod, setPayoutMethod] = useState<string>('UPI');
  const [payoutRemarks, setPayoutRemarks] = useState('');

  const handleOpenClearModal = (req: any) => {
    setSelectedPayout(req);
    setPayoutTxnId(`TXN${Date.now().toString().slice(-8)}`);
    setPayoutMethod(req.method === 'UPI' ? 'UPI' : 'Bank Transfer (NEFT/IMPS)');
    setPayoutRemarks('Payout cleared & verified by admin');
  };

  const handleConfirmClearPayout = () => {
    if (!selectedPayout) return;
    if (!payoutTxnId.trim()) {
      alert("Please enter Transaction ID / UTR Number");
      return;
    }
    processWithdrawal(selectedPayout.id, 'Approved', payoutTxnId.trim(), payoutMethod, payoutRemarks.trim());
    setSelectedPayout(null);
  };

  const handleRejectPayout = (id: string) => {
    if (window.confirm("Are you sure you want to reject this withdrawal request?")) {
      processWithdrawal(id, 'Rejected');
    }
  };

  // Filtered Ledgers
  const filteredWallets = wallets.filter(w => {
    const matchesSearch = w.ownerName.toLowerCase().includes(ledgerSearch.toLowerCase()) ||
      w.id.toLowerCase().includes(ledgerSearch.toLowerCase());
    const matchesType = walletFilter === 'All' || w.type === walletFilter;

    let matchesBalance = true;
    if (balanceFilter === 'With Balance') {
      matchesBalance = w.availableBalance > 0 || w.pendingBalance > 0;
    } else if (balanceFilter === 'Zero Balance') {
      matchesBalance = w.availableBalance === 0 && w.pendingBalance === 0;
    }

    return matchesSearch && matchesType && matchesBalance;
  });

  // Filtered Withdrawals/Payouts
  const filteredWithdrawals = withdrawals.filter(w => {
    const matchesSearch = w.ownerName.toLowerCase().includes(payoutSearch.toLowerCase()) ||
      w.id.toLowerCase().includes(payoutSearch.toLowerCase()) ||
      w.details.toLowerCase().includes(payoutSearch.toLowerCase());
    const matchesType = payoutTypeFilter === 'All' || w.type === payoutTypeFilter;
    const matchesStatus = withdrawalFilter === 'All' || w.status === withdrawalFilter;

    return matchesSearch && matchesType && matchesStatus;
  });

  // Fallbacks for empty db
  const companyWalletVal = reconStats ? reconStats.totalCompanyEarnings : wallets.reduce((sum, w) => sum + (w.type === 'Franchise' ? w.withdrawnBalance * 0.1 : 0), 0);
  const referralVal = reconStats ? reconStats.totalReferralEarnings : wallets.reduce((sum, w) => sum + (w.type === 'Referral' ? w.availableBalance + w.withdrawnBalance : 0), 0);
  const pendingVal = reconStats ? reconStats.totalPendingReleases : wallets.reduce((sum, w) => sum + w.pendingBalance, 0);
  const availableVal = reconStats ? reconStats.totalAvailableBalances : wallets.reduce((sum, w) => sum + w.availableBalance, 0);
  const settledVal = reconStats ? reconStats.totalWithdrawals : wallets.reduce((sum, w) => sum + w.withdrawnBalance, 0);

  return (
    <div className="space-y-6">

      {/* Page Header */}
      <div className="bg-card border border-border/80 rounded-2xl p-4 shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 text-primary rounded-xl">
            <Wallet2 size={24} />
          </div>
          <div>
            <h2 className="text-xs font-bold uppercase tracking-wider text-foreground">Global Ledger & Settlement Center</h2>
            <p className="text-[10px] text-muted-foreground mt-0.5">Manage platform reserves, referral pools, merchant wallets, and authorize withdrawal clearances.</p>
          </div>
        </div>
      </div>

      {/* KPI Financial Boxes Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">

        {/* Company Wallet Box */}
        <div className="bg-card border border-border/80 rounded-2xl p-4 shadow-sm hover:scale-[1.01] transition-transform flex flex-col justify-between min-h-[105px]">
          <div className="flex justify-between items-center">
            <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">Company Wallet</span>
            <div className="p-1.5 bg-indigo-500/10 text-indigo-500 rounded-lg">
              <Briefcase size={14} />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-sm font-mono font-bold text-indigo-500 block">
              ₹{companyWalletVal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </span>
            <span className="text-[8px] text-muted-foreground block mt-1">Net Platform Fee Share</span>
          </div>
        </div>

        {/* Referral Amount Box */}
        <div className="bg-card border border-border/80 rounded-2xl p-4 shadow-sm hover:scale-[1.01] transition-transform flex flex-col justify-between min-h-[105px]">
          <div className="flex justify-between items-center">
            <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">Referral Pools</span>
            <div className="p-1.5 bg-cyan-500/10 text-cyan-500 rounded-lg">
              <Users size={14} />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-sm font-mono font-bold text-cyan-500 block">
              ₹{referralVal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </span>
            <span className="text-[8px] text-muted-foreground block mt-1">Multi-Level Commissions</span>
          </div>
        </div>

        {/* Global Escrow Holding Pool */}
        <div className="bg-card border border-border/80 rounded-2xl p-4 shadow-sm hover:scale-[1.01] transition-transform flex flex-col justify-between min-h-[105px]">
          <div className="flex justify-between items-center">
            <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">Holding Escrow</span>
            <div className="p-1.5 bg-amber-500/10 text-amber-500 rounded-lg">
              <Clock size={14} />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-sm font-mono font-bold text-amber-500 block">
              ₹{pendingVal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </span>
            <span className="text-[8px] text-muted-foreground block mt-1">Locked in Return Windows</span>
          </div>
        </div>

        {/* Available Settlements Box */}
        <div className="bg-card border border-border/80 rounded-2xl p-4 shadow-sm hover:scale-[1.01] transition-transform flex flex-col justify-between min-h-[105px]">
          <div className="flex justify-between items-center">
            <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">Available Funds</span>
            <div className="p-1.5 bg-emerald-500/10 text-emerald-500 rounded-lg">
              <ShieldCheck size={14} />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-sm font-mono font-bold text-emerald-500 block">
              ₹{availableVal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </span>
            <span className="text-[8px] text-muted-foreground block mt-1">Withdrawal Eligible</span>
          </div>
        </div>

        {/* Settled Outflows Box */}
        <div className="bg-card border border-border/80 rounded-2xl p-4 shadow-sm hover:scale-[1.01] transition-transform flex flex-col justify-between min-h-[105px]">
          <div className="flex justify-between items-center">
            <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">Cleared Outflows</span>
            <div className="p-1.5 bg-rose-500/10 text-rose-500 rounded-lg">
              <ArrowUpRight size={14} />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-sm font-mono font-bold text-rose-500 block">
              ₹{settledVal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </span>
            <span className="text-[8px] text-muted-foreground block mt-1">Paid Out to Bank/UPI</span>
          </div>
        </div>

      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

        {/* Account Ledgers section - 7 columns */}
        <div className="lg:col-span-7 bg-card border border-border/80 rounded-2xl p-5 shadow-sm space-y-4">
          <div className="border-b border-border/80 pb-3 mb-2 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">Wallet Accounts</h3>
              <p className="text-[8px] text-muted-foreground mt-0.5">Audit specific balance statements.</p>
            </div>

            {/* Quick Ledger Filter Buttons */}
            <div className="flex gap-1.5 flex-wrap">
              {(['All', 'Vendor', 'Referral', 'Franchise'] as const).map(type => (
                <button
                  key={type}
                  onClick={() => setWalletFilter(type)}
                  className={`px-2.5 py-1 text-[9px] font-semibold border rounded-lg transition-all ${walletFilter === type
                    ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                    : 'bg-card text-muted-foreground border-border hover:bg-secondary/40'
                    }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          {/* Filtering Controls Box for Ledgers */}
          <div className="bg-secondary/10 border border-border/40 p-3 rounded-xl grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search Account Holder / ID..."
                value={ledgerSearch}
                onChange={(e) => setLedgerSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 border border-border/85 focus:border-primary rounded-lg bg-card text-[10px] text-foreground outline-none transition-all placeholder:text-muted-foreground"
              />
            </div>

            <div className="flex items-center gap-2">
              <SlidersHorizontal size={12} className="text-muted-foreground shrink-0" />
              <select
                value={balanceFilter}
                onChange={(e) => setBalanceFilter(e.target.value as any)}
                className="w-full text-[10px] p-1.5 border border-border/85 rounded-lg bg-card text-foreground outline-none font-semibold cursor-pointer"
              >
                <option value="All">All Balance Levels</option>
                <option value="With Balance">Active Balances (&gt; 0)</option>
                <option value="Zero Balance">Empty Wallets (₹0.00)</option>
              </select>
            </div>
          </div>

          {/* Table Container */}
          <div className="overflow-x-auto border border-border rounded-xl">
            <table className="w-full border-collapse text-left text-xs text-foreground">
              <thead className="bg-secondary/40 select-none">
                <tr>
                  <th className="p-2.5 font-semibold text-muted-foreground text-[10px] uppercase">Account Holder</th>
                  <th className="p-2.5 font-semibold text-muted-foreground text-[10px] uppercase">Type</th>
                  <th className="p-2.5 font-semibold text-muted-foreground text-[10px] uppercase text-right">Holding</th>
                  <th className="p-2.5 font-semibold text-muted-foreground text-[10px] uppercase text-right">Available</th>
                  <th className="p-2.5 font-semibold text-muted-foreground text-[10px] uppercase text-right">Settled</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredWallets.map(w => (
                  <tr key={w.id} className="hover:bg-secondary/10 transition-colors">
                    <td className="p-2.5">
                      <span className="font-semibold text-foreground block truncate max-w-[140px]">{w.ownerName}</span>
                      <span className="text-[8px] text-muted-foreground block mt-0.5 font-mono truncate max-w-[140px]">{w.id}</span>
                    </td>
                    <td className="p-2.5">
                      <span className={`px-2 py-0.5 text-[8px] font-bold rounded-lg ${w.type === 'Vendor'
                        ? 'bg-amber-500/10 text-amber-500'
                        : w.type === 'Franchise'
                          ? 'bg-indigo-500/10 text-indigo-500'
                          : 'bg-cyan-500/10 text-cyan-500'
                        }`}>{w.type}</span>
                    </td>
                    <td className="p-2.5 text-right font-mono text-muted-foreground">₹{w.pendingBalance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                    <td className="p-2.5 text-right font-mono font-bold text-emerald-500">₹{w.availableBalance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                    <td className="p-2.5 text-right font-mono text-foreground font-medium">₹{w.withdrawnBalance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                  </tr>
                ))}
                {filteredWallets.length === 0 && (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-xs text-muted-foreground">
                      No matching account ledgers found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Payouts Approvals section - 5 columns */}
        <div className="lg:col-span-5 bg-card border border-border/80 rounded-2xl p-5 shadow-sm space-y-4">
          <div className="border-b border-border/80 pb-3 mb-2 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">Settlement queue</h3>
              <p className="text-[8px] text-muted-foreground mt-0.5">Approve withdrawal payouts.</p>
            </div>

            {/* Quick Status Selector */}
            <select
              value={withdrawalFilter}
              onChange={(e) => setWithdrawalFilter(e.target.value as any)}
              className="text-[10px] p-1.5 border border-border/85 rounded-lg bg-card text-foreground outline-none font-semibold cursor-pointer"
            >
              <option value="Pending">Pending Queue</option>
              <option value="Approved">Approved / Cleared</option>
              <option value="Rejected">Rejected</option>
              <option value="All">All Statuses</option>
            </select>
          </div>

          {/* Filtering Controls Box for Payouts */}
          <div className="bg-secondary/10 border border-border/40 p-3 rounded-xl space-y-3">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search by name, ID, destination..."
                value={payoutSearch}
                onChange={(e) => setPayoutSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 border border-border/85 focus:border-primary rounded-lg bg-card text-[10px] text-foreground outline-none transition-all placeholder:text-muted-foreground"
              />
            </div>

            <div className="flex items-center gap-2">
              <SlidersHorizontal size={12} className="text-muted-foreground shrink-0" />
              <select
                value={payoutTypeFilter}
                onChange={(e) => setPayoutTypeFilter(e.target.value as any)}
                className="w-full text-[10px] p-1.5 border border-border/85 rounded-lg bg-card text-foreground outline-none font-semibold cursor-pointer"
              >
                <option value="All">All Account Types</option>
                <option value="Vendor">Vendors Only</option>
                <option value="Franchise">Franchises Only</option>
                <option value="Referral">Promoters (Referrals)</option>
              </select>
            </div>
          </div>

          {/* Requests Queue Cards */}
          <div className="space-y-3 max-h-[390px] overflow-y-auto no-scrollbar pr-1">
            {filteredWithdrawals.map(req => (
              <div key={req.id} className="bg-secondary/15 border border-border/40 rounded-xl p-3.5 space-y-2.5 text-xs hover:border-border transition-colors">
                <div className="flex justify-between items-start border-b border-border/60 pb-2">
                  <div>
                    <span className="font-bold text-foreground text-xs block">{req.ownerName}</span>
                    <span className="text-[8px] text-muted-foreground block font-mono mt-0.5">{req.id} • {req.date}</span>
                  </div>
                  <span className="font-mono font-bold text-foreground text-xs">₹{req.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                </div>

                <div className="flex justify-between items-center text-[9px] text-muted-foreground font-mono">
                  <div className="flex items-center gap-1.5">
                    <span className={`w-1.5 h-1.5 rounded-full ${req.type === 'Vendor'
                      ? 'bg-amber-500'
                      : req.type === 'Franchise'
                        ? 'bg-indigo-500'
                        : 'bg-cyan-500'
                      }`}></span>
                    <span>Role: {req.type}</span>
                  </div>
                  <span className="flex items-center gap-1 font-semibold">
                    {req.method === 'UPI' ? <CreditCard size={10} /> : <Landmark size={10} />}
                    {req.method}
                  </span>
                </div>

                <p className="bg-card p-2 border border-border/50 rounded-lg text-[8px] font-mono leading-normal text-muted-foreground break-all select-all">
                  Destination: {req.details}
                </p>

                <div className="bg-secondary/20 p-2 rounded-lg border border-border/30 flex justify-between items-center text-[8px] font-mono">
                  <div>
                    <span className="text-muted-foreground">Gross:</span> <span className="font-bold text-foreground">₹{req.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Fee/TDS ({req.feePercent || 15}%):</span> <span className="font-bold text-rose-500">-₹{(req.feeAmount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Net Payout:</span> <span className="font-bold text-emerald-500">₹{(req.netAmount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                  </div>
                </div>

                {req.status === 'Pending' ? (
                  <div className="flex gap-2 pt-1.5 border-t border-border/40">
                    <button
                      onClick={() => handleOpenClearModal(req)}
                      className="w-1/2 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-lg transition-all text-[10px] flex items-center justify-center gap-1 shadow-md shadow-emerald-500/10 cursor-pointer"
                    >
                      <Check size={12} /> Clear Payout
                    </button>
                    <button
                      onClick={() => handleRejectPayout(req.id)}
                      className="w-1/2 py-1.5 bg-rose-500/10 hover:bg-rose-500/25 border border-rose-500/20 text-rose-500 font-semibold rounded-lg transition-all text-[10px] flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <X size={12} /> Reject
                    </button>
                  </div>
                ) : (
                  <div className={`px-2.5 py-1.5 text-center rounded-lg text-[10px] font-bold border ${req.status === 'Approved'
                    ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500'
                    : 'bg-rose-500/10 border-rose-500/20 text-rose-500'
                    }`}>
                    Status: {req.status === 'Approved' ? 'PAYOUT CLEARED - SUCCESSFULLY DONE' : req.status.toUpperCase()}
                  </div>
                )}
              </div>
            ))}
            {filteredWithdrawals.length === 0 && (
              <p className="text-center text-xs text-muted-foreground py-10 select-none">No requests found in this queue.</p>
            )}
          </div>
        </div>

      </div>

      {/* CLEAR PAYOUT MODAL DIALOG */}
      {selectedPayout && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 text-white w-full max-w-md rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                  <Landmark className="w-4 h-4 text-emerald-400" />
                  Clear & Authorize Payout Settlement
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Recipient: <span className="font-bold text-white">{selectedPayout.ownerName}</span> ({selectedPayout.type})
                </p>
              </div>
              <button onClick={() => setSelectedPayout(null)} className="text-slate-400 hover:text-white p-1 rounded-lg border-none bg-transparent cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Payout Summary breakdown */}
            <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-1.5 text-xs font-mono">
              <div className="flex justify-between text-slate-400">
                <span>Gross Requested Amount</span>
                <span className="font-bold text-white">₹{Number(selectedPayout.amount || 0).toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>TDS & Platform Fee ({selectedPayout.feePercent || 15}%)</span>
                <span className="font-bold text-rose-400">-₹{Number(selectedPayout.feeAmount || 0).toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between text-slate-200 border-t border-slate-800 pt-1.5 font-bold">
                <span>Net Bank Payout</span>
                <span className="text-emerald-400 text-sm font-extrabold">₹{Number(selectedPayout.netAmount || selectedPayout.amount || 0).toLocaleString('en-IN')}</span>
              </div>
              <div className="text-[10px] text-amber-300/80 pt-1 border-t border-slate-800/80">
                Destination: {selectedPayout.details}
              </div>
            </div>

            {/* Admin Input Fields */}
            <div className="space-y-3">
              <div className="space-y-1 text-left">
                <label className="text-xs font-bold text-slate-300 block">
                  Transaction ID / Bank UTR Number <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  value={payoutTxnId}
                  onChange={(e) => setPayoutTxnId(e.target.value)}
                  placeholder="e.g. TXN98401928 or UTR9847102934"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs font-mono font-bold text-amber-300 outline-none focus:border-amber-400"
                />
              </div>

              <div className="space-y-1 text-left">
                <label className="text-xs font-bold text-slate-300 block">Payout Method</label>
                <select
                  value={payoutMethod}
                  onChange={(e) => setPayoutMethod(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs font-bold text-white outline-none focus:border-amber-400 cursor-pointer"
                >
                  <option value="UPI">UPI Payment</option>
                  <option value="Bank Transfer (NEFT/IMPS)">Bank Transfer (NEFT / IMPS / RTGS)</option>
                  <option value="Cash">Cash Handout</option>
                  <option value="Cheque">Bank Cheque</option>
                  <option value="Wallet Direct">ApexBee Direct Wallet Disbursal</option>
                </select>
              </div>

              <div className="space-y-1 text-left">
                <label className="text-xs font-bold text-slate-300 block">Admin Remarks / Audit Notes</label>
                <input
                  type="text"
                  value={payoutRemarks}
                  onChange={(e) => setPayoutRemarks(e.target.value)}
                  placeholder="e.g. Payout cleared via HDFC NetBanking"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-slate-200 outline-none focus:border-amber-400"
                />
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setSelectedPayout(null)}
                className="w-1/3 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl text-xs transition cursor-pointer border-none"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmClearPayout}
                className="w-2/3 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-extrabold rounded-xl text-xs transition shadow-lg cursor-pointer border-none flex items-center justify-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                Submit & Clear Payout
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
