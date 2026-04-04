import { DocumentTemplate, DocumentSection, DocumentContent } from '@/types/documentComposer';

interface RoleMapping {
  templateRole: string;
  companyRole: string;
  department: string;
  assignedPerson?: string;
}

export class DocumentRoleFillingService {
  /**
   * Fill template roles in document content with actual company roles/people
   */
  static fillDocumentRoles(
    template: DocumentTemplate, 
    mappings: RoleMapping[]
  ): DocumentTemplate {
    if (!mappings.length) return template;

    // Create a mapping lookup for efficient replacement
    const roleMappingLookup = new Map<string, RoleMapping>();
    mappings.forEach(mapping => {
      roleMappingLookup.set(mapping.templateRole.toLowerCase(), mapping);
    });

    // Clone the template to avoid mutations
    const filledTemplate: DocumentTemplate = {
      ...template,
      sections: template.sections.map(section => this.fillSectionRoles(section, roleMappingLookup))
    };

    return filledTemplate;
  }

  /**
   * Fill roles in a document section
   */
  private static fillSectionRoles(
    section: DocumentSection, 
    mappings: Map<string, RoleMapping>
  ): DocumentSection {
    return {
      ...section,
      content: section.content.map(content => this.fillContentRoles(content, mappings))
    };
  }

  /**
   * Fill roles in document content
   */
  private static fillContentRoles(
    content: DocumentContent, 
    mappings: Map<string, RoleMapping>
  ): DocumentContent {
    let filledContent = content.content;
    let hasReplacements = false;

    console.log('Filling roles in content:', content.content.substring(0, 200) + '...');
    console.log('Available mappings:', Array.from(mappings.entries()));

    // Pattern to match role placeholders: [Name, Title] or [Name, Title (e.g., Head of Quality)]
    const rolePatterns = [
      // Primary pattern: [Name, Title]
      /\[([^,\]]+),\s*([^\]]+?)\s*(?:\([^)]*\))?\]/gi,
      // Secondary pattern: [Role Name] for direct roles
      /\[([^,\]]*(?:Manager|Director|Officer|Engineer|Specialist|Representative|Lead|Head|Quality|Regulatory|Clinical|Manufacturing|Risk|Safety|Compliance|Authorized)[^\]]*)\]/gi
    ];

    rolePatterns.forEach((pattern, patternIndex) => {
      filledContent = filledContent.replace(pattern, (match, ...groups) => {
        let roleToMatch = '';
        
        if (patternIndex === 0 && groups[1]) {
          // [Name, Title] pattern - extract the title part
          roleToMatch = groups[1].trim().replace(/\s*\([^)]*\)/, '').trim();
        } else {
          // Direct role pattern
          roleToMatch = groups[0].trim();
        }

        console.log(`Looking for mapping for role: "${roleToMatch}"`);
        const mapping = mappings.get(roleToMatch.toLowerCase());
        if (mapping) {
          hasReplacements = true;
          console.log(`Found mapping: ${roleToMatch} -> ${mapping.companyRole}`);
          
          // Format the replacement based on available information with yellow highlighting
          const replacement = mapping.assignedPerson 
            ? `${mapping.assignedPerson}, ${mapping.companyRole}`
            : `[To be assigned], ${mapping.companyRole}`;
          return `<span style="background-color: yellow; padding: 2px 4px; border-radius: 3px;">${replacement}</span>`;
        }
        
        return match; // Return original if no mapping found
      });
    });

    // NEW: Also replace role names that appear as plain text (like in tables)
    mappings.forEach((mapping, roleKey) => {
      const originalRole = mapping.templateRole;
      const replacementRole = mapping.companyRole;
      
      console.log(`Checking for plain text replacement: "${originalRole}" -> "${replacementRole}"`);
      
      // Create regex to match the role name (case insensitive, word boundaries)
      const plainTextPattern = new RegExp(`\\b${originalRole.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi');
      
      const beforeReplace = filledContent;
      filledContent = filledContent.replace(plainTextPattern, (match) => {
        console.log(`Replacing plain text role: "${match}" -> "${replacementRole}"`);
        hasReplacements = true;
        // Wrap replacement in span with yellow background for highlighting
        return `<span style="background-color: yellow; padding: 2px 4px; border-radius: 3px;">${replacementRole}</span>`;
      });
      
      if (beforeReplace !== filledContent) {
        console.log(`Plain text replacement made for: ${originalRole}`);
      }
    });

    return {
      ...content,
      content: filledContent,
      metadata: {
        ...content.metadata,
        companyDataUsed: hasReplacements || content.metadata?.companyDataUsed || false,
        lastModified: hasReplacements ? new Date() : content.metadata?.lastModified || new Date(),
        author: hasReplacements ? 'ai' : content.metadata?.author || 'user',
        isHighlighted: hasReplacements,
        requiresAttention: false,
        
      }
    };
  }

  /**
   * Extract all role placeholders from document content for analysis
   */
  static extractRolePlaceholders(template: DocumentTemplate): string[] {
    const placeholders = new Set<string>();
    
    template.sections.forEach(section => {
      section.content.forEach(content => {
        const rolePatterns = [
          /\[([^,\]]+),\s*([^\]]+?)\s*(?:\([^)]*\))?\]/gi,
          /\[([^,\]]*(?:Manager|Director|Officer|Engineer|Specialist|Representative|Lead|Head|Quality|Regulatory|Clinical|Manufacturing|Risk|Safety|Compliance|Authorized)[^\]]*)\]/gi
        ];

        rolePatterns.forEach(pattern => {
          let match;
          while ((match = pattern.exec(content.content)) !== null) {
            placeholders.add(match[0]); // Add the full placeholder
          }
        });
      });
    });

    return Array.from(placeholders);
  }

  /**
   * Check if document has unfilled role placeholders
   */
  static hasUnfilledRoles(template: DocumentTemplate): boolean {
    return this.extractRolePlaceholders(template).length > 0;
  }

  /**
   * Get statistics about role filling progress
   */
  static getRoleFillStats(template: DocumentTemplate, mappings: RoleMapping[]): {
    totalRoles: number;
    filledRoles: number;
    pendingRoles: number;
    completionPercentage: number;
  } {
    const placeholders = this.extractRolePlaceholders(template);
    const totalRoles = placeholders.length;
    const filledRoles = mappings.filter(m => m.assignedPerson).length;
    const pendingRoles = totalRoles - filledRoles;
    
    return {
      totalRoles,
      filledRoles,
      pendingRoles,
      completionPercentage: totalRoles > 0 ? Math.round((filledRoles / totalRoles) * 100) : 100
    };
  }
}