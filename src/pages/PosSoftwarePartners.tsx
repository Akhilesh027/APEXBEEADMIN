import React, { useState } from 'react';
import { Laptop, Layers, Landmark, TrendingUp, Search, CheckCircle } from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';

export const PosSoftwarePartners: React.FC = () => {
  const [activeSubTab, setActiveSubTab] = useState<'applications' | 'products' | 'plans' | 'sales' | 'commissions' | 'renewals'>('products');
  const [searchQuery, setSearchQuery] = useState('');

  // Sample software partners listings
  const productsList = [
    { id: 'SFT-101', name: 'ApexRetail POS Suite', provider: 'Deccan Retail Softwares', type: 'SaaS Billing', price: 999, commission: '20%', activeSubscribers: 1450, status: 'Active' },
    { id: 'SFT-102', name: 'SmartAgri Inventory Plus', provider: 'KrishiTech Solutions', type: 'Stock Management', price: 499, commission: '15%', activeSubscribers: 890, status: 'Active' },
    { id: 'SFT-103', name: 'GST Invoice Pro', provider: 'TaxSutra Systems', type: 'Invoicing & Tax', price: 1499, commission: '25%', activeSubscribers: 620, status: 'Active' },
    { id: 'SFT-104', name: 'WishLink Retail Optimizer', provider: 'WishLink Labs', type: 'Marketing SaaS', price: 2999, commission: '30%', activeSubscribers: 0, status: 'Pending Approval' }
  ];

  const getFilteredProducts = () => {
    switch (activeSubTab) {
      case 'applications':
        return productsList.filter(p => p.status === 'Pending Approval');
      default:
        return productsList.filter(p => p.status === 'Active');
    }
  };

  const currentProducts = getFilteredProducts().filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.provider.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const subscriptionData = [
    { month: 'Jan', revenue: 450000 },
    { month: 'Feb', revenue: 580000 },
    { month: 'Mar', revenue: 510000 },
    { month: 'Apr', revenue: 690000 },
    { month: 'May', revenue: 820000 },
    { month: 'Jun', revenue: 950000 }
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-card border border-border/80 rounded-2xl p-4 shadow-sm">
        <div>
          <h2 className="text-sm font-bold text-foreground uppercase tracking-wider">POS Software Partners</h2>
          <p className="text-[11px] text-muted-foreground mt-0.5">Manage SaaS store billing integrations, products, and subscription plans</p>
        </div>
        <span className="px-2.5 py-1 bg-amber-500/10 text-amber-500 dark:text-amber-400 text-xs font-bold rounded-xl border border-amber-500/20 select-none animate-pulse">
          Coming Soon
        </span>
      </div>
      {/* Partner Dashboard metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 select-none">
        <div className="bg-card border border-border/80 rounded-2xl p-4 flex items-center justify-between shadow-sm">
          <div>
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Software Partners</span>
            <span className="text-xl font-bold font-mono text-foreground mt-1 block">15 Developers</span>
            <span className="text-[9px] text-emerald-500 mt-1 block font-semibold">+3 applications verified</span>
          </div>
          <Laptop className="text-primary shrink-0" size={24} />
        </div>
        <div className="bg-card border border-border/80 rounded-2xl p-4 flex items-center justify-between shadow-sm">
          <div>
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Total SaaS Sales</span>
            <span className="text-xl font-bold font-mono text-foreground mt-1 block">₹9.5L</span>
            <span className="text-[9px] text-emerald-500 mt-1 block font-semibold">+18% subscriber growth MoM</span>
          </div>
          <TrendingUp className="text-violet-500 shrink-0" size={24} />
        </div>
        <div className="bg-card border border-border/80 rounded-2xl p-4 flex items-center justify-between shadow-sm">
          <div>
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Active Licenses</span>
            <span className="text-xl font-bold font-mono text-foreground mt-1 block">2,960 licenses</span>
            <span className="text-[9px] text-violet-500 mt-1 block font-semibold">98.5% uptime API SLA</span>
          </div>
          <Layers className="text-emerald-500 shrink-0" size={24} />
        </div>
        <div className="bg-card border border-border/80 rounded-2xl p-4 flex items-center justify-between shadow-sm">
          <div>
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Platform Commissions</span>
            <span className="text-xl font-bold font-mono text-foreground mt-1 block">₹2.15L</span>
            <span className="text-[9px] text-muted-foreground mt-1 block">Accumulated software sales revenue</span>
          </div>
          <Landmark className="text-amber-500 shrink-0" size={24} />
        </div>
      </div>

      {/* Subtab Menu */}
      <div className="flex gap-2 flex-wrap bg-card border border-border/60 p-2 rounded-2xl select-none shadow-sm">
        {(['applications', 'products', 'plans', 'sales', 'commissions', 'renewals'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveSubTab(tab)}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all ${
              activeSubTab === tab
                ? 'bg-primary text-primary-foreground border-primary shadow-md'
                : 'bg-transparent text-muted-foreground border-transparent hover:bg-secondary/60 hover:text-foreground'
            }`}
          >
            {tab === 'applications' ? 'Partner Applications' : tab === 'products' ? 'Software Products' : tab === 'plans' ? 'Subscription Plans' : tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Column: Data tables */}
        <div className="lg:col-span-8 bg-card border border-border/80 rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-3 border-b border-border/60">
            <span className="text-xs font-bold text-foreground uppercase tracking-wider">
              POS Software Integrations ({activeSubTab.toUpperCase()})
            </span>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:flex-initial">
                <Search className="absolute left-3 top-2.5 text-muted-foreground" size={14} />
                <input
                  type="text"
                  placeholder="Search product..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 pr-4 py-1.5 bg-secondary/50 border border-border/80 focus:border-primary rounded-xl text-xs outline-none w-full sm:w-48 font-medium"
                />
              </div>
              <button 
                onClick={() => alert('Exporting subscriber registry...')}
                className="px-3.5 py-1.5 bg-secondary hover:bg-secondary/80 text-foreground font-bold text-xs rounded-xl border border-border/60 transition-all shadow-sm"
              >
                Export
              </button>
            </div>
          </div>

          {activeSubTab === 'sales' ? (
            /* SaaS product Sales tracking */
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-secondary/40 select-none border-b border-border/60">
                  <tr>
                    <th className="p-3 font-semibold text-muted-foreground">Product</th>
                    <th className="p-3 font-semibold text-muted-foreground">Subscribers</th>
                    <th className="p-3 font-semibold text-muted-foreground">Monthly GMV</th>
                    <th className="p-3 font-semibold text-muted-foreground">Platform Commissions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {productsList.map(p => (
                    <tr key={p.id} className="hover:bg-secondary/10 transition-colors">
                      <td className="p-3 font-medium text-foreground">{p.name}</td>
                      <td className="p-3 font-mono text-muted-foreground">{p.activeSubscribers} stores</td>
                      <td className="p-3 font-mono font-semibold text-foreground">₹{(p.price * p.activeSubscribers).toLocaleString()}</td>
                      <td className="p-3 font-mono font-semibold text-emerald-500">₹{(p.price * p.activeSubscribers * parseFloat(p.commission) / 100).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : activeSubTab === 'renewals' ? (
            /* SaaS Renewals logs */
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-secondary/40 select-none border-b border-border/60">
                  <tr>
                    <th className="p-3 font-semibold text-muted-foreground">Subscriber Store</th>
                    <th className="p-3 font-semibold text-muted-foreground">Software license</th>
                    <th className="p-3 font-semibold text-muted-foreground">Renewal Cycle</th>
                    <th className="p-3 font-semibold text-muted-foreground text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  <tr className="hover:bg-secondary/10">
                    <td className="p-3 font-medium text-foreground">Balaji Kirana Outlet</td>
                    <td className="p-3 text-muted-foreground">ApexRetail POS Suite</td>
                    <td className="p-3 text-muted-foreground font-mono">2026-06-28 (Monthly)</td>
                    <td className="p-3 text-center">
                      <span className="px-2 py-0.5 rounded text-[8px] font-bold bg-emerald-500/10 text-emerald-500">Auto-Renew ON</span>
                    </td>
                  </tr>
                  <tr className="hover:bg-secondary/10">
                    <td className="p-3 font-medium text-foreground">Shree Sai Veg Market</td>
                    <td className="p-3 text-muted-foreground">SmartAgri Inventory Plus</td>
                    <td className="p-3 text-muted-foreground font-mono">2026-06-25 (Monthly)</td>
                    <td className="p-3 text-center">
                      <span className="px-2 py-0.5 rounded text-[8px] font-bold bg-emerald-500/10 text-emerald-500">Auto-Renew ON</span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          ) : (
            /* Software products rosters / Applications list */
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-secondary/40 select-none border-b border-border/60">
                  <tr>
                    <th className="p-3 font-semibold text-muted-foreground">Product</th>
                    <th className="p-3 font-semibold text-muted-foreground">Provider Dev</th>
                    <th className="p-3 font-semibold text-muted-foreground">Billing Class</th>
                    <th className="p-3 font-semibold text-muted-foreground">Subscribers</th>
                    <th className="p-3 font-semibold text-muted-foreground text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {currentProducts.map(p => (
                    <tr key={p.id} className="hover:bg-secondary/10 transition-colors">
                      <td className="p-3">
                        <span className="font-semibold text-foreground block">{p.name}</span>
                        <span className="text-[10px] text-muted-foreground block">ID: {p.id} • Pricing: ₹{p.price}/mo</span>
                      </td>
                      <td className="p-3 text-muted-foreground">{p.provider}</td>
                      <td className="p-3 text-muted-foreground">{p.type}</td>
                      <td className="p-3 font-mono text-muted-foreground">{p.activeSubscribers} stores</td>
                      <td className="p-3 text-center border-l border-border/10">
                        {p.status.includes('Pending') ? (
                          <button 
                            onClick={() => alert(`Approving POS software publication: ${p.name}`)}
                            className="px-2.5 py-1 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-[10px] font-bold transition-all"
                          >
                            Approve Product
                          </button>
                        ) : (
                          <span className="text-[10px] text-muted-foreground font-medium flex items-center justify-center gap-1">
                            <CheckCircle size={12} className="text-emerald-500" /> Live
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Right Column: Subscription Analytics Area chart */}
        <div className="lg:col-span-4 bg-card border border-border/80 rounded-2xl p-5 shadow-sm space-y-4">
          <div>
            <span className="text-xs font-bold text-foreground uppercase tracking-wider block">SaaS Subscription Growth</span>
            <p className="text-[9px] text-muted-foreground mt-0.5">Monthly platform billing volumes</p>
          </div>
          
          <div className="h-44 w-full select-none">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={subscriptionData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(100, 116, 139, 0.1)" />
                <XAxis dataKey="month" stroke="rgba(100, 116, 139, 0.5)" fontSize={10} tickLine={false} />
                <YAxis stroke="rgba(100, 116, 139, 0.5)" fontSize={10} tickLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)' }}
                  itemStyle={{ fontSize: 11, color: 'var(--foreground)' }}
                />
                <Area type="monotone" dataKey="revenue" name="Subscription Value (₹)" stroke="#6366f1" fill="rgba(99, 102, 241, 0.1)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

    </div>
  );
};
