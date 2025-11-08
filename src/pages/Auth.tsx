import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Smartphone } from "lucide-react";

const Auth = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // بررسی اینکه آیا قبلاً وارد شده
    const isLoggedIn = localStorage.getItem("isLoggedIn");
    if (isLoggedIn === "true") {
      navigate("/");
    }
  }, [navigate]);

  const handleLogin = () => {
    // برای MVP، فقط یک ورود ساده
    localStorage.setItem("isLoggedIn", "true");
    navigate("/");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="bg-primary text-primary-foreground p-3 rounded-lg">
              <Smartphone className="h-8 w-8" />
            </div>
          </div>
          <CardTitle className="text-2xl">مدیریت فروش موبایل</CardTitle>
          <CardDescription>
            سیستم حرفه‌ای مدیریت فروش اقساطی موبایل
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center text-sm text-muted-foreground">
            <p>ویژگی‌های سیستم:</p>
            <ul className="mt-2 space-y-1">
              <li>✓ مدیریت شرکا و سرمایه</li>
              <li>✓ کنترل موجودی گوشی‌ها</li>
              <li>✓ ثبت فروش اقساطی</li>
              <li>✓ پیگیری پرداخت اقساط</li>
              <li>✓ محاسبه خودکار سود</li>
            </ul>
          </div>
          <Button onClick={handleLogin} className="w-full" size="lg">
            ورود به سیستم
          </Button>
          <p className="text-xs text-center text-muted-foreground">
            نسخه MVP - داده‌ها در مرورگر ذخیره می‌شوند
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;
