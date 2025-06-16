// frontend/src/pages/InstructorManagement.tsx - ARCHIVO COMPLETO
import React, { useState, useEffect } from 'react';
import type { InstructorAssignment } from '../services/instructorAssignmentService';
import { instructorAssignmentService } from '../services/instructorAssignmentService';
import { userService } from '../services/userService';
import { useNavigate } from 'react-router-dom';

interface User {
  id: number;
  email: string;
  isActive: boolean;
  profile: {
    firstName: string;
    lastName: string;
    documentNumber: string;
    type: {
      name: string;
    };
  };
  roles?: Array<{
    name: string;
  }>;
}

interface Ficha {
  id: number;
  code: string;
  name: string;
  status: string;
}

const InstructorManagement: React.FC = () => {
  const navigate = useNavigate();
  const [instructors, setInstructors] = useState<User[]>([]);
  const [selectedInstructorId, setSelectedInstructorId] = useState<number | null>(null);
  const [instructorFichas, setInstructorFichas] = useState<InstructorAssignment[]>([]);
  const [availableFichas, setAvailableFichas] = useState<Ficha[]>([]);
  const [loadingFichas, setLoadingFichas] = useState<boolean>(false);
  const [loadingAvailableFichas, setLoadingAvailableFichas] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [showAssignModal, setShowAssignModal] = useState<boolean>(false);
  const [assignmentData, setAssignmentData] = useState({
    fichaId: '',
    subject: '',
    description: ''
  });

  useEffect(() => {
    loadInstructors();
    loadAvailableFichas();
  }, []);

  const loadInstructors = async () => {
    try {
      setLoading(true);
      setError('');
      
      const response = await userService.getUsers(1, 100, { role: 'Instructor' });
      
      if (!response || !Array.isArray(response.users)) {
        console.warn('Respuesta inválida del servidor:', response);
        setInstructors([]);
        return;
      }
      
      const users = response.users;
      
      const instructorUsers = users.filter((user: User) => 
        user.profile?.type?.name === 'Instructor' || 
        user.roles?.some((role: { name: string }) => role.name === 'Instructor')
      );
      
      setInstructors(instructorUsers);
      console.log('✅ Instructores cargados:', instructorUsers.length);
      
    } catch (error: any) {
      if (error.isCanceled || error.message === 'canceled') {
        console.log('🚫 loadInstructors - Petición cancelada, ignorando');
        return;
      }
      
      console.error('❌ Error al cargar instructores:', error);
      setError('Error al cargar la lista de instructores');
      setInstructors([]);
    } finally {
      setLoading(false);
    }
  };

  const loadAvailableFichas = async () => {
    try {
      setLoadingAvailableFichas(true);
      console.log('📡 Cargando fichas disponibles...');
      
      const fichas = await userService.getFichas();
      setAvailableFichas(fichas);
      
      console.log('✅ Fichas disponibles cargadas:', fichas.length, fichas);
    } catch (error: any) {
      console.error('❌ Error al cargar fichas disponibles:', error);
      setError('Error al cargar fichas disponibles');
    } finally {
      setLoadingAvailableFichas(false);
    }
  };

  const handleSelectInstructor = async (instructorId: number) => {
    try {
      console.log('🎯 Instructor seleccionado:', instructorId);
      setSelectedInstructorId(instructorId);
      setLoadingFichas(true);
      setError('');
      setSuccess('');
      
      const fichas = await instructorAssignmentService.getInstructorFichas(instructorId);
      setInstructorFichas(fichas);
      
      console.log('✅ Estado actualizado - selectedInstructorId:', instructorId);
      console.log('✅ Fichas cargadas:', fichas);
      
    } catch (error: any) {
      console.error('❌ Error al cargar fichas del instructor:', error);
      setError(error.response?.data?.message || 'Error al cargar las fichas del instructor');
      setInstructorFichas([]);
    } finally {
      setLoadingFichas(false);
    }
  };

  const handleAssignFicha = async () => {
    if (!selectedInstructorId || !assignmentData.fichaId || !assignmentData.subject) {
      setError('Por favor completa todos los campos requeridos');
      return;
    }

    try {
      setError('');
      
      await instructorAssignmentService.assignInstructorToFicha({
        instructorId: selectedInstructorId,
        fichaId: parseInt(assignmentData.fichaId),
        subject: assignmentData.subject,
        description: assignmentData.description
      });
      
      // Recargar fichas después de asignar
      await handleSelectInstructor(selectedInstructorId);
      
      // Limpiar formulario y cerrar modal
      setAssignmentData({ fichaId: '', subject: '', description: '' });
      setShowAssignModal(false);
      setSuccess('Ficha asignada exitosamente');
      
      // Limpiar mensaje de éxito después de 3 segundos
      setTimeout(() => setSuccess(''), 3000);
      
    } catch (error: any) {
      console.error('❌ Error al asignar ficha:', error);
      setError(error.response?.data?.message || 'Error al asignar la ficha');
    }
  };

  const handleRemoveAssignment = async (assignmentId: number) => {
    if (!confirm('¿Estás seguro de que deseas eliminar esta asignación?')) {
      return;
    }

    try {
      await instructorAssignmentService.removeAssignment(assignmentId);
      
      // Recargar fichas después de eliminar
      if (selectedInstructorId) {
        await handleSelectInstructor(selectedInstructorId);
      }
      
      setSuccess('Asignación eliminada exitosamente');
      setTimeout(() => setSuccess(''), 3000);
      
    } catch (error: any) {
      console.error('❌ Error al eliminar asignación:', error);
      setError(error.response?.data?.message || 'Error al eliminar la asignación');
    }
  };

  const getSelectedInstructorName = () => {
    const instructor = instructors.find(i => i.id === selectedInstructorId);
    return instructor ? `${instructor.profile.firstName} ${instructor.profile.lastName}` : '';
  };

  const getAvailableFichasForAssignment = () => {
    // Filtrar fichas que no están ya asignadas al instructor
    const assignedFichaIds = instructorFichas.map(assignment => assignment.fichaId);
    return availableFichas.filter(ficha => !assignedFichaIds.includes(ficha.id));
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
        {/* ⭐ HEADER ACTUALIZADO CON BOTÓN */}
        <div className="mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Gestión de Instructores
              </h1>
              <p className="text-gray-600">
                Asigna fichas a los instructores y gestiona sus responsabilidades
              </p>
            </div>
            {/* ⭐ BOTÓN PARA IR A HORARIOS POR TRIMESTRE */}
            <button
              onClick={() => navigate('/trimester-schedules')}
              className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 font-medium flex items-center gap-2 transition-colors"
            >
              📅 Gestionar Horarios por Trimestre
            </button>
          </div>
        </div>

        {success && (
          <div className="bg-green-50 border border-green-200 rounded-md p-4 mb-6">
            <div className="text-green-800">
              <p className="text-sm font-medium">Éxito:</p>
              <p className="text-sm">{success}</p>
            </div>
          </div>
        )}

        {/* ⭐ DEBUG INFO - TEMPORAL */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3 mb-6">
          <p className="text-xs text-yellow-800">
            🔍 DEBUG - selectedInstructorId: {selectedInstructorId || 'null'} | 
            loadingAvailableFichas: {loadingAvailableFichas.toString()} | 
            availableFichas: {availableFichas.length}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Lista de Instructores */}
          <div className="bg-white rounded-lg shadow-sm">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">
                Instructores Disponibles ({instructors.length})
              </h2>
            </div>
            <div className="p-6">
              {instructors.length === 0 ? (
                <p className="text-gray-500 text-center py-4">
                  No hay instructores registrados
                </p>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {instructors.map((instructor: User) => (
                    <div
                      key={instructor.id}
                      className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                        selectedInstructorId === instructor.id
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => handleSelectInstructor(instructor.id)}
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <h3 className="font-medium text-gray-900">
                            {instructor.profile?.firstName} {instructor.profile?.lastName}
                          </h3>
                          <p className="text-sm text-gray-500">
                            {instructor.email}
                          </p>
                          <p className="text-xs text-gray-400">
                            Doc: {instructor.profile?.documentNumber}
                          </p>
                        </div>
                        <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                          instructor.isActive
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {instructor.isActive ? 'Activo' : 'Inactivo'}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Fichas del Instructor Seleccionado */}
          <div className="bg-white rounded-lg shadow-sm">
            {/* ⭐ HEADER CON BOTÓN - ESTA PARTE FALTABA EN TU CÓDIGO */}
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-lg font-semibold text-gray-900">
                Fichas Asignadas
              </h2>
              {/* ⭐ BOTÓN ASIGNAR FICHA */}
              {selectedInstructorId && (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500">
                    ID: {selectedInstructorId}
                  </span>
                  <button
                    onClick={() => {
                      console.log('🔘 Botón Asignar Ficha clickeado');
                      setShowAssignModal(true);
                    }}
                    disabled={loadingAvailableFichas}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm font-medium disabled:opacity-50"
                  >
                    {loadingAvailableFichas ? 'Cargando...' : 'Asignar Ficha'}
                  </button>
                </div>
              )}
            </div>

            <div className="p-6">
              {!selectedInstructorId ? (
                <p className="text-gray-500 text-center py-8">
                  Selecciona un instructor para ver sus fichas asignadas
                </p>
              ) : loadingFichas ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : instructorFichas.length === 0 ? (
                <p className="text-gray-500 text-center py-8">
                  Este instructor no tiene fichas asignadas
                </p>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {instructorFichas.map((assignment: InstructorAssignment) => (
                    <div
                      key={assignment.id}
                      className="p-4 border border-gray-200 rounded-lg"
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h3 className="font-medium text-gray-900">
                            {assignment.ficha.name}
                          </h3>
                          <p className="text-sm text-gray-600">
                            Código: {assignment.ficha.code}
                          </p>
                          <p className="text-sm text-gray-600">
                            Materia: {assignment.subject}
                          </p>
                          {assignment.description && (
                            <p className="text-xs text-gray-500 mt-1">
                              {assignment.description}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                            assignment.isActive
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {assignment.isActive ? 'Activa' : 'Inactiva'}
                          </div>
                          <button
                            onClick={() => handleRemoveAssignment(assignment.id)}
                            className="text-red-600 hover:text-red-800 text-sm p-1"
                            title="Eliminar asignación"
                          >
                            ✕
                          </button>
                        </div>
                      </div>
                      <div className="mt-2 text-xs text-gray-400">
                        Asignado: {new Date(assignment.assignedAt).toLocaleDateString('es-CO')}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ⭐ MODAL DE ASIGNACIÓN - ESTA PARTE COMPLETA FALTABA */}
        {showAssignModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Asignar Ficha a {getSelectedInstructorName()}
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Ficha *
                  </label>
                  <select
                    value={assignmentData.fichaId}
                    onChange={(e) => setAssignmentData({...assignmentData, fichaId: e.target.value})}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={loadingAvailableFichas}
                  >
                    <option value="">Seleccionar ficha...</option>
                    {getAvailableFichasForAssignment().map((ficha) => (
                      <option key={ficha.id} value={ficha.id}>
                        {ficha.code} - {ficha.name}
                      </option>
                    ))}
                  </select>
                  {getAvailableFichasForAssignment().length === 0 && (
                    <p className="text-xs text-gray-500 mt-1">
                      No hay fichas disponibles para asignar
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Materia *
                  </label>
                  <input
                    type="text"
                    value={assignmentData.subject}
                    onChange={(e) => setAssignmentData({...assignmentData, subject: e.target.value})}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Ej: Programación Web"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Descripción
                  </label>
                  <textarea
                    value={assignmentData.description}
                    onChange={(e) => setAssignmentData({...assignmentData, description: e.target.value})}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={3}
                    placeholder="Descripción opcional..."
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => {
                    setShowAssignModal(false);
                    setAssignmentData({ fichaId: '', subject: '', description: '' });
                    setError('');
                  }}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleAssignFicha}
                  disabled={!assignmentData.fichaId || !assignmentData.subject}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  Asignar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default InstructorManagement;
