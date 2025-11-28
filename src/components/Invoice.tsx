import { forwardRef } from "react";
import { Sale, Customer, Phone } from "@/lib/storeProvider";
import { formatCurrency, toPersianDigits, toJalaliDate } from "@/lib/persian";

interface InvoiceProps {
  sale: Sale;
  customer: Customer;
  phone: Phone;
  installments: Array<{
    installmentNumber: number;
    totalAmount: number;
    dueDate: string;
    status: string;
  }>;
}

export const Invoice = forwardRef<HTMLDivElement, InvoiceProps>(
  ({ sale, customer, phone, installments }, ref) => {
    const generateInvoiceNumber = () => {
      const date = new Date(sale.saleDate);
      const year = date.getFullYear().toString().slice(-2);
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const random = Math.random().toString(36).substring(2, 6).toUpperCase();
      return `GXSJ-${year}${month}-${random}`;
    };

    const invoiceNumber = generateInvoiceNumber();

    return (
      <div ref={ref} className="invoice-container bg-white p-8 max-w-4xl mx-auto" dir="rtl">
        <style>{`
          @media print {
            body * {
              visibility: hidden;
            }
            .invoice-container, .invoice-container * {
              visibility: visible;
            }
            .invoice-container {
              position: absolute;
              left: 0;
              top: 0;
              width: 100%;
              padding: 20mm;
            }
            @page {
              size: A4;
              margin: 0;
            }
          }
        `}</style>

        {/* Header با نوار سبز */}
        <div className="border-4 border-green-700 rounded-lg overflow-hidden">
          <div className="bg-green-700 h-6"></div>
          
          <div className="bg-gray-100 p-6">
            {/* عنوان */}
            <h1 className="text-3xl font-bold text-center mb-6">فاکتور فروش</h1>

            {/* اطلاعات فروشگاه و مشتری */}
            <div className="grid grid-cols-2 gap-8 mb-6">
              {/* سمت راست - اطلاعات فروشگاه */}
              <div className="space-y-2">
                <div className="flex items-center gap-3 mb-4">
                  <img 
                    src="/logo.png" 
                    alt="Logo" 
                    className="h-16 w-16 object-contain rounded-lg border-2 border-gray-300"
                  />
                  <div>
                    <h2 className="text-xl font-bold">موبایل مجید</h2>
                    <p className="text-sm text-gray-600">فروشگاه تخصصی موبایل</p>
                  </div>
                </div>
                <p className="text-sm">
                  <span className="font-semibold">آدرس:</span> خیابان رسالت نرسیده به بنی هاشم، خیابان احمدی کوچه
                </p>
                <p className="text-sm">
                  <span className="font-semibold">زنجانی پلاک ۶</span>
                </p>
                <p className="text-sm">
                  <span className="font-semibold">تلفن:</span> {toPersianDigits('09374600370')}
                </p>
              </div>

              {/* سمت چپ - اطلاعات فاکتور */}
              <div className="space-y-2 text-left">
                <p className="text-sm">
                  <span className="font-semibold">تاریخ:</span> {toJalaliDate(sale.saleDate)}
                </p>
                <p className="text-sm">
                  <span className="font-semibold">شماره فاکتور:</span> {toPersianDigits(invoiceNumber)}
                </p>
              </div>
            </div>

            {/* اطلاعات مشتری */}
            <div className="bg-white rounded-lg p-4 mb-6 border border-gray-300">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                  <span className="text-xl">👤</span>
                </div>
                <h3 className="text-lg font-bold">مشتری</h3>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm">
                    <span className="font-semibold">نام:</span> {customer.name}
                  </p>
                  <p className="text-sm">
                    <span className="font-semibold">کد ملی:</span> {toPersianDigits(customer.nationalId)}
                  </p>
                </div>
                <div>
                  <p className="text-sm">
                    <span className="font-semibold">آدرس:</span> {customer.address}
                  </p>
                  <p className="text-sm">
                    <span className="font-semibold">تلفن:</span> {toPersianDigits(customer.phone)}
                  </p>
                </div>
              </div>
            </div>

            {/* جدول اقلام */}
            <div className="mb-6">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-200">
                    <th className="border border-gray-400 p-3 text-right">اقلام</th>
                    <th className="border border-gray-400 p-3 text-center w-24">فی (ریال)</th>
                    <th className="border border-gray-400 p-3 text-center w-24">مقدار</th>
                    <th className="border border-gray-400 p-3 text-center w-32">تخفیف (ریال)</th>
                    <th className="border border-gray-400 p-3 text-center w-32">قیمت کل (ریال)</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border border-gray-400 p-3">
                      <div>
                        <p className="font-semibold">{phone.brand} {phone.model}</p>
                        {phone.color && <p className="text-sm text-gray-600">رنگ: {phone.color}</p>}
                        {phone.storage && <p className="text-sm text-gray-600">حافظه: {phone.storage} GB</p>}
                        <p className="text-xs text-gray-500">IMEI: {toPersianDigits(phone.imei)}</p>
                      </div>
                    </td>
                    <td className="border border-gray-400 p-3 text-center">
                      {formatCurrency(sale.announcedPrice)}
                    </td>
                    <td className="border border-gray-400 p-3 text-center">
                      {toPersianDigits('1')} عدد
                    </td>
                    <td className="border border-gray-400 p-3 text-center">-</td>
                    <td className="border border-gray-400 p-3 text-center font-bold">
                      {formatCurrency(sale.announcedPrice)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* توضیحات و جمع */}
            <div className="bg-white rounded-lg border-2 border-gray-300 overflow-hidden mb-6">
              <div className="grid grid-cols-2">
                <div className="p-4 border-l border-gray-300">
                  <h4 className="font-bold mb-2">توضیحات</h4>
                  <p className="text-sm text-gray-600">
                    پیش‌پرداخت: {formatCurrency(sale.downPayment)}
                  </p>
                  <p className="text-sm text-gray-600">
                    تعداد اقساط: {toPersianDigits(sale.installmentMonths.toString())} ماه
                  </p>
                  <p className="text-sm text-gray-600">
                    مبلغ هر قسط: {formatCurrency(installments[0]?.totalAmount || 0)}
                  </p>
                  <p className="text-sm text-gray-600">
                    باقیمانده بدهی: {formatCurrency(sale.announcedPrice - sale.downPayment)}
                  </p>
                </div>
                <div className="p-4 space-y-2">
                  <div className="flex justify-between items-center p-2 bg-gray-100 rounded">
                    <span className="font-bold">جمع اقلام</span>
                    <span className="font-bold">{formatCurrency(sale.announcedPrice)} ریال</span>
                  </div>
                  <div className="flex justify-between items-center p-2 bg-blue-100 rounded border border-blue-400">
                    <span className="font-semibold text-blue-800">پیش‌پرداخت</span>
                    <span className="font-bold text-blue-800">
                      {formatCurrency(sale.downPayment)} ریال
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-2 bg-green-100 rounded border-2 border-green-600">
                    <span className="font-bold text-green-800">قابل پرداخت</span>
                    <span className="font-bold text-green-800 text-lg">
                      {formatCurrency(sale.announcedPrice)} ریال
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* جدول اقساط */}
            {installments.length > 0 && (
              <div className="mb-6">
                <h4 className="font-bold mb-3 text-lg">برنامه پرداخت اقساط</h4>
                <table className="w-full border-collapse text-sm">
                  <thead>
                    <tr className="bg-gray-200">
                      <th className="border border-gray-400 p-2 text-center w-16">قسط</th>
                      <th className="border border-gray-400 p-2 text-center">تاریخ سررسید</th>
                      <th className="border border-gray-400 p-2 text-center">مبلغ قسط</th>
                      <th className="border border-gray-400 p-2 text-center">وضعیت</th>
                    </tr>
                  </thead>
                  <tbody>
                    {installments.map((inst) => (
                      <tr key={inst.installmentNumber} className="hover:bg-gray-50">
                        <td className="border border-gray-400 p-2 text-center font-semibold">
                          {toPersianDigits(inst.installmentNumber.toString())}
                        </td>
                        <td className="border border-gray-400 p-2 text-center">
                          {toJalaliDate(inst.dueDate)}
                        </td>
                        <td className="border border-gray-400 p-2 text-center font-bold">
                          {formatCurrency(inst.totalAmount)}
                        </td>
                        <td className="border border-gray-400 p-2 text-center">
                          <span className={`inline-block px-2 py-1 rounded text-xs font-semibold ${
                            inst.status === 'paid' 
                              ? 'bg-green-100 text-green-800' 
                              : inst.status === 'overdue'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {inst.status === 'paid' ? 'پرداخت شده' : inst.status === 'overdue' ? 'معوق' : 'در انتظار'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-gray-100 font-bold">
                      <td colSpan={2} className="border border-gray-400 p-2 text-left">
                        جمع کل:
                      </td>
                      <td className="border border-gray-400 p-2 text-center text-lg">
                        {formatCurrency(installments.reduce((sum, inst) => sum + inst.totalAmount, 0))}
                      </td>
                      <td className="border border-gray-400 p-2"></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}

            {/* وضعیت پرداخت و ارسال */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="flex items-center gap-3 p-3 bg-white rounded-lg border border-gray-300">
                <span className="text-2xl">💰</span>
                <div>
                  <p className="text-sm font-semibold">وضعیت پرداخت:</p>
                  <p className="text-red-600 font-bold">پرداخت نشده</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-white rounded-lg border border-gray-300">
                <span className="text-2xl">🚚</span>
                <div>
                  <p className="text-sm font-semibold">وضعیت ارسال:</p>
                  <p className="text-red-600 font-bold">ارسال نشده</p>
                </div>
              </div>
            </div>

            {/* QR Code و پیام */}
            <div className="bg-white rounded-lg border border-gray-300 p-4">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm text-gray-600 text-center">
                    برای مشاهده فاکتور و تغییرات آن، بارکد را اسکن کنید.
                  </p>
                </div>
                <div className="w-24 h-24 bg-gray-200 rounded flex items-center justify-center">
                  <span className="text-xs text-gray-500">QR Code</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-6 text-sm text-gray-600">
          <p>با تشکر از خرید شما - موبایل مجید</p>
          <p className="text-xs mt-1">این فاکتور به صورت الکترونیکی صادر شده است</p>
        </div>
      </div>
    );
  }
);

Invoice.displayName = "Invoice";
