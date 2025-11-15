import { useState, useEffect } from "react";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { customersStore, Customer, salesStore, installmentsStore, phonesStore, Sale, Installment } from "@/lib/store";
import { formatCurrency, toJalaliDate, toPersianDigits } from "@/lib/persian";
import { Plus, Edit, Trash2, Users, Phone, IdCard, Search, FileText, AlertCircle, CheckCircle, DollarSign, ShoppingCart } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const Customers = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [customerDetailsDialog, setCustomerDetailsDialog] = useState<{ open: boolean; customerId: string }>({ open: false, customerId: '' });
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    nationalId: "",
    address: "",
  });
  const { toast } = useToast();

  useEffect(() => {
    loadCustomers();
  }, []);

  useEffect(() => {
    applyFilters();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [customers, searchQuery, statusFilter]);

  const loadCustomers = () => {
    setCustomers(customersStore.getAll());
  };

  const applyFilters = () => {
    let filtered = [...customers];

    // جستجو
    if (searchQuery) {
      filtered = filtered.filter(c => 
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.phone.includes(searchQuery) ||
        c.nationalId.includes(searchQuery)
      );
    }

    // فیلتر وضعیت
    if (statusFilter !== 'all') {
      filtered = filtered.filter(c => {
        const sales = salesStore.getAll().filter(s => s.customerId === c.id);
        if (statusFilter === 'active') {
          return sales.some(s => s.status === 'active');
        } else if (statusFilter === 'completed') {
          return sales.length > 0 && sales.every(s => s.status === 'completed');
        } else if (statusFilter === 'overdue') {
          return sales.some(s => {
            const installments = installmentsStore.getBySaleId(s.id);
            return installments.some(i => i.status === 'overdue');
          });
        } else if (statusFilter === 'no_purchase') {
          return sales.length === 0;
        }
        return true;
      });
    }

    setFilteredCustomers(filtered);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (editingCustomer) {
      customersStore.update(editingCustomer.id, formData);
      toast({
        title: "موفق",
        description: "مشتری با موفقیت بروزرسانی شد",
      });
    } else {
      customersStore.add(formData);
      toast({
        title: "موفق",
        description: "مشتری جدید با موفقیت اضافه شد",
      });
    }

    setFormData({ name: "", phone: "", nationalId: "", address: "" });
    setEditingCustomer(null);
    setIsDialogOpen(false);
    loadCustomers();
  };

  const handleEdit = (customer: Customer) => {
    setEditingCustomer(customer);
    setFormData({
      name: customer.name,
      phone: customer.phone,
      nationalId: customer.nationalId,
      address: customer.address,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    // بررسی اینکه آیا مشتری فروش فعال دارد
    const sales = salesStore.getAll();
    const hasActiveSales = sales.some(s => s.customerId === id && s.status === 'active');
    
    if (hasActiveSales) {
      toast({
        title: "خطا",
        description: "این مشتری فروش فعال دارد و نمی‌توان آن را حذف کرد",
        variant: "destructive",
      });
      return;
    }

    if (confirm("آیا از حذف این مشتری اطمینان دارید؟")) {
      customersStore.delete(id);
      toast({
        title: "موفق",
        description: "مشتری با موفقیت حذف شد",
      });
      loadCustomers();
    }
  };

  const getCustomerSalesCount = (customerId: string) => {
    return salesStore.getAll().filter(s => s.customerId === customerId).length;
  };

  const getCustomerStats = (customerId: string) => {
    const sales = salesStore.getAll().filter(s => s.customerId === customerId);
    const totalPurchases = sales.reduce((sum, s) => sum + s.announcedPrice, 0);
    let totalPaid = sales.reduce((sum, s) => sum + s.downPayment, 0);
    
    let totalRemaining = 0;
    let overdueCount = 0;
    let pendingCount = 0;
    
    sales.forEach(sale => {
      const installments = installmentsStore.getBySaleId(sale.id);
      installments.forEach(inst => {
        if (inst.status !== 'paid') {
          totalRemaining += inst.totalAmount;
          if (inst.status === 'overdue') {
            overdueCount++;
          } else {
            pendingCount++;
          }
        } else {
          totalPaid += inst.totalAmount;
        }
      });
    });

    return {
      salesCount: sales.length,
      activeSales: sales.filter(s => s.status === 'active').length,
      totalPurchases,
      totalPaid,
      totalRemaining,
      overdueCount,
      pendingCount,
    };
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold">مدیریت مشتریان</h1>
            <p className="text-muted-foreground">
              مدیریت اطلاعات مشتریان و خریداران
            </p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => {
                setEditingCustomer(null);
                setFormData({ name: "", phone: "", nationalId: "", address: "" });
              }}>
                <Plus className="ml-2 h-4 w-4" />
                افزودن مشتری
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>
                  {editingCustomer ? "ویرایش مشتری" : "افزودن مشتری جدید"}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="name">نام و نام خانوادگی</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    required
                    placeholder="نام کامل مشتری"
                  />
                </div>
                <div>
                  <Label htmlFor="phone">شماره تماس</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData({ ...formData, phone: e.target.value })
                    }
                    required
                    placeholder="۰۹۱۲۳۴۵۶۷۸۹"
                  />
                </div>
                <div>
                  <Label htmlFor="nationalId">کد ملی</Label>
                  <Input
                    id="nationalId"
                    value={formData.nationalId}
                    onChange={(e) =>
                      setFormData({ ...formData, nationalId: e.target.value })
                    }
                    required
                    placeholder="۱۰ رقم"
                    maxLength={10}
                  />
                </div>
                <div>
                  <Label htmlFor="address">آدرس</Label>
                  <Textarea
                    id="address"
                    value={formData.address}
                    onChange={(e) =>
                      setFormData({ ...formData, address: e.target.value })
                    }
                    required
                    placeholder="آدرس کامل محل سکونت"
                    rows={3}
                  />
                </div>
                <Button type="submit" className="w-full">
                  {editingCustomer ? "بروزرسانی" : "افزودن"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              تعداد مشتریان
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-primary">
              {toPersianDigits(customers.length)}
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              مشتری ثبت شده
            </p>
          </CardContent>
        </Card>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {customers.map((customer) => (
            <Card key={customer.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="flex justify-between items-start">
                  <span className="text-lg">{customer.name}</span>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEdit(customer)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(customer.id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span dir="ltr">{customer.phone}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <IdCard className="h-4 w-4 text-muted-foreground" />
                  <span>{customer.nationalId}</span>
                </div>
                <div className="text-sm text-muted-foreground">
                  {customer.address}
                </div>
                <div className="pt-2 border-t">
                  <div className="text-xs text-muted-foreground">
                    تعداد خرید: {toPersianDigits(getCustomerSalesCount(customer.id))}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    تاریخ ثبت: {toJalaliDate(customer.createdAt)}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {customers.length === 0 && (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Users className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground text-center">
                هنوز مشتری‌ای ثبت نشده است
                <br />
                برای شروع، یک مشتری اضافه کنید
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
};

export default Customers;
