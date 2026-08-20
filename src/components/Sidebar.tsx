import React, { useState, useMemo } from 'react';
import {
  LayoutDashboard,
  ShieldCheck,
  FolderTree,
  FileCheck2,
  Percent,
  CheckSquare,
  Network,
  Users2,
  ShoppingCart,
  Truck,
  Wallet,
  BarChart3,
  Moon,
  Sun,
  Menu,
  X,
  Sparkles,
  ChevronLeft,
  ChevronDown,
  ChevronRight,
  Search,
  Ticket,
  MapPin,
  Workflow,
  ClipboardCheck,
  Warehouse,
  Landmark,
  MessageSquare,
  LineChart,
  Zap,
  ShieldAlert,
  QrCode,
  Building2,
  Coins,
  Users,
  GraduationCap,
  Wrench,
  Laptop,
  Plane,
  Megaphone,
  BookOpen,
  UserCheck,
  History,
  LifeBuoy,
  Shield,
  Calendar,
  Repeat,
  Navigation,
  Utensils
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export type ActiveTab =
  | 'dashboard'
  | 'kyc'
  | 'categories'
  | 'products'
  | 'commissions'
  | 'payments'
  | 'franchise'
  | 'referrals'
  | 'orders'
  | 'order_subscriptions'
  | 'delivery'
  | 'delivery_boys'
  | 'wallets'
  | 'reports'
  | 'subscriptions'
  | 'coupons'
  | 'territory'
  | 'ecosystem_map'
  | 'approval_center'
  | 'supply_chain'
  | 'commission_control'
  | 'settlement_center'
  | 'communication'
  | 'bi'
  | 'hyperlocal'
  | 'financial_center'
  | 'risk_center'
  | 'qr_network'
  | 'franchise_marketplace'
  | 'user_management'
  | 'vendor_management'
  | 'manufacturer_management'
  | 'wholesaler_management'
  | 'entrepreneur_management'
  | 'course_provider_management'
  | 'service_provider_management'
  | 'pos_software_partners'
  | 'financial_services_partners'
  | 'travel_partner_management'
  | 'advertisement_management'
  | 'training_management'
  | 'staff_management'
  | 'audit_logs'
  | 'support_center'
  | 'academy_leads'
  | 'food_and_dining'
  | 'banner_management'
  | 'security_settings';

interface SidebarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  isDarkMode: boolean;
  setIsDarkMode: (val: boolean) => void;
  isSidebarOpen: boolean;
  setIsSidebarOpen: (val: boolean) => void;
  badgeCounts: {
    kyc: number;
    products: number;
    payments: number;
    withdrawals: number;
  };
}

interface MenuItem {
  id: ActiveTab;
  label: string;
  icon: React.ComponentType<any>;
  badge?: number;
}

interface MenuGroup {
  title: string;
  items: MenuItem[];
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  isDarkMode,
  setIsDarkMode,
  isSidebarOpen,
  setIsSidebarOpen,
  badgeCounts
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});
  const searchInputRef = React.useRef<HTMLInputElement>(null);

  // Global Ctrl+K or / hotkey to focus search
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsSidebarOpen(true);
        setTimeout(() => searchInputRef.current?.focus(), 50);
      }
      if (e.key === 'Escape' && searchQuery) {
        setSearchQuery('');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [searchQuery, setIsSidebarOpen]);

  const toggleGroup = (title: string) => {
    setCollapsedGroups(prev => ({
      ...prev,
      [title]: !prev[title]
    }));
  };

  const menuGroups: MenuGroup[] = [
    {
      title: 'Overview & Intelligence',
      items: [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { id: 'bi', label: 'Business Intelligence', icon: LineChart },
        { id: 'ecosystem_map', label: 'Ecosystem Map', icon: Workflow },
        { id: 'hyperlocal', label: 'Hyperlocal Ops', icon: Zap },
        { id: 'reports', label: 'Reports & Analytics', icon: BarChart3 }
      ]
    },
    {
      title: 'Approval Management',
      items: [
        { id: 'approval_center', label: 'Approval Center', icon: ClipboardCheck },
        { id: 'kyc', label: 'KYC Verification', icon: ShieldCheck, badge: badgeCounts.kyc },
        { id: 'products', label: 'Product & Price Approvals', icon: FileCheck2, badge: badgeCounts.products },
        { id: 'payments', label: 'Verify Payments', icon: CheckSquare, badge: badgeCounts.payments }
      ]
    },
    {
      title: 'Orders & Commerce',
      items: [
        { id: 'orders', label: 'Order Management', icon: ShoppingCart },
        { id: 'order_subscriptions', label: 'Order Subscriptions', icon: Repeat },
        { id: 'categories', label: 'Categories & Variants', icon: FolderTree },
        { id: 'food_and_dining', label: 'Food & Dining', icon: Utensils },
        { id: 'coupons', label: 'Coupons & Promos', icon: Ticket },
        { id: 'banner_management', label: 'Banner Manager', icon: Sparkles }
      ]
    },
    {
      title: 'Finance & Settlements',
      items: [
        { id: 'financial_center', label: 'Master Treasury', icon: Coins },
        { id: 'wallets', label: 'Wallets & Payouts', icon: Wallet, badge: badgeCounts.withdrawals },
        { id: 'settlement_center', label: 'Settlement Center', icon: Landmark },
        { id: 'commissions', label: 'Commission Engine', icon: Percent },
        { id: 'commission_control', label: 'Commission Control', icon: Percent }
      ]
    },
    {
      title: 'Network & Hierarchy',
      items: [
        { id: 'franchise', label: 'Franchise Network', icon: Network },
        { id: 'franchise_marketplace', label: 'Franchise CRM', icon: Building2 },
        { id: 'territory', label: 'Territory Management', icon: MapPin },
        { id: 'referrals', label: 'Referral Tree', icon: Users2 },
        { id: 'qr_network', label: 'QR Network', icon: QrCode },
        { id: 'entrepreneur_management', label: 'Entrepreneur Mgmt', icon: Users2 }
      ]
    },
    {
      title: 'Partners & Supply Chain',
      items: [
        { id: 'vendor_management', label: 'Vendor Management', icon: Users2 },
        { id: 'wholesaler_management', label: 'Wholesaler Management', icon: Warehouse },
        { id: 'manufacturer_management', label: 'Manufacturer Mgmt', icon: Building2 },
        { id: 'service_provider_management', label: 'Service Providers', icon: Wrench },
        { id: 'delivery', label: 'Delivery Dispatch', icon: Truck },
        { id: 'delivery_boys', label: 'Delivery Boys & GPS', icon: Navigation },
        { id: 'supply_chain', label: 'Supply Chain Hub', icon: Warehouse }
      ]
    },
    {
      title: 'Ecosystem & Services',
      items: [
        { id: 'subscriptions', label: 'Universal Subscriptions', icon: Calendar },
        { id: 'academy_leads', label: 'Academy Leads', icon: GraduationCap },
        { id: 'course_provider_management', label: 'Course Providers', icon: GraduationCap },
        { id: 'pos_software_partners', label: 'POS & Software', icon: Laptop },
        { id: 'financial_services_partners', label: 'Financial Partners', icon: Landmark },
        { id: 'travel_partner_management', label: 'Travel Partners', icon: Plane },
        { id: 'advertisement_management', label: 'Ad Management', icon: Megaphone },
        { id: 'training_management', label: 'Training Manager', icon: BookOpen }
      ]
    },
    {
      title: 'Compliance & Administration',
      items: [
        { id: 'user_management', label: 'User Management', icon: Users },
        { id: 'staff_management', label: 'Staff Management', icon: UserCheck },
        { id: 'audit_logs', label: 'Audit Logs', icon: History },
        { id: 'risk_center', label: 'Risk Center', icon: ShieldAlert },
        { id: 'communication', label: 'Communication Center', icon: MessageSquare },
        { id: 'support_center', label: 'Support Center', icon: LifeBuoy },
        { id: 'security_settings', label: 'Security Settings', icon: Shield }
      ]
    }
  ];

  const filteredGroups = useMemo(() => {
    if (!searchQuery.trim()) return menuGroups;
    const query = searchQuery.toLowerCase();

    return menuGroups
      .map(group => ({
        ...group,
        items: group.items.filter(
          item =>
            item.label.toLowerCase().includes(query) ||
            item.id.toLowerCase().includes(query)
        )
      }))
      .filter(group => group.items.length > 0);
  }, [searchQuery, menuGroups]);

  const sidebarVariants = {
    open: { width: '280px', x: 0 },
    closed: { width: '80px', x: 0 },
    mobileOpen: { x: 0 },
    mobileClosed: { x: '-100%' }
  };

  return (
    <>
      {/* Mobile Toggle Button */}
      <div className="md:hidden fixed top-4 left-4 z-50">
        <button
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="p-2 bg-card text-foreground rounded-lg border border-border shadow-md"
        >
          {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Backdrop for mobile */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsSidebarOpen(false)}
            className="md:hidden fixed inset-0 z-40 bg-black backdrop-blur-sm"
          />
        )}
      </AnimatePresence>

      <motion.aside
        initial="closed"
        animate={isSidebarOpen ? 'open' : 'closed'}
        variants={sidebarVariants}
        transition={{ type: 'spring', damping: 20, stiffness: 150 }}
        className={`fixed top-0 bottom-0 left-0 z-40 bg-card border-r border-border flex flex-col justify-between h-screen transition-colors duration-300 md:translate-x-0 ${
          isSidebarOpen ? 'translate-x-0 w-[280px]' : '-translate-x-full md:translate-x-0 md:w-[80px]'
        }`}
      >
        {/* Sidebar Header & Navigation */}
        <div className="flex flex-col h-[calc(100vh-140px)]">
          {/* Logo */}
          <div className="h-16 flex items-center px-5 border-b border-border select-none justify-between shrink-0">
            <div className="flex items-center gap-3 overflow-hidden">
              <div
                onClick={() => !isSidebarOpen && setIsSidebarOpen(true)}
                className={`bg-primary/10 text-primary p-2.5 rounded-xl flex items-center justify-center shrink-0 ${
                  !isSidebarOpen ? 'cursor-pointer hover:bg-primary/20 transition-all active:scale-95' : ''
                }`}
              >
                <Sparkles size={20} className="animate-pulse" />
              </div>
              {isSidebarOpen && (
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex flex-col"
                >
                  <span className="font-extrabold text-base tracking-tight whitespace-nowrap bg-gradient-to-r from-primary via-indigo-500 to-violet-500 bg-clip-text text-transparent">
                    APEX ADMIN
                  </span>
                  <span className="text-[9px] font-semibold text-muted-foreground uppercase tracking-widest">
                    Enterprise Portal
                  </span>
                </motion.div>
              )}
            </div>
            {isSidebarOpen && (
              <button
                onClick={() => setIsSidebarOpen(false)}
                className="hidden md:flex p-1.5 hover:bg-secondary rounded-lg text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                title="Collapse Sidebar"
              >
                <ChevronLeft size={16} />
              </button>
            )}
          </div>

          {/* Quick Module Search */}
          {isSidebarOpen ? (
            <div className="px-3 pt-3 pb-1 shrink-0">
              <div className="relative">
                <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Search modules..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      const firstItem = filteredGroups[0]?.items[0];
                      if (firstItem) {
                        setActiveTab(firstItem.id);
                        if (window.innerWidth < 768) setIsSidebarOpen(false);
                      }
                    }
                  }}
                  className="w-full pl-8 pr-14 py-1.5 bg-secondary/40 border border-border/80 rounded-xl text-[11px] text-foreground placeholder:text-muted-foreground outline-none focus:border-primary focus:bg-card transition-all font-medium"
                />
                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                  {searchQuery ? (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="p-0.5 text-muted-foreground hover:text-foreground"
                    >
                      <X size={12} />
                    </button>
                  ) : (
                    <span className="hidden sm:inline-block text-[9px] font-mono text-muted-foreground/70 bg-secondary px-1.5 py-0.5 rounded border border-border/60">
                      ⌘K
                    </span>
                  )}
                </div>
              </div>
              {searchQuery && (
                <div className="px-1 pt-1.5 flex items-center justify-between text-[10px] text-muted-foreground font-medium">
                  <span>
                    {filteredGroups.reduce((sum, g) => sum + g.items.length, 0)} modules found
                  </span>
                  <span className="text-[9px] opacity-70">Press ↵ Enter to open</span>
                </div>
              )}
            </div>
          ) : (
            <div className="px-3 pt-3 pb-1 flex justify-center shrink-0">
              <button
                onClick={() => {
                  setIsSidebarOpen(true);
                  setTimeout(() => searchInputRef.current?.focus(), 100);
                }}
                className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-secondary/70 transition-all"
                title="Search modules (Ctrl+K)"
              >
                <Search size={18} />
              </button>
            </div>
          )}

          {/* Navigation Links Grouped */}
          <nav className="p-3 space-y-4 overflow-y-auto flex-1 custom-scrollbar">
            {filteredGroups.map(group => {
              const isCollapsed = !searchQuery && !!collapsedGroups[group.title];

              return (
                <div key={group.title} className="space-y-1">
                  {isSidebarOpen && (
                    <div
                      onClick={() => toggleGroup(group.title)}
                      className="flex items-center justify-between px-3 py-1 cursor-pointer select-none group/hdr"
                    >
                      <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/80 group-hover/hdr:text-foreground transition-colors">
                        {group.title}
                      </span>
                      {!searchQuery && (
                        <span className="text-muted-foreground/60 group-hover/hdr:text-foreground transition-colors">
                          {isCollapsed ? <ChevronRight size={12} /> : <ChevronDown size={12} />}
                        </span>
                      )}
                    </div>
                  )}

                  {!isCollapsed && (
                    <div className="space-y-0.5">
                      {group.items.map(item => {
                        const Icon = item.icon;
                        const isActive = activeTab === item.id;

                        return (
                          <button
                            key={item.id}
                            onClick={() => {
                              setActiveTab(item.id as ActiveTab);
                              if (window.innerWidth < 768) {
                                setIsSidebarOpen(false);
                              }
                            }}
                            title={!isSidebarOpen ? item.label : undefined}
                            className={`w-full flex items-center justify-between gap-3 px-3 py-2 rounded-xl transition-all relative text-xs font-medium outline-none select-none group ${
                              isActive
                                ? 'text-primary-foreground bg-primary shadow-md shadow-primary/25 font-semibold'
                                : 'text-muted-foreground hover:text-foreground hover:bg-secondary/70'
                            }`}
                          >
                            <div className="flex items-center gap-2.5 overflow-hidden">
                              <Icon
                                size={18}
                                className={`shrink-0 transition-transform group-hover:scale-110 ${
                                  isActive
                                    ? 'text-primary-foreground'
                                    : 'text-muted-foreground group-hover:text-foreground'
                                }`}
                              />
                              {isSidebarOpen && (
                                <div className="flex flex-col text-left overflow-hidden">
                                  <span className="truncate text-[12px]">
                                    {item.label}
                                  </span>
                                  {searchQuery && (
                                    <span className={`text-[9px] truncate ${isActive ? 'text-primary-foreground/80' : 'text-muted-foreground/70'}`}>
                                      {group.title}
                                    </span>
                                  )}
                                </div>
                              )}
                            </div>

                            {item.badge !== undefined && item.badge > 0 && (
                              <span
                                className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full shrink-0 ${
                                  isActive
                                    ? 'bg-white text-primary'
                                    : 'bg-destructive/15 text-destructive border border-destructive/20'
                                }`}
                              >
                                {item.badge}
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}

            {filteredGroups.length === 0 && (
              <div className="p-6 text-center text-xs text-muted-foreground">
                No modules match &quot;{searchQuery}&quot;
              </div>
            )}
          </nav>
        </div>

        {/* Sidebar Footer (Theme Toggle + Profile Quick Info) */}
        <div className="p-3 border-t border-border bg-card/60 flex flex-col gap-2 shrink-0">
          <button
            onClick={() => setIsDarkMode(!isDarkMode)}
            className="w-full flex items-center justify-between gap-2.5 p-2 rounded-xl hover:bg-secondary/70 text-muted-foreground hover:text-foreground transition-all text-xs font-medium"
          >
            <div className="flex items-center gap-2.5">
              {isDarkMode ? (
                <Sun size={18} className="text-amber-500 shrink-0" />
              ) : (
                <Moon size={18} className="text-violet-500 shrink-0" />
              )}
              {isSidebarOpen && (
                <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-[11px] font-semibold">
                  {isDarkMode ? 'Light Mode' : 'Dark Mode'}
                </motion.span>
              )}
            </div>
            {isSidebarOpen && (
              <span className="text-[9px] bg-secondary/80 px-2 py-0.5 rounded font-mono text-muted-foreground border border-border">
                {isDarkMode ? 'Light' : 'Dark'}
              </span>
            )}
          </button>

          {isSidebarOpen && (
            <div className="flex items-center gap-2.5 p-2 bg-secondary/40 border border-border/60 rounded-xl overflow-hidden">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-primary to-indigo-600 flex items-center justify-center text-primary-foreground font-bold text-xs shrink-0 shadow-sm">
                AB
              </div>
              <div className="overflow-hidden">
                <p className="font-bold text-xs text-foreground truncate">Apexbee Admin</p>
                <p className="text-[9px] text-muted-foreground truncate">Platform Super Administrator</p>
              </div>
            </div>
          )}
        </div>
      </motion.aside>
    </>
  );
};
