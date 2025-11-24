import Dexie, { Table } from 'dexie';
import { Product, Transaction, Customer, Expense, StoreSettings } from './types';

// Extend the StoreSettings to include an ID for DB storage
export interface DBSettings extends StoreSettings {
  id: string;
}

export class SmartPOSDB extends Dexie {
  products!: Table<Product, string>;
  transactions!: Table<Transaction, string>;
  customers!: Table<Customer, string>;
  expenses!: Table<Expense, string>;
  settings!: Table<DBSettings, string>;

  constructor() {
    super('SmartPOSDB');
    (this as any).version(1).stores({
      products: 'id, type, name', // Indexed fields for faster search
      transactions: 'id, date, customerName, isPO',
      customers: 'id, name, phone',
      expenses: 'id, date',
      settings: 'id' // Singleton table
    });
  }
}

export const db = new SmartPOSDB();