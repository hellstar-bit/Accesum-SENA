// frontend/src/pages/InstructorManagement.tsx - CORREGIDO
import { useState, useEffect } from 'react';
import { attendanceService } from '../services/attendanceService';
import { userService } from '../services/userService';
import { configService } from '../services/configService';
import type { User } from '../types/user.types'; // ✅ CORREGIDO: usar types/user.types
import type { Ficha } from '../services/configService';
import type { InstructorFicha } from '../services/attendanceService';
import Swal from 'sweetalert2';

const InstructorManagement = () => {
  const [instructors, setInstructors] = useState<User[]>([]);
  const [fichas, setFichas] = useState<Ficha[]>([]);
  const [selectedInstructor, setSelectedInstructor] = useState<User | null>(null);
  const [instructorFichas, setInstructorFichas] = useState<InstructorFicha[]>([]);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');

  const [assignForm, setAssignForm] = useState({
    fichaId: '',
    subject: '',
    description: ''
  });

  const [scheduleForm, setScheduleForm] = useState({
    assignmentId: '',
    date: '',
    startTime: '',
    endTime: '',
    classroom: '',
    description: ''
  });

  useEffect(() => {
    fetchInstructors();
    fetchFichas();
  }, [refreshTrigger]);

  const fetchInstructors = async () => {
  try {
    setLoading(true);
    const usersResponse = await userService.getUsers();
    
    // ✅ CORRECCIÓN: Manejar ambos tipos de respuesta
    let users: User[] = [];
    
    if (Array.isArray(usersResponse)) {
      // Si la respuesta directa es un array
      users = usersResponse;
    } else if (usersResponse && typeof usersResponse === 'object' && 'data' in usersResponse) {
      // Si la respuesta tiene estructura { data: User[] }
      users = (usersResponse as any).data || [];
    } else {
      console.warn('Formato de respuesta inesperado:', usersResponse);
      users = [];
    }
    
    // Filtrar solo instructores
    const instructorUsers = users.filter((user: User) => user.role?.name === 'Instructor');
    setInstructors(instructorUsers);
    
  } catch (error) {
    console.error('Error al cargar instructores:', error);
    Swal.fire('Error', 'No se pudieron cargar los instructores', 'error');
  } finally {
    setLoading(false);
  }
};

  const fetchFichas = async () => {
    try {
      const hierarchy = await configService.getHierarchy();
      setFichas(hierarchy.fichas || []);
    } catch (error) {
      console.error('Error al cargar fichas:', error);
      Swal.fire('Error', 'No se pudieron cargar las fichas', 'error');
    }
  };

  const handleSelectInstructor = async (instructor: User) => {
    setSelectedInstructor(instructor);
    try {
      const fichasData = await attendanceService.getInstructorFichas(instructor.id);
      setInstructorFichas(fichasData);
    } catch (error) {
      console.error('Error al cargar fichas del instructor:', error);
      setInstructorFichas([]);
    }
  };

  const handleAssignFicha = async () => {
    if (!selectedInstructor || !assignForm.fichaId || !assignForm.subject) {
      Swal.fire('Error', 'Todos los campos obligatorios deben estar completos', 'error');
      return;
    }

    try {
      await attendanceService.assignInstructorToFicha({
        instructorId: selectedInstructor.id,
        fichaId: parseInt(assignForm.fichaId),
        subject: assignForm.subject,
        description: assignForm.description
      });

      setShowAssignModal(false);
      setAssignForm({ fichaId: '', subject: '', description: '' });
      setRefreshTrigger(prev => prev + 1);
      
      // Actualizar fichas del instructor seleccionado
      if (selectedInstructor) {
        handleSelectInstructor(selectedInstructor);
      }

      Swal.fire({
        title: '✅ Asignación exitosa',
        text: 'El instructor ha sido asignado a la ficha correctamente',
        icon: 'success',
        timer: 2000,
        showConfirmButton: false
      });
    } catch (error: any) {
      Swal.fire('Error', error.response?.data?.message || 'No se pudo realizar la asignación', 'error');
    }
  };

  const handleCreateSchedule = async () => {
    if (!scheduleForm.assignmentId || !scheduleForm.date || !scheduleForm.startTime || !scheduleForm.endTime) {
      Swal.fire('Error', 'Todos los campos obligatorios deben estar completos', 'error');
      return;
    }

    try {
      await attendanceService.createSchedule({
        assignmentId: parseInt(scheduleForm.assignmentId),
        date: scheduleForm.date,
        startTime: scheduleForm.startTime,
        endTime: scheduleForm.endTime,
        classroom: scheduleForm.classroom,
        description: scheduleForm.description
      });

      setShowScheduleModal(false);
      setScheduleForm({
        assignmentId: '',
        date: '',
        startTime: '',
        endTime: '',
        classroom: '',
        description: ''
      });

      Swal.fire({
        title: '✅ Horario creado',
        text: 'El horario de clase ha sido creado correctamente',
        icon: 'success',
        timer: 2000,
        showConfirmButton: false
      });
    } catch (error: any) {
      Swal.fire('Error', error.response?.data?.message || 'No se pudo crear el horario', 'error');
    }
  };

  const openAssignModal = () => {
    if (!selectedInstructor) {
      Swal.fire('Error', 'Primero selecciona un instructor', 'error');
      return;
    }
    setShowAssignModal(true);
  };

  const openScheduleModal = () => {
    if (!selectedInstructor || instructorFichas.length === 0) {
      Swal.fire('Error', 'El instructor debe tener fichas asignadas para crear horarios', 'error');
      return;
    }
    setShowScheduleModal(true);
  };

  const filteredInstructors = instructors.filter(instructor =>
    instructor.profile?.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    instructor.profile?.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    instructor.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    instructor.profile?.documentNumber?.includes(searchTerm)
  );

  const getInstructorStats = () => {
    const totalInstructors = instructors.length;
    const activeInstructors = instructors.filter(i => i.isActive).length;
    const inactiveInstructors = totalInstructors - activeInstructors;
    const instructorsWithAssignments = Math.floor(totalInstructors * 0.7); // Placeholder

    return {
      total: totalInstructors,
      active: activeInstructors,
      inactive: inactiveInstructors,
      withAssignments: instructorsWithAssignments
    };
  };

  const stats = getInstructorStats();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-800">👨‍🏫 Gestión de Instructores</h1>
          <p className="text-gray-600 mt-1">Asigna instructores a fichas y gestiona competencias</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={openScheduleModal}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            disabled={!selectedInstructor || instructorFichas.length === 0}
          >
            🗓️ Crear Horario
          </button>
          <button
            onClick={openAssignModal}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            disabled={!selectedInstructor}
          >
            ➕ Asignar Ficha
          </button>
        </div>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-blue-100 text-blue-600">
              <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-500 font-medium">Total Instructores</p>
              <p className="text-2xl font-semibold text-gray-700">{stats.total}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-green-100 text-green-600">
              <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-500 font-medium">Activos</p>
              <p className="text-2xl font-semibold text-gray-700">{stats.active}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-yellow-100 text-yellow-600">
              <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-500 font-medium">Inactivos</p>
              <p className="text-2xl font-semibold text-gray-700">{stats.inactive}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-purple-100 text-purple-600">
              <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-500 font-medium">Con Asignaciones</p>
              <p className="text-2xl font-semibold text-gray-700">{stats.withAssignments}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Lista de Instructores */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b">
              <h3 className="text-lg font-semibold text-gray-800">Instructores</h3>
              <div className="mt-3">
                <input
                  type="text"
                  placeholder="Buscar instructor..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
              <p className="text-sm text-gray-500 mt-2">
                {filteredInstructors.length} de {instructors.length} instructores
              </p>
            </div>
            <div className="divide-y max-h-96 overflow-y-auto">
              {loading ? (
                <div className="p-6 text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-green-600 mx-auto"></div>
                  <p className="text-gray-500 mt-2">Cargando...</p>
                </div>
              ) : filteredInstructors.length === 0 ? (
                <div className="p-6 text-center">
                  <p className="text-gray-500">
                    {searchTerm ? 'No se encontraron instructores' : 'No hay instructores registrados'}
                  </p>
                </div>
              ) : (
                filteredInstructors.map((instructor) => (
                  <div
                    key={instructor.id}
                    onClick={() => handleSelectInstructor(instructor)}
                    className={`p-4 cursor-pointer hover:bg-gray-50 transition-colors ${
                      selectedInstructor?.id === instructor.id ? 'bg-blue-50 border-r-4 border-blue-500' : ''
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white text-sm font-bold">
                            {instructor.profile?.firstName?.charAt(0)}{instructor.profile?.lastName?.charAt(0)}
                          </div>
                          <div className="flex-1">
                            <p className="font-medium text-gray-900 text-sm">
                              {instructor.profile?.firstName} {instructor.profile?.lastName}
                            </p>
                            <p className="text-xs text-gray-500">{instructor.email}</p>
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <p className="text-xs text-gray-400">
                            Doc: {instructor.profile?.documentNumber}
                          </p>
                          <div className={`w-2 h-2 rounded-full ${
                            instructor.isActive ? 'bg-green-400' : 'bg-red-400'
                          }`} title={instructor.isActive ? 'Activo' : 'Inactivo'}></div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Detalles del Instructor */}
        <div className="lg:col-span-2">
          {selectedInstructor ? (
            <div className="space-y-6">
              {/* Información del instructor */}
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center space-x-4">
                    <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white text-xl font-bold">
                      {selectedInstructor.profile?.firstName?.charAt(0)}{selectedInstructor.profile?.lastName?.charAt(0)}
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-800">
                        {selectedInstructor.profile?.firstName} {selectedInstructor.profile?.lastName}
                      </h3>
                      <p className="text-gray-600">{selectedInstructor.email}</p>
                      <p className="text-sm text-gray-500">
                        {selectedInstructor.profile?.documentType} {selectedInstructor.profile?.documentNumber}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${
                      selectedInstructor.isActive 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {selectedInstructor.isActive ? 'Activo' : 'Inactivo'}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm bg-gray-50 p-4 rounded-lg">
                  <div>
                    <span className="text-gray-500">Centro:</span>
                    <p className="text-gray-900 font-medium">{selectedInstructor.profile?.center?.name || 'No especificado'}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Regional:</span>
                    <p className="text-gray-900 font-medium">{selectedInstructor.profile?.regional?.name || 'No especificado'}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Teléfono:</span>
                    <p className="text-gray-900 font-medium">{selectedInstructor.profile?.phoneNumber || 'No especificado'}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Creado:</span>
                    <p className="text-gray-900 font-medium">
                      {new Date(selectedInstructor.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>

              {/* Fichas asignadas */}
              <div className="bg-white rounded-lg shadow">
                <div className="px-6 py-4 border-b">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-800">Fichas Asignadas</h3>
                      <p className="text-sm text-gray-500">{instructorFichas.length} asignaciones activas</p>
                    </div>
                    <div className="text-sm text-gray-500">
                      Total aprendices: {instructorFichas.reduce((total, assignment) => total + (assignment.ficha.totalLearners || 0), 0)}
                    </div>
                  </div>
                </div>
                <div className="p-6">
                  {instructorFichas.length === 0 ? (
                    <div className="text-center py-8">
                      <div className="text-gray-400 mb-4">
                        <svg className="mx-auto h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                        </svg>
                      </div>
                      <h3 className="text-lg font-medium text-gray-900 mb-2">Sin asignaciones</h3>
                      <p className="text-gray-500 mb-4">Este instructor no tiene fichas asignadas</p>
                      <button
                        onClick={openAssignModal}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                      >
                        ➕ Asignar primera ficha
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {instructorFichas.map((assignment) => (
                        <div key={assignment.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                          <div className="flex justify-between items-start mb-3">
                            <div className="flex items-center space-x-2">
                              <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded font-medium">
                                {assignment.ficha.code}
                              </span>
                              <span className={`text-xs px-2 py-1 rounded ${
                                assignment.ficha.status === 'EN EJECUCIÓN' 
                                  ? 'bg-green-100 text-green-800' 
                                  : 'bg-gray-100 text-gray-800'
                              }`}>
                                {assignment.ficha.status}
                              </span>
                            </div>
                          </div>
                          
                          <h4 className="font-medium text-gray-900 mb-2">{assignment.subject}</h4>
                          <p className="text-sm text-gray-600 mb-3" title={assignment.ficha.name}>
                            {assignment.ficha.name.length > 80 
                              ? `${assignment.ficha.name.substring(0, 80)}...` 
                              : assignment.ficha.name}
                          </p>
                          
                          {assignment.description && (
                            <p className="text-xs text-gray-500 mb-3 bg-gray-50 p-2 rounded">
                              {assignment.description}
                            </p>
                          )}
                          
                          <div className="flex justify-between items-center text-sm">
                            <span className="text-gray-500 flex items-center">
                              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857" />
                              </svg>
                              {assignment.ficha.totalLearners} aprendices
                            </span>
                            <span className="text-gray-400 text-xs">
                              {new Date(assignment.assignedAt).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow p-8 text-center">
              <div className="text-gray-400 mb-4">
                <svg className="mx-auto h-20 w-20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <h3 className="text-xl font-medium text-gray-900 mb-2">Selecciona un instructor</h3>
              <p className="text-gray-500 mb-6">Elige un instructor de la lista para ver y gestionar sus asignaciones</p>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-700">
                  💡 Desde aquí puedes asignar instructores a fichas específicas y crear horarios de clase
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal de Asignación */}
      {showAssignModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-800">Asignar Ficha a Instructor</h3>
                <button
                  onClick={() => setShowAssignModal(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Instructor Seleccionado
                  </label>
                  <p className="text-gray-900 bg-gray-50 p-2 rounded">
                    {selectedInstructor?.profile?.firstName} {selectedInstructor?.profile?.lastName}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Ficha *
                  </label>
                  <select
                    value={assignForm.fichaId}
                    onChange={(e) => setAssignForm({...assignForm, fichaId: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  >
                    <option value="">Seleccionar ficha</option>
                    {fichas.map((ficha) => (
                      <option key={ficha.id} value={ficha.id}>
                        {ficha.code} - {ficha.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Competencia/Materia *
                  </label>
                  <input
                    type="text"
                    value={assignForm.subject}
                    onChange={(e) => setAssignForm({...assignForm, subject: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="Ej: Programación Web, Bases de Datos, etc."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Descripción
                  </label>
                  <textarea
                    value={assignForm.description}
                    onChange={(e) => setAssignForm({...assignForm, description: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    rows={3}
                    placeholder="Descripción adicional de la asignación..."
                  />
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button 
                    onClick={() => setShowAssignModal(false)} 
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button 
                    onClick={handleAssignFicha} 
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                    disabled={!assignForm.fichaId || !assignForm.subject}
                  >
                    Asignar
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Horario */}
      {showScheduleModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-800">Crear Horario de Clase</h3>
                <button
                  onClick={() => setShowScheduleModal(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Instructor
                  </label>
                  <p className="text-gray-900 bg-gray-50 p-2 rounded">
                    {selectedInstructor?.profile?.firstName} {selectedInstructor?.profile?.lastName}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Asignación (Ficha - Competencia) *
                  </label>
                  <select
                    value={scheduleForm.assignmentId}
                    onChange={(e) => setScheduleForm({...scheduleForm, assignmentId: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  >
                    <option value="">Seleccionar asignación</option>
                    {instructorFichas.map((assignment) => (
                      <option key={assignment.id} value={assignment.id}>
                        {assignment.ficha.code} - {assignment.subject}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Fecha *
                  </label>
                  <input
                    type="date"
                    value={scheduleForm.date}
                    onChange={(e) => setScheduleForm({...scheduleForm, date: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Hora Inicio *
                    </label>
                    <input
                      type="time"
                      value={scheduleForm.startTime}
                      onChange={(e) => setScheduleForm({...scheduleForm, startTime: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Hora Fin *
                    </label>
                    <input
                      type="time"
                      value={scheduleForm.endTime}
                      onChange={(e) => setScheduleForm({...scheduleForm, endTime: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Aula/Salon
                  </label>
                  <input
                    type="text"
                    value={scheduleForm.classroom}
                    onChange={(e) => setScheduleForm({...scheduleForm, classroom: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="Ej: Aula 101, Laboratorio 3, etc."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Descripción
                  </label>
                  <textarea
                    value={scheduleForm.description}
                    onChange={(e) => setScheduleForm({...scheduleForm, description: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    rows={2}
                    placeholder="Descripción de la clase o tema a tratar..."
                  />
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button 
                    onClick={() => setShowScheduleModal(false)} 
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button 
                    onClick={handleCreateSchedule} 
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                    disabled={!scheduleForm.assignmentId || !scheduleForm.date || !scheduleForm.startTime || !scheduleForm.endTime}
                  >
                    Crear Horario
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Información adicional */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-medium text-blue-800 mb-2">💡 Gestión de Instructores:</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• Un instructor puede tener múltiples asignaciones (diferentes fichas y competencias)</li>
            <li>• Cada asignación debe especificar la competencia o materia que dicta</li>
            <li>• Los instructores podrán crear horarios de clase para sus asignaciones</li>
            <li>• La asistencia se marca automáticamente cuando los aprendices registran entrada</li>
          </ul>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• Los instructores pueden modificar manualmente la asistencia de sus aprendices</li>
            <li>• Los horarios tienen tolerancia de 20 minutos para llegadas tarde</li>
            <li>• Usa la búsqueda para encontrar instructores específicos rápidamente</li>
            <li>• Las estadísticas se actualizan automáticamente al hacer cambios</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default InstructorManagement;