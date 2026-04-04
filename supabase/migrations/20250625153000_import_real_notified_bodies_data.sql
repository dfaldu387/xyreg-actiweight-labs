
-- Import real EU Notified Bodies data from CSV
-- This replaces any fake data with authentic NANDO database entries

-- First, clear any existing data to ensure clean import
DELETE FROM notified_bodies;

-- Reset the sequence if needed
-- (Using UUIDs so this isn't necessary, but good practice)

-- Insert the real EU Notified Bodies data
INSERT INTO notified_bodies (
  name, 
  nb_number, 
  scope_mdr, 
  scope_ivdr, 
  scope_high_risk_active_implantables, 
  scope_high_risk_implants_non_active, 
  scope_medical_software, 
  scope_sterilization_methods, 
  scope_drug_device_combinations, 
  address, 
  contact_number, 
  email, 
  country, 
  is_active, 
  data_source
) VALUES 
('3EC International a.s.', 2265, true, true, true, true, true, true, true, 'Hraničná 18, 821 05 Bratislava, SK', '+421 2 4333 0145', 'info@3ec.sk', 'Slovakia', true, 'official_eu_nando'),
('Agencia Española de Medicamentos y Productos Sanitarios (AEMPS)', 318, true, false, true, true, true, true, true, 'Parque Empresarial Las Mercedes, Edificio 8, C/ Campezo, 1, 28022 Madrid, ES', '+34 918 22 51 34', 'aemps@aemps.es', 'Spain', true, 'official_eu_nando'),
('BSI Group The Netherlands B.V.', 2797, true, true, true, true, true, true, true, 'Say Building, John M. Keynesplein 9, 1066 EP Amsterdam, NL', '+31 20 346 0780', 'https://www.bsigroup.com/en-GB/medical-devices/contact-us/', 'Netherlands', true, 'official_eu_nando'),
('Berlin Cert Prüf- und Zertifizierstelle für Medizinprodukte GmbH', 633, true, false, true, true, true, true, false, 'Dovestraße 6, 10587 Berlin, DE', '+49 30 314 25111', 'info@berlin-cert.de', 'Germany', true, 'official_eu_nando'),
('Bureau Veritas Italia S.p.A.', 1370, true, false, true, true, true, true, true, 'Viale Monza, 347, 20126 Milano, IT', '+39 02 270911', 'https://www.bureauveritas.it/contatti', 'Italy', true, 'official_eu_nando'),
('CE Certiso Kft', 2409, true, false, true, true, true, true, false, 'Öv u. 49, 1141 Budapest, HU', '+36 1 413 3889', 'ce@cecertiso.hu', 'Hungary', true, 'official_eu_nando'),
('CERTIQUALITY S.r.l.', 546, true, true, true, true, true, true, true, 'Piazza G. Bertini, 11, 20159 Milano, IT', '+39 02 8069171', 'info@certiquality.it', 'Italy', true, 'official_eu_nando'),
('DEKRA Certification B.V.', 344, true, true, true, true, true, true, true, 'Meander 1051, 6825 MJ Arnhem, NL', '+31 88 96 83000', 'medical.global@dekra.com', 'Netherlands', true, 'official_eu_nando'),
('DEKRA Certification GmbH', 124, true, true, true, true, true, true, true, 'Handwerkstraße 15, 70565 Stuttgart, DE', '+49 711 7861 3771', 'med.certification.de@dekra.com', 'Germany', true, 'official_eu_nando'),
('DNV MEDCERT GmbH', 482, true, false, true, true, true, true, true, 'Pilatuspool 2, 20355 Hamburg, DE', '+49 40 3501 7770', 'info@medcert.de', 'Germany', true, 'official_eu_nando'),
('DNV Product Assurance AS', 2460, true, false, true, false, true, true, false, 'Veritasveien 1, 1363 Høvik, NO', '+47 67 57 99 00', 'https://www.dnv.com/contact', 'Norway', true, 'official_eu_nando'),
('DQS Medizinprodukte GmbH', 297, true, false, true, true, true, true, true, 'August-Schanz-Straße 21, 60433 Frankfurt am Main, DE', '+49 69 95427 300', 'info@dqs-med.de', 'Germany', true, 'official_eu_nando'),
('ECM-ZERTIFIZIERUNGSGESELLSCHAFT FÜR MEDIZINPRODUKTE IN EUROPA MBH', 481, true, false, true, true, false, true, false, 'Bismarckstraße 106, 52066 Aachen, DE', '+49 241 9809 10', 'info@ecm-zert.de', 'Germany', true, 'official_eu_nando'),
('ENTE CERTIFICAZIONE MACCHINE SRL', 1282, true, false, false, false, true, false, false, 'Via Cà Bella, 243, 40024 Castello di Serravalle (BO), IT', '+39 051 670 5141', 'info@entecerma.it', 'Italy', true, 'official_eu_nando'),
('Eurofins Electric & Electronics Finland Oy', 537, true, true, true, true, true, true, false, 'Kivimiehentie 4, 02150 Espoo, FI', '+358 29 505 2000', 'https://www.eurofins.fi/expertservices/en/contact-us/', 'Finland', true, 'official_eu_nando'),
('Eurofins Product Testing Italy S.r.l.', 477, true, false, true, true, true, true, true, 'Via Courgnè, 21, 10156 Torino, IT', '+39 011 22 22 225', 'MedicalDevice@eurofins.com', 'Italy', true, 'official_eu_nando'),
('GMED SAS', 459, true, true, true, true, true, true, true, '1 rue Gaston Boissier, 75724 Paris Cedex 15, FR', '+33 1 40 43 37 42', 'https://lne-gmed.com/en/contact-us/', 'France', true, 'official_eu_nando'),
('HTCert (Health Technology Certification Ltd)', 2803, true, false, true, true, true, true, false, '28th October Street, 23, Engomi, 2414 Nicosia, CY', '+357 22 411516', 'info@htcert.com', 'Cyprus', true, 'official_eu_nando'),
('IMQ ISTITUTO ITALIANO DEL MARCHIO DI QUALITA'' S.P.A.', 51, true, false, true, true, true, true, true, 'Via Quintiliano, 43, 20138 Milano, IT', '+39 02 50731', 'info@imq.it', 'Italy', true, 'official_eu_nando'),
('Intertek Medical Notified Body AB', 2862, true, false, true, true, true, true, false, 'Torshamnsgatan 43, 164 22 Kista, SE', '+46 8 750 00 00', 'https://www.intertek.com/medical/contact/', 'Sweden', true, 'official_eu_nando'),
('INSTITUT PRO TESTOVÁNI A CERTIFIKACI, a.s.', 1023, true, false, true, true, false, true, true, 'třída Tomáše Bati 299, 764 21 Zlín-Louky, CZ', '+420 577 601 111', 'itc@itczlin.cz', 'Czech Republic', true, 'official_eu_nando'),
('ISTITUTO SUPERIORE DI SANITA''', 373, true, true, true, true, false, true, true, 'Viale Regina Elena, 299, 00161 Roma, IT', '+39 06 4990 1', 'protocollo.centrale@pec.iss.it', 'Italy', true, 'official_eu_nando'),
('ITALCERT SRL', 426, true, false, true, true, true, true, true, 'Viale Sarca, 336, 20126 Milano, IT', '+39 02 6610 4876', 'info@italcert.it', 'Italy', true, 'official_eu_nando'),
('Kiwa Dare B.V.', 1912, true, false, true, false, true, false, false, 'Molenakker 3, 5464GG Veghel, NL', '+31 413 74 55 00', 'info.nl@kiwa.com', 'Netherlands', true, 'official_eu_nando'),
('KIWA CERMET ITALIA S.P.A.', 476, true, false, true, true, true, true, false, 'Via Cadriano, 23, 40057 Granarolo dell''Emilia (BO), IT', '+39 051 459 3111', 'info@kiwacermet.it', 'Italy', true, 'official_eu_nando'),
('mdc medical device certification GmbH', 483, true, true, true, true, true, true, false, 'Kriegerstraße 6, 70191 Stuttgart, DE', '+49 711 2535 97 0', 'info@mdc-ce.de', 'Germany', true, 'official_eu_nando'),
('National Evaluation Center of Quality & Technology in Health S.A. (EKAPTY)', 653, true, false, true, true, true, true, false, '123 Papadiamantopoulou & Zografou, 11527 Athens, GR', '+30 210 775 3501', 'info@ekapty.gr', 'Greece', true, 'official_eu_nando'),
('National Standards Authority of Ireland (NSAI)', 50, true, true, true, true, true, true, true, '1 Swift Square, Northwood, Santry, Dublin 9, IE', '+353 1 807 3800', 'medical.devices@nsai.ie', 'Ireland', true, 'official_eu_nando'),
('NEMKO AS', 470, true, false, true, false, true, false, false, 'Philip Pedersens vei 11, 1366 Lysaker, NO', '+47 22 96 03 30', 'info@nemko.com', 'Norway', true, 'official_eu_nando'),
('POLSKIE CENTRUM BADAN I CERTYFIKACJI S.A.', 1434, true, false, true, true, false, true, false, 'ul. Kłobucka 23A, 02-699 Warszawa, PL', '+48 22 464 52 00', 'pcbc@pcbc.gov.pl', 'Poland', true, 'official_eu_nando'),
('QMD Services GmbH', 2962, true, false, true, true, true, true, true, 'Gumpendorfer Straße 14, 1060 Wien, AT', '+43 1 585 09 30', 'office@qmdservices.com', 'Austria', true, 'official_eu_nando'),
('QS ZÜRICH AG', 1254, true, false, true, true, true, true, false, 'Binzstrasse 15, 8045 Zürich, CH', '+41 44 455 58 58', 'info@qsz.ch', 'Switzerland', true, 'official_eu_nando'),
('Scarlet NB B.V.', 3022, true, false, true, true, true, true, false, 'Wageningen Campus, Plus Ultra II, Bronland 10, 6708 WH Wageningen, NL', '+31 85 018 7920', 'info@scarlet-nb.com', 'Netherlands', true, 'official_eu_nando'),
('Sertio Oy', 3018, true, false, true, true, true, true, true, 'Hämeenkatu 12 C 40, 33100 Tampere, FI', '+358 40 758 7378', 'info@sertio.fi', 'Finland', true, 'official_eu_nando'),
('SGS Belgium NV', 1639, true, true, true, true, true, true, false, 'SGS House, Noorderlaan 87, 2030 Antwerp, BE', '+32 3 545 48 48', 'be.md@sgs.com', 'Belgium', true, 'official_eu_nando'),
('SGS FIMKO OY', 598, true, true, true, true, true, true, true, 'Särkiniementie 3, 00210 Helsinki, FI', '+358 9 696 361', 'sgs.fimko@sgs.com', 'Finland', true, 'official_eu_nando'),
('SIQ - Slovenian Institute of Quality and Metrology', 1304, true, false, true, true, true, true, true, 'Mašera-Spasićeva ulica 10, 1000 Ljubljana, SI', '+386 1 4778 100', 'info@siq.si', 'Slovenia', true, 'official_eu_nando'),
('SKZ - TeConA GmbH', 3004, true, false, true, true, false, true, false, 'Friedrich-Bergius-Ring 22, 97076 Würzburg, DE', '+49 931 4104 186', 'tecona@skz.de', 'Germany', true, 'official_eu_nando'),
('SLG PRÜF UND ZERTIFIZIERUNGS GMBH', 494, true, false, true, true, true, true, true, 'Burgstädter Straße 20, 09232 Hartmannsdorf, DE', '+49 3722 7323 0', 'info@slg.de.com', 'Germany', true, 'official_eu_nando'),
('TUV NORD CERT GmbH', 44, true, false, true, true, true, true, false, 'Am TÜV 1, 45307 Essen, DE', '+49 201 825 2236', 'medical@tuev-nord.de', 'Germany', true, 'official_eu_nando'),
('TUV NORD Polska Sp. z o.o', 2274, true, false, true, true, false, true, false, 'ul. Mickiewicza 29, 40-085 Katowice, PL', '+48 32 786 46 00', 'biuro@tuv-nord.pl', 'Poland', true, 'official_eu_nando'),
('TUV Rheinland Italia SRL', 1936, true, false, true, true, true, true, true, 'Via E. Mattei, 10, 20010 Pogliano Milanese (MI), IT', '+39 02 939 6871', 'info@it.tuv.com', 'Italy', true, 'official_eu_nando'),
('TÜV Rheinland LGA Products GmbH', 197, true, true, true, true, true, true, true, 'Tillystraße 2, 90431 Nuremberg, DE', '+49 221 806 2989', 'https://www.de.tuv.com/en/contact/', 'Germany', true, 'official_eu_nando'),
('TÜV SÜD Product Service GmbH', 123, true, true, true, true, true, true, true, 'Ridlerstraße 65, 80339 Munich, DE', '+49 89 5008 4233', 'medical-health@tuvsud.com', 'Germany', true, 'official_eu_nando'),
('TÜV AUSTRIA SERVICES GMBH', 408, true, false, true, true, true, true, true, 'Deutschstraße 10, 1230 Wien, AT', '+43 5 0454 0', 'office@tuv.at', 'Austria', true, 'official_eu_nando'),
('UDEM Adriatic d.o.o.', 2696, true, false, true, true, true, true, true, 'Josipa Lončara 3, 10090 Zagreb, HR', '+385 1 5586 865', 'info@udem.hr', 'Croatia', true, 'official_eu_nando'),
('UDEM Uluslararasi Belgelendirme Denetim Egitim Merkezi San. ve Tic. A.S.', 2292, true, false, true, true, true, true, false, 'Mutlukent Mahallesi, 2073. Sk. No:8, 06800 Çankaya/Ankara, TR', '+90 312 443 0390', 'info@udem.com.tr', 'Turkey', true, 'official_eu_nando');

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_notified_bodies_nb_number_new ON notified_bodies(nb_number);
CREATE INDEX IF NOT EXISTS idx_notified_bodies_country_new ON notified_bodies(country);
CREATE INDEX IF NOT EXISTS idx_notified_bodies_scope_mdr ON notified_bodies(scope_mdr);
CREATE INDEX IF NOT EXISTS idx_notified_bodies_scope_ivdr ON notified_bodies(scope_ivdr);

-- Add comment for documentation
COMMENT ON TABLE notified_bodies IS 'Authentic EU Notified Bodies from NANDO database - imported from official data';

-- Verify the import
DO $$
DECLARE
    nb_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO nb_count FROM notified_bodies WHERE data_source = 'official_eu_nando';
    RAISE NOTICE 'Successfully imported % official EU Notified Bodies', nb_count;
END $$;
