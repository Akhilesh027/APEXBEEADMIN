import React, { useState, useEffect } from 'react';
import { Plus, Sliders, ShieldCheck, Key } from 'lucide-react';
import { subscriptionApi } from '../api/subscriptionApi';

export const FeatureLibraryManager: React.FC = () => {
  const [features, setFeatures] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);

  const [form, setForm] = useState({
    key: '',
    name: '',
    description: '',
    category: 'CORE',
    valueType: 'BOOLEAN',
    resetCycle: 'NEVER',
    enforcementMode: 'HARD_BLOCK',
    scope: 'VENDOR'
  });

  useEffect(() => {
    fetchFeatures();
  }, []);

  const fetchFeatures = async () => {
    try {
      setLoading(true);
      const res = await subscriptionApi.getFeatures();
      if (res.success) setFeatures(res.features || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await subscriptionApi.createFeature(form);
      if (res.success) {
        setModalOpen(false);
        fetchFeatures();
      }
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold text-white">System Feature Library</h3>
          <p className="text-xs text-slate-400">Master repository of feature keys, reset cycles, enforcement modes, and value types.</p>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20"
        >
          <Plus className="w-4 h-4" />
          Add Feature Key
        </button>
      </div>

      {/* Grid of Features */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {features.map(f => (
          <div key={f._id} className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-mono font-bold bg-primary/10 text-primary border border-primary/20">
                {f.key}
              </span>
              <span className="text-xs font-medium text-slate-400 uppercase">{f.category}</span>
            </div>
            <div>
              <h4 className="text-sm font-bold text-white">{f.name}</h4>
              <p className="text-xs text-slate-400 mt-1 line-clamp-2">{f.description || 'No description provided.'}</p>
            </div>
            <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-800/80">
              <span>Type: <strong className="text-slate-200">{f.valueType}</strong></span>
              <span>Enforcement: <strong className="text-slate-200">{f.enforcementMode}</strong></span>
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <h4 className="text-lg font-bold text-white">Create Master Feature Definition</h4>

            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Feature Key (Unique Uppercase)</label>
                <input
                  type="text"
                  required
                  placeholder="KITCHEN_DISPLAY_SYSTEM"
                  value={form.key}
                  onChange={e => setForm({ ...form, key: e.target.value.toUpperCase() })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Feature Name</label>
                <input
                  type="text"
                  required
                  placeholder="Kitchen Display System (KDS)"
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-primary"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Category</label>
                  <select
                    value={form.category}
                    onChange={e => setForm({ ...form, category: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white"
                  >
                    <option value="CORE">CORE</option>
                    <option value="POS">POS</option>
                    <option value="ORDERS">ORDERS</option>
                    <option value="STAFF">STAFF</option>
                    <option value="REPORTS">REPORTS</option>
                    <option value="MARKETING">MARKETING</option>
                    <option value="COMMUNICATION">COMMUNICATION</option>
                    <option value="AI">AI</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Value Type</label>
                  <select
                    value={form.valueType}
                    onChange={e => setForm({ ...form, valueType: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white"
                  >
                    <option value="BOOLEAN">BOOLEAN</option>
                    <option value="COUNT">COUNT</option>
                    <option value="CREDITS">CREDITS</option>
                    <option value="STORAGE">STORAGE</option>
                  </select>
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
                  Save Feature Key
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
