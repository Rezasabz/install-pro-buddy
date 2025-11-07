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
import { Plus, ShoppingCart, TrendingUp } from "lucide-react";
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

interface Sale {
  id: string;
  total_price: number;
  down_payment: number;
  installment_amount: number;
  installment_count: number;
  sale_date: string;
  status: string;
  phones: { brand: string; model: string };
  customers: { name: string; phone: string };
}

interface Phone {
  id: string;
  brand: string;
  model: string;
  purchase_price: number;
  selling_price: number | null;
}

interface Customer {
  id: string;
  name: string;
  phone: string;
}

const Sales = () => {
  const [sales, setSales] = useState<Sale[]>([]);
  const [phones, setPhones] = useState<Phone[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    phone_id: "",
    customer_id: "",
    total_price: "",
    down_payment: "",
    installment_count: "",
    sale_date: new Date().toISOString().split("T")[0],
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [salesRes, phonesRes, customersRes] = await Promise.all([
        supabase
          .from("sales")
          .select("*, phones(brand, model), customers(name, phone)")
          .order("created_at", { ascending: false }),
        supabase.from("phones").select("*").eq("status", "available"),
        supabase.from("customers").select("id, name, phone"),
      ]);

      if (salesRes.error) throw salesRes.error;
      if (phonesRes.error) throw phonesRes.error;
      if (customersRes.error) throw customersRes.error;

      setSales(salesRes.data || []);
      setPhones(phonesRes.data || []);
      setCustomers(customersRes.data || []);
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

    const totalPrice = parseFloat(formData.total_price);
    const downPayment = parseFloat(formData.down_payment);
    const installmentCount = parseInt(formData.installment_count);

    const remainingAmount = totalPrice - downPayment;
    const installmentAmount = remainingAmount / installmentCount;

    try {
      const { data: saleData, error: saleError } = await supabase
        .from("sales")
        .insert([
          {
            phone_id: formData.phone_id,
            customer_id: formData.customer_id,
            total_price: totalPrice,
            down_payment: downPayment,
            installment_amount: installmentAmount,
            installment_count: installmentCount,
            sale_date: formData.sale_date,
          },
        ])
        .select()
        .single();

      if (saleError) throw saleError;

      // ایجاد اقساط
      const installments = [];
      const startDate = new Date(formData.sale_date);

      for (let i = 1; i <= installmentCount; i++) {
        const dueDate = new Date(startDate);
        dueDate.setMonth(dueDate.getMonth() + i);

        installments.push({
          sale_id: saleData.id,
          installment_number: i,
          amount: installmentAmount,
          due_date: dueDate.toISOString().split("T")[0],
        });
      }

      const { error: installmentsError } = await supabase
        .from("installments")
        .insert(installments);

      if (installmentsError) throw installmentsError;

      toast({
        title: "موفق",
        description: "فروش با موفقیت ثبت شد",
      });

      setOpen(false);
      setFormData({
        phone_id: "",
        customer_id: "",
        total_price: "",
        down_payment: "",
        installment_count: "",
        sale_date: new Date().toISOString().split("T")[0],
      });
      fetchData();
    } catch (error: any) {
      toast({
        title: "خطا",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const totalRevenue = sales.reduce((sum, s) => sum + Number(s.total_price), 0);

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">مدیریت فروش</h1>
            <p className="text-muted-foreground">ثبت و پیگیری فروش اقساطی</p>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                ثبت فروش جدید
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <form onSubmit={handleSubmit}>
                <DialogHeader>
                  <DialogTitle>ثبت فروش جدید</DialogTitle>
                  <DialogDescription>
                    اطلاعات فروش و شرایط اقساط را وارد کنید
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="phone_id">انتخاب گوشی</Label>
                      <Select
                        value={formData.phone_id}
                        onValueChange={(value) => {
                          const phone = phones.find((p) => p.id === value);
                          setFormData({
                            ...formData,
                            phone_id: value,
                            total_price: phone?.selling_price?.toString() || "",
                          });
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="گوشی را انتخاب کنید" />
                        </SelectTrigger>
                        <SelectContent>
                          {phones.map((phone) => (
                            <SelectItem key={phone.id} value={phone.id}>
                              {phone.brand} {phone.model}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="customer_id">انتخاب مشتری</Label>
                      <Select
                        value={formData.customer_id}
                        onValueChange={(value) =>
                          setFormData({ ...formData, customer_id: value })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="مشتری را انتخاب کنید" />
                        </SelectTrigger>
                        <SelectContent>
                          {customers.map((customer) => (
                            <SelectItem key={customer.id} value={customer.id}>
                              {customer.name} ({customer.phone})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="total_price">قیمت کل (تومان)</Label>
                      <Input
                        id="total_price"
                        type="number"
                        value={formData.total_price}
                        onChange={(e) =>
                          setFormData({ ...formData, total_price: e.target.value })
                        }
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="down_payment">پیش پرداخت (تومان)</Label>
                      <Input
                        id="down_payment"
                        type="number"
                        value={formData.down_payment}
                        onChange={(e) =>
                          setFormData({ ...formData, down_payment: e.target.value })
                        }
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="installment_count">تعداد اقساط</Label>
                      <Input
                        id="installment_count"
                        type="number"
                        min="1"
                        value={formData.installment_count}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            installment_count: e.target.value,
                          })
                        }
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="sale_date">تاریخ فروش</Label>
                      <Input
                        id="sale_date"
                        type="date"
                        value={formData.sale_date}
                        onChange={(e) =>
                          setFormData({ ...formData, sale_date: e.target.value })
                        }
                        required
                      />
                    </div>
                  </div>

                  {formData.total_price &&
                    formData.down_payment &&
                    formData.installment_count && (
                      <div className="mt-4 p-4 bg-muted rounded-lg space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>مبلغ باقیمانده:</span>
                          <span className="font-bold">
                            {(
                              parseFloat(formData.total_price) -
                              parseFloat(formData.down_payment)
                            ).toLocaleString()}{" "}
                            تومان
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>مبلغ هر قسط:</span>
                          <span className="font-bold text-primary">
                            {(
                              (parseFloat(formData.total_price) -
                                parseFloat(formData.down_payment)) /
                              parseInt(formData.installment_count)
                            ).toLocaleString()}{" "}
                            تومان
                          </span>
                        </div>
                      </div>
                    )}
                </div>
                <DialogFooter>
                  <Button type="submit">ثبت فروش</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <Card className="bg-gradient-to-br from-success/10 to-success/5 border-success/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              مجموع درآمد فروش
            </CardTitle>
            <TrendingUp className="h-5 w-5 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {totalRevenue.toLocaleString()} تومان
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>لیست فروش‌ها</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8 text-muted-foreground">
                در حال بارگذاری...
              </div>
            ) : sales.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                هنوز فروشی ثبت نشده. برای شروع روی "ثبت فروش جدید" کلیک کنید
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>مشتری</TableHead>
                    <TableHead>گوشی</TableHead>
                    <TableHead>قیمت کل</TableHead>
                    <TableHead>پیش پرداخت</TableHead>
                    <TableHead>تعداد اقساط</TableHead>
                    <TableHead>مبلغ هر قسط</TableHead>
                    <TableHead>تاریخ</TableHead>
                    <TableHead>وضعیت</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sales.map((sale) => (
                    <TableRow key={sale.id}>
                      <TableCell className="font-medium">
                        {sale.customers.name}
                      </TableCell>
                      <TableCell>
                        {sale.phones.brand} {sale.phones.model}
                      </TableCell>
                      <TableCell>
                        {Number(sale.total_price).toLocaleString()} تومان
                      </TableCell>
                      <TableCell>
                        {Number(sale.down_payment).toLocaleString()} تومان
                      </TableCell>
                      <TableCell>{sale.installment_count} قسط</TableCell>
                      <TableCell>
                        {Number(sale.installment_amount).toLocaleString()} تومان
                      </TableCell>
                      <TableCell>
                        {new Date(sale.sale_date).toLocaleDateString("fa-IR")}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            sale.status === "active"
                              ? "default"
                              : sale.status === "completed"
                              ? "secondary"
                              : "destructive"
                          }
                        >
                          {sale.status === "active"
                            ? "در حال پرداخت"
                            : sale.status === "completed"
                            ? "تکمیل شده"
                            : "معوق"}
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

export default Sales;
