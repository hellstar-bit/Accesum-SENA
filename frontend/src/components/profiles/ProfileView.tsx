// frontend/src/components/profiles/ProfileView.tsx
import { useState, useRef } from 'react';
import { profileService } from '../../services/profileService';
import type { Profile, UpdateProfileRequest } from '../../services/profileService';
import { downloadModernCarnet } from '../../utils/carnetGenerator.ts';

interface ProfileViewProps {
  profile: Profile;
  onClose: () => void;
  onUpdate: () => void;
}

const ProfileView = ({ profile, onClose, onUpdate }: ProfileViewProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<UpdateProfileRequest>({
    documentType: profile.documentType,
    documentNumber: profile.documentNumber,
    firstName: profile.firstName,
    lastName: profile.lastName,
    bloodType: profile.bloodType || '',
    phoneNumber: profile.phoneNumber || '',
    address: profile.address || '',
    city: profile.city || '',
    maritalStatus: profile.maritalStatus || '',
    sex: profile.sex || '',
    vaccine: profile.vaccine || '',
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      await profileService.updateProfile(profile.id, formData);
      setIsEditing(false);
      onUpdate();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Error al actualizar perfil');
    } finally {
      setLoading(false);
    }
  };

  const handleRegenerateQR = async () => {
    if (!confirm('¿Estás seguro de regenerar el código QR?')) return;
    
    try {
      setLoading(true);
      await profileService.regenerateQR(profile.id);
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

    // Validar tamaño (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      alert('La imagen no debe superar los 2MB');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = async () => {
      try {
        setLoading(true);
        await profileService.uploadProfileImage(profile.id, reader.result as string);
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
  downloadModernCarnet(profile);
};
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex justify-between items-start mb-6">
            <h2 className="text-2xl font-semibold">
              {isEditing ? 'Editar Perfil' : 'Ver Perfil'}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Columna izquierda - Foto y QR */}
            <div className="space-y-6">
              {/* Foto de perfil */}
              <div className="text-center">
                <div className="relative inline-block">
                  <div className="w-32 h-32 rounded-full overflow-hidden bg-gray-200 mx-auto">
                    {profile.profileImage ? (
                      <img 
                        src={profile.profileImage} 
                        alt="Foto de perfil"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-500 text-3xl font-bold">
                        {profile.firstName.charAt(0)}{profile.lastName.charAt(0)}
                      </div>
                    )}
                  </div>
                  {isEditing && (
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="absolute bottom-0 right-0 bg-sena-green text-white p-2 rounded-full hover:bg-sena-dark"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </button>
                  )}
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
              <div className="text-center">
                <h3 className="font-medium text-gray-700 mb-2">Código QR</h3>
                {profile.qrCode ? (
                  <div className="inline-block p-4 bg-white border-2 border-gray-300 rounded-lg">
                    <img 
                      src={profile.qrCode} 
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
                    {profile.qrCode ? 'Regenerar QR' : 'Generar QR'}
                  </button>
                  {profile.qrCode && (
                    <button
                      onClick={downloadCarnet}
                      className="btn-primary w-full"
                    >
                      Descargar Carnet
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Columna derecha - Información */}
            <div className="md:col-span-2 space-y-6">
              {/* Información personal */}
              <div>
                <h3 className="font-medium text-gray-700 mb-4">Información Personal</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">
                      Nombres
                    </label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={formData.firstName}
                        onChange={(e) => handleInputChange('firstName', e.target.value)}
                        className="input-field"
                      />
                    ) : (
                      <p className="text-gray-900">{profile.firstName}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">
                      Apellidos
                    </label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={formData.lastName}
                        onChange={(e) => handleInputChange('lastName', e.target.value)}
                        className="input-field"
                      />
                    ) : (
                      <p className="text-gray-900">{profile.lastName}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">
                      Tipo de Documento
                    </label>
                    {isEditing ? (
                      <select
                        value={formData.documentType}
                        onChange={(e) => handleInputChange('documentType', e.target.value)}
                        className="input-field"
                      >
                        <option value="CC">Cédula de Ciudadanía</option>
                        <option value="CE">Cédula de Extranjería</option>
                        <option value="TI">Tarjeta de Identidad</option>
                        <option value="PA">Pasaporte</option>
                      </select>
                    ) : (
                      <p className="text-gray-900">{profile.documentType}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">
                      Número de Documento
                    </label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={formData.documentNumber}
                        onChange={(e) => handleInputChange('documentNumber', e.target.value)}
                        className="input-field"
                      />
                    ) : (
                      <p className="text-gray-900">{profile.documentNumber}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">
                      Teléfono
                    </label>
                    {isEditing ? (
                      <input
                        type="tel"
                        value={formData.phoneNumber}
                        onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
                        className="input-field"
                      />
                    ) : (
                      <p className="text-gray-900">{profile.phoneNumber || '-'}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">
                      Tipo de Sangre
                    </label>
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
                      <p className="text-gray-900">{profile.bloodType || '-'}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">
                      Sexo
                    </label>
                    {isEditing ? (
                      <select
                        value={formData.sex}
                        onChange={(e) => handleInputChange('sex', e.target.value)}
                        className="input-field"
                      >
                        <option value="">Seleccionar</option>
                        <option value="M">Masculino</option>
                        <option value="F">Femenino</option>
                      </select>
                    ) : (
                      <p className="text-gray-900">
                        {profile.sex === 'M' ? 'Masculino' : profile.sex === 'F' ? 'Femenino' : '-'}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">
                      Vacunado COVID-19
                    </label>
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
                      <p className="text-gray-900">{profile.vaccine || '-'}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Información de ubicación */}
              <div>
                <h3 className="font-medium text-gray-700 mb-4">Información de Ubicación</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">
                      Dirección
                    </label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={formData.address}
                        onChange={(e) => handleInputChange('address', e.target.value)}
                        className="input-field"
                      />
                    ) : (
                      <p className="text-gray-900">{profile.address || '-'}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">
                      Ciudad
                    </label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={formData.city}
                        onChange={(e) => handleInputChange('city', e.target.value)}
                        className="input-field"
                      />
                    ) : (
                      <p className="text-gray-900">{profile.city || '-'}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Información institucional */}
              <div>
                <h3 className="font-medium text-gray-700 mb-4">Información Institucional</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">
                      Email
                    </label>
                    <p className="text-gray-900">{profile.user.email}</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">
                      Tipo de Personal
                    </label>
                    <p className="text-gray-900">{profile.type.name}</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">
                      Regional
                    </label>
                    <p className="text-gray-900">{profile.regional.name}</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">
                      Centro
                    </label>
                    <p className="text-gray-900">{profile.center.name}</p>
                  </div>
                </div>
              </div>

              {/* Botones de acción */}
              <div className="flex justify-end space-x-4 pt-6 border-t">
                {isEditing ? (
                  <>
                    <button
                      onClick={() => setIsEditing(false)}
                      className="btn-secondary"
                      disabled={loading}
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={handleSave}
                      className="btn-primary"
                      disabled={loading}
                    >
                      {loading ? 'Guardando...' : 'Guardar Cambios'}
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="btn-primary"
                  >
                    Editar Perfil
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileView;