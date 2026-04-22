import axios from 'axios';

// Update this to your server's IP when testing on a physical device.
// For iOS Simulator, localhost works fine.
const BASE_URL = 'http://localhost:5050';

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
});

export const fetchRecords = async () => {
  const response = await api.get('/api/records');
  return response.data;
};

export const bulkUpdateRecords = async (ids, updates) => {
  const response = await api.post('/api/records/bulk/update', { ids, updates });
  return response.data;
};

export const fetchRecord = async (id) => {
  const response = await api.get(`/api/records/${id}`);
  return response.data;
};

export default api;
