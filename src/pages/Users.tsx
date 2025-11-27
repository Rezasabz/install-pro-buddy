import { useState, useEffect } from "react";
import Layout from "@/components/Layout";
import { LoadingOverlay } from "@/components/LoadingOverlay";
import { useAuth } from "@/contexts/AuthContext";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { partnersStore, Partner } from "@/lib/storeProvider";
import { formatCurrency } from "@/lib/persian";
import { Plus, Edit, Trash2, Users as UsersIcon, Shield, UserCheck, UserX, AlertCircle, Key, Phone, User as UserIcon, Briefcase } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

interface User {
  id: string;
  fullName: string;
  mobile: string;
  role: 'admin' | 'partner';
  partnerId?: string;
  isActive: boolean;
  createdAt: string;
}

const Users = () => {
  const { user: currentUser } = useAuth();
  const navigate = useNavigate();
  const [users, setUsers] = useState<User[]>([]);
  const [partners, setPartners] = useState<Partner[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; userId: string; userName: string }>({ 
    open: false, 
    userId: '', 
    userName: '' 
  });
  const [formData, setFormData] = useState({
    fullName: "",
    mobile: "",
    password: "",
    role: "partner" as 'admin' | 'partner',
    partnerId: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("");
  const { toast } = useToast();

  // Check if current user is admin
  useEffect(() => {
    if (currentUser?.role !== 'admin') {
      toast({
        title: "دسترسی محدود",
        description: "شما به این بخش دسترسی ندارید",
        variant: "destructive",
      });
      navigate('/');
    }
  }, [currentUser, navigate, toast]);

  const loadUsers = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/users/`);
      if (!response.ok) throw new Error('Failed to fetch users');
      const data = await response.json();
      setUsers(data);
    } catch (error) {
      console.error('Error loading users:', error);
      toast({
        title: "خطا",
        description: "خطا در بارگذاری کاربران",
        variant: "destructive",
      });
    }
  };

  const loadPartners = async () => {
    try {
      const data = await partnersStore.getAll();
      setPartners(data);
    } catch (error) {
      console.error('Error loading partners:', error);
    }
  };

  useEffect(() => {
    if (currentUser?.role === 'admin') {
      loadUsers();
      loadPartners();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.fullName || !formData.mobile) {
      toast({
        title: "خطا",
        description: "لطفاً تمام فیلدهای الزامی را پر کنید",
        variant: "destructive",
      });
      return;
    }

    if (!editingUser && !formData.password) {
      toast({
        title: "خطا",
        description: "لطفاً رمز عبور را وارد کنید",
        variant: "destructive",
      });
      return;
    }

    if (formData.role === 'partner' && !formData.partnerId) {
      toast({
        title: "خطا",
        description: "لطفاً شریک مرتبط را انتخاب کنید",
        variant: "destructive",
      });
      return;
    }

    setIsDialogOpen(false);
    setIsLoading(true);
    setLoadingMessage(editingUser ? "در حال بروزرسانی کاربر..." : "در حال افزودن کاربر...");

    try {
      const payload: Record<string, string> = {
        fullName: formData.fullName,
        mobile: formData.mobile,
        role: formData.role,
      };

      if (formData.password) {
        payload.password = formData.password;
      }

      if (formData.role === 'partner' && formData.partnerId) {
        payload.partnerId = formData.partnerId;
      }

      if (editingUser) {
        const response = await fetch(`${API_BASE_URL}/api/users/${editingUser.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.detail || 'Failed to update user');
        }

        toast({
          title: "موفق",
          description: "کاربر با موفقیت بروزرسانی شد",
        });
      } else {
        const response = await fetch(`${API_BASE_URL}/api/users/`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.detail || 'Failed to create user');
        }

        toast({
          title: "موفق",
          description: "کاربر جدید با موفقیت اضافه شد",
        });
      }

      setFormData({
        fullName: "",
        mobile: "",
        password: "",
        role: "partner",
        partnerId: "",
      });
      setEditingUser(null);
      await loadUsers();
    } catch (error) {
      console.error('Error saving user:', error);
      const errorMessage = error instanceof Error ? error.message : "خطا در ذخیره کاربر";
      toast({
        title: "خطا",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      setLoadingMessage("");
    }
  };

  const handleEdit = (user: User) => {
    setEditingUser(user);
    setFormData({
      fullName: user.fullName,
      mobile: user.mobile,
      password: "",
      role: user.role,
      partnerId: user.partnerId || "",
    });
    setIsDialogOpen(true);
  };

  const handleToggleActive = async (user: User) => {
    setIsLoading(true);
    setLoadingMessage(user.isActive ? "در حال غیرفعال کردن..." : "در حال فعال کردن...");

    try {
      const response = await fetch(`${API_BASE_URL}/api/users/${user.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !user.isActive }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Failed to update user');
      }

      toast({
        title: "موفق",
        description: user.isActive ? "کاربر غیرفعال شد" : "کاربر فعال شد",
      });

      await loadUsers();
    } catch (error) {
      console.error('Error toggling user status:', error);
      const errorMessage = error instanceof Error ? error.message : "خطا در تغییر وضعیت کاربر";
      toast({
        title: "خطا",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      setLoadingMessage("");
    }
  };

  const handleDelete = (id: string, user: User) => {
    setDeleteDialog({ open: true, userId: id, userName: user.fullName });
  };

  const confirmDelete = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/users/${deleteDialog.userId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Failed to delete user');
      }

      toast({
        title: "موفق",
        description: "کاربر با موفقیت حذف شد",
      });
      setDeleteDialog({ open: false, userId: '', userName: '' });
      await loadUsers();
    } catch (error) {
      console.error('Error deleting user:', error);
      const errorMessage = error instanceof Error ? error.message : "خطا در حذف کاربر";
      toast({
        title: "خطا",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  const getPartnerName = (partnerId?: string) => {
    if (!partnerId) return '-';
    const partner = partners.find(p => p.id === partnerId);
    return partner?.name || '-';
  };

  const adminUsers = users.filter(u => u.role === 'admin');
  const partnerUsers = users.filter(u => u.role === 'partner');
  const activeUsers = users.filter(u => u.isActive);

  if (currentUser?.role !== 'admin') {
    return null;
  }

  return (
    <Layout>
      {isLoading && <LoadingOverlay message={loadingMessage} />}
      <div className="space-y-6 animate-fade-scale">
        <div className="flex flex-col sm:flex-row justify-between items-start gap-4 pb-2">
          <div className="space-y-1">
            <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-primary via-secondary to-primary bg-clip-text text-transparent bg-[length:200%_auto] animate-gradient">
              مدیریت کاربران
            </h1>
            <p className="text-muted-foreground/80 text-sm md:text-base">
              مدیریت کاربران و دسترسی‌های سیستم
            </p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button 
                onClick={() => {
                  setEditingUser(null);
                  setFormData({
                    fullName: "",
                    mobile: "",
                    password: "",
                    role: "partner",
                    partnerId: "",
                  });
                }}
                className="gap-2 hover:scale-105 transition-all duration-200"
              >
                <Plus className="h-4 w-4" />
                افزودن کاربر
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle className="text-2xl font-bold">
                  {editingUser ? "ویرایش کاربر" : "افزودن کاربر جدید"}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-6 mt-4">
                <div className="space-y-4 p-4 rounded-lg bg-card border border-border/50">
                  <div className="flex items-center gap-2 mb-3">
                    <UserIcon className="h-5 w-5 text-primary" />
                    <h3 className="font-semibold text-lg">اطلاعات کاربر</h3>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="fullName">نام و نام خانوادگی *</Label>
                      <Input
                        id="fullName"
                        value={formData.fullName}
                        onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                        required
                        placeholder="مثال: علی احمدی"
                        className="h-10"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="mobile">شماره موبایل *</Label>
                      <Input
                        id="mobile"
                        value={formData.mobile}
                        onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                        required
                        placeholder="09123456789"
                        className="h-10"
                        dir="ltr"
                        maxLength={11}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="password">
                        رمز عبور {editingUser ? "(خالی بگذارید برای عدم تغییر)" : "*"}
                      </Label>
                      <Input
                        id="password"
                        type="password"
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        required={!editingUser}
                        placeholder="حداقل 4 کاراکتر"
                        className="h-10"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="role">نقش کاربری *</Label>
                      <Select
                        value={formData.role}
                        onValueChange={(value: 'admin' | 'partner') => {
                          setFormData({ ...formData, role: value, partnerId: value === 'admin' ? '' : formData.partnerId });
                        }}
                      >
                        <SelectTrigger className="h-10">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="admin">مدیر سیستم</SelectItem>
                          <SelectItem value="partner">شریک</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {formData.role === 'partner' && (
                      <div className="space-y-2 md:col-span-2">
                        <Label htmlFor="partnerId">شریک مرتبط *</Label>
                        <Select
                          value={formData.partnerId}
                          onValueChange={(value) => setFormData({ ...formData, partnerId: value })}
                        >
                          <SelectTrigger className="h-10">
                            <SelectValue placeholder="انتخاب شریک" />
                          </SelectTrigger>
                          <SelectContent>
                            {partners.map((partner) => (
                              <SelectItem key={partner.id} value={partner.id}>
                                {partner.name} - سهم: {partner.share}%
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <Button
                    type="submit"
                    className="flex-1 h-12 text-base font-semibold bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90"
                  >
                    {editingUser ? "بروزرسانی کاربر" : "افزودن کاربر"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsDialogOpen(false)}
                    className="h-12 px-8"
                  >
                    انصراف
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* آمار */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="relative overflow-hidden bg-card/80 backdrop-blur-sm hover:shadow-xl hover:scale-[1.02] transition-all duration-300 group">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <CardHeader className="relative z-10">
              <CardTitle className="flex items-center gap-2 text-base">
                <UsersIcon className="h-5 w-5 text-primary" />
                کل کاربران
              </CardTitle>
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
                {users.length}
              </div>
              <p className="text-sm text-muted-foreground/70 mt-2">
                کاربر ثبت شده
              </p>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden bg-card/80 backdrop-blur-sm hover:shadow-xl hover:scale-[1.02] transition-all duration-300 group">
            <div className="absolute inset-0 bg-gradient-to-br from-success/5 via-transparent to-success/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <CardHeader className="relative z-10">
              <CardTitle className="flex items-center gap-2 text-base">
                <UserCheck className="h-5 w-5 text-success" />
                کاربران فعال
              </CardTitle>
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="text-3xl font-bold bg-gradient-to-r from-success to-success/80 bg-clip-text text-transparent">
                {activeUsers.length}
              </div>
              <p className="text-sm text-muted-foreground/70 mt-2">
                کاربر فعال
              </p>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden bg-card/80 backdrop-blur-sm hover:shadow-xl hover:scale-[1.02] transition-all duration-300 group">
            <div className="absolute inset-0 bg-gradient-to-br from-warning/5 via-transparent to-warning/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <CardHeader className="relative z-10">
              <CardTitle className="text-base flex items-center gap-2">
                <Shield className="h-5 w-5 text-warning" />
                مدیران
              </CardTitle>
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="text-3xl font-bold bg-gradient-to-r from-warning to-warning/80 bg-clip-text text-transparent">
                {adminUsers.length}
              </div>
              <p className="text-sm text-muted-foreground/70 mt-2">
                مدیر سیستم
              </p>
            </CardContent>
          </Card>
        </div>

        {/* لیست کاربران */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {users.map((user, index) => (
            <Card 
              key={user.id} 
              className="group relative overflow-hidden bg-gradient-to-br from-card via-card to-card/80 border-2 border-border/50 hover:border-primary/30 transition-all duration-500 hover:shadow-2xl hover:scale-[1.02] animate-slide-in"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              
              <CardHeader className="relative z-10 pb-3">
                <div className="flex justify-between items-start gap-3">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "p-3 rounded-xl transition-all duration-300",
                      user.role === 'admin' 
                        ? "bg-gradient-to-br from-warning/10 to-orange-500/10 group-hover:from-warning/20 group-hover:to-orange-500/20" 
                        : "bg-gradient-to-br from-primary/10 to-secondary/10 group-hover:from-primary/20 group-hover:to-secondary/20"
                    )}>
                      {user.role === 'admin' ? (
                        <Shield className="h-6 w-6 text-warning" />
                      ) : (
                        <Briefcase className="h-6 w-6 text-primary" />
                      )}
                    </div>
                    <div>
                      <h3 className="font-bold text-lg group-hover:text-primary transition-colors duration-300">
                        {user.fullName}
                      </h3>
                      <Badge 
                        variant={user.role === 'admin' ? 'default' : 'secondary'}
                        className={cn(
                          "mt-1",
                          user.role === 'admin' 
                            ? "bg-warning/10 text-warning border-warning/20" 
                            : "bg-primary/10 text-primary border-primary/20"
                        )}
                      >
                        {user.role === 'admin' ? 'مدیر سیستم' : 'شریک'}
                      </Badge>
                    </div>
                  </div>
                  
                  <Badge 
                    variant={user.isActive ? 'default' : 'secondary'}
                    className={cn(
                      "shrink-0",
                      user.isActive 
                        ? "bg-success/10 text-success border-success/20" 
                        : "bg-destructive/10 text-destructive border-destructive/20"
                    )}
                  >
                    {user.isActive ? 'فعال' : 'غیرفعال'}
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="space-y-3 relative z-10">
                <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/50">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-mono">{user.mobile}</span>
                </div>

                {user.role === 'partner' && user.partnerId && (
                  <div className="p-3 rounded-lg bg-gradient-to-r from-primary/5 to-secondary/5 border border-primary/10">
                    <div className="flex items-center gap-2 mb-1">
                      <Briefcase className="h-4 w-4 text-primary" />
                      <span className="text-xs font-medium text-muted-foreground">شریک مرتبط</span>
                    </div>
                    <p className="text-sm font-bold text-primary">{getPartnerName(user.partnerId)}</p>
                  </div>
                )}

                <div className="flex gap-2 pt-3">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 gap-2 hover:bg-primary/10 hover:border-primary/50"
                    onClick={() => handleEdit(user)}
                  >
                    <Edit className="h-3 w-3" />
                    ویرایش
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className={cn(
                      "gap-2",
                      user.isActive 
                        ? "hover:bg-destructive/10 hover:border-destructive/50 text-destructive" 
                        : "hover:bg-success/10 hover:border-success/50 text-success"
                    )}
                    onClick={() => handleToggleActive(user)}
                  >
                    {user.isActive ? <UserX className="h-3 w-3" /> : <UserCheck className="h-3 w-3" />}
                    {user.isActive ? 'غیرفعال' : 'فعال'}
                  </Button>
                  {user.role !== 'admin' || adminUsers.length > 1 ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(user.id, user)}
                      className="hover:bg-destructive/10 hover:border-destructive/50"
                    >
                      <Trash2 className="h-3 w-3 text-destructive" />
                    </Button>
                  ) : null}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {users.length === 0 && (
          <Card className="relative overflow-hidden bg-card/80 backdrop-blur-sm">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5" />
            <CardContent className="flex flex-col items-center justify-center py-12 relative z-10">
              <UsersIcon className="h-12 w-12 text-primary mb-4" />
              <p className="text-muted-foreground/70 text-center">
                هنوز کاربری ثبت نشده است
              </p>
            </CardContent>
          </Card>
        )}

        {/* Delete Dialog */}
        <AlertDialog open={deleteDialog.open} onOpenChange={(open) => setDeleteDialog({ ...deleteDialog, open })}>
          <AlertDialogContent className="max-w-lg p-0 gap-0 overflow-hidden border-destructive/20">
            <div className="relative bg-gradient-to-br from-destructive via-destructive/90 to-destructive/80 p-6">
              <div className="absolute inset-0 bg-black/10" />
              <div className="relative z-10 flex flex-col items-center text-center space-y-4">
                <div className="p-4 rounded-full bg-white/10 backdrop-blur-sm border-2 border-white/20">
                  <Trash2 className="h-10 w-10 text-white" />
                </div>
                <AlertDialogTitle className="text-2xl font-bold text-white">
                  حذف کاربر
                </AlertDialogTitle>
              </div>
            </div>

            <div className="p-6 space-y-4 bg-background">
              <AlertDialogDescription className="text-right space-y-4">
                <div className="p-4 rounded-lg bg-muted/50 border border-border/50">
                  <p className="text-base font-semibold text-foreground mb-2">
                    کاربر مورد نظر:
                  </p>
                  <p className="text-lg font-bold text-primary">
                    {deleteDialog.userName}
                  </p>
                </div>
                
                <div className="p-4 rounded-lg bg-destructive/5 border border-destructive/20">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
                    <p className="text-sm text-muted-foreground">
                      این عمل غیرقابل بازگشت است. آیا از حذف این کاربر اطمینان دارید؟
                    </p>
                  </div>
                </div>
              </AlertDialogDescription>
            </div>

            <AlertDialogFooter className="p-6 pt-0 gap-3 bg-background">
              <AlertDialogCancel className="flex-1">انصراف</AlertDialogCancel>
              <AlertDialogAction
                onClick={confirmDelete}
                className="flex-1 bg-destructive hover:bg-destructive/90"
              >
                حذف کاربر
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </Layout>
  );
};

export default Users;
