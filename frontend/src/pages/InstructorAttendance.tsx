// frontend/src/pages/InstructorAttendance.tsx - VERSIÓN COMPLETA CON EDICIÓN
import React, { useState, useEffect } from 'react';
import { 
  attendanceService, 
  type ClassSchedule, 
  type AttendanceRecord,
  bulkUpdateAttendance,
  type AttendanceUpdateData 
} from '../services/attendanceService';
import { useDateSyncWithServer } from '../hooks/useDateSync';
import Swal from 'sweetalert2';


const InstructorAttendance: React.FC = () => {
  const [schedules, setSchedules] = useState<ClassSchedule[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [pendingChanges, setPendingChanges] = useState<Map<number, AttendanceUpdateData>>(new Map());
  const [showExcuseModal, setShowExcuseModal] = useState<{
    record: AttendanceRecord | null;
    scheduleIndex: number;
    recordIndex: number;
  }>({ record: null, scheduleIndex: -1, recordIndex: -1 });
  const [excuseReason, setExcuseReason] = useState('');
  const [savingChanges, setSavingChanges] = useState(false);
  const [hasNewData, setHasNewData] = useState(false);
  const [previousAttendanceData, setPreviousAttendanceData] = useState<string>('');
  const [isFirstLoad, setIsFirstLoad] = useState(true);
  const [expandedClasses, setExpandedClasses] = useState<Set<number>>(new Set());

  // ⭐ USAR HOOK DE SINCRONIZACIÓN CON SERVIDOR
  const { 
    currentDate, 
    formatDate, 
    refreshDate, 
    isServerSynced, 
    syncStatus,
    forceServerSync 
  } = useDateSyncWithServer();

  // ⭐ ESTADO PARA FECHA SELECCIONADA
  const [selectedDate, setSelectedDate] = useState<string>(currentDate);

  // ⭐ ACTUALIZAR selectedDate cuando currentDate cambie
  useEffect(() => {
    if (currentDate && !selectedDate) {
      setSelectedDate(currentDate);
    }
  }, [currentDate, selectedDate]);

  useEffect(() => {
    if (selectedDate) {
      loadAttendance();
    }
  }, [selectedDate]);

const [autoRefresh, setAutoRefresh] = useState(true);
const [refreshInterval, setRefreshInterval] = useState<number | null>(null);
const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

// ⭐ EFECTO PARA AUTO-REFRESH CADA 30 SEGUNDOS
useEffect(() => {
  if (autoRefresh && selectedDate) {
    const interval = setInterval(() => {
      console.log('🔄 Auto-refresh de asistencia...');
      loadAttendance();
      setLastRefresh(new Date());
    }, 30000); // Cada 30 segundos

    setRefreshInterval(interval);

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  } else {
    if (refreshInterval) {
      clearInterval(refreshInterval);
      setRefreshInterval(null);
    }
  }
}, [autoRefresh, selectedDate]);

// ⭐ FUNCIÓN PARA TOGGLE AUTO-REFRESH
const toggleAutoRefresh = () => {
  setAutoRefresh(!autoRefresh);
  console.log(`🔄 Auto-refresh ${!autoRefresh ? 'activado' : 'desactivado'}`);
};

  // ⭐ CARGAR ASISTENCIA DESDE LA API
  const loadAttendance = async () => {
  try {
    setLoading(true);
    setError('');
    
    console.log(`🔄 Cargando asistencia para fecha: ${selectedDate}`);
    const response = await attendanceService.getMyClassesAttendance(selectedDate);
    
    // ⭐ DEBUG: Verificar si es primera carga
    console.log('🔍 DEBUG - Estado actual:', {
      isFirstLoad,
      hasSchedules: schedules.length > 0,
      hasPreviousData: !!previousAttendanceData,
      responseLength: response.length
    });
    
    // ⭐ DETECTAR CAMBIOS CON MEJOR LOGGING
    if (!isFirstLoad && schedules.length > 0 && previousAttendanceData) {
      console.log('🔍 Comparando datos para detectar cambios...');
      
      // ⭐ DETECTAR NUEVAS LLEGADAS DIRECTAMENTE
      const newArrivals = detectNewArrivals(schedules, response);
      console.log('🔍 Nuevas llegadas detectadas:', newArrivals);
      
      if (newArrivals.length > 0) {
        console.log('🎉 ¡Mostrando notificaciones de llegada!');
        showArrivalNotifications(newArrivals);
        setHasNewData(true);
        setTimeout(() => setHasNewData(false), 3000);
      } else {
        console.log('ℹ️ No se detectaron nuevas llegadas');
      }
      
      setPreviousAttendanceData(JSON.stringify(response));
    } else if (isFirstLoad) {
      // En la primera carga, solo guardar los datos sin notificar
      console.log('📋 Primera carga - guardando datos base');
      setPreviousAttendanceData(JSON.stringify(response));
      setIsFirstLoad(false);
    } else {
      console.log('⚠️ No se pueden detectar cambios - condiciones no cumplidas');
    }
    
    setSchedules(response);
    console.log(`✅ ${response.length} clases cargadas`);
  } catch (err: any) {
    setError(err.response?.data?.message || 'Error al cargar la asistencia');
    console.error('Error loading attendance:', err);
  } finally {
    setLoading(false);
  }
};

// ⭐ FUNCIÓN MEJORADA PARA DETECTAR NUEVAS LLEGADAS CON MÁS DEBUG:

const detectNewArrivals = (oldData: ClassSchedule[], newData: ClassSchedule[]) => {
  console.log('🔍 === INICIANDO DETECCIÓN DE LLEGADAS ===');
  console.log('🔍 Datos antiguos:', oldData.length, 'clases');
  console.log('🔍 Datos nuevos:', newData.length, 'clases');
  
  const arrivals: Array<{
    studentName: string;
    className: string;
    arrivalTime: string;
    status: string;
    isAutomatic: boolean;
  }> = [];
  
  try {
    for (let i = 0; i < Math.min(oldData.length, newData.length); i++) {
      const newClass = newData[i];
      const oldClass = oldData[i];
      
      console.log(`🔍 Comparando clase ${i}: ${newClass.subject}`);
      console.log(`   - Registros antiguos: ${oldClass.records.length}`);
      console.log(`   - Registros nuevos: ${newClass.records.length}`);
      
      for (let j = 0; j < Math.min(oldClass.records.length, newClass.records.length); j++) {
        const newRecord = newClass.records[j];
        const oldRecord = oldClass.records[j];
        
        // ⭐ DEBUG DETALLADO
        console.log(`🔍 Estudiante ${j}: ${newRecord.learnerName}`);
        console.log(`   - Estado anterior: ${oldRecord.status} | Nuevo: ${newRecord.status}`);
        console.log(`   - Hora anterior: ${oldRecord.accessTime} | Nueva: ${newRecord.accessTime}`);
        console.log(`   - Manual anterior: ${oldRecord.isManual} | Nuevo: ${newRecord.isManual}`);
        
        // ⭐ CONDICIONES MEJORADAS PARA DETECTAR LLEGADAS
        const statusChanged = oldRecord.status !== newRecord.status;
        const accessTimeChanged = oldRecord.accessTime !== newRecord.accessTime;
        const becamePresent = (newRecord.status === 'PRESENT' || newRecord.status === 'LATE');
        const wasAbsent = oldRecord.status === 'ABSENT';
        const hasNewAccessTime = newRecord.accessTime && !oldRecord.accessTime;
        
        console.log(`   - ¿Estado cambió? ${statusChanged}`);
        console.log(`   - ¿Hora cambió? ${accessTimeChanged}`);
        console.log(`   - ¿Se volvió presente? ${becamePresent}`);
        console.log(`   - ¿Era ausente? ${wasAbsent}`);
        console.log(`   - ¿Tiene nueva hora? ${hasNewAccessTime}`);
        
        // ⭐ DETECTAR LLEGADA
        if ((statusChanged && becamePresent && wasAbsent) || 
            (hasNewAccessTime && becamePresent) ||
            (accessTimeChanged && newRecord.accessTime)) {
          
          console.log(`✅ ¡LLEGADA DETECTADA! ${newRecord.learnerName}`);
          
          arrivals.push({
            studentName: newRecord.learnerName,
            className: `${newClass.subject} (${newClass.startTime}-${newClass.endTime})`,
            arrivalTime: newRecord.accessTime ? new Date(newRecord.accessTime).toLocaleTimeString('es-CO', {
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit',
              hour12: true
            }) : 'Hora no disponible',
            status: newRecord.status === 'LATE' ? 'TARDE' : 'PRESENTE',
            isAutomatic: !newRecord.isManual
          });
        }
      }
    }
  } catch (error) {
    console.error('❌ Error detectando nuevas llegadas:', error);
  }
  
  console.log(`🔍 === FIN DETECCIÓN - ${arrivals.length} llegadas encontradas ===`);
  return arrivals;
};

// ⭐ FUNCIÓN DE NOTIFICACIONES CON FALLBACK EN CASO DE ERROR:

const showArrivalNotifications = (arrivals: Array<{
  studentName: string;
  className: string;
  arrivalTime: string;
  status: string;
  isAutomatic: boolean;
}>) => {
  console.log(`🎉 Mostrando ${arrivals.length} notificaciones de llegada`);
  
  arrivals.forEach((arrival, index) => {
    setTimeout(() => {
      const isLate = arrival.status === 'TARDE';
      
      console.log(`🔔 Mostrando notificación ${index + 1}:`, arrival);
      
      // ⭐ VERIFICAR QUE SWAL ESTÉ DISPONIBLE
      if (typeof Swal === 'undefined') {
        console.error('❌ SweetAlert2 no está disponible');
        // Fallback: usar alert nativo
        alert(`🎓 ${arrival.studentName} llegó a ${arrival.className} a las ${arrival.arrivalTime} (${arrival.status})`);
        return;
      }
      
      Swal.fire({
        title: `🎓 ${arrival.isAutomatic ? 'Llegada Automática' : 'Llegada Manual'}`,
        html: `
          <div class="text-center">
            <div class="mb-4">
              <div class="w-16 h-16 rounded-full mx-auto ${isLate ? 'bg-yellow-100' : 'bg-green-100'} flex items-center justify-center ${isLate ? 'text-yellow-600' : 'text-green-600'} text-2xl font-bold mb-2 border-4 ${isLate ? 'border-yellow-400' : 'border-green-400'}">
                ${isLate ? '⏰' : '✅'}
              </div>
            </div>
            <h3 class="text-lg font-semibold text-gray-800 mb-2">${arrival.studentName}</h3>
            <p class="text-sm text-gray-600 mb-3">${arrival.className}</p>
            <div class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium mb-3 ${
              isLate 
                ? 'bg-yellow-100 text-yellow-800' 
                : 'bg-green-100 text-green-800'
            }">
              ${isLate ? '⏰ LLEGÓ TARDE' : '✅ LLEGÓ A TIEMPO'}
            </div>
            <p class="text-sm text-gray-500">
              <strong>Hora de llegada:</strong> ${arrival.arrivalTime}
            </p>
            ${arrival.isAutomatic ? 
              '<p class="text-xs text-blue-600 mt-2">📱 Detectado automáticamente por escaneo QR</p>' : 
              '<p class="text-xs text-purple-600 mt-2">✏️ Marcado manualmente por instructor</p>'
            }
          </div>
        `,
        icon: 'success',
        iconColor: isLate ? '#f59e0b' : '#16a34a',
        confirmButtonColor: isLate ? '#f59e0b' : '#16a34a',
        confirmButtonText: 'Entendido',
        timer: 8000,
        timerProgressBar: true,
        toast: true,
        position: 'top-end',
        showCloseButton: true,
        allowOutsideClick: true,
        customClass: {
          popup: 'animate__animated animate__fadeInRight',
          title: isLate ? 'text-yellow-700' : 'text-green-700'
        }
      }).then(() => {
        console.log(`✅ Notificación ${index + 1} mostrada exitosamente`);
      }).catch((error) => {
        console.error(`❌ Error mostrando notificación ${index + 1}:`, error);
      });
    }, index * 500);
  });
  
  // ⭐ SONIDO DE NOTIFICACIÓN MEJORADO
  if (arrivals.length > 0) {
    try {
      // Intentar reproducir sonido
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.value = 800;
      oscillator.type = 'sine';
      gainNode.gain.setValueAtTime(0, audioContext.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.1, audioContext.currentTime + 0.1);
      gainNode.gain.linearRampToValueAtTime(0, audioContext.currentTime + 0.3);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.3);
      
      console.log('🔊 Sonido de notificación reproducido');
    } catch (error) {
      console.log('🔇 No se pudo reproducir sonido de notificación:', error);
    }
  }
};

  const toggleClassExpansion = (scheduleIndex: number) => {
  const newExpanded = new Set(expandedClasses);
  if (newExpanded.has(scheduleIndex)) {
    newExpanded.delete(scheduleIndex);
  } else {
    newExpanded.add(scheduleIndex);
  }
  setExpandedClasses(newExpanded);
};

  // ⭐ FUNCIÓN PARA SINCRONIZAR FECHA
  const handleSyncDate = async () => {
    try {
      await forceServerSync();
      await refreshDate();
      console.log('✅ Fecha sincronizada con el servidor');
    } catch (error) {
      console.error('❌ Error al sincronizar fecha:', error);
    }
  };

  // ⭐ IR A HOY
  const goToToday = async () => {
    try {
      await refreshDate();
      setSelectedDate(currentDate);
    } catch (error) {
      console.error('Error al ir a hoy:', error);
    }
  };

  // ⭐ MANEJAR CAMBIO DE ESTADO
  const handleStatusChange = (scheduleIndex: number, recordIndex: number, newStatus: 'PRESENTE' | 'AUSENTE' | 'TARDE' | 'EXCUSA') => {
    const record = schedules[scheduleIndex].records[recordIndex];
    
    if (newStatus === 'EXCUSA') {
      setShowExcuseModal({ record, scheduleIndex, recordIndex });
      setExcuseReason('');
      return;
    }

    // Actualizar estado local inmediatamente
    const newSchedules = [...schedules];
    newSchedules[scheduleIndex].records[recordIndex].status = getEnglishStatus(newStatus) as any;
    setSchedules(newSchedules);

    // Guardar cambio pendiente
    const newPendingChanges = new Map(pendingChanges);
    newPendingChanges.set(record.attendanceId, {
      attendanceId: record.attendanceId,
      status: newStatus,
      notes: record.notes
    });
    setPendingChanges(newPendingChanges);

    // Recalcular estadísticas
    recalculateStats(scheduleIndex);
  };

  // ⭐ MANEJAR EXCUSA
  const handleExcuseSubmit = () => {
    if (!showExcuseModal.record || !excuseReason.trim()) return;

    const { scheduleIndex, recordIndex } = showExcuseModal;
    const record = showExcuseModal.record;

    // Actualizar estado local
    const newSchedules = [...schedules];
    newSchedules[scheduleIndex].records[recordIndex].status = 'EXCUSED' as any;
    setSchedules(newSchedules);

    // Guardar cambio pendiente
    const newPendingChanges = new Map(pendingChanges);
    newPendingChanges.set(record.attendanceId, {
      attendanceId: record.attendanceId,
      status: 'EXCUSA',
      excuseReason: excuseReason,
      notes: record.notes
    });
    setPendingChanges(newPendingChanges);

    // Recalcular estadísticas
    recalculateStats(scheduleIndex);

    // Cerrar modal
    setShowExcuseModal({ record: null, scheduleIndex: -1, recordIndex: -1 });
    setExcuseReason('');
  };

  // ⭐ RECALCULAR ESTADÍSTICAS
  const recalculateStats = (scheduleIndex: number) => {
    const records = schedules[scheduleIndex].records;
    const total = records.length;
    const present = records.filter(r => r.status === 'PRESENT').length;
    const late = records.filter(r => r.status === 'LATE').length;
    const absent = records.filter(r => r.status === 'ABSENT').length;

    const newSchedules = [...schedules];
    newSchedules[scheduleIndex].attendance = {
      total,
      present,
      late,
      absent,
      percentage: total > 0 ? ((present + late) / total * 100).toFixed(1) : '0.0'
    };
    setSchedules(newSchedules);
  };

  // ⭐ GUARDAR TODOS LOS CAMBIOS
  const saveAllChanges = async () => {
    if (pendingChanges.size === 0) return;

    setSavingChanges(true);
    try {
      // Preparar datos para enviar a la API
      const updates = Array.from(pendingChanges.values());

      // Enviar a la API
      await bulkUpdateAttendance(updates);
      
      // Limpiar cambios pendientes
      setPendingChanges(new Map());
      
      // Recargar datos
      await loadAttendance();
      
      console.log('✅ Cambios guardados exitosamente');
    } catch (error) {
      console.error('❌ Error al guardar cambios:', error);
      setError('Error al guardar los cambios');
    } finally {
      setSavingChanges(false);
    }
  };

  // ⭐ MARCAR TODOS COMO PRESENTES
  const markAllAsPresent = async (scheduleIndex: number) => {
    try {
      const schedule = schedules[scheduleIndex];
      const newPendingChanges = new Map(pendingChanges);

      // Actualizar estado local
      const newSchedules = [...schedules];
      schedule.records.forEach((record, recordIndex) => {
        newSchedules[scheduleIndex].records[recordIndex].status = 'PRESENT' as any;
        newPendingChanges.set(record.attendanceId, {
          attendanceId: record.attendanceId,
          status: 'PRESENTE',
          notes: 'Marcado masivamente como presente'
        });
      });

      setSchedules(newSchedules);
      setPendingChanges(newPendingChanges);
      recalculateStats(scheduleIndex);
      
      console.log('✅ Todos marcados como presentes localmente');
    } catch (error) {
      console.error('❌ Error al marcar todos como presentes:', error);
      setError('Error al marcar todos como presentes');
    }
  };

  // ⭐ FUNCIONES DE UTILIDAD
  const getStatusBadge = (status: string) => {
    const baseClasses = "px-2 py-1 rounded-full text-xs font-medium";
    
    switch (status) {
      case 'PRESENT':
        return `${baseClasses} bg-green-100 text-green-800`;
      case 'LATE':
        return `${baseClasses} bg-yellow-100 text-yellow-800`;
      case 'ABSENT':
        return `${baseClasses} bg-red-100 text-red-800`;
      case 'EXCUSED':
        return `${baseClasses} bg-blue-100 text-blue-800`;
      default:
        return `${baseClasses} bg-gray-100 text-gray-800`;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'PRESENT':
        return 'Presente';
      case 'LATE':
        return 'Tarde';
      case 'ABSENT':
        return 'Ausente';
      case 'EXCUSED':
        return 'Excusa';
      default:
        return status;
    }
  };

  const getSpanishStatus = (status: string): 'PRESENTE' | 'AUSENTE' | 'TARDE' | 'EXCUSA' => {
    switch (status) {
      case 'PRESENT':
        return 'PRESENTE';
      case 'LATE':
        return 'TARDE';
      case 'ABSENT':
        return 'AUSENTE';
      case 'EXCUSED':
        return 'EXCUSA';
      default:
        return 'AUSENTE';
    }
  };

  const getEnglishStatus = (status: 'PRESENTE' | 'AUSENTE' | 'TARDE' | 'EXCUSA'): 'PRESENT' | 'LATE' | 'ABSENT' | 'EXCUSED' => {
    switch (status) {
      case 'PRESENTE':
        return 'PRESENT';
      case 'TARDE':
        return 'LATE';
      case 'AUSENTE':
        return 'ABSENT';
      case 'EXCUSA':
        return 'EXCUSED';
      default:
        return 'ABSENT';
    }
  };

  const formatTime = (timeString: string | null) => {
    if (!timeString) return 'N/A';
    
    try {
      const date = new Date(timeString);
      return date.toLocaleTimeString('es-CO', {
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'America/Bogota'
      });
    } catch {
      return 'N/A';
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Header - MANTENER IGUAL */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Control de Asistencia
          </h1>
          <p className="text-gray-600">
            Gestiona la asistencia de tus clases y aprendices
          </p>
        </div>

        {/* ⭐ AGREGAR NOTIFICACIÓN AQUÍ - JUSTO DESPUÉS DEL HEADER */}
        {hasNewData && (
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-blue-400 animate-pulse" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-blue-700">
                  <strong>¡Datos actualizados!</strong> Se han detectaron cambios en la asistencia.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Barra de herramientas - MODIFICAR ESTA SECCIÓN */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {/* MANTENER: controles de fecha existentes */}
              <label htmlFor="date" className="text-sm font-medium text-gray-700">
                Fecha:
              </label>
              <input
                type="date"
                id="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={goToToday}
                className="px-3 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 text-sm font-medium"
              >
                Hoy
              </button>
              <button
                onClick={loadAttendance}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm font-medium"
              >
                Actualizar
              </button>
            </div>

            {/* Información de sincronización y botones de acción - MODIFICAR ESTA PARTE */}
            <div className="flex items-center gap-3">
              {/* Estado de sincronización - MANTENER */}
              <div className="flex items-center gap-2 text-sm">
                <div className={`w-2 h-2 rounded-full ${isServerSynced ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
                <span className="text-gray-600">{syncStatus}</span>
                <button
                  onClick={handleSyncDate}
                  className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded transition-colors"
                  title="Sincronizar con servidor"
                >
                  🔄
                </button>
              </div>

              {/* ⭐ AGREGAR CONTROLES DE AUTO-REFRESH AQUÍ */}
              <div className="flex items-center gap-2 text-sm border-l pl-3">
                <button
                  onClick={toggleAutoRefresh}
                  className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                    autoRefresh 
                      ? 'bg-green-100 text-green-700 hover:bg-green-200' 
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                  title={autoRefresh ? 'Desactivar actualización automática' : 'Activar actualización automática'}
                >
                  {autoRefresh ? '🔄 Auto-refresh ON' : '⏸️ Auto-refresh OFF'}
                </button>
                {autoRefresh && (
                  <span className="text-xs text-gray-500">
                    Última: {lastRefresh.toLocaleTimeString('es-CO', { 
                      hour: '2-digit', 
                      minute: '2-digit',
                      second: '2-digit'
                    })}
                  </span>
                )}
              </div>

              {/* Cambios pendientes - MANTENER IGUAL */}
              {pendingChanges.size > 0 && (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-amber-600 font-medium">
                    {pendingChanges.size} cambio(s) pendiente(s)
                  </span>
                  <button
                    onClick={saveAllChanges}
                    disabled={savingChanges}
                    className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm font-medium disabled:opacity-50"
                  >
                    {savingChanges ? 'Guardando...' : 'Guardar Cambios'}
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Advertencia si no está sincronizado - MANTENER IGUAL */}
          {!isServerSynced && (
            <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded text-sm text-yellow-800">
              ⚠️ Usando fecha local. La sincronización con el servidor no está disponible.
            </div>
          )}
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
            <div className="flex">
              <div className="text-red-800">
                <p className="text-sm font-medium">Error:</p>
                <p className="text-sm">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Lista de clases */}
{schedules.length === 0 ? (
  <div className="bg-white rounded-lg shadow-sm p-8 text-center">
    <div className="text-gray-400 mb-4">
      <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
      </svg>
    </div>
    <h3 className="text-lg font-medium text-gray-900 mb-2">
      No hay clases programadas
    </h3>
    <p className="text-gray-500">
      No se encontraron clases para el {formatDate(selectedDate)}.
    </p>
  </div>
) : (
  <div className="space-y-6">
    {schedules.map((schedule, scheduleIndex) => {
      const isExpanded = expandedClasses.has(scheduleIndex);
      
      return (
        <div key={schedule.scheduleId} className="bg-white rounded-lg shadow-sm overflow-hidden">
          {/* Header clickeable de la clase */}
          <div 
            className="bg-gray-50 px-6 py-4 border-b border-gray-200 cursor-pointer hover:bg-gray-100"
            onClick={() => toggleClassExpansion(scheduleIndex)}
          >
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-3">
                {/* Icono de expansión */}
                <svg 
                  className={`w-5 h-5 text-gray-500 transition-transform ${isExpanded ? 'transform rotate-90' : ''}`}
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
                
                {/* Información de la clase */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    {schedule.subject} - {schedule.startTime} a {schedule.endTime}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {schedule.classroom && `Aula: ${schedule.classroom}`}
                    {schedule.ficha?.code && schedule.ficha?.name && ` | Ficha: ${schedule.ficha.code} - ${schedule.ficha.name}`}
                  </p>
                </div>
              </div>
              
              {/* Estadísticas */}
              <div className="flex items-center gap-4">
                <div className="text-sm">
                  <span className="text-green-600 font-medium">Presentes: {schedule.attendance.present}</span>
                  <span className="text-yellow-600 font-medium ml-3">Tarde: {schedule.attendance.late}</span>
                  <span className="text-red-600 font-medium ml-3">Ausentes: {schedule.attendance.absent}</span>
                  <span className="text-gray-600 font-medium ml-3">Total: {schedule.attendance.total}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Contenido desplegable */}
          {isExpanded && (
            <div>
              {/* Barra de herramientas */}
              <div className="px-6 py-3 bg-gray-50 border-b border-gray-200">
                <div className="flex justify-end">
                  <button
                    onClick={() => markAllAsPresent(scheduleIndex)}
                    className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"
                  >
                    Marcar Todos Presentes
                  </button>
                </div>
              </div>

              {/* Tabla de asistencia */}
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Aprendiz
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Estado
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Hora de Acceso
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Acciones Rápidas
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Tipo
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {schedule.records.map((record, recordIndex) => (
                      <tr key={record.attendanceId} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {record.learnerName || 'Sin nombre'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <select
                            value={getSpanishStatus(record.status)}
                            onChange={(e) => handleStatusChange(scheduleIndex, recordIndex, e.target.value as any)}
                            className="text-sm rounded-md border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                          >
                            <option value="AUSENTE">Ausente</option>
                            <option value="PRESENTE">Presente</option>
                            <option value="TARDE">Tarde</option>
                            <option value="EXCUSA">Excusa</option>
                          </select>
                          <div className="mt-1">
                            <span className={getStatusBadge(record.status)}>
                              {getStatusText(record.status)}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatTime(record.accessTime)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex gap-1">
                            <button
                              onClick={() => handleStatusChange(scheduleIndex, recordIndex, 'PRESENTE')}
                              className="px-2 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700 transition-colors"
                              title="Marcar como Presente"
                            >
                              ✓
                            </button>
                            <button
                              onClick={() => handleStatusChange(scheduleIndex, recordIndex, 'TARDE')}
                              className="px-2 py-1 bg-yellow-600 text-white rounded text-xs hover:bg-yellow-700 transition-colors"
                              title="Marcar como Tarde"
                            >
                              ⏰
                            </button>
                            <button
                              onClick={() => handleStatusChange(scheduleIndex, recordIndex, 'AUSENTE')}
                              className="px-2 py-1 bg-red-600 text-white rounded text-xs hover:bg-red-700 transition-colors"
                              title="Marcar como Ausente"
                            >
                              ✗
                            </button>
                            <button
                              onClick={() => handleStatusChange(scheduleIndex, recordIndex, 'EXCUSA')}
                              className="px-2 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700 transition-colors"
                              title="Marcar Excusa"
                            >
                              📝
                            </button>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            record.isManual 
                              ? 'bg-blue-100 text-blue-800' 
                              : 'bg-green-100 text-green-800'
                          }`}>
                            {record.isManual ? 'Manual' : 'Automático'}
                          </span>
                          {pendingChanges.has(record.attendanceId) && (
                            <div className="mt-1">
                              <span className="px-2 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                                Pendiente
                              </span>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Footer con estadísticas */}
              {schedule.records.length > 0 && (
                <div className="bg-gray-50 px-6 py-3 border-t border-gray-200">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-600">
                      {schedule.attendance.total} aprendices registrados
                    </span>
                    <span className="text-gray-600">
                      Asistencia: {schedule.attendance.percentage}%
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      );
    })}
  </div>
)}

        {/* Modal para excusas */}
        {showExcuseModal.record && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Marcar Excusa - {showExcuseModal.record.learnerName}
              </h3>
              
              <div className="mb-4">
                <label htmlFor="excuseReason" className="block text-sm font-medium text-gray-700 mb-2">
                  Motivo de la excusa:
                </label>
                <textarea
                  id="excuseReason"
                  value={excuseReason}
                  onChange={(e) => setExcuseReason(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  placeholder="Ingrese el motivo de la excusa..."
                />
              </div>
              
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setShowExcuseModal({ record: null, scheduleIndex: -1, recordIndex: -1 })}
                  className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleExcuseSubmit}
                  disabled={!excuseReason.trim()}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  Guardar Excusa
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default InstructorAttendance;