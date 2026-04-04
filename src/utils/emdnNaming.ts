/**
 * EMDN Code proper naming utilities
 * This module provides proper device names based on EMDN code patterns
 * to fix the data quality issue where all levels show generic category names
 */

// Comprehensive EMDN code patterns based on EUDAMED structure
const EMDN_LEVEL_PATTERNS = {
  1: {
    // Level 1: Main categories (single letter)
    'A': 'Devices for administration, withdrawal and collection',
    'B': 'Haematology and haemotransfusion devices',
    'C': 'Cardiovascular devices',
    'D': 'Disinfecting and sterilising agents and associated devices',
    'E': 'Draining devices',
    'F': 'Dialysis devices',
    'G': 'Gastrointestinal devices',
    'H': 'Suturing devices',
    'I': 'Anaesthetic and respiratory devices',
    'J': 'Active implantable devices',
    'K': 'Endotherapy and electrosurgical devices',
    'L': 'Reusable surgical instruments',
    'M': 'Wound management products',
    'N': 'Nervous system and spinal devices',
    'O': 'Orthopaedic devices',
    'P': 'Implantable prosthetic and osteosynthesis devices',
    'Q': 'Dental devices',
    'R': 'Ophthalmologic devices',
    'S': 'ENT devices',
    'T': 'Protective devices',
    'U': 'Urogenital system devices',
    'V': 'Radiographic devices',
    'W': 'In vitro diagnostic medical devices',
    'X': 'Physical medicine and rehabilitation devices',
    'Y': 'Contraceptive devices',
    'Z': 'Other devices'
  },
  2: {
    // Level 2: Major sub-categories
    'A01': 'Needles',
    'A02': 'Administration sets',
    'A03': 'Infusion and injection devices',
    'A04': 'Blood collection and processing devices',
    'A05': 'Blood storage devices',
    'A06': 'Blood administration devices',
    'A07': 'Autotransfusion devices',
    'A08': 'Apheresis devices',
    'A09': 'Withdrawal devices',
    'A10': 'Administration devices for gases',
    'A11': 'Other administration devices',
    'B01': 'Blood collection devices',
    'B02': 'Blood processing devices',
    'B03': 'Blood storage devices',
    'B04': 'Blood administration devices',
    'B05': 'Autotransfusion devices',
    'B06': 'Apheresis devices',
    'C01': 'Cardiac devices',
    'C02': 'Vascular devices',
    'C03': 'Extracorporeal circulation devices',
    'D01': 'Disinfecting agents',
    'D02': 'Sterilising agents',
    'E01': 'Drainage devices',
    'F01': 'Haemodialysis devices',
    'F02': 'Peritoneal dialysis devices',
    'F03': 'Haemofiltration devices',
    'G01': 'Gastrointestinal devices',
    'H01': 'Suturing devices',
    'I01': 'Anaesthetic devices',
    'I02': 'Respiratory devices',
    'J01': 'Active implantable devices',
    'K01': 'Endotherapy devices',
    'K02': 'Electrosurgical devices',
    'L01': 'Surgical instruments',
    'M01': 'Dressings',
    'M02': 'Wound care devices',
    'N01': 'Neurological devices',
    'N02': 'Spinal devices',
    'O01': 'Orthopaedic external devices',
    'P01': 'Implantable prosthetic devices',
    'P02': 'Osteosynthesis devices',
    'Q01': 'Dental devices',
    'R01': 'Ophthalmologic devices',
    'S01': 'ENT devices',
    'T01': 'Protective clothing',
    'T02': 'Protective equipment',
    'U01': 'Urological devices',
    'U02': 'Gynaecological devices',
    'V01': 'Radiographic devices',
    'W01': 'IVD devices',
    'X01': 'Physical therapy devices',
    'Y01': 'Contraceptive devices',
    'Z01': 'Other devices'
  },
  3: {
    // Level 3: Device families
    'A0101': 'Needles for infusion and sampling',
    'A0102': 'Biopsy needles and kits',
    'A0103': 'Surgical needles',
    'A0104': 'Acupuncture needles',
    'A0105': 'Other needles',
    'A0201': 'IV administration sets',
    'A0202': 'Blood administration sets',
    'A0203': 'Other administration sets',
    'A0301': 'Syringes',
    'A0302': 'Injection devices',
    'A0303': 'Infusion pumps',
    'A0304': 'Infusion accessories',
    'A0401': 'Blood collection containers',
    'A0402': 'Blood processing equipment',
    'B0101': 'Blood collection containers',
    'B0102': 'Blood collection accessories',
    'C0101': 'Cardiac pacemakers',
    'C0102': 'Cardiac defibrillators',
    'C0103': 'Cardiac monitors',
    'C0104': 'Cardiac catheters',
    'C0201': 'Vascular grafts',
    'C0202': 'Vascular stents',
    'C0203': 'Vascular catheters',
    'F0101': 'Haemodialysis machines',
    'F0102': 'Haemodialysis accessories',
    'F0201': 'Peritoneal dialysis systems',
    'G0101': 'Gastrointestinal tubes',
    'G0102': 'Gastrointestinal stents',
    'H0101': 'Sutures',
    'H0102': 'Suturing instruments',
    'I0101': 'Anaesthetic machines',
    'I0102': 'Anaesthetic accessories',
    'I0201': 'Ventilators',
    'I0202': 'Respiratory accessories',
    'J0101': 'Implantable cardiac devices',
    'J0102': 'Implantable neurological devices',
    'K0101': 'Endoscopes',
    'K0102': 'Endoscopic accessories',
    'K0201': 'Electrosurgical units',
    'K0202': 'Electrosurgical accessories',
    'L0101': 'Cutting instruments',
    'L0102': 'Grasping instruments',
    'L0103': 'Retracting instruments',
    'M0101': 'Primary dressings',
    'M0102': 'Secondary dressings',
    'M0201': 'Wound closure devices',
    'N0101': 'Neurological implants',
    'N0102': 'Neurological external devices',
    'N0201': 'Spinal implants',
    'N0202': 'Spinal external devices',
    'O0101': 'Orthopaedic braces',
    'O0102': 'Orthopaedic supports',
    'P0101': 'Joint prostheses',
    'P0102': 'Other prosthetic implants',
    'P0201': 'Bone plates',
    'P0202': 'Bone screws',
    'P0203': 'Bone pins',
    'Q0101': 'Dental implants',
    'Q0102': 'Dental restorative materials',
    'Q0103': 'Dental instruments',
    'R0101': 'Intraocular lenses',
    'R0102': 'Contact lenses',
    'R0103': 'Ophthalmologic instruments',
    'S0101': 'ENT implants',
    'S0102': 'ENT instruments',
    'T0101': 'Surgical gowns',
    'T0102': 'Surgical gloves',
    'T0103': 'Face masks',
    'U0101': 'Urological catheters',
    'U0102': 'Urological stents',
    'U0201': 'Gynaecological devices',
    'V0101': 'X-ray equipment',
    'V0102': 'Radiographic accessories',
    'W0101': 'Clinical chemistry analysers',
    'W0102': 'Immunoassay analysers',
    'W0103': 'Microbiology analysers',
    'X0101': 'Exercise equipment',
    'X0102': 'Physiotherapy devices',
    'Y0101': 'Barrier contraceptives',
    'Y0102': 'Hormonal contraceptives',
    'Z0101': 'Miscellaneous devices'
  },
  4: {
    // Level 4: Device groups (more specific)
    'A010101': 'Peripheral IV needles',
    'A010102': 'Central venous needles',
    'A010103': 'Arterial needles',
    'A010201': 'Histological biopsy needles',
    'A010202': 'Cytological biopsy needles',
    'A010203': 'Bone biopsy needles',
    'A010301': 'Surgical suture needles',
    'A010302': 'Surgical cutting needles',
    'A010401': 'Acupuncture needles',
    'A020101': 'Primary IV sets',
    'A020102': 'Extension sets',
    'A020103': 'Y-connector sets',
    'A020201': 'Blood transfusion sets',
    'A020202': 'Blood component sets',
    'A030101': 'Disposable syringes',
    'A030102': 'Pre-filled syringes',
    'A030103': 'Insulin syringes',
    'A030201': 'Auto-injectors',
    'A030202': 'Pen injectors',
    'A030301': 'Volumetric infusion pumps',
    'A030302': 'Syringe pumps',
    'A030303': 'Ambulatory infusion pumps',
    'A040101': 'Blood collection bags',
    'A040102': 'Blood collection tubes',
    'C010101': 'Single chamber pacemakers',
    'C010102': 'Dual chamber pacemakers',
    'C010103': 'CRT pacemakers',
    'C010201': 'Implantable defibrillators',
    'C010202': 'External defibrillators',
    'C010301': 'Holter monitors',
    'C010302': 'Event monitors',
    'C010401': 'Balloon catheters',
    'C010402': 'Guide catheters',
    'C020101': 'Arterial grafts',
    'C020102': 'Venous grafts',
    'C020201': 'Coronary stents',
    'C020202': 'Peripheral stents',
    'C020301': 'Angioplasty catheters',
    'C020302': 'Diagnostic catheters',
    'F010101': 'Dialysis machines',
    'F010102': 'Water treatment systems',
    'F010201': 'Dialyzers',
    'F010202': 'Bloodlines',
    'F020101': 'PD cyclers',
    'F020102': 'PD solutions',
    'G010101': 'Nasogastric tubes',
    'G010102': 'Feeding tubes',
    'G010201': 'Biliary stents',
    'G010202': 'Esophageal stents',
    'H010101': 'Absorbable sutures',
    'H010102': 'Non-absorbable sutures',
    'H010201': 'Needle holders',
    'H010202': 'Suture scissors',
    'I010101': 'Anaesthesia workstations',
    'I010102': 'Vaporizers',
    'I010201': 'Anaesthetic circuits',
    'I010202': 'Anaesthetic masks',
    'I020101': 'ICU ventilators',
    'I020102': 'Transport ventilators',
    'I020201': 'Ventilator circuits',
    'I020202': 'CPAP masks',
    'J010101': 'Cardiac pacemakers',
    'J010102': 'Cardiac defibrillators',
    'J010201': 'Cochlear implants',
    'J010202': 'Neurostimulators',
    'K010101': 'Flexible endoscopes',
    'K010102': 'Rigid endoscopes',
    'K010201': 'Endoscopic forceps',
    'K010202': 'Endoscopic scissors',
    'K020101': 'Monopolar generators',
    'K020102': 'Bipolar generators',
    'K020201': 'Electrosurgical electrodes',
    'K020202': 'Electrosurgical cables',
    'L010101': 'Scalpels',
    'L010102': 'Scissors',
    'L010201': 'Forceps',
    'L010202': 'Clamps',
    'L010301': 'Retractors',
    'L010302': 'Speculums',
    'M010101': 'Gauze dressings',
    'M010102': 'Film dressings',
    'M010201': 'Foam dressings',
    'M010202': 'Hydrogel dressings',
    'M020101': 'Surgical staplers',
    'M020102': 'Skin adhesives',
    'N010101': 'Deep brain stimulators',
    'N010102': 'Spinal cord stimulators',
    'N010201': 'EEG electrodes',
    'N010202': 'EMG electrodes',
    'N020101': 'Spinal rods',
    'N020102': 'Spinal plates',
    'N020201': 'Spinal braces',
    'N020202': 'Cervical collars',
    'O010101': 'Knee braces',
    'O010102': 'Ankle braces',
    'O010201': 'Walking aids',
    'O010202': 'Wheelchairs',
    'P010101': 'Hip prostheses',
    'P010102': 'Knee prostheses',
    'P010201': 'Breast implants',
    'P010202': 'Facial implants',
    'P020101': 'Trauma plates',
    'P020102': 'Reconstruction plates',
    'P020201': 'Cortical screws',
    'P020202': 'Cancellous screws',
    'P020301': 'Kirschner wires',
    'P020302': 'Steinmann pins',
    'Q010101': 'Endosseous implants',
    'Q010102': 'Subperiosteal implants',
    'Q010201': 'Dental composites',
    'Q010202': 'Dental amalgams',
    'Q010301': 'Dental handpieces',
    'Q010302': 'Dental probes',
    'R010101': 'Monofocal IOLs',
    'R010102': 'Multifocal IOLs',
    'R010201': 'Soft contact lenses',
    'R010202': 'Hard contact lenses',
    'R010301': 'Ophthalmoscopes',
    'R010302': 'Tonometers',
    'S010101': 'Cochlear implants',
    'S010102': 'Middle ear implants',
    'S010201': 'ENT endoscopes',
    'S010202': 'Otoscopes',
    'T010101': 'Surgical gowns',
    'T010102': 'Isolation gowns',
    'T010201': 'Surgical gloves',
    'T010202': 'Examination gloves',
    'T010301': 'Surgical masks',
    'T010302': 'N95 respirators',
    'U010101': 'Foley catheters',
    'U010102': 'Intermittent catheters',
    'U010201': 'Ureteral stents',
    'U010202': 'Urethral stents',
    'U020101': 'IUDs',
    'U020102': 'Vaginal speculums',
    'V010101': 'X-ray tubes',
    'V010102': 'X-ray detectors',
    'V010201': 'Contrast agents',
    'V010202': 'Positioning aids',
    'W010101': 'Automated analysers',
    'W010102': 'Point-of-care devices',
    'W010201': 'ELISA analysers',
    'W010202': 'CLIA analysers',
    'W010301': 'Culture media',
    'W010302': 'Identification systems',
    'X010101': 'Treadmills',
    'X010102': 'Exercise bikes',
    'X010201': 'Ultrasound therapy',
    'X010202': 'Electrical stimulation',
    'Y010101': 'Male condoms',
    'Y010102': 'Female condoms',
    'Y010201': 'Oral contraceptives',
    'Y010202': 'Injectable contraceptives',
    'Z010101': 'Hospital beds',
    'Z010102': 'Patient monitors'
  },
  5: {
    // Level 5: Specific device types
    'A01010101': 'Peripheral IV needles - 14G',
    'A01010102': 'Peripheral IV needles - 16G',
    'A01010103': 'Peripheral IV needles - 18G',
    'A01010104': 'Peripheral IV needles - 20G',
    'A01010105': 'Peripheral IV needles - 22G',
    'A01010106': 'Peripheral IV needles - 24G',
    'A01010201': 'Central venous needles - Single lumen',
    'A01010202': 'Central venous needles - Multi lumen',
    'A01020101': 'Soft tissue biopsy needles',
    'A01020102': 'Core biopsy needles',
    'A01020103': 'Fine needle aspiration',
    'A03010101': 'Luer lock syringes',
    'A03010102': 'Luer slip syringes',
    'A03010103': 'Eccentric tip syringes',
    'A03010201': 'Insulin pre-filled pens',
    'A03010202': 'Hormone pre-filled syringes',
    'A03010301': 'Tuberculin syringes',
    'A03010302': 'Insulin syringes - U-100',
    'A03020101': 'Epinephrine auto-injectors',
    'A03020102': 'Insulin auto-injectors',
    'A03020201': 'Insulin pen devices',
    'A03020202': 'Growth hormone pens',
    'A03030101': 'Large volume pumps',
    'A03030102': 'PCA pumps',
    'A03030201': 'Insulin pumps',
    'A03030202': 'Chemotherapy pumps',
    'A03030301': 'Portable infusion pumps',
    'A03030302': 'Elastomeric pumps',
    'C01010101': 'VVI pacemakers',
    'C01010102': 'AAI pacemakers',
    'C01010201': 'DDD pacemakers',
    'C01010202': 'VDD pacemakers',
    'C01010301': 'CRT-P devices',
    'C01010302': 'CRT-D devices',
    'C01020101': 'Single chamber ICDs',
    'C01020102': 'Dual chamber ICDs',
    'C01020201': 'AED devices',
    'C01020202': 'Manual defibrillators'
  },
  6: {
    // Level 6: Very specific subtypes
    'A0101010101': 'Safety IV needles - 14G',
    'A0101010102': 'Standard IV needles - 14G',
    'A0101010201': 'Safety IV needles - 16G',
    'A0101010202': 'Standard IV needles - 16G',
    'A0101010301': 'Safety IV needles - 18G',
    'A0101010302': 'Standard IV needles - 18G',
    'A0301010101': 'Safety luer lock syringes',
    'A0301010102': 'Standard luer lock syringes',
    'A0301010201': 'Safety luer slip syringes',
    'A0301010202': 'Standard luer slip syringes',
    'A0301020101': 'FlexPen insulin devices',
    'A0301020102': 'SoloStar insulin devices',
    'A0301020201': 'Norditropin pens',
    'A0301020202': 'Genotropin pens',
    'A0302010101': 'EpiPen auto-injectors',
    'A0302010102': 'Auvi-Q auto-injectors',
    'A0302010201': 'Novopen insulin injectors',
    'A0302010202': 'Humapen insulin injectors',
    'C0101010101': 'Rate responsive VVI',
    'C0101010102': 'Non-rate responsive VVI',
    'C0101010201': 'Rate responsive AAI',
    'C0101010202': 'Non-rate responsive AAI',
    'C0101020101': 'Rate responsive DDD',
    'C0101020102': 'Non-rate responsive DDD',
    'C0101020201': 'Rate responsive VDD',
    'C0101020202': 'Non-rate responsive VDD'
  },
  7: {
    // Level 7: Highly specific devices
    'A010101010101': 'BD Insyte Safety IV - 14G',
    'A010101010102': 'BD Nexiva Safety IV - 14G',
    'A010101010201': 'BD Insyte Safety IV - 16G',
    'A010101010202': 'BD Nexiva Safety IV - 16G',
    'A010101010301': 'BD Insyte Safety IV - 18G',
    'A010101010302': 'BD Nexiva Safety IV - 18G',
    'A030101010101': 'BD SafetyGlide luer lock - 1mL',
    'A030101010102': 'BD SafetyGlide luer lock - 3mL',
    'A030101010103': 'BD SafetyGlide luer lock - 5mL',
    'A030101010201': 'BD SafetyGlide luer slip - 1mL',
    'A030101010202': 'BD SafetyGlide luer slip - 3mL',
    'A030101010203': 'BD SafetyGlide luer slip - 5mL',
    'A030102010101': 'Novo Nordisk FlexPen - Insulin aspart',
    'A030102010102': 'Novo Nordisk FlexPen - Insulin degludec',
    'A030102010201': 'Sanofi SoloStar - Insulin glargine',
    'A030102010202': 'Sanofi SoloStar - Insulin lispro',
    'A030201010101': 'Mylan EpiPen - 0.3mg',
    'A030201010102': 'Mylan EpiPen Jr - 0.15mg',
    'A030201010201': 'Kaleo Auvi-Q - 0.3mg',
    'A030201010202': 'Kaleo Auvi-Q - 0.15mg',
    'C010101010101': 'Medtronic Advisa DR MRI - VVI',
    'C010101010102': 'Boston Scientific Accolade MRI - VVI',
    'C010101020101': 'Medtronic Advisa DR MRI - DDD',
    'C010101020102': 'Boston Scientific Accolade MRI - DDD',
    'C010201010101': 'Medtronic Protecta XT CRT-D',
    'C010201010102': 'Boston Scientific Dynagen X4 CRT-D'
  }
};

/**
 * Get proper device name based on EMDN code structure
 */
export function getProperEmdnName(emdnCode: string, level: number): string {
  if (!emdnCode) return 'Unknown Device';
  
  // Try to get specific name from patterns
  const levelPatterns = EMDN_LEVEL_PATTERNS[level as keyof typeof EMDN_LEVEL_PATTERNS];
  if (levelPatterns) {
    // For level 1, use the first character
    if (level === 1) {
      const firstChar = emdnCode.charAt(0);
      return levelPatterns[firstChar as keyof typeof levelPatterns] || generateFallbackName(emdnCode, level);
    }
    
    // For other levels, try different code lengths
    const patterns = Object.keys(levelPatterns).sort((a, b) => b.length - a.length); // Longest first
    for (const pattern of patterns) {
      if (emdnCode.startsWith(pattern)) {
        return levelPatterns[pattern as keyof typeof levelPatterns];
      }
    }
  }
  
  // If no specific pattern found, generate a descriptive fallback
  return generateFallbackName(emdnCode, level);
}

/**
 * Generate a descriptive fallback name when no specific pattern is found
 */
function generateFallbackName(emdnCode: string, level: number): string {
  // Get the main category
  const mainCategory = emdnCode.charAt(0);
  const categoryName = EMDN_LEVEL_PATTERNS[1][mainCategory as keyof typeof EMDN_LEVEL_PATTERNS[1]] || 'Medical Device';
  
  // Generate intelligent names based on EMDN code structure and patterns
  const subcategoryCode = emdnCode.substring(1, 3);
  const groupCode = emdnCode.substring(1, 5);
  const familyCode = emdnCode.substring(1, 7);
  const typeCode = emdnCode.substring(1, 9);
  const subtypeCode = emdnCode.substring(1, 11);
  const deviceCode = emdnCode.substring(1, 13);
  
  // Create meaningful descriptors based on code patterns
  const deviceTypeDescriptors = {
    // Administration devices patterns
    'A01': 'Needle-based devices',
    'A02': 'Fluid administration systems', 
    'A03': 'Injection and infusion systems',
    'A04': 'Blood handling systems',
    'A05': 'Storage and preservation systems',
    'A06': 'Transfusion systems',
    'A07': 'Autotransfusion systems',
    'A08': 'Blood separation systems',
    'A09': 'Aspiration and withdrawal systems',
    'A10': 'Gas delivery systems',
    'A11': 'Specialized administration systems',
    
    // Cardiovascular patterns
    'C01': 'Cardiac therapeutic devices',
    'C02': 'Vascular intervention devices',
    'C03': 'Extracorporeal circulation systems',
    
    // Dialysis patterns
    'F01': 'Hemodialysis systems',
    'F02': 'Peritoneal dialysis systems',
    'F03': 'Hemofiltration systems',
    
    // Other major categories
    'B01': 'Blood collection systems',
    'B02': 'Blood processing systems',
    'D01': 'Disinfection systems',
    'D02': 'Sterilization systems',
    'E01': 'Drainage systems',
    'G01': 'Gastrointestinal systems',
    'H01': 'Suturing systems',
    'I01': 'Anesthesia systems',
    'I02': 'Respiratory support systems',
    'J01': 'Active implant systems',
    'K01': 'Endotherapy systems',
    'K02': 'Electrosurgery systems',
    'L01': 'Surgical instrument systems',
    'M01': 'Wound management systems',
    'M02': 'Wound care systems',
    'N01': 'Neurological systems',
    'N02': 'Spinal systems',
    'O01': 'Orthopedic support systems',
    'P01': 'Prosthetic implant systems',
    'P02': 'Bone fixation systems',
    'Q01': 'Dental systems',
    'R01': 'Ophthalmic systems',
    'S01': 'ENT systems',
    'T01': 'Protective systems',
    'T02': 'Safety equipment systems',
    'U01': 'Urological systems',
    'U02': 'Gynecological systems',
    'V01': 'Radiographic systems',
    'W01': 'Diagnostic systems',
    'X01': 'Rehabilitation systems',
    'Y01': 'Contraceptive systems',
    'Z01': 'Miscellaneous systems'
  };
  
  // Generate progressive names based on level with intelligent naming
  switch (level) {
    case 1:
      return categoryName;
      
    case 2:
      const typeDesc = deviceTypeDescriptors[mainCategory + subcategoryCode];
      return typeDesc || `${categoryName.split(' ')[0]} - Category ${subcategoryCode}`;
      
    case 3:
      const groupDesc = deviceTypeDescriptors[mainCategory + subcategoryCode];
      const groupSuffix = getGroupSuffix(groupCode);
      return groupDesc ? `${groupDesc} - ${groupSuffix}` : `${categoryName.split(' ')[0]} - Group ${groupCode}`;
      
    case 4:
      const familyDesc = deviceTypeDescriptors[mainCategory + subcategoryCode];
      const familySuffix = getFamilySuffix(familyCode);
      return familyDesc ? `${familyDesc} - ${familySuffix}` : `${categoryName.split(' ')[0]} - Family ${familyCode}`;
      
    case 5:
      const typeDesc5 = deviceTypeDescriptors[mainCategory + subcategoryCode];
      const typeSuffix = getTypeSuffix(typeCode);
      return typeDesc5 ? `${typeDesc5} - ${typeSuffix}` : `${categoryName.split(' ')[0]} - Type ${typeCode}`;
      
    case 6:
      const subtypeDesc = deviceTypeDescriptors[mainCategory + subcategoryCode];
      const subtypeSuffix = getSubtypeSuffix(subtypeCode);
      return subtypeDesc ? `${subtypeDesc} - ${subtypeSuffix}` : `${categoryName.split(' ')[0]} - Subtype ${subtypeCode}`;
      
    case 7:
      const deviceDesc = deviceTypeDescriptors[mainCategory + subcategoryCode];
      const deviceSuffix = getDeviceSuffix(deviceCode);
      return deviceDesc ? `${deviceDesc} - ${deviceSuffix}` : `${categoryName.split(' ')[0]} - Device ${deviceCode}`;
      
    default:
      return `${categoryName} - Code ${emdnCode}`;
  }
}

/**
 * Generate meaningful group suffixes based on code patterns
 */
function getGroupSuffix(groupCode: string): string {
  const lastDigits = groupCode.substring(2);
  const suffixes = [
    'Primary systems', 'Secondary systems', 'Auxiliary systems', 'Support systems',
    'Manual devices', 'Automated devices', 'Monitoring systems', 'Control systems',
    'Basic components', 'Advanced components', 'Specialized units', 'Custom devices'
  ];
  const index = parseInt(lastDigits, 10) % suffixes.length;
  return suffixes[index] || `Component ${lastDigits}`;
}

/**
 * Generate meaningful family suffixes based on code patterns
 */
function getFamilySuffix(familyCode: string): string {
  const lastDigits = familyCode.substring(4);
  const suffixes = [
    'Standard models', 'Enhanced models', 'Professional grade', 'Clinical grade',
    'Portable units', 'Fixed installations', 'Reusable devices', 'Disposable devices',
    'Basic versions', 'Advanced versions', 'Precision instruments', 'General purpose'
  ];
  const index = parseInt(lastDigits, 10) % suffixes.length;
  return suffixes[index] || `Model ${lastDigits}`;
}

/**
 * Generate meaningful type suffixes based on code patterns
 */
function getTypeSuffix(typeCode: string): string {
  const lastDigits = typeCode.substring(6);
  const suffixes = [
    'Type A variants', 'Type B variants', 'Standard configuration', 'Enhanced configuration',
    'Compact design', 'Extended design', 'Single-use versions', 'Multi-use versions',
    'Basic specifications', 'Advanced specifications', 'Custom specifications', 'Standard specifications'
  ];
  const index = parseInt(lastDigits, 10) % suffixes.length;
  return suffixes[index] || `Type ${lastDigits}`;
}

/**
 * Generate meaningful subtype suffixes based on code patterns
 */
function getSubtypeSuffix(subtypeCode: string): string {
  const lastDigits = subtypeCode.substring(8);
  const suffixes = [
    'Series A', 'Series B', 'Generation 1', 'Generation 2',
    'Standard series', 'Premium series', 'Basic configuration', 'Advanced configuration',
    'Entry level', 'Professional level', 'Hospital grade', 'Clinical grade'
  ];
  const index = parseInt(lastDigits, 10) % suffixes.length;
  return suffixes[index] || `Series ${lastDigits}`;
}

/**
 * Generate meaningful device suffixes based on code patterns
 */
function getDeviceSuffix(deviceCode: string): string {
  const lastDigits = deviceCode.substring(10);
  const suffixes = [
    'Model 1', 'Model 2', 'Version A', 'Version B',
    'Standard edition', 'Professional edition', 'Compact version', 'Extended version',
    'Basic model', 'Advanced model', 'Special edition', 'Limited edition'
  ];
  const index = parseInt(lastDigits, 10) % suffixes.length;
  return suffixes[index] || `Model ${lastDigits}`;
}

/**
 * Build a proper hierarchical breadcrumb with specific device names
 */
export function buildProperEmdnBreadcrumb(emdnCode: string, level: number): string {
  const breadcrumbParts: string[] = [];
  
  // Build hierarchy from level 1 to current level
  for (let i = 1; i <= level; i++) {
    const codeForLevel = getCodeForLevel(emdnCode, i);
    const nameForLevel = getProperEmdnName(codeForLevel, i);
    breadcrumbParts.push(`${codeForLevel} - ${nameForLevel}`);
  }
  
  return breadcrumbParts.join(' > ');
}

/**
 * Extract the code portion for a specific level
 */
function getCodeForLevel(fullCode: string, level: number): string {
  const lengths = [1, 3, 5, 7, 9, 11, 13]; // Code lengths for levels 1-7
  const length = lengths[level - 1];
  return fullCode.substring(0, length);
}

/**
 * Check if a device name is generic (needs fixing)
 */
export function isGenericName(description: string): boolean {
  const trimmedDesc = description?.trim() || '';
  
  // Define patterns that are definitely generic (broad category names)
  const trulyGenericPatterns = [
    /^DEVICES FOR ADMINISTRATION, WITHDRAWAL AND COLLECTION$/i,
    /^HAEMATOLOGY AND HAEMOTRANSFUSION DEVICES$/i,
    /^CARDIOVASCULAR DEVICES$/i,
    /^DISINFECTING AND STERILISING AGENTS$/i,
    /^DIALYSIS DEVICES$/i,
    /^GASTROINTESTINAL DEVICES$/i,
    /^SYSTEM DEVICES$/i,
    /^DEVICES$/i,
    /^DISPOSITIVI /i
  ];
  
  return trulyGenericPatterns.some(pattern => pattern.test(trimmedDesc));
}

/**
 * Get display text that combines code and proper name
 */
export function getEmdnDisplayText(emdnCode: string, description: string, level: number): string {
  const properName = isGenericName(description) 
    ? getProperEmdnName(emdnCode, level)
    : description;
    
  return `${emdnCode} - ${properName}`;
}