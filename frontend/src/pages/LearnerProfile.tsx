// frontend/src/pages/LearnerProfile.tsx
import { useState, useEffect, useRef } from 'react';
import { learnerService } from '../services/learnerService.ts';
import { useAuth } from '../context/AuthContext';
import type { LearnerProfile } from '../services/learnerService.ts';

const LearnerProfilePage = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<LearnerProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
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
      
      // Cargar datos editables en el formulario
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
      await learnerService.updateMyProfile(formData);
      await fetchProfile();
      setIsEditing(false);
    } catch (error: any) {
      alert(error.response?.data?.message || 'Error al actualizar perfil');
    } finally {
      setSaving(false);
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
        setSaving(true);
        await learnerService.uploadImage(reader.result as string);
        await fetchProfile();
      } catch (error: any) {
        alert(error.response?.data?.message || 'Error al subir imagen');
      } finally {
        setSaving(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleRegenerateQR = async () => {
    if (!confirm('¿Estás seguro de regenerar tu código QR?')) return;
    
    try {
      setSaving(true);
      await learnerService.regenerateQR();
      await fetchProfile();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Error al regenerar QR');
    } finally {
      setSaving(false);
    }
  };

  const downloadCarnet = () => {
    if (!profile) return;

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
      ctx.fillText(`${profile.firstName} ${profile.lastName}`, canvas.width / 2, 250);
      
      ctx.font = '14px Arial';
      ctx.fillText(`${profile.documentType}: ${profile.documentNumber}`, canvas.width / 2, 275);
      ctx.fillText(profile.type.name, canvas.width / 2, 300);
      
      if (profile.ficha) {
        ctx.fillText(`Ficha: ${profile.ficha.code}`, canvas.width / 2, 320);
      }

      // QR Code
      if (profile.qrCode) {
        const qrImg = new Image();
        qrImg.onload = () => {
          if (!ctx) return;
          ctx.drawImage(qrImg, 75, 350, 200, 200);
          
          canvas.toBlob((blob) => {
            if (blob) {
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `carnet_${profile.documentNumber}.png`;
              a.click();
              URL.revokeObjectURL(url);
            }
          });
        };
        qrImg.src = profile.qrCode;
      } else {
        canvas.toBlob((blob) => {
          if (blob) {
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `carnet_${profile.documentNumber}.png`;
            a.click();
            URL.revokeObjectURL(url);
          }
        });
      }
    };

    // Foto
    if (profile.profileImage) {
      const img = new Image();
      img.onload = () => {
        if (!ctx) return;
        ctx.drawImage(img, 125, 120, 100, 100);
        continuarGenerandoCarnet();
      };
      img.src = profile.profileImage;
    } else {
      ctx.fillStyle = '#e5e7eb';
      ctx.fillRect(125, 120, 100, 100);
      ctx.fillStyle = '#6b7280';
      ctx.font = 'bold 36px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(profile.firstName.charAt(0) + profile.lastName.charAt(0), 175, 180);
      continuarGenerandoCarnet();
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
              <button
                onClick={() => fileInputRef.current?.click()}
                className="absolute bottom-0 right-0 bg-sena-green text-white p-2 rounded-full hover:bg-sena-dark"
                disabled={saving}
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
          <div className="bg-white rounded-lg shadow p-6 text-center">
            <h3 className="font-medium text-gray-700 mb-4">Código QR</h3>
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
        </ul>
      </div>
    </div>
  );
};

export default LearnerProfilePage;