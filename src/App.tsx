import { useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import Auth from "./pages/Auth";
import Partners from "./pages/Partners";
import Inventory from "./pages/Inventory";
import Sales from "./pages/Sales";
import Customers from "./pages/Customers";
import Installments from "./pages/Installments";
import NotFound from "./pages/NotFound";
import { needsMigration, migrateOldData } from "./lib/migration";

const queryClient = new QueryClient();

const App = () => {
  useEffect(() => {
    // بررسی و تبدیل داده‌های قدیمی
    if (needsMigration()) {
      console.log('🔄 در حال تبدیل داده‌های قدیمی...');
      const migrated = migrateOldData();
      if (migrated) {
        console.log('✅ داده‌ها با موفقیت تبدیل شدند');
        // رفرش صفحه برای نمایش صحیح
        setTimeout(() => {
          window.location.reload();
        }, 500);
      }
    }
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/partners" element={<Partners />} />
            <Route path="/inventory" element={<Inventory />} />
            <Route path="/sales" element={<Sales />} />
            <Route path="/customers" element={<Customers />} />
            <Route path="/installments" element={<Installments />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
