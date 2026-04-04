
import { Card, CardContent } from "@/components/ui/card";
import { Users } from "lucide-react";
import { TeamMember } from "@/types/client";

interface TeamMembersProps {
  members: TeamMember[];
}

export function TeamMembers({ members }: TeamMembersProps) {
  return (
    <Card>
      <CardContent className="p-4">
        <h4 className="text-sm font-medium flex items-center gap-2 mb-3">
          <Users className="h-4 w-4" />
          Team Members
        </h4>
        <ul className="space-y-1">
          {members.map((member, index) => (
            <li key={index} className="text-sm">{member.name} - {member.role}</li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
