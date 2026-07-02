import React, { useState } from 'react';
import { useAdminState } from '../context/AdminStateContext';
import { ReferralNode } from '../types';
import { Users2, Search, ArrowDown, ChevronRight, UserCheck, DollarSign, Wallet2, Award } from 'lucide-react';

export const ReferralSystem: React.FC = () => {
  const { referrals } = useAdminState();
  const [selectedUser, setSelectedUser] = useState<ReferralNode | null>(referrals[0] || null);
  const [search, setSearch] = useState('');

  const filteredReferrals = referrals.filter(r =>
    r.userName.toLowerCase().includes(search.toLowerCase()) ||
    r.userId.toLowerCase().includes(search.toLowerCase())
  );

  // Helper to find upline nodes
  const getUpline = (node: ReferralNode | null): ReferralNode[] => {
    if (!node || !node.referredById) return [];
    const parent = referrals.find(r => r.userId === node.referredById);
    if (!parent) return [];
    return [...getUpline(parent), parent];
  };

  // Helper to find downline nodes
  const getDownline = (userId: string): ReferralNode[] => {
    return referrals.filter(r => r.referredById === userId);
  };

  const uplines = getUpline(selectedUser);
  const downlines = selectedUser ? getDownline(selectedUser.userId) : [];

  return (
    <div className="space-y-6">
      
      {/* Intro info */}
      <div className="bg-card border border-border/80 rounded-2xl p-4 shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Users2 className="text-primary shrink-0" size={24} />
          <div>
            <h2 className="text-xs font-bold uppercase tracking-wider text-foreground">Referral Commissions Ledger</h2>
            <p className="text-[10px] text-muted-foreground mt-0.5">Audit uplines/downlines networks. Track 3-Level commission disbursements subtracted from platform fees.</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Promoters List - 4 columns */}
        <div className="lg:col-span-4 bg-card border border-border/80 rounded-2xl overflow-hidden shadow-sm">
          <div className="px-5 py-4 border-b border-border/60 bg-secondary/10 flex items-center justify-between gap-4">
            <span className="text-xs font-bold text-foreground uppercase tracking-wider">Top Promoters</span>
            
            <div className="relative w-40 shrink-0">
              <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search promoter..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-7 pr-3 py-1 border border-border/80 focus:border-primary rounded-lg bg-card text-[10px] text-foreground outline-none"
              />
            </div>
          </div>
          
          <div className="divide-y divide-border/60">
            {filteredReferrals.map(user => (
              <div
                key={user.userId}
                onClick={() => setSelectedUser(user)}
                className={`p-3.5 flex items-center justify-between cursor-pointer hover:bg-secondary/20 transition-all ${
                  selectedUser?.userId === user.userId ? 'bg-secondary/40 border-l-4 border-primary' : ''
                }`}
              >
                <div>
                  <span className="font-semibold text-xs text-foreground block">{user.userName}</span>
                  <span className="text-[9px] text-muted-foreground mt-0.5 block font-mono">ID: {user.userId}</span>
                </div>
                <div className="text-right shrink-0">
                  <span className="font-mono text-xs font-bold text-foreground block">₹{user.commissionEarned}</span>
                  <span className="text-[9px] text-muted-foreground block">{user.totalPurchases} orders</span>
                </div>
              </div>
            ))}
            {filteredReferrals.length === 0 && (
              <div className="p-8 text-center text-xs text-muted-foreground">
                No promoters found.
              </div>
            )}
          </div>
        </div>

        {/* Tree Visualizer & Ledger Info - 8 columns */}
        {selectedUser ? (
          <div className="lg:col-span-8 space-y-6">
            
            {/* Summary card */}
            <div className="bg-card border border-border/80 rounded-2xl p-5 shadow-sm grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-3 flex justify-between items-center border-b border-border pb-3 mb-2">
                <div>
                  <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">{selectedUser.userName}</h3>
                  <p className="text-[9px] text-muted-foreground mt-0.5 font-mono">ID: {selectedUser.userId}</p>
                </div>
                <span className="px-2 py-0.5 bg-indigo-500/10 text-indigo-500 rounded text-[9px] font-mono">Lvl {selectedUser.level} Network Node</span>
              </div>

              <div className="bg-secondary/15 p-3 rounded-xl border border-border/40">
                <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider block">Total Sales Initiated</span>
                <span className="font-mono text-base font-bold text-foreground block mt-1">{selectedUser.totalPurchases} Orders</span>
              </div>

              <div className="bg-secondary/15 p-3 rounded-xl border border-border/40">
                <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider block">Commissions Earned</span>
                <span className="font-mono text-base font-bold text-emerald-500 block mt-1">₹{selectedUser.commissionEarned.toLocaleString('en-IN')}</span>
              </div>

              <div className="bg-secondary/15 p-3 rounded-xl border border-border/40">
                <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider block">Referred By</span>
                <span className="text-[10px] font-medium text-foreground block mt-2 truncate">
                  {selectedUser.referredById ? referrals.find(r => r.userId === selectedUser.referredById)?.userName || selectedUser.referredById : 'Direct Signup'}
                </span>
              </div>
            </div>

            {/* Visual 3-Level Hierarchy Node Graph */}
            <div className="bg-card border border-border/80 rounded-2xl p-5 shadow-sm space-y-4">
              <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">Visual Referral Stream Hierarchy</h3>

              <div className="border border-border/60 rounded-xl p-6 bg-secondary/15 flex flex-col items-center justify-center space-y-4 text-xs font-mono text-foreground select-none">
                
                {/* Upline recommenders (State level A -> B -> C) */}
                {uplines.length > 0 && (
                  <div className="flex flex-col items-center space-y-2 opacity-60">
                    <span className="text-[8px] text-muted-foreground uppercase font-bold font-sans">Upline / Referral Recommenders</span>
                    <div className="flex flex-wrap justify-center items-center gap-1">
                      {uplines.map((up, idx) => (
                        <React.Fragment key={up.userId}>
                          <div className="px-2 py-1 bg-secondary text-muted-foreground rounded-lg border border-border">
                            {up.userName.split(' ')[0]}
                          </div>
                          {idx < uplines.length - 1 && <ChevronRight size={10} className="text-muted-foreground" />}
                        </React.Fragment>
                      ))}
                    </div>
                    <ArrowDown size={14} className="text-muted-foreground" />
                  </div>
                )}

                {/* Selected User */}
                <div className="px-4 py-2 bg-indigo-500 text-white rounded-xl font-bold border border-indigo-600 shadow-md shadow-indigo-500/10 text-center scale-105">
                  <UserCheck size={14} className="inline mr-1" />
                  {selectedUser.userName} (Active User)
                  <span className="block text-[8px] opacity-75 font-normal mt-0.5">ID: {selectedUser.userId}</span>
                </div>

                {/* Downline referrals (Referrals generated by selected user) */}
                {downlines.length > 0 && (
                  <div className="w-full flex flex-col items-center space-y-2 pt-2 border-t border-dashed border-border/60">
                    <ArrowDown size={14} className="text-muted-foreground" />
                    <span className="text-[8px] text-muted-foreground uppercase font-bold font-sans">Direct Referrals (Level 1)</span>
                    <div className="flex flex-wrap justify-center gap-2">
                      {downlines.map(down => (
                        <div
                          key={down.userId}
                          onClick={() => setSelectedUser(down)}
                          className="px-2.5 py-1 bg-emerald-500/5 hover:bg-emerald-500/15 text-emerald-600 rounded-lg border border-emerald-500/20 cursor-pointer transition-colors"
                        >
                          {down.userName.split(' ')[0]}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Dynamic Simulated Ledger History */}
            <div className="bg-card border border-border/80 rounded-2xl overflow-hidden shadow-sm">
              <div className="px-5 py-4 border-b border-border/60">
                <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">Recent Commission Transactions</h3>
              </div>
              <div className="divide-y divide-border/60 text-xs">
                {[
                  { desc: 'Referral purchase by Divya Patel (Level 1)', amount: '₹20.00', date: '2026-06-11 18:42', type: 'Credit', icon: Wallet2 },
                  { desc: 'Referral purchase by Eshwar Rao (Level 2)', amount: '₹15.00', date: '2026-06-10 14:30', type: 'Credit', icon: Award },
                  { desc: 'Referral purchase by Chaggan Lal (Level 3)', amount: '₹10.00', date: '2026-06-08 10:45', type: 'Credit', icon: DollarSign }
                ].map((ledger, idx) => {
                  const Icon = ledger.icon;
                  return (
                    <div key={idx} className="p-3.5 flex items-center justify-between">
                      <div className="flex items-center gap-3 overflow-hidden">
                        <div className="p-1.5 bg-emerald-500/10 text-emerald-500 rounded-lg shrink-0">
                          <Icon size={14} />
                        </div>
                        <div className="overflow-hidden">
                          <p className="font-semibold text-foreground truncate">{ledger.desc}</p>
                          <p className="text-[9px] text-muted-foreground font-mono mt-0.5">{ledger.date}</p>
                        </div>
                      </div>
                      <span className="font-mono font-bold text-emerald-500 font-semibold shrink-0">+{ledger.amount}</span>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>
        ) : (
          <div className="lg:col-span-8 flex flex-col items-center justify-center py-20 text-center text-xs text-muted-foreground select-none">
            Select a promoter user to display tree paths and ledger balance streams.
          </div>
        )}

      </div>

    </div>
  );
};
