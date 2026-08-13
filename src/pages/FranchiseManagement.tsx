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
  Boxes
} from "lucide-react";

interface FranchiseBankDetails {
  accountHolderName?: string;
  accountNumber?: string;
  ifsc?: string;
  bankName?: string;
  upiId?: string;
}

interface Franchise {
  _id: string;
  userId?: string;
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
  level?: "State" | "District" | "Mandal" | "Pincode";
  name?: string;
  state: string;
  district?: string;
  mandal?: string;
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
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

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

  const getTerritoryLevel = (t: Territory) => {
    if (t.level) return t.level;
    if (t.pincode) return "Pincode";
    if (t.mandal) return "Mandal";
    if (t.district) return "District";
    return "State";
  };

  const getTerritoryName = (t: Territory) => {
    if (t.name) return t.name;
    if (t.pincode) return t.pincode;
    if (t.mandal) return t.mandal;
    if (t.district) return t.district;
    return t.state;
  };

  const getTerritoryDisplay = (t: Territory) => {
    const level = getTerritoryLevel(t);
    const name = getTerritoryName(t);

    const path = [t.state, t.district, t.mandal, t.pincode].filter(Boolean);

    return `${level} - ${name}${path.length ? ` (${path.join(" / ")})` : ""}`;
  };

  const getFranchiseDisplay = (f: Franchise) => {
    return (
      `${f.businessName || f.ownerName || f.email || f.mobile || "Franchise"}` +
      `${f.franchiseCode ? ` (${f.franchiseCode})` : ""}`
    );
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      setErrorMsg("");

      const [franchiseRes, territoryRes] = await Promise.all([
        fetch(`${API}/franchises`, { headers }),
        fetch(`${API}/territories`, { headers }),
      ]);

      const franchiseData = await franchiseRes.json();
      const territoryData = await territoryRes.json();

      if (!franchiseRes.ok) {
        throw new Error(franchiseData.message || "Failed to fetch franchises");
      }

      if (!territoryRes.ok) {
        throw new Error(territoryData.message || "Failed to fetch territories");
      }

      setFranchises(Array.isArray(franchiseData.franchises) ? franchiseData.franchises : []);
      setTerritories(Array.isArray(territoryData.territories) ? territoryData.territories : []);
    } catch (error: any) {
      setErrorMsg(error.message || "Backend fetch failed");
      setFranchises([]);
      setTerritories([]);
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
            <span>🏛️ Franchise Network &amp; Territory Management</span>
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Manage State, District, and Mandal franchise partners, inspect backend profile specs, and assign territories.
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs font-bold bg-secondary/30 border border-border/60 px-3.5 py-2 rounded-xl">
          <Building2 size={16} className="text-primary" />
          <span>Total Registered: <strong className="text-foreground">{franchises.length}</strong></span>
        </div>
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
                <th className="p-3.5">Code / Ref</th>
                <th className="p-3.5">Business Name</th>
                <th className="p-3.5">Owner Contact</th>
                <th className="p-3.5">Level</th>
                <th className="p-3.5">Territory Location</th>
                <th className="p-3.5">KYC &amp; Status</th>
                <th className="p-3.5 text-right">Action</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-border">
              {paginatedFranchises.map((f) => (
                <tr key={f._id} className="hover:bg-secondary/15 transition">
                  <td className="p-3.5 font-mono font-bold text-primary">
                    {f.franchiseCode || f.referenceId || "N/A"}
                  </td>
                  <td className="p-3.5">
                    <div className="font-extrabold text-foreground">{f.businessName || "ApexBee Partner"}</div>
                    <div className="text-[10px] text-muted-foreground font-mono">{f.email || "No email registered"}</div>
                  </td>
                  <td className="p-3.5">
                    <div className="font-bold text-foreground">{f.ownerName || "-"}</div>
                    <div className="text-[10px] text-muted-foreground font-mono">{f.mobile || "-"}</div>
                  </td>
                  <td className="p-3.5">
                    <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider border ${f.franchiseLevel === "state"
                        ? "bg-purple-500/10 text-purple-600 border-purple-500/20"
                        : f.franchiseLevel === "district"
                          ? "bg-blue-500/10 text-blue-600 border-blue-500/20"
                          : "bg-amber-500/10 text-amber-600 border-amber-500/20"
                      }`}>
                      {f.franchiseLevel || "mandal"}
                    </span>
                  </td>
                  <td className="p-3.5 text-muted-foreground font-medium">
                    {[f.state, f.district, f.mandal].filter(Boolean).join(" / ") || "Not specified"}
                  </td>
                  <td className="p-3.5">
                    <div className="flex flex-col gap-1">
                      <span className={`px-2 py-0.5 rounded text-[9px] font-black w-fit uppercase ${f.status === "active" ? "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20" : "bg-amber-500/10 text-amber-600 border border-amber-500/20"
                        }`}>
                        {f.status || "pending"}
                      </span>
                    </div>
                  </td>
                  <td className="p-3.5 text-right">
                    <button
                      onClick={() => setInspectFranchise(f)}
                      className="px-3 py-1.5 rounded-xl border border-border bg-secondary/30 hover:bg-secondary text-foreground text-xs font-extrabold cursor-pointer transition flex items-center gap-1.5 ml-auto"
                    >
                      <Eye size={14} className="text-primary" />
                      <span>Inspect Details</span>
                    </button>
                  </td>
                </tr>
              ))}

              {filteredFranchises.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-10 text-center text-xs text-muted-foreground italic">
                    No franchises found matching search criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* PAGINATION FOOTER */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-border bg-secondary/10 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
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

      {/* INSPECT FRANCHISE FULL DETAILS MODAL / DRAWER */}
      {inspectFranchise && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl p-6 space-y-6 text-xs text-foreground">
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
                <span className="text-[10px] font-black text-muted-foreground uppercase tracking-wider block">Account Verification Status</span>
                <span className={`text-xs font-black uppercase ${inspectFranchise.status === 'active' ? 'text-emerald-500' : 'text-amber-500'}`}>
                  ● {inspectFranchise.status || 'Pending Verification'} ({inspectFranchise.kycStatus || 'Pending KYC'})
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  disabled={updating}
                  onClick={() => handleUpdateStatus(inspectFranchise._id, "active", "Approved")}
                  className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-extrabold shadow-xs transition cursor-pointer disabled:opacity-50"
                >
                  Approve &amp; Activate
                </button>
                <button
                  disabled={updating}
                  onClick={() => handleUpdateStatus(inspectFranchise._id, "inactive", "Rejected")}
                  className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl font-extrabold shadow-xs transition cursor-pointer disabled:opacity-50"
                >
                  Deactivate / Reject
                </button>
              </div>
            </div>

            {/* 1. Owner & Contact Information */}
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

            {/* 2. Location & Territory Coverage */}
            <div className="space-y-3 bg-secondary/15 p-4 rounded-2xl border border-border/60">
              <span className="text-[10px] font-black text-muted-foreground uppercase tracking-wider block flex items-center gap-1.5">
                <MapPin size={14} className="text-primary" /> Assigned Location &amp; Address
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
    </div>
  );
};