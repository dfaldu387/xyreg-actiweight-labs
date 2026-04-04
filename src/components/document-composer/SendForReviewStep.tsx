import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  CheckCircle, 
  Send,
  ArrowLeft,
  User,
  Mail,
  Calendar,
  Briefcase,
  Building2,
  FileText
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { useCompanyRole } from '@/context/CompanyRoleContext';
interface DocumentControlRole {
  userId?: string;
  name: string; // This can be either a name or email address
  title: string;
  department: string;
  date: Date | string;
  signature?: string;
  email?: string; // Optional separate email field
}

interface SendForReviewStepProps {
  documentTitle?: string;
  documentControlData?: {
    prepared_by?: DocumentControlRole;
    reviewed_by?: DocumentControlRole;
    approved_by?: DocumentControlRole;
  };
  documentFileUrl?: string;
  documentFileName?: string;
  generatedTemplate?: any;
  template?: any;
  onBack: () => void;
  onSendForReview: (message: string) => Promise<void>;
}

const ROLE_LABELS = {
  prepared_by: 'Issued By',
  reviewed_by: 'Reviewed By',
  approved_by: 'Approved By'
};

// Helper function to fetch user email by user ID
const fetchUserEmailById = async (userId: string): Promise<string | null> => {
  try {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('email, first_name, last_name')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('Error fetching user email:', error);
      return null;
    }

    return data?.email || null;
  } catch (error) {
    console.error('Error fetching user email:', error);
    return null;
  }
};

// Helper function to extract email and display name from role
const getRoleEmailAndName = async (role: DocumentControlRole) => {
  // If there's a separate email field, use it
  if (role.email) {
    return {
      email: role.email,
      displayName: role.name
    };
  }
  
  // If name looks like an email address, use it as email and extract display name
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (emailRegex.test(role.name)) {
    return {
      email: role.name,
      displayName: role.name.split('@')[0] // Use part before @ as display name
    };
  }
  
  // If we have a userId, try to fetch the email from user_profiles
  if (role.userId) {
    const userEmail = await fetchUserEmailById(role.userId);
    if (userEmail) {
      return {
        email: userEmail,
        displayName: role.name
      };
    }
  }
  
  // If name is not an email and no userId email found, return null for email
  return {
    email: null,
    displayName: role.name
  };
};

export function SendForReviewStep({
  documentTitle = 'Document',
  documentControlData,
  documentFileUrl,
  documentFileName,
  generatedTemplate,
  template,
  onBack,
  onSendForReview
}: SendForReviewStepProps) {
  const [isGeneratingFile, setIsGeneratingFile] = useState(false);
  const [generatedFileInfo, setGeneratedFileInfo] = useState<{ url: string; fileName: string } | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [processedRoles, setProcessedRoles] = useState<Array<[string, DocumentControlRole & { email?: string; displayName?: string }]>>([]);
  const [isLoadingEmails, setIsLoadingEmails] = useState(false);
  const { user } = useAuth();
  const { activeCompanyRole } = useCompanyRole();

  const assignedRoles = documentControlData ? Object.entries(documentControlData).filter(
    ([_, role]) => role && role.name && role.name !== '[To be assigned]'
  ) : [];

  // Process roles and fetch emails when documentControlData changes
  useEffect(() => {
    const processRoles = async () => {
      if (assignedRoles.length === 0) {
        setProcessedRoles([]);
        return;
      }

      setIsLoadingEmails(true);
      try {
        const processed = await Promise.all(
          assignedRoles.map(async ([roleType, role]) => {
            const { email, displayName } = await getRoleEmailAndName(role);
            return [roleType, { ...role, email, displayName }] as [string, DocumentControlRole & { email?: string; displayName?: string }];
          })
        );
        setProcessedRoles(processed);
      } catch (error) {
        console.error('Error processing roles:', error);
        // Fallback to original roles without email processing
        setProcessedRoles(assignedRoles.map(([roleType, role]) => [roleType, { ...role, displayName: role.name }]));
      } finally {
        setIsLoadingEmails(false);
      }
    };

    processRoles();
  }, [documentControlData]);


  // Save Draft - Generate document file
  const handleSaveDraft = async () => {
    if (!generatedTemplate && !template) {
      toast.error('No document template available to generate file');
      return;
    }

    setIsGeneratingFile(true);
    try {
      const { DocumentFileGenerationService } = await import('@/services/documentFileGenerationService');
      const currentTemplate = generatedTemplate || template;
      if (!currentTemplate || !activeCompanyRole?.companyId) {
        throw new Error('Missing template or company information');
      }
      
      const result = await DocumentFileGenerationService.generateDocumentFile(
        currentTemplate,
        activeCompanyRole.companyId,
        {
          format: 'docx',
          filename: `${currentTemplate.name.replace(/[^a-zA-Z0-9]/g, '_')}_Draft_${new Date().toISOString().split('T')[0]}.docx`
        }
      );
      
      if (result.success && result.fileUrl) {
        setGeneratedFileInfo({ url: result.fileUrl, fileName: result.fileName || 'Document.docx' });
        toast.success('Draft saved successfully!', {
          description: `Document file generated and ready for sharing`
        });
       } else {
        throw new Error(result.error || 'Failed to generate document file');
      }
      
    } catch (error) {
      console.error('❌ Error saving draft:', error);
      toast.error('Failed to save draft', {
        description: error instanceof Error ? error.message : 'Unknown error occurred'
      });
    } finally {
      setIsGeneratingFile(false);
    }
  };

  // Generate document file URL if not available
  const getDocumentFileInfo = async () => {
    // First check if we have a generated file from Save Draft
    if (generatedFileInfo) {
      return generatedFileInfo;
    }
    
    // Then check if we have file info from props
    if (documentFileUrl && documentFileName) {
      return { url: documentFileUrl, fileName: documentFileName };
    }

    // If no file URL is available, generate one from the current template
    if (generatedTemplate || template) {
      try {
        
        const { DocumentFileGenerationService } = await import('@/services/documentFileGenerationService');
        
        const currentTemplate = generatedTemplate || template;
        if (!currentTemplate || !activeCompanyRole?.companyId) {
          return null;
        }
        
        const result = await DocumentFileGenerationService.generateDocumentFile(
          currentTemplate,
          activeCompanyRole.companyId,
          {
            format: 'docx',
            filename: `${currentTemplate.name.replace(/[^a-zA-Z0-9]/g, '_')}_${new Date().toISOString().split('T')[0]}.docx`
          }
        );
        
        if (result.success && result.fileUrl) {
          return { url: result.fileUrl, fileName: result.fileName };
        } else {
          console.error('❌ Failed to generate document file:', result.error);
          return null;
        }
        
      } catch (error) {
        console.error('❌ Error generating document file:', error);
        return null;
      }
    }

    // If no template is available, return null
    return null;
  };

  const handleSendEmail = async (roleType: string, role: DocumentControlRole & { email?: string; displayName?: string }) => {
    const email = role.email;
    const displayName = role.displayName || role.name;
    
    if (!email) {
      toast.error(`No email address found for ${displayName}. Please add an email address in the Finalize step.`);
      return;
    }

    try {
        // toast.loading(`Sending document to ${displayName}...`);
      
      // Get document file information
      const fileInfo = await getDocumentFileInfo();
      
      const { data, error } = await supabase.functions.invoke('send-document-review-email', {
        body: {
          recipientEmail: email,
          recipientName: displayName,
          documentTitle: documentTitle,
          roleType: roleType,
          roleLabel: ROLE_LABELS[roleType as keyof typeof ROLE_LABELS],
          senderName: user?.user_metadata?.first_name || user?.email || 'Document Manager',
          companyName: activeCompanyRole?.companyName || 'Your Company',
          dueDate: role.date ? new Date(role.date).toISOString() : undefined,
          documentLink: window.location.href, // Current document URL
          documentFileUrl: fileInfo?.url, // Direct document file URL
          documentFileName: fileInfo?.fileName // Document file name
        }
      });

      if (error) {
        throw error;
      }

      if (data?.success) {
        toast.success(`Document sent successfully to ${displayName}!`);
      } else {
        throw new Error(data?.error || 'Failed to send email');
      }
    } catch (error) {
      console.error('Error sending email:', error);
      toast.error(`Failed to send document to ${displayName}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleSendAllEmails = async () => {
    const rolesWithEmails = processedRoles.filter(([_, role]) => role.email);
    
    if (rolesWithEmails.length === 0) {
      toast.error('No email addresses found for any assigned roles. Please add email addresses in the Finalize step.');
      return;
    }

    setIsSending(true);
    try {
      const emailPromises = rolesWithEmails.map(([roleType, role]) => 
        handleSendEmail(roleType, role)
      );
      
      await Promise.all(emailPromises);
      toast.success(`Documents sent to ${rolesWithEmails.length} recipient(s)!`);
    } catch (error) {
      toast.error('Failed to send some documents');
    } finally {
      setIsSending(false);
    }
  };

  const handleSend = async () => {
    if (processedRoles.length === 0) {
      toast.error('Please assign at least one person in the Finalize step before sending for review');
      return;
    }

    setIsSending(true);
    try {
      await onSendForReview('');
      toast.success('Document sent successfully!');
    } catch (error) {
      toast.error('Failed to send document');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      {/* <div>
        <h3 className="text-2xl font-semibold mb-2">Send for Review</h3>
        <p className="text-muted-foreground">
          Review assigned roles and send the document for review and approval.
        </p>
      </div> */}

      {/* Document Summary */}
      {/* <Card>
        <CardContent className="p-6">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <CheckCircle className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1">
              <h4 className="font-medium mb-1">Document Ready for Review</h4>
              <p className="text-sm text-muted-foreground">
                "{documentTitle}" is ready to be sent for review and approval.
              </p>
              {processedRoles.length > 0 && (
                <Badge variant="secondary" className="mt-2">
                  {processedRoles.length} {processedRoles.length === 1 ? 'person' : 'people'} assigned
                </Badge>
              )}
            </div>
          </div>
        </CardContent>
      </Card> */}

      {/* Assigned Roles Table */}
      {processedRoles.length > 0 && (
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4 mt-4">
              <h4 className="font-medium flex items-center gap-2">
                <User className="w-4 h-4" />
                Assigned Roles
              </h4>
              {processedRoles.some(([_, role]) => role.email) && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSendAllEmails}
                  disabled={isSending}
                  className="flex items-center gap-2"
                >
                  <Mail className="w-4 h-4" />
                  Send All Documents
                </Button>
              )}
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Role</TableHead>
                  <TableHead>Person</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="w-20 text-center">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoadingEmails ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                        <span className="text-muted-foreground">Loading user emails...</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  processedRoles.map(([roleType, role]) => {
                    const email = role.email;
                    const displayName = role.displayName || role.name;
                    
                    return (
                    <TableRow key={roleType}>
                      <TableCell className="font-medium">
                        {ROLE_LABELS[roleType as keyof typeof ROLE_LABELS]}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-muted-foreground" />
                          <div>
                            <div className="font-medium">{displayName}</div>
                            {email ? (
                              <div className="text-sm text-muted-foreground">{email}</div>
                            ) : (
                              <div className="text-sm text-destructive">No email address</div>
                            )}
                          </div>
                        </div>
                      </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Briefcase className="w-4 h-4 text-muted-foreground" />
                        <span>{role.title}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-muted-foreground" />
                        <span>{role.department}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm">
                          {role.date ? format(new Date(role.date), 'MMM dd, yyyy') : 'Not set'}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleSendEmail(roleType, role)}
                        disabled={!email}
                        className="h-8 w-8 p-0 cursor-pointer"
                        title={email ? `Send email to ${displayName}` : `No email address for ${displayName}`}
                      >
                        <Mail className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}


      {/* Warning if no roles assigned */}
      {processedRoles.length === 0 && !isLoadingEmails && (
        <Card className="border-destructive/50 bg-destructive/5">
          <CardContent className="p-6">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-destructive/10 rounded-lg">
                <User className="w-5 h-5 text-destructive" />
              </div>
              <div className="flex-1">
                <h4 className="font-medium text-destructive mb-1">No Roles Assigned</h4>
                <p className="text-sm text-muted-foreground">
                  Please go back to the Finalize step and assign at least one person to a document control role before sending for review.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Actions */}
      <div className="flex justify-between items-center pt-4">
        <Button
          variant="outline"
          onClick={onBack}
          disabled={isSending || isGeneratingFile}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Finalize
        </Button>
        
        <div className="flex items-center gap-3">
          <Button
            variant="secondary"
            onClick={handleSaveDraft}
            disabled={isSending || isGeneratingFile}
            className="flex items-center gap-2"
          >
            {isGeneratingFile ? (
              <>
                <div className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <FileText className="w-4 h-4" />
                Save Draft
              </>
            )}
          </Button>
          
          <Button
            onClick={handleSend}
            disabled={isSending || isGeneratingFile || processedRoles.length === 0}
            className="flex items-center gap-2"
          >
            {isSending ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                Send Document
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
