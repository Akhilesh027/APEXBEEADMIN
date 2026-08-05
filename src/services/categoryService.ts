import axios from 'axios';

const API_URL = 'https://server.apexbee.in/api';

export const categoryService = {
  getAll: async () => {
    const res = await axios.get(`${API_URL}/categories`);
    return res.data.categories;
  },

  getTree: async () => {
    const res = await axios.get(`${API_URL}/categories/tree`);
    return res.data.categories;
  },

  getDropdown: async () => {
    const res = await axios.get(`${API_URL}/categories/dropdown`);
    return res.data.categories;
  },

  create: async (formData: any) => {
    const res = await axios.post(`${API_URL}/categories`, formData, {});
    return res.data.category;
  },

  update: async (id: any, formData: any) => {
    const res = await axios.put(`${API_URL}/categories/${id}`, formData, {});
    return res.data.category;
  },

  delete: async (id: any) => {
    const res = await axios.delete(`${API_URL}/categories/${id}`);
    return res.data;
  },

  applyPreset: async (id: any, presetKey: string) => {
    const res = await axios.post(`${API_URL}/categories/${id}/apply-preset`, { presetKey });
    return res.data;
  },

  getResolvedSchema: async (id: any) => {
    try {
      const res = await axios.get(`${API_URL}/devotional/category-schemas/${id}/resolved`);
      return res.data;
    } catch {
      return null;
    }
  },

  /** Get product schema for a category (with parent inheritance fallback) */
  getProductSchema: async (id: string) => {
    try {
      const res = await axios.get(`${API_URL}/categories/${id}/product-schema`);
      return res.data;
    } catch {
      return { success: false, schema: null };
    }
  },

  /** Create or update the product schema for a category */
  upsertProductSchema: async (id: string, schemaData: any) => {
    const res = await axios.put(`${API_URL}/categories/${id}/product-schema`, schemaData);
    return res.data;
  },

  /** Get all available attribute presets (grocery, restaurant, fashion, etc.) */
  getAttributePresets: async () => {
    try {
      const res = await axios.get(`${API_URL}/categories/attribute-presets`);
      return res.data;
    } catch {
      return { success: false, presets: [] };
    }
  },

  /** Get merged attributes from parent→child chain */
  getMergedAttributes: async (id: string) => {
    try {
      const res = await axios.get(`${API_URL}/categories/${id}/merged-attributes`);
      return res.data;
    } catch {
      return { success: false, mergedAttributes: [] };
    }
  },
};
