import React, { useState, useMemo } from 'react';
import { useStore } from '../context/StoreContext';
import { Product, CartItem, Transaction, Customer } from '../types';
import { Search, ShoppingCart, Trash2, Printer, Share2, Mail, Lock, User, MapPin, Phone, X, ChevronUp } from 'lucide-react';
import { Link } from 'react-router-dom';

const POSPage: React.FC = () => {
  const { products, addTransaction, addCustomer, settings, customers } = useStore();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'ALL' | 'READY' | 'PO'>('ALL');
  const [showReceipt, setShowReceipt] = useState<Transaction | null>(null);
  const [isCartOpen, setIsCartOpen] = useState(false); // Mobile cart toggle

  // PO Customer Data State
  const [showPOForm, setShowPOForm] = useState(false);
  const [poCustomer, setPoCustomer] = useState({ name: '', phone: '', address: '' });
  
  // Filter Products
  const availableProducts = useMemo(() => {
    const now = new Date();
    return products.filter(p => {
      const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCat = selectedCategory === 'ALL' || p.type === selectedCategory;
      
      // PO Logic: If deadline passed, hide it
      let isAvailable = true;
      if (p.type === 'PO' && p.poDeadline) {
         const deadline = new Date(p.poDeadline);
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
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);

  const initiateCheckout = () => {
    if (cart.length === 0) return;
    
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
    setIsCartOpen(false); // Close mobile cart
    setPoCustomer({ name: '', phone: '', address: '' });
    setShowReceipt(transaction);
  };

  if (showReceipt) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <div className="bg-white p-6 w-full max-w-md shadow-lg rounded-lg relative">
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
    <div className="flex h-screen bg-gray-100 overflow-hidden font-sans flex-col md:flex-row">
      {/* Product Grid Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Header */}
        <header className="bg-white shadow px-4 py-3 md:px-6 md:py-4 flex gap-4 justify-between items-center z-10 shrink-0">
            <div className="flex items-center gap-3 overflow-hidden">
                {settings.logo && <img src={settings.logo} className="w-8 h-8 md:w-10 md:h-10 rounded-full object-cover shadow-sm shrink-0" />}
                <div className="min-w-0">
                    <h1 className="font-bold text-gray-800 text-base md:text-lg leading-tight truncate">{settings.name}</h1>
                    <p className="text-[10px] md:text-xs text-green-600 font-medium flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span> Kasir Aktif</p>
                </div>
            </div>
            
            <div className="flex-1 max-w-sm md:max-w-lg relative mx-2">
                <Search className="absolute left-3 top-2 md:top-2.5 text-gray-400" size={16} />
                <input 
                    className="w-full bg-gray-100 border-none rounded-full py-1.5 md:py-2 pl-9 pr-4 text-sm focus:ring-2 focus:ring-blue-500 transition-all"
                    placeholder="Cari..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                />
            </div>

            <Link to="/admin" className="p-2 text-gray-400 hover:text-gray-800 transition rounded-full hover:bg-gray-100 shrink-0">
                <Lock size={20} />
            </Link>
        </header>

        {/* Filters */}
        <div className="px-4 py-3 bg-gray-50 border-b flex gap-2 overflow-x-auto no-scrollbar shrink-0">
            {['ALL', 'READY', 'PO'].map(cat => (
                <button 
                    key={cat}
                    onClick={() => setSelectedCategory(cat as any)}
                    className={`px-4 py-1.5 rounded-full text-xs md:text-sm font-medium transition-all transform active:scale-95 whitespace-nowrap ${
                        selectedCategory === cat 
                        ? 'bg-blue-600 text-white shadow-md' 
                        : 'bg-white text-gray-600 border hover:bg-gray-100'
                    }`}
                >
                    {cat === 'ALL' ? 'Semua' : cat === 'READY' ? 'Ready Stock' : 'Pre-Order'}
                </button>
            ))}
        </div>

        {/* Product Grid */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-4 content-start pb-24 md:pb-6">
            {availableProducts.map(product => (
                <div 
                    key={product.id} 
                    onClick={() => addToCart(product)}
                    className="bg-white rounded-lg md:rounded-xl shadow-sm hover:shadow-lg transition-all cursor-pointer overflow-hidden group flex flex-col h-full transform active:scale-95 md:hover:-translate-y-1"
                >
                    <div className="h-32 md:h-40 bg-gray-200 w-full relative overflow-hidden">
                        <img src={product.image || 'https://picsum.photos/200'} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" alt={product.name} />
                        <div className="absolute top-2 right-2">
                             <span className={`px-2 py-0.5 rounded text-[10px] font-bold shadow ${product.type === 'READY' ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'}`}>
                                {product.type}
                             </span>
                        </div>
                        {product.type === 'READY' && product.stock < 5 && (
                             <div className="absolute bottom-0 left-0 right-0 bg-red-500 text-white text-[10px] text-center py-0.5 opacity-95">
                                Sisa {product.stock}
                             </div>
                        )}
                    </div>
                    <div className="p-2 md:p-3 flex flex-col flex-1">
                        <h3 className="font-semibold text-gray-800 text-xs md:text-sm mb-1 leading-snug line-clamp-2">{product.name}</h3>
                        <div className="mt-auto pt-2 flex justify-between items-end">
                            <span className="font-bold text-blue-600 text-xs md:text-sm">{settings.currencySymbol} {product.price.toLocaleString()}</span>
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
                    <p>Tidak ada produk.</p>
                </div>
            )}
        </div>
      </div>

      {/* Mobile Bottom Bar for Cart */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t p-3 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] z-30 flex justify-between items-center">
          <div>
              <p className="text-xs text-gray-500">Total ({totalItems} Item)</p>
              <p className="text-lg font-bold text-blue-600">{settings.currencySymbol} {total.toLocaleString()}</p>
          </div>
          <button 
            onClick={() => setIsCartOpen(true)}
            disabled={cart.length === 0}
            className={`px-6 py-2.5 rounded-full font-bold flex items-center gap-2 transition-colors ${cart.length === 0 ? 'bg-gray-200 text-gray-400' : 'bg-blue-600 text-white active:bg-blue-700'}`}
          >
              <ShoppingCart size={18} />
              <span>Lihat Pesanan</span>
              <ChevronUp size={16} className="ml-1" />
          </button>
      </div>

      {/* Cart Sidebar / Drawer */}
      {/* On Mobile: It's a full overlay or bottom sheet. On Desktop: It's a side column */}
      <div className={`
        fixed inset-0 z-40 bg-white md:static md:z-auto md:w-96 md:border-l md:shadow-2xl flex flex-col transition-transform duration-300 transform
        ${isCartOpen ? 'translate-y-0' : 'translate-y-full md:translate-y-0'}
      `}>
        {/* Mobile Header for Cart Drawer */}
        <div className="md:hidden p-4 border-b bg-gray-50 flex justify-between items-center shrink-0">
             <h2 className="font-bold text-lg flex items-center gap-2"><ShoppingCart size={20}/> Keranjang</h2>
             <button onClick={() => setIsCartOpen(false)} className="p-2 bg-white rounded-full border shadow-sm active:bg-gray-100">
                 <X size={20}/>
             </button>
        </div>

        {/* Desktop Header */}
        <div className="hidden md:block p-4 border-b bg-gray-50 shrink-0">
            <h2 className="font-bold text-gray-800 flex items-center gap-2"><ShoppingCart size={20}/> Keranjang</h2>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-24 md:pb-4">
            {cart.map(item => (
                <div key={item.id} className="flex gap-3 items-start animate-fade-in border-b border-gray-100 last:border-0 pb-3 last:pb-0">
                    <img src={item.image || 'https://picsum.photos/50'} className="w-12 h-12 rounded bg-gray-100 object-cover shrink-0" />
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-800 line-clamp-1">{item.name}</p>
                        <div className="flex items-center gap-2">
                             <p className="text-xs text-gray-500">{settings.currencySymbol} {item.price.toLocaleString()}</p>
                             {item.type === 'PO' && <span className="text-[10px] bg-orange-100 text-orange-600 px-1 rounded">PO</span>}
                        </div>
                        <div className="flex items-center gap-3 mt-2">
                            <button onClick={() => updateQty(item.id, -1)} className="w-7 h-7 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-sm font-bold active:scale-90 transition">-</button>
                            <span className="text-sm font-medium w-6 text-center">{item.quantity}</span>
                            <button onClick={() => updateQty(item.id, 1)} className="w-7 h-7 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-sm font-bold active:scale-90 transition">+</button>
                        </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                         <p className="text-sm font-bold">{settings.currencySymbol} {(item.price * item.quantity).toLocaleString()}</p>
                         <button onClick={() => removeFromCart(item.id)} className="text-red-400 hover:text-red-600 p-1"><Trash2 size={16} /></button>
                    </div>
                </div>
            ))}
            {cart.length === 0 && (
                <div className="flex flex-col items-center justify-center h-64 text-gray-400 text-sm">
                    <ShoppingCart size={48} className="mb-2 opacity-20" />
                    Keranjang Kosong
                </div>
            )}
        </div>

        <div className="p-4 bg-gray-50 border-t space-y-3 shrink-0">
             {hasPO && (
                 <div className="bg-orange-50 border border-orange-200 rounded p-2 text-xs text-orange-700 flex items-center gap-2">
                     <User size={14}/>
                     Transaksi PO butuh data pelanggan.
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
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-end md:items-center justify-center p-0 md:p-4 backdrop-blur-sm">
            <div className="bg-white rounded-t-2xl md:rounded-lg shadow-xl w-full max-w-md p-6 animate-scale-in max-h-[90vh] overflow-y-auto">
                <div className="w-12 h-1 bg-gray-300 rounded-full mx-auto mb-4 md:hidden"></div>
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