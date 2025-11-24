import { useState, useEffect } from "react";
import Layout from "@/components/Layout";
import { LoadingOverlay } from "@/components/LoadingOverlay";
import { useDataContext } from "@/contexts/DataContext";
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
import { customersStore, Customer, salesStore, installmentsStore, phonesStore, Sale, Installment, Phone as PhoneType } from "@/lib/storeProvider";
import { formatCurrency, toJalaliDate, toPersianDigits } from "@/lib/persian";
import { Plus, Edit, Trash2, Users, Phone, IdCard, Search, FileText, AlertCircle, CheckCircle, DollarSign, ShoppingCart } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { PDFButton } from "@/components/PDFButton";
import { cn } from "@/lib/utils";

const Customers = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [installments, setInstallments] = useState<Installment[]>([]);
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
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("");
  const { toast } = useToast();
  const { refreshCustomers } = useDataContext();

  const loadCustomers = async () => {
    try {
      const [customersData, salesData, installmentsData] = await Promise.all([
        customersStore.getAll(),
        salesStore.getAll(),
        installmentsStore.getAll(),
      ]);
      setCustomers(customersData);
      setSales(salesData);
      setInstallments(installmentsData);
    } catch (error) {
      console.error('Error loading customers:', error);
      toast({
        title: "خطا",
        description: "خطا در بارگذاری مشتریان",
        variant: "destructive",
      });
    }
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
        const customerSales = sales.filter(s => s.customerId === c.id);
        if (statusFilter === 'active') {
          return customerSales.some(s => s.status === 'active');
        } else if (statusFilter === 'completed') {
          return customerSales.length > 0 && customerSales.every(s => s.status === 'completed');
        } else if (statusFilter === 'overdue') {
          return customerSales.some(s => {
            const saleInstallments = installments.filter(i => i.saleId === s.id);
            return saleInstallments.some(i => i.status === 'overdue');
          });
        } else if (statusFilter === 'no_purchase') {
          return customerSales.length === 0;
        }
        return true;
      });
    }

    setFilteredCustomers(filtered);
  };

  useEffect(() => {
    loadCustomers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    applyFilters();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [customers, searchQuery, statusFilter]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // بستن dialog و نمایش loading
    setIsDialogOpen(false);
    setIsLoading(true);
    setLoadingMessage(editingCustomer ? "در حال بروزرسانی مشتری..." : "در حال افزودن مشتری...");

    try {
      if (editingCustomer) {
        await customersStore.update(editingCustomer.id, formData);
        toast({
          title: "موفق",
          description: "مشتری با موفقیت بروزرسانی شد",
        });
      } else {
        await customersStore.add(formData);
        toast({
          title: "موفق",
          description: "مشتری جدید با موفقیت اضافه شد",
        });
      }

      setFormData({ name: "", phone: "", nationalId: "", address: "" });
      setEditingCustomer(null);
      await loadCustomers();
      
      // Refresh customers in other pages (like Sales)
      refreshCustomers();
    } catch (error) {
      console.error('Error saving customer:', error);
      toast({
        title: "خطا",
        description: "خطا در ذخیره مشتری",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      setLoadingMessage("");
    }
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

  const handleDelete = async (id: string) => {
    try {
      // بررسی اینکه آیا مشتری فروش فعال دارد
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
        await customersStore.delete(id);
        toast({
          title: "موفق",
          description: "مشتری با موفقیت حذف شد",
        });
        loadCustomers();
      }
    } catch (error) {
      console.error('Error deleting customer:', error);
      toast({
        title: "خطا",
        description: "خطا در حذف مشتری",
        variant: "destructive",
      });
    }
  };

  const getCustomerSalesCount = (customerId: string) => {
    return sales.filter(s => s.customerId === customerId).length;
  };

  const getCustomerStats = (customerId: string) => {
    const customerSales = sales.filter(s => s.customerId === customerId);
    const totalPurchases = customerSales.reduce((sum, s) => sum + s.announcedPrice, 0);
    let totalPaid = customerSales.reduce((sum, s) => sum + s.downPayment, 0);
    
    let totalRemaining = 0;
    let overdueCount = 0;
    let pendingCount = 0;
    
    customerSales.forEach(sale => {
      const saleInstallments = installments.filter(i => i.saleId === sale.id);
      saleInstallments.forEach(inst => {
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
      {isLoading && <LoadingOverlay message={loadingMessage} />}
      <div className="space-y-6 animate-fade-scale">
        <div className="flex flex-col sm:flex-row justify-between items-start gap-4 pb-2">
          <div className="space-y-1">
            <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-primary via-secondary to-primary bg-clip-text text-transparent bg-[length:200%_auto] animate-gradient">
              مدیریت مشتریان
            </h1>
            <p className="text-muted-foreground/80 text-sm md:text-base">
              مدیریت اطلاعات مشتریان و خریداران
            </p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button 
                onClick={() => {
                  setEditingCustomer(null);
                  setFormData({ name: "", phone: "", nationalId: "", address: "" });
                }}
                className="gap-2 hover:scale-105 transition-all duration-200"
              >
                <Plus className="h-4 w-4" />
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

        <Card className="relative overflow-hidden bg-card/80 backdrop-blur-sm hover:shadow-xl hover:scale-[1.02] transition-all duration-300 group">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <CardHeader className="relative z-10">
            <CardTitle className="flex items-center gap-2">
              <div className="relative">
                <div className="absolute inset-0 bg-primary/20 rounded-lg blur-sm opacity-0 group-hover:opacity-100 transition-opacity" />
                <Users className="relative h-5 w-5 text-primary" />
              </div>
              تعداد مشتریان
            </CardTitle>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
              {toPersianDigits(customers.length)}
            </div>
            <p className="text-sm text-muted-foreground/70 mt-2">
              مشتری ثبت شده
            </p>
          </CardContent>
        </Card>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {customers.map((customer, index) => (
            <Card 
              key={customer.id} 
              className="relative overflow-hidden bg-card/80 backdrop-blur-sm hover:shadow-xl hover:scale-[1.02] transition-all duration-300 group animate-slide-in"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <CardHeader className="relative z-10">
                <CardTitle className="flex justify-between items-start">
                  <span className="text-lg font-bold">{customer.name}</span>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEdit(customer)}
                      className="hover:bg-primary/10 hover:scale-110 transition-all duration-200"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(customer.id)}
                      className="hover:bg-destructive/10 hover:scale-110 transition-all duration-200"
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 relative z-10">
                <div className="flex items-center gap-2 text-sm p-2 rounded-lg hover:bg-accent/30 transition-colors duration-200">
                  <Phone className="h-4 w-4 text-muted-foreground/70" />
                  <span dir="ltr" className="font-medium">{customer.phone}</span>
                </div>
                <div className="flex items-center gap-2 text-sm p-2 rounded-lg hover:bg-accent/30 transition-colors duration-200">
                  <IdCard className="h-4 w-4 text-muted-foreground/70" />
                  <span className="font-medium">{customer.nationalId}</span>
                </div>
                <div className="text-sm text-muted-foreground/70 p-2 rounded-lg bg-muted/30">
                  {customer.address}
                </div>
                <div className="pt-2 border-t border-border/50">
                  <div className="text-xs text-muted-foreground/70 mb-1">
                    تعداد خرید: <span className="font-semibold text-foreground">{toPersianDigits(getCustomerSalesCount(customer.id))}</span>
                  </div>
                  <div className="text-xs text-muted-foreground/70">
                    تاریخ ثبت: <span className="font-semibold text-foreground">{toJalaliDate(customer.createdAt)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {customers.length === 0 && (
          <Card className="relative overflow-hidden bg-card/80 backdrop-blur-sm">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5" />
            <CardContent className="flex flex-col items-center justify-center py-12 relative z-10">
              <div className="relative mb-4">
                <div className="absolute inset-0 bg-primary/20 rounded-full blur-lg" />
                <Users className="relative h-12 w-12 text-primary" />
              </div>
              <p className="text-muted-foreground/70 text-center leading-relaxed">
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
