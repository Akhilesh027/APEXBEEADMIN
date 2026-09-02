import React, { useEffect, useMemo, useState } from "react";
import {
  CheckCircle2,
  MapPin,
  Users,
  XCircle,
  Eye,
  Search,
  Building2,
  Phone,
  Mail,
  ShieldCheck,
  CreditCard,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Network,
  Store,
  Boxes,
  Clock,
  Briefcase
} from "lucide-react";

interface FranchiseBankDetails {
  accountHolderName?: string;
  accountNumber?: string;
  ifsc?: string;
  bankName?: string;
  upiId?: string;
}

interface FranchiseSecurityDeposit {
  amountPaid?: number;
  paidAt?: string;
  status?: "COMPLETED" | "PARTIAL";
  paymentReference?: string;
}

interface Franchise {
  [key: string]: any;
  _id: string;
  userId?: any;
  franchiseCode?: string;
  referenceId?: string;
  franchiseLevel?: "state" | "district" | "mandal";
  businessName?: string;
  ownerName?: string;
  mobile?: string;
  email?: string;
  profilePhoto?: string;
  state?: string;
  district?: string;
  mandal?: string;
  village?: string;
  pincode?: string;
  address?: string;
  status?: string;
  kycStatus?: string;
  assignedTerritories?: any[];
  bankDetails?: FranchiseBankDetails;
  securityDeposit?: FranchiseSecurityDeposit;
  allApplications?: any[];
  applicationDetails?: {
    [key: string]: any;
    _id?: string;
    applicationType?: string;
    roleId?: string;
    status?: string;
    businessName?: string;
    category?: string;
    primaryCategory?: string;
    subCategory?: string;
    approvedSubcategories?: string[];
    restaurantName?: string;
    foodBusinessType?: string;
    fssaiNumber?: string;
    cuisines?: string[];
    foodPreference?: string;
    serviceType?: string;
    sampleVideoLink?: string;
    vehicleType?: string;
    licenseNumber?: string;
    experience?: string;
    investmentCapacity?: string;
    expectedSales?: string;
    documents?: Record<string, string>;
    panNumber?: string;
    aadhaarNumber?: string;
    gstNumber?: string;
    address?: string;
    remarks?: string;
    createdAt?: string;
  } | null;
  territoryDetails?: {
    [key: string]: any;
    _id?: string;
    ftid?: string;
    name?: string;
    level?: string;
    state?: string;
    district?: string;
    mandal?: string;
    annualFranchiseFee?: number;
    franchiseFeePerYear?: number;
    minBookingAdvance?: number;
    paymentStatus?: string;
    paymentDetails?: {
      razorpayPaymentId?: string;
      razorpayOrderId?: string;
      amountPaid?: number;
      paymentType?: string;
      paidAt?: string;
    };
  } | null;
  totalVendors?: number;
  totalManufacturers?: number;
  totalWholesalers?: number;
  totalServiceProviders?: number;
  totalCourseProviders?: number;
  totalEntrepreneurs?: number;
  createdAt?: string;
  approvedAt?: string;
}

interface Territory {
  _id: string;
  ftid?: string;
  codeNumber?: string;
  level?: "State" | "District" | "Mandal" | "Village" | "Pincode";
  name?: string;
  state: string;
  district?: string;
  mandal?: string;
  village?: string;
  pincode?: string;
  franchiseId?: any;
  status?: string;
  density?: string;
  targetCoverage?: string;
}

const API = "https://server.apexbee.in/api/admin";

export const FranchiseManagement: React.FC = () => {
  const [franchises, setFranchises] = useState<Franchise[]>([]);
  const [territories, setTerritories] = useState<Territory[]>([]);
  const [selectedFranchiseId, setSelectedFranchiseId] = useState("");
  const [selectedTerritoryId, setSelectedTerritoryId] = useState("");
  const [inspectFranchise, setInspectFranchise] = useState<Franchise | null>(null);
  const [inspectWaitlistApp, setInspectWaitlistApp] = useState<any | null>(null);
  const [applications, setApplications] = useState<any[]>([]);
  const [activeMainTab, setActiveMainTab] = useState<"franchises" | "waitlist">("franchises");
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  // Fee and Balance clearance adjustment state
  const [editingFeeModal, setEditingFeeModal] = useState<Franchise | null>(null);
  const [customAnnualFee, setCustomAnnualFee] = useState<number>(60000);
  const [customAmountPaid, setCustomAmountPaid] = useState<number>(20000);
  const [customIsCompleted, setCustomIsCompleted] = useState<boolean>(false);

  // Filters & Search State
  const [search, setSearch] = useState("");
  const [levelFilter, setLevelFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  const token = localStorage.getItem("adminToken");

  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  const normalize = (value?: string) => (value || "").trim().toLowerCase();

  const [copiedFtid, setCopiedFtid] = useState<string | null>(null);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedFtid(text);
    setTimeout(() => setCopiedFtid(null), 2000);
  };

  const getFranchiseFTIDs = (f: Franchise) => {
    return territories.filter((t) => {
      const fId = typeof t.franchiseId === "object" ? t.franchiseId?._id : t.franchiseId;
      return String(fId) === String(f._id);
    });
  };

  const getTerritoryLevel = (t: any) => {
    if (t.level) return t.level;
    if (t.village) return "Village";
    if (t.mandal) return "Mandal";
    if (t.district) return "District";
    return "State";
  };

  const getTerritoryName = (t: any) => {
    if (t.name) return t.name;
    if (t.village) return t.village;
    if (t.mandal) return t.mandal;
    if (t.district) return t.district;
    return t.state;
  };

  const getTerritoryDisplay = (t: any) => {
    const level = getTerritoryLevel(t);
    const name = getTerritoryName(t);
    const ftid = t.ftid ? `[${t.ftid}] ` : "";
    const path = [t.state, t.district, t.mandal, t.village].filter(Boolean);

    return `${ftid}${level} - ${name}${path.length ? ` (${path.join(" / ")})` : ""}`;
  };

  const getFranchiseDisplay = (f: Franchise) => {
    const code = f.franchiseCode ? ` [${f.franchiseCode}]` : "";
    const master = f.userId ? ` (ID: ${String(f.userId).slice(-6)})` : "";
    return `${f.businessName || f.ownerName || f.email || "Franchise"}${code}${master}`;
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      setErrorMsg("");

      const [franchiseRes, territoryRes, appRes] = await Promise.all([
        fetch(`${API}/franchises`, { headers }),
        fetch(`${API}/territories`, { headers }),
        fetch(`${API}/applications`, { headers }),
      ]);

      const franchiseData = await franchiseRes.json();
      const territoryData = await territoryRes.json();
      const appData = await appRes.json();

      if (!franchiseRes.ok) {
        throw new Error(franchiseData.message || "Failed to fetch franchises");
      }

      if (!territoryRes.ok) {
        throw new Error(territoryData.message || "Failed to fetch territories");
      }

      setFranchises(Array.isArray(franchiseData.franchises) ? franchiseData.franchises : []);
      setTerritories(Array.isArray(territoryData.territories) ? territoryData.territories : []);
      setApplications(Array.isArray(appData.applications) ? appData.applications : []);
    } catch (error: any) {
      setErrorMsg(error.message || "Backend fetch failed");
      setFranchises([]);
      setTerritories([]);
      setApplications([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const selectedFranchise = franchises.find((f) => f._id === selectedFranchiseId);

  const matchingTerritories = useMemo(() => {
    if (!selectedFranchise) return [];

    return territories.filter((t) => {
      const territoryLevel = getTerritoryLevel(t);

      if (selectedFranchise.franchiseLevel === "state") {
        return (
          territoryLevel === "State" &&
          normalize(t.state) === normalize(selectedFranchise.state)
        );
      }

      if (selectedFranchise.franchiseLevel === "district") {
        return (
          territoryLevel === "District" &&
          normalize(t.state) === normalize(selectedFranchise.state) &&
          normalize(t.district) === normalize(selectedFranchise.district)
        );
      }

      if (selectedFranchise.franchiseLevel === "mandal") {
        return (
          territoryLevel === "Mandal" &&
          normalize(t.state) === normalize(selectedFranchise.state) &&
          normalize(t.district) === normalize(selectedFranchise.district) &&
          normalize(t.mandal) === normalize(selectedFranchise.mandal)
        );
      }

      return false;
    });
  }, [selectedFranchise, territories]);

  const assignTerritory = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedFranchiseId) return alert("Select franchise");
    if (!selectedTerritoryId) return alert("Select matching territory");

    const res = await fetch(`${API}/territories/${selectedTerritoryId}/assign`, {
      method: "PUT",
      headers,
      body: JSON.stringify({
        franchiseId: selectedFranchiseId,
      }),
    });

    const data = await res.json();

    if (res.ok && data.success) {
      setSuccessMsg("Territory assigned successfully");
      setSelectedTerritoryId("");
      await fetchData();
    } else {
      alert(data.message || "Assignment failed");
    }
  };

  const handleUpdateStatus = async (id: string, newStatus: string, newKycStatus?: string) => {
    try {
      setUpdating(true);
      const res = await fetch(`${API}/franchises/${id}/status`, {
        method: "PATCH",
        headers,
        body: JSON.stringify({
          status: newStatus,
          kycStatus: newKycStatus || (newStatus === "active" ? "Approved" : "Pending Verification")
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to update franchise status");
      }

      setSuccessMsg(`Franchise status updated to ${newStatus.toUpperCase()}`);
      if (inspectFranchise && inspectFranchise._id === id) {
        setInspectFranchise(data.franchise || { ...inspectFranchise, status: newStatus });
      }
      await fetchData();
    } catch (err: any) {
      alert(`⚠️ ${err.message}`);
    } finally {
      setUpdating(false);
    }
  };

  const handleUpdatePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingFeeModal) return;
    setUpdating(true);
    try {
      const res = await fetch(`${API}/franchises/${editingFeeModal._id}/payment`, {
        method: "PATCH",
        headers,
        body: JSON.stringify({
          annualFee: Number(customAnnualFee),
          amountPaid: Number(customAmountPaid),
          isCompleted: customIsCompleted,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to update payment");
      setSuccessMsg("Franchise fee and payment clearance updated successfully");
      setEditingFeeModal(null);
      await fetchData();
      if (inspectFranchise && inspectFranchise._id === editingFeeModal._id) {
        setInspectFranchise((prev: any) => ({
          ...prev,
          securityDeposit: {
            ...prev?.securityDeposit,
            amountPaid: Number(customAmountPaid),
            status: customIsCompleted ? "COMPLETED" : "PARTIAL",
          },
          territoryDetails: {
            ...prev?.territoryDetails,
            annualFranchiseFee: Number(customAnnualFee),
            paymentStatus: customIsCompleted ? "PAID_FULL" : prev?.territoryDetails?.paymentStatus,
          },
        }));
      }
    } catch (err: any) {
      alert(`⚠️ ${err.message}`);
    } finally {
      setUpdating(false);
    }
  };

  // Filtered & Paginated Franchises List
  const filteredFranchises = useMemo(() => {
    return franchises.filter((f) => {
      const query = search.toLowerCase().trim();
      const matchesSearch =
        !query ||
        (f.businessName || "").toLowerCase().includes(query) ||
        (f.ownerName || "").toLowerCase().includes(query) ||
        (f.franchiseCode || "").toLowerCase().includes(query) ||
        (f.mobile || "").toLowerCase().includes(query) ||
        (f.district || "").toLowerCase().includes(query) ||
        (f.mandal || "").toLowerCase().includes(query);

      const matchesLevel =
        levelFilter === "All" ||
        (f.franchiseLevel || "").toLowerCase() === levelFilter.toLowerCase();

      const matchesStatus =
        statusFilter === "All" ||
        (statusFilter === "Active" && (f.status === "active" || f.kycStatus === "Approved")) ||
        (statusFilter === "Pending" && (f.status === "pending_verification" || f.kycStatus !== "Approved"));

      return matchesSearch && matchesLevel && matchesStatus;
    });
  }, [franchises, search, levelFilter, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredFranchises.length / pageSize));
  const paginatedFranchises = useMemo(() => {
    return filteredFranchises.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  }, [filteredFranchises, currentPage, pageSize]);

  const waitlistedApplications = useMemo(() => {
    return applications.filter((a: any) => {
      const isFranchise = (a.applicationType || a.roleId || "").toLowerCase().includes("franchise");
      const isExplicitWaitlist = a.isWaitlisted || a.status === "waitlist" || a.status === "pending";
      const matchesSearch =
        !search ||
        (a.businessName || "").toLowerCase().includes(search.toLowerCase()) ||
        (a.ownerName || "").toLowerCase().includes(search.toLowerCase()) ||
        (a.mobile || "").toLowerCase().includes(search.toLowerCase()) ||
        (a.email || "").toLowerCase().includes(search.toLowerCase()) ||
        (a.state || "").toLowerCase().includes(search.toLowerCase()) ||
        (a.district || "").toLowerCase().includes(search.toLowerCase()) ||
        (a.mandal || "").toLowerCase().includes(search.toLowerCase());

      return (isExplicitWaitlist || isFranchise) && matchesSearch;
    });
  }, [applications, search]);

  if (loading) {
    return (
      <div className="bg-card border border-border/80 rounded-2xl p-12 text-center text-xs text-muted-foreground flex flex-col items-center justify-center gap-3">
        <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
        <span>Loading backend franchise registry data...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-card border border-border/80 rounded-2xl p-5 shadow-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl font-black text-foreground tracking-tight flex items-center gap-2">
            <span>🏛️ Franchise Network &amp; Territory CRM</span>
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Manage active franchise partners, inspect detailed fee/booking payments, and review waitlist forms for next opportunity expansion.
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs font-bold bg-secondary/30 border border-border/60 px-3.5 py-2 rounded-xl">
          <Building2 size={16} className="text-primary" />
          <span>Active Franchises: <strong className="text-foreground">{franchises.length}</strong></span>
        </div>
      </div>

      {/* TOP NAVIGATION TABS */}
      <div className="flex items-center gap-2 border-b border-border/80 pb-3">
        <button
          onClick={() => setActiveMainTab("franchises")}
          className={`px-4 py-2 rounded-xl text-xs font-black transition cursor-pointer flex items-center gap-2 ${activeMainTab === "franchises"
            ? "bg-primary text-primary-foreground shadow-xs"
            : "bg-card text-muted-foreground hover:text-foreground border border-border"
            }`}
        >
          <Building2 size={14} />
          <span>Active &amp; Pending Franchises ({franchises.length})</span>
        </button>

        <button
          onClick={() => setActiveMainTab("waitlist")}
          className={`px-4 py-2 rounded-xl text-xs font-black transition cursor-pointer flex items-center gap-2 ${activeMainTab === "waitlist"
            ? "bg-amber-500 text-slate-950 font-black shadow-xs ring-2 ring-amber-400/40"
            : "bg-card text-muted-foreground hover:text-foreground border border-border"
            }`}
        >
          <Clock size={14} className={activeMainTab === "waitlist" ? "text-slate-950" : "text-amber-500"} />
          <span>Next Opportunity &amp; Expansion Waitlist ({waitlistedApplications.length})</span>
          {waitlistedApplications.length > 0 && (
            <span className="px-1.5 py-0.5 rounded-full bg-amber-400 text-slate-950 text-[9px] font-black">
              {waitlistedApplications.length} NEW
            </span>
          )}
        </button>
      </div>

      {successMsg && (
        <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 rounded-xl flex items-center justify-between text-xs font-semibold">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={16} />
            <span>{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg("")} className="text-xs opacity-75 hover:opacity-100 cursor-pointer">✕</button>
        </div>
      )}

      {errorMsg && (
        <div className="p-3.5 bg-red-500/10 border border-red-500/20 text-red-500 rounded-xl text-xs font-semibold">
          {errorMsg}
        </div>
      )}

      {/* Territory Assignment Section */}
      <div className="bg-card border border-border/80 rounded-2xl p-5 shadow-xs">
        <div className="flex items-center gap-2 border-b border-border pb-3 mb-4">
          <Users className="text-primary" size={18} />
          <h3 className="text-xs font-bold uppercase tracking-wider">
            Franchise Territory Assignment
          </h3>
        </div>

        <form onSubmit={assignTerritory} className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <select
            value={selectedFranchiseId}
            onChange={(e) => {
              setSelectedFranchiseId(e.target.value);
              setSelectedTerritoryId("");
              setSuccessMsg("");
            }}
            className="p-2.5 border border-border rounded-xl bg-secondary/15 font-semibold text-foreground"
          >
            <option value="">Select Franchise</option>
            {franchises.map((f) => (
              <option key={f._id} value={f._id}>
                {getFranchiseDisplay(f)} - {f.franchiseLevel}
              </option>
            ))}
          </select>

          <select
            value={selectedTerritoryId}
            onChange={(e) => setSelectedTerritoryId(e.target.value)}
            disabled={!selectedFranchiseId}
            className="p-2.5 border border-border rounded-xl bg-secondary/15 font-semibold text-foreground disabled:opacity-50"
          >
            <option value="">
              {!selectedFranchiseId
                ? "Select franchise first"
                : matchingTerritories.length === 0
                  ? "No matching territory found"
                  : "Select matching territory"}
            </option>

            {matchingTerritories.map((t) => (
              <option key={t._id} value={t._id}>
                {getTerritoryDisplay(t)}
              </option>
            ))}
          </select>

          <button
            type="submit"
            className="py-2.5 bg-primary text-primary-foreground rounded-xl font-bold cursor-pointer hover:bg-primary/90 shadow-xs transition"
          >
            Assign Territory
          </button>
        </form>

        {selectedFranchise && (
          <div className="mt-4 p-3 rounded-xl bg-secondary/20 border border-border/60 text-[11px] text-muted-foreground flex flex-wrap items-center gap-2">
            <span>Selected Franchise:</span>
            <span className="font-bold text-foreground">{getFranchiseDisplay(selectedFranchise)}</span>
            <span>| Level:</span>
            <span className="font-bold text-foreground capitalize">{selectedFranchise.franchiseLevel}</span>
            <span>| Location:</span>
            <span className="font-bold text-foreground">
              {[selectedFranchise.state, selectedFranchise.district, selectedFranchise.mandal]
                .filter(Boolean)
                .join(" / ")}
            </span>
          </div>
        )}
      </div>

      {/* SEARCH & FILTERS BAR */}
      <div className="bg-card border border-border/80 rounded-2xl p-4 space-y-3 shadow-xs">
        <div className="flex flex-col md:flex-row gap-3 justify-between items-center">
          <div className="relative w-full md:w-80">
            <Search size={15} className="absolute left-3 top-2.5 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search business, owner, code, district..."
              className="w-full pl-9 pr-3 py-2 rounded-xl border border-border/80 bg-secondary/20 text-xs font-semibold outline-none focus:border-primary"
            />
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end">
            <span className="text-xs text-muted-foreground font-semibold">
              Showing <b className="text-foreground">{filteredFranchises.length}</b> of <b className="text-foreground">{franchises.length}</b> franchises
            </span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-border/60">
          <span className="text-[10px] font-black text-muted-foreground uppercase tracking-wider mr-2">Level:</span>
          {["All", "state", "district", "mandal"].map((lvl) => (
            <button
              key={lvl}
              onClick={() => {
                setLevelFilter(lvl);
                setCurrentPage(1);
              }}
              className={`px-3 py-1 rounded-xl text-xs font-bold border transition cursor-pointer capitalize ${levelFilter === lvl
                ? "bg-primary text-primary-foreground border-primary shadow-xs"
                : "bg-card text-muted-foreground border-border hover:bg-secondary/40"
                }`}
            >
              {lvl === "All" ? "All Levels" : `${lvl} Franchise`}
            </button>
          ))}

          <span className="text-[10px] font-black text-muted-foreground uppercase tracking-wider ml-4 mr-2">Status:</span>
          {["All", "Active", "Pending"].map((st) => (
            <button
              key={st}
              onClick={() => {
                setStatusFilter(st);
                setCurrentPage(1);
              }}
              className={`px-3 py-1 rounded-xl text-xs font-bold border transition cursor-pointer ${statusFilter === st
                ? "bg-foreground text-background border-foreground font-black"
                : "bg-card text-muted-foreground border-border hover:bg-secondary/40"
                }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* CONDITIONALLY RENDER: WAITLIST TABLE OR FRANCHISE DIRECTORY */}
      {activeMainTab === "waitlist" ? (
        <div className="bg-card border border-border/80 rounded-2xl overflow-hidden shadow-xs space-y-4">
          <div className="px-5 py-4 border-b border-border/60 bg-amber-500/10 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Clock size={16} className="text-amber-600" />
              <span className="text-xs font-black uppercase tracking-wider text-amber-900">
                Next Opportunity &amp; Expansion Waitlist Ledger ({waitlistedApplications.length} Applicants)
              </span>
            </div>
            <span className="text-[11px] font-bold text-amber-800">
              Submitted when territory was already allocated
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-secondary/40 text-muted-foreground font-bold">
                <tr>
                  <th className="p-3.5">Applicant &amp; Contact</th>
                  <th className="p-3.5">Target Territory Jurisdiction</th>
                  <th className="p-3.5">Franchise Level</th>
                  <th className="p-3.5">Investment &amp; Experience</th>
                  <th className="p-3.5">Waitlist Target FTID</th>
                  <th className="p-3.5">Submitted On</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5 text-right">Action</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-border">
                {waitlistedApplications.map((app) => (
                  <tr key={app._id} className="hover:bg-secondary/15 transition">
                    {/* Applicant & Contact */}
                    <td className="p-3.5">
                      <div className="font-extrabold text-foreground">{app.businessName || app.ownerName || app.name || "Franchise Applicant"}</div>
                      <div className="text-[10px] text-muted-foreground">Owner: {app.ownerName || app.name || "-"} ({app.mobile || "-"})</div>
                      {app.email && <div className="text-[10px] text-muted-foreground font-mono">{app.email}</div>}
                    </td>

                    {/* Target Territory Jurisdiction */}
                    <td className="p-3.5">
                      <div className="font-bold text-foreground">
                        {[app.state, app.district, app.mandal].filter(Boolean).join(" ➔ ") || "Regional Territory"}
                      </div>
                      {app.pincode && (
                        <div className="text-[10px] text-muted-foreground font-mono">Pincode: {app.pincode}</div>
                      )}
                    </td>

                    {/* Franchise Level */}
                    <td className="p-3.5">
                      <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider border inline-block ${app.franchiseLevel === "state"
                        ? "bg-purple-500/10 text-purple-600 border-purple-500/20"
                        : app.franchiseLevel === "district"
                          ? "bg-blue-500/10 text-blue-600 border-blue-500/20"
                          : "bg-amber-500/10 text-amber-600 border-amber-500/20"
                        }`}>
                        {app.franchiseLevel || "Mandal"}
                      </span>
                    </td>

                    {/* Investment & Experience */}
                    <td className="p-3.5">
                      <div className="font-semibold text-emerald-600 text-xs">{app.investmentCapacity || "Ready for allocation"}</div>
                      <div className="text-[10px] text-muted-foreground truncate max-w-[150px]">
                        Exp: {app.experience || "Fresh Applicant"}
                      </div>
                    </td>

                    {/* Target FTID */}
                    <td className="p-3.5">
                      <span className="inline-flex items-center gap-1 bg-secondary/50 border border-border text-foreground px-2 py-0.5 rounded font-mono font-bold text-[10px]">
                        {app.waitlistTerritoryFtid || "Next Vacancy"}
                      </span>
                    </td>

                    {/* Submitted Date */}
                    <td className="p-3.5 text-muted-foreground font-mono text-[11px]">
                      {app.createdAt ? new Date(app.createdAt).toLocaleDateString() : "Recent"}
                    </td>

                    {/* Status Badge */}
                    <td className="p-3.5">
                      <span className="px-2 py-0.5 rounded text-[9px] font-black uppercase bg-amber-500/15 text-amber-800 border border-amber-500/30 inline-block">
                        ⏳ Priority Waitlist
                      </span>
                    </td>

                    {/* Action */}
                    <td className="p-3.5 text-right">
                      <button
                        onClick={() => setInspectWaitlistApp(app)}
                        className="px-3 py-1.5 rounded-xl border border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/20 text-amber-950 text-xs font-extrabold cursor-pointer transition flex items-center gap-1.5 ml-auto"
                      >
                        <Eye size={14} className="text-amber-600" />
                        <span>Inspect Profile</span>
                      </button>
                    </td>
                  </tr>
                ))}

                {waitlistedApplications.length === 0 && (
                  <tr>
                    <td colSpan={8} className="p-12 text-center text-muted-foreground">
                      No waitlisted candidates or next-opportunity forms recorded yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <>
          {/* ALL FRANCHISES TABLE */}
          <div className="bg-card border border-border/80 rounded-2xl overflow-hidden shadow-xs">
            <div className="px-5 py-4 border-b border-border/60 bg-secondary/10 flex justify-between items-center">
              <span className="text-xs font-bold uppercase tracking-wider text-foreground">Franchise Ledger Directory</span>
              <span className="text-[10px] font-extrabold text-muted-foreground">
                Page {currentPage} of {totalPages}
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-secondary/40 text-muted-foreground font-bold">
                  <tr>
                    <th className="p-3.5">Franchise Code / Master ID</th>
                    <th className="p-3.5">Assigned FTID(s)</th>
                    <th className="p-3.5">Business &amp; Owner</th>
                    <th className="p-3.5">Level &amp; Jurisdiction</th>
                    <th className="p-3.5">Booking Payment</th>
                    <th className="p-3.5">KYC &amp; Status</th>
                    <th className="p-3.5 text-right">Action</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-border">
                  {paginatedFranchises.map((f) => {
                    const franchiseFtids = getFranchiseFTIDs(f);
                    const paidAmount = f.securityDeposit?.amountPaid ?? f.territoryDetails?.paymentDetails?.amountPaid ?? 0;
                    const isPaidFull = f.securityDeposit?.status === "COMPLETED" || f.territoryDetails?.paymentStatus === "PAID_FULL";
                    const paymentRef = f.securityDeposit?.paymentReference || f.territoryDetails?.paymentDetails?.razorpayPaymentId;

                    return (
                      <tr key={f._id} className="hover:bg-secondary/15 transition">
                        <td className="p-3.5">
                          <div className="font-mono font-black text-primary text-xs">
                            {f.franchiseCode || f.referenceId || "N/A"}
                          </div>
                          {f.userId && (
                            <div className="text-[10px] font-mono text-muted-foreground mt-0.5">
                              Master ID: <span className="text-foreground font-bold">{typeof f.userId === "object" ? String(f.userId._id).slice(-8) : String(f.userId).slice(-8)}</span>
                            </div>
                          )}
                        </td>

                        <td className="p-3.5">
                          {franchiseFtids.length > 0 ? (
                            <div className="flex flex-col gap-1">
                              {franchiseFtids.map((t) => (
                                <div
                                  key={t._id}
                                  className="inline-flex items-center gap-1.5 bg-primary/10 border border-primary/25 text-primary px-2 py-0.5 rounded-md font-mono font-bold text-[10px] w-fit"
                                >
                                  <span>{t.ftid || `APX-${(t.level || 'TR').substring(0, 2).toUpperCase()}-001`}</span>
                                  <button
                                    type="button"
                                    onClick={() => copyToClipboard(t.ftid || "")}
                                    className="hover:text-foreground transition p-0.5"
                                    title="Copy FTID"
                                  >
                                    {copiedFtid === t.ftid ? "✓" : "📋"}
                                  </button>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <span className="text-[10px] text-amber-500 font-semibold bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/20">
                              🟡 No FTID Assigned
                            </span>
                          )}
                        </td>

                        <td className="p-3.5">
                          <div className="font-extrabold text-foreground">{f.businessName || "ApexBee Partner"}</div>
                          <div className="text-[10px] text-muted-foreground">Owner: {f.ownerName || "-"} ({f.mobile || "-"})</div>
                          {f.email && <div className="text-[10px] text-muted-foreground font-mono">{f.email}</div>}
                        </td>

                        <td className="p-3.5">
                          <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider border inline-block mb-1 ${f.franchiseLevel === "state"
                            ? "bg-purple-500/10 text-purple-600 border-purple-500/20"
                            : f.franchiseLevel === "district"
                              ? "bg-blue-500/10 text-blue-600 border-blue-500/20"
                              : "bg-amber-500/10 text-amber-600 border-amber-500/20"
                            }`}>
                            {f.franchiseLevel || "mandal"}
                          </span>
                          <div className="text-[11px] text-muted-foreground font-medium">
                            {[f.state, f.district, f.mandal].filter(Boolean).join(" / ") || "Not specified"}
                          </div>
                        </td>

                        <td className="p-3.5">
                          {paidAmount > 0 ? (
                            <div className="space-y-0.5">
                              <div className="font-black text-emerald-600 text-xs">
                                ₹{paidAmount.toLocaleString("en-IN")}
                              </div>
                              <span className={`px-1.5 py-0.5 rounded text-[9px] font-extrabold uppercase inline-block border ${isPaidFull
                                ? "bg-emerald-500/10 text-emerald-700 border-emerald-500/20"
                                : "bg-blue-500/10 text-blue-700 border-blue-500/20"
                                }`}>
                                {isPaidFull ? "100% PAID" : "ADVANCE PAID"}
                              </span>
                              {paymentRef && (
                                <div className="font-mono text-[9px] text-muted-foreground truncate max-w-[120px]" title={paymentRef}>
                                  Ref: {paymentRef}
                                </div>
                              )}
                            </div>
                          ) : (
                            <span className="text-[10px] text-slate-400 font-semibold">
                              ₹0 (Pending)
                            </span>
                          )}
                        </td>

                        <td className="p-3.5">
                          <div className="flex flex-col gap-1">
                            <span className={`px-2 py-0.5 rounded text-[9px] font-black w-fit uppercase border ${f.status === "active"
                              ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                              : "bg-amber-500/10 text-amber-600 border-amber-500/20"
                              }`}>
                              ● {f.status || "pending"}
                            </span>
                            <span className="text-[10px] text-muted-foreground font-semibold">
                              KYC: <strong className={f.kycStatus === "Approved" ? "text-emerald-600" : "text-amber-600"}>{f.kycStatus || "Pending"}</strong>
                            </span>
                            {f.applicationDetails?.panNumber && (
                              <span className="text-[9px] font-mono text-muted-foreground">
                                PAN: {f.applicationDetails.panNumber}
                              </span>
                            )}
                          </div>
                        </td>

                        <td className="p-3.5 text-right">
                          <button
                            onClick={() => setInspectFranchise(f)}
                            className="px-3 py-1.5 rounded-xl border border-border bg-secondary/30 hover:bg-secondary text-foreground text-xs font-extrabold cursor-pointer transition flex items-center gap-1.5 ml-auto"
                          >
                            <Eye size={14} className="text-primary" />
                            <span>Inspect CRM</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}

                  {paginatedFranchises.length === 0 && (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-muted-foreground">
                        No franchise partners match the specified filters.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* PAGINATION FOOTER */}
            {totalPages > 1 && (
              <div className="p-4 border-t border-border bg-secondary/10 flex flex-col sm:row items-center justify-between gap-3 text-xs">
                <div className="text-muted-foreground font-semibold text-[11px]">
                  Showing <b>{(currentPage - 1) * pageSize + 1}</b> to <b>{Math.min(currentPage * pageSize, filteredFranchises.length)}</b> of <b>{filteredFranchises.length}</b> franchises
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    disabled={currentPage <= 1}
                    onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                    className="px-3 py-1.5 rounded-xl border border-border bg-card text-foreground font-bold text-xs disabled:opacity-40 cursor-pointer flex items-center gap-1 hover:bg-secondary transition"
                  >
                    <ChevronLeft size={14} />
                    <span>Prev</span>
                  </button>

                  <div className="flex items-center gap-1">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((pg) => (
                      <button
                        key={pg}
                        onClick={() => setCurrentPage(pg)}
                        className={`w-7 h-7 rounded-xl text-xs font-black transition cursor-pointer ${currentPage === pg
                          ? "bg-primary text-primary-foreground shadow-xs"
                          : "bg-card border border-border text-muted-foreground hover:text-foreground hover:bg-secondary"
                          }`}
                      >
                        {pg}
                      </button>
                    ))}
                  </div>

                  <button
                    disabled={currentPage >= totalPages}
                    onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                    className="px-3 py-1.5 rounded-xl border border-border bg-card text-foreground font-bold text-xs disabled:opacity-40 cursor-pointer flex items-center gap-1 hover:bg-secondary transition"
                  >
                    <span>Next</span>
                    <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {/* INSPECT FRANCHISE FULL DETAILS MODAL / DRAWER */}
      {inspectFranchise && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-2xl max-w-3xl w-full max-h-[92vh] overflow-y-auto shadow-2xl p-6 space-y-6 text-xs text-foreground">
            {/* Modal Header */}
            <div className="flex justify-between items-start border-b border-border pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-black text-foreground">
                    {inspectFranchise.businessName || inspectFranchise.ownerName}
                  </h2>
                  <span className="px-2.5 py-0.5 rounded-full bg-primary/10 text-primary font-black uppercase text-[10px]">
                    {inspectFranchise.franchiseLevel} Franchise
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5 font-mono">
                  Franchise Code: <strong className="text-primary">{inspectFranchise.franchiseCode || 'N/A'}</strong> • Ref: {inspectFranchise.referenceId || 'N/A'}
                  {inspectFranchise.userId && ` • User ID: ${typeof inspectFranchise.userId === "object" ? inspectFranchise.userId._id : inspectFranchise.userId}`}
                </p>
              </div>
              <button
                onClick={() => setInspectFranchise(null)}
                className="p-1 rounded-lg border border-border text-muted-foreground hover:text-foreground cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Quick Status Control Bar */}
            <div className="p-4 rounded-xl bg-secondary/30 border border-border/80 flex items-center justify-between flex-wrap gap-3">
              <div>
                <span className="text-[10px] font-black text-muted-foreground uppercase tracking-wider block">CRM Verification Status</span>
                <span className={`text-xs font-black uppercase ${inspectFranchise.status === 'active' ? 'text-emerald-500' : 'text-amber-500'}`}>
                  ● Status: {inspectFranchise.status || 'Pending Verification'} | KYC: {inspectFranchise.kycStatus || 'Pending KYC'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  disabled={updating}
                  onClick={() => handleUpdateStatus(inspectFranchise._id, "active", "Approved")}
                  className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-extrabold shadow-xs transition cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                >
                  <CheckCircle2 size={14} /> Approve KYC &amp; Activate Portal
                </button>
                <button
                  disabled={updating}
                  onClick={() => handleUpdateStatus(inspectFranchise._id, "inactive", "Rejected")}
                  className="px-3.5 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl font-extrabold shadow-xs transition cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                >
                  <XCircle size={14} /> Deactivate / Reject
                </button>
              </div>
            </div>

            {/* 1. FINANCIAL & TERRITORY BOOKING PAYMENT CARD */}
            <div className="space-y-3 bg-emerald-500/5 p-4 rounded-2xl border border-emerald-500/20">
              <span className="text-[10px] font-black text-emerald-700 uppercase tracking-wider block flex items-center gap-1.5">
                <CreditCard size={14} className="text-emerald-600" /> Franchise Fee &amp; Booking Payment Clearance
              </span>

              {(() => {
                const deposit = inspectFranchise.securityDeposit;
                const terrPayment = inspectFranchise.territoryDetails?.paymentDetails;
                const paidAmt = deposit?.amountPaid ?? terrPayment?.amountPaid ?? 0;
                const annualFee = inspectFranchise.territoryDetails?.annualFranchiseFee
                  || inspectFranchise.territoryDetails?.franchiseFeePerYear
                  || (inspectFranchise.franchiseLevel === "state" ? 60000 : inspectFranchise.franchiseLevel === "district" ? 60000 : 60000);
                const balanceDue = Math.max(0, annualFee - paidAmt);
                const paymentRef = deposit?.paymentReference || terrPayment?.razorpayPaymentId || "N/A";
                const isPaidFull = deposit?.status === "COMPLETED" || inspectFranchise.territoryDetails?.paymentStatus === "PAID_FULL" || (paidAmt >= annualFee && paidAmt > 0);

                return (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="p-3 bg-card rounded-xl border border-border">
                      <span className="text-[10px] text-muted-foreground font-semibold block">Total Annual Fee</span>
                      <strong className="text-sm font-black text-foreground">₹{annualFee.toLocaleString("en-IN")}</strong>
                    </div>

                    <div className="p-3 bg-card rounded-xl border border-emerald-500/30">
                      <span className="text-[10px] text-emerald-600 font-semibold block">Booking Amount Paid</span>
                      <strong className="text-sm font-black text-emerald-600">₹{paidAmt.toLocaleString("en-IN")}</strong>
                      <div className="text-[9px] font-extrabold text-emerald-700 mt-0.5">
                        {isPaidFull ? "✓ 100% Fully Paid" : "⚡ Advance Deposit Paid"}
                      </div>
                    </div>

                    <div className="p-3 bg-card rounded-xl border border-border">
                      <span className="text-[10px] text-muted-foreground font-semibold block">Balance Pending</span>
                      <strong className={`text-sm font-black ${balanceDue > 0 ? "text-amber-600" : "text-emerald-600"}`}>
                        {balanceDue > 0 ? `₹${balanceDue.toLocaleString("en-IN")}` : "₹0 (Cleared)"}
                      </strong>
                    </div>

                    <div className="sm:col-span-3 p-3 bg-card rounded-xl border border-border flex flex-wrap items-center justify-between gap-2">
                      <div className="font-mono text-xs">
                        <span className="text-muted-foreground">Razorpay Ref ID: </span>
                        <strong className="text-foreground font-bold">{paymentRef}</strong>
                      </div>
                      <div className="flex items-center gap-3">
                        {deposit?.paidAt && (
                          <div className="text-[11px] text-muted-foreground">
                            Paid At: <strong>{new Date(deposit.paidAt).toLocaleString()}</strong>
                          </div>
                        )}
                        <button
                          type="button"
                          onClick={() => {
                            setEditingFeeModal(inspectFranchise);
                            setCustomAnnualFee(annualFee);
                            setCustomAmountPaid(paidAmt);
                            setCustomIsCompleted(isPaidFull);
                          }}
                          className="px-2.5 py-1 bg-primary text-primary-foreground font-bold text-[10px] rounded-lg cursor-pointer hover:bg-primary/90 transition shadow-xs flex items-center gap-1"
                        >
                          ✏️ Edit Fee / Record Balance
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* 2. KYC IDENTITY & BUSINESS VERIFICATION CARD */}
            <div className="space-y-3 bg-secondary/15 p-4 rounded-2xl border border-border/60">
              <span className="text-[10px] font-black text-muted-foreground uppercase tracking-wider block flex items-center gap-1.5">
                <ShieldCheck size={14} className="text-primary" /> KYC Documents &amp; Identity Verification
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3 bg-card rounded-xl border border-border space-y-1">
                  <span className="text-[10px] text-muted-foreground font-semibold block">PAN Card</span>
                  <div className="font-mono font-bold text-foreground">{inspectFranchise.applicationDetails?.panNumber || "Not Provided"}</div>
                  {inspectFranchise.applicationDetails?.documents?.pan && (
                    <a
                      href={inspectFranchise.applicationDetails.documents.pan}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[11px] text-blue-600 font-bold hover:underline block pt-1"
                    >
                      View PAN Document ↗
                    </a>
                  )}
                </div>

                <div className="p-3 bg-card rounded-xl border border-border space-y-1">
                  <span className="text-[10px] text-muted-foreground font-semibold block">Aadhaar Card</span>
                  <div className="font-mono font-bold text-foreground">{inspectFranchise.applicationDetails?.aadhaarNumber || "Not Provided"}</div>
                  {inspectFranchise.applicationDetails?.documents?.aadhaar && (
                    <a
                      href={inspectFranchise.applicationDetails.documents.aadhaar}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[11px] text-blue-600 font-bold hover:underline block pt-1"
                    >
                      View Aadhaar Document ↗
                    </a>
                  )}
                </div>

                <div className="p-3 bg-card rounded-xl border border-border space-y-1">
                  <span className="text-[10px] text-muted-foreground font-semibold block">GST / Business Reg</span>
                  <div className="font-mono font-bold text-foreground">{inspectFranchise.applicationDetails?.gstNumber || "Not Provided"}</div>
                  {inspectFranchise.applicationDetails?.documents?.gst && (
                    <a
                      href={inspectFranchise.applicationDetails.documents.gst}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[11px] text-blue-600 font-bold hover:underline block pt-1"
                    >
                      View GST Certificate ↗
                    </a>
                  )}
                </div>
              </div>
            </div>

            {/* 3. OPPORTUNITY APPLICATION PROFILE & DETAILED SPECIFICATIONS CARD */}
            {inspectFranchise.applicationDetails && (
              <div className="space-y-3 bg-secondary/15 p-4 rounded-2xl border border-border/60">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black text-muted-foreground uppercase tracking-wider block flex items-center gap-1.5">
                    <Briefcase size={14} className="text-primary" /> Opportunity Application &amp; Filled Specifications
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-primary/10 text-primary font-bold text-[10px] uppercase">
                    Role: {inspectFranchise.applicationDetails.applicationType || inspectFranchise.applicationDetails.roleId || "Franchise"}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {/* Category / Trade */}
                  {(inspectFranchise.applicationDetails.primaryCategory || inspectFranchise.applicationDetails.category) && (
                    <div className="p-3 bg-card rounded-xl border border-border">
                      <span className="text-[10px] text-muted-foreground font-semibold block">Primary Category</span>
                      <strong className="text-xs font-bold text-foreground">
                        {inspectFranchise.applicationDetails.primaryCategory || inspectFranchise.applicationDetails.category}
                      </strong>
                    </div>
                  )}

                  {/* Subcategories */}
                  {(inspectFranchise.applicationDetails.subCategory || (inspectFranchise.applicationDetails.approvedSubcategories && inspectFranchise.applicationDetails.approvedSubcategories.length > 0)) && (
                    <div className="p-3 bg-card rounded-xl border border-border">
                      <span className="text-[10px] text-muted-foreground font-semibold block">Subcategory / Niches</span>
                      <strong className="text-xs font-bold text-foreground">
                        {inspectFranchise.applicationDetails.approvedSubcategories?.join(", ") || inspectFranchise.applicationDetails.subCategory}
                      </strong>
                    </div>
                  )}

                  {/* Experience */}
                  {inspectFranchise.applicationDetails.experience && (
                    <div className="p-3 bg-card rounded-xl border border-border">
                      <span className="text-[10px] text-muted-foreground font-semibold block">Relevant Experience</span>
                      <strong className="text-xs font-bold text-foreground">
                        {inspectFranchise.applicationDetails.experience}
                      </strong>
                    </div>
                  )}

                  {/* Investment / Capacity */}
                  {(inspectFranchise.applicationDetails.investmentCapacity || inspectFranchise.applicationDetails.expectedSales) && (
                    <div className="p-3 bg-card rounded-xl border border-border">
                      <span className="text-[10px] text-muted-foreground font-semibold block">Investment / Target Capacity</span>
                      <strong className="text-xs font-bold text-emerald-600">
                        {inspectFranchise.applicationDetails.investmentCapacity || inspectFranchise.applicationDetails.expectedSales}
                      </strong>
                    </div>
                  )}

                  {/* Food Partner Specifics */}
                  {inspectFranchise.applicationDetails.foodBusinessType && (
                    <div className="p-3 bg-card rounded-xl border border-border">
                      <span className="text-[10px] text-muted-foreground font-semibold block">Food Business Type</span>
                      <strong className="text-xs font-bold text-foreground">
                        {inspectFranchise.applicationDetails.foodBusinessType} ({inspectFranchise.applicationDetails.foodPreference || "Veg & Non-Veg"})
                      </strong>
                    </div>
                  )}

                  {inspectFranchise.applicationDetails.fssaiNumber && (
                    <div className="p-3 bg-card rounded-xl border border-border">
                      <span className="text-[10px] text-muted-foreground font-semibold block">FSSAI License No</span>
                      <strong className="text-xs font-mono font-bold text-foreground">
                        {inspectFranchise.applicationDetails.fssaiNumber}
                      </strong>
                    </div>
                  )}

                  {inspectFranchise.applicationDetails.cuisines && inspectFranchise.applicationDetails.cuisines.length > 0 && (
                    <div className="p-3 bg-card rounded-xl border border-border sm:col-span-2">
                      <span className="text-[10px] text-muted-foreground font-semibold block">Cuisines Offered</span>
                      <strong className="text-xs font-bold text-foreground">
                        {inspectFranchise.applicationDetails.cuisines.join(", ")}
                      </strong>
                    </div>
                  )}

                  {/* Delivery Partner Specifics */}
                  {inspectFranchise.applicationDetails.vehicleType && (
                    <div className="p-3 bg-card rounded-xl border border-border">
                      <span className="text-[10px] text-muted-foreground font-semibold block">Vehicle Type</span>
                      <strong className="text-xs font-bold text-foreground">
                        {inspectFranchise.applicationDetails.vehicleType}
                      </strong>
                    </div>
                  )}

                  {inspectFranchise.applicationDetails.licenseNumber && (
                    <div className="p-3 bg-card rounded-xl border border-border">
                      <span className="text-[10px] text-muted-foreground font-semibold block">Driving License No</span>
                      <strong className="text-xs font-mono font-bold text-foreground">
                        {inspectFranchise.applicationDetails.licenseNumber}
                      </strong>
                    </div>
                  )}

                  {/* Service / Course Provider Specifics */}
                  {inspectFranchise.applicationDetails.serviceType && (
                    <div className="p-3 bg-card rounded-xl border border-border">
                      <span className="text-[10px] text-muted-foreground font-semibold block">Service Domain / Topic</span>
                      <strong className="text-xs font-bold text-foreground">
                        {inspectFranchise.applicationDetails.serviceType}
                      </strong>
                    </div>
                  )}

                  {inspectFranchise.applicationDetails.sampleVideoLink && (
                    <div className="p-3 bg-card rounded-xl border border-border sm:col-span-2">
                      <span className="text-[10px] text-muted-foreground font-semibold block">Sample Video / Portfolio Link</span>
                      <a
                        href={inspectFranchise.applicationDetails.sampleVideoLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs font-bold text-blue-600 hover:underline block truncate"
                      >
                        {inspectFranchise.applicationDetails.sampleVideoLink} ↗
                      </a>
                    </div>
                  )}

                  {/* Applicant Remarks */}
                  {inspectFranchise.applicationDetails.remarks && (
                    <div className="p-3 bg-card rounded-xl border border-border sm:col-span-3">
                      <span className="text-[10px] text-muted-foreground font-semibold block">Applicant Remarks &amp; Notes</span>
                      <p className="text-xs text-foreground font-medium mt-0.5 leading-relaxed">
                        {inspectFranchise.applicationDetails.remarks}
                      </p>
                    </div>
                  )}
                </div>

                {/* Multiple Applications List (if any) */}
                {((inspectFranchise as any).allApplications?.length > 1) && (
                  <div className="pt-2 border-t border-border/60">
                    <span className="text-[10px] font-bold text-muted-foreground block mb-1.5">
                      All Opportunities Applied by this User ({(inspectFranchise as any).allApplications.length}):
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {(inspectFranchise as any).allApplications.map((appItem: any) => (
                        <span
                          key={appItem._id}
                          className="px-2 py-0.5 rounded-lg border border-border bg-card text-[10px] font-bold"
                        >
                          {appItem.applicationType?.toUpperCase() || appItem.roleId} • <strong className="text-primary">{appItem.status}</strong>
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 4. Assigned Franchise Territory IDs (FTIDs) Section */}
            <div className="space-y-3 bg-secondary/15 p-4 rounded-2xl border border-border/60">
              <span className="text-[10px] font-black text-muted-foreground uppercase tracking-wider block flex items-center gap-1.5">
                <MapPin size={14} className="text-primary" /> Assigned Franchise Territory ID(s) [FTID]
              </span>
              {getFranchiseFTIDs(inspectFranchise).length > 0 ? (
                <div className="space-y-2">
                  {getFranchiseFTIDs(inspectFranchise).map((t) => (
                    <div key={t._id} className="p-3 bg-card rounded-xl border border-border flex items-center justify-between">
                      <div>
                        <div className="font-mono font-black text-primary text-xs">{t.ftid || 'APX-FTID'}</div>
                        <div className="text-[11px] text-muted-foreground">
                          {t.level} - {t.name} ({[t.state, t.district, t.mandal, t.village].filter(Boolean).join(" ➔ ")})
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(t.ftid || "")}
                        className="px-2.5 py-1 rounded-lg bg-primary/10 text-primary text-[10px] font-bold hover:bg-primary/20 transition"
                      >
                        {copiedFtid === t.ftid ? "✓ Copied" : "Copy FTID"}
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-3 bg-card/60 rounded-xl border border-dashed border-border text-center text-muted-foreground text-xs">
                  No territory slot currently assigned. Assign one using the selector above.
                </div>
              )}
            </div>

            {/* 4. Owner & Contact Information */}
            <div className="space-y-3 bg-secondary/15 p-4 rounded-2xl border border-border/60">
              <span className="text-[10px] font-black text-muted-foreground uppercase tracking-wider block flex items-center gap-1.5">
                <Users size={14} className="text-primary" /> Owner &amp; Contact Specs
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-muted-foreground font-medium block">Owner Full Name:</span>
                  <strong className="text-foreground font-bold">{inspectFranchise.ownerName || '-'}</strong>
                </div>
                <div>
                  <span className="text-muted-foreground font-medium block">Phone Number:</span>
                  <strong className="text-foreground font-mono">{inspectFranchise.mobile || '-'}</strong>
                </div>
                <div>
                  <span className="text-muted-foreground font-medium block">Email Address:</span>
                  <strong className="text-foreground font-mono">{inspectFranchise.email || '-'}</strong>
                </div>
                <div>
                  <span className="text-muted-foreground font-medium block">Pincode:</span>
                  <strong className="text-foreground font-mono">{inspectFranchise.pincode || '-'}</strong>
                </div>
              </div>
            </div>

            {/* 5. Location & Territory Coverage */}
            <div className="space-y-3 bg-secondary/15 p-4 rounded-2xl border border-border/60">
              <span className="text-[10px] font-black text-muted-foreground uppercase tracking-wider block flex items-center gap-1.5">
                <MapPin size={14} className="text-primary" /> Registered Location &amp; Address
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs mb-2">
                <div>
                  <span className="text-muted-foreground font-medium block">State:</span>
                  <strong className="text-foreground">{inspectFranchise.state || '-'}</strong>
                </div>
                <div>
                  <span className="text-muted-foreground font-medium block">District:</span>
                  <strong className="text-foreground">{inspectFranchise.district || '-'}</strong>
                </div>
                <div>
                  <span className="text-muted-foreground font-medium block">Mandal:</span>
                  <strong className="text-foreground">{inspectFranchise.mandal || '-'}</strong>
                </div>
              </div>
              <div>
                <span className="text-muted-foreground font-medium block">Complete Street Address:</span>
                <span className="text-foreground font-medium leading-relaxed">{inspectFranchise.address || 'Not provided'}</span>
              </div>
            </div>

            {/* 3. Assigned Network Counts */}
            <div className="space-y-3 bg-secondary/15 p-4 rounded-2xl border border-border/60">
              <span className="text-[10px] font-black text-muted-foreground uppercase tracking-wider block flex items-center gap-1.5">
                <Network size={14} className="text-primary" /> Onboarded Network Entities
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs text-center">
                <div className="p-2.5 bg-card rounded-xl border border-border/60">
                  <span className="text-[10px] text-muted-foreground font-semibold block">Vendors</span>
                  <b className="text-base text-primary font-black">{inspectFranchise.totalVendors || 0}</b>
                </div>
                <div className="p-2.5 bg-card rounded-xl border border-border/60">
                  <span className="text-[10px] text-muted-foreground font-semibold block">Manufacturers</span>
                  <b className="text-base text-primary font-black">{inspectFranchise.totalManufacturers || 0}</b>
                </div>
                <div className="p-2.5 bg-card rounded-xl border border-border/60">
                  <span className="text-[10px] text-muted-foreground font-semibold block">Wholesalers</span>
                  <b className="text-base text-primary font-black">{inspectFranchise.totalWholesalers || 0}</b>
                </div>
                <div className="p-2.5 bg-card rounded-xl border border-border/60">
                  <span className="text-[10px] text-muted-foreground font-semibold block">Service Providers</span>
                  <b className="text-base text-primary font-black">{inspectFranchise.totalServiceProviders || 0}</b>
                </div>
                <div className="p-2.5 bg-card rounded-xl border border-border/60">
                  <span className="text-[10px] text-muted-foreground font-semibold block">Course Providers</span>
                  <b className="text-base text-primary font-black">{inspectFranchise.totalCourseProviders || 0}</b>
                </div>
                <div className="p-2.5 bg-card rounded-xl border border-border/60">
                  <span className="text-[10px] text-muted-foreground font-semibold block">Entrepreneurs</span>
                  <b className="text-base text-primary font-black">{inspectFranchise.totalEntrepreneurs || 0}</b>
                </div>
              </div>
            </div>

            {/* 4. Bank Account Details */}
            {inspectFranchise.bankDetails && (
              <div className="space-y-3 bg-secondary/15 p-4 rounded-2xl border border-border/60">
                <span className="text-[10px] font-black text-muted-foreground uppercase tracking-wider block flex items-center gap-1.5">
                  <CreditCard size={14} className="text-primary" /> Bank &amp; Settlement Specs
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono">
                  <div>
                    <span className="text-muted-foreground font-sans font-medium block">Account Holder:</span>
                    <strong className="text-foreground">{inspectFranchise.bankDetails.accountHolderName || '-'}</strong>
                  </div>
                  <div>
                    <span className="text-muted-foreground font-sans font-medium block">Bank Name:</span>
                    <strong className="text-foreground">{inspectFranchise.bankDetails.bankName || '-'}</strong>
                  </div>
                  <div>
                    <span className="text-muted-foreground font-sans font-medium block">Account Number:</span>
                    <strong className="text-foreground">{inspectFranchise.bankDetails.accountNumber || '-'}</strong>
                  </div>
                  <div>
                    <span className="text-muted-foreground font-sans font-medium block">IFSC Code:</span>
                    <strong className="text-foreground">{inspectFranchise.bankDetails.ifsc || '-'}</strong>
                  </div>
                </div>
              </div>
            )}

            {/* Modal Footer */}
            <div className="flex justify-end pt-3 border-t border-border">
              <button
                onClick={() => setInspectFranchise(null)}
                className="px-4 py-2 rounded-xl border border-border bg-secondary hover:bg-secondary/80 font-extrabold text-xs cursor-pointer"
              >
                Close Modal
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EDIT FEE & RECORD BALANCE MODAL */}
      {editingFeeModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-2xl max-w-md w-full p-6 space-y-5 shadow-2xl text-xs">
            <div className="flex justify-between items-start border-b border-border pb-3">
              <div>
                <h3 className="text-base font-black text-foreground">
                  Franchise Fee &amp; Balance Clearance
                </h3>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  {editingFeeModal.businessName || editingFeeModal.ownerName} ({editingFeeModal.franchiseLevel?.toUpperCase()} Franchise)
                </p>
              </div>
              <button
                onClick={() => setEditingFeeModal(null)}
                className="p-1 rounded-lg border border-border text-muted-foreground hover:text-foreground cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleUpdatePayment} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground block">
                  Official Total Annual Fee (₹)
                </label>
                <input
                  type="number"
                  value={customAnnualFee}
                  onChange={(e) => setCustomAnnualFee(Number(e.target.value))}
                  required
                  min={0}
                  className="w-full px-3 py-2 rounded-xl border border-border bg-secondary/30 text-xs font-bold focus:border-primary outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground block">
                  Total Amount Received / Paid So Far (₹)
                </label>
                <input
                  type="number"
                  value={customAmountPaid}
                  onChange={(e) => setCustomAmountPaid(Number(e.target.value))}
                  required
                  min={0}
                  className="w-full px-3 py-2 rounded-xl border border-border bg-secondary/30 text-xs font-bold text-emerald-600 focus:border-primary outline-none"
                />
              </div>

              <div className="p-3 bg-secondary/20 rounded-xl border border-border/80 flex items-center justify-between">
                <div>
                  <span className="font-bold text-foreground block">Calculated Balance Due</span>
                  <span className="text-[11px] text-muted-foreground">Remaining fee to collect</span>
                </div>
                <strong className={`text-sm font-black ${Math.max(0, customAnnualFee - customAmountPaid) > 0 ? "text-amber-600" : "text-emerald-600"}`}>
                  ₹{Math.max(0, customAnnualFee - customAmountPaid).toLocaleString("en-IN")}
                </strong>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="markFullCompleted"
                  checked={customIsCompleted || customAmountPaid >= customAnnualFee}
                  onChange={(e) => setCustomIsCompleted(e.target.checked)}
                  className="w-4 h-4 rounded text-primary focus:ring-primary cursor-pointer"
                />
                <label htmlFor="markFullCompleted" className="text-xs font-extrabold text-foreground cursor-pointer select-none">
                  Mark 100% Fully Cleared / Paid (Allotment Complete)
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-border">
                <button
                  type="button"
                  onClick={() => setEditingFeeModal(null)}
                  className="px-4 py-2 rounded-xl border border-border font-bold text-xs hover:bg-secondary cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updating}
                  className="px-4 py-2 bg-primary text-primary-foreground font-extrabold text-xs rounded-xl shadow-xs hover:bg-primary/90 transition cursor-pointer disabled:opacity-50"
                >
                  {updating ? "Saving..." : "Save Financial Clearance"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* INSPECT NEXT OPPORTUNITY / WAITLIST APPLICATION MODAL */}
      {inspectWaitlistApp && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl p-6 space-y-6 text-xs text-foreground">
            <div className="flex justify-between items-start border-b border-border pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-black text-foreground">
                    {inspectWaitlistApp.businessName || inspectWaitlistApp.ownerName || inspectWaitlistApp.name}
                  </h2>
                  <span className="px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-800 border border-amber-500/20 font-black uppercase text-[10px]">
                    ⏳ Waitlisted ({inspectWaitlistApp.franchiseLevel || "Mandal"} Level)
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5 font-mono">
                  Applied for Next Expansion: <strong className="text-primary">{[inspectWaitlistApp.state, inspectWaitlistApp.district, inspectWaitlistApp.mandal].filter(Boolean).join(" ➔ ")}</strong>
                </p>
              </div>
              <button
                onClick={() => setInspectWaitlistApp(null)}
                className="p-1 rounded-lg border border-border text-muted-foreground hover:text-foreground cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Target Territory & Waitlist Info */}
            <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 space-y-2">
              <span className="text-[10px] font-black text-amber-900 uppercase tracking-wider block">
                ⚡ Expansion Allocation Status
              </span>
              <p className="text-xs text-amber-900 font-semibold leading-relaxed">
                This partner applied while the requested territory was already active under another partner. Their profile is priority-queued for sub-jurisdiction opening or regional territory expansion.
              </p>
              {inspectWaitlistApp.waitlistTerritoryFtid && (
                <div className="text-[11px] font-mono text-amber-950 font-bold pt-1">
                  Target FTID Reference: {inspectWaitlistApp.waitlistTerritoryFtid}
                </div>
              )}
            </div>

            {/* Contact & Jurisdiction Details */}
            <div className="space-y-3 bg-secondary/15 p-4 rounded-2xl border border-border/60">
              <span className="text-[10px] font-black text-muted-foreground uppercase tracking-wider block flex items-center gap-1.5">
                <Users size={14} className="text-primary" /> Applicant &amp; Contact Specifications
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <span className="text-muted-foreground block text-[11px]">Owner Full Name:</span>
                  <strong className="text-foreground">{inspectWaitlistApp.ownerName || inspectWaitlistApp.name || "-"}</strong>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[11px]">Mobile Number:</span>
                  <strong className="text-foreground font-mono">{inspectWaitlistApp.mobile || "-"}</strong>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[11px]">Email Address:</span>
                  <strong className="text-foreground font-mono">{inspectWaitlistApp.email || "-"}</strong>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[11px]">Pincode:</span>
                  <strong className="text-foreground font-mono">{inspectWaitlistApp.pincode || "-"}</strong>
                </div>
              </div>
            </div>

            {/* Verification Documents & Numbers */}
            <div className="space-y-3 bg-secondary/15 p-4 rounded-2xl border border-border/60">
              <span className="text-[10px] font-black text-muted-foreground uppercase tracking-wider block flex items-center gap-1.5">
                <ShieldCheck size={14} className="text-primary" /> Identity Documents &amp; Financial Capacity
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3 bg-card rounded-xl border border-border">
                  <span className="text-[10px] text-muted-foreground font-semibold block">PAN Number</span>
                  <strong className="text-xs font-mono font-bold">{inspectWaitlistApp.panNumber || "Not Provided"}</strong>
                </div>
                <div className="p-3 bg-card rounded-xl border border-border">
                  <span className="text-[10px] text-muted-foreground font-semibold block">Aadhaar Number</span>
                  <strong className="text-xs font-mono font-bold">{inspectWaitlistApp.aadhaarNumber || "Not Provided"}</strong>
                </div>
                <div className="p-3 bg-card rounded-xl border border-border">
                  <span className="text-[10px] text-muted-foreground font-semibold block">GST / Business Reg</span>
                  <strong className="text-xs font-mono font-bold">{inspectWaitlistApp.gstNumber || "Not Provided"}</strong>
                </div>
              </div>
            </div>

            {/* Capacity, Experience & Remarks */}
            <div className="space-y-3 bg-secondary/15 p-4 rounded-2xl border border-border/60">
              <span className="text-[10px] font-black text-muted-foreground uppercase tracking-wider block flex items-center gap-1.5">
                <Briefcase size={14} className="text-primary" /> Profile Experience &amp; Notes
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-2">
                <div>
                  <span className="text-muted-foreground block text-[11px]">Investment Target:</span>
                  <strong className="text-emerald-600 font-bold">{inspectWaitlistApp.investmentCapacity || "Ready for allocation"}</strong>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[11px]">Business Experience:</span>
                  <strong className="text-foreground">{inspectWaitlistApp.experience || "Not specified"}</strong>
                </div>
              </div>
              {inspectWaitlistApp.remarks && (
                <div className="pt-2 border-t border-border/60">
                  <span className="text-muted-foreground block text-[11px] font-semibold">Special Applicant Notes:</span>
                  <p className="text-xs text-foreground font-medium mt-0.5">{inspectWaitlistApp.remarks}</p>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex justify-between items-center pt-3 border-t border-border">
              <span className="text-[11px] text-muted-foreground">
                Submitted on: {new Date(inspectWaitlistApp.createdAt).toLocaleString()}
              </span>
              <button
                onClick={() => setInspectWaitlistApp(null)}
                className="px-4 py-2 rounded-xl border border-border bg-secondary hover:bg-secondary/80 font-extrabold text-xs cursor-pointer"
              >
                Close Profile
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};