import { jsPDF } from 'jspdf';
import { supabase } from '@/integrations/supabase/client';

interface ExportOptions {
  companyName: string;
  productName: string;
  enabledSections: string[];
  productId: string;
  companyId: string;
}

interface SlideContent {
  title: string;
  subtitle?: string;
  content: string[];
  highlight?: string;
}

// Fetch comprehensive data for pitch deck
async function fetchPitchData(productId: string, companyId: string) {
  // Fetch all data in parallel - use any to avoid type complexity
  const productResult = await supabase.from('products').select('*').eq('id', productId).single();
  const canvasResult = await supabase.from('business_canvas').select('*').eq('product_id', productId).single();
  const companyResult = await supabase.from('companies').select('*').eq('id', companyId).single();

  return {
    product: productResult.data as any,
    canvas: canvasResult.data as any,
    company: companyResult.data as any,
  };
}

// Create a slide with consistent styling
function createSlide(
  pdf: jsPDF, 
  slideNumber: number, 
  totalSlides: number,
  content: SlideContent,
  companyName: string
) {
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 20;
  
  // Background
  pdf.setFillColor(255, 255, 255);
  pdf.rect(0, 0, pageWidth, pageHeight, 'F');
  
  // Header accent bar
  pdf.setFillColor(59, 130, 246); // Blue
  pdf.rect(0, 0, pageWidth, 8, 'F');
  
  // Title
  pdf.setFontSize(28);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(17, 24, 39);
  pdf.text(content.title, margin, 40);
  
  // Subtitle
  if (content.subtitle) {
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(107, 114, 128);
    pdf.text(content.subtitle, margin, 52);
  }
  
  // Content
  let yPosition = content.subtitle ? 70 : 60;
  pdf.setFontSize(12);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(55, 65, 81);
  
  for (const line of content.content) {
    if (yPosition > pageHeight - 40) break;
    
    const wrappedLines = pdf.splitTextToSize(line, pageWidth - margin * 2);
    for (const wrappedLine of wrappedLines) {
      if (yPosition > pageHeight - 40) break;
      pdf.text(wrappedLine, margin, yPosition);
      yPosition += 7;
    }
    yPosition += 4;
  }
  
  // Highlight box
  if (content.highlight) {
    pdf.setFillColor(239, 246, 255);
    pdf.roundedRect(margin, pageHeight - 60, pageWidth - margin * 2, 30, 3, 3, 'F');
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(59, 130, 246);
    pdf.text(content.highlight, margin + 10, pageHeight - 42);
  }
  
  // Footer
  pdf.setFontSize(9);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(156, 163, 175);
  pdf.text(companyName, margin, pageHeight - 15);
  pdf.text(`${slideNumber} / ${totalSlides}`, pageWidth - margin - 15, pageHeight - 15);
}

export async function exportPitchDeckToPDF(options: ExportOptions): Promise<void> {
  const { companyName, productName, enabledSections, productId, companyId } = options;
  
  // Fetch data
  const data = await fetchPitchData(productId, companyId);
  const product = data.product || {};
  const canvas = data.canvas || {};
  const company = data.company || {};
  
  // Use landscape for slides
  const pdf = new jsPDF('l', 'mm', 'a4');
  const slides: SlideContent[] = [];
  
  // Title slide
  slides.push({
    title: productName,
    subtitle: companyName,
    content: [
      product.description || 'Medical device innovation',
      '',
      `Intended Use: ${product.intended_use || 'To be defined'}`,
    ],
    highlight: product.class ? `Device Class: ${product.class}` : undefined,
  });
  
  // Generate slides based on enabled sections - matches EnhancedPitchBuilder section IDs
  for (const sectionId of enabledSections) {
    switch (sectionId) {
      // PART I: Product & Technology Foundation
      case 'device_media':
        slides.push({
          title: 'Device Media Gallery',
          subtitle: 'Product Visuals',
          content: [
            'Product images and technical diagrams available in the online investor portal.',
            '',
            'Key visual assets:',
            '• Product renders and prototypes',
            '• System architecture diagrams',
            '• User interface mockups',
          ],
        });
        break;

      case 'device_description':
        slides.push({
          title: 'Device Description & Intended Use',
          subtitle: productName,
          content: [
            product.description || 'Product description to be added',
            '',
            `Intended Use: ${product.intended_use || 'Not specified'}`,
            '',
            `Value Proposition: ${product.value_proposition || 'To be defined'}`,
          ],
        });
        break;

      case 'trl_architecture':
        slides.push({
          title: 'Technology Readiness & Architecture',
          subtitle: 'Development Maturity Assessment',
          content: [
            `Technology Readiness Level: ${product.trl_level || 'TRL assessment pending'}`,
            '',
            'System Architecture:',
            product.system_architecture || '• Architecture documentation in progress',
            '',
            `Device Type: ${product.device_type || 'Not specified'}`,
          ],
        });
        break;

      case 'technical_profile':
        slides.push({
          title: 'Technical Profile & Classification',
          subtitle: 'Regulatory Classification Details',
          content: [
            `Device Class: ${product.class || 'Classification pending'}`,
            `Device Type: ${product.device_type || 'Not specified'}`,
            '',
            'Classification Basis:',
            `• Rule: ${product.classification_rule || 'To be determined'}`,
            `• Software: ${product.software_safety_class || 'N/A'}`,
          ],
          highlight: product.class ? `Risk Class: ${product.class}` : undefined,
        });
        break;

      // PART II: Market & Stakeholder Analysis
      case 'market_sizing':
        slides.push({
          title: 'Market Opportunity',
          subtitle: 'TAM, SAM, SOM Analysis',
          content: [
            'Total Addressable Market (TAM): See detailed market analysis',
            '',
            'Serviceable Addressable Market (SAM): Geographic and regulatory scope',
            '',
            'Serviceable Obtainable Market (SOM): Realistic market share target',
            '',
            'Detailed market sizing available in investor portal',
          ],
        });
        break;

      case 'customer_segments':
        slides.push({
          title: 'Customer Segments',
          subtitle: 'User & Economic Buyer Profiles',
          content: [
            'Target User Profile:',
            `• Population: ${product.target_population || 'To be defined'}`,
            `• Use Environment: ${product.use_environment || 'To be defined'}`,
            '',
            'Economic Buyer Profile:',
            `• Primary Buyer: ${product.economic_buyer || 'To be defined'}`,
          ],
        });
        break;

      case 'competitor_analysis':
        slides.push({
          title: 'Competitive Landscape',
          subtitle: 'Market Positioning',
          content: [
            'Competitive Analysis:',
            '• Key competitors identified and analyzed',
            '• Differentiation strategy defined',
            '• Competitive advantages documented',
            '',
            'Detailed competitive analysis available in investor portal',
          ],
        });
        break;

      // PART III: Strategy & Evidence
      case 'clinical_evidence':
        slides.push({
          title: 'Clinical Evidence Strategy',
          subtitle: 'Validation Approach',
          content: [
            `Evidence Approach: ${product.clinical_evidence_type || 'To be determined'}`,
            '',
            'Clinical Strategy:',
            '• Evidence generation plan defined',
            '• Key study endpoints identified',
            '• Safety and efficacy validation planned',
          ],
        });
        break;

      case 'regulatory_timeline':
        slides.push({
          title: 'Regulatory Pathway',
          subtitle: 'Approval Timeline',
          content: [
            'Regulatory Strategy:',
            `• Device Class: ${product.class || 'Pending classification'}`,
            '',
            'Key Milestones:',
            '• Technical File / 510(k) preparation',
            '• Notified Body / FDA submission',
            '• Market authorization target',
          ],
        });
        break;

      case 'reimbursement':
        slides.push({
          title: 'Reimbursement Strategy',
          subtitle: 'Market Access Pathway',
          content: [
            'Reimbursement Approach:',
            '• Coding strategy defined',
            '',
            'Coverage & Payment:',
            '• CPT/HCPCS code identification',
            '• Payer engagement plan',
            '• Health economics evidence',
          ],
        });
        break;

      case 'gtm_strategy':
        slides.push({
          title: 'Go-to-Market Strategy',
          subtitle: 'Commercial Launch Plan',
          content: [
            'GTM Approach:',
            '• Distribution channels identified',
            '• Territory prioritization complete',
            '',
            'Launch Strategy:',
            '• Direct sales capability',
            '• Distribution partnerships',
            '• Key account management',
          ],
        });
        break;

      // PART V: Operational Execution & Logistics
      case 'team':
        slides.push({
          title: 'Team Composition',
          subtitle: 'Leadership & Expertise',
          content: [
            'Our team brings together deep expertise in:',
            '',
            '• Medical device development',
            '• Regulatory affairs',
            '• Clinical research',
            '• Commercial operations',
            '• Quality management',
          ],
        });
        break;

      case 'manufacturing':
        slides.push({
          title: 'Manufacturing & Supply Chain',
          subtitle: 'Production Strategy',
          content: [
            'Manufacturing Strategy:',
            '• Production approach defined',
            '• Quality System: ISO 13485 compliant',
            '',
            'Supply Chain:',
            '• Key suppliers identified',
            '• Capacity planning in progress',
          ],
        });
        break;

      case 'timeline':
        slides.push({
          title: 'Execution Timeline',
          subtitle: 'Development Roadmap',
          content: [
            'ISO 13485 Development Phases:',
            '',
            '1. Concept & Planning',
            '2. Design Inputs',
            '3. Design & Development',
            '4. Verification & Validation',
            '5. Transfer to Production',
            '6. Market Surveillance',
          ],
        });
        break;

      case 'risk_assessment':
        slides.push({
          title: 'Risk Assessment',
          subtitle: 'Key Risks & Mitigations',
          content: [
            'Risk Categories Assessed:',
            '',
            '• Clinical Risks: Patient safety considerations',
            '• Technical Risks: Development challenges',
            '• Regulatory Risks: Approval pathway risks',
            '• Commercial Risks: Market adoption challenges',
            '',
            'Detailed risk register available in investor portal',
          ],
        });
        break;

      case 'use_of_proceeds':
        slides.push({
          title: 'Funding & Use of Proceeds',
          subtitle: 'Capital Allocation Plan',
          content: [
            'Use of Proceeds:',
            '',
            '• R&D and product development',
            '• Regulatory submissions',
            '• Clinical studies',
            '• Team expansion',
            '• Commercial launch preparation',
          ],
        });
        break;

      // PART IV: The Business Synthesis
      case 'viability_score':
        slides.push({
          title: 'Viability Assessment',
          subtitle: 'Investment Readiness Score',
          content: [
            'Comprehensive assessment completed across:',
            '',
            '• Regulatory pathway clarity',
            '• Clinical evidence strategy',
            '• Reimbursement pathway',
            '• Technical feasibility',
            '• Commercial viability',
            '',
            'Detailed scorecard available in investor portal',
          ],
        });
        break;

      case 'business_canvas':
        slides.push({
          title: 'Business Model Canvas',
          subtitle: 'Strategic Framework',
          content: [
            `Value Propositions: ${truncateText(canvas.value_propositions || 'To be defined', 80)}`,
            '',
            `Customer Segments: ${truncateText(canvas.customer_segments || 'To be defined', 80)}`,
            '',
            `Revenue Streams: ${truncateText(canvas.revenue_streams || 'To be defined', 80)}`,
            '',
            `Key Partners: ${truncateText(canvas.key_partnerships || 'To be defined', 80)}`,
          ],
        });
        break;

      case 'revenue_chart':
        slides.push({
          title: 'Revenue Projections',
          subtitle: 'Financial Forecast',
          content: [
            'Revenue Lifecycle:',
            '',
            '• Pre-revenue development phase',
            '• Initial market launch',
            '• Growth and market expansion',
            '• Mature product phase',
            '',
            'Detailed projections available in rNPV analysis',
          ],
        });
        break;

      case 'exit_strategy':
        slides.push({
          title: 'Strategic Horizon',
          subtitle: 'Exit Strategy',
          content: [
            `Strategic Direction: ${product.exit_strategy || 'To be defined'}`,
            '',
            'Potential Paths:',
            '• Strategic acquisition',
            '• Independent growth',
            '• IPO',
            '• Licensing partnerships',
            '• Private equity partnership',
          ],
        });
        break;

      // Legacy section IDs for backwards compatibility
      case 'viability':
        slides.push({
          title: 'Viability Assessment',
          subtitle: 'Investment Readiness Score',
          content: [
            'Regulatory pathway analysis completed',
            'Clinical evidence strategy defined',
            'Reimbursement strategy assessed',
            'Technical feasibility verified',
          ],
        });
        break;
        
      case 'description':
        slides.push({
          title: 'Product Overview',
          subtitle: productName,
          content: [
            product.description || 'Product description to be added',
            '',
            `Device Type: ${product.device_type || 'Not specified'}`,
            `Target Markets: Global`,
          ],
        });
        break;
        
      case 'canvas':
        slides.push({
          title: 'Business Model Canvas',
          subtitle: 'Value Proposition & Strategy',
          content: [
            `Value Propositions: ${truncateText(canvas.value_propositions || 'To be defined', 100)}`,
            '',
            `Customer Segments: ${truncateText(canvas.customer_segments || 'To be defined', 100)}`,
            '',
            `Revenue Streams: ${truncateText(canvas.revenue_streams || 'To be defined', 100)}`,
          ],
        });
        break;
        
      case 'market':
        slides.push({
          title: 'Market Opportunity',
          subtitle: 'TAM, SAM, SOM Analysis',
          content: [
            'Total Addressable Market (TAM): Defined by target indication',
            '',
            'Serviceable Addressable Market (SAM): Geographic and regulatory scope',
            '',
            'Serviceable Obtainable Market (SOM): Realistic market share target',
          ],
        });
        break;
        
      case 'roadmap':
        slides.push({
          title: 'Development Roadmap',
          subtitle: 'Path to Market',
          content: [
            '1. Concept & Planning',
            '2. Design Inputs',
            '3. Design & Development',
            '4. Verification & Validation',
            '5. Transfer to Production',
            '6. Market Surveillance',
          ],
        });
        break;
    }
  }
  
  // Contact slide
  slides.push({
    title: 'Contact Us',
    subtitle: 'Let\'s discuss the opportunity',
    content: [
      companyName,
      '',
      company.email || '',
      company.website || '',
      company.address || '',
    ],
  });
  
  // Generate PDF
  const totalSlides = slides.length;
  slides.forEach((slide, index) => {
    if (index > 0) pdf.addPage();
    createSlide(pdf, index + 1, totalSlides, slide, companyName);
  });
  
  // Save
  const fileName = `${productName.replace(/\s+/g, '_')}_Pitch_Deck_${new Date().toISOString().split('T')[0]}.pdf`;
  pdf.save(fileName);
}

function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
}
