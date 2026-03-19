import React, { useState, useEffect } from 'react';
import { ChevronDown, ChevronRight, CheckCircle, Search, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

export const DaThanhToan: React.FC = () => {
  const { user } = useAuth();
  const [expandedBatches, setExpandedBatches] = useState<Record<string, boolean>>({});
  const [records, setRecords] = useState<any[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [search, setSearch] = useState('');

  const fetchRecords = async (silent = false) => {
    if (!user) return;
    if (!silent) setIsLoadingData(true);
    const { data, error } = await supabase
      .from('chi_tiet')
      .select('*')
      .not('id_thanh_toan', 'is', null)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
      
    if (!error && data) {
      setRecords(data);
      // Auto expand the most recent batch of the first customer
      if (data.length > 0) {
        setExpandedBatches({ [data[0].id_thanh_toan]: true });
      }
    }
    if (!silent) setIsLoadingData(false);
  };

  useEffect(() => {
    if (user?.id) {
      fetchRecords();
    }
  }, [user?.id]);

  const toggleBatch = (batchId: string) => {
    setExpandedBatches(prev => ({ ...prev, [batchId]: !prev[batchId] }));
  };

  // Group records by customer, then by payment batch (id_thanh_toan)
  const groupedData = records.reduce((acc, curr) => {
    if (!acc[curr.khach_hang]) acc[curr.khach_hang] = {};
    if (!acc[curr.khach_hang][curr.id_thanh_toan]) acc[curr.khach_hang][curr.id_thanh_toan] = [];
    acc[curr.khach_hang][curr.id_thanh_toan].push(curr);
    return acc;
  }, {} as Record<string, Record<string, any[]>>);

  // Filter customers by search
  const filteredCustomers = Object.keys(groupedData).filter(kh => 
    kh.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="layout-da-thanh-toan pb-8">
      <h2 className="text-[20px] font-bold mb-5">Đã thanh toán</h2>

      <div className="relative mb-6 max-w-[400px]">
        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
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
        filteredCustomers.map(khach_hang => (
          <div key={khach_hang} className="mb-8">
            {/* Customer Header */}
            <div className="flex items-center gap-2 mb-3 px-1">
              <CheckCircle size={20} className="text-success" />
              <h3 className="font-bold text-[16px]">{khach_hang}</h3>
            </div>

            {/* Payment Batches for this Customer */}
            {Object.keys(groupedData[khach_hang]).map(batchId => {
              const batchItems = groupedData[khach_hang][batchId];
              const batchTotal = batchItems.reduce((sum: number, item: any) => sum + (Number(item.thanh_tien) || 0), 0);
              
              // Extract date from batchId if format is "id_DDMMYYYY"
              let batchDateStr = batchId;
              if (batchId.startsWith('id_') && batchId.length === 11) {
                const d = batchId.substring(3, 5);
                const m = batchId.substring(5, 7);
                const y = batchId.substring(7, 11);
                batchDateStr = `${d}/${m}/${y}`;
              }

              return (
                <div key={batchId} className="card mb-4 p-0 overflow-hidden">
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
                       <span className="font-bold text-success">{batchTotal.toLocaleString()} ₫</span>
                      {expandedBatches[batchId] ? <ChevronDown size={20} className="text-muted" /> : <ChevronRight size={20} className="text-muted" />}
                    </div>
                  </div>

                  {expandedBatches[batchId] && (
                    <div className="border-t border-border p-4">
                      {/* Mobile View */}
                      <div className="md:hidden flex flex-col mb-4">
                        {batchItems.map((item: any) => {
                          const dateObj = new Date(item.ngay);
                          const dateStr = `${dateObj.getDate().toString().padStart(2, '0')}/${(dateObj.getMonth() + 1).toString().padStart(2, '0')}`;
                          
                          return (
                            <div key={`mob-${item.id}`} className="p-3 border-b border-white/5 relative hover:bg-white/5">
                              <div className="flex justify-between items-start mb-1">
                                <div className="font-semibold text-[14px] flex items-center gap-2">
                                  <span className="text-muted">[{dateStr}]</span>
                                  <span>{item.san_pham}</span>
                                </div>
                              </div>
                              <div className="text-[13px] mb-1 text-main">
                                {item.so_luong} {item.dvt} x {Number(item.don_gia).toLocaleString()} ={" "}
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
                              <th className="pb-2 whitespace-nowrap">Ngày mua</th>
                              <th className="pb-2 whitespace-nowrap">Sản phẩm</th>
                              <th className="pb-2 whitespace-nowrap text-right">SL</th>
                              <th className="pb-2 whitespace-nowrap text-right">Đơn giá</th>
                              <th className="pb-2 whitespace-nowrap text-right">Thành tiền</th>
                            </tr>
                          </thead>
                          <tbody>
                            {batchItems.map((item: any) => {
                              const dateObj = new Date(item.ngay);
                              const dateStr = `${dateObj.getDate().toString().padStart(2, '0')}/${(dateObj.getMonth() + 1).toString().padStart(2, '0')}`;
                              
                              return (
                                <tr key={`desk-${item.id}`} className="hover:bg-white/5 border-b border-white/5">
                                  <td className="py-3 px-0">{dateStr}</td>
                                  <td className="py-3 px-0">{item.san_pham}</td>
                                  <td className="py-3 px-0 text-right">{item.so_luong} {item.dvt}</td>
                                  <td className="py-3 px-0 text-right">{Number(item.don_gia).toLocaleString()}</td>
                                  <td className="py-3 px-0 text-right font-medium text-success">{Number(item.thanh_tien).toLocaleString()} ₫</td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                      
                      <div className="flex justify-between items-center pt-2 text-[14px]">
                        <span className="text-muted font-bold">Tổng đợt thanh toán:</span>
                        <span className="font-bold text-success">{batchTotal.toLocaleString()} ₫</span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ))
      )}
    </div>
  );
};
