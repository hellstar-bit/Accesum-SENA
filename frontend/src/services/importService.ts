// frontend/src/services/importService.ts - CORREGIDO CON CENTRO Y REGIONAL
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

// ⭐ INTERFAZ ACTUALIZADA PARA INCLUIR CENTRO Y REGIONAL
export interface FichaFormData {
  codigo: string;
  nombre: string;
  estado: string;
  fecha: string;
  regionalId: string; // ⭐ NUEVO CAMPO
  centerId: string;   // ⭐ NUEVO CAMPO
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

// ⭐ INTERFAZ PARA VALIDACIÓN DE UBICACIÓN
export interface LocationValidation {
  valid: boolean;
  message: string;
}

export const importService = {
  // ⭐ MÉTODO PRINCIPAL - ACTUALIZADO CON VALIDACIÓN DE UBICACIÓN
  async importLearnersWithForm(file: File, fichaData: FichaFormData): Promise<ImportResult> {
    try {
      // ⭐ VALIDAR DATOS DE ENTRADA ANTES DE ENVIAR
      if (!fichaData.codigo?.trim()) {
        throw new Error('Código de ficha es requerido');
      }

      if (!fichaData.nombre?.trim()) {
        throw new Error('Nombre de programa es requerido');
      }

      if (!fichaData.regionalId || !fichaData.centerId) {
        throw new Error('Regional y centro son requeridos');
      }

      // ⭐ VALIDAR QUE LOS IDs SEAN NÚMEROS VÁLIDOS
      const regionalId = parseInt(fichaData.regionalId);
      const centerId = parseInt(fichaData.centerId);

      if (isNaN(regionalId) || regionalId <= 0) {
        throw new Error('ID de regional inválido');
      }

      if (isNaN(centerId) || centerId <= 0) {
        throw new Error('ID de centro inválido');
      }

      // ⭐ VALIDAR ESTADOS PERMITIDOS
      const estadosPermitidos = ['EN EJECUCIÓN', 'TERMINADA', 'CANCELADA'];
      if (!estadosPermitidos.includes(fichaData.estado)) {
        throw new Error('Estado de ficha inválido');
      }

      // ⭐ VALIDAR ARCHIVO
      if (!file) {
        throw new Error('No se proporcionó ningún archivo');
      }

      if (!file.name.match(/\.(xlsx|xls)$/)) {
        throw new Error('Solo se permiten archivos Excel (.xlsx, .xls)');
      }

      if (file.size > 10 * 1024 * 1024) {
        throw new Error('El archivo no debe superar los 10MB');
      }

      // ⭐ PREPARAR FORMULARIO CON VALIDACIÓN ADICIONAL
      const formData = new FormData();
      formData.append('file', file);
      
      // ⭐ CREAR OBJETO DE DATOS LIMPIO CON VALIDACIÓN
      const cleanFichaData = {
        codigo: fichaData.codigo.trim(),
        nombre: fichaData.nombre.trim(),
        estado: fichaData.estado,
        fecha: fichaData.fecha,
        regionalId: regionalId.toString(),
        centerId: centerId.toString()
      };

      formData.append('fichaData', JSON.stringify(cleanFichaData));

      console.log('📤 Enviando datos de importación:', {
        fileName: file.name,
        fileSize: `${(file.size / 1024 / 1024).toFixed(2)} MB`,
        fichaData: cleanFichaData
      });

      // ⭐ ENVIAR SOLICITUD AL BACKEND
      const response = await api.post<ImportResult>('/import/learners-with-form', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 300000, // 5 minutos de timeout para archivos grandes
      });

      console.log('✅ Respuesta de importación recibida:', {
        success: response.data.success,
        totalRows: response.data.totalRows,
        importedRows: response.data.importedRows,
        updatedRows: response.data.updatedRows,
        errorsCount: response.data.errors.length
      });

      return response.data;

    } catch (error: any) {
      console.error('❌ Error en importación:', error);
      
      // ⭐ MANEJO MEJORADO DE ERRORES
      if (error.response) {
        // Error del servidor
        const serverError = error.response.data?.message || 'Error del servidor';
        throw new Error(serverError);
      } else if (error.request) {
        // Error de red
        throw new Error('Error de conexión. Verifique su conexión a internet.');
      } else if (error.message) {
        // Error de validación local
        throw error;
      } else {
        // Error desconocido
        throw new Error('Error desconocido al procesar la importación');
      }
    }
  },

  // ⭐ NUEVO MÉTODO - VALIDAR UBICACIÓN ANTES DE IMPORTAR
  async validateLocation(regionalId: number, centerId: number): Promise<LocationValidation> {
    try {
      if (!regionalId || !centerId) {
        return {
          valid: false,
          message: 'Regional y centro son requeridos'
        };
      }

      if (isNaN(regionalId) || regionalId <= 0) {
        return {
          valid: false,
          message: 'ID de regional inválido'
        };
      }

      if (isNaN(centerId) || centerId <= 0) {
        return {
          valid: false,
          message: 'ID de centro inválido'
        };
      }

      const response = await api.post<LocationValidation>('/import/validate-location', {
        regionalId,
        centerId
      });

      return response.data;

    } catch (error: any) {
      console.error('❌ Error validando ubicación:', error);
      return {
        valid: false,
        message: error.response?.data?.message || 'Error al validar ubicación'
      };
    }
  },

  // ⭐ MÉTODO PARA OBTENER INFORMACIÓN DE VISTA PREVIA
  async previewExcelFile(file: File): Promise<{
    success: boolean;
    headers: string[];
    sampleRows: any[][];
    totalRows: number;
    errors: string[];
  }> {
    try {
      if (!file) {
        throw new Error('No se proporcionó ningún archivo');
      }

      if (!file.name.match(/\.(xlsx|xls)$/)) {
        throw new Error('Solo se permiten archivos Excel (.xlsx, .xls)');
      }

      const formData = new FormData();
      formData.append('file', file);

      const response = await api.post('/import/preview-excel', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      return response.data;

    } catch (error: any) {
      console.error('❌ Error en vista previa:', error);
      throw new Error(error.response?.data?.message || 'Error al procesar vista previa');
    }
  },

  // ⭐ MÉTODO PARA VALIDAR FORMATO DE ARCHIVO
  validateFileFormat(file: File): { valid: boolean; error?: string } {
    if (!file) {
      return { valid: false, error: 'No se proporcionó ningún archivo' };
    }

    // Validar extensión
    if (!file.name.match(/\.(xlsx|xls)$/)) {
      return { valid: false, error: 'Solo se permiten archivos Excel (.xlsx, .xls)' };
    }

    // Validar tamaño (máximo 10MB)
    if (file.size > 10 * 1024 * 1024) {
      return { valid: false, error: 'El archivo no debe superar los 10MB' };
    }

    // Validar que no esté vacío
    if (file.size === 0) {
      return { valid: false, error: 'El archivo está vacío' };
    }

    return { valid: true };
  },

  // ⭐ MÉTODO PARA VALIDAR DATOS DE FICHA
  validateFichaData(fichaData: FichaFormData): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Validaciones básicas
    if (!fichaData.codigo?.trim()) {
      errors.push('Código de ficha es requerido');
    } else if (fichaData.codigo.trim().length < 4) {
      errors.push('Código de ficha debe tener al menos 4 caracteres');
    }

    if (!fichaData.nombre?.trim()) {
      errors.push('Nombre del programa es requerido');
    } else if (fichaData.nombre.trim().length < 10) {
      errors.push('Nombre del programa debe tener al menos 10 caracteres');
    }

    if (!fichaData.estado) {
      errors.push('Estado de la ficha es requerido');
    } else {
      const estadosPermitidos = ['EN EJECUCIÓN', 'TERMINADA', 'CANCELADA'];
      if (!estadosPermitidos.includes(fichaData.estado)) {
        errors.push('Estado de ficha inválido');
      }
    }

    if (!fichaData.fecha) {
      errors.push('Fecha es requerida');
    } else {
      const fecha = new Date(fichaData.fecha);
      if (isNaN(fecha.getTime())) {
        errors.push('Formato de fecha inválido');
      }
    }

    // Validaciones de ubicación
    if (!fichaData.regionalId) {
      errors.push('Regional es requerida');
    } else {
      const regionalId = parseInt(fichaData.regionalId);
      if (isNaN(regionalId) || regionalId <= 0) {
        errors.push('ID de regional inválido');
      }
    }

    if (!fichaData.centerId) {
      errors.push('Centro es requerido');
    } else {
      const centerId = parseInt(fichaData.centerId);
      if (isNaN(centerId) || centerId <= 0) {
        errors.push('ID de centro inválido');
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  },

  // ⭐ MÉTODO UTILITARIO PARA FORMATEAR ERRORES
  formatImportErrors(errors: Array<{ row: number; error: string; data?: any }>): string {
    if (errors.length === 0) return '';

    const maxErrorsToShow = 5;
    const errorsToShow = errors.slice(0, maxErrorsToShow);
    
    let formatted = 'Errores encontrados:\n';
    errorsToShow.forEach(error => {
      formatted += `• Fila ${error.row}: ${error.error}\n`;
    });

    if (errors.length > maxErrorsToShow) {
      formatted += `... y ${errors.length - maxErrorsToShow} errores más`;
    }

    return formatted;
  },

  // ⭐ MÉTODO PARA OBTENER ESTADÍSTICAS DE IMPORTACIÓN
  async getImportStatistics(fichaCode?: string): Promise<{
    totalImports: number;
    successfulImports: number;
    failedImports: number;
    lastImportDate?: string;
    mostCommonErrors: Array<{ error: string; count: number }>;
  }> {
    try {
      const params = fichaCode ? `?fichaCode=${fichaCode}` : '';
      const response = await api.get(`/import/statistics${params}`);
      return response.data;
    } catch (error: any) {
      console.error('❌ Error obteniendo estadísticas:', error);
      throw new Error('Error al obtener estadísticas de importación');
    }
  },

  // ============= MÉTODOS EXISTENTES (mantener compatibilidad) =============

  // Método existente para importación general (mantener compatibilidad)
  async importExcel(file: File): Promise<LegacyImportResult> {
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await api.post<LegacyImportResult>('/import/excel', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      return response.data;
    } catch (error: any) {
      console.error('❌ Error en importación legacy:', error);
      throw new Error(error.response?.data?.message || 'Error al importar archivo');
    }
  },

  // Método alternativo sin formulario (extraer datos del Excel)
  async importLearnersFromExcel(file: File): Promise<ImportResult> {
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await api.post<ImportResult>('/import/learners-excel', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      return response.data;
    } catch (error: any) {
      console.error('❌ Error en importación automática:', error);
      throw new Error(error.response?.data?.message || 'Error al importar desde Excel');
    }
  },

  // ============= UTILIDADES ADICIONALES =============

  // Función helper para crear objeto FichaFormData
  createFichaFormData(
    codigo: string,
    nombre: string,
    estado: string,
    fecha: string,
    regionalId: number,
    centerId: number
  ): FichaFormData {
    return {
      codigo: codigo.trim(),
      nombre: nombre.trim(),
      estado,
      fecha,
      regionalId: regionalId.toString(),
      centerId: centerId.toString()
    };
  },

  // Función helper para validar si una ficha existe
  async checkFichaExists(codigo: string): Promise<{ exists: boolean; ficha?: any }> {
    try {
      const response = await api.get(`/import/check-ficha/${codigo}`);
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        return { exists: false };
      }
      throw error;
    }
  },

  // Función helper para obtener template de Excel
  async downloadExcelTemplate(): Promise<void> {
    try {
      const response = await api.get('/import/excel-template', {
        responseType: 'blob'
      });

      const blob = new Blob([response.data], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      });

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'plantilla_importacion_aprendices.xlsx';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error: any) {
      console.error('❌ Error descargando plantilla:', error);
      throw new Error('Error al descargar plantilla de Excel');
    }
  }
};