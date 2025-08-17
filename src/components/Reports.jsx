import React, { useState, useMemo } from 'react';
import { PaymentMethod } from '../lib/types.js'; // Diperbaiki: path ke types.js
import { formatDate, formatCurrency, exportTransactionsToCSV, exportMemberReportToCSV } from '../lib/helpers.js';
import { DownloadIcon } from './Icons.jsx';
import AddMemberModal from './AddMemberModal.jsx';

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

    const handleDateChange = (e, setter) => {
        const date = new Date(e.target.value);
        if (setter === setStartDate) {
            date.setHours(0, 0, 0, 0);
        } else {
            date.setHours(23, 59, 59, 999);
        }
        setter(date);
    };

    return (
        <>
            <div className="flex items-center gap-4 mb-4">
                <div><label htmlFor="start-date" className="text-sm font-medium text-slate-600">Dari Tanggal</label><input type="date" id="start-date" value={startDate.toISOString().split('T')[0]} onChange={(e) => handleDateChange(e, setStartDate)} className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"/></div>
                <div><label htmlFor="end-date" className="text-sm font-medium text-slate-600">Sampai Tanggal</label><input type="date" id="end-date" value={endDate.toISOString().split('T')[0]} onChange={(e) => handleDateChange(e, setEndDate)} className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"/></div>
            </div>
            <div className="flex justify-end mb-4"><button onClick={() => exportTransactionsToCSV(filteredTransactions, startDate, endDate)} disabled={filteredTransactions.length === 0} className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md text-sm hover:bg-green-700 disabled:bg-slate-300 disabled:cursor-not-allowed"><DownloadIcon className="w-4 h-4" /> Download (.csv)</button></div>
            <div className="bg-white shadow-sm rounded-lg overflow-hidden">
                <table className="w-full text-sm text-left text-slate-500">
                    <thead className="text-xs text-slate-700 uppercase bg-slate-50"><tr><th scope="col" className="px-6 py-3">No. Transaksi</th><th scope="col" className="px-6 py-3">Tanggal & Waktu</th><th scope="col" className="px-6 py-3">Nama Kasir</th><th scope="col" className="px-6 py-3">Nama Pelanggan</th><th scope="col" className="px-6 py-3">Total Belanja</th><th scope="col" className="px-6 py-3">Metode Pembayaran</th></tr></thead>
                    <tbody>
                        {filteredTransactions.map(t => (<tr key={t.id} className="bg-white border-b hover:bg-slate-50"><td className="px-6 py-4 font-mono text-xs text-slate-600">{t.id.substring(0,8)}</td><td className="px-6 py-4">{formatDate(t.date)}</td><td className="px-6 py-4">{t.cashierName}</td><td className="px-6 py-4">{t.customerName || 'Pelanggan Umum'}</td><td className="px-6 py-4 font-semibold text-slate-800">{formatCurrency(t.total)}</td><td className="px-6 py-4">{t.paymentMethod}</td></tr>))}
                         {filteredTransactions.length === 0 && (<tr><td colSpan={6} className="text-center py-10 text-slate-500">Tidak ada transaksi pada rentang tanggal ini.</td></tr>)}
                    </tbody>
                </table>
            </div>
        </>
    );
}

const DailyReportTab = ({ transactions, products, onShowDailyReport }) => {
    const [reportDate, setReportDate] = useState(new Date());

    const reportData = useMemo(() => {
        const dayStart = new Date(reportDate);
        dayStart.setHours(0, 0, 0, 0);
        const dayEnd = new Date(reportDate);
        dayEnd.setHours(23, 59, 59, 999);

        const dailyTransactions = transactions.filter(t => new Date(t.date) >= dayStart && new Date(t.date) <= dayEnd);
        
        const totalRevenue = dailyTransactions.reduce((sum, t) => sum + t.total, 0);
        const totalHPP = dailyTransactions.reduce((sum, t) => {
            const transactionCost = t.items.reduce((itemSum, item) => {
                const product = products.find(p => p.id === item.id);
                return itemSum + (product ? product.purchasePrice * item.quantity : 0);
            }, 0);
            return sum + transactionCost;
        }, 0);

        const totalGrossProfit = totalRevenue - totalHPP;
        const cashRevenue = dailyTransactions.filter(t => t.paymentMethod === PaymentMethod.Tunai).reduce((sum, t) => sum + t.total, 0);
        const nonCashRevenue = totalRevenue - cashRevenue;
        const hasTransactions = dailyTransactions.length > 0;

        return { totalRevenue, totalHPP, totalGrossProfit, cashRevenue, nonCashRevenue, hasTransactions };
    }, [reportDate, transactions, products]);
    
    return (
        <div className="bg-white p-6 rounded-lg shadow-sm max-w-2xl">
            <div className="flex justify-between items-center mb-6">
                <div><label htmlFor="reportDate" className="text-sm font-medium text-slate-600">Pilih Tanggal Laporan</label><input type="date" id="reportDate" value={reportDate.toISOString().split('T')[0]} onChange={(e) => setReportDate(new Date(e.target.value))} className="mt-1 px-3 py-2 border rounded-md"/></div>
                <button onClick={() => onShowDailyReport(reportData, reportDate)} disabled={!reportData.hasTransactions} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed">Cetak Laporan</button>
            </div>
            <h3 className="text-xl font-bold mb-4">Rekapitulasi {reportDate.toLocaleDateString('id-ID', {dateStyle: 'long'})}</h3>
            {reportData.hasTransactions ? (
                <><div className="space-y-3 text-lg"><div className="flex justify-between"><span>Total Pendapatan (Omzet)</span> <span className="font-bold">{formatCurrency(reportData.totalRevenue)}</span></div><div className="flex justify-between"><span>Total HPP</span> <span className="font-bold">{formatCurrency(reportData.totalHPP)}</span></div><div className="flex justify-between text-xl border-t pt-2 mt-2"><span>Total Laba Kotor</span> <span className="font-bold text-green-600">{formatCurrency(reportData.totalGrossProfit)}</span></div></div>
                <h4 className="text-lg font-semibold mt-8 mb-2">Rincian Pendapatan</h4><div className="space-y-2"><div className="flex justify-between p-3 bg-slate-50 rounded"><span>Pendapatan Tunai</span> <span className="font-medium">{formatCurrency(reportData.cashRevenue)}</span></div><div className="flex justify-between p-3 bg-slate-50 rounded"><span>Pendapatan Non-Tunai</span> <span className="font-medium">{formatCurrency(reportData.nonCashRevenue)}</span></div></div></>
            ) : (<p className="text-center text-slate-500 py-10">Tidak ada data transaksi pada tanggal ini.</p>)}
        </div>
    );
};

const MemberReportTab = ({ transactions, members, onAddMemberClick }) => { // Diperbaiki: Ditambahkan onAddMemberClick
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    
    const availableYears = useMemo(() => {
        if (transactions.length === 0) return [new Date().getFullYear()];
        const years = new Set(transactions.map(t => new Date(t.date).getFullYear()));
        return Array.from(years).sort((a,b) => b-a);
    }, [transactions]);
    
    const memberData = useMemo(() => {
        const spending = new Map();
        transactions.filter(t => new Date(t.date).getFullYear() === selectedYear).forEach(t => {
                const customer = t.customerName || 'Pelanggan Umum';
                if (customer !== 'Pelanggan Umum' && customer.trim() !== '') {
                    const current = spending.get(customer) || { total: 0, count: 0 };
                    current.total += t.total;
                    current.count += 1;
                    spending.set(customer, current);
                }
            });
        return Array.from(spending.entries()).map(([name, data]) => ({ name, ...data })).sort((a, b) => b.total - a.total);
    }, [transactions, selectedYear]);

    // return statement yang sudah dirapikan dan diperbaiki
    return (
        <>
            {/* Baris Kontrol (Filter & Tombol-tombol) */}
            <div className="flex justify-between items-center mb-4">
                {/* Filter Tahun di Kiri */}
                <div>
                    <label htmlFor="year-filter" className="text-sm font-medium text-slate-600 mr-2">Tampilkan Tahun</label>
                    <select
                        id="year-filter"
                        value={selectedYear}
                        onChange={(e) => setSelectedYear(Number(e.target.value))}
                        className="px-3 py-2 border border-slate-300 rounded-md shadow-sm"
                    >
                        {availableYears.map(year => (
                            <option key={year} value={year}>{year}</option>
                        ))}
                    </select>
                </div>

                {/* Grup Tombol di Kanan */}
                <div className="flex items-center gap-2">
                    <button
                        onClick={onAddMemberClick}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700"
                    >
                        Tambah Anggota
                    </button>
                    <button
                        onClick={() => exportMemberReportToCSV(memberData, selectedYear)}
                        disabled={memberData.length === 0}
                        className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md text-sm hover:bg-green-700 disabled:bg-slate-300 disabled:cursor-not-allowed"
                    >
                        <DownloadIcon className="w-4 h-4" /> Download (.csv)
                    </button>
                </div>
            </div>

            {/* Tabel Data */}
            <div className="bg-white shadow-sm rounded-lg overflow-hidden">
                <table className="w-full text-sm text-left text-slate-500">
                    <thead className="text-xs text-slate-700 uppercase bg-slate-50">
                        <tr>
                            <th scope="col" className="px-6 py-3 w-16">Peringkat</th>
                            <th scope="col" className="px-6 py-3">Nama Anggota</th>
                            <th scope="col" className="px-6 py-3">Jumlah Transaksi</th>
                            <th scope="col" className="px-6 py-3">Total Belanja</th>
                        </tr>
                    </thead>
                    <tbody>
                        {memberData.map((member, index) => (
                            <tr key={member.name} className="bg-white border-b hover:bg-slate-50">
                                <td className="px-6 py-4 text-center font-bold text-slate-700">{index + 1}</td>
                                <td className="px-6 py-4 font-medium text-slate-900">{member.name}</td>
                                <td className="px-6 py-4">{member.count}</td>
                                <td className="px-6 py-4 font-semibold text-blue-600">{formatCurrency(member.total)}</td>
                            </tr>
                        ))}
                        {memberData.length === 0 && (
                            <tr>
                                <td colSpan={4} className="text-center py-10 text-slate-500">
                                    Belum ada transaksi yang tercatat atas nama anggota pada tahun {selectedYear}.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </>
    );
};
const Reports = ({ transactions, members, products, onShowDailyReport, addMember }) => {
    const [activeTab, setActiveTab] = useState('transactions');
    const [showAddMemberModal, setShowAddMemberModal] = useState(false);

    // Fungsi untuk menangani penambahan anggota dan menutup modal
    const handleAddMember = (memberData) => {
        addMember(memberData);
        setShowAddMemberModal(false);
    };

    const renderContent = () => {
        switch (activeTab) {
            case 'transactions':
                return <TransactionListTab transactions={transactions} />;
            case 'daily':
                return <DailyReportTab 
                            transactions={transactions} 
                            products={products} 
                            onShowDailyReport={onShowDailyReport} 
                        />;
            case 'members':
                return <MemberReportTab 
                            transactions={transactions} 
                            members={members} 
                            onAddMemberClick={() => setShowAddMemberModal(true)} 
                        />;
            default:
                return null;
        }
    };

    return (
        <div className="p-4 sm:p-8">
            {showAddMemberModal && (
                <AddMemberModal 
                    onClose={() => setShowAddMemberModal(false)}
                    onAddMember={handleAddMember}
                />
            )}

            <h1 className="text-3xl font-bold text-slate-800 mb-6">Laporan</h1>
            
            <div className="mb-6 border-b border-slate-200">
                <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                    <button 
                        onClick={() => setActiveTab('transactions')} 
                        className={`${activeTab === 'transactions' ? 'border-blue-500 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                    >
                        Daftar Transaksi
                    </button>
                    <button 
                        onClick={() => setActiveTab('daily')} 
                        className={`${activeTab === 'daily' ? 'border-blue-500 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                    >
                        Laporan Harian
                    </button>
                    <button 
                        onClick={() => setActiveTab('members')} 
                        className={`${activeTab === 'members' ? 'border-blue-500 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                    >
                        Laporan Anggota
                    </button>
                </nav>
            </div>
            
            <div>
                {renderContent()}
            </div>
        </div>
    );
};


export default Reports;