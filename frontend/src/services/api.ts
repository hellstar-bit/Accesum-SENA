// frontend/src/services/api.ts - OPTIMIZADO PARA CANCELACIONES
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 
  (import.meta.env.PROD ? '/api' : 'http://localhost:3000');

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

// Interceptor de request - agregar token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    
    // ⭐ SOLO loggear en desarrollo
    if (import.meta.env.MODE === 'development') {
      console.log(`🌐 ${config.method?.toUpperCase()} ${config.url}`);
    }
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      
      if (import.meta.env.MODE === 'development') {
        console.log('🎫 Token agregado:', token.substring(0, 20) + '...');
      }
    } else if (import.meta.env.MODE === 'development') {
      console.log('⚠️ No hay token disponible');
    }
    
    return config;
  },
  (error) => {
    console.error('❌ Error en request interceptor:', error);
    return Promise.reject(error);
  }
);

// Interceptor de response - manejar errores MEJORADO
api.interceptors.response.use(
  (response) => {
    if (import.meta.env.MODE === 'development') {
      console.log(`✅ ${response.config.method?.toUpperCase()} ${response.config.url} - ${response.status}`);
    }
    return response;
  },
  (error) => {
    const status = error.response?.status;
    const url = error.config?.url;
    const method = error.config?.method?.toUpperCase();
    
    // ⭐ FILTRAR peticiones canceladas para no mostrarlas como errores
    if (error.code === 'ERR_CANCELED' || error.message === 'canceled') {
      if (import.meta.env.MODE === 'development') {
        console.log(`🚫 ${method} ${url} - Petición cancelada (normal)`);
      }
      return Promise.reject({
        ...error,
        message: 'canceled',
        isCanceled: true
      });
    }

    // ⭐ FILTRAR timeouts
    if (error.code === 'ECONNABORTED') {
      console.warn(`⏱️ ${method} ${url} - Timeout`);
      return Promise.reject({
        ...error,
        message: 'Tiempo de espera agotado',
        isTimeout: true
      });
    }

    // ⭐ SOLO loggear errores reales
    console.error(`❌ ${method} ${url} - ${status}:`, {
      status,
      message: error.response?.data?.message || error.message,
      data: error.response?.data
    });

    // ⭐ MANEJO MEJORADO de 401
    if (status === 401) {
      console.log('🔒 Error 401: Token inválido o expirado');
      localStorage.removeItem('token');
      
      // Solo redirigir si no estamos ya en login y no es una petición cancelada
      if (!window.location.pathname.includes('/login') && !error.isCanceled) {
        window.location.href = '/login';
      }
    }
    
    return Promise.reject(error);
  }
);

export default api;
