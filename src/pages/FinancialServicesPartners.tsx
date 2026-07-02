import React, { useState } from 'react';
import { Landmark, Users, DollarSign, TrendingUp, Search, CheckCircle } from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';

export const FinancialServicesPartners: React.FC = () => {
  const [activeSubTab, setActiveSubTab] = useState<'insurance' | 'loans' | 'gst' | 'tax' | 'advisors'>('insurance');
  const [searchQuery, setSearchQuery] = useState('');

  // Sample financial services partners listings
  const partnersList = [
    { id: 'FIN-101', name: 'ICICI Lombard Insurance Corp', type: 'Insurance', products: 'Shop Insurance, Health', leads: 480, commission: '12%', revenue: 180000, status: 'Active' },
    { id: 'FIN-102', name: 'HDFC Business Loans Hub', type: 'Loans', products: 'Merchant Capital, Working Loans', leads: 320, commission: '2.5% of disbursal', revenue: 240000, status: 'Active' },
    { id: 'FIN-103', name: 'TaxSutra GST Consultancy', type: 'GST Services', products: 'GST Registration, Filing', leads: 180, commission: 'Fixed ₹250/filing', revenue: 45000, status: 'Active' },
    { id: 'FIN-104', name: 'SBI Life Insurance Group', type: 'Insurance', products: 'Keyman Insurance', leads: 0, commission: '10%', revenue: 0, status: 'Pending Approval' }
  ];

  const getFilteredPartners = () => {
    switch (activeSubTab) {
      case 'insurance':
        return partnersList.filter(p => p.type === 'Insurance');
      case 'loans':
        return partnersList.filter(p => p.type === 'Loans');
      case 'gst':
        return partnersList.filter(p => p.type === 'GST Services');
      default:
        return partnersList;
    }
  };

  const currentPartners = getFilteredPartners().filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const analyticsData = [
    { month: 'Jan', count: 120 },
    { month: 'Feb', count: 180 },
    { month: 'Mar', count: 150 },
    { month: 'Apr', count: 240 },
    { month: 'May', count: 310 },
    { month: 'Jun', count: 420 }
  ];

  return (
    <div className="space-y-6">
      
      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 select-none">
        <div className="bg-card border border-border/80 rounded-2xl p-4 flex items-center justify-between shadow-sm">
          <div>
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Financial Partners</span>
            <span className="text-xl font-bold font-mono text-foreground mt-1 block">8 Partners</span>
            <span className="text-[9px] text-emerald-500 mt-1 block font-semibold">+2 verified this week</span>
          </div>
          <Landmark className="text-primary shrink-0" size={24} />
        </div>
        <div className="bg-card border border-border/80 rounded-2xl p-4 flex items-center justify-between shadow-sm">
          <div>
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Leads Generated</span>
            <span className="text-xl font-bold font-mono text-foreground mt-1 block">980 Leads</span>
            <span className="text-[9px] text-emerald-500 mt-1 block font-semibold">+24% volume growth MoM</span>
          </div>
          <Users className="text-violet-500 shrink-0" size={24} />
        </div>
        <div className="bg-card border border-border/80 rounded-2xl p-4 flex items-center justify-between shadow-sm">
          <div>
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Disbursal Value</span>
            <span className="text-xl font-bold font-mono text-foreground mt-1 block">₹45.0L</span>
            <span className="text-[9px] text-violet-500 mt-1 block font-semibold">Working capital for vendors</span>
          </div>
          <TrendingUp className="text-emerald-500 shrink-0" size={24} />
        </div>
        <div className="bg-card border border-border/80 rounded-2xl p-4 flex items-center justify-between shadow-sm">
          <div>
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Platform Revenue Share</span>
            <span className="text-xl font-bold font-mono text-foreground mt-1 block">₹4.65L</span>
            <span className="text-[9px] text-muted-foreground mt-1 block">Accumulated partner commission splits</span>
          </div>
          <DollarSign className="text-amber-500 shrink-0" size={24} />
        </div>
      </div>

      {/* Subtab Menu */}
      <div className="flex gap-2 flex-wrap bg-card border border-border/60 p-2 rounded-2xl select-none shadow-sm">
        {(['insurance', 'loans', 'gst', 'tax', 'advisors'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveSubTab(tab)}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all ${
              activeSubTab === tab
                ? 'bg-primary text-primary-foreground border-primary shadow-md'
                : 'bg-transparent text-muted-foreground border-transparent hover:bg-secondary/60 hover:text-foreground'
            }`}
          >
            {tab === 'gst' ? 'GST Services' : tab === 'tax' ? 'Tax Consultants' : tab === 'advisors' ? 'Financial Advisors' : tab.charAt(0).toUpperCase() + tab.slice(1) + ' Partners'}
          </button>
        ))}
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Column: Data tables */}
        <div className="lg:col-span-8 bg-card border border-border/80 rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-3 border-b border-border/60">
            <span className="text-xs font-bold text-foreground uppercase tracking-wider">
              Financial Service Alliances ({activeSubTab.toUpperCase()})
            </span>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:flex-initial">
                <Search className="absolute left-3 top-2.5 text-muted-foreground" size={14} />
                <input
                  type="text"
                  placeholder="Search partner name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 pr-4 py-1.5 bg-secondary/50 border border-border/80 focus:border-primary rounded-xl text-xs outline-none w-full sm:w-48 font-medium"
                />
              </div>
              <button 
                onClick={() => alert('Exporting lead records...')}
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
                  <th className="p-3 font-semibold text-muted-foreground">Partner Institution</th>
                  <th className="p-3 font-semibold text-muted-foreground">Offerings</th>
                  <th className="p-3 font-semibold text-muted-foreground">Total Leads</th>
                  <th className="p-3 font-semibold text-muted-foreground">Total Revenue Split</th>
                  <th className="p-3 font-semibold text-muted-foreground text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {currentPartners.map(p => (
                  <tr key={p.id} className="hover:bg-secondary/10 transition-colors">
                    <td className="p-3">
                      <span className="font-semibold text-foreground block">{p.name}</span>
                      <span className="text-[10px] text-muted-foreground block">ID: {p.id} • Comm: {p.commission}</span>
                    </td>
                    <td className="p-3 text-muted-foreground">{p.products}</td>
                    <td className="p-3 font-mono text-muted-foreground">{p.leads} leads</td>
                    <td className="p-3 font-mono font-bold text-foreground">₹{p.revenue.toLocaleString()}</td>
                    <td className="p-3 text-center border-l border-border/10">
                      {p.status.includes('Pending') ? (
                        <button 
                          onClick={() => alert(`Approving financial partnership: ${p.name}`)}
                          className="px-2.5 py-1 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-[10px] font-bold transition-all"
                        >
                          Approve Partner
                        </button>
                      ) : (
                        <span className="text-[10px] text-muted-foreground font-medium flex items-center justify-center gap-1">
                          <CheckCircle size={12} className="text-emerald-500" /> Active
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
                {currentPartners.length === 0 && (
                  <tr>
                    <td colSpan={5} className="p-12 text-center text-xs text-muted-foreground">
                      No partners onboarded for this segment yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Column: Lead Analytics Area chart */}
        <div className="lg:col-span-4 bg-card border border-border/80 rounded-2xl p-5 shadow-sm space-y-4">
          <div>
            <span className="text-xs font-bold text-foreground uppercase tracking-wider block">Lead Conversion Trend</span>
            <p className="text-[9px] text-muted-foreground mt-0.5">Monthly lead submissions from vendors/users</p>
          </div>
          
          <div className="h-44 w-full select-none">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={analyticsData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(100, 116, 139, 0.1)" />
                <XAxis dataKey="month" stroke="rgba(100, 116, 139, 0.5)" fontSize={10} tickLine={false} />
                <YAxis stroke="rgba(100, 116, 139, 0.5)" fontSize={10} tickLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)' }}
                  itemStyle={{ fontSize: 11, color: 'var(--foreground)' }}
                />
                <Area type="monotone" dataKey="count" name="Leads" stroke="#e11d48" fill="rgba(225, 29, 72, 0.1)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

    </div>
  );
};
