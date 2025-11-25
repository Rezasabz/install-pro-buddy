import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface MetricCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  className?: string;
}

const MetricCard = ({
  title,
  value,
  description,
  icon: Icon,
  trend,
  className,
}: MetricCardProps) => {
  return (
    <Card className={cn(
      "relative overflow-hidden transition-all duration-300",
      "hover:shadow-xl hover:shadow-primary/10 hover:scale-[1.02]",
      "bg-card/80 backdrop-blur-sm border-border/50",
      "group"
    )}>
      {/* Gradient overlay on hover */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 relative z-10">
        <CardTitle className="text-sm font-semibold text-muted-foreground/80">
          {title}
        </CardTitle>
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-lg blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <Icon className="relative h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors duration-300 group-hover:scale-110" />
        </div>
      </CardHeader>
      <CardContent className="relative z-10">
        <div className={cn(
          "text-2xl font-bold bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent",
          "group-hover:from-primary group-hover:to-secondary transition-all duration-300"
        )}>
          {value}
        </div>
        {description && (
          <p className="text-xs text-muted-foreground/70 mt-2 leading-relaxed">
            {description}
          </p>
        )}
        {trend && (
          <div className="flex items-center mt-3 pt-2 border-t border-border/50">
            <span
              className={cn(
                "text-xs font-semibold px-2 py-0.5 rounded-full",
                trend.isPositive 
                  ? "text-success bg-success/10" 
                  : "text-destructive bg-destructive/10"
              )}
            >
              {trend.isPositive ? "+" : ""}
              {trend.value}%
            </span>
            <span className="text-xs text-muted-foreground/60 mr-2">مقایسه با ماه قبل</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default MetricCard;
