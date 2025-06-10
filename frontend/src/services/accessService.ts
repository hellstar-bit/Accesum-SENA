import api from './api';

export interface AccessRecord {
  id: number;
  userId: number;
  profileId: number;
  entryTime: string;
  exitTime?: string;
  status: 'ENTRADA' | 'SALIDA' | 'EN_INSTALACIONES';
  duration?: string;
  notes?: string;
  createdAt: string;
  user: {
    id: number;
    email: string;
    profile: {
      firstName: string;
      lastName: string;
      documentNumber: string;
      documentType: string;
      profileImage?: string;
    };
  };
}

export interface AccessMetrics {
  totalToday: number;
  currentOccupancy: number;
  averageStayTime: string;
  peakHours: {
    hour: string;
    count: number;
  }[];
  dailyStats: {
    date: string;
    entries: number;
    exits: number;
    maxOccupancy: number;
  }[];
}

export interface CheckInData {
  profileId?: number;
  qrData?: string;
  documentNumber?: string;
  notes?: string;
}

export interface CheckOutData {
  profileId?: number;
  qrData?: string;
  documentNumber?: string;
  notes?: string;
}

export interface AccessHistory {
  records: AccessRecord[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

class AccessService {
  // ⭐ CHECK-IN (ENTRADA)
  async checkIn(data: CheckInData): Promise<AccessRecord> {
    try {
      console.log('🚪 Realizando check-in:', data);
      const response = await api.post('/access/check-in', data);
      return response.data;
    } catch (error) {
      console.error('Error en check-in:', error);
      throw error;
    }
  }

  // ⭐ CHECK-OUT (SALIDA)
  async checkOut(data: CheckOutData): Promise<AccessRecord> {
    try {
      console.log('🚪 Realizando check-out:', data);
      const response = await api.post('/access/check-out', data);
      return response.data;
    } catch (error) {
      console.error('Error en check-out:', error);
      throw error;
    }
  }

  // ⭐ VALIDAR CÓDIGO QR
  async validateQR(qrData: string): Promise<{
    valid: boolean;
    profile?: any;
    message: string;
  }> {
    try {
      const response = await api.post('/access/validate-qr', { qrData });
      return response.data;
    } catch (error) {
      console.error('Error al validar QR:', error);
      throw error;
    }
  }

  // ⭐ OBTENER HISTORIAL DE ACCESO
  async getAccessHistory(params?: {
    page?: number;
    limit?: number;
    startDate?: string;
    endDate?: string;
    profileId?: number;
    status?: string;
  }): Promise<AccessHistory> {
    try {
      const response = await api.get('/access/history', { params });
      return response.data;
    } catch (error) {
      console.error('Error al obtener historial de acceso:', error);
      throw error;
    }
  }

  // ⭐ OBTENER OCUPACIÓN ACTUAL
  async getCurrentOccupancy(): Promise<{
    current: number;
    capacity: number;
    percentage: number;
    peopleInside: AccessRecord[];
  }> {
    try {
      const response = await api.get('/access/current-occupancy');
      return response.data;
    } catch (error) {
      console.error('Error al obtener ocupación actual:', error);
      throw error;
    }
  }

  // ⭐ OBTENER MÉTRICAS DE ACCESO
  async getAccessMetrics(params?: {
    startDate?: string;
    endDate?: string;
    groupBy?: 'hour' | 'day' | 'week' | 'month';
  }): Promise<AccessMetrics> {
    try {
      const response = await api.get('/access/metrics', { params });
      return response.data;
    } catch (error) {
      console.error('Error al obtener métricas de acceso:', error);
      throw error;
    }
  }

  // ⭐ OBTENER REGISTROS DE HOY
  async getTodayRecords(): Promise<AccessRecord[]> {
    try {
      const response = await api.get('/access/today');
      return response.data;
    } catch (error) {
      console.error('Error al obtener registros de hoy:', error);
      throw error;
    }
  }

  // ⭐ OBTENER REGISTRO POR ID
  async getAccessRecord(recordId: number): Promise<AccessRecord> {
    try {
      const response = await api.get(`/access/records/${recordId}`);
      return response.data;
    } catch (error) {
      console.error('Error al obtener registro de acceso:', error);
      throw error;
    }
  }

  // ⭐ BUSCAR REGISTROS POR DOCUMENTO
  async searchByDocument(documentNumber: string): Promise<AccessRecord[]> {
    try {
      const response = await api.get(`/access/search`, {
        params: { documentNumber }
      });
      return response.data;
    } catch (error) {
      console.error('Error al buscar por documento:', error);
      throw error;
    }
  }

  // ⭐ OBTENER ESTADÍSTICAS DE TIEMPO REAL
  async getRealTimeStats(): Promise<{
    entriesLast24h: number;
    exitsLast24h: number;
    currentOccupancy: number;
    averageStayTime: string;
    peakHourToday: string;
    mostActiveUsers: {
      name: string;
      visits: number;
    }[];
  }> {
    try {
      const response = await api.get('/access/realtime-stats');
      return response.data;
    } catch (error) {
      console.error('Error al obtener estadísticas en tiempo real:', error);
      throw error;
    }
  }

  // ⭐ EXPORTAR REPORTE DE ACCESO
  async exportAccessReport(params: {
    startDate: string;
    endDate: string;
    format: 'excel' | 'pdf' | 'csv';
    includeImages?: boolean;
  }) {
    try {
      const response = await api.get('/access/export', {
        params,
        responseType: 'blob'
      });

      // Crear y descargar archivo
      const blob = new Blob([response.data]);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      
      const extension = params.format === 'excel' ? 'xlsx' : params.format;
      link.download = `reporte-acceso-${params.startDate}-${params.endDate}.${extension}`;
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      return { success: true, message: 'Reporte descargado exitosamente' };
    } catch (error) {
      console.error('Error al exportar reporte de acceso:', error);
      throw error;
    }
  }

  // ⭐ FORZAR SALIDA (Para emergencias o correcciones)
  async forceCheckOut(profileId: number, reason?: string): Promise<AccessRecord> {
    try {
      const response = await api.post('/access/force-checkout', {
        profileId,
        reason
      });
      return response.data;
    } catch (error) {
      console.error('Error al forzar salida:', error);
      throw error;
    }
  }

  // ⭐ OBTENER USUARIOS ACTUALMENTE EN INSTALACIONES
  async getPeopleInside(): Promise<{
    count: number;
    people: {
      id: number;
      name: string;
      documentNumber: string;
      entryTime: string;
      duration: string;
      type: string;
    }[];
  }> {
    try {
      const response = await api.get('/access/people-inside');
      return response.data;
    } catch (error) {
      console.error('Error al obtener personas en instalaciones:', error);
      throw error;
    }
  }

  // ⭐ CONFIGURAR ALERTAS DE OCUPACIÓN
  async setOccupancyAlert(params: {
    maxOccupancy: number;
    alertThreshold: number;
    notificationEmails: string[];
  }) {
    try {
      const response = await api.post('/access/occupancy-alerts', params);
      return response.data;
    } catch (error) {
      console.error('Error al configurar alertas de ocupación:', error);
      throw error;
    }
  }

  // ⭐ OBTENER CONFIGURACIÓN DE ACCESO
  async getAccessConfig(): Promise<{
    maxOccupancy: number;
    workingHours: {
      start: string;
      end: string;
    };
    allowedDays: string[];
    requiresApproval: boolean;
    autoCheckoutHours: number;
  }> {
    try {
      const response = await api.get('/access/config');
      return response.data;
    } catch (error) {
      console.error('Error al obtener configuración de acceso:', error);
      throw error;
    }
  }

  // ⭐ ACTUALIZAR CONFIGURACIÓN DE ACCESO
  async updateAccessConfig(config: {
    maxOccupancy?: number;
    workingHours?: {
      start: string;
      end: string;
    };
    allowedDays?: string[];
    requiresApproval?: boolean;
    autoCheckoutHours?: number;
  }) {
    try {
      const response = await api.put('/access/config', config);
      return response.data;
    } catch (error) {
      console.error('Error al actualizar configuración de acceso:', error);
      throw error;
    }
  }

  // ⭐ OBTENER LOGS DE ACCESO PARA AUDITORÍA
  async getAccessLogs(params?: {
    startDate?: string;
    endDate?: string;
    action?: string;
    userId?: number;
  }) {
    try {
      const response = await api.get('/access/logs', { params });
      return response.data;
    } catch (error) {
      console.error('Error al obtener logs de acceso:', error);
      throw error;
    }
  }

  // ⭐ SINCRONIZAR CON SISTEMA EXTERNO
  async syncWithExternalSystem(systemId: string) {
    try {
      const response = await api.post(`/access/sync/${systemId}`);
      return response.data;
    } catch (error) {
      console.error('Error al sincronizar con sistema externo:', error);
      throw error;
    }
  }
}

export const accessService = new AccessService();
