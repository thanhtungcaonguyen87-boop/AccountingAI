import React, { useState, useEffect } from 'react';
import { Loader2, Check, Save, X } from 'lucide-react';

interface ParsedData {
  id?: string;
  khach_hang: string;
  san_pham: string;
  dvt: string;
  so_luong: number;
  don_gia: number;
  thanh_tien: number;
  ghi_chu?: string;
  ngay: string;
}

interface AIPreviewProps {
  isLoading: boolean;
  data: ParsedData | null;
  rawInput: string;
  onUpdate: (updatedData: ParsedData) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onClose: () => void;
}

export const AIPreview: React.FC<AIPreviewProps> = ({ isLoading, data, rawInput, onUpdate, onDelete, onClose }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<ParsedData | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (data) {
      setEditData(data);
      setIsEditing(false);
    }
  }, [data]);

  if (!isLoading && !data) return null;

  if (isLoading) {
    return (
      <div className="card mb-4 text-center py-8 px-4">
        <Loader2 size={32} className="text-primary animate-spin mx-auto mb-4" />
        <h3 className="font-semibold mb-2">AI đang phân tích & lưu...</h3>
        <div className="flex flex-col gap-2 mt-4">
          <div className="h-3 bg-border rounded w-4/5 mx-auto opacity-50"></div>
          <div className="h-3 bg-border rounded w-[60%] mx-auto opacity-50"></div>
        </div>
      </div>
    );
  }

  const handleSave = async () => {
    if (!editData) return;
    setIsSaving(true);
    try {
      // Recalculate total
      const updatedData = {
        ...editData,
        thanh_tien: editData.so_luong * editData.don_gia
      };
      await onUpdate(updatedData);
      setIsEditing(false);
    } catch (error) {
      alert('Lỗi cập nhật: ' + (error as Error).message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setEditData(data);
    setIsEditing(false);
  };

  const handleDelete = async () => {
    if (!data?.id) {
      onClose();
      return;
    }
    setIsDeleting(true);
    try {
      await onDelete(data.id);
      onClose();
    } catch (error) {
      alert('Lỗi khi hủy: ' + (error as Error).message);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleChange = (field: keyof ParsedData, value: string | number) => {
    if (!editData) return;
    setEditData({ ...editData, [field]: value });
  };

  const inputStyle = "w-full bg-black/20 border border-border rounded py-1 px-2 text-main text-[14px]";

  return (
    <div className="card mb-4">
      <h3 className="font-bold mb-4 flex items-center gap-2">
        <span className="text-success"><Check size={20} /></span>
        Đã phân tích & lưu tự động
      </h3>
      
      <div className="grid grid-cols-[1fr_2fr] gap-2 mb-4 text-[14px] items-center">
        <div className="text-muted">Khách hàng:</div>
        {isEditing ? (
          <input className={inputStyle} value={editData?.khach_hang || ''} onChange={e => handleChange('khach_hang', e.target.value)} />
        ) : (
          <div className="font-semibold">{data?.khach_hang}</div>
        )}
        
        <div className="text-muted">Sản phẩm:</div>
        {isEditing ? (
          <input className={inputStyle} value={editData?.san_pham || ''} onChange={e => handleChange('san_pham', e.target.value)} />
        ) : (
          <div>{data?.san_pham}</div>
        )}
        
        <div className="text-muted">ĐVT:</div>
        {isEditing ? (
          <input className={inputStyle} value={editData?.dvt || ''} onChange={e => handleChange('dvt', e.target.value)} />
        ) : (
          <div>{data?.dvt}</div>
        )}
        
        <div className="text-muted">Số lượng:</div>
        {isEditing ? (
          <input type="number" className={inputStyle} value={editData?.so_luong || 0} onChange={e => handleChange('so_luong', Number(e.target.value))} />
        ) : (
          <div>{data?.so_luong}</div>
        )}
        
        <div className="text-muted">Đơn giá:</div>
        {isEditing ? (
          <input type="number" className={inputStyle} value={editData?.don_gia || 0} onChange={e => handleChange('don_gia', Number(e.target.value))} />
        ) : (
          <div>{data?.don_gia.toLocaleString()} ₫</div>
        )}
        
        <div className="text-muted">Thành tiền:</div>
        {isEditing ? (
          <div className="font-bold text-primary">{(editData ? (editData.so_luong * editData.don_gia).toLocaleString() : 0)} ₫</div>
        ) : (
          <div className="font-bold text-primary">{data?.thanh_tien.toLocaleString()} ₫</div>
        )}

        <div className="text-muted">Ghi chú:</div>
        {isEditing ? (
          <input className={inputStyle} value={editData?.ghi_chu || ''} onChange={e => handleChange('ghi_chu', e.target.value)} />
        ) : (
          <div>{data?.ghi_chu || '-'}</div>
        )}
        
        <div className="text-muted">Ngày:</div>
        {isEditing ? (
          <input type="date" className={inputStyle} value={editData?.ngay.split('/').reverse().join('-') || ''} onChange={e => {
            const dateStr = e.target.value;
            if (dateStr) {
               const [y, m, d] = dateStr.split('-');
               handleChange('ngay', `${d}/${m}/${y}`);
            }
          }} />
        ) : (
          <div>{data?.ngay}</div>
        )}
      </div>

      <div className="p-3 bg-black/20 rounded-sm mb-4 text-[13px]">
        <span className="text-muted">Nhập liệu:</span> {rawInput}
      </div>

      <div className="flex gap-4">
        {isEditing ? (
          <>
            <button className="btn btn-outline flex-1" onClick={handleCancel} disabled={isSaving}>
               <X size={16} /> Huỷ
            </button>
            <button className="btn btn-primary flex-1" onClick={handleSave} disabled={isSaving}>
              {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
              Lưu cập nhật
            </button>
          </>
        ) : (
          <>
            <button className="btn btn-outline flex-1 text-danger hover:bg-danger/10 hover:text-danger hover:border-danger/50 border-danger/30" onClick={handleDelete} disabled={isDeleting}>
              {isDeleting ? <Loader2 size={16} className="animate-spin inline mr-1" /> : <X size={16} className="inline mr-1" />}
              Hủy
            </button>
            <button className="btn btn-primary flex-1" onClick={() => setIsEditing(true)}>Chỉnh sửa</button>
          </>
        )}
      </div>
    </div>
  );
};
