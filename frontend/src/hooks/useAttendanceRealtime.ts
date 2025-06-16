// hooks/useAttendanceRealtime.ts
import { useState, useEffect, useCallback, useRef } from 'react';
import { attendanceService } from '../services/attendanceService';
import type { ClassSchedule } from '../services/attendanceService';

interface UseAttendanceRealtimeOptions {
    autoRefreshInterval?: number; // en milisegundos
    enableAutoRefresh?: boolean;
}

interface UseAttendanceRealtimeReturn {
    classes: ClassSchedule[];
    selectedClass: ClassSchedule | null;
    loading: boolean;
    error: string | null;
    lastUpdate: Date;
    autoRefresh: boolean;

    // Funciones
    setSelectedClass: (classItem: ClassSchedule | null) => void;
    fetchAttendance: (showLoading?: boolean) => Promise<void>;
    toggleAutoRefresh: () => void;
    setAutoRefresh: (enabled: boolean) => void;
    markAttendance: (learnerId: number, status: 'PRESENT' | 'LATE' | 'ABSENT', notes?: string) => Promise<void>;

    // Estados adicionales
    refreshCount: number;
    isOnline: boolean;
}

export const useAttendanceRealtime = (
    selectedDate: string,
    options: UseAttendanceRealtimeOptions = {}
): UseAttendanceRealtimeReturn => {
    const {
        autoRefreshInterval = 30000, // 30 segundos por defecto
        enableAutoRefresh = true
    } = options;

    // Estados principales
    const [classes, setClasses] = useState<ClassSchedule[]>([]);
    const [selectedClass, setSelectedClass] = useState<ClassSchedule | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
    const [autoRefresh, setAutoRefresh] = useState(enableAutoRefresh);
    const [refreshCount, setRefreshCount] = useState(0);
    const [isOnline, setIsOnline] = useState(navigator.onLine);

    // Referencias para intervals y cleanup
    const refreshIntervalRef = useRef<number | null>(null);
    const lastRefreshTimeRef = useRef<number>(Date.now());

    // ⭐ DETECTAR CAMBIOS DE CONECTIVIDAD
    useEffect(() => {
        const handleOnline = () => {
            setIsOnline(true);
            if (autoRefresh) {
                fetchAttendance(false); // Refresh al reconectar
            }
        };

        const handleOffline = () => {
            setIsOnline(false);
            setError('Sin conexión a internet');
        };

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, [autoRefresh]);

    // ⭐ FUNCIÓN PRINCIPAL DE FETCH
    const fetchAttendance = useCallback(async (showLoading = true) => {
        // Evitar requests muy frecuentes
        const now = Date.now();
        if (now - lastRefreshTimeRef.current < 5000) { // Mínimo 5 segundos entre requests
            return;
        }
        lastRefreshTimeRef.current = now;

        try {
            if (showLoading) setLoading(true);
            setError(null);

            const data = await attendanceService.getMyClassesAttendance(selectedDate);
            setClasses(data);
            setLastUpdate(new Date());
            setRefreshCount(prev => prev + 1);

            // Si hay una clase seleccionada, actualizarla
            if (selectedClass) {
                const updatedClass = data.find(c => c.id === selectedClass.id);
                if (updatedClass) {
                    setSelectedClass(updatedClass);
                }
            }

            console.log(`✅ Asistencia actualizada: ${data.length} clases cargadas`);

        } catch (error: any) {
            console.error('❌ Error al cargar asistencia:', error);
            setError(error.response?.data?.message || 'Error al cargar asistencia');

            // Si es un error de red, no mostrar alerta si es refresh automático
            if (!showLoading && error.code === 'NETWORK_ERROR') {
                return;
            }
        } finally {
            if (showLoading) setLoading(false);
        }
    }, [selectedDate, selectedClass]);

    // ⭐ EFECTO PRINCIPAL PARA CARGAR DATOS
    useEffect(() => {
        fetchAttendance(true);
    }, [selectedDate]);

    // ⭐ SETUP DEL AUTO-REFRESH
    useEffect(() => {
        if (autoRefresh && isOnline) {
            refreshIntervalRef.current = setInterval(() => {
                fetchAttendance(false);
            }, autoRefreshInterval);

            console.log(`🔄 Auto-refresh activado cada ${autoRefreshInterval / 1000}s`);

            return () => {
                if (refreshIntervalRef.current) {
                    clearInterval(refreshIntervalRef.current);
                    refreshIntervalRef.current = null;
                }
            };
        } else {
            if (refreshIntervalRef.current) {
                clearInterval(refreshIntervalRef.current);
                refreshIntervalRef.current = null;
                console.log('⏸️ Auto-refresh desactivado');
            }
        }
    }, [autoRefresh, isOnline, autoRefreshInterval, fetchAttendance]);

    // ⭐ CLEANUP AL DESMONTAR
    useEffect(() => {
        return () => {
            if (refreshIntervalRef.current) {
                clearInterval(refreshIntervalRef.current);
            }
        };
    }, []);

    // ⭐ FUNCIÓN PARA TOGGLE AUTO-REFRESH
    const toggleAutoRefresh = useCallback(() => {
        setAutoRefresh(prev => !prev);
    }, []);

    // ⭐ FUNCIÓN PARA MARCAR ASISTENCIA
    const markAttendance = useCallback(async (
        learnerId: number,
        status: 'PRESENT' | 'LATE' | 'ABSENT',
        notes?: string
    ) => {
        if (!selectedClass) {
            throw new Error('No hay clase seleccionada');
        }

        // Mapeo de status al formato esperado por el backend
        const statusMap: Record<'PRESENT' | 'LATE' | 'ABSENT', 'PRESENTE' | 'TARDE' | 'AUSENTE'> = {
            PRESENT: 'PRESENTE',
            LATE: 'TARDE',
            ABSENT: 'AUSENTE',
        };

        try {
            await attendanceService.markAttendance({
                scheduleId: selectedClass.id,
                profileId: learnerId, // Cambiado de learnerId a profileId
                status: statusMap[status],
                notes
            });

            // Refresh inmediato después de marcar
            await fetchAttendance(false);

            console.log(`✅ Asistencia marcada: ${status} para learner ${learnerId}`);

        } catch (error: any) {
            console.error('❌ Error al marcar asistencia:', error);
            throw error;
        }
    }, [selectedClass, fetchAttendance]);

    // ⭐ FUNCIÓN PARA SELECCIONAR CLASE
    const handleSetSelectedClass = useCallback((classItem: ClassSchedule | null) => {
        setSelectedClass(classItem);

        // Si se selecciona una clase, hacer refresh inmediato para tener datos actualizados
        if (classItem) {
            fetchAttendance(false);
        }
    }, [fetchAttendance]);

    return {
        classes,
        selectedClass,
        loading,
        error,
        lastUpdate,
        autoRefresh,
        refreshCount,
        isOnline,

        // Funciones
        setSelectedClass: handleSetSelectedClass,
        fetchAttendance,
        toggleAutoRefresh,
        setAutoRefresh,
        markAttendance
    };
};