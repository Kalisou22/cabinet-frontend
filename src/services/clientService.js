import axiosInstance from '../api/axios';

const BASE_URL = '/v1/clients';

export const clientService = {
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
  searchByTelephone: async (telephone) => {
    const response = await axiosInstance.get(`${BASE_URL}/search`, {
      params: { telephone }
    });
    return response.data;
  },
  getActiveClients: async () => {
    const response = await axiosInstance.get(BASE_URL, {
      params: { activeOnly: true }
    });
    return response.data;
  },
  getClientsWithDebt: async () => {
    const response = await axiosInstance.get(`${BASE_URL}/in-debt`);
    return response.data;
  },
};