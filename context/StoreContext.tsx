import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Product, Transaction, Customer, Expense, StoreSettings } from '../types';
import { db, DBSettings } from '../db';

interface StoreContextType {
  products: Product[];
  transactions: Transaction[];
  customers: Customer[];
  expenses: Expense[];
  settings: StoreSettings;
  addProduct: (p: Product) => Promise<void>;
  updateProduct: (p: Product) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;
  addTransaction: (t: Transaction) => Promise<void>;
  addCustomer: (c: Customer) => Promise<void>;
  deleteCustomer: (id: string) => Promise<void>;
  addExpense: (e: Expense) => Promise<void>;
  deleteExpense: (id: string) => Promise<void>;
  updateSettings: (s: StoreSettings) => Promise<void>;
  isLoading: boolean;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

// Initial Mock Data (used for seeding the DB)
const initialSettings: DBSettings = {
  id: 'global',
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
  const [products, setProducts] = useState<Product[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [settings, setSettings] = useState<StoreSettings>(initialSettings);
  const [isLoading, setIsLoading] = useState(true);

  // Load Data from DB on Mount
  useEffect(() => {
    const loadData = async () => {
      try {
        // 1. Settings (Seed if empty)
        let dbSettings = await db.settings.get('global');
        if (!dbSettings) {
            await db.settings.add(initialSettings);
            dbSettings = initialSettings;
        }
        setSettings(dbSettings);

        // 2. Products (Seed if empty)
        const countProducts = await db.products.count();
        if (countProducts === 0) {
            await db.products.bulkAdd(initialProducts);
        }
        setProducts(await db.products.toArray());

        // 3. Transactions (Sort by date desc)
        const txs = await db.transactions.orderBy('date').reverse().toArray();
        setTransactions(txs);

        // 4. Customers
        setCustomers(await db.customers.toArray());

        // 5. Expenses
        setExpenses(await db.expenses.orderBy('date').reverse().toArray());

      } catch (error) {
        console.error("Failed to load database:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  // CRUD Operations - Update React State immediately (Optimistic) then update DB
  
  const addProduct = async (p: Product) => {
    setProducts(prev => [...prev, p]);
    await db.products.add(p);
  };

  const updateProduct = async (p: Product) => {
    setProducts(prev => prev.map(item => item.id === p.id ? p : item));
    await db.products.put(p);
  };

  const deleteProduct = async (id: string) => {
    setProducts(prev => prev.filter(item => item.id !== id));
    await db.products.delete(id);
  };
  
  const addTransaction = async (t: Transaction) => {
    setTransactions(prev => [t, ...prev]);
    await db.transactions.add(t);
    
    // Decrease stock for READY items
    // Note: We need to get the latest product state or update purely based on logic
    // For simplicity in this context, we iterate current state
    const newProducts = products.map(p => {
      const soldItem = t.items.find(i => i.productId === p.id);
      if (soldItem && p.type === 'READY') {
        const updated = { ...p, stock: p.stock - soldItem.quantity };
        // Fire and forget update to DB for this product
        db.products.put(updated); 
        return updated;
      }
      return p;
    });
    setProducts(newProducts);
  };

  const addCustomer = async (c: Customer) => {
    setCustomers(prev => [...prev, c]);
    await db.customers.add(c);
  };

  const deleteCustomer = async (id: string) => {
    setCustomers(prev => prev.filter(c => c.id !== id));
    await db.customers.delete(id);
  };

  const addExpense = async (e: Expense) => {
    setExpenses(prev => [e, ...prev]);
    await db.expenses.add(e);
  };

  const deleteExpense = async (id: string) => {
    setExpenses(prev => prev.filter(e => e.id !== id));
    await db.expenses.delete(id);
  };

  const updateSettings = async (s: StoreSettings) => {
    setSettings(s);
    await db.settings.put({ ...s, id: 'global' });
  };

  return (
    <StoreContext.Provider value={{
      products, transactions, customers, expenses, settings,
      addProduct, updateProduct, deleteProduct, addTransaction,
      addCustomer, deleteCustomer, addExpense, deleteExpense, updateSettings,
      isLoading
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
