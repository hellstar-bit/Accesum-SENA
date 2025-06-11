// frontend/src/App.tsx - AGREGAR RUTA DE HORARIOS POR TRIMESTRE
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import UserManagement from './pages/UserManagement';
import AccessControl from './pages/AccessControl';
import Configuration from './pages/Configuration';
import ImportPage from './pages/ImportPage';
import LearnerProfile from './pages/LearnerProfile';
import InstructorManagement from './pages/InstructorManagement';
import InstructorProfile from './pages/InstructorProfile';
import InstructorDashboard from './pages/InstructorDashboard';
import InstructorAttendance from './pages/InstructorAttendance';
import MyClasses from './pages/MyClasses';
import ProfileManagement from './pages/ProfileManagement';
import TrimesterScheduleManagement from './pages/TrimesterScheduleManagement'; // ⭐ NUEVA IMPORTACIÓN
import Layout from './components/layout/Layout';
import PrivateRoute from './components/auth/PrivateRoute';
import { AuthProvider } from './context/AuthContext';

function App() {
  return (
    <div className="app-container h-screen overflow-hidden">
      <Router>
        <AuthProvider>
          <Routes>
            {/* Ruta de login - Pantalla completa */}
            <Route path="/login" element={<Login />} />
            
            {/* Rutas protegidas con layout */}
            <Route path="/" element={
              <PrivateRoute>
                <Layout />
              </PrivateRoute>
            }>
              {/* Redirección por defecto */}
              <Route index element={<Navigate to="/dashboard" replace />} />
              
              {/* Dashboard principal */}
              <Route path="dashboard" element={<Dashboard />} />
              
              {/* ⭐ GESTIÓN DE USUARIOS Y PERFILES */}
              <Route path="users" element={<UserManagement />} />
              <Route path="profiles" element={<ProfileManagement />} />
              
              {/* ⭐ CONTROL DE ACCESO */}
              <Route path="access" element={<AccessControl />} />
              
              {/* ⭐ GESTIÓN DE INSTRUCTORES */}
              <Route path="instructors" element={<InstructorManagement />} />
              <Route path="instructor-dashboard" element={<InstructorDashboard />} />
              <Route path="instructor-profile" element={<InstructorProfile />} />
              <Route path="instructor-attendance" element={<InstructorAttendance />} />
              <Route path="my-classes" element={<MyClasses />} />
              
              {/* ⭐ NUEVA RUTA - GESTIÓN DE HORARIOS POR TRIMESTRE */}
              <Route path="trimester-schedules" element={<TrimesterScheduleManagement />} />
              
              {/* ⭐ CONFIGURACIÓN DEL SISTEMA */}
              <Route path="config" element={<Configuration />} />
              
              {/* ⭐ IMPORTACIÓN DE DATOS */}
              <Route path="import" element={<ImportPage />} />
              
              {/* ⭐ PERFIL PERSONAL PARA APRENDICES */}
              <Route path="my-profile" element={<LearnerProfile />} />
              
              {/* Rutas legacy - mantener compatibilidad */}
              <Route path="user-management" element={<Navigate to="/users" replace />} />
              <Route path="profile-management" element={<Navigate to="/profiles" replace />} />
              <Route path="access-control" element={<Navigate to="/access" replace />} />
              <Route path="instructor-management" element={<Navigate to="/instructors" replace />} />
              <Route path="configuration" element={<Navigate to="/config" replace />} />
            </Route>
            
            {/* Catch-all - Redireccionar a dashboard */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AuthProvider>
      </Router>
    </div>
  );
}

export default App;
