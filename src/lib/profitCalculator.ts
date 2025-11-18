import { partnersStore, salesStore, installmentsStore } from "./storeProvider";

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
  const principalPerMonth = remainingDebt / installmentMonths;

  for (let i = 1; i <= installmentMonths; i++) {
    const interestAmount = Math.round(currentDebt * monthlyInterestRate);
    const principalAmount = Math.round(principalPerMonth);
    const totalAmount = principalAmount + interestAmount;
    
    currentDebt -= principalAmount;
    
    installments.push({
      installmentNumber: i,
      principalAmount,
      interestAmount,
      totalAmount,
      remainingDebt: Math.max(0, Math.round(currentDebt)),
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
 * محاسبه وضعیت مالی با داده‌های ورودی (برای استفاده با API)
 */
export function calculateFinancialsFromData(
  partners: any[],
  sales: any[],
  allInstallments: any[]
): FinancialSummary {
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
 * بررسی اینکه آیا سرمایه کافی برای خرید گوشی وجود دارد
 */
export function checkCapitalAvailability(purchasePrice: number, partners: unknown[]): {
  isAvailable: boolean;
  availableCapital: number;
  shortfall: number;
} {
  const totalAvailableCapital = partners.reduce((sum, p) => sum + p.availableCapital, 0);
  
  return {
    isAvailable: totalAvailableCapital >= purchasePrice,
    availableCapital: totalAvailableCapital,
    shortfall: Math.max(0, purchasePrice - totalAvailableCapital),
  };
}

/**
 * کاهش سرمایه در دسترس شرکا بعد از خرید گوشی
 */
export async function deductCapitalForPurchase(purchasePrice: number): Promise<void> {
  const partners = await partnersStore.getAll();
  const totalCapital = partners.reduce((sum, p) => sum + p.capital, 0);

  for (const partner of partners) {
    const share = totalCapital > 0 ? partner.capital / totalCapital : 0;
    const deduction = Math.round(purchasePrice * share);
    const newAvailableCapital = Math.max(0, partner.availableCapital - deduction);
    
    await partnersStore.update(partner.id, {
      availableCapital: newAvailableCapital,
    });
  }
}

/**
 * افزایش سرمایه در دسترس بعد از دریافت قسط
 */
export async function addCapitalFromPayment(principalAmount: number): Promise<void> {
  const partners = await partnersStore.getAll();
  const totalCapital = partners.reduce((sum, p) => sum + p.capital, 0);

  for (const partner of partners) {
    const share = totalCapital > 0 ? partner.capital / totalCapital : 0;
    const addition = Math.round(principalAmount * share);
    
    await partnersStore.update(partner.id, {
      availableCapital: partner.availableCapital + addition,
    });
  }
}

/**
 * افزایش سود اولیه شرکا (تفاوت قیمت)
 */
export async function addInitialProfitToPartners(profitAmount: number): Promise<void> {
  const partners = await partnersStore.getAll();
  const totalCapital = partners.reduce((sum, p) => sum + p.capital, 0);

  for (const partner of partners) {
    const share = totalCapital > 0 ? partner.capital / totalCapital : 0;
    const profitShare = Math.round(profitAmount * share);
    
    await partnersStore.update(partner.id, {
      initialProfit: partner.initialProfit + profitShare,
    });
  }
}

/**
 * افزایش سود ماهانه شرکا (4%)
 */
export async function addMonthlyProfitToPartners(profitAmount: number): Promise<void> {
  const partners = await partnersStore.getAll();
  const totalCapital = partners.reduce((sum, p) => sum + p.capital, 0);

  for (const partner of partners) {
    const share = totalCapital > 0 ? partner.capital / totalCapital : 0;
    const profitShare = Math.round(profitAmount * share);
    
    await partnersStore.update(partner.id, {
      monthlyProfit: partner.monthlyProfit + profitShare,
    });
  }
}
