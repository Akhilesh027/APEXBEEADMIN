import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'https://server.apexbee.in/api';

const getToken = () => localStorage.getItem('adminToken') || localStorage.getItem('token');

const authHeaders = () => ({
  Authorization: `Bearer ${getToken()}`,
});

export const couponService = {
  getAll: async () => {
    const res = await axios.get(`${API_URL}/coupons`, {
      headers: authHeaders(),
    });
    return res.data.coupons || [];
  },

  create: async (payload: any) => {
    const res = await axios.post(`${API_URL}/coupons`, payload, {
      headers: authHeaders(),
    });
    return res.data.coupon;
  },

  update: async (id: string, payload: any) => {
    const res = await axios.put(`${API_URL}/coupons/${id}`, payload, {
      headers: authHeaders(),
    });
    return res.data.coupon;
  },

  delete: async (id: string) => {
    const res = await axios.delete(`${API_URL}/coupons/${id}`, {
      headers: authHeaders(),
    });
    return res.data;
  },
};
