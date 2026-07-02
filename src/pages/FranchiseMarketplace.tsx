import React, { useEffect, useMemo, useState } from "react";
import { CheckCircle2, Users, MapPin, XCircle } from "lucide-react";

const API = "https://server.apexbee.in/api/admin";

export const FranchiseManagement = () => {
  const [franchises, setFranchises] = useState<any[]>([]);
  const [territories, setTerritories] = useState<any[]>([]);
  const [selectedFranchiseId, setSelectedFranchiseId] = useState("");
  const [selectedTerritoryId, setSelectedTerritoryId] = useState("");
  const [loading, setLoading] = useState(true);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const token = localStorage.getItem("adminToken");

  const headers = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
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

      if (!franchiseRes.ok) throw new Error(franchiseData.message || "Failed to fetch franchises");
      if (!territoryRes.ok) throw new Error(territoryData.message || "Failed to fetch territories");

      setFranchises(franchiseData.franchises || []);
      setTerritories(territoryData.territories || []);
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
      if (selectedFranchise.franchiseLevel === "state") {
        return (
          t.level === "State" &&
          t.state?.toLowerCase() === selectedFranchise.state?.toLowerCase()
        );
      }

      if (selectedFranchise.franchiseLevel === "district") {
        return (
          t.level === "District" &&
          t.state?.toLowerCase() === selectedFranchise.state?.toLowerCase() &&
          t.district?.toLowerCase() === selectedFranchise.district?.toLowerCase()
        );
      }

      if (selectedFranchise.franchiseLevel === "mandal") {
        return (
          t.level === "Mandal" &&
          t.state?.toLowerCase() === selectedFranchise.state?.toLowerCase() &&
          t.district?.toLowerCase() === selectedFranchise.district?.toLowerCase() &&
          t.mandal?.toLowerCase() === selectedFranchise.mandal?.toLowerCase()
        );
      }

      return false;
    });
  }, [selectedFranchise, territories]);

  const assignTerritory = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedFranchiseId) return alert("Select franchise");
    if (!selectedTerritoryId) return alert("Select territory");

    const res = await fetch(`${API}/territories/${selectedTerritoryId}/assign`, {
      method: "PUT",
      headers,
      body: JSON.stringify({ franchiseId: selectedFranchiseId }),
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

  const removeAssignment = async (territoryId: string) => {
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

  const getAssignedTerritories = (franchise: any) => {
    return Array.isArray(franchise.assignedTerritories)
      ? franchise.assignedTerritories
      : [];
  };

  if (loading) {
    return (
      <div className="bg-card border border-border/80 rounded-2xl p-8 text-center text-xs text-muted-foreground">
        Loading backend franchise data...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {successMsg && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 rounded-xl flex items-center gap-2 text-xs font-semibold">
          <CheckCircle2 size={16} />
          {successMsg}
        </div>
      )}

      {errorMsg && (
        <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-500 rounded-xl text-xs font-semibold">
          {errorMsg}
        </div>
      )}

      <div className="bg-card border border-border/80 rounded-2xl p-5 shadow-sm">
        <div className="flex items-center gap-2 border-b border-border pb-3 mb-4">
          <Users className="text-primary" size={18} />
          <h3 className="text-xs font-bold uppercase">Franchise Territory Assignment</h3>
        </div>

        <form onSubmit={assignTerritory} className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <select
            value={selectedFranchiseId}
            onChange={(e) => {
              setSelectedFranchiseId(e.target.value);
              setSelectedTerritoryId("");
            }}
            className="p-2.5 border border-border rounded-xl bg-secondary/15"
          >
            <option value="">Select Franchise</option>
            {franchises.map((f) => (
              <option key={f._id} value={f._id}>
                {f.businessName || f.ownerName || f.email}{" "}
                {f.franchiseCode ? `(${f.franchiseCode})` : ""}
              </option>
            ))}
          </select>

          <select
            value={selectedTerritoryId}
            onChange={(e) => setSelectedTerritoryId(e.target.value)}
            disabled={!selectedFranchiseId}
            className="p-2.5 border border-border rounded-xl bg-secondary/15"
          >
            <option value="">
              {selectedFranchiseId ? "Select matching territory" : "Select franchise first"}
            </option>

            {matchingTerritories.map((t) => (
              <option key={t._id} value={t._id}>
                {t.level} - {t.name} ({t.state}
                {t.district ? ` / ${t.district}` : ""}
                {t.mandal ? ` / ${t.mandal}` : ""})
              </option>
            ))}
          </select>

          <button className="py-2.5 bg-primary text-primary-foreground rounded-xl font-bold">
            Assign
          </button>
        </form>
      </div>

      <div className="bg-card border border-border/80 rounded-2xl overflow-hidden shadow-sm">
        <div className="px-5 py-4 border-b border-border/60 bg-secondary/10 flex justify-between items-center">
          <span className="text-xs font-bold uppercase">All Franchises</span>
          <span className="text-[10px] text-muted-foreground">{franchises.length} records</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-secondary/40">
              <tr>
                <th className="p-3">Code</th>
                <th className="p-3">Business</th>
                <th className="p-3">Owner</th>
                <th className="p-3">Level</th>
                <th className="p-3">State</th>
                <th className="p-3">District</th>
                <th className="p-3">Mandal</th>
                <th className="p-3">Status</th>
                <th className="p-3">Assigned Territories</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-border">
              {franchises.map((f) => (
                <tr key={f._id} className="hover:bg-secondary/10">
                  <td className="p-3 font-mono font-semibold">{f.franchiseCode || "-"}</td>
                  <td className="p-3 font-semibold">{f.businessName || "-"}</td>
                  <td className="p-3">{f.ownerName || "-"}</td>
                  <td className="p-3 capitalize">{f.franchiseLevel || "-"}</td>
                  <td className="p-3">{f.state || "-"}</td>
                  <td className="p-3">{f.district || "-"}</td>
                  <td className="p-3">{f.mandal || "-"}</td>
                  <td className="p-3">
                    <span className="px-2 py-0.5 rounded-lg bg-emerald-500/10 text-emerald-500 text-[10px] font-bold">
                      {f.status || "-"}
                    </span>
                  </td>
                  <td className="p-3">
                    <div className="space-y-1">
                      {getAssignedTerritories(f).length === 0 && (
                        <span className="text-muted-foreground text-[10px]">No territories</span>
                      )}

                      {getAssignedTerritories(f).map((t: any) => (
                        <div
                          key={t._id || t}
                          className="flex items-center justify-between gap-2 bg-secondary/20 border border-border/50 rounded-lg px-2 py-1"
                        >
                          <span className="flex items-center gap-1">
                            <MapPin size={11} />
                            {typeof t === "string"
                              ? t
                              : `${t.level} - ${t.name}`}
                          </span>

                          {typeof t !== "string" && (
                            <button
                              onClick={() => removeAssignment(t._id)}
                              className="text-red-500"
                            >
                              <XCircle size={13} />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </td>
                </tr>
              ))}

              {franchises.length === 0 && (
                <tr>
                  <td colSpan={9} className="p-6 text-center text-muted-foreground">
                    No backend franchise records found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};