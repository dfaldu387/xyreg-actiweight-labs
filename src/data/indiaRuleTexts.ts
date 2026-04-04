// CDSCO Medical Devices Rules, 2017 - Rule text explanations for India

export const indiaRuleTexts: Record<string, { title: string; content: string }> = {
  'CDSCO Rule 1': {
    title: 'Rule 1 - Non-Invasive, No Patient Contact',
    content: `**Class A - Low Risk**

Non-invasive devices that do not come into direct contact with the patient fall under Class A.

**Examples:**
- Hospital beds and stretchers
- Patient transport equipment
- Examination tables
- Storage and transport containers for body parts

**Regulatory Requirements:**
- Registration with CDSCO
- Quality Management System (ISO 13485)
- Basic safety testing
- Labeling compliance

**Reference:** Medical Devices Rules, 2017 - First Schedule, Part I`
  },
  'CDSCO Rule 2': {
    title: 'Rule 2 - Non-Invasive, Intact Skin Contact',
    content: `**Class A - Low Risk**

Non-invasive devices intended for channeling or storing blood, body liquids, cells or tissues, liquids or gases for eventual infusion, administration or introduction into the body, provided that such devices are not connected to a higher class active device.

**Examples:**
- Electrodes for ECG monitoring
- Compression bandages
- Wound dressings (non-medicated)
- Stethoscopes

**Regulatory Requirements:**
- Registration with CDSCO
- Quality Management System
- Biocompatibility assessment for patient-contacting materials
- Performance testing

**Reference:** Medical Devices Rules, 2017 - First Schedule, Part I`
  },
  'CDSCO Rule 3a': {
    title: 'Rule 3a - Basic Storage/Channeling',
    content: `**Class A - Low Risk**

Non-invasive devices used for basic storage or gravity-fed administration of fluids or tissues.

**Examples:**
- Simple collection bags
- Gravity-fed infusion sets (non-controlled)
- Basic drainage systems

**Regulatory Requirements:**
- CDSCO registration
- ISO 13485 certification
- Basic performance and safety testing

**Reference:** Medical Devices Rules, 2017 - First Schedule, Part I`
  },
  'CDSCO Rule 3b': {
    title: 'Rule 3b - Blood/Biological Fluid Administration',
    content: `**Class B - Low-Moderate Risk**

Non-invasive devices intended for channeling blood or blood products, or devices used in transfusion/infusion processes.

**Examples:**
- Blood bags and blood collection systems
- Blood administration sets
- Biological fluid containers

**Regulatory Requirements:**
- CDSCO registration
- ISO 13485 certification
- Biocompatibility testing
- Sterility validation
- Clinical performance data

**Reference:** Medical Devices Rules, 2017 - First Schedule, Part II`
  },
  'CDSCO Rule 3c': {
    title: 'Rule 3c - Active Infusion Devices',
    content: `**Class C - Moderate-High Risk**

Non-invasive devices for active infusion where potential for error could lead to patient harm.

**Examples:**
- Infusion pumps
- Volumetric pumps
- Syringe drivers

**Regulatory Requirements:**
- CDSCO import/manufacturing license
- ISO 13485 certification
- Complete technical documentation
- Clinical evidence
- Software validation (if applicable)

**Reference:** Medical Devices Rules, 2017 - First Schedule, Part III`
  },
  'CDSCO Rule 4': {
    title: 'Rule 4 - Modifying Biological Composition',
    content: `**Class C - Moderate-High Risk**

Non-invasive devices intended to modify the biological or chemical composition of blood, body liquids, or other liquids intended for infusion into the body.

**Examples:**
- Dialysis machines
- Blood cell separators
- Plasma treatment devices
- Haemodialysis equipment

**Regulatory Requirements:**
- CDSCO import/manufacturing license
- Complete technical file
- Clinical investigation data
- Post-market surveillance plan
- ISO 13485 certification

**Reference:** Medical Devices Rules, 2017 - First Schedule, Part III`
  },
  'CDSCO Rule 5a': {
    title: 'Rule 5a - Transient Invasive (Oral/Ear/Nasal)',
    content: `**Class A - Low Risk**

Invasive devices for transient use (less than 60 minutes) in body orifices such as oral cavity, ear canal, or nasal cavity.

**Examples:**
- Dental mirrors and probes
- Examination specula
- Ear examination devices
- Nasal aspirators

**Regulatory Requirements:**
- CDSCO registration
- ISO 13485 certification
- Basic biocompatibility testing

**Reference:** Medical Devices Rules, 2017 - First Schedule, Part I`
  },
  'CDSCO Rule 5b': {
    title: 'Rule 5b - Transient Surgically Invasive',
    content: `**Class B - Low-Moderate Risk**

Surgically invasive devices intended for transient use.

**Examples:**
- Surgical needles
- Surgical gloves
- Scalpels and surgical blades
- Suture needles

**Regulatory Requirements:**
- CDSCO registration
- ISO 13485 certification
- Biocompatibility testing
- Sterility validation

**Reference:** Medical Devices Rules, 2017 - First Schedule, Part II`
  },
  'CDSCO Rule 5c': {
    title: 'Rule 5c - Transient CNS/Central Circulation',
    content: `**Class D - High Risk**

Transient invasive devices intended for direct contact with the central nervous system or central circulatory system.

**Examples:**
- Vascular introducers
- Cardiac catheters (short-term)
- CNS access devices

**Regulatory Requirements:**
- CDSCO import/manufacturing license
- Complete technical file with clinical data
- Clinical investigation may be required
- Post-market clinical follow-up
- ISO 13485 certification

**Reference:** Medical Devices Rules, 2017 - First Schedule, Part IV`
  },
  'CDSCO Rule 6a': {
    title: 'Rule 6a - Short-Term Natural Orifice',
    content: `**Class B - Low-Moderate Risk**

Invasive devices intended for short-term use (less than 30 days) in natural body orifices.

**Examples:**
- Urinary catheters
- Tracheal tubes
- Gastrointestinal tubes
- Contact lenses

**Regulatory Requirements:**
- CDSCO registration
- ISO 13485 certification
- Biocompatibility testing
- Performance validation

**Reference:** Medical Devices Rules, 2017 - First Schedule, Part II`
  },
  'CDSCO Rule 6b': {
    title: 'Rule 6b - Short-Term Surgically Invasive',
    content: `**Class C - Moderate-High Risk**

Surgically invasive devices intended for short-term use.

**Examples:**
- Surgical drains
- Temporary bone fixation devices
- Wound closure devices
- Surgical mesh (temporary)

**Regulatory Requirements:**
- CDSCO import/manufacturing license
- Complete technical file
- Clinical evidence
- ISO 13485 certification
- Biocompatibility and sterility testing

**Reference:** Medical Devices Rules, 2017 - First Schedule, Part III`
  },
  'CDSCO Rule 6c': {
    title: 'Rule 6c - Short-Term Heart/Central Circulation',
    content: `**Class D - High Risk**

Short-term invasive devices intended for use in direct contact with the heart or central circulatory system.

**Examples:**
- Cardiac catheters
- Central venous catheters
- Temporary pacemaker leads
- ECMO circuits

**Regulatory Requirements:**
- CDSCO import/manufacturing license
- Clinical investigation data
- Post-market surveillance
- Complete technical documentation
- ISO 13485 certification

**Reference:** Medical Devices Rules, 2017 - First Schedule, Part IV`
  },
  'CDSCO Rule 7a': {
    title: 'Rule 7a - General Long-Term Implantable',
    content: `**Class C - Moderate-High Risk**

Implantable devices intended for long-term use (more than 30 days) that do not directly contact heart, CNS, or have biological effects.

**Examples:**
- Orthopaedic plates and screws
- Dental implants
- Breast implants (non-biological)
- Intraocular lenses

**Regulatory Requirements:**
- CDSCO import/manufacturing license
- Clinical performance data
- Biocompatibility testing (ISO 10993)
- Long-term safety data
- Post-market surveillance plan

**Reference:** Medical Devices Rules, 2017 - First Schedule, Part III`
  },
  'CDSCO Rule 7b': {
    title: 'Rule 7b - Cardiac/Vascular Implants',
    content: `**Class D - High Risk**

Implantable devices intended for long-term use in direct contact with the heart or central circulatory system.

**Examples:**
- Cardiac valves
- Coronary stents
- Pacemakers and ICDs
- Vascular grafts
- Heart valves

**Regulatory Requirements:**
- CDSCO import/manufacturing license
- Clinical investigation required
- Long-term clinical follow-up data
- Complete technical file
- Post-market clinical follow-up (PMCF)
- ISO 13485 certification

**Reference:** Medical Devices Rules, 2017 - First Schedule, Part IV`
  },
  'CDSCO Rule 7c': {
    title: 'Rule 7c - Biological Effect Implants',
    content: `**Class D - High Risk**

Implantable devices intended to have a biological effect or incorporate medicinal substances.

**Examples:**
- Drug-eluting stents
- Tissue-engineered products
- Devices with biological coatings
- Drug delivery implants

**Regulatory Requirements:**
- CDSCO import/manufacturing license
- Clinical investigation required
- Drug/biological evaluation
- Long-term safety and efficacy data
- Post-market surveillance
- Combination product assessment

**Reference:** Medical Devices Rules, 2017 - First Schedule, Part IV`
  },
  'CDSCO Rule 7d': {
    title: 'Rule 7d - Joint Replacement Devices',
    content: `**Class D - High Risk**

Total or partial joint replacement devices.

**Examples:**
- Hip replacement systems
- Knee replacement systems
- Shoulder prostheses
- Spinal disc replacements

**Regulatory Requirements:**
- CDSCO import/manufacturing license
- Clinical investigation data (often required)
- Long-term clinical performance data
- Wear and mechanical testing
- Biocompatibility testing
- Post-market clinical follow-up

**Reference:** Medical Devices Rules, 2017 - First Schedule, Part IV`
  },
  'CDSCO Rule 8a': {
    title: 'Rule 8a - Low Energy Therapeutic Devices',
    content: `**Class B - Low-Moderate Risk**

Active therapeutic devices intended to deliver or exchange energy in non-hazardous manner.

**Examples:**
- TENS units
- Muscle stimulators
- Heat therapy devices
- Ultrasound therapy devices

**Regulatory Requirements:**
- CDSCO registration
- Electrical safety testing (IEC 60601)
- Performance validation
- ISO 13485 certification

**Reference:** Medical Devices Rules, 2017 - First Schedule, Part II`
  },
  'CDSCO Rule 8b': {
    title: 'Rule 8b - Ionizing Radiation Therapeutic',
    content: `**Class C - Moderate-High Risk**

Active therapeutic devices using ionizing radiation.

**Examples:**
- X-ray therapy equipment
- Radiotherapy systems
- Brachytherapy devices

**Regulatory Requirements:**
- CDSCO import/manufacturing license
- Radiation safety compliance (AERB)
- Complete technical file
- Clinical evidence
- Specialized installation requirements

**Reference:** Medical Devices Rules, 2017 - First Schedule, Part III`
  },
  'CDSCO Rule 8c': {
    title: 'Rule 8c - High Energy Therapeutic Devices',
    content: `**Class C - Moderate-High Risk**

Active therapeutic devices delivering energy in potentially hazardous manner.

**Examples:**
- Defibrillators
- Surgical lasers
- Electrosurgical units
- Lithotripters

**Regulatory Requirements:**
- CDSCO import/manufacturing license
- Electrical safety testing
- Clinical performance data
- Risk management file
- ISO 13485 certification

**Reference:** Medical Devices Rules, 2017 - First Schedule, Part III`
  },
  'CDSCO Rule 8d': {
    title: 'Rule 8d - Life-Sustaining Active Devices',
    content: `**Class D - High Risk**

Active devices intended to sustain or support life.

**Examples:**
- Ventilators
- Cardiac assist devices
- External pacemakers
- Life support systems
- Heart-lung machines

**Regulatory Requirements:**
- CDSCO import/manufacturing license
- Clinical investigation data
- Comprehensive risk management
- Post-market surveillance
- Redundancy and fail-safe requirements
- ISO 13485 certification

**Reference:** Medical Devices Rules, 2017 - First Schedule, Part IV`
  },
  'CDSCO Rule 9a': {
    title: 'Rule 9a - General Diagnostic Imaging',
    content: `**Class B - Low-Moderate Risk**

Active devices intended for diagnosis, monitoring or imaging that are not critical to immediate health decisions.

**Examples:**
- Diagnostic ultrasound
- ECG machines
- Blood pressure monitors
- Pulse oximeters

**Regulatory Requirements:**
- CDSCO registration
- Electrical safety testing (IEC 60601)
- Performance validation
- ISO 13485 certification

**Reference:** Medical Devices Rules, 2017 - First Schedule, Part II`
  },
  'CDSCO Rule 9b': {
    title: 'Rule 9b - Ionizing Radiation Diagnostic',
    content: `**Class C - Moderate-High Risk**

Active diagnostic devices using ionizing radiation.

**Examples:**
- Diagnostic X-ray systems
- CT scanners
- Fluoroscopy equipment
- DEXA scanners

**Regulatory Requirements:**
- CDSCO import/manufacturing license
- Radiation safety compliance (AERB approval)
- Complete technical file
- Performance data
- Specialized installation requirements

**Reference:** Medical Devices Rules, 2017 - First Schedule, Part III`
  },
  'CDSCO Rule 9c': {
    title: 'Rule 9c - Critical Vital Signs Monitoring',
    content: `**Class C - Moderate-High Risk**

Active devices intended to monitor vital physiological parameters where variations could result in immediate danger.

**Examples:**
- ICU patient monitors
- Anesthesia monitors
- Fetal monitors
- Cardiac monitors (critical care)

**Regulatory Requirements:**
- CDSCO import/manufacturing license
- Clinical performance data
- Alarm system validation
- Software validation (IEC 62304)
- ISO 13485 certification

**Reference:** Medical Devices Rules, 2017 - First Schedule, Part III`
  },
  'CDSCO Rule 10': {
    title: 'Rule 10 - Device Control Systems',
    content: `**Class B - Low-Moderate Risk**

Active devices intended to control, monitor or directly influence the performance of another device.

**Examples:**
- Infusion pump controllers
- Ventilator control systems
- Diagnostic equipment interfaces
- Device monitoring software

**Regulatory Requirements:**
- CDSCO registration
- Software validation
- Interoperability testing
- ISO 13485 certification
- Cybersecurity assessment

**Reference:** Medical Devices Rules, 2017 - First Schedule, Part II`
  },
  'CDSCO Rule 11': {
    title: 'Rule 11 - Substance Administration Devices',
    content: `**Class C - Moderate-High Risk**

Active devices intended for administering or removing medicines, body liquids or other substances.

**Examples:**
- Powered infusion pumps
- Dialysis machines
- Autotransfusion systems
- Drug delivery systems

**Regulatory Requirements:**
- CDSCO import/manufacturing license
- Complete technical file
- Clinical performance data
- Accuracy and precision validation
- ISO 13485 certification

**Reference:** Medical Devices Rules, 2017 - First Schedule, Part III`
  },
  'CDSCO IVD Rule 1': {
    title: 'IVD Rule 1 - General Laboratory Devices',
    content: `**Class A - Low Risk**

In-vitro diagnostic devices for general laboratory use where incorrect results do not pose direct risk.

**Examples:**
- General clinical chemistry analyzers
- Urinalysis test strips
- General sample containers
- Laboratory centrifuges

**Regulatory Requirements:**
- CDSCO registration
- ISO 13485 certification
- Performance validation
- Quality control documentation

**Reference:** Medical Devices Rules, 2017 - IVD Classification`
  },
  'CDSCO IVD Rule 2': {
    title: 'IVD Rule 2 - Self-Testing IVD Devices',
    content: `**Class B - Low-Moderate Risk**

In-vitro diagnostic devices intended for self-testing by patients.

**Examples:**
- Pregnancy test kits
- Blood glucose monitors
- Ovulation test kits
- Cholesterol self-test kits

**Regulatory Requirements:**
- CDSCO registration
- ISO 13485 certification
- Usability testing for lay users
- Clear instructions for use
- Performance validation

**Reference:** Medical Devices Rules, 2017 - IVD Classification`
  },
  'CDSCO IVD Rule 3': {
    title: 'IVD Rule 3 - Critical IVD Devices',
    content: `**Class C - Moderate-High Risk**

In-vitro diagnostic devices for blood grouping, tissue typing, or detection of cancer markers.

**Examples:**
- Blood grouping reagents
- HLA typing kits
- Tumor markers (PSA, CEA, AFP)
- Tissue typing devices

**Regulatory Requirements:**
- CDSCO import/manufacturing license
- Clinical performance studies
- Complete technical file
- Sensitivity and specificity data
- ISO 13485 certification

**Reference:** Medical Devices Rules, 2017 - IVD Classification`
  },
  'CDSCO IVD Rule 4': {
    title: 'IVD Rule 4 - Blood Screening IVD',
    content: `**Class D - High Risk**

In-vitro diagnostic devices for screening blood or blood components for transfusion safety.

**Examples:**
- HIV screening kits
- Hepatitis B/C screening
- Blood bank screening systems
- Transfusion-transmissible infection tests

**Regulatory Requirements:**
- CDSCO import/manufacturing license
- Clinical trial data required
- Sensitivity/specificity validation
- Lot release testing
- Post-market surveillance
- ISO 13485 certification

**Reference:** Medical Devices Rules, 2017 - IVD Classification`
  }
};
