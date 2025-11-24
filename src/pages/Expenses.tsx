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
import { expensesStore, Expense } from "@/lib/storeProvider";
import { formatCurrency, toJalaliDate, toPersianDigits } from "@/lib/persian";
import { Plus, Edit, Trash2, Receipt, TrendingDown, Calendar, Filter } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { JalaliDatePicker } from "@/components/JalaliDatePicker";
import { cn } from "@/lib/utils";

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

export default function Expenses() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [filteredExpenses, setFilteredExpenses] = useState<Expense[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("");
  const [expenseDate, setExpenseDate] = useState<Date>(new Date());
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
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
        title: "خطا",
        description: "خطا در بارگذاری هزینه‌ها",
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

    // فیلتر بر اساس نوع
    if (typeFilter !== "all") {
      filtered = filtered.filter(e => e.type === typeFilter);
    }

    // جستجو در توضیحات
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
        title: "خطا",
        description: "مبلغ نامعتبر است",
        variant: "destructive",
      });
      return;
    }

    if (!formData.type) {
      toast({
        title: "خطا",
        description: "لطفاً نوع هزینه را انتخاب کنید",
        variant: "destructive",
      });
      return;
    }

    // بستن dialog و نمایش loading
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
          title: "موفق",
          description: "هزینه با موفقیت بروزرسانی شد",
        });
      } else {
        await expensesStore.add({
          date: expenseDate.toISOString(),
          type: formData.type,
          amount,
          description: formData.description,
        });
        toast({
          title: "موفق",
          description: "هزینه جدید با موفقیت ثبت شد",
        });
      }

      setFormData({ type: "", amount: "", description: "" });
      setExpenseDate(new Date());
      setEditingExpense(null);
      await loadExpenses();
      refreshDashboard();
    } catch (error) {
      console.error('Error saving expense:', error);
      toast({
        title: "خطا",
        description: "خطا در ذخیره هزینه",
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

  const handleDelete = async (id: string) => {
    if (!confirm("آیا از حذف این هزینه اطمینان دارید؟")) {
      return;
    }

    try {
      await expensesStore.delete(id);
      toast({
        title: "موفق",
        description: "هزینه با موفقیت حذف شد",
      });
      await loadExpenses();
      refreshDashboard();
    } catch (error) {
      console.error('Error deleting expense:', error);
      toast({
        title: "خطا",
        description: "خطا در حذف هزینه",
        variant: "destructive",
      });
    }
  };

  const totalExpenses = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);

  return (
    <Layout>
      {isLoading && <LoadingOverlay message={loadingMessage} />}
      <div className="space-y-6 animate-fade-scale">
        <div className="flex flex-col sm:flex-row justify-between items-start gap-4 pb-2">
          <div className="space-y-1">
            <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-primary via-secondary to-primary bg-clip-text text-transparent bg-[length:200%_auto] animate-gradient">
              مدیریت هزینه‌ها
            </h1>
            <p className="text-muted-foreground/80 text-sm md:text-base">
              ثبت و مدیریت هزینه‌های کسب‌وکار
            </p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button
                onClick={() => {
                  setFormData({ type: "", amount: "", description: "" });
                  setExpenseDate(new Date());
                  setEditingExpense(null);
                }}
                className="gap-2 hover:scale-105 transition-all duration-200"
              >
                <Plus className="h-4 w-4" />
                ثبت هزینه جدید
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>
                  {editingExpense ? "ویرایش هزینه" : "ثبت هزینه جدید"}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="date">تاریخ هزینه</Label>
                  <JalaliDatePicker
                    value={expenseDate}
                    onChange={setExpenseDate}
                  />
                </div>

                <div>
                  <Label htmlFor="type">نوع هزینه</Label>
                  <Select
                    value={formData.type}
                    onValueChange={(value) =>
                      setFormData({ ...formData, type: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="انتخاب کنید" />
                    </SelectTrigger>
                    <SelectContent>
                      {EXPENSE_TYPES.map((type) => (
                        <SelectItem key={type} value={type}>
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="amount">مبلغ (تومان)</Label>
                  <Input
                    id="amount"
                    type="text"
                    value={formData.amount}
                    onChange={handleAmountChange}
                    placeholder="مثال: ۱,۰۰۰,۰۰۰"
                    dir="ltr"
                  />
                </div>

                <div>
                  <Label htmlFor="description">توضیحات</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    placeholder="توضیحات هزینه..."
                    rows={3}
                  />
                </div>

                <Button type="submit" className="w-full">
                  {editingExpense ? "بروزرسانی" : "ثبت هزینه"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* کارت آمار */}
        <Card className="relative overflow-hidden bg-card/80 backdrop-blur-sm hover:shadow-xl hover:scale-[1.02] transition-all duration-300 group">
          <div className="absolute inset-0 bg-gradient-to-br from-destructive/5 via-transparent to-destructive/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <CardHeader className="relative z-10">
            <CardTitle className="flex items-center gap-2">
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

        {/* فیلترها */}
        <Card className="relative overflow-hidden bg-card/80 backdrop-blur-sm hover:shadow-lg transition-shadow duration-300">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5" />
          <CardHeader className="relative z-10 pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <div className="h-1.5 w-1.5 rounded-full bg-gradient-to-r from-primary to-secondary" />
              فیلترها و جستجو
            </CardTitle>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="search" className="flex items-center gap-2 text-sm font-semibold">
                  <div className="p-1.5 rounded-md bg-primary/10">
                    <Filter className="h-3.5 w-3.5 text-primary" />
                  </div>
                  جستجو
                </Label>
                <Input
                  id="search"
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="جستجو در توضیحات و نوع..."
                  className="h-10 transition-all duration-200 focus:ring-2 focus:ring-primary/20"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="typeFilter" className="flex items-center gap-2 text-sm font-semibold">
                  <div className="p-1.5 rounded-md bg-secondary/10">
                    <Receipt className="h-3.5 w-3.5 text-secondary" />
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
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSearchQuery("");
                    setTypeFilter("all");
                  }}
                  className="gap-2 hover:bg-destructive/10 hover:text-destructive hover:border-destructive/50 hover:scale-105 transition-all duration-200"
                >
                  <Filter className="h-4 w-4 rotate-180" />
                  پاک کردن فیلترها
                </Button>
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
                    onClick={() => {
                      setSearchQuery("");
                      setTypeFilter("all");
                    }}
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
                          <Receipt className="h-4 w-4 text-destructive" />
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
                          onClick={() => handleDelete(expense.id)}
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
      </div>
    </Layout>
  );
}
