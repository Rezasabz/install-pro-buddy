import { useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Invoice } from "./Invoice";
import { Sale, Customer, Phone } from "@/lib/storeProvider";
import { Printer, Download, X } from "lucide-react";

interface InvoiceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
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

export function InvoiceDialog({
  open,
  onOpenChange,
  sale,
  customer,
  phone,
  installments,
}: InvoiceDialogProps) {
  const invoiceRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = () => {
    // برای دانلود PDF از window.print استفاده می‌کنیم
    if (invoiceRef.current) {
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(`
          <!DOCTYPE html>
          <html dir="rtl">
            <head>
              <meta charset="utf-8">
              <title>فاکتور فروش - ${customer.name}</title>
              <style>
                body { 
                  font-family: 'Vazirmatn', 'Segoe UI', Tahoma, sans-serif; 
                  margin: 0; 
                  padding: 20px;
                  direction: rtl;
                }
                * { box-sizing: border-box; }
                @page { size: A4; margin: 0; }
                @media print {
                  body { padding: 0; }
                }
              </style>
              <link href="https://cdn.jsdelivr.net/npm/vazirmatn@33.0.3/Vazirmatn-font-face.css" rel="stylesheet">
            </head>
            <body>
              ${invoiceRef.current.innerHTML}
            </body>
          </html>
        `);
        printWindow.document.close();
        setTimeout(() => {
          printWindow.print();
        }, 250);
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto p-0">
        <DialogHeader className="p-6 pb-0">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-2xl font-bold">فاکتور فروش</DialogTitle>
            <div className="flex items-center gap-2">
              <Button
                onClick={handlePrint}
                variant="outline"
                size="sm"
                className="gap-2"
              >
                <Printer className="h-4 w-4" />
                چاپ
              </Button>
              <Button
                onClick={handleDownloadPDF}
                variant="outline"
                size="sm"
                className="gap-2"
              >
                <Download className="h-4 w-4" />
                دانلود PDF
              </Button>
              <Button
                onClick={() => onOpenChange(false)}
                variant="ghost"
                size="sm"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </DialogHeader>
        
        <div className="p-6 pt-4">
          <Invoice
            ref={invoiceRef}
            sale={sale}
            customer={customer}
            phone={phone}
            installments={installments}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
