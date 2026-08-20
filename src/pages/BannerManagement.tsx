import React, { useState, useEffect, useMemo } from 'react';
import {
  Sparkles,
  Plus,
  Search,
  Filter,
  Eye,
  MousePointerClick,
  Layers,
  Image as ImageIcon,
  CheckCircle2,
  XCircle,
  Edit2,
  Trash2,
  ExternalLink,
  ArrowUpDown,
  Smartphone,
  Monitor,
  Flame,
  Clock,
  Tag,
  Percent,
  Check,
  AlertCircle,
  RefreshCw,
  LayoutTemplate,
  Sliders,
  ChevronRight,
  Maximize2,
  Upload,
  CloudUpload,
  FileImage
} from 'lucide-react';

const API_BASE = 'https://server.apexbee.in/api';

type PlacementType =
  | 'all'
  | 'home_hero'
  | 'food_hero'
  | 'services_hero'
  | 'stores_hero'
  | 'time_of_day'
  | 'home_strip'
  | 'category_hero'
  | 'popup_modal';

interface BannerItem {
  _id: string;
  title: string;
  subtitle?: string;
  description?: string;
  imageUrl: string;
  mobileImageUrl?: string;
  placement: string;
  size: 'big' | 'medium' | 'small' | 'strip' | 'popup';
  targetCategory?: string;
  timeOfDaySlot?: string;
  type?: string;
  tag?: string;
  discount?: string;
  couponCode?: string;
  buttonText?: string;
  link: string;
  order: number;
  isActive: boolean;
  startDate?: string;
  endDate?: string;
  countdownHours?: number;
  targetDevice?: 'all' | 'mobile' | 'desktop';
  clicks?: number;
  impressions?: number;
  bgGradient?: string;
  createdAt: string;
}

const PLACEMENT_OPTIONS = [
  { id: 'all', label: 'All Banners', icon: Layers, desc: 'Every banner across all slots' },
  { id: 'home_hero', label: 'Home Hero (Big)', icon: LayoutTemplate, desc: '1200x500px • Top carousel on customer homepage' },
  { id: 'food_hero', label: 'Food & Dining Hero', icon: Sparkles, desc: '1200x500px • Top hero slider in food & dining' },
  { id: 'services_hero', label: 'Services Hero', icon: Sparkles, desc: '1200x500px • Top hero slider in home services' },
  { id: 'stores_hero', label: 'Local Stores Hero', icon: Sparkles, desc: '1200x500px • Top hero slider in local shops' },
  { id: 'time_of_day', label: 'Time of Day (Cards)', icon: Clock, desc: '600x400px • Morning, Lunch, Evening & Night deals' },
  { id: 'home_strip', label: 'Mid-Page Strip (Slim)', icon: Sliders, desc: '1200x180px • Full width promotional banner strips' },
  { id: 'category_hero', label: 'Category Header', icon: Tag, desc: '1200x400px • Department specific header banners' },
  { id: 'popup_modal', label: 'App Popup Modal', icon: Maximize2, desc: '800x800px • Welcome / Flash sale entry dialog' }
];

const PRESET_GRADIENTS = [
  { label: 'Emerald / Green', value: 'from-emerald-700 via-teal-800 to-slate-950', preview: 'bg-gradient-to-r from-emerald-600 to-teal-800' },
  { label: 'Sunset / Orange', value: 'from-amber-600 via-orange-700 to-stone-950', preview: 'bg-gradient-to-r from-amber-600 to-orange-700' },
  { label: 'Ruby / Red', value: 'from-rose-700 via-red-800 to-slate-950', preview: 'bg-gradient-to-r from-rose-600 to-red-800' },
  { label: 'Royal Blue / Indigo', value: 'from-blue-700 via-indigo-800 to-slate-950', preview: 'bg-gradient-to-r from-blue-600 to-indigo-800' },
  { label: 'Violet / Purple', value: 'from-purple-800 via-indigo-900 to-slate-950', preview: 'bg-gradient-to-r from-purple-700 to-indigo-900' },
  { label: 'Deep Amber / Gold', value: 'from-amber-700 via-yellow-800 to-orange-950', preview: 'bg-gradient-to-r from-amber-600 to-yellow-800' }
];

const PRESET_ROUTES = [
  { label: 'Homepage', value: '/' },
  { label: 'Food & Dining', value: '/food-dining' },
  { label: 'Home Services', value: '/services' },
  { label: 'Local Stores', value: '/local-stores' },
  { label: 'Supermarket & Groceries', value: '/grocery' },
  { label: 'Dairy Department', value: '/category/Dairy' },
  { label: '0% Platform Fee / Earn', value: '/earn-with-apexbee' },
  { label: 'Referrals Program', value: '/referrals' }
];

export const BannerManagement: React.FC = () => {
  const [banners, setBanners] = useState<BannerItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedPlacement, setSelectedPlacement] = useState<PlacementType>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [previewDevice, setPreviewDevice] = useState<'desktop' | 'mobile'>('desktop');
  const [previewBanner, setPreviewBanner] = useState<BannerItem | null>(null);

  // Modal State
  const [showModal, setShowModal] = useState<boolean>(false);
  const [selectedBanner, setSelectedBanner] = useState<BannerItem | null>(null);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [uploading, setUploading] = useState<boolean>(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [toastMsg, setToastMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Form State
  const [form, setForm] = useState<{
    title: string;
    subtitle: string;
    description: string;
    imageUrl: string;
    mobileImageUrl: string;
    placement: string;
    size: 'big' | 'medium' | 'small' | 'strip' | 'popup';
    targetCategory: string;
    timeOfDaySlot: string;
    tag: string;
    discount: string;
    couponCode: string;
    buttonText: string;
    link: string;
    order: number;
    isActive: boolean;
    targetDevice: 'all' | 'mobile' | 'desktop';
    bgGradient: string;
  }>({
    title: '',
    subtitle: '',
    description: '',
    imageUrl: '',
    mobileImageUrl: '',
    placement: 'home_hero',
    size: 'big',
    targetCategory: 'all',
    timeOfDaySlot: 'all',
    tag: 'LIMITED TIME',
    discount: '',
    couponCode: '',
    buttonText: 'Explore Now',
    link: '/',
    order: 1,
    isActive: true,
    targetDevice: 'all',
    bgGradient: 'from-amber-600 via-orange-700 to-stone-950'
  });

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMsg({ text, type });
    setTimeout(() => setToastMsg(null), 4000);
  };

  const fetchBanners = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('adminToken');
      const res = await fetch(`${API_BASE}/banners/admin`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      const data = await res.json();
      if (data.success) {
        setBanners(data.data || []);
        if (data.data && data.data.length > 0 && !previewBanner) {
          setPreviewBanner(data.data[0]);
        }
      } else {
        showToast(data.message || 'Failed to fetch banners', 'error');
      }
    } catch (err: any) {
      console.error('Error fetching admin banners:', err);
      showToast(err.message || 'Network error fetching banners', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBanners();
  }, []);

  // Filtered list
  const filteredBanners = useMemo(() => {
    return banners.filter((b) => {
      // Placement match
      if (selectedPlacement !== 'all' && b.placement !== selectedPlacement) {
        return false;
      }
      // Status match
      if (statusFilter === 'active' && !b.isActive) return false;
      if (statusFilter === 'inactive' && b.isActive) return false;

      // Search match
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const titleMatch = (b.title || '').toLowerCase().includes(q);
        const subMatch = (b.subtitle || '').toLowerCase().includes(q);
        const tagMatch = (b.tag || '').toLowerCase().includes(q);
        const catMatch = (b.targetCategory || '').toLowerCase().includes(q);
        const linkMatch = (b.link || '').toLowerCase().includes(q);
        if (!titleMatch && !subMatch && !tagMatch && !catMatch && !linkMatch) return false;
      }

      return true;
    });
  }, [banners, selectedPlacement, statusFilter, searchQuery]);

  // Total summary metrics
  const metrics = useMemo(() => {
    const total = banners.length;
    const active = banners.filter((b) => b.isActive).length;
    const clicks = banners.reduce((acc, curr) => acc + (curr.clicks || 0), 0);
    const impressions = banners.reduce((acc, curr) => acc + (curr.impressions || 0), 0);
    const ctr = impressions > 0 ? ((clicks / impressions) * 100).toFixed(1) : '0.0';
    return { total, active, clicks, impressions, ctr };
  }, [banners]);

  // Open Create/Edit modal
  const openModal = (banner?: BannerItem) => {
    if (banner) {
      setSelectedBanner(banner);
      setForm({
        title: banner.title || '',
        subtitle: banner.subtitle || '',
        description: banner.description || '',
        imageUrl: banner.imageUrl || '',
        mobileImageUrl: banner.mobileImageUrl || '',
        placement: banner.placement || 'home_hero',
        size: banner.size || 'big',
        targetCategory: banner.targetCategory || 'all',
        timeOfDaySlot: banner.timeOfDaySlot || 'all',
        tag: banner.tag || '',
        discount: banner.discount || '',
        couponCode: banner.couponCode || '',
        buttonText: banner.buttonText || 'Explore Now',
        link: banner.link || '/',
        order: banner.order || 1,
        isActive: banner.isActive !== false,
        targetDevice: banner.targetDevice || 'all',
        bgGradient: banner.bgGradient || 'from-amber-600 via-orange-700 to-stone-950'
      });
    } else {
      setSelectedBanner(null);
      // Sensible default based on current selected tab
      const defaultPlacement = selectedPlacement === 'all' ? 'home_hero' : selectedPlacement;
      const defaultSize: any =
        defaultPlacement === 'time_of_day'
          ? 'medium'
          : defaultPlacement === 'home_strip'
            ? 'strip'
            : defaultPlacement === 'popup_modal'
              ? 'popup'
              : 'big';

      setForm({
        title: '',
        subtitle: '',
        description: '',
        imageUrl: 'https://images.unsplash.com/photo-1542838132-92c53300491e?q=80&w=1200',
        mobileImageUrl: '',
        placement: defaultPlacement,
        size: defaultSize,
        targetCategory: 'all',
        timeOfDaySlot: 'all',
        tag: 'SPECIAL OFFER',
        discount: '30% OFF',
        couponCode: 'APEX30',
        buttonText: 'Shop Now',
        link: '/',
        order: banners.length + 1,
        isActive: true,
        targetDevice: 'all',
        bgGradient: 'from-emerald-700 via-teal-800 to-slate-950'
      });
    }
    setShowModal(true);
  };

  const handleImageFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      showToast('Image file size must be less than 10MB', 'error');
      return;
    }

    try {
      setUploading(true);
      const token = localStorage.getItem('adminToken');
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch(`${API_BASE}/banners/admin/upload`, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData
      });

      const data = await res.json();
      if (data.success && data.url) {
        setForm((prev) => ({ ...prev, imageUrl: data.url }));
        showToast('Image uploaded and linked successfully!');
      } else {
        showToast(data.message || 'Failed to upload image', 'error');
      }
    } catch (err: any) {
      console.error('Image upload error:', err);
      showToast(err.message || 'Network error during image upload', 'error');
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.imageUrl.trim()) {
      showToast('Please provide a banner title and image URL', 'error');
      return;
    }

    try {
      setSubmitting(true);
      const token = localStorage.getItem('adminToken');
      const url = selectedBanner
        ? `${API_BASE}/banners/admin/${selectedBanner._id}`
        : `${API_BASE}/banners/admin`;
      const method = selectedBanner ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify(form)
      });
      const data = await res.json();
      if (data.success) {
        showToast(
          selectedBanner ? 'Banner updated successfully!' : 'New banner published successfully!'
        );
        setShowModal(false);
        fetchBanners();
      } else {
        showToast(data.message || 'Failed to save banner', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'Network error saving banner', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (banner: BannerItem) => {
    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch(`${API_BASE}/banners/admin/${banner._id}/toggle`, {
        method: 'PATCH',
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      const data = await res.json();
      if (data.success) {
        showToast(`Banner is now ${!banner.isActive ? 'Active' : 'Inactive'}`);
        setBanners((prev) =>
          prev.map((b) => (b._id === banner._id ? { ...b, isActive: !b.isActive } : b))
        );
        if (previewBanner?._id === banner._id) {
          setPreviewBanner({ ...previewBanner, isActive: !previewBanner.isActive });
        }
      } else {
        showToast(data.message || 'Failed to toggle status', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'Network error toggling banner', 'error');
    }
  };

  const handleDeleteBanner = async (id: string) => {
    if (!window.confirm('Are you sure you want to permanently delete this banner?')) return;
    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch(`${API_BASE}/banners/admin/${id}`, {
        method: 'DELETE',
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      const data = await res.json();
      if (data.success) {
        showToast('Banner deleted successfully!');
        setBanners((prev) => prev.filter((b) => b._id !== id));
        if (previewBanner?._id === id) {
          setPreviewBanner(null);
        }
      } else {
        showToast(data.message || 'Failed to delete banner', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'Network error deleting banner', 'error');
    }
  };

  const handleOrderChange = async (banner: BannerItem, newOrder: number) => {
    if (newOrder < 1) return;
    try {
      const token = localStorage.getItem('adminToken');
      await fetch(`${API_BASE}/banners/admin/${banner._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ order: newOrder })
      });
      setBanners((prev) =>
        prev
          .map((b) => (b._id === banner._id ? { ...b, order: newOrder } : b))
          .sort((a, b) => a.order - b.order)
      );
    } catch (e) {
      console.error('Error updating banner order:', e);
    }
  };

  return (
    <div className="space-y-6 pb-12 animate-fadeIn">
      {/* Toast Alert */}
      {toastMsg && (
        <div
          className={`fixed top-5 right-5 z-50 px-5 py-3 rounded-xl shadow-2xl flex items-center gap-3 border text-sm font-semibold transition-all duration-300 ${toastMsg.type === 'success'
            ? 'bg-emerald-950/90 text-emerald-300 border-emerald-500/30'
            : 'bg-rose-950/90 text-rose-300 border-rose-500/30'
            }`}
        >
          {toastMsg.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          ) : (
            <AlertCircle className="w-5 h-5 text-rose-400" />
          )}
          <span>{toastMsg.text}</span>
        </div>
      )}

      {/* Header & Hero Action */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-br from-card/80 via-card to-background p-6 rounded-2xl border border-border shadow-sm">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 bg-amber-500/10 text-amber-500 rounded-xl border border-amber-500/20">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground tracking-tight">
                Universal Dynamic Banner Management
              </h1>
              <p className="text-xs md:text-sm text-muted-foreground">
                Centrally control and schedule every promotional banner, hero slider, and strip
                across customer & partner apps.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchBanners}
            disabled={loading}
            className="px-3.5 py-2.5 text-xs font-semibold rounded-xl bg-card hover:bg-muted border border-border text-foreground transition flex items-center gap-2 cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>

          <button
            onClick={() => openModal()}
            className="px-4 py-2.5 text-xs md:text-sm font-bold rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white shadow-lg shadow-amber-500/20 transition flex items-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Create New Banner</span>
          </button>
        </div>
      </div>

      {/* Analytics KPI Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
        <div className="bg-card/70 backdrop-blur p-4 rounded-xl border border-border">
          <div className="flex items-center justify-between text-muted-foreground text-xs font-medium">
            <span>Total Placed</span>
            <Layers className="w-4 h-4 text-blue-400" />
          </div>
          <p className="text-2xl font-black text-foreground mt-1.5">{metrics.total}</p>
          <span className="text-[10px] text-muted-foreground">All slot types</span>
        </div>

        <div className="bg-card/70 backdrop-blur p-4 rounded-xl border border-border">
          <div className="flex items-center justify-between text-muted-foreground text-xs font-medium">
            <span>Active Live</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-2xl font-black text-emerald-400 mt-1.5">{metrics.active}</p>
          <span className="text-[10px] text-muted-foreground">Rendering in apps</span>
        </div>

        <div className="bg-card/70 backdrop-blur p-4 rounded-xl border border-border">
          <div className="flex items-center justify-between text-muted-foreground text-xs font-medium">
            <span>Impressions</span>
            <Eye className="w-4 h-4 text-amber-400" />
          </div>
          <p className="text-2xl font-black text-foreground mt-1.5">
            {metrics.impressions.toLocaleString()}
          </p>
          <span className="text-[10px] text-muted-foreground">Total customer views</span>
        </div>

        <div className="bg-card/70 backdrop-blur p-4 rounded-xl border border-border">
          <div className="flex items-center justify-between text-muted-foreground text-xs font-medium">
            <span>Interactions</span>
            <MousePointerClick className="w-4 h-4 text-purple-400" />
          </div>
          <p className="text-2xl font-black text-foreground mt-1.5">
            {metrics.clicks.toLocaleString()}
          </p>
          <span className="text-[10px] text-muted-foreground">Banner CTA taps</span>
        </div>

        <div className="bg-card/70 backdrop-blur p-4 rounded-xl border border-border col-span-2 sm:col-span-1">
          <div className="flex items-center justify-between text-muted-foreground text-xs font-medium">
            <span>Avg CTR</span>
            <Percent className="w-4 h-4 text-rose-400" />
          </div>
          <p className="text-2xl font-black text-rose-400 mt-1.5">{metrics.ctr}%</p>
          <span className="text-[10px] text-muted-foreground">Click-through efficiency</span>
        </div>
      </div>

      {/* Placement Filter Pills */}
      <div className="bg-card/70 backdrop-blur p-3 rounded-2xl border border-border">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {PLACEMENT_OPTIONS.map((slot) => {
            const Icon = slot.icon;
            const isSelected = selectedPlacement === slot.id;
            const count =
              slot.id === 'all'
                ? banners.length
                : banners.filter((b) => b.placement === slot.id).length;

            return (
              <button
                key={slot.id}
                onClick={() => setSelectedPlacement(slot.id as PlacementType)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition flex items-center gap-2 cursor-pointer shrink-0 ${isSelected
                  ? 'bg-amber-500 text-stone-950 shadow-md shadow-amber-500/20'
                  : 'bg-muted/40 text-muted-foreground hover:bg-muted hover:text-foreground'
                  }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{slot.label}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded-full font-extrabold ${isSelected ? 'bg-stone-950/20 text-stone-950' : 'bg-card text-muted-foreground'
                    }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Layout Split: Left List vs Right Live Simulator Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Banner List Controls & Cards (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          {/* Search & Filter Toolbar */}
          <div className="flex flex-col sm:flex-row gap-3 bg-card p-3 rounded-xl border border-border">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search title, tag, link, category..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-background border border-border rounded-lg pl-9 pr-3 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="flex items-center gap-2">
              <select
                value={statusFilter}
                onChange={(e: any) => setStatusFilter(e.target.value)}
                className="bg-background border border-border rounded-lg px-3 py-1.5 text-xs text-foreground focus:outline-none focus:border-amber-500 cursor-pointer"
              >
                <option value="all">All Status</option>
                <option value="active">Active Only</option>
                <option value="inactive">Inactive Only</option>
              </select>
            </div>
          </div>

          {/* Banner Cards List */}
          {loading ? (
            <div className="p-12 text-center text-muted-foreground bg-card rounded-2xl border border-border flex flex-col items-center gap-3">
              <RefreshCw className="w-8 h-8 animate-spin text-amber-500" />
              <span className="text-sm font-medium">Loading banners from database...</span>
            </div>
          ) : filteredBanners.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground bg-card rounded-2xl border border-border flex flex-col items-center gap-3">
              <ImageIcon className="w-12 h-12 text-muted-foreground/40" />
              <p className="text-base font-bold text-foreground">No Banners Found</p>
              <p className="text-xs max-w-sm">
                No banner entries match the selected placement or search query. Click 'Create New
                Banner' to add one.
              </p>
              <button
                onClick={() => openModal()}
                className="mt-2 px-4 py-2 text-xs font-bold rounded-lg bg-amber-500 text-stone-950 hover:bg-amber-400 transition cursor-pointer"
              >
                Create Banner in this Slot
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredBanners.map((banner) => {
                const isSelectedForPreview = previewBanner?._id === banner._id;

                return (
                  <div
                    key={banner._id}
                    onClick={() => setPreviewBanner(banner)}
                    className={`bg-card rounded-xl p-4 border transition-all cursor-pointer relative group ${isSelectedForPreview
                      ? 'border-amber-500 shadow-md shadow-amber-500/10 ring-1 ring-amber-500'
                      : 'border-border hover:border-amber-500/50'
                      }`}
                  >
                    <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                      {/* Image Thumbnail & Details */}
                      <div className="flex items-center gap-3.5 flex-1 min-w-0">
                        <div className="relative w-24 h-16 sm:w-28 sm:h-18 rounded-lg overflow-hidden shrink-0 border border-border bg-stone-900">
                          <img
                            src={banner.imageUrl}
                            alt={banner.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                            onError={(e: any) => {
                              e.target.src =
                                'https://images.unsplash.com/photo-1542838132-92c53300491e?q=80&w=400';
                            }}
                          />
                          <div className="absolute top-1 left-1 px-1.5 py-0.5 rounded bg-black/70 backdrop-blur text-[9px] font-black text-amber-300 uppercase">
                            {banner.placement.replace('_', ' ')}
                          </div>
                        </div>

                        <div className="min-w-0 flex-1 space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="text-sm font-bold text-foreground truncate">
                              {banner.title}
                            </h3>
                            {banner.tag && (
                              <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/30">
                                {banner.tag}
                              </span>
                            )}
                            {banner.discount && (
                              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-400">
                                {banner.discount}
                              </span>
                            )}
                          </div>

                          {banner.subtitle && (
                            <p className="text-xs text-muted-foreground truncate">
                              {banner.subtitle}
                            </p>
                          )}

                          <div className="flex items-center gap-3 text-[11px] text-muted-foreground pt-0.5 flex-wrap">
                            <span className="flex items-center gap-1 font-mono">
                              <ExternalLink className="w-3 h-3 text-muted-foreground" />
                              {banner.link || '/'}
                            </span>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                              <Eye className="w-3 h-3 text-amber-400" />
                              {banner.impressions || 0} views
                            </span>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                              <MousePointerClick className="w-3 h-3 text-purple-400" />
                              {banner.clicks || 0} clicks
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Controls: Order, Active Toggle, Actions */}
                      <div
                        className="flex items-center gap-2 self-end sm:self-center shrink-0"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {/* Order Sequence Adjuster */}
                        <div className="flex items-center gap-1 bg-background border border-border px-2 py-1 rounded-lg">
                          <span className="text-[10px] text-muted-foreground font-bold">Seq:</span>
                          <input
                            type="number"
                            min="1"
                            max="99"
                            value={banner.order || 1}
                            onChange={(e) => handleOrderChange(banner, parseInt(e.target.value) || 1)}
                            className="w-8 text-center text-xs font-bold bg-transparent text-foreground focus:outline-none"
                          />
                        </div>

                        {/* Active Toggle */}
                        <button
                          onClick={() => handleToggleStatus(banner)}
                          title={banner.isActive ? 'Active (Click to disable)' : 'Inactive (Click to enable)'}
                          className={`p-2 rounded-lg border transition cursor-pointer ${banner.isActive
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20'
                            : 'bg-rose-500/10 text-rose-400 border-rose-500/30 hover:bg-rose-500/20'
                            }`}
                        >
                          {banner.isActive ? (
                            <CheckCircle2 className="w-4 h-4" />
                          ) : (
                            <XCircle className="w-4 h-4" />
                          )}
                        </button>

                        {/* Edit Button */}
                        <button
                          onClick={() => openModal(banner)}
                          title="Edit Banner"
                          className="p-2 rounded-lg bg-card hover:bg-muted text-muted-foreground hover:text-foreground border border-border transition cursor-pointer"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>

                        {/* Delete Button */}
                        <button
                          onClick={() => handleDeleteBanner(banner._id)}
                          title="Delete Banner"
                          className="p-2 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 transition cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Column: Live Visual Simulator Preview (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-card p-5 rounded-2xl border border-border shadow-sm sticky top-6 space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <LayoutTemplate className="w-4 h-4 text-amber-500" />
                <h3 className="text-sm font-bold text-foreground">Live App Simulator</h3>
              </div>

              {/* Viewport switch: Desktop vs Mobile */}
              <div className="flex items-center gap-1 bg-background p-1 rounded-lg border border-border">
                <button
                  onClick={() => setPreviewDevice('desktop')}
                  className={`p-1.5 rounded text-xs transition cursor-pointer ${previewDevice === 'desktop'
                    ? 'bg-muted text-foreground font-bold'
                    : 'text-muted-foreground hover:text-foreground'
                    }`}
                  title="Desktop View"
                >
                  <Monitor className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setPreviewDevice('mobile')}
                  className={`p-1.5 rounded text-xs transition cursor-pointer ${previewDevice === 'mobile'
                    ? 'bg-muted text-foreground font-bold'
                    : 'text-muted-foreground hover:text-foreground'
                    }`}
                  title="Mobile App View"
                >
                  <Smartphone className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {previewBanner ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Previewing:</span>
                  <span className="font-bold text-amber-400">{previewBanner.title}</span>
                </div>

                {/* Simulated Rendering Container */}
                <div
                  className={`mx-auto transition-all duration-300 rounded-2xl overflow-hidden border border-border shadow-2xl relative ${previewDevice === 'mobile' ? 'max-w-[320px]' : 'w-full'
                    }`}
                >
                  {/* Hero / Big Banner Preview */}
                  {previewBanner.size === 'big' || previewBanner.placement.includes('hero') ? (
                    <div className="relative aspect-[21/9] sm:aspect-[2.4/1] w-full overflow-hidden group">
                      <img
                        src={previewBanner.imageUrl}
                        alt={previewBanner.title}
                        className="w-full h-full object-cover"
                      />
                      <div
                        className={`absolute inset-0 bg-gradient-to-r ${previewBanner.bgGradient || 'from-stone-950 via-stone-900/80 to-transparent'
                          } opacity-90 mix-blend-multiply`}
                      />

                      <div className="absolute inset-0 p-4 sm:p-6 flex flex-col justify-between text-white">
                        <div className="flex items-center gap-2">
                          {previewBanner.tag && (
                            <span className="px-2.5 py-0.5 rounded-full bg-amber-400 text-stone-950 text-[10px] font-black uppercase tracking-wider">
                              {previewBanner.tag}
                            </span>
                          )}
                          {previewBanner.discount && (
                            <span className="px-2 py-0.5 rounded bg-white/20 backdrop-blur text-[10px] font-extrabold text-amber-200">
                              {previewBanner.discount}
                            </span>
                          )}
                        </div>

                        <div>
                          <h4 className="text-sm sm:text-base font-black leading-tight drop-shadow">
                            {previewBanner.title}
                          </h4>
                          {previewBanner.subtitle && (
                            <p className="text-[11px] text-white/80 line-clamp-2 mt-1 drop-shadow">
                              {previewBanner.subtitle}
                            </p>
                          )}

                          <div className="mt-3 flex items-center gap-2">
                            <button className="px-3 py-1.5 rounded-lg bg-amber-400 text-stone-950 text-[11px] font-black hover:bg-amber-300 transition shadow">
                              {previewBanner.buttonText || 'Explore Now'}
                            </button>
                            {previewBanner.couponCode && (
                              <span className="text-[10px] font-mono font-bold text-amber-300 bg-black/40 px-2 py-1 rounded border border-amber-400/30">
                                CODE: {previewBanner.couponCode}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : previewBanner.size === 'strip' || previewBanner.placement === 'home_strip' ? (
                    // Strip Banner Preview
                    <div className="relative p-4 bg-gradient-to-r from-amber-600 via-orange-600 to-rose-700 text-white flex items-center justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-[9px] font-black bg-black/30 px-1.5 py-0.5 rounded">
                            {previewBanner.tag || 'PROMO STRIP'}
                          </span>
                          <h4 className="text-xs sm:text-sm font-black">{previewBanner.title}</h4>
                        </div>
                        {previewBanner.subtitle && (
                          <p className="text-[10px] text-white/80 mt-0.5">{previewBanner.subtitle}</p>
                        )}
                      </div>
                      <button className="px-3 py-1 bg-white text-stone-950 rounded-md text-[10px] font-extrabold shrink-0 shadow">
                        {previewBanner.buttonText || 'Claim'}
                      </button>
                    </div>
                  ) : (
                    // Medium Card / Time of day preview
                    <div className="relative aspect-[4/3] w-full overflow-hidden rounded-xl">
                      <img
                        src={previewBanner.imageUrl}
                        alt={previewBanner.title}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
                      <div className="absolute bottom-3 left-3 right-3 text-white">
                        <span className="text-[9px] font-black bg-amber-400 text-stone-950 px-2 py-0.5 rounded-full">
                          {previewBanner.tag || 'DEAL'}
                        </span>
                        <h4 className="text-xs font-bold mt-1">{previewBanner.title}</h4>
                        <p className="text-[10px] text-white/70 truncate">{previewBanner.subtitle}</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Banner Metadata Info */}
                <div className="bg-background p-3.5 rounded-xl border border-border space-y-2 text-xs">
                  <div className="flex justify-between py-1 border-b border-border/60">
                    <span className="text-muted-foreground">Slot Placement</span>
                    <span className="font-bold text-foreground capitalize">
                      {previewBanner.placement.replace('_', ' ')}
                    </span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-border/60">
                    <span className="text-muted-foreground">Target Route</span>
                    <span className="font-mono font-bold text-amber-400">{previewBanner.link}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-border/60">
                    <span className="text-muted-foreground">Target Audience</span>
                    <span className="font-bold text-foreground uppercase">
                      {previewBanner.targetDevice || 'all'}
                    </span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-muted-foreground">Display Status</span>
                    <span
                      className={`font-bold ${previewBanner.isActive ? 'text-emerald-400' : 'text-rose-400'
                        }`}
                    >
                      {previewBanner.isActive ? '● Active Live' : '○ Inactive Disabled'}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-8 text-center text-muted-foreground text-xs">
                Select a banner from the list to preview live simulation.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Create / Edit Full Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-card w-full max-w-2xl rounded-2xl border border-border shadow-2xl overflow-hidden my-8 animate-scaleIn">
            <div className="flex items-center justify-between p-5 border-b border-border bg-muted/20">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-amber-500/10 text-amber-500 rounded-lg">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-foreground">
                    {selectedBanner ? 'Edit Platform Banner' : 'Create & Publish New Banner'}
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Configure placement slot, visual assets, action deep links and tags.
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowModal(false)}
                className="p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition cursor-pointer"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              {/* Row 1: Placement Slot & Size */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-foreground block mb-1.5">
                    Placement Slot <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={form.placement}
                    onChange={(e) => {
                      const val = e.target.value;
                      let newSize: any = 'big';
                      if (val === 'time_of_day') newSize = 'medium';
                      if (val === 'home_strip') newSize = 'strip';
                      if (val === 'popup_modal') newSize = 'popup';
                      setForm({ ...form, placement: val, size: newSize });
                    }}
                    className="w-full bg-background border border-border rounded-xl px-3.5 py-2.5 text-xs text-foreground focus:outline-none focus:border-amber-500 cursor-pointer"
                  >
                    {PLACEMENT_OPTIONS.filter((p) => p.id !== 'all').map((opt) => (
                      <option key={opt.id} value={opt.id}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-foreground block mb-1.5">
                    Target Category / Department
                  </label>
                  <select
                    value={form.targetCategory}
                    onChange={(e) => setForm({ ...form, targetCategory: e.target.value })}
                    className="w-full bg-background border border-border rounded-xl px-3.5 py-2.5 text-xs text-foreground focus:outline-none focus:border-amber-500 cursor-pointer"
                  >
                    <option value="all">All Ecosystem (General)</option>
                    <option value="Food & Dining">Food & Dining</option>
                    <option value="Services">Home & Pro Services</option>
                    <option value="Local Stores">Local Neighborhood Stores</option>
                    <option value="Groceries">Supermarket & Groceries</option>
                    <option value="Dairy">Dairy & Morning Essentials</option>
                    <option value="Devotional">Devotional & Pooja Store</option>
                    <option value="Academy">ApexBee Academy & Courses</option>
                  </select>
                </div>
              </div>

              {/* Row 2: Title & Subtitle */}
              <div>
                <label className="text-xs font-bold text-foreground block mb-1.5">
                  Banner Headline Title <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Mega Supermarket & Grocery Flash Sale"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  required
                  className="w-full bg-background border border-border rounded-xl px-3.5 py-2.5 text-xs text-foreground focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-foreground block mb-1.5">
                  Subtitle / Promo Description
                </label>
                <input
                  type="text"
                  placeholder="e.g. Fresh organic veggies, farm dairy, and household essentials in 15 mins"
                  value={form.subtitle}
                  onChange={(e) => setForm({ ...form, subtitle: e.target.value })}
                  className="w-full bg-background border border-border rounded-xl px-3.5 py-2.5 text-xs text-foreground focus:outline-none focus:border-amber-500"
                />
              </div>

              {/* Row 3: Banner Image (Upload File or Enter URL) */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-foreground flex items-center justify-between">
                  <span>Banner Image <span className="text-rose-500">*</span></span>
                  <span className="text-[11px] font-normal text-muted-foreground">PNG, JPG, WEBP (Max 10MB)</span>
                </label>

                {/* Upload Action Zone */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* File Upload Box */}
                  <div
                    onClick={() => !uploading && fileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-xl p-4 flex flex-col items-center justify-center text-center transition cursor-pointer group ${uploading
                      ? 'border-amber-500/50 bg-amber-500/5 cursor-wait'
                      : 'border-border hover:border-amber-500/70 hover:bg-amber-500/5'
                      }`}
                  >
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleImageFileUpload}
                      accept="image/*"
                      className="hidden"
                    />
                    {uploading ? (
                      <div className="flex flex-col items-center gap-2 py-2">
                        <RefreshCw className="w-6 h-6 text-amber-500 animate-spin" />
                        <span className="text-xs font-bold text-amber-500">Uploading image to server...</span>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-1.5 py-1">
                        <div className="p-2.5 rounded-full bg-amber-500/10 text-amber-500 group-hover:scale-110 transition">
                          <CloudUpload className="w-5 h-5" />
                        </div>
                        <span className="text-xs font-bold text-foreground">Upload from Computer</span>
                        <span className="text-[10px] text-muted-foreground">Click to browse local files</span>
                      </div>
                    )}
                  </div>

                  {/* Image Live Preview / Status */}
                  <div className="border border-border bg-background rounded-xl p-2.5 flex items-center gap-3 overflow-hidden relative group">
                    {form.imageUrl ? (
                      <>
                        <img
                          src={form.imageUrl}
                          alt="Banner Preview"
                          className="w-20 h-16 object-cover rounded-lg border border-border shrink-0 bg-slate-950"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src =
                              'https://images.unsplash.com/photo-1542838132-92c53300491e?q=80&w=400';
                          }}
                        />
                        <div className="flex-1 min-w-0 pr-6">
                          <div className="flex items-center gap-1 text-emerald-400 text-[11px] font-bold">
                            <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                            <span>Image Attached</span>
                          </div>
                          <p className="text-[10px] text-muted-foreground truncate font-mono mt-0.5" title={form.imageUrl}>
                            {form.imageUrl}
                          </p>
                          <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="text-[10px] text-amber-500 hover:text-amber-400 font-bold mt-1 cursor-pointer"
                          >
                            Replace File
                          </button>
                        </div>
                        <button
                          type="button"
                          onClick={() => setForm({ ...form, imageUrl: '' })}
                          title="Clear Image"
                          className="absolute top-2 right-2 p-1 rounded-md text-muted-foreground hover:text-rose-400 hover:bg-rose-500/10 transition cursor-pointer"
                        >
                          <XCircle className="w-4 h-4" />
                        </button>
                      </>
                    ) : (
                      <div className="flex items-center justify-center w-full h-full text-center text-muted-foreground p-3">
                        <div className="flex flex-col items-center gap-1">
                          <ImageIcon className="w-5 h-5 text-muted-foreground/50" />
                          <span className="text-[11px]">No image selected yet</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Direct Image URL input fallback */}
                <div className="pt-1">
                  <div className="flex items-center gap-2">
                    <input
                      type="url"
                      placeholder="Or paste external image URL (e.g. https://images.unsplash.com/...)"
                      value={form.imageUrl}
                      onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
                      required
                      className="w-full bg-background border border-border rounded-xl px-3.5 py-2 text-xs text-foreground font-mono focus:outline-none focus:border-amber-500"
                    />
                  </div>
                  <span className="text-[10px] text-muted-foreground mt-1 block">
                    Recommended dimensions: 1200×500px for Heros, 600×400px for Cards, 1200×180px for Strips.
                  </span>
                </div>
              </div>

              {/* Row 4: Tag Badge, Discount, Coupon Code */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-bold text-foreground block mb-1.5">Badge Tag</label>
                  <input
                    type="text"
                    placeholder="e.g. LIMITED TIME"
                    value={form.tag}
                    onChange={(e) => setForm({ ...form, tag: e.target.value })}
                    className="w-full bg-background border border-border rounded-xl px-3.5 py-2.5 text-xs text-foreground focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-foreground block mb-1.5">
                    Discount Highlight
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. FLAT 40% OFF"
                    value={form.discount}
                    onChange={(e) => setForm({ ...form, discount: e.target.value })}
                    className="w-full bg-background border border-border rounded-xl px-3.5 py-2.5 text-xs text-foreground focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-foreground block mb-1.5">
                    Coupon Code
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. SUPER40"
                    value={form.couponCode}
                    onChange={(e) => setForm({ ...form, couponCode: e.target.value })}
                    className="w-full bg-background border border-border rounded-xl px-3.5 py-2.5 text-xs text-foreground font-mono focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              {/* Row 5: Action Link & Button Text */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-foreground block mb-1.5">
                    Destination Deep Link / URL
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. /grocery or /food-dining"
                    value={form.link}
                    onChange={(e) => setForm({ ...form, link: e.target.value })}
                    className="w-full bg-background border border-border rounded-xl px-3.5 py-2.5 text-xs text-foreground font-mono focus:outline-none focus:border-amber-500"
                  />
                  {/* Quick Preset Link Selector */}
                  <div className="flex items-center gap-1.5 flex-wrap mt-1.5">
                    {PRESET_ROUTES.map((rt) => (
                      <button
                        key={rt.value}
                        type="button"
                        onClick={() => setForm({ ...form, link: rt.value })}
                        className="text-[10px] px-2 py-0.5 rounded bg-muted/60 hover:bg-muted text-muted-foreground hover:text-foreground transition cursor-pointer"
                      >
                        {rt.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-foreground block mb-1.5">
                    Action Button Label
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Shop Now"
                    value={form.buttonText}
                    onChange={(e) => setForm({ ...form, buttonText: e.target.value })}
                    className="w-full bg-background border border-border rounded-xl px-3.5 py-2.5 text-xs text-foreground focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              {/* Row 6: Gradient Theme & Priority Order */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-foreground block mb-1.5">
                    Overlay Gradient Theme
                  </label>
                  <select
                    value={form.bgGradient}
                    onChange={(e) => setForm({ ...form, bgGradient: e.target.value })}
                    className="w-full bg-background border border-border rounded-xl px-3.5 py-2.5 text-xs text-foreground focus:outline-none focus:border-amber-500 cursor-pointer"
                  >
                    {PRESET_GRADIENTS.map((g) => (
                      <option key={g.value} value={g.value}>
                        {g.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-foreground block mb-1.5">
                    Carousel Display Order (Sequence #)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="99"
                    value={form.order}
                    onChange={(e) => setForm({ ...form, order: parseInt(e.target.value) || 1 })}
                    className="w-full bg-background border border-border rounded-xl px-3.5 py-2.5 text-xs text-foreground focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              {/* Row 7: Active Toggle */}
              <div className="flex items-center justify-between p-3.5 bg-background rounded-xl border border-border">
                <div>
                  <span className="text-xs font-bold text-foreground block">Active & Publishing</span>
                  <span className="text-[11px] text-muted-foreground">
                    When active, this banner will immediately render in client apps.
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                  className="w-5 h-5 accent-amber-500 rounded cursor-pointer"
                />
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2.5 text-xs font-bold rounded-xl bg-card hover:bg-muted text-muted-foreground hover:text-foreground border border-border transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2.5 text-xs md:text-sm font-bold rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white shadow-lg shadow-amber-500/20 transition flex items-center gap-2 cursor-pointer"
                >
                  {submitting ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Check className="w-4 h-4" />
                  )}
                  <span>{selectedBanner ? 'Save Changes' : 'Publish Banner'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
