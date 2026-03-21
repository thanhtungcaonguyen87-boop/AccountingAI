import React from "react";
import { useNavigate } from "react-router-dom";
import {
  MoreVertical,
  Smartphone,
  Wallet,
  ArrowLeft,
  HelpCircle,
} from "lucide-react";

export const GuideAndroid: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#0f172a] text-[#f1f5f9] pb-24 font-['Public_Sans',_sans-serif]">
      {/* TopAppBar */}
      <header className="fixed top-0 w-full z-50 bg-[#0f172a]/80 backdrop-blur-lg border-b border-[#334155]/50 shadow-sm flex items-center justify-between px-6 h-16 max-w-[500px] left-1/2 -translate-x-1/2">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate("/guide")}
            className="active:scale-95 transition-transform text-[#94a3b8] hover:text-[#f1f5f9]"
          >
            <ArrowLeft size={24} />
          </button>
          <h1 className="font-bold text-lg tracking-tight text-[#f1f5f9]">
            Cài đặt ứng dụng
          </h1>
        </div>
        <button className="text-[#257bf4] hover:bg-[#1e293b] transition-colors p-2 rounded-full">
          <HelpCircle size={24} />
        </button>
      </header>

      <main className="pt-24 px-6 max-w-2xl mx-auto">
        {/* Hero App Icon Section */}
        <section className="flex flex-col items-center mb-10 text-center">
          <div className="relative group">
            <div className="absolute inset-0 bg-[#257bf4]/20 blur-3xl rounded-full scale-150 transition-opacity group-hover:opacity-100 opacity-70"></div>
            <div className="relative w-32 h-32 md:w-40 md:h-40 bg-gradient-to-br from-[#257bf4] to-[#1d4ed8] rounded-[2.5rem] shadow-2xl flex items-center justify-center p-6 border-4 border-[#1e293b]">
              <Wallet size={64} className="text-white fill-white/20" />
            </div>
          </div>
          <h2 className="mt-8 text-2xl md:text-3xl font-extrabold tracking-tight text-[#f1f5f9]">
            Cài đặt Accounting AI cho Android
          </h2>
          <p className="mt-2 text-[#94a3b8] max-w-xs md:max-w-sm mx-auto">
            Sử dụng trình duyệt Chrome để có trải nghiệm tốt nhất như một ứng
            dụng thực thụ.
          </p>
        </section>

        {/* Instruction Steps */}
        <div className="grid grid-cols-1 gap-6 mb-12">
          {/* Step 1 */}
          <div className="bg-[#1e293b] rounded-xl p-6 relative overflow-hidden group border border-[#1e293b]/50">
            <div className="flex items-start gap-5">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-[#257bf4]/10 flex items-center justify-center text-[#257bf4] font-bold border border-[#257bf4]/20">
                1
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold mb-2 text-[#f1f5f9]">
                  Mở menu Chrome
                </h3>
                <p className="text-[#94a3b8] leading-relaxed">
                  Nhấn vào biểu tượng
                  <span className="inline-flex items-center px-1.5 py-0.5 bg-[#334155] rounded border border-[#1e293b] text-[#257bf4] mx-1 text-sm gap-1">
                    <MoreVertical size={14} /> Menu
                  </span>
                  (ba dấu chấm) ở góc trên bên phải màn hình.
                </p>
              </div>
            </div>

            <div className="mt-6 rounded-lg bg-[#334155] h-32 w-full flex items-end justify-center overflow-hidden border border-[#1e293b]/30 relative">
              <div className="absolute inset-0 bg-gradient-to-t from-[#0f172a]/40 to-transparent"></div>
              <div className="absolute bottom-4 flex justify-center w-full">
                <div className="w-12 h-12 bg-[#257bf4] rounded-xl shadow-lg shadow-[#257bf4]/30 flex items-center justify-center animate-pulse">
                  <MoreVertical size={24} className="text-white" />
                </div>
              </div>
            </div>
          </div>

          {/* Step 2 */}
          <div className="bg-[#1e293b] rounded-xl p-6 border border-[#1e293b]/50">
            <div className="flex items-start gap-5">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-[#257bf4]/10 flex items-center justify-center text-[#257bf4] font-bold border border-[#257bf4]/20">
                2
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold mb-2 text-[#f1f5f9]">
                  Chọn cài đặt
                </h3>
                <p className="text-[#94a3b8] leading-relaxed">
                  Tìm và chọn mục
                  <span className="font-semibold text-[#f1f5f9] italic px-1">
                    "Cài đặt ứng dụng"
                  </span>{" "}
                  hoặc
                  <span className="font-semibold text-[#f1f5f9] italic px-1">
                    "Thêm vào màn hình chính"
                  </span>
                  .
                </p>
              </div>
            </div>
            <div className="mt-6 space-y-2">
              <div className="flex items-center justify-between p-4 bg-[#334155] rounded-lg border border-[#1e293b]/30">
                <span className="text-sm font-medium text-[#f1f5f9]">
                  Thêm vào màn hình chính
                </span>
                <Smartphone size={20} className="text-[#94a3b8]" />
              </div>
            </div>
          </div>

          {/* Step 3 */}
          <div className="flex items-center justify-center min-h-screen bg-black/20">
            {/* Container chính - Bo góc tròn và màu nền tối */}
            <div className="w-[350px] bg-[#202124] text-white rounded-[28px] p-6 shadow-xl font-sans">
              {/* Tiêu đề */}
              <h2 className="text-[22px] font-normal mb-6 text-gray-200">
                Cài đặt ứng dụng
              </h2>

              {/* Nội dung App: Icon + Text */}
              <div className="flex items-start gap-4 mb-8">
                {/* Icon App */}
                <div className="w-14 h-14 rounded-xl overflow-hidden flex-shrink-0 bg-blue-600">
                  <img
                    src="/icons/apple-icon-180.png" // Thay bằng path icon thật của bạn
                    alt="Accounting AI"
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* Tên và URL */}
                <div className="flex flex-col">
                  <span className="text-[20px] font-medium leading-tight">
                    Accounting AI
                  </span>
                  <span className="text-[14px] text-gray-400 mt-1">
                    zmonai.vercel.app
                  </span>
                </div>
              </div>

              {/* Các nút bấm */}
              <div className="flex justify-end gap-6 text-[15px] font-medium tracking-wide">
                <button className="text-[#a8c7fa] hover:bg-white/5 px-2 py-1 rounded transition-colors">
                  Huỷ
                </button>
                <button className="text-[#a8c7fa] hover:bg-white/5 px-2 py-1 rounded transition-colors">
                  Cài đặt
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Success Preview */}
        <section className="mb-16 bg-gradient-to-br from-[#0f172a] to-[#1e3a8a]/20 p-8 rounded-2xl border border-[#257bf4]/20 text-center overflow-hidden relative">
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-[#257bf4]/10 blur-[60px] rounded-full"></div>
          <h3 className="text-xl font-bold mb-4 text-[#f1f5f9]">
            Trải nghiệm ứng dụng ngay!
          </h3>
          <p className="text-[#94a3b8] mb-6 text-sm">
            Sau khi cài đặt, bạn có thể tìm thấy ứng dụng trong màn hình chính
            hoặc lưới ứng dụng của mình.
          </p>
          <div className="flex justify-center">
            <div className="w-48 h-80 bg-[#1e293b] rounded-2xl shadow-2xl border-4 border-[#1e293b] flex flex-col items-center justify-center p-4">
              <div className="w-32 h-32 bg-[#257bf4] rounded-2xl mb-4 flex items-center justify-center shadow-lg shadow-[#257bf4]/30">
                <img
                  src="/icons/apple-icon-180.png"
                  alt="App Icon"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="h-2 w-20 bg-white/10 rounded mb-2"></div>
              <div className="h-2 w-16 bg-white/5 rounded"></div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};
