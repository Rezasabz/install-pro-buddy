import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import Layout from "@/components/Layout";
import MetricCard from "@/components/MetricCard";
import {
  DollarSign,
  ShoppingCart,
  Smartphone,
  TrendingUp,
  Users,
  Clock,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

interface DashboardStats {
  totalRevenue: number;
  totalSales: number;
  availablePhones: number;
  activeCustomers: number;
  pendingInstallments: number;
  totalProfit: number;
}

const Dashboard = () => {
  const [stats, setStats] = useState<DashboardStats>({
    totalRevenue: 0,
    totalSales: 0,
    availablePhones: 0,
    activeCustomers: 0,
    pendingInstallments: 0,
    totalProfit: 0,
  });
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      // Fetch total sales
      const { data: salesData, error: salesError } = await supabase
        .from("sales")
        .select("total_price");

      if (salesError) throw salesError;

      const totalRevenue = salesData?.reduce(
        (sum, sale) => sum + Number(sale.total_price),
        0
      ) || 0;

      // Fetch available phones
      const { data: phonesData, error: phonesError } = await supabase
        .from("phones")
        .select("status, purchase_price, selling_price")
        .eq("status", "available");

      if (phonesError) throw phonesError;

      // Fetch customers
      const { data: customersData, error: customersError } = await supabase
        .from("customers")
        .select("id");

      if (customersError) throw customersError;

      // Fetch pending installments
      const { data: installmentsData, error: installmentsError } = await supabase
        .from("installments")
        .select("amount")
        .eq("status", "pending");

      if (installmentsError) throw installmentsError;

      const pendingAmount = installmentsData?.reduce(
        (sum, inst) => sum + Number(inst.amount),
        0
      ) || 0;

      // Calculate total profit (simplified - selling price - purchase price for sold phones)
      const { data: soldPhones, error: soldPhonesError } = await supabase
        .from("phones")
        .select("purchase_price, selling_price")
        .eq("status", "sold");

      if (soldPhonesError) throw soldPhonesError;

      const totalProfit = soldPhones?.reduce(
        (sum, phone) =>
          sum + (Number(phone.selling_price || 0) - Number(phone.purchase_price)),
        0
      ) || 0;

      setStats({
        totalRevenue,
        totalSales: salesData?.length || 0,
        availablePhones: phonesData?.length || 0,
        activeCustomers: customersData?.length || 0,
        pendingInstallments: pendingAmount,
        totalProfit,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
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
        <div>
          <h1 className="text-3xl font-bold">داشبورد</h1>
          <p className="text-muted-foreground">
            نمای کلی از کسب و کار فروش موبایل شما
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <MetricCard
            title="درآمد کل"
            value={`${stats.totalRevenue.toLocaleString()} تومان`}
            icon={DollarSign}
            description="مجموع درآمد فروش"
          />
          <MetricCard
            title="سود کل"
            value={`${stats.totalProfit.toLocaleString()} تومان`}
            icon={TrendingUp}
            description="سود حاصل از فروش گوشی‌ها"
          />
          <MetricCard
            title="تعداد فروش"
            value={stats.totalSales}
            icon={ShoppingCart}
            description="تراکنش‌های انجام شده"
          />
          <MetricCard
            title="موجودی"
            value={stats.availablePhones}
            icon={Smartphone}
            description="گوشی‌های آماده فروش"
          />
          <MetricCard
            title="مشتریان فعال"
            value={stats.activeCustomers}
            icon={Users}
            description="مجموع مشتریان ثبت شده"
          />
          <MetricCard
            title="اقساط معوق"
            value={`${stats.pendingInstallments.toLocaleString()} تومان`}
            icon={Clock}
            description="مبلغی که باید دریافت شود"
          />
        </div>

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
                    {stats.totalSales > 0
                      ? Math.round(stats.totalRevenue / stats.totalSales).toLocaleString()
                      : 0} تومان
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">
                    حاشیه سود
                  </span>
                  <span className="font-medium text-success">
                    {stats.totalRevenue > 0
                      ? Math.round((stats.totalProfit / stats.totalRevenue) * 100)
                      : 0}
                    %
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">
                    نرخ وصولی
                  </span>
                  <span className="font-medium">
                    {stats.totalRevenue > 0
                      ? Math.round(
                          ((stats.totalRevenue - stats.pendingInstallments) /
                            stats.totalRevenue) *
                            100
                        )
                      : 0}
                    %
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
