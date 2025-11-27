import {
  partnersStore,
  phonesStore,
  customersStore,
  salesStore,
  installmentsStore,
} from "./store";

export function loadSampleData() {
  // بررسی اینکه آیا داده‌ای وجود دارد
  if (partnersStore.getAll().length > 0) {
    return false; // داده قبلاً بارگذاری شده
  }

  // شرکا
  partnersStore.add({
    name: "علی احمدی",
    capital: 50000000,
    share: 0,
  });

  partnersStore.add({
    name: "محمد رضایی",
    capital: 30000000,
    share: 0,
  });

  // حذف بخش گوشی‌ها - دیگر نیازی نیست

  // مشتریان
  const customer1 = customersStore.add({
    name: "حسین کریمی",
    phone: "09123456789",
    nationalId: "1234567890",
    address: "تهران، خیابان ولیعصر، پلاک ۱۲۳",
  });

  const customer2 = customersStore.add({
    name: "فاطمه محمدی",
    phone: "09198765432",
    nationalId: "0987654321",
    address: "تهران، خیابان انقلاب، پلاک ۴۵۶",
  });

  // فروش
  const announcedPrice = 22000000; // قیمت اعلامی به مشتری
  const purchasePrice = 20000000; // قیمت خرید واقعی
  const downPayment = 7000000; // پیش‌پرداخت
  const installmentMonths = 10;
  const initialProfit = announcedPrice - purchasePrice; // ۲ میلیون سود اولیه

  // محاسبه و ایجاد اقساط با سود ۴٪
  const remainingDebt = announcedPrice - downPayment; // ۱۵ میلیون
  const totalProfit = Math.round(remainingDebt * 0.04 * installmentMonths); // تقریبی
  
  const sale1 = salesStore.add({
    customerId: customer1.id,
    phoneId: crypto.randomUUID(),
    announcedPrice,
    purchasePrice,
    downPayment,
    installmentMonths,
    profitCalculationType: 'fixed_4_percent',
    monthlyInterestRate: 0.04,
    totalProfit,
    initialProfit,
    saleDate: "2024-02-05",
    status: "active",
  });
  let currentDebt = remainingDebt;
  const principalPerMonth = remainingDebt / installmentMonths; // ۱.۵ میلیون

  const saleDate = new Date("2024-02-05");
  for (let i = 1; i <= installmentMonths; i++) {
    const dueDate = new Date(saleDate);
    dueDate.setMonth(dueDate.getMonth() + i);
    
    const interestAmount = Math.round(currentDebt * 0.04); // سود ۴٪
    const principalAmount = Math.round(principalPerMonth);
    const totalAmount = principalAmount + interestAmount;
    
    currentDebt -= principalAmount;
    
    const isPaid = i <= 3; // ۳ قسط اول پرداخت شده
    
    installmentsStore.add({
      saleId: sale1.id,
      installmentNumber: i,
      principalAmount,
      interestAmount,
      totalAmount,
      remainingDebt: Math.max(0, Math.round(currentDebt)),
      dueDate: dueDate.toISOString(),
      status: isPaid ? "paid" : i === 4 ? "overdue" : "pending",
      paidDate: isPaid ? new Date(dueDate.getTime() - 86400000).toISOString() : undefined,
    });
  }

  // کاهش سرمایه (خرید گوشی انجام شده)
  const partners = partnersStore.getAll();
  const totalCapital = partners.reduce((sum, p) => sum + p.capital, 0);
  partners.forEach(partner => {
    const share = partner.capital / totalCapital;
    const deduction = Math.round(purchasePrice * share);
    partnersStore.update(partner.id, {
      availableCapital: partner.availableCapital - deduction,
    });
  });

  return true;
}

export async function clearAllData(onProgress?: (step: number) => void) {
  try {
    onProgress?.(0);
    // پاک کردن داده‌های API
    const { 
      partnersStore, 
      phonesStore, 
      customersStore, 
      salesStore, 
      installmentsStore,
      transactionsStore,
      expensesStore,
      investorsStore,
      investorTransactionsStore,
    } = await import('./storeProvider');
    
    // Step 1: حذف اقساط و فروش‌ها
    onProgress?.(1);
    const installments = await installmentsStore.getAll();
    for (const installment of installments) {
      await installmentsStore.delete(installment.id);
    }
    
    const sales = await salesStore.getAll();
    for (const sale of sales) {
      await salesStore.delete(sale.id);
    }
    
    // Step 2: حذف مشتریان و شرکا
    onProgress?.(2);
    const transactions = await transactionsStore.getAll();
    for (const transaction of transactions) {
      await transactionsStore.delete(transaction.id);
    }
    
    const partners = await partnersStore.getAll();
    for (const partner of partners) {
      await partnersStore.delete(partner.id);
    }
    
    const phones = await phonesStore.getAll();
    for (const phone of phones) {
      await phonesStore.delete(phone.id);
    }
    
    const customers = await customersStore.getAll();
    for (const customer of customers) {
      await customersStore.delete(customer.id);
    }
    
    // Step 3: حذف هزینه‌ها و سرمایه‌گذاران
    onProgress?.(3);
    const expenses = await expensesStore.getAll();
    for (const expense of expenses) {
      await expensesStore.delete(expense.id);
    }
    
    const investors = await investorsStore.getAll();
    for (const investor of investors) {
      await investorsStore.delete(investor.id);
    }
    
    // Step 4: پاکسازی نهایی
    onProgress?.(4);
    
    // پاک کردن localStorage (فقط داده‌های app، نه auth)
    const authUser = localStorage.getItem('auth_user');
    localStorage.clear();
    
    // Logout کاربر
    const { logout } = await import('./auth');
    logout();
    
    // رفرش صفحه و redirect به login
    window.location.href = '/login';
    return true;
  } catch (error) {
    console.error('Error clearing data:', error);
    return false;
  }
}
