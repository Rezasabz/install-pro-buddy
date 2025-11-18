/**
 * Migration برای فروش‌های قدیمی
 * فروش‌هایی که profitCalculationType ندارند، به fixed_4_percent تبدیل می‌شوند
 */

import { salesStore } from './storeProvider';

export async function migrateSalesToNewProfitSystem() {
  try {
    const sales = await salesStore.getAll();
    let migratedCount = 0;

    for (const sale of sales) {
      // @ts-ignore - برای سازگاری با داده‌های قدیمی
      if (!sale.profitCalculationType) {
        await salesStore.update(sale.id, {
          profitCalculationType: 'fixed_4_percent',
          totalProfit: sale.announcedPrice - sale.purchasePrice - sale.initialProfit,
        });
        migratedCount++;
      }
    }

    if (migratedCount > 0) {
      console.log(`✅ ${migratedCount} فروش به سیستم جدید محاسبه سود منتقل شد`);
    }

    return migratedCount;
  } catch (error) {
    console.error('خطا در migration فروش‌ها:', error);
    return 0;
  }
}
