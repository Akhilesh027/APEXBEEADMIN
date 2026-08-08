// admin-panel/src/pages/OrderManagement.tsx — Hyperlocal Orders & Subscription Management with Tab Filtering & DB Categories
import React, { useState, useEffect, useMemo } from 'react';
import { useAdminState } from '../context/AdminStateContext';
import { Order } from '../types';
import {
  Search,
  Repeat,
  ShoppingBag,
  Truck,
  CheckCircle2,
  Clock,
  AlertCircle,
  MapPin,
  Phone,
  User,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Filter,
  Layers,
  Sparkles,
  RefreshCw,
  X,
  CreditCard,
} from 'lucide-react';

interface OrderManagementProps {
  defaultView?: 'orders' | 'subscriptions';
}

export const OrderManagement: React.FC<OrderManagementProps> = ({ defaultView = 'orders' }) => {
  const { orders, updateOrderStatus, releaseCommissions } = useAdminState();
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(orders[0] || null);

  // Tab Filtering States
  const [dbCategories, setDbCategories] = useState<any[]>([]);
  const [selectedDbCategory, setSelectedDbCategory] = useState<string>('ALL');
  const [filter, setFilter] = useState<
    'All' | 'Pending Payment' | 'Confirmed' | 'Payment Verified' | 'Processing' | 'Packed' | 'Shipped' | 'Delivered' | 'Cancelled'
  >('All');
  const [paymentFilter, setPaymentFilter] = useState<'All' | 'Approved' | 'Pending Verification' | 'COD' | 'Rejected'>('All');
  const [dateFilter, setDateFilter] = useState<'All' | 'Today' | '7Days' | 'ThisMonth'>('All');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'amount_high' | 'amount_low'>('newest');
  const [search, setSearch] = useState('');

  const [mainView, setMainView] = useState<'orders' | 'subscriptions'>(defaultView);

  // Pagination States
  const [ordersPage, setOrdersPage] = useState<number>(1);
  const ordersPerPage = 6;

  const [subsPage, setSubsPage] = useState<number>(1);
  const subsPerPage = 6;

  const [adminSubscriptions, setAdminSubscriptions] = useState<any[]>([]);
  const [loadingSubs, setLoadingSubs] = useState(false);
  const [selectedSubDetail, setSelectedSubDetail] = useState<any | null>(null);
  const [allStatements, setAllStatements] = useState<any[]>([]);
  const [settlingId, setSettlingId] = useState<string | null>(null);
  const [releasingCommId, setReleasingCommId] = useState<string | null>(null);
  const [courier, setCourier] = useState('Delhivery');
  const [tracking, setTracking] = useState('');
  const [isDispatching, setIsDispatching] = useState(false);

  // Fetch DB Categories and Subscriptions
  useEffect(() => {
    // 1. Fetch DB Categories from backend API
    fetch('https://server.apexbee.in/api/categories')
      .then((res) => res.json())
      .then((data) => {
        const catList = Array.isArray(data) ? data : (data?.categories || data?.data || []);
        setDbCategories(catList);
      })
      .catch((err) => console.warn('Failed to load DB categories in OrderManagement:', err));

    // 2. Fetch admin subscriptions
    const fetchSubscriptions = async () => {
      try {
        setLoadingSubs(true);
        const token = localStorage.getItem('adminToken') || localStorage.getItem('token') || localStorage.getItem('admin_token');
        const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};

        const res = await fetch('https://server.apexbee.in/api/local-shop/subscriptions/admin/all', { headers });
        if (res.ok) {
          const data = await res.json();
          if (data.success && Array.isArray(data.subscriptions)) {
            setAdminSubscriptions(data.subscriptions);
            if (!selectedSubDetail && data.subscriptions.length > 0) {
              setSelectedSubDetail(data.subscriptions[0]);
            }
          }
        }

        const stmtRes = await fetch('https://server.apexbee.in/api/local-shop/billing/statements', { headers });
        if (stmtRes.ok) {
          const stmtData = await stmtRes.json();
          setAllStatements(stmtData.statements || []);
        }
      } catch (err) {
        console.error('Error fetching admin subscriptions and statements:', err);
      } finally {
        setLoadingSubs(false);
      }
    };

    fetchSubscriptions();
  }, []);

  const handleApproveStatement = async (id: string) => {
    if (!window.confirm('Are you sure you want to approve and release wallet payouts for this statement?')) {
      return;
    }

    try {
      setSettlingId(id);
      const token = localStorage.getItem('adminToken') || localStorage.getItem('token');
      const res = await fetch(`https://server.apexbee.in/api/billing/statements/${id}/approve`, {
        method: 'PATCH',
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });

      const data = await res.json();
      if (res.ok && data.success) {
        alert('Statement settled and wallet payouts released successfully!');
      } else {
        alert(data.message || 'Failed to settle statement');
      }
    } catch (err) {
      console.error('Error settling statement:', err);
      alert('Network or server error encountered during settlement.');
    } finally {
      setSettlingId(null);
    }
  };

  // Filtered & Sorted Orders
  const filteredOrders = useMemo(() => {
    let result = [...orders];

    // DB Category Filter
    if (selectedDbCategory !== 'ALL') {
      const catObj = dbCategories.find((c) => String(c._id) === String(selectedDbCategory) || c.name === selectedDbCategory);
      const targetCatId = catObj ? String(catObj._id) : String(selectedDbCategory);
      const catNameUpper = String(catObj?.name || selectedDbCategory).toUpperCase();

      result = result.filter((o: any) => {
        const orderTypeUpper = String(o.orderType || '').toUpperCase();

        if (catNameUpper.includes('FOOD') || catNameUpper.includes('DINING') || catNameUpper.includes('RESTAURANT')) {
          if (orderTypeUpper.includes('FOOD') || Boolean(o.restaurantId)) return true;
        }

        if (catNameUpper.includes('SUB') || catNameUpper.includes('DAILY')) {
          if (Boolean(o.isSubscription) || Boolean(o.deliverySlot)) return true;
        }

        // Direct Category ID or Category Name match on Order
        if (o.categoryId && String(o.categoryId) === targetCatId) return true;
        if (o.categoryName && String(o.categoryName).toUpperCase().includes(catNameUpper)) return true;

        // Check each order item
        return o.items?.some((i: any) => {
          if (i.categoryId && String(i.categoryId) === targetCatId) return true;
          if (i.categoryName && String(i.categoryName).toUpperCase().includes(catNameUpper)) return true;
          if (i.productName && String(i.productName).toUpperCase().includes(catNameUpper)) return true;
          return false;
        });
      });
    }

    // Order Fulfillment Status Filter
    if (filter !== 'All') {
      result = result.filter((o) => {
        const s = String(o.orderStatus).toLowerCase();
        const f = String(filter).toLowerCase();
        if (f === 'pending payment' || f === 'unpaid') {
          return s.includes('pending') || s.includes('unpaid') || s === 'placed';
        }
        if (f === 'payment verified' || f === 'paid') {
          return s.includes('verified') || s.includes('paid');
        }
        return s === f;
      });
    }

    // Payment Verification Status Filter
    if (paymentFilter !== 'All') {
      result = result.filter((o) => {
        const ps = String(o.paymentStatus || '').toLowerCase();
        if (paymentFilter === 'Approved') return ps.includes('approved') || ps.includes('paid');
        if (paymentFilter === 'Pending Verification') return ps.includes('pending');
        if (paymentFilter === 'COD') return ps.includes('cod');
        if (paymentFilter === 'Rejected') return ps.includes('rejected');
        return true;
      });
    }

    // Date Range Filter
    if (dateFilter !== 'All') {
      const now = new Date();
      result = result.filter((o) => {
        const orderDate = new Date(o.date || (o as any).createdAt);
        if (isNaN(orderDate.getTime())) return true;
        if (dateFilter === 'Today') {
          return orderDate.toDateString() === now.toDateString();
        } else if (dateFilter === '7Days') {
          const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          return orderDate >= sevenDaysAgo;
        } else if (dateFilter === 'ThisMonth') {
          return orderDate.getMonth() === now.getMonth() && orderDate.getFullYear() === now.getFullYear();
        }
        return true;
      });
    }

    // Search Query
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (o) =>
          o.customerName?.toLowerCase().includes(q) ||
          o.id?.toLowerCase().includes(q) ||
          o.customerMobile?.includes(q) ||
          o.customerAddress?.toLowerCase().includes(q) ||
          o.upiRefNo?.toLowerCase().includes(q) ||
          o.trackingId?.toLowerCase().includes(q) ||
          o.items?.some((item) => item.productName?.toLowerCase().includes(q))
      );
    }

    // Sorting
    result.sort((a, b) => {
      if (sortBy === 'newest') {
        return new Date(b.date || (b as any).createdAt).getTime() - new Date(a.date || (a as any).createdAt).getTime();
      } else if (sortBy === 'oldest') {
        return new Date(a.date || (a as any).createdAt).getTime() - new Date(b.date || (b as any).createdAt).getTime();
      } else if (sortBy === 'amount_high') {
        return b.totalAmount - a.totalAmount;
      } else if (sortBy === 'amount_low') {
        return a.totalAmount - b.totalAmount;
      }
      return 0;
    });

    return result;
  }, [orders, selectedDbCategory, dbCategories, filter, paymentFilter, dateFilter, sortBy, search]);

  const hasActiveFilters =
    selectedDbCategory !== 'ALL' || filter !== 'All' || paymentFilter !== 'All' || dateFilter !== 'All' || sortBy !== 'newest' || search !== '';

  const handleResetFilters = () => {
    setSelectedDbCategory('ALL');
    setFilter('All');
    setPaymentFilter('All');
    setDateFilter('All');
    setSortBy('newest');
    setSearch('');
  };

  // Reset page when filters change
  useEffect(() => {
    setOrdersPage(1);
  }, [selectedDbCategory, filter, paymentFilter, dateFilter, sortBy, search]);

  // Paginated Orders
  const totalOrdersPages = Math.ceil(filteredOrders.length / ordersPerPage) || 1;
  const paginatedOrders = useMemo(() => {
    const start = (ordersPage - 1) * ordersPerPage;
    return filteredOrders.slice(start, start + ordersPerPage);
  }, [filteredOrders, ordersPage, ordersPerPage]);

  // Paginated Subscriptions
  const totalSubsPages = Math.ceil(adminSubscriptions.length / subsPerPage) || 1;
  const paginatedSubs = useMemo(() => {
    const start = (subsPage - 1) * subsPerPage;
    return adminSubscriptions.slice(start, start + subsPerPage);
  }, [adminSubscriptions, subsPage, subsPerPage]);

  const getOrderStatusBadge = (status: Order['orderStatus']) => {
    switch (status) {
      case 'Pending Payment':
        return <span className="px-2.5 py-1 bg-amber-500/10 text-amber-500 font-bold rounded-lg text-[10px]">Unpaid</span>;
      case 'Confirmed':
        return <span className="px-2.5 py-1 bg-blue-500/10 text-blue-500 font-bold rounded-lg text-[10px]">Confirmed</span>;
      case 'Payment Verified':
        return <span className="px-2.5 py-1 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold rounded-lg text-[10px]">Paid / Verified</span>;
      case 'Processing':
        return <span className="px-2.5 py-1 bg-indigo-500/10 text-indigo-500 font-bold rounded-lg text-[10px]">Processing</span>;
      case 'Packed':
        return <span className="px-2.5 py-1 bg-purple-500/10 text-purple-500 font-bold rounded-lg text-[10px]">Packed</span>;
      case 'Shipped':
        return <span className="px-2.5 py-1 bg-pink-500/10 text-pink-500 font-bold rounded-lg text-[10px]">Shipped</span>;
      case 'Delivered':
        return <span className="px-2.5 py-1 bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-black rounded-lg text-[10px]">Delivered</span>;
      default:
        return <span className="px-2.5 py-1 bg-secondary text-muted-foreground font-bold rounded-lg text-[10px]">{status}</span>;
    }
  };

  const getStatusStepIndex = (status: Order['orderStatus']) => {
    const steps = ['Pending Payment', 'Confirmed', 'Payment Verified', 'Processing', 'Packed', 'Shipped', 'Delivered'];
    return steps.indexOf(status);
  };

  return (
    <div className="space-y-6 text-left font-sans">
      {/* Header Bar with View Selector */}
      <div className="bg-card border border-border/80 rounded-2xl p-4 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex border border-border/80 rounded-xl p-1 bg-secondary/20">
            <button
              onClick={() => setMainView('orders')}
              className={`px-4 py-2 text-xs font-bold rounded-lg transition cursor-pointer flex items-center gap-1.5 ${mainView === 'orders' ? 'bg-card text-foreground shadow-xs' : 'text-muted-foreground hover:text-foreground'
                }`}
            >
              <ShoppingBag className="h-4 w-4 text-primary" />
              <span>Hyperlocal Store Orders ({orders.length})</span>
            </button>
            <button
              onClick={() => setMainView('subscriptions')}
              className={`px-4 py-2 text-xs font-bold rounded-lg transition cursor-pointer flex items-center gap-1.5 ${mainView === 'subscriptions' ? 'bg-card text-foreground shadow-xs' : 'text-muted-foreground hover:text-foreground'
                }`}
            >
              <Repeat className="h-4 w-4 text-emerald-500" />
              <span>Product Subscribers Hub ({adminSubscriptions.length})</span>
            </button>
          </div>
        </div>
      </div>

      {/* VIEW MODE 1: STORE ORDERS */}
      {mainView === 'orders' ? (
        <>
          {/* TAB BAR 1: DATABASE CATEGORIES (REAL DB CATEGORY PILLS) */}
          <div className="bg-card border border-border/80 rounded-2xl p-4 space-y-3.5 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                <Layers className="h-3.5 w-3.5 text-primary" />
                <span>Filter by Database Category (DB Taxonomy)</span>
              </span>

              {hasActiveFilters && (
                <button
                  onClick={handleResetFilters}
                  className="text-xs font-bold text-rose-500 hover:text-rose-600 underline cursor-pointer flex items-center gap-1"
                >
                  <X className="h-3.5 w-3.5" />
                  <span>Reset All Filters</span>
                </button>
              )}
            </div>

            {/* DB Category Pills Horizontal Scrollable Bar */}
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
              <button
                onClick={() => setSelectedDbCategory('ALL')}
                className={`px-3.5 py-2 rounded-xl text-xs font-extrabold border transition shrink-0 cursor-pointer ${selectedDbCategory === 'ALL'
                    ? 'bg-primary text-primary-foreground border-primary shadow-xs'
                    : 'bg-card text-muted-foreground border-border hover:bg-secondary/40'
                  }`}
              >
                🌐 All DB Categories ({orders.length})
              </button>

              {dbCategories.map((cat: any) => {
                const catIdStr = String(cat._id || cat.name);
                const isSelected = selectedDbCategory === catIdStr || selectedDbCategory === cat.name;

                return (
                  <button
                    key={cat._id || cat.name}
                    onClick={() => setSelectedDbCategory(catIdStr)}
                    className={`px-3.5 py-2 rounded-xl text-xs font-extrabold border transition shrink-0 cursor-pointer flex items-center gap-1.5 ${isSelected
                        ? 'bg-primary text-primary-foreground border-primary shadow-xs font-black'
                        : 'bg-card text-muted-foreground border-border hover:bg-secondary/40'
                      }`}
                  >
                    <span>{cat.name}</span>
                  </button>
                );
              })}
            </div>

            {/* TAB BAR 2: FULFILLMENT ORDER STATUS TABS */}
            <div className="pt-2 border-t border-border/40">
              <div className="text-[10px] font-black text-muted-foreground uppercase tracking-wider mb-2">
                Order Fulfillment Status
              </div>
              <div className="flex gap-1.5 flex-wrap max-w-full overflow-x-auto">
                {(
                  ['All', 'Pending Payment', 'Confirmed', 'Payment Verified', 'Processing', 'Packed', 'Shipped', 'Delivered', 'Cancelled'] as const
                ).map((f) => (
                  <button
                    key={f}
                    onClick={() => setFilter(f)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-extrabold border transition cursor-pointer ${filter === f
                        ? 'bg-card border-primary text-primary shadow-xs font-black'
                        : 'bg-secondary/20 text-muted-foreground border-border hover:bg-secondary/40'
                      }`}
                  >
                    {f === 'Pending Payment' ? 'Unpaid' : f === 'Payment Verified' ? 'Paid' : f}
                  </button>
                ))}
              </div>
            </div>

            {/* TAB BAR 3: PAYMENT VERIFICATION & TIMEFRAME TABS */}
            <div className="pt-2 border-t border-border/40 grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Payment Verification Tabs */}
              <div>
                <div className="text-[10px] font-black text-muted-foreground uppercase tracking-wider mb-1.5">
                  Payment Status
                </div>
                <div className="flex gap-1 flex-wrap">
                  {(['All', 'Approved', 'Pending Verification', 'COD', 'Rejected'] as const).map((p) => (
                    <button
                      key={p}
                      onClick={() => setPaymentFilter(p)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition cursor-pointer ${paymentFilter === p
                          ? 'bg-foreground text-background border-foreground font-black'
                          : 'bg-card text-muted-foreground border-border hover:bg-secondary/30'
                        }`}
                    >
                      {p === 'Approved' ? 'Paid' : p === 'Pending Verification' ? 'Pending' : p}
                    </button>
                  ))}
                </div>
              </div>

              {/* Timeframe Tabs */}
              <div>
                <div className="text-[10px] font-black text-muted-foreground uppercase tracking-wider mb-1.5">
                  Timeframe
                </div>
                <div className="flex gap-1 flex-wrap">
                  {(
                    [
                      { id: 'All', label: 'All Time' },
                      { id: 'Today', label: 'Today' },
                      { id: '7Days', label: 'Last 7 Days' },
                      { id: 'ThisMonth', label: 'This Month' },
                    ] as const
                  ).map((t) => (
                    <button
                      key={t.id}
                      onClick={() => setDateFilter(t.id)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition cursor-pointer ${dateFilter === t.id
                          ? 'bg-foreground text-background border-foreground font-black'
                          : 'bg-card text-muted-foreground border-border hover:bg-secondary/30'
                        }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Sorting & Search */}
              <div>
                <div className="text-[10px] font-black text-muted-foreground uppercase tracking-wider mb-1.5">
                  Search &amp; Sort
                </div>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <input
                      type="text"
                      placeholder="Search ID, buyer, item..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="w-full pl-8 pr-3 py-1.5 border border-border/80 focus:border-primary rounded-xl bg-secondary/20 text-xs text-foreground outline-none font-bold"
                    />
                  </div>

                  <select
                    value={sortBy}
                    onChange={(e: any) => setSortBy(e.target.value)}
                    className="px-2 py-1.5 bg-card border border-border/80 rounded-xl text-xs font-bold text-foreground outline-none cursor-pointer"
                  >
                    <option value="newest">Newest</option>
                    <option value="oldest">Oldest</option>
                    <option value="amount_high">High ₹</option>
                    <option value="amount_low">Low ₹</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* MASTER-DETAIL SPLIT GRID */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Orders Master List with Pagination - 5 columns */}
            <div className="lg:col-span-5 bg-card border border-border/80 rounded-2xl overflow-hidden shadow-xs flex flex-col justify-between">
              <div>
                <div className="px-5 py-4 border-b border-border/60 bg-secondary/10 flex justify-between items-center">
                  <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">Orders Ledger</h3>
                  <span className="text-[10px] font-bold text-muted-foreground">
                    Page {ordersPage} of {totalOrdersPages} ({filteredOrders.length} Total)
                  </span>
                </div>

                <div className="divide-y divide-border/60 min-h-[380px]">
                  {paginatedOrders.map((order) => (
                    <div
                      key={order.id}
                      onClick={() => setSelectedOrder(order)}
                      className={`p-4 flex items-center justify-between cursor-pointer hover:bg-secondary/20 transition-all ${selectedOrder?.id === order.id ? 'bg-secondary/40 border-l-4 border-primary' : ''
                        }`}
                    >
                      <div>
                        <span className="font-bold text-xs text-foreground block">{order.customerName}</span>
                        <span className="text-[10px] text-muted-foreground block mt-1">
                          ID: {order.id} • {order.items.length} items
                        </span>
                        <span className="text-[9px] text-muted-foreground mt-0.5 block font-mono">{order.date}</span>
                      </div>
                      <div className="shrink-0 flex flex-col items-end gap-1.5">
                        <span className="font-mono text-xs font-black text-foreground">
                          ₹{order.totalAmount.toLocaleString('en-IN')}
                        </span>
                        {getOrderStatusBadge(order.orderStatus)}
                      </div>
                    </div>
                  ))}

                  {filteredOrders.length === 0 && (
                    <div className="p-8 text-center text-xs text-muted-foreground">
                      No orders found matching tab filters.
                    </div>
                  )}
                </div>
              </div>

              {/* Orders Pagination Controls Footer */}
              {totalOrdersPages > 1 && (
                <div className="p-3 border-t border-border/60 bg-secondary/10 flex items-center justify-between text-xs">
                  <button
                    disabled={ordersPage <= 1}
                    onClick={() => setOrdersPage((p) => Math.max(p - 1, 1))}
                    className="px-3 py-1.5 rounded-lg border bg-card text-foreground font-bold text-[11px] disabled:opacity-40 cursor-pointer flex items-center gap-1"
                  >
                    <ChevronLeft className="h-3.5 w-3.5" />
                    <span>Prev</span>
                  </button>

                  <div className="flex items-center gap-1">
                    {Array.from({ length: totalOrdersPages }, (_, i) => i + 1).map((pg) => (
                      <button
                        key={pg}
                        onClick={() => setOrdersPage(pg)}
                        className={`w-7 h-7 rounded-lg text-xs font-black transition ${ordersPage === pg
                            ? 'bg-primary text-primary-foreground shadow-xs'
                            : 'bg-card border text-muted-foreground hover:text-foreground'
                          }`}
                      >
                        {pg}
                      </button>
                    ))}
                  </div>

                  <button
                    disabled={ordersPage >= totalOrdersPages}
                    onClick={() => setOrdersPage((p) => Math.min(p + 1, totalOrdersPages))}
                    className="px-3 py-1.5 rounded-lg border bg-card text-foreground font-bold text-[11px] disabled:opacity-40 cursor-pointer flex items-center gap-1"
                  >
                    <span>Next</span>
                    <ChevronRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}
            </div>

            {/* Order Details Pane - 7 columns */}
            {selectedOrder ? (
              <div className="lg:col-span-7 bg-card border border-border/80 rounded-2xl p-5 sm:p-6 shadow-xs space-y-6">
                {/* Specs Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-border pb-4 gap-3">
                  <div>
                    <h3 className="text-base font-black text-foreground uppercase tracking-tight">Order Specifications</h3>
                    <p className="text-xs text-muted-foreground mt-0.5 font-mono">
                      Order ID: <strong className="text-foreground">{selectedOrder.id}</strong> • Placed: {selectedOrder.date}
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    {getOrderStatusBadge(selectedOrder.orderStatus)}

                    {(selectedOrder as any).commissionReleaseStatus === 'Released' || (selectedOrder as any).isCommissionReleased ? (
                      <span className="px-3 py-1.5 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-xl text-xs font-black flex items-center gap-1.5">
                        ✅ Commission Released
                      </span>
                    ) : (
                      <button
                        onClick={async () => {
                          const targetId = selectedOrder.id || (selectedOrder as any)._id;
                          setReleasingCommId(targetId);
                          try {
                            await releaseCommissions(targetId);
                            setSelectedOrder((prev) => (prev ? ({ ...prev, commissionReleaseStatus: 'Released', isCommissionReleased: true } as any) : prev));
                          } finally {
                            setReleasingCommId(null);
                          }
                        }}
                        disabled={releasingCommId === (selectedOrder.id || (selectedOrder as any)._id)}
                        className="px-3 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs font-black shadow-sm flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
                        title="Trigger ApexBee Commission Engine to distribute earnings to vendor & franchise wallets"
                      >
                        <span>{releasingCommId === (selectedOrder.id || (selectedOrder as any)._id) ? '⏳ Distributing...' : '💸 Distribute Commission'}</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Specs Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  {/* Buyer Box */}
                  <div className="space-y-3 bg-secondary/15 p-4 rounded-2xl border border-border/40">
                    <span className="text-[10px] font-black text-muted-foreground uppercase tracking-wider block">Buyer Registry</span>
                    <div className="space-y-1.5 text-xs">
                      <p>
                        <span className="text-muted-foreground font-semibold">Name: </span>
                        <strong className="text-foreground">{selectedOrder.customerName}</strong>
                      </p>
                      <p>
                        <span className="text-muted-foreground font-semibold">Phone: </span>
                        <strong className="font-mono text-foreground">{selectedOrder.customerMobile}</strong>
                      </p>
                      <p>
                        <span className="text-muted-foreground font-semibold">Address: </span>
                        <span className="text-foreground">{selectedOrder.customerAddress}</span>
                      </p>
                    </div>
                  </div>

                  {/* Financial Summary Box */}
                  <div className="space-y-3 bg-secondary/15 p-4 rounded-2xl border border-border/40">
                    <span className="text-[10px] font-black text-muted-foreground uppercase tracking-wider block">Financial Summary</span>
                    <div className="space-y-1.5 text-xs font-mono">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Subtotal:</span>
                        <span className="text-foreground font-bold">
                          ₹{selectedOrder.items.reduce((sum, i) => sum + i.price * i.quantity, 0)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Courier Charges:</span>
                        <span className="text-foreground">+₹{selectedOrder.orderStatus === 'Pending Payment' ? '0' : '40'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Packing Charges:</span>
                        <span className="text-foreground">+₹{selectedOrder.orderStatus === 'Pending Payment' ? '0' : '15'}</span>
                      </div>
                      <div className="flex justify-between border-t border-dashed border-border pt-1.5 font-black text-sm">
                        <span className="text-foreground">Grand Total:</span>
                        <span className="text-emerald-600 dark:text-emerald-400">
                          ₹{selectedOrder.totalAmount.toLocaleString('en-IN')}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Timeline Progress Bar */}
                <div className="space-y-3 bg-secondary/10 p-4 rounded-2xl border border-border/40">
                  <span className="text-[10px] font-black text-muted-foreground uppercase tracking-wider block">Fulfillment Milestones Tracker</span>
                  <div className="grid grid-cols-7 gap-1 text-center text-[9px] font-bold text-muted-foreground relative">
                    {['Pending', 'Confirmed', 'Paid', 'Processing', 'Packed', 'Shipped', 'Delivered'].map((step, idx) => {
                      const currentIdx = getStatusStepIndex(selectedOrder.orderStatus);
                      const isCompleted = idx <= currentIdx;
                      const isCurrent = idx === currentIdx;

                      return (
                        <div key={idx} className="space-y-1.5 flex flex-col items-center">
                          <div
                            className={`w-7 h-7 rounded-full flex items-center justify-center border transition-all text-xs font-black ${isCompleted
                                ? 'bg-primary border-primary text-primary-foreground shadow-xs'
                                : 'bg-card border-border text-muted-foreground'
                              }`}
                          >
                            {idx + 1}
                          </div>
                          <span className={isCurrent ? 'text-primary font-black' : isCompleted ? 'text-foreground' : 'text-muted-foreground'}>
                            {step}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Items List */}
                <div className="space-y-3">
                  <span className="text-[10px] font-black text-muted-foreground uppercase tracking-wider block">Ordered Products</span>
                  <div className="divide-y divide-border/60 border border-border/60 rounded-xl overflow-hidden">
                    {selectedOrder.items.map((item, idx) => (
                      <div key={idx} className="p-3.5 flex justify-between items-center bg-card text-xs">
                        <div>
                          <strong className="text-foreground block">{item.productName}</strong>
                          <span className="text-[10px] text-muted-foreground font-mono">Qty: {item.quantity} • Unit Price: ₹{item.price}</span>
                        </div>
                        <span className="font-mono font-bold text-foreground">₹{item.price * item.quantity}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="lg:col-span-7 bg-card border border-border/80 rounded-2xl p-12 text-center text-xs text-muted-foreground">
                Select an order from the ledger to inspect specifications.
              </div>
            )}
          </div>
        </>
      ) : (
        /* VIEW MODE 2: SUBSCRIBERS HUB */
        <div className="space-y-6">
          <div className="bg-card border border-border/80 rounded-2xl p-6 shadow-xs">
            <h3 className="text-sm font-bold text-foreground uppercase tracking-wider mb-2">Product Subscribers Hub</h3>
            <p className="text-xs text-muted-foreground mb-4">
              Manage repeating daily/weekly product subscriptions and automated billing cycles.
            </p>

            {loadingSubs ? (
              <div className="py-12 text-center text-xs text-muted-foreground">Loading active subscriptions...</div>
            ) : adminSubscriptions.length === 0 ? (
              <div className="py-12 text-center text-xs text-muted-foreground italic">No active product subscriptions found.</div>
            ) : (
              <div className="space-y-4">
                <div className="space-y-3">
                  {paginatedSubs.map((sub: any) => (
                    <div key={sub._id} className="p-4 bg-secondary/10 border border-border/60 rounded-2xl flex items-center justify-between text-xs">
                      <div>
                        <div className="font-bold text-foreground">{sub.productName || 'Subscription Plan'}</div>
                        <div className="text-[10px] text-muted-foreground">Frequency: {sub.frequency || 'Daily'} • Customer: {sub.userMobile || sub.userId}</div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="px-2.5 py-1 bg-emerald-500/20 text-emerald-400 font-bold rounded-lg text-[10px]">
                          {sub.status || 'ACTIVE'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                {totalSubsPages > 1 && (
                  <div className="pt-3 border-t border-border/60 flex items-center justify-between text-xs">
                    <button
                      disabled={subsPage <= 1}
                      onClick={() => setSubsPage((p) => Math.max(p - 1, 1))}
                      className="px-3 py-1.5 rounded-lg border bg-card text-foreground font-bold text-[11px] disabled:opacity-40 cursor-pointer flex items-center gap-1"
                    >
                      <ChevronLeft className="h-3.5 w-3.5" />
                      <span>Prev</span>
                    </button>
                    <span className="text-[10px] font-bold text-muted-foreground">Page {subsPage} of {totalSubsPages}</span>
                    <button
                      disabled={subsPage >= totalSubsPages}
                      onClick={() => setSubsPage((p) => Math.min(p + 1, totalSubsPages))}
                      className="px-3 py-1.5 rounded-lg border bg-card text-foreground font-bold text-[11px] disabled:opacity-40 cursor-pointer flex items-center gap-1"
                    >
                      <span>Next</span>
                      <ChevronRight className="h-3.5 w-3.5" />
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
