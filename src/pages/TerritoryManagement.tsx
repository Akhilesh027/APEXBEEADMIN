import React, { useEffect, useMemo, useState } from "react";
import {
  CheckCircle2,
  Layers,
  UserPlus,
  XCircle,
  Filter,
  Search,
  RotateCcw,
  Edit2,
  Trash2,
  X,
  Save,
} from "lucide-react";

type TerritoryLevel = "State" | "District" | "Mandal" | "Pincode";
type Status = "Active" | "Inactive";
type Density = "High" | "Medium" | "Low";

interface Franchise {
  _id: string;
  businessName?: string;
  ownerName?: string;
  name?: string;
  contactPerson?: string;
  email?: string;
  mobile?: string;
  franchiseCode?: string;
  franchiseLevel?: "state" | "district" | "mandal";
  state?: string;
  district?: string;
  mandal?: string;
}

interface Territory {
  _id: string;
  level: TerritoryLevel;
  name: string;
  state: string;
  district?: string;
  mandal?: string;
  pincode?: string;
  franchiseId?: Franchise | string | null;
  status: Status;
  density: Density;
  targetCoverage: string;
}

const API = "https://server.apexbee.in/api/admin";

export const TerritoryManagement: React.FC = () => {
  const [activeSubTab, setActiveSubTab] = useState<
    "states" | "districts" | "mandals" | "pincodes" | "assignment" | "add-territory"
  >("states");

  const [territories, setTerritories] = useState<Territory[]>([]);
  const [franchises, setFranchises] = useState<Franchise[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Table Filter States
  const [filterState, setFilterState] = useState("");
  const [filterDistrict, setFilterDistrict] = useState("");
  const [filterMandal, setFilterMandal] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  // Add Territory Form States
  const [level, setLevel] = useState<TerritoryLevel>("State");
  const [addState, setAddState] = useState("");
  const [addDistrict, setAddDistrict] = useState("");
  const [addMandal, setAddMandal] = useState("");
  const [addPincode, setAddPincode] = useState("");
  const [addDensity, setAddDensity] = useState<Density>("Medium");
  const [addTargetCoverage, setAddTargetCoverage] = useState("100%");
  const [addStatus, setAddStatus] = useState<Status>("Active");

  // Edit Territory Modal States
  const [editingTerritory, setEditingTerritory] = useState<Territory | null>(null);
  const [editName, setEditName] = useState("");
  const [editState, setEditState] = useState("");
  const [editDistrict, setEditDistrict] = useState("");
  const [editMandal, setEditMandal] = useState("");
  const [editPincode, setEditPincode] = useState("");
  const [editStatus, setEditStatus] = useState<Status>("Active");
  const [editDensity, setEditDensity] = useState<Density>("Medium");
  const [editTargetCoverage, setEditTargetCoverage] = useState("100%");
  const [editFranchiseId, setEditFranchiseId] = useState("");

  // Assign Franchise Form States
  const [selectedTerritoryId, setSelectedTerritoryId] = useState("");
  const [selectedFranchiseId, setSelectedFranchiseId] = useState("");

  const token = localStorage.getItem("adminToken");

  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      setErrorMsg("");

      const [territoryRes, franchiseRes] = await Promise.all([
        fetch(`${API}/territories`, { headers }),
        fetch(`${API}/franchises`, { headers }),
      ]);

      const territoryData = await territoryRes.json();
      const franchiseData = await franchiseRes.json();

      if (!territoryRes.ok) {
        throw new Error(territoryData.message || "Failed to fetch territories");
      }

      if (!franchiseRes.ok) {
        throw new Error(franchiseData.message || "Failed to fetch franchises");
      }

      setTerritories(Array.isArray(territoryData.territories) ? territoryData.territories : []);
      setFranchises(Array.isArray(franchiseData.franchises) ? franchiseData.franchises : []);
    } catch (error: any) {
      setTerritories([]);
      setFranchises([]);
      setErrorMsg(error.message || "Backend data fetch failed");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Filter Reset Handlers
  const handleStateFilterChange = (newState: string) => {
    setFilterState(newState);
    setFilterDistrict("");
    setFilterMandal("");
  };

  const handleDistrictFilterChange = (newDistrict: string) => {
    setFilterDistrict(newDistrict);
    setFilterMandal("");
  };

  const clearAllFilters = () => {
    setFilterState("");
    setFilterDistrict("");
    setFilterMandal("");
    setSearchQuery("");
  };

  // Base Lists Alphabetically Sorted
  const states = useMemo(() => {
    return territories
      .filter((t) => t.level === "State")
      .sort((a, b) => (a.name || a.state || "").localeCompare(b.name || b.state || "", undefined, { sensitivity: "base" }));
  }, [territories]);

  const districts = useMemo(() => {
    return territories
      .filter((t) => t.level === "District")
      .sort((a, b) => (a.name || a.district || "").localeCompare(b.name || b.district || "", undefined, { sensitivity: "base" }));
  }, [territories]);

  const mandals = useMemo(() => {
    return territories
      .filter((t) => t.level === "Mandal")
      .sort((a, b) => (a.name || a.mandal || "").localeCompare(b.name || b.mandal || "", undefined, { sensitivity: "base" }));
  }, [territories]);

  const pincodes = useMemo(() => {
    return territories
      .filter((t) => t.level === "Pincode")
      .sort((a, b) => (a.name || a.pincode || "").localeCompare(b.name || b.pincode || "", undefined, { sensitivity: "base" }));
  }, [territories]);

  // Dynamic Dropdown Lists for Table Filters (Alphabetically Sorted)
  const uniqueStates = useMemo(() => {
    const set = new Set<string>();
    territories.forEach((t) => {
      if (t.state && t.state.trim()) set.add(t.state.trim());
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b, undefined, { sensitivity: "base" }));
  }, [territories]);

  // District options filtered by selected State and sorted alphabetically!
  const availableFilterDistricts = useMemo(() => {
    const set = new Set<string>();
    territories.forEach((t) => {
      const matchState = !filterState || t.state?.toLowerCase() === filterState.toLowerCase();
      if (matchState && t.district && t.district.trim()) {
        set.add(t.district.trim());
      }
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b, undefined, { sensitivity: "base" }));
  }, [territories, filterState]);

  // Mandal options filtered by selected State & District, sorted alphabetically!
  const availableFilterMandals = useMemo(() => {
    const set = new Set<string>();
    territories.forEach((t) => {
      const matchState = !filterState || t.state?.toLowerCase() === filterState.toLowerCase();
      const matchDist = !filterDistrict || t.district?.toLowerCase() === filterDistrict.toLowerCase();
      if (matchState && matchDist && t.mandal && t.mandal.trim()) {
        set.add(t.mandal.trim());
      }
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b, undefined, { sensitivity: "base" }));
  }, [territories, filterState, filterDistrict]);

  // Filtered lists for rendering in table sub-tabs
  const displayedStates = useMemo(() => {
    return states.filter((t) => {
      const matchState = !filterState || t.state?.toLowerCase() === filterState.toLowerCase();
      const matchSearch =
        !searchQuery ||
        t.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.state?.toLowerCase().includes(searchQuery.toLowerCase());
      return matchState && matchSearch;
    });
  }, [states, filterState, searchQuery]);

  const displayedDistricts = useMemo(() => {
    return districts.filter((t) => {
      const matchState = !filterState || t.state?.toLowerCase() === filterState.toLowerCase();
      const matchDistrict = !filterDistrict || t.district?.toLowerCase() === filterDistrict.toLowerCase();
      const matchSearch =
        !searchQuery ||
        t.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.district?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.state?.toLowerCase().includes(searchQuery.toLowerCase());
      return matchState && matchDistrict && matchSearch;
    });
  }, [districts, filterState, filterDistrict, searchQuery]);

  const displayedMandals = useMemo(() => {
    return mandals.filter((t) => {
      const matchState = !filterState || t.state?.toLowerCase() === filterState.toLowerCase();
      const matchDistrict = !filterDistrict || t.district?.toLowerCase() === filterDistrict.toLowerCase();
      const matchMandal = !filterMandal || t.mandal?.toLowerCase() === filterMandal.toLowerCase();
      const matchSearch =
        !searchQuery ||
        t.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.mandal?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.district?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.state?.toLowerCase().includes(searchQuery.toLowerCase());
      return matchState && matchDistrict && matchMandal && matchSearch;
    });
  }, [mandals, filterState, filterDistrict, filterMandal, searchQuery]);

  const displayedPincodes = useMemo(() => {
    return pincodes.filter((t) => {
      const matchState = !filterState || t.state?.toLowerCase() === filterState.toLowerCase();
      const matchDistrict = !filterDistrict || t.district?.toLowerCase() === filterDistrict.toLowerCase();
      const matchMandal = !filterMandal || t.mandal?.toLowerCase() === filterMandal.toLowerCase();
      const matchSearch =
        !searchQuery ||
        t.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.pincode?.includes(searchQuery) ||
        t.mandal?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.district?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.state?.toLowerCase().includes(searchQuery.toLowerCase());
      return matchState && matchDistrict && matchMandal && matchSearch;
    });
  }, [pincodes, filterState, filterDistrict, filterMandal, searchQuery]);

  // Options for Add Territory Form (Alphabetical)
  const stateOptionsForAdd = useMemo(() => {
    const set = new Set<string>();
    territories.forEach((t) => {
      if (t.state && t.state.trim()) set.add(t.state.trim());
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b, undefined, { sensitivity: "base" }));
  }, [territories]);

  const availableDistricts = useMemo(() => {
    const distMap = new Map<string, string>();
    territories.forEach((t) => {
      if (t.state?.toLowerCase() === addState.toLowerCase() && t.district) {
        distMap.set(t.district, t.name || t.district);
      }
    });
    return Array.from(distMap.entries())
      .map(([district, name]) => ({ district, name }))
      .sort((a, b) => (a.name || a.district).localeCompare(b.name || b.district, undefined, { sensitivity: "base" }));
  }, [territories, addState]);

  const availableMandals = useMemo(() => {
    const mandalMap = new Map<string, string>();
    territories.forEach((t) => {
      if (
        t.state?.toLowerCase() === addState.toLowerCase() &&
        t.district?.toLowerCase() === addDistrict.toLowerCase() &&
        t.mandal
      ) {
        mandalMap.set(t.mandal, t.name || t.mandal);
      }
    });
    return Array.from(mandalMap.entries())
      .map(([mandal, name]) => ({ mandal, name }))
      .sort((a, b) => (a.name || a.mandal).localeCompare(b.name || b.mandal, undefined, { sensitivity: "base" }));
  }, [territories, addState, addDistrict]);

  // Options for Assign Franchise Form (Alphabetical)
  const sortedTerritoriesForAssign = useMemo(() => {
    return [...territories].sort((a, b) =>
      (a.name || a.state || "").localeCompare(b.name || b.state || "", undefined, { sensitivity: "base" })
    );
  }, [territories]);

  const selectedTerritory = territories.find((t) => t._id === selectedTerritoryId);

  const filteredFranchises = useMemo(() => {
    if (!selectedTerritory) return [];

    const list = franchises.filter((f) => {
      if (selectedTerritory.level === "State") {
        return (
          f.franchiseLevel === "state" &&
          f.state?.toLowerCase() === selectedTerritory.state?.toLowerCase()
        );
      }
      if (selectedTerritory.level === "District") {
        return (
          f.franchiseLevel === "district" &&
          f.state?.toLowerCase() === selectedTerritory.state?.toLowerCase() &&
          f.district?.toLowerCase() === selectedTerritory.district?.toLowerCase()
        );
      }
      if (selectedTerritory.level === "Mandal") {
        return (
          f.franchiseLevel === "mandal" &&
          f.state?.toLowerCase() === selectedTerritory.state?.toLowerCase() &&
          f.district?.toLowerCase() === selectedTerritory.district?.toLowerCase() &&
          f.mandal?.toLowerCase() === selectedTerritory.mandal?.toLowerCase()
        );
      }
      return false;
    });

    return list.sort((a, b) => {
      const nameA = a.ownerName || a.name || a.contactPerson || a.businessName || a.email || "";
      const nameB = b.ownerName || b.name || b.contactPerson || b.businessName || b.email || "";
      return nameA.localeCompare(nameB, undefined, { sensitivity: "base" });
    });
  }, [franchises, selectedTerritory]);

  const getFranchiseName = (franchise: Territory["franchiseId"]) => {
    if (!franchise || typeof franchise === "string") return "-";
    const f = franchise as any;
    const ownerName = f.ownerName || f.name || f.contactPerson || "";
    const bName = f.businessName || "";
    if (ownerName && bName) return `${ownerName} (${bName})`;
    return ownerName || bName || f.email || f.mobile || f.franchiseCode || "-";
  };

  const resetAddForm = () => {
    setAddState("");
    setAddDistrict("");
    setAddMandal("");
    setAddPincode("");
    setAddDensity("Medium");
    setAddTargetCoverage("100%");
    setAddStatus("Active");
  };

  // Open Edit Modal
  const openEditModal = (item: Territory) => {
    setEditingTerritory(item);
    setEditName(item.name || "");
    setEditState(item.state || "");
    setEditDistrict(item.district || "");
    setEditMandal(item.mandal || "");
    setEditPincode(item.pincode || "");
    setEditStatus(item.status || "Active");
    setEditDensity(item.density || "Medium");
    setEditTargetCoverage(item.targetCoverage || "100%");

    let fId = "";
    if (item.franchiseId) {
      fId = typeof item.franchiseId === "object" ? item.franchiseId._id : item.franchiseId;
    }
    setEditFranchiseId(fId);
  };

  const closeEditModal = () => {
    setEditingTerritory(null);
  };

  // Update Territory Action
  const handleUpdateTerritory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTerritory) return;

    try {
      setErrorMsg("");
      setSuccessMsg("");

      const payload = {
        name: editName.trim(),
        state: editState.trim(),
        district: editingTerritory.level !== "State" ? editDistrict.trim() : "",
        mandal: editingTerritory.level === "Mandal" || editingTerritory.level === "Pincode" ? editMandal.trim() : "",
        pincode: editingTerritory.level === "Pincode" ? editPincode.trim() : "",
        status: editStatus,
        density: editDensity,
        targetCoverage: editTargetCoverage.trim() || "100%",
        franchiseId: editFranchiseId || null,
      };

      const res = await fetch(`${API}/territories/${editingTerritory._id}`, {
        method: "PUT",
        headers,
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setSuccessMsg(`Territory "${editName}" updated successfully`);
        closeEditModal();
        await fetchData();
      } else {
        alert(data.message || "Failed to update territory");
      }
    } catch (err: any) {
      alert(err.message || "Update request failed");
    }
  };

  // Delete Territory Action
  const handleDeleteTerritory = async (item: Territory) => {
    const confirmText = `Are you sure you want to delete territory "${item.name}" (${item.level})?`;
    if (!window.confirm(confirmText)) return;

    try {
      setErrorMsg("");
      setSuccessMsg("");

      const res = await fetch(`${API}/territories/${item._id}`, {
        method: "DELETE",
        headers,
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setSuccessMsg(`Territory "${item.name}" deleted successfully`);
        await fetchData();
      } else {
        alert(data.message || "Failed to delete territory");
      }
    } catch (err: any) {
      alert(err.message || "Delete request failed");
    }
  };

  const handleAddTerritory = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!addState.trim()) return alert("State is required");
    if (level !== "State" && !addDistrict.trim()) return alert("District is required");
    if ((level === "Mandal" || level === "Pincode") && !addMandal.trim()) return alert("Mandal is required");
    if (level === "Pincode" && !addPincode.trim()) return alert("Pincode is required");

    const payload = {
      level,
      state: addState.trim(),
      district: level !== "State" ? addDistrict.trim() : "",
      mandal: level === "Mandal" || level === "Pincode" ? addMandal.trim() : "",
      pincode: level === "Pincode" ? addPincode.trim() : "",
      status: addStatus,
      density: addDensity,
      targetCoverage: addTargetCoverage.trim() || "100%",
    };

    const res = await fetch(`${API}/territories`, {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
    });

    const data = await res.json();

    if (res.ok && data.success) {
      setSuccessMsg(`${level} created successfully`);
      resetAddForm();
      await fetchData();
    } else {
      alert(data.message || "Failed to create territory");
    }
  };

  const handleAssignTerritory = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedTerritoryId) return alert("Please select territory");
    if (!selectedFranchiseId) return alert("Please select franchise member");

    const res = await fetch(`${API}/territories/${selectedTerritoryId}/assign`, {
      method: "PUT",
      headers,
      body: JSON.stringify({ franchiseId: selectedFranchiseId }),
    });

    const data = await res.json();

    if (res.ok && data.success) {
      setSuccessMsg("Franchise assigned successfully");
      setSelectedTerritoryId("");
      setSelectedFranchiseId("");
      await fetchData();
    } else {
      alert(data.message || "Assignment failed");
    }
  };

  const handleRemoveAssignment = async (territoryId: string) => {
    const res = await fetch(`${API}/territories/${territoryId}/remove-assignment`, {
      method: "PUT",
      headers,
    });

    const data = await res.json();

    if (res.ok && data.success) {
      setSuccessMsg("Assignment removed successfully");
      await fetchData();
    } else {
      alert(data.message || "Remove assignment failed");
    }
  };

  const isTableTab = ["states", "districts", "mandals", "pincodes"].includes(activeSubTab);

  const renderTable = (items: Territory[], title: string) => (
    <div className="bg-card border border-border/80 rounded-2xl overflow-hidden shadow-sm space-y-0">
      <div className="px-5 py-4 border-b border-border/60 bg-secondary/10 flex justify-between items-center">
        <span className="text-xs font-bold uppercase tracking-wider">{title}</span>
        <span className="text-[10px] text-muted-foreground font-semibold px-2 py-0.5 bg-secondary/50 rounded-md">
          {items.length} records found
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-xs text-left">
          <thead className="bg-secondary/40">
            <tr>
              <th className="p-3">Level</th>
              <th className="p-3">Name</th>
              <th className="p-3">State</th>
              <th className="p-3">District</th>
              <th className="p-3">Mandal</th>
              <th className="p-3">Pincode</th>
              <th className="p-3">Assigned Franchise</th>
              <th className="p-3">Status</th>
              <th className="p-3">Actions</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-border">
            {items.map((item) => (
              <tr key={item._id} className="hover:bg-secondary/10 transition-colors">
                <td className="p-3 font-semibold">{item.level}</td>
                <td className="p-3 font-semibold text-foreground">{item.name}</td>
                <td className="p-3">{item.state || "-"}</td>
                <td className="p-3">{item.district || "-"}</td>
                <td className="p-3">{item.mandal || "-"}</td>
                <td className="p-3 font-mono">{item.pincode || "-"}</td>
                <td className="p-3">{getFranchiseName(item.franchiseId)}</td>
                <td className="p-3">
                  <span
                    className={`px-2 py-0.5 rounded-lg text-[10px] font-bold ${item.status === "Active"
                      ? "bg-emerald-500/10 text-emerald-500"
                      : "bg-red-500/10 text-red-500"
                      }`}
                  >
                    {item.status}
                  </span>
                </td>
                <td className="p-3">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {/* Edit Button */}
                    <button
                      onClick={() => openEditModal(item)}
                      className="px-2 py-1 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 text-[10px] font-bold flex items-center gap-1 transition-colors"
                      title="Edit Territory"
                    >
                      <Edit2 size={12} />
                      Edit
                    </button>

                    {/* Delete Button */}
                    <button
                      onClick={() => handleDeleteTerritory(item)}
                      className="px-2 py-1 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500/20 text-[10px] font-bold flex items-center gap-1 transition-colors"
                      title="Delete Territory"
                    >
                      <Trash2 size={12} />
                      Delete
                    </button>

                    {/* Remove Assignment Button */}
                    {item.franchiseId && (
                      <button
                        onClick={() => handleRemoveAssignment(item._id)}
                        className="px-2 py-1 rounded-lg bg-amber-500/10 text-amber-500 hover:bg-amber-500/20 text-[10px] font-bold flex items-center gap-1 transition-colors"
                        title="Remove Franchise Assignment"
                      >
                        <XCircle size={12} />
                        Unassign
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}

            {items.length === 0 && (
              <tr>
                <td colSpan={9} className="p-8 text-center text-muted-foreground">
                  No matching backend territory records found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="bg-card border border-border/80 rounded-2xl p-8 text-center text-xs text-muted-foreground">
        Loading backend data...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {errorMsg && (
        <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-500 rounded-xl text-xs font-semibold">
          {errorMsg}
        </div>
      )}

      {/* Sub tabs navigation */}
      <div className="flex gap-2 flex-wrap bg-card border border-border/60 p-2 rounded-2xl shadow-sm">
        {[
          ["states", "States"],
          ["districts", "Districts"],
          ["mandals", "Mandals"],
          ["pincodes", "Pincodes"],
          ["assignment", "Assign Franchise"],
          ["add-territory", "Add Territory"],
        ].map(([key, label]) => (
          <button
            key={key}
            onClick={() => {
              setActiveSubTab(key as any);
              setSuccessMsg("");
            }}
            className={`px-4 py-2 rounded-xl text-xs font-semibold border transition-all ${activeSubTab === key
              ? "bg-primary text-primary-foreground border-primary shadow-xs"
              : "bg-transparent text-muted-foreground border-transparent hover:bg-secondary/60"
              }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Interactive Filter Options Bar (Alphabetical & State-based Filtering) */}
      {isTableTab && (
        <div className="bg-card border border-border/80 rounded-2xl p-4 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-foreground">
              <Filter size={14} className="text-primary" />
              <span>Filter Territory Records</span>
            </div>
            {(filterState || filterDistrict || filterMandal || searchQuery) && (
              <button
                onClick={clearAllFilters}
                className="text-[11px] font-medium text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
              >
                <RotateCcw size={12} />
                Clear Filters
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
            {/* Search Input */}
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search territory name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 border border-border rounded-xl bg-secondary/15 focus:outline-none focus:border-primary transition-colors text-xs"
              />
            </div>

            {/* State Filter Dropdown (Alphabetical) */}
            <div>
              <select
                value={filterState}
                onChange={(e) => handleStateFilterChange(e.target.value)}
                className="w-full p-2 border border-border rounded-xl bg-secondary/15 focus:outline-none focus:border-primary transition-colors text-xs"
              >
                <option value="">All States ({uniqueStates.length})</option>
                {uniqueStates.map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </select>
            </div>

            {/* District Filter Dropdown (Filtered by State & Sorted Alphabetically) */}
            <div>
              <select
                value={filterDistrict}
                onChange={(e) => handleDistrictFilterChange(e.target.value)}
                className="w-full p-2 border border-border rounded-xl bg-secondary/15 focus:outline-none focus:border-primary transition-colors text-xs"
              >
                <option value="">
                  {filterState
                    ? `Districts in ${filterState} (${availableFilterDistricts.length})`
                    : `All Districts (${availableFilterDistricts.length})`}
                </option>
                {availableFilterDistricts.map((dst) => (
                  <option key={dst} value={dst}>
                    {dst}
                  </option>
                ))}
              </select>
            </div>

            {/* Mandal Filter Dropdown (Filtered by State & District & Sorted Alphabetically) */}
            <div>
              <select
                value={filterMandal}
                onChange={(e) => setFilterMandal(e.target.value)}
                className="w-full p-2 border border-border rounded-xl bg-secondary/15 focus:outline-none focus:border-primary transition-colors text-xs font-normal"
                disabled={activeSubTab === "states" || activeSubTab === "districts"}
              >
                <option value="">
                  {filterDistrict
                    ? `Mandals in ${filterDistrict} (${availableFilterMandals.length})`
                    : `All Mandals (${availableFilterMandals.length})`}
                </option>
                {availableFilterMandals.map((mdl) => (
                  <option key={mdl} value={mdl}>
                    {mdl}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}

      {successMsg && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 rounded-xl flex items-center gap-2 text-xs font-semibold">
          <CheckCircle2 size={16} />
          {successMsg}
        </div>
      )}

      {activeSubTab === "states" && renderTable(displayedStates, "States")}
      {activeSubTab === "districts" && renderTable(displayedDistricts, "Districts")}
      {activeSubTab === "mandals" && renderTable(displayedMandals, "Mandals")}
      {activeSubTab === "pincodes" && renderTable(displayedPincodes, "Pincodes")}

      {/* Add Territory Sub-Tab */}
      {activeSubTab === "add-territory" && (
        <div className="bg-card border border-border/80 rounded-2xl p-5 shadow-sm max-w-xl mx-auto space-y-4">
          <div className="flex items-center gap-2 border-b border-border pb-3">
            <Layers className="text-primary" size={18} />
            <h3 className="text-xs font-bold uppercase">Register Territory</h3>
          </div>

          <form onSubmit={handleAddTerritory} className="space-y-4 text-xs">
            <div>
              <label className="block text-[11px] font-semibold text-muted-foreground mb-1">
                Territory Level
              </label>
              <select
                value={level}
                onChange={(e) => {
                  setLevel(e.target.value as TerritoryLevel);
                  setAddDistrict("");
                  setAddMandal("");
                  setAddPincode("");
                }}
                className="w-full p-2.5 border border-border rounded-xl bg-secondary/15 focus:outline-none focus:border-primary transition-colors text-xs"
              >
                <option value="State">State</option>
                <option value="District">District</option>
                <option value="Mandal">Mandal</option>
                <option value="Pincode">Pincode</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-muted-foreground mb-1">
                State Name
              </label>
              {level === "State" ? (
                <input
                  value={addState}
                  onChange={(e) => setAddState(e.target.value)}
                  placeholder="Enter State name (e.g. Telangana)"
                  className="w-full p-2.5 border border-border rounded-xl bg-secondary/15 focus:outline-none focus:border-primary transition-colors text-xs"
                />
              ) : (
                <select
                  value={addState}
                  onChange={(e) => {
                    setAddState(e.target.value);
                    setAddDistrict("");
                    setAddMandal("");
                  }}
                  className="w-full p-2.5 border border-border rounded-xl bg-secondary/15 focus:outline-none focus:border-primary transition-colors text-xs"
                >
                  <option value="">Select State</option>
                  {stateOptionsForAdd.map((st) => (
                    <option key={st} value={st}>
                      {st}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {level !== "State" && (
              <div>
                <label className="block text-[11px] font-semibold text-muted-foreground mb-1">
                  District Name
                </label>
                {level === "District" ? (
                  <input
                    value={addDistrict}
                    onChange={(e) => setAddDistrict(e.target.value)}
                    placeholder="Enter District name (e.g. Hyderabad)"
                    className="w-full p-2.5 border border-border rounded-xl bg-secondary/15 focus:outline-none focus:border-primary transition-colors text-xs"
                  />
                ) : (
                  <select
                    value={addDistrict}
                    onChange={(e) => {
                      setAddDistrict(e.target.value);
                      setAddMandal("");
                    }}
                    className="w-full p-2.5 border border-border rounded-xl bg-secondary/15 focus:outline-none focus:border-primary transition-colors text-xs"
                    disabled={!addState}
                  >
                    <option value="">
                      {addState ? `Select District in ${addState}` : "Select state first"}
                    </option>
                    {availableDistricts.map((d) => (
                      <option key={d.district} value={d.district}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            )}

            {(level === "Mandal" || level === "Pincode") && (
              <div>
                <label className="block text-[11px] font-semibold text-muted-foreground mb-1">
                  Mandal Name
                </label>
                {level === "Mandal" ? (
                  <input
                    value={addMandal}
                    onChange={(e) => setAddMandal(e.target.value)}
                    placeholder="Enter Mandal name (e.g. Secunderabad)"
                    className="w-full p-2.5 border border-border rounded-xl bg-secondary/15 focus:outline-none focus:border-primary transition-colors text-xs"
                  />
                ) : (
                  <select
                    value={addMandal}
                    onChange={(e) => setAddMandal(e.target.value)}
                    className="w-full p-2.5 border border-border rounded-xl bg-secondary/15 focus:outline-none focus:border-primary transition-colors text-xs"
                    disabled={!addDistrict}
                  >
                    <option value="">
                      {addDistrict ? `Select Mandal in ${addDistrict}` : "Select district first"}
                    </option>
                    {availableMandals.map((m) => (
                      <option key={m.mandal} value={m.mandal}>
                        {m.name}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            )}

            {level === "Pincode" && (
              <div>
                <label className="block text-[11px] font-semibold text-muted-foreground mb-1">
                  Pincode
                </label>
                <input
                  value={addPincode}
                  onChange={(e) => setAddPincode(e.target.value)}
                  placeholder="Enter 6-digit Pincode (e.g. 500003)"
                  className="w-full p-2.5 border border-border rounded-xl bg-secondary/15 font-mono focus:outline-none focus:border-primary transition-colors text-xs"
                />
              </div>
            )}

            <button className="w-full py-2.5 bg-primary text-primary-foreground font-bold rounded-xl hover:opacity-90 transition-opacity">
              Create Territory
            </button>
          </form>
        </div>
      )}

      {/* Assign Franchise Sub-Tab */}
      {activeSubTab === "assignment" && (
        <div className="bg-card border border-border/80 rounded-2xl p-5 shadow-sm max-w-xl mx-auto space-y-4">
          <div className="flex items-center gap-2 border-b border-border pb-3">
            <UserPlus className="text-primary" size={18} />
            <h3 className="text-xs font-bold uppercase">Assign Backend Franchise</h3>
          </div>

          <form onSubmit={handleAssignTerritory} className="space-y-4 text-xs">
            <div>
              <label className="block text-[11px] font-semibold text-muted-foreground mb-1">
                Select Target Territory
              </label>
              <select
                value={selectedTerritoryId}
                onChange={(e) => {
                  setSelectedTerritoryId(e.target.value);
                  setSelectedFranchiseId("");
                }}
                className="w-full p-2.5 border border-border rounded-xl bg-secondary/15 focus:outline-none focus:border-primary transition-colors text-xs"
              >
                <option value="">Select Territory</option>
                {sortedTerritoriesForAssign.map((t) => (
                  <option key={t._id} value={t._id}>
                    {t.level} - {t.name} ({t.state}
                    {t.district ? `, ${t.district}` : ""})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-muted-foreground mb-1">
                Select Matching Franchise
              </label>
              <select
                value={selectedFranchiseId}
                onChange={(e) => setSelectedFranchiseId(e.target.value)}
                className="w-full p-2.5 border border-border rounded-xl bg-secondary/15 focus:outline-none focus:border-primary transition-colors text-xs"
                disabled={!selectedTerritoryId}
              >
                <option value="">
                  {selectedTerritoryId ? "Select Matching Franchise" : "Select territory first"}
                </option>
                {filteredFranchises.map((f: any) => {
                  const ownerName = f.ownerName || f.name || f.contactPerson || "";
                  const bName = f.businessName || "";
                  const displayName = ownerName && bName
                    ? `${ownerName} (${bName})`
                    : ownerName || bName || f.email || f.mobile || "Unnamed Franchisee";
                  const code = f.franchiseCode ? ` [${f.franchiseCode}]` : "";

                  return (
                    <option key={f._id} value={f._id}>
                      {displayName}{code}
                    </option>
                  );
                })}
              </select>
            </div>

            <button className="w-full py-2.5 bg-primary text-primary-foreground font-bold rounded-xl hover:opacity-90 transition-opacity">
              Assign Franchise
            </button>
          </form>
        </div>
      )}

      {/* Edit Territory Modal */}
      {editingTerritory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-card border border-border/80 rounded-2xl p-6 shadow-2xl max-w-lg w-full space-y-4 max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in duration-150">
            <div className="flex justify-between items-center border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <Edit2 className="text-primary" size={18} />
                <h3 className="text-sm font-bold uppercase tracking-wider text-foreground">
                  Edit Territory ({editingTerritory.level})
                </h3>
              </div>
              <button
                onClick={closeEditModal}
                className="p-1 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleUpdateTerritory} className="space-y-4 text-xs">
              <div>
                <label className="block text-[11px] font-semibold text-muted-foreground mb-1">
                  Territory Name
                </label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full p-2.5 border border-border rounded-xl bg-secondary/15 focus:outline-none focus:border-primary transition-colors text-xs"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-muted-foreground mb-1">
                  State
                </label>
                <input
                  type="text"
                  value={editState}
                  onChange={(e) => setEditState(e.target.value)}
                  className="w-full p-2.5 border border-border rounded-xl bg-secondary/15 focus:outline-none focus:border-primary transition-colors text-xs"
                  required
                />
              </div>

              {editingTerritory.level !== "State" && (
                <div>
                  <label className="block text-[11px] font-semibold text-muted-foreground mb-1">
                    District
                  </label>
                  <input
                    type="text"
                    value={editDistrict}
                    onChange={(e) => setEditDistrict(e.target.value)}
                    className="w-full p-2.5 border border-border rounded-xl bg-secondary/15 focus:outline-none focus:border-primary transition-colors text-xs"
                    required
                  />
                </div>
              )}

              {(editingTerritory.level === "Mandal" || editingTerritory.level === "Pincode") && (
                <div>
                  <label className="block text-[11px] font-semibold text-muted-foreground mb-1">
                    Mandal
                  </label>
                  <input
                    type="text"
                    value={editMandal}
                    onChange={(e) => setEditMandal(e.target.value)}
                    className="w-full p-2.5 border border-border rounded-xl bg-secondary/15 focus:outline-none focus:border-primary transition-colors text-xs"
                    required
                  />
                </div>
              )}

              {editingTerritory.level === "Pincode" && (
                <div>
                  <label className="block text-[11px] font-semibold text-muted-foreground mb-1">
                    Pincode
                  </label>
                  <input
                    type="text"
                    value={editPincode}
                    onChange={(e) => setEditPincode(e.target.value)}
                    className="w-full p-2.5 border border-border rounded-xl bg-secondary/15 font-mono focus:outline-none focus:border-primary transition-colors text-xs"
                    required
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-muted-foreground mb-1">
                    Status
                  </label>
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value as Status)}
                    className="w-full p-2.5 border border-border rounded-xl bg-secondary/15 focus:outline-none focus:border-primary transition-colors text-xs"
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-muted-foreground mb-1">
                    Density
                  </label>
                  <select
                    value={editDensity}
                    onChange={(e) => setEditDensity(e.target.value as Density)}
                    className="w-full p-2.5 border border-border rounded-xl bg-secondary/15 focus:outline-none focus:border-primary transition-colors text-xs"
                  >
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-muted-foreground mb-1">
                  Target Coverage
                </label>
                <input
                  type="text"
                  value={editTargetCoverage}
                  onChange={(e) => setEditTargetCoverage(e.target.value)}
                  placeholder="e.g. 100%"
                  className="w-full p-2.5 border border-border rounded-xl bg-secondary/15 focus:outline-none focus:border-primary transition-colors text-xs"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-muted-foreground mb-1">
                  Assigned Franchise Member
                </label>
                <select
                  value={editFranchiseId}
                  onChange={(e) => setEditFranchiseId(e.target.value)}
                  className="w-full p-2.5 border border-border rounded-xl bg-secondary/15 focus:outline-none focus:border-primary transition-colors text-xs"
                >
                  <option value="">No Franchise Assigned</option>
                  {franchises.map((f: any) => {
                    const ownerName = f.ownerName || f.name || f.contactPerson || "";
                    const bName = f.businessName || "";
                    const displayName = ownerName && bName
                      ? `${ownerName} (${bName})`
                      : ownerName || bName || f.email || f.mobile || "Unnamed Franchisee";
                    const code = f.franchiseCode ? ` [${f.franchiseCode}]` : "";
                    const lvl = f.franchiseLevel ? ` (${String(f.franchiseLevel).toUpperCase()} - ${f.state || ''})` : "";

                    return (
                      <option key={f._id} value={f._id}>
                        {displayName}{code}{lvl}
                      </option>
                    );
                  })}
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-border">
                <button
                  type="button"
                  onClick={closeEditModal}
                  className="px-4 py-2 rounded-xl bg-secondary/60 text-muted-foreground hover:text-foreground font-semibold text-xs transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-primary text-primary-foreground font-bold text-xs flex items-center gap-1 hover:opacity-90 transition-opacity"
                >
                  <Save size={14} />
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};