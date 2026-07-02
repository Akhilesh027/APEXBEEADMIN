import React, { useState } from 'react';
import { UserCheck, ShieldCheck, Clock, Users, Search, Plus } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';

export const StaffManagement: React.FC = () => {
  const [activeSubTab, setActiveSubTab] = useState<'marketing' | 'delivery' | 'support' | 'finance' | 'operations' | 'add' | 'roles'>('marketing');
  const [searchQuery, setSearchQuery] = useState('');

  // Sample internal staff
  const staffList = [
    { id: 'STF-01', name: 'Ananya Sharma', email: 'ananya@apexbee.com', role: 'Super Admin', dept: 'Operations Team', status: 'Present', performance: '100%' },
    { id: 'STF-02', name: 'Vikram Rane', email: 'vikram@apexbee.com', role: 'State Manager', dept: 'Operations Team', status: 'Present', performance: '94%' },
    { id: 'STF-03', name: 'Deepak Joshi', email: 'deepak@apexbee.com', role: 'District Coordinator', dept: 'Operations Team', status: 'Present', performance: '92%' },
    { id: 'STF-04', name: 'Suresh Shah', email: 'suresh@apexbee.com', role: 'Finance Auditor', dept: 'Finance Team', status: 'Present', performance: '98%' },
    { id: 'STF-05', name: 'Neha Deshmukh', email: 'neha@apexbee.com', role: 'Support Specialist', dept: 'Customer Support', status: 'On Leave', performance: '88%' }
  ];

  const getFilteredStaff = () => {
    switch (activeSubTab) {
      case 'support':
        return staffList.filter(s => s.dept === 'Customer Support');
      case 'finance':
        return staffList.filter(s => s.dept === 'Finance Team');
      case 'operations':
        return staffList.filter(s => s.dept === 'Operations Team');
      default:
        return staffList;
    }
  };

  const currentStaff = getFilteredStaff().filter(s => 
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.role.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const performanceData = [
    { name: 'Ananya S.', score: 100 },
    { name: 'Vikram R.', score: 94 },
    { name: 'Deepak J.', score: 92 },
    { name: 'Suresh S.', score: 98 },
    { name: 'Neha D.', score: 88 }
  ];

  return (
    <div className="space-y-6">
      
      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 select-none">
        <div className="bg-card border border-border/80 rounded-2xl p-4 flex items-center justify-between shadow-sm">
          <div>
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Total Staff</span>
            <span className="text-xl font-bold font-mono text-foreground mt-1 block">28 Members</span>
            <span className="text-[9px] text-emerald-500 mt-1 block font-semibold">100% role allocation</span>
          </div>
          <Users className="text-primary shrink-0" size={24} />
        </div>
        <div className="bg-card border border-border/80 rounded-2xl p-4 flex items-center justify-between shadow-sm">
          <div>
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Attendance Today</span>
            <span className="text-xl font-bold font-mono text-foreground mt-1 block">26 Present</span>
            <span className="text-[9px] text-emerald-500 mt-1 block font-semibold">2 approved leaves</span>
          </div>
          <UserCheck className="text-violet-500 shrink-0" size={24} />
        </div>
        <div className="bg-card border border-border/80 rounded-2xl p-4 flex items-center justify-between shadow-sm">
          <div>
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Active Tasks SLA</span>
            <span className="text-xl font-bold font-mono text-foreground mt-1 block">94.8% SLA</span>
            <span className="text-[9px] text-violet-500 mt-1 block font-semibold">Based on support tickets resolutions</span>
          </div>
          <Clock className="text-emerald-500 shrink-0" size={24} />
        </div>
        <div className="bg-card border border-border/80 rounded-2xl p-4 flex items-center justify-between shadow-sm">
          <div>
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Security Clearances</span>
            <span className="text-xl font-bold font-mono text-foreground mt-1 block">Admin MFA Active</span>
            <span className="text-[9px] text-muted-foreground mt-1 block">Strict RBAC control enforced</span>
          </div>
          <ShieldCheck className="text-amber-500 shrink-0" size={24} />
        </div>
      </div>

      {/* Subtab Menu */}
      <div className="flex gap-2 flex-wrap bg-card border border-border/60 p-2 rounded-2xl select-none shadow-sm">
        {(['marketing', 'delivery', 'support', 'finance', 'operations', 'add', 'roles'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveSubTab(tab)}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all ${
              activeSubTab === tab
                ? 'bg-primary text-primary-foreground border-primary shadow-md'
                : 'bg-transparent text-muted-foreground border-transparent hover:bg-secondary/60 hover:text-foreground'
            }`}
          >
            {tab === 'add' ? 'Add Staff' : tab === 'roles' ? 'Roles & Permissions' : tab.charAt(0).toUpperCase() + tab.slice(1) + ' Team'}
          </button>
        ))}
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Column: Data tables */}
        <div className="lg:col-span-8 bg-card border border-border/80 rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-3 border-b border-border/60">
            <span className="text-xs font-bold text-foreground uppercase tracking-wider">
              Internal Staff roster ({activeSubTab.toUpperCase()})
            </span>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:flex-initial">
                <Search className="absolute left-3 top-2.5 text-muted-foreground" size={14} />
                <input
                  type="text"
                  placeholder="Search staff..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 pr-4 py-1.5 bg-secondary/50 border border-border/80 focus:border-primary rounded-xl text-xs outline-none w-full sm:w-48 font-medium"
                />
              </div>
              <button 
                onClick={() => alert('Opening Add Staff form...')}
                className="px-3.5 py-1.5 bg-primary text-primary-foreground font-bold text-xs rounded-xl transition-all shadow-md shadow-primary/10 flex items-center gap-1 cursor-pointer"
              >
                <Plus size={14} /> Add Staff
              </button>
            </div>
          </div>

          {activeSubTab === 'roles' ? (
            /* Roles and Permissions management list */
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-secondary/40 select-none border-b border-border/60">
                  <tr>
                    <th className="p-3 font-semibold text-muted-foreground">Role Group</th>
                    <th className="p-3 font-semibold text-muted-foreground">Allowed Permissions</th>
                    <th className="p-3 font-semibold text-muted-foreground text-center">RBAC Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  <tr className="hover:bg-secondary/10">
                    <td className="p-3 font-semibold text-foreground">Super Admin</td>
                    <td className="p-3 text-muted-foreground">Full Platform Write & Financial Payout Approvals</td>
                    <td className="p-3 text-center">
                      <span className="px-2 py-0.5 rounded text-[8px] font-bold bg-emerald-500/10 text-emerald-500">Root Access</span>
                    </td>
                  </tr>
                  <tr className="hover:bg-secondary/10">
                    <td className="p-3 font-semibold text-foreground">District Coordinator</td>
                    <td className="p-3 text-muted-foreground">KYC Document Read, Regional Franchise Setup View</td>
                    <td className="p-3 text-center">
                      <span className="px-2 py-0.5 rounded text-[8px] font-bold bg-violet-500/10 text-violet-500">Restricted</span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          ) : (
            /* Default departments lists */
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-secondary/40 select-none border-b border-border/60">
                  <tr>
                    <th className="p-3 font-semibold text-muted-foreground">Name</th>
                    <th className="p-3 font-semibold text-muted-foreground">ID</th>
                    <th className="p-3 font-semibold text-muted-foreground">Designation</th>
                    <th className="p-3 font-semibold text-muted-foreground">Attendance</th>
                    <th className="p-3 font-semibold text-muted-foreground text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {currentStaff.map(s => (
                    <tr key={s.id} className="hover:bg-secondary/10 transition-colors">
                      <td className="p-3 font-medium text-foreground">{s.name}</td>
                      <td className="p-3 font-mono text-muted-foreground">{s.id}</td>
                      <td className="p-3 text-muted-foreground">{s.role}</td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded text-[8px] font-bold ${
                          s.status === 'Present' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'
                        }`}>
                          {s.status}
                        </span>
                      </td>
                      <td className="p-3 text-center">
                        <button 
                          onClick={() => alert(`Reviewing attendance audit logs for ${s.name}`)}
                          className="px-2.5 py-1 bg-secondary hover:bg-secondary/80 border border-border text-foreground rounded-lg text-[10px] font-bold transition-all cursor-pointer"
                        >
                          Performance
                        </button>
                      </td>
                    </tr>
                  ))}
                  {currentStaff.length === 0 && (
                    <tr>
                      <td colSpan={5} className="p-12 text-center text-xs text-muted-foreground">
                        No team members registered for this department.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Right Column: Performance Analytics chart */}
        <div className="lg:col-span-4 bg-card border border-border/80 rounded-2xl p-5 shadow-sm space-y-4">
          <div>
            <span className="text-xs font-bold text-foreground uppercase tracking-wider block">Staff Performance Ratings</span>
            <p className="text-[9px] text-muted-foreground mt-0.5">Task completion metrics evaluation</p>
          </div>
          
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
                <Bar dataKey="score" name="Performance Score %" fill="#a78bfa" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

    </div>
  );
};
