import React, { useState } from 'react';
import { useAdminState } from '../context/AdminStateContext';
import { Truck, Star, MapPin, CheckCircle, Navigation } from 'lucide-react';

export const DeliveryManagement: React.FC = () => {
  const { orders, deliveryAgents, assignDelivery, updateOrderStatus } = useAdminState();
  const [selectedOrder, setSelectedOrder] = useState<any>(
    orders.find(o => o.orderStatus === 'Processing' || o.orderStatus === 'Payment Verified' || o.orderStatus === 'Packed') || orders[0] || null
  );

  const [deliveryType, setDeliveryType] = useState<'Platform' | 'Vendor' | 'Independent'>('Platform');
  const [selectedAgentId, setSelectedAgentId] = useState<string>(
    deliveryAgents.find(a => a.status === 'Available' && a.type === 'Platform')?.id || deliveryAgents[0]?.id || ''
  );

  // Dispatch queue (orders ready to ship)
  const dispatchQueue = orders.filter(
    o => o.orderStatus === 'Payment Verified' || o.orderStatus === 'Processing' || o.orderStatus === 'Packed'
  );

  // Shipping transit queue (orders in transit)
  const transitQueue = orders.filter(o => o.orderStatus === 'Shipped');

  const filteredAgents = deliveryAgents.filter(da => da.type === deliveryType);

  const handleAssignShip = () => {
    if (!selectedOrder || !selectedAgentId) return;
    assignDelivery(selectedOrder.id, selectedAgentId, deliveryType);
    
    // Auto refresh selection
    const nextOrder = orders.find(
      o => (o.orderStatus === 'Processing' || o.orderStatus === 'Payment Verified' || o.orderStatus === 'Packed') && o.id !== selectedOrder.id
    );
    setSelectedOrder(nextOrder || null);
  };

  return (
    <div className="space-y-6">
      
      {/* Intro widget */}
      <div className="bg-card border border-border/80 rounded-2xl p-4 shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Truck className="text-primary shrink-0" size={24} />
          <div>
            <h2 className="text-xs font-bold uppercase tracking-wider text-foreground">Delivery Dispatch Terminal</h2>
            <p className="text-[10px] text-muted-foreground mt-0.5">Assign ready-to-ship orders to platform couriers, vendor fleet, or independent logistics partners.</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Dispatch queue - 4 columns */}
        <div className="lg:col-span-4 bg-card border border-border/80 rounded-2xl overflow-hidden shadow-sm space-y-4">
          <div className="px-5 py-4 border-b border-border/60 bg-secondary/10">
            <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">Ready to Dispatch ({dispatchQueue.length})</h3>
          </div>
          
          <div className="divide-y divide-border/60 max-h-[350px] overflow-y-auto no-scrollbar">
            {dispatchQueue.map(order => (
              <div
                key={order.id}
                onClick={() => {
                  setSelectedOrder(order);
                  // Auto pick available agent for type
                  const firstAvail = deliveryAgents.find(a => a.status === 'Available' && a.type === deliveryType);
                  if (firstAvail) setSelectedAgentId(firstAvail.id);
                }}
                className={`p-3.5 flex items-center justify-between cursor-pointer hover:bg-secondary/20 transition-all ${
                  selectedOrder?.id === order.id ? 'bg-secondary/40 border-l-4 border-primary' : ''
                }`}
              >
                <div>
                  <span className="font-semibold text-xs text-foreground block">{order.customerName}</span>
                  <span className="text-[9px] text-muted-foreground block mt-1">
                    Order ID: {order.id} • Status: <span className="font-semibold text-primary">{order.orderStatus}</span>
                  </span>
                </div>
                <span className="font-mono text-xs font-bold text-foreground shrink-0">₹{order.totalAmount}</span>
              </div>
            ))}
            {dispatchQueue.length === 0 && (
              <div className="p-8 text-center text-xs text-muted-foreground">
                No orders pending dispatch assignment.
              </div>
            )}
          </div>
        </div>

        {/* Assignment panel - 5 columns */}
        {selectedOrder && (selectedOrder.orderStatus === 'Payment Verified' || selectedOrder.orderStatus === 'Processing' || selectedOrder.orderStatus === 'Packed') ? (
          <div className="lg:col-span-5 bg-card border border-border/80 rounded-2xl p-5 shadow-sm space-y-5">
            <h3 className="text-xs font-bold text-foreground uppercase tracking-wider border-b border-border pb-3">Assign Agent & Dispatch</h3>
            
            <div className="text-xs space-y-3 bg-secondary/10 p-3.5 rounded-xl border border-border/40">
              <p className="font-semibold text-foreground">Destination Shipping Address:</p>
              <div className="flex gap-1.5 text-[10px] text-muted-foreground leading-normal">
                <MapPin size={14} className="text-rose-500 shrink-0 mt-0.5" />
                <span>{selectedOrder.customerAddress}</span>
              </div>
            </div>

            {/* Courier Type */}
            <div className="space-y-1.5 text-xs">
              <label className="text-muted-foreground block font-medium">Logistics Vendor Channel</label>
              <div className="grid grid-cols-3 gap-2">
                {(['Platform', 'Vendor', 'Independent'] as const).map(type => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => {
                      setDeliveryType(type);
                      const avail = deliveryAgents.find(a => a.status === 'Available' && a.type === type);
                      setSelectedAgentId(avail?.id || deliveryAgents.find(a => a.type === type)?.id || '');
                    }}
                    className={`py-2 text-[10px] font-bold rounded-xl border transition-all ${
                      deliveryType === type
                        ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                        : 'bg-card text-muted-foreground border-border hover:bg-secondary/40'
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            {/* Courier Agent selector */}
            <div className="space-y-1.5 text-xs">
              <label className="text-muted-foreground block">Select Delivery Courier Agent</label>
              {filteredAgents.length === 0 ? (
                <div className="flex items-center gap-2 w-full p-3 border border-dashed border-border rounded-xl bg-secondary/10 text-muted-foreground text-xs">
                  <Truck size={14} className="shrink-0 opacity-50" />
                  <span>No agents registered for <strong>{deliveryType}</strong> channel. Add agents via the Delivery Partner Portal.</span>
                </div>
              ) : (
                <select
                  value={selectedAgentId}
                  onChange={(e) => setSelectedAgentId(e.target.value)}
                  className="w-full p-2.5 border border-border rounded-xl bg-card text-foreground outline-none font-semibold"
                >
                  {filteredAgents.map(agent => (
                    <option key={agent.id} value={agent.id}>
                      {agent.name} ({agent.status} • Rating: {agent.rating}★)
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Submit button */}
            <button
              onClick={handleAssignShip}
              disabled={!selectedAgentId}
              className="w-full py-2.5 bg-primary hover:bg-primary/95 text-white font-bold text-xs rounded-xl transition-all shadow-md shadow-primary/10 flex items-center justify-center gap-1.5 disabled:opacity-55"
            >
              <Navigation size={14} /> Assign Courier & Dispatch Order
            </button>
          </div>
        ) : (
          <div className="lg:col-span-5 bg-card border border-border/80 rounded-2xl p-5 shadow-sm flex flex-col items-center justify-center text-center py-20 text-xs text-muted-foreground select-none">
            <CheckCircle size={32} className="text-emerald-500 mb-3" />
            <p>All ready-to-ship orders dispatched. Select new orders from left queue if available.</p>
          </div>
        )}

        {/* Courier fleet details - 3 columns */}
        <div className="lg:col-span-3 bg-card border border-border/80 rounded-2xl p-5 shadow-sm space-y-4">
          <h3 className="text-xs font-bold text-foreground uppercase tracking-wider select-none">Courier Fleet Status</h3>
          <div className="space-y-3 max-h-[380px] overflow-y-auto no-scrollbar">
            {deliveryAgents.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 gap-3 text-center">
                <div className="w-12 h-12 rounded-full bg-muted/40 flex items-center justify-center">
                  <Truck size={22} className="text-muted-foreground opacity-50" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-foreground">No Delivery Agents</p>
                  <p className="text-[10px] text-muted-foreground mt-1 leading-relaxed">
                    No delivery agents are registered yet.<br />Agents registered via the Delivery Partner Portal will appear here.
                  </p>
                </div>
              </div>
            ) : (
              deliveryAgents.map(agent => (
                <div key={agent.id} className="bg-secondary/15 p-3 rounded-xl border border-border/40 space-y-2 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-foreground">{agent.name}</span>
                    <span className={`px-1.5 py-0.5 text-[8px] font-bold rounded-md ${
                      agent.status === 'Available'
                        ? 'bg-emerald-500/10 text-emerald-500'
                        : agent.status === 'On Delivery'
                        ? 'bg-indigo-500/10 text-indigo-500'
                        : 'bg-muted text-muted-foreground'
                    }`}>
                      {agent.status}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 text-[9px] text-muted-foreground font-mono">
                    <span>Channel: {agent.type}</span>
                    <span className="text-right">Completed: {agent.completedDeliveries}</span>
                  </div>
                  <div className="flex justify-between items-center text-[9px] text-muted-foreground">
                    <span>Mobile: {agent.mobile}</span>
                    <span className="flex items-center gap-0.5 text-amber-500 font-semibold font-mono">
                      <Star size={10} fill="currentColor" /> {agent.rating}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

      {/* Transit tracking queue (Bottom row) */}
      <div className="bg-card border border-border/80 rounded-2xl p-5 shadow-sm">
        <h3 className="text-xs font-bold text-foreground uppercase tracking-wider mb-4 select-none">Orders in Transit ({transitQueue.length})</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {transitQueue.map(order => {
            const agent = deliveryAgents.find(a => a.id === order.deliveryAgentId);
            return (
              <div key={order.id} className="bg-secondary/15 border border-border/40 rounded-xl p-4 space-y-3 text-xs">
                <div className="flex justify-between items-center border-b border-border/60 pb-2">
                  <span className="font-bold text-foreground">{order.id}</span>
                  <span className="font-mono text-muted-foreground">₹{order.totalAmount}</span>
                </div>
                
                <div className="space-y-1.5 text-[10px] text-muted-foreground">
                  <p><span className="font-semibold text-foreground">Buyer: </span>{order.customerName}</p>
                  <p><span className="font-semibold text-foreground">Courier Agent: </span>{agent?.name} ({order.deliveryType})</p>
                  <p><span className="font-semibold text-foreground">Phone: </span>{agent?.mobile}</p>
                </div>

                <button
                  onClick={() => {
                    updateOrderStatus(order.id, 'Delivered');
                  }}
                  className="w-full py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-lg transition-all text-[10px] flex items-center justify-center gap-1 shadow-md shadow-emerald-500/10"
                >
                  <CheckCircle size={12} /> Confirm Delivered
                </button>
              </div>
            );
          })}
          {transitQueue.length === 0 && (
            <p className="col-span-3 text-center text-xs text-muted-foreground py-6">No orders currently in transit.</p>
          )}
        </div>
      </div>

    </div>
  );
};
