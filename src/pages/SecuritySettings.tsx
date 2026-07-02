import React, { useState } from 'react';
import { Shield, ShieldAlert, Key, Eye, ToggleLeft, ToggleRight } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';

export const SecuritySettings: React.FC = () => {
  const [activeSubTab, setActiveSubTab] = useState<'login' | 'mfa' | 'ip' | 'session' | 'password' | 'fraud'>('login');
  const [mfaEnabled, setMfaEnabled] = useState(true);

  // Sample security logs
  const securityLogs = [
    { id: 'SEC-01', event: 'Suspicious login block', user: 'SEL-002 (Karan Organic)', ip: '198.51.100.4', details: 'Blocked login attempt from unauthorized country IP', time: '10 mins ago', status: 'Blocked' },
    { id: 'SEC-02', event: 'MFA setup completed', user: 'STF-04 (Suresh Shah)', ip: '192.168.1.101', details: 'Activated TOTP authentication check', time: '1 hr ago', status: 'Audit Clear' },
    { id: 'SEC-03', event: 'Failed login password mismatch', user: 'ananya@apexbee.com', ip: '203.0.113.12', details: '2 consecutive failed attempts logged', time: '3 hrs ago', status: 'Flagged' }
  ];

  const failedLoginData = [
    { day: 'Mon', attempts: 2 },
    { day: 'Tue', attempts: 5 },
    { day: 'Wed', attempts: 1 },
    { day: 'Thu', attempts: 8 },
    { day: 'Fri', attempts: 3 },
    { day: 'Sat', attempts: 2 },
    { day: 'Sun', attempts: 1 }
  ];

  return (
    <div className="space-y-6">
      
      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 select-none">
        <div className="bg-card border border-border/80 rounded-2xl p-4 flex items-center justify-between shadow-sm">
          <div>
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Security Shields</span>
            <span className="text-xl font-bold font-mono text-emerald-500 mt-1 block">OPTIMAL STATUS</span>
            <span className="text-[9px] text-emerald-500 mt-1 block font-semibold">Real-time firewall active</span>
          </div>
          <Shield className="text-emerald-500 shrink-0" size={24} />
        </div>
        <div className="bg-card border border-border/80 rounded-2xl p-4 flex items-center justify-between shadow-sm">
          <div>
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Failed Logins (24h)</span>
            <span className="text-xl font-bold font-mono text-foreground mt-1 block">3 Attempts</span>
            <span className="text-[9px] text-rose-500 mt-1 block font-semibold">1 account temporarily locked</span>
          </div>
          <ShieldAlert className="text-rose-500 shrink-0 animate-bounce" size={24} />
        </div>
        <div className="bg-card border border-border/80 rounded-2xl p-4 flex items-center justify-between shadow-sm">
          <div>
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">2FA Enforced Staff</span>
            <span className="text-xl font-bold font-mono text-foreground mt-1 block">100% Enforced</span>
            <span className="text-[9px] text-emerald-500 mt-1 block font-semibold">All administrative roles checked</span>
          </div>
          <Key className="text-violet-500 shrink-0" size={24} />
        </div>
        <div className="bg-card border border-border/80 rounded-2xl p-4 flex items-center justify-between shadow-sm">
          <div>
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Intrusion Shield Blocks</span>
            <span className="text-xl font-bold font-mono text-foreground mt-1 block">42 IPs Blocked</span>
            <span className="text-[9px] text-muted-foreground mt-1 block">Automatic geofencing triggers</span>
          </div>
          <Eye className="text-amber-500 shrink-0" size={24} />
        </div>
      </div>

      {/* Subtab Menu */}
      <div className="flex gap-2 flex-wrap bg-card border border-border/60 p-2 rounded-2xl select-none shadow-sm">
        {(['login', 'mfa', 'ip', 'session', 'password', 'fraud'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveSubTab(tab)}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all ${
              activeSubTab === tab
                ? 'bg-primary text-primary-foreground border-primary shadow-md'
                : 'bg-transparent text-muted-foreground border-transparent hover:bg-secondary/60 hover:text-foreground'
            }`}
          >
            {tab === 'mfa' ? 'Two Factor Auth' : tab === 'ip' ? 'IP Restrictions' : tab === 'session' ? 'Session Management' : tab === 'password' ? 'Password Policies' : tab === 'fraud' ? 'Fraud Protection' : 'Login Security'}
          </button>
        ))}
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Column: Data tables and controls */}
        <div className="lg:col-span-8 bg-card border border-border/80 rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex justify-between items-center pb-3 border-b border-border/60">
            <span className="text-xs font-bold text-foreground uppercase tracking-wider">
              Security Console Controls ({activeSubTab.toUpperCase()})
            </span>
          </div>

          {activeSubTab === 'mfa' ? (
            /* Multi factor auth settings simulator */
            <div className="space-y-4">
              <div className="p-4 bg-secondary/15 rounded-xl border border-border/40 flex justify-between items-center select-none">
                <div className="space-y-1">
                  <span className="text-xs font-bold text-foreground block">Require MFA for All Staff</span>
                  <span className="text-[10px] text-muted-foreground block">Forces TOTP authenticator setup upon next login attempt</span>
                </div>
                <button
                  onClick={() => setMfaEnabled(!mfaEnabled)}
                  className="p-1 hover:bg-secondary rounded-lg transition-colors cursor-pointer"
                >
                  {mfaEnabled ? (
                    <ToggleRight size={32} className="text-primary" />
                  ) : (
                    <ToggleLeft size={32} className="text-muted-foreground" />
                  )}
                </button>
              </div>

              <div className="p-4 bg-secondary/15 rounded-xl border border-border/40 flex justify-between items-center select-none">
                <div className="space-y-1">
                  <span className="text-xs font-bold text-foreground block">SMS OTP Backup Channels</span>
                  <span className="text-[10px] text-muted-foreground block">Allow SMS delivery when TOTP is unavailable</span>
                </div>
                <span className="text-[10px] text-amber-500 font-bold bg-amber-500/10 px-2 py-0.5 rounded-lg">Disabled (Restricted)</span>
              </div>
            </div>
          ) : activeSubTab === 'ip' ? (
            /* IP whitelist restrictions */
            <div className="space-y-4">
              <div className="p-4 bg-secondary/15 rounded-xl border border-border/40 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-foreground">Active IP Whitelist Rules</span>
                  <button 
                    onClick={() => alert('Adding IP whitelist rule...')}
                    className="px-2.5 py-1 bg-primary text-primary-foreground text-[10px] font-bold rounded-lg cursor-pointer shadow"
                  >
                    Add IP Rule
                  </button>
                </div>
                <div className="divide-y divide-border/60">
                  <div className="py-2 flex justify-between items-center text-xs">
                    <span className="font-mono text-foreground font-semibold">192.168.1.0/24</span>
                    <span className="text-[10px] text-muted-foreground">Office LAN whitelisted</span>
                  </div>
                  <div className="py-2 flex justify-between items-center text-xs">
                    <span className="font-mono text-foreground font-semibold">203.0.113.88</span>
                    <span className="text-[10px] text-muted-foreground">Ananya Sharma (Home Static IP)</span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* Default: Security logs table */
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-secondary/40 select-none border-b border-border/60">
                  <tr>
                    <th className="p-3 font-semibold text-muted-foreground">Security Event</th>
                    <th className="p-3 font-semibold text-muted-foreground">Entity User</th>
                    <th className="p-3 font-semibold text-muted-foreground">IP Address</th>
                    <th className="p-3 font-semibold text-muted-foreground">Details</th>
                    <th className="p-3 font-semibold text-muted-foreground text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {securityLogs.map(log => (
                    <tr key={log.id} className="hover:bg-secondary/10 transition-colors">
                      <td className="p-3 font-semibold text-foreground">{log.event}</td>
                      <td className="p-3 text-muted-foreground">{log.user}</td>
                      <td className="p-3 font-mono text-muted-foreground">{log.ip}</td>
                      <td className="p-3 text-muted-foreground">{log.details}</td>
                      <td className="p-3 text-center border-l border-border/10">
                        <span className={`px-2 py-0.5 rounded text-[8px] font-bold ${
                          log.status === 'Blocked' ? 'bg-rose-500/10 text-rose-500' :
                          log.status === 'Flagged' ? 'bg-amber-500/10 text-amber-500' :
                          'bg-emerald-500/10 text-emerald-500'
                        }`}>
                          {log.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Right Column: Failed Logins Chart */}
        <div className="lg:col-span-4 bg-card border border-border/80 rounded-2xl p-5 shadow-sm space-y-4">
          <div>
            <span className="text-xs font-bold text-foreground uppercase tracking-wider block">Failed Logins Tracker</span>
            <p className="text-[9px] text-muted-foreground mt-0.5">Attempts frequency during this week</p>
          </div>
          
          <div className="h-44 w-full select-none">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={failedLoginData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(100, 116, 139, 0.1)" />
                <XAxis dataKey="day" stroke="rgba(100, 116, 139, 0.5)" fontSize={10} tickLine={false} />
                <YAxis stroke="rgba(100, 116, 139, 0.5)" fontSize={10} tickLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)' }}
                  itemStyle={{ fontSize: 11, color: 'var(--foreground)' }}
                />
                <Bar dataKey="attempts" name="Failed Attempts" fill="#ef4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

    </div>
  );
};
