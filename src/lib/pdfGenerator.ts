import html2pdf from 'html2pdf.js';
import { Sale, Customer, Phone, Installment } from './storeProvider';
import { formatCurrency, toJalaliDate, toPersianDigits } from './persian';
import { getProfitCalculationLabel } from './profitCalculations';

interface PDFData {
  sale: Sale;
  customer: Customer;
  phone: Phone;
  installments: Installment[];
}

/**
 * تولید HTML برای فاکتور فروش
 */
function generateInvoiceHTML(data: PDFData): string {
  const { sale, customer, phone, installments } = data;
  
  const paidInstallments = installments.filter(i => i.status === 'paid');
  const paidAmount = sale.downPayment + paidInstallments.reduce((sum, i) => sum + i.totalAmount, 0);
  const remainingDebt = sale.announcedPrice - sale.downPayment - paidInstallments.reduce((sum, i) => sum + i.principalAmount, 0);

  return `
    <!DOCTYPE html>
    <html dir="rtl" lang="fa">
    <head>
      <meta charset="UTF-8">
      <style>
        @import url('https://cdn.jsdelivr.net/gh/rastikerdar/vazirmatn@v33.003/Vazirmatn-font-face.css');
        
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        body {
          font-family: 'Vazirmatn', Arial, sans-serif;
          direction: rtl;
          padding: 20px;
          background: white;
          color: #333;
          font-size: 14px;
          line-height: 1.6;
        }
        
        .container {
          max-width: 800px;
          margin: 0 auto;
        }
        
        .header {
          text-align: center;
          margin-bottom: 30px;
          padding-bottom: 20px;
          border-bottom: 3px solid #4a5568;
        }
        
        .logo-box {
          width: 150px;
          height: 80px;
          margin: 0 auto 15px;
          border: 2px solid #cbd5e0;
          background: #f7fafc;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #718096;
          font-size: 12px;
        }
        
        .title {
          font-size: 28px;
          font-weight: bold;
          color: #2d3748;
          margin-bottom: 5px;
        }
        
        .subtitle {
          font-size: 18px;
          color: #718096;
        }
        
        .info-section {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
          margin-bottom: 25px;
        }
        
        .info-box {
          background: #f7fafc;
          padding: 15px;
          border-radius: 8px;
          border: 1px solid #e2e8f0;
        }
        
        .info-box h3 {
          font-size: 16px;
          font-weight: bold;
          color: #2d3748;
          margin-bottom: 10px;
          padding-bottom: 8px;
          border-bottom: 2px solid #cbd5e0;
        }
        
        .info-row {
          display: flex;
          justify-content: space-between;
          padding: 5px 0;
          font-size: 13px;
        }
        
        .info-label {
          color: #718096;
          font-weight: 500;
        }
        
        .info-value {
          color: #2d3748;
          font-weight: 600;
        }
        
        .section-title {
          font-size: 18px;
          font-weight: bold;
          color: #2d3748;
          margin: 25px 0 15px;
          padding-bottom: 8px;
          border-bottom: 2px solid #4a5568;
        }
        
        table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 25px;
          background: white;
        }
        
        table thead {
          background: #4a5568;
          color: white;
        }
        
        table th {
          padding: 12px 10px;
          text-align: center;
          font-weight: bold;
          font-size: 13px;
        }
        
        table td {
          padding: 10px;
          text-align: center;
          border-bottom: 1px solid #e2e8f0;
          font-size: 13px;
        }
        
        table tbody tr:nth-child(even) {
          background: #f7fafc;
        }
        
        table tbody tr:hover {
          background: #edf2f7;
        }
        
        .amount {
          color: #38a169;
          font-weight: bold;
        }
        
        .profit {
          color: #3182ce;
          font-weight: bold;
        }
        
        .status-paid {
          background: #c6f6d5;
          color: #22543d;
          padding: 4px 12px;
          border-radius: 12px;
          font-size: 11px;
          font-weight: bold;
        }
        
        .status-pending {
          background: #fed7d7;
          color: #742a2a;
          padding: 4px 12px;
          border-radius: 12px;
          font-size: 11px;
          font-weight: bold;
        }
        
        .status-overdue {
          background: #feebc8;
          color: #7c2d12;
          padding: 4px 12px;
          border-radius: 12px;
          font-size: 11px;
          font-weight: bold;
        }
        
        .signatures {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 40px;
          margin-top: 50px;
          margin-bottom: 30px;
        }
        
        .signature-box {
          text-align: center;
        }
        
        .signature-line {
          border-top: 2px solid #4a5568;
          margin-bottom: 10px;
          padding-top: 40px;
        }
        
        .signature-label {
          color: #718096;
          font-size: 13px;
        }
        
        .footer {
          text-align: center;
          margin-top: 30px;
          padding-top: 15px;
          border-top: 2px solid #e2e8f0;
          color: #718096;
          font-size: 11px;
        }
        
        .summary-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
          margin-bottom: 20px;
        }
        
        .summary-item {
          background: #f7fafc;
          padding: 12px;
          border-radius: 6px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          border: 1px solid #e2e8f0;
        }
        
        .summary-label {
          color: #718096;
          font-size: 13px;
        }
        
        .summary-value {
          color: #2d3748;
          font-weight: bold;
          font-size: 14px;
        }
        
        @media print {
          body {
            padding: 0;
          }
          .container {
            max-width: 100%;
          }
        }
      </style>
    </head>
    <body>
      <div class="container">
        <!-- Header -->
        <div class="header">
          <div class="logo-box">لوگوی شرکت</div>
          <div class="title">فاکتور فروش</div>
          <div class="subtitle">قرارداد فروش اقساطی موبایل</div>
        </div>
        
        <!-- Customer & Sale Info -->
        <div class="info-section">
          <div class="info-box">
            <h3>اطلاعات مشتری</h3>
            <div class="info-row">
              <span class="info-label">نام:</span>
              <span class="info-value">${customer.name}</span>
            </div>
            <div class="info-row">
              <span class="info-label">موبایل:</span>
              <span class="info-value">${toPersianDigits(customer.phone)}</span>
            </div>
            <div class="info-row">
              <span class="info-label">کد ملی:</span>
              <span class="info-value">${toPersianDigits(customer.nationalId)}</span>
            </div>
          </div>
          
          <div class="info-box">
            <h3>اطلاعات فروش</h3>
            <div class="info-row">
              <span class="info-label">تاریخ:</span>
              <span class="info-value">${toJalaliDate(sale.saleDate)}</span>
            </div>
            <div class="info-row">
              <span class="info-label">شماره فاکتور:</span>
              <span class="info-value">${sale.id.substring(0, 8)}</span>
            </div>
            <div class="info-row">
              <span class="info-label">وضعیت:</span>
              <span class="info-value">${sale.status === 'active' ? 'فعال' : sale.status === 'completed' ? 'تکمیل شده' : 'معوق'}</span>
            </div>
          </div>
        </div>
        
        <!-- Product Info -->
        <div class="info-box" style="margin-bottom: 25px;">
          <h3>مشخصات محصول</h3>
          <div class="info-row">
            <span class="info-label">برند و مدل:</span>
            <span class="info-value">${phone.brand} ${phone.model}</span>
          </div>
          <div class="info-row">
            <span class="info-label">IMEI:</span>
            <span class="info-value">${phone.imei}</span>
          </div>
        </div>
        
        <!-- Financial Summary -->
        <h2 class="section-title">خلاصه مالی</h2>
        <div class="summary-grid">
          <div class="summary-item">
            <span class="summary-label">قیمت اعلامی:</span>
            <span class="summary-value amount">${formatCurrency(sale.announcedPrice)}</span>
          </div>
          <div class="summary-item">
            <span class="summary-label">پیش‌پرداخت:</span>
            <span class="summary-value amount">${formatCurrency(sale.downPayment)}</span>
          </div>
          <div class="summary-item">
            <span class="summary-label">مانده بدهی:</span>
            <span class="summary-value">${formatCurrency(sale.announcedPrice - sale.downPayment)}</span>
          </div>
          <div class="summary-item">
            <span class="summary-label">نوع محاسبه سود:</span>
            <span class="summary-value">${getProfitCalculationLabel(sale.profitCalculationType)}</span>
          </div>
          ${sale.customProfitRate ? `
          <div class="summary-item">
            <span class="summary-label">درصد سود دلخواه:</span>
            <span class="summary-value">${toPersianDigits(sale.customProfitRate.toString())}٪</span>
          </div>
          ` : ''}
          <div class="summary-item">
            <span class="summary-label">مجموع سود:</span>
            <span class="summary-value profit">${formatCurrency(sale.totalProfit)}</span>
          </div>
          <div class="summary-item">
            <span class="summary-label">جمع کل قابل پرداخت:</span>
            <span class="summary-value amount">${formatCurrency(sale.announcedPrice - sale.downPayment + sale.totalProfit)}</span>
          </div>
          <div class="summary-item">
            <span class="summary-label">تعداد اقساط:</span>
            <span class="summary-value">${toPersianDigits(sale.installmentMonths.toString())} ماه</span>
          </div>
        </div>
        
        <!-- Installments Table -->
        <h2 class="section-title">برنامه اقساط</h2>
        <table>
          <thead>
            <tr>
              <th>ردیف</th>
              <th>سررسید</th>
              <th>اصل بدهی</th>
              <th>سود</th>
              <th>جمع کل</th>
              <th>وضعیت</th>
            </tr>
          </thead>
          <tbody>
            ${installments.map(inst => `
              <tr>
                <td><strong>${toPersianDigits(inst.installmentNumber.toString())}</strong></td>
                <td>${toJalaliDate(inst.dueDate)}</td>
                <td class="amount">${formatCurrency(inst.principalAmount)}</td>
                <td class="profit">${formatCurrency(inst.interestAmount)}</td>
                <td><strong>${formatCurrency(inst.totalAmount)}</strong></td>
                <td>
                  <span class="status-${inst.status === 'paid' ? 'paid' : inst.status === 'overdue' ? 'overdue' : 'pending'}">
                    ${inst.status === 'paid' ? 'پرداخت شده' : inst.status === 'overdue' ? 'معوق' : 'در انتظار'}
                  </span>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        
        <!-- Signatures -->
        <div class="signatures">
          <div class="signature-box">
            <div class="signature-line"></div>
            <div class="signature-label">امضای مشتری</div>
          </div>
          <div class="signature-box">
            <div class="signature-line"></div>
            <div class="signature-label">امضای مدیر فروش</div>
          </div>
        </div>
        
        <!-- Footer -->
        <div class="footer">
          تاریخ صدور: ${toJalaliDate(new Date().toISOString())} | سیستم مدیریت فروش اقساطی موبایل
        </div>
      </div>
    </body>
    </html>
  `;
}

/**
 * تولید PDF فاکتور/قرارداد فروش با پشتیبانی کامل از فارسی
 */
export async function generateSaleInvoicePDF(data: PDFData): Promise<void> {
  const { customer, sale } = data;
  const htmlContent = generateInvoiceHTML(data);
  
  // تنظیمات html2pdf
  const options = {
    margin: 10,
    filename: `فاکتور_${customer.name.replace(/\s+/g, '_')}_${sale.id.substring(0, 8)}.pdf`,
    image: { type: 'jpeg' as const, quality: 0.98 },
    html2canvas: { 
      scale: 2,
      useCORS: true,
      letterRendering: true,
    },
    jsPDF: { 
      unit: 'mm', 
      format: 'a4', 
      orientation: 'portrait' as const,
    },
  };
  
  // ایجاد یک div موقت برای رندر HTML
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = htmlContent;
  tempDiv.style.position = 'absolute';
  tempDiv.style.left = '-9999px';
  document.body.appendChild(tempDiv);
  
  try {
    // تولید PDF
    await html2pdf().set(options).from(tempDiv).save();
  } finally {
    // حذف div موقت
    document.body.removeChild(tempDiv);
  }
}

/**
 * پیش‌نمایش PDF در تب جدید
 */
export async function previewSaleInvoicePDF(data: PDFData): Promise<void> {
  const htmlContent = generateInvoiceHTML(data);
  
  // تنظیمات html2pdf
  const options = {
    margin: 10,
    image: { type: 'jpeg' as const, quality: 0.98 },
    html2canvas: { 
      scale: 2,
      useCORS: true,
      letterRendering: true,
    },
    jsPDF: { 
      unit: 'mm', 
      format: 'a4', 
      orientation: 'portrait' as const,
    },
  };
  
  // ایجاد یک div موقت برای رندر HTML
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = htmlContent;
  tempDiv.style.position = 'absolute';
  tempDiv.style.left = '-9999px';
  document.body.appendChild(tempDiv);
  
  try {
    // تولید PDF و نمایش در تب جدید
    const pdfBlob = await html2pdf().set(options).from(tempDiv).output('blob');
    const pdfUrl = URL.createObjectURL(pdfBlob);
    window.open(pdfUrl, '_blank');
  } finally {
    // حذف div موقت
    document.body.removeChild(tempDiv);
  }
}
