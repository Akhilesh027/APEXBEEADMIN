import { useEffect, useState } from 'react';
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
  const amount = share.amount !== undefined 
    ? Number(share.amount || 0) 
    : ((distributionPool || 0) * Number(share.percent || 0)) / 100;

  return (
    <div className="rounded-xl border border-border bg-card p-2.5">
      <label className="text-[10px] font-bold text-foreground block mb-1">
        {title}
      </label>

      <div className="flex flex-col gap-1.5">
        <div className="flex items-center gap-1.5">
          <input
            type="number"
            value={share.percent === undefined ? '' : share.percent}
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
  const [status, setStatus] = useState('Pending Review');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [pricing, setPricing] = useState({
    mrp: '',
    sellingPrice: '',
    platformFeePercent: '',
    vendorCommissionPercent: '',
    distributedFrom: 'platform_fee',
    shippingCharge: '',
    packingCharge: '',
    remarks: '',
    commissionShares: defaultShares,
  });

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

        // Construct unique key
        const uniqueKey = p.foodMenuItemId
          ? `food_${p.foodMenuItemId}`
          : p._id
          ? `prod_${p._id}`
          : `sku_${p.sku || p.name}`;

        const formatted = {
          ...p,
          isFoodItem: isFood,
          categoryName: p.categoryName || p.categoryId?.name || (isFood ? 'Food & Dining' : 'General Catalog'),
          vendorName: p.vendorName || p.sellerId?.name || p.sellerId?.businessName || (isFood ? 'Restaurant Partner' : 'Vendor Partner'),
          baseMrp: p.adminPricing?.mrp || p.baseMrp || p.price || 0,
          baseSellingPrice: p.adminPricing?.sellingPrice || p.baseSellingPrice || p.price || 0,
        };

        deduplicatedMap.set(uniqueKey, formatted);
      });

      // 2. Process FoodMenuItems collection (deduplicating against existing synced items)
      (foodItems || []).forEach((f: any) => {
        const foodKey = `food_${f._id}`;

        // Check if already present or matched by name + food flag
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
          deduplicatedMap.set(foodKey, {
            ...f,
            _id: f._id,
            foodMenuItemId: f._id,
            isFoodItem: true,
            categoryName: f.categoryId?.name || 'Food & Dining',
            vendorName: restName,
            baseMrp: f.basePrice,
            baseSellingPrice: f.offerPrice || f.basePrice,
            status: f.approvalStatus === 'PUBLISHED_LIVE'
              ? 'Live'
              : f.approvalStatus === 'PENDING_RESTAURANT_ACCEPTANCE'
              ? 'Awaiting Seller Approval'
              : f.approvalStatus === 'REJECTED_BY_ADMIN' || f.approvalStatus === 'REJECTED_BY_RESTAURANT'
              ? 'Rejected'
              : 'Pending Review',
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

  const openPricing = (product: any) => {
    setSelectedProduct(product);

    const existingShares = product.adminPricing?.commissionShares?.length
      ? product.adminPricing.commissionShares.filter(
          (share: any) => share.type !== 'referrer'
        )
      : defaultShares;

    setPricing({
      mrp: product.adminPricing?.mrp || product.baseMrp || '',
      sellingPrice:
        product.adminPricing?.sellingPrice || product.baseSellingPrice || '',
      platformFeePercent: product.adminPricing?.platformFeePercent || '',
      vendorCommissionPercent: product.adminPricing?.vendorCommissionPercent || product.vendorCommissionPercent || '',
      distributedFrom: product.adminPricing?.distributedFrom || 'platform_fee',
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
      await fetchProducts();
    } catch (err) {
      console.error(err);
      alert('Failed to reject product');
    } finally {
      setSaving(false);
    }
  };

  const filteredProducts = products.filter((product: any) => {
    const matchesSearch =
      product.name?.toLowerCase().includes(search.toLowerCase()) ||
      product.sku?.toLowerCase().includes(search.toLowerCase());

    const isPendingStatus = (p: any) => {
      const s = String(p.status || '').toLowerCase();
      const mod = String(p.moderationStatus || '').toLowerCase();
      return (s === 'pending review' || s === 'pending' || s === 'draft' || mod === 'pending' || p.adminPricingApproved === false) && !p.isVendorEdit && s !== 'vendor edited';
    };

    const isVendorEditStatus = (p: any) => {
      const s = String(p.status || '').toLowerCase();
      return s === 'vendor edited' || s === 'updated - pending approval' || !!p.isVendorEdit;
    };

    let matchesStatus = status === 'All';
    if (!matchesStatus) {
      if (status === 'Pending Review') {
        matchesStatus = isPendingStatus(product);
      } else if (status === 'Vendor Edited') {
        matchesStatus = isVendorEditStatus(product);
      } else if (status === 'Live') {
        const s = String(product.status || '').toLowerCase();
        const mod = String(product.moderationStatus || '').toLowerCase();
        matchesStatus = s === 'live' || s === 'active' || s === 'approved' || mod === 'approved';
      } else if (status === 'Rejected') {
        const s = String(product.status || '').toLowerCase();
        const mod = String(product.moderationStatus || '').toLowerCase();
        matchesStatus = s === 'rejected' || mod === 'rejected';
      } else {
        matchesStatus = String(product.status || '').toLowerCase() === String(status).toLowerCase();
      }
    }

    return matchesSearch && matchesStatus;
  });

  const statusTabs = [
    { key: 'All', label: 'All Products', count: products.length },
    { key: 'Pending Review', label: 'New Approvals', count: products.filter(p => (String(p.status || '').toLowerCase() === 'pending review' || String(p.status || '').toLowerCase() === 'pending' || String(p.moderationStatus || '').toLowerCase() === 'pending' || p.adminPricingApproved === false) && !p.isVendorEdit && String(p.status || '').toLowerCase() !== 'vendor edited').length },
    { key: 'Vendor Edited', label: '✏️ Vendor Edits', count: products.filter(p => String(p.status || '').toLowerCase() === 'vendor edited' || String(p.status || '').toLowerCase() === 'updated - pending approval' || p.isVendorEdit).length },
    { key: 'Negotiation Requested', label: 'Negotiation', count: products.filter(p => String(p.status || '').toLowerCase() === 'negotiation requested').length },
    { key: 'Awaiting Seller Approval', label: 'Awaiting Seller', count: products.filter(p => String(p.status || '').toLowerCase() === 'awaiting seller approval').length },
    { key: 'Live', label: 'Live Products', count: products.filter(p => String(p.status || '').toLowerCase() === 'live' || String(p.status || '').toLowerCase() === 'active' || String(p.moderationStatus || '').toLowerCase() === 'approved').length },
    { key: 'Rejected', label: 'Rejected', count: products.filter(p => String(p.status || '').toLowerCase() === 'rejected' || String(p.moderationStatus || '').toLowerCase() === 'rejected').length },
  ];

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
    <div className="space-y-6 p-6">
      <div className="bg-card border border-border rounded-2xl p-5 flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold text-foreground">
            Product Approval & Catalog Management
          </h1>

          <p className="text-xs text-muted-foreground">
            Review seller products, inspect model details, set platform fees, and configure commission splits.
          </p>
        </div>

        <div className="flex items-center gap-2 text-primary">
          <IndianRupee size={20} />
          <span className="text-xs font-bold">Admin Pricing Control</span>
        </div>
      </div>

      <div className="bg-card border border-border rounded-2xl p-4 space-y-3">
        <div className="flex flex-col md:flex-row gap-3 justify-between items-center">
          <div className="relative w-full md:w-80">
            <Search
              size={15}
              className="absolute left-3 top-2.5 text-muted-foreground"
            />

            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search product name or SKU..."
              className="w-full pl-9 pr-3 py-2 rounded-xl border border-border bg-background text-xs outline-none focus:border-primary"
            />
          </div>

          <div className="text-xs text-muted-foreground font-semibold">
            Showing <b className="text-foreground">{filteredProducts.length}</b> of <b className="text-foreground">{products.length}</b> products
          </div>
        </div>

        {/* Filtering Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-border">
          {statusTabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setStatus(t.key)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                status === t.key
                  ? 'bg-primary text-primary-foreground shadow-sm'
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

      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        <table className="w-full text-xs text-left">
          <thead className="bg-secondary/40 text-muted-foreground">
            <tr>
              <th className="p-3">Product</th>
              <th className="p-3">Seller</th>
              <th className="p-3">Category</th>
              <th className="p-3">Seller Price</th>
              <th className="p-3">Admin Price</th>
              <th className="p-3">Status</th>
              <th className="p-3 text-right">Actions</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-border">
            {filteredProducts.map((product) => (
              <tr key={product._id} className="hover:bg-secondary/20">
                <td className="p-3">
                  <div className="flex items-center gap-3">
                    {getProductImage(product) ? (
                      <img
                        src={getProductImage(product)}
                        alt={product.name}
                        className="w-10 h-10 rounded-lg object-cover border"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-lg bg-secondary" />
                    )}

                    <div>
                      <p className="font-bold">{product.name}</p>
                      <p className="text-[10px] text-muted-foreground">
                        SKU: {product.sku}
                      </p>
                    </div>
                  </div>
                </td>

                <td className="p-3">
                  <p className="font-semibold">
                    {product.sellerId?.name || '-'}
                  </p>

                  <p className="text-[10px] text-muted-foreground">
                    {product.sellerType}
                  </p>
                </td>

                <td className="p-3 text-muted-foreground">
                  {getCategoryPath(product)}
                </td>

                <td className="p-3">
                  <p>MRP: ₹{product.baseMrp}</p>
                  <p>Selling: ₹{product.baseSellingPrice}</p>
                </td>

                <td className="p-3">
                  {product.adminPricing ? (
                    <>
                      <p>₹{product.adminPricing.sellingPrice}</p>

                      <p className="text-[10px] text-muted-foreground">
                        Seller gets ₹{Number(product.adminPricing.finalSellerAmount || 0).toFixed(2)}
                      </p>
                    </>
                  ) : (
                    <span className="text-muted-foreground">Not set</span>
                  )}
                </td>

                <td className="p-3">
                  <StatusBadge status={product.status} />
                </td>

                <td className="p-3">
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => openPricing(product)}
                      className="p-2 rounded-lg bg-primary/10 text-primary"
                    >
                      <Eye size={14} />
                    </button>

                    <button
                       onClick={() => handleReject(product)}
                       disabled={saving}
                       className={`p-2 rounded-lg bg-rose-500/10 text-rose-500 ${saving ? 'opacity-50 cursor-not-allowed' : ''}`}
                     >
                       <XCircle size={14} />
                     </button>
                  </div>
                </td>
              </tr>
            ))}

            {loading ? (
              <tr>
                <td colSpan={7} className="p-10 text-center">
                  <div className="flex flex-col items-center gap-3 text-muted-foreground">
                    <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
                    <span className="text-xs font-semibold">
                      Loading products...
                    </span>
                  </div>
                </td>
              </tr>
            ) : filteredProducts.length === 0 ? (
              <tr>
                <td
                  colSpan={7}
                  className="p-10 text-center text-muted-foreground font-medium"
                >
                  No products found.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

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
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-6 gap-2">
                  <SummaryCard
                    title="ApexBee Comm"
                    value={`₹${vendorCommissionAmount.toFixed(2)}`}
                    icon={IndianRupee}
                    color="text-amber-500"
                  />

                  <SummaryCard
                    title="Platform Fee"
                    value={`₹${platformFeeAmount.toFixed(2)}`}
                    icon={IndianRupee}
                  />

                  <SummaryCard
                    title="Pool Target"
                    value={`₹${distributionPool.toFixed(2)}`}
                    icon={Network}
                    color="text-indigo-500"
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

                <div className="rounded-2xl border border-border bg-secondary/10 p-3">
                  <h3 className="text-[11px] font-bold uppercase text-foreground mb-2 flex items-center gap-1">
                    <Network size={13} />
                    Referral Network Commission
                  </h3>

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