import React, { useState, useEffect } from 'react';
import { Layers, Search, Filter, ShieldCheck, Tag, CheckCircle, Edit, Copy } from 'lucide-react';

interface CategoryProfilesManagerProps {
  onRefresh?: () => void;
  onEditProfile?: (profile: any) => void;
}

export const CategoryProfilesManager: React.FC<CategoryProfilesManagerProps> = ({ onEditProfile }) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('FOOD_AND_DINING');
  const [selectedTier, setSelectedTier] = useState<string>('ALL');

  const categories = [
    { code: 'FOOD_AND_DINING', name: 'Food & Dining (Restaurant, Cafe, Bakery)' },
    { code: 'DAILY_NEEDS', name: 'Daily Needs (Grocery, Dairy, Meat)' },
    { code: 'DEVOTIONAL', name: 'Devotional (Pooja Kits, Prasadam)' },
    { code: 'SERVICES', name: 'Services (Salon, Repair, Cleaning)' },
    { code: 'ACADEMY', name: 'Academy (Courses, Coaching, Skill)' },
    { code: 'HEALTH', name: 'Health & Wellness' },
    { code: 'DELIVERY', name: 'Delivery & Logistics' },
    { code: 'EVENTS', name: 'Events & Ticketing' },
    { code: 'TRAVEL', name: 'Tours & Travels' },
    { code: 'PETS', name: 'Pets World' },
    { code: 'KIDS', name: 'Kids World' },
    { code: 'BUSINESS_HUB', name: 'Business Hub (B2B)' },
    { code: 'FINANCE', name: 'Financial Services' },
    { code: 'WOMENS_EMPIRE', name: 'Women Entrepreneur Empire' }
  ];

  const profilesData: Record<string, any[]> = {
    FOOD_AND_DINING: [
      { tierCode: 'APEXBEE_STARTER', tierName: 'Starter', displayName: 'Restaurant Starter', monthlyPrice: 0, yearlyPrice: 0, orderLimit: '100 Orders/mo', staffCount: 2, posAccess: 'Basic POS', features: ['List 50 Menu Items', '1 Outlet', 'Basic Orders', 'Email Support'] },
      { tierCode: 'APEXBEE_BUSINESS', tierName: 'Business', displayName: 'Restaurant Business', monthlyPrice: 999, yearlyPrice: 9990, orderLimit: '3,000 Orders/mo', staffCount: 10, posAccess: 'Omnichannel POS', features: ['List 500 Menu Items', '2 Outlets', 'Kitchen Display System (KDS)', 'Table Management', 'Customer CRM'] },
      { tierCode: 'APEXBEE_PREMIUM', tierName: 'Premium', displayName: 'Restaurant Premium', monthlyPrice: 1999, yearlyPrice: 19990, orderLimit: '20,000 Orders/mo', staffCount: 50, posAccess: 'Multi-counter POS', features: ['Unlimited Menu Items', '5 Outlets', 'KDS & Table Ops', 'Advanced AI Reports', 'Automated Payouts'] }
    ],
    DAILY_NEEDS: [
      { tierCode: 'APEXBEE_STARTER', tierName: 'Starter', displayName: 'Grocery Starter', monthlyPrice: 0, yearlyPrice: 0, orderLimit: '200 Orders/mo', staffCount: 2, posAccess: 'Barcode POS', features: ['List 100 Products', '1 Outlet', 'Basic Stock', 'Standard Payouts'] },
      { tierCode: 'APEXBEE_BUSINESS', tierName: 'Business', displayName: 'Grocery Business', monthlyPrice: 999, yearlyPrice: 9990, orderLimit: '5,000 Orders/mo', staffCount: 15, posAccess: 'Advanced Barcode', features: ['List 2,000 Products', '3 Outlets', 'Subscription Delivery Engine', 'Batch & Expiry Tracking'] },
      { tierCode: 'APEXBEE_PREMIUM', tierName: 'Premium', displayName: 'Grocery Premium', monthlyPrice: 1999, yearlyPrice: 19990, orderLimit: '30,000 Orders/mo', staffCount: 75, posAccess: 'Multi-warehouse POS', features: ['Unlimited Products', '10 Outlets', 'Wholesale B2B Rates', 'Route Optimization'] }
    ],
    DEVOTIONAL: [
      { tierCode: 'APEXBEE_STARTER', tierName: 'Starter', displayName: 'Devotional Starter', monthlyPrice: 0, yearlyPrice: 0, orderLimit: '100 Orders/mo', staffCount: 2, posAccess: 'Basic POS', features: ['List 50 Pooja Items', '1 Outlet', 'Basic Catalog'] },
      { tierCode: 'APEXBEE_BUSINESS', tierName: 'Business', displayName: 'Devotional Business', monthlyPrice: 499, yearlyPrice: 4990, orderLimit: '2,500 Orders/mo', staffCount: 10, posAccess: 'Standard POS', features: ['List 750 Items', 'Pooja Kits Builder', 'Festival Combos', 'Custom Garlands'] },
      { tierCode: 'APEXBEE_PREMIUM', tierName: 'Premium', displayName: 'Devotional Premium', monthlyPrice: 999, yearlyPrice: 9990, orderLimit: '15,000 Orders/mo', staffCount: 40, posAccess: 'Temple Partner POS', features: ['Unlimited Items', 'Temple Partner Tools', 'Bulk Orders', 'Prasadam Compliance'] }
    ],
    SERVICES: [
      { tierCode: 'APEXBEE_STARTER', tierName: 'Starter', displayName: 'Service Provider Starter', monthlyPrice: 0, yearlyPrice: 0, orderLimit: '100 Bookings/mo', staffCount: 2, posAccess: 'Slot Booking', features: ['20 Service Listings', '1 Service Area', 'Basic Schedule'] },
      { tierCode: 'APEXBEE_BUSINESS', tierName: 'Business', displayName: 'Service Provider Business', monthlyPrice: 699, yearlyPrice: 6990, orderLimit: '3,000 Bookings/mo', staffCount: 20, posAccess: 'Slot Engine', features: ['250 Service Listings', '10 Service Areas', 'Staff Scheduling', 'Recurring Services'] },
      { tierCode: 'APEXBEE_PREMIUM', tierName: 'Premium', displayName: 'Service Provider Premium', monthlyPrice: 1499, yearlyPrice: 14990, orderLimit: '20,000 Bookings/mo', staffCount: 100, posAccess: 'Job Automation', features: ['Unlimited Services', 'Unlimited Areas', 'Customer CRM', 'Priority Dispatch'] }
    ],
    ACADEMY: [
      { tierCode: 'APEXBEE_STARTER', tierName: 'Starter', displayName: 'Academy Starter', monthlyPrice: 0, yearlyPrice: 0, orderLimit: '100 Enrolments/mo', staffCount: 2, posAccess: 'Course Engine', features: ['3 Courses', '2 GB Video Storage', 'Basic Assessments'] },
      { tierCode: 'APEXBEE_BUSINESS', tierName: 'Business', displayName: 'Academy Business', monthlyPrice: 999, yearlyPrice: 9990, orderLimit: '5,000 Enrolments/mo', staffCount: 20, posAccess: 'Live Class Engine', features: ['50 Courses', '100 GB Video Storage', 'Live Classes', 'Student CRM'] },
      { tierCode: 'APEXBEE_PREMIUM', tierName: 'Premium', displayName: 'Academy Premium', monthlyPrice: 2499, yearlyPrice: 24990, orderLimit: 'Unlimited Enrolments', staffCount: 100, posAccess: 'LMS Enterprise', features: ['Unlimited Courses', '1 TB Video Storage', 'Certificates', 'Advanced Analytics'] }
    ]
  };

  const currentProfiles = profilesData[selectedCategory] || profilesData['FOOD_AND_DINING'] || [];
  const filteredProfiles = currentProfiles.filter(p => selectedTier === 'ALL' || p.tierCode === selectedTier);

  return (
    <div className="space-y-6 font-sans text-left">
      {/* Category Selector Bar */}
      <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="text-sm font-black text-white flex items-center gap-2">
            <Layers className="w-4 h-4 text-amber-500" /> Category-Specific Plan Profiles (3 Tiers × 15 Categories)
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Configure custom display names, pricing, and feature limits per business category.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-2 bg-slate-800 text-white text-xs font-semibold rounded-xl border border-slate-700 focus:outline-none focus:border-primary"
          >
            {categories.map(c => (
              <option key={c.code} value={c.code}>{c.name}</option>
            ))}
          </select>

          <select
            value={selectedTier}
            onChange={(e) => setSelectedTier(e.target.value)}
            className="px-3 py-2 bg-slate-800 text-white text-xs font-semibold rounded-xl border border-slate-700 focus:outline-none focus:border-primary"
          >
            <option value="ALL">All Tiers (Starter, Business, Premium)</option>
            <option value="APEXBEE_STARTER">Starter Tier Only</option>
            <option value="APEXBEE_BUSINESS">Business Tier Only</option>
            <option value="APEXBEE_PREMIUM">Premium Tier Only</option>
          </select>
        </div>
      </div>

      {/* Profiles Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {filteredProfiles.map((p, idx) => (
          <div key={idx} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 relative flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="px-2.5 py-1 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 text-[10px] font-black uppercase">
                  {p.tierName} Tier
                </span>
                <span className="text-[11px] text-slate-400 font-mono">{p.tierCode}</span>
              </div>

              <h4 className="text-lg font-black text-white mb-1">{p.displayName}</h4>
              <p className="text-xs text-slate-400 mb-4">{p.orderLimit} • {p.staffCount} Staff Accounts</p>

              <div className="bg-slate-800/60 p-3 rounded-xl mb-4 space-y-1 text-xs">
                <div className="flex justify-between text-slate-300">
                  <span>Monthly Price:</span>
                  <strong className="text-white">₹{p.monthlyPrice}</strong>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>Yearly Price (2 Mo Free):</span>
                  <strong className="text-emerald-400">₹{p.yearlyPrice}</strong>
                </div>
              </div>

              <div className="space-y-1.5 text-xs">
                <span className="text-[10px] font-extrabold uppercase text-slate-500 tracking-wider">Configured Limits & Tools</span>
                {p.features.map((feat: string, fIdx: number) => (
                  <div key={fIdx} className="flex items-center gap-2 text-slate-300">
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>{feat}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-800 flex items-center justify-between">
              <span className="text-[10px] text-slate-500 uppercase font-bold">{p.posAccess}</span>
              <button
                onClick={() => onEditProfile && onEditProfile({ ...p, category: selectedCategory })}
                className="text-xs font-bold text-primary hover:underline flex items-center gap-1 cursor-pointer"
              >
                <Edit className="w-3.5 h-3.5" /> Edit Profile
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
