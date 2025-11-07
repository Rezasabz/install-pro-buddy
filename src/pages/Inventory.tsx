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
import { Plus, Smartphone, Package } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

interface Phone {
  id: string;
  model: string;
  brand: string;
  purchase_price: number;
  selling_price: number | null;
  purchase_date: string;
  status: string;
}

interface Partner {
  id: string;
  name: string;
}

const Inventory = () => {
  const [phones, setPhones] = useState<Phone[]>([]);
  const [partners, setPartners] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    brand: "",
    model: "",
    purchase_price: "",
    selling_price: "",
    purchase_date: new Date().toISOString().split("T")[0],
  });
  const [contributions, setContributions] = useState<Record<string, string>>({});
  const { toast } = useToast();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [phonesRes, partnersRes] = await Promise.all([
        supabase.from("phones").select("*").order("created_at", { ascending: false }),
        supabase.from("partners").select("id, name"),
      ]);

      if (phonesRes.error) throw phonesRes.error;
      if (partnersRes.error) throw partnersRes.error;

      setPhones(phonesRes.data || []);
      setPartners(partnersRes.data || []);

      const initialContributions: Record<string, string> = {};
      partnersRes.data?.forEach((p) => {
        initialContributions[p.id] = "";
      });
      setContributions(initialContributions);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const totalContributions = Object.values(contributions).reduce(
      (sum, val) => sum + (parseFloat(val) || 0),
      0
    );

    if (totalContributions !== parseFloat(formData.purchase_price)) {
      toast({
        title: "خطا",
        description: "مجموع سرمایه‌گذاری شرکا باید برابر قیمت خرید باشد",
        variant: "destructive",
      });
      return;
    }

    try {
      const { data: phoneData, error: phoneError } = await supabase
        .from("phones")
        .insert([
          {
            brand: formData.brand,
            model: formData.model,
            purchase_price: parseFloat(formData.purchase_price),
            selling_price: formData.selling_price
              ? parseFloat(formData.selling_price)
              : null,
            purchase_date: formData.purchase_date,
          },
        ])
        .select()
        .single();

      if (phoneError) throw phoneError;

      const contributionInserts = Object.entries(contributions)
        .filter(([_, amount]) => parseFloat(amount) > 0)
        .map(([partnerId, amount]) => ({
          phone_id: phoneData.id,
          partner_id: partnerId,
          contribution_amount: parseFloat(amount),
        }));

      if (contributionInserts.length > 0) {
        const { error: contribError } = await supabase
          .from("phone_contributions")
          .insert(contributionInserts);

        if (contribError) throw contribError;
      }

      toast({
        title: "موفق",
        description: "گوشی با موفقیت به موجودی اضافه شد",
      });

      setOpen(false);
      setFormData({
        brand: "",
        model: "",
        purchase_price: "",
        selling_price: "",
        purchase_date: new Date().toISOString().split("T")[0],
      });
      const resetContribs: Record<string, string> = {};
      partners.forEach((p) => {
        resetContribs[p.id] = "";
      });
      setContributions(resetContribs);
      fetchData();
    } catch (error: any) {
      toast({
        title: "خطا",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const availableCount = phones.filter((p) => p.status === "available").length;
  const soldCount = phones.filter((p) => p.status === "sold").length;
  const totalValue = phones
    .filter((p) => p.status === "available")
    .reduce((sum, p) => sum + Number(p.purchase_price), 0);

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">مدیریت موجودی</h1>
            <p className="text-muted-foreground">مدیریت موجودی گوشی‌های موبایل</p>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                افزودن گوشی
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <form onSubmit={handleSubmit}>
                <DialogHeader>
                  <DialogTitle>افزودن گوشی جدید</DialogTitle>
                  <DialogDescription>
                    اطلاعات گوشی و سهم هر شریک را وارد کنید
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="brand">برند</Label>
                      <Input
                        id="brand"
                        value={formData.brand}
                        onChange={(e) =>
                          setFormData({ ...formData, brand: e.target.value })
                        }
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="model">مدل</Label>
                      <Input
                        id="model"
                        value={formData.model}
                        onChange={(e) =>
                          setFormData({ ...formData, model: e.target.value })
                        }
                        required
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="purchase_price">قیمت خرید (تومان)</Label>
                      <Input
                        id="purchase_price"
                        type="number"
                        value={formData.purchase_price}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            purchase_price: e.target.value,
                          })
                        }
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="selling_price">
                        قیمت فروش (تومان) - اختیاری
                      </Label>
                      <Input
                        id="selling_price"
                        type="number"
                        value={formData.selling_price}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            selling_price: e.target.value,
                          })
                        }
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="purchase_date">تاریخ خرید</Label>
                    <Input
                      id="purchase_date"
                      type="date"
                      value={formData.purchase_date}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          purchase_date: e.target.value,
                        })
                      }
                      required
                    />
                  </div>

                  <div className="pt-4 border-t">
                    <h3 className="font-semibold mb-4">سهم شرکا در خرید</h3>
                    <div className="space-y-3">
                      {partners.map((partner) => (
                        <div key={partner.id} className="flex items-center gap-4">
                          <Label className="w-32">{partner.name}</Label>
                          <Input
                            type="number"
                            placeholder="مبلغ سرمایه‌گذاری"
                            value={contributions[partner.id] || ""}
                            onChange={(e) =>
                              setContributions({
                                ...contributions,
                                [partner.id]: e.target.value,
                              })
                            }
                          />
                        </div>
                      ))}
                    </div>
                    <div className="mt-4 p-3 bg-muted rounded-lg">
                      <div className="flex justify-between text-sm">
                        <span>مجموع سرمایه‌گذاری:</span>
                        <span className="font-bold">
                          {Object.values(contributions)
                            .reduce((sum, val) => sum + (parseFloat(val) || 0), 0)
                            .toLocaleString()}{" "}
                          تومان
                        </span>
                      </div>
                      <div className="flex justify-between text-sm mt-1">
                        <span>قیمت خرید:</span>
                        <span className="font-bold">
                          {parseFloat(formData.purchase_price || "0").toLocaleString()}{" "}
                          تومان
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button type="submit">افزودن به موجودی</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">موجودی فعلی</CardTitle>
              <Package className="h-5 w-5 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{availableCount} دستگاه</div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-success/10 to-success/5 border-success/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">فروش رفته</CardTitle>
              <Smartphone className="h-5 w-5 text-success" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{soldCount} دستگاه</div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-secondary/10 to-secondary/5 border-secondary/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">ارزش موجودی</CardTitle>
              <Smartphone className="h-5 w-5 text-secondary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {totalValue.toLocaleString()} تومان
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>لیست گوشی‌ها</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8 text-muted-foreground">
                در حال بارگذاری...
              </div>
            ) : phones.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                هنوز گوشی‌ای اضافه نشده. برای شروع روی "افزودن گوشی" کلیک کنید
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>برند</TableHead>
                    <TableHead>مدل</TableHead>
                    <TableHead>قیمت خرید</TableHead>
                    <TableHead>قیمت فروش</TableHead>
                    <TableHead>تاریخ خرید</TableHead>
                    <TableHead>وضعیت</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {phones.map((phone) => (
                    <TableRow key={phone.id}>
                      <TableCell className="font-medium">{phone.brand}</TableCell>
                      <TableCell>{phone.model}</TableCell>
                      <TableCell>
                        {Number(phone.purchase_price).toLocaleString()} تومان
                      </TableCell>
                      <TableCell>
                        {phone.selling_price
                          ? `${Number(phone.selling_price).toLocaleString()} تومان`
                          : "—"}
                      </TableCell>
                      <TableCell>
                        {new Date(phone.purchase_date).toLocaleDateString("fa-IR")}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            phone.status === "available" ? "default" : "secondary"
                          }
                        >
                          {phone.status === "available" ? "موجود" : "فروخته شده"}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default Inventory;
