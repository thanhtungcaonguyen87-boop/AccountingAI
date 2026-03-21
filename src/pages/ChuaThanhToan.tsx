/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect } from "react";
import { HeroInput } from "../components/ai/HeroInput";
import { AIPreview } from "../components/ai/AIPreview";
import {
  Search,
  ChevronDown,
  ChevronRight,
  CheckCircle2,
  Loader2,
  Edit2,
  Trash2,
  Save,
  X,
  Share2,
  Image as ImageIcon,
  Copy as CopyIcon,
  FileCode,
  FileSpreadsheet,
} from "lucide-react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../context/AuthContext";
import { toPng, toBlob } from "html-to-image";
import * as XLSX from "xlsx-js-style";

export const ChuaThanhToan: React.FC = () => {
  const { user } = useAuth();
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [parsedData, setParsedData] = useState<any>(null);
  const [rawInput, setRawInput] = useState("");

  const [search, setSearch] = useState("");
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>(
    () => {
      const saved = localStorage.getItem("expandedGroups_ChuaThanhToan");
      try {
        return saved ? JSON.parse(saved) : {};
      } catch {
        return {};
      }
    },
  );

  useEffect(() => {
    localStorage.setItem(
      "expandedGroups_ChuaThanhToan",
      JSON.stringify(expandedGroups),
    );
  }, [expandedGroups]);

  const [records, setRecords] = useState<any[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);

  // Inline edit state
  const [editingRowId, setEditingRowId] = useState<string | null>(null);
  const [editRowData, setEditRowData] = useState<any>(null);

  // Export state
  const [openExportId, setOpenExportId] = useState<string | null>(null);

  const fetchRecords = React.useCallback(
    async (silent = false) => {
      if (!user) return;
      const { data, error } = await supabase
        .from("chi_tiet")
        .select("*")
        .is("id_thanh_toan", null)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (!error && data) {
        setRecords(data);
        // Auto expand first group ONLY if no groups are currently expanded
        if (data.length > 0) {
          setExpandedGroups((prev) => {
            if (Object.keys(prev).length === 0) {
              return { [data[0].khach_hang]: true };
            }
            return prev;
          });
        }
      }
      if (!silent) setIsLoadingData(false);
    },
    [user],
  );

  useEffect(() => {
    if (user?.id) {
      // Defer to break synchronous render chain (Clean Code)
      Promise.resolve().then(() => fetchRecords());
    }
  }, [user?.id, fetchRecords]);

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm("Bạn có chắc chắn muốn xoá khoản này?")) {
      // Optimistic URL update
      setRecords((prev) => prev.filter((r) => r.id !== id));

      const { error } = await supabase.from("chi_tiet").delete().eq("id", id);
      if (error) {
        alert("Lỗi xoá dữ liệu: " + error.message);
        fetchRecords(true); // Sync data
      }
    }
  };

  const handleEdit = (item: any, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingRowId(item.id);
    setEditRowData({ ...item });
  };

  const handleSaveRow = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!editRowData) return;

    // Optimistic update
    setRecords((prev) =>
      prev.map((r) =>
        r.id === editRowData.id
          ? {
              ...editRowData,
              thanh_tien: editRowData.so_luong * editRowData.don_gia,
            }
          : r,
      ),
    );

    setEditingRowId(null);

    const { error } = await supabase
      .from("chi_tiet")
      .update({
        san_pham: editRowData.san_pham,
        dvt: editRowData.dvt,
        so_luong: editRowData.so_luong,
        don_gia: editRowData.don_gia,
        ghi_chu: editRowData.ghi_chu,
        ngay: editRowData.ngay,
      })
      .eq("id", editRowData.id);

    if (error) {
      alert("Lỗi cập nhật: " + error.message);
      fetchRecords(true); // revert
    } else {
      fetchRecords(true); // sync fresh data occasionally
    }
  };

  const handleAnalyze = async (text: string) => {
    if (!user) return;
    setRawInput(text);
    setIsAnalyzing(true);
    setParsedData(null);

    try {
      const { parseInput } = await import("../lib/aiParser");
      const result = await parseInput(text);

      // Auto-save to database
      const { data, error } = await supabase
        .from("chi_tiet")
        .insert([
          {
            khach_hang: result.customer,
            san_pham: result.product,
            dvt: result.unit,
            so_luong: result.quantity,
            don_gia: result.price,
            ghi_chu: result.note,
            ngay: result.date || new Date().toISOString().split("T")[0], // yyyy-mm-dd
            nhap_lieu: text,
            user_id: user.id,
          },
        ])
        .select()
        .single();

      if (error || !data) {
        throw new Error(
          "Lỗi khi lưu dữ liệu: " +
            (error?.message || "Không có dữ liệu trả về"),
        );
      }

      // Display the parsed data in preview
      setParsedData({
        id: data.id,
        khach_hang: data.khach_hang,
        san_pham: data.san_pham,
        dvt: data.dvt,
        so_luong: data.so_luong,
        don_gia: data.don_gia,
        thanh_tien: data.thanh_tien,
        ghi_chu: data.ghi_chu,
        ngay: new Date(data.ngay).toLocaleDateString("vi-VN"),
      });

      // Refresh list silently
      fetchRecords(true);
    } catch (error) {
      alert("Lỗi phân tích hoặc lưu dữ liệu: " + (error as Error).message);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleUpdateParsedData = async (updatedData: any) => {
    if (!updatedData.id) return;

    // Convert 'ngay' from DD/MM/YYYY to YYYY-MM-DD
    const [d, m, y] = updatedData.ngay.split("/");
    const isoDate = `${y}-${m}-${d}`;

    const { error } = await supabase
      .from("chi_tiet")
      .update({
        khach_hang: updatedData.khach_hang,
        san_pham: updatedData.san_pham,
        dvt: updatedData.dvt,
        so_luong: updatedData.so_luong,
        don_gia: updatedData.don_gia,
        ghi_chu: updatedData.ghi_chu,
        ngay: isoDate,
      })
      .eq("id", updatedData.id);

    if (error) {
      throw new Error(error.message);
    }

    setParsedData(updatedData);
    fetchRecords(true);
  };

  const handleDeleteParsedData = async (id: string) => {
    setRecords((prev) => prev.filter((r) => r.id !== id));

    const { error } = await supabase.from("chi_tiet").delete().eq("id", id);
    if (error) {
      fetchRecords(true); // Revert optimistic update
      throw new Error(error.message);
    }
  };

  const handleThanhToan = async (khach_hang: string) => {
    if (
      !window.confirm(
        `Bạn có chắc chắn muốn xác nhận đã thanh toán toàn bộ công nợ của ${khach_hang}?`,
      )
    ) {
      return;
    }

    const today = new Date();
    const d = today.getDate().toString().padStart(2, "0");
    const m = (today.getMonth() + 1).toString().padStart(2, "0");
    const y = today.getFullYear().toString();
    const id_thanh_toan = `id_${d}${m}${y}`;

    // Get all unpaid records for this customer from current state
    const customerRecords = records.filter((r) => r.khach_hang === khach_hang);
    const idsToUpdate = customerRecords.map((r) => r.id);

    if (idsToUpdate.length === 0) return;

    // Optimistic UI update: Remove them from Chua Thanh Toan
    setRecords((prev) => prev.filter((r) => r.khach_hang !== khach_hang));

    // Supabase update
    const { error } = await supabase
      .from("chi_tiet")
      .update({ id_thanh_toan })
      .in("id", idsToUpdate);

    if (error) {
      alert("Lỗi cập nhật: " + error.message);
      fetchRecords(true); // Revert on error
    } else {
      fetchRecords(true);
    }
  };

  const handleManualSubmit = async (data: any) => {
    if (!user) return;
    const { error } = await supabase.from("chi_tiet").insert([
      {
        khach_hang: data.khach_hang,
        san_pham: data.san_pham,
        so_luong: data.so_luong,
        don_gia: data.don_gia,
        dvt: data.dvt,
        ghi_chu: data.ghi_chu,
        ngay: new Date().toISOString().split("T")[0], // yyyy-mm-dd
        nhap_lieu: `Nhập thủ công: ${data.khach_hang} - ${data.san_pham}${data.ghi_chu ? ` (${data.ghi_chu})` : ""}`,
        user_id: user.id,
      },
    ]);

    if (error) {
      throw error;
    }

    fetchRecords(true);
  };

  const toggleGroup = (customer: string) => {
    setExpandedGroups((prev) => ({ ...prev, [customer]: !prev[customer] }));
  };

  const handleExport = async (type: string, khach_hang: string) => {
    const element = document.getElementById(`customer-card-${khach_hang}`);
    if (!element) return;

    const customerItems = groupedOrders[khach_hang];
    const fileName = `CongNo_${khach_hang.replace(/\s+/g, "_")}_${new Date().toISOString().split("T")[0]}`;

    try {
      if (type === "image") {
        const dataUrl = await toPng(element, {
          backgroundColor: "#111",
          filter: (node: HTMLElement) => {
            return !node.classList?.contains("export-exclude");
          },
          style: {
            borderRadius: "0",
          },
        });
        const link = document.createElement("a");
        link.download = `${fileName}.png`;
        link.href = dataUrl;
        link.click();
      } else if (type === "copy") {
        if (!navigator.clipboard || !window.ClipboardItem) {
          alert(
            "Trình duyệt không hỗ trợ sao chép hình ảnh. Hãy thử lưu thành file Image.",
          );
          return;
        }

        try {
          // Use Promise-based ClipboardItem to solve "user activation" expiration
          const copyPromise = toBlob(element, {
            backgroundColor: "#111",
            filter: (node: HTMLElement) =>
              !node.classList?.contains("export-exclude"),
          }).then((blob) => {
            if (!blob) throw new Error("Không thể tạo hình ảnh");
            return blob;
          });

          const item = new ClipboardItem({
            "image/png": copyPromise,
          });

          await navigator.clipboard.write([item]);
          alert("Đã sao chép hình ảnh vào bộ nhớ tạm!");
        } catch (clipErr) {
          console.error("Clipboard error:", clipErr);
          alert(
            "Lỗi: Không thể sao chép. Hãy thử lưu file hoặc kiểm tra quyền truy cập (HTTPS/Localhost).",
          );
        }
      } else if (type === "xlsx") {
        // 1. Chuẩn bị dữ liệu thô
        const data = customerItems.map((item: any) => ({
          "Ngày": item.ngay,
          "Sản phẩm": item.san_pham,
          "ĐVT": item.dvt,
          "Số lượng": Number(item.so_luong) || 0,
          "Đơn giá": Number(item.don_gia) || 0,
          "Thành tiền": Number(item.thanh_tien) || 0,
          "Ghi chú": item.ghi_chu || "",
        }));

        // 2. Tính dòng Total
        const totalAmount = data.reduce((sum: number, item: any) => sum + item["Thành tiền"], 0);
        const totalRow = {
          "Ngày": "TỔNG CỘNG",
          "Sản phẩm": "", "ĐVT": "", "Số lượng": "", "Đơn giá": "",
          "Thành tiền": totalAmount,
          "Ghi chú": ""
        };
        
        // Thêm dòng total vào cuối mảng data
        const finalData = [...data, totalRow];

        // 3. Tạo Worksheet
        const ws = XLSX.utils.json_to_sheet(finalData);

        // 4. Định dạng (Styling)
        const range = XLSX.utils.decode_range(ws['!ref'] || 'A1');
        
        // Thiết lập chiều cao dòng cho toàn bộ bảng (15 * 1.35 = 20.25)
        ws['!rows'] = Array(range.e.r + 1).fill({ hpt: 20.25 });

        // Duyệt qua từng cell để định dạng
        for (let R = range.s.r; R <= range.e.r; ++R) {
          for (let C = range.s.c; C <= range.e.c; ++C) {
            const cellAddress = XLSX.utils.encode_cell({ r: R, c: C });
            const cell = ws[cellAddress];
            if (!cell) continue;

            const isHeader = R === 0;
            const isTotal = R === range.e.r;
            const value = cell.v;
            const isNumber = typeof value === 'number';

            // Định dạng chung cho tất cả cell
            cell.s = {
              alignment: { 
                vertical: "center", 
                horizontal: isHeader || (isTotal && C === 0) ? "center" : (isNumber ? "right" : "left") 
              },
              font: { name: "Arial", size: 10 },
              border: {
                top: { style: 'thin' },
                bottom: { style: 'thin' },
                left: { style: 'thin' },
                right: { style: 'thin' }
              }
            };

            // Định dạng số cho cột Số lượng, Đơn giá, Thành tiền (indices 3, 4, 5)
            if (isNumber && (C >= 3 && C <= 5)) {
              cell.z = "#,##0";
            }

            // Header (Dòng 0): In đậm, nền xám nhẹ
            if (isHeader) {
              cell.s.font.bold = true;
              cell.s.fill = { fgColor: { rgb: "EEEEEE" } };
            }

            // Dòng cuối (Total Row): In đậm
            if (isTotal) {
              cell.s.font.bold = true;
              cell.s.font.color = { rgb: "FF0000" }; // Chữ đỏ cho nổi
            }
          }
        }

        // Merge ô cho dòng TỔNG CỘNG (A:D)
        ws['!merges'] = [
          { s: { r: range.e.r, c: 0 }, e: { r: range.e.r, c: 3 } }
        ];

        // 5. Autofit Width
        const colWidths = Object.keys(finalData[0]).map(key => {
          const maxLength = Math.max(
            key.toString().length,
            ...finalData.map(row => (row[key as keyof typeof totalRow] ? row[key as keyof typeof totalRow].toString().length : 0))
          );
          return { wch: maxLength + 5 };
        });
        ws['!cols'] = colWidths;

        // 6. Xuất file
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "CongNo");
        XLSX.writeFile(wb, `${fileName}.xlsx`);
      } else if (type === "csv") {
        const headers =
          "Ngày,Sản phẩm,ĐVT,Số lượng,Đơn giá,Thành tiền,Ghi chú\n";
        const rows = customerItems
          .map(
            (item) =>
              `${item.ngay},${item.san_pham},${item.dvt},${item.so_luong},${item.don_gia},${item.thanh_tien},"${item.ghi_chu || ""}"`,
          )
          .join("\n");
        const blob = new Blob(["\ufeff" + headers + rows], {
          type: "text/csv;charset=utf-8",
        });
        const link = document.createElement("a");
        link.download = `${fileName}.csv`;
        link.href = URL.createObjectURL(blob);
        link.click();
      }
    } catch (err) {
      console.error("Export error:", err);
      alert("Lỗi khi xuất dữ liệu");
    }
    setOpenExportId(null);
  };

  // Group records by customer
  const groupedOrders = records.reduce(
    (acc: Record<string, any[]>, curr: any) => {
      if (!acc[curr.khach_hang]) acc[curr.khach_hang] = [];
      acc[curr.khach_hang].push(curr);
      return acc;
    },
    {},
  );

  // Filter by search
  const filteredCustomers = Object.keys(groupedOrders).filter((kh) =>
    kh.toLowerCase().includes(search.toLowerCase()),
  );

  const totalDebt = records.reduce(
    (sum: number, item: any) => sum + (Number(item.thanh_tien) || 0),
    0,
  );

  const inputStyle =
    "w-full bg-black/30 border border-primary rounded px-2 py-1 text-main text-[13px] outline-none";

  return (
    <div className="flex flex-col md:flex-row md:items-start gap-6 pb-8">
      <div className="md:sticky md:top-[65px] z-10 md:w-[35%] md:min-w-[320px]">
        {/* AI Input Section */}
        <HeroInput
          onAnalyze={handleAnalyze}
          onManualSubmit={handleManualSubmit}
          isLoading={isAnalyzing}
        />

        {/* AI Processing / Preview */}
        {(isAnalyzing || parsedData) && (
          <AIPreview
            isLoading={isAnalyzing}
            data={parsedData}
            rawInput={rawInput}
            onUpdate={handleUpdateParsedData}
            onDelete={handleDeleteParsedData}
            onClose={() => setParsedData(null)}
          />
        )}
      </div>

      {/* Unpaid Orders Section */}
      <div className="md:flex-1 md:w-full overflow-x-auto">
        <div className="relative mb-4">
          <Search
            size={18}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted"
          />
          <input
            type="text"
            placeholder="Tìm khách hàng..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-card border border-border rounded-full py-3 px-3 pl-10 text-main text-[15px] outline-none focus:border-primary transition-colors"
          />
        </div>

        <div className="flex items-center justify-end mb-4 px-1">
          <div className="font-bold text-danger">
            Tổng nợ: {totalDebt.toLocaleString()} ₫
          </div>
        </div>

        {isLoadingData ? (
          <div className="flex justify-center p-8">
            <Loader2
              className="animate-spin text-primary"
              size={32}
              style={{ animation: "spin 1s linear infinite" }}
            />
            <style>{`@keyframes spin { 100% { transform: rotate(360deg); } }`}</style>
          </div>
        ) : filteredCustomers.length === 0 ? (
          <div className="text-center text-muted p-8">
            Không có dữ liệu công nợ
          </div>
        ) : (
          filteredCustomers.map((khach_hang) => {
            const customerItems = groupedOrders[khach_hang];
            const customerTotal = customerItems.reduce(
              (sum: number, item: any) => sum + (Number(item.thanh_tien) || 0),
              0,
            );

            return (
              <div
                key={khach_hang}
                id={`customer-card-${khach_hang}`}
                className="card mb-4 p-0 overflow-hidden"
              >
                <div
                  className="flex items-center justify-between p-4 cursor-pointer bg-white/2 hover:bg-white/5 transition-colors"
                  onClick={() => toggleGroup(khach_hang)}
                >
                  <div>
                    <div className="font-bold text-[16px]">{khach_hang}</div>
                    <div className="text-muted text-[13px]">
                      {customerItems.length} đơn hàng
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-danger">
                      {customerTotal.toLocaleString()} ₫
                    </span>
                    {expandedGroups[khach_hang] ? (
                      <ChevronDown size={20} className="text-muted" />
                    ) : (
                      <ChevronRight size={20} className="text-muted" />
                    )}
                  </div>
                </div>

                {expandedGroups[khach_hang] && (
                  <div
                    style={{
                      borderTop: "1px solid var(--border)",
                      padding: "16px",
                    }}
                  >
                    {/* Mobile View */}
                    <div className="md:hidden flex flex-col gap-y-2 divide-y-2 divide-[var(--border)] mb-4">
                      {customerItems.map((item: any) => {
                        const dateObj = new Date(item.ngay);
                        const dateStr = `${dateObj.getDate().toString().padStart(2, "0")}/${(dateObj.getMonth() + 1).toString().padStart(2, "0")}`;

                        if (editingRowId === item.id) {
                          return (
                            <div
                              key={`edit-mob-${item.id}`}
                              className="p-3 flex flex-col gap-2"
                            >
                              <div className="flex gap-2">
                                <input
                                  type="date"
                                  value={editRowData.ngay}
                                  onChange={(e) =>
                                    setEditRowData({
                                      ...editRowData,
                                      ngay: e.target.value,
                                    })
                                  }
                                  className={`${inputStyle} flex-1`}
                                />
                                <input
                                  type="text"
                                  value={editRowData.san_pham}
                                  onChange={(e) =>
                                    setEditRowData({
                                      ...editRowData,
                                      san_pham: e.target.value,
                                    })
                                  }
                                  placeholder="Sản phẩm"
                                  className={`${inputStyle} flex-[2]`}
                                />
                              </div>
                              <div className="flex gap-2">
                                <input
                                  type="number"
                                  value={editRowData.so_luong}
                                  onChange={(e) =>
                                    setEditRowData({
                                      ...editRowData,
                                      so_luong: Number(e.target.value),
                                    })
                                  }
                                  placeholder="SL"
                                  className={`${inputStyle} !w-[20%]`}
                                />
                                <input
                                  type="text"
                                  value={editRowData.dvt}
                                  onChange={(e) =>
                                    setEditRowData({
                                      ...editRowData,
                                      dvt: e.target.value,
                                    })
                                  }
                                  placeholder="ĐVT"
                                  className={`${inputStyle} !w-[22%]`}
                                />
                                <input
                                  type="number"
                                  value={editRowData.don_gia}
                                  onChange={(e) =>
                                    setEditRowData({
                                      ...editRowData,
                                      don_gia: Number(e.target.value),
                                    })
                                  }
                                  placeholder="Đơn giá"
                                  className={`${inputStyle} flex-1`}
                                />
                              </div>
                              <input
                                type="text"
                                value={editRowData.ghi_chu || ""}
                                onChange={(e) =>
                                  setEditRowData({
                                    ...editRowData,
                                    ghi_chu: e.target.value,
                                  })
                                }
                                placeholder="Ghi chú"
                                className={inputStyle}
                              />
                              <div className="flex justify-end gap-3 mt-1">
                                <button
                                  onClick={(e) => handleSaveRow(e)}
                                  className="text-success p-1"
                                >
                                  <Save size={18} />
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setEditingRowId(null);
                                  }}
                                  className="text-muted p-1"
                                >
                                  <X size={18} />
                                </button>
                              </div>
                            </div>
                          );
                        }

                        return (
                          <div
                            key={`mob-${item.id}`}
                            className="p-3 relative hover:bg-white/5"
                          >
                            <div className="flex justify-between items-start mb-1">
                              <div className="font-semibold text-[14px] flex items-center gap-2">
                                <span className="text-muted">[{dateStr}]</span>
                                <span>{item.san_pham}</span>
                              </div>
                              <div className="flex gap-3">
                                <button
                                  onClick={(e) => handleEdit(item, e)}
                                  className="text-muted hover:text-primary transition-colors"
                                >
                                  <Edit2 size={16} />
                                </button>
                                <button
                                  onClick={(e) => handleDelete(item.id, e)}
                                  className="text-muted hover:text-danger transition-colors"
                                >
                                  <Trash2 size={16} />
                                </button>
                              </div>
                            </div>
                            <div
                              className="text-[13px] mb-1"
                              style={{ color: "var(--text-main)" }}
                            >
                              {item.so_luong} x{" "}
                              {Number(item.don_gia).toLocaleString()} ={" "}
                              <span className="font-bold text-danger">
                                {Number(item.thanh_tien).toLocaleString()} ₫
                              </span>
                            </div>
                            {item.nhap_lieu && (
                              <div className="description text-muted italic whitespace-nowrap overflow-hidden text-ellipsis">
                                {item.nhap_lieu}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {/* Desktop View */}
                    <div className="hidden md:block overflow-x-auto">
                      <table className="w-full text-[13px] text-left border-collapse mb-4">
                        <thead>
                          <tr className="text-muted border-b border-border">
                            <th className="pb-2 w-[30px]"></th>
                            <th className="pb-2 whitespace-nowrap">Ngày</th>
                            <th className="pb-2 whitespace-nowrap">Sản phẩm</th>
                            <th className="pb-2 whitespace-nowrap">ĐVT</th>
                            <th className="pb-2 whitespace-nowrap text-right">
                              SL
                            </th>
                            <th className="pb-2 whitespace-nowrap text-right">
                              Đơn giá
                            </th>
                            <th className="pb-2 whitespace-nowrap text-right">
                              Thành tiền
                            </th>
                            <th className="pb-2 whitespace-nowrap">Ghi chú</th>
                            <th className="pb-2 whitespace-nowrap text-center">
                              Thao tác
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {customerItems.map((item: any) => {
                            const dateObj = new Date(item.ngay);
                            const dateStr = `${dateObj.getDate().toString().padStart(2, "0")}/${(dateObj.getMonth() + 1).toString().padStart(2, "0")}`;

                            if (editingRowId === item.id) {
                              return (
                                <tr
                                  key={`edit-${item.id}`}
                                  style={{
                                    borderBottom:
                                      "1px solid rgba(255,255,255,0.05)",
                                  }}
                                  className="bg-white/5"
                                >
                                  <td style={{ padding: "8px 2px" }}></td>
                                  <td style={{ padding: "8px 4px" }}>
                                    <input
                                      type="date"
                                      value={editRowData.ngay}
                                      onChange={(e) =>
                                        setEditRowData({
                                          ...editRowData,
                                          ngay: e.target.value,
                                        })
                                      }
                                      className={`${inputStyle} w-[120px]`}
                                    />
                                  </td>
                                  <td style={{ padding: "8px 4px" }}>
                                    <input
                                      type="text"
                                      value={editRowData.san_pham}
                                      onChange={(e) =>
                                        setEditRowData({
                                          ...editRowData,
                                          san_pham: e.target.value,
                                        })
                                      }
                                      className={inputStyle}
                                    />
                                  </td>
                                  <td style={{ padding: "8px 4px" }}>
                                    <input
                                      type="text"
                                      value={editRowData.dvt}
                                      onChange={(e) =>
                                        setEditRowData({
                                          ...editRowData,
                                          dvt: e.target.value,
                                        })
                                      }
                                      className={`${inputStyle} w-[60px]`}
                                    />
                                  </td>
                                  <td style={{ padding: "8px 4px" }}>
                                    <input
                                      type="number"
                                      value={editRowData.so_luong}
                                      onChange={(e) =>
                                        setEditRowData({
                                          ...editRowData,
                                          so_luong: Number(e.target.value),
                                        })
                                      }
                                      className={`${inputStyle} w-[60px]`}
                                    />
                                  </td>
                                  <td style={{ padding: "8px 4px" }}>
                                    <input
                                      type="number"
                                      value={editRowData.don_gia}
                                      onChange={(e) =>
                                        setEditRowData({
                                          ...editRowData,
                                          don_gia: Number(e.target.value),
                                        })
                                      }
                                      className={`${inputStyle} w-[90px]`}
                                    />
                                  </td>
                                  <td
                                    style={{
                                      padding: "12px 8px",
                                      textAlign: "right",
                                      fontWeight: "500",
                                    }}
                                    className="text-primary"
                                  >
                                    {(
                                      editRowData.so_luong * editRowData.don_gia
                                    ).toLocaleString()}{" "}
                                    ₫
                                  </td>
                                  <td style={{ padding: "8px 4px" }}>
                                    <input
                                      type="text"
                                      value={editRowData.ghi_chu || ""}
                                      onChange={(e) =>
                                        setEditRowData({
                                          ...editRowData,
                                          ghi_chu: e.target.value,
                                        })
                                      }
                                      className={inputStyle}
                                    />
                                  </td>
                                  <td style={{ padding: "12px 8px" }}>
                                    <div className="flex justify-center gap-2">
                                      <button
                                        onClick={handleSaveRow}
                                        className="text-success hover:text-white transition-colors"
                                        title="Lưu"
                                      >
                                        <Save size={16} />
                                      </button>
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setEditingRowId(null);
                                        }}
                                        className="text-muted hover:text-white transition-colors"
                                        title="Huỷ"
                                      >
                                        <X size={16} />
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              );
                            }

                            return (
                              <tr
                                key={item.id}
                                className="hover:bg-white/5 border-b border-white/5"
                              >
                                <td className="py-3 px-0.5">
                                  <input
                                    type="checkbox"
                                    className="accent-primary"
                                  />
                                </td>
                                <td className="py-3 px-2 whitespace-nowrap">
                                  {dateStr}
                                </td>
                                <td className="py-3 px-2">{item.san_pham}</td>
                                <td className="py-3 px-2 whitespace-nowrap">
                                  {item.dvt}
                                </td>
                                <td className="py-3 px-2 text-right">
                                  {item.so_luong}
                                </td>
                                <td className="py-3 px-2 text-right">
                                  {Number(item.don_gia).toLocaleString()}
                                </td>
                                <td className="py-3 px-2 text-right font-medium text-primary">
                                  {Number(item.thanh_tien).toLocaleString()} ₫
                                </td>
                                <td
                                  className="py-3 px-2 max-w-[150px] overflow-hidden text-ellipsis whitespace-nowrap"
                                  title={item.ghi_chu}
                                >
                                  {item.ghi_chu}
                                </td>
                                <td className="py-3 px-2">
                                  <div className="flex justify-center gap-3">
                                    <button
                                      onClick={(e) => handleEdit(item, e)}
                                      className="text-muted hover:text-primary transition-colors"
                                      title="Sửa"
                                    >
                                      <Edit2 size={16} />
                                    </button>
                                    <button
                                      onClick={(e) => handleDelete(item.id, e)}
                                      className="text-muted hover:text-danger transition-colors"
                                      title="Xoá"
                                    >
                                      <Trash2 size={16} />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                    <div className="flex items-center gap-2 export-exclude">
                      <div className="relative">
                        <button
                          onClick={() =>
                            setOpenExportId(
                              openExportId === khach_hang ? null : khach_hang,
                            )
                          }
                          className="btn bg-white/5 border border-border px-4 py-2 text-[14px] flex items-center gap-2 hover:bg-white/10"
                        >
                          <Share2 size={16} /> Export
                        </button>
                        {openExportId === khach_hang && (
                          <div className="absolute bottom-full left-0 mb-2 w-[160px] bg-card border border-border rounded-lg shadow-xl z-20 py-1 animate-in fade-in slide-in-from-bottom-2 duration-200">
                            <button
                              onClick={() => handleExport("image", khach_hang)}
                              className="w-full text-left px-4 py-2 text-[14px] hover:bg-primary/10 flex items-center gap-2"
                            >
                              <ImageIcon size={14} className="text-primary" />{" "}
                              Image
                            </button>
                            <button
                              onClick={() => handleExport("copy", khach_hang)}
                              className="w-full text-left px-4 py-2 text-[14px] hover:bg-primary/10 flex items-center gap-2"
                            >
                              <CopyIcon size={14} className="text-primary" />{" "}
                              Copy
                            </button>
                            <button
                              onClick={() => handleExport("xlsx", khach_hang)}
                              className="w-full text-left px-4 py-2 text-[14px] hover:bg-primary/10 flex items-center gap-2"
                            >
                              <FileSpreadsheet
                                size={14}
                                className="text-primary"
                              />{" "}
                              Excel
                            </button>
                            <button
                              onClick={() => handleExport("csv", khach_hang)}
                              className="w-full text-left px-4 py-2 text-[14px] hover:bg-primary/10 flex items-center gap-2"
                            >
                              <FileCode size={14} className="text-primary" />{" "}
                              CSV
                            </button>
                          </div>
                        )}
                      </div>
                      <button
                        onClick={() => handleThanhToan(khach_hang)}
                        className="btn btn-primary px-4 py-2 text-[14px]"
                      >
                        <CheckCircle2 size={16} /> Đã thanh toán
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
