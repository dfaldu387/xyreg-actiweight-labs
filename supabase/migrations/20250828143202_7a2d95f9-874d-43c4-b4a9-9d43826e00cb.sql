-- Direct import of first 10 MDR Annex I requirements using correct column structure
-- First, clear existing items for this template
DELETE FROM gap_template_items WHERE template_id = '8b1ac5c4-28f0-4a5d-97ff-6bd093565e75';

-- Insert 10 sample comprehensive MDR Annex I requirements using correct column names
INSERT INTO gap_template_items (
  template_id,
  item_number,
  clause_reference,
  requirement_text,
  guidance_text,
  category,
  priority,
  question_number,
  clause_number,
  clause_description,
  sort_order
) VALUES 
('8b1ac5c4-28f0-4a5d-97ff-6bd093565e75', 'GSPR-1.1', 'GSPR 1', 'GSPR 1 - Devices shall achieve the performance intended by their manufacturer and shall be designed and manufactured in such a way that, during normal conditions of use, they are suitable for their intended purpose', 'Device achieves intended performance as specified by manufacturer', 'verification', 'high', '1', 'GSPR 1', 'General performance and safety requirements for medical devices', 1),
('8b1ac5c4-28f0-4a5d-97ff-6bd093565e75', 'GSPR-1.2', 'GSPR 1', 'GSPR 1 - Devices shall achieve the performance intended by their manufacturer and shall be designed and manufactured in such a way that, during normal conditions of use, they are suitable for their intended purpose', 'Device is suitable for intended purpose under normal conditions of use', 'verification', 'high', '2', 'GSPR 1', 'General performance and safety requirements for medical devices', 2),
('8b1ac5c4-28f0-4a5d-97ff-6bd093565e75', 'GSPR-1.3', 'GSPR 1', 'GSPR 1 - Devices shall achieve the performance intended by their manufacturer and shall be designed and manufactured in such a way that, during normal conditions of use, they are suitable for their intended purpose', 'Design and manufacturing processes ensure consistent performance', 'documentation', 'high', '3', 'GSPR 1', 'General performance and safety requirements for medical devices', 3),
('8b1ac5c4-28f0-4a5d-97ff-6bd093565e75', 'GSPR-2.1', 'GSPR 2', 'GSPR 2 - The devices shall be designed and manufactured in such a way that they do not compromise the clinical condition or the safety of patients, or the safety and health of users or, where applicable, other persons', 'Design ensures patient clinical condition is not compromised', 'verification', 'high', '4', 'GSPR 2', 'Safety requirements for patients, users and other persons', 4),
('8b1ac5c4-28f0-4a5d-97ff-6bd093565e75', 'GSPR-2.2', 'GSPR 2', 'GSPR 2 - The devices shall be designed and manufactured in such a way that they do not compromise the clinical condition or the safety of patients, or the safety and health of users or, where applicable, other persons', 'Device does not compromise patient safety', 'verification', 'high', '5', 'GSPR 2', 'Safety requirements for patients, users and other persons', 5),
('8b1ac5c4-28f0-4a5d-97ff-6bd093565e75', 'GSPR-2.3', 'GSPR 2', 'GSPR 2 - The devices shall be designed and manufactured in such a way that they do not compromise the clinical condition or the safety of patients, or the safety and health of users or, where applicable, other persons', 'User safety and health protection measures implemented', 'verification', 'high', '6', 'GSPR 2', 'Safety requirements for patients, users and other persons', 6),
('8b1ac5c4-28f0-4a5d-97ff-6bd093565e75', 'GSPR-2.4', 'GSPR 2', 'GSPR 2 - The devices shall be designed and manufactured in such a way that they do not compromise the clinical condition or the safety of patients, or the safety and health of users or, where applicable, other persons', 'Third party safety considerations addressed where applicable', 'verification', 'high', '7', 'GSPR 2', 'Safety requirements for patients, users and other persons', 7),
('8b1ac5c4-28f0-4a5d-97ff-6bd093565e75', 'GSPR-3.1', 'GSPR 3', 'GSPR 3 - The devices shall achieve the performance intended by their manufacturer and shall be designed and manufactured in such a way that the risks which may be associated with their use constitute an acceptable risk when weighed against the benefits to the patient', 'Risk-benefit analysis conducted and documented', 'documentation', 'high', '8', 'GSPR 3', 'Risk-benefit analysis requirements', 8),
('8b1ac5c4-28f0-4a5d-97ff-6bd093565e75', 'GSPR-3.2', 'GSPR 3', 'GSPR 3 - The devices shall achieve the performance intended by their manufacturer and shall be designed and manufactured in such a way that the risks which may be associated with their use constitute an acceptable risk when weighed against the benefits to the patient', 'Risks constitute acceptable level when weighed against patient benefits', 'verification', 'high', '9', 'GSPR 3', 'Risk-benefit analysis requirements', 9),
('8b1ac5c4-28f0-4a5d-97ff-6bd093565e75', 'GSPR-3.3', 'GSPR 3', 'GSPR 3 - The devices shall achieve the performance intended by their manufacturer and shall be designed and manufactured in such a way that the risks which may be associated with their use constitute an acceptable risk when weighed against the benefits to the patient', 'Risk management process implemented throughout device lifecycle', 'compliance', 'high', '10', 'GSPR 3', 'Risk-benefit analysis requirements', 10);