import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Bot, Zap, Shield, CheckCircle2, ArrowLeft } from 'lucide-react';

export const IntroPage: React.FC = () => {
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
        <h1 className="text-[24px] font-bold ml-2">Giới thiệu</h1>
      </header>

      <main className="flex-1">
        <div className="flex flex-col items-center mb-10">
          <div className="p-4 bg-primary/10 rounded-3xl mb-4">
            <Bot size={56} className="text-primary" />
          </div>
          <h2 className="text-[28px] font-bold text-center mb-2">Công nợ AI</h2>
          <p className="text-muted text-center max-w-[300px]">
            Giải pháp quản lý công nợ thông minh, tự động hóa bằng trí tuệ nhân tạo.
          </p>
        </div>

        <div className="space-y-6 mb-12">
          <FeatureCard 
            icon={<Zap className="text-yellow-500" />}
            title="Nhập liệu siêu tốc"
            description="Chỉ cần dán nội dung tin nhắn hoặc đọc giọng nói, AI sẽ tự động phân tích và lưu trữ đơn hàng."
          />
          <FeatureCard 
            icon={<CheckCircle2 className="text-success" />}
            title="Chính xác & Minh bạch"
            description="Tư động tính toán tổng tiền, số lượng và phân loại khách hàng một cách chính xác nhất."
          />
          <FeatureCard 
            icon={<Shield className="text-primary" />}
            title="Bảo mật tuyệt đối"
            description="Dữ liệu của bạn được mã hóa và lưu trữ an toàn trên nền tảng đám mây Supabase."
          />
        </div>

        <section className="bg-card/50 rounded-2xl p-6 border border-border/50 mb-10">
          <h3 className="font-bold mb-4 text-[18px]">Tại sao nên dùng?</h3>
          <ul className="space-y-3">
            <li className="flex items-start gap-3 text-[15px]">
              <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2" />
              <span>Tiết kiệm 90% thời gian nhập liệu thủ công.</span>
            </li>
            <li className="flex items-start gap-3 text-[15px]">
              <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2" />
              <span>Theo dõi công nợ mọi lúc mọi nơi trên điện thoại.</span>
            </li>
            <li className="flex items-start gap-3 text-[15px]">
              <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2" />
              <span>Giao diện đơn giản, tối ưu cho người bận rộn.</span>
            </li>
          </ul>
        </section>
      </main>

      <div className="pb-8">
        <button 
          onClick={() => navigate('/login')}
          className="btn btn-primary"
        >
          Bắt đầu ngay
        </button>
      </div>
    </div>
  );
};

const FeatureCard: React.FC<{ icon: React.ReactNode; title: string; description: string }> = ({ icon, title, description }) => (
  <div className="flex gap-4 p-4 rounded-2xl bg-card border border-border/30 hover:border-primary/30 transition-all">
    <div className="shrink-0 p-2 h-fit bg-background rounded-xl">
      {icon}
    </div>
    <div>
      <h4 className="font-bold text-[17px] mb-1">{title}</h4>
      <p className="text-muted text-[14px] leading-relaxed">{description}</p>
    </div>
  </div>
);
