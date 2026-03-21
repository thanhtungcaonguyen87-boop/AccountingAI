import { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { LoginPage } from './pages/LoginPage';
import { IntroPage } from './pages/IntroPage';
import { GuidePage } from './pages/GuidePage';
import { GuideIOS } from './pages/GuideIOS';
import { GuideAndroid } from './pages/GuideAndroid';
import { ProtectedRoute } from './components/ProtectedRoute';
import { MainLayout } from './components/layout/MainLayout';
import { ChuaThanhToan } from './pages/ChuaThanhToan';
import { DaThanhToan } from './pages/DaThanhToan';
import { TatCaDon } from './pages/TatCaDon';

function App() {
  // Apply initial theme
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    const isDark = savedTheme ? savedTheme === 'dark' : true;
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/intro" element={<IntroPage />} />
      <Route path="/guide" element={<GuidePage />} />
      <Route path="/guide/ios" element={<GuideIOS />} />
      <Route path="/guide/android" element={<GuideAndroid />} />
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
