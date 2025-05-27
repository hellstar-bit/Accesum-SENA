// frontend/src/components/users/UserView.tsx - Vista Detallada de Usuario
import { useState, useRef } from 'react';
import { profileService } from '../../services/profileService';
import type { User } from '../../services/userService';

interface UserViewProps {
  user: User;
  onClose: () => void;
  onEdit: () => void;
  onUpdate: () => void;
}

const UserView = ({ user, onClose, onEdit, onUpdate }: UserViewProps) => {
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleRegenerateQR = async () => {
    if (!confirm('¿Estás seguro de regenerar el código QR?')) return;
    
    try {
      setLoading(true);
      await profileService.regenerateQR(user.profile.id);
      onUpdate();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Error al regenerar QR');
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      alert('La imagen no debe superar los 2MB');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = async () => {
      try {
        setLoading(true);
        await profileService.uploadProfileImage(user.profile.id, reader.result as string);
        onUpdate();
      } catch (error: any) {
        alert(error.response?.data?.message || 'Error al subir imagen');
      } finally {
        setLoading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const downloadCarnet = () => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      alert('Error al generar el carnet');
      return;
    }

    // Configurar tamaño del carnet
    canvas.width = 350;
    canvas.height = 550;

    // Fondo
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Header SENA
    ctx.fillStyle = '#39A900';
    ctx.fillRect(0, 0, canvas.width, 100);
    
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 24px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('SENA', canvas.width / 2, 40);
    ctx.font = '14px Arial';
    ctx.fillText('Sistema de Control de Acceso', canvas.width / 2, 65);

    const continuarGenerandoCarnet = () => {
      if (!ctx) return;

      // Información del perfil
      ctx.fillStyle = '#000000';
      ctx.font = 'bold 18px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(`${user.profile.firstName} ${user.profile.lastName}`, canvas.width / 2, 250);
      
      ctx.font = '14px Arial';
      ctx.fillText(`${user.profile.documentType}: ${user.profile.documentNumber}`, canvas.width / 2, 275);
      ctx.fillText(user.profile.type.name, canvas.width / 2, 300);
      ctx.fillText(user.profile.center.name, canvas.width / 2, 320);

      // QR Code (si existe)
      if (user.profile.qrCode) {
        const qrImg = new Image();
        qrImg.onload = () => {
          if (!ctx) return;
          ctx.drawImage(qrImg, 75, 350, 200, 200);
          
          canvas.toBlob((blob) => {
            if (blob) {
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `carnet_${user.profile.documentNumber}.png`;
              a.click();
              URL.revokeObjectURL(url);
            }
          });
        };
        qrImg.src = user.profile.qrCode;
      } else {
        canvas.toBlob((blob) => {
          if (blob) {
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `carnet_${user.profile.documentNumber}.png`;
            a.click();
            URL.revokeObjectURL(url);
          }
        });
      }
    };

    // Foto de perfil
    if (user.profile.profileImage) {
      const img = new Image();
      img.onload = () => {
        if (!ctx) return;
        ctx.drawImage(img, 125, 120, 100, 100);
        continuarGenerandoCarnet();
      };
      img.src = user.profile.profileImage;
    } else {
      // Placeholder de foto
      ctx.fillStyle = '#e5e7eb';
      ctx.fillRect(125, 120, 100, 100);
      ctx.fillStyle = '#6b7280';
      ctx.font = 'bold 36px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(
        user.profile.firstName.charAt(0) + user.profile.lastName.charAt(0), 
        175, 180
      );
      continuarGenerandoCarnet();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-6xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="text-2xl font-semibold text-gray-800">
                Perfil de Usuario
              </h2>
              <p className="text-gray-600 mt-1">
                Información completa del usuario y perfil
              </p>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={onEdit}
                className="btn-primary"
              >
                ✏️ Editar
              </button>
              <button
                onClick={onClose}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Columna izquierda - Foto y QR */}
            <div className="lg:col-span-1 space-y-6">
              {/* Foto de perfil */}
              <div className="bg-gray-50 rounded-lg p-6 text-center">
                <h3 className="font-medium text-gray-700 mb-4">Foto de Perfil</h3>
                <div className="relative inline-block">
                  <div className="w-32 h-32 rounded-full overflow-hidden bg-gray-200 mx-auto">
                    {user.profile.profileImage ? (
                      <img 
                        src={user.profile.profileImage} 
                        alt="Foto de perfil"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-500 text-3xl font-bold">
                        {user.profile.firstName.charAt(0)}{user.profile.lastName.charAt(0)}
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute bottom-0 right-0 bg-sena-green text-white p-2 rounded-full hover:bg-sena-dark"
                    disabled={loading}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </button>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </div>

              {/* Código QR */}
              <div className="bg-gray-50 rounded-lg p-6 text-center">
                <h3 className="font-medium text-gray-700 mb-4">Código QR</h3>
                {user.profile.qrCode ? (
                  <div className="inline-block p-4 bg-white border-2 border-gray-300 rounded-lg">
                    <img 
                      src={user.profile.qrCode} 
                      alt="Código QR"
                      className="w-48 h-48"
                    />
                  </div>
                ) : (
                  <div className="inline-block p-8 bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg">
                    <p className="text-gray-500">Sin código QR</p>
                  </div>
                )}
                <div className="mt-4 space-y-2">
                  <button
                    onClick={handleRegenerateQR}
                    disabled={loading}
                    className="btn-secondary w-full"
                  >
                    {user.profile.qrCode ? 'Regenerar QR' : 'Generar QR'}
                  </button>
                  <button
                    onClick={downloadCarnet}
                    className="btn-primary w-full"
                  >
                    📄 Descargar Carnet
                  </button>
                </div>
              </div>

              {/* Estado del usuario */}
              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="font-medium text-gray-700 mb-4">Estado</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Usuario:</span>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      user.isActive 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {user.isActive ? 'Activo' : 'Inactivo'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">QR Code:</span>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      user.profile.qrCode 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {user.profile.qrCode ? 'Generado' : 'Pendiente'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Foto:</span>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      user.profile.profileImage 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {user.profile.profileImage ? 'Cargada' : 'Sin foto'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Columna derecha - Información */}
            <div className="lg:col-span-2 space-y-6">
              {/* Información de usuario */}
              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="font-medium text-gray-700 mb-4">Información del Usuario</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">Email</label>
                    <p className="text-gray-900 bg-white p-2 rounded">{user.email}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">Rol</label>
                    <span className="inline-flex px-3 py-1 text-sm font-semibold rounded-full bg-blue-100 text-blue-800">
                      {user.role.name}
                    </span>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">Fecha de Creación</label>
                    <p className="text-gray-900 bg-white p-2 rounded">
                      {new Date(user.createdAt).toLocaleDateString('es-CO')}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">Última Actualización</label>
                    <p className="text-gray-900 bg-white p-2 rounded">
                      {new Date(user.updatedAt).toLocaleDateString('es-CO')}
                    </p>
                  </div>
                </div>
                {user.role.description && (
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-600 mb-1">Descripción del Rol</label>
                    <p className="text-gray-900 bg-white p-2 rounded">{user.role.description}</p>
                  </div>
                )}
              </div>

              {/* Información personal */}
              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="font-medium text-gray-700 mb-4">Información Personal</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">Nombres</label>
                    <p className="text-gray-900 bg-white p-2 rounded">{user.profile.firstName}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">Apellidos</label>
                    <p className="text-gray-900 bg-white p-2 rounded">{user.profile.lastName}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">Tipo de Documento</label>
                    <p className="text-gray-900 bg-white p-2 rounded">{user.profile.documentType}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">Número de Documento</label>
                    <p className="text-gray-900 bg-white p-2 rounded">{user.profile.documentNumber}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">Teléfono</label>
                    <p className="text-gray-900 bg-white p-2 rounded">{user.profile.phoneNumber || 'No especificado'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">Tipo de Personal</label>
                    <span className="inline-flex px-3 py-1 text-sm font-semibold rounded-full bg-purple-100 text-purple-800">
                      {user.profile.type.name}
                    </span>
                  </div>
                </div>
              </div>

              {/* Información organizacional */}
              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="font-medium text-gray-700 mb-4">Información Organizacional</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">Regional</label>
                    <p className="text-gray-900 bg-white p-2 rounded">{user.profile.regional.name}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">Centro</label>
                    <p className="text-gray-900 bg-white p-2 rounded">{user.profile.center.name}</p>
                  </div>
                </div>
              </div>

              {/* Información adicional para aprendices */}
              {user.role.name === 'Aprendiz' && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                  <h3 className="font-medium text-green-800 mb-4">🎓 Información de Aprendiz</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-green-700 mb-1">Estado de Aprendiz</label>
                      <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${
                        user.profile.learnerStatus === 'EN FORMACION' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {user.profile.learnerStatus || 'No especificado'}
                      </span>
                    </div>
                    {user.profile.ficha && (
                      <>
                        <div>
                          <label className="block text-sm font-medium text-green-700 mb-1">Código de Ficha</label>
                          <p className="text-green-900 bg-white p-2 rounded">{user.profile.ficha.code}</p>
                        </div>
                        <div className="md:col-span-2">
                          <label className="block text-sm font-medium text-green-700 mb-1">Programa de Formación</label>
                          <p className="text-green-900 bg-white p-2 rounded">{user.profile.ficha.name}</p>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )}

              {/* Botones de acción */}
              <div className="flex justify-end space-x-4 pt-6 border-t">
                <button
                  onClick={onClose}
                  className="btn-secondary"
                >
                  Cerrar
                </button>
                <button
                  onClick={onEdit}
                  className="btn-primary"
                >
                  Editar Usuario
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );}

  export default UserView;