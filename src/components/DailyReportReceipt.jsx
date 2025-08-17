import React, { useEffect } from 'react';
import { formatCurrency, generateDailyReportPDF } from '../lib/helpers.js'; // Pastikan path ini benar

const DailyReportReceipt = ({ reportData, date, onClose }) => {
  // Fungsi untuk memicu pembuatan dan pencetakan PDF
  const handlePrint = () => {
    generateDailyReportPDF(reportData, date);
  };

  // Efek untuk menambahkan listener keyboard (tutup modal dengan tombol 'Escape')
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    // Cleanup function: hapus listener saat komponen di-unmount
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  // Jika tidak ada data laporan, jangan render apapun untuk mencegah error
  if (!reportData) {
    return null;
  }

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg shadow-xl p-4 sm:p-6 w-full max-w-sm">
           {/* Konten ini hanya untuk pratinjau di layar, PDF akan digenerate secara terpisah */}
          <div className="w-72 mx-auto bg-white p-2 font-mono text-xs text-black">
            <div className="text-center">
              <h2 className="font-bold">KOPDES MERAH PUTIH</h2>
              <h3 className="font-bold">PENFUI TIMUR</h3>
              <p>Jln. Matani Raya</p>
            </div>
            <div className="border-t border-b border-dashed border-black my-1 py-1 text-center">
                <h4 className="font-bold">LAPORAN HARIAN</h4>
                <p>{date.toLocaleDateString('id-ID', { dateStyle: 'long' })}</p>
            </div>
            <div className="space-y-1">
                <div className="flex justify-between"><span>Omzet</span> <span className="font-semibold">{formatCurrency(reportData.totalRevenue)}</span></div>
                <div className="flex justify-between"><span>HPP</span> <span className="font-semibold">{formatCurrency(reportData.totalHPP)}</span></div>
                <div className="flex justify-between font-bold border-t border-dashed border-black pt-1"><span>Laba Kotor</span> <span>{formatCurrency(reportData.totalGrossProfit)}</span></div>
            </div>
            <div className="border-t border-dashed border-black mt-2 pt-1">
                {/* PERBAIKAN: Tag penutup </p> yang salah telah diperbaiki */}
                <p className="font-bold mb-1">Rincian:</p> 
                <div className="flex justify-between"><span>Tunai</span> <span>{formatCurrency(reportData.cashRevenue)}</span></div>
                <div className="flex justify-between"><span>Non-Tunai</span> <span>{formatCurrency(reportData.nonCashRevenue)}</span></div>
            </div>
          </div>
          <div className="flex justify-center space-x-4 mt-6">
            <button onClick={onClose} className="px-6 py-2 bg-slate-200 rounded-md hover:bg-slate-300">Tutup</button>
            <button onClick={handlePrint} className="px-6 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600">Cetak</button>
          </div>
        </div>
      </div>
    </>
  );
};

export default DailyReportReceipt;