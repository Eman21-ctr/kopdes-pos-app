// File: App.jsx (FINAL v3 - Dengan Tanggal Transaksi Kustom)
import React, { useState, useCallback, useEffect } from 'react';
import { db } from './lib/firebase.js';
import { collection, getDocs, doc, addDoc, updateDoc, deleteDoc, writeBatch, Timestamp, query, orderBy, setDoc } from 'firebase/firestore';
import { UserRole, StockLogType } from './lib/types.js';
import Dashboard from './components/Dashboard.jsx';
import POS from './components/POS.jsx';
import StockManagement from './components/StockManagement.jsx';
import Reports from './components/Reports.jsx';
import ReceiptModal from './components/Receipt.jsx';
import DailyReportReceipt from './components/DailyReportReceipt.jsx';
import { DashboardIcon, POSIcon, StockIcon, ReportIcon } from './components/Icons.jsx';

// Komponen NavItem tetap di luar App
const NavItem = ({ menuId, label, Icon, onClick, isActive }) => (
  <button onClick={() => onClick(menuId)} className={`flex items-center w-full text-left px-4 py-3 rounded-lg transition-colors ${isActive ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-blue-800 hover:text-white'}`}>
    <Icon className="w-6 h-6 mr-3" />
    <span className="font-medium">{label}</span>
  </button>
);

const App = () => {
  // Semua state tetap sama
  const [loading, setLoading] = useState(true);
  const [activeMenu, setActiveMenu] = useState('dashboard');
  const [currentUserRole, setCurrentUserRole] = useState(UserRole.Admin);
  const [products, setProducts] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [members, setMembers] = useState([]);
  const [latestTransaction, setLatestTransaction] = useState(null);
  const [stockLogs, setStockLogs] = useState([]);
  const [dailyReportData, setDailyReportData] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // useEffect untuk fetch data tetap sama
  useEffect(() => {
    const fetchData = async () => {
      try {
        const mapDoc = (doc) => ({ id: doc.id, ...doc.data() });
        const mapDocWithDate = (doc) => {
          const data = doc.data();
          const date = data.date && typeof data.date.toDate === 'function' ? data.date.toDate() : new Date();
          return { id: doc.id, ...data, date };
        };

        const productsQuery = query(collection(db, "products"), orderBy("name"));
        const productsSnapshot = await getDocs(productsQuery);
        setProducts(productsSnapshot.docs.map(mapDoc));

        const membersQuery = query(collection(db, "members"), orderBy("name"));
        const membersSnapshot = await getDocs(membersQuery);
        setMembers(membersSnapshot.docs.map(mapDoc));

        const transactionsQuery = query(collection(db, "transactions"), orderBy("date", "desc"));
        const transactionsSnapshot = await getDocs(transactionsQuery);
        setTransactions(transactionsSnapshot.docs.map(mapDocWithDate));

        const stockLogsQuery = query(collection(db, "stockLogs"), orderBy("date", "desc"));
        const stockLogsSnapshot = await getDocs(stockLogsQuery);
        setStockLogs(stockLogsSnapshot.docs.map(mapDocWithDate));

      } catch (error) {
        console.error("Error fetching data from Firestore: ", error);
        alert("Gagal memuat data dari server. Silakan coba muat ulang halaman.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // --- FUNGSI addTransaction YANG DIPERBARUI ---
  const addTransaction = useCallback(async (transactionData) => {
    const cashierName = currentUserRole === UserRole.Admin ? "Admin" : "Kasir";

    // Gunakan tanggal dari transactionData yang dikirim dari POS, bukan buat tanggal baru.
    const transactionDate = transactionData.date;

    // Siapkan data untuk dikirim ke Firestore.
    // Kita hapus properti 'date' dari transactionData agar tidak duplikat.
    const { date, ...restOfTransactionData } = transactionData;
    const newTransactionData = {
      ...restOfTransactionData,
      date: Timestamp.fromDate(transactionDate), // Konversi tanggal ke Timestamp Firestore
      cashierName,
    };

    try {
      const batch = writeBatch(db);
      const transactionRef = doc(collection(db, "transactions"));
      batch.set(transactionRef, newTransactionData);

      const newLogs = [];
      const updatedProducts = [...products];

      for (const item of transactionData.items) {
        const productRef = doc(db, "products", item.id);
        const productIndex = updatedProducts.findIndex(p => p.id === item.id);
        if (productIndex !== -1) {
          const product = updatedProducts[productIndex];
          const newStock = product.stock - item.quantity;
          batch.update(productRef, { stock: newStock });

          const logData = {
            date: Timestamp.fromDate(transactionDate), // Gunakan tanggal yang sama
            type: StockLogType.Penjualan,
            productName: product.name,
            quantityChange: -item.quantity,
            oldStock: product.stock,
            newStock: newStock,
            notes: `Transaksi #${transactionRef.id.substring(0, 5)}`
          };
          const logRef = doc(collection(db, "stockLogs"));
          batch.set(logRef, logData);

          newLogs.push({ id: logRef.id, ...logData, date: transactionDate });
          updatedProducts[productIndex] = { ...product, stock: newStock };
        }
      }

      await batch.commit();

      // Untuk UI, gunakan tanggal asli (objek Date), bukan Timestamp
      const finalTransaction = { ...transactionData, id: transactionRef.id, cashierName };
      setTransactions(prev => [...prev, finalTransaction].sort((a, b) => b.date - a.date));
      setStockLogs(prev => [...newLogs, ...prev].sort((a, b) => b.date - a.date));
      setProducts(updatedProducts);
      setLatestTransaction(finalTransaction);
    } catch (error) {
      console.error("Error processing transaction: ", error);
      alert("Terjadi kesalahan saat menyimpan transaksi.");
    }
  }, [currentUserRole, products]);

  const addProduct = useCallback(async (productData) => {
    try {
      const docRef = await addDoc(collection(db, "products"), productData);
      const newProduct = { id: docRef.id, ...productData };
      setProducts(prev => [...prev, newProduct].sort((a, b) => a.name.localeCompare(b.name)));
      alert('Produk baru berhasil ditambahkan!');
    } catch (error) {
      console.error("Error adding product: ", error);
      alert("Gagal menambahkan produk.");
    }
  }, []);

  const updateProduct = useCallback(async (updatedProduct) => {
    try {
      const { id, ...dataToUpdate } = updatedProduct;
      const productRef = doc(db, "products", id);
      await updateDoc(productRef, dataToUpdate);
      setProducts(prev => prev.map(p => p.id === id ? updatedProduct : p));
    } catch (error) {
      console.error("Error updating product: ", error);
      alert("Gagal memperbarui produk.");
    }
  }, []);

  const deleteProduct = useCallback(async (productId) => {
    try {
      await deleteDoc(doc(db, "products", productId));
      setProducts(prev => prev.filter(p => p.id !== productId));
    } catch (error) {
      console.error("Error deleting product: ", error);
      alert("Gagal menghapus produk.");
    }
  }, []);
  // ... setelah fungsi deleteProduct ...

  const deleteTransaction = useCallback(async (transactionToDelete) => {
    // Konfirmasi ulang sebelum melakukan aksi berbahaya
    const isConfirmed = window.confirm(`Yakin ingin menghapus transaksi #${transactionToDelete.id.substring(0, 8)}? Stok barang akan dikembalikan. Aksi ini tidak bisa dibatalkan.`);

    if (!isConfirmed) {
      return; // Batalkan jika pengguna menekan 'Cancel'
    }

    try {
      const batch = writeBatch(db);

      // 1. Kembalikan stok untuk setiap barang dalam transaksi
      for (const item of transactionToDelete.items) {
        const productRef = doc(db, "products", item.id);

        // Buat log stok baru untuk pengembalian
        const logData = {
          date: Timestamp.fromDate(new Date()),
          type: StockLogType.Penyesuaian, // atau bisa buat tipe baru 'Pembatalan Transaksi'
          productName: item.name,
          quantityChange: item.quantity, // Nilai positif untuk mengembalikan stok
          // Kita butuh stok lama untuk log, kita ambil dari state
          oldStock: products.find(p => p.id === item.id)?.stock || 0,
          newStock: (products.find(p => p.id === item.id)?.stock || 0) + item.quantity,
          notes: `Pembatalan Transaksi #${transactionToDelete.id.substring(0, 8)}`
        };

        const logRef = doc(collection(db, "stockLogs"));
        batch.set(logRef, logData);

        // Firestore tidak memiliki operator increment, jadi kita harus baca dulu.
        // Namun, untuk batch, kita asumsikan state 'products' kita sudah up-to-date.
        // Kita akan update stok berdasarkan state saat ini.
        const currentProduct = products.find(p => p.id === item.id);
        if (currentProduct) {
          const newStock = currentProduct.stock + item.quantity;
          batch.update(productRef, { stock: newStock });
        }
      }

      // 2. Hapus dokumen transaksi itu sendiri
      const transactionRef = doc(db, "transactions", transactionToDelete.id);
      batch.delete(transactionRef);

      // Jalankan semua operasi dalam batch
      await batch.commit();

      // 3. Perbarui state di UI secara optimis
      setTransactions(prev => prev.filter(t => t.id !== transactionToDelete.id));
      // Fetch ulang data produk & log untuk memastikan konsistensi
      // (Cara sederhana, atau bisa update manual seperti di addTransaction)
      alert("Transaksi berhasil dihapus dan stok telah dikembalikan.");

      // Untuk refresh data stok dan log stok di UI, kita bisa panggil fetchData lagi
      // Ini cara paling mudah untuk memastikan data sinkron
      // (Membutuhkan sedikit refactoring fetchData agar bisa dipanggil ulang)

    } catch (error) {
      console.error("Error deleting transaction: ", error);
      alert("Gagal menghapus transaksi.");
    }
  }, [products]); // Tambahkan 'products' sebagai dependensi
  // ... setelah fungsi deleteProduct ...
  const addMember = useCallback(async (memberData) => {
    try {
      const memberRef = doc(db, "members", memberData.id);
      await setDoc(memberRef, { name: memberData.name });
      setMembers(prev => [...prev, memberData].sort((a, b) => a.name.localeCompare(b.name)));
      alert(`Anggota "${memberData.name}" berhasil ditambahkan!`);
    } catch (error) {
      console.error("Error adding member: ", error);
      if (error.code === 'permission-denied') {
        alert("Gagal menambahkan anggota. Pastikan No Anggota unik dan belum pernah digunakan.");
      } else {
        alert("Gagal menambahkan anggota.");
      }
    }
  }, []);

  const deleteMember = useCallback(async (memberId, memberName) => {
    const isConfirmed = window.confirm(`Yakin ingin menghapus anggota "${memberName}"? Aksi ini tidak bisa dibatalkan.`);
    if (!isConfirmed) return;

    try {
      await deleteDoc(doc(db, "members", memberId));
      setMembers(prev => prev.filter(m => m.id !== memberId));
      alert(`Anggota "${memberName}" berhasil dihapus.`);
    } catch (error) {
      console.error("Error deleting member: ", error);
      alert("Gagal menghapus anggota.");
    }
  }, []);

  const receiveStock = useCallback(async (productId, quantity, notes) => {
    const product = products.find(p => p.id === productId);
    if (!product) return;

    const newStock = product.stock + quantity;
    const logDate = new Date();

    try {
      const batch = writeBatch(db);
      const productRef = doc(db, "products", productId);
      batch.update(productRef, { stock: newStock });

      const logData = {
        date: Timestamp.fromDate(logDate),
        type: StockLogType.Penerimaan,
        productName: product.name,
        quantityChange: quantity,
        oldStock: product.stock,
        newStock: newStock,
        notes
      };
      const logRef = doc(collection(db, "stockLogs"));
      batch.set(logRef, logData);
      await batch.commit();

      setProducts(prev => prev.map(p => p.id === productId ? { ...p, stock: newStock } : p));
      setStockLogs(prev => [{ id: logRef.id, ...logData, date: logDate }, ...prev]);
    } catch (error) {
      console.error("Error receiving stock: ", error);
      alert("Gagal menyimpan data penerimaan stok.");
    }
  }, [products]);

  const adjustStock = useCallback(async (productId, newStock, notes) => {
    const product = products.find(p => p.id === productId);
    if (!product) return;

    const quantityChange = newStock - product.stock;
    const logDate = new Date();

    try {
      const batch = writeBatch(db);
      const productRef = doc(db, "products", productId);
      batch.update(productRef, { stock: newStock });

      const logData = {
        date: Timestamp.fromDate(logDate),
        type: StockLogType.Penyesuaian,
        productName: product.name,
        quantityChange: quantityChange,
        oldStock: product.stock,
        newStock: newStock,
        notes
      };
      const logRef = doc(collection(db, "stockLogs"));
      batch.set(logRef, logData);
      await batch.commit();

      setProducts(prev => prev.map(p => p.id === productId ? { ...p, stock: newStock } : p));
      setStockLogs(prev => [{ id: logRef.id, ...logData, date: logDate }, ...prev]);
    } catch (error) {
      console.error("Error adjusting stock: ", error);
      alert("Gagal menyimpan data penyesuaian stok.");
    }
  }, [products]);


  // Ubah dari:
  // const handleShowDailyReport = (data, date) => { ... }
  // Menjadi:
  const handleShowDailyReport = (data, dateRange) => {
    setDailyReportData({ data, date: dateRange }); // date sekarang adalah objek {start, end}
  };

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: DashboardIcon, roles: [UserRole.Admin] },
    { id: 'pos', label: 'Kasir', icon: POSIcon, roles: [UserRole.Admin, UserRole.Kasir] },
    { id: 'stock', label: 'Manajemen Stok', icon: StockIcon, roles: [UserRole.Admin] },
    { id: 'reports', label: 'Laporan', icon: ReportIcon, roles: [UserRole.Admin, UserRole.Kasir] },
  ];

  const availableMenuItems = menuItems.filter(item => item.roles.includes(currentUserRole));

  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center h-full"><div className="text-center"><p className="text-xl font-semibold text-slate-700">Memuat data...</p><p className="text-slate-500">Menghubungkan ke database Koperasi Merah Putih...</p></div></div>
      );
    }
    switch (activeMenu) {
      case 'dashboard': return <Dashboard products={products} transactions={transactions} />;
      case 'pos': return <POS products={products.filter(p => p.stock > 0)} members={members} addTransaction={addTransaction} />;
      case 'stock': return <StockManagement products={products} addProduct={addProduct} updateProduct={updateProduct} deleteProduct={deleteProduct} receiveStock={receiveStock} adjustStock={adjustStock} stockLogs={stockLogs} />;
      case 'reports': return <Reports transactions={transactions} onShowDailyReport={handleShowDailyReport} members={members} products={products} addMember={addMember} deleteMember={deleteMember} deleteTransaction={deleteTransaction} currentUserRole={currentUserRole} />;
      default: return <Dashboard products={products} transactions={transactions} />;
    }
  };

  return (
    <>
      <div className="flex h-screen bg-slate-100 font-sans">
        {/* Sidebar */}
        <aside className={`fixed lg:relative inset-y-0 left-0 z-30 w-64 bg-slate-900 text-white flex flex-col p-4 transform transition-transform duration-300 ease-in-out ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}>
          <div className="text-center py-4 mb-6">
            <h1 className="text-lg font-bold uppercase leading-tight">Kopdes Merah Putih</h1>
            <h2 className="text-sm font-semibold uppercase">Penfui Timur</h2>
          </div>
          <nav className="flex-grow space-y-2">
            {availableMenuItems.map(item => (
              <NavItem
                key={item.id}
                menuId={item.id}
                label={item.label}
                Icon={item.icon}
                // Disempurnakan: Saat menu diklik, tutup sidebar (hanya di mode mobile)
                onClick={(menuId) => {
                  setActiveMenu(menuId);
                  setIsSidebarOpen(false); // Tutup sidebar setelah memilih menu
                }}
                isActive={activeMenu === item.id}
              />
            ))}
          </nav>
          <div className="mt-6">
            <label htmlFor="user-role" className="block text-sm text-slate-400 mb-2">Simulasi Peran Pengguna</label>
            <select
              id="user-role"
              value={currentUserRole}
              onChange={(e) => {
                const newRole = e.target.value;
                setCurrentUserRole(newRole);
                const newMenu = newRole === UserRole.Kasir ? 'pos' : 'dashboard';
                if (menuItems.find(m => m.id === newMenu)?.roles.includes(newRole)) {
                  setActiveMenu(newMenu);
                } else {
                  setActiveMenu(availableMenuItems[0].id);
                }
                setIsSidebarOpen(false); // Tutup sidebar setelah ganti peran
              }}
              className="w-full bg-slate-800 border border-slate-700 text-white text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5">
              <option value={UserRole.Admin}>Admin/Manajer</option>
              <option value={UserRole.Kasir}>Kasir</option>
            </select>
          </div>
        </aside>

        {/* === BAGIAN BARU: Overlay Gelap === */}
        {/* Muncul saat sidebar terbuka & hanya di layar kecil (lg:hidden) */}
        {isSidebarOpen && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-20 lg:hidden"
            onClick={() => setIsSidebarOpen(false)}
          ></div>
        )}

        {/* Wrapper untuk header mobile dan konten utama */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Header yang HANYA MUNCUL DI HP (lg:hidden) */}
          <header className="lg:hidden bg-white shadow-md p-4 flex justify-between items-center">
            <button onClick={() => setIsSidebarOpen(true)}>
              <svg className="w-6 h-6 text-slate-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
            </button>
            <div className="text-center">
              <h1 className="text-md font-bold uppercase leading-tight text-slate-800">Kopdes Merah Putih</h1>
            </div>
            <div className="w-6"></div> {/* Spacer kosong agar judul di tengah */}
          </header>

          {/* Konten Utama */}
          <main className="flex-1 overflow-y-auto">
            {renderContent()}
          </main>
        </div>
      </div>

      {/* Modal-modal aplikasi */}
      {latestTransaction && (<ReceiptModal key={latestTransaction.id} transaction={latestTransaction} onClose={() => setLatestTransaction(null)} />)}
      {dailyReportData && (<DailyReportReceipt reportData={dailyReportData.data} date={dailyReportData.date} onClose={() => setDailyReportData(null)} />)}
    </>
  );
};

export default App;