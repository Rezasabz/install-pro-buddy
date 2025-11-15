import { partnersStore } from './store';

/**
 * رفع مشکلات داده‌های قدیمی
 */
export function fixPartnerData() {
  const partners = partnersStore.getAll();
  let fixed = false;

  partners.forEach(partner => {
    // اگر availableCapital بیشتر از capital باشه، اصلاحش کن
    if (partner.availableCapital > partner.capital) {
      partnersStore.update(partner.id, {
        availableCapital: partner.capital
      });
      fixed = true;
      console.log(`Fixed partner ${partner.name}: availableCapital was ${partner.availableCapital}, set to ${partner.capital}`);
    }

    // اگر availableCapital منفی باشه، صفر کن
    if (partner.availableCapital < 0) {
      partnersStore.update(partner.id, {
        availableCapital: 0
      });
      fixed = true;
      console.log(`Fixed partner ${partner.name}: availableCapital was negative, set to 0`);
    }

    // اگر initialProfit یا monthlyProfit undefined باشن، صفر کن
    if (partner.initialProfit === undefined || partner.initialProfit === null) {
      partnersStore.update(partner.id, {
        initialProfit: 0
      });
      fixed = true;
    }

    if (partner.monthlyProfit === undefined || partner.monthlyProfit === null) {
      partnersStore.update(partner.id, {
        monthlyProfit: 0
      });
      fixed = true;
    }
  });

  if (fixed) {
    console.log('✅ Partner data fixed!');
  }

  return fixed;
}

/**
 * پاک کردن کامل داده‌ها (برای تست)
 */
export function clearAllData() {
  if (confirm('⚠️ آیا مطمئن هستید که می‌خواهید تمام داده‌ها را پاک کنید؟\n\nاین عمل قابل بازگشت نیست!')) {
    localStorage.clear();
    window.location.reload();
  }
}

/**
 * Export داده‌ها به JSON
 */
export function exportData() {
  const data = {
    partners: localStorage.getItem('partners'),
    phones: localStorage.getItem('phones'),
    customers: localStorage.getItem('customers'),
    sales: localStorage.getItem('sales'),
    installments: localStorage.getItem('installments'),
    transactions: localStorage.getItem('transactions'),
    exportDate: new Date().toISOString()
  };

  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `backup-${new Date().toISOString().split('T')[0]}.json`;
  a.click();
  URL.revokeObjectURL(url);

  console.log('✅ Data exported!');
}

/**
 * Import داده‌ها از JSON
 */
export function importData(file: File) {
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const data = JSON.parse(e.target?.result as string);
      
      if (confirm('⚠️ آیا مطمئن هستید؟\n\nداده‌های فعلی جایگزین می‌شوند!')) {
        if (data.partners) localStorage.setItem('partners', data.partners);
        if (data.phones) localStorage.setItem('phones', data.phones);
        if (data.customers) localStorage.setItem('customers', data.customers);
        if (data.sales) localStorage.setItem('sales', data.sales);
        if (data.installments) localStorage.setItem('installments', data.installments);
        if (data.transactions) localStorage.setItem('transactions', data.transactions);
        
        console.log('✅ Data imported!');
        window.location.reload();
      }
    } catch (error) {
      alert('خطا در خواندن فایل!');
      console.error(error);
    }
  };
  reader.readAsText(file);
}
