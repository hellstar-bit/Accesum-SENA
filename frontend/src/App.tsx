import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import UserManagement from './pages/UserManagement';
import ProfileManagement from './pages/ProfileManagement';
import AccessControl from './pages/AccessControl';
import Configuration from './pages/Configuration';
import ImportPage from './pages/ImportPage';
import LearnerProfile from './pages/LearnerProfile'; // ⭐ AGREGAR
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
            <Route path="users/*" element={<UserManagement />} />
            <Route path="profiles/*" element={<ProfileManagement />} />
            <Route path="access/*" element={<AccessControl />} />
            <Route path="config/*" element={<Configuration />} />
            <Route path="import" element={<ImportPage />} />
            <Route path="my-profile" element={<LearnerProfile />} /> {/* ⭐ AGREGAR */}
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;