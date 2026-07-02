import React, { useState } from 'react';
import { useAdminState } from '../context/AdminStateContext';
import { Warehouse, ArrowRight, Check, CheckCircle2, TrendingUp, AlertCircle } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';

export const SupplyChainHub: React.FC = () => {
  const { addActivityLog } = useAdminState();
  const [activeSubTab, setActiveSubTab] = useState<'stock' | 'procurement' | 'quotes' | 'orders' | 'directory'>('stock');

  // Local state for comparing quotations
  const [selectedQuoteId, setSelectedQuoteId] = useState<string>('Q-1');
  const [procurementStatus, setProcurementStatus] = useState<Record<string, string>>({
    'PR-001': 'Pending Wholesaler Quote',
    'PR-002': 'Quotation Under Review'
  });

  // Mock analytics
  const analyticsData = [
    { month: 'Jan', volume: 420 },
    { month: 'Feb', volume: 560 },
    { month: 'Mar', volume: 710 },
    { month: 'Apr', volume: 840 },
    { month: 'May', volume: 920 },
    { month: 'Jun', volume: 1100 }
  ];

  // Mock Stock Requests
  const stockRequests = [
    { id: 'SR-001', vendor: 'Karan Organic Farms', product: 'DAP Fertilizer (50kg)', quantity: 200, date: '2026-06-12', status: 'Stock Low' },
    { id: 'SR-002', vendor: 'Krishna Electronics', product: 'boAt Earbuds (Black)', quantity: 150, date: '2026-06-13', status: 'Critical stock' }
  ];

  // Mock Procurement Workflow
  const procurementRequests = [
    { id: 'PR-001', requester: 'Karan Organic Farms', wholesaler: 'Sahyadri Agri Distributors', product: 'DAP Fertilizer (50kg)', quantity: 200, cost: '₹1,80,000', priority: 'High' },
    { id: 'PR-002', requester: 'Krishna Electronics', wholesaler: 'Krishna Wholesale Depot', product: 'boAt Earbuds (Black)', quantity: 150, cost: '₹95,000', priority: 'Normal' }
  ];

  // Mock Quotes for Product DAP Fertilizer (50kg)
  const quotesComparison = [
    { id: 'Q-1', supplier: 'Sahyadri Agri Distributors', price: 900, delivery: '3 Days', shipping: '₹4,000', rating: 4.8, recommended: true },
    { id: 'Q-2', supplier: 'Maha-Agro Wholesale', price: 950, delivery: '2 Days', shipping: 'Free', rating: 4.5, recommended: false },
    { id: 'Q-3', supplier: 'Deccan Agri Depot', price: 880, delivery: '6 Days', shipping: '₹8,000', rating: 4.2, recommended: false }
  ];

  // Mock Purchase Orders
  const purchaseOrders = [
    { id: 'PO-7023', wholesaler: 'Sahyadri Agri Distributors', item: 'DAP Fertilizer (50kg)', qty: 200, amount: '₹1,84,000', date: '2026-06-11', status: 'Dispatched' },
    { id: 'PO-7019', wholesaler: 'Krishna Wholesale Depot', item: 'boAt Earbuds (Black)', qty: 150, amount: '₹95,000', date: '2026-06-08', status: 'Delivered' }
  ];

  const handleForwardToProcurement = (id: string, product: string, quantity: number) => {
    addActivityLog(
      'Procurement Initiated',
      `Forwarded Stock Request ${id} for ${product} (${quantity} units) to Wholesaler network.`,
      'info'
    );
    alert(`Request ${id} forwarded to Wholesalers. Draft Procurement Request created.`);
  };

  const handleAuthorizePO = (prId: string) => {
    setProcurementStatus(prev => ({ ...prev, [prId]: 'Authorized (PO Issued)' }));
    addActivityLog(
      'PO Authorized',
      `Purchase Order authorized for Procurement Request ${prId}.`,
      'withdrawal'
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-card border border-border/80 rounded-2xl p-4 shadow-sm">
        <div>
          <h2 className="text-sm font-bold text-foreground uppercase tracking-wider">Supply Chain Hub</h2>
          <p className="text-[11px] text-muted-foreground mt-0.5">Manage stock alerts, wholesale procurements, quotes, and supplier directories</p>
        </div>
        <span className="px-2.5 py-1 bg-amber-500/10 text-amber-500 dark:text-amber-400 text-xs font-bold rounded-xl border border-amber-500/20 select-none animate-pulse">
          Coming Soon
        </span>
      </div>
      {/* Submenus Bar */}
      <div className="flex gap-2 flex-wrap bg-card border border-border/60 p-2 rounded-2xl select-none shadow-sm">
        {(['stock', 'procurement', 'quotes', 'orders', 'directory'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveSubTab(tab)}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all ${
              activeSubTab === tab
                ? 'bg-primary text-primary-foreground border-primary shadow-md'
                : 'bg-transparent text-muted-foreground border-transparent hover:bg-secondary/60 hover:text-foreground'
            }`}
          >
            {tab === 'stock' ? 'Stock Alerts' : tab === 'procurement' ? 'Procurement Workflow' : tab === 'quotes' ? 'Quotation Comparison' : tab === 'orders' ? 'Purchase Orders' : 'Supplier Directory'}
          </button>
        ))}
      </div>

      {/* Stock Alerts */}
      {activeSubTab === 'stock' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          <div className="lg:col-span-2 bg-card border border-border/80 rounded-2xl overflow-hidden shadow-sm">
            <div className="px-5 py-4 border-b border-border/60 bg-secondary/10 flex justify-between items-center select-none">
              <span className="text-xs font-bold text-foreground uppercase tracking-wider">Vendor Stock Replenishment Alerts</span>
              <span className="text-[10px] text-rose-500 font-semibold animate-pulse flex items-center gap-1">
                <AlertCircle size={12} /> Low Stock Warnings
              </span>
            </div>

            <div className="divide-y divide-border/60">
              {stockRequests.map(req => (
                <div key={req.id} className="p-4 flex items-center justify-between text-xs hover:bg-secondary/10 transition-colors">
                  <div className="space-y-1">
                    <span className="font-semibold text-foreground text-sm block">{req.product}</span>
                    <span className="text-muted-foreground block text-[10px]">
                      Required: {req.quantity} units • Store: {req.vendor}
                    </span>
                    <span className="text-[9px] text-muted-foreground font-mono block">Alert Date: {req.date}</span>
                  </div>
                  <div className="flex items-center gap-2 select-none shrink-0">
                    <span className="px-2 py-0.5 bg-rose-500/10 text-rose-500 font-bold rounded-lg text-[9px] mr-2">
                      {req.status}
                    </span>
                    <button
                      onClick={() => handleForwardToProcurement(req.id, req.product, req.quantity)}
                      className="px-3 py-1.5 bg-primary hover:bg-primary/95 text-primary-foreground font-bold rounded-xl flex items-center gap-1 transition-all shadow-md shadow-primary/10"
                    >
                      Procure <ArrowRight size={12} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Side info / stats */}
          <div className="bg-card border border-border/80 rounded-2xl p-5 shadow-sm space-y-4">
            <div>
              <h3 className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5">
                <TrendingUp size={14} className="text-primary" />
                Procurement Volume
              </h3>
              <p className="text-[10px] text-muted-foreground mt-0.5">Monthly procurement shipments logged</p>
            </div>
            <div className="h-44 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analyticsData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(100, 116, 139, 0.1)" />
                  <XAxis dataKey="month" stroke="rgba(100, 116, 139, 0.5)" fontSize={10} tickLine={false} />
                  <YAxis stroke="rgba(100, 116, 139, 0.5)" fontSize={10} tickLine={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)' }}
                    itemStyle={{ fontSize: 11, color: 'var(--foreground)' }}
                  />
                  <Bar dataKey="volume" name="Units Procured" fill="#6366f1" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* Procurement requests workflow */}
      {activeSubTab === 'procurement' && (
        <div className="bg-card border border-border/80 rounded-2xl overflow-hidden shadow-sm">
          <div className="px-5 py-4 border-b border-border/60 bg-secondary/10 flex justify-between items-center select-none">
            <span className="text-xs font-bold text-foreground uppercase tracking-wider">Vendor → Wholesaler Procurement Workflow</span>
            <span className="text-[10px] text-muted-foreground">PO Authorization Queue</span>
          </div>

          <div className="divide-y divide-border/60">
            {procurementRequests.map(req => {
              const currentStatus = procurementStatus[req.id] || 'Quotation Under Review';
              return (
                <div key={req.id} className="p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-3 text-xs hover:bg-secondary/10 transition-colors">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-foreground text-sm">{req.product}</span>
                      <span className={`px-2 py-0.5 rounded text-[8px] font-bold ${
                        req.priority === 'High' ? 'bg-rose-500/10 text-rose-500 animate-pulse' : 'bg-muted text-muted-foreground'
                      }`}>
                        {req.priority} Priority
                      </span>
                    </div>
                    <p className="text-muted-foreground text-[10px]">
                      Qty: {req.quantity} units • Requester: {req.requester}
                    </p>
                    <p className="text-[10px] text-primary font-semibold">Assigned Wholesaler: {req.wholesaler}</p>
                  </div>
                  
                  <div className="flex items-center gap-3 w-full md:w-auto shrink-0 justify-between md:justify-end border-t md:border-t-0 border-border/40 pt-2.5 md:pt-0">
                    <div className="text-right">
                      <span className="font-mono font-bold block">{req.cost}</span>
                      <span className="text-[9px] text-muted-foreground block">{currentStatus}</span>
                    </div>
                    
                    {currentStatus.includes('Authorized') ? (
                      <span className="px-3 py-1.5 bg-emerald-500/10 text-emerald-500 font-bold rounded-xl flex items-center gap-1 text-[10px] border border-emerald-500/20 select-none">
                        <CheckCircle2 size={12} /> PO Issued
                      </span>
                    ) : (
                      <button
                        onClick={() => handleAuthorizePO(req.id)}
                        className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl flex items-center gap-1 transition-all shadow-md shadow-indigo-600/10 select-none"
                      >
                        <Check size={14} /> Authorize PO
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Quotation Comparison */}
      {activeSubTab === 'quotes' && (
        <div className="bg-card border border-border/80 rounded-2xl p-5 shadow-sm space-y-5">
          <div>
            <h3 className="text-sm font-bold text-foreground">Supply Quotation Comparison Matrix</h3>
            <p className="text-[10px] text-muted-foreground mt-0.5">Product: DAP Fertilizer (50kg) • Requirements: 200 bags (50kg each)</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {quotesComparison.map(q => (
              <div
                key={q.id}
                onClick={() => setSelectedQuoteId(q.id)}
                className={`p-4 rounded-2xl border transition-all cursor-pointer relative flex flex-col justify-between min-h-[160px] ${
                  selectedQuoteId === q.id
                    ? 'bg-primary/5 border-primary shadow-md'
                    : 'bg-secondary/10 border-border/60 hover:border-border hover:bg-secondary/20'
                }`}
              >
                {q.recommended && (
                  <span className="absolute -top-2.5 right-4 bg-primary text-primary-foreground font-bold text-[8px] uppercase px-2 py-0.5 rounded-full select-none shadow-md">
                    Best Match
                  </span>
                )}
                <div>
                  <span className="font-semibold text-foreground text-xs block truncate max-w-[170px]">{q.supplier}</span>
                  <span className="text-[10px] text-muted-foreground mt-0.5 block">Rating: ★ {q.rating}</span>
                </div>
                
                <div className="mt-3 border-t border-dashed border-border/60 pt-3 space-y-1 text-[10px] text-muted-foreground font-mono">
                  <div className="flex justify-between"><span>Unit Cost</span><span className="font-semibold text-foreground">₹{q.price}</span></div>
                  <div className="flex justify-between"><span>Lead Time</span><span className="font-semibold text-foreground">{q.delivery}</span></div>
                  <div className="flex justify-between"><span>Shipping</span><span className="font-semibold text-foreground">{q.shipping}</span></div>
                  <div className="flex justify-between border-t border-border/30 pt-1.5 font-bold"><span className="text-foreground">Total Payout</span><span className="text-indigo-500">₹{(q.price * 200).toLocaleString()}</span></div>
                </div>
              </div>
            ))}
          </div>

          <div className="border-t border-border pt-3 flex justify-between items-center select-none">
            <span className="text-[10px] text-muted-foreground flex items-center gap-1">
              <Warehouse size={12} className="text-primary" /> Selected Wholesaler Node: {quotesComparison.find(q => q.id === selectedQuoteId)?.supplier}
            </span>
            <button
              onClick={() => {
                addActivityLog('Quotation Selected', 'Quotation approved and PO drafted in system logs.', 'info');
                alert('Quotation selected! Draft PO forwarded to authorization queue.');
              }}
              className="px-4 py-2 bg-primary hover:bg-primary/95 text-primary-foreground font-bold text-xs rounded-xl transition-all shadow-md shadow-primary/10"
            >
              Select Quote & Draft PO
            </button>
          </div>
        </div>
      )}

      {/* Purchase Orders List */}
      {activeSubTab === 'orders' && (
        <div className="bg-card border border-border/80 rounded-2xl overflow-hidden shadow-sm">
          <div className="px-5 py-4 border-b border-border/60 bg-secondary/10 flex justify-between items-center select-none">
            <span className="text-xs font-bold text-foreground uppercase tracking-wider">Platform Authorized Purchase Orders</span>
            <span className="text-[10px] text-muted-foreground">Authorized PO Ledger</span>
          </div>

          <div className="divide-y divide-border/60">
            {purchaseOrders.map(po => (
              <div key={po.id} className="p-4 flex items-center justify-between text-xs hover:bg-secondary/10 transition-colors">
                <div className="space-y-1">
                  <span className="font-semibold text-foreground text-sm block">PO #{po.id}</span>
                  <span className="text-[10px] text-muted-foreground block">
                    Product: {po.item} • Quantity: {po.qty} units • Supplier: {po.wholesaler}
                  </span>
                  <span className="text-[9px] text-muted-foreground font-mono block">Issued Date: {po.date}</span>
                </div>
                
                <div className="shrink-0 flex items-center gap-3">
                  <span className="font-mono font-bold text-foreground">{po.amount}</span>
                  <span className={`px-2 py-0.5 rounded text-[8px] font-bold ${
                    po.status === 'Delivered' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-indigo-500/10 text-indigo-500 animate-pulse'
                  }`}>
                    {po.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Supplier Directory */}
      {activeSubTab === 'directory' && (
        <div className="bg-card border border-border/80 rounded-2xl overflow-hidden shadow-sm">
          <div className="px-5 py-4 border-b border-border/60 bg-secondary/10 flex justify-between items-center select-none">
            <span className="text-xs font-bold text-foreground uppercase tracking-wider">Ecosystem Wholesalers Directory</span>
            <span className="text-[10px] text-muted-foreground">Registered Supply Nodes</span>
          </div>

          <div className="divide-y divide-border/60">
            <div className="p-4 flex items-center justify-between text-xs">
              <div>
                <p className="font-semibold text-foreground text-sm">Sahyadri Agri Distributors</p>
                <p className="text-[10px] text-muted-foreground">Seeds, Fertilizers & Pesticides • Maharashtra Region</p>
                <p className="text-[9px] text-muted-foreground mt-0.5">Rating: ★ 4.8 • Active POs: 1</p>
              </div>
              <span className="px-2.5 py-1 bg-secondary text-foreground text-[10px] font-bold rounded-lg border border-border/50">Verified Supplier</span>
            </div>
            
            <div className="p-4 flex items-center justify-between text-xs">
              <div>
                <p className="font-semibold text-foreground text-sm">Krishna Wholesale Depot</p>
                <p className="text-[10px] text-muted-foreground">FMCG, Groceries & Electronics Bulk • Gujarat & Maharashtra Region</p>
                <p className="text-[9px] text-muted-foreground mt-0.5">Rating: ★ 4.5 • Active POs: 1</p>
              </div>
              <span className="px-2.5 py-1 bg-secondary text-foreground text-[10px] font-bold rounded-lg border border-border/50">Verified Supplier</span>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
