import { useMemo } from "react";
import { UserStub } from "./UserStub";
import { users } from "../data/users";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface AvatarCellProps {
    row: {
        assigned?: string | number;
    };
}

export function AvatarCell({ row }: AvatarCellProps) {
    const user = useMemo(() => {
        if (!row.assigned) {
            return undefined;
        }
        
        if (typeof row.assigned === 'string' && row.assigned.includes(',')) {
            return null;
        }
        
        return users.find((u) => u.id == row.assigned);
    }, [row.assigned]);

    if (typeof row.assigned === 'string' && (row.assigned.includes(',') || !users.find((u) => String(u.id) === String(row.assigned)))) {
        const names = row.assigned.split(',').map(n => n.trim()).filter(n => n.length > 0);
        
        // If only one name, show single avatar
        if (names.length === 1) {
            const initials = names[0]
                .split(' ')
                .map((n) => n[0])
                .join('')
                .toUpperCase()
                .slice(0, 2);
            
            return (
                <div className="flex items-center gap-2" style={{ padding: "4px 8px" }}>
                    <Avatar className="h-8 w-8 border-2 border-background ring-2 ring-white dark:ring-gray-800 bg-blue-200 font-bold">
                        <AvatarFallback className="text-xs bg-primary/10 text-primary font-medium">
                            {initials}
                        </AvatarFallback>
                    </Avatar>
                    <span className="text-sm">{names[0]}</span>
                </div>
            );
        }
        
        // Multiple names: show overlapping avatars
        const firstName = names[0];
        const remainingCount = names.length - 1;
        const initials = firstName
            .split(' ')
            .map((n) => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);
        
        return (
            <div className="flex items-center gap-2" style={{ padding: "4px 8px" }}>
                <div className="flex -space-x-2">
                    <Avatar className="h-8 w-8 border-2 border-background ring-2 ring-white dark:ring-gray-800 bg-blue-200 dark:bg-blue-800 dark:text-white font-bold">
                        <AvatarFallback className="text-xs bg-primary/10 text-primary font-medium">
                            {initials}
                        </AvatarFallback>
                    </Avatar>
                    {remainingCount > 0 && (
                        <Avatar className="h-8 w-8 border-2 border-background ring-2 ring-white dark:ring-gray-800">
                            <AvatarFallback className="text-xs font-bold bg-foreground/90 text-background">
                                +{remainingCount}
                            </AvatarFallback>
                        </Avatar>
                    )}
                </div>
                <span className="text-sm">{row.assigned}</span>
            </div>
        );
    }

    return <UserStub user={user} />;
}

