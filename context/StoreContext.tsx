import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Product, Transaction, Customer, Expense, StoreSettings } from '../types';

interface StoreContextType {
  products: Product[];
  transactions: Transaction[];
  customers: Customer[];
  expenses: Expense[];
  settings: StoreSettings;
  addProduct: (p: Product) => void;
  updateProduct: (p: Product) => void;
  deleteProduct: (id: string) => void;
  addTransaction: (t: Transaction) => void;
  addCustomer: (c: Customer) => void;
  deleteCustomer: (id: string) => void;
  addExpense: (e: Expense) => void;
  deleteExpense: (id: string) => void;
  updateSettings: (s: StoreSettings) => void;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

// Initial Mock Data
const initialSettings: StoreSettings = {
  name: "Toko Suka Maju",
  address: "Jl. Merdeka No. 45, Jakarta",
  logo: "https://picsum.photos/100/100",
  pin: "123456",
  currencySymbol: "Rp",
};

const initialProducts: Product[] = [
  { id: '1', name: 'Kopi Susu Gula Aren', description: 'Kopi kekinian', price: 18000, cost: 10000, stock: 50, type: 'READY' },
  { id: '2', name: 'Croissant Butter', description: 'Renyah dan wangi', price: 25000, cost: 15000, stock: 20, type: 'READY' },
  { id: '3', name: 'Hampers Lebaran', description: 'Paket kue kering', price: 150000, cost: 100000, stock: 10, type: 'PO', poDeadline: '2025-12-31' },
];

export const StoreProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [products, setProducts] = useState<Product[]>(() => {
    const saved = localStorage.getItem('products');
    return saved ? JSON.parse(saved) : initialProducts;
  });

  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    const saved = localStorage.getItem('transactions');
    return saved ? JSON.parse(saved) : [];
  });

  const [customers, setCustomers] = useState<Customer[]>(() => {
    const saved = localStorage.getItem('customers');
    return saved ? JSON.parse(saved) : [];
  });

  const [expenses, setExpenses] = useState<Expense[]>(() => {
    const saved = localStorage.getItem('expenses');
    return saved ? JSON.parse(saved) : [];
  });

  const [settings, setSettings] = useState<StoreSettings>(() => {
    const saved = localStorage.getItem('settings');
    return saved ? JSON.parse(saved) : initialSettings;
  });

  // Persistence Effects
  useEffect(() => localStorage.setItem('products', JSON.stringify(products)), [products]);
  useEffect(() => localStorage.setItem('transactions', JSON.stringify(transactions)), [transactions]);
  useEffect(() => localStorage.setItem('customers', JSON.stringify(customers)), [customers]);
  useEffect(() => localStorage.setItem('expenses', JSON.stringify(expenses)), [expenses]);
  useEffect(() => localStorage.setItem('settings', JSON.stringify(settings)), [settings]);

  const addProduct = (p: Product) => setProducts([...products, p]);
  const updateProduct = (p: Product) => setProducts(products.map(item => item.id === p.id ? p : item));
  const deleteProduct = (id: string) => setProducts(products.filter(item => item.id !== id));
  
  const addTransaction = (t: Transaction) => {
    setTransactions([t, ...transactions]);
    // Decrease stock for READY items
    const newProducts = products.map(p => {
      const soldItem = t.items.find(i => i.productId === p.id);
      if (soldItem && p.type === 'READY') {
        return { ...p, stock: p.stock - soldItem.quantity };
      }
      return p;
    });
    setProducts(newProducts);
  };

  const addCustomer = (c: Customer) => setCustomers([...customers, c]);
  const deleteCustomer = (id: string) => setCustomers(customers.filter(c => c.id !== id));

  const addExpense = (e: Expense) => setExpenses([e, ...expenses]);
  const deleteExpense = (id: string) => setExpenses(expenses.filter(e => e.id !== id));

  const updateSettings = (s: StoreSettings) => setSettings(s);

  return (
    <StoreContext.Provider value={{
      products, transactions, customers, expenses, settings,
      addProduct, updateProduct, deleteProduct, addTransaction,
      addCustomer, deleteCustomer, addExpense, deleteExpense, updateSettings
    }}>
      {children}
    </StoreContext.Provider>
  );
};

export const useStore = () => {
  const context = useContext(StoreContext);
  if (!context) throw new Error("useStore must be used within StoreProvider");
  return context;
};
