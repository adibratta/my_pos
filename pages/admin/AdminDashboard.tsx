import React, { useState, useRef } from 'react';
import { useStore } from '../../context/StoreContext';
import { Product, Expense, Customer } from '../../types';
import { generateProductDescription, analyzeSales } from '../../services/geminiService';
import { 
  LayoutDashboard, ShoppingBag, Users, History, FileText, 
  Settings, LogOut, Plus, Search, Trash2, Edit2, AlertCircle, TrendingUp,
  MapPin, Phone, Printer, Menu, X
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Link } from 'react-router-dom';

const TabButton = ({ active, onClick, icon: Icon, label }: any) => (
  <button
    onClick={onClick}
    className={`flex items-center space-x-3 w-full p-3 rounded-lg transition-colors ${
      active ? 'bg-accent text-white' : 'text-gray-400 hover:bg-gray-800 hover:text-white'
    }`}
  >
    <Icon size={20} />
    <span className="font-medium">{label}</span>
  </button>
);

const AdminDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  const { 
    products, addProduct, updateProduct, deleteProduct,
    transactions, 
    customers, addCustomer, deleteCustomer,
    expenses, addExpense, deleteExpense,
    settings, updateSettings
  } = useStore();

  const [searchTerm, setSearchTerm] = useState('');
  
  // -- Helper Logic --
  const filteredProducts = products.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()));
  const filteredCustomers = customers.filter(c => c.name.toLowerCase().includes(searchTerm.toLowerCase()));
  const filteredExpenses = expenses.filter(e => e.description.toLowerCase().includes(searchTerm.toLowerCase()));
  
  // -- Transaction & PO Logic --
  const poTransactions = transactions.filter(t => t.isPO);
  const filteredPO = poTransactions.filter(t => 
    t.customerName.toLowerCase().includes(searchTerm.toLowerCase()) || 
    t.id.includes(searchTerm)
  );

  const filteredTransactions = transactions.filter(t => 
    t.id.includes(searchTerm) || t.customerName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // -- Components for Tabs --

  // 1. PRODUCTS & STOCK
  const ProductManager = () => {
    const [isEditing, setIsEditing] = useState(false);
    const [editItem, setEditItem] = useState<Product | null>(null);
    const [formData, setFormData] = useState<Partial<Product>>({ type: 'READY', stock: 0, price: 0, cost: 0 });
    const [generating, setGenerating] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      const productData = {
        id: editItem ? editItem.id : Date.now().toString(),
        name: formData.name!,
        description: formData.description || '',
        price: Number(formData.price),
        cost: Number(formData.cost),
        stock: Number(formData.stock),
        type: formData.type as 'READY' | 'PO',
        poDeadline: formData.poDeadline,
        image: formData.image
      };

      if (isEditing && editItem) {
        updateProduct(productData);
      } else {
        addProduct(productData);
      }
      setIsEditing(false);
      setEditItem(null);
      setFormData({ type: 'READY', stock: 0, price: 0, cost: 0 });
    };

    const handleGenerateDesc = async () => {
        if(!formData.name) return alert("Isi nama produk dulu");
        setGenerating(true);
        const desc = await generateProductDescription(formData.name, formData.type || 'READY');
        setFormData(prev => ({...prev, description: desc}));
        setGenerating(false);
    }

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setFormData(prev => ({ ...prev, image: reader.result as string }));
        };
        reader.readAsDataURL(file);
      }
    };

    if (isEditing) {
      return (
        <div className="bg-white p-4 md:p-6 rounded-lg shadow-md max-w-2xl mx-auto">
          <h2 className="text-xl font-bold mb-4">{editItem ? 'Edit Produk / Stok' : 'Tambah Produk Baru'}</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium mb-1">Nama Produk</label>
                    <input required className="w-full border p-2 rounded" value={formData.name || ''} onChange={e => setFormData({...formData, name: e.target.value})} />
                </div>
                <div>
                    <label className="block text-sm font-medium mb-1">Tipe</label>
                    <select className="w-full border p-2 rounded" value={formData.type} onChange={e => setFormData({...formData, type: e.target.value as any})}>
                        <option value="READY">Ready Stock</option>
                        <option value="PO">Pre-Order</option>
                    </select>
                </div>
            </div>

            {formData.type === 'PO' && (
                <div>
                    <label className="block text-sm font-medium mb-1 text-orange-600">Batas Waktu PO (Deadline)</label>
                    <input required type="date" className="w-full border p-2 rounded border-orange-300" value={formData.poDeadline || ''} onChange={e => setFormData({...formData, poDeadline: e.target.value})} />
                </div>
            )}

            <div>
                <label className="block text-sm font-medium mb-1">Deskripsi</label>
                <div className="flex gap-2">
                    <textarea className="w-full border p-2 rounded" value={formData.description || ''} onChange={e => setFormData({...formData, description: e.target.value})} />
                    <button type="button" onClick={handleGenerateDesc} disabled={generating} className="bg-purple-100 text-purple-700 px-3 py-1 rounded text-xs whitespace-nowrap">
                        {generating ? '...' : '✨ AI'}
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
                <div>
                    <label className="block text-sm font-medium mb-1">Harga Jual</label>
                    <input required type="number" className="w-full border p-2 rounded" value={formData.price} onChange={e => setFormData({...formData, price: Number(e.target.value)})} />
                </div>
                <div>
                    <label className="block text-sm font-medium mb-1">Modal (HPP)</label>
                    <input required type="number" className="w-full border p-2 rounded" value={formData.cost} onChange={e => setFormData({...formData, cost: Number(e.target.value)})} />
                </div>
                <div>
                    <label className="block text-sm font-medium mb-1 bg-yellow-50 px-2 rounded">Stok Sekarang</label>
                    <input required type="number" className="w-full border p-2 rounded font-bold" value={formData.stock} onChange={e => setFormData({...formData, stock: Number(e.target.value)})} />
                </div>
            </div>

            <div>
                <label className="block text-sm font-medium mb-1">Gambar Produk</label>
                <input type="file" accept="image/*" onChange={handleImageUpload} className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-violet-50 file:text-violet-700 hover:file:bg-violet-100"/>
                {formData.image && <img src={formData.image} alt="Preview" className="h-20 w-20 object-cover mt-2 rounded" />}
            </div>

            <div className="flex justify-end space-x-2 mt-6">
                <button type="button" onClick={() => { setIsEditing(false); setEditItem(null); }} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded">Batal</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Simpan</button>
            </div>
          </form>
        </div>
      );
    }

    return (
      <div>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <h2 className="text-xl md:text-2xl font-bold text-gray-800">Manajemen Produk & Stok</h2>
          <button onClick={() => { setFormData({ type: 'READY', stock: 0, price: 0, cost: 0 }); setIsEditing(true); }} className="bg-blue-600 text-white px-4 py-2 rounded flex items-center gap-2 hover:bg-blue-700 w-full md:w-auto justify-center">
            <Plus size={18} /> Tambah Produk
          </button>
        </div>

        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="p-4 border-b">
            <div className="relative">
                <Search className="absolute left-3 top-2.5 text-gray-400" size={20} />
                <input 
                    type="text" 
                    placeholder="Cari produk..." 
                    className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[600px]">
                <thead className="bg-gray-50 text-gray-600 text-sm uppercase">
                <tr>
                    <th className="p-4">Produk</th>
                    <th className="p-4">Tipe</th>
                    <th className="p-4">Stok</th>
                    <th className="p-4">Harga</th>
                    <th className="p-4 text-right">Aksi</th>
                </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                {filteredProducts.map(product => {
                    const isExpired = product.type === 'PO' && product.poDeadline && new Date(product.poDeadline) < new Date();
                    return (
                    <tr key={product.id} className={`hover:bg-gray-50 ${isExpired ? 'bg-gray-100 opacity-60' : ''}`}>
                    <td className="p-4 flex items-center gap-3">
                        <img src={product.image || 'https://picsum.photos/50'} alt={product.name} className="w-10 h-10 rounded object-cover bg-gray-200" />
                        <div>
                            <p className="font-semibold text-gray-800">{product.name}</p>
                            <p className="text-xs text-gray-500 truncate max-w-[150px]">{product.description}</p>
                        </div>
                    </td>
                    <td className="p-4">
                        <span className={`px-2 py-1 rounded text-xs font-bold ${product.type === 'READY' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                            {product.type}
                        </span>
                        {product.type === 'PO' && product.poDeadline && (
                            <div className="text-xs text-red-500 mt-1">Exp: {product.poDeadline}</div>
                        )}
                        {isExpired && <span className="text-[10px] text-red-600 font-bold ml-2">(Kadaluarsa)</span>}
                    </td>
                    <td className="p-4">
                        <span className={`font-mono ${product.stock < 5 ? 'text-red-600 font-bold' : 'text-gray-700'}`}>
                            {product.stock}
                        </span>
                    </td>
                    <td className="p-4 text-gray-700">{settings.currencySymbol} {product.price.toLocaleString()}</td>
                    <td className="p-4 text-right space-x-2 whitespace-nowrap">
                        <button onClick={() => { setEditItem(product); setFormData(product); setIsEditing(true); }} className="p-2 text-blue-600 hover:bg-blue-50 rounded" title="Edit Stok & Info"><Edit2 size={18} /></button>
                        <button onClick={() => { if(confirm('Hapus produk?')) deleteProduct(product.id); }} className="p-2 text-red-600 hover:bg-red-50 rounded"><Trash2 size={18} /></button>
                    </td>
                    </tr>
                )})}
                {filteredProducts.length === 0 && (
                    <tr><td colSpan={5} className="p-8 text-center text-gray-400">Tidak ada produk ditemukan.</td></tr>
                )}
                </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  // 2. PO LIST & TRANSACTIONS
  const HistoryManager = () => {
    const downloadPdf = () => window.print();

    return (
        <div className="space-y-8">
            {/* PO Section */}
            <div className="print-only">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-2">
                     <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2"><History size={24}/> Daftar Pre-Order (PO) Aktif</h2>
                     <div className="flex gap-2 no-print w-full md:w-auto">
                        <input 
                            type="text" 
                            placeholder="Cari PO / Pelanggan..." 
                            className="pl-3 pr-3 py-1.5 border rounded text-sm flex-1 md:w-48"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        <button onClick={downloadPdf} className="text-sm bg-gray-800 text-white px-3 py-1 rounded hover:bg-gray-700 whitespace-nowrap">Export PDF</button>
                     </div>
                </div>
                <div className="bg-white rounded-lg shadow overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left min-w-[600px]">
                            <thead className="bg-orange-50 text-orange-800 text-xs uppercase">
                                <tr>
                                    <th className="p-3">Data Pelanggan</th>
                                    <th className="p-3">Item PO</th>
                                    <th className="p-3">Tagihan</th>
                                    <th className="p-3">Tgl Order</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {filteredPO.map(t => (
                                    <tr key={t.id}>
                                        <td className="p-3">
                                            <p className="font-bold text-sm text-gray-800">{t.customerName}</p>
                                            <div className="text-xs text-gray-500 space-y-1 mt-1">
                                                {t.customerPhone && <div className="flex items-center gap-1"><Phone size={10}/> {t.customerPhone}</div>}
                                                {t.customerAddress && <div className="flex items-center gap-1"><MapPin size={10}/> {t.customerAddress}</div>}
                                            </div>
                                        </td>
                                        <td className="p-3 text-sm">
                                            {t.items.filter(i => i.type === 'PO').map((i, idx) => (
                                                <div key={idx} className="mb-1 border-b border-gray-100 pb-1 last:border-0">
                                                    <span className="font-medium">{i.name}</span>
                                                    <span className="text-gray-400 text-xs ml-2">x{i.quantity}</span>
                                                </div>
                                            ))}
                                        </td>
                                        <td className="p-3 text-sm font-bold text-orange-600">
                                            {settings.currencySymbol} {t.total.toLocaleString()}
                                        </td>
                                        <td className="p-3 text-sm">{new Date(t.date).toLocaleDateString()}</td>
                                    </tr>
                                ))}
                                {filteredPO.length === 0 && <tr><td colSpan={4} className="p-4 text-center text-gray-400">Belum ada pesanan PO.</td></tr>}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* All History */}
            <div className="print-only border-t pt-8">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-2 no-print">
                     <h2 className="text-xl font-bold text-gray-800">Riwayat Semua Transaksi</h2>
                     <div className="relative w-full md:w-auto">
                        <Search className="absolute left-3 top-2.5 text-gray-400" size={16} />
                        <input 
                            type="text" 
                            placeholder="Cari ID / Pelanggan..." 
                            className="pl-9 pr-3 py-1.5 border rounded text-sm w-full md:w-64"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>
                <div className="bg-white rounded-lg shadow overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left min-w-[600px]">
                            <thead className="bg-gray-100 text-gray-600 text-xs uppercase">
                                <tr>
                                    <th className="p-3">Tanggal</th>
                                    <th className="p-3">ID</th>
                                    <th className="p-3">Pelanggan</th>
                                    <th className="p-3">Total</th>
                                    <th className="p-3">Tipe</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 text-sm">
                                {filteredTransactions.map(t => (
                                    <tr key={t.id} className="hover:bg-gray-50">
                                        <td className="p-3">{new Date(t.date).toLocaleDateString()}</td>
                                        <td className="p-3 font-mono text-xs text-gray-500">{t.id.slice(0,8)}</td>
                                        <td className="p-3">{t.customerName}</td>
                                        <td className="p-3 font-medium">{settings.currencySymbol} {t.total.toLocaleString()}</td>
                                        <td className="p-3 text-xs">
                                            {t.isPO ? <span className="bg-orange-100 text-orange-700 px-1 rounded">PO</span> : <span className="bg-green-100 text-green-700 px-1 rounded">Direct</span>}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
  };

  // 3. REPORTS & EXPENSES
  const ReportManager = () => {
    const [month, setMonth] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM
    const [aiAnalysis, setAiAnalysis] = useState("");
    const [loadingAi, setLoadingAi] = useState(false);

    // Filter logic
    const txInMonth = transactions.filter(t => t.date.startsWith(month));
    const expInMonth = expenses.filter(e => e.date.startsWith(month));

    const totalRevenue = txInMonth.reduce((sum, t) => sum + t.total, 0);
    const totalProfit = txInMonth.reduce((sum, t) => sum + t.profit, 0);
    const totalExpense = expInMonth.reduce((sum, e) => sum + e.amount, 0);
    const netProfit = totalProfit - totalExpense;

    // Chart Data Preparation
    // Group by day
    const chartData = Array.from({ length: 31 }, (_, i) => {
        const d = i + 1;
        const dateStr = `${month}-${d.toString().padStart(2, '0')}`;
        const dayRev = txInMonth.filter(t => t.date.startsWith(dateStr)).reduce((s, t) => s + t.total, 0);
        return { name: d.toString(), revenue: dayRev };
    });

    const runAnalysis = async () => {
        setLoadingAi(true);
        const result = await analyzeSales(txInMonth, month);
        setAiAnalysis(result);
        setLoadingAi(false);
    };

    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center no-print gap-4">
                <h2 className="text-2xl font-bold text-gray-800">Laporan Keuangan</h2>
                <div className="flex gap-4 w-full md:w-auto">
                     <input type="month" value={month} onChange={e => setMonth(e.target.value)} className="border p-2 rounded bg-white flex-1 md:flex-none" />
                     <button onClick={() => window.print()} className="bg-gray-800 text-white px-4 py-2 rounded flex items-center gap-2 whitespace-nowrap"><Printer size={16}/> Print</button>
                </div>
            </div>

            {/* Scorecards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white p-4 rounded shadow border-l-4 border-blue-500">
                    <p className="text-gray-500 text-xs md:text-sm">Total Omset</p>
                    <p className="text-lg md:text-2xl font-bold text-blue-600 truncate">{settings.currencySymbol} {totalRevenue.toLocaleString()}</p>
                </div>
                <div className="bg-white p-4 rounded shadow border-l-4 border-green-500">
                    <p className="text-gray-500 text-xs md:text-sm">Laba Kotor</p>
                    <p className="text-lg md:text-2xl font-bold text-green-600 truncate">{settings.currencySymbol} {totalProfit.toLocaleString()}</p>
                </div>
                <div className="bg-white p-4 rounded shadow border-l-4 border-red-500">
                    <p className="text-gray-500 text-xs md:text-sm">Pengeluaran</p>
                    <p className="text-lg md:text-2xl font-bold text-red-600 truncate">{settings.currencySymbol} {totalExpense.toLocaleString()}</p>
                </div>
                <div className="bg-white p-4 rounded shadow border-l-4 border-purple-500">
                    <p className="text-gray-500 text-xs md:text-sm">Laba Bersih</p>
                    <p className="text-lg md:text-2xl font-bold text-purple-600 truncate">{settings.currencySymbol} {netProfit.toLocaleString()}</p>
                </div>
            </div>

            {/* Chart */}
            <div className="bg-white p-4 rounded shadow h-64 md:h-80 no-print">
                <h3 className="text-lg font-semibold mb-4">Grafik Penjualan Harian</h3>
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" fontSize={12} />
                        <YAxis fontSize={12} width={40} />
                        <Tooltip formatter={(value: number) => settings.currencySymbol + value.toLocaleString()} />
                        <Bar dataKey="revenue" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                    </BarChart>
                </ResponsiveContainer>
            </div>

            {/* AI Analysis */}
            <div className="bg-gradient-to-r from-indigo-50 to-purple-50 p-6 rounded-lg border border-indigo-100 no-print">
                <div className="flex flex-col md:flex-row justify-between items-start mb-4 gap-4">
                    <h3 className="text-lg font-bold text-indigo-900 flex items-center gap-2">
                        <TrendingUp size={20} /> Smart AI Advisor
                    </h3>
                    <button onClick={runAnalysis} disabled={loadingAi} className="bg-indigo-600 text-white px-4 py-2 rounded shadow hover:bg-indigo-700 disabled:opacity-50 w-full md:w-auto text-center">
                        {loadingAi ? 'Menganalisis...' : 'Analisa Data Penjualan'}
                    </button>
                </div>
                {aiAnalysis ? (
                    <div className="prose text-sm text-indigo-800 whitespace-pre-line bg-white p-4 rounded border border-indigo-100 max-h-60 overflow-y-auto">
                        {aiAnalysis}
                    </div>
                ) : (
                    <p className="text-sm text-indigo-400 italic">Klik tombol untuk mendapatkan insight bisnis dari Gemini AI berdasarkan data bulan ini.</p>
                )}
            </div>

            {/* Expense Table */}
            <div className="bg-white rounded shadow p-4 md:p-6">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-2">
                    <div className="flex gap-2 items-center w-full md:w-auto">
                        <h3 className="font-bold whitespace-nowrap">Daftar Pengeluaran</h3>
                        <div className="relative no-print flex-1 md:flex-none">
                            <Search className="absolute left-2 top-1.5 text-gray-400" size={14} />
                            <input 
                                type="text" 
                                placeholder="Cari..." 
                                className="pl-7 pr-2 py-1 border rounded text-xs w-full md:w-32"
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>
                    <button 
                        onClick={() => {
                            const desc = prompt("Deskripsi Pengeluaran:");
                            const amt = Number(prompt("Jumlah:"));
                            if (desc && amt) addExpense({ id: Date.now().toString(), date: new Date().toISOString(), description: desc, amount: amt, category: 'General' });
                        }}
                        className="text-xs bg-red-100 text-red-600 px-3 py-2 rounded hover:bg-red-200 no-print w-full md:w-auto text-center"
                    >
                        + Tambah
                    </button>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left min-w-[500px]">
                        <thead><tr><th className="pb-2">Tanggal</th><th className="pb-2">Deskripsi</th><th className="pb-2 text-right">Jumlah</th><th className="pb-2 text-right no-print">Hapus</th></tr></thead>
                        <tbody>
                            {expInMonth.filter(e => e.description.toLowerCase().includes(searchTerm.toLowerCase())).map(e => (
                                <tr key={e.id} className="border-t">
                                    <td className="py-2">{new Date(e.date).toLocaleDateString()}</td>
                                    <td className="py-2">{e.description}</td>
                                    <td className="py-2 text-right">{settings.currencySymbol} {e.amount.toLocaleString()}</td>
                                    <td className="py-2 text-right no-print"><button onClick={() => deleteExpense(e.id)} className="text-red-500">x</button></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
  };

  // 4. SETTINGS & CUSTOMERS
  const SettingsManager = () => {
    const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
          const reader = new FileReader();
          reader.onloadend = () => updateSettings({ ...settings, logo: reader.result as string });
          reader.readAsDataURL(file);
        }
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Store Config */}
            <div className="bg-white p-6 rounded shadow">
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2"><Settings size={20}/> Pengaturan Toko</h3>
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium">Nama Toko</label>
                        <input className="w-full border p-2 rounded" value={settings.name} onChange={e => updateSettings({...settings, name: e.target.value})} />
                    </div>
                    <div>
                        <label className="block text-sm font-medium">PIN Admin (6 Angka)</label>
                        <input className="w-full border p-2 rounded" maxLength={6} value={settings.pin} onChange={e => updateSettings({...settings, pin: e.target.value})} />
                    </div>
                    <div>
                        <label className="block text-sm font-medium">Logo Toko</label>
                        <div className="flex items-center gap-4 mt-2">
                            {settings.logo && <img src={settings.logo} className="w-16 h-16 rounded-full object-cover border" />}
                            <input type="file" onChange={handleLogoUpload} className="text-sm" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Customers */}
            <div className="bg-white p-6 rounded shadow">
                <div className="flex justify-between items-center mb-4">
                     <h3 className="text-lg font-bold flex items-center gap-2"><Users size={20}/> Pelanggan</h3>
                     {/* Note: Direct adding is minimal here as POS adds them, but keeping button for manual override */}
                </div>
                <input 
                    type="text" 
                    placeholder="Cari pelanggan..." 
                    className="w-full border p-2 rounded mb-4 text-sm"
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                />
                <div className="max-h-64 overflow-y-auto">
                    <ul className="divide-y">
                        {filteredCustomers.map(c => (
                            <li key={c.id} className="py-2 flex justify-between items-center">
                                <div>
                                    <p className="font-medium text-sm text-gray-800">{c.name}</p>
                                    <p className="text-xs text-gray-500">{c.phone}</p>
                                    {c.address && <p className="text-[10px] text-gray-400">{c.address}</p>}
                                </div>
                                <button onClick={() => deleteCustomer(c.id)} className="text-red-400 hover:text-red-600">Hapus</button>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        </div>
    );
  };


  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* Mobile Top Bar */}
      <div className="md:hidden fixed top-0 left-0 right-0 bg-gray-900 text-white p-4 flex justify-between items-center z-20 shadow-md">
          <div className="flex items-center gap-3">
              <button onClick={() => setIsSidebarOpen(true)} className="p-1"><Menu size={24}/></button>
              <span className="font-bold truncate max-w-[200px]">{settings.name}</span>
          </div>
      </div>

      {/* Sidebar */}
      <aside className={`
          w-64 bg-gray-900 text-white flex flex-col no-print fixed h-full z-30 transition-transform duration-300 ease-in-out
          ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        <div className="p-6 flex items-center space-x-3 border-b border-gray-800 relative">
          <img src={settings.logo} className="w-10 h-10 rounded-full bg-white object-cover" alt="Logo" />
          <div className="min-w-0">
             <h1 className="font-bold text-lg leading-tight truncate">{settings.name}</h1>
             <span className="text-xs text-gray-400 font-normal">Admin Panel</span>
          </div>
          <button onClick={() => setIsSidebarOpen(false)} className="absolute top-4 right-4 md:hidden text-gray-400 hover:text-white">
              <X size={20} />
          </button>
        </div>
        
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          <TabButton active={activeTab === 'overview'} onClick={() => { setActiveTab('overview'); setIsSidebarOpen(false); }} icon={LayoutDashboard} label="Produk & Stok" />
          <TabButton active={activeTab === 'transactions'} onClick={() => { setActiveTab('transactions'); setIsSidebarOpen(false); }} icon={History} label="PO & Transaksi" />
          <TabButton active={activeTab === 'reports'} onClick={() => { setActiveTab('reports'); setIsSidebarOpen(false); }} icon={FileText} label="Laporan & AI" />
          <TabButton active={activeTab === 'settings'} onClick={() => { setActiveTab('settings'); setIsSidebarOpen(false); }} icon={Settings} label="Pengaturan" />
        </nav>

        <div className="p-4 border-t border-gray-800">
          <Link to="/" className="flex items-center space-x-3 p-3 text-red-400 hover:bg-gray-800 rounded-lg transition">
            <LogOut size={20} />
            <span>Ke Mesin Kasir</span>
          </Link>
        </div>
      </aside>

      {/* Overlay for Mobile Sidebar */}
      {isSidebarOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-20 md:hidden" onClick={() => setIsSidebarOpen(false)}></div>
      )}

      {/* Main Content */}
      <main className="flex-1 md:ml-64 p-4 md:p-8 overflow-y-auto h-screen print-ml-0 pt-20 md:pt-8 bg-gray-100">
        {activeTab === 'overview' && <ProductManager />}
        {activeTab === 'transactions' && <HistoryManager />}
        {activeTab === 'reports' && <ReportManager />}
        {activeTab === 'settings' && <SettingsManager />}
      </main>
    </div>
  );
};

export default AdminDashboard;