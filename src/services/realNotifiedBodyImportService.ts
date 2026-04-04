import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface ImportResult {
  success: boolean;
  imported: number;
  errors: string[];
}

export interface ValidationResult {
  valid: boolean;
  issues: string[];
}

// Real EU Notified Bodies data from official NANDO database
const REAL_EU_NOTIFIED_BODIES = [
  {
    name: '3EC International a.s.',
    nb_number: 2265,
    scope_mdr: true,
    scope_ivdr: true,
    scope_high_risk_active_implantables: true,
    scope_high_risk_implants_non_active: true,
    scope_medical_software: true,
    scope_sterilization_methods: true,
    scope_drug_device_combinations: true,
    address: 'Hraničná 18, 821 05 Bratislava, SK',
    contact_number: '+421 2 4333 0145',
    email: 'info@3ec.sk',
    country: 'Slovakia'
  },
  {
    name: 'Agencia Española de Medicamentos y Productos Sanitarios (AEMPS)',
    nb_number: 318,
    scope_mdr: true,
    scope_ivdr: false,
    scope_high_risk_active_implantables: true,
    scope_high_risk_implants_non_active: true,
    scope_medical_software: true,
    scope_sterilization_methods: true,
    scope_drug_device_combinations: true,
    address: 'Parque Empresarial Las Mercedes, Edificio 8, C/ Campezo, 1, 28022 Madrid, ES',
    contact_number: '+34 918 22 51 34',
    email: 'aemps@aemps.es',
    country: 'Spain'
  },
  {
    name: 'BSI Group The Netherlands B.V.',
    nb_number: 2797,
    scope_mdr: true,
    scope_ivdr: true,
    scope_high_risk_active_implantables: true,
    scope_high_risk_implants_non_active: true,
    scope_medical_software: true,
    scope_sterilization_methods: true,
    scope_drug_device_combinations: true,
    address: 'Say Building, John M. Keynesplein 9, 1066 EP Amsterdam, NL',
    contact_number: '+31 20 346 0780',
    email: 'https://www.bsigroup.com/en-GB/medical-devices/contact-us/',
    country: 'Netherlands'
  },
  {
    name: 'Berlin Cert Prüf- und Zertifizierstelle für Medizinprodukte GmbH',
    nb_number: 633,
    scope_mdr: true,
    scope_ivdr: false,
    scope_high_risk_active_implantables: true,
    scope_high_risk_implants_non_active: true,
    scope_medical_software: true,
    scope_sterilization_methods: true,
    scope_drug_device_combinations: false,
    address: 'Dovestraße 6, 10587 Berlin, DE',
    contact_number: '+49 30 314 25111',
    email: 'info@berlin-cert.de',
    country: 'Germany'
  },
  {
    name: 'Bureau Veritas Italia S.p.A.',
    nb_number: 1370,
    scope_mdr: true,
    scope_ivdr: false,
    scope_high_risk_active_implantables: true,
    scope_high_risk_implants_non_active: true,
    scope_medical_software: true,
    scope_sterilization_methods: true,
    scope_drug_device_combinations: true,
    address: 'Viale Monza, 347, 20126 Milano, IT',
    contact_number: '+39 02 270911',
    email: 'https://www.bureauveritas.it/contatti',
    country: 'Italy'
  },
  {
    name: 'CE Certiso Kft',
    nb_number: 2409,
    scope_mdr: true,
    scope_ivdr: false,
    scope_high_risk_active_implantables: true,
    scope_high_risk_implants_non_active: true,
    scope_medical_software: true,
    scope_sterilization_methods: true,
    scope_drug_device_combinations: false,
    address: 'Öv u. 49, 1141 Budapest, HU',
    contact_number: '+36 1 413 3889',
    email: 'ce@cecertiso.hu',
    country: 'Hungary'
  },
  {
    name: 'CERTIQUALITY S.r.l.',
    nb_number: 546,
    scope_mdr: true,
    scope_ivdr: true,
    scope_high_risk_active_implantables: true,
    scope_high_risk_implants_non_active: true,
    scope_medical_software: true,
    scope_sterilization_methods: true,
    scope_drug_device_combinations: true,
    address: 'Piazza G. Bertini, 11, 20159 Milano, IT',
    contact_number: '+39 02 8069171',
    email: 'info@certiquality.it',
    country: 'Italy'
  },
  {
    name: 'DEKRA Certification B.V.',
    nb_number: 344,
    scope_mdr: true,
    scope_ivdr: true,
    scope_high_risk_active_implantables: true,
    scope_high_risk_implants_non_active: true,
    scope_medical_software: true,
    scope_sterilization_methods: true,
    scope_drug_device_combinations: true,
    address: 'Meander 1051, 6825 MJ Arnhem, NL',
    contact_number: '+31 88 96 83000',
    email: 'medical.global@dekra.com',
    country: 'Netherlands'
  },
  {
    name: 'DEKRA Certification GmbH',
    nb_number: 124,
    scope_mdr: true,
    scope_ivdr: true,
    scope_high_risk_active_implantables: true,
    scope_high_risk_implants_non_active: true,
    scope_medical_software: true,
    scope_sterilization_methods: true,
    scope_drug_device_combinations: true,
    address: 'Handwerkstraße 15, 70565 Stuttgart, DE',
    contact_number: '+49 711 7861 3771',
    email: 'med.certification.de@dekra.com',
    country: 'Germany'
  },
  {
    name: 'DNV MEDCERT GmbH',
    nb_number: 482,
    scope_mdr: true,
    scope_ivdr: false,
    scope_high_risk_active_implantables: true,
    scope_high_risk_implants_non_active: true,
    scope_medical_software: true,
    scope_sterilization_methods: true,
    scope_drug_device_combinations: true,
    address: 'Pilatuspool 2, 20355 Hamburg, DE',
    contact_number: '+49 40 3501 7770',
    email: 'info@medcert.de',
    country: 'Germany'
  },
  {
    name: 'DNV Product Assurance AS',
    nb_number: 2460,
    scope_mdr: true,
    scope_ivdr: false,
    scope_high_risk_active_implantables: true,
    scope_high_risk_implants_non_active: false,
    scope_medical_software: true,
    scope_sterilization_methods: true,
    scope_drug_device_combinations: false,
    address: 'Veritasveien 1, 1363 Høvik, NO',
    contact_number: '+47 67 57 99 00',
    email: 'https://www.dnv.com/contact',
    country: 'Norway'
  },
  {
    name: 'DQS Medizinprodukte GmbH',
    nb_number: 297,
    scope_mdr: true,
    scope_ivdr: false,
    scope_high_risk_active_implantables: true,
    scope_high_risk_implants_non_active: true,
    scope_medical_software: true,
    scope_sterilization_methods: true,
    scope_drug_device_combinations: true,
    address: 'August-Schanz-Straße 21, 60433 Frankfurt am Main, DE',
    contact_number: '+49 69 95427 300',
    email: 'info@dqs-med.de',
    country: 'Germany'
  },
  {
    name: 'ECM-ZERTIFIZIERUNGSGESELLSCHAFT FÜR MEDIZINPRODUKTE IN EUROPA MBH',
    nb_number: 481,
    scope_mdr: true,
    scope_ivdr: false,
    scope_high_risk_active_implantables: true,
    scope_high_risk_implants_non_active: true,
    scope_medical_software: false,
    scope_sterilization_methods: true,
    scope_drug_device_combinations: false,
    address: 'Bismarckstraße 106, 52066 Aachen, DE',
    contact_number: '+49 241 9809 10',
    email: 'info@ecm-zert.de',
    country: 'Germany'
  },
  {
    name: 'ENTE CERTIFICAZIONE MACCHINE SRL',
    nb_number: 1282,
    scope_mdr: true,
    scope_ivdr: false,
    scope_high_risk_active_implantables: false,
    scope_high_risk_implants_non_active: false,
    scope_medical_software: true,
    scope_sterilization_methods: false,
    scope_drug_device_combinations: false,
    address: 'Via Cà Bella, 243, 40024 Castello di Serravalle (BO), IT',
    contact_number: '+39 051 670 5141',
    email: 'info@entecerma.it',
    country: 'Italy'
  },
  {
    name: 'Eurofins Electric & Electronics Finland Oy',
    nb_number: 537,
    scope_mdr: true,
    scope_ivdr: true,
    scope_high_risk_active_implantables: true,
    scope_high_risk_implants_non_active: true,
    scope_medical_software: true,
    scope_sterilization_methods: true,
    scope_drug_device_combinations: false,
    address: 'Kivimiehentie 4, 02150 Espoo, FI',
    contact_number: '+358 29 505 2000',
    email: 'https://www.eurofins.fi/expertservices/en/contact-us/',
    country: 'Finland'
  },
  {
    name: 'Eurofins Product Testing Italy S.r.l.',
    nb_number: 477,
    scope_mdr: true,
    scope_ivdr: false,
    scope_high_risk_active_implantables: true,
    scope_high_risk_implants_non_active: true,
    scope_medical_software: true,
    scope_sterilization_methods: true,
    scope_drug_device_combinations: true,
    address: 'Via Courgnè, 21, 10156 Torino, IT',
    contact_number: '+39 011 22 22 225',
    email: 'MedicalDevice@eurofins.com',
    country: 'Italy'
  },
  {
    name: 'GMED SAS',
    nb_number: 459,
    scope_mdr: true,
    scope_ivdr: true,
    scope_high_risk_active_implantables: true,
    scope_high_risk_implants_non_active: true,
    scope_medical_software: true,
    scope_sterilization_methods: true,
    scope_drug_device_combinations: true,
    address: '1 rue Gaston Boissier, 75724 Paris Cedex 15, FR',
    contact_number: '+33 1 40 43 37 42',
    email: 'https://lne-gmed.com/en/contact-us/',
    country: 'France'
  },
  {
    name: 'HTCert (Health Technology Certification Ltd)',
    nb_number: 2803,
    scope_mdr: true,
    scope_ivdr: false,
    scope_high_risk_active_implantables: true,
    scope_high_risk_implants_non_active: true,
    scope_medical_software: true,
    scope_sterilization_methods: true,
    scope_drug_device_combinations: false,
    address: '28th October Street, 23, Engomi, 2414 Nicosia, CY',
    contact_number: '+357 22 411516',
    email: 'info@htcert.com',
    country: 'Cyprus'
  },
  {
    name: 'IMQ ISTITUTO ITALIANO DEL MARCHIO DI QUALITA\' S.P.A.',
    nb_number: 51,
    scope_mdr: true,
    scope_ivdr: false,
    scope_high_risk_active_implantables: true,
    scope_high_risk_implants_non_active: true,
    scope_medical_software: true,
    scope_sterilization_methods: true,
    scope_drug_device_combinations: true,
    address: 'Via Quintiliano, 43, 20138 Milano, IT',
    contact_number: '+39 02 50731',
    email: 'info@imq.it',
    country: 'Italy'
  },
  {
    name: 'Intertek Medical Notified Body AB',
    nb_number: 2862,
    scope_mdr: true,
    scope_ivdr: false,
    scope_high_risk_active_implantables: true,
    scope_high_risk_implants_non_active: true,
    scope_medical_software: true,
    scope_sterilization_methods: true,
    scope_drug_device_combinations: false,
    address: 'Torshamnsgatan 43, 164 22 Kista, SE',
    contact_number: '+46 8 750 00 00',
    email: 'https://www.intertek.com/medical/contact/',
    country: 'Sweden'
  },
  {
    name: 'INSTITUT PRO TESTOVÁNI A CERTIFIKACI, a.s.',
    nb_number: 1023,
    scope_mdr: true,
    scope_ivdr: false,
    scope_high_risk_active_implantables: true,
    scope_high_risk_implants_non_active: true,
    scope_medical_software: false,
    scope_sterilization_methods: true,
    scope_drug_device_combinations: true,
    address: 'třída Tomáše Bati 299, 764 21 Zlín-Louky, CZ',
    contact_number: '+420 577 601 111',
    email: 'itc@itczlin.cz',
    country: 'Czech Republic'
  },
  {
    name: 'ISTITUTO SUPERIORE DI SANITA\'',
    nb_number: 373,
    scope_mdr: true,
    scope_ivdr: true,
    scope_high_risk_active_implantables: true,
    scope_high_risk_implants_non_active: true,
    scope_medical_software: false,
    scope_sterilization_methods: true,
    scope_drug_device_combinations: true,
    address: 'Viale Regina Elena, 299, 00161 Roma, IT',
    contact_number: '+39 06 4990 1',
    email: 'protocollo.centrale@pec.iss.it',
    country: 'Italy'
  },
  {
    name: 'ITALCERT SRL',
    nb_number: 426,
    scope_mdr: true,
    scope_ivdr: false,
    scope_high_risk_active_implantables: true,
    scope_high_risk_implants_non_active: true,
    scope_medical_software: true,
    scope_sterilization_methods: true,
    scope_drug_device_combinations: true,
    address: 'Viale Sarca, 336, 20126 Milano, IT',
    contact_number: '+39 02 6610 4876',
    email: 'info@italcert.it',
    country: 'Italy'
  },
  {
    name: 'Kiwa Dare B.V.',
    nb_number: 1912,
    scope_mdr: true,
    scope_ivdr: false,
    scope_high_risk_active_implantables: true,
    scope_high_risk_implants_non_active: false,
    scope_medical_software: true,
    scope_sterilization_methods: false,
    scope_drug_device_combinations: false,
    address: 'Molenakker 3, 5464GG Veghel, NL',
    contact_number: '+31 413 74 55 00',
    email: 'info.nl@kiwa.com',
    country: 'Netherlands'
  },
  {
    name: 'KIWA CERMET ITALIA S.P.A.',
    nb_number: 476,
    scope_mdr: true,
    scope_ivdr: false,
    scope_high_risk_active_implantables: true,
    scope_high_risk_implants_non_active: true,
    scope_medical_software: true,
    scope_sterilization_methods: true,
    scope_drug_device_combinations: false,
    address: 'Via Cadriano, 23, 40057 Granarolo dell\'Emilia (BO), IT',
    contact_number: '+39 051 459 3111',
    email: 'info@kiwacermet.it',
    country: 'Italy'
  },
  {
    name: 'mdc medical device certification GmbH',
    nb_number: 483,
    scope_mdr: true,
    scope_ivdr: true,
    scope_high_risk_active_implantables: true,
    scope_high_risk_implants_non_active: true,
    scope_medical_software: true,
    scope_sterilization_methods: true,
    scope_drug_device_combinations: false,
    address: 'Kriegerstraße 6, 70191 Stuttgart, DE',
    contact_number: '+49 711 2535 97 0',
    email: 'info@mdc-ce.de',
    country: 'Germany'
  },
  {
    name: 'National Evaluation Center of Quality & Technology in Health S.A. (EKAPTY)',
    nb_number: 653,
    scope_mdr: true,
    scope_ivdr: false,
    scope_high_risk_active_implantables: true,
    scope_high_risk_implants_non_active: true,
    scope_medical_software: true,
    scope_sterilization_methods: true,
    scope_drug_device_combinations: false,
    address: '123 Papadiamantopoulou & Zografou, 11527 Athens, GR',
    contact_number: '+30 210 775 3501',
    email: 'info@ekapty.gr',
    country: 'Greece'
  },
  {
    name: 'National Standards Authority of Ireland (NSAI)',
    nb_number: 50,
    scope_mdr: true,
    scope_ivdr: true,
    scope_high_risk_active_implantables: true,
    scope_high_risk_implants_non_active: true,
    scope_medical_software: true,
    scope_sterilization_methods: true,
    scope_drug_device_combinations: true,
    address: '1 Swift Square, Northwood, Santry, Dublin 9, IE',
    contact_number: '+353 1 807 3800',
    email: 'medical.devices@nsai.ie',
    country: 'Ireland'
  },
  {
    name: 'NEMKO AS',
    nb_number: 470,
    scope_mdr: true,
    scope_ivdr: false,
    scope_high_risk_active_implantables: true,
    scope_high_risk_implants_non_active: false,
    scope_medical_software: true,
    scope_sterilization_methods: false,
    scope_drug_device_combinations: false,
    address: 'Philip Pedersens vei 11, 1366 Lysaker, NO',
    contact_number: '+47 22 96 03 30',
    email: 'info@nemko.com',
    country: 'Norway'
  },
  {
    name: 'POLSKIE CENTRUM BADAN I CERTYFIKACJI S.A.',
    nb_number: 1434,
    scope_mdr: true,
    scope_ivdr: false,
    scope_high_risk_active_implantables: true,
    scope_high_risk_implants_non_active: true,
    scope_medical_software: false,
    scope_sterilization_methods: true,
    scope_drug_device_combinations: false,
    address: 'ul. Kłobucka 23A, 02-699 Warszawa, PL',
    contact_number: '+48 22 464 52 00',
    email: 'pcbc@pcbc.gov.pl',
    country: 'Poland'
  },
  {
    name: 'QMD Services GmbH',
    nb_number: 2962,
    scope_mdr: true,
    scope_ivdr: false,
    scope_high_risk_active_implantables: true,
    scope_high_risk_implants_non_active: true,
    scope_medical_software: true,
    scope_sterilization_methods: true,
    scope_drug_device_combinations: true,
    address: 'Gumpendorfer Straße 14, 1060 Wien, AT',
    contact_number: '+43 1 585 09 30',
    email: 'office@qmdservices.com',
    country: 'Austria'
  },
  {
    name: 'QS ZÜRICH AG',
    nb_number: 1254,
    scope_mdr: true,
    scope_ivdr: false,
    scope_high_risk_active_implantables: true,
    scope_high_risk_implants_non_active: true,
    scope_medical_software: true,
    scope_sterilization_methods: true,
    scope_drug_device_combinations: false,
    address: 'Binzstrasse 15, 8045 Zürich, CH',
    contact_number: '+41 44 455 58 58',
    email: 'info@qsz.ch',
    country: 'Switzerland'
  },
  {
    name: 'Scarlet NB B.V.',
    nb_number: 3022,
    scope_mdr: true,
    scope_ivdr: false,
    scope_high_risk_active_implantables: true,
    scope_high_risk_implants_non_active: true,
    scope_medical_software: true,
    scope_sterilization_methods: true,
    scope_drug_device_combinations: false,
    address: 'Wageningen Campus, Plus Ultra II, Bronland 10, 6708 WH Wageningen, NL',
    contact_number: '+31 85 018 7920',
    email: 'info@scarlet-nb.com',
    country: 'Netherlands'
  },
  {
    name: 'Sertio Oy',
    nb_number: 3018,
    scope_mdr: true,
    scope_ivdr: false,
    scope_high_risk_active_implantables: true,
    scope_high_risk_implants_non_active: true,
    scope_medical_software: true,
    scope_sterilization_methods: true,
    scope_drug_device_combinations: true,
    address: 'Hämeenkatu 12 C 40, 33100 Tampere, FI',
    contact_number: '+358 40 758 7378',
    email: 'info@sertio.fi',
    country: 'Finland'
  },
  {
    name: 'SGS Belgium NV',
    nb_number: 1639,
    scope_mdr: true,
    scope_ivdr: true,
    scope_high_risk_active_implantables: true,
    scope_high_risk_implants_non_active: true,
    scope_medical_software: true,
    scope_sterilization_methods: true,
    scope_drug_device_combinations: false,
    address: 'SGS House, Noorderlaan 87, 2030 Antwerp, BE',
    contact_number: '+32 3 545 48 48',
    email: 'be.md@sgs.com',
    country: 'Belgium'
  },
  {
    name: 'SGS FIMKO OY',
    nb_number: 598,
    scope_mdr: true,
    scope_ivdr: true,
    scope_high_risk_active_implantables: true,
    scope_high_risk_implants_non_active: true,
    scope_medical_software: true,
    scope_sterilization_methods: true,
    scope_drug_device_combinations: true,
    address: 'Särkiniementie 3, 00210 Helsinki, FI',
    contact_number: '+358 9 696 361',
    email: 'sgs.fimko@sgs.com',
    country: 'Finland'
  },
  {
    name: 'SIQ - Slovenian Institute of Quality and Metrology',
    nb_number: 1304,
    scope_mdr: true,
    scope_ivdr: false,
    scope_high_risk_active_implantables: true,
    scope_high_risk_implants_non_active: true,
    scope_medical_software: true,
    scope_sterilization_methods: true,
    scope_drug_device_combinations: true,
    address: 'Mašera-Spasićeva ulica 10, 1000 Ljubljana, SI',
    contact_number: '+386 1 4778 100',
    email: 'info@siq.si',
    country: 'Slovenia'
  },
  {
    name: 'SKZ - TeConA GmbH',
    nb_number: 3004,
    scope_mdr: true,
    scope_ivdr: false,
    scope_high_risk_active_implantables: true,
    scope_high_risk_implants_non_active: true,
    scope_medical_software: false,
    scope_sterilization_methods: true,
    scope_drug_device_combinations: false,
    address: 'Friedrich-Bergius-Ring 22, 97076 Würzburg, DE',
    contact_number: '+49 931 4104 186',
    email: 'tecona@skz.de',
    country: 'Germany'
  },
  {
    name: 'SLG PRÜF UND ZERTIFIZIERUNGS GMBH',
    nb_number: 494,
    scope_mdr: true,
    scope_ivdr: false,
    scope_high_risk_active_implantables: true,
    scope_high_risk_implants_non_active: true,
    scope_medical_software: true,
    scope_sterilization_methods: true,
    scope_drug_device_combinations: true,
    address: 'Burgstädter Straße 20, 09232 Hartmannsdorf, DE',
    contact_number: '+49 3722 7323 0',
    email: 'info@slg.de.com',
    country: 'Germany'
  },
  {
    name: 'TUV NORD CERT GmbH',
    nb_number: 44,
    scope_mdr: true,
    scope_ivdr: false,
    scope_high_risk_active_implantables: true,
    scope_high_risk_implants_non_active: true,
    scope_medical_software: true,
    scope_sterilization_methods: true,
    scope_drug_device_combinations: false,
    address: 'Am TÜV 1, 45307 Essen, DE',
    contact_number: '+49 201 825 2236',
    email: 'medical@tuev-nord.de',
    country: 'Germany'
  },
  {
    name: 'TUV NORD Polska Sp. z o.o',
    nb_number: 2274,
    scope_mdr: true,
    scope_ivdr: false,
    scope_high_risk_active_implantables: true,
    scope_high_risk_implants_non_active: true,
    scope_medical_software: false,
    scope_sterilization_methods: true,
    scope_drug_device_combinations: false,
    address: 'ul. Mickiewicza 29, 40-085 Katowice, PL',
    contact_number: '+48 32 786 46 00',
    email: 'biuro@tuv-nord.pl',
    country: 'Poland'
  },
  {
    name: 'TUV Rheinland Italia SRL',
    nb_number: 1936,
    scope_mdr: true,
    scope_ivdr: false,
    scope_high_risk_active_implantables: true,
    scope_high_risk_implants_non_active: true,
    scope_medical_software: true,
    scope_sterilization_methods: true,
    scope_drug_device_combinations: true,
    address: 'Via E. Mattei, 10, 20010 Pogliano Milanese (MI), IT',
    contact_number: '+39 02 939 6871',
    email: 'info@it.tuv.com',
    country: 'Italy'
  },
  {
    name: 'TÜV Rheinland LGA Products GmbH',
    nb_number: 197,
    scope_mdr: true,
    scope_ivdr: true,
    scope_high_risk_active_implantables: true,
    scope_high_risk_implants_non_active: true,
    scope_medical_software: true,
    scope_sterilization_methods: true,
    scope_drug_device_combinations: true,
    address: 'Tillystraße 2, 90431 Nuremberg, DE',
    contact_number: '+49 221 806 2989',
    email: 'https://www.de.tuv.com/en/contact/',
    country: 'Germany'
  },
  {
    name: 'TÜV SÜD Product Service GmbH',
    nb_number: 123,
    scope_mdr: true,
    scope_ivdr: true,
    scope_high_risk_active_implantables: true,
    scope_high_risk_implants_non_active: true,
    scope_medical_software: true,
    scope_sterilization_methods: true,
    scope_drug_device_combinations: true,
    address: 'Ridlerstraße 65, 80339 Munich, DE',
    contact_number: '+49 89 5008 4233',
    email: 'medical-health@tuvsud.com',
    country: 'Germany'
  },
  {
    name: 'TÜV AUSTRIA SERVICES GMBH',
    nb_number: 408,
    scope_mdr: true,
    scope_ivdr: false,
    scope_high_risk_active_implantables: true,
    scope_high_risk_implants_non_active: true,
    scope_medical_software: true,
    scope_sterilization_methods: true,
    scope_drug_device_combinations: true,
    address: 'Deutschstraße 10, 1230 Wien, AT',
    contact_number: '+43 5 0454 0',
    email: 'office@tuv.at',
    country: 'Austria'
  },
  {
    name: 'UDEM Adriatic d.o.o.',
    nb_number: 2696,
    scope_mdr: true,
    scope_ivdr: false,
    scope_high_risk_active_implantables: true,
    scope_high_risk_implants_non_active: true,
    scope_medical_software: true,
    scope_sterilization_methods: true,
    scope_drug_device_combinations: true,
    address: 'Josipa Lončara 3, 10090 Zagreb, HR',
    contact_number: '+385 1 5586 865',
    email: 'info@udem.hr',
    country: 'Croatia'
  },
  {
    name: 'UDEM Uluslararasi Belgelendirme Denetim Egitim Merkezi San. ve Tic. A.S.',
    nb_number: 2292,
    scope_mdr: true,
    scope_ivdr: false,
    scope_high_risk_active_implantables: true,
    scope_high_risk_implants_non_active: true,
    scope_medical_software: true,
    scope_sterilization_methods: true,
    scope_drug_device_combinations: false,
    address: 'Mutlukent Mahallesi, 2073. Sk. No:8, 06800 Çankaya/Ankara, TR',
    contact_number: '+90 312 443 0390',
    email: 'info@udem.com.tr',
    country: 'Turkey'
  }
];

export const RealNotifiedBodyImportService = {
  async importRealEUNotifiedBodies(): Promise<{success: boolean, imported: number, errors: string[]}> {
    const errors: string[] = [];
    let importedCount = 0;

    try {
      console.log('Starting import of real EU Notified Bodies...');

      // Step 1: Clear existing data
      console.log('Clearing existing notified bodies data...');
      const { error: deleteError } = await supabase
        .from('notified_bodies')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all records

      if (deleteError) {
        console.error('Error clearing existing data:', deleteError);
        errors.push(`Failed to clear existing data: ${deleteError.message}`);
      } else {
        console.log('Successfully cleared existing data');
      }

      // Step 2: Import real data in batches
      console.log(`Importing ${REAL_EU_NOTIFIED_BODIES.length} real EU Notified Bodies...`);
      
      const batchSize = 10;
      for (let i = 0; i < REAL_EU_NOTIFIED_BODIES.length; i += batchSize) {
        const batch = REAL_EU_NOTIFIED_BODIES.slice(i, i + batchSize);
        
        const formattedBatch = batch.map(nb => ({
          name: nb.name,
          nb_number: nb.nb_number,
          scope_mdr: nb.scope_mdr,
          scope_ivdr: nb.scope_ivdr,
          scope_high_risk_active_implantables: nb.scope_high_risk_active_implantables,
          scope_high_risk_implants_non_active: nb.scope_high_risk_implants_non_active,
          scope_medical_software: nb.scope_medical_software,
          scope_sterilization_methods: nb.scope_sterilization_methods,
          scope_drug_device_combinations: nb.scope_drug_device_combinations,
          address: nb.address,
          contact_number: nb.contact_number,
          email: nb.email,
          country: nb.country,
          is_active: true,
          data_source: 'official_eu_nando'
        }));

        const { data, error } = await supabase
          .from('notified_bodies')
          .insert(formattedBatch)
          .select('id');

        if (error) {
          console.error(`Error inserting batch ${i / batchSize + 1}:`, error);
          errors.push(`Batch ${i / batchSize + 1} failed: ${error.message}`);
        } else {
          const batchCount = data?.length || 0;
          importedCount += batchCount;
          console.log(`Successfully imported batch ${i / batchSize + 1}: ${batchCount} records`);
        }
      }

      // Step 3: Validate import
      const { count, error: countError } = await supabase
        .from('notified_bodies')
        .select('*', { count: 'exact', head: true })
        .eq('data_source', 'official_eu_nando');

      if (countError) {
        console.error('Error validating import:', countError);
        errors.push(`Import validation failed: ${countError.message}`);
      } else {
        console.log(`Import validation: ${count} records found with official_eu_nando source`);
      }

      const success = errors.length === 0 && importedCount > 0;
      console.log(`Import completed. Success: ${success}, Imported: ${importedCount}, Errors: ${errors.length}`);

      return {
        success,
        imported: importedCount,
        errors
      };

    } catch (error) {
      console.error('Critical error during import:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      errors.push(`Critical import error: ${errorMessage}`);
      
      return {
        success: false,
        imported: importedCount,
        errors
      };
    }
  },

  async validateImportedData(): Promise<{valid: boolean, issues: string[]}> {
    const issues: string[] = [];

    try {
      console.log('Validating imported notified bodies data...');

      // Check total count
      const { count, error: countError } = await supabase
        .from('notified_bodies')
        .select('*', { count: 'exact', head: true });

      if (countError) {
        issues.push(`Could not count records: ${countError.message}`);
        return { valid: false, issues };
      }

      console.log(`Total notified bodies in database: ${count}`);

      // Check for official EU data
      const { count: officialCount, error: officialError } = await supabase
        .from('notified_bodies')
        .select('*', { count: 'exact', head: true })
        .eq('data_source', 'official_eu_nando');

      if (officialError) {
        issues.push(`Could not count official records: ${officialError.message}`);
      } else {
        console.log(`Official EU records: ${officialCount}`);
        if (officialCount === 0) {
          issues.push('No official EU Notified Bodies found');
        } else if (officialCount < 40) {
          issues.push(`Expected around 45 official records, found only ${officialCount}`);
        }
      }

      // Check for duplicate NB numbers
      const { data: duplicates, error: duplicateError } = await supabase
        .from('notified_bodies')
        .select('nb_number')
        .not('nb_number', 'is', null);

      if (duplicateError) {
        issues.push(`Could not check for duplicates: ${duplicateError.message}`);
      } else if (duplicates) {
        const nbNumbers = duplicates.map(d => d.nb_number);
        const uniqueNumbers = new Set(nbNumbers);
        if (nbNumbers.length !== uniqueNumbers.size) {
          issues.push('Duplicate NB numbers found in database');
        }
      }

      // Check for required fields
      const { data: incompleteRecords, error: incompleteError } = await supabase
        .from('notified_bodies')
        .select('id, name, nb_number, country')
        .or('name.is.null,nb_number.is.null,country.is.null');

      if (incompleteError) {
        issues.push(`Could not check for incomplete records: ${incompleteError.message}`);
      } else if (incompleteRecords && incompleteRecords.length > 0) {
        issues.push(`Found ${incompleteRecords.length} records with missing required fields`);
      }

      const isValid = issues.length === 0;
      console.log(`Validation completed. Valid: ${isValid}, Issues: ${issues.length}`);

      return {
        valid: isValid,
        issues
      };

    } catch (error) {
      console.error('Error during validation:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown validation error';
      issues.push(`Validation error: ${errorMessage}`);
      
      return {
        valid: false,
        issues
      };
    }
  }
};
