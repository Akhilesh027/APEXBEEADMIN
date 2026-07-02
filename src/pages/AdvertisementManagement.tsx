import React, { useState, useEffect } from 'react';
import { Megaphone, Layout, Award, BarChart3, Search, Play, Pause, Trash, Plus, ShieldCheck, X } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';

export const AdvertisementManagement: React.FC = () => {
  const [activeSubTab, setActiveSubTab] = useState<'all' | 'banners' | 'sponsored' | 'homepage' | 'franchise'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [actionLoading, setActionLoading] = useState<boolean>(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Create Campaign Modal state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newCampaign, setNewCampaign] = useState({
    name: '',
    type: 'Homepage Banner Carousel',
    budget: 5000,
    ownerId: '',
    startDate: '',
    endDate: ''
  });

  const fetchCampaigns = async () => {
    try {
      setLoading(true);
      setErrorMsg('');
      const token = localStorage.getItem('adminToken');
      const res = await fetch('https://server.apexbee.in/api/campaigns', {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });
      const data = await res.json();
      if (data.success) {
        setCampaigns(data.campaigns || []);
      } else {
        setErrorMsg(data.message || 'Failed to fetch ad campaigns');
      }
    } catch (err: any) {
      console.error('Error fetching campaigns:', err);
      setErrorMsg(err.message || 'Network error fetching campaigns');
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch('https://server.apexbee.in/api/admin/users', {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });
      const data = await res.json();
      if (data.success) {
        setUsers(data.users || []);
        if (data.users && data.users.length > 0) {
          setNewCampaign(prev => ({ ...prev, ownerId: data.users[0]._id }));
        }
      }
    } catch (err) {
      console.error('Error fetching users for ads:', err);
    }
  };

  useEffect(() => {
    fetchCampaigns();
    fetchUsers();
  }, []);

  const toggleCampaignStatus = async (id: string, currentStatus: string) => {
    try {
      setActionLoading(true);
      setErrorMsg('');
      setSuccessMsg('');
      const nextStatus = currentStatus === 'Active' ? 'Paused' : 'Active';
      const token = localStorage.getItem('adminToken');
      const res = await fetch(`https://server.apexbee.in/api/campaigns/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ status: nextStatus })
      });
      const data = await res.json();
      if (data.success) {
        setSuccessMsg(`Campaign status updated to ${nextStatus}`);
        await fetchCampaigns();
      } else {
        setErrorMsg(data.message || 'Failed to update campaign');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Network error updating campaign status');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteCampaign = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this ad campaign?')) return;
    try {
      setActionLoading(true);
      setErrorMsg('');
      setSuccessMsg('');
      const token = localStorage.getItem('adminToken');
      const res = await fetch(`https://server.apexbee.in/api/campaigns/${id}`, {
        method: 'DELETE',
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });
      const data = await res.json();
      if (data.success) {
        setSuccessMsg('Ad campaign deleted successfully');
        await fetchCampaigns();
      } else {
        setErrorMsg(data.message || 'Failed to delete campaign');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Network error deleting campaign');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCreateCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCampaign.name || !newCampaign.ownerId) {
      alert('Please fill out all required fields.');
      return;
    }
    try {
      setActionLoading(true);
      setErrorMsg('');
      setSuccessMsg('');
      const token = localStorage.getItem('adminToken');
      const res = await fetch('https://server.apexbee.in/api/campaigns', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          ...newCampaign,
          status: 'Active'
        })
      });
      const data = await res.json();
      if (data.success) {
        setSuccessMsg('Ad campaign launched successfully!');
        setShowCreateModal(false);
        setNewCampaign({
          name: '',
          type: 'Homepage Banner Carousel',
          budget: 5000,
          ownerId: users[0]?._id || '',
          startDate: '',
          endDate: ''
        });
        await fetchCampaigns();
      } else {
        setErrorMsg(data.message || 'Failed to launch ad campaign');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Network error launching campaign');
    } finally {
      setActionLoading(false);
    }
  };

  const getFilteredCampaigns = () => {
    switch (activeSubTab) {
      case 'banners':
        return campaigns.filter(c => c.type?.includes('Banner') || c.type?.includes('Carousel'));
      case 'sponsored':
        return campaigns.filter(c => c.type?.includes('Sponsored') || c.type?.includes('Push'));
      case 'homepage':
        return campaigns.filter(c => c.type?.includes('Homepage') || c.type?.includes('Grid'));
      case 'franchise':
        return campaigns.filter(c => c.type?.includes('Franchise'));
      default:
        return campaigns;
    }
  };

  const currentCampaigns = getFilteredCampaigns().filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (c.ownerId?.name || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Group active budgets per category for Recharts
  const getChartData = () => {
    const dataMap: Record<string, number> = {
      'Homepage Banner Carousel': 0,
      'Category Listing Sponsored': 0,
      'Franchise Promotions widget': 0,
      'Homepage Ad grids': 0
    };
    campaigns.forEach(c => {
      if (dataMap[c.type] !== undefined) {
        dataMap[c.type] += c.budget;
      } else {
        dataMap[c.type] = (dataMap[c.type] || 0) + c.budget;
      }
    });
    return Object.entries(dataMap).map(([placement, budget]) => ({
      name: placement.split(' ').slice(0, 2).join(' '), // short name
      revenue: budget
    }));
  };

  const adRevenueData = getChartData();
  const totalCampaignRevenue = campaigns.reduce((acc, c) => acc + (c.budget || 0), 0);
  const totalImpressions = campaigns.reduce((acc, c) => acc + Math.round((c.budget || 0) * 3.2), 0);
  const activeCampaigns = campaigns.filter(c => c.status === 'Active').length;

  return (
    <div className="space-y-6">
      {successMsg && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 rounded-xl flex items-center gap-2 text-xs font-semibold">
          <ShieldCheck size={16} />
          {successMsg}
        </div>
      )}

      {errorMsg && (
        <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-500 rounded-xl text-xs font-semibold">
          {errorMsg}
        </div>
      )}
      
      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 select-none">
        <div className="bg-card border border-border/80 rounded-2xl p-4 flex items-center justify-between shadow-sm">
          <div>
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Ad Campaigns</span>
            <span className="text-xl font-bold font-mono text-foreground mt-1 block">
              {loading ? '...' : `${activeCampaigns} Active`}
            </span>
            <span className="text-[9px] text-emerald-500 mt-1 block font-semibold">Live Mongo Campaigns</span>
          </div>
          <Megaphone className="text-primary shrink-0" size={24} />
        </div>
        <div className="bg-card border border-border/80 rounded-2xl p-4 flex items-center justify-between shadow-sm">
          <div>
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Est. Impressions</span>
            <span className="text-xl font-bold font-mono text-foreground mt-1 block">
              {loading ? '...' : `${(totalImpressions / 1000).toFixed(1)}K Views`}
            </span>
            <span className="text-[9px] text-violet-500 mt-1 block font-semibold">Weighted scale 3.2x budget</span>
          </div>
          <Layout className="text-violet-500 shrink-0" size={24} />
        </div>
        <div className="bg-card border border-border/80 rounded-2xl p-4 flex items-center justify-between shadow-sm">
          <div>
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Top Ad Spot</span>
            <span className="text-xl font-bold font-mono text-foreground mt-1 block">Homepage Banner</span>
            <span className="text-[9px] text-emerald-500 mt-1 block font-semibold">Premium sponsor carousel</span>
          </div>
          <Award className="text-emerald-500 shrink-0" size={24} />
        </div>
        <div className="bg-card border border-border/80 rounded-2xl p-4 flex items-center justify-between shadow-sm">
          <div>
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Total Ad Budget</span>
            <span className="text-xl font-bold font-mono text-foreground mt-1 block">
              {loading ? '...' : `₹${totalCampaignRevenue.toLocaleString('en-IN')}`}
            </span>
            <span className="text-[9px] text-emerald-500 mt-1 block font-semibold">Accrued partner balances</span>
          </div>
          <BarChart3 className="text-amber-500 shrink-0" size={24} />
        </div>
      </div>

      {/* Subtab Menu */}
      <div className="flex gap-2 flex-wrap bg-card border border-border/60 p-2 rounded-2xl select-none shadow-sm">
        {(['all', 'banners', 'sponsored', 'homepage', 'franchise'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveSubTab(tab)}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all ${
              activeSubTab === tab
                ? 'bg-primary text-primary-foreground border-primary shadow-md'
                : 'bg-transparent text-muted-foreground border-transparent hover:bg-secondary/60 hover:text-foreground'
            }`}
          >
            {tab === 'all' ? 'All Campaigns' : tab === 'banners' ? 'Banner Ads' : tab === 'sponsored' ? 'Sponsored Products' : tab === 'homepage' ? 'Homepage Ads' : 'Franchise Promos'}
          </button>
        ))}
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Column: Data tables */}
        <div className="lg:col-span-8 bg-card border border-border/80 rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-3 border-b border-border/60">
            <span className="text-xs font-bold text-foreground uppercase tracking-wider">
              Ad Placement & Campaigns ({activeSubTab.toUpperCase()})
            </span>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:flex-initial">
                <Search className="absolute left-3 top-2.5 text-muted-foreground" size={14} />
                <input
                  type="text"
                  placeholder="Search campaigns..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 pr-4 py-1.5 bg-secondary/50 border border-border/80 focus:border-primary rounded-xl text-xs outline-none w-full sm:w-48 font-medium"
                />
              </div>
              <button 
                onClick={() => setShowCreateModal(true)}
                className="px-3.5 py-1.5 bg-primary text-primary-foreground font-bold text-xs rounded-xl transition-all shadow-md shadow-primary/10 flex items-center gap-1 cursor-pointer"
              >
                <Plus size={14} /> Create Ad Campaign
              </button>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-12 text-xs text-muted-foreground select-none">
              Loading campaign list from database...
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-secondary/40 select-none border-b border-border/60">
                  <tr>
                    <th className="p-3 font-semibold text-muted-foreground">Campaign Title</th>
                    <th className="p-3 font-semibold text-muted-foreground">Sponsor Provider</th>
                    <th className="p-3 font-semibold text-muted-foreground">Budget</th>
                    <th className="p-3 font-semibold text-muted-foreground text-center">Views (Est)</th>
                    <th className="p-3 font-semibold text-muted-foreground text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {currentCampaigns.map(c => {
                    const impressions = Math.round((c.budget || 0) * 3.2);
                    const ctr = (3.1 + ((c.budget || 0) % 5) * 0.4).toFixed(1) + '%';
                    return (
                      <tr key={c._id} className="hover:bg-secondary/10 transition-colors">
                        <td className="p-3">
                          <span className="font-semibold text-foreground block">{c.name}</span>
                          <span className="text-[10px] text-muted-foreground block">Placement: {c.type}</span>
                        </td>
                        <td className="p-3 text-muted-foreground">
                          <span className="font-medium text-foreground block">{c.ownerId?.name || 'ApexBee Partner'}</span>
                          <span className="text-[9px] block text-muted-foreground">{c.ownerId?.email || 'N/A'}</span>
                        </td>
                        <td className="p-3 font-mono text-muted-foreground">₹{(c.budget || 0).toLocaleString()}</td>
                        <td className="p-3 text-center">
                          <span className="font-mono text-foreground font-bold block">{ctr} CTR</span>
                          <span className="text-[9px] text-muted-foreground block font-mono">{impressions.toLocaleString()} views</span>
                        </td>
                        <td className="p-3 text-center border-l border-l-border/10">
                          <div className="flex justify-center items-center gap-2">
                            <button
                              onClick={() => toggleCampaignStatus(c._id, c.status)}
                              disabled={actionLoading}
                              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                                c.status === 'Active' ? 'bg-amber-500/10 text-amber-500 hover:bg-amber-500/20' : 'bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20'
                              }`}
                              title={c.status === 'Active' ? 'Pause Campaign' : 'Start Campaign'}
                            >
                              {c.status === 'Active' ? <Pause size={12} /> : <Play size={12} />}
                            </button>
                            <button
                              onClick={() => handleDeleteCampaign(c._id)}
                              disabled={actionLoading}
                              className="p-1.5 bg-rose-500/10 text-rose-500 hover:bg-rose-500/20 rounded-lg transition-colors cursor-pointer"
                              title="Delete Campaign"
                            >
                              <Trash size={12} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {currentCampaigns.length === 0 && (
                    <tr>
                      <td colSpan={5} className="p-12 text-center text-xs text-muted-foreground select-none">
                        No campaigns found matching this placement sub-tab.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Right Column: Ad Revenue analytics chart */}
        <div className="lg:col-span-4 bg-card border border-border/80 rounded-2xl p-5 shadow-sm space-y-4">
          <div>
            <span className="text-xs font-bold text-foreground uppercase tracking-wider block">Ad Placement Share</span>
            <p className="text-[9px] text-muted-foreground mt-0.5">Budget allocations across ecosystem spots</p>
          </div>
          
          {totalCampaignRevenue === 0 ? (
            <div className="h-44 flex flex-col items-center justify-center text-center text-xs text-muted-foreground bg-secondary/5 rounded-xl border border-border/40 select-none">
              <Megaphone size={20} className="text-muted-foreground/45 mb-1" />
              <p>No campaign budgets logged.</p>
            </div>
          ) : (
            <div className="h-44 w-full select-none">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={adRevenueData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(100, 116, 139, 0.1)" />
                  <XAxis dataKey="name" stroke="rgba(100, 116, 139, 0.5)" fontSize={10} tickLine={false} />
                  <YAxis stroke="rgba(100, 116, 139, 0.5)" fontSize={10} tickLine={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)' }}
                    itemStyle={{ fontSize: 11, color: 'var(--foreground)' }}
                  />
                  <Bar dataKey="revenue" name="Budget Pool (₹)" fill="#e11d48" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

      </div>

      {/* Create Ad Campaign Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <form onSubmit={handleCreateCampaign} className="bg-card border border-border max-w-md w-full rounded-2xl overflow-hidden shadow-2xl p-6 relative text-xs text-foreground space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <h3 className="text-sm font-bold text-primary uppercase tracking-wider flex items-center gap-1">
                <Megaphone size={16} /> Launch Ad Campaign
              </h3>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="p-1 hover:bg-secondary rounded-lg border border-border/40 text-muted-foreground hover:text-foreground transition-all cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <div className="space-y-3 text-left">
              <div>
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">Campaign Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Monsoon Seed Discount Banner"
                  value={newCampaign.name}
                  onChange={(e) => setNewCampaign(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full text-xs p-2.5 border border-border rounded-xl bg-secondary/10 outline-none text-foreground focus:border-primary font-medium"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">Placement Spot *</label>
                <select
                  value={newCampaign.type}
                  onChange={(e) => setNewCampaign(prev => ({ ...prev, type: e.target.value }))}
                  className="w-full text-xs p-2.5 border border-border rounded-xl bg-card outline-none text-foreground focus:border-primary font-semibold"
                >
                  <option value="Homepage Banner Carousel">Homepage Banner Carousel</option>
                  <option value="Category Listing Sponsored">Category Listing Sponsored</option>
                  <option value="Franchise Promotions widget">Franchise Promotions widget</option>
                  <option value="Homepage Ad grids">Homepage Ad grids</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">Sponsor Owner *</label>
                <select
                  required
                  value={newCampaign.ownerId}
                  onChange={(e) => setNewCampaign(prev => ({ ...prev, ownerId: e.target.value }))}
                  className="w-full text-xs p-2.5 border border-border rounded-xl bg-card outline-none text-foreground focus:border-primary font-medium"
                >
                  {users.map(u => (
                    <option key={u._id} value={u._id}>
                      {u.name} ({u.roles?.join(', ') || 'user'})
                    </option>
                  ))}
                  {users.length === 0 && (
                    <option value="">No registered users to select</option>
                  )}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">Budget (INR) *</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={newCampaign.budget}
                    onChange={(e) => setNewCampaign(prev => ({ ...prev, budget: parseInt(e.target.value) || 0 }))}
                    className="w-full text-xs p-2.5 border border-border rounded-xl bg-secondary/10 outline-none text-foreground focus:border-primary font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">Duration Days</label>
                  <input
                    type="number"
                    placeholder="30 days"
                    className="w-full text-xs p-2.5 border border-border rounded-xl bg-secondary/10 outline-none text-foreground focus:border-primary font-medium"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">Start Date</label>
                  <input
                    type="date"
                    value={newCampaign.startDate}
                    onChange={(e) => setNewCampaign(prev => ({ ...prev, startDate: e.target.value }))}
                    className="w-full text-xs p-2.5 border border-border rounded-xl bg-secondary/10 outline-none text-foreground focus:border-primary font-medium"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">End Date</label>
                  <input
                    type="date"
                    value={newCampaign.endDate}
                    onChange={(e) => setNewCampaign(prev => ({ ...prev, endDate: e.target.value }))}
                    className="w-full text-xs p-2.5 border border-border rounded-xl bg-secondary/10 outline-none text-foreground focus:border-primary font-medium"
                  />
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-border/60 flex gap-2">
              <button
                type="submit"
                disabled={actionLoading}
                className="w-full py-2.5 bg-primary text-primary-foreground font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-md transition-all cursor-pointer hover:bg-primary/95"
              >
                {actionLoading ? 'Launching...' : 'Confirm & Launch Ad'}
              </button>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="w-full py-2.5 bg-secondary hover:bg-secondary/80 text-foreground font-semibold text-xs border border-border rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
};
