import React, { useState, useEffect } from "react";
import { Mic, Send, X, ChevronDown, ChevronUp } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { supabase } from "../../lib/supabase";

interface HeroInputProps {
  onAnalyze: (text: string) => void;
  isLoading: boolean;
}

export const HeroInput: React.FC<HeroInputProps> = ({
  onAnalyze,
  isLoading,
}) => {
  const [text, setText] = useState("");
  const [isListening, setIsListening] = useState(false);

  const { user } = useAuth();
  const [suggestions, setSuggestions] = useState<{
    khach_hang: string[];
    san_pham: string[];
  }>({ khach_hang: [], san_pham: [] });
  const [showSuggestions, setShowSuggestions] = useState(false);

  useEffect(() => {
    const fetchSuggestions = async () => {
      if (!user) return;
      const { data } = await supabase
        .from("chi_tiet")
        .select("khach_hang, san_pham")
        .eq("user_id", user.id);

      if (data) {
        const uniqueKhachHang = Array.from(
          new Set(data.map((d) => d.khach_hang).filter(Boolean)),
        );
        const uniqueSanPham = Array.from(
          new Set(data.map((d) => d.san_pham).filter(Boolean)),
        );
        setSuggestions({
          khach_hang: uniqueKhachHang,
          san_pham: uniqueSanPham,
        });
      }
    };
    fetchSuggestions();
  }, [user]);

  const insertSuggestion = (keyword: string) => {
    setText((prev) => {
      const trimmed = prev.trimEnd();
      const needsSpace = trimmed.length > 0;
      return needsSpace ? `${trimmed} ${keyword} ` : `${keyword} `;
    });
  };

  // Simple Web Speech API implementation (Voice input)
  const handleListen = () => {
    if (!("webkitSpeechRecognition" in window)) {
      alert(
        "Trình duyệt của bạn không hỗ trợ nhận diện giọng nói. Vui lòng thử Chrome.",
      );
      return;
    }

    const SpeechRecognition = (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();

    recognition.lang = "vi-VN";
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => {
      setIsListening(true);
    };

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setText((prev) => (prev ? `${prev} ${transcript}` : transcript));
    };

    recognition.onerror = (event: any) => {
      console.error("Speech recognition error", event.error);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    if (isListening) {
      recognition.stop();
    } else {
      recognition.start();
    }
  };

  const handleSubmit = () => {
    if (text.trim()) {
      onAnalyze(text);
    }
  };

  return (
    <div className="card mb-4 !p-0">
      <div className="p-4">
        <h2 className="text-[18px] font-bold mb-3 text-main">Nhập đơn hàng</h2>

        <div className="relative">
          {showSuggestions &&
            (suggestions.khach_hang.length > 0 ||
              suggestions.san_pham.length > 0) && (
              <div className="absolute top-full left-0 mt-2 w-full max-h-[180px] overflow-y-auto bg-card border border-border rounded-md shadow-[0_4px_20px_rgba(0,0,0,0.5)] p-3 z-50 flex flex-col gap-3">
                {suggestions.khach_hang.length > 0 && (
                  <div>
                    <div className="text-[12px] text-muted mb-1.5 ml-1">
                      Khách hàng mới nhất:
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {suggestions.khach_hang.map((kh, idx) => (
                        <button
                          key={`kh-${idx}`}
                          type="button"
                          className="px-2.5 py-1 text-[13px] bg-primary/20 text-primary border border-primary/30 rounded-full hover:bg-primary/40 transition-colors shadow-sm"
                          onMouseDown={(e) => {
                            e.preventDefault();
                            insertSuggestion(kh);
                          }}
                        >
                          {kh}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {suggestions.san_pham.length > 0 && (
                  <div>
                    <div className="text-[12px] text-muted mb-1.5 ml-1">
                      Sản phẩm:
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {suggestions.san_pham.map((sp, idx) => (
                        <button
                          key={`sp-${idx}`}
                          type="button"
                          className="px-3 py-1 text-[13px] bg-primary/10 text-main hover:text-primary border border-border rounded-full hover:bg-primary/20 transition-colors shadow-sm"
                          onMouseDown={(e) => {
                            e.preventDefault();
                            insertSuggestion(sp);
                          }}
                        >
                          {sp}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Ví dụ: Anh Minh in 100 tờ Phiếu thu A4 giá 3k/tờ..."
            rows={3}
            className="w-full bg-card/50 border border-border rounded-md p-3 pl-[24px] pr-[54px] text-main resize-none min-h-[100px] outline-none focus:border-primary transition-colors"
          />
          <div className="absolute left-3 bottom-[-4px]">
            <button
              onClick={() => setShowSuggestions(!showSuggestions)}
              className="w-8 h-8 rounded-full flex items-center justify-center bg-card border border-border text-muted hover:text-primary transition-all shadow-sm"
              title={showSuggestions ? "Thu nhỏ gợi ý" : "Hiển thị gợi ý"}
            >
              {showSuggestions ? (
                <ChevronUp size={20} />
              ) : (
                <ChevronDown size={20} />
              )}
            </button>
          </div>
          <div className="absolute right-2 bottom-3 flex flex-col gap-2">
            <button
              onClick={handleListen}
              className={`w-9 h-9 rounded-full flex items-center justify-center shadow-sm border border-border transition-all duration-200 ${
                isListening
                  ? "bg-danger text-white"
                  : "bg-card text-muted hover:text-primary"
              }`}
              title="Nhập bằng giọng nói"
            >
              <Mic size={18} />
            </button>
            <button
              onClick={handleSubmit}
              disabled={isLoading || !text.trim()}
              className={`w-9 h-9 rounded-full flex items-center justify-center shadow-[0_2px_8px_rgba(0,0,0,0.2)] transition-all duration-200 text-white ${
                isLoading || !text.trim()
                  ? "bg-border cursor-not-allowed"
                  : "bg-primary hover:brightness-110"
              }`}
              title="Nhập"
            >
              <Send size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
