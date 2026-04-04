import { PredicateDevice, PredicateReference } from '@/types/fdaPredicateTrail';

export interface DocumentAnalysis {
  predicateReferences: PredicateReference[];
  intendedUse: string;
  technicalCharacteristics: string[];
  testingRequirements: string[];
  regulatoryPathway: string;
  confidence: number;
  processingTime: number;
  documentLength: number;
}

export interface TrailInsight {
  pattern: string;
  frequency: number;
  significance: 'high' | 'medium' | 'low';
  recommendation: string;
  examples: string[];
}

export class FDADocumentAnalysisService {
  private static documentCache = new Map<string, DocumentAnalysis>();
  
  // Enhanced predicate extraction using multiple analysis techniques
  static async analyzeDocument(device: PredicateDevice): Promise<DocumentAnalysis> {
    const cacheKey = `${device.kNumber}_analysis`;
    
    if (this.documentCache.has(cacheKey)) {
      return this.documentCache.get(cacheKey)!;
    }

    const startTime = Date.now();
    
    try {
      // Try to fetch actual document content
      const documentContent = await this.fetchDocumentContent(device);
      const analysisText = documentContent || device.statementOrSummary || '';
      
      const analysis: DocumentAnalysis = {
        predicateReferences: this.extractEnhancedPredicateReferences(analysisText, device.kNumber),
        intendedUse: this.extractIntendedUse(analysisText),
        technicalCharacteristics: this.extractTechnicalCharacteristics(analysisText),
        testingRequirements: this.extractTestingRequirements(analysisText),
        regulatoryPathway: this.inferRegulatoryPathway(analysisText, device),
        confidence: this.calculateRealConfidence(analysisText, device),
        processingTime: Date.now() - startTime,
        documentLength: analysisText.length
      };

      this.documentCache.set(cacheKey, analysis);
      return analysis;
      
    } catch (error) {
      console.error(`Error analyzing document for ${device.kNumber}:`, error);
      
      // Fallback analysis with basic text
      const fallbackText = device.statementOrSummary || '';
      return {
        predicateReferences: this.extractEnhancedPredicateReferences(fallbackText, device.kNumber),
        intendedUse: 'Unknown - document analysis failed',
        technicalCharacteristics: [],
        testingRequirements: [],
        regulatoryPathway: 'Unknown',
        confidence: 0.2,
        processingTime: Date.now() - startTime,
        documentLength: fallbackText.length
      };
    }
  }

  // Attempt to fetch actual FDA document content
  private static async fetchDocumentContent(device: PredicateDevice): Promise<string | null> {
    if (!device.documentUrl) return null;
    
    try {
      // For now, we'll use the statement/summary as it's what's available in the API
      // In a full implementation, we'd parse the actual FDA website or PDF
      console.log(`[Document Analysis] Using API content for ${device.kNumber}`);
      return device.statementOrSummary || null;
    } catch (error) {
      console.error(`Error fetching document content for ${device.kNumber}:`, error);
      return null;
    }
  }

  // Enhanced predicate reference extraction with context analysis
  private static extractEnhancedPredicateReferences(text: string, sourceKNumber: string): PredicateReference[] {
    if (!text) return [];

    const references: PredicateReference[] = [];
    
    // Enhanced K-number patterns
    const kNumberPatterns = [
      /K\d{2}[-]?\d{4,5}/gi,
      /K\s*\d{2}[-\s]?\d{4,5}/gi,
      /\b(?:device|predicate|clearance)?\s*K\d{6,7}\b/gi
    ];
    
    const allMatches = new Set<string>();
    
    kNumberPatterns.forEach(pattern => {
      const matches = text.match(pattern);
      if (matches) {
        matches.forEach(match => {
          const cleaned = match.replace(/[-\s]/g, '').toUpperCase();
          if (cleaned.length >= 7 && cleaned.length <= 8 && cleaned !== sourceKNumber) {
            allMatches.add(cleaned);
          }
        });
      }
    });

    // Analyze context for each found K-number
    allMatches.forEach(kNumber => {
      const occurrences = this.findKNumberOccurrences(text, kNumber);
      
      occurrences.forEach(occurrence => {
        references.push({
          sourceKNumber,
          predicateKNumber: kNumber,
          confidence: this.calculateContextualConfidence(occurrence.context),
          extractedText: occurrence.context,
          referenceType: this.determineReferenceType(occurrence.context)
        });
      });
    });

    return references;
  }

  private static findKNumberOccurrences(text: string, kNumber: string): Array<{context: string, position: number}> {
    const occurrences: Array<{context: string, position: number}> = [];
    const variations = [kNumber, kNumber.replace(/^K/, 'K '), kNumber.replace(/(\d{2})(\d+)/, '$1-$2')];
    
    variations.forEach(variation => {
      let index = text.indexOf(variation);
      while (index !== -1) {
        const start = Math.max(0, index - 150);
        const end = Math.min(text.length, index + 150);
        const context = text.substring(start, end).trim();
        
        occurrences.push({ context, position: index });
        
        index = text.indexOf(variation, index + 1);
      }
    });

    return occurrences;
  }

  private static calculateContextualConfidence(context: string): number {
    const lowerContext = context.toLowerCase();
    let confidence = 0.3; // Base confidence
    
    // High confidence indicators
    if (lowerContext.includes('predicate device') || lowerContext.includes('substantially equivalent')) {
      confidence += 0.4;
    }
    
    if (lowerContext.includes('same intended use') || lowerContext.includes('similar technological characteristics')) {
      confidence += 0.3;
    }
    
    if (lowerContext.includes('510(k)') || lowerContext.includes('cleared') || lowerContext.includes('marketing clearance')) {
      confidence += 0.2;
    }
    
    // Medium confidence indicators
    if (lowerContext.includes('similar to') || lowerContext.includes('comparable to')) {
      confidence += 0.2;
    }
    
    if (lowerContext.includes('performance') || lowerContext.includes('testing') || lowerContext.includes('biocompatibility')) {
      confidence += 0.1;
    }
    
    // Negative indicators
    if (lowerContext.includes('different from') || lowerContext.includes('unlike') || lowerContext.includes('not similar')) {
      confidence -= 0.3;
    }
    
    if (lowerContext.includes('withdrawn') || lowerContext.includes('recalled') || lowerContext.includes('not cleared')) {
      confidence -= 0.2;
    }

    return Math.min(Math.max(confidence, 0.1), 1.0);
  }

  private static determineReferenceType(context: string): 'explicit' | 'similar' | 'technology' {
    const lowerContext = context.toLowerCase();
    
    if (lowerContext.includes('predicate device') || 
        lowerContext.includes('substantially equivalent') ||
        lowerContext.includes('510(k)')) {
      return 'explicit';
    }
    
    if (lowerContext.includes('similar') || 
        lowerContext.includes('comparable') ||
        lowerContext.includes('same intended use')) {
      return 'similar';
    }
    
    return 'technology';
  }

  private static extractIntendedUse(text: string): string {
    const intendedUsePatterns = [
      /intended use[:\s]+(.*?)(?:\.|;|$)/i,
      /indication[s]?[:\s]+(.*?)(?:\.|;|$)/i,
      /the device is intended[:\s]+(.*?)(?:\.|;|$)/i,
      /used for[:\s]+(.*?)(?:\.|;|$)/i
    ];
    
    for (const pattern of intendedUsePatterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        return match[1].trim();
      }
    }
    
    return 'Not clearly specified in available text';
  }

  private static extractTechnicalCharacteristics(text: string): string[] {
    const characteristics: string[] = [];
    const lowerText = text.toLowerCase();
    
    // Common technical characteristics in medical devices
    const techTerms = [
      'biocompatible', 'sterile', 'single use', 'reusable', 'disposable',
      'implantable', 'non-invasive', 'minimally invasive',
      'electromagnetic compatibility', 'electrical safety', 'mechanical properties',
      'software', 'algorithm', 'sensor', 'wireless', 'bluetooth',
      'titanium', 'stainless steel', 'polymer', 'silicone', 'ceramic'
    ];
    
    techTerms.forEach(term => {
      if (lowerText.includes(term)) {
        characteristics.push(term);
      }
    });
    
    return characteristics;
  }

  private static extractTestingRequirements(text: string): string[] {
    const testingReqs: string[] = [];
    const lowerText = text.toLowerCase();
    
    const testTypes = [
      'biocompatibility testing', 'performance testing', 'clinical evaluation',
      'electrical safety testing', 'electromagnetic compatibility testing',
      'software verification', 'software validation', 'usability testing',
      'shelf life testing', 'packaging validation', 'sterilization validation',
      'mechanical testing', 'fatigue testing', 'wear testing'
    ];
    
    testTypes.forEach(test => {
      if (lowerText.includes(test.toLowerCase())) {
        testingReqs.push(test);
      }
    });
    
    return testingReqs;
  }

  private static inferRegulatoryPathway(text: string, device: PredicateDevice): string {
    const lowerText = text.toLowerCase();
    
    if (lowerText.includes('510(k)') || lowerText.includes('predicate')) {
      return '510(k) Clearance';
    }
    
    if (lowerText.includes('pma') || lowerText.includes('premarket approval')) {
      return 'PMA';
    }
    
    if (lowerText.includes('de novo') || lowerText.includes('novel')) {
      return 'De Novo';
    }
    
    // Infer from device class
    if (device.deviceClass === '3') {
      return '510(k) or PMA';
    } else if (device.deviceClass === '2') {
      return '510(k) Clearance';
    } else if (device.deviceClass === '1') {
      return 'FDA Registration';
    }
    
    return '510(k) Clearance (presumed)';
  }

  private static calculateRealConfidence(text: string, device: PredicateDevice): number {
    let confidence = 0.1; // Base confidence
    
    // Document completeness
    if (text.length > 500) confidence += 0.2;
    if (text.length > 1500) confidence += 0.2;
    
    // Presence of key regulatory terms
    const lowerText = text.toLowerCase();
    const keyTerms = ['predicate', 'substantial equivalence', '510(k)', 'intended use', 'performance', 'testing'];
    const foundTerms = keyTerms.filter(term => lowerText.includes(term));
    confidence += (foundTerms.length / keyTerms.length) * 0.3;
    
    // Device information completeness
    if (device.deviceName) confidence += 0.1;
    if (device.applicant) confidence += 0.05;
    if (device.productCode) confidence += 0.05;
    if (device.deviceClass) confidence += 0.1;
    
    return Math.min(confidence, 1.0);
  }

  // Analyze multiple documents to find patterns
  static analyzeTrailPatterns(analyses: DocumentAnalysis[]): TrailInsight[] {
    const insights: TrailInsight[] = [];
    
    // Analyze predicate reference patterns
    const predicateFreq = new Map<string, number>();
    analyses.forEach(analysis => {
      analysis.predicateReferences.forEach(ref => {
        predicateFreq.set(ref.predicateKNumber, (predicateFreq.get(ref.predicateKNumber) || 0) + 1);
      });
    });
    
    // Common predicates insight
    const commonPredicates = Array.from(predicateFreq.entries())
      .filter(([_, count]) => count >= 2)
      .sort(([_, a], [__, b]) => b - a)
      .slice(0, 3);
      
    if (commonPredicates.length > 0) {
      insights.push({
        pattern: 'Common Predicate Devices',
        frequency: commonPredicates[0][1],
        significance: commonPredicates[0][1] >= 3 ? 'high' : 'medium',
        recommendation: `Focus regulatory strategy on ${commonPredicates[0][0]} predicate pathway`,
        examples: commonPredicates.map(([kNum]) => kNum)
      });
    }
    
    // Testing requirements pattern
    const allTestingReqs = analyses.flatMap(a => a.testingRequirements);
    const testingFreq = new Map<string, number>();
    allTestingReqs.forEach(req => {
      testingFreq.set(req, (testingFreq.get(req) || 0) + 1);
    });
    
    const commonTesting = Array.from(testingFreq.entries())
      .filter(([_, count]) => count >= 2)
      .sort(([_, a], [__, b]) => b - a)[0];
      
    if (commonTesting) {
      insights.push({
        pattern: 'Required Testing Approach',
        frequency: commonTesting[1],
        significance: commonTesting[1] >= 3 ? 'high' : 'medium',
        recommendation: `Prepare for ${commonTesting[0]} as it appears in ${commonTesting[1]} predicate devices`,
        examples: [commonTesting[0]]
      });
    }
    
    return insights;
  }
}