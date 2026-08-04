import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  Layers,
  DollarSign,
  Sliders,
  Tag,
  ShieldAlert,
  Plus
} from 'lucide-react';
import { SubscriptionAdminDashboard } from '../features/subscriptions/components/SubscriptionAdminDashboard';
import { PlanBuilderModal } from '../features/subscriptions/components/PlanBuilderModal';
import { VendorPricingManager } from '../features/subscriptions/components/VendorPricingManager';
import { FeatureLibraryManager } from '../features/subscriptions/components/FeatureLibraryManager';
import { DiscountEngineManager } from '../features/subscriptions/components/DiscountEngineManager';
import { SubscriptionAuditLogsView } from '../features/subscriptions/components/SubscriptionAuditLogsView';
import { CategoryProfilesManager } from '../features/subscriptions/components/CategoryProfilesManager';
import { subscriptionApi } from '../features/subscriptions/api/subscriptionApi';

export const SubscriptionManagement: React.FC = () => {
  const [activeTab, setActiveTab] = useState<
    'analytics' | 'category_profiles' | 'plans' | 'vendor_pricing' | 'features' | 'discounts' | 'audits'
  >('analytics');

  const [analytics, setAnalytics] = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [prices, setPrices] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const [planModalOpen, setPlanModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);

  useEffect(() => {
    fetchDashboardAndProducts();
  }, [activeTab]);

  const fetchDashboardAndProducts = async () => {
    try {
      setLoading(true);
      const dashRes = await subscriptionApi.getDashboard();
      const prodRes = await subscriptionApi.getProducts();

      if (dashRes.success) setAnalytics(dashRes.analytics);
      if (prodRes.success) {
        setProducts(prodRes.products || []);
        setPrices(prodRes.prices || []);
      }
    } catch (err) {
      console.error('Error loading subscription admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-white flex items-center gap-3">
            ApexBee Universal Subscription Engine
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Production-ready multi-tenant SaaS billing, commercial pricing overrides, feature entitlements, and audit logs.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              setEditingProduct(null);
              setPlanModalOpen(true);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary/90 text-white text-sm font-semibold rounded-xl transition-colors shadow-lg shadow-primary/20 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            New Plan / Add-on
          </button>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto border-b border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab('analytics')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all ${
            activeTab === 'analytics'
              ? 'bg-primary text-white shadow-lg shadow-primary/20'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <LayoutDashboard className="w-4 h-4" />
          MRR & Analytics
        </button>

        <button
          onClick={() => setActiveTab('category_profiles')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all ${
            activeTab === 'category_profiles'
              ? 'bg-primary text-white shadow-lg shadow-primary/20'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <Layers className="w-4 h-4 text-amber-400" />
          3-Tier Category Profiles
        </button>

        <button
          onClick={() => setActiveTab('plans')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all ${
            activeTab === 'plans'
              ? 'bg-primary text-white shadow-lg shadow-primary/20'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <Layers className="w-4 h-4" />
          Plans & Add-ons Catalog
        </button>

        <button
          onClick={() => setActiveTab('vendor_pricing')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all ${
            activeTab === 'vendor_pricing'
              ? 'bg-primary text-white shadow-lg shadow-primary/20'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <DollarSign className="w-4 h-4" />
          Vendor Custom Pricing
        </button>

        <button
          onClick={() => setActiveTab('features')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all ${
            activeTab === 'features'
              ? 'bg-primary text-white shadow-lg shadow-primary/20'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <Sliders className="w-4 h-4" />
          Feature Library
        </button>

        <button
          onClick={() => setActiveTab('discounts')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all ${
            activeTab === 'discounts'
              ? 'bg-primary text-white shadow-lg shadow-primary/20'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <Tag className="w-4 h-4" />
          Discounts & Offers
        </button>

        <button
          onClick={() => setActiveTab('audits')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all ${
            activeTab === 'audits'
              ? 'bg-primary text-white shadow-lg shadow-primary/20'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <ShieldAlert className="w-4 h-4" />
          Audit Trail
        </button>
      </div>

      {/* Tab Content */}
      <div className="pt-2">
        {activeTab === 'analytics' && (
          <SubscriptionAdminDashboard analytics={analytics} loading={loading} onRefresh={fetchDashboardAndProducts} />
        )}

        {activeTab === 'category_profiles' && (
          <CategoryProfilesManager
            onEditProfile={(prof) => {
              setEditingProduct(prof);
              setPlanModalOpen(true);
            }}
          />
        )}

        {activeTab === 'plans' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {products.map(p => {
                const prodPrices = prices.filter(pr => pr.productId === p._id);
                const mPrice = prodPrices.find(pr => pr.billingCycle === 'MONTHLY');
                const yPrice = prodPrices.find(pr => pr.billingCycle === 'YEARLY');

                return (
                  <div
                    key={p._id}
                    className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm relative overflow-hidden flex flex-col justify-between"
                  >
                    {p.isFeatured && (
                      <span className="absolute top-0 right-0 bg-primary text-white text-[10px] uppercase font-bold px-3 py-1 rounded-bl-xl shadow-md">
                        Featured
                      </span>
                    )}
                    <div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            p.productType === 'PLAN' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' : 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                          }`}
                        >
                          {p.productType}
                        </span>
                        <span className="text-xs font-mono text-slate-500">{p.code}</span>
                      </div>

                      <h3 className="text-lg font-extrabold text-white mt-2">{p.name}</h3>
                      <p className="text-xs text-slate-400 mt-1 line-clamp-2">{p.description}</p>

                      <div className="mt-4 pt-4 border-t border-slate-800 space-y-1">
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-400">Monthly:</span>
                          <span className="font-bold text-white">₹{mPrice ? mPrice.originalAmount : 'N/A'}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-400">Yearly:</span>
                          <span className="font-bold text-emerald-400">₹{yPrice ? yPrice.originalAmount : 'N/A'}</span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center justify-between">
                      <span className="text-xs text-slate-500">{p.supportedVendorTypes?.join(', ') || 'All Vendors'}</span>
                      <button
                        onClick={() => {
                          setEditingProduct(p);
                          setPlanModalOpen(true);
                        }}
                        className="text-xs font-semibold text-primary hover:underline"
                      >
                        Edit Plan
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {activeTab === 'vendor_pricing' && <VendorPricingManager />}

        {activeTab === 'features' && <FeatureLibraryManager />}

        {activeTab === 'discounts' && <DiscountEngineManager />}

        {activeTab === 'audits' && <SubscriptionAuditLogsView />}
      </div>

      {/* Modals */}
      <PlanBuilderModal
        isOpen={planModalOpen}
        onClose={() => setPlanModalOpen(false)}
        onSuccess={fetchDashboardAndProducts}
        initialProduct={editingProduct}
      />
    </div>
  );
};
