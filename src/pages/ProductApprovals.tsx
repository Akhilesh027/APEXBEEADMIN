import { useEffect, useState, useMemo } from 'react';
import {
  Search,
  Eye,
  CheckCircle,
  XCircle,
  IndianRupee,
  Store,
  Tags,
  Truck,
  Gift,
  Network,
  Landmark,
  ChevronLeft,
  ChevronRight,
  Zap,
  CheckSquare,
  Square,
  Filter,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Clock,
  Sparkles,
  ArrowRight,
  Layers,
  FolderTree,
  LayoutGrid,
  List,
  AlertCircle,
  ShoppingBag,
  Utensils,
  Coins
} from 'lucide-react';
import { productService } from '../services/productService';

interface CommissionShareInput {
  type: string;
  label: string;
  percent: number;
  amount?: number;
  isActive?: boolean;
}

const defaultShares: CommissionShareInput[] = [
  { type: 'state', label: 'State Franchise', percent: 2.5 },
  { type: 'district', label: 'District Franchise', percent: 5 },
  { type: 'mandal', label: 'Mandal Franchise', percent: 10 },
  { type: 'level1', label: 'Level 1 Referral', percent: 10 },
  { type: 'level2', label: 'Level 2 Referral', percent: 5 },
  { type: 'level3', label: 'Level 3 Referral', percent: 2.5 },
  { type: 'firstPurchase', label: 'First Purchase Reward', percent: 5 },
  { type: 'wishlink', label: 'WishLink Reward', percent: 5 },
];

const StatusBadge = ({ status }: any) => {
  const map: Record<string, string> = {
    Live: 'bg-emerald-500/10 text-emerald-600',
    Rejected: 'bg-rose-500/10 text-rose-600',
    'Awaiting Seller Approval': 'bg-indigo-500/10 text-indigo-600',
    'Negotiation Requested': 'bg-orange-500/10 text-orange-600',
    'Pending Review': 'bg-amber-500/10 text-amber-600',
    'Vendor Edited': 'bg-purple-500/10 text-purple-600',
    'Updated - Pending Approval': 'bg-purple-500/10 text-purple-600',
  };

  return (
    <span
      className={`px-2 py-1 rounded-lg text-[10px] font-bold ${
        map[status] || 'bg-secondary text-muted-foreground'
      }`}
    >
      {status}
    </span>
  );
};

const FormInput = ({ label, value, onChange, placeholder }: any) => (
  <div className="space-y-1">
    <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
      {label}
    </label>

    <input
      type="number"
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      className="w-full p-2.5 rounded-xl border border-border bg-background text-xs font-semibold outline-none focus:border-primary"
    />
  </div>
);

const SummaryCard = ({ title, value, icon: Icon, color = 'text-foreground' }: any) => (
  <div className="rounded-xl bg-card border border-border p-2.5">
    <div className="flex items-center gap-1.5 text-muted-foreground">
      {Icon && <Icon size={12} />}
      <p className="text-[9px] font-bold uppercase tracking-wider">{title}</p>
    </div>

    <b className={`block mt-1 text-sm ${color}`}>{value}</b>
  </div>
);

const CommissionCard = ({ title, share, index, updateShare, distributionPool }: any) => {
  const roundMoney = (val: number) => Math.round((val + Number.EPSILON) * 100) / 100;
  const amount = share.amount !== undefined && share.amount !== null && !isNaN(Number(share.amount)) && Number(share.amount) > 0
    ? Number(share.amount)
    : roundMoney(((distributionPool || 0) * Number(share.percent || 0)) / 100);

  return (
    <div className="rounded-xl border border-border bg-card p-2.5">
      <label className="text-[10px] font-bold text-foreground block mb-1">
        {title}
      </label>

      <div className="flex flex-col gap-1.5">
        <div className="flex items-center gap-1.5">
          <input
            type="number"
            value={share.percent === undefined || share.percent === null ? '' : share.percent}
            onChange={(e) => updateShare(index, 'percent', e.target.value)}
            className="w-full p-1.5 rounded-lg border border-border bg-background text-center text-xs font-semibold outline-none focus:border-primary"
            placeholder="%"
          />
          <span className="text-[10px] text-muted-foreground">%</span>
        </div>

        <div className="flex items-center gap-1.5">
          <span className="text-[10px] text-muted-foreground">₹</span>
          <input
            type="number"
            value={amount === 0 ? '' : amount}
            onChange={(e) => updateShare(index, 'amount', e.target.value)}
            className="w-full p-1.5 rounded-lg border border-border bg-background text-center text-xs font-semibold outline-none focus:border-primary"
            placeholder="Amt"
          />
        </div>
      </div>
    </div>
  );
};

export const AdminProductApproval = () => {
  const [products, setProducts] = useState<any[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('All');
  const [catalogFilter, setCatalogFilter] = useState<'ALL' | 'STORE' | 'FOOD'>('ALL');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [vendorFilter, setVendorFilter] = useState<string>('ALL');
  const [priceChangeOnly, setPriceChangeOnly] = useState<boolean>(false);
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('table');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkLoading, setBulkLoading] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [pricing, setPricing] = useState({
    mrp: '',
    sellingPrice: '',
    platformFeePercent: '',
    vendorCommissionPercent: '',
    distributedFrom: 'platform_fee',
    customEstimatedEarning: '',
    shippingCharge: '',
    packingCharge: '',
    remarks: '',
    commissionShares: defaultShares,
  });

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const normalizeProductStatus = (p: any) => {
    const rawStatus = (p.status || p.moderationStatus || p.approvalStatus || '').toString().toLowerCase();
    if (p.isVendorEdit || rawStatus === 'vendor edited' || rawStatus === 'updated - pending approval' || rawStatus === 'vendor_edited') {
      return 'Vendor Edited';
    }
    if (rawStatus === 'live' || rawStatus === 'active' || rawStatus === 'approved' || rawStatus === 'published_live' || rawStatus === 'published') {
      return 'Live';
    }
    if (rawStatus === 'rejected' || rawStatus === 'rejected_by_admin' || rawStatus === 'rejected_by_restaurant') {
      return 'Rejected';
    }
    if (rawStatus === 'negotiation requested' || rawStatus === 'negotiation') {
      return 'Negotiation Requested';
    }
    if (rawStatus === 'awaiting seller approval' || rawStatus === 'pending_restaurant_acceptance') {
      return 'Awaiting Seller Approval';
    }
    return 'Pending Review';
  };

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const [allProds, foodItems] = await Promise.all([
        productService.getAll().catch(() => []),
        productService.getFoodMenuItems().catch(() => [])
      ]);

      const deduplicatedMap = new Map<string, any>();

      // 1. Process regular Products collection
      (allProds || []).forEach((p: any) => {
        const isFood = p.isFoodItem || p.itemType === 'FOOD' || p.productMode === 'FOOD' || Boolean(p.foodMenuItemId) || Boolean(p.restaurantId);
        const normStatus = normalizeProductStatus(p);

        // Construct unique key
        const uniqueKey = p.foodMenuItemId
          ? `food_${p.foodMenuItemId}`
          : p._id
          ? `prod_${p._id}`
          : `sku_${p.sku || p.name}`;

        const previousPrice = p.preEditSnapshot?.price || p.preEditSnapshot?.baseSellingPrice || p.adminPricing?.sellingPrice || null;
        const currentPrice = p.price || p.baseSellingPrice || 0;
        const hasPriceChanged = Boolean(
          p.isVendorEdit ||
          (previousPrice !== null && previousPrice !== currentPrice)
        );

        const formatted = {
          ...p,
          isFoodItem: isFood,
          normalizedStatus: normStatus,
          status: p.status || normStatus,
          categoryName: p.categoryName || p.categoryId?.name || (isFood ? 'Food & Dining' : 'General Catalog'),
          vendorName: p.vendorName || p.sellerId?.name || p.sellerId?.businessName || (isFood ? 'Restaurant Partner' : 'Vendor Partner'),
          baseMrp: p.adminPricing?.mrp || p.baseMrp || p.price || 0,
          baseSellingPrice: currentPrice,
          previousPrice: previousPrice,
          hasPriceChanged: hasPriceChanged,
        };

        deduplicatedMap.set(uniqueKey, formatted);
      });

      // 2. Process FoodMenuItems collection (deduplicating against existing synced items)
      (foodItems || []).forEach((f: any) => {
        const foodKey = `food_${f._id}`;

        let alreadyExists = deduplicatedMap.has(foodKey);
        if (!alreadyExists) {
          for (const existing of deduplicatedMap.values()) {
            if (
              existing.foodMenuItemId === String(f._id) ||
              String(existing._id) === String(f._id) ||
              (existing.name?.toLowerCase() === f.name?.toLowerCase() && existing.isFoodItem)
            ) {
              alreadyExists = true;
              break;
            }
          }
        }

        if (!alreadyExists) {
          const restName = f.restaurantId?.restaurantName || f.restaurantId?.name || 'Restaurant Partner';
          const normStatus = f.approvalStatus === 'PUBLISHED_LIVE'
            ? 'Live'
            : f.approvalStatus === 'PENDING_RESTAURANT_ACCEPTANCE'
            ? 'Awaiting Seller Approval'
            : f.approvalStatus === 'REJECTED_BY_ADMIN' || f.approvalStatus === 'REJECTED_BY_RESTAURANT'
            ? 'Rejected'
            : 'Pending Review';

          deduplicatedMap.set(foodKey, {
            ...f,
            _id: f._id,
            foodMenuItemId: f._id,
            isFoodItem: true,
            normalizedStatus: normStatus,
            status: normStatus,
            categoryName: f.categoryId?.name || 'Food & Dining',
            vendorName: restName,
            baseMrp: f.basePrice,
            baseSellingPrice: f.offerPrice || f.basePrice,
            previousPrice: null,
            hasPriceChanged: false,
            adminPricing: {
              mrp: f.basePrice,
              sellingPrice: f.offerPrice || f.basePrice,
              platformFeePercent: f.platformCommissionPercent || 12,
              platformFeeAmount: f.platformShareAmount || Math.round((f.basePrice * (f.platformCommissionPercent || 12)) / 100),
              finalSellerAmount: f.vendorPayoutAmount !== undefined && f.vendorPayoutAmount !== null ? f.vendorPayoutAmount : (f.offerPrice || f.basePrice),
            }
          });
        }
      });

      setProducts(Array.from(deduplicatedMap.values()));
    } catch (err) {
      console.error('Error fetching products:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  // Compute unique categories with counts for upper Category Tabs
  const categoriesWithCounts = useMemo(() => {
    const map = new Map<string, number>();
    products.forEach((p) => {
      if (catalogFilter === 'STORE' && p.isFoodItem) return;
      if (catalogFilter === 'FOOD' && !p.isFoodItem) return;
      const cat = p.categoryName || 'General Catalog';
      map.set(cat, (map.get(cat) || 0) + 1);
    });

    const list = Array.from(map.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);

    const total = products.filter((p) => {
      if (catalogFilter === 'STORE') return !p.isFoodItem;
      if (catalogFilter === 'FOOD') return Boolean(p.isFoodItem);
      return true;
    }).length;

    return [{ name: 'ALL', count: total }, ...list];
  }, [products, catalogFilter]);

  const availableCategories = useMemo(() => {
    return categoriesWithCounts
      .filter((c) => c.name !== 'ALL')
      .map((c) => c.name);
  }, [categoriesWithCounts]);

  const availableVendors = useMemo(() => {
    const set = new Set<string>();
    products.forEach((p) => {
      if (p.vendorName) set.add(p.vendorName);
    });
    return Array.from(set).sort();
  }, [products]);

  const openPricing = (product: any) => {
    setSelectedProduct(product);

    const existingShares = product.adminPricing?.commissionShares?.length
      ? product.adminPricing.commissionShares.filter(
          (share: any) => share && share.type !== 'referrer'
        )
      : defaultShares;

    const pf = product.adminPricing?.platformFeePercent !== undefined && product.adminPricing?.platformFeePercent !== null && product.adminPricing?.platformFeePercent !== ''
      ? String(product.adminPricing.platformFeePercent)
      : (product.platformCommissionPercent !== undefined && product.platformCommissionPercent !== null && product.platformCommissionPercent !== ''
        ? String(product.platformCommissionPercent)
        : (product.platformFeePercent !== undefined && product.platformFeePercent !== null && product.platformFeePercent !== '' ? String(product.platformFeePercent) : '25'));

    const vc = product.adminPricing?.vendorCommissionPercent !== undefined && product.adminPricing?.vendorCommissionPercent !== null && product.adminPricing?.vendorCommissionPercent !== ''
      ? String(product.adminPricing.vendorCommissionPercent)
      : (product.vendorCommissionPercent !== undefined && product.vendorCommissionPercent !== null && product.vendorCommissionPercent !== '' ? String(product.vendorCommissionPercent) : '0');

    const estEarn = product.adminPricing?.estimatedEarning !== undefined && product.adminPricing?.estimatedEarning !== null
      ? String(product.adminPricing.estimatedEarning)
      : (product.adminPricing?.averageReferralEarning !== undefined && product.adminPricing?.averageReferralEarning !== null ? String(product.adminPricing.averageReferralEarning) : '');

    setPricing({
      mrp: product.adminPricing?.mrp !== undefined && product.adminPricing?.mrp !== '' ? String(product.adminPricing.mrp) : (product.baseMrp ? String(product.baseMrp) : ''),
      sellingPrice:
        product.adminPricing?.sellingPrice !== undefined && product.adminPricing?.sellingPrice !== '' ? String(product.adminPricing.sellingPrice) : (product.baseSellingPrice ? String(product.baseSellingPrice) : ''),
      platformFeePercent: pf,
      vendorCommissionPercent: vc,
      distributedFrom: product.adminPricing?.distributedFrom || 'platform_fee',
      customEstimatedEarning: estEarn,
      shippingCharge: product.adminPricing?.shippingCharge !== undefined && product.adminPricing?.shippingCharge !== null
        ? product.adminPricing.shippingCharge.toString()
        : '0',
      packingCharge: product.adminPricing?.packingCharge !== undefined && product.adminPricing?.packingCharge !== null
        ? product.adminPricing.packingCharge.toString()
        : '0',
      remarks: product.adminPricing?.remarks || '',
      commissionShares: existingShares,
    });
  };

  const roundMoney = (val: number) => Math.round((val + Number.EPSILON) * 100) / 100;

  const vendorCommissionPercent = Number(pricing.vendorCommissionPercent || 0);
  const vendorCommissionAmount = roundMoney(
    (Number(pricing.sellingPrice || 0) * vendorCommissionPercent) / 100
  );

  const platformFeeAmount = roundMoney(
    (Number(pricing.sellingPrice || 0) * Number(pricing.platformFeePercent || 0)) / 100
  );

  const distributedFrom = pricing.distributedFrom || 'platform_fee';

  const distributionPool = roundMoney(
    distributedFrom === 'apexbee_commission'
      ? vendorCommissionAmount
      : distributedFrom === 'both'
      ? (vendorCommissionAmount + platformFeeAmount)
      : distributedFrom === 'none'
      ? 0
      : platformFeeAmount
  );

  const calculatedShares = pricing.commissionShares.map((share) => {
    const pct = Number(share.percent || 0);
    const amount = roundMoney(
      (distributionPool === 0 && share.amount !== undefined && distributedFrom !== 'none')
        ? Number(share.amount || 0)
        : (distributionPool * pct) / 100
    );

    return {
      ...share,
      percent: pct,
      amount: amount,
      isActive: distributedFrom !== 'none',
    };
  });

  const totalCommissionAmount = roundMoney(
    calculatedShares.reduce(
      (sum, item) => sum + (item.isActive ? Number(item.amount || 0) : 0),
      0
    )
  );

  const shippingPacking = roundMoney(
    Number(pricing.shippingCharge || 0) + Number(pricing.packingCharge || 0)
  );

  const finalSellerAmount = roundMoney(
    Number(pricing.sellingPrice || 0) - vendorCommissionAmount
  );

  const platformNetProfit = roundMoney(
    (platformFeeAmount + vendorCommissionAmount) - totalCommissionAmount
  );

  const l1Share = calculatedShares.find((s) => s.type === 'level1');
  const l2Share = calculatedShares.find((s) => s.type === 'level2');
  const l3Share = calculatedShares.find((s) => s.type === 'level3');

  const l1EarnAmt = l1Share?.amount !== undefined ? Number(l1Share.amount || 0) : roundMoney((distributionPool * Number(l1Share?.percent || 0)) / 100);
  const l2EarnAmt = l2Share?.amount !== undefined ? Number(l2Share.amount || 0) : roundMoney((distributionPool * Number(l2Share?.percent || 0)) / 100);
  const l3EarnAmt = l3Share?.amount !== undefined ? Number(l3Share.amount || 0) : roundMoney((distributionPool * Number(l3Share?.percent || 0)) / 100);

  const avgReferralEarn = roundMoney((l1EarnAmt + l2EarnAmt + l3EarnAmt) / 3);
  const totalReferralEarn = roundMoney(l1EarnAmt + l2EarnAmt + l3EarnAmt);

  const activeEstimatedEarn = pricing.customEstimatedEarning !== undefined && pricing.customEstimatedEarning !== '' && !isNaN(Number(pricing.customEstimatedEarning))
    ? Number(pricing.customEstimatedEarning)
    : avgReferralEarn;

  const updateShare = (index: number, key: string, value: any) => {
    const updated = [...pricing.commissionShares] as any[];
    const item = { ...updated[index] };

    if (key === 'percent') {
      const pct = Number(value || 0);
      item.percent = value;
      item.amount = (distributionPool * pct) / 100;
    } else if (key === 'amount') {
      const amt = Number(value || 0);
      item.amount = value;
      item.percent = distributionPool > 0 
        ? Number(((amt / distributionPool) * 100).toFixed(4)) 
        : 0;
    } else {
      (item as any)[key] = value;
    }

    updated[index] = item;
    setPricing({ ...pricing, commissionShares: updated });
  };

  const getProductImage = (product: any) =>
    product.thumbnail || product.images?.[0] || product.image || '';

  const getCategoryPath = (product: any) =>
    product.categoryName ||
    [
      product.categoryId?.name,
      product.subCategoryId?.name,
      product.childCategoryId?.name,
    ]
      .filter(Boolean)
      .join(' / ') || '-';

  const handleSavePricing = async () => {
    if (!selectedProduct) return;

    try {
      setSaving(true);
      const targetProductId = selectedProduct._id || selectedProduct.id || selectedProduct;

      await productService.configureAdminPricing(targetProductId, {
        mrp: Number(pricing.mrp),
        sellingPrice: Number(pricing.sellingPrice),
        platformFeePercent: Number(pricing.platformFeePercent),
        platformFeeAmount,
        vendorCommissionPercent,
        vendorCommissionAmount,
        distributedFrom,
        distributionPool,
        shippingCharge: Number(pricing.shippingCharge || 0),
        packingCharge: Number(pricing.packingCharge || 0),
        commissionShares: calculatedShares,
        totalCommissionAmount,
        finalSellerAmount,
        platformNetProfit,
        referralEarnings: {
          level1: l1EarnAmt,
          level2: l2EarnAmt,
          level3: l3EarnAmt,
          average: activeEstimatedEarn,
          total: totalReferralEarn,
        },
        averageReferralEarning: activeEstimatedEarn,
        estimatedEarning: activeEstimatedEarn,
        remarks: pricing.remarks,
      });

      if (selectedProduct.isFoodItem && selectedProduct.foodMenuItemId) {
        await productService.reviewFoodItemCommission(selectedProduct.foodMenuItemId, {
          platformCommissionPercent: Number(pricing.platformFeePercent),
          adminPricingNotes: pricing.remarks,
          action: 'APPROVE_COMMISSION',
        });
      }

      setSelectedProduct(null);
      showToast('Pricing and commission structure saved successfully!');
      await fetchProducts();
    } catch (err: any) {
      console.error('Configure pricing error:', err);
      const msg = err?.response?.data?.message || err?.message || 'Failed to configure pricing';
      alert(`⚠️ ${msg}`);
    } finally {
      setSaving(false);
    }
  };

  const handleReject = async (product: any) => {
    const reason = window.prompt('Enter rejection reason');
    if (!reason) return;

    try {
      setSaving(true);
      await productService.rejectProduct(product._id, { reason });
      showToast(`Product "${product.name}" rejected.`);
      await fetchProducts();
    } catch (err) {
      console.error(err);
      alert('Failed to reject product');
    } finally {
      setSaving(false);
    }
  };

  // 1-Click Quick Approve for individual product / price update
  const handleQuickApprove = async (product: any) => {
    try {
      setSaving(true);
      await productService.quickApproveVendorEdit(product._id || product.id);
      showToast(`⚡ Approved "${product.name}" price update to Live!`);
      await fetchProducts();
    } catch (err: any) {
      console.error(err);
      alert(err?.response?.data?.message || 'Failed to quick approve product edit');
    } finally {
      setSaving(false);
    }
  };

  // Bulk Multi-Select Handlers
  const handleToggleSelect = (productId: string) => {
    setSelectedIds((prev) =>
      prev.includes(productId)
        ? prev.filter((id) => id !== productId)
        : [...prev, productId]
    );
  };

  const handleSelectAllFiltered = (filteredList: any[]) => {
    const filteredIds = filteredList.map((p) => String(p._id));
    const allSelected = filteredIds.every((id) => selectedIds.includes(id));

    if (allSelected) {
      // Unselect filtered items
      setSelectedIds((prev) => prev.filter((id) => !filteredIds.includes(id)));
    } else {
      // Select all filtered items
      setSelectedIds((prev) => Array.from(new Set([...prev, ...filteredIds])));
    }
  };

  const handleBulkApprove = async () => {
    if (selectedIds.length === 0) return;
    const confirm = window.confirm(
      `Are you sure you want to approve ${selectedIds.length} selected products & update their prices to Live?`
    );
    if (!confirm) return;

    try {
      setBulkLoading(true);
      const res = await productService.bulkApprove(selectedIds, 'Bulk Approved via Admin Center');
      showToast(`✅ ${res.message || `Successfully approved ${selectedIds.length} products to Live!`}`);
      setSelectedIds([]);
      await fetchProducts();
    } catch (err: any) {
      console.error('Bulk approve error:', err);
      alert(err?.response?.data?.message || 'Failed to bulk approve products');
    } finally {
      setBulkLoading(false);
    }
  };

  const handleBulkReject = async () => {
    if (selectedIds.length === 0) return;
    const reason = window.prompt(`Enter rejection reason for ${selectedIds.length} selected products:`);
    if (!reason) return;

    try {
      setBulkLoading(true);
      const res = await productService.bulkReject(selectedIds, reason);
      showToast(`❌ ${res.message || `Rejected ${selectedIds.length} products.`}`);
      setSelectedIds([]);
      await fetchProducts();
    } catch (err: any) {
      console.error('Bulk reject error:', err);
      alert(err?.response?.data?.message || 'Failed to bulk reject products');
    } finally {
      setBulkLoading(false);
    }
  };

  const filteredProducts = useMemo(() => {
    return products.filter((product: any) => {
      // 1. Search filter
      const query = search.toLowerCase().trim();
      const nameMatch = (product.name || '').toLowerCase().includes(query);
      const skuMatch = (product.sku || '').toLowerCase().includes(query);
      const vendorMatch = (product.vendorName || '').toLowerCase().includes(query);
      const catMatch = (product.categoryName || '').toLowerCase().includes(query);
      const matchesSearch = !query || nameMatch || skuMatch || vendorMatch || catMatch;

      // 2. Catalog type filter (ALL vs STORE vs FOOD)
      let matchesCatalog = true;
      if (catalogFilter === 'STORE') matchesCatalog = !product.isFoodItem;
      else if (catalogFilter === 'FOOD') matchesCatalog = Boolean(product.isFoodItem);

      // 3. Status filter
      let matchesStatus = status === 'All';
      if (!matchesStatus) {
        matchesStatus = (product.normalizedStatus || product.status) === status;
      }

      // 4. Category Filter
      let matchesCategory = categoryFilter === 'ALL' || product.categoryName === categoryFilter;

      // 5. Vendor Filter
      let matchesVendor = vendorFilter === 'ALL' || product.vendorName === vendorFilter;

      // 6. Price Changed Only filter
      let matchesPriceChange = true;
      if (priceChangeOnly) {
        matchesPriceChange = Boolean(
          product.hasPriceChanged ||
          product.status === 'Vendor Edited' ||
          product.normalizedStatus === 'Vendor Edited'
        );
      }

      return matchesSearch && matchesCatalog && matchesStatus && matchesCategory && matchesVendor && matchesPriceChange;
    });
  }, [products, search, catalogFilter, status, categoryFilter, vendorFilter, priceChangeOnly]);

  const getStatusCount = (targetStatus: string) => {
    return products.filter((p: any) => {
      let matchesCatalog = true;
      if (catalogFilter === 'STORE') matchesCatalog = !p.isFoodItem;
      else if (catalogFilter === 'FOOD') matchesCatalog = Boolean(p.isFoodItem);
      if (!matchesCatalog) return false;

      if (categoryFilter !== 'ALL' && p.categoryName !== categoryFilter) return false;
      if (vendorFilter !== 'ALL' && p.vendorName !== vendorFilter) return false;
      if (priceChangeOnly && !p.hasPriceChanged && p.normalizedStatus !== 'Vendor Edited') return false;

      if (targetStatus === 'All') return true;
      return (p.normalizedStatus || p.status) === targetStatus;
    }).length;
  };

  const priceChangedCount = useMemo(() => {
    return products.filter((p) => p.hasPriceChanged || p.normalizedStatus === 'Vendor Edited').length;
  }, [products]);

  const statusTabs = [
    { key: 'All', label: 'All Products', count: getStatusCount('All') },
    { key: 'Vendor Edited', label: '⚡ Price/Detail Edits', count: getStatusCount('Vendor Edited'), highlight: true },
    { key: 'Pending Review', label: 'New Approvals', count: getStatusCount('Pending Review') },
    { key: 'Live', label: 'Live Products', count: getStatusCount('Live') },
    { key: 'Negotiation Requested', label: 'Negotiation', count: getStatusCount('Negotiation Requested') },
    { key: 'Awaiting Seller Approval', label: 'Awaiting Seller', count: getStatusCount('Awaiting Seller Approval') },
    { key: 'Rejected', label: 'Rejected', count: getStatusCount('Rejected') },
  ];

  const allFilteredSelected =
    filteredProducts.length > 0 &&
    filteredProducts.every((p) => selectedIds.includes(String(p._id)));

  const franchiseShares = pricing.commissionShares.filter((share) =>
    ['state', 'district', 'mandal'].includes(share.type)
  );

  const referralShares = pricing.commissionShares.filter((share) =>
    ['level1', 'level2', 'level3'].includes(share.type)
  );

  const rewardShares = pricing.commissionShares.filter((share) =>
    ['firstPurchase', 'wishlink'].includes(share.type)
  );

  return (
    <div className="space-y-6 p-6 pb-28 relative">
      {/* Toast notification */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 bg-emerald-600 text-white px-4 py-2.5 rounded-xl shadow-xl flex items-center gap-2 text-xs font-semibold animate-bounce">
          <CheckCircle size={16} />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-card border border-border rounded-2xl p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-extrabold text-foreground">
              Product Approvals & Daily Price Management
            </h1>
            <span className="bg-primary/10 text-primary px-2.5 py-0.5 rounded-full text-[10px] font-bold">
              Bulk Engine Active
            </span>
          </div>

          <p className="text-xs text-muted-foreground mt-1">
            Bulk approve daily price changes for vegetable & grocery vendors, review catalogs, filter by category or vendor, and set commission splits.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => fetchProducts()}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-secondary/80 hover:bg-secondary text-xs font-semibold text-foreground border border-border cursor-pointer transition-all"
            title="Refresh list"
          >
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
            <span>Refresh</span>
          </button>

          <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-primary/10 text-primary border border-primary/20 text-xs font-bold">
            <IndianRupee size={15} />
            <span>Pricing Engine</span>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* UPPER 30%: Summary Metric Cards & Category Overview Deck                  */}
      {/* ========================================================================= */}
      <div className="space-y-4">
        {/* 4 Metric KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: ⚡ Daily Volatile Price Changes */}
          <div
            onClick={() => {
              setPriceChangeOnly(true);
              setStatus('All');
            }}
            className={`p-4 rounded-2xl border transition-all cursor-pointer select-none group relative overflow-hidden ${
              priceChangeOnly
                ? 'bg-amber-500/10 border-amber-500 shadow-md shadow-amber-500/15'
                : 'bg-card border-border hover:border-amber-500/50 hover:bg-amber-500/[0.03]'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                Daily Price Queue
              </span>
              <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600">
                <Zap size={18} className="animate-pulse" />
              </div>
            </div>
            <div className="mt-2">
              <h3 className="text-2xl font-black text-foreground">{priceChangedCount}</h3>
              <p className="text-[11px] text-muted-foreground mt-0.5 font-medium">
                Vegetable & grocery price edits
              </p>
            </div>
            <div className="mt-3 pt-2.5 border-t border-border/60 flex items-center justify-between text-[10px] font-bold">
              <span className="text-amber-600">⚡ Volatile Perishables</span>
              <span className="text-muted-foreground group-hover:text-foreground transition-colors flex items-center gap-1">
                Filter Queue <ArrowRight size={10} />
              </span>
            </div>
          </div>

          {/* Card 2: ⏳ New Approvals Queue */}
          <div
            onClick={() => {
              setPriceChangeOnly(false);
              setStatus('Pending Review');
            }}
            className={`p-4 rounded-2xl border transition-all cursor-pointer select-none group ${
              status === 'Pending Review' && !priceChangeOnly
                ? 'bg-indigo-500/10 border-indigo-500 shadow-md shadow-indigo-500/15'
                : 'bg-card border-border hover:border-indigo-500/50 hover:bg-indigo-500/[0.03]'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                New Products
              </span>
              <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-600">
                <Clock size={18} />
              </div>
            </div>
            <div className="mt-2">
              <h3 className="text-2xl font-black text-foreground">{getStatusCount('Pending Review')}</h3>
              <p className="text-[11px] text-muted-foreground mt-0.5 font-medium">
                Awaiting first admin moderation
              </p>
            </div>
            <div className="mt-3 pt-2.5 border-t border-border/60 flex items-center justify-between text-[10px] font-bold">
              <span className="text-indigo-600">Initial Reviews</span>
              <span className="text-muted-foreground group-hover:text-foreground transition-colors flex items-center gap-1">
                View Pending <ArrowRight size={10} />
              </span>
            </div>
          </div>

          {/* Card 3: 🟢 Live Active Catalogues */}
          <div
            onClick={() => {
              setPriceChangeOnly(false);
              setStatus('Live');
            }}
            className={`p-4 rounded-2xl border transition-all cursor-pointer select-none group ${
              status === 'Live' && !priceChangeOnly
                ? 'bg-emerald-500/10 border-emerald-500 shadow-md shadow-emerald-500/15'
                : 'bg-card border-border hover:border-emerald-500/50 hover:bg-emerald-500/[0.03]'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                Live Inventory
              </span>
              <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600">
                <CheckCircle size={18} />
              </div>
            </div>
            <div className="mt-2">
              <h3 className="text-2xl font-black text-foreground">{getStatusCount('Live')}</h3>
              <p className="text-[11px] text-muted-foreground mt-0.5 font-medium">
                Active & ready for ordering
              </p>
            </div>
            <div className="mt-3 pt-2.5 border-t border-border/60 flex items-center justify-between text-[10px] font-bold">
              <span className="text-emerald-600">Published Active</span>
              <span className="text-muted-foreground group-hover:text-foreground transition-colors flex items-center gap-1">
                View Live <ArrowRight size={10} />
              </span>
            </div>
          </div>

          {/* Card 4: 🏪 Active Suppliers & Footprint */}
          <div
            onClick={() => {
              setPriceChangeOnly(false);
              setCategoryFilter('ALL');
              setVendorFilter('ALL');
              setStatus('All');
            }}
            className="p-4 rounded-2xl border border-border bg-card hover:border-blue-500/50 hover:bg-blue-500/[0.03] transition-all cursor-pointer select-none group"
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                Total Merchants
              </span>
              <div className="p-2 rounded-xl bg-blue-500/10 text-blue-600">
                <Store size={18} />
              </div>
            </div>
            <div className="mt-2">
              <h3 className="text-2xl font-black text-foreground">{availableVendors.length}</h3>
              <p className="text-[11px] text-muted-foreground mt-0.5 font-medium">
                Stores supplying catalog items
              </p>
            </div>
            <div className="mt-3 pt-2.5 border-t border-border/60 flex items-center justify-between text-[10px] font-bold">
              <span className="text-blue-600">Multi-Vendor Footprint</span>
              <span className="text-muted-foreground group-hover:text-foreground transition-colors flex items-center gap-1">
                All Vendors <ArrowRight size={10} />
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Filter and Search Control Bar */}
      <div className="bg-card border border-border rounded-2xl p-4 space-y-3.5 shadow-sm">
        {/* UPPER: Category Tabs Scrollable Ribbon */}
        <div className="space-y-2 pb-3 border-b border-border/80">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-extrabold text-foreground">
              <FolderTree size={15} className="text-primary" />
              <span>CATEGORY TABS</span>
              <span className="text-[10px] font-semibold text-muted-foreground bg-secondary px-2 py-0.5 rounded-full border border-border">
                {categoriesWithCounts.length - 1} Categories
              </span>
            </div>
            {categoryFilter !== 'ALL' && (
              <button
                onClick={() => setCategoryFilter('ALL')}
                className="text-[11px] font-bold text-primary hover:underline cursor-pointer"
              >
                Reset to All Categories
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-1.5 custom-scrollbar">
            {categoriesWithCounts.map((cat) => {
              const isSelected = categoryFilter === cat.name;
              return (
                <button
                  key={cat.name}
                  onClick={() => setCategoryFilter(cat.name)}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer shrink-0 border ${
                    isSelected
                      ? 'bg-primary text-primary-foreground border-primary shadow-md shadow-primary/25 scale-[1.02]'
                      : 'bg-secondary/40 hover:bg-secondary text-muted-foreground hover:text-foreground border-border/70'
                  }`}
                >
                  <span>{cat.name === 'ALL' ? '🌐 All Categories' : cat.name}</span>
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                      isSelected
                        ? 'bg-white text-primary'
                        : 'bg-secondary text-foreground border border-border/50'
                    }`}
                  >
                    {cat.count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Row 1: Catalog Types & Volatile Price Filter */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Catalog Source Filter Tabs */}
          <div className="flex items-center gap-2 p-1 bg-secondary/40 rounded-xl border border-border/60 flex-wrap">
            {[
              { id: 'ALL', label: '🌐 All Catalogs' },
              { id: 'STORE', label: '🏬 Store & Groceries' },
              { id: 'FOOD', label: '🍲 Food & Dining' },
            ].map((cat) => (
              <button
                key={cat.id}
                onClick={() => setCatalogFilter(cat.id as any)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                  catalogFilter === cat.id
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground hover:bg-secondary/60'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Quick Price Changes Toggle & View Mode Toggle */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPriceChangeOnly(!priceChangeOnly)}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                priceChangeOnly
                  ? 'bg-amber-500 text-white border-amber-600 shadow-md shadow-amber-500/20'
                  : 'bg-secondary/40 text-muted-foreground border-border hover:text-foreground hover:bg-secondary'
              }`}
            >
              <Zap size={14} className={priceChangeOnly ? 'fill-white' : 'text-amber-500'} />
              <span>⚡ Price Changes Only ({priceChangedCount})</span>
            </button>

            {/* View Mode Buttons */}
            <div className="flex items-center p-1 bg-secondary/60 rounded-xl border border-border">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-lg transition-all ${
                  viewMode === 'grid'
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
                title="Cards Grid View"
              >
                <LayoutGrid size={15} />
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded-lg transition-all ${
                  viewMode === 'table'
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
                title="Dense Table View"
              >
                <List size={15} />
              </button>
            </div>
          </div>
        </div>

        {/* Row 2: Search, Category Filter, Vendor Filter */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
          {/* Search Box */}
          <div className="relative md:col-span-4">
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search product name, SKU, vendor or category..."
              className="w-full pl-9 pr-3 py-2 rounded-xl border border-border bg-background text-xs outline-none focus:border-primary font-medium"
            />
          </div>

          {/* Category Dropdown */}
          <div className="md:col-span-3">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-border bg-background text-xs font-medium outline-none focus:border-primary cursor-pointer"
            >
              <option value="ALL">📁 All Categories ({availableCategories.length})</option>
              {availableCategories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Vendor Dropdown */}
          <div className="md:col-span-3">
            <select
              value={vendorFilter}
              onChange={(e) => setVendorFilter(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-border bg-background text-xs font-medium outline-none focus:border-primary cursor-pointer"
            >
              <option value="ALL">🏪 All Sellers & Vendors ({availableVendors.length})</option>
              {availableVendors.map((v) => (
                <option key={v} value={v}>
                  {v}
                </option>
              ))}
            </select>
          </div>

          {/* Active stats counter */}
          <div className="md:col-span-2 text-right text-xs text-muted-foreground font-semibold">
            Showing <b className="text-foreground">{filteredProducts.length}</b> of <b className="text-foreground">{products.length}</b>
          </div>
        </div>

        {/* Row 3: Status Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-border">
          {statusTabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setStatus(t.key)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                status === t.key
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : t.highlight && t.count > 0
                  ? 'bg-amber-500/15 text-amber-600 border border-amber-500/30 hover:bg-amber-500/25'
                  : 'bg-secondary/40 text-muted-foreground hover:bg-secondary hover:text-foreground'
              }`}
            >
              <span>{t.label}</span>
              <span
                className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                  status === t.key
                    ? 'bg-white/20 text-white'
                    : 'bg-secondary text-foreground border border-border/40'
                }`}
              >
                {t.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* PRODUCTS DISPLAY: CARDS GRID VIEW VS TABLE LIST VIEW                      */}
      {/* ========================================================================= */}
      {viewMode === 'grid' ? (
        /* CARDS GRID VIEW */
        <div className="space-y-4">
          {/* Quick Select All Header for Grid */}
          <div className="flex items-center justify-between px-2 text-xs text-muted-foreground">
            <label className="flex items-center gap-2 cursor-pointer select-none font-semibold">
              <input
                type="checkbox"
                checked={allFilteredSelected}
                onChange={() => handleSelectAllFiltered(filteredProducts)}
                className="rounded border-border text-primary focus:ring-primary"
              />
              <span>Select All Visible ({filteredProducts.length})</span>
            </label>
            <span className="text-[11px]">Click product card for quick view</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredProducts.map((product) => {
              const isSelected = selectedIds.includes(String(product._id));
              const isPriceEdited = product.hasPriceChanged || product.normalizedStatus === 'Vendor Edited';
              const oldPrice = product.previousPrice;
              const newPrice = product.baseSellingPrice;

              let priceDiffPercent = null;
              if (oldPrice && newPrice && oldPrice !== newPrice) {
                priceDiffPercent = (((newPrice - oldPrice) / oldPrice) * 100).toFixed(1);
              }

              return (
                <div
                  key={product._id}
                  className={`bg-card border rounded-2xl p-4 flex flex-col justify-between transition-all duration-200 shadow-sm hover:shadow-md relative group ${
                    isSelected
                      ? 'border-primary ring-2 ring-primary/20 bg-primary/[0.02]'
                      : isPriceEdited
                      ? 'border-amber-500/40 hover:border-amber-500 bg-amber-500/[0.02]'
                      : 'border-border hover:border-primary/40'
                  }`}
                >
                  {/* Card Header: Checkbox & Status */}
                  <div className="flex items-center justify-between mb-3">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => handleToggleSelect(String(product._id))}
                      className="rounded border-border text-primary focus:ring-primary cursor-pointer w-4 h-4"
                    />
                    <StatusBadge status={product.status} />
                  </div>

                  {/* Image & Product Info */}
                  <div className="flex gap-3 items-start">
                    {getProductImage(product) ? (
                      <img
                        src={getProductImage(product)}
                        alt={product.name}
                        className="w-16 h-16 rounded-xl object-cover border border-border/80 shrink-0 shadow-sm"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-xl bg-secondary/80 flex items-center justify-center shrink-0 text-muted-foreground border border-border">
                        <Store size={22} />
                      </div>
                    )}

                    <div className="overflow-hidden flex-1">
                      <h4 className="font-bold text-xs text-foreground truncate" title={product.name}>
                        {product.name}
                      </h4>
                      <p className="text-[10px] text-muted-foreground font-mono mt-0.5 truncate">
                        SKU: {product.sku || product._id?.slice(-6)}
                      </p>
                      <span className="inline-block mt-1 bg-secondary/80 text-[9px] font-semibold px-2 py-0.5 rounded text-foreground truncate max-w-full">
                        {product.categoryName || 'General'}
                      </span>
                    </div>
                  </div>

                  {/* Vendor / Store Chip */}
                  <div className="mt-3 pt-2 border-t border-border/60 flex items-center justify-between text-[10px] text-muted-foreground">
                    <span className="truncate max-w-[130px] font-medium" title={product.vendorName}>
                      🏪 {product.vendorName || 'Vendor Partner'}
                    </span>
                    <span className="font-mono text-[9px] opacity-80">
                      {product.sellerType || 'Retail'}
                    </span>
                  </div>

                  {/* Pricing Comparison Box */}
                  <div className="mt-3 p-2.5 rounded-xl bg-secondary/40 border border-border/60 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-muted-foreground font-semibold">Selling Price:</span>
                      <div className="flex items-center gap-1.5">
                        {product.baseMrp && product.baseMrp > product.baseSellingPrice && (
                          <span className="text-[10px] text-muted-foreground line-through">
                            ₹{product.baseMrp}
                          </span>
                        )}
                        <span className="font-black text-xs text-foreground">₹{product.baseSellingPrice}</span>
                      </div>
                    </div>

                    {/* Price Fluctuation Diff */}
                    {isPriceEdited && oldPrice && oldPrice !== newPrice && (
                      <div className="flex items-center justify-between pt-1 border-t border-border/40 text-[10px]">
                        <span className="text-muted-foreground">Previous Price:</span>
                        <div className="flex items-center gap-1">
                          <span className="line-through text-muted-foreground">₹{oldPrice}</span>
                          <span
                            className={`font-bold px-1.5 py-0.2 rounded text-[9px] ${
                              Number(priceDiffPercent) > 0
                                ? 'bg-amber-500/20 text-amber-600'
                                : 'bg-emerald-500/20 text-emerald-600'
                            }`}
                          >
                            {Number(priceDiffPercent) > 0 ? `+${priceDiffPercent}%` : `${priceDiffPercent}%`}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="mt-3 pt-2 flex items-center gap-1.5 justify-end">
                    {isPriceEdited && (
                      <button
                        onClick={() => handleQuickApprove(product)}
                        disabled={saving}
                        className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] shadow-sm transition-all cursor-pointer"
                        title="1-Click Approve Price"
                      >
                        <Zap size={12} className="fill-white" />
                        <span>Approve</span>
                      </button>
                    )}

                    <button
                      onClick={() => openPricing(product)}
                      className="p-2 rounded-xl bg-primary/10 text-primary hover:bg-primary/20 transition-colors cursor-pointer"
                      title="Configure Pricing & Margins"
                    >
                      <Eye size={14} />
                    </button>

                    <button
                      onClick={() => handleReject(product)}
                      disabled={saving}
                      className="p-2 rounded-xl bg-rose-500/10 text-rose-500 hover:bg-rose-500/20 transition-colors cursor-pointer disabled:opacity-50"
                      title="Reject Product"
                    >
                      <XCircle size={14} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {loading ? (
            <div className="p-12 text-center flex flex-col items-center gap-3 text-muted-foreground">
              <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
              <span className="text-xs font-semibold">Loading catalog cards...</span>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="p-12 text-center text-xs text-muted-foreground font-medium bg-card border border-border rounded-2xl">
              No products match the selected filters.
            </div>
          ) : null}
        </div>
      ) : (
        /* DENSE TABLE VIEW */
        <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
          <table className="w-full text-xs text-left">
            <thead className="bg-secondary/40 text-muted-foreground border-b border-border">
              <tr>
                <th className="p-3 w-10 text-center">
                  <input
                    type="checkbox"
                    checked={allFilteredSelected}
                    onChange={() => handleSelectAllFiltered(filteredProducts)}
                    className="rounded border-border text-primary focus:ring-primary cursor-pointer"
                    title="Select All Filtered"
                  />
                </th>
                <th className="p-3">Product</th>
                <th className="p-3">Seller / Vendor</th>
                <th className="p-3">Category</th>
                <th className="p-3">Seller Price (MRP & Selling)</th>
                <th className="p-3">Admin Configured Price</th>
                <th className="p-3">Status</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-border">
              {filteredProducts.map((product) => {
                const isSelected = selectedIds.includes(String(product._id));
                const isPriceEdited = product.hasPriceChanged || product.normalizedStatus === 'Vendor Edited';
                const oldPrice = product.previousPrice;
                const newPrice = product.baseSellingPrice;

                let priceDiffPercent = null;
                if (oldPrice && newPrice && oldPrice !== newPrice) {
                  priceDiffPercent = (((newPrice - oldPrice) / oldPrice) * 100).toFixed(1);
                }

                return (
                  <tr
                    key={product._id}
                    className={`hover:bg-secondary/30 transition-colors ${
                      isSelected ? 'bg-primary/5' : isPriceEdited ? 'bg-amber-500/[0.03]' : ''
                    }`}
                  >
                    {/* Multi-select Checkbox */}
                    <td className="p-3 text-center">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleToggleSelect(String(product._id))}
                        className="rounded border-border text-primary focus:ring-primary cursor-pointer"
                      />
                    </td>

                    {/* Product Details */}
                    <td className="p-3">
                      <div className="flex items-center gap-3">
                        {getProductImage(product) ? (
                          <img
                            src={getProductImage(product)}
                            alt={product.name}
                            className="w-10 h-10 rounded-lg object-cover border border-border/80 shrink-0"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-lg bg-secondary/80 flex items-center justify-center shrink-0 text-muted-foreground">
                            <Store size={18} />
                          </div>
                        )}

                        <div className="overflow-hidden">
                          <p className="font-bold text-foreground truncate max-w-[200px]">
                            {product.name}
                          </p>
                          <p className="text-[10px] text-muted-foreground font-mono">
                            SKU: {product.sku || product._id?.slice(-6)}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Seller / Vendor */}
                    <td className="p-3">
                      <p className="font-semibold text-foreground truncate max-w-[150px]">
                        {product.vendorName || '-'}
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        {product.sellerType || (product.isFoodItem ? 'Restaurant Partner' : 'Vendor Partner')}
                      </p>
                    </td>

                    {/* Category */}
                    <td className="p-3 text-muted-foreground">
                      <span className="bg-secondary/60 px-2 py-0.5 rounded text-[11px] font-medium text-foreground">
                        {getCategoryPath(product)}
                      </span>
                    </td>

                    {/* Seller Price + Price Diff Badge */}
                    <td className="p-3">
                      <div className="flex flex-col gap-0.5">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-foreground">₹{product.baseSellingPrice}</span>
                          {product.baseMrp && product.baseMrp > product.baseSellingPrice && (
                            <span className="text-[10px] text-muted-foreground line-through">
                              MRP ₹{product.baseMrp}
                            </span>
                          )}
                        </div>

                        {/* Price Change Diff Tag */}
                        {isPriceEdited && oldPrice && oldPrice !== newPrice && (
                          <div className="flex items-center gap-1 mt-0.5">
                            <span className="text-[10px] text-muted-foreground line-through">
                              ₹{oldPrice}
                            </span>
                            <ArrowRight size={10} className="text-muted-foreground" />
                            <span
                              className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
                                Number(priceDiffPercent) > 0
                                ? 'bg-amber-500/15 text-amber-600'
                                : 'bg-emerald-500/15 text-emerald-600'
                              }`}
                            >
                              {Number(priceDiffPercent) > 0 ? `+${priceDiffPercent}%` : `${priceDiffPercent}%`}
                            </span>
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Admin Configured Price & Est. Referral Earn */}
                    <td className="p-3">
                      {product.adminPricing ? (
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-foreground">₹{product.adminPricing.sellingPrice}</span>
                            <span className="bg-primary/10 text-primary text-[9.5px] font-bold px-1.5 py-0.2 rounded">
                              Fee: {product.adminPricing.platformFeePercent ?? 0}%
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5 flex-wrap text-[9.5px]">
                            <span className="text-muted-foreground">
                              Payout: <b className="text-emerald-600">₹{Number(product.adminPricing.finalSellerAmount || 0).toFixed(2)}</b>
                            </span>
                            <span className="bg-amber-500/15 text-amber-800 dark:text-amber-300 font-extrabold px-1 rounded flex items-center gap-0.5">
                              <Coins size={9} className="text-amber-600" />
                              <span>Est. Earn: ₹{Number(product.adminPricing.estimatedEarning ?? product.adminPricing.averageReferralEarning ?? product.adminPricing.referralEarnings?.average ?? 0).toFixed(2)}</span>
                            </span>
                          </div>
                        </div>
                      ) : (
                        <span className="text-muted-foreground italic text-[11px]">Auto / Default Split</span>
                      )}
                    </td>

                    {/* Status Badge */}
                    <td className="p-3">
                      <StatusBadge status={product.status} />
                    </td>

                    {/* Actions Column */}
                    <td className="p-3">
                      <div className="flex items-center justify-end gap-1.5">
                        {isPriceEdited && (
                          <button
                            onClick={() => handleQuickApprove(product)}
                            disabled={saving}
                            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] shadow-sm transition-all cursor-pointer shrink-0"
                            title="1-Click Quick Approve Price Update to Live"
                          >
                            <Zap size={12} className="fill-white" />
                            <span>Approve</span>
                          </button>
                        )}

                        <button
                          onClick={() => openPricing(product)}
                          className="p-1.5 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                          title="Configure Pricing & Commission Splits"
                        >
                          <Eye size={14} />
                        </button>

                        <button
                          onClick={() => handleReject(product)}
                          disabled={saving}
                          className={`p-1.5 rounded-lg bg-rose-500/10 text-rose-500 hover:bg-rose-500/20 transition-colors ${
                            saving ? 'opacity-50 cursor-not-allowed' : ''
                          }`}
                          title="Reject Product"
                        >
                          <XCircle size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {loading ? (
                <tr>
                  <td colSpan={8} className="p-10 text-center">
                    <div className="flex flex-col items-center gap-3 text-muted-foreground">
                      <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
                      <span className="text-xs font-semibold">Loading catalog products...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-10 text-center text-muted-foreground font-medium">
                    No products match the selected filters.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      )}

      {/* Floating Bottom Bulk Action Toolbar */}
      {selectedIds.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-foreground text-background dark:bg-card dark:text-foreground border border-border/80 px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-4 animate-in fade-in slide-in-from-bottom-4 duration-200">
          <div className="flex items-center gap-2 pr-2 border-r border-border/40">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-bold whitespace-nowrap">
              {selectedIds.length} Products Selected
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* ⚡ Bulk Price Update Approval (Instant Live) */}
            <button
              onClick={handleBulkApprove}
              disabled={bulkLoading}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-600/30 transition-all cursor-pointer disabled:opacity-50"
            >
              <Zap size={14} className="fill-white" />
              <span>{bulkLoading ? 'Processing...' : '⚡ Bulk Approve Price Updates'}</span>
            </button>

            {/* Reject Selected */}
            <button
              onClick={handleBulkReject}
              disabled={bulkLoading}
              className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-rose-600/20 text-rose-400 hover:bg-rose-600/30 text-xs font-bold transition-all cursor-pointer disabled:opacity-50"
            >
              <XCircle size={14} />
              <span>Reject Selected</span>
            </button>

            {/* Clear Selection */}
            <button
              onClick={() => setSelectedIds([])}
              className="px-2 py-1 text-xs text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            >
              Clear
            </button>
          </div>
        </div>
      )}

      {/* Pricing Modal */}

      {selectedProduct && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-2 sm:p-3">
          <div className="bg-card border border-border rounded-2xl max-w-[98vw] w-full p-5 h-[96vh] overflow-hidden flex flex-col shadow-2xl">
            <div className="flex justify-between items-center border-b border-border pb-3 mb-3">
              <div>
                <h2 className="text-base font-bold">
                  Configure Pricing - {selectedProduct.name}
                </h2>

                <p className="text-xs text-muted-foreground">
                  Left side: pricing engine. Right side: product verification.
                </p>
              </div>

              <button
                onClick={() => setSelectedProduct(null)}
                className="px-3 py-1.5 rounded-xl bg-secondary hover:bg-secondary/80 text-xs font-bold text-foreground border border-border cursor-pointer transition-colors"
              >
                ✕ Close
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-[1.35fr_0.65fr] gap-5 flex-1 overflow-hidden">
              <div className="space-y-3 overflow-y-auto pr-1">
                <div className="rounded-2xl border border-border bg-secondary/10 p-3">
                  <h3 className="text-[11px] font-bold uppercase text-foreground mb-3 flex items-center gap-1">
                    <Tags size={13} />
                    Product Pricing
                  </h3>

                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2">
                    <FormInput
                      label="MRP (₹)"
                      placeholder="MRP"
                      value={pricing.mrp}
                      onChange={(e: any) =>
                        setPricing({ ...pricing, mrp: e.target.value })
                      }
                    />

                    <FormInput
                      label="Selling Price (₹)"
                      placeholder="Selling"
                      value={pricing.sellingPrice}
                      onChange={(e: any) =>
                        setPricing({
                          ...pricing,
                          sellingPrice: e.target.value,
                        })
                      }
                    />

                    <FormInput
                      label="ApexBee Comm (%)"
                      placeholder="Vendor Comm %"
                      value={pricing.vendorCommissionPercent}
                      onChange={(e: any) =>
                        setPricing({
                          ...pricing,
                          vendorCommissionPercent: e.target.value,
                        })
                      }
                    />

                    <FormInput
                      label="Platform Fee (%)"
                      placeholder="Platform %"
                      value={pricing.platformFeePercent}
                      onChange={(e: any) =>
                        setPricing({
                          ...pricing,
                          platformFeePercent: e.target.value,
                        })
                      }
                    />

                    <div className="space-y-1">
                      <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                        Distributed From
                      </label>
                      <select
                        value={pricing.distributedFrom}
                        onChange={(e) =>
                          setPricing({ ...pricing, distributedFrom: e.target.value })
                        }
                        className="w-full p-2.5 rounded-xl border border-border bg-background text-xs font-bold text-foreground outline-none focus:border-primary cursor-pointer"
                      >
                        <option value="platform_fee">Platform Fee Pool</option>
                        <option value="apexbee_commission">ApexBee Commission Pool</option>
                        <option value="both">Both (Comm + Platform Fee)</option>
                        <option value="none">None (Add to Platform Profit)</option>
                      </select>
                    </div>

                    <FormInput
                      label="Shipping (₹)"
                      placeholder="Shipping"
                      value={pricing.shippingCharge}
                      onChange={(e: any) =>
                        setPricing({
                          ...pricing,
                          shippingCharge: e.target.value,
                        })
                      }
                    />

                    <FormInput
                      label="Packing (₹)"
                      placeholder="Packing"
                      value={pricing.packingCharge}
                      onChange={(e: any) =>
                        setPricing({
                          ...pricing,
                          packingCharge: e.target.value,
                        })
                      }
                    />

                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                          Est. Earn (₹)
                        </label>
                        {pricing.customEstimatedEarning && (
                          <button
                            type="button"
                            onClick={() => setPricing({ ...pricing, customEstimatedEarning: '' })}
                            className="text-[9px] text-primary hover:underline font-bold cursor-pointer"
                            title="Reset to auto-calculated 3-level average"
                          >
                            Auto
                          </button>
                        )}
                      </div>
                      <div className="relative">
                        <input
                          type="number"
                          placeholder={`Auto ₹${avgReferralEarn.toFixed(2)}`}
                          value={pricing.customEstimatedEarning || ''}
                          onChange={(e: any) =>
                            setPricing({
                              ...pricing,
                              customEstimatedEarning: e.target.value,
                            })
                          }
                          className="w-full p-2.5 rounded-xl border border-border bg-background text-xs font-semibold outline-none focus:border-primary pr-8"
                        />
                        <Coins size={13} className="absolute right-2.5 top-3 text-amber-500 pointer-events-none" />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2">
                  <SummaryCard
                    title="ApexBee Comm"
                    value={`₹${vendorCommissionAmount.toFixed(2)}`}
                    icon={IndianRupee}
                    color="text-amber-500"
                  />

                  <SummaryCard
                    title="Platform Fee"
                    value={`₹${platformFeeAmount.toFixed(2)} (${pricing.platformFeePercent || 0}%)`}
                    icon={IndianRupee}
                  />

                  <SummaryCard
                    title="Pool Target"
                    value={`₹${distributionPool.toFixed(2)}`}
                    icon={Network}
                    color="text-indigo-500"
                  />

                  <SummaryCard
                    title="Est. Earning"
                    value={`₹${activeEstimatedEarn.toFixed(2)}`}
                    icon={Coins}
                    color="text-emerald-500"
                  />

                  <SummaryCard
                    title="Distributed"
                    value={`₹${totalCommissionAmount.toFixed(2)}`}
                    icon={Network}
                  />

                  <SummaryCard
                    title="Seller Gets"
                    value={`₹${finalSellerAmount.toFixed(2)}`}
                    color="text-emerald-600"
                    icon={Store}
                  />

                  <SummaryCard
                    title="Platform Profit"
                    value={`₹${platformNetProfit.toFixed(2)}`}
                    color={
                      platformNetProfit >= 0
                        ? 'text-emerald-500 font-bold'
                        : 'text-rose-600'
                    }
                    icon={Landmark}
                  />
                </div>

                <div className="rounded-2xl border border-border bg-secondary/10 p-3">
                  <h3 className="text-[11px] font-bold uppercase text-foreground mb-2 flex items-center gap-1">
                    <Landmark size={13} />
                    Franchise Commission
                  </h3>

                  <div className="grid grid-cols-2 xl:grid-cols-4 gap-2">
                    {franchiseShares.map((share) => {
                      const originalIndex = pricing.commissionShares.findIndex(
                        (item) => item.type === share.type
                      );

                      return (
                        <CommissionCard
                          key={share.type}
                          title={share.label}
                          share={share}
                          index={originalIndex}
                          updateShare={updateShare}
                          distributionPool={distributionPool}
                        />
                      );
                    })}
                  </div>
                </div>

                <div className="rounded-2xl border border-border bg-secondary/10 p-3 space-y-2.5">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/70 pb-2">
                    <h3 className="text-[11px] font-bold uppercase text-foreground flex items-center gap-1">
                      <Network size={13} className="text-indigo-500" />
                      Referral Network Commission
                    </h3>
                    <span className="bg-emerald-500/15 border border-emerald-500/30 text-emerald-900 dark:text-emerald-300 text-[10px] font-bold px-2.5 py-0.5 rounded-lg flex items-center gap-1.5">
                      <Coins size={12} className="text-amber-600" />
                      <span>Active Est. Earn:</span>
                      <b className="text-emerald-600 dark:text-emerald-400 text-xs">₹{activeEstimatedEarn.toFixed(2)}</b>
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    {referralShares.map((share) => {
                      const originalIndex = pricing.commissionShares.findIndex(
                        (item) => item.type === share.type
                      );

                      return (
                        <CommissionCard
                          key={share.type}
                          title={share.label}
                          share={share}
                          index={originalIndex}
                          updateShare={updateShare}
                          distributionPool={distributionPool}
                        />
                      );
                    })}
                  </div>

                  {/* Single Unified Live Estimation Ribbon with Direct Edit */}
                  <div className="p-2.5 rounded-xl bg-card border border-border/80 flex flex-wrap items-center justify-between gap-2 text-xs">
                    <div className="flex items-center gap-2">
                      <Coins size={14} className="text-amber-500 shrink-0" />
                      <div>
                        <p className="text-[11px] font-bold text-foreground">
                          Estimated Referral Earning
                        </p>
                        <p className="text-[9.5px] text-muted-foreground">
                          Auto 3-tier average: ₹{avgReferralEarn.toFixed(2)} {pricing.customEstimatedEarning ? `(Custom overridden to ₹${Number(pricing.customEstimatedEarning).toFixed(2)})` : '(Auto calculated)'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold text-muted-foreground uppercase">Override Amount:</span>
                      <div className="flex items-center gap-1">
                        <span className="text-xs font-bold text-muted-foreground">₹</span>
                        <input
                          type="number"
                          placeholder={avgReferralEarn.toFixed(2)}
                          value={pricing.customEstimatedEarning || ''}
                          onChange={(e) => setPricing({ ...pricing, customEstimatedEarning: e.target.value })}
                          className="w-24 p-1.5 rounded-lg border border-border bg-background text-xs font-black text-emerald-600 outline-none focus:border-primary text-center"
                        />
                        {pricing.customEstimatedEarning && (
                          <button
                            type="button"
                            onClick={() => setPricing({ ...pricing, customEstimatedEarning: '' })}
                            className="px-2 py-1 text-[10px] font-bold rounded-lg bg-secondary text-muted-foreground hover:text-foreground cursor-pointer"
                          >
                            Reset Auto
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-border bg-secondary/10 p-3">
                  <h3 className="text-[11px] font-bold uppercase text-foreground mb-2 flex items-center gap-1">
                    <Gift size={13} />
                    Reward & Promotion Commission
                  </h3>

                  <div className="grid grid-cols-2 gap-2">
                    {rewardShares.map((share) => {
                      const originalIndex = pricing.commissionShares.findIndex(
                        (item) => item.type === share.type
                      );

                      return (
                        <CommissionCard
                          key={share.type}
                          title={share.label}
                          share={share}
                          index={originalIndex}
                          updateShare={updateShare}
                          distributionPool={distributionPool}
                        />
                      );
                    })}
                  </div>
                </div>

                <textarea
                  placeholder="Admin remarks"
                  value={pricing.remarks}
                  onChange={(e) =>
                    setPricing({ ...pricing, remarks: e.target.value })
                  }
                  className="w-full p-2.5 rounded-xl border border-border bg-background text-xs outline-none focus:border-primary"
                  rows={2}
                />

                <button
                  onClick={handleSavePricing}
                  disabled={saving}
                  className={`w-full py-2.5 rounded-xl bg-emerald-600 text-white font-bold flex items-center justify-center gap-2 ${saving ? 'opacity-70 cursor-not-allowed' : ''}`}
                >
                  {saving ? (
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <CheckCircle size={16} />
                  )}
                  {saving ? 'Saving Pricing...' : 'Save Pricing & Send to Seller'}
                </button>
              </div>

              <div className="overflow-y-auto border border-border rounded-2xl p-3 bg-secondary/10">
                <div className="flex gap-3 mb-3">
                  {getProductImage(selectedProduct) ? (
                    <img
                      src={getProductImage(selectedProduct)}
                      alt={selectedProduct.name}
                      className="w-24 h-24 rounded-xl object-cover border"
                    />
                  ) : (
                    <div className="w-24 h-24 rounded-xl bg-secondary border" />
                  )}

                  <div className="text-xs space-y-1">
                    <h4 className="text-sm font-bold">
                      {selectedProduct.name}
                    </h4>

                    <p>
                      SKU: <b>{selectedProduct.sku}</b>
                    </p>

                    <p>
                      Brand: <b>{selectedProduct.brand || '-'}</b>
                    </p>

                    <p>
                      Status:{' '}
                      <b>
                        <StatusBadge status={selectedProduct.status} />
                      </b>
                    </p>

                    <p>
                      Seller:{' '}
                      <b>{selectedProduct.sellerId?.name || '-'}</b>
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="rounded-xl bg-card border border-border p-2">
                    <p className="text-muted-foreground">Category</p>
                    <b>{getCategoryPath(selectedProduct)}</b>
                  </div>

                  <div className="rounded-xl bg-card border border-border p-2">
                    <p className="text-muted-foreground">Seller Type</p>
                    <b>{selectedProduct.sellerType || '-'}</b>
                  </div>

                  <div className="rounded-xl bg-card border border-border p-2">
                    <p className="text-muted-foreground">Base MRP</p>
                    <b>₹{selectedProduct.baseMrp || 0}</b>
                  </div>

                  <div className="rounded-xl bg-card border border-border p-2">
                    <p className="text-muted-foreground">Seller Price</p>
                    <b>₹{selectedProduct.baseSellingPrice || 0}</b>
                  </div>

                  <div className="rounded-xl bg-card border border-border p-2">
                    <p className="text-muted-foreground">Stock</p>
                    <b>{selectedProduct.stock || 0}</b>
                  </div>

                  <div className="rounded-xl bg-card border border-border p-2">
                    <p className="text-muted-foreground">Variants</p>
                    <b>{selectedProduct.variants?.length || 0}</b>
                  </div>
                </div>

                <div className="mt-3 rounded-xl bg-card border border-border p-2 text-xs">
                  <p className="font-bold mb-1">Seller Contact</p>

                  <div className="grid grid-cols-1 gap-1 text-muted-foreground">
                    <p>
                      Email:{' '}
                      <b className="text-foreground">
                        {selectedProduct.sellerId?.email || '-'}
                      </b>
                    </p>

                    <p>
                      Mobile:{' '}
                      <b className="text-foreground">
                        {selectedProduct.sellerId?.mobile || '-'}
                      </b>
                    </p>
                  </div>
                </div>

                <div className="mt-3 rounded-xl bg-card border border-border p-2 text-xs">
                  <p className="font-bold mb-1">Description</p>

                  <p className="text-muted-foreground line-clamp-4">
                    {selectedProduct.description ||
                      'No description available.'}
                  </p>
                </div>

                {selectedProduct.variants?.length > 0 && (
                  <div className="mt-3 rounded-xl bg-card border border-border p-2 text-xs">
                    <p className="font-bold mb-2">Variants</p>

                    <div className="space-y-2 max-h-36 overflow-y-auto">
                      {selectedProduct.variants.map((variant: any) => (
                        <div
                          key={variant.sku}
                          className="flex justify-between gap-2 border-b border-border pb-1 last:border-b-0"
                        >
                          <div>
                            <p className="font-semibold">{variant.sku}</p>

                            <p className="text-muted-foreground">
                              {Object.entries(variant.attributes || {})
                                .map(([key, value]) => `${key}: ${value}`)
                                .join(', ')}
                            </p>
                          </div>

                          <div className="text-right">
                            <p>₹{variant.sellingPrice || 0}</p>

                            <p className="text-muted-foreground">
                              Qty: {variant.stock || 0}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Product Model & Engine Details Section */}
                <div className="mt-3 rounded-xl bg-card border border-border p-2.5 text-xs space-y-2">
                  <p className="font-bold text-foreground border-b border-border pb-1 flex items-center gap-1.5">
                    <Tags size={12} className="text-primary" />
                    Model & Engine Details
                  </p>

                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    <div className="rounded-lg bg-secondary/30 p-2 border border-border/50">
                      <p className="text-muted-foreground text-[10px]">Catalog Source</p>
                      <b className="capitalize text-foreground">{selectedProduct.catalogueSource || 'vendor'}</b>
                    </div>

                    <div className="rounded-lg bg-secondary/30 p-2 border border-border/50">
                      <p className="text-muted-foreground text-[10px]">Product Mode</p>
                      <b className="capitalize text-foreground">{selectedProduct.productMode || 'standard'}</b>
                    </div>

                    <div className="rounded-lg bg-secondary/30 p-2 border border-border/50">
                      <p className="text-muted-foreground text-[10px]">Subscription Available</p>
                      <b className={selectedProduct.isSubscriptionAvailable ? 'text-emerald-600 font-bold' : 'text-muted-foreground'}>
                        {selectedProduct.isSubscriptionAvailable ? '✓ Yes' : '✕ No'}
                      </b>
                    </div>

                    <div className="rounded-lg bg-secondary/30 p-2 border border-border/50">
                      <p className="text-muted-foreground text-[10px]">Master Catalog</p>
                      <b className={selectedProduct.isCatalogueMaster ? 'text-indigo-600 font-bold' : 'text-muted-foreground'}>
                        {selectedProduct.isCatalogueMaster ? '✓ Master' : '✕ Standard'}
                      </b>
                    </div>
                  </div>

                  {selectedProduct.slug && (
                    <div className="text-[10px] text-muted-foreground bg-secondary/20 p-2 rounded-lg border border-border/40">
                      Slug: <code className="text-foreground font-mono">{selectedProduct.slug}</code>
                    </div>
                  )}

                  {selectedProduct.seedKey && (
                    <div className="text-[10px] text-muted-foreground bg-secondary/20 p-2 rounded-lg border border-border/40">
                      Seed Key: <code className="text-foreground font-mono">{selectedProduct.seedKey}</code> (v{selectedProduct.seedVersion || 1})
                    </div>
                  )}
                </div>

                {/* Attributes & Specifications */}
                {((selectedProduct.attributes && Object.keys(selectedProduct.attributes).length > 0) ||
                  (selectedProduct.specifications && Object.keys(selectedProduct.specifications).length > 0)) && (
                  <div className="mt-3 rounded-xl bg-card border border-border p-2.5 text-xs space-y-2">
                    <p className="font-bold text-foreground border-b border-border pb-1">
                      Attributes & Specifications
                    </p>

                    <div className="grid grid-cols-2 gap-1.5 text-[11px] max-h-36 overflow-y-auto">
                      {Object.entries({
                        ...(selectedProduct.attributes || {}),
                        ...(selectedProduct.specifications || {}),
                      }).map(([key, val]) => (
                        <div key={key} className="p-1.5 rounded-lg bg-secondary/20 border border-border/40">
                          <span className="text-[10px] text-muted-foreground block capitalize">{key}</span>
                          <b className="text-foreground font-semibold">
                            {typeof val === 'object' ? JSON.stringify(val) : String(val)}
                          </b>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Rules & Configurations (Inventory / Delivery / Compliance) */}
                {((selectedProduct.inventoryRules && Object.keys(selectedProduct.inventoryRules).length > 0) ||
                  (selectedProduct.deliveryRules && Object.keys(selectedProduct.deliveryRules).length > 0) ||
                  (selectedProduct.complianceRules && Object.keys(selectedProduct.complianceRules).length > 0)) && (
                  <div className="mt-3 rounded-xl bg-card border border-border p-2.5 text-xs space-y-2">
                    <p className="font-bold text-foreground border-b border-border pb-1">
                      Rules & Configurations
                    </p>

                    <div className="space-y-1.5 text-[10px]">
                      {selectedProduct.inventoryRules && Object.keys(selectedProduct.inventoryRules).length > 0 && (
                        <div className="p-2 rounded-lg bg-secondary/20 border border-border/40">
                          <span className="font-bold text-foreground block mb-0.5">Inventory Rules</span>
                          <p className="text-muted-foreground font-mono">
                            {JSON.stringify(selectedProduct.inventoryRules)}
                          </p>
                        </div>
                      )}

                      {selectedProduct.deliveryRules && Object.keys(selectedProduct.deliveryRules).length > 0 && (
                        <div className="p-2 rounded-lg bg-secondary/20 border border-border/40">
                          <span className="font-bold text-foreground block mb-0.5">Delivery Rules</span>
                          <p className="text-muted-foreground font-mono">
                            {JSON.stringify(selectedProduct.deliveryRules)}
                          </p>
                        </div>
                      )}

                      {selectedProduct.complianceRules && Object.keys(selectedProduct.complianceRules).length > 0 && (
                        <div className="p-2 rounded-lg bg-secondary/20 border border-border/40">
                          <span className="font-bold text-foreground block mb-0.5">Compliance & HSN Rules</span>
                          <p className="text-muted-foreground font-mono">
                            {JSON.stringify(selectedProduct.complianceRules)}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Keywords & Badges */}
                {((selectedProduct.tags && selectedProduct.tags.length > 0) ||
                  (selectedProduct.keywords && selectedProduct.keywords.length > 0) ||
                  (selectedProduct.badges && selectedProduct.badges.length > 0)) && (
                  <div className="mt-3 rounded-xl bg-card border border-border p-2.5 text-xs space-y-1.5">
                    <p className="font-bold text-foreground border-b border-border pb-1">
                      Tags & Badges
                    </p>

                    <div className="flex flex-wrap gap-1 pt-1">
                      {(selectedProduct.badges || []).map((b: string, i: number) => (
                        <span key={`b-${i}`} className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 font-bold text-[9px]">
                          🏷️ {b}
                        </span>
                      ))}

                      {(selectedProduct.tags || []).map((t: string, i: number) => (
                        <span key={`t-${i}`} className="px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-600 font-semibold text-[9px]">
                          #{t}
                        </span>
                      ))}

                      {(selectedProduct.keywords || []).map((k: string, i: number) => (
                        <span key={`k-${i}`} className="px-2 py-0.5 rounded-full bg-secondary text-muted-foreground text-[9px]">
                          {k}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {selectedProduct.images?.length > 1 && (
                  <div className="mt-3 rounded-xl bg-card border border-border p-2 text-xs">
                    <p className="font-bold mb-2">Gallery</p>

                    <div className="grid grid-cols-4 gap-2">
                      {selectedProduct.images.slice(0, 8).map((img: any, index: number) => (
                        <img
                          key={index}
                          src={img}
                          alt=""
                          className="w-full h-14 rounded-lg object-cover border"
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};