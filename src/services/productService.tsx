import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'https://server.apexbee.in/api';

const getToken = () => localStorage.getItem('adminToken') || localStorage.getItem('token');

const authHeaders = () => ({
  Authorization: `Bearer ${getToken()}`,
});

export const productService = {
  // ==========================
  // ADMIN
  // ==========================

  getAll: async () => {
    const res = await axios.get(`${API_URL}/products`, {
      headers: authHeaders(),
    });

    return res.data.products;
  },

  getById: async (id: any) => {
    const res = await axios.get(`${API_URL}/products/${id}`, {
      headers: authHeaders(),
    });

    return res.data.product;
  },

  configureAdminPricing: async (id: any, payload: any) => {
    const res = await axios.patch(
      `${API_URL}/products/${id}/admin-pricing`,
      payload,
      {
        headers: authHeaders(),
      }
    );

    return res.data.product;
  },

  rejectProduct: async (id: any, payload: any) => {
    const res = await axios.patch(
      `${API_URL}/products/${id}/reject`,
      payload,
      {
        headers: authHeaders(),
      }
    );

    return res.data.product;
  },

  // ==========================
  // SELLER
  // ==========================

  getMyProducts: async (sellerId: any) => {
    const res = await axios.get(`${API_URL}/products/my-products`, {
      headers: authHeaders(),
      params: sellerId ? { sellerId } : {},
    });

    return res.data.products;
  },

  create: async (formData: any) => {
    const res = await axios.post(
      `${API_URL}/products`,
      formData,
      {
        headers: authHeaders(),
      }
    );

    return res.data.product;
  },

  update: async (id: any, formData: any) => {
    const res = await axios.put(
      `${API_URL}/products/${id}`,
      formData,
      {
        headers: authHeaders(),
      }
    );

    return res.data.product;
  },

  delete: async (id: any) => {
    const res = await axios.delete(
      `${API_URL}/products/${id}`,
      {
        headers: authHeaders(),
      }
    );

    return res.data;
  },

  sellerAcceptPricing: async (id: any) => {
    const res = await axios.patch(
      `${API_URL}/products/${id}/seller-accept-pricing`,
      {},
      {
        headers: authHeaders(),
      }
    );

    return res.data.product;
  },

  sellerNegotiatePricing: async (id: any, payload: any) => {
    const res = await axios.patch(
      `${API_URL}/products/${id}/seller-negotiate-pricing`,
      payload,
      {
        headers: authHeaders(),
      }
    );

    return res.data.product;
  },

  // ==========================
  // BULK
  // ==========================

  bulkUpdate: async (payload: any) => {
    const res = await axios.post(
      `${API_URL}/products/bulk-update`,
      payload,
      {
        headers: authHeaders(),
      }
    );

    return res.data;
  },

  // ==========================
  // FILTERS
  // ==========================

  getPendingReview: async () => {
    const products = await productService.getAll();

    return products.filter(
      (p: any) => p.status === 'Pending Review'
    );
  },

  getNegotiationRequests: async () => {
    const products = await productService.getAll();

    return products.filter(
      (p: any) => p.status === 'Negotiation Requested'
    );
  },

  getAwaitingSellerApproval: async () => {
    const products = await productService.getAll();

    return products.filter(
      (p: any) => p.status === 'Awaiting Seller Approval'
    );
  },

  getLiveProducts: async () => {
    const products = await productService.getAll();

    return products.filter(
      (p: any) => p.status === 'Live'
    );
  },

  getRejectedProducts: async () => {
    const products = await productService.getAll();

    return products.filter(
      (p: any) => p.status === 'Rejected'
    );
  },
};