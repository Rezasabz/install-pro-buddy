import { ProfitCalculationType } from './store';

export interface ProfitCalculationResult {
  totalProfit: number;
  totalPayable: number;
  monthlyPayment: number;
  installments: {
    installmentNumber: number;
    principalAmount: number;
    interestAmount: number;
    totalAmount: number;
    remainingDebt: number;
  }[];
}

/**
 * محاسبه سود و اقساط بر اساس نوع محاسبه
 */
export function calculateProfit(
  remainingAmount: number, // مبلغ باقیمانده (قیمت فروش - پیش‌پرداخت)
  installmentMonths: number,
  calculationType: ProfitCalculationType,
  customRate?: number
): ProfitCalculationResult {
  let totalProfit = 0;
  let totalPayable = 0;
  let monthlyPayment = 0;
  const installments: ProfitCalculationResult['installments'] = [];

  switch (calculationType) {
    case 'fixed_4_percent': {
      // گزینه ۱: سود مانده هر ماه (درصد روی مانده بدهی هر ماه)
      const rate = (customRate || 4) / 100; // درصد قابل تنظیم
      const principalPerMonth = remainingAmount / installmentMonths;
      
      let currentDebt = remainingAmount;
      totalProfit = 0;

      // محاسبه اقساط
      for (let i = 1; i <= installmentMonths; i++) {
        const interestAmount = Math.round(currentDebt * rate);
        const principalAmount = Math.round(principalPerMonth);
        const totalAmount = principalAmount + interestAmount;
        
        totalProfit += interestAmount;
        currentDebt -= principalAmount;
        
        installments.push({
          installmentNumber: i,
          principalAmount,
          interestAmount,
          totalAmount,
          remainingDebt: Math.max(0, Math.round(currentDebt)),
        });
      }
      
      totalPayable = remainingAmount + totalProfit;
      monthlyPayment = installments.length > 0 ? installments[0].totalAmount : 0;
      break;
    }

    case 'monthly_4_percent_lda': {
      // گزینه ۲: سود ماهیانه ۴٪ روی باقیمانده (LDA)
      const monthlyProfit = remainingAmount * 0.04;
      totalProfit = monthlyProfit * installmentMonths;
      totalPayable = remainingAmount + totalProfit;
      monthlyPayment = Math.ceil(totalPayable / installmentMonths / 1000) * 1000;

      // محاسبه اقساط
      let remaining = totalPayable;
      const principalPerMonth = remainingAmount / installmentMonths;
      const interestPerMonth = monthlyProfit;

      for (let i = 1; i <= installmentMonths; i++) {
        const isLast = i === installmentMonths;
        const installmentAmount = isLast ? remaining : monthlyPayment;
        
        installments.push({
          installmentNumber: i,
          principalAmount: Math.round(principalPerMonth),
          interestAmount: Math.round(interestPerMonth),
          totalAmount: installmentAmount,
          remainingDebt: Math.max(0, remaining - installmentAmount),
        });
        
        remaining -= installmentAmount;
      }
      break;
    }

    case 'custom_annual': {
      // گزینه ۳: سود دلخواه (حداقل ۸٪)
      const rate = (customRate || 8) / 100;
      totalProfit = remainingAmount * rate;
      totalPayable = remainingAmount + totalProfit;
      monthlyPayment = Math.ceil(totalPayable / installmentMonths / 1000) * 1000;

      // محاسبه اقساط
      let remaining = totalPayable;
      const principalPerMonth = remainingAmount / installmentMonths;
      const interestPerMonth = totalProfit / installmentMonths;

      for (let i = 1; i <= installmentMonths; i++) {
        const isLast = i === installmentMonths;
        const installmentAmount = isLast ? remaining : monthlyPayment;
        
        installments.push({
          installmentNumber: i,
          principalAmount: Math.round(principalPerMonth),
          interestAmount: Math.round(interestPerMonth),
          totalAmount: installmentAmount,
          remainingDebt: Math.max(0, remaining - installmentAmount),
        });
        
        remaining -= installmentAmount;
      }
      break;
    }
  }

  return {
    totalProfit: Math.round(totalProfit),
    totalPayable: Math.round(totalPayable),
    monthlyPayment,
    installments,
  };
}

/**
 * دریافت نام فارسی نوع محاسبه سود
 */
export function getProfitCalculationLabel(type: ProfitCalculationType): string {
  switch (type) {
    case 'fixed_4_percent':
      return 'سود مانده هر ماه';
    case 'monthly_4_percent_lda':
      return 'سود ماهیانه ۴٪';
    case 'custom_annual':
      return 'سود دلخواه';
    default:
      return 'نامشخص';
  }
}
