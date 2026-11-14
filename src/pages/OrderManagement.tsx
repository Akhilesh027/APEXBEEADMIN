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
  ShieldCheck,
  Tag,
  Percent,
  Receipt,
  Store,
  Bike,
  Coins,
  Eye,
  Package,
  Droplets
} from 'lucide-react';

// Helpers for order calculations & delivery info
export const getOrderCalculations = (order: Order) => {
  const summary = (order as any).orderSummary || {};
  const items = order.items || [];

  const calculatedItemsTotal = items.reduce((sum, item) => sum + (item.price || 0) * (item.quantity || 1), 0);
  const calculatedMrpTotal = items.reduce((sum, item) => sum + ((item as any).mrp || item.price || 0) * (item.quantity || 1), 0);

  const totalMrp = Number(summary.mrp ?? summary.totalMrp ?? (order as any).mrp ?? calculatedMrpTotal);
  const rawSubtotal = Number(summary.subtotal ?? (order as any).subtotal ?? calculatedItemsTotal);
  const discount = Number(summary.discount ?? summary.mrpDiscount ?? (order as any).discount ?? Math.max(0, totalMrp - rawSubtotal));
  const subtotal = rawSubtotal > 0 ? rawSubtotal : Math.max(0, totalMrp - discount);

  const totalTax = Number(summary.tax ?? (order as any).tax ?? 0);
  let cgst = summary.cgst !== undefined && summary.cgst !== null ? Number(summary.cgst) : (order as any).cgst !== undefined && (order as any).cgst !== null ? Number((order as any).cgst) : null;
  let sgst = summary.sgst !== undefined && summary.sgst !== null ? Number(summary.sgst) : (order as any).sgst !== undefined && (order as any).sgst !== null ? Number((order as any).sgst) : null;

  if ((cgst === null || sgst === null) && totalTax > 0) {
    cgst = Number((totalTax / 2).toFixed(2));
    sgst = Number((totalTax / 2).toFixed(2));
  } else if (cgst === null && sgst === null) {
    cgst = 0;
    sgst = 0;
  }

  const shipping = Number(summary.shippingFee ?? summary.shipping ?? (order as any).shippingCharge ?? 0);
  const packing = Number(summary.packageCharge ?? summary.packing ?? (order as any).packingCharge ?? 0);
  const platformFee = Number(summary.platformFee ?? (order as any).platformFee ?? 0);
  const couponDiscount = Number(summary.couponDiscount ?? (order as any).couponDiscount ?? 0);
  const walletDeduction = Number(summary.walletDeduction ?? (order as any).walletDeduction ?? 0);
  const couponCode = (order as any).couponCode || (summary as any).couponCode || '';

  const grandTotal = Number(summary.grandTotal ?? summary.total ?? order.totalAmount ?? (subtotal + totalTax + shipping + packing + platformFee - couponDiscount - walletDeduction));

  const isStoreSelfDelivery = order.deliveryType === 'Vendor' || (order as any).deliveryMode === 'store_delivery' || (order as any).fulfillment?.deliveryType === 'store_delivery';
  const commission = Number((order as any).commissionAmount ?? Math.round(subtotal * 0.05));
  const vendorDeliveryFee = isStoreSelfDelivery ? shipping : 0;
  const netVendorPayout = Math.max(0, subtotal - commission + vendorDeliveryFee);

  const gstRate = subtotal > 0 && totalTax > 0 ? Math.round((totalTax / subtotal) * 100) : 0;
  const halfGstRate = gstRate > 0 ? Number((gstRate / 2).toFixed(1)) : 0;

  return {
    totalMrp,
    discount,
    subtotal,
    cgst: cgst ?? 0,
    sgst: sgst ?? 0,
    totalTax,
    gstRate,
    halfGstRate,
    shipping,
    packing,
    platformFee,
    couponDiscount,
    couponCode,
    walletDeduction,
    grandTotal,
    commission,
    isStoreSelfDelivery,
    vendorDeliveryFee,
    netVendorPayout,
  };
};

export const getDeliveryTypeInfo = (order: Order) => {
  const isPickup = Boolean(order.isSelfPickup || (order as any).fulfillment?.type === 'pickup' || (order.deliveryType as string) === 'pickup');
  const isSubscription = Boolean(order.isScheduledSubscription || (order as any).isSubscription);
  const isStoreSelf = order.deliveryType === 'Vendor' || (order as any).deliveryMode === 'store_delivery' || (order as any).fulfillment?.deliveryType === 'store_delivery';

  if (isSubscription) {
    return {
      type: 'subscription',
      badge: '🔁 Subscribed Route',
      label: 'Recurring Hyperlocal Subscription',
      color: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/30',
      description: 'Scheduled doorstep recurring delivery route with automated calendar fulfillment.',
      icon: '🔁'
    };
  }
  if (isPickup) {
    return {
      type: 'pickup',
      badge: '🏪 In-Store Pickup',
      label: 'Customer Self-Pickup',
      color: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30',
      description: 'Customer visits the merchant store directly to collect package with verified OTP handshake.',
      icon: '🏪'
    };
  }
  if (isStoreSelf) {
    return {
      type: 'store_delivery',
      badge: '🛵 Store Self-Delivery',
      label: 'Store Partner Self-Delivery',
      color: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
      description: 'Handled directly by merchant private fleet / staff. Delivery fee is retained by the vendor.',
      icon: '🛵'
    };
  }
  return {
    type: 'platform',
    badge: '🚚 Platform Courier',
    label: 'ApexBee Platform Courier Pool',
    color: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30',
    description: 'Fulfilled by ApexBee broadcast rider network or partner courier (Delhivery/Dunzo).',
    icon: '🚚'
  };
};

interface OrderManagementProps {
  defaultView?: 'orders' | 'subscriptions';
}

export const OrderManagement: React.FC<OrderManagementProps> = ({ defaultView = 'orders' }) => {
  const { orders, updateOrderStatus, releaseCommissions } = useAdminState();
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(orders[0] || null);

  // Tab Filtering States
  const [dbCategories, setDbCategories] = useState<any[]>([]);
  const [selectedDbCategory, setSelectedDbCategory] = useState<string>('ALL');
  const [orderTypeFilter, setOrderTypeFilter] = useState<'All' | 'normal' | 'pickup' | 'subscribed'>('All');
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
  const [selectedSubModal, setSelectedSubModal] = useState<any | null>(null);
  const [allStatements, setAllStatements] = useState<any[]>([]);
  const [settlingId, setSettlingId] = useState<string | null>(null);
  const [releasingCommId, setReleasingCommId] = useState<string | null>(null);
  const [releasingAllComms, setReleasingAllComms] = useState<boolean>(false);
  const [courier, setCourier] = useState('Delhivery');
  const [tracking, setTracking] = useState('');
  const [isDispatching, setIsDispatching] = useState(false);

  // Subscriptions Filter States
  const [subSearch, setSubSearch] = useState('');
  const [subStatusFilter, setSubStatusFilter] = useState<string>('All');
  const [subFrequencyFilter, setSubFrequencyFilter] = useState<string>('All');
  const [subPortalFilter, setSubPortalFilter] = useState<string>('All');
  const [subFulfillmentFilter, setSubFulfillmentFilter] = useState<string>('All');

  const selectedCalc = useMemo(() => {
    return selectedOrder ? getOrderCalculations(selectedOrder) : null;
  }, [selectedOrder]);

  const selectedDelInfo = useMemo(() => {
    return selectedOrder ? getDeliveryTypeInfo(selectedOrder) : null;
  }, [selectedOrder]);

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

        let subsList: any[] = [];
        try {
          const res = await fetch('https://server.apexbee.in/api/admin/product-subscriptions', { headers });
          if (res.ok) {
            const data = await res.json();
            if (data.success) {
              const localSubs = (data.subscriptions || []).map((s: any) => {
                const qty = Number(s.quantity || 1);
                const unitPrice = Number(s.unitPrice || s.productId?.price || 0);
                const daysInCycle = s.frequency === 'daily' ? 30 : s.frequency === 'alternate' ? 15 : s.frequency === 'weekly' ? 4 : 1;
                const cycleSubtotal = qty * unitPrice * daysInCycle;
                const estTax = Math.round(cycleSubtotal * 0.05 * 100) / 100;
                const estTotal = cycleSubtotal + estTax;
                const isSelf = s.deliveryAgentType === 'self_delivery' || !s.deliveryAgentType;

                return {
                  ...s,
                  isLocalSub: true,
                  subscriptionId: s._id,
                  displayId: `SUB-${s._id.toString().slice(-6).toUpperCase()}`,
                  customerName: s.customerName || s.userId?.name || 'Subscriber Customer',
                  customerMobile: s.customerPhone || s.userId?.phone || 'N/A',
                  customerAddress: s.deliveryAddress || s.address || 'Doorstep Delivery Address',
                  productName: s.productName || s.productId?.name || 'Recurring Subscribed Item',
                  productImage: s.productImage || s.productId?.thumbnail || (Array.isArray(s.productId?.images) ? s.productId.images[0] : '') || '',
                  quantity: qty,
                  unitPrice: unitPrice,
                  frequency: s.frequency || 'daily',
                  deliverySlot: s.deliverySlot || 'Morning (6:00 AM - 8:30 AM)',
                  status: (s.status || 'active').toLowerCase(),
                  autoRenew: s.autoRenew !== false,
                  startDate: s.startDate || (s.createdAt ? new Date(s.createdAt).toISOString().split('T')[0] : 'Active'),
                  storeName: s.vendorId?.businessName || s.vendorId?.shopName || s.vendorId?.name || 'Partner Store',
                  storePhone: s.vendorId?.phone || '',
                  fulfillmentMode: isSelf ? 'Store Partner Self-Delivery Fleet' : 'Platform Logistics Courier',
                  isStoreSelfDelivery: isSelf,
                  deliveryAgentName: s.deliveryAgentName || '',
                  subtotal: cycleSubtotal,
                  tax: estTax,
                  shippingFee: 0,
                  grandTotal: estTotal,
                  commissionStatus: s.commissionReleased ? 'Released' : 'Pending',
                  isCommissionReleased: Boolean(s.commissionReleased),
                  portalType: s.portalType || (s.productName?.toLowerCase().includes('water') ? 'water' : s.productName?.toLowerCase().includes('milk') ? 'dairy' : 'general'),
                  deliveryHistory: s.deliveryHistory || [],
                  createdAt: s.createdAt
                };
              });

              const subOrders = (data.orders || []).map((o: any) => {
                const summary = o.orderSummary || {};
                const firstItem = (o.items && o.items[0]) || {};
                const freq = o.scheduleDetails?.frequency || o.frequency || 'daily';
                const isSelf = o.deliveryType === 'self_delivery' || o.isSelfDelivery || Boolean(o.sellerId?.deliveryMode === 'self_delivery') || o.deliveryType === 'Vendor';
                const title = firstItem.productName || firstItem.name || 'Subscribed Order Item';

                return {
                  ...o,
                  isLocalSub: false,
                  subscriptionId: o._id,
                  displayId: o.orderNumber || `#AB-${o._id.toString().slice(-6).toUpperCase()}`,
                  customerName: o.shippingAddress?.name || o.customerId?.name || o.customerName || 'Subscriber Customer',
                  customerMobile: o.shippingAddress?.phone || o.customerId?.phone || o.customerMobile || 'N/A',
                  customerAddress: [o.shippingAddress?.address || o.deliveryAddress, o.shippingAddress?.city, o.shippingAddress?.pincode].filter(Boolean).join(', ') || 'Doorstep Delivery',
                  productName: title,
                  productImage: firstItem.image || firstItem.productId?.thumbnail || (Array.isArray(firstItem.productId?.images) ? firstItem.productId.images[0] : '') || '',
                  quantity: Number(firstItem.quantity || 1),
                  unitPrice: Number(firstItem.price || firstItem.unitPrice || 0),
                  frequency: freq,
                  deliverySlot: o.deliverySlot || o.preOrderTimeSlot || o.scheduleDetails?.deliverySlot || 'Morning (6:00 AM - 8:30 AM)',
                  status: (o.orderStatus || 'active').toLowerCase(),
                  autoRenew: o.autoRenew !== false,
                  startDate: o.createdAt ? new Date(o.createdAt).toISOString().split('T')[0] : 'Active',
                  storeName: o.sellerId?.businessName || o.sellerId?.shopName || o.sellerId?.name || 'Local Merchant',
                  storePhone: o.sellerId?.phone || '',
                  fulfillmentMode: isSelf ? 'Store Partner Self-Delivery Fleet' : 'Platform Logistics Courier',
                  isStoreSelfDelivery: isSelf,
                  deliveryAgentName: o.assignedDeliveryAgent || o.deliveryAgentName || '',
                  subtotal: Number(summary.subtotal || o.subtotal || 0),
                  tax: Number(summary.tax || (Number(summary.cgst || 0) + Number(summary.sgst || 0)) || 0),
                  shippingFee: Number(summary.shipping ?? summary.shippingFee ?? o.shippingCharge ?? 0),
                  grandTotal: Number(summary.grandTotal || summary.total || o.totalAmount || 0),
                  commissionStatus: (o.commissionReleaseStatus === 'Released' || o.isCommissionReleased) ? 'Released' : 'Pending',
                  isCommissionReleased: Boolean(o.commissionReleaseStatus === 'Released' || o.isCommissionReleased),
                  portalType: title.toLowerCase().includes('water') ? 'water' : title.toLowerCase().includes('milk') ? 'dairy' : 'general',
                  deliveryHistory: o.deliveryHistory || [],
                  createdAt: o.createdAt
                };
              });

              subsList = [...localSubs, ...subOrders];
            }
          }
        } catch (_) { }

        if (subsList.length === 0) {
          const fallbackRes = await fetch('https://server.apexbee.in/api/local-shop/subscriptions/admin/all', { headers });
          if (fallbackRes.ok) {
            const fbData = await fallbackRes.json();
            if (fbData.success && Array.isArray(fbData.subscriptions)) {
              subsList = fbData.subscriptions.map((s: any) => ({
                ...s,
                subscriptionId: s._id,
                displayId: `SUB-${s._id.toString().slice(-6).toUpperCase()}`,
                customerName: s.customerName || s.userMobile || 'Subscriber Customer',
                customerMobile: s.userMobile || s.customerPhone || 'N/A',
                customerAddress: s.address || s.deliveryAddress || 'Doorstep Delivery Address',
                productName: s.productName || 'Subscribed Product',
                quantity: Number(s.quantity || 1),
                unitPrice: Number(s.unitPrice || 0),
                frequency: s.frequency || 'daily',
                deliverySlot: s.deliverySlot || 'Morning (6:00 AM - 8:30 AM)',
                status: (s.status || 'active').toLowerCase(),
                autoRenew: s.autoRenew !== false,
                startDate: s.startDate || 'Active',
                storeName: s.vendorName || 'Partner Store',
                fulfillmentMode: 'Store Partner Self-Delivery Fleet',
                isStoreSelfDelivery: true,
                subtotal: Number(s.unitPrice || 0) * Number(s.quantity || 1) * 30,
                tax: Math.round(Number(s.unitPrice || 0) * Number(s.quantity || 1) * 30 * 0.05 * 100) / 100,
                shippingFee: 0,
                grandTotal: Math.round(Number(s.unitPrice || 0) * Number(s.quantity || 1) * 30 * 1.05 * 100) / 100,
                commissionStatus: s.commissionReleased ? 'Released' : 'Pending',
                isCommissionReleased: Boolean(s.commissionReleased),
                portalType: s.portalType || 'dairy',
                deliveryHistory: s.deliveryHistory || []
              }));
            }
          }
        }

        setAdminSubscriptions(subsList);
        if (subsList.length > 0 && !selectedSubDetail) {
          setSelectedSubDetail(subsList[0]);
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
      const res = await fetch(`https://server.apexbee.in/api/local-shop/billing/statements/${id}/approve`, {
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

    // Order Type Filter (Normal, Self Pickup, Subscribed)
    if (orderTypeFilter !== 'All') {
      result = result.filter((o: any) => {
        const isSub = Boolean(o.isScheduledSubscription || o.isSubscription);
        const isPickup = Boolean(o.fulfillment?.type === 'pickup' || o.deliveryType === 'pickup' || o.isSelfPickup);
        if (orderTypeFilter === 'subscribed') return isSub;
        if (orderTypeFilter === 'pickup') return isPickup && !isSub;
        if (orderTypeFilter === 'normal') return !isSub && !isPickup;
        return true;
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
  }, [orders, selectedDbCategory, orderTypeFilter, dbCategories, filter, paymentFilter, dateFilter, sortBy, search]);

  const hasActiveFilters =
    selectedDbCategory !== 'ALL' || orderTypeFilter !== 'All' || filter !== 'All' || paymentFilter !== 'All' || dateFilter !== 'All' || sortBy !== 'newest' || search !== '';

  const handleResetFilters = () => {
    setSelectedDbCategory('ALL');
    setOrderTypeFilter('All');
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

  const handleReleaseAllCommissions = async () => {
    if (!window.confirm('⚡ Are you sure you want to distribute and release all pending platform commissions, vendor payouts, and referral rewards to partner wallets?')) {
      return;
    }
    try {
      setReleasingAllComms(true);
      const success = await releaseCommissions();
      if (success) {
        alert('🎉 All platform commissions distributed successfully! Wallets credited.');
        setAdminSubscriptions((prev) =>
          prev.map((s) => ({ ...s, commissionStatus: 'Released', isCommissionReleased: true }))
        );
      }
    } catch (err: any) {
      alert(err.message || 'Error distributing commissions');
    } finally {
      setReleasingAllComms(false);
    }
  };

  const handleDistributeCommission = async (id: string) => {
    try {
      setReleasingCommId(id);
      const success = await releaseCommissions(id);
      if (success) {
        setAdminSubscriptions((prev) =>
          prev.map((s) => (s._id === id || s.subscriptionId === id ? { ...s, commissionStatus: 'Released', isCommissionReleased: true } : s))
        );
        if (selectedOrder && ((selectedOrder as any)._id === id || selectedOrder.id === id)) {
          setSelectedOrder((prev) => (prev ? ({ ...prev, commissionReleaseStatus: 'Released', isCommissionReleased: true } as any) : prev));
        }
        if (selectedSubModal && (selectedSubModal._id === id || selectedSubModal.subscriptionId === id)) {
          setSelectedSubModal((prev: any) => ({ ...prev, commissionStatus: 'Released', isCommissionReleased: true }));
        }
        alert('Commissions successfully distributed to vendor, franchise, and referral wallets!');
      }
    } finally {
      setReleasingCommId(null);
    }
  };

  // Subscriptions KPI Stats
  const subStats = useMemo(() => {
    let totalMRV = 0;
    let activeCount = 0;
    let dairyCount = 0;
    let waterCount = 0;
    let storeFleetCount = 0;

    adminSubscriptions.forEach((s) => {
      totalMRV += Number(s.grandTotal || 0);
      if (s.status === 'active') activeCount++;
      if (s.portalType === 'dairy' || s.productName?.toLowerCase().includes('milk') || s.productName?.toLowerCase().includes('dairy')) dairyCount++;
      if (s.portalType === 'water' || s.productName?.toLowerCase().includes('water')) waterCount++;
      if (s.isStoreSelfDelivery) storeFleetCount++;
    });

    return {
      totalCount: adminSubscriptions.length,
      activeCount,
      dairyCount,
      waterCount,
      storeFleetCount,
      totalMRV
    };
  }, [adminSubscriptions]);

  // Filtered Subscriptions
  const filteredSubs = useMemo(() => {
    return adminSubscriptions.filter((s) => {
      if (subSearch.trim()) {
        const q = subSearch.toLowerCase();
        const dispId = (s.displayId || '').toLowerCase();
        const custName = (s.customerName || '').toLowerCase();
        const custMobile = (s.customerMobile || '').toLowerCase();
        const prod = (s.productName || '').toLowerCase();
        const store = (s.storeName || '').toLowerCase();
        const addr = (s.customerAddress || '').toLowerCase();
        if (!dispId.includes(q) && !custName.includes(q) && !custMobile.includes(q) && !prod.includes(q) && !store.includes(q) && !addr.includes(q)) {
          return false;
        }
      }

      if (subStatusFilter !== 'All') {
        if (s.status !== subStatusFilter) return false;
      }

      if (subFrequencyFilter !== 'All') {
        if ((s.frequency || '').toLowerCase() !== subFrequencyFilter) return false;
      }

      if (subPortalFilter !== 'All') {
        if (subPortalFilter === 'dairy' && !(s.portalType === 'dairy' || s.productName?.toLowerCase().includes('milk') || s.productName?.toLowerCase().includes('dairy'))) return false;
        if (subPortalFilter === 'water' && !(s.portalType === 'water' || s.productName?.toLowerCase().includes('water'))) return false;
        if (subPortalFilter === 'general' && (s.portalType === 'dairy' || s.portalType === 'water')) return false;
      }

      if (subFulfillmentFilter !== 'All') {
        if (subFulfillmentFilter === 'self_delivery' && !s.isStoreSelfDelivery) return false;
        if (subFulfillmentFilter === 'platform' && s.isStoreSelfDelivery) return false;
      }

      return true;
    });
  }, [adminSubscriptions, subSearch, subStatusFilter, subFrequencyFilter, subPortalFilter, subFulfillmentFilter]);

  // Paginated Subscriptions
  const totalSubsPages = Math.ceil(filteredSubs.length / subsPerPage) || 1;
  const paginatedSubs = useMemo(() => {
    const start = (subsPage - 1) * subsPerPage;
    return filteredSubs.slice(start, start + subsPerPage);
  }, [filteredSubs, subsPage, subsPerPage]);

  const getOrderStatusBadge = (status: Order['orderStatus']) => {
    switch (status) {
      case 'Placed':
        return <span className="px-2.5 py-1 bg-blue-500/10 text-blue-600 font-black rounded-lg text-[10px]">Order Placed</span>;
      case 'Pending Payment':
        return <span className="px-2.5 py-1 bg-amber-500/10 text-amber-500 font-bold rounded-lg text-[10px]">Unpaid</span>;
      case 'Confirmed':
        return <span className="px-2.5 py-1 bg-sky-500/10 text-sky-600 font-bold rounded-lg text-[10px]">Confirmed</span>;
      case 'Accepted':
      case 'Assigned':
        return <span className="px-2.5 py-1 bg-amber-500/10 text-amber-600 font-bold rounded-lg text-[10px]">Rider Assigned 🛵</span>;
      case 'Reached Vendor':
        return <span className="px-2.5 py-1 bg-purple-500/10 text-purple-600 font-bold rounded-lg text-[10px]">Rider at Store 🏬</span>;
      case 'Payment Verified':
        return <span className="px-2.5 py-1 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold rounded-lg text-[10px]">Paid / Verified</span>;
      case 'Processing':
        return <span className="px-2.5 py-1 bg-indigo-500/10 text-indigo-500 font-bold rounded-lg text-[10px]">Processing</span>;
      case 'Packed':
        return <span className="px-2.5 py-1 bg-purple-500/10 text-purple-600 font-bold rounded-lg text-[10px]">Packed & Ready</span>;
      case 'Ready for Pickup':
        return <span className="px-2.5 py-1 bg-amber-500/10 text-amber-700 font-bold rounded-lg text-[10px]">Ready for Pickup 🏪</span>;
      case 'Picked Up':
        return <span className="px-2.5 py-1 bg-indigo-500/10 text-indigo-600 font-bold rounded-lg text-[10px]">Picked Up 📦</span>;
      case 'Out for Delivery':
        return <span className="px-2.5 py-1 bg-indigo-500/10 text-indigo-600 font-bold rounded-lg text-[10px]">Out for Delivery 🚚</span>;
      case 'Reached Customer':
        return <span className="px-2.5 py-1 bg-sky-500/10 text-sky-600 font-bold rounded-lg text-[10px]">Rider at Doorstep 📍</span>;
      case 'Shipped':
        return <span className="px-2.5 py-1 bg-pink-500/10 text-pink-500 font-bold rounded-lg text-[10px]">Shipped</span>;
      case 'Delivered':
        return <span className="px-2.5 py-1 bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-black rounded-lg text-[10px]">Delivered ✅</span>;
      case 'Cancelled':
        return <span className="px-2.5 py-1 bg-rose-500/10 text-rose-600 font-bold rounded-lg text-[10px]">Cancelled ❌</span>;
      case 'Returned':
        return <span className="px-2.5 py-1 bg-orange-500/10 text-orange-600 font-bold rounded-lg text-[10px]">Returned ↩️</span>;
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
      {/* Header Bar with View Selector & Commission Release Button */}
      <div className="bg-card border border-border/80 rounded-2xl p-4 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex border border-border/80 rounded-xl p-1 bg-secondary/20 flex-wrap">
            <button
              onClick={() => setMainView('orders')}
              className={`px-4 py-2 text-xs font-bold rounded-lg transition cursor-pointer flex items-center gap-1.5 ${mainView === 'orders' ? 'bg-card text-foreground shadow-xs font-black' : 'text-muted-foreground hover:text-foreground'
                }`}
            >
              <ShoppingBag className="h-4 w-4 text-primary" />
              <span>Hyperlocal Store Orders ({orders.length})</span>
            </button>
            <button
              onClick={() => setMainView('subscriptions')}
              className={`px-4 py-2 text-xs font-bold rounded-lg transition cursor-pointer flex items-center gap-1.5 ${mainView === 'subscriptions' ? 'bg-card text-foreground shadow-xs font-black' : 'text-muted-foreground hover:text-foreground'
                }`}
            >
              <Repeat className="h-4 w-4 text-emerald-500" />
              <span>Product Subscribers Hub ({adminSubscriptions.length})</span>
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleReleaseAllCommissions}
            disabled={releasingAllComms}
            className="px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 rounded-xl text-xs font-black shadow-md flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
            title="Release and distribute all eligible platform commissions, vendor earnings, and partner incentives"
          >
            <Coins className={`h-4 w-4 ${releasingAllComms ? 'animate-spin' : ''}`} />
            <span>{releasingAllComms ? 'Distributing Commissions...' : '⚡ Distribute All Commissions'}</span>
          </button>
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

            {/* TAB BAR 2: ORDER TYPE CLASSIFICATION (NORMAL, SELF PICKUP, SUBSCRIBED) */}
            <div className="pt-2 border-t border-border/40">
              <div className="text-[10px] font-black text-muted-foreground uppercase tracking-wider mb-2">
                Order Type Classification
              </div>
              <div className="flex gap-2 flex-wrap">
                {[
                  { id: 'All', label: '🌐 All Types', count: orders.length },
                  { id: 'normal', label: '🚚 Normal Delivery', count: orders.filter((o: any) => !o.isScheduledSubscription && o.fulfillment?.type !== 'pickup' && o.deliveryType !== 'pickup').length },
                  { id: 'pickup', label: '🏪 In-Store Self Pickup', count: orders.filter((o: any) => o.fulfillment?.type === 'pickup' || o.deliveryType === 'pickup' || o.isSelfPickup).length },
                  { id: 'subscribed', label: '🔁 Subscribed Orders', count: orders.filter((o: any) => Boolean(o.isScheduledSubscription || o.isSubscription)).length },
                ].map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setOrderTypeFilter(t.id as any)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition cursor-pointer flex items-center gap-1.5 ${orderTypeFilter === t.id
                      ? 'bg-primary text-primary-foreground border-primary shadow-xs font-black'
                      : 'bg-card text-muted-foreground border-border hover:bg-secondary/40'
                      }`}
                  >
                    <span>{t.label}</span>
                    <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${orderTypeFilter === t.id ? 'bg-white/20 text-white' : 'bg-secondary text-muted-foreground'}`}>
                      {t.count}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* TAB BAR 3: FULFILLMENT ORDER STATUS TABS */}
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
                  {paginatedOrders.map((order) => {
                    const calc = getOrderCalculations(order);
                    const delInfo = getDeliveryTypeInfo(order);
                    const isSelected = selectedOrder?.id === order.id;
                    const speedMode = (order as any).deliverySpeed || (order as any).deliveryMode === 'express' || (order as any).fulfillment?.deliveryMode === 'express'
                      ? 'Express 15-30m'
                      : (order as any).deliveryMode === 'same_day' || (order as any).fulfillment?.deliveryMode === 'same_day'
                        ? 'Same Day'
                        : 'Standard';

                    return (
                      <div
                        key={order.id}
                        onClick={() => setSelectedOrder(order)}
                        className={`p-4 flex flex-col gap-2.5 cursor-pointer hover:bg-secondary/20 transition-all ${isSelected ? 'bg-secondary/40 border-l-4 border-primary' : ''
                          }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <span className="font-bold text-xs text-foreground block truncate">{order.customerName}</span>
                            <span className="text-[10px] text-muted-foreground block mt-0.5 font-mono">
                              ID: {order.id} • {order.items.length} item{order.items.length === 1 ? '' : 's'}
                            </span>
                            <span className="text-[9px] text-muted-foreground mt-0.5 block font-mono">{order.date}</span>
                          </div>
                          <div className="shrink-0 flex flex-col items-end gap-1">
                            <span className="font-mono text-xs font-black text-foreground">
                              ₹{calc.grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
                            </span>
                            {getOrderStatusBadge(order.orderStatus)}
                          </div>
                        </div>

                        {/* Badges: Delivery Type, Delivery Speed, Delivery Fee, Payment Mode */}
                        <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-border/40 text-[10px]">
                          <span className={`px-2 py-0.5 rounded-md font-black border text-[9px] ${delInfo.color}`}>
                            {delInfo.badge}
                          </span>
                          <span className="px-1.5 py-0.5 rounded-md font-bold bg-secondary/60 text-foreground border border-border/60 text-[9px]">
                            ⚡ {speedMode}
                          </span>
                          <span className={`px-1.5 py-0.5 rounded-md font-bold text-[9px] ${calc.shipping === 0 ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20' : 'bg-secondary/40 text-muted-foreground border border-border/50'}`}>
                            {calc.shipping === 0 ? 'Free Del' : `+₹${calc.shipping}`}
                          </span>
                          <span className="px-1.5 py-0.5 rounded-md font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 ml-auto text-[9px]">
                            {order.paymentMethod || 'UPI'}
                          </span>
                        </div>
                      </div>
                    );
                  })}

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
                          const targetId = (selectedOrder as any)._id || selectedOrder.id;
                          setReleasingCommId(targetId);
                          try {
                            const success = await releaseCommissions(targetId);
                            if (success) {
                              setSelectedOrder((prev) => (prev ? ({ ...prev, commissionReleaseStatus: 'Released', isCommissionReleased: true } as any) : prev));
                              alert('Commissions successfully distributed to vendor, franchise, and referral wallets!');
                            }
                          } finally {
                            setReleasingCommId(null);
                          }
                        }}
                        disabled={releasingCommId === ((selectedOrder as any)._id || selectedOrder.id)}
                        className="px-3 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs font-black shadow-sm flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
                        title="Trigger ApexBee Commission Engine to distribute earnings to vendor & franchise wallets"
                      >
                        <span>{releasingCommId === ((selectedOrder as any)._id || selectedOrder.id) ? '⏳ Distributing...' : '💸 Distribute Commission'}</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* 🚚 Comprehensive Delivery Logistics & Fulfillment Overview Card */}
                {selectedDelInfo && selectedCalc && (
                  <div className="rounded-2xl border border-border/80 bg-secondary/10 overflow-hidden shadow-xs space-y-0">
                    <div className={`p-4 border-b border-border/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${selectedDelInfo.color}`}>
                      <div className="flex items-center gap-2.5">
                        <span className="text-2xl">{selectedDelInfo.icon}</span>
                        <div>
                          <div className="font-black text-xs uppercase tracking-wider flex items-center gap-2">
                            <span>{selectedDelInfo.label}</span>
                            <span className="px-2 py-0.5 rounded-full bg-foreground/10 text-foreground font-black text-[10px]">
                              {selectedDelInfo.badge}
                            </span>
                          </div>
                          <p className="text-[11px] opacity-85 mt-0.5 font-medium">{selectedDelInfo.description}</p>
                        </div>
                      </div>
                      <span className="px-3 py-1 rounded-full bg-foreground text-background font-black text-[10px] uppercase shrink-0">
                        ⚡ {(selectedOrder as any).deliverySpeed || (selectedOrder as any).deliveryMode === 'express' || (selectedOrder as any).fulfillment?.deliveryMode === 'express' ? 'Express 15-30m' : (selectedOrder as any).deliveryMode === 'same_day' || (selectedOrder as any).fulfillment?.deliveryMode === 'same_day' ? 'Same Day' : 'Standard'}
                      </span>
                    </div>

                    <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                      {/* Delivery Mode & Speed */}
                      <div className="p-3 bg-card rounded-xl border border-border/60">
                        <span className="font-bold text-muted-foreground block text-[10px] uppercase tracking-wider mb-1">
                          🚀 Delivery Speed &amp; Mode
                        </span>
                        <span className="font-extrabold text-foreground block">
                          {(selectedOrder as any).deliverySpeed || (selectedOrder as any).deliveryMode === 'express' || (selectedOrder as any).fulfillment?.deliveryMode === 'express'
                            ? '🚀 Express (15-30m)'
                            : (selectedOrder as any).deliveryMode === 'same_day' || (selectedOrder as any).fulfillment?.deliveryMode === 'same_day'
                              ? '🌆 Same Day Slot'
                              : '📦 Standard Delivery'}
                        </span>
                        <span className="text-[10px] text-muted-foreground mt-0.5 block">
                          Cost: {selectedCalc.shipping === 0 ? 'Free Delivery' : `+₹${selectedCalc.shipping}`}
                        </span>
                      </div>

                      {/* Scheduled Slot & Extension */}
                      <div className="p-3 bg-card rounded-xl border border-border/60">
                        <span className="font-bold text-muted-foreground block text-[10px] uppercase tracking-wider mb-1">
                          🗓️ Scheduled Time Slot
                        </span>
                        <span className="font-extrabold text-foreground block truncate">
                          {(selectedOrder as any).deliverySlot || (selectedOrder as any).fulfillment?.pickupSlot?.time || (selectedOrder as any).scheduleDetails?.deliverySlot || 'Immediate Dispatch'}
                        </span>
                        <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold mt-0.5 block">
                          {(selectedOrder as any).slotExtension ? 'Extension Provided' : 'Standard Scheduled Slot'}
                        </span>
                      </div>

                      {/* Assigned Rider / Handler */}
                      <div className="p-3 bg-card rounded-xl border border-border/60">
                        <span className="font-bold text-muted-foreground block text-[10px] uppercase tracking-wider mb-1">
                          🛵 Assigned Driver / Courier
                        </span>
                        <span className="font-extrabold text-foreground block truncate">
                          {(selectedOrder as any).assignedDeliveryAgent || (selectedOrder as any).courierPartner || (selectedCalc.isStoreSelfDelivery ? 'Store Delivery Fleet' : 'Broadcast Rider Pool')}
                        </span>
                        <span className="text-[10px] text-muted-foreground mt-0.5 block font-mono">
                          {(selectedOrder as any).assignedDeliveryAgentPhone ? `📞 ${(selectedOrder as any).assignedDeliveryAgentPhone}` : (selectedOrder as any).trackingId ? `Track: ${(selectedOrder as any).trackingId}` : 'Dispatch Queue'}
                        </span>
                      </div>

                      {/* Delivery Handshake OTP */}
                      <div className="p-3 bg-card rounded-xl border border-border/60">
                        <span className="font-bold text-muted-foreground block text-[10px] uppercase tracking-wider mb-1">
                          🔐 Handshake OTP
                        </span>
                        <span className="font-mono font-black text-sm tracking-widest text-primary block">
                          {(selectedOrder as any).deliveryVerificationOtp || (selectedOrder as any).handshakeOtp || (selectedOrder as any).pickupVerification?.otp || '••••'}
                        </span>
                        <span className="text-[10px] text-muted-foreground mt-0.5 block">
                          Verified at Doorstep
                        </span>
                      </div>
                    </div>

                    {/* Drop-off Instruction & Driver Note */}
                    <div className="px-4 pb-4 pt-1 flex flex-col sm:flex-row gap-2.5 text-xs">
                      <div className="p-2.5 bg-card/60 rounded-xl border border-border/60 flex-1 flex items-center gap-2">
                        <span className="text-sm">🔔</span>
                        <div>
                          <span className="font-bold text-muted-foreground text-[10px] uppercase block">Drop-off Preference:</span>
                          <span className="font-extrabold text-foreground text-[11px]">
                            {(selectedOrder as any).fulfillment?.deliveryInstruction === 'ring_bell'
                              ? '🔔 Ring doorbell'
                              : (selectedOrder as any).fulfillment?.deliveryInstruction === 'leave_gate'
                                ? '🚪 Leave at gate / door'
                                : (selectedOrder as any).fulfillment?.deliveryInstruction === 'contactless'
                                  ? '🛡️ Contactless drop-off'
                                  : '📞 Call customer before arrival'}
                          </span>
                        </div>
                      </div>

                      {((selectedOrder as any).fulfillment?.customInstruction || (selectedOrder as any).customInstruction || (selectedOrder as any).deliveryInstructions) && (
                        <div className="p-2.5 bg-amber-500/10 rounded-xl border border-amber-500/30 flex-1 flex items-center gap-2 text-amber-900 dark:text-amber-300">
                          <span className="text-sm">💬</span>
                          <div className="min-w-0">
                            <span className="font-bold text-amber-800 dark:text-amber-400 text-[10px] uppercase block">Special Note:</span>
                            <span className="font-semibold italic text-[11px] truncate block">
                              "{(selectedOrder as any).fulfillment?.customInstruction || (selectedOrder as any).customInstruction || (selectedOrder as any).deliveryInstructions}"
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Specs Grid: Buyer Registry & Financial Summary */}
                {selectedCalc && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                    {/* Buyer Box */}
                    <div className="space-y-3 bg-secondary/15 p-4 rounded-2xl border border-border/40 flex flex-col justify-between">
                      <div>
                        <span className="text-[10px] font-black text-muted-foreground uppercase tracking-wider block mb-2">Buyer Registry &amp; Address</span>
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

                      <div className="pt-3 border-t border-border/50 text-[11px] space-y-1">
                        <div className="flex justify-between text-muted-foreground">
                          <span>Payment Method:</span>
                          <span className="font-bold text-foreground">{selectedOrder.paymentMethod || 'UPI'}</span>
                        </div>
                        <div className="flex justify-between text-muted-foreground">
                          <span>Payment Status:</span>
                          <span className={`font-bold ${selectedOrder.paymentStatus === 'Approved' ? 'text-emerald-500' : 'text-amber-500'}`}>{selectedOrder.paymentStatus}</span>
                        </div>
                        {selectedOrder.upiRefNo && (
                          <div className="flex justify-between text-muted-foreground font-mono">
                            <span>Ref ID:</span>
                            <span className="text-foreground truncate max-w-[150px]">{selectedOrder.upiRefNo}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Financial Summary Box with Exact Complete Calculations */}
                    <div className="space-y-3 bg-secondary/15 p-4 rounded-2xl border border-border/40">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black text-muted-foreground uppercase tracking-wider">All Calculations &amp; Bill Breakdown</span>
                        <span className="text-[9px] font-black text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                          VERIFIED AUDIT
                        </span>
                      </div>

                      <div className="space-y-1.5 text-xs font-mono">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground font-sans">Total MRP (Retail Value):</span>
                          <span className="text-foreground font-bold">
                            ₹{selectedCalc.totalMrp.toFixed(2)}
                          </span>
                        </div>

                        {selectedCalc.discount > 0 && (
                          <div className="flex justify-between text-emerald-600 dark:text-emerald-400">
                            <span className="font-sans">Discount on MRP:</span>
                            <span className="font-bold">-₹{selectedCalc.discount.toFixed(2)}</span>
                          </div>
                        )}

                        <div className="flex justify-between border-t border-border/40 pt-1">
                          <span className="text-muted-foreground font-sans font-bold">Items Subtotal (Price After Discount):</span>
                          <span className="text-foreground font-black">
                            ₹{selectedCalc.subtotal.toFixed(2)}
                          </span>
                        </div>

                        {/* CGST & SGST Taxes */}
                        <div className="flex justify-between text-[11px]">
                          <span className="text-muted-foreground font-sans">
                            Central GST (CGST {selectedCalc.halfGstRate > 0 ? `${selectedCalc.halfGstRate}%` : ''}):
                          </span>
                          <span className="text-amber-500 font-bold">+₹{selectedCalc.cgst.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-[11px]">
                          <span className="text-muted-foreground font-sans">
                            State GST (SGST {selectedCalc.halfGstRate > 0 ? `${selectedCalc.halfGstRate}%` : ''}):
                          </span>
                          <span className="text-amber-500 font-bold">+₹{selectedCalc.sgst.toFixed(2)}</span>
                        </div>

                        {/* Total GST Summary */}
                        <div className="flex justify-between text-[11px] bg-secondary/30 px-2 py-0.5 rounded">
                          <span className="text-muted-foreground font-sans font-semibold">Total GST Tax ({selectedCalc.gstRate}% Included):</span>
                          <span className="text-amber-600 dark:text-amber-400 font-bold">₹{selectedCalc.totalTax.toFixed(2)}</span>
                        </div>

                        {/* Delivery Charges */}
                        <div className="flex justify-between">
                          <span className="text-muted-foreground font-sans">
                            Delivery Charges ({selectedCalc.isStoreSelfDelivery ? 'Store Fleet' : 'Platform'}):
                          </span>
                          <span className={selectedCalc.shipping === 0 ? 'text-emerald-600 dark:text-emerald-400 font-bold' : 'text-foreground font-bold'}>
                            {selectedCalc.shipping === 0 ? 'FREE' : `+₹${selectedCalc.shipping.toFixed(2)}`}
                          </span>
                        </div>

                        {/* Packing Charges */}
                        <div className="flex justify-between">
                          <span className="text-muted-foreground font-sans">Packing Charges:</span>
                          <span className="text-foreground font-bold">
                            {selectedCalc.packing === 0 ? '₹0.00' : `+₹${selectedCalc.packing.toFixed(2)}`}
                          </span>
                        </div>

                        {/* Platform Fee */}
                        {selectedCalc.platformFee > 0 && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground font-sans">Platform Fee:</span>
                            <span className="text-foreground font-bold">+₹{selectedCalc.platformFee.toFixed(2)}</span>
                          </div>
                        )}

                        {/* Coupon Discount */}
                        {selectedCalc.couponDiscount > 0 && (
                          <div className="flex justify-between text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-500/10 p-1 rounded border border-emerald-500/20">
                            <span className="font-sans">🎟️ Coupon ({selectedCalc.couponCode || 'PROMO'}):</span>
                            <span>-₹{selectedCalc.couponDiscount.toFixed(2)}</span>
                          </div>
                        )}

                        {/* Wallet Deduction */}
                        {selectedCalc.walletDeduction > 0 && (
                          <div className="flex justify-between text-blue-600 dark:text-blue-400 font-bold">
                            <span className="font-sans">👛 Wallet Points Deducted:</span>
                            <span>-₹{selectedCalc.walletDeduction.toFixed(2)}</span>
                          </div>
                        )}

                        <div className="flex justify-between border-t border-dashed border-border pt-1.5 font-black text-sm">
                          <span className="text-foreground font-sans">Grand Total (Customer Paid):</span>
                          <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                            ₹{selectedCalc.grandTotal.toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* 💼 Platform Settlement & Merchant Payout Ledger Card */}
                {selectedCalc && (
                  <div className="p-4 rounded-2xl border border-indigo-500/20 bg-indigo-500/5 space-y-3 text-xs">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-black text-indigo-700 dark:text-indigo-400 uppercase tracking-wider flex items-center gap-1.5 font-heading">
                        <span>💼</span> Merchant Payout &amp; Platform Settlement Ledger
                      </span>
                      <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 font-black text-[10px] uppercase">
                        Wallet Settlement
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5 text-mono text-center">
                      <div className="p-2.5 bg-card rounded-xl border border-border/60">
                        <span className="font-bold text-muted-foreground block text-[10px] uppercase tracking-wider mb-0.5 font-sans">Items GMV</span>
                        <span className="font-black text-foreground text-xs">₹{selectedCalc.subtotal.toFixed(2)}</span>
                      </div>

                      <div className="p-2.5 bg-card rounded-xl border border-border/60">
                        <span className="font-bold text-muted-foreground block text-[10px] uppercase tracking-wider mb-0.5 font-sans">Platform Comm.</span>
                        <span className="font-black text-rose-500 text-xs">-₹{selectedCalc.commission.toFixed(2)}</span>
                      </div>

                      <div className="p-2.5 bg-card rounded-xl border border-border/60">
                        <span className="font-bold text-muted-foreground block text-[10px] uppercase tracking-wider mb-0.5 font-sans">Store Delivery Share</span>
                        <span className="font-black text-emerald-600 dark:text-emerald-400 text-xs">
                          {selectedCalc.isStoreSelfDelivery ? `+₹${selectedCalc.vendorDeliveryFee.toFixed(2)}` : '₹0.00 (Platform)'}
                        </span>
                      </div>

                      <div className="p-2.5 bg-emerald-500/10 rounded-xl border border-emerald-500/30">
                        <span className="font-bold text-emerald-800 dark:text-emerald-400 block text-[10px] uppercase tracking-wider mb-0.5 font-sans">Net Merchant Payout</span>
                        <span className="font-black text-emerald-600 dark:text-emerald-400 text-sm">₹{selectedCalc.netVendorPayout.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                )}

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
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black text-muted-foreground uppercase tracking-wider block">
                      Ordered Products &amp; Item Variants ({selectedOrder.items.length})
                    </span>
                    <span className="text-[10px] font-extrabold text-primary lowercase">
                      complete SKU &amp; variant audit
                    </span>
                  </div>

                  <div className="divide-y divide-border/60 border border-border/80 rounded-2xl overflow-hidden shadow-2xs">
                    {selectedOrder.items.map((item: any, idx: number) => {
                      // Extract variant attributes
                      const attrObj = item.variantAttributes || item.selectedAttributes || item.attributes;
                      const attrsList: string[] = [];
                      if (attrObj && typeof attrObj === 'object') {
                        Object.entries(attrObj).forEach(([k, v]) => {
                          if (v && v !== 'default' && k !== 'default') {
                            attrsList.push(`${k}: ${v}`);
                          }
                        });
                      }
                      if (attrsList.length === 0) {
                        if (item.color && item.color !== 'default') attrsList.push(`Color: ${item.color}`);
                        if (item.size && item.size !== 'default') attrsList.push(`Size: ${item.size}`);
                        if (item.selectedColor && item.selectedColor !== 'default') attrsList.push(`Color: ${item.selectedColor}`);
                        if (item.selectedSize && item.selectedSize !== 'default') attrsList.push(`Size: ${item.selectedSize}`);
                      }
                      if (attrsList.length === 0 && item.variantName) {
                        attrsList.push(`Variant: ${item.variantName}`);
                      }
                      // Fallback: Parse SKU hyphenated variant e.g. PHO-IDOL-06384-2CM -> 2CM
                      if (attrsList.length === 0 && item.sku && typeof item.sku === 'string') {
                        const parts = item.sku.split('-');
                        if (parts.length > 1) {
                          const lastPart = parts[parts.length - 1].trim();
                          if (/^(\d+cm|\d+g|\d+kg|xl|l|m|s|2cm|3cm|4cm|5cm)$/i.test(lastPart) || lastPart.length <= 5) {
                            attrsList.push(`Variant / Size: ${lastPart.toUpperCase()}`);
                          }
                        }
                      }
                      // Fallback: Parse Title bracket e.g. "Idol (2cm)"
                      if (attrsList.length === 0 && (item.productName || item.itemName)) {
                        const titleText = item.productName || item.itemName;
                        const match = titleText.match(/\(([^)]+)\)/);
                        if (match && match[1]) {
                          attrsList.push(`Variant: ${match[1]}`);
                        }
                      }

                      const hasSub = item.isSubscription || item.subscriptionFrequency || (selectedOrder as any).isScheduledSubscription;
                      const subFreq = item.subscriptionFrequency || (selectedOrder as any).scheduleDetails?.frequency || 'Daily';
                      const subSlot = item.deliverySlot || (selectedOrder as any).scheduleDetails?.deliverySlot || '6:00 AM - 8:00 AM';

                      return (
                        <div key={idx} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-card hover:bg-secondary/20 transition">
                          <div className="flex items-start gap-3 min-w-0 flex-1">
                            <img
                              src={item.image || (item as any).images?.[0] || "/placeholder.svg"}
                              alt={item.productName || item.itemName}
                              className="h-12 w-12 rounded-xl object-cover border border-border/80 flex-shrink-0 shadow-xs bg-secondary/30"
                            />
                            <div className="flex flex-col gap-1 min-w-0 flex-1">
                              <span className="font-extrabold text-foreground text-xs leading-snug">
                                {item.productName || item.itemName}
                              </span>

                              <div className="flex flex-wrap items-center gap-2 text-[10px]">
                                <span className="text-muted-foreground font-mono bg-secondary/40 px-2 py-0.5 rounded border border-border/60">
                                  SKU: {item.sku || 'N/A'}
                                </span>
                                {(item.vendorId || item.sellerId) && (
                                  <span className="text-blue-600 dark:text-blue-400 font-bold bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20">
                                    Seller: {typeof item.vendorId === 'string' ? item.vendorId : item.vendorId?.name || 'ApexBee Merchant'}
                                  </span>
                                )}
                              </div>

                              {/* Selected Variant Badges */}
                              {attrsList.length > 0 && (
                                <div className="flex flex-wrap gap-1.5 mt-1">
                                  <span className="text-[10px] font-black text-primary uppercase tracking-wider">Selected Variant:</span>
                                  {attrsList.map((attr, aIdx) => (
                                    <span key={aIdx} className="text-[10px] font-black text-primary bg-primary/10 border border-primary/20 px-2 py-0.5 rounded-md">
                                      {attr}
                                    </span>
                                  ))}
                                </div>
                              )}

                              {/* Subscription Info */}
                              {hasSub && (
                                <div className="mt-1 flex items-center gap-1.5 bg-purple-500/10 border border-purple-500/30 rounded-lg p-1.5 text-[10px]">
                                  <span className="text-purple-600 dark:text-purple-400 font-bold">🔄 Recurring Subscription:</span>
                                  <span className="font-black uppercase text-foreground">{subFreq}</span>
                                  <span className="text-muted-foreground">({subSlot})</span>
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="text-right flex sm:flex-col items-end justify-between sm:justify-center gap-1 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-border/40">
                            <span className="font-mono font-black text-foreground text-sm">
                              ₹{(item.price * item.quantity).toLocaleString('en-IN')}
                            </span>
                            <span className="text-muted-foreground text-[10px]">
                              ₹{item.price} × {item.quantity} unit{item.quantity === 1 ? '' : 's'}
                            </span>
                            {item.mrp && item.mrp > item.price && (
                              <span className="text-[10px] text-muted-foreground line-through">
                                MRP ₹{(item.mrp * item.quantity).toLocaleString('en-IN')}
                              </span>
                            )}
                            {item.gstRate && item.gstRate > 0 && (
                              <span className="text-[9px] text-amber-600 dark:text-amber-400 font-bold">
                                GST {item.gstRate}% Included
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
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
        /* VIEW MODE 2: PRODUCT SUBSCRIBERS HUB */
        <div className="space-y-6">
          {/* Subscriptions Overview Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
            <div className="bg-card border border-border/80 p-4 rounded-2xl shadow-xs text-left">
              <span className="text-[10px] font-black uppercase text-muted-foreground block tracking-wider">Total Subscriptions</span>
              <span className="text-2xl font-black text-foreground mt-1 block">{subStats.totalCount}</span>
              <span className="text-[10px] text-muted-foreground font-medium">All recurring routines</span>
            </div>

            <div className="bg-card border border-border/80 p-4 rounded-2xl shadow-xs text-left">
              <span className="text-[10px] font-black uppercase text-muted-foreground block tracking-wider">Active Deliveries</span>
              <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1 block">{subStats.activeCount}</span>
              <span className="text-[10px] text-emerald-700 dark:text-emerald-300 font-semibold">Live recurring cycles</span>
            </div>

            <div className="bg-card border border-border/80 p-4 rounded-2xl shadow-xs text-left">
              <span className="text-[10px] font-black uppercase text-muted-foreground block tracking-wider">Milk &amp; Dairy Routines</span>
              <span className="text-2xl font-black text-blue-600 dark:text-blue-400 mt-1 block">{subStats.dairyCount}</span>
              <span className="text-[10px] text-blue-700 dark:text-blue-300 font-medium">Daily doorstep bottles/packs</span>
            </div>

            <div className="bg-card border border-border/80 p-4 rounded-2xl shadow-xs text-left">
              <span className="text-[10px] font-black uppercase text-muted-foreground block tracking-wider">Water Can Routes</span>
              <span className="text-2xl font-black text-cyan-600 dark:text-cyan-400 mt-1 block">{subStats.waterCount}</span>
              <span className="text-[10px] text-cyan-700 dark:text-cyan-300 font-medium">20L daily &amp; weekly cans</span>
            </div>

            <div className="bg-card border border-border/80 p-4 rounded-2xl shadow-xs text-left">
              <span className="text-[10px] font-black uppercase text-muted-foreground block tracking-wider">Monthly Recurring Value</span>
              <span className="text-2xl font-black text-amber-500 mt-1 block">₹{subStats.totalMRV.toLocaleString('en-IN')}</span>
              <span className="text-[10px] text-muted-foreground font-medium">Gross customer cycle value</span>
            </div>
          </div>

          {/* Subscription Filter & Search Bar */}
          <div className="bg-card border border-border/80 p-4 rounded-2xl shadow-xs space-y-4">
            <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
              <div className="relative w-full md:w-96">
                <Search className="absolute left-3.5 top-3 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search by Subscriber, Mobile, Address, Product, Store..."
                  value={subSearch}
                  onChange={(e) => { setSubSearch(e.target.value); setSubsPage(1); }}
                  className="w-full bg-secondary/20 border border-border/80 rounded-xl pl-10 pr-4 py-2 text-xs text-foreground placeholder-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
                <select
                  value={subStatusFilter}
                  onChange={(e) => { setSubStatusFilter(e.target.value); setSubsPage(1); }}
                  className="bg-card border border-border/80 rounded-xl px-3 py-2 text-xs font-bold text-foreground focus:outline-none"
                >
                  <option value="All">Status: All Statuses</option>
                  <option value="active">🟢 Active</option>
                  <option value="paused">⏸️ Paused</option>
                  <option value="cancelled">❌ Cancelled / Expired</option>
                </select>

                <select
                  value={subFrequencyFilter}
                  onChange={(e) => { setSubFrequencyFilter(e.target.value); setSubsPage(1); }}
                  className="bg-card border border-border/80 rounded-xl px-3 py-2 text-xs font-bold text-foreground focus:outline-none"
                >
                  <option value="All">Frequency: All Frequencies</option>
                  <option value="daily">☀️ Daily</option>
                  <option value="alternate">🔄 Alternate Days</option>
                  <option value="weekly">📅 Weekly</option>
                  <option value="monthly">🗓️ Monthly</option>
                </select>

                <select
                  value={subPortalFilter}
                  onChange={(e) => { setSubPortalFilter(e.target.value); setSubsPage(1); }}
                  className="bg-card border border-border/80 rounded-xl px-3 py-2 text-xs font-bold text-foreground focus:outline-none"
                >
                  <option value="All">Category: All Categories</option>
                  <option value="dairy">🥛 Milk &amp; Dairy Essentials</option>
                  <option value="water">💧 20L Water Cans</option>
                  <option value="general">📦 General Recurring Packs</option>
                </select>

                <select
                  value={subFulfillmentFilter}
                  onChange={(e) => { setSubFulfillmentFilter(e.target.value); setSubsPage(1); }}
                  className="bg-card border border-border/80 rounded-xl px-3 py-2 text-xs font-bold text-foreground focus:outline-none"
                >
                  <option value="All">Fulfillment: All Modes</option>
                  <option value="self_delivery">🛵 Store Partner Self-Delivery</option>
                  <option value="platform">🚚 Platform Logistics Courier</option>
                </select>
              </div>
            </div>
          </div>

          {/* Subscriptions Table */}
          <div className="bg-card border border-border/80 rounded-2xl shadow-xs overflow-hidden text-left">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs divide-y divide-border/60">
                <thead className="bg-secondary/20 text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                  <tr>
                    <th className="py-3.5 px-4">Subscription &amp; Schedule</th>
                    <th className="py-3.5 px-4">Subscriber Details</th>
                    <th className="py-3.5 px-4">Subscribed Product</th>
                    <th className="py-3.5 px-4">Fulfillment Mode &amp; Store</th>
                    <th className="py-3.5 px-4">Calculations (Subtotal / GST / Total)</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4">Commission</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-border/40 font-medium">
                  {loadingSubs ? (
                    <tr>
                      <td colSpan={8} className="text-center py-12 text-muted-foreground">
                        <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2 text-amber-500" />
                        Loading recurring product subscriptions...
                      </td>
                    </tr>
                  ) : paginatedSubs.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="text-center py-12 text-muted-foreground italic">
                        No product subscriptions found matching active filters.
                      </td>
                    </tr>
                  ) : (
                    paginatedSubs.map((sub: any) => {
                      const subId = sub.subscriptionId || sub._id;
                      const isReleased = sub.commissionStatus === 'Released' || sub.isCommissionReleased;

                      return (
                        <tr key={subId} className="hover:bg-secondary/20 transition-colors">
                          {/* Subscription & Schedule */}
                          <td className="py-3.5 px-4">
                            <span className="font-mono font-black text-foreground text-xs block">
                              {sub.displayId}
                            </span>
                            <span className="text-[10px] text-muted-foreground block mt-0.5">
                              Started: {sub.startDate}
                            </span>
                            <div className="mt-1 flex items-center gap-1.5 flex-wrap">
                              <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/30">
                                {sub.frequency === 'daily' ? '☀️ Daily' : sub.frequency === 'alternate' ? '🔄 Alternate' : sub.frequency === 'weekly' ? '📅 Weekly' : '🗓️ Monthly'}
                              </span>
                              {sub.autoRenew && (
                                <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                                  Auto-Renew
                                </span>
                              )}
                            </div>
                            <span className="text-[9px] text-blue-600 dark:text-blue-400 font-mono block mt-1">
                              🕒 {sub.deliverySlot}
                            </span>
                          </td>

                          {/* Subscriber Details */}
                          <td className="py-3.5 px-4">
                            <span className="font-bold text-foreground block truncate max-w-[150px]">
                              {sub.customerName}
                            </span>
                            <span className="text-[10px] text-muted-foreground font-mono block flex items-center gap-1 mt-0.5">
                              <Phone className="h-3 w-3 text-muted-foreground shrink-0" /> {sub.customerMobile}
                            </span>
                            <span className="text-[10px] text-muted-foreground block truncate max-w-[160px] mt-0.5 flex items-start gap-1">
                              <MapPin className="h-3 w-3 text-muted-foreground shrink-0 mt-0.5" />
                              <span className="truncate">{sub.customerAddress}</span>
                            </span>
                          </td>

                          {/* Subscribed Product */}
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-2.5">
                              {sub.productImage ? (
                                <img
                                  src={sub.productImage}
                                  alt={sub.productName}
                                  className="w-10 h-10 rounded-xl object-cover border border-border/80 shrink-0 bg-secondary/30"
                                  onError={(e) => { (e.target as any).style.display = 'none'; }}
                                />
                              ) : (
                                <div className="w-10 h-10 rounded-xl bg-secondary/30 border border-border/80 flex items-center justify-center shrink-0 text-muted-foreground">
                                  <Package className="h-4 w-4" />
                                </div>
                              )}
                              <div className="min-w-0">
                                <span className="font-bold text-foreground block text-xs truncate max-w-[140px]">
                                  {sub.productName}
                                </span>
                                <span className="text-[10px] text-muted-foreground font-medium block">
                                  Qty: <strong className="text-foreground">{sub.quantity}</strong> · ₹{Number(sub.unitPrice).toFixed(2)}/unit
                                </span>
                              </div>
                            </div>
                          </td>

                          {/* Fulfillment Mode & Store */}
                          <td className="py-3.5 px-4">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase border inline-flex items-center gap-1 ${sub.fulfillmentMode?.includes('Self-Delivery') || sub.isStoreSelfDelivery
                                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                                : 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30'
                              }`}>
                              {sub.fulfillmentMode?.includes('Self-Delivery') || sub.isStoreSelfDelivery ? '🛵 Store Fleet' : '🚚 Platform Rider'}
                            </span>
                            <span className="font-bold text-foreground text-xs block truncate max-w-[140px] mt-1">
                              {sub.storeName}
                            </span>
                            {sub.storePhone && (
                              <span className="text-[10px] text-muted-foreground font-mono block">
                                📞 {sub.storePhone}
                              </span>
                            )}
                          </td>

                          {/* Calculations */}
                          <td className="py-3.5 px-4">
                            <div className="font-black text-sm text-foreground font-mono">
                              ₹{Number(sub.grandTotal).toFixed(2)}
                            </div>
                            <div className="text-[10px] text-muted-foreground space-y-0.5 mt-0.5">
                              <div>Items: ₹{Number(sub.subtotal).toFixed(2)}</div>
                              {Number(sub.tax) > 0 && <div className="text-amber-600 dark:text-amber-400 font-semibold">GST: ₹{Number(sub.tax).toFixed(2)}</div>}
                              <div className="text-emerald-600 dark:text-emerald-400 font-bold">
                                {Number(sub.shippingFee) === 0 ? 'Free Delivery' : `₹${Number(sub.shippingFee)} Del.`}
                              </div>
                            </div>
                          </td>

                          {/* Status */}
                          <td className="py-3.5 px-4">
                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase inline-block ${sub.status === 'active'
                                ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                                : sub.status === 'paused'
                                  ? 'bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30'
                                  : 'bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/30'
                              }`}>
                              {sub.status === 'active' ? '🟢 Active' : sub.status === 'paused' ? '⏸️ Paused' : '❌ Cancelled'}
                            </span>
                          </td>

                          {/* Commission Settlement */}
                          <td className="py-3.5 px-4">
                            <div className="flex flex-col gap-1 items-start">
                              {isReleased ? (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 inline-flex items-center gap-1">
                                  <CheckCircle2 className="h-3 w-3 text-emerald-600 dark:text-emerald-400" /> Released
                                </span>
                              ) : (
                                <>
                                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30 inline-flex items-center gap-1">
                                    <Clock className="h-3 w-3 text-amber-500" /> Pending
                                  </span>
                                  <button
                                    onClick={() => handleDistributeCommission(subId)}
                                    disabled={releasingCommId === subId}
                                    className="px-2 py-0.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-[10px] rounded-lg transition flex items-center gap-1 shadow-2xs cursor-pointer disabled:opacity-50"
                                    title="Release and distribute commission for this subscription"
                                  >
                                    <Coins className={`h-3 w-3 ${releasingCommId === subId ? 'animate-spin' : ''}`} />
                                    <span>{releasingCommId === subId ? 'Releasing...' : 'Distribute'}</span>
                                  </button>
                                </>
                              )}
                            </div>
                          </td>

                          {/* Actions */}
                          <td className="py-3.5 px-4 text-right">
                            <button
                              onClick={() => setSelectedSubModal(sub)}
                              className="px-3 py-1.5 bg-secondary hover:bg-secondary/80 text-foreground font-black text-xs rounded-xl border border-border transition cursor-pointer flex items-center gap-1.5 ml-auto shadow-xs"
                            >
                              <Eye className="h-3.5 w-3.5" />
                              <span>Audit &amp; History</span>
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Subscriptions Pagination */}
            <div className="p-4 border-t border-border/60 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted-foreground font-medium">
              <span>
                Showing {filteredSubs.length === 0 ? 0 : (subsPage - 1) * subsPerPage + 1} to{' '}
                {Math.min(subsPage * subsPerPage, filteredSubs.length)} of {filteredSubs.length} subscriptions
              </span>

              <div className="flex items-center gap-2">
                <button
                  disabled={subsPage <= 1}
                  onClick={() => setSubsPage((p) => Math.max(p - 1, 1))}
                  className="px-3 py-1.5 rounded-lg border border-border/80 bg-card text-foreground font-bold text-[11px] disabled:opacity-40 cursor-pointer flex items-center gap-1"
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                  <span>Prev</span>
                </button>
                <span className="text-[10px] font-bold text-foreground">
                  Page {subsPage} of {totalSubsPages}
                </span>
                <button
                  disabled={subsPage >= totalSubsPages}
                  onClick={() => setSubsPage((p) => Math.min(p + 1, totalSubsPages))}
                  className="px-3 py-1.5 rounded-lg border border-border/80 bg-card text-foreground font-bold text-[11px] disabled:opacity-40 cursor-pointer flex items-center gap-1"
                >
                  <span>Next</span>
                  <ChevronRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: SUBSCRIPTION AUDIT & DELIVERY HISTORY */}
      {selectedSubModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-card border border-border rounded-3xl max-w-3xl w-full p-6 sm:p-7 space-y-5 shadow-2xl animate-in fade-in zoom-in-95 my-8 text-left max-h-[92vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-border/60 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center font-bold">
                  <Repeat className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-black text-foreground text-base sm:text-lg">
                    Subscription Audit #{selectedSubModal.displayId}
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Active since {selectedSubModal.startDate} · {String(selectedSubModal.frequency).toUpperCase()} Routine
                  </p>
                </div>
              </div>

              <button
                onClick={() => setSelectedSubModal(null)}
                className="p-2 text-muted-foreground hover:text-foreground rounded-xl hover:bg-secondary transition cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Logistics & Route Card */}
            <div className="bg-gradient-to-br from-slate-900 to-[#0A1128] text-white p-5 rounded-2xl space-y-3.5 shadow-md">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-700/60 pb-3">
                <div className="flex items-center gap-2.5">
                  <span className="text-2xl">
                    {selectedSubModal.portalType === 'water' ? '💧' : selectedSubModal.portalType === 'dairy' ? '🥛' : '🔁'}
                  </span>
                  <div>
                    <span className="text-[10px] font-black uppercase text-amber-400 tracking-wider block">
                      Recurring Fulfillment Channel
                    </span>
                    <h4 className="font-extrabold text-sm text-white">
                      {selectedSubModal.fulfillmentMode}
                    </h4>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-white/10 text-white border border-white/20">
                    {selectedSubModal.frequency}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-400/40">
                    {selectedSubModal.status}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700/60">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block mb-0.5">
                    🕒 Scheduled Window
                  </span>
                  <span className="font-bold text-amber-300 block">
                    {selectedSubModal.deliverySlot}
                  </span>
                  <span className="text-[10px] text-slate-400">
                    {selectedSubModal.autoRenew ? '✓ Auto-Renew Enabled' : 'Manual Renew'}
                  </span>
                </div>

                <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700/60">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block mb-0.5">
                    🏪 Store Partner
                  </span>
                  <span className="font-extrabold text-white block truncate">
                    {selectedSubModal.storeName}
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {selectedSubModal.storePhone || 'Verified Partner'}
                  </span>
                </div>

                <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700/60">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block mb-0.5">
                    🛵 Assigned Driver / Fleet
                  </span>
                  <span className="font-extrabold text-white block truncate">
                    {selectedSubModal.deliveryAgentName || (selectedSubModal.isStoreSelfDelivery ? 'Store Dedicated Fleet' : 'Platform Rider Pool')}
                  </span>
                  <span className="text-[10px] text-emerald-400">
                    Doorstep Delivery Route
                  </span>
                </div>
              </div>
            </div>

            {/* Customer & Merchant Information Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="bg-secondary/10 p-4 rounded-2xl border border-border/80 space-y-1.5 text-left">
                <span className="text-[10px] font-black uppercase text-muted-foreground block tracking-wider">Subscriber Customer Details</span>
                <div className="font-extrabold text-foreground text-sm">
                  {selectedSubModal.customerName}
                </div>
                <div className="text-muted-foreground font-mono">
                  📞 {selectedSubModal.customerMobile}
                </div>
                <div className="text-foreground leading-relaxed text-xs">
                  📍 {selectedSubModal.customerAddress}
                </div>
              </div>

              <div className="bg-secondary/10 p-4 rounded-2xl border border-border/80 space-y-1.5 text-left">
                <span className="text-[10px] font-black uppercase text-muted-foreground block tracking-wider">Subscribed Product Details</span>
                <div className="flex items-center gap-3 pt-1">
                  {selectedSubModal.productImage ? (
                    <img
                      src={selectedSubModal.productImage}
                      alt={selectedSubModal.productName}
                      className="w-12 h-12 rounded-xl object-cover border border-border shrink-0 bg-secondary/30"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center shrink-0">
                      <Package className="h-5 w-5 text-muted-foreground" />
                    </div>
                  )}
                  <div>
                    <div className="font-extrabold text-foreground text-sm">
                      {selectedSubModal.productName}
                    </div>
                    <div className="text-muted-foreground text-xs">
                      Quantity: <strong className="text-foreground">{selectedSubModal.quantity}</strong> pack(s)
                    </div>
                    <div className="text-amber-600 dark:text-amber-400 font-bold font-mono text-xs">
                      ₹{Number(selectedSubModal.unitPrice).toFixed(2)} per unit
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Financial Calculation & Commission Allocation */}
            <div className="bg-secondary/10 border border-border/80 rounded-2xl p-5 space-y-3 text-xs">
              <div className="flex items-center justify-between border-b border-border/60 pb-2.5">
                <h4 className="font-black text-foreground text-xs uppercase tracking-wider flex items-center gap-1.5">
                  <span>🧾</span> Bill Breakdown &amp; Commission Allocation
                </h4>
                <span className="font-extrabold text-[11px] text-muted-foreground">
                  Recurring Cycle Value
                </span>
              </div>

              <div className="space-y-1.5 text-muted-foreground">
                <div className="flex justify-between font-bold text-foreground">
                  <span>Items Subtotal</span>
                  <span className="font-mono">₹{Number(selectedSubModal.subtotal).toFixed(2)}</span>
                </div>

                {Number(selectedSubModal.tax) > 0 && (
                  <div className="flex justify-between text-amber-600 dark:text-amber-400 font-semibold">
                    <span>GST Tax (5%)</span>
                    <span className="font-mono">₹{Number(selectedSubModal.tax).toFixed(2)}</span>
                  </div>
                )}

                <div className="flex justify-between text-emerald-600 dark:text-emerald-400 font-bold">
                  <span>Doorstep Delivery Fee</span>
                  <span className="font-mono">{Number(selectedSubModal.shippingFee) === 0 ? 'FREE' : `₹${Number(selectedSubModal.shippingFee).toFixed(2)}`}</span>
                </div>

                <div className="flex justify-between font-black text-base border-t border-border/80 pt-2 text-foreground">
                  <span>Total Customer Paid (Cycle Amount)</span>
                  <span className="font-mono text-primary">₹{Number(selectedSubModal.grandTotal).toFixed(2)}</span>
                </div>
              </div>

              <div className="mt-3 bg-card border border-border/80 rounded-xl p-3.5 space-y-2 text-[11px] text-muted-foreground">
                <div className="flex items-center justify-between">
                  <span className="font-black text-foreground text-xs uppercase tracking-wider">
                    💰 Commission Settlement Status
                  </span>
                  {selectedSubModal.commissionStatus === 'Released' || selectedSubModal.isCommissionReleased ? (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3 text-emerald-600 dark:text-emerald-400" /> Released to Wallets
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30 flex items-center gap-1">
                      <Clock className="h-3 w-3 text-amber-500" /> Pending Release
                    </span>
                  )}
                </div>

                {!(selectedSubModal.commissionStatus === 'Released' || selectedSubModal.isCommissionReleased) && (
                  <div className="pt-2 border-t border-border/40 flex justify-end">
                    <button
                      onClick={() => handleDistributeCommission(selectedSubModal.subscriptionId || selectedSubModal._id)}
                      disabled={releasingCommId === (selectedSubModal.subscriptionId || selectedSubModal._id)}
                      className="px-3 py-1.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-black text-xs rounded-xl shadow-xs flex items-center gap-1.5 transition cursor-pointer disabled:opacity-50"
                    >
                      <Coins className={`h-3.5 w-3.5 ${releasingCommId === (selectedSubModal.subscriptionId || selectedSubModal._id) ? 'animate-spin' : ''}`} />
                      <span>{releasingCommId === (selectedSubModal.subscriptionId || selectedSubModal._id) ? 'Distributing...' : '💸 Distribute Commission Now'}</span>
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Delivery History Log */}
            <div className="space-y-2">
              <h4 className="text-xs font-black uppercase tracking-wider text-muted-foreground">
                Recurring Delivery History &amp; Dispatch Proofs ({selectedSubModal.deliveryHistory?.length || 0} runs)
              </h4>
              <div className="border border-border/80 rounded-2xl overflow-hidden max-h-48 overflow-y-auto">
                {selectedSubModal.deliveryHistory && selectedSubModal.deliveryHistory.length > 0 ? (
                  <table className="w-full text-left text-xs divide-y divide-border/60">
                    <thead className="bg-secondary/30 text-[10px] uppercase font-bold text-muted-foreground sticky top-0">
                      <tr>
                        <th className="py-2.5 px-3">Date</th>
                        <th className="py-2.5 px-3">Status</th>
                        <th className="py-2.5 px-3">Notes / Proof</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/40 font-medium">
                      {selectedSubModal.deliveryHistory.map((h: any, idx: number) => (
                        <tr key={idx} className="hover:bg-secondary/20">
                          <td className="py-2.5 px-3 font-mono text-foreground">{h.date}</td>
                          <td className="py-2.5 px-3">
                            <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${h.status === 'delivered' ? 'bg-emerald-500/20 text-emerald-400' : h.status === 'skipped' ? 'bg-amber-500/20 text-amber-400' : 'bg-rose-500/20 text-rose-400'
                              }`}>
                              {h.status}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-muted-foreground">{h.notes || 'Routine doorstep dropoff'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div className="p-4 text-center text-xs text-muted-foreground">
                    No delivery runs logged yet. Delivery cycles begin from {selectedSubModal.startDate}.
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end pt-3 border-t border-border/60">
              <button
                onClick={() => setSelectedSubModal(null)}
                className="px-5 py-2 bg-secondary hover:bg-secondary/80 text-foreground rounded-xl text-xs font-bold transition cursor-pointer"
              >
                Close Audit View
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
