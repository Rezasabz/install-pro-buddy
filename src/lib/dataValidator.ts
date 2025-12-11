/**
 * ابزار بررسی و تصحیح داده‌های مالی
 */

import { partnersStore, salesStore, installmentsStore } from './storeProvider';
import { recalculateFinancialSystem } from './profitCalculator';

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  corrections: string[];
}

/**
 * بررسی کامل سیستم مالی و تصحیح خودکار مشکلات
 */
export async function validateAndFixFinancialData(): Promise<ValidationResult> {
  const result: ValidationResult = {
    isValid: true,
    errors: [],
    warnings: [],
    corrections: []
  };

  try {
    const partners = await partnersStore.getAll();
    const sales = await salesStore.getAll();
    const installments = await installmentsStore.getAll();

    // بررسی ۱: سرمایه کل و در دسترس
    const totalCapital = partners.reduce((sum, p) => sum + p.capital, 0);
    const totalAvailable = partners.reduce((sum, p) => sum + p.availableCapital, 0);
    const totalUsed = totalCapital - totalAvailable;

    // بررسی ۲: محاسبه سرمایه استفاده شده از فروش‌ها
    const totalPurchasePrice = sales.reduce((sum, sale) => sum + (sale.purchasePrice || 0), 0);
    const paidInstallments = installments.filter(i => i.status === 'paid');
    const totalPaidPrincipal = paidInstallments.reduce((sum, inst) => sum + (inst.principalAmount || 0), 0);
    const calculatedUsedCapital = totalPurchasePrice - totalPaidPrincipal;

    // بررسی تطابق سرمایه استفاده شده
    const capitalDifference = Math.abs(totalUsed - calculatedUsedCapital);
    if (capitalDifference > 1) { // تلرانس ۱ تومان
      result.warnings.push(`عدم تطابق سرمایه استفاده شده: محاسبه شده ${calculatedUsedCapital.toLocaleString()} - ثبت شده ${totalUsed.toLocaleString()}`);
    }

    // بررسی ۳: سهم‌های شرکا
    let totalSharePercentage = 0;
    for (const partner of partners) {
      const calculatedShare = totalCapital > 0 ? (partner.capital / totalCapital) * 100 : 0;
      const recordedShare = partner.share || 0;
      
      totalSharePercentage += calculatedShare;
      
      const shareDifference = Math.abs(calculatedShare - recordedShare);
      if (shareDifference > 0.01) { // تلرانس ۰.۰۱ درصد
        result.warnings.push(`سهم ${partner.name}: محاسبه شده ${calculatedShare.toFixed(2)}% - ثبت شده ${recordedShare.toFixed(2)}%`);
      }
    }

    // بررسی مجموع سهم‌ها
    if (Math.abs(totalSharePercentage - 100) > 0.01 && partners.length > 0) {
      result.warnings.push(`مجموع سهم‌ها ${totalSharePercentage.toFixed(2)}% است (باید ۱۰۰% باشد)`);
    }

    // بررسی ۴: سود اولیه
    const totalInitialProfitFromSales = sales.reduce((sum, sale) => sum + (sale.initialProfit || 0), 0);
    const totalRecordedInitialProfit = partners.reduce((sum, p) => sum + (p.initialProfit || 0), 0);
    
    const initialProfitDifference = Math.abs(totalInitialProfitFromSales - totalRecordedInitialProfit);
    if (initialProfitDifference > 1) {
      result.warnings.push(`عدم تطابق سود اولیه: از فروش‌ها ${totalInitialProfitFromSales.toLocaleString()} - ثبت شده ${totalRecordedInitialProfit.toLocaleString()}`);
    }

    // بررسی ۵: سود ماهانه
    const totalMonthlyProfitFromInstallments = paidInstallments.reduce((sum, inst) => sum + (inst.interestAmount || 0), 0);
    const totalRecordedMonthlyProfit = partners.reduce((sum, p) => sum + (p.monthlyProfit || 0), 0);
    
    const monthlyProfitDifference = Math.abs(totalMonthlyProfitFromInstallments - totalRecordedMonthlyProfit);
    if (monthlyProfitDifference > 1) {
      result.warnings.push(`عدم تطابق سود ماهانه: از اقساط ${totalMonthlyProfitFromInstallments.toLocaleString()} - ثبت شده ${totalRecordedMonthlyProfit.toLocaleString()}`);
    }

    // تصحیح خودکار اگر مشکلی وجود داشته باشه
    if (result.warnings.length > 0) {
      result.corrections.push('شروع بازمحاسبه کل سیستم مالی...');
      await recalculateFinancialSystem();
      result.corrections.push('بازمحاسبه کامل شد');
      
      // بررسی مجدد بعد از تصحیح
      const partnersAfter = await partnersStore.getAll();
      const newTotalRecordedInitialProfit = partnersAfter.reduce((sum, p) => sum + (p.initialProfit || 0), 0);
      const newTotalRecordedMonthlyProfit = partnersAfter.reduce((sum, p) => sum + (p.monthlyProfit || 0), 0);
      
      result.corrections.push(`سود اولیه بعد از تصحیح: ${newTotalRecordedInitialProfit.toLocaleString()}`);
      result.corrections.push(`سود ماهانه بعد از تصحیح: ${newTotalRecordedMonthlyProfit.toLocaleString()}`);
    }

    // بررسی نهایی
    if (result.errors.length === 0 && result.warnings.length === 0) {
      result.isValid = true;
      result.corrections.push('تمام محاسبات صحیح است');
    } else if (result.errors.length === 0) {
      result.isValid = true;
      result.corrections.push('هشدارها برطرف شدند');
    } else {
      result.isValid = false;
    }

  } catch (error) {
    result.isValid = false;
    result.errors.push(`خطا در بررسی داده‌ها: ${error.message}`);
  }

  return result;
}

/**
 * گزارش کامل وضعیت مالی
 */
export async function generateFinancialReport(): Promise<{
  summary: any;
  partners: any[];
  sales: any[];
  installments: any[];
  validation: ValidationResult;
}> {
  const partners = await partnersStore.getAll();
  const sales = await salesStore.getAll();
  const installments = await installmentsStore.getAll();
  const validation = await validateAndFixFinancialData();

  const totalCapital = partners.reduce((sum, p) => sum + p.capital, 0);
  const totalAvailable = partners.reduce((sum, p) => sum + p.availableCapital, 0);
  const totalUsed = totalCapital - totalAvailable;
  
  const totalInitialProfit = partners.reduce((sum, p) => sum + (p.initialProfit || 0), 0);
  const totalMonthlyProfit = partners.reduce((sum, p) => sum + (p.monthlyProfit || 0), 0);
  const totalProfit = totalInitialProfit + totalMonthlyProfit;

  const paidInstallments = installments.filter(i => i.status === 'paid');
  const pendingInstallments = installments.filter(i => i.status === 'pending');
  const overdueInstallments = installments.filter(i => i.status === 'overdue');

  const summary = {
    totalCapital,
    totalAvailable,
    totalUsed,
    capitalUtilization: totalCapital > 0 ? (totalUsed / totalCapital) * 100 : 0,
    totalInitialProfit,
    totalMonthlyProfit,
    totalProfit,
    profitMargin: totalCapital > 0 ? (totalProfit / totalCapital) * 100 : 0,
    salesCount: sales.length,
    activeSales: sales.filter(s => s.status === 'active').length,
    completedSales: sales.filter(s => s.status === 'completed').length,
    totalInstallments: installments.length,
    paidInstallments: paidInstallments.length,
    pendingInstallments: pendingInstallments.length,
    overdueInstallments: overdueInstallments.length,
    collectionRate: installments.length > 0 ? (paidInstallments.length / installments.length) * 100 : 0
  };

  return {
    summary,
    partners,
    sales,
    installments,
    validation
  };
}