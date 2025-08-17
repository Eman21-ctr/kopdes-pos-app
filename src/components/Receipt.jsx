import React, { useEffect } from 'react';
import { formatCurrency, formatDate, generateReceiptPDF } from '../lib/helpers.js';

const ReceiptModal = ({ transaction, onClose }) => {
  const handlePrint = () => {
    generateReceiptPDF(transaction);
  };

  // Tutup modal dengan tombol Escape
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  if (!transaction) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg shadow-xl p-4 sm:p-6 w-full max-w-sm">
          <div className="w-72 mx-auto bg-white p-2 font-mono text-xs text-black">
            <div className="text-center">
              <h2 className="font-bold">KOPDES MERAH PUTIH</h2>
              <h3 className="font-bold">PENFUI TIMUR</h3>
              <p>Jln. Matani Raya</p>
            </div>
            <p className="border-t border-b border-dashed border-black my-1 py-0.5">
              {formatDate(transaction.date)}<br/>
              No: {transaction.id.substring(0, 8)}<br/>
              Kasir: {transaction.cashierName}
            </p>
            <div>
              {transaction.items.map(item => (
                <div key={item.id} className="grid grid-cols-12 gap-1">
                  <div className="col-span-12">{item.name}</div>
                  <div className="col-span-2 text-left">{item.quantity}x</div>
                  <div className="col-span-5 text-right">{formatCurrency(item.sellPrice)}</div>
                  <div className="col-span-5 text-right font-semibold">{formatCurrency(item.sellPrice * item.quantity)}</div>
                </div>
              ))}
            </div>
            <div className="border-t border-dashed border-black mt-1 pt-1">
                <div className="flex justify-between"><span>Total</span> <span className="font-bold">{formatCurrency(transaction.total)}</span></div>
                <div className="flex justify-between"><span>{transaction.paymentMethod}</span> <span>{formatCurrency(transaction.amountPaid || transaction.total)}</span></div>
                <div className="flex justify-between"><span>Kembali</span> <span>{formatCurrency(transaction.change || 0)}</span></div>
            </div>
             <div className="text-center border-t border-dashed border-black mt-2 pt-1">
                <p>Terima kasih telah berbelanja!</p>
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

export default ReceiptModal;