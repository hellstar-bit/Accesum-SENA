// frontend/src/components/ficha/FichaCompetenceManagement.tsx
import React, { useState, useEffect } from 'react';
import { fichaCompetenceService } from '../../services/fichaCompetenceService';

interface Competence {
  id: number;
  code: string;
  name: string;
  hours: number;
  description?: string;
}

interface FichaCompetence {
  id: number;
  fichaId: number;
  competenceId: number;
  assignedAt: string;
  competence: Competence;
}

interface FichaCompetenceManagementProps {
  fichaId: number;
  fichaName: string;
  onClose: () => void;
}

const FichaCompetenceManagement: React.FC<FichaCompetenceManagementProps> = ({
  fichaId,
  fichaName,
  onClose
}) => {
  const [assignedCompetences, setAssignedCompetences] = useState<FichaCompetence[]>([]);
  const [availableCompetences, setAvailableCompetences] = useState<Competence[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    loadData();
  }, [fichaId]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [assigned, available] = await Promise.all([
        fichaCompetenceService.getFichaCompetences(fichaId),
        fichaCompetenceService.getAvailableCompetences(fichaId)
      ]);
      
      setAssignedCompetences(assigned);
      setAvailableCompetences(available);
    } catch (error: any) {
      setError('Error al cargar competencias');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleAssignCompetence = async (competenceId: number) => {
    try {
      await fichaCompetenceService.assignCompetenceToFicha(fichaId, competenceId);
      await loadData();
      setSuccess('Competencia asignada exitosamente');
      setTimeout(() => setSuccess(''), 3000);
    } catch (error: any) {
      setError(error.response?.data?.message || 'Error al asignar competencia');
    }
  };

  const handleRemoveCompetence = async (competenceId: number) => {
    if (!confirm('¿Estás seguro de remover esta competencia de la ficha?')) return;

    try {
      await fichaCompetenceService.removeCompetenceFromFicha(fichaId, competenceId);
      await loadData();
      setSuccess('Competencia removida exitosamente');
      setTimeout(() => setSuccess(''), 3000);
    } catch (error: any) {
      setError(error.response?.data?.message || 'Error al remover competencia');
    }
  };

  const getTotalHours = () => {
    return assignedCompetences.reduce((total, fc) => total + fc.competence.hours, 0);
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-center">Cargando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-6xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-xl font-semibold text-gray-900">
            Gestionar Competencias - {fichaName}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>

        {/* Mensajes */}
        {error && (
          <div className="mx-6 mt-4 bg-red-50 border border-red-200 rounded-md p-3">
            <p className="text-red-800 text-sm">{error}</p>
          </div>
        )}

        {success && (
          <div className="mx-6 mt-4 bg-green-50 border border-green-200 rounded-md p-3">
            <p className="text-green-800 text-sm">{success}</p>
          </div>
        )}

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Competencias Asignadas */}
            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  Competencias Asignadas ({assignedCompetences.length})
                </h3>
                <span className="text-sm text-gray-600">
                  Total: {getTotalHours()} horas
                </span>
              </div>

              <div className="space-y-3">
                {assignedCompetences.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">
                    No hay competencias asignadas
                  </p>
                ) : (
                  assignedCompetences.map((fc) => (
                    <div
                      key={fc.id}
                      className="border border-gray-200 rounded-lg p-4"
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900">
                            {fc.competence.code}
                          </h4>
                          <p className="text-sm text-gray-600 mt-1">
                            {fc.competence.name}
                          </p>
                          <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                            <span>⏱️ {fc.competence.hours} horas</span>
                            <span>📅 {new Date(fc.assignedAt).toLocaleDateString('es-CO')}</span>
                          </div>
                        </div>
                        <button
                          onClick={() => handleRemoveCompetence(fc.competenceId)}
                          className="text-red-600 hover:text-red-800 text-sm ml-4"
                          title="Remover competencia"
                        >
                          ✕ Remover
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Competencias Disponibles */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Competencias Disponibles ({availableCompetences.length})
              </h3>

              <div className="space-y-3">
                {availableCompetences.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">
                    No hay competencias disponibles para asignar
                  </p>
                ) : (
                  availableCompetences.map((competence) => (
                    <div
                      key={competence.id}
                      className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors"
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900">
                            {competence.code}
                          </h4>
                          <p className="text-sm text-gray-600 mt-1">
                            {competence.name}
                          </p>
                          <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                            <span>⏱️ {competence.hours} horas</span>
                          </div>
                          {competence.description && (
                            <p className="text-xs text-gray-500 mt-2">
                              {competence.description}
                            </p>
                          )}
                        </div>
                        <button
                          onClick={() => handleAssignCompetence(competence.id)}
                          className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 ml-4"
                        >
                          + Asignar
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-600">
              <span className="font-medium">{assignedCompetences.length}</span> competencias asignadas
              • <span className="font-medium">{getTotalHours()}</span> horas totales
            </div>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FichaCompetenceManagement;
