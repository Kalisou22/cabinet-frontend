import axiosInstance from '../api/axios';

const BASE_URL = '/v1/cash-operations';

export const cashOperationService = {
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
    const response = await axiosInstance.delete(`${BASE_URL}/${id}`);
    return response.data;
  },
  getByType: async (type) => {
    const response = await axiosInstance.get(`${BASE_URL}/type/${type}`);
    return response.data;
  },
  getByPeriod: async (startDate, endDate) => {
    const response = await axiosInstance.get(`${BASE_URL}/period`, {
      params: { start: startDate, end: endDate }
    });
    return response.data;
  },
  getSummary: async (startDate, endDate) => {
    const response = await axiosInstance.get(`${BASE_URL}/summary`, {
      params: { start: startDate, end: endDate }
    });
    return response.data;
  },
};