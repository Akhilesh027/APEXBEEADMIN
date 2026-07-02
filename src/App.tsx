import React, { useState, useEffect } from 'react';
import { Sidebar, ActiveTab } from './components/Sidebar';
import { Header } from './components/Header';
import { Dashboard } from './pages/Dashboard';
import { KycVerification } from './pages/KycVerification';
import { CategoryManagement } from './pages/CategoryManagement';
import { AdminProductApproval } from './pages/ProductApprovals';
import { CommissionEngine } from './pages/CommissionEngine';
import { PaymentVerification } from './pages/PaymentVerification';
import { FranchiseNetwork } from './pages/FranchiseNetwork';
import { ReferralSystem } from './pages/ReferralSystem';
import { OrderManagement } from './pages/OrderManagement';
import { DeliveryManagement } from './pages/DeliveryManagement';
import { WalletManagement } from './pages/WalletManagement';
import { ReportsAnalytics } from './pages/ReportsAnalytics';
import { SubscriptionManagement } from './pages/SubscriptionManagement';
import { CouponManagement } from './pages/CouponManagement';
import { TerritoryManagement } from './pages/TerritoryManagement';
import { EcosystemMap } from './pages/EcosystemMap';
import { ApprovalCenter } from './pages/ApprovalCenter';
import { SupplyChainHub } from './pages/SupplyChainHub';
import { CommissionControlCenter } from './pages/CommissionControlCenter';
import { SettlementCenter } from './pages/SettlementCenter';
import { CommunicationCenter } from './pages/CommunicationCenter';
import { BusinessIntelligence } from './pages/BusinessIntelligence';
import { HyperlocalOperations } from './pages/HyperlocalOperations';
import { FinancialCenter } from './pages/FinancialCenter';
import { RiskCenter } from './pages/RiskCenter';
import { QrNetwork } from './pages/QrNetwork';
import { FranchiseManagement } from './pages/FranchiseManagement';
import { useAdminState } from './context/AdminStateContext';
import { Login } from './pages/Login';
import { UserManagement } from './pages/UserManagement';
import { VendorManagement } from './pages/VendorManagement';
import { ManufacturerManagement } from './pages/ManufacturerManagement';
import { WholesalerManagement } from './pages/WholesalerManagement';
import { EntrepreneurManagement } from './pages/EntrepreneurManagement';
import { CourseProviderManagement } from './pages/CourseProviderManagement';
import { ServiceProviderManagement } from './pages/ServiceProviderManagement';
import { PosSoftwarePartners } from './pages/PosSoftwarePartners';
import { FinancialServicesPartners } from './pages/FinancialServicesPartners';
import { TravelPartnerManagement } from './pages/TravelPartnerManagement';
import { AdvertisementManagement } from './pages/AdvertisementManagement';
import { TrainingManagement } from './pages/TrainingManagement';
import { StaffManagement } from './pages/StaffManagement';
import { AuditLogs } from './pages/AuditLogs';
import { SupportCenter } from './pages/SupportCenter';
import { SecuritySettings } from './pages/SecuritySettings';

const App: React.FC = () => {
  const { sellers, products, orders, withdrawals, isAuthenticated } = useAdminState();
  const [activeTab, setActiveTab] = useState<ActiveTab>(() => {
    const saved = localStorage.getItem('admin_active_tab');
    return (saved as ActiveTab) || 'dashboard';
  });
  const [isDarkMode, setIsDarkMode] = useState<boolean>(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(true);

  // Sync active tab to localStorage
  useEffect(() => {
    localStorage.setItem('admin_active_tab', activeTab);
  }, [activeTab]);

  // Sync dark class on document element
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  if (!isAuthenticated) {
    return <Login />;
  }

  // Compute live pending counts for Sidebar/Header notifications
  const badgeCounts = {
    kyc: sellers.filter(s => s.status === 'Pending KYC').length,
    products: products.filter(p => p.status === 'Pending Review').length,
    payments: orders.filter(o => o.paymentStatus === 'Pending Verification').length,
    withdrawals: withdrawals.filter(w => w.status === 'Pending').length
  };

  const handleTabChange = (tab: string) => {
    setActiveTab(tab as ActiveTab);
  };

  const renderActivePage = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard setActiveTab={handleTabChange} />;
      case 'kyc':
        return <KycVerification />;
      case 'categories':
        return <CategoryManagement />;
      case 'products':
        return <AdminProductApproval />;
      case 'commissions':
        return <CommissionEngine />;
      case 'payments':
        return <PaymentVerification />;
      case 'franchise':
        return <FranchiseNetwork />;
      case 'referrals':
        return <ReferralSystem />;
      case 'orders':
        return <OrderManagement />;
      case 'delivery':
        return <DeliveryManagement />;
      case 'wallets':
        return <WalletManagement />;
      case 'reports':
        return <ReportsAnalytics />;
      case 'subscriptions':
        return <SubscriptionManagement />;
      case 'coupons':
        return <CouponManagement />;
      case 'territory':
        return <TerritoryManagement />;
      case 'ecosystem_map':
        return <EcosystemMap />;
      case 'approval_center':
        return <ApprovalCenter />;
      case 'supply_chain':
        return <SupplyChainHub />;
      case 'commission_control':
        return <CommissionControlCenter />;
      case 'settlement_center':
        return <SettlementCenter />;
      case 'communication':
        return <CommunicationCenter />;
      case 'bi':
        return <BusinessIntelligence />;
      case 'hyperlocal':
        return <HyperlocalOperations />;
      case 'financial_center':
        return <FinancialCenter />;
      case 'risk_center':
        return <RiskCenter />;
      case 'qr_network':
        return <QrNetwork />;
      case 'franchise_marketplace':
        return <FranchiseManagement />;
      case 'user_management':
        return <UserManagement />;
      case 'vendor_management':
        return <VendorManagement />;
      case 'manufacturer_management':
        return <ManufacturerManagement />;
      case 'wholesaler_management':
        return <WholesalerManagement />;
      case 'entrepreneur_management':
        return <EntrepreneurManagement />;
      case 'course_provider_management':
        return <CourseProviderManagement />;
      case 'service_provider_management':
        return <ServiceProviderManagement />;
      case 'pos_software_partners':
        return <PosSoftwarePartners />;
      case 'financial_services_partners':
        return <FinancialServicesPartners />;
      case 'travel_partner_management':
        return <TravelPartnerManagement />;
      case 'advertisement_management':
        return <AdvertisementManagement />;
      case 'training_management':
        return <TrainingManagement />;
      case 'staff_management':
        return <StaffManagement />;
      case 'audit_logs':
        return <AuditLogs />;
      case 'support_center':
        return <SupportCenter />;
      case 'security_settings':
        return <SecuritySettings />;
      default:
        return <Dashboard setActiveTab={handleTabChange} />;
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground transition-colors duration-300 flex">
      {/* Sidebar - fixed on left */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={handleTabChange}
        isDarkMode={isDarkMode}
        setIsDarkMode={setIsDarkMode}
        isSidebarOpen={isSidebarOpen}
        setIsSidebarOpen={setIsSidebarOpen}
        badgeCounts={badgeCounts}
      />

      {/* Main content body - shifts margin-left to accommodate sidebar on large viewports */}
      <div className={`flex-1 flex flex-col min-h-screen w-full transition-all duration-300 ${isSidebarOpen ? 'md:pl-[280px]' : 'md:pl-[80px]'
        }`}>
        <Header
          activeTab={activeTab}
          badgeCounts={badgeCounts}
          isSidebarOpen={isSidebarOpen}
          setIsSidebarOpen={setIsSidebarOpen}
        />

        {/* Page Content viewport */}
        <main className="flex-1 p-6 md:p-8 max-w-7xl w-full mx-auto select-none mt-1.5 animate-fadeIn">
          {renderActivePage()}
        </main>
      </div>
    </div>
  );
};

export default App;
