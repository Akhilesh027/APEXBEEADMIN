import React, { useState } from 'react';
import { X, Check } from 'lucide-react';
import { subscriptionApi } from '../api/subscriptionApi';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  products: any[];
}

export const VendorAssignmentModal: React.FC<Props> = ({ isOpen, onClose, onSuccess, products }) => {
  const [vendorId, setVendorId] = useState('');
  const [productId, setProductId] = useState('');
  const [reason, setReason] = useState('Manual complimentary admin assignment');
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      const selectedProd = products.find(p => p._id === productId);
      const res = await subscriptionApi.assignVendorPlan({
        vendorId,
        productId,
        reason
      });

      if (res.success) {
        alert('Plan assigned successfully!');
        onSuccess();
        onClose();
      }
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <h4 className="text-lg font-bold text-white">Manual Admin Vendor Assignment</h4>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Vendor ID (Mongo ObjectId)</label>
            <input
              type="text"
              required
              placeholder="65bc... vendor id"
              value={vendorId}
              onChange={e => setVendorId(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-primary"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Assign Plan</label>
            <select
              required
              value={productId}
              onChange={e => setProductId(e.target.value)}
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
            <label className="block text-xs font-medium text-slate-300 mb-1">Mandatory Reason Log</label>
            <textarea
              required
              rows={2}
              value={reason}
              onChange={e => setReason(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-primary"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-medium rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 bg-primary hover:bg-primary/90 text-white text-sm font-semibold rounded-lg flex items-center gap-2"
            >
              <Check className="w-4 h-4" />
              {submitting ? 'Assigning...' : 'Assign Plan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
