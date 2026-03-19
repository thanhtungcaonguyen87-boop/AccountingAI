import { Routes, Route, Navigate } from 'react-router-dom';
import { LoginPage } from './pages/LoginPage';
import { ProtectedRoute } from './components/ProtectedRoute';
import { MainLayout } from './components/layout/MainLayout';
import { ChuaThanhToan } from './pages/ChuaThanhToan';
import { DaThanhToan } from './pages/DaThanhToan';
import { TatCaDon } from './pages/TatCaDon';

function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/" element={
        <ProtectedRoute>
          <MainLayout />
        </ProtectedRoute>
      }>
        <Route index element={<ChuaThanhToan />} />
        <Route path="da-thanh-toan" element={<DaThanhToan />} />
        <Route path="tat-ca" element={<TatCaDon />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
