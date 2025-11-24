// Store Provider - uses FastAPI backend with SQLite
import * as apiStore from './apiStore';

export type {
  Partner,
  Transaction,
  Phone,
  Customer,
  Sale,
  Installment,
  Expense,
  Investor,
  InvestorTransaction,
  ProfitCalculationType,
} from './store';

// Direct export of API stores - no localStorage fallback
export const partnersStore = apiStore.partnersStore;
export const phonesStore = apiStore.phonesStore;
export const customersStore = apiStore.customersStore;
export const salesStore = apiStore.salesStore;
export const installmentsStore = apiStore.installmentsStore;
export const transactionsStore = apiStore.transactionsStore;
export const expensesStore = apiStore.expensesStore;

// Investors use localStorage (not in API yet)
import * as localStore from './store';
export const investorsStore = localStore.investorsStore;
export const investorTransactionsStore = localStore.investorTransactionsStore;

// Health check
export const checkApiHealth = apiStore.checkApiHealth;
