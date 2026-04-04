import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Calendar as CalendarIcon } from 'lucide-react';
import './CustomTaskContent.css';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';

interface CustomTaskContentProps {
    data: {
        id: string | number;
        text?: string;
        type?: string;
        clicked?: boolean;
        start?: Date;
        end?: Date;
        parent?: string | number;
        phaseId?: string | number;
    };
    api?: any;
    onAction?: (action: { action: string; data: { clicked: boolean; id: string | number } }) => void;
}

function CustomTaskContent({ data, api, onAction }: CustomTaskContentProps) {
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [startDate, setStartDate] = useState<Date | undefined>(
        data.start ? new Date(data.start) : undefined
    );
    const [endDate, setEndDate] = useState<Date | undefined>(
        data.end ? new Date(data.end) : undefined
    );
    const [phaseStartDate, setPhaseStartDate] = useState<Date | undefined>(undefined);
    const [isPhaseNotStarted, setIsPhaseNotStarted] = useState(false);

    // Get parent phase information
    useEffect(() => {
        if (!api) {
            setPhaseStartDate(undefined);
            setIsPhaseNotStarted(false);
            return;
        }

        const visited = new Set<string | number>();
        const queue: Array<string | number> = [];

        if (data.parent !== undefined && data.parent !== null) {
            queue.push(data.parent);
        }

        if (data.phaseId !== undefined && data.phaseId !== null) {
            queue.push(data.phaseId);
            queue.push(`phase-${data.phaseId}`);
        }

        let foundPhase = false;

        while (queue.length > 0) {
            const currentId = queue.shift();
            if (currentId === undefined || currentId === null) {
                continue;
            }

            if (visited.has(currentId)) {
                continue;
            }
            visited.add(currentId);

            try {
                const parentTask = api.getTask(currentId);
                if (!parentTask) {
                    continue;
                }

                const parentType: string | undefined = parentTask.type;
                const rawStatus =
                    (parentTask.status && typeof parentTask.status === 'object'
                        ? parentTask.status.value
                        : parentTask.status) || parentTask.phaseStatus || parentTask.phase_status;
                const normalizedStatus = rawStatus ? rawStatus.toString().toLowerCase() : undefined;
                const isNotStartedPhase =
                    parentType === 'not-started' ||
                    normalizedStatus === 'not-started' ||
                    normalizedStatus === 'not_started';

                if (isNotStartedPhase) {
                    const phaseStart = parentTask.start ? new Date(parentTask.start) : undefined;
                    setPhaseStartDate(phaseStart);
                    setIsPhaseNotStarted(true);
                    foundPhase = true;
                    break;
                }

                if (parentTask.parent !== undefined && parentTask.parent !== null) {
                    queue.push(parentTask.parent);
                }
            } catch (err) {
                console.debug('[CustomTaskContent] Error traversing parent chain:', err);
            }
        }

        if (!foundPhase) {
            setPhaseStartDate(undefined);
            setIsPhaseNotStarted(false);
        }
    }, [api, data.parent, data.phaseId, data.id]);

    const isDateBeforePhaseStart = (date: Date | undefined) => {
        if (!date || !isPhaseNotStarted || !phaseStartDate) {
            return false;
        }

        const candidate = new Date(date);
        candidate.setHours(0, 0, 0, 0);

        const phaseStart = new Date(phaseStartDate);
        phaseStart.setHours(0, 0, 0, 0);

        return candidate < phaseStart;
    };

    // Update dates when data changes
    useEffect(() => {
        setStartDate(data.start ? new Date(data.start) : undefined);
        setEndDate(data.end ? new Date(data.end) : undefined);
    }, [data.start, data.end]);

    function doClick(ev: React.MouseEvent<HTMLButtonElement>) {
        ev.stopPropagation();

        if (data.type !== 'task') {
            return;
        }

        // Open dialog for task types only
        setIsDialogOpen(true);

        if (onAction) {
            onAction({
                action: 'custom-click',
                data: {
                    clicked: !data.clicked,
                    id: data.id,
                },
            });
        }
    }

    const handleSave = () => {
        // You can add logic here to save the date range
        // For example, call onAction with the date range
        if (onAction && startDate && endDate) {
            onAction({
                action: 'update-date-range',
                data: {
                    clicked: data.clicked || false,
                    id: data.id,
                    startDate,
                    endDate,
                } as any,
            });
        }
        setIsDialogOpen(false);
    };

    const handleCancel = () => {
        // Reset to original dates
        setStartDate(data.start ? new Date(data.start) : undefined);
        setEndDate(data.end ? new Date(data.end) : undefined);
        setIsDialogOpen(false);
    };

    return (
        <>
            {data.type !== 'milestone' ? (
                <>
                    <div className="wx-4RuF7aAO text">
                        {/* <span>
                            {data.text || ''}
                        </span> */}
                    </div>
                    <button className="wx-BzRGIq8x" onClick={doClick}>
                        {data.text || ''}
                    </button>

                    {data.type === 'task' && (
                        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                            <DialogContent className="sm:max-w-[500px]">
                                <DialogHeader>
                                    <DialogTitle>Select Date Range</DialogTitle>
                                    <DialogDescription>
                                        Choose the start and end dates for this task.
                                    </DialogDescription>
                                </DialogHeader>

                                <div className="flex flex-col gap-4 py-4">
                                    <div className="flex flex-col gap-2">
                                            <label className="text-sm font-medium">Start Date</label>
                                            <Popover>
                                                <PopoverTrigger asChild>
                                                    <Button
                                                        variant="outline"
                                                        className={cn(
                                                            "w-full justify-start text-left font-normal",
                                                            !startDate && "text-muted-foreground"
                                                        )}
                                                    >
                                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                                        {startDate ? format(startDate, "PPP") : "Select start date"}
                                                    </Button>
                                                </PopoverTrigger>
                                                <PopoverContent className="w-auto p-0" align="start">
                                                    <Calendar
                                                        mode="single"
                                                        selected={startDate}
                                                        onSelect={(date) => {
                                                            if (!date) {
                                                                return;
                                                            }
                                                            if (isDateBeforePhaseStart(date)) {
                                                                return;
                                                            }
                                                            if (endDate && date > endDate) {
                                                                setEndDate(undefined);
                                                            }
                                                            setStartDate(date);
                                                        }}
                                                        initialFocus
                                                        fromDate={isPhaseNotStarted && phaseStartDate ? phaseStartDate : undefined}
                                                        disabled={(date) => {
                                                            // If phase is not started, disable dates before phase start date
                                                            if (isPhaseNotStarted && phaseStartDate) {
                                                                const phaseStart = new Date(phaseStartDate);
                                                                phaseStart.setHours(0, 0, 0, 0);
                                                                const checkDate = new Date(date);
                                                                checkDate.setHours(0, 0, 0, 0);
                                                                if (checkDate < phaseStart) {
                                                                    return true;
                                                                }
                                                            }
                                                            // Disable dates after end date if end date is set
                                                            if (endDate) {
                                                                return date > endDate;
                                                            }
                                                            return false;
                                                        }}
                                                    />
                                                </PopoverContent>
                                            </Popover>
                                        </div>

                                    <div className="flex flex-col gap-2">
                                            <label className="text-sm font-medium">End Date</label>
                                            <Popover>
                                                <PopoverTrigger asChild>
                                                    <Button
                                                        variant="outline"
                                                        className={cn(
                                                            "w-full justify-start text-left font-normal",
                                                            !endDate && "text-muted-foreground"
                                                        )}
                                                    >
                                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                                        {endDate ? format(endDate, "PPP") : "Select end date"}
                                                    </Button>
                                                </PopoverTrigger>
                                                <PopoverContent className="w-auto p-0" align="start">
                                                    <Calendar
                                                        mode="single"
                                                        selected={endDate}
                                                        onSelect={(date) => {
                                                            if (!date) {
                                                                return;
                                                            }
                                                            if (isDateBeforePhaseStart(date)) {
                                                                return;
                                                            }
                                                            if (startDate && date < startDate) {
                                                                return;
                                                            }
                                                            setEndDate(date);
                                                        }}
                                                        initialFocus
                                                        fromDate={
                                                            isPhaseNotStarted && phaseStartDate
                                                                ? phaseStartDate
                                                                : startDate
                                                                    ? startDate
                                                                    : undefined
                                                        }
                                                        disabled={(date) => {
                                                            // If phase is not started, disable dates before phase start date
                                                            if (isPhaseNotStarted && phaseStartDate) {
                                                                const phaseStart = new Date(phaseStartDate);
                                                                phaseStart.setHours(0, 0, 0, 0);
                                                                const checkDate = new Date(date);
                                                                checkDate.setHours(0, 0, 0, 0);
                                                                if (checkDate < phaseStart) {
                                                                    return true;
                                                                }
                                                            }
                                                            // Disable dates before start date if start date is set
                                                            if (startDate) {
                                                                return date < startDate;
                                                            }
                                                            return false;
                                                        }}
                                                    />
                                                </PopoverContent>
                                            </Popover>
                                        </div>
                                </div>

                                <DialogFooter>
                                    <Button variant="outline" onClick={handleCancel}>
                                        Cancel
                                    </Button>
                                    <Button onClick={handleSave} disabled={!startDate || !endDate}>
                                        Save
                                    </Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                    )}
                </>
            ) : (
                <div className="wx-BzRGIq8x wx-text-out text-left">
                    {data.text || ''}
                </div>
            )}
        </>
    );
}

export default CustomTaskContent;


