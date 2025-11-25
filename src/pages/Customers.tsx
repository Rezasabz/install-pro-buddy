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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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
import { Plus, Edit, Trash2, Users, Phone, IdCard, Search, FileText, AlertCircle, CheckCircle, DollarSign, ShoppingCart, Eye, Calendar, MapPin, TrendingUp, CreditCard, Package, User } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

const Customers = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [installments, setInstallments] = useState<Installment[]>([]);
  const [phones, setPhones] = useState<PhoneType[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [customerDetailsDialog, setCustomerDetailsDialog] = useState<{ open: boolean; customerId: string }>({ open: false, customerId: '' });
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; customerId: string; customerName: string }>({ open: false, customerId: '', customerName: '' });
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
      const [customersData, salesData, installmentsData, phonesData] = await Promise.all([
        customersStore.getAll(),
        salesStore.getAll(),
        installmentsStore.getAll(),
        phonesStore.getAll(),
      ]);
      setCustomers(customersData);
      setSales(salesData);
      setInstallments(installmentsData);
      setPhones(phonesData);
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

  const handleDelete = (id: string, name: string) => {
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

    setDeleteDialog({ open: true, customerId: id, customerName: name });
  };

  const confirmDelete = async () => {
    try {
      await customersStore.delete(deleteDialog.customerId);
      toast({
        title: "موفق",
        description: "مشتری با موفقیت حذف شد",
      });
      setDeleteDialog({ open: false, customerId: '', customerName: '' });
      loadCustomers();
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
                      onClick={() => handleDelete(customer.id, customer.name)}
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
                <div className="pt-2 border-t border-border/50 flex justify-between items-center">
                  <div className="text-xs text-muted-foreground/70">
                    تعداد خرید: <span className="font-semibold text-foreground">{toPersianDigits(getCustomerSalesCount(customer.id))}</span>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCustomerDetailsDialog({ open: true, customerId: customer.id })}
                    className="gap-2 hover:bg-primary/10 hover:border-primary/50 hover:scale-105 transition-all duration-200"
                  >
                    <Eye className="h-3 w-3" />
                    جزئیات
                  </Button>
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

        {/* Dialog جزئیات مشتری */}
        <Dialog open={customerDetailsDialog.open} onOpenChange={(open) => setCustomerDetailsDialog({ ...customerDetailsDialog, open })}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-primary via-secondary to-primary bg-clip-text text-transparent">
                جزئیات مشتری
              </DialogTitle>
            </DialogHeader>
            {(() => {
              const customer = customers.find(c => c.id === customerDetailsDialog.customerId);
              if (!customer) return null;
              
              const customerSales = sales.filter(s => s.customerId === customer.id);
              const stats = getCustomerStats(customer.id);
              const allCustomerInstallments = customerSales.flatMap(sale => 
                installments.filter(i => i.saleId === sale.id)
              );
              const paidInstallments = allCustomerInstallments.filter(i => i.status === 'paid');
              const totalInstallments = allCustomerInstallments.length;
              const progressPercentage = totalInstallments > 0 ? (paidInstallments.length / totalInstallments) * 100 : 0;
              
              return (
                <div className="space-y-6">
                  {/* خلاصه آماری */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <Card className="relative overflow-hidden bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border-primary/20">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="text-xs text-muted-foreground mb-1">تعداد خرید</div>
                            <div className="text-lg font-bold text-primary">{toPersianDigits(customerSales.length)}</div>
                          </div>
                          <ShoppingCart className="h-8 w-8 text-primary/40" />
                        </div>
                      </CardContent>
                    </Card>
                    <Card className="relative overflow-hidden bg-gradient-to-br from-success/10 via-success/5 to-transparent border-success/20">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="text-xs text-muted-foreground mb-1">پرداخت شده</div>
                            <div className="text-lg font-bold text-success">{formatCurrency(stats.totalPaid)}</div>
                          </div>
                          <CheckCircle className="h-8 w-8 text-success/40" />
                        </div>
                      </CardContent>
                    </Card>
                    <Card className="relative overflow-hidden bg-gradient-to-br from-warning/10 via-warning/5 to-transparent border-warning/20">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="text-xs text-muted-foreground mb-1">باقیمانده</div>
                            <div className="text-lg font-bold text-warning">{formatCurrency(stats.totalRemaining)}</div>
                          </div>
                          <CreditCard className="h-8 w-8 text-warning/40" />
                        </div>
                      </CardContent>
                    </Card>
                    <Card className="relative overflow-hidden bg-gradient-to-br from-secondary/10 via-secondary/5 to-transparent border-secondary/20">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="text-xs text-muted-foreground mb-1">کل خریدها</div>
                            <div className="text-lg font-bold text-secondary">{formatCurrency(stats.totalPurchases)}</div>
                          </div>
                          <TrendingUp className="h-8 w-8 text-secondary/40" />
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Progress Bar */}
                  {totalInstallments > 0 && (
                    <Card>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium">پیشرفت پرداخت</span>
                          <span className="text-sm text-muted-foreground">
                            {toPersianDigits(paidInstallments.length)} از {toPersianDigits(totalInstallments)} قسط
                          </span>
                        </div>
                        <div className="w-full h-3 bg-muted rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-gradient-to-r from-success via-success/80 to-success transition-all duration-500"
                            style={{ width: `${progressPercentage}%` }}
                          />
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* اطلاعات شخصی */}
                  <div className="grid md:grid-cols-2 gap-4">
                    <Card className="relative overflow-hidden group">
                      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      <CardHeader className="relative z-10 pb-3">
                        <CardTitle className="flex items-center gap-2 text-base font-semibold">
                          <div className="relative">
                            <div className="absolute inset-0 bg-primary/20 rounded-lg blur-sm" />
                            <User className="relative h-4 w-4 text-primary" />
                          </div>
                          اطلاعات شخصی
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="relative z-10 space-y-3">
                        <div className="flex items-center justify-between p-3 rounded-lg border border-border/50 hover:bg-accent/30 transition-colors">
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm text-muted-foreground">نام و نام خانوادگی</span>
                          </div>
                          <span className="font-semibold">{customer.name}</span>
                        </div>
                        <div className="flex items-center justify-between p-3 rounded-lg border border-border/50 hover:bg-accent/30 transition-colors">
                          <div className="flex items-center gap-2">
                            <Phone className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm text-muted-foreground">شماره تماس</span>
                          </div>
                          <span className="font-medium" dir="ltr">{customer.phone}</span>
                        </div>
                        <div className="flex items-center justify-between p-3 rounded-lg border border-border/50 hover:bg-accent/30 transition-colors">
                          <div className="flex items-center gap-2">
                            <IdCard className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm text-muted-foreground">کد ملی</span>
                          </div>
                          <span className="font-medium">{customer.nationalId}</span>
                        </div>
                        {customer.address && (
                          <div className="p-3 rounded-lg border border-border/50 hover:bg-accent/30 transition-colors">
                            <div className="flex items-start gap-2 mb-2">
                              <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                              <span className="text-sm text-muted-foreground">آدرس</span>
                            </div>
                            <p className="text-sm font-medium">{customer.address}</p>
                          </div>
                        )}
                        <div className="flex items-center justify-between p-3 rounded-lg border border-border/50 hover:bg-accent/30 transition-colors">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm text-muted-foreground">تاریخ ثبت</span>
                          </div>
                          <span className="font-medium">{toJalaliDate(customer.createdAt)}</span>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="relative overflow-hidden group">
                      <div className="absolute inset-0 bg-gradient-to-br from-secondary/5 via-transparent to-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      <CardHeader className="relative z-10 pb-3">
                        <CardTitle className="flex items-center gap-2 text-base font-semibold">
                          <div className="relative">
                            <div className="absolute inset-0 bg-secondary/20 rounded-lg blur-sm" />
                            <Package className="relative h-4 w-4 text-secondary" />
                          </div>
                          آمار خرید
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="relative z-10 space-y-3">
                        <div className="p-3 rounded-lg border border-border/50 hover:bg-accent/30 transition-colors">
                          <div className="text-xs text-muted-foreground mb-1">فروش‌های فعال</div>
                          <div className="text-lg font-bold text-primary">{toPersianDigits(stats.activeSales)}</div>
                        </div>
                        <div className="p-3 rounded-lg border border-border/50 hover:bg-accent/30 transition-colors">
                          <div className="text-xs text-muted-foreground mb-1">اقساط معوق</div>
                          <div className="text-lg font-bold text-destructive">{toPersianDigits(stats.overdueCount)}</div>
                        </div>
                        <div className="p-3 rounded-lg border border-border/50 hover:bg-accent/30 transition-colors">
                          <div className="text-xs text-muted-foreground mb-1">اقساط در انتظار</div>
                          <div className="text-lg font-bold text-warning">{toPersianDigits(stats.pendingCount)}</div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* لیست فروش‌ها */}
                  {customerSales.length > 0 && (
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="flex items-center gap-2 text-base font-semibold">
                          <ShoppingCart className="h-4 w-4 text-primary" />
                          تاریخچه خریدها
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {customerSales.map((sale, index) => {
                            const phone = phones.find(p => p.id === sale.phoneId);
                            const saleInstallments = installments.filter(i => i.saleId === sale.id);
                            const paidCount = saleInstallments.filter(i => i.status === 'paid').length;
                            const totalCount = saleInstallments.length;
                            
                            return (
                              <div
                                key={sale.id}
                                className="p-4 rounded-lg border border-border/50 hover:bg-accent/30 transition-all duration-200 hover:scale-[1.01]"
                                style={{ animationDelay: `${index * 30}ms` }}
                              >
                                <div className="flex items-start justify-between mb-3">
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-2">
                                      <Package className="h-4 w-4 text-muted-foreground" />
                                      <span className="font-semibold">
                                        {phone ? `${phone.brand} ${phone.model}` : 'نامشخص'}
                                      </span>
                                      <Badge 
                                        variant="outline"
                                        className={cn(
                                          sale.status === 'active' && "bg-warning/10 text-warning border-warning/20",
                                          sale.status === 'completed' && "bg-success/10 text-success border-success/20",
                                          sale.status === 'defaulted' && "bg-destructive/10 text-destructive border-destructive/20"
                                        )}
                                      >
                                        {sale.status === 'active' ? 'فعال' : sale.status === 'completed' ? 'تکمیل شده' : 'پیش‌فرض'}
                                      </Badge>
                                    </div>
                                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                      <div className="flex items-center gap-1">
                                        <Calendar className="h-3 w-3" />
                                        {toJalaliDate(sale.saleDate)}
                                      </div>
                                      <div className="flex items-center gap-1">
                                        <CreditCard className="h-3 w-3" />
                                        {toPersianDigits(paidCount)}/{toPersianDigits(totalCount)} قسط
                                      </div>
                                    </div>
                                  </div>
                                  <div className="text-left space-y-1 min-w-[140px]">
                                    <div className="flex items-center justify-between text-sm">
                                      <span className="text-muted-foreground">قیمت:</span>
                                      <span className="font-semibold">{formatCurrency(sale.announcedPrice)}</span>
                                    </div>
                                    <div className="flex items-center justify-between text-sm">
                                      <span className="text-muted-foreground">پیش‌پرداخت:</span>
                                      <span className="font-medium">{formatCurrency(sale.downPayment)}</span>
                                    </div>
                                    <div className="flex items-center justify-between text-sm pt-1 border-t border-border/50">
                                      <span className="text-muted-foreground">سود:</span>
                                      <span className="font-bold text-success">{formatCurrency(sale.initialProfit)}</span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              );
            })()}
          </DialogContent>
        </Dialog>

        {/* AlertDialog حذف مشتری */}
        <AlertDialog open={deleteDialog.open} onOpenChange={(open) => setDeleteDialog({ ...deleteDialog, open })}>
          <AlertDialogContent className="max-w-lg p-0 gap-0 overflow-hidden border-destructive/20">
            {/* Header با gradient */}
            <div className="relative bg-gradient-to-br from-destructive via-destructive/90 to-destructive/80 p-6">
              <div className="absolute inset-0 bg-black/10" />
              <div className="relative z-10 flex flex-col items-center text-center space-y-4">
                <div className="relative">
                  <div className="absolute inset-0 bg-white/20 rounded-full blur-xl animate-pulse" />
                  <div className="relative p-4 rounded-full bg-white/10 backdrop-blur-sm border-2 border-white/20">
                    <Trash2 className="h-10 w-10 text-white" />
                  </div>
                </div>
                <AlertDialogTitle className="text-2xl font-bold text-white">
                  حذف مشتری
                </AlertDialogTitle>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 space-y-4 bg-background">
              <AlertDialogDescription className="text-right space-y-4">
                <div className="p-4 rounded-lg bg-muted/50 border border-border/50">
                  <p className="text-base font-semibold text-foreground mb-2">
                    مشتری مورد نظر:
                  </p>
                  <p className="text-lg font-bold text-primary bg-primary/10 px-3 py-2 rounded-md inline-block">
                    {deleteDialog.customerName}
                  </p>
                </div>
                
                <div className="p-4 rounded-lg bg-destructive/5 border border-destructive/20">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-full bg-destructive/10 flex-shrink-0">
                      <AlertCircle className="h-5 w-5 text-destructive" />
                    </div>
                    <div className="flex-1 space-y-2">
                      <p className="text-sm font-semibold text-destructive">
                        هشدار مهم
                      </p>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        این عمل غیرقابل بازگشت است و تمام اطلاعات مرتبط با این مشتری از جمله:
                      </p>
                      <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside mr-4">
                        <li>اطلاعات شخصی و تماس</li>
                        <li>تاریخچه خریدها</li>
                        <li>فروش‌ها و اقساط</li>
                      </ul>
                      <p className="text-sm font-semibold text-destructive mt-2">
                        برای همیشه حذف خواهند شد.
                      </p>
                    </div>
                  </div>
                </div>

                <p className="text-center text-sm text-muted-foreground pt-2">
                  آیا از حذف این مشتری اطمینان دارید؟
                </p>
              </AlertDialogDescription>
            </div>

            {/* Footer */}
            <AlertDialogFooter className="p-6 pt-0 gap-3 bg-background">
              <AlertDialogCancel className="flex-1 h-11 text-base font-semibold border-2 hover:bg-accent hover:border-accent-foreground/20 transition-all duration-200">
                انصراف
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={confirmDelete}
                className="flex-1 h-11 text-base font-semibold bg-gradient-to-r from-destructive to-destructive/80 hover:from-destructive/90 hover:to-destructive/70 text-white shadow-lg hover:shadow-xl transition-all duration-200"
              >
                <Trash2 className="h-4 w-4 ml-2" />
                حذف مشتری
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </Layout>
  );
};

export default Customers;
