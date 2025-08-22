import React, { useState, useMemo } from 'react';
import { PaymentMethod } from '../lib/types.js'; // Diperbaiki: path ke types.js
import { formatCurrency } from '../lib/helpers.js';
import { PlusCircleIcon, MinusCircleIcon, TrashIcon } from './Icons.jsx';

const POS = ({ products, members, addTransaction }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [cart, setCart] = useState([]);
  const [customerName, setCustomerName] = useState('');
  const [showCustomerSuggestions, setShowCustomerSuggestions] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState(PaymentMethod.Tunai);
  const [amountPaid, setAmountPaid] = useState(0);
  const [transactionDate, setTransactionDate] = useState(new Date()); // <-- TAMBAHKAN INI

  const filteredProducts = useMemo(() => {
    if (!searchTerm) return [];
    return products.filter(p =>
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchTerm.toLowerCase())
    ).slice(0, 10);
  }, [searchTerm, products]);
  
  const filteredMembers = useMemo(() => {
    if (!customerName) return [];
    return members.filter(m => m.name.toLowerCase().includes(customerName.toLowerCase()));
  }, [customerName, members]);
  
  const selectCustomer = (member) => {
    setCustomerName(member.name);
    setShowCustomerSuggestions(false);
  }

  const addToCart = (product) => {
    setCart(currentCart => {
      const existingItem = currentCart.find(item => item.id === product.id);
      if (existingItem) {
        if(existingItem.quantity < product.stock) {
            return currentCart.map(item =>
                item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
            );
        }
        return currentCart; // Do nothing if stock is full
      }
      return [...currentCart, { ...product, quantity: 1 }];
    });
    setSearchTerm('');
  };

  const updateQuantity = (productId, delta) => {
    setCart(currentCart => {
      return currentCart.map(item => {
        if (item.id === productId) {
          const newQuantity = item.quantity + delta;
          if (newQuantity > 0 && newQuantity <= item.stock) {
            return { ...item, quantity: newQuantity };
          }
        }
        return item;
      }).filter(item => item && item.quantity > 0);
    });
  };

  const removeFromCart = (productId) => {
    setCart(currentCart => currentCart.filter(item => item.id !== productId));
  };

  const subtotal = useMemo(() => cart.reduce((sum, item) => sum + (item.sellPrice * item.quantity), 0), [cart]);
  const change = useMemo(() => (paymentMethod === PaymentMethod.Tunai && amountPaid >= subtotal) ? amountPaid - subtotal : 0, [amountPaid, subtotal, paymentMethod]);

  const handlePayment = () => {
    if (cart.length === 0) return;
    if (paymentMethod === PaymentMethod.Tunai && amountPaid < subtotal) {
      alert('Uang tunai tidak cukup!');
      return;
    }

    addTransaction({
      date: transactionDate, // <-- TAMBAHKAN BARIS INI
      items: cart,
      total: subtotal,
      paymentMethod,
      customerName: customerName.trim() || 'Pelanggan Umum',
      amountPaid: paymentMethod === PaymentMethod.Tunai ? amountPaid : subtotal,
      change,
    });
    
    setCart([]);
    setCustomerName('');
    setShowPaymentModal(false);
    setAmountPaid(0);
    setPaymentMethod(PaymentMethod.Tunai);
  };

  return (
    <div className="flex flex-col lg:flex-row h-full bg-slate-100">
      <div className="w-full lg:w-2/5 bg-white p-4 lg:p-6 flex flex-col shadow-lg">
        <h2 className="text-2xl font-bold text-slate-800 mb-4">Daftar Belanja</h2>
        <div className="flex-grow overflow-y-auto -mr-6 pr-6">
          {cart.length === 0 ? (
            <div className="flex items-center justify-center h-full"><p className="text-slate-500">Keranjang masih kosong</p></div>
          ) : (
            <div className="space-y-3">
              {cart.map(item => (
                <div key={item.id} className="flex items-center bg-slate-50 p-3 rounded-lg">
                  <div className="flex-grow"><p className="font-semibold text-slate-700">{item.name}</p><p className="text-sm text-slate-500">{formatCurrency(item.sellPrice)} x {item.quantity}</p></div>
                  <div className="flex items-center space-x-2"><button onClick={() => updateQuantity(item.id, -1)} className="text-slate-400 hover:text-red-500"><MinusCircleIcon className="w-6 h-6"/></button><span className="w-8 text-center font-medium">{item.quantity}</span><button onClick={() => updateQuantity(item.id, 1)} className="text-slate-400 hover:text-blue-500"><PlusCircleIcon className="w-6 h-6"/></button><button onClick={() => removeFromCart(item.id)} className="text-red-500 hover:text-red-700 ml-2"><TrashIcon className="w-5 h-5"/></button></div>
                  <p className="w-28 text-right font-bold text-slate-800">{formatCurrency(item.sellPrice * item.quantity)}</p>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="border-t pt-4 mt-4 space-y-4">
        {/* === INPUT TANGGAL BARU DITAMBAHKAN DI SINI === */}
    <div>
        <label htmlFor="transaction-date" className="block text-sm font-medium text-slate-700">Tanggal Transaksi</label>
        <input
            type="date"
            id="transaction-date"
            value={transactionDate.toISOString().split('T')[0]}
            onChange={(e) => setTransactionDate(new Date(e.target.value))}
            className="mt-1 w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
    </div>
    {/* === AKHIR BAGIAN BARU === */}
          <div className="relative"><input type="text" placeholder="Nama Pelanggan (Opsional)" value={customerName} onChange={(e) => { setCustomerName(e.target.value); if(e.target.value){ setShowCustomerSuggestions(true); } }} onFocus={() => { if(customerName) setShowCustomerSuggestions(true) }} onBlur={() => setTimeout(() => setShowCustomerSuggestions(false), 200)} className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"/>
            {showCustomerSuggestions && filteredMembers.length > 0 && (
              <div className="absolute bottom-full mb-1 left-0 right-0 bg-white border rounded-lg shadow-lg z-20 max-h-48 overflow-y-auto">{filteredMembers.map(member => (<div key={member.id} onMouseDown={() => selectCustomer(member)} className="px-4 py-2 hover:bg-blue-50 cursor-pointer">{member.name}</div>))}</div>
            )}
          </div>
          <div className="flex justify-between items-center text-xl font-bold"><span>Total</span><span>{formatCurrency(subtotal)}</span></div>
          <button onClick={() => setShowPaymentModal(true)} disabled={cart.length === 0} className="w-full bg-blue-500 text-white py-3 rounded-lg font-semibold hover:bg-blue-600 disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors">Bayar</button>
        </div>
      </div>
      
      <div className="w-full lg:w-3/5 p-4 lg:p-8 flex-grow"><div className="relative"><input type="text" placeholder="Cari Barang (Nama atau SKU)" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full px-4 py-3 text-lg border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"/>
          {searchTerm && (
            <div className="absolute top-full left-0 right-0 bg-white border mt-1 rounded-lg shadow-lg z-10 max-h-80 overflow-y-auto">
              {filteredProducts.map(p => (<div key={p.id} onClick={() => addToCart(p)} className="px-4 py-3 hover:bg-blue-50 cursor-pointer flex justify-between items-center"><div><p className="font-semibold">{p.name}</p><p className="text-sm text-slate-500">Stok: {p.stock} | {formatCurrency(p.sellPrice)}</p></div><button className="text-blue-500"><PlusCircleIcon className="w-6 h-6"/></button></div>))}
              {filteredProducts.length === 0 && <p className="text-center text-slate-500 p-4">Barang tidak ditemukan.</p>}
            </div>
          )}
        </div>
         <div className="hidden md:grid mt-8 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 overflow-y-auto" style={{maxHeight: 'calc(100vh - 200px)'}}>{products.slice(0, 12).map(p => (<div key={p.id} onClick={() => addToCart(p)} className="bg-white p-4 rounded-lg shadow-sm cursor-pointer hover:shadow-md hover:-translate-y-1 transition-transform">
                    <div className="w-full h-24 bg-slate-200 rounded-md mb-2 flex items-center justify-center"><span className="text-slate-400 text-xs">Gambar Produk</span></div><h3 className="font-semibold text-sm truncate">{p.name}</h3><p className="text-blue-600 font-bold">{formatCurrency(p.sellPrice)}</p><p className="text-xs text-slate-500">Stok: {p.stock}</p></div>))}
        </div>
      </div>

      {showPaymentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-8 w-full max-w-md">
            <h2 className="text-2xl font-bold mb-6 text-center">Pembayaran</h2>
            <div className="flex justify-between items-center text-3xl font-bold mb-6"><span>Total:</span><span>{formatCurrency(subtotal)}</span></div>
            <div className="mb-4"><label className="font-semibold mb-2 block">Metode Pembayaran</label><div className="flex space-x-2">{Object.values(PaymentMethod).map(method => (<button key={method} onClick={() => setPaymentMethod(method)} className={`flex-1 py-2 rounded-md transition-colors ${paymentMethod === method ? 'bg-blue-500 text-white' : 'bg-slate-200 text-slate-700 hover:bg-slate-300'}`}>{method}</button>))}</div></div>
            {paymentMethod === PaymentMethod.Tunai && (<div className="mb-4"><label htmlFor="amountPaid" className="font-semibold mb-2 block">Uang Dibayar</label><input id="amountPaid" type="number" value={amountPaid || ''} onChange={(e) => setAmountPaid(Number(e.target.value))} className="w-full px-4 py-2 text-lg border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-right" autoFocus onKeyDown={(e) => { if(e.key === 'Enter') handlePayment() }}/></div>)}
            {paymentMethod === PaymentMethod.Tunai && (<div className="flex justify-between items-center text-xl font-bold mb-6 mt-4"><span>Kembali:</span><span className={change > 0 ? 'text-green-600' : ''}>{formatCurrency(change)}</span></div>)}
            <div className="flex justify-end space-x-4 mt-8"><button onClick={() => setShowPaymentModal(false)} className="px-6 py-2 bg-slate-200 rounded-md hover:bg-slate-300">Batal</button><button onClick={handlePayment} className="px-6 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600">Selesaikan Transaksi</button></div>
          </div>
        </div>
      )}
    </div>
  );
};

export default POS;