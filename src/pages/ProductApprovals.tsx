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
  { type: 'state', label: 'State Franchise', percent: 10 },
  { type: 'district', label: 'District Franchise', percent: 10 },
  { type: 'mandal', label: 'Mandal Franchise', percent: 10 },
  { type: 'entrepreneur', label: 'Entrepreneur', percent: 10 },
  { type: 'level1', label: 'Level 1 Referral', percent: 10 },
  { type: 'level2', label: 'Level 2 Referral', percent: 5 },
  { type: 'level3', label: 'Level 3 Referral', percent: 5 },
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

const CommissionCard = ({ title, share, index, updateShare, platformFeeAmount }: any) => {
  const amount = share.amount !== undefined 
    ? Number(share.amount || 0) 
    : (platformFeeAmount * Number(share.percent || 0)) / 100;

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
    shippingCharge: '',
    packingCharge: '',
    remarks: '',
    commissionShares: defaultShares,
  });

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const data = await productService.getAll();
      setProducts(data || []);
    } catch (err) {
      console.error(err);
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
      shippingCharge: product.adminPricing?.shippingCharge || '',
      packingCharge: product.adminPricing?.packingCharge || '',
      remarks: product.adminPricing?.remarks || '',
      commissionShares: existingShares,
    });
  };

  const platformFeeAmount =
    (Number(pricing.sellingPrice || 0) *
      Number(pricing.platformFeePercent || 0)) /
    100;

  const calculatedShares = pricing.commissionShares.map((share) => {
    const pct = Number(share.percent || 0);
    const amount = (platformFeeAmount === 0 && share.amount !== undefined)
      ? Number(share.amount || 0)
      : (platformFeeAmount * pct) / 100;

    return {
      ...share,
      percent: pct,
      amount: amount,
      isActive: true,
    };
  });

  const totalCommissionAmount = calculatedShares.reduce(
    (sum, item) => sum + Number(item.amount || 0),
    0
  );

  const shippingPacking =
    Number(pricing.shippingCharge || 0) + Number(pricing.packingCharge || 0);

  const finalSellerAmount =
    Number(pricing.sellingPrice || 0) -
    platformFeeAmount;

  const platformNetProfit = platformFeeAmount - totalCommissionAmount;

  const updateShare = (index: number, key: string, value: any) => {
    const updated = [...pricing.commissionShares] as any[];
    const item = { ...updated[index] };

    if (key === 'percent') {
      const pct = Number(value || 0);
      item.percent = value;
      item.amount = (platformFeeAmount * pct) / 100;
    } else if (key === 'amount') {
      const amt = Number(value || 0);
      item.amount = value;
      item.percent = platformFeeAmount > 0 
        ? Number(((amt / platformFeeAmount) * 100).toFixed(4)) 
        : 0;
    } else {
      (item as any)[key] = value;
    }

    updated[index] = item;
    setPricing({ ...pricing, commissionShares: updated });
  };

  const getProductImage = (product: any) =>
    product.thumbnail || product.images?.[0] || '';

  const getCategoryPath = (product: any) =>
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
      await productService.configureAdminPricing(selectedProduct._id, {
        mrp: Number(pricing.mrp),
        sellingPrice: Number(pricing.sellingPrice),
        platformFeePercent: Number(pricing.platformFeePercent),
        platformFeeAmount,
        shippingCharge: Number(pricing.shippingCharge || 0),
        packingCharge: Number(pricing.packingCharge || 0),
        commissionShares: calculatedShares,
        totalCommissionAmount,
        finalSellerAmount,
        remarks: pricing.remarks,
      });

      setSelectedProduct(null);
      await fetchProducts();
    } catch (err) {
      console.error(err);
      alert('Failed to configure pricing');
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

    const matchesStatus = status === 'All' || product.status === status;

    return matchesSearch && matchesStatus;
  });

  const franchiseShares = pricing.commissionShares.filter((share) =>
    ['state', 'district', 'mandal', 'entrepreneur'].includes(share.type)
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
            Product Approval
          </h1>

          <p className="text-xs text-muted-foreground">
            Review seller products, set platform fee, shipping, packing and commission distribution.
          </p>
        </div>

        <div className="flex items-center gap-2 text-primary">
          <IndianRupee size={20} />
          <span className="text-xs font-bold">Admin Pricing Control</span>
        </div>
      </div>

      <div className="bg-card border border-border rounded-2xl p-4 flex flex-col md:flex-row gap-3 justify-between">
        <div className="relative w-full md:w-80">
          <Search
            size={15}
            className="absolute left-3 top-2.5 text-muted-foreground"
          />

          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search product or SKU..."
            className="w-full pl-9 pr-3 py-2 rounded-xl border border-border bg-background text-xs outline-none"
          />
        </div>

        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="px-3 py-2 rounded-xl border border-border bg-background text-xs"
        >
          <option value="All">All</option>
          <option value="Pending Review">Pending Review</option>
          <option value="Negotiation Requested">Negotiation Requested</option>
          <option value="Awaiting Seller Approval">
            Awaiting Seller Approval
          </option>
          <option value="Live">Live</option>
          <option value="Rejected">Rejected</option>
        </select>
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
                        Seller gets ₹{product.adminPricing.finalSellerAmount}
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
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3">
          <div className="bg-card border border-border rounded-2xl max-w-7xl w-full p-4 h-[92vh] overflow-hidden flex flex-col">
            <div className="flex justify-between items-center border-b border-border pb-3 mb-3">
              <div>
                <h2 className="text-sm font-bold">
                  Configure Pricing - {selectedProduct.name}
                </h2>

                <p className="text-[10px] text-muted-foreground">
                  Left side: pricing engine. Right side: product verification.
                </p>
              </div>

              <button
                onClick={() => setSelectedProduct(null)}
                className="text-xs text-muted-foreground"
              >
                Close
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_0.8fr] gap-4 flex-1 overflow-hidden">
              <div className="space-y-3 overflow-y-auto pr-1">
                <div className="rounded-2xl border border-border bg-secondary/10 p-3">
                  <h3 className="text-[11px] font-bold uppercase text-foreground mb-3 flex items-center gap-1">
                    <Tags size={13} />
                    Product Pricing
                  </h3>

                  <div className="grid grid-cols-5 gap-2">
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

                <div className="grid grid-cols-5 gap-2">
                  <SummaryCard
                    title="Platform Fee"
                    value={`₹${platformFeeAmount.toFixed(2)}`}
                    icon={IndianRupee}
                  />

                  <SummaryCard
                    title="Distributed"
                    value={`₹${totalCommissionAmount.toFixed(2)}`}
                    icon={Network}
                  />

                  <SummaryCard
                    title="Ship + Pack"
                    value={`₹${shippingPacking.toFixed(2)}`}
                    icon={Truck}
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
                        ? 'text-indigo-600'
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
                          platformFeeAmount={platformFeeAmount}
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
                          platformFeeAmount={platformFeeAmount}
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
                          platformFeeAmount={platformFeeAmount}
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