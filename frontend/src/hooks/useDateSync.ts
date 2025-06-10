
// ⭐ HOOK MEJORADO QUE USA EL SERVICIO DE SINCRONIZACIÓN
// frontend/src/hooks/useDateSync.ts - VERSIÓN ACTUALIZADA
import { useState, useEffect, useCallback } from 'react';
import { timezoneService } from '../services/timezoneService';

interface UseDateSyncReturn {
  currentDate: string;
  currentDateTime: Date;
  localDateString: string;
  isToday: (date: string) => Promise<boolean>;
  formatDate: (date: string | Date) => string;
  getDateForApi: (date?: Date) => string;
  refreshDate: () => Promise<void>;
  timezone: string;
  isServerSynced: boolean;
  lastSync: Date | null;
  syncStatus: string;
  forceServerSync: () => Promise<void>;
}

export const useDateSyncWithServer = (): UseDateSyncReturn => {
  const [currentDateTime, setCurrentDateTime] = useState<Date>(new Date());
  const [isServerSynced, setIsServerSynced] = useState(false);
  const [lastSync, setLastSync] = useState<Date | null>(null);
  const [syncStatus, setSyncStatus] = useState('Iniciando...');

  // ⭐ SINCRONIZAR CON SERVIDOR
  const syncWithServer = useCallback(async () => {
    try {
      setSyncStatus('Sincronizando...');
      
      const colombiaTime = await timezoneService.getColombiaTime();
      const serverDate = new Date(colombiaTime.iso);
      
      setCurrentDateTime(serverDate);
      setIsServerSynced(true);
      setLastSync(new Date());
      setSyncStatus('Sincronizado');
      
      console.log('✅ Fecha sincronizada con servidor:', {
        serverDate: colombiaTime.date,
        serverTime: colombiaTime.time
      });
      
    } catch (error) {
      console.error('❌ Error en sincronización:', error);
      
      // Fallback a tiempo local
      const localTime = new Date();
      setCurrentDateTime(localTime);
      setIsServerSynced(false);
      setSyncStatus('Tiempo local');
    }
  }, []);

  // ⭐ INICIALIZAR Y AUTO-SYNC
  useEffect(() => {
    // Sincronizar inmediatamente
    syncWithServer();
    
    // Auto-sincronización cada 5 minutos
    const interval = setInterval(syncWithServer, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, [syncWithServer]);

  // ⭐ FUNCIONES AUXILIARES
  const getDateForApi = useCallback((date?: Date): string => {
    const targetDate = date || currentDateTime;
    return timezoneService.formatDateForInput(targetDate);
  }, [currentDateTime]);

  const formatDate = useCallback((date: string | Date): string => {
    return timezoneService.formatDisplayDate(date);
  }, []);

  const isToday = useCallback(async (date: string): Promise<boolean> => {
    if (isServerSynced) {
      return await timezoneService.isToday(date);
    } else {
      // Fallback a comparación local
      const today = getDateForApi();
      return date === today;
    }
  }, [isServerSynced, getDateForApi]);

  const refreshDate = useCallback(async () => {
    await syncWithServer();
  }, [syncWithServer]);

  const forceServerSync = useCallback(async () => {
    await timezoneService.forceSync();
    await syncWithServer();
  }, [syncWithServer]);

  return {
    currentDate: getDateForApi(),
    currentDateTime,
    localDateString: formatDate(currentDateTime),
    isToday,
    formatDate,
    getDateForApi,
    refreshDate,
    timezone: 'America/Bogota',
    isServerSynced,
    lastSync,
    syncStatus,
    forceServerSync
  };
};