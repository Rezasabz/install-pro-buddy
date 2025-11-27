import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { LogIn, Smartphone } from "lucide-react";

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    mobile: "",
    password: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.mobile || !formData.password) {
      toast({
        title: "خطا",
        description: "لطفاً شماره موبایل و رمز عبور را وارد کنید",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const result = await login(formData.mobile, formData.password);

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
        description: "خطا در ورود. لطفاً دوباره تلاش کنید",
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
          <CardTitle className="text-2xl font-bold">ورود به سیستم</CardTitle>
          <CardDescription>
            با شماره موبایل و رمز عبور خود وارد شوید
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
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
            </div>

            <div>
              <Label htmlFor="password">رمز عبور</Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="رمز عبور"
                disabled={isLoading}
                autoComplete="current-password"
              />
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              <LogIn className="ml-2 h-4 w-4" />
              {isLoading ? "در حال ورود..." : "ورود"}
            </Button>

            <div className="text-center text-sm text-muted-foreground mt-4">
              برای دریافت حساب کاربری با مدیر سیستم تماس بگیرید
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
