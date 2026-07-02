import React, { useState } from 'react';
import { Plane, Compass, BookOpen, DollarSign, Search, CheckCircle } from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';

export const TravelPartnerManagement: React.FC = () => {
  const [activeSubTab, setActiveSubTab] = useState<'agents' | 'packages' | 'hotels' | 'bookings' | 'revenue'>('packages');
  const [searchQuery, setSearchQuery] = useState('');

  // Sample travel listings
  const packagesList = [
    { id: 'TRV-101', title: 'Konkan Coastal Getaway (4D/3N)', agent: 'Maharashtra Tourisms Ltd', pricing: 12500, platformComm: '10%', bookings: 45, revenue: 56250, status: 'Active' },
    { id: 'TRV-102', title: 'Mahabaleshwar Strawberry Tour', agent: 'Sahyadri Travels', pricing: 8500, platformComm: '12%', bookings: 80, revenue: 81600, status: 'Active' },
    { id: 'TRV-103', title: 'Historical Pune Heritage Walk', agent: 'Pune Heritage Guild', pricing: 1500, platformComm: '15%', bookings: 120, revenue: 27000, status: 'Active' },
    { id: 'TRV-104', title: 'Lonavala Monsoon Trekking', agent: 'Sahyadri Adventures', pricing: 2200, platformComm: '10%', bookings: 0, status: 'Pending Review' }
  ];

  const getFilteredPackages = () => {
    switch (activeSubTab) {
      case 'agents':
        return packagesList.filter(p => p.status === 'Active');
      default:
        return packagesList;
    }
  };

  const currentPackages = getFilteredPackages().filter(p => 
    p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.agent.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const bookingsTrend = [
    { month: 'Jan', bookings: 25 },
    { month: 'Feb', bookings: 38 },
    { month: 'Mar', bookings: 42 },
    { month: 'Apr', bookings: 35 },
    { month: 'May', bookings: 68 },
    { month: 'Jun', bookings: 95 }
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-card border border-border/80 rounded-2xl p-4 shadow-sm">
        <div>
          <h2 className="text-sm font-bold text-foreground uppercase tracking-wider">Travel & Tourism Partners</h2>
          <p className="text-[11px] text-muted-foreground mt-0.5">Integrate and manage local travel agents, packages, and bookings</p>
        </div>
        <span className="px-2.5 py-1 bg-amber-500/10 text-amber-500 dark:text-amber-400 text-xs font-bold rounded-xl border border-amber-500/20 select-none animate-pulse">
          Coming Soon
        </span>
      </div>
      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 select-none">
        <div className="bg-card border border-border/80 rounded-2xl p-4 flex items-center justify-between shadow-sm">
          <div>
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Travel Partners</span>
            <span className="text-xl font-bold font-mono text-foreground mt-1 block">8 Agents</span>
            <span className="text-[9px] text-emerald-500 mt-1 block font-semibold">+2 verified this month</span>
          </div>
          <Plane className="text-primary shrink-0" size={24} />
        </div>
        <div className="bg-card border border-border/80 rounded-2xl p-4 flex items-center justify-between shadow-sm">
          <div>
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Tour Packages</span>
            <span className="text-xl font-bold font-mono text-foreground mt-1 block">15 Packages</span>
            <span className="text-[9px] text-violet-500 mt-1 block font-semibold">1 awaiting review audit</span>
          </div>
          <Compass className="text-violet-500 shrink-0" size={24} />
        </div>
        <div className="bg-card border border-border/80 rounded-2xl p-4 flex items-center justify-between shadow-sm">
          <div>
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Total Bookings</span>
            <span className="text-xl font-bold font-mono text-foreground mt-1 block">245 Booked</span>
            <span className="text-[9px] text-emerald-500 mt-1 block font-semibold">+14% growth MoM</span>
          </div>
          <BookOpen className="text-emerald-500 shrink-0" size={24} />
        </div>
        <div className="bg-card border border-border/80 rounded-2xl p-4 flex items-center justify-between shadow-sm">
          <div>
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Platform Revenue</span>
            <span className="text-xl font-bold font-mono text-foreground mt-1 block">₹1.65L</span>
            <span className="text-[9px] text-muted-foreground mt-1 block">Ecosystem travel commission pool</span>
          </div>
          <DollarSign className="text-amber-500 shrink-0" size={24} />
        </div>
      </div>

      {/* Subtab Menu */}
      <div className="flex gap-2 flex-wrap bg-card border border-border/60 p-2 rounded-2xl select-none shadow-sm">
        {(['agents', 'packages', 'hotels', 'bookings', 'revenue'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveSubTab(tab)}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all ${
              activeSubTab === tab
                ? 'bg-primary text-primary-foreground border-primary shadow-md'
                : 'bg-transparent text-muted-foreground border-transparent hover:bg-secondary/60 hover:text-foreground'
            }`}
          >
            {tab === 'agents' ? 'Travel Agents' : tab === 'packages' ? 'Tour Packages' : tab === 'hotels' ? 'Hotel Partners' : tab === 'revenue' ? 'Revenue Sharing' : tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Column: Data tables */}
        <div className="lg:col-span-8 bg-card border border-border/80 rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-3 border-b border-border/60">
            <span className="text-xs font-bold text-foreground uppercase tracking-wider">
              Travel & Tourism Console ({activeSubTab.toUpperCase()})
            </span>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:flex-initial">
                <Search className="absolute left-3 top-2.5 text-muted-foreground" size={14} />
                <input
                  type="text"
                  placeholder="Search package..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 pr-4 py-1.5 bg-secondary/50 border border-border/80 focus:border-primary rounded-xl text-xs outline-none w-full sm:w-48 font-medium"
                />
              </div>
              <button 
                onClick={() => alert('Exporting bookings sheet...')}
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
                  <th className="p-3 font-semibold text-muted-foreground">Package Title</th>
                  <th className="p-3 font-semibold text-muted-foreground">Travel Agent</th>
                  <th className="p-3 font-semibold text-muted-foreground">Costing</th>
                  <th className="p-3 font-semibold text-muted-foreground">Commission Share</th>
                  <th className="p-3 font-semibold text-muted-foreground text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {currentPackages.map(p => (
                  <tr key={p.id} className="hover:bg-secondary/10 transition-colors">
                    <td className="p-3">
                      <span className="font-semibold text-foreground block">{p.title}</span>
                      <span className="text-[10px] text-muted-foreground block">ID: {p.id}</span>
                    </td>
                    <td className="p-3 text-muted-foreground">{p.agent}</td>
                    <td className="p-3 font-mono text-muted-foreground">₹{p.pricing.toLocaleString()}</td>
                    <td className="p-3 font-mono font-bold text-foreground">{p.platformComm}</td>
                    <td className="p-3 text-center border-l border-border/10">
                      {p.status.includes('Pending') ? (
                        <button 
                          onClick={() => alert(`Approving package: ${p.title}`)}
                          className="px-2.5 py-1 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-[10px] font-bold transition-all"
                        >
                          Approve Package
                        </button>
                      ) : (
                        <span className="text-[10px] text-muted-foreground font-medium flex items-center justify-center gap-1">
                          <CheckCircle size={12} className="text-emerald-500" /> Active
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Column: Bookings trend chart */}
        <div className="lg:col-span-4 bg-card border border-border/80 rounded-2xl p-5 shadow-sm space-y-4">
          <div>
            <span className="text-xs font-bold text-foreground uppercase tracking-wider block">Bookings Analytics</span>
            <p className="text-[9px] text-muted-foreground mt-0.5">Monthly travel package registrations</p>
          </div>
          
          <div className="h-44 w-full select-none">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={bookingsTrend} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(100, 116, 139, 0.1)" />
                <XAxis dataKey="month" stroke="rgba(100, 116, 139, 0.5)" fontSize={10} tickLine={false} />
                <YAxis stroke="rgba(100, 116, 139, 0.5)" fontSize={10} tickLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)' }}
                  itemStyle={{ fontSize: 11, color: 'var(--foreground)' }}
                />
                <Area type="monotone" dataKey="bookings" name="Bookings" stroke="#06b6d4" fill="rgba(6, 182, 212, 0.1)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

    </div>
  );
};
