import React, { useState } from 'react';
import { useAdminState } from '../context/AdminStateContext';
import { Order } from '../types';
import { Check, X, Search, Eye } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const PaymentVerification: React.FC = () => {
  const { orders, verifyPayment } = useAdminState();
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  
  const [filter, setFilter] = useState<'All' | 'Pending Verification' | 'Approved' | 'Rejected'>('Pending Verification');
  const [search, setSearch] = useState('');
  
  // Custom Rejection comment box states
  const [commentText, setCommentText] = useState('');
  const [showRejectForm, setShowRejectForm] = useState(false);
  
  // Image zoom state
  const [zoomImage, setZoomImage] = useState<string | null>(null);

  const filteredOrders = orders.filter(o => {
    const matchesFilter = filter === 'All' || o.paymentStatus === filter;
    const matchesSearch = o.customerName.toLowerCase().includes(search.toLowerCase()) ||
                          o.id.toLowerCase().includes(search.toLowerCase()) ||
                          o.upiRefNo.includes(search);
    return matchesFilter && matchesSearch;
  });

  const handleApprove = () => {
    if (!selectedOrder) return;
    verifyPayment(selectedOrder.id, 'Approved', 'UPI Reference code validated successfully.');
    setSelectedOrder({
      ...selectedOrder,
      paymentStatus: 'Approved',
      orderStatus: 'Payment Verified',
      timeline: [
        ...selectedOrder.timeline,
        {
          status: 'Payment Verified',
          date: new Date().toISOString().replace('T', ' ').substring(0, 16),
          note: 'UPI Reference code validated successfully.'
        }
      ]
    });
  };

  const handleReject = (status: 'Rejected' | 'Request Reupload') => {
    if (!selectedOrder || !commentText.trim()) return;
    verifyPayment(selectedOrder.id, status, commentText);
    setSelectedOrder({
      ...selectedOrder,
      paymentStatus: status,
      timeline: [
        ...selectedOrder.timeline,
        {
          status: `Payment ${status}`,
          date: new Date().toISOString().replace('T', ' ').substring(0, 16),
          note: commentText
        }
      ]
    });
    setCommentText('');
    setShowRejectForm(false);
  };

  return (
    <div className="space-y-6">
      
      {/* Filters & Search */}
      <div className="bg-card border border-border/80 rounded-2xl p-4 flex flex-col md:flex-row gap-4 items-center justify-between shadow-sm select-none">
        <div className="flex gap-2 flex-wrap">
          {(['All', 'Pending Verification', 'Approved', 'Rejected'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                filter === f
                  ? 'bg-primary text-primary-foreground border-primary shadow-md'
                  : 'bg-card text-muted-foreground border-border hover:bg-secondary/40 hover:text-foreground'
              }`}
            >
              {f === 'Pending Verification' ? 'Pending Audit' : f}
            </button>
          ))}
        </div>

        <div className="relative w-full md:w-72 shrink-0">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search customer, Order ID, UPI..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-border/80 focus:border-primary rounded-xl bg-secondary/20 text-xs text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/20 transition-all"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Order Payment List - 5 columns */}
        <div className="lg:col-span-5 bg-card border border-border/80 rounded-2xl overflow-hidden shadow-sm">
          <div className="px-5 py-4 border-b border-border/60 bg-secondary/10">
            <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">Manual UPI Receipts</h3>
          </div>
          <div className="divide-y divide-border/60">
            {filteredOrders.map(order => (
              <div
                key={order.id}
                onClick={() => {
                  setSelectedOrder(order);
                  setShowRejectForm(false);
                  setCommentText('');
                }}
                className={`p-4 flex items-center justify-between cursor-pointer hover:bg-secondary/20 transition-all ${
                  selectedOrder?.id === order.id ? 'bg-secondary/40 border-l-4 border-primary' : ''
                }`}
              >
                <div>
                  <span className="font-semibold text-xs text-foreground block">{order.customerName}</span>
                  <span className="text-[10px] text-muted-foreground block mt-1">
                    Order: {order.id} • UPI Ref: <span className="font-mono font-medium text-foreground">{order.upiRefNo}</span>
                  </span>
                  <span className="text-[9px] text-muted-foreground/80 mt-1 block font-mono">{order.date}</span>
                </div>
                <div className="shrink-0 flex flex-col items-end gap-1.5">
                  <span className="font-mono text-xs font-bold text-foreground">₹{order.totalAmount.toLocaleString('en-IN')}</span>
                  {order.paymentStatus === 'Pending Verification' ? (
                    <span className="px-1.5 py-0.5 bg-amber-500/10 text-amber-500 font-bold rounded-lg text-[9px] animate-pulse">Pending Audit</span>
                  ) : order.paymentStatus === 'Approved' ? (
                    <span className="px-1.5 py-0.5 bg-emerald-500/10 text-emerald-500 font-bold rounded-lg text-[9px]">Approved</span>
                  ) : (
                    <span className="px-1.5 py-0.5 bg-rose-500/10 text-rose-500 font-bold rounded-lg text-[9px]">{order.paymentStatus}</span>
                  )}
                </div>
              </div>
            ))}
            {filteredOrders.length === 0 && (
              <div className="p-8 text-center text-xs text-muted-foreground">
                No orders matching this payment filter.
              </div>
            )}
          </div>
        </div>

        {/* Audit Details - 7 columns */}
        {selectedOrder ? (
          <div className="lg:col-span-7 bg-card border border-border/80 rounded-2xl p-5 shadow-sm space-y-5">
            <div className="flex justify-between items-center border-b border-border pb-3">
              <div>
                <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">Payment Transaction Audit</h3>
                <p className="text-[10px] text-muted-foreground mt-0.5">Order ID: {selectedOrder.id} • Date: {selectedOrder.date}</p>
              </div>
              <span className="font-mono font-bold text-sm text-foreground">₹{selectedOrder.totalAmount.toLocaleString('en-IN')}</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Customer Info & Order Spec */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Customer Details</span>
                  <div className="text-[10px] bg-secondary/10 p-3 rounded-xl border border-border/40 space-y-1.5">
                    <p><span className="text-muted-foreground">Name: </span><span className="font-semibold text-foreground">{selectedOrder.customerName}</span></p>
                    <p><span className="text-muted-foreground">Mobile: </span><span className="font-mono text-foreground">{selectedOrder.customerMobile}</span></p>
                    <p className="leading-relaxed"><span className="text-muted-foreground">Address: </span><span className="text-foreground">{selectedOrder.customerAddress}</span></p>
                  </div>
                </div>

                <div className="space-y-2">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Items Purchased</span>
                  <div className="border border-border rounded-xl overflow-hidden text-[10px]">
                    <table className="w-full text-left text-foreground">
                      <thead className="bg-secondary/40 select-none">
                        <tr>
                          <th className="p-2 font-semibold text-muted-foreground">Product</th>
                          <th className="p-2 font-semibold text-muted-foreground text-center">Qty</th>
                          <th className="p-2 font-semibold text-muted-foreground text-right">Price</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {selectedOrder.items.map(item => (
                          <tr key={item.productId} className="hover:bg-secondary/10">
                            <td className="p-2 truncate max-w-[140px] font-medium">{item.productName}</td>
                            <td className="p-2 text-center font-mono">{item.quantity}</td>
                            <td className="p-2 text-right font-mono">₹{item.price}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* UPI Screenshot Box & Ref Verification */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">UPI Transaction Reference</span>
                  <div className="p-3 bg-indigo-500/5 border border-indigo-500/20 text-indigo-500 rounded-xl text-center select-all">
                    <span className="text-xs font-mono font-bold tracking-wider">{selectedOrder.upiRefNo}</span>
                    <span className="block text-[8px] text-muted-foreground mt-1 font-sans">Double click or drag to copy. Query this reference in merchant account portal.</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Customer Receipt Capture</span>
                  <div
                    onClick={() => setZoomImage(selectedOrder.paymentScreenshot)}
                    className="border border-border rounded-xl overflow-hidden bg-secondary/15 hover:bg-secondary/20 relative cursor-pointer group flex flex-col items-center justify-center p-2 transition-all"
                  >
                    <img
                      src={selectedOrder.paymentScreenshot}
                      alt="UPI Receipt Screenshot"
                      className="h-32 object-contain rounded-lg group-hover:scale-[1.02] transition-transform"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-[10px] font-semibold transition-opacity gap-1">
                      <Eye size={12} /> Zoom Screenshot
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Audit Logs / Timeline */}
            <div className="space-y-2">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Transaction Log History</span>
              <div className="bg-secondary/10 p-3 rounded-xl border border-border/40 divide-y divide-border/60 text-[10px] font-mono">
                {selectedOrder.timeline.map((entry, idx) => (
                  <div key={idx} className="py-2 first:pt-0 last:pb-0">
                    <span className="text-muted-foreground">[{entry.date}] </span>
                    <span className="font-semibold text-primary">{entry.status}: </span>
                    <span className="text-foreground">{entry.note}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Actions panel */}
            <div className="pt-3 border-t border-border">
              {selectedOrder.paymentStatus === 'Pending Verification' ? (
                <>
                  {showRejectForm ? (
                    <div className="space-y-3 animate-fadeIn text-xs">
                      <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Reason for Audit Failure</label>
                      <textarea
                        value={commentText}
                        onChange={(e) => setCommentText(e.target.value)}
                        placeholder="e.g. reference number doesn't match screenshot, or screenshot is blurry..."
                        className="w-full text-xs p-2.5 border border-border/80 focus:border-rose-500 rounded-xl bg-secondary/10 outline-none h-16 placeholder:text-muted-foreground text-foreground"
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleReject('Rejected')}
                          className="w-1/2 py-2 bg-rose-500 hover:bg-rose-600 text-white font-bold rounded-xl transition-all"
                        >
                          Confirm Rejection
                        </button>
                        <button
                          onClick={() => handleReject('Request Reupload')}
                          className="w-1/2 py-2 bg-cyan-500 hover:bg-cyan-600 text-white font-bold rounded-xl transition-all"
                        >
                          Request Re-upload
                        </button>
                      </div>
                      <button
                        onClick={() => setShowRejectForm(false)}
                        className="w-full py-1.5 bg-secondary text-foreground hover:bg-secondary/80 border border-border rounded-xl text-[10px] font-bold transition-all"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <div className="flex gap-3">
                      <button
                        onClick={handleApprove}
                        className="w-1/2 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-md shadow-emerald-500/10 transition-all"
                      >
                        <Check size={16} /> Approve payment
                      </button>
                      <button
                        onClick={() => setShowRejectForm(true)}
                        className="w-1/2 py-2.5 bg-rose-500/10 hover:bg-rose-500/25 border border-rose-500/20 text-rose-500 font-semibold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-all"
                      >
                        <X size={16} /> Reject / Request Reupload
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <div className="py-2.5 bg-secondary/40 text-center rounded-xl text-xs font-semibold text-muted-foreground border border-border">
                  This transaction is already verified as {selectedOrder.paymentStatus.toUpperCase()}
                </div>
              )}
            </div>

          </div>
        ) : (
          <div className="lg:col-span-7 bg-card border border-border rounded-2xl p-12 flex flex-col items-center justify-center text-center shadow-sm min-h-[420px]">
            <div className="w-16 h-16 rounded-full bg-primary/10 text-primary flex items-center justify-center mb-4">
              <Eye size={28} />
            </div>
            <h3 className="font-bold text-foreground text-sm tracking-wide">No Payment Selected</h3>
            <p className="text-xs text-muted-foreground max-w-sm mt-1.5 leading-relaxed">
              You have not selected any transaction. Please select a UPI receipt transaction from the list on the left to audit customer billing data, verify the reference code, and view receipt screenshots.
            </p>
          </div>
        )}

      </div>

      {/* Full-screen image zoom modal */}
      <AnimatePresence>
        {zoomImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="bg-card border border-border max-w-lg w-full rounded-2xl overflow-hidden shadow-2xl p-4 relative"
            >
              <div className="flex items-center justify-between pb-3 border-b border-border mb-4">
                <span className="text-xs font-bold text-foreground">Transaction Receipt Preview</span>
                <button
                  onClick={() => setZoomImage(null)}
                  className="p-1 hover:bg-secondary rounded-lg text-muted-foreground hover:text-foreground transition-colors text-xs"
                >
                  Close
                </button>
              </div>
              <img src={zoomImage} alt="Zoom Receipt" className="w-full max-h-[75vh] object-contain rounded-xl" />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
};
