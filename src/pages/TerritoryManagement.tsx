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
  Copy,
  Check,
} from "lucide-react";

type TerritoryLevel = "State" | "District" | "Mandal" | "Village" | "Pincode";
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
  franchiseLevel?: "state" | "district" | "mandal" | "village";
  state?: string;
  district?: string;
  mandal?: string;
  village?: string;
}

interface Territory {
  _id: string;
  ftid?: string;
  codeNumber?: string;
  level: TerritoryLevel;
  name: string;
  state: string;
  district?: string;
  mandal?: string;
  village?: string;
  pincode?: string;
  parentFtid?: string;
  franchiseId?: Franchise | string | null;
  franchiseStatus?: "ACTIVE" | "VACANT" | "SUSPENDED";
  currentFranchisee?: {
    masterUserId?: string;
    name?: string;
    phone?: string;
    email?: string;
    assignedAt?: string;
  };
  status: Status;
  density: Density;
  targetCoverage: string;
}

const API = "https://server.apexbee.in/api/admin";

export const TerritoryManagement: React.FC = () => {
  const [activeSubTab, setActiveSubTab] = useState<
    "states" | "districts" | "mandals" | "villages" | "pincodes" | "assignment" | "add-territory"
  >("states");

  const [territories, setTerritories] = useState<Territory[]>([]);
  const [franchises, setFranchises] = useState<Franchise[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [copiedFtid, setCopiedFtid] = useState<string | null>(null);

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
  const [addVillage, setAddVillage] = useState("");
  const [addPincode, setAddPincode] = useState("");
  const [addCodeNumber, setAddCodeNumber] = useState("001");
  const [addCustomFtid, setAddCustomFtid] = useState("");
  const [addDensity, setAddDensity] = useState<Density>("Medium");
  const [addTargetCoverage, setAddTargetCoverage] = useState("100%");
  const [addStatus, setAddStatus] = useState<Status>("Active");

  // Edit Territory Modal States
  const [editingTerritory, setEditingTerritory] = useState<Territory | null>(null);
  const [editFtid, setEditFtid] = useState("");
  const [editCodeNumber, setEditCodeNumber] = useState("001");
  const [editName, setEditName] = useState("");
  const [editState, setEditState] = useState("");
  const [editDistrict, setEditDistrict] = useState("");
  const [editMandal, setEditMandal] = useState("");
  const [editVillage, setEditVillage] = useState("");
  const [editPincode, setEditPincode] = useState("");
  const [editStatus, setEditStatus] = useState<Status>("Active");
  const [editFranchiseStatus, setEditFranchiseStatus] = useState<"ACTIVE" | "VACANT" | "SUSPENDED">("VACANT");
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

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedFtid(text);
    setTimeout(() => setCopiedFtid(null), 2000);
  };

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

  const villages = useMemo(() => {
    return territories
      .filter((t) => t.level === "Village")
      .sort((a, b) => (a.name || a.village || "").localeCompare(b.name || b.village || "", undefined, { sensitivity: "base" }));
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
        t.ftid?.toLowerCase().includes(searchQuery.toLowerCase()) ||
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
        t.ftid?.toLowerCase().includes(searchQuery.toLowerCase()) ||
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
        t.ftid?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.mandal?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.district?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.state?.toLowerCase().includes(searchQuery.toLowerCase());
      return matchState && matchDistrict && matchMandal && matchSearch;
    });
  }, [mandals, filterState, filterDistrict, filterMandal, searchQuery]);

  const displayedVillages = useMemo(() => {
    return villages.filter((t) => {
      const matchState = !filterState || t.state?.toLowerCase() === filterState.toLowerCase();
      const matchDistrict = !filterDistrict || t.district?.toLowerCase() === filterDistrict.toLowerCase();
      const matchMandal = !filterMandal || t.mandal?.toLowerCase() === filterMandal.toLowerCase();
      const matchSearch =
        !searchQuery ||
        t.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.village?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.ftid?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.mandal?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.district?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.state?.toLowerCase().includes(searchQuery.toLowerCase());
      return matchState && matchDistrict && matchMandal && matchSearch;
    });
  }, [villages, filterState, filterDistrict, filterMandal, searchQuery]);

  const displayedPincodes = useMemo(() => {
    return pincodes.filter((t) => {
      const matchState = !filterState || t.state?.toLowerCase() === filterState.toLowerCase();
      const matchDistrict = !filterDistrict || t.district?.toLowerCase() === filterDistrict.toLowerCase();
      const matchMandal = !filterMandal || t.mandal?.toLowerCase() === filterMandal.toLowerCase();
      const matchSearch =
        !searchQuery ||
        t.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.ftid?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.pincode?.includes(searchQuery) ||
        t.mandal?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.district?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.state?.toLowerCase().includes(searchQuery.toLowerCase());
      return matchState && matchDistrict && matchMandal && matchSearch;
    });
  }, [pincodes, filterState, filterDistrict, filterMandal, searchQuery]);

  // Add Territory Form Helpers
  const stateOptionsForAdd = useMemo(() => {
    return states.map((s) => ({
      name: s.name || s.state,
      ftid: s.ftid || `APX-SF-${String(s.codeNumber || "001").padStart(3, "0")}`,
    }));
  }, [states]);

  const availableDistrictsForAdd = useMemo(() => {
    return districts
      .filter((d) => d.state?.toLowerCase() === addState.toLowerCase())
      .map((d) => ({
        district: d.district || d.name,
        name: d.name || d.district,
        ftid: d.ftid || `APX-SF001-DF-${String(d.codeNumber || "001").padStart(3, "0")}`,
      }));
  }, [districts, addState]);

  const availableMandalsForAdd = useMemo(() => {
    return mandals
      .filter(
        (m) =>
          m.state?.toLowerCase() === addState.toLowerCase() &&
          m.district?.toLowerCase() === addDistrict.toLowerCase()
      )
      .map((m) => ({
        mandal: m.mandal || m.name,
        name: m.name || m.mandal,
        ftid: m.ftid || `APX-SF001-DF001-MF-${String(m.codeNumber || "001").padStart(3, "0")}`,
      }));
  }, [mandals, addState, addDistrict]);

  // Live Auto FTID Computation for Add Form
  const previewAddFtid = useMemo(() => {
    const pad = String(addCodeNumber || "1").padStart(3, "0");

    if (level === "State") {
      return `APX-SF-${pad}`;
    }

    if (level === "District") {
      const parentState = states.find((s) => (s.name || s.state)?.toLowerCase() === addState.toLowerCase());
      const stateFtid = parentState?.ftid || "APX-SF-001";
      const sfNum = stateFtid.replace("APX-SF-", "").replace("APX-SF", "");
      return `APX-SF${sfNum}-DF-${pad}`;
    }

    if (level === "Mandal") {
      const parentDistrict = districts.find(
        (d) =>
          d.state?.toLowerCase() === addState.toLowerCase() &&
          (d.district || d.name)?.toLowerCase() === addDistrict.toLowerCase()
      );
      const districtFtid = parentDistrict?.ftid || "APX-SF001-DF-001";
      const p = districtFtid.replace("APX-", "").replace(/-/g, "");
      return `APX-${p}-MF-${pad}`;
    }

    if (level === "Village") {
      const parentMandal = mandals.find(
        (m) =>
          m.state?.toLowerCase() === addState.toLowerCase() &&
          m.district?.toLowerCase() === addDistrict.toLowerCase() &&
          (m.mandal || m.name)?.toLowerCase() === addMandal.toLowerCase()
      );
      const mandalFtid = parentMandal?.ftid || "APX-SF001-DF001-MF-001";
      const p = mandalFtid.replace("APX-", "").replace(/-/g, "");
      return `APX-${p}-VF-${pad}`;
    }

    if (level === "Pincode") {
      const parentMandal = mandals.find(
        (m) =>
          m.state?.toLowerCase() === addState.toLowerCase() &&
          m.district?.toLowerCase() === addDistrict.toLowerCase() &&
          (m.mandal || m.name)?.toLowerCase() === addMandal.toLowerCase()
      );
      const mandalFtid = parentMandal?.ftid || "APX-SF001-DF001-MF-001";
      const p = mandalFtid.replace("APX-", "").replace(/-/g, "");
      return `APX-${p}-PIN-${pad}`;
    }

    return "APX-SF-001";
  }, [level, addState, addDistrict, addMandal, addCodeNumber, states, districts, mandals]);

  // Live Auto FTID Computation for Edit Modal
  const previewEditFtid = useMemo(() => {
    if (!editingTerritory) return "";
    const pad = String(editCodeNumber || "1").padStart(3, "0");

    if (editingTerritory.level === "State") {
      return `APX-SF-${pad}`;
    }

    const parentFtid = editingTerritory.parentFtid || "";
    if (editingTerritory.level === "District") {
      const sfNum = (parentFtid || "APX-SF-001").replace("APX-SF-", "").replace("APX-SF", "");
      return `APX-SF${sfNum}-DF-${pad}`;
    }

    if (editingTerritory.level === "Mandal") {
      const p = (parentFtid || "APX-SF001-DF-001").replace("APX-", "").replace(/-/g, "");
      return `APX-${p}-MF-${pad}`;
    }

    if (editingTerritory.level === "Village") {
      const p = (parentFtid || "APX-SF001-DF001-MF-001").replace("APX-", "").replace(/-/g, "");
      return `APX-${p}-VF-${pad}`;
    }

    return editFtid;
  }, [editingTerritory, editCodeNumber, editFtid]);

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
      if (selectedTerritory.level === "Village") {
        return (
          (f.franchiseLevel === "village" || f.franchiseLevel === "mandal") &&
          f.state?.toLowerCase() === selectedTerritory.state?.toLowerCase() &&
          f.district?.toLowerCase() === selectedTerritory.district?.toLowerCase()
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

  const getFranchiseName = (franchise: Territory["franchiseId"], item?: Territory) => {
    if (item?.currentFranchisee?.name) {
      const master = item.currentFranchisee.masterUserId ? ` (Master ID: ${item.currentFranchisee.masterUserId})` : "";
      return `${item.currentFranchisee.name}${master}`;
    }
    if (!franchise || typeof franchise === "string") return "🟡 VACANT";
    const f = franchise as any;
    const ownerName = f.ownerName || f.name || f.contactPerson || "";
    const bName = f.businessName || "";
    if (ownerName && bName) return `${ownerName} (${bName})`;
    return ownerName || bName || f.email || f.mobile || f.franchiseCode || "🟡 VACANT";
  };

  const resetAddForm = () => {
    setAddState("");
    setAddDistrict("");
    setAddMandal("");
    setAddVillage("");
    setAddPincode("");
    setAddCodeNumber("001");
    setAddCustomFtid("");
    setAddDensity("Medium");
    setAddTargetCoverage("100%");
    setAddStatus("Active");
  };

  // Open Edit Modal
  const openEditModal = (item: Territory) => {
    setEditingTerritory(item);
    setEditFtid(item.ftid || "");
    setEditCodeNumber(item.codeNumber || "001");
    setEditName(item.name || "");
    setEditState(item.state || "");
    setEditDistrict(item.district || "");
    setEditMandal(item.mandal || "");
    setEditVillage(item.village || "");
    setEditPincode(item.pincode || "");
    setEditStatus(item.status || "Active");
    setEditFranchiseStatus(item.franchiseStatus || (item.franchiseId ? "ACTIVE" : "VACANT"));
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

      const finalFtid = editFtid.trim() || previewEditFtid;

      const payload = {
        ftid: finalFtid,
        codeNumber: editCodeNumber.padStart(3, "0"),
        name: editName.trim(),
        state: editState.trim(),
        district: editingTerritory.level !== "State" ? editDistrict.trim() : "",
        mandal: editingTerritory.level === "Mandal" || editingTerritory.level === "Village" || editingTerritory.level === "Pincode" ? editMandal.trim() : "",
        village: editingTerritory.level === "Village" ? (editVillage.trim() || editName.trim()) : "",
        pincode: editingTerritory.level === "Pincode" ? editPincode.trim() : "",
        status: editStatus,
        franchiseStatus: editFranchiseStatus,
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
        setSuccessMsg(`Territory "${editName}" [${finalFtid}] updated successfully`);
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
    const confirmText = `Are you sure you want to delete territory "${item.name}" [${item.ftid || item.level}]?`;
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
    if ((level === "Mandal" || level === "Village" || level === "Pincode") && !addMandal.trim()) return alert("Mandal is required");
    if (level === "Village" && !addVillage.trim()) return alert("Village Name is required");
    if (level === "Pincode" && !addPincode.trim()) return alert("Pincode is required");

    const finalFtid = addCustomFtid.trim() || previewAddFtid;

    const payload = {
      level,
      ftid: finalFtid,
      codeNumber: addCodeNumber.padStart(3, "0"),
      state: addState.trim(),
      district: level !== "State" ? addDistrict.trim() : "",
      mandal: level === "Mandal" || level === "Village" || level === "Pincode" ? addMandal.trim() : "",
      village: level === "Village" ? addVillage.trim() : "",
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
      setSuccessMsg(`${level} [${finalFtid}] created successfully`);
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

  const isTableTab = ["states", "districts", "mandals", "villages", "pincodes"].includes(activeSubTab);

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
              <th className="p-3">FTID Code</th>
              <th className="p-3">Territory Name</th>
              <th className="p-3">Hierarchy Jurisdiction</th>
              <th className="p-3">Franchisee / Operator</th>
              <th className="p-3 text-center">Franchise Status</th>
              <th className="p-3 text-center">Status</th>
              <th className="p-3 text-center">Actions</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-border">
            {items.map((item) => (
              <tr key={item._id} className="hover:bg-secondary/10 transition-colors">
                {/* FTID Badge */}
                <td className="p-3">
                  <div className="inline-flex items-center gap-1.5 bg-primary/10 border border-primary/20 text-primary px-2.5 py-1 rounded-lg font-mono font-black text-[11px]">
                    <span>{item.ftid || `APX-${item.level.substring(0, 2).toUpperCase()}-${String(item.codeNumber || "001").padStart(3, "0")}`}</span>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(item.ftid || "")}
                      className="hover:text-foreground transition-colors p-0.5"
                      title="Copy FTID"
                    >
                      {copiedFtid === item.ftid ? <Check size={11} className="text-emerald-500" /> : <Copy size={11} />}
                    </button>
                  </div>
                </td>

                {/* Name */}
                <td className="p-3 font-bold text-foreground">
                  <div>{item.name}</div>
                  <div className="text-[10px] text-muted-foreground font-medium">Level: {item.level} ({item.codeNumber || "001"})</div>
                </td>

                {/* Hierarchy Jurisdiction */}
                <td className="p-3 text-muted-foreground">
                  <div className="space-y-0.5 text-[11px]">
                    <div><span className="font-semibold text-foreground">State:</span> {item.state || "-"}</div>
                    {item.district && <div><span className="font-semibold text-foreground">District:</span> {item.district}</div>}
                    {item.mandal && <div><span className="font-semibold text-foreground">Mandal:</span> {item.mandal}</div>}
                    {item.village && <div><span className="font-semibold text-foreground">Village:</span> {item.village}</div>}
                    {item.pincode && <div><span className="font-semibold text-foreground">PIN:</span> {item.pincode}</div>}
                  </div>
                </td>

                {/* Current Franchisee */}
                <td className="p-3">
                  <div className="font-semibold text-foreground">
                    {getFranchiseName(item.franchiseId, item)}
                  </div>
                </td>

                {/* Franchise Vacancy Status */}
                <td className="p-3 text-center">
                  <span
                    className={`px-2 py-0.5 rounded-lg text-[10px] font-black border ${item.franchiseId || item.currentFranchisee?.name
                      ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/30"
                      : "bg-amber-500/10 text-amber-600 border-amber-500/30"
                      }`}
                  >
                    {item.franchiseId || item.currentFranchisee?.name ? "🟢 ACTIVE" : "🟡 VACANT"}
                  </span>
                </td>

                {/* Status */}
                <td className="p-3 text-center">
                  <span
                    className={`px-2 py-0.5 rounded-lg text-[10px] font-bold ${item.status === "Active"
                      ? "bg-emerald-500/10 text-emerald-500"
                      : "bg-red-500/10 text-red-500"
                      }`}
                  >
                    {item.status}
                  </span>
                </td>

                {/* Actions */}
                <td className="p-3 text-center">
                  <div className="flex items-center justify-center gap-1.5 flex-wrap">
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
                        Vacate
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}

            {items.length === 0 && (
              <tr>
                <td colSpan={7} className="p-8 text-center text-muted-foreground">
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
        Loading backend territory data...
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
          ["states", "States (SF)"],
          ["districts", "Districts (DF)"],
          ["mandals", "Mandals (MF)"],
          ["villages", "Villages (VF)"],
          ["pincodes", "Pincodes"],
          ["assignment", "Assign Franchise"],
          ["add-territory", "+ Add Territory"],
        ].map(([key, label]) => (
          <button
            key={key}
            onClick={() => {
              setActiveSubTab(key as any);
              setSuccessMsg("");
            }}
            className={`px-4 py-2 rounded-xl text-xs font-semibold border transition-all ${activeSubTab === key
              ? "bg-primary text-primary-foreground border-primary shadow-xs font-bold"
              : "bg-transparent text-muted-foreground border-transparent hover:bg-secondary/60"
              }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Interactive Filter Options Bar */}
      {isTableTab && (
        <div className="bg-card border border-border/80 rounded-2xl p-4 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-foreground">
              <Filter size={14} className="text-primary" />
              <span>Filter Territory Records by Jurisdiction</span>
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
                placeholder="Search FTID or name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 border border-border rounded-xl bg-secondary/15 focus:outline-none focus:border-primary transition-colors text-xs"
              />
            </div>

            {/* State Filter Dropdown */}
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

            {/* District Filter Dropdown */}
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

            {/* Mandal Filter Dropdown */}
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

      {activeSubTab === "states" && renderTable(displayedStates, "States (State Franchises - SF)")}
      {activeSubTab === "districts" && renderTable(displayedDistricts, "Districts (District Franchises - DF)")}
      {activeSubTab === "mandals" && renderTable(displayedMandals, "Mandals (Mandal Franchises - MF)")}
      {activeSubTab === "villages" && renderTable(displayedVillages, "Villages / Gram Panchayats (Village Franchises - VF)")}
      {activeSubTab === "pincodes" && renderTable(displayedPincodes, "Pincodes")}

      {/* Add Territory Sub-Tab */}
      {activeSubTab === "add-territory" && (
        <div className="bg-card border border-border/80 rounded-2xl p-6 shadow-sm max-w-2xl mx-auto space-y-5">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <div className="flex items-center gap-2">
              <Layers className="text-primary" size={20} />
              <h3 className="text-sm font-bold uppercase tracking-wider">Register New Territory</h3>
            </div>
            <div className="text-[11px] font-mono font-bold text-primary bg-primary/10 border border-primary/20 px-3 py-1 rounded-xl">
              Preview FTID: {previewAddFtid}
            </div>
          </div>

          <form onSubmit={handleAddTerritory} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                    setAddVillage("");
                    setAddPincode("");
                  }}
                  className="w-full p-2.5 border border-border rounded-xl bg-secondary/15 focus:outline-none focus:border-primary transition-colors text-xs font-bold"
                >
                  <option value="State">State (SF)</option>
                  <option value="District">District (DF)</option>
                  <option value="Mandal">Mandal (MF)</option>
                  <option value="Village">Village / Gram Panchayat (VF)</option>
                  <option value="Pincode">Pincode</option>
                </select>
              </div>

              {/* Territory 3-digit Code Number (e.g. 001) */}
              <div>
                <label className="block text-[11px] font-semibold text-muted-foreground mb-1">
                  Territory Number (3 Digits)
                </label>
                <input
                  type="text"
                  value={addCodeNumber}
                  onChange={(e) => setAddCodeNumber(e.target.value.replace(/[^0-9]/g, "").slice(0, 3))}
                  placeholder="e.g. 001"
                  className="w-full p-2.5 border border-border rounded-xl bg-secondary/15 font-mono font-bold focus:outline-none focus:border-primary transition-colors text-xs"
                  required
                />
                <p className="text-[10px] text-muted-foreground mt-0.5">Admin-specified number for this slot (e.g. 001, 002)</p>
              </div>
            </div>

            {/* State Selection */}
            <div>
              <label className="block text-[11px] font-semibold text-muted-foreground mb-1">
                State Name
              </label>
              {level === "State" ? (
                <input
                  value={addState}
                  onChange={(e) => setAddState(e.target.value)}
                  placeholder="Enter State name (e.g. Andhra Pradesh)"
                  className="w-full p-2.5 border border-border rounded-xl bg-secondary/15 focus:outline-none focus:border-primary transition-colors text-xs"
                  required
                />
              ) : (
                <select
                  value={addState}
                  onChange={(e) => {
                    setAddState(e.target.value);
                    setAddDistrict("");
                    setAddMandal("");
                    setAddVillage("");
                  }}
                  className="w-full p-2.5 border border-border rounded-xl bg-secondary/15 focus:outline-none focus:border-primary transition-colors text-xs"
                  required
                >
                  <option value="">Select State</option>
                  {stateOptionsForAdd.map((st) => (
                    <option key={st.name} value={st.name}>
                      {st.name} [{st.ftid}]
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* District Selection */}
            {level !== "State" && (
              <div>
                <label className="block text-[11px] font-semibold text-muted-foreground mb-1">
                  District Name
                </label>
                {level === "District" ? (
                  <input
                    value={addDistrict}
                    onChange={(e) => setAddDistrict(e.target.value)}
                    placeholder="Enter District name (e.g. Nellore)"
                    className="w-full p-2.5 border border-border rounded-xl bg-secondary/15 focus:outline-none focus:border-primary transition-colors text-xs"
                    required
                  />
                ) : (
                  <select
                    value={addDistrict}
                    onChange={(e) => {
                      setAddDistrict(e.target.value);
                      setAddMandal("");
                      setAddVillage("");
                    }}
                    className="w-full p-2.5 border border-border rounded-xl bg-secondary/15 focus:outline-none focus:border-primary transition-colors text-xs"
                    disabled={!addState}
                    required
                  >
                    <option value="">
                      {addState ? `Select District in ${addState}` : "Select state first"}
                    </option>
                    {availableDistrictsForAdd.map((d) => (
                      <option key={d.district} value={d.district}>
                        {d.name} [{d.ftid}]
                      </option>
                    ))}
                  </select>
                )}
              </div>
            )}

            {/* Mandal Selection */}
            {(level === "Mandal" || level === "Village" || level === "Pincode") && (
              <div>
                <label className="block text-[11px] font-semibold text-muted-foreground mb-1">
                  Mandal Name
                </label>
                {level === "Mandal" ? (
                  <input
                    value={addMandal}
                    onChange={(e) => setAddMandal(e.target.value)}
                    placeholder="Enter Mandal name (e.g. Buchireddypalem)"
                    className="w-full p-2.5 border border-border rounded-xl bg-secondary/15 focus:outline-none focus:border-primary transition-colors text-xs"
                    required
                  />
                ) : (
                  <select
                    value={addMandal}
                    onChange={(e) => {
                      setAddMandal(e.target.value);
                      setAddVillage("");
                    }}
                    className="w-full p-2.5 border border-border rounded-xl bg-secondary/15 focus:outline-none focus:border-primary transition-colors text-xs"
                    disabled={!addDistrict}
                    required
                  >
                    <option value="">
                      {addDistrict ? `Select Mandal in ${addDistrict}` : "Select district first"}
                    </option>
                    {availableMandalsForAdd.map((m) => (
                      <option key={m.mandal} value={m.mandal}>
                        {m.name} [{m.ftid}]
                      </option>
                    ))}
                  </select>
                )}
              </div>
            )}

            {/* Village Input */}
            {level === "Village" && (
              <div>
                <label className="block text-[11px] font-semibold text-muted-foreground mb-1">
                  Village / Gram Panchayat Name
                </label>
                <input
                  value={addVillage}
                  onChange={(e) => setAddVillage(e.target.value)}
                  placeholder="Enter Village name (e.g. Vavveru, Damaramadugu)"
                  className="w-full p-2.5 border border-border rounded-xl bg-secondary/15 focus:outline-none focus:border-primary transition-colors text-xs"
                  required
                />
              </div>
            )}

            {/* Pincode Input */}
            {level === "Pincode" && (
              <div>
                <label className="block text-[11px] font-semibold text-muted-foreground mb-1">
                  Pincode
                </label>
                <input
                  value={addPincode}
                  onChange={(e) => setAddPincode(e.target.value)}
                  placeholder="Enter 6-digit Pincode (e.g. 524305)"
                  className="w-full p-2.5 border border-border rounded-xl bg-secondary/15 font-mono focus:outline-none focus:border-primary transition-colors text-xs"
                  required
                />
              </div>
            )}

            {/* Live Computed FTID Review & Custom Override */}
            <div className="bg-secondary/30 p-3.5 rounded-xl border border-border/80 space-y-1.5">
              <div className="flex justify-between items-center">
                <span className="text-[11px] font-bold text-foreground">Generated FTID Code:</span>
                <span className="font-mono font-black text-primary text-xs">{previewAddFtid}</span>
              </div>
              <p className="text-[10px] text-muted-foreground">
                This permanent Franchise Territory ID will be uniquely assigned to this location slot.
              </p>
            </div>

            <button className="w-full py-3 bg-primary text-primary-foreground font-bold rounded-xl hover:opacity-90 transition-opacity shadow-sm cursor-pointer">
              Register Territory ({previewAddFtid})
            </button>
          </form>
        </div>
      )}

      {/* Assign Franchise Sub-Tab */}
      {activeSubTab === "assignment" && (
        <div className="bg-card border border-border/80 rounded-2xl p-6 shadow-sm max-w-xl mx-auto space-y-4">
          <div className="flex items-center gap-2 border-b border-border pb-3">
            <UserPlus className="text-primary" size={18} />
            <h3 className="text-xs font-bold uppercase">Assign Backend Franchise</h3>
          </div>

          <form onSubmit={handleAssignTerritory} className="space-y-4 text-xs">
            <div>
              <label className="block text-[11px] font-semibold text-muted-foreground mb-1">
                Select Target Territory (FTID)
              </label>
              <select
                value={selectedTerritoryId}
                onChange={(e) => {
                  setSelectedTerritoryId(e.target.value);
                  setSelectedFranchiseId("");
                }}
                className="w-full p-2.5 border border-border rounded-xl bg-secondary/15 focus:outline-none focus:border-primary transition-colors text-xs font-semibold"
              >
                <option value="">Select Territory</option>
                {sortedTerritoriesForAssign.map((t) => (
                  <option key={t._id} value={t._id}>
                    [{t.ftid || t.level}] {t.name} ({t.state}{t.district ? `, ${t.district}` : ""}{t.mandal ? `, ${t.mandal}` : ""})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-muted-foreground mb-1">
                Select Matching Franchise Member
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
              {/* Territory Number and FTID */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-muted-foreground mb-1">
                    Territory Number (3 Digits)
                  </label>
                  <input
                    type="text"
                    value={editCodeNumber}
                    onChange={(e) => setEditCodeNumber(e.target.value.replace(/[^0-9]/g, "").slice(0, 3))}
                    placeholder="e.g. 001"
                    className="w-full p-2.5 border border-border rounded-xl bg-secondary/15 font-mono font-bold focus:outline-none focus:border-primary transition-colors text-xs"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-muted-foreground mb-1">
                    Franchise Territory ID (FTID)
                  </label>
                  <input
                    type="text"
                    value={editFtid || previewEditFtid}
                    onChange={(e) => setEditFtid(e.target.value.toUpperCase())}
                    placeholder="e.g. APX-SF001-DF001-MF-001"
                    className="w-full p-2.5 border border-border rounded-xl bg-secondary/15 font-mono font-black text-primary focus:outline-none focus:border-primary transition-colors text-xs"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-muted-foreground mb-1">
                  Territory Name
                </label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full p-2.5 border border-border rounded-xl bg-secondary/15 focus:outline-none focus:border-primary transition-colors text-xs font-bold"
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

              {(editingTerritory.level === "Mandal" || editingTerritory.level === "Village" || editingTerritory.level === "Pincode") && (
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

              {editingTerritory.level === "Village" && (
                <div>
                  <label className="block text-[11px] font-semibold text-muted-foreground mb-1">
                    Village Name
                  </label>
                  <input
                    type="text"
                    value={editVillage || editName}
                    onChange={(e) => setEditVillage(e.target.value)}
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
                    Franchise Vacancy Status
                  </label>
                  <select
                    value={editFranchiseStatus}
                    onChange={(e) => setEditFranchiseStatus(e.target.value as any)}
                    className="w-full p-2.5 border border-border rounded-xl bg-secondary/15 focus:outline-none focus:border-primary transition-colors text-xs font-bold"
                  >
                    <option value="ACTIVE">ACTIVE</option>
                    <option value="VACANT">VACANT</option>
                    <option value="SUSPENDED">SUSPENDED</option>
                  </select>
                </div>
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
                  <option value="">🟡 No Franchise Assigned (VACANT)</option>
                  {franchises.map((f: any) => {
                    const ownerName = f.ownerName || f.name || f.contactPerson || "";
                    const bName = f.businessName || "";
                    const displayName = ownerName && bName
                      ? `${ownerName} (${bName})`
                      : ownerName || bName || f.email || f.mobile || "Unnamed Franchisee";
                    const code = f.franchiseCode ? ` [${f.franchiseCode}]` : "";
                    const lvl = f.franchiseLevel ? ` (${String(f.franchiseLevel).toUpperCase()})` : "";

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