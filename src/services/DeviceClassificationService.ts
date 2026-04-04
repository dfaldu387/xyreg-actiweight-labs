import { DeviceCharacteristics } from '@/types/client.d';
import { EnhancedProductMarket } from '@/utils/enhancedMarketRiskClassMapping';

export interface ClassificationSuggestion {
  marketCode: string;
  marketName: string;
  suggestedClass: string;
  confidence: 'high' | 'medium' | 'low';
  reasoning: string[];
  rule?: string;
  requiresExpertReview?: boolean;
  alternativeClasses?: string[];
}

export interface DeviceClassificationInput {
  primaryRegulatoryType?: string;
  coreDeviceNature?: string;
  keyTechnologyCharacteristics?: DeviceCharacteristics;
  invasiveness?: 'non-invasive' | 'invasive' | 'surgically_invasive' | 'implantable';
  duration?: 'transient' | 'short_term' | 'long_term';
  bodyContact?: string;
  anatomicalLocation?: string;
  energyDelivery?: boolean;
  therapeuticEnergy?: boolean;
  diagnosticEnergy?: boolean;
  medicinalSubstance?: boolean;
  active?: boolean;
  sterile?: boolean;
  measuring?: boolean;
  reusableSurgical?: boolean;
  absorbedByBody?: boolean;
  containsNanomaterials?: boolean;
  // IVDR-specific fields
  primaryTestCategory?: string;
  ivdrDeviceType?: string;
  testingEnvironment?: string;
  controlCalibratorProperties?: string;
  selfTestingSubcategory?: string;
  intendedUse?: string;
}

export class DeviceClassificationService {
  static classifyDevice(
    deviceInput: DeviceClassificationInput,
    selectedMarkets: EnhancedProductMarket[]
  ): ClassificationSuggestion[] {
    const suggestions: ClassificationSuggestion[] = [];

    selectedMarkets
      .filter(market => market.selected)
      .forEach(market => {
        const suggestion = this.classifyForMarket(market.code, market.name, deviceInput);
        if (suggestion) {
          suggestions.push(suggestion);
        }
      });

    return suggestions;
  }

  private static classifyForMarket(
    marketCode: string,
    marketName: string,
    input: DeviceClassificationInput
  ): ClassificationSuggestion | null {
    switch (marketCode) {
      case 'EU':
        return this.classifyEUMDR(marketName, input);
      case 'US':
      case 'USA':
        return this.classifyUSFDA(marketName, input);
      case 'CA':
        return this.classifyHealthCanada(marketName, input);
      case 'AU':
        return this.classifyTGA(marketName, input);
      default:
        return this.classifyGeneric(marketCode, marketName, input);
    }
  }

  private static classifyEUMDR(
    marketName: string,
    input: DeviceClassificationInput
  ): ClassificationSuggestion {
    const reasoning: string[] = [];
    let suggestedClass = 'Class I';
    let confidence: 'high' | 'medium' | 'low' = 'medium';
    let rule = '';
    let requiresExpertReview = false;
    const alternativeClasses: string[] = [];

    // Handle IVD devices
    if (input.primaryRegulatoryType === 'In Vitro Diagnostic (IVD)') {
      return this.classifyIVDDevice(marketName, input);
    }

    // Handle Software as a Medical Device (SaMD)
    if (input.keyTechnologyCharacteristics?.isSoftwareAsaMedicalDevice) {
      return this.classifyEUMDRSaMD(marketName, input);
    }

    // Check if essential fields are missing for confidence calculation
    const missingEssentialFields = [];
    if (!input.duration) missingEssentialFields.push('duration of use');
    if (!input.invasiveness) missingEssentialFields.push('invasiveness');
    if (input.active === undefined || input.active === null) missingEssentialFields.push('active/non-active');
    if (!input.bodyContact) missingEssentialFields.push('body contact');
    if (!input.anatomicalLocation) missingEssentialFields.push('anatomical location');
    // Note: intended use is handled separately as it's not part of the classification input type
    
    // Apply EU MDR classification rules
    reasoning.push(`Regulatory type: ${input.primaryRegulatoryType || 'Medical Device'}`);

    // Non-invasive devices (Rule 1-4)
    if (input.invasiveness === 'non-invasive') {
      reasoning.push('Device is non-invasive');
      
      if (input.active) {
        reasoning.push('Device is active');
        if (input.energyDelivery) {
          suggestedClass = 'Class IIa';
          rule = 'MDR Annex VIII, Rule 9';
          reasoning.push('Active device that delivers energy');
          confidence = 'high';
        } else {
          suggestedClass = 'Class I';
          rule = 'MDR Annex VIII, Rule 13';
          reasoning.push('Active device that does not deliver energy');
          confidence = 'medium';
          alternativeClasses.push('Class IIa');
        }
      } else {
        suggestedClass = 'Class I';
        rule = 'MDR Annex VIII, Rule 1';
        reasoning.push('Non-invasive, non-active device');
        confidence = 'high';
        
        // Check for Class I subcategories
        if (input.sterile) {
          suggestedClass = 'Class Is (Sterile)';
          reasoning.push('Device delivered sterile');
        }
        if (input.measuring) {
          const currentClass = suggestedClass;
          suggestedClass = currentClass.includes('Class I') 
            ? `${currentClass}, Class Im (Measuring)`.replace('Class I, ', '')
            : 'Class Im (Measuring)';
          reasoning.push('Device has critical measuring function');
        }
        if (input.reusableSurgical) {
          const currentClass = suggestedClass;
          suggestedClass = currentClass.includes('Class I') 
            ? `${currentClass}, Class Ir (Reusable surgical)`.replace('Class I, ', '')
            : 'Class Ir (Reusable surgical)';
          reasoning.push('Device is reusable surgical instrument');
        }
      }
    }

    // Invasive devices (Rule 5-8)
    else if (input.invasiveness === 'invasive') {
      reasoning.push('Device is invasive');
      
      // Body orifice invasive
      reasoning.push('Device enters body through orifice');
      
      if (input.duration === 'transient') {
        suggestedClass = 'Class I';
        rule = 'MDR Annex VIII, Rule 5';
        reasoning.push('Body orifice invasive, transient use (≤60 minutes)');
        confidence = 'high';
      } else if (input.duration === 'short_term') {
        suggestedClass = 'Class IIa';
        rule = 'MDR Annex VIII, Rule 5';
        reasoning.push('Body orifice invasive, short-term use (≤30 days)');
        confidence = 'high';
      } else if (input.duration === 'long_term') {
        suggestedClass = 'Class IIb';
        rule = 'MDR Annex VIII, Rule 5';
        reasoning.push('Body orifice invasive, long-term use (>30 days)');
        confidence = 'high';
      } else {
        // Duration not specified
        suggestedClass = 'Class IIa';
        rule = 'MDR Annex VIII, Rule 5';
        reasoning.push('Body orifice invasive, duration not specified - assuming short-term');
        confidence = 'low';
        alternativeClasses.push('Class I', 'Class IIb');
      }
    }

    // Implantable devices
    else if (input.invasiveness === 'implantable') {
      reasoning.push('Device is implantable');
      
      if (input.active) {
        suggestedClass = 'Class III';
        rule = 'MDR Annex VIII, Rule 8';
        reasoning.push('Active implantable device');
        confidence = 'high';
      } else {
        suggestedClass = 'Class IIb';
        rule = 'MDR Annex VIII, Rule 8';
        reasoning.push('Non-active implantable device');
        confidence = 'high';
        
        // Check for special cases
        if (input.bodyContact?.includes('tooth') || input.bodyContact?.includes('dental')) {
          suggestedClass = 'Class IIa';
          reasoning.push('Exception: Dental implant');
        }
        
        // Check for contact with critical anatomical systems
        if (input.anatomicalLocation === 'cardiovascular_system' || 
            input.anatomicalLocation === 'central_nervous_system' ||
            input.bodyContact?.includes('cardiovascular') || input.bodyContact?.includes('heart') ||
            input.bodyContact?.includes('nervous') || input.bodyContact?.includes('brain')) {
          suggestedClass = 'Class III';
          reasoning.push('Implantable device in contact with critical systems (CNS/cardiovascular)');
        }
      }
    }

    // Special rules and critical system contact
    if (input.anatomicalLocation === 'cardiovascular_system' || 
        input.anatomicalLocation === 'central_nervous_system') {
      suggestedClass = 'Class III';
      rule = 'MDR Annex VIII, Rule 6/7';
      reasoning.push(`Device in contact with ${input.anatomicalLocation.replace('_', ' ')}`);
      confidence = 'high';
    }

    if (input.medicinalSubstance) {
      suggestedClass = 'Class III';
      rule = 'MDR Annex VIII, Rule 14';
      reasoning.push('Device incorporates medicinal substance');
      confidence = 'high';
    }

    if (input.absorbedByBody) {
      suggestedClass = 'Class III';
      rule = 'MDR Annex VIII, Rule 21';
      reasoning.push('Device absorbed by the body');
      confidence = 'high';
    }

    if (input.containsNanomaterials) {
      suggestedClass = 'Class III';
      rule = 'MDR Annex VIII, Rule 19';
      reasoning.push('Device contains nanomaterials');
      confidence = 'high';
    }

    // Confidence adjustment based on missing fields
    if (missingEssentialFields.length > 0) {
      if (missingEssentialFields.length >= 4) {
        confidence = 'low';
      } else if (missingEssentialFields.length >= 2) {
        confidence = 'medium';
      }
      reasoning.push(`⚠️ Classification accuracy limited - missing: ${missingEssentialFields.join(', ')}`);
      reasoning.push(`💡 Complete these fields to improve confidence`);
      requiresExpertReview = true;
    }
    
    // Additional confidence adjustment
    if (reasoning.length < 3) {
      confidence = 'low';
      requiresExpertReview = true;
    }

    return {
      marketCode: 'EU',
      marketName,
      suggestedClass,
      confidence,
      reasoning,
      rule,
      requiresExpertReview,
      alternativeClasses: alternativeClasses.length > 0 ? alternativeClasses : undefined
    };
  }

  private static classifyEUMDRSaMD(
    marketName: string,
    input: DeviceClassificationInput
  ): ClassificationSuggestion {
    const reasoning: string[] = ['SaMD (Software as a Medical Device)'];
    let suggestedClass = 'Not determined';
    let confidence: 'high' | 'medium' | 'low' = 'low';
    let rule = 'MDR Annex VIII, Rule 11';
    let requiresExpertReview = true;
    const alternativeClasses: string[] = ['Class I', 'Class IIa', 'Class IIb', 'Class III'];

    reasoning.push('Device is SaMD (Software as a Medical Device)');
    reasoning.push('Classification according to MDR Annex VIII, Rule 11');
    reasoning.push('⚠️ Rule 11 requires detailed assessment of software function and impact');
    reasoning.push('📋 Use the SaMD Classification Assistant for accurate Rule 11 assessment');
    reasoning.push('💡 Classification depends on:');
    reasoning.push('  • Diagnostic/therapeutic decision support vs. monitoring vs. other functions');
    reasoning.push('  • Impact level (death/irreversible, serious deterioration, standard)');
    reasoning.push('  • Vital parameter monitoring with immediate danger potential');

    // Check if essential SaMD fields are missing for confidence calculation
    const missingEssentialFields = [];
    if (!input.intendedUse) missingEssentialFields.push('intended use/SaMD purpose');

    if (missingEssentialFields.length > 0) {
      reasoning.push(`⚠️ Missing essential fields: ${missingEssentialFields.join(', ')}`);
    }

    return {
      marketCode: 'EU',
      marketName,
      suggestedClass,
      confidence,
      reasoning,
      rule,
      requiresExpertReview,
      alternativeClasses: alternativeClasses.length > 0 ? alternativeClasses : undefined
    };
  }

  private static classifyIVDDevice(
    marketName: string,
    input: DeviceClassificationInput
  ): ClassificationSuggestion {
    const reasoning: string[] = ['Device is In Vitro Diagnostic (IVD)'];
    let suggestedClass = 'Class A';
    let confidence: 'high' | 'medium' | 'low' = 'medium';
    let rule = 'IVDR Annex VIII';
    let requiresExpertReview = false;
    const alternativeClasses: string[] = [];

    // Check if essential IVDR fields are missing for confidence calculation
    const missingEssentialFields = [];
    if (!input.primaryTestCategory) missingEssentialFields.push('primary test category');
    if (!input.ivdrDeviceType) missingEssentialFields.push('IVDR device type');
    if (!input.testingEnvironment) missingEssentialFields.push('testing environment');
    if (!input.intendedUse) missingEssentialFields.push('intended use');

    // Apply IVDR classification rules based on comprehensive logic
    reasoning.push(`Primary test category: ${input.primaryTestCategory || 'Not specified'}`);
    reasoning.push(`IVDR device type: ${input.ivdrDeviceType || 'Not specified'}`);
    reasoning.push(`Testing environment: ${input.testingEnvironment || 'Not specified'}`);

    // Rule 1: Class D - Transmissible agents and life-threatening diseases
    if (input.primaryTestCategory === 'transfusion_transplantation' || 
        input.primaryTestCategory === 'blood_transfusion' ||
        input.primaryTestCategory?.includes('transmissible') ||
        input.intendedUse?.toLowerCase().includes('blood') && input.intendedUse?.toLowerCase().includes('transfusion')) {
      suggestedClass = 'Class D';
      rule = 'IVDR Annex VIII, Rule 1';
      reasoning.push('High-risk: Transmissible agents in blood/tissue for transfusion/transplantation');
      confidence = 'high';
    }
    // Rule 2: Blood grouping and tissue typing
    else if (input.primaryTestCategory === 'blood_grouping' || 
             input.primaryTestCategory === 'tissue_typing' ||
             input.intendedUse?.toLowerCase().includes('blood group')) {
      if (input.intendedUse?.toLowerCase().includes('abo') || 
          input.intendedUse?.toLowerCase().includes('rhesus') ||
          input.intendedUse?.toLowerCase().includes('kell')) {
        suggestedClass = 'Class D';
        rule = 'IVDR Annex VIII, Rule 2';
        reasoning.push('Critical blood grouping markers (ABO, Rhesus, Kell systems)');
        confidence = 'high';
      } else {
        suggestedClass = 'Class C';
        rule = 'IVDR Annex VIII, Rule 2';
        reasoning.push('Blood grouping/tissue typing (other markers)');
        confidence = 'high';
      }
    }
    // Rule 3: Class C conditions
    else if (input.primaryTestCategory === 'infectious_diseases' ||
             input.primaryTestCategory === 'cancer_screening' ||
             input.primaryTestCategory === 'genetic_testing' ||
             input.intendedUse?.toLowerCase().includes('cancer') ||
             input.intendedUse?.toLowerCase().includes('genetic') ||
             input.intendedUse?.toLowerCase().includes('sexually transmitted')) {
      suggestedClass = 'Class C';
      rule = 'IVDR Annex VIII, Rule 3';
      reasoning.push('High-risk diagnostic applications (infectious diseases, cancer, genetics)');
      confidence = 'high';
    }
    // Rule 4: Self-testing
    else if (input.testingEnvironment === 'Self-testing') {
      if (input.selfTestingSubcategory === 'pregnancy' ||
          input.selfTestingSubcategory === 'fertility' ||
          input.selfTestingSubcategory === 'cholesterol' ||
          input.selfTestingSubcategory === 'glucose' ||
          input.primaryTestCategory === 'glucose_monitoring') {
        suggestedClass = 'Class B';
        rule = 'IVDR Annex VIII, Rule 4(a)';
        reasoning.push('Self-testing for low-risk applications (pregnancy, fertility, glucose, etc.)');
        confidence = 'high';
      } else {
        suggestedClass = 'Class C';
        rule = 'IVDR Annex VIII, Rule 4(a)';
        reasoning.push('Self-testing for other applications');
        confidence = 'medium';
        alternativeClasses.push('Class B');
      }
    }
    // Near-patient testing
    else if (input.testingEnvironment === 'Near-patient testing') {
      suggestedClass = 'Class B';
      rule = 'IVDR Annex VIII, Rule 4(b)';
      reasoning.push('Near-patient testing device');
      confidence = 'medium';
    }
    // Rule 5: Class A devices
    else if (input.ivdrDeviceType === 'general_laboratory_products' ||
             input.ivdrDeviceType === 'instruments' ||
             input.ivdrDeviceType === 'specimen_receptacles' ||
             input.primaryTestCategory === 'general_laboratory') {
      suggestedClass = 'Class A';
      rule = 'IVDR Annex VIII, Rule 5';
      reasoning.push('General laboratory products, instruments, or specimen receptacles');
      confidence = 'high';
    }
    // Rule 7: Control materials without assigned values
    else if (input.ivdrDeviceType === 'control_material' && 
             input.controlCalibratorProperties === 'without_assigned_values') {
      suggestedClass = 'Class B';
      rule = 'IVDR Annex VIII, Rule 7';
      reasoning.push('Control materials without quantitative/qualitative assigned values');
      confidence = 'high';
    }
    // Rule 6: Default classification
    else {
      suggestedClass = 'Class B';
      rule = 'IVDR Annex VIII, Rule 6';
      reasoning.push('Default classification for IVD devices not covered by other rules');
      confidence = 'medium';
      alternativeClasses.push('Class A', 'Class C');
    }

    // Confidence adjustment based on missing fields
    if (missingEssentialFields.length > 0) {
      if (missingEssentialFields.length >= 3) {
        confidence = 'low';
      } else if (missingEssentialFields.length >= 2) {
        confidence = 'medium';
      }
      reasoning.push(`⚠️ Classification accuracy limited - missing: ${missingEssentialFields.join(', ')}`);
      reasoning.push(`💡 Complete IVDR fields to improve confidence`);
      requiresExpertReview = true;
    }

    return {
      marketCode: 'EU',
      marketName,
      suggestedClass,
      confidence,
      reasoning,
      rule,
      requiresExpertReview,
      alternativeClasses: alternativeClasses.length > 0 ? alternativeClasses : undefined
    };
  }

  private static classifyUSFDA(
    marketName: string,
    input: DeviceClassificationInput
  ): ClassificationSuggestion {
    const reasoning: string[] = ['FDA classification system'];
    let suggestedClass = 'Class I';
    let confidence: 'high' | 'medium' | 'low' = 'medium';
    let rule = '21 CFR';
    
    // Handle IVD devices for US market
    if (input.primaryRegulatoryType === 'In Vitro Diagnostic (IVD)') {
      reasoning.push('IVD device for US market');
      
      // FDA IVD classification logic
      if (input.primaryTestCategory === 'transfusion_transplantation' ||
          input.primaryTestCategory === 'blood_transfusion' ||
          input.intendedUse?.toLowerCase().includes('blood') && input.intendedUse?.toLowerCase().includes('transfusion')) {
        suggestedClass = 'Class III';
        reasoning.push('High-risk IVD for blood safety');
        confidence = 'high';
      } else if (input.testingEnvironment === 'Self-testing') {
        suggestedClass = 'Class II';
        reasoning.push('Self-testing IVD typically Class II');
        confidence = 'medium';
      } else if (input.primaryTestCategory === 'infectious_diseases' ||
                 input.primaryTestCategory === 'cancer_screening') {
        suggestedClass = 'Class II';
        reasoning.push('Moderate-risk diagnostic applications');
        confidence = 'medium';
      } else {
        suggestedClass = 'Class I';
        reasoning.push('Low-risk IVD applications');
        confidence = 'medium';
      }
    } else {
      // Basic FDA classification logic for non-IVD devices
      if (input.invasiveness === 'implantable') {
        suggestedClass = 'Class III';
        reasoning.push('Implantable device typically Class III');
        confidence = 'medium';
      } else if (input.invasiveness === 'invasive') {
        suggestedClass = 'Class II';
        reasoning.push('Surgically invasive typically Class II');
        confidence = 'medium';
      } else {
        suggestedClass = 'Class I';
        reasoning.push('Non-invasive typically Class I');
        confidence = 'medium';
      }
    }
    
    reasoning.push('FDA classification requires detailed product research');
    
    return {
      marketCode: 'US',
      marketName,
      suggestedClass,
      confidence,
      reasoning,
      rule,
      requiresExpertReview: true,
      alternativeClasses: ['Class I', 'Class II', 'Class III']
    };
  }

  private static classifyHealthCanada(
    marketName: string,
    input: DeviceClassificationInput
  ): ClassificationSuggestion {
    const reasoning: string[] = ['Health Canada classification system'];
    let suggestedClass = 'Class I';
    let confidence: 'high' | 'medium' | 'low' = 'low';
    
    reasoning.push('Health Canada follows risk-based classification');
    reasoning.push('Detailed analysis required for accurate classification');
    
    return {
      marketCode: 'CA',
      marketName,
      suggestedClass,
      confidence,
      reasoning,
      requiresExpertReview: true,
      alternativeClasses: ['Class I', 'Class II', 'Class III', 'Class IV']
    };
  }

  private static classifyTGA(
    marketName: string,
    input: DeviceClassificationInput
  ): ClassificationSuggestion {
    const reasoning: string[] = ['TGA (Australia) classification system'];
    let suggestedClass = 'Class I';
    let confidence: 'high' | 'medium' | 'low' = 'low';
    
    reasoning.push('TGA classification similar to EU MDR');
    reasoning.push('Detailed analysis required for accurate classification');
    
    return {
      marketCode: 'AU',
      marketName,
      suggestedClass,
      confidence,
      reasoning,
      requiresExpertReview: true,
      alternativeClasses: ['Class I', 'Class IIa', 'Class IIb', 'Class III']
    };
  }

  private static classifyGeneric(
    marketCode: string,
    marketName: string,
    input: DeviceClassificationInput
  ): ClassificationSuggestion {
    const reasoning: string[] = [`${marketName} classification system`];
    let suggestedClass = 'Classification TBD';
    let confidence: 'high' | 'medium' | 'low' = 'low';
    
    reasoning.push('Market-specific classification rules not implemented');
    reasoning.push('Expert consultation required');
    
    return {
      marketCode,
      marketName,
      suggestedClass,
      confidence,
      reasoning,
      requiresExpertReview: true
    };
  }
}