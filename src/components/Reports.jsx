import React, { useState, useMemo } from 'react';
import { UserRole } from '../lib/types.js';
import { formatDate, formatCurrency, exportTransactionsToCSV } from '../lib/helpers.js';
import { DownloadIcon, TrashIcon } from './Icons.jsx';
import AddMemberModal from './AddMemberModal.jsx';
import TransactionDetailModal from './TransactionDetailModal.jsx'; // 1. Impor Modal Baru

// --- TAB DAFTAR TRANSAKSI ---
const TransactionListTab = ({ transactions, deleteTransaction, currentUserRole }) => {
    const [selectedTransaction, setSelectedTransaction] = useState(null); // 2. State untuk modal
    const [searchTerm, setSearchTerm] = useState(''); // State untuk pencarian
    const [paymentMethod, setPaymentMethod] = useState('Semua'); // State untuk filter metode bayar
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
        return transactions.filter(t => {
            const txDate = new Date(t.date);
            const matchesDate = txDate >= startDate && txDate <= endDate;

            const searchLower = searchTerm.toLowerCase();
            const matchesSearch =
                t.id.toLowerCase().includes(searchLower) ||
                (t.customerName && t.customerName.toLowerCase().includes(searchLower)) ||
                t.items.some(item => item.name.toLowerCase().includes(searchLower));

            const matchesPayment = paymentMethod === 'Semua' || t.paymentMethod === paymentMethod;

            return matchesDate && matchesSearch && matchesPayment;
        });
    }, [transactions, startDate, endDate, searchTerm, paymentMethod]);

    return (
        <>
            {/* 3. Render Modal jika ada transaksi yang dipilih */}
            {selectedTransaction && (
                <TransactionDetailModal
                    transaction={selectedTransaction}
                    onClose={() => setSelectedTransaction(null)}
                />
            )}

            <div className="bg-white p-4 rounded-lg shadow-sm mb-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
                    {/* Pencarian */}
                    <div>
                        <label className="text-xs font-medium text-slate-500 uppercase mb-1 block">Cari Transaksi</label>
                        <input
                            type="text"
                            placeholder="ID, Pelanggan, atau Produk..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    {/* Filter Metode Bayar */}
                    <div>
                        <label className="text-xs font-medium text-slate-500 uppercase mb-1 block">Metode Bayar</label>
                        <select
                            value={paymentMethod}
                            onChange={(e) => setPaymentMethod(e.target.value)}
                            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="Semua">Semua Metode</option>
                            <option value="Tunai">Tunai</option>
                            <option value="Non-Tunai">Non-Tunai</option>
                        </select>
                    </div>

                    {/* Filter Tanggal */}
                    <div className="grid grid-cols-2 gap-2">
                        <div>
                            <label className="text-xs font-medium text-slate-500 uppercase mb-1 block">Dari</label>
                            <input
                                type="date"
                                value={startDate.toISOString().split('T')[0]}
                                onChange={(e) => {
                                    const d = new Date(e.target.value);
                                    d.setHours(0, 0, 0, 0);
                                    setStartDate(d);
                                }}
                                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <div>
                            <label className="text-xs font-medium text-slate-500 uppercase mb-1 block">Sampai</label>
                            <input
                                type="date"
                                value={endDate.toISOString().split('T')[0]}
                                onChange={(e) => {
                                    const d = new Date(e.target.value);
                                    d.setHours(23, 59, 59, 999);
                                    setEndDate(d);
                                }}
                                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                    </div>

                    {/* Tombol Export */}
                    <div className="flex justify-end">
                        <button
                            onClick={() => exportTransactionsToCSV(filteredTransactions)}
                            className="flex items-center gap-2 px-4 py-2 bg-slate-800 text-white text-sm font-medium rounded-md hover:bg-slate-700 transition-colors w-full md:w-auto justify-center"
                        >
                            <DownloadIcon className="w-4 h-4" />
                            Eksport CSV
                        </button>
                    </div>
                </div>
            </div>

            <div className="space-y-4 lg:space-y-0">
                <div className="hidden lg:grid grid-cols-7 gap-4 px-6 py-3 bg-slate-50 text-xs font-medium text-slate-700 uppercase rounded-t-lg">
                    <span>No. Transaksi</span><span>Tanggal & Waktu</span><span>Nama Kasir</span><span>Nama Pelanggan</span><span className="text-right">Total Belanja</span><span className="text-center">Metode Bayar</span><span className="text-center">Aksi</span>
                </div>

                {filteredTransactions.length > 0 ? (
                    filteredTransactions.map(t => (
                        <div key={t.id} className="bg-white p-4 rounded-lg shadow-sm lg:shadow-none lg:rounded-none lg:p-0 lg:grid lg:grid-cols-7 lg:gap-4 lg:items-center lg:border-b">
                            <div className="lg:hidden">
                                <div className="flex justify-between items-start mb-2"><div className="font-semibold text-slate-800">{formatCurrency(t.total)}</div><span className="text-xs font-medium px-2 py-1 bg-blue-100 text-blue-800 rounded-full">{t.paymentMethod}</span></div>
                                <div className="text-sm text-slate-600 space-y-1 border-t pt-2"><p><strong>ID:</strong> <span className="font-mono text-xs">{t.id.substring(0, 8)}</span></p><p><strong>Pelanggan:</strong> {t.customerName || 'Pelanggan Umum'}</p><p><strong>Kasir:</strong> {t.cashierName}</p><p><strong>Waktu:</strong> {formatDate(t.date)}</p></div>
                                <div className="mt-2 pt-2 border-t flex justify-end gap-4">
                                    <button onClick={() => setSelectedTransaction(t)} className="text-xs font-medium text-blue-600 hover:underline">Lihat Detail</button>
                                    {currentUserRole === UserRole.Admin && (
                                        <button onClick={() => deleteTransaction(t)} className="flex items-center gap-1 text-xs font-medium text-red-600 hover:underline"><TrashIcon className="w-3 h-3" /> Hapus</button>
                                    )}
                                </div>
                            </div>
                            <div className="hidden lg:flex items-center px-6 py-4 font-mono text-xs text-slate-600">{t.id}</div><div className="hidden lg:flex items-center px-6 py-4 text-sm">{formatDate(t.date)}</div><div className="hidden lg:flex items-center px-6 py-4 text-sm">{t.cashierName}</div><div className="hidden lg:flex items-center px-6 py-4 text-sm">{t.customerName || 'Pelanggan Umum'}</div><div className="hidden lg:flex items-center justify-end px-6 py-4 font-semibold text-slate-800 text-sm">{formatCurrency(t.total)}</div><div className="hidden lg:flex items-center justify-center px-6 py-4 text-sm">{t.paymentMethod}</div>
                            <div className="hidden lg:flex items-center justify-center px-6 py-4 text-sm gap-4">
                                <button onClick={() => setSelectedTransaction(t)} className="font-medium text-blue-600 hover:underline">Detail</button>
                                {currentUserRole === UserRole.Admin && (
                                    <button onClick={() => deleteTransaction(t)} className="text-red-600 hover:text-red-800" title="Hapus Transaksi"><TrashIcon className="w-4 h-4" /></button>
                                )}
                            </div>
                        </div>
                    ))
                ) : (<div className="text-center py-10 text-slate-500 bg-white rounded-lg shadow-sm">Tidak ada transaksi pada rentang tanggal ini.</div>)}
            </div>
        </>
    );
}

// --- TAB LAPORAN HARIAN ---
const DailyReportTab = ({ transactions, products, onShowDailyReport }) => {
    const [startDate, setStartDate] = useState(() => { const d = new Date(); d.setHours(0, 0, 0, 0); return d; });
    const [endDate, setEndDate] = useState(() => { const d = new Date(); d.setHours(23, 59, 59, 999); return d; });

    const reportData = useMemo(() => {
        const dailyTransactions = transactions.filter(t => new Date(t.date) >= startDate && new Date(t.date) <= endDate);
        const totalRevenue = dailyTransactions.reduce((sum, t) => sum + t.total, 0);

        let totalHPP = 0;
        let cashRevenue = 0;
        let nonCashRevenue = 0;
        let cashHPP = 0;
        let nonCashHPP = 0;

        dailyTransactions.forEach(t => {
            const transactionCost = t.items.reduce((itemSum, item) => {
                const product = products.find(p => p.id === item.id);
                return itemSum + (product ? product.purchasePrice * item.quantity : 0);
            }, 0);

            totalHPP += transactionCost;

            if (t.paymentMethod === 'Tunai') {
                cashRevenue += t.total;
                cashHPP += transactionCost;
            } else {
                nonCashRevenue += t.total;
                nonCashHPP += transactionCost;
            }
        });

        const totalGrossProfit = totalRevenue - totalHPP;
        const hasTransactions = dailyTransactions.length > 0;

        return { totalRevenue, totalHPP, totalGrossProfit, cashRevenue, nonCashRevenue, cashHPP, nonCashHPP, hasTransactions };
    }, [startDate, endDate, transactions, products]);

    return (
        <div className="bg-white p-6 rounded-lg shadow-sm max-w-2xl">
            <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
                <div className="flex items-center gap-4 w-full sm:w-auto">
                    <div><label htmlFor="start-date-daily" className="text-sm font-medium text-slate-600">Dari Tanggal</label><input type="date" id="start-date-daily" value={startDate.toISOString().split('T')[0]} onChange={(e) => { const d = new Date(e.target.value); d.setHours(0, 0, 0, 0); setStartDate(d); }} className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm" /></div>
                    <div><label htmlFor="end-date-daily" className="text-sm font-medium text-slate-600">Sampai Tanggal</label><input type="date" id="end-date-daily" value={endDate.toISOString().split('T')[0]} onChange={(e) => { const d = new Date(e.target.value); d.setHours(23, 59, 59, 999); setEndDate(d); }} className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm" /></div>
                </div>
                <button onClick={() => onShowDailyReport(reportData, { start: startDate, end: endDate })} disabled={!reportData.hasTransactions} className="w-full sm:w-auto px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-slate-300">Cetak Laporan</button>
            </div>
            <h3 className="text-xl font-bold">Rekapitulasi Laporan</h3>
            <p className="text-sm text-slate-600 mb-4">{startDate.toLocaleDateString('id-ID', { dateStyle: 'long' })} - {endDate.toLocaleDateString('id-ID', { dateStyle: 'long' })}</p>
            {reportData.hasTransactions ? (
                <>
                    <div className="space-y-3 text-lg">
                        <div className="flex justify-between font-medium"><span>Total Pendapatan (Omzet)</span><span className="font-bold">{formatCurrency(reportData.totalRevenue)}</span></div>
                        <div className="flex justify-between font-medium"><span>Total HPP</span><span className="font-bold text-slate-700">{formatCurrency(reportData.totalHPP)}</span></div>
                        <div className="flex justify-between text-xl border-t pt-2 mt-2"><span>Total Laba Kotor</span><span className="font-bold text-green-600">{formatCurrency(reportData.totalGrossProfit)}</span></div>
                    </div>

                    <h4 className="text-lg font-semibold mt-8 mb-4">Rincian Pendapatan & HPP</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2 p-4 bg-blue-50/50 rounded-lg border border-blue-100">
                            <div className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-2">Metode Tunai</div>
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-slate-600">Pendapatan</span>
                                <span className="font-semibold text-slate-800">{formatCurrency(reportData.cashRevenue)}</span>
                            </div>
                            <div className="flex justify-between items-center pt-2 border-t border-blue-100">
                                <span className="text-sm text-slate-600">HPP</span>
                                <span className="font-medium text-slate-700">{formatCurrency(reportData.cashHPP)}</span>
                            </div>
                        </div>

                        <div className="space-y-2 p-4 bg-purple-50/50 rounded-lg border border-purple-100">
                            <div className="text-xs font-bold text-purple-600 uppercase tracking-wider mb-2">Metode Non-Tunai</div>
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-slate-600">Pendapatan</span>
                                <span className="font-semibold text-slate-800">{formatCurrency(reportData.nonCashRevenue)}</span>
                            </div>
                            <div className="flex justify-between items-center pt-2 border-t border-purple-100">
                                <span className="text-sm text-slate-600">HPP</span>
                                <span className="font-medium text-slate-700">{formatCurrency(reportData.nonCashHPP)}</span>
                            </div>
                        </div>
                    </div>
                </>
            ) : (<p className="text-center text-slate-500 py-10">Tidak ada data transaksi pada tanggal ini.</p>)}
        </div>
    );
};

// --- TAB LAPORAN ANGGOTA ---
const MemberReportTab = ({ members, transactions, onAddMemberClick, deleteMember }) => {
    // Hitung statistik transaksi per anggota
    const memberTransactionStats = useMemo(() => {
        const stats = {};

        // Inisialisasi stats untuk semua anggota
        members.forEach(member => {
            stats[member.name] = {
                id: member.id,
                name: member.name,
                totalTransactions: 0,
                totalAmount: 0,
                lastTransactionDate: null
            };
        });

        // Proses setiap transaksi
        transactions.forEach(transaction => {
            const customerName = transaction.customerName;
            if (customerName && customerName !== 'Pelanggan Umum' && stats[customerName]) {
                stats[customerName].totalTransactions += 1;
                stats[customerName].totalAmount += transaction.total;

                // Update tanggal transaksi terakhir
                if (!stats[customerName].lastTransactionDate ||
                    new Date(transaction.date) > new Date(stats[customerName].lastTransactionDate)) {
                    stats[customerName].lastTransactionDate = transaction.date;
                }
            }
        });

        // Convert ke array dan urutkan berdasarkan total belanja
        return Object.values(stats).sort((a, b) => b.totalAmount - a.totalAmount);
    }, [members, transactions]);

    return (
        <div className="bg-white p-6 rounded-lg shadow-sm">
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold">Laporan Anggota</h3>
                <button
                    onClick={onAddMemberClick}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
                >
                    Tambah Anggota Baru
                </button>
            </div>

            {members.length === 0 ? (
                <div className="text-center py-8">
                    <p className="text-slate-500 mb-4">Belum ada anggota terdaftar.</p>
                    <button
                        onClick={onAddMemberClick}
                        className="text-blue-600 hover:underline"
                    >
                        Daftarkan anggota pertama
                    </button>
                </div>
            ) : (
                <>
                    <div className="mb-4 text-sm text-slate-600">
                        <p>Data ini akan digunakan sebagai dasar perhitungan SHU (Sisa Hasil Usaha) di akhir tahun.</p>
                        <p>Total Anggota: <strong>{members.length}</strong> | Anggota Aktif: <strong>{memberTransactionStats.filter(m => m.totalTransactions > 0).length}</strong></p>
                    </div>

                    {/* Tabel Desktop */}
                    <div className="hidden md:block overflow-x-auto">
                        <table className="min-w-full">
                            <thead className="bg-slate-50">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-700 uppercase">No. Anggota</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-700 uppercase">Nama Anggota</th>
                                    <th className="px-4 py-3 text-center text-xs font-medium text-slate-700 uppercase">Jumlah Transaksi</th>
                                    <th className="px-4 py-3 text-right text-xs font-medium text-slate-700 uppercase">Total Belanja</th>
                                    <th className="px-4 py-3 text-center text-xs font-medium text-slate-700 uppercase">Transaksi Terakhir</th>
                                    <th className="px-4 py-3 text-center text-xs font-medium text-slate-700 uppercase">Status</th>
                                    <th className="px-4 py-3 text-center text-xs font-medium text-slate-700 uppercase">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200">
                                {memberTransactionStats.map((member) => (
                                    <tr key={member.id} className="hover:bg-slate-50">
                                        <td className="px-4 py-3 text-sm font-mono text-slate-600">{member.id}</td>
                                        <td className="px-4 py-3 text-sm font-medium text-slate-800">{member.name}</td>
                                        <td className="px-4 py-3 text-sm text-center">
                                            <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium">
                                                {member.totalTransactions}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-sm text-right font-semibold text-slate-800">
                                            {formatCurrency(member.totalAmount)}
                                        </td>
                                        <td className="px-4 py-3 text-sm text-center text-slate-600">
                                            {member.lastTransactionDate ? formatDate(member.lastTransactionDate).split(' ')[0] : '-'}
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${member.totalTransactions > 0
                                                    ? 'bg-green-100 text-green-800'
                                                    : 'bg-orange-100 text-orange-800'
                                                }`}>
                                                {member.totalTransactions > 0 ? 'Aktif' : 'Belum Aktif'}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            <button
                                                onClick={() => deleteMember(member.id, member.name)}
                                                className="text-red-600 hover:text-red-800 transition-colors"
                                                title="Hapus Anggota"
                                            >
                                                <TrashIcon className="w-5 h-5 mx-auto" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Cards Mobile */}
                    <div className="md:hidden space-y-4">
                        {memberTransactionStats.map((member) => (
                            <div key={member.id} className="bg-slate-50 p-4 rounded-lg">
                                <div className="flex justify-between items-start mb-3">
                                    <div>
                                        <h4 className="font-semibold text-slate-800">{member.name}</h4>
                                        <p className="text-sm text-slate-600">ID: {member.id}</p>
                                    </div>
                                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${member.totalTransactions > 0
                                        ? 'bg-green-100 text-green-800'
                                        : 'bg-orange-100 text-orange-800'
                                        }`}>
                                        {member.totalTransactions > 0 ? 'Aktif' : 'Belum Aktif'}
                                    </span>
                                </div>
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div>
                                        <span className="text-slate-600">Transaksi:</span>
                                        <span className="ml-2 font-medium">{member.totalTransactions}x</span>
                                    </div>
                                    <div>
                                        <span className="text-slate-600">Total Belanja:</span>
                                        <span className="ml-2 font-medium">{formatCurrency(member.totalAmount)}</span>
                                    </div>
                                    <div className="col-span-2 flex justify-between items-center bg-white p-2 rounded mt-2">
                                        <div>
                                            <span className="text-slate-600 text-xs block">Transaksi Terakhir:</span>
                                            <span className="font-medium">
                                                {member.lastTransactionDate ? formatDate(member.lastTransactionDate).split(' ')[0] : 'Belum ada'}
                                            </span>
                                        </div>
                                        <button
                                            onClick={() => deleteMember(member.id, member.name)}
                                            className="p-2 text-red-600 hover:bg-red-50 rounded-full transition-colors"
                                            title="Hapus Anggota"
                                        >
                                            <TrashIcon className="w-5 h-5" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </>
            )}
        </div>
    );
};


// --- KOMPONEN UTAMA REPORTS ---
const Reports = ({ transactions, members, products, onShowDailyReport, addMember, deleteMember, deleteTransaction, currentUserRole }) => {
    const [activeTab, setActiveTab] = useState('transactions');
    const [showAddMemberModal, setShowAddMemberModal] = useState(false);

    const handleAddMember = (memberData) => {
        addMember(memberData);
        setShowAddMemberModal(false);
    };

    return (
        <div className="p-4 sm:p-8">
            {showAddMemberModal && <AddMemberModal onClose={() => setShowAddMemberModal(false)} onAddMember={handleAddMember} members={members} />}
            <h1 className="text-3xl font-bold text-slate-800 mb-6">Laporan</h1>
            <div className="mb-6 border-b border-slate-200">
                <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                    <button onClick={() => setActiveTab('transactions')} className={`${activeTab === 'transactions' ? 'border-blue-500 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}>Daftar Transaksi</button>
                    <button onClick={() => setActiveTab('daily')} className={`${activeTab === 'daily' ? 'border-blue-500 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}>Laporan Harian</button>
                    <button onClick={() => setActiveTab('members')} className={`${activeTab === 'members' ? 'border-blue-500 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}>Laporan Anggota</button>
                </nav>
            </div>
            <div>
                {activeTab === 'transactions' && <TransactionListTab transactions={transactions} deleteTransaction={deleteTransaction} currentUserRole={currentUserRole} />}
                {activeTab === 'daily' && <DailyReportTab transactions={transactions} products={products} onShowDailyReport={onShowDailyReport} />}
                {activeTab === 'members' && <MemberReportTab members={members} transactions={transactions} onAddMemberClick={() => setShowAddMemberModal(true)} deleteMember={deleteMember} />}
            </div>
        </div>
    );
};

export default Reports;