import { cn } from '@/lib/utils';

const variantStyles = {
  default: 'bg-card',
  primary: 'bg-primary text-primary-foreground',
  warning: 'bg-warning/10 border-warning/20',
  success: 'bg-success/10 border-success/20',
  danger: 'bg-destructive/10 border-destructive/20',
};

const iconVariantStyles = {
  default: 'bg-secondary text-primary',
  primary: 'bg-primary-foreground/20 text-primary-foreground',
  warning: 'bg-warning/20 text-warning',
  success: 'bg-success/20 text-success',
  danger: 'bg-destructive/20 text-destructive',
};

export function StatCard({ title, value, icon: Icon, trend, variant = 'default', className }) {
  return (
    <div className={cn('stat-card animate-fade-in', variantStyles[variant], className)}>
      <div className="flex items-start justify-between">
        <div>
          <p className={cn(
            "text-sm font-medium",
            variant === 'primary' ? 'text-primary-foreground/80' : 'text-muted-foreground'
          )}>
            {title}
          </p>
          <p className={cn(
            "text-3xl font-bold font-display mt-2",
            variant === 'primary' ? 'text-primary-foreground' : 'text-foreground'
          )}>
            {value}
          </p>
          {trend && (
            <p className={cn(
              "text-sm mt-2",
              trend.isPositive ? 'text-success' : 'text-destructive'
            )}>
              {trend.isPositive ? '+' : ''}{trend.value}% dari bulan lalu
            </p>
          )}
        </div>
        <div className={cn('p-3 rounded-xl', iconVariantStyles[variant])}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </div>
  );
}
