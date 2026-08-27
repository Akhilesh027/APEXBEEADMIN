import React, { useState, useEffect } from 'react';
import { AlertTriangle, Share2, Save, CheckCircle2, RefreshCw, IndianRupee, Store, Wrench, Package, Factory, UserCheck, ShieldCheck, MapPin, Building, Globe } from 'lucide-react';
import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || 'https://server.apexbee.in';

export const CommissionEngine: React.FC = () => {
  // Calculator inputs
  const [vendorPrice, setVendorPrice] = useState<number>(1000);
  const [platComm, setPlatComm] = useState<number>(100);
  const [platCommType, setPlatCommType] = useState<'fixed' | 'percentage'>('fixed');

  const [shipping, setShipping] = useState<number>(50);
  const [packing, setPacking] = useState<number>(30);

  // Splits
  const [wishLink, setWishLink] = useState<number>(10);
  const [firstPurchase, setFirstPurchase] = useState<number>(10);

  const [l1Referral, setL1Referral] = useState<number>(20);
  const [l2Referral, setL2Referral] = useState<number>(15);
  const [l3Referral, setL3Referral] = useState<number>(10);

  const [stateFran, setStateFran] = useState<number>(5);
  const [distFran, setDistFran] = useState<number>(5);
  const [mandalFran, setMandalFran] = useState<number>(10);

  // Dynamic Backend Partner & Vendor Onboarding Referral Rewards
  const [onboardingRewards, setOnboardingRewards] = useState({
    vendor: 0,
    service_provider: 0,
    wholesaler: 0,
    manufacturer: 0,
    entrepreneur: 0,
    mandal_franchise: 0,
    district_franchise: 0,
    state_franchise: 0
  });
  const [isLoadingOnboarding, setIsLoadingOnboarding] = useState(false);
  const [isSavingOnboarding, setIsSavingOnboarding] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState('');

  const fetchOnboardingRewards = async () => {
    setIsLoadingOnboarding(true);
    try {
      const token = localStorage.getItem('token') || localStorage.getItem('adminToken') || sessionStorage.getItem('token');
      const res = await axios.get(`${API_BASE}/api/referrals/admin/settings`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success && res.data.settings?.onboardingRewards) {
        setOnboardingRewards({
          vendor: res.data.settings.onboardingRewards.vendor ?? 0,
          service_provider: res.data.settings.onboardingRewards.service_provider ?? 0,
          wholesaler: res.data.settings.onboardingRewards.wholesaler ?? 0,
          manufacturer: res.data.settings.onboardingRewards.manufacturer ?? 0,
          entrepreneur: res.data.settings.onboardingRewards.entrepreneur ?? 0,
          mandal_franchise: res.data.settings.onboardingRewards.mandal_franchise ?? 0,
          district_franchise: res.data.settings.onboardingRewards.district_franchise ?? 0,
          state_franchise: res.data.settings.onboardingRewards.state_franchise ?? 0
        });
      }
    } catch (err) {
      console.error('Failed to load referral onboarding settings:', err);
    } finally {
      setIsLoadingOnboarding(false);
    }
  };

  useEffect(() => {
    fetchOnboardingRewards();
  }, []);

  const handleSaveOnboardingRewards = async () => {
    setIsSavingOnboarding(true);
    try {
      const token = localStorage.getItem('token') || localStorage.getItem('adminToken') || sessionStorage.getItem('token');
      const res = await axios.put(`${API_BASE}/api/referrals/admin/settings`, {
        onboardingRewards
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) {
        setSaveSuccessMsg('Onboarding referral rewards saved successfully!');
        setTimeout(() => setSaveSuccessMsg(''), 4000);
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to save settings');
    } finally {
      setIsSavingOnboarding(false);
    }
  };

  // Live Calculations
  let platCommAbsolute = 0;

  if (platCommType === 'percentage') {
    platCommAbsolute = (platComm / 100) * vendorPrice;
  } else {
    platCommAbsolute = platComm;
  }

  const vendorEarnings = vendorPrice - platCommAbsolute;
  const customerFinalPrice = vendorPrice + Number(shipping) + Number(packing);

  const totalReferralPool = Number(l1Referral) + Number(l2Referral) + Number(l3Referral);
  const totalFranchisePool = Number(stateFran) + Number(distFran) + Number(mandalFran);
  const totalIncentives = Number(wishLink) + Number(firstPurchase);

  const platformRetains = platCommAbsolute - (totalReferralPool + totalFranchisePool + totalIncentives);

  const percentageOfTotal = (amount: number) => {
    if (customerFinalPrice === 0) return '0%';
    return `${((amount / customerFinalPrice) * 100).toFixed(1)}%`;
  };

  return (
    <div className="space-y-6">

      {/* Intro Header */}
      <div className="bg-card border border-border/80 rounded-2xl p-4 shadow-sm flex items-center gap-3">
        <Share2 className="text-primary shrink-0" size={24} />
        <div>
          <h2 className="text-xs font-bold uppercase tracking-wider text-foreground">Multi-Tier Commission Calculator</h2>
          <p className="text-[10px] text-muted-foreground mt-0.5">Configure, simulate, and verify cash flows for manufacturers, referral partners, and franchise tiers</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

        {/* Parameters Form - 5 columns */}
        <div className="lg:col-span-5 bg-card border border-border/80 rounded-2xl p-5 shadow-sm space-y-4">
          <h3 className="text-xs font-bold text-foreground uppercase tracking-wider border-b border-border pb-3">Calculator Inputs</h3>

          <div className="space-y-4 text-xs">
            {/* Base price */}
            <div className="space-y-1">
              <label className="text-muted-foreground block font-medium">Vendor Product Price (₹)</label>
              <input
                type="number"
                value={vendorPrice}
                onChange={(e) => setVendorPrice(Number(e.target.value))}
                className="w-full p-2.5 border border-border focus:border-primary bg-secondary/15 rounded-xl outline-none font-semibold font-mono text-foreground"
              />
            </div>

            {/* Platform commission */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-muted-foreground block">Platform Fee Rate</label>
                <div className="flex rounded-lg border border-border bg-card overflow-hidden">
                  <input
                    type="number"
                    value={platComm}
                    onChange={(e) => setPlatComm(Number(e.target.value))}
                    className="w-full p-2 outline-none bg-transparent font-semibold font-mono"
                  />
                  <select
                    value={platCommType}
                    onChange={(e) => setPlatCommType(e.target.value as 'fixed' | 'percentage')}
                    className="bg-secondary p-2 outline-none border-l border-border text-[10px]"
                  >
                    <option value="percentage">%</option>
                    <option value="fixed">Fixed (₹)</option>
                  </select>
                </div>
              </div>

              {/* Shipping charge */}
              <div className="space-y-1">
                <label className="text-muted-foreground block">Shipping Charge (₹)</label>
                <input
                  type="number"
                  value={shipping}
                  onChange={(e) => setShipping(Number(e.target.value))}
                  className="w-full p-2 border border-border focus:border-primary bg-card rounded-lg outline-none font-mono"
                />
              </div>

              {/* Packing charge */}
              <div className="space-y-1">
                <label className="text-muted-foreground block">Packing Charge (₹)</label>
                <input
                  type="number"
                  value={packing}
                  onChange={(e) => setPacking(Number(e.target.value))}
                  className="w-full p-2 border border-border focus:border-primary bg-card rounded-lg outline-none font-mono"
                />
              </div>
            </div>

            {/* Referral level splits */}
            <div className="bg-secondary/10 p-3 rounded-xl border border-border/40 space-y-2">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Referrals Multi-level Splits</span>
              <div className="grid grid-cols-3 gap-2">
                <div className="space-y-1">
                  <label className="text-[10px] text-muted-foreground block">L1 Referral (₹)</label>
                  <input
                    type="number"
                    value={l1Referral}
                    onChange={(e) => setL1Referral(Number(e.target.value))}
                    className="w-full p-1.5 border border-border bg-card rounded-lg outline-none font-mono text-center"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-muted-foreground block">L2 Referral (₹)</label>
                  <input
                    type="number"
                    value={l2Referral}
                    onChange={(e) => setL2Referral(Number(e.target.value))}
                    className="w-full p-1.5 border border-border bg-card rounded-lg outline-none font-mono text-center"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-muted-foreground block">L3 Referral (₹)</label>
                  <input
                    type="number"
                    value={l3Referral}
                    onChange={(e) => setL3Referral(Number(e.target.value))}
                    className="w-full p-1.5 border border-border bg-card rounded-lg outline-none font-mono text-center"
                  />
                </div>
              </div>
            </div>

            {/* Franchise level splits */}
            <div className="bg-secondary/10 p-3 rounded-xl border border-border/40 space-y-2">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Franchise Network Splits</span>
              <div className="grid grid-cols-3 gap-2">
                <div className="space-y-1">
                  <label className="text-[10px] text-muted-foreground block">State (₹)</label>
                  <input
                    type="number"
                    value={stateFran}
                    onChange={(e) => setStateFran(Number(e.target.value))}
                    className="w-full p-1.5 border border-border bg-card rounded-lg outline-none font-mono text-center"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-muted-foreground block">District (₹)</label>
                  <input
                    type="number"
                    value={distFran}
                    onChange={(e) => setDistFran(Number(e.target.value))}
                    className="w-full p-1.5 border border-border bg-card rounded-lg outline-none font-mono text-center"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-muted-foreground block">Mandal (₹)</label>
                  <input
                    type="number"
                    value={mandalFran}
                    onChange={(e) => setMandalFran(Number(e.target.value))}
                    className="w-full p-1.5 border border-border bg-card rounded-lg outline-none font-mono text-center"
                  />
                </div>
              </div>
            </div>

            {/* Special incentives */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-muted-foreground block">Wish Link Incentive (₹)</label>
                <input
                  type="number"
                  value={wishLink}
                  onChange={(e) => setWishLink(Number(e.target.value))}
                  className="w-full p-2 border border-border focus:border-primary bg-card rounded-lg outline-none font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="text-muted-foreground block">First Purchase Incentive (₹)</label>
                <input
                  type="number"
                  value={firstPurchase}
                  onChange={(e) => setFirstPurchase(Number(e.target.value))}
                  className="w-full p-2 border border-border focus:border-primary bg-card rounded-lg outline-none font-mono"
                />
              </div>
            </div>

          </div>
        </div>

        {/* Live Outputs & Visual Breakdown - 7 columns */}
        <div className="lg:col-span-7 space-y-6">

          {/* Main summary values */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-card border border-border/80 rounded-2xl p-4 shadow-sm text-center">
              <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider block">Customer Price</span>
              <span className="text-lg font-bold text-indigo-500 font-mono mt-1 block">₹{customerFinalPrice.toFixed(2)}</span>
            </div>
            <div className="bg-card border border-border/80 rounded-2xl p-4 shadow-sm text-center">
              <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider block">Vendor Payout</span>
              <span className="text-lg font-bold text-emerald-500 font-mono mt-1 block">₹{vendorEarnings.toFixed(2)}</span>
            </div>
            <div className="bg-card border border-border/80 rounded-2xl p-4 shadow-sm text-center">
              <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider block">Platform Retains</span>
              <span className={`text-lg font-bold font-mono mt-1 block ${platformRetains >= 0 ? 'text-foreground' : 'text-rose-500'}`}>
                ₹{platformRetains.toFixed(2)}
              </span>
            </div>
          </div>

          {/* Detailed list and progress bars */}
          <div className="bg-card border border-border/80 rounded-2xl p-5 shadow-sm space-y-4">
            <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">Revenue Allocation Breakdown</h3>

            <div className="space-y-3.5 text-xs">

              {/* Seller block */}
              <div className="space-y-1.5">
                <div className="flex justify-between font-semibold">
                  <span className="text-foreground">Vendor Payout (Price - Platform Fee)</span>
                  <span className="font-mono text-muted-foreground">₹{vendorEarnings.toFixed(2)} ({percentageOfTotal(vendorEarnings)})</span>
                </div>
                <div className="w-full bg-secondary h-2 rounded-full overflow-hidden">
                  <div className="bg-emerald-500 h-full rounded-full" style={{ width: percentageOfTotal(vendorEarnings) }} />
                </div>
              </div>

              {/* Referrals L1 L2 L3 block */}
              <div className="space-y-1.5">
                <div className="flex justify-between font-semibold">
                  <span className="text-foreground">Referral Commissions Pool (L1 + L2 + L3)</span>
                  <span className="font-mono text-muted-foreground">₹{totalReferralPool.toFixed(2)} ({percentageOfTotal(totalReferralPool)})</span>
                </div>
                <div className="w-full bg-secondary h-2 rounded-full overflow-hidden">
                  <div className="bg-indigo-500 h-full rounded-full" style={{ width: percentageOfTotal(totalReferralPool) }} />
                </div>
                <div className="grid grid-cols-3 gap-2 text-[10px] text-muted-foreground font-mono pl-2 border-l-2 border-indigo-500/30">
                  <span>L1 (Direct): ₹{l1Referral}</span>
                  <span>L2: ₹{l2Referral}</span>
                  <span>L3: ₹{l3Referral}</span>
                </div>
              </div>

              {/* Franchise state district mandal block */}
              <div className="space-y-1.5">
                <div className="flex justify-between font-semibold">
                  <span className="text-foreground">Franchise Partner Commissions (State + District + Mandal)</span>
                  <span className="font-mono text-muted-foreground">₹{totalFranchisePool.toFixed(2)} ({percentageOfTotal(totalFranchisePool)})</span>
                </div>
                <div className="w-full bg-secondary h-2 rounded-full overflow-hidden">
                  <div className="bg-amber-500 h-full rounded-full" style={{ width: percentageOfTotal(totalFranchisePool) }} />
                </div>
                <div className="grid grid-cols-3 gap-2 text-[10px] text-muted-foreground font-mono pl-2 border-l-2 border-amber-500/30">
                  <span>State: ₹{stateFran}</span>
                  <span>District: ₹{distFran}</span>
                  <span>Mandal: ₹{mandalFran}</span>
                </div>
              </div>

              {/* Incentives block */}
              <div className="space-y-1.5">
                <div className="flex justify-between font-semibold">
                  <span className="text-foreground">Marketing Incentives (WishLink + First Purchase)</span>
                  <span className="font-mono text-muted-foreground">₹{totalIncentives.toFixed(2)} ({percentageOfTotal(totalIncentives)})</span>
                </div>
                <div className="w-full bg-secondary h-2 rounded-full overflow-hidden">
                  <div className="bg-cyan-500 h-full rounded-full" style={{ width: percentageOfTotal(totalIncentives) }} />
                </div>
                <div className="grid grid-cols-2 gap-2 text-[10px] text-muted-foreground font-mono pl-2 border-l-2 border-cyan-500/30">
                  <span>WishLink: ₹{wishLink}</span>
                  <span>First Purchase: ₹{firstPurchase}</span>
                </div>
              </div>

              {/* Charges block */}
              <div className="grid grid-cols-2 gap-4 pt-1.5 border-t border-border/60">
                <div className="space-y-1">
                  <span className="text-muted-foreground block text-[10px]">Shipping Charge</span>
                  <span className="font-mono font-bold text-foreground text-xs">₹{shipping} ({percentageOfTotal(shipping)})</span>
                </div>
                <div className="space-y-1">
                  <span className="text-muted-foreground block text-[10px]">Packing Charge</span>
                  <span className="font-mono font-bold text-foreground text-xs">₹{packing} ({percentageOfTotal(packing)})</span>
                </div>
              </div>

            </div>

            {/* Verification Alert Warnings */}
            {platformRetains < 0 ? (
              <div className="flex gap-2 p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-xs text-rose-500 leading-normal mt-4">
                <AlertTriangle size={18} className="shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold block">Deficit Warning</span>
                  <span>The platform is running a deficit of ₹{Math.abs(platformRetains).toFixed(2)} on this calculation because splits/incentives exceed the platform fee. Decrease payouts or increase the platform fee.</span>
                </div>
              </div>
            ) : (
              <div className="flex gap-2 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-xs text-emerald-600 leading-normal mt-4">
                <Share2 size={18} className="shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold block">Cash Flow Balance Sheet</span>
                  <span>Parameters balanced successfully. Platform retains a net profit of ₹{platformRetains.toFixed(2)} per order representing {((platformRetains / customerFinalPrice) * 100).toFixed(1)}% of absolute customer cost.</span>
                </div>
              </div>
            )}

          </div>

          {/* Visual tree map diagram */}
          <div className="bg-card border border-border/80 rounded-2xl p-5 shadow-sm space-y-4">
            <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">Simulated Cash Distribution Path</h3>

            <div className="border border-border/60 rounded-xl p-4 bg-secondary/15 flex flex-col items-center justify-center space-y-3 font-mono text-[10px] text-foreground">
              {/* Customer */}
              <div className="px-4 py-1.5 bg-indigo-500 text-white rounded-lg font-bold border border-indigo-600">
                Customer Pays: ₹{customerFinalPrice}
              </div>
              <div className="w-0.5 h-4 bg-border" />

              {/* Splits */}
              <div className="flex gap-1 items-center max-w-full overflow-x-auto no-scrollbar w-full justify-around">
                <div className="flex flex-col items-center">
                  <div className="px-2 py-1 bg-emerald-500 text-white rounded-md border border-emerald-600">
                    Vendor: ₹{vendorEarnings}
                  </div>
                </div>

                <div className="flex flex-col items-center">
                  <div className="px-2 py-1 bg-secondary text-foreground rounded-md border border-border">
                    Courier: ₹{shipping}
                  </div>
                </div>

                <div className="flex flex-col items-center">
                  <div className="px-2 py-1 bg-secondary text-foreground rounded-md border border-border">
                    Packing: ₹{packing}
                  </div>
                </div>

                <div className="flex flex-col items-center">
                  <div className="px-2 py-1 bg-card text-foreground rounded-md border border-primary text-center">
                    Platform Fee: ₹{platCommAbsolute}
                    <div className="w-full border-t border-border my-1" />
                    <div className="text-[9px] text-muted-foreground flex flex-col gap-0.5">
                      <span>Referral: ₹{totalReferralPool}</span>
                      <span>Franchise: ₹{totalFranchisePool}</span>
                      <span>Promo: ₹{totalIncentives}</span>
                      <span className="font-bold text-foreground">Retained: ₹{platformRetains}</span>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>

        </div>

      </div>

      {/* ═══════════════════════════════════════════════════════
          PARTNER & VENDOR ONBOARDING REFERRAL REWARDS (BACKEND CONFIGURATION)
          ═══════════════════════════════════════════════════════ */}
      <div className="bg-card border border-border/80 rounded-2xl p-6 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center font-bold">
              <IndianRupee size={20} />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-foreground uppercase tracking-wider">
                Partner & Vendor Onboarding Referral Rewards (₹)
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Configure one-time cash rewards credited to referrers upon new partner registration & verification. Set to <b>₹0</b> to disable registration bonuses.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={fetchOnboardingRewards}
              disabled={isLoadingOnboarding}
              className="px-3 py-2 bg-secondary hover:bg-secondary/80 text-foreground text-xs font-bold rounded-xl flex items-center gap-1.5 transition cursor-pointer border border-border"
              title="Refresh settings from database"
            >
              <RefreshCw size={14} className={isLoadingOnboarding ? "animate-spin" : ""} />
              <span>Refresh</span>
            </button>

            <button
              type="button"
              onClick={handleSaveOnboardingRewards}
              disabled={isSavingOnboarding}
              className="px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 text-xs font-black rounded-xl flex items-center gap-1.5 shadow-md hover:shadow-lg transition cursor-pointer border-none disabled:opacity-50"
            >
              <Save size={14} className={isSavingOnboarding ? "animate-spin" : ""} />
              <span>{isSavingOnboarding ? "Saving..." : "Save Configuration"}</span>
            </button>
          </div>
        </div>

        {saveSuccessMsg && (
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 rounded-xl text-xs font-bold flex items-center gap-2">
            <CheckCircle2 size={16} />
            <span>{saveSuccessMsg}</span>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {/* Vendor */}
          <div className="bg-secondary/15 border border-border/80 rounded-xl p-3.5 space-y-2 hover:border-amber-500/40 transition">
            <div className="flex items-center gap-2 text-foreground font-bold text-xs">
              <Store size={16} className="text-amber-500 shrink-0" />
              <span>Vendor / Local Shop</span>
            </div>
            <p className="text-[10px] text-muted-foreground">Reward when referred Vendor KYC is approved</p>
            <div className="flex items-center gap-1.5 bg-card border border-border rounded-lg px-2.5 py-1.5">
              <span className="text-xs font-bold text-muted-foreground">₹</span>
              <input
                type="number"
                min="0"
                value={onboardingRewards.vendor}
                onChange={(e) => setOnboardingRewards(prev => ({ ...prev, vendor: Number(e.target.value) }))}
                className="w-full bg-transparent font-mono font-black text-foreground text-xs outline-none"
                placeholder="0"
              />
            </div>
          </div>

          {/* Service Provider */}
          <div className="bg-secondary/15 border border-border/80 rounded-xl p-3.5 space-y-2 hover:border-amber-500/40 transition">
            <div className="flex items-center gap-2 text-foreground font-bold text-xs">
              <Wrench size={16} className="text-blue-500 shrink-0" />
              <span>Service Provider</span>
            </div>
            <p className="text-[10px] text-muted-foreground">Reward when Service Provider KYC is approved</p>
            <div className="flex items-center gap-1.5 bg-card border border-border rounded-lg px-2.5 py-1.5">
              <span className="text-xs font-bold text-muted-foreground">₹</span>
              <input
                type="number"
                min="0"
                value={onboardingRewards.service_provider}
                onChange={(e) => setOnboardingRewards(prev => ({ ...prev, service_provider: Number(e.target.value) }))}
                className="w-full bg-transparent font-mono font-black text-foreground text-xs outline-none"
                placeholder="0"
              />
            </div>
          </div>

          {/* Wholesaler */}
          <div className="bg-secondary/15 border border-border/80 rounded-xl p-3.5 space-y-2 hover:border-amber-500/40 transition">
            <div className="flex items-center gap-2 text-foreground font-bold text-xs">
              <Package size={16} className="text-indigo-500 shrink-0" />
              <span>Wholesaler</span>
            </div>
            <p className="text-[10px] text-muted-foreground">Reward when Wholesaler KYC is approved</p>
            <div className="flex items-center gap-1.5 bg-card border border-border rounded-lg px-2.5 py-1.5">
              <span className="text-xs font-bold text-muted-foreground">₹</span>
              <input
                type="number"
                min="0"
                value={onboardingRewards.wholesaler}
                onChange={(e) => setOnboardingRewards(prev => ({ ...prev, wholesaler: Number(e.target.value) }))}
                className="w-full bg-transparent font-mono font-black text-foreground text-xs outline-none"
                placeholder="0"
              />
            </div>
          </div>

          {/* Manufacturer */}
          <div className="bg-secondary/15 border border-border/80 rounded-xl p-3.5 space-y-2 hover:border-amber-500/40 transition">
            <div className="flex items-center gap-2 text-foreground font-bold text-xs">
              <Factory size={16} className="text-purple-500 shrink-0" />
              <span>Manufacturer</span>
            </div>
            <p className="text-[10px] text-muted-foreground">Reward when Manufacturer KYC is approved</p>
            <div className="flex items-center gap-1.5 bg-card border border-border rounded-lg px-2.5 py-1.5">
              <span className="text-xs font-bold text-muted-foreground">₹</span>
              <input
                type="number"
                min="0"
                value={onboardingRewards.manufacturer}
                onChange={(e) => setOnboardingRewards(prev => ({ ...prev, manufacturer: Number(e.target.value) }))}
                className="w-full bg-transparent font-mono font-black text-foreground text-xs outline-none"
                placeholder="0"
              />
            </div>
          </div>

          {/* Entrepreneur */}
          <div className="bg-secondary/15 border border-border/80 rounded-xl p-3.5 space-y-2 hover:border-amber-500/40 transition">
            <div className="flex items-center gap-2 text-foreground font-bold text-xs">
              <UserCheck size={16} className="text-emerald-500 shrink-0" />
              <span>Entrepreneur / Agent</span>
            </div>
            <p className="text-[10px] text-muted-foreground">Reward when Entrepreneur KYC is approved</p>
            <div className="flex items-center gap-1.5 bg-card border border-border rounded-lg px-2.5 py-1.5">
              <span className="text-xs font-bold text-muted-foreground">₹</span>
              <input
                type="number"
                min="0"
                value={onboardingRewards.entrepreneur}
                onChange={(e) => setOnboardingRewards(prev => ({ ...prev, entrepreneur: Number(e.target.value) }))}
                className="w-full bg-transparent font-mono font-black text-foreground text-xs outline-none"
                placeholder="0"
              />
            </div>
          </div>

          {/* Mandal Franchise */}
          <div className="bg-secondary/15 border border-border/80 rounded-xl p-3.5 space-y-2 hover:border-amber-500/40 transition">
            <div className="flex items-center gap-2 text-foreground font-bold text-xs">
              <MapPin size={16} className="text-rose-500 shrink-0" />
              <span>Mandal Franchise</span>
            </div>
            <p className="text-[10px] text-muted-foreground">Reward when Mandal Franchise is approved</p>
            <div className="flex items-center gap-1.5 bg-card border border-border rounded-lg px-2.5 py-1.5">
              <span className="text-xs font-bold text-muted-foreground">₹</span>
              <input
                type="number"
                min="0"
                value={onboardingRewards.mandal_franchise}
                onChange={(e) => setOnboardingRewards(prev => ({ ...prev, mandal_franchise: Number(e.target.value) }))}
                className="w-full bg-transparent font-mono font-black text-foreground text-xs outline-none"
                placeholder="0"
              />
            </div>
          </div>

          {/* District Franchise */}
          <div className="bg-secondary/15 border border-border/80 rounded-xl p-3.5 space-y-2 hover:border-amber-500/40 transition">
            <div className="flex items-center gap-2 text-foreground font-bold text-xs">
              <Building size={16} className="text-orange-500 shrink-0" />
              <span>District Franchise</span>
            </div>
            <p className="text-[10px] text-muted-foreground">Reward when District Franchise is approved</p>
            <div className="flex items-center gap-1.5 bg-card border border-border rounded-lg px-2.5 py-1.5">
              <span className="text-xs font-bold text-muted-foreground">₹</span>
              <input
                type="number"
                min="0"
                value={onboardingRewards.district_franchise}
                onChange={(e) => setOnboardingRewards(prev => ({ ...prev, district_franchise: Number(e.target.value) }))}
                className="w-full bg-transparent font-mono font-black text-foreground text-xs outline-none"
                placeholder="0"
              />
            </div>
          </div>

          {/* State Franchise */}
          <div className="bg-secondary/15 border border-border/80 rounded-xl p-3.5 space-y-2 hover:border-amber-500/40 transition">
            <div className="flex items-center gap-2 text-foreground font-bold text-xs">
              <Globe size={16} className="text-cyan-500 shrink-0" />
              <span>State Franchise</span>
            </div>
            <p className="text-[10px] text-muted-foreground">Reward when State Franchise is approved</p>
            <div className="flex items-center gap-1.5 bg-card border border-border rounded-lg px-2.5 py-1.5">
              <span className="text-xs font-bold text-muted-foreground">₹</span>
              <input
                type="number"
                min="0"
                value={onboardingRewards.state_franchise}
                onChange={(e) => setOnboardingRewards(prev => ({ ...prev, state_franchise: Number(e.target.value) }))}
                className="w-full bg-transparent font-mono font-black text-foreground text-xs outline-none"
                placeholder="0"
              />
            </div>
          </div>
        </div>

        <div className="p-3 bg-secondary/30 rounded-xl border border-border/60 text-[11px] text-muted-foreground flex items-center justify-between">
          <span>* All rewards are set to <b>₹0 by default</b>. Changing any amount here immediately updates the live backend referral settlement engine.</span>
          <button
            type="button"
            onClick={() => setOnboardingRewards({
              vendor: 0, service_provider: 0, wholesaler: 0, manufacturer: 0,
              entrepreneur: 0, mandal_franchise: 0, district_franchise: 0, state_franchise: 0
            })}
            className="text-rose-500 hover:text-rose-600 font-bold underline text-[11px] cursor-pointer bg-transparent border-0"
          >
            Reset All to ₹0
          </button>
        </div>
      </div>

    </div>
  );
};
