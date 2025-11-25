import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  dateToJalali,
  jalaliToGregorian,
  formatJalaliShort,
  jalaliMonthNames,
  getDaysInJalaliMonth,
  type JalaliDate,
} from '@/lib/jalali';
import { toPersianDigits } from '@/lib/persian';

interface JalaliDatePickerProps {
  value?: Date;
  onChange: (date: Date) => void;
  placeholder?: string;
  className?: string;
}

export function JalaliDatePicker({
  value,
  onChange,
  placeholder = 'انتخاب تاریخ',
  className,
}: JalaliDatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [viewDate, setViewDate] = useState<JalaliDate>(
    value ? dateToJalali(value) : dateToJalali(new Date())
  );
  const [showYearPicker, setShowYearPicker] = useState(false);
  const [showMonthPicker, setShowMonthPicker] = useState(false);

  const selectedJalali = value ? dateToJalali(value) : null;

  const handleDateSelect = (day: number) => {
    const gregorianDate = jalaliToGregorian(viewDate.year, viewDate.month, day);
    onChange(gregorianDate);
    setIsOpen(false);
  };

  const handlePrevMonth = () => {
    setViewDate((prev) => {
      if (prev.month === 1) {
        return { year: prev.year - 1, month: 12, day: 1 };
      }
      return { ...prev, month: prev.month - 1 };
    });
  };

  const handleNextMonth = () => {
    setViewDate((prev) => {
      if (prev.month === 12) {
        return { year: prev.year + 1, month: 1, day: 1 };
      }
      return { ...prev, month: prev.month + 1 };
    });
  };

  const daysInMonth = getDaysInJalaliMonth(viewDate.year, viewDate.month);
  const firstDayOfMonth = jalaliToGregorian(viewDate.year, viewDate.month, 1).getDay();
  // تبدیل از یکشنبه=0 به شنبه=0
  const startDay = firstDayOfMonth === 6 ? 0 : firstDayOfMonth + 1;

  const days: (number | null)[] = [];
  for (let i = 0; i < startDay; i++) {
    days.push(null);
  }
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(i);
  }

  const displayValue = value ? formatJalaliShort(dateToJalali(value)) : '';

  // Generate year range (current year ± 10)
  const currentYear = dateToJalali(new Date()).year;
  const yearRange = Array.from({ length: 21 }, (_, i) => currentYear - 10 + i);

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            'w-full justify-start text-right font-normal',
            !value && 'text-muted-foreground',
            className
          )}
        >
          <Calendar className="ml-2 h-4 w-4" />
          {displayValue ? toPersianDigits(displayValue) : placeholder}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0 border-2 border-border/50 shadow-2xl rounded-2xl overflow-hidden" align="start">
  <div className="bg-gradient-to-br from-primary/5 via-transparent to-secondary/5 p-3 rounded-t-2xl">
    {/* هدر کوچیک‌تر و تمیز */}
    <div className="flex items-center justify-between">
      <Button
        variant="ghost"
        size="icon"
        onClick={handleNextMonth}
        className="h-8 w-8 rounded-full hover:bg-primary/10 transition-all"
        disabled={showYearPicker || showMonthPicker}
      >
        <ChevronRight className="h-4 w-4" />
      </Button>

      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            setShowMonthPicker(!showMonthPicker);
            setShowYearPicker(false);
          }}
          className="h-8 px-3 rounded-lg font-bold text-sm hover:bg-primary/10"
        >
          {jalaliMonthNames[viewDate.month - 1]}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            setShowYearPicker(!showYearPicker);
            setShowMonthPicker(false);
          }}
          className="h-8 px-3 rounded-lg font-bold text-sm hover:bg-primary/10"
        >
          {toPersianDigits(viewDate.year)}
        </Button>
      </div>

      <Button
        variant="ghost"
        size="icon"
        onClick={handlePrevMonth}
        className="h-8 w-8 rounded-full hover:bg-primary/10 transition-all"
        disabled={showYearPicker || showMonthPicker}
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>
    </div>
  </div>

  <div className="p-3 bg-card/95 backdrop-blur-sm">
    {/* انتخاب سال — کوچیک‌تر */}
    {showYearPicker && (
      <div className="grid grid-cols-4 gap-2 max-h-48 overflow-y-auto">
        {yearRange.map((year) => (
          <Button
            key={year}
            variant={year === viewDate.year ? "default" : "outline"}
            size="sm"
            className="h-9 text-xs font-medium rounded-lg"
            onClick={() => {
              setViewDate({ ...viewDate, year });
              setShowYearPicker(false);
            }}
          >
            {toPersianDigits(year)}
          </Button>
        ))}
      </div>
    )}

    {/* انتخاب ماه — کوچیک‌تر */}
    {showMonthPicker && (
      <div className="grid grid-cols-3 gap-2">
        {jalaliMonthNames.map((month, index) => (
          <Button
            key={month}
            variant={index + 1 === viewDate.month ? "default" : "outline"}
            size="sm"
            className="h-9 text-xs font-medium rounded-lg"
            onClick={() => {
              setViewDate({ ...viewDate, month: index + 1 });
              setShowMonthPicker(false);
            }}
          >
            {month}
          </Button>
        ))}
      </div>
    )}

    {/* تقویم اصلی — جمع و جور و حرفه‌ای */}
    {!showYearPicker && !showMonthPicker && (
      <>
        {/* روزهای هفته */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {['ش', 'ی', 'د', 'س', 'چ', 'پ', 'ج'].map((day) => (
            <div key={day} className="text-center text-xs font-bold text-primary h-7 flex items-center justify-center">
              {day}
            </div>
          ))}
        </div>

        {/* روزهای ماه */}
        <div className="grid grid-cols-7 gap-1">
          {days.map((day, index) => {
            if (day === null) return <div key={`empty-${index}`} className="h-8" />;

            const isSelected = selectedJalali?.year === viewDate.year && 
                              selectedJalali?.month === viewDate.month && 
                              selectedJalali?.day === day;

            const isToday = dateToJalali(new Date()).year === viewDate.year &&
                           dateToJalali(new Date()).month === viewDate.month &&
                           dateToJalali(new Date()).day === day;

            return (
              <Button
                key={day}
                variant={isSelected ? "default" : "ghost"}
                size="sm"
                className={cn(
                  "h-8 w-8 p-0 text-xs font-medium rounded-lg transition-all",
                  isSelected && "shadow-md",
                  isToday && !isSelected && "border border-primary/70 font-bold text-primary",
                  !isSelected && !isToday && "hover:bg-primary/10"
                )}
                onClick={() => handleDateSelect(day)}
              >
                {toPersianDigits(day)}
              </Button>
            );
          })}
        </div>

        {/* دکمه امروز — کوچیک و شیک */}
        <div className="mt-3 pt-2 border-t border-border/30">
          <Button
            variant="outline"
            size="sm"
            className="w-full h-9 text-xs font-medium rounded-lg"
            onClick={() => {
              const today = new Date();
              onChange(today);
              setIsOpen(false);
            }}
          >
            امروز
          </Button>
        </div>
      </>
    )}
  </div>
</PopoverContent>
    </Popover>
  );
}

// Input ساده برای تاریخ (بدون picker)
interface JalaliDateInputProps {
  value?: Date;
  onChange: (date: Date | null) => void;
  placeholder?: string;
  className?: string;
}

export function JalaliDateInput({
  value,
  onChange,
  placeholder = 'YYYY/MM/DD',
  className,
}: JalaliDateInputProps) {
  const [inputValue, setInputValue] = useState(
    value ? formatJalaliShort(dateToJalali(value)) : ''
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setInputValue(val);

    // تلاش برای parse کردن
    const parts = val.split('/');
    if (parts.length === 3) {
      const year = parseInt(parts[0]);
      const month = parseInt(parts[1]);
      const day = parseInt(parts[2]);

      if (!isNaN(year) && !isNaN(month) && !isNaN(day)) {
        if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
          try {
            const gDate = jalaliToGregorian(year, month, day);
            onChange(gDate);
          } catch {
            // Invalid date
          }
        }
      }
    }
  };

  return (
    <Input
      type="text"
      value={inputValue}
      onChange={handleChange}
      placeholder={placeholder}
      className={className}
      dir="ltr"
    />
  );
}
