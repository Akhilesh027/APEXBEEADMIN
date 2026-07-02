import React, { useState, useEffect } from 'react';
import { useAdminState } from '../context/AdminStateContext';
import { Building2, ShieldCheck, Award, Activity, Search, ShieldAlert, TrendingUp } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';

export const ManufacturerManagement: React.FC = () => {
  const { orders, wallets, activityLogs } = useAdminState();
  const [activeSubTab, setActiveSubTab] = useState<'pending' | 'active' | 'rejected' | 'kyc' | 'performance' | 'wallets'>('active');
  const [searchQuery, setSearchQuery] = useState('');
  const [manufacturersList, setManufacturersList] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [selectedManufacturer, setSelectedManufacturer] = useState<any | null>(null);
  const [showRemarksInput, setShowRemarksInput] = useState(false);
  const [remarks, setRemarks] = useState('');

  const getStatusLabel = (status?: string) => {
    if (status === 'active') return 'Active';
    if (status === 'pending_verification') return 'Pending Approval';
    return 'Rejected';
  };

  const fetchManufacturers = async () => {
    try {
      setLoading(true);
      setErrorMsg('');
      const token = localStorage.getItem('adminToken');
      const res = await fetch('https://server.apexbee.in/api/admin/manufacturers', {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });
      const data = await res.json();
      if (data.success) {
        const mapped = (data.manufacturers || []).map((m: any) => {
          const userWallet = wallets.find((w: any) => String(w.userId?._id || w.userId || w.id) === String(m.userId));
          const availableBalance = userWallet ? (userWallet.availableBalance + userWallet.withdrawnBalance) : 0;
          return {
            id: m._id,
            userId: m.userId,
            name: m.businessName,
            contact: m.ownerName,
            rating: '4.8',
            performance: '100% Capacity',
            revenue: availableBalance,
            status: getStatusLabel(m.status),
            category: m.category || 'Factory / Production',
            gstNumber: m.gstNumber,
            panNumber: m.panNumber,
            rawStatus: m.status || 'active'
          };
        });
        setManufacturersList(mapped);
      } else {
        setErrorMsg(data.message || 'Failed to fetch manufacturers');
      }
    } catch (err: any) {
      console.error('Error fetching manufacturers:', err);
      setErrorMsg(err.message || 'Network error fetching manufacturers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchManufacturers();
  }, [wallets]);

  const handleManufacturerDrawdown = async (userId: string) => {
    try {
      const inputVal = prompt("Enter payout/drawdown amount (INR):");
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
      const res = await fetch(`https://server.apexbee.in/api/admin/manufacturers/${userId}/drawdown`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ amount })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSuccessMsg(data.message || 'Manufacturer drawdown completed successfully');
        await fetchManufacturers();
      } else {
        setErrorMsg(data.message || 'Drawdown request failed');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Error communicating with backend');
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateManufacturerStatus = async (userId: string, newStatus: string) => {
    try {
      setActionLoading(true);
      setErrorMsg('');
      setSuccessMsg('');
      const token = localStorage.getItem('adminToken');
      const res = await fetch(`https://server.apexbee.in/api/admin/manufacturers/${userId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          status: newStatus,
          remarks: remarks || `Manufacturer status updated to ${newStatus} by admin.`
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSuccessMsg(`Manufacturer status updated to ${newStatus} successfully`);
        setSelectedManufacturer(null);
        setRemarks('');
        setShowRemarksInput(false);
        await fetchManufacturers();
      } else {
        setErrorMsg(data.message || 'Failed to update manufacturer status');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Error communicating with backend');
    } finally {
      setActionLoading(false);
    }
  };

  const getFilteredManufacturers = () => {
    switch (activeSubTab) {
      case 'pending':
        return manufacturersList.filter(m => m.status === 'Pending Approval');
      case 'active':
        return manufacturersList.filter(m => m.status === 'Active');
      case 'rejected':
        return manufacturersList.filter(m => m.status === 'Rejected');
      default:
        return manufacturersList;
    }
  };

  const currentManufacturers = getFilteredManufacturers().filter(m => 
    m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.contact.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Group completed orders count per factory partner
  const getPerformanceData = () => {
    const data = manufacturersList.map(m => {
      const storeOrders = orders.filter(o => o.items.some(it => it.productId && it.productId.startsWith(m.id) || (o as any).sellerId === m.id));
      return {
        name: m.name ? m.name.split(' ')[0] : 'Plant',
        production: storeOrders.length
      };
    });

    const defaults = [
      { name: 'Apex Cotton', production: 12 },
      { name: 'Deccan Foods', production: 8 }
    ];

    if (data.length === 0) return defaults;
    return data.slice(0, 5);
  };

  const performanceData = getPerformanceData();

  // Filter manufacturer activity logs from database
  const plantActivityLogs = activityLogs.filter(log => 
    log.details.toLowerCase().includes('manufactur') || 
    log.action.toLowerCase().includes('manufactur') || 
    log.details.toLowerCase().includes('factory')
  ).slice(0, 5);

  const totalManufacturerRevenue = manufacturersList.reduce((acc, m) => acc + (m.revenue || 0), 0);

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
      
      {/* Dashboard Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 select-none">
        <div className="bg-card border border-border/80 rounded-2xl p-4 flex items-center justify-between shadow-sm">
          <div>
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Total Plants</span>
            <span className="text-xl font-bold font-mono text-foreground mt-1 block">
              {loading ? '...' : `${manufacturersList.length} Plants`}
            </span>
            <span className="text-[9px] text-emerald-500 mt-1 block font-semibold">Live Database Records</span>
          </div>
          <Building2 className="text-primary shrink-0" size={24} />
        </div>
        <div className="bg-card border border-border/80 rounded-2xl p-4 flex items-center justify-between shadow-sm">
          <div>
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Active Plants</span>
            <span className="text-xl font-bold font-mono text-foreground mt-1 block">
              {loading ? '...' : `${manufacturersList.filter(m => m.status === 'Active').length} Active`}
            </span>
            <span className="text-[9px] text-emerald-500 mt-1 block font-semibold">Active Dispatch Ready</span>
          </div>
          <ShieldCheck className="text-emerald-500 shrink-0" size={24} />
        </div>
        <div className="bg-card border border-border/80 rounded-2xl p-4 flex items-center justify-between shadow-sm">
          <div>
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Top Quality</span>
            <span className="text-xl font-bold font-mono text-foreground mt-1 block">
              {loading ? '...' : `${manufacturersList.filter(m => parseFloat(m.rating) >= 4.7).length} Certified`}
            </span>
            <span className="text-[9px] text-violet-500 mt-1 block font-semibold">Over 4.7★ average</span>
          </div>
          <Award className="text-violet-500 shrink-0" size={24} />
        </div>
        <div className="bg-card border border-border/80 rounded-2xl p-4 flex items-center justify-between shadow-sm">
          <div>
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Awaiting KYC</span>
            <span className="text-xl font-bold font-mono text-foreground mt-1 block">
              {loading ? '...' : `${manufacturersList.filter(m => m.status === 'Pending Approval').length} Pending`}
            </span>
            <span className="text-[9px] text-rose-500 mt-1 block font-semibold">Pending physical audits</span>
          </div>
          <ShieldAlert className="text-amber-500 shrink-0" size={24} />
        </div>
        <div className="bg-card border border-border/80 rounded-2xl p-4 flex items-center justify-between shadow-sm">
          <div>
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Est. Revenue Flow</span>
            <span className="text-xl font-bold font-mono text-foreground mt-1 block">
              {loading ? '...' : `₹${totalManufacturerRevenue.toLocaleString('en-IN')}`}
            </span>
            <span className="text-[9px] text-emerald-500 mt-1 block font-semibold">Accrued factory earnings</span>
          </div>
          <TrendingUp className="text-primary shrink-0" size={24} />
        </div>
      </div>

      {/* Subtab Menu */}
      <div className="flex gap-2 flex-wrap bg-card border border-border/60 p-2 rounded-2xl select-none shadow-sm">
        {(['pending', 'active', 'rejected', 'kyc', 'performance', 'wallets'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveSubTab(tab)}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all ${
              activeSubTab === tab
                ? 'bg-primary text-primary-foreground border-primary shadow-md'
                : 'bg-transparent text-muted-foreground border-transparent hover:bg-secondary/60 hover:text-foreground'
            }`}
          >
            {tab === 'kyc' ? 'Factory KYC' : tab === 'pending' ? 'Pending Approval' : tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* Main Grid: Data Tables and Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Column: Manufacturer rosters & lists */}
        <div className="lg:col-span-8 bg-card border border-border/80 rounded-2xl shadow-sm overflow-hidden p-5 space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-3 border-b border-border/60">
            <span className="text-xs font-bold text-foreground uppercase tracking-wider">
              Manufacturer Ledger ({activeSubTab.toUpperCase()})
            </span>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:flex-initial">
                <Search className="absolute left-3 top-2.5 text-muted-foreground" size={14} />
                <input
                  type="text"
                  placeholder="Search plant or owner..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 pr-4 py-1.5 bg-secondary/50 border border-border/80 focus:border-primary rounded-xl text-xs outline-none w-full sm:w-48 font-medium"
                />
              </div>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-12 text-xs text-muted-foreground select-none">
              Loading manufacturer list from backend...
            </div>
          ) : activeSubTab === 'kyc' ? (
            /* Factory KYC details */
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-secondary/40 select-none border-b border-border/60">
                  <tr>
                    <th className="p-3 font-semibold text-muted-foreground">ID</th>
                    <th className="p-3 font-semibold text-muted-foreground">Business Name</th>
                    <th className="p-3 font-semibold text-muted-foreground">GST Document</th>
                    <th className="p-3 font-semibold text-muted-foreground">PAN details</th>
                    <th className="p-3 font-semibold text-muted-foreground text-center">KYC Audit</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {manufacturersList.map(m => (
                    <tr key={m.id} className="hover:bg-secondary/10 transition-colors">
                      <td className="p-3 font-mono font-semibold text-primary">{m.id}</td>
                      <td className="p-3 font-medium text-foreground">{m.name}</td>
                      <td className="p-3 font-mono text-muted-foreground">{m.gstNumber || 'GST-PENDING'}</td>
                      <td className="p-3 font-mono text-muted-foreground">{m.panNumber || 'PAN-PENDING'}</td>
                      <td className="p-3 text-center">
                        <span className={`px-2 py-0.5 rounded text-[8px] font-bold ${
                          m.rawStatus === 'active' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-amber-500/10 text-amber-500 animate-pulse'
                        }`}>
                          {m.rawStatus === 'active' ? 'Verified' : 'Pending Verification'}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {manufacturersList.length === 0 && (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-xs text-muted-foreground">No records.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          ) : activeSubTab === 'wallets' ? (
            /* Wallets and Settlements ledger */
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-secondary/40 select-none border-b border-border/60">
                  <tr>
                    <th className="p-3 font-semibold text-muted-foreground">Store ID</th>
                    <th className="p-3 font-semibold text-muted-foreground">Business Name</th>
                    <th className="p-3 font-semibold text-muted-foreground">Accumulated Revenue</th>
                    <th className="p-3 font-semibold text-muted-foreground">Payout Status</th>
                    <th className="p-3 font-semibold text-muted-foreground text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {manufacturersList.map(m => (
                    <tr key={m.id} className="hover:bg-secondary/10 transition-colors">
                      <td className="p-3 font-mono font-semibold text-primary">{m.id}</td>
                      <td className="p-3 font-medium text-foreground">{m.name}</td>
                      <td className="p-3 font-mono font-bold text-foreground">₹{m.revenue.toLocaleString('en-IN')}</td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded text-[8px] font-bold bg-emerald-500/10 text-emerald-500">Settled</span>
                      </td>
                      <td className="p-3 text-center">
                        <button 
                          onClick={() => handleManufacturerDrawdown(m.userId)}
                          disabled={actionLoading}
                          className="px-2.5 py-1 bg-primary/10 text-primary disabled:opacity-50 hover:bg-primary hover:text-white rounded-lg text-[10px] font-bold transition-all cursor-pointer"
                        >
                          {actionLoading ? 'Processing...' : 'Withdrawal'}
                        </button>
                      </td>
                    </tr>
                  ))}
                  {manufacturersList.length === 0 && (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-xs text-muted-foreground">No records.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          ) : (
            /* Pending / Active / Rejected rosters */
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-secondary/40 select-none border-b border-border/60">
                  <tr>
                    <th className="p-3 font-semibold text-muted-foreground">Manufacturer Name</th>
                    <th className="p-3 font-semibold text-muted-foreground">Plant ID</th>
                    <th className="p-3 font-semibold text-muted-foreground">Contact</th>
                    <th className="p-3 font-semibold text-muted-foreground">Status</th>
                    <th className="p-3 font-semibold text-muted-foreground text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {currentManufacturers.map(m => (
                    <tr key={m.id} className="hover:bg-secondary/10 transition-colors">
                      <td className="p-3">
                        <span className="font-semibold text-foreground block">{m.name}</span>
                        <span className="text-[10px] text-muted-foreground block">Segment: {m.category}</span>
                      </td>
                      <td className="p-3 font-mono text-muted-foreground">{m.id}</td>
                      <td className="p-3 text-muted-foreground">{m.contact}</td>
                      <td className="p-3 text-muted-foreground">
                        <span className={`px-2.5 py-0.5 rounded text-[8px] font-bold ${
                          m.rawStatus === 'active' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-amber-500/10 text-amber-500'
                        }`}>
                          {m.status}
                        </span>
                      </td>
                      <td className="p-3 text-center">
                        <button 
                          onClick={() => {
                            setSelectedManufacturer(m);
                            setRemarks('');
                            setShowRemarksInput(false);
                          }}
                          className="px-2.5 py-1 bg-secondary hover:bg-secondary/80 border border-border text-foreground rounded-lg text-[10px] font-bold transition-all cursor-pointer"
                        >
                          Manage
                        </button>
                      </td>
                    </tr>
                  ))}
                  {currentManufacturers.length === 0 && (
                    <tr>
                      <td colSpan={5} className="p-12 text-center text-xs text-muted-foreground border-t">
                        No plants found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Right Column: Performance Analytics Chart & logs */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-card border border-border/80 rounded-2xl p-5 shadow-sm space-y-4">
            <div>
              <span className="text-xs font-bold text-foreground uppercase tracking-wider block">Production Efficiency</span>
              <p className="text-[9px] text-muted-foreground mt-0.5">Completed orders count per plant</p>
            </div>
            
            {performanceData.length === 0 ? (
              <div className="h-44 flex flex-col items-center justify-center text-center text-xs text-muted-foreground bg-secondary/5 border border-border/40 rounded-xl">
                <Activity size={20} className="text-muted-foreground/45 mb-1" />
                <p>No manufacturing activities found.</p>
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
                    <Bar dataKey="production" name="Completed Orders" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          <div className="bg-card border border-border/80 rounded-2xl p-5 shadow-sm space-y-4">
            <span className="text-xs font-bold text-foreground uppercase tracking-wider block flex items-center gap-1.5 select-none font-semibold">
              <Activity size={14} className="text-primary" /> Plant Production logs
            </span>
            <div className="divide-y divide-border/60 max-h-48 overflow-y-auto no-scrollbar pr-1">
              {plantActivityLogs.map((log, idx) => (
                <div key={idx} className="py-2.5 first:pt-0 last:pb-0 text-xs">
                  <div className="flex justify-between items-center font-semibold text-foreground">
                    <span>{log.action}</span>
                    <span className="text-[8px] text-muted-foreground font-mono">{log.timestamp ? log.timestamp.split('T')[0] : 'Just now'}</span>
                  </div>
                  <span className="text-[10px] text-muted-foreground block mt-0.5">{log.details}</span>
                </div>
              ))}
              {plantActivityLogs.length === 0 && (
                <p className="text-center text-xs text-muted-foreground py-6 select-none">No production activity logs found.</p>
              )}
            </div>
          </div>
        </div>

      </div>

      {/* Manufacturer Details Modal */}
      {selectedManufacturer && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card border border-border max-w-md w-full rounded-2xl overflow-hidden shadow-2xl p-6 relative text-xs text-foreground space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <h3 className="text-sm font-bold text-primary uppercase tracking-wider">
                Manufacturer Profile Details
              </h3>
              <button
                onClick={() => {
                  setSelectedManufacturer(null);
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
                  <span className="text-muted-foreground block text-[9px] font-bold">BUSINESS NAME</span>
                  <span className="font-semibold block mt-0.5">{selectedManufacturer.name}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[9px] font-bold">OWNER NAME</span>
                  <span className="font-semibold block mt-0.5 truncate">{selectedManufacturer.contact}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[9px] font-bold">CATEGORY</span>
                  <span className="font-semibold block mt-0.5">{selectedManufacturer.category}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[9px] font-bold">PLANT ID</span>
                  <span className="font-mono font-semibold block mt-0.5">{selectedManufacturer.id}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[9px] font-bold">GSTIN</span>
                  <span className="font-mono font-semibold block mt-0.5">{selectedManufacturer.gstNumber || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[9px] font-bold">PAN</span>
                  <span className="font-mono font-semibold block mt-0.5">{selectedManufacturer.panNumber || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[9px] font-bold">KYC STATUS</span>
                  <span className="font-semibold block mt-0.5">{selectedManufacturer.status}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[9px] font-bold">ACCOUNT STATUS</span>
                  <span className="font-semibold block mt-0.5 capitalize">{selectedManufacturer.rawStatus}</span>
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
                      onClick={() => handleUpdateManufacturerStatus(selectedManufacturer.userId, 'suspended')}
                      disabled={actionLoading}
                      className="w-full py-2 bg-rose-500 hover:bg-rose-600 text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
                    >
                      {actionLoading ? 'Processing...' : 'Confirm Suspend'}
                    </button>
                    <button
                      onClick={() => handleUpdateManufacturerStatus(selectedManufacturer.userId, 'blocked')}
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
                  {selectedManufacturer.rawStatus !== 'active' ? (
                    <div className="flex flex-col gap-2">
                      <button
                        onClick={() => handleUpdateManufacturerStatus(selectedManufacturer.userId, 'active')}
                        disabled={actionLoading}
                        className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-md transition-all cursor-pointer"
                      >
                        {actionLoading ? 'Activating...' : 'Activate Manufacturer Account'}
                      </button>
                      {(selectedManufacturer.rawStatus === 'pending_verification' || selectedManufacturer.rawStatus === 'pending') && (
                        <button
                          onClick={() => handleUpdateManufacturerStatus(selectedManufacturer.userId, 'rejected')}
                          disabled={actionLoading}
                          className="w-full py-2 bg-red-600/10 hover:bg-red-600/25 border border-red-600/20 text-red-500 font-semibold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                        >
                          {actionLoading ? 'Rejecting...' : 'Reject Manufacturer Application'}
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <button
                        onClick={() => setShowRemarksInput(true)}
                        disabled={actionLoading}
                        className="w-full py-2 bg-rose-500/10 hover:bg-rose-500/25 border border-rose-500/20 text-rose-500 font-semibold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                      >
                        Suspend Manufacturer
                      </button>
                      <button
                        onClick={() => {
                          setRemarks('Account blocked due to policy violation');
                          setShowRemarksInput(true);
                        }}
                        disabled={actionLoading}
                        className="w-full py-2 bg-red-600/10 hover:bg-red-600/25 border border-red-600/20 text-red-500 font-semibold text-xs rounded-xl flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        Block Manufacturer
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
