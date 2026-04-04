// Simple user data for Gantt chart assignees
export interface GanttUser {
    id: number;
    name: string;
    email?: string;
    avatar?: string;
}

export const users: GanttUser[] = [
    {
        id: 1,
        name: "John Doe",
        email: "john.doe@example.com",
        avatar: "https://api.dicebear.com/7.x/avataaars/png?seed=JohnDoe&backgroundColor=b6e3f4",
    },
    {
        id: 2,
        name: "Jane Smith",
        email: "jane.smith@example.com",
        avatar: "https://api.dicebear.com/7.x/avataaars/png?seed=JaneSmith&backgroundColor=ffd5dc",
    },
    {
        id: 3,
        name: "Bob Johnson",
        email: "bob.johnson@example.com",
        avatar: "https://api.dicebear.com/7.x/avataaars/png?seed=BobJohnson&backgroundColor=c7d2fe",
    },
    {
        id: 4,
        name: "Alice Williams",
        email: "alice.williams@example.com",
        avatar: "https://api.dicebear.com/7.x/avataaars/png?seed=AliceWilliams&backgroundColor=ffdfbf",
    },
    {
        id: 5,
        name: "Charlie Brown",
        email: "charlie.brown@example.com",
        avatar: "https://api.dicebear.com/7.x/avataaars/png?seed=CharlieBrown&backgroundColor=d1fae5",
    },
];
