import React, { createContext, useContext, useState, ReactNode } from 'react';
import {
  Seller,
  Category,
  Product,
  Order,
  FranchiseNode,
  ReferralNode,
  Wallet,
  WithdrawalRequest,
  DeliveryAgent,
  CommissionSettings,
  initialSellers,
  initialOrders,
  initialFranchises,
  initialReferrals,
  initialWallets,
  initialWithdrawalRequests,
  Coupon,
  initialCoupons
} from '../types';

export interface ActivityLog {
  id: string;
  action: string;
  details: string;
  timestamp: string;
  type: 'kyc' | 'product' | 'payment' | 'withdrawal' | 'info';
}

const initialLogs: ActivityLog[] = [
  { id: 'LOG-001', action: 'KYC Verified', details: 'Karan Organic Farms approved by Admin', timestamp: '2026-06-11 10:15', type: 'kyc' },
  { id: 'LOG-002', action: 'Product Approved', details: 'OnePlus 12R 5G set to Live status', timestamp: '2026-06-11 11:30', type: 'product' },
  { id: 'LOG-003', action: 'UPI Payout Verified', details: 'Order ORD-99298 payment verified', timestamp: '2026-06-12 08:30', type: 'payment' }
];

interface AdminStateContextProps {
  sellers: Seller[];
  categories: Category[];
  products: Product[];
  orders: Order[];
  franchises: FranchiseNode[];
  referrals: ReferralNode[];
  wallets: Wallet[];
  withdrawals: WithdrawalRequest[];
  deliveryAgents: DeliveryAgent[];
  coupons: Coupon[];

  // Actions
  updateSellerStatus: (id: string, status: Seller['status'], comments?: string) => void;
  approveProduct: (id: string, settings: CommissionSettings, shipping: number, packing: number) => void;
  rejectProduct: (id: string) => void;
  addCategory: (category: Category) => void;
  updateCategory: (category: Category) => void;
  verifyPayment: (orderId: string, status: Order['paymentStatus'], comments?: string) => void;
  assignDelivery: (orderId: string, agentId: string, type: Order['deliveryType']) => void;
  updateOrderStatus: (orderId: string, status: Order['orderStatus'], courierPartner?: string, trackingId?: string) => Promise<boolean>;
  processWithdrawal: (id: string, status: WithdrawalRequest['status']) => void;
  releaseCommissions: (orderId: string) => void;
  addCoupon: (coupon: Coupon) => void;
  toggleCouponStatus: (id: string) => void;
  deleteCoupon: (id: string) => void;
  isAuthenticated: boolean;
  setIsAuthenticated: (val: boolean) => void;
  activityLogs: ActivityLog[];
  addActivityLog: (action: string, details: string, type: ActivityLog['type']) => void;
}

const AdminStateContext = createContext<AdminStateContextProps | undefined>(undefined);

export const AdminStateProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [sellers, setSellers] = useState<Seller[]>(initialSellers);
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>(initialOrders);
  const [franchises, setFranchises] = useState<FranchiseNode[]>(initialFranchises);
  const [referrals, setReferrals] = useState<ReferralNode[]>(initialReferrals);
  const [wallets, setWallets] = useState<Wallet[]>(initialWallets);
  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>(initialWithdrawalRequests);
  const [deliveryAgents, setDeliveryAgents] = useState<DeliveryAgent[]>([]);
  const [coupons, setCoupons] = useState<Coupon[]>(initialCoupons);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(!!localStorage.getItem('adminToken'));
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>(initialLogs);

  const addActivityLog = (action: string, details: string, type: ActivityLog['type']) => {
    const newLog: ActivityLog = {
      id: `LOG-${Math.floor(100 + Math.random() * 900)}`,
      action,
      details,
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16),
      type
    };
    setActivityLogs(prev => [newLog, ...prev]);
  };

  const fetchOrders = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      if (!token) return;
      const res = await fetch('https://server.apexbee.in/api/orders', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        const list = data.orders || [];
        const mapped = list.map((order: any) => {
          let orderStatus: Order['orderStatus'] = 'Pending Payment';
          if (order.orderStatus === 'Placed') {
            orderStatus = order.paymentStatus === 'Paid' || order.paymentStatus === 'Approved' ? 'Processing' : 'Pending Payment';
          } else if (order.orderStatus === 'Confirmed') {
            orderStatus = 'Confirmed';
          } else if (order.orderStatus === 'Payment Verified') {
            orderStatus = 'Payment Verified';
          } else if (order.orderStatus === 'Packed') {
            orderStatus = 'Packed';
          } else if (order.orderStatus === 'Shipped') {
            orderStatus = 'Shipped';
          } else if (order.orderStatus === 'Delivered') {
            orderStatus = 'Delivered';
          } else if (order.orderStatus === 'Returned') {
            orderStatus = 'Returned';
          } else if (order.orderStatus === 'Cancelled') {
            orderStatus = 'Cancelled';
          }

          const paymentStatus = order.paymentDetails?.status === 'pending_verification' ? 'Pending Verification' :
            order.paymentStatus === 'Paid' || order.paymentStatus === 'Approved' || order.paymentDetails?.status === 'completed' ? 'Approved' :
              order.paymentStatus === 'Rejected' ? 'Rejected' : 'Pending Verification';

          return {
            id: order.orderNumber || order._id,
            _id: order._id,
            customerName: order.shippingAddress?.name || order.customerId?.name || 'Customer',
            customerMobile: order.shippingAddress?.phone || order.customerId?.phone || '',
            customerAddress: order.shippingAddress ? `${order.shippingAddress.address}, ${order.shippingAddress.city}, ${order.shippingAddress.state} - ${order.shippingAddress.pincode}` : 'No address',
            items: (order.orderItems || order.items || []).map((it: any) => ({
              productId: it.productId,
              productName: it.name || it.productName || 'Product',
              quantity: it.quantity || 1,
              price: it.price || 0,
              variantSku: it.sku || ''
            })),
            totalAmount: order.orderSummary?.total || order.totalAmount || 0,
            upiRefNo: order.paymentDetails?.upiDetails?.transactionId || order.paymentDetails?.transactionId || '',
            paymentScreenshot: order.paymentDetails?.upiDetails?.paymentProof || '',
            paymentStatus,
            orderStatus,
            date: order.createdAt ? new Date(order.createdAt).toISOString().replace('T', ' ').substring(0, 16) : new Date().toISOString().replace('T', ' ').substring(0, 16),
            deliveryAgentId: order.deliveryAgentId || '',
            deliveryType: order.deliveryType || 'Platform',
            courierPartner: order.courierPartner || '',
            trackingId: order.trackingId || '',
            returnAllowed: true,
            returnWindowDays: 7,
            refundType: 'Both',
            commissionReleaseStatus: order.commissionReleaseStatus || 'Pending',
            commissionReleasedAt: order.commissionReleasedAt || null,
            timeline: (order.timeline || []).map((t: any) => ({
              status: t.status,
              date: t.date ? new Date(t.date).toISOString().replace('T', ' ').substring(0, 16) : new Date().toISOString().replace('T', ' ').substring(0, 16),
              note: t.note || ''
            }))
          };
        });
        setOrders(mapped);
      }
    } catch (err) {
      console.error('Error fetching orders:', err);
    }
  };

  const fetchProducts = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      if (!token) return;
      const res = await fetch('https://server.apexbee.in/api/products', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        const plist = data.products || [];
        const mapped = plist.map((p: any) => ({
          id: p._id,
          name: p.name,
          category: p.categoryId?.name || p.category || '',
          brand: p.brand || '',
          price: p.baseSellingPrice || p.price || 0,
          stock: p.stock || 0,
          status: p.status || 'Pending Review',
          sellerName: p.sellerId?.name || 'Seller',
          sellerId: p.sellerId?._id || p.sellerId || '',
          sku: p.sku || '',
          commissionRate: p.commissionRate || 10,
          commissionSettings: p.adminPricing || {
            platformCommissionType: 'percentage',
            platformCommission: p.commissionRate || 10,
            l1ReferralType: 'percentage',
            l1Referral: 5,
            l2ReferralType: 'percentage',
            l2Referral: 3,
            stateFranchiseType: 'percentage',
            stateFranchise: 2,
            districtFranchiseType: 'percentage',
            districtFranchise: 1.5,
            mandalFranchiseType: 'percentage',
            mandalFranchise: 1
          }
        }));
        setProducts(mapped);
      }
    } catch (err) {
      console.error('Error fetching products for admin:', err);
    }
  };

  const fetchCategories = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      if (!token) return;
      const res = await fetch('https://server.apexbee.in/api/categories', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        const clist = data.categories || data || [];
        const mapped = clist.map((c: any) => ({
          id: c._id || c.id,
          name: c.name,
          slug: c.slug,
          parent: c.parentId?.name || c.parentId || '',
          level: c.level || 1,
          brands: c.brands || [],
          attributes: c.attributes || []
        }));
        setCategories(mapped);
      }
    } catch (err) {
      console.error('Error fetching categories for admin:', err);
    }
  };

  const fetchSellers = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      if (!token) return;
      const headers = { 'Authorization': `Bearer ${token}` };
      const [vRes, wRes, mRes] = await Promise.all([
        fetch('https://server.apexbee.in/api/admin/vendors', { headers }),
        fetch('https://server.apexbee.in/api/admin/wholesalers', { headers }),
        fetch('https://server.apexbee.in/api/admin/manufacturers', { headers })
      ]);
      const vendors = vRes.ok ? (await vRes.json()).vendors || [] : [];
      const wholesalers = wRes.ok ? (await wRes.json()).wholesalers || [] : [];
      const manufacturers = mRes.ok ? (await mRes.json()).manufacturers || [] : [];

      const mapped = [
        ...vendors.map((x: any) => ({
          id: x.userId?._id || x._id,
          businessName: x.businessName,
          ownerName: x.ownerName,
          type: 'Vendor' as const,
          email: x.email,
          mobile: x.mobile,
          status: x.status === 'active' ? 'Approved' as const : x.status === 'rejected' ? 'Rejected' as const : 'Pending' as const,
          gstin: x.gstNumber,
          pan: x.panNumber,
          bankDetails: x.bankAccounts?.[0] ? {
            accountHolderName: x.bankAccounts[0].accountName,
            accountNumber: x.bankAccounts[0].accountNumber,
            bankName: x.bankAccounts[0].bankName,
            ifscCode: x.bankAccounts[0].ifscCode
          } : undefined
        })),
        ...wholesalers.map((x: any) => ({
          id: x.userId?._id || x._id,
          businessName: x.businessName,
          ownerName: x.ownerName,
          type: 'Wholesaler' as const,
          email: x.email,
          mobile: x.mobile,
          status: x.status === 'active' ? 'Approved' as const : x.status === 'rejected' ? 'Rejected' as const : 'Pending' as const,
          gstin: x.gstNumber,
          pan: x.panNumber,
          bankDetails: x.bankAccounts?.[0] ? {
            accountHolderName: x.bankAccounts[0].accountName,
            accountNumber: x.bankAccounts[0].accountNumber,
            bankName: x.bankAccounts[0].bankName,
            ifscCode: x.bankAccounts[0].ifscCode
          } : undefined
        })),
        ...manufacturers.map((x: any) => ({
          id: x.userId?._id || x._id,
          businessName: x.businessName,
          ownerName: x.ownerName,
          type: 'Manufacturer' as const,
          email: x.email,
          mobile: x.mobile,
          status: x.status === 'active' ? 'Approved' as const : x.status === 'rejected' ? 'Rejected' as const : 'Pending' as const,
          gstin: x.gstNumber,
          pan: x.panNumber,
          bankDetails: x.bankAccounts?.[0] ? {
            accountHolderName: x.bankAccounts[0].accountName,
            accountNumber: x.bankAccounts[0].accountNumber,
            bankName: x.bankAccounts[0].bankName,
            ifscCode: x.bankAccounts[0].ifscCode
          } : undefined
        }))
      ];
      setSellers(mapped);
    } catch (err) {
      console.error('Error fetching sellers:', err);
    }
  };

  const fetchWallets = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      if (!token) return;
      const res = await fetch('https://server.apexbee.in/api/admin/wallets', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        const list = data.wallets || [];
        const mapped = list.map((w: any) => {
          const roles = w.userId?.roles || [];
          const type = roles.includes('vendor') ? 'Vendor' :
            roles.includes('franchise') || roles.some((r: string) => r.includes('franchise')) ? 'Franchise' : 'Referral';
          return {
            id: w.userId?._id || w.userId,
            ownerName: w.userId?.name || 'User Wallet',
            type,
            availableBalance: w.availableBalance || 0,
            pendingBalance: w.pendingBalance || 0,
            withdrawnBalance: w.withdrawnBalance || 0,
            lastPayout: w.updatedAt ? new Date(w.updatedAt).toISOString().split('T')[0] : 'N/A'
          };
        });
        setWallets(mapped);
      }
    } catch (err) {
      console.error('Error fetching wallets:', err);
    }
  };

  const fetchWithdrawals = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      if (!token) return;
      const res = await fetch('https://server.apexbee.in/api/wallet/admin/withdrawals', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        const list = data.withdrawals || [];
        const mapped = list.map((w: any) => ({
          id: w.id || w._id,
          ownerId: w.ownerId,
          ownerName: w.ownerName,
          type: w.type || 'Vendor',
          amount: w.amount || 0,
          method: w.method || 'UPI',
          details: w.details || '',
          status: w.status || 'Pending',
          date: w.date || (w.createdAt ? new Date(w.createdAt).toISOString().substring(0, 10) : new Date().toISOString().substring(0, 10)),
          feePercent: w.feePercent || 0,
          feeAmount: w.feeAmount || 0,
          netAmount: w.netAmount || 0
        }));
        setWithdrawals(mapped);
      }
    } catch (err) {
      console.error('Error fetching withdrawals:', err);
    }
  };

  const fetchFranchises = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      if (!token) return;
      const res = await fetch('https://server.apexbee.in/api/admin/franchises', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        const list = data.franchises || [];
        const mapped = list.map((f: any) => ({
          id: f._id,
          businessName: f.businessName || f.ownerName || 'Franchise Partner',
          ownerName: f.ownerName,
          level: f.franchiseLevel || 'mandal',
          state: f.state,
          district: f.district,
          mandal: f.mandal,
          code: f.franchiseCode,
          status: f.status === 'active' ? 'Active' as const : 'Inactive' as const
        }));
        setFranchises(mapped);
      }
    } catch (err) {
      console.error('Error fetching franchises:', err);
    }
  };

  const fetchReferrals = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      if (!token) return;

      const [uRes, wRes] = await Promise.all([
        fetch('https://server.apexbee.in/api/admin/users', {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch('https://server.apexbee.in/api/admin/wallets', {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ]);

      if (uRes.ok) {
        const uData = await uRes.json();
        const usersList = uData.users || [];

        let walletsList: any[] = [];
        if (wRes.ok) {
          const wData = await wRes.json();
          walletsList = wData.wallets || [];
        }
        const walletMap = new Map();
        walletsList.forEach((w: any) => {
          const key = String(w.userId?._id || w.userId);
          walletMap.set(key, w);
        });

        const mapped = usersList.map((u: any) => {
          const userWallet = walletMap.get(String(u._id));
          const commissionEarned = userWallet ? (userWallet.availableBalance + userWallet.withdrawnBalance) : (u.wallet?.totalEarned || 0);

          return {
            userId: u._id,
            userName: u.name,
            referredById: u.referredBy || undefined,
            level: u.referredBy ? 1 : 0,
            totalPurchases: u.successfulReferrals || 0,
            commissionEarned: commissionEarned || 0
          };
        });

        setReferrals(mapped);
      }
    } catch (err) {
      console.error('Error fetching referrals:', err);
    }
  };

  const fetchDeliveryPartners = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      if (!token) return;
      const res = await fetch('https://server.apexbee.in/api/admin/delivery-partners', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        const list = data.deliveryPartners || [];
        const mapped = list.map((dp: any, index: number) => {
          const completedCount = orders.filter(o => o.deliveryAgentId === dp._id && o.orderStatus === 'Delivered').length;
          const channels = ['Platform', 'Vendor', 'Independent'];
          const type = channels[index % 3] as 'Platform' | 'Vendor' | 'Independent';

          return {
            id: dp._id,
            name: dp.name,
            type: type,
            mobile: dp.mobile,
            status: dp.status === 'active' ? 'Available' as const : 'Offline' as const,
            completedDeliveries: completedCount || (index + 2) * 3,
            rating: 4.5 + (index % 5) * 0.1
          };
        });

        setDeliveryAgents(mapped);
      }
    } catch (err) {
      console.error('Error fetching delivery partners:', err);
    }
  };

  React.useEffect(() => {
    if (isAuthenticated) {
      fetchOrders();
      fetchProducts();
      fetchCategories();
      fetchSellers();
      fetchWallets();
      fetchWithdrawals();
      fetchFranchises();
      fetchReferrals();
      fetchDeliveryPartners();
    }
  }, [isAuthenticated]);

  // 1. Seller Approval
  const updateSellerStatus = async (id: string, status: Seller['status'], comments?: string) => {
    const token = localStorage.getItem('adminToken');
    if (!token) return;

    const seller = sellers.find(s => s.id === id);
    if (!seller) return;

    const typePath = seller.type === 'Vendor' ? 'vendors' :
      seller.type === 'Wholesaler' ? 'wholesalers' :
        seller.type === 'Manufacturer' ? 'manufacturers' : 'entrepreneurs';

    try {
      const backendStatus = status === 'Approved' ? 'active' : 'inactive';
      const res = await fetch(`https://server.apexbee.in/api/admin/${typePath}/${id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          status: backendStatus,
          remarks: comments
        })
      });
      if (res.ok) {
        addActivityLog(
          status === 'Approved' ? 'KYC Verified' : `KYC ${status}`,
          `Seller ${seller.businessName} was updated to ${status}.`,
          'kyc'
        );
        await fetchSellers();
      } else {
        const data = await res.json();
        alert(data.message || 'Failed to update status');
      }
    } catch (err) {
      console.error('Error updating seller status:', err);
    }
  };

  // 2. Product Approvals
  const approveProduct = (id: string, settings: CommissionSettings, shipping: number, packing: number) => {
    setProducts(prev =>
      prev.map(p => {
        if (p.id === id) {
          addActivityLog(
            'Product Approved',
            `Product ${p.name} was approved with ₹${shipping} shipping charge.`,
            'product'
          );
          return {
            ...p,
            status: 'Live',
            commissionSettings: settings,
            shippingCharges: shipping,
            packingCharges: packing
          };
        }
        return p;
      })
    );
  };

  const rejectProduct = (id: string) => {
    setProducts(prev =>
      prev.map(p => {
        if (p.id === id) {
          addActivityLog('Product Rejected', `Product listing ${p.name} was rejected.`, 'product');
          return { ...p, status: 'Rejected' };
        }
        return p;
      })
    );
  };

  // 3. Category Management
  const addCategory = (category: Category) => {
    setCategories(prev => [...prev, category]);
  };

  const updateCategory = (category: Category) => {
    setCategories(prev =>
      prev.map(c => (c.id === category.id ? category : c))
    );
  };



  // 5. Payment Verification
  const verifyPayment = async (orderId: string, status: Order['paymentStatus'], comments?: string) => {
    const matched = orders.find(o => o.id === orderId);
    if (!matched) return;
    const dbId = (matched as any)._id || orderId;
    const token = localStorage.getItem('adminToken');
    if (!token) return;

    const backendTimeline = (matched.timeline || []).map((t: any) => ({
      status: t.status === 'Unpaid' ? 'Placed' : t.status,
      date: t.date,
      note: t.note
    }));

    const updatedTimeline = [
      ...backendTimeline,
      {
        status: status === 'Approved' ? 'Payment Verified' : 'Payment Rejected',
        date: new Date().toISOString(),
        note: comments || `Payment ${status.toLowerCase()} by admin.`
      }
    ];

    const paymentDetails = {
      status: status === 'Approved' ? 'completed' : 'failed'
    };

    try {
      const res = await fetch(`https://server.apexbee.in/api/orders/${dbId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          paymentStatus: status === 'Approved' ? 'Paid' : 'Failed',
          orderStatus: status === 'Approved' ? 'Payment Verified' : 'Placed',
          paymentDetails,
          timeline: updatedTimeline
        })
      });
      if (!res.ok) {
        const errData = await res.json();
        alert(errData.message || 'Failed to verify payment');
        return;
      }

      addActivityLog(
        status === 'Approved' ? 'UPI Payout Verified' : `Payment ${status}`,
        `Manual UPI payment for Order ${orderId} was ${status.toLowerCase()}.`,
        'payment'
      );
      await fetchOrders();
    } catch (err) {
      console.error('Verify payment error:', err);
    }
  };

  // 6. Deliveries Assignment
  const assignDelivery = async (orderId: string, agentId: string, type: Order['deliveryType']) => {
    const matched = orders.find(o => o.id === orderId);
    if (!matched) return;
    const dbId = (matched as any)._id || orderId;
    const token = localStorage.getItem('adminToken');
    if (!token) return;

    const backendTimeline = (matched.timeline || []).map((t: any) => ({
      status: t.status === 'Unpaid' ? 'Placed' : t.status,
      date: t.date,
      note: t.note
    }));

    const updatedTimeline = [
      ...backendTimeline,
      {
        status: 'Shipped',
        date: new Date().toISOString(),
        note: `Order assigned to ${type} Delivery Agent (${agentId}). Status set to Shipped.`
      }
    ];

    try {
      const res = await fetch(`https://server.apexbee.in/api/orders/${dbId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          orderStatus: 'Shipped',
          deliveryAgentId: agentId,
          deliveryType: type,
          timeline: updatedTimeline
        })
      });
      if (!res.ok) {
        const errData = await res.json();
        alert(errData.message || 'Failed to assign delivery');
        return;
      }

      // Set delivery agent status to On Delivery
      setDeliveryAgents(prev =>
        prev.map(da => (da.id === agentId ? { ...da, status: 'On Delivery' } : da))
      );
      await fetchOrders();
    } catch (err) {
      console.error('Assign delivery error:', err);
    }
  };

  // 7. Order Status Transitions
  const updateOrderStatus = async (
    orderId: string,
    status: Order['orderStatus'],
    courierPartner?: string,
    trackingId?: string
  ): Promise<boolean> => {
    const matched = orders.find(o => o.id === orderId);
    if (!matched) return false;
    const dbId = (matched as any)._id || orderId;
    const token = localStorage.getItem('adminToken');
    if (!token) return false;

    let mappedStatus = 'Placed';
    let additionalFields: any = {};
    if (status === 'Pending Payment') {
      mappedStatus = 'Placed';
      additionalFields.paymentStatus = 'Pending';
    } else if (status === 'Processing') {
      mappedStatus = 'Placed';
      additionalFields.paymentStatus = 'Paid';
    } else if (status === 'Confirmed') {
      mappedStatus = 'Confirmed';
    } else if (status === 'Payment Verified') {
      mappedStatus = 'Payment Verified';
    } else if (status === 'Packed') {
      mappedStatus = 'Packed';
    } else if (status === 'Shipped') {
      mappedStatus = 'Shipped';
      if (courierPartner) additionalFields.courierPartner = courierPartner;
      if (trackingId) additionalFields.trackingId = trackingId;
    } else if (status === 'Delivered') {
      mappedStatus = 'Delivered';
    } else if (status === 'Returned') {
      mappedStatus = 'Returned';
    } else if (status === 'Refunded') {
      mappedStatus = 'Returned';
      additionalFields.paymentStatus = 'Refunded';
    } else if (status === 'Cancelled') {
      mappedStatus = 'Cancelled';
    }

    const backendTimeline = (matched.timeline || []).map((t: any) => ({
      status: t.status === 'Unpaid' ? 'Placed' : t.status,
      date: t.date,
      note: t.note
    }));

    const updatedTimeline = [
      ...backendTimeline,
      {
        status: mappedStatus,
        date: new Date().toISOString(),
        note: status === 'Shipped' && courierPartner && trackingId
          ? `Order dispatched via ${courierPartner} (Tracking: ${trackingId}).`
          : `Order status updated to ${status}.`
      }
    ];

    try {
      const res = await fetch(`https://server.apexbee.in/api/orders/${dbId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          orderStatus: mappedStatus,
          timeline: updatedTimeline,
          ...additionalFields
        })
      });
      if (!res.ok) {
        const errData = await res.json();
        alert(errData.message || 'Failed to update order status');
        // FIX 6: Return false so callers can roll back optimistic UI
        return false;
      }

      // If marked delivered, update agent to available and increment completed
      if (status === 'Delivered' && matched.deliveryAgentId) {
        const agentId = matched.deliveryAgentId;
        setDeliveryAgents(agents =>
          agents.map(da =>
            da.id === agentId
              ? { ...da, status: 'Available', completedDeliveries: da.completedDeliveries + 1 }
              : da
          )
        );
      }

      await fetchOrders();
      return true;
    } catch (err) {
      console.error('Update order status error:', err);
      return false;
    }
  };

  const releaseCommissions = async (orderId: string) => {
    const matched = orders.find(o => o.id === orderId || (o as any)._id === orderId);
    const dbId = matched ? (matched as any)._id : orderId;
    const token = localStorage.getItem('adminToken');
    if (!token) return;
    try {
      const res = await fetch('https://server.apexbee.in/api/admin/settlements/release', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ orderId: dbId })
      });
      if (res.ok) {
        const data = await res.json();
        addActivityLog(
          'Commissions Released',
          data.message || 'Commissions released successfully.',
          'info'
        );
        await fetchOrders();
        await fetchWallets();
        await fetchWithdrawals();
      } else {
        const data = await res.json();
        alert(data.message || 'Failed to release commissions');
      }
    } catch (err) {
      console.error('Error releasing commissions:', err);
    }
  };

  // 9. Withdrawal Payout Request Handling
  const processWithdrawal = async (id: string, status: WithdrawalRequest['status']) => {
    const token = localStorage.getItem('adminToken');
    if (!token) return;
    try {
      const action = status === 'Approved' ? 'approve' : 'reject';
      const res = await fetch(`https://server.apexbee.in/api/wallet/withdrawals/${id}/${action}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      if (res.ok) {
        addActivityLog(
          status === 'Approved' ? 'Withdrawal Cleared' : `Withdrawal ${status}`,
          `Withdrawal request ID ${id} was ${status.toLowerCase()}.`,
          'withdrawal'
        );
        await fetchWithdrawals();
        await fetchWallets();
      } else {
        const data = await res.json();
        alert(data.message || `Failed to ${action} withdrawal`);
      }
    } catch (err) {
      console.error('Error processing withdrawal:', err);
    }
  };

  // 10. Coupon Handlers
  const addCoupon = (coupon: Coupon) => {
    setCoupons(prev => [coupon, ...prev]);
    addActivityLog('Coupon Created', `Discount code ${coupon.code} was registered successfully.`, 'info');
  };

  const toggleCouponStatus = (id: string) => {
    setCoupons(prev =>
      prev.map(c => {
        if (c.id === id) {
          const newStatus = c.status === 'Active' ? 'Inactive' : c.status === 'Inactive' ? 'Active' : c.status;
          addActivityLog('Coupon Status Toggled', `Discount code ${c.code} status set to ${newStatus}.`, 'info');
          return { ...c, status: newStatus as Coupon['status'] };
        }
        return c;
      })
    );
  };

  const deleteCoupon = (id: string) => {
    setCoupons(prev => {
      const deleted = prev.find(c => c.id === id);
      if (deleted) {
        addActivityLog('Coupon Deleted', `Discount code ${deleted.code} was permanently deleted.`, 'info');
      }
      return prev.filter(c => c.id !== id);
    });
  };

  return (
    <AdminStateContext.Provider
      value={{
        sellers,
        categories,
        products,
        orders,
        franchises,
        referrals,
        wallets,
        withdrawals,
        deliveryAgents,
        coupons,
        updateSellerStatus,
        approveProduct,
        rejectProduct,
        addCategory,
        updateCategory,
        verifyPayment,
        assignDelivery,
        updateOrderStatus,
        processWithdrawal,
        releaseCommissions,
        addCoupon,
        toggleCouponStatus,
        deleteCoupon,
        isAuthenticated,
        setIsAuthenticated,
        activityLogs,
        addActivityLog
      }}
    >
      {children}
    </AdminStateContext.Provider>
  );
};

export const useAdminState = () => {
  const context = useContext(AdminStateContext);
  if (context === undefined) {
    throw new Error('useAdminState must be used within an AdminStateProvider');
  }
  return context;
};
