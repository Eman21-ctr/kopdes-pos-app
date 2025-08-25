import React, { useState, useMemo } from 'react';
import { SavingType, LoanStatus } from '../lib/types.js';
import { formatDate, formatCurrency, exportTransactionsToCSV, exportMemberReportToCSV } from '../lib/helpers.js';
import { DownloadIcon } from './Icons.jsx';
import AddMemberModal from './AddMemberModal.jsx'; // Pastikan file ini ada

// --- TAB DAFTAR TRANSAKSI ---
const TransactionListTab = ({ transactions }) => {
    const [startDate, setStartDate] = useState(() => {
        const date = new Date();
        date.setHours(0, 0, 0, 0);
        return date;
    });
    const [endDate, setEndDate] = useState(() => {
        const date = new Date();
        date.setHours(23, 59, 59, 999);
        return date;
    });

    const filteredTransactions = useMemo(() => {
        return transactions.filter(t => new Date(t.date) >= startDate && new Date(t.date) <= endDate);
    }, [transactions, startDate, endDate]);

    return (
        <>
            <div className="bg-white p-4 rounded-lg shadow-sm mb-4">
                <div className="flex flex-col sm:flex-row items-center gap-4">
                    <div>
                        <label htmlFor="start-date" className="text-sm font-medium text-slate-600">Dari Tanggal</label>
                        <input type="date" id="start-date" value={startDate.toISOString().split('T')[0]} onChange={(e) => { const d = new Date(e.target.value); d.setHours(0,0,0,0); setStartDate(d); }} className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm"/>
                    </div>
                    <div>
                        <label htmlFor="end-date" className="text-sm font-medium text-slate-600">Sampai Tanggal</label>
                        <input type="date" id="end-date" value={endDate.toISOString().split('T')[0]} onChange={(e) => { const d = new Date(e.target.value); d.setHours(23,59,59,999); setEndDate(d); }} className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm"/>
                    </div>
                    <div className="self-end pb-1">
                        <button onClick={() => exportTransactionsToCSV(filteredTransactions, startDate, endDate)} disabled={filteredTransactions.length === 0} className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md text-sm hover:bg-green-700 disabled:bg-slate-300">
                            <DownloadIcon className="w-4 h-4" /> Download (.csv)
                        </button>
                    </div>
                </div>
            </div>

            {/* Container untuk daftar transaksi */}
            <div className="space-y-4 lg:space-y-0">
                {/* Header Tabel - HANYA MUNCUL DI DESKTOP (lg) */}
                <div className="hidden lg:grid grid-cols-6 gap-4 px-6 py-3 bg-slate-50 text-xs font-medium text-slate-700 uppercase rounded-t-lg">
                    <span>No. Transaksi</span><span>Tanggal & Waktu</span><span>Nama Kasir</span><span>Nama Pelanggan</span><span className="text-right">Total Belanja</span><span className="text-center">Metode Bayar</span>
                </div>
                {/* Daftar Transaksi */}
                {filteredTransactions.length > 0 ? (
                    filteredTransactions.map(t => (
                    <div key={t.id} className="bg-white p-4 rounded-lg shadow-sm lg:shadow-none lg:rounded-none lg:p-0 lg:grid lg:grid-cols-6 lg:gap-4 lg:items-center lg:border-b">
                        <div className="lg:hidden">
                            <div className="flex justify-between items-start mb-2"><div className="font-semibold text-slate-800">{formatCurrency(t.total)}</div><span className="text-xs font-medium px-2 py-1 bg-blue-100 text-blue-800 rounded-full">{t.paymentMethod}</span></div>
                            <div className="text-sm text-slate-600 space-y-1 border-t pt-2"><p><strong>ID:</strong> <span className="font-mono text-xs">{t.id.substring(0,8)}</span></p><p><strong>Pelanggan:</strong> {t.customerName || 'Pelanggan Umum'}</p><p><strong>Kasir:</strong> {t.cashierName}</p><p><strong>Waktu:</strong> {formatDate(t.date)}</p></div>
                        </div>
                        <div className="hidden lg:flex items-center px-6 py-4 font-mono text-xs text-slate-600">{t.id}</div><div className="hidden lg:flex items-center px-6 py-4 text-sm">{formatDate(t.date)}</div><div className="hidden lg:flex items-center px-6 py-4 text-sm">{t.cashierName}</div><div className="hidden lg:flex items-center px-6 py-4 text-sm">{t.customerName || 'Pelanggan Umum'}</div><div className="hidden lg:flex items-center justify-end px-6 py-4 font-semibold text-slate-800 text-sm">{formatCurrency(t.total)}</div><div className="hidden lg:flex items-center justify-center px-6 py-4 text-sm">{t.paymentMethod}</div>
                    </div>
                    ))
                ) : (<div className="text-center py-10 text-slate-500 bg-white rounded-lg shadow-sm">Tidak ada transaksi pada rentang tanggal ini.</div>)}
            </div>
        </>
    );
}

// --- TAB LAPORAN HARIAN ---
const DailyReportTab = ({ transactions, products, onShowDailyReport }) => {
    const [startDate, setStartDate] = useState(() => { const d = new Date(); d.setHours(0,0,0,0); return d; });
    const [endDate, setEndDate] = useState(() => { const d = new Date(); d.setHours(23,59,59,999); return d; });

    const reportData = useMemo(() => {
        const dailyTransactions = transactions.filter(t => new Date(t.date) >= startDate && new Date(t.date) <= endDate);
        const totalRevenue = dailyTransactions.reduce((sum, t) => sum + t.total, 0);
        const totalHPP = dailyTransactions.reduce((sum, t) => {
            const transactionCost = t.items.reduce((itemSum, item) => {
                const product = products.find(p => p.id === item.id);
                return itemSum + (product ? product.purchasePrice * item.quantity : 0);
            }, 0);
            return sum + transactionCost;
        }, 0);
        const totalGrossProfit = totalRevenue - totalHPP;
        const cashRevenue = dailyTransactions.filter(t => t.paymentMethod === 'Tunai').reduce((sum, t) => sum + t.total, 0);
        const nonCashRevenue = totalRevenue - cashRevenue;
        const hasTransactions = dailyTransactions.length > 0;
        return { totalRevenue, totalHPP, totalGrossProfit, cashRevenue, nonCashRevenue, hasTransactions };
    }, [startDate, endDate, transactions, products]);
    
    return (
        <div className="bg-white p-6 rounded-lg shadow-sm max-w-2xl">
            <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
                <div className="flex items-center gap-4 w-full sm:w-auto">
                    <div><label htmlFor="start-date-daily" className="text-sm font-medium text-slate-600">Dari Tanggal</label><input type="date" id="start-date-daily" value={startDate.toISOString().split('T')[0]} onChange={(e) => { const d = new Date(e.target.value); d.setHours(0,0,0,0); setStartDate(d); }} className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm"/></div>
                    <div><label htmlFor="end-date-daily" className="text-sm font-medium text-slate-600">Sampai Tanggal</label><input type="date" id="end-date-daily" value={endDate.toISOString().split('T')[0]} onChange={(e) => { const d = new Date(e.target.value); d.setHours(23,59,59,999); setEndDate(d); }} className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm"/></div>
                </div>
                <button onClick={() => onShowDailyReport(reportData, { start: startDate, end: endDate })} disabled={!reportData.hasTransactions} className="w-full sm:w-auto px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-slate-300">Cetak Laporan</button>
            </div>
            <h3 className="text-xl font-bold">Rekapitulasi Laporan</h3>
            <p className="text-sm text-slate-600 mb-4">{startDate.toLocaleDateString('id-ID', {dateStyle: 'long'})} - {endDate.toLocaleDateString('id-ID', {dateStyle: 'long'})}</p>
            {reportData.hasTransactions ? (
                <><div className="space-y-3 text-lg"><div className="flex justify-between"><span>Total Pendapatan (Omzet)</span><span className="font-bold">{formatCurrency(reportData.totalRevenue)}</span></div><div className="flex justify-between"><span>Total HPP</span><span className="font-bold">{formatCurrency(reportData.totalHPP)}</span></div><div className="flex justify-between text-xl border-t pt-2 mt-2"><span>Total Laba Kotor</span><span className="font-bold text-green-600">{formatCurrency(reportData.totalGrossProfit)}</span></div></div>
                <h4 className="text-lg font-semibold mt-8 mb-2">Rincian Pendapatan</h4><div className="space-y-2"><div className="flex justify-between p-3 bg-slate-50 rounded"><span>Pendapatan Tunai</span><span className="font-medium">{formatCurrency(reportData.cashRevenue)}</span></div><div className="flex justify-between p-3 bg-slate-50 rounded"><span>Pendapatan Non-Tunai</span><span className="font-medium">{formatCurrency(reportData.nonCashRevenue)}</span></div></div></>
            ) : (<p className="text-center text-slate-500 py-10">Tidak ada data transaksi pada tanggal ini.</p>)}
        </div>
    );
};

// --- TAB LAPORAN ANGGOTA ---
const MemberReportTab = ({ members, onAddMemberClick }) => {
    // Di sini Anda bisa menambahkan logika untuk laporan anggota jika diperlukan.
    // Untuk saat ini, kita hanya akan menampilkan tombol Tambah Anggota.
    return (
        <div className="bg-white p-6 rounded-lg shadow-sm">
             <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold">Pusat Anggota</h3>
                <button onClick={onAddMemberClick} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm">
                    Tambah Anggota Baru
                </button>
            </div>
            <p className="text-slate-500">Gunakan tombol di atas untuk mendaftarkan anggota baru. Untuk melihat daftar lengkap anggota, silakan kunjungi menu "Manajemen Stok".</p>
        </div>
    );
};


// --- KOMPONEN UTAMA REPORTS ---
const Reports = ({ transactions, members, products, onShowDailyReport, addMember }) => {
    const [activeTab, setActiveTab] = useState('transactions');
    const [showAddMemberModal, setShowAddMemberModal] = useState(false);

    const handleAddMember = (memberData) => {
        addMember(memberData);
        setShowAddMemberModal(false);
    };

    return (
        <div className="p-4 sm:p-8">
            {showAddMemberModal && <AddMemberModal onClose={() => setShowAddMemberModal(false)} onAddMember={handleAddMember} />}
            <h1 className="text-3xl font-bold text-slate-800 mb-6">Laporan</h1>
            <div className="mb-6 border-b border-slate-200">
                <nav className="-mb-px flex space-x-8" aria-label="Tabs"><button onClick={() => setActiveTab('transactions')} className={`${activeTab === 'transactions' ? 'border-blue-500 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}>Daftar Transaksi</button><button onClick={() => setActiveTab('daily')} className={`${activeTab === 'daily' ? 'border-blue-500 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}>Laporan Harian</button><button onClick={() => setActiveTab('members')} className={`${activeTab === 'members' ? 'border-blue-500 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}>Laporan Anggota</button></nav>
            </div>
            <div>
                {activeTab === 'transactions' && <TransactionListTab transactions={transactions} />}
                {activeTab === 'daily' && <DailyReportTab transactions={transactions} products={products} onShowDailyReport={onShowDailyReport} />}
                {activeTab === 'members' && <MemberReportTab members={members} onAddMemberClick={() => setShowAddMemberModal(true)} />}
            </div>
        </div>
    );
};

export default Reports;