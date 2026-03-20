import React from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, MapPin, Search, Edit3, CheckCircle, ArrowLeft, Send, Sparkles } from 'lucide-react';

export const GuidePage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="container mx-auto p-6 flex flex-col min-h-screen">
      <header className="flex items-center mb-8">
        <button 
          onClick={() => navigate(-1)} 
          className="p-2 -ml-2 hover:bg-card rounded-full transition-colors"
          aria-label="Quay lại"
        >
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-[24px] font-bold ml-2">Hướng dẫn</h1>
      </header>

      <main className="flex-1 space-y-8">
        <section className="space-y-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-primary/20 p-2 rounded-lg">
              <Sparkles size={20} className="text-primary" />
            </div>
            <h2 className="text-[20px] font-bold underline decoration-primary/40 underline-offset-4 decoration-2">Cách nhập liệu nhanh</h2>
          </div>
          <Step 
            number={1} 
            icon={<Send size={18} className="text-white" />}
            title="Dán nội dung đơn hàng" 
            desc="Lấy nội dung tin nhắn của khách hàng hoặc bất kỳ ghi chú nào, dán vào ô nhập liệu chính."
          />
          <Step 
            number={2} 
            icon={<BookOpen size={18} className="text-white" />}
            title="AI Tự động phân tích" 
            desc="Hệ thống sẽ bóc tách các thông tin: Tên hàng, Số lượng, Đơn giá, Tên khách hàng... và hiển thị xem trước."
          />
          <Step 
            number={3} 
            icon={<CheckCircle size={18} className="text-white" />}
            title="Xác nhận & Lưu" 
            desc="Kiểm tra lại thông tin, chỉnh sửa nếu cần và nhấn 'Lưu' để đưa vào danh sách công nợ."
          />
        </section>

        <section className="space-y-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-primary/20 p-2 rounded-lg">
              <Search size={20} className="text-primary" />
            </div>
            <h2 className="text-[20px] font-bold underline decoration-primary/40 underline-offset-4 decoration-2">Quản lý danh sách</h2>
          </div>
          <Step 
            number={1} 
            icon={<MapPin size={18} className="text-white" />}
            title="Tabs phân loại" 
            desc="Sử dụng 3 tabs phía dưới: 'Chưa thanh toán', 'Đã thanh toán', và 'Tất cả' để dễ dàng quản lý."
          />
          <Step 
            number={2} 
            icon={<Edit3 size={18} className="text-white" />}
            title="Chỉnh sửa & Xóa" 
            desc="Click vào icon bút chì để sửa đổi thông tin hoặc icon thùng rác để xóa bỏ các bản ghi không chính xác."
          />
          <Step 
            number={3} 
            icon={<CheckCircle size={18} className="text-white" />}
            title="Đánh dấu đã trả" 
            desc="Khi khách hàng thanh toán, chỉ cần nhấn nút 'Đã trả' để đơn hàng được chuyển sang danh sách hoàn thành."
          />
        </section>

        <div className="bg-primary/10 rounded-2xl p-6 border border-primary/20">
          <h3 className="font-bold flex items-center gap-2 mb-3">
            <Sparkles size={18} className="text-primary" /> Mẹo nhỏ
          </h3>
          <p className="text-[14px] leading-relaxed italic opacity-80">
            \"Sử dụng giọng nói (nếu thiết bị hỗ trợ) để nhập liệu thay vì gõ phím. AI của chúng tôi hiểu ngôn ngữ tự nhiên cực kỳ tốt!\"
          </p>
        </div>
      </main>

      <div className="pb-10 pt-4 flex gap-3">
        <button 
          onClick={() => navigate('/login')}
          className="btn btn-primary"
        >
          Xong, tôi đã hiểu
        </button>
      </div>
    </div>
  );
};

const Step: React.FC<{ number: number; icon: React.ReactNode; title: string; desc: string }> = ({ number, icon, title, desc }) => (
  <div className="flex gap-4 items-start bg-card/40 p-5 rounded-2xl border border-border/20 shadow-sm relative overflow-hidden group">
    <div className="absolute -top-2 -right-2 opacity-[0.03] font-bold text-[64px] leading-none pointer-events-none group-hover:opacity-[0.05] transition-opacity">
      {number}
    </div>
    <div className="shrink-0 w-10 h-10 rounded-full bg-primary flex items-center justify-center font-bold text-white shadow-lg shadow-primary/20 z-10">
      {icon}
    </div>
    <div className="space-y-1 z-10">
      <h3 className="font-bold text-[17px] leading-none mb-1">{title}</h3>
      <p className="text-muted text-[14px] leading-tight">{desc}</p>
    </div>
  </div>
);
