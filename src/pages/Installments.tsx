import { useState, useEffect } from "react";
import Layout from "@/components/Layout";
import { useDataContext } from "@/contexts/DataContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  installmentsStore,
  Installment,
  salesStore,
  customersStore,
  partnersStore,
  phonesStore,
  Sale,
  Customer,
  Phone,
} from "@/lib/storeProvider";
import { formatCurrency, toJalaliDate, toPersianDigits } from "@/lib/persian";
import { addCapitalFromPayment, addMonthlyProfitToPartners } from "@/lib/profitCalculator";
import { DollarSign, CheckCircle, Clock, AlertCircle, Trash2, Search, Filter, FileText, CreditCard } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

const Installments = () => {
  const [installments, setInstallments] = useState<Installment[]>([]);
  const [filteredInstallments, setFilteredInstallments] = useState<Installment[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [phones, setPhones] = useState<Phone[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedSaleId, setSelectedSaleId] = useState<string>("");
  const [saleDetailsDialog, setSaleDetailsDialog] = useState<{ open: boolean; saleId: string }>({ open: false, saleId: '' });
  const [bulkPaymentDialog, setBulkPaymentDialog] = useState<{ open: boolean; saleId: string }>({ open: false, saleId: '' });
  const [cancelPaymentDialog, setCancelPaymentDialog] = useState<{ open: boolean; installmentId: string; installmentInfo: string }>({ open: false, installmentId: '', installmentInfo: '' });
  const [bulkPaymentConfirmDialog, setBulkPaymentConfirmDialog] = useState<{ open: boolean; saleId: string; installmentsCount: number; totalAmount: number; totalPrincipal: number; totalInterest: number }>({ open: false, saleId: '', installmentsCount: 0, totalAmount: 0, totalPrincipal: 0, totalInterest: 0 });
  const [selectedInstallments, setSelectedInstallments] = useState<Set<string>>(new Set());
  const { toast } = useToast();
  const { refreshPartners, refreshDashboard } = useDataContext();

  const loadInstallments = async () => {
    try {
      const [installmentsData, salesData, customersData, phonesData] = await Promise.all([
        installmentsStore.getAll(),
        salesStore.getAll(),
        customersStore.getAll(),
        phonesStore.getAll(),
      ]);
      
      // بروزرسانی وضعیت اقساط معوق
      const today = new Date();
      for (const inst of installmentsData) {
        if (inst.status === 'pending' && new Date(inst.dueDate) < today) {
          await installmentsStore.update(inst.id, { status: 'overdue' });
        }
      }

      // دوباره بارگذاری بعد از بروزرسانی
      const updatedInstallments = await installmentsStore.getAll();
      
      // مرتب‌سازی بر اساس تاریخ سررسید
      const sorted = updatedInstallments.sort((a, b) => 
        new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
      );
      
      setInstallments(sorted);
      setSales(salesData);
      setCustomers(customersData);
      setPhones(phonesData);
    } catch (error) {
      console.error('Error loading installments:', error);
      toast({
        title: "خطا",
        description: "خطا در بارگذاری اقساط",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    loadInstallments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Listen for refresh events
  useEffect(() => {
    const handleRefreshInstallments = () => {
      loadInstallments();
    };

    window.addEventListener('refreshInstallments', handleRefreshInstallments);
    
    return () => {
      window.removeEventListener('refreshInstallments', handleRefreshInstallments);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    applyFilters();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [installments, searchQuery, statusFilter, selectedSaleId]);

  const applyFilters = () => {
    let filtered = [...installments];

    // فیلتر وضعیت
    if (statusFilter !== 'all') {
      filtered = filtered.filter(i => i.status === statusFilter);
    }

    // فیلتر فروش خاص
    if (selectedSaleId) {
      filtered = filtered.filter(i => i.saleId === selectedSaleId);
    }

    // جستجو در نام مشتری
    if (searchQuery) {
      filtered = filtered.filter(i => {
        const sale = sales.find(s => s.id === i.saleId);
        if (!sale) return false;
        const customer = customers.find(c => c.id === sale.customerId);
        return customer?.name.toLowerCase().includes(searchQuery.toLowerCase());
      });
    }

    setFilteredInstallments(filtered);
  };

  const handlePayment = async (installmentId: string) => {
    const installment = installments.find(i => i.id === installmentId);
    if (!installment) return;

    try {
      // ثبت پرداخت
      await installmentsStore.update(installmentId, {
        status: 'paid',
        paidDate: new Date().toISOString(),
      });

      // بازگشت اصل بدهی به سرمایه با تاریخ قسط
      const installmentDate = new Date(installment.dueDate);
      await addCapitalFromPayment(installment.principalAmount, installmentDate);

      // افزودن سود ماهانه به حساب شرکا با تاریخ قسط
      await addMonthlyProfitToPartners(installment.interestAmount, installmentDate);

      // پرداخت سود به سرمایه‌گذاران (۴٪ از سود ماهانه)
      const { payInvestorsProfit } = await import('@/lib/profitCalculator');
      await payInvestorsProfit(installment.interestAmount);

      // بررسی اینکه آیا همه اقساط پرداخت شده‌اند
      const saleInstallments = installments.filter(i => i.saleId === installment.saleId);
      const allPaid = saleInstallments.every(i => i.id === installmentId || i.status === 'paid');
      
      if (allPaid) {
        await salesStore.update(installment.saleId, { status: 'completed' });
        toast({
          title: "تبریک!",
          description: `تمام اقساط پرداخت شد. اصل: ${formatCurrency(installment.principalAmount)} به سرمایه بازگشت. سود: ${formatCurrency(installment.interestAmount)}`,
        });
      } else {
        toast({
          title: "موفق",
          description: `قسط پرداخت شد. اصل: ${formatCurrency(installment.principalAmount)} به سرمایه بازگشت. سود: ${formatCurrency(installment.interestAmount)}`,
        });
      }

      await loadInstallments();
      
      // Refresh partners and dashboard because capital and profit were updated
      refreshPartners();
      refreshDashboard();
    } catch (error) {
      console.error('Error processing payment:', error);
      toast({
        title: "خطا",
        description: "خطا در ثبت پرداخت",
        variant: "destructive",
      });
    }
  };

  const handleCancelPayment = (installmentId: string) => {
    const installment = installments.find(i => i.id === installmentId);
    if (!installment || installment.status !== 'paid') return;

    const sale = sales.find(s => s.id === installment.saleId);
    const customer = customers.find(c => c.id === sale?.customerId);
    const installmentInfo = `قسط ${toPersianDigits(installment.installmentNumber)} - ${customer?.name || 'نامشخص'}`;
    setCancelPaymentDialog({ open: true, installmentId, installmentInfo });
  };

  const confirmCancelPayment = async () => {
    try {
      const installment = installments.find(i => i.id === cancelPaymentDialog.installmentId);
      if (!installment) return;

      // لغو پرداخت
      await installmentsStore.update(cancelPaymentDialog.installmentId, {
        status: 'pending',
        paidDate: undefined,
      });

      // کسر اصل از سرمایه (برعکس عملیات پرداخت)
      const partners = await partnersStore.getAll();
      const totalCapital = partners.reduce((sum, p) => sum + p.capital, 0);
      for (const partner of partners) {
        const share = totalCapital > 0 ? partner.capital / totalCapital : 0;
        const deduction = Math.round(installment.principalAmount * share);
        await partnersStore.update(partner.id, {
          availableCapital: partner.availableCapital - deduction,
        });
      }

      // کسر سود ماهانه از حساب شرکا
      for (const partner of partners) {
        const share = totalCapital > 0 ? partner.capital / totalCapital : 0;
        const profitDeduction = Math.round(installment.interestAmount * share);
        await partnersStore.update(partner.id, {
          monthlyProfit: partner.monthlyProfit - profitDeduction,
        });
      }

      // بروزرسانی وضعیت فروش
      await salesStore.update(installment.saleId, { status: 'active' });

      toast({
        title: "لغو شد",
        description: "پرداخت قسط لغو شد و تغییرات برگشت داده شد",
      });

      await loadInstallments();
      
      // Refresh partners and dashboard because payment was cancelled
      refreshPartners();
      refreshDashboard();
    } catch (error) {
      console.error('Error canceling payment:', error);
      toast({
        title: "خطا",
        description: "خطا در لغو پرداخت",
        variant: "destructive",
      });
    }
  };

  const handleBulkPayment = () => {
    if (selectedInstallments.size === 0) {
      toast({
        title: "خطا",
        description: "لطفاً حداقل یک قسط انتخاب کنید",
        variant: "destructive",
      });
      return;
    }

    const installmentsToPayArray = Array.from(selectedInstallments)
      .map(id => installments.find(i => i.id === id))
      .filter(i => i && i.status !== 'paid') as Installment[];

    if (installmentsToPayArray.length === 0) {
      toast({
        title: "خطا",
        description: "همه اقساط انتخاب شده قبلاً پرداخت شده‌اند",
        variant: "destructive",
      });
      return;
    }

    const totalAmount = installmentsToPayArray.reduce((sum, i) => sum + i.totalAmount, 0);
    const totalPrincipal = installmentsToPayArray.reduce((sum, i) => sum + i.principalAmount, 0);
    const totalInterest = installmentsToPayArray.reduce((sum, i) => sum + i.interestAmount, 0);

    setBulkPaymentConfirmDialog({
      open: true,
      saleId: bulkPaymentDialog.saleId,
      installmentsCount: installmentsToPayArray.length,
      totalAmount,
      totalPrincipal,
      totalInterest,
    });
  };

  const confirmBulkPayment = async () => {
    const installmentsToPayArray = Array.from(selectedInstallments)
      .map(id => installments.find(i => i.id === id))
      .filter(i => i && i.status !== 'paid') as Installment[];

    installmentsToPayArray.forEach(installment => {
      handlePayment(installment.id);
    });

    setSelectedInstallments(new Set());
    setBulkPaymentDialog({ open: false, saleId: '' });
    setBulkPaymentConfirmDialog({ open: false, saleId: '', installmentsCount: 0, totalAmount: 0, totalPrincipal: 0, totalInterest: 0 });

    toast({
      title: "موفق",
      description: `${toPersianDigits(installmentsToPayArray.length)} قسط با موفقیت پرداخت شد`,
    });
  };

  const toggleInstallmentSelection = (installmentId: string) => {
    const newSelection = new Set(selectedInstallments);
    if (newSelection.has(installmentId)) {
      newSelection.delete(installmentId);
    } else {
      newSelection.add(installmentId);
    }
    setSelectedInstallments(newSelection);
  };

  const getInstallmentDetails = (installment: Installment) => {
    const sale = sales.find(s => s.id === installment.saleId);
    if (!sale) return null;

    const customer = customers.find(c => c.id === sale.customerId);
    const saleInstallments = installments.filter(i => i.saleId === sale.id);

    return {
      customer,
      announcedPrice: sale.announcedPrice,
      installmentNumber: installment.installmentNumber,
      totalInstallments: saleInstallments.length,
    };
  };

  const pendingInstallments = installments.filter(i => i.status === 'pending');
  const overdueInstallments = installments.filter(i => i.status === 'overdue');
  const paidInstallments = installments.filter(i => i.status === 'paid');

  const totalPending = pendingInstallments.reduce((sum, i) => sum + i.totalAmount, 0);
  const totalOverdue = overdueInstallments.reduce((sum, i) => sum + i.totalAmount, 0);
  const totalPaid = paidInstallments.reduce((sum, i) => sum + i.totalAmount, 0);

  // گروه‌بندی اقساط بر اساس فروش
  const groupedBySale = filteredInstallments.reduce((acc, inst) => {
    if (!acc[inst.saleId]) {
      acc[inst.saleId] = [];
    }
    acc[inst.saleId].push(inst);
    return acc;
  }, {} as Record<string, Installment[]>);

  const uniqueSales = sales.filter(sale => 
    installments.some(i => i.saleId === sale.id)
  );

  return (
    <Layout>
      <div className="space-y-6 animate-fade-scale">
        <div className="flex flex-col sm:flex-row justify-between items-start gap-4 pb-2">
          <div className="space-y-1">
            <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-primary via-secondary to-primary bg-clip-text text-transparent bg-[length:200%_auto] animate-gradient">
              مدیریت اقساط
            </h1>
            <p className="text-muted-foreground/80 text-sm md:text-base">
              پیگیری و ثبت پرداخت اقساط مشتریان (سود ۴٪ ماهانه)
            </p>
          </div>
        </div>

        {/* فیلترها و جستجو */}
        <Card className="relative overflow-hidden bg-card/80 backdrop-blur-sm hover:shadow-lg transition-shadow duration-300">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5" />
          <CardHeader className="relative z-10 pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <div className="h-1.5 w-1.5 rounded-full bg-gradient-to-r from-primary to-secondary" />
              فیلترها و جستجو
            </CardTitle>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
              <div className="space-y-2">
                <Label htmlFor="search" className="flex items-center gap-2 text-sm font-semibold">
                  <div className="p-1.5 rounded-md bg-primary/10">
                    <Search className="h-3.5 w-3.5 text-primary" />
                  </div>
                  جستجوی مشتری
                </Label>
                <Input
                  id="search"
                  placeholder="نام مشتری را وارد کنید..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-10 transition-all duration-200 focus:ring-2 focus:ring-primary/20"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="status" className="flex items-center gap-2 text-sm font-semibold">
                  <div className="p-1.5 rounded-md bg-secondary/10">
                    <Filter className="h-3.5 w-3.5 text-secondary" />
                  </div>
                  وضعیت قسط
                </Label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger id="status" className="h-10">
                    <SelectValue placeholder="انتخاب وضعیت" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">همه وضعیت‌ها</SelectItem>
                    <SelectItem value="pending">در انتظار پرداخت</SelectItem>
                    <SelectItem value="overdue">معوق</SelectItem>
                    <SelectItem value="paid">پرداخت شده</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="sale" className="flex items-center gap-2 text-sm font-semibold">
                  <div className="p-1.5 rounded-md bg-secondary/10">
                    <FileText className="h-3.5 w-3.5 text-secondary" />
                  </div>
                  فروش خاص
                </Label>
                <Select value={selectedSaleId || "all_sales"} onValueChange={(value) => setSelectedSaleId(value === "all_sales" ? "" : value)}>
                  <SelectTrigger id="sale" className="h-10">
                    <SelectValue placeholder="همه فروش‌ها" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all_sales">همه فروش‌ها</SelectItem>
                    {uniqueSales.map(sale => {
                      const customer = customers.find(c => c.id === sale.customerId);
                      return (
                        <SelectItem key={sale.id} value={sale.id}>
                          {customer?.name} - {formatCurrency(sale.announcedPrice)}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end">
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearchQuery("");
                    setStatusFilter("all");
                    setSelectedSaleId("");
                  }}
                  className="w-full h-10 gap-2 hover:bg-destructive/10 hover:text-destructive hover:border-destructive/50 hover:scale-105 transition-all duration-200"
                >
                  <Filter className="h-4 w-4 rotate-180" />
                  پاک کردن فیلترها
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Dialog جزئیات فروش */}
        <Dialog open={saleDetailsDialog.open} onOpenChange={(open) => setSaleDetailsDialog({ ...saleDetailsDialog, open })}>
          <DialogContent className="max-w-xl max-h-[85vh] overflow-hidden flex flex-col">
            <DialogHeader>
              <DialogTitle>جزئیات فروش و اقساط</DialogTitle>
            </DialogHeader>
            {(() => {
              const sale = sales.find(s => s.id === saleDetailsDialog.saleId);
              if (!sale) return null;

              const customer = customers.find(c => c.id === sale.customerId);
              const phone = phones.find(p => p.id === sale.phoneId);
              const saleInstallments = installments.filter(i => i.saleId === sale.id).sort((a, b) => a.installmentNumber - b.installmentNumber);
              const paidCount = saleInstallments.filter(i => i.status === 'paid').length;

              return (
                <div className="space-y-4 overflow-y-auto pl-2">
                  <div className="grid grid-cols-2 gap-3 p-4 bg-gradient-to-br from-muted/50 to-muted/30 rounded-xl border border-border/50">
                    <div className="p-2 rounded-lg hover:bg-accent/30 transition-colors duration-200">
                      <div className="text-xs text-muted-foreground/70 mb-1">مشتری</div>
                      <div className="font-bold text-base">{customer?.name}</div>
                    </div>
                    <div className="p-2 rounded-lg hover:bg-accent/30 transition-colors duration-200">
                      <div className="text-xs text-muted-foreground/70 mb-1">گوشی</div>
                      <div className="font-bold text-base">{phone?.brand} {phone?.model}</div>
                    </div>
                    <div className="p-2 rounded-lg hover:bg-primary/10 transition-colors duration-200">
                      <div className="text-xs text-muted-foreground/70 mb-1">قیمت اعلامی</div>
                      <div className="font-bold text-base text-primary">{formatCurrency(sale.announcedPrice)}</div>
                    </div>
                    <div className="p-2 rounded-lg hover:bg-accent/30 transition-colors duration-200">
                      <div className="text-xs text-muted-foreground/70 mb-1">پیش‌پرداخت</div>
                      <div className="font-bold text-base">{formatCurrency(sale.downPayment)}</div>
                    </div>
                    <div className="p-2 rounded-lg hover:bg-secondary/10 transition-colors duration-200">
                      <div className="text-xs text-muted-foreground/70 mb-1">تعداد اقساط</div>
                      <div className="font-bold text-base text-secondary">{toPersianDigits(sale.installmentMonths)} ماه</div>
                    </div>
                    <div className="p-2 rounded-lg hover:bg-success/10 transition-colors duration-200">
                      <div className="text-xs text-muted-foreground/70 mb-1">پیشرفت</div>
                      <div className="font-bold text-base text-success">
                        {toPersianDigits(paidCount)} از {toPersianDigits(saleInstallments.length)} قسط
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex justify-between items-center pb-2 border-b border-border/50">
                      <h3 className="font-bold text-base flex items-center gap-2">
                        <div className="h-1.5 w-1.5 rounded-full bg-gradient-to-r from-primary to-secondary" />
                        لیست اقساط
                      </h3>
                      <Button
                        size="sm"
                        onClick={() => {
                          setBulkPaymentDialog({ open: true, saleId: sale.id });
                          setSaleDetailsDialog({ open: false, saleId: '' });
                        }}
                        className="gap-2 hover:scale-105 transition-all duration-200"
                      >
                        <CreditCard className="h-3.5 w-3.5" />
                        پرداخت چند قسط
                      </Button>
                    </div>
                    <div className="space-y-2 max-h-[40vh] overflow-y-auto pl-1">
                      {saleInstallments.map((inst, index) => (
                        <div 
                          key={inst.id} 
                          className="p-3 border border-border/50 rounded-lg hover:bg-accent/30 hover:border-primary/30 transition-all duration-200 hover:scale-[1.01] animate-slide-in"
                          style={{ animationDelay: `${index * 30}ms` }}
                        >
                          <div className="flex justify-between items-center gap-2">
                            <div className="flex-1 min-w-0">
                              <div className="font-bold text-sm">
                                قسط {toPersianDigits(inst.installmentNumber)}
                              </div>
                              <div className="text-xs text-muted-foreground/70 truncate mt-0.5">
                                {toJalaliDate(inst.dueDate)}
                              </div>
                            </div>
                            <div className="text-left">
                              <div className="font-bold text-sm text-primary">{formatCurrency(inst.totalAmount)}</div>
                              <Badge 
                                variant={inst.status === 'paid' ? 'default' : inst.status === 'overdue' ? 'destructive' : 'secondary'}
                                className={cn(
                                  "text-xs mt-1",
                                  inst.status === 'paid' && "bg-success/10 text-success border-success/20",
                                  inst.status === 'overdue' && "bg-destructive/10 text-destructive border-destructive/20",
                                  inst.status === 'pending' && "bg-warning/10 text-warning border-warning/20"
                                )}
                              >
                                {inst.status === 'paid' ? 'پرداخت' : inst.status === 'overdue' ? 'معوق' : 'انتظار'}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })()}
          </DialogContent>
        </Dialog>

        {/* Dialog پرداخت چند قسط */}
        <Dialog open={bulkPaymentDialog.open} onOpenChange={(open) => setBulkPaymentDialog({ ...bulkPaymentDialog, open })}>
          <DialogContent className="max-w-lg max-h-[85vh] overflow-hidden flex flex-col">
            <DialogHeader>
              <DialogTitle>پرداخت چند قسط یکجا</DialogTitle>
            </DialogHeader>
            {(() => {
              const sale = sales.find(s => s.id === bulkPaymentDialog.saleId);
              if (!sale) return null;

              const customer = customers.find(c => c.id === sale.customerId);
              const saleInstallments = installments
                .filter(i => i.saleId === sale.id && i.status !== 'paid')
                .sort((a, b) => a.installmentNumber - b.installmentNumber);

              const selectedArray = Array.from(selectedInstallments)
                .map(id => saleInstallments.find(i => i.id === id))
                .filter(Boolean) as Installment[];

              const totalSelected = selectedArray.reduce((sum, i) => sum + i.totalAmount, 0);

              return (
                <div className="space-y-4 overflow-y-auto pl-2">
                  <div className="p-4 bg-gradient-to-br from-primary/10 via-primary/5 to-secondary/10 rounded-xl border border-primary/20">
                    <div className="font-bold text-base mb-1">{customer?.name}</div>
                    <div className="text-sm text-muted-foreground/70">
                      {toPersianDigits(saleInstallments.length)} قسط باقی‌مانده
                    </div>
                  </div>

                  <div className="space-y-2 max-h-[45vh] overflow-y-auto pl-1">
                    {saleInstallments.map((inst, index) => (
                      <div
                        key={inst.id}
                        className={cn(
                          "p-3 border border-border/50 rounded-lg cursor-pointer transition-all duration-200 hover:scale-[1.01] animate-slide-in",
                          selectedInstallments.has(inst.id) 
                            ? 'bg-primary/10 border-primary/50 shadow-sm' 
                            : 'hover:bg-accent/30 hover:border-primary/30'
                        )}
                        onClick={() => toggleInstallmentSelection(inst.id)}
                        style={{ animationDelay: `${index * 30}ms` }}
                      >
                        <div className="flex justify-between items-center gap-3">
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <input
                              type="checkbox"
                              checked={selectedInstallments.has(inst.id)}
                              onChange={() => toggleInstallmentSelection(inst.id)}
                              className="h-4 w-4 rounded border-2 border-primary/30 checked:bg-primary checked:border-primary cursor-pointer transition-all duration-200"
                              onClick={(e) => e.stopPropagation()}
                            />
                            <div className="flex-1 min-w-0">
                              <div className="font-bold text-sm mb-0.5">
                                قسط {toPersianDigits(inst.installmentNumber)}
                              </div>
                              <div className="text-xs text-muted-foreground/70 truncate">
                                سررسید: {toJalaliDate(inst.dueDate)}
                              </div>
                            </div>
                          </div>
                          <div className="text-left space-y-0.5 min-w-[120px]">
                            <div className="font-bold text-base text-primary">{formatCurrency(inst.totalAmount)}</div>
                            <div className="text-xs text-muted-foreground/70 whitespace-nowrap">
                              اصل: <span className="font-medium">{formatCurrency(inst.principalAmount)}</span>
                            </div>
                            <div className="text-xs text-secondary whitespace-nowrap">
                              سود: <span className="font-medium">{formatCurrency(inst.interestAmount)}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {selectedArray.length > 0 && (
                    <div className="p-4 bg-gradient-to-br from-primary/10 via-primary/5 to-secondary/10 rounded-xl border border-primary/20">
                      <div className="flex justify-between items-center mb-2 text-sm">
                        <span className="font-semibold text-muted-foreground/70">تعداد انتخاب شده:</span>
                        <span className="font-bold text-primary">{toPersianDigits(selectedArray.length)} قسط</span>
                      </div>
                      <div className="flex justify-between items-center pt-2 border-t border-primary/20">
                        <span className="font-bold text-base">مجموع مبلغ:</span>
                        <span className="text-lg font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                          {formatCurrency(totalSelected)}
                        </span>
                      </div>
                    </div>
                  )}

                  <div className="flex gap-2 pt-2">
                    <Button
                      variant="outline"
                      onClick={() => {
                        const allIds = new Set(saleInstallments.map(i => i.id));
                        setSelectedInstallments(allIds);
                      }}
                      className="flex-1 gap-2 hover:bg-primary/10 hover:border-primary/50 hover:scale-105 transition-all duration-200"
                    >
                      انتخاب همه
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setSelectedInstallments(new Set())}
                      className="flex-1 gap-2 hover:bg-destructive/10 hover:border-destructive/50 hover:scale-105 transition-all duration-200"
                    >
                      پاک کردن
                    </Button>
                    <Button
                      onClick={handleBulkPayment}
                      disabled={selectedInstallments.size === 0}
                      className="flex-1 gap-2 hover:scale-105 transition-all duration-200 disabled:opacity-50"
                    >
                      <DollarSign className="h-4 w-4" />
                      پرداخت
                    </Button>
                  </div>
                </div>
              );
            })()}
          </DialogContent>
        </Dialog>

        <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          <Card className="relative overflow-hidden bg-card/80 backdrop-blur-sm hover:shadow-xl hover:scale-[1.02] transition-all duration-300 group">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <CardHeader className="relative z-10">
              <CardTitle className="flex items-center gap-2 text-base">
                <div className="relative">
                  <div className="absolute inset-0 bg-primary/20 rounded-lg blur-sm opacity-0 group-hover:opacity-100 transition-opacity" />
                  <Clock className="relative h-5 w-5 text-primary" />
                </div>
                در انتظار پرداخت
              </CardTitle>
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
                {formatCurrency(totalPending)}
              </div>
              <p className="text-sm text-muted-foreground/70 mt-2">
                {toPersianDigits(pendingInstallments.length)} قسط
              </p>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden bg-card/80 backdrop-blur-sm hover:shadow-xl hover:scale-[1.02] transition-all duration-300 group">
            <div className="absolute inset-0 bg-gradient-to-br from-warning/5 via-transparent to-warning/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <CardHeader className="relative z-10">
              <CardTitle className="flex items-center gap-2 text-base">
                <div className="relative">
                  <div className="absolute inset-0 bg-warning/20 rounded-lg blur-sm opacity-0 group-hover:opacity-100 transition-opacity" />
                  <AlertCircle className="relative h-5 w-5 text-warning" />
                </div>
                معوق
              </CardTitle>
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="text-2xl font-bold bg-gradient-to-r from-warning to-warning/80 bg-clip-text text-transparent">
                {formatCurrency(totalOverdue)}
              </div>
              <p className="text-sm text-muted-foreground/70 mt-2">
                {toPersianDigits(overdueInstallments.length)} قسط
              </p>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden bg-card/80 backdrop-blur-sm hover:shadow-xl hover:scale-[1.02] transition-all duration-300 group">
            <div className="absolute inset-0 bg-gradient-to-br from-success/5 via-transparent to-success/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <CardHeader className="relative z-10">
              <CardTitle className="flex items-center gap-2 text-base">
                <div className="relative">
                  <div className="absolute inset-0 bg-success/20 rounded-lg blur-sm opacity-0 group-hover:opacity-100 transition-opacity" />
                  <CheckCircle className="relative h-5 w-5 text-success" />
                </div>
                پرداخت شده
              </CardTitle>
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="text-2xl font-bold bg-gradient-to-r from-success to-success/80 bg-clip-text text-transparent">
                {formatCurrency(totalPaid)}
              </div>
              <p className="text-sm text-muted-foreground/70 mt-2">
                {toPersianDigits(paidInstallments.length)} قسط
              </p>
            </CardContent>
          </Card>
        </div>

        {/* نمایش گروه‌بندی شده بر اساس فروش */}
        <div className="space-y-6">
          {Object.entries(groupedBySale).map(([saleId, saleInstallments]) => {
            const sale = sales.find(s => s.id === saleId);
            if (!sale) return null;

            const customer = customers.find(c => c.id === sale.customerId);
            const phone = phones.find(p => p.id === sale.phoneId);
            const paidCount = saleInstallments.filter(i => i.status === 'paid').length;
            const unpaidInstallments = saleInstallments.filter(i => i.status !== 'paid');

            return (
              <Card key={saleId} className="relative overflow-hidden bg-card/80 backdrop-blur-sm hover:shadow-xl hover:scale-[1.01] transition-all duration-300 group">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <CardHeader className="bg-gradient-to-r from-muted/50 to-muted/30 relative z-10">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <CardTitle className="flex items-center gap-2 font-bold">
                        {customer?.name}
                        <Badge 
                          variant={sale.status === 'completed' ? 'default' : sale.status === 'defaulted' ? 'destructive' : 'secondary'}
                          className={cn(
                            sale.status === 'completed' && "bg-success/10 text-success border-success/20",
                            sale.status === 'defaulted' && "bg-destructive/10 text-destructive border-destructive/20",
                            sale.status === 'active' && "bg-primary/10 text-primary border-primary/20"
                          )}
                        >
                          {sale.status === 'completed' ? 'تکمیل شده' : sale.status === 'defaulted' ? 'نکول' : 'فعال'}
                        </Badge>
                      </CardTitle>
                      <div className="text-sm text-muted-foreground/70 mt-1">
                        {phone?.brand} {phone?.model} - {formatCurrency(sale.announcedPrice)}
                      </div>
                      <div className="text-sm text-muted-foreground/70">
                        پیشرفت: {toPersianDigits(paidCount)} از {toPersianDigits(saleInstallments.length)} قسط
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSaleDetailsDialog({ open: true, saleId })}
                        className="gap-2 hover:bg-primary/10 hover:border-primary/50 hover:scale-105 transition-all duration-200"
                      >
                        <FileText className="h-4 w-4" />
                        جزئیات
                      </Button>
                      {unpaidInstallments.length > 0 && (
                        <Button
                          size="sm"
                          onClick={() => {
                            setBulkPaymentDialog({ open: true, saleId });
                            setSelectedInstallments(new Set());
                          }}
                          className="gap-2 hover:scale-105 transition-all duration-200"
                        >
                          <CreditCard className="h-4 w-4" />
                          پرداخت چند قسط
                        </Button>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-4 relative z-10">
                  <div className="space-y-3">
                    {saleInstallments.map((installment, index) => (
                      <div
                        key={installment.id}
                        className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-xl border border-border/50 hover:bg-accent/30 hover:border-primary/30 transition-all duration-200 hover:scale-[1.01] animate-slide-in bg-card/50"
                        style={{ animationDelay: `${index * 30}ms` }}
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="font-bold text-base">
                              قسط {toPersianDigits(installment.installmentNumber)}
                            </span>
                            <Badge
                              variant={
                                installment.status === 'paid' ? 'default' :
                                installment.status === 'overdue' ? 'destructive' : 'secondary'
                              }
                              className={cn(
                                "text-xs px-2 py-0.5",
                                installment.status === 'paid' && "bg-success/10 text-success border-success/20",
                                installment.status === 'overdue' && "bg-destructive/10 text-destructive border-destructive/20",
                                installment.status === 'pending' && "bg-warning/10 text-warning border-warning/20"
                              )}
                            >
                              {installment.status === 'paid' ? 'پرداخت شده' :
                               installment.status === 'overdue' ? 'معوق' : 'در انتظار'}
                            </Badge>
                          </div>
                          <div className="text-sm text-muted-foreground/70 space-y-0.5">
                            <div>سررسید: <span className="font-medium text-foreground">{toJalaliDate(installment.dueDate)}</span></div>
                            {installment.paidDate && (
                              <div className="text-xs text-success">پرداخت: {toJalaliDate(installment.paidDate)}</div>
                            )}
                          </div>
                        </div>

                        <div className="flex flex-col md:items-end gap-2 min-w-[140px]">
                          <div className="text-xs text-muted-foreground/70 space-y-0.5">
                            <div>اصل: <span className="font-medium text-foreground">{formatCurrency(installment.principalAmount)}</span></div>
                            <div>سود: <span className="font-medium text-secondary">{formatCurrency(installment.interestAmount)}</span></div>
                          </div>
                          <div className="text-xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                            {formatCurrency(installment.totalAmount)}
                          </div>
                          <div className="text-xs text-muted-foreground/60">
                            مانده: {formatCurrency(installment.remainingDebt)}
                          </div>
                        </div>

                        <div className="flex gap-2 min-w-[100px]">
                          {installment.status !== 'paid' ? (
                            <Button
                              onClick={() => handlePayment(installment.id)}
                              className="gap-2 hover:scale-105 transition-all duration-200 flex-1"
                              size="sm"
                            >
                              <DollarSign className="h-4 w-4" />
                              پرداخت
                            </Button>
                          ) : (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleCancelPayment(installment.id)}
                              className="gap-2 hover:bg-destructive/10 hover:border-destructive/50 hover:scale-105 transition-all duration-200 flex-1"
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                              لغو
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {filteredInstallments.length === 0 && installments.length > 0 && (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Search className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground text-center">
                نتیجه‌ای یافت نشد
                <br />
                فیلترهای دیگری را امتحان کنید
              </p>
            </CardContent>
          </Card>
        )}

        {installments.length === 0 && (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <DollarSign className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground text-center">
                هنوز قسطی ثبت نشده است
                <br />
                ابتدا یک فروش ثبت کنید
              </p>
            </CardContent>
          </Card>
        )}
        {/* AlertDialog لغو پرداخت */}
        <AlertDialog open={cancelPaymentDialog.open} onOpenChange={(open) => setCancelPaymentDialog({ ...cancelPaymentDialog, open })}>
          <AlertDialogContent className="max-w-lg p-0 gap-0 overflow-hidden border-warning/20">
            {/* Header با gradient */}
            <div className="relative bg-gradient-to-br from-warning via-warning/90 to-warning/80 p-6">
              <div className="absolute inset-0 bg-black/10" />
              <div className="relative z-10 flex flex-col items-center text-center space-y-4">
                <div className="relative">
                  <div className="absolute inset-0 bg-white/20 rounded-full blur-xl animate-pulse" />
                  <div className="relative p-4 rounded-full bg-white/10 backdrop-blur-sm border-2 border-white/20">
                    <AlertCircle className="h-10 w-10 text-white" />
                  </div>
                </div>
                <AlertDialogTitle className="text-2xl font-bold text-white">
                  لغو پرداخت
                </AlertDialogTitle>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 space-y-4 bg-background">
              <AlertDialogDescription className="text-right space-y-4">
                <div className="p-4 rounded-lg bg-muted/50 border border-border/50">
                  <p className="text-base font-semibold text-foreground mb-2">
                    قسط مورد نظر:
                  </p>
                  <p className="text-lg font-bold text-primary bg-primary/10 px-3 py-2 rounded-md inline-block">
                    {cancelPaymentDialog.installmentInfo}
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
                        با لغو این پرداخت، موارد زیر به حالت قبل برمی‌گردند:
                      </p>
                      <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside mr-4">
                        <li>سرمایه از حساب شرکا کسر می‌شود</li>
                        <li>سود ماهانه از حساب شرکا کسر می‌شود</li>
                        <li>وضعیت فروش به "فعال" تغییر می‌کند</li>
                      </ul>
                      <p className="text-sm font-semibold text-warning mt-2">
                        این عمل قابل بازگشت است اما تغییرات مالی اعمال می‌شود.
                      </p>
                    </div>
                  </div>
                </div>

                <p className="text-center text-sm text-muted-foreground pt-2">
                  آیا از لغو این پرداخت اطمینان دارید؟
                </p>
              </AlertDialogDescription>
            </div>

            {/* Footer */}
            <AlertDialogFooter className="p-6 pt-0 gap-3 bg-background">
              <AlertDialogCancel className="flex-1 h-11 text-base font-semibold border-2 hover:bg-accent hover:border-accent-foreground/20 transition-all duration-200">
                انصراف
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={confirmCancelPayment}
                className="flex-1 h-11 text-base font-semibold bg-gradient-to-r from-warning to-warning/80 hover:from-warning/90 hover:to-warning/70 text-warning-foreground shadow-lg hover:shadow-xl transition-all duration-200"
              >
                <AlertCircle className="h-4 w-4 ml-2" />
                لغو پرداخت
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* AlertDialog تایید پرداخت دسته‌ای */}
        <AlertDialog open={bulkPaymentConfirmDialog.open} onOpenChange={(open) => setBulkPaymentConfirmDialog({ ...bulkPaymentConfirmDialog, open })}>
          <AlertDialogContent className="max-w-lg p-0 gap-0 overflow-hidden border-success/20">
            {/* Header با gradient */}
            <div className="relative bg-gradient-to-br from-success via-success/90 to-success/80 p-6">
              <div className="absolute inset-0 bg-black/10" />
              <div className="relative z-10 flex flex-col items-center text-center space-y-4">
                <div className="relative">
                  <div className="absolute inset-0 bg-white/20 rounded-full blur-xl animate-pulse" />
                  <div className="relative p-4 rounded-full bg-white/10 backdrop-blur-sm border-2 border-white/20">
                    <CheckCircle className="h-10 w-10 text-white" />
                  </div>
                </div>
                <AlertDialogTitle className="text-2xl font-bold text-white">
                  تایید پرداخت دسته‌ای
                </AlertDialogTitle>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 space-y-4 bg-background">
              <AlertDialogDescription className="text-right space-y-4">
                <div className="p-4 rounded-lg bg-success/5 border border-success/20 space-y-3">
                  <div className="flex justify-between items-center pb-2 border-b border-border/50">
                    <span className="text-sm font-semibold text-muted-foreground">تعداد اقساط:</span>
                    <span className="text-lg font-bold text-foreground">{toPersianDigits(bulkPaymentConfirmDialog.installmentsCount)} قسط</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">اصل:</span>
                    <span className="font-semibold text-primary text-base">{formatCurrency(bulkPaymentConfirmDialog.totalPrincipal)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">سود:</span>
                    <span className="font-semibold text-secondary text-base">{formatCurrency(bulkPaymentConfirmDialog.totalInterest)}</span>
                  </div>
                  <div className="flex justify-between items-center pt-3 border-t border-border/50">
                    <span className="text-base font-bold text-foreground">مجموع:</span>
                    <span className="text-xl font-bold text-success">{formatCurrency(bulkPaymentConfirmDialog.totalAmount)}</span>
                  </div>
                </div>

                <div className="p-4 rounded-lg bg-success/5 border border-success/20">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-full bg-success/10 flex-shrink-0">
                      <CheckCircle className="h-5 w-5 text-success" />
                    </div>
                    <div className="flex-1 space-y-1">
                      <p className="text-sm font-semibold text-success">
                        اطلاعات پرداخت
                      </p>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        با تایید این پرداخت، سرمایه و سود به حساب شرکا اضافه خواهد شد.
                      </p>
                    </div>
                  </div>
                </div>

                <p className="text-center text-sm text-muted-foreground pt-2">
                  آیا از پرداخت این اقساط اطمینان دارید؟
                </p>
              </AlertDialogDescription>
            </div>

            {/* Footer */}
            <AlertDialogFooter className="p-6 pt-0 gap-3 bg-background">
              <AlertDialogCancel className="flex-1 h-11 text-base font-semibold border-2 hover:bg-accent hover:border-accent-foreground/20 transition-all duration-200">
                انصراف
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={confirmBulkPayment}
                className="flex-1 h-11 text-base font-semibold bg-gradient-to-r from-success to-success/80 hover:from-success/90 hover:to-success/70 text-white shadow-lg hover:shadow-xl transition-all duration-200"
              >
                <CheckCircle className="h-4 w-4 ml-2" />
                تایید و پرداخت
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </Layout>
  );
};

export default Installments;

