
import { cn } from "@/lib/utils";

interface PageHeaderProps {
  heading: string;
  text?: string;  // Changed 'subheading' to 'text' to match the usage
  className?: string;
}

export function PageHeader({ heading, text, className }: PageHeaderProps) {
  return (
    <div className={cn("space-y-1", className)}>
      <h1 className="text-2xl font-semibold tracking-tight">{heading}</h1>
      {text && <p className="text-muted-foreground">{text}</p>}
    </div>
  );
}
