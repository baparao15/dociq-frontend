import axios from 'axios';

const API_URL = `https://dociq-backend.onrender.com`;

const api = axios.create({
  baseURL: API_URL
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export const analyzeDocument = async (file: File) => {
  const formData = new FormData();
  formData.append('file', file);
  
  try {
    const response = await api.post('/api/analyze-document', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  } catch (error: any) {
    // If authentication fails, try demo endpoint
    if (error.response?.status === 401) {
      const response = await api.post('/api/demo/analyze-document', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      return response.data;
    }
    throw error;
  }
};

export const analyzeText = async (text: string) => {
  const formData = new FormData();
  formData.append('text', text);
  
  try {
    const response = await api.post('/api/analyze-text', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  } catch (error: any) {
    // If authentication fails, try demo endpoint
    if (error.response?.status === 401) {
      const response = await api.post('/api/demo/analyze-text', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      return response.data;
    }
    throw error;
  }
};

export const getDocuments = async () => {
  const response = await api.get('/api/documents');
  return response.data;
};

export const getDocument = async (documentId: number) => {
  const response = await api.get(`/api/documents/${documentId}`);
  return response.data;
};

export const updateDocument = async (documentId: number, editedText: string) => {
  const response = await api.put(`/api/documents/${documentId}`, {
    edited_text: editedText
  });
  return response.data;
};
