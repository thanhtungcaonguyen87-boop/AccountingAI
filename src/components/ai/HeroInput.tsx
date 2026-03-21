import React, { useState, useEffect, useRef } from "react";
import {
  Mic,
  Send,
  ChevronDown,
  ChevronUp,
  User,
  Package,
  FileText,
  Calculator,
  Plus,
  List,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { supabase } from "../../lib/supabase";

interface SpeechRecognitionEvent {
  results: {
    [key: number]: {
      [key: number]: {
        transcript: string;
      };
    };
  };
}

interface SpeechRecognitionErrorEvent {
  error: string;
}

interface SpeechRecognitionInstance {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onstart: () => void;
  onresult: (event: SpeechRecognitionEvent) => void;
  onerror: (event: SpeechRecognitionErrorEvent) => void;
  onend: () => void;
  start: () => void;
  stop: () => void;
}

interface HeroInputProps {
  onAnalyze: (text: string) => void;
  onManualSubmit?: (data: {
    khach_hang: string;
    san_pham: string;
    so_luong: number;
    don_gia: number;
    dvt: string;
    ghi_chu: string;
  }) => Promise<void>;
  isLoading: boolean;
}

export const HeroInput: React.FC<HeroInputProps> = ({
  onAnalyze,
  onManualSubmit,
  isLoading,
}) => {
  const [activeTab, setActiveTab] = useState<"ai" | "manual">("ai");
  const [text, setText] = useState("");
  const [isListening, setIsListening] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const { user } = useAuth();
  const [suggestions, setSuggestions] = useState<{
    khach_hang: string[];
    san_pham: string[];
    ghi_chu: string[];
    dvt: string[];
  }>({ khach_hang: [], san_pham: [], ghi_chu: [], dvt: [] });
  const [customerProducts, setCustomerProducts] = useState<
    Record<string, string[]>
  >({});
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Manual Form State
  const [manualForm, setManualForm] = useState({
    khach_hang: "",
    san_pham: "",
    ghi_chu: "",
    dvt: "tờ",
    so_luong: "1",
    don_gia: "",
  });
  const [manualSubmitting, setManualSubmitting] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState<{
    khach_hang: boolean;
    san_pham: boolean;
    ghi_chu: boolean;
    dvt: boolean;
  }>({ khach_hang: false, san_pham: false, ghi_chu: false, dvt: false });

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;
      const { data } = await supabase
        .from("chi_tiet")
        .select("khach_hang, san_pham, ghi_chu, dvt")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (data) {
        const uniqueKhachHang = Array.from(
          new Set(data.map((d) => d.khach_hang).filter(Boolean)),
        );
        const uniqueSanPham = Array.from(
          new Set(data.map((d) => d.san_pham).filter(Boolean)),
        );
        const uniqueGhiChu = Array.from(
          new Set(data.map((d) => d.ghi_chu).filter(Boolean)),
        );
        const uniqueDvt = Array.from(
          new Set(data.map((d) => d.dvt).filter(Boolean)),
        );

        // Mapping products to customers for manual entry filter
        const mapping: Record<string, string[]> = {};
        data.forEach((d) => {
          if (d.khach_hang && d.san_pham) {
            if (!mapping[d.khach_hang]) mapping[d.khach_hang] = [];
            if (!mapping[d.khach_hang].includes(d.san_pham)) {
              mapping[d.khach_hang].push(d.san_pham);
            }
          }
        });

        setSuggestions({
          khach_hang: uniqueKhachHang,
          san_pham: uniqueSanPham,
          ghi_chu: uniqueGhiChu,
          dvt: uniqueDvt,
        });
        setCustomerProducts(mapping);
      }
    };
    fetchData();
  }, [user]);

  // Fetch last price logic
  useEffect(() => {
    const fetchLastPrice = async () => {
      if (!user || !manualForm.khach_hang || !manualForm.san_pham) return;

      const { data } = await supabase
        .from("chi_tiet")
        .select("don_gia")
        .eq("user_id", user.id)
        .eq("khach_hang", manualForm.khach_hang)
        .eq("san_pham", manualForm.san_pham)
        .select("don_gia, dvt")
        .order("created_at", { ascending: false })
        .limit(1);

      if (data && data.length > 0) {
        setManualForm((prev) => ({
          ...prev,
          don_gia: data[0].don_gia.toString(),
          dvt: data[0].dvt || prev.dvt,
        }));
      }
    };

    const timer = setTimeout(() => {
      if (activeTab === "manual") fetchLastPrice();
    }, 500);
    return () => clearTimeout(timer);
  }, [user, manualForm.khach_hang, manualForm.san_pham, activeTab]);

  const insertSuggestion = (keyword: string) => {
    if (!textareaRef.current) return;

    const textarea = textareaRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const currentText = text;

    const before = currentText.substring(0, start);
    const after = currentText.substring(end);

    // Determine if we need spaces around the keyword
    const needsLeadingSpace = start > 0 && !before.endsWith(" ");
    const needsTrailingSpace = !after.startsWith(" ");

    const insertion = `${needsLeadingSpace ? " " : ""}${keyword}${needsTrailingSpace ? " " : ""}`;
    const newText = before + insertion + after;

    setText(newText);

    // Refocus and set cursor position after the state update
    setTimeout(() => {
      textarea.focus();
      const newPos = start + insertion.length;
      textarea.setSelectionRange(newPos, newPos);
    }, 0);
  };

  // Simple Web Speech API implementation (Voice input)
  const handleListen = () => {
    if (!("webkitSpeechRecognition" in window)) {
      alert(
        "Trình duyệt của bạn không hỗ trợ nhận diện giọng nói. Vui lòng thử Chrome.",
      );
      return;
    }

    const SpeechRecognition = (
      window as unknown as {
        webkitSpeechRecognition: new () => SpeechRecognitionInstance;
      }
    ).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();

    recognition.lang = "vi-VN";
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => {
      setIsListening(true);
    };

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const transcript = event.results[0][0].transcript;
      setText((prev) => (prev ? `${prev} ${transcript}` : transcript));
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
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
      setShowSuggestions(false);
    }
  };

  const handleSubmitManual = async () => {
    if (
      !manualForm.khach_hang ||
      !manualForm.san_pham ||
      !manualForm.so_luong
    ) {
      alert("Vui lòng nhập đầy đủ Khách hàng, Sản phẩm và Số lượng");
      return;
    }

    setManualSubmitting(true);
    try {
      if (onManualSubmit) {
        await onManualSubmit({
          khach_hang: manualForm.khach_hang,
          san_pham: manualForm.san_pham,
          so_luong: Number(manualForm.so_luong),
          don_gia: Number(manualForm.don_gia) || 0,
          dvt: manualForm.dvt,
          ghi_chu: manualForm.ghi_chu,
        });
        // Reset form except customer
        setManualForm((prev) => ({
          ...prev,
          san_pham: "",
          ghi_chu: "",
          so_luong: "1",
          don_gia: "",
        }));
      }
    } catch (error) {
      console.error(error);
    } finally {
      setManualSubmitting(false);
    }
  };

  const currentThanhTien =
    Number(manualForm.so_luong) * Number(manualForm.don_gia);

  const labelStyle =
    "text-[12px] font-medium text-muted mb-1 flex items-center gap-1.5";
  const commonInputStyle =
    "w-full bg-card/50 border border-border rounded-md p-2 px-3 text-main outline-none focus:border-primary transition-colors text-[14px]";

  return (
    <div className="card mb-4 !p-0 overflow-visible">
      <div className="flex border-b border-border">
        <button
          onClick={() => setActiveTab("ai")}
          className={`flex-1 py-3 text-[14px] font-bold transition-all border-b-2 ${
            activeTab === "ai"
              ? "text-primary border-primary bg-primary/5"
              : "text-muted border-transparent hover:text-main"
          }`}
        >
          Nhập bằng AI
        </button>
        <button
          onClick={() => setActiveTab("manual")}
          className={`flex-1 py-3 text-[14px] font-bold transition-all border-b-2 ${
            activeTab === "manual"
              ? "text-primary border-primary bg-primary/5"
              : "text-muted border-transparent hover:text-main"
          }`}
        >
          Nhập thủ công
        </button>
      </div>

      <div className="p-4">
        {activeTab === "ai" ? (
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
              ref={textareaRef}
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && e.shiftKey) {
                  e.preventDefault();
                  handleSubmit();
                }
              }}
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
        ) : (
          <div className="flex flex-col gap-3">
            {/* Manual Form */}
            <div className="grid grid-cols-1 gap-3">
              {/* Customer */}
              <div className="relative">
                <label className={labelStyle}>
                  <User size={14} /> Khách hàng
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={manualForm.khach_hang}
                    onChange={(e) => {
                      setManualForm({
                        ...manualForm,
                        khach_hang: e.target.value,
                      });
                      setDropdownOpen({ ...dropdownOpen, khach_hang: true });
                    }}
                    onFocus={() =>
                      setDropdownOpen({ ...dropdownOpen, khach_hang: true })
                    }
                    onBlur={() =>
                      setTimeout(
                        () =>
                          setDropdownOpen({
                            ...dropdownOpen,
                            khach_hang: false,
                          }),
                        200,
                      )
                    }
                    placeholder="Tên khách hàng hoặc tên gợi nhớ..."
                    className={commonInputStyle}
                  />
                  {dropdownOpen.khach_hang && (
                    <div className="absolute top-full left-0 w-full mt-1 bg-card border border-border rounded-md shadow-lg z-[100] max-h-[150px] overflow-y-auto">
                      {suggestions.khach_hang
                        .filter((kh) =>
                          kh
                            .toLowerCase()
                            .includes(manualForm.khach_hang.toLowerCase()),
                        )
                        .map((kh, i) => (
                          <div
                            key={i}
                            className="p-2 px-3 hover:bg-primary/10 cursor-pointer text-[13px]"
                            onMouseDown={() =>
                              setManualForm({ ...manualForm, khach_hang: kh })
                            }
                          >
                            {kh}
                          </div>
                        ))}
                      {!suggestions.khach_hang.some(
                        (kh) =>
                          kh.toLowerCase() ===
                          manualForm.khach_hang.toLowerCase(),
                      ) &&
                        manualForm.khach_hang && (
                          <div className="p-2 px-3 text-primary text-[12px] italic border-t border-border">
                            Thêm khách hàng mới: {manualForm.khach_hang}
                          </div>
                        )}
                    </div>
                  )}
                </div>
              </div>

              {/* Product */}
              <div className="relative">
                <label className={labelStyle}>
                  <Package size={14} /> Sản phẩm
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={manualForm.san_pham}
                    onChange={(e) => {
                      setManualForm({
                        ...manualForm,
                        san_pham: e.target.value,
                      });
                      setDropdownOpen({ ...dropdownOpen, san_pham: true });
                    }}
                    onFocus={() =>
                      setDropdownOpen({ ...dropdownOpen, san_pham: true })
                    }
                    onBlur={() =>
                      setTimeout(
                        () =>
                          setDropdownOpen({ ...dropdownOpen, san_pham: false }),
                        200,
                      )
                    }
                    placeholder="In card, photocopy, decal..."
                    className={commonInputStyle}
                  />
                  {dropdownOpen.san_pham && (
                    <div className="absolute top-full left-0 w-full mt-1 bg-card border border-border rounded-md shadow-lg z-[100] max-h-[150px] overflow-y-auto">
                      {(manualForm.khach_hang &&
                      customerProducts[manualForm.khach_hang]
                        ? customerProducts[manualForm.khach_hang]
                        : suggestions.san_pham
                      )
                        .filter((sp) =>
                          sp
                            .toLowerCase()
                            .includes(manualForm.san_pham.toLowerCase()),
                        )
                        .map((sp, i) => (
                          <div
                            key={i}
                            className="p-2 px-3 hover:bg-primary/10 cursor-pointer text-[13px] flex justify-between"
                            onMouseDown={() =>
                              setManualForm({ ...manualForm, san_pham: sp })
                            }
                          >
                            <span>{sp}</span>
                            {manualForm.khach_hang &&
                              customerProducts[manualForm.khach_hang]?.includes(
                                sp,
                              ) && (
                                <span className="text-[10px] text-success font-bold">
                                  Lịch sử
                                </span>
                              )}
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Note */}
              <div className="relative">
                <label className={labelStyle}>
                  <FileText size={14} /> Ghi chú
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={manualForm.ghi_chu}
                    onChange={(e) => {
                      setManualForm({ ...manualForm, ghi_chu: e.target.value });
                      setDropdownOpen({ ...dropdownOpen, ghi_chu: true });
                    }}
                    onFocus={() =>
                      setDropdownOpen({ ...dropdownOpen, ghi_chu: true })
                    }
                    onBlur={() =>
                      setTimeout(
                        () =>
                          setDropdownOpen({ ...dropdownOpen, ghi_chu: false }),
                        200,
                      )
                    }
                    placeholder="Loại giấy, kích thước, cán màng..."
                    className={commonInputStyle}
                  />
                  {dropdownOpen.ghi_chu && (
                    <div className="absolute top-full left-0 w-full mt-1 bg-card border border-border rounded-md shadow-lg z-[100] max-h-[150px] overflow-y-auto">
                      {suggestions.ghi_chu
                        .filter(
                          (gc) =>
                            gc &&
                            gc
                              .toLowerCase()
                              .includes(manualForm.ghi_chu.toLowerCase()),
                        )
                        .map((gc, i) => (
                          <div
                            key={i}
                            className="p-2 px-3 hover:bg-primary/10 cursor-pointer text-[13px]"
                            onMouseDown={() =>
                              setManualForm({ ...manualForm, ghi_chu: gc })
                            }
                          >
                            {gc}
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Quantity, Unit and Price */}
              <div className="grid grid-cols-12 gap-2">
                <div className="col-span-3">
                  <label className={labelStyle}>
                    <List size={14} /> SL
                  </label>
                  <input
                    type="number"
                    value={manualForm.so_luong}
                    onChange={(e) =>
                      setManualForm({ ...manualForm, so_luong: e.target.value })
                    }
                    className={commonInputStyle}
                    placeholder="100..."
                  />
                </div>
                <div className="col-span-3 relative">
                  <label className={labelStyle}>ĐVT</label>
                  <input
                    type="text"
                    value={manualForm.dvt}
                    onChange={(e) => {
                      setManualForm({ ...manualForm, dvt: e.target.value });
                      setDropdownOpen({ ...dropdownOpen, dvt: true });
                    }}
                    onFocus={() =>
                      setDropdownOpen({ ...dropdownOpen, dvt: true })
                    }
                    onBlur={() =>
                      setTimeout(
                        () => setDropdownOpen({ ...dropdownOpen, dvt: false }),
                        200,
                      )
                    }
                    placeholder="tờ, cái..."
                    className={commonInputStyle}
                  />
                  {dropdownOpen.dvt && suggestions.dvt.length > 0 && (
                    <div className="absolute top-full left-0 w-full mt-1 bg-card border border-border rounded-md shadow-lg z-[100] max-h-[120px] overflow-y-auto">
                      {suggestions.dvt
                        .filter((d) =>
                          d
                            .toLowerCase()
                            .includes(manualForm.dvt.toLowerCase()),
                        )
                        .map((d, i) => (
                          <div
                            key={i}
                            className="p-2 px-3 hover:bg-primary/10 cursor-pointer text-[12px]"
                            onMouseDown={() =>
                              setManualForm({ ...manualForm, dvt: d })
                            }
                          >
                            {d}
                          </div>
                        ))}
                    </div>
                  )}
                </div>
                <div className="col-span-6">
                  <label className={labelStyle}>
                    <Plus size={14} /> Đơn giá (₫)
                  </label>
                  <input
                    type="number"
                    value={manualForm.don_gia}
                    onChange={(e) =>
                      setManualForm({ ...manualForm, don_gia: e.target.value })
                    }
                    className={commonInputStyle}
                    placeholder="3000..."
                  />
                </div>
              </div>

              {/* Total Calculation */}
              <div className="mt-1 p-3 bg-primary/10 border border-primary/20 rounded-md flex justify-between items-center">
                <div className="text-[12px] font-bold text-primary flex items-center gap-2">
                  <Calculator size={14} /> THÀNH TIỀN
                </div>
                <div className="text-[18px] font-black text-primary">
                  {currentThanhTien.toLocaleString()} ₫
                </div>
              </div>

              {/* Submit Button */}
              <button
                onClick={handleSubmitManual}
                disabled={
                  manualSubmitting ||
                  !manualForm.khach_hang ||
                  !manualForm.san_pham
                }
                className={`mt-2 py-3 rounded-md font-bold text-white shadow-lg transition-all flex items-center justify-center gap-2 ${
                  manualSubmitting ||
                  !manualForm.khach_hang ||
                  !manualForm.san_pham
                    ? "bg-border cursor-not-allowed opacity-70"
                    : "bg-primary hover:brightness-110 active:scale-[0.98]"
                }`}
              >
                {manualSubmitting ? "Đang lưu..." : "LƯU ĐƠN HÀNG"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
