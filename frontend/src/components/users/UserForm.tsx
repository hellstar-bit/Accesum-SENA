// src/components/users/UserForm.tsx
import { useState, useEffect } from 'react';
import { userService } from '../../services/userService';
import { configService } from '../../services/configService';
import type { User, CreateUserRequest, UpdateUserRequest } from '../../services/userService';
import type { Role, PersonnelType, Regional, Center } from '../../services/configService';

interface UserFormProps {
  user?: User | null;
  onSave: () => void;
  onCancel: () => void;
}

const UserForm = ({ user, onSave, onCancel }: UserFormProps) => {
  // Form data
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    roleId: '',
    profile: {
      documentType: 'CC',
      documentNumber: '',
      firstName: '',
      lastName: '',
      phoneNumber: '',
      typeId: '',
      regionalId: '',
      centerId: '',
    }
  });

  // Options from backend
  const [roles, setRoles] = useState<Role[]>([]);
  const [personnelTypes, setPersonnelTypes] = useState<PersonnelType[]>([]);
  const [regionales, setRegionales] = useState<Regional[]>([]);
  const [centers, setCenters] = useState<Center[]>([]);

  // UI state
  const [loading, setLoading] = useState(false);
  const [loadingOptions, setLoadingOptions] = useState(true);
  const [errors, setErrors] = useState<string[]>([]);

  const isEditing = !!user;

  useEffect(() => {
    loadOptions();
    if (user) {
      loadUserData();
    }
  }, [user]);

  const loadOptions = async () => {
    try {
      setLoadingOptions(true);
      const [rolesData, typesData, regionalesData, centersData] = await Promise.all([
        configService.getRoles(),
        configService.getPersonnelTypes(),
        configService.getRegionales(),
        configService.getCenters(),
      ]);

      setRoles(rolesData);
      setPersonnelTypes(typesData);
      setRegionales(regionalesData);
      setCenters(centersData);
    } catch (error) {
      console.error('Error al cargar opciones:', error);
      setErrors(['Error al cargar las opciones del formulario']);
    } finally {
      setLoadingOptions(false);
    }
  };

  const loadUserData = () => {
    if (user) {
      setFormData({
        email: user.email,
        password: '', // No mostramos la contraseña actual
        roleId: user.role.id.toString(),
        profile: {
          documentType: user.profile.documentType,
          documentNumber: user.profile.documentNumber,
          firstName: user.profile.firstName,
          lastName: user.profile.lastName,
          phoneNumber: user.profile.phoneNumber || '',
          typeId: user.profile.type.id.toString(),
          regionalId: user.profile.regional.id.toString(),
          centerId: user.profile.center.id.toString(),
        }
      });
    }
  };

  const handleInputChange = (field: string, value: string) => {
    if (field.startsWith('profile.')) {
      const profileField = field.replace('profile.', '');
      setFormData(prev => ({
        ...prev,
        profile: {
          ...prev.profile,
          [profileField]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: value
      }));
    }
  };

  const handleRegionalChange = async (regionalId: string) => {
    handleInputChange('profile.regionalId', regionalId);
    handleInputChange('profile.centerId', ''); // Reset center selection
    
    if (regionalId) {
      try {
        const centersData = await configService.getCentersByRegional(parseInt(regionalId));
        setCenters(centersData);
      } catch (error) {
        console.error('Error al cargar centros:', error);
      }
    } else {
      setCenters([]);
    }
  };

  const validateForm = (): string[] => {
    const newErrors: string[] = [];

    if (!formData.email.trim()) newErrors.push('El email es requerido');
    if (!isEditing && !formData.password.trim()) newErrors.push('La contraseña es requerida');
    if (!formData.roleId) newErrors.push('El rol es requerido');
    if (!formData.profile.documentNumber.trim()) newErrors.push('El número de documento es requerido');
    if (!formData.profile.firstName.trim()) newErrors.push('El nombre es requerido');
    if (!formData.profile.lastName.trim()) newErrors.push('Los apellidos son requeridos');
    if (!formData.profile.typeId) newErrors.push('El tipo de personal es requerido');
    if (!formData.profile.regionalId) newErrors.push('La regional es requerida');
    if (!formData.profile.centerId) newErrors.push('El centro es requerido');

    // Validaciones adicionales
    if (formData.email && !/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.push('El formato del email no es válido');
    }

    if (!isEditing && formData.password && formData.password.length < 6) {
      newErrors.push('La contraseña debe tener al menos 6 caracteres');
    }

    return newErrors;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors([]);

    const validationErrors = validateForm();
    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      return;
    }

    setLoading(true);

    try {
      if (isEditing && user) {
        // Actualizar usuario
        const updateData: UpdateUserRequest = {
          email: formData.email,
          roleId: parseInt(formData.roleId),
          profile: {
            documentType: formData.profile.documentType,
            documentNumber: formData.profile.documentNumber,
            firstName: formData.profile.firstName,
            lastName: formData.profile.lastName,
            phoneNumber: formData.profile.phoneNumber || undefined,
            typeId: parseInt(formData.profile.typeId),
            regionalId: parseInt(formData.profile.regionalId),
            centerId: parseInt(formData.profile.centerId),
          }
        };

        await userService.updateUser(user.id, updateData);
      } else {
        // Crear usuario
        const createData: CreateUserRequest = {
          email: formData.email,
          password: formData.password,
          roleId: parseInt(formData.roleId),
          profile: {
            documentType: formData.profile.documentType,
            documentNumber: formData.profile.documentNumber,
            firstName: formData.profile.firstName,
            lastName: formData.profile.lastName,
            phoneNumber: formData.profile.phoneNumber || undefined,
            typeId: parseInt(formData.profile.typeId),
            regionalId: parseInt(formData.profile.regionalId),
            centerId: parseInt(formData.profile.centerId),
          }
        };

        await userService.createUser(createData);
      }

      onSave();
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Error al guardar el usuario';
      setErrors([errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  if (loadingOptions) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-sena-green"></div>
        <span className="ml-2">Cargando formulario...</span>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <h3 className="text-xl font-semibold mb-6">
            {isEditing ? 'Editar Usuario' : 'Crear Usuario'}
          </h3>

          {errors.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <ul className="text-red-700 text-sm">
                {errors.map((error, index) => (
                  <li key={index}>• {error}</li>
                ))}
              </ul>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Información de acceso */}
            <div className="border-b pb-6">
              <h4 className="text-lg font-medium mb-4">Información de Acceso</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email *
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    className="input-field"
                    placeholder="usuario@sena.edu.co"
                  />
                </div>

                {!isEditing && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Contraseña *
                    </label>
                    <input
                      type="password"
                      value={formData.password}
                      onChange={(e) => handleInputChange('password', e.target.value)}
                      className="input-field"
                      placeholder="Mínimo 6 caracteres"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Rol *
                  </label>
                  <select
                    value={formData.roleId}
                    onChange={(e) => handleInputChange('roleId', e.target.value)}
                    className="input-field"
                  >
                    <option value="">Seleccionar rol</option>
                    {roles.map((role) => (
                      <option key={role.id} value={role.id}>
                        {role.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Información personal */}
            <div className="border-b pb-6">
              <h4 className="text-lg font-medium mb-4">Información Personal</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tipo de Documento *
                  </label>
                  <select
                    value={formData.profile.documentType}
                    onChange={(e) => handleInputChange('profile.documentType', e.target.value)}
                    className="input-field"
                  >
                    <option value="CC">Cédula de Ciudadanía</option>
                    <option value="CE">Cédula de Extranjería</option>
                    <option value="TI">Tarjeta de Identidad</option>
                    <option value="PA">Pasaporte</option>
                    <option value="RC">Registro Civil</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Número de Documento *
                  </label>
                  <input
                    type="text"
                    value={formData.profile.documentNumber}
                    onChange={(e) => handleInputChange('profile.documentNumber', e.target.value)}
                    className="input-field"
                    placeholder="12345678"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nombres *
                  </label>
                  <input
                    type="text"
                    value={formData.profile.firstName}
                    onChange={(e) => handleInputChange('profile.firstName', e.target.value)}
                    className="input-field"
                    placeholder="Juan Carlos"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Apellidos *
                  </label>
                  <input
                    type="text"
                    value={formData.profile.lastName}
                    onChange={(e) => handleInputChange('profile.lastName', e.target.value)}
                    className="input-field"
                    placeholder="Pérez García"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Teléfono
                  </label>
                  <input
                    type="tel"
                    value={formData.profile.phoneNumber}
                    onChange={(e) => handleInputChange('profile.phoneNumber', e.target.value)}
                    className="input-field"
                    placeholder="3001234567"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tipo de Personal *
                  </label>
                  <select
                    value={formData.profile.typeId}
                    onChange={(e) => handleInputChange('profile.typeId', e.target.value)}
                    className="input-field"
                  >
                    <option value="">Seleccionar tipo</option>
                    {personnelTypes.map((type) => (
                      <option key={type.id} value={type.id}>
                        {type.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Información organizacional */}
            <div>
              <h4 className="text-lg font-medium mb-4">Información Organizacional</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Regional *
                  </label>
                  <select
                    value={formData.profile.regionalId}
                    onChange={(e) => handleRegionalChange(e.target.value)}
                    className="input-field"
                  >
                    <option value="">Seleccionar regional</option>
                    {regionales.map((regional) => (
                      <option key={regional.id} value={regional.id}>
                        {regional.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Centro *
                  </label>
                  <select
                    value={formData.profile.centerId}
                    onChange={(e) => handleInputChange('profile.centerId', e.target.value)}
                    className="input-field"
                    disabled={!formData.profile.regionalId}
                  >
                    <option value="">Seleccionar centro</option>
                    {centers
                      .filter(center => center.regionalId === parseInt(formData.profile.regionalId))
                      .map((center) => (
                        <option key={center.id} value={center.id}>
                          {center.name}
                        </option>
                      ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Botones */}
            <div className="flex justify-end space-x-4 pt-6 border-t">
              <button
                type="button"
                onClick={onCancel}
                className="btn-secondary"
                disabled={loading}
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="btn-primary flex items-center space-x-2"
                disabled={loading}
              >
                {loading && (
                  <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
                )}
                <span>{isEditing ? 'Actualizar' : 'Crear'} Usuario</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default UserForm;