export interface CPTCategory {
  code: string;
  range: string;
  name: string;
  description: string;
  deviceApplicability: string;
  subcategories?: CPTSubcategory[];
}

export interface CPTSubcategory {
  range: string;
  name: string;
  description: string;
  examples?: string[];
}

export const CPT_CATEGORIES: CPTCategory[] = [
  {
    code: "E&M",
    range: "99201-99499",
    name: "Evaluation & Management",
    description: "Office visits, consultations, hospital care, and other patient evaluation services",
    deviceApplicability: "Limited - primarily for diagnostic devices used during consultations",
    subcategories: [
      {
        range: "99201-99215",
        name: "Office or Other Outpatient Services",
        description: "New and established patient visits",
        examples: ["Point-of-care diagnostic devices", "Vital signs monitors"]
      },
      {
        range: "99221-99239",
        name: "Hospital Inpatient Services",
        description: "Initial and subsequent hospital care",
        examples: ["Bedside monitoring devices", "Diagnostic equipment"]
      }
    ]
  },
  {
    code: "ANESTHESIA",
    range: "00100-01999",
    name: "Anesthesia",
    description: "Anesthesia services for surgical and diagnostic procedures",
    deviceApplicability: "Moderate - anesthesia delivery systems, monitoring devices",
    subcategories: [
      {
        range: "00100-00222",
        name: "Head",
        description: "Anesthesia for procedures on head, neck, and neuraxial structures"
      },
      {
        range: "00300-00474",
        name: "Thorax",
        description: "Anesthesia for procedures on thoracic region"
      }
    ]
  },
  {
    code: "SURGERY",
    range: "10000-69999",
    name: "Surgery",
    description: "Surgical procedures organized by body system",
    deviceApplicability: "High - surgical instruments, implants, and therapeutic devices",
    subcategories: [
      {
        range: "10000-19999",
        name: "Integumentary System",
        description: "Skin, subcutaneous tissue, breast procedures",
        examples: ["Dermatological lasers", "Wound closure devices", "Skin graft instruments"]
      },
      {
        range: "20000-29999",
        name: "Musculoskeletal System",
        description: "Bone, joint, muscle, tendon procedures",
        examples: ["Orthopedic implants", "Fracture fixation devices", "Joint replacement systems"]
      },
      {
        range: "30000-32999",
        name: "Respiratory System",
        description: "Nose, larynx, trachea, bronchi, lung procedures",
        examples: ["Bronchoscopes", "Ventilators", "Airway management devices"]
      },
      {
        range: "33000-37799",
        name: "Cardiovascular System",
        description: "Heart, pericardium, vessels, pacemakers",
        examples: ["Cardiac stents", "Pacemakers", "Heart valves", "Vascular grafts"]
      },
      {
        range: "38000-38999",
        name: "Hemic/Lymphatic Systems",
        description: "Spleen, bone marrow, lymph nodes",
        examples: ["Bone marrow aspiration needles", "Lymph node biopsy devices"]
      },
      {
        range: "40000-49999",
        name: "Digestive System",
        description: "GI tract, liver, pancreas procedures",
        examples: ["Endoscopes", "GI stents", "Hernia repair meshes"]
      },
      {
        range: "50000-53899",
        name: "Urinary System",
        description: "Kidney, ureter, bladder, urethra procedures",
        examples: ["Urological catheters", "Kidney stone devices", "Urodynamic systems"]
      },
      {
        range: "54000-55899",
        name: "Male Genital System",
        description: "Penis, testis, prostate procedures",
        examples: ["Prostate biopsy devices", "Urological implants"]
      },
      {
        range: "56000-58999",
        name: "Female Genital System",
        description: "Vulva, vagina, cervix, uterus, ovaries",
        examples: ["IUDs", "Hysteroscopes", "Ablation devices"]
      },
      {
        range: "60000-60699",
        name: "Endocrine System",
        description: "Thyroid, parathyroid, thymus, adrenal procedures",
        examples: ["Surgical instruments for endocrine procedures"]
      },
      {
        range: "61000-64999",
        name: "Nervous System",
        description: "Brain, spinal cord, peripheral nerves",
        examples: ["Neurostimulators", "Cranial implants", "Spinal fixation devices"]
      },
      {
        range: "65000-68899",
        name: "Eye and Ocular Adnexa",
        description: "Eye, eyelid, conjunctiva procedures",
        examples: ["Intraocular lenses", "Glaucoma devices", "Ophthalmic lasers"]
      },
      {
        range: "69000-69979",
        name: "Auditory System",
        description: "External, middle, and inner ear procedures",
        examples: ["Cochlear implants", "Hearing aids", "Ear tubes"]
      }
    ]
  },
  {
    code: "RADIOLOGY",
    range: "70000-79999",
    name: "Radiology",
    description: "Diagnostic and therapeutic radiology services",
    deviceApplicability: "Very High - imaging equipment and radiation therapy devices",
    subcategories: [
      {
        range: "70000-76499",
        name: "Diagnostic Radiology",
        description: "X-ray, CT, MRI, ultrasound procedures",
        examples: ["MRI systems", "CT scanners", "Ultrasound machines", "X-ray equipment"]
      },
      {
        range: "76500-76999",
        name: "Diagnostic Ultrasound",
        description: "Ultrasound imaging procedures",
        examples: ["Ultrasound probes", "Echocardiography systems"]
      },
      {
        range: "77000-77799",
        name: "Radiation Oncology",
        description: "Radiation treatment planning and delivery",
        examples: ["Linear accelerators", "Brachytherapy devices", "Treatment planning systems"]
      },
      {
        range: "78000-79999",
        name: "Nuclear Medicine",
        description: "Diagnostic and therapeutic nuclear medicine",
        examples: ["PET scanners", "SPECT cameras", "Radioactive isotope delivery"]
      }
    ]
  },
  {
    code: "PATHOLOGY",
    range: "80000-89999",
    name: "Pathology & Laboratory",
    description: "Laboratory tests, pathology services, and in vitro diagnostics",
    deviceApplicability: "Very High - diagnostic tests, analyzers, and lab equipment",
    subcategories: [
      {
        range: "80047-80076",
        name: "Organ/Disease Panels",
        description: "Multi-test panels for specific conditions",
        examples: ["Point-of-care testing devices", "Multi-analyte analyzers"]
      },
      {
        range: "80150-84999",
        name: "Chemistry",
        description: "Clinical chemistry tests",
        examples: ["Blood gas analyzers", "Chemistry analyzers", "Glucose monitors"]
      },
      {
        range: "85000-85999",
        name: "Hematology & Coagulation",
        description: "Blood cell counts, coagulation studies",
        examples: ["Hematology analyzers", "Coagulation monitors"]
      },
      {
        range: "86000-86849",
        name: "Immunology",
        description: "Antibody, antigen, and immune function tests",
        examples: ["Immunoassay analyzers", "Rapid test kits"]
      },
      {
        range: "87000-87999",
        name: "Microbiology",
        description: "Culture, sensitivity, and infectious disease testing",
        examples: ["Microbial identification systems", "Molecular diagnostic platforms"]
      },
      {
        range: "88000-88099",
        name: "Anatomic Pathology",
        description: "Surgical pathology, cytopathology",
        examples: ["Digital pathology scanners", "Biopsy devices"]
      }
    ]
  },
  {
    code: "MEDICINE",
    range: "90000-99199",
    name: "Medicine",
    description: "Non-surgical diagnostic and therapeutic services",
    deviceApplicability: "High - therapeutic devices, monitoring systems, and specialty equipment",
    subcategories: [
      {
        range: "90281-90399",
        name: "Vaccines & Immunizations",
        description: "Vaccine administration",
        examples: ["Vaccine delivery devices", "Injection systems"]
      },
      {
        range: "90460-90749",
        name: "Hydration/Infusion",
        description: "IV therapy and infusion services",
        examples: ["Infusion pumps", "IV administration sets"]
      },
      {
        range: "91000-91299",
        name: "Gastroenterology",
        description: "GI function tests and procedures",
        examples: ["Motility monitoring devices", "pH monitoring systems"]
      },
      {
        range: "92000-92499",
        name: "Ophthalmology",
        description: "Eye exams, vision tests",
        examples: ["Ophthalmic diagnostic equipment", "Vision testing devices"]
      },
      {
        range: "92500-92700",
        name: "Otorhinolaryngology",
        description: "Ear, nose, and throat services",
        examples: ["Audiometry equipment", "Vestibular testing devices"]
      },
      {
        range: "93000-93799",
        name: "Cardiovascular",
        description: "ECG, stress tests, cardiac monitoring",
        examples: ["ECG machines", "Holter monitors", "Cardiac event recorders"]
      },
      {
        range: "94000-94799",
        name: "Pulmonary",
        description: "Lung function tests, breathing treatments",
        examples: ["Spirometers", "Peak flow meters", "Nebulizers"]
      },
      {
        range: "95000-95249",
        name: "Neurology & Neuromuscular",
        description: "EEG, EMG, nerve conduction studies",
        examples: ["EEG systems", "EMG equipment", "Sleep study devices"]
      },
      {
        range: "97000-97799",
        name: "Orthopedics & Physical Medicine",
        description: "Physical therapy, rehabilitation, orthotic/prosthetic management",
        examples: ["Physical therapy devices", "Orthotics", "Prosthetics", "Rehabilitation equipment"]
      }
    ]
  },
  {
    code: "ORTHOPEDIC_SURGERY",
    range: "20000-29999",
    name: "Orthopedic Surgery",
    description: "Musculoskeletal procedures including bone, joint, muscle, and tendon surgeries",
    deviceApplicability: "Very High - orthopedic implants, fixation devices, and surgical instruments",
    subcategories: [
      {
        range: "20000-20999",
        name: "General Musculoskeletal",
        description: "Bone biopsies, drainage, debridement procedures",
        examples: ["Biopsy needles", "Drainage systems", "Debridement instruments"]
      },
      {
        range: "21000-21499",
        name: "Head and Neck",
        description: "Fracture and dislocation treatment of skull, facial bones",
        examples: ["Cranial plates", "Facial fixation devices", "TMJ implants"]
      },
      {
        range: "22000-22899",
        name: "Spine and Spinal Cord",
        description: "Vertebral procedures, spinal fusion, disc surgery",
        examples: ["Spinal implants", "Fusion cages", "Pedicle screws", "Artificial discs"]
      },
      {
        range: "23000-24999",
        name: "Shoulder and Elbow",
        description: "Shoulder arthroscopy, rotator cuff repair, elbow procedures",
        examples: ["Shoulder implants", "Rotator cuff repair devices", "Elbow prosthetics"]
      },
      {
        range: "25000-26999",
        name: "Forearm, Wrist, and Hand",
        description: "Fracture fixation, tendon repair, arthroscopy",
        examples: ["Hand/wrist implants", "Carpal tunnel devices", "Finger joint replacements"]
      },
      {
        range: "27000-27299",
        name: "Pelvis and Hip",
        description: "Hip replacement, fracture fixation, arthroscopy",
        examples: ["Hip prostheses", "Femoral stems", "Acetabular cups", "Hip fixation plates"]
      },
      {
        range: "27300-27599",
        name: "Femur and Knee",
        description: "Knee replacement, ligament repair, arthroscopy",
        examples: ["Knee implants", "ACL reconstruction devices", "Meniscal repair systems"]
      },
      {
        range: "27600-27899",
        name: "Leg and Ankle",
        description: "Ankle fractures, tendon repairs, arthroscopy",
        examples: ["Ankle implants", "Tibial fixation plates", "Achilles repair devices"]
      },
      {
        range: "28000-28899",
        name: "Foot and Toes",
        description: "Foot surgery, bunion repair, toe procedures",
        examples: ["Foot implants", "Bunion correction devices", "Toe joint replacements"]
      },
      {
        range: "29000-29999",
        name: "Casting, Splinting & Strapping",
        description: "Application and removal of casts, splints, strapping",
        examples: ["Casting materials", "Splints", "Braces", "Immobilization devices"]
      }
    ]
  }
];
