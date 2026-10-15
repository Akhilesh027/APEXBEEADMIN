import React, { useState, useEffect, useMemo } from 'react';
import {
  ArrowDownLeft,
  ArrowUpRight,
  Search,
  Filter,
  Edit2,
  Trash2,
  Download,
  RefreshCw,
  Plus,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  Lock,
  Wallet,
  Users,
  Building2,
  Store,
  ChevronLeft,
  ChevronRight,
  Copy,
  Check,
  X,
  FileSpreadsheet,
  BadgeAlert
} from 'lucide-react';

export interface TransactionItem {
  id: string;
  _id?: string;
  transactionId: string;
  walletId?: string;
  userId?: string;
  userName: string;
  userEmail?: string;
  userPhone?: string;
  userRole?: string;
  type: 'credit' | 'debit';
  direction?: 'credit' | 'debit';
  amount: number;
  category: string;
  source?: string;
  status: 'completed' | 'pending' | 'hold' | 'failed' | 'reversed';
  remarks?: string;
  description?: string;
  orderId?: string;
  referenceType?: string;
  createdAt: string;
}

const API_BASE = import.meta.env.VITE_API_URL || '/api';

export const TransactionManagement: React.FC = () => {
  const [transactions, setTransactions] = useState<TransactionItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [successMsg, setSuccessMsg] = useState<string>('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'credit' | 'debit'>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const itemsPerPage = 15;

  // Edit Modal State
  const [editModalOpen, setEditModalOpen] = useState<boolean>(false);
  const [editingTx, setEditingTx] = useState<TransactionItem | null>(null);
  const [editForm, setEditForm] = useState({
    amount: 0,
    type: 'credit' as 'credit' | 'debit',
    category: 'General',
    status: 'completed' as TransactionItem['status'],
    remarks: '',
    orderId: ''
  });
  const [savingEdit, setSavingEdit] = useState<boolean>(false);

  // Delete Modal State
  const [deleteModalOpen, setDeleteModalOpen] = useState<boolean>(false);
  const [deletingTx, setDeletingTx] = useState<TransactionItem | null>(null);
  const [deleting, setDeleting] = useState<boolean>(false);

  // New Transaction Modal State
  const [createModalOpen, setCreateModalOpen] = useState<boolean>(false);
  const [createForm, setCreateForm] = useState({
    userId: '',
    amount: '',
    type: 'credit' as 'credit' | 'debit',
    category: 'Admin Adjustment',
    status: 'completed' as TransactionItem['status'],
    remarks: '',
    orderId: ''
  });
  const [creating, setCreating] = useState<boolean>(false);

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      setErrorMsg('');
      const token = localStorage.getItem('adminToken') || localStorage.getItem('token');
      const res = await fetch(`${API_BASE}/admin/transactions?limit=1500`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });

      if (!res.ok) {
        throw new Error(`Server returned ${res.status}: ${res.statusText}`);
      }

      const data = await res.json();
      if (data.success && Array.isArray(data.transactions)) {
        setTransactions(data.transactions);
      } else {
        // Fallback: ingest directly from wallets endpoint if transactions endpoint is empty
        const fallbackRes = await fetch(`${API_BASE}/admin/wallets`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {}
        });
        if (fallbackRes.ok) {
          const fbData = await fallbackRes.json();
          const list: TransactionItem[] = [];
          (fbData.wallets || []).forEach((w: any) => {
            const u = w.userId;
            const uName = u?.name || w.ownerName || 'Member';
            const uEmail = u?.email || '';
            const uRole = Array.isArray(u?.roles) ? u.roles.join(', ') : (u?.role || w.type || 'user');
            (w.ledgerEntries || []).forEach((e: any, idx: number) => {
              list.push({
                id: e._id || `tx-${w._id}-${idx}`,
                _id: e._id,
                transactionId: e.transactionId || `TXN-${String(e._id || idx).slice(-8)}`,
                walletId: w._id,
                userId: u?._id || w.userId,
                userName: uName,
                userEmail: uEmail,
                userRole: uRole,
                type: e.type?.toLowerCase() === 'debit' ? 'debit' : 'credit',
                direction: e.type?.toLowerCase() === 'debit' ? 'debit' : 'credit',
                amount: Math.abs(Number(e.amount || 0)),
                category: e.category || e.source || 'General',
                status: (e.status || 'completed').toLowerCase(),
                remarks: e.remarks || e.description || '',
                description: e.description || e.remarks || '',
                orderId: e.referenceId || '',
                createdAt: e.createdAt || e.date || new Date().toISOString()
              });
            });
          });
          list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
          setTransactions(list);
        }
      }
    } catch (err: any) {
      console.error('Failed to load transactions:', err);
      setErrorMsg(err.message || 'Failed to load transaction ledger');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const openEditModal = (tx: TransactionItem) => {
    setEditingTx(tx);
    setEditForm({
      amount: tx.amount,
      type: tx.type,
      category: tx.category,
      status: tx.status,
      remarks: tx.remarks || tx.description || '',
      orderId: tx.orderId || ''
    });
    setEditModalOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!editingTx) return;
    try {
      setSavingEdit(true);
      setErrorMsg('');
      const token = localStorage.getItem('adminToken') || localStorage.getItem('token');
      const targetId = editingTx._id || editingTx.id;

      const res = await fetch(`${API_BASE}/admin/transactions/${targetId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify(editForm)
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Failed to update transaction');
      }

      // Update state locally
      setTransactions(prev =>
        prev.map(t =>
          (t._id === targetId || t.id === targetId)
            ? {
              ...t,
              amount: Number(editForm.amount),
              type: editForm.type,
              direction: editForm.type,
              category: editForm.category,
              status: editForm.status,
              remarks: editForm.remarks,
              description: editForm.remarks,
              orderId: editForm.orderId
            }
            : t
        )
      );

      setSuccessMsg(`Transaction ${editingTx.transactionId} updated successfully.`);
      setTimeout(() => setSuccessMsg(''), 4000);
      setEditModalOpen(false);
      setEditingTx(null);
    } catch (err: any) {
      alert(err.message || 'Error updating transaction');
    } finally {
      setSavingEdit(false);
    }
  };

  const openDeleteModal = (tx: TransactionItem) => {
    setDeletingTx(tx);
    setDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!deletingTx) return;
    try {
      setDeleting(true);
      setErrorMsg('');
      const token = localStorage.getItem('adminToken') || localStorage.getItem('token');
      const targetId = deletingTx._id || deletingTx.id;

      const res = await fetch(`${API_BASE}/admin/transactions/${targetId}`, {
        method: 'DELETE',
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Failed to delete transaction');
      }

      // Remove from list locally
      setTransactions(prev => prev.filter(t => t._id !== targetId && t.id !== targetId));

      setSuccessMsg(`Transaction ${deletingTx.transactionId} deleted permanently.`);
      setTimeout(() => setSuccessMsg(''), 4000);
      setDeleteModalOpen(false);
      setDeletingTx(null);
    } catch (err: any) {
      alert(err.message || 'Error deleting transaction');
    } finally {
      setDeleting(false);
    }
  };

  // Delete All Transactions
  const handleDeleteAllTransactions = async () => {
    if (!window.confirm("⚠️ ARE YOU SURE? This will permanently delete ALL transactions, reset all wallet balances and ledger entries to ₹0, and reset commission settlements!")) {
      return;
    }
    try {
      setLoading(true);
      setErrorMsg('');
      const token = localStorage.getItem('adminToken') || localStorage.getItem('token');
      const res = await fetch(`${API_BASE}/admin/transactions/all`, {
        method: 'DELETE',
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      const data = await res.json();
      if (data.success) {
        setSuccessMsg(data.message || "All transactions successfully deleted!");
        setTransactions([]);
        setTimeout(() => setSuccessMsg(''), 5000);
      } else {
        setErrorMsg(data.message || "Failed to delete all transactions");
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Error deleting all transactions");
    } finally {
      setLoading(false);
    }
  };

  // Export to CSV
  const exportToCSV = () => {
    if (filteredTransactions.length === 0) return;
    const headers = ['Transaction ID', 'Order ID', 'Date', 'User Name', 'User Email', 'Role', 'Direction', 'Amount (INR)', 'Category', 'Status', 'Remarks'];
    const rows = filteredTransactions.map(t => [
      `"${t.transactionId}"`,
      `"${t.orderId || ''}"`,
      `"${new Date(t.createdAt).toLocaleString('en-IN')}"`,
      `"${t.userName}"`,
      `"${t.userEmail || ''}"`,
      `"${t.userRole || ''}"`,
      `"${t.type.toUpperCase()}"`,
      t.amount,
      `"${t.category}"`,
      `"${t.status.toUpperCase()}"`,
      `"${(t.remarks || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `apexbee_transactions_${new Date().toISOString().substring(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filtered dataset
  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => {
      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesId = t.transactionId.toLowerCase().includes(q);
        const matchesOrder = (t.orderId || '').toLowerCase().includes(q);
        const matchesName = (t.userName || '').toLowerCase().includes(q);
        const matchesEmail = (t.userEmail || '').toLowerCase().includes(q);
        const matchesPhone = (t.userPhone || '').includes(q);
        const matchesCategory = (t.category || '').toLowerCase().includes(q);
        const matchesRemarks = (t.remarks || '').toLowerCase().includes(q);

        if (!matchesId && !matchesOrder && !matchesName && !matchesEmail && !matchesPhone && !matchesCategory && !matchesRemarks) {
          return false;
        }
      }

      // Direction / Type
      if (typeFilter !== 'all' && t.type !== typeFilter) {
        return false;
      }

      // Status
      if (statusFilter !== 'all' && t.status !== statusFilter) {
        return false;
      }

      // Category
      if (categoryFilter !== 'all' && t.category !== categoryFilter) {
        return false;
      }

      return true;
    });
  }, [transactions, searchQuery, typeFilter, statusFilter, categoryFilter]);

  // Aggregate Metrics
  const stats = useMemo(() => {
    let totalCredits = 0;
    let totalDebits = 0;
    let pendingHold = 0;

    transactions.forEach(t => {
      const amt = Number(t.amount || 0);
      if (t.status === 'hold' || t.status === 'pending') {
        pendingHold += amt;
      } else if (t.type === 'credit') {
        totalCredits += amt;
      } else {
        totalDebits += amt;
      }
    });

    return {
      totalCount: transactions.length,
      totalCredits,
      totalDebits,
      netVolume: totalCredits - totalDebits,
      pendingHold
    };
  }, [transactions]);

  // Unique categories for filter dropdown
  const categoriesList = useMemo(() => {
    const set = new Set<string>();
    transactions.forEach(t => {
      if (t.category) set.add(t.category);
    });
    return Array.from(set).sort();
  }, [transactions]);

  // Pagination
  const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage) || 1;
  const paginatedTransactions = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredTransactions.slice(start, start + itemsPerPage);
  }, [filteredTransactions, currentPage, itemsPerPage]);

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-card border border-border p-6 rounded-2xl shadow-sm">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-black tracking-tight text-foreground flex items-center gap-2">
              <span className="p-2 rounded-xl bg-primary/10 text-primary">💳</span> All System Transactions
            </h1>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
              {stats.totalCount} Records
            </span>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            Global ledger audit across users, vendors, franchises, and referral partners with real-time edit &amp; deletion governance.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={fetchTransactions}
            disabled={loading}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-xl border border-border bg-card hover:bg-secondary text-foreground transition shadow-xs cursor-pointer active:scale-95"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>

          <button
            onClick={exportToCSV}
            disabled={filteredTransactions.length === 0}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-xl border border-border bg-card hover:bg-secondary text-foreground transition shadow-xs cursor-pointer active:scale-95 disabled:opacity-50"
          >
            <Download size={14} />
            Export CSV
          </button>

          <button
            onClick={handleDeleteAllTransactions}
            disabled={loading || transactions.length === 0}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-xl border border-rose-500/30 bg-rose-500/10 hover:bg-rose-500 hover:text-white text-rose-500 transition shadow-xs cursor-pointer active:scale-95 disabled:opacity-50"
            title="Permanently delete all transactions and reset wallet balances"
          >
            <Trash2 size={14} />
            Delete All Transactions
          </button>
        </div>
      </div>

      {/* Notifications */}
      {successMsg && (
        <div className="flex items-center gap-2 p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-bold animate-fadeIn">
          <CheckCircle size={16} />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="flex items-center gap-2 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs font-bold animate-fadeIn">
          <AlertTriangle size={16} />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-4 sm:p-5 rounded-2xl bg-card border border-border shadow-xs">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-[11px] sm:text-xs font-bold uppercase tracking-wider">Total Credits (Inflow)</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
              <ArrowDownLeft size={16} />
            </div>
          </div>
          <p className="text-xl sm:text-2xl font-black text-emerald-600 mt-2 font-mono">
            ₹{stats.totalCredits.toLocaleString('en-IN')}
          </p>
          <p className="text-[10px] text-muted-foreground mt-1">
            Store sales, commissions &amp; deposits credited
          </p>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl bg-card border border-border shadow-xs">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-[11px] sm:text-xs font-bold uppercase tracking-wider">Total Debits (Outflow)</span>
            <div className="w-8 h-8 rounded-xl bg-rose-500/10 text-rose-600 flex items-center justify-center">
              <ArrowUpRight size={16} />
            </div>
          </div>
          <p className="text-xl sm:text-2xl font-black text-rose-600 mt-2 font-mono">
            ₹{stats.totalDebits.toLocaleString('en-IN')}
          </p>
          <p className="text-[10px] text-muted-foreground mt-1">
            Bank payouts, wallet debits &amp; order spends
          </p>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl bg-card border border-border shadow-xs">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-[11px] sm:text-xs font-bold uppercase tracking-wider">Escrow / Pending Hold</span>
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center">
              <Clock size={16} />
            </div>
          </div>
          <p className="text-xl sm:text-2xl font-black text-amber-600 mt-2 font-mono">
            ₹{stats.pendingHold.toLocaleString('en-IN')}
          </p>
          <p className="text-[10px] text-muted-foreground mt-1">
            7-day return safety holds &amp; pending clearances
          </p>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl bg-card border border-border shadow-xs">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-[11px] sm:text-xs font-bold uppercase tracking-wider">Net Circulating Volume</span>
            <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <Wallet size={16} />
            </div>
          </div>
          <p className="text-xl sm:text-2xl font-black text-foreground mt-2 font-mono">
            ₹{stats.netVolume.toLocaleString('en-IN')}
          </p>
          <p className="text-[10px] text-muted-foreground mt-1">
            Active balance across all user wallets
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-card border border-border p-4 rounded-2xl shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search by Txn ID, Order Ref, Name, Phone, Category..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-9 pr-4 py-2 bg-background border border-border rounded-xl text-xs sm:text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground text-xs"
              >
                ✕
              </button>
            )}
          </div>

          {/* Quick Direction Tabs */}
          <div className="flex items-center gap-1.5 p-1 bg-secondary rounded-xl self-start md:self-auto">
            <button
              onClick={() => { setTypeFilter('all'); setCurrentPage(1); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${typeFilter === 'all'
                  ? 'bg-card text-foreground shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
                }`}
            >
              All Types
            </button>
            <button
              onClick={() => { setTypeFilter('credit'); setCurrentPage(1); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 ${typeFilter === 'credit'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-emerald-600 hover:bg-emerald-500/10'
                }`}
            >
              <ArrowDownLeft size={13} /> Credit (+)
            </button>
            <button
              onClick={() => { setTypeFilter('debit'); setCurrentPage(1); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 ${typeFilter === 'debit'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'text-rose-600 hover:bg-rose-500/10'
                }`}
            >
              <ArrowUpRight size={13} /> Debit (-)
            </button>
          </div>
        </div>

        {/* Dropdown Filters */}
        <div className="flex flex-wrap items-center gap-2.5 pt-2 border-t border-border/60">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-bold">
            <Filter size={13} /> Filters:
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
            className="px-2.5 py-1.5 bg-background border border-border rounded-xl text-xs font-medium text-foreground focus:outline-none"
          >
            <option value="all">All Statuses</option>
            <option value="completed">Completed / Settled</option>
            <option value="pending">Pending</option>
            <option value="hold">Hold / Escrow</option>
            <option value="failed">Failed</option>
            <option value="reversed">Reversed</option>
          </select>

          {/* Category Filter */}
          <select
            value={categoryFilter}
            onChange={(e) => { setCategoryFilter(e.target.value); setCurrentPage(1); }}
            className="px-2.5 py-1.5 bg-background border border-border rounded-xl text-xs font-medium text-foreground focus:outline-none"
          >
            <option value="all">All Categories</option>
            {categoriesList.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>

          {(typeFilter !== 'all' || statusFilter !== 'all' || categoryFilter !== 'all' || searchQuery) && (
            <button
              onClick={() => {
                setTypeFilter('all');
                setStatusFilter('all');
                setCategoryFilter('all');
                setSearchQuery('');
                setCurrentPage(1);
              }}
              className="px-2.5 py-1 text-xs text-muted-foreground hover:text-foreground font-semibold underline cursor-pointer"
            >
              Reset filters
            </button>
          )}

          <div className="ml-auto text-xs text-muted-foreground">
            Showing <span className="font-bold text-foreground">{filteredTransactions.length}</span> matching entries
          </div>
        </div>
      </div>

      {/* Main Transactions Table */}
      <div className="bg-card border border-border rounded-2xl shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-16 text-center space-y-3">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            <p className="text-xs text-muted-foreground">Loading transaction records...</p>
          </div>
        ) : filteredTransactions.length === 0 ? (
          <div className="p-16 text-center space-y-2">
            <div className="w-12 h-12 mx-auto rounded-2xl bg-secondary flex items-center justify-center text-muted-foreground text-xl">
              📂
            </div>
            <p className="text-sm font-bold text-foreground">No Transactions Found</p>
            <p className="text-xs text-muted-foreground">
              Try adjusting your search criteria or filter tags.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-border bg-secondary/50 text-muted-foreground font-bold uppercase tracking-wider text-[10.5px]">
                  <th className="p-3.5 pl-5">Txn ID &amp; Ref</th>
                  <th className="p-3.5">Date &amp; Time</th>
                  <th className="p-3.5">User / Account</th>
                  <th className="p-3.5">Type &amp; Category</th>
                  <th className="p-3.5 text-right">Amount (₹)</th>
                  <th className="p-3.5 text-center">Status</th>
                  <th className="p-3.5">Remarks / Reason</th>
                  <th className="p-3.5 pr-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {paginatedTransactions.map((tx) => {
                  const isCredit = tx.type === 'credit';
                  return (
                    <tr
                      key={tx.id}
                      className="hover:bg-secondary/40 transition-colors group"
                    >
                      {/* Txn ID */}
                      <td className="p-3.5 pl-5">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono font-bold text-foreground text-[11px]">
                            {tx.transactionId}
                          </span>
                          <button
                            onClick={() => handleCopy(tx.id, tx.transactionId)}
                            className="text-muted-foreground hover:text-foreground opacity-0 group-hover:opacity-100 transition p-0.5"
                            title="Copy Txn ID"
                          >
                            {copiedId === tx.id ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
                          </button>
                        </div>
                        {tx.orderId && (
                          <span className="text-[10px] text-muted-foreground font-mono block">
                            Ref: {tx.orderId}
                          </span>
                        )}
                      </td>

                      {/* Date */}
                      <td className="p-3.5 text-muted-foreground whitespace-nowrap">
                        <span className="block font-medium text-foreground">
                          {new Date(tx.createdAt).toLocaleDateString('en-IN', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric'
                          })}
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                          {new Date(tx.createdAt).toLocaleTimeString('en-IN', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      </td>

                      {/* User */}
                      <td className="p-3.5">
                        <div className="font-bold text-foreground">
                          {tx.userName}
                        </div>
                        <div className="text-[10px] text-muted-foreground truncate max-w-[150px]">
                          {tx.userEmail || tx.userPhone || '—'}
                        </div>
                        {tx.userRole && (
                          <span className="inline-block text-[9px] px-1.5 py-0.2 rounded bg-secondary text-muted-foreground font-semibold mt-0.5 uppercase tracking-wider">
                            {tx.userRole}
                          </span>
                        )}
                      </td>

                      {/* Type & Category */}
                      <td className="p-3.5">
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider ${isCredit
                                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                                : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20'
                              }`}
                          >
                            {isCredit ? <ArrowDownLeft size={11} /> : <ArrowUpRight size={11} />}
                            {tx.type}
                          </span>
                        </div>
                        <span className="text-[10.5px] font-semibold text-foreground block mt-0.5">
                          {tx.category}
                        </span>
                      </td>

                      {/* Amount */}
                      <td className="p-3.5 text-right">
                        <span
                          className={`font-mono font-black text-sm ${isCredit
                              ? 'text-emerald-600 dark:text-emerald-400'
                              : 'text-rose-600 dark:text-rose-400'
                            }`}
                        >
                          {isCredit ? '+' : '-'}₹{Number(tx.amount || 0).toLocaleString('en-IN')}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="p-3.5 text-center">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${tx.status === 'completed'
                              ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20'
                              : tx.status === 'pending'
                                ? 'bg-amber-500/10 text-amber-600 border border-amber-500/20'
                                : tx.status === 'hold'
                                  ? 'bg-purple-500/10 text-purple-600 border border-purple-500/20'
                                  : 'bg-rose-500/10 text-rose-600 border border-rose-500/20'
                            }`}
                        >
                          {tx.status}
                        </span>
                      </td>

                      {/* Remarks */}
                      <td className="p-3.5 max-w-[200px]">
                        <p className="text-[11px] text-muted-foreground truncate" title={tx.remarks || tx.description}>
                          {tx.remarks || tx.description || '—'}
                        </p>
                      </td>

                      {/* Actions */}
                      <td className="p-3.5 pr-5 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Edit Button */}
                          <button
                            onClick={() => openEditModal(tx)}
                            className="p-1.5 rounded-lg border border-border bg-card hover:bg-secondary text-foreground hover:text-primary transition shadow-2xs cursor-pointer active:scale-95"
                            title="Edit transaction details & amount"
                          >
                            <Edit2 size={13} />
                          </button>

                          {/* Delete Button */}
                          <button
                            onClick={() => openDeleteModal(tx)}
                            className="p-1.5 rounded-lg border border-rose-500/20 bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 transition shadow-2xs cursor-pointer active:scale-95"
                            title="Delete transaction and adjust balance"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Bar */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between p-4 border-t border-border bg-card text-xs text-muted-foreground">
            <div>
              Page <span className="font-bold text-foreground">{currentPage}</span> of{' '}
              <span className="font-bold text-foreground">{totalPages}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-2.5 py-1.5 rounded-lg border border-border bg-card hover:bg-secondary disabled:opacity-40 transition font-bold flex items-center gap-1 cursor-pointer"
              >
                <ChevronLeft size={14} /> Prev
              </button>
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-2.5 py-1.5 rounded-lg border border-border bg-card hover:bg-secondary disabled:opacity-40 transition font-bold flex items-center gap-1 cursor-pointer"
              >
                Next <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ======================================================== */}
      {/* EDIT TRANSACTION MODAL */}
      {/* ======================================================== */}
      {editModalOpen && editingTx && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-card border border-border rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-5 border-b border-border flex items-center justify-between">
              <div>
                <h3 className="font-black text-base text-foreground flex items-center gap-2">
                  <Edit2 size={16} className="text-primary" /> Edit Transaction
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  ID: <span className="font-mono font-bold text-foreground">{editingTx.transactionId}</span> • Member: {editingTx.userName}
                </p>
              </div>
              <button
                onClick={() => setEditModalOpen(false)}
                className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-5 space-y-4 overflow-y-auto flex-1 text-xs">
              {/* Alert note about balance adjustment */}
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 flex items-start gap-2">
                <AlertTriangle size={15} className="shrink-0 mt-0.5" />
                <p className="leading-relaxed">
                  Modifying the <strong>Amount</strong> or <strong>Direction (Credit/Debit)</strong> will automatically recalculate and adjust the user's live wallet balance to ensure financial consistency.
                </p>
              </div>

              {/* Amount */}
              <div>
                <label className="block font-bold text-foreground mb-1">Transaction Amount (₹)</label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={editForm.amount}
                  onChange={(e) => setEditForm(prev => ({ ...prev, amount: Number(e.target.value) }))}
                  className="w-full px-3 py-2 bg-background border border-border rounded-xl text-sm font-mono font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>

              {/* Direction & Status grid */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-foreground mb-1">Direction</label>
                  <select
                    value={editForm.type}
                    onChange={(e) => setEditForm(prev => ({ ...prev, type: e.target.value as any }))}
                    className="w-full px-3 py-2 bg-background border border-border rounded-xl font-bold text-foreground focus:outline-none"
                  >
                    <option value="credit">Credit (Inflow +)</option>
                    <option value="debit">Debit (Outflow -)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-foreground mb-1">Status</label>
                  <select
                    value={editForm.status}
                    onChange={(e) => setEditForm(prev => ({ ...prev, status: e.target.value as any }))}
                    className="w-full px-3 py-2 bg-background border border-border rounded-xl font-bold text-foreground focus:outline-none"
                  >
                    <option value="completed">Completed</option>
                    <option value="pending">Pending</option>
                    <option value="hold">Hold</option>
                    <option value="failed">Failed</option>
                    <option value="reversed">Reversed</option>
                  </select>
                </div>
              </div>

              {/* Category & Order ID */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-foreground mb-1">Category / Stream</label>
                  <input
                    type="text"
                    value={editForm.category}
                    onChange={(e) => setEditForm(prev => ({ ...prev, category: e.target.value }))}
                    placeholder="e.g. Vendor Sales, Payout, Referral"
                    className="w-full px-3 py-2 bg-background border border-border rounded-xl font-medium text-foreground focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-foreground mb-1">Order / Ref ID</label>
                  <input
                    type="text"
                    value={editForm.orderId}
                    onChange={(e) => setEditForm(prev => ({ ...prev, orderId: e.target.value }))}
                    placeholder="e.g. ORD-9421-VND"
                    className="w-full px-3 py-2 bg-background border border-border rounded-xl font-mono text-foreground focus:outline-none"
                  />
                </div>
              </div>

              {/* Remarks */}
              <div>
                <label className="block font-bold text-foreground mb-1">Remarks / Audit Note</label>
                <textarea
                  rows={3}
                  value={editForm.remarks}
                  onChange={(e) => setEditForm(prev => ({ ...prev, remarks: e.target.value }))}
                  placeholder="Reason for adjustment, order delivery confirmation notes, etc."
                  className="w-full px-3 py-2 bg-background border border-border rounded-xl text-foreground focus:outline-none resize-none"
                />
              </div>
            </div>

            <div className="p-4 border-t border-border bg-secondary/30 flex items-center justify-end gap-2.5">
              <button
                onClick={() => setEditModalOpen(false)}
                disabled={savingEdit}
                className="px-4 py-2 rounded-xl text-xs font-bold text-muted-foreground hover:text-foreground border border-border bg-card hover:bg-secondary transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEdit}
                disabled={savingEdit || editForm.amount < 0}
                className="px-5 py-2 rounded-xl text-xs font-black bg-primary text-primary-foreground hover:opacity-90 transition cursor-pointer shadow-md active:scale-95 flex items-center gap-1.5"
              >
                {savingEdit ? <RefreshCw size={14} className="animate-spin" /> : <Check size={14} />}
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* DELETE TRANSACTION MODAL */}
      {/* ======================================================== */}
      {deleteModalOpen && deletingTx && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-card border border-border rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="p-5 border-b border-border flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-600 flex items-center justify-center shrink-0">
                <Trash2 size={20} />
              </div>
              <div>
                <h3 className="font-black text-base text-foreground">Delete Transaction</h3>
                <p className="text-xs text-muted-foreground">This action cannot be undone.</p>
              </div>
            </div>

            <div className="p-5 space-y-3.5 text-xs">
              <p className="text-foreground leading-relaxed">
                Are you sure you want to permanently delete transaction{' '}
                <strong className="font-mono font-bold text-foreground">{deletingTx.transactionId}</strong> of{' '}
                <strong className="font-bold text-foreground">₹{deletingTx.amount.toLocaleString('en-IN')}</strong>?
              </p>

              <div className="p-3 rounded-xl bg-secondary border border-border space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Member:</span>
                  <span className="font-bold text-foreground">{deletingTx.userName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Type:</span>
                  <span className="font-bold uppercase text-foreground">{deletingTx.type}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Category:</span>
                  <span className="font-bold text-foreground">{deletingTx.category}</span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-[11px] leading-relaxed">
                ⚠️ Deleting this transaction will automatically roll back its financial impact from the user's wallet balance.
              </div>
            </div>

            <div className="p-4 border-t border-border bg-secondary/30 flex items-center justify-end gap-2.5">
              <button
                onClick={() => setDeleteModalOpen(false)}
                disabled={deleting}
                className="px-4 py-2 rounded-xl text-xs font-bold text-muted-foreground hover:text-foreground border border-border bg-card hover:bg-secondary transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                disabled={deleting}
                className="px-5 py-2 rounded-xl text-xs font-black bg-rose-600 hover:bg-rose-700 text-white transition cursor-pointer shadow-md active:scale-95 flex items-center gap-1.5"
              >
                {deleting ? <RefreshCw size={14} className="animate-spin" /> : <Trash2 size={14} />}
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
