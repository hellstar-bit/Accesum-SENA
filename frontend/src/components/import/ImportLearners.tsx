// frontend/src/components/import/ImportLearners.tsx - ACTUALIZADO CON SELECCIÓN DE CENTRO Y REGIONAL
import { useState, useRef, useEffect } from 'react';
import { importService } from '../../services/importService.ts';
import { configService } from '../../services/configService.ts';
import type { Regional, Center } from '../../services/configService.ts';

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
  const [step, setStep] = useState<'form' | 'upload' | 'result'>('form');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ⭐ NUEVOS ESTADOS PARA REGIONALES Y CENTROS
  const [regionales, setRegionales] = useState<Regional[]>([]);
  const [centers, setCenters] = useState<Center[]>([]);
  const [loadingConfig, setLoadingConfig] = useState(true);

  // Estado del formulario de ficha ACTUALIZADO
  const [fichaForm, setFichaForm] = useState({
  codigo: '',
  nombre: '',
  estado: 'EN EJECUCIÓN',
  fecha: new Date().toISOString().split('T')[0],
  regionalId: '',
  centerId: '',
  // ⭐ NUEVOS CAMPOS DEL PROGRAMA
  codigoPrograma: '',
  tipoPrograma: '',
  nombreTipoPrograma: ''
});

  // ⭐ CARGAR REGIONALES Y CENTROS AL MONTAR EL COMPONENTE
  useEffect(() => {
    loadConfigData();
  }, []);

  // ⭐ CARGAR CENTROS CUANDO CAMBIE LA REGIONAL
  useEffect(() => {
    if (fichaForm.regionalId) {
      loadCentersByRegional(parseInt(fichaForm.regionalId));
    } else {
      setCenters([]);
      setFichaForm(prev => ({ ...prev, centerId: '' }));
    }
  }, [fichaForm.regionalId]);

  const loadConfigData = async () => {
    try {
      setLoadingConfig(true);
      const regionalesData = await configService.getRegionales();
      setRegionales(regionalesData);
    } catch (error) {
      console.error('Error al cargar configuración:', error);
      alert('Error al cargar la configuración del sistema');
    } finally {
      setLoadingConfig(false);
    }
  };

  const loadCentersByRegional = async (regionalId: number) => {
    try {
      const centersData = await configService.getCentersByRegional(regionalId);
      setCenters(centersData);
    } catch (error) {
      console.error('Error al cargar centros:', error);
      setCenters([]);
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
  e.preventDefault();
  
  // ⭐ VALIDACIÓN AMPLIADA
  if (!fichaForm.codigo.trim() || !fichaForm.nombre.trim() || 
      !fichaForm.codigoPrograma.trim() || !fichaForm.tipoPrograma.trim() || 
      !fichaForm.nombreTipoPrograma.trim()) {
    alert('Por favor complete todos los campos obligatorios');
    return;
  }

  if (!fichaForm.regionalId || !fichaForm.centerId) {
    alert('Por favor seleccione una regional y un centro');
    return;
  }
  
  setStep('upload');
};

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
      // ⭐ ENVIAR ARCHIVO JUNTO CON DATOS DEL FORMULARIO INCLUYENDO REGIONAL Y CENTRO
      const importResult = await importService.importLearnersWithForm(file, fichaForm);
      setResult(importResult);
      setStep('result');
      
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

  const resetProcess = () => {
  setStep('form');
  setFile(null);
  setResult(null);
  setFichaForm({
    codigo: '',
    nombre: '',
    estado: 'EN EJECUCIÓN',
    fecha: new Date().toISOString().split('T')[0],
    regionalId: '',
    centerId: '',
    // ⭐ RESETEAR NUEVOS CAMPOS
    codigoPrograma: '',
    tipoPrograma: '',
    nombreTipoPrograma: ''
  });
};

  // ⭐ OBTENER NOMBRES DE REGIONAL Y CENTRO SELECCIONADOS
  const getSelectedRegionalName = () => {
    const regional = regionales.find(r => r.id === parseInt(fichaForm.regionalId));
    return regional?.name || '';
  };

  const getSelectedCenterName = () => {
    const center = centers.find(c => c.id === parseInt(fichaForm.centerId));
    return center?.name || '';
  };

  if (loadingConfig) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex justify-center items-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-sena-green mr-3"></div>
          <span>Cargando configuración del sistema...</span>
        </div>
      </div>
    );
  }

  if (step === 'form') {
  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-2">
          Información de la Ficha y Ubicación
        </h2>
        <p className="text-gray-600">
          Complete la información de la ficha y seleccione la ubicación antes de cargar el archivo Excel
        </p>
      </div>

      <form onSubmit={handleFormSubmit} className="space-y-6">
        {/* ⭐ SECCIÓN DE UBICACIÓN */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-medium text-blue-800 mb-4">📍 Ubicación Institucional</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Regional *
              </label>
              <select
                value={fichaForm.regionalId}
                onChange={(e) => setFichaForm(prev => ({ 
                  ...prev, 
                  regionalId: e.target.value,
                  centerId: '' // Resetear centro cuando cambie regional
                }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sena-green"
                required
              >
                <option value="">Seleccione una regional</option>
                {regionales.map((regional) => (
                  <option key={regional.id} value={regional.id}>
                    {regional.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Centro de Formación *
              </label>
              <select
                value={fichaForm.centerId}
                onChange={(e) => setFichaForm(prev => ({ ...prev, centerId: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sena-green"
                disabled={!fichaForm.regionalId}
                required
              >
                <option value="">
                  {!fichaForm.regionalId ? 'Primero seleccione una regional' : 'Seleccione un centro'}
                </option>
                {centers.map((center) => (
                  <option key={center.id} value={center.id}>
                    {center.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <p className="text-sm text-blue-600 mt-2">
            💡 Todos los aprendices importados pertenecerán a esta regional y centro
          </p>
        </div>

        {/* ⭐ NUEVA SECCIÓN: INFORMACIÓN DEL PROGRAMA */}
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
          <h3 className="font-medium text-purple-800 mb-4">📚 Información del Programa</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tipo de Programa (Siglas) *
              </label>
              <input
                type="text"
                value={fichaForm.tipoPrograma}
                onChange={(e) => setFichaForm(prev => ({
                  ...prev,
                  tipoPrograma: e.target.value.toUpperCase()
                }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sena-green"
                placeholder="Ej: TPS, ADS"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Código del Programa *
              </label>
              <input
                type="text"
                value={fichaForm.codigoPrograma}
                onChange={(e) => setFichaForm(prev => ({
                  ...prev,
                  codigoPrograma: e.target.value.toUpperCase()
                }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sena-green"
                placeholder="Ej: TPS-41, ADS-15"
                required
              />
            </div>
          </div>

          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nombre Completo del Programa *
            </label>
            <input
              type="text"
              value={fichaForm.nombreTipoPrograma}
              onChange={(e) => setFichaForm(prev => ({
                ...prev,
                nombreTipoPrograma: e.target.value
              }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sena-green"
              placeholder="Ej: Técnico en Programación de Software"
              required
            />
          </div>
          <p className="text-sm text-purple-600 mt-2">
            💡 El tipo define las competencias base, el código es único para esta ficha
          </p>
        </div>

        {/* INFORMACIÓN DE LA FICHA */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <h3 className="font-medium text-green-800 mb-4">📋 Información de la Ficha</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Código de Ficha *
              </label>
              <input
                type="text"
                value={fichaForm.codigo}
                onChange={(e) => setFichaForm(prev => ({ ...prev, codigo: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sena-green"
                placeholder="Ej: 2853176"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Estado de la Ficha *
              </label>
              <select
                value={fichaForm.estado}
                onChange={(e) => setFichaForm(prev => ({ ...prev, estado: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sena-green"
              >
                <option value="EN EJECUCIÓN">EN EJECUCIÓN</option>
                <option value="TERMINADA">TERMINADA</option>
                <option value="CANCELADA">CANCELADA</option>
              </select>
            </div>
          </div>

          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nombre del Programa de Formación *
            </label>
            <input
              type="text"
              value={fichaForm.nombre}
              onChange={(e) => setFichaForm(prev => ({ ...prev, nombre: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sena-green"
              placeholder="Ej: ANÁLISIS Y DESARROLLO DE SOFTWARE"
              required
            />
          </div>

          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Fecha del Reporte
            </label>
            <input
              type="date"
              value={fichaForm.fecha}
              onChange={(e) => setFichaForm(prev => ({ ...prev, fecha: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sena-green"
            />
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            className="btn-primary flex items-center space-x-2"
            disabled={loadingConfig}
          >
            <span>Continuar</span>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </form>
    </div>
  );
}

  if (step === 'upload') {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        {/* Header con información de la ficha */}
        <div className="mb-6">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-xl font-semibold text-gray-800 mb-2">
                Cargar Archivo de Aprendices
              </h2>
              <p className="text-gray-600">
                Selecciona el archivo Excel con los datos de los aprendices
              </p>
            </div>
            <button
              onClick={() => setStep('form')}
              className="text-blue-600 hover:text-blue-800 text-sm"
            >
              ← Volver a configuración
            </button>
          </div>
        </div>

        {/* ⭐ RESUMEN DE LA CONFIGURACIÓN MEJORADO */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <h3 className="font-medium text-blue-800 mb-3">📋 Configuración de Importación:</h3>
          
          {/* Ubicación */}
          <div className="bg-white rounded-lg p-3 mb-3">
            <h4 className="font-medium text-gray-800 mb-2">📍 Ubicación:</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-700">
              <p><strong>Regional:</strong> {getSelectedRegionalName()}</p>
              <p><strong>Centro:</strong> {getSelectedCenterName()}</p>
            </div>
          </div>

          {/* Ficha */}
          <div className="bg-white rounded-lg p-3">
            <h4 className="font-medium text-gray-800 mb-2">📚 Ficha:</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-700">
              <p><strong>Código:</strong> {fichaForm.codigo}</p>
              <p><strong>Estado:</strong> {fichaForm.estado}</p>
              <p className="md:col-span-2"><strong>Programa:</strong> {fichaForm.nombre}</p>
              <p><strong>Fecha:</strong> {new Date(fichaForm.fecha).toLocaleDateString('es-CO')}</p>
            </div>
          </div>
        </div>
          {/* Programa */}
          <div className="bg-white rounded-lg p-3">
            <h4 className="font-medium text-gray-800 mb-2">📚 Programa:</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-700">
              <p><strong>Tipo:</strong> {fichaForm.tipoPrograma}</p>
              <p><strong>Código:</strong> {fichaForm.codigoPrograma}</p>
              <p className="md:col-span-2"><strong>Nombre:</strong> {fichaForm.nombreTipoPrograma}</p>
            </div>
          </div>

        {/* Información del formato */}
        <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4">
          <h3 className="font-medium text-green-800 mb-2">📋 Formato esperado del Excel:</h3>
          <ul className="text-sm text-green-700 space-y-1">
            <li>• <strong>Columna A:</strong> Tipo de Documento (CC, TI, etc.)</li>
            <li>• <strong>Columna B:</strong> Número de Documento</li>
            <li>• <strong>Columna C:</strong> Nombres</li>
            <li>• <strong>Columna D:</strong> Apellidos</li>
            <li>• <strong>Columna E:</strong> Celular</li>
            <li>• <strong>Columna F:</strong> Correo Electrónico</li>
            <li>• <strong>Columna G:</strong> Estado (EN FORMACIÓN, CANCELADO, etc.)</li>
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
      </div>
    );
  }

  // Step: Result
  if (step === 'result' && result) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="space-y-4">
          {/* Información de la ficha y ubicación */}
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

            {/* ⭐ INFORMACIÓN COMPLETA DE UBICACIÓN Y FICHA */}
            <div className="bg-white rounded-lg p-3 mb-4">
              <h4 className="font-medium text-gray-800 mb-2">📍 Ubicación Asignada:</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm mb-3">
                <p><strong>Regional:</strong> {getSelectedRegionalName()}</p>
                <p><strong>Centro:</strong> {getSelectedCenterName()}</p>
              </div>
              
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

          {/* Botón para nueva importación */}
          <div className="flex justify-center pt-4">
            <button onClick={resetProcess} className="btn-primary">
              Nueva Importación
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export default ImportLearners;