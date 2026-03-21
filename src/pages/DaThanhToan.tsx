/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect } from "react";
import {
  ChevronDown,
  ChevronRight,
  CheckCircle,
  Search,
  Loader2,
  Share2,
  Image as ImageIcon,
  Copy as CopyIcon,
  FileSpreadsheet,
  FileCode,
} from "lucide-react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../context/AuthContext";
import { toPng, toBlob } from "html-to-image";
import * as XLSX from "xlsx-js-style";

export const DaThanhToan: React.FC = () => {
  const { user } = useAuth();
  const [expandedBatches, setExpandedBatches] = useState<
    Record<string, boolean>
  >({});
  const [records, setRecords] = useState<any[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [search, setSearch] = useState("");

  // Export state
  const [openExportId, setOpenExportId] = useState<string | null>(null);

  const fetchRecords = React.useCallback(
    async (silent = false) => {
      if (!user) return;
      if (!silent) setIsLoadingData(true);
      const { data, error } = await supabase
        .from("chi_tiet")
        .select("*")
        .not("id_thanh_toan", "is", null)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (!error && data) {
        setRecords(data);
        // Auto expand the most recent batch of the first customer
        if (data.length > 0) {
          setExpandedBatches({ [data[0].id_thanh_toan]: true });
        }
      }
      if (!silent) setIsLoadingData(false);
    },
    [user],
  );

  useEffect(() => {
    if (user?.id) {
      Promise.resolve().then(() => fetchRecords());
    }
  }, [user?.id, fetchRecords]);

  const toggleBatch = (batchId: string) => {
    setExpandedBatches((prev) => ({ ...prev, [batchId]: !prev[batchId] }));
  };

  const handleExport = async (
    type: string,
    batchId: string,
    khach_hang: string,
  ) => {
    const element = document.getElementById(`batch-card-${batchId}`);
    if (!element) return;

    const batchItems = groupedData[khach_hang][batchId];
    const fileName = `DaTT_${khach_hang.replace(/\s+/g, "_")}_${batchId}`;

    try {
      if (type === "image") {
        const dataUrl = await toPng(element, {
          backgroundColor: "#111",
          filter: (node: HTMLElement) =>
            !node.classList?.contains("export-exclude"),
          style: { borderRadius: "0" },
        });
        const link = document.createElement("a");
        link.download = `${fileName}.png`;
        link.href = dataUrl;
        link.click();
      } else if (type === "copy") {
        if (!navigator.clipboard || !window.ClipboardItem) {
          alert("Trình duyệt không hỗ trợ sao chép hình ảnh.");
          return;
        }
        const copyPromise = toBlob(element, {
          backgroundColor: "#111",
          filter: (node: HTMLElement) =>
            !node.classList?.contains("export-exclude"),
        }).then((blob) => {
          if (!blob) throw new Error("Không thể tạo hình ảnh");
          return blob;
        });

        await navigator.clipboard.write([
          new ClipboardItem({ "image/png": copyPromise }),
        ]);
        alert("Đã sao chép vào bộ nhớ tạm!");
      } else if (type === "xlsx") {
        // 1. Chuẩn bị dữ liệu thô
        const data = batchItems.map((item: any) => ({
          "Khách hàng": item.khach_hang,
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
          "Khách hàng": "TỔNG CỘNG",
          "Ngày": "", "Sản phẩm": "", "ĐVT": "", "Số lượng": "", "Đơn giá": "",
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

            // Định dạng số cho cột Số lượng, Đơn giá, Thành tiền
            if (isNumber && (C >= 4 && C <= 6)) {
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
        XLSX.utils.book_append_sheet(wb, ws, "DaThanhToan");
        XLSX.writeFile(wb, `${fileName}.xlsx`);
      } else if (type === "csv") {
        const headers =
          "Khách hàng,Ngày,Sản phẩm,ĐVT,Số lượng,Đơn giá,Thành tiền,Ghi chú\n";
        const rows = batchItems
          .map(
            (item: any) =>
              `${item.khach_hang},${item.ngay},${item.san_pham},${item.dvt},${item.so_luong},${item.don_gia},${item.thanh_tien},"${item.ghi_chu || ""}"`,
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

  // Group records by customer, then by payment batch (id_thanh_toan)
  const groupedData = records.reduce(
    (acc, curr) => {
      if (!acc[curr.khach_hang]) acc[curr.khach_hang] = {};
      if (!acc[curr.khach_hang][curr.id_thanh_toan])
        acc[curr.khach_hang][curr.id_thanh_toan] = [];
      acc[curr.khach_hang][curr.id_thanh_toan].push(curr);
      return acc;
    },
    {} as Record<string, Record<string, any[]>>,
  );

  // Filter customers by search
  const filteredCustomers = Object.keys(groupedData).filter((kh) =>
    kh.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="layout-da-thanh-toan pb-8">
      <h2 className="text-[20px] font-bold mb-5">Đã thanh toán</h2>

      <div className="relative mb-6 max-w-[400px]">
        <Search
          size={18}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-muted"
        />
        <input
          type="text"
          placeholder="Tìm khách hàng..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-card border border-border rounded-full py-3 pr-3 pl-10 text-main text-[15px] outline-none focus:border-primary transition-colors"
        />
      </div>

      {isLoadingData ? (
        <div className="flex justify-center p-8">
          <Loader2 className="animate-spin text-primary" size={32} />
        </div>
      ) : filteredCustomers.length === 0 ? (
        <div className="text-center text-muted p-8">
          Không có dữ liệu đã thanh toán
        </div>
      ) : (
        filteredCustomers.map((khach_hang) => (
          <div key={khach_hang} className="mb-4">
            {/* Payment Batches per Customer */}
            {Object.keys(groupedData[khach_hang]).map((batchId) => {
              const batchItems = groupedData[khach_hang][batchId];
              const batchTotal = batchItems.reduce(
                (sum: number, item: any) =>
                  sum + (Number(item.thanh_tien) || 0),
                0,
              );

              // Extract date from batchId if format is "id_DDMMYYYY"
              let batchDateStr = batchId;
              if (batchId.startsWith("id_") && batchId.length === 11) {
                const d = batchId.substring(3, 5);
                const m = batchId.substring(5, 7);
                const y = batchId.substring(7, 11);
                batchDateStr = `${d}/${m}/${y}`;
              }

              return (
                <div 
                  key={batchId} 
                  id={`batch-card-${batchId}`} 
                  className="mb-8 p-1"
                >
                  {/* Tiêu đề Khách hàng (Được đưa vào ID để capture khi xuất ảnh) */}
                  <div className="flex items-center gap-2 mb-3 px-1">
                    <CheckCircle size={20} className="text-success" />
                    <h3 className="font-bold text-[16px]">{khach_hang}</h3>
                  </div>
                  <div className="card p-0 overflow-hidden shadow-xl">
                  <div
                    className="flex items-center justify-between p-4 cursor-pointer bg-[rgba(255,255,255,0.02)] hover:bg-[rgba(255,255,255,0.04)] transition-colors"
                    onClick={() => toggleBatch(batchId)}
                  >
                    <div className="flex items-center gap-3">
                      <span className="bg-success/20 text-success px-2 py-1 rounded-sm text-[11px] font-bold">
                        Đã TT
                      </span>
                      <div className="font-semibold text-[14px]">
                        Ngày TT: {batchDateStr}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-success">
                        {batchTotal.toLocaleString()} ₫
                      </span>
                      {expandedBatches[batchId] ? (
                        <ChevronDown size={20} className="text-muted" />
                      ) : (
                        <ChevronRight size={20} className="text-muted" />
                      )}
                    </div>
                  </div>

                  {expandedBatches[batchId] && (
                    <div className="border-t border-border p-4">
                      {/* Mobile View */}
                      <div className="md:hidden flex flex-col mb-4">
                        {batchItems.map((item: any) => {
                          const dateObj = new Date(item.ngay);
                          const dateStr = `${dateObj.getDate().toString().padStart(2, "0")}/${(dateObj.getMonth() + 1).toString().padStart(2, "0")}`;

                          return (
                            <div
                              key={`mob-${item.id}`}
                              className="p-3 border-b border-white/5 relative hover:bg-white/5"
                            >
                              <div className="flex justify-between items-start mb-1">
                                <div className="font-semibold text-[14px] flex items-center gap-2">
                                  <span className="text-muted">
                                    [{dateStr}]
                                  </span>
                                  <span>{item.san_pham}</span>
                                </div>
                              </div>
                              <div className="text-[13px] mb-1 text-main">
                                {item.so_luong} {item.dvt} x{" "}
                                {Number(item.don_gia).toLocaleString()} ={" "}
                                <span className="font-bold text-success">
                                  {Number(item.thanh_tien).toLocaleString()} ₫
                                </span>
                              </div>
                              {item.ghi_chu && (
                                <div className="text-[11px] text-muted italic">
                                  Ghi chú: {item.ghi_chu}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>

                      {/* Desktop View */}
                      <div className="hidden md:block overflow-x-auto">
                        <table className="w-full text-[13px] text-left border-collapse mb-2 min-w-[400px]">
                          <thead>
                            <tr className="text-muted border-b border-border">
                              <th className="pb-2 whitespace-nowrap">
                                Ngày mua
                              </th>
                              <th className="pb-2 whitespace-nowrap">
                                Sản phẩm
                              </th>
                              <th className="pb-2 whitespace-nowrap text-right">
                                SL
                              </th>
                              <th className="pb-2 whitespace-nowrap text-right">
                                Đơn giá
                              </th>
                              <th className="pb-2 whitespace-nowrap text-right">
                                Thành tiền
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {batchItems.map((item: any) => {
                              const dateObj = new Date(item.ngay);
                              const dateStr = `${dateObj.getDate().toString().padStart(2, "0")}/${(dateObj.getMonth() + 1).toString().padStart(2, "0")}`;

                              return (
                                <tr
                                  key={`desk-${item.id}`}
                                  className="hover:bg-white/5 border-b border-white/5"
                                >
                                  <td className="py-3 px-0">{dateStr}</td>
                                  <td className="py-3 px-0">{item.san_pham}</td>
                                  <td className="py-3 px-0 text-right">
                                    {item.so_luong} {item.dvt}
                                  </td>
                                  <td className="py-3 px-0 text-right">
                                    {Number(item.don_gia).toLocaleString()}
                                  </td>
                                  <td className="py-3 px-0 text-right font-medium text-success">
                                    {Number(item.thanh_tien).toLocaleString()} ₫
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>

                      <div className="flex justify-between items-center pt-2 text-[14px]">
                        <div className="flex items-center gap-2 export-exclude">
                          <div className="relative">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setOpenExportId(
                                  openExportId === batchId ? null : batchId,
                                );
                              }}
                              className="btn bg-white/5 border border-border px-3 py-1.5 text-[12px] flex items-center gap-2 hover:bg-white/10"
                            >
                              <Share2 size={14} /> Export
                            </button>
                            {openExportId === batchId && (
                              <div className="absolute bottom-full left-0 mb-2 w-[140px] bg-card border border-border rounded-lg shadow-xl z-20 py-1 animate-in fade-in slide-in-from-bottom-2 duration-200">
                                <button
                                  onClick={() =>
                                    handleExport("image", batchId, khach_hang)
                                  }
                                  className="w-full text-left px-3 py-1.5 text-[13px] hover:bg-primary/10 flex items-center gap-2"
                                >
                                  <ImageIcon
                                    size={14}
                                    className="text-primary"
                                  />{" "}
                                  Image
                                </button>
                                <button
                                  onClick={() =>
                                    handleExport("copy", batchId, khach_hang)
                                  }
                                  className="w-full text-left px-3 py-1.5 text-[13px] hover:bg-primary/10 flex items-center gap-2"
                                >
                                  <CopyIcon
                                    size={14}
                                    className="text-primary"
                                  />{" "}
                                  Copy
                                </button>
                                <button
                                  onClick={() =>
                                    handleExport("xlsx", batchId, khach_hang)
                                  }
                                  className="w-full text-left px-3 py-1.5 text-[13px] hover:bg-primary/10 flex items-center gap-2"
                                >
                                  <FileSpreadsheet
                                    size={14}
                                    className="text-primary"
                                  />{" "}
                                  Excel
                                </button>
                                <button
                                  onClick={() =>
                                    handleExport("csv", batchId, khach_hang)
                                  }
                                  className="w-full text-left px-3 py-1.5 text-[13px] hover:bg-primary/10 flex items-center gap-2"
                                >
                                  <FileCode
                                    size={14}
                                    className="text-primary"
                                  />{" "}
                                  CSV
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="text-muted font-bold">
                            Tổng đợt:
                          </span>
                          <span className="font-bold text-success ml-2">
                            {batchTotal.toLocaleString()} ₫
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ))
    )}
  </div>
);
};
