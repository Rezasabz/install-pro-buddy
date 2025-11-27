// API Store - connects to FastAPI backend

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

// Types
export type ProfitCalculationType = 'fixed_4_percent' | 'monthly_4_percent_lda' | 'custom_annual';
export interface Partner {
  id: string;
  name: string;
  capital: number;
  availableCapital: number;
  initialProfit: number;
  monthlyProfit: number;
  share: number;
  createdAt: string;
}

export interface Transaction {
  id: string;
  partnerId: string;
  type: 'capital_add' | 'capital_withdraw' | 'initial_profit_withdraw' | 'monthly_profit_withdraw' | 'profit_to_capital';
  amount: number;
  description: string;
  date: string;
  profitType?: 'initial' | 'monthly' | 'both';
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
  color?: string;
  storage?: string;
  condition?: string;
  purchaseSource?: string;
  notes?: string;
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
  announcedPrice: number;
  purchasePrice: number;
  downPayment: number;
  installmentMonths: number;
  profitCalculationType: ProfitCalculationType;
  customProfitRate?: number;
  monthlyInterestRate: number;
  totalProfit: number;
  initialProfit: number;
  saleDate: string;
  status: 'active' | 'completed' | 'defaulted';
}

export interface Installment {
  id: string;
  saleId: string;
  installmentNumber: number;
  principalAmount: number;
  interestAmount: number;
  totalAmount: number;
  remainingDebt: number;
  dueDate: string;
  paidDate?: string;
  status: 'pending' | 'paid' | 'overdue';
}

export interface Expense {
  id: string;
  date: string;
  type: string;
  amount: number;
  description: string;
  createdAt: string;
}

export interface Investor {
  id: string;
  name: string;
  phone: string;
  nationalId: string;
  investmentAmount: number;
  profitRate: number;
  totalProfit: number;
  startDate: string;
  status: 'active' | 'inactive';
  createdAt: string;
}

export interface InvestorTransaction {
  id: string;
  investorId: string;
  type: 'profit_payment' | 'investment_add' | 'investment_withdraw';
  amount: number;
  description: string;
  date: string;
}

// Helper function for API calls
async function apiCall<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`API Error: ${response.status} - ${error}`);
  }

  return response.json();
}

// Partners Store
export const partnersStore = {
  getAll: async (): Promise<Partner[]> => {
    return await apiCall<Partner[]>('/api/partners');
  },

  add: async (partner: Omit<Partner, 'id' | 'createdAt' | 'availableCapital' | 'initialProfit' | 'monthlyProfit'>): Promise<Partner> => {
    return await apiCall<Partner>('/api/partners', {
      method: 'POST',
      body: JSON.stringify(partner),
    });
  },

  update: async (id: string, updates: Partial<Partner>): Promise<Partner | null> => {
    return await apiCall<Partner>(`/api/partners/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  },

  delete: async (id: string): Promise<boolean> => {
    await apiCall(`/api/partners/${id}`, {
      method: 'DELETE',
    });
    return true;
  },
};

// Phones Store
export const phonesStore = {
  getAll: async (): Promise<Phone[]> => {
    return await apiCall<Phone[]>('/api/phones/');
  },

  add: async (phone: Omit<Phone, 'id'>): Promise<Phone> => {
    return await apiCall<Phone>('/api/phones/', {
      method: 'POST',
      body: JSON.stringify(phone),
    });
  },

  update: async (id: string, updates: Partial<Phone>): Promise<Phone | null> => {
    return await apiCall<Phone>(`/api/phones/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  },

  delete: async (id: string): Promise<boolean> => {
    await apiCall(`/api/phones/${id}`, {
      method: 'DELETE',
    });
    return true;
  },
};

// Customers Store
export const customersStore = {
  getAll: async (): Promise<Customer[]> => {
    return await apiCall<Customer[]>('/api/customers');
  },

  add: async (customer: Omit<Customer, 'id' | 'createdAt'>): Promise<Customer> => {
    return await apiCall<Customer>('/api/customers', {
      method: 'POST',
      body: JSON.stringify(customer),
    });
  },

  update: async (id: string, updates: Partial<Customer>): Promise<Customer | null> => {
    return await apiCall<Customer>(`/api/customers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  },

  delete: async (id: string): Promise<boolean> => {
    await apiCall(`/api/customers/${id}`, {
      method: 'DELETE',
    });
    return true;
  },
};

// Sales Store
export const salesStore = {
  getAll: async (): Promise<Sale[]> => {
    return await apiCall<Sale[]>('/api/sales');
  },

  add: async (sale: Omit<Sale, 'id'>): Promise<Sale> => {
    return await apiCall<Sale>('/api/sales', {
      method: 'POST',
      body: JSON.stringify(sale),
    });
  },

  update: async (id: string, updates: Partial<Sale>): Promise<Sale | null> => {
    return await apiCall<Sale>(`/api/sales/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  },

  delete: async (id: string): Promise<boolean> => {
    await apiCall(`/api/sales/${id}`, {
      method: 'DELETE',
    });
    return true;
  },
};

// Installments Store
export const installmentsStore = {
  getAll: async (): Promise<Installment[]> => {
    return await apiCall<Installment[]>('/api/installments');
  },

  getBySaleId: async (saleId: string): Promise<Installment[]> => {
    return await apiCall<Installment[]>(`/api/installments/sale/${saleId}`);
  },

  add: async (installment: Omit<Installment, 'id'>): Promise<Installment> => {
    return await apiCall<Installment>('/api/installments', {
      method: 'POST',
      body: JSON.stringify(installment),
    });
  },

  update: async (id: string, updates: Partial<Installment>): Promise<Installment | null> => {
    return await apiCall<Installment>(`/api/installments/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  },

  delete: async (id: string): Promise<boolean> => {
    await apiCall(`/api/installments/${id}`, {
      method: 'DELETE',
    });
    return true;
  },
};

// Transactions Store
export const transactionsStore = {
  getAll: async (): Promise<Transaction[]> => {
    return await apiCall<Transaction[]>('/api/transactions');
  },

  getByPartnerId: async (partnerId: string): Promise<Transaction[]> => {
    return await apiCall<Transaction[]>(`/api/transactions/partner/${partnerId}`);
  },

  add: async (transaction: Omit<Transaction, 'id' | 'date'>): Promise<Transaction> => {
    return await apiCall<Transaction>('/api/transactions', {
      method: 'POST',
      body: JSON.stringify(transaction),
    });
  },

  delete: async (id: string): Promise<boolean> => {
    await apiCall(`/api/transactions/${id}`, {
      method: 'DELETE',
    });
    return true;
  },
};

// Expenses Store (با fallback به localStorage)
export const expensesStore = {
  getAll: async (): Promise<Expense[]> => {
    try {
      return await apiCall<Expense[]>('/api/expenses');
    } catch (error) {
      // Fallback to localStorage if backend doesn't have expenses endpoint yet
      const data = localStorage.getItem('expenses');
      return data ? JSON.parse(data) : [];
    }
  },

  getById: async (id: string): Promise<Expense> => {
    try {
      return await apiCall<Expense>(`/api/expenses/${id}`);
    } catch (error) {
      const expenses = await expensesStore.getAll();
      const expense = expenses.find(e => e.id === id);
      if (!expense) throw new Error('Expense not found');
      return expense;
    }
  },

  add: async (expense: Omit<Expense, 'id' | 'createdAt'>): Promise<Expense> => {
    try {
      return await apiCall<Expense>('/api/expenses', {
        method: 'POST',
        body: JSON.stringify(expense),
      });
    } catch (error) {
      // Fallback to localStorage
      const expenses = await expensesStore.getAll();
      const newExpense: Expense = {
        ...expense,
        id: Date.now().toString(),
        createdAt: new Date().toISOString(),
      };
      expenses.push(newExpense);
      localStorage.setItem('expenses', JSON.stringify(expenses));
      return newExpense;
    }
  },

  update: async (id: string, updates: Partial<Omit<Expense, 'id' | 'createdAt'>>): Promise<Expense> => {
    try {
      return await apiCall<Expense>(`/api/expenses/${id}`, {
        method: 'PUT',
        body: JSON.stringify(updates),
      });
    } catch (error) {
      // Fallback to localStorage
      const expenses = await expensesStore.getAll();
      const index = expenses.findIndex(e => e.id === id);
      if (index === -1) throw new Error('Expense not found');
      expenses[index] = { ...expenses[index], ...updates };
      localStorage.setItem('expenses', JSON.stringify(expenses));
      return expenses[index];
    }
  },

  delete: async (id: string): Promise<boolean> => {
    try {
      await apiCall(`/api/expenses/${id}`, {
        method: 'DELETE',
      });
      return true;
    } catch (error) {
      // Fallback to localStorage
      const expenses = await expensesStore.getAll();
      const filtered = expenses.filter(e => e.id !== id);
      localStorage.setItem('expenses', JSON.stringify(filtered));
      return true;
    }
  },

  getByDateRange: async (startDate: string, endDate: string): Promise<Expense[]> => {
    const expenses = await expensesStore.getAll();
    return expenses.filter(e => {
      const expenseDate = new Date(e.date);
      const start = new Date(startDate);
      const end = new Date(endDate);
      return expenseDate >= start && expenseDate <= end;
    });
  },

  getByType: async (type: string): Promise<Expense[]> => {
    const expenses = await expensesStore.getAll();
    return expenses.filter(e => e.type === type);
  },

  getTotalAmount: async (): Promise<number> => {
    const expenses = await expensesStore.getAll();
    return expenses.reduce((sum, e) => sum + e.amount, 0);
  },
};

// Health check
export async function checkApiHealth(): Promise<boolean> {
  try {
    await apiCall('/health');
    return true;
  } catch {
    return false;
  }
}

// Investors
export const investorsStore = {
  getAll: (): Promise<Investor[]> => apiCall('/api/investors/'),
  
  add: (investor: Omit<Investor, 'id' | 'createdAt' | 'totalProfit'>): Promise<Investor> =>
    apiCall('/api/investors/', {
      method: 'POST',
      body: JSON.stringify(investor),
    }),
  
  update: (id: string, updates: Partial<Investor>): Promise<Investor> =>
    apiCall(`/api/investors/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    }),
  
  delete: (id: string): Promise<void> =>
    apiCall(`/api/investors/${id}`, {
      method: 'DELETE',
    }),
  
  adjustCapital: (id: string, amount: number, description?: string): Promise<Investor> =>
    apiCall(`/api/investors/${id}/capital/adjust`, {
      method: 'POST',
      body: JSON.stringify({ amount, description: description || '' }),
    }),
};

// Investor Transactions
export const investorTransactionsStore = {
  getAll: (): Promise<InvestorTransaction[]> => apiCall('/api/investors/transactions/all'),
  
  getByInvestorId: (investorId: string): Promise<InvestorTransaction[]> =>
    apiCall(`/api/investors/${investorId}/transactions`),
  
  add: (transaction: Omit<InvestorTransaction, 'id' | 'date'>): Promise<InvestorTransaction> =>
    apiCall('/api/investors/transactions/', {
      method: 'POST',
      body: JSON.stringify(transaction),
    }),
  
  delete: (id: string): Promise<void> => {
    // Note: Backend doesn't have individual transaction delete yet
    // This is a placeholder for future implementation
    throw new Error('Delete investor transaction not implemented in backend');
  },
};
