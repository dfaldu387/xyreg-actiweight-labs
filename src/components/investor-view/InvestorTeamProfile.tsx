import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Linkedin } from 'lucide-react';

interface TeamMember {
  id: string;
  name: string;
  role: string | null;
  bio: string | null;
  avatar_url: string | null;
  linkedin_url: string | null;
}

interface InvestorTeamProfileProps {
  teamMembers: TeamMember[];
}

export function InvestorTeamProfile({ teamMembers }: InvestorTeamProfileProps) {
  if (!teamMembers || teamMembers.length === 0) return null;

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <section>
      <h2 className="text-2xl font-bold text-foreground mb-6">Team</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {teamMembers.map((member) => (
          <div
            key={member.id}
            className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 p-6"
          >
            <div className="flex items-start gap-4">
              <Avatar className="h-16 w-16">
                <AvatarImage 
                  src={member.avatar_url || undefined} 
                  alt={member.name}
                  className="object-cover"
                />
                <AvatarFallback className="bg-primary/10 text-primary text-lg font-medium">
                  {getInitials(member.name)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-foreground">{member.name}</h3>
                {member.role && (
                  <p className="text-sm text-primary font-medium">{member.role}</p>
                )}
                {member.linkedin_url && (
                  <a
                    href={member.linkedin_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-primary mt-1"
                  >
                    <Linkedin className="h-3 w-3" />
                    LinkedIn
                  </a>
                )}
              </div>
            </div>
            {member.bio && (
              <p className="text-sm text-muted-foreground mt-4 leading-relaxed">
                {member.bio}
              </p>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
