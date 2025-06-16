import axios from 'axios';

// Configuración de la URL base del API
// Si usas Vite:
const API_BASE_URL = import.meta.env.MODE === 'production'
  ? '/api' // En producción, usa la misma URL
  : 'http://localhost:3001/api'; // En desarrollo, apunta al backend local

// Si usas otro build tool, ajusta la variable de entorno según corresponda.

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para agregar el token JWT
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
if (token) {
  if (!config.headers) {
    config.headers = {} as import('axios').AxiosRequestHeaders;
  }
  config.headers.Authorization = `Bearer ${token}`;
}
  return config;
});

// Interceptor para manejar errores de autenticación
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expirado o inválido
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;