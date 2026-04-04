export interface HCPCSCodeSubcategory {
  range: string;
  name: string;
  description: string;
  examples: string[];
}

export interface HCPCSCodeType {
  code: string;
  range: string;
  name: string;
  description: string;
  deviceRelevance: 'high' | 'medium' | 'low';
  examples: string[];
  keyPoints: string[];
  subcategories?: HCPCSCodeSubcategory[];
}

export const HCPCS_CODE_TYPES: HCPCSCodeType[] = [
  {
    code: "A",
    range: "A0000-A9999",
    name: "Transportation & Medical Supplies",
    description: "Transportation services, medical and surgical supplies, administrative and billing items",
    deviceRelevance: "low",
    examples: [
      "A4206 - Syringe with needle",
      "A4253 - Blood glucose monitor supplies",
      "A6021 - Collagen dressing, pad size > 48 sq. in."
    ],
    keyPoints: [
      "Primarily non-durable supplies",
      "Some diagnostic test supplies included",
      "Wound care and dressing supplies",
      "Limited device coverage"
    ],
    subcategories: [
      {
        range: "A0000-A0999",
        name: "Transportation Services",
        description: "Ambulance and non-emergency medical transportation",
        examples: [
          "A0425 - Ground mileage, per statute mile",
          "A0428 - Ambulance service, basic life support, non-emergency",
          "A0998 - Ambulance response and treatment, no transport"
        ]
      },
      {
        range: "A4000-A4999",
        name: "Medical & Surgical Supplies",
        description: "General medical supplies, syringes, catheters, ostomy supplies",
        examples: [
          "A4206 - Syringe with needle, sterile 1 cc or less",
          "A4253 - Blood glucose test strips",
          "A4310 - Insertion tray without drainage bag",
          "A4335 - Incontinence supply, miscellaneous"
        ]
      },
      {
        range: "A5000-A5999",
        name: "Surgical Dressings",
        description: "Sterile dressings and bandages",
        examples: [
          "A5500 - Therapeutic shoes for diabetics",
          "A5512 - Multi-density inserts for diabetic footwear"
        ]
      },
      {
        range: "A6000-A6999",
        name: "Wound Care Supplies",
        description: "Dressings, hydrogels, foam dressings, compression bandages",
        examples: [
          "A6021 - Collagen dressing, pad size > 48 sq. in.",
          "A6154 - Wound pouch, each",
          "A6196 - Alginate or other fiber gelling dressing",
          "A6402 - Gauze, non-impregnated, sterile, pad size > 48 sq. in."
        ]
      },
      {
        range: "A7000-A7999",
        name: "Respiratory & Oxygen Supplies",
        description: "Nebulizers, oxygen tubing, filters, humidifiers",
        examples: [
          "A7000 - Canister, disposable, used with suction pump",
          "A7025 - High frequency chest wall oscillation system vest",
          "A7027 - Combination oral/nasal mask, used with CPAP",
          "A7046 - Water, distilled, used with respiratory equipment"
        ]
      },
      {
        range: "A9000-A9999",
        name: "Diagnostic & Therapeutic Supplies",
        description: "Contrast agents, radiopharmaceuticals, exercise equipment",
        examples: [
          "A9150 - Non-prescription drugs",
          "A9270 - Non-covered item or service",
          "A9900 - Miscellaneous DME supply"
        ]
      }
    ]
  },
  {
    code: "B",
    range: "B4000-B9999",
    name: "Enteral & Parenteral Therapy",
    description: "Nutrition delivery supplies and equipment",
    deviceRelevance: "medium",
    examples: [
      "B4034 - Enteral feeding supply kit",
      "B4081 - Nasogastric tubing with stylet",
      "B9004 - Parenteral nutrition solution, per 10 grams lipids"
    ],
    keyPoints: [
      "Nutrition support equipment",
      "Infusion pumps and supplies",
      "Home therapy devices",
      "Enteral and parenteral formulas"
    ],
    subcategories: [
      {
        range: "B4000-B4999",
        name: "Enteral Nutrition",
        description: "Enteral feeding tubes, formulas, and administration supplies",
        examples: [
          "B4034 - Enteral feeding supply kit (pump fed)",
          "B4035 - Enteral feeding supply kit (gravity fed)",
          "B4081 - Nasogastric tubing with stylet",
          "B4150 - Enteral formula, nutritionally complete with intact nutrients"
        ]
      },
      {
        range: "B5000-B5999",
        name: "Parenteral Nutrition Solutions",
        description: "Parenteral nutrition formulas and additives",
        examples: [
          "B5000 - Parenteral solution, amino acid, 3.5%, 500 ml",
          "B5100 - Parenteral solution, dextrose, 5%, 500 ml",
          "B5200 - Parenteral solution, lipid emulsion, 10%, 500 ml"
        ]
      },
      {
        range: "B9000-B9999",
        name: "Parenteral Therapy Supplies",
        description: "IV administration supplies, pumps, tubing",
        examples: [
          "B9002 - Enteral nutrition infusion pump, any type",
          "B9004 - Parenteral nutrition solution, per 10 grams lipids",
          "B9006 - Parenteral nutrition supply kit"
        ]
      }
    ]
  },
  {
    code: "C",
    range: "C1000-C9999",
    name: "Hospital Outpatient Temporary Codes",
    description: "Temporary codes for new technology, drugs, and devices not yet assigned permanent codes",
    deviceRelevance: "high",
    examples: [
      "C1713 - Anchor/screw for opposing bone-to-bone",
      "C1760 - Closure device, vascular",
      "C1882 - Cardioverter-defibrillator, other than single/dual chamber",
      "C2623 - Catheter, transluminal angioplasty, drug-coated"
    ],
    keyPoints: [
      "Critical for NEW medical devices",
      "Temporary codes (typically 2-3 years)",
      "Used until permanent CPT/HCPCS code assigned",
      "Hospital outpatient setting only",
      "Often required for innovative devices"
    ],
    subcategories: [
      {
        range: "C1000-C1999",
        name: "Cardiovascular & Surgical Devices",
        description: "Stents, catheters, pacemakers, defibrillators, surgical devices",
        examples: [
          "C1713 - Anchor/screw for opposing bone-to-bone",
          "C1721 - Catheter, cardiovascular, diagnostic, imaging",
          "C1760 - Closure device, vascular (implantable/insertable)",
          "C1882 - Cardioverter-defibrillator, other than single/dual chamber"
        ]
      },
      {
        range: "C2000-C2699",
        name: "Surgical Supplies & Implants",
        description: "Orthopedic implants, neurostimulators, tissue matrices",
        examples: [
          "C2623 - Catheter, transluminal angioplasty, drug-coated",
          "C2624 - Implantable wireless pulmonary artery pressure sensor",
          "C2631 - Repair device, urinary, incontinence, with sling graft"
        ]
      },
      {
        range: "C5000-C5299",
        name: "Brachytherapy Sources",
        description: "Radioactive sources for cancer treatment",
        examples: [
          "C5271 - Application of low cost skin substitute graft",
          "C5278 - Application of cellular/tissue-based product"
        ]
      },
      {
        range: "C8900-C9899",
        name: "MRI Contrast & Procedures",
        description: "Imaging contrast agents and outpatient procedures",
        examples: [
          "C9399 - Unclassified drugs or biologicals",
          "C9600 - Percutaneous transcatheter placement of drug-eluting stent"
        ]
      }
    ]
  },
  {
    code: "E",
    range: "E0100-E9999",
    name: "Durable Medical Equipment (DME)",
    description: "Reusable medical equipment for home use - wheelchairs, hospital beds, oxygen, etc.",
    deviceRelevance: "high",
    examples: [
      "E0250 - Hospital bed, fixed height",
      "E0601 - Continuous airway pressure (CPAP) device",
      "E0781 - Ambulatory infusion pump",
      "E1390 - Oxygen concentrator, single delivery port"
    ],
    keyPoints: [
      "CRITICAL for durable home-use devices",
      "Must withstand repeated use",
      "Primarily used in home setting",
      "Medicare DME benefit applies",
      "Requires prescription"
    ],
    subcategories: [
      {
        range: "E0100-E0199",
        name: "Canes, Crutches & Walkers",
        description: "Mobility aids for ambulation assistance",
        examples: [
          "E0100 - Cane, includes canes of all materials",
          "E0110 - Crutches, forearm, includes crutches of various materials",
          "E0130 - Walker, rigid, adjustable or fixed height",
          "E0147 - Walker, heavy duty, multiple braking system"
        ]
      },
      {
        range: "E0200-E0399",
        name: "Hospital Beds & Accessories",
        description: "Hospital beds, mattresses, side rails, trapeze bars",
        examples: [
          "E0250 - Hospital bed, fixed height, with any type side rails",
          "E0260 - Hospital bed, semi-electric",
          "E0277 - Powered pressure-reducing air mattress",
          "E0316 - Safety enclosure frame/canopy for hospital bed"
        ]
      },
      {
        range: "E0400-E0499",
        name: "Oxygen & Respiratory Equipment",
        description: "Oxygen cylinders, concentrators, liquid oxygen systems",
        examples: [
          "E0424 - Stationary compressed gaseous oxygen system",
          "E0431 - Portable gaseous oxygen system",
          "E0445 - Oximeter device for measuring blood oxygen levels",
          "E0466 - Home ventilator, any type"
        ]
      },
      {
        range: "E0500-E0699",
        name: "CPAP & Respiratory Devices",
        description: "CPAP machines, BiPAP, nebulizers, humidifiers",
        examples: [
          "E0550 - Humidifier, durable for extensive supplemental humidification",
          "E0570 - Nebulizer, with compressor",
          "E0601 - Continuous positive airway pressure (CPAP) device",
          "E0618 - Apnea monitor, without recording feature"
        ]
      },
      {
        range: "E0700-E0799",
        name: "Safety & Monitoring Equipment",
        description: "Patient lifts, safety devices, monitoring equipment",
        examples: [
          "E0700 - Safety equipment, device or accessory",
          "E0730 - Ambulatory traction device, all types",
          "E0762 - Transcutaneous electrical nerve stimulation device"
        ]
      },
      {
        range: "E0900-E1298",
        name: "Wheelchairs - Manual & Components",
        description: "Manual wheelchairs, accessories, seating systems",
        examples: [
          "E0950 - Wheelchair accessory, tray, each",
          "E1028 - Wheelchair manual, pediatric size",
          "E1050 - Fully reclining wheelchair, fixed full-length arms",
          "E1161 - Manual adult size wheelchair, includes tipping feature"
        ]
      },
      {
        range: "E1300-E1699",
        name: "Wheelchairs - Power & Scooters",
        description: "Power wheelchairs, motorized scooters, power accessories",
        examples: [
          "E1399 - Durable medical equipment, miscellaneous",
          "E2291 - Back, planar, for pediatric size wheelchair",
          "E2373 - Power wheelchair accessory, hand control interface"
        ]
      },
      {
        range: "E1800-E2399",
        name: "General Medical Equipment",
        description: "Infusion pumps, phototherapy, traction devices",
        examples: [
          "E0781 - Ambulatory infusion pump",
          "E1390 - Oxygen concentrator, single delivery port",
          "E1902 - Communication board, non-electronic"
        ]
      }
    ]
  },
  {
    code: "G",
    range: "G0000-G9999",
    name: "Procedures & Professional Services",
    description: "Temporary Medicare codes for procedures and services",
    deviceRelevance: "medium",
    examples: [
      "G0283 - Electrical stimulation, unattended",
      "G0329 - Electromagnetic therapy",
      "G2021 - Health and well-being coaching"
    ],
    keyPoints: [
      "Medicare-specific temporary codes",
      "Services and procedures",
      "Some device-related procedures",
      "May transition to CPT codes"
    ],
    subcategories: [
      {
        range: "G0000-G0299",
        name: "Professional Services",
        description: "Screenings, telehealth, care coordination services",
        examples: [
          "G0008 - Administration of influenza virus vaccine",
          "G0108 - Diabetes outpatient self-management training services",
          "G0270 - Medical nutrition therapy; reassessment"
        ]
      },
      {
        range: "G0300-G0499",
        name: "Diagnostic & Therapeutic Procedures",
        description: "Device-related therapy procedures and monitoring",
        examples: [
          "G0283 - Electrical stimulation (unattended), to one or more areas",
          "G0329 - Electromagnetic therapy, to one or more areas",
          "G0337 - Hospice evaluation and counseling services"
        ]
      },
      {
        range: "G2000-G2999",
        name: "Quality Measures & Services",
        description: "Quality reporting, care coordination, chronic care services",
        examples: [
          "G2010 - Remote evaluation of patient video/images",
          "G2012 - Brief communication technology-based service",
          "G2021 - Health and well-being coaching face-to-face"
        ]
      },
      {
        range: "G9000-G9999",
        name: "Demonstration & Monitoring Services",
        description: "Quality reporting codes, monitoring programs",
        examples: [
          "G9001 - Coordinated care fee, initial rate",
          "G9473 - Services performed by chaplain in the hospice setting"
        ]
      }
    ]
  },
  {
    code: "K",
    range: "K0000-K9999",
    name: "DME Temporary Codes",
    description: "Temporary codes for DME regional carriers (now permanent for some items)",
    deviceRelevance: "high",
    examples: [
      "K0001 - Standard wheelchair",
      "K0005 - Ultralightweight wheelchair",
      "K0738 - Portable gaseous oxygen system",
      "K0800 - Power operated vehicle, group 1"
    ],
    keyPoints: [
      "Originally temporary DME codes",
      "Many now permanent",
      "Focus on mobility and oxygen equipment",
      "Complements E-codes"
    ],
    subcategories: [
      {
        range: "K0000-K0108",
        name: "Wheelchairs & Components",
        description: "Manual and power wheelchair bases, accessories",
        examples: [
          "K0001 - Standard wheelchair",
          "K0002 - Standard hemi-wheelchair",
          "K0003 - Lightweight wheelchair",
          "K0004 - High strength, lightweight wheelchair",
          "K0005 - Ultralightweight wheelchair",
          "K0009 - Other manual wheelchair base"
        ]
      },
      {
        range: "K0455-K0605",
        name: "Infusion Supplies & Pumps",
        description: "Infusion pump supplies, cartridges, accessories",
        examples: [
          "K0455 - Infusion pump used for uninterrupted parenteral administration",
          "K0552 - Supplies for external drug infusion pump",
          "K0601 - Replacement battery for external infusion pump"
        ]
      },
      {
        range: "K0606-K0746",
        name: "Oxygen & Respiratory Equipment",
        description: "Oxygen equipment, portable systems, respiratory supplies",
        examples: [
          "K0606 - Automatic external defibrillator, with integrated ECG",
          "K0738 - Portable gaseous oxygen system, rental",
          "K0740 - Repair or nonroutine service for oxygen equipment"
        ]
      },
      {
        range: "K0800-K0899",
        name: "Power Mobility Devices",
        description: "Power operated vehicles (scooters) by group classification",
        examples: [
          "K0800 - Power operated vehicle, group 1 standard",
          "K0801 - Power operated vehicle, group 1 heavy duty",
          "K0802 - Power operated vehicle, group 2 standard",
          "K0806 - Power operated vehicle, group 2 heavy duty",
          "K0812 - Power operated vehicle, not otherwise classified"
        ]
      },
      {
        range: "K0900-K0902",
        name: "Customized DME",
        description: "Customized durable medical equipment, other than wheelchair",
        examples: [
          "K0900 - Customized durable medical equipment, other than wheelchair"
        ]
      }
    ]
  },
  {
    code: "L",
    range: "L0000-L9999",
    name: "Orthotics & Prosthetics",
    description: "Orthotic and prosthetic devices and supplies",
    deviceRelevance: "high",
    examples: [
      "L0120 - Cervical collar",
      "L1902 - Ankle-foot orthosis (AFO), single upright",
      "L1832 - Knee orthosis, adjustable knee joints",
      "L4360 - Walking boot, pneumatic",
      "L5000 - Partial foot prosthesis"
    ],
    keyPoints: [
      "HIGH relevance for orthopedic devices",
      "Includes limb prostheses",
      "Spinal and extremity orthoses",
      "Ankle braces, AFOs, knee braces, splints",
      "Custom and off-the-shelf options"
    ],
    subcategories: [
      {
        range: "L0100-L0999",
        name: "Cervical & Thoracic Spine Orthotics",
        description: "Cervical collars, neck supports, thoracic braces",
        examples: [
          "L0120 - Cervical, flexible, thermoplastic foam",
          "L0172 - Cervical collar with thoracic extension",
          "L0450 - TLSO, flexible, provides trunk support"
        ]
      },
      {
        range: "L1000-L1499",
        name: "Thoracic-Lumbar-Sacral Orthotics (TLSO)",
        description: "Back braces, corsets, spinal support systems",
        examples: [
          "L1000 - Cervical-thoracic-lumbar-sacral orthosis (CTLSO)",
          "L1200 - TLSO, sagittal-coronal control",
          "L1499 - Spinal orthosis, custom fabricated"
        ]
      },
      {
        range: "L1600-L1699",
        name: "Hip Orthotics (HO)",
        description: "Hip positioning, abduction devices",
        examples: [
          "L1600 - Hip orthosis, abduction control",
          "L1685 - Hip orthosis, bilateral pelvic band"
        ]
      },
      {
        range: "L1700-L1755",
        name: "Knee-Ankle-Foot Orthotics (KAFO)",
        description: "Long leg braces with knee and ankle control",
        examples: [
          "L1700 - KAFO, single upright, free knee, free ankle",
          "L1730 - KAFO, single upright, with or without free motion knee"
        ]
      },
      {
        range: "L1810-L1860",
        name: "Knee Orthotics (KO)",
        description: "Knee braces, immobilizers, and support devices",
        examples: [
          "L1810 - Knee orthosis, elastic with joints",
          "L1832 - Knee orthosis, adjustable knee joints, prefabricated",
          "L1843 - Knee orthosis, single upright, thigh and calf"
        ]
      },
      {
        range: "L1900-L1990",
        name: "Ankle-Foot Orthotics (AFO)",
        description: "AFOs, ankle braces, foot drop solutions",
        examples: [
          "L1900 - AFO, spring wire, dorsiflexion assist",
          "L1902 - AFO, ankle gauntlet or similar, custom fabricated",
          "L1906 - AFO, multiligamentus ankle support, prefabricated",
          "L1930 - AFO, plastic or other material, prefabricated",
          "L1932 - AFO, rigid anterior tibial section, custom fabricated",
          "L1951 - AFO, spiral design and other features"
        ]
      },
      {
        range: "L2000-L2999",
        name: "Ankle, Foot & Toe Orthotics",
        description: "Ankle supports, foot orthotics, toe devices",
        examples: [
          "L2106 - Ankle-foot orthosis, fracture orthosis",
          "L2180 - Addition to lower extremity fracture orthosis, drop lock knee joint",
          "L2330 - Addition to lower extremity, toe straightener"
        ]
      },
      {
        range: "L3000-L3649",
        name: "Foot Orthotics & Shoe Modifications",
        description: "Custom foot orthotics, arch supports, shoe inserts",
        examples: [
          "L3000 - Foot insert, removable, molded to patient model",
          "L3020 - Foot insert, longitudinal arch support",
          "L3201 - Orthopedic shoe, Oxford with supinator/pronator"
        ]
      },
      {
        range: "L3650-L3678",
        name: "Shoulder-Elbow-Wrist-Hand Orthotics",
        description: "Upper extremity orthoses and splints",
        examples: [
          "L3650 - Shoulder orthosis, figure-of-eight design",
          "L3660 - Shoulder-elbow-wrist-hand orthosis (SEWHO)",
          "L3670 - Shoulder-elbow-wrist-hand orthosis, abduction positioning"
        ]
      },
      {
        range: "L3900-L3999",
        name: "Wrist-Hand-Finger Orthotics (WHFO)",
        description: "Wrist supports, hand splints, finger orthoses",
        examples: [
          "L3900 - WHFO, external powered, electric",
          "L3904 - WHFO, without joint(s), prefabricated",
          "L3916 - WHFO, includes one or more nontorsion joint(s)"
        ]
      },
      {
        range: "L4000-L4210",
        name: "Orthotic Additions & Replacements",
        description: "Replacement parts, repairs, additions to orthoses",
        examples: [
          "L4000 - Replace girdle for spinal orthosis",
          "L4010 - Replace trilateral socket brim",
          "L4205 - Repair of orthotic device, labor component"
        ]
      },
      {
        range: "L4350-L4397",
        name: "Pneumatic & Fracture Devices",
        description: "Walking boots, CAM boots, fracture braces",
        examples: [
          "L4350 - Ankle control orthosis, stirrup style",
          "L4360 - Walking boot, pneumatic and/or vacuum, prefabricated",
          "L4386 - Walking boot, non-pneumatic, prefabricated",
          "L4392 - Replacement, soft interface material, static AFO"
        ]
      },
      {
        range: "L5000-L5999",
        name: "Lower Extremity Prosthetics",
        description: "Leg, foot, and toe prostheses",
        examples: [
          "L5000 - Partial foot, shoe insert with longitudinal arch",
          "L5050 - Ankle, Symes, molded socket, SACH foot",
          "L5100 - Below knee prosthesis, PTB type socket",
          "L5312 - Knee disarticulation prosthesis",
          "L5700 - Replacement socket, below knee, molded to patient"
        ]
      },
      {
        range: "L6000-L6915",
        name: "Upper Extremity Prosthetics",
        description: "Arm, hand, and finger prostheses",
        examples: [
          "L6000 - Partial hand, thumb remaining",
          "L6100 - Below elbow prosthesis, molded socket",
          "L6200 - Above elbow prosthesis, internal locking elbow",
          "L6707 - Terminal device, hook or hand"
        ]
      },
      {
        range: "L7000-L7499",
        name: "Prosthetic Additions & Repairs",
        description: "Prosthetic components, electronic controls, repairs",
        examples: [
          "L7007 - Electric hand, switch or myoelectric controlled",
          "L7170 - Electronic elbow, switch or myoelectric controlled",
          "L7400 - Addition to upper extremity prosthesis, endoskeletal"
        ]
      },
      {
        range: "L8000-L8699",
        name: "Implants & Special Prosthetics",
        description: "Breast prostheses, penile implants, ocular devices",
        examples: [
          "L8020 - Breast prosthesis, mastectomy form",
          "L8614 - Cochlear implant, external speech processor",
          "L8690 - Auditory osseointegrated device"
        ]
      }
    ]
  },
  {
    code: "Q",
    range: "Q0000-Q9999",
    name: "Miscellaneous Services",
    description: "Temporary codes for miscellaneous services and supplies",
    deviceRelevance: "low",
    examples: [
      "Q0163 - Diphenhydramine injection",
      "Q4081 - Injection, epoetin alfa",
      "Q4132 - Grafix Core and GrafixPL Core, per sq cm"
    ],
    keyPoints: [
      "Primarily drugs and biologics",
      "Some diagnostic supplies",
      "Skin substitutes and wound care products",
      "Limited device coverage"
    ],
    subcategories: [
      {
        range: "Q0000-Q0999",
        name: "Drugs & Biologicals",
        description: "Injectable drugs, contrast agents, diagnostic supplies",
        examples: [
          "Q0138 - Injection, ferumoxytol, for treatment of iron deficiency anemia",
          "Q0163 - Diphenhydramine hydrochloride, 50 mg, oral, FDA approved",
          "Q0180 - Dolasetron mesylate, oral, 100 mg"
        ]
      },
      {
        range: "Q2000-Q2999",
        name: "Clinical Services & Procedures",
        description: "Screening tests, clinical services, demonstrations",
        examples: [
          "Q2004 - Irrigation solution for treatment of bladder calculi",
          "Q2043 - Sipuleucel-T, minimum of 50 million autologous CD54+ cells",
          "Q2052 - Services, supplies and accessories used in the home"
        ]
      },
      {
        range: "Q4000-Q4999",
        name: "Skin Substitutes & Wound Care",
        description: "Skin substitutes, wound matrices, tissue products",
        examples: [
          "Q4100 - Skin substitute, not otherwise specified",
          "Q4132 - Grafix Core and GrafixPL Core, per square cm",
          "Q4165 - Kerecis omega3, per square cm"
        ]
      },
      {
        range: "Q5000-Q5999",
        name: "Biosimilar Drugs",
        description: "Biosimilar biological products",
        examples: [
          "Q5101 - Injection, filgrastim-sndz, biosimilar",
          "Q5103 - Injection, infliximab-dyyb, biosimilar",
          "Q5109 - Injection, infliximab-abda, biosimilar"
        ]
      },
      {
        range: "Q9000-Q9999",
        name: "Imaging & Contrast Supplies",
        description: "Contrast agents, radiopharmaceuticals, imaging supplies",
        examples: [
          "Q9950 - Injection, sulfur hexafluoride lipid microspheres",
          "Q9967 - Low osmolar contrast material, 400 or greater mg/ml iodine",
          "Q9983 - Flutemetamol F18, diagnostic, per study dose"
        ]
      }
    ]
  }
];

export const HCPCS_DEVICE_PRIORITIES = [
  {
    priority: 1,
    codes: ["E", "K", "L"],
    title: "Highest Priority for Medical Devices",
    description: "DME, orthotics, and prosthetics - most relevant for device manufacturers"
  },
  {
    priority: 2,
    codes: ["C"],
    title: "Critical for New Technology",
    description: "Temporary codes for innovative devices awaiting permanent codes"
  },
  {
    priority: 3,
    codes: ["B", "G"],
    title: "Moderate Relevance",
    description: "Nutrition/infusion equipment and some device-related procedures"
  },
  {
    priority: 4,
    codes: ["A", "Q"],
    title: "Lower Relevance",
    description: "General supplies and miscellaneous services"
  }
];
