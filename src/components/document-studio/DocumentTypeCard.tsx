import React from 'react';
import { LucideIcon } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/hooks/useTranslation';

interface DocumentTypeCardProps {
  title: string;
  subtitle: string;
  icon: LucideIcon;
  onClick: () => void;
  gradientFrom: string;
  gradientTo: string;
  iconColor: string;
  borderColor: string;
  hoverBorderColor: string;
}

export function DocumentTypeCard({
  title,
  subtitle,
  icon: Icon,
  onClick,
  gradientFrom,
  gradientTo,
  iconColor,
  borderColor,
  hoverBorderColor
}: DocumentTypeCardProps) {
  const { lang } = useTranslation();

  return (
    <Card
      className={cn(
        "group cursor-pointer transition-all duration-300 ease-out",
        "hover:shadow-lg hover:shadow-primary/10 hover:-translate-y-1",
        "border-2",
        borderColor,
        hoverBorderColor
      )}
      onClick={onClick}
    >
      <CardContent className="p-8">
        <div className={cn(
          "w-full h-48 rounded-lg bg-gradient-to-br mb-6 flex items-center justify-center",
          "group-hover:scale-105 transition-transform duration-300",
          gradientFrom,
          gradientTo
        )}>
          <Icon className={cn("w-16 h-16", iconColor)} />
        </div>

        <div className="space-y-3">
          <h3 className="text-xl font-semibold text-foreground group-hover:text-primary transition-colors">
            {title}
          </h3>
          <p className="text-muted-foreground leading-relaxed">
            {subtitle}
          </p>
        </div>

        <div className="mt-6 pt-4 border-t border-border/50">
          <div className="flex items-center text-sm text-primary font-medium group-hover:translate-x-1 transition-transform duration-200">
            {lang('documentStudio.getStarted')} →
          </div>
        </div>
      </CardContent>
    </Card>
  );
}