export interface GSPR {
  id: string;
  text: string;
  isApplicable: boolean;
  isComplete: boolean;
}

export interface Chapter {
  id: string;
  title: string;
  subtitle: string;
  color: string;
  gspRs: GSPR[];
}

export const annexIRequirements: Chapter[] = [
  {
    id: 'chapter1',
    title: 'Chapter I: General Requirements',
    subtitle: 'Risk Management, Performance, Lifetime',
    color: 'blue',
    gspRs: [
      { id: 'g_g1_1', text: 'GSPR 1.1: Devices shall achieve the performance intended by their manufacturer and shall be designed and manufactured in such a way that, during normal conditions of use, they are suitable for their intended purpose.', isApplicable: true, isComplete: false },
      { id: 'g_g1_2', text: 'GSPR 1.2: The solutions adopted by the manufacturer for the design and manufacture of the devices shall conform to safety principles, taking account of the generally acknowledged state of the art.', isApplicable: true, isComplete: false },
      { id: 'g_g1_3', text: 'GSPR 1.3: The devices shall achieve the performance intended by their manufacturer and shall be designed, manufactured and packaged in such a way that they are suitable for one or more of the specific purposes.', isApplicable: true, isComplete: false },
      { id: 'g_g2_1', text: 'GSPR 2.1: Devices shall be designed and manufactured in such a way that their use does not compromise the clinical condition or safety of patients, or the safety and health of users or other persons.', isApplicable: true, isComplete: false },
      { id: 'g_g2_2', text: 'GSPR 2.2: The level of protection determined shall be appropriate in relation to the benefits to the patient and shall be compatible with a high level of protection of health and safety.', isApplicable: true, isComplete: false },
      { id: 'g_g3_1', text: 'GSPR 3.1: The characteristics and performance of a device shall not be adversely altered to such a degree that the health or safety of the patient or user and, where applicable, of other persons are compromised during the lifetime of the device.', isApplicable: true, isComplete: false },
      { id: 'g_g4_1', text: 'GSPR 4.1: Devices shall be designed, manufactured and packaged in such a way as to minimise the risk posed by contaminants and residues to patients, taking account of the intended purpose of the device.', isApplicable: true, isComplete: false },
      { id: 'g_g5_1', text: 'GSPR 5.1: Devices shall be designed and manufactured in such a way that they can be used safely with the materials and substances, including gases, with which they enter into contact during their intended use.', isApplicable: true, isComplete: false },
      { id: 'g_g6_1', text: 'GSPR 6.1: Any undesirable side-effect shall constitute an acceptable risk when weighed against the performance intended.', isApplicable: true, isComplete: false },
      { id: 'g_g7_1', text: 'GSPR 7.1: Devices shall be designed and manufactured in such a way that they do not have an unacceptable adverse effect on the environment.', isApplicable: true, isComplete: false },
      { id: 'g_g8_1', text: 'GSPR 8.1: Devices incorporating software or devices that are medical device software shall be designed and manufactured to ensure repeatability, reliability and performance in line with their intended use.', isApplicable: true, isComplete: false },
      { id: 'g_g9_1', text: 'GSPR 9.1: Devices shall be designed and manufactured in such a way that removal or disposal can be carried out safely.', isApplicable: true, isComplete: false }
    ],
  },
  {
    id: 'chapter2a',
    title: 'Chapter IIA: Design & Manufacture (Part A)',
    subtitle: 'Material Science, Sterility, Measurements',
    color: 'green',
    gspRs: [
      { id: 'd_m2a_10_1', text: 'GSPR 10.1: Devices shall be designed and manufactured in such a way as to ensure that the characteristics and performance requirements referred to in Chapter I are fulfilled.', isApplicable: true, isComplete: false },
      { id: 'd_m2a_10_2', text: 'GSPR 10.2: The solutions adopted shall not compromise the clinical condition or safety of patients, or the safety and health of users or other persons.', isApplicable: true, isComplete: false },
      { id: 'd_m2a_10_3', text: 'GSPR 10.3: They shall be appropriate to the intended purpose of the device and be based, where appropriate, on well-established scientific methods.', isApplicable: true, isComplete: false },
      { id: 'd_m2a_11_1', text: 'GSPR 11.1: The devices and manufacturing processes shall be designed in such a way as to eliminate or reduce as far as possible the risk of infection to patients, users and third parties.', isApplicable: true, isComplete: false },
      { id: 'd_m2a_11_2', text: 'GSPR 11.2: The design shall allow easy handling and, where necessary, minimise contamination of the device by the patient or user during use.', isApplicable: true, isComplete: false },
      { id: 'd_m2a_11_3', text: 'GSPR 11.3: The design shall reduce as far as possible the risks from unintended cuts and pricks, such as needle stick injuries.', isApplicable: true, isComplete: false },
      { id: 'd_m2a_12_1', text: 'GSPR 12.1: Devices intended to be sterile shall be designed, manufactured and packaged to ensure that they are sterile when placed on the market.', isApplicable: true, isComplete: false },
      { id: 'd_m2a_12_2', text: 'GSPR 12.2: Such devices shall be manufactured by means of appropriate methods and shall remain sterile under the transport and storage conditions specified by the manufacturer.', isApplicable: true, isComplete: false },
      { id: 'd_m2a_13_1', text: 'GSPR 13.1: Devices intended to deliver medicinal products shall be designed and manufactured in such a way as to ensure compatibility with the medicinal products concerned.', isApplicable: true, isComplete: false },
      { id: 'd_m2a_14_1', text: 'GSPR 14.1: Devices with a measuring function shall be designed and manufactured in such a way as to provide sufficient accuracy and stability of measurement within appropriate limits of accuracy.', isApplicable: true, isComplete: false },
      { id: 'd_m2a_14_2', text: 'GSPR 14.2: The limits of accuracy shall be indicated by the manufacturer.', isApplicable: true, isComplete: false },
      { id: 'd_m2a_15_1', text: 'GSPR 15.1: Devices shall be designed and manufactured in such a way as to reduce as far as possible the risks posed by substances or particles that may be released from the device.', isApplicable: true, isComplete: false },
      { id: 'd_m2a_16_1', text: 'GSPR 16.1: Devices shall be designed and manufactured in such a way that they do not compromise the clinical condition or safety of patients.', isApplicable: true, isComplete: false }
    ],
  },
  {
    id: 'chapter2b',
    title: 'Chapter IIB: Design & Manufacture (Part B)',
    subtitle: 'Software, Electrical Safety, Mechanical',
    color: 'emerald',
    gspRs: [
      { id: 'd_m2b_17_1', text: 'GSPR 17.1: Devices that incorporate electronic programmable systems, including software, or software that are devices in themselves, shall be designed to ensure repeatability, reliability and performance in line with their intended use.', isApplicable: true, isComplete: false },
      { id: 'd_m2b_17_2', text: 'GSPR 17.2: In the event of a single fault condition, appropriate means shall be adopted to eliminate or reduce as far as possible consequent risks.', isApplicable: true, isComplete: false },
      { id: 'd_m2b_17_3', text: 'GSPR 17.3: For devices which incorporate software or for software that are devices in themselves, the software shall be developed and manufactured in accordance with the state of the art.', isApplicable: true, isComplete: false },
      { id: 'd_m2b_18_1', text: 'GSPR 18.1: Devices shall be designed and manufactured in such a way as to remove or reduce as far as possible risks of electric shock to the patient, user or any other person.', isApplicable: true, isComplete: false },
      { id: 'd_m2b_18_2', text: 'GSPR 18.2: Where devices are intended to supply energy or substances to a patient, this shall be carried out in a safe way that can be controlled by the user.', isApplicable: true, isComplete: false },
      { id: 'd_m2b_19_1', text: 'GSPR 19.1: Devices shall be designed and manufactured in such a way as to remove or reduce as far as possible the risks to the patient or user arising from mechanical hazards.', isApplicable: true, isComplete: false },
      { id: 'd_m2b_19_2', text: 'GSPR 19.2: In the case of devices intended for operation in conjunction with other devices or equipment, the whole combination shall be safe.', isApplicable: true, isComplete: false },
      { id: 'd_m2b_20_1', text: 'GSPR 20.1: Devices shall be designed and manufactured in such a way as to remove or reduce as far as possible the risks arising from energy delivered by the device.', isApplicable: true, isComplete: false },
      { id: 'd_m2b_21_1', text: 'GSPR 21.1: Devices intended for use by lay persons shall be designed and manufactured in such a way that they perform appropriately for their intended purpose.', isApplicable: true, isComplete: false },
      { id: 'd_m2b_21_2', text: 'GSPR 21.2: If the device is intended for use by lay persons, the knowledge and experience of such users and their technical, medical and linguistic skills shall be taken into account.', isApplicable: true, isComplete: false },
      { id: 'd_m2b_22_1', text: 'GSPR 22.1: Active devices intended for implantation and their accessories shall be designed and manufactured in such a way as to remove or reduce as far as possible risks connected with the size and properties of their energy source.', isApplicable: true, isComplete: false },
      { id: 'd_m2b_22_2', text: 'GSPR 22.2: Where appropriate, the devices shall be designed and manufactured in such a way as to reduce the risks connected with accidental penetration of liquids into the device.', isApplicable: true, isComplete: false }
    ],
  },
  {
    id: 'chapter3',
    title: 'Chapter III: Information Supplied',
    subtitle: 'Labeling, Instructions for Use (IFU)',
    color: 'amber',
    gspRs: [
      { id: 'i_s3_23_1', text: 'GSPR 23.1: Each device shall be accompanied by the information needed to identify the device and its manufacturer, and by any safety and performance information relevant to the user.', isApplicable: true, isComplete: false },
      { id: 'i_s3_23_2', text: 'GSPR 23.2: Such information may appear on the device itself, on the packaging or in the instructions for use, and shall, if the manufacturer has a website, be made available on the website.', isApplicable: true, isComplete: false },
      { id: 'i_s3_23_3', text: 'GSPR 23.3: The information required to enable any person to identify the device and its manufacturer shall appear on each device and on its packaging.', isApplicable: true, isComplete: false },
      { id: 'i_s3_23_4a', text: 'GSPR 23.4(a): The label shall contain the name or trade name of the device.', isApplicable: true, isComplete: false },
      { id: 'i_s3_23_4b', text: 'GSPR 23.4(b): The label shall contain the details strictly necessary to identify the device and the contents of the packaging.', isApplicable: true, isComplete: false },
      { id: 'i_s3_23_4c', text: 'GSPR 23.4(c): The label shall contain the name, registered trade name or registered trade mark of the manufacturer.', isApplicable: true, isComplete: false },
      { id: 'i_s3_23_4d', text: 'GSPR 23.4(d): The label shall contain the address of the registered place of business of the manufacturer.', isApplicable: true, isComplete: false },
      { id: 'i_s3_23_4e', text: 'GSPR 23.4(e): The label shall contain an indication allowing the device to be identified.', isApplicable: true, isComplete: false },
      { id: 'i_s3_23_4f', text: 'GSPR 23.4(f): The label shall contain the lot number or the serial number of the device.', isApplicable: true, isComplete: false },
      { id: 'i_s3_23_4g', text: 'GSPR 23.4(g): The label shall contain an indication of the date until which the device may be used safely.', isApplicable: true, isComplete: false },
      { id: 'i_s3_23_4h', text: 'GSPR 23.4(h): The label shall contain an indication of the date of manufacture.', isApplicable: true, isComplete: false },
      { id: 'i_s3_23_4i', text: 'GSPR 23.4(i): The label shall contain an indication of any special storage and/or handling conditions.', isApplicable: true, isComplete: false },
      { id: 'i_s3_23_4j', text: 'GSPR 23.4(j): The label shall contain, if the device is intended for single use, an indication of that fact.', isApplicable: true, isComplete: false },
      { id: 'i_s3_23_4k', text: 'GSPR 23.4(k): The label shall contain, if the device is a custom-made device, the words "custom-made device".', isApplicable: true, isComplete: false },
      { id: 'i_s3_23_4l', text: 'GSPR 23.4(l): The label shall contain, if the device is intended for clinical investigation, the words "exclusively for clinical investigation".', isApplicable: true, isComplete: false },
      { id: 'i_s3_23_4m', text: 'GSPR 23.4(m): The label shall contain, if applicable, a warning or precaution to be taken.', isApplicable: true, isComplete: false },
      { id: 'i_s3_23_4n', text: 'GSPR 23.4(n): The label shall contain, if applicable, the year of manufacture for devices that do not bear the date of manufacture.', isApplicable: true, isComplete: false },
      { id: 'i_s3_23_4o', text: 'GSPR 23.4(o): The label shall contain, for devices incorporating or consisting of software, a statement of the minimum requirements in terms of hardware, IT networks characteristics and IT security measures.', isApplicable: true, isComplete: false }
    ],
  },
];