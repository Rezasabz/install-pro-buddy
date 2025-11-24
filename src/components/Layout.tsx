import { ReactNode, useState } from "react";
import { Link, useLocation } from "react-router-dom";
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
import { cn } from "@/lib/utils";

interface LayoutProps {
  children: ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const { user, logout } = useAuth();
  const location = useLocation();

  const handleSignOut = () => {
    logout();
  };

  const navigation = [
    { name: "داشبورد", href: "/", icon: LayoutDashboard },
    { name: "شرکا", href: "/partners", icon: Users },
    { name: "سرمایه‌گذاران", href: "/investors", icon: DollarSign },
    { name: "موجودی", href: "/inventory", icon: Smartphone },
    { name: "فروش", href: "/sales", icon: ShoppingCart },
    { name: "مشتریان", href: "/customers", icon: Users },
    { name: "اقساط", href: "/installments", icon: DollarSign },
    { name: "هزینه‌ها", href: "/expenses", icon: Receipt },
  ];

  const isActive = (href: string) => {
    if (href === "/") {
      return location.pathname === "/";
    }
    return location.pathname.startsWith(href);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header with Glassmorphism */}
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60 shadow-sm">
        <div className="flex h-16 items-center px-4 md:px-6 lg:px-8">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-lg blur-sm group-hover:blur-md transition-all duration-300" />
              <Smartphone className="relative h-7 w-7 text-primary group-hover:scale-110 transition-transform duration-300" />
            </div>
            <span className="hidden sm:inline-block text-lg font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              مدیریت فروش موبایل
            </span>
          </Link>
          
          {/* Desktop Navigation */}
          <nav className="ml-auto hidden lg:flex items-center gap-1.5">
            {navigation.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);
              return (
                <Link key={item.name} to={item.href}>
                  <Button
                    variant="ghost"
                    size="sm"
                    className={cn(
                      "gap-2 h-9 px-4 relative transition-all duration-200",
                      "hover:bg-accent/50 hover:scale-105",
                      active && "bg-primary/10 text-primary font-semibold"
                    )}
                  >
                    <Icon className={cn(
                      "h-4 w-4 transition-transform duration-200",
                      active && "scale-110"
                    )} />
                    <span>{item.name}</span>
                    {active && (
                      <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1/2 h-0.5 bg-gradient-to-r from-primary to-secondary rounded-full" />
                    )}
                  </Button>
                </Link>
              );
            })}
            
            {/* User Badge */}
            {user && (
              <div className="flex items-center gap-2.5 px-3.5 py-1.5 mx-2 bg-gradient-to-r from-primary/10 to-secondary/10 rounded-full border border-primary/20 backdrop-blur-sm">
                <div className="h-7 w-7 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                  <UserIcon className="h-4 w-4 text-white" />
                </div>
                <span className="text-sm font-medium hidden xl:block">{user.fullName}</span>
              </div>
            )}
            
            {/* Theme Toggle */}
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              className="h-9 w-9 rounded-full hover:bg-accent/50 hover:scale-110 transition-all duration-200"
            >
              {theme === "light" ? (
                <Moon className="h-4 w-4" />
              ) : (
                <Sun className="h-4 w-4" />
              )}
            </Button>
            
            {/* Logout Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={handleSignOut}
              className="gap-2 h-9 px-4 hover:bg-destructive/10 hover:text-destructive hover:border-destructive/50 transition-all duration-200"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden xl:inline">خروج</span>
            </Button>
          </nav>

          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            size="icon"
            className="ml-auto lg:hidden h-9 w-9 rounded-full"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? (
              <X className="h-5 w-5 transition-transform duration-200 rotate-90" />
            ) : (
              <Menu className="h-5 w-5 transition-transform duration-200" />
            )}
          </Button>
        </div>

        {/* Mobile menu with slide animation */}
        <div
          className={cn(
            "lg:hidden overflow-hidden transition-all duration-300 ease-in-out",
            mobileMenuOpen ? "max-h-[600px] opacity-100" : "max-h-0 opacity-0"
          )}
        >
          <div className="border-t border-border/40 bg-background/95 backdrop-blur-xl px-4 py-3">
            <nav className="flex flex-col gap-1.5">
              {navigation.map((item, index) => {
                const Icon = item.icon;
                const active = isActive(item.href);
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className="animate-slide-in"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <Button
                      variant="ghost"
                      className={cn(
                        "w-full justify-start gap-3 h-11 rounded-lg transition-all duration-200",
                        "hover:bg-accent/50 hover:scale-[1.02]",
                        active && "bg-primary/10 text-primary font-semibold border-r-2 border-primary"
                      )}
                    >
                      <Icon className={cn(
                        "h-5 w-5",
                        active && "scale-110"
                      )} />
                      <span className="text-base">{item.name}</span>
                    </Button>
                  </Link>
                );
              })}
              
              <div className="border-t border-border/40 my-2" />
              
              {/* Mobile User Info */}
              {user && (
                <div className="flex items-center gap-3 px-3 py-2.5 bg-gradient-to-r from-primary/10 to-secondary/10 rounded-lg mb-1.5">
                  <div className="h-9 w-9 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                    <UserIcon className="h-5 w-5 text-white" />
                  </div>
                  <span className="text-sm font-medium">{user.fullName}</span>
                </div>
              )}
              
              {/* Mobile Theme Toggle */}
              <Button
                variant="ghost"
                onClick={toggleTheme}
                className="w-full justify-start gap-3 h-11 rounded-lg hover:bg-accent/50 transition-all duration-200"
              >
                {theme === "light" ? (
                  <>
                    <Moon className="h-5 w-5" />
                    <span className="text-base">تم تیره</span>
                  </>
                ) : (
                  <>
                    <Sun className="h-5 w-5" />
                    <span className="text-base">تم روشن</span>
                  </>
                )}
              </Button>
              
              {/* Mobile Logout */}
              <Button
                variant="outline"
                onClick={handleSignOut}
                className="w-full justify-start gap-3 h-11 rounded-lg hover:bg-destructive/10 hover:text-destructive hover:border-destructive/50 transition-all duration-200"
              >
                <LogOut className="h-5 w-5" />
                <span className="text-base">خروج</span>
              </Button>
            </nav>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="container mx-auto p-4 md:p-6">{children}</main>
    </div>
  );
};

export default Layout;
