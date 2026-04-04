
import { AuditLogEntry } from '@/types/auditLog';
import { ProductAuditLogService } from '@/services/productAuditLogService';

// Action type classifications for color coding and icons
export const getActionTypeConfig = (actionType: string) => {
  const lowerAction = actionType.toLowerCase();

  // Positive actions - green
  if (lowerAction.includes('upload') || lowerAction.includes('created') ||
    lowerAction.includes('approved') || lowerAction.includes('completed')) {
    return { color: 'text-green-600', bgColor: 'bg-green-50', iconType: 'positive' };
  }

  // Destructive actions - red  
  if (lowerAction.includes('delete') || lowerAction.includes('remove')) {
    return { color: 'text-red-600', bgColor: 'bg-red-50', iconType: 'destructive' };
  }

  // Status changes - orange
  if (lowerAction.includes('status') || lowerAction.includes('changed') ||
    lowerAction.includes('updated')) {
    return { color: 'text-orange-600', bgColor: 'bg-orange-50', iconType: 'status' };
  }

  // Informational actions - blue (default)
  return { color: 'text-blue-600', bgColor: 'bg-blue-50', iconType: 'info' };
};

// CSV export functionality
export const exportToCSV = (logs: any[], filename: string = 'audit-logs') => {
  // Define CSV headers
  const headers = [
    'Timestamp',
    'Action',
    'Entity Type',
    'Entity Name',
    'User Name',
    'User Email',
    'Description',
    'IP Address'
  ];

  // Convert logs to CSV rows
  const csvRows = [
    headers.join(','),
    ...logs.map(log => [
      `"${log.timestamp ? new Date(log.timestamp).toISOString() : ''}"`,
      `"${log.action || ''}"`,
      `"${log.entityType || ''}"`,
      `"${log.entityName || ''}"`,
      `"${log.userName || ''}"`,
      `"${log.userEmail || ''}"`,
      `"${log.description || ''}"`,
      `"${log.ipAddress || ''}"`
    ].join(','))
  ];

  // Create and download CSV file
  const csvContent = csvRows.join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');

  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
};

export interface AuditLogData {
  productId: string;
  companyId: string;
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'VIEW' | 'DOWNLOAD' | 'SHARE' | 'EXPORT';
  entityType: 'DOCUMENT' | 'IMAGE' | 'PRODUCT' | 'CONFIGURATION' | 'REVIEW' | 'COMMENT';
  entityName: string;
  description: string;
  changes?: {
    field: string;
    oldValue?: string;
    newValue?: string;
  }[];
  sessionId?: string;
  durationSeconds?: number;
  metadata?: Record<string, any>;
}

/**
 * Create an audit log entry
 */
export async function createAuditLog(data: AuditLogData): Promise<void> {
  try {
    await ProductAuditLogService.createProductAuditLog(data);
  } catch (error) {
    console.error('Failed to create audit log:', error);
    // Don't throw error to avoid breaking the main functionality
  }
}

/**
 * Create audit log for document actions
 */
export async function logDocumentAction(
  productId: string,
  companyId: string,
  action: AuditLogData['action'],
  documentName: string,
  description: string,
  changes?: AuditLogData['changes'],
  metadata?: Record<string, any>
): Promise<void> {
  await createAuditLog({
    productId,
    companyId,
    action,
    entityType: 'DOCUMENT',
    entityName: documentName,
    description,
    changes,
    metadata
  });
}

/**
 * Create audit log for image actions
 */
export async function logImageAction(
  productId: string,
  companyId: string,
  action: AuditLogData['action'],
  imageName: string,
  description: string,
  changes?: AuditLogData['changes'],
  metadata?: Record<string, any>
): Promise<void> {
  await createAuditLog({
    productId,
    companyId,
    action,
    entityType: 'IMAGE',
    entityName: imageName,
    description,
    changes,
    metadata
  });
}

/**
 * Create audit log for product configuration actions
 */
export async function logProductConfigurationAction(
  productId: string,
  companyId: string,
  action: AuditLogData['action'],
  configName: string,
  description: string,
  changes?: AuditLogData['changes'],
  metadata?: Record<string, any>
): Promise<void> {
  await createAuditLog({
    productId,
    companyId,
    action,
    entityType: 'CONFIGURATION',
    entityName: configName,
    description,
    changes,
    metadata
  });
}

/**
 * Create audit log for review actions
 */
export async function logReviewAction(
  productId: string,
  companyId: string,
  action: AuditLogData['action'],
  reviewName: string,
  description: string,
  changes?: AuditLogData['changes'],
  metadata?: Record<string, any>
): Promise<void> {
  await createAuditLog({
    productId,
    companyId,
    action,
    entityType: 'REVIEW',
    entityName: reviewName,
    description,
    changes,
    metadata
  });
}

/**
 * Create audit log for comment actions
 */
export async function logCommentAction(
  productId: string,
  companyId: string,
  action: AuditLogData['action'],
  commentContext: string,
  description: string,
  changes?: AuditLogData['changes'],
  metadata?: Record<string, any>
): Promise<void> {
  await createAuditLog({
    productId,
    companyId,
    action,
    entityType: 'COMMENT',
    entityName: commentContext,
    description,
    changes,
    metadata
  });
}

/**
 * Create audit log for product actions
 */
export async function logProductAction(
  productId: string,
  companyId: string,
  action: AuditLogData['action'],
  productName: string,
  description: string,
  changes?: AuditLogData['changes'],
  metadata?: Record<string, any>
): Promise<void> {
  await createAuditLog({
    productId,
    companyId,
    action,
    entityType: 'PRODUCT',
    entityName: productName,
    description,
    changes,
    metadata
  });
}

/**
 * Generate session ID for tracking user sessions
 */
export function generateSessionId(): string {
  return ProductAuditLogService.generateSessionId();
}

/**
 * Create changes array from old and new values
 */
export function createChangesArray(
  changes: Record<string, { oldValue?: any; newValue?: any }>
): AuditLogData['changes'] {
  return Object.entries(changes).map(([field, values]) => ({
    field,
    oldValue: values.oldValue?.toString(),
    newValue: values.newValue?.toString()
  }));
}

/**
 * Log document creation
 */
export async function logDocumentCreated(
  productId: string,
  companyId: string,
  documentName: string,
  metadata?: Record<string, any>
): Promise<void> {
  await logDocumentAction(
    productId,
    companyId,
    'CREATE',
    documentName,
    `Created new document: ${documentName}`,
    undefined,
    metadata
  );
}

/**
 * Log document update
 */
export async function logDocumentUpdated(
  productId: string,
  companyId: string,
  documentName: string,
  changes: Record<string, { oldValue?: any; newValue?: any }>,
  metadata?: Record<string, any>
): Promise<void> {
  await logDocumentAction(
    productId,
    companyId,
    'UPDATE',
    documentName,
    `Updated document: ${documentName}`,
    createChangesArray(changes),
    metadata
  );
}

/**
 * Log document deletion
 */
export async function logDocumentDeleted(
  productId: string,
  companyId: string,
  documentName: string,
  metadata?: Record<string, any>
): Promise<void> {
  await logDocumentAction(
    productId,
    companyId,
    'DELETE',
    documentName,
    `Deleted document: ${documentName}`,
    undefined,
    metadata
  );
}

/**
 * Log image upload
 */
export async function logImageUploaded(
  productId: string,
  companyId: string,
  imageName: string,
  metadata?: Record<string, any>
): Promise<void> {
  await logImageAction(
    productId,
    companyId,
    'CREATE',
    imageName,
    `Uploaded image: ${imageName}`,
    undefined,
    metadata
  );
}

/**
 * Log image update
 */
export async function logImageUpdated(
  productId: string,
  companyId: string,
  imageName: string,
  changes: Record<string, { oldValue?: any; newValue?: any }>,
  metadata?: Record<string, any>
): Promise<void> {
  await logImageAction(
    productId,
    companyId,
    'UPDATE',
    imageName,
    `Updated image: ${imageName}`,
    createChangesArray(changes),
    metadata
  );
}

/**
 * Log image deletion
 */
export async function logImageDeleted(
  productId: string,
  companyId: string,
  imageName: string,
  metadata?: Record<string, any>
): Promise<void> {
  await logImageAction(
    productId,
    companyId,
    'DELETE',
    imageName,
    `Deleted image: ${imageName}`,
    undefined,
    metadata
  );
}

/**
 * Log product configuration change
 */
export async function logProductConfigurationChanged(
  productId: string,
  companyId: string,
  configName: string,
  changes: Record<string, { oldValue?: any; newValue?: any }>,
  metadata?: Record<string, any>
): Promise<void> {
  await logProductConfigurationAction(
    productId,
    companyId,
    'UPDATE',
    configName,
    `Updated product configuration: ${configName}`,
    createChangesArray(changes),
    metadata
  );
}

/**
 * Log review creation
 */
export async function logReviewCreated(
  productId: string,
  companyId: string,
  reviewName: string,
  metadata?: Record<string, any>
): Promise<void> {
  await logReviewAction(
    productId,
    companyId,
    'CREATE',
    reviewName,
    `Created review: ${reviewName}`,
    undefined,
    metadata
  );
}

/**
 * Log review completion
 */
export async function logReviewCompleted(
  productId: string,
  companyId: string,
  reviewName: string,
  metadata?: Record<string, any>
): Promise<void> {
  await logReviewAction(
    productId,
    companyId,
    'UPDATE',
    reviewName,
    `Completed review: ${reviewName}`,
    undefined,
    metadata
  );
}

/**
 * Log comment addition
 */
export async function logCommentAdded(
  productId: string,
  companyId: string,
  commentContext: string,
  commentText: string,
  metadata?: Record<string, any>
): Promise<void> {
  await logCommentAction(
    productId,
    companyId,
    'CREATE',
    commentContext,
    `Added comment: ${commentText.substring(0, 100)}${commentText.length > 100 ? '...' : ''}`,
    undefined,
    metadata
  );
}

/**
 * Log document view
 */
export async function logDocumentViewed(
  productId: string,
  companyId: string,
  documentName: string,
  sessionId?: string,
  durationSeconds?: number,
  metadata?: Record<string, any>
): Promise<void> {
  await logDocumentAction(
    productId,
    companyId,
    'VIEW',
    documentName,
    `Viewed document: ${documentName}`,
    undefined,
    { ...metadata, sessionId, durationSeconds }
  );
}

/**
 * Log document download
 */
export async function logDocumentDownloaded(
  productId: string,
  companyId: string,
  documentName: string,
  metadata?: Record<string, any>
): Promise<void> {
  await logDocumentAction(
    productId,
    companyId,
    'DOWNLOAD',
    documentName,
    `Downloaded document: ${documentName}`,
    undefined,
    metadata
  );
}

/**
 * Log document share
 */
export async function logDocumentShared(
  productId: string,
  companyId: string,
  documentName: string,
  shareMethod: string,
  metadata?: Record<string, any>
): Promise<void> {
  await logDocumentAction(
    productId,
    companyId,
    'SHARE',
    documentName,
    `Shared document: ${documentName} via ${shareMethod}`,
    undefined,
    metadata
  );
}

/**
 * Log export action
 */
export async function logExportAction(
  productId: string,
  companyId: string,
  exportType: string,
  exportFormat: string,
  metadata?: Record<string, any>
): Promise<void> {
  await createAuditLog({
    productId,
    companyId,
    action: 'EXPORT',
    entityType: 'PRODUCT',
    entityName: `Product Export`,
    description: `Exported ${exportType} in ${exportFormat} format`,
    metadata
  });
}
