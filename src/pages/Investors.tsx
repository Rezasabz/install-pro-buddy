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
import { Badge } from "@/components/ui/badge";
import {
  investorsStore,
  investorTransactionsStore,
  Investor,
  InvestorTransaction,
  partnersStore,
  salesStore,
  installmentsStore,
  expensesStore,
} from "@/lib/storeProvider";
import { calculateFinancialsFromData } from "@/lib/profitCalculator";
import { formatCurrency, toJalaliDate, toPersianDigits } from "@/lib/persian";
import { Plus, TrendingUp, DollarSign, Trash2, Eye, User, Phone, IdCard, Calendar, Percent, Wallet, CheckCircle2, FileText, ArrowUp, ArrowDown, Activity, CreditCard, AlertCircle, Edit } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { JalaliDatePicker } from "@/components/JalaliDatePicker";

const Investors = () => {
  const [investors, setInvestors] = useState<Investor[]>([]);
  const [transactions, setTransactions] = useState<InvestorTransaction[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingInvestor, setEditingInvestor] = useState<Investor | null>(null);
  const [detailsDialog, setDetailsDialog] = useState<{ open: boolean; investorId: string }>({ open: false, investorId: '' });
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; investorId: string; investorName: string }>({ open: false, investorId: '', investorName: '' });
  const [capitalAdjustDialog, setCapitalAdjustDialog] = useState<{ open: boolean; investorId: string; investorName: string; currentCapital: number; type: 'add' | 'withdraw' }>({ 
    open: false, 
    investorId: '', 
    investorName: '', 
    currentCapital: 0,
    type: 'add'
  });
  const [capitalAmount, setCapitalAmount] = useState("");
  const [capitalDescription, setCapitalDescription] = useState("");
  const [paymentConfirmDialog, setPaymentConfirmDialog] = useState<{
    open: boolean;
    investor: Investor | null;
    isFullMonth: boolean;
  }>({ open: false, investor: null, isFullMonth: true });
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    nationalId: "",
    investmentAmount: "",
    profitRate: "3.5", // پیش‌فرض: 3.5%
  });
  const [startDate, setStartDate] = useState<Date>(new Date());
  const { toast } = useToast();

  const loadData = async () => {
    try {
      const [investorsData, transactionsData] = await Promise.all([
        investorsStore.getAll(),
        investorTransactionsStore.getAll(),
      ]);
      setInvestors(investorsData);
      setTransactions(transactionsData);
    } catch (error) {
      console.error('Error loading investors:', error);
      toast({
        title: "خطا",
        description: "خطا در بارگذاری سرمایه‌گذاران",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleInvestmentAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // حذف همه کاراکترهای غیر عددی (به جز کاما)
    const numericValue = value.replace(/[^\d]/g, '');
    
    if (numericValue === '') {
      setFormData({ ...formData, investmentAmount: '' });
      return;
    }
    
    // تبدیل به عدد و فرمت با کاما
    const number = parseInt(numericValue, 10);
    const formatted = number.toLocaleString('en-US');
    setFormData({ ...formData, investmentAmount: formatted });
  };

  const handleEdit = (investor: Investor) => {
    setEditingInvestor(investor);
    setFormData({
      name: investor.name,
      phone: investor.phone,
      nationalId: investor.nationalId,
      investmentAmount: investor.investmentAmount.toLocaleString('en-US'),
      profitRate: investor.profitRate.toString(),
    });
    setStartDate(new Date(investor.startDate));
    setIsDialogOpen(true);
  };

  // محاسبه سود روزانه
  const calculateDailyProfit = (investor: Investor): number => {
    const monthlyProfit = (investor.profitRate / 100) * investor.investmentAmount;
    const dailyProfit = monthlyProfit / 30; // تقسیم بر 30 روز
    return dailyProfit;
  };

  // محاسبه سود تا امروز (از آخرین پرداخت یا تاریخ شروع)
  const calculateAccruedProfit = (investor: Investor): { days: number; profit: number } => {
    const lastPayment = transactions
      .filter(t => t.investorId === investor.id && t.type === 'profit_payment')
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
    
    const startDate = lastPayment 
      ? new Date(lastPayment.date)
      : new Date(investor.startDate);
    
    const now = new Date();
    const daysPassed = Math.floor((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    
    const dailyProfit = calculateDailyProfit(investor);
    const accruedProfit = dailyProfit * daysPassed;
    
    return { days: daysPassed, profit: accruedProfit };
  };

  // محاسبه تاریخ پرداخت بعدی
  const getNextPaymentDate = (investor: Investor): Date => {
    const startDate = new Date(investor.startDate);
    const now = new Date();
    
    // محاسبه تعداد ماه‌های گذشته
    const monthsPassed = (now.getFullYear() - startDate.getFullYear()) * 12 + 
                         (now.getMonth() - startDate.getMonth());
    
    // تاریخ پرداخت بعدی
    const nextPayment = new Date(startDate);
    nextPayment.setMonth(startDate.getMonth() + monthsPassed + 1);
    
    return nextPayment;
  };

  // بررسی اینکه آیا زمان پرداخت رسیده
  const isPaymentDue = (investor: Investor): boolean => {
    const lastPayment = transactions
      .filter(t => t.investorId === investor.id && t.type === 'profit_payment')
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
    
    if (!lastPayment) {
      // اگه هیچ پرداختی نداشته، بررسی کن که یک ماه از تاریخ شروع گذشته باشه
      const startDate = new Date(investor.startDate);
      const now = new Date();
      const monthsPassed = (now.getFullYear() - startDate.getFullYear()) * 12 + 
                           (now.getMonth() - startDate.getMonth());
      return monthsPassed >= 1;
    }
    
    // بررسی که یک ماه از آخرین پرداخت گذشته باشه
    const lastPaymentDate = new Date(lastPayment.date);
    const now = new Date();
    const monthsSinceLastPayment = (now.getFullYear() - lastPaymentDate.getFullYear()) * 12 + 
                                    (now.getMonth() - lastPaymentDate.getMonth());
    return monthsSinceLastPayment >= 1;
  };

  const showPaymentConfirm = (investor: Investor, isFullMonth: boolean) => {
    setPaymentConfirmDialog({ open: true, investor, isFullMonth });
  };

  const confirmPayProfit = async () => {
    const { investor, isFullMonth } = paymentConfirmDialog;
    if (!investor) return;

    try {
      let investorProfit: number;
      let description: string;
      
      if (isFullMonth) {
        // پرداخت سود کامل یک ماه
        investorProfit = (investor.profitRate / 100) * investor.investmentAmount;
        description = `پرداخت ${investor.profitRate}٪ سود ماهیانه از اصل سرمایه ${formatCurrency(investor.investmentAmount)}`;
      } else {
        // پرداخت سود تا امروز (روزانه)
        const accrued = calculateAccruedProfit(investor);
        investorProfit = accrued.profit;
        description = `پرداخت سود ${toPersianDigits(accrued.days)} روز (${investor.profitRate}٪ ماهیانه) از اصل سرمایه ${formatCurrency(investor.investmentAmount)}`;
      }
      
      // ثبت تراکنش
      await investorTransactionsStore.add({
        investorId: investor.id,
        type: 'profit_payment',
        amount: investorProfit,
        description,
      });
      
      // آپدیت کل سود دریافتی
      await investorsStore.update(investor.id, {
        totalProfit: investor.totalProfit + investorProfit,
      });

      toast({
        title: "موفق",
        description: `سود ${formatCurrency(investorProfit)} به ${investor.name} پرداخت شد`,
      });

      setPaymentConfirmDialog({ open: false, investor: null, isFullMonth: true });
      await loadData();
    } catch (error) {
      console.error('Error paying profit:', error);
      toast({
        title: "خطا",
        description: "خطا در پرداخت سود",
        variant: "destructive",
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // حذف کاماها و تبدیل به عدد
    const investmentAmount = parseFloat(formData.investmentAmount.replace(/,/g, ''));
    const profitRate = parseFloat(formData.profitRate);

    if (isNaN(investmentAmount) || investmentAmount <= 0) {
      toast({
        title: "خطا",
        description: "مبلغ سرمایه‌گذاری نامعتبر است",
        variant: "destructive",
      });
      return;
    }

    if (isNaN(profitRate) || profitRate < 0 || profitRate > 100) {
      toast({
        title: "خطا",
        description: "درصد سود باید بین 0 تا 100 باشد",
        variant: "destructive",
      });
      return;
    }

    try {
      if (editingInvestor) {
        // ویرایش سرمایه‌گذار
        const updateData = {
          name: formData.name,
          phone: formData.phone,
          nationalId: formData.nationalId,
          profitRate: profitRate,
          startDate: startDate.toISOString().split('T')[0],
        };
        
        console.log('Updating investor:', editingInvestor.id, updateData);
        const updatedInvestor = await investorsStore.update(editingInvestor.id, updateData);
        console.log('Updated investor received:', updatedInvestor);

        toast({
          title: "موفق",
          description: "سرمایه‌گذار با موفقیت ویرایش شد",
        });
      } else {
        // ثبت سرمایه‌گذار جدید
        await investorsStore.add({
          name: formData.name,
          phone: formData.phone,
          nationalId: formData.nationalId,
          investmentAmount,
          profitRate,
          startDate: startDate.toISOString().split('T')[0],
          status: 'active',
        });

        toast({
          title: "موفق",
          description: "سرمایه‌گذار با موفقیت ثبت شد",
        });
      }

      // Reset form
      setFormData({
        name: "",
        phone: "",
        nationalId: "",
        investmentAmount: "",
        profitRate: "3.5",
      });
      setStartDate(new Date());
      setEditingInvestor(null);
      setIsDialogOpen(false);
      
      // Force reload data
      await loadData();
      
      // Force re-render by updating a dummy state if needed
      console.log('Data reloaded after update');
    } catch (error) {
      console.error('Error saving investor:', error);
      toast({
        title: "خطا",
        description: editingInvestor ? "خطا در ویرایش سرمایه‌گذار" : "خطا در ثبت سرمایه‌گذار",
        variant: "destructive",
      });
    }
  };

  const handleDelete = (id: string, name: string) => {
    setDeleteDialog({ open: true, investorId: id, investorName: name });
  };

  const confirmDelete = async () => {
    try {
      await investorsStore.delete(deleteDialog.investorId);
      toast({
        title: "موفق",
        description: "سرمایه‌گذار حذف شد",
      });
      setDeleteDialog({ open: false, investorId: '', investorName: '' });
      await loadData();
    } catch (error) {
      console.error('Error deleting investor:', error);
      toast({
        title: "خطا",
        description: "خطا در حذف سرمایه‌گذار",
        variant: "destructive",
      });
    }
  };

  const handleCapitalAdjust = (investor: Investor, type: 'add' | 'withdraw') => {
    setCapitalAdjustDialog({
      open: true,
      investorId: investor.id,
      investorName: investor.name,
      currentCapital: investor.investmentAmount,
      type
    });
    setCapitalAmount("");
    setCapitalDescription("");
  };

  const handleCapitalAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const numericValue = value.replace(/[^\d]/g, '');
    
    if (numericValue === '') {
      setCapitalAmount('');
      return;
    }
    
    const number = parseInt(numericValue, 10);
    const formatted = number.toLocaleString('en-US');
    setCapitalAmount(formatted);
  };

  const confirmCapitalAdjust = async () => {
    const amount = parseFloat(capitalAmount.replace(/,/g, ''));
    
    if (isNaN(amount) || amount <= 0) {
      toast({
        title: "خطا",
        description: "مبلغ نامعتبر است",
        variant: "destructive",
      });
      return;
    }

    const adjustAmount = capitalAdjustDialog.type === 'add' ? amount : -amount;
    
    if (capitalAdjustDialog.type === 'withdraw' && adjustAmount + capitalAdjustDialog.currentCapital < 0) {
      toast({
        title: "خطا",
        description: "مبلغ برداشت نمی‌تواند بیشتر از سرمایه فعلی باشد",
        variant: "destructive",
      });
      return;
    }

    try {
      await investorsStore.adjustCapital(
        capitalAdjustDialog.investorId,
        adjustAmount,
        capitalDescription || undefined
      );
      
      toast({
        title: "موفق",
        description: capitalAdjustDialog.type === 'add' 
          ? "سرمایه با موفقیت اضافه شد" 
          : "سرمایه با موفقیت برداشت شد",
      });
      
      setCapitalAdjustDialog({ open: false, investorId: '', investorName: '', currentCapital: 0, type: 'add' });
      setCapitalAmount("");
      setCapitalDescription("");
      await loadData();
    } catch (error) {
      console.error('Error adjusting capital:', error);
      toast({
        title: "خطا",
        description: "خطا در تغییر سرمایه",
        variant: "destructive",
      });
    }
  };

  const totalInvestment = investors.reduce((sum, i) => sum + i.investmentAmount, 0);
  const totalProfit = investors.reduce((sum, i) => sum + i.totalProfit, 0);
  const activeInvestors = investors.filter(i => i.status === 'active').length;

  return (
    <Layout>
      <div className="space-y-6 animate-fade-scale">
        <div className="flex flex-col sm:flex-row justify-between items-start gap-4 pb-2">
          <div className="space-y-1">
            <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-primary via-secondary to-primary bg-clip-text text-transparent bg-[length:200%_auto] animate-gradient">
              مدیریت سرمایه‌گذاران
            </h1>
            <p className="text-muted-foreground/80 text-sm md:text-base">
              سرمایه‌گذارانی که ماهیانه سود از اصل سرمایه دریافت می‌کنند
            </p>
          </div>
          <div className="flex gap-2">
            <Dialog open={isDialogOpen} onOpenChange={(open) => {
              setIsDialogOpen(open);
              if (!open) {
                setEditingInvestor(null);
                setFormData({
                  name: "",
                  phone: "",
                  nationalId: "",
                  investmentAmount: "",
                  profitRate: "3.5",
                });
                setStartDate(new Date());
              }
            }}>
              <DialogTrigger asChild>
                <Button className="gap-2 hover:scale-105 transition-all duration-200">
                  <Plus className="h-4 w-4" />
                  افزودن سرمایه‌گذار
                </Button>
              </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle className="text-xl font-bold bg-gradient-to-r from-primary via-secondary to-primary bg-clip-text text-transparent flex items-center gap-2">
                  {editingInvestor ? (
                    <>
                      <Edit className="h-5 w-5 text-secondary" />
                      ویرایش سرمایه‌گذار
                    </>
                  ) : (
                    <>
                      <Plus className="h-5 w-5 text-primary" />
                      افزودن سرمایه‌گذار جدید
                    </>
                  )}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* اطلاعات شخصی */}
                <Card className="relative overflow-hidden bg-gradient-to-br from-primary/5 via-transparent to-secondary/5 border-primary/20">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-semibold flex items-center gap-2">
                      <User className="h-4 w-4 text-primary" />
                      اطلاعات شخصی
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="space-y-2">
                      <Label htmlFor="name" className="text-sm font-semibold flex items-center gap-2">
                        <User className="h-4 w-4" />
                        نام
                      </Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        required
                        placeholder="نام و نام خانوادگی"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone" className="text-sm font-semibold flex items-center gap-2">
                        <Phone className="h-4 w-4" />
                        شماره تماس
                      </Label>
                      <Input
                        id="phone"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        required
                        placeholder="۰۹۱۲۳۴۵۶۷۸۹"
                        dir="ltr"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="nationalId" className="text-sm font-semibold flex items-center gap-2">
                        <IdCard className="h-4 w-4" />
                        کد ملی
                      </Label>
                      <Input
                        id="nationalId"
                        value={formData.nationalId}
                        onChange={(e) => setFormData({ ...formData, nationalId: e.target.value })}
                        required
                        placeholder="۱۰ رقم"
                        maxLength={10}
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* اطلاعات سرمایه‌گذاری */}
                <Card className="relative overflow-hidden bg-gradient-to-br from-success/5 via-transparent to-primary/5 border-success/20">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-semibold flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-success" />
                      اطلاعات سرمایه‌گذاری
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="space-y-2">
                      <Label htmlFor="investmentAmount" className="text-sm font-semibold flex items-center gap-2">
                        <Wallet className="h-4 w-4" />
                        مبلغ سرمایه‌گذاری (تومان)
                      </Label>
                      <Input
                        id="investmentAmount"
                        type="text"
                        value={formData.investmentAmount}
                        onChange={handleInvestmentAmountChange}
                        placeholder="مثال: ۱۰,۰۰۰,۰۰۰"
                        required
                        dir="ltr"
                        className="text-lg font-semibold"
                        disabled={!!editingInvestor}
                      />
                      {editingInvestor && (
                        <p className="text-xs text-muted-foreground">
                          برای تغییر سرمایه از دکمه‌های "افزودن" یا "برداشت" استفاده کنید
                        </p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="profitRate" className="text-sm font-semibold flex items-center gap-2">
                        <Percent className="h-4 w-4" />
                        درصد سود ماهیانه
                      </Label>
                      <Input
                        id="profitRate"
                        type="number"
                        step="0.1"
                        min="0"
                        max="100"
                        value={formData.profitRate}
                        onChange={(e) => setFormData({ ...formData, profitRate: e.target.value })}
                        required
                        placeholder="مثال: ۳.۵"
                        className="text-lg font-semibold"
                      />
                      <p className="text-xs text-muted-foreground">
                        درصد سود ماهیانه از اصل سرمایه
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="startDate" className="text-sm font-semibold flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        تاریخ شروع
                      </Label>
                      <JalaliDatePicker
                        value={startDate}
                        onChange={setStartDate}
                        placeholder="انتخاب تاریخ شروع"
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* دکمه ثبت */}
                <Button 
                  type="submit" 
                  className="w-full h-12 text-base font-semibold bg-gradient-to-r from-primary via-secondary to-primary hover:opacity-90 transition-all duration-200 shadow-lg hover:shadow-xl"
                >
                  <CheckCircle2 className="h-4 w-4 ml-2" />
                  {editingInvestor ? 'ذخیره تغییرات' : 'ثبت سرمایه‌گذار'}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Card className="relative overflow-hidden bg-card/80 backdrop-blur-sm hover:shadow-xl hover:scale-[1.02] transition-all duration-300 group">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <CardHeader className="relative z-10">
              <CardTitle className="flex items-center gap-2">
                <div className="relative">
                  <div className="absolute inset-0 bg-primary/20 rounded-lg blur-sm opacity-0 group-hover:opacity-100 transition-opacity" />
                  <DollarSign className="relative h-5 w-5 text-primary" />
                </div>
                کل سرمایه‌گذاری
              </CardTitle>
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
                {formatCurrency(totalInvestment)}
              </div>
              <p className="text-sm text-muted-foreground/70 mt-2">
                {toPersianDigits(activeInvestors)} سرمایه‌گذار فعال
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
                کل سود پرداختی
              </CardTitle>
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="text-2xl font-bold bg-gradient-to-r from-success to-success/80 bg-clip-text text-transparent">
                {formatCurrency(totalProfit)}
              </div>
              <p className="text-sm text-muted-foreground/70 mt-2">
                سود دریافتی سرمایه‌گذاران
              </p>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden bg-card/80 backdrop-blur-sm hover:shadow-xl hover:scale-[1.02] transition-all duration-300 group">
            <div className="absolute inset-0 bg-gradient-to-br from-secondary/5 via-transparent to-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <CardHeader className="relative z-10">
              <CardTitle className="flex items-center gap-2">
                <div className="relative">
                  <div className="absolute inset-0 bg-secondary/20 rounded-lg blur-sm opacity-0 group-hover:opacity-100 transition-opacity" />
                  <TrendingUp className="relative h-5 w-5 text-secondary" />
                </div>
                میانگین بازدهی
              </CardTitle>
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                {totalInvestment > 0 
                  ? `${toPersianDigits(((totalProfit / totalInvestment) * 100).toFixed(2))}٪`
                  : '۰٪'
                }
              </div>
              <p className="text-sm text-muted-foreground/70 mt-2">
                بازدهی کل
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          {investors.map((investor) => {
            const investorTransactions = transactions.filter(t => t.investorId === investor.id);
            const profitTransactions = investorTransactions.filter(t => t.type === 'profit_payment');
            
            return (
              <Card key={`${investor.id}-${investor.startDate}`} className="relative overflow-hidden bg-card/80 backdrop-blur-sm hover:shadow-xl hover:scale-[1.01] transition-all duration-300 group">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <CardHeader className="relative z-10">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <CardTitle className="text-lg font-bold">{investor.name}</CardTitle>
                      <p className="text-sm text-muted-foreground/70 mt-1">
                        {toPersianDigits(investor.phone)} | کد ملی: {toPersianDigits(investor.nationalId)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge 
                        variant={investor.status === 'active' ? 'default' : 'secondary'}
                        className={cn(
                          investor.status === 'active' && "bg-success/10 text-success border-success/20"
                        )}
                      >
                        {investor.status === 'active' ? 'فعال' : 'غیرفعال'}
                      </Badge>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => showPaymentConfirm(investor, true)}
                        disabled={!isPaymentDue(investor)}
                        className={cn(
                          "gap-1 hover:scale-105 transition-all duration-200",
                          isPaymentDue(investor)
                            ? "text-success hover:bg-success/10 hover:border-success/50 border-success/30"
                            : "opacity-50 cursor-not-allowed"
                        )}
                      >
                        <TrendingUp className="h-3 w-3" />
                        سود ماهیانه
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => showPaymentConfirm(investor, false)}
                        disabled={calculateAccruedProfit(investor).days < 1}
                        className="gap-1 text-warning hover:bg-warning/10 hover:border-warning/50 hover:scale-105 transition-all duration-200"
                      >
                        <DollarSign className="h-3 w-3" />
                        سود تا امروز
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(investor)}
                        className="gap-1 text-secondary hover:bg-secondary/10 hover:border-secondary/50 hover:scale-105 transition-all duration-200"
                      >
                        <Edit className="h-3 w-3" />
                        ویرایش
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleCapitalAdjust(investor, 'add')}
                        className="gap-1 text-primary hover:bg-primary/10 hover:border-primary/50 hover:scale-105 transition-all duration-200"
                      >
                        <ArrowUp className="h-3 w-3" />
                        افزودن
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleCapitalAdjust(investor, 'withdraw')}
                        className="gap-1 text-destructive hover:bg-destructive/10 hover:border-destructive/50 hover:scale-105 transition-all duration-200"
                        disabled={investor.investmentAmount <= 0}
                      >
                        <ArrowDown className="h-3 w-3" />
                        برداشت
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(investor.id, investor.name)}
                        className="text-destructive hover:text-destructive hover:bg-destructive/10 hover:scale-110 transition-all duration-200"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="relative z-10">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="p-2 rounded-lg hover:bg-accent/30 transition-colors duration-200">
                      <div className="text-sm text-muted-foreground/70 mb-1">سرمایه‌گذاری</div>
                      <div className="font-bold text-foreground">{formatCurrency(investor.investmentAmount)}</div>
                    </div>
                    <div className="p-2 rounded-lg hover:bg-primary/10 transition-colors duration-200">
                      <div className="text-sm text-muted-foreground/70 mb-1">درصد سود</div>
                      <div className="font-bold text-primary">{toPersianDigits(investor.profitRate.toString())}٪</div>
                    </div>
                    <div className="p-2 rounded-lg hover:bg-success/10 transition-colors duration-200">
                      <div className="text-sm text-muted-foreground/70 mb-1">کل سود دریافتی</div>
                      <div className="font-bold text-success">{formatCurrency(investor.totalProfit)}</div>
                    </div>
                    <div className="p-2 rounded-lg hover:bg-accent/30 transition-colors duration-200">
                      <div className="text-sm text-muted-foreground/70 mb-1">تاریخ شروع</div>
                      <div className="font-bold text-foreground">{toJalaliDate(investor.startDate)}</div>
                    </div>
                  </div>
                  
                  {/* سود روزانه و سود تا امروز */}
                  <div className="mt-3 grid grid-cols-2 gap-3">
                    <div className="p-3 rounded-lg bg-gradient-to-br from-secondary/10 to-secondary/5 border border-secondary/20">
                      <div className="text-xs text-muted-foreground mb-1">سود روزانه</div>
                      <div className="font-bold text-secondary">{formatCurrency(calculateDailyProfit(investor))}</div>
                    </div>
                    <div className="p-3 rounded-lg bg-gradient-to-br from-warning/10 to-warning/5 border border-warning/20">
                      <div className="text-xs text-muted-foreground mb-1">
                        سود تا امروز ({toPersianDigits(calculateAccruedProfit(investor).days)} روز)
                      </div>
                      <div className="font-bold text-warning">{formatCurrency(calculateAccruedProfit(investor).profit)}</div>
                    </div>
                  </div>
                  <div className="mt-4 pt-4 border-t border-border/50">
                    <div className="flex justify-between items-center mb-2">
                      <div className="text-sm text-muted-foreground/70">
                        {toPersianDigits(profitTransactions.length)} پرداخت سود
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setDetailsDialog({ open: true, investorId: investor.id })}
                        className="gap-2 hover:bg-primary/10 hover:border-primary/50 hover:scale-105 transition-all duration-200"
                      >
                        <Eye className="h-3 w-3" />
                        جزئیات
                      </Button>
                    </div>
                    {!isPaymentDue(investor) && (
                      <div className="text-xs text-muted-foreground/60 flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        پرداخت بعدی: {toJalaliDate(getNextPaymentDate(investor).toISOString())}
                      </div>
                    )}
                    {isPaymentDue(investor) && (
                      <div className="text-xs text-success flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        زمان پرداخت سود رسیده است
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {investors.length === 0 && (
          <Card className="relative overflow-hidden bg-card/80 backdrop-blur-sm">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5" />
            <CardContent className="flex flex-col items-center justify-center py-12 relative z-10">
              <div className="relative mb-4">
                <div className="absolute inset-0 bg-primary/20 rounded-full blur-lg" />
                <DollarSign className="relative h-12 w-12 text-primary" />
              </div>
              <p className="text-muted-foreground/70 text-center">
                هنوز سرمایه‌گذاری ثبت نشده است
              </p>
            </CardContent>
          </Card>
        )}

        {/* Dialog جزئیات سرمایه‌گذار */}
        <Dialog open={detailsDialog.open} onOpenChange={(open) => setDetailsDialog({ ...detailsDialog, open })}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-primary via-secondary to-primary bg-clip-text text-transparent">
                جزئیات سرمایه‌گذار
              </DialogTitle>
            </DialogHeader>
            {(() => {
              const investor = investors.find(i => i.id === detailsDialog.investorId);
              if (!investor) return null;
              
              const investorTransactions = transactions.filter(t => t.investorId === investor.id);
              const profitTransactions = investorTransactions.filter(t => t.type === 'profit_payment');
              const totalProfitPaid = profitTransactions.reduce((sum, t) => sum + t.amount, 0);
              const returnPercentage = investor.investmentAmount > 0 
                ? (investor.totalProfit / investor.investmentAmount) * 100 
                : 0;
              
              return (
                <div className="space-y-6">
                  {/* خلاصه آماری */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <Card className="relative overflow-hidden bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border-primary/20">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="text-xs text-muted-foreground mb-1">سرمایه‌گذاری</div>
                            <div className="text-lg font-bold text-primary">{formatCurrency(investor.investmentAmount)}</div>
                          </div>
                          <Wallet className="h-8 w-8 text-primary/40" />
                        </div>
                      </CardContent>
                    </Card>
                    <Card className="relative overflow-hidden bg-gradient-to-br from-success/10 via-success/5 to-transparent border-success/20">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="text-xs text-muted-foreground mb-1">کل سود</div>
                            <div className="text-lg font-bold text-success">{formatCurrency(investor.totalProfit)}</div>
                          </div>
                          <TrendingUp className="h-8 w-8 text-success/40" />
                        </div>
                      </CardContent>
                    </Card>
                    <Card className="relative overflow-hidden bg-gradient-to-br from-secondary/10 via-secondary/5 to-transparent border-secondary/20">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="text-xs text-muted-foreground mb-1">بازدهی</div>
                            <div className="text-lg font-bold text-secondary">{toPersianDigits(returnPercentage.toFixed(2))}%</div>
                          </div>
                          <Percent className="h-8 w-8 text-secondary/40" />
                        </div>
                      </CardContent>
                    </Card>
                    <Card className="relative overflow-hidden bg-gradient-to-br from-warning/10 via-warning/5 to-transparent border-warning/20">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="text-xs text-muted-foreground mb-1">پرداخت‌ها</div>
                            <div className="text-lg font-bold text-warning">{toPersianDigits(profitTransactions.length)}</div>
                          </div>
                          <Activity className="h-8 w-8 text-warning/40" />
                        </div>
                      </CardContent>
                    </Card>
                  </div>

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
                          اطلاعات شخصی
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="relative z-10 space-y-3">
                        <div className="flex items-center justify-between p-3 rounded-lg border border-border/50 hover:bg-accent/30 transition-colors">
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm text-muted-foreground">نام</span>
                          </div>
                          <span className="font-semibold">{investor.name}</span>
                        </div>
                        <div className="flex items-center justify-between p-3 rounded-lg border border-border/50 hover:bg-accent/30 transition-colors">
                          <div className="flex items-center gap-2">
                            <Phone className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm text-muted-foreground">شماره تماس</span>
                          </div>
                          <span className="font-medium" dir="ltr">{toPersianDigits(investor.phone)}</span>
                        </div>
                        <div className="flex items-center justify-between p-3 rounded-lg border border-border/50 hover:bg-accent/30 transition-colors">
                          <div className="flex items-center gap-2">
                            <IdCard className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm text-muted-foreground">کد ملی</span>
                          </div>
                          <span className="font-medium">{toPersianDigits(investor.nationalId)}</span>
                        </div>
                        <div className="flex items-center justify-between p-3 rounded-lg border border-border/50 hover:bg-accent/30 transition-colors">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm text-muted-foreground">تاریخ شروع</span>
                          </div>
                          <span className="font-medium">{toJalaliDate(investor.startDate)}</span>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="relative overflow-hidden group">
                      <div className="absolute inset-0 bg-gradient-to-br from-secondary/5 via-transparent to-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      <CardHeader className="relative z-10 pb-3">
                        <CardTitle className="flex items-center gap-2 text-base font-semibold">
                          <div className="relative">
                            <div className="absolute inset-0 bg-secondary/20 rounded-lg blur-sm" />
                            <DollarSign className="relative h-4 w-4 text-secondary" />
                          </div>
                          اطلاعات مالی
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="relative z-10 space-y-3">
                        <div className="p-3 rounded-lg border border-border/50 hover:bg-accent/30 transition-colors">
                          <div className="text-xs text-muted-foreground mb-1">درصد سود</div>
                          <div className="text-lg font-bold text-primary">{toPersianDigits(investor.profitRate.toString())}٪</div>
                        </div>
                        <div className="p-3 rounded-lg border border-border/50 hover:bg-accent/30 transition-colors">
                          <div className="text-xs text-muted-foreground mb-1">میانگین پرداخت</div>
                          <div className="text-lg font-bold text-secondary">
                            {profitTransactions.length > 0 
                              ? formatCurrency(totalProfitPaid / profitTransactions.length)
                              : formatCurrency(0)
                            }
                          </div>
                        </div>
                        <div className="p-3 rounded-lg border border-border/50 bg-gradient-to-br from-success/10 to-primary/10">
                          <div className="text-xs text-muted-foreground mb-1">کل سود دریافتی</div>
                          <div className="text-xl font-bold bg-gradient-to-r from-success to-primary bg-clip-text text-transparent">
                            {formatCurrency(investor.totalProfit)}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* تاریخچه تراکنش‌ها */}
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center gap-2 text-base font-semibold">
                        <FileText className="h-4 w-4 text-primary" />
                        تاریخچه تراکنش‌ها
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {investorTransactions.length === 0 ? (
                        <div className="text-center py-8">
                          <div className="relative mb-4 inline-block">
                            <div className="absolute inset-0 bg-primary/20 rounded-full blur-lg" />
                            <FileText className="relative h-12 w-12 text-primary mx-auto" />
                          </div>
                          <p className="text-sm text-muted-foreground/70">
                            هنوز تراکنشی ثبت نشده است
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {investorTransactions.map((trans, index) => {
                            const Icon = trans.type === 'profit_payment' ? ArrowDown : 
                                        trans.type === 'investment_add' ? ArrowUp : ArrowDown;
                            const isProfit = trans.type === 'profit_payment';
                            
                            return (
                              <div
                                key={trans.id}
                                className={cn(
                                  "p-4 rounded-lg border transition-all duration-200 hover:scale-[1.01]",
                                  isProfit 
                                    ? "bg-success/5 border-success/20 hover:bg-success/10" 
                                    : trans.type === 'investment_add'
                                    ? "bg-primary/5 border-primary/20 hover:bg-primary/10"
                                    : "bg-destructive/5 border-destructive/20 hover:bg-destructive/10"
                                )}
                                style={{ animationDelay: `${index * 30}ms` }}
                              >
                                <div className="flex items-start justify-between">
                                  <div className="flex items-start gap-3 flex-1">
                                    <div className={cn(
                                      "p-2 rounded-lg",
                                      isProfit ? "bg-success/10" : 
                                      trans.type === 'investment_add' ? "bg-primary/10" : "bg-destructive/10"
                                    )}>
                                      <Icon className={cn(
                                        "h-4 w-4",
                                        isProfit ? "text-success" : 
                                        trans.type === 'investment_add' ? "text-primary" : "text-destructive"
                                      )} />
                                    </div>
                                    <div className="flex-1">
                                      <div className="flex items-center gap-2 mb-1">
                                        <span className="font-semibold">
                                          {trans.type === 'profit_payment' ? 'پرداخت سود' : 
                                           trans.type === 'investment_add' ? 'افزایش سرمایه' : 'برداشت سرمایه'}
                                        </span>
                                        <Badge 
                                          variant="outline"
                                          className={cn(
                                            "text-xs",
                                            isProfit && "bg-success/10 text-success border-success/20",
                                            trans.type === 'investment_add' && "bg-primary/10 text-primary border-primary/20",
                                            trans.type === 'investment_withdraw' && "bg-destructive/10 text-destructive border-destructive/20"
                                          )}
                                        >
                                          {isProfit ? 'پرداخت' : trans.type === 'investment_add' ? 'افزایش' : 'برداشت'}
                                        </Badge>
                                      </div>
                                      <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                                        <Calendar className="h-3 w-3" />
                                        {toJalaliDate(trans.date)}
                                      </div>
                                      {trans.description && (
                                        <p className="text-xs text-muted-foreground/70 mt-1">
                                          {trans.description}
                                        </p>
                                      )}
                                    </div>
                                  </div>
                                  <div className="text-left min-w-[140px]">
                                    <div className={cn(
                                      "text-lg font-bold",
                                      isProfit ? "text-success" : 
                                      trans.type === 'investment_add' ? "text-primary" : "text-destructive"
                                    )}>
                                      {isProfit ? '+' : trans.type === 'investment_add' ? '+' : '-'}
                                      {formatCurrency(trans.amount)}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              );
            })()}
          </DialogContent>
        </Dialog>

        {/* Dialog تغییر سرمایه */}
        <Dialog open={capitalAdjustDialog.open} onOpenChange={(open) => setCapitalAdjustDialog({ ...capitalAdjustDialog, open })}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold bg-gradient-to-r from-primary via-secondary to-primary bg-clip-text text-transparent flex items-center gap-2">
                {capitalAdjustDialog.type === 'add' ? (
                  <ArrowUp className="h-5 w-5 text-primary" />
                ) : (
                  <ArrowDown className="h-5 w-5 text-destructive" />
                )}
                {capitalAdjustDialog.type === 'add' ? 'افزودن سرمایه' : 'برداشت سرمایه'}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <Card className="relative overflow-hidden bg-gradient-to-br from-primary/5 via-transparent to-secondary/5 border-primary/20">
                <CardContent className="p-4">
                  <div className="text-sm text-muted-foreground mb-1">سرمایه‌گذار</div>
                  <div className="font-bold text-lg">{capitalAdjustDialog.investorName}</div>
                  <div className="text-sm text-muted-foreground mt-2">
                    سرمایه فعلی: <span className="font-semibold text-foreground">{formatCurrency(capitalAdjustDialog.currentCapital)}</span>
                  </div>
                </CardContent>
              </Card>

              <div className="space-y-2">
                <Label htmlFor="capitalAmount" className="text-sm font-semibold flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  {capitalAdjustDialog.type === 'add' ? 'مبلغ افزودن' : 'مبلغ برداشت'} (تومان)
                </Label>
                <Input
                  id="capitalAmount"
                  type="text"
                  value={capitalAmount}
                  onChange={handleCapitalAmountChange}
                  placeholder="مثال: ۱۰,۰۰۰,۰۰۰"
                  dir="ltr"
                  className="text-lg font-semibold"
                />
                {capitalAdjustDialog.type === 'withdraw' && capitalAmount && (
                  <div className="text-xs text-muted-foreground">
                    سرمایه پس از برداشت: {formatCurrency(capitalAdjustDialog.currentCapital - parseFloat(capitalAmount.replace(/,/g, '') || '0'))}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="capitalDescription" className="text-sm font-semibold flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  توضیحات (اختیاری)
                </Label>
                <Input
                  id="capitalDescription"
                  value={capitalDescription}
                  onChange={(e) => setCapitalDescription(e.target.value)}
                  placeholder="توضیحات تغییر سرمایه..."
                />
              </div>

              <div className="flex gap-3 pt-2">
                <Button
                  variant="outline"
                  onClick={() => setCapitalAdjustDialog({ ...capitalAdjustDialog, open: false })}
                  className="flex-1"
                >
                  انصراف
                </Button>
                <Button
                  onClick={confirmCapitalAdjust}
                  className={cn(
                    "flex-1",
                    capitalAdjustDialog.type === 'add' 
                      ? "bg-gradient-to-r from-primary via-secondary to-primary hover:opacity-90"
                      : "bg-gradient-to-r from-destructive to-destructive/80 hover:from-destructive/90 hover:to-destructive/70"
                  )}
                >
                  <CheckCircle2 className="h-4 w-4 ml-2" />
                  {capitalAdjustDialog.type === 'add' ? 'افزودن' : 'برداشت'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Dialog تایید پرداخت سود */}
        <Dialog open={paymentConfirmDialog.open} onOpenChange={(open) => setPaymentConfirmDialog({ ...paymentConfirmDialog, open })}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-success via-primary to-success bg-clip-text text-transparent flex items-center gap-2">
                <CheckCircle2 className="h-6 w-6 text-success" />
                تایید پرداخت سود
              </DialogTitle>
            </DialogHeader>
            {paymentConfirmDialog.investor && (
              <div className="space-y-4">
                {/* اطلاعات سرمایه‌گذار */}
                <Card className="relative overflow-hidden bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border-primary/30">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="p-2 rounded-full bg-primary/20">
                        <User className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <div className="font-bold text-lg">{paymentConfirmDialog.investor.name}</div>
                        <div className="text-sm text-muted-foreground">سرمایه‌گذار</div>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <span className="text-muted-foreground">سرمایه:</span>
                        <span className="font-semibold mr-2">{formatCurrency(paymentConfirmDialog.investor.investmentAmount)}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">درصد سود:</span>
                        <span className="font-semibold mr-2">{toPersianDigits(paymentConfirmDialog.investor.profitRate.toString())}٪</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* جزئیات پرداخت */}
                <Card className="relative overflow-hidden bg-gradient-to-br from-success/10 via-success/5 to-transparent border-success/30">
                  <CardContent className="p-4">
                    <div className="text-sm font-semibold mb-3 flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-success" />
                      جزئیات پرداخت
                    </div>
                    {paymentConfirmDialog.isFullMonth ? (
                      <div className="space-y-2">
                        <div className="flex justify-between items-center p-2 rounded-lg bg-muted/50">
                          <span className="text-sm text-muted-foreground">نوع پرداخت:</span>
                          <span className="font-semibold">سود ماهیانه کامل</span>
                        </div>
                        <div className="flex justify-between items-center p-2 rounded-lg bg-muted/50">
                          <span className="text-sm text-muted-foreground">محاسبه:</span>
                          <span className="font-semibold text-sm">
                            {formatCurrency(paymentConfirmDialog.investor.investmentAmount)} × {toPersianDigits(paymentConfirmDialog.investor.profitRate.toString())}٪
                          </span>
                        </div>
                        <div className="flex justify-between items-center p-3 rounded-lg bg-success/20 border border-success/30 mt-3">
                          <span className="font-semibold">مبلغ قابل پرداخت:</span>
                          <span className="text-xl font-bold text-success">
                            {formatCurrency((paymentConfirmDialog.investor.profitRate / 100) * paymentConfirmDialog.investor.investmentAmount)}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <div className="flex justify-between items-center p-2 rounded-lg bg-muted/50">
                          <span className="text-sm text-muted-foreground">نوع پرداخت:</span>
                          <span className="font-semibold">سود تا امروز (روزانه)</span>
                        </div>
                        <div className="flex justify-between items-center p-2 rounded-lg bg-muted/50">
                          <span className="text-sm text-muted-foreground">تعداد روزها:</span>
                          <span className="font-semibold">{toPersianDigits(calculateAccruedProfit(paymentConfirmDialog.investor).days)} روز</span>
                        </div>
                        <div className="flex justify-between items-center p-2 rounded-lg bg-muted/50">
                          <span className="text-sm text-muted-foreground">سود روزانه:</span>
                          <span className="font-semibold text-sm">{formatCurrency(calculateDailyProfit(paymentConfirmDialog.investor))}</span>
                        </div>
                        <div className="flex justify-between items-center p-3 rounded-lg bg-warning/20 border border-warning/30 mt-3">
                          <span className="font-semibold">مبلغ قابل پرداخت:</span>
                          <span className="text-xl font-bold text-warning">
                            {formatCurrency(calculateAccruedProfit(paymentConfirmDialog.investor).profit)}
                          </span>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* هشدار */}
                <Card className="relative overflow-hidden bg-gradient-to-br from-blue-500/10 via-blue-500/5 to-transparent border-blue-500/30">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
                      <div className="text-sm text-muted-foreground">
                        <p className="font-semibold text-blue-500 mb-1">توجه:</p>
                        <p>این مبلغ به حساب سرمایه‌گذار پرداخت و از سود خالص کسر می‌شود.</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* دکمه‌ها */}
                <div className="flex gap-3 pt-2">
                  <Button
                    variant="outline"
                    onClick={() => setPaymentConfirmDialog({ open: false, investor: null, isFullMonth: true })}
                    className="flex-1 h-11"
                  >
                    انصراف
                  </Button>
                  <Button
                    onClick={confirmPayProfit}
                    className={cn(
                      "flex-1 h-11 text-base font-semibold shadow-lg hover:shadow-xl transition-all duration-200",
                      paymentConfirmDialog.isFullMonth
                        ? "bg-gradient-to-r from-success via-primary to-success hover:opacity-90"
                        : "bg-gradient-to-r from-warning via-orange-500 to-warning hover:opacity-90"
                    )}
                  >
                    <CheckCircle2 className="h-4 w-4 ml-2" />
                    تایید و پرداخت
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* AlertDialog حذف سرمایه‌گذار */}
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
                  حذف سرمایه‌گذار
                </AlertDialogTitle>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 space-y-4 bg-background">
              <AlertDialogDescription className="text-right space-y-4">
                <div className="p-4 rounded-lg bg-muted/50 border border-border/50">
                  <p className="text-base font-semibold text-foreground mb-2">
                    سرمایه‌گذار مورد نظر:
                  </p>
                  <p className="text-lg font-bold text-primary bg-primary/10 px-3 py-2 rounded-md inline-block">
                    {deleteDialog.investorName}
                  </p>
                </div>
                
                <div className="p-4 rounded-lg bg-destructive/5 border border-destructive/20">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-full bg-destructive/10 flex-shrink-0">
                      <AlertCircle className="h-5 w-5 text-destructive" />
                    </div>
                    <div className="flex-1 space-y-2">
                      <p className="text-sm font-semibold text-destructive">
                        هشدار مهم
                      </p>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        این عمل غیرقابل بازگشت است و تمام اطلاعات مرتبط با این سرمایه‌گذار از جمله:
                      </p>
                      <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside mr-4">
                        <li>مبلغ سرمایه‌گذاری</li>
                        <li>تاریخچه پرداخت سود</li>
                        <li>اطلاعات مالی</li>
                      </ul>
                      <p className="text-sm font-semibold text-destructive mt-2">
                        برای همیشه حذف خواهند شد.
                      </p>
                    </div>
                  </div>
                </div>

                <p className="text-center text-sm text-muted-foreground pt-2">
                  آیا از حذف این سرمایه‌گذار اطمینان دارید؟
                </p>
              </AlertDialogDescription>
            </div>

            {/* Footer */}
            <AlertDialogFooter className="p-6 pt-0 gap-3 bg-background">
              <AlertDialogCancel className="flex-1 h-11 text-base font-semibold border-2 hover:bg-accent hover:border-accent-foreground/20 transition-all duration-200">
                انصراف
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={confirmDelete}
                className="flex-1 h-11 text-base font-semibold bg-gradient-to-r from-destructive to-destructive/80 hover:from-destructive/90 hover:to-destructive/70 text-white shadow-lg hover:shadow-xl transition-all duration-200"
              >
                <Trash2 className="h-4 w-4 ml-2" />
                حذف سرمایه‌گذار
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </Layout>
  );
};

export default Investors;
