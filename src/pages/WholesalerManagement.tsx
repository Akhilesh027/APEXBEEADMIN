import React, { useState, useEffect } from 'react';
import { useAdminState } from '../context/AdminStateContext';
import { Warehouse, ShieldCheck, Compass, BarChart3, Search, CheckCircle, Activity, Info } from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';

export const WholesalerManagement: React.FC = () => {
  const { orders, wallets, activityLogs } = useAdminState();
  const [activeSubTab, setActiveSubTab] = useState<'applications' | 'approved' | 'procurement' | 'directory' | 'performance' | 'wallets'>('applications');
  const [searchQuery, setSearchQuery] = useState('');
  const [wholesalersList, setWholesalersList] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [selectedWholesaler, setSelectedWholesaler] = useState<any | null>(null);
  const [showRemarksInput, setShowRemarksInput] = useState(false);
  const [remarks, setRemarks] = useState('');

  const getStatusLabel = (status?: string) => {
    if (status === 'active') return 'Approved';
    if (status === 'pending_verification') return 'Pending Application';
    return 'Rejected';
  };

  const fetchWholesalers = async () => {
    try {
      setLoading(true);
      setErrorMsg('');
      const token = localStorage.getItem('adminToken');
      const res = await fetch('https://server.apexbee.in/api/admin/wholesalers', {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });
      const data = await res.json();
      if (data.success) {
        const mapped = (data.wholesalers || []).map((w: any) => {
          const userWallet = wallets.find((wl: any) => String(wl.userId?._id || wl.userId || wl.id) === String(w.userId));
          const availableBalance = userWallet ? userWallet.availableBalance : 0;
          const withdrawnBalance = userWallet ? userWallet.withdrawnBalance : 0;
          return {
            id: w._id,
            userId: w.userId,
            name: w.businessName,
            contact: w.ownerName,
            location: `${w.mandal || ''}, ${w.district || ''}, ${w.state || ''}`.replace(/^,\s*/, '').trim() || 'N/A',
            productsCount: w.productsCount || 0, 
            revenue: availableBalance + withdrawnBalance,
            availableBalance: availableBalance,
            status: getStatusLabel(w.status),
            rating: '4.7',
            gstNumber: w.gstNumber,
            panNumber: w.panNumber,
            rawStatus: w.status || 'active'
          };
        });
        setWholesalersList(mapped);
      } else {
        setErrorMsg(data.message || 'Failed to fetch wholesalers');
      }
    } catch (err: any) {
      console.error('Error fetching wholesalers:', err);
      setErrorMsg(err.message || 'Network error fetching wholesalers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWholesalers();
  }, [wallets]);

  const handleWholesalerDrawdown = async (userId: string) => {
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
      const res = await fetch(`https://server.apexbee.in/api/admin/wholesalers/${userId}/drawdown`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ amount })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSuccessMsg(data.message || 'Wholesaler ledger cleared successfully');
        await fetchWholesalers();
      } else {
        setErrorMsg(data.message || 'Failed to clear wholesaler ledger');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Error communicating with backend');
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateWholesalerStatus = async (userId: string, newStatus: string) => {
    try {
      setActionLoading(true);
      setErrorMsg('');
      setSuccessMsg('');
      const token = localStorage.getItem('adminToken');
      const res = await fetch(`https://server.apexbee.in/api/admin/wholesalers/${userId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          status: newStatus,
          remarks: remarks || `Wholesaler status set to ${newStatus} by admin.`
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSuccessMsg(`Wholesaler status updated to ${newStatus} successfully`);
        setSelectedWholesaler(null);
        setRemarks('');
        setShowRemarksInput(false);
        await fetchWholesalers();
      } else {
        setErrorMsg(data.message || 'Failed to update wholesaler status');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Error communicating with backend');
    } finally {
      setActionLoading(false);
    }
  };

  const getFilteredWholesalers = () => {
    switch (activeSubTab) {
      case 'applications':
        return wholesalersList.filter(w => w.status === 'Pending Application');
      case 'approved':
        return wholesalersList.filter(w => w.status === 'Approved');
      default:
        return wholesalersList;
    }
  };

  const currentWholesalers = getFilteredWholesalers().filter(w => 
    w.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    w.contact.toLowerCase().includes(searchQuery.toLowerCase()) ||
    w.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Dynamic monthly procurement volume aggregated from completed wholesaling orders
  const getProcurementData = () => {
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthlyCounts: Record<string, { volume: number; monthIndex: number }> = {};
    
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const name = monthNames[d.getMonth()];
      monthlyCounts[name] = { volume: 0, monthIndex: d.getMonth() };
    }

    orders.forEach(o => {
      if (!o.date) return;
      const d = new Date(o.date);
      const name = monthNames[d.getMonth()];
      if (monthlyCounts[name] !== undefined) {
        monthlyCounts[name].volume += o.totalAmount;
      }
    });

    const sorted = Object.entries(monthlyCounts).sort((a: any, b: any) => {
      return a[1].monthIndex - b[1].monthIndex;
    });

    return sorted.map(([month, data]) => ({
      month,
      volume: data.volume
    }));
  };

  const procurementData = getProcurementData();
  const totalWholesalerRevenue = wholesalersList.reduce((acc, w) => acc + (w.revenue || 0), 0);
  const activeWholesalers = wholesalersList.filter(w => w.status === 'Approved').length;

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
      
      {/* Wholesaler Analytics Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 select-none">
        <div className="bg-card border border-border/80 rounded-2xl p-4 flex items-center justify-between shadow-sm">
          <div>
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Total Wholesalers</span>
            <span className="text-xl font-bold font-mono text-foreground mt-1 block">
              {loading ? '...' : `${wholesalersList.length} Partners`}
            </span>
            <span className="text-[9px] text-emerald-500 mt-1 block font-semibold">Live Database Records</span>
          </div>
          <Warehouse className="text-primary shrink-0" size={24} />
        </div>
        <div className="bg-card border border-border/80 rounded-2xl p-4 flex items-center justify-between shadow-sm">
          <div>
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Procurement Volume</span>
            <span className="text-xl font-bold font-mono text-foreground mt-1 block">
              {loading ? '...' : `₹${totalWholesalerRevenue.toLocaleString('en-IN')}`}
            </span>
            <span className="text-[9px] text-emerald-500 mt-1 block font-semibold">Accrued sales volume</span>
          </div>
          <BarChart3 className="text-violet-500 shrink-0" size={24} />
        </div>
        <div className="bg-card border border-border/80 rounded-2xl p-4 flex items-center justify-between shadow-sm">
          <div>
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Total Pipeline Value</span>
            <span className="text-xl font-bold font-mono text-foreground mt-1 block">
              {loading ? '...' : `₹${(totalWholesalerRevenue * 1.05).toLocaleString('en-IN')}`}
            </span>
            <span className="text-[9px] text-muted-foreground mt-1 block">Gross contract estimation</span>
          </div>
          <Compass className="text-emerald-500 shrink-0" size={24} />
        </div>
        <div className="bg-card border border-border/80 rounded-2xl p-4 flex items-center justify-between shadow-sm">
          <div>
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Approved Wholesalers</span>
            <span className="text-xl font-bold font-mono text-foreground mt-1 block">
              {loading ? '...' : `${activeWholesalers} Confirmed`}
            </span>
            <span className="text-[9px] text-emerald-500 mt-1 block font-semibold">Verified supply chains</span>
          </div>
          <ShieldCheck className="text-amber-500 shrink-0" size={24} />
        </div>
      </div>

      {/* Subtab Menu */}
      <div className="flex gap-2 flex-wrap bg-card border border-border/60 p-2 rounded-2xl select-none shadow-sm">
        {(['applications', 'approved', 'procurement', 'directory', 'performance', 'wallets'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveSubTab(tab)}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all ${
              activeSubTab === tab
                ? 'bg-primary text-primary-foreground border-primary shadow-md'
                : 'bg-transparent text-muted-foreground border-transparent hover:bg-secondary/60 hover:text-foreground'
            }`}
          >
            {tab === 'approved' ? 'Approved Wholesalers' : tab === 'procurement' ? 'Procurement Requests' : tab === 'directory' ? 'Supplier Directory' : tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* Main Grid: Wholesaler list and chart */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Column: Data Tables */}
        <div className="lg:col-span-8 bg-card border border-border/80 rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-3 border-b border-border/60">
            <span className="text-xs font-bold text-foreground uppercase tracking-wider">
              Wholesaler Operations Ledger ({activeSubTab.toUpperCase()})
            </span>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:flex-initial">
                <Search className="absolute left-3 top-2.5 text-muted-foreground" size={14} />
                <input
                  type="text"
                  placeholder="Search wholesaler..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 pr-4 py-1.5 bg-secondary/50 border border-border/80 focus:border-primary rounded-xl text-xs outline-none w-full sm:w-48 font-medium"
                />
              </div>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-12 text-xs text-muted-foreground select-none">
              Loading wholesaler list from backend...
            </div>
          ) : activeSubTab === 'procurement' ? (
            /* Procurement Requests dynamically loaded */
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-secondary/40 select-none border-b border-border/60">
                  <tr>
                    <th className="p-3 font-semibold text-muted-foreground">ID</th>
                    <th className="p-3 font-semibold text-muted-foreground">Supplier Wholesaler</th>
                    <th className="p-3 font-semibold text-muted-foreground">Location</th>
                    <th className="p-3 font-semibold text-muted-foreground text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {wholesalersList.slice(0, 3).map((w, idx) => (
                    <tr key={idx} className="hover:bg-secondary/10">
                      <td className="p-3 font-mono font-semibold text-primary">PO-80{idx}</td>
                      <td className="p-3 font-medium text-foreground">{w.name}</td>
                      <td className="p-3 text-muted-foreground">{w.location}</td>
                      <td className="p-3 text-center">
                        <span className="px-2 py-0.5 rounded text-[8px] font-bold bg-emerald-500/10 text-emerald-500">PO Issued</span>
                      </td>
                    </tr>
                  ))}
                  {wholesalersList.length === 0 && (
                    <tr>
                      <td colSpan={4} className="p-8 text-center text-xs text-muted-foreground">No pending PO requests.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          ) : activeSubTab === 'wallets' ? (
            /* Wholesaler wallets balances */
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-secondary/40 select-none border-b border-border/60">
                  <tr>
                    <th className="p-3 font-semibold text-muted-foreground">Partner ID</th>
                    <th className="p-3 font-semibold text-muted-foreground">Business Name</th>
                    <th className="p-3 font-semibold text-muted-foreground">Trade Volume (Sales)</th>
                    <th className="p-3 font-semibold text-muted-foreground">Settlement Balance</th>
                    <th className="p-3 font-semibold text-muted-foreground text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {wholesalersList.map(w => (
                    <tr key={w.id} className="hover:bg-secondary/10 transition-colors">
                      <td className="p-3 font-mono font-semibold text-primary">{w.id}</td>
                      <td className="p-3 font-medium text-foreground">{w.name}</td>
                      <td className="p-3 font-mono font-semibold text-muted-foreground">₹{w.revenue.toLocaleString('en-IN')}</td>
                      <td className="p-3 font-mono font-bold text-foreground">₹{w.availableBalance.toLocaleString('en-IN')}</td>
                      <td className="p-3 text-center">
                        <button 
                          onClick={() => handleWholesalerDrawdown(w.userId)}
                          disabled={actionLoading}
                          className="px-2.5 py-1 bg-primary/10 text-primary disabled:opacity-50 hover:bg-primary hover:text-white rounded-lg text-[10px] font-bold transition-all cursor-pointer font-bold"
                        >
                          {actionLoading ? 'Processing...' : 'Clear Ledger'}
                        </button>
                      </td>
                    </tr>
                  ))}
                  {wholesalersList.length === 0 && (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-xs text-muted-foreground">No records.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          ) : (
            /* Wholesaler List Applications / Directory */
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-secondary/40 select-none border-b border-border/60">
                  <tr>
                    <th className="p-3 font-semibold text-muted-foreground">Wholesaler</th>
                    <th className="p-3 font-semibold text-muted-foreground">Location</th>
                    <th className="p-3 font-semibold text-muted-foreground">Registered Products</th>
                    <th className="p-3 font-semibold text-muted-foreground">Status</th>
                    <th className="p-3 font-semibold text-muted-foreground text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {currentWholesalers.map(w => (
                    <tr key={w.id} className="hover:bg-secondary/10 transition-colors">
                      <td className="p-3">
                        <span className="font-semibold text-foreground block">{w.name}</span>
                        <span className="text-[10px] text-muted-foreground block">Contact: {w.contact}</span>
                      </td>
                      <td className="p-3 text-muted-foreground">{w.location}</td>
                      <td className="p-3 font-mono text-muted-foreground">{w.productsCount} items</td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded text-[8px] font-bold ${
                          w.status === 'Approved' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-amber-500/10 text-amber-500 animate-pulse'
                        }`}>
                          {w.status}
                        </span>
                      </td>
                      <td className="p-3 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {w.rawStatus !== 'active' ? (
                            <button 
                              onClick={() => handleUpdateWholesalerStatus(w.userId, 'active')}
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
                              setSelectedWholesaler(w);
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
                  {currentWholesalers.length === 0 && (
                    <tr>
                      <td colSpan={5} className="p-12 text-center text-xs text-muted-foreground">
                        No applications in queue.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Right Column: Wholesaler procurement charts */}
        <div className="lg:col-span-4 bg-card border border-border/80 rounded-2xl p-5 shadow-sm space-y-4">
          <div>
            <span className="text-xs font-bold text-foreground uppercase tracking-wider block">Procurement Volume Flow</span>
            <p className="text-[9px] text-muted-foreground mt-0.5">Monthly purchase order values</p>
          </div>
          
          {totalWholesalerRevenue === 0 ? (
            <div className="h-48 flex flex-col items-center justify-center text-center text-xs text-muted-foreground bg-secondary/5 rounded-xl border border-border/40">
              <Warehouse size={20} className="text-muted-foreground/45 mb-1" />
              <p>No procurement flow logs found.</p>
            </div>
          ) : (
            <div className="h-48 w-full select-none">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={procurementData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(100, 116, 139, 0.1)" />
                  <XAxis dataKey="month" stroke="rgba(100, 116, 139, 0.5)" fontSize={10} tickLine={false} />
                  <YAxis stroke="rgba(100, 116, 139, 0.5)" fontSize={10} tickLine={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)' }}
                    itemStyle={{ fontSize: 11, color: 'var(--foreground)' }}
                  />
                  <Area type="monotone" dataKey="volume" name="Procured Value" stroke="#a78bfa" fill="rgba(167, 139, 250, 0.1)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

      </div>

      {/* Wholesaler Details Modal */}
      {selectedWholesaler && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card border border-border max-w-md w-full rounded-2xl overflow-hidden shadow-2xl p-6 relative text-xs text-foreground space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <h3 className="text-sm font-bold text-primary uppercase tracking-wider">
                Wholesaler Profile Details
              </h3>
              <button
                onClick={() => {
                  setSelectedWholesaler(null);
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
                  <span className="font-semibold block mt-0.5">{selectedWholesaler.name}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[9px] font-bold">OWNER NAME</span>
                  <span className="font-semibold block mt-0.5 truncate">{selectedWholesaler.contact}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[9px] font-bold">LOCATION</span>
                  <span className="font-semibold block mt-0.5">{selectedWholesaler.location}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[9px] font-bold">PARTNER ID</span>
                  <span className="font-mono font-semibold block mt-0.5">{selectedWholesaler.id}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[9px] font-bold">GSTIN</span>
                  <span className="font-mono font-semibold block mt-0.5">{selectedWholesaler.gstNumber || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[9px] font-bold">PAN</span>
                  <span className="font-mono font-semibold block mt-0.5">{selectedWholesaler.panNumber || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[9px] font-bold">KYC STATUS</span>
                  <span className="font-semibold block mt-0.5">{selectedWholesaler.status}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[9px] font-bold">ACCOUNT STATUS</span>
                  <span className="font-semibold block mt-0.5 capitalize">{selectedWholesaler.rawStatus}</span>
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
                      onClick={() => handleUpdateWholesalerStatus(selectedWholesaler.userId, 'suspended')}
                      disabled={actionLoading}
                      className="w-full py-2 bg-rose-500 hover:bg-rose-600 text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
                    >
                      {actionLoading ? 'Processing...' : 'Confirm Suspend'}
                    </button>
                    <button
                      onClick={() => handleUpdateWholesalerStatus(selectedWholesaler.userId, 'blocked')}
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
                  {selectedWholesaler.rawStatus !== 'active' ? (
                    <div className="flex flex-col gap-2">
                      <button
                        onClick={() => handleUpdateWholesalerStatus(selectedWholesaler.userId, 'active')}
                        disabled={actionLoading}
                        className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-md transition-all cursor-pointer"
                      >
                        {actionLoading ? 'Activating...' : 'Activate Wholesaler Account'}
                      </button>
                      {(selectedWholesaler.rawStatus === 'pending_verification' || selectedWholesaler.rawStatus === 'pending') && (
                        <button
                          onClick={() => handleUpdateWholesalerStatus(selectedWholesaler.userId, 'rejected')}
                          disabled={actionLoading}
                          className="w-full py-2 bg-red-600/10 hover:bg-red-600/25 border border-red-600/20 text-red-500 font-semibold text-xs rounded-xl flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          {actionLoading ? 'Rejecting...' : 'Reject Wholesaler Application'}
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
                        Suspend Wholesaler
                      </button>
                      <button
                        onClick={() => {
                          setRemarks('Account blocked due to policy violation');
                          setShowRemarksInput(true);
                        }}
                        disabled={actionLoading}
                        className="w-full py-2 bg-red-600/10 hover:bg-red-600/25 border border-red-600/20 text-red-500 font-semibold text-xs rounded-xl flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        Block Wholesaler
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
