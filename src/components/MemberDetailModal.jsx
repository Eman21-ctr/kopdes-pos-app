import React, { useMemo } from 'react';
import { formatCurrency, formatDate } from '../lib/helpers.js';

const MemberDetailModal = ({ member, transactions, onClose }) => {
    if (!member) return null;

    // Filter transaksi khusus untuk member ini
    const memberTransactions = useMemo(() => {
        return transactions
            .filter(t => t.customerName === member.name)
            .sort((a, b) => new Date(b.date) - new Date(a.date));
    }, [transactions, member.name]);

    const averageShopping = member.totalTransactions > 0
        ? member.totalAmount / member.totalTransactions
        : 0;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="flex justify-between items-center border-b p-6">
                    <div>
                        <h3 className="text-xl font-bold text-slate-800">Detail Anggota</h3>
                        <p className="text-sm text-slate-500">ID: {member.id}</p>
                    </div>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-2xl font-semibold">&times;</button>
                </div>

                <div className="flex-grow overflow-y-auto p-6">
                    {/* Ringkasan Statistik */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
                        <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                            <span className="text-xs font-bold text-blue-600 uppercase tracking-wider block mb-1">Total Belanja</span>
                            <span className="text-lg font-bold text-blue-900">{formatCurrency(member.totalAmount)}</span>
                        </div>
                        <div className="bg-purple-50 p-4 rounded-lg border border-purple-100">
                            <span className="text-xs font-bold text-purple-600 uppercase tracking-wider block mb-1">Frekuensi</span>
                            <span className="text-lg font-bold text-purple-900">{member.totalTransactions}x</span>
                        </div>
                        <div className="bg-emerald-50 p-4 rounded-lg border border-emerald-100">
                            <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider block mb-1">Rata-rata</span>
                            <span className="text-lg font-bold text-emerald-900">{formatCurrency(averageShopping)}</span>
                        </div>
                    </div>

                    {/* Riwayat Transaksi */}
                    <h4 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                        Riwayat Transaksi
                        <span className="px-2 py-0.5 bg-slate-100 text-slate-600 text-xs rounded-full font-medium">
                            {memberTransactions.length}
                        </span>
                    </h4>

                    <div className="border rounded-lg overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="min-w-full text-sm">
                                <thead className="bg-slate-50 border-b">
                                    <tr>
                                        <th className="px-4 py-3 text-left font-medium text-slate-600">Tanggal</th>
                                        <th className="px-4 py-3 text-left font-medium text-slate-600">ID Transaksi</th>
                                        <th className="px-4 py-3 text-right font-medium text-slate-600">Total</th>
                                        <th className="px-4 py-3 text-center font-medium text-slate-600">Metode</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {memberTransactions.length === 0 ? (
                                        <tr>
                                            <td colSpan="4" className="px-4 py-8 text-center text-slate-400">Belum ada riwayat transaksi.</td>
                                        </tr>
                                    ) : (
                                        memberTransactions.map((t) => (
                                            <tr key={t.id} className="hover:bg-slate-50 transition-colors">
                                                <td className="px-4 py-3 text-slate-600">{formatDate(t.date).split(' ')[0]}</td>
                                                <td className="px-4 py-3 font-mono text-xs text-slate-500">{t.id.substring(0, 8)}...</td>
                                                <td className="px-4 py-3 text-right font-semibold text-slate-800">{formatCurrency(t.total)}</td>
                                                <td className="px-4 py-3 text-center">
                                                    <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${t.paymentMethod === 'Tunai'
                                                            ? 'bg-blue-100 text-blue-700'
                                                            : 'bg-purple-100 text-purple-700'
                                                        }`}>
                                                        {t.paymentMethod}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="border-t p-6 bg-slate-50 rounded-b-lg flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-6 py-2 bg-slate-800 text-white rounded-md hover:bg-slate-700 transition-colors font-medium shadow-sm"
                    >
                        Tutup
                    </button>
                </div>
            </div>
        </div>
    );
};

export default MemberDetailModal;
