-- Fix invalid category values in user_needs
UPDATE user_needs SET category = 'General' WHERE category = 'User Needs';
UPDATE user_needs SET category = 'General' WHERE category = 'Efficacy';
UPDATE user_needs SET category = 'General' WHERE category = 'Maintenance';
UPDATE user_needs SET category = 'General' WHERE category NOT IN ('General', 'Safety', 'Performance', 'Usability', 'Interface', 'Design', 'Regulatory', 'Genesis', 'Document Management', 'Supplier', 'Training');