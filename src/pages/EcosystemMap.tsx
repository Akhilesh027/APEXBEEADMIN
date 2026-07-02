import React, { useState, useEffect } from 'react';
import { Network, Activity, TrendingUp, Users, Layers, Sparkles } from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';

export const EcosystemMap: React.FC = () => {
  const [selectedNode, setSelectedNode] = useState<any>(null);

  // Real-time datasets from database
  const [franchisesList, setFranchisesList] = useState<any[]>([]);
  const [entrepreneursList, setEntrepreneursList] = useState<any[]>([]);
  const [vendorsList, setVendorsList] = useState<any[]>([]);
  const [territoriesList, setTerritoriesList] = useState<any[]>([]);
  const [usersList, setUsersList] = useState<any[]>([]);
  const [walletsList, setWalletsList] = useState<any[]>([]);

  // Selected state filter
  const [selectedState, setSelectedState] = useState<string>('Telangana');

  const fetchEcosystemData = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const headers: HeadersInit = token ? { Authorization: `Bearer ${token}` } : {};

      const [franchiseRes, entrepreneurRes, vendorRes, territoryRes, userRes, walletRes] = await Promise.all([
        fetch('https://server.apexbee.in/api/admin/franchises', { headers }),
        fetch('https://server.apexbee.in/api/admin/entrepreneurs', { headers }),
        fetch('https://server.apexbee.in/api/admin/vendors', { headers }),
        fetch('https://server.apexbee.in/api/admin/territories', { headers }),
        fetch('https://server.apexbee.in/api/admin/users', { headers }),
        fetch('https://server.apexbee.in/api/admin/wallets', { headers })
      ]);

      if (franchiseRes.ok && entrepreneurRes.ok && vendorRes.ok && territoryRes.ok && userRes.ok && walletRes.ok) {
        const franchiseData = await franchiseRes.json();
        const entrepreneurData = await entrepreneurRes.json();
        const vendorData = await vendorRes.json();
        const territoryData = await territoryRes.json();
        const userData = await userRes.json();
        const walletData = await walletRes.json();

        setFranchisesList(franchiseData.franchises || []);
        setEntrepreneursList(entrepreneurData.entrepreneurs || []);
        setVendorsList(vendorData.vendors || []);
        setTerritoriesList(territoryData.territories || []);
        setUsersList(userData.users || []);
        setWalletsList(walletData.wallets || []);
      }
    } catch (err) {
      console.error('Error fetching ecosystem data:', err);
    }
  };

  useEffect(() => {
    fetchEcosystemData();
  }, []);

  const getUniqueStates = () => {
    const states = new Set<string>();
    states.add('Telangana');
    states.add('Maharashtra');
    
    territoriesList.forEach(t => { if (t.state) states.add(t.state); });
    franchisesList.forEach(f => { if (f.state) states.add(f.state); });
    entrepreneursList.forEach(e => { if (e.state) states.add(e.state); });
    vendorsList.forEach(v => { if (v.state) states.add(v.state); });
    return Array.from(states);
  };

  const getWalletBalance = (franchiseId: string, ownerUserId: string) => {
    const wallet = walletsList.find((w: any) => 
      String(w.id || w.userId?._id || w.userId) === String(ownerUserId) || 
      String(w.id) === String(franchiseId)
    );
    return wallet ? (wallet.availableBalance + wallet.withdrawnBalance) : 0;
  };



  const stateFrans = franchisesList.filter(f => f.state?.toLowerCase() === selectedState.toLowerCase());
  const stateFranchiseObj = stateFrans.find(f => f.franchiseLevel === 'state' || f.level === 'state');
  
  const hasSF = !!stateFranchiseObj;
  const sfOperator = stateFranchiseObj ? stateFranchiseObj.ownerName : 'Pending Allocation';
  const sfBalance = stateFranchiseObj ? getWalletBalance(stateFranchiseObj._id, stateFranchiseObj.userId) : 0;

  const distFrans = stateFrans.filter(f => f.franchiseLevel === 'district' || f.level === 'district');
  const hasDF1 = distFrans.length > 0;
  const df1Obj = distFrans[0];
  const df1Name = df1Obj ? df1Obj.district : 'Unassigned';
  const df1Operator = df1Obj ? df1Obj.ownerName : 'Pending Allocation';
  const df1Balance = df1Obj ? getWalletBalance(df1Obj._id, df1Obj.userId) : 0;

  const hasDF2 = distFrans.length > 1;
  const df2Obj = distFrans[1];
  const df2Name = df2Obj ? df2Obj.district : 'Unassigned';
  const df2Operator = df2Obj ? df2Obj.ownerName : 'Pending Allocation';
  const df2Balance = df2Obj ? getWalletBalance(df2Obj._id, df2Obj.userId) : 0;

  const mandalFrans = stateFrans.filter(f => f.franchiseLevel === 'mandal' || f.level === 'mandal');
  const hasMF1 = mandalFrans.length > 0;
  const mf1Obj = mandalFrans[0];
  const mf1Name = mf1Obj ? mf1Obj.mandal : 'Unassigned';
  const mf1Operator = mf1Obj ? mf1Obj.ownerName : 'Pending Allocation';
  const mf1Balance = mf1Obj ? getWalletBalance(mf1Obj._id, mf1Obj.userId) : 0;

  const hasMF2 = mandalFrans.length > 1;
  const mf2Obj = mandalFrans[1];
  const mf2Name = mf2Obj ? mf2Obj.mandal : 'Unassigned';
  const mf2Operator = mf2Obj ? mf2Obj.ownerName : 'Pending Allocation';
  const mf2Balance = mf2Obj ? getWalletBalance(mf2Obj._id, mf2Obj.userId) : 0;

  const entsCount = entrepreneursList.filter(e => e.state?.toLowerCase() === selectedState.toLowerCase()).length;
  const vendsCount = vendorsList.filter(v => v.state?.toLowerCase() === selectedState.toLowerCase()).length;
  
  // Real count of customer role users mapped in the database for the selected state
  const custsCount = usersList.filter(u => 
    u.territory?.state?.toLowerCase() === selectedState.toLowerCase() && 
    (u.roles?.includes('customer') || u.roles?.length === 0)
  ).length;

  const getEcosystemNodes = () => {
    const stateRecord = territoriesList.find(t => t.state?.toLowerCase() === selectedState.toLowerCase() && (!t.district || t.district === ''));
    const stateDensity = stateRecord?.density || 'Low';

    return {
      'node-state': {
        id: 'node-state',
        name: hasSF ? `${selectedState} State Node (${stateFranchiseObj.businessName || stateFranchiseObj.ownerName})` : `${selectedState} State Node (Unassigned)`,
        role: 'State Node',
        operator: sfOperator,
        budget: hasSF ? `₹${sfBalance.toLocaleString('en-IN')} Commission` : '₹0.00 Balance',
        coverage: hasSF ? 'Active' : 'Unallocated',
        downstream: `${distFrans.length} Districts Mapped`,
        density: `${stateDensity} Density`,
        active: hasSF
      },
      'node-dist-1': {
        id: 'node-dist-1',
        name: hasDF1 ? `${df1Name} District Node` : 'District Node (Unassigned)',
        role: 'District Node',
        operator: df1Operator,
        budget: hasDF1 ? `₹${df1Balance.toLocaleString('en-IN')} Commission` : '₹0.00 Balance',
        coverage: hasDF1 ? 'Active' : 'Unallocated',
        downstream: `${mandalFrans.length} Mandals Mapped`,
        density: 'N/A',
        active: hasDF1
      },
      'node-dist-2': {
        id: 'node-dist-2',
        name: hasDF2 ? `${df2Name} District Node` : 'District Node (Unassigned)',
        role: 'District Node',
        operator: df2Operator,
        budget: hasDF2 ? `₹${df2Balance.toLocaleString('en-IN')} Commission` : '₹0.00 Balance',
        coverage: hasDF2 ? 'Active' : 'Unallocated',
        downstream: `${mandalFrans.length} Mandals Mapped`,
        density: 'N/A',
        active: hasDF2
      },
      'node-mandal-1': {
        id: 'node-mandal-1',
        name: hasMF1 ? `${mf1Name} Mandal Node` : 'Mandal Node (Unassigned)',
        role: 'Mandal Node',
        operator: mf1Operator,
        budget: hasMF1 ? `₹${mf1Balance.toLocaleString('en-IN')} Commission` : '₹0.00 Balance',
        coverage: hasMF1 ? 'Active' : 'Unallocated',
        downstream: `${entsCount} Entrepreneurs`,
        density: 'N/A',
        active: hasMF1
      },
      'node-mandal-2': {
        id: 'node-mandal-2',
        name: hasMF2 ? `${mf2Name} Mandal Node` : 'Mandal Node (Unassigned)',
        role: 'Mandal Node',
        operator: mf2Operator,
        budget: hasMF2 ? `₹${mf2Balance.toLocaleString('en-IN')} Commission` : '₹0.00 Balance',
        coverage: hasMF2 ? 'Active' : 'Unallocated',
        downstream: `${entsCount} Entrepreneurs`,
        density: 'N/A',
        active: hasMF2
      },
      'node-ent': {
        id: 'node-ent',
        name: `${selectedState} Entrepreneur Pool`,
        role: 'Field Lead Pool',
        operator: `${entsCount} Active Agents`,
        budget: 'Commission Share',
        coverage: entsCount > 0 ? 'Optimal' : 'Pending Onboarding',
        downstream: `${vendsCount} Onboarded Stores`,
        density: 'N/A',
        active: entsCount > 0
      },
      'node-vendor': {
        id: 'node-vendor',
        name: `${selectedState} Vendor Network`,
        role: 'Store Merchant Node',
        operator: `${vendsCount} Active Stores`,
        budget: 'Unified Checkout',
        coverage: vendsCount > 0 ? 'Local Delivery Active' : 'No Stores Live',
        downstream: `${custsCount} Consumers Mapped`,
        density: 'N/A',
        active: vendsCount > 0
      },
      'node-customer': {
        id: 'node-customer',
        name: `${selectedState} Buyer Base`,
        role: 'End User Base',
        operator: `${custsCount} Registered Buyers`,
        budget: 'Ecosystem GMV',
        coverage: custsCount > 0 ? 'Active Retention' : 'No Buyers Mapped',
        downstream: 'N/A',
        density: 'N/A',
        active: custsCount > 0
      }
    };
  };

  const nodesMap = getEcosystemNodes();

  // Dynamic real growth curve aggregated from DB createdAt timestamps
  const getDynamicGrowthData = () => {
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthlyCounts: Record<string, { customers: number; monthIndex: number }> = {};
    
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const name = monthNames[d.getMonth()] || '';
      monthlyCounts[name] = { customers: 0, monthIndex: d.getMonth() };
    }

    const stateCustomers = usersList.filter(u => 
      u.territory?.state?.toLowerCase() === selectedState.toLowerCase() &&
      (u.roles?.includes('customer') || u.roles?.length === 0)
    );

    stateCustomers.forEach(u => {
      if (!u.createdAt) return;
      const d = new Date(u.createdAt);
      const name = monthNames[d.getMonth()] || '';
      if (monthlyCounts[name] !== undefined) {
        monthlyCounts[name].customers += 1;
      }
    });

    let runningSum = 0;
    const sorted = Object.entries(monthlyCounts).sort((a: any, b: any) => {
      return a[1].monthIndex - b[1].monthIndex;
    });

    return sorted.map(([month, data]) => {
      runningSum += data.customers;
      return {
        month,
        customers: runningSum
      };
    });
  };

  const growthData = getDynamicGrowthData();

  const stateFransCount = franchisesList.filter(f => f.franchiseLevel === 'state' || f.level === 'state').length;

  return (
    <div className="space-y-6">
      
      {/* Top Expansion stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 select-none">
        <div className="bg-card border border-border/80 rounded-2xl p-4 flex items-center justify-between shadow-sm">
          <div>
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">State Nodes</span>
            <span className="text-xl font-bold font-mono text-foreground mt-1 block">
              {stateFransCount} Active
            </span>
            <span className="text-[9px] text-emerald-500 mt-1 block font-semibold">Live Database Records</span>
          </div>
          <Layers className="text-primary shrink-0" size={24} />
        </div>
        <div className="bg-card border border-border/80 rounded-2xl p-4 flex items-center justify-between shadow-sm">
          <div>
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Franchise Nodes</span>
            <span className="text-xl font-bold font-mono text-foreground mt-1 block">
              {franchisesList.length} Total
            </span>
            <span className="text-[9px] text-emerald-500 mt-1 block font-semibold">Live Database Records</span>
          </div>
          <Network className="text-violet-500 shrink-0" size={24} />
        </div>
        <div className="bg-card border border-border/80 rounded-2xl p-4 flex items-center justify-between shadow-sm">
          <div>
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Entrepreneurs</span>
            <span className="text-xl font-bold font-mono text-foreground mt-1 block">
              {entrepreneursList.length} Active
            </span>
            <span className="text-[9px] text-emerald-500 mt-1 block font-semibold">Live Database Records</span>
          </div>
          <Users className="text-amber-500 shrink-0" size={24} />
        </div>
        <div className="bg-card border border-border/80 rounded-2xl p-4 flex items-center justify-between shadow-sm">
          <div>
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Vendors Onboarded</span>
            <span className="text-xl font-bold font-mono text-foreground mt-1 block">
              {vendorsList.length} Stores
            </span>
            <span className="text-[9px] text-emerald-500 mt-1 block font-semibold">Live Database Records</span>
          </div>
          <Activity className="text-emerald-500 shrink-0" size={24} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left: Ecosystem Map Network tree graph - 7 Columns */}
        <div className="lg:col-span-7 bg-card border border-border/80 rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div>
              <h3 className="text-sm font-bold text-foreground">Visual Network Tree</h3>
              <p className="text-[10px] text-muted-foreground mt-0.5">Click any node to inspect budget and downstream allocation metrics</p>
            </div>
            <div className="flex items-center gap-2 select-none">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Region State:</span>
              <select
                value={selectedState}
                onChange={(e) => {
                  setSelectedState(e.target.value);
                  setSelectedNode(null);
                }}
                className="text-xs p-1.5 border border-border/80 focus:border-primary rounded-xl bg-secondary/15 text-foreground outline-none font-semibold cursor-pointer"
              >
                {getUniqueStates().map(st => (
                  <option key={st} value={st}>{st}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Interactive Network Graph inside SVG container */}
          <div className="bg-secondary/15 rounded-xl border border-border/40 p-4 min-h-[400px] flex items-center justify-center relative select-none">
            <svg width="360" height="360" viewBox="0 0 360 360" className="drop-shadow-md">
              {/* Connection Lines */}
              <line x1="180" y1="30" x2="100" y2="100" stroke="var(--border)" strokeWidth="1.5" strokeOpacity={hasSF && hasDF1 ? 1 : 0.3} />
              <line x1="180" y1="30" x2="260" y2="100" stroke="var(--border)" strokeWidth="1.5" strokeOpacity={hasSF && hasDF2 ? 1 : 0.3} />
              
              <line x1="100" y1="100" x2="50" y2="170" stroke="var(--border)" strokeWidth="1.5" strokeOpacity={hasDF1 && hasMF1 ? 1 : 0.3} />
              <line x1="100" y1="100" x2="150" y2="170" stroke="var(--border)" strokeWidth="1.5" strokeOpacity={hasDF1 && hasMF2 ? 1 : 0.3} />
              
              <line x1="50" y1="170" x2="180" y2="240" stroke="var(--border)" strokeWidth="1.5" strokeDasharray="3,3" strokeOpacity={hasMF1 && entsCount > 0 ? 1 : 0.3} />
              <line x1="150" y1="170" x2="180" y2="240" stroke="var(--border)" strokeWidth="1.5" strokeDasharray="3,3" strokeOpacity={hasMF2 && entsCount > 0 ? 1 : 0.3} />
              
              <line x1="260" y1="100" x2="180" y2="240" stroke="var(--border)" strokeWidth="1.5" strokeDasharray="3,3" strokeOpacity={hasDF2 && entsCount > 0 ? 1 : 0.3} />
              
              <line x1="180" y1="240" x2="180" y2="290" stroke="var(--border)" strokeWidth="1.5" strokeOpacity={entsCount > 0 && vendsCount > 0 ? 1 : 0.3} />
              <line x1="180" y1="290" x2="180" y2="340" stroke="var(--border)" strokeWidth="1.5" strokeOpacity={vendsCount > 0 && custsCount > 0 ? 1 : 0.3} />

              {/* Node Circles/Glows */}
              {/* State Franchise Node */}
              <circle
                cx="180" cy="30" r="16"
                fill={hasSF ? "#6366f1" : "#4b5563"}
                fillOpacity={selectedNode?.id === 'node-state' ? 0.9 : 0.5}
                className="cursor-pointer hover:fill-opacity-95 transition-all"
                onClick={() => setSelectedNode(nodesMap['node-state'])}
              />
              <text x="180" y="33" fill="white" textAnchor="middle" className="text-[7px] font-bold pointer-events-none uppercase">SF</text>
              <text x="180" y="56" fill={hasSF ? "var(--foreground)" : "var(--text-muted-foreground)"} textAnchor="middle" className="text-[8px] font-bold pointer-events-none">{selectedState}</text>

              {/* District Franchise 1 Node */}
              <circle
                cx="100" cy="100" r="14"
                fill={hasDF1 ? "#3b82f6" : "#4b5563"}
                fillOpacity={selectedNode?.id === 'node-dist-1' ? 0.9 : 0.5}
                className="cursor-pointer hover:fill-opacity-95 transition-all"
                onClick={() => setSelectedNode(nodesMap['node-dist-1'])}
              />
              <text x="100" y="103" fill="white" textAnchor="middle" className="text-[6px] font-bold pointer-events-none uppercase">DF1</text>
              <text x="100" y="124" fill={hasDF1 ? "var(--foreground)" : "var(--text-muted-foreground)"} textAnchor="middle" className="text-[7px] font-semibold pointer-events-none truncate">{df1Name}</text>

              {/* District Franchise 2 Node */}
              <circle
                cx="260" cy="100" r="14"
                fill={hasDF2 ? "#3b82f6" : "#4b5563"}
                fillOpacity={selectedNode?.id === 'node-dist-2' ? 0.9 : 0.5}
                className="cursor-pointer hover:fill-opacity-95 transition-all"
                onClick={() => setSelectedNode(nodesMap['node-dist-2'])}
              />
              <text x="260" y="103" fill="white" textAnchor="middle" className="text-[6px] font-bold pointer-events-none uppercase">DF2</text>
              <text x="260" y="124" fill={hasDF2 ? "var(--foreground)" : "var(--text-muted-foreground)"} textAnchor="middle" className="text-[7px] font-semibold pointer-events-none truncate">{df2Name}</text>

              {/* Mandal Franchise 1 Node */}
              <circle
                cx="50" cy="170" r="12"
                fill={hasMF1 ? "#10b981" : "#4b5563"}
                fillOpacity={selectedNode?.id === 'node-mandal-1' ? 0.9 : 0.5}
                className="cursor-pointer hover:fill-opacity-95 transition-all"
                onClick={() => setSelectedNode(nodesMap['node-mandal-1'])}
              />
              <text x="50" y="173" fill="white" textAnchor="middle" className="text-[5px] font-bold pointer-events-none uppercase">MF1</text>
              <text x="50" y="192" fill={hasMF1 ? "var(--foreground)" : "var(--text-muted-foreground)"} textAnchor="middle" className="text-[7px] font-semibold pointer-events-none truncate">{mf1Name}</text>

              {/* Mandal Franchise 2 Node */}
              <circle
                cx="150" cy="170" r="12"
                fill={hasMF2 ? "#10b981" : "#4b5563"}
                fillOpacity={selectedNode?.id === 'node-mandal-2' ? 0.9 : 0.5}
                className="cursor-pointer hover:fill-opacity-95 transition-all"
                onClick={() => setSelectedNode(nodesMap['node-mandal-2'])}
              />
              <text x="150" y="173" fill="white" textAnchor="middle" className="text-[5px] font-bold pointer-events-none uppercase">MF2</text>
              <text x="150" y="192" fill={hasMF2 ? "var(--foreground)" : "var(--text-muted-foreground)"} textAnchor="middle" className="text-[7px] font-semibold pointer-events-none truncate">{mf2Name}</text>

              {/* Entrepreneurs Node */}
              <circle
                cx="180" cy="240" r="14"
                fill={entsCount > 0 ? "#f59e0b" : "#4b5563"}
                fillOpacity={selectedNode?.id === 'node-ent' ? 0.9 : 0.5}
                className="cursor-pointer hover:fill-opacity-95 transition-all"
                onClick={() => setSelectedNode(nodesMap['node-ent'])}
              />
              <text x="180" y="243" fill="white" textAnchor="middle" className="text-[6px] font-bold pointer-events-none uppercase">ENT</text>
              <text x="202" y="244" fill={entsCount > 0 ? "var(--foreground)" : "var(--text-muted-foreground)"} textAnchor="start" className="text-[8px] font-semibold pointer-events-none">Agents ({entsCount})</text>

              {/* Vendors Node */}
              <circle
                cx="180" cy="290" r="14"
                fill={vendsCount > 0 ? "#a855f7" : "#4b5563"}
                fillOpacity={selectedNode?.id === 'node-vendor' ? 0.9 : 0.5}
                className="cursor-pointer hover:fill-opacity-95 transition-all"
                onClick={() => setSelectedNode(nodesMap['node-vendor'])}
              />
              <text x="180" y="293" fill="white" textAnchor="middle" className="text-[6px] font-bold pointer-events-none uppercase">VEN</text>
              <text x="202" y="294" fill={vendsCount > 0 ? "var(--foreground)" : "var(--text-muted-foreground)"} textAnchor="start" className="text-[8px] font-semibold pointer-events-none">Stores ({vendsCount})</text>

              {/* Customers Node */}
              <circle
                cx="180" cy="340" r="14"
                fill={custsCount > 0 ? "#ec4899" : "#4b5563"}
                fillOpacity={selectedNode?.id === 'node-customer' ? 0.9 : 0.5}
                className="cursor-pointer hover:fill-opacity-95 transition-all"
                onClick={() => setSelectedNode(nodesMap['node-customer'])}
              />
              <text x="180" y="343" fill="white" textAnchor="middle" className="text-[6px] font-bold pointer-events-none uppercase">CST</text>
              <text x="202" y="344" fill={custsCount > 0 ? "var(--foreground)" : "var(--text-muted-foreground)"} textAnchor="start" className="text-[8px] font-semibold pointer-events-none">Buyers ({custsCount})</text>
            </svg>
            
            <div className="absolute top-3 left-3 bg-card/85 border border-border/50 backdrop-blur rounded-lg p-2.5 space-y-1 text-[8px] font-semibold text-muted-foreground select-none">
              <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>State Node (SF)</span>
              <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>District Node (DF)</span>
              <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>Mandal Node (MF)</span>
              <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>Entrepreneurs (ENT)</span>
              <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-purple-500"></span>Vendors (VEN)</span>
              <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-pink-500"></span>Customers (CST)</span>
            </div>
          </div>
        </div>

        {/* Right: Node details & Growth chart - 5 Columns */}
        <div className="lg:col-span-5 space-y-6">
          {/* Node specifications widget */}
          <div className="bg-card border border-border/80 rounded-2xl p-5 shadow-sm min-h-[180px] flex flex-col justify-between">
            {selectedNode ? (
              <div className="space-y-3 animate-fadeIn">
                <div className="border-b border-border pb-2 flex justify-between items-center">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-foreground">{selectedNode.name}</h4>
                  <span className="text-[9px] font-mono text-primary bg-primary/10 px-2 py-0.5 rounded-lg">{selectedNode.role}</span>
                </div>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between border-b border-border/40 pb-1"><span className="text-muted-foreground">Managing Operator</span><span className={`font-semibold ${selectedNode.active ? 'text-foreground' : 'text-muted-foreground'}`}>{selectedNode.operator}</span></div>
                  <div className="flex justify-between border-b border-border/40 pb-1"><span className="text-muted-foreground">Associated Revenue/Hold</span><span className={`font-semibold ${selectedNode.active ? 'text-foreground' : 'text-muted-foreground'}`}>{selectedNode.budget}</span></div>
                  <div className="flex justify-between border-b border-border/40 pb-1"><span className="text-muted-foreground">Downstream Allocation</span><span className={`font-semibold ${selectedNode.active ? 'text-foreground' : 'text-muted-foreground'}`}>{selectedNode.downstream}</span></div>
                  {selectedNode.density && selectedNode.density !== 'N/A' && (
                    <div className="flex justify-between border-b border-border/40 pb-1"><span className="text-muted-foreground">Density Status</span><span className={`font-semibold ${selectedNode.active ? 'text-foreground' : 'text-muted-foreground'}`}>{selectedNode.density}</span></div>
                  )}
                  <div className="flex justify-between"><span className="text-muted-foreground">Ecosystem Health</span><span className={`font-semibold ${selectedNode.active ? 'text-emerald-500' : 'text-muted-foreground'}`}>{selectedNode.coverage}</span></div>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center text-xs text-muted-foreground py-6 space-y-2">
                <Sparkles size={24} className="text-primary animate-pulse" />
                <p>Click any colored node in the visual network tree graph to audit its operational specifications.</p>
              </div>
            )}
          </div>

          {/* Network growth chart */}
          <div className="bg-card border border-border/80 rounded-2xl p-5 shadow-sm flex flex-col justify-between">
            <div>
              <h3 className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5">
                <TrendingUp size={14} className="text-primary" />
                Ecosystem Expansion Growth
              </h3>
              <p className="text-[10px] text-muted-foreground mt-0.5">Growth curve of registered customer nodes</p>
            </div>
            
            {custsCount === 0 ? (
              <div className="h-44 flex flex-col items-center justify-center text-center text-xs text-muted-foreground bg-secondary/5 border border-border/40 rounded-xl mt-4">
                <TrendingUp size={18} className="text-muted-foreground/50 mb-1" />
                <p>No customer growth records found in this state.</p>
              </div>
            ) : (
              <div className="h-44 w-full mt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={growthData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorCustomers" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#ec4899" stopOpacity={0.2}/>
                        <stop offset="95%" stopColor="#ec4899" stopOpacity={0}/>
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
                    <Area type="monotone" dataKey="customers" name="Customers" stroke="#ec4899" strokeWidth={2} fillOpacity={1} fill="url(#colorCustomers)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </div>

      </div>

    </div>
  );
};
