import { useState } from 'react';
import { ADVISORY_AGENTS, type AdvisoryAgent } from '@/data/advisoryAgents';
import { AgentCard } from '@/components/advisory/AgentCard';
import { AgentChatDialog } from '@/components/advisory/AgentChatDialog';
import { Users } from 'lucide-react';

export default function AdvisoryBoard() {
  const [selectedAgent, setSelectedAgent] = useState<AdvisoryAgent | null>(null);
  const [chatOpen, setChatOpen] = useState(false);

  const handleAgentClick = (agent: AdvisoryAgent) => {
    setSelectedAgent(agent);
    setChatOpen(true);
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Users className="h-7 w-7 text-[#D4AF37]" />
        <div>
          <h1 className="text-2xl font-bold text-foreground">Technical Advisory Board</h1>
          <p className="text-sm text-muted-foreground">
            Chat with domain-specialized AI consultants for regulatory, quality, and engineering guidance.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {ADVISORY_AGENTS.map(agent => (
          <AgentCard key={agent.id} agent={agent} onClick={() => handleAgentClick(agent)} />
        ))}
      </div>

      <AgentChatDialog
        agent={selectedAgent}
        open={chatOpen}
        onOpenChange={setChatOpen}
      />
    </div>
  );
}
