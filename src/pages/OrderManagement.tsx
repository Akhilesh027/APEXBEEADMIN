import React, { useState, useEffect } from 'react';
import { useAdminState } from '../context/AdminStateContext';
import { Order } from '../types';
import { Search, Award } from 'lucide-react';

export const OrderManagement: React.FC = () => {
  const { orders, updateOrderStatus, releaseCommissions } = useAdminState();
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(orders[0] || null);
  const [filter, setFilter] = useState<Order['orderStatus'] | 'All'>('All');
  const [search, setSearch] = useState('');

  const [mainView, setMainView] = useState<'orders' | 'subscriptions'>('orders');
  const [adminSubscriptions, setAdminSubscriptions] = useState<any[]>([]);
  const [loadingSubs, setLoadingSubs] = useState(false);
  const [selectedSubDetail, setSelectedSubDetail] = useState<any | null>(null);
  const [allStatements, setAllStatements] = useState<any[]>([]);
  const [settlingId, setSettlingId] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        setLoadingSubs(true);
        const token = localStorage.getItem('adminToken');
        const res = await fetch('https://server.apexbee.in/api/local-shop/subscriptions/admin/all', {
          headers: token ? { 'Authorization': `Bearer ${token}` } : {}
        });
        if (res.ok) {
          const data = await res.json();
          if (data.success) {
            setAdminSubscriptions(data.subscriptions || []);
          }
        }

        const stmtRes = await fetch('https://server.apexbee.in/api/billing/statements', {
          headers: token ? { 'Authorization': `Bearer ${token}` } : {}
        });
        if (stmtRes.ok) {
          const stmtData = await stmtRes.json();
          setAllStatements(stmtData.statements || []);
        }
      } catch (err) {
        console.error('Error fetching admin subscriptions and statements:', err);
      } finally {
        setLoadingSubs(false);
      }
    })();
  }, []);

  const handleApproveStatement = async (id: string) => {
    if (!window.confirm('Are you sure you want to approve and release wallet payouts for this statement?')) {
      return;
    }

    try {
      setSettlingId(id);
      const token = localStorage.getItem('adminToken');
      const res = await fetch(`https://server.apexbee.in/api/billing/statements/${id}/approve`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      const data = await res.json();
      if (res.ok && data.success) {
        alert('Statement settled and wallet payouts released successfully!');
        const stmtRes = await fetch('https://server.apexbee.in/api/billing/statements', {
          headers: token ? { 'Authorization': `Bearer ${token}` } : {}
        });
        if (stmtRes.ok) {
          const stmtData = await stmtRes.json();
          setAllStatements(stmtData.statements || []);
        }
      } else {
        alert(data.message || 'Failed to settle statement');
      }
    } catch (err) {
      console.error('Error settling statement:', err);
      alert('Network or server error encountered during settlement.');
    } finally {
      setSettlingId(null);
    }
  };

  const filteredOrders = orders.filter(o => {
    const matchesFilter = filter === 'All' || o.orderStatus === filter;
    const matchesSearch = o.customerName.toLowerCase().includes(search.toLowerCase()) ||
                          o.id.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const getOrderStatusBadge = (status: Order['orderStatus']) => {
    switch (status) {
      case 'Pending Payment':
        return <span className="px-2 py-0.5 bg-yellow-500/10 text-yellow-500 font-bold rounded-lg text-[9px]">Unpaid</span>;
      case 'Confirmed':
        return <span className="px-2 py-0.5 bg-blue-500/10 text-blue-500 font-bold rounded-lg text-[9px]">Confirmed</span>;
      case 'Payment Verified':
        return <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-500 font-bold rounded-lg text-[9px]">Paid / Verified</span>;
      case 'Processing':
        return <span className="px-2 py-0.5 bg-indigo-500/10 text-indigo-500 font-bold rounded-lg text-[9px]">Processing</span>;
      case 'Packed':
        return <span className="px-2 py-0.5 bg-purple-500/10 text-purple-500 font-bold rounded-lg text-[9px]">Packed</span>;
      case 'Shipped':
        return <span className="px-2 py-0.5 bg-pink-500/10 text-pink-500 font-bold rounded-lg text-[9px]">Shipped</span>;
      case 'Delivered':
        return <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-bold rounded-lg text-[9px]">Delivered</span>;
      default:
        return <span className="px-2 py-0.5 bg-secondary text-muted-foreground font-bold rounded-lg text-[9px]">{status}</span>;
    }
  };

  const getStatusStepIndex = (status: Order['orderStatus']) => {
    const steps = ['Pending Payment', 'Confirmed', 'Payment Verified', 'Processing', 'Packed', 'Shipped', 'Delivered'];
    return steps.indexOf(status);
  };

  const isCommissionReleased = (order: Order) => {
    return order.commissionReleaseStatus === 'Released' || order.timeline.some(t => t.status === 'Commissions Released');
  };

  return (
    <div className="space-y-6">
      
      <div className="flex border-b border-border/80 pb-1 gap-1 select-none">
        <button
          onClick={() => setMainView('orders')}
          className={`px-4 py-2 text-xs font-bold border-b-2 bg-transparent border-0 cursor-pointer transition ${
            mainView === 'orders' ? 'border-primary text-primary font-extrabold' : 'border-transparent text-muted-foreground'
          }`}
        >
          🏪 Hyperlocal Store Orders
        </button>
        <button
          onClick={() => setMainView('subscriptions')}
          className={`px-4 py-2 text-xs font-bold border-b-2 bg-transparent border-0 cursor-pointer transition ${
            mainView === 'subscriptions' ? 'border-primary text-primary font-extrabold' : 'border-transparent text-muted-foreground'
          }`}
        >
          🔁 Product Subscribers Hub
        </button>
      </div>

      {mainView === 'orders' ? (
        <>
          {/* Filters & search */}
          <div className="bg-card border border-border/80 rounded-2xl p-4 flex flex-col md:flex-row gap-4 items-center justify-between shadow-sm select-none">
        <div className="flex gap-2 flex-wrap max-w-full overflow-x-auto no-scrollbar">
          {(['All', 'Pending Payment', 'Confirmed', 'Payment Verified', 'Processing', 'Packed', 'Shipped', 'Delivered'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                filter === f
                  ? 'bg-primary text-primary-foreground border-primary shadow-md'
                  : 'bg-card text-muted-foreground border-border hover:bg-secondary/40 hover:text-foreground'
              }`}
            >
              {f === 'Pending Payment' ? 'Unpaid' : f === 'Payment Verified' ? 'Paid' : f}
            </button>
          ))}
        </div>

        <div className="relative w-full md:w-64 shrink-0">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search order ID, buyer..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-border/80 focus:border-primary rounded-xl bg-secondary/20 text-xs text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/20 transition-all"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Orders Master List - 5 columns */}
        <div className="lg:col-span-5 bg-card border border-border/80 rounded-2xl overflow-hidden shadow-sm">
          <div className="px-5 py-4 border-b border-border/60 bg-secondary/10">
            <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">Orders Ledger</h3>
          </div>
          <div className="divide-y divide-border/60">
            {filteredOrders.map(order => (
              <div
                key={order.id}
                onClick={() => setSelectedOrder(order)}
                className={`p-4 flex items-center justify-between cursor-pointer hover:bg-secondary/20 transition-all ${
                  selectedOrder?.id === order.id ? 'bg-secondary/40 border-l-4 border-primary' : ''
                }`}
              >
                <div>
                  <span className="font-semibold text-xs text-foreground block">{order.customerName}</span>
                  <span className="text-[10px] text-muted-foreground block mt-1">
                    ID: {order.id} • {order.items.length} items
                  </span>
                  <span className="text-[9px] text-muted-foreground mt-0.5 block font-mono">{order.date}</span>
                </div>
                <div className="shrink-0 flex flex-col items-end gap-1.5">
                  <span className="font-mono text-xs font-bold text-foreground">₹{order.totalAmount.toLocaleString('en-IN')}</span>
                  {getOrderStatusBadge(order.orderStatus)}
                </div>
              </div>
            ))}
            {filteredOrders.length === 0 && (
              <div className="p-8 text-center text-xs text-muted-foreground">
                No orders found.
              </div>
            )}
          </div>
        </div>

        {/* Order details pane - 7 columns */}
        {selectedOrder ? (
          <div className="lg:col-span-7 bg-card border border-border/80 rounded-2xl p-5 shadow-sm space-y-5">
            <div className="flex justify-between items-center border-b border-border pb-3">
              <div>
                <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">Order Specifications</h3>
                <p className="text-[10px] text-muted-foreground mt-0.5">Order ID: {selectedOrder.id} • placed: {selectedOrder.date}</p>
              </div>
              <div className="flex items-center gap-2 select-none">
                {getOrderStatusBadge(selectedOrder.orderStatus)}
              </div>
            </div>

            {/* Customer, Shipping and items details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="space-y-3 bg-secondary/15 p-3 rounded-xl border border-border/40">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Buyer Registry</span>
                <div className="space-y-1 text-[10px]">
                  <p><span className="text-muted-foreground">Buyer Name: </span><span className="font-medium text-foreground">{selectedOrder.customerName}</span></p>
                  <p><span className="text-muted-foreground">Phone: </span><span className="font-mono text-foreground">{selectedOrder.customerMobile}</span></p>
                  <p><span className="text-muted-foreground">Address: </span><span className="text-foreground">{selectedOrder.customerAddress}</span></p>
                </div>
              </div>

              <div className="space-y-3 bg-secondary/15 p-3 rounded-xl border border-border/40">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Financial Summary</span>
                <div className="space-y-1.5 text-[10px] font-mono">
                  <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span className="text-foreground">₹{selectedOrder.items.reduce((sum, i) => sum + i.price * i.quantity, 0)}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Courier Charges</span><span className="text-foreground">+₹{selectedOrder.orderStatus === 'Pending Payment' ? '0' : '40'}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Packing Charges</span><span className="text-foreground">+₹{selectedOrder.orderStatus === 'Pending Payment' ? '0' : '15'}</span></div>
                  <div className="flex justify-between border-t border-dashed border-border pt-1.5 font-bold"><span className="text-foreground">Grand Total</span><span className="text-indigo-500">₹{selectedOrder.totalAmount.toLocaleString('en-IN')}</span></div>
                </div>
              </div>
            </div>

            {/* Timeline Progress Bar */}
            <div className="space-y-3">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Fulfillment Milestones</span>
              <div className="grid grid-cols-7 gap-1.5 text-center text-[8px] font-bold text-muted-foreground relative select-none">
                {['Pending', 'Confirmed', 'Paid', 'Processing', 'Packed', 'Shipped', 'Delivered'].map((step, idx) => {
                  const currentIdx = getStatusStepIndex(selectedOrder.orderStatus);
                  const isCompleted = idx <= currentIdx;
                  const isCurrent = idx === currentIdx;

                  return (
                    <div key={idx} className="space-y-2 flex flex-col items-center">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center border transition-all ${
                        isCompleted
                          ? 'bg-primary border-primary text-white shadow-md shadow-primary/10'
                          : 'bg-card border-border text-muted-foreground'
                      }`}>
                        {idx + 1}
                      </div>
                      <span className={isCurrent ? 'text-primary' : isCompleted ? 'text-foreground' : 'text-muted-foreground'}>{step}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Items Grid */}
            <div className="space-y-2">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Order Items List</span>
              <div className="border border-border rounded-xl overflow-hidden text-xs">
                <table className="w-full text-left text-foreground">
                  <thead className="bg-secondary/40 select-none">
                    <tr>
                      <th className="p-3 font-semibold text-muted-foreground">Listing</th>
                      <th className="p-3 font-semibold text-muted-foreground">SKU / Variant</th>
                      <th className="p-3 font-semibold text-muted-foreground text-center">Qty</th>
                      <th className="p-3 font-semibold text-muted-foreground text-right">Unit Price</th>
                      <th className="p-3 font-semibold text-muted-foreground text-right">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {selectedOrder.items.map(item => (
                      <tr key={item.productId} className="hover:bg-secondary/10">
                        <td className="p-3 font-medium truncate max-w-[150px]">{item.productName}</td>
                        <td className="p-3 font-mono text-[10px] text-muted-foreground">{item.variantSku || 'Simple'}</td>
                        <td className="p-3 text-center font-mono">{item.quantity}</td>
                        <td className="p-3 text-right font-mono">₹{item.price}</td>
                        <td className="p-3 text-right font-mono font-semibold">₹{item.price * item.quantity}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Timeline Logs */}
            <div className="space-y-2">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Order Dispatch Logs</span>
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

            {/* Commissions Release Simulator */}
            {selectedOrder.orderStatus === 'Delivered' && (
              <div className="p-4 bg-indigo-500/5 border border-indigo-500/20 rounded-xl space-y-3">
                <div className="flex gap-2 text-xs">
                  <Award className="text-indigo-500 shrink-0 mt-0.5" size={18} />
                  <div>
                    <span className="font-bold block text-foreground">Commissions Holding Box</span>
                    <span className="text-[10px] text-muted-foreground">Commissions for this delivered order are locked inside the pending balance pool during the 7-day customer return period.</span>
                  </div>
                </div>
                
                {isCommissionReleased(selectedOrder) ? (
                  <div className="px-3 py-1.5 bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 rounded-lg text-[10px] font-mono text-center">
                    Commissions released successfully. Wallet balances upgraded.
                  </div>
                ) : (
                  <button
                    onClick={() => {
                      releaseCommissions(selectedOrder.id);
                    }}
                    className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl transition-all shadow-md shadow-indigo-600/10 flex items-center justify-center gap-1.5"
                  >
                    Simulate Return Period End (Release Cash)
                  </button>
                )}
              </div>
            )}

            {/* Status Transition Dropper */}
            <div className="pt-3 border-t border-border flex gap-3 items-center">
              <span className="text-xs font-semibold text-muted-foreground select-none">Manual Status Adjust:</span>
              <select
                value={selectedOrder.orderStatus}
                onChange={async (e) => {
                  const newStatus = e.target.value as Order['orderStatus'];
                  const previousStatus = selectedOrder.orderStatus;
                  // FIX 6: Optimistically update UI, but roll back on API failure
                  setSelectedOrder({ ...selectedOrder, orderStatus: newStatus });
                  const success = await updateOrderStatus(selectedOrder.id, newStatus);
                  if (!success) {
                    // Roll back to previous status
                    setSelectedOrder(prev => prev ? { ...prev, orderStatus: previousStatus } : prev);
                  }
                }}
                className="text-xs p-2 border border-border/80 rounded-xl bg-card text-foreground outline-none font-semibold"
              >
                <option value="Pending Payment">Pending Payment</option>
                <option value="Confirmed">Confirmed</option>
                <option value="Payment Verified">Payment Verified</option>
                <option value="Processing">Processing</option>
                <option value="Packed">Packed</option>
                <option value="Shipped">Shipped</option>
                <option value="Delivered">Delivered</option>
                <option value="Return Requested">Return Requested</option>
                <option value="Returned">Returned</option>
                <option value="Refunded">Refunded</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </div>

          </div>
        ) : (
          <div className="lg:col-span-7 flex flex-col items-center justify-center py-20 text-center text-xs text-muted-foreground">
            Select an order from the list to view specifications and dispatch log summaries.
          </div>
        )}

      </div>
      </>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start text-xs text-foreground text-left select-none">
          
          {/* Subscriptions Master List - 5 columns */}
          <div className="lg:col-span-5 bg-card border border-border/80 rounded-2xl overflow-hidden shadow-sm">
            <div className="px-5 py-4 border-b border-border/60 bg-secondary/10 flex justify-between items-center">
              <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">Subscribers Ledger</h3>
              <span className="bg-primary/10 text-primary font-bold px-2 py-0.5 rounded-full text-[9px]">{adminSubscriptions.length} Subs</span>
            </div>
            <div className="divide-y divide-border/60 max-h-[600px] overflow-y-auto">
              {loadingSubs ? (
                <div className="p-8 text-center text-muted-foreground font-semibold">
                  Fetching subscriptions registry...
                </div>
              ) : adminSubscriptions.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">
                  No active product subscriptions found.
                </div>
              ) : (
                adminSubscriptions.map(sub => (
                  <div
                    key={sub._id}
                    onClick={() => setSelectedSubDetail(sub)}
                    className={`p-4 flex items-center justify-between cursor-pointer hover:bg-secondary/20 transition-all ${
                      selectedSubDetail?._id === sub._id ? 'bg-secondary/40 border-l-4 border-primary' : ''
                    }`}
                  >
                    <div className="space-y-1">
                      <span className="font-semibold text-xs text-foreground block">{sub.productName}</span>
                      <span className="text-[10px] text-muted-foreground block font-medium">
                        Customer: {typeof sub.userId === 'object' && sub.userId ? sub.userId.name : 'Mock User'}
                      </span>
                      <span className="text-[9px] text-muted-foreground block">Slot: {sub.deliverySlot}</span>
                    </div>
                    <div className="shrink-0 flex flex-col items-end gap-1.5">
                      <span className="font-mono text-xs font-bold text-foreground">₹{sub.unitPrice * sub.quantity}</span>
                      <span className={`px-2 py-0.5 rounded-full font-bold text-[9px] capitalize ${
                        sub.status === 'active' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-amber-500/10 text-amber-500'
                      }`}>
                        {sub.status}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Subscription Details Pane - 7 columns */}
          {selectedSubDetail ? (
            <div className="lg:col-span-7 bg-card border border-border/80 rounded-2xl p-5 shadow-sm space-y-5">
              <div className="flex justify-between items-center border-b border-border pb-3">
                <div>
                  <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">Subscription Specifications</h3>
                  <p className="text-[10px] text-muted-foreground mt-0.5">Start Date: {selectedSubDetail.startDate} • Freq: <span className="capitalize">{selectedSubDetail.frequency}</span></p>
                </div>
                <span className={`px-2.5 py-0.5 rounded-full font-bold text-[9px] capitalize ${
                  selectedSubDetail.status === 'active' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-amber-500/10 text-amber-500'
                }`}>
                  {selectedSubDetail.status}
                </span>
              </div>

              {/* Product Info & Buyer registry block */}
              <div className="flex gap-4 items-center bg-secondary/15 p-3 rounded-xl border border-border/40">
                {selectedSubDetail.productImage ? (
                  <img src={selectedSubDetail.productImage} alt={selectedSubDetail.productName} className="w-16 h-16 rounded-xl object-cover border border-border" />
                ) : (
                  <div className="w-16 h-16 rounded-xl bg-muted flex items-center justify-center text-muted-foreground border border-border">📦</div>
                )}
                <div>
                  <span className="text-[9px] text-primary font-bold uppercase tracking-wider block">Product Details</span>
                  <h4 className="text-sm font-bold text-foreground">{selectedSubDetail.productName}</h4>
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    Quantity: <span className="text-foreground font-semibold">{selectedSubDetail.quantity} units</span> • Unit Price: <span className="text-foreground font-semibold">₹{selectedSubDetail.unitPrice}</span>
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="space-y-3 bg-secondary/15 p-3 rounded-xl border border-border/40">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Buyer & Merchant Accounts</span>
                  <div className="space-y-1.5 text-[10px] font-mono">
                    <p>
                      <span className="text-muted-foreground">Customer: </span>
                      <span className="text-foreground font-semibold">
                        {typeof selectedSubDetail.userId === 'object' && selectedSubDetail.userId ? selectedSubDetail.userId.name : 'Mock User'}
                      </span>
                    </p>
                    <p>
                      <span className="text-muted-foreground">Cust Phone: </span>
                      <span className="text-foreground">
                        {typeof selectedSubDetail.userId === 'object' && selectedSubDetail.userId ? selectedSubDetail.userId.phone : selectedSubDetail.userId}
                      </span>
                    </p>
                    <p>
                      <span className="text-muted-foreground">Merchant: </span>
                      <span className="text-foreground font-semibold">
                        {typeof selectedSubDetail.vendorId === 'object' && selectedSubDetail.vendorId ? selectedSubDetail.vendorId.businessName : 'Mock Vendor'}
                      </span>
                    </p>
                    <p>
                      <span className="text-muted-foreground">Owner: </span>
                      <span className="text-foreground">
                        {typeof selectedSubDetail.vendorId === 'object' && selectedSubDetail.vendorId ? selectedSubDetail.vendorId.ownerName : 'N/A'}
                      </span>
                    </p>
                    <p>
                      <span className="text-muted-foreground">Merch Phone: </span>
                      <span className="text-foreground">
                        {typeof selectedSubDetail.vendorId === 'object' && selectedSubDetail.vendorId ? selectedSubDetail.vendorId.mobile : selectedSubDetail.vendorId}
                      </span>
                    </p>
                    <p>
                      <span className="text-muted-foreground">Auto-Renew: </span>
                      <span className="text-foreground">{selectedSubDetail.autoRenew ? 'Enabled' : 'Disabled'}</span>
                    </p>
                  </div>
                </div>

                <div className="space-y-3 bg-secondary/15 p-3 rounded-xl border border-border/40">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Execution Logs Metrics</span>
                  <div className="space-y-1.5 text-[10px]">
                    <div className="flex justify-between font-semibold"><span className="text-emerald-500">Delivered Runs:</span><span className="text-foreground font-mono">{selectedSubDetail.completedDates?.length || 0} times</span></div>
                    <div className="flex justify-between font-semibold"><span className="text-rose-500">Failed Runs:</span><span className="text-foreground font-mono">{selectedSubDetail.failedDates?.length || 0} times</span></div>
                    <div className="flex justify-between font-semibold"><span className="text-amber-500">Skipped Runs:</span><span className="text-foreground font-mono">{selectedSubDetail.skippedDates?.length || 0} times</span></div>
                  </div>
                </div>
              </div>

              {/* Billing & Payout Settlements Console */}
              {(() => {
                const selectedVendorId = typeof selectedSubDetail.vendorId === 'object' && selectedSubDetail.vendorId ? selectedSubDetail.vendorId._id : selectedSubDetail.vendorId;
                const selectedUserId = typeof selectedSubDetail.userId === 'object' && selectedSubDetail.userId ? selectedSubDetail.userId._id : selectedSubDetail.userId;
                const relatedStatements = allStatements.filter(
                  (stmt) =>
                    (stmt.vendorId?._id === selectedVendorId || stmt.vendorId === selectedVendorId) &&
                    (stmt.customerId?._id === selectedUserId || stmt.customerId === selectedUserId)
                );

                return (
                  <div className="space-y-2 pt-3 border-t border-border">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Billing Payouts & Commissions Settlements</span>
                    {relatedStatements.length === 0 ? (
                      <div className="p-3 bg-secondary/10 rounded-xl border border-border/40 text-center text-muted-foreground text-[10px]">
                        No statements generated for this subscription cycle yet.
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {relatedStatements.map((stmt) => (
                          <div key={stmt._id} className="p-3 bg-secondary/15 rounded-xl border border-border/40 flex justify-between items-center text-[10px]">
                            <div>
                              <span className="font-mono font-bold text-primary block">{stmt.statementNumber}</span>
                              <span className="text-muted-foreground block text-[9px]">Period: {stmt.billingPeriod} • Delivered: {stmt.delivered} runs</span>
                              <span className="text-muted-foreground block text-[9px]">Platform Fee: ₹{stmt.platformCommission} • Franchise Fee: ₹{stmt.franchiseCommission}</span>
                            </div>
                            <div className="flex flex-col items-end gap-1.5 shrink-0">
                              <span className="font-bold text-foreground font-mono">₹{stmt.grossAmount} Gross</span>
                              {stmt.settlementStatus === 'settled' ? (
                                <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 font-bold text-[8px]">Settled</span>
                              ) : stmt.settlementStatus === 'failed' ? (
                                <span className="px-2 py-0.5 rounded bg-red-500/10 text-red-600 font-bold text-[8px]">Failed</span>
                              ) : (
                                <button
                                  onClick={() => handleApproveStatement(stmt._id)}
                                  disabled={settlingId === stmt._id}
                                  className="px-2 py-1 bg-primary text-primary-foreground font-bold rounded text-[8px] cursor-pointer hover:bg-primary/95 disabled:opacity-50"
                                >
                                  {settlingId === stmt._id ? 'Settling...' : 'Release Payout'}
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* Status Update Trigger Select */}
              <div className="pt-3 border-t border-border flex gap-3 items-center">
                <span className="text-xs font-semibold text-muted-foreground">Administrative Status Adjust:</span>
                <select
                  value={selectedSubDetail.status}
                  onChange={async (e) => {
                    const newStatus = e.target.value;
                    const token = localStorage.getItem('adminToken');
                    try {
                      const res = await fetch(`https://server.apexbee.in/api/local-shop/subscriptions/${selectedSubDetail._id}/status`, {
                        method: 'PATCH',
                        headers: { 
                          'Content-Type': 'application/json',
                          'Authorization': `Bearer ${token}` 
                        },
                        body: JSON.stringify({ status: newStatus })
                      });
                      const data = await res.json();
                      if (res.ok && data.success) {
                        setSelectedSubDetail({ ...selectedSubDetail, status: newStatus });
                        const syncRes = await fetch('https://server.apexbee.in/api/local-shop/subscriptions/admin/all', {
                          headers: token ? { 'Authorization': `Bearer ${token}` } : {}
                        });
                        if (syncRes.ok) {
                          const syncData = await syncRes.json();
                          setAdminSubscriptions(syncData.subscriptions || []);
                        }
                        alert('Subscription status updated successfully!');
                      } else {
                        alert(data.message || 'Failed to update status');
                      }
                    } catch (err) {
                      console.error(err);
                      alert('Network error encountered.');
                    }
                  }}
                  className="text-xs p-2 border border-border/80 rounded-xl bg-card text-foreground outline-none font-semibold"
                >
                  <option value="active">Active</option>
                  <option value="paused">Paused</option>
                  <option value="expired">Expired</option>
                </select>
              </div>
            </div>
          ) : (
            <div className="lg:col-span-7 flex flex-col items-center justify-center py-20 text-center text-xs text-muted-foreground bg-card border border-border/80 rounded-2xl">
              Select a product subscription from the left ledger list to audit schedules and logs.
            </div>
          )}
        </div>
      )}
    </div>
  );
};
