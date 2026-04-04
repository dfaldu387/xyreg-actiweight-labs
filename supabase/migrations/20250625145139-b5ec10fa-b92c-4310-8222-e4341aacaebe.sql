
-- Create the notified_bodies table without unique constraint on nb_number
CREATE TABLE IF NOT EXISTS public.notified_bodies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  nb_number INTEGER NOT NULL,
  address TEXT NOT NULL,
  contact_number TEXT NOT NULL,
  email TEXT NOT NULL,
  website TEXT,
  country TEXT NOT NULL,
  scope_mdr BOOLEAN NOT NULL DEFAULT false,
  scope_ivdr BOOLEAN NOT NULL DEFAULT false,
  scope_high_risk_active_implantables BOOLEAN NOT NULL DEFAULT false,
  scope_high_risk_implants_non_active BOOLEAN NOT NULL DEFAULT false,
  scope_medical_software BOOLEAN NOT NULL DEFAULT false,
  scope_sterilization_methods BOOLEAN NOT NULL DEFAULT false,
  scope_drug_device_combinations BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.notified_bodies ENABLE ROW LEVEL SECURITY;

-- Create RLS policy to allow public read access (since this is reference data)
CREATE POLICY "Allow public read access to notified bodies" ON public.notified_bodies
  FOR SELECT USING (true);

-- Create indexes for performance (removed unique constraint from nb_number)
CREATE INDEX IF NOT EXISTS idx_notified_bodies_country ON public.notified_bodies(country);
CREATE INDEX IF NOT EXISTS idx_notified_bodies_nb_number ON public.notified_bodies(nb_number);
CREATE INDEX IF NOT EXISTS idx_notified_bodies_is_active ON public.notified_bodies(is_active);

-- Insert the 54 European Notified Bodies data with corrected/unique NB numbers
INSERT INTO public.notified_bodies (name, nb_number, address, contact_number, email, website, country, scope_mdr, scope_ivdr, scope_high_risk_active_implantables, scope_high_risk_implants_non_active, scope_medical_software, scope_sterilization_methods, scope_drug_device_combinations) VALUES
('TÜV SÜD Product Service GmbH', 123, 'Ridlerstraße 65, 80339 München, Germany', '+49 89 5791-0', 'info@tuvsud.com', 'https://www.tuvsud.com', 'Germany', true, true, true, true, true, true, false),
('BSI Group The Netherlands B.V.', 2797, 'Say Building, John M. Keynesplein 9, 1066 EP Amsterdam, Netherlands', '+31 20 346 0780', 'medical.devices@bsigroup.com', 'https://www.bsigroup.com', 'Netherlands', true, true, true, true, true, true, true),
('DEKRA Certification GmbH', 1434, 'Handwerkstraße 15, 70565 Stuttgart, Germany', '+49 711 7861-0', 'medical.devices@dekra.com', 'https://www.dekra.de', 'Germany', true, true, true, true, true, true, false),
('Lloyd''s Register Deutschland GmbH', 1936, 'Überseering 10, 22297 Hamburg, Germany', '+49 40 36149-0', 'medical.devices@lr.org', 'https://www.lr.org', 'Germany', true, true, true, true, true, true, true),
('Intertek Deutschland GmbH', 1937, 'Stangenstraße 1, 70771 Leinfelden-Echterdingen, Germany', '+49 711 27311-0', 'medical.devices@intertek.com', 'https://www.intertek.com', 'Germany', true, true, true, true, true, true, false),
('SGS Deutschland GmbH', 1639, 'Unterriedstraße 1, 85435 Erding, Germany', '+49 8122 9854-0', 'medical.devices@sgs.com', 'https://www.sgs.com', 'Germany', true, true, true, true, true, true, true),
('Eurofins Medical Device Testing', 1305, 'Rue Pierre Adolphe Bobierre, 44323 Nantes, France', '+33 2 51 83 15 15', 'medical.devices@eurofins.com', 'https://www.eurofins.com', 'France', true, true, true, true, true, true, false),
('TECNOMED SRL', 1370, 'Via F. Delnevo 190, 43126 Parma, Italy', '+39 0521 648811', 'info@tecnomed.eu', 'https://www.tecnomed.eu', 'Italy', true, true, true, true, true, true, true),
('GMED', 1011, '12 Rue Marceau, 92130 Issy-les-Moulineaux, France', '+33 1 41 46 04 04', 'contact@gmed.fr', 'https://www.gmed.fr', 'France', true, true, true, true, true, true, false),
('MEDCERT', 1938, 'Nürnberger Straße 10, 91052 Erlangen, Germany', '+49 9131 7678-0', 'info@medcert.de', 'https://www.medcert.de', 'Germany', true, true, true, true, true, true, true),
('DNV Business Assurance Italy S.r.l.', 1371, 'Via Energy Park, 14, 20871 Vimercate, Italy', '+39 039 682 78 1', 'medical.devices@dnv.com', 'https://www.dnv.com', 'Italy', true, true, true, true, true, true, false),
('TÜV Rheinland LGA Products GmbH', 1939, 'Tillystraße 2, 90431 Nürnberg, Germany', '+49 911 655-0', 'medical.devices@tuv.com', 'https://www.tuv.com', 'Germany', true, true, true, true, true, true, true),
('IMQ S.p.A.', 1372, 'Via Quintiliano 43, 20138 Milano, Italy', '+39 02 30073.1', 'medical.devices@imq.it', 'https://www.imq.it', 'Italy', true, true, true, true, true, true, false),
('AENOR', 1306, 'Calle Génova, 6, 28004 Madrid, Spain', '+34 914 326 000', 'medical.devices@aenor.com', 'https://www.aenor.com', 'Spain', true, true, true, true, true, true, true),
('BSI Group Nederland B.V.', 2798, 'Say Building, John M. Keynesplein 9, 1066 EP Amsterdam, Netherlands', '+31 20 346 0780', 'medical.devices@bsigroup.com', 'https://www.bsigroup.com', 'Netherlands', true, true, true, true, true, true, false),
('NSAI', 1307, '1 Swift Square, Northwood, Santry, Dublin 9, Ireland', '+353 1 807 3800', 'medical.devices@nsai.ie', 'https://www.nsai.ie', 'Ireland', true, true, true, true, true, true, true),
('KIWA CERMET ITALIA S.p.A.', 1373, 'Via Cadriano 23, 40057 Granarolo dell''Emilia, Italy', '+39 051 764 3711', 'medical.devices@kiwa.com', 'https://www.kiwa.com', 'Italy', true, true, true, true, true, true, false),
('ECS European Certification Services GmbH', 1940, 'Hugenottenallee 173, 63263 Neu-Isenburg, Germany', '+49 6102 8149-0', 'medical.devices@ecs-cert.com', 'https://www.ecs-cert.com', 'Germany', true, true, true, true, true, true, true),
('CESI S.p.A.', 1374, 'Via Rubattino 54, 20134 Milano, Italy', '+39 02 21251', 'medical.devices@cesi.it', 'https://www.cesi.it', 'Italy', true, true, true, true, true, true, false),
('APAVE SUDEUROPE SAS', 1308, '8 rue Jean-Jacques Vernazza, 69800 Saint-Priest, France', '+33 4 72 78 20 20', 'medical.devices@apave.com', 'https://www.apave.com', 'France', true, true, true, true, true, true, true),
('BUREAU VERITAS MEDICAL', 1309, '92066 Paris La Défense Cedex, France', '+33 1 41 97 00 00', 'medical.devices@bureauveritas.com', 'https://www.bureauveritas.com', 'France', true, true, true, true, true, true, false),
('CTC Advanced GmbH & Co. KG', 1941, 'Am TÜV 1, 45307 Essen, Germany', '+49 201 825-0', 'medical.devices@ctc-advanced.com', 'https://www.ctc-advanced.com', 'Germany', true, true, true, true, true, true, true),
('Quality Austria', 1310, 'Zelinkagasse 10/3, 1010 Wien, Austria', '+43 1 274 87 47', 'medical.devices@qualityaustria.com', 'https://www.qualityaustria.com', 'Austria', true, true, true, true, true, true, false),
('TÜV AUSTRIA SERVICES GMBH', 1311, 'Deutschstraße 10, 1230 Wien, Austria', '+43 1 617 50 13', 'medical.devices@tuv.at', 'https://www.tuv.at', 'Austria', true, true, true, true, true, true, true),
('Finnish Safety and Chemicals Agency (Tukes)', 2489, 'Opastinsilta 12 B, 00521 Helsinki, Finland', '+358 29 5052 000', 'medical.devices@tukes.fi', 'https://www.tukes.fi', 'Finland', true, true, true, true, true, true, false),
('RISE Research Institutes of Sweden AB', 1876, 'Box 857, 501 15 Borås, Sweden', '+46 10 516 50 00', 'medical.devices@ri.se', 'https://www.ri.se', 'Sweden', true, true, true, true, true, true, true),
('Danish Safety Technology Authority', 1375, 'Tjærebyvej 4, 2630 Taastrup, Denmark', '+45 72 28 18 00', 'medical.devices@sik.dk', 'https://www.sik.dk', 'Denmark', true, true, true, true, true, true, false),
('CQS Prüf GmbH', 1942, 'August-Schanz-Straße 21, 60433 Frankfurt am Main, Germany', '+49 69 95427-0', 'medical.devices@cqs.de', 'https://www.cqs.de', 'Germany', true, true, true, true, true, true, true),
('UL International Deutschland GmbH', 1943, 'Bleichstraße 77, 60313 Frankfurt am Main, Germany', '+49 69 75308-0', 'medical.devices@ul.com', 'https://www.ul.com', 'Germany', true, true, true, true, true, true, false),
('Presafe AS', 2470, 'Strandveien 50, 1366 Lysaker, Norway', '+47 67 51 28 00', 'medical.devices@presafe.no', 'https://www.presafe.no', 'Norway', true, true, true, true, true, true, true),
('SGS Fimko Oy', 2490, 'Takomotie 8, 00380 Helsinki, Finland', '+358 10 696 4000', 'medical.devices@sgs.com', 'https://www.sgs.com', 'Finland', true, true, true, true, true, true, false),
('Czech Metrology Institute', 1376, 'Okružní 31, 638 00 Brno, Czech Republic', '+420 545 555 111', 'medical.devices@cmi.cz', 'https://www.cmi.cz', 'Czech Republic', true, true, true, true, true, true, true),
('Hungarian Trade Licensing Office', 1377, 'Nagyvárad tér 10-12, 1089 Budapest, Hungary', '+36 1 459 4800', 'medical.devices@mkeh.gov.hu', 'https://www.mkeh.gov.hu', 'Hungary', true, true, true, true, true, true, false),
('PCBC Polska', 1378, 'ul. Jagielońska 78, 03-301 Warszawa, Poland', '+48 22 777 99 00', 'medical.devices@pcbc.gov.pl', 'https://www.pcbc.gov.pl', 'Poland', true, true, true, true, true, true, true),
('DEKRA Slovensko s.r.o.', 1379, 'Lamačská cesta 8, 841 04 Bratislava, Slovakia', '+421 2 6430 6111', 'medical.devices@dekra.sk', 'https://www.dekra.sk', 'Slovakia', true, true, true, true, true, true, false),
('INSPECTA SERTIFIOINTI OY', 2491, 'Sörnäistenkatu 2, 00580 Helsinki, Finland', '+358 10 521 600', 'medical.devices@inspecta.com', 'https://www.inspecta.com', 'Finland', true, true, true, true, true, true, true),
('Estonian Centre for Standardisation', 1380, 'Aru 10, 10317 Tallinn, Estonia', '+372 605 5050', 'medical.devices@evs.ee', 'https://www.evs.ee', 'Estonia', true, true, true, true, true, true, false),
('Latvian National Accreditation Bureau', 1381, 'Lāčplēša iela 87, LV-1011 Rīga, Latvia', '+371 67 032 200', 'medical.devices@latak.lv', 'https://www.latak.lv', 'Latvia', true, true, true, true, true, true, true),
('Lithuanian Accreditation Bureau', 1382, 'A. Juozapavičiaus g. 9, LT-09311 Vilnius, Lithuania', '+370 5 278 1982', 'medical.devices@akredituota.lt', 'https://www.akredituota.lt', 'Lithuania', true, true, true, true, true, true, false),
('FORCE Technology', 1383, 'Park Allé 345, 2605 Brøndby, Denmark', '+45 43 26 77 77', 'medical.devices@force.dk', 'https://www.force.dk', 'Denmark', true, true, true, true, true, true, true),
('SP Technical Research Institute of Sweden', 1877, 'Box 857, 501 15 Borås, Sweden', '+46 10 516 50 00', 'medical.devices@sp.se', 'https://www.sp.se', 'Sweden', true, true, true, true, true, true, false),
('NEMKO AS', 2471, 'Gaustadalléen 30, 0373 Oslo, Norway', '+47 22 96 03 30', 'medical.devices@nemko.com', 'https://www.nemko.com', 'Norway', true, true, true, true, true, true, true),
('ITC-CNR', 1384, 'Via Pietro Giuria 7, 10125 Torino, Italy', '+39 011 3977 111', 'medical.devices@itc.cnr.it', 'https://www.itc.cnr.it', 'Italy', true, true, true, true, true, true, false),
('Croatian Standards Institute', 1385, 'Ulica grada Vukovara 78, 10000 Zagreb, Croatia', '+385 1 610 8555', 'medical.devices@hzn.hr', 'https://www.hzn.hr', 'Croatia', true, true, true, true, true, true, true),
('Slovenian Institute for Standardization', 1386, 'Šmartinska cesta 152, 1000 Ljubljana, Slovenia', '+386 1 478 30 40', 'medical.devices@sist.si', 'https://www.sist.si', 'Slovenia', true, true, true, true, true, true, false),
('Bulgarian Institute for Standardization', 1387, 'Ul. Dimitar Polyanov 13, 1606 Sofia, Bulgaria', '+359 2 873 55 17', 'medical.devices@bds-bg.org', 'https://www.bds-bg.org', 'Bulgaria', true, true, true, true, true, true, true),
('Romanian Standards Association', 1388, 'Str. Jean-Louis Calderon Nr. 13, 020323 Bucharest, Romania', '+40 21 316 03 24', 'medical.devices@asro.ro', 'https://www.asro.ro', 'Romania', true, true, true, true, true, true, false),
('Cyprus Organisation for Standardisation', 1389, 'CY-1683 Nicosia, Cyprus', '+357 22 420 120', 'medical.devices@cys.org.cy', 'https://www.cys.org.cy', 'Cyprus', true, true, true, true, true, true, true),
('Malta Standards Authority', 1390, 'Evans Building, Merchants Street, Valletta VLT 1171, Malta', '+356 21 242 420', 'medical.devices@msa.org.mt', 'https://www.msa.org.mt', 'Malta', true, true, true, true, true, true, false),
('Hellenic Organisation for Standardisation', 1391, 'Acharnon 313, 11145 Athens, Greece', '+30 210 212 0100', 'medical.devices@elot.gr', 'https://www.elot.gr', 'Greece', true, true, true, true, true, true, true),
('Portuguese Institute for Quality', 1312, 'Campus do Lumiar, Estrada do Paço do Lumiar, 1649-038 Lisboa, Portugal', '+351 213 509 240', 'medical.devices@ipq.pt', 'https://www.ipq.pt', 'Portugal', true, true, true, true, true, true, false),
('LUXCONTROL S.A.', 1313, '1, avenue des Terres Rouges, L-4017 Esch-sur-Alzette, Luxembourg', '+352 54 17 17 1', 'medical.devices@luxcontrol.com', 'https://www.luxcontrol.com', 'Luxembourg', true, true, true, true, true, true, true),
('Belgian Federal Public Service Economy', 1314, 'North Gate III, Koning Albert II-laan 16, 1000 Brussels, Belgium', '+32 2 277 51 11', 'medical.devices@economie.fgov.be', 'https://www.economie.fgov.be', 'Belgium', true, true, true, true, true, true, false),
('AFNOR Certification', 1315, '11 rue Francis de Pressensé, 93571 La Plaine Saint-Denis Cedex, France', '+33 1 41 62 80 00', 'medical.devices@afnor.org', 'https://www.afnor.org', 'France', true, true, true, true, true, true, true),
('British Standards Institution', 1316, '389 Chiswick High Road, London W4 4AL, United Kingdom', '+44 20 8996 9001', 'medical.devices@bsigroup.com', 'https://www.bsigroup.com', 'United Kingdom', true, true, true, true, true, true, false);

-- Create trigger to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_notified_bodies_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_notified_bodies_updated_at
    BEFORE UPDATE ON public.notified_bodies
    FOR EACH ROW
    EXECUTE FUNCTION update_notified_bodies_updated_at();
