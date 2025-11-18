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
import { Plus, Edit, Trash2, Smartphone, Package } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { JalaliDatePicker } from "@/components/JalaliDatePicker";

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const purchasePrice = parseFloat(formData.purchasePrice);
    const sellingPrice = parseFloat(formData.sellingPrice);
    
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
      purchasePrice: phone.purchasePrice.toString(),
      sellingPrice: phone.sellingPrice.toString(),
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
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">مدیریت موجودی</h1>
            <p className="text-muted-foreground">
              مدیریت گوشی‌های موجود و فروخته شده
            </p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => {
                setEditingPhone(null);
                setFormData({
                  brand: "",
                  model: "",
                  imei: "",
                  purchasePrice: "",
                  sellingPrice: "",
                });
                setPurchaseDate(new Date());
              }}>
                <Plus className="ml-2 h-4 w-4" />
                افزودن گوشی
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>
                  {editingPhone ? "ویرایش گوشی" : "افزودن گوشی جدید"}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="brand">برند</Label>
                  <Input
                    id="brand"
                    value={formData.brand}
                    onChange={(e) =>
                      setFormData({ ...formData, brand: e.target.value })
                    }
                    required
                    placeholder="مثال: سامسونگ، اپل"
                  />
                </div>
                <div>
                  <Label htmlFor="model">مدل</Label>
                  <Input
                    id="model"
                    value={formData.model}
                    onChange={(e) =>
                      setFormData({ ...formData, model: e.target.value })
                    }
                    required
                    placeholder="مثال: Galaxy S24"
                  />
                </div>
                <div>
                  <Label htmlFor="imei">شماره IMEI</Label>
                  <Input
                    id="imei"
                    value={formData.imei}
                    onChange={(e) =>
                      setFormData({ ...formData, imei: e.target.value })
                    }
                    required
                    placeholder="۱۵ رقم"
                  />
                </div>
                <div>
                  <Label htmlFor="purchasePrice">قیمت خرید (تومان)</Label>
                  <Input
                    id="purchasePrice"
                    type="number"
                    value={formData.purchasePrice}
                    onChange={(e) =>
                      setFormData({ ...formData, purchasePrice: e.target.value })
                    }
                    required
                    placeholder="20000000"
                  />
                </div>
                <div>
                  <Label htmlFor="sellingPrice">قیمت فروش (تومان)</Label>
                  <Input
                    id="sellingPrice"
                    type="number"
                    value={formData.sellingPrice}
                    onChange={(e) =>
                      setFormData({ ...formData, sellingPrice: e.target.value })
                    }
                    required
                    placeholder="22000000"
                  />
                </div>
                <div>
                  <Label htmlFor="purchaseDate">تاریخ خرید</Label>
                  <JalaliDatePicker
                    value={purchaseDate}
                    onChange={setPurchaseDate}
                    placeholder="انتخاب تاریخ خرید"
                  />
                </div>
                <Button type="submit" className="w-full">
                  {editingPhone ? "بروزرسانی" : "افزودن"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Package className="h-5 w-5" />
                موجودی
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-primary">
                {availablePhones.length}
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                گوشی آماده فروش
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Smartphone className="h-5 w-5" />
                فروخته شده
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-success">
                {soldPhones.length}
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                گوشی فروخته شده
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">ارزش موجودی</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(totalInventoryValue)}
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                سرمایه در گردش
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {phones.map((phone) => (
            <Card key={phone.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="flex justify-between items-start">
                  <div>
                    <div className="font-bold">{phone.brand}</div>
                    <div className="text-sm font-normal text-muted-foreground">
                      {phone.model}
                    </div>
                  </div>
                  <Badge variant={phone.status === 'available' ? 'default' : 'secondary'}>
                    {phone.status === 'available' ? 'موجود' : 'فروخته شده'}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-xs text-muted-foreground">
                  IMEI: {phone.imei}
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <div className="text-muted-foreground">قیمت خرید</div>
                    <div className="font-semibold">
                      {formatCurrency(phone.purchasePrice)}
                    </div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">قیمت فروش</div>
                    <div className="font-semibold text-primary">
                      {formatCurrency(phone.sellingPrice)}
                    </div>
                  </div>
                </div>
                <div className="text-xs text-muted-foreground pt-2 border-t">
                  تاریخ خرید: {toJalaliDate(phone.purchaseDate)}
                </div>
                {phone.status === 'available' && (
                  <div className="flex gap-2 pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => handleEdit(phone)}
                    >
                      <Edit className="h-3 w-3 ml-1" />
                      ویرایش
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(phone.id)}
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
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Smartphone className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground text-center">
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
