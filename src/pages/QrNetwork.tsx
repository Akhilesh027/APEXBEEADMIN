import React, { useState } from 'react';
import { useAdminState } from '../context/AdminStateContext';
import { CheckCircle2, IndianRupee, Sparkles, Store, Clock, RefreshCw, QrCode } from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';

export const QrNetwork: React.FC = () => {
  const { orders, sellers, wallets, withdrawals, processWithdrawal, addActivityLog } = useAdminState();
  const [successMsg, setSuccessMsg] = useState('');

  // Calculate past 7 days QR/UPI sales from live orders
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const qrSalesData = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const dateStr: string = d.toISOString().slice(0, 10);
    const dayName = days[d.getDay()] || 'Day';

    const daySales = orders
      .filter(o => 
        Boolean(o.date && o.date.startsWith(dateStr)) && 
        (Boolean(o.paymentMethod && o.paymentMethod.toUpperCase().includes('QR')) || 
         Boolean(o.paymentMethod && o.paymentMethod.toUpperCase().includes('UPI')) || 
         o.paymentStatus === 'Approved')
      )
      .reduce((sum, o) => sum + (o.totalAmount || 0), 0);

    return {
      day: dayName,
      date: dateStr,
      sales: daySales
    };
  });

  // Calculate live metrics
  const todayStr: string = new Date().toISOString().slice(0, 10);
  const todaySales = orders
    .filter(o => 
      Boolean(o.date && o.date.startsWith(todayStr)) && 
      (Boolean(o.paymentMethod && o.paymentMethod.toUpperCase().includes('QR')) || 
       Boolean(o.paymentMethod && o.paymentMethod.toUpperCase().includes('UPI')) || 
       o.paymentStatus === 'Approved')
    )
    .reduce((sum, o) => sum + (o.totalAmount || 0), 0);

  const vendorStores = sellers.filter(s => s.type === 'Vendor');
  const qrStoreCount = vendorStores.length;

  const pendingWithdrawals = withdrawals.filter(w => 
    w.status === 'Pending' && 
    ['vendor', 'qr', 'merchant', 'entrepreneur', 'seller'].some(t => w.type.toLowerCase().includes(t))
  );
  const pendingSettlementTotal = pendingWithdrawals.reduce((sum, w) => sum + (w.amount || 0), 0);

  // Group real merchants from active vendors & their wallet/payout states
  const merchantList = vendorStores.map(v => {
    const vWallet = wallets.find(w => w.id === v.id);
    const vOrders = orders.filter(o => (o as any).vendorId === v.id || o.items.some(i => i.productId && i.productId.startsWith(v.id)));
    const totalStoreSales = vOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
    const pendingWithdrawal = withdrawals.find(w => w.ownerId === v.id && w.status === 'Pending');
    const unsettled = pendingWithdrawal ? pendingWithdrawal.amount : (vWallet?.availableBalance ?? totalStoreSales);

    return {
      id: v.id,
      name: v.businessName || v.ownerName || 'Merchant Store',
      location: v.address ? v.address.substring(0, 35) : (v.ownerName || 'Active Merchant'),
      sales: unsettled,
      status: pendingWithdrawal ? 'Pending' : (unsettled > 0 ? 'Pending' : 'Settled'),
      withdrawalId: pendingWithdrawal?.id
    };
  });

  const handleQrSettlement = (merchantId: string, withdrawalId?: string) => {
    const merchant = merchantList.find(m => m.id === merchantId);
    if (!merchant) return;

    const refNo = `QR-TXN-${Math.floor(100000 + Math.random() * 900000)}`;
    if (withdrawalId) {
      processWithdrawal(withdrawalId, 'Approved', refNo);
    }

    addActivityLog(
      'QR Settlement Cleared',
      `Cleared QR payment settlement of ₹${merchant.sales} for ${merchant.name}. Ref: ${refNo}.`,
      'withdrawal'
    );

    setSuccessMsg(`Settlement of ₹${merchant.sales.toLocaleString('en-IN')} cleared for ${merchant.name}! Ref: ${refNo}`);
    setTimeout(() => setSuccessMsg(''), 4000);
  };

  return (
    <div className="space-y-6">
      
      {/* Top metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 select-none">
        <div className="bg-card border border-border/80 rounded-2xl p-4 flex items-center justify-between shadow-sm">
          <div>
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Today's QR Sales</span>
            <span className="text-xl font-bold font-mono text-foreground mt-1 block">₹{todaySales.toLocaleString('en-IN')}</span>
            <span className="text-[9px] text-muted-foreground mt-1 block font-semibold">Live checkout volume</span>
          </div>
          <IndianRupee className="text-primary shrink-0" size={24} />
        </div>
        <div className="bg-card border border-border/80 rounded-2xl p-4 flex items-center justify-between shadow-sm">
          <div>
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">QR Merchant Network</span>
            <span className="text-xl font-bold font-mono text-foreground mt-1 block">{qrStoreCount} Stores</span>
            <span className="text-[9px] text-emerald-500 mt-1 block font-semibold">Live onboarded vendors</span>
          </div>
          <Store className="text-violet-500 shrink-0" size={24} />
        </div>
        <div className="bg-card border border-border/80 rounded-2xl p-4 flex items-center justify-between shadow-sm">
          <div>
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Pending settlements</span>
            <span className="text-xl font-bold font-mono text-foreground mt-1 block">₹{pendingSettlementTotal.toLocaleString('en-IN')}</span>
            <span className="text-[9px] text-muted-foreground mt-1 block">{pendingWithdrawals.length} Merchants queue</span>
          </div>
          <Clock className="text-amber-500 shrink-0" size={24} />
        </div>
        <div className="bg-card border border-border/80 rounded-2xl p-4 flex items-center justify-between shadow-sm">
          <div>
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Ecosystem Revenue Share</span>
            <span className="text-xl font-bold font-mono text-foreground mt-1 block">0.8%</span>
            <span className="text-[9px] text-muted-foreground mt-1 block">Platform fee rate</span>
          </div>
          <RefreshCw className="text-emerald-500 shrink-0" size={24} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* QR Sales Chart - 7 Columns */}
        <div className="lg:col-span-7 bg-card border border-border/80 rounded-2xl p-5 shadow-sm space-y-4">
          <div>
            <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">QR Sales Analytics</h3>
            <p className="text-[10px] text-muted-foreground mt-0.5">Daily QR transaction volume logged in INR (₹)</p>
          </div>

          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={qrSalesData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorQrSales" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(100, 116, 139, 0.1)" />
                <XAxis dataKey="day" stroke="rgba(100, 116, 139, 0.5)" fontSize={10} tickLine={false} />
                <YAxis stroke="rgba(100, 116, 139, 0.5)" fontSize={10} tickLine={false} />
                <Tooltip
                  formatter={(value: any) => `₹${Number(value).toLocaleString('en-IN')}`}
                  contentStyle={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)' }}
                  itemStyle={{ fontSize: 11, color: 'var(--foreground)' }}
                />
                <Area type="monotone" dataKey="sales" name="QR Checkout Sales" stroke="#6366f1" strokeWidth={2.5} fillOpacity={1} fill="url(#colorQrSales)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Merchants & Settlement Tracking - 5 Columns */}
        <div className="lg:col-span-5 bg-card border border-border/80 rounded-2xl p-5 shadow-sm space-y-4">
          <div className="border-b border-border pb-3 flex items-center justify-between select-none">
            <h3 className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles size={14} className="text-primary" />
              QR Settlement tracking
            </h3>
            <span className="text-[10px] text-muted-foreground font-mono">{merchantList.length} Active</span>
          </div>

          {successMsg && (
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 rounded-xl flex items-center gap-2 text-xs font-semibold select-none animate-fadeIn">
              <CheckCircle2 size={16} className="shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          <div className="space-y-3 max-h-80 overflow-y-auto no-scrollbar pr-1">
            {merchantList.map(merchant => (
              <div key={merchant.id} className="p-3 rounded-xl border border-border/60 hover:bg-secondary/10 transition-colors flex items-center justify-between text-xs">
                <div>
                  <span className="font-semibold text-foreground text-sm block">{merchant.name}</span>
                  <span className="text-[10px] text-muted-foreground block font-mono">
                    ID: {merchant.id} • {merchant.location}
                  </span>
                  <span className="text-[10px] text-indigo-500 font-mono font-bold block mt-0.5">
                    Unsettled: ₹{merchant.sales.toLocaleString('en-IN')}
                  </span>
                </div>
                
                <div className="shrink-0 select-none">
                  {merchant.status === 'Settled' || merchant.sales === 0 ? (
                    <span className="px-2.5 py-1 bg-emerald-500/10 text-emerald-500 font-bold rounded-lg text-[9px] border border-emerald-500/15">
                      Settled
                    </span>
                  ) : (
                    <button
                      onClick={() => handleQrSettlement(merchant.id, merchant.withdrawalId)}
                      className="px-2.5 py-1 bg-primary hover:bg-primary/95 text-primary-foreground font-bold rounded-lg text-[9px] transition-all shadow-md shadow-primary/10 cursor-pointer"
                    >
                      Settle QR
                    </button>
                  )}
                </div>
              </div>
            ))}

            {merchantList.length === 0 && (
              <div className="py-8 text-center text-xs text-muted-foreground flex flex-col items-center justify-center space-y-2 select-none">
                <QrCode size={28} className="text-muted-foreground/60" />
                <p className="font-bold">No QR merchant stores registered.</p>
                <p className="text-[10px] text-muted-foreground">Onboarded vendors will be automatically tracked here.</p>
              </div>
            )}
          </div>
        </div>

      </div>

    </div>
  );
};
