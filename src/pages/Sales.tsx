import { useState, useEffect } from "react";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
} from "@/lib/store";
import { formatCurrency, toJalaliDate, toPersianDigits } from "@/lib/persian";
import { 
  calculateInstallments, 
  checkCapitalAvailability,
  deductCapitalForPurchase,
  addInitialProfitToPartners
} from "@/lib/profitCalculator";
import { Plus, ShoppingCart, TrendingUp, Trash2, Eye } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const Sales = () => {
  const [sales, setSales] = useState<Sale[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [detailsDialog, setDetailsDialog] = useState<{ open: boolean; saleId: string }>({ open: false, saleId: '' });
  const [formData, setFormData] = useState({
    customerId: "",
    phoneId: "", // گوشی از موجودی
    announcedPrice: "", // قیمت اعلام شده به مشتری
    downPayment: "",
    installmentMonths: "6",
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

  const customers = customersStore.getAll();
  const availablePhones = phonesStore.getAll().filter(p => p.status === 'available');
  const allPhones = phonesStore.getAll();

  useEffect(() => {
    loadSales();
  }, []);

  useEffect(() => {
    // محاسبه پیش‌نمایش
    if (formData.phoneId && formData.announcedPrice && formData.downPayment && formData.installmentMonths) {
      const phone = availablePhones.find(p => p.id === formData.phoneId);
      if (!phone) return;

      const announcedPrice = parseFloat(formData.announcedPrice) || 0;
      const purchasePrice = phone.purchasePrice;
      const downPayment = parseFloat(formData.downPayment) || 0;
      const installmentMonths = parseInt(formData.installmentMonths);

      if (announcedPrice > 0 && downPayment < announcedPrice) {
        const remainingDebt = announcedPrice - downPayment;
        const installments = calculateInstallments(remainingDebt, installmentMonths);
        const totalInterest = installments.reduce((sum, inst) => sum + inst.interestAmount, 0);
        const initialProfit = announcedPrice - purchasePrice;

        setPreview({
          remainingDebt,
          installments,
          totalInterest,
          initialProfit,
        });
      }
    }
  }, [formData.phoneId, formData.announcedPrice, formData.downPayment, formData.installmentMonths, availablePhones]);

  const loadSales = () => {
    setSales(salesStore.getAll());
  };

  const handleDeleteSale = (saleId: string) => {
    if (!confirm("⚠️ هشدار: با حذف این فروش، تمام اقساط مرتبط نیز حذف می‌شوند.\n\nآیا مطمئن هستید؟")) {
      return;
    }

    // حذف اقساط مرتبط
    const saleInstallments = installmentsStore.getBySaleId(saleId);
    saleInstallments.forEach(inst => {
      installmentsStore.delete(inst.id);
    });

    // حذف فروش
    salesStore.delete(saleId);

    toast({
      title: "موفق",
      description: "فروش و اقساط مرتبط با موفقیت حذف شدند",
    });

    loadSales();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const phone = availablePhones.find(p => p.id === formData.phoneId);
    if (!phone) {
      toast({
        title: "خطا",
        description: "گوشی انتخاب شده یافت نشد",
        variant: "destructive",
      });
      return;
    }

    const announcedPrice = parseFloat(formData.announcedPrice);
    const purchasePrice = phone.purchasePrice;
    const downPayment = parseFloat(formData.downPayment);
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

    // بررسی موجودی سرمایه
    const capitalCheck = checkCapitalAvailability(purchasePrice);
    if (!capitalCheck.isAvailable) {
      toast({
        title: "سرمایه ناکافی",
        description: `سرمایه در دسترس: ${formatCurrency(capitalCheck.availableCapital)}. کمبود: ${formatCurrency(capitalCheck.shortfall)}. لطفاً سرمایه را افزایش دهید.`,
        variant: "destructive",
      });
      return;
    }

    const remainingDebt = announcedPrice - downPayment;
    const installments = calculateInstallments(remainingDebt, installmentMonths);
    const initialProfit = announcedPrice - purchasePrice;

    // ایجاد فروش
    const newSale = salesStore.add({
      customerId: formData.customerId,
      phoneId: formData.phoneId,
      announcedPrice,
      purchasePrice,
      downPayment,
      installmentMonths,
      monthlyInterestRate: 0.04,
      initialProfit,
      saleDate: new Date().toISOString(),
      status: 'active',
    });

    // تغییر وضعیت گوشی به فروخته شده
    phonesStore.update(formData.phoneId, { status: 'sold' });

    // ایجاد اقساط
    const today = new Date();
    installments.forEach((inst) => {
      const dueDate = new Date(today);
      dueDate.setMonth(dueDate.getMonth() + inst.installmentNumber);
      
      installmentsStore.add({
        saleId: newSale.id,
        installmentNumber: inst.installmentNumber,
        principalAmount: inst.principalAmount,
        interestAmount: inst.interestAmount,
        totalAmount: inst.totalAmount,
        remainingDebt: inst.remainingDebt,
        dueDate: dueDate.toISOString(),
        status: 'pending',
      });
    });

    // کاهش سرمایه در دسترس
    deductCapitalForPurchase(purchasePrice);

    // ثبت سود اولیه
    addInitialProfitToPartners(initialProfit);

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
    });
    setIsDialogOpen(false);
    loadSales();
  };

  const getSaleDetails = (sale: Sale) => {
    const customer = customers.find(c => c.id === sale.customerId);
    const phone = allPhones.find(p => p.id === sale.phoneId);
    const installments = installmentsStore.getBySaleId(sale.id);
    const paidInstallments = installments.filter(i => i.status === 'paid');
    
    const paidPrincipal = paidInstallments.reduce((sum, i) => sum + i.principalAmount, 0);
    const paidInterest = paidInstallments.reduce((sum, i) => sum + i.interestAmount, 0);
    const paidAmount = sale.downPayment + paidPrincipal + paidInterest;
    
    const remainingDebt = sale.announcedPrice - sale.downPayment - paidPrincipal;

    return {
      customer,
      phone,
      paidAmount,
      remainingDebt,
      paidInterest,
      paidCount: paidInstallments.length,
      totalCount: installments.length,
    };
  };

  const totalRevenue = sales.reduce((sum, s) => sum + s.announcedPrice, 0);
  const activeSales = sales.filter(s => s.status === 'active').length;

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">مدیریت فروش</h1>
            <p className="text-muted-foreground">
              ثبت و مدیریت فروش‌های اقساطی
            </p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button
                onClick={() => {
                  setFormData({
                    customerId: "",
                    phoneId: "",
                    announcedPrice: "",
                    downPayment: "",
                    installmentMonths: "6",
                  });
                }}
                disabled={customers.length === 0 || availablePhones.length === 0}
              >
                <Plus className="ml-2 h-4 w-4" />
                ثبت فروش جدید
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>ثبت فروش جدید</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto px-1">
                <div>
                  <Label htmlFor="customerId">مشتری</Label>
                  <Select
                    value={formData.customerId}
                    onValueChange={(value) =>
                      setFormData({ ...formData, customerId: value })
                    }
                    required
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
                <div>
                  <Label htmlFor="announcedPrice">قیمت اعلامی به مشتری (تومان)</Label>
                  <Input
                    id="announcedPrice"
                    type="number"
                    value={formData.announcedPrice}
                    onChange={(e) =>
                      setFormData({ ...formData, announcedPrice: e.target.value })
                    }
                    required
                    placeholder="مثال: ۲۲۰۰۰۰۰۰"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    قیمتی که به مشتری اعلام می‌کنید (پیش‌فرض: قیمت فروش گوشی)
                  </p>
                </div>
                <div>
                  <Label htmlFor="downPayment">پیش‌پرداخت (تومان)</Label>
                  <Input
                    id="downPayment"
                    type="number"
                    value={formData.downPayment}
                    onChange={(e) =>
                      setFormData({ ...formData, downPayment: e.target.value })
                    }
                    required
                    placeholder="مثال: ۵۰۰۰۰۰۰"
                  />
                </div>
                <div>
                  <Label htmlFor="installmentMonths">تعداد اقساط (ماه)</Label>
                  <Select
                    value={formData.installmentMonths}
                    onValueChange={(value) =>
                      setFormData({ ...formData, installmentMonths: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[6, 7, 8, 9, 10, 11, 12].map((month) => (
                        <SelectItem key={month} value={month.toString()}>
                          {toPersianDigits(month)} ماه
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {preview.installments.length > 0 && (
                  <div className="p-4 bg-muted rounded-lg space-y-3">
                    <div className="text-sm font-semibold">پیش‌نمایش محاسبات</div>
                    
                    <div className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">سود اولیه:</span>
                        <span className="font-semibold text-success">{formatCurrency(preview.initialProfit)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">مانده بدهی:</span>
                        <span className="font-semibold">{formatCurrency(preview.remainingDebt)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">مجموع سود ۴٪:</span>
                        <span className="font-semibold text-secondary">{formatCurrency(preview.totalInterest)}</span>
                      </div>
                    </div>

                    <div className="pt-2 border-t">
                      <div className="text-xs font-semibold mb-2">جدول اقساط (نمونه ۳ قسط اول):</div>
                      <div className="space-y-1">
                        {preview.installments.slice(0, 3).map((inst) => (
                          <div key={inst.installmentNumber} className="text-xs flex justify-between">
                            <span>قسط {toPersianDigits(inst.installmentNumber)}:</span>
                            <span>
                              {formatCurrency(inst.principalAmount)} + {formatCurrency(inst.interestAmount)} = 
                              <span className="font-semibold mr-1">{formatCurrency(inst.totalAmount)}</span>
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                <Button type="submit" className="w-full">
                  ثبت فروش
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShoppingCart className="h-5 w-5" />
                فروش فعال
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-primary">
                {toPersianDigits(activeSales)}
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                قرارداد در حال اجرا
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                درآمد کل
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(totalRevenue)}
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                مجموع فروش
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          {sales.map((sale) => {
            const details = getSaleDetails(sale);
            return (
              <Card key={sale.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <CardTitle className="text-lg">
                        {details.customer?.name || "نامشخص"}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground">
                        {details.phone ? `${details.phone.brand} ${details.phone.model}` : 'گوشی نامشخص'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        قیمت اعلامی: {formatCurrency(sale.announcedPrice)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={sale.status === 'active' ? 'default' : 'secondary'}>
                        {sale.status === 'active' ? 'فعال' : 
                         sale.status === 'completed' ? 'تکمیل شده' : 'معوق'}
                      </Badge>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteSale(sale.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <div className="text-sm text-muted-foreground">سود اولیه</div>
                      <div className="font-semibold text-success">{formatCurrency(sale.initialProfit)}</div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">پیش‌پرداخت</div>
                      <div className="font-semibold">{formatCurrency(sale.downPayment)}</div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">سود ۴٪ دریافتی</div>
                      <div className="font-semibold text-secondary">{formatCurrency(details.paidInterest)}</div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">مانده بدهی</div>
                      <div className="font-semibold text-warning">
                        {formatCurrency(details.remainingDebt)}
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 pt-4 border-t flex justify-between items-center">
                    <div className="text-sm text-muted-foreground">
                      پرداخت شده: {toPersianDigits(details.paidCount)} از {toPersianDigits(details.totalCount)} قسط
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setDetailsDialog({ open: true, saleId: sale.id })}
                      >
                        <Eye className="h-3 w-3 ml-1" />
                        جزئیات
                      </Button>
                      <div className="text-xs text-muted-foreground">
                        {toJalaliDate(sale.saleDate)}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {sales.length === 0 && (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <ShoppingCart className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground text-center">
                هنوز فروشی ثبت نشده است
                <br />
                {customers.length === 0 && "ابتدا مشتری ثبت کنید"}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Dialog جزئیات فروش */}
        <Dialog open={detailsDialog.open} onOpenChange={(open) => setDetailsDialog({ ...detailsDialog, open })}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>جزئیات فروش</DialogTitle>
            </DialogHeader>
            {(() => {
              const sale = sales.find(s => s.id === detailsDialog.saleId);
              if (!sale) return null;
              
              const details = getSaleDetails(sale);
              const saleInstallments = installmentsStore.getBySaleId(sale.id);
              
              return (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-sm text-muted-foreground">مشتری</div>
                      <div className="font-semibold">{details.customer?.name}</div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">گوشی</div>
                      <div className="font-semibold">
                        {details.phone ? `${details.phone.brand} ${details.phone.model}` : 'نامشخص'}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">قیمت خرید</div>
                      <div className="font-semibold">{formatCurrency(sale.purchasePrice)}</div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">قیمت اعلامی</div>
                      <div className="font-semibold">{formatCurrency(sale.announcedPrice)}</div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">سود اولیه</div>
                      <div className="font-semibold text-success">{formatCurrency(sale.initialProfit)}</div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">پیش‌پرداخت</div>
                      <div className="font-semibold">{formatCurrency(sale.downPayment)}</div>
                    </div>
                  </div>

                  <div className="pt-4 border-t">
                    <h3 className="font-semibold mb-3">جدول اقساط</h3>
                    <div className="space-y-2">
                      {saleInstallments.map((inst) => (
                        <div key={inst.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex-1">
                            <div className="font-medium">قسط {toPersianDigits(inst.installmentNumber)}</div>
                            <div className="text-xs text-muted-foreground">
                              سررسید: {toJalaliDate(inst.dueDate)}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm">
                              اصل: {formatCurrency(inst.principalAmount)}
                            </div>
                            <div className="text-sm text-secondary">
                              سود: {formatCurrency(inst.interestAmount)}
                            </div>
                            <div className="font-semibold">
                              مجموع: {formatCurrency(inst.totalAmount)}
                            </div>
                          </div>
                          <Badge variant={inst.status === 'paid' ? 'default' : inst.status === 'overdue' ? 'destructive' : 'secondary'}>
                            {inst.status === 'paid' ? 'پرداخت شده' : inst.status === 'overdue' ? 'معوق' : 'در انتظار'}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })()}
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
};

export default Sales;
