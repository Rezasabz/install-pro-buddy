import { useEffect, useState } from "react";
import { Loader2, Trash2, Database, Users, ShoppingCart, DollarSign, CheckCircle } from "lucide-react";

interface DeletingOverlayProps {
  isVisible: boolean;
}

const steps = [
  { icon: ShoppingCart, label: "حذف فروش‌ها و اقساط", delay: 0 },
  { icon: Users, label: "حذف مشتریان و شرکا", delay: 800 },
  { icon: DollarSign, label: "حذف تراکنش‌ها و هزینه‌ها", delay: 1600 },
  { icon: Database, label: "پاکسازی دیتابیس", delay: 2400 },
  { icon: CheckCircle, label: "تکمیل شد!", delay: 3200 },
];

export function DeletingOverlay({ isVisible }: DeletingOverlayProps) {
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    if (!isVisible) {
      setCurrentStep(0);
      return;
    }

    const timers = steps.map((step, index) => {
      return setTimeout(() => {
        setCurrentStep(index);
      }, step.delay);
    });

    return () => {
      timers.forEach(timer => clearTimeout(timer));
    };
  }, [isVisible]);

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 overflow-y-auto">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60" />
      
      {/* Card - Simple white background */}
      <div className="relative z-10 w-full max-w-sm sm:max-w-md my-auto">
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-xl max-h-[85vh] overflow-y-auto">
          {/* Content */}
          <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
            {/* Icon with animation */}
            <div className="flex justify-center">
              <div className="relative">
                <div className="absolute inset-0 bg-red-500/20 rounded-full blur-xl animate-pulse" />
                <div className="relative flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-br from-red-500/20 to-pink-500/20 border-2 border-red-500/30">
                  <Trash2 className="w-8 h-8 sm:w-10 sm:h-10 text-red-500 animate-bounce" />
                </div>
              </div>
            </div>

            {/* Title */}
            <div className="text-center space-y-1 sm:space-y-2">
              <h2 className="text-xl sm:text-2xl font-bold text-foreground">
                در حال پاک کردن...
              </h2>
              <p className="text-xs sm:text-sm text-muted-foreground">
                لطفاً صبر کنید، این فرآیند چند لحظه طول می‌کشد
              </p>
            </div>

            {/* Progress steps */}
            <div className="space-y-2 sm:space-y-3">
              {steps.map((step, index) => {
                const Icon = step.icon;
                const isActive = index === currentStep;
                const isCompleted = index < currentStep;
                
                return (
                  <div
                    key={index}
                    className={`flex items-center gap-2 sm:gap-3 p-2 sm:p-3 rounded-lg sm:rounded-xl transition-all duration-500 ${
                      isActive
                        ? "bg-red-500/10 scale-105 shadow-lg border border-red-500/20"
                        : isCompleted
                        ? "bg-green-500/10 border border-green-500/20"
                        : "bg-muted/50 border border-border/50"
                    }`}
                  >
                    <div
                      className={`flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-lg transition-all duration-500 ${
                        isActive
                          ? "bg-red-500/20 text-red-500 animate-pulse"
                          : isCompleted
                          ? "bg-green-500/20 text-green-500"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {isActive ? (
                        <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
                      ) : (
                        <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
                      )}
                    </div>
                    <span
                      className={`flex-1 text-xs sm:text-sm font-medium transition-all duration-500 ${
                        isActive
                          ? "text-foreground"
                          : isCompleted
                          ? "text-green-500"
                          : "text-muted-foreground"
                      }`}
                    >
                      {step.label}
                    </span>
                    {isCompleted && (
                      <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-green-500 animate-in zoom-in duration-300" />
                    )}
                  </div>
                );
              })}
            </div>

            {/* Progress bar */}
            <div className="relative h-1.5 sm:h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="absolute inset-y-0 left-0 bg-gradient-to-r from-red-500 via-orange-500 to-pink-500 rounded-full transition-all duration-500 ease-out"
                style={{
                  width: `${((currentStep + 1) / steps.length) * 100}%`,
                }}
              />
            </div>

            {/* Warning text */}
            <div className="flex items-start gap-2 p-2 sm:p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/30">
              <div className="flex-shrink-0 w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-yellow-500/20 flex items-center justify-center mt-0.5">
                <span className="text-yellow-500 text-xs font-bold">!</span>
              </div>
              <p className="text-xs text-yellow-600 dark:text-yellow-400 leading-relaxed">
                این عملیات غیرقابل بازگشت است. تمام داده‌های کسب‌وکار شما پاک خواهند شد.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
