import { useState, useEffect } from "react";
import Layout from "@/components/Layout";
import { LoadingOverlay } from "@/components/LoadingOverlay";
import { InvoiceDialog } from "@/components/InvoiceDialog";
import { JalaliDatePicker } from "@/components/JalaliDatePicker";
import { useDataContext } from "@/contexts/DataContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  salesStore,
  Sale,
  customersStore,
  phonesStore,
  installmentsStore,
  partnersStore,
  Customer,
  Phone,
  Installment,
  Partner,
  ProfitCalculationType,
} from "@/lib/storeProvider";
import { calculateProfit, getProfitCalculationLabel } from "@/lib/profitCalculations";
import { formatCurrency, toJalaliDate, toPersianDigits } from "@/lib/persian";
import { addMonthsToDate } from "@/lib/jalali";
import { 
  calculateInstallments, 
  checkCapitalAvailability,
  deductCapitalForPurchase,
  addInitialProfitToPartners
} from "@/lib/profitCalculator";
import { Plus, ShoppingCart, TrendingUp, Trash2, Eye, Edit, User, Smartphone, DollarSign, Calendar, CreditCard, TrendingDown, CheckCircle2, Clock, AlertCircle, FileText, Percent, Hash } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

const Sales = () => {
  const [sales, setSales] = useState<Sale[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [phones, setPhones] = useState<Phone[]>([]);
  const [installments, setInstallments] = useState<Installment[]>([]);
  const [partners, setPartners] = useState<Partner[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSale, setEditingSale] = useState<Sale | null>(null);
  const [detailsDialog, setDetailsDialog] = useState<{ open: boolean; saleId: string }>({ open: false, saleId: '' });
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; saleId: string; saleInfo: string }>({ open: false, saleId: '', saleInfo: '' });
  const [invoiceDialog, setInvoiceDialog] = useState<{
    open: boolean;
    sale: Sale | null;
    customer: Customer | null;
    phone: Phone | null;
    installments: Installment[];
  }>({
    open: false,
    sale: null,
    customer: null,
    phone: null,
    installments: [],
  });
  const [saleDate, setSaleDate] = useState<Date>(new Date());
  const [formData, setFormData] = useState({
    customerId: "",
    phoneId: "", // گوشی از موجودی
    announcedPrice: "", // قیمت اعلام شده به مشتری
    downPayment: "",
    installmentMonths: "6",
    profitCalculationType: "fixed_4_percent" as "fixed_4_percent" | "monthly_4_percent_lda" | "custom_annual",
    customProfitRate: "8",
  });
  const [preview, setPreview] = useState({
    remainingDebt: 0,
    installments: [] as Array<{
      installmentNumber: number;
      principalAmount: number;
      interestAmount: number;
      totalAmount: number;
      remainingDebt: number;
    }>,
    totalInterest: 0,
    initialProfit: 0,
  });
  const { toast } = useToast();
  const { refreshPartners, refreshDashboard, refreshPhones, refreshCustomers, refreshInstallments } = useDataContext();

  const availablePhones = phones.filter(p => p.status === 'available');

  const loadSales = async () => {
    try {
      const [salesData, customersData, phonesData, installmentsData, partnersData] = await Promise.all([
        salesStore.getAll(),
        customersStore.getAll(),
        phonesStore.getAll(),
        installmentsStore.getAll(),
        partnersStore.getAll(),
      ]);
      setSales(salesData);
      setCustomers(customersData);
      setPhones(phonesData);
      setInstallments(installmentsData);
      setPartners(partnersData);
    } catch (error) {
      console.error('Error loading sales:', error);
      toast({
        title: "خطا",
        description: "خطا در بارگذاری فروش‌ها",
        variant: "destructive",
      });
    }
  };

  const handleShowInvoice = (sale: Sale) => {
    const customer = customers.find(c => c.id === sale.customerId);
    const phone = phones.find(p => p.id === sale.phoneId);
    const saleInstallments = installments.filter(i => i.saleId === sale.id);
    
    if (customer && phone) {
      setInvoiceDialog({
        open: true,
        sale,
        customer,
        phone,
        installments: saleInstallments,
      });
    } else {
      toast({
        title: "خطا",
        description: "اطلاعات کامل برای نمایش فاکتور یافت نشد",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    loadSales();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // فیلتر کردن فروش‌ها
  const filteredSales = sales.filter(sale => {
    if (searchQuery === "") return true;
    
    const customer = customers.find(c => c.id === sale.customerId);
    const phone = phones.find(p => p.id === sale.phoneId);
    
    return (
      customer?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customer?.phone.includes(searchQuery) ||
      phone?.brand.toLowerCase().includes(searchQuery.toLowerCase()) ||
      phone?.model.toLowerCase().includes(searchQuery.toLowerCase()) ||
      phone?.imei.includes(searchQuery)
    );
  });

  // Listen for refresh events from other pages
  useEffect(() => {
    const handleRefreshPhones = () => {
      phonesStore.getAll().then(setPhones);
    };

    const handleRefreshCustomers = () => {
      customersStore.getAll().then(setCustomers);
    };

    window.addEventListener('refreshPhones', handleRefreshPhones);
    window.addEventListener('refreshCustomers', handleRefreshCustomers);
    
    return () => {
      window.removeEventListener('refreshPhones', handleRefreshPhones);
      window.removeEventListener('refreshCustomers', handleRefreshCustomers);
    };
  }, []);

  useEffect(() => {
    // محاسبه پیش‌نمایش با سیستم جدید
    if (formData.phoneId && formData.announcedPrice && formData.downPayment && formData.installmentMonths) {
      const phone = availablePhones.find(p => p.id === formData.phoneId);
      if (!phone) return;

      const announcedPrice = parseFloat(formData.announcedPrice.replace(/,/g, '')) || 0;
      const purchasePrice = phone.purchasePrice;
      const downPayment = parseFloat(formData.downPayment.replace(/,/g, '')) || 0;
      const installmentMonths = parseInt(formData.installmentMonths);

      if (announcedPrice > 0 && downPayment < announcedPrice && installmentMonths >= 2) {
        const remainingDebt = announcedPrice - downPayment;
        const customRate = (formData.profitCalculationType === 'fixed_4_percent' || formData.profitCalculationType === 'custom_annual')
          ? parseFloat(formData.customProfitRate) || (formData.profitCalculationType === 'fixed_4_percent' ? 4 : 8)
          : undefined;
        
        const result = calculateProfit(
          remainingDebt,
          installmentMonths,
          formData.profitCalculationType,
          customRate
        );
        
        const initialProfit = announcedPrice - purchasePrice;

        setPreview({
          remainingDebt,
          installments: result.installments,
          totalInterest: result.totalProfit,
          initialProfit,
        });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    formData.phoneId, 
    formData.announcedPrice, 
    formData.downPayment, 
    formData.installmentMonths,
    formData.profitCalculationType,
    formData.customProfitRate
  ]);

  const handleDeleteSale = (saleId: string) => {
    const sale = sales.find(s => s.id === saleId);
    const customer = customers.find(c => c.id === sale?.customerId);
    const phone = phones.find(p => p.id === sale?.phoneId);
    const saleInfo = sale ? `${customer?.name || 'نامشخص'} - ${phone ? `${phone.brand} ${phone.model}` : 'نامشخص'}` : '';
    setDeleteDialog({ open: true, saleId, saleInfo });
  };

  const confirmDeleteSale = async () => {
    try {
      // حذف اقساط مرتبط
      const saleInstallments = await installmentsStore.getBySaleId(deleteDialog.saleId);
      for (const inst of saleInstallments) {
        await installmentsStore.delete(inst.id);
      }

      // حذف فروش
      await salesStore.delete(deleteDialog.saleId);

      toast({
        title: "موفق",
        description: "فروش و اقساط مرتبط با موفقیت حذف شدند",
      });

      setDeleteDialog({ open: false, saleId: '', saleInfo: '' });
      loadSales();
    } catch (error) {
      console.error('Error deleting sale:', error);
      toast({
        title: "خطا",
        description: "خطا در حذف فروش",
        variant: "destructive",
      });
    }
  };

  const handleAnnouncedPriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const numericValue = value.replace(/[^\d]/g, '');
    
    if (numericValue === '') {
      setFormData({ ...formData, announcedPrice: '' });
      return;
    }
    
    const number = parseInt(numericValue, 10);
    const formatted = number.toLocaleString('en-US');
    setFormData({ ...formData, announcedPrice: formatted });
  };

  const handleDownPaymentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const numericValue = value.replace(/[^\d]/g, '');
    
    if (numericValue === '') {
      setFormData({ ...formData, downPayment: '' });
      return;
    }
    
    const number = parseInt(numericValue, 10);
    const formatted = number.toLocaleString('en-US');
    setFormData({ ...formData, downPayment: formatted });
  };

  const handleEdit = (sale: Sale) => {
    setEditingSale(sale);
    setFormData({
      customerId: sale.customerId,
      phoneId: sale.phoneId,
      announcedPrice: sale.announcedPrice.toString(),
      downPayment: sale.downPayment.toString(),
      installmentMonths: sale.installmentMonths.toString(),
      profitCalculationType: sale.profitCalculationType || "fixed_4_percent",
      customProfitRate: sale.customProfitRate?.toString() || "8",
    });
    setSaleDate(new Date(sale.saleDate));
    setIsDialogOpen(true);
  };

  const handleUpdateSale = async () => {
    if (!editingSale) return;

    try {
      setIsLoading(true);
      setLoadingMessage("در حال آپدیت فروش...");

      const announcedPrice = parseFloat(formData.announcedPrice.replace(/,/g, ''));
      const downPayment = parseFloat(formData.downPayment.replace(/,/g, ''));
      const installmentMonths = parseInt(formData.installmentMonths);

      // محاسبه مجدد سود
      const phone = phones.find(p => p.id === editingSale.phoneId);
      if (!phone) throw new Error("گوشی یافت نشد");

      const purchasePrice = phone.purchasePrice;
      const initialProfit = announcedPrice - purchasePrice;

      const customRate = formData.profitCalculationType === "custom_annual" 
        ? parseFloat(formData.customProfitRate) / 100 
        : parseFloat(formData.customProfitRate) / 100;

      const remainingDebt = announcedPrice - downPayment;
      const profitResult = calculateProfit(
        remainingDebt,
        installmentMonths,
        formData.profitCalculationType,
        customRate
      );

      // آپدیت فروش
      const updateData: Record<string, unknown> = {
        announced_price: announcedPrice,
        down_payment: downPayment,
        installment_months: installmentMonths,
        profit_calculation_type: formData.profitCalculationType,
        custom_profit_rate: customRate,
        total_profit: profitResult.totalProfit,
        initial_profit: initialProfit,
        sale_date: saleDate.toISOString(),
      };
      await salesStore.update(editingSale.id, updateData as Partial<Sale>);

      // حذف اقساط قدیمی
      const oldInstallments = installments.filter(i => i.saleId === editingSale.id);
      for (const inst of oldInstallments) {
        await installmentsStore.delete(inst.id);
      }

      // ایجاد اقساط جدید
      for (const inst of profitResult.installments) {
        const dueDate = addMonthsToDate(saleDate, inst.installmentNumber);
        
        await installmentsStore.add({
          saleId: editingSale.id,
          installmentNumber: inst.installmentNumber,
          principalAmount: inst.principalAmount,
          interestAmount: inst.interestAmount,
          totalAmount: inst.totalAmount,
          remainingDebt: inst.remainingDebt,
          dueDate: dueDate.toISOString(),
          status: 'pending',
        });
      }

      toast({
        title: "موفق",
        description: "فروش با موفقیت آپدیت شد",
      });

      setIsDialogOpen(false);
      setEditingSale(null);
      await loadSales();
    } catch (error) {
      console.error('Error updating sale:', error);
      toast({
        title: "خطا",
        description: "خطا در آپدیت فروش",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (editingSale) {
      // ویرایش فروش - فقط اجازه تغییر تاریخ و مبالغ
      await handleUpdateSale();
      return;
    }

    const phone = availablePhones.find(p => p.id === formData.phoneId);
    if (!phone) {
      toast({
        title: "خطا",
        description: "گوشی انتخاب شده یافت نشد",
        variant: "destructive",
      });
      return;
    }

    const announcedPrice = parseFloat(formData.announcedPrice.replace(/,/g, ''));
    const purchasePrice = phone.purchasePrice;
    const downPayment = parseFloat(formData.downPayment.replace(/,/g, ''));
    const installmentMonths = parseInt(formData.installmentMonths);

    // اعتبارسنجی
    if (isNaN(announcedPrice) || announcedPrice <= 0) {
      toast({
        title: "خطا",
        description: "قیمت اعلامی نامعتبر است",
        variant: "destructive",
      });
      return;
    }

    if (purchasePrice > announcedPrice) {
      toast({
        title: "خطا",
        description: "قیمت اعلامی باید بیشتر از قیمت خرید باشد",
        variant: "destructive",
      });
      return;
    }

    if (downPayment < 0 || downPayment >= announcedPrice) {
      toast({
        title: "خطا",
        description: "مبلغ پیش‌پرداخت نامعتبر است",
        variant: "destructive",
      });
      return;
    }

    // بررسی موجودی سرمایه با در نظر گیری تاریخ فروش
    const capitalCheck = checkCapitalAvailability(purchasePrice, partners, saleDate);
    if (!capitalCheck.isAvailable) {
      toast({
        title: "سرمایه ناکافی",
        description: `سرمایه در دسترس: ${formatCurrency(capitalCheck.availableCapital)}. کمبود: ${formatCurrency(capitalCheck.shortfall)}. لطفاً سرمایه را افزایش دهید.`,
        variant: "destructive",
      });
      return;
    }

    // بستن dialog و نمایش loading
    setIsDialogOpen(false);
    setIsLoading(true);
    setLoadingMessage("در حال ثبت فروش...");
    
    // اعتبارسنجی تعداد اقساط
    if (installmentMonths < 2 || installmentMonths > 36) {
      setIsLoading(false);
      setLoadingMessage("");
      toast({
        title: "خطا",
        description: "تعداد اقساط باید بین ۲ تا ۳۶ ماه باشد",
        variant: "destructive",
      });
      return;
    }

    // اعتبارسنجی درصد سود
    if (formData.profitCalculationType === 'fixed_4_percent') {
      const customRate = parseFloat(formData.customProfitRate);
      if (isNaN(customRate) || customRate < 1) {
        setIsLoading(false);
        setLoadingMessage("");
        toast({
          title: "خطا",
          description: "درصد سود باید حداقل ۱٪ باشد",
          variant: "destructive",
        });
        return;
      }
    }
    
    if (formData.profitCalculationType === 'custom_annual') {
      const customRate = parseFloat(formData.customProfitRate);
      if (isNaN(customRate) || customRate < 8) {
        setIsLoading(false);
        setLoadingMessage("");
        toast({
          title: "خطا",
          description: "درصد سود دلخواه باید حداقل ۸٪ باشد",
          variant: "destructive",
        });
        return;
      }
    }

    try {
      const remainingDebt = announcedPrice - downPayment;
      const customRate = (formData.profitCalculationType === 'fixed_4_percent' || formData.profitCalculationType === 'custom_annual')
        ? parseFloat(formData.customProfitRate) 
        : undefined;
      
      const profitResult = calculateProfit(
        remainingDebt,
        installmentMonths,
        formData.profitCalculationType,
        customRate
      );
      
      const initialProfit = announcedPrice - purchasePrice;

      // ایجاد فروش
      const newSale = await salesStore.add({
        customerId: formData.customerId,
        phoneId: formData.phoneId,
        announcedPrice,
        purchasePrice,
        downPayment,
        installmentMonths,
        profitCalculationType: formData.profitCalculationType,
        customProfitRate: customRate,
        monthlyInterestRate: 0.04, // برای سازگاری با کد قدیمی
        totalProfit: profitResult.totalProfit,
        initialProfit,
        saleDate: saleDate.toISOString(),
        status: 'active',
      });

      // تغییر وضعیت گوشی به فروخته شده
      await phonesStore.update(formData.phoneId, { status: 'sold' });

      // ایجاد اقساط
      for (const inst of profitResult.installments) {
        // استفاده از تابع addMonthsToDate برای محاسبه دقیق تاریخ با تقویم شمسی
        const dueDate = addMonthsToDate(saleDate, inst.installmentNumber);
        
        await installmentsStore.add({
          saleId: newSale.id,
          installmentNumber: inst.installmentNumber,
          principalAmount: inst.principalAmount,
          interestAmount: inst.interestAmount,
          totalAmount: inst.totalAmount,
          remainingDebt: inst.remainingDebt,
          dueDate: dueDate.toISOString(),
          status: 'pending',
        });
      }

      // کاهش سرمایه در دسترس با تاریخ فروش
      await deductCapitalForPurchase(purchasePrice, saleDate);

      // ثبت سود اولیه با تاریخ فروش
      await addInitialProfitToPartners(initialProfit, saleDate);

      toast({
        title: "موفق",
        description: `فروش ثبت شد. سرمایه ${formatCurrency(purchasePrice)} کسر و سود اولیه ${formatCurrency(initialProfit)} ثبت شد.`,
      });

      setFormData({
        customerId: "",
        phoneId: "",
        announcedPrice: "",
        downPayment: "",
        installmentMonths: "6",
        profitCalculationType: "fixed_4_percent",
        customProfitRate: "8",
      });
      await loadSales();
      
      // Refresh partners, dashboard, and installments
      refreshPartners();
      refreshDashboard();
      refreshInstallments();
    } catch (error) {
      console.error('Error creating sale:', error);
      toast({
        title: "خطا",
        description: "خطا در ثبت فروش",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      setLoadingMessage("");
    }
  };

  const getSaleDetails = (sale: Sale) => {
    const customer = customers.find(c => c.id === sale.customerId);
    const phone = phones.find(p => p.id === sale.phoneId);
    const saleInstallments = installments.filter(i => i.saleId === sale.id);
    const paidInstallments = saleInstallments.filter(i => i.status === 'paid');
    
    const paidPrincipal = paidInstallments.reduce((sum, i) => sum + i.principalAmount, 0);
    const paidInterest = paidInstallments.reduce((sum, i) => sum + i.interestAmount, 0);
    const paidAmount = sale.downPayment + paidPrincipal + paidInterest;
    
    const remainingDebt = sale.announcedPrice - sale.downPayment - paidPrincipal;

    return {
      customer,
      phone,
      installments: saleInstallments,
      paidAmount,
      remainingDebt,
      paidInterest,
      paidCount: paidInstallments.length,
      totalCount: saleInstallments.length,
    };
  };

  const totalRevenue = sales.reduce((sum, s) => sum + s.announcedPrice, 0);
  const activeSales = sales.filter(s => s.status === 'active').length;

  return (
    <Layout>
      {isLoading && <LoadingOverlay message={loadingMessage} />}
      <div className="space-y-6 animate-fade-scale">
        <div className="flex flex-col sm:flex-row justify-between items-start gap-4 pb-2">
          <div className="space-y-1">
            <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-primary via-secondary to-primary bg-clip-text text-transparent bg-[length:200%_auto] animate-gradient">
              مدیریت فروش
            </h1>
            <p className="text-muted-foreground/80 text-sm md:text-base">
              ثبت و مدیریت فروش‌های اقساطی
            </p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) setEditingSale(null);
          }}>
            <DialogTrigger asChild>
              <Button
                onClick={() => {
                  setFormData({
                    customerId: "",
                    phoneId: "",
                    announcedPrice: "",
                    downPayment: "",
                    installmentMonths: "6",
                    profitCalculationType: "fixed_4_percent",
                    customProfitRate: "8",
                  });
                  setSaleDate(new Date());
                }}
                disabled={customers.length === 0 || availablePhones.length === 0}
                className="gap-2 hover:scale-105 transition-all duration-200"
              >
                <Plus className="h-4 w-4" />
                ثبت فروش جدید
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
              <DialogHeader className="flex-shrink-0">
                <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-primary via-secondary to-primary bg-clip-text text-transparent">
                  {editingSale ? "ویرایش فروش" : "ثبت فروش جدید"}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-1">
                <div className="space-y-6 py-4">
                
                {/* بخش اطلاعات اصلی */}
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
                    <User className="h-4 w-4" />
                    اطلاعات مشتری و گوشی
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="customerId">مشتری</Label>
                      <Select
                        value={formData.customerId}
                        onValueChange={(value) =>
                          setFormData({ ...formData, customerId: value })
                        }
                        required
                        disabled={!!editingSale}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="انتخاب مشتری" />
                        </SelectTrigger>
                        <SelectContent>
                          {customers.map((customer) => (
                            <SelectItem key={customer.id} value={customer.id}>
                              {customer.name} - {customer.phone}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {editingSale && (
                        <p className="text-xs text-muted-foreground mt-1">
                          غیرقابل تغییر
                        </p>
                      )}
                    </div>
                    
                    <div>
                      <Label>تاریخ فروش</Label>
                      <JalaliDatePicker
                        value={saleDate}
                        onChange={setSaleDate}
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="phoneId">گوشی از موجودی</Label>
                  <Select
                    value={formData.phoneId}
                    onValueChange={(value) => {
                      const phone = availablePhones.find(p => p.id === value);
                      setFormData({ 
                        ...formData, 
                        phoneId: value,
                        announcedPrice: phone ? phone.sellingPrice.toString() : ""
                      });
                    }}
                    required
                    disabled={!!editingSale}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="انتخاب گوشی" />
                    </SelectTrigger>
                    <SelectContent>
                      {availablePhones.map((phone) => (
                        <SelectItem key={phone.id} value={phone.id}>
                          {phone.brand} {phone.model} - خرید: {formatCurrency(phone.purchasePrice)} / فروش: {formatCurrency(phone.sellingPrice)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                    <p className="text-xs text-muted-foreground mt-1">
                      گوشی‌های موجود در انبار
                    </p>
                  </div>
                </div>

                {/* بخش مبالغ */}
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
                    <DollarSign className="h-4 w-4" />
                    مبالغ و اقساط
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="announcedPrice">قیمت اعلامی (تومان)</Label>
                      <Input
                        id="announcedPrice"
                        type="text"
                        value={formData.announcedPrice}
                        onChange={handleAnnouncedPriceChange}
                        required
                        placeholder="مثال: ۲۲,۰۰۰,۰۰۰"
                        dir="ltr"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="downPayment">پیش‌پرداخت (تومان)</Label>
                      <Input
                        id="downPayment"
                        type="text"
                        value={formData.downPayment}
                        onChange={handleDownPaymentChange}
                        required
                        placeholder="مثال: ۵,۰۰۰,۰۰۰"
                        dir="ltr"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="installmentMonths">تعداد اقساط (ماه)</Label>
                      <Input
                        id="installmentMonths"
                        type="number"
                        min="2"
                        max="36"
                        value={formData.installmentMonths}
                        onChange={(e) =>
                          setFormData({ ...formData, installmentMonths: e.target.value })
                        }
                        placeholder="حداقل ۲، حداکثر ۳۶"
                      />
                    </div>

                    <div>
                      <Label htmlFor="profitCalculationType">نوع محاسبه سود</Label>
                  <Select
                    value={formData.profitCalculationType}
                    onValueChange={(value: ProfitCalculationType) =>
                      setFormData({ ...formData, profitCalculationType: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="fixed_4_percent">
                        سود مانده هر ماه
                      </SelectItem>
                      <SelectItem value="monthly_4_percent_lda">
                        سود ماهیانه ۴٪
                      </SelectItem>
                      <SelectItem value="custom_annual">
                        سود دلخواه (حداقل ۸٪)
                      </SelectItem>
                    </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {(formData.profitCalculationType === 'fixed_4_percent' || formData.profitCalculationType === 'custom_annual') && (
                    <div>
                      <Label htmlFor="customProfitRate">
                        {formData.profitCalculationType === 'fixed_4_percent' 
                          ? 'درصد سود ماهیانه (پیش‌فرض: ۴٪)' 
                          : 'درصد سود (حداقل ۸٪)'}
                      </Label>
                      <Input
                        id="customProfitRate"
                        type="number"
                        min={formData.profitCalculationType === 'fixed_4_percent' ? '1' : '8'}
                        step="0.5"
                        value={formData.customProfitRate}
                        onChange={(e) =>
                          setFormData({ ...formData, customProfitRate: e.target.value })
                        }
                        placeholder={formData.profitCalculationType === 'fixed_4_percent' ? 'مثال: ۴' : 'مثال: ۱۰'}
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        {formData.profitCalculationType === 'fixed_4_percent'
                          ? 'درصد سود روی مانده بدهی هر ماه محاسبه می‌شود'
                          : 'سود روی کل مبلغ باقیمانده محاسبه می‌شود'}
                      </p>
                    </div>
                  )}
                </div>

                {preview.installments.length > 0 && (
                  <div className="p-4 bg-muted rounded-lg space-y-3">
                    <div className="text-sm font-semibold">پیش‌نمایش محاسبات</div>
                    
                    <div className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">نوع محاسبه:</span>
                        <span className="font-semibold text-primary">
                          {getProfitCalculationLabel(formData.profitCalculationType)}
                          {(formData.profitCalculationType === 'fixed_4_percent' || formData.profitCalculationType === 'custom_annual') && 
                            ` (${toPersianDigits(formData.customProfitRate)}٪)`
                          }
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">سود اولیه (تفاوت قیمت):</span>
                        <span className={`font-semibold ${preview.initialProfit >= 0 ? 'text-success' : 'text-destructive'}`}>
                          {formatCurrency(preview.initialProfit)}
                        </span>
                      </div>
                      {preview.initialProfit < 0 && (
                        <div className="text-xs text-destructive bg-destructive/10 p-2 rounded">
                          ⚠️ هشدار: قیمت فروش کمتر از قیمت خرید است! این فروش ضرر دارد.
                        </div>
                      )}
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">مانده بدهی:</span>
                        <span className="font-semibold">{formatCurrency(preview.remainingDebt)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">مجموع سود:</span>
                        <span className="font-semibold text-secondary">{formatCurrency(preview.totalInterest)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">مبلغ هر قسط:</span>
                        <span className="font-semibold text-primary">
                          {preview.installments.length > 0 && formatCurrency(preview.installments[0].totalAmount)}
                        </span>
                      </div>
                    </div>

                    <div className="pt-2 border-t">
                      <div className="text-xs font-semibold mb-2">جدول اقساط (نمونه ۳ قسط اول):</div>
                      <div className="overflow-x-auto">
                        <table className="w-full text-xs">
                          <thead>
                            <tr className="border-b">
                              <th className="text-right pb-1">قسط</th>
                              <th className="text-right pb-1">اصل</th>
                              <th className="text-right pb-1">سود</th>
                              <th className="text-right pb-1">جمع</th>
                            </tr>
                          </thead>
                          <tbody>
                            {preview.installments.slice(0, 3).map((inst) => (
                              <tr key={inst.installmentNumber} className="border-b">
                                <td className="py-1">{toPersianDigits(inst.installmentNumber)}</td>
                                <td className="py-1">{formatCurrency(inst.principalAmount)}</td>
                                <td className="py-1 text-secondary">{formatCurrency(inst.interestAmount)}</td>
                                <td className="py-1 font-semibold">{formatCurrency(inst.totalAmount)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                )}

                <div className="sticky bottom-0 bg-background pt-4 pb-2 border-t mt-6">
                  <Button type="submit" className="w-full h-12 text-base font-semibold">
                    {editingSale ? "💾 ذخیره تغییرات" : "✨ ثبت فروش"}
                  </Button>
                </div>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Card className="relative overflow-hidden bg-card/80 backdrop-blur-sm hover:shadow-xl hover:scale-[1.02] transition-all duration-300 group">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <CardHeader className="relative z-10">
              <CardTitle className="flex items-center gap-2">
                <div className="relative">
                  <div className="absolute inset-0 bg-primary/20 rounded-lg blur-sm opacity-0 group-hover:opacity-100 transition-opacity" />
                  <ShoppingCart className="relative h-5 w-5 text-primary" />
                </div>
                فروش فعال
              </CardTitle>
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
                {toPersianDigits(activeSales)}
              </div>
              <p className="text-sm text-muted-foreground/70 mt-2">
                قرارداد در حال اجرا
              </p>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden bg-card/80 backdrop-blur-sm hover:shadow-xl hover:scale-[1.02] transition-all duration-300 group">
            <div className="absolute inset-0 bg-gradient-to-br from-success/5 via-transparent to-success/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <CardHeader className="relative z-10">
              <CardTitle className="flex items-center gap-2">
                <div className="relative">
                  <div className="absolute inset-0 bg-success/20 rounded-lg blur-sm opacity-0 group-hover:opacity-100 transition-opacity" />
                  <TrendingUp className="relative h-5 w-5 text-success" />
                </div>
                درآمد کل
              </CardTitle>
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="text-2xl font-bold bg-gradient-to-r from-success to-success/80 bg-clip-text text-transparent">
                {formatCurrency(totalRevenue)}
              </div>
              <p className="text-sm text-muted-foreground/70 mt-2">
                مجموع فروش
              </p>
            </CardContent>
          </Card>
        </div>

        {/* جستجو */}
        <Card className="bg-card/50 backdrop-blur-sm border-primary/10">
          <CardContent className="pt-6">
            <div className="relative">
              <ShoppingCart className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="جستجو بر اساس نام مشتری، شماره تلفن، برند یا مدل گوشی..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pr-10"
              />
            </div>
            {searchQuery && (
              <p className="text-sm text-muted-foreground mt-2">
                {filteredSales.length} نتیجه یافت شد
              </p>
            )}
          </CardContent>
        </Card>

        <div className="space-y-4">
          {filteredSales.map((sale) => {
            const details = getSaleDetails(sale);
            return (
              <Card key={sale.id} className="relative overflow-hidden bg-card/80 backdrop-blur-sm hover:shadow-xl hover:scale-[1.01] transition-all duration-300 group">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <CardHeader className="relative z-10">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <CardTitle className="text-lg font-bold">
                        {details.customer?.name || "نامشخص"}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground/70 mt-1">
                        {details.phone ? `${details.phone.brand} ${details.phone.model}` : 'گوشی نامشخص'}
                      </p>
                      <p className="text-xs text-muted-foreground/60 mt-0.5">
                        قیمت اعلامی: {formatCurrency(sale.announcedPrice)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge 
                        variant={sale.status === 'active' ? 'default' : 'secondary'}
                        className={cn(
                          sale.status === 'active' && "bg-success/10 text-success border-success/20",
                          sale.status === 'completed' && "bg-primary/10 text-primary border-primary/20",
                          sale.status === 'defaulted' && "bg-destructive/10 text-destructive border-destructive/20"
                        )}
                      >
                        {sale.status === 'active' ? 'فعال' : 
                         sale.status === 'completed' ? 'تکمیل شده' : 'معوق'}
                      </Badge>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleShowInvoice(sale)}
                        className="text-primary hover:text-primary hover:bg-primary/10 hover:scale-110 transition-all duration-200"
                        title="مشاهده فاکتور"
                      >
                        <FileText className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteSale(sale.id)}
                        className="text-destructive hover:text-destructive hover:bg-destructive/10 hover:scale-110 transition-all duration-200"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="relative z-10">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="p-2 rounded-lg hover:bg-success/10 transition-colors duration-200">
                      <div className="text-xs text-muted-foreground/70 mb-1">سود اولیه</div>
                      <div className="font-bold text-success">{formatCurrency(sale.initialProfit)}</div>
                    </div>
                    <div className="p-2 rounded-lg hover:bg-accent/30 transition-colors duration-200">
                      <div className="text-xs text-muted-foreground/70 mb-1">پیش‌پرداخت</div>
                      <div className="font-bold text-foreground">{formatCurrency(sale.downPayment)}</div>
                    </div>
                    <div className="p-2 rounded-lg hover:bg-secondary/10 transition-colors duration-200">
                      <div className="text-xs text-muted-foreground/70 mb-1">سود ۴٪ دریافتی</div>
                      <div className="font-bold text-secondary">{formatCurrency(details.paidInterest)}</div>
                    </div>
                    <div className="p-2 rounded-lg hover:bg-warning/10 transition-colors duration-200">
                      <div className="text-xs text-muted-foreground/70 mb-1">مانده بدهی</div>
                      <div className="font-bold text-warning">
                        {formatCurrency(details.remainingDebt)}
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 pt-4 border-t border-border/50 flex justify-between items-center">
                    <div className="text-sm text-muted-foreground/70">
                      پرداخت شده: {toPersianDigits(details.paidCount)} از {toPersianDigits(details.totalCount)} قسط
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(sale)}
                        className="gap-2 hover:bg-secondary/10 hover:border-secondary/50 hover:scale-105 transition-all duration-200"
                      >
                        <Edit className="h-3 w-3" />
                        ویرایش
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setDetailsDialog({ open: true, saleId: sale.id })}
                        className="gap-2 hover:bg-primary/10 hover:border-primary/50 hover:scale-105 transition-all duration-200"
                      >
                        <Eye className="h-3 w-3" />
                        جزئیات
                      </Button>
                      <div className="text-xs text-muted-foreground/60">
                        {toJalaliDate(sale.saleDate)}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {filteredSales.length === 0 && sales.length > 0 && (
          <Card className="relative overflow-hidden bg-card/80 backdrop-blur-sm">
            <div className="absolute inset-0 bg-gradient-to-br from-warning/5 via-transparent to-warning/5" />
            <CardContent className="relative flex flex-col items-center justify-center py-12">
              <AlertCircle className="h-16 w-16 text-warning mb-4" />
              <h3 className="text-xl font-semibold mb-2">نتیجه‌ای یافت نشد</h3>
              <p className="text-muted-foreground text-center">
                با جستجوی "{searchQuery}"، فروشی پیدا نشد.
              </p>
            </CardContent>
          </Card>
        )}

        {sales.length === 0 && (
          <Card className="relative overflow-hidden bg-card/80 backdrop-blur-sm">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5" />
            <CardContent className="flex flex-col items-center justify-center py-12 relative z-10">
              <div className="relative mb-4">
                <div className="absolute inset-0 bg-primary/20 rounded-full blur-lg" />
                <ShoppingCart className="relative h-12 w-12 text-primary" />
              </div>
              <p className="text-muted-foreground/70 text-center leading-relaxed">
                هنوز فروشی ثبت نشده است
                <br />
                {customers.length === 0 && "ابتدا مشتری ثبت کنید"}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Dialog جزئیات فروش */}
        <Dialog open={detailsDialog.open} onOpenChange={(open) => setDetailsDialog({ ...detailsDialog, open })}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-primary via-secondary to-primary bg-clip-text text-transparent">
                جزئیات فروش
              </DialogTitle>
            </DialogHeader>
            {(() => {
              const sale = sales.find(s => s.id === detailsDialog.saleId);
              if (!sale) return null;
              
              const customer = customers.find(c => c.id === sale.customerId);
              const phone = phones.find(p => p.id === sale.phoneId);
              const saleInstallments = installments.filter(i => i.saleId === sale.id);
              
              const paidCount = saleInstallments.filter(i => i.status === 'paid').length;
              const pendingCount = saleInstallments.filter(i => i.status === 'pending').length;
              const overdueCount = saleInstallments.filter(i => i.status === 'overdue').length;
              const totalPaid = saleInstallments.filter(i => i.status === 'paid').reduce((sum, i) => sum + i.totalAmount, 0);
              const totalPending = saleInstallments.filter(i => i.status === 'pending' || i.status === 'overdue').reduce((sum, i) => sum + i.totalAmount, 0);
              const progressPercentage = saleInstallments.length > 0 ? (paidCount / saleInstallments.length) * 100 : 0;
              
              return (
                <div className="space-y-6">
                  {/* خلاصه آماری */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <Card className="relative overflow-hidden bg-gradient-to-br from-success/10 via-success/5 to-transparent border-success/20">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="text-xs text-muted-foreground mb-1">پرداخت شده</div>
                            <div className="text-lg font-bold text-success">{toPersianDigits(paidCount)}</div>
                          </div>
                          <CheckCircle2 className="h-8 w-8 text-success/40" />
                        </div>
                      </CardContent>
                    </Card>
                    <Card className="relative overflow-hidden bg-gradient-to-br from-warning/10 via-warning/5 to-transparent border-warning/20">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="text-xs text-muted-foreground mb-1">در انتظار</div>
                            <div className="text-lg font-bold text-warning">{toPersianDigits(pendingCount)}</div>
                          </div>
                          <Clock className="h-8 w-8 text-warning/40" />
                        </div>
                      </CardContent>
                    </Card>
                    <Card className="relative overflow-hidden bg-gradient-to-br from-destructive/10 via-destructive/5 to-transparent border-destructive/20">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="text-xs text-muted-foreground mb-1">معوق</div>
                            <div className="text-lg font-bold text-destructive">{toPersianDigits(overdueCount)}</div>
                          </div>
                          <AlertCircle className="h-8 w-8 text-destructive/40" />
                        </div>
                      </CardContent>
                    </Card>
                    <Card className="relative overflow-hidden bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border-primary/20">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="text-xs text-muted-foreground mb-1">پیشرفت</div>
                            <div className="text-lg font-bold text-primary">{toPersianDigits(Math.round(progressPercentage))}%</div>
                          </div>
                          <TrendingUp className="h-8 w-8 text-primary/40" />
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Progress Bar */}
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">پیشرفت پرداخت</span>
                        <span className="text-sm text-muted-foreground">
                          {toPersianDigits(paidCount)} از {toPersianDigits(saleInstallments.length)} قسط
                        </span>
                      </div>
                      <div className="w-full h-3 bg-muted rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-success via-success/80 to-success transition-all duration-500"
                          style={{ width: `${progressPercentage}%` }}
                        />
                      </div>
                    </CardContent>
                  </Card>

                  {/* اطلاعات اصلی */}
                  <div className="grid md:grid-cols-2 gap-4">
                    <Card className="relative overflow-hidden group">
                      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      <CardHeader className="relative z-10 pb-3">
                        <CardTitle className="flex items-center gap-2 text-base font-semibold">
                          <div className="relative">
                            <div className="absolute inset-0 bg-primary/20 rounded-lg blur-sm" />
                            <User className="relative h-4 w-4 text-primary" />
                          </div>
                          اطلاعات مشتری
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="relative z-10 space-y-3">
                        <div className="flex items-center justify-between p-3 rounded-lg border border-border/50 hover:bg-accent/30 transition-colors">
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm text-muted-foreground">نام مشتری</span>
                          </div>
                          <span className="font-semibold">{customer?.name || 'نامشخص'}</span>
                        </div>
                        {customer?.phone && (
                          <div className="flex items-center justify-between p-3 rounded-lg border border-border/50 hover:bg-accent/30 transition-colors">
                            <div className="flex items-center gap-2">
                              <CreditCard className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm text-muted-foreground">شماره تماس</span>
                            </div>
                            <span className="font-medium">{customer.phone}</span>
                          </div>
                        )}
                      </CardContent>
                    </Card>

                    <Card className="relative overflow-hidden group">
                      <div className="absolute inset-0 bg-gradient-to-br from-secondary/5 via-transparent to-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      <CardHeader className="relative z-10 pb-3">
                        <CardTitle className="flex items-center gap-2 text-base font-semibold">
                          <div className="relative">
                            <div className="absolute inset-0 bg-secondary/20 rounded-lg blur-sm" />
                            <Smartphone className="relative h-4 w-4 text-secondary" />
                          </div>
                          اطلاعات محصول
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="relative z-10 space-y-3">
                        <div className="flex items-center justify-between p-3 rounded-lg border border-border/50 hover:bg-accent/30 transition-colors">
                          <div className="flex items-center gap-2">
                            <Smartphone className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm text-muted-foreground">محصول</span>
                          </div>
                          <span className="font-semibold">
                            {phone ? `${phone.brand} ${phone.model}` : 'نامشخص'}
                          </span>
                        </div>
                        {phone?.imei && (
                          <div className="flex items-center justify-between p-3 rounded-lg border border-border/50 hover:bg-accent/30 transition-colors">
                            <div className="flex items-center gap-2">
                              <Hash className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm text-muted-foreground">IMEI</span>
                            </div>
                            <span className="font-mono text-xs">{phone.imei}</span>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </div>

                  {/* اطلاعات مالی */}
                  <Card className="relative overflow-hidden group">
                    <div className="absolute inset-0 bg-gradient-to-br from-success/5 via-transparent to-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    <CardHeader className="relative z-10 pb-3">
                      <CardTitle className="flex items-center gap-2 text-base font-semibold">
                        <div className="relative">
                          <div className="absolute inset-0 bg-success/20 rounded-lg blur-sm" />
                          <DollarSign className="relative h-4 w-4 text-success" />
                        </div>
                        اطلاعات مالی
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="relative z-10">
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        <div className="p-3 rounded-lg border border-border/50 hover:bg-accent/30 transition-colors">
                          <div className="text-xs text-muted-foreground mb-1">قیمت خرید</div>
                          <div className="font-semibold">{formatCurrency(sale.purchasePrice)}</div>
                        </div>
                        <div className="p-3 rounded-lg border border-border/50 hover:bg-accent/30 transition-colors">
                          <div className="text-xs text-muted-foreground mb-1">قیمت اعلامی</div>
                          <div className="font-semibold text-primary">{formatCurrency(sale.announcedPrice)}</div>
                        </div>
                        <div className="p-3 rounded-lg border border-border/50 hover:bg-accent/30 transition-colors">
                          <div className="text-xs text-muted-foreground mb-1">سود اولیه</div>
                          <div className="font-semibold text-success">{formatCurrency(sale.initialProfit)}</div>
                        </div>
                        <div className="p-3 rounded-lg border border-border/50 hover:bg-accent/30 transition-colors">
                          <div className="text-xs text-muted-foreground mb-1">پیش‌پرداخت</div>
                          <div className="font-semibold">{formatCurrency(sale.downPayment)}</div>
                        </div>
                        <div className="p-3 rounded-lg border border-border/50 hover:bg-accent/30 transition-colors">
                          <div className="text-xs text-muted-foreground mb-1">پرداخت شده</div>
                          <div className="font-semibold text-success">{formatCurrency(totalPaid)}</div>
                        </div>
                        <div className="p-3 rounded-lg border border-border/50 hover:bg-accent/30 transition-colors">
                          <div className="text-xs text-muted-foreground mb-1">باقیمانده</div>
                          <div className="font-semibold text-warning">{formatCurrency(totalPending)}</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* جدول اقساط */}
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center gap-2 text-base font-semibold">
                        <FileText className="h-4 w-4 text-primary" />
                        جدول اقساط
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {saleInstallments.map((inst, index) => {
                          const StatusIcon = inst.status === 'paid' ? CheckCircle2 : inst.status === 'overdue' ? AlertCircle : Clock;
                          
                          return (
                            <div 
                              key={inst.id} 
                              className={cn(
                                "group relative overflow-hidden rounded-xl border backdrop-blur-sm transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5",
                                inst.status === 'paid' && "bg-gradient-to-br from-success/5 via-success/3 to-transparent border-success/20 hover:border-success/40",
                                inst.status === 'overdue' && "bg-gradient-to-br from-destructive/5 via-destructive/3 to-transparent border-destructive/20 hover:border-destructive/40",
                                inst.status === 'pending' && "bg-gradient-to-br from-warning/5 via-warning/3 to-transparent border-warning/20 hover:border-warning/40"
                              )}
                              style={{ animationDelay: `${index * 50}ms` }}
                            >
                              {/* Gradient overlay on hover */}
                              <div className={cn(
                                "absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300",
                                inst.status === 'paid' && "bg-gradient-to-r from-success/5 to-transparent",
                                inst.status === 'overdue' && "bg-gradient-to-r from-destructive/5 to-transparent",
                                inst.status === 'pending' && "bg-gradient-to-r from-warning/5 to-transparent"
                              )} />
                              
                              <div className="relative flex items-center justify-between p-5">
                                <div className="flex items-center gap-4 flex-1">
                                  {/* Status Icon with glassmorphism */}
                                  <div className={cn(
                                    "relative p-3 rounded-xl backdrop-blur-md shadow-sm transition-all duration-300 group-hover:scale-110",
                                    inst.status === 'paid' && "bg-success/10 shadow-success/20",
                                    inst.status === 'overdue' && "bg-destructive/10 shadow-destructive/20",
                                    inst.status === 'pending' && "bg-warning/10 shadow-warning/20"
                                  )}>
                                    <StatusIcon className={cn(
                                      "h-5 w-5 transition-transform duration-300 group-hover:rotate-12",
                                      inst.status === 'paid' && "text-success",
                                      inst.status === 'overdue' && "text-destructive",
                                      inst.status === 'pending' && "text-warning"
                                    )} />
                                  </div>
                                  
                                  <div className="flex-1 space-y-2">
                                    <div className="flex items-center gap-3">
                                      <span className="text-lg font-bold bg-gradient-to-l from-foreground to-foreground/70 bg-clip-text">
                                        قسط {toPersianDigits(inst.installmentNumber)}
                                      </span>
                                      <Badge 
                                        variant="outline"
                                        className={cn(
                                          "text-xs font-semibold px-3 py-1 rounded-full backdrop-blur-sm transition-all duration-300",
                                          inst.status === 'paid' && "bg-success/15 text-success border-success/30 shadow-success/10",
                                          inst.status === 'overdue' && "bg-destructive/15 text-destructive border-destructive/30 shadow-destructive/10",
                                          inst.status === 'pending' && "bg-warning/15 text-warning border-warning/30 shadow-warning/10"
                                        )}
                                      >
                                        {inst.status === 'paid' ? '✓ پرداخت شده' : inst.status === 'overdue' ? '⚠ معوق' : '⏱ در انتظار'}
                                      </Badge>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                      <Calendar className="h-3.5 w-3.5" />
                                      <span>سررسید: {toJalaliDate(inst.dueDate)}</span>
                                    </div>
                                  </div>
                                </div>
                                
                                {/* Amount section with modern card */}
                                <div className="text-left">
                                  <div className="bg-gradient-to-br from-primary/5 to-primary/10 backdrop-blur-sm rounded-xl p-4 border border-primary/10 shadow-sm min-w-[180px]">
                                    <div className="flex items-baseline justify-between mb-3">
                                      <span className="text-xs font-medium text-muted-foreground">مبلغ قسط</span>
                                      <span className="text-2xl font-bold bg-gradient-to-l from-primary to-primary/70 bg-clip-text text-transparent">
                                        {formatCurrency(inst.totalAmount)}
                                      </span>
                                    </div>
                                    <div className="flex items-center justify-between gap-4 pt-3 border-t border-primary/10">
                                      <div className="flex items-center gap-1.5">
                                        <div className="w-1.5 h-1.5 rounded-full bg-foreground/40" />
                                        <span className="text-xs text-muted-foreground">اصل:</span>
                                        <span className="text-xs font-semibold">{formatCurrency(inst.principalAmount)}</span>
                                      </div>
                                      <div className="flex items-center gap-1.5">
                                        <div className="w-1.5 h-1.5 rounded-full bg-secondary" />
                                        <span className="text-xs text-muted-foreground">سود:</span>
                                        <span className="text-xs font-semibold text-secondary">{formatCurrency(inst.interestAmount)}</span>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              );
            })()}
          </DialogContent>
        </Dialog>

        {/* Invoice Dialog */}
        {invoiceDialog.sale && invoiceDialog.customer && invoiceDialog.phone && (
          <InvoiceDialog
            open={invoiceDialog.open}
            onOpenChange={(open) => setInvoiceDialog({ ...invoiceDialog, open })}
            sale={invoiceDialog.sale}
            customer={invoiceDialog.customer}
            phone={invoiceDialog.phone}
            installments={invoiceDialog.installments}
          />
        )}

        {/* AlertDialog حذف فروش */}
        <AlertDialog open={deleteDialog.open} onOpenChange={(open) => setDeleteDialog({ ...deleteDialog, open })}>
          <AlertDialogContent className="max-w-lg p-0 gap-0 overflow-hidden border-destructive/20">
            {/* Header با gradient */}
            <div className="relative bg-gradient-to-br from-destructive via-destructive/90 to-destructive/80 p-6">
              <div className="absolute inset-0 bg-black/10" />
              <div className="relative z-10 flex flex-col items-center text-center space-y-4">
                <div className="relative">
                  <div className="absolute inset-0 bg-white/20 rounded-full blur-xl animate-pulse" />
                  <div className="relative p-4 rounded-full bg-white/10 backdrop-blur-sm border-2 border-white/20">
                    <Trash2 className="h-10 w-10 text-white" />
                  </div>
                </div>
                <AlertDialogTitle className="text-2xl font-bold text-white">
                  حذف فروش
                </AlertDialogTitle>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 space-y-4 bg-background">
              <AlertDialogDescription className="text-right space-y-4">
                <div className="p-4 rounded-lg bg-muted/50 border border-border/50">
                  <p className="text-base font-semibold text-foreground mb-2">
                    فروش مورد نظر:
                  </p>
                  <p className="text-lg font-bold text-primary bg-primary/10 px-3 py-2 rounded-md inline-block">
                    {deleteDialog.saleInfo}
                  </p>
                </div>
                
                <div className="p-4 rounded-lg bg-warning/10 border border-warning/30">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-full bg-warning/20 flex-shrink-0">
                      <AlertCircle className="h-5 w-5 text-warning" />
                    </div>
                    <div className="flex-1 space-y-2">
                      <p className="text-sm font-semibold text-warning">
                        هشدار مهم
                      </p>
                      <p className="text-sm text-foreground leading-relaxed">
                        با حذف این فروش، تمام موارد زیر نیز حذف خواهند شد:
                      </p>
                      <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside mr-4">
                        <li>تمام اقساط مرتبط</li>
                        <li>اطلاعات پرداخت‌ها</li>
                        <li>تاریخچه تراکنش‌ها</li>
                      </ul>
                      <p className="text-sm font-semibold text-destructive mt-2">
                        این عمل غیرقابل بازگشت است!
                      </p>
                    </div>
                  </div>
                </div>

                <p className="text-center text-sm text-muted-foreground pt-2">
                  آیا از حذف این فروش اطمینان دارید؟
                </p>
              </AlertDialogDescription>
            </div>

            {/* Footer */}
            <AlertDialogFooter className="p-6 pt-0 gap-3 bg-background">
              <AlertDialogCancel className="flex-1 h-11 text-base font-semibold border-2 hover:bg-accent hover:border-accent-foreground/20 transition-all duration-200">
                انصراف
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={confirmDeleteSale}
                className="flex-1 h-11 text-base font-semibold bg-gradient-to-r from-destructive to-destructive/80 hover:from-destructive/90 hover:to-destructive/70 text-white shadow-lg hover:shadow-xl transition-all duration-200"
              >
                <Trash2 className="h-4 w-4 ml-2" />
                حذف فروش
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </Layout>
  );
};

export default Sales;
