import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

interface PrivateRouteProps {
  children: ReactNode;
  roles?: string[];
}

const PrivateRoute = ({ children, roles }: PrivateRouteProps) => {
  const { isAuthenticated, loading, user } = useAuth();

  console.log('🔒 PrivateRoute - Estado actual:', {
    isAuthenticated,
    loading,
    userRole: user?.role?.name,
    userId: user?.id,
    requiredRoles: roles,
  });

  // Mostrar loading mientras se verifica la autenticación
  if (loading) {
    console.log('⏳ PrivateRoute - Mostrando loading...');
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-sena-green"></div>
      </div>
    );
  }

  // Si no está autenticado, redirigir al login
  if (!isAuthenticated) {
    console.log('❌ PrivateRoute - Usuario no autenticado, redirigiendo a login');
    return <Navigate to="/login" replace />;
  }

  // Si se especificaron roles, verificar que el usuario tenga el rol correcto
  if (roles && roles.length > 0) {
    const userRole = user?.role?.name;
    console.log('🎭 PrivateRoute - Verificando roles:', {
      userRole,
      requiredRoles: roles,
      hasAccess: userRole && roles.includes(userRole)
    });
    
    if (!userRole || !roles.includes(userRole)) {
      // Redirigir según el rol del usuario
      const redirectPath = getRedirectPathByRole(userRole);
      console.log(`🔄 PrivateRoute - Rol incorrecto, redirigiendo a: ${redirectPath}`);
      return <Navigate to={redirectPath} replace />;
    }
  }

  console.log('✅ PrivateRoute - Acceso autorizado, renderizando children');
  return <>{children}</>;
};

// Función auxiliar para redirigir según el rol
const getRedirectPathByRole = (role: string | undefined): string => {
  console.log('🎯 getRedirectPathByRole - rol:', role);
  switch (role) {
    case 'Administrador':
      return '/dashboard';
    case 'Instructor':
      return '/instructor-dashboard';
    case 'Aprendiz':
      return '/learner-profile';
    default:
      console.warn('⚠️ Rol no reconocido:', role);
      return '/login';
  }
};

export default PrivateRoute;