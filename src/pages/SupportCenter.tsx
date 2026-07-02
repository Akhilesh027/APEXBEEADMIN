import React, { useState } from 'react';
import { LifeBuoy, AlertTriangle, ShieldCheck, Clock, Search, ArrowRight, MessageSquare } from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';

export const SupportCenter: React.FC = () => {
  const [activeSubTab, setActiveSubTab] = useState<'customer' | 'vendor' | 'franchise' | 'entrepreneur' | 'sla' | 'analytics'>('customer');
  const [searchQuery, setSearchQuery] = useState('');

  // Sample support tickets
  const [tickets, setTickets] = useState([
    { id: 'TCK-201', sender: 'Rohan Sharma (Customer)', subject: 'Refund pending for order ORD-99201', priority: 'High', date: '2026-06-14 10:15', status: 'Open', category: 'customer' },
    { id: 'TCK-202', sender: 'Karan Organic (Vendor)', subject: 'Unable to update variant SKU price', priority: 'Medium', date: '2026-06-14 09:30', status: 'Open', category: 'vendor' },
    { id: 'TCK-203', sender: 'Pune District Franchise', subject: 'Referral ledger payouts discrepancy', priority: 'Critical', date: '2026-06-13 18:42', status: 'Escalated', category: 'franchise' },
    { id: 'TCK-204', sender: 'Sanjay Deshmukh (Entrepreneur)', subject: 'Onboarding training progress check', priority: 'Low', date: '2026-06-14 11:00', status: 'Resolved', category: 'entrepreneur' }
  ]);

  const resolveTicket = (id: string) => {
    setTickets(prev => prev.map(t => {
      if (t.id === id) {
        return { ...t, status: 'Resolved' };
      }
      return t;
    }));
  };

  const getFilteredTickets = () => {
    switch (activeSubTab) {
      case 'customer':
        return tickets.filter(t => t.category === 'customer');
      case 'vendor':
        return tickets.filter(t => t.category === 'vendor');
      case 'franchise':
        return tickets.filter(t => t.category === 'franchise');
      case 'entrepreneur':
        return tickets.filter(t => t.category === 'entrepreneur');
      default:
        return tickets;
    }
  };

  const currentTickets = getFilteredTickets().filter(t => 
    t.sender.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.subject.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const resolutionData = [
    { month: 'Jan', resolved: 145, slaMet: 140 },
    { month: 'Feb', resolved: 180, slaMet: 175 },
    { month: 'Mar', resolved: 210, slaMet: 200 },
    { month: 'Apr', resolved: 195, slaMet: 188 },
    { month: 'May', resolved: 280, slaMet: 270 },
    { month: 'Jun', resolved: 320, slaMet: 312 }
  ];

  return (
    <div className="space-y-6">
      
      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 select-none">
        <div className="bg-card border border-border/80 rounded-2xl p-4 flex items-center justify-between shadow-sm">
          <div>
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Total Active Tickets</span>
            <span className="text-xl font-bold font-mono text-foreground mt-1 block">12 Tickets</span>
            <span className="text-[9px] text-emerald-500 mt-1 block font-semibold">+18% resolution speed this week</span>
          </div>
          <LifeBuoy className="text-primary shrink-0" size={24} />
        </div>
        <div className="bg-card border border-border/80 rounded-2xl p-4 flex items-center justify-between shadow-sm">
          <div>
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">SLA Response Time</span>
            <span className="text-xl font-bold font-mono text-foreground mt-1 block">1.8 Hours</span>
            <span className="text-[9px] text-violet-500 mt-1 block font-semibold">SLA compliance: 98.4%</span>
          </div>
          <Clock className="text-violet-500 shrink-0" size={24} />
        </div>
        <div className="bg-card border border-border/80 rounded-2xl p-4 flex items-center justify-between shadow-sm">
          <div>
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Escalated Tickets</span>
            <span className="text-xl font-bold font-mono text-rose-500 mt-1 block">1 Critical</span>
            <span className="text-[9px] text-rose-500 mt-1 block font-semibold">Assigned to operations leads</span>
          </div>
          <AlertTriangle className="text-rose-500 shrink-0 animate-bounce" size={24} />
        </div>
        <div className="bg-card border border-border/80 rounded-2xl p-4 flex items-center justify-between shadow-sm">
          <div>
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Customer Satisfaction</span>
            <span className="text-xl font-bold font-mono text-foreground mt-1 block">4.8 / 5.0</span>
            <span className="text-[9px] text-emerald-500 mt-1 block font-semibold">Based on 145 surveys</span>
          </div>
          <ShieldCheck className="text-emerald-500 shrink-0" size={24} />
        </div>
      </div>

      {/* Subtab Menu */}
      <div className="flex gap-2 flex-wrap bg-card border border-border/60 p-2 rounded-2xl select-none shadow-sm">
        {(['customer', 'vendor', 'franchise', 'entrepreneur', 'sla', 'analytics'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveSubTab(tab)}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all ${
              activeSubTab === tab
                ? 'bg-primary text-primary-foreground border-primary shadow-md'
                : 'bg-transparent text-muted-foreground border-transparent hover:bg-secondary/60 hover:text-foreground'
            }`}
          >
            {tab === 'sla' ? 'SLA Monitoring' : tab === 'analytics' ? 'Ticket Analytics' : tab.charAt(0).toUpperCase() + tab.slice(1) + ' Tickets'}
          </button>
        ))}
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Column: Data tables */}
        <div className="lg:col-span-8 bg-card border border-border/80 rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-3 border-b border-border/60">
            <span className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5">
              <MessageSquare size={14} className="text-primary" /> Support Desk Queue ({activeSubTab.toUpperCase()})
            </span>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:flex-initial">
                <Search className="absolute left-3 top-2.5 text-muted-foreground" size={14} />
                <input
                  type="text"
                  placeholder="Search ticket subject..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 pr-4 py-1.5 bg-secondary/50 border border-border/80 focus:border-primary rounded-xl text-xs outline-none w-full sm:w-48 font-medium"
                />
              </div>
              <button 
                onClick={() => alert('Exporting support reports...')}
                className="px-3.5 py-1.5 bg-secondary hover:bg-secondary/80 text-foreground font-bold text-xs rounded-xl border border-border/60 transition-all shadow-sm"
              >
                Export
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-secondary/40 select-none border-b border-border/60">
                <tr>
                  <th className="p-3 font-semibold text-muted-foreground">Ticket ID</th>
                  <th className="p-3 font-semibold text-muted-foreground">Sender User</th>
                  <th className="p-3 font-semibold text-muted-foreground">Subject Description</th>
                  <th className="p-3 font-semibold text-muted-foreground text-center">Priority</th>
                  <th className="p-3 font-semibold text-muted-foreground text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {currentTickets.map(t => (
                  <tr key={t.id} className="hover:bg-secondary/10 transition-colors">
                    <td className="p-3 font-mono font-semibold text-primary">{t.id}</td>
                    <td className="p-3">
                      <span className="font-semibold text-foreground block">{t.sender}</span>
                      <span className="text-[9px] text-muted-foreground font-mono">{t.date}</span>
                    </td>
                    <td className="p-3 text-muted-foreground">{t.subject}</td>
                    <td className="p-3 text-center">
                      <span className={`px-2 py-0.5 rounded text-[8px] font-bold ${
                        t.priority === 'Critical' ? 'bg-rose-500/20 text-rose-500 animate-pulse' :
                        t.priority === 'High' ? 'bg-rose-500/10 text-rose-500' :
                        t.priority === 'Medium' ? 'bg-amber-500/10 text-amber-500' :
                        'bg-secondary text-muted-foreground'
                      }`}>
                        {t.priority}
                      </span>
                    </td>
                    <td className="p-3 text-center border-l border-border/10">
                      {t.status !== 'Resolved' ? (
                        <button 
                          onClick={() => resolveTicket(t.id)}
                          className="px-2.5 py-1 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-[10px] font-bold transition-all flex items-center gap-0.5 mx-auto"
                        >
                          Resolve <ArrowRight size={10} />
                        </button>
                      ) : (
                        <span className="text-[10px] text-muted-foreground font-medium flex items-center justify-center gap-1">
                          <ShieldCheck size={12} className="text-emerald-500" /> Resolved
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
                {currentTickets.length === 0 && (
                  <tr>
                    <td colSpan={5} className="p-12 text-center text-xs text-muted-foreground">
                      No active tickets in this queue.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Column: Ticket analytics Recharts Area chart */}
        <div className="lg:col-span-4 bg-card border border-border/80 rounded-2xl p-5 shadow-sm space-y-4">
          <div>
            <span className="text-xs font-bold text-foreground uppercase tracking-wider block">SLA Resolution Trends</span>
            <p className="text-[9px] text-muted-foreground mt-0.5">Monthly tickets resolved vs SLA targets met</p>
          </div>
          
          <div className="h-44 w-full select-none">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={resolutionData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(100, 116, 139, 0.1)" />
                <XAxis dataKey="month" stroke="rgba(100, 116, 139, 0.5)" fontSize={10} tickLine={false} />
                <YAxis stroke="rgba(100, 116, 139, 0.5)" fontSize={10} tickLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)' }}
                  itemStyle={{ fontSize: 11, color: 'var(--foreground)' }}
                />
                <Area type="monotone" dataKey="resolved" name="Resolved" stroke="#8b5cf6" fill="rgba(139, 92, 246, 0.1)" strokeWidth={2} />
                <Area type="monotone" dataKey="slaMet" name="Met SLA" stroke="#10b981" fill="rgba(16, 185, 129, 0.05)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

    </div>
  );
};
