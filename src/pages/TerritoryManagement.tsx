import React, { useEffect, useMemo, useState } from "react";
import { CheckCircle2, Layers, UserPlus, XCircle } from "lucide-react";

type TerritoryLevel = "State" | "District" | "Mandal" | "Pincode";
type Status = "Active" | "Inactive";
type Density = "High" | "Medium" | "Low";

interface Franchise {
  _id: string;
  businessName?: string;
  ownerName?: string;
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

  const [level, setLevel] = useState<TerritoryLevel>("State");
  const [addState, setAddState] = useState("");
  const [addDistrict, setAddDistrict] = useState("");
  const [addMandal, setAddMandal] = useState("");
  const [addPincode, setAddPincode] = useState("");
  const [addDensity, setAddDensity] = useState<Density>("Medium");
  const [addTargetCoverage, setAddTargetCoverage] = useState("100%");
  const [addStatus, setAddStatus] = useState<Status>("Active");

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

  const states = useMemo(() => territories.filter((t) => t.level === "State"), [territories]);
  const districts = useMemo(() => territories.filter((t) => t.level === "District"), [territories]);
  const mandals = useMemo(() => territories.filter((t) => t.level === "Mandal"), [territories]);
  const pincodes = useMemo(() => territories.filter((t) => t.level === "Pincode"), [territories]);

  const availableDistricts = districts.filter(
    (d) => d.state?.toLowerCase() === addState.toLowerCase()
  );

  const availableMandals = mandals.filter(
    (m) =>
      m.state?.toLowerCase() === addState.toLowerCase() &&
      m.district?.toLowerCase() === addDistrict.toLowerCase()
  );

  const selectedTerritory = territories.find((t) => t._id === selectedTerritoryId);

  const filteredFranchises = franchises.filter((f) => {
    if (!selectedTerritory) return false;

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

  const getFranchiseName = (franchise: Territory["franchiseId"]) => {
    if (!franchise || typeof franchise === "string") return "-";
    return franchise.businessName || franchise.ownerName || franchise.email || franchise.mobile || franchise.franchiseCode || "-";
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

  const renderTable = (items: Territory[], title: string) => (
    <div className="bg-card border border-border/80 rounded-2xl overflow-hidden shadow-sm">
      <div className="px-5 py-4 border-b border-border/60 bg-secondary/10 flex justify-between items-center">
        <span className="text-xs font-bold uppercase">{title}</span>
        <span className="text-[10px] text-muted-foreground">{items.length} records</span>
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
              <th className="p-3">Action</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-border">
            {items.map((item) => (
              <tr key={item._id} className="hover:bg-secondary/10">
                <td className="p-3 font-semibold">{item.level}</td>
                <td className="p-3 font-semibold">{item.name}</td>
                <td className="p-3">{item.state || "-"}</td>
                <td className="p-3">{item.district || "-"}</td>
                <td className="p-3">{item.mandal || "-"}</td>
                <td className="p-3 font-mono">{item.pincode || "-"}</td>
                <td className="p-3">{getFranchiseName(item.franchiseId)}</td>
                <td className="p-3">
                  <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-500 rounded-lg text-[10px] font-bold">
                    {item.status}
                  </span>
                </td>
                <td className="p-3">
                  {item.franchiseId ? (
                    <button
                      onClick={() => handleRemoveAssignment(item._id)}
                      className="px-2 py-1 rounded-lg bg-red-500/10 text-red-500 text-[10px] font-bold flex items-center gap-1"
                    >
                      <XCircle size={12} />
                      Remove
                    </button>
                  ) : (
                    <span className="text-muted-foreground text-[10px]">No Action</span>
                  )}
                </td>
              </tr>
            ))}

            {items.length === 0 && (
              <tr>
                <td colSpan={9} className="p-6 text-center text-muted-foreground">
                  No backend records found
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
              ? "bg-primary text-primary-foreground border-primary"
              : "bg-transparent text-muted-foreground border-transparent hover:bg-secondary/60"
              }`}
          >
            {label}
          </button>
        ))}
      </div>

      {successMsg && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 rounded-xl flex items-center gap-2 text-xs font-semibold">
          <CheckCircle2 size={16} />
          {successMsg}
        </div>
      )}

      {activeSubTab === "states" && renderTable(states, "States")}
      {activeSubTab === "districts" && renderTable(districts, "Districts")}
      {activeSubTab === "mandals" && renderTable(mandals, "Mandals")}
      {activeSubTab === "pincodes" && renderTable(pincodes, "Pincodes")}

      {activeSubTab === "add-territory" && (
        <div className="bg-card border border-border/80 rounded-2xl p-5 shadow-sm max-w-xl mx-auto space-y-4">
          <div className="flex items-center gap-2 border-b border-border pb-3">
            <Layers className="text-primary" size={18} />
            <h3 className="text-xs font-bold uppercase">Register Territory</h3>
          </div>

          <form onSubmit={handleAddTerritory} className="space-y-4 text-xs">
            <select
              value={level}
              onChange={(e) => {
                setLevel(e.target.value as TerritoryLevel);
                setAddDistrict("");
                setAddMandal("");
                setAddPincode("");
              }}
              className="w-full p-2.5 border border-border rounded-xl bg-secondary/15"
            >
              <option value="State">State</option>
              <option value="District">District</option>
              <option value="Mandal">Mandal</option>
              <option value="Pincode">Pincode</option>
            </select>

            {level === "State" ? (
              <input value={addState} onChange={(e) => setAddState(e.target.value)} placeholder="State name" className="w-full p-2.5 border border-border rounded-xl bg-secondary/15" />
            ) : (
              <select value={addState} onChange={(e) => setAddState(e.target.value)} className="w-full p-2.5 border border-border rounded-xl bg-secondary/15">
                <option value="">Select State</option>
                {states.map((s) => <option key={s._id} value={s.state}>{s.name}</option>)}
              </select>
            )}

            {level !== "State" && (
              level === "District" ? (
                <input value={addDistrict} onChange={(e) => setAddDistrict(e.target.value)} placeholder="District name" className="w-full p-2.5 border border-border rounded-xl bg-secondary/15" />
              ) : (
                <select value={addDistrict} onChange={(e) => setAddDistrict(e.target.value)} className="w-full p-2.5 border border-border rounded-xl bg-secondary/15">
                  <option value="">Select District</option>
                  {availableDistricts.map((d) => <option key={d._id} value={d.district}>{d.name}</option>)}
                </select>
              )
            )}

            {(level === "Mandal" || level === "Pincode") && (
              level === "Mandal" ? (
                <input value={addMandal} onChange={(e) => setAddMandal(e.target.value)} placeholder="Mandal name" className="w-full p-2.5 border border-border rounded-xl bg-secondary/15" />
              ) : (
                <select value={addMandal} onChange={(e) => setAddMandal(e.target.value)} className="w-full p-2.5 border border-border rounded-xl bg-secondary/15">
                  <option value="">Select Mandal</option>
                  {availableMandals.map((m) => <option key={m._id} value={m.mandal}>{m.name}</option>)}
                </select>
              )
            )}

            {level === "Pincode" && (
              <input value={addPincode} onChange={(e) => setAddPincode(e.target.value)} placeholder="Pincode" className="w-full p-2.5 border border-border rounded-xl bg-secondary/15 font-mono" />
            )}

            <button className="w-full py-2.5 bg-primary text-primary-foreground font-bold rounded-xl">
              Create Territory
            </button>
          </form>
        </div>
      )}

      {activeSubTab === "assignment" && (
        <div className="bg-card border border-border/80 rounded-2xl p-5 shadow-sm max-w-xl mx-auto space-y-4">
          <div className="flex items-center gap-2 border-b border-border pb-3">
            <UserPlus className="text-primary" size={18} />
            <h3 className="text-xs font-bold uppercase">Assign Backend Franchise</h3>
          </div>

          <form onSubmit={handleAssignTerritory} className="space-y-4 text-xs">
            <select
              value={selectedTerritoryId}
              onChange={(e) => {
                setSelectedTerritoryId(e.target.value);
                setSelectedFranchiseId("");
              }}
              className="w-full p-2.5 border border-border rounded-xl bg-secondary/15"
            >
              <option value="">Select Territory</option>
              {territories.map((t) => (
                <option key={t._id} value={t._id}>
                  {t.level} - {t.name}
                </option>
              ))}
            </select>

            <select
              value={selectedFranchiseId}
              onChange={(e) => setSelectedFranchiseId(e.target.value)}
              className="w-full p-2.5 border border-border rounded-xl bg-secondary/15"
              disabled={!selectedTerritoryId}
            >
              <option value="">
                {selectedTerritoryId ? "Select Matching Franchise" : "Select territory first"}
              </option>
              {filteredFranchises.map((f) => (
                <option key={f._id} value={f._id}>
                  {f.businessName || f.ownerName || f.email || f.mobile}
                  {f.franchiseCode ? ` (${f.franchiseCode})` : ""}
                </option>
              ))}
            </select>

            <button className="w-full py-2.5 bg-primary text-primary-foreground font-bold rounded-xl">
              Assign Franchise
            </button>
          </form>
        </div>
      )}
    </div>
  );
};