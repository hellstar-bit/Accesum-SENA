// frontend/src/pages/MyClasses.tsx - VERSIÓN RESPONSIVE MEJORADA
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
  const [, setMobileMenuOpen] = useState(false);

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
      setWeeklyStats(null);
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
      setMobileMenuOpen(false); // Cerrar menú móvil
    } catch (error) {
      console.error('Error al ir a hoy:', error);
    }
  };

  if (!user?.profile) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 mx-4 mt-4">
        <p className="text-red-700 text-center">No se pudo cargar la información del perfil</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 space-y-4 sm:space-y-6">
        
        {/* ⭐ HEADER RESPONSIVE */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <div className="min-w-0 flex-1">
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-semibold text-gray-800 truncate">
              📚 Mis Clases
            </h1>
            <p className="text-sm sm:text-base text-gray-600 mt-1">
              Consulta tus horarios y asistencia
            </p>
          </div>
          
          {/* ⭐ CONTROLES DE FECHA RESPONSIVE */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3">
            <div className="flex items-center gap-2 text-xs sm:text-sm">
              <div className={`w-2 h-2 rounded-full ${isServerSynced ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
              <span className="text-gray-600 truncate">{syncStatus}</span>
            </div>
            <button
              onClick={refreshCurrentDate}
              className="w-full sm:w-auto px-3 py-2 text-xs sm:text-sm bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              title="Actualizar fecha"
            >
              🔄 Actualizar
            </button>
          </div>
        </div>

        {/* ⭐ INFORMACIÓN DEL APRENDIZ RESPONSIVE */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg shadow-sm p-4 sm:p-6 border border-blue-200">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center space-x-3 sm:space-x-4 min-w-0 flex-1">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white text-sm sm:text-xl font-bold shadow-lg flex-shrink-0">
                {user.profile.firstName?.charAt(0)}{user.profile.lastName?.charAt(0)}
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="text-base sm:text-lg font-semibold text-gray-800 truncate">
                  {user.profile.firstName} {user.profile.lastName}
                </h2>
                <p className="text-sm sm:text-base text-blue-600 font-medium truncate">
                  Ficha: {user.profile.ficha?.code || 'Sin asignar'}
                </p>
                <p className="text-xs sm:text-sm text-gray-600 truncate">
                  {user.profile.ficha?.name}
                </p>
              </div>
            </div>
            
            {/* ⭐ ESTADÍSTICAS RÁPIDAS RESPONSIVE */}
            {weeklyStats && (
              <div className="text-center sm:text-right bg-white rounded-lg p-3 sm:bg-transparent sm:p-0">
                <div className="text-xs sm:text-sm text-gray-600 mb-1">Asistencia Semanal</div>
                <div className="text-xl sm:text-2xl font-bold text-blue-600">
                  {weeklyStats.attendancePercentage.toFixed(1)}%
                </div>
                <div className="text-xs text-gray-500">
                  {weeklyStats.presentClasses + weeklyStats.lateClasses} de {weeklyStats.totalClasses} clases
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ⭐ ESTADÍSTICAS SEMANALES RESPONSIVE */}
        {weeklyStats && (
          <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6">
            <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-3 sm:mb-4">
              📊 Resumen de la Semana
            </h3>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              <div className="text-center p-3 sm:p-4 bg-green-50 rounded-lg border border-green-200">
                <div className="text-xl sm:text-2xl font-bold text-green-600">{weeklyStats.presentClasses}</div>
                <div className="text-xs sm:text-sm text-green-700">Presente</div>
              </div>
              <div className="text-center p-3 sm:p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                <div className="text-xl sm:text-2xl font-bold text-yellow-600">{weeklyStats.lateClasses}</div>
                <div className="text-xs sm:text-sm text-yellow-700">Tarde</div>
              </div>
              <div className="text-center p-3 sm:p-4 bg-red-50 rounded-lg border border-red-200">
                <div className="text-xl sm:text-2xl font-bold text-red-600">{weeklyStats.absentClasses}</div>
                <div className="text-xs sm:text-sm text-red-700">Ausente</div>
              </div>
              <div className="text-center p-3 sm:p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="text-xl sm:text-2xl font-bold text-blue-600">{weeklyStats.totalClasses}</div>
                <div className="text-xs sm:text-sm text-blue-700">Total</div>
              </div>
            </div>
          </div>
        )}

        {/* ⭐ NAVEGACIÓN POR SEMANA RESPONSIVE */}
        <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-4 sm:mb-6">
            <h3 className="text-base sm:text-lg font-semibold text-gray-800">Seleccionar fecha</h3>
            
            {/* ⭐ BOTONES DE NAVEGACIÓN RESPONSIVE */}
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-2">
              <div className="grid grid-cols-2 sm:flex gap-2">
                <button
                  onClick={() => {
                    const prevWeek = new Date(currentWeek);
                    prevWeek.setDate(prevWeek.getDate() - 7);
                    setCurrentWeek(prevWeek);
                  }}
                  className="px-3 py-2 text-xs sm:text-sm bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  <span className="hidden sm:inline">← Semana anterior</span>
                  <span className="sm:hidden">← Anterior</span>
                </button>
                
                <button
                  onClick={goToToday}
                  className="px-3 py-2 text-xs sm:text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  Hoy
                </button>
              </div>
              
              <button
                onClick={() => {
                  const nextWeek = new Date(currentWeek);
                  nextWeek.setDate(nextWeek.getDate() + 7);
                  setCurrentWeek(nextWeek);
                }}
                className="px-3 py-2 text-xs sm:text-sm bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              >
                <span className="hidden sm:inline">Siguiente semana →</span>
                <span className="sm:hidden">Siguiente →</span>
              </button>
            </div>
          </div>

          {/* ⭐ CALENDARIO SEMANAL RESPONSIVE */}
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 sm:gap-3">
            {getWeekDays().map((day, index) => (
              <button
                key={index}
                onClick={() => setSelectedDate(day.toISOString().split('T')[0])}
                className={`p-2 sm:p-3 text-center rounded-lg transition-colors ${
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
                <div className="text-sm sm:text-lg font-bold">
                  {day.getDate()}
                </div>
                <div className="text-xs">
                  {day.toLocaleDateString('es-CO', { month: 'short' })}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* ⭐ CLASES DEL DÍA RESPONSIVE */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="px-4 sm:px-6 py-4 border-b border-gray-200 bg-gray-50">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
              <h3 className="text-base sm:text-lg font-semibold text-gray-800">
                📅 Clases del {formatDate(selectedDate)}
              </h3>
              {!isServerSynced && (
                <div className="text-xs text-yellow-600 bg-yellow-50 px-2 py-1 rounded border border-yellow-200">
                  ⚠️ Usando fecha local
                </div>
              )}
            </div>
          </div>

          <div className="p-4 sm:p-6">
            {loading ? (
              <div className="text-center py-8 sm:py-12">
                <div className="animate-spin rounded-full h-6 w-6 sm:h-8 sm:w-8 border-t-2 border-b-2 border-sena-green mx-auto"></div>
                <p className="text-gray-500 mt-2 text-sm sm:text-base">Cargando clases...</p>
              </div>
            ) : classes.length === 0 ? (
              <div className="text-center py-8 sm:py-12">
                <div className="text-gray-400 mb-4">
                  <svg className="mx-auto h-12 w-12 sm:h-16 sm:w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </div>
                <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2">No hay clases programadas</h3>
                <p className="text-sm sm:text-base text-gray-500 px-4">No tienes clases programadas para esta fecha</p>
              </div>
            ) : (
              <div className="space-y-3 sm:space-y-4">
                {classes.map((classItem) => (
                  <div key={classItem.scheduleId} className="border rounded-lg p-4 sm:p-6 hover:shadow-md transition-shadow bg-white">
                    
                    {/* ⭐ HEADER DE LA CLASE RESPONSIVE */}
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3 mb-4">
                      <div className="min-w-0 flex-1">
                        <h4 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">
                          {classItem.subject}
                        </h4>
                      </div>
                      {classItem.attendance && (
                        <span className={`inline-flex px-2 sm:px-3 py-1 text-xs sm:text-sm font-semibold rounded-full border self-start ${getStatusColor(classItem.attendance.status)}`}>
                          {getStatusText(classItem.attendance.status)}
                        </span>
                      )}
                    </div>
                    
                    {/* ⭐ INFORMACIÓN DE LA CLASE RESPONSIVE */}
                    <div className="space-y-3">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="flex items-center text-gray-600">
                          <span className="text-base sm:text-lg mr-2 flex-shrink-0">👨‍🏫</span>
                          <span className="text-sm sm:text-base truncate">{classItem.instructor.firstName} {classItem.instructor.lastName}</span>
                        </div>
                        
                        <div className="flex items-center text-gray-600">
                          <span className="text-base sm:text-lg mr-2 flex-shrink-0">🕒</span>
                          <span className="text-sm sm:text-base">{classItem.startTime} - {classItem.endTime}</span>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="flex items-center text-gray-600">
                          <span className="text-base sm:text-lg mr-2 flex-shrink-0">📚</span>
                          <span className="text-sm sm:text-base truncate">{classItem.competence.name}</span>
                        </div>
                        
                        <div className="flex items-center text-gray-600">
                          <span className="text-base sm:text-lg mr-2 flex-shrink-0">📍</span>
                          <span className="text-sm sm:text-base">{classItem.classroom}</span>
                        </div>
                      </div>
                      
                      {/* ⭐ INFORMACIÓN DE ASISTENCIA RESPONSIVE */}
                      {classItem.attendance && (
                        <div className="mt-4 p-3 sm:p-4 bg-gray-50 rounded-lg">
                          <div className="space-y-2">
                            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                              <span className="text-sm font-medium text-gray-700">
                                <strong>Estado:</strong> {getStatusIcon(classItem.attendance.status)} {getStatusText(classItem.attendance.status)}
                              </span>
                              {classItem.attendance.accessTime && (
                                <span className="text-sm text-gray-600">
                                  <strong>Llegada:</strong> {formatTime(classItem.attendance.accessTime)}
                                </span>
                              )}
                            </div>
                            
                            <div className="flex flex-wrap gap-2">
                              <span className={`px-2 py-1 text-xs rounded-full ${
                                classItem.attendance.isManual 
                                  ? 'bg-blue-100 text-blue-700' 
                                  : 'bg-green-100 text-green-700'
                              }`}>
                                {classItem.attendance.isManual ? '✏️ Manual' : '📱 Automático'}
                              </span>
                            </div>
                            
                            {classItem.attendance.notes && (
                              <div className="mt-2 text-sm">
                                <strong>Observaciones:</strong> 
                                <p className="text-gray-600 mt-1">{classItem.attendance.notes}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ⭐ INFORMACIÓN ADICIONAL RESPONSIVE */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 sm:p-6">
          <h3 className="font-medium text-blue-800 mb-3 text-sm sm:text-base">💡 Información sobre asistencia:</h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
            <ul className="text-xs sm:text-sm text-blue-700 space-y-1 sm:space-y-2">
              <li>• ✅ <strong>Presente:</strong> Llegaste a tiempo</li>
              <li>• ⏰ <strong>Tarde:</strong> Dentro de 20 min de tolerancia</li>
              <li>• ❌ <strong>Ausente:</strong> No registraste entrada</li>
              <li>• 📝 <strong>Excusa:</strong> Excusa registrada por instructor</li>
            </ul>
            <ul className="text-xs sm:text-sm text-blue-700 space-y-1 sm:space-y-2">
              <li>• Asistencia automática con código QR</li>
              <li>• Consulta dudas con tu instructor</li>
              <li>• Estadísticas en tiempo real</li>
              <li>• Mantén tu código QR disponible</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MyClasses;