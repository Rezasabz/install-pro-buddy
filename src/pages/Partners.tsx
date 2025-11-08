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
import { partnersStore, Partner } from "@/lib/store";
import { formatCurrency, toPersianDigits } from "@/lib/persian";
import { calculateFinancials, PartnerFinancials } from "@/lib/profitCalculator";
import { Plus, Edit, Trash2, Users, TrendingUp, DollarSign } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const Partners = () => {
  const [partners, setPartners] = useState<Partner[]>([]);
  const [partnerFinancials, setPartnerFinancials] = useState<Map<string, PartnerFinancials>>(new Map());
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPartner, setEditingPartner] = useState<Partner | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    capital: "",
  });
  const { toast } = useToast();

  useEffect(() => {
    loadPartners();
  }, []);

  const loadPartners = () => {
    const data = partnersStore.getAll();
    // محاسبه سهم هر شریک بر اساس سرمایه
    const totalCapital = data.reduce((sum, p) => sum + p.capital, 0);
    const partnersWithShare = data.map(p => ({
      ...p,
      share: totalCapital > 0 ? (p.capital / totalCapital) * 100 : 0,
    }));
    setPartners(partnersWithShare);

    // محاسبه وضعیت مالی هر شریک
    const financials = calculateFinancials();
    const financialMap = new Map<string, PartnerFinancials>();
    financials.partnerFinancials.forEach(p => {
      financialMap.set(p.partnerId, p);
    });
    setPartnerFinancials(financialMap);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const capital = parseFloat(formData.capital);
    if (isNaN(capital) || capital <= 0) {
      toast({
        title: "خطا",
        description: "لطفاً مبلغ سرمایه معتبر وارد کنید",
        variant: "destructive",
      });
      return;
    }

    if (editingPartner) {
      partnersStore.update(editingPartner.id, {
        name: formData.name,
        capital,
      });
      toast({
        title: "موفق",
        description: "شریک با موفقیت بروزرسانی شد",
      });
    } else {
      partnersStore.add({
        name: formData.name,
        capital,
        share: 0,
      });
      toast({
        title: "موفق",
        description: "شریک جدید با موفقیت اضافه شد",
      });
    }

    setFormData({ name: "", capital: "" });
    setEditingPartner(null);
    setIsDialogOpen(false);
    loadPartners();
  };

  const handleEdit = (partner: Partner) => {
    setEditingPartner(partner);
    setFormData({
      name: partner.name,
      capital: partner.capital.toString(),
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm("آیا از حذف این شریک اطمینان دارید؟")) {
      partnersStore.delete(id);
      toast({
        title: "موفق",
        description: "شریک با موفقیت حذف شد",
      });
      loadPartners();
    }
  };

  const financialSummary = calculateFinancials();

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">مدیریت شرکا</h1>
            <p className="text-muted-foreground">
              مدیریت سرمایه‌گذاری، سهم و سود شرکا
            </p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => {
                setEditingPartner(null);
                setFormData({ name: "", capital: "" });
              }}>
                <Plus className="ml-2 h-4 w-4" />
                افزودن شریک
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {editingPartner ? "ویرایش شریک" : "افزودن شریک جدید"}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="name">نام شریک</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    required
                    placeholder="نام و نام خانوادگی"
                  />
                </div>
                <div>
                  <Label htmlFor="capital">مبلغ سرمایه (تومان)</Label>
                  <Input
                    id="capital"
                    type="number"
                    value={formData.capital}
                    onChange={(e) =>
                      setFormData({ ...formData, capital: e.target.value })
                    }
                    required
                    placeholder="۱۰۰۰۰۰۰۰"
                  />
                </div>
                <Button type="submit" className="w-full">
                  {editingPartner ? "بروزرسانی" : "افزودن"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Users className="h-5 w-5" />
                سرمایه کل
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">
                {formatCurrency(financialSummary.totalCapital)}
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                {toPersianDigits(partners.length)} شریک
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <DollarSign className="h-5 w-5 text-success" />
                در دسترس
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-success">
                {formatCurrency(financialSummary.totalAvailableCapital)}
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                قابل استفاده برای خرید
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <DollarSign className="h-5 w-5 text-warning" />
                در گردش
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-warning">
                {formatCurrency(financialSummary.totalUsedCapital)}
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                سرمایه استفاده شده
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <TrendingUp className="h-5 w-5 text-secondary" />
                سود ماهانه
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-secondary">
                {formatCurrency(financialSummary.totalMonthlyProfit)}
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                سود ۴٪ دریافت شده
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <TrendingUp className="h-5 w-5" />
                سود کل
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">
                {formatCurrency(financialSummary.totalProfit)}
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                مجموع سود
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {partners.map((partner) => {
            const financial = partnerFinancials.get(partner.id);
            return (
              <Card key={partner.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="flex justify-between items-start">
                    <span>{partner.name}</span>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(partner)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(partner.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <div className="text-sm text-muted-foreground">سرمایه اولیه</div>
                      <div className="text-lg font-bold">
                        {formatCurrency(partner.capital)}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">سهم</div>
                      <div className="text-lg font-bold text-primary">
                        {toPersianDigits(partner.share.toFixed(1))}%
                      </div>
                    </div>
                  </div>

                  {financial && (
                    <>
                      <div className="pt-3 border-t">
                        <div className="text-sm font-semibold mb-2">وضعیت سرمایه</div>
                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-xs text-muted-foreground">در دسترس</span>
                            <span className="text-sm font-semibold text-success">
                              {formatCurrency(financial.availableCapital)}
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-xs text-muted-foreground">در گردش</span>
                            <span className="text-sm font-semibold text-warning">
                              {formatCurrency(financial.usedCapital)}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="pt-3 border-t">
                        <div className="text-sm font-semibold mb-2">سود لحظه‌ای</div>
                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-xs text-muted-foreground">سود اولیه</span>
                            <span className="text-sm font-semibold text-success">
                              {formatCurrency(financial.initialProfit)}
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-xs text-muted-foreground">سود ماهانه (۴٪)</span>
                            <span className="text-sm font-semibold text-secondary">
                              {formatCurrency(financial.monthlyProfit)}
                            </span>
                          </div>
                          <div className="flex justify-between items-center pt-2 border-t">
                            <span className="text-sm font-semibold">مجموع سود</span>
                            <span className="text-lg font-bold text-primary">
                              {formatCurrency(financial.totalProfit)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </>
                  )}

                  <div className="pt-2 border-t">
                    <div className="text-xs text-muted-foreground">
                      تاریخ ثبت: {new Date(partner.createdAt).toLocaleDateString('fa-IR')}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {partners.length === 0 && (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Users className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground text-center">
                هنوز شریکی ثبت نشده است
                <br />
                برای شروع، یک شریک اضافه کنید
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
};

export default Partners;
