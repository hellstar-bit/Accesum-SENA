// pages/InstructorDashboard.tsx
import { useState, useEffect } from 'react';
import { attendanceService } from '../services/attendanceService';
import type { InstructorFicha, ClassSchedule } from '../services/attendanceService';

const InstructorDashboard = () => {
  const [fichas, setFichas] = useState<InstructorFicha[]>([]);
  const [todayClasses, setTodayClasses] = useState<ClassSchedule[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const today = new Date().toISOString().split('T')[0];
      
      const [fichasData, classesData] = await Promise.all([
        attendanceService.getMyFichas(),
        attendanceService.getMyClassesAttendance(today)
      ]);
      
      setFichas(fichasData);
      setTodayClasses(classesData);
    } catch (error) {
      console.error('Error al cargar dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-sena-green"></div>
        <span className="ml-3 text-gray-600">Cargando dashboard...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-gray-800">Dashboard Instructor</h1>
        <p className="text-gray-600 mt-1">Resumen de tus fichas y clases de hoy</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-blue-100 text-blue-600">
              <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-500 font-medium">Fichas Asignadas</p>
              <p className="text-2xl font-semibold text-gray-700">{fichas.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-green-100 text-green-600">
              <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-500 font-medium">Clases Hoy</p>
              <p className="text-2xl font-semibold text-gray-700">{todayClasses.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-yellow-100 text-yellow-600">
              <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-500 font-medium">Total Aprendices</p>
              <p className="text-2xl font-semibold text-gray-700">
                {fichas.reduce((total, ficha) => total + ficha.ficha.totalLearners, 0)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Clases de Hoy */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b">
          <h2 className="text-lg font-semibold text-gray-800">📅 Clases de Hoy</h2>
        </div>
        <div className="p-6">
          {todayClasses.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">No tienes clases programadas para hoy</p>
            </div>
          ) : (
            <div className="space-y-4">
              {todayClasses.map((classItem) => (
                <div key={classItem.id} className="border rounded-lg p-4 hover:bg-gray-50">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <span className="text-lg font-medium text-gray-900">
                          {classItem.subject}
                        </span>
                        <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                          {classItem.ficha.code}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{classItem.ficha.name}</p>
                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        <span>🕒 {classItem.startTime} - {classItem.endTime}</span>
                        {classItem.classroom && <span>📍 {classItem.classroom}</span>}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-gray-500 mb-1">Asistencia</div>
                      <div className="text-2xl font-bold text-green-600">
                        {classItem.attendance.percentage}%
                      </div>
                      <div className="text-xs text-gray-500">
                        {classItem.attendance.present + classItem.attendance.late}/{classItem.attendance.total}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Mis Fichas */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b">
          <h2 className="text-lg font-semibold text-gray-800">📚 Mis Fichas Asignadas</h2>
        </div>
        <div className="p-6">
          {fichas.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">No tienes fichas asignadas</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {fichas.map((ficha) => (
                <div key={ficha.id} className="border rounded-lg p-4 hover:bg-gray-50">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded">
                        {ficha.ficha.code}
                      </span>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded ${
                      ficha.ficha.status === 'EN EJECUCIÓN' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {ficha.ficha.status}
                    </span>
                  </div>
                  
                  <h3 className="font-medium text-gray-900 mb-2">{ficha.subject}</h3>
                  <p className="text-sm text-gray-600 mb-3" title={ficha.ficha.name}>
                    {ficha.ficha.name.length > 60 
                      ? `${ficha.ficha.name.substring(0, 60)}...` 
                      : ficha.ficha.name}
                  </p>
                  
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-500">
                      👥 {ficha.ficha.totalLearners} aprendices
                    </span>
                    <span className="text-gray-400">
                      Asignada: {new Date(ficha.assignedAt).toLocaleDateString()}
                    </span>
                  </div>
                  
                  {ficha.description && (
                    <p className="text-xs text-gray-500 mt-2">{ficha.description}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default InstructorDashboard;