import { useState, useEffect, useCallback } from "react";
import Layout from "@/components/Layout";
import { LoadingOverlay } from "@/components/LoadingOverlay";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { partnersStore, Partner, transactionsStore, Transaction, salesStore, installmentsStore } from "@/lib/storeProvider";
import { formatCurrency, toPersianDigits } from "@/lib/persian";
import { calculateFinancialsFromData, PartnerFinancials } from "@/lib/profitCalculator";
import { Plus, Edit, Trash2, Users, TrendingUp, DollarSign, ArrowUp, ArrowDown } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

const Partners = () => {
  const [partners, setPartners] = useState<Partner[]>([]);
  const [partnerFinancials, setPartnerFinancials] = useState<Map<string, PartnerFinancials>>(new Map());
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPartner, setEditingPartner] = useState<Partner | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    capital: "",
  });
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

      // محاسبه وضعیت مالی هر شریک
      const financials = calculateFinancialsFromData(data, sales, installments);
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
        });
        toast({
          title: "موفق",
          description: "شریک جدید با موفقیت اضافه شد",
        });
      }

      setFormData({ name: "", capital: "" });
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
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm("آیا از حذف این شریک اطمینان دارید؟")) {
      try {
        await partnersStore.delete(id);
        toast({
          title: "موفق",
          description: "شریک با موفقیت حذف شد",
        });
        loadPartners();
      } catch (error) {
        console.error('Error deleting partner:', error);
        toast({
          title: "خطا",
          description: "خطا در حذف شریک",
          variant: "destructive",
        });
      }
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
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
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
                <Button type="submit" className="w-full">
                  {editingPartner ? "بروزرسانی" : "افزودن"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>

          {/* Dialog تراکنش مالی */}
          <Dialog open={transactionDialog.open} onOpenChange={(open) => setTransactionDialog({ ...transactionDialog, open })}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{getTransactionLabel(transactionDialog.type)}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleTransaction} className="space-y-4">
                {transactionDialog.type === 'profit_to_capital' && (() => {
                  const partner = partners.find(p => p.id === transactionDialog.partnerId);
                  return (
                    <div className="space-y-2">
                      <Label>نوع سود</Label>
                      <div className="grid grid-cols-3 gap-2">
                        <Button
                          type="button"
                          variant={profitType === 'initial' ? 'default' : 'outline'}
                          onClick={() => setProfitType('initial')}
                          className="text-xs"
                        >
                          سود اولیه
                          {partner && (
                            <div className="text-[10px] mt-0.5">
                              {formatCurrency(partner.initialProfit)}
                            </div>
                          )}
                        </Button>
                        <Button
                          type="button"
                          variant={profitType === 'monthly' ? 'default' : 'outline'}
                          onClick={() => setProfitType('monthly')}
                          className="text-xs"
                        >
                          سود ماهانه
                          {partner && (
                            <div className="text-[10px] mt-0.5">
                              {formatCurrency(partner.monthlyProfit)}
                            </div>
                          )}
                        </Button>
                        <Button
                          type="button"
                          variant={profitType === 'both' ? 'default' : 'outline'}
                          onClick={() => setProfitType('both')}
                          className="text-xs"
                        >
                          هر دو
                          {partner && (
                            <div className="text-[10px] mt-0.5">
                              {formatCurrency(partner.initialProfit + partner.monthlyProfit)}
                            </div>
                          )}
                        </Button>
                      </div>
                    </div>
                  );
                })()}
                <div>
                  <Label htmlFor="amount">مبلغ (تومان)</Label>
                  <div className="flex gap-2">
                    <Input
                      id="amount"
                      type="text"
                      value={transactionAmount}
                      onChange={handleTransactionAmountChange}
                      required
                      placeholder="مثال: ۱۰,۰۰۰,۰۰۰"
                      className="flex-1"
                      dir="ltr"
                    />
                    {(() => {
                      const partner = partners.find(p => p.id === transactionDialog.partnerId);
                      if (!partner) return null;

                      let maxAmount = 0;
                      if (transactionDialog.type === 'capital_withdraw') {
                        maxAmount = partner.availableCapital;
                      } else if (transactionDialog.type === 'initial_profit_withdraw') {
                        maxAmount = partner.initialProfit;
                      } else if (transactionDialog.type === 'monthly_profit_withdraw') {
                        maxAmount = partner.monthlyProfit;
                      } else if (transactionDialog.type === 'profit_to_capital') {
                        if (profitType === 'initial') {
                          maxAmount = partner.initialProfit;
                        } else if (profitType === 'monthly') {
                          maxAmount = partner.monthlyProfit;
                        } else {
                          maxAmount = partner.initialProfit + partner.monthlyProfit;
                        }
                      }

                      if (maxAmount > 0 && transactionDialog.type !== 'capital_add') {
                        return (
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => setTransactionAmount(maxAmount.toLocaleString('en-US'))}
                            className="text-xs whitespace-nowrap"
                          >
                            همه ({formatCurrency(maxAmount)})
                          </Button>
                        );
                      }
                      return null;
                    })()}
                  </div>
                </div>
                <div>
                  <Label htmlFor="description">توضیحات (اختیاری)</Label>
                  <Input
                    id="description"
                    value={transactionDescription}
                    onChange={(e) => setTransactionDescription(e.target.value)}
                    placeholder="توضیحات تراکنش"
                  />
                </div>
                <Button type="submit" className="w-full">
                  ثبت تراکنش
                </Button>
              </form>
            </DialogContent>
          </Dialog>

          {/* Dialog تاریخچه تراکنش‌ها */}
          <Dialog open={transactionHistoryDialog.open} onOpenChange={(open) => setTransactionHistoryDialog({ ...transactionHistoryDialog, open })}>
            <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>تاریخچه تراکنش‌های مالی</DialogTitle>
              </DialogHeader>
              {(() => {
                const partner = partners.find(p => p.id === transactionHistoryDialog.partnerId);
                if (!partner) return null;

                const transactions = partnerTransactions;

                return (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center pb-3 border-b">
                      <div>
                        <h3 className="font-semibold">{partner.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          مجموع {toPersianDigits(transactions.length)} تراکنش
                        </p>
                      </div>
                    </div>

                    {transactions.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        هنوز تراکنشی ثبت نشده است
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {transactions.map((transaction) => (
                          <Card key={transaction.id} className="p-4">
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="font-semibold">
                                    {getTransactionLabel(transaction.type)}
                                  </span>
                                  {transaction.type.includes('withdraw') ? (
                                    <ArrowDown className="h-4 w-4 text-destructive" />
                                  ) : (
                                    <ArrowUp className="h-4 w-4 text-success" />
                                  )}
                                </div>
                                <p className="text-sm text-muted-foreground">
                                  {transaction.description}
                                </p>
                                <p className="text-xs text-muted-foreground mt-1">
                                  {new Date(transaction.date).toLocaleDateString('fa-IR', {
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })}
                                </p>
                              </div>
                              <div className="text-left">
                                <div className={`text-lg font-bold ${
                                  transaction.type.includes('withdraw') ? 'text-destructive' : 'text-success'
                                }`}>
                                  {transaction.type.includes('withdraw') ? '-' : '+'}
                                  {formatCurrency(transaction.amount)}
                                </div>
                              </div>
                            </div>
                          </Card>
                        ))}
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

        <div className="grid gap-3 grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
          {partners.map((partner) => {
            const financial = partnerFinancials.get(partner.id);
            return (
              <Card key={partner.id} className="relative overflow-hidden bg-card/80 backdrop-blur-sm hover:shadow-xl hover:scale-[1.02] transition-all duration-300 group">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <CardHeader className="relative z-10">
                  <CardTitle className="flex justify-between items-start">
                    <span className="font-bold">{partner.name}</span>
                    <div className="flex gap-2">
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
                        onClick={() => handleDelete(partner.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 relative z-10">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <div className="text-sm text-muted-foreground">سرمایه اولیه</div>
                      <div className="text-lg font-bold">
                        {formatCurrency(partner.capital)}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">سهم</div>
                      <div className="text-lg font-bold text-primary">
                        {toPersianDigits(partner.share.toFixed(1))}%
                      </div>
                    </div>
                  </div>

                  {financial && (
                    <>
                      <div className="pt-3 border-t">
                        <div className="text-sm font-semibold mb-2">وضعیت سرمایه</div>
                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-xs text-muted-foreground">در دسترس</span>
                            <span className="text-sm font-semibold text-success">
                              {formatCurrency(financial.availableCapital)}
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-xs text-muted-foreground">در گردش</span>
                            <span className="text-sm font-semibold text-warning">
                              {formatCurrency(financial.usedCapital)}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="pt-3 border-t">
                        <div className="text-sm font-semibold mb-2">سود لحظه‌ای</div>
                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-xs text-muted-foreground">سود اولیه</span>
                            <span className="text-sm font-semibold text-success">
                              {formatCurrency(financial.initialProfit)}
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-xs text-muted-foreground">سود ماهانه (۴٪)</span>
                            <span className="text-sm font-semibold text-secondary">
                              {formatCurrency(financial.monthlyProfit)}
                            </span>
                          </div>
                          <div className="flex justify-between items-center pt-2 border-t">
                            <span className="text-sm font-semibold">مجموع سود</span>
                            <span className="text-lg font-bold text-primary">
                              {formatCurrency(financial.totalProfit)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </>
                  )}

                  <div className="pt-3 border-t">
                    <div className="text-sm font-semibold mb-2">عملیات سرمایه</div>
                    <div className="grid grid-cols-2 gap-2 mb-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setTransactionDialog({ open: true, partnerId: partner.id, type: 'capital_add' });
                          setTransactionAmount("");
                          setTransactionDescription("");
                          setProfitType('both');
                        }}
                        className="text-xs"
                      >
                        <ArrowUp className="h-3 w-3 ml-1" />
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
                        className="text-xs"
                      >
                        <ArrowDown className="h-3 w-3 ml-1" />
                        برداشت سرمایه
                      </Button>
                    </div>
                    <div className="text-sm font-semibold mb-2">عملیات سود</div>
                    <div className="grid grid-cols-2 gap-2 mb-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setTransactionDialog({ open: true, partnerId: partner.id, type: 'initial_profit_withdraw' });
                          setTransactionAmount("");
                          setTransactionDescription("");
                          setProfitType('both');
                        }}
                        className="text-xs"
                      >
                        <ArrowDown className="h-3 w-3 ml-1" />
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
                        className="text-xs"
                      >
                        <ArrowDown className="h-3 w-3 ml-1" />
                        برداشت سود ماهانه
                      </Button>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setTransactionDialog({ open: true, partnerId: partner.id, type: 'profit_to_capital' });
                        setTransactionAmount("");
                        setTransactionDescription("");
                        setProfitType('both');
                      }}
                      className="text-xs w-full"
                    >
                      <TrendingUp className="h-3 w-3 ml-1" />
                      تبدیل سود به سرمایه
                    </Button>
                  </div>

                  <div className="pt-2 border-t">
                    <div className="flex justify-between items-center">
                      <div className="text-xs text-muted-foreground">
                        تاریخ ثبت: {new Date(partner.createdAt).toLocaleDateString('fa-IR')}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setTransactionHistoryDialog({ open: true, partnerId: partner.id })}
                        className="text-xs"
                      >
                        تاریخچه تراکنش‌ها
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {partners.length === 0 && (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Users className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground text-center">
                هنوز شریکی ثبت نشده است
                <br />
                برای شروع، یک شریک اضافه کنید
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
};

export default Partners;
