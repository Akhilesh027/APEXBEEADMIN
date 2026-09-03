import React, { useState, useEffect } from 'react';
import { useAdminState } from '../context/AdminStateContext';
import {
  Store,
  ShieldAlert,
  Award,
  Star,
  Activity,
  Search,
  ShieldCheck,
  TrendingUp,
  X,
  Edit3,
  MapPin,
  Phone,
  Mail,
  FileText,
  Check,
  Building,
  Globe,
  Truck,
  Clock,
  Save
} from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';

export const VendorManagement: React.FC = () => {
  const { orders, wallets, activityLogs } = useAdminState();
  const [activeSubTab, setActiveSubTab] = useState<'pending' | 'active' | 'rejected' | 'kyc' | 'categories' | 'ratings' | 'performance' | 'wallets'>('active');
  const [searchQuery, setSearchQuery] = useState('');
  const [vendorsList, setVendorsList] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [selectedVendor, setSelectedVendor] = useState<any | null>(null);
  const [showRemarksInput, setShowRemarksInput] = useState(false);
  const [remarks, setRemarks] = useState('');

  // Edit Vendor Profile Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingVendorData, setEditingVendorData] = useState<any | null>(null);
  const [editTab, setEditTab] = useState<'basic' | 'location' | 'operations' | 'policies' | 'governance'>('basic');

  // Category & Subcategories Governance state
  const [dbCategories, setDbCategories] = useState<any[]>([]);
  const [selectedParentCatId, setSelectedParentCatId] = useState<string>('');
  const [editingSubcategories, setEditingSubcategories] = useState<string[]>([]);
  const [newSubCategoryName, setNewSubCategoryName] = useState<string>('');

  // Vendor Products state
  const [vendorProducts, setVendorProducts] = useState<any[]>([]);
  const [productsLoading, setProductsLoading] = useState<boolean>(false);

  useEffect(() => {
    if (selectedVendor?.userId) {
      setProductsLoading(true);
      const token = localStorage.getItem('adminToken');
      fetch(`https://server.apexbee.in/api/admin/vendors/${selectedVendor.userId}/products`, {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      })
        .then(res => res.json())
        .then(data => {
          if (data.products) setVendorProducts(data.products);
          else setVendorProducts([]);
        })
        .catch(() => setVendorProducts([]))
        .finally(() => setProductsLoading(false));
    } else {
      setVendorProducts([]);
    }
  }, [selectedVendor]);

  useEffect(() => {
    fetch('https://server.apexbee.in/api/categories')
      .then(res => res.json())
      .then(data => {
        const catList = Array.isArray(data) ? data : (data?.categories || data?.data || []);
        if (catList.length > 0) setDbCategories(catList);
      })
      .catch(() => { });
  }, []);

  const getStatusLabel = (status?: string) => {
    if (status === 'active') return 'Active';
    if (status === 'pending_verification' || status === 'pending') return 'Pending Approval';
    if (status === 'suspended') return 'Suspended';
    if (status === 'blocked') return 'Blocked';
    return 'Rejected';
  };

  const parseSubcategories = (item: any): string[] => {
    if (!item) return [];
    const subs = item.approvedSubcategories || item.subCategories || item.subcategories;
    if (Array.isArray(subs) && subs.length > 0) {
      return subs.flatMap((s: any) => typeof s === 'string' && s.includes(',') ? s.split(',').map(x => x.trim()) : String(s).trim()).filter(Boolean);
    }
    const single = item.subCategory || item.subcategory;
    if (typeof single === 'string' && single.trim()) {
      const trimmed = single.trim();
      if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
        try {
          const p = JSON.parse(trimmed);
          if (Array.isArray(p)) return p.map((x: any) => String(x).trim()).filter(Boolean);
        } catch (e) { }
      }
      if (trimmed.includes(',')) return trimmed.split(',').map(s => s.trim()).filter(Boolean);
      return [trimmed];
    }
    return [];
  };

  const fetchVendors = async () => {
    try {
      setLoading(true);
      setErrorMsg('');
      const token = localStorage.getItem('adminToken');
      const res = await fetch('https://server.apexbee.in/api/admin/vendors', {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });
      const data = await res.json();
      if (data.success) {
        const mapped = (data.vendors || []).map((v: any) => {
          const userWallet = wallets.find((w: any) => String(w.userId?._id || w.userId || w.id) === String(v.userId));
          const availableBalance = userWallet ? (userWallet.availableBalance + userWallet.withdrawnBalance) : 0;
          const parsedSubs = parseSubcategories(v);
          return {
            id: v._id,
            userId: v.userId,
            name: v.businessName || 'Unnamed Store',
            contact: v.ownerName || 'Unknown Owner',
            mobile: v.mobile || '',
            email: v.email || '',
            whatsappNumber: v.whatsappNumber || '',
            address: v.address || '',
            pincode: v.pincode || '',
            state: v.state || '',
            district: v.district || '',
            mandal: v.mandal || '',
            village: v.village || '',
            rating: v.rating?.average ? String(v.rating.average) : '4.8',
            performance: '100% Fulfillment',
            revenue: availableBalance,
            status: getStatusLabel(v.status),
            category: v.category || v.primaryCategory || 'Retail Store',
            subCategory: parsedSubs[0] || v.subCategory || '',
            approvedSubcategories: parsedSubs,
            gstNumber: v.gstNumber || '',
            panNumber: v.panNumber || '',
            rawStatus: v.status || 'active',
            marketplaceStatus: v.marketplaceStatus || 'Draft',
            verifiedBadge: !!v.verifiedBadge,
            location: v.location,
            businessHours: v.businessHours,
            storeTags: v.storeTags || [],
            storeServices: v.storeServices || [],
            fssaiNumber: v.fssaiNumber || '',
            gallery: v.gallery || [],
            refundPolicy: v.refundPolicy || '',
            replacementPolicy: v.replacementPolicy || '',
            storeDesign: v.storeDesign || {},
            storeType: v.storeType || 'grocery',
            deliveryMode: v.deliveryMode || 'platform_delivery',
            deliveryRadiusKm: v.deliveryRadiusKm || 5,
            minOrder: v.minOrder || 100,
            deliveryCharge: v.deliveryCharge || 20,
            estimatedDeliveryMinutes: v.estimatedDeliveryMinutes || 30,
            liveStatus: v.liveStatus || 'open',
          };
        });
        setVendorsList(mapped);
      } else {
        setErrorMsg(data.message || 'Failed to fetch vendors');
      }
    } catch (err: any) {
      console.error('Error fetching vendors:', err);
      setErrorMsg(err.message || 'Network error fetching vendors');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVendors();
  }, [wallets]);

  useEffect(() => {
    if (selectedVendor && dbCategories.length > 0) {
      const vendorCatStr = selectedVendor.category || '';
      const matchedParent = dbCategories.find(c =>
        (c.level === 1 || !c.parentId) &&
        (c.name.toLowerCase() === vendorCatStr.toLowerCase() || vendorCatStr.toLowerCase().includes(c.name.toLowerCase()))
      );
      if (matchedParent) {
        setSelectedParentCatId(matchedParent._id);
      }
      setEditingSubcategories(parseSubcategories(selectedVendor));
    }
  }, [selectedVendor, dbCategories]);

  const parentCategories = dbCategories.filter((c: any) => c.level === 1 || !c.parentId);
  const activeParentCat = parentCategories.find((c: any) => String(c._id) === String(selectedParentCatId)) || parentCategories[0];
  const currentSubCategories = dbCategories.filter((c: any) => {
    if (c.level !== 2) return false;
    const parentIdStr = typeof c.parentId === 'object' ? c.parentId?._id : c.parentId;
    return String(parentIdStr) === String(activeParentCat?._id);
  });

  const handleAddSubcategory = (name: string) => {
    if (!name.trim()) return;
    const trimmed = name.trim();
    if (!editingSubcategories.includes(trimmed)) {
      setEditingSubcategories(prev => [...prev, trimmed]);
    }
    setNewSubCategoryName('');
  };

  const handleRemoveSubcategory = (index: number) => {
    setEditingSubcategories(prev => prev.filter((_, i) => i !== index));
  };

  const handleSaveCategoryGovernance = async () => {
    if (!selectedVendor) return;
    try {
      setActionLoading(true);
      setErrorMsg('');
      setSuccessMsg('');
      const token = localStorage.getItem('adminToken');
      const primaryCategoryName = activeParentCat?.name || selectedVendor.category;

      const res = await fetch(`https://server.apexbee.in/api/admin/vendors/${selectedVendor.userId}/category-governance`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          primaryCategory: primaryCategoryName,
          subCategory: editingSubcategories[0] || '',
          approvedSubcategories: editingSubcategories
        })
      });
      const data = await res.json();
      if (data.success) {
        setSuccessMsg(`Category governance updated for ${selectedVendor.name}!`);
        setSelectedVendor((prev: any) => prev ? { ...prev, category: primaryCategoryName, approvedSubcategories: editingSubcategories } : null);
        fetchVendors();
      } else {
        setErrorMsg(data.message || 'Failed to save category governance');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Error saving category governance');
    } finally {
      setActionLoading(false);
    }
  };

  const handleVendorDrawdown = async (vendorUserId: string) => {
    try {
      const inputVal = prompt("Enter payout/drawdown amount (INR):");
      if (inputVal === null) return;
      const amount = parseFloat(inputVal);
      if (isNaN(amount) || amount <= 0) {
        alert("Please enter a valid positive number.");
        return;
      }
      setActionLoading(true);
      setErrorMsg('');
      setSuccessMsg('');
      const token = localStorage.getItem('adminToken');
      const res = await fetch(`https://server.apexbee.in/api/admin/vendors/${vendorUserId}/drawdown`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ amount })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSuccessMsg(data.message || 'Vendor drawdown completed successfully');
        await fetchVendors();
      } else {
        setErrorMsg(data.message || 'Drawdown request failed');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Error communicating with backend');
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateVendorStatus = async (vendorUserId: string, newStatus: string) => {
    try {
      setActionLoading(true);
      setErrorMsg('');
      setSuccessMsg('');
      const token = localStorage.getItem('adminToken');
      const res = await fetch(`https://server.apexbee.in/api/admin/vendors/${vendorUserId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          status: newStatus,
          remarks: remarks || `Vendor profile status updated to ${newStatus} by admin.`
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSuccessMsg(`Vendor status updated to ${newStatus} successfully`);
        setSelectedVendor(null);
        setRemarks('');
        setShowRemarksInput(false);
        await fetchVendors();
      } else {
        setErrorMsg(data.message || 'Failed to update vendor status');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Error communicating with backend');
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateVendorMarketplace = async (vendorUserId: string, updates: any) => {
    try {
      setActionLoading(true);
      setErrorMsg('');
      setSuccessMsg('');
      const token = localStorage.getItem('adminToken');
      const res = await fetch(`https://server.apexbee.in/api/admin/vendors/${vendorUserId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify(updates)
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSuccessMsg(`Vendor marketplace configuration updated successfully`);
        setSelectedVendor(null);
        await fetchVendors();
      } else {
        setErrorMsg(data.message || 'Failed to update vendor configurations');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Error communicating with backend');
    } finally {
      setActionLoading(false);
    }
  };

  // Open Edit Vendor Modal
  const handleOpenEditModal = (vendor: any) => {
    setEditingVendorData({
      userId: vendor.userId,
      id: vendor.id,
      businessName: vendor.name || '',
      ownerName: vendor.contact || '',
      mobile: vendor.mobile || '',
      email: vendor.email || '',
      whatsappNumber: vendor.whatsappNumber || '',
      address: vendor.address || '',
      pincode: vendor.pincode || '',
      state: vendor.state || '',
      district: vendor.district || '',
      mandal: vendor.mandal || '',
      village: vendor.village || '',
      gstNumber: vendor.gstNumber || '',
      panNumber: vendor.panNumber || '',
      fssaiNumber: vendor.fssaiNumber || '',
      category: vendor.category || 'Retail Store',
      subCategory: vendor.subCategory || '',
      storeType: vendor.storeType || 'grocery',
      deliveryMode: vendor.deliveryMode || 'platform_delivery',
      deliveryRadiusKm: vendor.deliveryRadiusKm || 5,
      minOrder: vendor.minOrder || 100,
      deliveryCharge: vendor.deliveryCharge || 20,
      estimatedDeliveryMinutes: vendor.estimatedDeliveryMinutes || 30,
      liveStatus: vendor.liveStatus || 'open',
      status: vendor.rawStatus || 'active',
      marketplaceStatus: vendor.marketplaceStatus || 'Draft',
      verifiedBadge: !!vendor.verifiedBadge,
      description: vendor.storeDesign?.description || '',
      refundPolicy: vendor.refundPolicy || vendor.storeDesign?.refundPolicy || '',
      replacementPolicy: vendor.replacementPolicy || vendor.storeDesign?.replacementPolicy || '',
      deliveryPolicy: vendor.storeDesign?.deliveryPolicy || '',
      latitude: vendor.location?.coordinates ? vendor.location.coordinates[1] : '',
      longitude: vendor.location?.coordinates ? vendor.location.coordinates[0] : '',
    });
    setEditTab('basic');
    setIsEditModalOpen(true);
  };

  // Save Full Vendor Profile by Admin
  const handleSaveVendorProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingVendorData?.userId) return;

    try {
      setActionLoading(true);
      setErrorMsg('');
      setSuccessMsg('');
      const token = localStorage.getItem('adminToken');

      const payload = {
        businessName: editingVendorData.businessName,
        ownerName: editingVendorData.ownerName,
        mobile: editingVendorData.mobile,
        email: editingVendorData.email,
        whatsappNumber: editingVendorData.whatsappNumber,
        address: editingVendorData.address,
        pincode: String(editingVendorData.pincode).trim(),
        state: editingVendorData.state,
        district: editingVendorData.district,
        mandal: editingVendorData.mandal,
        village: editingVendorData.village,
        gstNumber: editingVendorData.gstNumber,
        panNumber: editingVendorData.panNumber,
        fssaiNumber: editingVendorData.fssaiNumber,
        category: editingVendorData.category,
        primaryCategory: editingVendorData.category,
        subCategory: editingVendorData.subCategory,
        storeType: editingVendorData.storeType,
        deliveryMode: editingVendorData.deliveryMode,
        deliveryRadiusKm: Number(editingVendorData.deliveryRadiusKm) || 5,
        minOrder: Number(editingVendorData.minOrder) || 100,
        deliveryCharge: Number(editingVendorData.deliveryCharge) || 20,
        estimatedDeliveryMinutes: Number(editingVendorData.estimatedDeliveryMinutes) || 30,
        liveStatus: editingVendorData.liveStatus,
        status: editingVendorData.status,
        marketplaceStatus: editingVendorData.marketplaceStatus,
        verifiedBadge: Boolean(editingVendorData.verifiedBadge),
        description: editingVendorData.description,
        refundPolicy: editingVendorData.refundPolicy,
        replacementPolicy: editingVendorData.replacementPolicy,
        deliveryPolicy: editingVendorData.deliveryPolicy,
        ...(editingVendorData.latitude && editingVendorData.longitude
          ? {
            location: {
              type: 'Point',
              coordinates: [parseFloat(editingVendorData.longitude), parseFloat(editingVendorData.latitude)]
            }
          }
          : {})
      };

      const res = await fetch(`https://server.apexbee.in/api/admin/vendors/${editingVendorData.userId}/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setSuccessMsg(`Vendor profile for "${editingVendorData.businessName}" updated successfully!`);
        setIsEditModalOpen(false);

        // Update selectedVendor if open
        if (selectedVendor && selectedVendor.userId === editingVendorData.userId) {
          setSelectedVendor((prev: any) => ({
            ...prev,
            name: editingVendorData.businessName,
            contact: editingVendorData.ownerName,
            mobile: editingVendorData.mobile,
            email: editingVendorData.email,
            whatsappNumber: editingVendorData.whatsappNumber,
            address: editingVendorData.address,
            pincode: editingVendorData.pincode,
            state: editingVendorData.state,
            district: editingVendorData.district,
            mandal: editingVendorData.mandal,
            village: editingVendorData.village,
            gstNumber: editingVendorData.gstNumber,
            panNumber: editingVendorData.panNumber,
            fssaiNumber: editingVendorData.fssaiNumber,
            category: editingVendorData.category,
            subCategory: editingVendorData.subCategory,
            status: getStatusLabel(editingVendorData.status),
            rawStatus: editingVendorData.status,
            marketplaceStatus: editingVendorData.marketplaceStatus,
            verifiedBadge: editingVendorData.verifiedBadge,
            refundPolicy: editingVendorData.refundPolicy,
            replacementPolicy: editingVendorData.replacementPolicy,
            storeDesign: {
              ...(prev?.storeDesign || {}),
              description: editingVendorData.description,
              deliveryPolicy: editingVendorData.deliveryPolicy
            }
          }));
        }

        await fetchVendors();
      } else {
        setErrorMsg(data.message || 'Failed to update vendor profile');
      }
    } catch (err: any) {
      console.error('Error saving vendor profile:', err);
      setErrorMsg(err.message || 'Error communicating with server');
    } finally {
      setActionLoading(false);
    }
  };

  const getFilteredVendors = () => {
    switch (activeSubTab) {
      case 'pending':
        return vendorsList.filter(v => v.status === 'Pending Approval');
      case 'active':
        return vendorsList.filter(v => v.status === 'Active');
      case 'rejected':
        return vendorsList.filter(v => v.status === 'Rejected');
      default:
        return vendorsList;
    }
  };

  const currentVendors = getFilteredVendors().filter(v =>
    (v.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (v.contact || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (v.id || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (v.pincode || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (v.district || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (v.state || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (v.mobile || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (v.email || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Group real completed orders per vendor store
  const getPerformanceData = () => {
    const data = vendorsList.map(v => {
      const storeOrders = orders.filter(o => o.items.some(it => it.productId && it.productId.startsWith(v.id) || (o as any).sellerId === v.id));
      return {
        name: v.name ? v.name.split(' ')[0] : 'Store',
        fulfillment: storeOrders.length
      };
    });

    const defaults = [
      { name: 'Balaji Seeds', fulfillment: 15 },
      { name: 'Sai Organic', fulfillment: 9 }
    ];

    if (data.length === 0) return defaults;
    return data.slice(0, 5);
  };

  const performanceData = getPerformanceData();

  const vendorActivityLogs = activityLogs.filter(log =>
    (log.type as string) === 'order' ||
    log.details.toLowerCase().includes('vendor') ||
    log.action.toLowerCase().includes('vendor')
  ).slice(0, 5);

  const totalVendorRevenue = vendorsList.reduce((acc, v) => acc + (v.revenue || 0), 0);

  return (
    <div className="space-y-6">
      {successMsg && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 rounded-xl flex items-center justify-between text-xs font-semibold">
          <div className="flex items-center gap-2">
            <ShieldCheck size={16} />
            {successMsg}
          </div>
          <button onClick={() => setSuccessMsg('')} className="p-1 hover:text-emerald-300">
            <X size={14} />
          </button>
        </div>
      )}

      {errorMsg && (
        <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-500 rounded-xl flex items-center justify-between text-xs font-semibold">
          <div className="flex items-center gap-2">
            <ShieldAlert size={16} />
            {errorMsg}
          </div>
          <button onClick={() => setErrorMsg('')} className="p-1 hover:text-red-300">
            <X size={14} />
          </button>
        </div>
      )}

      {/* Dashboard Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 select-none">
        <div className="bg-card border border-border/80 rounded-2xl p-4 flex items-center justify-between shadow-sm">
          <div>
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Total Vendors</span>
            <span className="text-xl font-bold font-mono text-foreground mt-1 block">
              {loading ? '...' : `${vendorsList.length} Stores`}
            </span>
            <span className="text-[9px] text-emerald-500 mt-1 block font-semibold">Live Database Records</span>
          </div>
          <Store className="text-primary shrink-0" size={24} />
        </div>
        <div className="bg-card border border-border/80 rounded-2xl p-4 flex items-center justify-between shadow-sm">
          <div>
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Active Vendors</span>
            <span className="text-xl font-bold font-mono text-foreground mt-1 block">
              {loading ? '...' : `${vendorsList.filter(v => v.status === 'Active').length} Active`}
            </span>
            <span className="text-[9px] text-emerald-500 mt-1 block font-semibold">Active Dispatch Ready</span>
          </div>
          <ShieldCheck className="text-emerald-500 shrink-0" size={24} />
        </div>
        <div className="bg-card border border-border/80 rounded-2xl p-4 flex items-center justify-between shadow-sm">
          <div>
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Top Vendors</span>
            <span className="text-xl font-bold font-mono text-foreground mt-1 block">
              {loading ? '...' : `${vendorsList.filter(v => parseFloat(v.rating) >= 4.7).length} Certified`}
            </span>
            <span className="text-[9px] text-violet-500 mt-1 block font-semibold">Over 4.7★ average</span>
          </div>
          <Award className="text-violet-500 shrink-0" size={24} />
        </div>
        <div className="bg-card border border-border/80 rounded-2xl p-4 flex items-center justify-between shadow-sm">
          <div>
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Pending Approvals</span>
            <span className="text-xl font-bold font-mono text-foreground mt-1 block">
              {loading ? '...' : `${vendorsList.filter(v => v.status === 'Pending Approval').length} Pending`}
            </span>
            <span className="text-[9px] text-amber-500 mt-1 block font-semibold">KYC audit in progress</span>
          </div>
          <ShieldAlert className="text-amber-500 shrink-0" size={24} />
        </div>
        <div className="bg-card border border-border/80 rounded-2xl p-4 flex items-center justify-between shadow-sm">
          <div>
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Vendor Revenue</span>
            <span className="text-xl font-bold font-mono text-foreground mt-1 block">
              {loading ? '...' : `₹${totalVendorRevenue.toLocaleString('en-IN')}`}
            </span>
            <span className="text-[9px] text-emerald-500 mt-1 block font-semibold">Accrued wallet reserves</span>
          </div>
          <TrendingUp className="text-primary shrink-0" size={24} />
        </div>
      </div>

      {/* Subtab Menu */}
      <div className="flex gap-2 flex-wrap bg-card border border-border/60 p-2 rounded-2xl select-none shadow-sm">
        {(['pending', 'active', 'rejected', 'kyc', 'categories', 'ratings', 'performance', 'wallets'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveSubTab(tab)}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all ${activeSubTab === tab
              ? 'bg-primary text-primary-foreground border-primary shadow-md'
              : 'bg-transparent text-muted-foreground border-transparent hover:bg-secondary/60 hover:text-foreground'
              }`}
          >
            {tab === 'kyc' ? 'Vendor KYC' : tab === 'pending' ? 'Pending Approval' : tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* Main Grid: Data Tables and Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

        {/* Left Column: Vendor rosters & lists */}
        <div className="lg:col-span-8 bg-card border border-border/80 rounded-2xl shadow-sm overflow-hidden p-5 space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-3 border-b border-border/60">
            <span className="text-xs font-bold text-foreground uppercase tracking-wider">
              Vendor Management Deck ({activeSubTab.toUpperCase()})
            </span>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:flex-initial">
                <Search className="absolute left-3 top-2.5 text-muted-foreground" size={14} />
                <input
                  type="text"
                  placeholder="Search store, owner, pincode, city..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 pr-4 py-1.5 bg-secondary/50 border border-border/80 focus:border-primary rounded-xl text-xs outline-none w-full sm:w-60 font-medium"
                />
              </div>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-12 text-xs text-muted-foreground select-none">
              Loading vendor list from backend...
            </div>
          ) : activeSubTab === 'kyc' ? (
            /* Vendor KYC details */
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-secondary/40 select-none border-b border-border/60">
                  <tr>
                    <th className="p-3 font-semibold text-muted-foreground">ID</th>
                    <th className="p-3 font-semibold text-muted-foreground">Business Name</th>
                    <th className="p-3 font-semibold text-muted-foreground">Location & Pincode</th>
                    <th className="p-3 font-semibold text-muted-foreground">GST Document</th>
                    <th className="p-3 font-semibold text-muted-foreground">PAN details</th>
                    <th className="p-3 font-semibold text-muted-foreground text-center">KYC Audit</th>
                    <th className="p-3 font-semibold text-muted-foreground text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {vendorsList.map(v => (
                    <tr key={v.id} className="hover:bg-secondary/10 transition-colors">
                      <td className="p-3 font-mono font-semibold text-primary">{v.id}</td>
                      <td className="p-3">
                        <span className="font-medium text-foreground block">{v.name}</span>
                        <span className="text-[10px] text-muted-foreground block">Rep: {v.contact}</span>
                      </td>
                      <td className="p-3">
                        <span className="inline-flex items-center gap-1 font-mono font-bold text-primary bg-primary/10 px-2 py-0.5 rounded text-[11px]">
                          <MapPin size={11} className="text-primary" /> {v.pincode || 'PIN N/A'}
                        </span>
                        <span className="text-[10px] text-muted-foreground block mt-0.5 truncate max-w-[140px]" title={v.address}>
                          {[v.mandal, v.district, v.state].filter(Boolean).join(', ') || v.address || 'Address pending'}
                        </span>
                      </td>
                      <td className="p-3 font-mono text-muted-foreground">{v.gstNumber || 'GST-PENDING'}</td>
                      <td className="p-3 font-mono text-muted-foreground">{v.panNumber || 'PAN-PENDING'}</td>
                      <td className="p-3 text-center">
                        <span className={`px-2 py-0.5 rounded text-[8px] font-bold ${v.status === 'Active' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-amber-500/10 text-amber-500 animate-pulse'
                          }`}>
                          {v.status === 'Active' ? 'Verified' : 'Pending Verification'}
                        </span>
                      </td>
                      <td className="p-3 text-center">
                        <button
                          onClick={() => handleOpenEditModal(v)}
                          className="px-2.5 py-1 bg-primary/10 hover:bg-primary hover:text-white text-primary rounded-lg text-[10px] font-bold transition flex items-center gap-1 mx-auto"
                        >
                          <Edit3 size={11} /> Edit
                        </button>
                      </td>
                    </tr>
                  ))}
                  {vendorsList.length === 0 && (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-xs text-muted-foreground">No records.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          ) : activeSubTab === 'wallets' ? (
            /* Vendor Wallets and Settlements ledger */
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-secondary/40 select-none border-b border-border/60">
                  <tr>
                    <th className="p-3 font-semibold text-muted-foreground">Store ID</th>
                    <th className="p-3 font-semibold text-muted-foreground">Business Name</th>
                    <th className="p-3 font-semibold text-muted-foreground">Pincode</th>
                    <th className="p-3 font-semibold text-muted-foreground">Accumulated Revenue</th>
                    <th className="p-3 font-semibold text-muted-foreground">Payout Status</th>
                    <th className="p-3 font-semibold text-muted-foreground text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {vendorsList.map(v => (
                    <tr key={v.id} className="hover:bg-secondary/10 transition-colors">
                      <td className="p-3 font-mono font-semibold text-primary">{v.id}</td>
                      <td className="p-3 font-medium text-foreground">{v.name}</td>
                      <td className="p-3 font-mono font-semibold text-primary">📮 {v.pincode || 'N/A'}</td>
                      <td className="p-3 font-mono font-bold text-foreground">₹{v.revenue.toLocaleString('en-IN')}</td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded text-[8px] font-bold bg-emerald-500/10 text-emerald-500">Settled</span>
                      </td>
                      <td className="p-3 text-center">
                        <button
                          onClick={() => handleVendorDrawdown(v.userId)}
                          disabled={actionLoading}
                          className="px-2.5 py-1 bg-primary/10 text-primary disabled:opacity-50 hover:bg-primary hover:text-white rounded-lg text-[10px] font-bold transition-all cursor-pointer"
                        >
                          {actionLoading ? 'Processing...' : 'Withdrawal'}
                        </button>
                      </td>
                    </tr>
                  ))}
                  {vendorsList.length === 0 && (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-xs text-muted-foreground">No records.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          ) : activeSubTab === 'ratings' ? (
            /* Vendor ratings page */
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-secondary/40 select-none border-b border-border/60">
                  <tr>
                    <th className="p-3 font-semibold text-muted-foreground">Business Name</th>
                    <th className="p-3 font-semibold text-muted-foreground">Pincode & City</th>
                    <th className="p-3 font-semibold text-muted-foreground">Categories</th>
                    <th className="p-3 font-semibold text-muted-foreground">Rating Score</th>
                    <th className="p-3 font-semibold text-muted-foreground text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {vendorsList.map(v => (
                    <tr key={v.id} className="hover:bg-secondary/10 transition-colors">
                      <td className="p-3 font-medium text-foreground">{v.name}</td>
                      <td className="p-3">
                        <span className="font-mono text-primary font-bold text-[11px]">📮 {v.pincode || 'N/A'}</span>
                        <span className="text-[10px] text-muted-foreground block">{v.district || v.state || ''}</span>
                      </td>
                      <td className="p-3 text-muted-foreground">{v.category}</td>
                      <td className="p-3">
                        <span className="flex items-center gap-1 font-semibold text-amber-500 font-mono">
                          <Star size={12} fill="#f59e0b" /> {v.rating}
                        </span>
                      </td>
                      <td className="p-3 text-center">
                        <button
                          onClick={() => handleOpenEditModal(v)}
                          className="px-2.5 py-1 bg-secondary hover:bg-secondary/80 text-foreground border border-border rounded-lg text-[10px] font-bold transition flex items-center gap-1 mx-auto"
                        >
                          <Edit3 size={11} /> Edit
                        </button>
                      </td>
                    </tr>
                  ))}
                  {vendorsList.length === 0 && (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-xs text-muted-foreground">No records.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          ) : (
            /* Pending / Active / Rejected Vendors rosters */
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-secondary/40 select-none border-b border-border/60">
                  <tr>
                    <th className="p-3 font-semibold text-muted-foreground">Vendor Store</th>
                    <th className="p-3 font-semibold text-muted-foreground">Pincode & Location</th>
                    <th className="p-3 font-semibold text-muted-foreground">Contact</th>
                    <th className="p-3 font-semibold text-muted-foreground">Category Segment</th>
                    <th className="p-3 font-semibold text-muted-foreground text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {currentVendors.map(v => (
                    <tr key={v.id} className="hover:bg-secondary/10 transition-colors">
                      <td className="p-3">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-foreground block">{v.name}</span>
                          {v.verifiedBadge && (
                            <span className="text-[9px] bg-indigo-500/10 text-indigo-500 border border-indigo-500/20 px-1 rounded font-bold">Verified</span>
                          )}
                        </div>
                        <span className="text-[10px] text-muted-foreground font-mono block">ID: {v.id} • Rep: {v.contact}</span>
                      </td>
                      <td className="p-3">
                        <span className="inline-flex items-center gap-1 font-mono font-bold text-primary bg-primary/10 border border-primary/20 px-2 py-0.5 rounded-lg text-[11px]">
                          <MapPin size={11} className="text-primary shrink-0" />
                          {v.pincode || 'PIN NOT SET'}
                        </span>
                        <span className="text-[10px] text-muted-foreground block mt-0.5 truncate max-w-[160px]" title={v.address}>
                          {[v.mandal, v.district, v.state].filter(Boolean).join(', ') || v.address || 'Location pending'}
                        </span>
                      </td>
                      <td className="p-3 text-muted-foreground">
                        <span className="block">{v.mobile || v.contact}</span>
                        {v.email && <span className="text-[10px] text-muted-foreground/80 block truncate max-w-[120px]">{v.email}</span>}
                      </td>
                      <td className="p-3 text-muted-foreground">
                        <span className="font-medium text-foreground block">{v.category}</span>
                        {v.subCategory && <span className="text-[10px] text-muted-foreground block">{v.subCategory}</span>}
                      </td>
                      <td className="p-3 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => {
                              setSelectedVendor(v);
                              setRemarks('');
                              setShowRemarksInput(false);
                            }}
                            className="px-2.5 py-1 bg-secondary hover:bg-secondary/80 border border-border text-foreground rounded-lg text-[10px] font-bold transition-all cursor-pointer"
                          >
                            Manage
                          </button>
                          <button
                            onClick={() => handleOpenEditModal(v)}
                            className="px-2.5 py-1 bg-primary/10 hover:bg-primary text-primary hover:text-white border border-primary/20 rounded-lg text-[10px] font-bold transition-all flex items-center gap-1 cursor-pointer"
                            title="Edit Vendor Profile"
                          >
                            <Edit3 size={11} /> Edit Profile
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {currentVendors.length === 0 && (
                    <tr>
                      <td colSpan={5} className="p-12 text-center text-xs text-muted-foreground border-t">
                        No stores found matching this category or filter.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Right Column: Performance Analytics Chart & logs */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-card border border-border/80 rounded-2xl p-5 shadow-sm space-y-4">
            <div>
              <span className="text-xs font-bold text-foreground uppercase tracking-wider block">Fulfillment Index</span>
              <p className="text-[9px] text-muted-foreground mt-0.5">Order completed count per merchant</p>
            </div>

            {performanceData.length === 0 ? (
              <div className="h-44 flex flex-col items-center justify-center text-center text-xs text-muted-foreground bg-secondary/5 border border-border/40 rounded-xl">
                <Store size={20} className="text-muted-foreground/45 mb-1" />
                <p>No sales activity found.</p>
              </div>
            ) : (
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
                    <Bar dataKey="fulfillment" name="Completed Orders" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          <div className="bg-card border border-border/80 rounded-2xl p-5 shadow-sm space-y-4">
            <span className="text-xs font-bold text-foreground uppercase tracking-wider block flex items-center gap-1.5 select-none">
              <Activity size={14} className="text-primary" /> Vendor Activity logs
            </span>
            <div className="divide-y divide-border/60 max-h-48 overflow-y-auto no-scrollbar pr-1">
              {vendorActivityLogs.map((log, index) => (
                <div key={index} className="py-2.5 first:pt-0 last:pb-0 text-xs">
                  <div className="flex justify-between items-center font-semibold text-foreground">
                    <span>{log.action}</span>
                    <span className="text-[8px] text-muted-foreground font-mono">{log.timestamp ? log.timestamp.split('T')[0] : 'Just now'}</span>
                  </div>
                  <span className="text-[10px] text-muted-foreground block mt-0.5">{log.details}</span>
                </div>
              ))}
              {vendorActivityLogs.length === 0 && (
                <p className="text-center text-xs text-muted-foreground py-6 select-none">No vendor activity logs found.</p>
              )}
            </div>
          </div>
        </div>

      </div>

      {/* Vendor Details Audit Modal */}
      {selectedVendor && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-card border border-border max-w-5xl w-full max-h-[90vh] rounded-2xl overflow-hidden shadow-2xl flex flex-col text-xs text-foreground">

            {/* Modal Header */}
            <div className="flex items-center justify-between p-5 border-b border-border bg-muted/30">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-primary/10 rounded-xl text-primary font-bold">
                  <Store size={22} />
                </div>
                <div className="text-left">
                  <h3 className="text-base font-black text-foreground uppercase tracking-wide">
                    Vendor Storefront Audit & Governance Deck
                  </h3>
                  <p className="text-xs text-muted-foreground flex items-center gap-2">
                    <span>{selectedVendor.name} • Representative: {selectedVendor.contact}</span>
                    <span className="inline-flex items-center gap-1 font-mono font-bold text-primary bg-primary/10 px-2 py-0.5 rounded text-[10px]">
                      <MapPin size={10} /> PIN: {selectedVendor.pincode || 'Not Set'}
                    </span>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleOpenEditModal(selectedVendor)}
                  className="px-3 py-1.5 bg-primary text-primary-foreground font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-sm hover:bg-primary/90 transition cursor-pointer"
                >
                  <Edit3 size={13} /> Edit Profile
                </button>
                <span className={`px-3 py-1 rounded-full text-xs font-extrabold uppercase ${selectedVendor.status === 'Active'
                  ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"
                  : "bg-amber-500/10 text-amber-500 border border-amber-500/20"
                  }`}>
                  {selectedVendor.status}
                </span>
                <button
                  onClick={() => {
                    setSelectedVendor(null);
                    setShowRemarksInput(false);
                    setRemarks('');
                  }}
                  className="p-2 bg-secondary hover:bg-secondary/80 text-foreground font-bold rounded-xl border border-border/40 transition-all cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-5 overflow-y-auto flex-1 text-left">
              {/* Summary Identity Card */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-secondary/15 p-4 rounded-xl border border-border/40">
                <div>
                  <span className="text-muted-foreground block text-[9px] font-bold">BUSINESS NAME</span>
                  <span className="font-semibold block mt-0.5">{selectedVendor.name}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[9px] font-bold">OWNER NAME</span>
                  <span className="font-semibold block mt-0.5 truncate">{selectedVendor.contact}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[9px] font-bold">CATEGORY</span>
                  <span className="font-semibold block mt-0.5">{selectedVendor.category}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[9px] font-bold">STORE ID</span>
                  <span className="font-mono font-semibold block mt-0.5">{selectedVendor.id}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[9px] font-bold">PHONE / MOBILE</span>
                  <span className="font-mono font-semibold block mt-0.5">{selectedVendor.mobile || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[9px] font-bold">EMAIL</span>
                  <span className="font-semibold block mt-0.5 truncate">{selectedVendor.email || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[9px] font-bold">GSTIN</span>
                  <span className="font-mono font-semibold block mt-0.5">{selectedVendor.gstNumber || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[9px] font-bold">PAN</span>
                  <span className="font-mono font-semibold block mt-0.5">{selectedVendor.panNumber || 'N/A'}</span>
                </div>
              </div>

              {/* Geographic Location & Pincode Card */}
              <div className="bg-primary/5 p-4 rounded-xl border border-primary/20 space-y-2">
                <div className="flex items-center justify-between border-b border-primary/15 pb-2">
                  <h4 className="font-bold text-primary flex items-center gap-1.5 text-xs">
                    <MapPin size={14} /> Geographical Territory & Pincode
                  </h4>
                  <span className="font-mono font-black text-sm text-primary bg-primary/10 border border-primary/30 px-2.5 py-0.5 rounded-lg">
                    PINCODE: {selectedVendor.pincode || 'NOT CONFIGURED'}
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
                  <div className="sm:col-span-2">
                    <span className="text-muted-foreground block text-[9px] font-bold">FULL ADDRESS</span>
                    <span className="font-medium text-foreground block mt-0.5 leading-relaxed">
                      {selectedVendor.address || 'No street address provided.'}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-[9px] font-bold">MANDAL / LOCALITY</span>
                    <span className="font-semibold block mt-0.5">{selectedVendor.mandal || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-[9px] font-bold">DISTRICT & STATE</span>
                    <span className="font-semibold block mt-0.5">
                      {[selectedVendor.district, selectedVendor.state].filter(Boolean).join(', ') || 'N/A'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Hyperlocal Store Parameters */}
              <div className="space-y-2 bg-secondary/10 p-4 rounded-xl border border-border/40">
                <h4 className="font-bold text-foreground">Hyperlocal Store Parameters</h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <span className="text-muted-foreground block text-[9px]">FSSAI License</span>
                    <span className="font-semibold block mt-0.5">{selectedVendor.fssaiNumber || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-[9px]">Geographic GPS Coordinates</span>
                    <span className="font-semibold font-mono block mt-0.5">
                      {selectedVendor.location?.coordinates
                        ? `[${selectedVendor.location.coordinates[0].toFixed(5)}, ${selectedVendor.location.coordinates[1].toFixed(5)}]`
                        : 'Not Set'}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-[9px]">Marketplace Listing Status</span>
                    <span className={`font-bold block mt-0.5 ${selectedVendor.marketplaceStatus === 'Approved' ? 'text-emerald-500' : 'text-amber-500'
                      }`}>
                      {selectedVendor.marketplaceStatus}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-[9px]">Verified Store Badge</span>
                    <span className="font-semibold block mt-0.5">
                      {selectedVendor.verifiedBadge ? '✅ Granted (Verified Badge)' : '❌ Not Granted'}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-[9px]">Delivery Mode</span>
                    <span className="font-semibold block mt-0.5 capitalize">{selectedVendor.deliveryMode || 'platform_delivery'}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-[9px]">Delivery Radius</span>
                    <span className="font-semibold font-mono block mt-0.5">{selectedVendor.deliveryRadiusKm || 5} km</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-[9px]">Min Order / Charge</span>
                    <span className="font-semibold font-mono block mt-0.5">₹{selectedVendor.minOrder || 100} (Fee: ₹{selectedVendor.deliveryCharge || 20})</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-[9px]">Live Status</span>
                    <span className="font-semibold block mt-0.5 capitalize text-emerald-500 font-mono">🟢 {selectedVendor.liveStatus || 'open'}</span>
                  </div>
                </div>
              </div>

              {/* Dynamic Category & Subcategories Management (Interactive Admin Governance) */}
              <div className="bg-primary/5 p-4 rounded-xl border border-primary/20 space-y-3">
                <div className="flex items-center justify-between border-b border-primary/15 pb-2">
                  <h4 className="font-extrabold text-primary text-xs uppercase tracking-wide flex items-center gap-1.5">
                    🏷️ Category & Permitted Subcategories Governance
                  </h4>
                  <button
                    type="button"
                    onClick={handleSaveCategoryGovernance}
                    disabled={actionLoading}
                    className="px-3 py-1 bg-primary hover:bg-primary/90 text-white font-bold text-[10px] rounded-lg shadow-sm disabled:opacity-50 transition cursor-pointer"
                  >
                    {actionLoading ? 'Saving...' : 'Save Category Governance'}
                  </button>
                </div>

                <div className="space-y-3">
                  {/* Primary Category Selector Tabs */}
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase block">
                      Primary Business Category (Click to change)
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {parentCategories.map((cat: any) => {
                        const isCatSelected = (selectedParentCatId || activeParentCat?._id) === cat._id;
                        return (
                          <button
                            key={cat._id}
                            type="button"
                            onClick={() => setSelectedParentCatId(cat._id)}
                            className={`px-2.5 py-1 rounded-lg font-bold text-[10px] transition-all border cursor-pointer ${isCatSelected
                              ? "bg-primary text-primary-foreground border-primary shadow-sm"
                              : "bg-card text-muted-foreground border-border hover:border-primary/40"
                              }`}
                          >
                            {cat.name}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Toggle Subcategories Interactive Chip Grid */}
                  <div className="space-y-1.5 pt-2 border-t border-primary/15">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-muted-foreground uppercase block">
                        Approved Subcategories for ({activeParentCat?.name || "Selected Category"}):
                      </span>
                      <span className="text-[9px] text-muted-foreground">Click chip to toggle ON / OFF</span>
                    </div>

                    {currentSubCategories.length > 0 ? (
                      <div className="flex flex-wrap gap-1.5">
                        {currentSubCategories.map((subCat: any) => {
                          const isSubSelected = editingSubcategories.includes(subCat.name);
                          return (
                            <button
                              key={subCat._id}
                              type="button"
                              onClick={() => {
                                if (isSubSelected) {
                                  setEditingSubcategories(prev => prev.filter(s => s !== subCat.name));
                                } else {
                                  setEditingSubcategories(prev => [...prev, subCat.name]);
                                }
                              }}
                              className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all border flex items-center gap-1 cursor-pointer ${isSubSelected
                                ? "bg-emerald-600 text-white border-emerald-600 shadow-sm"
                                : "bg-card text-foreground border-border/80 hover:bg-primary/5"
                                }`}
                            >
                              <span>{isSubSelected ? "✓" : "+"}</span>
                              <span>{subCat.name}</span>
                            </button>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="p-2 bg-card border border-dashed border-primary/20 rounded-lg text-[10px] text-muted-foreground text-center">
                        No subcategories in DB for this category. Add custom below.
                      </div>
                    )}

                    {/* Inline Add Custom Subcategory Pill Input */}
                    <div className="pt-1 flex items-center gap-1.5">
                      <input
                        type="text"
                        value={newSubCategoryName}
                        onChange={(e) => setNewSubCategoryName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            handleAddSubcategory(newSubCategoryName);
                          }
                        }}
                        placeholder="Add custom subcategory..."
                        className="flex-1 px-2.5 py-1 bg-card border border-primary/30 rounded-lg text-[10px] outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => handleAddSubcategory(newSubCategoryName)}
                        disabled={!newSubCategoryName.trim()}
                        className="px-2.5 py-1 bg-primary text-white font-bold text-[10px] rounded-lg disabled:opacity-50 transition cursor-pointer"
                      >
                        + Add
                      </button>
                    </div>
                  </div>
                </div>

                {/* Selected Subcategories Badges */}
                <div className="pt-2 border-t border-primary/15 flex flex-wrap items-center gap-1">
                  <span className="text-[10px] font-bold text-foreground mr-1">Permitted Subcategories ({editingSubcategories.length}):</span>
                  {editingSubcategories.map((sub, idx) => (
                    <span key={idx} className="inline-flex items-center gap-1 px-2 py-0.5 bg-card border border-primary/30 text-primary font-bold text-[10px] rounded-md">
                      <span>{sub}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveSubcategory(idx)}
                        className="text-rose-500 hover:text-rose-700"
                      >
                        ✕
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              {/* Tags & Services */}
              {(selectedVendor.storeTags?.length > 0 || selectedVendor.storeServices?.length > 0) && (
                <div className="space-y-2.5 bg-secondary/10 p-4 rounded-xl border border-border/40">
                  <h4 className="font-bold text-foreground">Discoverability and Services</h4>
                  <div className="space-y-1.5">
                    {selectedVendor.storeServices?.length > 0 && (
                      <div>
                        <span className="text-[10px] text-muted-foreground block">Offered Services</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {selectedVendor.storeServices.map((s: string) => (
                            <span key={s} className="bg-primary/5 border border-primary/10 text-primary rounded px-2 py-0.5 text-[9px] font-medium">{s}</span>
                          ))}
                        </div>
                      </div>
                    )}
                    {selectedVendor.storeTags?.length > 0 && (
                      <div>
                        <span className="text-[10px] text-muted-foreground block">Merchant Tags</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {selectedVendor.storeTags.map((t: string) => (
                            <span key={t} className="bg-muted border rounded px-2 py-0.5 text-[9px] font-medium text-muted-foreground">#{t}</span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Custom Branding & Policies */}
              <div className="space-y-3.5 bg-secondary/10 p-4 rounded-xl border border-border/40">
                <h4 className="font-bold text-foreground">Branding Details & Store Policies</h4>
                <div className="space-y-2">
                  <div>
                    <span className="text-[10px] text-muted-foreground block font-bold">STORE DESCRIPTION</span>
                    <p className="text-foreground/90 font-medium leading-relaxed mt-0.5">{selectedVendor.storeDesign?.description || 'No description provided.'}</p>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 border-t border-border/30 pt-2">
                    <div>
                      <span className="text-[9px] text-muted-foreground block font-bold">RETURNS & REFUNDS POLICY</span>
                      <p className="text-foreground/80 font-medium mt-0.5 leading-normal">{selectedVendor.refundPolicy || 'No custom refund policy.'}</p>
                    </div>
                    <div>
                      <span className="text-[9px] text-muted-foreground block font-bold">REPLACEMENT POLICY</span>
                      <p className="text-foreground/80 font-medium mt-0.5 leading-normal">{selectedVendor.replacementPolicy || 'No custom replacement policy.'}</p>
                    </div>
                    <div className="sm:col-span-2">
                      <span className="text-[9px] text-muted-foreground block font-bold">DELIVERY POLICY</span>
                      <p className="text-foreground/80 font-medium mt-0.5 leading-normal">{selectedVendor.storeDesign?.deliveryPolicy || 'No custom delivery policy.'}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Listed Products Catalog Section */}
              <div className="bg-secondary/15 p-4 rounded-xl border border-border/40 space-y-3">
                <div className="flex items-center justify-between border-b border-border/60 pb-2">
                  <h4 className="font-extrabold text-foreground text-xs uppercase tracking-wide flex items-center gap-2">
                    📦 Vendor Listed Products ({vendorProducts.length})
                  </h4>
                  <span className="text-[10px] text-muted-foreground font-semibold">
                    Products in Vendor Catalog
                  </span>
                </div>

                {productsLoading ? (
                  <div className="p-6 text-center text-xs text-muted-foreground">
                    Loading vendor product catalog...
                  </div>
                ) : vendorProducts.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 max-h-60 overflow-y-auto pr-1">
                    {vendorProducts.map((p: any) => (
                      <div key={p._id || p.id} className="p-3 bg-card border border-border/60 rounded-xl flex gap-3 items-center shadow-sm">
                        <div className="w-12 h-12 bg-secondary rounded-lg overflow-hidden shrink-0 flex items-center justify-center font-bold text-muted-foreground text-lg">
                          {p.thumbnail || p.images?.[0] ? (
                            <img src={p.thumbnail || p.images[0]} alt={p.name} className="w-full h-full object-cover" />
                          ) : (
                            "📦"
                          )}
                        </div>
                        <div className="overflow-hidden text-xs text-left">
                          <span className="font-bold text-foreground block truncate">{p.name}</span>
                          <span className="text-[10px] text-muted-foreground font-mono block truncate">SKU: {p.sku || 'Auto'}</span>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="font-extrabold text-primary">₹{p.baseSellingPrice || p.sellingPrice || 0}</span>
                            <span className="text-[10px] text-muted-foreground font-semibold">Stock: {p.stock || p.inventory || 0}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 bg-card border border-dashed border-border/60 rounded-xl text-center text-xs text-muted-foreground">
                    No products listed by this vendor yet.
                  </div>
                )}
              </div>

              {/* Gallery Images List */}
              {selectedVendor.gallery?.length > 0 && (
                <div className="space-y-2 bg-secondary/10 p-4 rounded-xl border border-border/40">
                  <h4 className="font-bold text-foreground">Premises Photo Gallery</h4>
                  <div className="grid grid-cols-4 gap-2">
                    {selectedVendor.gallery.map((img: string, idx: number) => (
                      <div key={idx} className="h-14 rounded-lg overflow-hidden border border-border bg-muted">
                        <img src={img} alt={`Gallery ${idx + 1}`} className="h-full w-full object-cover" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Listing Approval Controls */}
              <div className="space-y-2 bg-secondary/15 p-4 rounded-xl border border-border/45">
                <h4 className="font-bold text-foreground">Marketplace Listing Actions</h4>

                <div className="grid grid-cols-2 gap-2 mt-1.5">
                  <button
                    onClick={() => handleUpdateVendorMarketplace(selectedVendor.userId, { marketplaceStatus: 'Approved' })}
                    disabled={actionLoading}
                    className="py-2 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white rounded-xl font-bold text-center cursor-pointer shadow-sm transition"
                  >
                    Approve Store Listing
                  </button>
                  <button
                    onClick={() => handleUpdateVendorMarketplace(selectedVendor.userId, { marketplaceStatus: 'Rejected' })}
                    disabled={actionLoading}
                    className="py-2 bg-rose-500 hover:bg-rose-600 disabled:opacity-50 text-white rounded-xl font-bold text-center cursor-pointer shadow-sm transition"
                  >
                    Reject Store Listing
                  </button>

                  <button
                    onClick={() => handleUpdateVendorMarketplace(selectedVendor.userId, { verifiedBadge: !selectedVendor.verifiedBadge })}
                    disabled={actionLoading}
                    className="col-span-2 py-2 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950 dark:hover:bg-indigo-900 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-850 rounded-xl font-bold text-center cursor-pointer transition"
                  >
                    {selectedVendor.verifiedBadge ? 'Revoke Verified Badge' : 'Grant Verified Badge'}
                  </button>
                </div>
              </div>

              {showRemarksInput ? (
                <div className="space-y-2 pt-2 border-t border-border/40">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Remarks Reason</label>
                  <textarea
                    placeholder="Enter reason for this action..."
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
                    className="w-full text-xs p-2.5 border border-border rounded-xl bg-secondary/10 outline-none h-16 text-foreground"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleUpdateVendorStatus(selectedVendor.userId, 'suspended')}
                      disabled={actionLoading}
                      className="w-full py-2 bg-rose-500 hover:bg-rose-600 text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
                    >
                      {actionLoading ? 'Processing...' : 'Confirm Suspend'}
                    </button>
                    <button
                      onClick={() => handleUpdateVendorStatus(selectedVendor.userId, 'blocked')}
                      disabled={actionLoading}
                      className="w-full py-2 bg-red-600 hover:bg-red-750 text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
                    >
                      {actionLoading ? 'Processing...' : 'Confirm Block'}
                    </button>
                  </div>
                  <button
                    onClick={() => setShowRemarksInput(false)}
                    className="w-full py-1.5 bg-secondary hover:bg-secondary/80 text-foreground border border-border rounded-xl text-[10px] font-bold transition-all cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <div className="space-y-2.5 pt-2 border-t border-border/40">
                  {selectedVendor.rawStatus !== 'active' ? (
                    <div className="flex flex-col gap-2">
                      <button
                        onClick={() => handleUpdateVendorStatus(selectedVendor.userId, 'active')}
                        disabled={actionLoading}
                        className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-md transition-all cursor-pointer"
                      >
                        {actionLoading ? 'Activating...' : 'Activate Vendor Account'}
                      </button>
                      {(selectedVendor.rawStatus === 'pending_verification' || selectedVendor.rawStatus === 'pending') && (
                        <button
                          onClick={() => handleUpdateVendorStatus(selectedVendor.userId, 'rejected')}
                          disabled={actionLoading}
                          className="w-full py-2 bg-red-600/10 hover:bg-red-600/25 border border-red-600/20 text-red-500 font-semibold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                        >
                          {actionLoading ? 'Rejecting...' : 'Reject Vendor Application'}
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <button
                        onClick={() => setShowRemarksInput(true)}
                        disabled={actionLoading}
                        className="w-full py-2 bg-rose-500/10 hover:bg-rose-500/25 border border-rose-500/20 text-rose-500 font-semibold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                      >
                        Suspend Vendor
                      </button>
                      <button
                        onClick={() => {
                          setRemarks('Account blocked due to policy violation');
                          setShowRemarksInput(true);
                        }}
                        disabled={actionLoading}
                        className="w-full py-2 bg-red-600/10 hover:bg-red-600/25 border border-red-600/20 text-red-500 font-semibold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                      >
                        Block Vendor
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Edit Vendor Profile Modal */}
      {isEditModalOpen && editingVendorData && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-card border border-border max-w-4xl w-full max-h-[92vh] rounded-2xl overflow-hidden shadow-2xl flex flex-col text-xs text-foreground">

            {/* Modal Header */}
            <div className="flex items-center justify-between p-5 border-b border-border bg-muted/30">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-primary/10 rounded-xl text-primary font-bold">
                  <Edit3 size={20} />
                </div>
                <div>
                  <h3 className="text-base font-black text-foreground uppercase tracking-wide flex items-center gap-2">
                    Edit Vendor Profile <span className="text-xs font-mono font-normal text-muted-foreground">({editingVendorData.businessName})</span>
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Admin Profile Master Editor • Update PIN, Address, Identity & Store Parameters
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="p-2 bg-secondary hover:bg-secondary/80 text-foreground font-bold rounded-xl border border-border/40 transition cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Subtabs within Edit Modal */}
            <div className="flex border-b border-border bg-secondary/20 px-5 gap-2 overflow-x-auto select-none">
              {[
                { id: 'basic', label: '1. Store Identity & Rep', icon: Building },
                { id: 'location', label: '2. Pincode & Address', icon: MapPin },
                { id: 'operations', label: '3. Delivery & Operations', icon: Truck },
                { id: 'policies', label: '4. Policies & Description', icon: FileText },
                { id: 'governance', label: '5. Status & Governance', icon: ShieldCheck },
              ].map(t => {
                const IconComponent = t.icon;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setEditTab(t.id as any)}
                    className={`py-3 px-3.5 border-b-2 text-xs font-bold flex items-center gap-1.5 transition-all whitespace-nowrap cursor-pointer ${editTab === t.id
                      ? 'border-primary text-primary bg-primary/5'
                      : 'border-transparent text-muted-foreground hover:text-foreground hover:bg-secondary/40'
                      }`}
                  >
                    <IconComponent size={14} />
                    {t.label}
                  </button>
                );
              })}
            </div>

            {/* Edit Form */}
            <form onSubmit={handleSaveVendorProfile} className="flex-1 overflow-y-auto p-6 space-y-6">

              {/* Tab 1: Basic Identity */}
              {editTab === 'basic' && (
                <div className="space-y-4">
                  <div className="bg-primary/5 border border-primary/20 p-3 rounded-xl">
                    <span className="text-xs font-bold text-primary block">Business & Representative Details</span>
                    <span className="text-[10px] text-muted-foreground block">Update vendor company name, owner name, and contact details.</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-muted-foreground uppercase">Store / Business Name *</label>
                      <input
                        type="text"
                        required
                        value={editingVendorData.businessName}
                        onChange={(e) => setEditingVendorData({ ...editingVendorData, businessName: e.target.value })}
                        className="w-full p-2.5 bg-secondary/30 border border-border rounded-xl text-xs outline-none focus:border-primary font-semibold text-foreground"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-muted-foreground uppercase">Owner / Representative Name *</label>
                      <input
                        type="text"
                        required
                        value={editingVendorData.ownerName}
                        onChange={(e) => setEditingVendorData({ ...editingVendorData, ownerName: e.target.value })}
                        className="w-full p-2.5 bg-secondary/30 border border-border rounded-xl text-xs outline-none focus:border-primary font-semibold text-foreground"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-muted-foreground uppercase">Contact Mobile / Phone *</label>
                      <div className="relative">
                        <Phone size={14} className="absolute left-3 top-3 text-muted-foreground" />
                        <input
                          type="text"
                          required
                          value={editingVendorData.mobile}
                          onChange={(e) => setEditingVendorData({ ...editingVendorData, mobile: e.target.value })}
                          className="w-full pl-9 pr-3 py-2.5 bg-secondary/30 border border-border rounded-xl text-xs outline-none focus:border-primary font-mono font-semibold text-foreground"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-muted-foreground uppercase">WhatsApp Number</label>
                      <div className="relative">
                        <Phone size={14} className="absolute left-3 top-3 text-muted-foreground" />
                        <input
                          type="text"
                          placeholder="Optional WhatsApp contact"
                          value={editingVendorData.whatsappNumber}
                          onChange={(e) => setEditingVendorData({ ...editingVendorData, whatsappNumber: e.target.value })}
                          className="w-full pl-9 pr-3 py-2.5 bg-secondary/30 border border-border rounded-xl text-xs outline-none focus:border-primary font-mono text-foreground"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-muted-foreground uppercase">Official Email Address *</label>
                      <div className="relative">
                        <Mail size={14} className="absolute left-3 top-3 text-muted-foreground" />
                        <input
                          type="email"
                          required
                          value={editingVendorData.email}
                          onChange={(e) => setEditingVendorData({ ...editingVendorData, email: e.target.value })}
                          className="w-full pl-9 pr-3 py-2.5 bg-secondary/30 border border-border rounded-xl text-xs outline-none focus:border-primary text-foreground"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-muted-foreground uppercase">Store Type</label>
                      <select
                        value={editingVendorData.storeType}
                        onChange={(e) => setEditingVendorData({ ...editingVendorData, storeType: e.target.value })}
                        className="w-full p-2.5 bg-secondary/30 border border-border rounded-xl text-xs outline-none focus:border-primary text-foreground"
                      >
                        <option value="grocery">Grocery & Essentials</option>
                        <option value="retail">Retail & General</option>
                        <option value="restaurant">Restaurant & Food</option>
                        <option value="devotional">Devotional & Pooja</option>
                        <option value="service">Service & Repair</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-muted-foreground uppercase">GSTIN (GST Number)</label>
                      <input
                        type="text"
                        placeholder="e.g. 36AABCU9603R1ZM"
                        value={editingVendorData.gstNumber}
                        onChange={(e) => setEditingVendorData({ ...editingVendorData, gstNumber: e.target.value.toUpperCase() })}
                        className="w-full p-2.5 bg-secondary/30 border border-border rounded-xl text-xs outline-none focus:border-primary font-mono text-foreground"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-muted-foreground uppercase">PAN Card Number</label>
                      <input
                        type="text"
                        placeholder="e.g. ABCDE1234F"
                        value={editingVendorData.panNumber}
                        onChange={(e) => setEditingVendorData({ ...editingVendorData, panNumber: e.target.value.toUpperCase() })}
                        className="w-full p-2.5 bg-secondary/30 border border-border rounded-xl text-xs outline-none focus:border-primary font-mono text-foreground"
                      />
                    </div>

                    <div className="space-y-1 sm:col-span-2">
                      <label className="text-[10px] font-bold text-muted-foreground uppercase">FSSAI License Number</label>
                      <input
                        type="text"
                        placeholder="e.g. 10020042000001"
                        value={editingVendorData.fssaiNumber}
                        onChange={(e) => setEditingVendorData({ ...editingVendorData, fssaiNumber: e.target.value })}
                        className="w-full p-2.5 bg-secondary/30 border border-border rounded-xl text-xs outline-none focus:border-primary font-mono text-foreground"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 2: Pincode & Location */}
              {editTab === 'location' && (
                <div className="space-y-4">
                  <div className="bg-emerald-500/10 border border-emerald-500/20 p-3 rounded-xl flex items-center gap-2">
                    <MapPin className="text-emerald-500 shrink-0" size={18} />
                    <div>
                      <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 block">
                        Geographical Address & Hyperlocal Pincode
                      </span>
                      <span className="text-[10px] text-muted-foreground block">
                        Configure the exact PIN code and address coordinates used for customer proximity matching.
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1 sm:col-span-2">
                      <label className="text-[10px] font-bold text-muted-foreground uppercase">Store / Building Address *</label>
                      <textarea
                        rows={2}
                        required
                        placeholder="Shop No, Street, Landmark, Area..."
                        value={editingVendorData.address}
                        onChange={(e) => setEditingVendorData({ ...editingVendorData, address: e.target.value })}
                        className="w-full p-2.5 bg-secondary/30 border border-border rounded-xl text-xs outline-none focus:border-primary text-foreground"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-primary uppercase flex items-center gap-1">
                        📮 Postal PIN Code * (Hyperlocal Dispatch Key)
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. 500081"
                        maxLength={6}
                        value={editingVendorData.pincode}
                        onChange={(e) => setEditingVendorData({ ...editingVendorData, pincode: e.target.value.trim() })}
                        className="w-full p-2.5 bg-primary/10 border-2 border-primary/40 focus:border-primary rounded-xl text-sm font-black font-mono text-primary outline-none"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-muted-foreground uppercase">Mandal / Locality / Tehsil</label>
                      <input
                        type="text"
                        placeholder="e.g. Madhapur"
                        value={editingVendorData.mandal}
                        onChange={(e) => setEditingVendorData({ ...editingVendorData, mandal: e.target.value })}
                        className="w-full p-2.5 bg-secondary/30 border border-border rounded-xl text-xs outline-none focus:border-primary text-foreground"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-muted-foreground uppercase">District</label>
                      <input
                        type="text"
                        placeholder="e.g. Hyderabad"
                        value={editingVendorData.district}
                        onChange={(e) => setEditingVendorData({ ...editingVendorData, district: e.target.value })}
                        className="w-full p-2.5 bg-secondary/30 border border-border rounded-xl text-xs outline-none focus:border-primary text-foreground"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-muted-foreground uppercase">State</label>
                      <input
                        type="text"
                        placeholder="e.g. Telangana"
                        value={editingVendorData.state}
                        onChange={(e) => setEditingVendorData({ ...editingVendorData, state: e.target.value })}
                        className="w-full p-2.5 bg-secondary/30 border border-border rounded-xl text-xs outline-none focus:border-primary text-foreground"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-muted-foreground uppercase">Village / Sub-area</label>
                      <input
                        type="text"
                        placeholder="e.g. Hitec City"
                        value={editingVendorData.village}
                        onChange={(e) => setEditingVendorData({ ...editingVendorData, village: e.target.value })}
                        className="w-full p-2.5 bg-secondary/30 border border-border rounded-xl text-xs outline-none focus:border-primary text-foreground"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-muted-foreground uppercase">GPS Latitude & Longitude</label>
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="number"
                          step="any"
                          placeholder="Latitude"
                          value={editingVendorData.latitude}
                          onChange={(e) => setEditingVendorData({ ...editingVendorData, latitude: e.target.value })}
                          className="w-full p-2 bg-secondary/30 border border-border rounded-xl text-xs font-mono outline-none text-foreground"
                        />
                        <input
                          type="number"
                          step="any"
                          placeholder="Longitude"
                          value={editingVendorData.longitude}
                          onChange={(e) => setEditingVendorData({ ...editingVendorData, longitude: e.target.value })}
                          className="w-full p-2 bg-secondary/30 border border-border rounded-xl text-xs font-mono outline-none text-foreground"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 3: Delivery & Operations */}
              {editTab === 'operations' && (
                <div className="space-y-4">
                  <div className="bg-primary/5 border border-primary/20 p-3 rounded-xl">
                    <span className="text-xs font-bold text-primary block">Hyperlocal Fulfillment & Delivery Settings</span>
                    <span className="text-[10px] text-muted-foreground block">Set delivery radius, charges, minimum order value and store category.</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-muted-foreground uppercase">Primary Category</label>
                      <input
                        type="text"
                        value={editingVendorData.category}
                        onChange={(e) => setEditingVendorData({ ...editingVendorData, category: e.target.value })}
                        className="w-full p-2.5 bg-secondary/30 border border-border rounded-xl text-xs outline-none focus:border-primary text-foreground font-semibold"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-muted-foreground uppercase">Subcategory</label>
                      <input
                        type="text"
                        value={editingVendorData.subCategory}
                        onChange={(e) => setEditingVendorData({ ...editingVendorData, subCategory: e.target.value })}
                        className="w-full p-2.5 bg-secondary/30 border border-border rounded-xl text-xs outline-none focus:border-primary text-foreground"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-muted-foreground uppercase">Delivery Mode</label>
                      <select
                        value={editingVendorData.deliveryMode}
                        onChange={(e) => setEditingVendorData({ ...editingVendorData, deliveryMode: e.target.value })}
                        className="w-full p-2.5 bg-secondary/30 border border-border rounded-xl text-xs outline-none focus:border-primary text-foreground"
                      >
                        <option value="platform_delivery">Platform Fleet Delivery</option>
                        <option value="self_delivery">Self Delivery by Vendor</option>
                        <option value="pickup_only">Store Pickup Only</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-muted-foreground uppercase">Delivery Radius (km)</label>
                      <input
                        type="number"
                        min="1"
                        max="50"
                        value={editingVendorData.deliveryRadiusKm}
                        onChange={(e) => setEditingVendorData({ ...editingVendorData, deliveryRadiusKm: e.target.value })}
                        className="w-full p-2.5 bg-secondary/30 border border-border rounded-xl text-xs font-mono outline-none focus:border-primary text-foreground"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-muted-foreground uppercase">Min Order Amount (₹)</label>
                      <input
                        type="number"
                        min="0"
                        value={editingVendorData.minOrder}
                        onChange={(e) => setEditingVendorData({ ...editingVendorData, minOrder: e.target.value })}
                        className="w-full p-2.5 bg-secondary/30 border border-border rounded-xl text-xs font-mono outline-none focus:border-primary text-foreground"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-muted-foreground uppercase">Delivery Charge (₹)</label>
                      <input
                        type="number"
                        min="0"
                        value={editingVendorData.deliveryCharge}
                        onChange={(e) => setEditingVendorData({ ...editingVendorData, deliveryCharge: e.target.value })}
                        className="w-full p-2.5 bg-secondary/30 border border-border rounded-xl text-xs font-mono outline-none focus:border-primary text-foreground"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-muted-foreground uppercase">Est. Delivery Minutes</label>
                      <input
                        type="number"
                        min="5"
                        max="180"
                        value={editingVendorData.estimatedDeliveryMinutes}
                        onChange={(e) => setEditingVendorData({ ...editingVendorData, estimatedDeliveryMinutes: e.target.value })}
                        className="w-full p-2.5 bg-secondary/30 border border-border rounded-xl text-xs font-mono outline-none focus:border-primary text-foreground"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-muted-foreground uppercase">Live Operational Status</label>
                      <select
                        value={editingVendorData.liveStatus}
                        onChange={(e) => setEditingVendorData({ ...editingVendorData, liveStatus: e.target.value })}
                        className="w-full p-2.5 bg-secondary/30 border border-border rounded-xl text-xs outline-none focus:border-primary text-foreground font-semibold"
                      >
                        <option value="open">🟢 Open (Taking Orders)</option>
                        <option value="busy">🟡 Busy (High Demand)</option>
                        <option value="closed">🔴 Closed</option>
                        <option value="temporarily_closed">⏸️ Temporarily Closed</option>
                        <option value="vacation">🏖️ Vacation</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 4: Description & Policies */}
              {editTab === 'policies' && (
                <div className="space-y-4">
                  <div className="bg-primary/5 border border-primary/20 p-3 rounded-xl">
                    <span className="text-xs font-bold text-primary block">Store Branding, Policies & Description</span>
                    <span className="text-[10px] text-muted-foreground block">Store public bio, refund and replacement conditions.</span>
                  </div>

                  <div className="space-y-3">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-muted-foreground uppercase">Store Description / Bio</label>
                      <textarea
                        rows={3}
                        placeholder="Describe merchant background, specialty products, certifications..."
                        value={editingVendorData.description}
                        onChange={(e) => setEditingVendorData({ ...editingVendorData, description: e.target.value })}
                        className="w-full p-2.5 bg-secondary/30 border border-border rounded-xl text-xs outline-none focus:border-primary text-foreground"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-muted-foreground uppercase">Returns & Refunds Policy</label>
                        <textarea
                          rows={2}
                          placeholder="Refund criteria, SLA..."
                          value={editingVendorData.refundPolicy}
                          onChange={(e) => setEditingVendorData({ ...editingVendorData, refundPolicy: e.target.value })}
                          className="w-full p-2.5 bg-secondary/30 border border-border rounded-xl text-xs outline-none focus:border-primary text-foreground"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-muted-foreground uppercase">Replacement Policy</label>
                        <textarea
                          rows={2}
                          placeholder="Replacement window..."
                          value={editingVendorData.replacementPolicy}
                          onChange={(e) => setEditingVendorData({ ...editingVendorData, replacementPolicy: e.target.value })}
                          className="w-full p-2.5 bg-secondary/30 border border-border rounded-xl text-xs outline-none focus:border-primary text-foreground"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-muted-foreground uppercase">Custom Delivery Policy</label>
                      <textarea
                        rows={2}
                        placeholder="Delivery hours and terms..."
                        value={editingVendorData.deliveryPolicy}
                        onChange={(e) => setEditingVendorData({ ...editingVendorData, deliveryPolicy: e.target.value })}
                        className="w-full p-2.5 bg-secondary/30 border border-border rounded-xl text-xs outline-none focus:border-primary text-foreground"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 5: Status & Governance */}
              {editTab === 'governance' && (
                <div className="space-y-4">
                  <div className="bg-amber-500/10 border border-amber-500/20 p-3 rounded-xl">
                    <span className="text-xs font-bold text-amber-600 dark:text-amber-400 block">Admin Account & Marketplace Controls</span>
                    <span className="text-[10px] text-muted-foreground block">Override account status, marketplace visibility, and verified merchant badges.</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-muted-foreground uppercase">Account Status</label>
                      <select
                        value={editingVendorData.status}
                        onChange={(e) => setEditingVendorData({ ...editingVendorData, status: e.target.value })}
                        className="w-full p-2.5 bg-secondary/30 border border-border rounded-xl text-xs outline-none focus:border-primary font-bold text-foreground"
                      >
                        <option value="active">Active (Verified)</option>
                        <option value="pending_verification">Pending Verification</option>
                        <option value="suspended">Suspended</option>
                        <option value="blocked">Blocked</option>
                        <option value="rejected">Rejected</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-muted-foreground uppercase">Marketplace Listing Status</label>
                      <select
                        value={editingVendorData.marketplaceStatus}
                        onChange={(e) => setEditingVendorData({ ...editingVendorData, marketplaceStatus: e.target.value })}
                        className="w-full p-2.5 bg-secondary/30 border border-border rounded-xl text-xs outline-none focus:border-primary font-bold text-foreground"
                      >
                        <option value="Approved">Approved (Public on Marketplace)</option>
                        <option value="Pending Review">Pending Review</option>
                        <option value="Incomplete">Incomplete</option>
                        <option value="Draft">Draft</option>
                        <option value="Rejected">Rejected</option>
                        <option value="Suspended">Suspended</option>
                        <option value="Hidden">Hidden</option>
                      </select>
                    </div>

                    <div className="sm:col-span-2 p-3 bg-secondary/20 rounded-xl border border-border/60 flex items-center justify-between">
                      <div>
                        <span className="font-bold text-foreground block">Grant Verified Merchant Badge</span>
                        <span className="text-[10px] text-muted-foreground block">Displays verified blue badge on storefront and products.</span>
                      </div>
                      <input
                        type="checkbox"
                        checked={editingVendorData.verifiedBadge}
                        onChange={(e) => setEditingVendorData({ ...editingVendorData, verifiedBadge: e.target.checked })}
                        className="w-5 h-5 accent-primary cursor-pointer"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Modal Footer Controls */}
              <div className="flex items-center justify-between pt-4 border-t border-border mt-6">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 bg-secondary hover:bg-secondary/80 text-foreground font-bold rounded-xl text-xs transition cursor-pointer"
                >
                  Cancel
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="submit"
                    disabled={actionLoading}
                    className="px-5 py-2.5 bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-md disabled:opacity-50 transition cursor-pointer"
                  >
                    <Save size={14} />
                    {actionLoading ? 'Saving Profile...' : 'Save Changes'}
                  </button>
                </div>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
};
