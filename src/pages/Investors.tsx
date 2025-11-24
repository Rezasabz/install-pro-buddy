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
import { Badge } from "@/components/ui/badge";
import {
  investorsStore,
  investorTransactionsStore,
  Investor,
  InvestorTransaction,
} from "@/lib/storeProvider";
import { formatCurrency, toJalaliDate, toPersianDigits } from "@/lib/persian";
import { Plus, TrendingUp, DollarSign, Trash2, Eye } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { JalaliDatePicker } from "@/components/JalaliDatePicker";

const Investors = () => {
  const [investors, setInvestors] = useState<Investor[]>([]);
  const [transactions, setTransactions] = useState<InvestorTransaction[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [detailsDialog, setDetailsDialog] = useState<{ open: boolean; investorId: string }>({ open: false, investorId: '' });
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    nationalId: "",
    investmentAmount: "",
    profitRate: "4",
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

      setFormData({
        name: "",
        phone: "",
        nationalId: "",
        investmentAmount: "",
        profitRate: "4",
      });
      setStartDate(new Date());
      setIsDialogOpen(false);
      await loadData();
    } catch (error) {
      console.error('Error creating investor:', error);
      toast({
        title: "خطا",
        description: "خطا در ثبت سرمایه‌گذار",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("آیا از حذف این سرمایه‌گذار مطمئن هستید؟")) {
      return;
    }

    try {
      await investorsStore.delete(id);
      toast({
        title: "موفق",
        description: "سرمایه‌گذار حذف شد",
      });
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
              سرمایه‌گذارانی که ۴٪ سود از سودهای ماهانه دریافت می‌کنند
            </p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2 hover:scale-105 transition-all duration-200">
                <Plus className="h-4 w-4" />
                افزودن سرمایه‌گذار
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>افزودن سرمایه‌گذار جدید</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="name">نام</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="phone">شماره تماس</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="nationalId">کد ملی</Label>
                  <Input
                    id="nationalId"
                    value={formData.nationalId}
                    onChange={(e) => setFormData({ ...formData, nationalId: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="investmentAmount">مبلغ سرمایه‌گذاری (تومان)</Label>
                  <Input
                    id="investmentAmount"
                    type="text"
                    value={formData.investmentAmount}
                    onChange={handleInvestmentAmountChange}
                    placeholder="مثال: ۱۰,۰۰۰,۰۰۰"
                    required
                    dir="ltr"
                  />
                </div>
                <div>
                  <Label htmlFor="profitRate">درصد سود (پیش‌فرض ۴٪)</Label>
                  <Input
                    id="profitRate"
                    type="number"
                    step="0.1"
                    value={formData.profitRate}
                    onChange={(e) => setFormData({ ...formData, profitRate: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="startDate">تاریخ شروع</Label>
                  <JalaliDatePicker
                    value={startDate}
                    onChange={setStartDate}
                    placeholder="انتخاب تاریخ شروع"
                  />
                </div>
                <Button type="submit" className="w-full">
                  ثبت سرمایه‌گذار
                </Button>
              </form>
            </DialogContent>
          </Dialog>
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
              <Card key={investor.id} className="relative overflow-hidden bg-card/80 backdrop-blur-sm hover:shadow-xl hover:scale-[1.01] transition-all duration-300 group">
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
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(investor.id)}
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
                  <div className="mt-4 pt-4 border-t border-border/50 flex justify-between items-center">
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
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>جزئیات سرمایه‌گذار</DialogTitle>
            </DialogHeader>
            {(() => {
              const investor = investors.find(i => i.id === detailsDialog.investorId);
              if (!investor) return null;
              
              const investorTransactions = transactions.filter(t => t.investorId === investor.id);
              
              return (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-sm text-muted-foreground">نام</div>
                      <div className="font-semibold">{investor.name}</div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">شماره تماس</div>
                      <div className="font-semibold">{toPersianDigits(investor.phone)}</div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">کد ملی</div>
                      <div className="font-semibold">{toPersianDigits(investor.nationalId)}</div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">مبلغ سرمایه‌گذاری</div>
                      <div className="font-semibold">{formatCurrency(investor.investmentAmount)}</div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">درصد سود</div>
                      <div className="font-semibold">{toPersianDigits(investor.profitRate.toString())}٪</div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">کل سود دریافتی</div>
                      <div className="font-semibold text-success">{formatCurrency(investor.totalProfit)}</div>
                    </div>
                  </div>

                  <div className="pt-4 border-t">
                    <h3 className="font-semibold mb-3">تاریخچه تراکنش‌ها</h3>
                    <div className="space-y-2">
                      {investorTransactions.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-4">
                          هنوز تراکنشی ثبت نشده است
                        </p>
                      ) : (
                        investorTransactions.map((trans, index) => (
                          <div 
                            key={trans.id} 
                            className="flex items-center justify-between p-3 border border-border/50 rounded-lg hover:bg-accent/30 hover:border-primary/30 transition-all duration-200 hover:scale-[1.01] animate-slide-in"
                            style={{ animationDelay: `${index * 50}ms` }}
                          >
                            <div className="flex-1">
                              <div className="font-semibold">
                                {trans.type === 'profit_payment' ? 'پرداخت سود' : 
                                 trans.type === 'investment_add' ? 'افزایش سرمایه' : 'برداشت سرمایه'}
                              </div>
                              <div className="text-xs text-muted-foreground/70 mt-0.5">
                                {toJalaliDate(trans.date)}
                              </div>
                              {trans.description && (
                                <div className="text-xs text-muted-foreground/60 mt-1">
                                  {trans.description}
                                </div>
                              )}
                            </div>
                            <div className={`font-bold px-2 py-1 rounded-md ${
                              trans.type === 'profit_payment' ? 'text-success bg-success/10' : 
                              trans.type === 'investment_add' ? 'text-primary bg-primary/10' : 'text-destructive bg-destructive/10'
                            }`}>
                              {formatCurrency(trans.amount)}
                            </div>
                          </div>
                        ))
                      )}
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

export default Investors;
