import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Navigate, Link } from 'react-router-dom';
import { Bot, Info, BookOpen } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { session, signInWithGoogle } = useAuth();

  const [staySignedIn, setStaySignedIn] = React.useState(true);

  const handleGoogleLogin = async () => {
    // Save stay signed in preference before redirecting
    localStorage.setItem('stay_signed_in', staySignedIn ? 'true' : 'false');
    localStorage.setItem('login_timestamp', Date.now().toString());
    localStorage.setItem('last_activity', Date.now().toString());
    
    await signInWithGoogle();
  };

  // If already logged in, redirect to home
  if (session) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="container mx-auto flex flex-col items-center justify-center min-h-screen p-4">
      <div className="flex flex-col items-center mb-8">
        <div style={{
          background: 'linear-gradient(135deg, #257bf4, #1d4ed8)',
          padding: '16px',
          borderRadius: '24px',
          marginBottom: '16px',
          boxShadow: '0 8px 32px rgba(37, 123, 244, 0.4)'
        }}>
          <Bot size={48} color="white" />
        </div>
        <h1 style={{ fontSize: '28px', fontWeight: 'bold', marginBottom: '8px' }}>
          Công nợ AI
        </h1>
        <p className="text-muted text-center" style={{ fontSize: '15px' }}>
          Quản lý công nợ thông minh bằng AI
        </p>
      </div>

      <div className="w-full space-y-5" style={{ maxWidth: '300px' }}>
        <button className="btn btn-primary" onClick={handleGoogleLogin}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ marginRight: '8px', background: 'white', borderRadius: '50%', padding: '2px' }}>
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          Đăng nhập với Google
        </button>

        <div className="flex items-center justify-center gap-2">
          <input 
            type="checkbox" 
            id="staySignedIn" 
            checked={staySignedIn}
            onChange={(e) => setStaySignedIn(e.target.checked)}
            className="w-4 h-4 text-primary accent-primary rounded cursor-pointer"
          />
          <label htmlFor="staySignedIn" className="text-sm font-medium cursor-pointer select-none">
            Duy trì đăng nhập
          </label>
        </div>

        <div className="flex gap-3">
          <Link to="/intro" className="flex-1 btn btn-outline flex items-center justify-center gap-2 py-2.5 text-[14px]">
            <Info size={16} />
            <span>Giới thiệu</span>
          </Link>
          <Link to="/guide" className="flex-1 btn btn-outline flex items-center justify-center gap-2 py-2.5 text-[14px]">
            <BookOpen size={16} />
            <span>Hướng dẫn</span>
          </Link>
        </div>
      </div>

      <div style={{ position: 'absolute', bottom: '32px', textAlign: 'center', width: '100%' }}>
        <p className="text-muted" style={{ fontSize: '13px', opacity: 0.7 }}>
          Bằng cách đăng nhập, bạn đồng ý với điều khoản sử dụng
        </p>
      </div>
    </div>
  );
};
