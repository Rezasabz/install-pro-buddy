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
  AlertDialogHeader,
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
import { expensesStore, Expense } from "@/lib/storeProvider";
import { formatCurrency, toJalaliDate, toPersianDigits } from "@/lib/persian";
import { 
  Plus, 
  Edit, 
  Trash2, 
  Receipt, 
  TrendingDown, 
  Calendar, 
  Filter, 
  AlertCircle, 
  DollarSign, 
  FileText, 
  Tag, 
  CheckCircle2,
  Search,
  X,
  BarChart3
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { JalaliDatePicker } from "@/components/JalaliDatePicker";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// انواع هزینه‌های پیش‌فرض
const EXPENSE_TYPES = [
  "اجاره",
  "حقوق",
  "تبلیغات",
  "خرید کالا",
  "مالیات",
  "حمل‌ونقل",
  "آب و برق و گاز",
  "تعمیرات",
  "بیمه",
  "متفرقه",
];

// آیکون‌های مربوط به هر نوع هزینه
const EXPENSE_ICONS = {
  "اجاره": "🏠",
  "حقوق": "👥",
  "تبلیغات": "📢",
  "خرید کالا": "🛒",
  "مالیات": "🏛️",
  "حمل‌ونقل": "🚚",
  "آب و برق و گاز": "💡",
  "تعمیرات": "🔧",
  "بیمه": "🛡️",
  "متفرقه": "📦"
};

export default function Expenses() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [filteredExpenses, setFilteredExpenses] = useState<Expense[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; expenseId: string; expenseInfo: string }>({ 
    open: false, 
    expenseId: '', 
    expenseInfo: '' 
  });
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("");
  const [expenseDate, setExpenseDate] = useState<Date>(new Date());
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("list");
  const [formData, setFormData] = useState({
    type: "",
    amount: "",
    description: "",
  });
  
  const { toast } = useToast();
  const { refreshDashboard } = useDataContext();

  const loadExpenses = async () => {
    try {
      const data = await expensesStore.getAll();
      setExpenses(data);
      setFilteredExpenses(data);
    } catch (error) {
      console.error('Error loading expenses:', error);
      toast({
        title: "خطا در بارگذاری",
        description: "مشکلی در بارگذاری هزینه‌ها رخ داده است",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    loadExpenses();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // فیلتر کردن هزینه‌ها
  useEffect(() => {
    let filtered = expenses;

    if (typeFilter !== "all") {
      filtered = filtered.filter(e => e.type === typeFilter);
    }

    if (searchQuery) {
      filtered = filtered.filter(e => 
        e.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        e.type.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setFilteredExpenses(filtered);
  }, [expenses, typeFilter, searchQuery]);

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const numericValue = value.replace(/[^\d]/g, '');
    
    if (numericValue === '') {
      setFormData({ ...formData, amount: '' });
      return;
    }
    
    const number = parseInt(numericValue, 10);
    const formatted = number.toLocaleString('en-US');
    setFormData({ ...formData, amount: formatted });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const amount = parseFloat(formData.amount.replace(/,/g, ''));
    if (isNaN(amount) || amount <= 0) {
      toast({
        title: "خطا در مبلغ",
        description: "لطفاً یک مبلغ معتبر وارد کنید",
        variant: "destructive",
      });
      return;
    }

    if (!formData.type) {
      toast({
        title: "نوع هزینه",
        description: "لطفاً نوع هزینه را انتخاب کنید",
        variant: "destructive",
      });
      return;
    }

    setIsDialogOpen(false);
    setIsLoading(true);
    setLoadingMessage(editingExpense ? "در حال بروزرسانی هزینه..." : "در حال ثبت هزینه...");

    try {
      if (editingExpense) {
        await expensesStore.update(editingExpense.id, {
          date: expenseDate.toISOString(),
          type: formData.type,
          amount,
          description: formData.description,
        });
        toast({
          title: "هزینه بروزرسانی شد",
          description: "اطلاعات هزینه با موفقیت به‌روزرسانی شد",
        });
      } else {
        await expensesStore.add({
          date: expenseDate.toISOString(),
          type: formData.type,
          amount,
          description: formData.description,
        });
        toast({
          title: "هزینه ثبت شد",
          description: "هزینه جدید با موفقیت در سیستم ثبت شد",
        });
      }

      resetForm();
      await loadExpenses();
      refreshDashboard();
    } catch (error) {
      console.error('Error saving expense:', error);
      toast({
        title: "خطا در ذخیره‌سازی",
        description: "مشکلی در ذخیره اطلاعات هزینه رخ داده است",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      setLoadingMessage("");
    }
  };

  const handleEdit = (expense: Expense) => {
    setEditingExpense(expense);
    setFormData({
      type: expense.type,
      amount: expense.amount.toLocaleString('en-US'),
      description: expense.description,
    });
    setExpenseDate(new Date(expense.date));
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string, expense: Expense) => {
    const expenseInfo = `${expense.type} - ${formatCurrency(expense.amount)}`;
    setDeleteDialog({ open: true, expenseId: id, expenseInfo });
  };

  const confirmDelete = async () => {
    try {
      await expensesStore.delete(deleteDialog.expenseId);
      toast({
        title: "هزینه حذف شد",
        description: "هزینه مورد نظر با موفقیت از سیستم حذف شد",
      });
      setDeleteDialog({ open: false, expenseId: '', expenseInfo: '' });
      await loadExpenses();
      refreshDashboard();
    } catch (error) {
      console.error('Error deleting expense:', error);
      toast({
        title: "خطا در حذف",
        description: "مشکلی در حذف هزینه رخ داده است",
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setFormData({ type: "", amount: "", description: "" });
    setExpenseDate(new Date());
    setEditingExpense(null);
  };

  const clearFilters = () => {
    setSearchQuery("");
    setTypeFilter("all");
  };

  // محاسبات آماری
  const totalExpenses = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);
  const averageExpense = filteredExpenses.length > 0 ? totalExpenses / filteredExpenses.length : 0;
  
  // گروه‌بندی هزینه‌ها بر اساس نوع
  const expensesByType = EXPENSE_TYPES.map(type => ({
    type,
    amount: expenses.filter(e => e.type === type).reduce((sum, e) => sum + e.amount, 0),
    count: expenses.filter(e => e.type === type).length
  })).filter(item => item.count > 0);

  return (
    <Layout>
      {isLoading && <LoadingOverlay message={loadingMessage} />}
      
      <div className="space-y-6 animate-fade-scale">
        {/* هدر صفحه */}
        <div className="flex flex-col sm:flex-row justify-between items-start gap-4 pb-2">
          <div className="space-y-1">
            <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-primary via-secondary to-primary bg-clip-text text-transparent bg-[length:200%_auto] animate-gradient text-right">
              مدیریت هزینه‌ها
            </h1>
            <p className="text-muted-foreground/80 text-sm md:text-base text-right">
              ثبت و مدیریت هزینه‌های کسب‌وکار
            </p>
          </div>
          
          <Dialog open={isDialogOpen} onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) resetForm();
          }}>
            <DialogTrigger asChild>
              <Button className="gap-2 hover:scale-105 transition-all duration-200">
                <Plus className="h-4 w-4" />
                ثبت هزینه جدید
              </Button>
            </DialogTrigger>
            
            {isDialogOpen && (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
    {/* بک‌گراند تیره + بلور */}
    <div 
      className="fixed inset-0 bg-black/60 backdrop-blur-sm"
      onClick={() => {
        setIsDialogOpen(false);
        resetForm();
      }}
    />

    {/* کارت اصلی فرم */}
    <div className="relative w-full max-w-2xl bg-background rounded-2xl shadow-2xl overflow-hidden border border-border/30">
      {/* هدر گرادیانتی مثل فرم گوشی */}
      <div className="relative p-8 text-center bg-gradient-to-r from-primary/10 via-transparent to-secondary/10">
        <button
          onClick={() => {
            setIsDialogOpen(false);
            resetForm();
          }}
          className="absolute top-4 left-4 text-muted-foreground hover:text-foreground transition"
        >
          <X className="h-6 w-6" />
        </button>

        <DialogTitle className="text-3xl font-bold bg-gradient-to-r from-primary via-secondary to-primary bg-clip-text text-transparent">
          {editingExpense ? "ویرایش هزینه" : "ثبت هزینه جدید"}
        </DialogTitle>
      </div>

      {/* فرم اصلی */}
      <form onSubmit={handleSubmit} className="space-y-6 p-6 max-h-[75vh] overflow-y-auto">
        
        {/* بخش اطلاعات اصلی */}
        <div className="space-y-4 p-5 rounded-xl bg-card border border-border/50">
          <div className="flex items-center gap-3 mb-4">
            <div className="relative">
              <div className="absolute inset-0 bg-primary/20 rounded-lg blur-sm" />
              <Receipt className="relative h-6 w-6 text-primary" />
            </div>
            <h3 className="font-bold text-xl">اطلاعات اصلی</h3>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <div className="space-y-2">
              <Label className="flex items-center gap-2 font-medium">
                <Calendar className="h-4 w-4 text-primary" />
                تاریخ هزینه
              </Label>
              <JalaliDatePicker value={expenseDate} onChange={setExpenseDate} />
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2 font-medium">
                <Tag className="h-4 w-4 text-primary" />
                نوع هزینه
              </Label>
              <Select value={formData.type} onValueChange={(v) => setFormData({ ...formData, type: v })}>
                <SelectTrigger className="h-12">
                  <SelectValue placeholder="انتخاب نوع هزینه" />
                </SelectTrigger>
                <SelectContent>
                  {EXPENSE_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>
                      <span className="ml-2">{EXPENSE_ICONS[type]}</span>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* بخش مالی */}
        <div className="space-y-4 p-5 rounded-xl bg-card border border-border/50">
          <div className="flex items-center gap-3 mb-4">
            <div className="relative">
              <div className="absolute inset-0 bg-destructive/20 rounded-lg blur-sm" />
              <DollarSign className="relative h-6 w-6 text-destructive" />
            </div>
            <h3 className="font-bold text-xl">اطلاعات مالی</h3>
          </div>

          <div className="space-y-2">
            <Label className="flex items-center gap-2 font-medium">
              <DollarSign className="h-4 w-4 text-destructive" />
              مبلغ (تومان)
            </Label>
            <Input
              type="text"
              value={formData.amount}
              onChange={handleAmountChange}
              placeholder="۱٬۵۰۰٬۰۰۰"
              dir="ltr"
              className="h-10 text-md font-bold text-left font-vazir tracking-wider"
              style={{ fontVariantNumeric: "tabular-nums" }}
            />
          </div>
        </div>

        {/* بخش توضیحات */}
        <div className="space-y-4 p-5 rounded-xl bg-card border border-border/50">
          <div className="flex items-center gap-3 mb-4">
            <div className="relative">
              <div className="absolute inset-0 bg-primary/20 rounded-lg blur-sm" />
              <FileText className="relative h-6 w-6 text-primary" />
            </div>
            <h3 className="font-bold text-xl">توضیحات</h3>
          </div>

          <Textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="جزئیات کامل هزینه را وارد کنید..."
            rows={4}
            className="resize-none text-base"
          />
        </div>

        {/* دکمه‌های نهایی — دقیقاً مثل فرم گوشی! */}
        <div className="border-t border-border/50 space-y-3">
          {/* دکمه ثبت — انیمیشن دار و گرادیانت نارنجی-قرمز-بنفش */}
          <button
            type="submit"
            className="group relative w-full h-16 overflow-hidden rounded-xl font-bold text-white text-lg shadow-2xl
                       bg-gradient-to-r from-orange-500 via-red-500 to-purple-600
                       hover:from-orange-400 hover:via-red-400 hover:to-purple-500
                       transition-all duration-500 ease-out
                       hover:scale-[1.02] hover:shadow-[0_20px_40px_rgba(251,146,60,0.4)]
                       active:scale-[0.98]"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent 
                            translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000" />
            <div className="absolute inset-0 bg-gradient-to-r from-orange-400/50 via-red-400/50 to-purple-400/50 
                            opacity-0 group-hover:opacity-100 blur-xl transition-opacity duration-500 -z-10" />
            
            <span className="relative z-10 flex items-center justify-center gap-3">
              <CheckCircle2 className="h-6 w-6 group-hover:scale-110 transition-transform" />
              {editingExpense ? "بروزرسانی هزینه" : "ثبت هزینه"}
            </span>
          </button>

          {/* دکمه انصراف — شیشه‌ای و شیک */}
          <button
            type="button"
            onClick={() => {
              setIsDialogOpen(false);
              resetForm();
            }}
            className="w-full h-12 rounded-xl font-medium text-foreground
                       bg-background/80 backdrop-blur-sm border border-border
                       hover:bg-accent hover:text-accent-foreground
                       hover:shadow-lg hover:scale-[1.01]
                       transition-all duration-300 relative overflow-hidden group"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent 
                            translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
            <span className="relative z-10">انصراف</span>
          </button>
        </div>
      </form>
    </div>
  </div>
)}
          </Dialog>
        </div>

        {/* کارت‌های آماری */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="relative overflow-hidden bg-card/80 backdrop-blur-sm hover:shadow-xl hover:scale-[1.02] transition-all duration-300 group">
            <div className="absolute inset-0 bg-gradient-to-br from-destructive/5 via-transparent to-destructive/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <CardHeader className="relative z-10">
                <CardTitle className="flex items-center gap-2 text-right">
                  <div className="relative">
                    <div className="absolute inset-0 bg-destructive/20 rounded-lg blur-sm opacity-0 group-hover:opacity-100 transition-opacity" />
                    <TrendingDown className="relative h-5 w-5 text-destructive" />
                  </div>
                  مجموع هزینه‌ها
                </CardTitle>
              </CardHeader>
            <CardContent className="relative z-10">
              <div className="text-3xl font-bold bg-gradient-to-r from-destructive to-destructive/80 bg-clip-text text-transparent">
                {formatCurrency(totalExpenses)}
              </div>
              <p className="text-sm text-muted-foreground/70 mt-2">
                {toPersianDigits(filteredExpenses.length)} هزینه ثبت شده
              </p>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden bg-card/80 backdrop-blur-sm hover:shadow-xl hover:scale-[1.02] transition-all duration-300 group">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <CardHeader className="relative z-10">
                <CardTitle className="flex items-center gap-2 text-right">
                  <div className="relative">
                    <div className="absolute inset-0 bg-primary/20 rounded-lg blur-sm opacity-0 group-hover:opacity-100 transition-opacity" />
                    <Receipt className="relative h-5 w-5 text-primary" />
                  </div>
                  تعداد هزینه‌ها
                </CardTitle>
              </CardHeader>
            <CardContent className="relative z-10">
              <div className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
                {toPersianDigits(filteredExpenses.length)}
              </div>
              <p className="text-sm text-muted-foreground/70 mt-2">
                هزینه‌های فیلتر شده
              </p>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden bg-card/80 backdrop-blur-sm hover:shadow-xl hover:scale-[1.02] transition-all duration-300 group">
            <div className="absolute inset-0 bg-gradient-to-br from-secondary/5 via-transparent to-secondary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <CardHeader className="relative z-10">
                <CardTitle className="flex items-center gap-2 text-right">
                  <div className="relative">
                    <div className="absolute inset-0 bg-secondary/20 rounded-lg blur-sm opacity-0 group-hover:opacity-100 transition-opacity" />
                    <BarChart3 className="relative h-5 w-5 text-secondary" />
                  </div>
                  میانگین هر هزینه
                </CardTitle>
              </CardHeader>
            <CardContent className="relative z-10">
              <div className="text-3xl font-bold bg-gradient-to-r from-secondary to-secondary/80 bg-clip-text text-transparent">
                {formatCurrency(averageExpense)}
              </div>
              <p className="text-sm text-muted-foreground/70 mt-2">
                میانگین هزینه‌ها
              </p>
            </CardContent>
          </Card>
        </div>

        {/* تب‌های اصلی */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 p-1 bg-muted/50 rounded-xl">
            <TabsTrigger 
              value="list" 
              className="flex items-center gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-lg transition-all duration-200"
            >
              <Receipt className="h-4 w-4" />
              لیست هزینه‌ها
            </TabsTrigger>
            <TabsTrigger 
              value="analytics" 
              className="flex items-center gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-lg transition-all duration-200"
            >
              <BarChart3 className="h-4 w-4" />
              آمار و تحلیل
            </TabsTrigger>
          </TabsList>

          {/* تب لیست هزینه‌ها */}
          <TabsContent value="list" className="space-y-6" dir="rtl">
            {/* فیلترها */}
            <Card className="relative overflow-hidden bg-card/80 backdrop-blur-sm hover:shadow-lg transition-shadow duration-300">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5" />
              <CardHeader className="relative z-10 pb-3">
                <CardTitle className="flex items-center gap-2 text-lg text-right">
                  <div className="h-1.5 w-1.5 rounded-full bg-gradient-to-r from-primary to-secondary" />
                  فیلترها و جستجو
                </CardTitle>
              </CardHeader>
              <CardContent className="relative z-10">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="search" className="flex items-center gap-2 text-sm font-semibold">
                      <div className="p-1.5 rounded-md bg-primary/10">
                        <Search className="h-3.5 w-3.5 text-primary" />
                      </div>
                      جستجو
                    </Label>
                    <div className="relative">
                      <Input
                        id="search"
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="جستجو در توضیحات و نوع..."
                        className="h-10 transition-all duration-200 focus:ring-2 focus:ring-primary/20"
                      />
                      {searchQuery && (
                        <button
                          onClick={() => setSearchQuery("")}
                          className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="typeFilter" className="flex items-center gap-2 text-sm font-semibold">
                      <div className="p-1.5 rounded-md bg-secondary/10">
                        <Filter className="h-3.5 w-3.5 text-secondary" />
                      </div>
                      فیلتر بر اساس نوع
                    </Label>
                    <Select value={typeFilter} onValueChange={setTypeFilter}>
                      <SelectTrigger className="h-10">
                        <SelectValue placeholder="همه انواع" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">همه انواع</SelectItem>
                        {EXPENSE_TYPES.map((type) => (
                          <SelectItem key={type} value={type}>
                            {type}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                {(searchQuery || typeFilter !== "all") && (
                  <div className="mt-4 pt-4 border-t border-border/50">
                    <div className="flex items-center justify-between">
                      <Badge variant="secondary" className="text-sm">
                        {toPersianDigits(filteredExpenses.length)} مورد یافت شد
                      </Badge>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={clearFilters}
                        className="gap-2 hover:bg-destructive/10 hover:text-destructive hover:border-destructive/50 hover:scale-105 transition-all duration-200"
                      >
                        <X className="h-4 w-4" />
                        پاک کردن فیلترها
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* لیست هزینه‌ها */}
            <div className="space-y-4">
              {filteredExpenses.length === 0 ? (
                <Card className="relative overflow-hidden bg-card/80 backdrop-blur-sm">
                  <div className="absolute inset-0 bg-gradient-to-br from-destructive/5 via-transparent to-destructive/5" />
                  <CardContent className="py-12 text-center relative z-10">
                    <div className="relative inline-block mb-4">
                      <div className="absolute inset-0 bg-destructive/20 rounded-full blur-lg" />
                      <Receipt className="relative h-12 w-12 text-destructive mx-auto" />
                    </div>
                    <p className="text-muted-foreground/70 text-base">
                      {searchQuery || typeFilter !== "all" 
                        ? "هیچ هزینه‌ای با این فیلتر یافت نشد"
                        : "هیچ هزینه‌ای ثبت نشده است"}
                    </p>
                    {searchQuery || typeFilter !== "all" ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={clearFilters}
                        className="mt-4 gap-2 hover:scale-105 transition-all duration-200"
                      >
                        <Filter className="h-4 w-4 rotate-180" />
                        پاک کردن فیلترها
                      </Button>
                    ) : null}
                  </CardContent>
                </Card>
              ) : (
                filteredExpenses.map((expense, index) => (
                  <Card 
                    key={expense.id} 
                    className="relative overflow-hidden bg-card/80 backdrop-blur-sm hover:shadow-xl hover:scale-[1.01] transition-all duration-300 group animate-slide-in"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-destructive/5 via-transparent to-destructive/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    <CardContent className="pt-6 relative z-10">
                      <div className="flex justify-between items-start gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <div className="p-1.5 rounded-md bg-destructive/10">
                              <span className="text-lg">{EXPENSE_ICONS[expense.type]}</span>
                            </div>
                            <span className="font-bold text-base">{expense.type}</span>
                          </div>
                          <p className="text-sm text-muted-foreground/70 mb-3 leading-relaxed">
                            {expense.description}
                          </p>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground/70">
                            <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-muted/30">
                              <Calendar className="h-3.5 w-3.5" />
                              <span className="font-medium">{toJalaliDate(expense.date)}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-3 min-w-[140px]">
                          <div className="text-2xl font-bold bg-gradient-to-r from-destructive to-destructive/80 bg-clip-text text-transparent">
                            {formatCurrency(expense.amount)}
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEdit(expense)}
                              className="hover:bg-primary/10 hover:border-primary/50 hover:scale-110 transition-all duration-200"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDelete(expense.id, expense)}
                              className="hover:bg-destructive/10 hover:border-destructive/50 hover:scale-110 transition-all duration-200"
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>

          {/* تب آمار و تحلیل */}
          <TabsContent value="analytics" className="space-y-6" dir="rtl">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* توزیع بر اساس نوع */}
              <Card className="relative overflow-hidden bg-card/80 backdrop-blur-sm hover:shadow-lg transition-shadow duration-300">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/5" />
                <CardHeader className="relative z-10">
                  <CardTitle className="flex items-center gap-2 text-right">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <BarChart3 className="h-5 w-5 text-primary" />
                    </div>
                    توزیع هزینه بر اساس نوع
                  </CardTitle>
                </CardHeader>
                <CardContent className="relative z-10 space-y-3">
                  {expensesByType.length > 0 ? (
                    expensesByType.map((item, index) => (
                      <div 
                        key={item.type} 
                        className="flex items-center justify-between p-4 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors duration-200 group"
                      >
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                            <span className="text-xl">{EXPENSE_ICONS[item.type]}</span>
                          </div>
                          <div>
                            <div className="font-semibold text-foreground">
                              {item.type}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {toPersianDigits(item.count)} هزینه
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-foreground">
                            {formatCurrency(item.amount)}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {totalExpenses > 0 ? ((item.amount / totalExpenses) * 100).toFixed(1) : 0}%
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-right py-8 text-muted-foreground">
                      داده‌ای برای نمایش وجود ندارد
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* آخرین هزینه‌ها */}
              <Card className="relative overflow-hidden bg-card/80 backdrop-blur-sm hover:shadow-lg transition-shadow duration-300" dir="rtl">
                <div className="absolute inset-0 bg-gradient-to-br from-secondary/5 via-transparent to-secondary/5" />
                <CardHeader className="relative z-10">
                  <CardTitle className="flex items-center gap-2 text-right">
                    <div className="p-2 rounded-lg bg-secondary/10">
                      <Receipt className="h-5 w-5 text-secondary" />
                    </div>
                    آخرین هزینه‌ها
                  </CardTitle>
                </CardHeader>
                <CardContent className="relative z-10 space-y-3">
                  {expenses.slice(0, 5).map((expense) => (
                    <div 
                      key={expense.id} 
                      className="flex items-center justify-between p-4 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors duration-200 group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-destructive/10 group-hover:bg-destructive/20 transition-colors">
                          <span className="text-lg">{EXPENSE_ICONS[expense.type]}</span>
                        </div>
                        <div className="min-w-0">
                          <div className="font-semibold text-foreground truncate">
                            {expense.type}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {toJalaliDate(expense.date)}
                          </div>
                        </div>
                      </div>
                      <div className="font-bold bg-gradient-to-r from-destructive to-destructive/80 bg-clip-text text-transparent">
                        {formatCurrency(expense.amount)}
                      </div>
                    </div>
                  ))}
                  
                  {expenses.length === 0 && (
                    <div className="text-right py-8 text-muted-foreground">
                      هیچ هزینه‌ای ثبت نشده است
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        {/* AlertDialog حذف هزینه */}
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
                <AlertDialogTitle className="text-2xl font-bold text-white text-center">
                  حذف هزینه
                </AlertDialogTitle>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 space-y-4 bg-background">
              <AlertDialogDescription className="text-right space-y-4">
                <div className="p-4 rounded-lg bg-muted/50 border border-border/50">
                  <p className="text-base font-semibold text-foreground mb-2">
                    هزینه مورد نظر:
                  </p>
                  <p className="text-lg font-bold text-primary bg-primary/10 px-3 py-2 rounded-md inline-block">
                    {deleteDialog.expenseInfo}
                  </p>
                </div>
                
                <div className="p-4 rounded-lg bg-destructive/5 border border-destructive/20">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-full bg-destructive/10 flex-shrink-0">
                      <AlertCircle className="h-5 w-5 text-destructive" />
                    </div>
                    <div className="flex-1 space-y-2">
                      <p className="text-sm font-semibold text-destructive">
                        هشدار
                      </p>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        این عمل غیرقابل بازگشت است و این هزینه از گزارش‌های مالی حذف خواهد شد.
                      </p>
                    </div>
                  </div>
                </div>

                <p className="text-center text-sm text-muted-foreground pt-2">
                  آیا از حذف این هزینه اطمینان دارید؟
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
                حذف هزینه
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </Layout>
  );
}