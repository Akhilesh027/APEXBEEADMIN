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
  ShieldCheck,
  Store,
  ShoppingBag,
  ArrowRight,
  RefreshCw,
  Edit3,
  Save,
  MapPin,
  Phone,
  Mail,
  Building,
  FileText
} from "lucide-react";
import { productService } from "../services/productService";

export const ApprovalCenter: React.FC = () => {
  const { addActivityLog } = useAdminState();

  const [activeSubTab, setActiveSubTab] = useState<
    | "all"
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
  >("all");

  const [, setPendingItems] = useState<Record<string, any[]>>({
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
  const [dbProducts, setDbProducts] = useState<any[]>([]);
  const [dbWallets, setDbWallets] = useState<any[]>([]);
  const [dbCategories, setDbCategories] = useState<any[]>([]);
  const [selectedParentCatId, setSelectedParentCatId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [notificationMsg, setNotificationMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Selected Detail Modal & Edit State
  const [selectedDetailItem, setSelectedDetailItem] = useState<any | null>(null);
  const [isEditMode, setIsEditMode] = useState<boolean>(true);
  const [editFormData, setEditFormData] = useState<any>({});
  const [editingSubcategories, setEditingSubcategories] = useState<string[]>([]);
  const [newSubCategoryName, setNewSubCategoryName] = useState<string>("");

  const parseSubcategories = (item: any): string[] => {
    if (!item) return [];
    const subs = item.approvedSubcategories || item.subCategories || item.subcategories;
    if (Array.isArray(subs) && subs.length > 0) {
      return subs.flatMap((s: any) => typeof s === 'string' && s.includes(',') ? s.split(',').map(x => x.trim()) : String(s).trim()).filter(Boolean);
    }
    const single = item.subCategory || item.subcategory;
    if (typeof single === 'string' && single.trim()) {
      const trimmed = single.trim();
      if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
        try {
          const p = JSON.parse(trimmed);
          if (Array.isArray(p)) return p.map((x: any) => String(x).trim()).filter(Boolean);
        } catch (e) { }
      }
      if (trimmed.includes(',')) return trimmed.split(',').map(s => s.trim()).filter(Boolean);
      return [trimmed];
    }
    return [];
  };

  const openDetailModal = (item: any) => {
    setSelectedDetailItem(item);
    setIsEditMode(true);

    setEditFormData({
      businessName: item.name || '',
      ownerName: item.contact || item.name || '',
      mobile: item.mobile || '',
      email: item.email || '',
      address: item.address || '',
      pincode: item.pincode || '',
      state: item.state || '',
      district: item.district || '',
      mandal: item.mandal || '',
      village: item.village || '',
      gstNumber: item.gstNumber || '',
      panNumber: item.panNumber || '',
      aadhaarNumber: item.aadhaarNumber || '',
      fssaiNumber: item.fssaiNumber || '',
      experience: item.experience || '',
      investmentCapacity: item.investmentCapacity || '',
      franchiseLevel: item.franchiseLevel || '',
      serviceType: item.serviceType || '',
      restaurantName: item.restaurantName || '',
      foodBusinessType: item.foodBusinessType || '',
      adminRemarks: item.adminRemarks || '',
    });

    if (item.primaryCategory || item.category) {
      const match = parentCategories.find((c: any) => c.name === item.primaryCategory || c.name === item.category);
      if (match) setSelectedParentCatId(match._id);
    }
    setEditingSubcategories(parseSubcategories(item));
  };

  const handleAddSubcategory = (subName: string) => {
    const trimmed = subName.trim();
    if (!trimmed) return;
    if (!editingSubcategories.includes(trimmed)) {
      setEditingSubcategories(prev => [...prev, trimmed]);
    }
    setNewSubCategoryName("");
  };

  const handleRemoveSubcategory = (indexToRemove: number) => {
    setEditingSubcategories(prev => prev.filter((_, idx) => idx !== indexToRemove));
  };

  const fetchEcosystemData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("adminToken");
      const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};

      const [appRes, categoryRes, vendorRes] = await Promise.all([
        fetch("https://server.apexbee.in/api/admin/applications", { headers }).catch(() => null),
        fetch("https://server.apexbee.in/api/categories", { headers }).catch(() => null),
        fetch("https://server.apexbee.in/api/admin/vendors", { headers }).catch(() => null),
      ]);

      if (appRes && appRes.ok) {
        const data = await appRes.json();
        if (data.applications) setApplications(data.applications);
      }
      if (categoryRes && categoryRes.ok) {
        const data = await categoryRes.json();
        const catList = Array.isArray(data) ? data : (data?.categories || data?.data || []);
        if (catList.length > 0) setDbCategories(catList);
      }
      if (vendorRes && vendorRes.ok) {
        const data = await vendorRes.json();
        if (data.vendors) setDbVendors(data.vendors);
      }

      setLoading(false);

      Promise.all([
        fetch("https://server.apexbee.in/api/admin/wallets", { headers }).catch(() => null),
        productService.getAll().catch(() => []),
      ]).then(async ([walletRes, productList]) => {
        if (walletRes && walletRes.ok) {
          const data = await walletRes.json();
          if (data.wallets) setDbWallets(data.wallets);
        }
        if (productList && Array.isArray(productList)) {
          setDbProducts(productList);
        }
      });
    } catch (err) {
      console.error("Error fetching ecosystem data in Approval Center:", err);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEcosystemData();
  }, []);

  useEffect(() => {
    if (selectedDetailItem && dbCategories.length > 0) {
      const appCat = selectedDetailItem.primaryCategory || selectedDetailItem.category || '';
      const parents = dbCategories.filter((c: any) => c.level === 1 || !c.parentId);
      const matched = parents.find((c: any) =>
        c.name.toLowerCase() === appCat.toLowerCase() ||
        c.name.toLowerCase().includes(appCat.toLowerCase()) ||
        appCat.toLowerCase().includes(c.name.toLowerCase())
      );
      if (matched) {
        setSelectedParentCatId(matched._id);
      } else if (parents.length > 0) {
        setSelectedParentCatId(parents[0]._id);
      }

      setEditingSubcategories(parseSubcategories(selectedDetailItem));
    }
  }, [selectedDetailItem, dbCategories]);

  const getTabForAppType = (type: string) => {
    const t = String(type || "").toLowerCase();

    if (
      t.includes("vendor") ||
      t.includes("restaurant") ||
      t.includes("food") ||
      t.includes("dining") ||
      t.includes("kitchen") ||
      t.includes("daily_needs") ||
      t.includes("grocery") ||
      t.includes("store")
    ) return "vendors";
    if (t.includes("wholesaler")) return "wholesalers";
    if (t.includes("entrepreneur")) return "entrepreneurs";
    if (t.includes("franchise")) return "franchises";
    if (t.includes("manufacturer")) return "manufacturers";
    if (t.includes("service_provider") || t.includes("service provider")) return "service_providers";
    if (t.includes("course_provider") || t.includes("course provider")) return "course_providers";
    if (t.includes("delivery_partner") || t.includes("delivery partner")) return "delivery_partners";

    return "vendors";
  };

  const getSubTabLabel = (tab: typeof activeSubTab) => {
    switch (tab) {
      case "all":
        return "All Applications";
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

  const mapApplicationToItem = (app: any) => {
    const parsedSubs = parseSubcategories(app);
    return {
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
      fssaiNumber: app.fssaiNumber,
      franchiseLevel: app.franchiseLevel,
      investmentCapacity: app.investmentCapacity,
      serviceType: app.serviceType,
      sampleVideoLink: app.sampleVideoLink,
      vehicleType: app.vehicleType,
      licenseNumber: app.licenseNumber,
      restaurantName: app.restaurantName,
      foodBusinessType: app.foodBusinessType,
      primaryCategory: app.primaryCategory || app.category,
      category: app.primaryCategory || app.category,
      subCategory: parsedSubs[0] || app.subCategory || "",
      approvedSubcategories: parsedSubs,
      address: app.address,
      pincode: app.pincode,
      state: app.state,
      district: app.district,
      mandal: app.mandal,
      village: app.village,
      documents: app.documents,
      dependencies: app.dependencies,
      adminRemarks: app.adminRemarks,
      isDbVendor: false,
    };
  };

  const getLocalDeliveryPartners = () => {
    if (typeof window === "undefined") return [];
    try {
      const raw = localStorage.getItem("apexbee_registered_partners_db");
      const rawSingle = localStorage.getItem("delivery_partner");
      const list: any[] = raw ? JSON.parse(raw) : [];
      if (rawSingle) {
        const p = JSON.parse(rawSingle);
        if (p && p.mobile && !list.some((x: any) => x.mobile === p.mobile)) {
          list.push(p);
        }
      }
      return list.map((p: any) => ({
        id: p.id || `dp_${p.mobile}`,
        name: p.name || "Delivery Partner Application",
        contact: p.name || p.mobile,
        date: new Date().toISOString().substring(0, 10),
        priority: p.status === "pending_approval" ? "High" : "Normal",
        type: "Delivery Partner Application",
        applicationType: "delivery_partner",
        roleId: "delivery_partner",
        email: p.email,
        mobile: p.mobile,
        status: p.status || "pending_approval",
        vehicleType: p.vehicle?.type,
        licenseNumber: p.vehicle?.drivingLicense,
        aadhaarNumber: p.aadhaarNumber,
        panNumber: p.panNumber,
        bankAccounts: p.bankDetails ? [p.bankDetails] : [],
        isLocalPartner: true,
        partnerRaw: p,
      }));
    } catch (e) {
      return [];
    }
  };

  const getPendingItemsForTab = (tab: string): any[] => {
    if (tab === "all") {
      const allAppItems = applications.map(mapApplicationToItem);
      const localPartners = getLocalDeliveryPartners();
      const kycItems = getPendingItemsForTab("kyc");
      const prodItems = getPendingItemsForTab("products");
      const walletItems = getPendingItemsForTab("withdrawals");
      return [...allAppItems, ...localPartners, ...kycItems, ...prodItems, ...walletItems];
    }

    if (tab === "delivery_partners") {
      const backendDeliveryApps = applications
        .filter(app => {
          const t = String(app.roleId || app.applicationType || "").toLowerCase();
          return t.includes("delivery") || t.includes("rider") || t.includes("partner");
        })
        .map(mapApplicationToItem);

      const localPartners = getLocalDeliveryPartners();
      return [...backendDeliveryApps, ...localPartners];
    }

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
          primaryCategory: vendor.primaryCategory || vendor.category,
          category: vendor.primaryCategory || vendor.category,
          subCategory: vendor.subCategory,
          approvedSubcategories: Array.isArray(vendor.approvedSubcategories) && vendor.approvedSubcategories.length > 0
            ? vendor.approvedSubcategories
            : (vendor.subCategory ? [vendor.subCategory] : []),
          gstNumber: vendor.gstNumber,
          panNumber: vendor.panNumber,
          fssaiNumber: vendor.fssaiNumber,
          address: vendor.address,
          pincode: vendor.pincode,
          state: vendor.state,
          district: vendor.district,
          mandal: vendor.mandal,
          village: vendor.village,
          bankAccounts: vendor.bankAccounts || [],
          documents: vendor.documents || [],
          isDbVendor: true,
        }));

      return [...appItems, ...vendorItems];
    }

    if (tab === "products") {
      const pendingProds = dbProducts.filter((p: any) => p.status !== "Live" && p.status !== "Rejected");

      const uniqueProdsMap = new Map();
      pendingProds.forEach((p: any) => {
        const isFood = p.isFoodItem || p.itemType === 'FOOD' || p.productMode === 'FOOD' || Boolean(p.foodMenuItemId) || Boolean(p.restaurantId);
        const key = p.foodMenuItemId ? `food_${p.foodMenuItemId}` : `prod_${p._id || p.id || p.sku}`;

        let alreadyExists = uniqueProdsMap.has(key);
        if (!alreadyExists) {
          for (const existing of uniqueProdsMap.values()) {
            if (existing.name?.toLowerCase() === p.name?.toLowerCase() && isFood === existing.isFood) {
              alreadyExists = true;
              break;
            }
          }
        }

        if (!alreadyExists) {
          uniqueProdsMap.set(key, {
            id: p._id,
            name: p.name,
            contact: p.sellerId?.name || p.sellerType || (isFood ? "Restaurant Partner" : "Vendor"),
            date: new Date(p.updatedAt || p.createdAt || Date.now()).toISOString().substring(0, 10),
            priority: p.status === "Pending Review" ? "High" : "Normal",
            type: isFood ? `Restaurant Item (${p.sku || "FOOD"})` : `Product (${p.sku || "SKU"})`,
            status: p.status,
            baseMrp: p.baseMrp || p.basePrice || 0,
            baseSellingPrice: p.baseSellingPrice || p.offerPrice || 0,
            sellerType: p.sellerType,
            description: p.description,
            variants: p.variants || [],
            images: p.images || (p.image ? [p.image] : []),
            isProduct: true,
            isFood,
          });
        }
      });

      return Array.from(uniqueProdsMap.values());
    }

    if (tab === "withdrawals") {
      return dbWallets
        .filter((w: any) => (w.pendingWithdrawalAmount || 0) > 0 || (w.availableBalance || 0) > 1000)
        .map((w: any) => ({
          id: w._id || w.id,
          name: w.userId?.name || w.userId?.email || "Partner Wallet",
          contact: w.userId?.mobile || "N/A",
          date: new Date(w.updatedAt || Date.now()).toISOString().substring(0, 10),
          priority: "High",
          type: `Wallet Payout (₹${w.pendingWithdrawalAmount || w.availableBalance || 0})`,
          status: "Pending Payout",
          availableBalance: w.availableBalance || 0,
          pendingWithdrawalAmount: w.pendingWithdrawalAmount || 0,
          isWallet: true,
        }));
    }

    return applications
      .filter(
        app =>
          getTabForAppType(app.roleId || app.applicationType) === tab &&
          ["pending", "under_review", "kyc_submitted"].includes(app.status)
      )
      .map(mapApplicationToItem);
  };

  const parentCategories = dbCategories.filter((c: any) => c.level === 1 || !c.parentId);

  const activeParentCat = parentCategories.find(
    (c: any) => String(c._id) === String(selectedParentCatId)
  ) || parentCategories[0];

  const currentSubCategories = dbCategories.filter((c: any) => {
    if (c.level !== 2) return false;
    const parentIdStr = typeof c.parentId === 'object' ? c.parentId?._id : c.parentId;
    return String(parentIdStr) === String(activeParentCat?._id);
  });

  const getCapabilitiesForCategory = (cat: any) => {
    if (!cat) return [];
    const slug = (cat.slug || cat.name || '').toLowerCase();

    if (slug.includes('devotional')) {
      return [
        { id: 'pooja_store', label: 'Pooja Store' },
        { id: 'flower_shop', label: 'Flower Shop' },
        { id: 'coconut_shop', label: 'Coconut Shop' },
        { id: 'fruit_shop', label: 'Fruit Shop' },
        { id: 'sweet_shop', label: 'Sweet Shop' },
        { id: 'prasadam_partner', label: 'Prasadam Partner' },
        { id: 'idol_statue_shop', label: 'Idol & Statue Shop' },
        { id: 'photo_frame_shop', label: 'Photo Frame Shop' },
        { id: 'brass_copper_shop', label: 'Brass & Copper Shop' },
        { id: 'spiritual_book_shop', label: 'Spiritual Book Shop' },
        { id: 'priest_pandit', label: 'Priest / Pandit' },
        { id: 'devotional_wholesaler', label: 'Devotional Wholesaler' },
      ];
    }
    if (slug.includes('restaurant') || slug.includes('food')) {
      return [
        { id: 'full_service_restaurant', label: 'Full-Service Restaurant' },
        { id: 'quick_service_restaurant', label: 'Quick-Service Restaurant' },
        { id: 'cloud_kitchen', label: 'Cloud Kitchen' },
        { id: 'home_kitchen', label: 'Home Kitchen' },
        { id: 'tiffin_center', label: 'Tiffin Center' },
        { id: 'cafe', label: 'Cafe & Bakery' },
        { id: 'sweet_shop', label: 'Sweet Shop & Desserts' },
        { id: 'biryani_outlet', label: 'Biryani Outlet' },
        { id: 'catering_service', label: 'Catering Service' },
        { id: 'restaurant_raw_material_wholesaler', label: 'Raw Material Wholesaler' },
      ];
    }
    if (slug.includes('daily') || slug.includes('grocery') || slug.includes('need')) {
      return [
        { id: 'vegetable_shop', label: 'Vegetable & Fruit Shop' },
        { id: 'local_milk_vendor', label: 'Local Milk Vendor' },
        { id: 'kirana_store', label: 'Kirana & Mini Mart' },
        { id: 'supermarket', label: 'Supermarket' },
        { id: 'ro_water_plant', label: 'Water Supplier' },
        { id: 'organic_food_store', label: 'Organic Food Store' },
        { id: 'chicken_shop', label: 'Meat & Chicken Shop' },
        { id: 'fish_market', label: 'Fish & Seafood Market' },
      ];
    }
    return [
      { id: 'retail_store', label: 'Retail Store' },
      { id: 'wholesaler', label: 'Wholesaler' },
      { id: 'service_provider', label: 'Service Provider' },
    ];
  };

  const activeCategoryCapabilities = getCapabilitiesForCategory(activeParentCat);

  // Save Edits directly without approving immediately
  const handleSaveDetailsOnly = async () => {
    if (!selectedDetailItem?.id) return;
    try {
      setActionLoading(true);
      setNotificationMsg(null);
      const token = localStorage.getItem("adminToken");
      const assignedCatName = activeParentCat?.name || selectedDetailItem.primaryCategory || selectedDetailItem.category;

      const payload = {
        ...editFormData,
        primaryCategory: assignedCatName,
        category: assignedCatName,
        subCategory: editingSubcategories[0] || editFormData.subCategory || "",
        approvedSubcategories: editingSubcategories,
      };

      const res = await fetch(`https://server.apexbee.in/api/admin/applications/${selectedDetailItem.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setNotificationMsg({ type: 'success', text: "Applicant details updated successfully!" });
        setSelectedDetailItem((prev: any) => ({
          ...prev,
          ...payload,
          name: editFormData.businessName,
          contact: editFormData.ownerName,
        }));
        await fetchEcosystemData();
      } else {
        setNotificationMsg({ type: 'error', text: data.message || "Failed to update details" });
      }
    } catch (err: any) {
      setNotificationMsg({ type: 'error', text: err.message || "Network error saving details" });
    } finally {
      setActionLoading(false);
    }
  };

  // Main Action: Approve or Reject (with edited details passed along)
  const handleAction = async (id: string, action: "Approved" | "Rejected") => {
    const isRealApp = applications.some(app => app._id === id);

    if (!isRealApp) {
      const queue = getPendingItemsForTab(activeSubTab);
      const item = queue.find(i => i.id === id);

      if (!item) return;

      if (item.isLocalPartner || item.partnerRaw) {
        const mob = item.mobile;
        const newStatus = action === "Approved" ? "active" : "rejected";

        try {
          const rawList = localStorage.getItem("apexbee_registered_partners_db");
          if (rawList) {
            const list = JSON.parse(rawList);
            const idx = list.findIndex((p: any) => p.mobile === mob);
            if (idx >= 0) {
              list[idx].status = newStatus;
              localStorage.setItem("apexbee_registered_partners_db", JSON.stringify(list));
            }
          }

          const rawSingle = localStorage.getItem("delivery_partner");
          if (rawSingle) {
            const p = JSON.parse(rawSingle);
            if (p.mobile === mob) {
              p.status = newStatus;
              localStorage.setItem("delivery_partner", JSON.stringify(p));
            }
          }
        } catch (e) { }

        alert(`Delivery Partner ${item.name} (${mob}) status updated to ${newStatus.toUpperCase()}!`);
      }

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
      setActionLoading(true);
      const token = localStorage.getItem("adminToken");
      const currentApp = applications.find(app => app._id === id);

      let endpoint = `https://server.apexbee.in/api/admin/applications/${id}/${action === "Approved" ? "approve" : "reject"
        }`;

      if (
        action === "Approved" &&
        (activeSubTab === "kyc" || currentApp?.status === "under_review")
      ) {
        endpoint = `https://server.apexbee.in/api/admin/applications/${id}/verify-kyc`;
      }

      const assignedCatName = activeParentCat?.name || editFormData.primaryCategory || currentApp?.primaryCategory || currentApp?.category || "Food & Restaurant";
      const assignedParentId = activeParentCat?._id;

      const checkedCaps = Array.from(document.querySelectorAll('.cat-cap-cb:checked')).map(el => (el as HTMLInputElement).value);
      const checkedSubCatIds = Array.from(document.querySelectorAll('.cat-subcat-cb:checked')).map(el => (el as HTMLInputElement).value);

      const payload = {
        // Send all edited application fields
        ...editFormData,
        primaryCategory: assignedCatName,
        category: assignedCatName,
        subCategory: editingSubcategories[0] || editFormData.subCategory || "",
        approvedSubcategories: editingSubcategories,
        requestedCapabilities: checkedCaps,
        adminRemarks:
          editFormData.adminRemarks ||
          (activeSubTab === "kyc" || currentApp?.status === "under_review" || currentApp?.status === "kyc_submitted"
            ? "KYC verified and approved by admin with edited parameters."
            : `Pre-approved by admin under category ${assignedCatName}.`),
      };

      const res = await fetch(endpoint, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorData = await res.json();
        alert(errorData?.message || `Failed to set status to ${action}`);
        setActionLoading(false);
        return;
      }

      const data = await res.json();
      const app = data.application || currentApp;

      // Submit category capability review if vendor exists
      if (app?.userId) {
        try {
          const vRes = await fetch(`https://server.apexbee.in/api/admin/vendors`, {
            headers: token ? { Authorization: `Bearer ${token}` } : {},
          });
          if (vRes.ok) {
            const vData = await vRes.json();
            const matchingVendor = vData.vendors?.find((v: any) => v.userId?._id === app.userId || v.userId === app.userId || v._id === app.userId);
            if (matchingVendor) {
              await fetch(`https://server.apexbee.in/api/devotional/admin/vendors/${matchingVendor._id}/category-access/review`, {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                  parentCategoryId: assignedParentId,
                  approvedCapabilities: checkedCaps.length > 0 ? checkedCaps : activeCategoryCapabilities.map(c => c.id),
                  approvedSubcategoryIds: checkedSubCatIds,
                  status: action === "Approved" ? "approved" : "rejected",
                  restrictions: {
                    canCreateProducts: true,
                    canCreateServices: true,
                    canJoinFestivalCombos: true,
                    canAcceptBulkOrders: true,
                    canSellWholesale: true,
                    canOfferSubscriptions: true,
                  }
                }),
              });
            }
          }
        } catch (capErr) {
          console.error("Capability review error:", capErr);
        }
      }

      addActivityLog(
        `Application ${action}`,
        `Application for ${app.applicationType} (${app.businessName}) was ${action.toLowerCase()} by Admin.`,
        "kyc"
      );

      await fetchEcosystemData();

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
    } finally {
      setActionLoading(false);
    }
  };

  const currentItems = getPendingItemsForTab(activeSubTab);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-card border border-border rounded-2xl p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-extrabold text-foreground">
              Approval Center
            </h1>
            <span className="bg-primary/10 text-primary px-2.5 py-0.5 rounded-full text-[10px] font-bold">
              Omni-Queue Active
            </span>
          </div>

          <p className="text-xs text-muted-foreground mt-1">
            Centralized moderation hub with full in-line editing for applicant details, pincodes, categories, and territories during approval.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => fetchEcosystemData()}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-secondary hover:bg-secondary/80 text-xs font-semibold text-foreground border border-border cursor-pointer transition-all"
            title="Refresh list"
          >
            <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
            <span>Refresh Queue</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Deck */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1 */}
        <div
          onClick={() => setActiveSubTab("all")}
          className={`p-4 rounded-2xl border transition-all cursor-pointer select-none group ${activeSubTab === "all"
            ? "bg-primary/10 border-primary shadow-md shadow-primary/15"
            : "bg-card border-border hover:border-primary/50 hover:bg-primary/[0.03]"
            }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-primary">
              Omni-Queue Total
            </span>
            <div className="p-2 rounded-xl bg-primary/10 text-primary">
              <ClipboardCheck size={18} />
            </div>
          </div>
          <div className="mt-2">
            <h3 className="text-2xl font-black text-foreground">
              {getPendingItemsForTab("all").length}
            </h3>
            <p className="text-[11px] text-muted-foreground mt-0.5 font-medium">
              All pending approvals across platform
            </p>
          </div>
          <div className="mt-3 pt-2.5 border-t border-border/60 flex items-center justify-between text-[10px] font-bold">
            <span className="text-primary">Master Queue</span>
            <span className="text-muted-foreground group-hover:text-foreground transition-colors flex items-center gap-1">
              View All <ArrowRight size={10} />
            </span>
          </div>
        </div>

        {/* Card 2 */}
        <div
          onClick={() => setActiveSubTab("vendors")}
          className={`p-4 rounded-2xl border transition-all cursor-pointer select-none group ${["vendors", "wholesalers", "franchises", "manufacturers", "entrepreneurs", "service_providers", "course_providers", "delivery_partners"].includes(activeSubTab)
            ? "bg-indigo-500/10 border-indigo-500 shadow-md shadow-indigo-500/15"
            : "bg-card border-border hover:border-indigo-500/50 hover:bg-indigo-500/[0.03]"
            }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
              Partner Onboarding
            </span>
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-600">
              <Store size={18} />
            </div>
          </div>
          <div className="mt-2">
            <h3 className="text-2xl font-black text-foreground">
              {getPendingItemsForTab("vendors").length +
                getPendingItemsForTab("wholesalers").length +
                getPendingItemsForTab("franchises").length +
                getPendingItemsForTab("delivery_partners").length}
            </h3>
            <p className="text-[11px] text-muted-foreground mt-0.5 font-medium">
              Stores, franchises & rider registrations
            </p>
          </div>
          <div className="mt-3 pt-2.5 border-t border-border/60 flex items-center justify-between text-[10px] font-bold">
            <span className="text-indigo-600">Merchant Networks</span>
            <span className="text-muted-foreground group-hover:text-foreground transition-colors flex items-center gap-1">
              View Partners <ArrowRight size={10} />
            </span>
          </div>
        </div>

        {/* Card 3 */}
        <div
          onClick={() => setActiveSubTab("products")}
          className={`p-4 rounded-2xl border transition-all cursor-pointer select-none group ${activeSubTab === "products"
            ? "bg-amber-500/10 border-amber-500 shadow-md shadow-amber-500/15"
            : "bg-card border-border hover:border-amber-500/50 hover:bg-amber-500/[0.03]"
            }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-600 dark:text-amber-400">
              Products & Catalog
            </span>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600">
              <ShoppingBag size={18} />
            </div>
          </div>
          <div className="mt-2">
            <h3 className="text-2xl font-black text-foreground">
              {getPendingItemsForTab("products").length}
            </h3>
            <p className="text-[11px] text-muted-foreground mt-0.5 font-medium">
              Store catalogues & inventory audits
            </p>
          </div>
          <div className="mt-3 pt-2.5 border-t border-border/60 flex items-center justify-between text-[10px] font-bold">
            <span className="text-amber-600">Catalogue Health</span>
            <span className="text-muted-foreground group-hover:text-foreground transition-colors flex items-center gap-1">
              Review Items <ArrowRight size={10} />
            </span>
          </div>
        </div>

        {/* Card 4 */}
        <div
          onClick={() => setActiveSubTab("kyc")}
          className={`p-4 rounded-2xl border transition-all cursor-pointer select-none group ${["kyc", "withdrawals"].includes(activeSubTab)
            ? "bg-emerald-500/10 border-emerald-500 shadow-md shadow-emerald-500/15"
            : "bg-card border-border hover:border-emerald-500/50 hover:bg-emerald-500/[0.03]"
            }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
              KYC & Settlements
            </span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600">
              <ShieldCheck size={18} />
            </div>
          </div>
          <div className="mt-2">
            <h3 className="text-2xl font-black text-foreground">
              {getPendingItemsForTab("kyc").length + getPendingItemsForTab("withdrawals").length}
            </h3>
            <p className="text-[11px] text-muted-foreground mt-0.5 font-medium">
              Identity verification & partner payouts
            </p>
          </div>
          <div className="mt-3 pt-2.5 border-t border-border/60 flex items-center justify-between text-[10px] font-bold">
            <span className="text-emerald-600">Compliance & Finance</span>
            <span className="text-muted-foreground group-hover:text-foreground transition-colors flex items-center gap-1">
              Verify Now <ArrowRight size={10} />
            </span>
          </div>
        </div>
      </div>

      {/* Subtab Navigation Pills */}
      <div className="flex gap-1.5 flex-wrap bg-card border border-border/60 p-2 rounded-2xl select-none shadow-sm">
        {[
          "all",
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
        ].map(tab => {
          const count = getPendingItemsForTab(tab).length;
          const isSelected = activeSubTab === tab;
          return (
            <button
              key={tab}
              onClick={() => setActiveSubTab(tab as any)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${isSelected
                ? "bg-primary text-primary-foreground border-primary shadow-md shadow-primary/20 scale-[1.02]"
                : "bg-transparent text-muted-foreground border-transparent hover:bg-secondary/60 hover:text-foreground"
                }`}
            >
              <span>{tab === "all" ? "🌐 All Applications" : getSubTabLabel(tab as any)}</span>
              <span
                className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${isSelected
                  ? "bg-white text-primary"
                  : "bg-secondary text-foreground border border-border/40"
                  }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Main Grid: Queue & Logs */}
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
                  Loading approvals queue...
                </div>
              ) : (
                currentItems.map((item: any) => (
                  <div
                    key={item.id}
                    className="bg-secondary/15 p-4 rounded-xl border border-border/40 flex flex-col md:flex-row justify-between items-start md:items-center gap-3 transition-all hover:bg-secondary/25"
                  >
                    <div className="space-y-1 text-xs">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-foreground text-sm">{item.name}</span>
                        <span
                          className={`px-2 py-0.5 rounded text-[8px] font-bold ${item.priority === "High"
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
                        <p>ID: {item.id} • Registered: {item.date} • Rep: <strong>{item.contact || "N/A"}</strong></p>
                        <div className="flex flex-wrap items-center gap-2 mt-0.5 text-foreground font-sans text-[11px]">
                          <span>📍 Location: <strong>{[item.mandal, item.district, item.state].filter(Boolean).join(", ") || item.address || "N/A"}</strong></span>
                          <span className="bg-primary/10 text-primary px-2 py-0.5 rounded border border-primary/20 font-mono font-bold text-[10px]">
                            PIN: {item.pincode || "Not Set"}
                          </span>
                          {item.mobile && <span>📞 {item.mobile}</span>}
                        </div>

                        {(activeSubTab === "vendors" || item.isVendor || item.roleId === "vendor" || item.applicationType === "vendor") && (item.primaryCategory || item.category) && (
                          <div className="flex flex-wrap items-center gap-1 mt-1 font-sans text-xs">
                            <span className="font-bold text-foreground">Category:</span>
                            <span className="bg-primary/10 text-primary font-extrabold px-2 py-0.5 rounded-md text-[10px]">
                              {item.primaryCategory || item.category}
                            </span>
                            {item.approvedSubcategories && item.approvedSubcategories.length > 0 && (
                              <>
                                <span className="font-bold text-foreground ml-1">Subcategories ({item.approvedSubcategories.length}):</span>
                                {item.approvedSubcategories.slice(0, 3).map((sub: string, idx: number) => (
                                  <span key={idx} className="bg-emerald-500/10 text-emerald-600 font-bold px-2 py-0.5 rounded-md text-[10px] border border-emerald-500/20">
                                    {sub}
                                  </span>
                                ))}
                                {item.approvedSubcategories.length > 3 && (
                                  <span className="text-[9px] text-muted-foreground font-semibold">+{item.approvedSubcategories.length - 3} more</span>
                                )}
                              </>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 w-full md:w-auto shrink-0 select-none border-t md:border-t-0 border-border/40 pt-3 md:pt-0">
                      <button
                        onClick={() => openDetailModal(item)}
                        className="flex-1 md:flex-none px-3.5 py-1.5 bg-primary/10 hover:bg-primary/20 text-primary font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-all border border-primary/20 cursor-pointer"
                        title="Edit details and review application"
                      >
                        <Edit3 size={13} /> Edit & Review
                      </button>

                      {!item.isDbVendor && (
                        <>
                          <button
                            onClick={() => handleAction(item.id, "Rejected")}
                            disabled={actionLoading}
                            className="flex-1 md:flex-none px-3.5 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 font-bold text-xs rounded-xl flex items-center justify-center gap-1 transition-all border border-rose-500/15 cursor-pointer disabled:opacity-50"
                          >
                            <X size={14} /> Reject
                          </button>

                          <button
                            onClick={() => openDetailModal(item)}
                            disabled={actionLoading}
                            className="flex-1 md:flex-none px-4 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-sm cursor-pointer disabled:opacity-50"
                          >
                            <Check size={14} /> Approve
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

        {/* Right Column: History Log */}
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
                  className={`px-2 py-0.5 rounded text-[8px] font-bold shrink-0 ${item.status === "Approved"
                    ? "bg-emerald-500/10 text-emerald-500"
                    : "bg-rose-500/10 text-rose-500"
                    }`}
                >
                  {item.status}
                </span>
              </div>
            ))}
            {historyItems.length === 0 && (
              <p className="text-center text-xs text-muted-foreground py-8 select-none">
                No recent actions in this session.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Comprehensive Audit & Edit Modal */}
      {selectedDetailItem && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-card border border-border max-w-5xl w-full max-h-[92vh] rounded-2xl overflow-hidden shadow-2xl flex flex-col text-xs text-foreground">

            {/* Modal Header */}
            <div className="flex items-center justify-between p-5 border-b border-border bg-muted/30">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-primary/10 rounded-xl text-primary font-bold">
                  <Edit3 size={20} />
                </div>
                <div className="text-left">
                  <h3 className="text-base font-black text-foreground uppercase tracking-wide flex items-center gap-2">
                    <span>Audit & Edit Details Before Approval</span>
                    <span className="text-xs font-mono font-normal text-muted-foreground">({selectedDetailItem.name})</span>
                  </h3>
                  <p className="text-xs text-muted-foreground flex items-center gap-2">
                    <span>Role: <strong>{selectedDetailItem.type || selectedDetailItem.roleId}</strong></span>
                    <span>•</span>
                    <span className="font-mono text-primary font-bold">📮 PIN: {editFormData.pincode || selectedDetailItem.pincode || "Not Set"}</span>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsEditMode(!isEditMode)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition flex items-center gap-1.5 ${isEditMode
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-secondary text-foreground border-border"
                    }`}
                >
                  <Edit3 size={13} /> {isEditMode ? "Editing Enabled" : "Enable Edit Mode"}
                </button>
                <span className={`px-3 py-1 rounded-full text-xs font-extrabold uppercase ${selectedDetailItem.status === "approved" || selectedDetailItem.status === "pre_approved"
                  ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"
                  : "bg-amber-500/10 text-amber-500 border border-amber-500/20"
                  }`}>
                  {selectedDetailItem.status || "Pending"}
                </span>
                <button
                  onClick={() => setSelectedDetailItem(null)}
                  className="p-2 bg-secondary hover:bg-secondary/80 text-foreground font-bold rounded-xl border border-border/40 transition-all cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Notification alert */}
            {notificationMsg && (
              <div className={`mx-6 mt-4 p-3 rounded-xl text-xs font-bold flex items-center justify-between border ${notificationMsg.type === 'success'
                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500'
                : 'bg-rose-500/10 border-rose-500/20 text-rose-500'
                }`}>
                <span>{notificationMsg.text}</span>
                <button onClick={() => setNotificationMsg(null)} className="p-1">
                  <X size={14} />
                </button>
              </div>
            )}

            {/* Modal Body */}
            <div className="p-6 space-y-5 overflow-y-auto flex-1 text-left">

              {/* Section 1: Business & Identity Details (Editable) */}
              <div className="bg-secondary/15 p-4 rounded-xl border border-border/40 space-y-3">
                <div className="flex items-center justify-between border-b border-border/40 pb-2">
                  <h4 className="font-extrabold text-primary text-xs uppercase tracking-wide flex items-center gap-1.5">
                    <Building size={14} /> 1. Store / Business & Representative Details
                  </h4>
                  <span className="text-[10px] text-muted-foreground font-semibold">Admin Editable</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-muted-foreground uppercase">Store / Business Name *</label>
                    <input
                      type="text"
                      value={editFormData.businessName}
                      onChange={(e) => setEditFormData({ ...editFormData, businessName: e.target.value })}
                      className="w-full p-2 bg-secondary/40 border border-border rounded-xl text-xs font-bold outline-none focus:border-primary text-foreground"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-muted-foreground uppercase">Owner / Representative Name *</label>
                    <input
                      type="text"
                      value={editFormData.ownerName}
                      onChange={(e) => setEditFormData({ ...editFormData, ownerName: e.target.value })}
                      className="w-full p-2 bg-secondary/40 border border-border rounded-xl text-xs font-bold outline-none focus:border-primary text-foreground"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-muted-foreground uppercase">Mobile / Phone *</label>
                    <div className="relative">
                      <Phone size={12} className="absolute left-2.5 top-2.5 text-muted-foreground" />
                      <input
                        type="text"
                        value={editFormData.mobile}
                        onChange={(e) => setEditFormData({ ...editFormData, mobile: e.target.value })}
                        className="w-full pl-7 pr-2 py-2 bg-secondary/40 border border-border rounded-xl text-xs font-mono font-bold outline-none focus:border-primary text-foreground"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-muted-foreground uppercase">Email Address</label>
                    <div className="relative">
                      <Mail size={12} className="absolute left-2.5 top-2.5 text-muted-foreground" />
                      <input
                        type="email"
                        value={editFormData.email}
                        onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                        className="w-full pl-7 pr-2 py-2 bg-secondary/40 border border-border rounded-xl text-xs outline-none focus:border-primary text-foreground"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-muted-foreground uppercase">GST Number (GSTIN)</label>
                    <input
                      type="text"
                      placeholder="e.g. 36AABCU9603R1ZM"
                      value={editFormData.gstNumber}
                      onChange={(e) => setEditFormData({ ...editFormData, gstNumber: e.target.value.toUpperCase() })}
                      className="w-full p-2 bg-secondary/40 border border-border rounded-xl text-xs font-mono outline-none focus:border-primary text-foreground"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-muted-foreground uppercase">PAN Card Number</label>
                    <input
                      type="text"
                      placeholder="e.g. ABCDE1234F"
                      value={editFormData.panNumber}
                      onChange={(e) => setEditFormData({ ...editFormData, panNumber: e.target.value.toUpperCase() })}
                      className="w-full p-2 bg-secondary/40 border border-border rounded-xl text-xs font-mono outline-none focus:border-primary text-foreground"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-muted-foreground uppercase">Aadhaar Number</label>
                    <input
                      type="text"
                      placeholder="12-digit Aadhaar"
                      value={editFormData.aadhaarNumber}
                      onChange={(e) => setEditFormData({ ...editFormData, aadhaarNumber: e.target.value })}
                      className="w-full p-2 bg-secondary/40 border border-border rounded-xl text-xs font-mono outline-none focus:border-primary text-foreground"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-muted-foreground uppercase">FSSAI License Number</label>
                    <input
                      type="text"
                      placeholder="14-digit FSSAI"
                      value={editFormData.fssaiNumber}
                      onChange={(e) => setEditFormData({ ...editFormData, fssaiNumber: e.target.value })}
                      className="w-full p-2 bg-secondary/40 border border-border rounded-xl text-xs font-mono outline-none focus:border-primary text-foreground"
                    />
                  </div>

                  {selectedDetailItem.franchiseLevel && (
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-muted-foreground uppercase">Franchise Tier</label>
                      <select
                        value={editFormData.franchiseLevel}
                        onChange={(e) => setEditFormData({ ...editFormData, franchiseLevel: e.target.value })}
                        className="w-full p-2 bg-secondary/40 border border-border rounded-xl text-xs outline-none focus:border-primary text-foreground font-semibold"
                      >
                        <option value="state">State Level</option>
                        <option value="district">District Level</option>
                        <option value="mandal">Mandal Level</option>
                      </select>
                    </div>
                  )}

                  {selectedDetailItem.investmentCapacity && (
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-muted-foreground uppercase">Investment Capacity (Lakhs)</label>
                      <input
                        type="text"
                        value={editFormData.investmentCapacity}
                        onChange={(e) => setEditFormData({ ...editFormData, investmentCapacity: e.target.value })}
                        className="w-full p-2 bg-secondary/40 border border-border rounded-xl text-xs outline-none focus:border-primary text-foreground"
                      />
                    </div>
                  )}

                  {selectedDetailItem.serviceType && (
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-muted-foreground uppercase">Service Specialization</label>
                      <input
                        type="text"
                        value={editFormData.serviceType}
                        onChange={(e) => setEditFormData({ ...editFormData, serviceType: e.target.value })}
                        className="w-full p-2 bg-secondary/40 border border-border rounded-xl text-xs outline-none focus:border-primary text-foreground"
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Section 2: Address & Pincode Territory (Editable) */}
              <div className="bg-primary/5 p-4 rounded-xl border border-primary/20 space-y-3">
                <div className="flex items-center justify-between border-b border-primary/15 pb-2">
                  <h4 className="font-extrabold text-primary text-xs uppercase tracking-wide flex items-center gap-1.5">
                    <MapPin size={14} /> 2. Address & Pincode Dispatch Parameters
                  </h4>
                  <span className="font-mono font-bold text-xs bg-primary/10 text-primary border border-primary/25 px-2.5 py-0.5 rounded-lg">
                    POSTAL PINCODE: {editFormData.pincode || 'NOT SET'}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="sm:col-span-2 space-y-1">
                    <label className="text-[10px] font-bold text-muted-foreground uppercase">Full Street / Shop Address *</label>
                    <textarea
                      rows={2}
                      value={editFormData.address}
                      onChange={(e) => setEditFormData({ ...editFormData, address: e.target.value })}
                      className="w-full p-2 bg-card border border-border rounded-xl text-xs outline-none focus:border-primary text-foreground"
                      placeholder="Street, Landmark, Building name..."
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-primary uppercase flex items-center gap-1">
                      📮 PIN Code * (Dispatch Key)
                    </label>
                    <input
                      type="text"
                      maxLength={6}
                      value={editFormData.pincode}
                      onChange={(e) => setEditFormData({ ...editFormData, pincode: e.target.value.trim() })}
                      className="w-full p-2 bg-primary/10 border-2 border-primary/40 focus:border-primary rounded-xl text-xs font-mono font-black text-primary outline-none"
                      placeholder="e.g. 500081"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-muted-foreground uppercase">Mandal / Locality / City</label>
                    <input
                      type="text"
                      value={editFormData.mandal}
                      onChange={(e) => setEditFormData({ ...editFormData, mandal: e.target.value })}
                      className="w-full p-2 bg-card border border-border rounded-xl text-xs outline-none focus:border-primary text-foreground"
                      placeholder="e.g. Madhapur"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-muted-foreground uppercase">District</label>
                    <input
                      type="text"
                      value={editFormData.district}
                      onChange={(e) => setEditFormData({ ...editFormData, district: e.target.value })}
                      className="w-full p-2 bg-card border border-border rounded-xl text-xs outline-none focus:border-primary text-foreground"
                      placeholder="e.g. Hyderabad"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-muted-foreground uppercase">State</label>
                    <input
                      type="text"
                      value={editFormData.state}
                      onChange={(e) => setEditFormData({ ...editFormData, state: e.target.value })}
                      className="w-full p-2 bg-card border border-border rounded-xl text-xs outline-none focus:border-primary text-foreground"
                      placeholder="e.g. Telangana"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-muted-foreground uppercase">Village / Sub-area</label>
                    <input
                      type="text"
                      value={editFormData.village}
                      onChange={(e) => setEditFormData({ ...editFormData, village: e.target.value })}
                      className="w-full p-2 bg-card border border-border rounded-xl text-xs outline-none focus:border-primary text-foreground"
                      placeholder="e.g. Hitec City"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-muted-foreground uppercase">Experience / Notes</label>
                    <input
                      type="text"
                      value={editFormData.experience}
                      onChange={(e) => setEditFormData({ ...editFormData, experience: e.target.value })}
                      className="w-full p-2 bg-card border border-border rounded-xl text-xs outline-none focus:border-primary text-foreground"
                      placeholder="Years of experience"
                    />
                  </div>
                </div>

                {selectedDetailItem.dependencies && (
                  <div className="pt-2 border-t border-primary/15 flex flex-wrap items-center gap-2">
                    <span className="text-xs font-bold text-muted-foreground mr-1">Mapped Regional Hierarchy:</span>
                    {selectedDetailItem.dependencies.stateFranchise ? (
                      <span className="bg-primary/10 text-primary font-bold px-2.5 py-1 rounded-lg border border-primary/20 text-xs">
                        🏛️ State: {selectedDetailItem.dependencies.stateFranchise.businessName}
                      </span>
                    ) : <span className="bg-muted text-muted-foreground px-2 py-0.5 rounded text-[10px]">No State Franchise</span>}
                    {selectedDetailItem.dependencies.districtFranchise ? (
                      <span className="bg-primary/10 text-primary font-bold px-2.5 py-1 rounded-lg border border-primary/20 text-xs">
                        🏢 District: {selectedDetailItem.dependencies.districtFranchise.businessName}
                      </span>
                    ) : <span className="bg-muted text-muted-foreground px-2 py-0.5 rounded text-[10px]">No District Franchise</span>}
                    {selectedDetailItem.dependencies.mandalFranchise ? (
                      <span className="bg-primary/10 text-primary font-bold px-2.5 py-1 rounded-lg border border-primary/20 text-xs">
                        🏘️ Mandal: {selectedDetailItem.dependencies.mandalFranchise.businessName}
                      </span>
                    ) : <span className="bg-muted text-muted-foreground px-2 py-0.5 rounded text-[10px]">No Mandal Franchise</span>}
                  </div>
                )}
              </div>

              {/* Section 3: Business Category & Subcategories Governance */}
              {(activeSubTab === "vendors" || selectedDetailItem.isVendor || selectedDetailItem.roleId === "vendor" || selectedDetailItem.applicationType === "vendor" || selectedDetailItem.isDbVendor) && (
                <div className="bg-primary/5 p-5 rounded-2xl border border-primary/20 space-y-4">
                  <div className="flex items-center justify-between border-b border-primary/15 pb-2">
                    <h4 className="font-extrabold text-primary text-sm uppercase tracking-wide flex items-center gap-2">
                      🏷️ 3. Business Category & Subcategories Governance
                    </h4>
                    <span className="text-[10px] font-bold bg-primary/10 text-primary px-2.5 py-0.5 rounded-full">
                      Admin Managed
                    </span>
                  </div>

                  <div className="space-y-4">
                    {/* Primary Category Selector Tabs */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-foreground block">
                        Primary Business Category (Click to select)
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {parentCategories.map((cat: any) => {
                          const isCatSelected = (selectedParentCatId || activeParentCat?._id) === cat._id;
                          return (
                            <button
                              key={cat._id}
                              type="button"
                              onClick={() => setSelectedParentCatId(cat._id)}
                              className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-all border cursor-pointer ${isCatSelected
                                ? "bg-primary text-primary-foreground border-primary shadow-sm ring-2 ring-primary/20"
                                : "bg-card text-muted-foreground border-border hover:border-primary/40 hover:text-foreground"
                                }`}
                            >
                              {cat.name}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Toggle Subcategories Interactive Chip Grid */}
                    <div className="space-y-2 pt-3 border-t border-primary/15">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold text-foreground block">
                          Toggle Approved Subcategories for ({activeParentCat?.name || "Selected Category"}):
                        </label>
                        <span className="text-[10px] text-muted-foreground">Click any chip to toggle ON / OFF</span>
                      </div>

                      {currentSubCategories.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {currentSubCategories.map((subCat: any) => {
                            const isSubSelected = editingSubcategories.includes(subCat.name);
                            return (
                              <button
                                key={subCat._id}
                                type="button"
                                onClick={() => {
                                  if (isSubSelected) {
                                    setEditingSubcategories(prev => prev.filter(s => s !== subCat.name));
                                  } else {
                                    setEditingSubcategories(prev => [...prev, subCat.name]);
                                  }
                                }}
                                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border flex items-center gap-1.5 cursor-pointer ${isSubSelected
                                  ? "bg-emerald-600 text-white border-emerald-600 shadow-sm"
                                  : "bg-card text-foreground border-border/80 hover:border-primary/40 hover:bg-primary/5"
                                  }`}
                              >
                                <span>{isSubSelected ? "✓" : "+"}</span>
                                <span>{subCat.name}</span>
                              </button>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="p-3 bg-card border border-dashed border-primary/20 rounded-xl text-xs text-muted-foreground text-center">
                          No subcategories available in DB for this category. Type below to add custom subcategory.
                        </div>
                      )}

                      {/* Inline Add Custom Subcategory Pill Input */}
                      <div className="pt-2 flex items-center gap-2 max-w-md">
                        <input
                          type="text"
                          value={newSubCategoryName}
                          onChange={(e) => setNewSubCategoryName(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              handleAddSubcategory(newSubCategoryName);
                            }
                          }}
                          placeholder="Type custom subcategory & press enter..."
                          className="flex-1 px-3 py-1.5 bg-card border border-primary/30 rounded-xl text-xs outline-none focus:ring-2 focus:ring-primary/20"
                        />
                        <button
                          type="button"
                          onClick={() => handleAddSubcategory(newSubCategoryName)}
                          disabled={!newSubCategoryName.trim()}
                          className="px-3 py-1.5 bg-primary text-primary-foreground font-bold text-xs rounded-xl shadow disabled:opacity-50 transition-all cursor-pointer"
                        >
                          + Add Custom
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Approved Subcategories Summary Badges */}
                  <div className="space-y-2 pt-2 border-t border-primary/15">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-extrabold text-foreground">
                        Approved Subcategories to Save ({editingSubcategories.length}):
                      </span>
                      {editingSubcategories.length > 0 && (
                        <button
                          type="button"
                          onClick={() => setEditingSubcategories([])}
                          className="text-[10px] text-rose-500 hover:underline font-bold"
                        >
                          Clear All
                        </button>
                      )}
                    </div>

                    {editingSubcategories.length > 0 ? (
                      <div className="flex flex-wrap gap-2 pt-1">
                        {editingSubcategories.map((sub, idx) => (
                          <span
                            key={idx}
                            className="inline-flex items-center gap-1.5 px-3 py-1 bg-card border border-primary/30 text-primary font-bold text-xs rounded-xl shadow-sm"
                          >
                            <span>{sub}</span>
                            <button
                              type="button"
                              onClick={() => handleRemoveSubcategory(idx)}
                              className="text-rose-500 hover:bg-rose-500/10 p-0.5 rounded-md transition-all cursor-pointer"
                              title="Remove subcategory"
                            >
                              <X size={14} />
                            </button>
                          </span>
                        ))}
                      </div>
                    ) : (
                      <div className="p-2.5 bg-card border border-dashed border-primary/30 rounded-xl text-center text-muted-foreground text-xs">
                        No subcategories selected yet. Click any chip above to toggle selection.
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Section 4: Admin Remarks & Decision Reason */}
              <div className="bg-secondary/15 p-4 rounded-xl border border-border/40 space-y-2">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
                  Admin Verification Remarks / Conditions
                </label>
                <textarea
                  rows={2}
                  value={editFormData.adminRemarks}
                  onChange={(e) => setEditFormData({ ...editFormData, adminRemarks: e.target.value })}
                  className="w-full p-2.5 bg-card border border-border rounded-xl text-xs outline-none focus:border-primary text-foreground"
                  placeholder="Optional internal remarks or instructions included in approval notification..."
                />
              </div>

              {/* Section 5: Verification Documents */}
              {selectedDetailItem.documents && (
                <div className="bg-secondary/15 p-4 rounded-xl border border-border/40 space-y-3">
                  <h4 className="font-extrabold text-primary text-xs uppercase tracking-wide flex items-center gap-1.5">
                    <FileText size={14} /> 4. Uploaded Verification Documents
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                    {Object.entries(selectedDetailItem.documents).map(([docKey, docVal]: [string, any]) => {
                      if (!docVal) return null;
                      const docUrl = typeof docVal === 'string' ? docVal : docVal.url;
                      return (
                        <div key={docKey} className="p-2.5 bg-card border border-border/60 rounded-xl flex items-center justify-between">
                          <div>
                            <span className="font-bold text-foreground uppercase text-[11px] block">{docKey.replace(/([A-Z])/g, ' $1')}</span>
                            <span className="text-[10px] text-muted-foreground block font-mono truncate max-w-[200px]">{docUrl}</span>
                          </div>
                          {docUrl && (
                            <a
                              href={docUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="px-3 py-1 bg-primary/10 hover:bg-primary/20 text-primary font-bold text-[11px] rounded-lg border border-primary/20 flex items-center gap-1 transition-all"
                            >
                              <ExternalLink size={12} /> View
                            </a>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-border bg-muted/20 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => setSelectedDetailItem(null)}
                  className="w-full sm:w-auto px-4 py-2 bg-secondary hover:bg-secondary/80 text-foreground font-bold text-xs rounded-xl border border-border/40 transition-all cursor-pointer"
                >
                  Close
                </button>

                <button
                  type="button"
                  onClick={handleSaveDetailsOnly}
                  disabled={actionLoading}
                  className="w-full sm:w-auto px-4 py-2 bg-primary/10 hover:bg-primary/20 text-primary font-bold text-xs rounded-xl border border-primary/30 transition-all cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50"
                  title="Save edited fields without changing application status"
                >
                  <Save size={13} />
                  {actionLoading ? "Saving..." : "Save Edits Only"}
                </button>
              </div>

              {!selectedDetailItem.isDbVendor && (
                <div className="flex gap-2 w-full sm:w-auto">
                  <button
                    onClick={() => handleAction(selectedDetailItem.id, "Rejected")}
                    disabled={actionLoading}
                    className="flex-1 sm:flex-none px-4 py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 font-bold text-xs rounded-xl border border-rose-500/20 transition-all cursor-pointer disabled:opacity-50"
                  >
                    Reject Application
                  </button>

                  <button
                    onClick={() => handleAction(selectedDetailItem.id, "Approved")}
                    disabled={actionLoading}
                    className="flex-1 sm:flex-none px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl shadow-md transition-all cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50"
                  >
                    <Check size={15} />
                    {activeSubTab === "kyc" || selectedDetailItem.status === "under_review" || selectedDetailItem.status === "kyc_submitted"
                      ? "Verify KYC & Approve"
                      : "Save Edits & Pre-Approve"}
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