// frontend/src/services/api.ts - OPTIMIZADO PARA CANCELACIONES Y SUBIDA DE ARCHIVOS
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

console.log('🔗 API URL configurada:', API_BASE_URL); // Para debug

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 300000, // 🔧 CAMBIADO: 5 minutos para operaciones de archivos
  headers: {
    'Content-Type': 'application/json',
  },
});

// 🆕 CONFIGURACIÓN ESPECÍFICA PARA SUBIDA DE IMÁGENES
export const createApiWithCustomTimeout = (timeoutMs: number) => {
  return axios.create({
    baseURL: API_BASE_URL,
    timeout: timeoutMs,
    headers: {
      'Content-Type': 'application/json',
    },
  });
};

// Interceptor de request - agregar token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    
    // ⭐ SOLO loggear en desarrollo
    if (import.meta.env.MODE === 'development') {
      console.log(`🌐 ${config.method?.toUpperCase()} ${config.url}`);
      
      // 🔧 AGREGAR LOG ESPECIAL PARA SUBIDA DE IMÁGENES
      if (config.url?.includes('/image') && config.data?.profileImage) {
        console.log(`📸 Subiendo imagen: ${config.data.profileImage.length} caracteres`);
      }
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
      
      // 🔧 LOG ESPECIAL PARA SUBIDA DE IMÁGENES EXITOSA
      if (response.config.url?.includes('/image')) {
        console.log('📸 ✅ Imagen subida exitosamente');
      }
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

    // ⭐ MANEJO MEJORADO DE TIMEOUTS CON MENSAJE ESPECÍFICO
    if (error.code === 'ECONNABORTED') {
      const isImageUpload = url?.includes('/image');
      const timeoutMessage = isImageUpload 
        ? 'La imagen es muy grande o la conexión es lenta. Intenta con una imagen más pequeña.'
        : 'Tiempo de espera agotado';
      
      console.warn(`⏱️ ${method} ${url} - Timeout${isImageUpload ? ' (subida de imagen)' : ''}`);
      
      return Promise.reject({
        ...error,
        message: timeoutMessage,
        isTimeout: true,
        isImageUpload
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
