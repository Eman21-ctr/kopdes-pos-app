// types.js

/**
 * Mendefinisikan peran pengguna dalam aplikasi.
 * Sebelumnya adalah TypeScript Enum.
 */
export const UserRole = {
  Admin: 'Admin',
  Kasir: 'Kasir',
};

/**
 * Mendefinisikan metode pembayaran yang tersedia.
 * Sebelumnya adalah TypeScript Enum.
 */
export const PaymentMethod = {
  Tunai: 'Tunai',
  QRIS: 'QRIS',
  Transfer: 'Transfer Bank',
};

/**
 * Mendefinisikan tipe-tipe log stok.
 * Sebelumnya adalah TypeScript Type Alias.
 */
export const StockLogType = {
  Penerimaan: 'Penerimaan',
  Penyesuaian: 'Penyesuaian',
  Penjualan: 'Penjualan',
};

// NOTE: Semua 'interface' dan 'type' dari TypeScript telah dihapus
// karena mereka tidak ada di JavaScript standar.
// Kode akan tetap berfungsi, namun tanpa pemeriksaan tipe statis
// saat proses development.