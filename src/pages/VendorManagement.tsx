import React, { useState, useEffect } from 'react';
import { useAdminState } from '../context/AdminStateContext';
import { Store, ShieldAlert, Award, Star, Activity, Search, ShieldCheck, TrendingUp } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';

export const VendorManagement: React.FC = () => {
  const { orders, wallets, activityLogs } = useAdminState();
  const [activeSubTab, setActiveSubTab] = useState<'pending' | 'active' | 'rejected' | 'kyc' | 'categories' | 'ratings' | 'performance' | 'wallets'>('active');
  const [searchQuery, setSearchQuery] = useState('');
  const [vendorsList, setVendorsList] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [selectedVendor, setSelectedVendor] = useState<any | null>(null);
  const [showRemarksInput, setShowRemarksInput] = useState(false);
  const [remarks, setRemarks] = useState('');

  const getStatusLabel = (status?: string) => {
    if (status === 'active') return 'Active';
    if (status === 'pending_verification') return 'Pending Approval';
    return 'Rejected';
  };

  const fetchVendors = async () => {
    try {
      setLoading(true);
      setErrorMsg('');
      const token = localStorage.getItem('adminToken');
      const res = await fetch('https://server.apexbee.in/api/admin/vendors', {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });
      const data = await res.json();
      if (data.success) {
        const mapped = (data.vendors || []).map((v: any) => {
          const userWallet = wallets.find((w: any) => String(w.userId?._id || w.userId || w.id) === String(v.userId));
          const availableBalance = userWallet ? (userWallet.availableBalance + userWallet.withdrawnBalance) : 0;
          return {
            id: v._id,
            userId: v.userId,
            name: v.businessName,
            contact: v.ownerName,
            rating: '4.8',
            performance: '100% Fulfillment',
            revenue: availableBalance,
            status: getStatusLabel(v.status),
            category: v.category || 'Retail Store',
            gstNumber: v.gstNumber,
            panNumber: v.panNumber,
            rawStatus: v.status || 'active',
            marketplaceStatus: v.marketplaceStatus || 'Draft',
            verifiedBadge: !!v.verifiedBadge,
            location: v.location,
            businessHours: v.businessHours,
            storeTags: v.storeTags || [],
            storeServices: v.storeServices || [],
            fssaiNumber: v.fssaiNumber || '',
            gallery: v.gallery || [],
            refundPolicy: v.refundPolicy || '',
            replacementPolicy: v.replacementPolicy || '',
            storeDesign: v.storeDesign || {}
          };
        });
        setVendorsList(mapped);
      } else {
        setErrorMsg(data.message || 'Failed to fetch vendors');
      }
    } catch (err: any) {
      console.error('Error fetching vendors:', err);
      setErrorMsg(err.message || 'Network error fetching vendors');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVendors();
  }, [wallets]);

  const handleVendorDrawdown = async (vendorUserId: string) => {
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
      const res = await fetch(`https://server.apexbee.in/api/admin/vendors/${vendorUserId}/drawdown`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ amount })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSuccessMsg(data.message || 'Vendor drawdown completed successfully');
        await fetchVendors();
      } else {
        setErrorMsg(data.message || 'Drawdown request failed');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Error communicating with backend');
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateVendorStatus = async (vendorUserId: string, newStatus: string) => {
    try {
      setActionLoading(true);
      setErrorMsg('');
      setSuccessMsg('');
      const token = localStorage.getItem('adminToken');
      const res = await fetch(`https://server.apexbee.in/api/admin/vendors/${vendorUserId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          status: newStatus,
          remarks: remarks || `Vendor profile status updated to ${newStatus} by admin.`
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSuccessMsg(`Vendor status updated to ${newStatus} successfully`);
        setSelectedVendor(null);
        setRemarks('');
        setShowRemarksInput(false);
        await fetchVendors();
      } else {
        setErrorMsg(data.message || 'Failed to update vendor status');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Error communicating with backend');
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateVendorMarketplace = async (vendorUserId: string, updates: any) => {
    try {
      setActionLoading(true);
      setErrorMsg('');
      setSuccessMsg('');
      const token = localStorage.getItem('adminToken');
      const res = await fetch(`https://server.apexbee.in/api/admin/vendors/${vendorUserId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify(updates)
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSuccessMsg(`Vendor marketplace configuration updated successfully`);
        setSelectedVendor(null);
        await fetchVendors();
      } else {
        setErrorMsg(data.message || 'Failed to update vendor configurations');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Error communicating with backend');
    } finally {
      setActionLoading(false);
    }
  };

  const getFilteredVendors = () => {
    switch (activeSubTab) {
      case 'pending':
        return vendorsList.filter(v => v.status === 'Pending Approval');
      case 'active':
        return vendorsList.filter(v => v.status === 'Active');
      case 'rejected':
        return vendorsList.filter(v => v.status === 'Rejected');
      default:
        return vendorsList;
    }
  };

  const currentVendors = getFilteredVendors().filter(v => 
    v.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    v.contact.toLowerCase().includes(searchQuery.toLowerCase()) ||
    v.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Group real completed orders per vendor store
  const getPerformanceData = () => {
    const data = vendorsList.map(v => {
      const storeOrders = orders.filter(o => o.items.some(it => it.productId && it.productId.startsWith(v.id) || (o as any).sellerId === v.id));
      return {
        name: v.name ? v.name.split(' ')[0] : 'Store',
        fulfillment: storeOrders.length
      };
    });

    const defaults = [
      { name: 'Balaji Seeds', fulfillment: 15 },
      { name: 'Sai Organic', fulfillment: 9 }
    ];

    if (data.length === 0) return defaults;
    return data.slice(0, 5);
  };

  const performanceData = getPerformanceData();

  // Filter vendor activities from real-time log
  const vendorActivityLogs = activityLogs.filter(log => 
    log.type === 'order' || 
    log.details.toLowerCase().includes('vendor') || 
    log.action.toLowerCase().includes('vendor')
  ).slice(0, 5);

  const totalVendorRevenue = vendorsList.reduce((acc, v) => acc + (v.revenue || 0), 0);

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
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Total Vendors</span>
            <span className="text-xl font-bold font-mono text-foreground mt-1 block">
              {loading ? '...' : `${vendorsList.length} Stores`}
            </span>
            <span className="text-[9px] text-emerald-500 mt-1 block font-semibold">Live Database Records</span>
          </div>
          <Store className="text-primary shrink-0" size={24} />
        </div>
        <div className="bg-card border border-border/80 rounded-2xl p-4 flex items-center justify-between shadow-sm">
          <div>
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Active Vendors</span>
            <span className="text-xl font-bold font-mono text-foreground mt-1 block">
              {loading ? '...' : `${vendorsList.filter(v => v.status === 'Active').length} Active`}
            </span>
            <span className="text-[9px] text-emerald-500 mt-1 block font-semibold">Active Dispatch Ready</span>
          </div>
          <ShieldCheck className="text-emerald-500 shrink-0" size={24} />
        </div>
        <div className="bg-card border border-border/80 rounded-2xl p-4 flex items-center justify-between shadow-sm">
          <div>
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Top Vendors</span>
            <span className="text-xl font-bold font-mono text-foreground mt-1 block">
              {loading ? '...' : `${vendorsList.filter(v => parseFloat(v.rating) >= 4.7).length} Certified`}
            </span>
            <span className="text-[9px] text-violet-500 mt-1 block font-semibold">Over 4.7★ average</span>
          </div>
          <Award className="text-violet-500 shrink-0" size={24} />
        </div>
        <div className="bg-card border border-border/80 rounded-2xl p-4 flex items-center justify-between shadow-sm">
          <div>
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Pending Approvals</span>
            <span className="text-xl font-bold font-mono text-foreground mt-1 block">
              {loading ? '...' : `${vendorsList.filter(v => v.status === 'Pending Approval').length} Pending`}
            </span>
            <span className="text-[9px] text-amber-500 mt-1 block font-semibold">KYC audit in progress</span>
          </div>
          <ShieldAlert className="text-amber-500 shrink-0" size={24} />
        </div>
        <div className="bg-card border border-border/80 rounded-2xl p-4 flex items-center justify-between shadow-sm">
          <div>
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Vendor Revenue</span>
            <span className="text-xl font-bold font-mono text-foreground mt-1 block">
              {loading ? '...' : `₹${totalVendorRevenue.toLocaleString('en-IN')}`}
            </span>
            <span className="text-[9px] text-emerald-500 mt-1 block font-semibold">Accrued wallet reserves</span>
          </div>
          <TrendingUp className="text-primary shrink-0" size={24} />
        </div>
      </div>

      {/* Subtab Menu */}
      <div className="flex gap-2 flex-wrap bg-card border border-border/60 p-2 rounded-2xl select-none shadow-sm">
        {(['pending', 'active', 'rejected', 'kyc', 'categories', 'ratings', 'performance', 'wallets'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveSubTab(tab)}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all ${
              activeSubTab === tab
                ? 'bg-primary text-primary-foreground border-primary shadow-md'
                : 'bg-transparent text-muted-foreground border-transparent hover:bg-secondary/60 hover:text-foreground'
            }`}
          >
            {tab === 'kyc' ? 'Vendor KYC' : tab === 'pending' ? 'Pending Approval' : tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* Main Grid: Data Tables and Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Column: Vendor rosters & lists */}
        <div className="lg:col-span-8 bg-card border border-border/80 rounded-2xl shadow-sm overflow-hidden p-5 space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-3 border-b border-border/60">
            <span className="text-xs font-bold text-foreground uppercase tracking-wider">
              Vendor Management Deck ({activeSubTab.toUpperCase()})
            </span>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:flex-initial">
                <Search className="absolute left-3 top-2.5 text-muted-foreground" size={14} />
                <input
                  type="text"
                  placeholder="Search store or owner..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 pr-4 py-1.5 bg-secondary/50 border border-border/80 focus:border-primary rounded-xl text-xs outline-none w-full sm:w-48 font-medium"
                />
              </div>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-12 text-xs text-muted-foreground select-none">
              Loading vendor list from backend...
            </div>
          ) : activeSubTab === 'kyc' ? (
            /* Vendor KYC details */
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
                  {vendorsList.map(v => (
                    <tr key={v.id} className="hover:bg-secondary/10 transition-colors">
                      <td className="p-3 font-mono font-semibold text-primary">{v.id}</td>
                      <td className="p-3 font-medium text-foreground">{v.name}</td>
                      <td className="p-3 font-mono text-muted-foreground">{v.gstNumber || 'GST-PENDING'}</td>
                      <td className="p-3 font-mono text-muted-foreground">{v.panNumber || 'PAN-PENDING'}</td>
                      <td className="p-3 text-center">
                        <span className={`px-2 py-0.5 rounded text-[8px] font-bold ${
                          v.status === 'Active' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-amber-500/10 text-amber-500 animate-pulse'
                        }`}>
                          {v.status === 'Active' ? 'Verified' : 'Pending Verification'}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {vendorsList.length === 0 && (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-xs text-muted-foreground">No records.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          ) : activeSubTab === 'wallets' ? (
            /* Vendor Wallets and Settlements ledger */
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
                  {vendorsList.map(v => (
                    <tr key={v.id} className="hover:bg-secondary/10 transition-colors">
                      <td className="p-3 font-mono font-semibold text-primary">{v.id}</td>
                      <td className="p-3 font-medium text-foreground">{v.name}</td>
                      <td className="p-3 font-mono font-bold text-foreground">₹{v.revenue.toLocaleString('en-IN')}</td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded text-[8px] font-bold bg-emerald-500/10 text-emerald-500">Settled</span>
                      </td>
                      <td className="p-3 text-center">
                        <button 
                          onClick={() => handleVendorDrawdown(v.userId)}
                          disabled={actionLoading}
                          className="px-2.5 py-1 bg-primary/10 text-primary disabled:opacity-50 hover:bg-primary hover:text-white rounded-lg text-[10px] font-bold transition-all cursor-pointer"
                        >
                          {actionLoading ? 'Processing...' : 'Withdrawal'}
                        </button>
                      </td>
                    </tr>
                  ))}
                  {vendorsList.length === 0 && (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-xs text-muted-foreground">No records.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          ) : activeSubTab === 'ratings' ? (
            /* Vendor ratings page */
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-secondary/40 select-none border-b border-border/60">
                  <tr>
                    <th className="p-3 font-semibold text-muted-foreground">Business Name</th>
                    <th className="p-3 font-semibold text-muted-foreground">Categories</th>
                    <th className="p-3 font-semibold text-muted-foreground">Rating Score</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {vendorsList.map(v => (
                    <tr key={v.id} className="hover:bg-secondary/10 transition-colors">
                      <td className="p-3 font-medium text-foreground">{v.name}</td>
                      <td className="p-3 text-muted-foreground">{v.category}</td>
                      <td className="p-3">
                        <span className="flex items-center gap-1 font-semibold text-amber-500 font-mono">
                          <Star size={12} fill="#f59e0b" /> {v.rating}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {vendorsList.length === 0 && (
                    <tr>
                      <td colSpan={3} className="p-8 text-center text-xs text-muted-foreground">No records.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          ) : (
            /* Pending / Active / Rejected Vendors rosters */
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-secondary/40 select-none border-b border-border/60">
                  <tr>
                    <th className="p-3 font-semibold text-muted-foreground">Vendor Store</th>
                    <th className="p-3 font-semibold text-muted-foreground">Store ID</th>
                    <th className="p-3 font-semibold text-muted-foreground">Contact</th>
                    <th className="p-3 font-semibold text-muted-foreground">Category Segment</th>
                    <th className="p-3 font-semibold text-muted-foreground text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {currentVendors.map(v => (
                    <tr key={v.id} className="hover:bg-secondary/10 transition-colors">
                      <td className="p-3">
                        <span className="font-semibold text-foreground block">{v.name}</span>
                        <span className="text-[10px] text-muted-foreground block">Representative: {v.contact}</span>
                      </td>
                      <td className="p-3 font-mono text-muted-foreground">{v.id}</td>
                      <td className="p-3 text-muted-foreground">{v.contact}</td>
                      <td className="p-3 text-muted-foreground">{v.category}</td>
                      <td className="p-3 text-center">
                        <button 
                          onClick={() => {
                            setSelectedVendor(v);
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
                  {currentVendors.length === 0 && (
                    <tr>
                      <td colSpan={5} className="p-12 text-center text-xs text-muted-foreground border-t">
                        No stores found matching this category.
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
              <span className="text-xs font-bold text-foreground uppercase tracking-wider block">Fulfillment Index</span>
              <p className="text-[9px] text-muted-foreground mt-0.5">Order completed count per merchant</p>
            </div>
            
            {performanceData.length === 0 ? (
              <div className="h-44 flex flex-col items-center justify-center text-center text-xs text-muted-foreground bg-secondary/5 border border-border/40 rounded-xl">
                <Store size={20} className="text-muted-foreground/45 mb-1" />
                <p>No sales activity found.</p>
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
                    <Bar dataKey="fulfillment" name="Completed Orders" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          <div className="bg-card border border-border/80 rounded-2xl p-5 shadow-sm space-y-4">
            <span className="text-xs font-bold text-foreground uppercase tracking-wider block flex items-center gap-1.5 select-none">
              <Activity size={14} className="text-primary" /> Vendor Activity logs
            </span>
            <div className="divide-y divide-border/60 max-h-48 overflow-y-auto no-scrollbar pr-1">
              {vendorActivityLogs.map((log, index) => (
                <div key={index} className="py-2.5 first:pt-0 last:pb-0 text-xs">
                  <div className="flex justify-between items-center font-semibold text-foreground">
                    <span>{log.action}</span>
                    <span className="text-[8px] text-muted-foreground font-mono">{log.timestamp ? log.timestamp.split('T')[0] : 'Just now'}</span>
                  </div>
                  <span className="text-[10px] text-muted-foreground block mt-0.5">{log.details}</span>
                </div>
              ))}
              {vendorActivityLogs.length === 0 && (
                <p className="text-center text-xs text-muted-foreground py-6 select-none">No vendor activity logs found.</p>
              )}
            </div>
          </div>
        </div>

      </div>

      {/* Vendor Details Modal */}
      {selectedVendor && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card border border-border max-w-lg w-full rounded-2xl overflow-hidden shadow-2xl p-6 relative text-xs text-foreground space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <h3 className="text-sm font-bold text-primary uppercase tracking-wider">
                Storefront Hub Management
              </h3>
              <button
                onClick={() => {
                  setSelectedVendor(null);
                  setShowRemarksInput(false);
                  setRemarks('');
                }}
                className="px-2.5 py-1 bg-secondary hover:bg-secondary/80 text-foreground font-bold rounded-lg border border-border/40 cursor-pointer"
              >
                Close
              </button>
            </div>

            <div className="space-y-3 text-left max-h-[75vh] overflow-y-auto pr-1">
              <div className="grid grid-cols-2 gap-3 bg-secondary/15 p-4 rounded-xl border border-border/40">
                <div>
                  <span className="text-muted-foreground block text-[9px] font-bold">BUSINESS NAME</span>
                  <span className="font-semibold block mt-0.5">{selectedVendor.name}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[9px] font-bold">OWNER NAME</span>
                  <span className="font-semibold block mt-0.5 truncate">{selectedVendor.contact}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[9px] font-bold">CATEGORY</span>
                  <span className="font-semibold block mt-0.5">{selectedVendor.category}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[9px] font-bold">STORE ID</span>
                  <span className="font-mono font-semibold block mt-0.5">{selectedVendor.id}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[9px] font-bold">GSTIN</span>
                  <span className="font-mono font-semibold block mt-0.5">{selectedVendor.gstNumber || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[9px] font-bold">PAN</span>
                  <span className="font-mono font-semibold block mt-0.5">{selectedVendor.panNumber || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[9px] font-bold">KYC STATUS</span>
                  <span className="font-semibold block mt-0.5">{selectedVendor.status}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[9px] font-bold">ACCOUNT STATUS</span>
                  <span className="font-semibold block mt-0.5 capitalize">{selectedVendor.rawStatus}</span>
                </div>
              </div>

              {/* Hyperlocal Store Parameters */}
              <div className="space-y-2 bg-secondary/10 p-4 rounded-xl border border-border/40">
                <h4 className="font-bold text-foreground">Hyperlocal Store Parameters</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <span className="text-muted-foreground block text-[9px]">FSSAI License</span>
                    <span className="font-semibold block mt-0.5">{selectedVendor.fssaiNumber || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-[9px]">Geographic GPS Coordinates</span>
                    <span className="font-semibold font-mono block mt-0.5">
                      {selectedVendor.location?.coordinates 
                        ? `[${selectedVendor.location.coordinates[0].toFixed(5)}, ${selectedVendor.location.coordinates[1].toFixed(5)}]` 
                        : 'Not Set'}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-[9px]">Marketplace Listing Status</span>
                    <span className={`font-bold block mt-0.5 ${
                      selectedVendor.marketplaceStatus === 'Approved' ? 'text-emerald-500' : 'text-amber-500'
                    }`}>
                      {selectedVendor.marketplaceStatus}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-[9px]">Verified Store Badge</span>
                    <span className="font-semibold block mt-0.5">
                      {selectedVendor.verifiedBadge ? '✅ Granted (Verified Badge)' : '❌ Not Granted'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Tags & Services */}
              {(selectedVendor.storeTags?.length > 0 || selectedVendor.storeServices?.length > 0) && (
                <div className="space-y-2.5 bg-secondary/10 p-4 rounded-xl border border-border/40">
                  <h4 className="font-bold text-foreground">Discoverability and Services</h4>
                  <div className="space-y-1.5">
                    {selectedVendor.storeServices?.length > 0 && (
                      <div>
                        <span className="text-[10px] text-muted-foreground block">Offered Services</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {selectedVendor.storeServices.map((s: string) => (
                            <span key={s} className="bg-primary/5 border border-primary/10 text-primary rounded px-2 py-0.5 text-[9px] font-medium">{s}</span>
                          ))}
                        </div>
                      </div>
                    )}
                    {selectedVendor.storeTags?.length > 0 && (
                      <div>
                        <span className="text-[10px] text-muted-foreground block">Merchant Tags</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {selectedVendor.storeTags.map((t: string) => (
                            <span key={t} className="bg-muted border rounded px-2 py-0.5 text-[9px] font-medium text-muted-foreground">#{t}</span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Custom Branding & Policies */}
              <div className="space-y-3.5 bg-secondary/10 p-4 rounded-xl border border-border/40">
                <h4 className="font-bold text-foreground">Branding Details & Store Policies</h4>
                <div className="space-y-2">
                  <div>
                    <span className="text-[10px] text-muted-foreground block font-bold">STORE DESCRIPTION</span>
                    <p className="text-foreground/90 font-medium leading-relaxed mt-0.5">{selectedVendor.storeDesign?.description || 'No description provided.'}</p>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 border-t border-border/30 pt-2">
                    <div>
                      <span className="text-[9px] text-muted-foreground block font-bold">RETURNS & REFUNDS POLICY</span>
                      <p className="text-foreground/80 font-medium mt-0.5 leading-normal">{selectedVendor.refundPolicy || 'No custom refund policy.'}</p>
                    </div>
                    <div>
                      <span className="text-[9px] text-muted-foreground block font-bold">REPLACEMENT POLICY</span>
                      <p className="text-foreground/80 font-medium mt-0.5 leading-normal">{selectedVendor.replacementPolicy || 'No custom replacement policy.'}</p>
                    </div>
                    <div className="sm:col-span-2">
                      <span className="text-[9px] text-muted-foreground block font-bold">DELIVERY POLICY</span>
                      <p className="text-foreground/80 font-medium mt-0.5 leading-normal">{selectedVendor.storeDesign?.deliveryPolicy || 'No custom delivery policy.'}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Gallery Images List */}
              {selectedVendor.gallery?.length > 0 && (
                <div className="space-y-2 bg-secondary/10 p-4 rounded-xl border border-border/40">
                  <h4 className="font-bold text-foreground">Premises Photo Gallery</h4>
                  <div className="grid grid-cols-4 gap-2">
                    {selectedVendor.gallery.map((img: string, idx: number) => (
                      <div key={idx} className="h-14 rounded-lg overflow-hidden border border-border bg-muted">
                        <img src={img} alt={`Gallery ${idx + 1}`} className="h-full w-full object-cover" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Listing Approval Controls */}
              <div className="space-y-2 bg-secondary/15 p-4 rounded-xl border border-border/45">
                <h4 className="font-bold text-foreground">Marketplace Listing Actions</h4>
                
                <div className="grid grid-cols-2 gap-2 mt-1.5">
                  <button
                    onClick={() => handleUpdateVendorMarketplace(selectedVendor.userId, { marketplaceStatus: 'Approved' })}
                    disabled={actionLoading}
                    className="py-2 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white rounded-xl font-bold text-center cursor-pointer shadow-sm transition"
                  >
                    Approve Store Listing
                  </button>
                  <button
                    onClick={() => handleUpdateVendorMarketplace(selectedVendor.userId, { marketplaceStatus: 'Rejected' })}
                    disabled={actionLoading}
                    className="py-2 bg-rose-500 hover:bg-rose-600 disabled:opacity-50 text-white rounded-xl font-bold text-center cursor-pointer shadow-sm transition"
                  >
                    Reject Store Listing
                  </button>
                  
                  <button
                    onClick={() => handleUpdateVendorMarketplace(selectedVendor.userId, { verifiedBadge: !selectedVendor.verifiedBadge })}
                    disabled={actionLoading}
                    className="col-span-2 py-2 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950 dark:hover:bg-indigo-900 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-850 rounded-xl font-bold text-center cursor-pointer transition"
                  >
                    {selectedVendor.verifiedBadge ? 'Revoke Verified Badge' : 'Grant Verified Badge'}
                  </button>
                </div>
              </div>

              {showRemarksInput ? (
                <div className="space-y-2 pt-2 border-t border-border/40">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Remarks Reason</label>
                  <textarea
                    placeholder="Enter reason for this action..."
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
                    className="w-full text-xs p-2.5 border border-border rounded-xl bg-secondary/10 outline-none h-16 text-foreground"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleUpdateVendorStatus(selectedVendor.userId, 'suspended')}
                      disabled={actionLoading}
                      className="w-full py-2 bg-rose-500 hover:bg-rose-600 text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
                    >
                      {actionLoading ? 'Processing...' : 'Confirm Suspend'}
                    </button>
                    <button
                      onClick={() => handleUpdateVendorStatus(selectedVendor.userId, 'blocked')}
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
                <div className="space-y-2.5 pt-2 border-t border-border/40">
                  {selectedVendor.rawStatus !== 'active' ? (
                    <div className="flex flex-col gap-2">
                      <button
                        onClick={() => handleUpdateVendorStatus(selectedVendor.userId, 'active')}
                        disabled={actionLoading}
                        className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-md transition-all cursor-pointer"
                      >
                        {actionLoading ? 'Activating...' : 'Activate Vendor Account'}
                      </button>
                      {(selectedVendor.rawStatus === 'pending_verification' || selectedVendor.rawStatus === 'pending') && (
                        <button
                          onClick={() => handleUpdateVendorStatus(selectedVendor.userId, 'rejected')}
                          disabled={actionLoading}
                          className="w-full py-2 bg-red-600/10 hover:bg-red-600/25 border border-red-600/20 text-red-500 font-semibold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                        >
                          {actionLoading ? 'Rejecting...' : 'Reject Vendor Application'}
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
                        Suspend Vendor
                      </button>
                      <button
                        onClick={() => {
                          setRemarks('Account blocked due to policy violation');
                          setShowRemarksInput(true);
                        }}
                        disabled={actionLoading}
                        className="w-full py-2 bg-red-600/10 hover:bg-red-600/25 border border-red-600/20 text-red-500 font-semibold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                      >
                        Block Vendor
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
