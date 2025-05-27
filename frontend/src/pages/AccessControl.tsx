// frontend/src/pages/AccessControl.tsx - Completo con controles mejorados
import { useState, useEffect } from 'react';
import QRScanner from '../components/access/QRScanner';
import CurrentOccupancyComponent from '../components/access/CurrentOccupancy';
import AccessHistoryComponent from '../components/access/AccessHistory';
import { accessService } from '../services/accessService';
import type { AccessStats } from '../services/accessService';
import Swal from 'sweetalert2';

const AccessControl = () => {
  const [activeTab, setActiveTab] = useState<'scanner' | 'current' | 'history'>('scanner');
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [stats, setStats] = useState<AccessStats | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [autoRefresh, setAutoRefresh] = useState(true);

  useEffect(() => {
    fetchStats();
    
    if (autoRefresh) {
      // Actualizar estadísticas cada 30 segundos
      const interval = setInterval(() => {
        fetchStats();
        setLastUpdate(new Date());
      }, 30000);

      return () => clearInterval(interval);
    }
  }, [refreshTrigger, autoRefresh]);

  const fetchStats = async () => {
    try {
      const data = await accessService.getStats(new Date());
      setStats(data);
    } catch (error) {
      console.error('Error al cargar estadísticas:', error);
    }
  };

  const handleScanSuccess = () => {
    setRefreshTrigger(prev => prev + 1);
    
    // ⭐ MOSTRAR NOTIFICACIÓN DE ACTUALIZACIÓN
    const Toast = Swal.mixin({
      toast: true,
      position: 'top-end',
      showConfirmButton: false,
      timer: 2000,
      timerProgressBar: true,
      didOpen: (toast) => {
        toast.addEventListener('mouseenter', Swal.stopTimer)
        toast.addEventListener('mouseleave', Swal.resumeTimer)
      }
    });

    Toast.fire({
      icon: 'success',
      title: 'Registro actualizado',
      text: 'Las estadísticas se han actualizado'
    });
  };

  const handleManualRefresh = async () => {
    const result = await Swal.fire({
      title: '🔄 Actualizar datos',
      text: '¿Desea actualizar todas las estadísticas y datos de acceso?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#39A900',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Sí, actualizar',
      cancelButtonText: 'Cancelar',
      reverseButtons: true
    });

    if (result.isConfirmed) {
      Swal.fire({
        title: 'Actualizando...',
        text: 'Obteniendo datos más recientes',
        allowOutsideClick: false,
        showConfirmButton: false,
        didOpen: () => {
          Swal.showLoading();
        }
      });

      try {
        await fetchStats();
        setRefreshTrigger(prev => prev + 1);
        setLastUpdate(new Date());
        
        setTimeout(() => {
          Swal.fire({
            title: '✅ Actualizado',
            text: 'Todos los datos han sido actualizados correctamente',
            icon: 'success',
            timer: 2000,
            showConfirmButton: false
          });
        }, 800);
      } catch (error) {
        Swal.fire({
          title: '❌ Error',
          text: 'No se pudieron actualizar los datos',
          icon: 'error',
          confirmButtonColor: '#dc2626'
        });
      }
    }
  };

  const toggleAutoRefresh = () => {
    setAutoRefresh(!autoRefresh);
    
    const Toast = Swal.mixin({
      toast: true,
      position: 'top-end',
      showConfirmButton: false,
      timer: 2000,
    });

    Toast.fire({
      icon: autoRefresh ? 'warning' : 'success',
      title: `Actualización automática ${!autoRefresh ? 'activada' : 'desactivada'}`
    });
  };

  const formatLastUpdate = () => {
    return lastUpdate.toLocaleTimeString('es-CO', { 
      hour12: true, 
      hour: '2-digit', 
      minute: '2-digit',
      second: '2-digit'
    });
  };

  return (
    <div className="space-y-6">
      {/* Header mejorado */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-800">🔐 Control de Acceso</h1>
          <p className="text-gray-600 mt-1">
            Gestiona las entradas y salidas del personal SENA
          </p>
          <div className="flex items-center space-x-4 text-sm text-gray-500 mt-2">
            <span>📅 {new Date().toLocaleDateString('es-CO')}</span>
            <span>🕒 Última actualización: {formatLastUpdate()}</span>
            {autoRefresh && <span className="text-green-600">🔄 Auto-actualización activa</span>}
          </div>
        </div>
        
        <div className="flex space-x-2">
          <button
            onClick={toggleAutoRefresh}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              autoRefresh 
                ? 'bg-green-100 text-green-700 hover:bg-green-200' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {autoRefresh ? '⏸️ Pausar auto-actualización' : '▶️ Activar auto-actualización'}
          </button>
          <button
            onClick={handleManualRefresh}
            className="px-4 py-2 bg-sena-green text-white rounded-lg hover:bg-sena-dark text-sm font-medium transition-colors flex items-center space-x-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <span>Actualizar</span>
          </button>
        </div>
      </div>

      {/* Estadísticas rápidas mejoradas */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg shadow p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm font-medium">Total Accesos Hoy</p>
                <p className="text-3xl font-bold">{stats.totalAccess}</p>
                <p className="text-blue-100 text-xs mt-1">Entradas y salidas</p>
              </div>
              <div className="p-3 bg-blue-400 bg-opacity-30 rounded-full">
                <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-lg shadow p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm font-medium">Actualmente Dentro</p>
                <p className="text-3xl font-bold">{stats.currentlyInside}</p>
                <p className="text-green-100 text-xs mt-1">Personas en instalaciones</p>
              </div>
              <div className="p-3 bg-green-400 bg-opacity-30 rounded-full">
                <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-yellow-500 to-yellow-600 rounded-lg shadow p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-yellow-100 text-sm font-medium">Tiempo Promedio</p>
                <p className="text-3xl font-bold">
                  {stats.averageDurationMinutes > 60
                    ? `${Math.floor(stats.averageDurationMinutes / 60)}h`
                    : `${stats.averageDurationMinutes}m`}
                </p>
                <p className="text-yellow-100 text-xs mt-1">Permanencia promedio</p>
              </div>
              <div className="p-3 bg-yellow-400 bg-opacity-30 rounded-full">
                <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg shadow p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 text-sm font-medium">Hora Pico</p>
                <p className="text-3xl font-bold">
                  {stats.accessByHour.length > 0
                    ? `${stats.accessByHour.reduce((max, curr) => curr.count > max.count ? curr : max).hour}:00`
                    : '--:--'}
                </p>
                <p className="text-purple-100 text-xs mt-1">Mayor actividad</p>
              </div>
              <div className="p-3 bg-purple-400 bg-opacity-30 rounded-full">
                <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tabs mejorados */}
      <div className="bg-white rounded-lg shadow">
        <div className="border-b">
          <nav className="flex -mb-px">
            <button
              onClick={() => setActiveTab('scanner')}
              className={`flex items-center space-x-2 py-4 px-6 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'scanner'
                  ? 'border-sena-green text-sena-green bg-sena-light bg-opacity-20'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
              </svg>
              <span>Escáner QR</span>
            </button>
            <button
              onClick={() => setActiveTab('current')}
              className={`flex items-center space-x-2 py-4 px-6 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'current'
                  ? 'border-sena-green text-sena-green bg-sena-light bg-opacity-20'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
              <span>En las Instalaciones</span>
              {stats && stats.currentlyInside > 0 && (
                <span className="bg-green-100 text-green-800 text-xs font-medium px-2 py-1 rounded-full">
                  {stats.currentlyInside}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`flex items-center space-x-2 py-4 px-6 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'history'
                  ? 'border-sena-green text-sena-green bg-sena-light bg-opacity-20'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>Historial</span>
            </button>
          </nav>
        </div>

        {/* Content */}
        <div className="p-6">
          {activeTab === 'scanner' && (
            <QRScanner onScanSuccess={handleScanSuccess} />
          )}
          {activeTab === 'current' && (
            <CurrentOccupancyComponent refreshTrigger={refreshTrigger} />
          )}
          {activeTab === 'history' && (
            <AccessHistoryComponent />
          )}
        </div>
      </div>

      {/* ⭐ INFORMACIÓN ADICIONAL */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-medium text-blue-800 mb-2">💡 Información del Sistema:</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-blue-700">
          <ul className="space-y-1">
            <li>• El escáner QR detecta automáticamente entrada o salida</li>
            <li>• Las estadísticas se actualizan cada 30 segundos</li>
            <li>• Use búsqueda manual si el QR no funciona</li>
          </ul>
          <ul className="space-y-1">
            <li>• Los registros se guardan automáticamente</li>
            <li>• Puede pausar la actualización automática si es necesario</li>
            <li>• El historial muestra todos los movimientos del día</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default AccessControl;