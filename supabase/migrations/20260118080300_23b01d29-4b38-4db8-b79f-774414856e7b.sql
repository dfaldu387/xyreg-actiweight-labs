-- Insert missing Notified Bodies with address field included
INSERT INTO public.notified_bodies (name, nb_number, country, address, contact_number, email, scope_mdr, scope_ivdr, scope_medical_software, scope_sterilization_methods, scope_high_risk_active_implantables, scope_high_risk_implants_non_active, scope_drug_device_combinations, data_source)
VALUES 
  ('Malta Conformity Assessment (MCA)', 3132, 'Malta', 'Malta', '+356 2138 0875', 'info@maltaca.com', true, false, true, true, false, false, false, 'manual_entry'),
  ('NOTICE d.o.o.', 3121, 'Slovenia', 'Slovenia', '+386 1 234 5678', 'info@notice.si', true, false, false, true, false, false, false, 'manual_entry'),
  ('HTCert', 2806, 'Cyprus', 'Cyprus', '+357 22 00 00 00', 'info@htcert.com', true, false, false, false, true, true, false, 'manual_entry'),
  ('IRCM (Masini)', 68, 'Italy', 'Italy', '+39 0331 563111', 'info@masini.it', true, false, false, false, false, true, false, 'manual_entry'),
  ('TÜV Thüringen', 90, 'Germany', 'Germany', '+49 3641 39-0', 'info@tuev-thueringen.de', true, false, false, false, false, false, false, 'manual_entry'),
  ('AFNOR Certification', 333, 'France', 'France', '+33 1 41 62 80 00', 'certification@afnor.org', true, false, false, false, false, false, false, 'manual_entry'),
  ('SGS France', 364, 'France', 'France', '+33 1 41 24 88 88', 'fr.medical@sgs.com', true, false, false, false, false, false, false, 'manual_entry'),
  ('LGAI (Applus+)', 370, 'Spain', 'Spain', '+34 93 567 20 00', 'info@applus.com', true, false, false, true, false, false, false, 'manual_entry'),
  ('RISE', 402, 'Sweden', 'Sweden', '+46 10 516 50 00', 'info@ri.se', true, false, false, false, false, false, false, 'manual_entry'),
  ('Centexbel', 493, 'Belgium', 'Belgium', '+32 9 220 41 51', 'info@centexbel.be', true, false, false, true, false, false, false, 'manual_entry'),
  ('Neoemki', 1011, 'Hungary', 'Hungary', '+36 1 210 92 63', 'info@neoemki.hu', true, false, false, false, false, false, false, 'manual_entry'),
  ('EZU', 1014, 'Czech Republic', 'Czech Republic', '+420 266 104 111', 'info@ezu.cz', true, false, false, false, false, false, false, 'manual_entry'),
  ('SZU', 1015, 'Czech Republic', 'Czech Republic', '+420 541 120 111', 'szu@szutest.cz', true, false, false, false, false, false, false, 'manual_entry'),
  ('EVPU a.s.', 1293, 'Slovakia', 'Slovakia', '+421 42 440 3111', 'evpu@evpu.sk', true, false, false, false, false, false, false, 'manual_entry'),
  ('Eurofins ATS', 2351, 'France', 'France', '+33 4 42 39 80 00', 'ats@eurofins.com', true, false, false, true, false, false, false, 'manual_entry'),
  ('TÜV SÜD Denmark', 2443, 'Denmark', 'Denmark', '+45 31 10 30 10', 'info.dk@tuvsud.com', true, false, false, false, false, false, false, 'manual_entry'),
  ('CeCert Sp. z o.o.', 2934, 'Poland', 'Poland', '+48 22 243 45 45', 'biuro@cecert.pl', true, true, false, false, false, false, false, 'manual_entry')
ON CONFLICT (nb_number) DO UPDATE SET
  name = EXCLUDED.name,
  country = EXCLUDED.country,
  contact_number = EXCLUDED.contact_number,
  email = EXCLUDED.email,
  scope_mdr = EXCLUDED.scope_mdr,
  scope_ivdr = EXCLUDED.scope_ivdr,
  scope_medical_software = EXCLUDED.scope_medical_software,
  scope_sterilization_methods = EXCLUDED.scope_sterilization_methods,
  scope_high_risk_active_implantables = EXCLUDED.scope_high_risk_active_implantables,
  scope_high_risk_implants_non_active = EXCLUDED.scope_high_risk_implants_non_active;

-- Update existing Notified Bodies with corrected contact info and scope flags
UPDATE public.notified_bodies SET contact_number = '+49 89 5008-0', email = 'medical_devices@tuvsud.com', scope_ivdr = true, scope_high_risk_active_implantables = true, scope_high_risk_implants_non_active = true WHERE nb_number = 123;
UPDATE public.notified_bodies SET contact_number = '+31 20 346 0780', email = 'medicaldevices@bsigroup.com' WHERE nb_number = 2797;
UPDATE public.notified_bodies SET contact_number = '+49 221 806-0', email = 'medical@tuv.com', scope_medical_software = true WHERE nb_number = 197;
UPDATE public.notified_bodies SET contact_number = '+31 88 968 3000', email = 'medtech@dekra.com', scope_ivdr = true WHERE nb_number = 344;
UPDATE public.notified_bodies SET contact_number = '+33 1 40 43 37 00', email = 'info@lne-gmed.com', scope_high_risk_active_implantables = true, scope_drug_device_combinations = true WHERE nb_number = 459;
UPDATE public.notified_bodies SET contact_number = '+47 67 57 99 00', email = 'medical@dnv.com', scope_medical_software = true WHERE nb_number = 2460;
UPDATE public.notified_bodies SET contact_number = '+353 1 807 3800', email = 'medical.devices@nsai.ie', scope_sterilization_methods = true WHERE nb_number = 50;
UPDATE public.notified_bodies SET contact_number = '+32 3 545 44 00', email = 'clinical@sgs.com', scope_sterilization_methods = true WHERE nb_number = 1639;
UPDATE public.notified_bodies SET contact_number = '+49 69 95427-0', email = 'notified.body@dqs-med.de' WHERE nb_number = 297;
UPDATE public.notified_bodies SET contact_number = '+49 711 253597-0', email = 'mdc@mdc-ce.de', scope_ivdr = true WHERE nb_number = 483;
UPDATE public.notified_bodies SET contact_number = '+49 201 825-0', email = 'medical@tuev-nord.de', scope_high_risk_active_implantables = true WHERE nb_number = 44;
UPDATE public.notified_bodies SET contact_number = '+39 02 50731', email = 'info@imq.it', scope_medical_software = true WHERE nb_number = 51;
UPDATE public.notified_bodies SET contact_number = '+39 051 676 1511', email = 'info@kiwacermet.it', scope_sterilization_methods = true WHERE nb_number = 476;
UPDATE public.notified_bodies SET contact_number = '+358 40 031 6000', email = 'info.fi@eurofins.com', scope_medical_software = true WHERE nb_number = 537;
UPDATE public.notified_bodies SET contact_number = '+46 8 750 00 00', email = 'medtech@intertek.com' WHERE nb_number = 2862;
UPDATE public.notified_bodies SET contact_number = '+421 2 5443 1395', email = 'info@3ec.sk', scope_ivdr = true, scope_sterilization_methods = true WHERE nb_number = 2265;
UPDATE public.notified_bodies SET contact_number = '+420 577 601 211', email = 'itc@itczlin.cz' WHERE nb_number = 1023;
UPDATE public.notified_bodies SET contact_number = '+30 210 964 9456', email = 'info@ekapty.gr' WHERE nb_number = 653;
UPDATE public.notified_bodies SET contact_number = '+39 02 270911', email = 'info@it.bureauveritas.com' WHERE nb_number = 1370;
UPDATE public.notified_bodies SET contact_number = '+39 02 660691', email = 'certiquality@certiquality.it' WHERE nb_number = 546;
UPDATE public.notified_bodies SET contact_number = '+39 02 66104876', email = 'info@italcert.it' WHERE nb_number = 426;
UPDATE public.notified_bodies SET contact_number = '+34 91 822 20 00', email = 'sgps@aemps.es', scope_high_risk_active_implantables = true, scope_high_risk_implants_non_active = true WHERE nb_number = 318;
UPDATE public.notified_bodies SET contact_number = '+43 5 0454-0', email = 'office@tuv.at' WHERE nb_number = 408;
UPDATE public.notified_bodies SET contact_number = '+386 1 4778 100', email = 'info@siq.si' WHERE nb_number = 1304;
UPDATE public.notified_bodies SET contact_number = '+48 22 464 52 00', email = 'pcbc@pcbc.gov.pl', scope_ivdr = true, scope_sterilization_methods = true WHERE nb_number = 1434;
UPDATE public.notified_bodies SET contact_number = '+39 02 2369 911', email = 'info@eurofins.it' WHERE nb_number = 477;
UPDATE public.notified_bodies SET contact_number = '+49 40 226 3325-0', email = 'info@medcert.de', scope_high_risk_active_implantables = true WHERE nb_number = 482;
UPDATE public.notified_bodies SET contact_number = '+49 30 314 25111', email = 'info@berlincert.de' WHERE nb_number = 633;
UPDATE public.notified_bodies SET contact_number = '+36 1 210 92 63', email = 'info@cecertiso.hu' WHERE nb_number = 2409;
UPDATE public.notified_bodies SET contact_number = '+39 06 49901', email = 'notificati.mdr@iss.it' WHERE nb_number = 373;
UPDATE public.notified_bodies SET contact_number = '+358 9 696 361', email = 'sgs.fimko@sgs.com', scope_ivdr = true WHERE nb_number = 598;
UPDATE public.notified_bodies SET contact_number = '+49 711 7861-0', email = 'medical@dekra.com', scope_high_risk_active_implantables = true WHERE nb_number = 124;
UPDATE public.notified_bodies SET contact_number = '+47 22 96 03 30', email = 'info@nemko.com' WHERE nb_number = 470;
UPDATE public.notified_bodies SET contact_number = '+39 02 939 681', email = 'info@it.tuv.com', scope_medical_software = true WHERE nb_number = 1936;
UPDATE public.notified_bodies SET contact_number = '+385 1 483 1111', email = 'info@udem.hr' WHERE nb_number = 2696;