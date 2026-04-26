import axiosInstance from '../api/axios';

const BASE_URL = '/v1/inventory/sessions';
const LINES_URL = '/v1/inventory/lines';

export const inventoryService = {
  getAllSessions: async () => {
    const response = await axiosInstance.get(BASE_URL);
    return response.data;
  },
  getSessionById: async (id) => {
    const response = await axiosInstance.get(`${BASE_URL}/${id}`);
    return response.data;
  },
  getSessionByDate: async (date) => {
    const response = await axiosInstance.get(`${BASE_URL}/date/${date}`);
    return response.data;
  },
  createSession: async (data) => {
    const response = await axiosInstance.post(BASE_URL, data);
    return response.data;
  },
  closeSession: async (id, justification = null) => {
    const payload = justification ? { justification } : {};
    const response = await axiosInstance.post(`${BASE_URL}/${id}/close`, payload);
    return response.data;
  },
  getSessionSummary: async (id) => {
    const response = await axiosInstance.get(`${BASE_URL}/${id}/summary`);
    return response.data;
  },
  getOpenSessions: async () => {
    const response = await axiosInstance.get(`${BASE_URL}/open`);
    return response.data;
  },
  getLinesBySession: async (sessionId) => {
    const response = await axiosInstance.get(`${LINES_URL}/session/${sessionId}`);
    return response.data;
  },
  addLine: async (data) => {
    const response = await axiosInstance.post(LINES_URL, data);
    return response.data;
  },
  updateLine: async (id, data) => {
    const response = await axiosInstance.put(`${LINES_URL}/${id}`, data);
    return response.data;
  },
  deleteLine: async (id) => {
    const response = await axiosInstance.delete(`${LINES_URL}/${id}`);
    return response.data;
  },
  deleteSession: async (id) => {
    const response = await axiosInstance.delete(`${BASE_URL}/${id}`);
    return response.data;
  },
};