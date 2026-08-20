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
  Wallet,
  ArrowRight,
  Zap,
  RefreshCw
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
  const [dbProducts, setDbProducts] = useState<any[]>([]);
  const [dbWallets, setDbWallets] = useState<any[]>([]);
  const [dbCategories, setDbCategories] = useState<any[]>([]);
  const [selectedParentCatId, setSelectedParentCatId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [selectedDetailItem, setSelectedDetailItem] = useState<any | null>(null);
  const [editingSubcategories, setEditingSubcategories] = useState<string[]>([]);
  const [newSubCategoryName, setNewSubCategoryName] = useState<string>("");

  const openDetailModal = (item: any) => {
    setSelectedDetailItem(item);
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

      // Phase 1: Fast initial load for primary tabs
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

      // Unblock UI immediately for instant rendering
      setLoading(false);

      // Phase 2: Asynchronously load heavy secondary tab data in background
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
      franchiseLevel: app.franchiseLevel,
      investmentCapacity: app.investmentCapacity,
      serviceType: app.serviceType,
      sampleVideoLink: app.sampleVideoLink,
      vehicleType: app.vehicleType,
      licenseNumber: app.licenseNumber,
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

    if (tab === "products") {
      const pendingProds = dbProducts.filter((p: any) => p.status !== "Live" && p.status !== "Rejected");

      const uniqueProdsMap = new Map();
      pendingProds.forEach((p: any) => {
        const isFood = p.isFoodItem || p.itemType === 'FOOD' || p.productMode === 'FOOD' || Boolean(p.foodMenuItemId) || Boolean(p.restaurantId);
        const key = p.foodMenuItemId ? `food_${p.foodMenuItemId}` : `prod_${p._id || p.id || p.sku}`;

        // Avoid adding duplicate by checking key or name
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
    if (slug.includes('shopping') || slug.includes('fashion') || slug.includes('home') || slug.includes('agri')) {
      return [
        { id: 'mens_fashion_store', label: "Men's Fashion Store" },
        { id: 'womens_fashion_store', label: "Women's Fashion Store" },
        { id: 'kids_wear_store', label: 'Kids Wear Store' },
        { id: 'boutique', label: 'Boutique' },
        { id: 'tailor_custom_stitching', label: 'Tailor & Custom Stitching' },
        { id: 'footwear_store', label: 'Footwear Store' },
        { id: 'furniture_store', label: 'Furniture Store' },
        { id: 'home_decor_store', label: 'Home Decor Store' },
        { id: 'kitchenware_store', label: 'Kitchenware Store' },
        { id: 'seed_dealer', label: 'Seed Dealer' },
        { id: 'fertilizer_dealer', label: 'Fertilizer Dealer' },
        { id: 'plant_nursery', label: 'Plant Nursery' },
      ];
    }
    if (slug.includes('service') || slug.includes('repair') || slug.includes('clean') || slug.includes('salon') || slug.includes('laundry')) {
      return [
        { id: 'ac_technician', label: 'AC Technician' },
        { id: 'refrigerator_technician', label: 'Refrigerator Technician' },
        { id: 'washing_machine_technician', label: 'Washing Machine Technician' },
        { id: 'ro_purifier_technician', label: 'RO Water Purifier Technician' },
        { id: 'electrician', label: 'Electrician' },
        { id: 'multi_appliance_technician', label: 'Multi-Appliance Service Center' },
        { id: 'deep_cleaning_specialist', label: 'Deep Cleaning Specialist' },
        { id: 'sofa_carpet_cleaner', label: 'Sofa & Carpet Cleaning Specialist' },
        { id: 'cleaning_agency', label: 'Cleaning Agency / Housekeeping' },
        { id: 'mens_salon', label: "Men's Salon" },
        { id: 'womens_salon', label: "Women's Salon & Beauty Parlour" },
        { id: 'spa_center', label: 'Spa & Wellness Center' },
        { id: 'bridal_studio', label: 'Bridal & Makeup Studio' },
        { id: 'laundry_shop', label: 'Laundry Shop' },
        { id: 'dry_cleaning_center', label: 'Dry Cleaning Center' },
        { id: 'corporate_laundry_provider', label: 'Corporate & Institutional Laundry' },
      ];
    }
    return [
      { id: 'retail_store', label: 'Retail Store' },
      { id: 'wholesaler', label: 'Wholesaler' },
      { id: 'service_provider', label: 'Service Provider' },
    ];
  };

  const activeCategoryCapabilities = getCapabilitiesForCategory(activeParentCat);

  const _handleUpdateDocStatus = async (
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

          fetchEcosystemData();

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

  const _handleRequestDoc = async (vendorId: string, docName: string) => {
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

  void _handleUpdateDocStatus;
  void _handleRequestDoc;

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

      const assignedCatName = activeParentCat?.name || currentApp?.primaryCategory || currentApp?.category || "Food & Restaurant";
      const assignedParentId = activeParentCat?._id;

      const checkedCaps = Array.from(document.querySelectorAll('.cat-cap-cb:checked')).map(el => (el as HTMLInputElement).value);
      const checkedSubCatIds = Array.from(document.querySelectorAll('.cat-subcat-cb:checked')).map(el => (el as HTMLInputElement).value);

      const res = await fetch(endpoint, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          primaryCategory: assignedCatName,
          category: assignedCatName,
          subCategory: editingSubcategories[0] || "",
          approvedSubcategories: editingSubcategories,
          requestedCapabilities: checkedCaps,
          adminRemarks:
            activeSubTab === "kyc" || currentApp?.status === "under_review" || currentApp?.status === "kyc_submitted"
              ? "KYC verified and approved by admin."
              : `Pre-approved by admin under category ${assignedCatName}.`,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        alert(errorData?.message || `Failed to set status to ${action}`);
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
            Centralized moderation hub across Vendors, Wholesalers, Franchises, Products, KYC verifications, and Wallet Payouts.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => fetchEcosystemData()}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-secondary/80 hover:bg-secondary text-xs font-semibold text-foreground border border-border cursor-pointer transition-all"
            title="Refresh list"
          >
            <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
            <span>Refresh Queue</span>
          </button>
        </div>
      </div>

      {/* UPPER 30%: Overview KPI Cards Deck */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: 🌐 Omni-Queue Total */}
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

        {/* Card 2: 🏬 Partner & Merchant Onboarding */}
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

        {/* Card 3: 🛒 Products & Daily Price Edits */}
        <div
          onClick={() => setActiveSubTab("products")}
          className={`p-4 rounded-2xl border transition-all cursor-pointer select-none group ${activeSubTab === "products"
            ? "bg-amber-500/10 border-amber-500 shadow-md shadow-amber-500/15"
            : "bg-card border-border hover:border-amber-500/50 hover:bg-amber-500/[0.03]"
            }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-600 dark:text-amber-400">
              Products & Daily Prices
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
              Store catalogues & vegetable price edits
            </p>
          </div>
          <div className="mt-3 pt-2.5 border-t border-border/60 flex items-center justify-between text-[10px] font-bold">
            <span className="text-amber-600">Catalogue Health</span>
            <span className="text-muted-foreground group-hover:text-foreground transition-colors flex items-center gap-1">
              Review Items <ArrowRight size={10} />
            </span>
          </div>
        </div>

        {/* Card 4: 🛡️ KYC & Payouts */}
        <div
          onClick={() => setActiveSubTab("kyc")}
          className={`p-4 rounded-2xl border transition-all cursor-pointer select-none group ${["kyc", "withdrawals"].includes(activeSubTab)
            ? "bg-emerald-500/10 border-emerald-500 shadow-md shadow-emerald-500/15"
            : "bg-card border-border hover:border-emerald-500/50 hover:bg-emerald-500/[0.03]"
            }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
              KYC & Withdrawals
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
                currentItems.map((item: any) => (
                  <div
                    key={item.id}
                    className="bg-secondary/15 p-4 rounded-xl border border-border/40 flex flex-col md:flex-row justify-between items-start md:items-center gap-3 transition-all"
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
                        <p>ID: {item.id} • Registered: {item.date}</p>

                        {(activeSubTab === "vendors" || item.isVendor || item.roleId === "vendor" || item.applicationType === "vendor") && (item.primaryCategory || item.category) && (
                          <div className="flex flex-wrap items-center gap-1 mt-1 font-sans text-xs">
                            <span className="font-bold text-foreground">Category:</span>
                            <span className="bg-primary/10 text-primary font-extrabold px-2 py-0.5 rounded-md text-[10px]">
                              {item.primaryCategory || item.category}
                            </span>
                            {item.approvedSubcategories && item.approvedSubcategories.length > 0 && (
                              <>
                                <span className="font-bold text-foreground ml-1">Subcategories ({item.approvedSubcategories.length}):</span>
                                {item.approvedSubcategories.map((sub: string, idx: number) => (
                                  <span key={idx} className="bg-emerald-500/10 text-emerald-600 font-bold px-2 py-0.5 rounded-md text-[10px] border border-emerald-500/20">
                                    {sub}
                                  </span>
                                ))}
                              </>
                            )}
                          </div>
                        )}

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
                        onClick={() => openDetailModal(item)}
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
                  className={`px-2 py-0.5 rounded text-[8px] font-bold shrink-0 ${item.status === "Approved"
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
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-card border border-border max-w-5xl w-full max-h-[90vh] rounded-2xl overflow-hidden shadow-2xl flex flex-col text-xs text-foreground">

            {/* Modal Header */}
            <div className="flex items-center justify-between p-5 border-b border-border bg-muted/30">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-primary/10 rounded-xl text-primary font-bold">
                  <Eye size={22} />
                </div>
                <div className="text-left">
                  <h3 className="text-base font-black text-foreground uppercase tracking-wide">
                    Application Audit & Governance Portal
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    {selectedDetailItem.name} • {selectedDetailItem.type || selectedDetailItem.roleId || "Opportunity Partner"}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
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

            {/* Modal Body */}
            <div className="p-6 space-y-5 overflow-y-auto flex-1 text-left">

              {/* Top Grid (2 Columns) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                {/* Card 1: Applicant Profile */}
                <div className="bg-secondary/15 p-4 rounded-xl border border-border/40 space-y-3">
                  <h4 className="font-extrabold text-primary text-xs uppercase tracking-wide flex items-center gap-1.5">
                    👤 Applicant Profile & Role
                  </h4>
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <span className="text-muted-foreground block text-[11px]">Full Name</span>
                      <span className="font-bold text-foreground block mt-0.5">{selectedDetailItem.contact || selectedDetailItem.name}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block text-[11px]">Opportunity Role</span>
                      <span className="font-extrabold text-primary block mt-0.5">{selectedDetailItem.type || selectedDetailItem.roleId || "N/A"}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block text-[11px]">Email Address</span>
                      <span className="font-semibold text-foreground block mt-0.5">{selectedDetailItem.email || "N/A"}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block text-[11px]">Mobile Number</span>
                      <span className="font-semibold text-foreground block mt-0.5">{selectedDetailItem.mobile || "N/A"}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block text-[11px]">Applied Date</span>
                      <span className="font-semibold text-foreground block mt-0.5">{selectedDetailItem.date || "N/A"}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block text-[11px]">Relevant Experience</span>
                      <span className="font-semibold text-foreground block mt-0.5">{selectedDetailItem.experience || "N/A"}</span>
                    </div>
                  </div>
                </div>

                {/* Card 2: Business Identification */}
                <div className="bg-secondary/15 p-4 rounded-xl border border-border/40 space-y-3">
                  <h4 className="font-extrabold text-primary text-xs uppercase tracking-wide flex items-center gap-1.5">
                    💼 Business Identification & Details
                  </h4>
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <span className="text-muted-foreground block text-[11px]">Business Name</span>
                      <span className="font-bold text-foreground block mt-0.5">{selectedDetailItem.name || "N/A"}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block text-[11px]">GST Number</span>
                      <span className="font-mono font-bold text-foreground block mt-0.5">{selectedDetailItem.gstNumber || "Optional / None"}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block text-[11px]">PAN Number</span>
                      <span className="font-mono font-bold text-foreground block mt-0.5">{selectedDetailItem.panNumber || "N/A"}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block text-[11px]">Aadhaar Number</span>
                      <span className="font-mono font-bold text-foreground block mt-0.5">{selectedDetailItem.aadhaarNumber || "N/A"}</span>
                    </div>
                    {selectedDetailItem.investmentCapacity && (
                      <div>
                        <span className="text-muted-foreground block text-[11px]">Investment Capacity</span>
                        <span className="font-semibold text-foreground block mt-0.5">{selectedDetailItem.investmentCapacity} Lakhs</span>
                      </div>
                    )}
                    {selectedDetailItem.franchiseLevel && (
                      <div>
                        <span className="text-muted-foreground block text-[11px]">Franchise Tier</span>
                        <span className="font-semibold text-foreground block mt-0.5 capitalize">{selectedDetailItem.franchiseLevel} Level</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Territory Location & Network Mapping */}
              <div className="bg-secondary/15 p-4 rounded-xl border border-border/40 space-y-3">
                <h4 className="font-extrabold text-primary text-xs uppercase tracking-wide flex items-center gap-1.5">
                  🗺️ Territory Location & Regional Franchise Mapping
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                  <div>
                    <span className="text-muted-foreground block text-[11px]">State</span>
                    <span className="font-bold text-foreground block mt-0.5">{selectedDetailItem.state || "N/A"}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-[11px]">District</span>
                    <span className="font-bold text-foreground block mt-0.5">{selectedDetailItem.district || "N/A"}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-[11px]">Mandal / City</span>
                    <span className="font-bold text-foreground block mt-0.5">{selectedDetailItem.mandal || "N/A"}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-[11px]">Pincode</span>
                    <span className="font-bold text-foreground block mt-0.5">{selectedDetailItem.pincode || "N/A"}</span>
                  </div>
                  <div className="col-span-2 md:col-span-4">
                    <span className="text-muted-foreground block text-[11px]">Full Street Address</span>
                    <span className="font-semibold text-foreground block mt-0.5">{selectedDetailItem.address || "N/A"}</span>
                  </div>
                </div>

                {selectedDetailItem.dependencies && (
                  <div className="pt-2 border-t border-border/40 flex flex-wrap items-center gap-2">
                    <span className="text-xs font-bold text-muted-foreground mr-1">Mapped Territory Network:</span>
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
              {/* Business Category & Subcategories Governance - Shown ONLY for Vendor Role */}
              {(activeSubTab === "vendors" || selectedDetailItem.isVendor || selectedDetailItem.roleId === "vendor" || selectedDetailItem.applicationType === "vendor" || selectedDetailItem.isDbVendor) && (
                <div className="bg-primary/5 p-5 rounded-2xl border border-primary/20 space-y-4">
                  <div className="flex items-center justify-between border-b border-primary/15 pb-2">
                    <h4 className="font-extrabold text-primary text-sm uppercase tracking-wide flex items-center gap-2">
                      🏷️ Business Category & Subcategories Governance
                    </h4>
                    <span className="text-[10px] font-bold bg-primary/10 text-primary px-2.5 py-0.5 rounded-full">
                      Admin Managed
                    </span>
                  </div>

                  {/* Display Subcategories requested by Applicant */}
                  {selectedDetailItem.approvedSubcategories && selectedDetailItem.approvedSubcategories.length > 0 && (
                    <div className="p-3 bg-card border border-emerald-500/30 rounded-xl space-y-1.5 shadow-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-extrabold text-emerald-600 uppercase tracking-wide flex items-center gap-1.5">
                          <span>📋</span> Subcategories Selected by Applicant ({selectedDetailItem.approvedSubcategories.length}):
                        </span>
                        <span className="text-[10px] text-muted-foreground font-semibold">User Selection</span>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {selectedDetailItem.approvedSubcategories.map((sub: string, idx: number) => (
                          <span key={idx} className="px-2.5 py-1 bg-emerald-500/10 text-emerald-600 font-extrabold text-xs rounded-lg border border-emerald-500/20">
                            ✓ {sub}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

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
                        Selected Subcategories to Save ({editingSubcategories.length}):
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

              {/* Section 5: Verification Documents */}
              {selectedDetailItem.documents && (
                <div className="bg-secondary/15 p-4 rounded-xl border border-border/40 space-y-3">
                  <h4 className="font-extrabold text-primary text-xs uppercase tracking-wide">
                    📁 Verification Documents & Audit Links
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
            <div className="p-4 border-t border-border bg-muted/20 flex items-center justify-between gap-3">
              <button
                onClick={() => setSelectedDetailItem(null)}
                className="px-5 py-2.5 bg-secondary hover:bg-secondary/80 text-foreground font-bold text-xs rounded-xl border border-border/40 transition-all cursor-pointer"
              >
                Cancel / Close
              </button>

              {!selectedDetailItem.isDbVendor && (
                <div className="flex gap-2">
                  <button
                    onClick={() => handleAction(selectedDetailItem.id, "Rejected")}
                    className="px-5 py-2.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 font-bold text-xs rounded-xl border border-rose-500/20 transition-all cursor-pointer"
                  >
                    Reject Application
                  </button>

                  <button
                    onClick={() => handleAction(selectedDetailItem.id, "Approved")}
                    className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl shadow-md transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    <Check size={16} />
                    {activeSubTab === "kyc" || selectedDetailItem.status === "under_review" || selectedDetailItem.status === "kyc_submitted"
                      ? "Verify KYC & Approve"
                      : "Pre-Approve & Save Subcategories"}
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