// frontend/src/services/api.ts - MEJORADO CON DEBUGGING
import axios from 'axios';

const API_BASE_URL = 'http://localhost:3000';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor de request - agregar token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    
    console.log(`🌐 ${config.method?.toUpperCase()} ${config.url}`);
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log('🎫 Token agregado:', token.substring(0, 20) + '...');
    } else {
      console.log('⚠️ No hay token disponible');
    }
    
    return config;
  },
  (error) => {
    console.error('❌ Error en request interceptor:', error);
    return Promise.reject(error);
  }
);

// Interceptor de response - manejar errores
api.interceptors.response.use(
  (response) => {
    console.log(`✅ ${response.config.method?.toUpperCase()} ${response.config.url} - ${response.status}`);
    return response;
  },
  (error) => {
    const status = error.response?.status;
    const url = error.config?.url;
    const method = error.config?.method?.toUpperCase();
    
    console.error(`❌ ${method} ${url} - ${status}:`, {
      status,
      message: error.response?.data?.message || error.message,
      data: error.response?.data
    });

    if (status === 401) {
      console.log('🔒 Error 401: Token inválido o expirado');
      localStorage.removeItem('token');
      
      // Solo redirigir si no estamos ya en login
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    }
    
    return Promise.reject(error);
  }
);

export default api;