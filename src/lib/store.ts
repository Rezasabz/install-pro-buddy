import { generateUUID } from './uuid';

// Types
export interface Partner {
  id: string;
  name: string;
  capital: number; // سرمایه اولیه
  availableCapital: number; // سرمایه در دسترس (بعد از خرید گوشی‌ها)
  initialProfit: number; // سود اولیه (تفاوت قیمت)
  monthlyProfit: number; // سود ماهانه (4%)
  share: number;
  createdAt: string;
}

export interface Transaction {
  id: string;
  partnerId: string;
  type: 'capital_add' | 'capital_withdraw' | 'initial_profit_withdraw' | 'monthly_profit_withdraw' | 'profit_to_capital'; // نوع تراکنش
  amount: number;
  description: string;
  date: string;
  profitType?: 'initial' | 'monthly' | 'both'; // نوع سود برای تبدیل به سرمایه
}

export interface Phone {
  id: string;
  brand: string;
  model: string;
  imei: string;
  purchasePrice: number;
  sellingPrice: number;
  status: 'available' | 'sold';
  purchaseDate: string;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  nationalId: string;
  address: string;
  createdAt: string;
}

export interface Sale {
  id: string;
  customerId: string;
  phoneId: string;
  announcedPrice: number; // قیمت اعلام شده به مشتری (مثلا 22 میلیون)
  purchasePrice: number; // قیمت خرید واقعی گوشی (مثلا 20 میلیون)
  downPayment: number; // پیش‌پرداخت
  installmentMonths: number; // تعداد ماه
  monthlyInterestRate: number; // نرخ سود ماهانه (مثلا 0.04 = 4%)
  initialProfit: number; // سود اولیه (تفاوت قیمت اعلامی و خرید)
  saleDate: string;
  status: 'active' | 'completed' | 'defaulted';
}

export interface Installment {
  id: string;
  saleId: string;
  installmentNumber: number; // شماره قسط (1، 2، 3، ...)
  principalAmount: number; // اصل بدهی
  interestAmount: number; // سود 4%
  totalAmount: number; // مجموع (اصل + سود)
  remainingDebt: number; // مانده بدهی بعد از این قسط
  dueDate: string;
  paidDate?: string;
  status: 'pending' | 'paid' | 'overdue';
}

// Storage keys
const STORAGE_KEYS = {
  PARTNERS: 'partners',
  PHONES: 'phones',
  CUSTOMERS: 'customers',
  SALES: 'sales',
  INSTALLMENTS: 'installments',
  TRANSACTIONS: 'transactions',
};

// Helper functions
function getFromStorage<T>(key: string): T[] {
  const data = localStorage.getItem(key);
  return data ? JSON.parse(data) : [];
}

function saveToStorage<T>(key: string, data: T[]): void {
  localStorage.setItem(key, JSON.stringify(data));
}

// Partners
export const partnersStore = {
  getAll: (): Partner[] => getFromStorage<Partner>(STORAGE_KEYS.PARTNERS),
  
  add: (partner: Omit<Partner, 'id' | 'createdAt' | 'availableCapital' | 'initialProfit' | 'monthlyProfit'>): Partner => {
    const partners = partnersStore.getAll();
    const newPartner: Partner = {
      ...partner,
      id: generateUUID(),
      availableCapital: partner.capital, // در ابتدا تمام سرمایه در دسترس است
      initialProfit: 0,
      monthlyProfit: 0,
      createdAt: new Date().toISOString(),
    };
    partners.push(newPartner);
    saveToStorage(STORAGE_KEYS.PARTNERS, partners);
    return newPartner;
  },
  
  update: (id: string, updates: Partial<Partner>): Partner | null => {
    const partners = partnersStore.getAll();
    const index = partners.findIndex(p => p.id === id);
    if (index === -1) return null;
    
    partners[index] = { ...partners[index], ...updates };
    saveToStorage(STORAGE_KEYS.PARTNERS, partners);
    return partners[index];
  },
  
  delete: (id: string): boolean => {
    const partners = partnersStore.getAll();
    const filtered = partners.filter(p => p.id !== id);
    if (filtered.length === partners.length) return false;
    
    saveToStorage(STORAGE_KEYS.PARTNERS, filtered);
    return true;
  },
};

// Phones
export const phonesStore = {
  getAll: (): Phone[] => getFromStorage<Phone>(STORAGE_KEYS.PHONES),
  
  add: (phone: Omit<Phone, 'id'>): Phone => {
    const phones = phonesStore.getAll();
    const newPhone: Phone = {
      ...phone,
      id: generateUUID(),
    };
    phones.push(newPhone);
    saveToStorage(STORAGE_KEYS.PHONES, phones);
    return newPhone;
  },
  
  update: (id: string, updates: Partial<Phone>): Phone | null => {
    const phones = phonesStore.getAll();
    const index = phones.findIndex(p => p.id === id);
    if (index === -1) return null;
    
    phones[index] = { ...phones[index], ...updates };
    saveToStorage(STORAGE_KEYS.PHONES, phones);
    return phones[index];
  },
  
  delete: (id: string): boolean => {
    const phones = phonesStore.getAll();
    const filtered = phones.filter(p => p.id !== id);
    if (filtered.length === phones.length) return false;
    
    saveToStorage(STORAGE_KEYS.PHONES, filtered);
    return true;
  },
};

// Customers
export const customersStore = {
  getAll: (): Customer[] => getFromStorage<Customer>(STORAGE_KEYS.CUSTOMERS),
  
  add: (customer: Omit<Customer, 'id' | 'createdAt'>): Customer => {
    const customers = customersStore.getAll();
    const newCustomer: Customer = {
      ...customer,
      id: generateUUID(),
      createdAt: new Date().toISOString(),
    };
    customers.push(newCustomer);
    saveToStorage(STORAGE_KEYS.CUSTOMERS, customers);
    return newCustomer;
  },
  
  update: (id: string, updates: Partial<Customer>): Customer | null => {
    const customers = customersStore.getAll();
    const index = customers.findIndex(c => c.id === id);
    if (index === -1) return null;
    
    customers[index] = { ...customers[index], ...updates };
    saveToStorage(STORAGE_KEYS.CUSTOMERS, customers);
    return customers[index];
  },
  
  delete: (id: string): boolean => {
    const customers = customersStore.getAll();
    const filtered = customers.filter(c => c.id !== id);
    if (filtered.length === customers.length) return false;
    
    saveToStorage(STORAGE_KEYS.CUSTOMERS, filtered);
    return true;
  },
};

// Sales
export const salesStore = {
  getAll: (): Sale[] => getFromStorage<Sale>(STORAGE_KEYS.SALES),
  
  add: (sale: Omit<Sale, 'id'>): Sale => {
    const sales = salesStore.getAll();
    const newSale: Sale = {
      ...sale,
      id: generateUUID(),
    };
    sales.push(newSale);
    saveToStorage(STORAGE_KEYS.SALES, sales);
    return newSale;
  },
  
  update: (id: string, updates: Partial<Sale>): Sale | null => {
    const sales = salesStore.getAll();
    const index = sales.findIndex(s => s.id === id);
    if (index === -1) return null;
    
    sales[index] = { ...sales[index], ...updates };
    saveToStorage(STORAGE_KEYS.SALES, sales);
    return sales[index];
  },
  
  delete: (id: string): boolean => {
    const sales = salesStore.getAll();
    const filtered = sales.filter(s => s.id !== id);
    if (filtered.length === sales.length) return false;
    
    saveToStorage(STORAGE_KEYS.SALES, filtered);
    return true;
  },
};

// Installments
export const installmentsStore = {
  getAll: (): Installment[] => getFromStorage<Installment>(STORAGE_KEYS.INSTALLMENTS),
  
  getBySaleId: (saleId: string): Installment[] => {
    return installmentsStore.getAll().filter(i => i.saleId === saleId);
  },
  
  add: (installment: Omit<Installment, 'id'>): Installment => {
    const installments = installmentsStore.getAll();
    const newInstallment: Installment = {
      ...installment,
      id: generateUUID(),
    };
    installments.push(newInstallment);
    saveToStorage(STORAGE_KEYS.INSTALLMENTS, installments);
    return newInstallment;
  },
  
  update: (id: string, updates: Partial<Installment>): Installment | null => {
    const installments = installmentsStore.getAll();
    const index = installments.findIndex(i => i.id === id);
    if (index === -1) return null;
    
    installments[index] = { ...installments[index], ...updates };
    saveToStorage(STORAGE_KEYS.INSTALLMENTS, installments);
    return installments[index];
  },
  
  delete: (id: string): boolean => {
    const installments = installmentsStore.getAll();
    const filtered = installments.filter(i => i.id !== id);
    if (filtered.length === installments.length) return false;
    
    saveToStorage(STORAGE_KEYS.INSTALLMENTS, filtered);
    return true;
  },
};

// Transactions
export const transactionsStore = {
  getAll: (): Transaction[] => getFromStorage<Transaction>(STORAGE_KEYS.TRANSACTIONS),
  
  getByPartnerId: (partnerId: string): Transaction[] => {
    return transactionsStore.getAll().filter(t => t.partnerId === partnerId);
  },
  
  add: (transaction: Omit<Transaction, 'id' | 'date'>): Transaction => {
    const transactions = transactionsStore.getAll();
    const newTransaction: Transaction = {
      ...transaction,
      id: generateUUID(),
      date: new Date().toISOString(),
    };
    transactions.push(newTransaction);
    saveToStorage(STORAGE_KEYS.TRANSACTIONS, transactions);
    return newTransaction;
  },
  
  delete: (id: string): boolean => {
    const transactions = transactionsStore.getAll();
    const filtered = transactions.filter(t => t.id !== id);
    if (filtered.length === transactions.length) return false;
    
    saveToStorage(STORAGE_KEYS.TRANSACTIONS, filtered);
    return true;
  },
};
