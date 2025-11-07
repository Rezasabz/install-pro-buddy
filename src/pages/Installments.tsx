import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle, Clock, AlertCircle, DollarSign } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface Installment {
  id: string;
  installment_number: number;
  amount: number;
  due_date: string;
  paid_date: string | null;
  status: string;
  sales: {
    customers: { name: string; phone: string };
    phones: { brand: string; model: string };
  };
}

const Installments = () => {
  const [installments, setInstallments] = useState<Installment[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchInstallments();
  }, []);

  const fetchInstallments = async () => {
    try {
      const { data, error } = await supabase
        .from("installments")
        .select("*, sales(customers(name, phone), phones(brand, model))")
        .order("due_date", { ascending: true });

      if (error) throw error;
      setInstallments(data || []);
    } catch (error: any) {
      toast({
        title: "خطا",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsPaid = async (installmentId: string) => {
    try {
      const { error } = await supabase
        .from("installments")
        .update({
          status: "paid",
          paid_date: new Date().toISOString().split("T")[0],
        })
        .eq("id", installmentId);

      if (error) throw error;

      toast({
        title: "موفق",
        description: "قسط به عنوان پرداخت شده علامت‌گذاری شد",
      });

      fetchInstallments();
    } catch (error: any) {
      toast({
        title: "خطا",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const pendingInstallments = installments.filter((i) => i.status === "pending");
  const paidInstallments = installments.filter((i) => i.status === "paid");
  const overdueInstallments = installments.filter((i) => {
    if (i.status !== "pending") return false;
    return new Date(i.due_date) < new Date();
  });

  const totalPending = pendingInstallments.reduce(
    (sum, i) => sum + Number(i.amount),
    0
  );
  const totalPaid = paidInstallments.reduce((sum, i) => sum + Number(i.amount), 0);

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">پیگیری اقساط</h1>
          <p className="text-muted-foreground">
            مدیریت و پیگیری پرداخت اقساط مشتریان
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Card className="bg-gradient-to-br from-warning/10 to-warning/5 border-warning/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                اقساط در انتظار پرداخت
              </CardTitle>
              <Clock className="h-5 w-5 text-warning" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {totalPending.toLocaleString()} تومان
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {pendingInstallments.length} قسط
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-success/10 to-success/5 border-success/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                اقساط پرداخت شده
              </CardTitle>
              <CheckCircle className="h-5 w-5 text-success" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {totalPaid.toLocaleString()} تومان
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {paidInstallments.length} قسط
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-destructive/10 to-destructive/5 border-destructive/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">اقساط معوق</CardTitle>
              <AlertCircle className="h-5 w-5 text-destructive" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {overdueInstallments.length} قسط
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                نیاز به پیگیری
              </p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>لیست اقساط</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8 text-muted-foreground">
                در حال بارگذاری...
              </div>
            ) : installments.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                هنوز قسطی ثبت نشده
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>مشتری</TableHead>
                    <TableHead>گوشی</TableHead>
                    <TableHead>شماره قسط</TableHead>
                    <TableHead>مبلغ</TableHead>
                    <TableHead>تاریخ سررسید</TableHead>
                    <TableHead>تاریخ پرداخت</TableHead>
                    <TableHead>وضعیت</TableHead>
                    <TableHead>عملیات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {installments.map((installment) => {
                    const isOverdue =
                      installment.status === "pending" &&
                      new Date(installment.due_date) < new Date();

                    return (
                      <TableRow key={installment.id}>
                        <TableCell className="font-medium">
                          {installment.sales.customers.name}
                        </TableCell>
                        <TableCell>
                          {installment.sales.phones.brand}{" "}
                          {installment.sales.phones.model}
                        </TableCell>
                        <TableCell>قسط {installment.installment_number}</TableCell>
                        <TableCell>
                          {Number(installment.amount).toLocaleString()} تومان
                        </TableCell>
                        <TableCell>
                          {new Date(installment.due_date).toLocaleDateString(
                            "fa-IR"
                          )}
                        </TableCell>
                        <TableCell>
                          {installment.paid_date
                            ? new Date(installment.paid_date).toLocaleDateString(
                                "fa-IR"
                              )
                            : "—"}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              installment.status === "paid"
                                ? "secondary"
                                : isOverdue
                                ? "destructive"
                                : "default"
                            }
                          >
                            {installment.status === "paid"
                              ? "پرداخت شده"
                              : isOverdue
                              ? "معوق"
                              : "در انتظار"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {installment.status === "pending" && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleMarkAsPaid(installment.id)}
                            >
                              ثبت پرداخت
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default Installments;
