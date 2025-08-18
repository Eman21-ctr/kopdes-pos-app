import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

export const formatCurrency = (amount) => {
  // Handle non-numeric or undefined inputs gracefully
  if (typeof amount !== 'number') {
    amount = 0;
  }
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0, // No decimal for Rupiah
    maximumFractionDigits: 0
  }).format(amount);
};

export const formatDate = (date) => {
  // Handle different date inputs (Date object, Firestore Timestamp)
  const dateObj = date && typeof date.toDate === 'function' ? date.toDate() : new Date(date);
  if (isNaN(dateObj)) { // Check if the date is valid
    return 'Tanggal tidak valid';
  }
  return new Intl.DateTimeFormat('id-ID', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(dateObj);
};

const downloadCSV = (csvContent, fileName) => {
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", fileName);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
};

const convertToCSV = (headers, data) => {
    const headerRow = headers.join(',');
    const dataRows = data.map(row => 
        row.map(field => {
            const str = String(field ?? ''); // handle null/undefined
            if (str.includes(',') || str.includes('"') || str.includes('\n')) {
                return `"${str.replace(/"/g, '""')}"`; // Quote fields with special chars
            }
            return str;
        }).join(',')
    );
    return [headerRow, ...dataRows].join('\n');
}

export const exportTransactionsToCSV = (transactions, startDate, endDate) => {
  const headers = ['No. Transaksi', 'Tanggal & Waktu', 'Nama Kasir', 'Total Belanja', 'Metode Pembayaran', 'Nama Pelanggan'];
  const data = transactions.map(t => [
    t.id, formatDate(t.date), t.cashierName, t.total, t.paymentMethod, t.customerName || '-'
  ]);
  const csvContent = convertToCSV(headers, data);
  const fileName = `transaksi_${startDate.toISOString().split('T')[0]}_to_${endDate.toISOString().split('T')[0]}.csv`;
  downloadCSV(csvContent, fileName);
};

export const exportMemberReportToCSV = (memberData, year) => {
    const headers = ['Peringkat', 'Nama Anggota', 'Jumlah Transaksi', 'Total Belanja'];
    const data = memberData.map((m, index) => [ index + 1, m.name, m.count, m.total ]);
    const csvContent = convertToCSV(headers, data);
    const fileName = `laporan_anggota_${year}.csv`;
    downloadCSV(csvContent, fileName);
};

export const exportProductsToCSV = (products) => {
    const headers = ['SKU', 'Nama Barang', 'Harga Beli', 'Harga Jual', 'Stok', 'Satuan'];
    const data = products.map(p => [ p.sku, p.name, p.purchasePrice, p.sellPrice, p.stock, p.unit ]);
    const csvContent = convertToCSV(headers, data);
    downloadCSV(csvContent, `daftar_barang_${new Date().toISOString().split('T')[0]}.csv`);
};

export const exportStockLogsToCSV = (logs, type) => {
    const headers = ['Tanggal', 'Nama Barang', 'Perubahan', 'Stok Lama', 'Stok Baru', 'Keterangan'];
    const data = logs.map(l => [ formatDate(l.date), l.productName, l.quantityChange, l.oldStock, l.newStock, l.notes || '-' ]);
    const csvContent = convertToCSV(headers, data);
    const typeString = type.toLowerCase().replace(' ', '_');
    downloadCSV(csvContent, `riwayat_${typeString}_${new Date().toISOString().split('T')[0]}.csv`);
};

// Common function for PDF generation
const drawPdf = (content) => {
    const doc = new jsPDF({ unit: 'mm', format: [58, 210] }); // Standard thermal receipt paper width
    doc.setFont('courier', 'normal');
    doc.setFontSize(8);
    content(doc);
    doc.output('dataurlnewwindow'); // Open in a new tab to print
};

export const generateReceiptPDF = (transaction) => {
    drawPdf((doc) => {
        let y = 7;
        const addLine = (text, options = {}) => {
            if (options.isBold) doc.setFont('courier', 'bold');
            const align = options.align || 'left';
            const x = align === 'right' ? 56 : (align === 'center' ? 29 : 2);
            doc.text(text, x, y, { align: align });
            if (options.isBold) doc.setFont('courier', 'normal');
            y += 4;
        };
        const line = () => { y += 0.5; doc.text('--------------------------', 2, y); y += 3; };
        
        addLine('KOPDES MERAH PUTIH', { align: 'center', isBold: true });
        addLine('PENFUI TIMUR', { align: 'center', isBold: true });
        addLine('Jln. Matani Raya', { align: 'center' });
        y += 1; line();
        addLine(formatDate(transaction.date)); y -= 2;
        addLine(`No: ${transaction.id.substring(0, 8)}`); y -= 2;
        addLine(`Kasir: ${transaction.cashierName}`);
        line();

        transaction.items.forEach(item => {
            addLine(item.name); y -= 2;
            const priceString = `${item.quantity}x @${new Intl.NumberFormat('id-ID').format(item.sellPrice)}`;
            const totalString = new Intl.NumberFormat('id-ID').format(item.sellPrice * item.quantity);
            doc.text(priceString, 2, y);
            doc.text(totalString, 56, y, { align: 'right' });
            y += 4;
        });
        line();

        const addTotalLine = (label, value) => {
             doc.text(label, 2, y);
             doc.setFont('courier', 'bold');
             doc.text(value, 56, y, { align: 'right' });
             doc.setFont('courier', 'normal');
             y += 4;
        };
        addTotalLine('Total', formatCurrency(transaction.total));
        addTotalLine(transaction.paymentMethod, formatCurrency(transaction.amountPaid || transaction.total));
        addTotalLine('Kembali', formatCurrency(transaction.change || 0));
        line(); y += 2;
        addLine('Terima kasih telah berbelanja!', { align: 'center' });
    });
};

export const generateDailyReportPDF = (reportData, dateRange) => { // 'date' diubah menjadi 'dateRange'
    // Logika untuk memformat string tanggal, sama seperti di komponen Receipt
    const isSingleDay = new Date(dateRange.start).toDateString() === new Date(dateRange.end).toDateString();
    
    // Kita gunakan format tanggal yang lebih pendek untuk PDF agar muat
    const dateString = isSingleDay
        ? new Date(dateRange.start).toLocaleDateString('id-ID', { dateStyle: 'long' })
        : `${new Date(dateRange.start).toLocaleDateString('id-ID', { dateStyle: 'short' })} - ${new Date(dateRange.end).toLocaleDateString('id-ID', { dateStyle: 'short' })}`;

    drawPdf((doc) => {
        let y = 7;
        const addLine = (text, options = {}) => {
            if (options.isBold) doc.setFont('courier', 'bold');
            const align = options.align || 'left';
            const x = align === 'center' ? 29 : (align === 'right' ? 56 : 2);
            doc.text(text, x, y, { align: align });
            if (options.isBold) doc.setFont('courier', 'normal');
            y += 4;
        };
        const addKeyValueLine = (label, value, isBold = false) => {
            if (isBold) doc.setFont('courier', 'bold');
            doc.text(label, 2, y);
            doc.text(value, 56, y, { align: 'right' });
            if (isBold) doc.setFont('courier', 'normal');
            y += 4;
        }
        const line = () => { y += 0.5; doc.text('--------------------------', 2, y); y += 3; };
    
        addLine('KOPDES MERAH PUTIH', { align: 'center', isBold: true });
        addLine('PENFUI TIMUR', { align: 'center', isBold: true });
        addLine('Jln. Matani Raya', { align: 'center' });
        line();
        addLine('LAPORAN PERIODE', { align: 'center', isBold: true }); // Diubah dari "LAPORAN HARIAN"
        
        // PERUBAHAN: Gunakan dateString yang sudah diformat
        addLine(dateString, { align: 'center' });

        line();
        addKeyValueLine('Omzet', formatCurrency(reportData.totalRevenue));
        addKeyValueLine('HPP', formatCurrency(reportData.totalHPP));
        y+=1; doc.line(2, y-3.5, 56, y-3.5); // Garis pemisah
        addKeyValueLine('Laba Kotor', formatCurrency(reportData.totalGrossProfit), true);
        line();
        addLine('Rincian:', { isBold: true }); y -= 2;
        addKeyValueLine('Tunai', formatCurrency(reportData.cashRevenue));
        addKeyValueLine('Non-Tunai', formatCurrency(reportData.nonCashRevenue));
    });
};