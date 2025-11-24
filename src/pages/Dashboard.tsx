import { useEffect, useState, useCallback } from "react";
import Layout from "@/components/Layout";
import { useDataContext } from "@/contexts/DataContext";
import MetricCard from "@/components/MetricCard";
import {
  DollarSign,
  ShoppingCart,
  Smartphone,
  TrendingUp,
  TrendingDown,
  Users,
  Clock,
  Download,
  Trash2,
  Percent,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  salesStore,
  phonesStore,
  customersStore,
  installmentsStore,
  partnersStore,
  transactionsStore,
  expensesStore,
  Partner,
  Transaction,
} from "@/lib/storeProvider";
import { formatCurrency, toPersianDigits } from "@/lib/persian";
import { loadSampleData, clearAllData } from "@/lib/sampleData";
import { calculateFinancialsFromData } from "@/lib/profitCalculator";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface DashboardStats {
  totalRevenue: number;
  totalSales: number;
  activeCustomers: number;
  pendingInstallments: number;
  totalCapital: number;
  availableCapital: number;
  usedCapital: number;
  initialProfit: number;
  monthlyProfit: number;
  totalProfit: number;
  totalExpenses: number;
  netProfit: number;
}

const Dashboard = () => {
  const [stats, setStats] = useState<DashboardStats>({
    totalRevenue: 0,
    totalSales: 0,
    activeCustomers: 0,
    pendingInstallments: 0,
    totalCapital: 0,
    availableCapital: 0,
    usedCapital: 0,
    totalExpenses: 0,
    netProfit: 0,
    initialProfit: 0,
    monthlyProfit: 0,
    totalProfit: 0,
  });
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [partners, setPartners] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { refreshDashboard } = useDataContext();

  const fetchDashboardStats = useCallback(async () => {
    try {
      const [sales, customers, installments, allTransactions, allPartners, expenses] = await Promise.all([
        salesStore.getAll(),
        customersStore.getAll(),
        installmentsStore.getAll(),
        transactionsStore.getAll(),
        partnersStore.getAll(),
        expensesStore.getAll(),
      ]);

      setTransactions(allTransactions);
      setPartners(allPartners);

      const totalRevenue = sales.reduce((sum, sale) => sum + sale.announcedPrice, 0);
      
      const pendingInstallments = installments
        .filter(i => i.status === 'pending' || i.status === 'overdue')
        .reduce((sum, inst) => sum + inst.totalAmount, 0);

      // محاسبه وضعیت مالی با استفاده از profitCalculator
      const financials = calculateFinancialsFromData(allPartners, sales, installments);

      // محاسبه هزینه‌ها و سود خالص
      const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
      const netProfit = financials.totalProfit - totalExpenses;

      setStats({
        totalRevenue,
        totalSales: sales.length,
        activeCustomers: customers.length,
        pendingInstallments,
        totalCapital: financials.totalCapital,
        availableCapital: financials.totalAvailableCapital,
        usedCapital: financials.totalUsedCapital,
        initialProfit: financials.totalInitialProfit,
        monthlyProfit: financials.totalMonthlyProfit,
        totalProfit: financials.totalProfit,
        totalExpenses,
        netProfit,
      });
    } catch (error) {
      console.error('Error loading dashboard stats:', error);
      toast({
        title: "خطا",
        description: "خطا در بارگذاری داشبورد",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchDashboardStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Listen for refresh events from other pages
  useEffect(() => {
    const handleRefresh = () => {
      fetchDashboardStats();
    };

    window.addEventListener('refreshDashboard', handleRefresh);
    return () => {
      window.removeEventListener('refreshDashboard', handleRefresh);
    };
  }, [fetchDashboardStats]);

  if (loading) {
    return (
      <Layout>
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">در حال بارگذاری داشبورد...</div>
      </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6 animate-fade-scale">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row justify-between items-start gap-4 pb-2">
          <div className="space-y-1">
            <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-primary via-secondary to-primary bg-clip-text text-transparent bg-[length:200%_auto] animate-gradient">
              داشبورد
            </h1>
            <p className="text-muted-foreground/80 text-sm md:text-base">
              نمای کلی از کسب و کار فروش موبایل شما
            </p>
          </div>
          <div className="flex gap-2 flex-wrap">
            {stats.totalSales === 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const loaded = loadSampleData();
                  if (loaded) {
                    toast({
                      title: "موفق",
                      description: "داده‌های نمونه بارگذاری شد",
                    });
                    fetchDashboardStats();
                    window.location.reload(); // رفرش برای نمایش صحیح
                  } else {
                    toast({
                      title: "اطلاع",
                      description: "داده‌ها قبلاً بارگذاری شده‌اند",
                    });
                  }
                }}
                className="gap-2 hover:bg-primary/10 hover:border-primary/50 hover:scale-105 transition-all duration-200"
              >
                <Download className="h-4 w-4" />
                بارگذاری داده نمونه
              </Button>
            )}
            <Button
              variant="destructive"
              size="sm"
              onClick={async () => {
                if (confirm("⚠️ هشدار: تمام داده‌ها پاک خواهند شد!\n\nاین شامل:\n- شرکا و سرمایه‌ها\n- سرمایه‌گذاران\n- موجودی گوشی‌ها\n- فروش‌ها و اقساط\n- مشتریان\n- هزینه‌ها\n- تراکنش‌ها\n\nاین عمل غیرقابل بازگشت است. آیا مطمئن هستید؟")) {
                  toast({
                    title: "در حال پاک کردن...",
                    description: "لطفاً صبر کنید",
                  });
                  const success = await clearAllData();
                  if (!success) {
                    toast({
                      title: "خطا",
                      description: "خطا در پاک کردن داده‌ها",
                      variant: "destructive",
                    });
                  }
                }
              }}
              className="gap-2 hover:scale-105 transition-all duration-200"
            >
              <Trash2 className="h-4 w-4" />
              پاک کردن همه داده‌ها
            </Button>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          <MetricCard
            title="سرمایه کل"
            value={formatCurrency(stats.totalCapital)}
            icon={DollarSign}
            description="مجموع سرمایه شرکا"
          />
          <MetricCard
            title="سرمایه در دسترس"
            value={formatCurrency(stats.availableCapital)}
            icon={DollarSign}
            description="قابل استفاده برای خرید"
          />
          <MetricCard
            title="سرمایه در گردش"
            value={formatCurrency(stats.usedCapital)}
            icon={DollarSign}
            description="استفاده شده"
          />
          <MetricCard
            title="سود اولیه"
            value={formatCurrency(stats.initialProfit)}
            icon={TrendingUp}
            description="تفاوت قیمت"
          />
          <MetricCard
            title="سود ماهانه (۴٪)"
            value={formatCurrency(stats.monthlyProfit)}
            icon={Percent}
            description="دریافت شده"
          />
        </div>

        <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-5">
          <MetricCard
            title="سود کل"
            value={formatCurrency(stats.totalProfit)}
            icon={TrendingUp}
            description="مجموع سود"
          />
          <MetricCard
            title="هزینه‌ها"
            value={formatCurrency(stats.totalExpenses)}
            icon={TrendingDown}
            description="مجموع هزینه‌ها"
            className="text-destructive"
          />
          <MetricCard
            title="سود خالص"
            value={formatCurrency(stats.netProfit)}
            icon={DollarSign}
            description="سود - هزینه"
            className={stats.netProfit >= 0 ? "text-success" : "text-destructive"}
          />
          <MetricCard
            title="درآمد کل"
            value={formatCurrency(stats.totalRevenue)}
            icon={ShoppingCart}
            description="قیمت اعلامی فروش‌ها"
          />
          <MetricCard
            title="تعداد فروش"
            value={toPersianDigits(stats.totalSales)}
            icon={ShoppingCart}
            description="تراکنش‌های انجام شده"
          />
          <MetricCard
            title="مشتریان"
            value={toPersianDigits(stats.activeCustomers)}
            icon={Users}
            description="مجموع مشتریان"
          />
        </div>

        <Card className="relative overflow-hidden bg-gradient-to-br from-warning/10 via-warning/5 to-transparent border-warning/20 hover:shadow-xl transition-all duration-300 group">
          <div className="absolute inset-0 bg-gradient-to-br from-warning/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <CardHeader className="relative z-10">
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-warning" />
              اقساط در انتظار دریافت
            </CardTitle>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-warning to-warning/80 bg-clip-text text-transparent">
              {formatCurrency(stats.pendingInstallments)}
            </div>
            <p className="text-sm text-muted-foreground/80 mt-2 leading-relaxed">
              مبلغی که باید از مشتریان دریافت شود (اصل + سود ۴٪)
            </p>
          </CardContent>
        </Card>

        {stats.totalSales === 0 && (
          <Card className="relative overflow-hidden bg-gradient-to-br from-primary/10 via-primary/5 to-secondary/10 border-primary/30 hover:shadow-xl transition-all duration-300 group">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-secondary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <CardContent className="pt-6 relative z-10">
              <div className="flex items-start gap-4">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/30 to-secondary/30 rounded-full blur-lg" />
                  <div className="relative text-primary">
                    <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
                <div className="flex-1 space-y-2">
                  <h3 className="font-bold text-lg bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                    راهنمای شروع
                  </h3>
                  <p className="text-sm text-muted-foreground/80 leading-relaxed">
                    برای شروع، روی دکمه "بارگذاری داده نمونه" کلیک کنید تا با سیستم آشنا شوید.
                  </p>
                  <p className="text-xs text-muted-foreground/70 bg-muted/50 p-2 rounded-lg border border-border/50">
                    💡 اگر خطایی مشاهده کردید، روی "پاک کردن همه" کلیک کنید و دوباره داده نمونه را بارگذاری کنید.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid gap-4 md:grid-cols-2">
          <Card className="relative overflow-hidden bg-card/80 backdrop-blur-sm hover:shadow-xl transition-all duration-300 group">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <CardHeader className="relative z-10">
              <CardTitle className="flex items-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-gradient-to-r from-primary to-secondary" />
                دسترسی سریع
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 relative z-10">
              <a
                href="/sales"
                className="block p-4 border border-border/50 rounded-xl hover:bg-gradient-to-r hover:from-primary/10 hover:to-secondary/10 hover:border-primary/50 transition-all duration-200 hover:scale-[1.02] group/link"
              >
                <div className="font-semibold group-hover/link:text-primary transition-colors duration-200">
                  ثبت فروش جدید
                </div>
                <div className="text-sm text-muted-foreground/70 mt-1">
                  ایجاد فروش اقساطی جدید
                </div>
              </a>
              <a
                href="/installments"
                className="block p-4 border border-border/50 rounded-xl hover:bg-gradient-to-r hover:from-primary/10 hover:to-secondary/10 hover:border-primary/50 transition-all duration-200 hover:scale-[1.02] group/link"
              >
                <div className="font-semibold group-hover/link:text-primary transition-colors duration-200">
                  مدیریت اقساط
                </div>
                <div className="text-sm text-muted-foreground/70 mt-1">
                  پیگیری و بروزرسانی وضعیت پرداخت
                </div>
              </a>
              <a
                href="/partners"
                className="block p-4 border border-border/50 rounded-xl hover:bg-gradient-to-r hover:from-primary/10 hover:to-secondary/10 hover:border-primary/50 transition-all duration-200 hover:scale-[1.02] group/link"
              >
                <div className="font-semibold group-hover/link:text-primary transition-colors duration-200">
                  مدیریت سرمایه
                </div>
                <div className="text-sm text-muted-foreground/70 mt-1">
                  افزایش یا برداشت سرمایه و سود
                </div>
              </a>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden bg-card/80 backdrop-blur-sm hover:shadow-xl transition-all duration-300 group">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <CardHeader className="relative z-10">
              <CardTitle className="flex items-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-gradient-to-r from-primary to-secondary" />
                آخرین تراکنش‌های مالی
              </CardTitle>
            </CardHeader>
            <CardContent className="relative z-10">
              {(() => {
                const allTransactions = transactions
                  .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                  .slice(0, 5);

                if (allTransactions.length === 0) {
                  return (
                    <div className="text-center py-8 text-muted-foreground/70 text-sm">
                      هنوز تراکنشی ثبت نشده است
                    </div>
                  );
                }

                return (
                  <div className="space-y-2">
                    {allTransactions.map((transaction, index) => {
                      const partner = partners.find(p => p.id === transaction.partnerId);
                      const isWithdraw = transaction.type.includes('withdraw');
                      
                      return (
                        <div
                          key={transaction.id}
                          className="flex justify-between items-center p-3 border border-border/50 rounded-lg hover:bg-accent/50 hover:border-primary/30 transition-all duration-200 hover:scale-[1.01] animate-slide-in"
                          style={{ animationDelay: `${index * 50}ms` }}
                        >
                          <div className="flex-1">
                            <div className="text-sm font-semibold">{partner?.name || 'نامشخص'}</div>
                            <div className="text-xs text-muted-foreground/70 mt-0.5">
                              {transaction.description}
                            </div>
                          </div>
                          <div className={`text-sm font-bold px-2 py-1 rounded-md ${
                            isWithdraw 
                              ? 'text-destructive bg-destructive/10' 
                              : 'text-success bg-success/10'
                          }`}>
                            {isWithdraw ? '−' : '+'}{formatCurrency(transaction.amount)}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden bg-card/80 backdrop-blur-sm hover:shadow-xl transition-all duration-300 group">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <CardHeader className="relative z-10">
              <CardTitle className="flex items-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-gradient-to-r from-primary to-secondary" />
                تحلیل کسب و کار
              </CardTitle>
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="space-y-4">
                <div className="flex justify-between items-center p-2 rounded-lg hover:bg-accent/30 transition-colors duration-200">
                  <span className="text-sm text-muted-foreground/80 font-medium">
                    میانگین ارزش فروش
                  </span>
                  <span className="font-bold text-foreground">
                    {formatCurrency(stats.totalSales > 0
                      ? Math.round(stats.totalRevenue / stats.totalSales)
                      : 0)}
                  </span>
                </div>
                <div className="flex justify-between items-center p-2 rounded-lg hover:bg-success/10 transition-colors duration-200">
                  <span className="text-sm text-muted-foreground/80 font-medium">
                    نسبت سود اولیه
                  </span>
                  <span className="font-bold text-success px-2 py-1 bg-success/10 rounded-md">
                    {toPersianDigits(stats.totalProfit > 0
                      ? Math.round((stats.initialProfit / stats.totalProfit) * 100)
                      : 0)}%
                  </span>
                </div>
                <div className="flex justify-between items-center p-2 rounded-lg hover:bg-secondary/10 transition-colors duration-200">
                  <span className="text-sm text-muted-foreground/80 font-medium">
                    نسبت سود ماهانه
                  </span>
                  <span className="font-bold text-secondary px-2 py-1 bg-secondary/10 rounded-md">
                    {toPersianDigits(stats.totalProfit > 0
                      ? Math.round((stats.monthlyProfit / stats.totalProfit) * 100)
                      : 0)}%
                  </span>
                </div>
                <div className="flex justify-between items-center pt-3 border-t border-border/50 p-2 rounded-lg hover:bg-accent/30 transition-colors duration-200">
                  <span className="text-sm text-muted-foreground/80 font-medium">
                    نسبت سرمایه در دسترس
                  </span>
                  <span className="font-bold text-foreground px-2 py-1 bg-primary/10 rounded-md">
                    {toPersianDigits(stats.totalCapital > 0
                      ? Math.round((stats.availableCapital / stats.totalCapital) * 100)
                      : 0)}%
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default Dashboard;
