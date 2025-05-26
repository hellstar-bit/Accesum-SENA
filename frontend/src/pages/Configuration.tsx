// frontend/src/pages/Configuration.tsx
import { useState, useEffect } from 'react';
import { configService } from '../services/configService';
import type { 
  Role, 
  PersonnelType, 
  Regional, 
  Center, 
  Coordination, 
  Program
} from '../services/configService';

type TabType = 'roles' | 'personnel-types' | 'regionales' | 'centers' | 'coordinations' | 'programs';

interface FormModalProps<T> {
  isOpen: boolean;
  title: string;
  item?: T | null;
  onClose: () => void;
  onSave: (data: any) => Promise<void>;
  children: React.ReactNode;
}

const FormModal = <T,>({ isOpen, title, onClose, children }: FormModalProps<T>) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
};

const Configuration = () => {
  const [activeTab, setActiveTab] = useState<TabType>('roles');
  const [loading, setLoading] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Data states
  const [roles, setRoles] = useState<Role[]>([]);
  const [personnelTypes, setPersonnelTypes] = useState<PersonnelType[]>([]);
  const [regionales, setRegionales] = useState<Regional[]>([]);
  const [centers, setCenters] = useState<Center[]>([]);
  const [coordinations, setCoordinations] = useState<Coordination[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);

  // Modal states
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [formData, setFormData] = useState<any>({});

  // Load data based on active tab
  useEffect(() => {
    loadData();
  }, [activeTab, refreshTrigger]);

  const loadData = async () => {
    setLoading(true);
    try {
      switch (activeTab) {
        case 'roles':
          const rolesData = await configService.getRoles();
          setRoles(rolesData);
          break;
        case 'personnel-types':
          const typesData = await configService.getPersonnelTypes();
          setPersonnelTypes(typesData);
          break;
        case 'regionales':
          const regionalesData = await configService.getRegionales();
          setRegionales(regionalesData);
          break;
        case 'centers':
          const [centersData, regionalesForCenters] = await Promise.all([
            configService.getCenters(),
            configService.getRegionales()
          ]);
          setCenters(centersData);
          setRegionales(regionalesForCenters);
          break;
        case 'coordinations':
          const [coordinationsData, centersForCoordinations] = await Promise.all([
            Promise.all((await configService.getCenters()).map(center => 
              configService.getCoordinationsByCenter(center.id)
            )).then(arrays => arrays.flat()),
            configService.getCenters()
          ]);
          setCoordinations(coordinationsData);
          setCenters(centersForCoordinations);
          break;
        case 'programs':
          const hierarchy = await configService.getHierarchy();
          setPrograms(hierarchy.programs);
          setCoordinations(hierarchy.coordinations);
          break;
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingItem(null);
    setFormData({});
    setModalOpen(true);
  };

  const handleEdit = (item: any) => {
    setEditingItem(item);
    setFormData({ ...item });
    setModalOpen(true);
  };

  const handleDelete = async (item: any) => {
    if (!confirm(`¿Estás seguro de eliminar "${item.name}"?`)) return;

    try {
      switch (activeTab) {
        case 'roles':
          await configService.deleteRole(item.id);
          break;
        case 'personnel-types':
          await configService.deletePersonnelType(item.id);
          break;
        case 'regionales':
          await configService.deleteRegional(item.id);
          break;
        case 'centers':
          await configService.deleteCenter(item.id);
          break;
        case 'coordinations':
          await configService.deleteCoordination(item.id);
          break;
        case 'programs':
          await configService.deleteProgram(item.id);
          break;
      }
      setRefreshTrigger(prev => prev + 1);
    } catch (error: any) {
      alert(error.response?.data?.message || 'Error al eliminar');
    }
  };

  const handleSave = async (data: any) => {
    try {
      if (editingItem) {
        // Update
        switch (activeTab) {
          case 'roles':
            await configService.updateRole(editingItem.id, data);
            break;
          case 'personnel-types':
            await configService.updatePersonnelType(editingItem.id, data);
            break;
          case 'regionales':
            await configService.updateRegional(editingItem.id, data);
            break;
          case 'centers':
            await configService.updateCenter(editingItem.id, data);
            break;
          case 'coordinations':
            await configService.updateCoordination(editingItem.id, data);
            break;
          case 'programs':
            await configService.updateProgram(editingItem.id, data);
            break;
        }
      } else {
        // Create
        switch (activeTab) {
          case 'roles':
            await configService.createRole(data);
            break;
          case 'personnel-types':
            await configService.createPersonnelType(data);
            break;
          case 'regionales':
            await configService.createRegional(data);
            break;
          case 'centers':
            await configService.createCenter(data);
            break;
          case 'coordinations':
            await configService.createCoordination(data);
            break;
          case 'programs':
            await configService.createProgram(data);
            break;
        }
      }
      setModalOpen(false);
      setRefreshTrigger(prev => prev + 1);
    } catch (error: any) {
      alert(error.response?.data?.message || 'Error al guardar');
    }
  };

  const handleModalSave = async () => {
    await handleSave(formData);
  };

  const tabs = [
    { id: 'roles' as TabType, name: '🔐 Roles', icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z' },
    { id: 'personnel-types' as TabType, name: '👥 Tipos Personal', icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857' },
    { id: 'regionales' as TabType, name: '🌎 Regionales', icon: 'M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064' },
    { id: 'centers' as TabType, name: '🏛️ Centros', icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4' },
    { id: 'coordinations' as TabType, name: '📊 Coordinaciones', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2' },
    { id: 'programs' as TabType, name: '🎓 Programas', icon: 'M12 14l9-5-9-5-9 5 9 5z M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z' },
  ];

  const getCurrentData = () => {
    switch (activeTab) {
      case 'roles': return roles;
      case 'personnel-types': return personnelTypes;
      case 'regionales': return regionales;
      case 'centers': return centers;
      case 'coordinations': return coordinations;
      case 'programs': return programs;
      default: return [];
    }
  };

  const getModalTitle = () => {
    const action = editingItem ? 'Editar' : 'Crear';
    switch (activeTab) {
      case 'roles': return `${action} Rol`;
      case 'personnel-types': return `${action} Tipo de Personal`;
      case 'regionales': return `${action} Regional`;
      case 'centers': return `${action} Centro`;
      case 'coordinations': return `${action} Coordinación`;
      case 'programs': return `${action} Programa`;
      default: return action;
    }
  };

  const renderForm = () => {
    switch (activeTab) {
      case 'roles':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nombre *</label>
              <input
                type="text"
                value={formData.name || ''}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="input-field"
                placeholder="Ej: Supervisor"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
              <textarea
                value={formData.description || ''}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="input-field"
                rows={3}
                placeholder="Descripción del rol..."
              />
            </div>
            <div className="flex justify-end space-x-3">
              <button onClick={() => setModalOpen(false)} className="btn-secondary">
                Cancelar
              </button>
              <button 
                onClick={handleModalSave} 
                className="btn-primary"
                disabled={!formData.name?.trim()}
              >
                {editingItem ? 'Actualizar' : 'Crear'}
              </button>
            </div>
          </div>
        );

      case 'personnel-types':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nombre *</label>
              <input
                type="text"
                value={formData.name || ''}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="input-field"
                placeholder="Ej: Docente"
              />
            </div>
            <div className="flex justify-end space-x-3">
              <button onClick={() => setModalOpen(false)} className="btn-secondary">
                Cancelar
              </button>
              <button 
                onClick={handleModalSave} 
                className="btn-primary"
                disabled={!formData.name?.trim()}
              >
                {editingItem ? 'Actualizar' : 'Crear'}
              </button>
            </div>
          </div>
        );

      case 'regionales':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nombre *</label>
              <input
                type="text"
                value={formData.name || ''}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="input-field"
                placeholder="Ej: Regional Cundinamarca"
              />
            </div>
            <div className="flex justify-end space-x-3">
              <button onClick={() => setModalOpen(false)} className="btn-secondary">
                Cancelar
              </button>
              <button 
                onClick={handleModalSave} 
                className="btn-primary"
                disabled={!formData.name?.trim()}
              >
                {editingItem ? 'Actualizar' : 'Crear'}
              </button>
            </div>
          </div>
        );

      case 'centers':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nombre *</label>
              <input
                type="text"
                value={formData.name || ''}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="input-field"
                placeholder="Ej: Centro de Biotecnología Industrial"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Regional *</label>
              <select
                value={formData.regionalId || ''}
                onChange={(e) => setFormData({ ...formData, regionalId: parseInt(e.target.value) })}
                className="input-field"
              >
                <option value="">Seleccionar regional</option>
                {regionales.map((regional) => (
                  <option key={regional.id} value={regional.id}>
                    {regional.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex justify-end space-x-3">
              <button onClick={() => setModalOpen(false)} className="btn-secondary">
                Cancelar
              </button>
              <button 
                onClick={handleModalSave} 
                className="btn-primary"
                disabled={!formData.name?.trim() || !formData.regionalId}
              >
                {editingItem ? 'Actualizar' : 'Crear'}
              </button>
            </div>
          </div>
        );

      case 'coordinations':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nombre *</label>
              <input
                type="text"
                value={formData.name || ''}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="input-field"
                placeholder="Ej: Coordinación Académica"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Centro *</label>
              <select
                value={formData.centerId || ''}
                onChange={(e) => setFormData({ ...formData, centerId: parseInt(e.target.value) })}
                className="input-field"
              >
                <option value="">Seleccionar centro</option>
                {centers.map((center) => (
                  <option key={center.id} value={center.id}>
                    {center.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex justify-end space-x-3">
              <button onClick={() => setModalOpen(false)} className="btn-secondary">
                Cancelar
              </button>
              <button 
                onClick={handleModalSave} 
                className="btn-primary"
                disabled={!formData.name?.trim() || !formData.centerId}
              >
                {editingItem ? 'Actualizar' : 'Crear'}
              </button>
            </div>
          </div>
        );

      case 'programs':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nombre *</label>
              <input
                type="text"
                value={formData.name || ''}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="input-field"
                placeholder="Ej: Tecnología en Sistemas"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Coordinación *</label>
              <select
                value={formData.coordinationId || ''}
                onChange={(e) => setFormData({ ...formData, coordinationId: parseInt(e.target.value) })}
                className="input-field"
              >
                <option value="">Seleccionar coordinación</option>
                {coordinations.map((coordination) => (
                  <option key={coordination.id} value={coordination.id}>
                    {coordination.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex justify-end space-x-3">
              <button onClick={() => setModalOpen(false)} className="btn-secondary">
                Cancelar
              </button>
              <button 
                onClick={handleModalSave} 
                className="btn-primary"
                disabled={!formData.name?.trim() || !formData.coordinationId}
              >
                {editingItem ? 'Actualizar' : 'Crear'}
              </button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const renderTable = () => {
    const data = getCurrentData();

    if (loading) {
      return (
        <div className="flex justify-center items-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-sena-green"></div>
          <span className="ml-2">Cargando...</span>
        </div>
      );
    }

    if (data.length === 0) {
      return (
        <div className="text-center py-8">
          <p className="text-gray-500">No hay registros</p>
        </div>
      );
    }

    return (
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Nombre
              </th>
              {activeTab === 'roles' && (
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Descripción
                </th>
              )}
              {activeTab === 'centers' && (
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Regional
                </th>
              )}
              {activeTab === 'coordinations' && (
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Centro
                </th>
              )}
              {activeTab === 'programs' && (
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Coordinación
                </th>
              )}
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {data.map((item) => (
              <tr key={item.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">{item.name}</div>
                </td>
                {activeTab === 'roles' && (
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{(item as Role).description || '-'}</div>
                  </td>
                )}
                {activeTab === 'centers' && (
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{(item as Center).regional?.name || '-'}</div>
                  </td>
                )}
                {activeTab === 'coordinations' && (
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{(item as Coordination).center?.name || '-'}</div>
                  </td>
                )}
                {activeTab === 'programs' && (
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{(item as Program).coordination?.name || '-'}</div>
                  </td>
                )}
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <button
                    onClick={() => handleEdit(item)}
                    className="text-blue-600 hover:text-blue-900 mr-3"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => handleDelete(item)}
                    className="text-red-600 hover:text-red-900"
                  >
                    Eliminar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-gray-800">Configuración del Sistema</h1>
        <p className="text-gray-600 mt-1">Administra la estructura organizacional y configuraciones</p>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow">
        <div className="border-b">
          <nav className="flex -mb-px overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center py-4 px-6 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'border-sena-green text-sena-green'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={tab.icon} />
                </svg>
                {tab.name}
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-semibold text-gray-800">
              {tabs.find(tab => tab.id === activeTab)?.name}
            </h2>
            <button onClick={handleCreate} className="btn-primary">
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
              </svg>
              Crear Nuevo
            </button>
          </div>

          {renderTable()}
        </div>
      </div>

      {/* Modal */}
      <FormModal
        isOpen={modalOpen}
        title={getModalTitle()}
        item={editingItem}
        onClose={() => setModalOpen(false)}
        onSave={handleSave}
      >
        {renderForm()}
      </FormModal>
    </div>
  );
};

export default Configuration;