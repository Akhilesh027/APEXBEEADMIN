import React, { useState, useEffect } from 'react';
import { Plus, Tag, Percent, Calendar, CheckCircle } from 'lucide-react';
import { subscriptionApi } from '../api/subscriptionApi';

export const DiscountEngineManager: React.FC = () => {
  const [discounts, setDiscounts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);

  const [form, setForm] = useState({
    name: '',
    code: '',
    discountType: 'PERCENTAGE',
    discountValue: 20,
    maximumDiscountAmount: 2000,
    scope: 'COUPON',
    priority: 10,
    stackable: false
  });

  useEffect(() => {
    fetchDiscounts();
  }, []);

  const fetchDiscounts = async () => {
    try {
      setLoading(true);
      const res = await subscriptionApi.getDiscounts();
      if (res.success) setDiscounts(res.discounts || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await subscriptionApi.createDiscount(form);
      if (res.success) {
        setModalOpen(false);
        fetchDiscounts();
      }
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold text-white">Discounts, Offers & Coupon Engine</h3>
          <p className="text-xs text-slate-400">Configure promotional coupons, global festival offers, and stackable discount rules.</p>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20"
        >
          <Plus className="w-4 h-4" />
          Create Discount Code / Offer
        </button>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-xs font-semibold text-slate-400 uppercase bg-slate-950/50">
                <th className="p-4">Name / Title</th>
                <th className="p-4">Coupon Code</th>
                <th className="p-4">Scope</th>
                <th className="p-4">Discount Rate</th>
                <th className="p-4">Max Cap</th>
                <th className="p-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-sm">
              {discounts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-500">
                    No active promotional discounts. Click button above to create one.
                  </td>
                </tr>
              ) : (
                discounts.map(d => (
                  <tr key={d._id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="p-4 font-medium text-white">{d.name}</td>
                    <td className="p-4 font-mono font-bold text-primary">{d.code || 'GLOBAL'}</td>
                    <td className="p-4 text-xs font-semibold text-slate-400">{d.scope}</td>
                    <td className="p-4 text-emerald-400 font-bold">
                      {d.discountType === 'FLAT' ? `₹${d.discountValue}` : `${d.discountValue}% OFF`}
                    </td>
                    <td className="p-4 text-slate-400 text-xs">{d.maximumDiscountAmount ? `₹${d.maximumDiscountAmount}` : 'No Cap'}</td>
                    <td className="p-4">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-emerald-500/10 text-emerald-400">
                        {d.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <h4 className="text-lg font-bold text-white">Create Discount or Promotional Coupon</h4>

            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Discount Name</label>
                <input
                  type="text"
                  required
                  placeholder="Diwali Festival Special"
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Coupon Code (Optional)</label>
                <input
                  type="text"
                  placeholder="FESTIVAL20"
                  value={form.code}
                  onChange={e => setForm({ ...form, code: e.target.value.toUpperCase() })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Discount Type</label>
                  <select
                    value={form.discountType}
                    onChange={e => setForm({ ...form, discountType: e.target.value as any })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white"
                  >
                    <option value="PERCENTAGE">PERCENTAGE (%)</option>
                    <option value="FLAT">FLAT (₹)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Discount Value</label>
                  <input
                    type="number"
                    required
                    value={form.discountValue}
                    onChange={e => setForm({ ...form, discountValue: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-medium rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-primary hover:bg-primary/90 text-white text-sm font-semibold rounded-lg"
                >
                  Save Discount
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
