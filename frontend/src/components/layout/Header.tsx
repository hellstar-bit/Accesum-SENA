// src/components/layout/Header.tsx
import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';

interface HeaderProps {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
}

const Header = ({ sidebarOpen, setSidebarOpen }: HeaderProps) => {
  const { user, logout } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  return (
    <header className="bg-sena-green shadow-md relative">
      <div className="px-4 sm:px-6 py-3 flex justify-between items-center">
        {/* Botón de sidebar */}
        <div className="flex items-center space-x-4">
          <button
            className="text-white focus:outline-none hover:bg-white/20 p-2 rounded transition-colors"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            title={sidebarOpen ? 'Cerrar menú' : 'Abrir menú'}
          >
            {sidebarOpen ? (
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>

          {/* Título */}
          <div className="hidden sm:block">
            <h2 className="text-white text-lg font-medium">ACCESUM - Sistema de Control de Acceso</h2>
          </div>
          <div className="sm:hidden">
            <h1 className="text-white font-bold text-xl">ACCESUM</h1>
          </div>
        </div>

        {/* User dropdown */}
        <div className="flex items-center space-x-4 ml-auto relative">
          <span className="text-white hidden sm:block text-sm">
            {user?.email}
          </span>
          
          <div className="relative">
            <button 
              className="text-white focus:outline-none flex items-center space-x-2 hover:bg-white/20 p-2 rounded transition-colors"
              onClick={() => setDropdownOpen(!dropdownOpen)}
            >
              <div className="h-8 w-8 rounded-full bg-white/20 flex items-center justify-center text-white font-medium">
                {user?.email?.charAt(0).toUpperCase()}
              </div>
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {dropdownOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50">
                <div className="px-4 py-2 text-sm text-gray-700 border-b">
                  <p className="font-medium">{user?.email}</p>
                  <p className="text-xs text-gray-500 capitalize">{user?.role}</p>
                </div>
                
                <button 
                  onClick={() => {
                    setDropdownOpen(false);
                    logout();
                  }}
                  className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                >
                  <div className="flex items-center">
                    <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    Cerrar Sesión
                  </div>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {dropdownOpen && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setDropdownOpen(false)}
        ></div>
      )}
    </header>
  );
};

export default Header;