import React from 'react';
import { ShieldAlert, AlertTriangle, Activity, ShieldCheck, UserX, Info } from 'lucide-react';
import { ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip, BarChart, Bar } from 'recharts';

export const RiskCenter: React.FC = () => {

  // Fraud alerts mock data
  const fraudAlerts = [
    { id: 'RSK-901', type: 'Duplicate Accounts', desc: 'Identified identical PAN card ABCDE1234F uploaded by two different seller accounts.', risk: 'Critical', date: '15 mins ago' },
    { id: 'RSK-900', type: 'Suspicious Wallet Activity', desc: 'Referral account REF-002 requested 5 withdrawals of ₹10,000 in less than 30 mins.', risk: 'High', date: '1 hr ago' },
    { id: 'RSK-899', type: 'Fake Orders (Self-purchase)', desc: 'Vendor SEL-002 ordered their own listed products 8 times via referral links from the same IP address.', risk: 'High', date: '2 hrs ago' },
    { id: 'RSK-898', type: 'Refund Abuse', desc: 'Customer Vijay Kumar requested refunds on 90% of order items checked out in the past 14 days.', risk: 'Medium', date: '5 hrs ago' },
    { id: 'RSK-897', type: 'Multiple Device Login', desc: 'State Franchise account FRA-STATE-GJ logged in from 4 separate device signatures within 5 mins.', risk: 'Medium', date: '1 day ago' }
  ];

  // Fraud trend chart data
  const fraudTrendData = [
    { day: 'Mon', alerts: 4 },
    { day: 'Tue', alerts: 7 },
    { day: 'Wed', alerts: 5 },
    { day: 'Thu', alerts: 9 },
    { day: 'Fri', alerts: 12 },
    { day: 'Sat', alerts: 8 },
    { day: 'Sun', alerts: 3 }
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-card border border-border/80 rounded-2xl p-4 shadow-sm">
        <div>
          <h2 className="text-sm font-bold text-foreground uppercase tracking-wider">Risk Center</h2>
          <p className="text-[11px] text-muted-foreground mt-0.5">Fraud detection, duplicated profiles, refund abuse audits, and system alerts</p>
        </div>
        <span className="px-2.5 py-1 bg-amber-500/10 text-amber-500 dark:text-amber-400 text-xs font-bold rounded-xl border border-amber-500/20 select-none animate-pulse">
          Coming Soon
        </span>
      </div>
      {/* Top gauges */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 select-none">
        <div className="bg-card border border-border/80 rounded-2xl p-4 flex items-center justify-between shadow-sm">
          <div>
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Risk Level</span>
            <span className="text-xl font-bold font-mono text-rose-500 mt-1 block">MEDIUM-HIGH</span>
            <span className="text-[9px] text-rose-500 mt-1 block font-semibold">+2 critical alerts today</span>
          </div>
          <ShieldAlert className="text-rose-500 shrink-0 animate-bounce" size={24} />
        </div>
        <div className="bg-card border border-border/80 rounded-2xl p-4 flex items-center justify-between shadow-sm">
          <div>
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Total Audits Today</span>
            <span className="text-xl font-bold font-mono text-foreground mt-1 block">18 Audits</span>
            <span className="text-[9px] text-emerald-500 mt-1 block font-semibold">15 cases cleared</span>
          </div>
          <Activity className="text-violet-500 shrink-0" size={24} />
        </div>
        <div className="bg-card border border-border/80 rounded-2xl p-4 flex items-center justify-between shadow-sm">
          <div>
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">False Positive Rate</span>
            <span className="text-xl font-bold font-mono text-foreground mt-1 block">1.8%</span>
            <span className="text-[9px] text-muted-foreground mt-1 block">Accuracy: 98.2%</span>
          </div>
          <ShieldCheck className="text-emerald-500 shrink-0" size={24} />
        </div>
        <div className="bg-card border border-border/80 rounded-2xl p-4 flex items-center justify-between shadow-sm">
          <div>
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Accounts Frozen</span>
            <span className="text-xl font-bold font-mono text-foreground mt-1 block">2 Accounts</span>
            <span className="text-[9px] text-rose-500 mt-1 block font-semibold">Awaiting appeal</span>
          </div>
          <UserX className="text-rose-500 shrink-0" size={24} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Risk Alerts Queue - 7 Columns */}
        <div className="lg:col-span-7 bg-card border border-border/80 rounded-2xl p-5 shadow-sm space-y-4">
          <div className="border-b border-border pb-3 flex justify-between items-center select-none">
            <h3 className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5">
              <AlertTriangle className="text-rose-500" size={16} />
              Active Fraud alerts queue
            </h3>
            <span className="text-[9px] text-muted-foreground font-mono">Live feeds</span>
          </div>

          <div className="space-y-4 max-h-[420px] overflow-y-auto no-scrollbar pr-1">
            {fraudAlerts.map(alertItem => (
              <div key={alertItem.id} className="bg-secondary/15 p-4 rounded-xl border border-border/40 space-y-2 relative overflow-hidden">
                <div className="flex justify-between items-center text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-foreground text-sm">{alertItem.type}</span>
                    <span className={`px-2 py-0.5 rounded text-[8px] font-bold ${
                      alertItem.risk === 'Critical' ? 'bg-rose-500/20 text-rose-500 animate-pulse' : 'bg-amber-500/10 text-amber-500'
                    }`}>
                      {alertItem.risk} Risk
                    </span>
                  </div>
                  <span className="text-[9px] text-muted-foreground font-mono">{alertItem.date}</span>
                </div>
                <p className="text-[10px] text-muted-foreground leading-relaxed">{alertItem.desc}</p>
                <div className="flex justify-between items-center text-[9px] pt-1.5 border-t border-border/20 text-muted-foreground select-none">
                  <span>Alert ID: {alertItem.id}</span>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => alert(`Cleared alert ID: ${alertItem.id}. Safe status restored.`)}
                      className="px-2 py-1 bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 rounded font-semibold transition-all border border-emerald-500/10"
                    >
                      Verify Safe
                    </button>
                    <button
                      onClick={() => alert(`Suspended user associated with alert ID: ${alertItem.id}. Action logged.`)}
                      className="px-2 py-1 bg-rose-500/10 text-rose-500 hover:bg-rose-500/20 rounded font-semibold transition-all border border-rose-500/10"
                    >
                      Freeze Account
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Fraud Analytics Charts - 5 Columns */}
        <div className="lg:col-span-5 bg-card border border-border/80 rounded-2xl p-5 shadow-sm space-y-4">
          <div>
            <h3 className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5">
              <Activity size={14} className="text-primary" />
              Ecosystem Risk Trend Analytics
            </h3>
            <p className="text-[10px] text-muted-foreground mt-0.5">Daily alert frequencies recorded</p>
          </div>

          <div className="h-44 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={fraudTrendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(100, 116, 139, 0.1)" />
                <XAxis dataKey="day" stroke="rgba(100, 116, 139, 0.5)" fontSize={10} tickLine={false} />
                <YAxis stroke="rgba(100, 116, 139, 0.5)" fontSize={10} tickLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)' }}
                  itemStyle={{ fontSize: 11, color: 'var(--foreground)' }}
                />
                <Bar dataKey="alerts" name="Risk Alerts" fill="#f59e0b" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          
          <div className="p-3 bg-secondary/15 rounded-xl border border-border/40 text-[9px] text-muted-foreground flex gap-1.5 items-center select-none mt-2">
            <Info size={14} className="text-primary shrink-0" />
            <span>Risk Center maps IP addresses, device cookies, bank card signatures, and PAN registers to prevent duplicate registration loop vulnerabilities.</span>
          </div>
        </div>

      </div>

    </div>
  );
};
