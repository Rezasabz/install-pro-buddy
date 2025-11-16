import { useState, useEffect } from "react";
import Layout from "@/components/Layout";
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
} from "@/lib/storeProvider";
import { formatCurrency, toJalaliDate, toPersianDigits } from "@/lib/persian";
import { addCapitalFromPayment, addMonthlyProfitToPartners } from "@/lib/profitCalculator";
import { DollarSign, CheckCircle, Clock, AlertCircle, Trash2, Search, Filter, FileText, CreditCard } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const Installments = () => {
  const [installments, setInstallments] = useState<Installment[]>([]);
  const [filteredInstallments, setFilteredInstallments] = useState<Installment[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedSaleId, setSelectedSaleId] = useState<string>("");
  const [saleDetailsDialog, setSaleDetailsDialog] = useState<{ open: boolean; saleId: string }>({ open: false, saleId: '' });
  const [bulkPaymentDialog, setBulkPaymentDialog] = useState<{ open: boolean; saleId: string }>({ open: false, saleId: '' });
  const [selectedInstallments, setSelectedInstallments] = useState<Set<string>>(new Set());
  const { toast } = useToast();

  useEffect(() => {
    loadInstallments();
  }, []);

  useEffect(() => {
    applyFilters();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [installments, searchQuery, statusFilter, selectedSaleId]);

  const loadInstallments = () => {
    const allInstallments = installmentsStore.getAll();
    
    // بروزرسانی وضعیت اقساط معوق
    const today = new Date();
    allInstallments.forEach(inst => {
      if (inst.status === 'pending' && new Date(inst.dueDate) < today) {
        installmentsStore.update(inst.id, { status: 'overdue' });
      }
    });

    // مرتب‌سازی بر اساس تاریخ سررسید
    const sorted = installmentsStore.getAll().sort((a, b) => 
      new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
    );
    
    setInstallments(sorted);
  };

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
        const sale = salesStore.getAll().find(s => s.id === i.saleId);
        if (!sale) return false;
        const customer = customersStore.getAll().find(c => c.id === sale.customerId);
        return customer?.name.toLowerCase().includes(searchQuery.toLowerCase());
      });
    }

    setFilteredInstallments(filtered);
  };

  const handlePayment = (installmentId: string) => {
    const installment = installmentsStore.getAll().find(i => i.id === installmentId);
    if (!installment) return;

    // ثبت پرداخت
    installmentsStore.update(installmentId, {
      status: 'paid',
      paidDate: new Date().toISOString(),
    });

    // بازگشت اصل بدهی به سرمایه
    addCapitalFromPayment(installment.principalAmount);

    // افزودن سود ماهانه به حساب شرکا
    addMonthlyProfitToPartners(installment.interestAmount);

    // بررسی اینکه آیا همه اقساط پرداخت شده‌اند
    const saleInstallments = installmentsStore.getBySaleId(installment.saleId);
    const allPaid = saleInstallments.every(i => i.status === 'paid');
    
    if (allPaid) {
      salesStore.update(installment.saleId, { status: 'completed' });
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

    loadInstallments();
  };

  const handleCancelPayment = (installmentId: string) => {
    const installment = installmentsStore.getAll().find(i => i.id === installmentId);
    if (!installment || installment.status !== 'paid') return;

    if (!confirm("⚠️ آیا از لغو این پرداخت اطمینان دارید؟\n\nسرمایه و سود به حالت قبل برمی‌گردند.")) {
      return;
    }

    // لغو پرداخت
    installmentsStore.update(installmentId, {
      status: 'pending',
      paidDate: undefined,
    });

    // کسر اصل از سرمایه (برعکس عملیات پرداخت)
    const partners = partnersStore.getAll();
    const totalCapital = partners.reduce((sum, p) => sum + p.capital, 0);
    partners.forEach(partner => {
      const share = totalCapital > 0 ? partner.capital / totalCapital : 0;
      const deduction = Math.round(installment.principalAmount * share);
      partnersStore.update(partner.id, {
        availableCapital: partner.availableCapital - deduction,
      });
    });

    // کسر سود ماهانه از حساب شرکا
    partners.forEach(partner => {
      const share = totalCapital > 0 ? partner.capital / totalCapital : 0;
      const profitDeduction = Math.round(installment.interestAmount * share);
      partnersStore.update(partner.id, {
        monthlyProfit: partner.monthlyProfit - profitDeduction,
      });
    });

    // بروزرسانی وضعیت فروش
    salesStore.update(installment.saleId, { status: 'active' });

    toast({
      title: "لغو شد",
      description: "پرداخت قسط لغو شد و تغییرات برگشت داده شد",
    });

    loadInstallments();
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
      .map(id => installmentsStore.getAll().find(i => i.id === id))
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

    if (!confirm(`پرداخت ${toPersianDigits(installmentsToPayArray.length)} قسط\n\nمجموع: ${formatCurrency(totalAmount)}\nاصل: ${formatCurrency(totalPrincipal)}\nسود: ${formatCurrency(totalInterest)}\n\nآیا مطمئن هستید؟`)) {
      return;
    }

    installmentsToPayArray.forEach(installment => {
      handlePayment(installment.id);
    });

    setSelectedInstallments(new Set());
    setBulkPaymentDialog({ open: false, saleId: '' });

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
    const sale = salesStore.getAll().find(s => s.id === installment.saleId);
    if (!sale) return null;

    const customer = customersStore.getAll().find(c => c.id === sale.customerId);
    const saleInstallments = installmentsStore.getBySaleId(sale.id);

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

  const uniqueSales = salesStore.getAll().filter(sale => 
    installments.some(i => i.saleId === sale.id)
  );

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold">مدیریت اقساط</h1>
            <p className="text-muted-foreground">
              پیگیری و ثبت پرداخت اقساط مشتریان (سود ۴٪ ماهانه)
            </p>
          </div>
        </div>

        {/* فیلترها و جستجو */}
        <Card>
          <CardContent className="pt-6">
            <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <Label htmlFor="search" className="flex items-center gap-2 mb-2">
                  <Search className="h-4 w-4" />
                  جستجوی مشتری
                </Label>
                <Input
                  id="search"
                  placeholder="نام مشتری..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="status" className="flex items-center gap-2 mb-2">
                  <Filter className="h-4 w-4" />
                  وضعیت
                </Label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger id="status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">همه</SelectItem>
                    <SelectItem value="pending">در انتظار</SelectItem>
                    <SelectItem value="overdue">معوق</SelectItem>
                    <SelectItem value="paid">پرداخت شده</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="sale" className="flex items-center gap-2 mb-2">
                  <FileText className="h-4 w-4" />
                  فروش خاص
                </Label>
                <Select value={selectedSaleId || "all_sales"} onValueChange={(value) => setSelectedSaleId(value === "all_sales" ? "" : value)}>
                  <SelectTrigger id="sale">
                    <SelectValue placeholder="همه فروش‌ها" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all_sales">همه فروش‌ها</SelectItem>
                    {uniqueSales.map(sale => {
                      const customer = customersStore.getAll().find(c => c.id === sale.customerId);
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
                  className="w-full"
                >
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
              const sale = salesStore.getAll().find(s => s.id === saleDetailsDialog.saleId);
              if (!sale) return null;

              const customer = customersStore.getAll().find(c => c.id === sale.customerId);
              const phone = phonesStore.getAll().find(p => p.id === sale.phoneId);
              const saleInstallments = installmentsStore.getBySaleId(sale.id).sort((a, b) => a.installmentNumber - b.installmentNumber);
              const paidCount = saleInstallments.filter(i => i.status === 'paid').length;

              return (
                <div className="space-y-4 overflow-y-auto pl-2">
                  <div className="grid grid-cols-2 gap-3 p-3 bg-muted rounded-lg text-sm">
                    <div>
                      <div className="text-xs text-muted-foreground">مشتری</div>
                      <div className="font-semibold">{customer?.name}</div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground">گوشی</div>
                      <div className="font-semibold text-sm">{phone?.brand} {phone?.model}</div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground">قیمت اعلامی</div>
                      <div className="font-semibold">{formatCurrency(sale.announcedPrice)}</div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground">پیش‌پرداخت</div>
                      <div className="font-semibold">{formatCurrency(sale.downPayment)}</div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground">تعداد اقساط</div>
                      <div className="font-semibold">{toPersianDigits(sale.installmentMonths)} ماه</div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground">پیشرفت</div>
                      <div className="font-semibold">
                        {toPersianDigits(paidCount)} از {toPersianDigits(saleInstallments.length)} قسط
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <h3 className="font-semibold text-sm">لیست اقساط</h3>
                      <Button
                        size="sm"
                        onClick={() => {
                          setBulkPaymentDialog({ open: true, saleId: sale.id });
                          setSaleDetailsDialog({ open: false, saleId: '' });
                        }}
                      >
                        <CreditCard className="h-3 w-3 ml-1" />
                        پرداخت چند قسط
                      </Button>
                    </div>
                    <div className="space-y-2 max-h-[40vh] overflow-y-auto pl-1">
                      {saleInstallments.map(inst => (
                        <div key={inst.id} className="p-2 border rounded-lg hover:bg-muted/50 transition-colors">
                          <div className="flex justify-between items-center gap-2">
                            <div className="flex-1 min-w-0">
                              <div className="font-semibold text-sm">
                                قسط {toPersianDigits(inst.installmentNumber)}
                              </div>
                              <div className="text-xs text-muted-foreground truncate">
                                {toJalaliDate(inst.dueDate)}
                              </div>
                            </div>
                            <div className="text-left">
                              <div className="font-bold text-sm">{formatCurrency(inst.totalAmount)}</div>
                              <Badge 
                                variant={inst.status === 'paid' ? 'default' : inst.status === 'overdue' ? 'destructive' : 'secondary'}
                                className="text-xs"
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
              const sale = salesStore.getAll().find(s => s.id === bulkPaymentDialog.saleId);
              if (!sale) return null;

              const customer = customersStore.getAll().find(c => c.id === sale.customerId);
              const saleInstallments = installmentsStore.getBySaleId(sale.id)
                .filter(i => i.status !== 'paid')
                .sort((a, b) => a.installmentNumber - b.installmentNumber);

              const selectedArray = Array.from(selectedInstallments)
                .map(id => saleInstallments.find(i => i.id === id))
                .filter(Boolean) as Installment[];

              const totalSelected = selectedArray.reduce((sum, i) => sum + i.totalAmount, 0);

              return (
                <div className="space-y-3 overflow-y-auto pl-2">
                  <div className="p-3 bg-muted rounded-lg">
                    <div className="font-semibold text-sm">{customer?.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {toPersianDigits(saleInstallments.length)} قسط باقی‌مانده
                    </div>
                  </div>

                  <div className="space-y-2 max-h-[45vh] overflow-y-auto pl-1">
                    {saleInstallments.map(inst => (
                      <div
                        key={inst.id}
                        className={`p-2 border rounded-lg cursor-pointer transition-colors ${
                          selectedInstallments.has(inst.id) ? 'bg-primary/10 border-primary' : 'hover:bg-muted/50'
                        }`}
                        onClick={() => toggleInstallmentSelection(inst.id)}
                      >
                        <div className="flex justify-between items-center gap-2">
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            <input
                              type="checkbox"
                              checked={selectedInstallments.has(inst.id)}
                              onChange={() => toggleInstallmentSelection(inst.id)}
                              className="h-3 w-3"
                              onClick={(e) => e.stopPropagation()}
                            />
                            <div className="flex-1 min-w-0">
                              <div className="font-semibold text-sm">
                                قسط {toPersianDigits(inst.installmentNumber)}
                              </div>
                              <div className="text-xs text-muted-foreground truncate">
                                {toJalaliDate(inst.dueDate)}
                              </div>
                            </div>
                          </div>
                          <div className="text-left">
                            <div className="font-bold text-sm">{formatCurrency(inst.totalAmount)}</div>
                            <div className="text-xs text-muted-foreground whitespace-nowrap">
                              اصل: {formatCurrency(inst.principalAmount)}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {selectedArray.length > 0 && (
                    <div className="p-3 bg-primary/10 rounded-lg">
                      <div className="flex justify-between items-center mb-1 text-sm">
                        <span className="font-semibold">تعداد:</span>
                        <span>{toPersianDigits(selectedArray.length)} قسط</span>
                      </div>
                      <div className="flex justify-between items-center text-base font-bold">
                        <span>مجموع:</span>
                        <span>{formatCurrency(totalSelected)}</span>
                      </div>
                    </div>
                  )}

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() => {
                        const allIds = new Set(saleInstallments.map(i => i.id));
                        setSelectedInstallments(allIds);
                      }}
                      className="flex-1"
                    >
                      انتخاب همه
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setSelectedInstallments(new Set())}
                      className="flex-1"
                    >
                      پاک کردن
                    </Button>
                    <Button
                      onClick={handleBulkPayment}
                      disabled={selectedInstallments.size === 0}
                      className="flex-1"
                    >
                      <DollarSign className="h-4 w-4 ml-2" />
                      پرداخت
                    </Button>
                  </div>
                </div>
              );
            })()}
          </DialogContent>
        </Dialog>

        <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Clock className="h-5 w-5 text-info" />
                در انتظار پرداخت
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(totalPending)}
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                {toPersianDigits(pendingInstallments.length)} قسط
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <AlertCircle className="h-5 w-5 text-warning" />
                معوق
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-warning">
                {formatCurrency(totalOverdue)}
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                {toPersianDigits(overdueInstallments.length)} قسط
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <CheckCircle className="h-5 w-5 text-success" />
                پرداخت شده
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-success">
                {formatCurrency(totalPaid)}
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                {toPersianDigits(paidInstallments.length)} قسط
              </p>
            </CardContent>
          </Card>
        </div>

        {/* نمایش گروه‌بندی شده بر اساس فروش */}
        <div className="space-y-6">
          {Object.entries(groupedBySale).map(([saleId, saleInstallments]) => {
            const sale = salesStore.getAll().find(s => s.id === saleId);
            if (!sale) return null;

            const customer = customersStore.getAll().find(c => c.id === sale.customerId);
            const phone = phonesStore.getAll().find(p => p.id === sale.phoneId);
            const paidCount = saleInstallments.filter(i => i.status === 'paid').length;
            const unpaidInstallments = saleInstallments.filter(i => i.status !== 'paid');

            return (
              <Card key={saleId} className="overflow-hidden">
                <CardHeader className="bg-muted/50">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <CardTitle className="flex items-center gap-2">
                        {customer?.name}
                        <Badge variant={sale.status === 'completed' ? 'default' : sale.status === 'defaulted' ? 'destructive' : 'secondary'}>
                          {sale.status === 'completed' ? 'تکمیل شده' : sale.status === 'defaulted' ? 'نکول' : 'فعال'}
                        </Badge>
                      </CardTitle>
                      <div className="text-sm text-muted-foreground mt-1">
                        {phone?.brand} {phone?.model} - {formatCurrency(sale.announcedPrice)}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        پیشرفت: {toPersianDigits(paidCount)} از {toPersianDigits(saleInstallments.length)} قسط
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSaleDetailsDialog({ open: true, saleId })}
                      >
                        <FileText className="h-4 w-4 ml-2" />
                        جزئیات
                      </Button>
                      {unpaidInstallments.length > 0 && (
                        <Button
                          size="sm"
                          onClick={() => {
                            setBulkPaymentDialog({ open: true, saleId });
                            setSelectedInstallments(new Set());
                          }}
                        >
                          <CreditCard className="h-4 w-4 ml-2" />
                          پرداخت چند قسط
                        </Button>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-4">
                  <div className="space-y-3">
                    {saleInstallments.map((installment) => (
                      <div
                        key={installment.id}
                        className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-lg border hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-semibold">
                              قسط {toPersianDigits(installment.installmentNumber)}
                            </span>
                            <Badge
                              variant={
                                installment.status === 'paid' ? 'default' :
                                installment.status === 'overdue' ? 'destructive' : 'secondary'
                              }
                              className="text-xs"
                            >
                              {installment.status === 'paid' ? 'پرداخت شده' :
                               installment.status === 'overdue' ? 'معوق' : 'در انتظار'}
                            </Badge>
                          </div>
                          <div className="text-sm text-muted-foreground">
                            سررسید: {toJalaliDate(installment.dueDate)}
                            {installment.paidDate && ` • پرداخت: ${toJalaliDate(installment.paidDate)}`}
                          </div>
                        </div>

                        <div className="flex flex-col md:items-end gap-1">
                          <div className="text-sm text-muted-foreground">
                            اصل: {formatCurrency(installment.principalAmount)} + سود: {formatCurrency(installment.interestAmount)}
                          </div>
                          <div className="text-lg font-bold">
                            {formatCurrency(installment.totalAmount)}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            مانده: {formatCurrency(installment.remainingDebt)}
                          </div>
                        </div>

                        <div className="flex gap-2">
                          {installment.status !== 'paid' ? (
                            <Button
                              onClick={() => handlePayment(installment.id)}
                              size="sm"
                            >
                              <DollarSign className="ml-2 h-4 w-4" />
                              پرداخت
                            </Button>
                          ) : (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleCancelPayment(installment.id)}
                            >
                              <Trash2 className="ml-2 h-4 w-4" />
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
      </div>
    </Layout>
  );
};

export default Installments;
