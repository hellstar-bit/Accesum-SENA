// frontend/src/App.tsx - Rutas Actualizadas
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import UserManagement from './pages/UserManagement'; // Módulo unificado
import AccessControl from './pages/AccessControl';
import Configuration from './pages/Configuration';
import ImportPage from './pages/ImportPage';
import LearnerProfile from './pages/LearnerProfile';
import Layout from './components/layout/Layout';
import PrivateRoute from './components/auth/PrivateRoute';
import { AuthProvider } from './context/AuthContext';

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={
            <PrivateRoute>
              <Layout />
            </PrivateRoute>
          }>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            
            {/* Ruta unificada para usuarios y perfiles */}
            <Route path="users/*" element={<UserManagement />} />
            
            {/* Mantener alias para compatibilidad (opcional) */}
            <Route path="profiles/*" element={<Navigate to="/users" replace />} />
            
            <Route path="access/*" element={<AccessControl />} />
            <Route path="config/*" element={<Configuration />} />
            <Route path="import" element={<ImportPage />} />
            <Route path="my-profile" element={<LearnerProfile />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;