import React, { useState, useMemo } from 'react';
// Import 'StockLogType' yang baru kita buat
import { StockLogType } from "../lib/types.js";
import { formatCurrency, formatDate, exportProductsToExcel, exportStockLogsToExcel } from '../lib/helpers.js'; // PASTIKAN PATH INI BENAR
import { DownloadIcon } from './Icons.jsx';

const PRODUCT_UNITS = ['Pcs', 'Kg', 'Liter', 'Pack', 'Sachet', 'Botol', 'Kaleng', 'Rak', 'Renteng', 'Dos', 'Ikat', 'Karung', 'Jrg', 'Tabung', 'Bungkus', 'Batang', 'Butir', 'Gelas'];

// Komponen Input Pencarian Barang (dapat digunakan kembali)
const ProductSearchableInput = ({ products, onSelect, placeholder = "Cari nama atau SKU barang...", disabled }) => {
    const [searchTerm, setSearchTerm] = useState('');

    const filteredProducts = useMemo(() => {
        if (!searchTerm) return [];
        return products.filter(p =>
            p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            p.sku.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [searchTerm, products]);

    const handleSelect = (product) => {
        setSearchTerm('');
        onSelect(product);
    }

    return (
        <div className="relative">
            <input
                type="text"
                placeholder={placeholder}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                disabled={disabled}
            />
            {searchTerm && filteredProducts.length > 0 && (
                <div className="absolute top-full left-0 right-0 bg-white border mt-1 rounded-lg shadow-lg z-10 max-h-60 overflow-y-auto">
                    {filteredProducts.map(p => (
                        <div key={p.id} onClick={() => handleSelect(p)} className="p-2 hover:bg-blue-50 cursor-pointer">
                            {p.name} ({p.sku})
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

// Komponen Halaman Penerimaan Stok
const ReceiveStockPage = ({ products, stockLogs, onReceive }) => {
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [quantity, setQuantity] = useState('');
    const [notes, setNotes] = useState('');

    const receptionHistory = useMemo(() => {
        // Menggunakan StockLogType dari types.js agar aman dari salah ketik
        return stockLogs.filter(log => log.type === StockLogType.Penerimaan);
    }, [stockLogs]);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!selectedProduct || !quantity || Number(quantity) <= 0) {
            alert("Harap pilih barang dan isi jumlah masuk dengan benar.");
            return;
        }
        onReceive(selectedProduct.id, Number(quantity), notes);
        setSelectedProduct(null);
        setQuantity('');
        setNotes('');
        alert(`Stok ${selectedProduct.name} berhasil ditambahkan.`);
    }

    return (
        <div className="space-y-8">
            <div className="bg-white p-6 rounded-lg shadow-sm">
                <h3 className="text-lg font-semibold mb-4">Form Penerimaan Stok (Stok Masuk)</h3>
                <form onSubmit={handleSubmit} className="space-y-4 max-w-2xl">
                    <div>
                        <label className="block text-sm font-medium text-slate-700">Pilih Barang</label>
                        <ProductSearchableInput products={products} onSelect={setSelectedProduct} disabled={!!selectedProduct} />
                    </div>
                    {selectedProduct && (
                        <div className="bg-slate-50 p-4 rounded-md border border-slate-200 space-y-3 animate-fade-in">
                            <div className="flex justify-between items-center">
                                <h4 className="font-semibold">{selectedProduct.name}</h4>
                                <button type="button" onClick={() => setSelectedProduct(null)} className="text-sm text-red-600 hover:underline">Ganti Barang</button>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700">Stok Saat Ini</label>
                                <input type="text" value={`${selectedProduct.stock} ${selectedProduct.unit}`} readOnly className="mt-1 block w-full px-3 py-2 bg-slate-200 border border-slate-300 rounded-md shadow-sm" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700">Jumlah Masuk</label>
                                <input type="number" value={quantity} onChange={(e) => setQuantity(e.target.value)} required min="1" className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700">Keterangan (misal, No. Faktur)</label>
                                <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"></textarea>
                            </div>
                            <div className="flex justify-end pt-2">
                                <button type="submit" className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600">Simpan Stok Masuk</button>
                            </div>
                        </div>
                    )}
                </form>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold">Riwayat Penerimaan Stok</h3>
                    <button
                        onClick={() => exportStockLogsToExcel(receptionHistory, 'Riwayat_Penerimaan_Stok')}
                        disabled={receptionHistory.length === 0}
                        className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md text-sm hover:bg-green-700 disabled:bg-slate-300 disabled:cursor-not-allowed"
                    >
                        <DownloadIcon className="w-4 h-4" /> Download (.xlsx)
                    </button>
                </div>
                <div className="max-h-64 overflow-y-auto">
                    <table className="w-full text-sm text-left text-slate-500">
                        <thead className="text-xs text-slate-700 uppercase bg-slate-50 sticky top-0">
                            <tr>
                                <th className="px-4 py-2">Tanggal</th><th className="px-4 py-2">Nama Barang</th><th className="px-4 py-2">Jumlah Masuk</th><th className="px-4 py-2">Stok Akhir</th><th className="px-4 py-2">Keterangan</th>
                            </tr>
                        </thead>
                        <tbody>
                            {receptionHistory.map(log => (
                                <tr key={log.id} className="border-b">
                                    <td className="px-4 py-2 text-xs">{formatDate(log.date)}</td>
                                    <td className="px-4 py-2 font-medium">{log.productName}</td>
                                    <td className={`px-4 py-2 font-bold text-green-600`}>+{log.quantityChange}</td>
                                    <td className="px-4 py-2 font-semibold">{log.newStock}</td>
                                    <td className="px-4 py-2 text-xs">{log.notes}</td>
                                </tr>
                            ))}
                            {receptionHistory.length === 0 && (
                                <tr><td colSpan="5" className="text-center p-4 text-slate-500">Belum ada riwayat penerimaan stok.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

// Komponen Halaman Penyesuaian Stok
const AdjustStockPage = ({ products, stockLogs, onAdjust }) => {
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [physicalStock, setPhysicalStock] = useState('');
    const [notes, setNotes] = useState('');

    const adjustmentHistory = useMemo(() => {
        // Menggunakan StockLogType agar aman dari salah ketik
        return stockLogs.filter(log => log.type === StockLogType.Penyesuaian);
    }, [stockLogs]);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!selectedProduct || physicalStock === '' || !notes.trim()) {
            alert("Harap pilih barang, isi stok fisik, dan berikan keterangan penyesuaian.");
            return;
        }
        onAdjust(selectedProduct.id, Number(physicalStock), notes);
        setSelectedProduct(null);
        setPhysicalStock('');
        setNotes('');
        alert(`Stok ${selectedProduct.name} berhasil disesuaikan.`);
    }

    return (
        <div className="space-y-8">
            <div className="bg-white p-6 rounded-lg shadow-sm">
                <h3 className="text-lg font-semibold mb-4">Form Penyesuaian Stok (Stock Opname)</h3>
                <form onSubmit={handleSubmit} className="space-y-4 max-w-2xl">
                    <div>
                        <label className="block text-sm font-medium text-slate-700">Pilih Barang</label>
                        <ProductSearchableInput products={products} onSelect={setSelectedProduct} disabled={!!selectedProduct} />
                    </div>
                    {selectedProduct && (
                        <div className="bg-slate-50 p-4 rounded-md border border-slate-200 space-y-3 animate-fade-in">
                            <div className="flex justify-between items-center">
                                <h4 className="font-semibold">{selectedProduct.name}</h4>
                                <button type="button" onClick={() => setSelectedProduct(null)} className="text-sm text-red-600 hover:underline">Ganti Barang</button>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700">Stok Sistem</label>
                                <input type="text" value={`${selectedProduct.stock} ${selectedProduct.unit}`} readOnly className="mt-1 block w-full px-3 py-2 bg-slate-200 border border-slate-300 rounded-md shadow-sm" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700">Stok Fisik Sebenarnya</label>
                                <input type="number" value={physicalStock} onChange={(e) => setPhysicalStock(e.target.value)} required min="0" className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700">Keterangan (Wajib diisi, misal: "Rusak", "Hilang", "Hasil Stock Opname Bulanan")</label>
                                <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} required className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"></textarea>
                            </div>
                            <div className="flex justify-end pt-2">
                                <button type="submit" className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600">Simpan Penyesuaian</button>
                            </div>
                        </div>
                    )}
                </form>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold">Riwayat Penyesuaian Stok</h3>
                    <button
                        onClick={() => exportStockLogsToExcel(adjustmentHistory, 'Riwayat_Penyesuaian_Stok')}
                        disabled={adjustmentHistory.length === 0}
                        className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md text-sm hover:bg-green-700 disabled:bg-slate-300 disabled:cursor-not-allowed"
                    >
                        <DownloadIcon className="w-4 h-4" /> Download (.xlsx)
                    </button>
                </div>
                <div className="max-h-64 overflow-y-auto">
                    <table className="w-full text-sm text-left text-slate-500">
                        <thead className="text-xs text-slate-700 uppercase bg-slate-50 sticky top-0">
                            <tr>
                                <th className="px-4 py-2">Tanggal</th><th className="px-4 py-2">Nama Barang</th><th className="px-4 py-2">Perubahan</th><th className="px-4 py-2">Stok Akhir</th><th className="px-4 py-2">Keterangan</th>
                            </tr>
                        </thead>
                        <tbody>
                            {adjustmentHistory.map(log => (
                                <tr key={log.id} className="border-b">
                                    <td className="px-4 py-2 text-xs">{formatDate(log.date)}</td>
                                    <td className="px-4 py-2 font-medium">{log.productName}</td>
                                    <td className={`px-4 py-2 font-bold ${log.quantityChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                        {log.quantityChange >= 0 ? `+${log.quantityChange}` : log.quantityChange}
                                    </td>
                                    <td className="px-4 py-2 font-semibold">{log.newStock}</td>
                                    <td className="px-4 py-2 text-xs">{log.notes}</td>
                                </tr>
                            ))}
                            {adjustmentHistory.length === 0 && (
                                <tr><td colSpan="5" className="text-center p-4 text-slate-500">Belum ada riwayat penyesuaian stok.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

// Komponen Daftar Produk
const ProductList = ({ products, onEdit, onDelete, onExport }) => { // 1. Terima 'onEdit' di sini
    const [filter, setFilter] = useState('');
    const filteredProducts = useMemo(() =>
        products.filter(p => p.name.toLowerCase().includes(filter.toLowerCase()) || p.sku.toLowerCase().includes(filter.toLowerCase())),
        [filter, products]
    );

    return (
        <div>
            <div className="flex flex-col sm:flex-row justify-between items-center mb-4 gap-4">
                <input
                    type="text"
                    placeholder="Cari barang..."
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                    className="w-full sm:w-auto px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                    onClick={() => onExport(filteredProducts)}
                    disabled={filteredProducts.length === 0}
                    className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md text-sm hover:bg-green-700 disabled:bg-slate-300"
                >
                    <DownloadIcon className="w-4 h-4" /> Download (.xlsx)
                </button>
            </div>

            {/* Container untuk daftar produk yang responsif */}
            <div className="space-y-4 lg:space-y-0">
                {/* Header Tabel - HANYA MUNCUL DI DESKTOP (lg) */}
                <div className="hidden lg:grid grid-cols-6 gap-4 px-6 py-3 bg-slate-50 text-xs font-medium text-slate-700 uppercase rounded-t-lg">
                    <span>SKU</span><span>Nama Barang</span><span>Harga Beli</span><span>Harga Jual</span><span>Stok</span><span>Aksi</span>
                </div>

                {/* Daftar Produk */}
                {filteredProducts.length > 0 ? (
                    filteredProducts.map(p => (
                        <div key={p.id} className="bg-white p-4 rounded-lg shadow-sm lg:shadow-none lg:rounded-none lg:p-0 lg:grid lg:grid-cols-6 lg:gap-4 lg:items-center lg:border-b">
                            {/* Tampilan Kartu untuk Mobile (di bawah lg) */}
                            <div className="lg:hidden">
                                <div className="flex justify-between items-start mb-2">
                                    <div><p className="font-bold text-slate-800">{p.name}</p><p className="text-xs text-slate-500">SKU: {p.sku}</p></div>
                                    <div className="flex items-center gap-4">
                                        {/* 2. Gunakan 'onEdit' di sini */}
                                        <button onClick={() => onEdit(p)} className="font-medium text-blue-600">Edit</button>
                                        <button onClick={() => { if (window.confirm(`Yakin ingin hapus ${p.name}?`)) onDelete(p.id) }} className="font-medium text-red-600">Hapus</button>
                                    </div>
                                </div>
                                <div className="grid grid-cols-3 gap-2 text-sm border-t pt-2">
                                    <div className="text-center"><p className="text-xs text-slate-500">Harga Beli</p><p className="font-semibold">{formatCurrency(p.purchasePrice)}</p></div>
                                    <div className="text-center"><p className="text-xs text-slate-500">Harga Jual</p><p className="font-semibold">{formatCurrency(p.sellPrice)}</p></div>
                                    <div className="text-center"><p className="text-xs text-slate-500">Stok</p><p className={`font-bold ${p.stock < 10 ? 'text-red-500' : 'text-slate-800'}`}>{p.stock} {p.unit}</p></div>
                                </div>
                            </div>

                            {/* Tampilan Baris Tabel untuk Desktop (lg dan ke atas) */}
                            <div className="hidden lg:flex items-center px-6 py-4 font-medium text-slate-900">{p.sku}</div>
                            <div className="hidden lg:flex items-center px-6 py-4">{p.name}</div>
                            <div className="hidden lg:flex items-center px-6 py-4">{formatCurrency(p.purchasePrice)}</div>
                            <div className="hidden lg:flex items-center px-6 py-4">{formatCurrency(p.sellPrice)}</div>
                            <div className={`hidden lg:flex items-center px-6 py-4 font-bold ${p.stock < 10 ? 'text-red-500' : 'text-slate-800'}`}>{p.stock} {p.unit}</div>
                            <div className="hidden lg:flex items-center px-6 py-4">
                                {/* 2. Gunakan 'onEdit' di sini juga */}
                                <button onClick={() => onEdit(p)} className="font-medium text-blue-600 hover:underline mr-4">Edit</button>
                                <button onClick={() => { if (window.confirm(`Yakin ingin hapus ${p.name}?`)) onDelete(p.id) }} className="font-medium text-red-600 hover:underline">Hapus</button>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="text-center py-10 text-slate-500 bg-white rounded-lg shadow-sm">Tidak ada produk yang cocok.</div>
                )}
            </div>
        </div>
    );
};

// Komponen Form Tambah Produk
const AddProductForm = ({ onSave, onCancel }) => {
    const [formState, setFormState] = useState({ sku: '', name: '', purchasePrice: 0, sellPrice: 0, stock: 0, unit: 'Pcs' });

    const handleChange = (e) => {
        const { name, value } = e.target;
        const isNumericField = name.includes('Price') || name === 'stock';
        setFormState(prev => ({
            ...prev,
            [name]: isNumericField ? (value === '' ? '' : Number(value)) : value
        }));
    }

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!formState.name || !formState.sku || formState.sellPrice <= 0) {
            alert('Harap isi SKU, Nama Barang, dan Harga Jual.');
            return;
        }
        onSave(formState);
        onCancel();
    }
    return (
        <div className="bg-white p-6 rounded-lg shadow-sm max-w-2xl mx-auto animate-fade-in">
            <h3 className="text-lg font-semibold mb-4">Tambah Barang Baru</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700">Kode Barang (SKU)</label>
                        <input type="text" name="sku" value={formState.sku} onChange={handleChange} className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" required />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700">Nama Barang</label>
                        <input type="text" name="name" value={formState.name} onChange={handleChange} className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" required />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700">Harga Beli (HPP)</label>
                        <input type="number" name="purchasePrice" value={formState.purchasePrice} onChange={handleChange} className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700">Harga Jual</label>
                        <input type="number" name="sellPrice" value={formState.sellPrice} onChange={handleChange} className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" required min="1" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700">Stok Awal</label>
                        <input type="number" name="stock" value={formState.stock} onChange={handleChange} className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700">Satuan</label>
                        <select
                            name="unit"
                            value={formState.unit}
                            onChange={handleChange}
                            className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        >
                            {PRODUCT_UNITS.map(unit => (
                                <option key={unit} value={unit}>{unit}</option>
                            ))}
                        </select>
                    </div>
                </div>
                <div className="flex justify-end gap-3 pt-4">
                    <button type="button" onClick={onCancel} className="px-4 py-2 bg-slate-200 text-slate-800 rounded-md hover:bg-slate-300">Batal</button>
                    <button type="submit" className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600">Simpan Barang</button>
                </div>
            </form>
        </div>
    )
}

// Komponen Modal Edit Produk
const EditProductModal = ({ product, onSave, onCancel }) => {
    const [formState, setFormState] = useState(product);

    const handleChange = (e) => {
        const { name, value } = e.target;
        const isNumericField = name.includes('Price');
        setFormState(prev => ({
            ...prev,
            [name]: isNumericField ? (value === '' ? '' : Number(value)) : value
        }));
    }

    const handleSubmit = (e) => { e.preventDefault(); onSave(formState); }

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-xl max-w-2xl w-full animate-fade-in-up">
                <h3 className="text-lg font-semibold mb-4">Edit Barang: {product.name}</h3>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div><label className="block text-sm font-medium text-slate-700">Kode Barang (SKU)</label><input type="text" name="sku" value={formState.sku} onChange={handleChange} className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm" required /></div>
                        <div><label className="block text-sm font-medium text-slate-700">Nama Barang</label><input type="text" name="name" value={formState.name} onChange={handleChange} className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm" required /></div>
                        <div><label className="block text-sm font-medium text-slate-700">Harga Beli (HPP)</label><input type="number" name="purchasePrice" value={formState.purchasePrice} onChange={handleChange} className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm" /></div>
                        <div><label className="block text-sm font-medium text-slate-700">Harga Jual</label><input type="number" name="sellPrice" value={formState.sellPrice} onChange={handleChange} className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm" required /></div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700">Satuan</label>
                            <select
                                name="unit"
                                value={formState.unit}
                                onChange={handleChange}
                                className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm"
                            >
                                {PRODUCT_UNITS.map(unit => (
                                    <option key={unit} value={unit}>{unit}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                    <p className="text-xs text-slate-500">Catatan: Jumlah stok tidak dapat diubah di sini. Gunakan menu Penyesuaian Stok.</p>
                    <div className="flex justify-end gap-3 pt-4">
                        <button type="button" onClick={onCancel} className="px-4 py-2 bg-slate-200 text-slate-800 rounded-md hover:bg-slate-300">Batal</button>
                        <button type="submit" className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600">Simpan Perubahan</button>
                    </div>
                </form>
            </div>
        </div>
    );
}

// Komponen Utama Manajemen Stok
const StockManagement = ({ products, stockLogs, addProduct, updateProduct, deleteProduct, receiveStock, adjustStock }) => {
    const [activeTab, setActiveTab] = useState('list');
    const [showAddForm, setShowAddForm] = useState(false);
    const [editingProduct, setEditingProduct] = useState(null);

    const handleSaveEdit = (p) => {
        updateProduct(p);
        setEditingProduct(null);
    }

    const renderContent = () => {
        if (showAddForm) {
            return <AddProductForm onCancel={() => setShowAddForm(false)} onSave={addProduct} />;
        }

        switch (activeTab) {
            case 'list':
                return <ProductList
                    products={products}
                    onEdit={setEditingProduct}
                    onDelete={deleteProduct}
                    onExport={exportProductsToExcel}
                />;
            case 'receive':
                return <ReceiveStockPage products={products} stockLogs={stockLogs} onReceive={receiveStock} />;
            case 'adjust':
                return <AdjustStockPage products={products} stockLogs={stockLogs} onAdjust={adjustStock} />;
            default:
                return null;
        }
    };

    return (
        <div className="p-4 sm:p-8">
            {editingProduct && <EditProductModal product={editingProduct} onCancel={() => setEditingProduct(null)} onSave={handleSaveEdit} />}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
                <h1 className="text-3xl font-bold text-slate-800 mb-4 sm:mb-0">Manajemen Stok</h1>
                {!showAddForm && activeTab === 'list' && (
                    <button onClick={() => setShowAddForm(true)} className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600">
                        Tambah Barang Baru
                    </button>
                )}
            </div>

            {!showAddForm && (
                <div className="mb-6 border-b border-slate-200">
                    <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                        <button onClick={() => setActiveTab('list')} className={`${activeTab === 'list' ? 'border-blue-500 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}>Daftar Barang</button>
                        <button onClick={() => setActiveTab('receive')} className={`${activeTab === 'receive' ? 'border-blue-500 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}>Penerimaan Stok</button>
                        <button onClick={() => setActiveTab('adjust')} className={`${activeTab === 'adjust' ? 'border-blue-500 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}>Penyesuaian Stok</button>
                    </nav>
                </div>
            )}

            <div>{renderContent()}</div>
        </div>
    );
};

export default StockManagement;