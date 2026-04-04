import { GapChecklistItem } from "@/types/gapAnalysisTemplate";

export interface MdrAnnexIItem {
  clauseId: string;
  summary: string;
  chapter: string;
  priority: 'high' | 'medium' | 'low';
  checklist: GapChecklistItem[];
}

export const mdrAnnexIChecklist: MdrAnnexIItem[] = [
  {
    clauseId: "1",
    summary: "Devices shall achieve the performance intended by their manufacturer and be designed and manufactured in such a way that, during normal conditions of use, they are suitable for their intended purpose.",
    chapter: "General Safety and Performance Requirements",
    priority: "high",
    checklist: [
      {
        id: "1-doc-1",
        clause: "1",
        section: "Device performance and safety",
        requirement: "Define and document intended purpose and performance",
        description: "Document the device's intended purpose, target population, and performance specifications",
        category: "documentation",
        framework: "MDR",
        chapter: "General Safety and Performance Requirements"
      },
      {
        id: "1-ver-1",
        clause: "1",
        section: "Device performance and safety",
        requirement: "Verify device achieves intended performance",
        description: "Demonstrate through testing that device achieves intended performance under normal conditions",
        category: "verification",
        framework: "MDR",
        chapter: "General Safety and Performance Requirements"
      }
    ]
  },
  {
    clauseId: "2",
    summary: "The solutions adopted by the manufacturer for the design and manufacture of the devices shall conform to safety principles, taking account of the generally acknowledged state of the art.",
    chapter: "General Safety and Performance Requirements",
    priority: "high",
    checklist: [
      {
        id: "2-doc-1",
        clause: "2",
        section: "Safety principles and state of art",
        requirement: "Document conformity to safety principles",
        description: "Document how design solutions conform to safety principles and state of the art",
        category: "documentation",
        framework: "MDR",
        chapter: "General Safety and Performance Requirements"
      }
    ]
  },
  {
    clauseId: "3",
    summary: "The devices shall achieve the performance intended by the manufacturer and shall be safe and effective.",
    chapter: "General Safety and Performance Requirements",
    priority: "high",
    checklist: [
      {
        id: "3-ver-1",
        clause: "3",
        section: "Performance achievement",
        requirement: "Demonstrate safety and effectiveness",
        description: "Provide evidence that device is safe and effective for intended use",
        category: "verification",
        framework: "MDR",
        chapter: "General Safety and Performance Requirements"
      }
    ]
  },
  {
    clauseId: "4",
    summary: "Devices shall be designed and manufactured in such a way as to ensure that the characteristics and performance requirements are not adversely affected to such a degree that the health or safety of the patient or the user and, where applicable, of other persons are compromised.",
    chapter: "General Safety and Performance Requirements",
    priority: "high",
    checklist: [
      {
        id: "4-doc-1",
        clause: "4",
        section: "Design and manufacturing impact",
        requirement: "Ensure design doesn't compromise safety",
        description: "Document that design and manufacturing processes don't adversely affect safety performance",
        category: "documentation",
        framework: "MDR",
        chapter: "General Safety and Performance Requirements"
      }
    ]
  },
  {
    clauseId: "5",
    summary: "Devices shall be designed and manufactured in such a way as to reduce as far as possible the risks posed by substances or particles that may be released from the device.",
    chapter: "General Safety and Performance Requirements",
    priority: "high",
    checklist: [
      {
        id: "5-doc-1",
        clause: "5",
        section: "Substance and particle release",
        requirement: "Control substance and particle release",
        description: "Document measures to reduce risks from substances or particles released from device",
        category: "documentation",
        framework: "MDR",
        chapter: "General Safety and Performance Requirements"
      }
    ]
  },
  {
    clauseId: "6",
    summary: "Devices shall be designed and manufactured in such a way as to minimise the risks posed by substances that the devices are likely to encounter or be exposed to during their intended use.",
    chapter: "General Safety and Performance Requirements", 
    priority: "medium",
    checklist: [
      {
        id: "6-doc-1",
        clause: "6",
        section: "Environmental substance exposure",
        requirement: "Minimize exposure risks",
        description: "Document measures to minimize risks from substances device may encounter during use",
        category: "documentation",
        framework: "MDR",
        chapter: "General Safety and Performance Requirements"
      }
    ]
  },
  {
    clauseId: "7",
    summary: "Devices shall be designed and manufactured in such a way that they can be used safely with the materials and substances, including gases, with which they enter into contact during their intended use.",
    chapter: "General Safety and Performance Requirements",
    priority: "high",
    checklist: [
      {
        id: "7-doc-1",
        clause: "7",
        section: "Material compatibility",
        requirement: "Ensure material and substance compatibility",
        description: "Document compatibility with all materials, substances, and gases contacted during use",
        category: "documentation",
        framework: "MDR",
        chapter: "General Safety and Performance Requirements"
      }
    ]
  },
  {
    clauseId: "8",
    summary: "Devices shall be designed and manufactured in such a way as to eliminate or reduce as far as possible the risk of infection and microbial contamination.",
    chapter: "General Safety and Performance Requirements",
    priority: "high",
    checklist: [
      {
        id: "8-doc-1",
        clause: "8",
        section: "Infection control",
        requirement: "Control infection and contamination risks",
        description: "Document measures to eliminate or reduce infection and microbial contamination risks",
        category: "documentation",
        framework: "MDR",
        chapter: "General Safety and Performance Requirements"
      }
    ]
  },
  {
    clauseId: "9",
    summary: "Devices shall be designed and manufactured in such a way as to protect, as far as possible, against the risk of accidental penetration of substances into the device taking account of the nature of the device and the environment in which it is intended to be used.",
    chapter: "General Safety and Performance Requirements",
    priority: "medium",
    checklist: [
      {
        id: "9-doc-1",
        clause: "9",
        section: "Accidental penetration protection",
        requirement: "Protect against accidental substance penetration",
        description: "Document protection measures against accidental penetration of substances into device",
        category: "documentation",
        framework: "MDR",
        chapter: "General Safety and Performance Requirements"
      }
    ]
  },
  {
    clauseId: "10",
    summary: "Devices shall be designed and manufactured in such a way as to facilitate their safe disposal and the safe disposal of related waste products.",
    chapter: "General Safety and Performance Requirements",
    priority: "medium",
    checklist: [
      {
        id: "10-doc-1",
        clause: "10",
        section: "Safe disposal",
        requirement: "Facilitate safe disposal",
        description: "Document provisions for safe disposal of device and related waste products",
        category: "documentation",
        framework: "MDR",
        chapter: "General Safety and Performance Requirements"
      }
    ]
  },
  {
    clauseId: "11",
    summary: "Devices intended for combination with other devices or equipment shall be designed and manufactured in such a way that the interoperability and compatibility with such devices or equipment are reliable and safe.",
    chapter: "General Safety and Performance Requirements",
    priority: "high",
    checklist: [
      {
        id: "11-doc-1",
        clause: "11",
        section: "Interoperability and compatibility",
        requirement: "Ensure reliable interoperability",
        description: "Document and verify interoperability and compatibility with other devices/equipment",
        category: "verification",
        framework: "MDR",
        chapter: "General Safety and Performance Requirements"
      }
    ]
  },
  {
    clauseId: "12",
    summary: "Devices shall be designed and manufactured in such a way as to eliminate or minimize as far as possible the risk of electromagnetic interference which could impair the functioning of the device or other devices or equipment in the usual environment.",
    chapter: "General Safety and Performance Requirements",
    priority: "high",
    checklist: [
      {
        id: "12-ver-1",
        clause: "12",
        section: "Electromagnetic compatibility",
        requirement: "Control electromagnetic interference",
        description: "Verify electromagnetic compatibility and control interference risks",
        category: "verification",
        framework: "MDR",
        chapter: "General Safety and Performance Requirements"
      }
    ]
  },
  {
    clauseId: "13",
    summary: "Devices shall be designed and manufactured in such a way as to ensure protection against the risks posed by ionising radiation.",
    chapter: "General Safety and Performance Requirements",
    priority: "high",
    checklist: [
      {
        id: "13-doc-1",
        clause: "13",
        section: "Ionising radiation protection",
        requirement: "Protect against ionising radiation",
        description: "Document protection measures against ionising radiation risks",
        category: "documentation",
        framework: "MDR",
        chapter: "General Safety and Performance Requirements"
      }
    ]
  },
  {
    clauseId: "14",
    summary: "For devices intended to emit hazardous or potentially hazardous visible and/or invisible radiation, they shall be designed and manufactured in such a way as to ensure that the characteristics and the quantity of radiation emitted can be controlled, and shall, where possible, be equipped with visual displays and/or audible warnings of such emissions.",
    chapter: "General Safety and Performance Requirements",
    priority: "high",
    checklist: [
      {
        id: "14-doc-1",
        clause: "14",
        section: "Radiation emission control",
        requirement: "Control hazardous radiation emission",
        description: "Document control of radiation characteristics and implement appropriate warnings",
        category: "documentation",
        framework: "MDR",
        chapter: "General Safety and Performance Requirements"
      }
    ]
  },
  {
    clauseId: "15",
    summary: "Devices shall be designed and manufactured in such a way as to reduce as far as possible the risks to persons from the sizes of particles which are or can be released into the environment during the use of the device.",
    chapter: "General Safety and Performance Requirements", 
    priority: "medium",
    checklist: [
      {
        id: "15-doc-1",
        clause: "15",
        section: "Particle emission control",
        requirement: "Control particle release to environment",
        description: "Document measures to reduce risks from particles released to environment during use",
        category: "documentation",
        framework: "MDR",
        chapter: "General Safety and Performance Requirements"
      }
    ]
  },
  {
    clauseId: "16",
    summary: "Devices shall be designed and manufactured in such a way as to reduce as far as possible the risks linked to the entry and/or penetration of substances, ingress of water, or entry of particulate matter into the device.",
    chapter: "General Safety and Performance Requirements",
    priority: "medium",
    checklist: [
      {
        id: "16-doc-1",
        clause: "16",
        section: "Ingress protection",
        requirement: "Protect against substance/water/particle ingress",
        description: "Document protection against entry of substances, water, or particulate matter",
        category: "documentation",
        framework: "MDR",
        chapter: "General Safety and Performance Requirements"
      }
    ]
  },
  {
    clauseId: "17",
    summary: "Devices shall be designed and manufactured in such a way as to ensure that they can be operated safely and accurately by lay persons, where they are intended for use by lay persons.",
    chapter: "General Safety and Performance Requirements",
    priority: "high",
    checklist: [
      {
        id: "17-doc-1",
        clause: "17",
        section: "Lay person use safety",
        requirement: "Ensure safe lay person operation",
        description: "Document and verify safe and accurate operation by intended lay users",
        category: "verification",
        framework: "MDR",
        chapter: "General Safety and Performance Requirements"
      }
    ]
  },
  {
    clauseId: "18",
    summary: "Devices shall be designed and manufactured in such a way that they provide an acceptable level of intrinsic safety in the event of a single fault condition.",
    chapter: "General Safety and Performance Requirements",
    priority: "high",
    checklist: [
      {
        id: "18-doc-1",
        clause: "18",
        section: "Single fault safety",
        requirement: "Ensure single fault condition safety",
        description: "Document acceptable safety level maintained during single fault conditions",
        category: "documentation",
        framework: "MDR",
        chapter: "General Safety and Performance Requirements"
      }
    ]
  },
  {
    clauseId: "19",
    summary: "Devices shall be designed and manufactured in such a way as to facilitate the safe use of the device by maintaining or restoring the sterility of the device and/or its accessories where devices are supplied sterile or are intended to be sterilised, or where devices are intended to be disinfected or cleaned before use.",
    chapter: "General Safety and Performance Requirements",
    priority: "high",
    checklist: [
      {
        id: "19-doc-1",
        clause: "19",
        section: "Sterility maintenance",
        requirement: "Maintain sterility and enable safe cleaning",
        description: "Document sterility maintenance and safe disinfection/cleaning procedures",
        category: "documentation",
        framework: "MDR",
        chapter: "General Safety and Performance Requirements"
      }
    ]
  },
  {
    clauseId: "20",
    summary: "Devices shall be designed and manufactured in such a way as to ensure that the device will function as intended throughout its defined or expected lifetime.",
    chapter: "General Safety and Performance Requirements",
    priority: "medium",
    checklist: [
      {
        id: "20-doc-1",
        clause: "20",
        section: "Lifetime functionality",
        requirement: "Ensure functionality throughout lifetime",
        description: "Document and verify device functions as intended throughout defined lifetime",
        category: "verification",
        framework: "MDR",
        chapter: "General Safety and Performance Requirements"
      }
    ]
  },
  {
    clauseId: "21",
    summary: "Devices shall be designed, manufactured and supplied in such a way as to facilitate the environmentally safe disposal of the device, its accessories and consumables.",
    chapter: "General Safety and Performance Requirements",
    priority: "medium",
    checklist: [
      {
        id: "21-doc-1",
        clause: "21",
        section: "Environmental disposal safety",
        requirement: "Facilitate environmentally safe disposal",
        description: "Document environmentally safe disposal provisions for device and accessories",
        category: "documentation",
        framework: "MDR",
        chapter: "General Safety and Performance Requirements"
      }
    ]
  },
  {
    clauseId: "22",
    summary: "Measurement, monitoring or display scale shall be designed in accordance with ergonomic principles, taking account of the intended purpose, users and the environmental conditions in which the devices are intended to be used.",
    chapter: "General Safety and Performance Requirements",
    priority: "medium",
    checklist: [
      {
        id: "22-doc-1",
        clause: "22",
        section: "Ergonomic design of displays",
        requirement: "Design displays according to ergonomic principles",
        description: "Document ergonomic design of measurement/monitoring displays for intended use environment",
        category: "documentation",
        framework: "MDR",
        chapter: "General Safety and Performance Requirements"
      }
    ]
  },
  {
    clauseId: "23",
    summary: "Devices shall be designed and manufactured in such a way as to remove or reduce as far as possible risks connected with their use by persons whose physical or mental capabilities are restricted, including persons who are disabled, elderly or ill or persons in stressful situations.",
    chapter: "General Safety and Performance Requirements",
    priority: "high",
    checklist: [
      {
        id: "23-doc-1",
        clause: "23",
        section: "Accessibility for restricted capabilities",
        requirement: "Accommodate users with restricted capabilities",
        description: "Document design considerations for users with physical/mental restrictions or in stressful situations",
        category: "documentation",
        framework: "MDR",
        chapter: "General Safety and Performance Requirements"
      }
    ]
  }
];

export const getMdrAnnexIStats = () => {
  const totalRequirements = mdrAnnexIChecklist.length;
  const chapters = Array.from(new Set(mdrAnnexIChecklist.map(item => item.chapter)));
  const totalChecklistItems = mdrAnnexIChecklist.reduce((sum, item) => sum + item.checklist.length, 0);
  
  return {
    totalRequirements,
    chapters: chapters.length,
    totalChecklistItems,
    chapterNames: chapters
  };
};