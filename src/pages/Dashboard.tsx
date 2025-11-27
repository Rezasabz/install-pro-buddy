import { useEffect, useState, useCallback } from "react";
import Layout from "@/components/Layout";
import { useDataContext } from "@/contexts/DataContext";
import { DeletingOverlay } from "@/components/DeletingOverlay";
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
  Zap,
  Activity,
  AlertCircle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
  salesStore,
  customersStore,
  installmentsStore,
  partnersStore,
  transactionsStore,
  expensesStore,
  phonesStore,
  Partner,
  Transaction,
  Sale,
  Phone,
  Expense,
} from "@/lib/storeProvider";
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from "@/components/ui/chart";
import { Line, LineChart, Pie, PieChart, Cell, Bar, BarChart, XAxis, YAxis, CartesianGrid, Area, AreaChart } from "recharts";
import { formatCurrency, toPersianDigits, toJalaliDate } from "@/lib/persian";
import { dateToJalali, jalaliMonthNames } from "@/lib/jalali";
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
  const [clearDataDialog, setClearDataDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
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
  const [sales, setSales] = useState<Sale[]>([]);
  const [phones, setPhones] = useState<Phone[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { refreshDashboard } = useDataContext();

  const fetchDashboardStats = useCallback(async () => {
    try {
      const [allSales, customers, allInstallments, allTransactions, allPartners, allExpenses, allPhones, allInvestors, allInvestorTransactions] = await Promise.all([
        salesStore.getAll(),
        customersStore.getAll(),
        installmentsStore.getAll(),
        transactionsStore.getAll(),
        partnersStore.getAll(),
        expensesStore.getAll(),
        phonesStore.getAll(),
        (async () => {
          try {
            const { investorsStore } = await import('@/lib/storeProvider');
            return await investorsStore.getAll();
          } catch {
            return [];
          }
        })(),
        (async () => {
          try {
            const { investorTransactionsStore } = await import('@/lib/storeProvider');
            return await investorTransactionsStore.getAll();
          } catch {
            return [];
          }
        })(),
      ]);

      setTransactions(allTransactions);
      setPartners(allPartners);
      setSales(allSales);
      setExpenses(allExpenses);
      setPhones(allPhones);

      const totalRevenue = allSales.reduce((sum, sale) => sum + sale.announcedPrice, 0);
      
      const pendingInstallments = allInstallments
        .filter(i => i.status === 'pending' || i.status === 'overdue')
        .reduce((sum, inst) => sum + inst.totalAmount, 0);

      const financials = calculateFinancialsFromData(allPartners, allSales, allInstallments);
      const totalExpenses = allExpenses.reduce((sum, e) => sum + e.amount, 0);
      
      // محاسبه سرمایه سرمایه‌گذاران
      const investorsCapital = allInvestors.reduce((sum, inv) => sum + inv.investmentAmount, 0);
      
      // محاسبه سود پرداختی به سرمایه‌گذاران
      const investorsProfitPaid = allInvestorTransactions
        .filter(t => t.type === 'profit_payment')
        .reduce((sum, t) => sum + t.amount, 0);
      
      // سود خالص = سود کل - هزینه‌ها - سود پرداختی به سرمایه‌گذاران
      const netProfit = financials.totalProfit - totalExpenses - investorsProfitPaid;

      setStats({
        totalRevenue,
        totalSales: allSales.length,
        activeCustomers: customers.length,
        pendingInstallments,
        totalCapital: financials.totalCapital + investorsCapital, // سرمایه کل شامل سرمایه سرمایه‌گذاران
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

  const handleClearAllData = async () => {
    setIsDeleting(true);
    setClearDataDialog(false);
    
    const { clearAllData } = await import('@/lib/sampleData');
    await clearAllData();
    
    // Redirect handled by clearAllData
  };

  useEffect(() => {
    fetchDashboardStats();
  }, [fetchDashboardStats]);

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


  const recentTransactions = transactions
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5);

  // آماده‌سازی داده‌های نمودارها
  // 1. نمودار خطی - Total Revenue (ماهانه)
  const monthlyRevenue = sales.reduce((acc, sale) => {
    const date = new Date(sale.saleDate);
    const jalali = dateToJalali(date);
    const month = jalaliMonthNames[jalali.month - 1];
    if (!acc[month]) {
      acc[month] = 0;
    }
    acc[month] += sale.announcedPrice;
    return acc;
  }, {} as Record<string, number>);

  const revenueChartData = jalaliMonthNames.map(month => ({
    month,
    revenue: monthlyRevenue[month] || 0,
  }));

  // 2. نمودار دایره‌ای - Sales by Category (بر اساس برند)
  const salesByBrand = sales.reduce((acc, sale) => {
    const phone = phones.find(p => p.id === sale.phoneId);
    const brand = phone?.brand || 'نامشخص';
    if (!acc[brand]) {
      acc[brand] = { name: brand, value: 0, count: 0 };
    }
    acc[brand].value += sale.announcedPrice;
    acc[brand].count += 1;
    return acc;
  }, {} as Record<string, { name: string; value: number; count: number }>);

  const pieChartData = Object.values(salesByBrand)
    .sort((a, b) => b.value - a.value)
    .slice(0, 5)
    .map((item, index) => ({
      name: item.name,
      value: item.value,
      count: item.count,
      color: [
        'hsl(var(--primary))',
        'hsl(var(--secondary))',
        'hsl(var(--success))',
        'hsl(var(--warning))',
        'hsl(var(--destructive))',
      ][index] || 'hsl(var(--muted-foreground))',
    }));

  // 3. نمودار برترین محصولات بر اساس تعداد فروش
  const topProductsBySales = phones
    .filter(p => p.status === 'sold')
    .reduce((acc, phone) => {
      const key = `${phone.brand} ${phone.model}`;
      if (!acc[key]) {
        acc[key] = { name: key, sales: 0, revenue: 0 };
      }
      acc[key].sales += 1;
      acc[key].revenue += phone.sellingPrice;
      return acc;
    }, {} as Record<string, { name: string; sales: number; revenue: number }>);

  const topProductsData = Object.values(topProductsBySales)
    .sort((a, b) => b.sales - a.sales)
    .slice(0, 5)
    .map((item, index) => ({
      name: `#${index + 1}`,
      fullName: item.name,
      sales: item.sales,
      revenue: item.revenue,
    }));

  // 4. نمودار میله‌ای عمودی - Monthly Sales (تعداد فروش ماهانه)
  const monthlySalesCount = sales.reduce((acc, sale) => {
    const date = new Date(sale.saleDate);
    const jalali = dateToJalali(date);
    const month = jalaliMonthNames[jalali.month - 1];
    if (!acc[month]) {
      acc[month] = 0;
    }
    acc[month] += 1;
    return acc;
  }, {} as Record<string, number>);

  const monthlySalesData = jalaliMonthNames.map(month => ({
    month,
    sales: monthlySalesCount[month] || 0,
  }));

  return (
    <Layout>
      <div className="space-y-6 pb-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="space-y-1.5">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
              داشبورد
            </h1>
            <p className="text-sm text-muted-foreground">
              نمای کلی از کسب و کار فروش موبایل شما
            </p>
          </div>
          <div className="flex gap-2 flex-wrap sm:flex-nowrap">
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
                    window.location.reload();
                  } else {
                    toast({
                      title: "اطلاع",
                      description: "داده‌ها قبلاً بارگذاری شده‌اند",
                    });
                  }
                }}
                className="gap-2"
              >
                <Download className="h-4 w-4" />
                بارگذاری داده نمونه
              </Button>
            )}
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setClearDataDialog(true)}
              className="gap-2"
            >
              <Trash2 className="h-4 w-4" />
              پاک کردن همه داده‌ها
            </Button>
          </div>
        </div>

        {/* کارت‌های آماری اصلی */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
            title="سود کل"
            value={formatCurrency(stats.totalProfit)}
            icon={TrendingUp}
            description="مجموع سود"
          />
          <MetricCard
            title="سود خالص"
            value={formatCurrency(stats.netProfit)}
            icon={DollarSign}
            description="سود - هزینه"
            className={stats.netProfit >= 0 ? "text-success" : "text-destructive"}
          />
        </div>

        {/* کارت اقساط در انتظار */}
        <Card className="border-warning/20 bg-warning/5">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base font-semibold">
              <Clock className="h-4 w-4 text-warning" />
              اقساط در انتظار دریافت
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl sm:text-3xl font-bold text-warning mb-1.5">
              {formatCurrency(stats.pendingInstallments)}
            </div>
            <p className="text-sm text-muted-foreground">
              مبلغی که باید از مشتریان دریافت شود (اصل + سود ۴٪)
            </p>
          </CardContent>
        </Card>

        {/* بخش نمودارها */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp className="h-4 w-4 text-primary" />
            <h2 className="text-lg font-semibold">
              نمودارها و تحلیل‌ها
            </h2>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {/* نمودار خطی - Total Revenue */}
            <Card className="flex flex-col">
              <CardHeader className="pb-3 flex-shrink-0">
                <CardTitle className="text-base font-semibold">درآمد کل</CardTitle>
              </CardHeader>
              <CardContent className="flex-1 min-h-0">
                <ChartContainer 
                  config={{ 
                    revenue: { 
                      label: "درآمد", 
                      color: "hsl(var(--chart-1))" 
                    } 
                  }} 
                  className="h-full w-full [&>div]:!aspect-auto [&>div]:!h-full"
                >
                  <AreaChart data={revenueChartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="fillRevenue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--color-revenue)" stopOpacity={0.8} />
                        <stop offset="95%" stopColor="var(--color-revenue)" stopOpacity={0.1} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis 
                      dataKey="month" 
                      tickLine={false}
                      axisLine={false}
                      tickMargin={8}
                      tick={{ fontSize: 12 }}
                      interval="preserveStartEnd"
                    />
                    <YAxis 
                      tickLine={false}
                      axisLine={false}
                      tickMargin={8}
                      tick={{ fontSize: 12 }}
                      tickFormatter={(value) => `${(value / 1000000).toFixed(0)}M`}
                      domain={[(dataMin: number) => Math.max(0, dataMin), (dataMax: number) => Math.ceil(dataMax * 1.1)]}
                    />
                    <ChartTooltip 
                      cursor={false}
                      content={<ChartTooltipContent indicator="dot" />}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="revenue" 
                      fill="url(#fillRevenue)"
                      fillOpacity={0.4}
                      stroke="var(--color-revenue)"
                      strokeWidth={2}
                      isAnimationActive={true}
                      baseValue={0}
                    />
                  </AreaChart>
                </ChartContainer>
              </CardContent>
            </Card>

            {/* نمودار دایره‌ای - Sales by Category */}
            <Card className="flex flex-col">
              <CardHeader className="pb-3 flex-shrink-0">
                <CardTitle className="text-base font-semibold">فروش بر اساس برند</CardTitle>
              </CardHeader>
              <CardContent className="flex-1 min-h-0">
                {pieChartData.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-muted-foreground/70 text-sm">
                    داده‌ای برای نمایش وجود ندارد
                  </div>
                ) : (
                  <ChartContainer 
                    config={pieChartData.reduce((acc, item, index) => {
                      acc[`value${index}`] = {
                        label: item.name,
                        color: item.color,
                      };
                      return acc;
                    }, {} as Record<string, { label: string; color: string }>)} 
                    className="h-full w-full [&>div]:!aspect-auto [&>div]:!h-full"
                  >
                    <PieChart>
                      <ChartTooltip 
                        content={<ChartTooltipContent hideLabel />}
                      />
                      <Pie
                        data={pieChartData.map((item, index) => ({ ...item, fill: `var(--color-value${index})` }))}
                        cx="50%"
                        cy="45%"
                        labelLine={false}
                        label={({ percent }) => `${(percent * 100).toFixed(0)}%`}
                        outerRadius={90}
                        innerRadius={50}
                        dataKey="value"
                      >
                        {pieChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={`var(--color-value${index})`} />
                        ))}
                      </Pie>
                      <ChartLegend 
                        content={<ChartLegendContent nameKey="name" />}
                        wrapperStyle={{ paddingTop: '20px' }}
                      />
                    </PieChart>
                  </ChartContainer>
                )}
              </CardContent>
            </Card>

            {/* نمودار برترین محصولات */}
            <Card className="flex flex-col">
              <CardHeader className="pb-3 flex-shrink-0">
                <CardTitle className="text-base font-semibold">محصولات پرفروش</CardTitle>
              </CardHeader>
              <CardContent className="flex-1 min-h-0">
                {topProductsData.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-muted-foreground/70 text-sm">
                    داده‌ای برای نمایش وجود ندارد
                  </div>
                ) : (
                  <div className="h-full w-full flex flex-col gap-3">
                    {topProductsData.map((item, index) => (
                      <div key={index} className="flex items-center gap-3">
                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                          <span className="text-xs font-bold text-primary">{index + 1}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium truncate">{item.fullName}</div>
                          <div className="text-xs text-muted-foreground">
                            {item.sales} فروش • {formatCurrency(item.revenue)}
                          </div>
                        </div>
                        <div className="flex-shrink-0">
                          <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-gradient-to-r from-primary to-secondary transition-all"
                              style={{ 
                                width: `${(item.sales / topProductsData[0].sales) * 100}%` 
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* نمودار میله‌ای عمودی - Monthly Sales */}
            <Card className="flex flex-col">
              <CardHeader className="pb-3 flex-shrink-0">
                <CardTitle className="text-base font-semibold">فروش ماهانه</CardTitle>
              </CardHeader>
              <CardContent className="flex-1 min-h-0">
                <ChartContainer 
                  config={{ 
                    sales: { 
                      label: "تعداد فروش", 
                      color: "hsl(var(--chart-3))" 
                    } 
                  }} 
                  className="h-full w-full [&>div]:!aspect-auto [&>div]:!h-full"
                >
                    <BarChart data={monthlySalesData} margin={{ top: 5, right: 10, left: 0, bottom: 60 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis 
                        dataKey="month" 
                        tickLine={false}
                        axisLine={false}
                        tickMargin={8}
                        tick={{ fontSize: 10 }}
                        angle={-45}
                        textAnchor="end"
                        height={60}
                        interval={0}
                      />
                      <YAxis 
                        tickLine={false}
                        axisLine={false}
                        tickMargin={8}
                        tick={{ fontSize: 11 }}
                        allowDecimals={false}
                        domain={[0, 'dataMax + 1']}
                      />
                      <ChartTooltip 
                        cursor={false}
                        content={<ChartTooltipContent indicator="line" />}
                      />
                      <Bar 
                        dataKey="sales" 
                        fill="var(--color-sales)"
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ChartContainer>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* بخش کارت‌های اطلاعاتی */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {/* کارت‌های آماری اضافی */}
          <div className="grid gap-3 grid-cols-2 sm:grid-cols-1 lg:grid-cols-2 sm:col-span-2 lg:col-span-1">
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
            <MetricCard
              title="هزینه‌ها"
              value={formatCurrency(stats.totalExpenses)}
              icon={TrendingDown}
              description="مجموع هزینه‌ها"
              className="text-destructive"
            />
          </div>

          {/* دسترسی سریع */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base font-semibold">
                <Zap className="h-4 w-4 text-primary" />
                دسترسی سریع
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <a href="/sales" className="block p-3 rounded-lg border hover:bg-accent hover:border-primary/50 transition-colors">
                <div className="font-medium text-sm">ثبت فروش جدید</div>
                <div className="text-xs text-muted-foreground mt-0.5">ایجاد فروش اقساطی</div>
              </a>
              <a href="/installments" className="block p-3 rounded-lg border hover:bg-accent hover:border-primary/50 transition-colors">
                <div className="font-medium text-sm">مدیریت اقساط</div>
                <div className="text-xs text-muted-foreground mt-0.5">پیگیری پرداخت‌ها</div>
              </a>
              <a href="/partners" className="block p-3 rounded-lg border hover:bg-accent hover:border-primary/50 transition-colors">
                <div className="font-medium text-sm">مدیریت سرمایه</div>
                <div className="text-xs text-muted-foreground mt-0.5">افزایش یا برداشت</div>
              </a>
            </CardContent>
          </Card>

          {/* آخرین تراکنش‌ها */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base font-semibold">
                <Activity className="h-4 w-4 text-secondary" />
                آخرین تراکنش‌ها
              </CardTitle>
            </CardHeader>
            <CardContent>
              {recentTransactions.length === 0 ? (
                <div className="text-center py-8 text-sm text-muted-foreground">
                  هنوز تراکنشی ثبت نشده است
                </div>
              ) : (
                <div className="space-y-2">
                  {recentTransactions.map((transaction) => {
                    const partner = partners.find(p => p.id === transaction.partnerId);
                    const isWithdraw = transaction.type.includes('withdraw');
                    
                    return (
                      <div
                        key={transaction.id}
                        className="flex justify-between items-center p-3 rounded-lg border hover:bg-accent transition-colors"
                      >
                        <div className="flex-1 min-w-0 pr-3">
                          <div className="text-sm font-medium truncate">{partner?.name || 'نامشخص'}</div>
                          <div className="text-xs text-muted-foreground truncate mt-0.5">{transaction.description}</div>
                        </div>
                        <div className={cn(
                          "text-sm font-semibold px-2.5 py-1 rounded-md whitespace-nowrap",
                          isWithdraw ? 'text-destructive bg-destructive/10' : 'text-success bg-success/10'
                        )}>
                          {isWithdraw ? '−' : '+'}{formatCurrency(transaction.amount)}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* کارت تحلیل کسب و کار */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base font-semibold">
              <TrendingUp className="h-4 w-4 text-primary" />
              تحلیل کسب و کار
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <div className="flex justify-between items-center p-3 rounded-lg border hover:bg-accent transition-colors">
                <span className="text-sm text-muted-foreground font-medium">میانگین ارزش فروش</span>
                <span className="text-sm font-semibold">
                  {formatCurrency(stats.totalSales > 0 ? Math.round(stats.totalRevenue / stats.totalSales) : 0)}
                </span>
              </div>
              <div className="flex justify-between items-center p-3 rounded-lg border hover:bg-accent transition-colors">
                <span className="text-sm text-muted-foreground font-medium">نسبت سود اولیه</span>
                <span className="text-sm font-semibold text-success px-2 py-1 bg-success/10 rounded-md">
                  {toPersianDigits(stats.totalProfit > 0 ? Math.round((stats.initialProfit / stats.totalProfit) * 100) : 0)}%
                </span>
              </div>
              <div className="flex justify-between items-center p-3 rounded-lg border hover:bg-accent transition-colors">
                <span className="text-sm text-muted-foreground font-medium">نسبت سود ماهانه</span>
                <span className="text-sm font-semibold text-secondary px-2 py-1 bg-secondary/10 rounded-md">
                  {toPersianDigits(stats.totalProfit > 0 ? Math.round((stats.monthlyProfit / stats.totalProfit) * 100) : 0)}%
                </span>
              </div>
              <div className="flex justify-between items-center p-3 rounded-lg border hover:bg-accent transition-colors">
                <span className="text-sm text-muted-foreground font-medium">نسبت سرمایه در دسترس</span>
                <span className="text-sm font-semibold text-primary px-2 py-1 bg-primary/10 rounded-md">
                  {toPersianDigits(stats.totalCapital > 0 ? Math.round((stats.availableCapital / stats.totalCapital) * 100) : 0)}%
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* پیام راهنمای شروع */}
        {stats.totalSales === 0 && (
          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <div className="text-primary mt-0.5">
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-sm mb-1">
                    راهنمای شروع
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    برای شروع، روی دکمه "بارگذاری داده نمونه" کلیک کنید تا با سیستم آشنا شوید.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
        {/* AlertDialog پاک کردن تمام داده‌ها */}
        <AlertDialog open={clearDataDialog} onOpenChange={setClearDataDialog}>
          <AlertDialogContent className="max-w-lg p-0 gap-0 overflow-hidden border-destructive/20">
            {/* Header با گرادیانت قرمز */}
            <div className="relative bg-gradient-to-br from-destructive via-red-600 to-orange-600 p-6 pb-8 overflow-hidden">
              <div className="absolute inset-0 bg-black/10" />
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-3xl" />
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full blur-2xl" />
              
              <div className="relative z-10 flex flex-col items-center text-center">
                <div className="relative mb-4">
                  <Trash2 className="h-16 w-16 text-white animate-pulse" />
                  <div className="absolute inset-0 bg-white/20 rounded-full blur-xl animate-pulse" />
                </div>
                <AlertDialogTitle className="text-2xl font-black text-white mb-2">
                  ⚠️ پاک کردن تمام داده‌ها
                </AlertDialogTitle>
                <p className="text-white/90 text-sm font-medium">
                  این عمل غیرقابل بازگشت است!
                </p>
              </div>
            </div>

            <AlertDialogDescription className="p-6 space-y-4 bg-background">
              {/* کارت هشدار */}
              <Card className="border-destructive/30 bg-destructive/5">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-5 w-5 text-destructive" />
                    <CardTitle className="text-base font-bold text-destructive">
                      هشدار مهم
                    </CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-foreground mb-3 font-medium">
                    تمام داده‌های زیر به صورت دائمی حذف خواهند شد:
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="flex items-center gap-2 p-2 rounded-md bg-background/50 border border-border/50">
                      <div className="h-2 w-2 rounded-full bg-destructive" />
                      <span className="text-xs font-medium text-foreground">شرکا و سرمایه‌ها</span>
                    </div>
                    <div className="flex items-center gap-2 p-2 rounded-md bg-background/50 border border-border/50">
                      <div className="h-2 w-2 rounded-full bg-destructive" />
                      <span className="text-xs font-medium text-foreground">سرمایه‌گذاران</span>
                    </div>
                    <div className="flex items-center gap-2 p-2 rounded-md bg-background/50 border border-border/50">
                      <div className="h-2 w-2 rounded-full bg-destructive" />
                      <span className="text-xs font-medium text-foreground">موجودی گوشی‌ها</span>
                    </div>
                    <div className="flex items-center gap-2 p-2 rounded-md bg-background/50 border border-border/50">
                      <div className="h-2 w-2 rounded-full bg-destructive" />
                      <span className="text-xs font-medium text-foreground">فروش‌ها و اقساط</span>
                    </div>
                    <div className="flex items-center gap-2 p-2 rounded-md bg-background/50 border border-border/50">
                      <div className="h-2 w-2 rounded-full bg-destructive" />
                      <span className="text-xs font-medium text-foreground">مشتریان</span>
                    </div>
                    <div className="flex items-center gap-2 p-2 rounded-md bg-background/50 border border-border/50">
                      <div className="h-2 w-2 rounded-full bg-destructive" />
                      <span className="text-xs font-medium text-foreground">هزینه‌ها</span>
                    </div>
                    <div className="flex items-center gap-2 p-2 rounded-md bg-background/50 border border-border/50 col-span-2">
                      <div className="h-2 w-2 rounded-full bg-destructive" />
                      <span className="text-xs font-medium text-foreground">تراکنش‌ها و تمام اطلاعات مرتبط</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* پیام تایید */}
              <div className="p-4 rounded-lg bg-muted/50 border border-border/50">
                <p className="text-sm text-center text-foreground font-semibold">
                  آیا مطمئن هستید که می‌خواهید تمام داده‌ها را پاک کنید؟
                </p>
              </div>
            </AlertDialogDescription>

            <AlertDialogFooter className="p-6 pt-0 gap-3 bg-background">
              <AlertDialogCancel className="h-11 text-base font-semibold flex-1 border-2 hover:bg-accent hover:text-accent-foreground">
                انصراف
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleClearAllData}
                className="h-11 text-base font-semibold flex-1 bg-gradient-to-r from-destructive via-red-600 to-orange-600 hover:from-destructive/90 hover:via-red-500 hover:to-orange-500 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-200"
              >
                <Trash2 className="h-4 w-4 ml-2" />
                پاک کردن همه داده‌ها
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
      {/* Deleting Overlay */}
      <DeletingOverlay isVisible={isDeleting} />
    </Layout>
  );
};

export default Dashboard;
