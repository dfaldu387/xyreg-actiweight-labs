
import React, { useState, useMemo } from 'react';
import { usePhaseOperations } from '@/hooks/usePhaseOperations';
import { useDocumentAuthors } from '@/hooks/useDocumentAuthors';

interface DocumentStatusOperationsProps {
  productId: string;
  companyId: string;
  phases: any[];
  onRefresh: () => Promise<any>;
  children: (operations: {
    handlePhaseDeadlineChange: (phaseId: string, date: Date | undefined) => void;
    handleDocumentStatusChange: (phaseId: string, documentId: string, status: string) => void;
    handleDocumentDeadlineChange: (phaseId: string, documentId: string, date: Date | undefined) => void;
    // Filter operations
    authorFilter: string[];
    onAuthorFilterChange: (authorId: string) => void;
    dateFilter: { start?: Date; end?: Date } | null;
    onDateFilterChange: (start?: Date, end?: Date) => void;
    clearAllFilters: () => void;
    // Available options for filters
    availableAuthors: Array<{ id: string; name: string }>;
    availablePhases: string[];
    availableStatuses: string[];
  }) => React.ReactNode;
}

export function DocumentStatusOperations({
  productId,
  companyId,
  phases,
  onRefresh,
  children
}: DocumentStatusOperationsProps) {
  const {
    handlePhaseDeadlineChange: baseHandlePhaseDeadlineChange,
    handleDocumentStatusChange: baseHandleDocumentStatusChange,
    handleDocumentDeadlineChange: baseHandleDocumentDeadlineChange
  } = usePhaseOperations(productId, onRefresh);

  // Fetch authors for filtering
  const { authors, isLoading: authorsLoading } = useDocumentAuthors(companyId);

  // Filter states
  const [authorFilter, setAuthorFilter] = useState<string[]>([]);
  const [dateFilter, setDateFilter] = useState<{ start?: Date; end?: Date } | null>(null);

  // Get available phases and statuses from phases prop
  const availablePhases = useMemo(() => {
    return phases.map(phase => phase.name).filter(Boolean);
  }, [phases]);

  const availableStatuses = useMemo(() => {
    return ['Not Started', 'In Progress', 'In Review', 'Approved', 'Report', 'Rejected', 'Not Applicable'];
  }, []);

  // Available authors for filter dropdown
  const availableAuthors = useMemo(() => {
    return authors.map(author => ({
      id: author.id,
      name: author.name
    }));
  }, [authors]);

  // Filter handlers
  const handleAuthorFilterChange = (authorId: string) => {
    setAuthorFilter(prev => {
      if (prev.includes(authorId)) {
        return prev.filter(id => id !== authorId);
      } else {
        return [...prev, authorId];
      }
    });
  };

  const handleDateFilterChange = (start?: Date, end?: Date) => {
    if (!start && !end) {
      setDateFilter(null);
    } else {
      setDateFilter({ start, end });
    }
  };

  const clearAllFilters = () => {
    setAuthorFilter([]);
    setDateFilter(null);
  };

  const operations = {
    handlePhaseDeadlineChange: (phaseId: string, date: Date | undefined) => {
      baseHandlePhaseDeadlineChange(phaseId, date, phases, () => {
        // Phase update callback
      });
    },
    handleDocumentStatusChange: (phaseId: string, documentId: string, status: string) => {
      baseHandleDocumentStatusChange(phaseId, documentId, status, phases, () => {
        // Status update callback
      });
    },
    handleDocumentDeadlineChange: (phaseId: string, documentId: string, date: Date | undefined) => {
      baseHandleDocumentDeadlineChange(phaseId, documentId, date, phases, () => {
        // Deadline update callback
      });
    },
    // Filter operations
    authorFilter,
    onAuthorFilterChange: handleAuthorFilterChange,
    dateFilter,
    onDateFilterChange: handleDateFilterChange,
    clearAllFilters,
    // Available options
    availableAuthors,
    availablePhases,
    availableStatuses
  };

  return <>{children(operations)}</>;
}
