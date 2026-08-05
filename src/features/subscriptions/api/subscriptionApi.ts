const getApiBaseUrl = () => {
  if (typeof window !== 'undefined') {
    const host = window.location.hostname || 'localhost';
    return `http://${host}:5500/api`;
  }
  return 'https://server.apexbee.in/api';
};

const getHeaders = () => {
  const token = localStorage.getItem('adminToken') || localStorage.getItem('token') || '';
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };
};

const safeFetch = async (url: string, options: RequestInit = {}) => {
  try {
    const res = await fetch(url, { ...options, headers: { ...getHeaders(), ...(options.headers || {}) } });
    if (!res.ok) {
      return { success: false, status: res.status, message: `HTTP ${res.status}` };
    }
    return await res.json();
  } catch (err: any) {
    console.warn(`[adminSubscriptionApi] Network or server error for ${url}:`, err.message);
    return { success: false, message: err.message };
  }
};

export const subscriptionApi = {
  getDashboard: async () => {
    return safeFetch(`${getApiBaseUrl()}/admin/subscriptions/dashboard`);
  },

  getProducts: async () => {
    return safeFetch(`${getApiBaseUrl()}/admin/subscription-products`);
  },

  upsertProduct: async (productData: any) => {
    return safeFetch(`${getApiBaseUrl()}/admin/subscription-products`, {
      method: 'POST',
      body: JSON.stringify(productData)
    });
  },

  addPriceVersion: async (productId: string, priceData: any) => {
    return safeFetch(`${getApiBaseUrl()}/admin/subscription-products/${productId}/prices`, {
      method: 'POST',
      body: JSON.stringify(priceData)
    });
  },

  getFeatures: async () => {
    return safeFetch(`${getApiBaseUrl()}/admin/subscription-features`);
  },

  createFeature: async (featureData: any) => {
    return safeFetch(`${getApiBaseUrl()}/admin/subscription-features`, {
      method: 'POST',
      body: JSON.stringify(featureData)
    });
  },

  assignProductFeatures: async (productId: string, features: any[]) => {
    return safeFetch(`${getApiBaseUrl()}/admin/subscription-products/${productId}/features`, {
      method: 'PUT',
      body: JSON.stringify({ features })
    });
  },

  getDiscounts: async () => {
    return safeFetch(`${getApiBaseUrl()}/admin/subscription-discounts`);
  },

  createDiscount: async (discountData: any) => {
    return safeFetch(`${getApiBaseUrl()}/admin/subscription-discounts`, {
      method: 'POST',
      body: JSON.stringify(discountData)
    });
  },

  getVendorPricings: async () => {
    return safeFetch(`${getApiBaseUrl()}/admin/vendor-pricing`);
  },

  setVendorPricingOverride: async (overrideData: any) => {
    return safeFetch(`${getApiBaseUrl()}/admin/vendor-pricing`, {
      method: 'POST',
      body: JSON.stringify(overrideData)
    });
  },

  assignVendorPlan: async (assignmentData: any) => {
    return safeFetch(`${getApiBaseUrl()}/admin/vendor-subscriptions/assign`, {
      method: 'POST',
      body: JSON.stringify(assignmentData)
    });
  },

  getAuditLogs: async () => {
    return safeFetch(`${getApiBaseUrl()}/admin/subscription-audit-logs`);
  },

  getParentCategories: async () => {
    return safeFetch(`${getApiBaseUrl()}/categories?level=1&isActive=true`);
  },

  clearAllSubscriptionData: async () => {
    return safeFetch(`${getApiBaseUrl()}/admin/subscription-data/clear-all`, { method: 'DELETE' });
  }
};
