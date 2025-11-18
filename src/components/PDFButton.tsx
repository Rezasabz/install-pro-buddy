import { useState } from "react";
import { Button } from "@/components/ui/button";
import { FileDown, Eye } from "lucide-react";
import { Sale, Customer, Phone, Installment } from "@/lib/storeProvider";
import { generateSaleInvoicePDF, previewSaleInvoicePDF } from "@/lib/pdfGenerator";
import { useToast } from "@/hooks/use-toast";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface PDFButtonProps {
  sale: Sale;
  customer: Customer;
  phone: Phone;
  installments: Installment[];
  variant?: "default" | "outline" | "ghost";
  size?: "default" | "sm" | "lg" | "icon";
}

export function PDFButton({ 
  sale, 
  customer, 
  phone, 
  installments,
  variant = "outline",
  size = "sm"
}: PDFButtonProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();

  const handleDownload = async () => {
    setIsGenerating(true);
    try {
      await generateSaleInvoicePDF({
        sale,
        customer,
        phone,
        installments,
      });
      toast({
        title: "موفق",
        description: "فایل PDF با موفقیت دانلود شد",
      });
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast({
        title: "خطا",
        description: "خطا در تولید PDF",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePreview = async () => {
    setIsGenerating(true);
    try {
      await previewSaleInvoicePDF({
        sale,
        customer,
        phone,
        installments,
      });
    } catch (error) {
      console.error('Error previewing PDF:', error);
      toast({
        title: "خطا",
        description: "خطا در نمایش PDF",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant={variant} size={size} disabled={isGenerating}>
          <FileDown className="h-4 w-4 ml-2" />
          {isGenerating ? "در حال تولید..." : "دریافت PDF"}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={handlePreview}>
          <Eye className="h-4 w-4 ml-2" />
          پیش‌نمایش
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleDownload}>
          <FileDown className="h-4 w-4 ml-2" />
          دانلود
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
