import React from 'react';
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
  Calendar
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
  | 'delivery'
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
  // New modules
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

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  isDarkMode,
  setIsDarkMode,
  isSidebarOpen,
  setIsSidebarOpen,
  badgeCounts
}) => {
  interface MenuItem {
    id: ActiveTab;
    label: string;
    icon: React.ComponentType<any>;
    badge?: number;
  }

  const menuItems: MenuItem[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'kyc', label: 'KYC Verification', icon: ShieldCheck, badge: badgeCounts.kyc },
    { id: 'categories', label: 'Categories & Variants', icon: FolderTree },
    { id: 'products', label: 'Product Approvals', icon: FileCheck2, badge: badgeCounts.products },
    { id: 'commissions', label: 'Commission Engine', icon: Percent },
    { id: 'payments', label: 'Verify Payments', icon: CheckSquare, badge: badgeCounts.payments },
    { id: 'coupons', label: 'Coupons & Promos', icon: Ticket },
    { id: 'franchise', label: 'Franchise Network', icon: Network },
    { id: 'referrals', label: 'Referral Tree', icon: Users2 },
    { id: 'orders', label: 'Order Management', icon: ShoppingCart },
    { id: 'delivery', label: 'Delivery Dispatch', icon: Truck },
    { id: 'wallets', label: 'Wallets & Payouts', icon: Wallet, badge: badgeCounts.withdrawals },
    { id: 'reports', label: 'Reports & Analytics', icon: BarChart3 },
    { id: 'subscriptions', label: 'Local Shop Subscriptions', icon: Calendar },
    // ApexBee Ecosystem Modules
    { id: 'territory', label: 'Territory Management', icon: MapPin },
    { id: 'ecosystem_map', label: 'Ecosystem Map', icon: Workflow },
    { id: 'approval_center', label: 'Approval Center', icon: ClipboardCheck },
    { id: 'supply_chain', label: 'Supply Chain Hub', icon: Warehouse },
    { id: 'commission_control', label: 'Commission Control', icon: Percent },
    { id: 'settlement_center', label: 'Settlement Center', icon: Landmark },
    { id: 'communication', label: 'Communication Center', icon: MessageSquare },
    { id: 'bi', label: 'Business Intelligence', icon: LineChart },
    { id: 'hyperlocal', label: 'Hyperlocal Ops', icon: Zap },
    { id: 'financial_center', label: 'Financial Center', icon: Coins },
    { id: 'risk_center', label: 'Risk Center', icon: ShieldAlert },
    { id: 'qr_network', label: 'QR Network', icon: QrCode },
    { id: 'franchise_marketplace', label: 'Franchise CRM', icon: Building2 },
    // New modules
    { id: 'user_management', label: 'User Management', icon: Users },
    { id: 'vendor_management', label: 'Vendor Management', icon: Users2 },
    { id: 'manufacturer_management', label: 'Manufacturer Management', icon: Building2 },
    { id: 'wholesaler_management', label: 'Wholesaler Management', icon: Warehouse },
    { id: 'entrepreneur_management', label: 'Entrepreneur Management', icon: Users2 },
    { id: 'course_provider_management', label: 'Course Providers', icon: GraduationCap },
    { id: 'service_provider_management', label: 'Service Providers', icon: Wrench },
    { id: 'pos_software_partners', label: 'POS & Software', icon: Laptop },
    { id: 'financial_services_partners', label: 'Financial Partners', icon: Landmark },
    { id: 'travel_partner_management', label: 'Travel Partners', icon: Plane },
    { id: 'advertisement_management', label: 'Ad Management', icon: Megaphone },
    { id: 'training_management', label: 'Training Manager', icon: BookOpen },
    { id: 'staff_management', label: 'Staff Management', icon: UserCheck },
    { id: 'audit_logs', label: 'Audit Logs', icon: History },
    { id: 'support_center', label: 'Support Center', icon: LifeBuoy },
    { id: 'security_settings', label: 'Security Settings', icon: Shield }
  ];

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
        {/* Sidebar Header / Logo */}
        <div>
          <div className="h-16 flex items-center px-6 border-b border-border select-none justify-between">
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
                <motion.span
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="font-bold text-lg tracking-tight whitespace-nowrap bg-gradient-to-r from-primary to-violet-500 bg-clip-text text-transparent"
                >
                  APEX ADMIN
                </motion.span>
              )}
            </div>
            {isSidebarOpen && (
              <button
                onClick={() => setIsSidebarOpen(false)}
                className="hidden md:flex p-1.5 hover:bg-secondary rounded-lg text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
              >
                <ChevronLeft size={16} />
              </button>
            )}
          </div>

          {/* Navigation Links */}
          <nav className="p-3 space-y-1.5 overflow-y-auto max-h-[calc(100vh-140px)] no-scrollbar">
            {menuItems.map(item => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id as ActiveTab);
                    if (window.innerWidth < 768) {
                      setIsSidebarOpen(false); // Close on mobile
                    }
                  }}
                  className={`w-full flex items-center justify-between gap-3 px-4 py-3 rounded-xl transition-all relative text-sm font-medium outline-none select-none group ${
                    isActive
                      ? 'text-primary-foreground bg-primary shadow-lg shadow-primary/20'
                      : 'text-muted-foreground hover:text-foreground hover:bg-secondary/60'
                  }`}
                >
                  <div className="flex items-center gap-3 overflow-hidden">
                    <Icon
                      size={20}
                      className={`shrink-0 transition-transform group-hover:scale-105 ${
                        isActive ? 'text-primary-foreground' : 'text-muted-foreground group-hover:text-foreground'
                      }`}
                    />
                    {isSidebarOpen && (
                      <motion.span
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="truncate"
                      >
                        {item.label}
                      </motion.span>
                    )}
                  </div>

                  {item.badge !== undefined && item.badge > 0 && (
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
                        isActive
                          ? 'bg-white text-primary'
                          : 'bg-destructive/10 text-destructive dark:bg-destructive/20'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Footer (Theme Toggle + Profile Quick Info) */}
        <div className="p-4 border-t border-border bg-card/50 flex flex-col gap-3">
          <button
            onClick={() => setIsDarkMode(!isDarkMode)}
            className="w-full flex items-center justify-between gap-3 p-3 rounded-xl hover:bg-secondary/60 text-muted-foreground hover:text-foreground transition-all text-sm font-medium"
          >
            <div className="flex items-center gap-3">
              {isDarkMode ? (
                <Sun size={20} className="text-amber-500 shrink-0" />
              ) : (
                <Moon size={20} className="text-violet-500 shrink-0" />
              )}
              {isSidebarOpen && (
                <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  {isDarkMode ? 'Light Mode' : 'Dark Mode'}
                </motion.span>
              )}
            </div>
            {isSidebarOpen && (
              <span className="text-[10px] bg-secondary px-2 py-1 rounded text-muted-foreground border border-border">
                {isDarkMode ? 'Light' : 'Dark'}
              </span>
            )}
          </button>

          {isSidebarOpen && (
            <div className="flex items-center gap-3 p-2 bg-secondary/30 border border-border/50 rounded-xl overflow-hidden">
              <img
                src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=100"
                alt="Super Admin"
                className="w-10 h-10 rounded-lg object-cover shrink-0 ring-1 ring-border"
              />
              <div className="overflow-hidden">
                <p className="font-semibold text-xs text-foreground truncate">Ananya Sharma</p>
                <p className="text-[10px] text-muted-foreground truncate">Super Admin</p>
              </div>
            </div>
          )}
        </div>
      </motion.aside>
    </>
  );
};
