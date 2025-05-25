// frontend/src/pages/AccessControl.tsx
import { useState, useEffect } from 'react';
import QRScanner from '../components/access/QRScanner';
import CurrentOccupancyComponent from '../components/access/CurrentOccupancy';
import AccessHistoryComponent from '../components/access/AccessHistory';
import { accessService } from '../services/accessService';
import type { AccessStats } from '../services/accessService';

const AccessControl = () => {
  const [activeTab, setActiveTab] = useState<'scanner' | 'current' | 'history'>('scanner');
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [stats, setStats] = useState<AccessStats | null>(null);

  useEffect(() => {
    fetchStats();
  }, [refreshTrigger]);

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
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-gray-800">Control de Acceso</h1>
        <p className="text-gray-600 mt-1">Gestiona las entradas y salidas del personal</p>
      </div>

      {/* Estadísticas rápidas */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-blue-100 text-blue-600">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-500 font-medium">Total Accesos Hoy</p>
                <p className="text-2xl font-semibold text-gray-700">{stats.totalAccess}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-green-100 text-green-600">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-500 font-medium">Actualmente Dentro</p>
                <p className="text-2xl font-semibold text-gray-700">{stats.currentlyInside}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-yellow-100 text-yellow-600">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-500 font-medium">Tiempo Promedio</p>
                <p className="text-2xl font-semibold text-gray-700">
                  {stats.averageDurationMinutes > 60
                    ? `${Math.floor(stats.averageDurationMinutes / 60)}h ${stats.averageDurationMinutes % 60}m`
                    : `${stats.averageDurationMinutes}m`}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-purple-100 text-purple-600">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-500 font-medium">Hora Pico</p>
                <p className="text-2xl font-semibold text-gray-700">
                  {stats.accessByHour.length > 0
                    ? `${stats.accessByHour.reduce((max, curr) => curr.count > max.count ? curr : max).hour}:00`
                    : '-'}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow">
        <div className="border-b">
          <nav className="flex -mb-px">
            <button
              onClick={() => setActiveTab('scanner')}
              className={`py-4 px-6 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'scanner'
                  ? 'border-sena-green text-sena-green'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Escáner QR
            </button>
            <button
              onClick={() => setActiveTab('current')}
              className={`py-4 px-6 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'current'
                  ? 'border-sena-green text-sena-green'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              En las Instalaciones
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`py-4 px-6 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'history'
                  ? 'border-sena-green text-sena-green'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Historial
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
    </div>
  );
};

export default AccessControl;