// frontend/src/pages/MyClasses.tsx - COMPLETAMENTE FUNCIONAL CON DATOS REALES
import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { learnerService } from '../services/learnerService';
import { useDateSyncWithServer } from '../hooks/useDateSync';
import  { 
  showProcessingAlert, 
  hideProcessingAlert, 
  showQuickToast, 
  handleApiError 
} from '../utils/sweetAlertUtils';

interface LearnerClassSchedule {
  scheduleId: number;
  subject: string;
  instructor: {
    firstName: string;
    lastName: string;
  };
  startTime: string;
  endTime: string;
  classroom: string;
  ficha: {
    code: string;
    name: string;
  };
  competence: {
    name: string;
  };
  attendance?: {
    attendanceId: number;
    status: 'PRESENT' | 'LATE' | 'ABSENT' | 'EXCUSED';
    accessTime: string | null;
    isManual: boolean;
    notes?: string;
  };
}

interface WeeklyStats {
  totalClasses: number;
  presentClasses: number;
  lateClasses: number;
  absentClasses: number;
  attendancePercentage: number;
}

const MyClasses = () => {
  const { user } = useAuth();
  const [classes, setClasses] = useState<LearnerClassSchedule[]>([]);
  const [selectedDate, setSelectedDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [weeklyStats, setWeeklyStats] = useState<WeeklyStats | null>(null);

  // ⭐ USAR HOOK DE SINCRONIZACIÓN CON SERVIDOR
  const { 
    currentDate, 
    formatDate, 
    refreshDate, 
    isServerSynced, 
    syncStatus 
  } = useDateSyncWithServer();

  // ⭐ INICIALIZAR selectedDate con currentDate
  useEffect(() => {
    if (currentDate && !selectedDate) {
      setSelectedDate(currentDate);
    }
  }, [currentDate, selectedDate]);

  useEffect(() => {
    if (selectedDate) {
      fetchMyClasses();
    }
  }, [selectedDate]);

  useEffect(() => {
    if (currentDate) {
      loadWeeklyStats();
    }
  }, [currentWeek, currentDate]);

  const fetchMyClasses = async () => {
    if (!selectedDate) return;
    
    setLoading(true);
    try {
      console.log(`🔄 Cargando clases para fecha: ${selectedDate}`);
      
      // ⭐ LLAMAR AL SERVICIO REAL
      const data = await learnerService.getMyClassesForDate(selectedDate);
      setClasses(data);
      
      console.log(`✅ ${data.length} clases cargadas para ${selectedDate}`);
    } catch (error) {
      console.error('Error al cargar clases:', error);
      handleApiError(error, 'No se pudieron cargar tus clases');
      setClasses([]);
    } finally {
      setLoading(false);
    }
  };

  const loadWeeklyStats = async () => {
    if (!currentDate) return;
    
    
    try {
      const weekStart = getWeekStart(currentWeek);
      const weekEnd = getWeekEnd(currentWeek);
      
      console.log(`📊 Cargando estadísticas semanales: ${weekStart} - ${weekEnd}`);
      
      const stats = await learnerService.getWeeklyAttendanceStats(
        weekStart.toISOString().split('T')[0],
        weekEnd.toISOString().split('T')[0]
      );
      
      setWeeklyStats(stats);
      console.log('✅ Estadísticas semanales cargadas:', stats);
    } catch (error) {
      console.error('Error cargando estadísticas:', error);
      // No mostrar error para estadísticas, solo log
      setWeeklyStats(null);
    } finally {
      
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PRESENT': return 'bg-green-100 text-green-800 border-green-200';
      case 'LATE': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'ABSENT': return 'bg-red-100 text-red-800 border-red-200';
      case 'EXCUSED': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'PRESENT': return '✅ Presente';
      case 'LATE': return '⏰ Tarde';
      case 'ABSENT': return '❌ Ausente';
      case 'EXCUSED': return '📝 Excusa';
      default: return '⏳ Pendiente';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PRESENT': return '✅';
      case 'LATE': return '⏰';
      case 'ABSENT': return '❌';
      case 'EXCUSED': return '📝';
      default: return '⏳';
    }
  };

  const getWeekStart = (date: Date) => {
    const start = new Date(date);
    start.setDate(start.getDate() - start.getDay() + 1); // Lunes
    return start;
  };

  const getWeekEnd = (date: Date) => {
    const end = new Date(date);
    end.setDate(end.getDate() - end.getDay() + 6); // Domingo
    return end;
  };

  const getWeekDays = () => {
    const start = getWeekStart(currentWeek);
    const days = [];
    
    for (let i = 0; i < 6; i++) { // Solo lunes a sábado
      const day = new Date(start);
      day.setDate(start.getDate() + i);
      days.push(day);
    }
    return days;
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
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
      return timeString;
    }
  };

  const refreshCurrentDate = async () => {
    try {
      showProcessingAlert('Actualizando', 'Sincronizando fecha con el servidor...');
      await refreshDate();
      setSelectedDate(currentDate);
      await fetchMyClasses();
      hideProcessingAlert();
      showQuickToast('Fecha actualizada', 'success');
    } catch (error) {
      hideProcessingAlert();
      handleApiError(error, 'No se pudo actualizar la fecha');
    }
  };

  const goToToday = async () => {
    try {
      await refreshDate();
      setCurrentWeek(new Date());
      setSelectedDate(currentDate);
    } catch (error) {
      console.error('Error al ir a hoy:', error);
    }
  };

  if (!user?.profile) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-700">No se pudo cargar la información del perfil</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold text-gray-800">📚 Mis Clases</h1>
          <p className="text-gray-600 mt-1">Consulta tus horarios y asistencia</p>
        </div>
        
        {/* ⭐ CONTROLES DE FECHA */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-sm">
            <div className={`w-2 h-2 rounded-full ${isServerSynced ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
            <span className="text-gray-600">{syncStatus}</span>
          </div>
          <button
            onClick={refreshCurrentDate}
            className="btn-secondary text-sm"
            title="Actualizar fecha"
          >
            🔄 Actualizar
          </button>
        </div>
      </div>

      {/* ⭐ INFORMACIÓN DEL APRENDIZ MEJORADA */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg shadow p-6 border border-blue-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white text-xl font-bold shadow-lg">
              {user.profile.firstName?.charAt(0)}{user.profile.lastName?.charAt(0)}
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-800">
                {user.profile.firstName} {user.profile.lastName}
              </h2>
              <p className="text-blue-600 font-medium">
                Ficha: {user.profile.ficha?.code || 'Sin asignar'}
              </p>
              <p className="text-sm text-gray-600">{user.profile.ficha?.name}</p>
            </div>
          </div>
          
          {/* ⭐ ESTADÍSTICAS RÁPIDAS */}
          {weeklyStats && (
            <div className="text-right">
              <div className="text-sm text-gray-600 mb-1">Asistencia Semanal</div>
              <div className="text-2xl font-bold text-blue-600">
                {weeklyStats.attendancePercentage.toFixed(1)}%
              </div>
              <div className="text-xs text-gray-500">
                {weeklyStats.presentClasses + weeklyStats.lateClasses} de {weeklyStats.totalClasses} clases
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ⭐ ESTADÍSTICAS SEMANALES DETALLADAS */}
      {weeklyStats && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            📊 Resumen de la Semana
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-3 bg-green-50 rounded-lg border border-green-200">
              <div className="text-2xl font-bold text-green-600">{weeklyStats.presentClasses}</div>
              <div className="text-sm text-green-700">Presente</div>
            </div>
            <div className="text-center p-3 bg-yellow-50 rounded-lg border border-yellow-200">
              <div className="text-2xl font-bold text-yellow-600">{weeklyStats.lateClasses}</div>
              <div className="text-sm text-yellow-700">Tarde</div>
            </div>
            <div className="text-center p-3 bg-red-50 rounded-lg border border-red-200">
              <div className="text-2xl font-bold text-red-600">{weeklyStats.absentClasses}</div>
              <div className="text-sm text-red-700">Ausente</div>
            </div>
            <div className="text-center p-3 bg-blue-50 rounded-lg border border-blue-200">
              <div className="text-2xl font-bold text-blue-600">{weeklyStats.totalClasses}</div>
              <div className="text-sm text-blue-700">Total</div>
            </div>
          </div>
        </div>
      )}

      {/* Navegación por semana */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-800">Seleccionar fecha</h3>
          <div className="flex space-x-2">
            <button
              onClick={() => {
                const prevWeek = new Date(currentWeek);
                prevWeek.setDate(prevWeek.getDate() - 7);
                setCurrentWeek(prevWeek);
              }}
              className="btn-secondary"
            >
              ← Semana anterior
            </button>
            <button
              onClick={goToToday}
              className="btn-primary"
            >
              Hoy
            </button>
            <button
              onClick={() => {
                const nextWeek = new Date(currentWeek);
                nextWeek.setDate(nextWeek.getDate() + 7);
                setCurrentWeek(nextWeek);
              }}
              className="btn-secondary"
            >
              Siguiente semana →
            </button>
          </div>
        </div>

        <div className="grid grid-cols-6 gap-2">
          {getWeekDays().map((day, index) => (
            <button
              key={index}
              onClick={() => setSelectedDate(day.toISOString().split('T')[0])}
              className={`p-3 text-center rounded-lg transition-colors ${
                selectedDate === day.toISOString().split('T')[0]
                  ? 'bg-sena-green text-white shadow-lg'
                  : isToday(day)
                  ? 'bg-blue-100 text-blue-800 border-2 border-blue-300'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <div className="text-xs font-medium">
                {day.toLocaleDateString('es-CO', { weekday: 'short' })}
              </div>
              <div className="text-lg font-bold">
                {day.getDate()}
              </div>
              <div className="text-xs">
                {day.toLocaleDateString('es-CO', { month: 'short' })}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* ⭐ CLASES DEL DÍA MEJORADAS */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold text-gray-800">
              📅 Clases del {formatDate(selectedDate)}
            </h3>
            {!isServerSynced && (
              <div className="text-xs text-yellow-600 bg-yellow-50 px-2 py-1 rounded">
                ⚠️ Usando fecha local
              </div>
            )}
          </div>
        </div>

        <div className="p-6">
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-sena-green mx-auto"></div>
              <p className="text-gray-500 mt-2">Cargando clases...</p>
            </div>
          ) : classes.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-gray-400 mb-4">
                <svg className="mx-auto h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No hay clases programadas</h3>
              <p className="text-gray-500">No tienes clases programadas para esta fecha</p>
            </div>
          ) : (
            <div className="space-y-4">
              {classes.map((classItem) => (
                <div key={classItem.scheduleId} className="border rounded-lg p-6 hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="text-xl font-semibold text-gray-900">{classItem.subject}</h4>
                        {classItem.attendance && (
                          <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full border ${getStatusColor(classItem.attendance.status)}`}>
                            {getStatusText(classItem.attendance.status)}
                          </span>
                        )}
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex items-center text-gray-600">
                          <span className="text-lg mr-2">👨‍🏫</span>
                          <span>{classItem.instructor.firstName} {classItem.instructor.lastName}</span>
                        </div>
                        
                        <div className="flex items-center text-gray-600">
                          <span className="text-lg mr-2">📚</span>
                          <span>{classItem.competence.name}</span>
                        </div>
                        
                        <div className="flex items-center space-x-6 text-gray-600">
                          <div className="flex items-center">
                            <span className="text-lg mr-2">🕒</span>
                            <span>{classItem.startTime} - {classItem.endTime}</span>
                          </div>
                          
                          <div className="flex items-center">
                            <span className="text-lg mr-2">📍</span>
                            <span>{classItem.classroom}</span>
                          </div>
                        </div>
                        
                        {/* ⭐ INFORMACIÓN DE ASISTENCIA DETALLADA */}
                        {classItem.attendance && (
                          <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                            <div className="text-sm text-gray-600">
                              <div className="flex items-center justify-between">
                                <span>
                                  <strong>Estado:</strong> {getStatusIcon(classItem.attendance.status)} {getStatusText(classItem.attendance.status)}
                                </span>
                                {classItem.attendance.accessTime && (
                                  <span>
                                    <strong>Hora de llegada:</strong> {formatTime(classItem.attendance.accessTime)}
                                  </span>
                                )}
                              </div>
                              
                              <div className="mt-2 text-xs">
                                <span className={`px-2 py-1 rounded-full ${
                                  classItem.attendance.isManual 
                                    ? 'bg-blue-100 text-blue-700' 
                                    : 'bg-green-100 text-green-700'
                                }`}>
                                  {classItem.attendance.isManual ? '✏️ Marcado manualmente' : '📱 Registrado automáticamente'}
                                </span>
                              </div>
                              
                              {classItem.attendance.notes && (
                                <div className="mt-2">
                                  <strong>Observaciones:</strong> {classItem.attendance.notes}
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Información adicional */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-medium text-blue-800 mb-2">💡 Información sobre asistencia:</h3>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• ✅ <strong>Presente:</strong> Llegaste a tiempo o antes del inicio de clase</li>
          <li>• ⏰ <strong>Tarde:</strong> Llegaste dentro de los 20 minutos de tolerancia</li>
          <li>• ❌ <strong>Ausente:</strong> No registraste entrada o llegaste muy tarde</li>
          <li>• 📝 <strong>Excusa:</strong> Tu instructor registró una excusa válida</li>
          <li>• Tu asistencia se marca automáticamente al registrar entrada con tu código QR</li>
          <li>• Si tienes dudas sobre tu asistencia, consulta con tu instructor</li>
          <li>• Las estadísticas se actualizan en tiempo real</li>
        </ul>
      </div>
    </div>
  );
};

export default MyClasses;