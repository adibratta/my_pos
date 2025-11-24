export type ProductType = 'READY' | 'PO';

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  cost: number; // For profit calculation
  stock: number;
  type: ProductType;
  poDeadline?: string; // ISO date string
  image?: string;
}

export interface CartItem extends Product {
  quantity: number;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email: string;
  address: string;
}

export interface TransactionItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  subtotal: number;
  type: ProductType;
}

export interface Transaction {
  id: string;
  date: string; // ISO date string
  items: TransactionItem[];
  total: number;
  profit: number;
  customerName: string;
  customerPhone?: string;
  customerAddress?: string;
  paymentMethod: 'CASH' | 'QRIS' | 'TRANSFER';
  isPO: boolean; // True if contains any PO items
}

export interface Expense {
  id: string;
  date: string;
  description: string;
  amount: number;
  category: string;
}

export interface StoreSettings {
  name: string;
  address: string;
  logo: string; // Base64
  pin: string; // 6 digits
  currencySymbol: string;
}

export interface SalesReport {
  totalRevenue: number;
  totalProfit: number;
  totalTransactions: number;
  bestSeller: string;
}