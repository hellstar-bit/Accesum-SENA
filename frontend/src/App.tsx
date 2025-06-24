// frontend/src/App.tsx - CON RUTAS PARA CONTROL DE ACCESO
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import PrivateRoute from './components/auth/PrivateRoute';
import Layout from './components/layout/Layout';

// Páginas de autenticación
import Login from './pages/Login';
import ForgotPassword from './pages/ForgotPassword';    // ⭐ NUEVO
import ResetPassword from './pages/ResetPassword';  

// Páginas del administrador
import Dashboard from './pages/Dashboard';
import UserManagement from './pages/UserManagement';
import Configuration from './pages/Configuration';
import ImportPage from './pages/ImportPage';
import InstructorManagement from './pages/InstructorManagement';
import ProfileManagement from './pages/ProfileManagement';
import TrimesterScheduleManagement from './pages/TrimesterScheduleManagement';
import RecentActivity from './pages/RecentActivity';

// Páginas del instructor
import InstructorDashboard from './pages/InstructorDashboard';
import InstructorAttendance from './pages/InstructorAttendance';
import InstructorProfile from './pages/InstructorProfile';

// Páginas del aprendiz
import LearnerProfile from './pages/LearnerProfile';
import MyClasses from './pages/MyClasses';

// Páginas de control de acceso
import AccessControl from './pages/AccessControl';

function App() {
  return (
    <Router>
      <AuthProvider>
        <div className="App">
          <Routes>
            {/* ================================= */}
            {/* RUTAS PÚBLICAS DE AUTENTICACIÓN */}
            {/* ================================= */}
            <Route path="/login" element={<Login />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password/:token" element={<ResetPassword />} />
            
            {/* Redirección de la raíz */}
            <Route path="/" element={<Navigate to="/login" replace />} />
            
            {/* Rutas protegidas con layout */}
            <Route path="/" element={
              <PrivateRoute>
                <Layout />
              </PrivateRoute>
            }>
              
              {/* ================================= */}
              {/* RUTAS DEL ADMINISTRADOR */}
              {/* ================================= */}

              {/* ⭐ NUEVA RUTA: RECENT ACTIVITY */}
              <Route path="/recent-activity" element={
                <PrivateRoute roles={['Administrador', 'Control de Acceso']}>
                  <RecentActivity />
                </PrivateRoute>
              } />
              <Route path="/dashboard" element={
                <PrivateRoute roles={['Administrador']}>
                  <Dashboard />
                </PrivateRoute>
              } />
              
              <Route path="/users" element={
                <PrivateRoute roles={['Administrador']}>
                  <UserManagement />
                </PrivateRoute>
              } />
              
              <Route path="/profiles" element={
                <PrivateRoute roles={['Administrador']}>
                  <ProfileManagement />
                </PrivateRoute>
              } />
              
              <Route path="/instructors" element={
                <PrivateRoute roles={['Administrador']}>
                  <InstructorManagement />
                </PrivateRoute>
              } />
              
              <Route path="/config" element={
                <PrivateRoute roles={['Administrador']}>
                  <Configuration />
                </PrivateRoute>
              } />
              
              <Route path="/import" element={
                <PrivateRoute roles={['Administrador']}>
                  <ImportPage />
                </PrivateRoute>
              } />
              
              <Route path="/trimester-schedule" element={
                <PrivateRoute roles={['Administrador']}>
                  <TrimesterScheduleManagement />
                </PrivateRoute>
              } />
              
              {/* ================================= */}
              {/* RUTAS DEL INSTRUCTOR */}
              {/* ================================= */}
              <Route path="/instructor-dashboard" element={
                <PrivateRoute roles={['Instructor']}>
                  <InstructorDashboard />
                </PrivateRoute>
              } />
              
              <Route path="/instructor-attendance" element={
                <PrivateRoute roles={['Instructor']}>
                  <InstructorAttendance />
                </PrivateRoute>
              } />
              
              <Route path="/instructor-profile" element={
                <PrivateRoute roles={['Instructor']}>
                  <InstructorProfile />
                </PrivateRoute>
              } />
              
              {/* ================================= */}
              {/* RUTAS DEL APRENDIZ */}
              {/* ================================= */}
              <Route path="/learner-profile" element={
                <PrivateRoute roles={['Aprendiz']}>
                  <LearnerProfile />
                </PrivateRoute>
              } />
              
              <Route path="/my-classes" element={
                <PrivateRoute roles={['Aprendiz']}>
                  <MyClasses />
                </PrivateRoute>
              } />
              
              <Route path="/my-profile" element={
                <PrivateRoute roles={['Aprendiz']}>
                  <LearnerProfile />
                </PrivateRoute>
              } />
              
              {/* ================================= */}
              {/* RUTAS DE CONTROL DE ACCESO */}
              {/* ================================= */}
              
              {/* ⭐ RUTA PRINCIPAL PARA CONTROL DE ACCESO */}
              <Route path="/access" element={
                <PrivateRoute roles={['Administrador', 'Control de Acceso']}>
                  <AccessControl />
                </PrivateRoute>
              } />
              
              {/* ⭐ PERFIL PARA USUARIO DE CONTROL DE ACCESO */}
              <Route path="/access-profile" element={
                <PrivateRoute roles={['Control de Acceso']}>
                  <InstructorProfile />
                </PrivateRoute>
              } />
              
              {/* ================================= */}
              {/* RUTAS BLOQUEADAS PARA CIERTOS ROLES */}
              {/* ================================= */}
              
              {/* Rutas que instructores NO pueden acceder */}
              <Route path="/users/*" element={
                <PrivateRoute roles={['BLOCKED_FOR_INSTRUCTOR']}>
                  <div>Acceso denegado</div>
                </PrivateRoute>
              } />
              
              {/* Rutas que Control de Acceso NO puede acceder */}
              <Route path="/dashboard" element={
                <PrivateRoute roles={['BLOCKED_FOR_ACCESS_CONTROL']}>
                  <div>Acceso denegado</div>
                </PrivateRoute>
              } />

              
              
              <Route path="/users" element={
                <PrivateRoute roles={['BLOCKED_FOR_ACCESS_CONTROL']}>
                  <div>Acceso denegado</div>
                </PrivateRoute>
              } />
              
              <Route path="/config" element={
                <PrivateRoute roles={['BLOCKED_FOR_ACCESS_CONTROL']}>
                  <div>Acceso denegado</div>
                </PrivateRoute>
              } />
              
              <Route path="/import" element={
                <PrivateRoute roles={['BLOCKED_FOR_ACCESS_CONTROL']}>
                  <div>Acceso denegado</div>
                </PrivateRoute>
              } />

              
              
              <Route path="/instructors" element={
                <PrivateRoute roles={['BLOCKED_FOR_ACCESS_CONTROL']}>
                  <div>Acceso denegado</div>
                </PrivateRoute>
              } />
              
              <Route path="/profiles" element={
                <PrivateRoute roles={['BLOCKED_FOR_ACCESS_CONTROL']}>
                  <div>Acceso denegado</div>
                </PrivateRoute>
              } />
              
            </Route>
            
            {/* Ruta de fallback */}
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </div>
      </AuthProvider>
    </Router>
  );
}

export default App;