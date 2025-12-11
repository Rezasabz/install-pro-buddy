import { useState, useEffect, useCallback } from "react";
import Layout from "@/components/Layout";
import { LoadingOverlay } from "@/components/LoadingOverlay";
import { useDataContext } from "@/contexts/DataContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { partnersStore, Partner, transactionsStore, Transaction, salesStore, installmentsStore } from "@/lib/storeProvider";
import { formatCurrency, toPersianDigits } from "@/lib/persian";
import { calculateFinancialsFromData, PartnerFinancials } from "@/lib/profitCalculator";
import { Plus, Edit, Trash2, Users, TrendingUp, DollarSign, ArrowUp, ArrowDown, Eye, Percent, CreditCard, Wallet, PieChart, Activity, Calendar, FileText, Sparkles, Target, Zap, User, CheckCircle2, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { JalaliDatePicker } from "@/components/JalaliDatePicker";

const Partners = () => {
  const [partners, setPartners] = useState<Partner[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [partnerFinancials, setPartnerFinancials] = useState<Map<string, PartnerFinancials>>(new Map());
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPartner, setEditingPartner] = useState<Partner | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    capital: "",
  });
  const [joinDate, setJoinDate] = useState<Date>(new Date());
  const [transactionDialog, setTransactionDialog] = useState<{
    open: boolean;
    partnerId: string;
    type: 'capital_add' | 'capital_withdraw' | 'initial_profit_withdraw' | 'monthly_profit_withdraw' | 'profit_to_capital';
  }>({ open: false, partnerId: '', type: 'capital_add' });
  const [transactionAmount, setTransactionAmount] = useState("");
  const [transactionDescription, setTransactionDescription] = useState("");
  const [profitType, setProfitType] = useState<'initial' | 'monthly' | 'both'>('both');
  const [transactionHistoryDialog, setTransactionHistoryDialog] = useState<{
    open: boolean;
    partnerId: string;
  }>({ open: false, partnerId: '' });
  const [partnerDetailsDialog, setPartnerDetailsDialog] = useState<{ open: boolean; partnerId: string }>({ open: false, partnerId: '' });
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; partnerId: string; partnerName: string }>({ open: false, partnerId: '', partnerName: '' });
  const [partnerTransactions, setPartnerTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("");
  const { toast } = useToast();
  const { refreshDashboard } = useDataContext();

  const loadPartners = useCallback(async () => {
    try {
      const [data, sales, installments] = await Promise.all([
        partnersStore.getAll(),
        salesStore.getAll(),
        installmentsStore.getAll(),
      ]);
      
      // محاسبه سهم هر شریک بر اساس سرمایه
      const totalCapital = data.reduce((sum, p) => sum + p.capital, 0);
      const partnersWithShare = data.map(p => ({
        ...p,
        share: totalCapital > 0 ? (p.capital / totalCapital) * 100 : 0,
      }));
      setPartners(partnersWithShare);

      // محاسبه وضعیت مالی هر شریک با در نظر گیری تمام شرکا (شامل غیرفعال‌ها)
      const allPartnersIncludingInactive = await partnersStore.getAllIncludingInactive();
      const financials = calculateFinancialsFromData(data, sales, installments, allPartnersIncludingInactive);
      const financialMap = new Map<string, PartnerFinancials>();
      financials.partnerFinancials.forEach(p => {
        financialMap.set(p.partnerId, p);
      });
      setPartnerFinancials(financialMap);
    } catch (error) {
      console.error('Error loading partners:', error);
      toast({
        title: "خطا",
        description: "خطا در بارگذاری شرکا",
        variant: "destructive",
      });
    }
  }, [toast]);

  useEffect(() => {
    loadPartners();
  }, [loadPartners]);

  // Listen for refresh events from other pages
  useEffect(() => {
    const handleRefresh = () => {
      loadPartners();
    };

    window.addEventListener('refreshPartners', handleRefresh);
    return () => {
      window.removeEventListener('refreshPartners', handleRefresh);
    };
  }, [loadPartners]);

  // Load transactions when dialog opens
  useEffect(() => {
    if (transactionHistoryDialog.open && transactionHistoryDialog.partnerId) {
      transactionsStore.getByPartnerId(transactionHistoryDialog.partnerId).then(txs => {
        setPartnerTransactions(txs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
      });
    }
  }, [transactionHistoryDialog.open, transactionHistoryDialog.partnerId]);

  const handleCapitalChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const numericValue = value.replace(/[^\d]/g, '');
    
    if (numericValue === '') {
      setFormData({ ...formData, capital: '' });
      return;
    }
    
    const number = parseInt(numericValue, 10);
    const formatted = number.toLocaleString('en-US');
    setFormData({ ...formData, capital: formatted });
  };

  const handleTransactionAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const numericValue = value.replace(/[^\d]/g, '');
    
    if (numericValue === '') {
      setTransactionAmount('');
      return;
    }
    
    const number = parseInt(numericValue, 10);
    const formatted = number.toLocaleString('en-US');
    setTransactionAmount(formatted);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const capital = parseFloat(formData.capital.replace(/,/g, ''));
    if (isNaN(capital) || capital <= 0) {
      toast({
        title: "خطا",
        description: "لطفاً مبلغ سرمایه معتبر وارد کنید",
        variant: "destructive",
      });
      return;
    }

    // بستن dialog و نمایش loading
    setIsDialogOpen(false);
    setIsLoading(true);
    setLoadingMessage(editingPartner ? "در حال بروزرسانی شریک..." : "در حال افزودن شریک...");
    
    try {
      if (editingPartner) {
        await partnersStore.update(editingPartner.id, {
          name: formData.name,
          capital,
        });
        toast({
          title: "موفق",
          description: "شریک با موفقیت بروزرسانی شد",
        });
      } else {
        await partnersStore.add({
          name: formData.name,
          capital,
          share: 0,
          joinDate: joinDate.toISOString(),
        });
        
        toast({
          title: "موفق",
          description: "شریک جدید اضافه شد",
        });
      }

      setFormData({ name: "", capital: "" });
      setJoinDate(new Date());
      setEditingPartner(null);
      loadPartners();
    } catch (error) {
      console.error('Error saving partner:', error);
      toast({
        title: "خطا",
        description: "خطا در ذخیره شریک",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      setLoadingMessage("");
    }
  };

  const handleEdit = (partner: Partner) => {
    setEditingPartner(partner);
    setFormData({
      name: partner.name,
      capital: partner.capital.toLocaleString('en-US'),
    });
    setJoinDate(new Date(partner.createdAt));
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string, name: string) => {
    setDeleteDialog({ open: true, partnerId: id, partnerName: name });
  };

  const confirmDelete = async () => {
    try {
      await partnersStore.delete(deleteDialog.partnerId);
      toast({
        title: "موفق",
        description: "شریک با موفقیت حذف شد",
      });
      setDeleteDialog({ open: false, partnerId: '', partnerName: '' });
      loadPartners();
    } catch (error) {
      console.error('Error deleting partner:', error);
      toast({
        title: "خطا",
        description: "خطا در حذف شریک",
        variant: "destructive",
      });
    }
  };

  const handleTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const amount = parseFloat(transactionAmount.replace(/,/g, ''));
    if (isNaN(amount) || amount <= 0) {
      toast({
        title: "خطا",
        description: "مبلغ نامعتبر است",
        variant: "destructive",
      });
      return;
    }

    const partner = partners.find(p => p.id === transactionDialog.partnerId);
    if (!partner) return;

    // بررسی موجودی برای برداشت (قبل از بستن dialog)
    if (transactionDialog.type === 'capital_withdraw' && amount > partner.availableCapital) {
      toast({
        title: "خطا",
        description: `سرمایه در دسترس کافی نیست. موجودی: ${formatCurrency(partner.availableCapital)}`,
        variant: "destructive",
      });
      return;
    }

    if (transactionDialog.type === 'initial_profit_withdraw' && amount > partner.initialProfit) {
      toast({
        title: "خطا",
        description: `سود اولیه کافی نیست. موجودی: ${formatCurrency(partner.initialProfit)}`,
        variant: "destructive",
      });
      return;
    }

    if (transactionDialog.type === 'monthly_profit_withdraw' && amount > partner.monthlyProfit) {
      toast({
        title: "خطا",
        description: `سود ماهانه کافی نیست. موجودی: ${formatCurrency(partner.monthlyProfit)}`,
        variant: "destructive",
      });
      return;
    }

    if (transactionDialog.type === 'profit_to_capital') {
      let availableProfit = 0;
      if (profitType === 'initial') {
        availableProfit = partner.initialProfit;
      } else if (profitType === 'monthly') {
        availableProfit = partner.monthlyProfit;
      } else {
        availableProfit = partner.initialProfit + partner.monthlyProfit;
      }

      if (amount > availableProfit) {
        toast({
          title: "خطا",
          description: `سود کافی نیست. موجودی: ${formatCurrency(availableProfit)}`,
          variant: "destructive",
        });
        return;
      }
    }
    
    // بستن dialog و نمایش loading
    setTransactionDialog({ open: false, partnerId: '', type: 'capital_add' });
    setIsLoading(true);
    setLoadingMessage("در حال ثبت تراکنش...");

    try {
      // ثبت تراکنش
      await transactionsStore.add({
        partnerId: transactionDialog.partnerId,
        type: transactionDialog.type,
        amount,
        description: transactionDescription || getTransactionLabel(transactionDialog.type),
        profitType: transactionDialog.type === 'profit_to_capital' ? profitType : undefined,
      });

      // بروزرسانی حساب شریک
      if (transactionDialog.type === 'capital_add') {
        await partnersStore.update(transactionDialog.partnerId, {
          capital: partner.capital + amount,
          availableCapital: partner.availableCapital + amount,
        });
      } else if (transactionDialog.type === 'capital_withdraw') {
        await partnersStore.update(transactionDialog.partnerId, {
          capital: partner.capital - amount,
          availableCapital: partner.availableCapital - amount,
        });
      } else if (transactionDialog.type === 'initial_profit_withdraw') {
        await partnersStore.update(transactionDialog.partnerId, {
          initialProfit: partner.initialProfit - amount,
        });
      } else if (transactionDialog.type === 'monthly_profit_withdraw') {
        await partnersStore.update(transactionDialog.partnerId, {
          monthlyProfit: partner.monthlyProfit - amount,
        });
      } else if (transactionDialog.type === 'profit_to_capital') {
      // تبدیل سود به سرمایه
      let initialDeduction = 0;
      let monthlyDeduction = 0;

      if (profitType === 'initial') {
        initialDeduction = amount;
      } else if (profitType === 'monthly') {
        monthlyDeduction = amount;
      } else {
        // both: اول از سود اولیه کم می‌کنیم
        let remaining = amount;
        if (partner.initialProfit > 0) {
          initialDeduction = Math.min(remaining, partner.initialProfit);
          remaining -= initialDeduction;
        }
        // بقیه از سود ماهانه
        if (remaining > 0 && partner.monthlyProfit > 0) {
          monthlyDeduction = Math.min(remaining, partner.monthlyProfit);
        }
      }

      partnersStore.update(transactionDialog.partnerId, {
        initialProfit: partner.initialProfit - initialDeduction,
        monthlyProfit: partner.monthlyProfit - monthlyDeduction,
        capital: partner.capital + amount,
        availableCapital: partner.availableCapital + amount,
      });
    }

      toast({
        title: "موفق",
        description: `${getTransactionLabel(transactionDialog.type)} با موفقیت ثبت شد`,
      });

      setTransactionAmount("");
      setTransactionDescription("");
      setProfitType('both');
      
      await loadPartners();
      refreshDashboard();
    } catch (error) {
      console.error('Error processing transaction:', error);
      toast({
        title: "خطا",
        description: "خطا در ثبت تراکنش",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      setLoadingMessage("");
    }
  };

  const getTransactionLabel = (type: string) => {
    switch (type) {
      case 'capital_add': return 'افزایش سرمایه';
      case 'capital_withdraw': return 'برداشت سرمایه';
      case 'initial_profit_withdraw': return 'برداشت سود اولیه';
      case 'monthly_profit_withdraw': return 'برداشت سود ماهانه';
      case 'profit_to_capital': return 'تبدیل سود به سرمایه';
      default: return '';
    }
  };

  // محاسبه خلاصه مالی از state
  const financialSummary = {
    totalCapital: partners.reduce((sum, p) => sum + p.capital, 0),
    totalAvailableCapital: partners.reduce((sum, p) => sum + p.availableCapital, 0),
    totalUsedCapital: partners.reduce((sum, p) => sum + (p.capital - p.availableCapital), 0),
    totalInitialProfit: partners.reduce((sum, p) => sum + (p.initialProfit || 0), 0),
    totalMonthlyProfit: partners.reduce((sum, p) => sum + (p.monthlyProfit || 0), 0),
    totalProfit: partners.reduce((sum, p) => sum + ((p.initialProfit || 0) + (p.monthlyProfit || 0)), 0),
    partnerFinancials: [],
  };

  return (
    <Layout>
      {isLoading && <LoadingOverlay message={loadingMessage} />}
      <div className="space-y-6 animate-fade-scale">
        <div className="flex flex-col sm:flex-row justify-between items-start gap-4 pb-2">
          <div className="space-y-1">
            <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-primary via-secondary to-primary bg-clip-text text-transparent bg-[length:200%_auto] animate-gradient">
              مدیریت شرکا
            </h1>
            <p className="text-muted-foreground/80 text-sm md:text-base">
              مدیریت سرمایه‌گذاری، سهم و سود شرکا
            </p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) {
              setFormData({ name: "", capital: "" });
              setJoinDate(new Date());
              setEditingPartner(null);
            }
          }}>
            <DialogTrigger asChild>
              <Button 
                onClick={() => {
                  setEditingPartner(null);
                  setFormData({ name: "", capital: "" });
                }}
                className="gap-2 hover:scale-105 transition-all duration-200"
              >
                <Plus className="h-4 w-4" />
                افزودن شریک
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {editingPartner ? "ویرایش شریک" : "افزودن شریک جدید"}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="name">نام شریک</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    required
                    placeholder="نام و نام خانوادگی"
                  />
                </div>
                <div>
                  <Label htmlFor="capital">مبلغ سرمایه (تومان)</Label>
                  <Input
                    id="capital"
                    type="text"
                    value={formData.capital}
                    onChange={handleCapitalChange}
                    required
                    placeholder="مثال: ۱۰,۰۰۰,۰۰۰"
                    dir="ltr"
                  />
                </div>
                {!editingPartner && (
                  <div>
                    <Label htmlFor="joinDate" className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      تاریخ ورود شریک
                    </Label>
                    <JalaliDatePicker
                      value={joinDate}
                      onChange={setJoinDate}
                      placeholder="انتخاب تاریخ ورود"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      شریک فقط از این تاریخ به بعد سهم سود خواهد داشت
                    </p>
                  </div>
                )}
                <Button type="submit" className="w-full">
                  {editingPartner ? "بروزرسانی" : "افزودن"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>

          {/* Dialog تراکنش مالی */}
          <Dialog open={transactionDialog.open} onOpenChange={(open) => setTransactionDialog({ ...transactionDialog, open })}>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle className="text-xl font-bold bg-gradient-to-r from-primary via-secondary to-primary bg-clip-text text-transparent flex items-center gap-2">
                  {transactionDialog.type === 'capital_add' && <ArrowUp className="h-5 w-5 text-success" />}
                  {transactionDialog.type === 'capital_withdraw' && <ArrowDown className="h-5 w-5 text-destructive" />}
                  {transactionDialog.type === 'initial_profit_withdraw' && <ArrowDown className="h-5 w-5 text-warning" />}
                  {transactionDialog.type === 'monthly_profit_withdraw' && <ArrowDown className="h-5 w-5 text-warning" />}
                  {transactionDialog.type === 'profit_to_capital' && <TrendingUp className="h-5 w-5 text-primary" />}
                  {getTransactionLabel(transactionDialog.type)}
                </DialogTitle>
              </DialogHeader>
              {(() => {
                const partner = partners.find(p => p.id === transactionDialog.partnerId);
                if (!partner) return null;
                
                const financial = partnerFinancials.get(partner.id);
                let maxAmount = 0;
                let availableLabel = '';
                
                if (transactionDialog.type === 'capital_withdraw') {
                  maxAmount = financial?.availableCapital || partner.availableCapital;
                  availableLabel = 'سرمایه در دسترس';
                } else if (transactionDialog.type === 'initial_profit_withdraw') {
                  maxAmount = partner.initialProfit;
                  availableLabel = 'سود اولیه';
                } else if (transactionDialog.type === 'monthly_profit_withdraw') {
                  maxAmount = partner.monthlyProfit;
                  availableLabel = 'سود ماهانه';
                } else if (transactionDialog.type === 'profit_to_capital') {
                  if (profitType === 'initial') {
                    maxAmount = partner.initialProfit;
                    availableLabel = 'سود اولیه';
                  } else if (profitType === 'monthly') {
                    maxAmount = partner.monthlyProfit;
                    availableLabel = 'سود ماهانه';
                  } else {
                    maxAmount = partner.initialProfit + partner.monthlyProfit;
                    availableLabel = 'کل سود';
                  }
                }

                return (
                  <form onSubmit={handleTransaction} className="space-y-4">
                    {/* اطلاعات شریک */}
                    <Card className="relative overflow-hidden bg-gradient-to-br from-primary/5 via-transparent to-secondary/5 border-primary/20">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="text-xs text-muted-foreground mb-1">شریک</div>
                            <div className="font-semibold">{partner.name}</div>
                          </div>
                          <Users className="h-6 w-6 text-primary/40" />
                        </div>
                      </CardContent>
                    </Card>

                    {/* موجودی/محدودیت */}
                    {maxAmount > 0 && transactionDialog.type !== 'capital_add' && (
                      <Card className="relative overflow-hidden bg-gradient-to-br from-warning/5 via-transparent to-warning/5 border-warning/20">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="text-xs text-muted-foreground mb-1">{availableLabel}</div>
                              <div className="font-bold text-warning">{formatCurrency(maxAmount)}</div>
                            </div>
                            <Wallet className="h-6 w-6 text-warning/40" />
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {/* انتخاب نوع سود (فقط برای تبدیل سود به سرمایه) */}
                    {transactionDialog.type === 'profit_to_capital' && (
                      <div className="space-y-3">
                        <Label className="text-sm font-semibold flex items-center gap-2">
                          <DollarSign className="h-4 w-4" />
                          نوع سود
                        </Label>
                        <div className="grid grid-cols-3 gap-2">
                          <Button
                            type="button"
                            variant={profitType === 'initial' ? 'default' : 'outline'}
                            onClick={() => setProfitType('initial')}
                            className={cn(
                              "flex flex-col items-center gap-1 h-auto py-3",
                              profitType === 'initial' && "bg-primary text-primary-foreground hover:bg-primary/90"
                            )}
                          >
                            <span className="text-xs font-semibold">سود اولیه</span>
                            <span className={cn(
                              "text-[10px]",
                              profitType === 'initial' ? "text-primary-foreground/80" : "text-muted-foreground"
                            )}>
                              {formatCurrency(partner.initialProfit)}
                            </span>
                          </Button>
                          <Button
                            type="button"
                            variant={profitType === 'monthly' ? 'default' : 'outline'}
                            onClick={() => setProfitType('monthly')}
                            className={cn(
                              "flex flex-col items-center gap-1 h-auto py-3",
                              profitType === 'monthly' && "bg-primary text-primary-foreground hover:bg-primary/90"
                            )}
                          >
                            <span className="text-xs font-semibold">سود ماهانه</span>
                            <span className={cn(
                              "text-[10px]",
                              profitType === 'monthly' ? "text-primary-foreground/80" : "text-muted-foreground"
                            )}>
                              {formatCurrency(partner.monthlyProfit)}
                            </span>
                          </Button>
                          <Button
                            type="button"
                            variant={profitType === 'both' ? 'default' : 'outline'}
                            onClick={() => setProfitType('both')}
                            className={cn(
                              "flex flex-col items-center gap-1 h-auto py-3",
                              profitType === 'both' && "bg-primary text-primary-foreground hover:bg-primary/90"
                            )}
                          >
                            <span className="text-xs font-semibold">هر دو</span>
                            <span className={cn(
                              "text-[10px]",
                              profitType === 'both' ? "text-primary-foreground/80" : "text-muted-foreground"
                            )}>
                              {formatCurrency(partner.initialProfit + partner.monthlyProfit)}
                            </span>
                          </Button>
                        </div>
                      </div>
                    )}

                    {/* مبلغ */}
                    <div className="space-y-2">
                      <Label htmlFor="amount" className="text-sm font-semibold flex items-center gap-2">
                        <DollarSign className="h-4 w-4" />
                        مبلغ (تومان)
                      </Label>
                      <div className="flex gap-2 items-stretch">
                        <Input
                          id="amount"
                          type="text"
                          value={transactionAmount}
                          onChange={handleTransactionAmountChange}
                          required
                          placeholder="مثال: ۱۰,۰۰۰,۰۰۰"
                          className="flex-1 text-lg font-semibold h-10"
                          dir="ltr"
                        />
                        {maxAmount > 0 && transactionDialog.type !== 'capital_add' && (
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => setTransactionAmount(maxAmount.toLocaleString('en-US'))}
                            className="whitespace-nowrap h-10 hover:bg-primary/10 hover:border-primary/50 hover:text-primary"
                          >
                            <Target className="h-4 w-4 ml-1" />
                            همه
                          </Button>
                        )}
                      </div>
                    </div>

                    {/* توضیحات */}
                    <div className="space-y-2">
                      <Label htmlFor="description" className="text-sm font-semibold flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        توضیحات (اختیاری)
                      </Label>
                      <Input
                        id="description"
                        value={transactionDescription}
                        onChange={(e) => setTransactionDescription(e.target.value)}
                        placeholder="توضیحات تراکنش"
                      />
                    </div>

                    {/* دکمه ثبت */}
                    <Button 
                      type="submit" 
                      className="w-full h-12 text-base font-semibold bg-gradient-to-r from-primary via-secondary to-primary hover:opacity-90 transition-all duration-200 shadow-lg hover:shadow-xl"
                    >
                      <CheckCircle2 className="h-4 w-4 ml-2" />
                      ثبت تراکنش
                    </Button>
                  </form>
                );
              })()}
            </DialogContent>
          </Dialog>

          {/* Dialog تاریخچه تراکنش‌ها */}
          <Dialog open={transactionHistoryDialog.open} onOpenChange={(open) => setTransactionHistoryDialog({ ...transactionHistoryDialog, open })}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-primary via-secondary to-primary bg-clip-text text-transparent">
                  تاریخچه تراکنش‌های مالی
                </DialogTitle>
              </DialogHeader>
              {(() => {
                const partner = partners.find(p => p.id === transactionHistoryDialog.partnerId);
                if (!partner) return null;

                const transactions = partnerTransactions;
                const totalIncome = transactions
                  .filter(t => !t.type.includes('withdraw'))
                  .reduce((sum, t) => sum + t.amount, 0);
                const totalExpense = transactions
                  .filter(t => t.type.includes('withdraw'))
                  .reduce((sum, t) => sum + t.amount, 0);

                return (
                  <div className="space-y-6">
                    {/* خلاصه آماری */}
                    <div className="grid grid-cols-3 gap-3">
                      <Card className="relative overflow-hidden bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border-primary/20">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="text-xs text-muted-foreground mb-1">کل تراکنش‌ها</div>
                              <div className="text-lg font-bold text-primary">{toPersianDigits(transactions.length)}</div>
                            </div>
                            <FileText className="h-8 w-8 text-primary/40" />
                          </div>
                        </CardContent>
                      </Card>
                      <Card className="relative overflow-hidden bg-gradient-to-br from-success/10 via-success/5 to-transparent border-success/20">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="text-xs text-muted-foreground mb-1">کل واریز</div>
                              <div className="text-lg font-bold text-success">{formatCurrency(totalIncome)}</div>
                            </div>
                            <ArrowUp className="h-8 w-8 text-success/40" />
                          </div>
                        </CardContent>
                      </Card>
                      <Card className="relative overflow-hidden bg-gradient-to-br from-destructive/10 via-destructive/5 to-transparent border-destructive/20">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="text-xs text-muted-foreground mb-1">کل برداشت</div>
                              <div className="text-lg font-bold text-destructive">{formatCurrency(totalExpense)}</div>
                            </div>
                            <ArrowDown className="h-8 w-8 text-destructive/40" />
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    {transactions.length === 0 ? (
                      <Card>
                        <CardContent className="flex flex-col items-center justify-center py-12">
                          <div className="relative mb-4">
                            <div className="absolute inset-0 bg-primary/20 rounded-full blur-lg" />
                            <FileText className="relative h-12 w-12 text-primary" />
                          </div>
                          <p className="text-muted-foreground/70 text-center">
                            هنوز تراکنشی ثبت نشده است
                          </p>
                        </CardContent>
                      </Card>
                    ) : (
                      <div className="space-y-2">
                        {transactions.map((transaction, index) => {
                          const isWithdraw = transaction.type.includes('withdraw');
                          const Icon = isWithdraw ? ArrowDown : ArrowUp;
                          
                          return (
                            <div
                              key={transaction.id}
                              className={cn(
                                "p-4 rounded-lg border transition-all duration-200 hover:scale-[1.01]",
                                isWithdraw 
                                  ? "bg-destructive/5 border-destructive/20 hover:bg-destructive/10" 
                                  : "bg-success/5 border-success/20 hover:bg-success/10"
                              )}
                              style={{ animationDelay: `${index * 30}ms` }}
                            >
                              <div className="flex items-start justify-between">
                                <div className="flex items-start gap-3 flex-1">
                                  <div className={cn(
                                    "p-2 rounded-lg",
                                    isWithdraw ? "bg-destructive/10" : "bg-success/10"
                                  )}>
                                    <Icon className={cn(
                                      "h-4 w-4",
                                      isWithdraw ? "text-destructive" : "text-success"
                                    )} />
                                  </div>
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                      <span className="font-semibold">
                                        {getTransactionLabel(transaction.type)}
                                      </span>
                                      <Badge 
                                        variant="outline"
                                        className={cn(
                                          "text-xs",
                                          isWithdraw 
                                            ? "bg-destructive/10 text-destructive border-destructive/20" 
                                            : "bg-success/10 text-success border-success/20"
                                        )}
                                      >
                                        {isWithdraw ? 'برداشت' : 'واریز'}
                                      </Badge>
                                    </div>
                                    {transaction.description && (
                                      <p className="text-sm text-muted-foreground mb-1">
                                        {transaction.description}
                                      </p>
                                    )}
                                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                      <Calendar className="h-3 w-3" />
                                      {new Date(transaction.date).toLocaleDateString('fa-IR', {
                                        year: 'numeric',
                                        month: 'long',
                                        day: 'numeric',
                                        hour: '2-digit',
                                        minute: '2-digit'
                                      })}
                                    </div>
                                  </div>
                                </div>
                                <div className="text-left min-w-[140px]">
                                  <div className={cn(
                                    "text-lg font-bold",
                                    isWithdraw ? "text-destructive" : "text-success"
                                  )}>
                                    {isWithdraw ? '-' : '+'}
                                    {formatCurrency(transaction.amount)}
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })()}
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          <Card className="relative overflow-hidden bg-card/80 backdrop-blur-sm hover:shadow-xl hover:scale-[1.02] transition-all duration-300 group">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <CardHeader className="relative z-10">
              <CardTitle className="flex items-center gap-2 text-base">
                <div className="relative">
                  <div className="absolute inset-0 bg-primary/20 rounded-lg blur-sm opacity-0 group-hover:opacity-100 transition-opacity" />
                  <Users className="relative h-5 w-5 text-primary" />
                </div>
                سرمایه کل
              </CardTitle>
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
                {formatCurrency(financialSummary.totalCapital)}
              </div>
              <p className="text-sm text-muted-foreground/70 mt-2">
                {toPersianDigits(partners.length)} شریک
              </p>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden bg-card/80 backdrop-blur-sm hover:shadow-xl hover:scale-[1.02] transition-all duration-300 group">
            <div className="absolute inset-0 bg-gradient-to-br from-success/5 via-transparent to-success/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <CardHeader className="relative z-10">
              <CardTitle className="flex items-center gap-2 text-base">
                <div className="relative">
                  <div className="absolute inset-0 bg-success/20 rounded-lg blur-sm opacity-0 group-hover:opacity-100 transition-opacity" />
                  <DollarSign className="relative h-5 w-5 text-success" />
                </div>
                در دسترس
              </CardTitle>
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="text-2xl font-bold bg-gradient-to-r from-success to-success/80 bg-clip-text text-transparent">
                {formatCurrency(financialSummary.totalAvailableCapital)}
              </div>
              <p className="text-sm text-muted-foreground/70 mt-2">
                قابل استفاده برای خرید
              </p>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden bg-card/80 backdrop-blur-sm hover:shadow-xl hover:scale-[1.02] transition-all duration-300 group">
            <div className="absolute inset-0 bg-gradient-to-br from-warning/5 via-transparent to-warning/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <CardHeader className="relative z-10">
              <CardTitle className="flex items-center gap-2 text-base">
                <div className="relative">
                  <div className="absolute inset-0 bg-warning/20 rounded-lg blur-sm opacity-0 group-hover:opacity-100 transition-opacity" />
                  <DollarSign className="relative h-5 w-5 text-warning" />
                </div>
                در گردش
              </CardTitle>
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="text-2xl font-bold bg-gradient-to-r from-warning to-warning/80 bg-clip-text text-transparent">
                {formatCurrency(financialSummary.totalUsedCapital)}
              </div>
              <p className="text-sm text-muted-foreground/70 mt-2">
                سرمایه استفاده شده
              </p>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden bg-card/80 backdrop-blur-sm hover:shadow-xl hover:scale-[1.02] transition-all duration-300 group">
            <div className="absolute inset-0 bg-gradient-to-br from-secondary/5 via-transparent to-secondary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <CardHeader className="relative z-10">
              <CardTitle className="flex items-center gap-2 text-base">
                <div className="relative">
                  <div className="absolute inset-0 bg-secondary/20 rounded-lg blur-sm opacity-0 group-hover:opacity-100 transition-opacity" />
                  <TrendingUp className="relative h-5 w-5 text-secondary" />
                </div>
                سود ماهانه
              </CardTitle>
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="text-2xl font-bold bg-gradient-to-r from-secondary to-secondary/80 bg-clip-text text-transparent">
                {formatCurrency(financialSummary.totalMonthlyProfit)}
              </div>
              <p className="text-sm text-muted-foreground/70 mt-2">
                سود ۴٪ دریافت شده
              </p>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden bg-card/80 backdrop-blur-sm hover:shadow-xl hover:scale-[1.02] transition-all duration-300 group">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <CardHeader className="relative z-10">
              <CardTitle className="flex items-center gap-2 text-base">
                <div className="relative">
                  <div className="absolute inset-0 bg-primary/20 rounded-lg blur-sm opacity-0 group-hover:opacity-100 transition-opacity" />
                  <TrendingUp className="relative h-5 w-5 text-primary" />
                </div>
                سود کل
              </CardTitle>
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                {formatCurrency(financialSummary.totalProfit)}
              </div>
              <p className="text-sm text-muted-foreground/70 mt-2">
                مجموع سود
              </p>
            </CardContent>
          </Card>
        </div>

        {/* جستجو */}
        <Card className="bg-card/50 backdrop-blur-sm border-primary/10">
          <CardContent className="pt-6">
            <div className="relative">
              <Users className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="جستجو بر اساس نام شریک..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pr-10"
              />
            </div>
            {searchQuery && (
              <p className="text-sm text-muted-foreground mt-2">
                {partners.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase())).length} نتیجه یافت شد
              </p>
            )}
          </CardContent>
        </Card>

        <div className="grid gap-4 grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
          {partners.filter(partner => 
            searchQuery === "" || partner.name.toLowerCase().includes(searchQuery.toLowerCase())
          ).map((partner, index) => {
            const financial = partnerFinancials.get(partner.id);
            const capitalUsagePercentage = partner.capital > 0 ? ((partner.capital - partner.availableCapital) / partner.capital) * 100 : 0;
            
            return (
              <Card 
                key={partner.id} 
                className="relative overflow-hidden bg-card/80 backdrop-blur-sm hover:shadow-xl hover:scale-[1.02] transition-all duration-300 group animate-slide-in"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <CardHeader className="relative z-10">
                  <CardTitle className="flex justify-between items-start">
                    <div className="flex items-center gap-2">
                      <div className="relative">
                        <div className="absolute inset-0 bg-primary/20 rounded-lg blur-sm opacity-0 group-hover:opacity-100 transition-opacity" />
                        <Users className="relative h-5 w-5 text-primary" />
                      </div>
                      <span className="font-bold text-lg">{partner.name}</span>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        className="hover:scale-110 transition-transform duration-200"
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(partner)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(partner.id, partner.name)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 relative z-10">
                  {/* سرمایه و سهم */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 rounded-lg border border-border/50 hover:bg-accent/30 transition-colors">
                      <div className="text-xs text-muted-foreground mb-1">سرمایه</div>
                      <div className="text-lg font-bold bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
                        {formatCurrency(partner.capital)}
                      </div>
                    </div>
                    <div className="p-3 rounded-lg border border-border/50 hover:bg-accent/30 transition-colors">
                      <div className="text-xs text-muted-foreground mb-1">سهم</div>
                      <div className="text-lg font-bold text-primary">
                        {toPersianDigits(partner.share.toFixed(1))}%
                      </div>
                    </div>
                  </div>

                  {/* Progress Bar استفاده از سرمایه */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-medium">استفاده از سرمایه</span>
                      <span className="text-xs text-muted-foreground">
                        {toPersianDigits(capitalUsagePercentage.toFixed(1))}%
                      </span>
                    </div>
                    <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-warning via-warning/80 to-warning transition-all duration-500"
                        style={{ width: `${capitalUsagePercentage}%` }}
                      />
                    </div>
                  </div>

                  {financial && (
                    <>
                      {/* وضعیت سرمایه */}
                      <div className="pt-2 border-t border-border/50">
                        <div className="text-xs font-semibold mb-2 flex items-center gap-1">
                          <Wallet className="h-3 w-3" />
                          وضعیت سرمایه
                        </div>
                        <div className="space-y-2">
                          <div className="flex justify-between items-center p-2 rounded-lg hover:bg-accent/30 transition-colors">
                            <span className="text-xs text-muted-foreground">در دسترس</span>
                            <span className="text-sm font-semibold text-success">
                              {formatCurrency(financial.availableCapital)}
                            </span>
                          </div>
                          <div className="flex justify-between items-center p-2 rounded-lg hover:bg-accent/30 transition-colors">
                            <span className="text-xs text-muted-foreground">در گردش</span>
                            <span className="text-sm font-semibold text-warning">
                              {formatCurrency(financial.usedCapital)}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* سود */}
                      <div className="pt-2 border-t border-border/50">
                        <div className="text-xs font-semibold mb-2 flex items-center gap-1">
                          <TrendingUp className="h-3 w-3" />
                          سود
                        </div>
                        <div className="space-y-2">
                          <div className="flex justify-between items-center p-2 rounded-lg hover:bg-accent/30 transition-colors">
                            <span className="text-xs text-muted-foreground">اولیه</span>
                            <span className="text-sm font-semibold text-success">
                              {formatCurrency(financial.initialProfit)}
                            </span>
                          </div>
                          <div className="flex justify-between items-center p-2 rounded-lg hover:bg-accent/30 transition-colors">
                            <span className="text-xs text-muted-foreground">ماهانه</span>
                            <span className="text-sm font-semibold text-secondary">
                              {formatCurrency(financial.monthlyProfit)}
                            </span>
                          </div>
                          <div className="flex justify-between items-center pt-2 border-t border-border/50">
                            <span className="text-sm font-semibold">مجموع</span>
                            <span className="text-lg font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                              {formatCurrency(financial.totalProfit)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </>
                  )}

                  {/* دکمه‌های عملیات */}
                  <div className="pt-2 border-t border-border/50">
                    <div className="text-xs font-semibold mb-2 flex items-center gap-1">
                      <Zap className="h-3 w-3" />
                      عملیات سرمایه
                    </div>
                    <div className="grid grid-cols-2 gap-2 mb-3">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setTransactionDialog({ open: true, partnerId: partner.id, type: 'capital_add' });
                          setTransactionAmount("");
                          setTransactionDescription("");
                          setProfitType('both');
                        }}
                        className="text-xs gap-1 hover:bg-success/10 hover:border-success/50"
                      >
                        <ArrowUp className="h-3 w-3" />
                        افزایش سرمایه
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setTransactionDialog({ open: true, partnerId: partner.id, type: 'capital_withdraw' });
                          setTransactionAmount("");
                          setTransactionDescription("");
                          setProfitType('both');
                        }}
                        className="text-xs gap-1 hover:bg-destructive/10 hover:border-destructive/50"
                      >
                        <ArrowDown className="h-3 w-3" />
                        برداشت سرمایه
                      </Button>
                    </div>
                    {financial && (financial.initialProfit > 0 || financial.monthlyProfit > 0) && (
                      <>
                        <div className="text-xs font-semibold mb-2 flex items-center gap-1">
                          <DollarSign className="h-3 w-3" />
                          عملیات سود
                        </div>
                        <div className="grid grid-cols-2 gap-2 mb-3">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setTransactionDialog({ open: true, partnerId: partner.id, type: 'initial_profit_withdraw' });
                              setTransactionAmount("");
                              setTransactionDescription("");
                              setProfitType('both');
                            }}
                            className="text-xs gap-1 hover:bg-warning/10 hover:border-warning/50"
                            disabled={financial.initialProfit <= 0}
                          >
                            <ArrowDown className="h-3 w-3" />
                            برداشت سود اولیه
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setTransactionDialog({ open: true, partnerId: partner.id, type: 'monthly_profit_withdraw' });
                              setTransactionAmount("");
                              setTransactionDescription("");
                              setProfitType('both');
                            }}
                            className="text-xs gap-1 hover:bg-warning/10 hover:border-warning/50"
                            disabled={financial.monthlyProfit <= 0}
                          >
                            <ArrowDown className="h-3 w-3" />
                            برداشت سود ماهانه
                          </Button>
                        </div>
                      </>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setTransactionDialog({ open: true, partnerId: partner.id, type: 'profit_to_capital' });
                        setTransactionAmount("");
                        setTransactionDescription("");
                        setProfitType('both');
                      }}
                      className="text-xs w-full gap-1 hover:bg-primary/10 hover:border-primary/50"
                      disabled={financial && financial.totalProfit <= 0}
                    >
                      <TrendingUp className="h-3 w-3" />
                      تبدیل سود به سرمایه
                    </Button>
                  </div>

                  {/* Footer */}
                  <div className="pt-2 border-t border-border/50">
                    <div className="flex justify-between items-center gap-2">
                      <div className="text-xs text-muted-foreground flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {new Date(partner.createdAt).toLocaleDateString('fa-IR')}
                      </div>
                      <div className="flex gap-1">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setPartnerDetailsDialog({ open: true, partnerId: partner.id })}
                          className="gap-1 hover:bg-primary/10 hover:border-primary/50 hover:scale-105 transition-all duration-200"
                        >
                          <Eye className="h-3 w-3" />
                          جزئیات
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setTransactionHistoryDialog({ open: true, partnerId: partner.id })}
                          className="text-xs gap-1"
                        >
                          <FileText className="h-3 w-3" />
                          تاریخچه
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {partners.filter(p => searchQuery === "" || p.name.toLowerCase().includes(searchQuery.toLowerCase())).length === 0 && partners.length > 0 && (
          <Card className="relative overflow-hidden bg-card/80 backdrop-blur-sm">
            <div className="absolute inset-0 bg-gradient-to-br from-warning/5 via-transparent to-warning/5" />
            <CardContent className="relative flex flex-col items-center justify-center py-12">
              <AlertCircle className="h-16 w-16 text-warning mb-4" />
              <h3 className="text-xl font-semibold mb-2">نتیجه‌ای یافت نشد</h3>
              <p className="text-muted-foreground text-center">
                با جستجوی "{searchQuery}"، شریکی پیدا نشد.
              </p>
            </CardContent>
          </Card>
        )}

        {partners.length === 0 && (
          <Card className="relative overflow-hidden bg-card/80 backdrop-blur-sm">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5" />
            <CardContent className="flex flex-col items-center justify-center py-12 relative z-10">
              <div className="relative mb-4">
                <div className="absolute inset-0 bg-primary/20 rounded-full blur-lg" />
                <Users className="relative h-12 w-12 text-primary" />
              </div>
              <p className="text-muted-foreground/70 text-center leading-relaxed">
                هنوز شریکی ثبت نشده است
                <br />
                برای شروع، یک شریک اضافه کنید
              </p>
            </CardContent>
          </Card>
        )}

        {/* Dialog جزئیات شریک */}
        <Dialog open={partnerDetailsDialog.open} onOpenChange={(open) => setPartnerDetailsDialog({ ...partnerDetailsDialog, open })}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-primary via-secondary to-primary bg-clip-text text-transparent">
                جزئیات شریک
              </DialogTitle>
            </DialogHeader>
            {(() => {
              const partner = partners.find(p => p.id === partnerDetailsDialog.partnerId);
              if (!partner) return null;
              
              const financial = partnerFinancials.get(partner.id);
              const capitalUsagePercentage = partner.capital > 0 ? ((partner.capital - partner.availableCapital) / partner.capital) * 100 : 0;
              const profitPercentage = partner.capital > 0 ? ((financial?.totalProfit || 0) / partner.capital) * 100 : 0;
              
              return (
                <div className="space-y-6">
                  {/* خلاصه آماری */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <Card className="relative overflow-hidden bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border-primary/20">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="text-xs text-muted-foreground mb-1">سرمایه کل</div>
                            <div className="text-lg font-bold text-primary">{formatCurrency(partner.capital)}</div>
                          </div>
                          <Wallet className="h-8 w-8 text-primary/40" />
                        </div>
                      </CardContent>
                    </Card>
                    <Card className="relative overflow-hidden bg-gradient-to-br from-success/10 via-success/5 to-transparent border-success/20">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="text-xs text-muted-foreground mb-1">در دسترس</div>
                            <div className="text-lg font-bold text-success">{formatCurrency(financial?.availableCapital || 0)}</div>
                          </div>
                          <CreditCard className="h-8 w-8 text-success/40" />
                        </div>
                      </CardContent>
                    </Card>
                    <Card className="relative overflow-hidden bg-gradient-to-br from-warning/10 via-warning/5 to-transparent border-warning/20">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="text-xs text-muted-foreground mb-1">در گردش</div>
                            <div className="text-lg font-bold text-warning">{formatCurrency(financial?.usedCapital || 0)}</div>
                          </div>
                          <Activity className="h-8 w-8 text-warning/40" />
                        </div>
                      </CardContent>
                    </Card>
                    <Card className="relative overflow-hidden bg-gradient-to-br from-secondary/10 via-secondary/5 to-transparent border-secondary/20">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="text-xs text-muted-foreground mb-1">سود کل</div>
                            <div className="text-lg font-bold text-secondary">{formatCurrency(financial?.totalProfit || 0)}</div>
                          </div>
                          <TrendingUp className="h-8 w-8 text-secondary/40" />
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Progress Bars */}
                  <div className="grid md:grid-cols-2 gap-4">
                    <Card>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium">استفاده از سرمایه</span>
                          <span className="text-sm text-muted-foreground">
                            {toPersianDigits(capitalUsagePercentage.toFixed(1))}%
                          </span>
                        </div>
                        <div className="w-full h-3 bg-muted rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-gradient-to-r from-warning via-warning/80 to-warning transition-all duration-500"
                            style={{ width: `${capitalUsagePercentage}%` }}
                          />
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium">بازدهی سرمایه</span>
                          <span className="text-sm text-muted-foreground">
                            {toPersianDigits(profitPercentage.toFixed(1))}%
                          </span>
                        </div>
                        <div className="w-full h-3 bg-muted rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-gradient-to-r from-success via-success/80 to-success transition-all duration-500"
                            style={{ width: `${Math.min(profitPercentage, 100)}%` }}
                          />
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
                          اطلاعات شریک
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="relative z-10 space-y-3">
                        <div className="flex items-center justify-between p-3 rounded-lg border border-border/50 hover:bg-accent/30 transition-colors">
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm text-muted-foreground">نام شریک</span>
                          </div>
                          <span className="font-semibold">{partner.name}</span>
                        </div>
                        <div className="flex items-center justify-between p-3 rounded-lg border border-border/50 hover:bg-accent/30 transition-colors">
                          <div className="flex items-center gap-2">
                            <Percent className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm text-muted-foreground">سهم</span>
                          </div>
                          <span className="font-semibold text-primary">{toPersianDigits(partner.share.toFixed(2))}%</span>
                        </div>
                        <div className="flex items-center justify-between p-3 rounded-lg border border-border/50 hover:bg-accent/30 transition-colors">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm text-muted-foreground">تاریخ ثبت</span>
                          </div>
                          <span className="font-medium">{new Date(partner.createdAt).toLocaleDateString('fa-IR')}</span>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="relative overflow-hidden group">
                      <div className="absolute inset-0 bg-gradient-to-br from-secondary/5 via-transparent to-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      <CardHeader className="relative z-10 pb-3">
                        <CardTitle className="flex items-center gap-2 text-base font-semibold">
                          <div className="relative">
                            <div className="absolute inset-0 bg-secondary/20 rounded-lg blur-sm" />
                            <PieChart className="relative h-4 w-4 text-secondary" />
                          </div>
                          وضعیت مالی
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="relative z-10 space-y-3">
                        <div className="p-3 rounded-lg border border-border/50 hover:bg-accent/30 transition-colors">
                          <div className="text-xs text-muted-foreground mb-1">سود اولیه</div>
                          <div className="text-lg font-bold text-success">{formatCurrency(financial?.initialProfit || 0)}</div>
                        </div>
                        <div className="p-3 rounded-lg border border-border/50 hover:bg-accent/30 transition-colors">
                          <div className="text-xs text-muted-foreground mb-1">سود ماهانه</div>
                          <div className="text-lg font-bold text-secondary">{formatCurrency(financial?.monthlyProfit || 0)}</div>
                        </div>
                        <div className="p-3 rounded-lg border border-border/50 bg-gradient-to-br from-primary/10 to-secondary/10">
                          <div className="text-xs text-muted-foreground mb-1">مجموع سود</div>
                          <div className="text-xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                            {formatCurrency(financial?.totalProfit || 0)}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* عملیات سریع */}
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center gap-2 text-base font-semibold">
                        <Zap className="h-4 w-4 text-primary" />
                        عملیات سریع
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div>
                          <div className="text-xs font-semibold mb-2 text-muted-foreground">عملیات سرمایه</div>
                          <div className="grid grid-cols-2 gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setTransactionDialog({ open: true, partnerId: partner.id, type: 'capital_add' });
                                setTransactionAmount("");
                                setTransactionDescription("");
                                setPartnerDetailsDialog({ open: false, partnerId: '' });
                              }}
                              className="gap-2 hover:bg-success/10 hover:border-success/50"
                            >
                              <ArrowUp className="h-3 w-3" />
                              افزایش سرمایه
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setTransactionDialog({ open: true, partnerId: partner.id, type: 'capital_withdraw' });
                                setTransactionAmount("");
                                setTransactionDescription("");
                                setPartnerDetailsDialog({ open: false, partnerId: '' });
                              }}
                              className="gap-2 hover:bg-destructive/10 hover:border-destructive/50"
                            >
                              <ArrowDown className="h-3 w-3" />
                              برداشت سرمایه
                            </Button>
                          </div>
                        </div>
                        {financial && (financial.initialProfit > 0 || financial.monthlyProfit > 0) && (
                          <div>
                            <div className="text-xs font-semibold mb-2 text-muted-foreground">عملیات سود</div>
                            <div className="grid grid-cols-2 gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setTransactionDialog({ open: true, partnerId: partner.id, type: 'initial_profit_withdraw' });
                                  setTransactionAmount("");
                                  setTransactionDescription("");
                                  setPartnerDetailsDialog({ open: false, partnerId: '' });
                                }}
                                className="gap-2 hover:bg-warning/10 hover:border-warning/50"
                                disabled={financial.initialProfit <= 0}
                              >
                                <ArrowDown className="h-3 w-3" />
                                برداشت سود اولیه
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setTransactionDialog({ open: true, partnerId: partner.id, type: 'monthly_profit_withdraw' });
                                  setTransactionAmount("");
                                  setTransactionDescription("");
                                  setPartnerDetailsDialog({ open: false, partnerId: '' });
                                }}
                                className="gap-2 hover:bg-warning/10 hover:border-warning/50"
                                disabled={financial.monthlyProfit <= 0}
                              >
                                <ArrowDown className="h-3 w-3" />
                                برداشت سود ماهانه
                              </Button>
                            </div>
                          </div>
                        )}
                        <div>
                          <div className="text-xs font-semibold mb-2 text-muted-foreground">سایر عملیات</div>
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setTransactionDialog({ open: true, partnerId: partner.id, type: 'profit_to_capital' });
                                setTransactionAmount("");
                                setTransactionDescription("");
                                setPartnerDetailsDialog({ open: false, partnerId: '' });
                              }}
                              className="gap-2 hover:bg-primary/10 hover:border-primary/50"
                              disabled={financial && financial.totalProfit <= 0}
                            >
                              <TrendingUp className="h-3 w-3" />
                              تبدیل سود
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setTransactionHistoryDialog({ open: true, partnerId: partner.id });
                                setPartnerDetailsDialog({ open: false, partnerId: '' });
                              }}
                              className="gap-2 hover:bg-secondary/10 hover:border-secondary/50"
                            >
                              <FileText className="h-3 w-3" />
                              تاریخچه
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                handleEdit(partner);
                                setPartnerDetailsDialog({ open: false, partnerId: '' });
                              }}
                              className="gap-2 hover:bg-primary/10 hover:border-primary/50"
                            >
                              <Edit className="h-3 w-3" />
                              ویرایش
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              );
            })()}
          </DialogContent>
        </Dialog>

        {/* AlertDialog حذف شریک */}
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
                  حذف شریک
                </AlertDialogTitle>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 space-y-4 bg-background">
              <AlertDialogDescription className="text-right space-y-4">
                <div className="p-4 rounded-lg bg-muted/50 border border-border/50">
                  <p className="text-base font-semibold text-foreground mb-2">
                    شریک مورد نظر:
                  </p>
                  <p className="text-lg font-bold text-primary bg-primary/10 px-3 py-2 rounded-md inline-block">
                    {deleteDialog.partnerName}
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
                        این عمل غیرقابل بازگشت است و تمام اطلاعات مرتبط با این شریک از جمله:
                      </p>
                      <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside mr-4">
                        <li>اطلاعات مالی و سرمایه</li>
                        <li>تاریخچه تراکنش‌ها</li>
                        <li>سود و بازدهی</li>
                      </ul>
                      <p className="text-sm font-semibold text-destructive mt-2">
                        برای همیشه حذف خواهند شد.
                      </p>
                    </div>
                  </div>
                </div>

                <p className="text-center text-sm text-muted-foreground pt-2">
                  آیا از حذف این شریک اطمینان دارید؟
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
                حذف شریک
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </Layout>
  );
};

export default Partners;
