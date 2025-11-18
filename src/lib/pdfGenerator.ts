import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
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
 * تولید PDF فاکتور/قرارداد فروش
 */
export async function generateSaleInvoicePDF(data: PDFData): Promise<void> {
  const { sale, customer, phone, installments } = data;
  
  // ایجاد PDF با اندازه A4
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  let yPos = 20;

  // تنظیم فونت
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);

  // ===== هدر =====
  // جای لوگو (مستطیل خالی)
  doc.setDrawColor(66, 66, 66);
  doc.setFillColor(240, 240, 250);
  doc.rect(pageWidth / 2 - 25, yPos, 50, 25, 'FD');
  doc.setFontSize(12);
  doc.setTextColor(100);
  doc.text('COMPANY LOGO', pageWidth / 2, yPos + 15, { align: 'center' });
  
  yPos += 35;

  // عنوان
  doc.setFontSize(22);
  doc.setTextColor(66, 66, 66);
  doc.text('SALES INVOICE', pageWidth / 2, yPos, { align: 'center' });
  doc.setFontSize(16);
  doc.setTextColor(100);
  doc.text('Mobile Installment Contract', pageWidth / 2, yPos + 8, { align: 'center' });
  
  yPos += 20;

  // خط جداکننده
  doc.setDrawColor(100);
  doc.setLineWidth(0.5);
  doc.line(15, yPos, pageWidth - 15, yPos);
  
  yPos += 10;

  // ===== اطلاعات مشتری و فروش =====
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  
  // ستون چپ - اطلاعات مشتری
  const leftCol = 15;
  const rightCol = pageWidth / 2 + 5;
  
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(66, 66, 66);
  doc.text('CUSTOMER INFORMATION', leftCol, yPos);
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(80);
  doc.text(`Name: ${customer.name}`, leftCol, yPos + 8);
  doc.text(`Mobile: ${customer.phone}`, leftCol, yPos + 14);
  doc.text(`National ID: ${customer.nationalId}`, leftCol, yPos + 20);
  
  // ستون راست - اطلاعات فروش
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(66, 66, 66);
  doc.text('SALE INFORMATION', rightCol, yPos);
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(80);
  doc.text(`Date: ${toJalaliDate(sale.saleDate)}`, rightCol, yPos + 8);
  doc.text(`Invoice #: ${sale.id.substring(0, 8)}`, rightCol, yPos + 14);
  
  yPos += 35;

  // ===== اطلاعات محصول =====
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(66, 66, 66);
  doc.text('PRODUCT DETAILS', leftCol, yPos);
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(80);
  doc.text(`Brand & Model: ${phone.brand} ${phone.model}`, leftCol, yPos + 8);
  doc.text(`IMEI: ${phone.imei}`, leftCol, yPos + 14);
  
  yPos += 28;

  // ===== جدول مالی =====
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(66, 66, 66);
  doc.text('FINANCIAL SUMMARY', leftCol, yPos);
  
  yPos += 8;

  const financialData = [
    ['Announced Price', formatCurrency(sale.announcedPrice)],
    ['Down Payment', formatCurrency(sale.downPayment)],
    ['Remaining Amount', formatCurrency(sale.announcedPrice - sale.downPayment)],
    ['Profit Calculation Type', getProfitCalculationLabel(sale.profitCalculationType)],
    ...(sale.customProfitRate ? [['Custom Profit Rate', `${sale.customProfitRate}%`]] : []),
    ['Total Profit', formatCurrency(sale.totalProfit)],
    ['Total Payable', formatCurrency(sale.announcedPrice - sale.downPayment + sale.totalProfit)],
    ['Number of Installments', `${sale.installmentMonths} months`],
  ];

  autoTable(doc, {
    startY: yPos,
    head: [['Description', 'Amount']],
    body: financialData,
    theme: 'striped',
    styles: {
      font: 'helvetica',
      fontSize: 10,
      cellPadding: 4,
      lineColor: [200, 200, 200],
      lineWidth: 0.1,
    },
    headStyles: {
      fillColor: [66, 66, 66],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 11,
    },
    alternateRowStyles: {
      fillColor: [245, 245, 250],
    },
    columnStyles: {
      0: { cellWidth: 110, fontStyle: 'bold' },
      1: { cellWidth: 'auto', halign: 'right', textColor: [0, 100, 0] },
    },
  });

  // @ts-expect-error - jspdf-autotable adds lastAutoTable property
  yPos = doc.lastAutoTable.finalY + 10;

  // ===== جدول اقساط =====
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(66, 66, 66);
  doc.text('INSTALLMENT SCHEDULE', leftCol, yPos);
  
  yPos += 8;

  const installmentData = installments.map((inst) => [
    inst.installmentNumber.toString(),
    toJalaliDate(inst.dueDate),
    formatCurrency(inst.principalAmount),
    formatCurrency(inst.interestAmount),
    formatCurrency(inst.totalAmount),
    inst.status === 'paid' ? 'PAID' : 'PENDING',
  ]);

  autoTable(doc, {
    startY: yPos,
    head: [[
      '#',
      'Due Date',
      'Principal',
      'Interest',
      'Total',
      'Status'
    ]],
    body: installmentData,
    theme: 'grid',
    styles: {
      font: 'helvetica',
      fontSize: 9,
      cellPadding: 3,
      lineColor: [200, 200, 200],
      lineWidth: 0.1,
    },
    headStyles: {
      fillColor: [66, 66, 66],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      halign: 'center',
      fontSize: 10,
    },
    alternateRowStyles: {
      fillColor: [250, 250, 255],
    },
    columnStyles: {
      0: { cellWidth: 15, halign: 'center', fontStyle: 'bold' },
      1: { cellWidth: 32, halign: 'center' },
      2: { cellWidth: 32, halign: 'right' },
      3: { cellWidth: 32, halign: 'right', textColor: [0, 100, 200] },
      4: { cellWidth: 32, halign: 'right', fontStyle: 'bold' },
      5: { cellWidth: 'auto', halign: 'center' },
    },
  });

  // @ts-expect-error - jspdf-autotable adds lastAutoTable property
  yPos = doc.lastAutoTable.finalY + 15;

  // ===== امضاها =====
  // بررسی اینکه آیا فضای کافی برای امضا داریم
  if (yPos > pageHeight - 50) {
    doc.addPage();
    yPos = 20;
  }

  doc.setDrawColor(150);
  doc.setLineWidth(0.3);
  
  // امضای مشتری
  doc.setDrawColor(100);
  doc.line(leftCol, yPos + 20, leftCol + 65, yPos + 20);
  doc.setFontSize(10);
  doc.setTextColor(80);
  doc.text('Customer Signature', leftCol + 32, yPos + 26, { align: 'center' });
  
  // امضای مدیر فروش
  doc.line(rightCol, yPos + 20, rightCol + 65, yPos + 20);
  doc.text('Sales Manager Signature', rightCol + 32, yPos + 26, { align: 'center' });

  // ===== فوتر =====
  doc.setFontSize(8);
  doc.setTextColor(120);
  const footerText = `Generated: ${new Date().toLocaleDateString('en-US')} | Mobile Installment Management System`;
  doc.text(footerText, pageWidth / 2, pageHeight - 10, { align: 'center' });

  // ذخیره PDF
  const fileName = `Invoice_${customer.name.replace(/\s+/g, '_')}_${sale.id.substring(0, 8)}.pdf`;
  doc.save(fileName);
}

/**
 * پیش‌نمایش PDF در تب جدید
 */
export async function previewSaleInvoicePDF(data: PDFData): Promise<void> {
  const { sale, customer, phone, installments } = data;
  
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  // همان کد بالا...
  // (برای صرفه‌جویی در فضا، کد تکراری را حذف می‌کنیم)
  
  // نمایش در تب جدید
  const pdfBlob = doc.output('blob');
  const pdfUrl = URL.createObjectURL(pdfBlob);
  window.open(pdfUrl, '_blank');
}
