import React, { useState, useEffect, useMemo } from 'react';
import { useAdminState } from '../context/AdminStateContext';
import { couponService } from '../services/couponService';
import {
  Plus,
  Trash2,
  Ticket,
  Percent,
  Sparkles,
  AlertCircle,
  Eye,
  ToggleLeft,
  ToggleRight,
  Search,
  Copy,
  Check,
  RefreshCw,
  Loader2,
  Calendar,
  Store,
  Globe
} from 'lucide-react';
import { MetricCard } from '../components/MetricCard';

export const CouponManagement: React.FC = () => {
  const { sellers } = useAdminState();

  // State
  const [coupons, setCoupons] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Filters & Search
  const [search, setSearch] = useState<string>('');
  const [activeTab, setActiveTab] = useState<string>('All');

  // Form State
  const [code, setCode] = useState('');
  const [discountType, setDiscountType] = useState<'percentage' | 'flat'>('percentage');
  const [discountValue, setDiscountValue] = useState<number>(10);
  const [minSubtotal, setMinSubtotal] = useState<number>(499);
  const [maxDiscountAmount, setMaxDiscountAmount] = useState<string>('');
  const [expiryDate, setExpiryDate] = useState('');
  const [usageLimit, setUsageLimit] = useState<number>(1000);
  const [userLimit, setUserLimit] = useState<number>(1);
  const [scope, setScope] = useState<'platform' | 'vendor'>('platform');
  const [vendorId, setVendorId] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Fetch Coupons from Backend
  const loadCoupons = async () => {
    try {
      setLoading(true);
      const data = await couponService.getAll();
      setCoupons(data || []);
    } catch (err: any) {
      console.error('Error fetching coupons:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCoupons();
  }, []);

  // Filtered List
  const filteredCoupons = useMemo(() => {
    return coupons.filter((c) => {
      const matchesSearch =
        c.code?.toLowerCase().includes(search.toLowerCase()) ||
        (c.vendorId?.businessName || c.vendorId?.name || '').toLowerCase().includes(search.toLowerCase());

      if (!matchesSearch) return false;

      if (activeTab === 'All') return true;
      if (activeTab === 'Active') return c.status === 'Active';
      if (activeTab === 'Inactive') return c.status === 'Inactive' || c.status === 'Expired';
      if (activeTab === 'Global') return c.scope === 'platform';
      if (activeTab === 'Vendor') return c.scope === 'vendor';

      return true;
    });
  }, [coupons, search, activeTab]);

  // Metrics
  const stats = useMemo(() => {
    const active = coupons.filter((c) => c.status === 'Active').length;
    const totalUsage = coupons.reduce((sum, c) => sum + (c.usageCount || 0), 0);
    const globalCount = coupons.filter((c) => c.scope === 'platform').length;
    const totalSavings = coupons.reduce((sum, c) => {
      const val = c.discountType === 'percentage' ? (c.usageCount || 0) * 50 : (c.usageCount || 0) * (c.discountValue || 0);
      return sum + val;
    }, 0);

    return { active, totalUsage, globalCount, vendorCount: coupons.length - globalCount, totalSavings };
  }, [coupons]);

  // Handle Copy Code
  const handleCopy = (cCode: string) => {
    navigator.clipboard.writeText(cCode);
    setCopiedCode(cCode);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  // Handle Toggle Status
  const handleToggleStatus = async (coupon: any) => {
    try {
      const newStatus = coupon.status === 'Active' ? 'Inactive' : 'Active';
      await couponService.update(coupon._id, { status: newStatus });
      setCoupons((prev) =>
        prev.map((item) => (item._id === coupon._id ? { ...item, status: newStatus } : item))
      );
    } catch (err: any) {
      alert(`Failed to update status: ${err.message}`);
    }
  };

  // Handle Delete
  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this promo coupon?')) return;
    try {
      await couponService.delete(id);
      setCoupons((prev) => prev.filter((c) => c._id !== id));
    } catch (err: any) {
      alert(`Failed to delete coupon: ${err.message}`);
    }
  };

  // Handle Form Submit
  const handleCreateCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!code.trim()) {
      setErrorMsg('Coupon code is required.');
      return;
    }
    const cleanCode = code.trim().toUpperCase();

    if (coupons.some((c) => c.code === cleanCode)) {
      setErrorMsg('A coupon with this code already exists.');
      return;
    }
    if (discountValue <= 0) {
      setErrorMsg('Discount value must be greater than zero.');
      return;
    }
    if (discountType === 'percentage' && discountValue > 100) {
      setErrorMsg('Percentage discount cannot exceed 100%.');
      return;
    }
    if (!expiryDate) {
      setErrorMsg('Expiry Date is required.');
      return;
    }
    if (scope === 'vendor' && !vendorId) {
      setErrorMsg('Please select a vendor store for vendor-scoped coupons.');
      return;
    }

    setSubmitting(true);
    try {
      const payload: any = {
        code: cleanCode,
        discountType,
        discountValue,
        minSubtotal,
        minOrderAmount: minSubtotal,
        maxDiscountAmount: maxDiscountAmount ? Number(maxDiscountAmount) : 999999,
        expiryDate,
        usageLimit,
        userLimit,
        scope,
        status: 'Active',
      };

      if (scope === 'vendor' && vendorId) {
        payload.vendorId = vendorId;
      }

      const created = await couponService.create(payload);
      setCoupons((prev) => [created, ...prev]);

      setSuccessMsg(`Coupon '${cleanCode}' registered successfully!`);
      // Reset
      setCode('');
      setDiscountType('percentage');
      setDiscountValue(10);
      setMinSubtotal(499);
      setMaxDiscountAmount('');
      setExpiryDate('');
      setUsageLimit(1000);
      setUserLimit(1);
      setScope('platform');
      setVendorId('');
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || err.message || 'Failed to create coupon.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 p-2 md:p-4">
      {/* Page Title & Controls */}
      <div className="bg-card border border-border rounded-2xl p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
        <div>
          <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
            <Ticket className="text-primary" size={22} />
            Coupon & Promo Management
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Configure platform discounts, targeted vendor coupons, usage thresholds, and active promo campaigns.
          </p>
        </div>

        <button
          onClick={loadCoupons}
          disabled={loading}
          className="px-3.5 py-2 rounded-xl bg-secondary hover:bg-secondary/80 text-foreground text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          Reload Catalog
        </button>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="TOTAL PROMO SAVINGS"
          value={`₹${stats.totalSavings.toLocaleString('en-IN')}`}
          icon={Percent}
          subtext="Estimated savings given to shoppers"
          theme="emerald"
        />
        <MetricCard
          title="COUPON USAGE COUNT"
          value={stats.totalUsage.toLocaleString('en-IN')}
          icon={Ticket}
          subtext="Total checkouts using promos"
          theme="primary"
        />
        <MetricCard
          title="ACTIVE PROMO CODES"
          value={stats.active}
          icon={Sparkles}
          subtext="Codes currently redeemable live"
          theme="violet"
        />
        <MetricCard
          title="PLATFORM VS VENDOR"
          value={`${stats.globalCount} / ${stats.vendorCount}`}
          icon={Eye}
          subtext="Distribution (Platform / Vendor)"
          theme="amber"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Side: Coupon Directory Table - 8 Columns */}
        <div className="lg:col-span-8 bg-card border border-border rounded-2xl overflow-hidden shadow-sm flex flex-col">
          {/* Filter & Search Header */}
          <div className="p-4 border-b border-border space-y-3 bg-secondary/10">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-3">
              <div className="relative w-full sm:w-72">
                <Search size={14} className="absolute left-3 top-2.5 text-muted-foreground" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search promo code or store..."
                  className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-border bg-background text-xs outline-none focus:border-primary"
                />
              </div>

              <span className="text-xs text-muted-foreground font-semibold">
                Showing <b>{filteredCoupons.length}</b> of <b>{coupons.length}</b> coupons
              </span>
            </div>

            {/* Filter Tabs */}
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              {[
                { key: 'All', label: 'All', count: coupons.length },
                { key: 'Active', label: 'Active', count: stats.active },
                { key: 'Inactive', label: 'Inactive / Expired', count: coupons.length - stats.active },
                { key: 'Global', label: 'Platform Global', count: stats.globalCount },
                { key: 'Vendor', label: 'Vendor Specific', count: stats.vendorCount },
              ].map((t) => (
                <button
                  key={t.key}
                  onClick={() => setActiveTab(t.key)}
                  className={`px-3 py-1 rounded-xl text-[11px] font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                    activeTab === t.key
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'bg-secondary/40 text-muted-foreground hover:bg-secondary hover:text-foreground'
                  }`}
                >
                  <span>{t.label}</span>
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[9px] font-bold ${
                      activeTab === t.key ? 'bg-white/20 text-white' : 'bg-secondary text-foreground border border-border/40'
                    }`}
                  >
                    {t.count}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-secondary/30 text-muted-foreground border-b border-border select-none">
                <tr>
                  <th className="p-3">Code / ID</th>
                  <th className="p-3">Discount</th>
                  <th className="p-3">Min Order</th>
                  <th className="p-3">Expiry</th>
                  <th className="p-3">Scope</th>
                  <th className="p-3">Redemptions</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-center">Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-border">
                {filteredCoupons.map((c) => {
                  const isExpired = c.status === 'Expired' || (c.expiryDate && new Date(c.expiryDate) < new Date());
                  const isPercentage = ['percentage', 'Percentage'].includes(c.discountType);

                  return (
                    <tr key={c._id || c.id} className="hover:bg-secondary/20 transition-colors">
                      {/* Code */}
                      <td className="p-3">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono font-black text-primary text-xs bg-primary/10 px-2 py-0.5 rounded-lg border border-primary/20">
                            {c.code}
                          </span>
                          <button
                            onClick={() => handleCopy(c.code)}
                            className="p-1 hover:bg-secondary rounded text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                            title="Copy code"
                          >
                            {copiedCode === c.code ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
                          </button>
                        </div>
                      </td>

                      {/* Discount Payout */}
                      <td className="p-3 font-semibold">
                        <span>{isPercentage ? `${c.discountValue}% OFF` : `₹${c.discountValue} OFF`}</span>
                        {c.maxDiscountAmount && c.maxDiscountAmount < 999999 && (
                          <span className="text-[9px] text-muted-foreground block font-normal">
                            Cap: ₹{c.maxDiscountAmount}
                          </span>
                        )}
                      </td>

                      {/* Min Order */}
                      <td className="p-3 font-mono">
                        <span>₹{c.minSubtotal || c.minOrderAmount || 0}</span>
                      </td>

                      {/* Expiry */}
                      <td className="p-3 text-[10px] text-muted-foreground">
                        <span className="flex items-center gap-1 font-mono">
                          <Calendar size={11} /> {c.expiryDate ? c.expiryDate.split('T')[0] : 'No Expiry'}
                        </span>
                      </td>

                      {/* Scope */}
                      <td className="p-3">
                        <span
                          className={`px-2 py-0.5 text-[9px] font-extrabold rounded-md inline-flex items-center gap-1 ${
                            c.scope === 'platform' || c.scope === 'Global'
                              ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20'
                              : 'bg-amber-500/10 text-amber-600 border border-amber-500/20'
                          }`}
                        >
                          {c.scope === 'platform' || c.scope === 'Global' ? <Globe size={9} /> : <Store size={9} />}
                          {c.scope === 'platform' || c.scope === 'Global' ? 'Platform' : 'Vendor'}
                        </span>
                        {c.vendorId && (
                          <span className="text-[9px] text-muted-foreground block truncate max-w-[110px] mt-0.5">
                            {c.vendorId?.businessName || c.vendorId?.name || 'Vendor Store'}
                          </span>
                        )}
                      </td>

                      {/* Redemptions */}
                      <td className="p-3 font-mono">
                        <span>{c.usageCount || 0} / {c.usageLimit || '∞'}</span>
                      </td>

                      {/* Status */}
                      <td className="p-3">
                        <span
                          className={`px-2 py-0.5 text-[9px] font-bold rounded-lg ${
                            c.status === 'Active' && !isExpired
                              ? 'bg-emerald-500/10 text-emerald-600'
                              : isExpired
                              ? 'bg-rose-500/10 text-rose-600'
                              : 'bg-secondary text-muted-foreground'
                          }`}
                        >
                          {isExpired ? 'Expired' : c.status}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="p-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => handleToggleStatus(c)}
                            disabled={isExpired}
                            className="p-1.5 hover:bg-secondary rounded text-muted-foreground hover:text-foreground transition-colors cursor-pointer disabled:opacity-30"
                            title={c.status === 'Active' ? 'Deactivate Coupon' : 'Activate Coupon'}
                          >
                            {c.status === 'Active' ? <ToggleRight size={18} className="text-emerald-500" /> : <ToggleLeft size={18} />}
                          </button>

                          <button
                            onClick={() => handleDelete(c._id)}
                            className="p-1.5 hover:bg-rose-500/10 text-muted-foreground hover:text-rose-500 rounded transition-colors cursor-pointer"
                            title="Delete Coupon"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}

                {loading && (
                  <tr>
                    <td colSpan={8} className="p-10 text-center text-muted-foreground">
                      <div className="flex flex-col items-center gap-2">
                        <Loader2 className="w-5 h-5 animate-spin text-primary" />
                        <span className="text-xs font-semibold">Loading coupons catalog...</span>
                      </div>
                    </td>
                  </tr>
                )}

                {!loading && filteredCoupons.length === 0 && (
                  <tr>
                    <td colSpan={8} className="p-10 text-center text-xs text-muted-foreground">
                      No coupons found matching your criteria. Use the form on the right to configure a new promo code.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Side: Create Coupon Panel - 4 Columns */}
        <div className="lg:col-span-4 bg-card border border-border rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex items-center gap-2 border-b border-border pb-3">
            <Ticket className="text-primary shrink-0" size={18} />
            <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">Configure Promo Coupon</h3>
          </div>

          {errorMsg && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-500 rounded-xl flex items-start gap-1.5 text-[11px] font-medium animate-shake">
              <AlertCircle size={14} className="shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 rounded-xl flex items-start gap-1.5 text-[11px] font-medium">
              <Check size={14} className="shrink-0 mt-0.5" />
              <span>{successMsg}</span>
            </div>
          )}

          <form onSubmit={handleCreateCoupon} className="space-y-4 text-xs">
            {/* Promo Code Name */}
            <div className="space-y-1">
              <label className="text-muted-foreground block font-medium">Promo Coupon Code *</label>
              <input
                type="text"
                placeholder="e.g. WELCOME100, DIWALI2026"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                className="w-full p-2.5 border border-border focus:border-primary rounded-xl bg-background text-foreground outline-none font-mono uppercase font-bold"
                required
              />
            </div>

            {/* Discount Type & Value */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-muted-foreground block font-medium">Discount Type *</label>
                <select
                  value={discountType}
                  onChange={(e) => {
                    setDiscountType(e.target.value as 'percentage' | 'flat');
                    setDiscountValue(e.target.value === 'percentage' ? 10 : 100);
                  }}
                  className="w-full p-2.5 border border-border focus:border-primary rounded-xl bg-background text-foreground outline-none font-semibold cursor-pointer"
                >
                  <option value="percentage">Percentage (%)</option>
                  <option value="flat">Fixed Flat Price (₹)</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-muted-foreground block font-medium">
                  {discountType === 'percentage' ? 'Percent Off (%)' : 'Rupee Off (₹)'} *
                </label>
                <input
                  type="number"
                  min="1"
                  value={discountValue}
                  onChange={(e) => setDiscountValue(Number(e.target.value))}
                  className="w-full p-2.5 border border-border focus:border-primary rounded-xl bg-background text-foreground outline-none font-mono"
                  required
                />
              </div>
            </div>

            {/* Min Subtotal & Max Cap */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-muted-foreground block font-medium">Min Order (₹)</label>
                <input
                  type="number"
                  min="0"
                  placeholder="₹499"
                  value={minSubtotal}
                  onChange={(e) => setMinSubtotal(Number(e.target.value))}
                  className="w-full p-2.5 border border-border focus:border-primary rounded-xl bg-background text-foreground outline-none font-mono"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-muted-foreground block font-medium">Max Discount Cap (₹)</label>
                <input
                  type="number"
                  min="1"
                  placeholder={discountType === 'percentage' ? 'e.g. 150' : 'N/A'}
                  value={maxDiscountAmount}
                  onChange={(e) => setMaxDiscountAmount(e.target.value)}
                  disabled={discountType === 'flat'}
                  className="w-full p-2.5 border border-border focus:border-primary rounded-xl bg-background text-foreground outline-none font-mono disabled:opacity-40"
                />
              </div>
            </div>

            {/* Scope Selection */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-muted-foreground block font-medium">Scope *</label>
                <select
                  value={scope}
                  onChange={(e) => {
                    setScope(e.target.value as 'platform' | 'vendor');
                    setVendorId('');
                  }}
                  className="w-full p-2.5 border border-border focus:border-primary rounded-xl bg-background text-foreground outline-none font-semibold cursor-pointer"
                >
                  <option value="platform">Platform Global</option>
                  <option value="vendor">Specific Vendor</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-muted-foreground block font-medium">Total Usage Limit</label>
                <input
                  type="number"
                  min="1"
                  value={usageLimit}
                  onChange={(e) => setUsageLimit(Number(e.target.value))}
                  className="w-full p-2.5 border border-border focus:border-primary rounded-xl bg-background text-foreground outline-none font-mono"
                  required
                />
              </div>
            </div>

            {/* Conditional Vendor Selector */}
            {scope === 'vendor' && (
              <div className="space-y-1">
                <label className="text-muted-foreground block font-medium">Select Vendor Store *</label>
                <select
                  value={vendorId}
                  onChange={(e) => setVendorId(e.target.value)}
                  className="w-full p-2.5 border border-border focus:border-primary rounded-xl bg-background text-foreground outline-none font-semibold cursor-pointer"
                  required
                >
                  <option value="">-- Choose Vendor Store --</option>
                  {sellers
                    .filter((s) => s.status === 'Approved')
                    .map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.businessName} ({s.ownerName})
                      </option>
                    ))}
                </select>
              </div>
            )}

            {/* Validity Expiry Date */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-muted-foreground block font-medium">Expiry Date *</label>
                <input
                  type="date"
                  value={expiryDate}
                  onChange={(e) => setExpiryDate(e.target.value)}
                  className="w-full p-2.5 border border-border focus:border-primary rounded-xl bg-background text-foreground outline-none font-mono cursor-pointer"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-muted-foreground block font-medium">User Per Limit</label>
                <input
                  type="number"
                  min="1"
                  value={userLimit}
                  onChange={(e) => setUserLimit(Number(e.target.value))}
                  className="w-full p-2.5 border border-border focus:border-primary rounded-xl bg-background text-foreground outline-none font-mono"
                  required
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-2.5 bg-primary hover:bg-primary/95 text-primary-foreground font-bold rounded-xl transition-all shadow-md shadow-primary/10 flex items-center justify-center gap-1.5 mt-2 cursor-pointer disabled:opacity-50"
            >
              {submitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <Plus size={16} /> Register Promo Coupon
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
