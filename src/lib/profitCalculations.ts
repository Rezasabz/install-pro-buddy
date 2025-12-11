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
      
      let currentDebt = remainingAmount;
      totalProfit = 0;

      // محاسبه دقیق اصل قسط برای هر ماه
      const basePrincipal = Math.floor(remainingAmount / installmentMonths);
      const remainder = remainingAmount - (basePrincipal * installmentMonths);

      // محاسبه اقساط
      for (let i = 1; i <= installmentMonths; i++) {
        // محاسبه سود بر اساس مانده فعلی (با دقت دو رقم اعشار)
        const interestAmount = Math.round(currentDebt * rate * 100) / 100;
        
        // توزیع باقی‌مانده در اقساط اول
        const principalAmount = basePrincipal + (i <= remainder ? 1 : 0);
        
        const totalAmount = principalAmount + interestAmount;
        
        totalProfit += interestAmount;
        currentDebt -= principalAmount;
        
        installments.push({
          installmentNumber: i,
          principalAmount,
          interestAmount,
          totalAmount,
          remainingDebt: Math.max(0, currentDebt),
        });
      }
      
      totalPayable = remainingAmount + totalProfit;
      monthlyPayment = installments.length > 0 ? installments[0].totalAmount : 0;
      break;
    }

    case 'monthly_4_percent_lda': {
      // گزینه ۲: سود ماهیانه ۴٪ روی باقیمانده (LDA)
      const monthlyProfit = Math.round(remainingAmount * 0.04 * 100) / 100;
      totalProfit = monthlyProfit * installmentMonths;
      totalPayable = remainingAmount + totalProfit;
      
      // محاسبه قسط ماهانه دقیق
      const exactMonthlyPayment = totalPayable / installmentMonths;
      monthlyPayment = Math.ceil(exactMonthlyPayment / 1000) * 1000;

      // محاسبه اقساط با توزیع دقیق
      let remainingPayable = totalPayable;
      const basePrincipal = Math.floor(remainingAmount / installmentMonths);
      const principalRemainder = remainingAmount - (basePrincipal * installmentMonths);

      for (let i = 1; i <= installmentMonths; i++) {
        const isLast = i === installmentMonths;
        
        // توزیع دقیق اصل قسط
        const principalAmount = basePrincipal + (i <= principalRemainder ? 1 : 0);
        const interestAmount = Math.round(monthlyProfit * 100) / 100;
        
        const installmentAmount = isLast ? remainingPayable : monthlyPayment;
        
        installments.push({
          installmentNumber: i,
          principalAmount,
          interestAmount,
          totalAmount: installmentAmount,
          remainingDebt: Math.max(0, remainingPayable - installmentAmount),
        });
        
        remainingPayable -= installmentAmount;
      }
      break;
    }

    case 'custom_annual': {
      // گزینه ۳: سود دلخواه (حداقل ۸٪)
      const rate = (customRate || 8) / 100;
      totalProfit = Math.round(remainingAmount * rate * 100) / 100;
      totalPayable = remainingAmount + totalProfit;
      
      // محاسبه قسط ماهانه دقیق
      const exactMonthlyPayment = totalPayable / installmentMonths;
      monthlyPayment = Math.ceil(exactMonthlyPayment / 1000) * 1000;

      // محاسبه اقساط با توزیع دقیق
      let remainingPayable = totalPayable;
      const basePrincipal = Math.floor(remainingAmount / installmentMonths);
      const principalRemainder = remainingAmount - (basePrincipal * installmentMonths);
      const baseInterest = Math.floor((totalProfit / installmentMonths) * 100) / 100;
      const interestRemainder = totalProfit - (baseInterest * installmentMonths);

      for (let i = 1; i <= installmentMonths; i++) {
        const isLast = i === installmentMonths;
        
        // توزیع دقیق اصل قسط و سود
        const principalAmount = basePrincipal + (i <= principalRemainder ? 1 : 0);
        const interestAmount = baseInterest + (i <= Math.round(interestRemainder * 100) ? 0.01 : 0);
        
        const installmentAmount = isLast ? remainingPayable : monthlyPayment;
        
        installments.push({
          installmentNumber: i,
          principalAmount,
          interestAmount,
          totalAmount: installmentAmount,
          remainingDebt: Math.max(0, remainingPayable - installmentAmount),
        });
        
        remainingPayable -= installmentAmount;
      }
      break;
    }
  }

  return {
    totalProfit: Math.round(totalProfit * 100) / 100,
    totalPayable: Math.round(totalPayable * 100) / 100,
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
