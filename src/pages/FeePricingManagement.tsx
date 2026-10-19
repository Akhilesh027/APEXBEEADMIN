import React, { useState, useEffect } from "react";
import {
  CreditCard,
  DollarSign,
  Tag,
  Send,
  CheckCircle2,
  Clock,
  ExternalLink,
  Copy,
  RefreshCw,
  Search,
  Filter,
  Sparkles,
  ShieldCheck,
  Building2,
  Store,
  Mail,
  Smartphone,
  Check,
  AlertCircle,
  Percent,
  Layers,
  ArrowRight,
  Plus,
  MapPin,
  User as UserIcon
} from "lucide-react";

interface PricingItem {
  _id: string;
  serviceKey: string;
  category: "franchise" | "vendor" | "partner" | "general";
  title: string;
  description: string;
  amount: number;
  currency: string;
  billingCycle: string;
  minAdvancePercentage?: number;
  features: string[];
  taxPercentage: number;
  isActive: boolean;
}

interface FeeInvoice {
  _id: string;
  invoiceNumber: string;
  recipientName: string;
  recipientRole: string;
  recipientEmail?: string;
  recipientPhone?: string;
  serviceKey: string;
  title: string;
  baseAmount: number;
  taxAmount: number;
  totalAmount: number;
  status: "pending" | "paid" | "cancelled" | "expired" | "failed";
  paymentLinkToken: string;
  shortPaymentUrl?: string;
  paidAt?: string;
  commissionSettled: boolean;
  commissionSettlementDetails?: Array<{
    recipientRole: string;
    tier: string;
    percentage: number;
    amount: number;
  }>;
  createdAt: string;
}

interface UserOption {
  _id: string;
  name: string;
  businessName?: string;
  email: string;
  phone: string;
  roles: string[];
  territory?: {
    state?: string;
    district?: string;
    mandal?: string;
  };
}

export const FeePricingManagement: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"pricing_cards" | "payment_links" | "commission_matrix">("pricing_cards");
  const [catalogCategory, setCatalogCategory] = useState<"all" | "franchise" | "vendor">("all");
  const [catalog, setCatalog] = useState<PricingItem[]>([]);
  const [invoices, setInvoices] = useState<FeeInvoice[]>([]);
  const [users, setUsers] = useState<UserOption[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [usersLoading, setUsersLoading] = useState<boolean>(false);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [copiedToken, setCopiedToken] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Edit State for Pricing Catalog
  const [editingItem, setEditingItem] = useState<{ [id: string]: number }>({});

  // Payment Link Generator Form State
  const [selectedUser, setSelectedUser] = useState<string>("");
  const [selectedService, setSelectedService] = useState<string>("vendor_enrollment");
  const [customAmount, setCustomAmount] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  const [isGeneratingLink, setIsGeneratingLink] = useState<boolean>(false);
  const [recipientSearch, setRecipientSearch] = useState<string>("");
  const [recipientRoleFilter, setRecipientRoleFilter] = useState<string>("all");

  // Filters for Invoices
  const [invoiceSearch, setInvoiceSearch] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const API_BASE = "https://server.apexbee.in/api";
  const getAuthHeader = () => ({
    "Content-Type": "application/json",
    Authorization: `Bearer ${localStorage.getItem("adminToken") || localStorage.getItem("admin_token") || localStorage.getItem("token") || ""}`,
  });

  const showToast = (text: string, type: "success" | "error" = "success") => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 4000);
  };

  const fetchCatalog = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/fee-pricing/catalog?category=${catalogCategory}`, {
        headers: getAuthHeader(),
      });
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setCatalog(data.data);
        const initialPrices: { [id: string]: number } = {};
        data.data.forEach((item: PricingItem) => {
          initialPrices[item._id] = item.amount;
        });
        setEditingItem(initialPrices);

        if (!customAmount) {
          const match = data.data.find((c: PricingItem) => c.serviceKey === selectedService) || data.data[0];
          if (match) setCustomAmount(String(match.amount));
        }
      }
    } catch (err) {
      console.error("Error fetching catalog:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchInvoices = async () => {
    try {
      const res = await fetch(`${API_BASE}/admin/fee-pricing/invoices`, {
        headers: getAuthHeader(),
      });
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setInvoices(data.data);
      }
    } catch (err) {
      console.error("Error fetching invoices:", err);
    }
  };

  const fetchUsers = async () => {
    try {
      setUsersLoading(true);
      const [usersRes, vendorsRes, restRes] = await Promise.all([
        fetch(`${API_BASE}/admin/users?limit=300`, { headers: getAuthHeader() }),
        fetch(`${API_BASE}/admin/vendors`, { headers: getAuthHeader() }),
        fetch(`${API_BASE}/admin/food/restaurants`, { headers: getAuthHeader() }).catch(() => null),
      ]);
      const usersData = await usersRes.json();
      const vendorsData = await vendorsRes.json();
      let restList: any[] = [];
      if (restRes) {
        try {
          const restData = await restRes.json();
          restList = restData.restaurants || restData.data || [];
        } catch (e) {
          // ignore
        }
      }

      const userList: any[] = usersData.users || usersData.data || [];
      const vendorList: any[] = vendorsData.vendors || vendorsData.data || [];

      const combinedMap = new Map<string, UserOption>();

      // 1. Map registered users
      userList.forEach((u: any) => {
        const id = String(u._id);
        combinedMap.set(id, {
          _id: id,
          name: u.name || "Unnamed User",
          businessName: u.sellerProfile?.businessName || u.businessName || "",
          email: u.email || "",
          phone: u.phone || u.mobile || "",
          roles: Array.isArray(u.roles) ? u.roles : ["user"],
          territory: u.territory || {},
        });
      });

      // 2. Map and merge vendors from vendor directory
      vendorList.forEach((v: any) => {
        const userId = v.userId ? String(v.userId) : null;
        if (userId && combinedMap.has(userId)) {
          const existing = combinedMap.get(userId)!;
          existing.businessName = v.businessName || existing.businessName;
          existing.phone = existing.phone || v.mobile || v.whatsappNumber || "";
          existing.email = existing.email || v.email || "";
          if (!existing.roles.includes("vendor")) {
            existing.roles.push("vendor");
          }
          if (v.state || v.district || v.mandal) {
            existing.territory = {
              state: v.state || existing.territory?.state,
              district: v.district || existing.territory?.district,
              mandal: v.mandal || existing.territory?.mandal,
            };
          }
        } else {
          const vId = String(v._id);
          combinedMap.set(vId, {
            _id: v.userId ? String(v.userId) : vId,
            name: v.ownerName || v.businessName || "Vendor Partner",
            businessName: v.businessName || "",
            email: v.email || "",
            phone: v.mobile || v.whatsappNumber || "",
            roles: ["vendor"],
            territory: {
              state: v.state || "",
              district: v.district || "",
              mandal: v.mandal || "",
            },
          });
        }
      });

      // 3. Map and merge restaurants from food partner directory
      restList.forEach((r: any) => {
        const userId = r.userId?._id ? String(r.userId._id) : (r.userId ? String(r.userId) : null);
        if (userId && combinedMap.has(userId)) {
          const existing = combinedMap.get(userId)!;
          existing.businessName = r.restaurantName ? `🍽️ ${r.restaurantName}` : existing.businessName;
          existing.phone = existing.phone || r.phone || r.alternatePhone || "";
          existing.email = existing.email || r.email || "";
          if (!existing.roles.includes("food_partner")) {
            existing.roles.push("food_partner");
          }
          if (r.state || r.city || r.locality) {
            existing.territory = {
              state: r.state || existing.territory?.state,
              district: r.city || existing.territory?.district,
              mandal: r.locality || existing.territory?.mandal,
            };
          }
        } else {
          const rId = String(r._id);
          combinedMap.set(rId, {
            _id: userId || rId,
            name: r.restaurantName || r.legalBusinessName || "Food Partner",
            businessName: r.restaurantName ? `🍽️ ${r.restaurantName}` : "",
            email: r.email || "",
            phone: r.phone || r.alternatePhone || "",
            roles: ["food_partner"],
            territory: {
              state: r.state || "",
              district: r.city || "",
              mandal: r.locality || "",
            },
          });
        }
      });

      setUsers(Array.from(combinedMap.values()));
    } catch (err) {
      console.error("Error fetching users/vendors:", err);
    } finally {
      setUsersLoading(false);
    }
  };

  useEffect(() => {
    fetchCatalog();
    fetchInvoices();
    fetchUsers();
  }, [catalogCategory]);

  const handleUpdatePrice = async (item: PricingItem) => {
    try {
      setSavingId(item._id);
      const newAmount = editingItem[item._id];
      const res = await fetch(`${API_BASE}/admin/fee-pricing/catalog/${item._id}`, {
        method: "PUT",
        headers: getAuthHeader(),
        body: JSON.stringify({ amount: newAmount }),
      });
      const data = await res.json();
      if (data.success) {
        showToast(`Updated "${item.title}" to ₹${newAmount}. Portals synced!`);
        fetchCatalog();
      } else {
        showToast(data.message || "Failed to update price", "error");
      }
    } catch (err) {
      showToast("Network error updating price", "error");
    } finally {
      setSavingId(null);
    }
  };

  const handleGeneratePaymentLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser || !selectedService) {
      showToast("Please select a recipient user and service type", "error");
      return;
    }

    try {
      setIsGeneratingLink(true);
      const targetUser = users.find((u) => u._id === selectedUser);
      const recipientRole = targetUser?.roles?.includes("food_partner")
        ? "food_partner"
        : targetUser?.roles?.includes("franchise")
          ? "franchise"
          : "vendor";

      const res = await fetch(`${API_BASE}/admin/fee-pricing/send-payment-link`, {
        method: "POST",
        headers: getAuthHeader(),
        body: JSON.stringify({
          recipientUserId: selectedUser,
          recipientRole,
          serviceKey: selectedService,
          customAmount: customAmount ? Number(customAmount) : undefined,
          notes,
        }),
      });

      const data = await res.json();
      if (data.success) {
        showToast("Payment link generated and sent to vendor! Visible in vendor portal. Commissions will be settled upon payment.");
        setSelectedUser("");
        setCustomAmount("");
        setNotes("");
        fetchInvoices();
        setActiveTab("payment_links");
      } else {
        showToast(data.message || "Failed to generate link", "error");
      }
    } catch (err) {
      showToast("Error creating payment invoice", "error");
    } finally {
      setIsGeneratingLink(false);
    }
  };

  const handleMarkPaidManual = async (invoiceId: string) => {
    if (!window.confirm("Are you sure you want to mark this invoice as PAID? This will instantly distribute commissions to referral uplines and territory franchisers.")) {
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/admin/fee-pricing/mark-paid-manual`, {
        method: "POST",
        headers: getAuthHeader(),
        body: JSON.stringify({
          invoiceId,
          notes: "Manual confirmation by Super Admin",
        }),
      });

      const data = await res.json();
      if (data.success) {
        showToast("Invoice marked paid & Multi-tier commissions settled!");
        fetchInvoices();
      } else {
        showToast(data.message || "Failed to process manual settlement", "error");
      }
    } catch (err) {
      showToast("Error marking invoice paid", "error");
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedToken(id);
    setTimeout(() => setCopiedToken(null), 2500);
  };

  const filteredInvoices = invoices.filter((inv) => {
    const matchesSearch =
      inv.invoiceNumber.toLowerCase().includes(invoiceSearch.toLowerCase()) ||
      inv.recipientName.toLowerCase().includes(invoiceSearch.toLowerCase()) ||
      inv.title.toLowerCase().includes(invoiceSearch.toLowerCase());

    const matchesStatus = statusFilter === "all" || inv.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-8 pb-16">
      {/* Toast Notification */}
      {toastMessage && (
        <div
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5 rounded-xl shadow-2xl backdrop-blur-md border ${toastMessage.type === "success"
            ? "bg-emerald-950/90 border-emerald-500/40 text-emerald-200"
            : "bg-rose-950/90 border-rose-500/40 text-rose-200"
            } animate-slideUp`}
        >
          {toastMessage.type === "success" ? <CheckCircle2 className="w-5 h-5 text-emerald-400" /> : <AlertCircle className="w-5 h-5 text-rose-400" />}
          <span className="text-sm font-medium">{toastMessage.text}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-amber-600/20 via-orange-600/10 to-transparent p-8 border border-amber-500/20 backdrop-blur-xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                Centralized Fee & Pricing Control
              </span>
              <span className="flex items-center gap-1.5 text-xs text-emerald-400 font-medium bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Live Portal Sync
              </span>
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight text-white">
              Franchise & Vendor Pricing Manager
            </h1>
            <p className="text-muted-foreground text-sm mt-1 max-w-2xl">
              Control license fees, software subscriptions, and marketing packages. Updating fee amounts dynamically syncs in real-time with Franchise and Vendor Portals.
            </p>
          </div>

          {/* Tab Navigation */}
          <div className="flex items-center gap-2 bg-background/60 p-1.5 rounded-2xl border border-white/10 shadow-inner">
            <button
              onClick={() => setActiveTab("pricing_cards")}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all ${activeTab === "pricing_cards"
                ? "bg-amber-500 text-black shadow-lg shadow-amber-500/30"
                : "text-muted-foreground hover:text-white"
                }`}
            >
              <Tag className="w-4 h-4" />
              Fee Packages & Catalog
            </button>
            <button
              onClick={() => setActiveTab("payment_links")}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all ${activeTab === "payment_links"
                ? "bg-amber-500 text-black shadow-lg shadow-amber-500/30"
                : "text-muted-foreground hover:text-white"
                }`}
            >
              <CreditCard className="w-4 h-4" />
              Dynamic Invoices & Links ({invoices.length})
            </button>
            <button
              onClick={() => setActiveTab("commission_matrix")}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all ${activeTab === "commission_matrix"
                ? "bg-amber-500 text-black shadow-lg shadow-amber-500/30"
                : "text-muted-foreground hover:text-white"
                }`}
            >
              <Percent className="w-4 h-4" />
              Commission Split Matrix
            </button>
          </div>
        </div>
      </div>

      {/* TAB 1: PRICING CARDS & CATALOG */}
      {activeTab === "pricing_cards" && (
        <div className="space-y-6">
          {/* Filter Pills */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {(["all", "franchise", "vendor"] as const).map((cat) => (
                <button
                  key={cat}
                  onClick={() => setCatalogCategory(cat)}
                  className={`px-4 py-1.5 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all ${catalogCategory === cat
                    ? "bg-white/15 text-white border border-white/20 shadow"
                    : "text-muted-foreground hover:text-white hover:bg-white/5"
                    }`}
                >
                  {cat === "all" ? "All Fee Models" : `${cat} Pricing`}
                </button>
              ))}
            </div>
            <button
              onClick={fetchCatalog}
              className="flex items-center gap-2 text-xs text-muted-foreground hover:text-white px-3 py-1.5 rounded-lg border border-white/10 hover:border-white/20 transition-all"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
              Refresh Catalog
            </button>
          </div>

          {/* Pricing Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {catalog.map((item) => {
              const isFranchise = item.category === "franchise";
              return (
                <div
                  key={item._id}
                  className="relative group rounded-3xl bg-card/60 backdrop-blur-xl border border-white/10 hover:border-amber-500/40 p-6 flex flex-col justify-between transition-all duration-300 hover:shadow-2xl hover:shadow-amber-500/5"
                >
                  <div>
                    {/* Header */}
                    <div className="flex items-start justify-between gap-4 mb-4">
                      <div className="p-3 rounded-2xl bg-white/5 border border-white/10 text-amber-400">
                        {isFranchise ? <Building2 className="w-6 h-6" /> : <Store className="w-6 h-6" />}
                      </div>
                      <div className="flex flex-col items-end">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${isFranchise
                            ? "bg-amber-500/10 text-amber-400 border-amber-500/30"
                            : "bg-blue-500/10 text-blue-400 border-blue-500/30"
                            }`}
                        >
                          {item.category} • {item.billingCycle.replace("_", " ")}
                        </span>
                        <span className="text-[10px] text-muted-foreground mt-1">Tax: {item.taxPercentage}% GST</span>
                      </div>
                    </div>

                    <h3 className="text-lg font-bold text-white mb-2 leading-snug">{item.title}</h3>
                    <p className="text-xs text-muted-foreground mb-6 line-clamp-2">{item.description}</p>

                    {/* Price Input Controller */}
                    <div className="p-4 rounded-2xl bg-black/40 border border-white/10 mb-6 space-y-3">
                      <div className="flex items-center justify-between text-xs text-muted-foreground font-medium">
                        <span>Base Price (₹)</span>
                        <span className="text-[11px] text-amber-400 font-semibold">Active in Portals</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <div className="relative flex-1">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-bold text-sm">₹</span>
                          <input
                            type="number"
                            value={editingItem[item._id] ?? item.amount}
                            onChange={(e) =>
                              setEditingItem({
                                ...editingItem,
                                [item._id]: Number(e.target.value),
                              })
                            }
                            className="w-full bg-white/5 border border-white/10 rounded-xl pl-8 pr-3 py-2 text-white font-bold text-lg focus:outline-none focus:border-amber-500 transition-colors"
                          />
                        </div>

                        <button
                          onClick={() => handleUpdatePrice(item)}
                          disabled={savingId === item._id || editingItem[item._id] === item.amount}
                          className="px-4 py-2 bg-amber-500 hover:bg-amber-400 disabled:opacity-40 disabled:hover:bg-amber-500 text-black font-bold text-xs rounded-xl shadow transition-all flex items-center gap-1.5"
                        >
                          {savingId === item._id ? (
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Check className="w-3.5 h-3.5" />
                          )}
                          Save
                        </button>
                      </div>
                    </div>

                    {/* Features List */}
                    <div className="space-y-2">
                      <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                        Included Entitlements
                      </span>
                      <ul className="space-y-1.5">
                        {item.features.map((feat, idx) => (
                          <li key={idx} className="flex items-start gap-2 text-xs text-foreground/80">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 mt-0.5 shrink-0" />
                            <span>{feat}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* Footer metadata */}
                  <div className="pt-6 mt-6 border-t border-white/5 flex items-center justify-between text-[11px] text-muted-foreground">
                    <span>Key: <code className="text-amber-300 font-mono">{item.serviceKey}</code></span>
                    <button
                      onClick={() => {
                        setSelectedService(item.serviceKey);
                        setCustomAmount(String(item.amount));
                        setActiveTab("payment_links");
                      }}
                      className="text-amber-400 hover:text-amber-300 flex items-center gap-1 font-semibold"
                    >
                      Send Link <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 2: DYNAMIC INVOICES & PAYMENT LINKS */}
      {activeTab === "payment_links" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Link Generator Form */}
          <div className="lg:col-span-1 rounded-3xl bg-card/60 backdrop-blur-xl border border-white/10 p-6 space-y-6">
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Send className="w-5 h-5 text-amber-400" />
                Generate Payment Link
              </h3>
              <p className="text-xs text-muted-foreground mt-1">
                Dispatch an immediate dynamic invoice to any vendor or franchise applicant with automatic multi-tier commission distribution on checkout.
              </p>
            </div>

            {(() => {
              const targetUser = users.find((u) => u._id === selectedUser);
              const selectedCatalogItem = catalog.find((c) => c.serviceKey === selectedService);
              const baseAmountNumber = customAmount !== "" && !isNaN(Number(customAmount))
                ? Number(customAmount)
                : (selectedCatalogItem?.amount || 0);
              const taxRate = selectedCatalogItem?.taxPercentage ?? 18;
              const taxAmountNumber = Number(((baseAmountNumber * taxRate) / 100).toFixed(2));
              const totalAmountNumber = Number((baseAmountNumber + taxAmountNumber).toFixed(2));

              const filteredUsers = users.filter((u) => {
                const q = recipientSearch.toLowerCase().trim();
                const matchesSearch =
                  !q ||
                  u.name.toLowerCase().includes(q) ||
                  (u.businessName && u.businessName.toLowerCase().includes(q)) ||
                  (u.phone && u.phone.includes(q)) ||
                  (u.email && u.email.toLowerCase().includes(q));

                const matchesRole =
                  recipientRoleFilter === "all" ||
                  u.roles.includes(recipientRoleFilter) ||
                  (recipientRoleFilter === "vendor" && (u.roles.includes("vendor") || !!u.businessName)) ||
                  (recipientRoleFilter === "franchise" && (u.roles.includes("franchise") || u.roles.some((r) => r.includes("franchise"))));

                return matchesSearch && matchesRole;
              });

              return (
                <form onSubmit={handleGeneratePaymentLink} className="space-y-4">
                  {/* Recipient User Filter & Selector */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        Select Recipient (Vendor / Franchise) *
                      </label>
                      <span className="text-[10px] text-amber-400 font-medium">
                        {usersLoading ? "Loading partners..." : `${filteredUsers.length} available`}
                      </span>
                    </div>

                    {/* Quick Search & Role Filter */}
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <Search className="w-3.5 h-3.5 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          value={recipientSearch}
                          onChange={(e) => setRecipientSearch(e.target.value)}
                          placeholder="Search name, store, mobile..."
                          className="w-full bg-white/5 border border-white/10 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder:text-muted-foreground focus:outline-none focus:border-amber-500"
                        />
                      </div>
                      <select
                        value={recipientRoleFilter}
                        onChange={(e) => setRecipientRoleFilter(e.target.value)}
                        className="bg-white/5 border border-white/10 rounded-xl px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500"
                      >
                        <option value="all" className="bg-neutral-900">All Roles</option>
                        <option value="vendor" className="bg-neutral-900">Vendors Only</option>
                        <option value="food_partner" className="bg-neutral-900">Food Partners / Restaurants</option>
                        <option value="franchise" className="bg-neutral-900">Franchises Only</option>
                      </select>
                    </div>

                    <select
                      value={selectedUser}
                      onChange={(e) => setSelectedUser(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500"
                      required
                    >
                      <option value="" className="bg-neutral-900">
                        {usersLoading ? "-- Loading Partners from Server... --" : "-- Choose Partner / Applicant --"}
                      </option>
                      {filteredUsers.map((u) => {
                        const displayLabel = u.businessName
                          ? `${u.businessName} (${u.name}) • ${u.roles.join(", ")} - ${u.phone || u.email}`
                          : `${u.name} (${u.roles.join(", ")}) - ${u.phone || u.email}`;
                        return (
                          <option key={u._id} value={u._id} className="bg-neutral-900">
                            {displayLabel}
                          </option>
                        );
                      })}
                    </select>
                  </div>

                  {/* Selected Recipient Live Details Card */}
                  {targetUser && (
                    <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                          <Store className="w-3.5 h-3.5" /> Recipient Details
                        </span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 uppercase">
                          {targetUser.roles.join(", ")}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <p className="text-[10px] text-muted-foreground uppercase">Contact Person</p>
                          <p className="font-semibold text-white truncate">{targetUser.name}</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-muted-foreground uppercase">Store / Entity</p>
                          <p className="font-semibold text-amber-300 truncate">
                            {targetUser.businessName || "Registered Partner"}
                          </p>
                        </div>
                        <div>
                          <p className="text-[10px] text-muted-foreground uppercase">Mobile / Phone</p>
                          <p className="font-semibold text-white">{targetUser.phone || "No Phone"}</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-muted-foreground uppercase">Email</p>
                          <p className="font-semibold text-white truncate">{targetUser.email || "No Email"}</p>
                        </div>
                        {(targetUser.territory?.mandal || targetUser.territory?.district || targetUser.territory?.state) && (
                          <div className="col-span-2 pt-1.5 border-t border-amber-500/20 text-[11px] text-muted-foreground flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                            <span className="text-foreground">
                              Territory: {[targetUser.territory.mandal, targetUser.territory.district, targetUser.territory.state].filter(Boolean).join(", ")}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Service Fee Model */}
                  <div>
                    <label className="block text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wider">
                      Fee / Service Model *
                    </label>
                    <select
                      value={selectedService}
                      onChange={(e) => {
                        setSelectedService(e.target.value);
                        const item = catalog.find((c) => c.serviceKey === e.target.value);
                        if (item) setCustomAmount(String(item.amount));
                      }}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500"
                    >
                      {catalog.map((c) => (
                        <option key={c.serviceKey} value={c.serviceKey} className="bg-neutral-900">
                          {c.title} (Standard: ₹{c.amount})
                        </option>
                      ))}
                    </select>
                    {selectedCatalogItem && (
                      <p className="text-[11px] text-muted-foreground mt-1 line-clamp-2">
                        {selectedCatalogItem.description}
                      </p>
                    )}
                  </div>

                  {/* Custom Fee Amount Override */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        Base Fee Amount (₹) *
                      </label>
                      {selectedCatalogItem && (
                        <span className="text-[10px] text-amber-400">
                          Catalog standard: ₹{selectedCatalogItem.amount}
                        </span>
                      )}
                    </div>
                    <input
                      type="number"
                      value={customAmount}
                      onChange={(e) => setCustomAmount(e.target.value)}
                      placeholder={selectedCatalogItem ? String(selectedCatalogItem.amount) : "Enter amount"}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm font-semibold text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  {/* Real-time Pricing & Tax Breakdown Card */}
                  <div className="p-4 rounded-2xl bg-black/40 border border-white/10 space-y-3">
                    <div className="flex items-center justify-between text-xs text-muted-foreground font-semibold uppercase tracking-wider">
                      <span>Invoice Cost Summary</span>
                      <span className="text-amber-400 font-bold">GST {taxRate}%</span>
                    </div>

                    <div className="space-y-1.5 text-xs">
                      <div className="flex justify-between text-muted-foreground">
                        <span>Base Fee:</span>
                        <span className="font-semibold text-white">₹{baseAmountNumber.toLocaleString("en-IN")}</span>
                      </div>
                      <div className="flex justify-between text-muted-foreground">
                        <span>GST ({taxRate}%):</span>
                        <span className="font-semibold text-white">₹{taxAmountNumber.toLocaleString("en-IN")}</span>
                      </div>
                      <div className="flex justify-between text-sm font-bold text-emerald-400 pt-2 border-t border-white/10">
                        <span>Total Payable by Recipient:</span>
                        <span>₹{totalAmountNumber.toLocaleString("en-IN")}</span>
                      </div>
                    </div>

                    {/* Commission Split Preview */}
                    <div className="pt-2 border-t border-white/10 space-y-1.5 text-[11px]">
                      <div className="flex items-center justify-between text-muted-foreground">
                        <span className="font-semibold text-amber-300">Commission Distribution on Payment:</span>
                        <span className="text-white font-mono">Base: ₹{baseAmountNumber}</span>
                      </div>
                      <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-muted-foreground">
                        <span>• L1 Referral (10%): <strong className="text-emerald-400">₹{(baseAmountNumber * 0.1).toFixed(2)}</strong></span>
                        <span>• Mandal Fran. (10%): <strong className="text-blue-400">₹{(baseAmountNumber * 0.1).toFixed(2)}</strong></span>
                        <span>• L2 Referral (3%): <strong className="text-emerald-400">₹{(baseAmountNumber * 0.03).toFixed(2)}</strong></span>
                        <span>• District Fran. (5%): <strong className="text-blue-400">₹{(baseAmountNumber * 0.05).toFixed(2)}</strong></span>
                        <span>• L3 Referral (2%): <strong className="text-emerald-400">₹{(baseAmountNumber * 0.02).toFixed(2)}</strong></span>
                        <span>• State Fran. (3%): <strong className="text-blue-400">₹{(baseAmountNumber * 0.03).toFixed(2)}</strong></span>
                      </div>
                      <p className="text-[10px] text-amber-400/80 italic mt-1">
                        Note: Commissions will be distributed only after the vendor pays this link.
                      </p>
                    </div>
                  </div>

                  {/* Notes */}
                  <div>
                    <label className="block text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wider">
                      Invoice Notes & Terms
                    </label>
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      rows={2}
                      placeholder="e.g. Special promotional rate for Q4 on-boarding"
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-amber-500 resize-none"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isGeneratingLink || !selectedUser}
                    className="w-full py-3 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 disabled:opacity-50 disabled:cursor-not-allowed text-black font-bold text-sm rounded-xl shadow-lg shadow-amber-500/25 transition-all flex items-center justify-center gap-2"
                  >
                    {isGeneratingLink ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                    Generate & Dispatch Payment Link
                  </button>
                </form>
              );
            })()}
          </div>

          {/* Right Column: Invoices & Payment Links Table */}
          <div className="lg:col-span-2 rounded-3xl bg-card/60 backdrop-blur-xl border border-white/10 p-6 flex flex-col justify-between">
            <div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div>
                  <h3 className="text-lg font-bold text-white">Active Payment Links & Invoices</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">Real-time status tracking of dispatched fee links.</p>
                </div>

                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={invoiceSearch}
                      onChange={(e) => setInvoiceSearch(e.target.value)}
                      placeholder="Search invoice or name..."
                      className="bg-white/5 border border-white/10 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder:text-muted-foreground focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="bg-white/5 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500"
                  >
                    <option value="all" className="bg-neutral-900">All Status</option>
                    <option value="pending" className="bg-neutral-900">Pending</option>
                    <option value="paid" className="bg-neutral-900">Paid & Settled</option>
                  </select>
                </div>
              </div>

              {/* Invoices List */}
              <div className="space-y-3 overflow-y-auto max-h-[560px] pr-1">
                {filteredInvoices.length === 0 ? (
                  <div className="p-12 text-center text-muted-foreground border border-dashed border-white/10 rounded-2xl">
                    <CreditCard className="w-8 h-8 mx-auto mb-2 opacity-40" />
                    <p className="text-sm">No invoices found matching criteria.</p>
                  </div>
                ) : (
                  filteredInvoices.map((inv) => (
                    <div
                      key={inv._id}
                      className="p-4 rounded-2xl bg-white/[0.03] border border-white/5 hover:border-white/15 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs text-amber-400 font-bold">{inv.invoiceNumber}</span>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border ${inv.status === "paid"
                              ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                              : "bg-amber-500/10 text-amber-400 border-amber-500/30"
                              }`}
                          >
                            {inv.status}
                          </span>
                          {inv.commissionSettled && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/10 text-blue-400 border border-blue-500/30 flex items-center gap-1">
                              <Check className="w-2.5 h-2.5" /> Commission Settled
                            </span>
                          )}
                        </div>

                        <h4 className="text-sm font-semibold text-white">{inv.title}</h4>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          <span>To: <strong className="text-foreground">{inv.recipientName}</strong> ({inv.recipientRole})</span>
                          <span>•</span>
                          <span>Amount: <strong className="text-white">₹{inv.totalAmount}</strong> (Incl. Tax)</span>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2 shrink-0">
                        {inv.status === "pending" && (
                          <button
                            onClick={() => handleMarkPaidManual(inv._id)}
                            className="px-3 py-1.5 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 text-xs font-semibold rounded-xl transition-all flex items-center gap-1.5"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Verify & Settle
                          </button>
                        )}

                        <button
                          onClick={() => copyToClipboard(`https://apexbee.in/pay/${inv.paymentLinkToken}`, inv._id)}
                          className="px-3 py-1.5 bg-white/5 hover:bg-white/10 text-muted-foreground hover:text-white border border-white/10 text-xs font-semibold rounded-xl transition-all flex items-center gap-1.5"
                        >
                          {copiedToken === inv._id ? (
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                          {copiedToken === inv._id ? "Copied Link" : "Copy Link"}
                        </button>

                        <a
                          href={`https://apexbee.in/pay/${inv.paymentLinkToken}`}
                          target="_blank"
                          rel="noreferrer"
                          className="p-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-muted-foreground hover:text-white border border-white/10"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-white/5 text-[11px] text-muted-foreground flex items-center justify-between">
              <span>Showing {filteredInvoices.length} of {invoices.length} total payment invoices</span>
              <span>All payments automatically trigger multi-tier commission splits</span>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: COMMISSION MATRIX */}
      {activeTab === "commission_matrix" && (
        <div className="space-y-6">
          <div className="rounded-3xl bg-card/60 backdrop-blur-xl border border-white/10 p-8 space-y-6">
            <div>
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <Percent className="w-6 h-6 text-amber-400" />
                Automated Commission Distribution Rules
              </h3>
              <p className="text-sm text-muted-foreground mt-1">
                Whenever a Franchise license fee or Vendor software/marketing package is paid, the system automatically splits and credits the fee across referral tiers and territory franchisers.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Mandal Franchise Assign */}
              <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/10 space-y-4">
                <div className="flex items-center justify-between border-b border-white/10 pb-3">
                  <h4 className="font-bold text-amber-400 text-base">1. Mandal Franchiser Assignment Fee</h4>
                  <span className="text-xs text-muted-foreground">Fee Trigger</span>
                </div>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between py-1 border-b border-white/5"><span className="text-muted-foreground">Level 1 (Direct Sponsor):</span><span className="font-bold text-emerald-400">10%</span></div>
                  <div className="flex justify-between py-1 border-b border-white/5"><span className="text-muted-foreground">Level 2 (2nd Upline):</span><span className="font-bold text-emerald-400">3%</span></div>
                  <div className="flex justify-between py-1 border-b border-white/5"><span className="text-muted-foreground">Level 3 (3rd Upline):</span><span className="font-bold text-emerald-400">2%</span></div>
                  <div className="flex justify-between py-1 border-b border-white/5"><span className="text-muted-foreground">District Franchiser (Parent District):</span><span className="font-bold text-blue-400">10%</span></div>
                  <div className="flex justify-between py-1 border-b border-white/5"><span className="text-muted-foreground">State Franchiser (Parent State):</span><span className="font-bold text-blue-400">5%</span></div>
                  <div className="flex justify-between py-1 pt-2"><span className="text-muted-foreground font-semibold">Apexbee Platform Pool:</span><span className="font-bold text-white">70%</span></div>
                </div>
              </div>

              {/* District Franchise Assign */}
              <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/10 space-y-4">
                <div className="flex items-center justify-between border-b border-white/10 pb-3">
                  <h4 className="font-bold text-amber-400 text-base">2. District Franchiser Assignment Fee</h4>
                  <span className="text-xs text-muted-foreground">Fee Trigger</span>
                </div>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between py-1 border-b border-white/5"><span className="text-muted-foreground">Level 1 (Direct Sponsor):</span><span className="font-bold text-emerald-400">15%</span></div>
                  <div className="flex justify-between py-1 border-b border-white/5"><span className="text-muted-foreground">Level 2 (2nd Upline):</span><span className="font-bold text-emerald-400">3%</span></div>
                  <div className="flex justify-between py-1 border-b border-white/5"><span className="text-muted-foreground">Level 3 (3rd Upline):</span><span className="font-bold text-emerald-400">2%</span></div>
                  <div className="flex justify-between py-1 border-b border-white/5"><span className="text-muted-foreground">State Franchiser (Parent State):</span><span className="font-bold text-blue-400">10%</span></div>
                  <div className="flex justify-between py-1 pt-2"><span className="text-muted-foreground font-semibold">Apexbee Platform Pool:</span><span className="font-bold text-white">70%</span></div>
                </div>
              </div>

              {/* State Franchise Assign */}
              <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/10 space-y-4">
                <div className="flex items-center justify-between border-b border-white/10 pb-3">
                  <h4 className="font-bold text-amber-400 text-base">3. State Master Franchiser Assignment Fee</h4>
                  <span className="text-xs text-muted-foreground">Fee Trigger</span>
                </div>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between py-1 border-b border-white/5"><span className="text-muted-foreground">Level 1 (Direct Sponsor):</span><span className="font-bold text-emerald-400">15%</span></div>
                  <div className="flex justify-between py-1 border-b border-white/5"><span className="text-muted-foreground">Level 2 (2nd Upline):</span><span className="font-bold text-emerald-400">3%</span></div>
                  <div className="flex justify-between py-1 border-b border-white/5"><span className="text-muted-foreground">Level 3 (3rd Upline):</span><span className="font-bold text-emerald-400">2%</span></div>
                  <div className="flex justify-between py-1 pt-2"><span className="text-muted-foreground font-semibold">Apexbee Platform Pool:</span><span className="font-bold text-white">80%</span></div>
                </div>
              </div>

              {/* Vendor Enrollment & VAS Services */}
              <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/10 space-y-4">
                <div className="flex items-center justify-between border-b border-white/10 pb-3">
                  <h4 className="font-bold text-amber-400 text-base">4. Vendor Enrollment & Software Services</h4>
                  <span className="text-xs text-muted-foreground">Fee Trigger</span>
                </div>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between py-1 border-b border-white/5"><span className="text-muted-foreground">Level 1 (Direct Sponsor):</span><span className="font-bold text-emerald-400">10%</span></div>
                  <div className="flex justify-between py-1 border-b border-white/5"><span className="text-muted-foreground">Level 2 (2nd Upline):</span><span className="font-bold text-emerald-400">3%</span></div>
                  <div className="flex justify-between py-1 border-b border-white/5"><span className="text-muted-foreground">Level 3 (3rd Upline):</span><span className="font-bold text-emerald-400">2%</span></div>
                  <div className="flex justify-between py-1 border-b border-white/5"><span className="text-muted-foreground">Mandal Franchiser (Local Territory):</span><span className="font-bold text-blue-400">10%</span></div>
                  <div className="flex justify-between py-1 border-b border-white/5"><span className="text-muted-foreground">District Franchiser (Parent District):</span><span className="font-bold text-blue-400">5%</span></div>
                  <div className="flex justify-between py-1 border-b border-white/5"><span className="text-muted-foreground">State Franchiser (Parent State):</span><span className="font-bold text-blue-400">3%</span></div>
                  <div className="flex justify-between py-1 pt-2"><span className="text-muted-foreground font-semibold">Apexbee Platform Pool:</span><span className="font-bold text-white">67%</span></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
