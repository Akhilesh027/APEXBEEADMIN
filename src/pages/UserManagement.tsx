import React, { useState, useEffect } from 'react';
import { useAdminState } from '../context/AdminStateContext';
import { Users, UserCheck, UserPlus, Wallet, Search, ShieldCheck, Activity, Share2 } from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';

export const UserManagement: React.FC = () => {
  const { wallets, referrals, activityLogs } = useAdminState();
  const [activeSubTab, setActiveSubTab] = useState<'guests' | 'customers' | 'partners' | 'referrals' | 'wallets' | 'verification' | 'activity'>('customers');
  const [searchQuery, setSearchQuery] = useState('');
  const [usersList, setUsersList] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const [showRemarksInput, setShowRemarksInput] = useState(false);
  const [remarks, setRemarks] = useState('');

  const getUserType = (roles: string[], isVerified?: boolean) => {
    if (roles.includes('admin')) return 'Admin';
    const partnerRoles = [
      'vendor', 'wholesaler', 'manufacturer', 'entrepreneur',
      'service_provider', 'course_provider', 'state_franchise',
      'district_franchise', 'mandal_franchise', 'business_partner'
    ];
    if (roles.some(r => partnerRoles.includes(r))) {
      return 'Business Partner';
    }
    return isVerified ? 'Customer' : 'Guest';
  };

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setErrorMsg('');
      const token = localStorage.getItem('adminToken');
      const res = await fetch('https://server.apexbee.in/api/admin/users', {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });
      const data = await res.json();
      if (data.success) {
        const mapped = (data.users || []).map((u: any) => {
          const userWallet = wallets.find((w: any) => String(w.userId?._id || w.userId || w.id) === String(u._id));
          const walletBalance = userWallet ? userWallet.availableBalance : 0;
          return {
            id: u._id,
            name: u.name,
            email: u.email,
            type: getUserType(u.roles, u.isVerified),
            registered: u.createdAt ? new Date(u.createdAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
            walletBalance: walletBalance,
            status: u.isVerified ? 'Verified' : 'Pending',
            activity: u.status === 'active' ? 'Active on platform' : 'Inactive',
            referralsCount: referrals.filter(r => String(r.referredById) === String(u._id)).length,
            roles: u.roles,
            isVerified: u.isVerified,
            rawStatus: u.status || 'active'
          };
        });
        setUsersList(mapped);
      } else {
        setErrorMsg(data.message || 'Failed to fetch users');
      }
    } catch (err: any) {
      console.error('Error fetching users:', err);
      setErrorMsg(err.message || 'Network error fetching users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [wallets, referrals]);

  const handleVerifyUserKyc = async (userId: string) => {
    try {
      setActionLoading(true);
      setErrorMsg('');
      setSuccessMsg('');
      const token = localStorage.getItem('adminToken');
      const res = await fetch(`https://server.apexbee.in/api/admin/users/${userId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          isVerified: true,
          status: 'active',
          remarks: 'KYC verified and approved by admin.'
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSuccessMsg('User KYC approved and role activated successfully');
        await fetchUsers();
      } else {
        setErrorMsg(data.message || 'Failed to verify KYC');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Error communicating with backend');
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateUserStatus = async (userId: string, newStatus: string) => {
    try {
      setActionLoading(true);
      setErrorMsg('');
      setSuccessMsg('');
      const token = localStorage.getItem('adminToken');
      const res = await fetch(`https://server.apexbee.in/api/admin/users/${userId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          status: newStatus,
          remarks: remarks || `User account status set to ${newStatus} by admin.`
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSuccessMsg(`User status updated to ${newStatus} successfully`);
        setSelectedUser(null);
        setRemarks('');
        setShowRemarksInput(false);
        await fetchUsers();
      } else {
        setErrorMsg(data.message || 'Failed to update user status');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Error communicating with backend');
    } finally {
      setActionLoading(false);
    }
  };

  // Filtered lists based on subtab
  const getSubtabFilteredUsers = () => {
    switch (activeSubTab) {
      case 'guests':
        return usersList.filter(u => u.type === 'Guest');
      case 'customers':
        return usersList.filter(u => u.type === 'Customer');
      case 'partners':
        return usersList.filter(u => u.type === 'Business Partner');
      default:
        return usersList;
    }
  };

  const currentUsers = getSubtabFilteredUsers().filter(u => 
    u.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    u.email.toLowerCase().includes(searchQuery.toLowerCase()) || 
    u.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Dynamic user registrations trend aggregated from DB createdAt timestamps
  const getRegistrationTrend = () => {
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthlyCounts: Record<string, { count: number; monthIndex: number }> = {};
    
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const name = monthNames[d.getMonth()];
      monthlyCounts[name] = { count: 0, monthIndex: d.getMonth() };
    }

    usersList.forEach(u => {
      if (!u.registered) return;
      const d = new Date(u.registered);
      const name = monthNames[d.getMonth()];
      if (monthlyCounts[name] !== undefined) {
        monthlyCounts[name].count += 1;
      }
    });

    let runningSum = 0;
    const sorted = Object.entries(monthlyCounts).sort((a: any, b: any) => {
      return a[1].monthIndex - b[1].monthIndex;
    });

    return sorted.map(([month, data]) => {
      runningSum += data.count;
      return {
        month,
        count: runningSum
      };
    });
  };

  const registrationData = getRegistrationTrend();

  // Find a root node for the dynamic referral tree render
  const getReferralTree = () => {
    if (referrals.length === 0) return null;
    // Find first referral node that has downlines or referredById empty
    const root = referrals.find(r => !r.referredById) || referrals[0];
    const level1 = referrals.filter(r => String(r.referredById) === String(root.userId));
    return {
      root,
      level1
    };
  };

  const referralTree = getReferralTree();
  const totalWalletLiabilities = usersList.reduce((acc, u) => acc + (u.walletBalance || 0), 0);

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
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Total Users</span>
            <span className="text-xl font-bold font-mono text-foreground mt-1 block">
              {loading ? '...' : `${usersList.length} Users`}
            </span>
            <span className="text-[9px] text-emerald-500 mt-1 block font-semibold">Live Database Records</span>
          </div>
          <Users className="text-primary shrink-0" size={24} />
        </div>
        <div className="bg-card border border-border/80 rounded-2xl p-4 flex items-center justify-between shadow-sm">
          <div>
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Active Users (24h)</span>
            <span className="text-xl font-bold font-mono text-foreground mt-1 block">
              {loading ? '...' : `${usersList.filter(u => u.activity.includes('Active')).length} Active`}
            </span>
            <span className="text-[9px] text-violet-500 mt-1 block font-semibold">Platform Engagement</span>
          </div>
          <UserCheck className="text-violet-500 shrink-0" size={24} />
        </div>
        <div className="bg-card border border-border/80 rounded-2xl p-4 flex items-center justify-between shadow-sm">
          <div>
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">New Registrations</span>
            <span className="text-xl font-bold font-mono text-foreground mt-1 block">
              {loading ? '...' : `+${usersList.filter(u => u.registered === new Date().toISOString().split('T')[0]).length} Today`}
            </span>
            <span className="text-[9px] text-emerald-500 mt-1 block font-semibold">Live Sign-Ups</span>
          </div>
          <UserPlus className="text-emerald-500 shrink-0" size={24} />
        </div>
        <div className="bg-card border border-border/80 rounded-2xl p-4 flex items-center justify-between shadow-sm">
          <div>
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">User Wallets Liabilities</span>
            <span className="text-xl font-bold font-mono text-foreground mt-1 block">
              {loading ? '...' : `₹${totalWalletLiabilities.toLocaleString('en-IN')}`}
            </span>
            <span className="text-[9px] text-muted-foreground mt-1 block">Held across active buyer ledgers</span>
          </div>
          <Wallet className="text-amber-500 shrink-0" size={24} />
        </div>
      </div>

      {/* Subtab Menu */}
      <div className="flex gap-2 flex-wrap bg-card border border-border/60 p-2 rounded-2xl select-none shadow-sm">
        {(['guests', 'customers', 'partners', 'referrals', 'wallets', 'verification', 'activity'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveSubTab(tab)}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all ${
              activeSubTab === tab
                ? 'bg-primary text-primary-foreground border-primary shadow-md'
                : 'bg-transparent text-muted-foreground border-transparent hover:bg-secondary/60 hover:text-foreground'
            }`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* Main Grid: Visual Chart and Table */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left/Middle Column - Content table or custom view */}
        <div className="lg:col-span-8 bg-card border border-border/80 rounded-2xl shadow-sm overflow-hidden space-y-4 p-5">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-3 border-b border-border/60">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-foreground uppercase tracking-wider">
                User Listing ({activeSubTab.toUpperCase()})
              </span>
            </div>
            
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:flex-initial">
                <Search className="absolute left-3 top-2.5 text-muted-foreground" size={14} />
                <input
                  type="text"
                  placeholder="Search user..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 pr-4 py-1.5 bg-secondary/50 border border-border/80 focus:border-primary rounded-xl text-xs outline-none w-full sm:w-48 font-medium"
                />
              </div>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-12 text-xs text-muted-foreground select-none">
              Loading user roster from backend...
            </div>
          ) : activeSubTab === 'referrals' ? (
            /* Referral Tree View Simulation */
            <div className="space-y-4 select-none">
              {referralTree ? (
                <div className="p-4 bg-secondary/15 rounded-xl border border-border/40 space-y-3">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-semibold text-foreground">Dynamic Referral Promoter Tree</span>
                    <span className="text-[10px] text-muted-foreground flex items-center gap-1"><Share2 size={12} /> Live Uplines/Downlines</span>
                  </div>
                  <div className="flex flex-col items-center py-6 space-y-4">
                    {/* Root Node */}
                    <div className="bg-primary text-primary-foreground p-3 rounded-2xl border border-primary/20 text-center shadow-lg w-44">
                      <p className="text-xs font-bold truncate">{referralTree.root.userName}</p>
                      <p className="text-[9px] opacity-90 truncate">ID: {referralTree.root.userId}</p>
                      <p className="text-[9px] opacity-90 font-mono mt-0.5">Comm: ₹{referralTree.root.commissionEarned}</p>
                    </div>
                    
                    {referralTree.level1.length > 0 && <div className="w-0.5 h-6 bg-border" />}
                    
                    {/* Children Row */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-6 w-full max-w-lg">
                      {referralTree.level1.slice(0, 3).map((child, cIdx) => (
                        <div key={cIdx} className="bg-card border border-border p-2.5 rounded-xl text-center shadow-sm">
                          <p className="text-xs font-semibold truncate">{child.userName}</p>
                          <p className="text-[9px] text-muted-foreground truncate">ID: {child.userId}</p>
                          <p className="text-[9px] text-emerald-500 font-mono mt-0.5">Earned: ₹{child.commissionEarned}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="py-12 text-center text-xs text-muted-foreground select-none">
                  No promotor/referrals registered in the system database.
                </div>
              )}
            </div>
          ) : activeSubTab === 'wallets' ? (
            /* Wallet Monitoring View */
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-secondary/40 select-none border-b border-border/60">
                  <tr>
                    <th className="p-3 font-semibold text-muted-foreground">User ID</th>
                    <th className="p-3 font-semibold text-muted-foreground">User Name</th>
                    <th className="p-3 font-semibold text-muted-foreground">Account Type</th>
                    <th className="p-3 font-semibold text-muted-foreground">Available Balance</th>
                    <th className="p-3 font-semibold text-muted-foreground">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {currentUsers.map(user => (
                    <tr key={user.id} className="hover:bg-secondary/10 transition-colors">
                      <td className="p-3 font-mono font-semibold text-primary">{user.id}</td>
                      <td className="p-3 font-medium text-foreground">{user.name}</td>
                      <td className="p-3 text-muted-foreground">{user.type}</td>
                      <td className="p-3 font-mono font-bold text-foreground">₹{user.walletBalance.toLocaleString('en-IN')}</td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded text-[8px] font-bold bg-emerald-500/10 text-emerald-500">Active</span>
                      </td>
                    </tr>
                  ))}
                  {currentUsers.length === 0 && (
                    <tr>
                      <td colSpan={5} className="p-12 text-center text-xs text-muted-foreground">No users found.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          ) : activeSubTab === 'verification' ? (
            /* User Verification status */
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-secondary/40 select-none border-b border-border/60">
                  <tr>
                    <th className="p-3 font-semibold text-muted-foreground">ID</th>
                    <th className="p-3 font-semibold text-muted-foreground">User Name</th>
                    <th className="p-3 font-semibold text-muted-foreground">Document Status</th>
                    <th className="p-3 font-semibold text-muted-foreground">Registered</th>
                    <th className="p-3 font-semibold text-muted-foreground text-center">Audit Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {usersList.map(user => (
                    <tr key={user.id} className="hover:bg-secondary/10 transition-colors">
                      <td className="p-3 font-mono font-semibold text-primary">{user.id}</td>
                      <td className="p-3 font-medium text-foreground">{user.name}</td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded text-[8px] font-bold ${
                          user.status === 'Verified' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-amber-500/10 text-amber-500 animate-pulse'
                        }`}>
                          {user.status === 'Verified' ? 'KYC Verified' : 'Documents Pending'}
                        </span>
                      </td>
                      <td className="p-3 text-muted-foreground font-mono">{user.registered}</td>
                      <td className="p-3 text-center">
                        {user.status === 'Pending' ? (
                          <button 
                            onClick={() => handleVerifyUserKyc(user.id)}
                            disabled={actionLoading}
                            className="px-2.5 py-1 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white rounded-lg text-[10px] font-bold transition-all cursor-pointer"
                          >
                            {actionLoading ? 'Verifying...' : 'Verify KYC'}
                          </button>
                        ) : (
                          <span className="text-[10px] text-muted-foreground font-medium flex items-center justify-center gap-1">
                            <ShieldCheck size={12} className="text-emerald-500" /> Approved
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                  {usersList.length === 0 && (
                    <tr>
                      <td colSpan={5} className="p-12 text-center text-xs text-muted-foreground">No users found.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          ) : (
            /* Default: Guests, Customers, Partners User Table */
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-secondary/40 select-none border-b border-border/60">
                  <tr>
                    <th className="p-3 font-semibold text-muted-foreground">User</th>
                    <th className="p-3 font-semibold text-muted-foreground">ID</th>
                    <th className="p-3 font-semibold text-muted-foreground">Role</th>
                    <th className="p-3 font-semibold text-muted-foreground">Registered Date</th>
                    <th className="p-3 font-semibold text-muted-foreground text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {currentUsers.map(user => (
                    <tr key={user.id} className="hover:bg-secondary/10 transition-colors">
                      <td className="p-3">
                        <span className="font-semibold text-foreground block">{user.name}</span>
                        <span className="text-[10px] text-muted-foreground block">{user.email}</span>
                      </td>
                      <td className="p-3 font-mono font-semibold text-muted-foreground">{user.id}</td>
                      <td className="p-3 text-muted-foreground">{user.type}</td>
                      <td className="p-3 font-mono text-muted-foreground">{user.registered}</td>
                      <td className="p-3 text-center">
                        <button 
                          onClick={() => {
                            setSelectedUser(user);
                            setRemarks('');
                            setShowRemarksInput(false);
                          }}
                          className="px-2.5 py-1 bg-secondary hover:bg-secondary/80 border border-border text-foreground rounded-lg text-[10px] font-bold transition-all cursor-pointer"
                        >
                          Details
                        </button>
                      </td>
                    </tr>
                  ))}
                  {currentUsers.length === 0 && (
                    <tr>
                      <td colSpan={5} className="p-12 text-center text-xs text-muted-foreground">
                        No matches found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
 
        {/* Right Column: User Growth Analytics Chart & History */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-card border border-border/80 rounded-2xl p-5 shadow-sm space-y-4">
            <div>
              <span className="text-xs font-bold text-foreground uppercase tracking-wider block">Registrations Trend</span>
              <p className="text-[9px] text-muted-foreground mt-0.5">Historical cumulative customer acquisitions</p>
            </div>
            
            {registrationData.length === 0 ? (
              <div className="h-44 flex flex-col items-center justify-center text-center text-xs text-muted-foreground bg-secondary/5 rounded-xl border border-border/40">
                <Users size={20} className="text-muted-foreground/50 mb-1" />
                <p>No user registrations found.</p>
              </div>
            ) : (
              <div className="h-44 w-full select-none">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={registrationData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorUsersGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2}/>
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(100, 116, 139, 0.1)" />
                    <XAxis dataKey="month" stroke="rgba(100, 116, 139, 0.5)" fontSize={10} tickLine={false} />
                    <YAxis stroke="rgba(100, 116, 139, 0.5)" fontSize={10} tickLine={false} />
                    <Tooltip
                      contentStyle={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)' }}
                      labelStyle={{ fontWeight: 'bold', fontSize: 11, color: 'var(--foreground)' }}
                      itemStyle={{ fontSize: 11, color: 'var(--foreground)' }}
                    />
                    <Area type="monotone" dataKey="count" name="Users" stroke="#3b82f6" fill="url(#colorUsersGrad)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {/* User activity feed */}
          <div className="bg-card border border-border/80 rounded-2xl p-5 shadow-sm space-y-4">
            <span className="text-xs font-bold text-foreground uppercase tracking-wider block flex items-center gap-1.5 select-none">
              <Activity size={14} className="text-primary" /> Live System Logs
            </span>
            <div className="divide-y divide-border/60 max-h-48 overflow-y-auto no-scrollbar pr-1">
              {activityLogs.slice(0, 8).map((log, index) => (
                <div key={index} className="py-2.5 first:pt-0 last:pb-0 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-foreground">{log.action}</span>
                    <span className="text-[8px] font-mono text-muted-foreground">{log.timestamp ? log.timestamp.split('T')[0] : 'Today'}</span>
                  </div>
                  <span className="text-[10px] text-muted-foreground block mt-0.5">{log.details}</span>
                </div>
              ))}
              {activityLogs.length === 0 && (
                <p className="text-center text-xs text-muted-foreground py-6 select-none">No recent activity logs available.</p>
              )}
            </div>
          </div>
        </div>

      </div>

      {/* User Details Modal */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card border border-border max-w-md w-full rounded-2xl overflow-hidden shadow-2xl p-6 relative text-xs text-foreground space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <h3 className="text-sm font-bold text-primary uppercase tracking-wider">
                User Account Profile
              </h3>
              <button
                onClick={() => {
                  setSelectedUser(null);
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
                  <span className="font-semibold block mt-0.5">{selectedUser.name}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[9px] font-bold">EMAIL</span>
                  <span className="font-semibold block mt-0.5 truncate">{selectedUser.email}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[9px] font-bold">ROLE</span>
                  <span className="font-semibold block mt-0.5">{selectedUser.type}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[9px] font-bold">REGISTERED</span>
                  <span className="font-mono font-semibold block mt-0.5">{selectedUser.registered}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[9px] font-bold">KYC STATUS</span>
                  <span className="font-semibold block mt-0.5">{selectedUser.status}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[9px] font-bold">ACCOUNT STATUS</span>
                  <span className="font-semibold block mt-0.5 capitalize">{selectedUser.rawStatus}</span>
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
                      onClick={() => handleUpdateUserStatus(selectedUser.id, 'suspended')}
                      disabled={actionLoading}
                      className="w-full py-2 bg-rose-500 hover:bg-rose-600 text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
                    >
                      {actionLoading ? 'Processing...' : 'Confirm Suspend'}
                    </button>
                    <button
                      onClick={() => handleUpdateUserStatus(selectedUser.id, 'blocked')}
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
                  {selectedUser.rawStatus !== 'active' ? (
                    <button
                      onClick={() => handleUpdateUserStatus(selectedUser.id, 'active')}
                      disabled={actionLoading}
                      className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-md transition-all cursor-pointer"
                    >
                      {actionLoading ? 'Activating...' : 'Activate User Account'}
                    </button>
                  ) : (
                    <div className="flex gap-2">
                      <button
                        onClick={() => setShowRemarksInput(true)}
                        disabled={actionLoading}
                        className="w-full py-2 bg-rose-500/10 hover:bg-rose-500/25 border border-rose-500/20 text-rose-500 font-semibold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                      >
                        Suspend User
                      </button>
                      <button
                        onClick={() => {
                          setRemarks('Account blocked due to policy violation');
                          setShowRemarksInput(true);
                        }}
                        disabled={actionLoading}
                        className="w-full py-2 bg-red-600/10 hover:bg-red-600/25 border border-red-600/20 text-red-500 font-semibold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                      >
                        Block User
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
