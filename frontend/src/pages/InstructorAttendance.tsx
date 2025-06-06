// pages/InstructorAttendance.tsx
import { useState, useEffect } from 'react';
import { attendanceService } from '../services/attendanceService';
import type { ClassSchedule, AttendanceRecord } from '../services/attendanceService';
import Swal from 'sweetalert2';

const InstructorAttendance = () => {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [classes, setClasses] = useState<ClassSchedule[]>([]);
  const [selectedClass, setSelectedClass] = useState<ClassSchedule | null>(null);
  const [loading, setLoading] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    fetchAttendance();
  }, [selectedDate, refreshTrigger]);

  const fetchAttendance = async () => {
    try {
      setLoading(true);
      const data = await attendanceService.getMyClassesAttendance(selectedDate);
      setClasses(data);
      
      // Si hay una clase seleccionada, actualizarla
      if (selectedClass) {
        const updatedClass = data.find(c => c.id === selectedClass.id);
        if (updatedClass) {
          setSelectedClass(updatedClass);
        }
      }
    } catch (error) {
      console.error('Error al cargar asistencia:', error);
      Swal.fire('Error', 'No se pudo cargar la asistencia', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAttendance = async (
    learnerId: number, 
    status: 'PRESENT' | 'LATE' | 'ABSENT',
    currentStatus?: string
  ) => {
    if (!selectedClass) return;

    // Confirmar cambio si ya tiene asistencia marcada
    if (currentStatus && currentStatus !== 'ABSENT') {
      const result = await Swal.fire({
        title: '¿Cambiar asistencia?',
        text: `¿Desea cambiar de "${getStatusText(currentStatus)}" a "${getStatusText(status)}"?`,
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#39A900',
        cancelButtonColor: '#6b7280',
        confirmButtonText: 'Sí, cambiar',
        cancelButtonText: 'Cancelar'
      });

      if (!result.isConfirmed) return;
    }

    try {
      await attendanceService.markAttendance({
        scheduleId: selectedClass.id,
        learnerId,
        status
      });

      setRefreshTrigger(prev => prev + 1);
      
      Swal.fire({
        title: '✅ Asistencia marcada',
        text: `Estado cambiado a: ${getStatusText(status)}`,
        icon: 'success',
        timer: 2000,
        showConfirmButton: false
      });
    } catch (error) {
      console.error('Error al marcar asistencia:', error);
      Swal.fire('Error', 'No se pudo marcar la asistencia', 'error');
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'PRESENT': return 'Presente';
      case 'LATE': return 'Tarde';
      case 'ABSENT': return 'Ausente';
      default: return status;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PRESENT': return 'bg-green-100 text-green-800';
      case 'LATE': return 'bg-yellow-100 text-yellow-800';
      case 'ABSENT': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleAddNote = async (learnerId: number) => {
    if (!selectedClass) return;

    const currentRecord = selectedClass.records.find(r => r.learner.id === learnerId);
    
    const { value: notes } = await Swal.fire({
      title: 'Agregar nota',
      input: 'textarea',
      inputLabel: 'Observaciones sobre la asistencia',
      inputValue: currentRecord?.notes || '',
      inputPlaceholder: 'Escriba sus observaciones...',
      showCancelButton: true,
      confirmButtonText: 'Guardar',
      cancelButtonText: 'Cancelar'
    });

    if (notes !== undefined) {
      try {
        await attendanceService.markAttendance({
          scheduleId: selectedClass.id,
          learnerId,
          status: currentRecord?.status || 'ABSENT',
          notes
        });

        setRefreshTrigger(prev => prev + 1);
        
        Swal.fire({
          title: '✅ Nota guardada',
          icon: 'success',
          timer: 1500,
          showConfirmButton: false
        });
      } catch (error) {
        Swal.fire('Error', 'No se pudo guardar la nota', 'error');
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-800">📊 Gestión de Asistencia</h1>
          <p className="text-gray-600 mt-1">Controla la asistencia de tus aprendices</p>
        </div>
        
        <div className="flex items-center space-x-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Fecha</label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="input-field"
            />
          </div>
          <button
            onClick={fetchAttendance}
            disabled={loading}
            className="btn-primary"
          >
            {loading ? 'Cargando...' : 'Actualizar'}
          </button>
        </div>
      </div>

      {/* Lista de Clases */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Panel izquierdo - Lista de clases */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b">
              <h3 className="text-lg font-semibold text-gray-800">
                🗓️ Clases del {new Date(selectedDate).toLocaleDateString('es-CO')}
              </h3>
            </div>
            <div className="divide-y">
              {loading ? (
                <div className="p-6 text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-sena-green mx-auto"></div>
                  <p className="text-gray-500 mt-2">Cargando...</p>
                </div>
              ) : classes.length === 0 ? (
                <div className="p-6 text-center">
                  <p className="text-gray-500">No hay clases programadas para esta fecha</p>
                </div>
              ) : (
                classes.map((classItem) => (
                  <div
                    key={classItem.id}
                    onClick={() => setSelectedClass(classItem)}
                    className={`p-4 cursor-pointer hover:bg-gray-50 transition-colors ${
                      selectedClass?.id === classItem.id ? 'bg-blue-50 border-r-4 border-blue-500' : ''
                    }`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <span className="font-medium text-gray-900">{classItem.subject}</span>
                      <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                        {classItem.ficha.code}
                      </span>
                    </div>
                    
                    <div className="text-sm text-gray-600 mb-2">
                      🕒 {classItem.startTime} - {classItem.endTime}
                      {classItem.classroom && (
                        <span className="ml-2">📍 {classItem.classroom}</span>
                      )}
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <div className="text-xs text-gray-500">
                        {classItem.attendance.present + classItem.attendance.late}/{classItem.attendance.total} presentes
                      </div>
                      <div className={`text-xs px-2 py-1 rounded ${
                        parseFloat(classItem.attendance.percentage) >= 80 
                          ? 'bg-green-100 text-green-800'
                          : parseFloat(classItem.attendance.percentage) >= 60
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {classItem.attendance.percentage}%
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Panel derecho - Detalle de asistencia */}
        <div className="lg:col-span-2">
          {selectedClass ? (
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800">{selectedClass.subject}</h3>
                    <p className="text-sm text-gray-600">{selectedClass.ficha.name}</p>
                    <p className="text-sm text-gray-500 mt-1">
                      📅 {new Date(selectedClass.date).toLocaleDateString('es-CO')} • 
                      🕒 {selectedClass.startTime} - {selectedClass.endTime}
                      {selectedClass.classroom && ` • 📍 ${selectedClass.classroom}`}
                    </p>
                  </div>
                  <span className="bg-blue-100 text-blue-800 text-sm px-3 py-1 rounded">
                    {selectedClass.ficha.code}
                  </span>
                </div>
              </div>

              {/* Estadísticas de asistencia */}
              <div className="px-6 py-4 bg-gray-50 border-b">
                <div className="grid grid-cols-4 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-blue-600">{selectedClass.attendance.total}</div>
                    <div className="text-xs text-gray-500">Total</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-green-600">{selectedClass.attendance.present}</div>
                    <div className="text-xs text-gray-500">Presentes</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-yellow-600">{selectedClass.attendance.late}</div>
                    <div className="text-xs text-gray-500">Tarde</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-red-600">{selectedClass.attendance.absent}</div>
                    <div className="text-xs text-gray-500">Ausentes</div>
                  </div>
                </div>
              </div>

              {/* Lista de aprendices */}
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Aprendiz
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Documento
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Estado
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Hora Marcada
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Acciones
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {selectedClass.records.map((record) => (
                      <tr key={record.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {record.learner.firstName} {record.learner.lastName}
                              </div>
                              {record.notes && (
                                <div className="text-xs text-gray-500 mt-1">
                                  📝 {record.notes}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {record.learner.documentNumber}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(record.status)}`}>
                            {getStatusText(record.status)}
                            {record.isManual && <span className="ml-1">👤</span>}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {record.markedAt 
                            ? new Date(record.markedAt).toLocaleTimeString('es-CO', { 
                                hour: '2-digit', 
                                minute: '2-digit' 
                              })
                            : '-'
                          }
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleMarkAttendance(record.learner.id, 'PRESENT', record.status)}
                              className="text-green-600 hover:text-green-900"
                              title="Marcar presente"
                            >
                              ✅
                            </button>
                            <button
                              onClick={() => handleMarkAttendance(record.learner.id, 'LATE', record.status)}
                              className="text-yellow-600 hover:text-yellow-900"
                              title="Marcar tarde"
                            >
                              ⏰
                            </button>
                            <button
                              onClick={() => handleMarkAttendance(record.learner.id, 'ABSENT', record.status)}
                              className="text-red-600 hover:text-red-900"
                              title="Marcar ausente"
                            >
                              ❌
                            </button>
                            <button
                              onClick={() => handleAddNote(record.learner.id)}
                              className="text-blue-600 hover:text-blue-900"
                              title="Agregar nota"
                            >
                              📝
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow p-8 text-center">
              <div className="text-gray-400 mb-4">
                <svg className="mx-auto h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Selecciona una clase</h3>
              <p className="text-gray-500">Elige una clase de la lista para ver y gestionar la asistencia</p>
            </div>
          )}
        </div>
      </div>

      {/* Información adicional */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-medium text-blue-800 mb-2">💡 Información sobre la asistencia:</h3>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• <strong>Automática:</strong> Se marca cuando el aprendiz registra entrada con QR (tolerancia: 20 min)</li>
          <li>• <strong>Manual:</strong> Puedes cambiar el estado manualmente haciendo clic en los botones</li>
          <li>• <strong>Notas:</strong> Agrega observaciones específicas sobre la asistencia de cada aprendiz</li>
          <li>• <strong>Estados:</strong> ✅ Presente • ⏰ Tarde • ❌ Ausente • 👤 Marcado manual</li>
        </ul>
      </div>
    </div>
  );
};

export default InstructorAttendance;