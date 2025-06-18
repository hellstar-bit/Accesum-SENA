// frontend/src/App.tsx - ACTUALIZADO CON REDIRECCIÓN POR ROL Y GUARDS
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import UserManagement from './pages/UserManagement';
import AccessControl from './pages/AccessControl';
import Configuration from './pages/Configuration';
import ImportPage from './pages/ImportPage';
import LearnerProfile from './pages/LearnerProfile';
import InstructorManagement from './pages/InstructorManagement';
import InstructorProfilePage from './pages/InstructorProfile';
import InstructorDashboard from './pages/InstructorDashboard';
import InstructorAttendance from './pages/InstructorAttendance';
import MyClasses from './pages/MyClasses';
import ProfileManagement from './pages/ProfileManagement';
import TrimesterScheduleManagement from './pages/TrimesterScheduleManagement';
import Layout from './components/layout/Layout';
import PrivateRoute from './components/auth/PrivateRoute';
import { AuthProvider } from './context/AuthContext';
import { useAuth } from './context/AuthContext';
import RecentActivity from './pages/RecentActivity';

// Componente para redirección inteligente por rol
const RoleBasedRedirect = () => {
  const { user } = useAuth();
  const userRole = user?.role?.name;
  
  console.log('🎯 RoleBasedRedirect - Redirigiendo según rol:', userRole);
  
  switch (userRole) {
    case 'Administrador':
      return <Navigate to="/dashboard" replace />;
    case 'Instructor':
      return <Navigate to="/instructor-profile" replace />;
    case 'Aprendiz':
      return <Navigate to="/my-classes" replace />;
    default:
      console.warn('⚠️ Rol no reconocido, redirigiendo a dashboard:', userRole);
      return <Navigate to="/dashboard" replace />;
  }
};

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
              {/* ⭐ REDIRECCIÓN INTELIGENTE POR ROL */}
              <Route index element={<RoleBasedRedirect />} />
              
              {/* ⭐ DASHBOARD PRINCIPAL - Solo Administradores */}
              <Route path="dashboard" element={
                <PrivateRoute roles={['Administrador']}>
                  <Dashboard />
                </PrivateRoute>
              } />
              
              {/* ⭐ GESTIÓN DE USUARIOS Y PERFILES - Solo Administradores */}
              <Route path="users" element={
                <PrivateRoute roles={['Administrador']}>
                  <UserManagement />
                </PrivateRoute>
              } />
              <Route path="profiles" element={
                <PrivateRoute roles={['Administrador']}>
                  <ProfileManagement />
                </PrivateRoute>
              } />

              {/* ⭐ ACTIVIDAD RECIENTE - Solo Administradores */}
              <Route path="recent-activity" element={
                <PrivateRoute roles={['Administrador']}>
                  <RecentActivity />
                </PrivateRoute>
              } />
              
              {/* ⭐ CONTROL DE ACCESO - Solo Administradores */}
              <Route path="access" element={
                <PrivateRoute roles={['Administrador']}>
                  <AccessControl />
                </PrivateRoute>
              } />
              
              {/* ⭐ GESTIÓN DE INSTRUCTORES - Solo Administradores */}
              <Route path="instructors" element={
                <PrivateRoute roles={['Administrador']}>
                  <InstructorManagement />
                </PrivateRoute>
              } />
              
              {/* ⭐ RUTAS DE INSTRUCTOR - RESTRINGIDAS */}
              
              {/* Dashboard de Instructor - BLOQUEADA */}
              <Route path="instructor-dashboard" element={
                <PrivateRoute roles={['BLOCKED_FOR_INSTRUCTOR']}>
                  <InstructorDashboard />
                </PrivateRoute>
              } />
              
              {/* Mis Clases - BLOQUEADA PARA INSTRUCTORES, PERMITIDA PARA APRENDICES */}
              <Route path="my-classes" element={
                <PrivateRoute roles={['Aprendiz']}>
                  <MyClasses />
                </PrivateRoute>
              } />
              
              {/* ⭐ RUTAS PERMITIDAS PARA INSTRUCTOR */}
              <Route path="instructor-profile" element={
                <PrivateRoute roles={['Instructor']}>
                  <InstructorProfilePage />
                </PrivateRoute>
              } />
              <Route path="instructor-attendance" element={
                <PrivateRoute roles={['Instructor']}>
                  <InstructorAttendance />
                </PrivateRoute>
              } />
              
              {/* ⭐ GESTIÓN DE HORARIOS POR TRIMESTRE - Solo Administradores */}
              <Route path="trimester-schedules" element={
                <PrivateRoute roles={['Administrador']}>
                  <TrimesterScheduleManagement />
                </PrivateRoute>
              } />
              
              {/* ⭐ CONFIGURACIÓN DEL SISTEMA - Solo Administradores */}
              <Route path="config" element={
                <PrivateRoute roles={['Administrador']}>
                  <Configuration />
                </PrivateRoute>
              } />
              
              {/* ⭐ IMPORTACIÓN DE DATOS - Solo Administradores */}
              <Route path="import" element={
                <PrivateRoute roles={['Administrador']}>
                  <ImportPage />
                </PrivateRoute>
              } />
              
              {/* ⭐ PERFIL PERSONAL PARA APRENDICES */}
              <Route path="my-profile" element={
                <PrivateRoute roles={['Aprendiz', 'Instructor', 'Administrador']}>
                  <LearnerProfile />
                </PrivateRoute>
              } />
              
              {/* Rutas legacy - mantener compatibilidad con redirección */}
              <Route path="user-management" element={<Navigate to="/users" replace />} />
              <Route path="profile-management" element={<Navigate to="/profiles" replace />} />
              <Route path="access-control" element={<Navigate to="/access" replace />} />
              <Route path="instructor-management" element={<Navigate to="/instructors" replace />} />
              <Route path="configuration" element={<Navigate to="/config" replace />} />
            </Route>
            
            {/* Catch-all - Redireccionar a la página principal con redirección inteligente */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AuthProvider>
      </Router>
    </div>
  );
}

export default App;