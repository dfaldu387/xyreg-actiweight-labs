import { supabase } from '@/integrations/supabase/client';
import { DocumentExportService, ExportOptions } from './documentExportService';
import { DocumentTemplate, DocumentSection } from '@/types/documentComposer';
import { format } from 'date-fns';

export interface ProductDefinitionExportData {
  // General Information
  name: string;
  model_reference: string;
  description: string;
  device_category: string;
  product_platform: string;
  key_features: string[];
  device_components: Array<{ name: string; description: string }>;
  intended_use: string;
  
  // UDI Information
  basic_udi_di: string;
  udi_di: string;
  udi_pi: string;
  gtin: string;
  
  // Device Characteristics
  device_type: any;
  key_technology_characteristics: any;
  
  // Intended Use & Claims
  intended_purpose_data: any;
  intended_users: string[];
  clinical_benefits: string[];
  contraindications: string[];
  user_instructions: any;
  
  // Regulatory Information
  markets: any[];
  regulatory_status: string;
  eudamed_registration_number: string;
  registration_status: string;
  registration_date: string;
  notified_body: string;
  conformity_assessment_route: string;
  
  // Media
  images: string[];
  videos: string[];
  
  // Metadata
  inserted_at: string;
  updated_at: string;
  current_lifecycle_phase: string;
}

export class ProductDefinitionExportService {
  /**
   * Export product definition to DOCX format
   */
  static async exportProductDefinition(
    productId: string, 
    companyId: string,
    options: Partial<ExportOptions> = {}
  ): Promise<void> {
    console.log('Starting product definition export for product:', productId);
    
    // Fetch product data
    const productData = await this.fetchProductData(productId, companyId);
    if (!productData) {
      throw new Error('Product not found or access denied');
    }
    
    console.log('Fetched product data for export:', productData);
    
    // Create document template
    const template = this.createDocumentTemplate(productData);
    
    // Export using existing DocumentExportService
    const exportOptions: ExportOptions = {
      format: 'docx',
      filename: `Product_Definition_${productData.name.replace(/[^a-zA-Z0-9]/g, '_')}_${format(new Date(), 'yyyy-MM-dd')}.docx`,
      ...options
    };
    
    await DocumentExportService.exportDocument(template, exportOptions);
  }
  
  /**
   * Fetch comprehensive product data from database
   */
  private static async fetchProductData(productId: string, companyId: string): Promise<ProductDefinitionExportData | null> {
    const { data, error } = await supabase
      .from('products')
      .select(`
        name,
        model_reference,
        description,
        device_category,
        product_platform,
        key_features,
        device_components,
        intended_use,
        basic_udi_di,
        udi_di,
        udi_pi,
        gtin,
        device_type,
        key_technology_characteristics,
        intended_purpose_data,
        intended_users,
        clinical_benefits,
        contraindications,
        user_instructions,
        markets,
        regulatory_status,
        eudamed_registration_number,
        registration_status,
        registration_date,
        notified_body,
        conformity_assessment_route,
        images,
        videos,
        inserted_at,
        updated_at,
        current_lifecycle_phase
      `)
      .eq('id', productId)
      .eq('company_id', companyId)
      .eq('is_archived', false)
      .maybeSingle();
    
    if (error) {
      console.error('Error fetching product data for export:', error);
      throw new Error(`Failed to fetch product data: ${error.message}`);
    }
    
    return data as unknown as ProductDefinitionExportData;
  }
  
  /**
   * Create document template from product data
   */
  private static createDocumentTemplate(data: ProductDefinitionExportData): DocumentTemplate {
    const sections: DocumentSection[] = [];
    
    // Document Header
    sections.push({
      id: 'header',
      title: 'Document Control',
      order: 0,
      content: [{
        id: 'doc-control',
        type: 'table',
        content: this.createDocumentControlTable(data),
        isAIGenerated: false
      }]
    });
    
    // General Information Section
    sections.push({
      id: 'general',
      title: '1. General Information',
      order: 1,
      content: [
        {
          id: 'product-overview',
          type: 'paragraph',
          content: `
            <h3>Product Overview</h3>
            <p><strong>Product Name:</strong> ${data.name || 'Not specified'}</p>
            <p><strong>Model/Reference:</strong> ${data.model_reference || 'Not specified'}</p>
            <p><strong>Description:</strong> ${data.description || 'Not specified'}</p>
            <p><strong>Device Category:</strong> ${data.device_category || 'Not specified'}</p>
            <p><strong>Product Platform:</strong> ${data.product_platform || 'Not specified'}</p>
          `,
          isAIGenerated: false
        },
        {
          id: 'key-features',
          type: 'paragraph',
          content: this.createKeyFeaturesSection(data.key_features),
          isAIGenerated: false
        },
        {
          id: 'device-components',
          type: 'table',
          content: this.createDeviceComponentsTable(data.device_components),
          isAIGenerated: false
        }
      ]
    });
    
    // UDI Information Section
    sections.push({
      id: 'udi',
      title: '2. Unique Device Identification (UDI)',
      order: 2,
      content: [{
        id: 'udi-table',
        type: 'table',
        content: this.createUDITable(data),
        isAIGenerated: false
      }]
    });
    
    // Device Characteristics Section
    sections.push({
      id: 'characteristics',
      title: '3. Device Characteristics',
      order: 3,
      content: [{
        id: 'characteristics-table',
        type: 'table',
        content: this.createCharacteristicsTable(data),
        isAIGenerated: false
      }]
    });
    
    // Intended Use & Claims Section
    sections.push({
      id: 'intended-use',
      title: '4. Intended Use & Claims',
      order: 4,
      content: [
        {
          id: 'intended-use-statement',
          type: 'paragraph',
          content: `
            <h3>Intended Use Statement</h3>
            <p>${data.intended_use || 'Not specified'}</p>
          `,
          isAIGenerated: false
        },
        {
          id: 'clinical-info',
          type: 'table',
          content: this.createClinicalInfoTable(data),
          isAIGenerated: false
        }
      ]
    });
    
    // Regulatory Information Section
    sections.push({
      id: 'regulatory',
      title: '5. Regulatory Information',
      order: 5,
      content: [{
        id: 'regulatory-table',
        type: 'table',
        content: this.createRegulatoryTable(data),
        isAIGenerated: false
      }]
    });
    
    // Media Section
    if (data.images?.length > 0 || data.videos?.length > 0) {
      sections.push({
        id: 'media',
        title: '6. Product Media',
        order: 6,
        content: [{
          id: 'media-list',
          type: 'paragraph',
          content: this.createMediaSection(data),
          isAIGenerated: false
        }]
      });
    }
    
    return {
      id: `product-definition-${Date.now()}`,
      name: `Product Definition - ${data.name}`,
      type: 'Product Definition',
      sections,
      metadata: {
        version: '1.0',
        lastUpdated: new Date(),
        estimatedCompletionTime: '30 minutes'
      },
      productContext: {
        id: data.name,
        name: data.name,
        riskClass: 'Unknown',
        phase: data.current_lifecycle_phase || 'Unknown',
        description: data.description || '',
        regulatoryRequirements: []
      }
    };
  }
  
  private static createDocumentControlTable(data: ProductDefinitionExportData): string {
    console.log('Creating document control table with data:', data);
    return `
      | **Field** | **Value** |
      |-----------|-----------|
      | Document Title | Product Definition - ${data.name} |
      | Document Type | Product Definition |
      | Product Name | ${data.name || 'Not specified'} |
      | Model Reference | ${data.model_reference || 'Not specified'} |
      | Version | 1.0 |
      | Created Date | ${format(new Date(data.inserted_at), 'yyyy-MM-dd')} |
      | Last Updated | ${format(new Date(data.updated_at), 'yyyy-MM-dd')} |
      | Export Date | ${format(new Date(), 'yyyy-MM-dd HH:mm:ss')} |
      | Lifecycle Phase | ${data.current_lifecycle_phase || 'Not specified'} |
    `;
  }
  
  private static createKeyFeaturesSection(features: any): string {
    console.log('Creating key features section with:', features);
    
    if (!features) {
      return '<h3>Key Features</h3><p>No key features specified.</p>';
    }
    
    // Handle EUDAMED data structure
    if (features.eudamed_data) {
      let content = '<h3>Key Features</h3>';
      
      if (features.eudamed_data.trade_names) {
        content += `<p><strong>Trade Names:</strong> ${features.eudamed_data.trade_names}</p>`;
      }
      
      if (features.eudamed_data.nomenclature_codes) {
        content += `<p><strong>Nomenclature Codes:</strong> ${features.eudamed_data.nomenclature_codes}</p>`;
      }
      
      if (features.eudamed_data.eudamed_status) {
        content += `<p><strong>EUDAMED Status:</strong> ${features.eudamed_data.eudamed_status}</p>`;
      }
      
      if (features.eudamed_data.issuing_agency) {
        content += `<p><strong>Issuing Agency:</strong> ${features.eudamed_data.issuing_agency}</p>`;
      }
      
      if (features.eudamed_data.reference_number) {
        content += `<p><strong>Reference Number:</strong> ${features.eudamed_data.reference_number}</p>`;
      }
      
      return content;
    }
    
    // Handle array of features
    if (Array.isArray(features) && features.length > 0) {
      const featuresList = features.map(feature => `• ${feature}`).join('\n');
      return `<h3>Key Features</h3>\n${featuresList}`;
    }
    
    return '<h3>Key Features</h3><p>No key features specified.</p>';
  }
  
  private static createDeviceComponentsTable(components: Array<{ name: string; description: string }> = []): string {
    if (!components.length) {
      return `
        <h3>Device Components</h3>
        <p>No device components specified.</p>
      `;
    }
    
    let table = `
      <h3>Device Components</h3>
      | **Component Name** | **Description** |
      |-------------------|-----------------|
    `;
    
    components.forEach(component => {
      table += `| ${component.name || 'Unnamed'} | ${component.description || 'No description'} |\n`;
    });
    
    return table;
  }
  
  private static createUDITable(data: ProductDefinitionExportData): string {
    return `
      | **UDI Field** | **Value** |
      |---------------|-----------|
      | Basic UDI-DI | ${data.basic_udi_di || 'Not specified'} |
      | UDI-DI | ${data.udi_di || 'Not specified'} |
      | UDI-PI | ${data.udi_pi || 'Not specified'} |
      | GTIN | ${data.gtin || 'Not specified'} |
    `;
  }
  
  private static createCharacteristicsTable(data: ProductDefinitionExportData): string {
    console.log('Creating characteristics table with raw data:', {
      device_type: data.device_type,
      key_technology_characteristics: data.key_technology_characteristics,
      description: data.description,
      basic_udi_di: data.basic_udi_di,
      udi_di: data.udi_di,
      model_reference: data.model_reference,
      current_lifecycle_phase: data.current_lifecycle_phase
    });
    
    const deviceType = this.parseJsonField(data.device_type);
    const techCharacteristics = this.parseJsonField(data.key_technology_characteristics);
    
    // Extract risk class from description  
    const riskClass = data.description?.includes('Risk Class:') 
      ? data.description.split('Risk Class:')[1]?.split('.')[0]?.trim() || 'Not specified' 
      : 'Not specified';
    
    console.log('Processed characteristics:', { deviceType, techCharacteristics, riskClass });
    
    const characteristicsTable = `
      | **Characteristic** | **Value** |
      |-------------------|-----------|
      | Device Type | ${typeof data.device_type === 'string' ? data.device_type : (deviceType?.coreDeviceNature || 'Not specified')} |
      | Risk Class | ${riskClass} |
      | Basic UDI-DI | ${data.basic_udi_di || 'Not specified'} |
      | UDI-DI | ${data.udi_di || 'Not specified'} |
      | Model Reference | ${data.model_reference || 'Not specified'} |
      | Lifecycle Phase | ${data.current_lifecycle_phase || 'Not specified'} |
      | Invasiveness Level | ${deviceType?.invasivenessLevel || 'Not specified'} |
      | Patient Contact | ${techCharacteristics?.patientContact || 'Not specified'} |
      | Power Source | ${techCharacteristics?.powerSource?.join(', ') || 'Not specified'} |
      | Connectivity | ${techCharacteristics?.connectivity?.join(', ') || 'Not specified'} |
      | Sterility | ${techCharacteristics?.sterility || 'Not specified'} |
    `;
    
    console.log('Generated characteristics table:', characteristicsTable);
    return characteristicsTable;
  }
  
  private static createClinicalInfoTable(data: ProductDefinitionExportData): string {
    const intendedUsers = Array.isArray(data.intended_users) 
      ? data.intended_users.join(', ') 
      : 'Not specified';
    
    const clinicalBenefits = Array.isArray(data.clinical_benefits)
      ? data.clinical_benefits.join(', ')
      : 'Not specified';
      
    const contraindications = Array.isArray(data.contraindications)
      ? data.contraindications.join(', ')
      : 'Not specified';
    
    return `
      | **Clinical Information** | **Details** |
      |-------------------------|-------------|
      | Intended Users | ${intendedUsers} |
      | Clinical Benefits | ${clinicalBenefits} |
      | Contraindications | ${contraindications} |
      | User Instructions | ${this.formatUserInstructions(data.user_instructions)} |
    `;
  }
  
  private static createRegulatoryTable(data: ProductDefinitionExportData): string {
    const markets = this.parseJsonField(data.markets) || [];
    const marketInfo = Array.isArray(markets) && markets.length > 0
      ? markets.map(m => `${m.name || m.code} (${m.regulatoryStatus || 'Unknown'})`).join(', ')
      : 'Not specified';
    
    console.log('Creating regulatory table with markets:', markets);
    
    return `
      | **Regulatory Field** | **Value** |
      |---------------------|-----------|
      | Target Markets | ${marketInfo} |
      | Regulatory Status | ${data.regulatory_status || 'Not specified'} |
      | EUDAMED Registration | ${data.eudamed_registration_number || 'Not specified'} |
      | Registration Status | ${data.registration_status || 'Not specified'} |
      | Registration Date | ${data.registration_date ? format(new Date(data.registration_date), 'yyyy-MM-dd') : 'Not specified'} |
      | Notified Body | ${data.notified_body || 'Not specified'} |
      | Conformity Assessment Route | ${data.conformity_assessment_route || 'Not specified'} |
      | Current Lifecycle Phase | ${data.current_lifecycle_phase || 'Not specified'} |
      | Device Category | ${data.device_category || 'Not specified'} |
      | Product Platform | ${data.product_platform || 'Not specified'} |
    `;
  }
  
  private static createMediaSection(data: ProductDefinitionExportData): string {
    let content = '<h3>Associated Media</h3>';
    
    // Handle images - ensure it's an array
    const images = Array.isArray(data.images) ? data.images : [];
    if (images.length > 0) {
      content += '<h4>Images</h4><ul>';
      images.forEach((image, index) => {
        content += `<li>Image ${index + 1}: ${image}</li>`;
      });
      content += '</ul>';
    }
    
    // Handle videos - parse if it's a string, ensure it's an array
    let videos: string[] = [];
    if (data.videos) {
      if (Array.isArray(data.videos)) {
        videos = data.videos;
      } else if (typeof data.videos === 'string') {
        try {
          const parsed = JSON.parse(data.videos);
          videos = Array.isArray(parsed) ? parsed : [];
        } catch {
          videos = [];
        }
      }
    }
    
    if (videos.length > 0) {
      content += '<h4>Videos</h4><ul>';
      videos.forEach((video, index) => {
        content += `<li>Video ${index + 1}: ${video}</li>`;
      });
      content += '</ul>';
    }
    
    return content;
  }
  
  private static parseJsonField(field: any): any {
    if (!field) return null;
    if (typeof field === 'object') return field;
    if (typeof field === 'string') {
      try {
        return JSON.parse(field);
      } catch {
        return field;
      }
    }
    return field;
  }
  
  private static formatUserInstructions(instructions: any): string {
    if (!instructions || typeof instructions !== 'object') return 'Not specified';
    
    const parts = [];
    if (instructions.how_to_use) parts.push(`Use: ${instructions.how_to_use}`);
    if (instructions.charging) parts.push(`Charging: ${instructions.charging}`);
    if (instructions.maintenance) parts.push(`Maintenance: ${instructions.maintenance}`);
    
    return parts.length > 0 ? parts.join('; ') : 'Not specified';
  }
}