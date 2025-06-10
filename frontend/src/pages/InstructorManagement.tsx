// frontend/src/pages/InstructorManagement.tsx
import React, { useState, useEffect } from 'react';
// ⭐ Importación tipo-only para evitar error TS1484
import type { InstructorAssignment } from '../services/instructorAssignmentService';
import { instructorAssignmentService } from '../services/instructorAssignmentService';
import { userService } from '../services/userService';

// ⭐ Definir interfaces explícitas para evitar 'any'
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

interface UserFilters {
  search?: string;
  role?: string;
  isActive?: boolean;
  typeId?: number;
}

const InstructorManagement: React.FC = () => {
  const [instructors, setInstructors] = useState<User[]>([]);
  const [selectedInstructorId, setSelectedInstructorId] = useState<number | null>(null);
  const [instructorFichas, setInstructorFichas] = useState<InstructorAssignment[]>([]);
  const [loadingFichas, setLoadingFichas] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    loadInstructors();
  }, []);

  const loadInstructors = async () => {
    try {
      setLoading(true);
      setError('');
      
      // ⭐ Usar getUsers en lugar de getAllUsers
      const response = await userService.getUsers(1, 100, { role: 'Instructor' });
      const users = response.users;
      
      // ⭐ Filtrar instructores con tipado explícito
      const instructorUsers = users.filter((user: User) => 
        user.profile?.type?.name === 'Instructor' || 
        user.roles?.some((role: { name: string }) => role.name === 'Instructor')
      );
      
      setInstructors(instructorUsers);
    } catch (error) {
      console.error('Error al cargar instructores:', error);
      setError('Error al cargar la lista de instructores');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectInstructor = async (instructorId: number) => {
    try {
      setSelectedInstructorId(instructorId);
      setLoadingFichas(true);
      setError('');
      
      const fichas = await instructorAssignmentService.getInstructorFichas(instructorId);
      setInstructorFichas(fichas);
      
      console.log('Fichas cargadas para instructor:', instructorId, fichas);
      
    } catch (error: any) {
      console.error('Error al cargar fichas del instructor:', error);
      setError(error.response?.data?.message || 'Error al cargar las fichas del instructor');
      setInstructorFichas([]);
    } finally {
      setLoadingFichas(false);
    }
  };

  const handleAssignFicha = async (fichaId: number, subject: string, description?: string) => {
    if (!selectedInstructorId) return;

    try {
      await instructorAssignmentService.assignInstructorToFicha({
        instructorId: selectedInstructorId,
        fichaId,
        subject,
        description
      });
      
      // Recargar fichas después de asignar
      await handleSelectInstructor(selectedInstructorId);
    } catch (error: any) {
      console.error('Error al asignar ficha:', error);
      setError(error.response?.data?.message || 'Error al asignar la ficha');
    }
  };

  const handleRemoveAssignment = async (assignmentId: number) => {
    try {
      await instructorAssignmentService.removeAssignment(assignmentId);
      
      // Recargar fichas después de eliminar
      if (selectedInstructorId) {
        await handleSelectInstructor(selectedInstructorId);
      }
    } catch (error: any) {
      console.error('Error al eliminar asignación:', error);
      setError(error.response?.data?.message || 'Error al eliminar la asignación');
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
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Gestión de Instructores
          </h1>
          <p className="text-gray-600">
            Asigna fichas a los instructores y gestiona sus responsabilidades
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
            <div className="text-red-800">
              <p className="text-sm font-medium">Error:</p>
              <p className="text-sm">{error}</p>
            </div>
          </div>
        )}

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
                <div className="space-y-3">
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
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">
                Fichas Asignadas
              </h2>
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
                <div className="space-y-3">
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
                            className="text-red-600 hover:text-red-800 text-sm"
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
      </div>
    </div>
  );
};

export default InstructorManagement;
