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

  const sale1 = salesStore.add({
    customerId: customer1.id,
    phoneId: crypto.randomUUID(),
    announcedPrice,
    purchasePrice,
    downPayment,
    installmentMonths,
    monthlyInterestRate: 0.04,
    initialProfit,
    saleDate: "2024-02-05",
    status: "active",
  });

  // محاسبه و ایجاد اقساط با سود ۴٪
  const remainingDebt = announcedPrice - downPayment; // ۱۵ میلیون
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

export function clearAllData() {
  localStorage.clear();
  window.location.reload();
}
