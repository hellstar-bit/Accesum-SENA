// frontend/src/services/timezoneService.ts
import api from './api';

interface ServerTimeInfo {
  timezone: string;
  currentDate: string;
  currentTime: string;
  offset: string;
  serverTime: string;
  timestamp: number;
}

interface ColombiaTimeInfo {
  date: string;
  time: string;
  fullDateTime: string;
  iso: string;
  timestamp: number;
}

class TimezoneService {
  private cachedServerTime: ServerTimeInfo | null = null;
  private lastSync: number = 0;
  private syncInterval: number = 5 * 60 * 1000; // 5 minutos

  // ⭐ SINCRONIZAR TIEMPO CON EL SERVIDOR
  async syncWithServer(): Promise<ServerTimeInfo> {
    try {
      const now = Date.now();
      
      // Si tenemos cache reciente, usarlo
      if (this.cachedServerTime && (now - this.lastSync) < this.syncInterval) {
        return this.cachedServerTime;
      }

      console.log('🌍 Sincronizando tiempo con el servidor...');
      
      const response = await api.get<ServerTimeInfo>('/config/timezone/current');
      this.cachedServerTime = response.data;
      this.lastSync = now;
      
      console.log('✅ Tiempo sincronizado:', {
        serverDate: this.cachedServerTime.currentDate,
        serverTime: this.cachedServerTime.currentTime,
        timezone: this.cachedServerTime.timezone
      });
      
      return this.cachedServerTime;
    } catch (error) {
      console.error('❌ Error al sincronizar tiempo:', error);
      
      // Fallback: usar tiempo local
      return this.getFallbackTime();
    }
  }

  // ⭐ OBTENER TIEMPO DE COLOMBIA DESDE EL SERVIDOR
  async getColombiaTime(): Promise<ColombiaTimeInfo> {
    try {
      const response = await api.get<ColombiaTimeInfo>('/config/timezone/colombia-time');
      
      console.log('🇨🇴 Tiempo de Colombia obtenido:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Error al obtener tiempo de Colombia:', error);
      
      // Fallback: calcular tiempo local de Colombia
      const now = new Date();
      const colombiaTime = new Date(now.toLocaleString("en-US", {timeZone: "America/Bogota"}));
      
      return {
        date: this.formatDateForInput(colombiaTime),
        time: colombiaTime.toLocaleTimeString('es-CO'),
        fullDateTime: colombiaTime.toLocaleString('es-CO'),
        iso: colombiaTime.toISOString(),
        timestamp: colombiaTime.getTime()
      };
    }
  }

  // ⭐ TIEMPO FALLBACK CUANDO NO HAY CONEXIÓN
  private getFallbackTime(): ServerTimeInfo {
    const now = new Date();
    const colombiaTime = new Date(now.toLocaleString("en-US", {timeZone: "America/Bogota"}));
    
    return {
      timezone: 'America/Bogota',
      currentDate: this.formatDateForInput(colombiaTime),
      currentTime: colombiaTime.toLocaleTimeString('es-CO'),
      offset: 'UTC-5',
      serverTime: now.toISOString(),
      timestamp: now.getTime()
    };
  }

  // ⭐ FORMATEAR FECHA PARA INPUT DATE (YYYY-MM-DD)
  formatDateForInput(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  // ⭐ OBTENER FECHA ACTUAL DEL SERVIDOR (CACHED)
  async getCurrentServerDate(): Promise<string> {
    const serverTime = await this.syncWithServer();
    return serverTime.currentDate;
  }

  // ⭐ VERIFICAR SI UNA FECHA ES HOY SEGÚN EL SERVIDOR
  async isToday(date: string): Promise<boolean> {
    const serverDate = await this.getCurrentServerDate();
    return date === serverDate;
  }

  // ⭐ OBTENER DIFERENCIA ENTRE CLIENTE Y SERVIDOR
  async getTimeDifference(): Promise<number> {
    try {
      const beforeRequest = Date.now();
      const serverTime = await this.syncWithServer();
      const afterRequest = Date.now();
      
      const networkDelay = (afterRequest - beforeRequest) / 2;
      const serverTimestamp = serverTime.timestamp + networkDelay;
      
      return serverTimestamp - afterRequest;
    } catch (error) {
      console.warn('⚠️ No se pudo calcular diferencia de tiempo');
      return 0;
    }
  }

  // ⭐ SINCRONIZACIÓN AUTOMÁTICA PERIÓDICA
  startAutoSync(): void {
    // Sincronizar inmediatamente
    this.syncWithServer();
    
    // Configurar sincronización periódica
    setInterval(() => {
      this.syncWithServer();
    }, this.syncInterval);
    
    console.log(`🔄 Auto-sincronización iniciada (cada ${this.syncInterval / 1000 / 60} minutos)`);
  }

  // ⭐ FORZAR NUEVA SINCRONIZACIÓN
  async forceSync(): Promise<ServerTimeInfo> {
    this.cachedServerTime = null;
    this.lastSync = 0;
    return await this.syncWithServer();
  }

  // ⭐ OBTENER INFO DE ZONA HORARIA CACHED
  getCachedTimezoneInfo(): ServerTimeInfo | null {
    return this.cachedServerTime;
  }

  // ⭐ VALIDAR CONEXIÓN CON EL SERVIDOR
  async validateConnection(): Promise<boolean> {
    try {
      await api.get('/config/timezone/current', { timeout: 5000 });
      return true;
    } catch (error) {
      return false;
    }
  }

  // ⭐ PARSEAR FECHA CON ZONA HORARIA DE COLOMBIA
  parseColombiaDate(dateString: string): Date {
    // Interpretar fecha en zona horaria de Colombia
    const [year, month, day] = dateString.split('-').map(Number);
    const date = new Date();
    
    // Configurar en zona horaria de Colombia
    date.setFullYear(year, month - 1, day);
    date.setHours(0, 0, 0, 0);
    
    return date;
  }

  // ⭐ FORMATEAR FECHA PARA MOSTRAR
  formatDisplayDate(date: string | Date): string {
    const targetDate = typeof date === 'string' ? this.parseColombiaDate(date) : date;
    
    return targetDate.toLocaleDateString('es-CO', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      timeZone: 'America/Bogota'
    });
  }

  // ⭐ OBTENER ESTADO DE SINCRONIZACIÓN
  getSyncStatus(): {
    isSync: boolean;
    lastSyncAgo: number;
    nextSyncIn: number;
    hasCachedData: boolean;
  } {
    const now = Date.now();
    const lastSyncAgo = now - this.lastSync;
    const nextSyncIn = Math.max(0, this.syncInterval - lastSyncAgo);
    
    return {
      isSync: lastSyncAgo < this.syncInterval,
      lastSyncAgo,
      nextSyncIn,
      hasCachedData: !!this.cachedServerTime
    };
  }
}

export const timezoneService = new TimezoneService();
