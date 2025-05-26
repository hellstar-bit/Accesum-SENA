// frontend/src/components/layout/Sidebar.tsx
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

interface SidebarProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

const Sidebar = ({ isOpen, setIsOpen }: SidebarProps) => {
  const { user } = useAuth();

  // Menús por rol
  const getMenuItemsByRole = () => {
    const baseItems = [
      { 
        name: 'Dashboard', 
        path: '/dashboard', 
        icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6', 
        roles: ['all'] 
      },
    ];

    const roleMenus = {
      'Administrador': [
        ...baseItems,
        { 
          name: 'Usuarios', 
          path: '/users', 
          icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z', 
          roles: ['Administrador'] 
        },
        { 
          name: 'Perfiles', 
          path: '/profiles', 
          icon: 'M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2', 
          roles: ['Administrador'] 
        },
        { 
          name: 'Control de Acceso', 
          path: '/access', 
          icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01', 
          roles: ['Administrador'] 
        },
        { 
          name: 'Importar', 
          path: '/import', 
          icon: 'M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12', 
          roles: ['Administrador'] 
        },
        { 
          name: 'Configuración', 
          path: '/config', 
          icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z', 
          roles: ['Administrador'] 
        },
      ],
      'Instructor': [
        ...baseItems,
        { 
          name: 'Importar Aprendices', 
          path: '/import', 
          icon: 'M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12', 
          roles: ['Instructor'] 
        },
        { 
          name: 'Ver Asistencia', 
          path: '/access', 
          icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01', 
          roles: ['Instructor'] 
        },
      ],
      'Aprendiz': [
        { 
          name: 'Mi Perfil', 
          path: '/my-profile', 
          icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z', 
          roles: ['Aprendiz'] 
        },
      ],
      'Escaner': [
        { 
          name: 'Control de Acceso', 
          path: '/access', 
          icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01', 
          roles: ['Escaner'] 
        },
      ],
      'Funcionario': [
        ...baseItems,
        { 
          name: 'Mi Perfil', 
          path: '/my-profile', 
          icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z', 
          roles: ['Funcionario'] 
        },
      ],
      'Contratista': [
        ...baseItems,
        { 
          name: 'Mi Perfil', 
          path: '/my-profile', 
          icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z', 
          roles: ['Contratista'] 
        },
      ],
      'Visitante': [
        ...baseItems,
        { 
          name: 'Mi Perfil', 
          path: '/my-profile', 
          icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z', 
          roles: ['Visitante'] 
        },
      ],
    };

    return roleMenus[user?.role as keyof typeof roleMenus] || baseItems;
  };

  const menuItems = getMenuItemsByRole();

  const handleClose = () => {
    setIsOpen(false);
  };

  return (
    <>
      {/* Backdrop - cierra el sidebar al hacer clic */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-20 bg-black bg-opacity-50"
          onClick={handleClose}
        ></div>
      )}

      {/* Sidebar */}
      <aside 
        className={`
          fixed inset-y-0 left-0 z-30 w-64 bg-white shadow-lg transform 
          ${isOpen ? 'translate-x-0' : '-translate-x-full'} 
          transition-transform duration-300 ease-in-out
        `}
      >
        {/* Header del sidebar */}
        <div className="flex items-center justify-center h-16 bg-sena-green px-4">
          <h1 className="text-white font-bold text-xl">ACCESUM</h1>
        </div>

        {/* Perfil de usuario */}
        <div className="px-4 py-4 border-b bg-sena-light/20">
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 rounded-full bg-sena-green flex items-center justify-center text-white font-bold">
              {user?.email?.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {user?.email?.split('@')[0]}
              </p>
              <p className="text-xs text-gray-500 capitalize">{user?.role}</p>
            </div>
          </div>
        </div>

        {/* Navegación */}
        <nav className="p-4 space-y-1 flex-1 overflow-y-auto">
          {menuItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={handleClose} // Cierra el sidebar al hacer clic en cualquier enlace
              className={({ isActive }) => `
                flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200
                ${isActive 
                  ? 'bg-sena-green text-white shadow-md' 
                  : 'text-gray-700 hover:bg-sena-light hover:text-sena-green'}
              `}
            >
              <svg 
                className="w-5 h-5 mr-3 flex-shrink-0" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth="2" 
                  d={item.icon}
                />
              </svg>
              <span className="truncate">{item.name}</span>
            </NavLink>
          ))}
        </nav>

        {/* Footer del sidebar */}
        <div className="p-4 border-t bg-gray-50">
          <div className="text-center">
            <p className="text-xs text-gray-500 font-medium">ACCESUM v1.0</p>
            <p className="text-xs text-gray-400">© 2025 SENA</p>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;