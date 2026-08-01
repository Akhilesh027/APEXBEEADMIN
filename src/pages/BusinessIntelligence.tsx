import React, { useEffect, useState, useCallback } from 'react';
import {
  BarChart2, ShoppingCart, Eye, Users, BookOpen, TrendingUp,
  Sparkles, RefreshCw, GraduationCap, Star, Activity,
  Package, AlertCircle, CheckCircle, MousePointer2, Layers
} from 'lucide-react';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Cell, PieChart, Pie, Legend, AreaChart, Area
} from 'recharts';

const API_BASE = 'https://server.apexbee.in/api';

const getHeaders = () => {
  const token = localStorage.getItem('adminToken') || localStorage.getItem('token');
  return { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };
};

const fmt = (n: number) =>
  n >= 1_00_000 ? `${(n / 1_00_000).toFixed(1)}L`
    : n >= 1000 ? `${(n / 1000).toFixed(1)}k`
      : String(n);

const COLORS = [
  '#6366f1', '#10b981', '#f59e0b', '#ef4444', '#3b82f6',
  '#8b5cf6', '#ec4899', '#14b8a6', '#f97316', '#84cc16',
];

const Stat = ({ label, value, icon: Icon, color = 'text-primary', bg = 'bg-primary/10' }: any) => (
  <div className="bg-card border border-border/80 rounded-2xl p-4 flex flex-col gap-2 shadow-sm">
    <div className="flex items-center justify-between">
      <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{label}</span>
      <span className={`p-1.5 rounded-xl ${bg}`}><Icon size={13} className={color} /></span>
    </div>
    <span className="text-2xl font-black text-foreground font-mono">{value}</span>
  </div>
);

const SectionHead = ({ icon: Icon, title, sub, color = 'text-primary' }: any) => (
  <div className="flex items-center gap-2 border-b border-border pb-3 mb-4">
    <Icon size={16} className={color} />
    <div>
      <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">{title}</h3>
      {sub && <p className="text-[10px] text-muted-foreground mt-0.5">{sub}</p>}
    </div>
  </div>
);

const EmptyState = ({ icon: Icon, message }: any) => (
  <div className="flex flex-col items-center justify-center h-52 text-muted-foreground text-xs gap-2">
    <Icon size={28} className="opacity-40" />
    {message}
  </div>
);

type Tab = 'categories' | 'academy' | 'cart';

export const BusinessIntelligence: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tab, setTab] = useState<Tab>('categories');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API_BASE}/admin/bi/stats`, { headers: getHeaders() });
      if (!res.ok) throw new Error(`HTTP ${res.status} — make sure you are logged in as admin`);
      const json = await res.json();
      if (!json.success) throw new Error(json.error || 'Failed to load BI data');
      setData(json);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // ── Derived data ──────────────────────────────────────────────────────────
  const topCategories = data?.categoryClicks?.topCategories || [];
  const clicksByDay = data?.categoryClicks?.clicksByDay || [];
  const clicksBySource = data?.categoryClicks?.clicksBySource || [];

  const academyFunnel = data ? [
    { stage: 'Viewed', count: data.academy.totalViews },
    { stage: 'OTP Sent', count: data.academy.otpRequests },
    { stage: 'OTP Verified', count: data.academy.otpVerifications },
    { stage: 'Submitted', count: data.academy.totalLeads },
  ] : [];

  const academyLeadPie = data ? [
    { name: 'Entrepreneur', value: data.academy.entrepreneurLeads },
    { name: 'Skill Dev', value: data.academy.skillLeads },
  ] : [];

  const topInterests = (data?.academy?.popularInterests || []).map((i: any) => ({
    name: i._id?.replace(/_/g, ' '),
    count: i.count,
  }));

  const topCarted = (data?.cart?.topCartedProducts || []).map((p: any) => ({
    name: p.name?.length > 18 ? p.name.slice(0, 18) + '…' : p.name,
    timesAdded: p.timesAdded,
    qty: p.totalQuantity,
  }));

  const tabs: { key: Tab; label: string; icon: any }[] = [
    { key: 'categories', label: 'Category Clicks', icon: MousePointer2 },
    { key: 'academy', label: 'Academy Analytics', icon: GraduationCap },
    { key: 'cart', label: 'Cart Analytics', icon: ShoppingCart },
  ];

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex justify-between items-center bg-card border border-border/80 rounded-2xl p-4 shadow-sm">
        <div>
          <h2 className="text-sm font-bold text-foreground uppercase tracking-wider flex items-center gap-2">
            <BarChart2 size={16} className="text-primary" /> Business Intelligence
          </h2>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            Real-time category click analytics, Academy leads pipeline, and cart behaviour data
          </p>
        </div>
        <button
          onClick={load}
          disabled={loading}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary/10 text-primary text-xs font-semibold hover:bg-primary/20 transition-colors disabled:opacity-50"
        >
          <RefreshCw size={12} className={loading ? 'animate-spin' : ''} /> Refresh
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-400 text-xs">
          <AlertCircle size={14} /> {error}
        </div>
      )}

      {loading && !data && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array(8).fill(0).map((_, i) => (
            <div key={i} className="bg-card border border-border/80 rounded-2xl p-4 h-24 animate-pulse" />
          ))}
        </div>
      )}

      {data && (
        <>
          {/* Tabs */}
          <div className="flex gap-2 bg-card border border-border/80 rounded-2xl p-1.5 w-fit shadow-sm flex-wrap">
            {tabs.map(t => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-xs font-semibold transition-colors ${tab === t.key
                    ? 'bg-primary text-white shadow'
                    : 'text-muted-foreground hover:bg-secondary/40'
                  }`}
              >
                <t.icon size={13} /> {t.label}
              </button>
            ))}
          </div>

          {/* ═══════════════════════════════════════════
              CATEGORY CLICKS TAB
          ═══════════════════════════════════════════ */}
          {tab === 'categories' && (
            <div className="space-y-6">
              {/* Stats */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <Stat label="Total Category Clicks" value={fmt(data.categoryClicks.total)} icon={MousePointer2} color="text-primary" bg="bg-primary/10" />
                <Stat label="Unique Visitors" value={fmt(data.categoryClicks.uniqueVisitors)} icon={Users} color="text-emerald-500" bg="bg-emerald-500/10" />
                <Stat label="Top Category" value={topCategories[0]?.categoryName || '—'} icon={Star} color="text-amber-500" bg="bg-amber-500/10" />
                <Stat label="Category Surfaces" value={clicksBySource.length} icon={Layers} color="text-violet-500" bg="bg-violet-500/10" />
              </div>

              {/* Top Categories Bar + Daily Trend */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Top categories */}
                <div className="bg-card border border-border/80 rounded-2xl p-5 shadow-sm">
                  <SectionHead icon={BarChart2} title="Top Clicked Categories" sub="Which categories users click the most on the platform" />
                  {topCategories.length === 0 ? (
                    <EmptyState icon={MousePointer2} message="No category clicks recorded yet. Start browsing on the portal!" />
                  ) : (
                    <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1">
                      {topCategories.map((cat: any, i: number) => (
                        <div key={i} className="flex items-center gap-3">
                          <span className="text-[10px] font-bold text-muted-foreground w-5 shrink-0 text-right">{i + 1}</span>
                          <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-center mb-1">
                              <span className="text-xs font-semibold text-foreground truncate">{cat.categoryName}</span>
                              <span className="text-xs font-black text-muted-foreground ml-2 shrink-0 font-mono">{cat.clicks}</span>
                            </div>
                            <div className="h-2 bg-secondary/30 rounded-full overflow-hidden">
                              <div
                                className="h-full rounded-full"
                                style={{
                                  width: `${Math.min(100, (cat.clicks / (topCategories[0]?.clicks || 1)) * 100)}%`,
                                  backgroundColor: COLORS[i % COLORS.length],
                                }}
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Daily trend */}
                <div className="bg-card border border-border/80 rounded-2xl p-5 shadow-sm">
                  <SectionHead icon={TrendingUp} title="Daily Click Trend (Last 7 Days)" sub="How many category clicks happen per day" color="text-emerald-500" />
                  {clicksByDay.length === 0 ? (
                    <EmptyState icon={Activity} message="No daily data yet" />
                  ) : (
                    <div className="h-52 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={clicksByDay} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                          <defs>
                            <linearGradient id="clickGrad" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#6366f1" stopOpacity={0.25} />
                              <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(100,116,139,0.1)" />
                          <XAxis dataKey="date" stroke="rgba(100,116,139,0.5)" fontSize={9} tickLine={false} />
                          <YAxis stroke="rgba(100,116,139,0.5)" fontSize={10} tickLine={false} />
                          <Tooltip
                            contentStyle={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)' }}
                            itemStyle={{ fontSize: 11 }}
                          />
                          <Area type="monotone" dataKey="clicks" name="Clicks" stroke="#6366f1" strokeWidth={2.5} fill="url(#clickGrad)" />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </div>
              </div>

              {/* Clicks by source */}
              <div className="bg-card border border-border/80 rounded-2xl p-5 shadow-sm">
                <SectionHead icon={Eye} title="Clicks by UI Surface" sub="Where on the platform did users click — shortcut grid, banners, navbar, category page…" />
                {clicksBySource.length === 0 ? (
                  <EmptyState icon={Layers} message="No source data recorded yet" />
                ) : (
                  <div className="h-52 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={clicksBySource} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(100,116,139,0.1)" />
                        <XAxis dataKey="source" stroke="rgba(100,116,139,0.5)" fontSize={10} tickLine={false} />
                        <YAxis stroke="rgba(100,116,139,0.5)" fontSize={10} tickLine={false} />
                        <Tooltip
                          contentStyle={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)' }}
                          itemStyle={{ fontSize: 11 }}
                        />
                        <Bar dataKey="count" name="Clicks" radius={[6, 6, 0, 0]}>
                          {clicksBySource.map((_: any, i: number) => (
                            <Cell key={i} fill={COLORS[i % COLORS.length]} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>

              {/* Full category table */}
              <div className="bg-card border border-border/80 rounded-2xl p-5 shadow-sm">
                <SectionHead icon={BarChart2} title="All Categories — Click Log" sub="Complete ranked list with click count" />
                {topCategories.length === 0 ? (
                  <EmptyState icon={MousePointer2} message="No data yet" />
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="border-b border-border/60">
                          <th className="text-left py-2 pr-4 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">#</th>
                          <th className="text-left py-2 pr-4 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Category</th>
                          <th className="text-right py-2 pr-4 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Clicks</th>
                          <th className="text-right py-2 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">% Share</th>
                        </tr>
                      </thead>
                      <tbody>
                        {topCategories.map((cat: any, i: number) => {
                          const share = data.categoryClicks.total > 0
                            ? ((cat.clicks / data.categoryClicks.total) * 100).toFixed(1)
                            : '0.0';
                          return (
                            <tr key={i} className="border-b border-border/30 hover:bg-secondary/10 transition-colors">
                              <td className="py-2.5 pr-4 font-bold text-muted-foreground">{i + 1}</td>
                              <td className="py-2.5 pr-4 font-semibold text-foreground">{cat.categoryName}</td>
                              <td className="py-2.5 pr-4 text-right font-black font-mono text-primary">{cat.clicks}</td>
                              <td className="py-2.5 text-right">
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-primary/10 text-primary">{share}%</span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ═══════════════════════════════════════════
              ACADEMY TAB
          ═══════════════════════════════════════════ */}
          {tab === 'academy' && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
                <Stat label="Total Views" value={fmt(data.academy.totalViews)} icon={Eye} color="text-primary" bg="bg-primary/10" />
                <Stat label="Entrepreneur Views" value={fmt(data.academy.entrepreneurViews)} icon={TrendingUp} color="text-violet-500" bg="bg-violet-500/10" />
                <Stat label="Skill Dev Views" value={fmt(data.academy.skillViews)} icon={BookOpen} color="text-emerald-500" bg="bg-emerald-500/10" />
                <Stat label="OTP Sent" value={fmt(data.academy.otpRequests)} icon={Activity} color="text-amber-500" bg="bg-amber-500/10" />
                <Stat label="OTP Verified" value={fmt(data.academy.otpVerifications)} icon={CheckCircle} color="text-green-500" bg="bg-green-500/10" />
                <Stat label="Total Leads" value={fmt(data.academy.totalLeads)} icon={Users} color="text-rose-500" bg="bg-rose-500/10" />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Funnel */}
                <div className="bg-card border border-border/80 rounded-2xl p-5 shadow-sm">
                  <SectionHead icon={Activity} title="Conversion Funnel" sub="From page view → OTP → form submission" />
                  <div className="h-52 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={academyFunnel} layout="vertical" margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="rgba(100,116,139,0.1)" />
                        <XAxis type="number" stroke="rgba(100,116,139,0.5)" fontSize={10} tickLine={false} />
                        <YAxis type="category" dataKey="stage" stroke="rgba(100,116,139,0.5)" fontSize={10} tickLine={false} width={75} />
                        <Tooltip contentStyle={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)' }} itemStyle={{ fontSize: 11 }} />
                        <Bar dataKey="count" name="Count" radius={[0, 6, 6, 0]}>
                          {academyFunnel.map((_: any, i: number) => <Cell key={i} fill={COLORS[i]} />)}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Lead type pie */}
                <div className="bg-card border border-border/80 rounded-2xl p-5 shadow-sm">
                  <SectionHead icon={Users} title="Lead Type Split" sub="Entrepreneur vs Skill Development" />
                  {data.academy.totalLeads === 0 ? (
                    <EmptyState icon={GraduationCap} message="No leads submitted yet" />
                  ) : (
                    <div className="h-52 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie data={academyLeadPie} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80}
                            label={({ name, percent }: any) => `${name} ${((percent || 0) * 100).toFixed(0)}%`} labelLine={false}>
                            {academyLeadPie.map((_: any, i: number) => <Cell key={i} fill={COLORS[i]} />)}
                          </Pie>
                          <Legend wrapperStyle={{ fontSize: 11 }} />
                          <Tooltip contentStyle={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)' }} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </div>
              </div>

              {/* Popular interests */}
              <div className="bg-card border border-border/80 rounded-2xl p-5 shadow-sm">
                <SectionHead icon={Star} title="Top Chosen Interests" sub="Which skills / business areas users selected most" />
                {topInterests.length === 0 ? (
                  <EmptyState icon={Sparkles} message="No interest data yet" />
                ) : (
                  <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                    {topInterests.map((item: any, i: number) => (
                      <div key={i} className="flex items-center gap-3">
                        <span className="text-[10px] font-bold text-muted-foreground w-4 shrink-0">{i + 1}</span>
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-center mb-0.5">
                            <span className="text-xs font-medium text-foreground capitalize truncate">{item.name}</span>
                            <span className="text-[10px] font-bold text-muted-foreground ml-2 shrink-0">{item.count}</span>
                          </div>
                          <div className="h-1.5 bg-secondary/30 rounded-full overflow-hidden">
                            <div className="h-full rounded-full transition-all"
                              style={{ width: `${Math.min(100, (item.count / (topInterests[0]?.count || 1)) * 100)}%`, backgroundColor: COLORS[i % COLORS.length] }} />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ═══════════════════════════════════════════
              CART TAB
          ═══════════════════════════════════════════ */}
          {tab === 'cart' && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <Stat label="Active Carts" value={fmt(data.cart.activeCartsCount)} icon={ShoppingCart} color="text-primary" bg="bg-primary/10" />
                <Stat label="Total Items in Carts" value={fmt(data.cart.totalCartItemsCount)} icon={Package} color="text-amber-500" bg="bg-amber-500/10" />
                <Stat label="Top Product Added" value={topCarted[0]?.name || '—'} icon={TrendingUp} color="text-emerald-500" bg="bg-emerald-500/10" />
              </div>

              <div className="bg-card border border-border/80 rounded-2xl p-5 shadow-sm">
                <SectionHead icon={ShoppingCart} title="Top Products Added to Cart" sub="Products most frequently added across all user carts" />
                {topCarted.length === 0 ? (
                  <EmptyState icon={ShoppingCart} message="No cart data available yet" />
                ) : (
                  <div className="h-60 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={topCarted} margin={{ top: 5, right: 10, left: -20, bottom: 40 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(100,116,139,0.1)" />
                        <XAxis dataKey="name" stroke="rgba(100,116,139,0.5)" fontSize={9} tickLine={false} angle={-30} textAnchor="end" />
                        <YAxis stroke="rgba(100,116,139,0.5)" fontSize={10} tickLine={false} />
                        <Tooltip contentStyle={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)' }} itemStyle={{ fontSize: 11 }} />
                        <Bar dataKey="timesAdded" name="Times Added" radius={[6, 6, 0, 0]}>
                          {topCarted.map((_: any, i: number) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>

              <div className="bg-card border border-border/80 rounded-2xl p-5 shadow-sm">
                <SectionHead icon={Activity} title="Recent Cart Activity" sub="Latest user cart additions — live log" color="text-emerald-500" />
                {data.cart.cartLog.length === 0 ? (
                  <EmptyState icon={ShoppingCart} message="No recent cart activity" />
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="border-b border-border/60">
                          {['User', 'Product', 'Category', 'Price', 'Qty'].map(h => (
                            <th key={h} className={`py-2 pr-4 text-[10px] font-bold text-muted-foreground uppercase tracking-wider ${h === 'Price' || h === 'Qty' ? 'text-right' : 'text-left'}`}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {data.cart.cartLog.map((entry: any, i: number) => (
                          <tr key={i} className="border-b border-border/30 hover:bg-secondary/10 transition-colors">
                            <td className="py-2.5 pr-4">
                              <span className="font-semibold text-foreground block">{entry.userName}</span>
                              <span className="text-[10px] text-muted-foreground">{entry.userEmail}</span>
                            </td>
                            <td className="py-2.5 pr-4 font-medium text-foreground max-w-[160px] truncate">{entry.productName}</td>
                            <td className="py-2.5 pr-4">
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-primary/10 text-primary">{entry.productCategory || 'General'}</span>
                            </td>
                            <td className="py-2.5 pr-4 text-right font-mono font-bold text-emerald-500">
                              {entry.productPrice ? `₹${entry.productPrice.toLocaleString('en-IN')}` : '—'}
                            </td>
                            <td className="py-2.5 text-right font-bold text-foreground">{entry.quantity}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};
