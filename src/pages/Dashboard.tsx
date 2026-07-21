import React, { useEffect, useState } from "react";
import {
  Users,
  Store,
  ShoppingCart,
  IndianRupee,
  Wallet,
  Package,
  CreditCard,
  AlertCircle,
  RefreshCcw,
  MapPin,
  Clock,
  Play,
  Pause,
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { motion } from "framer-motion";

interface DashboardStats {
  totalUsers: number;
  totalSellers: number;
  pendingKycCount: number;
  pendingAppsCount: number;
  totalVendors: number;
  totalWholesalers: number;
  totalManufacturers: number;
  totalEntrepreneurs: number;
  totalServiceProviders: number;
  stateFranchises: number;
  totalFranchises: number;
  activeStates: number;
  activeDistricts: number;
  activeMandals: number;
  totalRevenue: number;
  totalOrders: number;
  pendingProducts: number;
  pendingPayments: number;
  pendingWithdrawals: number;
  walletHealth: {
    totalAvailable: number;
    totalPending: number;
    totalWithdrawn: number;
  };
  charts: {
    revenueChartData: any[];
    categorySalesData: any[];
    orderStatusStats: any[];
    franchiseGrowthData: any[];
  };
  topFranchises: any[];
  platformKpis: {
    platformGMV: number;
    platformNetRevenue: number;
    settlementLiability: number;
    riskAlerts: number;
    coverageRate: number;
  };
}

const API_BASE_URL = import.meta.env.VITE_API_URL || "https://server.apexbee.in";

const formatCurrency = (amount?: number) =>
  `₹${Number(amount || 0).toLocaleString("en-IN")}`;

const EmptyState = ({ text = "No real data available" }) => (
  <div className="h-full min-h-[200px] flex items-center justify-center text-sm text-muted-foreground">
    {text}
  </div>
);

const StatCard = ({
  title,
  value,
  icon: Icon,
  subtitle,
}: {
  title: string;
  value: string | number;
  icon: any;
  subtitle?: string;
}) => (
  <div className="bg-card text-card-foreground border border-border rounded-2xl p-5 shadow-sm hover:shadow-md hover:border-slate-300 dark:hover:border-slate-700/80 transition duration-300">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{title}</p>
        <h3 className="text-2xl font-bold text-foreground mt-1">
          {value}
        </h3>
        {subtitle && (
          <p className="text-xs text-muted-foreground mt-1 font-normal opacity-80">
            {subtitle}
          </p>
        )}
      </div>

      <div className="w-12 h-12 rounded-xl bg-primary/10 dark:bg-primary/20 text-primary flex items-center justify-center shrink-0 transition-transform hover:scale-110">
        <Icon size={24} />
      </div>
    </div>
  </div>
);

export const Dashboard: React.FC<{ setActiveTab?: (tab: string) => void }> = ({
  setActiveTab,
}) => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isDark, setIsDark] = useState(false);

  // Live Auto-Refresh State
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState(10); // in seconds
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    const checkTheme = () => {
      setIsDark(document.documentElement.classList.contains("dark"));
    };

    checkTheme();

    const observer = new MutationObserver(checkTheme);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    return () => observer.disconnect();
  }, []);

  const chartTheme = {
    grid: isDark ? "rgba(255, 255, 255, 0.05)" : "rgba(15, 23, 42, 0.05)",
    axis: isDark ? "#94a3b8" : "#64748b",
    text: isDark ? "#f8fafc" : "#0f172a", // Match foreground values exactly
    tooltipBg: isDark ? "#1e293b" : "#ffffff",
    tooltipBorder: isDark ? "rgba(255, 255, 255, 0.1)" : "rgba(15, 23, 42, 0.08)",
    primary: isDark ? "#6366f1" : "#4f46e5",
    secondary: isDark ? "#a78bfa" : "#7c3aed",
    success: "#10b981",
    warning: "#f59e0b",
    danger: "#ef4444",
  };

  const tooltipStyle = {
    backgroundColor: chartTheme.tooltipBg,
    borderColor: chartTheme.tooltipBorder,
    color: chartTheme.text,
    borderRadius: "12px",
    boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
  };

  const fetchStats = async (showSpinner = false) => {
    try {
      if (showSpinner) {
        setLoading(true);
      } else {
        setIsRefreshing(true);
      }
      setError("");

      const token = localStorage.getItem("adminToken");

      const res = await fetch(`${API_BASE_URL}/api/admin/dashboard-stats`, {
        headers: {
          Authorization: token ? `Bearer ${token}` : "",
        },
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to load dashboard");
      }

      setStats(data.stats);
      setLastUpdated(new Date());
    } catch (err: any) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    // Initial fetch on mount
    fetchStats(true);
  }, []);

  useEffect(() => {
    if (!autoRefresh) return;

    const intervalId = setInterval(() => {
      fetchStats(false);
    }, refreshInterval * 1000);

    return () => clearInterval(intervalId);
  }, [autoRefresh, refreshInterval]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-muted-foreground space-y-4">
        <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
        <p className="text-sm font-medium animate-pulse">Loading database metrics...</p>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="p-6">
        <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/60 rounded-2xl p-6">
          <div className="flex items-center gap-3 text-red-600 dark:text-red-400">
            <AlertCircle />
            <h3 className="font-semibold">Dashboard Connection Failed</h3>
          </div>

          <p className="text-sm mt-2 text-red-500 dark:text-red-400">
            {error}
          </p>

          <button
            onClick={() => fetchStats(true)}
            className="mt-4 px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white flex items-center gap-2 transition"
          >
            <RefreshCcw size={16} />
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  const revenueChartData = stats.charts?.revenueChartData || [];
  const categorySalesData = stats.charts?.categorySalesData || [];
  const orderStatusStats = stats.charts?.orderStatusStats || [];
  const franchiseGrowthData = stats.charts?.franchiseGrowthData || [];
  const topFranchises = stats.topFranchises || [];

  const pieColors = [
    chartTheme.primary,
    chartTheme.secondary,
    chartTheme.success,
    chartTheme.warning,
    chartTheme.danger,
    "#14b8a6",
  ];

  const totalOrderCount = orderStatusStats.reduce((sum, item) => sum + (item.count || 0), 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="space-y-6 text-foreground"
    >
      {/* Dashboard Executive Toolbar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-card border border-border rounded-2xl p-4 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Command Center
          </h1>
          <p className="text-xs text-muted-foreground flex items-center gap-1.5 mt-0.5 font-medium">
            {autoRefresh && (
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
            )}
            Live feed updated from core MongoDB.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3.5 md:self-end">
          {/* Last updated visual */}
          {lastUpdated && (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
              <Clock size={14} className="text-muted-foreground opacity-75" />
              <span>
                Updated: {lastUpdated.toLocaleTimeString()}
              </span>
            </div>
          )}

          {/* Auto Refresh Toggle */}
          <div className="flex items-center gap-2 border-l border-border pl-3">
            <button
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={`p-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1.5 transition-all select-none cursor-pointer ${autoRefresh
                ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20 dark:bg-emerald-500/20 dark:text-emerald-400"
                : "bg-secondary text-secondary-foreground border-border"
                }`}
            >
              {autoRefresh ? <Play size={12} className="fill-current" /> : <Pause size={12} />}
              <span>{autoRefresh ? "Auto On" : "Auto Off"}</span>
            </button>
          </div>

          {/* Interval Selector */}
          {autoRefresh && (
            <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
              <span>Rate:</span>
              <select
                value={refreshInterval}
                onChange={(e) => setRefreshInterval(Number(e.target.value))}
                className="bg-secondary text-secondary-foreground border border-border rounded-lg px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value={5}>5s</option>
                <option value={10}>10s</option>
                <option value={30}>30s</option>
                <option value={60}>60s</option>
              </select>
            </div>
          )}

          {/* Manual Refresh Trigger */}
          <button
            onClick={() => fetchStats(false)}
            disabled={isRefreshing}
            className="px-3.5 py-1.5 rounded-lg bg-primary hover:bg-primary/95 text-white flex items-center gap-1.5 text-xs font-semibold shadow-sm shadow-primary/10 transition active:scale-95 disabled:opacity-50 cursor-pointer"
          >
            <RefreshCcw size={13} className={isRefreshing ? "animate-spin" : ""} />
            <span>Sync</span>
          </button>
        </div>
      </div>

      {/* Row 1: Core Financials & Volume */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
        <StatCard
          title="Total Revenue"
          value={formatCurrency(stats.totalRevenue)}
          icon={IndianRupee}
          subtitle="Non-cancelled order totals"
        />
        <StatCard title="Total Orders" value={stats.totalOrders} icon={ShoppingCart} />
        <StatCard title="Total Users" value={stats.totalUsers} icon={Users} />
        <StatCard title="Total Sellers" value={stats.totalSellers} icon={Store} />
      </div>

      {/* Row 2: Operational Alerts & Review Queues */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
        <StatCard title="Pending Products" value={stats.pendingProducts || 0} icon={Package} subtitle="Awaiting review approvals" />
        <StatCard title="Pending Payments" value={stats.pendingPayments || 0} icon={CreditCard} subtitle="Requires manual verification" />
        <StatCard title="Pending Withdrawals" value={stats.pendingWithdrawals || 0} icon={Wallet} subtitle="Awaiting payout approval" />
        <StatCard title="Risk Alerts" value={stats.platformKpis?.riskAlerts || 0} icon={AlertCircle} subtitle="Flagged logs & rejections" />
      </div>

      {/* Row 3: Platform Ecosystem KPIs */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        <StatCard title="Platform GMV" value={formatCurrency(stats.platformKpis?.platformGMV)} icon={IndianRupee} subtitle="Gross volume transactions" />
        <StatCard title="Settlement Liability" value={formatCurrency(stats.platformKpis?.settlementLiability)} icon={Wallet} subtitle="Available funds to settle" />
        <StatCard title="Coverage Rate" value={`${stats.platformKpis?.coverageRate || 0}%`} icon={MapPin} subtitle="Mandal territory coverage" />
      </div>

      {/* Row 4: Key Performance Charts */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Revenue Chart */}
        <div className="xl:col-span-2 bg-card text-card-foreground border border-border rounded-2xl p-5 shadow-sm">
          <h3 className="font-bold text-foreground text-sm tracking-wide mb-4">
            REVENUE TIMELINE
          </h3>

          {revenueChartData.length === 0 ? (
            <EmptyState />
          ) : (
            <div className="h-[280px] min-h-[280px] chart-glow">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={revenueChartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={chartTheme.primary} stopOpacity={0.25} />
                      <stop offset="95%" stopColor={chartTheme.primary} stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={chartTheme.grid} />
                  <XAxis
                    dataKey="month"
                    stroke={chartTheme.axis}
                    tick={{ fill: chartTheme.axis, fontSize: 11 }}
                    tickLine={false}
                  />
                  <YAxis
                    stroke={chartTheme.axis}
                    tick={{ fill: chartTheme.axis, fontSize: 11 }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip
                    contentStyle={tooltipStyle}
                    itemStyle={{ color: chartTheme.text }}
                    labelStyle={{ color: chartTheme.text, fontWeight: "bold" }}
                  />
                  <Area
                    type="monotone"
                    dataKey="sales"
                    stroke={chartTheme.primary}
                    fill="url(#colorSales)"
                    strokeWidth={2.5}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Order Status Distribution */}
        <div className="xl:col-span-1 bg-card text-card-foreground border border-border rounded-2xl p-5 shadow-sm">
          <h3 className="font-bold text-foreground text-sm tracking-wide mb-4">
            ORDER STATUS DISTRIBUTION
          </h3>

          {orderStatusStats.length === 0 ? (
            <EmptyState />
          ) : (
            <div className="grid grid-cols-1 gap-4 items-center">
              <div className="h-[175px] min-h-[175px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={orderStatusStats}
                      dataKey="count"
                      nameKey="status"
                      innerRadius={55}
                      outerRadius={75}
                      paddingAngle={4}
                      label={false}
                    >
                      {orderStatusStats.map((_, index) => (
                        <Cell key={index} fill={pieColors[index % pieColors.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={tooltipStyle}
                      itemStyle={{ color: chartTheme.text }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Custom interactive legend */}
              <div className="space-y-2 max-h-[110px] overflow-y-auto pr-1">
                {orderStatusStats.map((item, index) => {
                  const percent = totalOrderCount > 0 ? Math.round((item.count / totalOrderCount) * 100) : 0;
                  return (
                    <div key={item.status} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: pieColors[index % pieColors.length] }} />
                        <span className="text-muted-foreground font-medium truncate max-w-[120px]">{item.status}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-foreground font-bold">{item.count}</span>
                        <span className="text-muted-foreground opacity-75 font-medium w-8 text-right">{percent}%</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Row 5: Secondary Trends & Rankings */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Category Sales Distribution */}
        <div className="xl:col-span-1 bg-card text-card-foreground border border-border rounded-2xl p-5 shadow-sm">
          <h3 className="font-bold text-foreground text-sm tracking-wide mb-4">
            CATEGORY VOLUME
          </h3>

          {categorySalesData.length === 0 ? (
            <EmptyState />
          ) : (
            <div className="h-[240px] min-h-[240px] chart-glow">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={categorySalesData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={chartTheme.secondary} stopOpacity={0.8} />
                      <stop offset="95%" stopColor={chartTheme.secondary} stopOpacity={0.3} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={chartTheme.grid} />
                  <XAxis
                    dataKey="name"
                    stroke={chartTheme.axis}
                    tick={{ fill: chartTheme.axis, fontSize: 11 }}
                    tickLine={false}
                  />
                  <YAxis
                    stroke={chartTheme.axis}
                    tick={{ fill: chartTheme.axis, fontSize: 11 }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip
                    contentStyle={tooltipStyle}
                    itemStyle={{ color: chartTheme.text }}
                    labelStyle={{ color: chartTheme.text, fontWeight: "bold" }}
                  />
                  <Bar
                    dataKey="value"
                    fill="url(#colorValue)"
                    radius={[6, 6, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Franchise Growth Trend */}
        <div className="xl:col-span-1 bg-card text-card-foreground border border-border rounded-2xl p-5 shadow-sm">
          <h3 className="font-bold text-foreground text-sm tracking-wide mb-4">
            FRANCHISE GROWTH TREND
          </h3>

          {franchiseGrowthData.length === 0 ? (
            <EmptyState />
          ) : (
            <div className="h-[240px] min-h-[240px] chart-glow">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={franchiseGrowthData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorGrowth" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={chartTheme.secondary} stopOpacity={0.25} />
                      <stop offset="95%" stopColor={chartTheme.secondary} stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={chartTheme.grid} />
                  <XAxis
                    dataKey="month"
                    stroke={chartTheme.axis}
                    tick={{ fill: chartTheme.axis, fontSize: 11 }}
                    tickLine={false}
                  />
                  <YAxis
                    stroke={chartTheme.axis}
                    tick={{ fill: chartTheme.axis, fontSize: 11 }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip
                    contentStyle={tooltipStyle}
                    itemStyle={{ color: chartTheme.text }}
                    labelStyle={{ color: chartTheme.text, fontWeight: "bold" }}
                  />
                  <Area
                    type="monotone"
                    dataKey="count"
                    stroke={chartTheme.secondary}
                    fill="url(#colorGrowth)"
                    strokeWidth={2.5}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Top Franchises Leaderboard */}
        <div className="xl:col-span-1 bg-card text-card-foreground border border-border rounded-2xl p-5 shadow-sm">
          <h3 className="font-bold text-foreground text-sm tracking-wide mb-4">
            LEADERBOARD (FRANCHISES)
          </h3>

          {topFranchises.length === 0 ? (
            <EmptyState />
          ) : (
            <div className="space-y-3 max-h-[240px] overflow-y-auto pr-1">
              {topFranchises.map((franchise, index) => (
                <div
                  key={franchise._id || index}
                  className="flex items-center justify-between p-3 rounded-xl border border-border bg-secondary/30"
                >
                  <div className="overflow-hidden">
                    <p className="font-semibold text-foreground text-xs truncate">
                      {franchise.businessName}
                    </p>
                    <p className="text-[10px] text-muted-foreground uppercase font-bold mt-0.5">
                      {franchise.franchiseLevel} • {franchise.district || franchise.state}
                    </p>
                  </div>

                  <div className="text-right shrink-0 pl-2">
                    <p className="font-bold text-foreground text-xs">
                      {formatCurrency(franchise.totalEarnings)}
                    </p>
                    <p className="text-[10px] text-muted-foreground font-semibold mt-0.5">
                      {franchise.totalOrders || 0} Txns
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Row 6: Platform Action Quicklinks */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          ["products", "Product Reviews", stats.pendingProducts || 0],
          ["payments", "Verify Payments", stats.pendingPayments || 0],
          ["wallets", "Payout Approvals", stats.pendingWithdrawals || 0],
          ["kyc", "KYC Approvals", stats.pendingKycCount || 0],
        ].map(([tab, label, count]) => (
          <button
            key={tab}
            onClick={() => setActiveTab?.(tab as string)}
            className="p-4 rounded-2xl bg-card text-card-foreground border border-border hover:bg-secondary/40 hover:border-slate-300 dark:hover:border-slate-700/80 transition duration-200 cursor-pointer"
          >
            <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider">{label}</p>
            <p className="text-lg font-bold text-foreground mt-1 flex items-center justify-between">
              <span>Queue size</span>
              <span className="text-primary bg-primary/10 px-2 py-0.5 rounded-full text-xs font-bold">{count}</span>
            </p>
          </button>
        ))}
      </div>
    </motion.div>
  );
};