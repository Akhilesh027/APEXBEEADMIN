export interface BankDetails {
  bankName: string;
  accountNo: string;
  ifsc: string;
}

export interface DocumentUploads {
  aadhaarFront: string;
  aadhaarBack: string;
  panCard: string;
  gstCert: string;
  bizLicense: string;
  bankPassbook: string;
  profilePhoto: string;
}

export interface Seller {
  id: string;
  businessName: string;
  ownerName: string;
  mobile: string;
  email: string;
  type: 'Manufacturer' | 'Wholesaler' | 'Vendor';
  gstNumber: string;
  panNumber: string;
  aadhaarNumber: string;
  upiId: string;
  bankDetails: BankDetails;
  address: string;
  status: 'Pending KYC' | 'Approved' | 'Suspended' | 'Additional Docs Requested';
  comments?: string;
  documents: DocumentUploads;
  dateJoined: string;
}

export interface CategoryAttribute {
  id: string;
  name: string;
  type: 'text' | 'number' | 'select' | 'boolean';
  required: boolean;
  isVariant: boolean;
  options?: string[];
}

export interface Category {
  id: string;
  name: string;
  subcategories: string[];
  brands: string[];
  attributes: CategoryAttribute[];
}

export interface ProductVariant {
  sku: string;
  name: string;
  price: number;
  stock: number;
  image: string;
  attributes: Record<string, string>;
}

export interface CommissionSettings {
  platformCommission: number; // in ₹ or %
  platformCommissionType: 'fixed' | 'percentage';
  referralPool: number; // total referral pool
  referralPoolType: 'fixed' | 'percentage';
  franchisePool: number; // total franchise pool
  franchisePoolType: 'fixed' | 'percentage';
  stateFranchise: number;
  stateFranchiseType: 'fixed' | 'percentage';
  districtFranchise: number;
  districtFranchiseType: 'fixed' | 'percentage';
  mandalFranchise: number;
  mandalFranchiseType: 'fixed' | 'percentage';
  wishLinkIncentive: number;
  wishLinkIncentiveType: 'fixed' | 'percentage';
  firstPurchaseIncentive: number;
  firstPurchaseIncentiveType: 'fixed' | 'percentage';
  l1Referral: number;
  l1ReferralType: 'fixed' | 'percentage';
  l2Referral: number;
  l2ReferralType: 'fixed' | 'percentage';
  l3Referral: number;
  l3ReferralType: 'fixed' | 'percentage';
}

export interface Product {
  id: string;
  name: string;
  sellerId: string;
  sellerName: string;
  category: string;
  subcategory: string;
  brand: string;
  description: string;
  mainImage: string;
  stock: number;
  price: number;
  shippingCharges: number;
  packingCharges: number;
  commissionSettings: CommissionSettings;
  status: 'Pending Review' | 'Live' | 'Rejected';
  variants: ProductVariant[];
  dateUploaded: string;
}

export interface OrderItem {
  productId: string;
  productName: string;
  quantity: number;
  price: number;
  variantSku?: string;
}

export interface Order {
  id: string;
  customerName: string;
  customerMobile: string;
  customerAddress: string;
  items: OrderItem[];
  totalAmount: number;
  upiRefNo: string;
  paymentScreenshot: string; // URL mock
  paymentStatus: 'Pending Verification' | 'Approved' | 'Rejected' | 'Request Reupload';
  orderStatus:
    | 'Pending Payment'
    | 'Payment Verified'
    | 'Processing'
    | 'Confirmed'
    | 'Packed'
    | 'Shipped'
    | 'Delivered'
    | 'Return Requested'
    | 'Returned'
    | 'Refunded'
    | 'Cancelled';
  date: string;
  deliveryAgentId?: string;
  deliveryType?: 'Platform' | 'Vendor' | 'Independent';
  courierPartner?: string;
  trackingId?: string;
  returnAllowed: boolean;
  returnWindowDays: number;
  refundType: 'Refund Only' | 'Replacement Only' | 'Both';
  commissionReleaseStatus?: 'Pending' | 'Released';
  commissionReleasedAt?: string | null;
  timeline: { status: string; date: string; note: string }[];
}

export interface FranchiseNode {
  id: string;
  name: string;
  businessName?: string;
  ownerName: string;
  level: 'State' | 'District' | 'Mandal';
  parentId?: string; // Links State -> District -> Mandal
  usersCount?: number;
  vendorsCount?: number;
  ordersCount?: number;
  commissionsEarned?: number;
  networkGrowth?: number; // percentage
  status: 'Active' | 'Suspended' | 'Inactive';
  state?: string;
  district?: string;
  mandal?: string;
  code?: string;
}

export interface ReferralNode {
  userId: string;
  userName: string;
  referredById?: string;
  level: number; // For visualization
  totalPurchases: number;
  commissionEarned: number;
}

export interface Wallet {
  id: string; // Same as ownerId (Seller ID or Franchise ID or Referral User ID)
  ownerName: string;
  type: 'Vendor' | 'Referral' | 'Franchise';
  pendingBalance: number;
  availableBalance: number;
  withdrawnBalance: number;
}

export interface WithdrawalRequest {
  id: string;
  ownerId: string;
  ownerName: string;
  type: 'Vendor' | 'Referral' | 'Franchise';
  amount: number;
  method: 'UPI' | 'Bank Transfer';
  details: string; // UPI ID or Bank details
  status: 'Pending' | 'Approved' | 'Rejected';
  date: string;
  feePercent?: number;
  feeAmount?: number;
  netAmount?: number;
}

export interface DeliveryAgent {
  id: string;
  name: string;
  type: 'Platform' | 'Vendor' | 'Independent';
  mobile: string;
  status: 'Available' | 'On Delivery' | 'Offline';
  completedDeliveries: number;
  rating: number;
}

export interface Coupon {
  id: string;
  code: string;
  discountType: 'fixed' | 'percentage';
  discountValue: number;
  minOrderValue: number;
  maxDiscount?: number;
  startDate: string;
  endDate: string;
  usageLimit: number;
  usageCount: number;
  totalSavings: number;
  status: 'Active' | 'Expired' | 'Inactive';
  scope: 'Global' | 'Vendor';
  vendorName?: string;
}

// ─── Empty initial arrays (replaces deleted mockData.ts) ─────────────────────
// All data now comes from the backend API — no hardcoded values
export const initialSellers: Seller[] = [];
export const initialCategories: Category[] = [];
export const initialProducts: Product[] = [];
export const initialOrders: Order[] = [];
export const initialFranchises: FranchiseNode[] = [];
export const initialReferrals: ReferralNode[] = [];
export const initialWallets: Wallet[] = [];
export const initialWithdrawalRequests: WithdrawalRequest[] = [];
export const initialDeliveryAgents: DeliveryAgent[] = [];
export const initialCoupons: Coupon[] = [];
