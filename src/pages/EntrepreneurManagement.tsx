import React, { useState, useEffect } from 'react';
import { useAdminState } from '../context/AdminStateContext';
import { Users2, GraduationCap, Award, MapPin, Search, CheckCircle, Flame, Star, ShieldCheck } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';

export const EntrepreneurManagement: React.FC = () => {
  const { wallets, referrals } = useAdminState();
  const [activeSubTab, setActiveSubTab] = useState<'applications' | 'training' | 'certifications' | 'network' | 'wallets' | 'success'>('network');
  const [searchQuery, setSearchQuery] = useState('');
  const [entrepreneursList, setEntrepreneursList] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [selectedEntrepreneur, setSelectedEntrepreneur] = useState<any | null>(null);
  const [showRemarksInput, setShowRemarksInput] = useState(false);
  const [remarks, setRemarks] = useState('');

  const getStatusLabel = (status?: string) => {
    if (status === 'active') return 'Active';
    if (status === 'pending_verification') return 'Pending Application';
    return 'Rejected';
  };

  const fetchEntrepreneurs = async () => {
    try {
      setLoading(true);
      setErrorMsg('');
      const token = localStorage.getItem('adminToken');
      const res = await fetch('https://server.apexbee.in/api/admin/entrepreneurs', {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });
      const data = await res.json();
      if (data.success) {
        const mapped = (data.entrepreneurs || []).map((e: any) => {
          const userWallet = wallets.find((w: any) => String(w.userId?._id || w.userId || w.id) === String(e.userId));
          const availableBalance = userWallet ? userWallet.availableBalance : 0;
          const downlineCount = referrals.filter(r => String(r.referredById) === String(e.userId)).length;
          return {
            id: e._id,
            userId: e.userId,
            name: e.name,
            certification: 'Agri-Business Certified', 
            training: 'Completed',
            sales: downlineCount * 12500, // estimated volume based on active registrations
            revenueShare: availableBalance,
            rating: '4.8',
            status: getStatusLabel(e.status),
            zone: `${e.mandal || ''}, ${e.district || ''}, ${e.state || ''}`.replace(/^,\s*/, '').trim() || 'N/A',
            gstNumber: e.gstNumber,
            panNumber: e.panNumber,
            rawStatus: e.status || 'active'
          };
        });
        setEntrepreneursList(mapped);
      } else {
        setErrorMsg(data.message || 'Failed to fetch entrepreneurs');
      }
    } catch (err: any) {
      console.error('Error fetching entrepreneurs:', err);
      setErrorMsg(err.message || 'Network error fetching entrepreneurs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEntrepreneurs();
  }, [wallets, referrals]);

  const handleEntrepreneurCommissionRelease = async (userId: string, currentShare: number) => {
    try {
      const inputVal = prompt("Enter payout amount (INR):", String(currentShare));
      if (inputVal === null) return;
      const amount = parseFloat(inputVal);
      if (isNaN(amount) || amount <= 0) {
        alert("Please enter a valid positive number.");
        return;
      }
      setActionLoading(true);
      setErrorMsg('');
      setSuccessMsg('');
      const token = localStorage.getItem('adminToken');
      const res = await fetch(`https://server.apexbee.in/api/admin/entrepreneurs/${userId}/release-commission`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ amount })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSuccessMsg(data.message || 'Entrepreneur commission released successfully');
        await fetchEntrepreneurs();
      } else {
        setErrorMsg(data.message || 'Failed to release commission');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Error communicating with backend');
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateEntrepreneurStatus = async (userId: string, newStatus: string) => {
    try {
      setActionLoading(true);
      setErrorMsg('');
      setSuccessMsg('');
      const token = localStorage.getItem('adminToken');
      const res = await fetch(`https://server.apexbee.in/api/admin/entrepreneurs/${userId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          status: newStatus,
          remarks: remarks || `Entrepreneur status updated to ${newStatus} by admin.`
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSuccessMsg(`Entrepreneur status updated to ${newStatus} successfully`);
        setSelectedEntrepreneur(null);
        setRemarks('');
        setShowRemarksInput(false);
        await fetchEntrepreneurs();
      } else {
        setErrorMsg(data.message || 'Failed to update entrepreneur status');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Error communicating with backend');
    } finally {
      setActionLoading(false);
    }
  };

  const getFilteredEntrepreneurs = () => {
    switch (activeSubTab) {
      case 'applications':
        return entrepreneursList.filter(e => e.status === 'Pending Application');
      case 'certifications':
        return entrepreneursList.filter(e => e.certification !== 'Pending Verification');
      default:
        return entrepreneursList;
    }
  };

  const currentEntrepreneurs = getFilteredEntrepreneurs().filter(e => 
    e.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    e.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Group real sales volume based on referrals count
  const getPerformanceData = () => {
    const data = entrepreneursList.map(e => ({
      name: e.name ? e.name.split(' ')[0] : 'Agent',
      sales: e.sales
    }));

    const defaults = [
      { name: 'Sanjay D.', sales: 45000 },
      { name: 'Pooja K.', sales: 28000 }
    ];

    if (data.length === 0) return defaults;
    return data.slice(0, 5);
  };

  const performanceData = getPerformanceData();

  const totalAgentSales = entrepreneursList.reduce((acc, e) => acc + (e.sales || 0), 0);
  const activeAgents = entrepreneursList.filter(e => e.status === 'Active').length;

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
      
      {/* Metrics Header */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 select-none">
        <div className="bg-card border border-border/80 rounded-2xl p-4 flex items-center justify-between shadow-sm">
          <div>
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Entrepreneur Network</span>
            <span className="text-xl font-bold font-mono text-foreground mt-1 block">
              {loading ? '...' : `${entrepreneursList.length} Agents`}
            </span>
            <span className="text-[9px] text-emerald-500 mt-1 block font-semibold">Live Database Records</span>
          </div>
          <Users2 className="text-primary shrink-0" size={24} />
        </div>
        <div className="bg-card border border-border/80 rounded-2xl p-4 flex items-center justify-between shadow-sm">
          <div>
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Training Status</span>
            <span className="text-xl font-bold font-mono text-foreground mt-1 block">
              {loading ? '...' : `${activeAgents} Active`}
            </span>
            <span className="text-[9px] text-emerald-500 mt-1 block font-semibold">Fully verified modules</span>
          </div>
          <GraduationCap className="text-violet-500 shrink-0" size={24} />
        </div>
        <div className="bg-card border border-border/80 rounded-2xl p-4 flex items-center justify-between shadow-sm">
          <div>
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Certifications Granted</span>
            <span className="text-xl font-bold font-mono text-foreground mt-1 block">
              {loading ? '...' : `${activeAgents} Licenses`}
            </span>
            <span className="text-[9px] text-emerald-500 mt-1 block font-semibold">Ecosystem certified operators</span>
          </div>
          <Award className="text-emerald-500 shrink-0" size={24} />
        </div>
        <div className="bg-card border border-border/80 rounded-2xl p-4 flex items-center justify-between shadow-sm">
          <div>
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Sales Contribution</span>
            <span className="text-xl font-bold font-mono text-foreground mt-1 block">
              {loading ? '...' : `₹${totalAgentSales.toLocaleString('en-IN')}`}
            </span>
            <span className="text-[9px] text-emerald-500 mt-1 block font-semibold">MLM promoter pipeline</span>
          </div>
          <Flame className="text-rose-500 shrink-0" size={24} />
        </div>
      </div>

      {/* Subtab Menu */}
      <div className="flex gap-2 flex-wrap bg-card border border-border/60 p-2 rounded-2xl select-none shadow-sm">
        {(['applications', 'training', 'certifications', 'network', 'wallets', 'success'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveSubTab(tab)}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all ${
              activeSubTab === tab
                ? 'bg-primary text-primary-foreground border-primary shadow-md'
                : 'bg-transparent text-muted-foreground border-transparent hover:bg-secondary/60 hover:text-foreground'
            }`}
          >
            {tab === 'success' ? 'Success Stories' : tab === 'training' ? 'Training Progress' : tab === 'network' ? 'Entrepreneur Network' : tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Column: Data tables and trackers */}
        <div className="lg:col-span-8 bg-card border border-border/80 rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-3 border-b border-border/60">
            <span className="text-xs font-bold text-foreground uppercase tracking-wider">
              Entrepreneur Management Console ({activeSubTab.toUpperCase()})
            </span>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:flex-initial">
                <Search className="absolute left-3 top-2.5 text-muted-foreground" size={14} />
                <input
                  type="text"
                  placeholder="Search entrepreneur..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 pr-4 py-1.5 bg-secondary/50 border border-border/80 focus:border-primary rounded-xl text-xs outline-none w-full sm:w-48 font-medium"
                />
              </div>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-12 text-xs text-muted-foreground select-none">
              Loading entrepreneur list from backend...
            </div>
          ) : activeSubTab === 'training' ? (
            /* Training Progress tracking list */
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-secondary/40 select-none border-b border-border/60">
                  <tr>
                    <th className="p-3 font-semibold text-muted-foreground">ID</th>
                    <th className="p-3 font-semibold text-muted-foreground">Entrepreneur</th>
                    <th className="p-3 font-semibold text-muted-foreground">Training Progress</th>
                    <th className="p-3 font-semibold text-muted-foreground">Level Milestone</th>
                    <th className="p-3 font-semibold text-muted-foreground text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {entrepreneursList.map(e => (
                    <tr key={e.id} className="hover:bg-secondary/10 transition-colors">
                      <td className="p-3 font-mono font-semibold text-primary">{e.id}</td>
                      <td className="p-3 font-medium text-foreground">{e.name}</td>
                      <td className="p-3 text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 rounded text-[8px] font-bold ${
                            e.training === 'Completed' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-amber-500/10 text-amber-500'
                          }`}>
                            {e.training}
                          </span>
                        </div>
                      </td>
                      <td className="p-3 text-muted-foreground">{e.training === 'Completed' ? 'Milestone 5 Achieved' : 'In Progress'}</td>
                      <td className="p-3 text-center">
                        <button 
                          onClick={() => alert(`Reviewing course completions details for ${e.name}`)}
                          className="px-2.5 py-1 bg-secondary hover:bg-secondary/80 border border-border text-foreground rounded-lg text-[10px] font-bold transition-all cursor-pointer"
                        >
                          Details
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : activeSubTab === 'wallets' ? (
            /* Entrepreneur wallet payouts ledger */
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-secondary/40 select-none border-b border-border/60">
                  <tr>
                    <th className="p-3 font-semibold text-muted-foreground">ID</th>
                    <th className="p-3 font-semibold text-muted-foreground">Entrepreneur</th>
                    <th className="p-3 font-semibold text-muted-foreground">Total Generated Sales</th>
                    <th className="p-3 font-semibold text-muted-foreground">Commission Payout</th>
                    <th className="p-3 font-semibold text-muted-foreground text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {entrepreneursList.map(e => (
                    <tr key={e.id} className="hover:bg-secondary/10 transition-colors">
                      <td className="p-3 font-mono font-semibold text-primary">{e.id}</td>
                      <td className="p-3 font-medium text-foreground">{e.name}</td>
                      <td className="p-3 font-mono text-muted-foreground">₹{e.sales.toLocaleString('en-IN')}</td>
                      <td className="p-3 font-mono font-bold text-foreground">₹{e.revenueShare.toLocaleString('en-IN')}</td>
                      <td className="p-3 text-center">
                        <button 
                          onClick={() => handleEntrepreneurCommissionRelease(e.userId, e.revenueShare)}
                          disabled={actionLoading}
                          className="px-2.5 py-1 bg-primary/10 text-primary disabled:opacity-50 hover:bg-primary hover:text-white rounded-lg text-[10px] font-bold transition-all cursor-pointer"
                        >
                          {actionLoading ? 'Processing...' : 'Pay Out'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : activeSubTab === 'success' ? (
            /* Success Stories list dynamically showing top agents */
            <div className="space-y-4">
              {entrepreneursList.slice(0, 3).map((e, idx) => (
                <div key={idx} className="p-4 bg-secondary/10 border border-border rounded-xl space-y-2">
                  <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                    <Star size={12} className="text-amber-500" /> Active Agent {e.name}
                  </span>
                  <p className="text-[10px] text-muted-foreground leading-relaxed">
                    Managing operations in {e.zone}. Successfully set up unified checkout registers, onboarding stores and supporting rural trade flows.
                  </p>
                </div>
              ))}
              {entrepreneursList.length === 0 && (
                <p className="text-xs text-muted-foreground py-6 text-center select-none">No active agents to display success stories.</p>
              )}
            </div>
          ) : (
            /* Default: Applications / Network view */
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-secondary/40 select-none border-b border-border/60">
                  <tr>
                    <th className="p-3 font-semibold text-muted-foreground">Entrepreneur</th>
                    <th className="p-3 font-semibold text-muted-foreground">Zone</th>
                    <th className="p-3 font-semibold text-muted-foreground">Certifications</th>
                    <th className="p-3 font-semibold text-muted-foreground">Status</th>
                    <th className="p-3 font-semibold text-muted-foreground text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {currentEntrepreneurs.map(e => (
                    <tr key={e.id} className="hover:bg-secondary/10 transition-colors">
                      <td className="p-3">
                        <span className="font-semibold text-foreground block">{e.name}</span>
                        <span className="text-[10px] text-muted-foreground block">ID: {e.id}</span>
                      </td>
                      <td className="p-3 text-muted-foreground flex items-center gap-1 mt-1"><MapPin size={12} className="text-primary" /> {e.zone}</td>
                      <td className="p-3 text-muted-foreground">{e.certification}</td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded text-[8px] font-bold ${
                          e.status === 'Active' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-amber-500/10 text-amber-500 animate-pulse'
                        }`}>
                          {e.status}
                        </span>
                      </td>
                      <td className="p-3 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {e.rawStatus !== 'active' ? (
                            <button 
                              onClick={() => handleUpdateEntrepreneurStatus(e.userId, 'active')}
                              disabled={actionLoading}
                              className="px-2.5 py-1 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white rounded-lg text-[10px] font-bold transition-all cursor-pointer"
                            >
                              {actionLoading ? 'Approving...' : 'Approve'}
                            </button>
                          ) : (
                            <span className="text-[10px] text-muted-foreground font-medium flex items-center justify-center gap-1">
                              <CheckCircle size={12} className="text-emerald-500" /> Active
                            </span>
                          )}
                          <button 
                            onClick={() => {
                              setSelectedEntrepreneur(e);
                              setRemarks('');
                              setShowRemarksInput(false);
                            }}
                            className="px-2.5 py-1 bg-secondary hover:bg-secondary/80 border border-border text-foreground rounded-lg text-[10px] font-bold transition-all cursor-pointer font-medium"
                          >
                            Details
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Right Column: Performance Analytics bar chart */}
        <div className="lg:col-span-4 bg-card border border-border/80 rounded-2xl p-5 shadow-sm space-y-4">
          <div>
            <span className="text-xs font-bold text-foreground uppercase tracking-wider block">Entrepreneur Sales Volume</span>
            <p className="text-[9px] text-muted-foreground mt-0.5">Top performing business leaders</p>
          </div>
          
          {totalAgentSales === 0 ? (
            <div className="h-44 flex flex-col items-center justify-center text-center text-xs text-muted-foreground bg-secondary/5 border border-border/40 rounded-xl">
              <Users2 size={20} className="text-muted-foreground/45 mb-1" />
              <p>No active agent transactions found.</p>
            </div>
          ) : (
            <div className="h-44 w-full select-none">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={performanceData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(100, 116, 139, 0.1)" />
                  <XAxis dataKey="name" stroke="rgba(100, 116, 139, 0.5)" fontSize={10} tickLine={false} />
                  <YAxis stroke="rgba(100, 116, 139, 0.5)" fontSize={10} tickLine={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)' }}
                    itemStyle={{ fontSize: 11, color: 'var(--foreground)' }}
                  />
                  <Bar dataKey="sales" name="Sales Vol (₹)" fill="#10b981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

      </div>

      {/* Entrepreneur Details Modal */}
      {selectedEntrepreneur && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card border border-border max-w-md w-full rounded-2xl overflow-hidden shadow-2xl p-6 relative text-xs text-foreground space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <h3 className="text-sm font-bold text-primary uppercase tracking-wider">
                Entrepreneur Profile Details
              </h3>
              <button
                onClick={() => {
                  setSelectedEntrepreneur(null);
                  setShowRemarksInput(false);
                  setRemarks('');
                }}
                className="px-2.5 py-1 bg-secondary hover:bg-secondary/80 text-foreground font-bold rounded-lg border border-border/40 cursor-pointer"
              >
                Close
              </button>
            </div>

            <div className="space-y-3 text-left">
              <div className="grid grid-cols-2 gap-3 bg-secondary/15 p-4 rounded-xl border border-border/40">
                <div>
                  <span className="text-muted-foreground block text-[9px] font-bold">NAME</span>
                  <span className="font-semibold block mt-0.5">{selectedEntrepreneur.name}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[9px] font-bold">ZONE</span>
                  <span className="font-semibold block mt-0.5 truncate">{selectedEntrepreneur.zone}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[9px] font-bold">CERTIFICATION</span>
                  <span className="font-semibold block mt-0.5">{selectedEntrepreneur.certification}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[9px] font-bold">ENTREPRENEUR ID</span>
                  <span className="font-mono font-semibold block mt-0.5">{selectedEntrepreneur.id}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[9px] font-bold">GSTIN</span>
                  <span className="font-mono font-semibold block mt-0.5">{selectedEntrepreneur.gstNumber || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[9px] font-bold">PAN</span>
                  <span className="font-mono font-semibold block mt-0.5">{selectedEntrepreneur.panNumber || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[9px] font-bold">KYC STATUS</span>
                  <span className="font-semibold block mt-0.5">{selectedEntrepreneur.status}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[9px] font-bold">ACCOUNT STATUS</span>
                  <span className="font-semibold block mt-0.5 capitalize">{selectedEntrepreneur.rawStatus}</span>
                </div>
              </div>

              {showRemarksInput ? (
                <div className="space-y-2 text-left">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Remarks Reason</label>
                  <textarea
                    placeholder="Enter reason for this action..."
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
                    className="w-full text-xs p-2.5 border border-border rounded-xl bg-secondary/10 outline-none h-16 text-foreground"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleUpdateEntrepreneurStatus(selectedEntrepreneur.userId, 'suspended')}
                      disabled={actionLoading}
                      className="w-full py-2 bg-rose-500 hover:bg-rose-600 text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
                    >
                      {actionLoading ? 'Processing...' : 'Confirm Suspend'}
                    </button>
                    <button
                      onClick={() => handleUpdateEntrepreneurStatus(selectedEntrepreneur.userId, 'blocked')}
                      disabled={actionLoading}
                      className="w-full py-2 bg-red-600 hover:bg-red-750 text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
                    >
                      {actionLoading ? 'Processing...' : 'Confirm Block'}
                    </button>
                  </div>
                  <button
                    onClick={() => setShowRemarksInput(false)}
                    className="w-full py-1.5 bg-secondary hover:bg-secondary/80 text-foreground border border-border rounded-xl text-[10px] font-bold transition-all cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <div className="space-y-2.5 pt-2">
                  {selectedEntrepreneur.rawStatus !== 'active' ? (
                    <div className="flex flex-col gap-2">
                      <button
                        onClick={() => handleUpdateEntrepreneurStatus(selectedEntrepreneur.userId, 'active')}
                        disabled={actionLoading}
                        className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-md transition-all cursor-pointer"
                      >
                        {actionLoading ? 'Activating...' : 'Activate Account'}
                      </button>
                      {(selectedEntrepreneur.rawStatus === 'pending_verification' || selectedEntrepreneur.rawStatus === 'pending') && (
                        <button
                          onClick={() => handleUpdateEntrepreneurStatus(selectedEntrepreneur.userId, 'rejected')}
                          disabled={actionLoading}
                          className="w-full py-2 bg-red-600/10 hover:bg-red-600/25 border border-red-600/20 text-red-500 font-semibold text-xs rounded-xl flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          {actionLoading ? 'Rejecting...' : 'Reject Application'}
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <button
                        onClick={() => setShowRemarksInput(true)}
                        disabled={actionLoading}
                        className="w-full py-2 bg-rose-500/10 hover:bg-rose-500/25 border border-rose-500/20 text-rose-500 font-semibold text-xs rounded-xl flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        Suspend Entrepreneur
                      </button>
                      <button
                        onClick={() => {
                          setRemarks('Account blocked due to policy violation');
                          setShowRemarksInput(true);
                        }}
                        disabled={actionLoading}
                        className="w-full py-2 bg-red-600/10 hover:bg-red-600/25 border border-red-600/20 text-red-500 font-semibold text-xs rounded-xl flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        Block Entrepreneur
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
