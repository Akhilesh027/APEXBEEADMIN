import React, { useState, useEffect } from "react";
import { useAdminState } from "../context/AdminStateContext";
import {
  ClipboardCheck,
  Check,
  X,
  Clock,
  Sparkles,
  Filter,
  Eye,
  ExternalLink,
} from "lucide-react";

export const ApprovalCenter: React.FC = () => {
  const { addActivityLog } = useAdminState();

  const [activeSubTab, setActiveSubTab] = useState<
    | "vendors"
    | "wholesalers"
    | "entrepreneurs"
    | "franchises"
    | "manufacturers"
    | "service_providers"
    | "course_providers"
    | "delivery_partners"
    | "products"
    | "kyc"
    | "withdrawals"
  >("vendors");

  const [pendingItems, setPendingItems] = useState<Record<string, any[]>>({
    vendors: [],
    wholesalers: [],
    entrepreneurs: [],
    franchises: [],
    manufacturers: [],
    service_providers: [],
    course_providers: [],
    delivery_partners: [],
    products: [],
    kyc: [],
    withdrawals: [],
  });

  const [historyItems, setHistoryItems] = useState<any[]>([]);
  const [applications, setApplications] = useState<any[]>([]);
  const [dbVendors, setDbVendors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDetailItem, setSelectedDetailItem] = useState<any | null>(null);

  const fetchApplications = async () => {
    setLoading(true);

    try {
      const token = localStorage.getItem("adminToken");

      const res = await fetch("https://server.apexbee.in/api/admin/applications", {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      if (res.ok) {
        const data = await res.json();

        if (data.applications) {
          setApplications(data.applications);
          console.log("Applications:", data.applications);
        }
      }
    } catch (err) {
      console.error("Error fetching applications:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchDbVendors = async () => {
    try {
      const token = localStorage.getItem("adminToken");

      const res = await fetch("https://server.apexbee.in/api/admin/vendors", {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      if (res.ok) {
        const data = await res.json();

        if (data.vendors) {
          setDbVendors(data.vendors);
        }
      }
    } catch (err) {
      console.error("Error fetching db vendors:", err);
    }
  };

  useEffect(() => {
    fetchApplications();
    fetchDbVendors();
  }, []);

  const getTabForAppType = (type: string) => {
    const t = String(type || "").toLowerCase();

    if (t.includes("vendor")) return "vendors";
    if (t.includes("wholesaler")) return "wholesalers";
    if (t.includes("entrepreneur")) return "entrepreneurs";
    if (t.includes("franchise")) return "franchises";
    if (t.includes("manufacturer")) return "manufacturers";
    if (t.includes("service_provider") || t.includes("service provider")) return "service_providers";
    if (t.includes("course_provider") || t.includes("course provider")) return "course_providers";
    if (t.includes("delivery_partner") || t.includes("delivery partner")) return "delivery_partners";

    return null;
  };

  const getSubTabLabel = (tab: typeof activeSubTab) => {
    switch (tab) {
      case "vendors":
        return "Vendors";
      case "wholesalers":
        return "Wholesalers";
      case "entrepreneurs":
        return "Entrepreneurs";
      case "franchises":
        return "Franchises";
      case "manufacturers":
        return "Manufacturers";
      case "service_providers":
        return "Service Providers";
      case "course_providers":
        return "Course Providers";
      case "delivery_partners":
        return "Delivery Partners";
      case "products":
        return "Products";
      case "kyc":
        return "KYC Documents";
      case "withdrawals":
        return "Withdrawals";
      default:
        return tab;
    }
  };

  const mapApplicationToItem = (app: any) => ({
    id: app._id,
    name: app.businessName || app.ownerName || "Business Opportunity",
    contact: app.ownerName || "",
    date: new Date(app.updatedAt || app.createdAt).toISOString().substring(0, 10),
    priority: app.status === "under_review" ? "High" : "Normal",
    type: app.roleId || app.applicationType,
    applicationType: app.applicationType,
    roleId: app.roleId,
    email: app.email,
    mobile: app.mobile,
    experience: app.experience,
    expectedSales: app.expectedSales,
    status: app.status,
    gstNumber: app.gstNumber,
    panNumber: app.panNumber,
    aadhaarNumber: app.aadhaarNumber,
    franchiseLevel: app.franchiseLevel,
    investmentCapacity: app.investmentCapacity,
    serviceType: app.serviceType,
    sampleVideoLink: app.sampleVideoLink,
    vehicleType: app.vehicleType,
    licenseNumber: app.licenseNumber,
    address: app.address,
    pincode: app.pincode,
    state: app.state,
    district: app.district,
    mandal: app.mandal,
    village: app.village,
    documents: app.documents,
    dependencies: app.dependencies,
    isDbVendor: false,
  });

  const getPendingItemsForTab = (tab: string) => {
    if (tab === "kyc") {
      const appItems = applications
        .filter(
          app =>
            ["approved", "under_review"].includes(app.status) &&
            app.documents &&
            Object.values(app.documents).some(val => !!val)
        )
        .map(mapApplicationToItem);

      const vendorItems = dbVendors
        .filter(vendor => vendor.documents && vendor.documents.some((d: any) => d.status === "Pending"))
        .map(vendor => ({
          id: vendor.userId,
          name: vendor.businessName,
          contact: vendor.ownerName,
          date: new Date(vendor.updatedAt || vendor.createdAt).toISOString().substring(0, 10),
          priority: "High",
          type: "Vendor KYC Profile",
          email: vendor.email,
          mobile: vendor.mobile,
          status: vendor.status,
          gstNumber: vendor.gstNumber,
          panNumber: vendor.panNumber,
          address: vendor.address,
          pincode: vendor.pincode,
          state: vendor.state,
          district: vendor.district,
          mandal: vendor.mandal,
          bankAccounts: vendor.bankAccounts || [],
          documents: vendor.documents || [],
          isDbVendor: true,
        }));

      return [...appItems, ...vendorItems];
    }

    if (["products", "withdrawals"].includes(tab)) {
      return pendingItems[tab] || [];
    }

    return applications
      .filter(
        app =>
          getTabForAppType(app.roleId || app.applicationType) === tab &&
          ["pending", "under_review"].includes(app.status)
      )
      .map(mapApplicationToItem);
  };

  const handleUpdateDocStatus = async (
    vendorId: string,
    docId: string,
    status: "Approved" | "Rejected"
  ) => {
    try {
      const token = localStorage.getItem("adminToken");

      const res = await fetch(
        `https://server.apexbee.in/api/admin/vendors/${vendorId}/documents/${docId}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ status }),
        }
      );

      if (res.ok) {
        const data = await res.json();

        if (data.success && data.vendor) {
          setSelectedDetailItem((prev: any) => {
            if (prev && prev.id === vendorId) {
              return {
                ...prev,
                documents: data.vendor.documents,
              };
            }

            return prev;
          });

          fetchDbVendors();

          addActivityLog(
            "Document Audited",
            `Document status updated to ${status} for Vendor ${data.vendor.businessName}`,
            "kyc"
          );
        }
      } else {
        const errData = await res.json();
        alert(errData.message || "Failed to update document status");
      }
    } catch (err) {
      console.error("Error updating document status:", err);
    }
  };

  const handleRequestDoc = async (vendorId: string, docName: string) => {
    try {
      const token = localStorage.getItem("adminToken");

      const res = await fetch(
        `https://server.apexbee.in/api/admin/vendors/${vendorId}/request-document`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ name: docName }),
        }
      );

      if (res.ok) {
        const data = await res.json();

        if (data.success && data.vendor) {
          setSelectedDetailItem((prev: any) => {
            if (prev && prev.id === vendorId) {
              return {
                ...prev,
                documents: data.vendor.documents,
              };
            }

            return prev;
          });

          fetchDbVendors();

          addActivityLog(
            "Document Requested",
            `Additional document "${docName}" requested from Vendor ${data.vendor.businessName}`,
            "kyc"
          );

          alert("Document requested successfully.");
        }
      } else {
        const errData = await res.json();
        alert(errData.message || "Failed to request document");
      }
    } catch (err) {
      console.error("Error requesting document:", err);
    }
  };

  const handleAction = async (id: string, action: "Approved" | "Rejected") => {
    const isRealApp = applications.some(app => app._id === id);

    if (!isRealApp) {
      const queue = pendingItems[activeSubTab] || [];
      const item = queue.find(i => i.id === id);

      if (!item) return;

      addActivityLog(
        `Ecosystem Approval: ${action}`,
        `Ecosystem Node ${item.name || item.id} was ${action.toLowerCase()} by Admin in Approval Center.`,
        activeSubTab === "kyc" ? "kyc" : activeSubTab === "products" ? "product" : "info"
      );

      setPendingItems(prev => ({
        ...prev,
        [activeSubTab]: (prev[activeSubTab] || []).filter(i => i.id !== id),
      }));

      setHistoryItems(prev => [
        {
          id: item.id,
          name: item.name || `Request #${item.id}`,
          type: activeSubTab.toUpperCase(),
          date: new Date().toISOString().substring(0, 10),
          status: action,
        },
        ...prev,
      ]);

      return;
    }

    try {
      const token = localStorage.getItem("adminToken");
      const currentApp = applications.find(app => app._id === id);

      let endpoint = `https://server.apexbee.in/api/admin/applications/${id}/${
        action === "Approved" ? "approve" : "reject"
      }`;

      if (
        action === "Approved" &&
        (activeSubTab === "kyc" || currentApp?.status === "under_review")
      ) {
        endpoint = `https://server.apexbee.in/api/admin/applications/${id}/verify-kyc`;
      }

      const res = await fetch(endpoint, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          adminRemarks:
            activeSubTab === "kyc" || currentApp?.status === "under_review"
              ? "KYC verified and approved by admin."
              : `Audited and ${action.toLowerCase()} by admin.`,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        alert(errorData?.message || `Failed to set status to ${action}`);
        return;
      }

      const data = await res.json();
      const app = data.application || currentApp;

      addActivityLog(
        `Application ${action}`,
        `Application for ${app.applicationType} (${app.businessName}) was ${action.toLowerCase()} by Admin.`,
        "kyc"
      );

      await fetchApplications();
      await fetchDbVendors();

      setHistoryItems(prev => [
        {
          id: app._id,
          name: app.businessName || app.ownerName,
          type: String(app.applicationType || app.roleId || "").toUpperCase(),
          date: new Date().toISOString().substring(0, 10),
          status: action,
        },
        ...prev,
      ]);

      setSelectedDetailItem(null);
    } catch (err) {
      console.error(`Error setting application status to ${action}:`, err);
    }
  };

  const currentItems = getPendingItemsForTab(activeSubTab);

  return (
    <div className="space-y-6">
      <div className="flex gap-2 flex-wrap bg-card border border-border/60 p-2 rounded-2xl select-none shadow-sm">
        {[
          "vendors",
          "wholesalers",
          "entrepreneurs",
          "franchises",
          "manufacturers",
          "service_providers",
          "course_providers",
          "delivery_partners",
          "products",
          "kyc",
          "withdrawals",
        ].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveSubTab(tab as any)}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all ${
              activeSubTab === tab
                ? "bg-primary text-primary-foreground border-primary shadow-md"
                : "bg-transparent text-muted-foreground border-transparent hover:bg-secondary/60 hover:text-foreground"
            }`}
          >
            {getSubTabLabel(tab as any)}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-card border border-border/80 rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex justify-between items-center select-none border-b border-border pb-3">
              <div className="flex items-center gap-1.5">
                <Clock className="text-primary" size={16} />
                <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">
                  Pending Approvals ({getSubTabLabel(activeSubTab)})
                </h3>
              </div>

              <span className="text-[10px] text-muted-foreground flex items-center gap-1 bg-secondary px-2.5 py-1 rounded-lg border border-border/40">
                <Filter size={10} /> Priority Queued
              </span>
            </div>

            <div className="space-y-3.5">
              {loading ? (
                <div className="py-12 text-center text-xs text-muted-foreground">
                  Loading approvals...
                </div>
              ) : (
                currentItems.map(item => (
                  <div
                    key={item.id}
                    className="bg-secondary/15 p-4 rounded-xl border border-border/40 flex flex-col md:flex-row justify-between items-start md:items-center gap-3 transition-all"
                  >
                    <div className="space-y-1 text-xs">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-foreground text-sm">{item.name}</span>
                        <span
                          className={`px-2 py-0.5 rounded text-[8px] font-bold ${
                            item.priority === "High"
                              ? "bg-rose-500/10 text-rose-500 animate-pulse"
                              : "bg-muted text-muted-foreground"
                          }`}
                        >
                          {item.priority} Priority
                        </span>
                        <span className="px-2 py-0.5 rounded text-[8px] font-bold bg-primary/10 text-primary">
                          {item.status}
                        </span>
                      </div>

                      <div className="text-[10px] text-muted-foreground font-mono space-y-0.5">
                        <p>ID: {item.id} • Registered: {item.date}</p>

                        {activeSubTab === "franchises" && (
                          <p>
                            Level: {item.franchiseLevel || "N/A"} • State: {item.state || "N/A"} • District:{" "}
                            {item.district || "N/A"} • Mandal: {item.mandal || "N/A"}
                          </p>
                        )}

                        {activeSubTab === "kyc" && (
                          <p>
                            Uploaded Documents:{" "}
                            {Array.isArray(item.documents)
                              ? item.documents
                                  .filter((d: any) => d.url)
                                  .map((d: any) => d.name)
                                  .join(", ")
                              : Object.keys(item.documents || {})
                                  .filter(k => !!item.documents[k])
                                  .map(k => k.toUpperCase())
                                  .join(", ")}
                          </p>
                        )}

                        {item.dependencies && (
                          <div className="flex flex-wrap gap-1 mt-1.5 select-none font-sans">
                            {item.dependencies.stateFranchise && (
                              <span className="bg-primary/5 text-primary/80 px-2 py-0.5 rounded text-[9px] font-semibold border border-primary/10 flex items-center gap-1">
                                🏛️ State: {item.dependencies.stateFranchise.businessName}
                              </span>
                            )}
                            {item.dependencies.districtFranchise && (
                              <span className="bg-primary/5 text-primary/80 px-2 py-0.5 rounded text-[9px] font-semibold border border-primary/10 flex items-center gap-1">
                                🏢 Dist: {item.dependencies.districtFranchise.businessName}
                              </span>
                            )}
                            {item.dependencies.mandalFranchise && (
                              <span className="bg-primary/5 text-primary/80 px-2 py-0.5 rounded text-[9px] font-semibold border border-primary/10 flex items-center gap-1">
                                🏘️ Mandal: {item.dependencies.mandalFranchise.businessName}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 w-full md:w-auto shrink-0 select-none border-t md:border-t-0 border-border/40 pt-3 md:pt-0">
                      <button
                        onClick={() => setSelectedDetailItem(item)}
                        className="flex-1 md:flex-none px-3.5 py-1.5 bg-primary/10 hover:bg-primary/20 text-primary font-bold text-xs rounded-xl flex items-center justify-center gap-1 transition-all border border-primary/15"
                      >
                        <Eye size={14} /> View
                      </button>

                      {!item.isDbVendor && (
                        <>
                          <button
                            onClick={() => handleAction(item.id, "Rejected")}
                            className="flex-1 md:flex-none px-3.5 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 font-bold text-xs rounded-xl flex items-center justify-center gap-1 transition-all border border-rose-500/15"
                          >
                            <X size={14} /> {activeSubTab === "kyc" ? "Reject KYC" : "Reject"}
                          </button>

                          <button
                            onClick={() => handleAction(item.id, "Approved")}
                            className="flex-1 md:flex-none px-3.5 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1 transition-all shadow-md shadow-emerald-500/10"
                          >
                            <Check size={14} />{" "}
                            {activeSubTab === "kyc" || item.status === "under_review"
                              ? "Verify KYC"
                              : "Approve"}
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                ))
              )}

              {!loading && currentItems.length === 0 && (
                <div className="py-12 text-center text-xs text-muted-foreground flex flex-col items-center justify-center space-y-2 select-none">
                  <ClipboardCheck size={28} className="text-muted-foreground/60" />
                  <p>All pending requests for {getSubTabLabel(activeSubTab)} have been audited.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="bg-card border border-border/80 rounded-2xl p-5 shadow-sm space-y-4">
          <div className="border-b border-border pb-3 flex items-center justify-between select-none">
            <h3 className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles size={14} className="text-primary" />
              Audit History Log
            </h3>
            <span className="text-[9px] text-muted-foreground">Recent Actions</span>
          </div>

          <div className="divide-y divide-border/60 max-h-96 overflow-y-auto no-scrollbar pr-1">
            {historyItems.map((item, idx) => (
              <div key={idx} className="py-3 first:pt-0 last:pb-0 flex items-center justify-between text-xs">
                <div>
                  <span className="font-semibold text-foreground block">{item.name}</span>
                  <span className="text-[9px] text-muted-foreground font-mono block mt-0.5">
                    {item.type} • Audited: {item.date}
                  </span>
                </div>
                <span
                  className={`px-2 py-0.5 rounded text-[8px] font-bold shrink-0 ${
                    item.status === "Approved"
                      ? "bg-emerald-500/10 text-emerald-500"
                      : "bg-rose-500/10 text-rose-500"
                  }`}
                >
                  {item.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {selectedDetailItem && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card border border-border max-w-lg w-full rounded-2xl overflow-hidden shadow-2xl p-6 relative text-xs text-foreground space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <h3 className="text-sm font-bold text-primary uppercase tracking-wider flex items-center gap-1.5">
                <Eye size={16} /> Complete Details
              </h3>
              <button
                onClick={() => setSelectedDetailItem(null)}
                className="px-2.5 py-1 bg-secondary hover:bg-secondary/80 text-foreground font-bold rounded-lg border border-border/40"
              >
                Close
              </button>
            </div>

            <div className="space-y-3.5 max-h-[70vh] overflow-y-auto pr-1">
              <div className="grid grid-cols-2 gap-3 bg-secondary/15 p-4 rounded-xl border border-border/40">
                <div>
                  <span className="text-muted-foreground block">Applicant Name</span>
                  <span className="font-semibold block mt-0.5">
                    {selectedDetailItem.contact || selectedDetailItem.name}
                  </span>
                </div>

                <div>
                  <span className="text-muted-foreground block">Email</span>
                  <span className="font-semibold block mt-0.5">{selectedDetailItem.email || "N/A"}</span>
                </div>

                <div>
                  <span className="text-muted-foreground block">Mobile</span>
                  <span className="font-semibold block mt-0.5">{selectedDetailItem.mobile || "N/A"}</span>
                </div>

                <div>
                  <span className="text-muted-foreground block">Opportunity Role</span>
                  <span className="font-bold text-primary block mt-0.5">
                    {selectedDetailItem.type || selectedDetailItem.role || "N/A"}
                  </span>
                </div>
              </div>

              <div className="space-y-2 bg-secondary/10 p-4 rounded-xl border border-border/40">
                <h4 className="font-bold text-foreground">Opportunity Specific Details</h4>

                <div className="grid grid-cols-2 gap-3">
                  {selectedDetailItem.franchiseLevel && (
                    <div>
                      <span className="text-muted-foreground block">Franchise Level</span>
                      <span className="font-semibold block mt-0.5">{selectedDetailItem.franchiseLevel}</span>
                    </div>
                  )}

                  {selectedDetailItem.investmentCapacity && (
                    <div>
                      <span className="text-muted-foreground block">Investment Capacity</span>
                      <span className="font-semibold block mt-0.5">
                        {selectedDetailItem.investmentCapacity} Lakhs
                      </span>
                    </div>
                  )}

                  {selectedDetailItem.gstNumber && (
                    <div>
                      <span className="text-muted-foreground block">GST Number</span>
                      <span className="font-mono font-semibold block mt-0.5">{selectedDetailItem.gstNumber}</span>
                    </div>
                  )}

                  {selectedDetailItem.panNumber && (
                    <div>
                      <span className="text-muted-foreground block">PAN Number</span>
                      <span className="font-mono font-semibold block mt-0.5">{selectedDetailItem.panNumber}</span>
                    </div>
                  )}

                  {selectedDetailItem.serviceType && (
                    <div>
                      <span className="text-muted-foreground block">Service Category / Domain</span>
                      <span className="font-semibold block mt-0.5">{selectedDetailItem.serviceType}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-2 bg-secondary/10 p-4 rounded-xl border border-border/40">
                <h4 className="font-bold text-foreground">Territory & Address Details</h4>

                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2">
                    <span className="text-muted-foreground block">Address</span>
                    <span className="font-semibold block mt-0.5">{selectedDetailItem.address || "N/A"}</span>
                  </div>

                  <div>
                    <span className="text-muted-foreground block">State</span>
                    <span className="font-semibold block mt-0.5">{selectedDetailItem.state || "N/A"}</span>
                  </div>

                  <div>
                    <span className="text-muted-foreground block">District</span>
                    <span className="font-semibold block mt-0.5">{selectedDetailItem.district || "N/A"}</span>
                  </div>

                  <div>
                    <span className="text-muted-foreground block">Mandal</span>
                    <span className="font-semibold block mt-0.5">{selectedDetailItem.mandal || "N/A"}</span>
                  </div>

                  <div>
                    <span className="text-muted-foreground block">Pincode</span>
                    <span className="font-semibold block mt-0.5">{selectedDetailItem.pincode || "N/A"}</span>
                  </div>
                </div>
              </div>

              {selectedDetailItem.dependencies && (
                <div className="space-y-2.5 bg-secondary/10 p-4 rounded-xl border border-border/40">
                  <h4 className="font-bold text-foreground flex items-center gap-1.5">
                    🏛️ Mapped Franchise Dependencies
                  </h4>

                  <div className="space-y-2">
                    <div>
                      <span className="text-[10px] text-muted-foreground block">State Franchise</span>
                      {selectedDetailItem.dependencies.stateFranchise ? (
                        <div className="bg-card p-2 rounded-lg border border-border/40 mt-1 flex justify-between items-center">
                          <div>
                            <span className="font-semibold block">{selectedDetailItem.dependencies.stateFranchise.businessName}</span>
                            <span className="text-[10px] text-muted-foreground font-mono">{selectedDetailItem.dependencies.stateFranchise.franchiseCode} • {selectedDetailItem.dependencies.stateFranchise.ownerName}</span>
                          </div>
                          <span className="px-1.5 py-0.5 bg-emerald-500/10 text-emerald-500 rounded text-[8px] font-bold">Active</span>
                        </div>
                      ) : (
                        <span className="text-rose-500 text-[10px] font-semibold block mt-1">⚠️ No Active State Franchise Mapped</span>
                      )}
                    </div>

                    <div>
                      <span className="text-[10px] text-muted-foreground block">District Franchise</span>
                      {selectedDetailItem.dependencies.districtFranchise ? (
                        <div className="bg-card p-2 rounded-lg border border-border/40 mt-1 flex justify-between items-center">
                          <div>
                            <span className="font-semibold block">{selectedDetailItem.dependencies.districtFranchise.businessName}</span>
                            <span className="text-[10px] text-muted-foreground font-mono">{selectedDetailItem.dependencies.districtFranchise.franchiseCode} • {selectedDetailItem.dependencies.districtFranchise.ownerName}</span>
                          </div>
                          <span className="px-1.5 py-0.5 bg-emerald-500/10 text-emerald-500 rounded text-[8px] font-bold">Active</span>
                        </div>
                      ) : (
                        <span className="text-rose-500 text-[10px] font-semibold block mt-1">⚠️ No Active District Franchise Mapped</span>
                      )}
                    </div>

                    <div>
                      <span className="text-[10px] text-muted-foreground block">Mandal Franchise</span>
                      {selectedDetailItem.dependencies.mandalFranchise ? (
                        <div className="bg-card p-2 rounded-lg border border-border/40 mt-1 flex justify-between items-center">
                          <div>
                            <span className="font-semibold block">{selectedDetailItem.dependencies.mandalFranchise.businessName}</span>
                            <span className="text-[10px] text-muted-foreground font-mono">{selectedDetailItem.dependencies.mandalFranchise.franchiseCode} • {selectedDetailItem.dependencies.mandalFranchise.ownerName}</span>
                          </div>
                          <span className="px-1.5 py-0.5 bg-emerald-500/10 text-emerald-500 rounded text-[8px] font-bold">Active</span>
                        </div>
                      ) : (
                        <span className="text-rose-500 text-[10px] font-semibold block mt-1">⚠️ No Active Mandal Franchise Mapped</span>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {selectedDetailItem.documents &&
                !selectedDetailItem.isDbVendor &&
                Object.keys(selectedDetailItem.documents).some(k => !!selectedDetailItem.documents[k]) && (
                  <div className="space-y-2 bg-secondary/15 p-4 rounded-xl border border-border/40">
                    <h4 className="font-bold text-foreground">Uploaded KYC Documents</h4>

                    <div className="grid grid-cols-2 gap-3">
                      {Object.entries(selectedDetailItem.documents).map(([key, url]) => {
                        if (!url) return null;

                        return (
                          <div key={key} className="flex flex-col">
                            <span className="text-muted-foreground block capitalize">{key}</span>
                            <a
                              href={url as string}
                              target="_blank"
                              rel="noreferrer"
                              className="text-primary hover:underline font-semibold flex items-center gap-1 mt-0.5"
                            >
                              View Document <ExternalLink size={10} />
                            </a>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

              {selectedDetailItem.isDbVendor && selectedDetailItem.documents && (
                <div className="space-y-3 bg-secondary/15 p-4 rounded-xl border border-border/40 text-left">
                  <h4 className="font-bold text-foreground">Uploaded KYC Documents</h4>

                  <div className="space-y-3">
                    {selectedDetailItem.documents.map((doc: any) => (
                      <div
                        key={doc.id}
                        className="flex justify-between items-center bg-card p-3 rounded-lg border border-border/40"
                      >
                        <div className="space-y-1">
                          <span className="font-bold text-foreground block">{doc.name}</span>

                          {doc.fileName && (
                            <span className="text-[10px] text-muted-foreground font-mono block">
                              {doc.fileName}
                            </span>
                          )}

                          <span
                            className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                              doc.status === "Approved"
                                ? "bg-emerald-500/10 text-emerald-500"
                                : doc.status === "Pending"
                                ? "bg-amber-500/10 text-amber-500"
                                : doc.status === "Rejected"
                                ? "bg-rose-500/10 text-rose-500"
                                : "bg-secondary text-muted-foreground"
                            }`}
                          >
                            {doc.status}
                          </span>
                        </div>

                        <div className="flex gap-2 items-center shrink-0">
                          {doc.url && (
                            <a
                              href={doc.url}
                              target="_blank"
                              rel="noreferrer"
                              className="px-2.5 py-1 bg-secondary text-foreground rounded-lg border border-border/60 hover:bg-secondary/80 font-bold"
                            >
                              View
                            </a>
                          )}

                          {doc.status === "Pending" && (
                            <>
                              <button
                                onClick={() =>
                                  handleUpdateDocStatus(selectedDetailItem.id, doc.id, "Approved")
                                }
                                className="px-2 py-1 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg font-bold text-[10px]"
                              >
                                Approve
                              </button>

                              <button
                                onClick={() =>
                                  handleUpdateDocStatus(selectedDetailItem.id, doc.id, "Rejected")
                                }
                                className="px-2 py-1 bg-rose-500 hover:bg-rose-600 text-white rounded-lg font-bold text-[10px]"
                              >
                                Reject
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="border-t border-border/40 pt-3 mt-3">
                    <span className="font-bold text-foreground block mb-2">Request Additional Document</span>

                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Document Name"
                        id="req-doc-name-input"
                        className="flex-1 bg-card border border-border/60 rounded-lg px-2.5 py-1.5 outline-none focus:border-primary text-xs text-foreground"
                      />

                      <button
                        onClick={async () => {
                          const inputEl = document.getElementById(
                            "req-doc-name-input"
                          ) as HTMLInputElement;

                          if (inputEl && inputEl.value) {
                            await handleRequestDoc(selectedDetailItem.id, inputEl.value);
                            inputEl.value = "";
                          }
                        }}
                        className="px-3 py-1.5 bg-primary text-primary-foreground font-bold rounded-lg hover:bg-primary/95 transition-all text-xs"
                      >
                        Send Request
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {!selectedDetailItem.isDbVendor && (
                <div className="flex gap-2 pt-2">
                  <button
                    onClick={() => handleAction(selectedDetailItem.id, "Rejected")}
                    className="flex-1 px-3.5 py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 font-bold text-xs rounded-xl border border-rose-500/15"
                  >
                    Reject
                  </button>

                  <button
                    onClick={() => handleAction(selectedDetailItem.id, "Approved")}
                    className="flex-1 px-3.5 py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs rounded-xl"
                  >
                    {activeSubTab === "kyc" || selectedDetailItem.status === "under_review"
                      ? "Verify KYC"
                      : "Approve"}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};