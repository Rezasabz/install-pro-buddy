import { useState, useEffect } from "react";
import Layout from "@/components/Layout";
import { LoadingOverlay } from "@/components/LoadingOverlay";
import { useDataContext } from "@/contexts/DataContext";
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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { phonesStore, Phone } from "@/lib/storeProvider";
import { formatCurrency, toJalaliDate } from "@/lib/persian";
import { Plus, Edit, Trash2, Smartphone, Package, DollarSign, Palette, HardDrive, Info, ShoppingBag, Calendar, Hash } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { JalaliDatePicker } from "@/components/JalaliDatePicker";
import { cn } from "@/lib/utils";

const Inventory = () => {
  const [phones, setPhones] = useState<Phone[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPhone, setEditingPhone] = useState<Phone | null>(null);
  const [formData, setFormData] = useState({
    brand: "",
    model: "",
    imei: "",
    purchasePrice: "",
    sellingPrice: "",
    color: "",
    storage: "",
    condition: "new",
    purchaseSource: "",
    notes: "",
  });
  const [purchaseDate, setPurchaseDate] = useState<Date>(new Date());
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("");
  const { toast } = useToast();
  const { refreshPhones } = useDataContext();

  const loadPhones = async () => {
    try {
      const data = await phonesStore.getAll();
      setPhones(data);
    } catch (error) {
      console.error('Error loading phones:', error);
      toast({
        title: "خطا",
        description: "خطا در بارگذاری گوشی‌ها",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    loadPhones();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handlePurchasePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const numericValue = value.replace(/[^\d]/g, '');
    
    if (numericValue === '') {
      setFormData({ ...formData, purchasePrice: '' });
      return;
    }
    
    const number = parseInt(numericValue, 10);
    const formatted = number.toLocaleString('en-US');
    setFormData({ ...formData, purchasePrice: formatted });
  };

  const handleSellingPriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const numericValue = value.replace(/[^\d]/g, '');
    
    if (numericValue === '') {
      setFormData({ ...formData, sellingPrice: '' });
      return;
    }
    
    const number = parseInt(numericValue, 10);
    const formatted = number.toLocaleString('en-US');
    setFormData({ ...formData, sellingPrice: formatted });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const purchasePrice = parseFloat(formData.purchasePrice.replace(/,/g, ''));
    const sellingPrice = parseFloat(formData.sellingPrice.replace(/,/g, ''));
    
    if (isNaN(purchasePrice) || purchasePrice <= 0) {
      toast({
        title: "خطا",
        description: "لطفاً قیمت خرید معتبر وارد کنید",
        variant: "destructive",
      });
      return;
    }

    if (isNaN(sellingPrice) || sellingPrice <= 0) {
      toast({
        title: "خطا",
        description: "لطفاً قیمت فروش معتبر وارد کنید",
        variant: "destructive",
      });
      return;
    }

    // بستن dialog و نمایش loading
    setIsDialogOpen(false);
    setIsLoading(true);
    setLoadingMessage(editingPhone ? "در حال بروزرسانی گوشی..." : "در حال افزودن گوشی...");

    try {
      if (editingPhone) {
        await phonesStore.update(editingPhone.id, {
          brand: formData.brand,
          model: formData.model,
          imei: formData.imei,
          purchasePrice,
          sellingPrice,
          purchaseDate: purchaseDate.toISOString(),
        });
        toast({
          title: "موفق",
          description: "گوشی با موفقیت بروزرسانی شد",
        });
      } else {
        await phonesStore.add({
          brand: formData.brand,
          model: formData.model,
          imei: formData.imei,
          purchasePrice,
          sellingPrice,
          status: 'available',
          purchaseDate: purchaseDate.toISOString(),
        });
        toast({
          title: "موفق",
          description: "گوشی جدید با موفقیت اضافه شد",
        });
      }

      setFormData({
        brand: "",
        model: "",
        imei: "",
        purchasePrice: "",
        sellingPrice: "",
        color: "",
        storage: "",
        condition: "new",
        purchaseSource: "",
        notes: "",
      });
      setPurchaseDate(new Date());
      setEditingPhone(null);
      await loadPhones();
      
      // Refresh phones in other pages (like Sales)
      refreshPhones();
    } catch (error: unknown) {
      console.error('Error saving phone:', error);
      const { extractErrorMessage } = await import('@/lib/errorHandler');
      
      toast({
        title: "خطا",
        description: extractErrorMessage(error, "خطا در ذخیره گوشی"),
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      setLoadingMessage("");
    }
  };

  const handleEdit = (phone: Phone) => {
    setEditingPhone(phone);
    setFormData({
      brand: phone.brand,
      model: phone.model,
      imei: phone.imei,
      purchasePrice: phone.purchasePrice.toLocaleString('en-US'),
      sellingPrice: phone.sellingPrice.toLocaleString('en-US'),
      color: "",
      storage: "",
      condition: "new",
      purchaseSource: "",
      notes: "",
    });
    setPurchaseDate(new Date(phone.purchaseDate));
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm("آیا از حذف این گوشی اطمینان دارید؟")) {
      try {
        await phonesStore.delete(id);
        toast({
          title: "موفق",
          description: "گوشی با موفقیت حذف شد",
        });
        loadPhones();
      } catch (error) {
        console.error('Error deleting phone:', error);
        toast({
          title: "خطا",
          description: "خطا در حذف گوشی",
          variant: "destructive",
        });
      }
    }
  };

  const availablePhones = phones.filter(p => p.status === 'available');
  const soldPhones = phones.filter(p => p.status === 'sold');
  const totalInventoryValue = availablePhones.reduce((sum, p) => sum + p.purchasePrice, 0);

  return (
    <Layout>
      {isLoading && <LoadingOverlay message={loadingMessage} />}
      <div className="space-y-6 animate-fade-scale">
        <div className="flex flex-col sm:flex-row justify-between items-start gap-4 pb-2">
          <div className="space-y-1">
            <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-primary via-secondary to-primary bg-clip-text text-transparent bg-[length:200%_auto] animate-gradient">
              مدیریت موجودی
            </h1>
            <p className="text-muted-foreground/80 text-sm md:text-base">
              مدیریت گوشی‌های موجود و فروخته شده
            </p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button 
                onClick={() => {
                  setEditingPhone(null);
                  setFormData({
                    brand: "",
                    model: "",
                    imei: "",
                    purchasePrice: "",
                    sellingPrice: "",
                    color: "",
                    storage: "",
                    condition: "new",
                    purchaseSource: "",
                    notes: "",
                  });
                  setPurchaseDate(new Date());
                }}
                className="gap-2 hover:scale-105 transition-all duration-200"
              >
                <Plus className="h-4 w-4" />
                افزودن گوشی
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-secondary/5 rounded-lg -z-10" />
                <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-primary via-secondary to-primary bg-clip-text text-transparent">
                  {editingPhone ? "ویرایش گوشی" : "افزودن گوشی جدید"}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-6 mt-4">
                {/* بخش اطلاعات پایه */}
                <div className="space-y-4 p-4 rounded-lg bg-card border border-border/50">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="relative">
                      <div className="absolute inset-0 bg-primary/20 rounded-lg blur-sm" />
                      <Smartphone className="relative h-5 w-5 text-primary" />
                    </div>
                    <h3 className="font-semibold text-lg">اطلاعات پایه</h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="brand" className="flex items-center gap-2 text-sm font-medium">
                        <Hash className="h-4 w-4 text-primary" />
                        برند
                      </Label>
                      <Input
                        id="brand"
                        value={formData.brand}
                        onChange={(e) =>
                          setFormData({ ...formData, brand: e.target.value })
                        }
                        required
                        placeholder="مثال: سامسونگ، اپل"
                        className="h-10"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="model" className="flex items-center gap-2 text-sm font-medium">
                        <Smartphone className="h-4 w-4 text-primary" />
                        مدل
                      </Label>
                      <Input
                        id="model"
                        value={formData.model}
                        onChange={(e) =>
                          setFormData({ ...formData, model: e.target.value })
                        }
                        required
                        placeholder="مثال: Galaxy S24"
                        className="h-10"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="imei" className="flex items-center gap-2 text-sm font-medium">
                      <Hash className="h-4 w-4 text-primary" />
                      شماره IMEI
                    </Label>
                    <Input
                      id="imei"
                      value={formData.imei}
                      onChange={(e) =>
                        setFormData({ ...formData, imei: e.target.value })
                      }
                      required
                      placeholder="۱۵ رقم"
                      className="h-10"
                      maxLength={15}
                    />
                  </div>
                </div>

                {/* بخش مشخصات */}
                <div className="space-y-4 p-4 rounded-lg bg-card border border-border/50">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="relative">
                      <div className="absolute inset-0 bg-secondary/20 rounded-lg blur-sm" />
                      <Info className="relative h-5 w-5 text-secondary" />
                    </div>
                    <h3 className="font-semibold text-lg">مشخصات</h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="color" className="flex items-center gap-2 text-sm font-medium">
                        <Palette className="h-4 w-4 text-secondary" />
                        رنگ
                      </Label>
                      <Input
                        id="color"
                        value={formData.color}
                        onChange={(e) =>
                          setFormData({ ...formData, color: e.target.value })
                        }
                        placeholder="مثال: مشکی، سفید"
                        className="h-10"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="storage" className="flex items-center gap-2 text-sm font-medium">
                        <HardDrive className="h-4 w-4 text-secondary" />
                        ظرفیت حافظه
                      </Label>
                      <Select
                        value={formData.storage}
                        onValueChange={(value) =>
                          setFormData({ ...formData, storage: value })
                        }
                      >
                        <SelectTrigger className="h-10">
                          <SelectValue placeholder="انتخاب کنید" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="64">64 GB</SelectItem>
                          <SelectItem value="128">128 GB</SelectItem>
                          <SelectItem value="256">256 GB</SelectItem>
                          <SelectItem value="512">512 GB</SelectItem>
                          <SelectItem value="1024">1 TB</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="condition" className="flex items-center gap-2 text-sm font-medium">
                        <Info className="h-4 w-4 text-secondary" />
                        وضعیت
                      </Label>
                      <Select
                        value={formData.condition}
                        onValueChange={(value) =>
                          setFormData({ ...formData, condition: value })
                        }
                      >
                        <SelectTrigger className="h-10">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="new">نو</SelectItem>
                          <SelectItem value="used">کارکرده</SelectItem>
                          <SelectItem value="refurbished">بازسازی شده</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="purchaseSource" className="flex items-center gap-2 text-sm font-medium">
                        <ShoppingBag className="h-4 w-4 text-secondary" />
                        منبع خرید
                      </Label>
                      <Input
                        id="purchaseSource"
                        value={formData.purchaseSource}
                        onChange={(e) =>
                          setFormData({ ...formData, purchaseSource: e.target.value })
                        }
                        placeholder="مثال: عمده‌فروش، خرده‌فروش"
                        className="h-10"
                      />
                    </div>
                  </div>
                </div>

                {/* بخش قیمت‌ها */}
                <div className="space-y-4 p-4 rounded-lg bg-card border border-border/50">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="relative">
                      <div className="absolute inset-0 bg-warning/20 rounded-lg blur-sm" />
                      <DollarSign className="relative h-5 w-5 text-warning" />
                    </div>
                    <h3 className="font-semibold text-lg">قیمت‌ها</h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="purchasePrice" className="flex items-center gap-2 text-sm font-medium">
                        <DollarSign className="h-4 w-4 text-warning" />
                        قیمت خرید (تومان)
                      </Label>
                      <Input
                        id="purchasePrice"
                        type="text"
                        value={formData.purchasePrice}
                        onChange={handlePurchasePriceChange}
                        required
                        placeholder="مثال: ۲۰,۰۰۰,۰۰۰"
                        dir="ltr"
                        className="h-10"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="sellingPrice" className="flex items-center gap-2 text-sm font-medium">
                        <DollarSign className="h-4 w-4 text-warning" />
                        قیمت فروش (تومان)
                      </Label>
                      <Input
                        id="sellingPrice"
                        type="text"
                        value={formData.sellingPrice}
                        onChange={handleSellingPriceChange}
                        required
                        placeholder="مثال: ۲۲,۰۰۰,۰۰۰"
                        dir="ltr"
                        className="h-10"
                      />
                    </div>
                  </div>
                </div>

                {/* بخش تاریخ و توضیحات */}
                <div className="space-y-4 p-4 rounded-lg bg-card border border-border/50">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="relative">
                      <div className="absolute inset-0 bg-primary/20 rounded-lg blur-sm" />
                      <Calendar className="relative h-5 w-5 text-primary" />
                    </div>
                    <h3 className="font-semibold text-lg">تاریخ و توضیحات</h3>
                  </div>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="purchaseDate" className="flex items-center gap-2 text-sm font-medium">
                        <Calendar className="h-4 w-4 text-primary" />
                        تاریخ خرید
                      </Label>
                      <JalaliDatePicker
                        value={purchaseDate}
                        onChange={setPurchaseDate}
                        placeholder="انتخاب تاریخ خرید"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="notes" className="flex items-center gap-2 text-sm font-medium">
                        <Info className="h-4 w-4 text-primary" />
                        توضیحات (اختیاری)
                      </Label>
                      <Textarea
                        id="notes"
                        value={formData.notes}
                        onChange={(e) =>
                          setFormData({ ...formData, notes: e.target.value })
                        }
                        placeholder="یادداشت‌ها و توضیحات اضافی..."
                        rows={3}
                        className="resize-none"
                      />
                    </div>
                  </div>
                </div>

                <div className="relative pt-6 border-t border-border/50">
                  {/* دکمه افزودن - Floating با Animated Gradient */}
                  <button
                    type="submit"
                    className="group relative w-full h-14 overflow-hidden rounded-xl font-semibold text-white shadow-2xl
                               bg-gradient-to-r from-orange-500 via-red-500 to-purple-600
                               hover:from-orange-400 hover:via-red-400 hover:to-purple-500
                               transition-all duration-500 ease-out
                               hover:scale-[1.02] hover:shadow-[0_20px_40px_rgba(251,146,60,0.4)]
                               active:scale-[0.98]"
                  >
                    {/* Animated Gradient Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent 
                                    translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000 ease-in-out" />
                    
                    {/* Glow Effect */}
                    <div className="absolute inset-0 bg-gradient-to-r from-orange-400/50 via-red-400/50 to-purple-400/50 
                                    opacity-0 group-hover:opacity-100 blur-xl transition-opacity duration-500 -z-10" />
                    
                    {/* Content */}
                    <span className="relative z-10 flex items-center justify-center gap-2">
                      <Plus className="h-5 w-5 group-hover:rotate-90 transition-transform duration-500" />
                      {editingPhone ? "بروزرسانی گوشی" : "افزودن گوشی"}
                    </span>
                  </button>

                  {/* دکمه انصراف - Glassmorphic با Subtle Animation */}
                  <button
                    type="button"
                    onClick={() => setIsDialogOpen(false)}
                    className="mt-3 w-full h-12 rounded-xl font-medium
                               bg-background border border-border
                               text-foreground
                               hover:bg-accent hover:text-accent-foreground
                               hover:shadow-lg hover:scale-[1.01]
                               transition-all duration-300 ease-out
                               relative overflow-hidden group"
                  >
                    {/* Subtle Shine Effect */}
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent 
                                    translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
                    
                    <span className="relative z-10 flex items-center justify-center gap-2">
                      <span className="text-sm">انصراف</span>
                    </span>
                  </button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Card className="relative overflow-hidden bg-card/80 backdrop-blur-sm hover:shadow-xl hover:scale-[1.02] transition-all duration-300 group">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <CardHeader className="relative z-10">
              <CardTitle className="flex items-center gap-2 text-base">
                <div className="relative">
                  <div className="absolute inset-0 bg-primary/20 rounded-lg blur-sm opacity-0 group-hover:opacity-100 transition-opacity" />
                  <Package className="relative h-5 w-5 text-primary" />
                </div>
                موجودی
              </CardTitle>
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
                {availablePhones.length}
              </div>
              <p className="text-sm text-muted-foreground/70 mt-2">
                گوشی آماده فروش
              </p>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden bg-card/80 backdrop-blur-sm hover:shadow-xl hover:scale-[1.02] transition-all duration-300 group">
            <div className="absolute inset-0 bg-gradient-to-br from-success/5 via-transparent to-success/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <CardHeader className="relative z-10">
              <CardTitle className="flex items-center gap-2 text-base">
                <div className="relative">
                  <div className="absolute inset-0 bg-success/20 rounded-lg blur-sm opacity-0 group-hover:opacity-100 transition-opacity" />
                  <Smartphone className="relative h-5 w-5 text-success" />
                </div>
                فروخته شده
              </CardTitle>
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="text-3xl font-bold bg-gradient-to-r from-success to-success/80 bg-clip-text text-transparent">
                {soldPhones.length}
              </div>
              <p className="text-sm text-muted-foreground/70 mt-2">
                گوشی فروخته شده
              </p>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden bg-card/80 backdrop-blur-sm hover:shadow-xl hover:scale-[1.02] transition-all duration-300 group">
            <div className="absolute inset-0 bg-gradient-to-br from-warning/5 via-transparent to-warning/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <CardHeader className="relative z-10">
              <CardTitle className="text-base flex items-center gap-2">
                <div className="relative">
                  <div className="absolute inset-0 bg-warning/20 rounded-lg blur-sm opacity-0 group-hover:opacity-100 transition-opacity" />
                  <DollarSign className="relative h-5 w-5 text-warning" />
                </div>
                ارزش موجودی
              </CardTitle>
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="text-2xl font-bold bg-gradient-to-r from-warning to-warning/80 bg-clip-text text-transparent">
                {formatCurrency(totalInventoryValue)}
              </div>
              <p className="text-sm text-muted-foreground/70 mt-2">
                سرمایه در گردش
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {phones.map((phone, index) => (
            <Card 
              key={phone.id} 
              className="relative overflow-hidden bg-card/80 backdrop-blur-sm hover:shadow-xl hover:scale-[1.02] transition-all duration-300 group animate-slide-in"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <CardHeader className="relative z-10">
                <CardTitle className="flex justify-between items-start">
                  <div>
                    <div className="font-bold text-lg">{phone.brand}</div>
                    <div className="text-sm font-normal text-muted-foreground/70 mt-0.5">
                      {phone.model}
                    </div>
                  </div>
                  <Badge 
                    variant={phone.status === 'available' ? 'default' : 'secondary'}
                    className={cn(
                      phone.status === 'available' && "bg-success/10 text-success border-success/20",
                      phone.status === 'sold' && "bg-muted text-muted-foreground"
                    )}
                  >
                    {phone.status === 'available' ? 'موجود' : 'فروخته شده'}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 relative z-10">
                <div className="text-xs text-muted-foreground/70 bg-muted/30 p-2 rounded-md">
                  IMEI: {phone.imei}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-2 rounded-lg hover:bg-accent/30 transition-colors duration-200">
                    <div className="text-xs text-muted-foreground/70 mb-1">قیمت خرید</div>
                    <div className="font-bold text-foreground">
                      {formatCurrency(phone.purchasePrice)}
                    </div>
                  </div>
                  <div className="p-2 rounded-lg hover:bg-primary/10 transition-colors duration-200">
                    <div className="text-xs text-muted-foreground/70 mb-1">قیمت فروش</div>
                    <div className="font-bold text-primary">
                      {formatCurrency(phone.sellingPrice)}
                    </div>
                  </div>
                </div>
                <div className="text-xs text-muted-foreground/70 pt-2 border-t border-border/50">
                  تاریخ خرید: {toJalaliDate(phone.purchaseDate)}
                </div>
                {phone.status === 'available' && (
                  <div className="flex gap-2 pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 gap-2 hover:bg-primary/10 hover:border-primary/50 hover:scale-105 transition-all duration-200"
                      onClick={() => handleEdit(phone)}
                    >
                      <Edit className="h-3 w-3" />
                      ویرایش
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(phone.id)}
                      className="hover:bg-destructive/10 hover:border-destructive/50 hover:scale-105 transition-all duration-200"
                    >
                      <Trash2 className="h-3 w-3 text-destructive" />
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {phones.length === 0 && (
          <Card className="relative overflow-hidden bg-card/80 backdrop-blur-sm">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5" />
            <CardContent className="flex flex-col items-center justify-center py-12 relative z-10">
              <div className="relative mb-4">
                <div className="absolute inset-0 bg-primary/20 rounded-full blur-lg" />
                <Smartphone className="relative h-12 w-12 text-primary" />
              </div>
              <p className="text-muted-foreground/70 text-center leading-relaxed">
                هنوز گوشی‌ای ثبت نشده است
                <br />
                برای شروع، یک گوشی به موجودی اضافه کنید
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
};

export default Inventory;
