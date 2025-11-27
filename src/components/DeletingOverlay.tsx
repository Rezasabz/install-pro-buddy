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
    <div className="fixed inset-0 z-[9999] flex items-center justify-center">
      {/* Backdrop with blur */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-md animate-in fade-in duration-300" />
      
      {/* Glass card */}
      <div className="relative z-10 w-full max-w-md mx-4 animate-in zoom-in-95 duration-300">
        <div className="relative overflow-hidden rounded-3xl border border-white/20 bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl shadow-2xl">
          {/* Animated gradient background */}
          <div className="absolute inset-0 bg-gradient-to-br from-red-500/10 via-orange-500/10 to-pink-500/10 animate-pulse" />
          
          {/* Content */}
          <div className="relative p-8 space-y-8">
            {/* Icon with animation */}
            <div className="flex justify-center">
              <div className="relative">
                <div className="absolute inset-0 bg-red-500/20 rounded-full blur-xl animate-pulse" />
                <div className="relative flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-red-500/20 to-pink-500/20 border border-red-500/30">
                  <Trash2 className="w-10 h-10 text-red-500 animate-bounce" />
                </div>
              </div>
            </div>

            {/* Title */}
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-bold text-white">
                در حال پاک کردن...
              </h2>
              <p className="text-sm text-white/70">
                لطفاً صبر کنید، این فرآیند چند لحظه طول می‌کشد
              </p>
            </div>

            {/* Progress steps */}
            <div className="space-y-3">
              {steps.map((step, index) => {
                const Icon = step.icon;
                const isActive = index === currentStep;
                const isCompleted = index < currentStep;
                
                return (
                  <div
                    key={index}
                    className={`flex items-center gap-3 p-3 rounded-xl transition-all duration-500 ${
                      isActive
                        ? "bg-white/20 scale-105 shadow-lg"
                        : isCompleted
                        ? "bg-green-500/10"
                        : "bg-white/5"
                    }`}
                  >
                    <div
                      className={`flex items-center justify-center w-10 h-10 rounded-lg transition-all duration-500 ${
                        isActive
                          ? "bg-red-500/30 text-red-400 animate-pulse"
                          : isCompleted
                          ? "bg-green-500/30 text-green-400"
                          : "bg-white/10 text-white/40"
                      }`}
                    >
                      {isActive ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <Icon className="w-5 h-5" />
                      )}
                    </div>
                    <span
                      className={`flex-1 text-sm font-medium transition-all duration-500 ${
                        isActive
                          ? "text-white"
                          : isCompleted
                          ? "text-green-400"
                          : "text-white/50"
                      }`}
                    >
                      {step.label}
                    </span>
                    {isCompleted && (
                      <CheckCircle className="w-5 h-5 text-green-400 animate-in zoom-in duration-300" />
                    )}
                  </div>
                );
              })}
            </div>

            {/* Progress bar */}
            <div className="relative h-2 bg-white/10 rounded-full overflow-hidden">
              <div
                className="absolute inset-y-0 left-0 bg-gradient-to-r from-red-500 via-orange-500 to-pink-500 rounded-full transition-all duration-500 ease-out"
                style={{
                  width: `${((currentStep + 1) / steps.length) * 100}%`,
                }}
              />
            </div>

            {/* Warning text */}
            <div className="flex items-start gap-2 p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
              <div className="flex-shrink-0 w-5 h-5 rounded-full bg-yellow-500/20 flex items-center justify-center mt-0.5">
                <span className="text-yellow-500 text-xs font-bold">!</span>
              </div>
              <p className="text-xs text-yellow-200/90 leading-relaxed">
                این عملیات غیرقابل بازگشت است. تمام داده‌های کسب‌وکار شما پاک خواهند شد.
              </p>
            </div>
          </div>

          {/* Shimmer effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full animate-shimmer" />
        </div>
      </div>
    </div>
  );
}
