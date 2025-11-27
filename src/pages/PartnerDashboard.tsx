import { useEffect, useState } from "react";
import Layout from "@/components/Layout";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { partnersStore, transactionsStore, Partner, Transaction } from "@/lib/storeProvider";
import { formatCurrency, toPersianDigits, toJalaliDate } from "@/lib/persian";
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  Wallet, 
  PiggyBank,
  ArrowUpCircle,
  ArrowDownCircle,
  Activity,
  Calendar,
  Percent,
  Sparkles,
  BarChart3,
  LineChart,
  PieChart,
  Award,
  Target,
  Zap
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Line, LineChart as RechartsLineChart, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Area, AreaChart } from "recharts";

const PartnerDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [partner, setPartner] = useState<Partner | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Redirect if not a partner
    if (user?.role !== 'partner' || !user.partnerId) {
      toast({
        title: "دسترسی محدود",
        description: "این صفحه فقط برای شرکا در دسترس است",
        variant: "destructive",
      });
      navigate('/');
      return;
    }

    loadPartnerData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const loadPartnerData = async () => {
    if (!user?.partnerId) return;

    try {
      setLoading(true);
      
      // Load partner data
      const allPartners = await partnersStore.getAll();
      const currentPartner = allPartners.find(p => p.id === user.partnerId);
      
      if (!currentPartner) {
        toast({
          title: "خطا",
          description: "اطلاعات شریک یافت نشد",
          variant: "destructive",
        });
        return;
      }

      setPartner(currentPartner);

      // Load transactions
      const allTransactions = await transactionsStore.getAll();
      const partnerTransactions = allTransactions
        .filter(t => t.partnerId === user.partnerId)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      
      setTransactions(partnerTransactions);
    } catch (error) {
      console.error('Error loading partner data:', error);
      toast({
        title: "خطا",
        description: "خطا در بارگذاری اطلاعات",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto" />
            <p className="text-muted-foreground">در حال بارگذاری...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (!partner) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Card className="max-w-md">
            <CardContent className="pt-6 text-center">
              <p className="text-muted-foreground">اطلاعات شریک یافت نشد</p>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'capital_add':
        return <ArrowUpCircle className="h-5 w-5 text-success" />;
      case 'capital_withdraw':
        return <ArrowDownCircle className="h-5 w-5 text-destructive" />;
      case 'initial_profit_withdraw':
      case 'monthly_profit_withdraw':
        return <DollarSign className="h-5 w-5 text-warning" />;
      case 'profit_to_capital':
        return <TrendingUp className="h-5 w-5 text-primary" />;
      default:
        return <Activity className="h-5 w-5 text-muted-foreground" />;
    }
  };

  const getTransactionLabel = (type: string) => {
    const labels: Record<string, string> = {
      'capital_add': 'افزایش سرمایه',
      'capital_withdraw': 'برداشت سرمایه',
      'initial_profit_withdraw': 'برداشت سود اولیه',
      'monthly_profit_withdraw': 'برداشت سود ماهانه',
      'profit_to_capital': 'تبدیل سود به سرمایه',
    };
    return labels[type] || type;
  };

  const getTransactionColor = (type: string) => {
    switch (type) {
      case 'capital_add':
      case 'profit_to_capital':
        return 'text-success';
      case 'capital_withdraw':
        return 'text-destructive';
      case 'initial_profit_withdraw':
      case 'monthly_profit_withdraw':
        return 'text-warning';
      default:
        return 'text-muted-foreground';
    }
  };

  // محاسبات مالی
  const usedCapital = partner ? partner.capital - partner.availableCapital : 0;
  const totalProfit = partner ? partner.initialProfit + partner.monthlyProfit : 0;
  const capitalUtilization = partner && partner.capital > 0 
    ? ((usedCapital / partner.capital) * 100).toFixed(1) 
    : '0';
  
  // آمار تراکنش‌ها
  const totalDeposits = transactions
    .filter(t => t.type === 'capital_add' || t.type === 'profit_to_capital')
    .reduce((sum, t) => sum + t.amount, 0);
  
  const totalWithdrawals = transactions
    .filter(t => t.type === 'capital_withdraw' || t.type.includes('profit_withdraw'))
    .reduce((sum, t) => sum + t.amount, 0);

  // داده‌های نمودار - تراکنش‌های 6 ماه اخیر
  const last6MonthsData = transactions
    .slice(0, 6)
    .reverse()
    .map((t, index) => ({
      name: `تراکنش ${index + 1}`,
      amount: t.type.includes('withdraw') ? -t.amount : t.amount,
      date: toJalaliDate(t.date)
    }));

  return (
    <Layout>
      <div className="space-y-6 animate-fade-scale">
        {/* Hero Header با Gradient Background */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-purple-600 via-blue-600 to-cyan-600 p-8 md:p-12 shadow-2xl">
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 right-0 w-96 h-96 bg-white rounded-full blur-3xl animate-pulse" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-white rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
          </div>
          
          <div className="relative z-10 space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-4 rounded-2xl bg-white/20 backdrop-blur-sm border border-white/30">
                <Award className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl md:text-4xl font-bold text-white">
                  خوش آمدید، {user?.fullName}
                </h1>
                <p className="text-white/90 text-sm md:text-base mt-1">
                  داشبورد اختصاصی شریک
                </p>
              </div>
            </div>
            
            {partner && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                <div className="p-4 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20">
                  <div className="flex items-center gap-2 mb-2">
                    <Percent className="h-4 w-4 text-white/80" />
                    <span className="text-xs text-white/80">سهم شراکت</span>
                  </div>
                  <p className="text-2xl font-bold text-white">
                    {toPersianDigits(partner.share.toString())}%
                  </p>
                </div>
                <div className="p-4 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20">
                  <div className="flex items-center gap-2 mb-2">
                    <Target className="h-4 w-4 text-white/80" />
                    <span className="text-xs text-white/80">استفاده از سرمایه</span>
                  </div>
                  <p className="text-2xl font-bold text-white">
                    {toPersianDigits(capitalUtilization)}%
                  </p>
                </div>
                <div className="p-4 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20">
                  <div className="flex items-center gap-2 mb-2">
                    <Zap className="h-4 w-4 text-white/80" />
                    <span className="text-xs text-white/80">کل سود</span>
                  </div>
                  <p className="text-xl font-bold text-white">
                    {formatCurrency(totalProfit)}
                  </p>
                </div>
                <div className="p-4 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20">
                  <div className="flex items-center gap-2 mb-2">
                    <Calendar className="h-4 w-4 text-white/80" />
                    <span className="text-xs text-white/80">عضویت از</span>
                  </div>
                  <p className="text-sm font-semibold text-white">
                    {toJalaliDate(partner.createdAt)}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* آمار کلی با طراحی خاص */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {/* Total Deposits */}
          <Card className="relative overflow-hidden group hover:shadow-2xl transition-all duration-500">
            <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 via-transparent to-emerald-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-green-500/20 to-transparent rounded-full blur-2xl" />
            <CardHeader className="relative z-10 pb-3">
              <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <div className="p-2.5 rounded-xl bg-gradient-to-br from-green-500/20 to-emerald-500/20 group-hover:scale-110 transition-transform duration-300">
                  <ArrowUpCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
                </div>
                کل واریزی‌ها
              </CardTitle>
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="text-3xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                {formatCurrency(totalDeposits)}
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                مجموع سرمایه‌گذاری‌ها
              </p>
            </CardContent>
          </Card>

          {/* Total Withdrawals */}
          <Card className="relative overflow-hidden group hover:shadow-2xl transition-all duration-500">
            <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 via-transparent to-red-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-orange-500/20 to-transparent rounded-full blur-2xl" />
            <CardHeader className="relative z-10 pb-3">
              <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <div className="p-2.5 rounded-xl bg-gradient-to-br from-orange-500/20 to-red-500/20 group-hover:scale-110 transition-transform duration-300">
                  <ArrowDownCircle className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                </div>
                کل برداشت‌ها
              </CardTitle>
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
                {formatCurrency(totalWithdrawals)}
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                مجموع برداشت‌ها
              </p>
            </CardContent>
          </Card>

          {/* Net Balance */}
          <Card className="relative overflow-hidden group hover:shadow-2xl transition-all duration-500 md:col-span-2 lg:col-span-1">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 via-transparent to-pink-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-purple-500/20 to-transparent rounded-full blur-2xl" />
            <CardHeader className="relative z-10 pb-3">
              <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <div className="p-2.5 rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 group-hover:scale-110 transition-transform duration-300">
                  <BarChart3 className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                </div>
                موجودی خالص
              </CardTitle>
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                {formatCurrency(totalDeposits - totalWithdrawals)}
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                واریزی - برداشت
              </p>
            </CardContent>
          </Card>
        </div>

        {/* کارت‌های اصلی سرمایه و سود - طراحی Premium */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Capital Overview */}
          <Card className="relative overflow-hidden border-2 border-blue-500/20 hover:border-blue-500/40 transition-all duration-500 group">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-cyan-500/5" />
            <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-br from-blue-500/10 to-transparent rounded-full blur-3xl group-hover:scale-150 transition-transform duration-700" />
            
            <CardHeader className="relative z-10">
              <CardTitle className="flex items-center gap-3 text-xl">
                <div className="p-3 rounded-2xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20 group-hover:scale-110 transition-transform duration-300">
                  <Wallet className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
                وضعیت سرمایه
              </CardTitle>
            </CardHeader>
            
            <CardContent className="relative z-10 space-y-6">
              {/* Total Capital */}
              <div className="p-5 rounded-2xl bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border border-blue-500/20">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium text-muted-foreground">سرمایه کل</span>
                  <Wallet className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <p className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                  {formatCurrency(partner.capital)}
                </p>
              </div>

              {/* Capital Breakdown */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/20">
                  <div className="flex items-center gap-2 mb-2">
                    <PiggyBank className="h-4 w-4 text-green-600 dark:text-green-400" />
                    <span className="text-xs font-medium text-muted-foreground">آزاد</span>
                  </div>
                  <p className="text-xl font-bold text-green-700 dark:text-green-300">
                    {formatCurrency(partner.availableCapital)}
                  </p>
                </div>
                
                <div className="p-4 rounded-xl bg-orange-500/10 border border-orange-500/20">
                  <div className="flex items-center gap-2 mb-2">
                    <Activity className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                    <span className="text-xs font-medium text-muted-foreground">در گردش</span>
                  </div>
                  <p className="text-xl font-bold text-orange-700 dark:text-orange-300">
                    {formatCurrency(usedCapital)}
                  </p>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">استفاده از سرمایه</span>
                  <span className="font-bold text-primary">{toPersianDigits(capitalUtilization)}%</span>
                </div>
                <div className="h-3 bg-muted rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full transition-all duration-1000"
                    style={{ width: `${capitalUtilization}%` }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Profit Overview */}
          <Card className="relative overflow-hidden border-2 border-purple-500/20 hover:border-purple-500/40 transition-all duration-500 group">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 via-transparent to-pink-500/5" />
            <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-br from-purple-500/10 to-transparent rounded-full blur-3xl group-hover:scale-150 transition-transform duration-700" />
            
            <CardHeader className="relative z-10">
              <CardTitle className="flex items-center gap-3 text-xl">
                <div className="p-3 rounded-2xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 group-hover:scale-110 transition-transform duration-300">
                  <TrendingUp className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                </div>
                وضعیت سود
              </CardTitle>
            </CardHeader>
            
            <CardContent className="relative z-10 space-y-6">
              {/* Total Profit */}
              <div className="p-5 rounded-2xl bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/20">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium text-muted-foreground">کل سود</span>
                  <Sparkles className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                </div>
                <p className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                  {formatCurrency(totalProfit)}
                </p>
              </div>

              {/* Profit Breakdown */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-orange-500/10 border border-orange-500/20">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                    <span className="text-xs font-medium text-muted-foreground">اولیه</span>
                  </div>
                  <p className="text-xl font-bold text-orange-700 dark:text-orange-300">
                    {formatCurrency(partner.initialProfit)}
                  </p>
                </div>
                
                <div className="p-4 rounded-xl bg-pink-500/10 border border-pink-500/20">
                  <div className="flex items-center gap-2 mb-2">
                    <DollarSign className="h-4 w-4 text-pink-600 dark:text-pink-400" />
                    <span className="text-xs font-medium text-muted-foreground">ماهانه</span>
                  </div>
                  <p className="text-xl font-bold text-pink-700 dark:text-pink-300">
                    {formatCurrency(partner.monthlyProfit)}
                  </p>
                </div>
              </div>

              {/* ROI */}
              <div className="p-4 rounded-xl bg-gradient-to-r from-yellow-500/10 to-amber-500/10 border border-yellow-500/20">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Award className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
                    <span className="text-sm font-medium text-muted-foreground">بازده سرمایه (ROI)</span>
                  </div>
                  <p className="text-2xl font-bold text-yellow-700 dark:text-yellow-300">
                    {partner.capital > 0 ? toPersianDigits(((totalProfit / partner.capital) * 100).toFixed(1)) : '0'}%
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* نمودار و تراکنش‌ها */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Transaction Chart */}
          {last6MonthsData.length > 0 && (
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <LineChart className="h-5 w-5 text-primary" />
                  روند تراکنش‌ها
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={last6MonthsData}>
                      <defs>
                        <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.1} />
                      <XAxis 
                        dataKey="name" 
                        stroke="#9ca3af"
                        fontSize={12}
                      />
                      <YAxis 
                        stroke="#9ca3af"
                        fontSize={12}
                        tickFormatter={(value) => `${(value / 1000000).toFixed(0)}M`}
                      />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Area 
                        type="monotone" 
                        dataKey="amount" 
                        stroke="#8b5cf6" 
                        strokeWidth={2}
                        fill="url(#colorAmount)" 
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Transaction Summary */}
          <Card className={cn(last6MonthsData.length === 0 && "lg:col-span-3")}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PieChart className="h-5 w-5 text-primary" />
                خلاصه تراکنش‌ها
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 rounded-lg bg-green-500/10 border border-green-500/20">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-lg bg-green-500/20">
                      <ArrowUpCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                    </div>
                    <span className="text-sm font-medium">واریزی‌ها</span>
                  </div>
                  <span className="text-lg font-bold text-green-700 dark:text-green-300">
                    {transactions.filter(t => !t.type.includes('withdraw')).length}
                  </span>
                </div>

                <div className="flex items-center justify-between p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-lg bg-red-500/20">
                      <ArrowDownCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
                    </div>
                    <span className="text-sm font-medium">برداشت‌ها</span>
                  </div>
                  <span className="text-lg font-bold text-red-700 dark:text-red-300">
                    {transactions.filter(t => t.type.includes('withdraw')).length}
                  </span>
                </div>

                <div className="flex items-center justify-between p-3 rounded-lg bg-primary/10 border border-primary/20">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-lg bg-primary/20">
                      <Activity className="h-4 w-4 text-primary" />
                    </div>
                    <span className="text-sm font-medium">کل تراکنش‌ها</span>
                  </div>
                  <span className="text-lg font-bold text-primary">
                    {toPersianDigits(transactions.length.toString())}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Transactions List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-primary" />
              تراکنش‌های اخیر
            </CardTitle>
          </CardHeader>
          <CardContent>
            {transactions.length === 0 ? (
              <div className="text-center py-12">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
                  <Activity className="h-8 w-8 text-muted-foreground" />
                </div>
                <p className="text-muted-foreground">هنوز تراکنشی ثبت نشده است</p>
              </div>
            ) : (
              <div className="space-y-3">
                {transactions.slice(0, 10).map((transaction, index) => (
                  <div
                    key={transaction.id}
                    className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-muted/30 to-muted/10 hover:from-muted/50 hover:to-muted/30 transition-all duration-300 border border-border/50 hover:border-primary/30 animate-slide-in"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <div className="flex items-center gap-4">
                      <div className={cn(
                        "p-3 rounded-xl transition-transform duration-300 hover:scale-110",
                        transaction.type.includes('withdraw') 
                          ? "bg-red-500/10" 
                          : "bg-green-500/10"
                      )}>
                        {getTransactionIcon(transaction.type)}
                      </div>
                      <div>
                        <p className="font-semibold text-foreground">
                          {getTransactionLabel(transaction.type)}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {transaction.description}
                        </p>
                      </div>
                    </div>
                    <div className="text-left">
                      <p className={cn("text-xl font-bold", getTransactionColor(transaction.type))}>
                        {transaction.type.includes('withdraw') ? '-' : '+'}
                        {formatCurrency(transaction.amount)}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {toJalaliDate(transaction.date)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default PartnerDashboard;
