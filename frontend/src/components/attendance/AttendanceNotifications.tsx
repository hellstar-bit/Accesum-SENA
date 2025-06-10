// frontend/src/components/attendance/AttendanceNotifications.tsx
import { useState, useEffect } from 'react';
import { attendanceService } from '../../services/attendanceService';

interface AttendanceNotification {
  id: string;
  type: 'AUTO_ATTENDANCE' | 'MANUAL_ATTENDANCE' | 'CLASS_UPDATE';
  timestamp: Date;
  classId: number;
  learnerId: number;
  learnerName: string;
  status: 'PRESENT' | 'LATE' | 'ABSENT';
  isAutomatic: boolean;
  className: string;
  fichaCode: string;
}

const AttendanceNotifications = () => {
  const [notifications, setNotifications] = useState<AttendanceNotification[]>([]);
  const [stats, setStats] = useState({ total: 0, recent: 0, byType: { auto: 0, manual: 0 } });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchNotifications();
    
    // Auto-refresh cada 30 segundos
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      // Aquí llamarías al servicio de notificaciones
      // const response = await attendanceService.getMyNotifications();
      // setNotifications(response.notifications);
      // setStats(response.stats);
    } catch (error) {
      console.error('Error al cargar notificaciones:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationIds: string[]) => {
    try {
      // await attendanceService.markNotificationsAsRead(notificationIds);
      setNotifications(prev => 
        prev.filter(n => !notificationIds.includes(n.id))
      );
    } catch (error) {
      console.error('Error al marcar como leídas:', error);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PRESENT': return '✅';
      case 'LATE': return '⏰';
      case 'ABSENT': return '❌';
      default: return '📝';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PRESENT': return 'text-green-600 bg-green-50';
      case 'LATE': return 'text-yellow-600 bg-yellow-50';
      case 'ABSENT': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border">
      <div className="px-4 py-3 border-b bg-gray-50">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold text-gray-800">
            🔔 Notificaciones de Asistencia
          </h3>
          <div className="flex items-center space-x-3">
            <span className="text-sm text-gray-600">
              {stats.recent} nuevas
            </span>
            <button
              onClick={fetchNotifications}
              disabled={loading}
              className="text-blue-600 hover:text-blue-800 text-sm"
            >
              {loading ? '🔄' : '↻'} Actualizar
            </button>
          </div>
        </div>
        
        {/* Stats mini */}
        <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
          <span>🤖 Auto: {stats.byType.auto}</span>
          <span>👤 Manual: {stats.byType.manual}</span>
          <span>📊 Total: {stats.total}</span>
        </div>
      </div>

      <div className="max-h-64 overflow-y-auto">
        {notifications.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            <div className="text-4xl mb-2">🔕</div>
            <p>No tienes notificaciones</p>
          </div>
        ) : (
          notifications.map((notification) => (
            <div
              key={notification.id}
              className="p-3 border-b hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-start space-x-3">
                <div className={`p-2 rounded-full ${getStatusColor(notification.status)}`}>
                  {getStatusIcon(notification.status)}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2">
                    <span className="font-medium text-gray-900">
                      {notification.learnerName}
                    </span>
                    <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                      {notification.fichaCode}
                    </span>
                    {notification.isAutomatic && (
                      <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                        🤖 Auto
                      </span>
                    )}
                  </div>
                  
                  <p className="text-sm text-gray-600 mt-1">
                    {notification.className} • {
                      notification.status === 'PRESENT' ? 'Llegó a tiempo' :
                      notification.status === 'LATE' ? 'Llegó tarde' :
                      'No se presentó'
                    }
                  </p>
                  
                  <p className="text-xs text-gray-500 mt-1">
                    {new Date(notification.timestamp).toLocaleString('es-CO')}
                  </p>
                </div>
                
                <button
                  onClick={() => markAsRead([notification.id])}
                  className="text-gray-400 hover:text-gray-600 text-xs"
                  title="Marcar como leída"
                >
                  ✕
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {notifications.length > 0 && (
        <div className="px-4 py-3 border-t bg-gray-50">
          <button
            onClick={() => markAsRead(notifications.map(n => n.id))}
            className="text-sm text-blue-600 hover:text-blue-800"
          >
            ✓ Marcar todas como leídas
          </button>
        </div>
      )}
    </div>
  );
};

export default AttendanceNotifications;