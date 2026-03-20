/* eslint-disable react-hooks/static-components */
/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect, useMemo } from "react";
import {
  Search,
  Loader2,
  Edit2,
  Trash2,
  Save,
  X,
  ArrowUpDown,
  Share2,
  Image as ImageIcon,
  Copy as CopyIcon,
  FileSpreadsheet,
  FileCode,
} from "lucide-react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../context/AuthContext";
import { toPng, toBlob } from "html-to-image";
import * as XLSX from "xlsx";

type SortDir = "asc" | "desc" | null;
type SortKey = "khach_hang" | "ngay";

export const TatCaDon: React.FC = () => {
  const { user } = useAuth();
  const [records, setRecords] = useState<any[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [search, setSearch] = useState("");

  // Inline edit state
  const [editingRowId, setEditingRowId] = useState<string | null>(null);
  const [editRowData, setEditRowData] = useState<any>(null);

  // Sorting state
  const [sortConfig, setSortConfig] = useState<{
    khach_hang: SortDir;
    ngay: SortDir;
    primary: SortKey | null;
  }>({ khach_hang: null, ngay: "desc", primary: "ngay" });

  // Export state
  const [openExport, setOpenExport] = useState(false);

  const fetchRecords = React.useCallback(
    async (silent = false) => {
      if (!user) return;
      const { data, error } = await supabase
        .from("chi_tiet")
        .select("*")
        .eq("user_id", user.id);

      if (!error && data) {
        setRecords(data);
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

  const handleDelete = async (id: string) => {
    if (window.confirm("Bạn có chắc chắn muốn xoá khoản này?")) {
      setRecords((prev) => prev.filter((r) => r.id !== id));
      const { error } = await supabase.from("chi_tiet").delete().eq("id", id);
      if (error) {
        alert("Lỗi xoá dữ liệu: " + error.message);
        fetchRecords(true);
      }
    }
  };

  const handleEdit = (item: any) => {
    setEditingRowId(item.id);
    setEditRowData({ ...item });
  };

  const handleSaveRow = async () => {
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
        khach_hang: editRowData.khach_hang,
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
      fetchRecords(true);
    } else {
      fetchRecords(true);
    }
  };

  const handleSortToggle = (key: SortKey) => {
    setSortConfig((prev) => {
      let nextDir: SortDir = "asc";
      if (prev[key] === "asc") nextDir = "desc";
      else if (prev[key] === "desc") nextDir = null;

      // If turning off sort and it is primary, primary shifts to the other (if active)
      let nextPrimary = key as SortKey | null;
      if (nextDir === null) {
        const otherKey = key === "khach_hang" ? "ngay" : "khach_hang";
        nextPrimary = prev[otherKey] ? otherKey : null;
      }

      return {
        ...prev,
        [key]: nextDir,
        primary: nextPrimary,
      };
    });
  };

  const SortIcon = ({ sortKey }: { sortKey: SortKey }) => {
    const dir = sortConfig[sortKey];
    if (dir === "asc")
      return (
        <span className="text-primary font-bold" style={{ fontSize: "10px" }}>
          ▲
        </span>
      );
    if (dir === "desc")
      return (
        <span className="text-primary font-bold" style={{ fontSize: "10px" }}>
          ▼
        </span>
      );
    return <ArrowUpDown size={14} className="text-muted opacity-50" />;
  };

  const handleExport = async (type: string) => {
    const element = document.getElementById("all-records-table");
    if (!element) return;

    const fileName = `TatCaDon_${new Date().toISOString().split("T")[0]}`;

    try {
      if (type === "image") {
        const dataUrl = await toPng(element, {
          backgroundColor: "#111",
          filter: (node: HTMLElement) => !node.classList?.contains("export-exclude"),
        });
        const link = document.createElement("a");
        link.download = `${fileName}.png`;
        link.href = dataUrl;
        link.click();
      } else if (type === "copy") {
        if (!navigator.clipboard || !window.ClipboardItem) {
          alert("Trình duyệt không hỗ trợ sao chép.");
          return;
        }
        const copyPromise = toBlob(element, {
          backgroundColor: "#111",
          filter: (node: HTMLElement) => !node.classList?.contains("export-exclude"),
        }).then((blob) => {
          if (!blob) throw new Error("Thất bại");
          return blob;
        });
        await navigator.clipboard.write([
          new ClipboardItem({ "image/png": copyPromise }),
        ]);
        alert("Đã sao chép!");
      } else if (type === "xlsx") {
        const data = processedRecords.map((item) => ({
          "Khách hàng": item.khach_hang,
          "Ngày": item.ngay,
          "Sản phẩm": item.san_pham,
          "ĐVT": item.dvt,
          "Số lượng": item.so_luong,
          "Đơn giá": item.don_gia,
          "Thành tiền": item.thanh_tien,
          "Trạng thái": item.id_thanh_toan ? "Đã TT" : "Chưa TT",
          "Ghi chú": item.ghi_chu || "",
        }));
        const ws = XLSX.utils.json_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "TatCaDon");
        XLSX.writeFile(wb, `${fileName}.xlsx`);
      } else if (type === "csv") {
        const headers =
          "Khách hàng,Ngày,Sản phẩm,ĐVT,Số lượng,Đơn giá,Thành tiền,Trạng thái,Ghi chú\n";
        const rows = processedRecords
          .map(
            (item) =>
              `${item.khach_hang},${item.ngay},${item.san_pham},${item.dvt},${item.so_luong},${item.don_gia},${item.thanh_tien},${item.id_thanh_toan ? "Đã TT" : "Chưa TT"},"${item.ghi_chu || ""}"`,
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
      console.error(err);
      alert("Lỗi xuất dữ liệu");
    }
    setOpenExport(false);
  };

  const processedRecords = useMemo(() => {
    // 1. Filter
    let filtered = records;
    if (search.trim()) {
      const lowerSearch = search.toLowerCase();
      filtered = filtered.filter(
        (r) =>
          (r.khach_hang || "").toLowerCase().includes(lowerSearch) ||
          (r.san_pham || "").toLowerCase().includes(lowerSearch) ||
          (r.ghi_chu || "").toLowerCase().includes(lowerSearch),
      );
    }

    // 2. Sort
    return [...filtered].sort((a, b) => {
      const primaryKey = sortConfig.primary;
      const secondaryKey = primaryKey === "khach_hang" ? "ngay" : "khach_hang";

      const compare = (key: SortKey, dir: "asc" | "desc") => {
        if (key === "khach_hang") {
          const cmp = (a.khach_hang || "").localeCompare(
            b.khach_hang || "",
            "vi",
          );
          return dir === "asc" ? cmp : -cmp;
        } else {
          const timeA = new Date(a.ngay || 0).getTime();
          const timeB = new Date(b.ngay || 0).getTime();
          const cmp = timeA - timeB;
          return dir === "asc" ? cmp : -cmp;
        }
      };

      if (primaryKey && sortConfig[primaryKey]) {
        const cmp = compare(
          primaryKey,
          sortConfig[primaryKey] as "asc" | "desc",
        );
        if (cmp !== 0) return cmp;
      }

      if (secondaryKey && sortConfig[secondaryKey]) {
        const cmp = compare(
          secondaryKey,
          sortConfig[secondaryKey] as "asc" | "desc",
        );
        if (cmp !== 0) return cmp;
      }

      // Fallback to creation date desc
      return (
        new Date(b.created_at || 0).getTime() -
        new Date(a.created_at || 0).getTime()
      );
    });
  }, [records, search, sortConfig]);

  const inputStyle = {
    width: "100%",
    backgroundColor: "rgba(0,0,0,0.3)",
    border: "1px solid var(--primary)",
    borderRadius: "4px",
    padding: "4px 8px",
    color: "var(--text-main)",
    fontSize: "13px",
    outline: "none",
  };

  return (
    <div className="layout-tat-ca-don" style={{ paddingBottom: "32px" }}>
      <div className="flex items-center justify-between mb-5">
        <h2 style={{ fontSize: "20px", fontWeight: "bold" }}>Tat ca don</h2>
        <div className="relative">
          <button
            onClick={() => setOpenExport(!openExport)}
            className="btn bg-white/5 border border-border px-4 py-2 text-[14px] flex items-center gap-2 hover:bg-white/10"
          >
            <Share2 size={16} /> Export
          </button>
          {openExport && (
            <div className="absolute top-full right-0 mt-2 w-[160px] bg-card border border-border rounded-lg shadow-xl z-20 py-1 animate-in fade-in slide-in-from-top-2 duration-200">
              <button
                onClick={() => handleExport("image")}
                className="w-full text-left px-4 py-2 text-[14px] hover:bg-primary/10 flex items-center gap-2"
              >
                <ImageIcon size={14} className="text-primary" /> Image
              </button>
              <button
                onClick={() => handleExport("copy")}
                className="w-full text-left px-4 py-2 text-[14px] hover:bg-primary/10 flex items-center gap-2"
              >
                <CopyIcon size={14} className="text-primary" /> Copy
              </button>
              <button
                onClick={() => handleExport("xlsx")}
                className="w-full text-left px-4 py-2 text-[14px] hover:bg-primary/10 flex items-center gap-2"
              >
                <FileSpreadsheet size={14} className="text-primary" /> Excel
              </button>
              <button
                onClick={() => handleExport("csv")}
                className="w-full text-left px-4 py-2 text-[14px] hover:bg-primary/10 flex items-center gap-2"
              >
                <FileCode size={14} className="text-primary" /> CSV
              </button>
            </div>
          )}
        </div>
      </div>

      <div
        style={{
          position: "relative",
          marginBottom: "16px",
          maxWidth: "400px",
        }}
      >
        <Search
          size={18}
          style={{
            position: "absolute",
            left: "12px",
            top: "50%",
            transform: "translateY(-50%)",
            color: "var(--text-muted)",
          }}
        />
        <input
          type="text"
          placeholder="Tìm khách hàng, sản phẩm, ghi chú..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            width: "100%",
            backgroundColor: "var(--card-bg)",
            border: "1px solid var(--border)",
            borderRadius: "var(--radius-full)",
            padding: "12px 12px 12px 40px",
            color: "var(--text-main)",
            fontSize: "15px",
          }}
        />
      </div>

      <div
        id="all-records-table"
        className="card"
        style={{ padding: 0, overflowX: "auto" }}
      >
        {isLoadingData ? (
          <div className="flex justify-center p-8">
            <Loader2
              className="animate-spin text-primary"
              size={32}
              style={{ animation: "spin 1s linear infinite" }}
            />
            <style>{`@keyframes spin { 100% { transform: rotate(360deg); } }`}</style>
          </div>
        ) : processedRecords.length === 0 ? (
          <div className="text-center text-muted p-8">Không có dữ liệu</div>
        ) : (
          <table
            style={{
              width: "100%",
              fontSize: "13px",
              textAlign: "left",
              borderCollapse: "collapse",
              minWidth: "800px",
            }}
          >
            <thead>
              <tr
                className="text-muted"
                style={{
                  borderBottom: "1px solid var(--border)",
                  backgroundColor: "rgba(255,255,255,0.02)",
                }}
              >
                <th
                  style={{
                    padding: "12px",
                    whiteSpace: "nowrap",
                    cursor: "pointer",
                    userSelect: "none",
                  }}
                  onClick={() => handleSortToggle("khach_hang")}
                  className="hover:text-primary transition-colors"
                >
                  <div className="flex items-center gap-1">
                    Khách hàng <SortIcon sortKey="khach_hang" />
                  </div>
                </th>
                <th
                  style={{
                    padding: "12px",
                    whiteSpace: "nowrap",
                    cursor: "pointer",
                    userSelect: "none",
                  }}
                  onClick={() => handleSortToggle("ngay")}
                  className="hover:text-primary transition-colors"
                >
                  <div className="flex items-center gap-1">
                    Ngày <SortIcon sortKey="ngay" />
                  </div>
                </th>
                <th style={{ padding: "12px", whiteSpace: "nowrap" }}>
                  Sản phẩm
                </th>
                <th style={{ padding: "12px", whiteSpace: "nowrap" }}>ĐVT</th>
                <th
                  style={{
                    padding: "12px",
                    whiteSpace: "nowrap",
                    textAlign: "right",
                  }}
                >
                  SL
                </th>
                <th
                  style={{
                    padding: "12px",
                    whiteSpace: "nowrap",
                    textAlign: "right",
                  }}
                >
                  Đơn giá
                </th>
                <th
                  style={{
                    padding: "12px",
                    whiteSpace: "nowrap",
                    textAlign: "right",
                  }}
                >
                  Thành tiền
                </th>
                <th
                  style={{
                    padding: "12px",
                    whiteSpace: "nowrap",
                    textAlign: "center",
                  }}
                >
                  Trạng thái
                </th>
                <th style={{ padding: "12px", whiteSpace: "nowrap" }}>
                  Ghi chú
                </th>
                <th
                  style={{
                    padding: "12px",
                    whiteSpace: "nowrap",
                    textAlign: "center",
                  }}
                >
                  Thao tác
                </th>
              </tr>
            </thead>
            <tbody>
              {processedRecords.map((item) => {
                if (editingRowId === item.id) {
                  return (
                    <tr
                      key={`edit-${item.id}`}
                      style={{
                        borderBottom: "1px solid rgba(255,255,255,0.05)",
                      }}
                      className="bg-white/5"
                    >
                      <td style={{ padding: "8px 4px" }}>
                        <input
                          type="text"
                          value={editRowData.khach_hang}
                          onChange={(e) =>
                            setEditRowData({
                              ...editRowData,
                              khach_hang: e.target.value,
                            })
                          }
                          style={inputStyle}
                        />
                      </td>
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
                          style={{ ...inputStyle, width: "120px" }}
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
                          style={inputStyle}
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
                          style={{ ...inputStyle, width: "60px" }}
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
                          style={{ ...inputStyle, width: "60px" }}
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
                          style={{ ...inputStyle, width: "90px" }}
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
                      <td style={{ padding: "12px 8px", textAlign: "center" }}>
                        {item.id_thanh_toan ? (
                          <span style={{ color: "var(--success)" }}>Đã TT</span>
                        ) : (
                          <span style={{ color: "var(--danger)" }}>
                            Chưa TT
                          </span>
                        )}
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
                          style={inputStyle}
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
                            onClick={() => setEditingRowId(null)}
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

                const dateObj = new Date(item.ngay);
                const dateStr = `${dateObj.getDate().toString().padStart(2, "0")}/${(dateObj.getMonth() + 1).toString().padStart(2, "0")}/${dateObj.getFullYear()}`;

                return (
                  <tr
                    key={item.id}
                    style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}
                    className="hover:bg-white/5"
                  >
                    <td style={{ padding: "12px 12px", fontWeight: "bold" }}>
                      {item.khach_hang}
                    </td>
                    <td style={{ padding: "12px 12px", whiteSpace: "nowrap" }}>
                      {dateStr}
                    </td>
                    <td style={{ padding: "12px 12px" }}>{item.san_pham}</td>
                    <td style={{ padding: "12px 12px", whiteSpace: "nowrap" }}>
                      {item.dvt}
                    </td>
                    <td style={{ padding: "12px 12px", textAlign: "right" }}>
                      {item.so_luong}
                    </td>
                    <td style={{ padding: "12px 12px", textAlign: "right" }}>
                      {Number(item.don_gia).toLocaleString()}
                    </td>
                    <td
                      style={{
                        padding: "12px 12px",
                        textAlign: "right",
                        fontWeight: "bold",
                      }}
                      className="text-primary"
                    >
                      {Number(item.thanh_tien).toLocaleString()} ₫
                    </td>
                    <td
                      style={{
                        padding: "12px 12px",
                        textAlign: "center",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {item.id_thanh_toan ? (
                        <span
                          style={{
                            backgroundColor: "rgba(16, 185, 129, 0.2)",
                            color: "var(--success)",
                            padding: "4px 8px",
                            borderRadius: "4px",
                            fontSize: "11px",
                            fontWeight: "bold",
                          }}
                        >
                          Đã TT
                        </span>
                      ) : (
                        <span
                          style={{
                            backgroundColor: "rgba(239, 68, 68, 0.2)",
                            color: "var(--danger)",
                            padding: "4px 8px",
                            borderRadius: "4px",
                            fontSize: "11px",
                            fontWeight: "bold",
                          }}
                        >
                          Chưa TT
                        </span>
                      )}
                    </td>
                    <td
                      style={{
                        padding: "12px 12px",
                        maxWidth: "150px",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                      title={item.ghi_chu}
                    >
                      {item.ghi_chu}
                    </td>
                    <td style={{ padding: "12px 12px" }}>
                      <div className="flex justify-center gap-3 export-exclude">
                        <button
                          onClick={() => handleEdit(item)}
                          className="text-muted hover:text-primary transition-colors"
                          title="Sửa"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(item.id)}
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
        )}
      </div>
    </div>
  );
};
