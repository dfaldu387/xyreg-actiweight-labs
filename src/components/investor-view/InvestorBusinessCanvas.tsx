import { Card } from "@/components/ui/card";

interface InvestorBusinessCanvasProps {
  keyPartners: string;
  keyActivities: string;
  keyResources: string;
  valuePropositions: string;
  customerRelationships: string;
  channels: string;
  customerSegments: string;
  costStructure: string;
  revenueStreams: string;
  showEmptyBlocks?: boolean;
}

const CanvasBlock = ({
  title,
  content,
  className = "",
  showEmpty = false,
}: {
  title: string;
  content: string;
  className?: string;
  showEmpty?: boolean;
}) => {
  if (!content && !showEmpty) return null;
  
  return (
    <Card className={`p-4 hover:shadow-md transition-shadow ${className}`}>
      <h3 className="font-semibold text-sm text-indigo-600 dark:text-indigo-400 uppercase tracking-wide mb-3">
        {title}
      </h3>
      {content ? (
        <p className="text-sm text-foreground leading-relaxed whitespace-pre-line">
          {content}
        </p>
      ) : (
        <p className="text-sm text-muted-foreground italic">
          Not yet defined
        </p>
      )}
    </Card>
  );
};

export function InvestorBusinessCanvas({
  keyPartners,
  keyActivities,
  keyResources,
  valuePropositions,
  customerRelationships,
  channels,
  customerSegments,
  costStructure,
  revenueStreams,
  showEmptyBlocks = false,
}: InvestorBusinessCanvasProps) {
  // Check if there's any content to display
  const hasContent = keyPartners || keyActivities || keyResources || valuePropositions ||
    customerRelationships || channels || customerSegments || costStructure || revenueStreams;

  // If no content and not showing empty blocks, hide entirely
  if (!hasContent && !showEmptyBlocks) {
    return null;
  }

  return (
    <section className="space-y-6">
      <h2 className="text-2xl font-semibold text-foreground">
        Business Model Canvas
      </h2>
      {/* Classic Business Model Canvas Grid Layout */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        {/* Row 1-2: Key Partners (spans 2 rows) */}
        <div className="md:row-span-2">
          <CanvasBlock title="Key Partners" content={keyPartners} className="h-full" showEmpty={showEmptyBlocks} />
        </div>

        {/* Key Activities */}
        <CanvasBlock title="Key Activities" content={keyActivities} showEmpty={showEmptyBlocks} />

        {/* Value Propositions (spans 2 rows) */}
        <div className="md:row-span-2">
          <CanvasBlock title="Value Propositions" content={valuePropositions} className="h-full" showEmpty={showEmptyBlocks} />
        </div>

        {/* Customer Relationships */}
        <CanvasBlock title="Customer Relationships" content={customerRelationships} showEmpty={showEmptyBlocks} />

        {/* Customer Segments (spans 2 rows) */}
        <div className="md:row-span-2">
          <CanvasBlock title="Customer Segments" content={customerSegments} className="h-full" showEmpty={showEmptyBlocks} />
        </div>

        {/* Row 2 */}
        <CanvasBlock title="Key Resources" content={keyResources} showEmpty={showEmptyBlocks} />

        <CanvasBlock title="Channels" content={channels} showEmpty={showEmptyBlocks} />

        {/* Row 3: Cost Structure & Revenue Streams */}
        <div className="md:col-span-2">
          <CanvasBlock title="Cost Structure" content={costStructure} className="h-full" showEmpty={showEmptyBlocks} />
        </div>

        <div className="md:col-span-3">
          <CanvasBlock title="Revenue Streams" content={revenueStreams} className="h-full" showEmpty={showEmptyBlocks} />
        </div>
      </div>
    </section>
  );
}