// frontend/src/pages/ImportPage.tsx
import ExcelImport from '../components/import/ExcelImport';

const ImportPage = () => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-gray-800">Importación de Usuarios</h1>
        <p className="text-gray-600 mt-1">Carga masiva de usuarios desde archivos Excel</p>
      </div>

      {/* Instrucciones */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="text-sm font-medium text-blue-900 mb-2">Instrucciones:</h3>
        <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
          <li>El archivo debe ser formato Excel (.xls o .xlsx)</li>
          <li>Debe contener las columnas: Tipo Documento, Número Documento, Nombres, Apellidos, Correo Electrónico</li>
          <li>Los usuarios importados recibirán una contraseña temporal: sena + número de documento</li>
          <li>Se generarán automáticamente los códigos QR para cada usuario</li>
        </ul>
      </div>

      {/* Componente de importación */}
      <ExcelImport />
    </div>
  );
};

export default ImportPage;