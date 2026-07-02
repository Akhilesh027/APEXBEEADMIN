import React, { useState, useEffect } from 'react';
import { FileText, RefreshCw, CheckCircle, AlertTriangle, Info, Calendar, List, Truck } from 'lucide-react';

export const SubscriptionManagement: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'statements' | 'tasks' | 'subscriptions'>('statements');
  
  // Billing statements
  const [statements, setStatements] = useState<any[]>([]);
  const [loadingStatements, setLoadingStatements] = useState(false);
  const [settlingId, setSettlingId] = useState<string | null>(null);

  // Pending individual task payouts
  const [pendingTasks, setPendingTasks] = useState<any[]>([]);
  const [loadingPendingTasks, setLoadingPendingTasks] = useState(false);
  const [settlingTaskId, setSettlingTaskId] = useState<string | null>(null);

  // Subscriptions directory
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [loadingSubscriptions, setLoadingSubscriptions] = useState(false);
  
  // Delivery logs modal
  const [selectedSub, setSelectedSub] = useState<any>(null);
  const [selectedSubTasks, setSelectedSubTasks] = useState<any[]>([]);
  const [loadingTasks, setLoadingTasks] = useState(false);
  const [showTasksModal, setShowTasksModal] = useState(false);

  useEffect(() => {
    if (activeTab === 'statements') {
      fetchStatements();
    } else if (activeTab === 'subscriptions') {
      fetchSubscriptions();
    } else {
      fetchPendingTasks();
    }
  }, [activeTab]);

  const fetchStatements = async () => {
    try {
      setLoadingStatements(true);
      const token = localStorage.getItem('adminToken');
      if (!token) return;

      const res = await fetch('https://server.apexbee.in/api/local-shop/billing/statements', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (res.ok) {
        const data = await res.json();
        setStatements(data.statements || []);
      }
    } catch (err) {
      console.error('Error fetching statements:', err);
    } finally {
      setLoadingStatements(false);
    }
  };

  const fetchPendingTasks = async () => {
    try {
      setLoadingPendingTasks(true);
      const token = localStorage.getItem('adminToken');
      if (!token) return;

      const res = await fetch('https://server.apexbee.in/api/local-shop/billing/pending-tasks', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (res.ok) {
        const data = await res.json();
        setPendingTasks(data.tasks || []);
      }
    } catch (err) {
      console.error('Error fetching pending tasks:', err);
    } finally {
      setLoadingPendingTasks(false);
    }
  };

  const fetchSubscriptions = async () => {
    try {
      setLoadingSubscriptions(true);
      const token = localStorage.getItem('adminToken');
      if (!token) return;

      const res = await fetch('https://server.apexbee.in/api/local-shop/subscriptions/admin/all', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (res.ok) {
        const data = await res.json();
        setSubscriptions(data.subscriptions || []);
      }
    } catch (err) {
      console.error('Error fetching subscriptions:', err);
    } finally {
      setLoadingSubscriptions(false);
    }
  };

  const fetchTasks = async (sub: any) => {
    try {
      setSelectedSub(sub);
      setLoadingTasks(true);
      setShowTasksModal(true);
      const token = localStorage.getItem('adminToken');
      const res = await fetch(`https://server.apexbee.in/api/local-shop/subscriptions/${sub._id}/tasks`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setSelectedSubTasks(data.tasks || []);
      }
    } catch (err) {
      console.error('Error fetching tasks:', err);
    } finally {
      setLoadingTasks(false);
    }
  };

  const handleApproveStatement = async (id: string) => {
    if (!window.confirm('Are you sure you want to approve and release wallet payouts for this statement?')) {
      return;
    }

    try {
      setSettlingId(id);
      const token = localStorage.getItem('adminToken');
      const res = await fetch(`https://server.apexbee.in/api/local-shop/billing/statements/${id}/approve`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      const data = await res.json();
      if (res.ok && data.success) {
        alert('Statement settled and wallet payouts released successfully!');
        fetchStatements();
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

  const handleApproveTask = async (id: string) => {
    if (!window.confirm('Are you sure you want to release the wallet payout for this single delivery run?')) {
      return;
    }

    try {
      setSettlingTaskId(id);
      const token = localStorage.getItem('adminToken');
      const res = await fetch(`https://server.apexbee.in/api/local-shop/billing/tasks/${id}/approve`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      const data = await res.json();
      if (res.ok && data.success) {
        alert('Task payout released successfully!');
        fetchPendingTasks();
      } else {
        alert(data.message || 'Failed to release task payout');
      }
    } catch (err) {
      console.error('Error settling task:', err);
      alert('Network or server error encountered during settlement.');
    } finally {
      setSettlingTaskId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-card border border-border/80 rounded-2xl p-6 shadow-sm flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-primary/10 text-primary rounded-xl">
            <Calendar size={24} />
          </div>
          <div>
            <h2 className="text-sm font-bold uppercase tracking-wider text-foreground">Local Shop Subscriptions</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Audit monthly cycle billing statements, check rider delivery expectations, and release wallet payouts.</p>
          </div>
        </div>
        <button
          onClick={activeTab === 'statements' ? fetchStatements : activeTab === 'subscriptions' ? fetchSubscriptions : fetchPendingTasks}
          disabled={loadingStatements || loadingSubscriptions || loadingPendingTasks}
          className="px-4 py-2 border border-border hover:bg-secondary/15 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer text-foreground"
        >
          <RefreshCw size={14} className={loadingStatements || loadingSubscriptions || loadingPendingTasks ? 'animate-spin' : ''} />
          <span>Sync Data</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border gap-4">
        <button
          onClick={() => setActiveTab('statements')}
          className={`pb-3 text-xs font-bold uppercase tracking-wider cursor-pointer border-b-2 transition ${
            activeTab === 'statements' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          Statements Settlement Queue
        </button>
        <button
          onClick={() => setActiveTab('tasks')}
          className={`pb-3 text-xs font-bold uppercase tracking-wider cursor-pointer border-b-2 transition ${
            activeTab === 'tasks' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          Pending Task Payouts ({pendingTasks.length})
        </button>
        <button
          onClick={() => setActiveTab('subscriptions')}
          className={`pb-3 text-xs font-bold uppercase tracking-wider cursor-pointer border-b-2 transition ${
            activeTab === 'subscriptions' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          Subscriptions Directory ({subscriptions.length})
        </button>
      </div>

      {/* Info Banner */}
      <div className="bg-primary/5 border border-primary/20 p-4 rounded-2xl flex gap-3 text-xs text-foreground select-none">
        <Info size={16} className="text-primary shrink-0 mt-0.5" />
        <div className="space-y-1 text-left">
          <span className="font-bold">Enterprise Settlement Rules:</span>
          <p className="text-muted-foreground leading-normal">
            Wallet settlements are processed instantly using double-entry checks. For subscriptions, the Platform fee (5%) goes to admin, and 95% goes to the vendor (Franchise commission is bypassed at 0%). Payouts can be released in monthly statement batches or on a per-task basis at any time.
          </p>
        </div>
      </div>

      {/* Statements Queue Tab */}
      {activeTab === 'statements' && (
        <div className="bg-card border border-border/80 rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-border/60 text-left">
            <FileText size={16} className="text-primary" />
            <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">Subscription Payouts Settlement Queue</h3>
          </div>

          {loadingStatements ? (
            <div className="py-12 text-center text-xs text-muted-foreground">
              <RefreshCw className="animate-spin inline mr-2" size={16} />
              Loading statements...
            </div>
          ) : statements.length === 0 ? (
            <div className="py-12 text-center text-xs text-muted-foreground bg-secondary/5 rounded-xl border border-border/40">
              No active billing statements pending approval.
            </div>
          ) : (
            <div className="border border-border/70 rounded-xl overflow-hidden text-xs">
              <div className="grid grid-cols-7 p-3 bg-muted font-bold text-muted-foreground text-[9px] uppercase tracking-wider text-left">
                <span>Statement No</span>
                <span>Period</span>
                <span>Accounts</span>
                <span>Deliveries</span>
                <span>Gross Total</span>
                <span>Commissions</span>
                <span className="text-right">Action</span>
              </div>
              <div className="divide-y divide-border font-medium text-foreground bg-card text-left">
                {statements.map((stmt) => (
                  <div key={stmt._id} className="grid grid-cols-7 p-3 items-center hover:bg-secondary/5 transition-colors">
                    <span className="font-mono text-[10px] text-primary">{stmt.statementNumber}</span>
                    <span>{stmt.billingPeriod}</span>
                    <div className="flex flex-col text-[10px]">
                      <span className="font-semibold text-foreground">Vendor: {stmt.vendorId?.name || 'Store'}</span>
                      <span className="text-[8px] text-muted-foreground">Cust: {stmt.customerId?.name || 'Customer'}</span>
                    </div>
                    <span>{stmt.delivered} Active / {stmt.skipped} Skip</span>
                    <span className="font-bold text-foreground">₹{stmt.grossAmount}</span>
                    <div className="flex flex-col text-[8px] text-muted-foreground">
                      <span>Plat: ₹{stmt.platformCommission}</span>
                      <span>Fran: ₹{stmt.franchiseCommission}</span>
                    </div>
                    <div className="text-right">
                      {stmt.settlementStatus === 'settled' ? (
                        <span className="px-2 py-1 rounded bg-emerald-500/10 text-emerald-600 font-bold text-[9px] inline-flex items-center gap-1">
                          <CheckCircle size={10} /> Settled
                        </span>
                      ) : stmt.settlementStatus === 'failed' ? (
                        <span className="px-2 py-1 rounded bg-red-500/10 text-red-600 font-bold text-[9px] inline-flex items-center gap-1">
                          <AlertTriangle size={10} /> Failed
                        </span>
                      ) : (
                        <button
                          onClick={() => handleApproveStatement(stmt._id)}
                          disabled={settlingId === stmt._id}
                          className="px-2.5 py-1.5 bg-primary text-primary-foreground rounded-lg text-[9px] font-bold cursor-pointer disabled:opacity-50 hover:bg-primary/95 shadow-sm"
                        >
                          {settlingId === stmt._id ? 'Settling...' : 'Release Payout'}
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Pending Task Payouts Tab */}
      {activeTab === 'tasks' && (
        <div className="bg-card border border-border/80 rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-border/60 text-left">
            <Truck size={16} className="text-primary" />
            <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">Unpaid Daily Delivery Tasks</h3>
          </div>

          {loadingPendingTasks ? (
            <div className="py-12 text-center text-xs text-muted-foreground">
              <RefreshCw className="animate-spin inline mr-2" size={16} />
              Loading pending tasks...
            </div>
          ) : pendingTasks.length === 0 ? (
            <div className="py-12 text-center text-xs text-muted-foreground bg-secondary/5 rounded-xl border border-border/40">
              No delivered runs pending payout.
            </div>
          ) : (
            <div className="border border-border/70 rounded-xl overflow-hidden text-xs">
              <div className="grid grid-cols-7 p-3 bg-muted font-bold text-muted-foreground text-[9px] uppercase tracking-wider text-left">
                <span>Task Date</span>
                <span>Product Name</span>
                <span>Client Details</span>
                <span>Vendor Details</span>
                <span>Gross Cost</span>
                <span>Split Preview</span>
                <span className="text-right">Actions</span>
              </div>
              <div className="divide-y divide-border font-medium text-foreground bg-card text-left">
                {pendingTasks.map((t) => {
                  const sub = t.subscriptionId || {};
                  const customer = sub.userId || {};
                  const vendor = sub.vendorId || {};
                  const grossAmount = sub.unitPrice * sub.quantity || 0;
                  const platformCommission = Number((grossAmount * 0.05).toFixed(2));
                  const vendorPayout = Number((grossAmount * 0.95).toFixed(2));

                  return (
                    <div key={t._id} className="grid grid-cols-7 p-3 items-center hover:bg-secondary/5 transition-colors">
                      <span className="font-mono text-[10px] text-primary">{t.date}</span>
                      <span className="font-bold text-foreground">{sub.productName || 'Product'}</span>
                      <div className="flex flex-col text-[10px]">
                        <span className="font-bold">{customer.name || 'Customer'}</span>
                        <span className="text-[8px] text-muted-foreground">{customer.phone}</span>
                      </div>
                      <div className="flex flex-col text-[10px]">
                        <span className="font-bold">{vendor.businessName || 'Store'}</span>
                        <span className="text-[8px] text-muted-foreground">{vendor.ownerName}</span>
                      </div>
                      <span className="font-bold text-foreground">₹{grossAmount}</span>
                      <div className="flex flex-col text-[8px] text-muted-foreground">
                        <span>Plat (5%): ₹{platformCommission}</span>
                        <span>Vend (95%): ₹{vendorPayout}</span>
                      </div>
                      <div className="text-right">
                        <button
                          onClick={() => handleApproveTask(t._id)}
                          disabled={settlingTaskId === t._id}
                          className="px-2.5 py-1.5 bg-primary text-primary-foreground rounded-lg text-[9px] font-bold cursor-pointer disabled:opacity-50 hover:bg-primary/95 shadow-sm"
                        >
                          {settlingTaskId === t._id ? 'Releasing...' : 'Release Payout'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Subscriptions Directory Tab */}
      {activeTab === 'subscriptions' && (
        <div className="bg-card border border-border/80 rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-border/60 text-left">
            <List size={16} className="text-primary" />
            <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">Active Customer Subscriptions</h3>
          </div>

          {loadingSubscriptions ? (
            <div className="py-12 text-center text-xs text-muted-foreground">
              <RefreshCw className="animate-spin inline mr-2" size={16} />
              Loading subscriptions...
            </div>
          ) : subscriptions.length === 0 ? (
            <div className="py-12 text-center text-xs text-muted-foreground bg-secondary/5 rounded-xl border border-border/40">
              No active user subscriptions registered in the system.
            </div>
          ) : (
            <div className="border border-border/70 rounded-xl overflow-hidden text-xs">
              <div className="grid grid-cols-7 p-3 bg-muted font-bold text-muted-foreground text-[9px] uppercase tracking-wider text-left">
                <span>Product Details</span>
                <span>Frequency</span>
                <span>Quantity</span>
                <span>Price</span>
                <span>Customer</span>
                <span>Vendor</span>
                <span className="text-right">Actions</span>
              </div>
              <div className="divide-y divide-border font-medium text-foreground bg-card text-left">
                {subscriptions.map((sub) => (
                  <div key={sub._id} className="grid grid-cols-7 p-3 items-center hover:bg-secondary/5 transition-colors">
                    <div className="flex items-center gap-2">
                      {sub.productImage && (
                        <img src={sub.productImage} className="w-8 h-8 rounded-lg object-cover" alt="" />
                      )}
                      <div className="flex flex-col">
                        <span className="font-bold text-foreground">{sub.productName}</span>
                        <span className="text-[8px] text-muted-foreground font-mono">ID: {sub._id.substring(0, 10)}...</span>
                      </div>
                    </div>
                    <span className="capitalize">{sub.frequency}</span>
                    <span>{sub.quantity} units</span>
                    <span className="font-bold">₹{sub.unitPrice}</span>
                    <div className="flex flex-col text-[10px]">
                      <span className="font-bold text-foreground">{sub.userId?.name || 'Customer'}</span>
                      <span className="text-[8px] text-muted-foreground">{sub.userId?.phone || 'N/A'}</span>
                    </div>
                    <div className="flex flex-col text-[10px]">
                      <span className="font-bold text-foreground">{sub.vendorId?.businessName || 'Store'}</span>
                      <span className="text-[8px] text-muted-foreground">{sub.vendorId?.ownerName || 'Vendor'}</span>
                    </div>
                    <div className="text-right">
                      <button
                        onClick={() => fetchTasks(sub)}
                        className="px-2.5 py-1.5 border border-border hover:bg-secondary/15 rounded-lg text-[9px] font-bold cursor-pointer text-foreground"
                      >
                        Delivery Logs
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Modal for Delivery History Tasks */}
      {showTasksModal && selectedSub && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-card border border-border rounded-2xl p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto shadow-xl flex flex-col text-left">
            <div className="flex justify-between items-center pb-4 border-b border-border/60 mb-4">
              <div>
                <h3 className="text-sm font-bold text-foreground uppercase tracking-wider">Delivery History Details</h3>
                <p className="text-[10px] text-muted-foreground mt-0.5">Product: {selectedSub.productName} (Qty: {selectedSub.quantity})</p>
              </div>
              <button
                onClick={() => setShowTasksModal(false)}
                className="text-muted-foreground hover:text-foreground text-xs font-bold px-3 py-1.5 border border-border rounded-xl cursor-pointer hover:bg-secondary/10"
              >
                Close
              </button>
            </div>

            {loadingTasks ? (
              <div className="py-12 text-center text-xs text-muted-foreground">
                <RefreshCw className="animate-spin inline mr-2" size={16} />
                Loading logs...
              </div>
            ) : selectedSubTasks.length === 0 ? (
              <div className="py-12 text-center text-xs text-muted-foreground bg-secondary/5 rounded-xl border border-border/40 italic">
                No delivery task runs logged for this subscription yet.
              </div>
            ) : (
              <div className="space-y-4">
                <div className="border border-border/70 rounded-xl overflow-hidden text-xs">
                  <div className="grid grid-cols-5 p-2.5 bg-muted font-bold text-muted-foreground text-[9px] uppercase tracking-wider text-left">
                    <span>Date</span>
                    <span>Status</span>
                    <span>OTP Verified</span>
                    <span>Rider ID</span>
                    <span>Notes</span>
                  </div>
                  <div className="divide-y divide-border text-foreground bg-card text-left">
                    {selectedSubTasks.map((task) => (
                      <div key={task._id} className="grid grid-cols-5 p-2.5 items-center hover:bg-secondary/5">
                        <span className="font-mono text-[10px]">{task.date}</span>
                        <span>
                          <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                            task.status === 'delivered' ? 'bg-emerald-500/10 text-emerald-600' :
                            task.status === 'failed' ? 'bg-red-500/10 text-red-600' :
                            'bg-yellow-500/10 text-yellow-600'
                          }`}>
                            {task.status}
                          </span>
                        </span>
                        <span>
                          <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${task.otpVerified ? 'bg-emerald-500/10 text-emerald-600' : 'bg-secondary/15 text-muted-foreground'}`}>
                            {task.otpVerified ? 'Yes' : 'No'}
                          </span>
                        </span>
                        <span className="font-mono text-[10px] text-muted-foreground truncate">{task.riderId || 'Unassigned'}</span>
                        <span className="text-[10px] text-muted-foreground truncate" title={task.notes}>{task.notes || 'N/A'}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
