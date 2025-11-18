import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { UserPlus, Smartphone } from "lucide-react";

export default function Register() {
  const navigate = useNavigate();
  const { register } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    fullName: "",
    mobile: "",
    password: "",
    confirmPassword: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // اعتبارسنجی
    if (!formData.fullName || !formData.mobile || !formData.password || !formData.confirmPassword) {
      toast({
        title: "خطا",
        description: "لطفاً تمام فیلدها را پر کنید",
        variant: "destructive",
      });
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      toast({
        title: "خطا",
        description: "رمز عبور و تکرار آن یکسان نیستند",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const result = await register(formData.fullName, formData.mobile, formData.password);

      if (result.success) {
        toast({
          title: "موفق",
          description: result.message,
        });
        navigate("/");
      } else {
        toast({
          title: "خطا",
          description: result.message,
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "خطا",
        description: "خطا در ثبت‌نام. لطفاً دوباره تلاش کنید",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 via-background to-secondary/10 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-primary/10 rounded-full">
              <Smartphone className="h-8 w-8 text-primary" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold">ثبت‌نام</CardTitle>
          <CardDescription>
            برای استفاده از سیستم، ابتدا ثبت‌نام کنید
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="fullName">نام و نام خانوادگی</Label>
              <Input
                id="fullName"
                type="text"
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                placeholder="مثال: علی احمدی"
                disabled={isLoading}
                autoComplete="name"
              />
            </div>

            <div>
              <Label htmlFor="mobile">شماره موبایل</Label>
              <Input
                id="mobile"
                type="tel"
                value={formData.mobile}
                onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                placeholder="مثال: ۰۹۱۲۳۴۵۶۷۸۹"
                disabled={isLoading}
                autoComplete="tel"
                dir="ltr"
              />
              <p className="text-xs text-muted-foreground mt-1">
                این شماره به عنوان نام کاربری شما استفاده می‌شود
              </p>
            </div>

            <div>
              <Label htmlFor="password">رمز عبور</Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="حداقل ۶ کاراکتر"
                disabled={isLoading}
                autoComplete="new-password"
              />
            </div>

            <div>
              <Label htmlFor="confirmPassword">تکرار رمز عبور</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                placeholder="تکرار رمز عبور"
                disabled={isLoading}
                autoComplete="new-password"
              />
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              <UserPlus className="ml-2 h-4 w-4" />
              {isLoading ? "در حال ثبت‌نام..." : "ثبت‌نام"}
            </Button>

            <div className="text-center text-sm">
              <span className="text-muted-foreground">قبلاً ثبت‌نام کرده‌اید؟ </span>
              <Link to="/login" className="text-primary hover:underline">
                ورود
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
