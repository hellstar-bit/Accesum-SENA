// frontend/src/pages/LearnerProfile.tsx
import { useState, useEffect, useRef } from 'react';
import { learnerService } from '../services/learnerService.ts';
import type { LearnerProfile } from '../services/learnerService.ts';
import { downloadLearnerCarnet } from '../utils/carnetGenerator';
import SweetAlertUtils, { 
  showProcessingAlert, 
  hideProcessingAlert, 
  showQuickToast, 
  handleApiError 
} from '../utils/sweetAlertUtils';

const LearnerProfilePage = () => {
  const [profile, setProfile] = useState<LearnerProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [formData, setFormData] = useState({
    phoneNumber: '',
    address: '',
    city: '',
    bloodType: '',
    maritalStatus: '',
    vaccine: '',
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const profileData = await learnerService.getMyProfile();
      setProfile(profileData);
      setImageError(false);
      
      setFormData({
        phoneNumber: profileData.phoneNumber || '',
        address: profileData.address || '',
        city: profileData.city || '',
        bloodType: profileData.bloodType || '',
        maritalStatus: profileData.maritalStatus || '',
        vaccine: profileData.vaccine || '',
      });
    } catch (error) {
      console.error('Error al cargar perfil:', error);
      handleApiError(error, 'No se pudo cargar la información de tu perfil');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      showProcessingAlert('Actualizando perfil', 'Guardando tu información personal...');
      
      await learnerService.updateMyProfile(formData);
      await fetchProfile();
      setIsEditing(false);
      
      hideProcessingAlert();
      await SweetAlertUtils.general.showSuccess(
        '¡Perfil actualizado!',
        'Tu información personal ha sido actualizada correctamente.'
      );
    } catch (error: any) {
      hideProcessingAlert();
      handleApiError(error, 'No se pudo actualizar tu perfil');
    } finally {
      setSaving(false);
    }
  };
  

  const isValidImageUrl = (url: string | undefined): boolean => {
    if (!url) return false;
    const base64Regex = /^data:image\/(jpeg|jpg|png|gif|webp);base64,[A-Za-z0-9+/]*={0,2}$/;
    return base64Regex.test(url);
  };

  const handleImageError = () => {
    setImageError(true);
    console.error('Error al cargar imagen de perfil');
  };

  const handleImageLoad = () => {
    setImageError(false);
  };

  const compressImage = (file: File, maxWidth: number = 800, quality: number = 0.8): Promise<string> => {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;
    const img = new Image();
    
    img.onload = () => {
      // Calcular nuevas dimensiones manteniendo proporción
      const ratio = Math.min(maxWidth / img.width, maxWidth / img.height);
      const newWidth = img.width * ratio;
      const newHeight = img.height * ratio;
      
      // Configurar canvas con nuevas dimensiones
      canvas.width = newWidth;
      canvas.height = newHeight;
      
      // Dibujar imagen redimensionada en el canvas
      ctx.drawImage(img, 0, 0, newWidth, newHeight);
      
      // Convertir a base64 con compresión JPEG
      const compressedBase64 = canvas.toDataURL('image/jpeg', quality);
      resolve(compressedBase64);
    };
    
    // Cargar la imagen desde el archivo
    img.src = URL.createObjectURL(file);
  });
};

// Función handleImageUpload actualizada con compresión
const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0];
  if (!file) return;

  // Validaciones de tipo y tamaño
  const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  if (!validTypes.includes(file.type)) {
    alert('Por favor selecciona una imagen válida (JPG, PNG, WEBP)');
    return;
  }

  // Validar tamaño máximo (10MB)
  const maxSize = 10 * 1024 * 1024; // 10MB
  if (file.size > maxSize) {
    alert('La imagen es demasiado grande. Máximo 10MB permitido.');
    return;
  }

  try {
    setSaving(true);
    showProcessingAlert('Procesando imagen', 'Optimizando y subiendo tu foto de perfil...');
    
    // 🔧 COMPRIMIR IMAGEN ANTES DE SUBIR
    console.log(`📊 Imagen original: ${file.size} bytes (${(file.size / 1024 / 1024).toFixed(2)} MB)`);
    
    const compressedBase64 = await compressImage(file, 800, 0.8);
    
    // Calcular tamaño aproximado de la imagen comprimida
    const compressedSize = (compressedBase64.length * 3) / 4; // Aproximación del tamaño Base64
    console.log(`📊 Imagen comprimida: ${compressedSize.toFixed(0)} bytes (${(compressedSize / 1024 / 1024).toFixed(2)} MB)`);
    console.log(`📈 Reducción: ${(((file.size - compressedSize) / file.size) * 100).toFixed(1)}%`);
    
    // Subir imagen comprimida
    await learnerService.uploadImage(compressedBase64);
    await fetchProfile();
    
    hideProcessingAlert();
    await SweetAlertUtils.general.showSuccess('¡Imagen actualizada!', 'Tu foto de perfil se ha actualizado correctamente.');
    
  } catch (error: any) {
    hideProcessingAlert();
    console.error('Error al subir imagen:', error);
    
    // Manejo específico de errores
    if (error.message.includes('muy grande') || error.message.includes('conexión lenta')) {
      SweetAlertUtils.general.showError('Imagen muy grande', 'Intenta con una imagen más pequeña o verifica tu conexión.');
    } else if (error.message.includes('servidor')) {
      SweetAlertUtils.general.showError('Error del servidor', 'Intenta nuevamente en unos momentos.');
    } else {
      SweetAlertUtils.general.showError('Error al subir imagen', error.message || 'Verifica tu conexión e intenta nuevamente.');
    }
  } finally {
    setSaving(false);
  }
};

  const handleRegenerateQR = async () => {
    // Usar la confirmación específica para QR que ya tienes
    const userData = {
      firstName: profile?.firstName || '',
      lastName: profile?.lastName || '',
      documentType: profile?.documentType || '',
      documentNumber: profile?.documentNumber || '',
      email: profile?.user?.email,
      profileImage: profile?.profileImage,
      role: profile?.type?.name || ''
    };

    const confirmed = await SweetAlertUtils.user.confirmRegenerateQR(userData, !!profile?.qrCode);
    
    if (!confirmed) return;
    
    try {
      setSaving(true);
      showProcessingAlert('Generando código QR', 'Creando tu nuevo código QR...');
      
      await learnerService.regenerateQR();
      await fetchProfile();
      
      hideProcessingAlert();
      await SweetAlertUtils.user.showQRGenerated(userData);
    } catch (error: any) {
      hideProcessingAlert();
      handleApiError(error, 'No se pudo regenerar el código QR');
    } finally {
      setSaving(false);
    }
  };

  const downloadCarnet = () => {
    try {
      downloadLearnerCarnet(profile);
      showQuickToast('¡Carnet descargado!', 'success');
    } catch (error) {
      SweetAlertUtils.general.showError(
        'Error al descargar',
        'No se pudo descargar el carnet. Verifica que tengas imagen y código QR.'
      );
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-sena-green"></div>
        <span className="ml-3 text-gray-600">Cargando perfil...</span>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-700">No se pudo cargar tu perfil</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold text-gray-800">Mi Perfil</h1>
          <p className="text-gray-600 mt-1">Gestiona tu información personal y carnet</p>
        </div>
        <div className="flex space-x-3">
          {!isEditing ? (
            <button
              onClick={() => setIsEditing(true)}
              className="btn-primary"
            >
              ✏️ Editar Información
            </button>
          ) : (
            <div className="flex space-x-2">
              <button
                onClick={() => setIsEditing(false)}
                className="btn-secondary"
                disabled={saving}
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                className="btn-primary"
                disabled={saving}
              >
                {saving ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Columna izquierda - Foto y QR */}
        <div className="lg:col-span-1 space-y-6">
          {/* Foto de perfil */}
          <div className="bg-white rounded-lg shadow p-6 text-center">
            <h3 className="font-medium text-gray-700 mb-4">Foto de Perfil</h3>
            <div className="relative inline-block">
              <div className="w-32 h-32 rounded-full overflow-hidden bg-gray-200 mx-auto border-4 border-gray-100">
                {profile.profileImage && isValidImageUrl(profile.profileImage) && !imageError ? (
                  <img 
                    src={profile.profileImage} 
                    alt="Foto de perfil"
                    className="w-full h-full object-cover"
                    onError={handleImageError}
                    onLoad={handleImageLoad}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-500 text-2xl font-bold bg-gradient-to-br from-gray-200 to-gray-300">
                    {profile.firstName.charAt(0)}{profile.lastName.charAt(0)}
                  </div>
                )}
              </div>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="absolute bottom-0 right-0 bg-sena-green text-white p-2 rounded-full hover:bg-sena-dark transition-colors shadow-lg"
                disabled={saving}
                title="Cambiar foto de perfil"
              >
                {saving ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                )}
              </button>
            </div>
            
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
              onChange={handleImageUpload}
              className="hidden"
            />
            
            <p className="text-xs text-gray-500 mt-3">
              Formatos: JPEG, PNG, GIF, WebP<br />
              Tamaño máximo: 2MB
            </p>
          </div>

          {/* Código QR */}
          <div className="bg-white rounded-lg shadow p-6 text-center">
            <h3 className="font-medium text-gray-700 mb-4">Código QR</h3>
            {profile.qrCode && isValidImageUrl(profile.qrCode) ? (
              <div className="inline-block p-4 bg-white border-2 border-gray-300 rounded-lg">
                <img 
                  src={profile.qrCode} 
                  alt="Código QR"
                  className="w-48 h-48"
                  onError={(e) => {
                    console.error('Error al cargar QR code');
                    e.currentTarget.style.display = 'none';
                  }}
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
                disabled={saving}
                className="btn-secondary w-full"
              >
                {profile.qrCode ? 'Regenerar QR' : 'Generar QR'}
              </button>
              {profile.qrCode && (
                <button
                  onClick={downloadCarnet}
                  className="btn-primary w-full"
                >
                  📄 Descargar Carnet
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Columna derecha - Información */}
        <div className="lg:col-span-2 space-y-6">
          {/* Información personal NO editable */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="font-medium text-gray-700 mb-4">Información Básica (No editable)</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Nombres</label>
                <p className="text-gray-900 bg-gray-50 p-2 rounded">{profile.firstName}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Apellidos</label>
                <p className="text-gray-900 bg-gray-50 p-2 rounded">{profile.lastName}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Documento</label>
                <p className="text-gray-900 bg-gray-50 p-2 rounded">
                  {profile.documentType} {profile.documentNumber}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Email</label>
                <p className="text-gray-900 bg-gray-50 p-2 rounded">{profile.user.email}</p>
              </div>
            </div>
          </div>

          {/* Información de la ficha */}
          {profile.ficha && (
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="font-medium text-gray-700 mb-4">Información de Ficha</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">Código de Ficha</label>
                  <p className="text-gray-900 bg-gray-50 p-2 rounded">{profile.ficha.code}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">Estado de Ficha</label>
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    profile.ficha.status === 'EN EJECUCIÓN' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {profile.ficha.status}
                  </span>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-600 mb-1">Programa de Formación</label>
                  <p className="text-gray-900 bg-gray-50 p-2 rounded">{profile.ficha.name}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">Estado del Aprendiz</label>
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    profile.learnerStatus === 'EN FORMACION' 
                      ? 'bg-green-100 text-green-800' 
                      : profile.learnerStatus === 'CANCELADO'
                      ? 'bg-red-100 text-red-800'
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {profile.learnerStatus}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Información personal EDITABLE */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="font-medium text-gray-700 mb-4">Información Personal (Editable)</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Teléfono</label>
                {isEditing ? (
                  <input
                    type="tel"
                    value={formData.phoneNumber}
                    onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
                    className="input-field"
                    placeholder="3001234567"
                  />
                ) : (
                  <p className="text-gray-900 p-2 bg-gray-50 rounded">{profile.phoneNumber || 'No especificado'}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Tipo de Sangre</label>
                {isEditing ? (
                  <select
                    value={formData.bloodType}
                    onChange={(e) => handleInputChange('bloodType', e.target.value)}
                    className="input-field"
                  >
                    <option value="">Seleccionar</option>
                    <option value="A+">A+</option>
                    <option value="A-">A-</option>
                    <option value="B+">B+</option>
                    <option value="B-">B-</option>
                    <option value="AB+">AB+</option>
                    <option value="AB-">AB-</option>
                    <option value="O+">O+</option>
                    <option value="O-">O-</option>
                  </select>
                ) : (
                  <p className="text-gray-900 p-2 bg-gray-50 rounded">{profile.bloodType || 'No especificado'}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Dirección</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={formData.address}
                    onChange={(e) => handleInputChange('address', e.target.value)}
                    className="input-field"
                    placeholder="Calle 123 # 45-67"
                  />
                ) : (
                  <p className="text-gray-900 p-2 bg-gray-50 rounded">{profile.address || 'No especificado'}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Ciudad</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) => handleInputChange('city', e.target.value)}
                    className="input-field"
                    placeholder="Bogotá"
                  />
                ) : (
                  <p className="text-gray-900 p-2 bg-gray-50 rounded">{profile.city || 'No especificado'}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Estado Civil</label>
                {isEditing ? (
                  <select
                    value={formData.maritalStatus}
                    onChange={(e) => handleInputChange('maritalStatus', e.target.value)}
                    className="input-field"
                  >
                    <option value="">Seleccionar</option>
                    <option value="Soltero">Soltero(a)</option>
                    <option value="Casado">Casado(a)</option>
                    <option value="Union Libre">Unión Libre</option>
                    <option value="Divorciado">Divorciado(a)</option>
                    <option value="Viudo">Viudo(a)</option>
                  </select>
                ) : (
                  <p className="text-gray-900 p-2 bg-gray-50 rounded">{profile.maritalStatus || 'No especificado'}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Vacunado COVID-19</label>
                {isEditing ? (
                  <select
                    value={formData.vaccine}
                    onChange={(e) => handleInputChange('vaccine', e.target.value)}
                    className="input-field"
                  >
                    <option value="">Seleccionar</option>
                    <option value="SI">Sí</option>
                    <option value="NO">No</option>
                  </select>
                ) : (
                  <p className="text-gray-900 p-2 bg-gray-50 rounded">
                    {profile.vaccine === 'SI' ? 'Sí' : profile.vaccine === 'NO' ? 'No' : 'No especificado'}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Información institucional */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="font-medium text-gray-700 mb-4">Información Institucional</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Tipo de Personal</label>
                <p className="text-gray-900 bg-gray-50 p-2 rounded">{profile.type.name}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Regional</label>
                <p className="text-gray-900 bg-gray-50 p-2 rounded">{profile.regional.name}</p>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-600 mb-1">Centro de Formación</label>
                <p className="text-gray-900 bg-gray-50 p-2 rounded">{profile.center.name}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Información adicional */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-medium text-blue-800 mb-2">💡 Información Importante:</h3>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• Solo puedes editar tu información de contacto y datos personales adicionales</li>
          <li>• Tu nombre, documento, email y ficha no se pueden modificar</li>
          <li>• El código QR es único y se usa para el control de acceso</li>
          <li>• Mantén actualizada tu información de contacto</li>
          <li>• Descarga tu carnet para tenerlo siempre disponible</li>
          <li>• Las imágenes deben ser menores a 2MB y en formato JPEG, PNG, GIF o WebP</li>
        </ul>
      </div>
    </div>
  );
};

export default LearnerProfilePage;