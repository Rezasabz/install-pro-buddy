import { partnersStore, salesStore, installmentsStore } from "./store";

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
 */
export function calculateFinancials(): FinancialSummary {
  const partners = partnersStore.getAll();
  const sales = salesStore.getAll();
  const allInstallments = installmentsStore.getAll();

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
export function checkCapitalAvailability(purchasePrice: number): {
  isAvailable: boolean;
  availableCapital: number;
  shortfall: number;
} {
  const partners = partnersStore.getAll();
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
export function deductCapitalForPurchase(purchasePrice: number): void {
  const partners = partnersStore.getAll();
  const totalCapital = partners.reduce((sum, p) => sum + p.capital, 0);

  partners.forEach(partner => {
    const share = totalCapital > 0 ? partner.capital / totalCapital : 0;
    const deduction = Math.round(purchasePrice * share);
    const newAvailableCapital = Math.max(0, partner.availableCapital - deduction);
    
    partnersStore.update(partner.id, {
      availableCapital: newAvailableCapital,
    });
  });
}

/**
 * افزایش سرمایه در دسترس بعد از دریافت قسط
 */
export function addCapitalFromPayment(principalAmount: number): void {
  const partners = partnersStore.getAll();
  const totalCapital = partners.reduce((sum, p) => sum + p.capital, 0);

  partners.forEach(partner => {
    const share = totalCapital > 0 ? partner.capital / totalCapital : 0;
    const addition = Math.round(principalAmount * share);
    
    partnersStore.update(partner.id, {
      availableCapital: partner.availableCapital + addition,
    });
  });
}

/**
 * افزایش سود اولیه شرکا (تفاوت قیمت)
 */
export function addInitialProfitToPartners(profitAmount: number): void {
  const partners = partnersStore.getAll();
  const totalCapital = partners.reduce((sum, p) => sum + p.capital, 0);

  partners.forEach(partner => {
    const share = totalCapital > 0 ? partner.capital / totalCapital : 0;
    const profitShare = Math.round(profitAmount * share);
    
    partnersStore.update(partner.id, {
      initialProfit: partner.initialProfit + profitShare,
    });
  });
}

/**
 * افزایش سود ماهانه شرکا (4%)
 */
export function addMonthlyProfitToPartners(profitAmount: number): void {
  const partners = partnersStore.getAll();
  const totalCapital = partners.reduce((sum, p) => sum + p.capital, 0);

  partners.forEach(partner => {
    const share = totalCapital > 0 ? partner.capital / totalCapital : 0;
    const profitShare = Math.round(profitAmount * share);
    
    partnersStore.update(partner.id, {
      monthlyProfit: partner.monthlyProfit + profitShare,
    });
  });
}
