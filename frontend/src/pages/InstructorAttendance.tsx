// frontend/src/pages/InstructorAttendance.tsx
import React, { useState, useEffect } from 'react';
import { attendanceService, type ClassSchedule, type AttendanceRecord } from '../services/attendanceService';

// ⭐ Eliminar las interfaces duplicadas del componente
// Ya no necesitas definir AttendanceRecord ni ClassSchedule aquí
// porque las estás importando del servicio

const InstructorAttendance: React.FC = () => {
  const [schedules, setSchedules] = useState<ClassSchedule[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    loadAttendance();
  }, [selectedDate]);

  const loadAttendance = async () => {
    try {
      setLoading(true);
      setError('');
      
      const response = await attendanceService.getMyClassesAttendance(selectedDate);
      setSchedules(response);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al cargar la asistencia');
      console.error('Error loading attendance:', err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const baseClasses = "px-2 py-1 rounded-full text-xs font-medium";
    
    switch (status) {
      case 'PRESENT':
        return `${baseClasses} bg-green-100 text-green-800`;
      case 'LATE':
        return `${baseClasses} bg-yellow-100 text-yellow-800`;
      case 'ABSENT':
        return `${baseClasses} bg-red-100 text-red-800`;
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
      default:
        return status;
    }
  };

  const formatTime = (timeString: string | null) => {
    if (!timeString) return 'N/A';
    
    try {
      return new Date(timeString).toLocaleTimeString('es-CO', {
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'N/A';
    }
  };

  // ⭐ Actualizar función para usar la nueva estructura
  const calculateAttendanceStats = (records: AttendanceRecord[]) => {
    const total = records.length;
    const present = records.filter(a => a.status === 'PRESENT').length;
    const late = records.filter(a => a.status === 'LATE').length;
    const absent = records.filter(a => a.status === 'ABSENT').length;
    
    return { total, present, late, absent };
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
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Control de Asistencia
          </h1>
          <p className="text-gray-600">
            Gestiona la asistencia de tus clases y aprendices
          </p>
        </div>

        {/* Selector de fecha */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div className="flex items-center gap-4">
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
              onClick={loadAttendance}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm font-medium"
            >
              Actualizar
            </button>
          </div>
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
              No se encontraron clases para la fecha seleccionada.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {schedules.map((schedule) => {
              // ⭐ Usar records en lugar de attendance
              const stats = calculateAttendanceStats(schedule.records);
              
              return (
                <div key={schedule.scheduleId} className="bg-white rounded-lg shadow-sm overflow-hidden">
                  {/* Header de la clase */}
                  <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                    <div className="flex justify-between items-center">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">
                          {schedule.subject} - {schedule.startTime} a {schedule.endTime}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {schedule.classroom && `Aula: ${schedule.classroom}`}
                          {schedule.ficha?.name && ` | Ficha: ${schedule.ficha.name}`}
                        </p>
                      </div>
                      <div className="flex items-center gap-4 text-sm">
                        <span className="text-green-600 font-medium">
                          Presentes: {stats.present}
                        </span>
                        <span className="text-yellow-600 font-medium">
                          Tarde: {stats.late}
                        </span>
                        <span className="text-red-600 font-medium">
                          Ausentes: {stats.absent}
                        </span>
                        <span className="text-gray-600 font-medium">
                          Total: {stats.total}
                        </span>
                      </div>
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
                            Marcado
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Tipo
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {/* ⭐ Usar schedule.records en lugar de schedule.attendance */}
                        {schedule.records.map((record) => (
                          <tr key={record.attendanceId} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-gray-900">
                                {record.learnerName || 'Sin nombre'}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={getStatusBadge(record.status)}>
                                {getStatusText(record.status)}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {formatTime(record.accessTime)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {formatTime(record.markedAt)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                record.isManual 
                                  ? 'bg-blue-100 text-blue-800' 
                                  : 'bg-green-100 text-green-800'
                              }`}>
                                {record.isManual ? 'Manual' : 'Automático'}
                              </span>
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
                          {stats.total} aprendices registrados
                        </span>
                        <span className="text-gray-600">
                          Asistencia: {stats.total > 0 ? Math.round(((stats.present + stats.late) / stats.total) * 100) : 0}%
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default InstructorAttendance;
