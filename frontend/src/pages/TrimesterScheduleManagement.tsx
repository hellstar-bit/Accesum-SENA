// frontend/src/pages/TrimesterScheduleManagement.tsx
import React, { useState, useEffect } from 'react';
import { scheduleService } from '../services/scheduleService';
import FichaCompetenceManagement from '../components/ficha/FichaCompetenceManagement';

interface TimeSlot {
  id?: number;
  startTime: string;
  endTime: string;
  fichaId: number;
  instructorId: number;
  competenceId: number;
  classroom?: string;
  subject: string;
  assignmentId?: number;
  // ✅ AGREGAR ESTAS PROPIEDADES PARA LOS DATOS DEL BACKEND
  competence?: {
    id: number;
    name: string;
    code?: string;
  };
  instructor?: {
    id: number;
    name: string;
  };
}
interface TrimesterSchedule {
  LUNES: TimeSlot[];
  MARTES: TimeSlot[];
  MIERCOLES: TimeSlot[];
  JUEVES: TimeSlot[];
  VIERNES: TimeSlot[];
  SABADO: TimeSlot[];
  [key: string]: TimeSlot[];
}

interface Competence {
  id: number;
  name: string;
  code: string;
  programId: number;
  hours?: number;
  description?: string;
}

interface Instructor {
  id: number;
  name: string;
  email: string;
  competences: Competence[];
  assignments: Array<{
    id: number;
    fichaId: number;
    subject: string;
    ficha: Ficha;
  }>;
}

interface Ficha {
  id: number;
  code: string;
  name: string;
  status: string;
  programId?: number;
  competences: Competence[];
  program?: {
    id: number;
    name: string;
    code: string;
  };
}

const TrimesterScheduleManagement: React.FC = () => {
  const [trimesterSchedule, setTrimesterSchedule] = useState<TrimesterSchedule>({
    LUNES: [],
    MARTES: [],
    MIERCOLES: [],
    JUEVES: [],
    VIERNES: [],
    SABADO: []
  });

  const [instructors, setInstructors] = useState<Instructor[]>([]);
  const [fichas, setFichas] = useState<Ficha[]>([]);
  const [competences, setCompetences] = useState<Competence[]>([]);
  const [selectedTrimester, setSelectedTrimester] = useState<string>('2025-1');
  const [selectedFicha, setSelectedFicha] = useState<number | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showCompetenceModal, setShowCompetenceModal] = useState(false);
  const [showCreateCompetenceModal, setShowCreateCompetenceModal] = useState(false);
  const [selectedDay, setSelectedDay] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [newScheduleBlock, setNewScheduleBlock] = useState({
    startTime: '',
    endTime: '',
    competenceId: '',
    instructorId: '',
    classroom: ''
  });

  const [newCompetence, setNewCompetence] = useState({
    name: '',
    code: '',
    description: '',
    hours: 240,
    instructorIds: [] as number[]
  });

  const daysOfWeek = [
    { key: 'LUNES', label: 'Lunes' },
    { key: 'MARTES', label: 'Martes' },
    { key: 'MIERCOLES', label: 'Miércoles' },
    { key: 'JUEVES', label: 'Jueves' },
    { key: 'VIERNES', label: 'Viernes' },
    { key: 'SABADO', label: 'Sábado' }
  ];

  const trimesters = [
    { value: '2024-1', label: '2024 - Trimestre 1' },
    { value: '2024-2', label: '2024 - Trimestre 2' },
    { value: '2024-3', label: '2024 - Trimestre 3' },
    { value: '2024-4', label: '2024 - Trimestre 4' },
    { value: '2025-1', label: '2025 - Trimestre 1' },
    { value: '2025-2', label: '2025 - Trimestre 2' }
  ];

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    if (selectedFicha && selectedTrimester) {
      loadTrimesterSchedule();
    }
  }, [selectedFicha, selectedTrimester]);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      const [instructorsData, fichasData, competencesData] = await Promise.all([
        scheduleService.getInstructorsWithCompetences(),
        scheduleService.getFichasWithCompetences(),
        scheduleService.getAllCompetences()
      ]);
      
      setInstructors(instructorsData);
      setFichas(fichasData);
      setCompetences(competencesData);
    } catch (error: any) {
      setError('Error al cargar datos iniciales');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const loadTrimesterSchedule = async () => {
    if (!selectedFicha) return;

    try {
      setLoading(true);
      console.log(`🔄 Frontend: Cargando horarios para ficha ${selectedFicha}, trimestre ${selectedTrimester}`);
      
      const scheduleData = await scheduleService.getTrimesterSchedule(
        selectedFicha,
        selectedTrimester
      );
      
      console.log('🔍 Frontend: Datos recibidos del backend:', scheduleData);

      const mappedSchedule: TrimesterSchedule = {
        LUNES: [],
        MARTES: [],
        MIERCOLES: [],
        JUEVES: [],
        VIERNES: [],
        SABADO: []
      };

      Object.keys(scheduleData).forEach((day: string) => {
        if (Array.isArray(scheduleData[day])) {
          mappedSchedule[day] = scheduleData[day].map((block: any): TimeSlot => {
            console.log(`🔍 Frontend: Mapeando bloque para ${day}:`, block);
            
            return {
              id: block.id,
              startTime: block.startTime,
              endTime: block.endTime,
              fichaId: block.fichaId || selectedFicha,
              instructorId: block.instructor?.id || block.instructorId,
              competenceId: block.competence?.id || block.competenceId,
              classroom: block.classroom,
              subject: block.competence?.name || 'Sin competencia',
              assignmentId: block.assignmentId,
              // ✅ AGREGAR REFERENCIAS DIRECTAS PARA FÁCIL ACCESO
              competence: block.competence,
              instructor: block.instructor
            };
          });
        }
      });

      console.log('✅ Frontend: Horarios mapeados exitosamente:', mappedSchedule);
      setTrimesterSchedule(mappedSchedule);
    } catch (error: any) {
      setError('Error al cargar horarios del trimestre');
      console.error('❌ Frontend: Error al cargar horarios:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCompetenceManagementClose = async () => {
    setShowCompetenceModal(false);
    try {
      const fichasData = await scheduleService.getFichasWithCompetences();
      setFichas(fichasData);
      
      if (selectedFicha) {
        await loadTrimesterSchedule();
      }
    } catch (error) {
      console.error('Error al recargar fichas:', error);
    }
  };

  const handleCreateCompetence = async () => {
    if (!newCompetence.name || !newCompetence.code || newCompetence.instructorIds.length === 0) {
      setError('Por favor completa todos los campos requeridos');
      return;
    }

    try {
      await scheduleService.createCompetence({
        ...newCompetence,
        programId: 1
      });

      await loadInitialData();
      
      setNewCompetence({ name: '', code: '', description: '', hours: 240, instructorIds: [] });
      setShowCreateCompetenceModal(false);
      setSuccess('Competencia creada exitosamente');
      setTimeout(() => setSuccess(''), 3000);

    } catch (error: any) {
      setError(error.response?.data?.message || 'Error al crear competencia');
    }
  };

  const handleAddScheduleBlock = async () => {
    if (!newScheduleBlock.startTime || !newScheduleBlock.endTime || 
        !newScheduleBlock.competenceId || !newScheduleBlock.instructorId || !selectedFicha) {
      setError('Por favor completa todos los campos requeridos');
      return;
    }

    try {
      const result = await scheduleService.createTrimesterSchedule({
        dayOfWeek: selectedDay,
        startTime: newScheduleBlock.startTime,
        endTime: newScheduleBlock.endTime,
        competenceId: parseInt(newScheduleBlock.competenceId),
        instructorId: parseInt(newScheduleBlock.instructorId),
        fichaId: selectedFicha,
        classroom: newScheduleBlock.classroom,
        trimester: selectedTrimester
      });

      const newBlock: TimeSlot = {
        id: result.id || Date.now(),
        startTime: newScheduleBlock.startTime,
        endTime: newScheduleBlock.endTime,
        fichaId: selectedFicha,
        instructorId: parseInt(newScheduleBlock.instructorId),
        competenceId: parseInt(newScheduleBlock.competenceId),
        classroom: newScheduleBlock.classroom,
        subject: getCompetenceName(parseInt(newScheduleBlock.competenceId))
      };

      setTrimesterSchedule(prev => ({
        ...prev,
        [selectedDay]: [...(prev[selectedDay as keyof TrimesterSchedule] || []), newBlock]
      }));

      setShowAddModal(false);
      setNewScheduleBlock({ startTime: '', endTime: '', competenceId: '', instructorId: '', classroom: '' });
      setSuccess('Bloque de horario agregado exitosamente');
      setTimeout(() => setSuccess(''), 3000);

    } catch (error: any) {
      setError(error.response?.data?.message || 'Error al crear bloque de horario');
    }
  };

  const handleDeleteScheduleBlock = async (scheduleId: number) => {
    if (!confirm('¿Estás seguro de eliminar este bloque de horario?')) return;

    try {
      await scheduleService.deleteTrimesterSchedule(scheduleId);
      await loadTrimesterSchedule();
      setSuccess('Bloque eliminado exitosamente');
      setTimeout(() => setSuccess(''), 3000);
    } catch (error: any) {
      setError('Error al eliminar bloque de horario');
    }
  };

  const getCompetenceColor = (competenceId: number): string => {
    const colors = [
      'bg-blue-100 border-blue-300 text-blue-800',
      'bg-green-100 border-green-300 text-green-800',
      'bg-purple-100 border-purple-300 text-purple-800',
      'bg-orange-100 border-orange-300 text-orange-800',
      'bg-pink-100 border-pink-300 text-pink-800',
      'bg-indigo-100 border-indigo-300 text-indigo-800',
      'bg-yellow-100 border-yellow-300 text-yellow-800',
      'bg-red-100 border-red-300 text-red-800'
    ];
    return colors[competenceId % colors.length];
  };

  const checkTimeConflict = (day: string, startTime: string, endTime: string): boolean => {
    const daySchedule = trimesterSchedule[day] || [];
    return daySchedule.some(block => {
      const blockStart = block.startTime;
      const blockEnd = block.endTime;
      return (startTime < blockEnd && endTime > blockStart);
    });
  };

  const getInstructorName = (instructorId: number): string => {
    // Buscar en la lista local de instructores
    const instructor = instructors.find(i => i.id === instructorId);
    return instructor ? instructor.name : 'Instructor no encontrado';
  };

  const getCompetenceName = (competenceId: number): string => {
    // Buscar en la lista local de competencias
    const competence = competences.find(c => c.id === competenceId);
    return competence ? competence.name : 'Competencia no encontrada';
  };

  const getAvailableInstructorsForCompetence = (competenceId: string) => {
    if (!competenceId) return [];
    
    return instructors.filter(instructor => 
      instructor.competences.some(comp => comp.id === parseInt(competenceId))
    );
  };

  const getSelectedFichaCompetences = () => {
    const ficha = fichas.find(f => f.id === selectedFicha);
    return ficha ? ficha.competences : [];
  };

  const getSelectedFichaName = (): string => {
    const ficha = fichas.find(f => f.id === selectedFicha);
    return ficha ? `${ficha.code} - ${ficha.name}` : '';
  };

  if (loading && !Object.keys(trimesterSchedule).length) {
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
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Gestión de Horarios por Trimestre
              </h1>
              <p className="text-gray-600">
                Asigna competencias e instructores por día para cada ficha
              </p>
            </div>
            <button
              onClick={() => window.history.back()}
              className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
            >
              ← Volver
            </button>
          </div>
        </div>

        {/* Mensajes */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
            <p className="text-red-800 text-sm">{error}</p>
          </div>
        )}

        {success && (
          <div className="bg-green-50 border border-green-200 rounded-md p-4 mb-6">
            <p className="text-green-800 text-sm">{success}</p>
          </div>
        )}

        {/* Selectores */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Trimestre:
              </label>
              <select
                value={selectedTrimester}
                onChange={(e) => setSelectedTrimester(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2"
              >
                {trimesters.map(trimester => (
                  <option key={trimester.value} value={trimester.value}>
                    {trimester.label}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Ficha:
              </label>
              <div className="flex items-center gap-2">
                <select
                  value={selectedFicha || ''}
                  onChange={(e) => setSelectedFicha(e.target.value ? parseInt(e.target.value) : null)}
                  className="flex-1 border border-gray-300 rounded-md px-3 py-2"
                >
                  <option value="">Seleccionar ficha...</option>
                  {fichas.map(ficha => (
                    <option key={ficha.id} value={ficha.id}>
                      {ficha.code} - {ficha.name}
                    </option>
                  ))}
                </select>
                
                <button
                  onClick={() => setShowCreateCompetenceModal(true)}
                  className="px-3 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 text-sm font-medium flex items-center gap-1"
                  title="Crear nueva competencia"
                >
                  ➕ Nueva Competencia
                </button>
                
                {selectedFicha && (
                  <button
                    onClick={() => setShowCompetenceModal(true)}
                    className="px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm font-medium flex items-center gap-1"
                    title="Gestionar competencias de la ficha"
                  >
                    ⚙️ Competencias
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {selectedFicha && (
          <>
            {/* Información de la ficha seleccionada */}
            <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mb-6">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="font-semibold text-blue-900">
                    Ficha Seleccionada: {getSelectedFichaName()}
                  </h3>
                  <p className="text-blue-700 text-sm">
                    Competencias asignadas: {getSelectedFichaCompetences().length}
                  </p>
                </div>
                <div className="text-blue-700 text-sm">
                  Trimestre: {selectedTrimester}
                </div>
              </div>
            </div>

            {/* Horario semanal */}
            <div className="bg-white rounded-lg shadow-sm overflow-hidden mb-6">
              <div className="grid grid-cols-6 gap-0 border-b border-gray-200">
                {daysOfWeek.map((day) => (
                  <div key={day.key} className="p-4 bg-gray-50 border-r border-gray-200 last:border-r-0">
                    <div className="text-center">
                      <h3 className="font-semibold text-gray-900">{day.label}</h3>
                      <button
                        onClick={() => {
                          setSelectedDay(day.key);
                          setShowAddModal(true);
                        }}
                        className="mt-2 px-3 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700"
                      >
                        + Agregar Competencia
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-6 gap-0 min-h-96">
                {daysOfWeek.map((day) => (
                  <div key={day.key} className="p-2 border-r border-gray-200 last:border-r-0">
                    <div className="space-y-2">
                      {(trimesterSchedule[day.key as keyof TrimesterSchedule] || [])
                        .sort((a, b) => a.startTime.localeCompare(b.startTime))
                        .map((block: TimeSlot, index: number) => (
                          <div
                            key={block.id || index}
                            className={`p-3 rounded border-l-4 text-xs ${getCompetenceColor(block.competenceId)}`}
                          >
                            <div className="font-medium text-sm">
                              {block.startTime} - {block.endTime}
                            </div>
                            <div className="font-semibold mt-1">
                              {getCompetenceName(block.competenceId)}
                            </div>
                            <div className="text-xs opacity-90 mt-1">
                              👨‍🏫 {getInstructorName(block.instructorId)}
                            </div>
                            {block.classroom && (
                              <div className="text-xs opacity-75 mt-1">
                                📍 {block.classroom}
                              </div>
                            )}
                            <button
                              onClick={() => block.id && handleDeleteScheduleBlock(block.id)}
                              className="mt-2 text-red-600 hover:text-red-800 text-xs"
                            >
                              ✕ Eliminar
                            </button>
                          </div>
                        ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Leyenda de competencias */}
            <div className="bg-white rounded-lg shadow-sm p-4">
              <h3 className="font-semibold text-gray-900 mb-3">
                Competencias de la Ficha: {fichas.find(f => f.id === selectedFicha)?.name}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                {getSelectedFichaCompetences().map((competence) => (
                  <div key={competence.id} className={`p-3 rounded text-sm ${getCompetenceColor(competence.id)}`}>
                    <div className="font-medium">{competence.code}</div>
                    <div className="opacity-90">{competence.name}</div>
                  </div>
                ))}
              </div>
              {getSelectedFichaCompetences().length === 0 && (
                <div className="text-center py-8">
                  <p className="text-gray-500 mb-4">
                    Esta ficha no tiene competencias asignadas
                  </p>
                  <button
                    onClick={() => setShowCompetenceModal(true)}
                    className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                  >
                    Asignar Competencias
                  </button>
                </div>
              )}
            </div>
          </>
        )}

        {/* Modal agregar bloque de horario */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Agregar Competencia - {daysOfWeek.find(d => d.key === selectedDay)?.label}
              </h3>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Hora Inicio *
                    </label>
                    <input
                      type="time"
                      value={newScheduleBlock.startTime}
                      onChange={(e) => setNewScheduleBlock({...newScheduleBlock, startTime: e.target.value})}
                      className="w-full border border-gray-300 rounded-md px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Hora Fin *
                    </label>
                    <input
                      type="time"
                      value={newScheduleBlock.endTime}
                      onChange={(e) => setNewScheduleBlock({...newScheduleBlock, endTime: e.target.value})}
                      className="w-full border border-gray-300 rounded-md px-3 py-2"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Competencia *
                  </label>
                  <select
                    value={newScheduleBlock.competenceId}
                    onChange={(e) => {
                      setNewScheduleBlock({
                        ...newScheduleBlock, 
                        competenceId: e.target.value,
                        instructorId: ''
                      });
                    }}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                  >
                    <option value="">Seleccionar competencia...</option>
                    {getSelectedFichaCompetences().map(competence => (
                      <option key={competence.id} value={competence.id}>
                        {competence.code} - {competence.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Instructor *
                  </label>
                  <select
                    value={newScheduleBlock.instructorId}
                    onChange={(e) => setNewScheduleBlock({...newScheduleBlock, instructorId: e.target.value})}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                    disabled={!newScheduleBlock.competenceId}
                  >
                    <option value="">Seleccionar instructor...</option>
                    {newScheduleBlock.competenceId && 
                     getAvailableInstructorsForCompetence(newScheduleBlock.competenceId).map(instructor => (
                      <option key={instructor.id} value={instructor.id}>
                        {instructor.name}
                      </option>
                    ))}
                  </select>
                  {newScheduleBlock.competenceId && getAvailableInstructorsForCompetence(newScheduleBlock.competenceId).length === 0 && (
                    <p className="text-xs text-red-500 mt-1">
                      No hay instructores disponibles para esta competencia
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Aula
                  </label>
                  <input
                    type="text"
                    value={newScheduleBlock.classroom}
                    onChange={(e) => setNewScheduleBlock({...newScheduleBlock, classroom: e.target.value})}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                    placeholder="Ej: Aula 101"
                  />
                </div>

                {newScheduleBlock.startTime && newScheduleBlock.endTime && 
                 checkTimeConflict(selectedDay, newScheduleBlock.startTime, newScheduleBlock.endTime) && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
                    <p className="text-yellow-800 text-sm">
                      ⚠️ Conflicto de horario detectado para este día
                    </p>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => {
                    setShowAddModal(false);
                    setNewScheduleBlock({ startTime: '', endTime: '', competenceId: '', instructorId: '', classroom: '' });
                    setError('');
                  }}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleAddScheduleBlock}
                  disabled={!newScheduleBlock.startTime || !newScheduleBlock.endTime || 
                           !newScheduleBlock.competenceId || !newScheduleBlock.instructorId}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  Agregar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal de gestión de competencias */}
        {showCompetenceModal && selectedFicha && (
          <FichaCompetenceManagement
            fichaId={selectedFicha}
            fichaName={getSelectedFichaName()}
            onClose={handleCompetenceManagementClose}
          />
        )}

        {/* Modal para crear competencia */}
        {showCreateCompetenceModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Crear Nueva Competencia
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Código *
                  </label>
                  <input
                    type="text"
                    value={newCompetence.code}
                    onChange={(e) => setNewCompetence({...newCompetence, code: e.target.value})}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                    placeholder="Ej: 280101001"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nombre *
                  </label>
                  <input
                    type="text"
                    value={newCompetence.name}
                    onChange={(e) => setNewCompetence({...newCompetence, name: e.target.value})}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                    placeholder="Ej: DESARROLLAR SOFTWARE APLICANDO BUENAS PRÁCTICAS"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Horas
                  </label>
                  <input
                    type="number"
                    value={newCompetence.hours}
                    onChange={(e) => setNewCompetence({...newCompetence, hours: parseInt(e.target.value)})}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                    min="1"
                    max="1000"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Instructores Asignados *
                  </label>
                  <div className="max-h-32 overflow-y-auto border border-gray-300 rounded-md p-2">
                    {instructors.map(instructor => (
                      <label key={instructor.id} className="flex items-center space-x-2 py-1">
                        <input
                          type="checkbox"
                          checked={newCompetence.instructorIds.includes(instructor.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setNewCompetence({
                                ...newCompetence,
                                instructorIds: [...newCompetence.instructorIds, instructor.id]
                              });
                            } else {
                              setNewCompetence({
                                ...newCompetence,
                                instructorIds: newCompetence.instructorIds.filter(id => id !== instructor.id)
                              });
                            }
                          }}
                          className="rounded"
                        />
                        <span className="text-sm">{instructor.name}</span>
                      </label>
                    ))}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Selecciona los instructores que pueden enseñar esta competencia
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Descripción
                  </label>
                  <textarea
                    value={newCompetence.description}
                    onChange={(e) => setNewCompetence({...newCompetence, description: e.target.value})}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                    rows={3}
                    placeholder="Descripción de la competencia..."
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => {
                    setShowCreateCompetenceModal(false);
                    setNewCompetence({ name: '', code: '', description: '', hours: 240, instructorIds: [] });
                    setError('');
                  }}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleCreateCompetence}
                  disabled={!newCompetence.name || !newCompetence.code || newCompetence.instructorIds.length === 0}
                  className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50"
                >
                  Crear Competencia
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TrimesterScheduleManagement;
