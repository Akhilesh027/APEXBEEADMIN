import React, { useEffect, useMemo, useState } from "react";
import { CheckCircle2, MapPin, Users, XCircle } from "lucide-react";

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
  status?: string;
  kycStatus?: string;
  assignedTerritories?: any[];
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
  const [loading, setLoading] = useState(true);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

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

    const path = [
      t.state,
      t.district,
      t.mandal,
      t.pincode,
    ].filter(Boolean);

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

  const selectedFranchise = franchises.find(
    (f) => f._id === selectedFranchiseId
  );

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

  const removeAssignment = async (territoryId: string) => {
    const res = await fetch(
      `${API}/territories/${territoryId}/remove-assignment`,
      {
        method: "PUT",
        headers,
      }
    );

    const data = await res.json();

    if (res.ok && data.success) {
      setSuccessMsg("Assignment removed successfully");
      await fetchData();
    } else {
      alert(data.message || "Remove assignment failed");
    }
  };

  const getAssignedTerritories = (franchise: Franchise) => {
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
          <h3 className="text-xs font-bold uppercase">
            Franchise Territory Assignment
          </h3>
        </div>

        <form
          onSubmit={assignTerritory}
          className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs"
        >
          <select
            value={selectedFranchiseId}
            onChange={(e) => {
              setSelectedFranchiseId(e.target.value);
              setSelectedTerritoryId("");
              setSuccessMsg("");
            }}
            className="p-2.5 border border-border rounded-xl bg-secondary/15"
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
            className="p-2.5 border border-border rounded-xl bg-secondary/15"
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
            className="py-2.5 bg-primary text-primary-foreground rounded-xl font-bold"
          >
            Assign
          </button>
        </form>

        {selectedFranchise && (
          <div className="mt-4 p-3 rounded-xl bg-secondary/20 border border-border/60 text-[11px] text-muted-foreground">
            Selected Franchise:{" "}
            <span className="font-bold text-foreground">
              {getFranchiseDisplay(selectedFranchise)}
            </span>{" "}
            | Level:{" "}
            <span className="font-bold text-foreground capitalize">
              {selectedFranchise.franchiseLevel}
            </span>{" "}
            | Location:{" "}
            <span className="font-bold text-foreground">
              {[selectedFranchise.state, selectedFranchise.district, selectedFranchise.mandal]
                .filter(Boolean)
                .join(" / ")}
            </span>
          </div>
        )}
      </div>

      <div className="bg-card border border-border/80 rounded-2xl overflow-hidden shadow-sm">
        <div className="px-5 py-4 border-b border-border/60 bg-secondary/10 flex justify-between items-center">
          <span className="text-xs font-bold uppercase">All Franchises</span>
          <span className="text-[10px] text-muted-foreground">
            {franchises.length} records
          </span>
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
                  <td className="p-3 font-mono font-semibold">
                    {f.franchiseCode || "-"}
                  </td>
                  <td className="p-3 font-semibold">
                    {f.businessName || "-"}
                  </td>
                  <td className="p-3">{f.ownerName || "-"}</td>
                  <td className="p-3 capitalize">
                    {f.franchiseLevel || "-"}
                  </td>
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
                        <span className="text-muted-foreground text-[10px]">
                          No territories
                        </span>
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
                              : getTerritoryDisplay(t)}
                          </span>

                          {typeof t !== "string" && (
                            <button
                              onClick={() => removeAssignment(t._id)}
                              className="text-red-500"
                              type="button"
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
                  <td
                    colSpan={9}
                    className="p-6 text-center text-muted-foreground"
                  >
                    No backend franchise records found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-card border border-border/80 rounded-2xl overflow-hidden shadow-sm">
        <div className="px-5 py-4 border-b border-border/60 bg-secondary/10 flex justify-between items-center">
          <span className="text-xs font-bold uppercase">
            Backend Territories
          </span>
          <span className="text-[10px] text-muted-foreground">
            {territories.length} records
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
              </tr>
            </thead>

            <tbody className="divide-y divide-border">
              {territories.map((t) => (
                <tr key={t._id} className="hover:bg-secondary/10">
                  <td className="p-3">{getTerritoryLevel(t)}</td>
                  <td className="p-3 font-semibold">{getTerritoryName(t)}</td>
                  <td className="p-3">{t.state || "-"}</td>
                  <td className="p-3">{t.district || "-"}</td>
                  <td className="p-3">{t.mandal || "-"}</td>
                  <td className="p-3">{t.pincode || "-"}</td>
                  <td className="p-3">
                    {typeof t.franchiseId === "object" && t.franchiseId
                      ? t.franchiseId.businessName ||
                        t.franchiseId.ownerName ||
                        t.franchiseId.email
                      : "-"}
                  </td>
                </tr>
              ))}

              {territories.length === 0 && (
                <tr>
                  <td
                    colSpan={7}
                    className="p-6 text-center text-muted-foreground"
                  >
                    No backend territory records found
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