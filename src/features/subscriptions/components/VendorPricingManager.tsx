import React, { useState, useEffect } from 'react';
import { Plus, Search, Tag, Calendar, UserCheck, RefreshCw } from 'lucide-react';
import { subscriptionApi } from '../api/subscriptionApi';

export const VendorPricingManager: React.FC = () => {
  const [pricings, setPricings] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({
    vendorId: '',
    productId: '',
    overridePrice: 3999,
    reason: 'Strategic negotiated pricing',
    validTill: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await subscriptionApi.getVendorPricings();
      const pRes = await subscriptionApi.getProducts();
      if (res.success) setPricings(res.pricings || []);
      if (pRes.success) setProducts(pRes.products || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateOverride = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await subscriptionApi.setVendorPricingOverride(form);
      if (res.success) {
        alert('Vendor Custom Pricing Override Saved!');
        setModalOpen(false);
        fetchData();
      }
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold text-white">Vendor Custom Pricing & Negotiated Rates</h3>
          <p className="text-xs text-slate-400">Set vendor-specific price overrides, enterprise custom rates, and temporary promotional pricing.</p>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20"
        >
          <Plus className="w-4 h-4" />
          Add Vendor Custom Rate
        </button>
      </div>

      {/* Pricing Overrides List */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-xs font-semibold text-slate-400 uppercase bg-slate-950/50">
                <th className="p-4">Vendor</th>
                <th className="p-4">Plan / Product</th>
                <th className="p-4">Original Price</th>
                <th className="p-4">Custom Negotiated Price</th>
                <th className="p-4">Validity</th>
                <th className="p-4">Reason / Notes</th>
                <th className="p-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-sm">
              {pricings.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-500">
                    No custom vendor pricing overrides configured. Click button above to create one.
                  </td>
                </tr>
              ) : (
                pricings.map(item => (
                  <tr key={item._id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="p-4 font-medium text-white">
                      {item.vendorId?.businessName || item.vendorId || 'Vendor Account'}
                    </td>
                    <td className="p-4 text-slate-300 font-semibold">{item.productId?.name || 'Subscription Plan'}</td>
                    <td className="p-4 text-slate-400 line-through">₹{item.originalPrice}</td>
                    <td className="p-4 text-emerald-400 font-bold">₹{item.finalPrice}</td>
                    <td className="p-4 text-xs text-slate-400">
                      {item.validTill ? `Valid till ${new Date(item.validTill).toLocaleDateString()}` : 'Indefinite / Permanent'}
                    </td>
                    <td className="p-4 text-xs text-slate-300 max-w-xs truncate">{item.reason}</td>
                    <td className="p-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          item.status === 'ACTIVE' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        {item.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <h4 className="text-lg font-bold text-white">Set Custom Vendor Price</h4>

            <form onSubmit={handleCreateOverride} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Vendor ID / Mongo ID</label>
                <input
                  type="text"
                  required
                  placeholder="65bc... vendor id"
                  value={form.vendorId}
                  onChange={e => setForm({ ...form, vendorId: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Select Subscription Plan</label>
                <select
                  required
                  value={form.productId}
                  onChange={e => setForm({ ...form, productId: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-primary"
                >
                  <option value="">Select Plan...</option>
                  {products.map(p => (
                    <option key={p._id} value={p._id}>
                      {p.name} ({p.code})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Negotiated Custom Price (₹)</label>
                <input
                  type="number"
                  required
                  value={form.overridePrice}
                  onChange={e => setForm({ ...form, overridePrice: Number(e.target.value) })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Valid Till (Optional for Promotional)</label>
                <input
                  type="date"
                  value={form.validTill}
                  onChange={e => setForm({ ...form, validTill: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Reason / Agreement Reference</label>
                <input
                  type="text"
                  required
                  placeholder="Loyal customer 20% discount contract"
                  value={form.reason}
                  onChange={e => setForm({ ...form, reason: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-primary"
                />
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
                  Save Custom Price
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
