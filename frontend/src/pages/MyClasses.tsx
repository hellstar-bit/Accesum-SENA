// frontend/src/pages/MyClasses.tsx - CORREGIDO
import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext'; // ✅ Importación corregida

interface MyClass {
  id: number;
  subject: string;
  instructor: string;
  date: Date;
  startTime: string;
  endTime: string;
  classroom?: string;
  status: 'PRESENT' | 'LATE' | 'ABSENT' | 'PENDING';
}

const MyClasses = () => {
  const { user } = useAuth(); // ✅ Ahora debería funcionar
  const [classes, setClasses] = useState<MyClass[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(false);
  const [currentWeek, setCurrentWeek] = useState(new Date());

  useEffect(() => {
    fetchMyClasses();
  }, [selectedDate]);

  const fetchMyClasses = async () => {
    setLoading(true);
    try {
      // TODO: Implementar servicio para obtener clases del aprendiz
      // const data = await learnerService.getMyClasses(selectedDate);
      // setClasses(data);
      
      // Datos de ejemplo mientras se implementa el backend
      const mockClasses: MyClass[] = [
        {
          id: 1,
          subject: 'Programación Web',
          instructor: 'Juan Pérez',
          date: new Date(selectedDate),
          startTime: '08:00',
          endTime: '12:00',
          classroom: 'Aula 101',
          status: 'PRESENT'
        },
        {
          id: 2,
          subject: 'Bases de Datos',
          instructor: 'María García',
          date: new Date(selectedDate),
          startTime: '14:00',
          endTime: '17:00',
          classroom: 'Aula 205',
          status: 'LATE'
        }
      ];
      setClasses(mockClasses);
    } catch (error) {
      console.error('Error al cargar clases:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PRESENT': return 'bg-green-100 text-green-800';
      case 'LATE': return 'bg-yellow-100 text-yellow-800';
      case 'ABSENT': return 'bg-red-100 text-red-800';
      case 'PENDING': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'PRESENT': return '✅ Presente';
      case 'LATE': return '⏰ Tarde';
      case 'ABSENT': return '❌ Ausente';
      case 'PENDING': return '⏳ Pendiente';
      default: return status;
    }
  };

  const getWeekDays = () => {
    const start = new Date(currentWeek);
    start.setDate(start.getDate() - start.getDay() + 1); // Lunes
    const days = [];
    
    for (let i = 0; i < 7; i++) {
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-gray-800">📚 Mis Clases</h1>
        <p className="text-gray-600 mt-1">Consulta tus horarios y asistencia</p>
      </div>

      {/* Información del aprendiz */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center space-x-4">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white text-xl font-bold">
            {user?.profile?.firstName?.charAt(0)}{user?.profile?.lastName?.charAt(0)}
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-800">
              {user?.profile?.firstName} {user?.profile?.lastName}
            </h2>
            <p className="text-gray-600">Ficha: {user?.profile?.ficha?.code || 'Sin asignar'}</p>
            <p className="text-sm text-gray-500">{user?.profile?.ficha?.name}</p>
          </div>
        </div>
      </div>

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
              onClick={() => setCurrentWeek(new Date())}
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

        <div className="grid grid-cols-7 gap-2">
          {getWeekDays().map((day, index) => (
            <button
              key={index}
              onClick={() => setSelectedDate(day.toISOString().split('T')[0])}
              className={`p-3 text-center rounded-lg transition-colors ${
                selectedDate === day.toISOString().split('T')[0]
                  ? 'bg-sena-green text-white'
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

      {/* Clases del día */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b">
          <h3 className="text-lg font-semibold text-gray-800">
            📅 Clases del {new Date(selectedDate).toLocaleDateString('es-CO', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}
          </h3>
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
                <div key={classItem.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h4 className="text-lg font-medium text-gray-900">{classItem.subject}</h4>
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(classItem.status)}`}>
                          {getStatusText(classItem.status)}
                        </span>
                      </div>
                      
                      <div className="text-sm text-gray-600 space-y-1">
                        <div className="flex items-center space-x-4">
                          <span>👨‍🏫 {classItem.instructor}</span>
                          <span>🕒 {classItem.startTime} - {classItem.endTime}</span>
                          {classItem.classroom && <span>📍 {classItem.classroom}</span>}
                        </div>
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
          <li>• ⏳ <strong>Pendiente:</strong> La clase aún no ha comenzado</li>
          <li>• Tu asistencia se marca automáticamente al registrar entrada con tu código QR</li>
          <li>• Si tienes dudas sobre tu asistencia, consulta con tu instructor</li>
        </ul>
      </div>
    </div>
  );
};

export default MyClasses;

