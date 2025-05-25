// frontend/src/components/import/ImportLearners.tsx
import { useState, useRef } from 'react';
import { importService } from '../../services/importService.ts';

interface ImportResult {
  success: boolean;
  totalRows: number;
  importedRows: number;
  updatedRows: number;
  fichaInfo: {
    code: string;
    name: string;
    status: string;
    isNew: boolean;
  };
  errors: Array<{
    row: number;
    error: string;
    data?: any;
  }>;
  summary: {
    nuevos: number;
    actualizados: number;
    errores: number;
  };
}

interface ImportLearnersProps {
  onImportComplete?: () => void;
}

const ImportLearners = ({ onImportComplete }: ImportLearnersProps) => {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (selectedFile: File) => {
    // Validar tipo de archivo
    if (!selectedFile.name.match(/\.(xlsx|xls)$/)) {
      alert('Solo se permiten archivos Excel (.xlsx, .xls)');
      return;
    }

    // Validar tamaño (max 10MB)
    if (selectedFile.size > 10 * 1024 * 1024) {
      alert('El archivo no debe superar los 10MB');
      return;
    }

    setFile(selectedFile);
    setResult(null);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      handleFileSelect(droppedFile);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      handleFileSelect(selectedFile);
    }
  };

  const handleImport = async () => {
    if (!file) {
      alert('Por favor selecciona un archivo');
      return;
    }

    setLoading(true);
    try {
      const importResult = await importService.importLearners(file);
      setResult(importResult);
      
      if (importResult.success && onImportComplete) {
        onImportComplete();
      }
    } catch (error: any) {
      alert(error.response?.data?.message || 'Error al importar archivo');
    } finally {
      setLoading(false);
    }
  };

  const clearFile = () => {
    setFile(null);
    setResult(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-2">
          Importar Aprendices desde Excel
        </h2>
        <p className="text-gray-600">
          Selecciona un archivo Excel con el formato de reporte de aprendices del SENA
        </p>
      </div>

      {/* Información del formato */}
      <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-medium text-blue-800 mb-2">📋 Formato esperado:</h3>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• <strong>Fila 3:</strong> Ficha de Caracterización: [CÓDIGO] - [NOMBRE]</li>
          <li>• <strong>Fila 4:</strong> Estado: [EN EJECUCIÓN/TERMINADA/CANCELADA]</li>
          <li>• <strong>Fila 5:</strong> Fecha del Reporte: [DD/MM/YYYY]</li>
          <li>• <strong>Fila 7+:</strong> Datos de aprendices (Tipo Doc, Número, Nombre, Apellidos, Celular, Email, Estado)</li>
        </ul>
      </div>

      {/* Área de carga de archivo */}
      <div className="mb-6">
        <div
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            dragActive
              ? 'border-sena-green bg-sena-light'
              : file
              ? 'border-green-400 bg-green-50'
              : 'border-gray-300 hover:border-gray-400'
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          {file ? (
            <div className="space-y-4">
              <div className="flex items-center justify-center">
                <svg className="h-12 w-12 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 0l3 3m-3-3l3-3M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="text-lg font-medium text-gray-900">{file.name}</p>
                <p className="text-sm text-gray-500">
                  {(file.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
              <button
                onClick={clearFile}
                className="text-red-600 hover:text-red-800 text-sm font-medium"
              >
                Cambiar archivo
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-center">
                <svg className="h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
              </div>
              <div>
                <p className="text-lg font-medium text-gray-900">
                  Arrastra el archivo aquí o haz clic para seleccionar
                </p>
                <p className="text-sm text-gray-500">
                  Archivos Excel (.xlsx, .xls) hasta 10MB
                </p>
              </div>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="btn-primary"
              >
                Seleccionar Archivo
              </button>
            </div>
          )}
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx,.xls"
          onChange={handleFileInput}
          className="hidden"
        />
      </div>

      {/* Botón de importación */}
      {file && (
        <div className="mb-6">
          <button
            onClick={handleImport}
            disabled={loading}
            className="btn-primary w-full flex items-center justify-center space-x-2"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
                <span>Importando...</span>
              </>
            ) : (
              <>
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                <span>Importar Aprendices</span>
              </>
            )}
          </button>
        </div>
      )}

      {/* Resultados de la importación */}
      {result && (
        <div className="space-y-4">
          {/* Información de la ficha */}
          <div className={`rounded-lg p-4 ${result.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
            <div className="flex items-center mb-3">
              {result.success ? (
                <svg className="h-6 w-6 text-green-600 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              ) : (
                <svg className="h-6 w-6 text-red-600 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              )}
              <h3 className={`font-semibold ${result.success ? 'text-green-800' : 'text-red-800'}`}>
                {result.success ? 'Importación Exitosa' : 'Error en la Importación'}
              </h3>
            </div>

            {/* Información de la ficha */}
            <div className="bg-white rounded-lg p-3 mb-4">
              <h4 className="font-medium text-gray-800 mb-2">📋 Información de la Ficha:</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                <p><strong>Código:</strong> {result.fichaInfo.code}</p>
                <p><strong>Estado:</strong> {result.fichaInfo.status}</p>
                <p className="md:col-span-2"><strong>Nombre:</strong> {result.fichaInfo.name}</p>
                <p><strong>Ficha:</strong> {result.fichaInfo.isNew ? 'Nueva' : 'Actualizada'}</p>
              </div>
            </div>

            {/* Estadísticas */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold text-blue-600">{result.totalRows}</p>
                <p className="text-sm text-gray-600">Total</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-green-600">{result.summary.nuevos}</p>
                <p className="text-sm text-gray-600">Nuevos</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-orange-600">{result.summary.actualizados}</p>
                <p className="text-sm text-gray-600">Actualizados</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-red-600">{result.summary.errores}</p>
                <p className="text-sm text-gray-600">Errores</p>
              </div>
            </div>
          </div>

          {/* Errores */}
          {result.errors.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <h4 className="font-medium text-red-800 mb-3">⚠️ Errores encontrados:</h4>
              <div className="max-h-40 overflow-y-auto space-y-2">
                {result.errors.map((error, index) => (
                  <div key={index} className="text-sm text-red-700 bg-white rounded p-2">
                    <strong>Fila {error.row}:</strong> {error.error}
                    {error.data && (
                      <div className="text-xs text-red-600 mt-1">
                        Datos: {JSON.stringify(error.data)}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ImportLearners;