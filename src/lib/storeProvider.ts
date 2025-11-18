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
  ProfitCalculationType,
} from './apiStore';

// Direct export of API stores - no localStorage fallback
export const partnersStore = apiStore.partnersStore;
export const phonesStore = apiStore.phonesStore;
export const customersStore = apiStore.customersStore;
export const salesStore = apiStore.salesStore;
export const installmentsStore = apiStore.installmentsStore;
export const transactionsStore = apiStore.transactionsStore;
export const expensesStore = apiStore.expensesStore;

// Health check
export const checkApiHealth = apiStore.checkApiHealth;
