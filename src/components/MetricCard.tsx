import React from 'react';
import { LucideIcon } from 'lucide-react';
import { motion } from 'framer-motion';

interface MetricCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: {
    value: string;
    isPositive: boolean;
  };
  subtext?: string;
  theme?: 'primary' | 'emerald' | 'rose' | 'amber' | 'cyan' | 'orange' | 'violet';
  onClick?: () => void;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  icon: Icon,
  trend,
  subtext,
  theme = 'primary',
  onClick
}) => {
  const getThemeStyles = () => {
    switch (theme) {
      case 'emerald':
        return {
          iconBg: 'bg-emerald-500/10 text-emerald-500 dark:bg-emerald-500/20',
          hoverBorder: 'hover:border-emerald-500/30'
        };
      case 'rose':
        return {
          iconBg: 'bg-rose-500/10 text-rose-500 dark:bg-rose-500/20',
          hoverBorder: 'hover:border-rose-500/30'
        };
      case 'amber':
        return {
          iconBg: 'bg-amber-500/10 text-amber-500 dark:bg-amber-500/20',
          hoverBorder: 'hover:border-amber-500/30'
        };
      case 'cyan':
        return {
          iconBg: 'bg-cyan-500/10 text-cyan-500 dark:bg-cyan-500/20',
          hoverBorder: 'hover:border-cyan-500/30'
        };
      case 'orange':
        return {
          iconBg: 'bg-orange-500/10 text-orange-500 dark:bg-orange-500/20',
          hoverBorder: 'hover:border-orange-500/30'
        };
      case 'violet':
        return {
          iconBg: 'bg-violet-500/10 text-violet-500 dark:bg-violet-500/20',
          hoverBorder: 'hover:border-violet-500/30'
        };
      default:
        return {
          iconBg: 'bg-primary/10 text-primary dark:bg-primary/20',
          hoverBorder: 'hover:border-primary/30'
        };
    }
  };

  const styles = getThemeStyles();

  return (
    <motion.div
      whileHover={{ y: -3, transition: { duration: 0.2 } }}
      onClick={onClick}
      className={`bg-card border border-border/80 rounded-2xl p-5 shadow-sm transition-all duration-300 ${styles.hoverBorder} ${
        onClick ? 'cursor-pointer select-none active:scale-[0.98]' : ''
      }`}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-muted-foreground tracking-wide select-none">
          {title}
        </span>
        <div className={`p-2 rounded-xl flex items-center justify-center shrink-0 ${styles.iconBg}`}>
          <Icon size={18} />
        </div>
      </div>

      <div className="mt-4 flex items-baseline gap-2">
        <span className="text-xl font-bold tracking-tight text-foreground">{value}</span>
        {trend && (
          <span
            className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${
              trend.isPositive
                ? 'bg-emerald-500/10 text-emerald-500 dark:bg-emerald-500/20'
                : 'bg-rose-500/10 text-rose-500 dark:bg-rose-500/20'
            }`}
          >
            {trend.value}
          </span>
        )}
      </div>

      {subtext && (
        <p className="text-[10px] text-muted-foreground mt-1.5 select-none">{subtext}</p>
      )}
    </motion.div>
  );
};
