import React, { useState, useEffect } from 'react';
import { Layers, CheckCircle, Edit, RefreshCw, AlertCircle, ChevronRight } from 'lucide-react';
import { subscriptionApi } from '../api/subscriptionApi';

interface CategoryProfilesManagerProps {
  onRefresh?: () => void;
  onEditProfile?: (profile: any) => void;
}

const TIERS = [
  {
    code: 'STARTER',
    label: 'Starter',
    color: 'text-slate-300 bg-slate-800/60 border-slate-700',
    badge: 'bg-slate-700 text-slate-300',
    tagline: 'Free to begin',
    priceHint: '₹0 / month',
  },
  {
    code: 'BUSINESS',
    label: 'Business',
    color: 'text-blue-300 bg-blue-900/20 border-blue-700/40',
    badge: 'bg-blue-600/30 text-blue-300',
    tagline: 'For growing stores',
    priceHint: '₹999 / month',
  },
  {
    code: 'PREMIUM',
    label: 'Premium',
    color: 'text-amber-300 bg-amber-900/20 border-amber-700/40',
    badge: 'bg-amber-600/30 text-amber-300',
    tagline: 'Unlimited scale',
    priceHint: '₹1999 / month',
  },
];

/** Build a sensible default plan description for a category + tier */
const buildDefaultPlan = (catName: string, tierCode: string) => {
  const cat = catName.trim();
  const isFood = /food|restaurant|dine|cafe|bakery/i.test(cat);
  const isDaily = /daily|grocer|dairy|meat/i.test(cat);
  const isDevot = /devot|pooja|puja|temple/i.test(cat);
  const isShop = /shop|retail|fashion|cloth/i.test(cat);
  const isService = /service|salon|repair|clean/i.test(cat);
  const isAcademy = /academy|course|coach|skill|learn/i.test(cat);

  const itemUnit = isFood ? 'Menu Items' : isAcademy ? 'Courses' : isService ? 'Services' : 'Products';
  const orderUnit = isAcademy ? 'Enrolments' : isService ? 'Bookings' : 'Orders';

  if (tierCode === 'STARTER') {
    return {
      displayName: `${cat} — Starter`,
      monthlyPrice: 0,
      yearlyPrice: 0,
      orderLimit: isAcademy ? '100 Enrolments/mo' : `200 ${orderUnit}/mo`,
      productLimit: isAcademy ? '3' : isDevot ? '50' : '100',
      features: [
        `${isAcademy ? '3' : isDevot ? '50' : '100'} ${itemUnit}`,
        '1 Outlet / Location',
        'Standard Payouts (T+3)',
        'Email Support',
        'Basic Analytics Dashboard',
      ],
    };
  }

  if (tierCode === 'BUSINESS') {
    return {
      displayName: `${cat} — Business`,
      monthlyPrice: isDevot ? 499 : isService ? 699 : 999,
      yearlyPrice: isDevot ? 4990 : isService ? 6990 : 9990,
      orderLimit: isAcademy ? '5,000 Enrolments/mo' : isDaily ? '5,000 Orders/mo' : '3,000 Orders/mo',
      productLimit: isAcademy ? '50' : isDaily ? '2,000' : '500',
      features: [
        `${isAcademy ? '50' : isDaily ? '2,000' : '500'} ${itemUnit}`,
        `${isService ? '10 Service Areas' : '3 Outlets'}`,
        isFood ? 'Kitchen Display System (KDS)' : isAcademy ? 'Live Class Engine' : isDaily ? 'Batch & Expiry Tracking' : 'Inventory Management',
        isFood ? 'Table Management' : isService ? 'Staff Scheduling' : isShop ? 'Customer CRM' : 'Customer CRM',
        'Priority Support (24h SLA)',
        'Advanced Analytics',
      ],
    };
  }

  // PREMIUM
  return {
    displayName: `${cat} — Premium`,
    monthlyPrice: isDevot ? 999 : isService ? 1499 : isAcademy ? 2499 : 1999,
    yearlyPrice: isDevot ? 9990 : isService ? 14990 : isAcademy ? 24990 : 19990,
    orderLimit: 'Unlimited',
    productLimit: 'Unlimited',
    features: [
      `Unlimited ${itemUnit}`,
      isService ? 'Unlimited Service Areas' : isAcademy ? '1 TB Video Storage & Certificates' : '10 Outlets',
      isFood ? 'Multi-counter POS + KDS' : isAcademy ? 'LMS Enterprise Tools' : isDaily ? 'Multi-warehouse & Route Optimization' : 'Omnichannel POS',
      'Automated Payouts (T+1)',
      'Dedicated Account Manager',
      'Full API Access & Webhooks',
      'White-label Options',
    ],
  };
};

export const CategoryProfilesManager: React.FC<CategoryProfilesManagerProps> = ({ onEditProfile }) => {
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedCatId, setSelectedCatId] = useState<string>('');
  const [selectedTier, setSelectedTier] = useState<string>('ALL');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await subscriptionApi.getParentCategories();
      let cats: any[] = [];
      if (res && res.success && Array.isArray(res.categories)) {
        cats = res.categories;
      } else if (res && Array.isArray(res.data)) {
        cats = res.data;
      } else if (res && Array.isArray(res)) {
        cats = res;
      }
      // Only level-1 parent categories
      const parents = cats.filter((c: any) => !c.level || c.level === 1);
      setCategories(parents);
      if (parents.length > 0) setSelectedCatId(parents[0]._id || parents[0].id || '');
    } catch (err: any) {
      setError('Failed to load categories from database.');
    } finally {
      setLoading(false);
    }
  };

  const selectedCategory = categories.find(c => (c._id || c.id) === selectedCatId);
  const catName = selectedCategory ? (selectedCategory.name || selectedCategory.slug || '') : '';

  const tiersToShow = selectedTier === 'ALL'
    ? TIERS
    : TIERS.filter(t => t.code === selectedTier);

  return (
    <div className="space-y-6 font-sans text-left">
      {/* Header Bar */}
      <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="text-sm font-black text-white flex items-center gap-2">
            <Layers className="w-4 h-4 text-amber-500" />
            Category Subscription Plans &nbsp;
            <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[10px] font-black">
              3 TIERS × {categories.length} CATEGORIES
            </span>
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Subscription plan tiers are dynamically generated based on your active parent categories in the database.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Reload */}
          <button
            onClick={fetchCategories}
            disabled={loading}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors border border-slate-700"
            title="Reload categories from database"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>

          {/* Category selector */}
          <select
            value={selectedCatId}
            onChange={e => setSelectedCatId(e.target.value)}
            className="px-3 py-2 bg-slate-800 text-white text-xs font-semibold rounded-xl border border-slate-700 focus:outline-none focus:border-primary min-w-[200px]"
            disabled={loading || categories.length === 0}
          >
            {categories.map(c => (
              <option key={c._id || c.id} value={c._id || c.id}>
                {c.name || c.slug}
              </option>
            ))}
          </select>

          {/* Tier filter */}
          <select
            value={selectedTier}
            onChange={e => setSelectedTier(e.target.value)}
            className="px-3 py-2 bg-slate-800 text-white text-xs font-semibold rounded-xl border border-slate-700 focus:outline-none focus:border-primary"
          >
            <option value="ALL">All 3 Tiers</option>
            <option value="STARTER">Starter Only</option>
            <option value="BUSINESS">Business Only</option>
            <option value="PREMIUM">Premium Only</option>
          </select>
        </div>
      </div>

      {/* Error / Loading */}
      {error && (
        <div className="flex items-center gap-2 px-4 py-3 bg-red-900/20 border border-red-500/30 rounded-xl text-red-400 text-sm">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {error}
          <button onClick={fetchCategories} className="ml-2 underline text-xs">Retry</button>
        </div>
      )}

      {loading && (
        <div className="flex items-center justify-center py-12 text-slate-400 text-sm gap-2">
          <RefreshCw className="w-4 h-4 animate-spin" />
          Loading categories from database...
        </div>
      )}

      {!loading && categories.length === 0 && !error && (
        <div className="flex items-center justify-center py-12 text-slate-500 text-sm">
          No parent categories found in database. Please seed your categories first.
        </div>
      )}

      {/* Category breadcrumb */}
      {!loading && catName && (
        <div className="flex items-center gap-1.5 text-xs text-slate-500 px-1">
          <span className="font-bold text-slate-300">{catName}</span>
          <ChevronRight className="w-3 h-3" />
          <span>3-Tier Subscription Plans</span>
        </div>
      )}

      {/* Tier Cards Grid */}
      {!loading && catName && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {tiersToShow.map(tier => {
            const plan = buildDefaultPlan(catName, tier.code);
            return (
              <div
                key={tier.code}
                className={`border rounded-2xl p-6 flex flex-col justify-between ${tier.color}`}
              >
                <div>
                  {/* Tier Badge */}
                  <div className="flex items-center justify-between mb-4">
                    <span className={`px-2.5 py-1 rounded text-[10px] font-black uppercase border ${tier.badge} border-current/20`}>
                      {tier.label} Tier
                    </span>
                    <span className="text-[11px] opacity-60 font-mono">APEXBEE_{tier.code}</span>
                  </div>

                  {/* Display Name */}
                  <h4 className="text-base font-black text-white mb-0.5">{plan.displayName}</h4>
                  <p className="text-[11px] opacity-60 mb-4">{tier.tagline}</p>

                  {/* Pricing Box */}
                  <div className="bg-black/20 p-3 rounded-xl mb-4 space-y-1.5 text-xs">
                    <div className="flex justify-between">
                      <span className="opacity-70">Monthly:</span>
                      <strong className="text-white">
                        {plan.monthlyPrice === 0 ? 'Free' : `₹${plan.monthlyPrice.toLocaleString()}`}
                      </strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="opacity-70">Yearly (2 months free):</span>
                      <strong className="text-emerald-400">
                        {plan.yearlyPrice === 0 ? 'Free' : `₹${plan.yearlyPrice.toLocaleString()}`}
                      </strong>
                    </div>
                    <div className="flex justify-between border-t border-white/10 pt-1.5">
                      <span className="opacity-70">Order Limit:</span>
                      <strong className="text-white">{plan.orderLimit}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="opacity-70">{catName} Items:</span>
                      <strong className="text-white">{plan.productLimit}</strong>
                    </div>
                  </div>

                  {/* Features */}
                  <div className="space-y-1.5 text-xs">
                    <span className="text-[10px] font-extrabold uppercase opacity-50 tracking-wider">
                      Included Features
                    </span>
                    {plan.features.map((feat, fi) => (
                      <div key={fi} className="flex items-start gap-2 opacity-90">
                        <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                        <span>{feat}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Footer */}
                <div className="mt-6 pt-4 border-t border-white/10 flex items-center justify-between">
                  <span className="text-[10px] opacity-50 uppercase font-bold">
                    {catName} · {tier.label}
                  </span>
                  <button
                    onClick={() => onEditProfile && onEditProfile({
                      tier: tier.code,
                      category: selectedCatId,
                      categoryName: catName,
                      ...plan,
                    })}
                    className="text-xs font-bold text-primary hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Edit className="w-3.5 h-3.5" /> Edit Plan
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Category pills for quick navigation */}
      {!loading && categories.length > 1 && (
        <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-800">
          <span className="text-[10px] uppercase font-bold text-slate-600 w-full mb-1">
            Jump to category:
          </span>
          {categories.map(c => (
            <button
              key={c._id || c.id}
              onClick={() => setSelectedCatId(c._id || c.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border ${
                (c._id || c.id) === selectedCatId
                  ? 'bg-primary text-white border-primary shadow-lg shadow-primary/20'
                  : 'bg-slate-900 text-slate-400 border-slate-700 hover:border-slate-500 hover:text-white'
              }`}
            >
              {c.name || c.slug}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
