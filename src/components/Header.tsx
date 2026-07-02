import React, { useState } from 'react';
import { Search, Bell, ChevronDown, Clock, LogOut, Settings, User, Menu } from 'lucide-react';
import { ActiveTab } from './Sidebar';
import { useAdminState } from '../context/AdminStateContext';

interface HeaderProps {
  activeTab: ActiveTab;
  badgeCounts: {
    kyc: number;
    products: number;
    payments: number;
    withdrawals: number;
  };
  isSidebarOpen: boolean;
  setIsSidebarOpen: (val: boolean) => void;
  onSearchChange?: (val: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  badgeCounts,
  isSidebarOpen,
  setIsSidebarOpen,
  onSearchChange
}) => {
  const { setIsAuthenticated } = useAdminState();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);

  const formatTabName = (tab: ActiveTab) => {
    switch (tab) {
      case 'dashboard': return 'Dashboard Overview';
      case 'kyc': return 'Seller KYC Verification';
      case 'categories': return 'Category & Variant Settings';
      case 'products': return 'Product Review Queue';
      case 'commissions': return 'Commission Payout Engine';
      case 'payments': return 'Customer Payout Verification';
      case 'franchise': return 'Franchise Network Graph';
      case 'referrals': return 'Referral Commissions Tree';
      case 'orders': return 'Orders Master Control';
      case 'delivery': return 'Delivery Agent Assignments';
      case 'wallets': return 'Wallets & Payout Management';
      case 'reports': return 'Financial Reports & Metrics';
      case 'coupons': return 'Platform Coupons & Promos';
      case 'territory': return 'Territory Management Control';
      case 'ecosystem_map': return 'Ecosystem Map Visualization';
      case 'approval_center': return 'Ecosystem Approvals Center';
      case 'supply_chain': return 'Procurement & Supply Chain Hub';
      case 'commission_control': return 'Commission Control Center';
      case 'settlement_center': return 'Settlement Control Hub';
      case 'communication': return 'Communication & Campaigns Console';
      case 'bi': return 'Ecosystem Business Intelligence';
      case 'hyperlocal': return 'Hyperlocal Operations Dashboard';
      case 'financial_center': return 'Platform Financial Center';
      case 'risk_center': return 'Ecosystem Risk & Fraud Center';
      case 'qr_network': return 'QR Merchant Network Dashboard';
      case 'franchise_marketplace': return 'Franchise Recruitment CRM';
      case 'user_management': return 'User Directory & Network Analytics';
      case 'vendor_management': return 'Vendor Registry & Performance Hub';
      case 'wholesaler_management': return 'Wholesale Partners & Procurement';
      case 'entrepreneur_management': return 'Entrepreneur Network & Training';
      case 'course_provider_management': return 'Digital Academy & Course Providers';
      case 'service_provider_management': return 'Local Service Providers Hub';
      case 'pos_software_partners': return 'POS & Software Partner Network';
      case 'financial_services_partners': return 'Financial Services Partner Deck';
      case 'travel_partner_management': return 'Travel & Hospitality Partners';
      case 'advertisement_management': return 'Ad Placement & Campaigns Dashboard';
      case 'training_management': return 'L&D Training Program Center';
      case 'staff_management': return 'Internal Staff & Role Assignments';
      case 'audit_logs': return 'Security & Operations Audit Ledger';
      case 'support_center': return 'Customer & Partner Support Hub';
      case 'security_settings': return 'Platform Security & Fraud Protection';
      default: return 'Admin Console';
    }
  };

  const notificationAlerts = [
    { id: 'not-1', type: 'kyc', title: 'KYC Verification Needed', desc: `${badgeCounts.kyc} sellers are waiting for document review`, active: badgeCounts.kyc > 0 },
    { id: 'not-2', type: 'product', title: 'Product Listing Approval', desc: `${badgeCounts.products} items submitted for review`, active: badgeCounts.products > 0 },
    { id: 'not-3', type: 'payment', title: 'UPI Manual Payout Verification', desc: `${badgeCounts.payments} payments need screenshot audits`, active: badgeCounts.payments > 0 },
    { id: 'not-4', type: 'withdrawal', title: 'Pending Withdrawals', desc: `${badgeCounts.withdrawals} vendor/franchise requests pending`, active: badgeCounts.withdrawals > 0 }
  ];

  const totalNotifications = notificationAlerts.filter(n => n.active).length;

  return (
    <header className="h-16 sticky top-0 z-30 bg-card/80 backdrop-blur-md border-b border-border flex items-center justify-between px-6 transition-colors duration-300">
      
      {/* Left section: Breadcrumb / Mobile spacing */}
      <div className="flex items-center gap-4 pl-10 md:pl-0">
        <button
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="hidden md:flex p-1.5 hover:bg-secondary rounded-lg text-muted-foreground hover:text-foreground transition-colors cursor-pointer mr-1"
        >
          <Menu size={18} />
        </button>
        <div>
          <h1 className="text-base font-semibold text-foreground tracking-tight select-none">
            {formatTabName(activeTab)}
          </h1>
          <div className="text-[10px] text-muted-foreground flex items-center gap-1 select-none">
            <span>Apex Admin</span>
            <span>/</span>
            <span className="capitalize">{activeTab}</span>
          </div>
        </div>
      </div>

      {/* Right section: Search & Actions */}
      <div className="flex items-center gap-4">
        {/* Global Search Bar */}
        <div className="hidden md:flex items-center bg-secondary/50 border border-border/80 focus-within:border-primary/80 focus-within:ring-2 focus-within:ring-primary/20 rounded-xl px-3 py-1.5 w-64 transition-all">
          <Search size={16} className="text-muted-foreground shrink-0" />
          <input
            type="text"
            placeholder="Search items, orders..."
            onChange={(e) => onSearchChange?.(e.target.value)}
            className="ml-2 text-xs bg-transparent border-none outline-none text-foreground placeholder:text-muted-foreground w-full"
          />
        </div>

        {/* Notifications Tray */}
        <div className="relative">
          <button
            onClick={() => {
              setShowNotifications(!showNotifications);
              setShowProfileDropdown(false);
            }}
            className="p-2 bg-secondary/50 text-muted-foreground hover:text-foreground rounded-xl transition-all border border-border/30 hover:border-border select-none relative"
          >
            <Bell size={18} />
            {totalNotifications > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-destructive rounded-full" />
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-3 w-80 bg-card border border-border shadow-xl rounded-2xl p-4 overflow-hidden z-50">
              <div className="flex items-center justify-between pb-3 border-b border-border">
                <span className="text-xs font-bold text-foreground">Admin Notifications</span>
                <span className="text-[10px] text-muted-foreground">{totalNotifications} Active Alerts</span>
              </div>
              <div className="py-2 divide-y divide-border/60 max-h-64 overflow-y-auto no-scrollbar">
                {totalNotifications === 0 ? (
                  <div className="py-6 text-center text-xs text-muted-foreground">
                    All tasks completed. No notifications!
                  </div>
                ) : (
                  notificationAlerts.map(alert => {
                    if (!alert.active) return null;
                    return (
                      <div key={alert.id} className="py-3 flex gap-3 select-none hover:bg-secondary/20 px-2 rounded-lg transition-colors cursor-pointer">
                        <Clock size={16} className="text-primary mt-0.5 shrink-0" />
                        <div>
                          <p className="text-xs font-semibold text-foreground">{alert.title}</p>
                          <p className="text-[10px] text-muted-foreground mt-0.5">{alert.desc}</p>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>

        {/* Profile Dropdown */}
        <div className="relative">
          <button
            onClick={() => {
              setShowProfileDropdown(!showProfileDropdown);
              setShowNotifications(false);
            }}
            className="flex items-center gap-2.5 p-1.5 pr-3 hover:bg-secondary/50 rounded-xl transition-all select-none border border-transparent hover:border-border/60"
          >
            <img
              src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=100"
              alt="Admin Profile"
              className="w-7 h-7 rounded-lg object-cover ring-1 ring-border"
            />
            <span className="hidden sm:inline text-xs font-medium text-foreground select-none">Ananya</span>
            <ChevronDown size={14} className="text-muted-foreground shrink-0" />
          </button>

          {showProfileDropdown && (
            <div className="absolute right-0 mt-3 w-52 bg-card border border-border shadow-xl rounded-2xl p-2 z-50">
              <div className="px-3 py-2 border-b border-border mb-1">
                <p className="text-xs font-bold text-foreground">Ananya Sharma</p>
                <p className="text-[10px] text-muted-foreground">ananya@apexmarket.in</p>
              </div>
              <button className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-secondary/60 text-xs font-medium text-muted-foreground hover:text-foreground transition-all">
                <User size={14} /> My Profile
              </button>
              <button className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-secondary/60 text-xs font-medium text-muted-foreground hover:text-foreground transition-all">
                <Settings size={14} /> Platform Settings
              </button>
              <div className="border-t border-border my-1" />
              <button
                onClick={() => setIsAuthenticated(false)}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-secondary/60 text-xs font-medium text-destructive hover:bg-destructive/10 transition-all cursor-pointer"
              >
                <LogOut size={14} /> Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
