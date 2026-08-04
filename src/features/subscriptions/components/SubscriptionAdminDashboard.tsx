import React from 'react';
import { DollarSign, Users, AlertCircle, RefreshCw, Award, TrendingUp, Percent, ShieldCheck } from 'lucide-react';

interface Props {
  analytics: any;
  loading: boolean;
  onRefresh: () => void;
}

export const SubscriptionAdminDashboard: React.FC<Props> = ({ analytics, loading, onRefresh }) => {
  const stats = analytics || {
    mrr: 0,
    arr: 0,
    totalActiveSubscriptions: 0,
    totalTrialSubscriptions: 0,
    totalExpiredSubscriptions: 0,
    totalGracePeriodSubscriptions: 0,
    churnRatePercentage: 0,
    totalGstCollected: 0,
    totalDiscountsProvided: 0
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Subscription Analytics & Overview</h2>
          <p className="text-sm text-gray-500">Real-time SaaS billing metrics, MRR, ARR, and active vendor accounts.</p>
        </div>
        <button
          onClick={onRefresh}
          className="flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary hover:bg-primary/20 rounded-lg transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh Stats
        </button>
      </div>

      {/* Primary KPI Grid */}
      <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 transition-all ${loading ? 'animate-pulse opacity-70' : ''}`}>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-sm font-medium">Monthly Recurring (MRR)</span>
            <DollarSign className="w-5 h-5 text-emerald-400" />
          </div>
          <div className="mt-3">
            <div className="text-3xl font-extrabold text-white">₹{stats.mrr?.toLocaleString('en-IN') || 0}</div>
            <div className="flex items-center gap-1 text-xs text-emerald-400 mt-1">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>ARR Projection: ₹{stats.arr?.toLocaleString('en-IN') || 0}</span>
            </div>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-sm font-medium">Active Subscriptions</span>
            <Users className="w-5 h-5 text-blue-400" />
          </div>
          <div className="mt-3">
            <div className="text-3xl font-extrabold text-white">{stats.totalActiveSubscriptions || 0}</div>
            <div className="text-xs text-slate-400 mt-1">{stats.totalTrialSubscriptions || 0} Trials Active</div>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-sm font-medium">Churn Rate</span>
            <AlertCircle className="w-5 h-5 text-amber-400" />
          </div>
          <div className="mt-3">
            <div className="text-3xl font-extrabold text-white">{stats.churnRatePercentage || 0}%</div>
            <div className="text-xs text-amber-400/80 mt-1">{stats.totalExpiredSubscriptions || 0} Expired Total</div>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-sm font-medium">GST Collected</span>
            <ShieldCheck className="w-5 h-5 text-purple-400" />
          </div>
          <div className="mt-3">
            <div className="text-3xl font-extrabold text-white">₹{stats.totalGstCollected?.toLocaleString('en-IN') || 0}</div>
            <div className="text-xs text-slate-400 mt-1">₹{stats.totalDiscountsProvided?.toLocaleString('en-IN') || 0} Discounts Granted</div>
          </div>
        </div>
      </div>
    </div>
  );
};
