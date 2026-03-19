import React from 'react';
import { NavLink } from 'react-router-dom';
import { CreditCard, CheckCircle, List } from 'lucide-react';

export const BottomNav: React.FC = () => {
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-card border-t border-border flex justify-around py-3 pb-[calc(12px+env(safe-area-inset-bottom))] z-[100]">
      <NavLink
        to="/"
        end
        className={({ isActive }) => `flex flex-col items-center gap-1 text-[12px] flex-1 no-underline ${isActive ? "text-primary font-semibold" : "text-muted font-normal"}`}
      >
        <CreditCard size={24} />
        <span>Chưa TT</span>
      </NavLink>

      <NavLink
        to="/da-thanh-toan"
        className={({ isActive }) => `flex flex-col items-center gap-1 text-[12px] flex-1 no-underline ${isActive ? "text-primary font-semibold" : "text-muted font-normal"}`}
      >
        <CheckCircle size={24} />
        <span>Đã TT</span>
      </NavLink>

      <NavLink
        to="/tat-ca"
        className={({ isActive }) => `flex flex-col items-center gap-1 text-[12px] flex-1 no-underline ${isActive ? "text-primary font-semibold" : "text-muted font-normal"}`}
      >
        <List size={24} />
        <span>Tất cả đơn</span>
      </NavLink>
    </div>
  );
};
