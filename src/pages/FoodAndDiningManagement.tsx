import React, { useState, useEffect } from 'react';
import {
  Utensils,
  CheckCircle2,
  XCircle,
  Search,
  Eye,
  RefreshCw,
  FileText,
  Check,
  X,
  ShieldCheck,
  Layers,
  BookOpen,
  ShoppingBag,
  Activity,
  Clock,
  MapPin,
  Phone,
  Mail,
  DollarSign,
  Power,
  Flame,
  Truck,
  AlertCircle,
  User,
} from 'lucide-react';
import axios from 'axios';

export const FoodAndDiningManagement: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'live_orders' | 'applications' | 'restaurants'>('live_orders');
  const [applications, setApplications] = useState<any[]>([]);
  const [restaurants, setRestaurants] = useState<any[]>([]);
  const [liveOrders, setLiveOrders] = useState<any[]>([]);
  const [orderStatusFilter, setOrderStatusFilter] = useState<string>('ALL');
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Selected Application Modal
  const [selectedApp, setSelectedApp] = useState<any | null>(null);

  // Selected Restaurant Modal (Inspection)
  const [selectedRestaurant, setSelectedRestaurant] = useState<any | null>(null);
  const [restaurantModalTab, setRestaurantModalTab] = useState<'overview' | 'menu' | 'orders'>('overview');
  const [restaurantMenu, setRestaurantMenu] = useState<{ categories: any[]; items: any[] }>({ categories: [], items: [] });
  const [restaurantOrders, setRestaurantOrders] = useState<any[]>([]);
  const [inspectionLoading, setInspectionLoading] = useState(false);

  const getAdminToken = () =>
    localStorage.getItem('adminToken') ||
    localStorage.getItem('admin_token') ||
    localStorage.getItem('token') ||
    localStorage.getItem('auth_token') ||
    '';

  const token = getAdminToken();
  const authHeader = token ? { headers: { Authorization: `Bearer ${token}` } } : {};

  const fetchData = async () => {
    setLoading(true);
    try {
      const [appRes, restRes, orderRes] = await Promise.all([
        axios.get('https://server.apexbee.in/api/admin/applications', authHeader).catch((err) => {
          console.warn('Admin applications endpoint warning:', err.message);
          return { data: { applications: [] } };
        }),
        axios.get('https://server.apexbee.in/api/admin/food/restaurants', authHeader).catch((err) => {
          console.warn('Admin food restaurants endpoint warning:', err.message);
          return axios.get('https://server.apexbee.in/api/food/restaurants').catch(() => ({ data: { restaurants: [] } }));
        }),
        axios.get('https://server.apexbee.in/api/admin/food/live-orders', authHeader).catch((err) => {
          console.warn('Admin live food orders endpoint warning:', err.message);
          return { data: { orders: [] } };
        }),
      ]);

      const rawApps = appRes.data?.applications || appRes.data?.data || appRes.data || [];
      if (Array.isArray(rawApps)) {
        const foodApps = rawApps.filter((a: any) =>
          String(a.applicationType || a.roleId || a.role || '').toLowerCase().includes('food')
        );
        setApplications(foodApps);
      }

      if (restRes.data?.restaurants) {
        setRestaurants(restRes.data.restaurants);
      }

      if (orderRes.data?.orders) {
        setLiveOrders(orderRes.data.orders);
      }
    } catch (err) {
      console.error('Failed to fetch food administration data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    // Auto-refresh live orders feed every 12 seconds
    const interval = setInterval(() => {
      axios.get('https://server.apexbee.in/api/admin/food/live-orders', authHeader)
        .then((res) => {
          if (res.data?.orders) {
            setLiveOrders(res.data.orders);
          }
        })
        .catch((err) => console.warn('Live order auto-refresh error:', err.message));
    }, 12000);

    return () => clearInterval(interval);
  }, []);

  const handleInspectRestaurant = async (rest: any) => {
    setSelectedRestaurant(rest);
    setRestaurantModalTab('overview');
    setInspectionLoading(true);
    try {
      const [menuRes, orderRes] = await Promise.all([
        axios.get(`https://server.apexbee.in/api/admin/food/restaurants/${rest._id}/menu`, authHeader).catch(() => ({ data: { categories: [], items: [] } })),
        axios.get(`https://server.apexbee.in/api/admin/food/restaurants/${rest._id}/orders`, authHeader).catch(() => ({ data: { orders: [] } })),
      ]);

      setRestaurantMenu({
        categories: menuRes.data?.categories || [],
        items: menuRes.data?.items || [],
      });
      setRestaurantOrders(orderRes.data?.orders || []);
    } catch (err) {
      console.error('Failed to load restaurant details for inspection:', err);
    } finally {
      setInspectionLoading(false);
    }
  };

  const handleApprove = async (appId: string) => {
    if (!token) return alert('Admin authentication token missing');
    try {
      await axios.patch(
        `https://server.apexbee.in/api/admin/applications/${appId}/verify-kyc`,
        { adminRemarks: 'Approved Food Partner Application & Provisioned Restaurant Profile' },
        authHeader
      );
      alert('✅ Food Partner Application approved & Restaurant Profile provisioned!');
      fetchData();
      setSelectedApp(null);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to approve application');
    }
  };

  const handleReject = async (appId: string) => {
    if (!token) return alert('Admin authentication token missing');
    try {
      await axios.patch(
        `https://server.apexbee.in/api/admin/applications/${appId}/reject`,
        { adminRemarks: 'Application rejected by Food & Dining Operations Admin' },
        authHeader
      );
      alert('Food Partner application rejected.');
      fetchData();
      setSelectedApp(null);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to reject application');
    }
  };

  const filteredApps = applications.filter((app) => {
    const term = search.toLowerCase();
    return (
      app.name?.toLowerCase().includes(term) ||
      app.restaurantName?.toLowerCase().includes(term) ||
      app.businessName?.toLowerCase().includes(term) ||
      app.mobile?.includes(term) ||
      app.fssaiNumber?.includes(term)
    );
  });

  const filteredRestaurants = restaurants.filter((r) => {
    const term = search.toLowerCase();
    return (
      r.restaurantName?.toLowerCase().includes(term) ||
      r.name?.toLowerCase().includes(term) ||
      r.city?.toLowerCase().includes(term) ||
      r.phone?.includes(term) ||
      r.fssaiNumber?.includes(term)
    );
  });

  const filteredLiveOrders = liveOrders.filter((ord) => {
    const matchesSearch =
      !search ||
      ord.orderNumber?.toLowerCase().includes(search.toLowerCase()) ||
      ord.customerId?.name?.toLowerCase().includes(search.toLowerCase()) ||
      ord.customerId?.phone?.includes(search) ||
      ord.sellerId?.businessName?.toLowerCase().includes(search.toLowerCase());

    const matchesStatus =
      orderStatusFilter === 'ALL' ||
      String(ord.orderStatus).toLowerCase() === orderStatusFilter.toLowerCase();

    return matchesSearch && matchesStatus;
  });

  // KPI Calculations
  const pendingPlacedCount = liveOrders.filter((o) => ['placed', 'placed', 'pending', 'new'].includes(String(o.orderStatus).toLowerCase())).length;
  const inKitchenCount = liveOrders.filter((o) => ['accepted', 'preparing', 'cooking'].includes(String(o.orderStatus).toLowerCase())).length;
  const outForDeliveryCount = liveOrders.filter((o) => ['ready_for_pickup', 'on_the_way', 'out_for_delivery', 'shipped'].includes(String(o.orderStatus).toLowerCase())).length;
  const completedCount = liveOrders.filter((o) => ['delivered', 'completed'].includes(String(o.orderStatus).toLowerCase())).length;

  return (
    <div className="space-y-6 font-['Plus_Jakarta_Sans',sans-serif]">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-100 flex items-center space-x-2 font-heading">
            <Utensils className="w-6 h-6 text-amber-400" />
            <span>Food & Dining Operations Command Center</span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time live order monitoring, kitchen management & food partner application governance
          </p>
        </div>

        <button
          onClick={fetchData}
          className="px-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs font-semibold text-slate-200 hover:text-white flex items-center space-x-2 self-start sm:self-auto cursor-pointer"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Live Feed</span>
        </button>
      </div>

      {/* KPI STATS BAR */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="glass-panel p-4 rounded-2xl border border-slate-800 flex items-center space-x-3">
          <div className="p-3 bg-amber-500/10 text-amber-400 rounded-xl">
            <Flame className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Live Orders</div>
            <div className="text-xl font-extrabold text-slate-100 font-mono">{liveOrders.length}</div>
          </div>
        </div>

        <div className="glass-panel p-4 rounded-2xl border border-slate-800 flex items-center space-x-3">
          <div className="p-3 bg-rose-500/10 text-rose-400 rounded-xl">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Placed / Pending</div>
            <div className="text-xl font-extrabold text-rose-400 font-mono">{pendingPlacedCount}</div>
          </div>
        </div>

        <div className="glass-panel p-4 rounded-2xl border border-slate-800 flex items-center space-x-3">
          <div className="p-3 bg-blue-500/10 text-blue-400 rounded-xl">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">In Kitchen (Preparing)</div>
            <div className="text-xl font-extrabold text-blue-400 font-mono">{inKitchenCount}</div>
          </div>
        </div>

        <div className="glass-panel p-4 rounded-2xl border border-slate-800 flex items-center space-x-3">
          <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-xl">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Delivered / Completed</div>
            <div className="text-xl font-extrabold text-emerald-400 font-mono">{completedCount}</div>
          </div>
        </div>
      </div>

      {/* SEARCH & TAB SELECTOR */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-900/60 p-3 rounded-2xl border border-slate-800">
        <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800 w-full sm:w-auto text-xs font-bold">
          <button
            onClick={() => setActiveTab('live_orders')}
            className={`px-4 py-2 rounded-lg transition cursor-pointer flex items-center space-x-1.5 ${activeTab === 'live_orders' ? 'bg-amber-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-white'
              }`}
          >
            <Flame className="w-3.5 h-3.5" />
            <span>Live Food Orders ({liveOrders.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('applications')}
            className={`px-4 py-2 rounded-lg transition cursor-pointer ${activeTab === 'applications' ? 'bg-amber-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-white'
              }`}
          >
            Partner Applications ({applications.length})
          </button>

          <button
            onClick={() => setActiveTab('restaurants')}
            className={`px-4 py-2 rounded-lg transition cursor-pointer ${activeTab === 'restaurants' ? 'bg-amber-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-white'
              }`}
          >
            Active Kitchens ({restaurants.length})
          </button>
        </div>

        <div className="flex items-center space-x-3 w-full sm:w-auto">
          {activeTab === 'live_orders' && (
            <select
              value={orderStatusFilter}
              onChange={(e) => setOrderStatusFilter(e.target.value)}
              className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-amber-500"
            >
              <option value="ALL">All Order Statuses</option>
              <option value="placed">Placed / New</option>
              <option value="accepted">Accepted</option>
              <option value="preparing">Preparing in Kitchen</option>
              <option value="ready_for_pickup">Ready for Pickup</option>
              <option value="on_the_way">Out for Delivery</option>
              <option value="delivered">Delivered</option>
              <option value="cancelled">Cancelled</option>
            </select>
          )}

          <div className="relative flex-1 sm:w-64">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search orders, phone, restaurant..."
              className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500"
            />
          </div>
        </div>
      </div>

      {/* TAB 1: LIVE FOOD ORDERS FEED */}
      {activeTab === 'live_orders' && (
        <div className="space-y-4">
          {loading ? (
            <div className="text-center py-16 text-slate-400 text-xs">Loading live food orders feed...</div>
          ) : filteredLiveOrders.length === 0 ? (
            <div className="glass-panel p-12 text-center rounded-3xl border border-slate-800 max-w-md mx-auto space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-400 flex items-center justify-center mx-auto">
                <ShoppingBag className="w-6 h-6" />
              </div>
              <h3 className="font-extrabold text-slate-200 text-base">No Live Food Orders Found</h3>
              <p className="text-xs text-slate-400">
                Incoming orders from the ApexBee Customer App for restaurants & cloud kitchens will appear here in real-time.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredLiveOrders.map((ord) => {
                const statusStr = String(ord.orderStatus || 'placed').toLowerCase();
                let statusBadge = 'bg-amber-500/20 text-amber-300 border-amber-500/30';
                if (['accepted', 'preparing'].includes(statusStr)) statusBadge = 'bg-blue-500/20 text-blue-400 border-blue-500/30';
                if (['ready_for_pickup', 'on_the_way', 'out_for_delivery'].includes(statusStr)) statusBadge = 'bg-purple-500/20 text-purple-300 border-purple-500/30';
                if (['delivered', 'completed'].includes(statusStr)) statusBadge = 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
                if (['cancelled', 'rejected'].includes(statusStr)) statusBadge = 'bg-rose-500/20 text-rose-400 border-rose-500/30';

                return (
                  <div key={ord._id} className="glass-panel p-5 rounded-3xl border border-slate-800 flex flex-col justify-between space-y-4">
                    <div>
                      {/* HEADER: ORDER NUMBER & STATUS */}
                      <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
                        <div>
                          <span className="font-mono font-bold text-amber-400 text-sm">
                            {ord.orderNumber || `AB-${ord._id.toString().slice(-6).toUpperCase()}`}
                          </span>
                          <div className="text-[10px] text-slate-500 flex items-center space-x-1 mt-0.5">
                            <Clock className="w-3 h-3" />
                            <span>{new Date(ord.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {new Date(ord.createdAt).toLocaleDateString()}</span>
                          </div>
                        </div>

                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase border ${statusBadge}`}>
                          {ord.orderStatus || 'PLACED'}
                        </span>
                      </div>

                      {/* KITCHEN / RESTAURANT INFO */}
                      <div className="mt-3 text-xs space-y-1">
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Restaurant / Kitchen</div>
                        <div className="font-bold text-slate-200 flex items-center space-x-1.5">
                          <Utensils className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                          <span className="truncate">{ord.sellerId?.businessName || ord.restaurantName || 'Food Partner Outlet'}</span>
                        </div>
                      </div>

                      {/* CUSTOMER INFO */}
                      <div className="mt-3 text-xs space-y-1">
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Customer Details</div>
                        <div className="text-slate-300 font-semibold flex items-center space-x-1.5">
                          <User className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                          <span>{ord.customerId?.name || ord.customerName || 'Customer'}</span>
                        </div>
                        {(ord.customerId?.phone || ord.customerPhone) && (
                          <div className="text-[11px] text-slate-400 flex items-center space-x-1.5">
                            <Phone className="w-3 h-3 text-slate-500 shrink-0" />
                            <span>{ord.customerId?.phone || ord.customerPhone}</span>
                          </div>
                        )}
                      </div>

                      {/* ORDERED ITEMS */}
                      <div className="mt-3 pt-3 border-t border-slate-800/60">
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                          Items ({Array.isArray(ord.items) ? ord.items.length : 0})
                        </div>
                        <div className="space-y-1 max-h-24 overflow-y-auto pr-1">
                          {Array.isArray(ord.items) && ord.items.length > 0 ? (
                            ord.items.map((item: any, idx: number) => (
                              <div key={idx} className="flex items-center justify-between text-[11px] text-slate-300">
                                <span className="truncate max-w-[180px]">
                                  {item.quantity || item.qty || 1}x {item.name || item.title || 'Food Item'}
                                </span>
                                <span className="font-mono text-slate-400">₹{item.price || item.unitPrice || 0}</span>
                              </div>
                            ))
                          ) : (
                            <div className="text-[11px] text-slate-500 italic">Food items summary included</div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* FOOTER: TOTAL AMOUNT & PAYOUT */}
                    <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase">Payment Mode</span>
                        <div className="font-bold text-slate-200 uppercase text-[11px]">{ord.paymentMethod || 'ONLINE'}</div>
                      </div>

                      <div className="text-right">
                        <span className="text-[10px] text-slate-400 uppercase">Total Bill</span>
                        <div className="font-extrabold text-amber-400 font-mono text-sm">₹{ord.totalAmount || ord.amount || 0}</div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* APPLICATIONS TAB */}
      {activeTab === 'applications' && (
        <div className="glass-panel rounded-3xl border border-slate-800 overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900/80 text-slate-400 font-bold border-b border-slate-800">
              <tr>
                <th className="p-4">Restaurant / Applicant</th>
                <th className="p-4">Food Business Type</th>
                <th className="p-4">FSSAI / Cuisines</th>
                <th className="p-4">Location</th>
                <th className="p-4 text-center">Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredApps.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-400">
                    No Food Partner applications submitted yet.
                  </td>
                </tr>
              ) : (
                filteredApps.map((app) => (
                  <tr key={app._id} className="hover:bg-slate-900/40 transition">
                    <td className="p-4">
                      <div className="font-bold text-slate-100">{app.restaurantName || app.businessName || app.name}</div>
                      <div className="text-[11px] text-slate-400">{app.name} • {app.mobile}</div>
                    </td>
                    <td className="p-4 text-slate-300 capitalize">{app.foodBusinessType?.replace('_', ' ') || 'RESTAURANT'}</td>
                    <td className="p-4 text-slate-400">
                      <div className="font-mono text-amber-400 font-semibold">FSSAI: {app.fssaiNumber || 'Pending'}</div>
                      <div className="text-[11px] text-slate-400 truncate max-w-[200px]">
                        {Array.isArray(app.cuisines) ? app.cuisines.join(', ') : app.cuisines || 'Multi-cuisine'}
                      </div>
                    </td>
                    <td className="p-4 text-slate-400">
                      <div>{app.location || app.address}</div>
                      <div className="text-[10px] text-slate-500">{[app.mandal, app.district, app.state].filter(Boolean).join(", ")}{app.pincode ? ` • PIN: ${app.pincode}` : ''}</div>
                    </td>
                    <td className="p-4 text-center">
                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase ${app.status === 'approved' || app.status === 'verified'
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : app.status === 'rejected'
                            ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                            : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                          }`}
                      >
                        {app.status || 'PENDING'}
                      </span>
                    </td>
                    <td className="p-4 text-right space-x-2">
                      <button
                        onClick={() => setSelectedApp(app)}
                        className="px-3 py-1.5 bg-slate-900 border border-slate-800 hover:border-slate-700 text-xs font-semibold text-slate-200 rounded-xl cursor-pointer"
                      >
                        View Details & Approve
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* ACTIVE RESTAURANTS TAB */}
      {activeTab === 'restaurants' && (
        <div className="glass-panel rounded-3xl border border-slate-800 overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900/80 text-slate-400 font-bold border-b border-slate-800">
              <tr>
                <th className="p-4">Restaurant Name</th>
                <th className="p-4">Business Type & FSSAI</th>
                <th className="p-4">City / Location</th>
                <th className="p-4 text-center">Kitchen Mode</th>
                <th className="p-4 text-center">Verification</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredRestaurants.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-400">
                    No active food partner restaurants found.
                  </td>
                </tr>
              ) : (
                filteredRestaurants.map((r) => (
                  <tr key={r._id} className="hover:bg-slate-900/40 transition">
                    <td className="p-4">
                      <div className="font-bold text-slate-100 text-sm">{r.restaurantName || r.name}</div>
                      <div className="text-[11px] text-slate-400">{r.phone || r.email}</div>
                    </td>
                    <td className="p-4">
                      <div className="text-slate-300 capitalize font-semibold">{r.businessType?.replace('_', ' ') || 'RESTAURANT'}</div>
                      <div className="text-[11px] font-mono text-amber-400">FSSAI: {r.fssaiNumber || 'Verified'}</div>
                    </td>
                    <td className="p-4 text-slate-400">
                      <div>{r.locality || r.address}</div>
                      <div className="text-[10px] text-slate-500">{r.city}, {r.state}</div>
                    </td>
                    <td className="p-4 text-center">
                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase ${r.operationalStatus === 'ONLINE'
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : r.operationalStatus === 'BUSY'
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                            : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                          }`}
                      >
                        {r.operationalStatus || 'ONLINE'}
                      </span>
                    </td>
                    <td className="p-4 text-center">
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                        {r.verificationStatus || 'APPROVED'}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <button
                        onClick={() => handleInspectRestaurant(r)}
                        className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs shadow-md transition flex items-center space-x-1 ml-auto cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Inspect Kitchen</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* APPLICATION MODAL */}
      {selectedApp && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="glass-panel p-6 rounded-3xl border border-slate-800 w-full max-w-2xl space-y-4 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h2 className="text-lg font-bold text-slate-100 font-heading">
                Food Partner Application Details
              </h2>
              <button onClick={() => setSelectedApp(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-slate-400 font-semibold block">Applicant Name:</span>
                <span className="font-bold text-slate-100">{selectedApp.name}</span>
              </div>

              <div>
                <span className="text-slate-400 font-semibold block">Restaurant / Outlet Name:</span>
                <span className="font-bold text-amber-400">{selectedApp.restaurantName || selectedApp.businessName}</span>
              </div>

              <div>
                <span className="text-slate-400 font-semibold block">Mobile Number:</span>
                <span className="font-semibold text-slate-200">{selectedApp.mobile}</span>
              </div>

              <div>
                <span className="text-slate-400 font-semibold block">Email Address:</span>
                <span className="font-semibold text-slate-200">{selectedApp.email}</span>
              </div>

              <div>
                <span className="text-slate-400 font-semibold block">Food Business Type:</span>
                <span className="font-semibold text-slate-200">{selectedApp.foodBusinessType || 'RESTAURANT'}</span>
              </div>

              <div>
                <span className="text-slate-400 font-semibold block">FSSAI License Number:</span>
                <span className="font-mono text-amber-400 font-bold">{selectedApp.fssaiNumber || 'N/A'}</span>
              </div>

              <div>
                <span className="text-slate-400 font-semibold block">Food Preference:</span>
                <span className="font-semibold text-emerald-400">{selectedApp.foodPreference || 'Both'}</span>
              </div>

              <div>
                <span className="text-slate-400 font-semibold block">Location / Address:</span>
                <span className="font-semibold text-slate-200">{selectedApp.address || selectedApp.location}</span>
                <span className="text-xs text-slate-400 block mt-0.5 font-mono">
                  {[selectedApp.mandal, selectedApp.district, selectedApp.state].filter(Boolean).join(', ')} • PIN: <strong className="text-amber-400">{selectedApp.pincode || 'Not provided'}</strong>
                </span>
              </div>
            </div>

            <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-800">
              <button
                onClick={() => handleReject(selectedApp._id)}
                className="px-4 py-2 bg-rose-500/10 border border-rose-500/20 hover:bg-rose-500/20 text-rose-400 text-xs font-bold rounded-xl transition cursor-pointer"
              >
                Reject Application
              </button>
              <button
                onClick={() => handleApprove(selectedApp._id)}
                className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-extrabold rounded-xl shadow-md transition cursor-pointer"
              >
                Approve & Provision Restaurant Profile
              </button>
            </div>
          </div>
        </div>
      )}

      {/* RESTAURANT INSPECTION MODAL */}
      {selectedRestaurant && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="glass-panel p-6 rounded-3xl border border-slate-800 w-full max-w-3xl space-y-4 my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <h2 className="text-lg font-bold text-slate-100 font-heading">
                  {selectedRestaurant.restaurantName || selectedRestaurant.name}
                </h2>
                <p className="text-xs text-amber-400">
                  {selectedRestaurant.city}, {selectedRestaurant.state} • FSSAI: {selectedRestaurant.fssaiNumber || 'Verified'}
                </p>
              </div>

              <button onClick={() => setSelectedRestaurant(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* TAB TOGGLE INSIDE INSPECTION MODAL */}
            <div className="flex bg-slate-900/80 p-1 rounded-xl border border-slate-800 text-xs">
              <button
                onClick={() => setRestaurantModalTab('overview')}
                className={`flex-1 py-2 font-bold rounded-lg transition cursor-pointer ${restaurantModalTab === 'overview' ? 'bg-amber-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-white'
                  }`}
              >
                Overview & KYC
              </button>
              <button
                onClick={() => setRestaurantModalTab('menu')}
                className={`flex-1 py-2 font-bold rounded-lg transition cursor-pointer ${restaurantModalTab === 'menu' ? 'bg-amber-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-white'
                  }`}
              >
                Dishes & Menu ({restaurantMenu.items.length})
              </button>
              <button
                onClick={() => setRestaurantModalTab('orders')}
                className={`flex-1 py-2 font-bold rounded-lg transition cursor-pointer ${restaurantModalTab === 'orders' ? 'bg-amber-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-white'
                  }`}
              >
                Order History ({restaurantOrders.length})
              </button>
            </div>

            {/* MODAL TAB 1: OVERVIEW */}
            {restaurantModalTab === 'overview' && (
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-slate-400 font-semibold block">Owner / Contact Name:</span>
                  <span className="font-bold text-slate-100">{selectedRestaurant.legalBusinessName || selectedRestaurant.name}</span>
                </div>

                <div>
                  <span className="text-slate-400 font-semibold block">Phone / Contact:</span>
                  <span className="font-semibold text-slate-200">{selectedRestaurant.phone}</span>
                </div>

                <div>
                  <span className="text-slate-400 font-semibold block">Email Address:</span>
                  <span className="font-semibold text-slate-200">{selectedRestaurant.email}</span>
                </div>

                <div>
                  <span className="text-slate-400 font-semibold block">Kitchen Status:</span>
                  <span className="font-extrabold text-emerald-400 uppercase">{selectedRestaurant.operationalStatus || 'ONLINE'}</span>
                </div>

                <div>
                  <span className="text-slate-400 font-semibold block">Address / Locality:</span>
                  <span className="font-semibold text-slate-200">{selectedRestaurant.locality || selectedRestaurant.address}</span>
                </div>

                <div>
                  <span className="text-slate-400 font-semibold block">Food Preference:</span>
                  <span className="font-bold text-slate-200">{selectedRestaurant.foodPreference || 'Both'}</span>
                </div>
              </div>
            )}

            {/* MODAL TAB 2: MENU & DISHES */}
            {restaurantModalTab === 'menu' && (
              <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
                {inspectionLoading ? (
                  <div className="text-center py-10 text-slate-400">Loading restaurant menu...</div>
                ) : restaurantMenu.items.length === 0 ? (
                  <div className="text-center py-10 text-slate-400 italic">No menu items added by this restaurant yet.</div>
                ) : (
                  <div className="space-y-2">
                    {restaurantMenu.items.map((item) => (
                      <div key={item._id} className="p-3 bg-slate-950 rounded-2xl border border-slate-800 flex items-center justify-between text-xs">
                        <div>
                          <div className="font-bold text-slate-100">{item.name}</div>
                          <div className="text-[11px] text-slate-400 font-mono">Price: ₹{item.basePrice}</div>
                        </div>

                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30">
                          {item.approvalStatus || 'APPROVED'}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* MODAL TAB 3: ORDERS HISTORY */}
            {restaurantModalTab === 'orders' && (
              <div className="space-y-4 max-h-96 overflow-y-auto pr-1">
                {inspectionLoading ? (
                  <div className="text-center py-10 text-slate-400">Loading orders history...</div>
                ) : restaurantOrders.length === 0 ? (
                  <div className="text-center py-10 text-slate-400 italic">No orders recorded for this restaurant yet.</div>
                ) : (
                  <div className="space-y-3">
                    {restaurantOrders.map((ord) => (
                      <div key={ord._id} className="p-3.5 bg-slate-950 rounded-2xl border border-slate-800 flex items-center justify-between text-xs">
                        <div>
                          <div className="font-extrabold text-amber-400 font-mono">
                            {ord.orderNumber || `AB-${ord._id.toString().slice(-6)}`}
                          </div>
                          <div className="text-[11px] text-slate-400">{new Date(ord.createdAt).toLocaleString()}</div>
                        </div>

                        <div className="text-right">
                          <div className="font-mono font-bold text-slate-100">₹{ord.totalAmount || ord.amount || 0}</div>
                          <span className="text-[10px] font-bold text-emerald-400 uppercase">{ord.orderStatus || 'Delivered'}</span>
                        </div>
                      </div>
                    ))}
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
