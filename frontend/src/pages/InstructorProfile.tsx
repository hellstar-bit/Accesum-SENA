// frontend/src/pages/InstructorProfile.tsx - MEJORADO CON LÓGICA DE LEARNERPROFILE
import { useState, useEffect, useRef } from 'react';
import { instructorService } from '../services/instructorService';
import ChangePasswordForm from '../components/auth/ChangePasswordForm';
import type { 
  InstructorProfile, 
  WeeklySchedule, 
  InstructorSchedule
} from '../services/instructorService';
import { downloadLearnerCarnet } from '../utils/carnetGenerator';
import SweetAlertUtils, { 
  showProcessingAlert, 
  hideProcessingAlert, 
  showQuickToast, 
  handleApiError 
} from '../utils/sweetAlertUtils';

const InstructorProfilePage = () => {
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [profile, setProfile] = useState<InstructorProfile | null>(null);
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

  // ⭐ ESTADOS PARA HORARIOS (MANTENER INTACTOS)
  const [schedules, setSchedules] = useState<WeeklySchedule | null>(null);
  const [currentTrimester, setCurrentTrimester] = useState<string>('');
  const [loadingSchedules, setLoadingSchedules] = useState(false);
  const [assignments, setAssignments] = useState<any[]>([]);

  useEffect(() => {
    fetchProfile();
    loadSchedules();
    loadAssignments();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const profileData = await instructorService.getMyProfile();
      setProfile(profileData);
      setImageError(false);
      
      // ⭐ USAR MISMA LÓGICA QUE LEARNERPROFILE
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

  // ⭐ CARGAR HORARIOS (MANTENER IGUAL)
  const loadSchedules = async () => {
    try {
      setLoadingSchedules(true);
      const response = await instructorService.getMySchedules();
      setSchedules(response.schedules);
      setCurrentTrimester(response.trimester);
    } catch (error) {
      console.error('Error cargando horarios:', error);
      setSchedules({
        LUNES: [],
        MARTES: [],
        MIERCOLES: [],
        JUEVES: [],
        VIERNES: [],
        SABADO: []
      });
    } finally {
      setLoadingSchedules(false);
    }
  };

  // ⭐ CARGAR ASIGNACIONES (MANTENER IGUAL)
  const loadAssignments = async () => {
    try {
      const assignmentsData = await instructorService.getMyAssignments();
      setAssignments(assignmentsData);
    } catch (error) {
      console.error('Error cargando asignaciones:', error);
      setAssignments([]);
    }
  };

  // ⭐ USAR LÓGICA DE LEARNERPROFILE
  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      showProcessingAlert('Actualizando perfil', 'Guardando tu información personal...');
      
      await instructorService.updateMyProfile(formData);
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

  // ⭐ FUNCIONES DE IMAGEN (COPIAR DE LEARNERPROFILE)
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

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validar tipo de archivo
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      await SweetAlertUtils.general.showError(
        'Formato no válido',
        'Solo se permiten archivos de imagen (JPEG, PNG, GIF, WebP)'
      );
      return;
    }

    // Validar tamaño
    if (file.size > 2 * 1024 * 1024) {
      await SweetAlertUtils.general.showError(
        'Archivo muy grande',
        'La imagen no debe superar los 2MB'
      );
      return;
    }

    const reader = new FileReader();
    reader.onloadend = async () => {
      try {
        setSaving(true);
        showProcessingAlert('Subiendo imagen', 'Procesando tu foto de perfil...');
        
        const result = reader.result as string;
        
        if (!result || !result.startsWith('data:image/')) {
          throw new Error('Error al procesar la imagen');
        }

        await instructorService.uploadImage(result);
        await fetchProfile();
        
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
        
        hideProcessingAlert();
        showQuickToast('¡Imagen subida correctamente!', 'success');
        
      } catch (error: any) {
        hideProcessingAlert();
        handleApiError(error, 'No se pudo subir la imagen');
      } finally {
        setSaving(false);
      }
    };

    reader.onerror = () => {
      SweetAlertUtils.general.showError(
        'Error al leer archivo', 
        'No se pudo procesar el archivo seleccionado.'
      );
      setSaving(false);
    };

    reader.readAsDataURL(file);
  };

  const handleRegenerateQR = async () => {
    // ⭐ USAR CONFIRMACIÓN ESPECÍFICA COMO EN LEARNERPROFILE
    const userData = {
      firstName: profile?.firstName || '',
      lastName: profile?.lastName || '',
      documentType: profile?.documentType || '',
      documentNumber: profile?.documentNumber || '',
      email: profile?.user?.email,
      profileImage: profile?.profileImage,
      role: 'Instructor'
    };

    const confirmed = await SweetAlertUtils.user.confirmRegenerateQR(userData, !!profile?.qrCode);
    
    if (!confirmed) return;
    
    try {
      setSaving(true);
      showProcessingAlert('Generando código QR', 'Creando tu nuevo código QR...');
      
      await instructorService.regenerateQR();
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

  // ⭐ FUNCIÓN PARA DESCARGAR CARNET
  const downloadCarnet = () => {
    try {
      // Adaptar datos del instructor para el generador de carnet
      const instructorForCarnet = {
        ...profile,
        ficha: null, // Los instructores no tienen ficha
        learnerStatus: null // Los instructores no tienen estado de aprendiz
      };
      downloadLearnerCarnet(instructorForCarnet);
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
          <h1 className="text-2xl font-semibold text-gray-800">👨‍🏫 Mi Perfil</h1>
          <p className="text-gray-600 mt-1">Gestiona tu información personal, horarios y carnet</p>
        </div>
      </div>

      {/* ⭐ SECCIÓN DE HORARIOS (MANTENER EXACTAMENTE IGUAL) */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-semibold text-gray-800">
            📅 Mis Horarios - Trimestre {currentTrimester}
          </h3>
          <button
            onClick={loadSchedules}
            disabled={loadingSchedules}
            className="btn-secondary text-sm"
          >
            {loadingSchedules ? 'Cargando...' : '🔄 Actualizar'}
          </button>
        </div>
        
        {loadingSchedules ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-sena-green"></div>
            <span className="ml-3 text-gray-600">Cargando horarios...</span>
          </div>
        ) : schedules ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(schedules).map(([day, daySchedules]) => (
              <div key={day} className="border rounded-lg p-4 bg-gray-50">
                <h4 className="font-semibold text-lg mb-3 text-blue-600 border-b pb-2">
                  {day}
                </h4>
                {daySchedules.length > 0 ? (
                  <div className="space-y-3">
                    {daySchedules.map((schedule: InstructorSchedule) => (
                      <div key={schedule.id} className="bg-white rounded-lg p-3 border-l-4 border-sena-green">
                        <div className="font-medium text-gray-800 mb-1">
                          ⏰ {schedule.startTime} - {schedule.endTime}
                        </div>
                        <div className="text-sm text-gray-700 mb-1">
                          📚 {schedule.competence.name}
                        </div>
                        <div className="text-sm text-blue-600 mb-1">
                          👥 {schedule.ficha.code} - {schedule.ficha.name}
                        </div>
                        <div className="text-xs text-gray-500">
                          🏫 Aula: {schedule.classroom}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-gray-500 text-sm text-center py-4">
                    Sin clases programadas
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            No se pudieron cargar los horarios
          </div>
        )}
      </div>

      {/* ⭐ SECCIÓN DE ASIGNACIONES (MANTENER IGUAL) */}
      {assignments.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-xl font-semibold text-gray-800 mb-4">
            📋 Mis Fichas Asignadas
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {assignments.map((assignment) => (
              <div key={assignment.id} className="border rounded-lg p-4 bg-blue-50">
                <div className="font-medium text-gray-800 mb-2">
                  {assignment.ficha.code} - {assignment.ficha.name}
                </div>
                <div className="text-sm text-gray-600 mb-1">
                  📖 Materia: {assignment.subject}
                </div>
                {assignment.description && (
                  <div className="text-xs text-gray-500">
                    {assignment.description}
                  </div>
                )}
                <div className="text-xs text-green-600 mt-2">
                  ✅ Activo desde: {new Date(assignment.assignedAt).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

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
                  <div className="w-full h-full flex items-center justify-center text-gray-500 text-2xl font-bold bg-gradient-to-br from-blue-200 to-blue-300">
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
          {/* Información básica NO editable */}
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

          {/* Información personal EDITABLE */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-medium text-gray-700">Información Personal (Editable)</h3>
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
      {/* ⭐ NUEVA SECCIÓN: SEGURIDAD - CAMBIO DE CONTRASEÑA */}
<div className="bg-white rounded-lg shadow p-6">
  <div className="flex justify-between items-center mb-4">
    <div>
      <h3 className="text-lg font-semibold text-gray-800">🔐 Seguridad de la Cuenta</h3>
      <p className="text-gray-600 text-sm mt-1">
        Mantén tu cuenta segura actualizando tu contraseña regularmente
      </p>
    </div>
  </div>
  
  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
    <div className="flex items-center space-x-3">
      <div className="p-2 bg-blue-100 rounded-full">
        <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
      </div>
      <div>
        <h4 className="font-medium text-gray-800">Contraseña de Acceso</h4>
        <p className="text-sm text-gray-600">
          Cambia tu contraseña para mantener tu cuenta segura
        </p>
      </div>
    </div>
    <button
      onClick={() => setShowChangePassword(true)}
      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
    >
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
      </svg>
      <span>Cambiar Contraseña</span>
    </button>
  </div>

  {/* Modal/Formulario de cambio de contraseña */}
  {showChangePassword && (
    <div className="mt-4 border-t pt-4">
      <ChangePasswordForm
        onSuccess={() => setShowChangePassword(false)}
        onCancel={() => setShowChangePassword(false)}
        isModal={true}
      />
    </div>
  )}
</div>

      {/* Información adicional */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-medium text-blue-800 mb-2">💡 Información para Instructores:</h3>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• Solo puedes editar tu información de contacto y datos personales adicionales</li>
          <li>• Tu nombre, documento, email y información institucional no se pueden modificar</li>
          <li>• El código QR es único y se usa para el control de acceso a las instalaciones</li>
          <li>• Los horarios mostrados son asignados por el administrador del sistema</li>
          <li>• Mantén actualizada tu información de contacto para comunicaciones importantes</li>
          <li>• Descarga tu carnet para tenerlo siempre disponible</li>
          <li>• Las imágenes deben ser menores a 2MB y en formato JPEG, PNG, GIF o WebP</li>
        </ul>
      </div>
    </div>
  );
};

export default InstructorProfilePage;