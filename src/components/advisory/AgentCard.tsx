import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import type { AdvisoryAgent } from '@/data/advisoryAgents';

const COLOR_MAP: Record<string, { border: string; bg: string; badge: string; avatar: string }> = {
  gold:   { border: 'border-[#D4AF37]', bg: 'bg-[#D4AF37]/5',  badge: 'bg-[#D4AF37]/15 text-[#B8960E] border-[#D4AF37]/30', avatar: 'bg-[#D4AF37] text-white' },
  blue:   { border: 'border-[#3B82F6]', bg: 'bg-[#3B82F6]/5',  badge: 'bg-[#3B82F6]/15 text-[#2563EB] border-[#3B82F6]/30', avatar: 'bg-[#3B82F6] text-white' },
  green:  { border: 'border-[#10B981]', bg: 'bg-[#10B981]/5',  badge: 'bg-[#10B981]/15 text-[#059669] border-[#10B981]/30', avatar: 'bg-[#10B981] text-white' },
  purple: { border: 'border-[#8B5CF6]', bg: 'bg-[#8B5CF6]/5',  badge: 'bg-[#8B5CF6]/15 text-[#7C3AED] border-[#8B5CF6]/30', avatar: 'bg-[#8B5CF6] text-white' },
};

interface AgentCardProps {
  agent: AdvisoryAgent;
  onClick: () => void;
}

export function AgentCard({ agent, onClick }: AgentCardProps) {
  const colors = COLOR_MAP[agent.domainColor] || COLOR_MAP.blue;

  return (
    <Card
      className={`cursor-pointer border-l-4 ${colors.border} ${colors.bg} hover:shadow-md transition-all duration-200 hover:scale-[1.02]`}
      onClick={onClick}
    >
      <CardContent className="p-5">
        <div className="flex items-start gap-4">
          <Avatar className={`h-12 w-12 ${colors.avatar} shrink-0`}>
            <AvatarFallback className={`${colors.avatar} font-semibold text-sm`}>
              {agent.avatarInitials}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <h3 className="font-semibold text-foreground">{agent.name}</h3>
            <p className="text-sm text-muted-foreground">{agent.title}</p>
            <Badge variant="outline" className={`mt-2 text-xs ${colors.badge}`}>
              {agent.specialty}
            </Badge>
            <p className="mt-2 text-xs text-muted-foreground line-clamp-2">{agent.description}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
