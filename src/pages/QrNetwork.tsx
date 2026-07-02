import React, { useState } from 'react';
import { useAdminState } from '../context/AdminStateContext';
import { CheckCircle2, IndianRupee, Sparkles, Store, Clock, RefreshCw } from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';

export const QrNetwork: React.FC = () => {
  const { addActivityLog } = useAdminState();
  const [successMsg, setSuccessMsg] = useState('');

  // Daily QR Sales chart data
  const qrSalesData = [
    { day: 'Mon', sales: 25000 },
    { day: 'Tue', sales: 28000 },
    { day: 'Wed', sales: 32000 },
    { day: 'Thu', sales: 29000 },
    { day: 'Fri', sales: 38000 },
    { day: 'Sat', sales: 45000 },
    { day: 'Sun', sales: 42500 }
  ];

  // Top QR Merchants
  const [merchants, setMerchants] = useState([
    { id: 'M-QR-01', name: 'Balaji Kirana Store', location: 'Kothrud, Pune', sales: 24500, status: 'Pending' },
    { id: 'M-QR-02', name: 'Shree Sai Veg Market', location: 'Haveli, Pune', sales: 12000, status: 'Pending' },
    { id: 'M-QR-03', name: 'Deccan Agri Seeds', location: 'Haveli, Pune', sales: 6000, status: 'Settled' }
  ]);

  const handleQrSettlement = (id: string) => {
    const merchant = merchants.find(m => m.id === id);
    if (!merchant) return;

    // Log action
    const refNo = `QR-TXN-${Math.floor(100000 + Math.random() * 900000)}`;
    addActivityLog(
      'QR Settlement Cleared',
      `Cleared QR payment settlement of ₹${merchant.sales} for ${merchant.name}. Ref: ${refNo}.`,
      'withdrawal'
    );

    // Update state
    setMerchants(prev =>
      prev.map(m => (m.id === id ? { ...m, status: 'Settled' } : m))
    );

    setSuccessMsg(`Settlement of ₹${merchant.sales} cleared for ${merchant.name}! Ref: ${refNo}`);
    setTimeout(() => setSuccessMsg(''), 4000);
  };

  return (
    <div className="space-y-6">
      
      {/* Top metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 select-none">
        <div className="bg-card border border-border/80 rounded-2xl p-4 flex items-center justify-between shadow-sm">
          <div>
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Today's QR Sales</span>
            <span className="text-xl font-bold font-mono text-foreground mt-1 block">₹42,500</span>
            <span className="text-[9px] text-emerald-500 mt-1 block font-semibold">+18.5% MoM</span>
          </div>
          <IndianRupee className="text-primary shrink-0" size={24} />
        </div>
        <div className="bg-card border border-border/80 rounded-2xl p-4 flex items-center justify-between shadow-sm">
          <div>
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">QR Merchant Network</span>
            <span className="text-xl font-bold font-mono text-foreground mt-1 block">180 Stores</span>
            <span className="text-[9px] text-emerald-500 mt-1 block font-semibold">+8.4% growth MoM</span>
          </div>
          <Store className="text-violet-500 shrink-0" size={24} />
        </div>
        <div className="bg-card border border-border/80 rounded-2xl p-4 flex items-center justify-between shadow-sm">
          <div>
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Pending settlements</span>
            <span className="text-xl font-bold font-mono text-foreground mt-1 block">₹36,500</span>
            <span className="text-[9px] text-muted-foreground mt-1 block">2 Merchants queue</span>
          </div>
          <Clock className="text-amber-500 shrink-0 animate-pulse" size={24} />
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
                  formatter={(value: any) => `₹${value.toLocaleString('en-IN')}`}
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
          </div>

          {successMsg && (
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 rounded-xl flex items-center gap-2 text-xs font-semibold select-none animate-fadeIn">
              <CheckCircle2 size={16} className="shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          <div className="space-y-3">
            {merchants.map(merchant => (
              <div key={merchant.id} className="p-3 rounded-xl border border-border/60 hover:bg-secondary/10 transition-colors flex items-center justify-between text-xs">
                <div>
                  <span className="font-semibold text-foreground text-sm block">{merchant.name}</span>
                  <span className="text-[10px] text-muted-foreground block font-mono">
                    ID: {merchant.id} • Mandal: {merchant.location}
                  </span>
                  <span className="text-[10px] text-indigo-500 font-mono font-bold block mt-0.5">
                    Unsettled: ₹{merchant.sales.toLocaleString('en-IN')}
                  </span>
                </div>
                
                <div className="shrink-0 select-none">
                  {merchant.status === 'Settled' ? (
                    <span className="px-2.5 py-1 bg-emerald-500/10 text-emerald-500 font-bold rounded-lg text-[9px] border border-emerald-500/15">
                      Settled
                    </span>
                  ) : (
                    <button
                      onClick={() => handleQrSettlement(merchant.id)}
                      className="px-2.5 py-1 bg-primary hover:bg-primary/95 text-primary-foreground font-bold rounded-lg text-[9px] transition-all shadow-md shadow-primary/10"
                    >
                      Settle QR
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
};
