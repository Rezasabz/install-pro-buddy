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
          <div className="text-muted-foreground">Loading dashboard...</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">
            Overview of your mobile sales business
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <MetricCard
            title="Total Revenue"
            value={`$${stats.totalRevenue.toLocaleString()}`}
            icon={DollarSign}
            description="Total sales revenue"
          />
          <MetricCard
            title="Total Profit"
            value={`$${stats.totalProfit.toLocaleString()}`}
            icon={TrendingUp}
            description="Profit from sold phones"
          />
          <MetricCard
            title="Total Sales"
            value={stats.totalSales}
            icon={ShoppingCart}
            description="Completed transactions"
          />
          <MetricCard
            title="Available Inventory"
            value={stats.availablePhones}
            icon={Smartphone}
            description="Phones ready for sale"
          />
          <MetricCard
            title="Active Customers"
            value={stats.activeCustomers}
            icon={Users}
            description="Total registered customers"
          />
          <MetricCard
            title="Pending Installments"
            value={`$${stats.pendingInstallments.toLocaleString()}`}
            icon={Clock}
            description="Amount yet to be collected"
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <a
                href="/sales"
                className="block p-4 border rounded-lg hover:bg-accent transition-colors"
              >
                <div className="font-medium">Record New Sale</div>
                <div className="text-sm text-muted-foreground">
                  Create a new installment sale
                </div>
              </a>
              <a
                href="/installments"
                className="block p-4 border rounded-lg hover:bg-accent transition-colors"
              >
                <div className="font-medium">Manage Installments</div>
                <div className="text-sm text-muted-foreground">
                  Track and update payment status
                </div>
              </a>
              <a
                href="/inventory"
                className="block p-4 border rounded-lg hover:bg-accent transition-colors"
              >
                <div className="font-medium">Add Inventory</div>
                <div className="text-sm text-muted-foreground">
                  Add new phones to inventory
                </div>
              </a>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Business Insights</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">
                    Average Sale Value
                  </span>
                  <span className="font-medium">
                    $
                    {stats.totalSales > 0
                      ? Math.round(stats.totalRevenue / stats.totalSales)
                      : 0}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">
                    Profit Margin
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
                    Collection Rate
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
