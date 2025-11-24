import React, { useState, useMemo } from 'react';
import { useStore } from '../context/StoreContext';
import { Product, CartItem, Transaction, Customer } from '../types';
import { Search, ShoppingCart, Trash2, Printer, Share2, Mail, Lock, User, MapPin, Phone } from 'lucide-react';
import { Link } from 'react-router-dom';

const POSPage: React.FC = () => {
  const { products, addTransaction, addCustomer, settings, customers } = useStore();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'ALL' | 'READY' | 'PO'>('ALL');
  const [showReceipt, setShowReceipt] = useState<Transaction | null>(null);

  // PO Customer Data State
  const [showPOForm, setShowPOForm] = useState(false);
  const [poCustomer, setPoCustomer] = useState({ name: '', phone: '', address: '' });
  
  // Filter Products
  const availableProducts = useMemo(() => {
    const now = new Date();
    // Reset hours to compare dates properly or just timestamp
    return products.filter(p => {
      const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCat = selectedCategory === 'ALL' || p.type === selectedCategory;
      
      // PO Logic: If deadline passed, hide it
      let isAvailable = true;
      if (p.type === 'PO' && p.poDeadline) {
         const deadline = new Date(p.poDeadline);
         // Set deadline to end of day
         deadline.setHours(23, 59, 59, 999);
         if (now > deadline) isAvailable = false;
      }

      return matchesSearch && matchesCat && isAvailable;
    });
  }, [products, searchTerm, selectedCategory]);

  const addToCart = (product: Product) => {
    if (product.type === 'READY' && product.stock <= 0) {
      alert("Stok Habis!");
      return;
    }
    setCart(prev => {
      const exist = prev.find(i => i.id === product.id);
      if (exist) {
        if (product.type === 'READY' && exist.quantity >= product.stock) return prev;
        return prev.map(i => i.id === product.id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, { ...product, quantity: 1 }];
    });
  };

  const updateQty = (id: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === id) {
        const newQty = item.quantity + delta;
        if (newQty < 1) return item;
        if (item.type === 'READY' && newQty > item.stock) return item;
        return { ...item, quantity: newQty };
      }
      return item;
    }));
  };

  const removeFromCart = (id: string) => setCart(prev => prev.filter(i => i.id !== id));

  const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const hasPO = cart.some(i => i.type === 'PO');

  const initiateCheckout = () => {
    if (cart.length === 0) return;
    
    // If cart has PO items, we require customer details
    if (hasPO) {
        setShowPOForm(true);
    } else {
        processCheckout("Pelanggan Umum", "", "");
    }
  };

  const processCheckout = (name: string, phone: string, address: string) => {
    const transaction: Transaction = {
      id: Date.now().toString(),
      date: new Date().toISOString(),
      items: cart.map(i => ({
        productId: i.id,
        name: i.name,
        price: i.price,
        quantity: i.quantity,
        subtotal: i.price * i.quantity,
        type: i.type
      })),
      total,
      profit: cart.reduce((sum, i) => sum + ((i.price - i.cost) * i.quantity), 0),
      customerName: name,
      customerPhone: phone,
      customerAddress: address,
      paymentMethod: 'CASH', 
      isPO: hasPO
    };

    addTransaction(transaction);

    // If it was a PO with filled details, save as a new customer if they don't exist vaguely
    if (hasPO && name !== "Pelanggan Umum") {
        const newCustomer: Customer = {
            id: Date.now().toString(),
            name,
            phone,
            address,
            email: ''
        };
        addCustomer(newCustomer);
    }

    setCart([]);
    setShowPOForm(false);
    setPoCustomer({ name: '', phone: '', address: '' });
    setShowReceipt(transaction);
  };

  if (showReceipt) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <div className="bg-white p-8 w-full max-w-md shadow-lg rounded-lg relative">
          <div className="text-center border-b pb-4 mb-4">
            {settings.logo && <img src={settings.logo} className="w-16 h-16 mx-auto rounded-full object-cover mb-2" />}
            <h2 className="text-xl font-bold">{settings.name}</h2>
            <p className="text-gray-500 text-sm">{settings.address}</p>
            <p className="text-xs mt-2 text-gray-400">{new Date(showReceipt.date).toLocaleString()}</p>
          </div>
          
          <div className="mb-4 bg-gray-50 p-3 rounded text-sm">
             <p className="font-bold">Pelanggan:</p>
             <p>{showReceipt.customerName}</p>
             {showReceipt.customerPhone && <p>{showReceipt.customerPhone}</p>}
             {showReceipt.customerAddress && <p className="text-xs text-gray-500">{showReceipt.customerAddress}</p>}
          </div>

          <div className="space-y-2 mb-4">
            {showReceipt.items.map((item, idx) => (
              <div key={idx} className="flex justify-between text-sm">
                <span>
                    {item.name} 
                    {item.type === 'PO' && <span className="ml-1 text-[10px] bg-orange-100 text-orange-600 px-1 rounded">PO</span>}
                    <div className="text-xs text-gray-400">x{item.quantity}</div>
                </span>
                <span>{settings.currencySymbol} {item.subtotal.toLocaleString()}</span>
              </div>
            ))}
          </div>
          
          <div className="border-t pt-4 flex justify-between font-bold text-lg">
            <span>Total</span>
            <span>{settings.currencySymbol} {showReceipt.total.toLocaleString()}</span>
          </div>

          <div className="mt-8 grid grid-cols-2 gap-3 no-print">
            <button onClick={() => window.print()} className="flex items-center justify-center gap-2 bg-gray-800 text-white py-2 rounded">
              <Printer size={16} /> Print
            </button>
            <a 
              href={`https://wa.me/${showReceipt.customerPhone?.replace(/^0/, '62') || ''}?text=Halo ${showReceipt.customerName}, berikut struk transaksi anda di ${settings.name}. Total: ${showReceipt.total}. Terima kasih!`}
              target="_blank"
              rel="noreferrer" 
              className="flex items-center justify-center gap-2 bg-green-500 text-white py-2 rounded"
            >
              <Share2 size={16} /> WhatsApp
            </a>
            <a 
               href={`mailto:?subject=Struk Belanja&body=Terima kasih telah berbelanja di ${settings.name}. Total: ${showReceipt.total}`}
               className="flex items-center justify-center gap-2 bg-blue-500 text-white py-2 rounded col-span-2"
            >
              <Mail size={16} /> Email
            </a>
            <button onClick={() => setShowReceipt(null)} className="col-span-2 mt-2 text-gray-500 underline text-sm">Kembali ke Menu</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden font-sans">
      {/* Product Grid Area */}
      <div className="flex-1 flex flex-col h-full">
        {/* Header */}
        <header className="bg-white shadow px-6 py-4 flex justify-between items-center z-10">
            <div className="flex items-center gap-3">
                {settings.logo && <img src={settings.logo} className="w-10 h-10 rounded-full object-cover shadow-sm" />}
                <div>
                    <h1 className="font-bold text-gray-800 text-lg leading-tight">{settings.name}</h1>
                    <p className="text-xs text-green-600 font-medium flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span> Kasir Aktif</p>
                </div>
            </div>
            
            <div className="flex-1 max-w-lg mx-8 relative">
                <Search className="absolute left-3 top-2.5 text-gray-400" size={20} />
                <input 
                    className="w-full bg-gray-100 border-none rounded-full py-2 pl-10 pr-4 focus:ring-2 focus:ring-blue-500 transition-all"
                    placeholder="Cari produk..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                />
            </div>

            <Link to="/admin" className="p-2 text-gray-400 hover:text-gray-800 transition rounded-full hover:bg-gray-100">
                <Lock size={20} />
            </Link>
        </header>

        {/* Filters */}
        <div className="px-6 py-3 bg-gray-50 border-b flex gap-2 overflow-x-auto no-scrollbar">
            {['ALL', 'READY', 'PO'].map(cat => (
                <button 
                    key={cat}
                    onClick={() => setSelectedCategory(cat as any)}
                    className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all transform active:scale-95 ${
                        selectedCategory === cat 
                        ? 'bg-blue-600 text-white shadow-md' 
                        : 'bg-white text-gray-600 border hover:bg-gray-100'
                    }`}
                >
                    {cat === 'ALL' ? 'Semua' : cat === 'READY' ? 'Ready Stock' : 'Pre-Order'}
                </button>
            ))}
        </div>

        {/* Grid */}
        <div className="flex-1 overflow-y-auto p-6 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 content-start">
            {availableProducts.map(product => (
                <div 
                    key={product.id} 
                    onClick={() => addToCart(product)}
                    className="bg-white rounded-xl shadow-sm hover:shadow-lg transition-all cursor-pointer overflow-hidden group flex flex-col h-full transform hover:-translate-y-1"
                >
                    <div className="h-40 bg-gray-200 w-full relative overflow-hidden">
                        <img src={product.image || 'https://picsum.photos/200'} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" alt={product.name} />
                        <div className="absolute top-2 right-2">
                             <span className={`px-2 py-1 rounded text-[10px] font-bold shadow ${product.type === 'READY' ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'}`}>
                                {product.type}
                             </span>
                        </div>
                        {product.type === 'READY' && product.stock < 5 && (
                             <div className="absolute bottom-0 left-0 right-0 bg-red-500 text-white text-xs text-center py-1 opacity-95">
                                Sisa {product.stock}
                             </div>
                        )}
                    </div>
                    <div className="p-3 flex flex-col flex-1">
                        <h3 className="font-semibold text-gray-800 text-sm mb-1 leading-snug line-clamp-2">{product.name}</h3>
                        <div className="mt-auto pt-2 flex justify-between items-end">
                            <span className="font-bold text-blue-600">{settings.currencySymbol} {product.price.toLocaleString()}</span>
                            {product.type === 'PO' && product.poDeadline && (
                                <span className="text-[10px] text-gray-400 bg-gray-100 px-1 rounded">Exp: {new Date(product.poDeadline).toLocaleDateString('id-ID', {day: 'numeric', month: 'numeric'})}</span>
                            )}
                        </div>
                    </div>
                </div>
            ))}
            {availableProducts.length === 0 && (
                <div className="col-span-full text-center py-20 flex flex-col items-center text-gray-400">
                    <Search size={48} className="mb-4 opacity-20" />
                    <p>Produk tidak ditemukan atau batas PO telah habis.</p>
                </div>
            )}
        </div>
      </div>

      {/* Cart Sidebar */}
      <div className="w-96 bg-white border-l shadow-2xl flex flex-col h-full z-20">
        <div className="p-4 border-b bg-gray-50">
            <h2 className="font-bold text-gray-800 flex items-center gap-2"><ShoppingCart size={20}/> Keranjang</h2>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {cart.map(item => (
                <div key={item.id} className="flex gap-3 items-start animate-fade-in">
                    <img src={item.image || 'https://picsum.photos/50'} className="w-12 h-12 rounded bg-gray-100 object-cover" />
                    <div className="flex-1">
                        <p className="text-sm font-semibold text-gray-800 line-clamp-1">{item.name}</p>
                        <div className="flex items-center gap-2">
                             <p className="text-xs text-gray-500">{settings.currencySymbol} {item.price.toLocaleString()}</p>
                             {item.type === 'PO' && <span className="text-[10px] bg-orange-100 text-orange-600 px-1 rounded">PO</span>}
                        </div>
                        <div className="flex items-center gap-3 mt-2">
                            <button onClick={() => updateQty(item.id, -1)} className="w-6 h-6 rounded bg-gray-200 hover:bg-gray-300 flex items-center justify-center text-sm font-bold active:scale-90 transition">-</button>
                            <span className="text-sm font-medium w-6 text-center">{item.quantity}</span>
                            <button onClick={() => updateQty(item.id, 1)} className="w-6 h-6 rounded bg-gray-200 hover:bg-gray-300 flex items-center justify-center text-sm font-bold active:scale-90 transition">+</button>
                        </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                         <p className="text-sm font-bold">{settings.currencySymbol} {(item.price * item.quantity).toLocaleString()}</p>
                         <button onClick={() => removeFromCart(item.id)} className="text-red-400 hover:text-red-600 transition"><Trash2 size={16} /></button>
                    </div>
                </div>
            ))}
            {cart.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full text-gray-400 text-sm">
                    <ShoppingCart size={48} className="mb-2 opacity-20" />
                    Keranjang Kosong
                </div>
            )}
        </div>

        <div className="p-4 bg-gray-50 border-t space-y-3">
             {hasPO && (
                 <div className="bg-orange-50 border border-orange-200 rounded p-2 text-xs text-orange-700 flex items-center gap-2">
                     <User size={14}/>
                     Transaksi PO memerlukan data pelanggan.
                 </div>
             )}

             <div className="flex justify-between items-center text-lg font-bold pt-2">
                 <span>Total</span>
                 <span>{settings.currencySymbol} {total.toLocaleString()}</span>
             </div>

             <button 
                onClick={initiateCheckout}
                disabled={cart.length === 0}
                className="w-full bg-blue-600 text-white py-3 rounded-lg font-bold hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition transform active:scale-[0.98]"
             >
                 Bayar Sekarang
             </button>
        </div>
      </div>

      {/* PO Data Modal */}
      {showPOForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6 animate-scale-in">
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2 text-gray-800">
                    <User size={24} className="text-blue-500" />
                    Data Pemesan PO
                </h3>
                <p className="text-sm text-gray-500 mb-6">Barang Pre-Order memerlukan data lengkap untuk pengiriman/pengambilan.</p>
                
                <form onSubmit={(e) => { e.preventDefault(); processCheckout(poCustomer.name, poCustomer.phone, poCustomer.address); }}>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Nama Lengkap</label>
                            <div className="relative">
                                <User className="absolute left-3 top-2.5 text-gray-400" size={16}/>
                                <input 
                                    required 
                                    className="w-full pl-9 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" 
                                    placeholder="Nama Pelanggan"
                                    value={poCustomer.name}
                                    onChange={e => setPoCustomer({...poCustomer, name: e.target.value})}
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Nomor WhatsApp / HP</label>
                            <div className="relative">
                                <Phone className="absolute left-3 top-2.5 text-gray-400" size={16}/>
                                <input 
                                    required 
                                    type="tel"
                                    className="w-full pl-9 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" 
                                    placeholder="Contoh: 08123456789"
                                    value={poCustomer.phone}
                                    onChange={e => setPoCustomer({...poCustomer, phone: e.target.value})}
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Alamat Lengkap</label>
                            <div className="relative">
                                <MapPin className="absolute left-3 top-2.5 text-gray-400" size={16}/>
                                <textarea 
                                    required 
                                    className="w-full pl-9 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" 
                                    placeholder="Jalan, No Rumah, Kelurahan..."
                                    rows={3}
                                    value={poCustomer.address}
                                    onChange={e => setPoCustomer({...poCustomer, address: e.target.value})}
                                />
                            </div>
                        </div>
                    </div>
                    <div className="flex gap-3 mt-8">
                        <button type="button" onClick={() => setShowPOForm(false)} className="flex-1 py-2 text-gray-600 hover:bg-gray-100 rounded-lg font-medium">Batal</button>
                        <button type="submit" className="flex-1 py-2 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 shadow-lg">Simpan & Bayar</button>
                    </div>
                </form>
            </div>
        </div>
      )}
    </div>
  );
};

export default POSPage;