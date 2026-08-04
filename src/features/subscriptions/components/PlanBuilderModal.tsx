import React, { useState, useEffect } from 'react';
import { X, Plus, Check, Shield, Layers, Tag, DollarSign, Sliders, MessageSquare, Bot, Database, Truck, Store, Award } from 'lucide-react';
import { subscriptionApi } from '../api/subscriptionApi';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialProduct?: any;
}

export const PlanBuilderModal: React.FC<Props> = ({ isOpen, onClose, onSuccess, initialProduct }) => {
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    slug: '',
    productType: 'PLAN',
    category: 'FOOD_AND_DINING',
    tierCode: 'APEXBEE_BUSINESS',
    description: '',
    shortDescription: '',
    isPublic: true,
    isFeatured: false,
    sortOrder: 1,
    status: 'ACTIVE'
  });

  // Commercial Pricing & GST
  const [monthlyPrice, setMonthlyPrice] = useState(999);
  const [yearlyPrice, setYearlyPrice] = useState(9990);
  const [gstRate, setGstRate] = useState(18);

  // Operational Quotas
  const [orderLimit, setOrderLimit] = useState(3000);
  const [staffCount, setStaffCount] = useState(10);
  const [outletsCount, setOutletsCount] = useState(2);
  const [whatsappCredits, setWhatsappCredits] = useState(500);
  const [smsCredits, setSmsCredits] = useState(500);
  const [aiCredits, setAiCredits] = useState(100);
  const [itemLimit, setItemLimit] = useState(500);
  const [storageGb, setStorageGb] = useState(10);

  // Operational Tool Toggles
  const [kdsEnabled, setKdsEnabled] = useState(true);
  const [tableMgmtEnabled, setTableMgmtEnabled] = useState(true);
  const [crmEnabled, setCrmEnabled] = useState(true);
  const [barcodePosEnabled, setBarcodePosEnabled] = useState(true);
  const [doorstepDeliveryEnabled, setDoorstepDeliveryEnabled] = useState(true);
  const [b2bWholesaleEnabled, setB2bWholesaleEnabled] = useState(false);
  const [warehouseEnabled, setWarehouseEnabled] = useState(false);
  const [lmsEnabled, setLmsEnabled] = useState(false);
  const [slotBookingEnabled, setSlotBookingEnabled] = useState(false);
  const [prasadamComplianceEnabled, setPrasadamComplianceEnabled] = useState(false);
  const [automatedPayoutsEnabled, setAutomatedPayoutsEnabled] = useState(true);
  const [dedicatedManagerEnabled, setDedicatedManagerEnabled] = useState(false);

  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (initialProduct) {
      setFormData({
        code: initialProduct.code || initialProduct.tierCode || 'APEXBEE_BUSINESS',
        name: initialProduct.name || initialProduct.displayName || '',
        slug: initialProduct.slug || (initialProduct.name || '').toLowerCase().replace(/\s+/g, '-'),
        productType: initialProduct.productType || 'PLAN',
        category: initialProduct.category || 'FOOD_AND_DINING',
        tierCode: initialProduct.tierCode || 'APEXBEE_BUSINESS',
        description: initialProduct.description || initialProduct.shortDescription || '',
        shortDescription: initialProduct.shortDescription || '',
        isPublic: initialProduct.isPublic ?? true,
        isFeatured: initialProduct.isFeatured ?? false,
        sortOrder: initialProduct.sortOrder || 1,
        status: initialProduct.status || 'ACTIVE'
      });
      setMonthlyPrice(initialProduct.monthlyPrice || 999);
      setYearlyPrice(initialProduct.yearlyPrice || 9990);
      setGstRate(initialProduct.gstRate || 18);
      setOrderLimit(initialProduct.orderLimit ? parseInt(initialProduct.orderLimit) || 3000 : 3000);
      setStaffCount(initialProduct.staffCount || 10);
      setWhatsappCredits(initialProduct.tierCode === 'APEXBEE_PREMIUM' ? 2000 : 500);
      setSmsCredits(initialProduct.tierCode === 'APEXBEE_PREMIUM' ? 2000 : 500);
      setAiCredits(initialProduct.tierCode === 'APEXBEE_PREMIUM' ? 500 : 100);
      setItemLimit(initialProduct.tierCode === 'APEXBEE_PREMIUM' ? 10000 : 500);
      setStorageGb(initialProduct.tierCode === 'APEXBEE_PREMIUM' ? 100 : 10);
    } else {
      setFormData({
        code: 'REST_BUSINESS',
        name: 'Restaurant Business',
        slug: 'restaurant-business',
        productType: 'PLAN',
        category: 'FOOD_AND_DINING',
        tierCode: 'APEXBEE_BUSINESS',
        description: 'Omnichannel POS billing, KDS display & table management suite.',
        shortDescription: 'For growing restaurant & cafe vendors',
        isPublic: true,
        isFeatured: true,
        sortOrder: 1,
        status: 'ACTIVE'
      });
      setMonthlyPrice(999);
      setYearlyPrice(9990);
      setGstRate(18);
      setOrderLimit(3000);
      setStaffCount(10);
      setWhatsappCredits(500);
      setSmsCredits(500);
      setAiCredits(100);
      setItemLimit(500);
      setStorageGb(10);
    }
  }, [initialProduct, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      const res = await subscriptionApi.upsertProduct({
        ...formData,
        id: initialProduct?._id || initialProduct?.id
      });
      if (res.success && res.product) {
        const prodId = res.product._id;
        await subscriptionApi.addPriceVersion(prodId, {
          billingCycle: 'MONTHLY',
          durationValue: 1,
          durationUnit: 'MONTH',
          originalAmount: monthlyPrice,
          gstRate,
          taxMode: 'EXCLUSIVE'
        });
        await subscriptionApi.addPriceVersion(prodId, {
          billingCycle: 'YEARLY',
          durationValue: 1,
          durationUnit: 'YEAR',
          originalAmount: yearlyPrice,
          gstRate,
          taxMode: 'EXCLUSIVE'
        });

        onSuccess();
        onClose();
      } else {
        onSuccess();
        onClose();
      }
    } catch (err: any) {
      alert(err.message || 'Error saving plan profile');
      onSuccess();
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 font-sans text-left">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-3xl overflow-hidden shadow-2xl">
        <div className="flex items-center justify-between p-5 border-b border-slate-800">
          <div>
            <h3 className="text-lg font-black text-white flex items-center gap-2">
              <Layers className="w-5 h-5 text-amber-500" />
              {initialProduct ? `Edit Plan Profile (${initialProduct.name || initialProduct.displayName})` : 'Create Universal Plan Profile'}
            </h3>
            <p className="text-xs text-slate-400">Configure tier limits, commercial pricing, marketing quotas, and operational tools.</p>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-white rounded-lg cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[82vh] overflow-y-auto">
          {/* General Information */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase mb-1">Business Category</label>
              <select
                value={formData.category}
                onChange={e => setFormData({ ...formData, category: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-primary"
              >
                <option value="FOOD_AND_DINING">Food & Dining (Restaurant, Cafe)</option>
                <option value="DAILY_NEEDS">Daily Needs (Grocery, Meat)</option>
                <option value="DEVOTIONAL">Devotional (Pooja Kits, Prasadam)</option>
                <option value="SERVICES">Services (Salon, Repair)</option>
                <option value="ACADEMY">Academy (Courses, Skill)</option>
                <option value="HEALTH">Health & Wellness</option>
                <option value="DELIVERY">Delivery & Logistics</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase mb-1">Master Tier</label>
              <select
                value={formData.tierCode}
                onChange={e => setFormData({ ...formData, tierCode: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-primary"
              >
                <option value="APEXBEE_STARTER">Starter Tier (Tier 1)</option>
                <option value="APEXBEE_BUSINESS">Business Tier (Tier 2)</option>
                <option value="APEXBEE_PREMIUM">Premium Tier (Tier 3)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase mb-1">Product Code</label>
              <input
                type="text"
                required
                placeholder="REST_BUSINESS"
                value={formData.code}
                onChange={e => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-primary font-mono text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase mb-1">Plan Display Name</label>
              <input
                type="text"
                required
                placeholder="Restaurant Business"
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') })}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-primary"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase mb-1">Plan Description</label>
            <textarea
              rows={2}
              value={formData.description}
              onChange={e => setFormData({ ...formData, description: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-primary"
            />
          </div>

          {/* Pricing & GST Section */}
          <div className="border-t border-slate-800 pt-4">
            <h4 className="text-xs font-extrabold uppercase text-slate-400 tracking-wider mb-3 flex items-center gap-1.5">
              <DollarSign className="w-4 h-4 text-emerald-400" /> Commercial Pricing & GST Taxes
            </h4>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Monthly Price (₹)</label>
                <input
                  type="number"
                  value={monthlyPrice}
                  onChange={e => setMonthlyPrice(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-primary"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Yearly Price (₹)</label>
                <input
                  type="number"
                  value={yearlyPrice}
                  onChange={e => setYearlyPrice(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-primary"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">GST Rate (%)</label>
                <input
                  type="number"
                  value={gstRate}
                  onChange={e => setGstRate(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-primary"
                />
              </div>
            </div>
          </div>

          {/* Operational Quotas & Usage Limits */}
          <div className="border-t border-slate-800 pt-4">
            <h4 className="text-xs font-extrabold uppercase text-slate-400 tracking-wider mb-3 flex items-center gap-1.5">
              <Sliders className="w-4 h-4 text-amber-400" /> Operational Quotas & Usage Caps
            </h4>
            <div className="grid grid-cols-4 gap-3 mb-3">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Orders Limit / mo</label>
                <input
                  type="number"
                  value={orderLimit}
                  onChange={e => setOrderLimit(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-primary"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Staff Accounts</label>
                <input
                  type="number"
                  value={staffCount}
                  onChange={e => setStaffCount(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-primary"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Outlets Allowed</label>
                <input
                  type="number"
                  value={outletsCount}
                  onChange={e => setOutletsCount(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-primary"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Items / Menu Limit</label>
                <input
                  type="number"
                  value={itemLimit}
                  onChange={e => setItemLimit(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-primary"
                />
              </div>
            </div>

            <div className="grid grid-cols-4 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">WhatsApp Credits / mo</label>
                <input
                  type="number"
                  value={whatsappCredits}
                  onChange={e => setWhatsappCredits(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-primary"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">SMS Credits / mo</label>
                <input
                  type="number"
                  value={smsCredits}
                  onChange={e => setSmsCredits(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-primary"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">AI Credits / mo</label>
                <input
                  type="number"
                  value={aiCredits}
                  onChange={e => setAiCredits(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-primary"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Storage Space (GB)</label>
                <input
                  type="number"
                  value={storageGb}
                  onChange={e => setStorageGb(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-primary"
                />
              </div>
            </div>
          </div>

          {/* Category-Relevant Operational Tool Suite Toggles */}
          <div className="border-t border-slate-800 pt-4">
            <h4 className="text-xs font-extrabold uppercase text-slate-400 tracking-wider mb-3 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Store className="w-4 h-4 text-indigo-400" /> Operational Tool Suite ({formData.category.replace(/_/g, ' ')})
              </span>
              <span className="text-[10px] text-amber-400 font-bold px-2 py-0.5 rounded bg-amber-400/10 border border-amber-400/20">
                Category Tailored Tools
              </span>
            </h4>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
              {/* Food & Dining Tools */}
              {(formData.category === 'FOOD_AND_DINING' || formData.category === 'ALL') && (
                <>
                  <label className="flex items-center gap-2 cursor-pointer text-slate-300 select-none p-2 rounded-lg bg-slate-950 border border-slate-800">
                    <input
                      type="checkbox"
                      checked={kdsEnabled}
                      onChange={e => setKdsEnabled(e.target.checked)}
                      className="rounded bg-slate-900 border-slate-700 text-primary focus:ring-0 w-4 h-4"
                    />
                    Kitchen Display System (KDS)
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer text-slate-300 select-none p-2 rounded-lg bg-slate-950 border border-slate-800">
                    <input
                      type="checkbox"
                      checked={tableMgmtEnabled}
                      onChange={e => setTableMgmtEnabled(e.target.checked)}
                      className="rounded bg-slate-900 border-slate-700 text-primary focus:ring-0 w-4 h-4"
                    />
                    Table Floor & Reservation Ops
                  </label>
                </>
              )}

              {/* Daily Needs Tools */}
              {(formData.category === 'DAILY_NEEDS' || formData.category === 'ALL') && (
                <>
                  <label className="flex items-center gap-2 cursor-pointer text-slate-300 select-none p-2 rounded-lg bg-slate-950 border border-slate-800">
                    <input
                      type="checkbox"
                      checked={barcodePosEnabled}
                      onChange={e => setBarcodePosEnabled(e.target.checked)}
                      className="rounded bg-slate-900 border-slate-700 text-primary focus:ring-0 w-4 h-4"
                    />
                    Barcode & Batch Expiry POS
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer text-slate-300 select-none p-2 rounded-lg bg-slate-950 border border-slate-800">
                    <input
                      type="checkbox"
                      checked={doorstepDeliveryEnabled}
                      onChange={e => setDoorstepDeliveryEnabled(e.target.checked)}
                      className="rounded bg-slate-900 border-slate-700 text-primary focus:ring-0 w-4 h-4"
                    />
                    Doorstep Subscription Delivery
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer text-slate-300 select-none p-2 rounded-lg bg-slate-950 border border-slate-800">
                    <input
                      type="checkbox"
                      checked={warehouseEnabled}
                      onChange={e => setWarehouseEnabled(e.target.checked)}
                      className="rounded bg-slate-900 border-slate-700 text-primary focus:ring-0 w-4 h-4"
                    />
                    Multi-Warehouse Inventory
                  </label>
                </>
              )}

              {/* Devotional Tools */}
              {(formData.category === 'DEVOTIONAL' || formData.category === 'ALL') && (
                <label className="flex items-center gap-2 cursor-pointer text-slate-300 select-none p-2 rounded-lg bg-slate-950 border border-slate-800">
                  <input
                    type="checkbox"
                    checked={prasadamComplianceEnabled}
                    onChange={e => setPrasadamComplianceEnabled(e.target.checked)}
                    className="rounded bg-slate-900 border-slate-700 text-primary focus:ring-0 w-4 h-4"
                  />
                  Temple Prasadam Compliance
                </label>
              )}

              {/* Services Tools */}
              {(formData.category === 'SERVICES' || formData.category === 'ALL') && (
                <label className="flex items-center gap-2 cursor-pointer text-slate-300 select-none p-2 rounded-lg bg-slate-950 border border-slate-800">
                  <input
                    type="checkbox"
                    checked={slotBookingEnabled}
                    onChange={e => setSlotBookingEnabled(e.target.checked)}
                    className="rounded bg-slate-900 border-slate-700 text-primary focus:ring-0 w-4 h-4"
                  />
                  Slot & Appointment Booking
                </label>
              )}

              {/* Academy Tools */}
              {(formData.category === 'ACADEMY' || formData.category === 'ALL') && (
                <label className="flex items-center gap-2 cursor-pointer text-slate-300 select-none p-2 rounded-lg bg-slate-950 border border-slate-800">
                  <input
                    type="checkbox"
                    checked={lmsEnabled}
                    onChange={e => setLmsEnabled(e.target.checked)}
                    className="rounded bg-slate-900 border-slate-700 text-primary focus:ring-0 w-4 h-4"
                  />
                  Course & Live Assessment LMS
                </label>
              )}

              {/* Shared Universal Operational Tools */}
              <label className="flex items-center gap-2 cursor-pointer text-slate-300 select-none p-2 rounded-lg bg-slate-950 border border-slate-800">
                <input
                  type="checkbox"
                  checked={crmEnabled}
                  onChange={e => setCrmEnabled(e.target.checked)}
                  className="rounded bg-slate-900 border-slate-700 text-primary focus:ring-0 w-4 h-4"
                />
                Customer CRM & Loyalty Engine
              </label>

              <label className="flex items-center gap-2 cursor-pointer text-slate-300 select-none p-2 rounded-lg bg-slate-950 border border-slate-800">
                <input
                  type="checkbox"
                  checked={b2bWholesaleEnabled}
                  onChange={e => setB2bWholesaleEnabled(e.target.checked)}
                  className="rounded bg-slate-900 border-slate-700 text-primary focus:ring-0 w-4 h-4"
                />
                Wholesale B2B & Negotiated Rates
              </label>

              <label className="flex items-center gap-2 cursor-pointer text-slate-300 select-none p-2 rounded-lg bg-slate-950 border border-slate-800">
                <input
                  type="checkbox"
                  checked={automatedPayoutsEnabled}
                  onChange={e => setAutomatedPayoutsEnabled(e.target.checked)}
                  className="rounded bg-slate-900 border-slate-700 text-primary focus:ring-0 w-4 h-4"
                />
                Automated Settlement Payouts
              </label>

              <label className="flex items-center gap-2 cursor-pointer text-slate-300 select-none p-2 rounded-lg bg-slate-950 border border-slate-800">
                <input
                  type="checkbox"
                  checked={dedicatedManagerEnabled}
                  onChange={e => setDedicatedManagerEnabled(e.target.checked)}
                  className="rounded bg-slate-900 border-slate-700 text-primary focus:ring-0 w-4 h-4"
                />
                24/7 Dedicated Account Manager
              </label>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-6 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-medium rounded-lg transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 bg-primary hover:bg-primary/90 text-white text-sm font-bold rounded-lg transition-colors flex items-center gap-2 cursor-pointer shadow-lg shadow-primary/20"
            >
              <Check className="w-4 h-4" />
              {submitting ? 'Saving Plan Profile...' : 'Save Plan Profile & Entitlements'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
