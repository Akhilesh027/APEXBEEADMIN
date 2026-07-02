import React, { useState, useEffect } from 'react';
import { useAdminState } from '../context/AdminStateContext';
import { Landmark, TrendingUp, Sparkles, Coins, Info } from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';

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

export const FinancialCenter: React.FC = () => {
  const { orders, withdrawals } = useAdminState();
  const [stats, setStats] = useState<ReconciliationStats | null>(null);

  useEffect(() => {
    const fetchFinanceStats = async () => {
      try {
        const token = localStorage.getItem('adminToken') || localStorage.getItem('token');
        if (!token) return;
        
        const reconRes = await fetch('https://server.apexbee.in/api/admin/reconciliation', {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (reconRes.ok) {
          const data = await reconRes.json();
          setStats(data.stats);
        }
      } catch (err) {
        console.error('Error fetching reconciliation stats:', err);
      }
    };
    fetchFinanceStats();
  }, [orders, withdrawals]); // Re-fetch when orders or withdrawals update

  // 1. Group real orders chronologically by month for GMV (Gross sales) & Net Platform Fee Revenue
  const getMonthlyFinanceData = () => {
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthlyGroups: Record<string, { gmv: number; revenue: number; monthIndex: number }> = {};

    orders.forEach(o => {
      if (!o.date) return;
      const dateParts = o.date.split('-');
      if (dateParts.length >= 2) {
        const monthVal = parseInt(dateParts[1] || '', 10);
        if (monthVal >= 1 && monthVal <= 12) {
          const name = monthNames[monthVal - 1] || '';
          if (!monthlyGroups[name]) {
            monthlyGroups[name] = { gmv: 0, revenue: 0, monthIndex: monthVal };
          }
          monthlyGroups[name].gmv += o.totalAmount;
          // Platform fee is estimated at 5% of GMV gross checkout
          monthlyGroups[name].revenue += o.totalAmount * 0.05;
        }
      }
    });

    const data = Object.entries(monthlyGroups).map(([month, val]) => ({
      month,
      gmv: Number((val.gmv / 1000).toFixed(2)), // in thousands
      revenue: Number((val.revenue / 1000).toFixed(2)), // in thousands
      monthIndex: val.monthIndex
    }));

    return data.sort((a, b) => a.monthIndex - b.monthIndex);
  };

  const monthlyFinanceData = getMonthlyFinanceData();

  // 2. Compile real cash flow log by merging orders (Inflows) & cleared payouts (Outflows)
  const getCashFlowLogs = () => {
    const logs: any[] = [];
    
    // Inflows from order checkouts
    orders.forEach(o => {
      logs.push({
        id: o.id,
        type: 'UPI Inward Checkout',
        desc: `Order checkout by ${o.customerName}`,
        amount: o.totalAmount,
        state: 'Inflow',
        date: o.date
      });
    });

    // Outflows from cleared/approved payout requests
    withdrawals.filter(w => w.status === 'Approved').forEach(w => {
      logs.push({
        id: w.id,
        type: `${w.type} Payout Cleared`,
        desc: `Withdrawal processed to ${w.ownerName}`,
        amount: w.amount,
        state: 'Outflow',
        date: w.date
      });
    });

    // Sort descending by date and slice top 5
    return logs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 5);
  };

  const cashFlowLogs = getCashFlowLogs();

  return (
    <div className="space-y-6">
      
      {/* Top operational metrics row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 select-none">
        
        {/* Total Sales Box */}
        <div className="bg-card border border-border/80 rounded-2xl p-4 flex items-center justify-between shadow-sm">
          <div>
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Total Sales</span>
            <span className="text-xl font-bold font-mono text-foreground mt-1 block">
              ₹{(stats?.totalSales || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </span>
            <span className="text-[9px] text-emerald-500 mt-1 block font-semibold">Live Gross GMV</span>
          </div>
          <Coins className="text-primary shrink-0" size={24} />
        </div>

        {/* Company Net Earnings Box */}
        <div className="bg-card border border-border/80 rounded-2xl p-4 flex items-center justify-between shadow-sm">
          <div>
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Company Net Revenue</span>
            <span className="text-xl font-bold font-mono text-foreground mt-1 block">
              ₹{(stats?.totalCompanyEarnings || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </span>
            <span className="text-[9px] text-emerald-500 mt-1 block font-semibold">Platform Profits Share</span>
          </div>
          <TrendingUp className="text-violet-500 shrink-0" size={24} />
        </div>

        {/* Referral Payouts Box */}
        <div className="bg-card border border-border/80 rounded-2xl p-4 flex items-center justify-between shadow-sm">
          <div>
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Referral Payouts</span>
            <span className="text-xl font-bold font-mono text-foreground mt-1 block">
              ₹{(stats?.totalReferralEarnings || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </span>
            <span className="text-[9px] text-emerald-500 mt-1 block font-semibold">Released MLM Share</span>
          </div>
          <Landmark className="text-amber-500 shrink-0" size={24} />
        </div>

        {/* Franchise Earnings Box */}
        <div className="bg-card border border-border/80 rounded-2xl p-4 flex items-center justify-between shadow-sm">
          <div>
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Franchise Earnings</span>
            <span className="text-xl font-bold font-mono text-foreground mt-1 block">
              ₹{(stats?.totalFranchiseEarnings || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </span>
            <span className="text-[9px] text-emerald-500 mt-1 block font-semibold">Territory Share</span>
          </div>
          <Sparkles className="text-emerald-500 shrink-0" size={24} />
        </div>

      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Monthly Revenue Area Chart - 2 Columns */}
        <div className="lg:col-span-2 bg-card border border-border/80 rounded-2xl p-5 shadow-sm space-y-4 flex flex-col justify-between">
          <div>
            <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">Platform GMV & Net Revenue Trend</h3>
            <p className="text-[10px] text-muted-foreground mt-0.5 font-mono">Platform volume trended in Thousands ₹</p>
          </div>

          {monthlyFinanceData.length === 0 ? (
            <div className="h-56 flex flex-col items-center justify-center text-center text-xs text-muted-foreground bg-secondary/5 rounded-xl border border-border/40">
              <TrendingUp size={24} className="mb-2 text-muted-foreground/40" />
              <p>No transaction sales history found in the database.</p>
            </div>
          ) : (
            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={monthlyFinanceData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorGmv" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorNetRev" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(100, 116, 139, 0.1)" />
                  <XAxis dataKey="month" stroke="rgba(100, 116, 139, 0.5)" fontSize={10} tickLine={false} />
                  <YAxis stroke="rgba(100, 116, 139, 0.5)" fontSize={10} tickLine={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)' }}
                    itemStyle={{ fontSize: 11, color: 'var(--foreground)' }}
                  />
                  <Area type="monotone" dataKey="gmv" name="Gross Merchandise Value (GMV)" stroke="#6366f1" strokeWidth={2} fillOpacity={1} fill="url(#colorGmv)" />
                  <Area type="monotone" dataKey="revenue" name="Platform Net Revenue" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorNetRev)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Platform Liabilities breakdown - 1 Column */}
        <div className="bg-card border border-border/80 rounded-2xl p-5 shadow-sm space-y-4">
          <div className="border-b border-border pb-3 flex items-center justify-between select-none">
            <h3 className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5">
              <Landmark size={14} className="text-rose-500" />
              Platform Reconciliations
            </h3>
            <span className="text-[9px] text-rose-500 font-semibold font-mono">Total Pending: ₹{(stats?.totalPendingReleases || 0).toLocaleString('en-IN')}</span>
          </div>

          <div className="space-y-3.5 text-xs">
            <div className="flex justify-between border-b border-border/40 pb-1.5">
              <span className="text-muted-foreground">Total Vendor Released</span>
              <span className="font-mono text-foreground font-semibold">₹{(stats?.totalVendorEarnings || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
            </div>
            <div className="flex justify-between border-b border-border/40 pb-1.5">
              <span className="text-muted-foreground">Total Franchise Released</span>
              <span className="font-mono text-foreground font-semibold">₹{(stats?.totalFranchiseEarnings || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
            </div>
            <div className="flex justify-between border-b border-border/40 pb-1.5">
              <span className="text-muted-foreground">Total MLM Referrals Released</span>
              <span className="font-mono text-foreground font-semibold">₹{(stats?.totalReferralEarnings || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
            </div>
            <div className="flex justify-between border-b border-border/40 pb-1.5">
              <span className="text-muted-foreground">Total System Available Balance</span>
              <span className="font-mono text-foreground font-semibold">₹{(stats?.totalAvailableBalances || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
            </div>
            <div className="flex justify-between font-bold text-rose-500 pt-1">
              <span>Total Withdrawals Cleared</span>
              <span className="font-mono">₹{(stats?.totalWithdrawals || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
            </div>
          </div>

          <div className="p-3 bg-secondary/15 rounded-xl border border-border/40 text-[9px] text-muted-foreground flex gap-1 items-center select-none">
            <Info size={14} className="text-primary shrink-0" />
            <span>Values represent real aggregates calculated dynamically from the MongoDB transaction records and wallets.</span>
          </div>
        </div>

      </div>

      {/* Cash Flow Logs */}
      <div className="bg-card border border-border/80 rounded-2xl overflow-hidden shadow-sm">
        <div className="px-5 py-4 border-b border-border/60 bg-secondary/10 flex justify-between items-center select-none">
          <span className="text-xs font-bold text-foreground uppercase tracking-wider">Ecosystem Net Cash Flow Summary</span>
          <span className="text-[10px] text-muted-foreground font-mono">Aggregated database transactions</span>
        </div>

        <div className="divide-y divide-border/60">
          {cashFlowLogs.map((log, idx) => (
            <div key={idx} className="p-4 flex items-center justify-between text-xs hover:bg-secondary/10 transition-colors">
              <div className="space-y-1">
                <span className="font-semibold text-foreground text-sm block">{log.type}</span>
                <span className="text-[10px] text-muted-foreground block font-mono">
                  ID: {log.id} • {log.desc}
                </span>
                <span className="text-[9px] text-muted-foreground font-mono block">Logged At: {log.date || 'N/A'}</span>
              </div>
              <div className="shrink-0 flex items-center gap-3">
                <span className={`font-mono font-bold text-sm ${log.state === 'Inflow' ? 'text-emerald-500' : 'text-rose-500'}`}>
                  {log.state === 'Inflow' ? '+' : '-'}₹{log.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </span>
                <span className={`px-2 py-0.5 rounded text-[8px] font-bold ${log.state === 'Inflow' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}`}>
                  {log.state.toUpperCase()}
                </span>
              </div>
            </div>
          ))}
          {cashFlowLogs.length === 0 && (
            <p className="p-8 text-center text-xs text-muted-foreground select-none">No cash flows logged in the database yet.</p>
          )}
        </div>
      </div>

    </div>
  );
};
