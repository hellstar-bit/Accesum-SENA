// frontend/src/services/importService.ts
import api from './api';

export interface ImportResult {
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

// Resultado del método existente (mantener compatibilidad)
export interface LegacyImportResult {
  success: boolean;
  totalRows: number;
  importedRows: number;
  errors: Array<{
    row: number;
    error: string;
    data?: any;
  }>;
  summary: {
    funcionarios: number;
    contratistas: number;
    aprendices: number;
    visitantes: number;
  };
}

export const importService = {
  // ⭐ NUEVO MÉTODO - Con formulario manual
  async importLearnersWithForm(file: File, fichaData: {
    codigo: string;
    nombre: string;
    estado: string;
    fecha: string;
  }): Promise<ImportResult> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('fichaData', JSON.stringify(fichaData));

    const response = await api.post<ImportResult>('/import/learners-with-form', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.data;
  },


  // Método existente para importación general (mantener compatibilidad)
  async importExcel(file: File): Promise<LegacyImportResult> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await api.post<LegacyImportResult>('/import/excel', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.data;
  },


};