import { supabase } from '@/integrations/supabase/client';

export interface ExtractedTemplateRole {
  role: string;
  context: string;
  section: string;
}

export class TemplateRoleReplacementService {
  /**
   * Extract role placeholders from template content
   */
  static extractTemplateRoles(content: string): ExtractedTemplateRole[] {
    
    const roles: ExtractedTemplateRole[] = [];
    const lines = content.split('\n');
    
    // Enhanced patterns to catch role placeholders in medical device documents
    const rolePatterns = [
      // Pattern 1: [Name, Title] format - captures "Title" part (but skip examples in parentheses)
      /\[([^,\]]+),\s*([^\]]+?)\s*(?:\([^)]*\))?\]/gi,
      // Pattern 2: Direct role references like [Head of Quality Assurance]
      /\[([^\]]*(?:Head of [A-Za-z\s]+|Manager|Director|Officer|Engineer|Specialist|Representative|Lead|Quality|Regulatory|Clinical|Manufacturing|Risk|Safety|Compliance|Authorized|Responsible|Person)[^\]]*)\]/gi,
      // Pattern 3: Table content with roles - look for "Role | Responsibilities" tables
      /^([A-Za-z\s]+(?:Manager|Director|Officer|Engineer|Specialist|Representative|Lead|Head|Quality|Regulatory|Clinical|Manufacturing|Risk|Safety|Compliance|Authorized|Responsible|Person)[A-Za-z\s]*)\s*\|/gm,
      // Pattern 4: [To be assigned] or similar placeholders
      /\[([Tt]o\s+be\s+(?:assigned|determined|filled|appointed)[^\]]*)\]/gi
    ];

    lines.forEach((line, lineIndex) => {
      
      
      rolePatterns.forEach((pattern, patternIndex) => {
        pattern.lastIndex = 0; // Reset regex state
        let match;
        while ((match = pattern.exec(line)) !== null) {
          let extractedRole = '';
          
          if (patternIndex === 0 && match[2]) {
            // [Name, Title] format - extract the title part but ignore examples
            const titlePart = match[2].trim();
            // Skip if this is just an example in parentheses
            if (!titlePart.startsWith('e.g.,')) {
              extractedRole = titlePart.replace(/\s*\([^)]*\)/, '').trim();
            }
          } else if (patternIndex === 2) {
            // Table format - extract role from start of line before |
            extractedRole = match[1].trim();
          } else {
            // Direct role format or other patterns
            extractedRole = match[1].trim();
          }
          
          
          
          if (extractedRole && this.isValidRole(extractedRole)) {
            const existingRole = roles.find(r => 
              r.role.toLowerCase() === extractedRole.toLowerCase()
            );
            
            if (!existingRole) {
              
              roles.push({
                role: extractedRole,
                context: this.getContext(lines, lineIndex),
                section: this.getSection(lines, lineIndex)
              });
            }
          }
        }
      });
    });

    
    return roles.sort((a, b) => a.role.localeCompare(b.role));
  }

  /**
   * Check if a string is a valid role title
   */
  private static isValidRole(text: string): boolean {
    if (!text || text.length < 2 || text.length > 100) return false;
    
    // Must contain letters
    if (!/[a-zA-Z]/.test(text)) return false;
    
    // Should not be just numbers or special characters
    if (/^[^a-zA-Z]*$/.test(text)) return false;
    
    // Skip common non-role placeholders
    const skipPatterns = [
      /^(date|time|version|number|page|section|document|file|name)$/i,
      /^(yes|no|n\/a|tbd|tba)$/i,
      /^[0-9\s\-\/\.]+$/
    ];
    
    if (skipPatterns.some(pattern => pattern.test(text.trim()))) {
      return false;
    }
    
    // Role keywords that indicate this is likely a role
    const roleKeywords = [
      'manager', 'director', 'officer', 'engineer', 'specialist', 'representative',
      'lead', 'head', 'quality', 'regulatory', 'clinical', 'manufacturing',
      'risk', 'safety', 'compliance', 'authorized', 'responsible', 'person',
      'coordinator', 'supervisor', 'analyst', 'technician', 'administrator',
      'to be assigned', 'to be determined', 'to be filled', 'to be appointed'
    ];
    
    const lowerText = text.toLowerCase();
    return roleKeywords.some(keyword => lowerText.includes(keyword));
  }

  /**
   * Get context around a line for better understanding
   */
  private static getContext(lines: string[], lineIndex: number): string {
    const start = Math.max(0, lineIndex - 2);
    const end = Math.min(lines.length, lineIndex + 3);
    return lines.slice(start, end).join(' ').trim();
  }

  /**
   * Determine what section this role appears in
   */
  private static getSection(lines: string[], lineIndex: number): string {
    // Look backwards for a heading
    for (let i = lineIndex; i >= 0; i--) {
      const line = lines[i].trim();
      // Check for markdown headings or bold text that might be sections
      if (line.match(/^#+\s+(.+)/) || line.match(/^\*\*(.+)\*\*/) || line.match(/^[A-Z\s]+:$/)) {
        return line.replace(/^#+\s+/, '').replace(/^\*\*|\*\*$/g, '').replace(/:$/, '');
      }
    }
    return 'Document';
  }

  /**
   * Simple extraction for backwards compatibility
   */
  static extractTemplateRolesSimple(content: string): string[] {
    return this.extractTemplateRoles(content).map(role => role.role);
  }
}