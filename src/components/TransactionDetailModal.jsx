import React from 'react';
import { formatCurrency, formatDate } from '../lib/helpers.js';

const TransactionDetailModal = ({ transaction, onClose }) => {
    if (!transaction) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-lg">
                <div className="flex justify-between items-center border-b pb-3 mb-4">
                    <h3 className="text-xl font-bold text-slate-800">Detail Transaksi</h3>
                    <button onClick={onClose} className="text-slate-500 hover:text-slate-800">&times;</button>
                </div>

                {/* Info Header Transaksi */}
                <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm mb-4">
                    <div><strong>No. Transaksi:</strong> <span className="font-mono text-xs">{transaction.id}</span></div>
                    <div><strong>Tanggal:</strong> {formatDate(transaction.date)}</div>
                    <div><strong>Kasir:</strong> {transaction.cashierName}</div>
                    <div><strong>Pelanggan:</strong> {transaction.customerName || 'Pelanggan Umum'}</div>
                </div>

                {/* Tabel Rincian Barang */}
                <div className="max-h-64 overflow-y-auto border rounded-lg">
                    <table className="min-w-full text-sm">
                        <thead className="bg-slate-50">
                            <tr>
                                <th className="px-4 py-2 text-left font-medium">Nama Barang</th>
                                <th className="px-4 py-2 text-center font-medium">Jumlah</th>
                                <th className="px-4 py-2 text-right font-medium">Harga Satuan</th>
                                <th className="px-4 py-2 text-right font-medium">Subtotal</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {transaction.items.map((item) => (
                                <tr key={item.id}>
                                    <td className="px-4 py-2">{item.name}</td>
                                    <td className="px-4 py-2 text-center">{item.quantity}</td>
                                    <td className="px-4 py-2 text-right">{formatCurrency(item.sellPrice)}</td>
                                    <td className="px-4 py-2 text-right font-semibold">{formatCurrency(item.quantity * item.sellPrice)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                
                {/* Info Total Pembayaran */}
                <div className="mt-4 pt-4 border-t space-y-2">
                    <div className="flex justify-between font-semibold"><span className="text-slate-600">Total Belanja:</span><span>{formatCurrency(transaction.total)}</span></div>
                    <div className="flex justify-between"><span className="text-slate-600">Metode Bayar:</span><span>{transaction.paymentMethod}</span></div>
                    {transaction.paymentMethod === 'Tunai' && (
                         <div className="flex justify-between"><span className="text-slate-600">Uang Dibayar:</span><span>{formatCurrency(transaction.amountPaid)}</span></div>
                    )}
                    {transaction.paymentMethod === 'Tunai' && (
                         <div className="flex justify-between"><span className="text-slate-600">Kembalian:</span><span>{formatCurrency(transaction.change)}</span></div>
                    )}
                </div>

                <div className="flex justify-end mt-6">
                    <button onClick={onClose} className="px-6 py-2 bg-slate-200 rounded-md hover:bg-slate-300">Tutup</button>
                </div>
            </div>
        </div>
    );
};

export default TransactionDetailModal;