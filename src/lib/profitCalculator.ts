import { partnersStore, salesStore, installmentsStore, Partner, Sale, Installment } from "./storeProvider";

/**
 * محاسبه شرکای موجود در یک تاریخ خاص
 * این تابع تاریخچه شرکا رو در نظر می‌گیره تا حتی اگر شریک حذف شده باشه، در محاسبات گذشته لحاظ بشه
 */
async function getPartnersAtDate(targetDate: Date): Promise<Partner[]> {
  // فعلاً از شرکای فعلی استفاده می‌کنیم
  // در آینده می‌تونیم از جدول partner_history استفاده کنیم
  const allPartners = await partnersStore.getAll();
  return allPartners.filter(p => new Date(p.createdAt) <= targetDate);
}

/**
 * محاسبه سرمایه کل در یک تاریخ خاص
 */
async function getTotalCapitalAtDate(targetDate: Date): Promise<number> {
  const partnersAtDate = await getPartnersAtDate(targetDate);
  return partnersAtDate.reduce((sum, p) => sum + p.capital, 0);
}

export interface PartnerFinancials {
  partnerId: string;
  partnerName: string;
  initialCapital: number; // سرمایه اولیه
  availableCapital: number; // سرمایه در دسترس
  usedCapital: number; // سرمایه استفاده شده
  share: number; // درصد سهم
  initialProfit: number; // سود اولیه (تفاوت قیمت) - از Partner
  monthlyProfit: number; // سود ماهانه (4%) - از Partner
  totalProfit: number; // مجموع سود
}

export interface FinancialSummary {
  totalCapital: number;
  totalAvailableCapital: number;
  totalUsedCapital: number;
  totalInitialProfit: number;
  totalMonthlyProfit: number;
  totalProfit: number;
  partnerFinancials: PartnerFinancials[];
}

/**
 * محاسبه اقساط با سود 4% ماهانه روی مانده
 */
export function calculateInstallments(
  remainingDebt: number,
  installmentMonths: number,
  monthlyInterestRate: number = 0.04
): Array<{
  installmentNumber: number;
  principalAmount: number;
  interestAmount: number;
  totalAmount: number;
  remainingDebt: number;
}> {
  const installments = [];
  let currentDebt = remainingDebt;
  
  // محاسبه دقیق اصل قسط برای هر ماه
  const basePrincipal = Math.floor(remainingDebt / installmentMonths);
  const remainder = remainingDebt - (basePrincipal * installmentMonths);

  for (let i = 1; i <= installmentMonths; i++) {
    // محاسبه سود بر اساس مانده فعلی
    const interestAmount = Math.round(currentDebt * monthlyInterestRate * 100) / 100;
    
    // توزیع باقی‌مانده در اقساط اول
    const principalAmount = basePrincipal + (i <= remainder ? 1 : 0);
    
    const totalAmount = principalAmount + interestAmount;
    
    currentDebt -= principalAmount;
    
    installments.push({
      installmentNumber: i,
      principalAmount,
      interestAmount,
      totalAmount,
      remainingDebt: Math.max(0, currentDebt),
    });
  }

  return installments;
}

/**
 * محاسبه وضعیت مالی کل و هر شریک
 * @deprecated این تابع deprecated شده - از calculateFinancialsFromData استفاده کنید
 */
export function calculateFinancials(): FinancialSummary {
  // این تابع deprecated شده و فقط برای backward compatibility هست
  // داده‌های خالی برمی‌گردونه
  return {
    totalCapital: 0,
    totalAvailableCapital: 0,
    totalUsedCapital: 0,
    totalInitialProfit: 0,
    totalMonthlyProfit: 0,
    totalProfit: 0,
    partnerFinancials: [],
  };
}

/**
 * محاسبه وضعیت مالی کل و هر شریک (نسخه قدیمی با localStorage)
 * @deprecated این تابع دیگر استفاده نمی‌شه
 */
async function calculateFinancialsOld(): Promise<FinancialSummary> {
  const localStore = await import('./store');
  const partners = localStore.partnersStore.getAll();
  const sales = localStore.salesStore.getAll();
  const allInstallments = localStore.installmentsStore.getAll();

  // محاسبه سرمایه کل
  const totalCapital = partners.reduce((sum, p) => sum + p.capital, 0);
  const totalAvailableCapital = partners.reduce((sum, p) => sum + p.availableCapital, 0);
  const totalUsedCapital = totalCapital - totalAvailableCapital;

  // محاسبه سود اولیه (تفاوت قیمت اعلامی و خرید)
  const totalInitialProfit = sales.reduce((sum, sale) => sum + sale.initialProfit, 0);

  // محاسبه سود ماهانه (4% که پرداخت شده)
  const paidInstallments = allInstallments.filter(i => i.status === 'paid');
  const totalMonthlyProfit = paidInstallments.reduce((sum, inst) => sum + inst.interestAmount, 0);

  // مجموع سود
  const totalProfit = totalInitialProfit + totalMonthlyProfit;

  // محاسبه سهم هر شریک
  const partnerFinancials: PartnerFinancials[] = partners.map(partner => {
    const share = totalCapital > 0 ? (partner.capital / totalCapital) * 100 : 0;
    const usedCapital = partner.capital - partner.availableCapital;
    
    // سود مستقیماً از Partner گرفته می‌شود
    const initialProfit = partner.initialProfit || 0;
    const monthlyProfit = partner.monthlyProfit || 0;
    const totalPartnerProfit = initialProfit + monthlyProfit;

    return {
      partnerId: partner.id,
      partnerName: partner.name,
      initialCapital: partner.capital,
      availableCapital: partner.availableCapital,
      usedCapital,
      share,
      initialProfit,
      monthlyProfit,
      totalProfit: totalPartnerProfit,
    };
  });

  return {
    totalCapital,
    totalAvailableCapital,
    totalUsedCapital,
    totalInitialProfit,
    totalMonthlyProfit,
    totalProfit,
    partnerFinancials,
  };
}

/**
 * بازسازی تاریخچه شرکا از روی داده‌های موجود
 * این تابع تاریخچه شرکا رو از روی فروش‌ها و اقساط بازسازی می‌کنه
 * شامل شرکای غیرفعال هم می‌شه تا محاسبات گذشته درست بمونه
 */
function reconstructPartnerHistory(
  allPartners: Partner[], // شامل فعال و غیرفعال
  sales: Sale[],
  allInstallments: Installment[]
): Map<string, Partner[]> {
  // مپ تاریخ به لیست شرکای موجود در آن تاریخ
  const historyMap = new Map<string, Partner[]>();
  
  // تمام تاریخ‌های مهم رو جمع‌آوری می‌کنیم
  const importantDates = new Set<string>();
  
  // تاریخ‌های ورود شرکا
  allPartners.forEach(p => importantDates.add(p.createdAt));
  
  // تاریخ‌های حذف شرکا
  allPartners.forEach(p => {
    if (p.deletedAt) importantDates.add(p.deletedAt);
  });
  
  // تاریخ‌های فروش
  sales.forEach(s => importantDates.add(s.saleDate));
  
  // تاریخ‌های اقساط
  allInstallments.forEach(i => importantDates.add(i.dueDate));
  
  // برای هر تاریخ، شرکای موجود رو محاسبه می‌کنیم
  Array.from(importantDates).sort().forEach(dateStr => {
    const date = new Date(dateStr);
    const partnersAtDate = allPartners.filter(p => {
      const joinDate = new Date(p.createdAt);
      const deleteDate = p.deletedAt ? new Date(p.deletedAt) : null;
      
      // شریک باید قبل از این تاریخ وارد شده باشه
      // و یا حذف نشده باشه یا بعد از این تاریخ حذف شده باشه
      return joinDate <= date && (!deleteDate || deleteDate > date);
    });
    historyMap.set(dateStr, partnersAtDate);
  });
  
  return historyMap;
}

/**
 * محاسبه وضعیت مالی با داده‌های ورودی (برای استفاده با API)
 * شرکا فقط از زمان ورودشان سهم سود دارند
 * این نسخه تاریخچه شرکا رو بازسازی می‌کنه تا حتی اگر شریک حذف شده باشه، محاسبات درست بمونه
 */
export function calculateFinancialsFromData(
  partners: Partner[],
  sales: Sale[],
  allInstallments: Installment[],
  allPartnersIncludingInactive?: Partner[]
): FinancialSummary {
  // استفاده از تمام شرکا (شامل غیرفعال‌ها) برای بازسازی تاریخچه
  const partnersForHistory = allPartnersIncludingInactive || partners;
  const partnerHistory = reconstructPartnerHistory(partnersForHistory, sales, allInstallments);
  
  // محاسبه سرمایه کل
  const totalCapital = partners.reduce((sum, p) => sum + p.capital, 0);
  const totalAvailableCapital = partners.reduce((sum, p) => sum + p.availableCapital, 0);
  
  // محاسبه سرمایه استفاده شده واقعی از فروش‌ها و اقساط
  const totalPurchasePrice = sales.reduce((sum, sale) => sum + (sale.purchasePrice || 0), 0);
  const paidInstallments = allInstallments.filter(i => i.status === 'paid');
  const totalPaidPrincipal = paidInstallments.reduce((sum, inst) => sum + (inst.principalAmount || 0), 0);
  const totalUsedCapital = totalPurchasePrice - totalPaidPrincipal;

  // محاسبه سود اولیه کل (تفاوت قیمت اعلامی و خرید)
  const totalInitialProfitFromSales = sales.reduce((sum, sale) => sum + (sale.initialProfit || 0), 0);

  // محاسبه سود ماهانه کل (4% که پرداخت شده)
  const totalMonthlyProfitFromInstallments = paidInstallments.reduce((sum, inst) => sum + (inst.interestAmount || 0), 0);

  // محاسبه سهم هر شریک بر اساس زمان ورود و سرمایه
  const partnerFinancials: PartnerFinancials[] = partners.map(partner => {
    const partnerJoinDate = new Date(partner.createdAt);
    
    // محاسبه سود اولیه: فقط از فروش‌هایی که بعد از ورود شریک انجام شده
    const salesAfterJoin = sales.filter(sale => new Date(sale.saleDate) >= partnerJoinDate);
    
    // محاسبه سود ماهانه: فقط از اقساطی که بعد از ورود شریک پرداخت شده
    const installmentsAfterJoin = paidInstallments.filter(inst => {
      const relatedSale = sales.find(sale => sale.id === inst.saleId);
      return relatedSale && new Date(inst.dueDate) >= partnerJoinDate;
    });
    
    // محاسبه سهم شریک در زمان هر فروش/قسط با استفاده از تاریخچه بازسازی شده
    let calculatedInitialProfit = 0;
    let calculatedMonthlyProfit = 0;
    
    // سود اولیه: محاسبه سهم در هر فروش بر اساس شرکای موجود در آن زمان
    for (const sale of salesAfterJoin) {
      const partnersAtSaleTime = partnerHistory.get(sale.saleDate) || [];
      const totalCapitalAtSaleTime = partnersAtSaleTime.reduce((sum, p) => sum + p.capital, 0);
      
      if (totalCapitalAtSaleTime > 0) {
        const shareAtSaleTime = partner.capital / totalCapitalAtSaleTime;
        calculatedInitialProfit += (sale.initialProfit || 0) * shareAtSaleTime;
      }
    }
    
    // سود ماهانه: محاسبه سهم در هر قسط بر اساس شرکای موجود در آن زمان
    for (const inst of installmentsAfterJoin) {
      const partnersAtInstallmentTime = partnerHistory.get(inst.dueDate) || [];
      const totalCapitalAtInstallmentTime = partnersAtInstallmentTime.reduce((sum, p) => sum + p.capital, 0);
      
      if (totalCapitalAtInstallmentTime > 0) {
        const shareAtInstallmentTime = partner.capital / totalCapitalAtInstallmentTime;
        calculatedMonthlyProfit += (inst.interestAmount || 0) * shareAtInstallmentTime;
      }
    }
    
    // محاسبه سرمایه استفاده شده واقعی این شریک
    let partnerUsedCapital = 0;
    let partnerReturnedCapital = 0;
    
    // محاسبه سرمایه استفاده شده: فقط از فروش‌هایی که بعد از ورود شریک انجام شده
    for (const sale of salesAfterJoin) {
      const partnersAtSaleTime = partnerHistory.get(sale.saleDate) || [];
      const totalCapitalAtSaleTime = partnersAtSaleTime.reduce((sum, p) => sum + p.capital, 0);
      
      if (totalCapitalAtSaleTime > 0) {
        const shareAtSaleTime = partner.capital / totalCapitalAtSaleTime;
        partnerUsedCapital += (sale.purchasePrice || 0) * shareAtSaleTime;
      }
    }
    
    // محاسبه سرمایه برگشتی: فقط از اقساطی که بعد از ورود شریک پرداخت شده
    for (const inst of installmentsAfterJoin) {
      const partnersAtInstallmentTime = partnerHistory.get(inst.dueDate) || [];
      const totalCapitalAtInstallmentTime = partnersAtInstallmentTime.reduce((sum, p) => sum + p.capital, 0);
      
      if (totalCapitalAtInstallmentTime > 0) {
        const shareAtInstallmentTime = partner.capital / totalCapitalAtInstallmentTime;
        partnerReturnedCapital += (inst.principalAmount || 0) * shareAtInstallmentTime;
      }
    }
    
    const usedCapital = partnerUsedCapital - partnerReturnedCapital;
    
    // سهم فعلی بر اساس سرمایه کل فعلی
    const currentShare = totalCapital > 0 ? (partner.capital / totalCapital) : 0;
    const sharePercentage = currentShare * 100;
    
    const calculatedTotalProfit = calculatedInitialProfit + calculatedMonthlyProfit;
    
    // محاسبه سرمایه در دسترس واقعی
    const calculatedAvailableCapital = Math.max(0, partner.capital - usedCapital);

    return {
      partnerId: partner.id,
      partnerName: partner.name,
      initialCapital: partner.capital,
      availableCapital: calculatedAvailableCapital,
      usedCapital,
      share: sharePercentage,
      initialProfit: calculatedInitialProfit,
      monthlyProfit: calculatedMonthlyProfit,
      totalProfit: calculatedTotalProfit,
    };
  });

  // مجموع سود کل
  const totalProfit = totalInitialProfitFromSales + totalMonthlyProfitFromInstallments;
  
  // محاسبه مجموع سرمایه در دسترس واقعی
  const calculatedTotalAvailableCapital = partnerFinancials.reduce((sum, p) => sum + p.availableCapital, 0);

  return {
    totalCapital,
    totalAvailableCapital: calculatedTotalAvailableCapital,
    totalUsedCapital,
    totalInitialProfit: totalInitialProfitFromSales,
    totalMonthlyProfit: totalMonthlyProfitFromInstallments,
    totalProfit,
    partnerFinancials,
  };
}

/**
 * بررسی اینکه آیا سرمایه کافی برای خرید گوشی وجود دارد
 * فقط شرکایی که در زمان خرید موجود هستند در نظر گرفته می‌شوند
 */
export function checkCapitalAvailability(purchasePrice: number, partners: Partner[], purchaseDate?: Date): {
  isAvailable: boolean;
  availableCapital: number;
  shortfall: number;
} {
  const currentDate = purchaseDate || new Date();
  
  // فقط شرکایی که در زمان خرید موجود هستند
  const partnersAtPurchaseTime = partners.filter(p => {
    const joinDate = new Date(p.createdAt);
    const deleteDate = p.deletedAt ? new Date(p.deletedAt) : null;
    return joinDate <= currentDate && (!deleteDate || deleteDate > currentDate);
  });
  
  const totalAvailableCapital = partnersAtPurchaseTime.reduce((sum, p) => sum + (p.availableCapital || 0), 0);
  
  return {
    isAvailable: totalAvailableCapital >= purchasePrice,
    availableCapital: totalAvailableCapital,
    shortfall: Math.max(0, purchasePrice - totalAvailableCapital),
  };
}

/**
 * کاهش سرمایه در دسترس شرکا بعد از خرید گوشی
 * فقط شرکایی که در زمان خرید موجود بودند سهم می‌دهند
 */
export async function deductCapitalForPurchase(purchasePrice: number, purchaseDate?: Date): Promise<void> {
  const allPartners = await partnersStore.getAll();
  const currentDate = purchaseDate || new Date();
  
  // فقط شرکایی که در زمان خرید موجود بودند
  const partnersAtPurchaseTime = allPartners.filter(p => new Date(p.createdAt) <= currentDate);
  const totalCapital = partnersAtPurchaseTime.reduce((sum, p) => sum + p.capital, 0);

  if (totalCapital === 0) return;

  // محاسبه دقیق کسر سرمایه بر اساس سهم
  let remainingDeduction = purchasePrice;
  const updates: Array<{id: string, deduction: number}> = [];

  for (let i = 0; i < partnersAtPurchaseTime.length; i++) {
    const partner = partnersAtPurchaseTime[i];
    const share = partner.capital / totalCapital;
    
    let deduction: number;
    if (i === partnersAtPurchaseTime.length - 1) {
      // آخرین شریک: باقی‌مانده رو می‌گیره تا مجموع دقیق بشه
      deduction = remainingDeduction;
    } else {
      deduction = Math.floor(purchasePrice * share * 100) / 100; // دقت دو رقم اعشار
      remainingDeduction -= deduction;
    }
    
    updates.push({id: partner.id, deduction});
  }

  // اعمال تغییرات
  for (const update of updates) {
    const partner = allPartners.find(p => p.id === update.id);
    if (partner) {
      const newAvailableCapital = Math.max(0, partner.availableCapital - update.deduction);
      await partnersStore.update(partner.id, {
        availableCapital: newAvailableCapital,
      });
    }
  }
}

/**
 * افزایش سرمایه در دسترس بعد از دریافت قسط
 * فقط شرکایی که در زمان پرداخت قسط موجود بودند سهم می‌گیرند
 */
export async function addCapitalFromPayment(principalAmount: number, paymentDate?: Date): Promise<void> {
  const allPartners = await partnersStore.getAll();
  const currentDate = paymentDate || new Date();
  
  // فقط شرکایی که در زمان پرداخت قسط موجود بودند
  const partnersAtPaymentTime = allPartners.filter(p => new Date(p.createdAt) <= currentDate);
  const totalCapital = partnersAtPaymentTime.reduce((sum, p) => sum + p.capital, 0);

  if (totalCapital === 0) return;

  // محاسبه دقیق اضافه کردن سرمایه بر اساس سهم
  let remainingAddition = principalAmount;
  const updates: Array<{id: string, addition: number}> = [];

  for (let i = 0; i < partnersAtPaymentTime.length; i++) {
    const partner = partnersAtPaymentTime[i];
    const share = partner.capital / totalCapital;
    
    let addition: number;
    if (i === partnersAtPaymentTime.length - 1) {
      // آخرین شریک: باقی‌مانده رو می‌گیره تا مجموع دقیق بشه
      addition = remainingAddition;
    } else {
      addition = Math.floor(principalAmount * share * 100) / 100; // دقت دو رقم اعشار
      remainingAddition -= addition;
    }
    
    updates.push({id: partner.id, addition});
  }

  // اعمال تغییرات
  for (const update of updates) {
    const partner = allPartners.find(p => p.id === update.id);
    if (partner) {
      await partnersStore.update(partner.id, {
        availableCapital: partner.availableCapital + update.addition,
      });
    }
  }
}

/**
 * افزایش سود اولیه شرکا (تفاوت قیمت)
 * فقط شرکایی که در زمان فروش موجود بودند سهم می‌گیرند
 */
export async function addInitialProfitToPartners(profitAmount: number, saleDate?: Date): Promise<void> {
  const allPartners = await partnersStore.getAll();
  const currentDate = saleDate || new Date();
  
  // فقط شرکایی که در زمان فروش موجود بودند
  const partnersAtSaleTime = allPartners.filter(p => new Date(p.createdAt) <= currentDate);
  const totalCapital = partnersAtSaleTime.reduce((sum, p) => sum + p.capital, 0);

  if (totalCapital === 0) return;

  // محاسبه دقیق توزیع سود بر اساس سهم
  let remainingProfit = profitAmount;
  const updates: Array<{id: string, profitShare: number}> = [];

  for (let i = 0; i < partnersAtSaleTime.length; i++) {
    const partner = partnersAtSaleTime[i];
    const share = partner.capital / totalCapital;
    
    let profitShare: number;
    if (i === partnersAtSaleTime.length - 1) {
      // آخرین شریک: باقی‌مانده رو می‌گیره تا مجموع دقیق بشه
      profitShare = remainingProfit;
    } else {
      profitShare = Math.floor(profitAmount * share * 100) / 100; // دقت دو رقم اعشار
      remainingProfit -= profitShare;
    }
    
    updates.push({id: partner.id, profitShare});
  }

  // اعمال تغییرات
  for (const update of updates) {
    const partner = allPartners.find(p => p.id === update.id);
    if (partner) {
      await partnersStore.update(partner.id, {
        initialProfit: (partner.initialProfit || 0) + update.profitShare,
      });
    }
  }
}

/**
 * افزایش سود ماهانه شرکا (4%)
 * فقط شرکایی که در زمان پرداخت قسط موجود بودند سهم می‌گیرند
 */
export async function addMonthlyProfitToPartners(profitAmount: number, installmentDate?: Date): Promise<void> {
  const allPartners = await partnersStore.getAll();
  const currentDate = installmentDate || new Date();
  
  // فقط شرکایی که در زمان پرداخت قسط موجود بودند
  const partnersAtInstallmentTime = allPartners.filter(p => new Date(p.createdAt) <= currentDate);
  const totalCapital = partnersAtInstallmentTime.reduce((sum, p) => sum + p.capital, 0);

  if (totalCapital === 0) return;

  // محاسبه دقیق توزیع سود بر اساس سهم
  let remainingProfit = profitAmount;
  const updates: Array<{id: string, profitShare: number}> = [];

  for (let i = 0; i < partnersAtInstallmentTime.length; i++) {
    const partner = partnersAtInstallmentTime[i];
    const share = partner.capital / totalCapital;
    
    let profitShare: number;
    if (i === partnersAtInstallmentTime.length - 1) {
      // آخرین شریک: باقی‌مانده رو می‌گیره تا مجموع دقیق بشه
      profitShare = remainingProfit;
    } else {
      profitShare = Math.floor(profitAmount * share * 100) / 100; // دقت دو رقم اعشار
      remainingProfit -= profitShare;
    }
    
    updates.push({id: partner.id, profitShare});
  }

  // اعمال تغییرات
  for (const update of updates) {
    const partner = allPartners.find(p => p.id === update.id);
    if (partner) {
      await partnersStore.update(partner.id, {
        monthlyProfit: (partner.monthlyProfit || 0) + update.profitShare,
      });
    }
  }
}

/**
 * پرداخت سود به سرمایه‌گذاران (درصد مشخص شده از سود خالص)
 * @param netProfit سود خالص (سود کل - هزینه‌ها)
 * @returns مجموع سود پرداختی به سرمایه‌گذاران
 */
export async function payInvestorsProfit(netProfit: number): Promise<number> {
  const { investorsStore, investorTransactionsStore } = await import('./storeProvider');
  
  const investors = await investorsStore.getAll();
  const activeInvestors = investors.filter(i => i.status === 'active');
  
  let totalPaidToInvestors = 0;
  
  for (const investor of activeInvestors) {
    // محاسبه سود سرمایه‌گذار (درصد سود × سود خالص)
    const investorProfit = Math.round((investor.profitRate / 100) * netProfit * 100) / 100;
    
    // ثبت تراکنش (حتی اگر منفی باشه)
    await investorTransactionsStore.add({
      investorId: investor.id,
      type: 'profit_payment',
      amount: investorProfit,
      description: investorProfit >= 0 
        ? `پرداخت ${investor.profitRate}٪ سود از سود خالص ${netProfit.toLocaleString('fa-IR')} تومان`
        : `بدهی ${investor.profitRate}٪ از ضرر خالص ${Math.abs(netProfit).toLocaleString('fa-IR')} تومان`,

    });
    
    // آپدیت کل سود دریافتی (می‌تونه منفی بشه)
    await investorsStore.update(investor.id, {
      totalProfit: investor.totalProfit + investorProfit,
    });
    
    totalPaidToInvestors += investorProfit;
  }
  
  return totalPaidToInvestors;
}

/**
 * بازمحاسبه کل سیستم مالی - برای زمانی که شریک جدید اضافه می‌شه
 * این تابع تمام سهم‌ها و توزیع سودها رو دوباره محاسبه می‌کنه
 * شرکا فقط از زمان ورودشان سهم سود دارند
 */
export async function recalculateFinancialSystem(): Promise<void> {
  // دریافت تمام شرکا (شامل غیرفعال‌ها) برای محاسبات دقیق
  const allPartners = await partnersStore.getAllIncludingInactive();
  const activePartners = allPartners.filter(p => p.status === 'active');
  const sales = await salesStore.getAll();
  const installments = await installmentsStore.getAll();
  
  if (activePartners.length === 0) return;
  
  const paidInstallments = installments.filter(i => i.status === 'paid');
  
  // محاسبه کل سرمایه استفاده شده
  const totalUsedCapital = sales.reduce((sum, sale) => sum + (sale.purchasePrice || 0), 0);
  const totalPaidPrincipal = paidInstallments.reduce((sum, inst) => sum + (inst.principalAmount || 0), 0);
  const currentUsedCapital = totalUsedCapital - totalPaidPrincipal;
  
  // بازسازی تاریخچه شرکا
  const partnerHistory = reconstructPartnerHistory(allPartners, sales, installments);
  
  // بازمحاسبه سهم‌ها و توزیع مجدد برای هر شریک فعال
  for (const partner of activePartners) {
    const partnerJoinDate = new Date(partner.createdAt);
    
    // محاسبه سود اولیه: فقط از فروش‌هایی که بعد از ورود شریک انجام شده
    const salesAfterJoin = sales.filter(sale => new Date(sale.saleDate) >= partnerJoinDate);
    
    // محاسبه سود ماهانه: فقط از اقساطی که بعد از ورود شریک پرداخت شده
    const installmentsAfterJoin = paidInstallments.filter(inst => {
      const relatedSale = sales.find(sale => sale.id === inst.saleId);
      return relatedSale && new Date(inst.dueDate) >= partnerJoinDate;
    });
    
    // محاسبه سهم شریک در زمان هر فروش/قسط با استفاده از تاریخچه
    let newInitialProfit = 0;
    let newMonthlyProfit = 0;
    
    // سود اولیه: محاسبه سهم در هر فروش بر اساس شرکای موجود در آن زمان
    for (const sale of salesAfterJoin) {
      const partnersAtSaleTime = partnerHistory.get(sale.saleDate) || [];
      const totalCapitalAtSaleTime = partnersAtSaleTime.reduce((sum, p) => sum + p.capital, 0);
      
      if (totalCapitalAtSaleTime > 0) {
        const shareAtSaleTime = partner.capital / totalCapitalAtSaleTime;
        newInitialProfit += (sale.initialProfit || 0) * shareAtSaleTime;
      }
    }
    
    // سود ماهانه: محاسبه سهم در هر قسط بر اساس شرکای موجود در آن زمان
    for (const inst of installmentsAfterJoin) {
      const partnersAtInstallmentTime = partnerHistory.get(inst.dueDate) || [];
      const totalCapitalAtInstallmentTime = partnersAtInstallmentTime.reduce((sum, p) => sum + p.capital, 0);
      
      if (totalCapitalAtInstallmentTime > 0) {
        const shareAtInstallmentTime = partner.capital / totalCapitalAtInstallmentTime;
        newMonthlyProfit += (inst.interestAmount || 0) * shareAtInstallmentTime;
      }
    }
    
    // محاسبه سرمایه در دسترس بر اساس زمان استفاده از سرمایه
    let partnerUsedCapital = 0;
    let partnerReturnedCapital = 0;
    
    // محاسبه سرمایه استفاده شده: فقط از فروش‌هایی که بعد از ورود شریک انجام شده
    for (const sale of salesAfterJoin) {
      const partnersAtSaleTime = partnerHistory.get(sale.saleDate) || [];
      const totalCapitalAtSaleTime = partnersAtSaleTime.reduce((sum, p) => sum + p.capital, 0);
      
      if (totalCapitalAtSaleTime > 0) {
        const shareAtSaleTime = partner.capital / totalCapitalAtSaleTime;
        partnerUsedCapital += (sale.purchasePrice || 0) * shareAtSaleTime;
      }
    }
    
    // محاسبه سرمایه برگشتی: فقط از اقساطی که بعد از ورود شریک پرداخت شده
    for (const inst of installmentsAfterJoin) {
      const partnersAtInstallmentTime = partnerHistory.get(inst.dueDate) || [];
      const totalCapitalAtInstallmentTime = partnersAtInstallmentTime.reduce((sum, p) => sum + p.capital, 0);
      
      if (totalCapitalAtInstallmentTime > 0) {
        const shareAtInstallmentTime = partner.capital / totalCapitalAtInstallmentTime;
        partnerReturnedCapital += (inst.principalAmount || 0) * shareAtInstallmentTime;
      }
    }
    
    const newAvailableCapital = Math.max(0, partner.capital - partnerUsedCapital + partnerReturnedCapital);
    
    // آپدیت شریک
    await partnersStore.update(partner.id, {
      initialProfit: Math.round(newInitialProfit * 100) / 100,
      monthlyProfit: Math.round(newMonthlyProfit * 100) / 100,
      availableCapital: newAvailableCapital,
    });
  }
}
