import React from 'react';
import { Outlet } from 'react-router-dom';
import { BottomNav } from './BottomNav';
import { useAuth } from '../../context/AuthContext';
import { LogOut } from 'lucide-react';

export const MainLayout: React.FC = () => {
  const { user, signOut } = useAuth();

  return (
    <div className="container pb-[80px]">
      {/* Header */}
      <header className="flex justify-between items-center p-4 border-b border-border bg-bg-color sticky top-0 z-50">
        <h1 className="text-[20px] font-bold">Công nợ AI</h1>
        <div className="flex items-center gap-3">
          <button onClick={signOut} className="text-danger" aria-label="Đăng xuất">
            <LogOut size={20} />
          </button>
          {user?.user_metadata?.avatar_url ? (
            <img 
              src={user.user_metadata.avatar_url} 
              alt="Avatar" 
              className="w-8 h-8 rounded-full object-cover"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center font-bold text-[14px]">
              {user?.email?.[0].toUpperCase() || 'U'}
            </div>
          )}
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 p-4 flex flex-col">
        <Outlet />
      </main>

      {/* Bottom Navigation */}
      <BottomNav />
    </div>
  );
};
