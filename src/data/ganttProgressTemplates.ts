export interface ProgressData {
    percentage: number;
    status: 'not-started' | 'in-progress' | 'completed';
    description?: string;
}

// Get progress description based on percentage and status
export const getProgressDescription = (percentage: number, status: ProgressData['status']): string => {
    switch (status) {
        case 'not-started':
            return 'Not started';
        case 'completed':
            return 'Completed';
        case 'in-progress':
            if (percentage < 25) return 'Just started';
            if (percentage < 50) return 'In progress';
            if (percentage < 75) return 'Halfway done';
            if (percentage < 90) return 'Almost done';
            return 'Nearly complete';
        default:
            return 'Unknown status';
    }
};
