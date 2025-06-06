// frontend/src/context/AuthContext.tsx - FIX DEFINITIVO
import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import type { User, AuthUser } from '../types/user.types';
import { authService } from '../services/authService';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  console.log('🏗️ AuthProvider renderizado - Estado actual:', {
    user: user ? { id: user.id, email: user.email, role: user.role?.name } : null,
    loading,
    isAuthenticated: !!user
  });

  useEffect(() => {
    console.log('🔄 AuthProvider useEffect ejecutado');
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    console.log('🔍 checkAuthStatus iniciado');
    try {
      const token = localStorage.getItem('token');
      console.log('🎫 Token en localStorage:', token ? 'EXISTE' : 'NO EXISTE');
      
      if (token) {
        console.log('🔍 Verificando token existente...');
        // Verificar si el token es válido obteniendo el perfil del usuario
        const userData = await authService.getCurrentUser();
        setUser(userData);
        console.log('✅ Usuario verificado exitosamente:', {
          id: userData.id,
          email: userData.email,
          role: userData.role?.name
        });
      } else {
        console.log('ℹ️ No hay token, manteniendo usuario como null');
      }
    } catch (error) {
      console.error('❌ Error checking auth status:', error);
      // Si hay error, limpiar token inválido
      localStorage.removeItem('token');
      setUser(null);
      console.log('🗑️ Token limpiado debido a error');
    } finally {
      setLoading(false);
      console.log('✅ checkAuthStatus completado - loading: false');
    }
  };

  const login = async (email: string, password: string) => {
    console.log('🚀 login iniciado para:', email);
    setLoading(true);
    try {
      console.log('📞 Llamando a authService.login...');
      const authData: AuthUser = await authService.login(email, password);
      
      console.log('🎯 authData recibido:', {
        tokenExists: !!authData.token,
        tokenLength: authData.token?.length,
        userExists: !!authData.user,
        userId: authData.user?.id,
        userEmail: authData.user?.email
      });
      
      // ✅ VERIFICAR QUE EL TOKEN EXISTE ANTES DE GUARDARLO
      if (!authData.token) {
        throw new Error('No se recibió token del servidor');
      }
      
      console.log('💾 Guardando token en localStorage...');
      localStorage.setItem('token', authData.token);
      
      // ✅ VERIFICAR QUE SE GUARDÓ CORRECTAMENTE
      const savedToken = localStorage.getItem('token');
      console.log('🔍 Token guardado verificación:', savedToken ? 'SÍ GUARDADO' : 'ERROR: NO SE GUARDÓ');
      
      if (!savedToken) {
        throw new Error('Error al guardar token en localStorage');
      }
      
      // ✅ DESPUÉS establecer el usuario
      console.log('👤 Estableciendo usuario en contexto...');
      setUser(authData.user);
      
      console.log('✅ Login completado exitosamente - Estado final:', {
        tokenInStorage: !!localStorage.getItem('token'),
        userSet: !!authData.user,
        userRole: authData.user.role?.name
      });
      
    } catch (error) {
      console.error('❌ Login error:', error);
      // Limpiar en caso de error
      localStorage.removeItem('token');
      setUser(null);
      throw error;
    } finally {
      setLoading(false);
      console.log('✅ login completado - loading: false');
    }
  };

  const logout = () => {
    console.log('🚪 logout ejecutado');
    setUser(null);
    localStorage.removeItem('token');
    window.location.href = '/login';
  };

  const isAuthenticated = !!user;

  console.log('📊 AuthProvider - Estado final:', {
    user: user ? { id: user.id, email: user.email, role: user.role?.name } : null,
    loading,
    isAuthenticated,
    tokenInStorage: !!localStorage.getItem('token')
  });

  return (
    <AuthContext.Provider value={{ 
      user, 
      loading, 
      isAuthenticated, 
      login, 
      logout 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  console.log('🎣 useAuth llamado - retornando:', {
    user: context.user ? { id: context.user.id, email: context.user.email, role: context.user.role?.name } : null,
    loading: context.loading,
    isAuthenticated: context.isAuthenticated,
    tokenInStorage: !!localStorage.getItem('token')
  });
  
  return context;
};

export { AuthContext };