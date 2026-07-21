import React, { useEffect, useState } from 'react';
import {
  Network,
  Shield,
  ChevronRight,
  ChevronDown,
  Store,
  TrendingUp,
  Landmark
} from 'lucide-react';

interface BackendFranchise {
  _id: string | { $oid: string };
  userId?: string | { $oid: string };
  franchiseCode?: string;
  franchiseLevel: 'state' | 'district' | 'mandal';
  businessName: string;
  ownerName: string;
  mobile: string;
  email: string;
  state: string;
  district?: string;
  mandal?: string;
  parentFranchiseId?: string | { $oid: string } | null;
  kycStatus?: string;
  status?: 'active' | 'inactive' | 'pending_verification';
  createdAt?: string;
  totalVendors?: number;
  totalEntrepreneurs?: number;
}

interface FranchiseNode {
  id: string;
  name: string;
  ownerName: string;
  franchiseCode?: string;
  level: 'state' | 'district' | 'mandal';
  state: string;
  district?: string;
  mandal?: string;
  parentId: string | null;
  status?: string;
  kycStatus?: string;
  mobile: string;
  email: string;
  usersCount: number;
  vendorsCount: number;
  ordersCount: number;
  networkGrowth: number;
  commissionsEarned: number;
}

export const FranchiseNetwork: React.FC = () => {
  const [franchises, setFranchises] = useState<FranchiseNode[]>([]);
  const [selectedNode, setSelectedNode] = useState<FranchiseNode | null>(null);
  const [loading, setLoading] = useState(true);

  const [expandedStates, setExpandedStates] = useState<Record<string, boolean>>({});

  const token = localStorage.getItem('adminToken');

  const getId = (value: any): string => {
    if (!value) return '';
    if (typeof value === 'string') return value;
    if (value.$oid) return value.$oid;
    return String(value);
  };

  const normalizeFranchise = (item: BackendFranchise): FranchiseNode => ({
    id: getId(item._id),
    franchiseCode: item.franchiseCode,
    name: item.businessName,
    ownerName: item.ownerName,
    mobile: item.mobile,
    email: item.email,
    level: item.franchiseLevel,
    state: item.state,
    district: item.district || '',
    mandal: item.mandal || '',
    parentId: item.parentFranchiseId ? getId(item.parentFranchiseId) : null,
    status: item.status || 'pending_verification',
    kycStatus: item.kycStatus || 'Pending Verification',
    usersCount: item.totalEntrepreneurs || 0,
    vendorsCount: item.totalVendors || 0,
    ordersCount: 0,
    networkGrowth: 0,
    commissionsEarned: 0
  });

  useEffect(() => {
    fetchFranchiseNetwork();
  }, []);

  const fetchFranchiseNetwork = async () => {
    try {
      setLoading(true);

      const [fRes, wRes] = await Promise.all([
        fetch('https://server.apexbee.in/api/admin/franchises', {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }),
        fetch('https://server.apexbee.in/api/admin/wallets', {
          headers: {
            Authorization: `Bearer ${token}`
          }
        })
      ]);

      const fData = await fRes.json();
      const wData = wRes.ok ? await wRes.json() : { wallets: [] };

      if (!fRes.ok) {
        throw new Error(fData.message || 'Failed to fetch franchises list');
      }

      const list: BackendFranchise[] = fData.franchises || [];
      const walletsList = wData.wallets || [];

      const mapped = list.map(item => {
        const node = normalizeFranchise(item);
        // Match wallet using ownerId or matching item's userId field
        const targetUserId = item.userId ? (typeof item.userId === 'string' ? item.userId : item.userId.$oid) : '';
        const wallet = walletsList.find((w: any) => String(w.id || w.userId?._id || w.userId) === String(targetUserId || item._id));
        if (wallet) {
          node.commissionsEarned = Number((wallet.availableBalance + wallet.withdrawnBalance).toFixed(2));
        }
        return node;
      });

      setFranchises(mapped);

      if (mapped.length > 0) {
        setSelectedNode(mapped[0] || null);

        const defaultExpanded: Record<string, boolean> = {};
        mapped.forEach(item => {
          if (item.level === 'state' || item.level === 'district') {
            defaultExpanded[item.id] = true;
          }
        });

        setExpandedStates(defaultExpanded);
      }
    } catch (error) {
      console.error('Franchise network fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleExpand = (id: string) => {
    setExpandedStates(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const stateFrans = franchises.filter(f => f.level === 'state');

  const getDistrictsForState = (stateId: string) =>
    franchises.filter(f => f.parentId === stateId && f.level === 'district');

  const getMandalsForDistrict = (distId: string) =>
    franchises.filter(f => f.parentId === distId && f.level === 'mandal');

  const formatStatus = (status?: string) => {
    if (status === 'active') return 'Active';
    if (status === 'inactive') return 'Inactive';
    return 'Pending Verification';
  };

  if (loading) {
    return (
      <div className="bg-card border border-border/80 rounded-2xl p-8 text-center text-xs text-muted-foreground">
        Loading franchise network...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-card border border-border/80 rounded-2xl p-4 shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Network className="text-primary shrink-0" size={24} />
          <div>
            <h2 className="text-xs font-bold uppercase tracking-wider text-foreground">
              Franchise Hierarchy Matrix
            </h2>
            <p className="text-[10px] text-muted-foreground mt-0.5">
              State, District and Mandal franchise network from backend.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-5 bg-card border border-border/80 rounded-2xl p-5 shadow-sm space-y-4">
          <h3 className="text-xs font-bold text-foreground uppercase tracking-wider border-b border-border pb-3">
            Platform Network Nodes
          </h3>

          <div className="space-y-2 select-none">
            {stateFrans.length === 0 && (
              <p className="text-xs text-muted-foreground">
                No state franchise found.
              </p>
            )}

            {stateFrans.map(state => {
              const districts = getDistrictsForState(state.id);
              const isStateExpanded = !!expandedStates[state.id];

              return (
                <div key={state.id} className="space-y-1">
                  <div
                    onClick={() => setSelectedNode(state)}
                    className={`flex items-center justify-between p-2.5 rounded-xl cursor-pointer hover:bg-secondary/40 transition-all ${selectedNode?.id === state.id
                      ? 'bg-secondary/50 font-bold border-l-4 border-indigo-500'
                      : ''
                      }`}
                  >
                    <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
                      <button
                        onClick={e => {
                          e.stopPropagation();
                          toggleExpand(state.id);
                        }}
                        className="p-1 hover:bg-secondary rounded text-muted-foreground"
                      >
                        {isStateExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                      </button>

                      <Landmark size={14} className="text-indigo-500 shrink-0" />
                      <span>{state.name}</span>
                    </div>

                    <span className="text-[9px] bg-indigo-500/10 text-indigo-500 font-bold px-1.5 py-0.5 rounded-md">
                      State
                    </span>
                  </div>

                  {isStateExpanded &&
                    districts.map(dist => {
                      const mandals = getMandalsForDistrict(dist.id);
                      const isDistExpanded = !!expandedStates[dist.id];

                      return (
                        <div key={dist.id} className="pl-6 space-y-1">
                          <div
                            onClick={() => setSelectedNode(dist)}
                            className={`flex items-center justify-between p-2 rounded-xl cursor-pointer hover:bg-secondary/40 transition-all ${selectedNode?.id === dist.id
                              ? 'bg-secondary/50 font-bold border-l-4 border-amber-500'
                              : ''
                              }`}
                          >
                            <div className="flex items-center gap-2 text-xs font-medium text-foreground">
                              <button
                                onClick={e => {
                                  e.stopPropagation();
                                  toggleExpand(dist.id);
                                }}
                                className="p-0.5 hover:bg-secondary rounded text-muted-foreground"
                              >
                                {isDistExpanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                              </button>

                              <Shield size={13} className="text-amber-500 shrink-0" />
                              <span>{dist.name}</span>
                            </div>

                            <span className="text-[9px] bg-amber-500/10 text-amber-500 font-semibold px-1.5 py-0.5 rounded-md">
                              District
                            </span>
                          </div>

                          {isDistExpanded &&
                            mandals.map(mandal => (
                              <div
                                key={mandal.id}
                                onClick={() => setSelectedNode(mandal)}
                                className={`pl-8 flex items-center justify-between p-1.5 rounded-xl cursor-pointer hover:bg-secondary/40 transition-all ${selectedNode?.id === mandal.id
                                  ? 'bg-secondary/50 font-bold border-l-4 border-emerald-500'
                                  : ''
                                  }`}
                              >
                                <div className="flex items-center gap-2 text-xs text-foreground">
                                  <Landmark size={12} className="text-emerald-500 shrink-0" />
                                  <span>{mandal.name}</span>
                                </div>

                                <span className="text-[9px] bg-emerald-500/10 text-emerald-500 font-normal px-1.5 py-0.5 rounded-md">
                                  Mandal
                                </span>
                              </div>
                            ))}
                        </div>
                      );
                    })}
                </div>
              );
            })}
          </div>
        </div>

        {selectedNode ? (
          <div className="lg:col-span-7 bg-card border border-border/80 rounded-2xl p-5 shadow-sm space-y-5">
            <div className="flex justify-between items-center border-b border-border pb-4">
              <div>
                <h3 className="text-sm font-bold text-foreground">
                  {selectedNode.name}
                </h3>
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  Manager:{' '}
                  <span className="font-semibold text-foreground">
                    {selectedNode.ownerName}
                  </span>{' '}
                  • Code: {selectedNode.franchiseCode || selectedNode.id}
                </p>
              </div>

              <div className="flex items-center gap-2 select-none">
                <span
                  className={`px-2.5 py-1 text-[10px] font-bold rounded-lg ${selectedNode.status === 'active'
                    ? 'bg-emerald-500/10 text-emerald-500'
                    : selectedNode.status === 'inactive'
                      ? 'bg-rose-500/10 text-rose-500'
                      : 'bg-amber-500/10 text-amber-500'
                    }`}
                >
                  {formatStatus(selectedNode.status)}
                </span>

                <span className="px-2.5 py-1 bg-secondary border border-border/80 rounded-lg text-[10px] font-bold text-foreground capitalize">
                  Level: {selectedNode.level}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="bg-secondary/15 p-3 rounded-xl border border-border/40 text-center">
                <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider block">
                  State
                </span>
                <span className="font-mono text-xs font-bold text-foreground block mt-1">
                  {selectedNode.state}
                </span>
              </div>

              <div className="bg-secondary/15 p-3 rounded-xl border border-border/40 text-center">
                <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider block">
                  District
                </span>
                <span className="font-mono text-xs font-bold text-foreground block mt-1">
                  {selectedNode.district || '-'}
                </span>
              </div>

              <div className="bg-secondary/15 p-3 rounded-xl border border-border/40 text-center">
                <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider block">
                  Mandal
                </span>
                <span className="font-mono text-xs font-bold text-foreground block mt-1">
                  {selectedNode.mandal || '-'}
                </span>
              </div>

              <div className="bg-secondary/15 p-3 rounded-xl border border-border/40 text-center">
                <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider block">
                  KYC
                </span>
                <span className="font-mono text-xs font-bold text-emerald-500 block mt-1">
                  {selectedNode.kycStatus}
                </span>
              </div>
            </div>

            <div className="bg-secondary/10 p-4 rounded-xl border border-border/40">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
                Contact Details
              </span>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3 text-xs">
                <div>
                  <p className="text-muted-foreground">Mobile</p>
                  <p className="font-semibold text-foreground">{selectedNode.mobile}</p>
                </div>

                <div>
                  <p className="text-muted-foreground">Email</p>
                  <p className="font-semibold text-foreground">{selectedNode.email}</p>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
                Network Preview
              </span>

              <div className="space-y-2">
                <div className="bg-card p-3 border border-border/60 rounded-xl flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <Store size={14} className="text-muted-foreground shrink-0" />
                    <div>
                      <p className="font-semibold text-foreground">
                        Sub Franchises
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        Direct child nodes under this franchise
                      </p>
                    </div>
                  </div>

                  <p className="font-semibold text-foreground font-mono">
                    {
                      franchises.filter(f => f.parentId === selectedNode.id)
                        .length
                    }
                  </p>
                </div>

                <div className="bg-card p-3 border border-border/60 rounded-xl flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <TrendingUp size={14} className="text-muted-foreground shrink-0" />
                    <div>
                      <p className="font-semibold text-foreground">
                        Network Status
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        Backend synced franchise approval status
                      </p>
                    </div>
                  </div>

                  <p className="font-semibold text-foreground capitalize">
                    {formatStatus(selectedNode.status)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="lg:col-span-7 flex flex-col items-center justify-center py-20 text-center text-xs text-muted-foreground select-none">
            Select a franchise node from the tree.
          </div>
        )}
      </div>
    </div>
  );
};