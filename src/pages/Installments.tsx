import { useState, useEffect } from "react";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  installmentsStore,
  Installment,
  salesStore,
  customersStore,
} from "@/lib/store";
import { formatCurrency, toJalaliDate, toPersianDigits } from "@/lib/persian";
import { addCapitalFromPayment, addProfitToPartners } from "@/lib/profitCalculator";
import { DollarSign, CheckCircle, Clock, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const Installments = () => {
  const [installments, setInstallments] = useState<Installment[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    loadInstallments();
  }, []);

  const loadInstallments = () => {
    const allInstallments = installmentsStore.getAll();
    
    // بروزرسانی وضعیت اقساط معوق
    const today = new Date();
    allInstallments.forEach(inst => {
      if (inst.status === 'pending' && new Date(inst.dueDate) < today) {
        installmentsStore.update(inst.id, { status: 'overdue' });
      }
    });

    // مرتب‌سازی بر اساس تاریخ سررسید
    const sorted = installmentsStore.getAll().sort((a, b) => 
      new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
    );
    
    setInstallments(sorted);
  };

  const handlePayment = (installmentId: string) => {
    const installment = installmentsStore.getAll().find(i => i.id === installmentId);
    if (!installment) return;

    // ثبت پرداخت
    installmentsStore.update(installmentId, {
      status: 'paid',
      paidDate: new Date().toISOString(),
    });

    // بازگشت اصل بدهی به سرمایه
    addCapitalFromPayment(installment.principalAmount);

    // افزودن سود به حساب شرکا
    addProfitToPartners(installment.interestAmount);

    // بررسی اینکه آیا همه اقساط پرداخت شده‌اند
    const saleInstallments = installmentsStore.getBySaleId(installment.saleId);
    const allPaid = saleInstallments.every(i => i.status === 'paid');
    
    if (allPaid) {
      salesStore.update(installment.saleId, { status: 'completed' });
      toast({
        title: "تبریک!",
        description: `تمام اقساط پرداخت شد. اصل: ${formatCurrency(installment.principalAmount)} به سرمایه بازگشت. سود: ${formatCurrency(installment.interestAmount)}`,
      });
    } else {
      toast({
        title: "موفق",
        description: `قسط پرداخت شد. اصل: ${formatCurrency(installment.principalAmount)} به سرمایه بازگشت. سود: ${formatCurrency(installment.interestAmount)}`,
      });
    }

    loadInstallments();
  };

  const getInstallmentDetails = (installment: Installment) => {
    const sale = salesStore.getAll().find(s => s.id === installment.saleId);
    if (!sale) return null;

    const customer = customersStore.getAll().find(c => c.id === sale.customerId);
    const saleInstallments = installmentsStore.getBySaleId(sale.id);

    return {
      customer,
      announcedPrice: sale.announcedPrice,
      installmentNumber: installment.installmentNumber,
      totalInstallments: saleInstallments.length,
    };
  };

  const pendingInstallments = installments.filter(i => i.status === 'pending');
  const overdueInstallments = installments.filter(i => i.status === 'overdue');
  const paidInstallments = installments.filter(i => i.status === 'paid');

  const totalPending = pendingInstallments.reduce((sum, i) => sum + i.totalAmount, 0);
  const totalOverdue = overdueInstallments.reduce((sum, i) => sum + i.totalAmount, 0);
  const totalPaid = paidInstallments.reduce((sum, i) => sum + i.totalAmount, 0);

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">مدیریت اقساط</h1>
          <p className="text-muted-foreground">
            پیگیری و ثبت پرداخت اقساط مشتریان (سود ۴٪ ماهانه)
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Clock className="h-5 w-5 text-info" />
                در انتظار پرداخت
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(totalPending)}
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                {toPersianDigits(pendingInstallments.length)} قسط
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <AlertCircle className="h-5 w-5 text-warning" />
                معوق
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-warning">
                {formatCurrency(totalOverdue)}
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                {toPersianDigits(overdueInstallments.length)} قسط
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <CheckCircle className="h-5 w-5 text-success" />
                پرداخت شده
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-success">
                {formatCurrency(totalPaid)}
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                {toPersianDigits(paidInstallments.length)} قسط
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          {installments.map((installment) => {
            const details = getInstallmentDetails(installment);
            if (!details) return null;

            return (
              <Card key={installment.id} className="hover:shadow-lg transition-shadow">
                <CardContent className="pt-6">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold text-lg">
                          {details.customer?.name}
                        </h3>
                        <Badge
                          variant={
                            installment.status === 'paid' ? 'default' :
                            installment.status === 'overdue' ? 'destructive' : 'secondary'
                          }
                        >
                          {installment.status === 'paid' ? 'پرداخت شده' :
                           installment.status === 'overdue' ? 'معوق' : 'در انتظار'}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        قیمت اعلامی: {formatCurrency(details.announcedPrice)}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        قسط {toPersianDigits(details.installmentNumber)} از {toPersianDigits(details.totalInstallments)}
                      </p>
                    </div>

                    <div className="flex flex-col md:items-end gap-2">
                      <div className="space-y-1 text-right">
                        <div className="text-sm text-muted-foreground">
                          اصل: {formatCurrency(installment.principalAmount)}
                        </div>
                        <div className="text-sm text-secondary">
                          سود ۴٪: {formatCurrency(installment.interestAmount)}
                        </div>
                        <div className="text-2xl font-bold">
                          مجموع: {formatCurrency(installment.totalAmount)}
                        </div>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        سررسید: {toJalaliDate(installment.dueDate)}
                      </div>
                      {installment.paidDate && (
                        <div className="text-sm text-success">
                          پرداخت: {toJalaliDate(installment.paidDate)}
                        </div>
                      )}
                      <div className="text-xs text-muted-foreground">
                        مانده بعد از این قسط: {formatCurrency(installment.remainingDebt)}
                      </div>
                    </div>

                    {installment.status !== 'paid' && (
                      <Button
                        onClick={() => handlePayment(installment.id)}
                        className="md:w-auto"
                      >
                        <DollarSign className="ml-2 h-4 w-4" />
                        ثبت پرداخت
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {installments.length === 0 && (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <DollarSign className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground text-center">
                هنوز قسطی ثبت نشده است
                <br />
                ابتدا یک فروش ثبت کنید
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
};

export default Installments;
