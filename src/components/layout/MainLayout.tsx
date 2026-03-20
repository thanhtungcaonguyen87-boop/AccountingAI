import React, { useState, useRef, useEffect } from 'react';
import { Outlet, useNavigate, Link } from 'react-router-dom';
import { BottomNav } from './BottomNav';
import { useAuth } from '../../context/AuthContext';
import { LogOut, Info, BookOpen, ChevronDown, Sun, Moon } from 'lucide-react';

export const MainLayout: React.FC = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    // Restore theme from localStorage or default to dark
    const savedTheme = localStorage.getItem('theme');
    return savedTheme ? savedTheme === 'dark' : true;
  });
  const menuRef = useRef<HTMLDivElement>(null);

  // Sync theme with document class
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
  };

  return (
    <div className="container mx-auto pb-[80px]">
      {/* Header */}
      <header className="flex justify-between items-center p-4 border-b border-border bg-bg-color sticky top-0 z-50">
        <h1 className="text-[20px] font-bold bg-gradient-to-r from-primary to-blue-400 bg-clip-text text-transparent">
          Công nợ AI
        </h1>
        
        <div className="relative" ref={menuRef}>
          <button 
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="flex items-center gap-2 p-1 rounded-full hover:bg-card transition-colors border border-transparent hover:border-border"
          >
            {user?.user_metadata?.avatar_url ? (
              <img 
                src={user.user_metadata.avatar_url} 
                alt="Avatar" 
                className="w-8 h-8 rounded-full object-cover border border-primary/20"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center font-bold text-[14px]">
                {user?.email?.[0].toUpperCase() || 'U'}
              </div>
            )}
            <ChevronDown size={14} className={`text-muted transition-transform ${isMenuOpen ? 'rotate-180' : ''}`} />
          </button>

          {/* Dropdown Menu */}
          {isMenuOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-card border border-border rounded-2xl shadow-xl py-2 z-50 animate-in fade-in zoom-in duration-200 origin-top-right">
              <div className="px-4 py-2 border-b border-border mb-1">
                <p className="text-[12px] text-muted truncate">{user?.email}</p>
              </div>
              
              <Link 
                to="/intro" 
                className="flex items-center gap-3 px-4 py-2.5 text-[14px] hover:bg-primary/10 hover:text-primary transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                <Info size={18} />
                <span>Giới thiệu</span>
              </Link>
              
              <Link 
                to="/guide" 
                className="flex items-center gap-3 px-4 py-2.5 text-[14px] hover:bg-primary/10 hover:text-primary transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                <BookOpen size={18} />
                <span>Hướng dẫn</span>
              </Link>
              
              <button 
                onClick={toggleTheme}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-[14px] hover:bg-primary/10 transition-colors"
              >
                {isDarkMode ? (
                  <>
                    <Sun size={18} className="text-yellow-500" />
                    <span>Chế độ sáng</span>
                  </>
                ) : (
                  <>
                    <Moon size={18} className="text-primary" />
                    <span>Chế độ tối</span>
                  </>
                )}
              </button>

              <div className="h-px bg-border my-1" />
              
              <button 
                onClick={handleSignOut}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-[14px] text-danger hover:bg-danger/10 transition-colors"
              >
                <LogOut size={18} />
                <span>Đăng xuất</span>
              </button>
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
