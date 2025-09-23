import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { formatCurrency } from '../lib/helpers.js';
import { AlertTriangleIcon } from './Icons.jsx';

const StatCard = ({ title, value, className }) => (
  <div className={`bg-white p-6 rounded-lg shadow-sm ${className}`}>
    <h3 className="text-sm font-medium text-slate-500">{title}</h3>
    <p className="text-3xl font-bold text-slate-800 mt-2">{value}</p>
  </div>
);

const Dashboard = ({ products, transactions }) => {
  // Helper function untuk mendapatkan tanggal hari ini dalam format YYYY-MM-DD
  const getTodayDateString = () => {
    const today = new Date();
    return today.toISOString().split('T')[0]; // Format: YYYY-MM-DD
  };

  // Helper function untuk mengkonversi tanggal ke format YYYY-MM-DD
  const getDateString = (date) => {
    if (typeof date === 'string') {
      // Jika sudah string, ambil bagian tanggal saja
      return date.split('T')[0];
    }
    if (date instanceof Date) {
      return date.toISOString().split('T')[0];
    }
    // Fallback: coba parse sebagai Date
    return new Date(date).toISOString().split('T')[0];
  };

  const todayString = getTodayDateString();

  // Filter transaksi hari ini dengan perbandingan string tanggal
  const todaysTransactions = transactions.filter(t => {
    try {
      const transactionDateString = getDateString(t.date);
      return transactionDateString === todayString;
    } catch (error) {
      console.warn('Error parsing transaction date:', t.date, error);
      return false;
    }
  });

  console.log('Today:', todayString);
  console.log('Today\'s transactions:', todaysTransactions);
  console.log('All transactions:', transactions.map(t => ({ id: t.id, date: t.date, dateString: getDateString(t.date) })));

  const todaysRevenue = todaysTransactions.reduce((sum, t) => sum + t.total, 0);
  const todaysTransactionsCount = todaysTransactions.length;
  
  const todaysGrossProfit = useMemo(() => {
    return todaysTransactions.reduce((sum, t) => {
      const cost = t.items.reduce((itemSum, item) => {
          const product = products.find(p => p.id === item.id);
          const purchasePrice = product ? product.purchasePrice : 0;
          return itemSum + (purchasePrice * item.quantity);
      }, 0);
      return sum + (t.total - cost);
    }, 0);
  }, [todaysTransactions, products]);

  const topProducts = useMemo(() => {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const sevenDaysAgoString = sevenDaysAgo.toISOString().split('T')[0];

    const recentTransactions = transactions.filter(t => {
      try {
        const transactionDateString = getDateString(t.date);
        return transactionDateString >= sevenDaysAgoString;
      } catch (error) {
        return false;
      }
    });

    const productSales = new Map();
    recentTransactions.forEach(t => {
      t.items.forEach(item => {
        productSales.set(item.name, (productSales.get(item.name) || 0) + item.quantity);
      });
    });
    return Array.from(productSales.entries())
      .sort(([, qtyA], [, qtyB]) => qtyB - qtyA)
      .slice(0, 5);
  }, [transactions]);

  const criticalStockProducts = products.filter(p => p.stock < 10);

  const weeklySalesData = useMemo(() => {
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - i);
      return d.toISOString().split('T')[0];
    }).reverse();

    return last7Days.map(dateString => {
      const dailyRevenue = transactions
        .filter(t => {
          try {
            const transactionDateString = getDateString(t.date);
            return transactionDateString === dateString;
          } catch (error) {
            return false;
          }
        })
        .reduce((sum, t) => sum + t.total, 0);

      const dateObj = new Date(dateString);
      return {
        name: dateObj.toLocaleDateString('id-ID', { weekday: 'short' }),
        Penjualan: dailyRevenue,
      };
    });
  }, [transactions]);

  return (
    <div className="p-4 sm:p-8 space-y-8">
      <h1 className="text-3xl font-bold text-slate-800">Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard title="Pendapatan Hari Ini" value={formatCurrency(todaysRevenue)} />
        <StatCard title="Total Transaksi Hari Ini" value={todaysTransactionsCount.toString()} />
        <StatCard title="Laba Kotor Hari Ini" value={formatCurrency(todaysGrossProfit)} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white p-6 rounded-lg shadow-sm">
          <h3 className="text-lg font-semibold text-slate-800 mb-4">Grafik Penjualan Mingguan</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={weeklySalesData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis tickFormatter={(value) => new Intl.NumberFormat('id-ID', { notation: 'compact', compactDisplay: 'short' }).format(Number(value))} />
              <Tooltip formatter={(value) => [formatCurrency(value), 'Penjualan']} />
              <Legend />
              <Bar dataKey="Penjualan" fill="#3b82f6" />
            </BarChart>
          </ResponsiveContainer>
        </div>
        
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h3 className="text-lg font-semibold text-slate-800 mb-4">Produk Terlaris (7 Hari Terakhir)</h3>
            <ul className="space-y-2">
              {topProducts.map(([name, quantity], index) => (
                <li key={name} className="flex justify-between items-center text-sm">
                  <span className="text-slate-600">{index + 1}. {name}</span>
                  <span className="font-semibold text-slate-800">{quantity} terjual</span>
                </li>
              ))}
            </ul>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center">
              <AlertTriangleIcon className="w-5 h-5 text-amber-500 mr-2" />
              Stok Kritis
            </h3>
            {criticalStockProducts.length > 0 ? (
              <ul className="space-y-2">
                {criticalStockProducts.map(p => (
                  <li key={p.id} className="flex justify-between items-center text-sm">
                    <span className="text-slate-600">{p.name}</span>
                    <span className="font-semibold text-red-500">{p.stock} {p.unit}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-slate-500">Tidak ada produk dengan stok kritis.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;