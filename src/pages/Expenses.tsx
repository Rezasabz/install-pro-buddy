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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const amount = parseFloat(formData.amount);
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
      amount: expense.amount.toString(),
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
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">مدیریت هزینه‌ها</h1>
            <p className="text-muted-foreground">
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
              >
                <Plus className="ml-2 h-4 w-4" />
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
                    type="number"
                    value={formData.amount}
                    onChange={(e) =>
                      setFormData({ ...formData, amount: e.target.value })
                    }
                    placeholder="مثال: ۱۰۰۰۰۰۰"
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
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingDown className="h-5 w-5" />
              مجموع هزینه‌ها
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-destructive">
              {formatCurrency(totalExpenses)}
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              {toPersianDigits(filteredExpenses.length)} هزینه ثبت شده
            </p>
          </CardContent>
        </Card>

        {/* فیلترها */}
        <Card>
          <CardContent className="pt-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label htmlFor="search">جستجو</Label>
                <Input
                  id="search"
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="جستجو در توضیحات..."
                />
              </div>
              <div>
                <Label htmlFor="typeFilter">فیلتر بر اساس نوع</Label>
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">همه</SelectItem>
                    {EXPENSE_TYPES.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* لیست هزینه‌ها */}
        <div className="space-y-4">
          {filteredExpenses.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                هیچ هزینه‌ای ثبت نشده است
              </CardContent>
            </Card>
          ) : (
            filteredExpenses.map((expense) => (
              <Card key={expense.id} className="hover:shadow-lg transition-shadow">
                <CardContent className="pt-6">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Receipt className="h-4 w-4 text-muted-foreground" />
                        <span className="font-semibold">{expense.type}</span>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">
                        {expense.description}
                      </p>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {toJalaliDate(expense.date)}
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <div className="text-xl font-bold text-destructive">
                        {formatCurrency(expense.amount)}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(expense)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(expense.id)}
                        >
                          <Trash2 className="h-4 w-4" />
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
