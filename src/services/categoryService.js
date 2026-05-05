import axiosInstance from '../api/axios';

const BASE_URL = '/v1/categories';

export const categoryService = {
  getAll: async () => {
    const response = await axiosInstance.get(BASE_URL);
    return response.data;
  },

  getById: async (id) => {
    const response = await axiosInstance.get(`${BASE_URL}/${id}`);
    return response.data;
  },

  create: async (data) => {
    const response = await axiosInstance.post(BASE_URL, data);
    return response.data;
  },

  update: async (id, data) => {
    const response = await axiosInstance.put(`${BASE_URL}/${id}`, data);
    return response.data;
  },

  delete: async (id) => {
    await axiosInstance.delete(`${BASE_URL}/${id}`);
  },
};