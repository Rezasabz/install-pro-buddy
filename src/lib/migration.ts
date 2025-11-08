/**
 * تبدیل داده‌های قدیمی به ساختار جدید
 */

import { partnersStore, salesStore, installmentsStore } from "./store";

export function migrateOldData(): boolean {
  try {
    let migrated = false;

    // بررسی و تبدیل شرکا
    const partners = partnersStore.getAll();
    partners.forEach(partner => {
      if (partner.availableCapital === undefined || partner.totalProfit === undefined) {
        partnersStore.update(partner.id, {
          availableCapital: partner.capital || 0,
          totalProfit: 0,
        });
        migrated = true;
      }
    });

    // بررسی و تبدیل فروش‌ها
    const sales = salesStore.getAll();
    sales.forEach(sale => {
      // اگر ساختار قدیمی است
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if ((sale as any).totalPrice !== undefined && sale.announcedPrice === undefined) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const oldSale = sale as any;
        salesStore.update(sale.id, {
          announcedPrice: oldSale.totalPrice || 0,
          purchasePrice: oldSale.totalPrice ? oldSale.totalPrice * 0.9 : 0,
          monthlyInterestRate: 0.04,
          initialProfit: oldSale.totalPrice ? oldSale.totalPrice * 0.1 : 0,
        });
        migrated = true;
      }
    });

    // بررسی و تبدیل اقساط
    const installments = installmentsStore.getAll();
    installments.forEach(inst => {
      // اگر ساختار قدیمی است
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if ((inst as any).amount !== undefined && inst.totalAmount === undefined) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const oldInst = inst as any;
        const amount = oldInst.amount || 0;
        const principal = Math.round(amount * 0.96); // تقریباً
        const interest = Math.round(amount * 0.04);
        
        installmentsStore.update(inst.id, {
          installmentNumber: inst.installmentNumber || 1,
          principalAmount: principal,
          interestAmount: interest,
          totalAmount: amount,
          remainingDebt: 0,
        });
        migrated = true;
      }
    });

    return migrated;
  } catch (error) {
    console.error('Migration error:', error);
    return false;
  }
}

/**
 * بررسی اینکه آیا نیاز به migration است
 */
export function needsMigration(): boolean {
  try {
    const partners = partnersStore.getAll();
    if (partners.length > 0) {
      const firstPartner = partners[0];
      if (firstPartner.availableCapital === undefined) {
        return true;
      }
    }

    const sales = salesStore.getAll();
    if (sales.length > 0) {
      const firstSale = sales[0];
      if (firstSale.announcedPrice === undefined) {
        return true;
      }
    }

    const installments = installmentsStore.getAll();
    if (installments.length > 0) {
      const firstInst = installments[0];
      if (firstInst.totalAmount === undefined) {
        return true;
      }
    }

    return false;
  } catch (error) {
    return false;
  }
}
