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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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
import { Plus, Edit, Trash2, Smartphone, Package, DollarSign, Palette, HardDrive, Info, ShoppingBag, Calendar, Hash, AlertCircle, Eye, Sparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { JalaliDatePicker } from "@/components/JalaliDatePicker";
import { cn } from "@/lib/utils";
import { phoneBrands, getModelsByBrand } from "@/lib/phoneModels";

const Inventory = () => {
  const [phones, setPhones] = useState<Phone[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPhone, setEditingPhone] = useState<Phone | null>(null);
  const [detailsPhone, setDetailsPhone] = useState<Phone | null>(null);
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; phoneId: string; phoneInfo: string }>({ open: false, phoneId: '', phoneInfo: '' });
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
          color: formData.color || undefined,
          storage: formData.storage || undefined,
          condition: formData.condition,
          purchaseSource: formData.purchaseSource || undefined,
          notes: formData.notes || undefined,
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
          color: formData.color || undefined,
          storage: formData.storage || undefined,
          condition: formData.condition,
          purchaseSource: formData.purchaseSource || undefined,
          notes: formData.notes || undefined,
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
      color: phone.color || "",
      storage: phone.storage || "",
      condition: phone.condition || "new",
      purchaseSource: phone.purchaseSource || "",
      notes: phone.notes || "",
    });
    setPurchaseDate(new Date(phone.purchaseDate));
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string, phone: Phone) => {
    const phoneInfo = `${phone.brand} ${phone.model}`;
    setDeleteDialog({ open: true, phoneId: id, phoneInfo });
  };

  const confirmDelete = async () => {
    try {
      await phonesStore.delete(deleteDialog.phoneId);
      toast({
        title: "موفق",
        description: "گوشی با موفقیت حذف شد",
      });
      setDeleteDialog({ open: false, phoneId: '', phoneInfo: '' });
      await loadPhones();
      refreshPhones();
    } catch (error) {
      console.error('Error deleting phone:', error);
      toast({
        title: "خطا",
        description: "خطا در حذف گوشی",
        variant: "destructive",
      });
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
                      <Select
                        value={formData.brand}
                        onValueChange={(value) => {
                          setFormData({ ...formData, brand: value, model: "" });
                        }}
                        required
                      >
                        <SelectTrigger className="h-10">
                          <SelectValue placeholder="انتخاب برند" />
                        </SelectTrigger>
                        <SelectContent>
                          {phoneBrands.map((brand) => (
                            <SelectItem key={brand} value={brand}>
                              {brand}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="model" className="flex items-center gap-2 text-sm font-medium">
                        <Smartphone className="h-4 w-4 text-primary" />
                        مدل
                      </Label>
                      {formData.brand ? (
                        <>
                          <Select
                            value={formData.model && getModelsByBrand(formData.brand).includes(formData.model) ? formData.model : "custom"}
                            onValueChange={(value) => {
                              if (value === "custom") {
                                setFormData({ ...formData, model: "" });
                              } else {
                                setFormData({ ...formData, model: value });
                              }
                            }}
                            required
                          >
                            <SelectTrigger className="h-10">
                              <SelectValue placeholder="انتخاب مدل" />
                            </SelectTrigger>
                            <SelectContent>
                              {getModelsByBrand(formData.brand).map((model) => (
                                <SelectItem key={model} value={model}>
                                  {model}
                                </SelectItem>
                              ))}
                              <SelectItem value="custom">سایر (ورود دستی)</SelectItem>
                            </SelectContent>
                          </Select>
                          {(!formData.model || !getModelsByBrand(formData.brand).includes(formData.model)) && (
                            <Input
                              id="model"
                              value={formData.model}
                              onChange={(e) =>
                                setFormData({ ...formData, model: e.target.value })
                              }
                              required
                              placeholder="نام مدل را وارد کنید"
                              className="h-10 mt-2"
                            />
                          )}
                        </>
                      ) : (
                        <Input
                          id="model"
                          value={formData.model}
                          onChange={(e) =>
                            setFormData({ ...formData, model: e.target.value })
                          }
                          required
                          disabled
                          placeholder="ابتدا برند را انتخاب کنید"
                          className="h-10"
                        />
                      )}
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
                  <button
                    type="submit"
                    className="group relative w-full h-14 overflow-hidden rounded-xl font-semibold text-white shadow-2xl
                               bg-gradient-to-r from-orange-500 via-red-500 to-purple-600
                               hover:from-orange-400 hover:via-red-400 hover:to-purple-500
                               transition-all duration-500 ease-out
                               hover:scale-[1.02] hover:shadow-[0_20px_40px_rgba(251,146,60,0.4)]
                               active:scale-[0.98]"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent 
                                    translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000 ease-in-out" />
                    <div className="absolute inset-0 bg-gradient-to-r from-orange-400/50 via-red-400/50 to-purple-400/50 
                                    opacity-0 group-hover:opacity-100 blur-xl transition-opacity duration-500 -z-10" />
                    <span className="relative z-10 flex items-center justify-center gap-2">
                      <Plus className="h-5 w-5 group-hover:rotate-90 transition-transform duration-500" />
                      {editingPhone ? "بروزرسانی گوشی" : "افزودن گوشی"}
                    </span>
                  </button>

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

        {/* کارت‌های موبایل با استایل مدرن 2025 */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {phones.map((phone, index) => {
            const profit = phone.sellingPrice - phone.purchasePrice;
            const profitPercent = ((profit / phone.purchasePrice) * 100).toFixed(1);
            
            return (
              <Card 
                key={phone.id} 
                className="group relative overflow-hidden bg-gradient-to-br from-card via-card to-card/80 border-2 border-border/50 hover:border-primary/30 transition-all duration-500 hover:shadow-2xl hover:scale-[1.02] animate-slide-in"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                {/* Background Gradient Effect */}
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                
                {/* Sparkle Effect on Hover */}
                <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                  <Sparkles className="h-5 w-5 text-primary animate-pulse" />
                </div>

                <CardHeader className="relative z-10 pb-3">
                  <div className="flex justify-between items-start gap-3">
                    <div className="flex-1 min-w-0">
                      {/* Brand & Model */}
                      <div className="flex items-center gap-2 mb-2">
                        <div className="p-2 rounded-lg bg-gradient-to-br from-primary/10 to-secondary/10 group-hover:from-primary/20 group-hover:to-secondary/20 transition-colors duration-300">
                          <Smartphone className="h-5 w-5 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-lg truncate group-hover:text-primary transition-colors duration-300">
                            {phone.brand}
                          </h3>
                          <p className="text-sm text-muted-foreground truncate">
                            {phone.model}
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    {/* Status Badge */}
                    <Badge 
                      variant={phone.status === 'available' ? 'default' : 'secondary'}
                      className={cn(
                        "shrink-0 shadow-lg transition-all duration-300",
                        phone.status === 'available' 
                          ? "bg-gradient-to-r from-green-500 to-emerald-500 text-white border-0 group-hover:shadow-green-500/50" 
                          : "bg-gradient-to-r from-gray-400 to-gray-500 text-white border-0"
                      )}
                    >
                      {phone.status === 'available' ? 'موجود' : 'فروخته شده'}
                    </Badge>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4 relative z-10">
                  {/* Specs Grid */}
                  <div className="grid grid-cols-2 gap-2">
                    {phone.color && (
                      <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/50 group-hover:bg-muted transition-colors duration-300">
                        <Palette className="h-4 w-4 text-primary shrink-0" />
                        <span className="text-xs font-medium truncate">{phone.color}</span>
                      </div>
                    )}
                    {phone.storage && (
                      <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/50 group-hover:bg-muted transition-colors duration-300">
                        <HardDrive className="h-4 w-4 text-secondary shrink-0" />
                        <span className="text-xs font-medium truncate">{phone.storage} GB</span>
                      </div>
                    )}
                  </div>

                  {/* IMEI */}
                  <div className="p-3 rounded-lg bg-gradient-to-r from-muted/50 to-muted/30 border border-border/50 group-hover:border-primary/30 transition-colors duration-300">
                    <div className="flex items-center gap-2 mb-1">
                      <Hash className="h-3 w-3 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground font-medium">IMEI</span>
                    </div>
                    <p className="text-sm font-mono font-semibold text-foreground">{phone.imei}</p>
                  </div>

                  {/* Price Cards */}
                  <div className="grid grid-cols-2 gap-3">
                    {/* Purchase Price */}
                    <div className="relative overflow-hidden p-3 rounded-xl bg-gradient-to-br from-orange-500/10 to-red-500/10 border border-orange-500/20 group-hover:border-orange-500/40 transition-all duration-300">
                      <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-orange-500/20 to-transparent rounded-full blur-2xl" />
                      <div className="relative">
                        <div className="flex items-center gap-1 mb-1">
                          <DollarSign className="h-3 w-3 text-orange-600 dark:text-orange-400" />
                          <span className="text-xs text-orange-600 dark:text-orange-400 font-medium">خرید</span>
                        </div>
                        <p className="text-sm font-bold text-orange-700 dark:text-orange-300">
                          {formatCurrency(phone.purchasePrice)}
                        </p>
                      </div>
                    </div>

                    {/* Selling Price */}
                    <div className="relative overflow-hidden p-3 rounded-xl bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-green-500/20 group-hover:border-green-500/40 transition-all duration-300">
                      <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-green-500/20 to-transparent rounded-full blur-2xl" />
                      <div className="relative">
                        <div className="flex items-center gap-1 mb-1">
                          <DollarSign className="h-3 w-3 text-green-600 dark:text-green-400" />
                          <span className="text-xs text-green-600 dark:text-green-400 font-medium">فروش</span>
                        </div>
                        <p className="text-sm font-bold text-green-700 dark:text-green-300">
                          {formatCurrency(phone.sellingPrice)}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Profit Badge */}
                  <div className="flex items-center justify-between p-3 rounded-lg bg-gradient-to-r from-purple-500/10 via-pink-500/10 to-purple-500/10 border border-purple-500/20">
                    <span className="text-xs font-medium text-muted-foreground">سود پیش‌بینی</span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-purple-600 dark:text-purple-400">
                        {formatCurrency(profit)}
                      </span>
                      <Badge className="bg-purple-500/20 text-purple-700 dark:text-purple-300 border-purple-500/30 text-xs">
                        {profitPercent}%
                      </Badge>
                    </div>
                  </div>

                  {/* Date */}
                  <div className="flex items-center gap-2 text-xs text-muted-foreground pt-2 border-t border-border/50">
                    <Calendar className="h-3 w-3" />
                    <span>تاریخ خرید: {toJalaliDate(phone.purchaseDate)}</span>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2 pt-3">
                    {phone.status === 'available' && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1 gap-2 bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border-blue-500/30 hover:border-blue-500/50 hover:bg-blue-500/20 text-blue-700 dark:text-blue-300 hover:scale-105 transition-all duration-300 shadow-sm hover:shadow-md"
                          onClick={() => handleEdit(phone)}
                        >
                          <Edit className="h-3 w-3" />
                          ویرایش
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-2 bg-gradient-to-r from-purple-500/10 to-pink-500/10 border-purple-500/30 hover:border-purple-500/50 hover:bg-purple-500/20 text-purple-700 dark:text-purple-300 hover:scale-105 transition-all duration-300 shadow-sm hover:shadow-md"
                          onClick={() => setDetailsPhone(phone)}
                        >
                          <Eye className="h-3 w-3" />
                          جزئیات
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(phone.id, phone)}
                          className="bg-gradient-to-r from-red-500/10 to-rose-500/10 border-red-500/30 hover:border-red-500/50 hover:bg-red-500/20 text-red-700 dark:text-red-300 hover:scale-105 transition-all duration-300 shadow-sm hover:shadow-md"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </>
                    )}
                    {phone.status === 'sold' && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full gap-2 bg-gradient-to-r from-purple-500/10 to-pink-500/10 border-purple-500/30 hover:border-purple-500/50 hover:bg-purple-500/20 text-purple-700 dark:text-purple-300 hover:scale-105 transition-all duration-300 shadow-sm hover:shadow-md"
                        onClick={() => setDetailsPhone(phone)}
                      >
                        <Eye className="h-3 w-3" />
                        مشاهده جزئیات
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
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

        {/* مودال جزئیات - استایل مدرن 2025 */}
        <Dialog open={!!detailsPhone} onOpenChange={(open) => !open && setDetailsPhone(null)}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-0 gap-0">
            {detailsPhone && (
              <>
                {/* Header با Gradient */}
                <div className="relative bg-gradient-to-br from-primary via-primary/90 to-secondary p-8 overflow-hidden">
                  {/* Background Pattern */}
                  <div className="absolute inset-0 opacity-10">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full blur-3xl" />
                    <div className="absolute bottom-0 left-0 w-48 h-48 bg-white rounded-full blur-3xl" />
                  </div>
                  
                  <div className="relative z-10">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="p-3 rounded-2xl bg-white/20 backdrop-blur-sm border border-white/30">
                          <Smartphone className="h-8 w-8 text-white" />
                        </div>
                        <div>
                          <h2 className="text-3xl font-bold text-white mb-1">
                            {detailsPhone.brand}
                          </h2>
                          <p className="text-white/90 text-lg">
                            {detailsPhone.model}
                          </p>
                        </div>
                      </div>
                      <Badge 
                        className={cn(
                          "text-sm px-3 py-1 shadow-lg",
                          detailsPhone.status === 'available' 
                            ? "bg-green-500 text-white border-0" 
                            : "bg-gray-500 text-white border-0"
                        )}
                      >
                        {detailsPhone.status === 'available' ? 'موجود' : 'فروخته شده'}
                      </Badge>
                    </div>
                    
                    {/* IMEI با استایل خاص */}
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20">
                      <Hash className="h-4 w-4 text-white/80" />
                      <span className="text-sm text-white/80 font-medium">IMEI:</span>
                      <span className="text-white font-mono font-bold">{detailsPhone.imei}</span>
                    </div>
                  </div>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6 bg-background">
                  {/* مشخصات فنی */}
                  <div className="space-y-3">
                    <h3 className="text-lg font-bold flex items-center gap-2 text-foreground">
                      <div className="p-2 rounded-lg bg-gradient-to-br from-primary/10 to-secondary/10">
                        <Info className="h-5 w-5 text-primary" />
                      </div>
                      مشخصات فنی
                    </h3>
                    <div className="grid grid-cols-2 gap-3">
                      {detailsPhone.color && (
                        <div className="p-4 rounded-xl bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/20">
                          <div className="flex items-center gap-2 mb-2">
                            <Palette className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                            <span className="text-xs font-medium text-muted-foreground">رنگ</span>
                          </div>
                          <p className="text-sm font-bold text-purple-700 dark:text-purple-300">{detailsPhone.color}</p>
                        </div>
                      )}
                      {detailsPhone.storage && (
                        <div className="p-4 rounded-xl bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border border-blue-500/20">
                          <div className="flex items-center gap-2 mb-2">
                            <HardDrive className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                            <span className="text-xs font-medium text-muted-foreground">حافظه</span>
                          </div>
                          <p className="text-sm font-bold text-blue-700 dark:text-blue-300">{detailsPhone.storage} GB</p>
                        </div>
                      )}
                      {detailsPhone.condition && (
                        <div className="p-4 rounded-xl bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-green-500/20">
                          <div className="flex items-center gap-2 mb-2">
                            <Info className="h-4 w-4 text-green-600 dark:text-green-400" />
                            <span className="text-xs font-medium text-muted-foreground">وضعیت</span>
                          </div>
                          <p className="text-sm font-bold text-green-700 dark:text-green-300">
                            {detailsPhone.condition === 'new' ? 'نو' : detailsPhone.condition === 'used' ? 'کارکرده' : 'بازسازی شده'}
                          </p>
                        </div>
                      )}
                      {detailsPhone.purchaseSource && (
                        <div className="p-4 rounded-xl bg-gradient-to-br from-orange-500/10 to-red-500/10 border border-orange-500/20">
                          <div className="flex items-center gap-2 mb-2">
                            <ShoppingBag className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                            <span className="text-xs font-medium text-muted-foreground">منبع خرید</span>
                          </div>
                          <p className="text-sm font-bold text-orange-700 dark:text-orange-300">{detailsPhone.purchaseSource}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* اطلاعات مالی */}
                  <div className="space-y-3">
                    <h3 className="text-lg font-bold flex items-center gap-2 text-foreground">
                      <div className="p-2 rounded-lg bg-gradient-to-br from-warning/10 to-yellow-500/10">
                        <DollarSign className="h-5 w-5 text-warning" />
                      </div>
                      اطلاعات مالی
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {/* قیمت خرید */}
                      <div className="relative overflow-hidden p-5 rounded-2xl bg-gradient-to-br from-orange-500/10 to-red-500/10 border-2 border-orange-500/30">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-orange-500/20 to-transparent rounded-full blur-2xl" />
                        <div className="relative">
                          <div className="flex items-center gap-2 mb-2">
                            <DollarSign className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                            <span className="text-sm font-medium text-orange-600 dark:text-orange-400">قیمت خرید</span>
                          </div>
                          <p className="text-2xl font-bold text-orange-700 dark:text-orange-300">
                            {formatCurrency(detailsPhone.purchasePrice)}
                          </p>
                        </div>
                      </div>

                      {/* قیمت فروش */}
                      <div className="relative overflow-hidden p-5 rounded-2xl bg-gradient-to-br from-green-500/10 to-emerald-500/10 border-2 border-green-500/30">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-green-500/20 to-transparent rounded-full blur-2xl" />
                        <div className="relative">
                          <div className="flex items-center gap-2 mb-2">
                            <DollarSign className="h-5 w-5 text-green-600 dark:text-green-400" />
                            <span className="text-sm font-medium text-green-600 dark:text-green-400">قیمت فروش</span>
                          </div>
                          <p className="text-2xl font-bold text-green-700 dark:text-green-300">
                            {formatCurrency(detailsPhone.sellingPrice)}
                          </p>
                        </div>
                      </div>

                      {/* سود */}
                      <div className="relative overflow-hidden p-5 rounded-2xl bg-gradient-to-br from-purple-500/10 to-pink-500/10 border-2 border-purple-500/30">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-purple-500/20 to-transparent rounded-full blur-2xl" />
                        <div className="relative">
                          <div className="flex items-center gap-2 mb-2">
                            <Sparkles className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                            <span className="text-sm font-medium text-purple-600 dark:text-purple-400">سود پیش‌بینی</span>
                          </div>
                          <p className="text-2xl font-bold text-purple-700 dark:text-purple-300">
                            {formatCurrency(detailsPhone.sellingPrice - detailsPhone.purchasePrice)}
                          </p>
                          <Badge className="mt-2 bg-purple-500/20 text-purple-700 dark:text-purple-300 border-purple-500/30">
                            {(((detailsPhone.sellingPrice - detailsPhone.purchasePrice) / detailsPhone.purchasePrice) * 100).toFixed(1)}%
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* تاریخ خرید */}
                  <div className="p-4 rounded-xl bg-gradient-to-r from-muted/50 to-muted/30 border border-border/50">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-primary/10">
                        <Calendar className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground font-medium mb-1">تاریخ خرید</p>
                        <p className="text-sm font-bold text-foreground">{toJalaliDate(detailsPhone.purchaseDate)}</p>
                      </div>
                    </div>
                  </div>

                  {/* توضیحات */}
                  {detailsPhone.notes && (
                    <div className="space-y-2">
                      <h3 className="text-lg font-bold flex items-center gap-2 text-foreground">
                        <div className="p-2 rounded-lg bg-gradient-to-br from-secondary/10 to-primary/10">
                          <Info className="h-5 w-5 text-secondary" />
                        </div>
                        توضیحات
                      </h3>
                      <div className="p-4 rounded-xl bg-muted/50 border border-border/50">
                        <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">
                          {detailsPhone.notes}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* دکمه بستن */}
                  <Button
                    onClick={() => setDetailsPhone(null)}
                    className="w-full h-12 text-base font-semibold bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 transition-all duration-300 shadow-lg hover:shadow-xl"
                  >
                    بستن
                  </Button>
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>

        {/* AlertDialog حذف گوشی */}
        <AlertDialog open={deleteDialog.open} onOpenChange={(open) => setDeleteDialog({ ...deleteDialog, open })}>
          <AlertDialogContent className="max-w-lg p-0 gap-0 overflow-hidden border-destructive/20">
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
                  حذف گوشی
                </AlertDialogTitle>
              </div>
            </div>

            <div className="p-6 space-y-4 bg-background">
              <AlertDialogDescription className="text-right space-y-4">
                <div className="p-4 rounded-lg bg-muted/50 border border-border/50">
                  <p className="text-base font-semibold text-foreground mb-2">
                    گوشی مورد نظر:
                  </p>
                  <p className="text-lg font-bold text-primary bg-primary/10 px-3 py-2 rounded-md inline-block">
                    {deleteDialog.phoneInfo}
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
                        این عمل غیرقابل بازگشت است و تمام اطلاعات مرتبط با این گوشی از جمله:
                      </p>
                      <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside mr-4">
                        <li>اطلاعات خرید و فروش</li>
                        <li>IMEI و مشخصات فنی</li>
                        <li>تاریخچه موجودی</li>
                      </ul>
                      <p className="text-sm font-semibold text-destructive mt-2">
                        برای همیشه حذف خواهند شد.
                      </p>
                    </div>
                  </div>
                </div>

                <p className="text-center text-sm text-muted-foreground pt-2">
                  آیا از حذف این گوشی اطمینان دارید؟
                </p>
              </AlertDialogDescription>
            </div>

            <AlertDialogFooter className="p-6 pt-0 gap-3 bg-background">
              <AlertDialogCancel className="flex-1 h-11 text-base font-semibold border-2 hover:bg-accent hover:border-accent-foreground/20 transition-all duration-200">
                انصراف
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={confirmDelete}
                className="flex-1 h-11 text-base font-semibold bg-gradient-to-r from-destructive to-destructive/80 hover:from-destructive/90 hover:to-destructive/70 text-white shadow-lg hover:shadow-xl transition-all duration-200"
              >
                <Trash2 className="h-4 w-4 ml-2" />
                حذف گوشی
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </Layout>
  );
};

export default Inventory;
