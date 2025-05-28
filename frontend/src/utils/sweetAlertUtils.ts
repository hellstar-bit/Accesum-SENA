// frontend/src/utils/sweetAlertUtils.ts - Utilidades centralizadas para SweetAlert2

import Swal from 'sweetalert2';

// ============= INTERFACES =============

interface UserData {
  firstName: string;
  lastName: string;
  documentType: string;
  documentNumber: string;
  email?: string;
  profileImage?: string;
  role?: string;
}

interface ConfirmOptions {
  title: string;
  text: string;
  confirmText: string;
  cancelText?: string;
  type?: 'success' | 'error' | 'warning' | 'info' | 'question';
  confirmColor?: string;
}

// ============= CONFIGURACIONES BASE =============

const baseConfig = {
  customClass: {
    popup: 'sena-theme',
  },
  buttonsStyling: false,
  reverseButtons: true,
  allowOutsideClick: false,
  showClass: {
    popup: 'animate__animated animate__fadeInDown'
  }
};

const successConfig = {
  ...baseConfig,
  icon: 'success' as const,
  iconColor: '#16a34a',
  confirmButtonColor: '#16a34a',
};

const errorConfig = {
  ...baseConfig,
  icon: 'error' as const,
  iconColor: '#dc2626',
  confirmButtonColor: '#dc2626',
};

const warningConfig = {
  ...baseConfig,
  icon: 'warning' as const,
  iconColor: '#f59e0b',
  confirmButtonColor: '#f59e0b',
};

const questionConfig = {
  ...baseConfig,
  icon: 'question' as const,
  iconColor: '#8b5cf6',
  confirmButtonColor: '#8b5cf6',
  cancelButtonColor: '#6b7280',
  showCancelButton: true,
};

// ============= UTILIDADES PRINCIPALES =============

export const SweetAlertUtils = {
  // ⭐ ALERTAS DE USUARIO
  user: {
    confirmEdit: async (user: UserData): Promise<boolean> => {
      const result = await Swal.fire({
        ...questionConfig,
        title: '✏️ Editar Usuario',
        html: `
          <div class="text-center">
            <div class="mb-4">
              ${user.profileImage 
                ? `<img src="${user.profileImage}" class="user-avatar mx-auto" />` 
                : `<div class="user-avatar mx-auto">${user.firstName.charAt(0)}${user.lastName.charAt(0)}</div>`
              }
            </div>
            <h3 class="text-lg font-semibold text-gray-800 mb-2">
              ${user.firstName} ${user.lastName}
            </h3>
            <p class="text-sm text-gray-600 mb-4">
              ${user.role} - ${user.documentNumber}
            </p>
            <div class="info-box">
              <p class="text-sm text-blue-700">
                Se abrirá el formulario para editar la información de este usuario
              </p>
            </div>
          </div>
        `,
        confirmButtonText: 'Abrir Editor',
        cancelButtonText: 'Cancelar',
      });

      return result.isConfirmed;
    },

    confirmToggleStatus: async (user: UserData, isActivating: boolean): Promise<boolean> => {
      const result = await Swal.fire({
        ...questionConfig,
        title: `${isActivating ? '✅ Activar' : '🚫 Desactivar'} Usuario`,
        html: `
          <div class="text-center">
            <div class="mb-4">
              <div class="w-16 h-16 rounded-full mx-auto ${isActivating ? 'bg-green-100' : 'bg-red-100'} flex items-center justify-center text-2xl mb-3">
                ${isActivating ? '🔓' : '🔒'}
              </div>
            </div>
            <h3 class="text-lg font-semibold text-gray-800 mb-2">
              ${user.firstName} ${user.lastName}
            </h3>
            <p class="text-sm text-gray-600 mb-4">
              ${user.documentType}: ${user.documentNumber}
            </p>
            <div class="bg-${isActivating ? 'green' : 'red'}-50 border border-${isActivating ? 'green' : 'red'}-200 rounded-lg p-3">
              <p class="text-sm text-${isActivating ? 'green' : 'red'}-700">
                ${isActivating 
                  ? '¿Desea activar este usuario? Podrá acceder al sistema nuevamente.' 
                  : '¿Desea desactivar este usuario? No podrá acceder al sistema hasta ser reactivado.'}
              </p>
            </div>
          </div>
        `,
        confirmButtonColor: isActivating ? '#16a34a' : '#dc2626',
        confirmButtonText: `${isActivating ? 'Sí, activar' : 'Sí, desactivar'}`,
        cancelButtonText: 'Cancelar',
      });

      return result.isConfirmed;
    },

    confirmRegenerateQR: async (user: UserData, hasQR: boolean): Promise<boolean> => {
      const result = await Swal.fire({
        ...questionConfig,
        title: '🔄 Regenerar Código QR',
        html: `
          <div class="text-center">
            <div class="mb-4">
              <div class="w-16 h-16 rounded-full mx-auto bg-purple-100 flex items-center justify-center text-2xl mb-3">
                📱
              </div>
            </div>
            <h3 class="text-lg font-semibold text-gray-800 mb-2">
              ${user.firstName} ${user.lastName}
            </h3>
            <p class="text-sm text-gray-600 mb-4">
              ${user.documentType}: ${user.documentNumber}
            </p>
            <div class="bg-purple-50 border border-purple-200 rounded-lg p-3">
              <p class="text-sm text-purple-700">
                Se generará un nuevo código QR para este usuario. 
                ${hasQR 
                  ? 'El código anterior quedará invalidado.' 
                  : 'Es la primera vez que se genera el QR.'}
              </p>
            </div>
          </div>
        `,
        confirmButtonColor: '#7c3aed',
        confirmButtonText: 'Sí, regenerar QR',
        cancelButtonText: 'Cancelar',
      });

      return result.isConfirmed;
    },

    showStatusChanged: async (user: UserData, isActivated: boolean): Promise<void> => {
      await Swal.fire({
        ...successConfig,
        title: `${isActivated ? '✅ Usuario Activado' : '🚫 Usuario Desactivado'}`,
        html: `
          <div class="text-center">
            <h3 class="text-lg font-semibold text-gray-800 mb-2">
              ${user.firstName} ${user.lastName}
            </h3>
            <p class="text-sm text-gray-600">
              ${isActivated 
                ? 'El usuario puede acceder al sistema nuevamente' 
                : 'El usuario ya no puede acceder al sistema'}
            </p>
          </div>
        `,
        iconColor: isActivated ? '#16a34a' : '#dc2626',
        confirmButtonColor: isActivated ? '#16a34a' : '#dc2626',
        timer: 3000,
        timerProgressBar: true
      });
    },

    showQRGenerated: async (user: UserData): Promise<void> => {
      await Swal.fire({
        ...successConfig,
        title: '✅ Código QR Generado',
        html: `
          <div class="text-center">
            <div class="mb-4">
              <div class="w-16 h-16 rounded-full mx-auto bg-green-100 flex items-center justify-center text-2xl mb-3">
                ✅
              </div>
            </div>
            <h3 class="text-lg font-semibold text-gray-800 mb-2">
              ${user.firstName} ${user.lastName}
            </h3>
            <p class="text-sm text-gray-600 mb-4">
              El nuevo código QR ha sido generado exitosamente
            </p>
            <div class="bg-green-50 border border-green-200 rounded-lg p-3">
              <p class="text-sm text-green-700">
                El usuario ya puede usar su nuevo QR para el control de acceso
              </p>
            </div>
          </div>
        `,
        timer: 4000,
        timerProgressBar: true
      });
    }
  },

  // ⭐ ALERTAS GENERALES
  general: {
    showLoading: (title: string = 'Procesando...', text: string = 'Por favor espere'): void => {
      Swal.fire({
        title,
        text,
        allowOutsideClick: false,
        showConfirmButton: false,
        customClass: {
          popup: 'sena-theme'
        },
        didOpen: () => {
          Swal.showLoading();
        }
      });
    },

    showSuccess: async (title: string, text?: string, timer: number = 3000): Promise<void> => {
      await Swal.fire({
        ...successConfig,
        title,
        text,
        timer,
        timerProgressBar: true
      });
    },

    showError: async (title: string, text?: string): Promise<void> => {
      await Swal.fire({
        ...errorConfig,
        title,
        text
      });
    },

    showWarning: async (title: string, text?: string): Promise<void> => {
      await Swal.fire({
        ...warningConfig,
        title,
        text
      });
    },

    confirm: async (options: ConfirmOptions): Promise<boolean> => {
      const config = {
        ...questionConfig,
        title: options.title,
        text: options.text,
        confirmButtonText: options.confirmText,
        cancelButtonText: options.cancelText || 'Cancelar'
      };

      if (options.confirmColor) {
        config.confirmButtonColor = options.confirmColor;
      }

      const result = await Swal.fire(config);
      return result.isConfirmed;
    },

    toast: (title: string, type: 'success' | 'error' | 'warning' | 'info' = 'success', timer: number = 2000): void => {
      const Toast = Swal.mixin({
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer,
        timerProgressBar: true,
        didOpen: (toast) => {
          toast.addEventListener('mouseenter', Swal.stopTimer);
          toast.addEventListener('mouseleave', Swal.resumeTimer);
        }
      });

      Toast.fire({
        icon: type,
        title
      });
    }
  },

  // ⭐ ALERTAS DE ACCESO QR
  access: {
    showAccessSuccess: async (type: 'entry' | 'exit', userData: any): Promise<void> => {
      const isEntry = type === 'entry';
      const user = userData.user.profile;
      
      await Swal.fire({
        title: `✅ ${isEntry ? 'ENTRADA' : 'SALIDA'} REGISTRADA`,
        html: `
          <div class="text-center">
            <div class="mb-4">
              ${user.profileImage 
                ? `<img src="${user.profileImage}" class="w-20 h-20 rounded-full mx-auto object-cover mb-2 border-4 ${isEntry ? 'border-green-400' : 'border-red-400'}" />` 
                : `<div class="w-20 h-20 rounded-full mx-auto ${isEntry ? 'bg-green-100' : 'bg-red-100'} flex items-center justify-center ${isEntry ? 'text-green-600' : 'text-red-600'} text-2xl font-bold mb-2 border-4 ${isEntry ? 'border-green-400' : 'border-red-400'}">${user.firstName.charAt(0)}${user.lastName.charAt(0)}</div>`
              }
            </div>
            <h3 class="text-lg font-semibold text-gray-800">${user.firstName} ${user.lastName}</h3>
            <p class="text-sm text-gray-600 mb-2">${user.type} - ${user.documentNumber}</p>
            <div class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium mb-3 ${
              isEntry 
                ? 'bg-green-100 text-green-800' 
                : 'bg-red-100 text-red-800'
            }">
              ${isEntry ? '🏢 INGRESÓ A LAS INSTALACIONES' : '🚪 SALIÓ DE LAS INSTALACIONES'}
            </div>
            <p class="text-sm text-gray-500">
              ${new Date(userData.entryTime || userData.exitTime).toLocaleString('es-CO', { 
                weekday: 'long',
                year: 'numeric',
                month: 'long', 
                day: 'numeric',
                hour: '2-digit', 
                minute: '2-digit',
                hour12: true 
              })}
            </p>
            ${user.center ? `<p class="text-xs text-gray-400 mt-1">${user.center}</p>` : ''}
          </div>
        `,
        icon: 'success',
        iconColor: isEntry ? '#16a34a' : '#dc2626',
        confirmButtonColor: isEntry ? '#16a34a' : '#dc2626',
        confirmButtonText: 'Continuar',
        timer: 5000,
        timerProgressBar: true,
        allowOutsideClick: false,
        customClass: {
          popup: 'animate__animated animate__bounceIn',
          title: isEntry ? 'text-green-700' : 'text-red-700'
        }
      });
    },

    showAccessError: async (message: string): Promise<void> => {
      await Swal.fire({
        title: '❌ ERROR DE ACCESO',
        html: `
          <div class="text-center">
            <div class="mb-4">
              <div class="w-16 h-16 rounded-full mx-auto bg-red-100 flex items-center justify-center text-red-600 text-3xl mb-2">
                ⚠️
              </div>
            </div>
            <p class="text-gray-700 mb-4">${message}</p>
            <div class="bg-red-50 border border-red-200 rounded-lg p-3">
              <p class="text-sm text-red-700">
                <strong>Posibles soluciones:</strong><br>
                • Verificar que el código QR esté bien generado<br>
                • Intentar búsqueda manual por documento<br>
                • Contactar al administrador si persiste
              </p>
            </div>
          </div>
        `,
        icon: 'error',
        iconColor: '#dc2626',
        confirmButtonColor: '#dc2626',
        confirmButtonText: 'Entendido',
        timer: 6000,
        timerProgressBar: true,
        customClass: {
          popup: 'animate__animated animate__shakeX'
        }
      });
    }
  },

  // ⭐ ALERTAS DE IMPORTACIÓN
  import: {
    showImportResult: async (result: any): Promise<void> => {
      const isSuccess = result.success && result.summary.errores === 0;
      const hasWarnings = result.success && result.summary.errores > 0;

      await Swal.fire({
        title: isSuccess ? '✅ Importación Exitosa' : hasWarnings ? '⚠️ Importación con Advertencias' : '❌ Error en Importación',
        html: `
          <div class="text-center">
            <div class="mb-4">
              <div class="w-16 h-16 rounded-full mx-auto ${isSuccess ? 'bg-green-100' : hasWarnings ? 'bg-yellow-100' : 'bg-red-100'} flex items-center justify-center text-2xl mb-3">
                ${isSuccess ? '✅' : hasWarnings ? '⚠️' : '❌'}
              </div>
            </div>
            
            <div class="bg-white rounded-lg p-3 mb-4 border">
              <h4 class="font-medium text-gray-800 mb-2">📋 Información de la Ficha:</h4>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                <p><strong>Código:</strong> ${result.fichaInfo.code}</p>
                <p><strong>Estado:</strong> ${result.fichaInfo.status}</p>
                <p class="md:col-span-2"><strong>Nombre:</strong> ${result.fichaInfo.name}</p>
                <p><strong>Ficha:</strong> ${result.fichaInfo.isNew ? 'Nueva' : 'Actualizada'}</p>
              </div>
            </div>

            <div class="grid grid-cols-2 md:grid-cols-4 gap-4 text-center mb-4">
              <div>
                <p class="text-2xl font-bold text-blue-600">${result.totalRows}</p>
                <p class="text-sm text-gray-600">Total</p>
              </div>
              <div>
                <p class="text-2xl font-bold text-green-600">${result.summary.nuevos}</p>
                <p class="text-sm text-gray-600">Nuevos</p>
              </div>
              <div>
                <p class="text-2xl font-bold text-orange-600">${result.summary.actualizados}</p>
                <p class="text-sm text-gray-600">Actualizados</p>
              </div>
              <div>
                <p class="text-2xl font-bold text-red-600">${result.summary.errores}</p>
                <p class="text-sm text-gray-600">Errores</p>
              </div>
            </div>

            ${result.summary.errores > 0 ? `
              <div class="bg-red-50 border border-red-200 rounded-lg p-3">
                <p class="text-sm text-red-700">
                  <strong>Se encontraron ${result.summary.errores} errores.</strong><br>
                  Revise los datos y corrija los errores para una próxima importación.
                </p>
              </div>
            ` : ''}
          </div>
        `,
        icon: isSuccess ? 'success' : hasWarnings ? 'warning' : 'error',
        iconColor: isSuccess ? '#16a34a' : hasWarnings ? '#f59e0b' : '#dc2626',
        confirmButtonColor: isSuccess ? '#16a34a' : hasWarnings ? '#f59e0b' : '#dc2626',
        confirmButtonText: 'Entendido',
        timer: 8000,
        timerProgressBar: true
      });
    }
  },

  // ⭐ ALERTAS DE SISTEMA
  system: {
    showUpdateSuccess: (): void => {
      SweetAlertUtils.general.toast('Datos actualizados correctamente', 'success');
    },

    showDeleteSuccess: (itemName: string): void => {
      SweetAlertUtils.general.toast(`${itemName} eliminado correctamente`, 'success');
    },

    showCreateSuccess: (itemName: string): void => {
      SweetAlertUtils.general.toast(`${itemName} creado correctamente`, 'success');
    },

    confirmDelete: async (itemName: string, details?: string): Promise<boolean> => {
      return await SweetAlertUtils.general.confirm({
        title: `🗑️ Eliminar ${itemName}`,
        text: details || `¿Está seguro de que desea eliminar este ${itemName.toLowerCase()}? Esta acción no se puede deshacer.`,
        confirmText: 'Sí, eliminar',
        cancelText: 'Cancelar',
        confirmColor: '#dc2626'
      });
    },

    showMaintenanceMode: (): void => {
      Swal.fire({
        title: '🔧 Mantenimiento',
        text: 'El sistema está en modo mantenimiento. Intente nuevamente en unos minutos.',
        icon: 'info',
        iconColor: '#3b82f6',
        confirmButtonColor: '#3b82f6',
        allowOutsideClick: false,
        customClass: {
          popup: 'sena-theme'
        }
      });
    },

    showConnectionError: (): void => {
      Swal.fire({
        title: '🌐 Sin Conexión',
        text: 'No se pudo conectar con el servidor. Verifique su conexión a internet.',
        icon: 'error',
        iconColor: '#dc2626',
        confirmButtonColor: '#dc2626',
        confirmButtonText: 'Reintentar',
        customClass: {
          popup: 'sena-theme'
        }
      });
    }
  }
};

// ============= UTILIDADES ADICIONALES =============

export const showProcessingAlert = (title: string, text: string = 'Por favor espere...') => {
  SweetAlertUtils.general.showLoading(title, text);
};

export const hideProcessingAlert = () => {
  Swal.close();
};

export const showQuickToast = (message: string, type: 'success' | 'error' | 'warning' | 'info' = 'success') => {
  SweetAlertUtils.general.toast(message, type);
};

// Función helper para manejar errores de API
export const handleApiError = (error: any, defaultMessage: string = 'Ha ocurrido un error') => {
  const message = error.response?.data?.message || error.message || defaultMessage;
  SweetAlertUtils.general.showError('Error', message);
};

// Función helper para manejar respuestas exitosas
export const handleApiSuccess = (message: string = 'Operación completada exitosamente') => {
  SweetAlertUtils.general.showSuccess('Éxito', message);
};

export default SweetAlertUtils;