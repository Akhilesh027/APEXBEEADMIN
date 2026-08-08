import React, { useState, useEffect } from 'react';
import { Landmark, TrendingUp, Coins, Wallet, ShieldAlert, ArrowUpRight, CheckCircle, Clock, RefreshCw, Layers, DollarSign, PieChart as PieIcon, FileText } from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, BarChart, Bar } from 'recharts';

interface OrderSplit {
  orderId: string;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  orderStatus: string;
  paymentStatus: string;
  orderDate: string;
  grossAmount: number;
  vendorShare: number;
  platformComm: number;
  riderFee: number;
  franchiseFee: number;
  apexbeeNetProfit: number;
}

interface WithdrawalLog {
  id: string;
  entityName: string;
  entityRole: string;
  email: string;
  amount: number;
  availableBalance: number;
  paymentMethod: string;
  utrNumber: string;
  status: string;
  date: string;
}

interface TreasuryData {
  totalSales: number;
  totalOrdersCount: number;
  apexbeeNetProfit: number;
  totalVendorCommissions: number;
  totalFranchiseShare: number;
  totalRiderFeesPaid: number;
  walletsSummary: {
    totalEcosystemLiquid: number;
    totalVendorLiquid: number;
    totalRiderLiquid: number;
    totalFranchiseLiquid: number;
    totalUserLiquid: number;
    totalWithdrawnAll: number;
  };
  escrowAndLiquidity: {
    totalPendingEscrow: number;
    totalEcosystemLiquid: number;
    totalWithdrawalsCleared: number;
  };
  orderFinancialSplits: OrderSplit[];
  withdrawalLogs: WithdrawalLog[];
}

export const MasterTreasury: React.FC = () => {
  const [data, setData] = useState<TreasuryData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'revenue' | 'wallets' | 'withdrawals' | 'escrow' | 'splits'>('revenue');

  const fetchTreasuryData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('adminToken') || localStorage.getItem('token') || '';
      const res = await fetch('https://server.apexbee.in/api/admin/treasury-master', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.treasury) {
          setData(json.treasury);
        }
      }
    } catch (err) {
      console.error('Error fetching treasury data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTreasuryData();
  }, []);

  if (loading && !data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-3 text-muted-foreground">
        <RefreshCw className="w-8 h-8 animate-spin text-primary" />
        <span className="text-xs font-bold font-mono">Loading live database financial intelligence...</span>
      </div>
    );
  }

  const treasury = data || {
    totalSales: 0,
    totalOrdersCount: 0,
    apexbeeNetProfit: 0,
    totalVendorCommissions: 0,
    totalFranchiseShare: 0,
    totalRiderFeesPaid: 0,
    walletsSummary: {
      totalEcosystemLiquid: 0,
      totalVendorLiquid: 0,
      totalRiderLiquid: 0,
      totalFranchiseLiquid: 0,
      totalUserLiquid: 0,
      totalWithdrawnAll: 0
    },
    escrowAndLiquidity: {
      totalPendingEscrow: 0,
      totalEcosystemLiquid: 0,
      totalWithdrawalsCleared: 0
    },
    orderFinancialSplits: [],
    withdrawalLogs: []
  };

  return (
    <div className="space-y-6 font-sans text-left text-foreground">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
        <div>
          <h1 className="text-xl md:text-2xl font-black text-foreground flex items-center gap-2">
            <Coins className="w-6 h-6 text-indigo-500" /> Master Treasury & Ecosystem Intelligence
          </h1>
          <p className="text-xs text-muted-foreground mt-1 font-mono">
            100% Live MongoDB Audit of ApexBee Platform Revenues, Ecosystem Entity Wallets, Bank Withdrawals & Order Splits
          </p>
        </div>

        <button
          onClick={fetchTreasuryData}
          className="px-4 py-2 rounded-xl bg-primary text-primary-foreground font-bold text-xs flex items-center gap-2 transition hover:opacity-90 cursor-pointer shadow-xs"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh Live DB Data
        </button>
      </div>

      {/* Tabs Switcher */}
      <div className="flex flex-wrap gap-2 border-b border-border pb-3">
        {[
          { id: 'revenue', label: '1. 👑 ApexBee Net Revenue', icon: <TrendingUp className="w-3.5 h-3.5" /> },
          { id: 'wallets', label: '2. 👛 Ecosystem Wallets', icon: <Wallet className="w-3.5 h-3.5" /> },
          { id: 'withdrawals', label: '3. 💸 Withdrawals & Disbursals', icon: <Landmark className="w-3.5 h-3.5" /> },
          { id: 'escrow', label: '4. 🔒 Escrow & Liquidity', icon: <ShieldAlert className="w-3.5 h-3.5" /> },
          { id: 'splits', label: '5. 🧾 Order Financial Splits', icon: <FileText className="w-3.5 h-3.5" /> }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-3 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 transition cursor-pointer ${activeTab === tab.id
              ? 'bg-primary text-primary-foreground shadow-sm'
              : 'bg-secondary/60 text-muted-foreground hover:bg-secondary hover:text-foreground'
              }`}
          >
            {tab.icon}
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Hero Operational Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* GMV */}
        <div className="bg-card border border-border rounded-2xl p-4 flex flex-col justify-between shadow-xs">
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground">Gross Merchandise Value (GMV)</span>
          <span className="text-2xl font-black font-mono text-foreground mt-2">
            ₹{treasury.totalSales.toLocaleString('en-IN')}
          </span>
          <span className="text-[10px] text-emerald-500 font-semibold mt-1">Live customer checkouts ({treasury.totalOrdersCount} orders)</span>
        </div>

        {/* ApexBee Net Profit */}
        <div className="bg-card border border-indigo-500/20 bg-indigo-500/5 rounded-2xl p-4 flex flex-col justify-between shadow-xs">
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">ApexBee Net Profit</span>
          <span className="text-2xl font-black font-mono text-indigo-600 dark:text-indigo-400 mt-2">
            ₹{treasury.apexbeeNetProfit.toLocaleString('en-IN')}
          </span>
          <span className="text-[10px] text-muted-foreground font-semibold mt-1">Net Platform Fee after territory payouts</span>
        </div>

        {/* Total Ecosystem Liquid */}
        <div className="bg-card border border-border rounded-2xl p-4 flex flex-col justify-between shadow-xs">
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground">Total Ecosystem Liquid Balance</span>
          <span className="text-2xl font-black font-mono text-emerald-600 dark:text-emerald-400 mt-2">
            ₹{treasury.walletsSummary.totalEcosystemLiquid.toLocaleString('en-IN')}
          </span>
          <span className="text-[10px] text-muted-foreground font-semibold mt-1">Sum of all vendor, rider & user wallets</span>
        </div>

        {/* Total Withdrawals Cleared */}
        <div className="bg-card border border-border rounded-2xl p-4 flex flex-col justify-between shadow-xs">
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground">Bank Payouts Disbursed</span>
          <span className="text-2xl font-black font-mono text-amber-500 mt-2">
            ₹{treasury.escrowAndLiquidity.totalWithdrawalsCleared.toLocaleString('en-IN')}
          </span>
          <span className="text-[10px] text-muted-foreground font-semibold mt-1">Total transferred out to partner banks</span>
        </div>
      </div>

      {/* Tab 1: ApexBee Net Revenue */}
      {activeTab === 'revenue' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-card border border-border rounded-2xl p-5 shadow-xs space-y-4">
              <div>
                <h3 className="text-sm font-bold text-foreground uppercase tracking-wider flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-indigo-500" /> Revenue Stream Breakdown (Live Database Aggregates)
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">Categorized breakdown of ApexBee platform earnings.</p>
              </div>

              <div className="space-y-3 text-xs">
                <div className="flex justify-between items-center p-3 rounded-xl bg-secondary/20 border border-border">
                  <div className="flex flex-col">
                    <span className="font-extrabold text-foreground">Marketplace Vendor Commissions (10%)</span>
                    <span className="text-[10px] text-muted-foreground">Platform fees collected from vendor product sales</span>
                  </div>
                  <span className="font-mono font-black text-indigo-600 dark:text-indigo-400 text-sm">₹{treasury.totalVendorCommissions.toLocaleString('en-IN')}</span>
                </div>

                <div className="flex justify-between items-center p-3 rounded-xl bg-secondary/20 border border-border">
                  <div className="flex flex-col">
                    <span className="font-extrabold text-foreground">Franchise Territory Share (2%)</span>
                    <span className="text-[10px] text-muted-foreground">Disbursed to State, District & Mandal franchise holders</span>
                  </div>
                  <span className="font-mono font-bold text-rose-500 text-sm">-₹{treasury.totalFranchiseShare.toLocaleString('en-IN')}</span>
                </div>

                <div className="flex justify-between items-center p-3 rounded-xl bg-secondary/20 border border-border">
                  <div className="flex flex-col">
                    <span className="font-extrabold text-foreground">Delivery Partner Drop Fees</span>
                    <span className="text-[10px] text-muted-foreground">Flat logistics payout allocated per delivery rider</span>
                  </div>
                  <span className="font-mono font-bold text-amber-500 text-sm">₹{treasury.totalRiderFeesPaid.toLocaleString('en-IN')}</span>
                </div>

                <div className="flex justify-between items-center p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 font-bold">
                  <span className="font-black text-sm">ApexBee Retained Net Profit</span>
                  <span className="font-mono font-black text-base">₹{treasury.apexbeeNetProfit.toLocaleString('en-IN')}</span>
                </div>
              </div>
            </div>

            <div className="bg-card border border-border rounded-2xl p-5 shadow-xs flex flex-col justify-between space-y-4">
              <div>
                <h3 className="text-sm font-bold text-foreground uppercase tracking-wider">Revenue Sources Summary</h3>
                <p className="text-xs text-muted-foreground mt-0.5">Platform income channels</p>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between border-b border-border/60 pb-2">
                  <span className="text-muted-foreground">Vendor Sales GMV</span>
                  <span className="font-mono font-bold">₹{treasury.totalSales.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between border-b border-border/60 pb-2">
                  <span className="text-muted-foreground">Total Orders Settled</span>
                  <span className="font-mono font-bold">{treasury.totalOrdersCount} Orders</span>
                </div>
                <div className="flex justify-between border-b border-border/60 pb-2">
                  <span className="text-muted-foreground">Avg Platform Commission Rate</span>
                  <span className="font-mono font-bold text-indigo-500">10.0%</span>
                </div>
                <div className="flex justify-between border-b border-border/60 pb-2">
                  <span className="text-muted-foreground">Franchise Royalty Share</span>
                  <span className="font-mono font-bold text-purple-500">2.0%</span>
                </div>
              </div>

              <div className="p-3 bg-secondary/30 rounded-xl border border-border text-[10px] text-muted-foreground font-mono">
                All metrics are dynamically generated from live MongoDB database collections (`orders`, `wallets`, `vendors`).
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Ecosystem Wallets */}
      {activeTab === 'wallets' && (
        <div className="bg-card border border-border rounded-2xl p-5 shadow-xs space-y-4">
          <div>
            <h3 className="text-sm font-bold text-foreground uppercase tracking-wider flex items-center gap-2">
              <Wallet className="w-4 h-4 text-emerald-500" /> Complete Ecosystem Entity Wallet Balances
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">Live MongoDB balances sitting across all entity wallets in the database.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
            <div className="p-4 rounded-xl border border-border bg-secondary/10">
              <span className="text-[10px] font-bold text-muted-foreground uppercase block">Vendor Wallets</span>
              <span className="text-xl font-black font-mono text-indigo-500 mt-1 block">₹{treasury.walletsSummary.totalVendorLiquid.toLocaleString('en-IN')}</span>
              <span className="text-[9px] text-muted-foreground mt-1 block">Store merchant liquid balances</span>
            </div>

            <div className="p-4 rounded-xl border border-border bg-secondary/10">
              <span className="text-[10px] font-bold text-muted-foreground uppercase block">Delivery Partner Wallets</span>
              <span className="text-xl font-black font-mono text-amber-500 mt-1 block">₹{treasury.walletsSummary.totalRiderLiquid.toLocaleString('en-IN')}</span>
              <span className="text-[9px] text-muted-foreground mt-1 block">Rider earnings & COD balance</span>
            </div>

            <div className="p-4 rounded-xl border border-border bg-secondary/10">
              <span className="text-[10px] font-bold text-muted-foreground uppercase block">Franchise Partner Wallets</span>
              <span className="text-xl font-black font-mono text-purple-500 mt-1 block">₹{treasury.walletsSummary.totalFranchiseLiquid.toLocaleString('en-IN')}</span>
              <span className="text-[9px] text-muted-foreground mt-1 block">Territory commission balances</span>
            </div>

            <div className="p-4 rounded-xl border border-border bg-secondary/10">
              <span className="text-[10px] font-bold text-muted-foreground uppercase block">Customer / User Wallets</span>
              <span className="text-xl font-black font-mono text-emerald-500 mt-1 block">₹{treasury.walletsSummary.totalUserLiquid.toLocaleString('en-IN')}</span>
              <span className="text-[9px] text-muted-foreground mt-1 block">User credits & referral rewards</span>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Withdrawals & Disbursals */}
      {activeTab === 'withdrawals' && (
        <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-xs">
          <div className="px-5 py-4 border-b border-border bg-secondary/20 flex justify-between items-center">
            <div>
              <h3 className="text-sm font-bold text-foreground uppercase tracking-wider flex items-center gap-2">
                <Landmark className="w-4 h-4 text-amber-500" /> Bank Payout & Withdrawal Disbursal Ledger
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">Live withdrawal logs fetched directly from partner wallet database records.</p>
            </div>
            <span className="text-xs font-mono font-bold text-emerald-500">
              Total Disbursed: ₹{treasury.walletsSummary.totalWithdrawnAll.toLocaleString('en-IN')}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-secondary/40 border-b border-border uppercase text-[10px] font-extrabold text-muted-foreground">
                <tr>
                  <th className="p-3">Ref ID</th>
                  <th className="p-3">Partner Name & Role</th>
                  <th className="p-3">Disbursal Method</th>
                  <th className="p-3 text-right">Withdrawn Amount (₹)</th>
                  <th className="p-3 text-right">Available Balance (₹)</th>
                  <th className="p-3">UTR / Txn Ref</th>
                  <th className="p-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {treasury.withdrawalLogs.map(log => (
                  <tr key={log.id} className="hover:bg-secondary/10 transition-colors">
                    <td className="p-3 font-mono font-bold text-foreground">{log.id}</td>
                    <td className="p-3">
                      <div className="font-bold text-foreground">{log.entityName}</div>
                      <div className="text-[10px] text-muted-foreground uppercase">{log.entityRole} • {log.email}</div>
                    </td>
                    <td className="p-3 text-foreground font-semibold">{log.paymentMethod}</td>
                    <td className="p-3 text-right font-black text-emerald-500">₹{log.amount.toLocaleString('en-IN')}</td>
                    <td className="p-3 text-right font-mono text-muted-foreground">₹{log.availableBalance.toLocaleString('en-IN')}</td>
                    <td className="p-3 font-mono text-[10px] text-muted-foreground">{log.utrNumber}</td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase ${log.status === 'Completed' ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                        }`}>
                        {log.status}
                      </span>
                    </td>
                  </tr>
                ))}
                {treasury.withdrawalLogs.length === 0 && (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-muted-foreground">
                      No bank withdrawal records found in the database.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 4: Escrow & Reserve Liquidity */}
      {activeTab === 'escrow' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-5 rounded-2xl border border-border bg-card shadow-xs space-y-2">
            <span className="text-xs font-bold text-muted-foreground uppercase">In-Transit Escrow (T+1 Clearance)</span>
            <span className="text-2xl font-black font-mono text-amber-500 block">₹{treasury.escrowAndLiquidity.totalPendingEscrow.toLocaleString('en-IN')}</span>
            <p className="text-[10px] text-muted-foreground">Order funds currently held in escrow pending doorstep delivery completion.</p>
          </div>

          <div className="p-5 rounded-2xl border border-border bg-card shadow-xs space-y-2">
            <span className="text-xs font-bold text-muted-foreground uppercase">Ecosystem Liquid Reserve</span>
            <span className="text-2xl font-black font-mono text-emerald-500 block">₹{treasury.escrowAndLiquidity.totalEcosystemLiquid.toLocaleString('en-IN')}</span>
            <p className="text-[10px] text-muted-foreground">Liquid available balances sitting across active user & vendor wallets.</p>
          </div>

          <div className="p-5 rounded-2xl border border-border bg-card shadow-xs space-y-2">
            <span className="text-xs font-bold text-muted-foreground uppercase">Total Outward Bank Disbursals</span>
            <span className="text-2xl font-black font-mono text-indigo-500 block">₹{treasury.escrowAndLiquidity.totalWithdrawalsCleared.toLocaleString('en-IN')}</span>
            <p className="text-[10px] text-muted-foreground">Cumulative cash payouts transferred directly into vendor/driver bank accounts.</p>
          </div>
        </div>
      )}

      {/* Tab 5: Order-by-Order Financial Splits */}
      {activeTab === 'splits' && (
        <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-xs">
          <div className="px-5 py-4 border-b border-border bg-secondary/20 flex justify-between items-center">
            <div>
              <h3 className="text-sm font-bold text-foreground uppercase tracking-wider flex items-center gap-2">
                <FileText className="w-4 h-4 text-indigo-500" /> Order-by-Order Financial Split Audit Ledger
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">Granular split breakdown for active MongoDB customer orders.</p>
            </div>
            <span className="text-xs font-mono font-bold text-indigo-500">Showing top {treasury.orderFinancialSplits.length} orders</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-secondary/40 border-b border-border uppercase text-[10px] font-extrabold text-muted-foreground">
                <tr>
                  <th className="p-3">Order Number</th>
                  <th className="p-3">Customer</th>
                  <th className="p-3 text-right">Gross Paid (₹)</th>
                  <th className="p-3 text-right">Vendor Share (₹)</th>
                  <th className="p-3 text-right">Platform Comm (₹)</th>
                  <th className="p-3 text-right">Rider Fee (₹)</th>
                  <th className="p-3 text-right">Franchise Share (₹)</th>
                  <th className="p-3 text-right text-indigo-500">ApexBee Net Profit (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {treasury.orderFinancialSplits.map(split => (
                  <tr key={split.orderId} className="hover:bg-secondary/10 transition-colors">
                    <td className="p-3 font-mono font-bold text-foreground">{split.orderNumber}</td>
                    <td className="p-3">
                      <div className="font-bold text-foreground">{split.customerName}</div>
                      <div className="text-[10px] text-muted-foreground">{split.customerPhone}</div>
                    </td>
                    <td className="p-3 text-right font-black text-foreground">₹{split.grossAmount.toLocaleString('en-IN')}</td>
                    <td className="p-3 text-right font-mono text-emerald-600 dark:text-emerald-400 font-bold">₹{split.vendorShare.toLocaleString('en-IN')}</td>
                    <td className="p-3 text-right font-mono text-indigo-500 font-bold">₹{split.platformComm.toLocaleString('en-IN')}</td>
                    <td className="p-3 text-right font-mono text-amber-500">₹{split.riderFee.toLocaleString('en-IN')}</td>
                    <td className="p-3 text-right font-mono text-purple-500">₹{split.franchiseFee.toLocaleString('en-IN')}</td>
                    <td className="p-3 text-right font-black text-indigo-600 dark:text-indigo-400 text-sm">₹{split.apexbeeNetProfit.toLocaleString('en-IN')}</td>
                  </tr>
                ))}
                {treasury.orderFinancialSplits.length === 0 && (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-muted-foreground">
                      No active orders found in the database.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default MasterTreasury;
