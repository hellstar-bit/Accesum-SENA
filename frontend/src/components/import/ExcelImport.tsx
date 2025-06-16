// frontend/src/components/import/ExcelImport.tsx
import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import * as XLSX from 'xlsx';
import { userService } from '../../services/userService';

interface PreviewData {
  headers: string[];
  rows: any[][];
  totalRows: number;
}

const ExcelImport = () => {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<PreviewData | null>(null);
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<any>(null);
  const [step, setStep] = useState<'upload' | 'mapping' | 'preview' | 'result'>('upload');

  // Campos requeridos del sistema
  const systemFields = [
    { key: 'tipoDocumento', label: 'Tipo de Documento', required: true },
    { key: 'numeroDocumento', label: 'Número de Documento', required: true },
    { key: 'nombre', label: 'Nombres', required: true },
    { key: 'apellidos', label: 'Apellidos', required: true },
    { key: 'celular', label: 'Celular', required: false },
    { key: 'correoElectronico', label: 'Correo Electrónico', required: true },
    { key: 'estado', label: 'Estado', required: true },
  ];

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      setFile(file);
      parseExcel(file);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/vnd.ms-excel': ['.xls'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
    },
    multiple: false,
  });

  const parseExcel = async (file: File) => {
    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      
      // Convertir a JSON
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
      
      if (jsonData.length < 2) {
        alert('El archivo está vacío o no tiene datos suficientes');
        return;
      }

      const headers = jsonData[0] as string[];
      const rows = jsonData.slice(1, 11) as any[][]; // Preview de las primeras 10 filas

      setPreview({
        headers,
        rows,
        totalRows: jsonData.length - 1,
      });

      // Auto-mapeo inteligente
      const autoMapping: Record<string, string> = {};
      systemFields.forEach(field => {
        const matchingHeader = headers.find(header => {
          const headerLower = header.toString().toLowerCase();
          const fieldLower = field.label.toLowerCase();
          
          // Mapeos específicos
          if (field.key === 'tipoDocumento' && (headerLower.includes('tipo') && headerLower.includes('doc'))) return true;
          if (field.key === 'numeroDocumento' && (headerLower.includes('documento') || headerLower.includes('identificacion'))) return true;
          if (field.key === 'nombre' && (headerLower.includes('nombre') && !headerLower.includes('apellido'))) return true;
          if (field.key === 'apellidos' && headerLower.includes('apellido')) return true;
          if (field.key === 'celular' && (headerLower.includes('celular') || headerLower.includes('telefono'))) return true;
          if (field.key === 'correoElectronico' && (headerLower.includes('correo') || headerLower.includes('email'))) return true;
          if (field.key === 'estado' && headerLower.includes('estado')) return true;
          
          return headerLower.includes(fieldLower);
        });
        
        if (matchingHeader) {
          autoMapping[field.key] = matchingHeader;
        }
      });

      setMapping(autoMapping);
      setStep('mapping');
    } catch (error) {
      console.error('Error al parsear Excel:', error);
      alert('Error al leer el archivo. Asegúrate de que sea un archivo Excel válido.');
    }
  };

  const handleMappingChange = (systemField: string, excelColumn: string) => {
    setMapping(prev => ({
      ...prev,
      [systemField]: excelColumn,
    }));
  };

  const validateMapping = () => {
    const requiredFields = systemFields.filter(f => f.required);
    const missingFields = requiredFields.filter(f => !mapping[f.key]);
    
    if (missingFields.length > 0) {
      alert(`Faltan mapear campos requeridos: ${missingFields.map(f => f.label).join(', ')}`);
      return false;
    }
    
    return true;
  };

  const proceedToPreview = () => {
    if (!validateMapping()) return;
    setStep('preview');
  };

  const handleImport = async () => {
    if (!file) return;

    setImporting(true);
    setImportResult(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('mapping', JSON.stringify(mapping));

      // Aquí llamarías al servicio de importación
      const result = await userService.importFromExcel(file);
      
      setImportResult(result);
      setStep('result');
    } catch (error: any) {
      console.error('Error al importar:', error);
      alert(error.response?.data?.message || 'Error al importar el archivo');
    } finally {
      setImporting(false);
    }
  };

  const reset = () => {
    setFile(null);
    setPreview(null);
    setMapping({});
    setImportResult(null);
    setStep('upload');
  };

  return (
    <div className="max-w-6xl mx-auto">
      {/* Progress Steps */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {['upload', 'mapping', 'preview', 'result'].map((s, index) => (
            <div key={s} className="flex items-center flex-1">
              <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                step === s ? 'bg-sena-green text-white border-sena-green' :
                ['upload', 'mapping', 'preview', 'result'].indexOf(step) > index 
                  ? 'bg-green-100 text-green-600 border-green-600'
                  : 'bg-gray-100 text-gray-400 border-gray-300'
              }`}>
                {index + 1}
              </div>
              {index < 3 && (
                <div className={`flex-1 h-1 mx-2 ${
                  ['upload', 'mapping', 'preview', 'result'].indexOf(step) > index 
                    ? 'bg-green-600' 
                    : 'bg-gray-300'
                }`} />
              )}
            </div>
          ))}
        </div>
        <div className="flex justify-between mt-2">
          <span className="text-sm">Cargar archivo</span>
          <span className="text-sm">Mapear campos</span>
          <span className="text-sm">Vista previa</span>
          <span className="text-sm">Resultado</span>
        </div>
      </div>

      {/* Step: Upload */}
      {step === 'upload' && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Cargar archivo Excel</h3>
          
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
              isDragActive ? 'border-sena-green bg-sena-light/20' : 'border-gray-300 hover:border-gray-400'
            }`}
          >
            <input {...getInputProps()} />
            <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            {isDragActive ? (
              <p className="text-gray-600">Suelta el archivo aquí...</p>
            ) : (
              <>
                <p className="text-gray-600 mb-2">
                  Arrastra y suelta un archivo Excel aquí, o haz clic para seleccionar
                </p>
                <p className="text-sm text-gray-500">
                  Formatos soportados: .xls, .xlsx
                </p>
              </>
            )}
          </div>

          {file && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <p className="text-sm">
                <span className="font-medium">Archivo seleccionado:</span> {file.name}
              </p>
              <p className="text-sm text-gray-600">
                Tamaño: {(file.size / 1024 / 1024).toFixed(2)} MB
              </p>
            </div>
          )}
        </div>
      )}

      {/* Step: Mapping */}
      {step === 'mapping' && preview && (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-semibold">Mapear campos</h3>
            <button onClick={reset} className="text-gray-600 hover:text-gray-800">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <p className="text-gray-600 mb-6">
            Relaciona las columnas del archivo Excel con los campos del sistema
          </p>

          <div className="space-y-4">
            {systemFields.map(field => (
              <div key={field.key} className="grid grid-cols-2 gap-4 items-center">
                <label className="text-sm font-medium">
                  {field.label}
                  {field.required && <span className="text-red-500 ml-1">*</span>}
                </label>
                <select
                  value={mapping[field.key] || ''}
                  onChange={(e) => handleMappingChange(field.key, e.target.value)}
                  className="input-field"
                >
                  <option value="">-- Seleccionar columna --</option>
                  {preview.headers.map((header, index) => (
                    <option key={index} value={header}>
                      {header}
                    </option>
                  ))}
                </select>
              </div>
            ))}
          </div>

          <div className="flex justify-between mt-6">
            <button onClick={reset} className="btn-secondary">
              Cancelar
            </button>
            <button onClick={proceedToPreview} className="btn-primary">
              Continuar
            </button>
          </div>
        </div>
      )}

      {/* Step: Preview */}
      {step === 'preview' && preview && (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-semibold">Vista previa de importación</h3>
            <button onClick={() => setStep('mapping')} className="text-gray-600 hover:text-gray-800">
              Volver
            </button>
          </div>

          <div className="mb-4">
            <p className="text-sm text-gray-600">
              Se importarán <span className="font-semibold">{preview.totalRows}</span> registros
            </p>
            <p className="text-sm text-gray-600">
              Vista previa de los primeros {Math.min(10, preview.rows.length)} registros:
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {systemFields.map(field => (
                    <th key={field.key} className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                      {field.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {preview.rows.map((row, rowIndex) => (
                  <tr key={rowIndex}>
                    {systemFields.map(field => {
                      const columnIndex = preview.headers.indexOf(mapping[field.key]);
                      const value = columnIndex >= 0 ? row[columnIndex] : '';
                      return (
                        <td key={field.key} className="px-4 py-2 text-sm text-gray-900 whitespace-nowrap">
                          {value || '-'}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex justify-between mt-6">
            <button onClick={() => setStep('mapping')} className="btn-secondary">
              Volver
            </button>
            <button 
              onClick={handleImport} 
              disabled={importing}
              className="btn-primary flex items-center space-x-2"
            >
              {importing && (
                <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
              )}
              <span>{importing ? 'Importando...' : 'Importar'}</span>
            </button>
          </div>
        </div>
      )}

      {/* Step: Result */}
      {step === 'result' && importResult && (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-center mb-6">
            {importResult.success ? (
              <>
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
                  <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-green-900">Importación exitosa</h3>
              </>
            ) : (
              <>
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-yellow-100 mb-4">
                  <svg className="h-6 w-6 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-yellow-900">Importación completada con advertencias</h3>
              </>
            )}
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-600">Total procesados</p>
              <p className="text-2xl font-semibold">{importResult.totalRows}</p>
            </div>
            <div className="bg-green-50 rounded-lg p-4">
              <p className="text-sm text-green-600">Importados</p>
              <p className="text-2xl font-semibold text-green-900">{importResult.importedRows}</p>
            </div>
            <div className="bg-red-50 rounded-lg p-4">
              <p className="text-sm text-red-600">Errores</p>
              <p className="text-2xl font-semibold text-red-900">{importResult.errors.length}</p>
            </div>
            <div className="bg-blue-50 rounded-lg p-4">
              <p className="text-sm text-blue-600">Omitidos</p>
              <p className="text-2xl font-semibold text-blue-900">
                {importResult.totalRows - importResult.importedRows - importResult.errors.length}
              </p>
            </div>
          </div>

          {importResult.summary && (
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <h4 className="font-medium mb-2">Resumen por tipo:</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                <p className="text-sm">
                  Funcionarios: <span className="font-semibold">{importResult.summary.funcionarios}</span>
                </p>
                <p className="text-sm">
                  Contratistas: <span className="font-semibold">{importResult.summary.contratistas}</span>
                </p>
                <p className="text-sm">
                  Aprendices: <span className="font-semibold">{importResult.summary.aprendices}</span>
                </p>
                <p className="text-sm">
                  Visitantes: <span className="font-semibold">{importResult.summary.visitantes}</span>
                </p>
              </div>
            </div>
          )}

          {importResult.errors.length > 0 && (
            <div className="mb-6">
              <h4 className="font-medium mb-2">Errores encontrados:</h4>
              <div className="max-h-60 overflow-y-auto border rounded-lg">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Fila</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Error</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {importResult.errors.slice(0, 10).map((error: { row: number; error: string }, index: number) => (
                      <tr key={index}>
                        <td className="px-4 py-2 text-sm text-gray-900">{error.row}</td>
                        <td className="px-4 py-2 text-sm text-red-600">{error.error}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {importResult.errors.length > 10 && (
                <p className="text-sm text-gray-600 mt-2">
                  ... y {importResult.errors.length - 10} errores más
                </p>
              )}
            </div>
          )}

          <div className="flex justify-center">
            <button onClick={reset} className="btn-primary">
              Nueva importación
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExcelImport;