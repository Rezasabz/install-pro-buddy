import { ReactNode, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard,
  Users,
  ShoppingCart,
  Smartphone,
  DollarSign,
  LogOut,
  Menu,
  X,
  Moon,
  Sun,
  User as UserIcon,
  Receipt,
} from "lucide-react";
import { useTheme } from "@/hooks/useTheme";
import { useAuth } from "@/contexts/AuthContext";

interface LayoutProps {
  children: ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const { user, logout } = useAuth();

  const handleSignOut = () => {
    logout();
  };

  const navigation = [
    { name: "داشبورد", href: "/", icon: LayoutDashboard },
    { name: "شرکا", href: "/partners", icon: Users },
    { name: "موجودی", href: "/inventory", icon: Smartphone },
    { name: "فروش", href: "/sales", icon: ShoppingCart },
    { name: "مشتریان", href: "/customers", icon: Users },
    { name: "اقساط", href: "/installments", icon: DollarSign },
    { name: "هزینه‌ها", href: "/expenses", icon: Receipt },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-card">
        <div className="flex h-16 items-center px-4 md:px-6">
          <div className="flex items-center gap-2 font-semibold">
            <Smartphone className="h-6 w-6 text-primary" />
            <span className="hidden sm:inline-block">مدیریت فروش موبایل</span>
          </div>
          
          <nav className="ml-auto hidden md:flex items-center gap-4">
            {navigation.map((item) => {
              const Icon = item.icon;
              return (
                <Link key={item.name} to={item.href}>
                  <Button variant="ghost" size="sm" className="gap-2">
                    <Icon className="h-4 w-4" />
                    {item.name}
                  </Button>
                </Link>
              );
            })}
            {user && (
              <div className="flex items-center gap-2 px-3 py-1 bg-muted rounded-md">
                <UserIcon className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">{user.fullName}</span>
              </div>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              className="h-9 w-9"
            >
              {theme === "light" ? (
                <Moon className="h-4 w-4" />
              ) : (
                <Sun className="h-4 w-4" />
              )}
            </Button>
            <Button variant="outline" size="sm" onClick={handleSignOut} className="gap-2">
              <LogOut className="h-4 w-4" />
              خروج
            </Button>
          </nav>

          <Button
            variant="ghost"
            size="icon"
            className="ml-auto md:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X /> : <Menu />}
          </Button>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="border-t md:hidden">
            <nav className="flex flex-col p-4 space-y-2">
              {navigation.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <Button variant="ghost" className="w-full justify-start gap-2">
                      <Icon className="h-4 w-4" />
                      {item.name}
                    </Button>
                  </Link>
                );
              })}
              <Button
                variant="ghost"
                onClick={toggleTheme}
                className="w-full justify-start gap-2"
              >
                {theme === "light" ? (
                  <>
                    <Moon className="h-4 w-4" />
                    تم تیره
                  </>
                ) : (
                  <>
                    <Sun className="h-4 w-4" />
                    تم روشن
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                onClick={handleSignOut}
                className="w-full justify-start gap-2"
              >
                <LogOut className="h-4 w-4" />
                خروج
              </Button>
            </nav>
          </div>
        )}
      </header>

      {/* Main content */}
      <main className="container mx-auto p-4 md:p-6">{children}</main>
    </div>
  );
};

export default Layout;
