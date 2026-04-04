interface InvestorPartHeaderProps {
  partNumber: string;  // "I", "II", "III", "IV", "V"
  title: string;       // e.g., "Product & Technology Foundation"
  subtitle: string;    // e.g., "The 'What' and the 'How.'"
}

export function InvestorPartHeader({ partNumber, title, subtitle }: InvestorPartHeaderProps) {
  return (
    <div className="pt-10 pb-6 border-t border-border first:border-t-0 first:pt-0">
      <h2 className="text-base font-bold text-primary uppercase tracking-widest mb-2">
        Part {partNumber}: {title}
      </h2>
      <p className="text-base text-muted-foreground italic">
        {subtitle}
      </p>
    </div>
  );
}
