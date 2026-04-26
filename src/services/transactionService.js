import axiosInstance from '../api/axios';

const BASE_URL = '/v1/transactions';

export const transactionService = {
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
  getByClientId: async (clientId) => {
    const response = await axiosInstance.get(`${BASE_URL}/client/${clientId}`);
    return response.data;
  },
  getByStatus: async (status) => {
    const response = await axiosInstance.get(`${BASE_URL}/status/${status}`);
    return response.data;
  },
  getClientDebt: async (clientId) => {
    const response = await axiosInstance.get(`${BASE_URL}/debt/${clientId}`);
    return response.data;
  },
  getPendingDebts: async () => {
    const response = await axiosInstance.get(`${BASE_URL}/pending-debts`);
    return response.data;
  },
  getPaginated: async (page, size, sort) => {
    const response = await axiosInstance.get(`${BASE_URL}/paginated`, {
      params: { page, size, sort }
    });
    return response.data;
  },
  // ✅ AJOUT : Récupérer le solde d'un client (avance/dette)
  getClientSolde: async (clientId) => {
    const response = await axiosInstance.get(`${BASE_URL}/solde/${clientId}`);
    return response.data;
  },
};