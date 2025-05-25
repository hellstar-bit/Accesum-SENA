// frontend/src/pages/ImportPage.tsx
import { useState } from 'react';
import ImportLearners from '../components/import/ImportLearners';
// Importar tu componente existente si lo tienes
// import ExistingImportComponent from '../components/import/ExistingImportComponent';

const ImportPage = () => {
  const [activeTab, setActiveTab] = useState<'learners' | 'general'>('learners');
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleImportComplete = () => {
    setRefreshTrigger(prev => prev + 1);
    // Aquí puedes agregar lógica adicional como notificaciones
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-gray-800">Importar Datos</h1>
        <p className="text-gray-600 mt-1">Importa usuarios y datos desde archivos Excel</p>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow">
        <div className="border-b">
          <nav className="flex -mb-px">
            <button
              onClick={() => setActiveTab('learners')}
              className={`py-4 px-6 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'learners'
                  ? 'border-sena-green text-sena-green'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              🎓 Aprendices SENA
            </button>
            <button
              onClick={() => setActiveTab('general')}
              className={`py-4 px-6 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'general'
                  ? 'border-sena-green text-sena-green'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              👥 Importación General
            </button>
          </nav>
        </div>

        {/* Content */}
        <div className="p-6">
          {activeTab === 'learners' && (
            <div>
              <div className="mb-6">
                <h2 className="text-lg font-semibold text-gray-800 mb-2">
                  Importar Aprendices desde Reporte SENA
                </h2>
                <p className="text-gray-600">
                  Utiliza el formato estándar de reportes de aprendices del SENA para importar 
                  automáticamente fichas, aprendices y generar códigos QR.
                </p>
              </div>
              <ImportLearners onImportComplete={handleImportComplete} />
            </div>
          )}

          {activeTab === 'general' && (
            <div>
              <div className="mb-6">
                <h2 className="text-lg font-semibold text-gray-800 mb-2">
                  Importación General de Usuarios
                </h2>
                <p className="text-gray-600">
                  Importa diferentes tipos de usuarios (funcionarios, contratistas, etc.) 
                  usando un formato Excel personalizado.
                </p>
              </div>
              
              {/* Aquí va tu componente existente de importación general */}
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
                <p className="text-gray-500 mb-4">
                  Funcionalidad de importación general disponible próximamente
                </p>
                <p className="text-sm text-gray-400">
                  Esta funcionalidad utilizará el endpoint /import/excel existente
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Información adicional */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-medium text-blue-800 mb-2">💡 Consejos:</h3>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• Los códigos QR se generan automáticamente para todos los aprendices importados</li>
          <li>• Los usuarios existentes se actualizan con la nueva información</li>
          <li>• Las credenciales por defecto son: email + contraseña "sena" + número de documento</li>
          <li>• Verifica el formato del Excel antes de importar para evitar errores</li>
        </ul>
      </div>
    </div>
  );
};

export default ImportPage;