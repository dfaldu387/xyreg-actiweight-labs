import React from "react";
import { GanttUser } from "../data/users";

interface UserStubProps {
    user?: GanttUser;
}

export function UserStub({ user }: UserStubProps) {
    if (!user) {
        return (
            <div className="flex items-center gap-2 text-muted-foreground text-sm" style={{ padding: "4px 8px" }}>
                <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                    <span className="text-xs">—</span>
                </div>
                <span>Unassigned</span>
            </div>
        );
    }

    const initials = user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);

    return (
        <div className="flex items-center gap-2" style={{ padding: "4px 8px" }}>
            {user.avatar ? (
                <img
                    src={user.avatar}
                    alt={user.name}
                    className="h-8 w-8 rounded-full object-cover"
                    style={{ display: 'block' }}
                    onError={(e) => {
                        // Hide broken image and show fallback
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                        const fallback = target.nextElementSibling as HTMLElement;
                        if (fallback) fallback.style.display = 'flex';
                    }}
                />
            ) : null}
            <div
                className="h-8 w-8 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center font-medium"
                style={{ display: user.avatar ? 'none' : 'flex' }}
            >
                {initials}
            </div>
            <span className="text-sm">{user.name}</span>
        </div>
    );
}

