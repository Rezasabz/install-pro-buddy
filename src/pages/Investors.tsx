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
    startDate: new Date().toISOString().split('T')[0],
  });
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const investmentAmount = parseFloat(formData.investmentAmount);
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
        startDate: formData.startDate,
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
        startDate: new Date().toISOString().split('T')[0],
      });
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
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">مدیریت سرمایه‌گذاران</h1>
            <p className="text-muted-foreground">
              سرمایه‌گذارانی که ۴٪ سود از سودهای ماهانه دریافت می‌کنند
            </p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="ml-2 h-4 w-4" />
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
                    type="number"
                    value={formData.investmentAmount}
                    onChange={(e) => setFormData({ ...formData, investmentAmount: e.target.value })}
                    required
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
                  <Input
                    id="startDate"
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    required
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
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                کل سرمایه‌گذاری
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(totalInvestment)}
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                {toPersianDigits(activeInvestors)} سرمایه‌گذار فعال
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                کل سود پرداختی
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-success">
                {formatCurrency(totalProfit)}
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                سود دریافتی سرمایه‌گذاران
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                میانگین بازدهی
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">
                {totalInvestment > 0 
                  ? `${toPersianDigits(((totalProfit / totalInvestment) * 100).toFixed(2))}٪`
                  : '۰٪'
                }
              </div>
              <p className="text-sm text-muted-foreground mt-1">
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
              <Card key={investor.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <CardTitle className="text-lg">{investor.name}</CardTitle>
                      <p className="text-sm text-muted-foreground">
                        {toPersianDigits(investor.phone)} | کد ملی: {toPersianDigits(investor.nationalId)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={investor.status === 'active' ? 'default' : 'secondary'}>
                        {investor.status === 'active' ? 'فعال' : 'غیرفعال'}
                      </Badge>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(investor.id)}
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
                      <div className="text-sm text-muted-foreground">سرمایه‌گذاری</div>
                      <div className="font-semibold">{formatCurrency(investor.investmentAmount)}</div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">درصد سود</div>
                      <div className="font-semibold text-primary">{toPersianDigits(investor.profitRate.toString())}٪</div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">کل سود دریافتی</div>
                      <div className="font-semibold text-success">{formatCurrency(investor.totalProfit)}</div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">تاریخ شروع</div>
                      <div className="font-semibold">{toJalaliDate(investor.startDate)}</div>
                    </div>
                  </div>
                  <div className="mt-4 pt-4 border-t flex justify-between items-center">
                    <div className="text-sm text-muted-foreground">
                      {toPersianDigits(profitTransactions.length)} پرداخت سود
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setDetailsDialog({ open: true, investorId: investor.id })}
                    >
                      <Eye className="h-3 w-3 ml-1" />
                      جزئیات
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {investors.length === 0 && (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <DollarSign className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground text-center">
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
                        investorTransactions.map((trans) => (
                          <div key={trans.id} className="flex items-center justify-between p-3 border rounded-lg">
                            <div className="flex-1">
                              <div className="font-medium">
                                {trans.type === 'profit_payment' ? 'پرداخت سود' : 
                                 trans.type === 'investment_add' ? 'افزایش سرمایه' : 'برداشت سرمایه'}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {toJalaliDate(trans.date)}
                              </div>
                              {trans.description && (
                                <div className="text-xs text-muted-foreground mt-1">
                                  {trans.description}
                                </div>
                              )}
                            </div>
                            <div className={`font-semibold ${
                              trans.type === 'profit_payment' ? 'text-success' : 
                              trans.type === 'investment_add' ? 'text-primary' : 'text-destructive'
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
