import React, { useState } from 'react';
import { useAdminState } from '../context/AdminStateContext';
import { Coupon } from '../types';
import { Plus, Trash2, Ticket, Percent, Sparkles, AlertCircle, Eye, ToggleLeft, ToggleRight } from 'lucide-react';
import { MetricCard } from '../components/MetricCard';

export const CouponManagement: React.FC = () => {
  const { coupons, addCoupon, toggleCouponStatus, deleteCoupon, sellers } = useAdminState();

  // Create Coupon Form State
  const [code, setCode] = useState('');
  const [discountType, setDiscountType] = useState<'fixed' | 'percentage'>('percentage');
  const [discountValue, setDiscountValue] = useState<number>(10);
  const [minOrderValue, setMinOrderValue] = useState<number>(499);
  const [maxDiscount, setMaxDiscount] = useState<string>(''); // string to handle empty easily
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [usageLimit, setUsageLimit] = useState<number>(1000);
  const [scope, setScope] = useState<'Global' | 'Vendor'>('Global');
  const [vendorName, setVendorName] = useState('');
  
  const [errorMsg, setErrorMsg] = useState('');

  // Calculate stats
  const totalSavings = coupons.reduce((sum, c) => sum + c.totalSavings, 0);
  const totalUsage = coupons.reduce((sum, c) => sum + c.usageCount, 0);
  const activeCount = coupons.filter(c => c.status === 'Active').length;
  const globalCount = coupons.filter(c => c.scope === 'Global').length;

  const handleCreateCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    // Validations
    if (!code.trim()) {
      setErrorMsg('Coupon code is required.');
      return;
    }
    const cleanCode = code.trim().toUpperCase();
    if (coupons.some(c => c.code === cleanCode)) {
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
    if (minOrderValue < 0) {
      setErrorMsg('Minimum order value cannot be negative.');
      return;
    }
    if (!startDate || !endDate) {
      setErrorMsg('Start and End dates are required.');
      return;
    }
    if (new Date(startDate) > new Date(endDate)) {
      setErrorMsg('Start date must be on or before the End date.');
      return;
    }
    if (usageLimit <= 0) {
      setErrorMsg('Usage limit must be greater than zero.');
      return;
    }
    if (scope === 'Vendor' && !vendorName) {
      setErrorMsg('Please select a vendor for this coupon scope.');
      return;
    }

    const newCoupon: Coupon = {
      id: `CPN-${Math.floor(100 + Math.random() * 900)}`,
      code: cleanCode,
      discountType,
      discountValue,
      minOrderValue,
      maxDiscount: maxDiscount ? Number(maxDiscount) : undefined,
      startDate,
      endDate,
      usageLimit,
      usageCount: 0,
      totalSavings: 0,
      status: new Date(endDate) < new Date() ? 'Expired' : 'Active',
      scope,
      vendorName: scope === 'Vendor' ? vendorName : undefined
    };

    addCoupon(newCoupon);

    // Reset Form
    setCode('');
    setDiscountType('percentage');
    setDiscountValue(10);
    setMinOrderValue(499);
    setMaxDiscount('');
    setStartDate('');
    setEndDate('');
    setUsageLimit(1000);
    setScope('Global');
    setVendorName('');
  };

  return (
    <div className="space-y-6">
      
      {/* Overview Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="TOTAL PROMO SAVINGS"
          value={`₹${totalSavings.toLocaleString('en-IN')}`}
          icon={Percent}
          subtext="Savings passed to buyers"
          theme="emerald"
        />
        <MetricCard
          title="COUPON USAGE COUNT"
          value={totalUsage.toLocaleString('en-IN')}
          icon={Ticket}
          subtext="Total promotional checkouts"
          theme="primary"
        />
        <MetricCard
          title="ACTIVE PROMO CODES"
          value={activeCount}
          icon={Sparkles}
          subtext="Codes currently redeemable"
          theme="violet"
        />
        <MetricCard
          title="GLOBAL VS VENDOR CODES"
          value={`${globalCount} / ${coupons.length - globalCount}`}
          icon={Eye}
          subtext="Scope distribution (Global/Vendor)"
          theme="amber"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Side: Coupon list table - 8 Columns */}
        <div className="lg:col-span-8 bg-card border border-border/80 rounded-2xl overflow-hidden shadow-sm flex flex-col justify-between">
          <div className="px-5 py-4 border-b border-border/60 bg-secondary/10 flex justify-between items-center select-none">
            <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">Registered Coupon Catalog</h3>
            <span className="text-[10px] text-muted-foreground">{coupons.length} coupons recorded</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-xs text-foreground">
              <thead className="bg-secondary/40 select-none">
                <tr>
                  <th className="p-3 font-semibold text-muted-foreground">Code / Details</th>
                  <th className="p-3 font-semibold text-muted-foreground">Discount Payout</th>
                  <th className="p-3 font-semibold text-muted-foreground">Thresholds</th>
                  <th className="p-3 font-semibold text-muted-foreground">Validity Window</th>
                  <th className="p-3 font-semibold text-muted-foreground">Scope</th>
                  <th className="p-3 font-semibold text-muted-foreground">Usage</th>
                  <th className="p-3 font-semibold text-muted-foreground">Status</th>
                  <th className="p-3 font-semibold text-muted-foreground text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {coupons.map(coupon => {
                  const isExpired = coupon.status === 'Expired' || new Date(coupon.endDate) < new Date();
                  const currentStatus = isExpired ? 'Expired' : coupon.status;

                  return (
                    <tr key={coupon.id} className="hover:bg-secondary/10">
                      {/* Code */}
                      <td className="p-3">
                        <span className="font-mono font-bold text-indigo-500 text-xs bg-indigo-500/10 px-2 py-0.5 rounded-lg block w-max">
                          {coupon.code}
                        </span>
                        <span className="text-[10px] text-muted-foreground mt-0.5 block font-sans">
                          ID: {coupon.id}
                        </span>
                      </td>

                      {/* Discount Payout */}
                      <td className="p-3">
                        <span className="font-semibold block">
                          {coupon.discountType === 'percentage' ? `${coupon.discountValue}% Off` : `₹${coupon.discountValue} Off`}
                        </span>
                        {coupon.maxDiscount && (
                          <span className="text-[9px] text-muted-foreground">
                            Max Cap: ₹{coupon.maxDiscount}
                          </span>
                        )}
                      </td>

                      {/* Min Purchase Threshold */}
                      <td className="p-3 font-mono">
                        <span>₹{coupon.minOrderValue}</span>
                        <span className="text-[9px] text-muted-foreground block font-sans">Min order</span>
                      </td>

                      {/* Dates */}
                      <td className="p-3 text-[10px] text-muted-foreground">
                        <span className="block font-mono">Start: {coupon.startDate}</span>
                        <span className="block font-mono">End: {coupon.endDate}</span>
                      </td>

                      {/* Scope */}
                      <td className="p-3">
                        <span className={`px-2 py-0.5 text-[9px] font-bold rounded-lg block w-max ${
                          coupon.scope === 'Global' 
                            ? 'bg-emerald-500/10 text-emerald-500' 
                            : 'bg-amber-500/10 text-amber-500'
                        }`}>
                          {coupon.scope}
                        </span>
                        {coupon.vendorName && (
                          <span className="text-[9px] text-muted-foreground block truncate max-w-[100px] mt-0.5" title={coupon.vendorName}>
                            {coupon.vendorName}
                          </span>
                        )}
                      </td>

                      {/* Usage and Savings */}
                      <td className="p-3">
                        <div className="flex flex-col">
                          <span className="font-mono">{coupon.usageCount} / {coupon.usageLimit}</span>
                          <span className="text-[9px] text-emerald-500 mt-0.5">Saved: ₹{coupon.totalSavings.toLocaleString('en-IN')}</span>
                        </div>
                      </td>

                      {/* Status badge */}
                      <td className="p-3">
                        <span className={`px-2 py-0.5 text-[9px] font-bold rounded-lg ${
                          currentStatus === 'Active' 
                            ? 'bg-emerald-500/10 text-emerald-500' 
                            : currentStatus === 'Expired' 
                              ? 'bg-rose-500/10 text-rose-500' 
                              : 'bg-muted text-muted-foreground'
                        }`}>
                          {currentStatus}
                        </span>
                      </td>

                      {/* Action buttons */}
                      <td className="p-3 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => toggleCouponStatus(coupon.id)}
                            disabled={isExpired}
                            className={`p-1 rounded transition-colors ${
                              isExpired 
                                ? 'text-muted-foreground/30 cursor-not-allowed' 
                                : 'hover:bg-secondary text-muted-foreground hover:text-foreground'
                            }`}
                            title={coupon.status === 'Active' ? 'Deactivate Coupon' : 'Activate Coupon'}
                          >
                            {coupon.status === 'Active' ? <ToggleRight size={18} className="text-emerald-500" /> : <ToggleLeft size={18} />}
                          </button>
                          
                          <button
                            onClick={() => deleteCoupon(coupon.id)}
                            className="p-1 hover:bg-rose-500/10 text-muted-foreground hover:text-rose-500 rounded transition-colors"
                            title="Delete Coupon"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {coupons.length === 0 && (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-xs text-muted-foreground">
                      No promotional coupons registered. Add a coupon code on the right panel to distribute promo campaigns.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Side: Create Coupon panel - 4 Columns */}
        <div className="lg:col-span-4 bg-card border border-border/80 rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex items-center gap-2 border-b border-border pb-3">
            <Ticket className="text-primary shrink-0" size={18} />
            <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">Configure New Coupon</h3>
          </div>

          {errorMsg && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-500 rounded-xl flex items-start gap-1.5 text-[11px] font-medium animate-shake">
              <AlertCircle size={14} className="shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleCreateCoupon} className="space-y-4 text-xs">
            {/* Promo Code Name */}
            <div className="space-y-1">
              <label className="text-muted-foreground block font-medium">Promo Coupon Code</label>
              <input
                type="text"
                placeholder="e.g. WELCOME100, DIWALI2026"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="w-full p-2.5 border border-border/80 focus:border-primary rounded-xl bg-secondary/15 text-foreground outline-none font-mono uppercase font-bold"
                required
              />
            </div>

            {/* Discount Type & Value */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-muted-foreground block font-medium">Discount Type</label>
                <select
                  value={discountType}
                  onChange={(e) => {
                    setDiscountType(e.target.value as 'fixed' | 'percentage');
                    setDiscountValue(e.target.value === 'percentage' ? 10 : 100);
                  }}
                  className="w-full p-2.5 border border-border/80 focus:border-primary rounded-xl bg-secondary/15 text-foreground outline-none font-semibold"
                >
                  <option value="percentage">Percentage (%)</option>
                  <option value="fixed">Fixed Price (₹)</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-muted-foreground block font-medium">
                  {discountType === 'percentage' ? 'Percent Value' : 'Rupee Value'}
                </label>
                <input
                  type="number"
                  min="1"
                  value={discountValue}
                  onChange={(e) => setDiscountValue(Number(e.target.value))}
                  className="w-full p-2.5 border border-border/80 focus:border-primary rounded-xl bg-secondary/15 text-foreground outline-none font-mono"
                  required
                />
              </div>
            </div>

            {/* Minimum Order Value & Max Cap */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-muted-foreground block font-medium">Min Order Value</label>
                <input
                  type="number"
                  min="0"
                  placeholder="₹499"
                  value={minOrderValue}
                  onChange={(e) => setMinOrderValue(Number(e.target.value))}
                  className="w-full p-2.5 border border-border/80 focus:border-primary rounded-xl bg-secondary/15 text-foreground outline-none font-mono"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-muted-foreground block font-medium">Max Payout Cap</label>
                <input
                  type="number"
                  min="1"
                  placeholder={discountType === 'percentage' ? 'e.g. 150' : 'N/A'}
                  value={maxDiscount}
                  onChange={(e) => setMaxDiscount(e.target.value)}
                  disabled={discountType === 'fixed'}
                  className="w-full p-2.5 border border-border/80 focus:border-primary rounded-xl bg-secondary/15 text-foreground outline-none font-mono disabled:opacity-40"
                />
              </div>
            </div>

            {/* Scope selection */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-muted-foreground block font-medium">Coupon Scope</label>
                <select
                  value={scope}
                  onChange={(e) => {
                    setScope(e.target.value as 'Global' | 'Vendor');
                    setVendorName('');
                  }}
                  className="w-full p-2.5 border border-border/80 focus:border-primary rounded-xl bg-secondary/15 text-foreground outline-none font-semibold"
                >
                  <option value="Global">Global Platform</option>
                  <option value="Vendor">Specific Vendor</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-muted-foreground block font-medium">Usage Limit</label>
                <input
                  type="number"
                  min="1"
                  value={usageLimit}
                  onChange={(e) => setUsageLimit(Number(e.target.value))}
                  className="w-full p-2.5 border border-border/80 focus:border-primary rounded-xl bg-secondary/15 text-foreground outline-none font-mono"
                  required
                />
              </div>
            </div>

            {/* Conditional Vendor Dropdown */}
            {scope === 'Vendor' && (
              <div className="space-y-1">
                <label className="text-muted-foreground block font-medium">Select Vendor Store</label>
                <select
                  value={vendorName}
                  onChange={(e) => setVendorName(e.target.value)}
                  className="w-full p-2.5 border border-border/80 focus:border-primary rounded-xl bg-secondary/15 text-foreground outline-none font-semibold"
                  required
                >
                  <option value="">-- Choose Vendor --</option>
                  {sellers
                    .filter(s => s.status === 'Approved')
                    .map(s => (
                      <option key={s.id} value={s.businessName}>
                        {s.businessName}
                      </option>
                    ))}
                </select>
              </div>
            )}

            {/* Validity Window (Start & End Dates) */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-muted-foreground block font-medium">Start Date</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full p-2.5 border border-border/80 focus:border-primary rounded-xl bg-secondary/15 text-foreground outline-none font-mono"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-muted-foreground block font-medium">End Date</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full p-2.5 border border-border/80 focus:border-primary rounded-xl bg-secondary/15 text-foreground outline-none font-mono"
                  required
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="w-full py-2.5 bg-primary hover:bg-primary/95 text-primary-foreground font-bold rounded-xl transition-all shadow-md shadow-primary/10 flex items-center justify-center gap-1.5 mt-2"
            >
              <Plus size={16} /> Register Promo Coupon
            </button>
          </form>
        </div>

      </div>

    </div>
  );
};
