import { useEffect, useState } from "react";
import Layout from "@/components/Layout";
import MetricCard from "@/components/MetricCard";
import {
  DollarSign,
  ShoppingCart,
  Smartphone,
  TrendingUp,
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
} from "@/lib/store";
import { formatCurrency, toPersianDigits } from "@/lib/persian";
import { loadSampleData, clearAllData } from "@/lib/sampleData";
import { calculateFinancials } from "@/lib/profitCalculator";
import { useToast } from "@/hooks/use-toast";

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
    initialProfit: 0,
    monthlyProfit: 0,
    totalProfit: 0,
  });
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = () => {
    try {
      const sales = salesStore.getAll();
      const customers = customersStore.getAll();
      const installments = installmentsStore.getAll();

      const totalRevenue = sales.reduce((sum, sale) => sum + sale.announcedPrice, 0);
      
      const pendingInstallments = installments
        .filter(i => i.status === 'pending' || i.status === 'overdue')
        .reduce((sum, inst) => sum + inst.totalAmount, 0);

      // محاسبه وضعیت مالی با استفاده از profitCalculator
      const financials = calculateFinancials();

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
      });
    } finally {
      setLoading(false);
    }
  };

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
      <div className="space-y-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold">داشبورد</h1>
            <p className="text-muted-foreground">
              نمای کلی از کسب و کار فروش موبایل شما
            </p>
          </div>
          <div className="flex gap-2">
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
              >
                <Download className="ml-2 h-4 w-4" />
                بارگذاری داده نمونه
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                if (confirm("⚠️ هشدار: تمام داده‌ها پاک خواهند شد!\n\nاین عمل غیرقابل بازگشت است. آیا مطمئن هستید؟")) {
                  clearAllData();
                }
              }}
            >
              <Trash2 className="ml-2 h-4 w-4" />
              پاک کردن همه
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

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <MetricCard
            title="سود کل"
            value={formatCurrency(stats.totalProfit)}
            icon={TrendingUp}
            description="مجموع سود"
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

        <Card>
          <CardHeader>
            <CardTitle>اقساط در انتظار دریافت</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-warning">
              {formatCurrency(stats.pendingInstallments)}
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              مبلغی که باید از مشتریان دریافت شود (اصل + سود ۴٪)
            </p>
          </CardContent>
        </Card>

        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <div className="text-primary">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="font-semibold mb-1">
                  {stats.totalSales === 0 ? 'راهنمای شروع' : '⚠️ مشکل در نمایش داده‌ها'}
                </h3>
                {stats.totalSales === 0 ? (
                  <>
                    <p className="text-sm text-muted-foreground mb-3">
                      برای شروع، روی دکمه "بارگذاری داده نمونه" کلیک کنید تا با سیستم آشنا شوید.
                    </p>
                    <p className="text-xs text-muted-foreground">
                      💡 اگر خطایی مشاهده کردید، روی "پاک کردن همه" کلیک کنید و دوباره داده نمونه را بارگذاری کنید.
                    </p>
                  </>
                ) : (
                  <>
                    <p className="text-sm text-muted-foreground mb-3">
                      اگر مقادیر صفر یا undefined می‌بینید، داده‌های قدیمی با ساختار جدید سازگار نیستند.
                    </p>
                    <p className="text-sm font-semibold text-destructive mb-2">
                      راه حل: روی دکمه "پاک کردن همه" کلیک کنید و دوباره شروع کنید.
                    </p>
                    <p className="text-xs text-muted-foreground">
                      💡 این مشکل فقط یک بار اتفاق می‌افتد و بعد از پاک کردن، دیگر تکرار نمی‌شود.
                    </p>
                  </>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>دسترسی سریع</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <a
                href="/sales"
                className="block p-4 border rounded-lg hover:bg-accent transition-colors"
              >
                <div className="font-medium">ثبت فروش جدید</div>
                <div className="text-sm text-muted-foreground">
                  ایجاد فروش اقساطی جدید
                </div>
              </a>
              <a
                href="/installments"
                className="block p-4 border rounded-lg hover:bg-accent transition-colors"
              >
                <div className="font-medium">مدیریت اقساط</div>
                <div className="text-sm text-muted-foreground">
                  پیگیری و بروزرسانی وضعیت پرداخت
                </div>
              </a>
              <a
                href="/inventory"
                className="block p-4 border rounded-lg hover:bg-accent transition-colors"
              >
                <div className="font-medium">افزودن به موجودی</div>
                <div className="text-sm text-muted-foreground">
                  اضافه کردن گوشی جدید به موجودی
                </div>
              </a>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>تحلیل کسب و کار</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">
                    میانگین ارزش فروش
                  </span>
                  <span className="font-medium">
                    {formatCurrency(stats.totalSales > 0
                      ? Math.round(stats.totalRevenue / stats.totalSales)
                      : 0)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">
                    نسبت سود اولیه
                  </span>
                  <span className="font-medium text-success">
                    {toPersianDigits(stats.totalProfit > 0
                      ? Math.round((stats.initialProfit / stats.totalProfit) * 100)
                      : 0)}%
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">
                    نسبت سود ماهانه
                  </span>
                  <span className="font-medium text-secondary">
                    {toPersianDigits(stats.totalProfit > 0
                      ? Math.round((stats.monthlyProfit / stats.totalProfit) * 100)
                      : 0)}%
                  </span>
                </div>
                <div className="flex justify-between items-center pt-2 border-t">
                  <span className="text-sm text-muted-foreground">
                    نسبت سرمایه در دسترس
                  </span>
                  <span className="font-medium">
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
